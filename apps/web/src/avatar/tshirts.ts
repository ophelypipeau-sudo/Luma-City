import { DOLL_PATTERN } from "../../../../packages/domain/src/avatar-pattern";
import type { Garment } from "./catalog";
import { stationaryPoseProfile, type GarmentPoseFit } from "./pose-wardrobe";

export const TSHIRT_DESIGNS = [
  { cut: "rose-poudre", name: "Ruban poudré", base: "#ca91a3", price: 550 },
  { cut: "sport-prune", name: "Club prune", base: "#53304d", price: 600, accent: "#e6d4bb", label: "Manches" },
  { cut: "cerises", name: "Deux cerises", base: "#e3d2b3", price: 550 },
  { cut: "nuit-etoilee", name: "Nuit étoilée", base: "#263451", price: 700 },
  { cut: "pistache", name: "Polo pistache", base: "#9aab7d", price: 650 },
  { cut: "peche", name: "Pêche satinée", base: "#eeb19a", price: 650 },
  { cut: "espresso", name: "Espresso", base: "#614033", price: 650 },
  { cut: "rayures", name: "Rayures lilas", base: "#ad92c5", price: 550, accent: "#e8dcca", label: "Rayures claires" },
  { cut: "bleu-ciel", name: "Bleu de ciel", base: "#89adcb", price: 600 },
  { cut: "framboise", name: "Fleur framboise", base: "#9d1d48", price: 600 },
] as const satisfies readonly {
  cut: string;
  name: string;
  base: string;
  price: number;
  accent?: string;
  label?: string;
}[];

const root = "/assets/avatar/tshirts-v1/fitted";
export const TSHIRT_GARMENTS: readonly Garment[] = TSHIRT_DESIGNS.map((design) => {
  const { cut, name, base, price } = design;
  const detailBase = "accent" in design ? design.accent : "#808080";
  const hasDetail = "accent" in design;
  const masks = (stem: string) => ({
    main: `${stem}-mask.png`,
    detail: hasDetail ? `${stem}-detail-mask.png` : undefined,
    mainBase: base,
    detailBase,
  });
  const posed = (pose: "hand-on-hip" | "heart-hands"): GarmentPoseFit => {
    const stem = `${root}/${cut}-${pose}`;
    return {
      kind: "sleeves",
      replaceTop: true,
      shortSleeves: true,
      sleeves: { front: `${stem}.png`, cuffRim: false, ...masks(stem) },
    };
  };
  const stem = `${root}/${cut}-front`;
  return {
    id: `fashion.tee-${cut}`,
    name,
    price,
    slot: "top",
    crop: [205, 307, 477, 531],
    colorable: true,
    coverage: [],
    coverageFromArt: true,
    underwearCut: "strapless",
    secondaryColor: hasDetail ? {
      label: design.label,
      defaultColor: detailBase,
      mode: "light-panel",
    } : undefined,
    pattern: {
      id: DOLL_PATTERN.id,
      bodySha256: DOLL_PATTERN.bodySha256,
      cut: `redrawn:tee-${cut}`,
    },
    poseProfile: {
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
});
