import manifest from "../../../../public/assets/avatar/capsule-robes-iris-v1/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

export const IRIS_DRESSES_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({ id, name, price, crop: [x, y, width, height], tone }) => {
    const stem = `/assets/avatar/capsule-robes-iris-v1/${id}`;
    return {
      id: `fashion.iris-dresses-${id}`,
      name,
      price,
      slot: "top",
      isDress: true,
      underwearCut: "strapless",
      crop: [x, y, width, height],
      coverage: [],
      bodyMask: `${stem}-coverage.png`,

      colorable: true,
      pattern: {
        id: manifest.pattern,
        bodySha256: manifest.bodySha256,
        cut: `redrawn:iris-dresses-${id}`,
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
          protected: ["comete", "terrasse"].includes(id)
            ? `${stem}-protected.png`
            : undefined,
          mainBase: "#808080",
          detailBase: "#808080",
          mainTone: tone,
          shading: "material",
        },
      },
    };
  },
);
