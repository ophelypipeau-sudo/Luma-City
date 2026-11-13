import type { Garment } from "./catalog";
import type { AvatarLayers } from "./model";

export const ROSE_LAYERS: AvatarLayers = {
  top: "fashion.rose-bow-camisole",
  bottom: "fashion.rose-dragon-cargo",
  shoes: "fashion.white-platform-sneakers",
};

/** Same fixed mannequin, three extra pieces. No hair or hands from the reference. */
export const ROSE_GARMENTS: readonly Garment[] = [
  {
    id: "fashion.rose-bow-camisole",
    secondaryColor: {
      label: "Bordures et nœud",
      defaultColor: "#202024",
      mode: "dark",
    },
    name: "Caraco nœud noir",
    slot: "top",
    colorable: true,
    crop: [290, 330, 310, 300],
    frontPaths: [
      {
        d: "M347 342H365C362 375 361 402 369 432H335C343 402 344 371 347 342Z",
        fill: "#202024",
      },
      {
        d: "M524 342H542C543 375 550 411 554 432H523C532 400 526 366 524 342Z",
        fill: "#202024",
      },
    ],
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: "/assets/avatar/rose-v1/top.png",
      source: { x: -33, width: 953, height: 1651 },
      sampleStep: 4,
      widthStops: [
        { y: 0, scaleX: 0.72 },
        { y: 450, scaleX: 0.72 },
        { y: 560, scaleX: 0.8 },
        { y: 650, scaleX: 0.82 },
        { y: 720, scaleX: 0.74 },
        { y: 1774, scaleX: 0.74 },
      ],
      bands: [
        { sourceY: 0, sourceHeight: 340, y: 0, height: 340 },
        { sourceY: 340, sourceHeight: 1434, y: 340, height: 1434 * 0.66 },
      ],
    },
  },
  {
    id: "fashion.rose-dragon-cargo",
    secondaryColor: {
      label: "Motif et détails foncés",
      defaultColor: "#352332",
      mode: "dark",
    },
    colorable: true,
    name: "Cargo rose Dragon",
    beltFit: { scaleX: 0.97, offsetY: -6 },
    slot: "bottom",
    crop: [170, 660, 550, 1080],
    coverage: [],
    coverageFromArt: true,
    art: { kind: "image", front: "/assets/avatar/rose-v1/cargo.png" },
  },
  {
    id: "fashion.white-platform-sneakers",
    colorable: true,
    name: "Baskets plateforme blanches",
    slot: "shoes",
    behindBottom: true,
    crop: [250, 1580, 390, 190],
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: "/assets/avatar/rose-v1/sneakers.png",
      source: { x: -33, width: 953, height: 1651 },
      scaleX: 0.86,
      bands: [{ sourceY: 0, sourceHeight: 1774, y: 117, height: 1774 }],
      // This PNG includes the tongues and laces, which must cover the instep.
      // A horizontal rear split exposed rectangular pieces of leg over them.
    },
  },
];
