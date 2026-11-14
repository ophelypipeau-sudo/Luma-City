import manifest from "../../../../public/assets/avatar/capsule-jupes-iris-v1/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

export const IRIS_SKIRTS_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({
    id,
    name,
    price,
    crop: [x, y, width, height],
    tone,
    tuckedTopRegion,
    lowRise,
  }) => {
    const stem = `/assets/avatar/capsule-jupes-iris-v1/${id}`;
    return {
      id: `fashion.iris-skirts-${id}`,
      name,
      price,
      slot: "bottom",
      crop: [x, y, width, height],
      coverage: [],
      bodyMask: `${stem}-coverage.png`,
      tuckedTopRegion,
      underwearCut: lowRise ? "low-rise" : undefined,
      colorable: true,
      pattern: {
        id: manifest.pattern,
        bodySha256: manifest.bodySha256,
        cut: `redrawn:iris-skirts-${id}`,
      },
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
