import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Database tests use their own database, which is wiped on every run.
// Order: CI's variable → your .env.local → the Docker default.
const local = existsSync(".env.local")
  ? parseEnv(readFileSync(".env.local", "utf8"))
  : {};
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  local.TEST_DATABASE_URL ??
  "postgres://study:study@localhost:5432/study_blog_test";
process.env.TEST_DATABASE_URL = testDatabaseUrl; // read by tests/db/global-setup.ts

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Lets tests use the same "@/..." imports as the app (from tsconfig.json).
    tsconfigPaths: true,
  },
  test: {
    projects: [
      {
        // Fast tests for components and pure functions, in a fake browser.
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["tests/unit/**/*.test.{ts,tsx}"],
          setupFiles: ["./tests/setup.ts"],
        },
      },
      {
        // Model tests on a real PostgreSQL.
        extends: true,
        test: {
          name: "db",
          environment: "node",
          include: ["tests/db/**/*.test.ts"],
          globalSetup: ["./tests/db/global-setup.ts"],
          setupFiles: ["./tests/db/setup.ts"],
          // One file at a time: they share one database.
          fileParallelism: false,
          env: { DATABASE_URL: testDatabaseUrl },
        },
      },
    ],
  },
});
