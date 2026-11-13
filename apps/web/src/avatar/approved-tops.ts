import { DOLL_PATTERN } from "../../../../packages/domain/src/avatar-pattern";
import type { Garment } from "./catalog";
import { sleevelessPoseProfile, stationaryPoseProfile } from "./pose-wardrobe";
import type { GarmentPoseFit } from "./pose-wardrobe";
import { SHOP_FABRIC_TONES } from "./shop-fabric-tones";

const root = "/assets/avatar/approved-tops-v1";
const pieces = [
  {
    cut: "y2k-mcbling",
    name: "Veste velours McBling",
    mainBase: "#922644",
    price: 850,
    crop: [128, 285, 630, 570],
  },
  {
    cut: "dark-feminine",
    name: "Corsage Dentelle noire",
    mainBase: "#31292f",
    price: 900,
    crop: [128, 285, 630, 570],
  },
  {
    cut: "glamour-contemporain",
    name: "Haut Satin platine",
    mainBase: "#a69a95",
    price: 850,
    crop: [290, 284, 304, 466],
  },
] as const;

export const APPROVED_TOPS: readonly Garment[] = pieces.map(
  ({ cut, name, price, crop, mainBase }) => {
    const sheer = cut === "dark-feminine";
    const sleeveless = cut === "glamour-contemporain";
    const fitted = (pose: "hand-on-hip" | "heart-hands"): GarmentPoseFit => ({
      kind: "sleeves",
      replaceTop: true,
      sheerSleeves: sheer,
      sleeves: {
        front: `${root}/${cut}-${pose}.png`,
        main: `${root}/${cut}-${pose}-mask.png`,
      },
    });
    return {
      id: `fashion.${cut}`,
      name,
      price,
      slot: cut === "y2k-mcbling" ? "outerwear" : "top",
      ...(cut === "y2k-mcbling" && { legacySlot: "top" as const }),
      crop,
      colorable: true,
      coverage: [],
      coverageFromArt: !sheer,
      bodyMask: sheer ? `${root}/${cut}-coverage.png` : undefined,
      underwearCut: "strapless",
      pattern: {
        id: DOLL_PATTERN.id,
        bodySha256: DOLL_PATTERN.bodySha256,
        cut: `redrawn:${cut}`,
      },
      poseProfile: sleeveless
        ? sleevelessPoseProfile()
        : {
            ...stationaryPoseProfile(),
            fits: {
              front: { kind: "shared" },
              "hand-on-hip": fitted("hand-on-hip"),
              "heart-hands": fitted("heart-hands"),
            },
          },
      art: {
        kind: "image",
        front: `${root}/${cut}.png`,
        colorMasks: {
          main: `${root}/${cut}-mask.png`,
          mainBase,
          detailBase: "#808080",
          shading: "material",
          mainTone: SHOP_FABRIC_TONES[cut],
        },
      },
    };
  },
);
