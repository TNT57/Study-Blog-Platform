// Session tokens: the "key card" a browser keeps in its cookie.
import { createHash, randomBytes } from "node:crypto";

/** Sessions last 30 days after login, then you log in again. */
export const SESSION_DAYS = 30;

/** 32 random bytes (256 bits), as URL-safe text. Impossible to guess. */
export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * The SHA-256 of a token, as 64 hex characters. The database only stores this.
 * A token is already random and long, so a fast hash is enough here
 * (passwords are different: people choose weak ones, so they need slow Argon2).
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}
