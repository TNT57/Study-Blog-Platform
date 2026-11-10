// Task 1: the login cookie's safety settings (src/lib/auth/cookie.ts).
// These tests are red until you add the settings (see docs/learn/03-auth.md).
import { describe, expect, it } from "vitest";

import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/cookie";

const expires = new Date("2026-12-09T10:00:00Z");

describe("the session cookie name", () => {
  it("uses the __Host- prefix in production", () => {
    expect(sessionCookieName(true)).toBe("__Host-session");
  });

  it("uses a plain name on localhost", () => {
    expect(sessionCookieName(false)).toBe("session");
  });
});

describe("sessionCookieOptions (Task 1)", () => {
  it("keeps the cookie away from JavaScript in the page (httpOnly)", () => {
    expect(sessionCookieOptions(expires, true).httpOnly).toBe(true);
    expect(sessionCookieOptions(expires, false).httpOnly).toBe(true);
  });

  it("only sends the cookie over https in production (secure)", () => {
    expect(sessionCookieOptions(expires, true).secure).toBe(true);
    // On http://localhost a secure cookie would not work in every browser.
    expect(sessionCookieOptions(expires, false).secure).toBe(false);
  });

  it("doesn't send the cookie when another site starts the request (sameSite)", () => {
    expect(sessionCookieOptions(expires, true).sameSite).toBe("lax");
  });

  it("works for the whole site and ends at the given time", () => {
    const options = sessionCookieOptions(expires, true);

    expect(options.path).toBe("/");
    expect(options.expires).toEqual(expires);
  });
});
