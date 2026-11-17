// VALIDATION for a finished focus round, sent by the timer to saveStudySession().
// The browser sends only these two things. The server decides WHO (the session cookie)
// and WHEN (the database clock and the user's time zone).
import { z } from "zod";

export const TOPIC_MAX = 40;

export const studyRoundSchema = z.object({
  // The same limits as the database CHECK in db/migrations/0004_create_study_sessions.sql.
  durationMinutes: z.number().int().min(1).max(90),
  // Optional. Trimmed, and an empty topic is saved as NULL (no topic).
  topic: z
    .string()
    .trim()
    .max(TOPIC_MAX)
    .optional()
    .transform((topic) => topic || null),
});

export type StudyRoundInput = z.infer<typeof studyRoundSchema>;
