// VIEW: shown whenever code calls forbidden() (a 403): you are logged in, but this isn't yours.
// Same layout as the 404 page (the States board).
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Not allowed" };

export default function Forbidden() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <span className="font-mono text-h1 text-primary" aria-hidden="true">
        403
      </span>
      <h1 className="text-h2">You can’t change this post</h1>
      <p className="max-w-80 text-label leading-6 text-muted-foreground">
        Only the person who wrote it, or an admin, can edit or delete it.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-1.5" })}>
        Go to all posts
      </Link>
    </main>
  );
}
