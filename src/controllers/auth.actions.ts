"use server";
// CONTROLLER (changes) for accounts: register, log in, log out. Public endpoints, like every
// Server Action, so each one checks its own input.

import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/safe-next";
import {
  getDummyHash,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import { pgErrorCode } from "@/lib/db";
import {
  LOGIN_FAILED,
  parseLoginForm,
  parseRegisterForm,
  type LoginFormState,
  type RegisterFormState,
} from "@/lib/validation/auth";
import { createUser, findUserByEmail } from "@/models/user.model";

import { endSession, startSession } from "./session";

/** "/posts/new" + "welcome" → "/posts/new?toast=welcome" (keeps any query that is already there). */
function withToast(path: string, toast: string): string {
  const url = new URL(path, "http://local");
  url.searchParams.set("toast", toast);
  return `${url.pathname}${url.search}${url.hash}`;
}

/** The name of the UNIQUE index that refused a new user, e.g. "users_email_unique". */
function constraintOf(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "constraint" in error) {
    return typeof error.constraint === "string" ? error.constraint : undefined;
  }
  return undefined;
}

export async function register(
  _previous: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const result = parseRegisterForm(formData);
  if (!result.success) return result.state;
  const { username, email, password, timeZone } = result.data;

  let userId: number;
  try {
    const user = await createUser({
      username,
      email,
      passwordHash: await hashPassword(password),
      timeZone,
    });
    userId = user.id;
  } catch (error) {
    // 23505 = a UNIQUE rule said no. The database is the referee: two people pressing
    // "Create account" at the same moment can't both get the same name.
    if (pgErrorCode(error) === "23505") {
      return {
        values: { username, email },
        errors:
          constraintOf(error) === "users_email_unique"
            ? {
                email: [
                  "An account with this email already exists. Log in instead.",
                ],
              }
            : { username: ["This username is already taken."] },
      };
    }
    throw error;
  }

  await startSession(userId);
  redirect(withToast(safeNextPath(formData.get("next")), "welcome"));
}

export async function login(
  _previous: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const result = parseLoginForm(formData);
  if (!result.success) return result.state;
  const { email, password } = result.data;

  // ONE message for "no such email" and for "wrong password", so nobody can use this form
  // to find out who has an account.
  const failed: LoginFormState = { values: { email }, error: LOGIN_FAILED };

  const user = await findUserByEmail(email);
  if (!user) {
    // Same work as a real check, so the response time doesn't give the answer away either.
    await verifyPassword(await getDummyHash(), password);
    return failed;
  }
  if (!(await verifyPassword(user.passwordHash, password))) return failed;

  await startSession(user.id);
  redirect(withToast(safeNextPath(formData.get("next")), "logged-in"));
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/?toast=logged-out");
}
