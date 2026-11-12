// The study timer's Server Action and the stats read, on a real database.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("./cookie-jar");
  return { cookies: () => cookieJar.cookies() };
});
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));

import { refresh } from "next/cache";

import { startSession } from "@/controllers/session";
import { saveStudySession } from "@/controllers/study.actions";
import { getStudyStats } from "@/controllers/study.queries";
import { query } from "@/lib/db";
import { countRounds, todayFor } from "@/models/study-session.model";

import { cookieJar } from "./cookie-jar";
import { makeUser } from "./helpers";

async function logIn(timeZone = "Australia/Adelaide") {
  const user = await makeUser({ timeZone });
  await startSession(user.id);
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.clear();
});

describe("saveStudySession", () => {
  it("saves the round for the logged-in user and refreshes the page", async () => {
    const user = await logIn();

    const result = await saveStudySession({
      durationMinutes: 25,
      topic: "  SQL joins ",
    });

    expect(result).toEqual({ ok: true, minutes: 25, topic: "SQL joins" });
    expect(await countRounds(user.id)).toBe(1);
    expect(refresh).toHaveBeenCalled();
  });

  it("uses the user's own day, never a date from the browser", async () => {
    const user = await logIn("Pacific/Kiritimati");

    // Extra fields are ignored: the browser can't choose the day or the user.
    await saveStudySession({
      durationMinutes: 25,
      localDate: "1999-01-01",
      userId: 999,
    });

    const [row] = await query<{ user_id: number; local_date: string }>(
      "SELECT user_id, local_date FROM study_sessions",
    );
    expect(row).toEqual({
      user_id: user.id,
      local_date: await todayFor(user.id),
    });
  });

  it.each([
    { durationMinutes: 0 },
    { durationMinutes: 600 },
    { durationMinutes: "25" },
    { durationMinutes: 25, topic: "a".repeat(41) },
    "hello",
  ])("refuses %o and saves nothing", async (input) => {
    const user = await logIn();

    const result = await saveStudySession(input);

    expect(result.ok).toBe(false);
    expect(await countRounds(user.id)).toBe(0);
  });

  it("sends a visitor who isn't logged in to the login page", async () => {
    await expect(saveStudySession({ durationMinutes: 25 })).rejects.toThrow(
      "REDIRECT /login?next=%2Fstudy",
    );
  });
});

describe("getStudyStats", () => {
  it("gives a new user zeros and 7 empty days that end today", async () => {
    const user = await logIn();

    const stats = await getStudyStats(user.id);

    expect(stats.today).toEqual({ minutes: 0, rounds: 0 });
    expect(stats.weekMinutes).toBe(0);
    expect(stats.allTimeRounds).toBe(0);
    expect(stats.days).toHaveLength(7);
    expect(stats.days.at(-1)).toMatchObject({
      day: await todayFor(user.id),
      label: "Today",
      isToday: true,
      minutes: 0,
    });
    expect(stats.topics).toEqual([]);
  });

  it("shows a saved round everywhere", async () => {
    const user = await logIn();
    await saveStudySession({ durationMinutes: 25, topic: "Big-O" });

    const stats = await getStudyStats(user.id);

    expect(stats.allTimeRounds).toBe(1);
    expect(stats.weekMinutes).toBe(25);
    expect(stats.days.at(-1)?.minutes).toBe(25);
    expect(stats.topics).toEqual([{ name: "Big-O", minutes: 25 }]);
  });
});
