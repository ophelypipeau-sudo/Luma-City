import { openDatabase } from "./db.ts";
import { createApp } from "./app.ts";
import { existsSync } from "node:fs";
import { createNeonPlayerAuth } from "./neon-auth.ts";
if (existsSync(".env")) process.loadEnvFile(".env");
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { NEON_AUTH_BASE_URL, NEON_AUTH_JWKS_URL } = process.env;
const onRailway = Boolean(process.env.RAILWAY_ENVIRONMENT_ID);
const publicOrigin = onRailway ? process.env.APP_ORIGIN : undefined;
if (onRailway && (!publicOrigin || !process.env.DATABASE_URL || !NEON_AUTH_BASE_URL || !NEON_AUTH_JWKS_URL))
  throw new Error("Configure APP_ORIGIN, DATABASE_URL et les deux variables Neon Auth sur Railway.");
if (Boolean(NEON_AUTH_BASE_URL) !== Boolean(NEON_AUTH_JWKS_URL))
  throw new Error("La configuration de Neon Auth est incomplète.");
const neonAuth = NEON_AUTH_BASE_URL && NEON_AUTH_JWKS_URL
  ? createNeonPlayerAuth(NEON_AUTH_BASE_URL, NEON_AUTH_JWKS_URL) : undefined;
const db = await openDatabase();
const app = await createApp(db, { recover: true, irisOnly: process.env.IRIS_ONLY === "1", neonAuth, publicOrigin });
const address = await app.listen({
  host: onRailway ? "0.0.0.0" : "127.0.0.1",
  port: Number(process.env.PORT ?? 3001),
});
console.log("Luma City écoute sur", address);
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await app.close();
  await db.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
