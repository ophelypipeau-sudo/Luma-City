import { DOLL_PATTERN } from "../../../../packages/domain/src/avatar-pattern";
import type { Garment } from "./catalog";
import type { AvatarLayers } from "./model";
import { sleevelessPoseProfile, stationaryPoseProfile } from "./pose-wardrobe";
import { SHOP_FABRIC_TONES } from "./shop-fabric-tones";

const root = "/assets/avatar/prune-fumee-v1";
export const plum = "#492d40";
const pieces = [
  {
    key: "gilet",
    name: "Gilet cintré Prune fumée",
    price: 850,
    slot: "top",
    crop: [292, 327, 307, 452],
  },
  {
    key: "pantalon",
    name: "Pantalon évasé Prune fumée",
    price: 900,
    slot: "bottom",
    crop: [247, 664, 389, 1040],
  },
  {
    key: "escarpins",
    name: "Escarpins espresso · Prune fumée",
    price: 750,
    slot: "shoes",
    crop: [273, 1603, 340, 162],
  },
] as const;

export const plumLook: AvatarLayers = {
  top: "atelier.prune-fumee-gilet",
  bottom: "atelier.prune-fumee-pantalon",
  shoes: "atelier.prune-fumee-escarpins",
};

export const PLUM_GARMENTS: readonly Garment[] = pieces.map(
  ({ key, name, slot, crop, price }) => ({
    id: `atelier.prune-fumee-${key}`,
    name,
    price,
    slot,
    crop,
    coverage: [],
    coverageFromArt: true,
    bodyMask:
      slot === "shoes"
        ? `${root}/escarpins-coverage.png`
        : slot === "bottom"
          ? `${root}/pantalon-coverage.png`
          : undefined,
    behindBottom: slot === "shoes",
    pattern: {
      id: DOLL_PATTERN.id,
      bodySha256: DOLL_PATTERN.bodySha256,
      cut: `redrawn:prune-fumee-${key}`,
    },
    colorable: true,
    poseProfile:
      slot === "top" ? sleevelessPoseProfile() : stationaryPoseProfile(),
    art: {
      kind: "image",
      front: `${root}/${key}.png`,
      colorMasks: {
        main: `${root}/${key}-mask.png`,
        mainBase: slot === "shoes" ? "#4b3028" : plum,
        detailBase: "#b58b58",
        shading: "material",
        mainTone: SHOP_FABRIC_TONES[key],
      },
    },
  }),
);
