import bottoms from "../../../../public/assets/avatar/capsule-ville-v2/index.json";
import accessories from "../../../../public/assets/avatar/capsule-ville-v2/accessories.json";
import type { AvatarSlot, Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

const root = "/assets/avatar/capsule-ville-v2";
const frontOnly = {
  ...stationaryPoseProfile(),
  fits: {
    front: { kind: "shared" },
    "hand-on-hip": { kind: "unavailable" },
    "heart-hands": { kind: "unavailable" },
  },
} as const;

const pending = new Set([
  "short-02", "short-03", "skirt-07", "skirt-08",
  "accessory-03", "accessory-04", "accessory-05", "accessory-06",
]);

export const CITY_CAPSULE_GARMENTS: readonly Garment[] = [
  ...bottoms.pieces.map((piece): Garment => {
    const stem = `${root}/${piece.id}`;
    return {
      id: `fashion.ville-${piece.id}`,
      name: piece.name,
      price: piece.price,
      slot: "bottom",
      crop: [piece.crop[0], piece.crop[1], piece.crop[2], piece.crop[3]],
      coverage: [],
      bodyMask: `${stem}-coverage.png`,
      underwearCut: "low-rise",
      tuckedTopRegion: piece.tuckedTopRegion,
      colorable: true,
      pattern: { id: bottoms.pattern, bodySha256: bottoms.bodySha256, cut: `redrawn:ville-${piece.id}` },
      poseProfile: frontOnly,
      art: {
        kind: "image",
        front: `${stem}.png`,
        colorMasks: {
          main: `${stem}-mask.png`,
          protected: `${stem}-protected.png`,
          mainBase: "#808080",
          detailBase: "#808080",
          shading: "material",
          mainTone: piece.tone,
        },
      },
    };
  }),
  ...accessories.filter(({ id }) => !pending.has(id)).map((piece): Garment => {
    const stem = `${root}/${piece.id}`;
    return {
      id: `fashion.ville-${piece.id}`,
      name: piece.name,
      price: piece.price,
      slot: piece.slot as AvatarSlot,
      crop: [piece.crop[0], piece.crop[1], piece.crop[2], piece.crop[3]],
      coverage: [],
      colorable: Boolean(piece.tone),
      pattern: { id: bottoms.pattern, bodySha256: bottoms.bodySha256, cut: `redrawn:ville-${piece.id}` },
      poseProfile: frontOnly,
      art: {
        kind: "image",
        front: `${stem}.png`,
        colorMasks: piece.tone ? {
          main: `${stem}-mask.png`,
          mainBase: "#808080",
          detailBase: "#808080",
          shading: "material",
          mainTone: piece.tone,
        } : undefined,
      },
    };
  }),
];
