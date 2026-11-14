// "Your stats" on the Study page (the Study board): 3 number cards, the last 7 days, top topics.
// A Server Component: it only shows the data the controller already prepared (a DTO).
import type { StudyStats } from "@/controllers/study.queries";
import { formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

import { GoalProgress } from "./goal-progress";

const card = "rounded-xl border border-border bg-card";
const CHART_HEIGHT = 150; // px for the biggest bar

/** A bar's height: in proportion to the biggest day, and a thin line for 0. */
function barHeight(minutes: number, max: number): string {
  if (minutes === 0) return "2px";
  return `${Math.max(4, Math.round((minutes / max) * CHART_HEIGHT))}px`;
}

function NumberCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: React.ReactNode;
}) {
  return (
    <div className={cn(card, "flex flex-[1_1_8.75rem] flex-col gap-1 p-4.5")}>
      <span className="text-caption font-medium text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-[1.75rem] leading-[2.125rem] font-medium">
        {value}
      </span>
      <span className="text-caption text-muted-foreground">{note}</span>
    </div>
  );
}

export function StudyStatsView({
  stats,
  userId,
}: {
  stats: StudyStats;
  userId: number;
}) {
  const isNew = stats.allTimeRounds === 0;
  const maxDay = Math.max(1, ...stats.days.map((day) => day.minutes));
  const sevenDayTotal = stats.days.reduce((sum, day) => sum + day.minutes, 0);
  const maxTopic = Math.max(1, ...stats.topics.map((topic) => topic.minutes));
  // The chart is a picture for screen readers, so it gets the numbers as text.
  const chartLabel = `Focus minutes per day: ${stats.days
    .map((day) => `${day.isToday ? "today" : day.label} ${day.minutes}`)
    .join(", ")}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <NumberCard
          label="Today"
          value={formatMinutes(stats.today.minutes)}
          note={<GoalProgress userId={userId} rounds={stats.today.rounds} />}
        />
        <NumberCard
          label="This week"
          value={formatMinutes(stats.weekMinutes)}
          note="Week starts Monday"
        />
        <NumberCard
          label="All time"
          value={String(stats.allTimeRounds)}
          note="pomodoros"
        />
      </div>

      <div className={cn(card, "flex flex-col gap-4 p-5.5")}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-h3">Last 7 days</h2>
          <span className="font-mono text-caption text-muted-foreground">
            {formatMinutes(sevenDayTotal)} total
          </span>
        </div>
        <div
          role="img"
          aria-label={chartLabel}
          className="flex h-50 items-end gap-2.5 border-b border-border"
        >
          {stats.days.map((day) => (
            <div
              key={day.day}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {day.minutes}
              </span>
              <div
                className={cn(
                  "w-full max-w-10 rounded-t-[4px]",
                  day.isToday ? "bg-primary-hover" : "bg-primary",
                )}
                style={{ height: barHeight(day.minutes, maxDay) }}
              />
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="flex gap-2.5">
          {stats.days.map((day) => (
            <span
              key={day.day}
              className={cn(
                "min-w-0 flex-1 text-center text-caption",
                day.isToday
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {day.label}
            </span>
          ))}
        </div>
        {isNew && (
          <p className="text-small text-muted-foreground">
            No focus rounds yet. Finish your first one and it shows up here.
          </p>
        )}
      </div>

      <div className={cn(card, "flex flex-col gap-3.5 p-5.5")}>
        <h2 className="text-h3">Top topics this week</h2>
        {stats.topics.length === 0 ? (
          <p className="text-small text-muted-foreground">
            Type a topic before you start a round, and your top topics show
            here.
          </p>
        ) : (
          <ul className="flex flex-col gap-3.5">
            {stats.topics.map((topic) => (
              <li key={topic.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-3 text-label">
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    {topic.name}
                  </span>
                  <span className="shrink-0 font-mono text-caption text-muted-foreground">
                    {topic.minutes} min
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="h-1.5 overflow-hidden rounded-full bg-focus-soft"
                >
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{
                      width: `${Math.round((topic.minutes / maxTopic) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
