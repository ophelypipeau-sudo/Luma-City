import { DOLL_PATTERN } from "../../../../packages/domain/src/avatar-pattern";
import type { AvatarSlot, Garment } from "./catalog";
import type { AvatarLayers } from "./model";
import {
  stationaryPoseProfile,
  type GarmentPoseProfile,
} from "./pose-wardrobe";

const root = "/assets/avatar/minuit-polaire-v1";
const polarId = (name: string) => `fashion.minuit-polaire-${name}`;
const furBase = "#dbe2f1";
const satinBase = "#c9d0e1";

function sleeveFit(pose: "hand-on-hip" | "heart-hands") {
  const path = `${root}/haut-${pose}`;
  return {
    kind: "sleeves",
    replaceTop: true,
    bareShoulders: true,
    sleeves: {
      front: `${path}.png`,
      main: `${path}-mask.png`,
      detail: `${path}-detail-mask.png`,
    },
  } as const;
}
const topProfile: GarmentPoseProfile = {
  ...stationaryPoseProfile(),
  fits: {
    front: { kind: "shared" },
    "hand-on-hip": sleeveFit("hand-on-hip"),
    "heart-hands": sleeveFit("heart-hands"),
  },
};

function polarPiece(
  key: string,
  label: string,
  slot: AvatarSlot,
  crop: Garment["crop"],
  price: number,
  base: string,
  options: Partial<Garment> = {},
): Garment {
  const path = `${root}/${key}`;
  return {
    id: polarId(key),
    name: `${label} · Minuit polaire`,
    slot,
    crop,
    price,
    coverage: [],
    coverageFromArt: true,
    colorable: true,
    poseProfile: stationaryPoseProfile(),
    pattern: {
      id: DOLL_PATTERN.id,
      bodySha256: DOLL_PATTERN.bodySha256,
      cut: `redrawn:minuit-polaire-${key}`,
    },
    art: {
      kind: "image",
      front: `${path}.png`,
      colorMasks: {
        main: `${path}-mask.png`,
        mainBase: base,
        detailBase: furBase,
        ...(slot === "top" ? { detail: `${path}-detail-mask.png` } : {}),
        shading: "material",
      },
    },
    ...options,
  };
}
export const POLAR_GARMENTS = [
  polarPiece(
    "haut",
    "Corset en satin givré",
    "top",
    [129, 367, 628, 488],
    1050,
    satinBase,
    {
      underwearCut: "strapless",
      poseProfile: topProfile,
      secondaryColor: {
        label: "Fourrure du col",
        defaultColor: furBase,
        mode: "light-panel",
      },
    },
  ),
  polarPiece(
    "short",
    "Short taille haute à fermoir lune",
    "bottom",
    [249, 674, 389, 227],
    600,
    satinBase,
  ),
  polarPiece(
    "guetres",
    "Guêtres en maille glacier",
    "legwear",
    [270, 1350, 343, 301],
    450,
    "#d8dfed",
    {
      behindBottom: true,
    },
  ),
  polarPiece(
    "escarpins",
    "Escarpins à liseré argenté",
    "shoes",
    [280, 1605, 323, 158],
    750,
    "#e5e7ee",
    {
      bodyMask: "/assets/avatar/prune-fumee-v1/escarpins-coverage.png",
      behindBottom: true,
    },
  ),
] as const;

export const polarLook: AvatarLayers = {
  top: polarId("haut"),
  bottom: polarId("short"),
  legwear: polarId("guetres"),
  shoes: polarId("escarpins"),
  hair: "fashion.winter-snow-hair",
  headwear: "fashion.winter-snow-hat",
  necklace: "fashion.winter-star-pearls",
  bag: "fashion.winter-snow-bag",
};
