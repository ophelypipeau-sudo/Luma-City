import {
  BARE_OUTFIT,
  ORIGINAL_OUTFIT,
  accessoryEquipped,
  catalogFor,
  type ClothingCategory,
  type Outfit,
  type PieceId,
} from "../shop/catalog";
import {
  dollId,
  isMorphologyId,
  legacyBodyFor,
  type BodySelection,
  type MorphologyId,
} from "./model";

/** Serializable item choices. Body shape is never encoded in a piece id.
 * Accessories are individual pieces rather than a renderer-specific bitmask. */
export type Equipment = Readonly<
  Record<Exclude<ClothingCategory, "accessories">, PieceId | null> & {
    accessories: readonly PieceId[];
  }
>;
export type SavedLook = Readonly<{
  id: string;
  name: string;
  equipped: Equipment;
}>;
export type AvatarAppearance = Readonly<{
  schemaVersion: 1;
  identity: Readonly<{ characterId: string }>;
  body: BodySelection;
  equipped: Equipment;
  looks: readonly SavedLook[];
}>;
const singleSlots = ["tops", "bottoms", "shoes", "hair"] as const;
function copyEquipment(equipped: Equipment): Equipment {
  return { ...equipped, accessories: [...equipped.accessories] };
}

/** Explicit one-way adapter from the current v6 variant indices. Never guess
 * an item from its index without the legacy character catalogue. */
export function equipmentFromLegacy(
  characterId: string,
  outfit: Outfit,
): Equipment {
  const catalog = catalogFor(dollId(characterId));
  const equipment: Record<(typeof singleSlots)[number], PieceId | null> = {
    tops: null,
    bottoms: null,
    shoes: null,
    hair: null,
  };
  for (const category of singleSlots) {
    const variant = outfit[category];
    if (variant === -1) continue;
    const item = catalog.find(
      (item) => item.category === category && item.variant === variant,
    );
    if (!item)
      throw new Error(`Unknown legacy ${category} variant: ${variant}`);
    equipment[category] = item.pieceId;
  }
  if (
    !Number.isInteger(outfit.accessories) ||
    outfit.accessories < -1 ||
    outfit.accessories > 7
  )
    throw new Error("Unknown legacy accessory mask");
  return {
    ...equipment,
    accessories: catalog
      .filter(
        (item) =>
          item.category === "accessories" &&
          accessoryEquipped(outfit.accessories, item.variant),
      )
      .map((item) => item.pieceId),
  };
}

export function createLegacyAppearance(
  characterId: string,
  outfit: Outfit = ORIGINAL_OUTFIT,
): AvatarAppearance {
  const character = dollId(characterId);
  return {
    schemaVersion: 1,
    identity: { characterId: character },
    body: legacyBodyFor(character),
    equipped: equipmentFromLegacy(character, outfit),
    looks: [],
  };
}

/** Changing shape changes only the body choice, never the clothing or looks.
 * Rendering readiness is a separate concern: the morphology renderer resolves
 * calibrated pilot fits; the legacy renderer remains a separate adapter. */
export function changeMorphology(
  appearance: AvatarAppearance,
  morphologyId: MorphologyId,
): AvatarAppearance {
  if (!isMorphologyId(morphologyId)) throw new Error("Unknown morphology");
  return { ...appearance, body: { kind: "morphology", morphologyId } };
}

/** A saved look contains clothing, not a body or character snapshot. */
export function saveLook(
  appearance: AvatarAppearance,
  id: string,
  name: string,
): AvatarAppearance {
  if (!id.trim() || !name.trim())
    throw new Error("A look needs an id and a name");
  const look: SavedLook = {
    id,
    name: name.trim(),
    equipped: copyEquipment(appearance.equipped),
  };
  const found = appearance.looks.some((old) => old.id === id);
  return {
    ...appearance,
    looks: found
      ? appearance.looks.map((old) => (old.id === id ? look : old))
      : [...appearance.looks, look],
  };
}
export function applyLook(
  appearance: AvatarAppearance,
  lookId: string,
): AvatarAppearance {
  const look = appearance.looks.find((look) => look.id === lookId);
  if (!look) throw new Error(`Unknown look: ${lookId}`);
  return { ...appearance, equipped: copyEquipment(look.equipped) };
}

/** Legacy renderer bridge. Missing fits are reported; they must never silently
 * replace an item, use the default outfit, or remove a saved piece. */
export function outfitForLegacyRenderer(appearance: AvatarAppearance): Outfit {
  if (appearance.body.kind !== "legacy")
    throw new Error(
      `Morphology ${appearance.body.morphologyId}: calibrated v6 fit not available through the legacy adapter; use the morphology renderer`,
    );
  const expected = legacyBodyFor(appearance.identity.characterId);
  if (
    expected.kind !== "legacy" ||
    appearance.body.profileId !== expected.profileId
  )
    throw new Error(
      "This legacy body profile has no calibrated fit for this identity",
    );
  const catalog = catalogFor(appearance.identity.characterId);
  const outfit = { ...BARE_OUTFIT };
  for (const category of singleSlots) {
    const pieceId = appearance.equipped[category];
    if (pieceId === null) continue;
    const item = catalog.find(
      (item) => item.category === category && item.pieceId === pieceId,
    );
    if (!item)
      throw new Error(`No legacy ${category} fit for piece ${pieceId}`);
    outfit[category] = item.variant;
  }
  let mask = 0;
  for (const pieceId of appearance.equipped.accessories) {
    const item = catalog.find(
      (item) => item.category === "accessories" && item.pieceId === pieceId,
    );
    if (!item) throw new Error(`No legacy accessory fit for piece ${pieceId}`);
    mask |= 1 << item.variant;
  }
  outfit.accessories = mask || -1;
  return outfit;
}

export function withLegacyOutfit(
  appearance: AvatarAppearance,
  outfit: Outfit,
): AvatarAppearance {
  return {
    ...appearance,
    equipped: equipmentFromLegacy(appearance.identity.characterId, outfit),
  };
}
