// The login cookie: its name and its safety settings.

/** Options for cookies().set(), in the shape Next.js expects. */
export type SessionCookieOptions = {
  path: string;
  expires: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
};

const isProduction = process.env.NODE_ENV === "production";

/**
 * In production the name starts with "__Host-". Browsers only accept such a cookie when it is
 * Secure, has Path=/ and no Domain, so another site (even a subdomain) can't overwrite it.
 * On localhost (plain http) we use a normal name, because "Secure" needs https in some browsers.
 */
export function sessionCookieName(production = isProduction): string {
  return production ? "__Host-session" : "session";
}

/**
 * The settings for the login cookie.
 *
 * TODO(you): Task 1 in docs/learn/03-auth.md.
 * Right now the cookie has no protection. Add the 3 safety settings from the table in the note:
 * httpOnly, secure (only in production) and sameSite.
 */
export function sessionCookieOptions(
  expiresAt: Date,
  production = isProduction,
): SessionCookieOptions {
  void production; // you will need this in Task 1
  return {
    path: "/",
    expires: expiresAt,
  };
}
