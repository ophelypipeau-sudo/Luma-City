import manifest from "../../../../public/assets/avatar/capsule-coiffures-v1/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

const root = "/assets/avatar/capsule-coiffures-v1";
export const HAIR_CAPSULE_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({ id, name, price, crop, base, back, tone }) => ({
    id: `fashion.hair-${id}`,
    name,
    price,
    slot: "hair",
    crop: [crop[0], crop[1], crop[2], crop[3]],
    coverage: [],
    pattern: { id: manifest.pattern, bodySha256: manifest.bodySha256, cut: `redrawn:hair-${id}` },
    colorable: true,
    poseProfile: { ...stationaryPoseProfile(), fits: {
      front: { kind: "shared" },
      "hand-on-hip": { kind: "unavailable" },
      "heart-hands": { kind: "unavailable" },
    } },
    art: {
      kind: "image",
      front: `${root}/${id}.png`,
      backRegion: back,
      colorMasks: {
        main: `${root}/${id}-mask.png`,
        protected: `${root}/${id}-protected.png`,
        mainBase: base,
        detailBase: "#808080",
        mainTone: tone,
        shading: "material",
      },
    },
  }),
);
