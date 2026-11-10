// Register, log in, log out and sessions, on a real database.
import { beforeEach, describe, expect, it, vi } from "vitest";

// cookies() becomes a pretend cookie jar. redirect() throws, like the real one.
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("./cookie-jar");
  return { cookies: () => cookieJar.cookies() };
});
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

import { login, logout, register } from "@/controllers/auth.actions";
import { getCurrentUser } from "@/controllers/session";
import { sessionCookieName } from "@/lib/auth/cookie";
import { hashToken } from "@/lib/auth/tokens";
import { query } from "@/lib/db";
import type { LoginFormState, RegisterFormState } from "@/lib/validation/auth";

import { cookieJar } from "./cookie-jar";
import { makeUser } from "./helpers";

const COOKIE = sessionCookieName(); // "session" in tests (not production)
const emptyRegister: RegisterFormState = {
  values: { username: "", email: "" },
};
const emptyLogin: LoginFormState = { values: { email: "" } };

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields))
    formData.append(name, value);
  return formData;
}

function registerTrung(fields: Record<string, string> = {}) {
  return register(
    emptyRegister,
    form({
      username: "trung",
      email: "trung@example.com",
      password: "coffee and code",
      timeZone: "Australia/Adelaide",
      ...fields,
    }),
  );
}

beforeEach(() => {
  cookieJar.clear();
  vi.clearAllMocks();
});

describe("register", () => {
  it("creates the account, logs in, and goes to the home page", async () => {
    await expect(registerTrung()).rejects.toThrow("REDIRECT /?toast=welcome");

    const [user] = await query<{
      username: string;
      password_hash: string;
      time_zone: string;
    }>("SELECT username, password_hash, time_zone FROM users");
    expect(user.username).toBe("trung");
    expect(user.password_hash).toMatch(/^\$argon2id\$/);
    expect(user.time_zone).toBe("Australia/Adelaide");
    expect(await getCurrentUser()).toMatchObject({
      username: "trung",
      role: "user",
    });
  });

  it("keeps only the SHA-256 of the cookie's token in the database", async () => {
    await expect(registerTrung()).rejects.toThrow("REDIRECT");

    const token = cookieJar.values.get(COOKIE)!;
    const [session] = await query<{ id: string }>("SELECT id FROM sessions");
    expect(session.id).toBe(hashToken(token));
    expect(session.id).not.toBe(token);
  });

  it("goes back to the page in ?next= afterwards", async () => {
    await expect(registerTrung({ next: "/posts/new" })).rejects.toThrow(
      "REDIRECT /posts/new?toast=welcome",
    );
  });

  it("refuses a taken email or username (any upper/lower case), and keeps what was typed", async () => {
    await makeUser({ username: "trung", email: "trung@example.com" });

    const sameEmail = await registerTrung({
      username: "someone",
      email: "TRUNG@example.com",
    });
    expect(sameEmail.errors?.email?.[0]).toMatch(/already exists/);

    const sameName = await registerTrung({
      username: "Trung",
      email: "new@example.com",
    });
    expect(sameName.errors).toEqual({
      username: ["This username is already taken."],
    });
    expect(sameName.values).toEqual({
      username: "Trung",
      email: "new@example.com",
    });
    expect(cookieJar.values.size).toBe(0);
  });
});

describe("login", () => {
  beforeEach(async () => {
    await expect(registerTrung()).rejects.toThrow("REDIRECT");
    cookieJar.clear(); // start logged out
  });

  it("logs in with the right password (email in any case) and goes to ?next=", async () => {
    await expect(
      login(
        emptyLogin,
        form({
          email: "Trung@Example.com",
          password: "coffee and code",
          next: "/posts/new",
        }),
      ),
    ).rejects.toThrow("REDIRECT /posts/new?toast=logged-in");

    expect(await getCurrentUser()).toMatchObject({ username: "trung" });
  });

  it("never sends you to another site after login", async () => {
    await expect(
      login(
        emptyLogin,
        form({
          email: "trung@example.com",
          password: "coffee and code",
          next: "https://evil.example",
        }),
      ),
    ).rejects.toThrow("REDIRECT /?toast=logged-in");
  });

  it("refuses an unknown email with the general message", async () => {
    const state = await login(
      emptyLogin,
      form({ email: "nobody@example.com", password: "coffee and code" }),
    );

    expect(state.error).toBe("Email or password is incorrect.");
    expect(cookieJar.values.size).toBe(0);
  });

  it("refuses a wrong password with exactly the same message (Task 2)", async () => {
    // 1. Trung has an account, but this password is wrong
    const wrongPassword = await login(
      emptyLogin,
      form({ email: "trung@example.com", password: "wrong" }),
    );

    // 2. Nobody has this email
    const unknownEmail = await login(
      emptyLogin,
      form({ email: "unknown@example.com", password: "password" }),
    );

    // 3. The checks
    expect(wrongPassword.error).toBe("Email or password is incorrect.");
    expect(unknownEmail.error).toBe(wrongPassword.error); // both messages are exactly the same
    expect(cookieJar.values.size).toBe(0); // nobody got logged in
  });

  it("can't log in as a user whose password hash isn't real (like the seeded demo user)", async () => {
    await makeUser({ username: "demo", email: "demo@example.com" }); // hash "test-hash"

    const state = await login(
      emptyLogin,
      form({ email: "demo@example.com", password: "test-hash" }),
    );

    expect(state.error).toBe("Email or password is incorrect.");
  });
});

describe("sessions", () => {
  it("logs out: the session row is deleted and the cookie is gone", async () => {
    await expect(registerTrung()).rejects.toThrow("REDIRECT");

    await expect(logout()).rejects.toThrow("REDIRECT /?toast=logged-out");

    expect(cookieJar.values.has(COOKIE)).toBe(false);
    expect(await query("SELECT id FROM sessions")).toHaveLength(0);
    expect(await getCurrentUser()).toBeNull();
  });

  it("makes a copied token worthless after logout", async () => {
    await expect(registerTrung()).rejects.toThrow("REDIRECT");
    const stolen = cookieJar.values.get(COOKIE)!;
    await expect(logout()).rejects.toThrow("REDIRECT");

    cookieJar.values.set(COOKIE, stolen); // an attacker puts the old token back

    expect(await getCurrentUser()).toBeNull();
  });

  it("counts an expired session as logged out", async () => {
    await expect(registerTrung()).rejects.toThrow("REDIRECT");
    await query("UPDATE sessions SET expires_at = now() - interval '1 second'");

    expect(await getCurrentUser()).toBeNull();
  });

  it("logs nobody in with a made-up token", async () => {
    cookieJar.values.set(COOKIE, "i-made-this-up");

    expect(await getCurrentUser()).toBeNull();
  });

  it("lasts 30 days", async () => {
    await expect(registerTrung()).rejects.toThrow("REDIRECT");

    const expires = cookieJar.options.get(COOKIE)?.expires;
    const days = (expires!.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThanOrEqual(30);
  });
});
