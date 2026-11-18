import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import WebSocket from "ws";
import { DEFAULT_ROOM } from "../packages/contracts/src/index.ts";
import { createApp } from "../apps/server/src/app.ts";
import { openDatabase } from "../apps/server/src/db.ts";
import { COMPANION_BREEDS, COMPANION_CATALOG, companionGeometry, companionImage, companionVariants, type CompanionBreedId } from "../packages/domain/src/companions.ts";

const origin = "http://127.0.0.1:5173";

test("Les 58 pelages du catalogue disposent de PNG RGBA et de dimensions adaptées", async () => {
  assert.equal(Object.keys(COMPANION_BREEDS).length, 10);
  assert.equal(Object.values(COMPANION_BREEDS).filter(({ species }) => species === "Chien").length, 5);
  for (const breedId of Object.keys(COMPANION_BREEDS) as CompanionBreedId[]) {
    const breed = COMPANION_BREEDS[breedId];
    const coats = companionVariants(breedId);
    assert.equal(coats.length, breedId === "spitz" ? 7 : breedId === "golden" ? 3 : 6);
    assert.equal(coats[0].id, breed.cover);
    assert.equal(new Set(coats.map(({ coat }) => coat)).size, coats.length);
    assert.ok(coats.every(({ price }) => price === breed.price));
  }
  assert.equal(COMPANION_CATALOG.length, 58);
  assert.equal(new Set(COMPANION_CATALOG.map(({ id }) => id)).size, COMPANION_CATALOG.length);
  for (const model of COMPANION_CATALOG) {
    const png = await readFile(new URL(`../public${companionImage(model.id)}`, import.meta.url));
    assert.equal(png.toString("ascii", 12, 16), "IHDR");
    assert.equal(png[25], 6);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], model.canvas);
    const [left, top, right, bottom] = model.bounds;
    assert.ok(left < right && right <= model.canvas[0] && top < bottom && bottom <= model.canvas[1]);
    const ground = model.ground ?? bottom;
    assert.ok(ground > top && ground <= bottom);
    const size = companionGeometry(model, 178, 50);
    assert.ok(size.visibleWidth > 0 && size.visibleWidth <= 50.001 && size.y < 0);
  }
});

test("Adoption, solde partagé, collection privée et présence multijoueur", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  assert.ok(address && typeof address !== "string");
  const sockets: WebSocket[] = [];
  async function request(path: string, cookie?: string, body?: object) {
    const response = await app.inject({ method: body ? "POST" : "GET", url: `/api/${path}`,
      payload: body, headers: { origin, ...(cookie && { cookie }) } });
    return { status: response.statusCode, data: response.json(), cookie: response.headers["set-cookie"]?.toString().split(";")[0] };
  }
  async function enter(account: string, character: string) {
    const login = await request("login", undefined, { account });
    assert.equal(login.status, 200);
    const cookie = login.cookie!;
    const { status, data } = await request("activate", cookie, { character });
    assert.equal(status, 200);
    return {
      cookie, generation: data.generation as number, state: () => request("state", cookie).then((reply) => reply.data),
      buy: (modelId: string, name: string) => request("companions/buy", cookie, { generation: data.generation, modelId, name }),
      equip: (id: string | null) => request("companions/equip", cookie, { generation: data.generation, id }),
      rename: (id: string, name: string) => request("companions/rename", cookie, { generation: data.generation, id, name }),
    };
  }
  async function watch(cookie: string) {
    const socket = new WebSocket(`ws://127.0.0.1:${address && typeof address !== "string" ? address.port : 0}/ws`, { origin, headers: { cookie } });
    sockets.push(socket);
    const events: any[] = [];
    socket.on("message", (data) => events.push(JSON.parse(data.toString())));
    await once(socket, "open");
    return {
      socket, events,
      async wait(predicate: (event: any) => boolean) {
        for (let i = 0; i < 250; i++) {
          const match = events.find(predicate);
          if (match) return match;
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        assert.fail("Événement de salon absent.");
      },
    };
  }
  try {
    const iris = await enter("aurore", "iris"), june = await enter("sacha", "june");
    const startingBalance = (await iris.state()).wardrobe.balance;
    assert.deepEqual((await iris.state()).companions, { items: [], equipped: null });
    const spitz = companionVariants("spitz");
    const mochi = spitz[0], bicolor = spitz.find(({ id }) => id === "spitz-noir-et-blanc")!;
    assert.equal((await request("companions/buy", undefined, { generation: iris.generation, modelId: mochi.id, name: "Plume" })).status, 401);
    assert.equal((await iris.buy(mochi.id, "<x>")).status, 400);
    assert.equal((await iris.buy(mochi.id, "p")).status, 400);
    assert.equal((await iris.buy("unknown", "Plume")).status, 400);
    const pair = await Promise.all([iris.buy(mochi.id, "  Étoile   2  "), iris.buy(mochi.id, "  Étoile   2  ")]);
    assert.ok(pair.every((reply) => reply.status === 200));
    assert.deepEqual(pair.map(({ data }) => data.charged).sort((a, b) => a - b), [0, mochi.price]);
    const pet = pair[0].data.animal;
    assert.equal(pet.id, pair[1].data.animal.id);
    assert.equal(pet.name, "Étoile 2");
    const bought = await iris.buy(bicolor.id, "Nuage");
    assert.equal(bought.status, 200);
    const second = bought.data.animal;
    assert.equal(second.modelId, bicolor.id);
    assert.notEqual(second.id, pet.id);
    const ragdoll = companionVariants("ragdoll").find(({ id }) => id === "ragdoll-seal-bicolore")!;
    const adopted = await iris.buy(ragdoll.id, "Praline");
    assert.equal(adopted.status, 200);
    assert.equal(adopted.data.charged, ragdoll.price);
    const cat = adopted.data.animal;
    assert.equal(cat.modelId, ragdoll.id);
    const balanceAfterAdoptions = startingBalance - mochi.price - bicolor.price - ragdoll.price;
    assert.equal((await iris.state()).wardrobe.balance, balanceAfterAdoptions);
    const garment = await request("shop/buy", iris.cookie, {
      generation: iris.generation, draft: { top: "fashion.premium-velvet", bottom: null, shoes: null },
    });
    assert.equal(garment.status, 200);
    assert.equal(garment.data.charged, 900);
    const balanceAfterPurchases = balanceAfterAdoptions - garment.data.charged;
    assert.equal(garment.data.wardrobe.balance, balanceAfterPurchases);
    assert.equal((await june.equip(pet.id)).status, 400);
    const visitor = await watch(june.cookie);
    const player = await watch(iris.cookie);
    await Promise.all([visitor.wait((event) => event.type === "welcome"), player.wait((event) => event.type === "welcome")]);
    visitor.socket.send(JSON.stringify({ type: "join-room", generation: june.generation, roomId: DEFAULT_ROOM }));
    player.socket.send(JSON.stringify({ type: "join-room", generation: iris.generation, roomId: DEFAULT_ROOM }));
    const peerHas = (id: string | null) => (event: any) => event.type === "room" &&
      event.players.some((p: any) => p.id === "iris" && (p.companion?.id ?? null) === id);
    await visitor.wait(peerHas(null));
    assert.equal((await iris.equip(pet.id)).data.companions.equipped.name, pet.name);
    const beforeMove = await visitor.wait(peerHas(pet.id));
    assert.equal(beforeMove.players.find((p: any) => p.id === "iris").companion.modelId, mochi.id);
    player.socket.send(JSON.stringify({ type: "move", generation: iris.generation, x: 69, y: 80 }));
    await visitor.wait((event) => peerHas(pet.id)(event) && event.players.some((p: any) => p.id === "iris" && p.x === 69));
    assert.equal((await iris.equip(second.id)).data.companions.equipped.id, second.id);
    const switched = await visitor.wait(peerHas(second.id));
    assert.equal(switched.players.find((p: any) => p.id === "iris").companion.modelId, bicolor.id);
    assert.deepEqual((await iris.equip(cat.id)).data.companions.equipped, cat);
    const catEquipped = await visitor.wait(peerHas(cat.id));
    assert.deepEqual(catEquipped.players.find((p: any) => p.id === "iris").companion, cat);
    visitor.events.length = 0;
    assert.equal((await iris.equip(null)).data.companions.equipped, null);
    await visitor.wait(peerHas(null));
    assert.equal((await iris.equip(cat.id)).status, 200);
    const milo = await enter("aurore", "milo");
    assert.deepEqual((await milo.state()).companions, { items: [], equipped: null });
    assert.equal((await milo.state()).wardrobe.balance, balanceAfterPurchases);
    assert.equal((await milo.equip(pet.id)).status, 400);
    assert.equal((await milo.rename(cat.id, "Lune")).status, 400);
    const resumed = await enter("aurore", "iris");
    const resumedCollection = (await resumed.state()).companions;
    assert.deepEqual(resumedCollection.equipped, cat);
    assert.deepEqual(new Set(resumedCollection.items), new Set([pet, second, cat]));
    const rejoined = await watch(resumed.cookie);
    const welcome = await rejoined.wait((event) => event.type === "welcome");
    assert.deepEqual(welcome.companions.equipped, cat);
    rejoined.socket.send(JSON.stringify({ type: "join-room", generation: resumed.generation, roomId: DEFAULT_ROOM }));

    assert.equal((await request("companions/rename", undefined, { generation: resumed.generation, id: cat.id, name: "Lune" })).status, 401);
    assert.equal((await june.rename(cat.id, "Lune")).status, 400);
    for (const invalid of ["a", "x".repeat(21), "   ", "<b>Lune</b>"]) {
      assert.equal((await resumed.rename(cat.id, invalid)).status, 400);
    }
    const beforeRename = await resumed.state();
    const savedRows = () => db.query("SELECT * FROM companions WHERE character_id=$1 ORDER BY id", ["iris"]).then(({ rows }) => rows);
    const beforeRows = await savedRows();
    assert.deepEqual(beforeRename.companions.equipped, cat);

    const equippedRename = await resumed.rename(cat.id, "  Étoile   d'Or  ");
    assert.equal(equippedRename.status, 200);
    const updatedCat = { ...cat, name: "Étoile d'Or" };
    assert.deepEqual(equippedRename.data.companions.equipped, updatedCat);
    assert.deepEqual(equippedRename.data.companions.items.find(({ id }: { id: string }) => id === cat.id), updatedCat);
    await visitor.wait((event) => peerHas(cat.id)(event) &&
      event.players.some((p: any) => p.id === "iris" && p.companion?.name === updatedCat.name && p.companion.modelId === cat.modelId));

    assert.equal((await resumed.rename(pet.id, "Soleil")).status, 200);
    const unequippedRename = await resumed.rename(pet.id, "Soleil levant");
    assert.equal(unequippedRename.status, 200);
    assert.deepEqual(unequippedRename.data.companions.equipped, updatedCat);
    const updatedPet = { ...pet, name: "Soleil levant" };
    assert.deepEqual(unequippedRename.data.companions.items.find(({ id }: { id: string }) => id === pet.id), updatedPet);
    const newNames = new Map([[cat.id, updatedCat.name], [pet.id, updatedPet.name]]);
    assert.deepEqual(await savedRows(), beforeRows.map((row) => ({ ...row, name: newNames.get(row.id) ?? row.name })));
    const afterRename = await resumed.state();
    assert.equal(afterRename.wardrobe.balance, beforeRename.wardrobe.balance);
    assert.equal(afterRename.wardrobe.diamonds, beforeRename.wardrobe.diamonds);
    const junePet = await june.buy(mochi.id, "Nuage");
    assert.equal(junePet.status, 200);
    assert.equal((await june.rename(junePet.data.animal.id, updatedCat.name)).status, 200);

    const third = COMPANION_CATALOG[2];
    await db.query("UPDATE companions SET price=$1 WHERE id=$2", [balanceAfterPurchases + mochi.price - third.price + 1, pet.id]);
    const insufficient = await resumed.buy(third.id, "Mistral");
    assert.equal(insufficient.status, 400);
    assert.match(insufficient.data.error, /assez de pièces/);
    assert.equal((await resumed.state()).companions.items.length, 3);

    assert.equal((await request("logout", resumed.cookie, {})).status, 200);
    const signedBackIn = await enter("aurore", "iris");
    assert.deepEqual((await signedBackIn.state()).companions, afterRename.companions);
  } finally {
    for (const socket of sockets) socket.terminate();
    await app.close();
    await db.close();
  }
});
