// What the timer keeps in the browser (localStorage), and under which names.
//
// Every key includes the user's id. localStorage belongs to the BROWSER, not to a person:
// if two people share a laptop, Lan must never see (or save!) Trung's unsaved rounds.
import { z } from "zod";

import { TOPIC_MAX } from "@/lib/validation/study";

export function storageKeys(userId: number) {
  const prefix = `study-blog:user-${userId}`;
  return {
    timer: `${prefix}:timer`,
    settings: `${prefix}:settings`,
    topic: `${prefix}:topic`,
    unsaved: `${prefix}:unsaved-rounds`,
  };
}

export const topicSchema = z.string().max(TOPIC_MAX);

/** A finished focus round that the server hasn't confirmed yet ("kept on this device"). */
export const unsavedSchema = z.array(
  z.object({
    id: z.string(),
    minutes: z.number().int().min(1).max(90),
    topic: z.string(),
  }),
);
export type UnsavedRound = z.infer<typeof unsavedSchema>[number];

export const NO_UNSAVED: UnsavedRound[] = [];
export const NO_TOPIC = "";
