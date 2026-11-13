import manifest from "../../../../public/assets/avatar/capsule-coiffures-v2/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

const root = "/assets/avatar/capsule-coiffures-v2";

export const HAIR_CAPSULE_V2_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({ id, name, base, mainTone, offsetY = 0 }) => {
    const asset = (suffix: string) => `${root}/${id}-${suffix}.png`;
    return {
      id: `fashion.hair-${id}`,
      name,
      price: 850,
      slot: "hair",
      crop: [120, offsetY, 650, 600 - offsetY],
      coverage: [],
      colorable: true,
      pattern: { id: manifest.pattern, bodySha256: manifest.bodySha256, cut: `redrawn:hair-${id}` },
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
        front: asset("front"),
        back: asset("back"),
        offsetY,
        colorMasks: {
          main: asset("matiere"),
          protected: asset("protections"),
          mainBase: base,
          mainTone,
          detailBase: "#808080",
          shading: "material",
        },
      },
    };
  },
);
