import { existsSync } from "node:fs";

// Next.js reads .env.local for the app by itself. These scripts run outside
// Next.js, so they read it themselves. (In CI there is no file; CI sets the variables.)
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
