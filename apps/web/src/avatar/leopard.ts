import type { Garment } from "./catalog";
import type { AvatarLayers } from "./model";
export const LEOPARD_LAYERS: AvatarLayers = {
  top: "fashion.leopard-ruched-halter",
  bottom: "fashion.medallion-flare-cargo",
  shoes: "fashion.fur-buckle-platforms",
  belt: "fashion.medallion-belt",
};
const path = "/assets/avatar/leopard-v1";
export const LEOPARD_GARMENTS: readonly Garment[] = [
  {
    id: LEOPARD_LAYERS.top!,
    name: "Léopard froncé",
    slot: "top",
    price: 550,
    colorable: true,
    underwearCut: "strapless",
    crop: [295, 310, 295, 450],
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: `${path}/top.png`,
      colorMasks: {
        main: `${path}/top-mask.png`,
        mainBase: "#a57450",
        detailBase: "#24201d",
      },
    },
  },
  {
    id: LEOPARD_LAYERS.bottom!,
    name: "Cargo évasé Médaillons",
    beltFit: { scaleX: 0.92, offsetY: -8 },
    slot: "bottom",
    price: 850,
    colorable: true,
    underwearCut: "low-rise",
    crop: [175, 690, 535, 1030],
    secondaryColor: {
      label: "Fourrure",
      defaultColor: "#9e633b",
      mode: "light-panel",
    },
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: `/assets/avatar/leopard-v4/pants.png`,
      // Fit only the reconstructed waist to the torso; keep leg volume intact.
      sampleStep: 2,
      widthStops: [
        { y: 0, scaleX: 0.83 },
        { y: 660, scaleX: 0.83 },
        { y: 680, scaleX: 0.84 },
        { y: 700, scaleX: 0.86 },
        { y: 720, scaleX: 0.88 },
        { y: 740, scaleX: 0.9 },
        { y: 760, scaleX: 0.93 },
        { y: 800, scaleX: 0.97 },
        { y: 850, scaleX: 1 },
        { y: 1774, scaleX: 1 },
      ],
      colorMasks: {
        main: `/assets/avatar/leopard-v4/pants-mask.png`,
        detail: `/assets/avatar/leopard-v2/fur-mask.png`,
        mainBase: "#39322d",
        detailBase: "#9e633b",
      },
    },
  },
  {
    id: LEOPARD_LAYERS.shoes!,
    name: "Baskets plateforme à boucles",
    slot: "shoes",
    price: 750,
    colorable: true,
    crop: [260, 1595, 375, 170],
    behindBottom: true,
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: `/assets/avatar/leopard-v3/shoes.png`,
      colorMasks: {
        main: `/assets/avatar/leopard-v3/shoes-mask.png`,
        mainBase: "#30221e",
        detailBase: "#27201b",
      },
    },
  },
  {
    id: LEOPARD_LAYERS.belt!,
    name: "Ceinture Médaillons",
    slot: "belt",
    price: 300,
    colorable: true,
    crop: [277, 697, 328, 217],
    coverage: [],
    art: {
      kind: "image",
      front: "/assets/avatar/leopard-v4/belt.png",
    },
  },
];
