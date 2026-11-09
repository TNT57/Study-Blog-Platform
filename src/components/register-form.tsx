"use client";
// The register form (the Register board on the design canvas).
import { LoaderCircle } from "lucide-react";
import { useActionState, useId } from "react";

import { buttonVariants } from "@/components/ui/button";
import { register } from "@/controllers/auth.actions";
import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  type RegisterFormState,
} from "@/lib/validation/auth";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-body text-foreground aria-invalid:border-destructive";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  error?: string;
  children: (describedBy: string, invalid: true | undefined) => React.ReactNode;
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-medium">
        {label}
      </label>
      {children(
        error ? `${errorId} ${hintId}` : hintId,
        error ? true : undefined,
      )}
      {error && (
        <span id={errorId} className="text-caption text-destructive">
          {error}
        </span>
      )}
      <span id={hintId} className="text-caption text-muted-foreground">
        {hint}
      </span>
    </div>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<
    RegisterFormState,
    FormData
  >(register, { values: { username: "", email: "" } });
  const id = useId();

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4.5 rounded-xl border border-border bg-card p-7"
    >
      <input type="hidden" name="next" value={next} />
      {/*
        The browser's time zone, so the study stats (M5) know your "today".
        A callback ref fills it in the browser; the server checks it and falls back to UTC.
      */}
      <input
        type="hidden"
        name="timeZone"
        ref={(input) => {
          if (input)
            input.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }}
      />

      <Field
        id={`${id}-username`}
        label="Username"
        hint="Shown on your posts. 3–20 characters: letters, numbers and _ only."
        error={state.errors?.username?.[0]}
      >
        {(describedBy, invalid) => (
          <input
            id={`${id}-username`}
            name="username"
            type="text"
            autoComplete="nickname"
            required
            minLength={3}
            maxLength={20}
            defaultValue={state.values.username}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={fieldClass}
          />
        )}
      </Field>

      <Field
        id={`${id}-email`}
        label="Email"
        hint="You log in with this. We never show it to others."
        error={state.errors?.email?.[0]}
      >
        {(describedBy, invalid) => (
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="username"
            required
            defaultValue={state.values.email}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={fieldClass}
          />
        )}
      </Field>

      <Field
        id={`${id}-password`}
        label="Password"
        hint={`${PASSWORD_MIN}–${PASSWORD_MAX} characters. A short sentence works well.`}
        error={state.errors?.password?.[0]}
      >
        {(describedBy, invalid) => (
          <input
            id={`${id}-password`}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={fieldClass}
          />
        )}
      </Field>

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
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
