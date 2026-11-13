import { openDatabase } from "./db.ts";
import { createApp } from "./app.ts";
import { existsSync } from "node:fs";
import { createNeonPlayerAuth } from "./neon-auth.ts";
if (existsSync(".env")) process.loadEnvFile(".env");
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { NEON_AUTH_BASE_URL, NEON_AUTH_JWKS_URL } = process.env;
if (Boolean(NEON_AUTH_BASE_URL) !== Boolean(NEON_AUTH_JWKS_URL))
  throw new Error("La configuration de Neon Auth est incomplète.");
const neonAuth = NEON_AUTH_BASE_URL && NEON_AUTH_JWKS_URL
  ? createNeonPlayerAuth(NEON_AUTH_BASE_URL, NEON_AUTH_JWKS_URL) : undefined;
const db = await openDatabase();
const app = await createApp(db, { recover: true, irisOnly: process.env.IRIS_ONLY === "1", neonAuth });
await app.listen({ host: "127.0.0.1", port: Number(process.env.PORT ?? 3001) });
console.log(
  "Prototype local : serveur http://127.0.0.1:3001 — client http://127.0.0.1:5173",
);
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
