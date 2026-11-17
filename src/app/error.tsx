"use client";
// VIEW: shown when something breaks while a page renders (the States board, "500").
// Never show the real error text to users: it can contain secrets. It is logged instead.
import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { errorDigest } from "@/lib/error-report";

export default function ErrorPage({
  error,
  retry,
}: {
  /** What was thrown. From the server it's an Error with a `digest`; from the browser, anything. */
  error: unknown;
  /** Loads the page again (fetches the data again). */
  retry: () => void;
}) {
  useEffect(() => {
    // The digest matches the full error in the server logs.
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-danger-soft text-destructive">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-h2">Something went wrong</h1>
      <p className="max-w-90 text-label leading-6 text-muted-foreground">
        It’s not you, it’s us. Try again in a moment. If it keeps happening,
        come back later.
      </p>
      <ErrorCode digest={errorDigest(error)} />
      <div className="mt-1.5 flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          All posts
        </Link>
      </div>
    </main>
  );
}

/**
 * The short code of a server error. The same code is in the server logs (src/instrumentation.ts),
 * so if someone reports it, we can find exactly what happened, without showing them any details.
 */
export function ErrorCode({ digest }: { digest: string | undefined }) {
  if (!digest) return null;
  return (
    <p className="text-caption text-muted-foreground">
      Error code: <code className="font-mono">{digest}</code>
    </p>
  );
}
