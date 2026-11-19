/** Isolated local review: never reads DATABASE_URL or the normal player database. */
import { createServer } from "vite";
import { openDatabase } from "../apps/server/src/db.ts";
import { createApp } from "../apps/server/src/app.ts";
import { buyCompanion, equipCompanion } from "../apps/server/src/companions.ts";
import { randomUUID } from "node:crypto";
import { FURNITURE_MODELS } from "../packages/domain/src/housing.ts";
import { housingQaProxy } from "./housing-qa-proxy.ts";
const qa = process.argv.includes("--qa");
const commerce = qa || process.argv.includes("--commerce");
const access = qa || process.argv.includes("--access");
const visits = access || commerce || process.argv.includes("--visits");
const db = await openDatabase(qa ? ".cache/housing-review-qa" : access ? ".cache/housing-review-v6" : commerce ? ".cache/housing-review-v5" : visits ? ".cache/housing-review-v4" : ".cache/housing-review");
process.env.APP_ORIGIN = "http://127.0.0.1:5176";
const app = await createApp(db, { housingCommercePreview: commerce });
if (commerce) {
  // Demonstration prices only. Never seeds offers in a normal or public database.
  for (const [index, model] of FURNITURE_MODELS.entries())
    await db.query(`INSERT INTO furniture_offers (model_id,version,price,approved,enabled)
      VALUES ($1,$2,$3,TRUE,TRUE) ON CONFLICT DO NOTHING`,
      [model.id, randomUUID(), [1200,600,400,250,350,200,800,300,180,650][index]]);
}
if (visits) {
  // Repeatable social scenario in a separate demo DB, using the existing collection.
  await db.transaction(async (q) => {
    for (const [character, account, model, name] of [["iris", "aurore", "01-mochi", "Nuage"], ["june", "sacha", "06-luna", "Plume"]]) {
      const receipt = await buyCompanion(q, character, account, model, name, 10000);
      await equipCompanion(q, character, receipt.animal.id);
    }
    await q(`INSERT INTO profile_relations (first_id,second_id,kind,requester,accepted)
      VALUES ('iris','june','friend','iris',TRUE) ON CONFLICT DO NOTHING`);
  });
}
await app.listen({ host: "127.0.0.1", port: 3002 });
const vite = await createServer({ plugins: qa ? [housingQaProxy()] : [], cacheDir: ".cache/housing-vite", optimizeDeps: { entries: ["index.html"] },
  server: { watch: { ignored: ["**/.cache/**", "**/.data/**", "**/dist/**", "**/docs/**"] }, host: "127.0.0.1", port: 5176, strictPort: true,
  proxy: { "/api": "http://127.0.0.1:3002", "/ws": { target: "ws://127.0.0.1:3002", ws: true } } } });
await vite.listen();
console.log("Recette maisons isolée : http://127.0.0.1:5176/");
async function stop() { await vite.close(); await app.close(); await db.close(); process.exit(0); }
process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
