import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "../apps/server/src/app";
import { openDatabase } from "../apps/server/src/db";
import { FINISH_OFFER_VERSION, FINISH_CATEGORIES, HOME_FINISHES, DECORATION_FINISHES, finishCategory, finishDecoration, distinctFinishOffers, finishVisualFamily } from "../packages/domain/src/home-finishes";
import { homeDecorationSchema } from "../packages/contracts/src/housing";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeBackground } from "../apps/web/src/housing/HomeScene";

async function setup(directory = "memory://") {
  const db = await openDatabase(directory), app = await createApp(db);
  async function call(path: string, cookie?: string, body?: object) {
    const r = await app.inject({ method: body ? "POST" : "GET", url: `/api/${path}`, payload: body,
      headers: { origin: "http://127.0.0.1:5173", ...(cookie ? { cookie } : {}) } });
    return { status: r.statusCode, data: r.json(), cookie: r.headers["set-cookie"]?.toString().split(";")[0] };
  }
  async function enter(account = "aurore", character = "iris") {
    const login = await call("login", undefined, { account });
    const active = await call("activate", login.cookie, { character });
    return { post: (path: string, body: object = {}) => call(path, login.cookie, { generation: active.data.generation, ...body }),
      state: () => call("state", login.cookie) };
  }
  return { db, call, enter, close: async () => { await app.close(); await db.close(); } };
}
const command = (finishId = "wall:midnight", operationId = randomUUID()) => ({ finishId, operationId,
  offerVersion: FINISH_OFFER_VERSION, expectedPrice: HOME_FINISHES.find((f) => f.id === finishId)!.price });

test("Le catalogue regroupe les couleurs identiques en préservant les achats, le modèle posé et les dessins distincts", () => {
  const offers = distinctFinishOffers(DECORATION_FINISHES, ["wall:roses-blue", "floor:walnut"], ["floor:walnut"]);
  assert.equal(new Set(offers.map(finishVisualFamily)).size, offers.length);
  assert.ok(offers.some((offer) => offer.id === "wall:roses-blue"), "Le modèle acheté représente sa famille");
  assert.ok(offers.some((offer) => offer.id === "floor:walnut"), "Le parquet acheté et posé reste disponible");
  assert.equal(offers.filter((offer) => offer.kind === "floor").length, 10);
  assert.equal(offers.filter((offer) => offer.kind === "wall" && offer.pattern && offer.pattern !== "bricks").length, 10);
  assert.ok(offers.some((offer) => offer.value === "tile-checker"));
  assert.ok(offers.some((offer) => offer.value === "tile-ivory"));
  assert.equal(offers.filter((offer) => offer.pattern === "bricks").length, 3, "Les briques non recolorables restent distinctes");
  assert.equal(finishVisualFamily(HOME_FINISHES.find((offer) => offer.value === "dots-rose")!),
    finishVisualFamily(HOME_FINISHES.find((offer) => offer.value === "daisies-cream")!));
});

test("Les couleurs du papier peint persistent, restent visibles aux visiteurs et respectent la propriété du modèle", async () => {
  const directory = await mkdtemp(join(tmpdir(), "luma-wall-colors-"));
  let g = await setup(directory);
  const wallColors = { base: "#e5edf2", detail: "#6585a2" };
  try {
    const iris = await g.enter();
    let home = (await iris.post("housing/load", { ownerId: "iris" })).data.home;
    const decoration = { ...home.decoration, wall: "roses-blush", wallColors };
    const save = (value: object) => iris.post("housing/save", { expectedRevision: home.revision, operationId: randomUUID(), decoration: value });
    assert.equal((await save(decoration)).status, 400, "Une couleur ne débloque pas un modèle non acheté");
    assert.equal((await iris.post("housing/finishes/buy", command("wall:roses-blush"))).status, 200);
    for (const base of ["red", "#fff", "#000000;display:none", "url(https://example.com)"])
      assert.equal((await save({ ...decoration, wallColors: { ...wallColors, base } })).status, 400);
    assert.equal((await save({ ...decoration, wall: "brick-white" })).status, 400);
    const result = await save(decoration);
    assert.equal(result.status, 200);
    home = result.data.home;
    assert.deepEqual(home.decoration.wallColors, wallColors);
    const markup = renderToStaticMarkup(React.createElement("svg", null, React.createElement(HomeBackground, home.decoration)));
    assert.ok(markup.includes(wallColors.base));
    assert.ok(markup.includes("roses.webp"));
    assert.equal((await iris.state()).data.wardrobe.balance, 9400, "Colorer ne facture pas un nouvel achat");
  } finally { await g.close(); }
  g = await setup(directory);
  try {
    const iris = await g.enter(), june = await g.enter("sacha", "june");
    const home = (await iris.post("housing/load", { ownerId: "iris" })).data.home;
    assert.deepEqual(home.decoration.wallColors, wallColors);
    assert.deepEqual((await june.post("housing/load", { ownerId: "iris" })).data.home.decoration.wallColors, wallColors);
    const switched = finishDecoration(HOME_FINISHES.find((f) => f.id === "wall:ivory")!, home.decoration);
    assert.equal(switched.wallColors, undefined);
    const saved = await iris.post("housing/save", { expectedRevision: home.revision, operationId: randomUUID(), decoration: switched });
    assert.equal(saved.status, 200);
    assert.equal((await iris.post("housing/load", { ownerId: "iris" })).data.home.decoration.wallColors, undefined);
  } finally { await g.close(); }
});

test("La teinte du parquet persiste avec ses veines, sans changer le mur ni contourner un achat", async () => {
  const directory = await mkdtemp(join(tmpdir(), "luma-floor-colors-"));
  let g = await setup(directory);
  const floorColors = { base: "#eee4d3", detail: "#b5aa98" };
  try {
    const iris = await g.enter();
    let home = (await iris.post("housing/load", { ownerId: "iris" })).data.home;
    const save = (decoration: object) => iris.post("housing/save", {
      expectedRevision: home.revision, operationId: randomUUID(), decoration,
    });
    assert.equal((await save({ ...home.decoration, floor: "walnut", floorColors })).status, 400);
    for (const detail of ["#fff", "red", "url(https://example.com)"])
      assert.equal((await save({ ...home.decoration, floorColors: { ...floorColors, detail } })).status, 400);
    const saved = await save({ ...home.decoration, floorColors });
    assert.equal(saved.status, 200);
    home = saved.data.home;
    assert.deepEqual(home.decoration.floorColors, floorColors);
    assert.equal(home.decoration.wall, "ivory");
    assert.equal((await iris.state()).data.wardrobe.balance, 10000);
    assert.equal(finishDecoration(HOME_FINISHES.find((f) => f.id === "floor:honey")!, home.decoration).floorColors, undefined);
    assert.deepEqual(finishDecoration(HOME_FINISHES.find((f) => f.id === "wall:rose")!, home.decoration).floorColors, floorColors);
    assert.equal((await iris.post("housing/finishes/buy", command("floor:herringbone-gold"))).status, 200);
    const patterned = await save({ ...home.decoration, floor: "herringbone-gold", floorColors });
    assert.equal(patterned.status, 200);
    const markup = renderToStaticMarkup(React.createElement("svg", null, React.createElement(HomeBackground, patterned.data.home.decoration)));
    assert.ok(markup.includes(floorColors.base)); assert.ok(markup.includes("floors-realistic-v1/herringbone.webp"));
    const changedGrain = renderToStaticMarkup(React.createElement("svg", null, React.createElement(HomeBackground,
      { ...patterned.data.home.decoration, floorColors: { ...floorColors, detail: "#302b2d" } })));
    assert.notEqual(markup, changedGrain, "La couleur des veines modifie aussi le rendu de la matière");
  } finally { await g.close(); }
  g = await setup(directory);
  try {
    const iris = await g.enter(), june = await g.enter("sacha", "june");
    const home = (await iris.post("housing/load", { ownerId: "iris" })).data.home;
    assert.deepEqual(home.decoration.floorColors, floorColors);
    assert.deepEqual((await june.post("housing/load", { ownerId: "iris" })).data.home.decoration.floorColors, floorColors);
    const { floorColors: _colors, ...original } = home.decoration;
    assert.equal((await iris.post("housing/save", { expectedRevision: home.revision, operationId: randomUUID(), decoration: original })).status, 200);
    assert.equal((await iris.post("housing/load", { ownerId: "iris" })).data.home.decoration.floorColors, undefined);
  } finally { await g.close(); }
});

test("Le mur Sauge et le Chêne clair gratuits acceptent leurs couleurs et les conservent pour les visiteurs", async () => {
  const g = await setup();
  try {
    const iris = await g.enter(), june = await g.enter("sacha", "june");
    const home = (await iris.post("housing/load", { ownerId: "iris" })).data.home;
    const decoration = { ...home.decoration, wall: "sage", floor: "oak",
      wallColors: { base: "#c6d9e7", detail: "#7891a6" }, floorColors: { base: "#aa8265", detail: "#5e4031" } };
    const result = await iris.post("housing/save", { expectedRevision: home.revision, operationId: randomUUID(), decoration });
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.home.decoration, decoration);
    assert.deepEqual((await iris.post("housing/load", { ownerId: "iris" })).data.home.decoration, decoration);
    assert.deepEqual((await june.post("housing/load", { ownerId: "iris" })).data.home.decoration, decoration);
    assert.equal((await iris.state()).data.wardrobe.balance, 10000);
    const original = renderToStaticMarkup(React.createElement("svg", null, React.createElement(HomeBackground,
      { ...decoration, wallColors: undefined, floorColors: undefined })));
    const recolored = renderToStaticMarkup(React.createElement("svg", null, React.createElement(HomeBackground, decoration)));
    assert.notEqual(original, recolored);
    assert.ok(recolored.includes("floors-realistic-v1/wood.webp"));
  } finally { await g.close(); }
});

test("Chaque bouton de matière propose plusieurs modèles payants, rendus et acceptés par le contrat de sauvegarde", () => {
  for (const category of FINISH_CATEGORIES.filter((c) => c.kind !== "window")) {
    const models = HOME_FINISHES.filter((f) => f.kind === category.kind && finishCategory(f) === category.id);
    assert.ok(models.length >= 2, category.name);
    assert.ok(models.every((f) => f.price > 0));
  }
  assert.equal(DECORATION_FINISHES.filter((f) => f.price > 0).length, 42);
  assert.equal(new Set(HOME_FINISHES.map((f) => f.id)).size, HOME_FINISHES.length);
  for (const model of HOME_FINISHES) {
    const decoration = finishDecoration(model, { wall: "ivory", floor: "oak", placements: [] });
    assert.ok(homeDecorationSchema.safeParse(decoration).success, model.id);
    const markup = renderToStaticMarkup(React.createElement("svg", null, React.createElement(HomeBackground, decoration)));
    assert.doesNotMatch(markup, /undefined|NaN/);
    if (model.surface) assert.ok(markup.includes(model.surface.base));
  }
});

test("Toutes les nouvelles matières s'achètent et s'appliquent réellement à la maison", async () => {
  const g = await setup();
  try {
    const iris = await g.enter();
    // Fixture earnings fund the enlarged catalogue in this isolated test only.
    await g.db.query("INSERT INTO reward_wheel_spins(id,character_id,prize_index,currency,amount,collected_at) VALUES ($1,'iris',0,'coins',100000,NOW())", [randomUUID()]);
    let home = (await iris.post("housing/load", { ownerId: "iris" })).data.home;
    for (const finish of HOME_FINISHES.filter((f) => f.surface)) {
      const result = await iris.post("housing/finishes/buy", command(finish.id));
      assert.equal(result.status, 200, finish.id);
      assert.ok(result.data.owned.includes(finish.id));
      const saved = await iris.post("housing/save", { operationId: randomUUID(), expectedRevision: home.revision, decoration: finishDecoration(finish, home.decoration) });
      assert.equal(saved.status, 200, finish.id);
      home = saved.data.home;
      assert.equal(home.decoration[finish.kind as "wall" | "floor"], finish.value);
    }
    assert.deepEqual((await iris.post("housing/load", { ownerId: "iris" })).data.home, home);
  } finally { await g.close(); }
});

test("Revêtements : achat unique, confirmation rejouable, monnaie partagée et application durable", async () => {
  const directory = await mkdtemp(join(tmpdir(), "luma-finishes-")); let g = await setup(directory);
  try {
    const iris = await g.enter(), june = await g.enter("sacha", "june");
    const home = (await iris.post("housing/load", { ownerId: "iris" })).data.home;
    const decoration = { ...home.decoration, wall: "midnight", floor: "walnut" };
    const save = () => iris.post("housing/save", { expectedRevision: home.revision, operationId: randomUUID(), decoration });
    assert.equal((await save()).status, 400, "Un revêtement non acheté est refusé");
    const purchase = command();
    const [first, replay] = await Promise.all([iris.post("housing/finishes/buy", purchase), iris.post("housing/finishes/buy", purchase)]);
    assert.equal(first.status, 200); assert.equal(replay.status, 200);
    assert.equal(first.data.charged + replay.data.charged, 350);
    assert.equal((await iris.post("housing/finishes/buy", command())).data.charged, 0, "Pas de double achat du même modèle");
    assert.equal((await iris.post("housing/finishes/buy", command("floor:walnut"))).data.balance, 9200);
    assert.equal((await save()).status, 200);
    assert.equal((await iris.state()).data.wardrobe.balance, 9200);
    assert.equal((await iris.post("housing/catalog")).data.balance, 9200);
    assert.ok(!(await june.post("housing/finishes")).data.owned.includes("wall:midnight"));
    assert.equal((await june.post("housing/load", { ownerId: "iris" })).data.home.ownedFinishes, undefined);
    assert.equal((await iris.post("housing/finishes/buy", { ...purchase, finishId: "wall:peach" })).status, 400);
  } finally { await g.close(); }
  g = await setup(directory);
  try {
    const iris = await g.enter();
    const home = (await iris.post("housing/load", { ownerId: "iris" })).data.home;
    assert.equal(home.decoration.wall, "midnight"); assert.equal(home.decoration.floor, "walnut");
    assert.ok(home.ownedFinishes.includes("floor:walnut")); assert.equal((await iris.state()).data.wardrobe.balance, 9200);
  } finally { await g.close(); }
});
test("Prix serveur, fonds insuffisants, absence de session et rollback protègent l’achat de revêtements", async () => {
  const g = await setup();
  try {
    const iris = await g.enter(); const buy = (body: object) => iris.post("housing/finishes/buy", body);
    for (const invalid of [{ ...command(), expectedPrice: 1 }, { ...command(), offerVersion: "old" }, { ...command(), ownerId: "june" }, { ...command(), finishId: "unknown" }])
      assert.equal((await buy(invalid)).status, 400);
    assert.equal((await g.call("housing/finishes/buy", undefined, { generation: 1, ...command() })).status, 401);
    await g.db.exec(`CREATE FUNCTION reject_finish_purchase() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$;
      CREATE TRIGGER reject_finish BEFORE INSERT ON home_finish_purchases FOR EACH ROW EXECUTE FUNCTION reject_finish_purchase();`);
    assert.equal((await buy(command())).status, 500);
    assert.equal((await g.db.query("SELECT 1 FROM home_finish_items")).rows.length, 0);
    assert.equal((await iris.state()).data.wardrobe.balance, 10000);
    await g.db.exec("DROP TRIGGER reject_finish ON home_finish_purchases");
    await g.db.query("INSERT INTO home_finish_purchases(paid_by,operation_id,character_id,finish_id,offer_version,price) VALUES ('aurore',$1,'iris','fixture-spent','test',9800)", [randomUUID()]);
    assert.equal((await buy(command())).status, 400);
    assert.equal((await g.db.query("SELECT 1 FROM home_finish_items")).rows.length, 0);
  } finally { await g.close(); }
});
