// The right side of the header: "Log in / Sign up" for guests, or "New post", your name
// and "Log out" for logged-in users. It reads the login cookie, so it streams in inside
// <Suspense> (see site-header.tsx), while the rest of the header is part of the static shell.
import { LogOut, PenLine } from "lucide-react";
import Link from "next/link";

import { MobileMenu } from "@/components/mobile-menu";
import { buttonVariants } from "@/components/ui/button";
import { logout } from "@/controllers/auth.actions";
import { getCurrentUser } from "@/controllers/session";
import { initialOf } from "@/lib/format";
import { cn } from "@/lib/utils";

const menuItem =
  "flex min-h-11 items-center gap-2 rounded-lg px-3 text-label font-medium hover:bg-muted";

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="inline-flex size-7.5 items-center justify-center rounded-full bg-focus-soft text-caption font-semibold text-primary"
      aria-hidden="true"
    >
      {initialOf(name)}
    </span>
  );
}

/** Log out is a form + POST button, never a link: a link can be opened by prefetching. */
function LogoutButton({ className }: { className: string }) {
  return (
    <form action={logout}>
      <button type="submit" className={className}>
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </button>
    </form>
  );
}

export async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Log in
          </Link>
          <Link href="/register" className={buttonVariants()}>
            Sign up
          </Link>
        </div>
        <MobileMenu>
          <Link href="/" className={menuItem}>
            Posts
          </Link>
          <Link href="/study" className={menuItem}>
            Study
          </Link>
          <Link href="/login" className={menuItem}>
            Log in
          </Link>
          <Link href="/register" className={menuItem}>
            Sign up
          </Link>
        </MobileMenu>
      </>
    );
  }

  return (
    <>
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <Link href="/posts/new" className={buttonVariants()}>
          <PenLine aria-hidden="true" />
          New post
        </Link>
        <span className="inline-flex h-11 items-center gap-2 px-2 text-label font-medium">
          <Avatar name={user.username} />
          {user.username}
        </span>
        <LogoutButton
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "text-muted-foreground",
          )}
        />
      </div>
      <MobileMenu>
        <span className="flex min-h-11 items-center gap-2 px-3 text-label font-medium">
          <Avatar name={user.username} />
          {user.username}
        </span>
        <Link href="/" className={menuItem}>
          Posts
        </Link>
        <Link href="/study" className={menuItem}>
          Study
        </Link>
        <Link href="/posts/new" className={menuItem}>
          <PenLine className="size-4" aria-hidden="true" />
          New post
        </Link>
        <LogoutButton
          className={cn(menuItem, "w-full text-muted-foreground")}
        />
      </MobileMenu>
    </>
  );
}

/** Same size as the real menu, so the header doesn't jump when it arrives. */
export function UserMenuSkeleton() {
  return (
    <div aria-busy="true" className="flex items-center gap-2">
      <span className="sr-only">Loading your account…</span>
      <div
        aria-hidden="true"
        className="h-11 w-11 animate-pulse rounded-lg bg-skeleton motion-reduce:animate-none sm:w-44"
      />
    </div>
  );
}
