"use client";
// "Delete" opens a confirm dialog. The real delete is a form + POST button (a Server Action),
// never a link: browsers and Next.js may open links on their own (prefetching).
import { LoaderCircle, Trash2 } from "lucide-react";
import { useId, useLayoutEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ConfirmButton() {
  // useFormStatus knows if the form around this button is being sent right now.
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={buttonVariants({ variant: "destructive" })}
    >
      {pending && (
        <LoaderCircle
          className="animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {pending ? "Deleting…" : "Delete post"}
    </button>
  );
}

export function DeletePostButton({
  postTitle,
  action,
}: {
  postTitle: string;
  /** A Server Action: deletePost.bind(null, post.id). */
  action: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Unique ids: Next.js keeps visited post pages alive (hidden), so ids must not repeat.
  const id = useId();

  useLayoutEffect(() => {
    const element = dialog.current;
    // When Next.js hides this page, close the dialog. An open modal dialog makes the rest of
    // the page unclickable, even while it is hidden.
    return () => element?.close();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "border-destructive/30 text-destructive hover:bg-danger-soft hover:text-destructive",
        )}
      >
        <Trash2 aria-hidden="true" />
        Delete
      </button>

      {/* A native <dialog>: showModal() traps the focus inside, and Esc closes it. */}
      <dialog
        ref={dialog}
        role="alertdialog"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        className="m-auto mt-40 w-[calc(100%-3rem)] max-w-110 rounded-xl bg-card p-6 text-foreground shadow-[0_12px_32px_rgba(20,22,26,0.18)] backdrop:bg-foreground/45"
      >
        <h2 id={`${id}-title`} className="text-xl/7 font-semibold">
          Delete this post?
        </h2>
        <p
          id={`${id}-description`}
          className="mt-3 text-label leading-6 text-muted-foreground"
        >
          This can’t be undone. “{postTitle}” will be removed for everyone.
        </p>
        <form action={action} className="flex flex-wrap justify-end gap-2 pt-5">
          <button
            type="button"
            autoFocus
            onClick={() => dialog.current?.close()}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </button>
          <ConfirmButton />
        </form>
      </dialog>
    </>
  );
}
