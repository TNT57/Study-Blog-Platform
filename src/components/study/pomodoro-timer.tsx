"use client";
// The Pomodoro timer (the Study board). A Client Component: it ticks, plays a sound, changes the
// tab title and reads localStorage, and only the browser can do those things.
//
// The rules live in src/lib/pomodoro.ts (pure functions). This file only connects them to the
// buttons, to the browser's storage, and to the Server Action that saves a finished round.
import { Check, CircleAlert } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useState,
  useTransition,
} from "react";

import { buttonVariants } from "@/components/ui/button";
import type { SaveRoundResult } from "@/controllers/study.actions";
import {
  advance,
  DEFAULT_SETTINGS,
  formatTime,
  IDLE_TIMER,
  lengthOf,
  type Mode,
  MODE_LABELS,
  pause,
  pickMode,
  reset,
  ROUNDS_PER_CYCLE,
  secondsLeft,
  settingsSchema,
  start,
  statusOf,
  timerSchema,
} from "@/lib/pomodoro";
import { cn } from "@/lib/utils";

import { playChime, unlockSound } from "./chime";
import { TimerSettingsDialog } from "./timer-settings-dialog";
import {
  NO_TOPIC,
  NO_UNSAVED,
  storageKeys,
  topicSchema,
  type UnsavedRound,
  unsavedSchema,
} from "./timer-storage";
import { parseStored, readStored, useStoredState } from "./use-stored-state";

const MODES: Mode[] = ["focus", "short", "long"];
const PAGE_TITLE = "Study · Study Blog";
const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-body text-foreground";

/** The green "Saved" message. `next` is the break that comes now (none after a Retry). */
type SavedNotice = { minutes: number; topic: string | null; next?: Mode };

export function PomodoroTimer({
  userId,
  save,
}: {
  userId: number;
  /** The Server Action saveStudySession. */
  save: (round: {
    durationMinutes: number;
    topic: string;
  }) => Promise<SaveRoundResult>;
}) {
  const keys = storageKeys(userId);
  const [timer, setTimer] = useStoredState(keys.timer, timerSchema, IDLE_TIMER);
  const [settings, setSettings] = useStoredState(
    keys.settings,
    settingsSchema,
    DEFAULT_SETTINGS,
  );
  const [topic, setTopic] = useStoredState(keys.topic, topicSchema, NO_TOPIC);
  const [unsaved, setUnsaved] = useStoredState(
    keys.unsaved,
    unsavedSchema,
    NO_UNSAVED,
  );

  // "now" only matters while the clock runs; the tick below keeps it fresh.
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<SavedNotice | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const topicId = useId();

  const status = statusOf(timer);
  const left = secondsLeft(timer, settings, now);
  const isFocus = timer.mode === "focus";

  /**
   * Sends rounds to the server, oldest first. A round leaves this device only after the server
   * answers "saved", so a lost connection never loses a round.
   */
  function sendRounds(rounds: UnsavedRound[], next?: Mode) {
    startSaving(async () => {
      for (const round of rounds) {
        let result: SaveRoundResult;
        try {
          result = await save({
            durationMinutes: round.minutes,
            topic: round.topic,
          });
        } catch (error) {
          // If the session expired, the action redirects to the login page: let Next.js do that.
          unstable_rethrow(error);
          return; // offline or server down: the round stays on this device
        }
        if (!result.ok) return;
        // Read storage again: it may have changed while we waited (another round, another tab).
        const current = parseStored(
          readStored(keys.unsaved),
          unsavedSchema,
          NO_UNSAVED,
        );
        setUnsaved(current.filter((item) => item.id !== round.id));
        setNotice({ minutes: result.minutes, topic: result.topic, next });
      }
    });
  }

  // Runs when the clock reaches 0. useEffectEvent: always sees the latest settings and topic,
  // without restarting the ticking effect below every time they change.
  const finishRound = useEffectEvent((endsAt: number) => {
    // With 2 tabs open, both see the end. Only the tab that still finds THIS round in storage
    // goes on, so the round is saved once.
    const stored = parseStored(readStored(keys.timer), timerSchema, IDLE_TIMER);
    if (stored.endsAt !== endsAt) return;

    const next = advance(stored);
    setTimer(next);
    setNow(Date.now());
    if (settings.sound) playChime();

    if (stored.mode !== "focus") {
      setLiveMessage(`Break over. Ready for round ${next.round}?`);
      setAlertTitle("Focus time!");
      return;
    }

    setLiveMessage(
      `Focus done. Time for a ${lengthOf(next.mode, settings)}-minute break.`,
    );
    setAlertTitle("Break time!");
    // Keep the round on this device FIRST, then send it.
    const round: UnsavedRound = {
      id: String(endsAt),
      minutes: stored.minutes ?? lengthOf("focus", settings),
      topic: topic.trim(),
    };
    const waiting = parseStored(
      readStored(keys.unsaved),
      unsavedSchema,
      NO_UNSAVED,
    );
    setUnsaved([...waiting, round]);
    sendRounds([round], next.mode);
  });

  // The tick. We never count "−1 second": we compare the end time with the clock, 4 times a
  // second. Background tabs may tick only once a minute, so we also check the moment you come back.
  useEffect(() => {
    const endsAt = timer.endsAt;
    if (endsAt === null) return;
    const tick = () => {
      const time = Date.now();
      if (time >= endsAt) finishRound(endsAt);
      else setNow(time);
    };
    const interval = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [timer.endsAt]);

  // The tab title: the time left while running, "Break time!" when a round ends.
  // A layout effect: when you leave the page, it lets go of the title before the next page's title.
  const title =
    status === "running"
      ? `${formatTime(left)} ${MODE_LABELS[timer.mode]}`
      : alertTitle;
  useLayoutEffect(() => {
    if (!title) return;
    const ours = `${title} · Study Blog`;
    const apply = () => {
      if (document.title !== ours) document.title = ours;
    };
    apply();
    // After a save, refresh() re-renders the page and Next.js writes the page's normal title
    // again. While the timer owns the title, it watches <head> and puts its own text back.
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => {
      observer.disconnect();
      // Only put the normal title back if it's still ours (another page may have set its own).
      if (document.title === ours) document.title = PAGE_TITLE;
    };
  }, [title]);

  function clearMessages() {
    setNotice(null);
    setAlertTitle(null);
    setLiveMessage("");
  }

  function onStartOrPause() {
    const time = Date.now();
    if (status === "running") {
      setTimer(pause(timer, settings, time));
    } else {
      unlockSound(); // browsers allow sound only after a click
      setTimer(start(timer, settings, time));
      clearMessages();
    }
    setNow(time);
  }

  const statusLabel =
    status === "running"
      ? isFocus
        ? "Focusing…"
        : "On a break…"
      : status === "paused"
        ? "Paused"
        : MODE_LABELS[timer.mode];
  const startLabel =
    status === "running" ? "Pause" : status === "paused" ? "Resume" : "Start";
  const unsavedMinutes = unsaved.reduce((sum, round) => sum + round.minutes, 0);

  return (
    <section
      aria-label="Pomodoro timer"
      className="flex min-w-0 flex-[1_1_27.5rem] flex-col gap-6 rounded-xl border border-border bg-card p-7 max-sm:p-5"
    >
      <div
        role="group"
        aria-label="Timer mode"
        className="flex gap-1 rounded-[10px] border border-border bg-background p-1"
      >
        {MODES.map((mode) => {
          const on = mode === timer.mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setTimer(pickMode(timer, mode));
                clearMessages();
              }}
              className={cn(
                "h-11 min-w-0 flex-1 rounded-lg px-1 text-label font-medium",
                on
                  ? "bg-card text-foreground shadow-[0_1px_2px_rgba(20,22,26,0.08)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {MODE_LABELS[mode]}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "flex flex-col items-center gap-3.5 rounded-xl px-4 pt-7 pb-5",
          isFocus ? "bg-focus-soft" : "bg-break-soft",
        )}
      >
        <span
          className={cn(
            "inline-flex h-6.5 items-center rounded-md bg-card px-2.5 text-caption font-medium",
            isFocus ? "text-primary" : "text-break",
          )}
        >
          {statusLabel}
        </span>
        {/* Screen readers hear this once, when a round ends. The clock itself stays quiet. */}
        <span role="status" className="sr-only">
          {liveMessage}
        </span>
        <span
          role="timer"
          aria-live="off"
          className="font-mono text-timer-phone font-medium tracking-[-0.03em] sm:text-timer"
        >
          {formatTime(left)}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div aria-hidden="true" className="flex gap-1.5">
            {Array.from({ length: ROUNDS_PER_CYCLE }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "size-2.5 rounded-full border-[1.5px]",
                  isFocus ? "border-primary" : "border-break",
                  index < timer.round && (isFocus ? "bg-primary" : "bg-break"),
                )}
              />
            ))}
          </div>
          <span className="text-center text-small text-muted-foreground">
            Round {timer.round} of {ROUNDS_PER_CYCLE} · long break after round{" "}
            {ROUNDS_PER_CYCLE}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={topicId} className="text-small font-medium">
          What are you studying?{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id={topicId}
          name="topic"
          type="text"
          maxLength={40}
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStartOrPause}
          className={buttonVariants({
            size: "lg",
            className: cn(
              "flex-[1_1_10rem] max-sm:basis-full",
              !isFocus && "bg-break hover:bg-break/90",
            ),
          })}
        >
          {startLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            setTimer(reset(timer));
            clearMessages();
          }}
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "max-sm:flex-1",
          })}
        >
          Reset
        </button>
        <button
          type="button"
          // Skip moves on WITHOUT saving: only a round that ran to the end counts.
          onClick={() => {
            setTimer(advance(timer));
            clearMessages();
          }}
          className={buttonVariants({
            variant: "ghost",
            size: "lg",
            className: "text-muted-foreground max-sm:flex-1",
          })}
        >
          Skip
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg bg-success-soft px-3.5 py-3 text-label leading-[22px] text-success"
        >
          <Check className="size-5 shrink-0" aria-hidden="true" />
          <span>
            Saved: {notice.minutes} min
            {notice.topic && <> on “{notice.topic}”</>}.
            {notice.next && (
              <>
                {" "}
                Time for a {notice.next === "long" ? "long" : "short"} break.
              </>
            )}
          </span>
        </div>
      )}

      {unsaved.length > 0 && !saving && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2.5 rounded-lg bg-danger-soft py-2.5 pr-2.5 pl-3.5 text-label leading-[22px] text-destructive"
        >
          <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
          <span className="flex-[1_1_12.5rem]">
            {unsaved.length === 1
              ? `Couldn’t save your ${unsavedMinutes}-minute round. It’s kept on this device until it’s saved.`
              : `Couldn’t save ${unsaved.length} rounds (${unsavedMinutes} min). They’re kept on this device until they’re saved.`}
          </span>
          <button
            type="button"
            onClick={() => sendRounds(unsaved)}
            className={buttonVariants({
              variant: "outline",
              className:
                "border-destructive text-destructive hover:bg-card hover:text-destructive",
            })}
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-caption text-muted-foreground">
          {settings.focus} / {settings.short} / {settings.long} min ·{" "}
          <span className="max-sm:hidden">daily </span>goal {settings.goal}
          <span className="max-sm:hidden"> · saved on this device</span>
        </span>
        <TimerSettingsDialog settings={settings} onSave={setSettings} />
      </div>
    </section>
  );
}
