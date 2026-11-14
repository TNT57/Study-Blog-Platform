// The study_sessions table (db/migrations/0004_create_study_sessions.sql) and its model.
import { describe, expect, it } from "vitest";

import { query } from "@/lib/db";
import {
  countRounds,
  createStudySession,
  minutesPerDay,
  minutesThisWeek,
  todayFor,
  topTopicsThisWeek,
  totalsOnDay,
} from "@/models/study-session.model";

import { expectDbError, makeUser } from "./helpers";

// A fixed "today" for the stats tests: Thursday 12 November 2026. Its week started on Monday the 9th.
const TODAY = "2026-11-12";

/** Inserts a finished round on a chosen day, so tests control the dates. */
async function addRound(
  userId: number,
  minutes: number,
  day: string,
  topic: string | null = null,
) {
  await query(
    `INSERT INTO study_sessions (user_id, duration_minutes, topic, local_date)
     VALUES ($1, $2, $3, $4)`,
    [userId, minutes, topic, day],
  );
}

/** "Today" in a time zone, asked from Postgres itself. */
async function todayIn(timeZone: string) {
  const [row] = await query<{ today: string }>(
    "SELECT (now() AT TIME ZONE $1)::date AS today",
    [timeZone],
  );
  return row.today;
}

describe("study_sessions table rules", () => {
  it.each([0, 91])("refuses a %i-minute round", async (minutes) => {
    const user = await makeUser();
    expect(await expectDbError(() => addRound(user.id, minutes, TODAY))).toBe(
      "23514",
    );
  });

  it.each(["", "   ", " SQL", "a".repeat(41)])(
    'refuses the topic "%s" (blank, spaces around it, or over 40 characters)',
    async (topic) => {
      const user = await makeUser();
      expect(
        await expectDbError(() => addRound(user.id, 25, TODAY, topic)),
      ).toBe("23514");
    },
  );

  it("accepts no topic at all (NULL)", async () => {
    const user = await makeUser();
    await addRound(user.id, 25, TODAY, null);
    expect(await countRounds(user.id)).toBe(1);
  });
});

describe("createStudySession", () => {
  it("lets the database set the time and the user's own day, from their time zone", async () => {
    // UTC+14 and UTC−11: these two places are never on the same calendar day.
    const early = await makeUser({ timeZone: "Pacific/Kiritimati" });
    const late = await makeUser({ timeZone: "Pacific/Pago_Pago" });

    const a = await createStudySession({
      userId: early.id,
      durationMinutes: 25,
      topic: "SQL joins",
    });
    const b = await createStudySession({
      userId: late.id,
      durationMinutes: 25,
      topic: null,
    });

    expect(a?.localDate).toBe(await todayIn("Pacific/Kiritimati"));
    expect(b?.localDate).toBe(await todayIn("Pacific/Pago_Pago"));
    expect(a?.localDate).not.toBe(b?.localDate);
    expect(a?.completedAt).toBeInstanceOf(Date);
    expect(a).toMatchObject({ durationMinutes: 25, topic: "SQL joins" });
  });

  it("returns null (and saves nothing) for a user who doesn't exist", async () => {
    expect(
      await createStudySession({
        userId: 999,
        durationMinutes: 25,
        topic: null,
      }),
    ).toBeNull();
  });
});

describe("todayFor", () => {
  it("gives the user's today in their time zone", async () => {
    const user = await makeUser({ timeZone: "Australia/Adelaide" });
    expect(await todayFor(user.id)).toBe(await todayIn("Australia/Adelaide"));
  });
});

describe("totalsOnDay (Task 2)", () => {
  it("adds up the minutes and counts the rounds of that day", async () => {
    const trung = await makeUser();
    await addRound(trung.id, 25, TODAY);
    await addRound(trung.id, 25, TODAY);
    await addRound(trung.id, 50, TODAY);

    expect(await totalsOnDay(trung.id, TODAY)).toEqual({
      minutes: 100,
      rounds: 3,
    });
  });

  it("ignores other days and other users", async () => {
    const trung = await makeUser();
    const lan = await makeUser();
    await addRound(trung.id, 25, TODAY);
    await addRound(trung.id, 25, "2026-11-11"); // yesterday
    await addRound(lan.id, 50, TODAY); // someone else

    expect(await totalsOnDay(trung.id, TODAY)).toEqual({
      minutes: 25,
      rounds: 1,
    });
  });

  it("gives zeros (numbers, not null) for a day without rounds", async () => {
    const trung = await makeUser();
    expect(await totalsOnDay(trung.id, TODAY)).toEqual({
      minutes: 0,
      rounds: 0,
    });
  });
});

describe("minutesPerDay", () => {
  it("gives the 7 days that end today, oldest first, with 0 for empty days", async () => {
    const trung = await makeUser();
    await addRound(trung.id, 25, "2026-11-05"); // 7 days ago: just too old
    await addRound(trung.id, 25, "2026-11-06");
    await addRound(trung.id, 25, "2026-11-06");
    await addRound(trung.id, 50, TODAY);

    expect(await minutesPerDay(trung.id, TODAY)).toEqual([
      { day: "2026-11-06", minutes: 50 },
      { day: "2026-11-07", minutes: 0 },
      { day: "2026-11-08", minutes: 0 },
      { day: "2026-11-09", minutes: 0 },
      { day: "2026-11-10", minutes: 0 },
      { day: "2026-11-11", minutes: 0 },
      { day: "2026-11-12", minutes: 50 },
    ]);
  });
});

describe("minutesThisWeek", () => {
  it("counts from Monday to today only", async () => {
    const trung = await makeUser();
    await addRound(trung.id, 25, "2026-11-08"); // Sunday: last week
    await addRound(trung.id, 25, "2026-11-09"); // Monday
    await addRound(trung.id, 50, TODAY); // Thursday
    await addRound(trung.id, 25, "2026-11-13"); // Friday: not yet

    expect(await minutesThisWeek(trung.id, TODAY)).toBe(75);
  });
});

describe("countRounds", () => {
  it("counts only this user's rounds", async () => {
    const trung = await makeUser();
    const lan = await makeUser();
    await addRound(trung.id, 25, TODAY);
    await addRound(trung.id, 25, "2026-01-01");
    await addRound(lan.id, 25, TODAY);

    expect(await countRounds(trung.id)).toBe(2);
  });
});

describe("topTopicsThisWeek", () => {
  it("groups topics ignoring upper/lower case, biggest first, this week only", async () => {
    const trung = await makeUser();
    await addRound(trung.id, 25, TODAY, "SQL joins");
    await addRound(trung.id, 50, "2026-11-10", "sql joins");
    await addRound(trung.id, 50, TODAY, "Big-O");
    await addRound(trung.id, 90, "2026-11-08", "Last week"); // Sunday: last week
    await addRound(trung.id, 25, TODAY, null); // no topic

    expect(await topTopicsThisWeek(trung.id, TODAY)).toEqual([
      { name: "SQL joins", minutes: 75 },
      { name: "Big-O", minutes: 50 },
    ]);
  });

  it("returns at most 5 topics", async () => {
    const trung = await makeUser();
    for (const topic of ["A", "B", "C", "D", "E", "F"]) {
      await addRound(trung.id, 25, TODAY, topic);
    }
    expect(await topTopicsThisWeek(trung.id, TODAY)).toHaveLength(5);
  });
});
