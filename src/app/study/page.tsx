// VIEW: the Study page (the Study board): the Pomodoro timer and your stats. You must be logged in.
import type { Metadata } from "next";
import { Suspense } from "react";

import { StudyStatsSkeleton, StudyTimerSkeleton } from "@/components/skeletons";
import { PomodoroTimer } from "@/components/study/pomodoro-timer";
import { StudyStatsView } from "@/components/study/study-stats";
import { requireUser } from "@/controllers/session";
import { saveStudySession } from "@/controllers/study.actions";
import { getStudyStats } from "@/controllers/study.queries";

export const metadata: Metadata = { title: "Study" };

export default function StudyPage() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-content flex-1 flex-col gap-7 px-6 pt-10 pb-18"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">Study</h1>
        <p className="text-body text-muted-foreground">
          Focus for one round, then take a short break. Every finished focus
          round is saved.
        </p>
      </div>
      {/* The login check reads a cookie (per request), so everything below streams in. */}
      <Suspense
        fallback={
          <div className="flex flex-wrap items-start gap-6">
            <StudyTimerSkeleton />
            <section className="flex min-w-0 flex-[1_1_27.5rem] flex-col">
              <StudyStatsSkeleton />
            </section>
          </div>
        }
      >
        <StudyBoard />
      </Suspense>
    </main>
  );
}

async function StudyBoard() {
  const user = await requireUser("/study");
  return (
    <div className="flex flex-wrap items-start gap-6">
      {/* key: a different user gets a fresh timer (React keeps hidden pages alive, even across logins). */}
      <PomodoroTimer key={user.id} userId={user.id} save={saveStudySession} />
      <section
        aria-label="Your stats"
        className="flex min-w-0 flex-[1_1_27.5rem] flex-col"
      >
        {/* The timer shows at once; the stats need 6 small queries, so they stream in after it. */}
        <Suspense fallback={<StudyStatsSkeleton />}>
          <StudyStats userId={user.id} />
        </Suspense>
      </section>
    </div>
  );
}

async function StudyStats({ userId }: { userId: number }) {
  const stats = await getStudyStats(userId);
  return <StudyStatsView stats={stats} userId={userId} />;
}
