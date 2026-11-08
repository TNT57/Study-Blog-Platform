import { pgErrorCode } from "@/lib/db";
import { createUser, type NewUser, type User } from "@/models/user.model";

let counter = 0;

/** Creates a user with sensible defaults. Pass only what your test cares about. */
export async function makeUser(
  overrides: Partial<NewUser> = {},
): Promise<User> {
  counter += 1;
  return createUser({
    username: `user_${counter}`,
    email: `user${counter}@example.com`,
    passwordHash: "test-hash",
    timeZone: "Australia/Adelaide",
    ...overrides,
  });
}

/** Runs `action`, expects Postgres to refuse it, and returns the error code. */
export async function expectDbError(
  action: () => Promise<unknown>,
): Promise<string> {
  try {
    await action();
  } catch (error) {
    const code = pgErrorCode(error);
    if (code) return code;
    throw error;
  }
  throw new Error("Expected the database to refuse this, but it was accepted.");
}
