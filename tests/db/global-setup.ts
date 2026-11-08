// Runs once before all database tests: rebuilds the test database from zero.
import { Client } from "pg";

import { runMigrations } from "../../src/lib/migrations";

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set.");

  // Safety catch: this wipes the database, so it must be a test database.
  const name = new URL(url).pathname.slice(1);
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to wipe "${name}": the test database name must end in "_test".`,
    );
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Can't reach the test database (${message}). Is it running? Try \`pnpm db:up\`.`,
    );
  }
  try {
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    await runMigrations(client, "db/migrations");
  } finally {
    await client.end();
  }
}
