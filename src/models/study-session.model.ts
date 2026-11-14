// MODEL for study sessions (finished Pomodoro focus rounds): the only place with SQL for this table.
//
// Dates: `local_date` is a Postgres DATE, which our pg setup keeps as text ("2026-11-12"),
// so a day can never shift because of the server's time zone (see src/lib/db.ts).
import { query } from "@/lib/db";

export type StudySession = {
  id: number;
  userId: number;
  durationMinutes: number;
  topic: string | null;
  completedAt: Date;
  /** The user's own calendar day when it finished, like "2026-11-12". */
  localDate: string;
};

type StudySessionRow = {
  id: number;
  user_id: number;
  duration_minutes: number;
  topic: string | null;
  completed_at: Date;
  local_date: string;
};

function toStudySession(row: StudySessionRow): StudySession {
  return {
    id: row.id,
    userId: row.user_id,
    durationMinutes: row.duration_minutes,
    topic: row.topic,
    completedAt: row.completed_at,
    localDate: row.local_date,
  };
}

export type NewStudySession = {
  userId: number;
  durationMinutes: number;
  topic: string | null;
};

/**
 * Saves one finished focus round. The DATABASE decides when it happened:
 * completed_at = now(), and local_date = "today" in the user's own time zone.
 * Returns null if the user doesn't exist.
 */
export async function createStudySession(
  input: NewStudySession,
): Promise<StudySession | null> {
  const rows = await query<StudySessionRow>(
    `INSERT INTO study_sessions (user_id, duration_minutes, topic, local_date)
     SELECT id, $2, $3, (now() AT TIME ZONE time_zone)::date
     FROM users
     WHERE id = $1
     RETURNING id, user_id, duration_minutes, topic, completed_at, local_date`,
    [input.userId, input.durationMinutes, input.topic],
  );
  return rows[0] ? toStudySession(rows[0]) : null;
}

/** The user's "today" ("2026-11-12") in their own time zone, by the database's clock. */
export async function todayFor(userId: number): Promise<string | null> {
  const rows = await query<{ today: string }>(
    "SELECT (now() AT TIME ZONE time_zone)::date AS today FROM users WHERE id = $1",
    [userId],
  );
  return rows[0]?.today ?? null;
}

export type DayTotals = { minutes: number; rounds: number };

/**
 * How many focus minutes and rounds this user finished on one day.
 * A day with no rounds is { minutes: 0, rounds: 0 }.
 *
 * TODO(you): Task 2 in docs/learn/05-pomodoro.md: write the SQL.
 */
export async function totalsOnDay(
  userId: number,
  day: string,
): Promise<DayTotals> {
  void userId; // you will need these in Task 2
  void day;
  return { minutes: 0, rounds: 0 };
}

/**
 * Focus minutes for each of the `days` days that end on `today`, oldest first.
 * generate_series makes one row per day, so days without any rounds still appear, with 0.
 */
export async function minutesPerDay(
  userId: number,
  today: string,
  days = 7,
): Promise<{ day: string; minutes: number }[]> {
  return query<{ day: string; minutes: number }>(
    `SELECT d::date AS day, COALESCE(SUM(s.duration_minutes), 0)::int AS minutes
     FROM generate_series($2::date - ($3::int - 1), $2::date, interval '1 day') AS d
     LEFT JOIN study_sessions s ON s.user_id = $1 AND s.local_date = d::date
     GROUP BY d
     ORDER BY d`,
    [userId, today, days],
  );
}

/** Focus minutes from Monday of `today`'s week up to `today` (weeks start on Monday). */
export async function minutesThisWeek(
  userId: number,
  today: string,
): Promise<number> {
  const rows = await query<{ minutes: number }>(
    `SELECT COALESCE(SUM(duration_minutes), 0)::int AS minutes
     FROM study_sessions
     WHERE user_id = $1
       AND local_date BETWEEN date_trunc('week', $2::timestamp)::date AND $2::date`,
    [userId, today],
  );
  return rows[0].minutes;
}

/** How many focus rounds this user has ever finished. */
export async function countRounds(userId: number): Promise<number> {
  const rows = await query<{ rounds: number }>(
    "SELECT COUNT(*)::int AS rounds FROM study_sessions WHERE user_id = $1",
    [userId],
  );
  return rows[0].rounds;
}

/**
 * The topics with the most minutes this week (Monday to `today`), biggest first.
 * Upper/lower case is ignored: "SQL joins" and "sql joins" count as one topic.
 */
export async function topTopicsThisWeek(
  userId: number,
  today: string,
  limit = 5,
): Promise<{ name: string; minutes: number }[]> {
  return query<{ name: string; minutes: number }>(
    `SELECT min(topic) AS name, SUM(duration_minutes)::int AS minutes
     FROM study_sessions
     WHERE user_id = $1
       AND topic IS NOT NULL
       AND local_date BETWEEN date_trunc('week', $2::timestamp)::date AND $2::date
     GROUP BY lower(topic)
     ORDER BY minutes DESC, name
     LIMIT $3`,
    [userId, today, limit],
  );
}
