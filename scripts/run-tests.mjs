// Runs the test suite in an environment stripped of the app's deployment settings.
// `npm run build` runs the tests on Railway, where DATABASE_URL, APP_ORIGIN, PORT and
// the Neon Auth URLs describe production: tests must never see them.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";

const APP_SETTINGS = new Set([
  "APP_ORIGIN", "PORT", "LOG_LEVEL", "IRIS_ONLY", "XP_MULTIPLIER",
  "DATABASE_URL", "DATABASE_URL_UNPOOLED",
  "PROFILE_IMAGE_VIP_ACCOUNTS", "ATELIER_EDITOR_ACCOUNT",
  "ATELIER_IMAGE_MODEL", "ATELIER_VISION_MODEL", "OPENAI_API_KEY",
]);
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
  !APP_SETTINGS.has(key) && !/^(RAILWAY_|NEON_|PG[A-Z]*$)/.test(key)));

const files = process.argv.length > 2
  ? process.argv.slice(2)
  : readdirSync("tests").filter((name) => name.endsWith(".test.ts")).sort().map((name) => "tests/" + name);
const tsx = createRequire(import.meta.url).resolve("tsx/cli");
const result = spawnSync(process.execPath, [tsx, "--test", ...files], { env, stdio: "inherit" });
process.exit(result.status ?? 1);
