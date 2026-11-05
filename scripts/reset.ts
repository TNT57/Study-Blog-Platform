// Deletes EVERYTHING in your local database, then migrates and seeds again: `pnpm db:reset`
// Use it after you change a migration that isn't merged yet.
import "./load-env";

import { execFileSync } from "node:child_process";

import { Client } from "pg";

import { getEnv } from "@/lib/env";

async function main() {
  const url = new URL(getEnv().DATABASE_URL);
  // Safety catch: never wipe a database on another machine (like production).
  if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error(
      `db:reset only works on a local database, not "${url.hostname}".`,
    );
  }

  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  try {
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    console.log(`Wiped ${url.pathname.slice(1)}.`);
  } finally {
    await client.end();
  }

  execFileSync("pnpm", ["db:migrate"], { stdio: "inherit" });
  execFileSync("pnpm", ["db:seed"], { stdio: "inherit" });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
