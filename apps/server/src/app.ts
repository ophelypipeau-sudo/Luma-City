import Fastify from "fastify";
import { registerAtelier } from "./atelier-routes.ts";
import { imageUpload } from "./atelier-images.ts";
import type { AtelierProvider } from "./atelier-provider.ts";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";
import staticFiles from "@fastify/static";
import { randomBytes, randomInt, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { retiredGarments } from "../../../packages/contracts/src/retired-garments.ts";
import { isCreatedPlayer, normalizePlayerName, playerNameSchema, starterOutfitSchema } from "../../../packages/contracts/src/player-account.ts";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod";
import type { WebSocket } from "ws";
import type { Database, Query } from "./db.ts";
import { migrate } from "./db.ts";
import type { createNeonPlayerAuth } from "./neon-auth.ts";
import {
  commandSchema,
  PROFILE_MOTTO_MAX,
  PROFILE_IMAGE_MAX_CHARS,
  PROFILE_TEMPLATES,
  PROFILE_RELATIONS,
  PROFILE_RELATION_SLOTS,
  PROFILE_XP,
  levelProgress,
  XP_TEST_ACCOUNT,
  XP_TEST_PROFILES,
  giftItemSchema,
  wornOutfitSchema,
  homeOwner,
  type ProfileSocial,
  type XpMagazine,
  type RewardWheel,
  type ScratchTicket,
  DEFAULT_ROOM,
  roomFloor,
  ROOM_IDS,
  type Presence,
  type RoomId,
  type RoomMessage,
} from "../../../packages/contracts/src/index.ts";
import {
  MESSAGE_MAX,
  ROOM_CAPACITY,
  requireActive,
} from "../../../packages/domain/src/rules.ts";
import {
  ARCADE_COLUMNS, ARCADE_GAMES, ARCADE_MAX_MOVES, ARCADE_TARGET_LEVEL,
  WHEEL_PRIZES, MEMORY_CARDS, arcadeLevel, replayArcade, replayMemory, splitReward, type ArcadeGame,
  MOLE_MISS, MOLE_TARGET, replayMole,
} from "../../../packages/domain/src/arcade.ts";

type Login = { account: string; expires: number };
const derivePassword = promisify(scrypt);
const demoAccounts = new Set(["aurore", "sacha", XP_TEST_ACCOUNT]);
const passwordSchema = z.string().min(8).max(128);
const scratchDay = "(NOW() AT TIME ZONE 'Europe/Paris')::date";
const scratchPrizes = [
  { currency: "coins", amount: 50 },
  { currency: "coins", amount: 100 },
  { currency: "coins", amount: 150 },
  { currency: "coins", amount: 250 },
  { currency: "xp", amount: 10 },
  { currency: "xp", amount: 25 },
  { currency: "diamonds", amount: 1 },
] as const;
type Client = {
  token: string;
  character: string | null;
  generation: number;
  seen: number;
  moved: number;
  lastChat: number;
};
export async function createApp(
  db: Database,
  atelierOptions: {
    root?: string;
    provider?: AtelierProvider;
    recover?: boolean;
    irisOnly?: boolean;
    profileImageVipAccounts?: readonly string[];
    neonAuth?: ReturnType<typeof createNeonPlayerAuth>;
  } = {},
) {
  const irisOnly = atelierOptions.irisOnly === true;
  const neonAuth = atelierOptions.neonAuth;
  const profileImageVipAccounts = new Set(
    atelierOptions.profileImageVipAccounts ??
      (process.env.PROFILE_IMAGE_VIP_ACCOUNTS ?? "").split(",").map((account) => account.trim()).filter(Boolean),
  );
  await migrate(db, irisOnly);
  const app = Fastify({ logger: false, bodyLimit: 8192 });
  await app.register(cookie);
  await app.register(websocket, { options: { maxPayload: 2048 } });
  const logins = new Map<string, Login>();
  const clients = new Map<WebSocket, Client>();
  const presence = new Map<string, Presence & { roomId: RoomId }>();
  const chatHistory = new Map<RoomId, RoomMessage[]>();
  const lastSend = new Map<string, number>();
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const task = queue.then(fn);
    queue = task.catch(() => {});
    return task;
  };
  const send = (ws: WebSocket, event: unknown) => {
    if (ws.readyState === 1) ws.send(JSON.stringify(event));
  };
  const room = () => {
    const players = [...presence.values()];
    const ids = [
      ...new Set<RoomId>([...ROOM_IDS, ...players.map((p) => p.roomId)]),
    ];
    const byRoom = Object.fromEntries(
      ids.map((id) => [id, players.filter((p) => p.roomId === id)]),
    ) as Record<RoomId, typeof players>;
    const counts = Object.fromEntries(ids.map((id) => [id, byRoom[id].length]));
    for (const [ws, client] of clients) {
      const player = client.character && presence.get(client.character);
      if (player)
        send(ws, {
          type: "room",
          roomId: player.roomId,
          players: byRoom[player.roomId],
          counts,
          onlineIds: [...presence.keys()],
        });
    }
  };
  async function publishChat(
    roomIds: readonly RoomId[],
    recipient?: WebSocket,
  ) {
    const { rows } = await db.query("SELECT actor, target FROM blocks");
    const blocked = new Set<string>();
    for (const { actor, target } of rows) {
      blocked.add(JSON.stringify([actor, target]));
      blocked.add(JSON.stringify([target, actor]));
    }
    for (const [ws, client] of clients) {
      if (recipient && ws !== recipient) continue;
      const player = client.character && presence.get(client.character);
      if (!player || !roomIds.includes(player.roomId)) continue;
      const messages = (chatHistory.get(player.roomId) ?? []).filter(
        (message) => !blocked.has(JSON.stringify([player.id, message.sender])),
      );
      send(ws, { type: "room-chat", roomId: player.roomId, messages });
    }
  }
  const changed = () => {
    for (const ws of clients.keys()) send(ws, { type: "refresh" });
  };
  function login(token?: string) {
    const value = token && logins.get(token);
    if (!value || value.expires < Date.now())
      throw new Error("Connexion expirée. Reconnecte-toi.");
    return value;
  }
  async function active(token: string, generation: number, q = db.query) {
    const account = login(token).account;
    const state = (
      await q("SELECT * FROM play_sessions WHERE account_id=$1 FOR UPDATE", [
        account,
      ])
    ).rows[0];
    if (state.owner_token !== token)
      throw new Error("Session remplacée dans un autre onglet.");
    return requireActive(state, generation);
  }
  async function contacts(character: string) {
    return (
      await db.query(
        `SELECT c.*, EXISTS(SELECT 1 FROM blocks b WHERE b.actor=$1 AND b.target=c.id) AS blocked,
      EXISTS(SELECT 1 FROM profile_relations r WHERE r.first_id=LEAST($1,c.id)
       AND r.second_id=GREATEST($1,c.id) AND r.kind='friend' AND r.accepted
       AND NOT EXISTS (SELECT 1 FROM blocks b WHERE
         (b.actor=$1 AND b.target=c.id) OR (b.actor=c.id AND b.target=$1))) AS friend,
      (SELECT COUNT(*)::integer FROM messages m WHERE m.sender=c.id AND m.recipient=$1 AND m.id>
      COALESCE((SELECT last_id FROM read_states WHERE reader=$1 AND peer=c.id),0)) AS unread,
      (SELECT COUNT(*)::integer FROM profile_relations r
       WHERE r.first_id=LEAST($1,c.id) AND r.second_id=GREATEST($1,c.id)
       AND r.requester=c.id AND NOT r.accepted
       AND NOT EXISTS (SELECT 1 FROM blocks b WHERE
         (b.actor=$1 AND b.target=c.id) OR (b.actor=c.id AND b.target=$1))) AS "profileRequests",
      EXISTS(SELECT 1 FROM profile_relations r
       WHERE r.first_id=LEAST($1,c.id) AND r.second_id=GREATEST($1,c.id)
       AND r.kind='friend' AND NOT r.accepted AND r.requester=c.id
       AND NOT EXISTS (SELECT 1 FROM blocks b WHERE
         (b.actor=$1 AND b.target=c.id) OR (b.actor=c.id AND b.target=$1))) AS "friendRequest"
      FROM characters c WHERE c.id<>$1 ORDER BY c.name`,
        [character],
      )
    ).rows;
  }
  const configuredXpMultiplier = Number(process.env.XP_MULTIPLIER ?? 1);
  const xpMultiplier = Number.isSafeInteger(configuredXpMultiplier) && configuredXpMultiplier > 0
    ? configuredXpMultiplier : 1;
  async function xpMagazine(q: Query, id: string): Promise<XpMagazine> {
    const { rows } = await q(
      "SELECT source, COUNT(*)::integer AS count, SUM(points)::integer AS points FROM xp_rewards WHERE recipient=$1 AND claimed_at IS NULL GROUP BY source ORDER BY source",
      [id],
    );
    const { rows: activity } = await q(
      `SELECT activity.source, activity.actor, c.name, COUNT(*)::integer AS count
       FROM (
         SELECT 'like' AS source, actor FROM profile_likes WHERE target=$1
         UNION ALL SELECT 'look-like', actor FROM profile_look_likes WHERE target=$1
         UNION ALL SELECT 'photo', actor FROM profile_photos WHERE target=$1
       ) activity JOIN characters c ON c.id=activity.actor
       WHERE NOT EXISTS (SELECT 1 FROM blocks b WHERE
         (b.actor=$1 AND b.target=c.id) OR (b.actor=c.id AND b.target=$1))
       GROUP BY activity.source, activity.actor, c.name ORDER BY count DESC, c.name, activity.actor`,
      [id],
    );
    return { rewards: rows, activity, multiplier: xpMultiplier };
  }
  async function rewardWheel(q: Query, id: string): Promise<RewardWheel> {
    const { rows: [wheel] } = await q(
      `SELECT c.xp,
       (SELECT COUNT(*) FROM arcade_rounds WHERE character_id=c.id AND completed) -
       (SELECT COUNT(*) FROM reward_wheel_spins WHERE character_id=c.id) AS "gameTickets",
       (COALESCE(SUM(s.amount) FILTER (WHERE s.currency='coins' AND s.collected_at IS NOT NULL),0)
        + COALESCE((SELECT cardinality(home_gifts) * 200 FROM accounts WHERE id=c.account_id),0))::integer AS "accountCoins",
       COALESCE(SUM(s.amount) FILTER (WHERE s.currency='diamonds' AND s.collected_at IS NOT NULL),0)::integer AS "accountDiamonds",
       COALESCE(JSONB_AGG(JSONB_STRIP_NULLS(JSONB_BUILD_OBJECT(
         'id',s.id,'currency',s.currency,'amount',s.amount,'burst',s.burst,'slot',s.slot)))
         FILTER (WHERE s.id IS NOT NULL AND s.character_id=c.id AND s.collected_at IS NULL),'[]'::jsonb) AS pending
       FROM characters c LEFT JOIN characters player ON player.account_id=c.account_id
       LEFT JOIN (
         SELECT id, character_id, currency, amount, collected_at, NULL::uuid AS burst, NULL::integer AS slot
         FROM reward_wheel_spins spin
         WHERE NOT EXISTS (SELECT 1 FROM reward_wheel_drops d WHERE d.spin_id=spin.id)
         UNION ALL
         SELECT d.id, spin.character_id, spin.currency, d.amount, d.collected_at, d.spin_id, d.slot
         FROM reward_wheel_drops d JOIN reward_wheel_spins spin ON spin.id=d.spin_id
         UNION ALL
         SELECT id, character_id, currency, amount, collected_at, NULL::uuid, NULL::integer FROM daily_scratch_tickets
         WHERE collected_at IS NOT NULL AND currency IN ('coins','diamonds')
       ) s ON s.character_id=player.id WHERE c.id=$1 GROUP BY c.id`,
      [id],
    );
    const { xp, gameTickets, ...rewards } = wheel;
    return { ...rewards, tickets: Math.max(0, levelProgress(xp).level - 1 + Number(gameTickets)) };
  }
  async function socialProfile(
    q: Query,
    me: string,
    peer: string,
  ): Promise<ProfileSocial> {
    const {
      rows: [summary],
    } = await q(
      "SELECT COUNT(*)::integer AS likes, COALESCE(BOOL_OR(actor=$1), FALSE) AS liked FROM profile_likes WHERE target=$2",
      [me, peer],
    );
    const { rows: relationships } = await q(
      `SELECT kind, accepted, requester FROM profile_relations
       WHERE first_id=LEAST($1,$2) AND second_id=GREATEST($1,$2)
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE
        (actor=$1 AND target=$2) OR (actor=$2 AND target=$1))`,
      [me, peer],
    );
    const photographed =
      (
        await q("SELECT 1 FROM profile_photos WHERE actor=$1 AND target=$2", [
          me,
          peer,
        ])
      ).rows.length > 0;
    const { rows: [look] } = await q(
      `SELECT md5((c.outfit - 'face')::text) AS "lookKey", COUNT(l.actor)::integer AS "lookLikes",
       COALESCE(BOOL_OR(l.actor=$1), FALSE) AS "lookLiked"
       FROM characters c LEFT JOIN profile_look_likes l
       ON l.target=c.id AND l.look_key=md5((c.outfit - 'face')::text)
       WHERE c.id=$2 GROUP BY c.id`,
      [me, peer],
    );
    const { rows: guestbook } = await q(
      `SELECT e.id::integer, c.name AS author, e.body FROM profile_guestbook e
       JOIN characters c ON c.id=e.actor WHERE e.target=$2
       AND NOT EXISTS (SELECT 1 FROM blocks b WHERE
         (b.actor=$1 AND b.target=e.actor) OR (b.actor=e.actor AND b.target=$1))
       ORDER BY e.id DESC LIMIT 50`,
      [me, peer],
    );
    const featured = irisOnly ? [] : (await q(
      `SELECT c.id, c.name, r.kind
       FROM profile_relations r
       JOIN characters c ON c.id=CASE WHEN r.first_id=$2 THEN r.second_id ELSE r.first_id END
       WHERE $2 IN (r.first_id,r.second_id) AND r.accepted
       AND r.kind IN ('best-friend','romance')
       AND NOT EXISTS (
         SELECT 1 FROM blocks b
         WHERE (b.actor=c.id AND b.target IN ($1,$2))
            OR (b.target=c.id AND b.actor IN ($1,$2))
       )
       ORDER BY c.name, c.id`,
      [me, peer],
    )).rows;
    const bestFriends = featured
      .filter(({ kind }) => kind === "best-friend")
      .slice(0, PROFILE_RELATION_SLOTS["best-friend"])
      .map(({ id, name }) => ({ id, name }));
    const partner = featured.find(({ kind }) => kind === "romance");
    return {
      ...summary,
      ...look,
      relations: Object.fromEntries(
        relationships.map(({ kind, accepted, requester }) => [
          kind,
          accepted ? "accepted" : requester === me ? "outgoing" : "incoming",
        ]),
      ),
      photographed,
      guestbook,
      featuredRelations: {
        bestFriends,
        partner: partner ? { id: partner.id, name: partner.name } : null,
      },
    };
  }
  async function state(token: string) {
    const account = login(token).account;
    const characters = (
      await db.query(
        "SELECT * FROM characters WHERE account_id=$1 ORDER BY slot",
        [account],
      )
    ).rows.filter((character) => !irisOnly || character.id === "iris" || isCreatedPlayer(character.id));
    const play = (
      await db.query("SELECT * FROM play_sessions WHERE account_id=$1", [
        account,
      ])
    ).rows[0];
    const character =
      play.owner_token === token
        ? (characters.find((c) => c.id === play.character_id) ?? null)
        : null;
    return {
      account,
      uiCapabilities: { customProfileImage: profileImageVipAccounts.has(account) },
      characters,
      character,
      generation: play.generation,
      contacts: character && !irisOnly ? await contacts(character.id) : [],
      xpMagazine: character ? await xpMagazine(db.query, character.id) : undefined,
      homeGifts: character
        ? (await db.query("SELECT home_gifts FROM accounts WHERE id=$1", [account])).rows[0].home_gifts
        : null,
      rewardWheel: character ? await rewardWheel(db.query, character.id) : undefined,
      garmentTransfers: character
        ? (
            await db.query(
              "SELECT id, sender, recipient, item FROM profile_garment_transfers WHERE sender=$1 OR recipient=$1",
              [character.id],
            )
          ).rows
        : [],
    };
  }
  function detach(ws: WebSocket) {
    const client = clients.get(ws);
    clients.delete(ws);
    if (
      client?.character &&
      ![...clients.values()].some((c) => c.character === client.character)
    )
      presence.delete(client.character);
  }
  app.addHook("onRequest", async (req, reply) => {
    // P0 has passwordless demo identities: it must stay on the local machine.
    if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.ip))
      return reply.code(403).send({ error: "Prototype local uniquement." });
    const hostname = (req.headers.host ?? "").split(":")[0];
    if (!["localhost", "127.0.0.1"].includes(hostname))
      return reply.code(403).send({ error: "Hôte local requis." });
    const port = process.env.PORT ?? "3001";
    const allowed = new Set([
      process.env.APP_ORIGIN ?? "http://127.0.0.1:5173",
      "http://localhost:5173",
      `http://127.0.0.1:${port}`,
      `http://localhost:${port}`,
    ]);
    if (
      (req.method !== "GET" || req.url.startsWith("/ws")) &&
      (!req.headers.origin || !allowed.has(req.headers.origin))
    ) {
      return reply.code(403).send({ error: "Origine refusée." });
    }
    if (req.url.startsWith("/api")) reply.header("Cache-Control", "no-store");
  });
  app.setErrorHandler((error, _req, reply) => {
    const message =
      error instanceof z.ZodError
        ? "Données invalides."
        : error instanceof Error
          ? error.message
          : "Requête invalide.";
    reply
      .code(message.includes("Connexion") ? 401 : 400)
      .send({ error: message });
  });
  app.get("/api/health", async () => ({ ok: true, mode: "local-demo", multiplayer: !irisOnly,
    authUrl: neonAuth?.baseUrl }));
  await registerAtelier(
    app,
    (req) => login(req.cookies.session).account,
    atelierOptions,
  );
  async function startSession(account: string, req: import("fastify").FastifyRequest,
    reply: import("fastify").FastifyReply, character?: string, expires = Date.now() + 86_400_000) {
      const token = randomBytes(32).toString("hex");
      if (character) {
        await db.query(
          "UPDATE play_sessions SET character_id=$1,generation=generation+1,owner_token=$2 WHERE account_id=$3",
          [character, token, account],
        );
        for (const [ws, client] of clients) {
          if (logins.get(client.token)?.account !== account) continue;
          send(ws, { type: "inactive" });
          detach(ws);
          ws.close(4001, "Nouvelle connexion");
        }
        room();
      }
      const old = req.cookies.session;
      if (old) {
        logins.delete(old);
        for (const [ws, c] of clients)
          if (c.token === old) {
            detach(ws);
            ws.close(4001, "Nouvelle connexion");
          }
        room();
      }
      logins.set(token, { account, expires });
      reply.setCookie("session", token, {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: Math.max(0, Math.floor((expires - Date.now()) / 1000)),
      });
      return state(token);
  }
  async function nameTaken(key: string, q = db.query) {
    if (["iris", "milo", "june", "noa", "nova", "lune"].includes(key)) return true;
    return (await q("SELECT 1 FROM player_credentials WHERE name_key=$1 UNION ALL SELECT 1 FROM neon_player_accounts WHERE name_key=$1 UNION ALL SELECT 1 FROM characters WHERE lower(name)=$1", [key])).rows.length > 0;
  }
  app.get("/api/player-name", async (req) => {
    const { name } = z.object({ name: playerNameSchema }).parse(req.query);
    return { available: !(await nameTaken(normalizePlayerName(name))) };
  });
  app.post("/api/register", async (req, reply) => {
    if (neonAuth) return reply.code(404).send({ error: "Utilise l’inscription par e-mail." });
    const { name, password, outfit } = z.object({
      name: playerNameSchema, password: passwordSchema,
      privacy: z.literal(true), outfit: starterOutfitSchema,
    }).parse(req.body);
    const key = normalizePlayerName(name);
    if (await nameTaken(key)) return reply.code(409).send({ error: "Ce pseudo est déjà pris." });
    const salt = randomBytes(16).toString("hex");
    const hash = (await derivePassword(password, salt, 64)) as Buffer;
    const account = randomUUID();
    const character = "player-" + account;
    const created = await db.transaction(async (q) => {
      await q("INSERT INTO accounts (id,label) VALUES ($1,$2)", [account, name]);
      const claim = await q(
        "INSERT INTO player_credentials (name_key,account_id,password_hash) VALUES ($1,$2,$3) ON CONFLICT (name_key) DO NOTHING RETURNING name_key",
        [key, account, salt + ":" + hash.toString("hex")],
      );
      if (!claim.rows.length) {
        await q("DELETE FROM accounts WHERE id=$1", [account]);
        return false;
      }
      await q("INSERT INTO characters (id,account_id,slot,name,color,hair,outfit,starter_outfit) VALUES ($1,$2,1,$3,'#9367cb','#55354b',$4,$4)",
        [character, account, name, JSON.stringify(outfit)]);
      await q("INSERT INTO play_sessions (account_id) VALUES ($1)", [account]);
      return true;
    });
    if (!created) return reply.code(409).send({ error: "Ce pseudo est déjà pris." });
    return serial(() => startSession(account, req, reply, character));
  });
  app.post("/api/login", async (req, reply) => {
    const input = z.union([
      z.object({ name: playerNameSchema, password: passwordSchema }).strict(),
      z.object({ account: z.string().max(64) }).strict(),
    ]).parse(req.body);
    if ("account" in input) {
      const { account } = input;
      if (!demoAccounts.has(account) || (irisOnly && account !== "aurore") ||
        !(await db.query("SELECT 1 FROM accounts WHERE id=$1", [account])).rows.length)
        throw new Error("Compte de démonstration inconnu.");
      return serial(() => startSession(account, req, reply));
    }
    if (neonAuth) return reply.code(404).send({ error: "Utilise la connexion par e-mail." });
    const { rows: [credential] } = await db.query(
      "SELECT p.account_id,p.password_hash,c.id AS character_id FROM player_credentials p JOIN characters c ON c.account_id=p.account_id AND c.slot=1 WHERE p.name_key=$1",
      [normalizePlayerName(input.name)],
    );
    const [salt, hash] = (credential?.password_hash ?? "00000000000000000000000000000000:" + "0".repeat(128)).split(":");
    const supplied = (await derivePassword(input.password, salt, 64)) as Buffer;
    if (!timingSafeEqual(supplied, Buffer.from(hash, "hex")) || !credential)
      return reply.code(401).send({ error: "Pseudo ou mot de passe incorrect." });
    return serial(() => startSession(credential.account_id, req, reply, credential.character_id));
  });
  if (neonAuth) app.post("/api/neon-session", async (req, reply) => {
    const user = await neonAuth.verify(req.headers.authorization);
    if (!user) return reply.code(401).send({ error: "Connexion Neon expirée ou invalide." });
    const setup = z.object({ name: playerNameSchema, privacy: z.literal(true), outfit: starterOutfitSchema })
      .optional().parse(req.body ?? undefined);
    return serial(async () => {
      const { rows: [existing] } = await db.query(
        "SELECT n.account_id,c.id AS character_id FROM neon_player_accounts n JOIN characters c ON c.account_id=n.account_id AND c.slot=1 WHERE n.auth_user_id=$1", [user.id]);
      if (existing) {
        const token = req.cookies.session;
        const current = logins.get(token ?? "");
        if (token && current && current.account === existing.account_id && current.expires > Date.now()) {
          current.expires = user.expires;
          reply.setCookie("session", token, {
            httpOnly: true, sameSite: "strict", path: "/",
            maxAge: Math.max(0, Math.floor((user.expires - Date.now()) / 1000)),
          });
          return state(token);
        }
        return startSession(existing.account_id, req, reply, existing.character_id, user.expires);
      }
      if (!setup) return reply.code(409).send({ error: "Termine la création de ton personnage." });
      const account = randomUUID();
      const character = "player-" + account;
      const key = normalizePlayerName(setup.name);
      if (await nameTaken(key)) return reply.code(409).send({ error: "Ce pseudo est déjà pris." });
      try {
        await db.transaction(async (q) => {
          await q("INSERT INTO accounts (id,label) VALUES ($1,$2)", [account, setup.name]);
          await q("INSERT INTO neon_player_accounts (auth_user_id,account_id,name_key) VALUES ($1,$2,$3)", [user.id, account, key]);
          await q("INSERT INTO characters (id,account_id,slot,name,color,hair,outfit,starter_outfit) VALUES ($1,$2,1,$3,'#9367cb','#55354b',$4,$4)",
            [character, account, setup.name, JSON.stringify(setup.outfit)]);
          await q("INSERT INTO play_sessions (account_id) VALUES ($1)", [account]);
        });
      } catch (error) {
        if ((error as { code?: string }).code === "23505")
          return reply.code(409).send({ error: "Compte ou pseudo déjà enregistré. Réessaie." });
        throw error;
      }
      return startSession(account, req, reply, character, user.expires);
    });
  });
  app.post("/api/logout", async (req, reply) =>
    serial(async () => {
      const token = req.cookies.session!;
      logins.delete(token);
      for (const [ws, c] of clients)
        if (c.token === token) {
          detach(ws);
          ws.close(4001, "Déconnexion");
        }
      reply.clearCookie("session", { path: "/" });
      room();
      return { ok: true };
    }),
  );
  app.get("/api/state", async (req) =>
    serial(() => state(req.cookies.session!)),
  );
  app.get("/api/profile/social/:peer", async (req) =>
    serial(async () => {
      const { peer } = z.object({ peer: z.string().max(64) }).parse(req.params);
      const current = await state(req.cookies.session!);
      if (!current.character) throw new Error("Choisis un personnage.");
      if (
        peer !== current.character.id &&
        !current.contacts.some((c) => c.id === peer)
      )
        throw new Error("Personnage inconnu.");
      return socialProfile(db.query, current.character.id, peer);
    }),
  );
  app.post("/api/profile/social", async (req) =>
    serial(async () => {
      const { generation, peer, action } = z
        .object({
          generation: z.number().int(),
          peer: z.string().max(64),
          action: z.discriminatedUnion("type", [
            z.object({ type: z.literal("like") }),
            z.object({ type: z.literal("photo") }),
            z.object({ type: z.literal("decline-friend") }),
            z.object({ type: z.literal("look-like"), lookKey: z.string().regex(/^[a-f0-9]{32}$/) }),
            z.object({
              type: z.literal("guestbook"),
              body: z.string().trim().min(1).max(280),
            }),
            z.object({
              type: z.literal("relation"),
              kind: z.enum(PROFILE_RELATIONS),
              accept: z.boolean(),
            }),
            z.object({
              type: z.literal("gift"),
              item: giftItemSchema.refine(({ pieceId }) => !retiredGarments.has(pieceId), "Cet article a été retiré du jeu."),
              id: z.uuid(),
            }),
          ]),
        })
        .parse(req.body);
      const social = await db.transaction(async (q) => {
        const me = await active(req.cookies.session!, generation, q);
        if (irisOnly || me === peer) throw new Error("Choisis un autre personnage.");
        if (
          !(await q("SELECT 1 FROM characters WHERE id=$1", [peer])).rows.length
        )
          throw new Error("Personnage inconnu.");
        if (
          (
            await q(
              `SELECT 1 FROM blocks WHERE
          (actor=$1 AND target=$2) OR (actor=$2 AND target=$1)`,
              [me, peer],
            )
          ).rows.length
        )
          throw new Error("Cette interaction est indisponible.");
        let xpSent = 0;
        if (action.type === "like" || action.type === "photo" || action.type === "look-like") {
          let inserted: boolean;
          if (action.type === "look-like") {
            const { rows } = await q(
              `INSERT INTO profile_look_likes (actor,target,look_key)
               SELECT $1,id,$3 FROM characters WHERE id=$2 AND md5((outfit - 'face')::text)=$3
               ON CONFLICT DO NOTHING RETURNING actor`,
              [me, peer, action.lookKey],
            );
            inserted = rows.length > 0;
          } else {
            const table = action.type === "like" ? "profile_likes" : "profile_photos";
            const { rows } = await q(
              `INSERT INTO ${table} VALUES ($1,$2)
               ON CONFLICT DO NOTHING RETURNING actor`,
              [me, peer],
            );
            inserted = rows.length > 0;
          }
          if (inserted) {
            xpSent = PROFILE_XP[action.type];
            await q("INSERT INTO xp_rewards (recipient,source,points) VALUES ($1,$2,$3)",
              [peer, action.type, xpSent]);
          }
        } else if (action.type === "guestbook") {
          await q(
            "INSERT INTO profile_guestbook (actor,target,body) VALUES ($1,$2,$3)",
            [me, peer, action.body],
          );
        } else if (action.type === "decline-friend") {
          await q(
            `DELETE FROM profile_relations
             WHERE first_id=LEAST($1,$2) AND second_id=GREATEST($1,$2)
             AND kind='friend' AND requester=$2 AND NOT accepted`,
            [me, peer],
          );
        } else if (action.type === "relation") {
          if (action.accept && action.kind !== "friend") {
            // Lock both profiles in the same order before checking available slots.
            await q("SELECT id FROM characters WHERE id IN ($1,$2) ORDER BY id FOR UPDATE", [me, peer]);
            const { rows: [pending] } = await q(
              `SELECT
                (SELECT COUNT(*) FROM profile_relations WHERE kind=$3 AND accepted AND $1 IN (first_id,second_id)) AS mine,
                (SELECT COUNT(*) FROM profile_relations WHERE kind=$3 AND accepted AND $2 IN (first_id,second_id)) AS theirs
               FROM profile_relations WHERE first_id=LEAST($1,$2) AND second_id=GREATEST($1,$2)
               AND kind=$3 AND requester=$2 AND NOT accepted`,
              [me, peer, action.kind],
            );
            const limit = PROFILE_RELATION_SLOTS[action.kind];
            if (pending && (Number(pending.mine) >= limit || Number(pending.theirs) >= limit))
              throw new Error(action.kind === "romance"
                ? "L’un des deux personnages est déjà en couple."
                : "L’un des deux personnages a déjà trois meilleurs amis.");
          }
          await q(
            action.accept
              ? `UPDATE profile_relations SET accepted=TRUE
               WHERE first_id=LEAST($1,$2) AND second_id=GREATEST($1,$2)
               AND kind=$3 AND requester=$2`
              : `INSERT INTO profile_relations (first_id, second_id, kind, requester)
               VALUES (LEAST($1,$2), GREATEST($1,$2), $3, $1) ON CONFLICT DO NOTHING`,
            [me, peer, action.kind],
          );
        } else {
          const { item } = action;
          const { rows } = await q(
            `INSERT INTO profile_garment_transfers
            (id,sender,recipient,item_key,purchased_at,item)
            VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id`,
            [
              action.id,
              me,
              peer,
              item.key,
              item.purchasedAt,
              JSON.stringify(item),
            ],
          );
          if (
            !rows.length &&
            !(
              await q(
                `SELECT 1 FROM profile_garment_transfers
            WHERE id=$1 AND sender=$2 AND recipient=$3 AND item_key=$4 AND purchased_at=$5`,
                [action.id, me, peer, item.key, item.purchasedAt],
              )
            ).rows.length
          )
            throw new Error("Cet article a déjà été offert.");
        }
        return { ...(await socialProfile(q, me, peer)), xpSent };
      });
      changed();
      return social;
    }),
  );
  app.post("/api/home-gifts", async (req) => serial(async () => {
    const { generation, gift } = z.object({
      generation: z.number().int(),
      gift: z.number().int().min(1).max(5).optional(),
    }).parse(req.body);
    const token = req.cookies.session!;
    const account = login(token).account;
    await db.transaction(async (q) => {
      const character = await active(token, generation, q);
      if (gift === undefined) {
        await q("UPDATE accounts SET home_gifts=ARRAY[]::smallint[] WHERE id=$1 AND home_gifts IS NULL", [account]);
        return;
      }
      const { rows } = await q(
        `UPDATE accounts SET home_gifts=array_append(home_gifts,$2::smallint)
         WHERE id=$1 AND home_gifts IS NOT NULL AND NOT ($2::smallint=ANY(home_gifts))
         RETURNING id`,
        [account, gift],
      );
      if (rows.length) await q("UPDATE characters SET xp=xp+5000 WHERE id=$1", [character]);
    });
    changed();
    return state(token);
  }));
  app.post("/api/xp/claim", async (req) =>
    serial(async () => {
      const { generation, pickup, source } = z.object({
        generation: z.number().int(),
        pickup: z.object({ id: z.uuid(), points: z.number().int().positive() }).optional(),
        source: z.enum(["photo", "like", "look-like"]).optional(),
      }).parse(req.body);
      const result = await db.transaction(async (q) => {
        const id = await active(req.cookies.session!, generation, q);
        let claimed = 0;
        if (pickup) {
          const { rows: [firstClaim] } = await q(
            `INSERT INTO xp_pickup_claims (id,recipient) VALUES ($1,$2)
             ON CONFLICT DO NOTHING RETURNING id`, [pickup.id, id],
          );
          if (firstClaim) {
            const { rows } = await q(
              `WITH portions AS (
                 SELECT id, LEAST(points, GREATEST(0, $2::bigint + points -
                   SUM(points) OVER (ORDER BY id ROWS UNBOUNDED PRECEDING))) AS taken
                 FROM xp_rewards WHERE recipient=$1 AND claimed_at IS NULL
               )
               UPDATE xp_rewards r
               SET claimed_at=CASE WHEN r.points=p.taken THEN NOW() ELSE NULL END,
                   points=CASE WHEN r.points=p.taken THEN r.points ELSE r.points-p.taken END
               FROM portions p WHERE r.id=p.id AND p.taken>0 RETURNING p.taken AS points`,
              [id, pickup.points],
            );
            claimed = rows.reduce((total, entry) => total + Number(entry.points), 0) * xpMultiplier;
          }
        } else {
          const { rows } = await q(
            `UPDATE xp_rewards SET claimed_at=NOW()
             WHERE recipient=$1 AND claimed_at IS NULL AND ($2::text IS NULL OR source=$2)
             RETURNING points`, [id, source ?? null],
          );
          claimed = rows.reduce((total, entry) => total + Number(entry.points), 0) * xpMultiplier;
        }
        if (claimed) await q("UPDATE characters SET xp=xp+$2 WHERE id=$1", [id, claimed]);
        const { rows: [player] } = await q("SELECT xp FROM characters WHERE id=$1", [id]);
        return { id, claimed, xp: Number(player.xp), magazine: await xpMagazine(q, id), wheel: await rewardWheel(q, id) };
      });
      if (result.claimed) {
        const player = presence.get(result.id);
        if (player) player.xp = result.xp;
        room();
        changed();
      }
      return { claimed: result.claimed, xp: result.xp, magazine: result.magazine, wheel: result.wheel };
    }),
  );
  app.get("/api/ranking", async (req) => {
    const current = await state(req.cookies.session!);
    if (!current.character) throw new Error("Choisis un personnage.");
    const { rows } = await db.query(
      `SELECT c.id,c.name,c.outfit,c.xp,
       (SELECT COUNT(*)::integer FROM profile_likes WHERE target=c.id) AS "profileLikes",
       COALESCE((SELECT MAX(score) FROM arcade_rounds WHERE character_id=c.id AND completed),0) AS "bestScore",
       EXISTS(SELECT 1 FROM profile_relations r WHERE r.kind='friend' AND r.accepted
         AND r.first_id=LEAST($3,c.id) AND r.second_id=GREATEST($3,c.id)) AS friend
       FROM characters c WHERE ($1::boolean = FALSE OR c.id='iris') AND c.account_id<>$2
       AND NOT EXISTS (SELECT 1 FROM blocks b WHERE
         (b.actor=$3 AND b.target=c.id) OR (b.actor=c.id AND b.target=$3))
       ORDER BY c.xp DESC, c.name, c.id`,
      [irisOnly, XP_TEST_ACCOUNT, current.character.id],
    );
    return { entries: rows };
  });
  app.post("/api/arcade/start", async (req) =>
    serial(() => db.transaction(async (q) => {
      const { generation, game } = z.object({
        generation: z.number().int(), game: z.enum(ARCADE_GAMES),
      }).parse(req.body);
      const player = await active(req.cookies.session!, generation, q);
      await q("DELETE FROM arcade_rounds WHERE character_id=$1 AND game=$2 AND NOT completed", [player, game]);
      const id = randomUUID(), seed = randomInt(2 ** 32);
      await q("INSERT INTO arcade_rounds (id,character_id,game,seed) VALUES ($1,$2,$3,$4)", [id, player, game, seed]);
      return { id, seed };
    })),
  );
  app.post("/api/arcade/finish", async (req) =>
    serial(() => db.transaction(async (q) => {
      const { generation, id, moves } = z.object({
        generation: z.number().int(), id: z.uuid(),
        moves: z.array(z.number().int().min(0).max(MOLE_MISS)).max(ARCADE_MAX_MOVES),
      }).parse(req.body);
      const player = await active(req.cookies.session!, generation, q);
      const { rows: [round] } = await q(
        "SELECT game,seed,completed FROM arcade_rounds WHERE id=$1 AND character_id=$2 FOR UPDATE", [id, player],
      );
      if (!round) throw new Error("Partie introuvable.");
      if (!round.completed) {
        const game = round.game as ArcadeGame;
        const maxMove = game === "mole" ? MOLE_MISS
          : game === "memory" ? MEMORY_CARDS - 1 : game === "prism" ? ARCADE_COLUMNS : ARCADE_COLUMNS - 1;
        if (moves.some((move) => move > maxMove))
          throw new Error("Coup invalide.");
        const seed = Number(round.seed);
        const score = game === "mole" ? replayMole(seed, moves).hits
          : (game === "memory" ? replayMemory(seed, moves) : replayArcade(game, seed, moves)).score;
        if (game === "mole") {
          if (score < MOLE_TARGET) throw new Error("Touche 10 taupes pour gagner un tour.");
        } else if (arcadeLevel(score) < ARCADE_TARGET_LEVEL) {
          throw new Error("Atteins le niveau 5 pour gagner un tour.");
        }
        await q("UPDATE arcade_rounds SET completed=TRUE,score=$2 WHERE id=$1", [id, score]);
      }
      return { wheel: await rewardWheel(q, player) };
    })),
  );
  async function todayScratch(q: Query, account: string): Promise<ScratchTicket | null> {
    const { rows: [ticket] } = await q(
      `SELECT id,currency,amount,collected_at IS NOT NULL AS claimed
       FROM daily_scratch_tickets WHERE account_id=$1 AND play_day=${scratchDay}`,
      [account],
    );
    return ticket ?? null;
  }
  app.get("/api/arcade/scratch", async (req) => {
    const token = req.cookies.session!;
    return { ticket: await todayScratch(db.query, login(token).account) };
  });
  app.post("/api/arcade/scratch", async (req) =>
    serial(() => db.transaction(async (q) => {
      const token = req.cookies.session!;
      const { generation } = z.object({ generation: z.number().int() }).parse(req.body);
      const player = await active(token, generation, q);
      const { account } = login(token);
      const prize = scratchPrizes[randomInt(scratchPrizes.length)];
      await q(
        `INSERT INTO daily_scratch_tickets (id,account_id,character_id,play_day,currency,amount)
         VALUES ($1,$2,$3,${scratchDay},$4,$5) ON CONFLICT (account_id,play_day) DO NOTHING`,
        [randomUUID(), account, player, prize.currency, prize.amount],
      );
      return { ticket: await todayScratch(q, account) };
    })),
  );
  app.post("/api/arcade/scratch/claim", async (req) => {
    const result = await serial(() => db.transaction(async (q) => {
      const token = req.cookies.session!;
      const { generation, id } = z.object({ generation: z.number().int(), id: z.uuid() }).parse(req.body);
      const player = await active(token, generation, q);
      const { account } = login(token);
      const { rows: [ticket] } = await q(
        "SELECT currency,amount,collected_at FROM daily_scratch_tickets WHERE id=$1 AND account_id=$2 FOR UPDATE",
        [id, account],
      );
      if (!ticket) throw new Error("Ticket introuvable.");
      if (!ticket.collected_at) {
        await q("UPDATE daily_scratch_tickets SET collected_at=NOW() WHERE id=$1", [id]);
        if (ticket.currency === "xp")
          await q("UPDATE characters SET xp=xp+$1 WHERE id=$2", [ticket.amount, player]);
      }
      const { rows: [character] } = await q("SELECT xp FROM characters WHERE id=$1", [player]);
      return { xp: Number(character.xp), wheel: await rewardWheel(q, player) };
    }));
    changed();
    return result;
  });
  app.post("/api/wheel/spin", async (req) =>
    serial(() => db.transaction(async (q) => {
      const { generation, id } = z.object({ generation: z.number().int(), id: z.uuid() }).parse(req.body);
      const player = await active(req.cookies.session!, generation, q);
      const { rows: [previous] } = await q(
        "SELECT currency, amount FROM reward_wheel_spins WHERE id=$1 AND character_id=$2", [id, player],
      );
      if (previous) {
        const index = WHEEL_PRIZES.findIndex(({ currency, amount }) =>
          currency === previous.currency && amount === previous.amount);
        return { index, prize: previous, wheel: await rewardWheel(q, player) };
      }
      if (!(await rewardWheel(q, player)).tickets) throw new Error("Tu n’as pas de tour disponible.");
      const index = randomInt(WHEEL_PRIZES.length), prize = WHEEL_PRIZES[index];
      await q(
        "INSERT INTO reward_wheel_spins (id,character_id,prize_index,currency,amount) VALUES ($1,$2,$3,$4,$5)",
        [id, player, index, prize.currency, prize.amount],
      );
      const amounts = splitReward(prize.amount);
      await q(
        `INSERT INTO reward_wheel_drops (id,spin_id,slot,amount)
         SELECT drop_id, $1, (position - 1)::integer, amount
         FROM unnest($2::uuid[], $3::integer[]) WITH ORDINALITY AS drops(drop_id, amount, position)`,
        [id, amounts.map(() => randomUUID()), amounts],
      );
      return { index, prize, wheel: await rewardWheel(q, player) };
    })),
  );
  app.post("/api/wheel/collect", async (req) =>
    serial(async () => {
      const result = await db.transaction(async (q) => {
        const { generation, id, ids } = z.object({
          generation: z.number().int(), id: z.uuid(), ids: z.array(z.uuid()).max(19).optional(),
        }).parse(req.body);
        const player = await active(req.cookies.session!, generation, q);
        await q(
          `UPDATE reward_wheel_spins spin SET collected_at=NOW()
           WHERE spin.id=$1 AND character_id=$2 AND collected_at IS NULL
             AND NOT EXISTS (SELECT 1 FROM reward_wheel_drops d WHERE d.spin_id=spin.id)`,
          [id, player],
        );
        const { rows: drops } = await q(
          `UPDATE reward_wheel_drops d SET collected_at=NOW() FROM reward_wheel_spins spin
           WHERE d.id=ANY($1::uuid[]) AND d.spin_id=spin.id AND spin.character_id=$2 AND d.collected_at IS NULL
           RETURNING spin.currency, d.amount`,
          [[id, ...(ids ?? [])], player],
        );
        const gained = drops.reduce((total, drop) => total + (drop.currency === "xp" ? Number(drop.amount) : 0), 0);
        if (gained) await q("UPDATE characters SET xp=xp+$2 WHERE id=$1", [player, gained]);
        const { rows: [character] } = await q("SELECT xp FROM characters WHERE id=$1", [player]);
        return { player, gained, xp: Number(character.xp), wheel: await rewardWheel(q, player) };
      });
      if (result.gained) {
        const present = presence.get(result.player);
        if (present) present.xp = result.xp;
        room();
        changed();
      }
      return { xp: result.xp, wheel: result.wheel };
    }),
  );
  app.post("/api/profile/xp-test", async (req) =>
    serial(async () => {
      const token = req.cookies.session!;
      const { generation, start } = z
        .object({
          generation: z.number().int(),
          start: z.enum(["start", "near-level"]),
        })
        .parse(req.body);
      if (login(token).account !== XP_TEST_ACCOUNT)
        throw new Error("Ce réglage est réservé au compte Test XP.");
      const xp =
        start === "near-level" ? PROFILE_XP.firstLevel - PROFILE_XP.photo : 0;
      const actor = await db.transaction(async (q) => {
        const id = await active(token, generation, q);
        const peer = XP_TEST_PROFILES.find((profile) => profile !== id);
        await q("DELETE FROM profile_photos WHERE actor=$1 AND target=$2", [
          id,
          peer,
        ]);
        await q("DELETE FROM profile_likes WHERE actor=$1 AND target=$2", [
          id,
          peer,
        ]);
        await q("UPDATE characters SET xp=$2 WHERE id=$1", [id, xp]);
        return id;
      });
      const online = presence.get(actor);
      if (online) {
        online.xp = xp;
        room();
      }
      changed();
      return { xp };
    }),
  );
  app.get("/api/profile/image/:id/:version", async (req, reply) => {
    login(req.cookies.session);
    const { id, version } = z.object({
      id: z.string().max(64), version: z.uuid(),
    }).parse(req.params);
    const { rows: [image] } = await db.query(
      `SELECT p.image,p.mime FROM profile_images p JOIN characters c ON c.id=p.character_id
       WHERE c.id=$1 AND c.profile_image_version=$2 AND c.profile_template='image'`, [id, version],
    );
    if (!image) return reply.code(404).send({ error: "Image de profil introuvable." });
    return reply.header("X-Content-Type-Options", "nosniff").type(image.mime).send(Buffer.from(image.image));
  });
  app.post("/api/profile/motto", { bodyLimit: PROFILE_IMAGE_MAX_CHARS + 4096 }, async (req) =>
    serial(async () => {
      const token = req.cookies.session!;
      const { generation, motto, template, profileImage } = z
        .object({
          generation: z.number().int(),
          motto: z.string().trim().max(PROFILE_MOTTO_MAX),
          template: z.enum([...PROFILE_TEMPLATES, "garden"]).optional()
            .transform((value) => value === "garden" ? "solid" : value),
          profileImage: z.string().max(PROFILE_IMAGE_MAX_CHARS).optional(),
        })
        .parse(req.body);
      const id = await db.transaction(async (q) => {
        const id = await active(token, generation, q);
        let version: string | null = null;
        if (profileImage || template === "image") {
          if (!profileImageVipAccounts.has(login(token).account))
            throw new Error("L’image de profil est réservée aux VIP.");
          if (profileImage) {
            if (template !== "image") throw new Error("Sélectionne le fond image.");
            const { bytes, mime } = imageUpload(profileImage);
            version = randomUUID();
            await q(
              `INSERT INTO profile_images (character_id,image,mime) VALUES ($1,$2,$3)
               ON CONFLICT (character_id) DO UPDATE SET image=EXCLUDED.image,mime=EXCLUDED.mime`,
              [id, bytes, mime],
            );
          } else if (!(await q("SELECT 1 FROM profile_images WHERE character_id=$1", [id])).rows.length) {
            throw new Error("Choisis une image de profil.");
          }
        }
        await q(
          `UPDATE characters SET motto=$1,profile_template=COALESCE($3,profile_template),
           profile_image_version=COALESCE($4,profile_image_version) WHERE id=$2`,
          [motto, id, template ?? null, version],
        );
        return { id, version };
      });
      const player = presence.get(id.id);
      if (player) {
        player.motto = motto;
        if (template) player.profile_template = template;
        if (id.version) player.profile_image_version = id.version;
        room();
      }
      changed();
      return { motto, profile_template: template, profile_image_version: id.version ?? undefined };
    }),
  );
  app.post("/api/profile/outfit", async (req) =>
    serial(async () => {
      const { generation, outfit } = z.object({
        generation: z.number().int(),
        outfit: wornOutfitSchema,
      }).parse(req.body);
      const saved = await db.transaction(async (q) => {
        const id = await active(req.cookies.session!, generation, q);
        const { rows } = await q(
          "UPDATE characters SET outfit=$1::jsonb WHERE id=$2 AND outfit IS DISTINCT FROM $1::jsonb RETURNING id",
          [JSON.stringify(outfit), id],
        );
        return rows.length ? id : null;
      });
      if (saved) {
        const player = presence.get(saved);
        if (player) {
          player.outfit = outfit;
          room();
        }
        changed();
      }
      return { outfit };
    }),
  );
  app.post("/api/activate", async (req) =>
    serial(async () => {
      const token = req.cookies.session!;
      const account = login(token).account;
      const { character } = z
        .object({ character: z.string().max(64) })
        .parse(req.body);
      if (irisOnly && character !== "iris")
        throw new Error("Seule Iris est disponible.");
      await db.transaction(async (q) => {
        await q("SELECT * FROM play_sessions WHERE account_id=$1 FOR UPDATE", [
          account,
        ]);
        const owned = (
          await q("SELECT id FROM characters WHERE id=$1 AND account_id=$2", [
            character,
            account,
          ])
        ).rows[0];
        if (!owned) throw new Error("Ce personnage ne t’appartient pas.");
        await q(
          "UPDATE play_sessions SET character_id=$1,generation=generation+1,owner_token=$2 WHERE account_id=$3",
          [character, token, account],
        );
      });
      for (const [ws, c] of clients) {
        if (logins.get(c.token)?.account === account) {
          send(ws, { type: "inactive" });
          detach(ws);
          ws.close(4001, "Personnage remplacé");
        }
      }
      room();
      return state(token);
    }),
  );
  app.get("/api/conversation/:peer", async (req) =>
    serial(async () => {
      const { peer } = req.params as { peer: string };
      const s = await state(req.cookies.session!);
      if (!s.character) throw new Error("Choisis un personnage.");
      if (!s.contacts.some((c) => c.id === peer))
        throw new Error("Destinataire inconnu.");
      // P0 loads the full conversation; pagination is required before public use.
      return {
        messages: (
          await db.query(
            `SELECT id::integer,sender,recipient,body,created_at FROM messages
      WHERE (sender=$1 AND recipient=$2) OR (sender=$2 AND recipient=$1) ORDER BY id`,
            [s.character.id, peer],
          )
        ).rows,
      };
    }),
  );
  app.post("/api/message", async (req) =>
    serial(async () => {
      const body = z
        .object({
          generation: z.number().int(),
          peer: z.string().max(64),
          body: z.string().trim().min(1).max(MESSAGE_MAX),
          commandId: z.string().uuid(),
        })
        .parse(req.body);
      const token = req.cookies.session!;
      const result = await db.transaction(async (q) => {
        const from = await active(token, body.generation, q);
        if (
          irisOnly ||
          from === body.peer ||
          !(await q("SELECT id FROM characters WHERE id=$1", [body.peer])).rows
            .length
        )
          throw new Error("Destinataire invalide.");
        const existing = (
          await q("SELECT * FROM messages WHERE sender=$1 AND command_id=$2", [
            from,
            body.commandId,
          ])
        ).rows[0];
        if (existing) {
          if (existing.recipient !== body.peer || existing.body !== body.body)
            throw new Error("Identifiant de message déjà utilisé.");
          return { ok: true };
        }
        if (
          (
            await q(
              "SELECT 1 FROM blocks WHERE (actor=$1 AND target=$2) OR (actor=$2 AND target=$1)",
              [from, body.peer],
            )
          ).rows.length
        )
          throw new Error("Cette conversation est bloquée.");
        if (Date.now() - (lastSend.get(from) ?? 0) < 600)
          throw new Error("Attends un instant avant de renvoyer un message.");
        await q(
          "INSERT INTO messages(sender,recipient,body,command_id) VALUES ($1,$2,$3,$4)",
          [from, body.peer, body.body, body.commandId],
        );
        lastSend.set(from, Date.now());
        return { ok: true };
      });
      changed();
      return result;
    }),
  );
  app.post("/api/read", async (req) =>
    serial(async () => {
      const b = z
        .object({
          generation: z.number().int(),
          peer: z.string(),
          lastId: z.number().int().positive(),
        })
        .parse(req.body);
      await db.transaction(async (q) => {
        const me = await active(req.cookies.session!, b.generation, q);
        if (
          irisOnly ||
          !(
            await q(
              "SELECT 1 FROM messages WHERE id=$1 AND sender=$2 AND recipient=$3",
              [b.lastId, b.peer, me],
            )
          ).rows.length
        )
          throw new Error("Message non accessible.");
        await q(
          `INSERT INTO read_states(reader,peer,last_id) VALUES ($1,$2,$3)
        ON CONFLICT(reader,peer) DO UPDATE SET last_id=GREATEST(read_states.last_id,EXCLUDED.last_id)`,
          [me, b.peer, b.lastId],
        );
      });
      changed();
      return { ok: true };
    }),
  );
  app.post("/api/block", async (req) =>
    serial(async () => {
      const b = z
        .object({
          generation: z.number().int(),
          peer: z.string(),
          blocked: z.boolean(),
        })
        .parse(req.body);
      await db.transaction(async (q) => {
        const me = await active(req.cookies.session!, b.generation, q);
        if (irisOnly || me === b.peer)
          throw new Error("Action impossible sur ton personnage.");
        if (b.blocked)
          await q("INSERT INTO blocks VALUES ($1,$2) ON CONFLICT DO NOTHING", [
            me,
            b.peer,
          ]);
        else
          await q("DELETE FROM blocks WHERE actor=$1 AND target=$2", [
            me,
            b.peer,
          ]);
      });
      await publishChat([
        ...new Set([
          ...ROOM_IDS,
          ...[...presence.values()].map((p) => p.roomId),
        ]),
      ]);
      changed();
      return { ok: true };
    }),
  );
  app.post("/api/report", async (req) =>
    serial(async () => {
      const b = z
        .object({
          generation: z.number().int(),
          peer: z.string(),
          reason: z.string().trim().min(3).max(500),
        })
        .parse(req.body);
      await db.transaction(async (q) => {
        const me = await active(req.cookies.session!, b.generation, q);
        if (irisOnly || me === b.peer)
          throw new Error("Action impossible sur ton personnage.");
        const recent = (
          await q(
            "SELECT 1 FROM reports WHERE actor=$1 AND created_at>NOW()-INTERVAL '30 seconds'",
            [me],
          )
        ).rows.length;
        if (recent)
          throw new Error(
            "Un signalement vient d’être envoyé. Patiente avant de recommencer.",
          );
        await q("INSERT INTO reports(actor,target,reason) VALUES ($1,$2,$3)", [
          me,
          b.peer,
          b.reason,
        ]);
      });
      return { ok: true };
    }),
  );
  app.get("/ws", { websocket: true }, (ws, req) => {
    const token = req.cookies.session!;
    const client: Client = {
      token,
      character: null,
      generation: 0,
      seen: Date.now(),
      moved: 0,
      lastChat: 0,
    };
    clients.set(ws, client);
    ws.on("pong", () => {
      client.seen = Date.now();
    });
    ws.on("message", (raw) => {
      void serial(async () => {
        if (!clients.has(ws)) return;
        let chatCommandId: string | undefined;
        try {
          const cmd = commandSchema.parse(JSON.parse(raw.toString()));
          if (cmd.type === "room-chat") chatCommandId = cmd.commandId;
          login(token);
          client.seen = Date.now();
          if (cmd.type === "ping") {
            send(ws, { type: "pong" });
            return;
          }
          const id = await active(token, cmd.generation);
          const p = presence.get(id);
          if (id !== client.character || !p)
            throw new Error("Rejoins la salle avant de te déplacer.");
          if (cmd.type === "room-chat") {
            if (cmd.roomId !== p.roomId)
              throw new Error("Tu as changé de salle.");
            if (Date.now() - client.lastChat < 600)
              throw new Error(
                "Attends un instant avant de renvoyer un message.",
              );
            client.lastChat = Date.now();
            const message = {
              id: randomUUID(),
              sender: p.id,
              name: p.name,
              body: cmd.body,
            };
            chatHistory.set(
              p.roomId,
              [...(chatHistory.get(p.roomId) ?? []), message].slice(-40),
            );
            await publishChat([p.roomId]);
            send(ws, { type: "room-chat-ack", commandId: cmd.commandId });
            return;
          }
          if (cmd.type === "join-room") {
            if (cmd.roomId !== p.roomId) {
              const owner = homeOwner(cmd.roomId);
              if (
                owner &&
                ((irisOnly && owner !== "iris") || !(
                  await db.query("SELECT 1 FROM characters WHERE id=$1", [
                    owner,
                  ])
                ).rows.length ||
                  (
                    await db.query(
                      `SELECT 1 FROM blocks WHERE
                  (actor=$1 AND target=$2) OR (actor=$2 AND target=$1)`,
                      [id, owner],
                    )
                  ).rows.length)
              ) {
                send(ws, { type: "room-unavailable", roomId: cmd.roomId });
                return;
              }
              const count = [...presence.values()].filter(
                (other) => other.roomId === cmd.roomId,
              ).length;
              if (count >= ROOM_CAPACITY) {
                send(ws, { type: "room-full", roomId: cmd.roomId });
                return;
              }
              p.roomId = cmd.roomId;
              p.x = 40 + Math.random() * 20;
              p.y = roomFloor(cmd.roomId) + 4 + Math.random() * 5;
            }
            room();
            await publishChat([p.roomId], ws);
            return;
          }
          if (Date.now() - client.moved < 45) return;
          client.moved = Date.now();
          p.x = cmd.x;
          p.y = Math.max(roomFloor(p.roomId), cmd.y);
          room();
        } catch (e) {
          if (chatCommandId) {
            send(ws, {
              type: "room-chat-ack",
              commandId: chatCommandId,
              error: e instanceof Error ? e.message : "Message indisponible.",
            });
            return;
          }
          send(ws, {
            type: "error",
            message: e instanceof Error ? e.message : "Commande invalide.",
          });
        }
      });
    });
    ws.on("close", () => {
      void serial(async () => {
        detach(ws);
        room();
      });
    });
    void serial(async () => {
      if (ws.readyState !== 1) {
        detach(ws);
        return;
      }
      try {
        const s = await state(token);
        if (!s.character) throw new Error("Choisis un personnage.");
        for (const [old, c] of clients)
          if (old !== ws && c.token === token) {
            detach(old);
            old.close(4001, "Connexion remplacée");
          }
        const initialRoom = [...presence.values()].filter(
          (p) => p.roomId === DEFAULT_ROOM,
        );
        if (initialRoom.length >= ROOM_CAPACITY)
          throw new Error("La salle est complète (15 personnes).");
        client.character = s.character.id;
        client.generation = s.generation;
        presence.set(s.character.id, {
          ...s.character,
          roomId: DEFAULT_ROOM,
          x: 40 + Math.random() * 20,
          y: roomFloor(DEFAULT_ROOM) + 4 + Math.random() * 5,
        });
        send(ws, { type: "welcome", ...s });
        room();
        await publishChat([DEFAULT_ROOM], ws);
      } catch (e) {
        send(ws, {
          type: "error",
          message: e instanceof Error ? e.message : "Connexion impossible.",
          requiresLogin:
            !logins.has(token) || logins.get(token)!.expires < Date.now(),
        });
        detach(ws);
        ws.close(4000);
      }
    });
  });
  const timer = setInterval(() => {
    void serial(async () => {
      for (const [ws, c] of clients) {
        if (
          c.seen < Date.now() - 30000 ||
          !logins.has(c.token) ||
          logins.get(c.token)!.expires < Date.now()
        ) {
          detach(ws);
          ws.terminate();
          room();
        } else ws.ping();
      }
      for (const [token, s] of logins)
        if (s.expires < Date.now()) logins.delete(token);
    });
  }, 10000);
  timer.unref();
  const dist = resolve("dist");
  if (existsSync(dist)) {
    await app.register(staticFiles, { root: dist });
    app.setNotFoundHandler((_req, reply) =>
      reply.code(404).send({ error: "Page introuvable." }),
    );
  }
  app.addHook("onClose", async () => {
    clearInterval(timer);
    for (const ws of clients.keys()) ws.terminate();
    await queue;
  });
  return app;
}
