import { removeGarment, type AvatarLayers } from "./model";
import { retiredGarments } from "../../../../packages/contracts/src/retired-garments";
const KEY = "avatar-archived-pieces-v1";
const listeners = new Set<() => void>();
let ids: readonly string[] | undefined;
export function archivedPieces(): readonly string[] {
  if (!ids) {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      ids = Array.isArray(saved)
        ? saved.filter((i) => typeof i === "string" && !retiredGarments.has(i))
        : [];
      if (Array.isArray(saved) && ids.length !== saved.length) {
        try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* In-memory view is already clean. */ }
      }
    } catch {
      ids = [];
    }
  }
  return ids!;
}
export function subscribeArchive(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function visibleShopPieces<T extends { id: string }>(
  pieces: readonly T[],
  hidden: readonly string[],
): T[] {
  const archived = new Set(hidden);
  return pieces.filter((piece) => !archived.has(piece.id));
}
function save(next: readonly string[]) {
  localStorage.setItem(KEY, JSON.stringify(next));
  ids = next;
  for (const listener of listeners) listener();
}
/** Builder deletion is reversible; source assets and purchases are retained. */
export function archivePiece(id: string) {
  if (!retiredGarments.has(id) && !archivedPieces().includes(id)) save([...archivedPieces(), id]);
}
export function restorePiece(id: string) {
  save(archivedPieces().filter((i) => i !== id));
}
export function withoutArchivedPieces(
  layers: AvatarLayers,
  hidden: readonly string[],
): AvatarLayers {
  let next = layers;
  for (const id of hidden) next = removeGarment(next, id);
  return next;
}
