// Runs the new migrations: `pnpm db:migrate`
import "./load-env";

import { Client } from "pg";

import { getEnv } from "@/lib/env";
import { runMigrations } from "@/lib/migrations";

async function main() {
  // A single direct connection (not the pool): migrations are a one-off job.
  const client = new Client({ connectionString: getEnv().DATABASE_URL });
  await client.connect();
  try {
    console.log("Running migrations...");
    const ran = await runMigrations(client, "db/migrations", console.log);
    console.log(
      ran.length === 0
        ? "Nothing to do: the database is up to date."
        : `Done: ${ran.length} migration(s).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
