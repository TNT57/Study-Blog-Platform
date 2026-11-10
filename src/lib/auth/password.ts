// Passwords are HASHED, never encrypted and never stored as they are.
// A hash is one-way, like a fingerprint: you can check a password against it,
// but you can't turn it back into the password.
import { randomBytes } from "node:crypto";

import { hash, verify } from "@node-rs/argon2";

// Argon2id with the settings OWASP recommends (19 MiB of memory, 2 passes, 1 thread).
// The memory cost is what makes guessing slow and expensive for an attacker.
// (Argon2id is the library's default algorithm.)
const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/** true when the password matches. A broken or fake hash (like the demo user's "!") is just false. */
export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/**
 * A real hash of a random password that nobody knows.
 * When someone logs in with an email that doesn't exist, we still check a password
 * against this hash. Then "unknown email" takes as long as "wrong password",
 * and the response time can't tell an attacker which emails have an account.
 */
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}
