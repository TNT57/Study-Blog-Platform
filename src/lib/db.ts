import { Pool, types, type QueryResultRow } from "pg";

import { getEnv } from "./env";

// Type trap 1: Postgres DATE ("2026-11-04") would become a JS Date at midnight
// in the server's time zone, which can shift the day. Keep it as plain text.
types.setTypeParser(types.builtins.DATE, (value: string) => value);

// Type trap 2: COUNT(*) and SUM(...) return bigint, and pg turns bigint into a
// STRING ("50"), because JS numbers can't hold every bigint. Our rule: cast them
// in SQL, e.g. `COUNT(*)::int`. Our ids are `integer`, so they are normal numbers.

// One shared pool for the whole server ("a key ring": a few connections, reused).
// We keep it on globalThis because in development, Next.js reloads files when you
// save, and without this every reload would open a new pool.
const globalForDb = globalThis as unknown as { pool?: Pool };

export function getPool(): Pool {
  globalForDb.pool ??= new Pool({
    connectionString: getEnv().DATABASE_URL,
    max: 5,
  });
  return globalForDb.pool;
}

/**
 * Runs one parameterized query and returns the rows.
 * Always pass values in `params` ($1, $2, ...), never inside the SQL text.
 */
export async function query<Row extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<Row[]> {
  const result = await getPool().query<Row>(text, params);
  return result.rows;
}

/** Closes the pool. Scripts and tests call this when they finish. */
export async function closePool(): Promise<void> {
  const pool = globalForDb.pool;
  globalForDb.pool = undefined;
  await pool?.end();
}

/** The Postgres error code, e.g. "23505" = unique violation, "23514" = CHECK failed. */
export function pgErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    return typeof error.code === "string" ? error.code : undefined;
  }
  return undefined;
}
