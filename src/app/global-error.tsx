"use client";
// VIEW: the last safety net. If even the root layout breaks (the header, the fonts), Next.js shows
// this page instead of everything. It replaces the layout, so it brings its own <html>, <body>,
// styles and fonts. Normal page errors use error.tsx instead.
import { useEffect } from "react";

import { buttonVariants } from "@/components/ui/button";
import { errorDigest } from "@/lib/error-report";

import { ErrorCode } from "./error";
import { fontVariables } from "./fonts";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* No `metadata` in an error page (it's a Client Component), so a plain <title>. */}
        <title>Something went wrong · Study Blog</title>
        <main
          id="main"
          className="mx-auto flex w-full max-w-reading flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center"
        >
          <h1 className="text-h2">Something went wrong</h1>
          <p className="max-w-90 text-label leading-6 text-muted-foreground">
            The whole page failed to load. Try again in a moment.
          </p>
          <ErrorCode digest={errorDigest(error)} />
          <div className="mt-1.5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => retry()}
              className={buttonVariants()}
            >
              Try again
            </button>
            {/* A plain <a>, not <Link>: the app itself is broken, so load the page fresh. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full reload on purpose */}
            <a href="/" className={buttonVariants({ variant: "outline" })}>
              All posts
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
