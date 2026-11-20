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
test("Les maisons sont ouvertes sans invitation, même après un ancien réglage privé ou une exclusion", async () => {
  const g = await setup();
  try {
    const iris = await g.enter("aurore", "iris"), june = await g.enter("sacha", "june"), nova = await g.enter("test-xp", "nova-xp");
    const initial = (await iris.post("load", { ownerId: "iris" })).data.home;
    await g.db.query("INSERT INTO home_exclusions (owner_id,guest_id) VALUES ('iris','june')");
    for (const mode of ["private", "friends", "public"]) {
      await g.db.query("UPDATE homes SET access_mode=$1 WHERE owner_character_id='iris'", [mode]);
      assert.equal((await june.post("load", { ownerId: "iris" })).status, 200);
      assert.equal((await nova.post("load", { ownerId: "iris" })).status, 200, "Une amitié n'est pas requise");
    }
    const visitor = g.connect(nova);
    await visitor.wait("welcome"); visitor.send({ type: "join-room", roomId: "home:iris" });
    const layout = await visitor.wait("home-layout");
    assert.equal(layout.home.ownerId, "iris");
    assert.deepEqual((await iris.post("load", { ownerId: "iris" })).data.home, initial);
    for (const path of ["access", "access/update", "invitations", "invitations/respond"])
      assert.equal((await iris.post(path)).status, 404, "Les anciens contrôles d'accès ne sont plus exposés");
    const forged = await june.post("save", { ownerId: "iris", expectedRevision: initial.revision,
      operationId: randomUUID(), decoration: initial.decoration });
    assert.equal(forged.status, 400, "Visiter ne permet pas de modifier une maison tierce");
  } finally { await g.close(); }
});

test("Les visites ouvertes conservent les blocages bilatéraux et retirent le visiteur immédiatement", async () => {
  const g = await setup();
  try {
    const iris = await g.enter("aurore", "iris"), june = await g.enter("sacha", "june");
    const visitor = g.connect(june); await visitor.wait("welcome");
    visitor.send({ type: "join-room", roomId: "home:iris" }); await visitor.wait("home-layout");
    const block = await g.call("block", iris.cookie, { generation: iris.generation, peer: "june", blocked: true });
    assert.equal(block.status, 200); await visitor.wait("home-removed");
    assert.equal((await june.post("load", { ownerId: "iris" })).status, 400);
    assert.equal((await iris.post("load", { ownerId: "june" })).status, 400);
    visitor.send({ type: "join-room", roomId: "home:iris" }); await visitor.wait("room-unavailable");
    await g.call("block", iris.cookie, { generation: iris.generation, peer: "june", blocked: false });
    assert.equal((await june.post("load", { ownerId: "iris" })).status, 200);
    assert.equal((await g.call("housing/load", undefined, { generation: 1, ownerId: "iris" })).status, 401);
  } finally { await g.close(); }
});
