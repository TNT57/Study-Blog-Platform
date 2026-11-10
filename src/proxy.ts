// Proxy (Next.js 16's new name for "middleware") runs BEFORE a page renders.
// It only does a quick, cheap check: no login cookie at all → go to the login page first.
// This is for speed and comfort, NOT security: a cookie can be fake or expired.
// The real check is requireUser() in the page and in every Server Action.
import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName } from "@/lib/auth/cookie";

export function proxy(request: NextRequest) {
  if (request.cookies.has(sessionCookieName())) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  // Only the pages that need a login.
  matcher: ["/posts/new", "/posts/:id/edit"],
};
