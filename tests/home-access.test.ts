import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { createApp } from "../apps/server/src/app.ts";
import { openDatabase } from "../apps/server/src/db.ts";

async function setup(directory = "memory://") {
  const db = await openDatabase(directory), app = await createApp(db);
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address(); assert.ok(address && typeof address !== "string");
  const sockets: WebSocket[] = [];
  async function call(path: string, cookie?: string, body?: object) {
    const response = await app.inject({ method: body ? "POST" : "GET", url: `/api/${path}`, payload: body,
      headers: { origin: "http://127.0.0.1:5173", ...(cookie ? { cookie } : {}) } });
    return { status: response.statusCode, data: response.json(), cookie: response.headers["set-cookie"]?.toString().split(";")[0] };
  }
  async function enter(account: string, character: string) {
    const login = await call("login", undefined, { account }); assert.equal(login.status, 200);
    const active = await call("activate", login.cookie, { character }); assert.equal(active.status, 200);
    const cookie = login.cookie!, generation = active.data.generation as number;
    return { cookie, generation, character, post: (path: string, body: object = {}) => call(`housing/${path}`, cookie, { generation, ...body }) };
  }
  function connect(session: Awaited<ReturnType<typeof enter>>) {
    const ws = new WebSocket(`ws://127.0.0.1:${(address as { port: number }).port}/ws`, { headers: { origin: "http://127.0.0.1:5173", cookie: session.cookie } });
    sockets.push(ws); const events: any[] = [];
    ws.on("message", (raw) => events.push(JSON.parse(raw.toString())));
    return { ws, events, send: (body: object) => ws.send(JSON.stringify({ generation: session.generation, ...body })),
      wait: async (type: string, predicate: (e: any) => boolean = () => true) => {
        const until = Date.now() + 12000;
        while (Date.now() < until) {
          const event = events.find((e) => e.type === type && predicate(e)); if (event) return event;
          await new Promise((resolve) => setTimeout(resolve, 15));
        }
        throw new Error(`${type} attendu pour ${session.character}`);
      } };
  }
  await db.query(`INSERT INTO profile_relations (first_id,second_id,kind,requester,accepted)
    VALUES ('iris','june','friend','iris',TRUE),('iris','nova-xp','friend','iris',FALSE) ON CONFLICT DO NOTHING`);
  return { db, app, call, enter, connect, close: async () => { sockets.forEach((ws) => ws.terminate()); await app.close(); await db.close(); } };
}
test("Accès public, amis confirmés et privé protègent HTTP et WebSocket, avec retrait immédiat", async () => {
  const g = await setup();
  try {
    const iris = await g.enter("aurore", "iris"), june = await g.enter("sacha", "june"), nova = await g.enter("test-xp", "nova-xp");
    const owner = g.connect(iris), friend = g.connect(june), stranger = g.connect(nova);
    await Promise.all([owner.wait("welcome"), friend.wait("welcome"), stranger.wait("welcome")]);
    for (const socket of [owner, friend, stranger]) { socket.send({ type: "join-room", roomId: "home:iris" }); await socket.wait("home-layout"); }
    let settings = (await iris.post("access")).data; assert.equal(settings.mode, "public");
    assert.equal((await nova.post("load", { ownerId: "iris" })).status, 200);
    assert.equal((await iris.post("access/update", { action: "mode", mode: "friends", expectedRevision: settings.revision })).status, 200);
    await stranger.wait("home-removed"); owner.events.length = 0;
    assert.equal((await nova.post("load", { ownerId: "iris" })).status, 400); // pending friendship does not grant access
    stranger.send({ type: "join-room", roomId: "home:iris" }); await stranger.wait("room-unavailable");
    assert.equal((await june.post("load", { ownerId: "iris" })).status, 200);
    settings = (await iris.post("access")).data;
    assert.equal((await iris.post("access/update", { action: "mode", mode: "private", expectedRevision: settings.revision })).status, 200);
    await friend.wait("home-removed"); assert.equal((await june.post("load", { ownerId: "iris" })).status, 400);
    assert.equal((await iris.post("load", { ownerId: "iris" })).status, 200);
    const isolated = await owner.wait("room", (e) => e.roomId === "home:iris" && e.players.length === 1); assert.equal(isolated.players[0].id, "iris");
    assert.equal((await iris.post("access/update", { action: "mode", mode: "public", expectedRevision: 0 })).status, 400);
    const stable = await iris.post("access/update", { action: "mode", mode: "private", expectedRevision: 0 });
    assert.equal(stable.status, 200); assert.equal(stable.data.revision, 2);
    assert.equal((await june.post("access/update", { action: "mode", mode: "public", expectedRevision: 0, ownerId: "iris" })).status, 400);
    assert.equal((await june.post("access", { ownerId: "iris" })).status, 400);
    assert.equal((await iris.post("load", { ownerId: "iris" })).data.home.revision, 0); // access never rewrites decoration
  } finally { await g.close(); }
});

test("Invitations nominatives : acceptation, refus, révocation, expiration et accès privé", async () => {
  const g = await setup();
  try {
    const iris = await g.enter("aurore", "iris"), june = await g.enter("sacha", "june"), nova = await g.enter("test-xp", "nova-xp");
    await iris.post("access/update", { action: "mode", mode: "private", expectedRevision: 0 });
    const id = randomUUID(), invite = { action: "invite", peer: "june", operationId: id };
    const issued = await iris.post("access/update", invite); assert.equal(issued.status, 200);
    assert.equal((await iris.post("access/update", invite)).data.invitations[0].expiresAt, issued.data.invitations[0].expiresAt);
    assert.equal((await iris.post("access/update", { ...invite, operationId: randomUUID() })).status, 400);
    assert.equal((await iris.post("access/update", { ...invite, peer: "nova-xp", operationId: randomUUID() })).status, 400);
    assert.equal((await june.post("invitations")).data.invitations.length, 1);
    assert.equal((await nova.post("invitations")).data.invitations.length, 0);
    assert.equal((await nova.post("invitations/respond", { invitationId: id, accept: true })).status, 400);
    assert.equal((await june.post("load", { ownerId: "iris" })).status, 400);
    assert.equal((await june.post("invitations/respond", { invitationId: id, accept: true })).status, 200);
    assert.equal((await june.post("load", { ownerId: "iris" })).status, 200);
    const socket = g.connect(june); await socket.wait("welcome"); socket.send({ type: "join-room", roomId: "home:iris" }); await socket.wait("home-layout");
    assert.equal((await june.post("access/update", { action: "revoke", invitationId: id })).status, 400);
    assert.equal((await iris.post("access/update", { action: "revoke", invitationId: id })).status, 200);
    await socket.wait("home-removed"); socket.events.length = 0;
    assert.equal((await june.post("invitations/respond", { invitationId: id, accept: true })).status, 400);
    const decline = randomUUID(); await iris.post("access/update", { ...invite, operationId: decline });
    assert.equal((await june.post("invitations/respond", { invitationId: decline, accept: false })).status, 200);
    assert.equal((await june.post("invitations/respond", { invitationId: decline, accept: true })).status, 400);
    const expired = randomUUID(); await iris.post("access/update", { ...invite, operationId: expired });
    await g.db.query("UPDATE home_invitations SET expires_at=NOW()-INTERVAL '1 second' WHERE id=$1", [expired]);
    assert.equal((await june.post("invitations/respond", { invitationId: expired, accept: true })).status, 400);
    assert.equal((await june.post("invitations")).data.invitations.length, 0);
    const accepted = randomUUID(); await iris.post("access/update", { ...invite, operationId: accepted });
    assert.equal((await june.post("invitations/respond", { invitationId: accepted, accept: true })).status, 200);
    socket.send({ type: "join-room", roomId: "home:iris" }); await socket.wait("home-layout"); socket.events.length = 0;
    await g.db.query("UPDATE home_invitations SET expires_at=NOW()-INTERVAL '1 second' WHERE id=$1", [accepted]);
    // Even without another command, the periodic check removes an expired visitor.
    await socket.wait("home-removed");
    socket.send({ type: "room-chat", roomId: "home:iris", commandId: randomUUID(), body: "Accès expiré" });
    await socket.wait("room-chat-ack", (e) => !!e.error);
  } finally { await g.close(); }
});

test("Expulsion durable, retour explicite, blocage bilatéral et conservation des invitations révoquées", async () => {
  const directory = await mkdtemp(join(tmpdir(), "luma-access-"));
  let g = await setup(directory);
  try {
    const iris = await g.enter("aurore", "iris"), june = await g.enter("sacha", "june");
    const owner = g.connect(iris), visitor = g.connect(june); await Promise.all([owner.wait("welcome"), visitor.wait("welcome")]);
    owner.send({ type: "join-room", roomId: "home:iris" }); await owner.wait("home-layout");
    visitor.send({ type: "join-room", roomId: "home:iris" }); await visitor.wait("home-layout");
    const invitationId = randomUUID(); await iris.post("access/update", { action: "invite", peer: "june", operationId: invitationId });
    assert.equal((await june.post("access/update", { action: "kick", peer: "iris" })).status, 400);
    assert.equal((await iris.post("access/update", { action: "kick", peer: "iris" })).status, 400);
    assert.equal((await iris.post("access/update", { action: "kick", peer: "june" })).status, 200);
    await visitor.wait("home-removed"); visitor.events.length = 0;
    assert.equal((await iris.post("access/update", { action: "kick", peer: "june" })).status, 200); // lost response retry
    assert.equal((await june.post("load", { ownerId: "iris" })).status, 400);
    visitor.send({ type: "join-room", roomId: "home:iris" }); await visitor.wait("room-unavailable");
    assert.equal((await iris.post("access/update", { action: "invite", peer: "june", operationId: randomUUID() })).status, 400);
  } finally { await g.close(); }
  g = await setup(directory);
  try {
    const iris = await g.enter("aurore", "iris"), june = await g.enter("sacha", "june");
    assert.equal((await iris.post("access")).data.excluded[0].id, "june");
    assert.equal((await june.post("load", { ownerId: "iris" })).status, 400);
    await iris.post("access/update", { action: "allow", peer: "june" });
    assert.equal((await june.post("load", { ownerId: "iris" })).status, 200);
    const visitor = g.connect(june); await visitor.wait("welcome"); visitor.send({ type: "join-room", roomId: "home:iris" }); await visitor.wait("home-layout");
    await iris.post("access/update", { action: "invite", peer: "june", operationId: randomUUID() });
    const blocked = await g.call("block", iris.cookie, { generation: iris.generation, peer: "june", blocked: true }); assert.equal(blocked.status, 200);
    await visitor.wait("home-removed");
    assert.equal((await june.post("invitations")).data.invitations.length, 0);
    assert.equal((await june.post("load", { ownerId: "iris" })).status, 400);
    await g.call("block", iris.cookie, { generation: iris.generation, peer: "june", blocked: false });
    assert.equal((await june.post("invitations")).data.invitations.length, 0); // revoked invitations stay revoked
    assert.equal((await iris.post("access/update", { action: "mode", mode: "private", expectedRevision: 0 })).status, 200);
    assert.equal((await june.post("load", { ownerId: "iris" })).status, 400);
  } finally { await g.close(); }
});
