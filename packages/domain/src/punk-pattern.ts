import type { Pose } from "./avatar-pattern";
export const PUNK_CUTS = [
  "punk-polo",
  "punk-skirt",
  "punk-tie",
  "punk-belt",
  "punk-choker",
  "punk-hoops",
  "punk-waves",
  "punk-fishnets",
  "punk-boots",
] as const;
export type PunkCut = (typeof PUNK_CUTS)[number];
export const isPunkCut = (cut: string): cut is PunkCut =>
  (PUNK_CUTS as readonly string[]).includes(cut);
export const PUNK_SWATCHES = [
  { name: "Framboise", hex: "#b52f65" },
  { name: "Prune", hex: "#684878" },
  { name: "Saphir", hex: "#365da5" },
  { name: "Jade", hex: "#298577" },
  { name: "Ivoire", hex: "#f0dfc4" },
] as const;
export const PUNK_COLORS: Record<
  PunkCut,
  {
    main: string;
    detail: string;
    label: string;
    crop: readonly [number, number, number, number];
  }
> = {
  "punk-polo": {
    main: "#191a20",
    detail: "#d55a9e",
    label: "Motifs roses",
    crop: [205, 315, 480, 355],
  },
  "punk-skirt": {
    main: "#c25391",
    detail: "#242027",
    label: "Carreaux sombres",
    crop: [205, 685, 480, 350],
  },
  "punk-tie": {
    main: "#d269aa",
    detail: "#302533",
    label: "Carreaux sombres",
    crop: [405, 370, 85, 340],
  },
  "punk-belt": {
    main: "#202024",
    detail: "#bfc0c8",
    label: "Boucle",
    crop: [275, 692, 345, 72],
  },
  "punk-choker": {
    main: "#1c1b20",
    detail: "#c6c8cc",
    label: "Métal",
    crop: [391, 297, 110, 60],
  },
  "punk-hoops": {
    main: "#c1c4ce",
    detail: "#ffffff",
    label: "Métal",
    crop: [325, 173, 235, 115],
  },
  "punk-waves": {
    main: "#202027",
    detail: "#c54b8b",
    label: "Mèches roses",
    crop: [215, 12, 460, 650],
  },
  "punk-fishnets": {
    main: "#252128",
    detail: "#252128",
    label: "Résille",
    crop: [265, 945, 365, 740],
  },
  "punk-boots": {
    main: "#202027",
    detail: "#aeb0bd",
    label: "Métal",
    crop: [264, 1280, 370, 490],
  },
};
export function punkPoloSleeves(pose: Pose) {
  const left = "M313 346Q266 339 245 386L224 470Q266 494 313 490L346 405Z";
  const hip = "M573 346Q614 338 642 377L690 445Q669 480 624 492L555 412Z";
  const heart = "M310 345Q269 339 247 370L222 468Q264 491 301 474L338 392Z";
  return [
    { d: pose === "heart-hands" ? heart : left, mirror: false },
    {
      d: pose === "hand-on-hip" ? hip : pose === "heart-hands" ? heart : left,
      mirror: pose !== "hand-on-hip",
    },
  ];
}
export const PUNK_LAYERS = {
  top: "fashion.textile-punk-polo",
  bottom: "fashion.textile-punk-skirt",
  shoes: "fashion.textile-punk-boots",
  tie: "fashion.textile-punk-tie",
  belt: "fashion.textile-punk-belt",
  necklace: "fashion.textile-punk-choker",
  earrings: "fashion.textile-punk-hoops",
  hair: "fashion.textile-punk-waves",
  legwear: "fashion.textile-punk-fishnets",
} as const;
