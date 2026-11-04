import { cn } from "cn";
import { Timer } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const REPO_URL = "https://github.com/TNT57/Study-Blog-Platform";

// Temporary home page for Milestone 0.
// In Milestone 2 this becomes the post list from the Claude Design canvas.
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex items-center gap-2.5">
        <Timer className="size-7 text-primary" aria-hidden="true" />
        <span className="text-lg font-semibold tracking-tight">Study Blog</span>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="text-[40px] leading-[48px] font-semibold tracking-tight">
          Write what you learn. Track how you focus.
        </h1>
        <p className="text-base leading-[26px] text-muted-foreground">
          A study blog with a Pomodoro timer. It is being built step by step,
          one milestone at a time.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-[26px] items-center rounded-sm bg-focus-soft px-2.5 text-[13px] font-medium text-primary">
          Milestone 0 · project setup
        </span>
        <a
          href={`${REPO_URL}/tree/main/docs/learn`}
          // cn() merges the classes so the outline border wins over the default one.
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Read the learning notes
        </a>
      </div>
    </main>
  );
}
