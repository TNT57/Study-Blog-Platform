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
 * The settings for the login cookie (the table in docs/learn/03-auth.md):
 * httpOnly (page scripts can't read it), secure (https only, in production) and sameSite (no CSRF).
 */
export function sessionCookieOptions(
  expiresAt: Date,
  production = isProduction,
): SessionCookieOptions {
  return {
    path: "/",
    expires: expiresAt,
    httpOnly: true,
    secure: production,
    sameSite: "lax",
  };
}
