import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../apps/server/src/app.ts";
import { openDatabase } from "../apps/server/src/db.ts";
import { FURNITURE_MODELS } from "../packages/domain/src/housing.ts";

type App = Awaited<ReturnType<typeof createApp>>;
async function call(app: App, path: string, cookie?: string, body?: object) {
  const response = await app.inject({ method: body ? "POST" : "GET", url: `/api/${path}`, payload: body,
    headers: { origin: "http://127.0.0.1:5173", ...(cookie ? { cookie } : {}) } });
  return { status: response.statusCode, data: response.json(), cookie: response.headers["set-cookie"]?.toString().split(";")[0] };
}
async function enter(app: App, account = "aurore", character = "iris") {
  const login = await call(app, "login", undefined, { account }); assert.equal(login.status, 200);
  const active = await call(app, "activate", login.cookie, { character }); assert.equal(active.status, 200);
  const cookie = login.cookie!, generation = active.data.generation as number;
  return { cookie, generation, call: (path: string, body?: object) => call(app, path, cookie, body && { generation, ...body }) };
}
const command = (version: string, price: number, modelId = "plant", operationId = randomUUID()) =>
  ({ operationId, modelId, offerVersion: version, expectedPrice: price });

test("Meubles hors vente par défaut, même si une offre d’essai existe en base", async () => {
  const db = await openDatabase("memory://"), app = await createApp(db);
  try {
    const iris = await enter(app), version = randomUUID();
    assert.equal((await iris.call("housing/catalog", {})).data.offers.length, 0);
    await db.query("INSERT INTO furniture_offers VALUES ('plant',$1,200,TRUE,TRUE)", [version]);
    assert.equal((await iris.call("housing/catalog", {})).data.preview, false);
    assert.equal((await iris.call("housing/buy", command(version, 200))).status, 400);
    assert.equal((await db.query("SELECT * FROM furniture_purchases")).rows.length, 0);
    for (const model of FURNITURE_MODELS) { assert.equal(model.published, false); assert.equal(model.price, null); }
    assert.equal((await call(app, "housing/buy", undefined, { generation: 1, ...command(version, 200) })).status, 401);
  } finally { await app.close(); await db.close(); }
});

test("Achats atomiques : exemplaires multiples, reçu durable, inventaire privé et monnaie partagée", async () => {
  const directory = await mkdtemp(join(tmpdir(), "luma-furniture-"));
  let db = await openDatabase(directory), app = await createApp(db, { housingCommercePreview: true });
  let purchase: ReturnType<typeof command>, purchasedId: string;
  try {
    const iris = await enter(app), june = await enter(app, "sacha", "june"), version = randomUUID();
    await db.query("INSERT INTO furniture_offers VALUES ('plant',$1,200,TRUE,TRUE)", [version]);
    purchase = command(version, 200);
    const [first, duplicate] = await Promise.all([iris.call("housing/buy", purchase), iris.call("housing/buy", purchase)]);
    assert.equal(first.status, 200); assert.equal(duplicate.status, 200);
    assert.equal(first.data.itemId, duplicate.data.itemId); assert.equal(first.data.charged + duplicate.data.charged, 200);
    assert.equal(duplicate.data.balance, 9800); assert.equal(duplicate.data.home.items.length, 11);
    purchasedId = first.data.itemId;
    assert.equal(first.data.home.items.find((i: any) => i.id === purchasedId).roomId, null);
    assert.equal((await iris.call("housing/buy", { ...purchase, expectedPrice: 1 })).status, 400);
    const another = await iris.call("housing/buy", command(version, 200)); assert.equal(another.status, 200);
    assert.notEqual(another.data.itemId, purchasedId); assert.equal(another.data.balance, 9600);
    assert.equal((await iris.call("state")).data.wardrobe.balance, 9600);
    assert.equal((await june.call("housing/load", { ownerId: "iris" })).data.home.items.length, 10);
    let home = another.data.home;
    const decoration = { ...home.decoration, placements: [...home.decoration.placements, { itemId: purchasedId, x: 720, y: 433, depth: 0 }] };
    let saved = await iris.call("housing/save", { expectedRevision: home.revision, operationId: randomUUID(), decoration });
    assert.equal(saved.status, 200); home = saved.data.home;
    assert.equal((await june.call("housing/load", { ownerId: "iris" })).data.home.items.length, 11);
    const foreign = (await june.call("housing/load", { ownerId: "june" })).data.home;
    assert.equal((await june.call("housing/save", { expectedRevision: foreign.revision, operationId: randomUUID(),
      decoration: { ...foreign.decoration, placements: [...foreign.decoration.placements, { itemId: purchasedId, x: 720, y: 433, depth: 0 }] } })).status, 400);
    saved = await iris.call("housing/save", { expectedRevision: home.revision, operationId: randomUUID(),
      decoration: { ...home.decoration, placements: home.decoration.placements.filter((p: any) => p.itemId !== purchasedId) } });
    assert.equal(saved.status, 200); assert.equal(saved.data.home.items.length, 12);
    assert.equal(saved.data.home.items.find((i: any) => i.id === purchasedId).roomId, null);
    // Another character has the same wallet, but a separate inventory.
    const activated = await call(app, "activate", iris.cookie, { character: "milo" }); assert.equal(activated.status, 200);
    const milo = await call(app, "housing/catalog", iris.cookie, { generation: activated.data.generation });
    assert.equal(milo.data.balance, 9600); assert.equal(milo.data.home.items.length, 10);
    assert.equal((await call(app, "housing/buy", iris.cookie, { generation: activated.data.generation, ...purchase })).status, 400);
    assert.equal((await iris.call("housing/buy", command(version, 200))).status, 400); // old generation
  } finally { await app.close(); await db.close(); }
  db = await openDatabase(directory); app = await createApp(db, { housingCommercePreview: true });
  try {
    const iris = await enter(app);
    // A committed receipt remains replayable even after withdrawal of its offer.
    await db.query("UPDATE furniture_offers SET enabled=FALSE");
    const retry = await iris.call("housing/buy", purchase!);
    assert.equal(retry.status, 200); assert.equal(retry.data.replayed, true); assert.equal(retry.data.charged, 0);
    assert.equal(retry.data.balance, 9600); assert.equal(retry.data.itemId, purchasedId!);
    assert.equal(retry.data.home.items.length, 12);
  } finally { await app.close(); await db.close(); }
});

test("Prix serveur, offres non validées, fonds insuffisants, concurrence et rollback", async () => {
  const db = await openDatabase("memory://"), app = await createApp(db, { housingCommercePreview: true });
  try {
    const iris = await enter(app), version = randomUUID();
    await iris.call("housing/catalog", {});
    await db.query("INSERT INTO furniture_offers VALUES ('plant',$1,6000,FALSE,TRUE)", [version]);
    assert.equal((await iris.call("housing/catalog", {})).data.offers.length, 0);
    assert.equal((await iris.call("housing/buy", command(version, 6000))).status, 400);
    await db.query("UPDATE furniture_offers SET approved=TRUE,enabled=FALSE");
    assert.equal((await iris.call("housing/buy", command(version, 6000))).status, 400);
    await db.query("UPDATE furniture_offers SET enabled=TRUE");
    for (const payload of [command(version, 1), command(randomUUID(), 6000), command(version, 6000, "unknown"),
      { ...command(version, 6000), price: 0 }, { ...command(version, 6000), ownerId: "june" }])
      assert.equal((await iris.call("housing/buy", payload)).status, 400);
    // Force failure after item attribution, before receipt insertion. The whole transaction rolls back.
    await db.exec(`CREATE FUNCTION reject_furniture_purchase() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'test purchase failure'; END $$;
      CREATE TRIGGER reject_purchase BEFORE INSERT ON furniture_purchases FOR EACH ROW EXECUTE FUNCTION reject_furniture_purchase();`);
    assert.equal((await iris.call("housing/buy", command(version, 6000))).status, 500);
    assert.equal((await iris.call("housing/catalog", {})).data.home.items.length, 10);
    assert.equal((await iris.call("state")).data.wardrobe.balance, 10000);
    await db.exec("DROP TRIGGER reject_purchase ON furniture_purchases");
    const results = await Promise.all([iris.call("housing/buy", command(version, 6000)), iris.call("housing/buy", command(version, 6000))]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200,400]);
    assert.equal((await iris.call("state")).data.wardrobe.balance, 4000);
    const pet = await iris.call("companions/buy", { modelId: "01-mochi", name: "Nuage" });
    assert.equal(pet.status, 200); assert.equal(pet.data.balance, 2800);
    assert.equal((await iris.call("housing/catalog", {})).data.balance, 2800);
    assert.equal((await iris.call("housing/buy", command(version, 6000))).status, 400);
    assert.equal((await db.query("SELECT * FROM furniture_purchases")).rows.length, 1);
  } finally { await app.close(); await db.close(); }
});
