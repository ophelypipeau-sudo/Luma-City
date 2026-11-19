import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Database, Query } from "./db.ts";
import { HOME_ACCESS_MODES } from "../../../packages/contracts/src/housing.ts";
import { ensureHome } from "./housing.ts";
import { PlayerError } from "./wardrobe.ts";
import { areHomeFriends, homeFriends, invitationFields } from "./home-access.ts";

const generation = { generation: z.number().int() };
const peerSchema = z.string().regex(/^[a-z0-9_-]{1,64}$/i);
export function registerHomeAccess(app: FastifyInstance, db: Database, deps: {
  active: (token: string, generation: number, q: Query) => Promise<string>;
  serialRequest: <T>(req: FastifyRequest, fn: () => Promise<T>) => Promise<T>;
  serialHome: <T>(owner: string, fn: () => Promise<T>) => Promise<T>;
  allowedPeer: (q: Query, actor: string, peer: string) => Promise<boolean>;
  visiblePeer: (peer: string) => boolean;
  revalidate: (owner: string) => Promise<void>;
  occupants: (owner: string) => string[];
  changed: () => void;
}) {
  async function settings(q: Query, owner: string) {
    await ensureHome(q, owner);
    const { rows: [policy] } = await q(`SELECT access_mode AS mode,access_revision AS revision FROM homes WHERE owner_character_id=$1`, [owner]);
    const { rows: invitations } = await q(`SELECT ${invitationFields} FROM home_invitations i
      JOIN characters o ON o.id=i.owner_id JOIN characters g ON g.id=i.guest_id
      WHERE i.owner_id=$1 AND i.expires_at>NOW() AND i.state IN ('pending','accepted') ORDER BY i.created_at DESC LIMIT 200`, [owner]);
    const { rows: excluded } = await q(`SELECT c.id,c.name FROM home_exclusions e JOIN characters c ON c.id=e.guest_id WHERE e.owner_id=$1 ORDER BY c.name`, [owner]);
    const friends = (await homeFriends(q, owner)).filter((p) => deps.visiblePeer(p.id));
    return { ...policy, invitations, excluded, friends };
  }
  app.post("/api/housing/access", (req) => deps.serialRequest(req, async () => {
    const input = z.object(generation).strict().parse(req.body);
    const owner = await deps.active(req.cookies.session!, input.generation, db.query);
    return deps.serialHome(owner, () => db.transaction((q) => settings(q, owner)));
  }));
  app.post("/api/housing/invitations", (req) => deps.serialRequest(req, () => db.transaction(async (q) => {
    const input = z.object(generation).strict().parse(req.body);
    const actor = await deps.active(req.cookies.session!, input.generation, q);
    const { rows } = await q(`SELECT ${invitationFields} FROM home_invitations i
      JOIN characters o ON o.id=i.owner_id JOIN characters g ON g.id=i.guest_id
      WHERE i.guest_id=$1 AND i.expires_at>NOW() AND i.state IN ('pending','accepted')
      AND NOT EXISTS(SELECT 1 FROM home_exclusions WHERE owner_id=i.owner_id AND guest_id=$1)
      AND EXISTS(SELECT 1 FROM profile_relations WHERE kind='friend' AND accepted
        AND first_id=LEAST($1,i.owner_id) AND second_id=GREATEST($1,i.owner_id))
      AND NOT EXISTS(SELECT 1 FROM blocks WHERE (actor=$1 AND target=i.owner_id) OR (actor=i.owner_id AND target=$1))
      ORDER BY i.created_at DESC LIMIT 200`, [actor]);
    return { invitations: rows.filter((row) => deps.visiblePeer(row.ownerId)) };
  })));

  const actionSchema = z.discriminatedUnion("action", [
    z.object({ ...generation, action: z.literal("mode"), mode: z.enum(HOME_ACCESS_MODES), expectedRevision: z.number().int().nonnegative() }).strict(),
    z.object({ ...generation, action: z.literal("invite"), peer: peerSchema, operationId: z.uuid() }).strict(),
    z.object({ ...generation, action: z.literal("revoke"), invitationId: z.uuid() }).strict(),
    z.object({ ...generation, action: z.literal("kick"), peer: peerSchema }).strict(),
    z.object({ ...generation, action: z.literal("allow"), peer: peerSchema }).strict(),
  ]);
  app.post("/api/housing/access/update", (req) => deps.serialRequest(req, async () => {
    const input = actionSchema.parse(req.body);
    const owner = await deps.active(req.cookies.session!, input.generation, db.query);
    return deps.serialHome(owner, async () => {
      await db.transaction(async (q) => {
        await deps.active(req.cookies.session!, input.generation, q);
        await ensureHome(q, owner);
        if (input.action === "mode") {
          const { rows: [current] } = await q("SELECT access_revision,access_mode FROM homes WHERE owner_character_id=$1 FOR UPDATE", [owner]);
          if (current.access_revision !== input.expectedRevision && current.access_mode !== input.mode)
            throw new PlayerError("Les accès ont changé ailleurs. Actualise avant de réessayer.");
          if (current.access_mode !== input.mode) await q("UPDATE homes SET access_mode=$2,access_revision=access_revision+1 WHERE owner_character_id=$1", [owner, input.mode]);
        } else if (input.action === "invite") {
          if (input.peer === owner || !await deps.allowedPeer(q, owner, input.peer) || !await areHomeFriends(q, owner, input.peer))
            throw new PlayerError("Tu peux inviter uniquement un ami confirmé et non bloqué.");
          if ((await q("SELECT 1 FROM home_exclusions WHERE owner_id=$1 AND guest_id=$2", [owner, input.peer])).rows.length)
            throw new PlayerError("Autorise d’abord le retour de ce visiteur.");
          const { rows: [previous] } = await q("SELECT owner_id,guest_id FROM home_invitations WHERE id=$1", [input.operationId]);
          if (previous) {
            if (previous.owner_id !== owner || previous.guest_id !== input.peer) throw new PlayerError("Cette commande correspond à une autre invitation.");
            return;
          }
          await q("UPDATE home_invitations SET state='revoked' WHERE owner_id=$1 AND guest_id=$2 AND expires_at<=NOW() AND state IN ('pending','accepted')", [owner, input.peer]);
          if ((await q("SELECT 1 FROM home_invitations WHERE owner_id=$1 AND guest_id=$2 AND state IN ('pending','accepted')", [owner, input.peer])).rows.length)
            throw new PlayerError("Une invitation est déjà en cours pour cet ami.");
          await q("INSERT INTO home_invitations (id,owner_id,guest_id,expires_at) VALUES ($1,$2,$3,NOW()+INTERVAL '1 hour')", [input.operationId, owner, input.peer]);
        } else if (input.action === "revoke") {
          const { rows } = await q("UPDATE home_invitations SET state='revoked' WHERE id=$1 AND owner_id=$2 RETURNING id", [input.invitationId, owner]);
          if (!rows.length) throw new PlayerError("Invitation indisponible.");
        } else if (input.action === "kick") {
          if (input.peer === owner || (!deps.occupants(owner).includes(input.peer) &&
            !(await q("SELECT 1 FROM home_exclusions WHERE owner_id=$1 AND guest_id=$2", [owner, input.peer])).rows.length))
            throw new PlayerError("Ce visiteur n’est pas dans ta maison.");
          await q("INSERT INTO home_exclusions (owner_id,guest_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [owner, input.peer]);
          await q("UPDATE home_invitations SET state='revoked' WHERE owner_id=$1 AND guest_id=$2", [owner, input.peer]);
        } else await q("DELETE FROM home_exclusions WHERE owner_id=$1 AND guest_id=$2", [owner, input.peer]);
      });
      await deps.revalidate(owner); deps.changed();
      return db.transaction((q) => settings(q, owner));
    });
  }));
  app.post("/api/housing/invitations/respond", (req) => deps.serialRequest(req, async () => {
    const input = z.object({ ...generation, invitationId: z.uuid(), accept: z.boolean() }).strict().parse(req.body);
    const actor = await deps.active(req.cookies.session!, input.generation, db.query);
    const { rows: [invitation] } = await db.query("SELECT owner_id FROM home_invitations WHERE id=$1 AND guest_id=$2", [input.invitationId, actor]);
    if (!invitation) throw new PlayerError("Invitation indisponible.");
    return deps.serialHome(invitation.owner_id, async () => {
      await db.transaction(async (q) => {
        await deps.active(req.cookies.session!, input.generation, q);
        const { rows: [current] } = await q("SELECT state,expires_at>NOW() AS valid FROM home_invitations WHERE id=$1 AND guest_id=$2 FOR UPDATE", [input.invitationId, actor]);
        if (!current?.valid || !["pending","accepted"].includes(current.state) ||
          !await deps.allowedPeer(q, actor, invitation.owner_id) || !await areHomeFriends(q, actor, invitation.owner_id) ||
          (await q("SELECT 1 FROM home_exclusions WHERE owner_id=$1 AND guest_id=$2", [invitation.owner_id, actor])).rows.length)
          throw new PlayerError("Cette invitation n’est plus valable.");
        await q("UPDATE home_invitations SET state=$2 WHERE id=$1", [input.invitationId, input.accept ? "accepted" : "declined"]);
      });
      await deps.revalidate(invitation.owner_id); deps.changed(); return { ok: true };
    });
  }));
}
