import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { createApp } from "../apps/server/src/app.ts";
import { openDatabase, type Database } from "../apps/server/src/db.ts";
import { ARCADE_COLUMNS, ARCADE_GAMES, MOLE_LIVES, MOLE_MISS, MOLE_TARGET, arcadeLevel, replayArcade, replayMemory, replayMole, WHEEL_PRIZES } from "../packages/domain/src/arcade.ts";

const origin = "http://127.0.0.1:5173";
type App = Awaited<ReturnType<typeof createApp>>;
async function request(
  app: App,
  path: string,
  cookie?: string,
  body?: unknown,
) {
  const response = await app.inject({
    method: body === undefined ? "GET" : "POST",
    url: "/api/" + path,
    headers: { origin, ...(cookie ? { cookie } : {}) },
    payload: body as Record<string, unknown> | undefined,
  });
  return {
    status: response.statusCode,
    data: response.json(),
    cookie: response.headers["set-cookie"]?.toString().split(";")[0],
  };
}
async function enter(app: App, account: string, character: string) {
  const auth = await request(app, "login", undefined, { account });
  assert.equal(auth.status, 200);
  const activation = await request(app, "activate", auth.cookie, { character });
  assert.equal(activation.status, 200);
  return { cookie: auth.cookie!, generation: activation.data.generation };
}
function connect(url: string, cookie: string) {
  const ws = new WebSocket(url, { origin, headers: { cookie } });
  const events: any[] = [];
  ws.on("message", (data) => events.push(JSON.parse(data.toString())));
  return {
    ws,
    events,
    wait: async (type: string, predicate: (e: any) => boolean = () => true) => {
      const start = Date.now();
      while (Date.now() - start < 5000) {
        const found = events.find((e) => e.type === type && predicate(e));
        if (found) return found;
        await new Promise((r) => setTimeout(r, 15));
      }
      throw new Error(`Événement ${type} absent : ${JSON.stringify(events)}`);
    },
  };
}

test("Seul un compte VIP peut importer le fond de son profil, et les autres joueurs peuvent le voir", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db, { profileImageVipAccounts: ["aurore"] });
  try {
    const iris = await enter(app, "aurore", "iris");
    const june = await enter(app, "sacha", "june");
    const bytes = readFileSync("public/assets/wallet/diamants.png");
    const profileImage = "data:image/png;base64," + bytes.toString("base64");
    const save = (player: typeof iris, image: string) => request(app, "profile/motto", player.cookie, {
      generation: player.generation, template: "image", motto: "Bonjour", profileImage: image,
    });
    assert.equal((await save(june, profileImage)).status, 400);
    assert.equal((await save(iris, "data:image/svg+xml;base64,PHN2Zy8+")).status, 400);
    const result = await save(iris, profileImage);
    assert.equal(result.status, 200);
    const contact = (await request(app, "state", june.cookie)).data.contacts.find((c: { id: string }) => c.id === "iris");
    assert.equal(contact.profile_template, "image");
    assert.equal(contact.profile_image_version, result.data.profile_image_version);
    const image = await app.inject({ url: "/api/profile/image/iris/" + contact.profile_image_version,
      headers: { cookie: june.cookie } });
    assert.equal(image.statusCode, 200);
    assert.equal(image.headers["content-type"], "image/png");
    assert.deepEqual(image.rawPayload, bytes);
  } finally {
    await app.close();
    await db.close();
  }
});

test("P0 : autorisation, idempotence, non-lus, blocage, signalements et reconnexion", async (t) => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  assert(address && typeof address !== "string");
  const url = `ws://127.0.0.1:${address.port}/ws`;
  const sockets: WebSocket[] = [];
  try {
    const a = await enter(app, "aurore", "iris"),
      b = await enter(app, "sacha", "june");
    await t.test("personnages et accès privés isolés", async () => {
      assert.equal(
        (await request(app, "activate", a.cookie, { character: "june" }))
          .status,
        400,
      );
      assert.equal((await request(app, "state")).status, 401);
      const evil = await app.inject({
        method: "POST",
        url: "/api/message",
        headers: { cookie: a.cookie, origin: "https://evil.example" },
        payload: {},
      });
      assert.equal(evil.statusCode, 403);
      const remote = await app.inject({
        url: "/api/state",
        remoteAddress: "192.168.1.5",
      });
      assert.equal(remote.statusCode, 403);
    });
    await t.test(
      "la bulle sauvegardée appartient au personnage actif et apparaît sur son profil",
      async () => {
        const motto = "Les roses après la pluie.";
        assert.equal(
          (
            await request(app, "profile/motto", undefined, {
              generation: a.generation,
              motto,
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await request(app, "profile/motto", a.cookie, {
              generation: a.generation + 1,
              motto,
            })
          ).status,
          400,
        );
        const saved = await request(app, "profile/motto", a.cookie, {
          generation: a.generation,
          motto: ` ${motto} `,
          template: "constellation",
        });
        assert.equal(saved.status, 200);
        assert.equal(saved.data.motto, motto);
        assert.equal(saved.data.profile_template, "constellation");
        const other = await request(app, "state", b.cookie);
        assert.equal(
          other.data.contacts.find((item: { id: string }) => item.id === "iris")
            .motto,
          motto,
        );
        assert.equal(other.data.character.motto, "");
        assert.equal(other.data.contacts.find((item: { id: string }) => item.id === "iris").profile_template, "constellation");
        const cleared = await request(app, "profile/motto", a.cookie, {
          generation: a.generation,
          motto: "",
        });
        assert.equal(cleared.data.motto, "");
        const owner = await request(app, "state", a.cookie);
        assert.equal(owner.data.character.profile_template, "constellation");
      },
    );
    let messageId = 0;
    const commandId = randomUUID();
    await t.test(
      "message hors ligne, retry idempotent et reçu de lecture autorisé",
      async () => {
        const payload = {
          generation: a.generation,
          peer: "june",
          body: "<img src=x onerror=alert(1)> Bonjour 🌷",
          commandId,
        };
        assert.equal(
          (await request(app, "message", a.cookie, payload)).status,
          200,
        );
        assert.equal(
          (await request(app, "message", a.cookie, payload)).status,
          200,
        );
        assert.equal(
          (
            await request(app, "message", a.cookie, {
              ...payload,
              body: "autre texte",
            })
          ).status,
          400,
        );
        const state = (await request(app, "state", b.cookie)).data;
        assert.equal(
          state.contacts.find((c: any) => c.id === "iris").unread,
          1,
        );
        const conversation = (await request(app, "conversation/iris", b.cookie))
          .data.messages;
        assert.equal(conversation.length, 1);
        assert.equal(conversation[0].body, payload.body);
        messageId = conversation[0].id;
        assert.equal(
          (
            await request(app, "read", a.cookie, {
              generation: a.generation,
              peer: "june",
              lastId: messageId,
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request(app, "read", b.cookie, {
              generation: b.generation,
              peer: "iris",
              lastId: messageId,
            })
          ).status,
          200,
        );
        assert.equal(
          (await request(app, "state", b.cookie)).data.contacts.find(
            (c: any) => c.id === "iris",
          ).unread,
          0,
        );
        assert.equal(
          (await request(app, "conversation/noa", a.cookie)).data.messages
            .length,
          0,
        );
      },
    );
    await t.test(
      "déplacements réellement diffusés, coordonnées refusées",
      async () => {
        const ca = connect(url, a.cookie),
          cb = connect(url, b.cookie);
        sockets.push(ca.ws, cb.ws);
        await ca.wait("welcome");
        await cb.wait("welcome");
        await ca.wait("room", (e) => e.players.length === 2);
        ca.ws.send(
          JSON.stringify({
            type: "move",
            generation: a.generation,
            x: 70,
            y: 80,
          }),
        );
        await cb.wait("room", (e) =>
          e.players.some(
            (p: any) => p.id === "iris" && p.x === 70 && p.y === 80,
          ),
        );
        ca.ws.send(
          JSON.stringify({
            type: "move",
            generation: a.generation,
            x: 999,
            y: 80,
          }),
        );
        await ca.wait("error");
        ca.ws.send(
          JSON.stringify({
            type: "join-room",
            generation: a.generation,
            roomId: "fountain",
          }),
        );
        const fountain = await ca.wait("room", (e) => e.roomId === "fountain");
        assert.deepEqual(
          fountain.players.map((p: { id: string }) => p.id),
          ["iris"],
        );
        assert.deepEqual(fountain.counts, {
          greenhouse: 1,
          fountain: 1,
          terrace: 0,
        });
        const greenhouse = await cb.wait(
          "room",
          (e) => e.counts.fountain === 1,
        );
        assert.deepEqual(
          greenhouse.players.map((p: { id: string }) => p.id),
          ["june"],
        );
        assert(greenhouse.onlineIds.includes("iris"));
        const sendPublic = (roomId: string, body: string) => {
          const commandId = randomUUID();
          ca.ws.send(
            JSON.stringify({
              type: "room-chat",
              generation: a.generation,
              roomId,
              commandId,
              body,
            }),
          );
          return ca.wait("room-chat-ack", (e) => e.commandId === commandId);
        };
        assert.ok((await sendPublic("greenhouse", "Mauvaise salle")).error);
        const body = "<b>Bonjour, fontaine !</b>";
        assert.equal((await sendPublic("fountain", body)).error, undefined);
        const hasMessage = (e: { messages: { body: string }[] }) =>
          e.messages.some((message) => message.body === body);
        const ownChat = await ca.wait("room-chat", hasMessage);
        assert.equal(ownChat.roomId, "fountain");
        assert.equal(ownChat.messages.at(-1).name, "Iris");
        assert.equal(
          cb.events.some(
            (e) => e.type === "room-chat" && e.roomId === "fountain",
          ),
          false,
        );
        cb.ws.send(
          JSON.stringify({
            type: "join-room",
            generation: b.generation,
            roomId: "fountain",
          }),
        );
        await cb.wait(
          "room-chat",
          (e) => e.roomId === "fountain" && hasMessage(e),
        );
        assert.equal(
          (
            await request(app, "block", b.cookie, {
              generation: b.generation,
              peer: "iris",
              blocked: true,
            })
          ).status,
          200,
        );
        await cb.wait(
          "room-chat",
          (e) => e.roomId === "fountain" && e.messages.length === 0,
        );
        assert.equal(
          (
            await request(app, "block", b.cookie, {
              generation: b.generation,
              peer: "iris",
              blocked: false,
            })
          ).status,
          200,
        );
        cb.events.length = 0;
        cb.ws.send(
          JSON.stringify({
            type: "join-room",
            generation: b.generation,
            roomId: "greenhouse",
          }),
        );
        await cb.wait(
          "room",
          (e) => e.roomId === "greenhouse" && e.counts.fountain === 1,
        );
        ca.events.length = 0;
        ca.ws.send(
          JSON.stringify({
            type: "join-room",
            generation: a.generation,
            roomId: "greenhouse",
          }),
        );
        await ca.wait(
          "room",
          (e) => e.roomId === "greenhouse" && e.players.length === 2,
        );
        cb.ws.close();
        await new Promise((r) => cb.ws.once("close", r));
        await ca.wait("room", (e) => e.players.length === 1);
        const replacement = connect(url, b.cookie);
        sockets.push(replacement.ws);
        await replacement.wait("welcome");
        await replacement.wait("room", (e) => e.players.length === 2);
        const hidden = new WebSocket(url, {
          origin: "https://evil.example",
          headers: { cookie: a.cookie },
        });
        hidden.on("error", () => {});
        const code = await new Promise<number>((resolve) => {
          hidden.on("unexpected-response", (_req, res) => {
            resolve(res.statusCode!);
            res.resume();
            hidden.terminate();
          });
        });
        assert.equal(code, 403);
      },
    );
    await t.test(
      "blocage bilatéral sans suppression, signalement persistant et privé",
      async () => {
        assert.equal(
          (
            await request(app, "block", b.cookie, {
              generation: b.generation,
              peer: "iris",
              blocked: true,
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await request(app, "message", a.cookie, {
              generation: a.generation,
              peer: "june",
              body: "Bloqué",
              commandId: randomUUID(),
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request(app, "message", b.cookie, {
              generation: b.generation,
              peer: "iris",
              body: "Bloqué aussi",
              commandId: randomUUID(),
            })
          ).status,
          400,
        );
        assert.equal(
          (await request(app, "conversation/iris", b.cookie)).data.messages
            .length,
          1,
        );
        assert.equal(
          (
            await request(app, "report", b.cookie, {
              generation: b.generation,
              peer: "iris",
              reason: "Comportement de test",
            })
          ).status,
          200,
        );
        assert.equal(
          (await db.query("SELECT COUNT(*)::integer AS n FROM reports")).rows[0]
            .n,
          1,
        );
        assert.equal(
          (
            await request(app, "report", b.cookie, {
              generation: b.generation,
              peer: "iris",
              reason: "Deuxième signalement",
            })
          ).status,
          400,
        );
        assert.equal((await request(app, "reports", a.cookie)).status, 404);
        await request(app, "block", b.cookie, {
          generation: b.generation,
          peer: "iris",
          blocked: false,
        });
      },
    );
    await t.test(
      "activation concurrente : une génération et un personnage actifs",
      async () => {
        const nextLogin = await request(app, "login", undefined, {
          account: "aurore",
        });
        const token2 = nextLogin.cookie!;
        const results = await Promise.all([
          request(app, "activate", a.cookie, { character: "milo" }),
          request(app, "activate", token2, { character: "iris" }),
        ]);
        assert(results.every((r) => r.status === 200));
        const sessions = (
          await db.query(
            "SELECT * FROM play_sessions WHERE account_id='aurore'",
          )
        ).rows;
        assert.equal(sessions.length, 1);
        const s1 = (await request(app, "state", a.cookie)).data,
          s2 = (await request(app, "state", token2)).data;
        assert.equal(Number(!!s1.character) + Number(!!s2.character), 1);
        const stale = await request(app, "message", a.cookie, {
          generation: a.generation,
          peer: "june",
          body: "Périmé",
          commandId: randomUUID(),
        });
        assert.equal(stale.status, 400);
        assert.equal(
          (await request(app, "conversation/june", a.cookie)).status,
          400,
        );
        const reactivated = await request(app, "activate", a.cookie, {
          character: "milo",
        });
        assert.equal(reactivated.data.character.id, "milo");
        assert.equal(
          (await request(app, "conversation/june", a.cookie)).data.messages
            .length,
          0,
        );
      },
    );
  } finally {
    for (const ws of sockets) ws.terminate();
    await app.close();
    await db.close();
  }
});

test("admission concurrente : la seizième connexion est refusée", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  const connections: ReturnType<typeof connect>[] = [];
  try {
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    assert(address && typeof address !== "string");
    const url = `ws://127.0.0.1:${address.port}/ws`;
    for (let i = 0; i < 16; i++) {
      await db.query("INSERT INTO accounts VALUES ($1,$2)", [
        "test" + i,
        "Test",
      ]);
      await db.query("INSERT INTO play_sessions(account_id) VALUES ($1)", [
        "test" + i,
      ]);
      await db.query("INSERT INTO characters VALUES ($1,$2,1,$3,$4,$5)", [
        "char" + i,
        "test" + i,
        "Test " + i,
        "#7860a8",
        "#55354b",
      ]);
    }
    const identities = [];
    for (let i = 0; i < 16; i++)
      identities.push(await enter(app, "test" + i, "char" + i));
    // All handshakes compete for admission through the same server authority.
    for (const identity of identities)
      connections.push(connect(url, identity.cookie));
    await Promise.all(
      connections.map(async (c) => {
        await Promise.race([c.wait("welcome"), c.wait("error")]);
      }),
    );
    assert.equal(
      connections.filter((c) => c.events.some((e) => e.type === "welcome"))
        .length,
      15,
    );
    assert.equal(
      connections.filter((c) =>
        c.events.some(
          (e) => e.type === "error" && e.message.includes("complète"),
        ),
      ).length,
      1,
    );
    for (const c of connections)
      for (const e of c.events)
        if (e.type === "room") assert(e.players.length <= 15);
  } finally {
    for (const c of connections) c.ws.terminate();
    await app.close();
    await db.close();
  }
});

test("les messages survivent à la fermeture et à la réouverture de PostgreSQL embarqué", async () => {
  const directory = await mkdtemp(join(tmpdir(), "social-p0-"));
  const path = join(directory, "postgres");
  let db: Database = await openDatabase(path);
  let app = await createApp(db);
  try {
    const a = await enter(app, "aurore", "iris");
    await request(app, "message", a.cookie, {
      generation: a.generation,
      peer: "june",
      body: "À la prochaine connexion !",
      commandId: randomUUID(),
    });
    await app.close();
    await db.close();
    db = await openDatabase(path);
    app = await createApp(db);
    const b = await enter(app, "sacha", "june");
    const messages = (await request(app, "conversation/iris", b.cookie)).data
      .messages;
    assert.equal(messages.length, 1);
    assert.equal(messages[0].body, "À la prochaine connexion !");
    assert.equal(
      (await request(app, "state", b.cookie)).data.contacts.find(
        (c: any) => c.id === "iris",
      ).unread,
      1,
    );
  } finally {
    await app.close();
    await db.close();
  }
});

test("Les actions de profil sont persistantes et les relations nécessitent l’accord du destinataire", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  try {
    const iris = await enter(app, "aurore", "iris");
    const june = await enter(app, "sacha", "june");
    const mutate = (from: typeof iris, peer: string, action: unknown) =>
      request(app, "profile/social", from.cookie, {
        generation: from.generation,
        peer,
        action,
      });
    const read = (from: typeof iris, peer: string) =>
      request(app, "profile/social/" + peer, from.cookie);

    assert.equal((await mutate(iris, "iris", { type: "like" })).status, 400);
    const like = { type: "like" };
    assert.equal((await mutate(iris, "june", like)).data.xpSent, 5);
    assert.equal((await mutate(iris, "june", like)).data.xpSent, 0);
    assert.equal((await read(iris, "june")).data.likes, 1);
    assert.equal(
      (await mutate(iris, "june", { type: "photo" })).data.xpSent,
      10,
    );
    assert.equal(
      (await mutate(iris, "june", { type: "photo" })).data.xpSent,
      0,
    );
    assert.equal(
      (await request(app, "state", iris.cookie)).data.character.xp,
      0,
    );
    const outfit = { top: "fashion.premium-velvet", bottom: null, shoes: null,
      colors: { "fashion.premium-velvet": "#663388" } };
    assert.equal((await request(app, "profile/outfit", june.cookie, {
      generation: june.generation, outfit,
    })).status, 200);
    const remote = (await request(app, "state", iris.cookie)).data.contacts.find((p: any) => p.id === "june");
    assert.deepEqual(remote.outfit, outfit);
    const lookKey = (await read(iris, "june")).data.lookKey;
    const look = { type: "look-like", lookKey };
    assert.equal((await mutate(iris, "june", look)).data.xpSent, 5);
    assert.equal((await mutate(iris, "june", look)).data.xpSent, 0);
    const face = { eyes: "blue", lips: "berry", skin: "tan", nose: "fine" };
    assert.equal((await request(app, "profile/outfit", june.cookie, {
      generation: june.generation, outfit: { ...outfit, face },
    })).status, 200);
    assert.equal((await read(iris, "june")).data.lookKey, lookKey);
    const recipient = (await request(app, "state", june.cookie)).data;
    assert.deepEqual(recipient.character.outfit.face, face);
    assert.equal(recipient.character.xp, 0);
    assert.equal(recipient.xpMagazine.rewards.reduce((sum: number, row: { points: number }) => sum + row.points, 0), 20);
    assert.deepEqual(recipient.xpMagazine.activity, ["like", "look-like", "photo"].map((source) => ({
      source, actor: "iris", name: "Iris", count: 1,
    })));
    const pickup = { id: randomUUID(), points: 4 };
    const claimPickup = () => request(app, "xp/claim", june.cookie, { generation: june.generation, pickup });
    const firstPickup = await claimPickup();
    assert.equal(firstPickup.status, 200);
    assert.equal(firstPickup.data.claimed, 4);
    assert.equal(firstPickup.data.xp, 4);
    const repeated = await claimPickup();
    assert.equal(repeated.data.claimed, 0);
    assert.equal(repeated.data.xp, 4);
    const claimPhotos = () => request(app, "xp/claim", june.cookie, {
      generation: june.generation, source: "photo",
    });
    const photos = await claimPhotos();
    assert.equal(photos.status, 200);
    assert.equal(photos.data.claimed, 10);
    assert.deepEqual(photos.data.magazine.rewards.map(({ source, points }: { source: string; points: number }) =>
      [source, points]), [["like", 1], ["look-like", 5]]);
    assert.equal((await claimPhotos()).data.claimed, 0);
    const claim = () => request(app, "xp/claim", june.cookie, { generation: june.generation });
    const results = await Promise.all([claim(), claim()]);
    assert.deepEqual(results.map(({ data }) => data.claimed).sort((a, b) => a - b), [0, 6]);
    assert.deepEqual(results[0].data.magazine.activity, recipient.xpMagazine.activity);
    const leader = (await request(app, "ranking", iris.cookie)).data.entries[0];
    assert.equal(leader.id, "june");
    assert.equal(leader.profileLikes, 1);
    assert.equal(leader.friend, false);
    await mutate(iris, "june", { type: "guestbook", body: "Bonjour June !" });
    assert.equal(
      (await read(june, "june")).data.guestbook[0].body,
      "Bonjour June !",
    );
    assert.deepEqual((await read(june, "iris")).data.featuredRelations, {
      bestFriends: [],
      partner: null,
    });

    await mutate(iris, "june", { type: "relation", kind: "friend", accept: false });
    const incoming = async () => (await request(app, "state", june.cookie)).data.contacts
      .find((contact: { id: string }) => contact.id === "iris").friendRequest;
    assert.equal(await incoming(), true);
    assert.equal((await mutate(june, "iris", { type: "decline-friend" })).status, 200);
    assert.equal(await incoming(), false);

    for (const kind of ["friend", "best-friend", "romance"]) {
      const action = { type: "relation", kind, accept: false };
      assert.equal(
        (await mutate(iris, "june", action)).data.relations[kind],
        "outgoing",
      );
      assert.equal(
        (await mutate(iris, "june", { ...action, accept: true })).data
          .relations[kind],
        "outgoing",
      );
      assert.equal((await read(june, "iris")).data.relations[kind], "incoming");
      const inbox = (await request(app, "state", june.cookie)).data.contacts;
      assert.equal(
        inbox.find((contact: { id: string }) => contact.id === "iris")
          .profileRequests,
        1,
      );
      assert.equal(
        (await mutate(june, "iris", { ...action, accept: true })).data
          .relations[kind],
        "accepted",
      );
      assert.equal((await read(iris, "june")).data.relations[kind], "accepted");
    }
    assert.deepEqual((await read(iris, "iris")).data.featuredRelations, {
      bestFriends: [{ id: "june", name: "June" }],
      partner: { id: "june", name: "June" },
    });
    const nova = await enter(app, "test-xp", "nova-xp");
    const propose = { type: "relation", kind: "romance", accept: false };
    assert.equal((await mutate(nova, "iris", propose)).status, 200);
    assert.equal((await mutate(iris, "nova-xp", { ...propose, accept: true })).status, 400);
    for (const friend of ["milo", "noa"])
      await db.query(
        "INSERT INTO profile_relations VALUES (LEAST('iris',$1), GREATEST('iris',$1), 'best-friend', 'iris', TRUE)",
        [friend],
      );
    const bestFriend = { ...propose, kind: "best-friend" };
    assert.equal((await mutate(nova, "iris", bestFriend)).status, 200);
    assert.equal((await mutate(iris, "nova-xp", { ...bestFriend, accept: true })).status, 400);
    assert.equal((await read(iris, "iris")).data.featuredRelations.bestFriends.length, 3);

    const item = {
      pieceId: "atelier.prune-fumee-escarpins",
      key: "variant",
      color: "#ffffff",
      purchasedAt: 100,
    };
    const gift = { type: "gift", item, id: randomUUID() };
    assert.equal((await mutate(iris, "june", gift)).status, 200);
    assert.equal((await mutate(iris, "june", gift)).status, 200);
    assert.equal(
      (await mutate(iris, "june", { ...gift, id: randomUUID() })).status,
      400,
    );
    assert.deepEqual(
      (await request(app, "state", june.cookie)).data.garmentTransfers,
      [{ id: gift.id, sender: "iris", recipient: "june", item }],
    );
    await db.query("INSERT INTO blocks VALUES ($1,$2)", ["june", "iris"]);
    assert.equal((await mutate(iris, "june", like)).status, 400);
    assert.deepEqual((await read(iris, "june")).data.relations, {});
  } finally {
    await app.close();
    await db.close();
  }
});

test("L’ordre des calques d’une tenue est sauvegardé et partagé avec les autres joueurs", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  try {
    const iris = await enter(app, "aurore", "iris");
    const outfit = {
      top: "fashion.capsule-mode-cerise",
      top2: "fashion.rose-bow-camisole",
      bottom: "fashion.pants-rocade",
      shoes: null,
      outerwear: "fashion.y2k-mcbling",
      layerOrder: ["top", "outerwear", "top2", "bottom"],
    };
    const save = await request(app, "profile/outfit", iris.cookie, { generation: iris.generation, outfit });
    assert.equal(save.status, 200);
    assert.deepEqual(save.data.outfit, outfit);
    const june = await enter(app, "sacha", "june");
    const state = await request(app, "state", june.cookie);
    assert.deepEqual(state.data.contacts.find(({ id }: { id: string }) => id === "iris").outfit, outfit);
  } finally {
    await app.close();
    await db.close();
  }
});

test("Le ticket à gratter donne un seul gain quotidien par compte, à récolter une seule fois", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  try {
    const { cookie, generation } = await enter(app, "aurore", "iris");
    assert.deepEqual((await request(app, "arcade/scratch", cookie)).data, { ticket: null });
    const play = () => request(app, "arcade/scratch", cookie, { generation });
    const [first, duplicate] = await Promise.all([play(), play()]);
    assert.equal(first.status, 200);
    assert.deepEqual(duplicate, first);
    const { ticket } = first.data;
    assert.equal(ticket.claimed, false);
    const before = (await request(app, "state", cookie)).data;
    assert.equal(before.character.xp, 0);
    assert.equal(before.rewardWheel.accountCoins, 0);
    assert.equal(before.rewardWheel.accountDiamonds, 0);
    assert.deepEqual(before.rewardWheel.pending, []);
    const milo = await enter(app, "aurore", "milo");
    assert.deepEqual((await request(app, "arcade/scratch", milo.cookie)).data, { ticket });
    const replay = () => request(app, "arcade/scratch", milo.cookie, { generation: milo.generation });
    assert.deepEqual((await replay()).data, { ticket });
    const june = await enter(app, "sacha", "june");
    const claim = (session: typeof milo, id: string) =>
      request(app, "arcade/scratch/claim", session.cookie, { generation: session.generation, id });
    assert.equal((await claim(june, ticket.id)).status, 400);
    for (const [index, [currency, amount]] of [["coins", 100], ["diamonds", 1], ["xp", 25]].entries()) {
      const { ticket: current } = (await replay()).data;
      await db.query("UPDATE daily_scratch_tickets SET currency=$1,amount=$2 WHERE id=$3", [currency, amount, current.id]);
      const collected = await claim(milo, current.id);
      assert.equal(collected.status, 200);
      assert.equal(collected.data.wheel.accountCoins, 100);
      assert.equal(collected.data.wheel.accountDiamonds, index >= 1 ? 1 : 0);
      assert.equal(collected.data.xp, index === 2 ? 25 : 0);
      assert.deepEqual(await claim(milo, current.id), collected);
      assert.equal((await replay()).data.ticket.claimed, true);
      await db.query("UPDATE daily_scratch_tickets SET play_day=play_day-1");
      assert.deepEqual((await request(app, "arcade/scratch", milo.cookie)).data, { ticket: null });
    }
  } finally {
    await app.close();
    await db.close();
  }
});

test("Les jeux et les niveaux alimentent la même roue, sans récompenser deux fois la même action", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  try {
    const { cookie, generation } = await enter(app, "aurore", "iris");
    const scores: number[] = [];
    for (const game of ARCADE_GAMES) {
      const start = await request(app, "arcade/start", cookie, { generation, game });
      assert.equal(start.status, 200);
      const { id, seed } = start.data;
      assert.equal((await request(app, "arcade/finish", cookie, { generation, id, moves: [] })).status, 400);
      const moves: number[] = [];
      if (game === "mole") {
        const finish = (moves: number[]) => request(app, "arcade/finish", cookie, { generation, id, moves });
        const ticketsBefore = (await request(app, "state", cookie)).data.rewardWheel.tickets;
        const missed = Array<number>(MOLE_LIVES).fill(MOLE_MISS);
        assert.equal((await finish(missed)).status, 400);
        assert.equal((await finish([(replayMole(seed, []).hole + 1) % MOLE_MISS])).status, 400);
        moves.push(MOLE_MISS);
        for (let i = 0; i < MOLE_TARGET; i++) moves.push(replayMole(seed, moves).hole);
        const victory = await finish(moves);
        assert.equal(victory.status, 200);
        assert.equal(victory.data.wheel.tickets, ticketsBefore + 1);
        const retry = await finish(moves);
        assert.equal(retry.status, 200);
        assert.equal(retry.data.wheel.tickets, ticketsBefore + 1);
        scores.push(MOLE_TARGET);
        continue;
      }
      if (game === "memory") {
        const { deck } = replayMemory(seed, []);
        assert.equal((await request(app, "arcade/finish", cookie, { generation, id, moves: [8] })).status, 400);
        for (const face of new Set(deck))
          moves.push(...deck.flatMap((item, index) => item === face ? [index] : []));
        scores.push(replayMemory(seed, moves).score);
        const finish = () => request(app, "arcade/finish", cookie, { generation, id, moves });
        assert.equal((await finish()).status, 200);
        assert.equal((await finish()).status, 200);
        continue;
      }
      for (let i = 0; i < 65; i++) {
        const board = replayArcade(game, seed, moves);
        if (arcadeLevel(board.score) >= 5) break;
        if (game === "petal") moves.push(i % ARCADE_COLUMNS);
        else if (game === "comet") moves.push(board.grid[0].findIndex((_, col) => board.grid.some((row) => row[col])));
        else {
          const col = board.grid[0].findIndex((_, x) =>
            [...board.grid].reverse().find((row) => row[x])?.[x] === board.next[0]);
          moves.push(col < 0 ? ARCADE_COLUMNS : col);
        }
      }
      const finish = () => request(app, "arcade/finish", cookie, { generation, id, moves });
      scores.push(replayArcade(game, seed, moves).score);
      assert.equal((await finish()).status, 200, game);
      assert.equal((await finish()).status, 200);
    }
    await db.query("UPDATE characters SET xp=11000 WHERE id='iris'");
    assert.equal((await request(app, "ranking", cookie)).data.entries[0].bestScore, Math.max(...scores));
    assert.equal((await request(app, "state", cookie)).data.rewardWheel.tickets, ARCADE_GAMES.length + 2);
    const id = randomUUID();
    const spin = () => request(app, "wheel/spin", cookie, { generation, id });
    const first = await spin();
    assert.equal(first.status, 200);
    const prize = WHEEL_PRIZES[first.data.index as number];
    const drops = first.data.wheel.pending as { id: string; currency: string; amount: number; burst?: string }[];
    assert.equal(drops.length, Math.min(5, prize.amount));
    assert.ok(drops.every((drop) => drop.burst === id && drop.currency === prize.currency));
    assert.equal(drops.reduce((total, drop) => total + drop.amount, 0), prize.amount);
    assert.deepEqual((await spin()).data, first.data);
    assert.equal(first.data.wheel.tickets, ARCADE_GAMES.length + 1);
    assert.equal(first.data.wheel.accountCoins, 0);
    assert.equal(first.data.wheel.accountDiamonds, 0);
    const collect = (dropId: string) => request(app, "wheel/collect", cookie, { generation, id: dropId });
    const partial = (await collect(drops[0].id)).data;
    assert.equal(partial.wheel.pending.length, drops.length - 1);
    assert.equal(partial.wheel.accountCoins, prize.currency === "coins" ? drops[0].amount : 0);
    assert.deepEqual((await collect(drops[0].id)).data, partial);
    let result = partial;
    for (const drop of drops.slice(1)) result = (await collect(drop.id)).data;
    assert.equal(result.wheel.accountCoins, prize.currency === "coins" ? prize.amount : 0);
    assert.equal(result.wheel.accountDiamonds, 0);
    assert.equal(result.xp, 11000 + (prize.currency === "xp" ? prize.amount : 0));
    assert.equal(result.wheel.tickets, ARCADE_GAMES.length + 1);
    assert.deepEqual(result.wheel.pending, []);
    assert.deepEqual((await collect(drops[0].id)).data, result);
  } finally {
    await app.close();
    await db.close();
  }
});

test("Une maison isole ses visiteurs et le chat du quartier", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  assert(address && typeof address !== "string");
  const url = `ws://127.0.0.1:${address.port}/ws`;
  const sockets: WebSocket[] = [];
  try {
    const iris = await enter(app, "aurore", "iris");
    const june = await enter(app, "sacha", "june");
    const first = connect(url, iris.cookie);
    const second = connect(url, june.cookie);
    sockets.push(first.ws, second.ws);
    await Promise.all([first.wait("welcome"), second.wait("welcome")]);
    first.ws.send(
      JSON.stringify({
        type: "join-room",
        generation: iris.generation,
        roomId: "home:june",
      }),
    );
    const alone = await first.wait(
      "room",
      (event) => event.roomId === "home:june",
    );
    assert.deepEqual(
      alone.players.map((player: { id: string }) => player.id),
      ["iris"],
    );
    const commandId = randomUUID();
    first.ws.send(
      JSON.stringify({
        type: "room-chat",
        generation: iris.generation,
        roomId: "home:june",
        commandId,
        body: "Bienvenue à la maison",
      }),
    );
    await first.wait("room-chat-ack", (event) => event.commandId === commandId);
    assert.ok(second.events.every((event) => event.roomId !== "home:june"));
    second.ws.send(
      JSON.stringify({
        type: "join-room",
        generation: june.generation,
        roomId: "home:june",
      }),
    );
    const shared = await second.wait(
      "room",
      (event) => event.roomId === "home:june",
    );
    assert.equal(shared.players.length, 2);
    const chat = await second.wait(
      "room-chat",
      (event) => event.roomId === "home:june",
    );
    assert.equal(chat.messages[0].body, "Bienvenue à la maison");
  } finally {
    for (const ws of sockets) ws.terminate();
    await app.close();
    await db.close();
  }
});
