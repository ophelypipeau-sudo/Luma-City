import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { createApp } from "../apps/server/src/app.ts";
import { openDatabase } from "../apps/server/src/db.ts";
import { FURNITURE_MODELS, constrainPlacement, placementDepth } from "../packages/domain/src/housing.ts";
import type { HomeDecoration, HomeSnapshot } from "../packages/contracts/src/housing.ts";
import manifest from "../public/assets/housing/prune-v1/manifest.json";

type App = Awaited<ReturnType<typeof createApp>>;
const origin = "http://127.0.0.1:5173";
async function call(app: App, path: string, cookie?: string, body?: unknown) {
  const response = await app.inject({ method: body ? "POST" : "GET", url: `/api/${path}`, payload: body as object,
    headers: { origin, ...(cookie ? { cookie } : {}) } });
  return { status: response.statusCode, data: response.json(), cookie: response.headers["set-cookie"]?.toString().split(";")[0] };
}
async function enter(app: App, account: string, character: string) {
  const login = await call(app, "login", undefined, { account });
  assert.equal(login.status, 200);
  const activation = await call(app, "activate", login.cookie, { character });
  assert.equal(activation.status, 200);
  const cookie = login.cookie!, generation = activation.data.generation;
  return {
    cookie, generation,
    load: (ownerId = character) => call(app, "housing/load", cookie, { generation, ownerId }),
    save: (home: HomeSnapshot, decoration: HomeDecoration, operationId = randomUUID()) =>
      call(app, "housing/save", cookie, { generation, expectedRevision: home.revision, operationId, decoration }),
  };
}

test("La collection indépendante est transparente et reste hors boutique", async () => {
  for (const model of FURNITURE_MODELS) {
    assert.equal(model.published, false); assert.equal(model.price, null);
    const png = await readFile(`public${model.image}`);
    assert.equal(png.toString("ascii", 12, 16), "IHDR"); assert.equal(png[25], 6);
    const asset = (manifest as Record<string, { width: number; height: number; crop: number[]; transparent: number }>)[model.id];
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [asset.width, asset.height]);
    assert.ok(asset.transparent > asset.width * asset.height * .03);
    assert.equal(asset.crop.length, 4);
    assert.ok(asset.crop[0] + asset.crop[2] <= asset.width && asset.crop[1] + asset.crop[3] <= asset.height);
    for (const suffix of [".webp", ".thumb.webp"]) {
      const display = await readFile(`public${model.image.replace(/\.png$/, suffix)}`);
      assert.equal(display.toString("ascii", 8, 12), "WEBP");
    }
  }
});
test("Les ancrages gardent les objets dans leur bande et les tapis sous les meubles", () => {
  const floor = FURNITURE_MODELS.find((m) => m.id === "sofa")!;
  const wall = FURNITURE_MODELS.find((m) => m.id === "mirror")!;
  const rug = FURNITURE_MODELS.find((m) => m.id === "rug")!;
  const p = { itemId: randomUUID(), x: -50, y: 20, depth: 0 };
  assert.equal(constrainPlacement(floor, p).y, 422);
  assert.ok(constrainPlacement(floor, p).x >= floor.width / 2);
  assert.equal(constrainPlacement(wall, { ...p, y: 650 }).y, 408);
  assert.ok(placementDepth(rug, { ...p, y: 600, depth: 80 }) < placementDepth(floor, { ...p, y: 422, depth: -80 }));
});

test("Décoration : inventaire, déplacement, rangement, conflits et persistance après redémarrage", async () => {
  const directory = await mkdtemp(join(tmpdir(), "luma-housing-"));
  let db = await openDatabase(directory), app = await createApp(db);
  try {
    const iris = await enter(app, "aurore", "iris");
    const june = await enter(app, "sacha", "june");
    const loaded = await iris.load(); assert.equal(loaded.status, 200);
    const home: HomeSnapshot = loaded.data.home;
    assert.equal(home.items.length, 10); assert.equal(home.decoration.placements.length, 10);
    const again = await iris.load(); assert.deepEqual(again.data.home.items, home.items);
    const beforeWallet = (await call(app, "state", iris.cookie)).data.wardrobe.balance;
    const table = home.items.find((i) => i.modelId === "coffee-table")!;
    const sofa = home.items.find((i) => i.modelId === "sofa")!;
    const mirror = home.items.find((i) => i.modelId === "mirror")!;
    const decoration: HomeDecoration = { wall: "lilac", floor: "smoked", placements: home.decoration.placements
      .filter((p) => p.itemId !== table.id).map((p) => p.itemId === sofa.id ? { ...p, x: 480, y: 480, depth: 20 }
        : p.itemId === mirror.id ? { ...p, x: 650, y: 300 } : p) };
    const operationId = randomUUID();
    const saved = await iris.save(home, decoration, operationId);
    assert.equal(saved.status, 200); assert.equal(saved.data.home.revision, 1);
    assert.equal(saved.data.home.items.length, 10);
    assert.equal(saved.data.home.items.find((i: { id: string }) => i.id === table.id).roomId, null);
    assert.equal(saved.data.home.decoration.placements.length, 9);
    assert.equal((await call(app, "state", iris.cookie)).data.wardrobe.balance, beforeWallet);
    assert.equal((await iris.save(home, decoration, operationId)).data.home.revision, 1);
    assert.equal((await iris.save(home, { ...decoration, wall: "sage" }, operationId)).status, 400);
    assert.equal((await iris.save(home, decoration)).status, 400, "Révision obsolète refusée");
    const current: HomeSnapshot = saved.data.home;
    const duplicate = { ...decoration, placements: [...decoration.placements, decoration.placements[0]] };
    assert.equal((await iris.save(current, duplicate)).status, 400);
    assert.equal((await iris.save(current, { ...decoration, placements: [{ ...decoration.placements[0], itemId: randomUUID() }] })).status, 400);
    assert.equal((await iris.save(current, { ...decoration, placements: [{ ...decoration.placements[0], x: 0, y: 0 }] })).status, 400);
    const juneHome = (await june.load()).data.home as HomeSnapshot;
    assert.equal((await june.save(juneHome, decoration)).status, 400, "Meubles d’un autre personnage refusés");
    const forged = await call(app, "housing/save", june.cookie, { generation: june.generation, expectedRevision: current.revision,
      operationId: randomUUID(), decoration, ownerId: "iris" });
    assert.equal(forged.status, 400, "Le client ne peut pas cibler une maison tierce");
    const visitor = await june.load("iris");
    assert.equal(visitor.status, 200); assert.equal(visitor.data.home.items.length, 9, "Inventaire rangé privé");
    // Use a stored block to exercise the same bilateral access policy as the room entry route.
    await db.query("INSERT INTO blocks VALUES ('june','iris') ON CONFLICT DO NOTHING");
    assert.equal((await june.load("iris")).status, 400, "Identifiant direct bloqué");
    assert.equal((await call(app, "housing/load", undefined, { generation: 1, ownerId: "iris" })).status, 401);
    await app.close(); await db.close();
    db = await openDatabase(directory); app = await createApp(db);
    const reconnected = await enter(app, "aurore", "iris");
    const restored: HomeSnapshot = (await reconnected.load()).data.home;
    assert.deepEqual(restored.decoration, current.decoration); assert.equal(restored.revision, 1);
    assert.equal(restored.items.length, 10, "La collection de départ n’est pas réattribuée");
    const withTable: HomeDecoration = { ...restored.decoration,
      placements: [...restored.decoration.placements, { itemId: table.id, x: 400, y: 500, depth: 0 }] };
    const placed = await reconnected.save(restored, withTable); assert.equal(placed.status, 200);
    assert.equal(placed.data.home.items.length, 10); assert.equal(placed.data.home.decoration.placements.length, 10);
    const otherRoom = randomUUID();
    await db.query("INSERT INTO home_rooms (id,home_id,kind) VALUES ($1,$2,'bedroom')", [otherRoom, restored.homeId]);
    await db.query("UPDATE furniture_placements SET room_id=$1 WHERE item_id=$2", [otherRoom, table.id]);
    assert.equal((await reconnected.save(placed.data.home, withTable)).status, 400, "Un exemplaire ne peut occuper deux pièces");
    const last = (await reconnected.load()).data.home as HomeSnapshot;
    const results = await Promise.all([reconnected.save(last, last.decoration), reconnected.save(last, last.decoration)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
  } finally { await app.close(); await db.close(); }
});

test("Une sauvegarde confirmée est diffusée aux visiteurs via le WebSocket existant", async () => {
  const db = await openDatabase("memory://"), app = await createApp(db);
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address(); assert.ok(address && typeof address !== "string");
  const sockets: WebSocket[] = [];
  function connect(cookie: string) {
    const ws = new WebSocket(`ws://127.0.0.1:${(address as { port: number }).port}/ws`, { headers: { origin, cookie } });
    sockets.push(ws);
    const events: any[] = [];
    ws.on("message", (data) => events.push(JSON.parse(data.toString())));
    return { ws, wait: async (type: string, predicate: (event: any) => boolean = () => true) => {
      const until = Date.now() + 6000;
      while (Date.now() < until) {
        const event = events.find((e) => e.type === type && predicate(e)); if (event) return event;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      throw new Error(`Événement attendu : ${type}`);
    } };
  }
  try {
    const iris = await enter(app, "aurore", "iris"), june = await enter(app, "sacha", "june");
    const home = (await iris.load()).data.home as HomeSnapshot;
    const first = connect(iris.cookie), visitor = connect(june.cookie);
    await Promise.all([first.wait("welcome"), visitor.wait("welcome")]);
    for (const [socket, generation] of [[first.ws, iris.generation], [visitor.ws, june.generation]] as const)
      socket.send(JSON.stringify({ type: "join-room", generation, roomId: "home:iris" }));
    await visitor.wait("room", (event) => event.roomId === "home:iris" && event.players.length === 2);
    const decoration: HomeDecoration = { ...home.decoration, wall: "sage", placements: home.decoration.placements.slice(1) };
    assert.equal((await iris.save(home, decoration)).status, 200);
    const update = await visitor.wait("home-layout", (event) => event.home.revision === 1);
    assert.equal(update.home.revision, 1); assert.equal(update.home.decoration.wall, "sage");
    assert.equal(update.home.decoration.placements.length, 9); assert.equal(update.home.items.length, 9);
    assert.equal(new Set(update.home.items.map((i: { id: string }) => i.id)).size, 9);
    assert.equal((await june.load("iris")).data.home.revision, 1);
  } finally { for (const ws of sockets) ws.terminate(); await app.close(); await db.close(); }
});
