// Playwright runs end-to-end (E2E) tests: a real browser clicks through the real app,
// like a person would. Run them with `pnpm test:e2e` (the database must be running).
import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const inCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  // The tests share one database, so they run one after another.
  workers: 1,
  forbidOnly: inCI,
  retries: inCI ? 1 : 0,
  reporter: inCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // On a failed retry, save a "trace": a replay of every step, to see what went wrong.
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Starts the app before the tests. On your laptop it reuses `pnpm dev` if it's already running.
  // CI builds first, then tests the production server.
  webServer: {
    command: inCI ? `pnpm start -p ${PORT}` : `pnpm dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !inCI,
    timeout: 120_000,
  },
});
