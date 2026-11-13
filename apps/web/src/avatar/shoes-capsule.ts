import manifest from "../../../../public/assets/avatar/capsule-chaussures-v1/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

const root = "/assets/avatar/capsule-chaussures-v1";
export const SHOES_CAPSULE_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({ id, name, price, crop, base, tone }) => ({
    id: `fashion.shoes-${id}`,
    name, price, slot: "shoes", behindBottom: true,
    crop: [crop[0], crop[1], crop[2], crop[3]],
    coverage: [], coverageFromArt: true,
    bodyMask: `${root}/${id}-coverage.png`,
    pattern: { id: manifest.pattern, bodySha256: manifest.bodySha256, cut: `redrawn:shoes-${id}` },
    colorable: true,
    poseProfile: { ...stationaryPoseProfile(), fits: {
      front: { kind: "shared" },
      "hand-on-hip": { kind: "unavailable" },
      "heart-hands": { kind: "unavailable" },
    } },
    art: { kind: "image", front: `${root}/${id}.png`, colorMasks: {
      main: `${root}/${id}-mask.png`,
      protected: `${root}/${id}-protected.png`,
      mainBase: base, detailBase: "#808080", mainTone: tone, shading: "material",
    } },
  }),
);
