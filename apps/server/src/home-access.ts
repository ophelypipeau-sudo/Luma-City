import type { Query } from "./db.ts";

export async function homeFriends(q: Query, owner: string) {
  const { rows } = await q(`SELECT c.id,c.name FROM characters c JOIN profile_relations r
    ON r.first_id=LEAST($1,c.id) AND r.second_id=GREATEST($1,c.id)
    WHERE r.kind='friend' AND r.accepted AND c.id<>$1
    AND NOT EXISTS (SELECT 1 FROM blocks WHERE (actor=$1 AND target=c.id) OR (actor=c.id AND target=$1))
    ORDER BY c.name,c.id`, [owner]);
  return rows as { id: string; name: string }[];
}
export async function areHomeFriends(q: Query, a: string, b: string) {
  return (await q(`SELECT 1 FROM profile_relations WHERE first_id=LEAST($1,$2) AND second_id=GREATEST($1,$2)
    AND kind='friend' AND accepted AND NOT EXISTS(SELECT 1 FROM blocks WHERE (actor=$1 AND target=$2) OR (actor=$2 AND target=$1))`, [a,b])).rows.length > 0;
}
/** General identity/visibility/block checks are applied by the app before this policy. */
export async function homeAllows(q: Query, actor: string, owner: string) {
  if (actor === owner) return true;
  const { rows: [policy] } = await q(`SELECT COALESCE((SELECT access_mode FROM homes WHERE owner_character_id=$1),'public') AS mode,
    EXISTS(SELECT 1 FROM home_exclusions WHERE owner_id=$1 AND guest_id=$2) AS excluded,
    EXISTS(SELECT 1 FROM home_invitations WHERE owner_id=$1 AND guest_id=$2
      AND state='accepted' AND expires_at>NOW()) AS invited`, [owner, actor]);
  if (policy.excluded) return false;
  if (policy.mode === "public") return true;
  const friend = await areHomeFriends(q, owner, actor);
  return friend && (policy.mode === "friends" || policy.invited);
}
export const invitationFields = `i.id,i.owner_id AS "ownerId",o.name AS "ownerName",i.guest_id AS "guestId",
  g.name AS "guestName",i.state,i.expires_at AS "expiresAt"`;
