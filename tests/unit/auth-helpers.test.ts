import { describe, expect, it } from "vitest";

import {
  getDummyHash,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import { safeNextPath } from "@/lib/auth/safe-next";
import {
  SESSION_DAYS,
  hashToken,
  newSessionToken,
  sessionExpiry,
} from "@/lib/auth/tokens";
import {
  LOGIN_FAILED,
  isValidTimeZone,
  parseLoginForm,
  parseRegisterForm,
} from "@/lib/validation/auth";

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields))
    formData.append(name, value);
  return formData;
}

describe("passwords (Argon2id)", () => {
  it("stores a hash, never the password", async () => {
    const hash = await hashPassword("coffee and code");

    expect(hash).not.toContain("coffee");
    // The hash says which algorithm and settings made it, so we can verify it later.
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it("gives a different hash each time for the same password (a random salt)", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("accepts the right password and refuses a wrong one", async () => {
    const hash = await hashPassword("coffee and code");

    expect(await verifyPassword(hash, "coffee and code")).toBe(true);
    expect(await verifyPassword(hash, "Coffee and code")).toBe(false);
  });

  it("treats a fake hash (the demo user's '!') as a wrong password", async () => {
    expect(await verifyPassword("!", "anything")).toBe(false);
  });

  it("has a real dummy hash for the 'unknown email' check", async () => {
    expect(await getDummyHash()).toMatch(/^\$argon2id\$/);
  });
});

describe("session tokens", () => {
  it("makes long random tokens that never repeat", () => {
    const tokens = new Set(Array.from({ length: 100 }, newSessionToken));

    expect(tokens.size).toBe(100);
    expect(newSessionToken().length).toBeGreaterThanOrEqual(43); // 32 bytes in base64url
  });

  it("stores the SHA-256 of a token: 64 hex characters, the same every time", () => {
    const token = newSessionToken();

    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(hashToken(newSessionToken()));
  });

  it(`ends sessions after ${SESSION_DAYS} days`, () => {
    const now = new Date("2026-11-09T00:00:00Z");

    expect(sessionExpiry(now).toISOString()).toBe("2026-12-09T00:00:00.000Z");
  });
});

describe("safeNextPath (no open redirects)", () => {
  it.each(["/", "/posts/new", "/posts/12/edit", "/?before=40"])(
    "keeps the path %j on this site",
    (path) => {
      expect(safeNextPath(path)).toBe(path);
    },
  );

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "evil.example",
    "javascript:alert(1)",
    "/posts\n/new",
    "",
  ])("replaces %j with /", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });

  it("replaces a missing value with /", () => {
    expect(safeNextPath(null)).toBe("/");
  });
});

describe("the register form rules", () => {
  const valid = {
    username: "trung_57",
    email: "trung@example.com",
    password: "coffee and code",
    timeZone: "Australia/Adelaide",
  };

  it("accepts a normal account", () => {
    expect(parseRegisterForm(form(valid))).toEqual({
      success: true,
      data: valid,
    });
  });

  it.each(["ab", "a".repeat(21), "trung nam", "trung!"])(
    "refuses the username %j",
    (username) => {
      const result = parseRegisterForm(form({ ...valid, username }));

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.state.errors?.username?.[0]).toMatch(/3–20 characters/);
    },
  );

  it("refuses a short password, and never sends the password back", () => {
    const result = parseRegisterForm(form({ ...valid, password: "1234" }));

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.state.errors?.password).toEqual([
      "Password must be at least 8 characters.",
    ]);
    expect(JSON.stringify(result.state)).not.toContain("1234");
  });

  it("refuses an email that isn't one", () => {
    const result = parseRegisterForm(form({ ...valid, email: "trung" }));

    expect(result.success).toBe(false);
  });

  it("uses UTC when the browser sends a time zone that doesn't exist", () => {
    const result = parseRegisterForm(
      form({ ...valid, timeZone: "Mars/Olympus" }),
    );

    expect(result.success && result.data.timeZone).toBe("UTC");
  });

  it("knows real time zones", () => {
    expect(isValidTimeZone("Australia/Adelaide")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});

describe("the login form rules", () => {
  it("needs a password", () => {
    const result = parseLoginForm(
      form({ email: "trung@example.com", password: "" }),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.state.error).toBe("Enter your password.");
    expect(result.state.values).toEqual({ email: "trung@example.com" });
  });

  it("has one message for every failed login", () => {
    expect(LOGIN_FAILED).toBe("Email or password is incorrect.");
  });
});
