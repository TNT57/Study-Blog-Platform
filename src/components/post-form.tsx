"use client";
// The form for writing and editing a post (the Editor board on the design canvas).
// A Client Component, because it shows errors and a "Publishing…" state without a page reload.
import { LoaderCircle, TriangleAlert } from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CONTENT_MAX,
  TITLE_MAX,
  type PostFormState,
  type PostFormValues,
} from "@/lib/validation/post";

type PostFormProps = {
  /** A Server Action: createPost, or updatePost.bind(null, id). */
  action: (state: PostFormState, formData: FormData) => Promise<PostFormState>;
  initialValues: PostFormValues;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
};

/**
 * Next.js keeps pages you leave alive but hidden (React <Activity>), so "Back" finds them as
 * you left them. Good for a draft you didn't send. But after a successful save, the form should
 * start empty next time: so when the page is hidden right after a submit, we remount the form.
 */
export function PostForm(props: PostFormProps) {
  const [version, setVersion] = useState(0);
  const submittedRef = useRef(false);

  useLayoutEffect(() => {
    // This cleanup runs when the page is hidden (or removed).
    return () => {
      if (submittedRef.current) {
        submittedRef.current = false;
        setVersion((current) => current + 1); // a new key = a brand-new, empty form
      }
    };
  }, []);

  return (
    <PostFormFields key={version} submittedRef={submittedRef} {...props} />
  );
}

const fieldClass =
  "w-full rounded-lg border border-input bg-card px-3 text-body text-foreground placeholder:text-muted-foreground aria-invalid:border-destructive";

function PostFormFields({
  action,
  initialValues,
  submitLabel,
  pendingLabel,
  cancelHref,
  submittedRef,
}: PostFormProps & { submittedRef: RefObject<boolean> }) {
  // useActionState runs the Server Action and gives back what it returned (the new `state`).
  const [state, formAction, pending] = useActionState(action, {
    values: initialValues,
  });
  const [titleLength, setTitleLength] = useState(initialValues.title.length);
  // Unique ids, so two forms (one hidden, one visible) never share an id.
  const id = useId();

  useEffect(() => {
    // The action came back with errors: we are still here, so this is a draft again.
    if (state.errors) submittedRef.current = false;
  }, [state, submittedRef]);

  const titleError = state.errors?.title?.[0];
  const contentError = state.errors?.content?.[0];
  const problems = [titleError, contentError].filter(Boolean).length;

  const ids = {
    title: `${id}-title`,
    titleCount: `${id}-title-count`,
    titleError: `${id}-title-error`,
    content: `${id}-content`,
    contentHint: `${id}-content-hint`,
    contentError: `${id}-content-error`,
  };

  return (
    <div className="flex flex-col gap-6">
      {problems > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg bg-danger-soft px-3.5 py-3 text-label leading-[22px] text-destructive"
        >
          <TriangleAlert
            className="mt-0.5 size-4.5 shrink-0"
            aria-hidden="true"
          />
          <span>
            Please fix {problems === 1 ? "1 problem" : `${problems} problems`}{" "}
            below, then try again.
          </span>
        </div>
      )}

      {/*
        React resets a form after its action runs. The inputs use the values the action
        returned as defaultValue, so after an error the user's text comes back: nothing is lost.
      */}
      <form
        action={formAction}
        onSubmit={() => {
          submittedRef.current = true;
        }}
        className="flex flex-col gap-5.5 rounded-xl border border-border bg-card p-7"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor={ids.title} className="text-small font-medium">
              Title
            </label>
            <span
              id={ids.titleCount}
              className="font-mono text-xs text-muted-foreground"
            >
              {titleLength} / {TITLE_MAX}
            </span>
          </div>
          <input
            id={ids.title}
            name="title"
            type="text"
            required
            maxLength={TITLE_MAX}
            defaultValue={state.values.title}
            onChange={(event) => setTitleLength(event.target.value.length)}
            placeholder="What did you learn?"
            aria-invalid={titleError ? true : undefined}
            aria-describedby={
              titleError
                ? `${ids.titleError} ${ids.titleCount}`
                : ids.titleCount
            }
            className={cn(fieldClass, "h-11")}
          />
          {titleError && (
            <span id={ids.titleError} className="text-caption text-destructive">
              {titleError}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.content} className="text-small font-medium">
            Content
          </label>
          <textarea
            id={ids.content}
            name="content"
            rows={12}
            required
            maxLength={CONTENT_MAX}
            defaultValue={state.values.content}
            placeholder="Explain it like you would to a friend."
            aria-invalid={contentError ? true : undefined}
            aria-describedby={
              contentError
                ? `${ids.contentError} ${ids.contentHint}`
                : ids.contentHint
            }
            className={cn(fieldClass, "min-h-80 resize-y py-3 leading-[26px]")}
          />
          {contentError && (
            <span
              id={ids.contentError}
              className="text-caption text-destructive"
            >
              {contentError}
            </span>
          )}
          <span
            id={ids.contentHint}
            className="text-caption text-muted-foreground"
          >
            Plain text. Line breaks are kept.
          </span>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
          <Link
            href={cancelHref}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending || undefined}
            className={buttonVariants()}
          >
            {pending && (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            {pending ? pendingLabel : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
