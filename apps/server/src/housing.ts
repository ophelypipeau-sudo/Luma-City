import { randomUUID } from "node:crypto";
import type { Query } from "./db.ts";
import type { HomeSnapshot, OwnedFurniture } from "../../../packages/contracts/src/housing.ts";
import { saveHomeSchema } from "../../../packages/contracts/src/housing.ts";
import { FURNITURE_MODELS, STARTER_POSITIONS, validateDecoration } from "../../../packages/domain/src/housing.ts";
import { PlayerError } from "./wardrobe.ts";
import { ROOM_CAPACITY } from "../../../packages/domain/src/rules.ts";
import { createHomeNavigationMesh, nearestHomePoint } from "../../../packages/domain/src/home-navigation.ts";
import { ownedHomeFinishes } from "./home-finish-commerce";
import { ownsHomeFinish } from "../../../packages/domain/src/home-finishes";

/** The caller owns a DB transaction and has already authorized the character. */
export async function ensureHome(q: Query, owner: string) {
  await q("INSERT INTO homes (id,owner_character_id,name) VALUES ($1,$2,$3) ON CONFLICT (owner_character_id) DO NOTHING",
    [randomUUID(), owner, "Mon salon"]);
  const { rows: [home] } = await q("SELECT id,starter_granted FROM homes WHERE owner_character_id=$1 FOR UPDATE", [owner]);
  await q("INSERT INTO home_rooms (id,home_id) VALUES ($1,$2) ON CONFLICT (home_id,kind) DO NOTHING", [randomUUID(), home.id]);
  const { rows: [room] } = await q("SELECT id FROM home_rooms WHERE home_id=$1 AND kind='living-room'", [home.id]);
  if (!home.starter_granted) {
    for (const model of FURNITURE_MODELS) {
      const id = randomUUID();
      await q("INSERT INTO furniture_items (id,owner_character_id,model_id) VALUES ($1,$2,$3)", [id, owner, model.id]);
      const [x, y] = STARTER_POSITIONS[model.id];
      await q("INSERT INTO furniture_placements (item_id,room_id,x,y,depth) VALUES ($1,$2,$3,$4,0)", [id, room.id, x, y]);
    }
    await q("UPDATE homes SET starter_granted=TRUE WHERE id=$1", [home.id]);
  }
  return { homeId: home.id as string, roomId: room.id as string };
}
export async function homeSnapshot(q: Query, owner: string): Promise<HomeSnapshot> {
  const { rows: [row] } = await q(`SELECT h.id AS "homeId", h.owner_character_id AS "ownerId", r.id AS "roomId",
    r.wall, r.floor, r.revision, r.capacity FROM homes h JOIN home_rooms r ON r.home_id=h.id
    WHERE h.owner_character_id=$1 AND r.kind='living-room'`, [owner]);
  if (!row) throw new PlayerError("Cette maison est indisponible.");
  const { rows: items } = await q(`SELECT i.id, i.model_id AS "modelId", p.room_id AS "roomId"
    FROM furniture_items i LEFT JOIN furniture_placements p ON p.item_id=i.id
    WHERE i.owner_character_id=$1 ORDER BY i.acquired_at, i.id`, [owner]);
  const { rows: placements } = await q(`SELECT item_id AS "itemId", x,y,depth
    FROM furniture_placements WHERE room_id=$1 ORDER BY item_id`, [row.roomId]);
  return { homeId: row.homeId, ownerId: row.ownerId, roomId: row.roomId, revision: row.revision, inventoryComplete: true, capacity: row.capacity ?? ROOM_CAPACITY,
    decoration: { wall: row.wall, floor: row.floor, placements }, items, ownedFinishes: await ownedHomeFinishes(q, owner) };
}
export async function saveHome(q: Query, owner: string, input: ReturnType<typeof saveHomeSchema.parse>) {
  const { roomId } = await ensureHome(q, owner);
  const { rows: [room] } = await q("SELECT revision FROM home_rooms WHERE id=$1 FOR UPDATE", [roomId]);
  const payload = JSON.stringify({ expectedRevision: input.expectedRevision, decoration: input.decoration });
  const { rows: [operation] } = await q("SELECT payload FROM home_save_operations WHERE room_id=$1 AND operation_id=$2", [roomId, input.operationId]);
  if (operation) {
    if (operation.payload !== payload) throw new PlayerError("Cette opération a déjà été utilisée pour une autre modification.");
    return homeSnapshot(q, owner);
  }
  if (room.revision !== input.expectedRevision)
    throw new PlayerError("Le salon a été modifié ailleurs. Recharge la version enregistrée avant de réessayer.");
  // Lock inventory in stable order: an instance can be assigned to only one room.
  await q("SELECT id FROM furniture_items WHERE owner_character_id=$1 ORDER BY id FOR UPDATE", [owner]);
  const snapshot = await homeSnapshot(q, owner);
  if (!ownsHomeFinish(snapshot.ownedFinishes, "wall", input.decoration.wall) || !ownsHomeFinish(snapshot.ownedFinishes, "floor", input.decoration.floor))
    throw new PlayerError("Achète ce revêtement dans la boutique avant de l’utiliser.");
  try { validateDecoration(input.decoration, snapshot.items as OwnedFurniture[], roomId); }
  catch (error) { throw new PlayerError((error as Error).message); }
  if (!nearestHomePoint(createHomeNavigationMesh({ items: snapshot.items, decoration: input.decoration }), { x: 750, y: 565 }))
    throw new PlayerError("Laisse une zone libre au sol pour accueillir les personnages.");
  await q("DELETE FROM furniture_placements WHERE room_id=$1", [roomId]);
  for (const p of input.decoration.placements)
    await q("INSERT INTO furniture_placements (item_id,room_id,x,y,depth) VALUES ($1,$2,$3,$4,$5)", [p.itemId, roomId, p.x, p.y, p.depth]);
  await q("UPDATE home_rooms SET wall=$1,floor=$2,revision=revision+1 WHERE id=$3", [input.decoration.wall, input.decoration.floor, roomId]);
  await q("INSERT INTO home_save_operations (room_id,operation_id,payload,revision) VALUES ($1,$2,$3,$4)",
    [roomId, input.operationId, payload, room.revision + 1]);
  return homeSnapshot(q, owner);
}
