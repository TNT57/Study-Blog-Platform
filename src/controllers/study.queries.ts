// CONTROLLER (reads) for the study stats.
// No "use cache" here: the stats belong to ONE user and change after every round,
// so the page reads them per request, inside <Suspense>.
import "server-only";

import { weekdayOf } from "@/lib/format";
import {
  countRounds,
  minutesPerDay,
  minutesThisWeek,
  todayFor,
  topTopicsThisWeek,
  totalsOnDay,
} from "@/models/study-session.model";

/** A DTO: only what the Study page shows. */
export type StudyStats = {
  today: { minutes: number; rounds: number };
  weekMinutes: number;
  allTimeRounds: number;
  /** The last 7 days, oldest first; the last one is today. */
  days: { day: string; label: string; minutes: number; isToday: boolean }[];
  topics: { name: string; minutes: number }[];
};

export async function getStudyStats(userId: number): Promise<StudyStats> {
  // "Today" comes from the database clock and the user's own time zone, never from the browser.
  const today = await todayFor(userId);
  if (!today) throw new Error(`User ${userId} not found`);

  // Five small queries that don't depend on each other: run them at the same time.
  const [todayTotals, weekMinutes, allTimeRounds, perDay, topics] =
    await Promise.all([
      totalsOnDay(userId, today),
      minutesThisWeek(userId, today),
      countRounds(userId),
      minutesPerDay(userId, today),
      topTopicsThisWeek(userId, today),
    ]);

  return {
    today: todayTotals,
    weekMinutes,
    allTimeRounds,
    days: perDay.map(({ day, minutes }) => ({
      day,
      minutes,
      isToday: day === today,
      label: day === today ? "Today" : weekdayOf(day),
    })),
    topics,
  };
}
