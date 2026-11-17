// The Pomodoro timer's rules (src/lib/pomodoro.ts). No browser and no real clock:
// we pass "now" ourselves, so a 25-minute round takes 0 seconds to test.
import { describe, expect, it } from "vitest";

import {
  advance,
  DEFAULT_SETTINGS,
  formatTime,
  IDLE_TIMER,
  nextStep,
  pause,
  pickMode,
  reset,
  secondsLeft,
  settingsSchema,
  start,
  statusOf,
  timerSchema,
} from "@/lib/pomodoro";

const settings = DEFAULT_SETTINGS; // 25 / 5 / 15 minutes
const NOW = 1_800_000_000_000; // any fixed moment, in milliseconds

describe("formatTime (Task 1)", () => {
  it.each([
    [1500, "25:00"],
    [65, "01:05"],
    [59, "00:59"],
    [0, "00:00"],
    [5400, "90:00"],
  ])("shows %i seconds as %s", (seconds, clock) => {
    expect(formatTime(seconds)).toBe(clock);
  });
});

describe("a round, step by step", () => {
  it("starts idle with the full focus time", () => {
    expect(statusOf(IDLE_TIMER)).toBe("idle");
    expect(secondsLeft(IDLE_TIMER, settings, NOW)).toBe(25 * 60);
  });

  it("counts down from the end time, however late the tick comes", () => {
    const running = start(IDLE_TIMER, settings, NOW);

    expect(statusOf(running)).toBe("running");
    expect(running.endsAt).toBe(NOW + 25 * 60 * 1000);
    expect(running.minutes).toBe(25);
    expect(secondsLeft(running, settings, NOW + 60_000)).toBe(24 * 60);
    // A background tab may wake up much later: still right, and never below 0.
    expect(secondsLeft(running, settings, NOW + 99 * 60_000)).toBe(0);
  });

  it("rounds up, so it shows 1 second until the very end", () => {
    const running = start(IDLE_TIMER, settings, NOW);
    expect(secondsLeft(running, settings, NOW + 25 * 60_000 - 200)).toBe(1);
  });

  it("pauses and resumes without losing time", () => {
    const running = start(IDLE_TIMER, settings, NOW);
    const paused = pause(running, settings, NOW + 10 * 60_000);

    expect(statusOf(paused)).toBe("paused");
    expect(secondsLeft(paused, settings, NOW + 99 * 60_000)).toBe(15 * 60);

    const later = NOW + 60 * 60_000;
    const resumed = start(paused, settings, later);
    expect(resumed.endsAt).toBe(later + 15 * 60_000);
    expect(resumed.minutes).toBe(25); // still a 25-minute round
  });

  it("keeps the round's length when the settings change mid-round", () => {
    const running = start(IDLE_TIMER, settings, NOW);
    const paused = pause(running, settings, NOW + 60_000);
    const resumed = start(paused, { ...settings, focus: 50 }, NOW + 120_000);
    expect(resumed.minutes).toBe(25);
  });

  it("resets to the full time of the same mode and round", () => {
    const running = start({ ...IDLE_TIMER, round: 3 }, settings, NOW);
    expect(reset(running)).toEqual({ ...IDLE_TIMER, round: 3 });
  });

  it("picks a mode with the tabs, stopped", () => {
    const running = start(IDLE_TIMER, settings, NOW);
    const picked = pickMode(running, "long");
    expect(statusOf(picked)).toBe("idle");
    expect(secondsLeft(picked, settings, NOW)).toBe(15 * 60);
  });
});

describe("nextStep", () => {
  it.each([
    ["focus", 1, "short", 1],
    ["short", 1, "focus", 2],
    ["focus", 3, "short", 3],
    ["focus", 4, "long", 4],
    ["long", 4, "focus", 1],
  ] as const)(
    "after %s (round %i) comes %s (round %i)",
    (mode, round, nextMode, nextRound) => {
      expect(nextStep(mode, round)).toEqual({
        mode: nextMode,
        round: nextRound,
      });
    },
  );

  it("advance() stops at the next mode (the Skip button does the same, without saving)", () => {
    const running = start({ ...IDLE_TIMER, round: 2 }, settings, NOW);
    expect(advance(running)).toEqual({
      ...IDLE_TIMER,
      mode: "short",
      round: 2,
    });
  });
});

describe("what we read back from localStorage", () => {
  it("accepts the defaults", () => {
    expect(settingsSchema.parse(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
    expect(timerSchema.parse(IDLE_TIMER)).toEqual(IDLE_TIMER);
  });

  it.each([
    { ...DEFAULT_SETTINGS, focus: 0 },
    { ...DEFAULT_SETTINGS, focus: 91 },
    { ...DEFAULT_SETTINGS, goal: 2.5 },
  ])("refuses settings outside the limits: %o", (bad) => {
    expect(settingsSchema.safeParse(bad).success).toBe(false);
  });

  it("refuses a broken timer (someone edited localStorage by hand)", () => {
    expect(timerSchema.safeParse({ ...IDLE_TIMER, round: 9 }).success).toBe(
      false,
    );
    expect(timerSchema.safeParse("hello").success).toBe(false);
  });
});
