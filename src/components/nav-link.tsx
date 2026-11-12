"use client";
// A link in the main menu. It needs the current URL to mark itself as "the page you are on",
// and only the browser knows the URL while you click around, so this is a Client Component.
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const baseClass =
  "inline-flex h-11 items-center rounded-lg px-3 text-label font-medium";
const idleClass = "text-muted-foreground hover:text-foreground";

/** The pages in the main menu. */
type MenuHref = "/" | "/study";

/** The same link without the "you are here" mark: the Suspense fallback while the URL loads. */
export function PlainNavLink({
  href,
  children,
}: {
  href: MenuHref;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(baseClass, idleClass)}>
      {children}
    </Link>
  );
}

export function NavLink({
  href,
  activePrefix,
  children,
}: {
  href: MenuHref;
  /** Also active on pages under this path, e.g. "/posts" for a single post. */
  activePrefix?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (activePrefix !== undefined && pathname.startsWith(activePrefix));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        baseClass,
        active
          ? "bg-background text-foreground underline decoration-primary decoration-2 underline-offset-8"
          : idleClass,
      )}
    >
      {children}
    </Link>
  );
}
