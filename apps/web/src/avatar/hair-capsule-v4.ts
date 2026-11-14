import manifest from "../../../../public/assets/avatar/capsule-coiffures-v4/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

export const HAIR_CAPSULE_V4_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({ id, name, crop: [x, y, width, height], mainTone, back }) => {
    const stem = `/assets/avatar/capsule-coiffures-v4/${id}`;
    return {
      id: `fashion.hair-v4-${id}`,
      name,
      price: 850,
      slot: "hair",
      crop: [x, y, width, height],
      coverage: [],
      colorable: true,
      pattern: {
        id: manifest.pattern,
        bodySha256: manifest.bodySha256,
        cut: `redrawn:hair-v4-${id}`,
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
        back: back ? `${stem}-back.png` : undefined,
        offsetY: -125,
        colorMasks: {
          main: `${stem}-mask.png`,
          mainBase: "#808080",
          detailBase: "#808080",
          shading: "material",
          mainTone,
        },
      },
    };
  },
);
