/** V6 art contract: every layer uses this canvas, pose and set of body anchors. */
export const DOLL_WIDTH = 480;
export const DOLL_HEIGHT = 1024;
export const DOLL_ATLAS_WIDTH = DOLL_WIDTH * 4;
export const DOLL_BASE = "/assets/cartoon-base-v6.png";
export const DOLL_HAIR = "/assets/cartoon-hair-v6.png";
export const DOLL_IDS = ["iris", "milo", "june", "noa"] as const;
export function dollId(id: string) {
  return DOLL_IDS.includes(id as (typeof DOLL_IDS)[number])
    ? (id as (typeof DOLL_IDS)[number])
    : "iris";
}
export function dollIndex(id: string) {
  return DOLL_IDS.indexOf(dollId(id));
}
export function isFemale(id: string) {
  return id === "iris" || id === "june";
}
/** Planned body types are independent of character identities. These labels do
 * not claim that the six calibrated body/garment assets already exist. */
export const MORPHOLOGIES = [
  { id: "X", name: "Sablier (X)" },
  { id: "A", name: "Poire (A)" },
  { id: "O", name: "Pomme (O)" },
  { id: "H", name: "Rectangle (H)" },
  { id: "V", name: "V inversé" },
  { id: "8", name: "Morphologie en 8" },
] as const;
export type MorphologyId = (typeof MORPHOLOGIES)[number]["id"];
export function isMorphologyId(value: unknown): value is MorphologyId {
  return MORPHOLOGIES.some(({ id }) => id === value);
}
/** Keep the existing silhouettes as compatibility profiles rather than
 * arbitrarily labelling them X or 8. Only the legacy adapter infers a profile. */
export type LegacyBodyProfileId = "v6-feminine" | "v6-masculine";
export type BodySelection =
  | { kind: "legacy"; profileId: LegacyBodyProfileId }
  | { kind: "morphology"; morphologyId: MorphologyId };
export function legacyBodyFor(characterId: string): BodySelection {
  return {
    kind: "legacy",
    profileId: isFemale(dollId(characterId)) ? "v6-feminine" : "v6-masculine",
  };
}
export const DOLL_ANCHORS = {
  scalp: [243, 40],
  chin: [243, 220],
  neck: [243, 250],
  shoulders: [
    [158, 275],
    [328, 275],
  ],
  chest: [243, 330],
  waist: [243, 425],
  hips: [243, 500],
  wrists: [
    [90, 540],
    [395, 540],
  ],
  knees: [
    [198, 740],
    [287, 740],
  ],
  ankles: [
    [202, 935],
    [283, 935],
  ],
  floor: 1008,
} as const;
export const DOLL_MALE_ANCHORS = {
  scalp: [240, 30],
  chin: [240, 220],
  neck: [240, 235],
  shoulders: [
    [130, 260],
    [350, 260],
  ],
  chest: [240, 330],
  waist: [240, 452],
  hips: [240, 530],
  wrists: [
    [90, 570],
    [390, 570],
  ],
  knees: [
    [185, 740],
    [289, 740],
  ],
  ankles: [
    [185, 935],
    [293, 935],
  ],
  floor: 1010,
} as const;
/** A slot is painted in body coordinates; the catalogue only changes its viewport. */
export const DOLL_CROPS = {
  tops: [58, 252, 372, 320],
  bottoms: [125, 442, 230, 548],
  skirt: [118, 412, 250, 190],
  shoes: [134, 749, 212, 270],
  hair: [30, 0, 420, 830],
  accessories: [140, 148, 330, 620],
} as const;
