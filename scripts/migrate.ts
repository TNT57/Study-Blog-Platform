// Runs the new migrations: `pnpm db:migrate`
import "./load-env";

import { Client } from "pg";

import { getEnv } from "@/lib/env";
import { runMigrations } from "@/lib/migrations";

async function main() {
  // A single DIRECT connection (not the pool): migrations are a one-off job.
  // On Vercel + Neon, DATABASE_URL goes through a pooler (PgBouncer), which can hand each
  // statement a different connection. Our advisory lock belongs to ONE connection, so
  // migrations use the unpooled URL when there is one.
  const env = getEnv();
  const client = new Client({
    connectionString: env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL,
  });
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
