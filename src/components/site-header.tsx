// The bar at the top of every page (from the Home board on the design canvas).
import { PenLine, Timer } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { NavLink, PlainNavLink } from "@/components/nav-link";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-6 py-2.5">
        <div className="flex flex-wrap items-center gap-7">
          <Link href="/" className="flex min-h-11 items-center gap-2.5">
            <Timer className="size-6 text-primary" aria-hidden="true" />
            <span className="text-h3 tracking-tight">Study Blog</span>
          </Link>
          {/* On phones the logo is the way home. The phone menu button (HomePhone board)
              comes in M3, together with Log in, Sign up and Log out. */}
          <nav aria-label="Main" className="hidden gap-1 sm:flex">
            {/* The current URL is only known per request on some pages (like /posts/12). */}
            <Suspense fallback={<PlainNavLink href="/">Posts</PlainNavLink>}>
              <NavLink href="/" activePrefix="/posts">
                Posts
              </NavLink>
            </Suspense>
            {/* "Study" (the Pomodoro timer) joins the menu in M5. */}
          </nav>
        </div>
        {/* From M3, only logged-in users see this button, and the user menu streams in here. */}
        <Link href="/posts/new" className={buttonVariants()}>
          <PenLine aria-hidden="true" />
          New post
        </Link>
      </div>
    </header>
  );
}
