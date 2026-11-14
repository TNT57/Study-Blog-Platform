// The bar at the top of every page (from the Home board on the design canvas).
import { Timer } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { NavLink, PlainNavLink } from "@/components/nav-link";
import { UserMenu, UserMenuSkeleton } from "@/components/user-menu";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-6 py-2.5">
        <div className="flex flex-wrap items-center gap-7">
          <Link href="/" className="flex min-h-11 items-center gap-2.5">
            <Timer className="size-6 text-primary" aria-hidden="true" />
            <span className="text-h3 tracking-tight">Study Blog</span>
          </Link>
          {/* On phones, the menu button in UserMenu has the links instead. */}
          <nav aria-label="Main" className="hidden gap-1 sm:flex">
            {/* The current URL is only known per request on some pages (like /posts/12). */}
            <Suspense fallback={<PlainNavLink href="/">Posts</PlainNavLink>}>
              <NavLink href="/" activePrefix="/posts">
                Posts
              </NavLink>
            </Suspense>
            <Suspense
              fallback={<PlainNavLink href="/study">Study</PlainNavLink>}
            >
              <NavLink href="/study">Study</NavLink>
            </Suspense>
          </nav>
        </div>
        {/* Depends on the login cookie, so it streams in after the static shell. */}
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
