import { z } from "zod";

// The settings the server needs, checked with Zod.
// If one is missing or wrong, we stop with a clear message instead of a strange error later.
const postgresUrl = (name: string) =>
  z
    .url({
      protocol: /^postgres(ql)?$/,
      error: `${name} must look like postgres://user:password@host:5432/database`,
    })
    .transform(verifyFull);

/**
 * Neon's URLs say `sslmode=require`. Today the pg library already treats that as "verify-full"
 * (check the certificate AND the host name), but it prints a long SECURITY WARNING in the logs,
 * because pg v9 will make "require" weaker. Saying "verify-full" ourselves keeps the same safe
 * behaviour, now and after pg v9, and keeps the logs clean.
 */
export function verifyFull(url: string): string {
  const parsed = new URL(url);
  const mode = parsed.searchParams.get("sslmode");
  if (mode !== "prefer" && mode !== "require" && mode !== "verify-ca") {
    return url; // no SSL setting (your laptop), or already verify-full: unchanged
  }
  parsed.searchParams.set("sslmode", "verify-full");
  return parsed.toString();
}

const envSchema = z.object({
  // The app's connection. On Vercel + Neon this goes through a connection pooler.
  DATABASE_URL: postgresUrl("DATABASE_URL"),
  // Optional: a DIRECT connection (no pooler), set by the Neon integration on Vercel.
  // Migrations use it, because their lock needs one connection from start to end.
  DATABASE_URL_UNPOOLED: postgresUrl("DATABASE_URL_UNPOOLED").optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Checks a set of variables (used by getEnv, and directly in tests). */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}\n` +
        "Copy .env.example to .env.local and check the values.",
    );
  }
  return result.data;
}

let cached: Env | undefined;

/**
 * Reads process.env the first time it's called, then remembers the result.
 * It is "lazy" on purpose: `next build` and `next typegen` never call it,
 * so they work even on a machine with no database settings.
 */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
