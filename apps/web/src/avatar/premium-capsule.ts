import manifest from "../../../../docs/capsule-premium-v1/calques/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

const root = "/assets/avatar/capsule-premium-v1";
const designs = {
  "01-velvet": ["Velvet", 900, [298, 335, 452, 491]],
  "02-venus": ["Venus", 750, [305, 335, 277, 240]],
  "03-eclat": ["Éclat", 850, [303, 422, 280, 290]],
  "04-minuit": ["Minuit", 900, [227, 285, 429, 442]],
  "05-rosalie": ["Rosalie", 900, [135, 384, 619, 450]],
  "06-nova": ["Nova", 850, [247, 290, 338, 330]],
  "07-ambre": ["Ambre", 650, [248, 336, 386, 372]],
  "08-seraphine": ["Séraphine", 850, [303, 284, 279, 442]],
  "10-alba": ["Alba", 850, [241, 264, 399, 504]],
} as const;

export const PREMIUM_CAPSULE_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({ id, mainBase, mainTone, poses }) => {
    const [name, price, crop] = designs[id as keyof typeof designs];
    const art = (pose: keyof typeof poses) => {
      const { art, main, protected: protection } = poses[pose];
      return {
        front: `${root}/${art}`,
        main: `${root}/${main}`,
        protected: `${root}/${protection}`,
        mainBase,
        detailBase: "#808080",
      };
    };
    const { front, ...colorMasks } = art("front");
    return {
      id: `fashion.premium-${id.slice(3)}`,
      name,
      price,
      slot: "top",
      crop,
      coverage: [],
      underwearCut: "strapless",
      colorable: true,
      fittingBody: {
        front: `${root}/atelier-face.png`,
        "hand-on-hip": `${root}/atelier-hanche.png`,
      },
      fittingHipHand: `${root}/atelier-main-hanche.png`,
      pattern: {
        id: manifest.pattern,
        bodySha256: manifest.bodySha256,
        cut: `redrawn:premium-${id}`,
      },
      poseProfile: {
        ...stationaryPoseProfile(),
        fits: {
          front: { kind: "shared" },
          "hand-on-hip": {
            kind: "sleeves",
            replaceTop: true,
            sleeves: { ...art("hand-on-hip"), cuffRim: false },
          },
          "heart-hands": { kind: "unavailable" },
        },
      },
      art: {
        kind: "image",
        front,
        colorMasks: { ...colorMasks, mainTone, shading: "material" },
      },
    };
  },
);
