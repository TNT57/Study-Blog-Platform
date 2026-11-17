"use server";
// CONTROLLER (changes) for the study timer: a Server Action.
//
// Like every "use server" export, this is a PUBLIC endpoint. The timer calls it when a
// focus round ends, but anyone could call it with any value, so it checks everything itself.

import { refresh } from "next/cache";

import { studyRoundSchema } from "@/lib/validation/study";
import { createStudySession } from "@/models/study-session.model";

import { requireUser } from "./session";

export type SaveRoundResult =
  | { ok: true; minutes: number; topic: string | null }
  | { ok: false; error: string };

/**
 * Saves one finished focus round for the logged-in user.
 * The browser sends only { durationMinutes, topic }. WHO comes from the session cookie,
 * and WHEN (the time and the user's local day) from the database.
 */
export async function saveStudySession(
  input: unknown,
): Promise<SaveRoundResult> {
  const user = await requireUser("/study");

  const parsed = studyRoundSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "This round doesn’t look right, so it wasn’t saved.",
    };
  }

  const saved = await createStudySession({ userId: user.id, ...parsed.data });
  if (!saved) {
    return {
      ok: false,
      error: "Your account wasn’t found. Please log in again.",
    };
  }

  // The stats on the page are read per request: ask the browser to load them again.
  refresh();
  return { ok: true, minutes: saved.durationMinutes, topic: saved.topic };
}
