import { retiredGarments } from "../../../../packages/contracts/src/retired-garments";
import { CITY_CAPSULE_GARMENTS } from "./city-capsule";
import { BOTTOMS_CAPSULE_GARMENTS } from "./bottoms-capsule";
import { PUNK_GARMENTS } from "./punk-catalog";
import type { FabricTone } from "../../../../packages/domain/src/atelier-color";
import { PLUM_GARMENTS } from "./prune-fumee";
import { APPROVED_TOPS } from "./approved-tops";
import { CAPSULE_MODE_GARMENTS } from "./capsule-mode";
import { PREMIUM_CAPSULE_GARMENTS } from "./premium-capsule";
import { IRIS_SKIRTS_GARMENTS } from "./iris-skirts";
import { IRIS_DRESSES_GARMENTS } from "./iris-dresses";
import { IRIS_SHORTS_GARMENTS } from "./iris-shorts";
import { PANTS_CAPSULE_GARMENTS } from "./pants-capsule";
import { LEGGING_GARMENTS } from "./legging";
import { SHOES_CAPSULE_GARMENTS } from "./shoes-capsule";
import { HAIR_CAPSULE_GARMENTS } from "./hair-capsule";
import { HAIR_CAPSULE_V2_GARMENTS } from "./hair-capsule-v2";
import { HAIR_CAPSULE_V3_GARMENTS } from "./hair-capsule-v3";
import { HAIR_CAPSULE_V4_GARMENTS } from "./hair-capsule-v4";
import { TSHIRT_GARMENTS } from "./tshirts";
import { POLAR_GARMENTS } from "./minuit-polaire";
import { ROSE_GARMENTS } from "./rose";
import { TEXTILE_GARMENTS } from "./textile-catalog";
import { WINTER_GARMENTS } from "./winter";
import { BURGUNDY_GARMENTS } from "./burgundy";
import { LEOPARD_GARMENTS } from "./leopard";
import { AVATAR_BASE } from "./base";
import {
  withBuiltinPoseProfile,
  assertPoseProfile,
  poseProfileIssues,
  type GarmentPoseProfile,
} from "./pose-wardrobe";

export type AvatarSlot =
  | "top"
  | "top2"
  | "bottom"
  | "shoes"
  | "belt"
  | "outerwear"
  | "legwear"
  | "hair"
  | "headwear"
  | "tie"
  | "necklace"
  | "earrings"
  | "bag";
export type GarmentPass = "back" | "front" | "all";
export type Garment = Readonly<{
  id: string;
  name: string;
  slot: AvatarSlot;
  legacySlot?: AvatarSlot;
  poseProfile?: GarmentPoseProfile;
  /** Approved composites of the same Iris body for these garment overlays. */
  fittingBody?: Readonly<Record<"front" | "hand-on-hip", string>>;
  fittingHipHand?: string;
  /** Binding to measured canonical body, distinct from the PNG canvas dimensions. */
  pattern?: Readonly<{ id: string; bodySha256: string; cut: string }>;
  colorable?: boolean;
  price?: number;
  secondaryColor?: Readonly<{
    label: string;
    defaultColor: string;
    mode: "dark" | "light-panel";
  }>;
  art: Readonly<
    | {
        kind: "vector";
        drawing: "tops" | "bottoms" | "shoes";
        textile?:
          | import("../../../../packages/domain/src/textile-pattern").TextileCut
          | import("../../../../packages/domain/src/punk-pattern").PunkCut;
      }
    | {
        kind: "image";
        front: string;
        colorMasks?: {
          main: string;
          detail?: string;
          mainBase: string;
          detailBase: string;
          shading?: "material";
          mainContrast?: number;
          mainTone?: FabricTone;
          mainLight?: string;
          protected?: string;
          detailTone?: FabricTone;
        };
        /** Normalize source cloth luminance before applying a chosen dye. */
        recolorGain?: number;
        primaryMask?: "lilac";
        source?: { x?: number; y?: number; width: number; height: number };
        /** Shift both registered passes together without clipping tall silhouettes. */
        offsetY?: number;
        back?: string;
        scaleX?: number;
        sampleStep?: number;
        backRegion?: string;
        widthStops?: readonly { y: number; scaleX: number }[];
        bands?: readonly {
          sourceY: number;
          sourceHeight: number;
          y: number;
          height: number;
        }[];
      }
  >;
  /** Only legacy vector pieces need outlines; raster pieces carry their own registration. */
  geometry?: typeof AVATAR_BASE.fit;
  crop: readonly [number, number, number, number];
  /** Opaque body coverage, independent of garment paint/transparency. */
  coverage: readonly string[];
  coverageFromArt?: boolean;
  bodyMask?: string;
  isDress?: boolean;
  handCarry?: Readonly<{
    hand: string;
    shoulder: string;
    shoulderMask?: string;
  }>;
  behindBottom?: boolean;
  /** Belt attachment calibrated at the waistband on the common body canvas. */
  beltFit?: Readonly<{ scaleX: number; offsetY: number }>;
  /** Region above this waistband, with a small overlap under its opaque edge. */
  tuckedTopRegion?: string;
  /** Underwear cut only; identity, outline and pose stay the canonical body. */
  underwearCut?: "strapless" | "low-rise";
  frontPaths?: readonly { d: string; fill: string }[];
  /** Only this calibrated body region is restored above this garment. */
  foreground?: Readonly<{ region: string; overlap: string }>;
}>;

const f = AVATAR_BASE.fit;
export const LEGACY_BASE_GARMENTS: readonly Garment[] = [
  {
    id: "camisole.ivory",
    name: "Caraco lumière",
    slot: "top",
    art: { kind: "vector", drawing: "tops" },
    geometry: f,
    crop: [280, 460, 325, 245],
    coverage: [f.top, f.straps],
  },
  {
    id: "pleated-skirt.denim",
    name: "Denim plissé",
    slot: "bottom",
    art: { kind: "vector", drawing: "bottoms" },
    geometry: f,
    crop: [190, 710, 510, 400],
    coverage: [f.skirt],
    foreground: { region: f.forearms, overlap: f.skirt },
  },
  {
    id: "lace-boots.ivory",
    name: "Bottes givrées",
    slot: "shoes",
    art: { kind: "vector", drawing: "shoes" },
    geometry: f,
    crop: [250, 1310, 400, 460],
    coverage: f.boots.flatMap((b) => [b.front, b.cuff, b.clear]),
  },
];

export const IMPORT_TEST_GARMENTS: readonly Garment[] = [
  {
    id: "import.polo-cream-blue",
    name: "Polo crème & ciel",
    slot: "top",
    geometry: f,
    crop: [230, 410, 425, 440],
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: "/assets/avatar/clothes/import-test-v1/polo.png",
      backRegion: "M0 0H887V448H0Z",
      scaleX: 0.85,
      bands: [{ sourceY: 0, sourceHeight: 1774, y: 86, height: 1774 * 0.78 }],
    },
  },
  {
    id: "import.camisole-white-navy",
    name: "Débardeur blanc & marine",
    slot: "top",
    geometry: f,
    crop: [285, 460, 320, 330],
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: "/assets/avatar/clothes/import-test-v1/camisole.png",
      scaleX: 1.02,
      bands: [
        { sourceY: 550, sourceHeight: 120, y: 478, height: 28 },
        { sourceY: 670, sourceHeight: 1104, y: 506, height: 883.2 },
      ],
    },
  },
  {
    id: "import.sweatpants-grey",
    name: "Jogging gris nuage",
    slot: "bottom",
    geometry: f,
    crop: [220, 700, 450, 1045],
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: "/assets/avatar/clothes/import-test-v1/pants.png",
      backRegion: "M0 0H887V751H0Z",
      widthStops: [
        { y: 0, scaleX: 0.8 },
        { y: 744, scaleX: 0.8 },
        { y: 760, scaleX: 0.88 },
        { y: 790, scaleX: 1 },
        { y: 900, scaleX: 1.04 },
        { y: 1774, scaleX: 1.04 },
      ],
      bands: [
        { sourceY: 0, sourceHeight: 760, y: 125, height: 608 },
        { sourceY: 760, sourceHeight: 240, y: 733, height: 217 },
        { sourceY: 1000, sourceHeight: 774, y: 950, height: 774 * (740 / 690) },
      ],
    },
  },
];
export const AVATAR_GARMENTS: readonly Garment[] = [
  {
    id: "fashion.cardigan-lilac",
    secondaryColor: {
      label: "Caraco intérieur",
      defaultColor: "#fff4df",
      mode: "light-panel",
    },
    colorable: true,
    name: "Cardigan lilas & caraco",
    slot: "top",
    crop: [70, 300, 750, 680],
    // A closed long sleeve replaces the covered arm silhouette up to its cuff.
    coverage: [
      "M270 375C245 465 245 535 230 585L195 680L135 805L200 827L225 760L280 670L320 535L342 405Z",
      "M617 375C642 465 642 535 657 585L692 680L752 805L687 827L662 760L607 670L567 535L545 405Z",
    ],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: "/assets/avatar/fashion-v2/top.png",
      primaryMask: "lilac",
      recolorGain: 1.2,
      sampleStep: 4,
      bands: [{ sourceY: 0, sourceHeight: 1774, y: 30, height: 1774 * 0.83 }],
      widthStops: [
        { y: 0, scaleX: 1 },
        { y: 650, scaleX: 1 },
        { y: 940, scaleX: 0.8 },
        { y: 1774, scaleX: 0.8 },
      ],
    },
  },
  {
    id: "fashion.jeans-indigo",
    beltFit: { scaleX: 0.94, offsetY: -7 },
    colorable: true,
    name: "Jean évasé indigo",
    slot: "bottom",
    crop: [180, 670, 530, 1055],
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: "/assets/avatar/fashion-v2/jeans.png",
      recolorGain: 3,
      sampleStep: 4,
      bands: [{ sourceY: 0, sourceHeight: 1774, y: -5, height: 1774 }],
      widthStops: [
        { y: 0, scaleX: 1.1 },
        { y: 740, scaleX: 1.1 },
        { y: 850, scaleX: 1.02 },
        { y: 1774, scaleX: 1.02 },
      ],
    },
  },
  {
    id: "fashion.boots-ivory",
    colorable: true,
    behindBottom: true,
    name: "Bottines plateforme ivoire",
    slot: "shoes",
    crop: [250, 1520, 390, 250],
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: "/assets/avatar/fashion-v2/boots.png",
      backRegion: "M0 0H887V1566H0Z",
    },
  },
  ...ROSE_GARMENTS,
];
const byId = new Map(
  [
    ...CITY_CAPSULE_GARMENTS,
    ...BOTTOMS_CAPSULE_GARMENTS,
    ...IRIS_SKIRTS_GARMENTS,
    ...IRIS_DRESSES_GARMENTS,
    ...IRIS_SHORTS_GARMENTS,
    ...PANTS_CAPSULE_GARMENTS,
    ...LEGGING_GARMENTS,
    ...SHOES_CAPSULE_GARMENTS,
    ...HAIR_CAPSULE_GARMENTS,
    ...HAIR_CAPSULE_V2_GARMENTS,
    ...HAIR_CAPSULE_V3_GARMENTS,
    ...HAIR_CAPSULE_V4_GARMENTS,
    ...PREMIUM_CAPSULE_GARMENTS,
    ...CAPSULE_MODE_GARMENTS,
    ...TSHIRT_GARMENTS,
    ...APPROVED_TOPS,
    ...POLAR_GARMENTS,
    ...PLUM_GARMENTS,
    ...PUNK_GARMENTS,
    ...TEXTILE_GARMENTS,
    ...LEGACY_BASE_GARMENTS,
    ...IMPORT_TEST_GARMENTS,
    ...AVATAR_GARMENTS,
    ...BURGUNDY_GARMENTS,
    ...LEOPARD_GARMENTS,
    ...WINTER_GARMENTS,
  ].map((piece) => [piece.id, withBuiltinPoseProfile(piece)]),
);
const imported = new Map<string, Garment>();
let pendingImports: readonly Garment[] = [];
export function pendingPoseImports() {
  return pendingImports;
}
const shopGarments = [
  ...CITY_CAPSULE_GARMENTS,
  ...BOTTOMS_CAPSULE_GARMENTS,
  ...HAIR_CAPSULE_V3_GARMENTS,
  ...HAIR_CAPSULE_V4_GARMENTS,
  ...HAIR_CAPSULE_V2_GARMENTS,
  ...HAIR_CAPSULE_GARMENTS,
  ...IRIS_SKIRTS_GARMENTS,
  ...IRIS_DRESSES_GARMENTS,
  ...IRIS_SHORTS_GARMENTS,
  ...PANTS_CAPSULE_GARMENTS,
  ...LEGGING_GARMENTS,
  ...SHOES_CAPSULE_GARMENTS,
  ...PREMIUM_CAPSULE_GARMENTS,
  ...CAPSULE_MODE_GARMENTS,
  ...TSHIRT_GARMENTS,
  ...APPROVED_TOPS,
  ...POLAR_GARMENTS,
  ...PLUM_GARMENTS,
  ...PUNK_GARMENTS,
  ...TEXTILE_GARMENTS,
  ...WINTER_GARMENTS,
  ...LEOPARD_GARMENTS,
  ...BURGUNDY_GARMENTS,
  ...AVATAR_GARMENTS,
].filter(({ id }) => !retiredGarments.has(id)).map(withBuiltinPoseProfile);
let snapshot: readonly Garment[] = shopGarments;
const listeners = new Set<() => void>();
export function registerAtelierGarment(piece: Garment, published = false) {
  if (!piece.id.startsWith("atelier."))
    throw new Error("Identifiant d’import invalide");
  if (published) assertPoseProfile(piece, true);
  byId.set(piece.id, piece);
  if (published) {
    imported.set(piece.id, piece);
    snapshot = [...shopGarments, ...imported.values()];
    for (const listener of listeners) listener();
  }
}
export function avatarCatalogSnapshot() {
  return snapshot;
}
export function replaceAtelierCatalog(pieces: Garment[]) {
  imported.clear();
  pendingImports = pieces.filter(
    (piece) => poseProfileIssues(piece, true).length > 0,
  );
  for (const piece of pieces) {
    byId.set(piece.id, piece);
    if (!poseProfileIssues(piece, true).length) imported.set(piece.id, piece);
  }
  snapshot = [...shopGarments, ...imported.values()];
  for (const listener of listeners) listener();
}
export function subscribeAvatarCatalog(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function avatarGarment(id: string): Garment {
  const piece = byId.get(id);
  if (!piece) throw new Error(`Unknown avatar garment: ${id}`);
  return piece;
}
