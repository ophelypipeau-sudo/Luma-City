import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import WebSocket from "ws";
import { createApp } from "../apps/server/src/app.ts";
import { openDatabase } from "../apps/server/src/db.ts";
import { createHomeNavigation } from "../apps/server/src/home-navigation.ts";
import type { Presence, RoomId } from "../packages/contracts/src/index.ts";
import type { HomeMotion, HomePoint, HomeSnapshot } from "../packages/contracts/src/housing.ts";
import { canStandInHome, createHomeNavigationMesh, findHomePath, homeDistance, homeSegmentClear,
  HOME_MOVE_SPEED, HOME_WALK_BOUNDS, nearestHomePoint, sampleHomeMotion } from "../packages/domain/src/home-navigation.ts";

function home(objects: { model: string; x: number; y: number }[] = [], revision = 0): HomeSnapshot {
  const roomId = randomUUID();
  const items = objects.map((object) => ({ id: randomUUID(), modelId: object.model, roomId }));
  return { homeId: randomUUID(), roomId, ownerId: "iris", revision, items,
    decoration: { wall: "ivory", floor: "oak", placements: objects.map((object, i) => ({ itemId: items[i].id, x: object.x, y: object.y, depth: 0 })) } };
}
const sofa = () => home([{ model: "sofa", x: 500, y: 550 }]);
const identity = { id: "iris", account_id: "aurore", name: "Iris", color: "#b685b5", hair: "#583923", slot: 1 };
function checkPath(snapshot: HomeSnapshot, path: HomePoint[]) {
  const mesh = createHomeNavigationMesh(snapshot);
  for (let i = 1; i < path.length; i++) assert.ok(homeSegmentClear(mesh, path[i - 1], path[i]), `Segment ${i} traverse un obstacle`);
}
test("Le trajet contourne le meuble avec des segments exacts et un arrêt précis", () => {
  const snapshot = sofa(), mesh = createHomeNavigationMesh(snapshot);
  const start = { x: 100, y: 530 }, end = { x: 900, y: 530 };
  assert.equal(homeSegmentClear(mesh, start, end), false);
  const points = findHomePath(mesh, start, end)!;
  assert.ok(points.length > 2); assert.deepEqual(points[0], start); assert.deepEqual(points.at(-1), end);
  checkPath(snapshot, points);
  const motion: HomeMotion = { id: randomUUID(), startedAt: 1000, speed: HOME_MOVE_SPEED, revision: 0, points };
  let previous = start;
  for (let time = 1000; time <= 9000; time += 16) {
    const position = sampleHomeMotion(motion, time);
    assert.ok(canStandInHome(mesh, position));
    assert.ok(homeDistance(position, previous) <= HOME_MOVE_SPEED * .016 + .001);
    previous = position;
  }
  assert.deepEqual(sampleHomeMotion(motion, 20000), { ...end, done: true });
  assert.deepEqual(sampleHomeMotion(motion, 500), { ...start, done: false });
});
test("Murs, bords, diagonales, meubles infranchissables et objets décoratifs", () => {
  const snapshot = sofa(), mesh = createHomeNavigationMesh(snapshot);
  for (const target of [{ x: 500, y: 530 }, { x: 10, y: 550 }, { x: 900, y: 300 }, { x: 900, y: 680 }, { x: NaN, y: 500 }])
    assert.equal(findHomePath(mesh, { x: 100, y: 530 }, target), null);
  const wall = home([430, 500, 570, 635].map((y) => ({ model: "plant", x: 500, y })));
  assert.equal(findHomePath(createHomeNavigationMesh(wall), { x: 100, y: 530 }, { x: 900, y: 530 }), null);
  const decor = home([{ model: "rug", x: 500, y: 570 }, { model: "painting", x: 500, y: 250 }]);
  assert.deepEqual(findHomePath(createHomeNavigationMesh(decor), { x: 100, y: 550 }, { x: 900, y: 550 }), [{ x: 100, y: 550 }, { x: 900, y: 550 }]);
  const relocated = nearestHomePoint(mesh, { x: 500, y: 530 })!;
  assert.ok(canStandInHome(mesh, relocated));
  const full = { obstacles: [{ left: 0, right: 1000, top: 0, bottom: 680 }], blocked: new Uint8Array(mesh.blocked.length).fill(1) };
  assert.equal(nearestHomePoint(full, { x: 500, y: 530 }), null);
  for (const start of [{ x: 100, y: 450 }, { x: 100, y: 620 }, { x: 750, y: 565 }]) {
    const path = findHomePath(mesh, start, { x: 800, y: 580 }); assert.ok(path); checkPath(snapshot, path);
  }
});
test("Changer de destination repart de la position courante, à vitesse serveur constante", () => {
  let now = 1000;
  const player: Presence & { roomId: RoomId } = { ...identity, roomId: "home:iris", x: 10, y: 530 / 6.8 };
  const players = new Map([[player.id, player]]), navigation = createHomeNavigation(players, () => now);
  navigation.update(home()); navigation.move(player, { x: 900, y: 530 });
  now += 500;
  assert.equal(navigation.sample(player).x, 180);
  navigation.move(player, { x: 400, y: 600 });
  assert.deepEqual(player.motion?.points[0], { x: 180, y: 530 }); assert.equal(player.motion?.speed, HOME_MOVE_SPEED);
  now += 250;
  assert.ok(Math.abs(homeDistance(navigation.sample(player), { x: 180, y: 530 }) - 40) < .001);
  navigation.stop(player); assert.equal(player.motion, undefined);
  const stopped = { x: player.x, y: player.y }; now += 10000;
  navigation.sample(player); assert.deepEqual({ x: player.x, y: player.y }, stopped);
});
test("Un point au bord reste navigable après conversion en pourcentages", () => {
  const player: Presence & { roomId: RoomId } = { ...identity, roomId: "home:iris", x: 10, y: HOME_WALK_BOUNDS.top / 6.8 };
  const navigation = createHomeNavigation(new Map([[player.id, player]]));
  navigation.update(home());
  assert.doesNotThrow(() => navigation.move(player, { x: 900, y: HOME_WALK_BOUNDS.top }));
  assert.ok(player.motion);
});
test("Une nouvelle décoration libère les personnages et recalcule les trajets en cours", () => {
  let now = 1000;
  const player: Presence & { roomId: RoomId } = { ...identity, roomId: "home:iris", x: 50, y: 530 / 6.8 };
  const navigation = createHomeNavigation(new Map([[player.id, player]]), () => now);
  navigation.update(home()); navigation.move(player, { x: 900, y: 530 }); now += 100;
  const changed = sofa(); changed.revision = 1; navigation.update(changed);
  const position = navigation.sample(player), mesh = createHomeNavigationMesh(changed);
  assert.ok(canStandInHome(mesh, position)); assert.equal(player.motion?.revision, 1);
  checkPath(changed, player.motion!.points);
  const blockedDestination = { ...changed, revision: 2, decoration: { ...changed.decoration,
    placements: [{ ...changed.decoration.placements[0], x: 800, y: 550 }] } };
  navigation.update(blockedDestination); assert.equal(player.motion, undefined);
  // A delayed snapshot cannot reinstate the older obstacle map.
  navigation.update(changed);
  assert.throws(() => navigation.move(player, { x: 900, y: 530 }), /inaccessible/);
});

test("WebSocket : trajet partagé, animal équipé, rejet des téléportations et changement de décor", async () => {
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
    const login = await call("login", undefined, { account }), cookie = login.cookie!;
    const active = await call("activate", cookie, { character }); assert.equal(active.status, 200);
    return { cookie, generation: active.data.generation, outfit: active.data.character.outfit };
  }
  function connect(cookie: string) {
    const ws = new WebSocket(`ws://127.0.0.1:${(address as { port: number }).port}/ws`, { headers: { origin, cookie } });
    sockets.push(ws); const events: any[] = [];
    ws.on("message", (data) => events.push(JSON.parse(data.toString())));
    return { ws, events, wait: async (type: string, predicate: (event: any) => boolean = () => true) => {
      const deadline = Date.now() + 9000;
      while (Date.now() < deadline) {
        const event = events.find((e) => e.type === type && predicate(e)); if (event) return event;
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
      throw new Error(`Événement attendu : ${type}`);
    } };
  }
  try {
    const iris = await enter("aurore", "iris"), june = await enter("sacha", "june");
    const animal = await call("companions/buy", iris.cookie, { generation: iris.generation, modelId: "01-mochi", name: "Nuage" });
    assert.equal(animal.status, 200);
    await call("companions/equip", iris.cookie, { generation: iris.generation, id: animal.data.animal.id });
    const snapshot: HomeSnapshot = (await call("housing/load", iris.cookie, { generation: iris.generation, ownerId: "iris" })).data.home;
    const item = snapshot.items.find((i) => i.modelId === "sofa")!;
    const decoration = { ...snapshot.decoration, placements: [{ itemId: item.id, x: 500, y: 550, depth: 0 }] };
    const saved = await call("housing/save", iris.cookie, { generation: iris.generation, expectedRevision: snapshot.revision, operationId: randomUUID(), decoration });
    assert.equal(saved.status, 200);
    const first = connect(iris.cookie), visitor = connect(june.cookie);
    await Promise.all([first.wait("welcome"), visitor.wait("welcome")]);
    first.ws.send(JSON.stringify({ type: "home-move", roomId: "home:iris", generation: iris.generation, x: 120, y: 530 }));
    await first.wait("error", (e) => /pièce/.test(e.message));
    for (const [client, session] of [[first, iris], [visitor, june]] as const)
      client.ws.send(JSON.stringify({ type: "join-room", roomId: "home:iris", generation: session.generation }));
    const joined = await visitor.wait("room", (e) => e.roomId === "home:iris" && e.players.length === 2);
    const owner = joined.players.find((p: Presence) => p.id === "iris");
    assert.equal(owner.companion.name, "Nuage"); assert.equal(owner.companion.modelId, "01-mochi");
    assert.deepEqual(owner.outfit, iris.outfit);
    await new Promise((resolve) => setTimeout(resolve, 65));
    first.ws.send(JSON.stringify({ type: "home-move", roomId: "home:iris", generation: iris.generation, x: 120, y: 530 }));
    const started = await visitor.wait("room", (e) => e.players.some((p: Presence) => p.id === "iris" && p.motion));
    const moving = started.players.find((p: Presence) => p.id === "iris");
    assert.ok(moving.motion.points.length > 2); assert.equal(moving.motion.speed, HOME_MOVE_SPEED);
    assert.notEqual(moving.x, 12); checkPath(saved.data.home, moving.motion.points);
    await first.wait("room", (e) => e.players.some((p: Presence) => p.motion?.id === moving.motion.id));
    const later = await enter("test-xp", "nova-xp"), arrival = connect(later.cookie);
    await arrival.wait("welcome"); arrival.ws.send(JSON.stringify({ type: "join-room", generation: later.generation, roomId: "home:iris" }));
    const during = await arrival.wait("room", (e) => e.roomId === "home:iris");
    const seen = during.players.find((p: Presence) => p.id === "iris");
    assert.equal(seen.motion.id, moving.motion.id); assert.equal(seen.companion.name, "Nuage");
    assert.ok(homeDistance({ x: seen.x * 10, y: seen.y * 6.8 }, moving.motion.points[0]) <=
      HOME_MOVE_SPEED * (during.serverTime - moving.motion.startedAt) / 1000 + .01);
    first.events.length = 0;
    first.ws.send(JSON.stringify({ type: "move", generation: iris.generation, x: 50, y: 530 / 6.8 }));
    await first.wait("error", (e) => /inaccessible/.test(e.message));
    first.ws.send(JSON.stringify({ type: "home-stop", roomId: "home:iris", generation: iris.generation }));
    const stopped = await first.wait("room", (e) => !e.players.find((p: Presence) => p.id === "iris").motion);
    const resting = stopped.players.find((p: Presence) => p.id === "iris");
    await new Promise((resolve) => setTimeout(resolve, 65));
    first.events.length = 0;
    first.ws.send(JSON.stringify({ type: "home-move", roomId: "home:iris", generation: iris.generation, x: 120, y: 530 }));
    const restarted = await first.wait("room", (e) => e.players.some((p: Presence) => p.id === "iris" && p.motion));
    const active = restarted.players.find((p: Presence) => p.id === "iris");
    assert.deepEqual(active.motion.points[0], { x: resting.x * 10, y: resting.y * 6.8 });
    const destination = await first.wait("room", (e) => e.players.some((p: Presence) => p.id === "iris" && !p.motion && p.x === 12));
    const arrived = destination.players.find((p: Presence) => p.id === "iris");
    assert.equal(arrived.y, 530 / 6.8); assert.equal(arrived.companion.name, "Nuage");
    // Placing the sofa over a stationary visitor must move them to safe ground.
    const nextDecoration = { ...decoration, placements: [{ itemId: item.id, x: 250, y: 550, depth: 0 }] };
    visitor.events.length = 0;
    const next = await call("housing/save", iris.cookie, { generation: iris.generation, expectedRevision: saved.data.home.revision,
      operationId: randomUUID(), decoration: nextDecoration }); assert.equal(next.status, 200);
    const updated = await visitor.wait("room", (e) => e.players.some((p: Presence) => p.id === "iris" && (p.x !== 12 || Math.abs(p.y * 6.8 - 530) > .01)));
    const relocated = updated.players.find((p: Presence) => p.id === "iris");
    assert.ok(canStandInHome(createHomeNavigationMesh(next.data.home), { x: relocated.x * 10, y: relocated.y * 6.8 }));
    arrival.ws.terminate();
    await visitor.wait("room", (e) => e.roomId === "home:iris" && e.players.length === 2);
  } finally { for (const socket of sockets) socket.terminate(); await app.close(); await db.close(); }
});
