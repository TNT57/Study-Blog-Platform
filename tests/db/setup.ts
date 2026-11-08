// Runs around every database test file.
import { afterAll, beforeEach } from "vitest";

import { closePool, query } from "@/lib/db";

// Start each test with empty tables, so tests can't affect each other.
beforeEach(async () => {
  const tables = await query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = 'public' AND tablename <> 'schema_migrations'`,
  );
  if (tables.length === 0) return;
  // Table names come from Postgres itself (not from users), so building this SQL is safe.
  const list = tables.map((t) => `"${t.tablename}"`).join(", ");
  await query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await closePool();
});
