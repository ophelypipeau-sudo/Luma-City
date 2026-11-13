import { BARE_OUTFIT } from "../shop/catalog";
import {
  createLegacyAppearance,
  type AvatarAppearance,
  type Equipment,
} from "./appearance";
import type { MorphologyId } from "./model";
export const PILOT_PIECES = {
  tops: "camisole.ivory",
  bottoms: "pleated-skirt.denim",
  shoes: "lace-boots.ivory",
} as const;
export type PilotSlot = keyof typeof PILOT_PIECES;
export function createPilotAppearance(
  morphologyId: MorphologyId = "X",
): AvatarAppearance {
  return {
    ...createLegacyAppearance("iris", BARE_OUTFIT),
    body: { kind: "morphology", morphologyId },
    equipped: { ...PILOT_PIECES, hair: null, accessories: [] },
  };
}
export function togglePilotPiece(
  appearance: AvatarAppearance,
  slot: PilotSlot,
): AvatarAppearance {
  return {
    ...appearance,
    equipped: {
      ...appearance.equipped,
      [slot]:
        appearance.equipped[slot] === PILOT_PIECES[slot]
          ? null
          : PILOT_PIECES[slot],
    },
  };
}
export function isPilotEquipped(equipment: Equipment, slot: PilotSlot) {
  return equipment[slot] === PILOT_PIECES[slot];
}
export function unsupportedPilotPieces(appearance: AvatarAppearance): string[] {
  const e = appearance.equipped;
  return [
    ...(Object.keys(PILOT_PIECES) as PilotSlot[]).flatMap((slot) =>
      e[slot] !== null && !isPilotEquipped(e, slot) ? [e[slot]!] : [],
    ),
    ...(e.hair ? [e.hair] : []),
    ...e.accessories,
  ];
}
