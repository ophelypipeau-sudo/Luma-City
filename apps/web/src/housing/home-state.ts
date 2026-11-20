import type { HomeSnapshot } from "../../../../packages/contracts/src/housing";
import { ownsHomeFinish } from "../../../../packages/domain/src/home-finishes";

export function unownedHomeFinishes(decoration: HomeSnapshot["decoration"], owned: readonly string[] | undefined) {
  return (["wall", "floor"] as const).filter((kind) => !ownsHomeFinish(owned, kind, decoration[kind])).map((kind) => `${kind}:${decoration[kind]}`);
}

/** Public broadcasts must not delete stored inventory; complete owner snapshots can replace it. */
export function reconcileHome(current: HomeSnapshot, incoming: HomeSnapshot, isOwner: boolean): HomeSnapshot {
  if (incoming.ownerId !== current.ownerId || incoming.revision < current.revision) return current;
  if (!isOwner || incoming.inventoryComplete) return incoming;
  const items = new Map(current.items.map((item) => [item.id, item]));
  for (const item of incoming.items) items.set(item.id, item);
  const placed = new Set(incoming.decoration.placements.map((p) => p.itemId));
  return { ...incoming, ownedFinishes: current.ownedFinishes, items: [...items.values()].map((item) => ({ ...item,
    roomId: placed.has(item.id) ? incoming.roomId : item.roomId === incoming.roomId ? null : item.roomId,
  })) };
}
export const saveSignature = (decoration: HomeSnapshot["decoration"], expectedRevision: number) => JSON.stringify({ decoration, expectedRevision });
export function canVerifySave(unconfirmed: boolean, operation: { signature: string } | null, signature: string) {
  return unconfirmed && operation?.signature === signature;
}
