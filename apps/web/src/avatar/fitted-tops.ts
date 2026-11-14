import manifest from "../../../../public/assets/avatar/capsule-hauts-ajustes-v1/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

const root = "/assets/avatar/capsule-hauts-ajustes-v1";

/** Fitted tops cut from the mannequin by scripts/prepare-fitted-tops.ts. */
export const FITTED_TOP_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({ id, name, price, crop, base, tone, details }) => ({
    id: `fashion.fitted-${id}`,
    name,
    price,
    slot: "top",
    crop: [crop[0], crop[1], crop[2], crop[3]],
    coverage: [],
    coverageFromArt: true,
    bodyMask: `${root}/${id}-coverage.png`,
    underwearCut: "strapless",
    pattern: {
      id: manifest.pattern,
      bodySha256: manifest.bodySha256,
      cut: `redrawn:fitted-${id}`,
    },
    colorable: true,
    poseProfile: {
      ...stationaryPoseProfile(),
      fits: {
        front: { kind: "shared" },
        "hand-on-hip": { kind: "unavailable" },
        "heart-hands": { kind: "unavailable" },
      },
    },
    art: {
      kind: "image",
      front: `${root}/${id}.png`,
      colorMasks: {
        main: `${root}/${id}-mask.png`,
        ...(details ? { protected: `${root}/${id}-protected.png` } : {}),
        mainBase: base,
        detailBase: "#808080",
        mainTone: tone,
        shading: "material",
      },
    },
  }),
);
