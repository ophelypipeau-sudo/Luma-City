import { DOLL_PATTERN } from "../../../../packages/domain/src/avatar-pattern";
import type { Garment } from "./catalog";
import { sleevelessPoseProfile, stationaryPoseProfile } from "./pose-wardrobe";
import { SHOP_FABRIC_TONES } from "./shop-fabric-tones";

const root = "/assets/avatar/capsule-mode-v2";
export const NOCTURNE_CUFF_RIMS = {
  "heart-hands":
    "M307 450Q318 462 336 470L331 487Q312 480 298 466Z M580 450Q569 462 551 470L556 487Q575 480 589 466Z",
  "hand-on-hip": "M610 675Q623 679 641 695L648 697L655 687Q637 669 626 664Z",
} as const;
const designs = [
  {
    cut: "nocturne",
    name: "Nocturne",
    price: 900,
    crop: [130, 332, 623, 518],
    mainBase: "#171721",
  },
  {
    cut: "cerise",
    name: "Cerise",
    price: 650,
    crop: [245, 321, 395, 355],
    mainBase: "#8c1d2d",
  },
  {
    cut: "champagne",
    name: "Champagne",
    price: 850,
    crop: [293, 325, 302, 426],
    mainBase: "#b08a65",
  },
] as const;

export const CAPSULE_MODE_GARMENTS: readonly Garment[] = designs.map(
  (design) => {
    const { cut, name, price, crop, mainBase } = design;
    const stem = `${root}/${cut === "champagne" ? "champagne-arrondi" : cut}`;
    const detailBase = "#808080";
    const masks = (path: string) => ({
      main: `${path}${cut === "nocturne" ? "-buste" : ""}-mask.png`,
      mainLight: cut === "nocturne" ? `${path}-buste-relief.png` : undefined,
      protected: cut === "nocturne" ? `${path}-buste-protected.png` : undefined,
      mainBase,
      detailBase,
      mainTone: SHOP_FABRIC_TONES[cut],
    });
    const posed = (pose: "hand-on-hip" | "heart-hands") => {
      const path = `${stem}-${pose}`;
      return {
        kind: "sleeves" as const,
        shortSleeves: cut === "cerise",
        canonicalSleeveUnderlay:
          cut === "nocturne" ? (true as const) : undefined,
        replaceTop: true,
        sleeves: {
          front: `${path}.png`,
          cuffRim:
            cut === "nocturne" ? NOCTURNE_CUFF_RIMS[pose] : (false as const),
          hipHandOffset: cut === "nocturne" ? ([0, 0] as const) : undefined,
          ...masks(path),
        },
      };
    };
    return {
      id: `fashion.capsule-mode-${cut}`,
      name,
      price,
      slot: "top",
      crop,
      coverage: [],
      coverageFromArt: cut !== "nocturne",
      bodyMask: cut === "nocturne" ? `${stem}-coverage.png` : undefined,
      underwearCut: "strapless",
      colorable: true,
      pattern: {
        id: DOLL_PATTERN.id,
        bodySha256: DOLL_PATTERN.bodySha256,
        cut: `redrawn:capsule-mode-${cut}`,
      },
      poseProfile:
        cut === "champagne"
          ? sleevelessPoseProfile()
          : {
              ...stationaryPoseProfile(),
              fits: {
                front: { kind: "shared" },
                "hand-on-hip": posed("hand-on-hip"),
                "heart-hands": posed("heart-hands"),
              },
            },
      art: {
        kind: "image",
        front: `${stem}.png`,
        colorMasks: { ...masks(stem), shading: "material" },
      },
    };
  },
);
