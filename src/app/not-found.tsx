// VIEW: shown for unknown URLs and whenever code calls notFound() (the States board).
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <span className="font-mono text-h1 text-primary" aria-hidden="true">
        404
      </span>
      <h1 className="text-h2">We can’t find that page</h1>
      <p className="max-w-80 text-label leading-6 text-muted-foreground">
        The post may have been deleted, or the link has a typo.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-1.5" })}>
        Go to all posts
      </Link>
    </main>
  );
}
