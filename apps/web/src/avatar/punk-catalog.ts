import type { Garment, AvatarSlot } from "./catalog";
import { DOLL_PATTERN } from "../../../../packages/domain/src/avatar-pattern";
import {
  PUNK_CUTS,
  PUNK_COLORS,
  PUNK_LAYERS,
  type PunkCut,
} from "../../../../packages/domain/src/punk-pattern";
export { PUNK_LAYERS };
const info: Record<
  PunkCut,
  { name: string; slot: AvatarSlot; price: number; two?: boolean }
> = {
  "punk-polo": {
    name: "Polo Éclipse rose",
    slot: "top",
    price: 700,
    two: true,
  },
  "punk-skirt": {
    name: "Jupe plissée Tartan rose",
    slot: "bottom",
    price: 650,
    two: true,
  },
  "punk-tie": {
    name: "Cravate Tartan rose",
    slot: "tie",
    price: 200,
    two: true,
  },
  "punk-belt": { name: "Ceinture Boucle acier", slot: "belt", price: 250 },
  "punk-choker": {
    name: "Ras-du-cou Clous et chaîne",
    slot: "necklace",
    price: 250,
  },
  "punk-hoops": { name: "Créoles Éclipse", slot: "earrings", price: 200 },
  "punk-waves": {
    name: "Ondulations Éclipse et mèches roses",
    slot: "hair",
    price: 900,
    two: true,
  },
  "punk-fishnets": {
    name: "Collants Résille fine",
    slot: "legwear",
    price: 300,
  },
  "punk-boots": { name: "Bottes Éclipse", slot: "shoes", price: 750 },
};
export const PUNK_GARMENTS: readonly Garment[] = PUNK_CUTS.map((cut) => {
  const m = info[cut],
    c = PUNK_COLORS[cut],
    top = m.slot === "top";
  return {
    id: `fashion.textile-${cut}`,
    name: m.name,
    slot: m.slot,
    price: m.price,
    colorable: true,
    art: {
      kind: "vector",
      drawing: top ? "tops" : m.slot === "shoes" ? "shoes" : "bottoms",
      textile: cut,
    },
    pattern: {
      id: DOLL_PATTERN.id,
      bodySha256: DOLL_PATTERN.bodySha256,
      cut: `textile:${cut}`,
    },
    poseProfile: {
      body: "fashion-user-hands-v2",
      canvas: [887, 1774],
      reviewed: true,
      fits: {
        front: { kind: "shared" },
        "hand-on-hip": top
          ? { kind: "procedural", replaceTop: true }
          : { kind: "shared" },
        "heart-hands": top
          ? { kind: "procedural", replaceTop: true }
          : { kind: "shared" },
      },
    },
    crop: c.crop,
    coverage: [],
    coverageFromArt: ["top", "bottom", "shoes"].includes(m.slot),
    ...(m.two
      ? {
          secondaryColor: {
            label: c.label,
            defaultColor: c.detail,
            mode: "light-panel" as const,
          },
        }
      : {}),
    ...(m.slot === "bottom"
      ? {
          underwearCut: "low-rise" as const,
          beltFit: { scaleX: 1, offsetY: 0 },
        }
      : {}),
    ...(m.slot === "legwear" ? { behindBottom: true } : {}),
    ...(m.slot === "shoes"
      ? {
          bodyMask: "/assets/avatar/redrawn-v1/closed-shoes-body-mask.png",
          behindBottom: false,
        }
      : {}),
  };
});
