// CONTROLLER helpers for sessions: who is asking?
// "server-only": this reads the login cookie and the database, so it must never reach the browser.
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/cookie";
import { hashToken, newSessionToken, sessionExpiry } from "@/lib/auth/tokens";
import * as sessions from "@/models/session.model";
import type { Role } from "@/models/user.model";

/** The logged-in user, as pages and actions see them: only what they need (a DTO). */
export type CurrentUser = { id: number; username: string; role: Role };

/**
 * Logs a user in: a new random token goes into the cookie, and only its SHA-256 goes into
 * the database. Only call this from a Server Action (only actions can set cookies).
 */
export async function startSession(userId: number): Promise<void> {
  const token = newSessionToken();
  const expiresAt = sessionExpiry();
  await sessions.createSession({ id: hashToken(token), userId, expiresAt });
  await sessions.deleteExpiredSessions(userId);
  (await cookies()).set(
    sessionCookieName(),
    token,
    sessionCookieOptions(expiresAt),
  );
}

/** Logs out: the session row is deleted, so the token is worthless even if someone copied it. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (token) await sessions.deleteSession(hashToken(token));
  // An empty cookie that expired long ago tells the browser to delete it.
  jar.set(sessionCookieName(), "", sessionCookieOptions(new Date(0)));
}

/**
 * The logged-in user, or null. Reads the cookie, so a page must call it inside <Suspense>.
 * React's cache() runs it at most once per request, however many components ask.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return null;
  const user = await sessions.findSessionUser(hashToken(token));
  return user
    ? { id: user.id, username: user.username, role: user.role }
    : null;
});

/**
 * The logged-in user, or a redirect to the login page (which brings them back here after).
 * Every Server Action that changes data calls this itself: hiding a button is not security.
 */
export async function requireUser(nextPath: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}
