// A pretend browser cookie jar for tests. Outside Next.js, cookies() doesn't work,
// so the test files replace "next/headers" with this (see vi.mock in each file).
import type { SessionCookieOptions } from "@/lib/auth/cookie";

export function makeCookieJar() {
  const values = new Map<string, string>();
  const options = new Map<string, SessionCookieOptions | undefined>();

  return {
    values,
    options,
    /** What our code calls: `(await cookies()).get(...)` and `.set(...)`. */
    async cookies() {
      return {
        get: (name: string) =>
          values.has(name) ? { name, value: values.get(name)! } : undefined,
        has: (name: string) => values.has(name),
        set: (
          name: string,
          value: string,
          cookieOptions?: SessionCookieOptions,
        ) => {
          options.set(name, cookieOptions);
          // A browser deletes a cookie whose expiry date is in the past.
          if (
            cookieOptions?.expires &&
            cookieOptions.expires.getTime() <= Date.now()
          ) {
            values.delete(name);
          } else {
            values.set(name, value);
          }
        },
      };
    },
    clear() {
      values.clear();
      options.clear();
    },
  };
}

/** One shared jar for a test file. Tests call cookieJar.clear() in beforeEach. */
export const cookieJar = makeCookieJar();
