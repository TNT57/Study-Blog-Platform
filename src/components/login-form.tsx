"use client";
// The login form (the Login board on the design canvas).
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useActionState, useId } from "react";

import { buttonVariants } from "@/components/ui/button";
import { login } from "@/controllers/auth.actions";
import type { LoginFormState } from "@/lib/validation/auth";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-body text-foreground aria-invalid:border-destructive";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginFormState, FormData>(
    login,
    { values: { email: "" } },
  );
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4.5 rounded-xl border border-border bg-card p-7"
    >
      {state.error && (
        <div
          id={errorId}
          role="alert"
          className="flex items-start gap-2.5 rounded-lg bg-danger-soft px-3.5 py-3 text-label leading-[22px] text-destructive"
        >
          <CircleAlert
            className="mt-0.5 size-4.5 shrink-0"
            aria-hidden="true"
          />
          <span>{state.error}</span>
        </div>
      )}

      {/* Where to go after login. The server checks it again (safeNextPath). */}
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-email`} className="text-small font-medium">
          Email
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          // We log in by email, so password managers should save the email as the "username".
          autoComplete="username"
          required
          defaultValue={state.values.email}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-password`} className="text-small font-medium">
          Password
        </label>
        <input
          id={`${id}-password`}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
          className={fieldClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className={buttonVariants({ className: "mt-1 w-full" })}
      >
        {pending && (
          <LoaderCircle
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
