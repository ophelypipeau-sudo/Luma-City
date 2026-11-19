import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import WebSocket from "ws";
import { createApp } from "../apps/server/src/app.ts";
import { openDatabase } from "../apps/server/src/db.ts";
import { createRoomChatReceipts } from "../apps/server/src/room-chat-receipts.ts";
import type { HomeSnapshot } from "../packages/contracts/src/housing.ts";
import type { Presence } from "../packages/contracts/src/index.ts";
import { homeDistance } from "../packages/domain/src/home-navigation.ts";

test("Les reçus du chat distinguent auteur, contenu et pièce, puis expirent", () => {
  let now = 1000;
  const receipts = createRoomChatReceipts(() => now);
  receipts.remember("iris", "command", "home:iris", "Bienvenue");
  assert.equal(receipts.has("iris", "command", "home:iris", "Bienvenue"), true);
  assert.equal(receipts.delivered("iris", "command"), false);
  receipts.confirm("iris", "command"); assert.equal(receipts.delivered("iris", "command"), true);
  assert.equal(receipts.has("june", "command", "home:iris", "Bienvenue"), false);
  assert.throws(() => receipts.has("iris", "command", "home:june", "Bienvenue"));
  assert.throws(() => receipts.has("iris", "command", "home:iris", "Autre texte"));
  now += 300001; assert.equal(receipts.has("iris", "command", "home:iris", "Bienvenue"), false);
});

async function setup() {
  const db = await openDatabase("memory://"), app = await createApp(db);
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address(); assert.ok(address && typeof address !== "string");
  const origin = "http://127.0.0.1:5173", sockets: WebSocket[] = [];
  async function call(path: string, cookie?: string, body?: object) {
    const response = await app.inject({ method: body ? "POST" : "GET", url: `/api/${path}`, payload: body,
      headers: { origin, ...(cookie ? { cookie } : {}) } });
    return { status: response.statusCode, data: response.json(), cookie: response.headers["set-cookie"]?.toString().split(";")[0] };
  }
  async function enter(account: string, character: string) {
    const login = await call("login", undefined, { account }); assert.equal(login.status, 200);
    const active = await call("activate", login.cookie, { character }); assert.equal(active.status, 200);
    return { cookie: login.cookie!, generation: active.data.generation as number, character, outfit: active.data.character.outfit };
  }
  function connect(session: Awaited<ReturnType<typeof enter>>) {
    const ws = new WebSocket(`ws://127.0.0.1:${(address as { port: number }).port}/ws`, { headers: { origin, cookie: session.cookie } });
    sockets.push(ws); const events: any[] = [];
    ws.on("message", (raw) => events.push(JSON.parse(raw.toString())));
    return { ws, events,
      send: (input: object) => ws.send(JSON.stringify({ generation: session.generation, ...input })),
      wait: async (type: string, predicate: (event: any) => boolean = () => true) => {
        const deadline = Date.now() + 8000;
        while (Date.now() < deadline) {
          const event = events.find((e) => e.type === type && predicate(e)); if (event) return event;
          await new Promise((resolve) => setTimeout(resolve, 15));
        }
        throw new Error(`Événement attendu : ${type} (${session.character})`);
      },
    };
  }
  return { db, app, call, enter, connect, close: async () => { sockets.forEach((ws) => ws.terminate()); await app.close(); await db.close(); } };
}

test("Le chat garde le filtrage des auteurs bloqués après leur déconnexion", async () => {
  const game = await setup();
  try {
    const iris = await game.enter("aurore", "iris"), june = await game.enter("sacha", "june");
    const owner = game.connect(iris), visitor = game.connect(june);
    await Promise.all([owner.wait("welcome"), visitor.wait("welcome")]);
    owner.send({ type: "join-room", roomId: "home:iris" }); await owner.wait("home-layout");
    visitor.send({ type: "join-room", roomId: "home:iris" }); await visitor.wait("home-layout");
    const commandId = randomUUID(); visitor.send({ type: "room-chat", roomId: "home:iris", commandId, body: "Message à filtrer" });
    await owner.wait("room-chat", (e) => e.messages.some((m: any) => m.body === "Message à filtrer"));
    await game.call("block", iris.cookie, { generation: iris.generation, peer: "june", blocked: true });
    visitor.ws.terminate(); owner.events.length = 0;
    owner.send({ type: "join-room", roomId: "greenhouse" });
    await owner.wait("room", (e) => e.roomId === "greenhouse" && !e.onlineIds.includes("june"));
    owner.events.length = 0; owner.send({ type: "join-room", roomId: "home:iris" });
    const history = await owner.wait("room-chat", (e) => e.roomId === "home:iris");
    assert.equal(history.messages.length, 0, "un auteur bloqué ne réapparaît pas dans l’historique quand il se déconnecte");
  } finally { await game.close(); }
});

test("Visites : avatars, animaux, chat isolé, décor, propriétaire absent et reconnexion", async () => {
  const game = await setup();
  const { call, enter, connect } = game;
  try {
    const iris = await enter("aurore", "iris"), june = await enter("sacha", "june"), nova = await enter("test-xp", "nova-xp");
    const ownAnimal = await call("companions/buy", iris.cookie, { generation: iris.generation, modelId: "01-mochi", name: "Nuage" });
    const visitorAnimal = await call("companions/buy", june.cookie, { generation: june.generation, modelId: "06-luna", name: "Plume" });
    assert.equal(ownAnimal.status, 200); assert.equal(visitorAnimal.status, 200);
    await call("companions/equip", iris.cookie, { generation: iris.generation, id: ownAnimal.data.animal.id });
    await call("companions/equip", june.cookie, { generation: june.generation, id: visitorAnimal.data.animal.id });
    let home = (await call("housing/load", iris.cookie, { generation: iris.generation, ownerId: "iris" })).data.home as HomeSnapshot;
    const stored = home.decoration.placements[0].itemId;
    home = (await call("housing/save", iris.cookie, { generation: iris.generation, expectedRevision: home.revision,
      operationId: randomUUID(), decoration: { ...home.decoration, placements: home.decoration.placements.filter((p) => p.itemId !== stored) } })).data.home;
    const owner = connect(iris), visitor = connect(june), outside = connect(nova);
    await Promise.all([owner.wait("welcome"), visitor.wait("welcome"), outside.wait("welcome")]);
    owner.send({ type: "join-room", roomId: "home:iris" });
    visitor.send({ type: "join-room", roomId: "home:iris" });
    const joined = await visitor.wait("room", (e) => e.roomId === "home:iris" && e.players.length === 2);
    assert.equal(new Set(joined.players.map((p: Presence) => p.id)).size, 2);
    const a = joined.players.find((p: Presence) => p.id === "iris"), b = joined.players.find((p: Presence) => p.id === "june");
    assert.ok(homeDistance({ x: a.x * 10, y: a.y * 6.8 }, { x: b.x * 10, y: b.y * 6.8 }) >= 140);
    assert.deepEqual(a.outfit, iris.outfit); assert.deepEqual(b.outfit, june.outfit);
    assert.equal(a.companion.name, "Nuage"); assert.equal(b.companion.name, "Plume"); assert.equal(b.companion.modelId, "06-luna");
    const initial = (await visitor.wait("home-layout")).home as HomeSnapshot;
    assert.equal(initial.revision, home.revision); assert.equal(initial.items.length, 9);
    assert.ok(initial.items.every((item) => item.id !== stored));
    const commandId = randomUUID();
    owner.send({ type: "room-chat", roomId: "home:iris", commandId, body: "Bienvenue chez Iris !", name: "Faux nom" });
    await owner.wait("room-chat-ack", (e) => e.commandId === commandId && !e.error);
    const message = await visitor.wait("room-chat", (e) => e.roomId === "home:iris" && e.messages.length === 1);
    assert.equal(message.messages[0].name, "Iris"); assert.equal(message.messages[0].body, "Bienvenue chez Iris !");
    owner.events.length = 0;
    owner.send({ type: "room-chat", roomId: "home:iris", commandId, body: "Bienvenue chez Iris !" });
    await owner.wait("room-chat-ack", (e) => e.commandId === commandId && !e.error);
    assert.ok(outside.events.every((e) => e.type !== "room-chat" || e.roomId !== "home:iris"));
    outside.send({ type: "join-room", roomId: "home:iris" });
    const late = await outside.wait("room-chat", (e) => e.roomId === "home:iris"); assert.equal(late.messages.length, 1);
    await outside.wait("home-layout", (e) => e.home.revision === home.revision);
    await outside.wait("room", (e) => e.roomId === "home:iris" && e.players.length === 3);
    visitor.events.length = 0;
    const renamed = await call("companions/rename", june.cookie, { generation: june.generation, id: visitorAnimal.data.animal.id, name: "Plume bleue" });
    assert.equal(renamed.status, 200);
    await outside.wait("room", (e) => e.players.some((p: Presence) => p.id === "june" && p.companion?.name === "Plume bleue"));
    outside.events.length = 0;
    assert.equal((await call("companions/equip", june.cookie, { generation: june.generation, id: null })).status, 200);
    await outside.wait("room", (e) => e.players.some((p: Presence) => p.id === "june" && p.companion === null));
    assert.equal((await call("companions/equip", june.cookie, { generation: june.generation, id: visitorAnimal.data.animal.id })).status, 200);
    const newOutfit = { top: null, bottom: null, shoes: null, hair: null };
    const worn = await call("profile/outfit", iris.cookie, { generation: iris.generation, outfit: newOutfit });
    assert.equal(worn.status, 200);
    await outside.wait("room", (e) => e.players.some((p: Presence) => p.id === "iris" && p.outfit?.top === null));
    // Replace the same player's socket: a single avatar and its pet must remain.
    const replaced = connect(june); await replaced.wait("welcome");
    replaced.send({ type: "join-room", roomId: "home:iris" });
    const replacement = await replaced.wait("room", (e) => e.roomId === "home:iris" && e.players.length === 3);
    assert.equal(replacement.players.filter((p: Presence) => p.id === "june").length, 1);
    assert.equal(replacement.players.find((p: Presence) => p.id === "june").companion.name, "Plume bleue");
    replaced.ws.terminate(); outside.events.length = 0;
    await outside.wait("room", (e) => e.roomId === "home:iris" && e.players.length === 2);
    owner.send({ type: "join-room", roomId: "greenhouse" });
    await owner.wait("room", (e) => e.roomId === "greenhouse"); owner.events.length = 0;
    const absent = await outside.wait("room", (e) => e.roomId === "home:iris" && e.players.length === 1);
    assert.equal(absent.players[0].id, "nova-xp");
    const command2 = randomUUID(); outside.send({ type: "room-chat", roomId: "home:iris", commandId: command2, body: "Le salon reste ouvert." });
    await outside.wait("room-chat-ack", (e) => e.commandId === command2 && !e.error);
    assert.ok(owner.events.every((e) => e.type !== "room-chat" || e.roomId !== "home:iris"));
    outside.events.length = 0;
    home = (await call("housing/save", iris.cookie, { generation: iris.generation, expectedRevision: home.revision,
      operationId: randomUUID(), decoration: { ...home.decoration, wall: "sage" } })).data.home;
    await outside.wait("home-layout", (e) => e.home.revision === home.revision && e.home.decoration.wall === "sage");
    const reconnected = connect(june); await reconnected.wait("welcome"); reconnected.send({ type: "join-room", roomId: "home:iris" });
    const current = await reconnected.wait("home-layout", (e) => e.home.revision === home.revision);
    assert.equal(current.home.decoration.wall, "sage"); assert.equal(current.home.items.length, 9);
    const history = await reconnected.wait("room-chat", (e) => e.roomId === "home:iris"); assert.equal(history.messages.length, 2);
    const edit = await call("housing/save", june.cookie, { generation: june.generation, ownerId: "iris", expectedRevision: home.revision,
      operationId: randomUUID(), decoration: home.decoration }); assert.equal(edit.status, 400);
    reconnected.events.length = 0;
    reconnected.send({ type: "room-chat", roomId: "home:iris", commandId: randomUUID(), body: "Bonjour tout le monde" });
    await reconnected.wait("room-chat-ack", (e) => !e.error);
    reconnected.events.length = 0;
    reconnected.send({ type: "room-chat", roomId: "home:iris", commandId: randomUUID(), body: "Trop vite" });
    await reconnected.wait("room-chat-ack", (e) => !!e.error);
  } finally { await game.close(); }
});

test("Admission concurrente : capacité par pièce, blocage et conservation de la salle d’origine", async () => {
  const game = await setup();
  const { call, enter, connect, db } = game;
  try {
    const iris = await enter("aurore", "iris"), june = await enter("sacha", "june"), nova = await enter("test-xp", "nova-xp");
    const loaded = await call("housing/load", iris.cookie, { generation: iris.generation, ownerId: "iris" });
    await db.query("UPDATE home_rooms SET capacity=2 WHERE id=$1", [loaded.data.home.roomId]);
    const owner = connect(iris), one = connect(june), two = connect(nova);
    await Promise.all([owner.wait("welcome"), one.wait("welcome"), two.wait("welcome")]);
    owner.send({ type: "join-room", roomId: "home:iris" }); await owner.wait("room", (e) => e.roomId === "home:iris");
    one.send({ type: "join-room", roomId: "home:iris" }); two.send({ type: "join-room", roomId: "home:iris" });
    const until = Date.now() + 5000;
    while (Date.now() < until && ![...one.events, ...two.events].some((e) => e.type === "room-full"))
      await new Promise((resolve) => setTimeout(resolve, 15));
    const full = [...one.events, ...two.events].filter((e) => e.type === "room-full"); assert.equal(full.length, 1); assert.equal(full[0].capacity, 2);
    assert.equal(full[0].currentRoomId, null);
    const admitted = await owner.wait("room", (e) => e.roomId === "home:iris" && e.players.length === 2);
    assert.equal(admitted.capacities["home:iris"], 2);
    const refused = one.events.some((e) => e.type === "room-full") ? one : two;
    refused.events.length = 0; refused.send({ type: "join-room", roomId: "greenhouse" });
    await refused.wait("room", (e) => e.roomId === "greenhouse");
    // The same bilateral block check protects HTTP snapshots and socket admission.
    const refusedSession = refused === one ? june : nova;
    await call("block", iris.cookie, { generation: iris.generation, peer: refusedSession.character, blocked: true });
    assert.equal((await call("housing/load", refusedSession.cookie, { generation: refusedSession.generation, ownerId: "iris" })).status, 400);
    refused.send({ type: "join-room", roomId: "home:iris" }); await refused.wait("room-unavailable");
  } finally { await game.close(); }
});
