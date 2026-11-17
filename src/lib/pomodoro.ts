// The Pomodoro timer's logic, as pure functions: no React, no browser, no clock of its own.
// The timer component (src/components/study/pomodoro-timer.tsx) only calls these and shows
// the result, so every rule here can be tested in milliseconds.
//
// The method: focus for one round, then a short break. After the 4th focus round, a long break.
import { z } from "zod";

export type Mode = "focus" | "short" | "long";
export const ROUNDS_PER_CYCLE = 4;

export const MODE_LABELS: Record<Mode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

// ---------------------------------------------------------------------------------------------
// Settings (the "Timer settings" dialog). Saved in the browser (localStorage), per user.

/** The limits match the dialog, and focus also matches the database CHECK (1–90 minutes). */
export const settingsSchema = z.object({
  focus: z.number().int().min(1).max(90),
  short: z.number().int().min(1).max(30),
  long: z.number().int().min(1).max(60),
  goal: z.number().int().min(1).max(12),
  sound: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  focus: 25,
  short: 5,
  long: 15,
  goal: 4,
  sound: true,
};

/** How long a mode lasts, in minutes. */
export function lengthOf(mode: Mode, settings: Settings): number {
  return settings[mode];
}

// ---------------------------------------------------------------------------------------------
// Timer state. Also saved in localStorage, so a reload keeps "Round 2 of 4" and a running clock.
//
// The key idea: while running we store WHEN it ends (endsAt, a timestamp), not "seconds left".
// Browsers slow down timers in background tabs, so counting "−1 every second" drifts.
// "endsAt − now" is always right, however late the next tick comes.

export const timerSchema = z.object({
  mode: z.enum(["focus", "short", "long"]),
  /** Which focus round of the cycle we are in: 1 to 4. */
  round: z.number().int().min(1).max(ROUNDS_PER_CYCLE),
  /** Running: when it ends (milliseconds since 1970). null = not running. */
  endsAt: z.number().nullable(),
  /** Paused: the seconds that were left. null = not paused. */
  pausedSeconds: z.number().int().min(0).nullable(),
  /** The round's length, fixed when it starts (so changing the settings mid-round changes nothing). */
  minutes: z.number().int().min(1).max(90).nullable(),
});
export type TimerState = z.infer<typeof timerSchema>;

export const IDLE_TIMER: TimerState = {
  mode: "focus",
  round: 1,
  endsAt: null,
  pausedSeconds: null,
  minutes: null,
};

export type Status = "idle" | "running" | "paused";

export function statusOf(timer: TimerState): Status {
  if (timer.endsAt !== null) return "running";
  if (timer.pausedSeconds !== null) return "paused";
  return "idle";
}

/** Whole seconds left. Rounded up, so the display shows 00:01 until the very end. */
export function secondsLeft(
  timer: TimerState,
  settings: Settings,
  now: number,
): number {
  if (timer.endsAt !== null) {
    return Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
  }
  if (timer.pausedSeconds !== null) return timer.pausedSeconds;
  return lengthOf(timer.mode, settings) * 60;
}

/** Start (or resume) the clock. */
export function start(
  timer: TimerState,
  settings: Settings,
  now: number,
): TimerState {
  const seconds = secondsLeft(timer, settings, now);
  return {
    ...timer,
    endsAt: now + seconds * 1000,
    pausedSeconds: null,
    minutes: timer.minutes ?? lengthOf(timer.mode, settings),
  };
}

export function pause(
  timer: TimerState,
  settings: Settings,
  now: number,
): TimerState {
  return {
    ...timer,
    endsAt: null,
    pausedSeconds: secondsLeft(timer, settings, now),
  };
}

/** Back to the start of the same mode and round, stopped. */
export function reset(timer: TimerState): TimerState {
  return { ...timer, endsAt: null, pausedSeconds: null, minutes: null };
}

/** Choose a mode with the tabs: stopped, same round. */
export function pickMode(timer: TimerState, mode: Mode): TimerState {
  return { ...reset(timer), mode };
}

/**
 * What comes after this mode:
 * focus (rounds 1–3) → short break, focus (round 4) → long break,
 * short break → the next focus round, long break → focus round 1 (a new cycle).
 */
export function nextStep(
  mode: Mode,
  round: number,
): { mode: Mode; round: number } {
  if (mode === "focus") {
    return { mode: round >= ROUNDS_PER_CYCLE ? "long" : "short", round };
  }
  if (mode === "short") {
    return { mode: "focus", round: Math.min(round + 1, ROUNDS_PER_CYCLE) };
  }
  return { mode: "focus", round: 1 };
}

/** The next mode, stopped. Used when a round ends, and by the Skip button (Skip never saves). */
export function advance(timer: TimerState): TimerState {
  return { ...IDLE_TIMER, ...nextStep(timer.mode, timer.round) };
}

// ---------------------------------------------------------------------------------------------
// Display

/**
 * Seconds as a clock: 1500 → "25:00", 65 → "01:05", 0 → "00:00".
 */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
