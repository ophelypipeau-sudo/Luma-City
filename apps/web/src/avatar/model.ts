import { avatarGarment, type AvatarSlot } from "./catalog";
import { AVATAR_BASE } from "./base";
import { retiredGarments } from "../../../../packages/contracts/src/retired-garments";
import { CLOTHING_LAYER_SLOTS, type AvatarFace, type ClothingLayerSlot } from "../../../../packages/contracts/src/index";

/** No body selector or character snapshot: just independently equipped pieces. */
export type AvatarLayers = Readonly<
  Record<"top" | "bottom" | "shoes", string | null>
> &
  Partial<
    Readonly<
      Record<Exclude<AvatarSlot, "top" | "bottom" | "shoes">, string | null>
    >
  > & {
    /** Optional for compatibility with previously saved outfits. */
    belt?: string | null;
    colors?: Readonly<Record<string, string>>;
    detailColors?: Readonly<Record<string, string>>;
    topTucked?: boolean;
    layerOrder?: readonly ClothingLayerSlot[];
    extraPieces?: readonly string[];
    pieceOrder?: readonly string[];
    face?: Readonly<AvatarFace>;
  };
export function hairHeadroom(layers?: AvatarLayers) {
  if (!layers) return 0;
  return equippedPieces(layers).reduce((height, piece) =>
    piece.slot === "hair" && piece.art.kind === "image"
      ? Math.max(height, Math.ceil(-(piece.art.offsetY ?? 0) * AVATAR_BASE.viewHeight / AVATAR_BASE.height))
      : height, 0);
}
export const EMPTY_LAYERS: AvatarLayers = {
  belt: null,
  top: null,
  bottom: null,
  shoes: null,
};
export const LEGACY_LAYERS: AvatarLayers = {
  belt: null,
  top: "camisole.ivory",
  bottom: "pleated-skirt.denim",
  shoes: "lace-boots.ivory",
};
export const IMPORT_TEST_LAYERS: AvatarLayers = {
  belt: null,
  top: "import.polo-cream-blue",
  bottom: "import.sweatpants-grey",
  shoes: null,
};
export const DEFAULT_LAYERS: AvatarLayers = {
  belt: null,
  top: "fashion.capsule-mode-cerise",
  bottom: "fashion.pants-dalle",
  shoes: "fashion.shoes-piste",
};
export const AVATAR_SLOTS = [
  "top",
  "top2",
  "bottom",
  "shoes",
  "belt",
  "outerwear",
  "legwear",
  "hair",
  "headwear",
  "necklace",
  "tie",
  "earrings",
  "bag",
] as const;

export function validateLayers(layers: AvatarLayers): void {
  for (const slot of AVATAR_SLOTS) {
    const id = layers[slot];
    if (id != null && !garmentFitsSlot(id, slot))
      throw new Error(`Garment ${id} cannot be equipped in ${slot}`);
  }
}

export function garmentFitsSlot(id: string, slot: AvatarSlot) {
  const piece = avatarGarment(id);
  if (slot === "top2") return piece.slot === "top" && !piece.isDress;
  return piece.slot === slot || piece.legacySlot === slot;
}

export function wornSlot(layers: AvatarLayers, id: string) {
  return AVATAR_SLOTS.find((slot) => layers[slot] === id) ??
    (layers.extraPieces?.includes(id) ? avatarGarment(id).slot : undefined);
}

export function wearGarment(layers: AvatarLayers, id: string) {
  if (retiredGarments.has(id)) return layers;
  if (wornSlot(layers, id)) return layers;
  const piece = avatarGarment(id);
  if (piece.isDress) return equipLayer(layers, "top", id);
  if ((piece.slot === "top" || piece.slot === "bottom") &&
      equippedPieces(layers).some((worn) => worn.isDress))
    return equipLayer(layers, piece.slot, id);
  if (!layers[piece.slot])
    return equipLayer(layers, piece.slot, id);
  if (piece.slot === "top" && !piece.isDress && !layers.top2)
    return equipLayer(layers, "top2", id);
  const extraPieces = [...layers.extraPieces ?? [], id];
  return { ...layers, extraPieces };
}

export function removeGarment(layers: AvatarLayers, id: string): AvatarLayers {
  const slot = AVATAR_SLOTS.find((candidate) => layers[candidate] === id);
  if (!slot && !layers.extraPieces?.includes(id)) return layers;
  return {
    ...layers,
    ...(slot && { [slot]: null }),
    ...(layers.extraPieces?.includes(id) && { extraPieces: layers.extraPieces.filter((piece) => piece !== id) }),
    ...(layers.pieceOrder?.includes(id) && { pieceOrder: layers.pieceOrder.filter((piece) => piece !== id) }),
  };
}

export function equippedPieces(layers: AvatarLayers) {
  return [
    ...AVATAR_SLOTS.flatMap((slot) => layers[slot] ? [{ ...avatarGarment(layers[slot]!), slot }] : []),
    ...(layers.extraPieces ?? []).map(avatarGarment),
  ].filter(({ id }) => !retiredGarments.has(id));
}

/** Front to back. Legacy slot ordering is used until the player moves a card. */
export function orderedOutfitPieces(layers: AvatarLayers, pieces = equippedPieces(layers)) {
  const behind = (slot: AvatarSlot) => pieces.find((piece) => piece.slot === slot)?.behindBottom;
  const order: AvatarSlot[] = [
    ...(behind("shoes") ? ["shoes", "legwear", "bottom"] as const : ["bottom", "legwear", "shoes"] as const),
    "top", "top2", "outerwear", "belt", "bag", "necklace", "tie", "hair", "earrings", "headwear",
  ];
  if (behind("top")) order.unshift(...order.splice(order.indexOf("top"), 1));
  if (behind("legwear")) order.unshift(...order.splice(order.indexOf("legwear"), 1));
  if (!layers.layerOrder && layers.topTucked && !pieces.find((piece) => piece.slot === "top")?.isDress) {
    order.splice(order.indexOf("top"), 1);
    order.splice(order.indexOf("bottom"), 0, "top");
  }
  const legacy = layers.layerOrder && [...layers.layerOrder].reverse();
  const defaults = order.flatMap((slot) => {
    const effectiveSlot = legacy && CLOTHING_LAYER_SLOTS.includes(slot as ClothingLayerSlot)
      ? legacy.shift() ?? slot : slot;
    return pieces.filter((piece) => piece.slot === effectiveSlot);
  }).reverse();
  if (!layers.pieceOrder?.length) return defaults;
  const byId = new Map(defaults.map((piece) => [piece.id, piece]));
  const ordered = layers.pieceOrder.flatMap((id) => byId.get(id) ?? []);
  const known = new Set(ordered.map((piece) => piece.id));
  // Insert newly worn items next to their nearest neighbor in the default order.
  for (const [index, piece] of defaults.entries()) {
    if (known.has(piece.id)) continue;
    const next = defaults.slice(index + 1).find((candidate) => known.has(candidate.id));
    ordered.splice(next ? ordered.indexOf(next) : ordered.length, 0, piece);
    known.add(piece.id);
  }
  return ordered;
}

export function moveOutfitPiece(layers: AvatarLayers, id: string, distance: number, visibleIds?: ReadonlySet<string>): AvatarLayers {
  const pieceOrder = orderedOutfitPieces(layers).map((piece) => piece.id);
  const movable = visibleIds ? pieceOrder.filter((pieceId) => visibleIds.has(pieceId)) : [...pieceOrder];
  const from = movable.indexOf(id);
  const to = Math.max(0, Math.min(movable.length - 1, from + distance));
  if (from < 0 || to === from) return layers;
  movable.splice(from, 1);
  movable.splice(to, 0, id);
  let next = 0;
  return { ...layers, pieceOrder: pieceOrder.map((pieceId) =>
    !visibleIds || visibleIds.has(pieceId) ? movable[next++] : pieceId) };
}

/** Front to back, including empty slots so replacing a garment keeps its position. */
export function clothingLayerOrder(layers: AvatarLayers): readonly ClothingLayerSlot[] {
  if (layers.layerOrder) return layers.layerOrder;
  return layers.topTucked || (layers.top && avatarGarment(layers.top).behindBottom)
    ? ["outerwear", "top2", "bottom", "top"]
    : CLOTHING_LAYER_SLOTS;
}

export function moveClothingLayer(
  layers: AvatarLayers,
  slot: ClothingLayerSlot,
  direction: -1 | 1,
): AvatarLayers {
  const layerOrder = [...clothingLayerOrder(layers)];
  const worn = layerOrder.filter((candidate) => layers[candidate] != null);
  const index = worn.indexOf(slot);
  const neighbor = worn[index + direction];
  if (index < 0 || !neighbor) return layers;
  const a = layerOrder.indexOf(slot), b = layerOrder.indexOf(neighbor);
  [layerOrder[a], layerOrder[b]] = [layerOrder[b], layerOrder[a]];
  const movedWaist = (slot === "top" && neighbor === "bottom") ||
    (slot === "bottom" && neighbor === "top");
  return {
    ...layers,
    layerOrder,
    ...(movedWaist && { topTucked: layerOrder.indexOf("top") > layerOrder.indexOf("bottom") }),
  };
}

/** One slot changes; the body and every other slot remain untouched. */
export function equipLayer(
  layers: AvatarLayers,
  slot: AvatarSlot,
  id: string | null | undefined,
): AvatarLayers {
  if (id != null && !garmentFitsSlot(id, slot))
    throw new Error(`Garment ${id} cannot be equipped in ${slot}`);
  if (id && avatarGarment(id).isDress) {
    for (const piece of equippedPieces(layers)) {
      if (["top", "top2", "bottom"].includes(piece.slot))
        layers = removeGarment(layers, piece.id);
    }
  } else if (id && (slot === "top" || slot === "top2" || slot === "bottom")) {
    for (const piece of equippedPieces(layers)) {
      if (piece.isDress) layers = removeGarment(layers, piece.id);
    }
  }
  const previous = id != null ? AVATAR_SLOTS.find((other) => other !== slot && layers[other] === id) : undefined;
  return {
    ...(id && layers.extraPieces?.includes(id) ? removeGarment(layers, id) : layers),
    ...(previous && { [previous]: null }),
    [slot]: id ?? null,
  };
}
