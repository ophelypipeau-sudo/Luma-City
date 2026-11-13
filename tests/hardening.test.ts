import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApp, describeError } from "../apps/server/src/app.ts";
import { explicitSslMode, migrate, openDatabase } from "../apps/server/src/db.ts";
import { PlayerError } from "../apps/server/src/wardrobe.ts";
import { starterPieces } from "../packages/contracts/src/player-account.ts";

type App = Awaited<ReturnType<typeof createApp>>;
const localOrigin = "http://127.0.0.1:5173";
async function call(app: App, path: string, cookie?: string, body?: unknown, headers: Record<string, string> = {}) {
  const response = await app.inject({
    method: body === undefined ? "GET" : "POST",
    url: "/api/" + path,
    headers: { origin: localOrigin, ...(cookie ? { cookie } : {}), ...headers },
    payload: body as Record<string, unknown> | undefined,
  });
  return {
    status: response.statusCode,
    data: response.json(),
    cookie: response.headers["set-cookie"]?.toString().split(";")[0],
  };
}
async function enter(app: App, account: string, character: string) {
  const auth = await call(app, "login", undefined, { account });
  assert.equal(auth.status, 200);
  const activation = await call(app, "activate", auth.cookie, { character });
  assert.equal(activation.status, 200);
  return { cookie: auth.cookie!, generation: activation.data.generation as number };
}
const starter = { hair: starterPieces.hair[0], top: starterPieces.top[0], bottom: starterPieces.bottom[0], shoes: starterPieces.shoes[0] };

test("la boutique débite le solde serveur et refuse un achat sans fonds", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  try {
    const iris = await enter(app, "aurore", "iris");
    const state = (await call(app, "state", iris.cookie)).data;
    assert.equal(state.wardrobe.balance, 10_000);
    const draft = { top: "fashion.premium-velvet", bottom: null, shoes: null };
    const first = await call(app, "shop/buy", iris.cookie, { generation: iris.generation, draft });
    assert.equal(first.status, 200);
    assert.equal(first.data.wardrobe.balance, 9_100);
    assert.equal(first.data.outfit.top, "fashion.premium-velvet");
    const again = await call(app, "shop/buy", iris.cookie, { generation: iris.generation, draft });
    assert.equal(again.data.charged, 0, "an owned variant is never charged twice");
    // A brand-new player starts with no coins: nothing priced can be bought.
    const player = await call(app, "register", undefined, { name: "Camille", password: "motdepasse", privacy: true, outfit: starter });
    assert.equal(player.status, 200);
    const poor = await call(app, "shop/buy", player.cookie, { generation: player.data.generation, draft: { ...starter, top: "fashion.premium-velvet" } });
    assert.equal(poor.status, 400);
    assert.match(poor.data.error, /pas assez de pièces/);
    const after = (await call(app, "state", player.cookie)).data;
    assert.equal(after.wardrobe.balance, 0);
    assert.equal(after.character.outfit.top, starter.top);
  } finally {
    await app.close();
    await db.close();
  }
});

test("les deux personnages d’un compte ne peuvent pas dépenser deux fois le même solde", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  try {
    const iris = await enter(app, "aurore", "iris");
    // Leave only enough for one 900-coin piece on the shared account.
    await db.query(
      "INSERT INTO wardrobe_items (character_id,item_key,piece_id,purchased_at,price,paid_by) VALUES ('milo','seed','fashion.y2k-mcbling',1,8500,'aurore')");
    const buys = await Promise.all(["fashion.premium-velvet", "fashion.pants-rocade"].map((id, index) =>
      call(app, "shop/buy", iris.cookie, {
        generation: iris.generation,
        draft: index ? { top: null, bottom: id, shoes: null } : { top: id, bottom: null, shoes: null },
        onlyPieceId: id,
      })));
    assert.deepEqual(buys.map(({ status }) => status).sort(), [200, 400]);
    assert.equal((await call(app, "state", iris.cookie)).data.wardrobe.balance, 10_000 - 8_500 - 900);
  } finally {
    await app.close();
    await db.close();
  }
});

test("l’import unique de l’ancienne garde-robe locale repaie chaque pièce sans créer de pièces", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  try {
    const iris = await enter(app, "aurore", "iris");
    const items = [
      { key: "x", pieceId: "fashion.premium-velvet", purchasedAt: 10 },
      { key: "y", pieceId: "fashion.unknown-piece", purchasedAt: 11 },
      { key: "z", pieceId: "fashion.cardigan-lilac", purchasedAt: 12 },
    ];
    const imported = await call(app, "shop/import", iris.cookie, { generation: iris.generation, items });
    assert.equal(imported.status, 200);
    assert.equal(imported.data.imported, 1);
    assert.equal(imported.data.skipped, 2, "unknown and retired pieces are ignored");
    assert.equal(imported.data.wardrobe.balance, 9_100);
    const replay = await call(app, "shop/import", iris.cookie, { generation: iris.generation, items });
    assert.equal(replay.data.imported, 0, "the import runs once per character");
    assert.equal(replay.data.wardrobe.balance, 9_100);
    const wear = await call(app, "profile/outfit", iris.cookie, {
      generation: iris.generation, outfit: { top: "fashion.premium-velvet", bottom: null, shoes: null },
    });
    assert.equal(wear.status, 200);
  } finally {
    await app.close();
    await db.close();
  }
});

test("un serveur public ne crée ni n’expose les personnages de démonstration", async () => {
  const db = await openDatabase("memory://");
  // A database seeded earlier by a local run keeps its demo rows.
  await migrate(db);
  const publicOrigin = "https://luma.example";
  const neonAuth = {
    baseUrl: "https://auth.example",
    verify: async (header?: string) => header === "Bearer good" ? { id: "neon-user", expires: Date.now() + 3_600_000 } : null,
  };
  const app = await createApp(db, { publicOrigin, neonAuth });
  const headers = { host: "luma.example", origin: publicOrigin };
  try {
    assert.equal((await call(app, "login", undefined, { account: "aurore" }, headers)).status, 403);
    assert.equal((await call(app, "health", undefined, undefined, { host: "evil.example" })).status, 403);
    const created = await call(app, "neon-session", undefined, { name: "Camille", privacy: true, outfit: starter },
      { ...headers, authorization: "Bearer good" });
    assert.equal(created.status, 200);
    assert.ok(created.cookie);
    assert.equal(created.data.contacts.length, 0, "demo characters are not listed");
    const ranking = await call(app, "ranking", created.cookie, undefined, headers);
    assert.deepEqual(ranking.data.entries.map(({ name }: { name: string }) => name), ["Camille"]);
    assert.equal((await call(app, "profile/social/iris", created.cookie, undefined, headers)).status, 400);
  } finally {
    await app.close();
    await db.close();
  }
  const fresh = await openDatabase("memory://");
  const second = await createApp(fresh, { publicOrigin, neonAuth });
  try {
    assert.equal((await fresh.query("SELECT COUNT(*)::integer AS n FROM characters")).rows[0].n, 0);
  } finally {
    await second.close();
    await fresh.close();
  }
});

test("les migrations sont enregistrées et appliquées une seule fois", async () => {
  const db = await openDatabase("memory://");
  try {
    await migrate(db);
    const { rows } = await db.query("SELECT name FROM schema_migrations ORDER BY name");
    assert.ok(rows.length >= 20);
    assert.equal(rows[0].name, "001_initial.sql");
    await db.query("UPDATE characters SET profile_template='garden' WHERE id='iris'");
    await migrate(db);
    // 010 rewrote 'garden' on every start before; it now runs only once.
    assert.equal((await db.query("SELECT profile_template FROM characters WHERE id='iris'")).rows[0].profile_template, "garden");
  } finally {
    await db.close();
  }
});

test("les erreurs internes sont masquées et les conversations paginées", async () => {
  assert.deepEqual(describeError(new Error("Choisis un personnage.")), { status: 400, message: "Choisis un personnage." });
  assert.equal(describeError(new PlayerError("Connexion expirée.")).status, 401);
  assert.equal(describeError(new TypeError("x is undefined")).status, 500);
  const pgError = Object.assign(new Error('relation "secret" does not exist'), { code: "42P01" });
  assert.deepEqual(describeError(pgError), { status: 500, message: "Erreur du serveur. Réessaie dans un instant." });
  assert.equal(explicitSslMode("postgres://u:p@h/db?sslmode=require&x=1"), "postgres://u:p@h/db?sslmode=verify-full&x=1");

  const db = await openDatabase("memory://");
  const app = await createApp(db);
  try {
    const iris = await enter(app, "aurore", "iris");
    await db.query(
      `INSERT INTO messages (sender,recipient,body,command_id)
       SELECT 'june','iris','m'||n, gen_random_uuid()::text FROM generate_series(1,250) n`);
    const latest = await call(app, "conversation/june", iris.cookie);
    assert.equal(latest.data.messages.length, 200);
    assert.equal(latest.data.hasMore, true);
    assert.equal(latest.data.messages.at(-1).body, "m250");
    const older = await call(app, "conversation/june?before=" + latest.data.messages[0].id, iris.cookie);
    assert.equal(older.data.messages.length, 50);
    assert.equal(older.data.hasMore, false);
    assert.equal(older.data.messages[0].body, "m1");
    assert.equal((await call(app, "conversation/nobody", iris.cookie)).status, 400);
    void randomUUID;
  } finally {
    await app.close();
    await db.close();
  }
});

test("les tests n’ouvrent jamais la base désignée par DATABASE_URL (build Railway)", async () => {
  const previous = process.env.DATABASE_URL;
  // Railway exposes the production DATABASE_URL while `npm run build` runs the tests.
  process.env.DATABASE_URL = "postgres://nobody:secret@127.0.0.1:1/production";
  try {
    const db = await openDatabase("memory://");
    try {
      assert.deepEqual((await db.query("SELECT 1 AS ok")).rows, [{ ok: 1 }]);
    } finally {
      await db.close();
    }
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
