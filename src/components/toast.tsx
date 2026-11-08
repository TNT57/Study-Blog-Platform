"use client";
// The small "Post published." message after an action worked (the Feedback board).
// The action redirects to a URL with ?toast=published; this component shows the message,
// removes ?toast= from the address bar (so a reload doesn't show it again), and closes after 5 s.
import { CircleCheck, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const MESSAGES: Record<string, string> = {
  published: "Post published.",
  saved: "Changes saved.",
  deleted: "Post deleted.",
};

export function Toast() {
  const key = useSearchParams().get("toast");
  const [message, setMessage] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);

  // A new ?toast= value: remember its message. (React allows setState during render
  // for this "react to a changed value" pattern; it re-renders before showing anything.)
  if (key !== lastKey) {
    setLastKey(key);
    if (key && MESSAGES[key]) setMessage(MESSAGES[key]);
  }

  useEffect(() => {
    if (!key || !MESSAGES[key]) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("toast");
    window.history.replaceState(window.history.state, "", url);
  }, [key]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    // The status area is always there, so screen readers notice when text appears in it.
    <div
      role="status"
      className="pointer-events-none fixed inset-x-4 bottom-6 z-50 flex justify-center sm:inset-x-auto sm:right-6"
    >
      {message && (
        <div className="pointer-events-auto flex max-w-90 items-center gap-2.5 rounded-xl bg-foreground py-2 pr-2 pl-4 text-label leading-[22px] text-white shadow-[0_12px_32px_rgba(20,22,26,0.24)]">
          <CircleCheck
            className="size-4.5 shrink-0 text-success-soft"
            aria-hidden="true"
          />
          <span className="flex-1">{message}</span>
          <button
            type="button"
            aria-label="Close message"
            onClick={() => setMessage(null)}
            className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <X className="size-4.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
