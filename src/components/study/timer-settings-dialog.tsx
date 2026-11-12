"use client";
// "Timer settings" (the dialog on the Study board; a bottom sheet on phones).
// The settings are saved in this browser only (localStorage), so there is no Server Action here.
import { Settings2 } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { type Settings, settingsSchema } from "@/lib/pomodoro";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-body text-foreground";

const numberFields = [
  { name: "focus", label: "Focus", min: 1, max: 90, hint: "1–90 minutes" },
  {
    name: "short",
    label: "Short break",
    min: 1,
    max: 30,
    hint: "1–30 minutes",
  },
  { name: "long", label: "Long break", min: 1, max: 60, hint: "1–60 minutes" },
  {
    name: "goal",
    label: "Daily goal",
    min: 1,
    max: 12,
    hint: "1–12 pomodoros",
  },
] as const;

export function TimerSettingsDialog({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (settings: Settings) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  // A new key each time it opens: the form starts again from the saved settings.
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState(false);

  useLayoutEffect(() => {
    const element = dialog.current;
    // Next.js keeps this page alive but hidden when you leave it. A modal dialog left open
    // would block clicks on the next page, so close it.
    return () => element?.close();
  }, []);

  function open() {
    setFormKey((key) => key + 1);
    setError(false);
    dialog.current?.showModal();
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // The inputs already refuse bad numbers (min, max, step). Zod checks again, to be sure.
    const result = settingsSchema.safeParse({
      focus: Number(form.get("focus")),
      short: Number(form.get("short")),
      long: Number(form.get("long")),
      goal: Number(form.get("goal")),
      sound: form.get("sound") === "on",
    });
    if (!result.success) {
      setError(true);
      return;
    }
    onSave(result.data);
    dialog.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={buttonVariants({ variant: "outline" })}
      >
        <Settings2 aria-hidden="true" />
        <span className="sm:hidden">Settings</span>
        <span className="max-sm:hidden">Timer settings</span>
      </button>

      {/* A native <dialog>: showModal() keeps the focus inside, and Esc closes it. */}
      <dialog
        ref={dialog}
        aria-labelledby={`${id}-title`}
        className="m-auto w-[calc(100%-3rem)] max-w-115 rounded-xl bg-card p-6 text-foreground shadow-[0_12px_32px_rgba(20,22,26,0.18)] backdrop:bg-foreground/45 max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none"
      >
        <h2 id={`${id}-title`} className="text-xl/7 font-semibold">
          Timer settings
        </h2>
        <p className="mt-1 text-small text-muted-foreground">
          Saved on this device only (localStorage).
        </p>

        <form
          key={formKey}
          onSubmit={save}
          className="mt-4 flex flex-col gap-3.5"
        >
          <div className="grid grid-cols-2 gap-3.5">
            {numberFields.map((field) => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${id}-${field.name}`}
                  className="text-small font-medium"
                >
                  {field.label}
                </label>
                <input
                  id={`${id}-${field.name}`}
                  name={field.name}
                  type="number"
                  inputMode="numeric"
                  required
                  step={1}
                  min={field.min}
                  max={field.max}
                  defaultValue={settings[field.name]}
                  aria-describedby={`${id}-${field.name}-hint`}
                  className={fieldClass}
                />
                <span
                  id={`${id}-${field.name}-hint`}
                  className="text-caption text-muted-foreground"
                >
                  {field.hint}
                </span>
              </div>
            ))}
          </div>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-label">
            <input
              name="sound"
              type="checkbox"
              defaultChecked={settings.sound}
              className="size-5.5 accent-primary"
            />
            Play a short sound when a round ends
          </label>

          {error && (
            <p role="alert" className="text-small text-destructive">
              Please check the numbers above.
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className={buttonVariants({ variant: "outline" })}
            >
              Cancel
            </button>
            <button type="submit" className={buttonVariants()}>
              Save
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
