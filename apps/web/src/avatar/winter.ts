import type { Garment, AvatarSlot } from "./catalog";
import type { AvatarLayers } from "./model";
import { DOLL_PATTERN } from "../../../../packages/domain/src/avatar-pattern";
import {
  stationaryPoseProfile,
  sleevelessPoseProfile,
  type GarmentPoseProfile,
} from "./pose-wardrobe";
const ROOT = "/assets/avatar/winter-v2";
const id = (name: string) => `fashion.winter-${name}`;
function posed(
  kind: string,
  bareShoulders = false,
  detail = false,
): GarmentPoseProfile {
  const sleeves = (pose: string) => ({
    kind: "sleeves" as const,
    replaceTop: true,
    bareShoulders,
    sleeves: {
      front: `${ROOT}/${kind}-${pose}.png`,
      main: `${ROOT}/${kind}-${pose}-mask.png`,
      ...(detail ? { detail: `${ROOT}/${kind}-${pose}-detail-mask.png` } : {}),
    },
  });
  return {
    ...stationaryPoseProfile(),
    fits: {
      front: { kind: "shared" },
      "hand-on-hip": sleeves("hip"),
      "heart-hands": sleeves("heart"),
    },
  };
}
function item(
  name: string,
  label: string,
  slot: AvatarSlot,
  crop: readonly [number, number, number, number],
  price: number,
  base: string,
  options: Partial<Garment> & {
    detail?: { label: string; color: string };
  } = {},
): Garment {
  const { detail, ...extra } = options;
  return {
    id: id(name),
    name: label,
    slot,
    crop,
    price,
    colorable: true,
    coverage: [],
    coverageFromArt: [
      "top",
      "bottom",
      "shoes",
      "outerwear",
      "legwear",
    ].includes(slot),
    poseProfile: stationaryPoseProfile(),
    pattern: {
      id: DOLL_PATTERN.id,
      bodySha256: DOLL_PATTERN.bodySha256,
      cut: name,
    },
    art: {
      kind: "image",
      front: `${ROOT}/${name}.png`,
      colorMasks: {
        main: `${ROOT}/${name}-mask.png`,
        mainBase: base,
        detailBase: detail?.color ?? "#333333",
        ...(detail ? { detail: `${ROOT}/${name}-detail-mask.png` } : {}),
        shading: "material",
      },
    },
    ...(detail
      ? {
          secondaryColor: {
            label: detail.label,
            defaultColor: detail.color,
            mode: "light-panel" as const,
          },
        }
      : {}),
    ...extra,
  };
}
function wig(
  name: string,
  label: string,
  base: string,
  decorations = false,
): Garment {
  const piece = item(
    `${name}-hair`,
    label,
    "hair",
    [170, 0, 550, 690],
    950,
    base,
    {
      coverageFromArt: false,
      ...(decorations
        ? { detail: { label: "Fleurs ou ruban intégrés", color: "#e8aac9" } }
        : {}),
    },
  );
  return {
    ...piece,
    art: {
      ...piece.art,
      kind: "image",
      front: `${ROOT}/${name}-hair-front.png`,
      back: `${ROOT}/${name}-hair-back.png`,
    },
  } as Garment;
}
const foot = (name: string) => ({ bodyMask: `${ROOT}/${name}-coverage.png` });
export const WINTER_GARMENTS: readonly Garment[] = [
  item(
    "pink-jacket",
    "Veste Étoile givrée",
    "top",
    [75, 265, 735, 620],
    1100,
    "#eee6e8",
    {
      poseProfile: posed("pink", false, true),
      underwearCut: "strapless",
      detail: { label: "Fourrure", color: "#efb4d0" },
    },
  ),
  item(
    "pink-skirt",
    "Mini denim Fleurettes",
    "bottom",
    [240, 680, 400, 260],
    650,
    "#9eafc1",
    {
      beltFit: { scaleX: 0.94, offsetY: -4 },
      detail: { label: "Broderies et fleurs", color: "#dd95b9" },
    },
  ),
  item(
    "pink-pumps",
    "Escarpins Rose satin",
    "shoes",
    [240, 1630, 410, 144],
    750,
    "#df92bb",
    foot("pink-pumps"),
  ),
  item(
    "pink-warmers",
    "Guêtres Nuage rose",
    "legwear",
    [195, 1160, 495, 520],
    600,
    "#edb0d1",
  ),
  wig("pink", "Boucles Fleurettes", "#30282e", true),
  item(
    "pink-earrings",
    "Créoles Cristal rose",
    "earrings",
    [325, 205, 235, 78],
    300,
    "#d690bc",
    { coverageFromArt: false },
  ),
  item(
    "pink-bag",
    "Petit sac Denim étoilé",
    "bag",
    [555, 340, 210, 395],
    650,
    "#899db6",
    {
      coverageFromArt: false,
      detail: { label: "Ruban et bordures", color: "#e4a0bd" },
    },
  ),
  item(
    "snow-top",
    "Haut Neige tachetée",
    "top",
    [95, 335, 700, 550],
    950,
    "#e4e4e7",
    {
      poseProfile: posed("snow", true, true),
      underwearCut: "strapless",
      detail: { label: "Fourrure du col", color: "#f0f0f2" },
    },
  ),
  item(
    "snow-shorts",
    "Short Neige",
    "bottom",
    [240, 680, 410, 225],
    550,
    "#e7e7ea",
    { beltFit: { scaleX: 0.98, offsetY: 0 } },
  ),
  item(
    "snow-pumps",
    "Escarpins Perle",
    "shoes",
    [240, 1625, 410, 149],
    700,
    "#e8e7e8",
    foot("snow-pumps"),
  ),
  item(
    "snow-warmers",
    "Guêtres Maille perle",
    "legwear",
    [240, 1300, 410, 360],
    450,
    "#e5e3e4",
  ),
  wig("snow", "Longue frange Bleu nuit", "#202837"),
  item(
    "snow-hat",
    "Toque Nuage blanc",
    "headwear",
    [275, 0, 340, 180],
    550,
    "#ecebed",
    { coverageFromArt: false },
  ),
  item(
    "star-pearls",
    "Collier Perles étoilées",
    "necklace",
    [370, 315, 150, 100],
    400,
    "#d4d4d8",
    { coverageFromArt: false },
  ),
  item(
    "pearl-studs",
    "Puces Perle",
    "earrings",
    [340, 195, 205, 65],
    200,
    "#d9d8dc",
    { coverageFromArt: false },
  ),
  item(
    "snow-belt",
    "Ceinture Étoile argentée",
    "belt",
    [260, 685, 365, 125],
    400,
    "#e1dfe2",
    { coverageFromArt: false },
  ),
  item(
    "snow-bag",
    "Petit sac Jacquard perle",
    "bag",
    [550, 340, 220, 400],
    650,
    "#e4ddd3",
    { coverageFromArt: false },
  ),
  item(
    "ivory-dress",
    "Robe Maille ivoire",
    "top",
    [90, 265, 710, 735],
    1350,
    "#e5d8c5",
    { poseProfile: posed("ivory"), isDress: true },
  ),
  item(
    "ivory-boots",
    "Bottes Ivoire doux",
    "shoes",
    [235, 1180, 420, 594],
    850,
    "#deceba",
    foot("ivory-boots"),
  ),
  wig("ivory", "Carré Ondes noires", "#2b292a"),
  item(
    "ivory-beret",
    "Béret Ivoire doux",
    "headwear",
    [285, 0, 330, 185],
    450,
    "#e1d3bf",
    { coverageFromArt: false },
  ),
  item(
    "pearl-drops",
    "Boucles Perles suspendues",
    "earrings",
    [330, 195, 220, 90],
    300,
    "#dedbda",
    { coverageFromArt: false },
  ),
  item(
    "ivory-handbag",
    "Petit sac Matelassé ivoire",
    "bag",
    [35, 910, 220, 235],
    650,
    "#e8dac7",
    {
      coverageFromArt: false,
      handCarry: {
        hand: `${ROOT}/ivory-grip-hand.png`,
        shoulder: `${ROOT}/ivory-bag.png`,
        shoulderMask: `${ROOT}/ivory-bag-mask.png`,
      },
    },
  ),
  item(
    "ribbon-camisole",
    "Caraco Dentelle ivoire",
    "top",
    [290, 325, 310, 440],
    500,
    "#e7ddc9",
    { poseProfile: sleevelessPoseProfile(), behindBottom: true },
  ),
  item(
    "ribbon-cardigan",
    "Cardigan Ruban rose",
    "outerwear",
    [95, 285, 700, 600],
    750,
    "#e2a2b0",
    { poseProfile: posed("ribbon") },
  ),
  item(
    "ribbon-skirt",
    "Jupe Plissée écolière",
    "bottom",
    [160, 680, 570, 345],
    550,
    "#29282b",
    {
      beltFit: { scaleX: 0.94, offsetY: -3 },
      foreground: {
        region: "M0 870H230V1010H0Z M650 870H887V1010H650Z",
        overlap: "M0 870H887V1010H0Z",
      },
    },
  ),
  item(
    "ribbon-stockings",
    "Bas Voile charbon",
    "legwear",
    [245, 1010, 400, 670],
    350,
    "#211e23",
    { coverageFromArt: false },
  ),
  item(
    "ribbon-loafers",
    "Mocassins Campus",
    "shoes",
    [240, 1590, 410, 184],
    700,
    "#29272a",
    foot("ribbon-loafers"),
  ),
  wig("ribbon", "Demi-queue Ruban rose", "#46322a", true),
  item(
    "teardrop-pearls",
    "Collier Perles et goutte",
    "necklace",
    [365, 320, 165, 125],
    400,
    "#d4d1ce",
    { coverageFromArt: false },
  ),
];
export const WINTER_LOOKS: readonly { name: string; layers: AvatarLayers }[] = [
  {
    name: "Étoile givrée",
    layers: {
      top: id("pink-jacket"),
      bottom: id("pink-skirt"),
      shoes: id("pink-pumps"),
      legwear: id("pink-warmers"),
      hair: id("pink-hair"),
      earrings: id("pink-earrings"),
      bag: id("pink-bag"),
      belt: null,
    },
  },
  {
    name: "Neige & Perles",
    layers: {
      top: id("snow-top"),
      bottom: id("snow-shorts"),
      shoes: id("snow-pumps"),
      legwear: id("snow-warmers"),
      hair: id("snow-hair"),
      headwear: id("snow-hat"),
      necklace: id("star-pearls"),
      earrings: id("pearl-studs"),
      belt: id("snow-belt"),
      bag: id("snow-bag"),
    },
  },
  {
    name: "Ivoire doux",
    layers: {
      top: id("ivory-dress"),
      bottom: null,
      shoes: id("ivory-boots"),
      hair: id("ivory-hair"),
      headwear: id("ivory-beret"),
      earrings: id("pearl-drops"),
      bag: id("ivory-handbag"),
      belt: null,
    },
  },
  {
    name: "Ruban rose",
    layers: {
      top: id("ribbon-camisole"),
      outerwear: id("ribbon-cardigan"),
      bottom: id("ribbon-skirt"),
      shoes: id("ribbon-loafers"),
      legwear: id("ribbon-stockings"),
      hair: id("ribbon-hair"),
      earrings: id("pearl-drops"),
      necklace: id("teardrop-pearls"),
      belt: null,
    },
  },
];
