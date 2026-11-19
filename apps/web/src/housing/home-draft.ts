import { z } from "zod";
import { homeDecorationSchema, type HomeDecoration, type HomeSnapshot } from "../../../../packages/contracts/src/housing";
import { saveSignature } from "./home-state";

const draftSchema = z.object({
  expectedRevision: z.number().int().nonnegative(), decoration: homeDecorationSchema,
  pending: z.object({ signature: z.string().max(65536), operationId: z.uuid() }).strict().nullable(),
  unconfirmed: z.boolean(),
}).strict();
export type HomeDraft = z.infer<typeof draftSchema>;
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export const homeDraftKey = (owner: string) => `housing-draft-v1:${owner}`;

export function readHomeDraft(storage: DraftStorage, owner: string): HomeDraft | null {
  try {
    const raw = storage.getItem(homeDraftKey(owner));
    if (!raw || raw.length > 65536) return null;
    const result = draftSchema.safeParse(JSON.parse(raw));
    if (!result.success) return null;
    const draft = result.data;
    if (draft.pending?.signature !== saveSignature(draft.decoration, draft.expectedRevision)) {
      draft.pending = null; draft.unconfirmed = false;
    }
    return draft;
  } catch { return null; }
}
export function writeHomeDraft(storage: DraftStorage, owner: string, decoration: HomeDecoration, expectedRevision: number,
  pending: HomeDraft["pending"], unconfirmed: boolean) {
  try {
    const sameCommand = pending?.signature === saveSignature(decoration, expectedRevision);
    storage.setItem(homeDraftKey(owner), JSON.stringify({ decoration, expectedRevision,
      pending: sameCommand ? pending : null, unconfirmed: sameCommand && unconfirmed }));
    return true;
  } catch { return false; }
}
export function clearHomeDraft(storage: DraftStorage, owner: string) {
  try { storage.removeItem(homeDraftKey(owner)); return true; } catch { return false; }
}
export function draftToRestore(home: HomeSnapshot, saved: HomeDraft | null) {
  if (!saved || (!saved.unconfirmed && JSON.stringify(saved.decoration) === JSON.stringify(home.decoration))) return null;
  return saved;
}
