import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { ClientBase } from "pg";

// Any fixed number works; every migration run uses the same one.
const MIGRATION_LOCK_ID = 727_001;

const MIGRATION_FILE = /^\d{4}_[a-z0-9_]+\.sql$/;

/**
 * Runs every migration file in `dir` that hasn't run yet, in name order.
 *
 * - Each file runs inside a transaction: all of it works, or none of it does.
 * - Each finished file is written in the `schema_migrations` log book.
 * - An advisory lock makes sure two deploys can't migrate at the same time.
 *
 * Returns the names of the files that ran.
 */
export async function runMigrations(
  client: ClientBase,
  dir: string,
  log: (message: string) => void = () => {},
): Promise<string[]> {
  await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const done = await client.query<{ name: string }>(
      "SELECT name FROM schema_migrations",
    );
    const alreadyRan = new Set(done.rows.map((row) => row.name));

    const files = (await readdir(dir))
      .filter((file) => MIGRATION_FILE.test(file))
      .sort();

    const ran: string[] = [];
    for (const file of files) {
      if (alreadyRan.has(file)) continue;

      const sql = await readFile(path.join(dir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Migration ${file} failed: ${message}`);
      }
      ran.push(file);
      log(`  ✓ ${file}`);
    }
    return ran;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
  }
}
