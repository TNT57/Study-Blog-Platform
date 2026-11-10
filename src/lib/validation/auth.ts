// VALIDATION for register and login.
// The username rule matches the CHECK in db/migrations/0001_create_users.sql.
import { z } from "zod";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/** true for a real IANA time zone name, like "Australia/Adelaide". */
export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return value.length > 0;
  } catch {
    return false;
  }
}

const email = z
  .string()
  .trim()
  .max(254, "Email must be 254 characters or fewer.")
  .pipe(z.email("Enter a valid email, like name@example.com."));

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9_]{3,20}$/,
      "Username must be 3–20 characters: letters, numbers and _ only.",
    ),
  email,
  // Passwords are NOT trimmed: a space can be part of a good password.
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`)
    .max(PASSWORD_MAX, `Password must be ${PASSWORD_MAX} characters or fewer.`),
  // Sent by the browser in a hidden field. Never trusted: a bad value becomes "UTC".
  timeZone: z
    .string()
    .transform((value) => (isValidTimeZone(value) ? value : "UTC")),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** What the register form gets back. The password is never sent back to the browser. */
export type RegisterFormState = {
  values: { username: string; email: string };
  errors?: Partial<Record<"username" | "email" | "password", string[]>>;
};

export type LoginFormState = {
  values: { email: string };
  /** One message for every kind of failure, on purpose (see docs/learn/03-auth.md). */
  error?: string;
};

export const LOGIN_FAILED = "Email or password is incorrect.";

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function parseRegisterForm(
  formData: FormData,
):
  | { success: true; data: RegisterInput }
  | { success: false; state: RegisterFormState } {
  const raw = {
    username: readText(formData, "username"),
    email: readText(formData, "email"),
    password: readText(formData, "password"),
    timeZone: readText(formData, "timeZone"),
  };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const { username, email, password } = z.flattenError(
      parsed.error,
    ).fieldErrors;
    return {
      success: false,
      state: {
        values: { username: raw.username, email: raw.email },
        errors: { username, email, password },
      },
    };
  }
  return { success: true, data: parsed.data };
}

export function parseLoginForm(
  formData: FormData,
):
  | { success: true; data: LoginInput }
  | { success: false; state: LoginFormState } {
  const raw = {
    email: readText(formData, "email"),
    password: readText(formData, "password"),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return {
      success: false,
      state: {
        values: { email: raw.email },
        error: errors.email?.[0] ?? errors.password?.[0] ?? LOGIN_FAILED,
      },
    };
  }
  return { success: true, data: parsed.data };
}
