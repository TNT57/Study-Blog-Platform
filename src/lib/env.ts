import { z } from "zod";

// The settings the server needs, checked with Zod.
// If one is missing or wrong, we stop with a clear message instead of a strange error later.
const envSchema = z.object({
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error:
      "DATABASE_URL must look like postgres://user:password@host:5432/database",
  }),
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
