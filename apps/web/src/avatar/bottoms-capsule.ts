import manifest from "../../../../public/assets/avatar/capsule-bas-v1/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

export const BOTTOMS_CAPSULE_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({ id, name, price, crop: [x, y, width, height], tone, tuckedTopRegion }) => {
    const stem = `/assets/avatar/capsule-bas-v1/${id}`;
    return {
      id: `fashion.capsule-${id}`,
      name,
      price,
      slot: "bottom",
      crop: [x, y, width, height],
      coverage: [],
      bodyMask: `${stem}-coverage.png`,
      tuckedTopRegion,
      colorable: true,
      pattern: { id: manifest.pattern, bodySha256: manifest.bodySha256, cut: `redrawn:capsule-${id}` },
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
        front: `${stem}.png`,
        colorMasks: {
          main: `${stem}-mask.png`,
          protected: `${stem}-protected.png`,
          mainBase: "#808080",
          detailBase: "#808080",
          mainTone: tone,
          shading: "material",
        },
      },
    };
  },
);
