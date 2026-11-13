import { avatarGarment } from './catalog';
import { retiredGarments } from '../../../../packages/contracts/src/retired-garments';
import { avatarFaceSchema, clothingLayerOrderSchema, outfitPieceIdsSchema } from '../../../../packages/contracts/src/index';
import { AVATAR_SLOTS, DEFAULT_LAYERS, equippedPieces, garmentFitsSlot, type AvatarLayers } from './model';

export const WORN_OUTFITS_KEY = 'worn-outfits-v1';
export type WornOutfits = Record<string, AvatarLayers>;
export const outfitOwner = (account: string, characterId: string) =>
  JSON.stringify([account, characterId]);

/** Deep snapshot: later try-ons never mutate the accepted outfit. */
export function snapshotOutfit(layers: AvatarLayers): AvatarLayers {
  return { ...layers, belt: layers.belt ?? null,
    ...(layers.layerOrder && { layerOrder: [...layers.layerOrder] }),
    ...(layers.extraPieces && { extraPieces: [...layers.extraPieces] }),
    ...(layers.pieceOrder && { pieceOrder: [...layers.pieceOrder] }),
    ...(layers.face && { face: { ...layers.face } }),
    colors: { ...layers.colors }, detailColors: { ...layers.detailColors } };
}

export function readAvatarLayers(saved: unknown): AvatarLayers | undefined {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return;
  const source = saved as Record<string, unknown>;
  const next = snapshotOutfit(DEFAULT_LAYERS) as { -readonly [K in keyof AvatarLayers]: AvatarLayers[K] };
  for (const slot of AVATAR_SLOTS) {
    if (source[slot] === null || (typeof source[slot] === "string" && retiredGarments.has(source[slot]))) next[slot] = null;
    else if (typeof source[slot] === "string") {
      try {
        if (garmentFitsSlot(source[slot], slot)) next[slot] = source[slot];
      } catch {
        // An import may not have loaded in this browser yet.
      }
    }
  }
  if (next.top && avatarGarment(next.top).slot === "outerwear" && !next.outerwear) {
    next.outerwear = next.top;
    next.top = null;
  }
  for (const field of ["colors", "detailColors"] as const) {
    const colors = source[field];
    next[field] = colors && typeof colors === "object" && !Array.isArray(colors)
      ? Object.fromEntries(Object.entries(colors).filter(([, color]) =>
          typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)))
      : {};
  }
  if (typeof source.topTucked === "boolean") next.topTucked = source.topTucked;
  const order = clothingLayerOrderSchema.safeParse(source.layerOrder);
  if (order.success) next.layerOrder = order.data;
  const extras = outfitPieceIdsSchema.safeParse(source.extraPieces);
  if (extras.success) {
    const alreadyWorn = new Set(AVATAR_SLOTS.map((slot) => next[slot]));
    next.extraPieces = extras.data.filter((id) => {
      try { return !retiredGarments.has(id) && !alreadyWorn.has(id) && !!avatarGarment(id); }
      catch { return false; }
    });
  }
  const pieceOrder = outfitPieceIdsSchema.safeParse(source.pieceOrder);
  if (pieceOrder.success) next.pieceOrder = pieceOrder.data;
  const face = avatarFaceSchema.safeParse(source.face);
  if (face.success) next.face = face.data;
  return next;
}

/** Share only what is being worn, including both dyes of each equipped item. */
export function shareOutfit(layers: AvatarLayers): AvatarLayers {
  const equipped = equippedPieces(layers).map((piece) => piece.id);
  const colors = (source: AvatarLayers["colors"]) =>
    Object.fromEntries(equipped.flatMap((id) => {
      const color = source?.[id];
      return color ? [[id, color]] : [];
    }));
  return { ...layers, colors: colors(layers.colors), detailColors: colors(layers.detailColors) };
}

export function readWornOutfits(raw: string | null): WornOutfits {
  try {
    const value: unknown = JSON.parse(raw ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const result: WornOutfits = {};
    for (const [owner, saved] of Object.entries(value)) {
      const outfit = readAvatarLayers(saved);
      if (outfit) result[owner] = outfit;
    }
    return result;
  } catch { return {}; }
}
