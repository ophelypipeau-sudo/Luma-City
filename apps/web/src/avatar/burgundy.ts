import type { Garment } from "./catalog";
import type { AvatarLayers } from "./model";
export const BURGUNDY_LAYERS: AvatarLayers = {
  top: "fashion.burgundy-fold-sweater",
  bottom: "fashion.midnight-pleated-skirt",
  shoes: "fashion.midnight-loafers-socks",
};
const path = "/assets/avatar/burgundy-v2";
export const BURGUNDY_GARMENTS: readonly Garment[] = [
  {
    id: BURGUNDY_LAYERS.top!,
    name: "Pull bordeaux à revers",
    slot: "top",
    price: 700,
    colorable: true,
    underwearCut: "strapless",
    crop: [100, 325, 690, 530],
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: `/assets/avatar/burgundy-v4/sweater.png`,
      colorMasks: {
        main: `/assets/avatar/burgundy-v4/sweater-mask1.png`,
        mainBase: "#642330",
        detailBase: "#242426",
      },
    },
  },
  {
    id: BURGUNDY_LAYERS.bottom!,
    name: "Jupe plissée minuit",
    beltFit: { scaleX: 0.93, offsetY: -10 },
    slot: "bottom",
    price: 450,
    colorable: true,
    crop: [210, 675, 470, 360],
    coverage: [],
    coverageFromArt: true,
    art: {
      kind: "image",
      front: `${path}/skirt.png`,
      colorMasks: {
        main: `${path}/skirt-mask1.png`,
        mainBase: "#262529",
        detailBase: "#242426",
      },
    },
  },
  {
    id: BURGUNDY_LAYERS.shoes!,
    name: "Mocassins et chaussettes noires",
    slot: "shoes",
    price: 650,
    colorable: true,
    behindBottom: true,
    crop: [250, 1410, 380, 365],
    coverage: [],
    coverageFromArt: true,
    secondaryColor: {
      label: "Mocassins",
      defaultColor: "#202022",
      mode: "dark",
    },
    art: {
      kind: "image",
      front: `${path}/shoes.png`,
      colorMasks: {
        main: `${path}/shoes-mask1.png`,
        detail: `${path}/shoes-mask2.png`,
        mainBase: "#28282b",
        detailBase: "#202022",
      },
    },
  },
];
