"use client";
// "2 of 4 pomodoros (goal)". The 2 comes from the server (the database); the goal of 4 comes from
// this browser's timer settings (localStorage). So this small piece is a Client Component
// inside the server-rendered stats: a "client island".
import { DEFAULT_SETTINGS, settingsSchema } from "@/lib/pomodoro";

import { storageKeys } from "./timer-storage";
import { useStoredState } from "./use-stored-state";

export function GoalProgress({
  userId,
  rounds,
}: {
  userId: number;
  rounds: number;
}) {
  const [settings] = useStoredState(
    storageKeys(userId).settings,
    settingsSchema,
    DEFAULT_SETTINGS,
  );
  return (
    <>
      {rounds} of {settings.goal} pomodoros (goal)
    </>
  );
}
