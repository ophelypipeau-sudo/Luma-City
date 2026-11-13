import type { FabricTone } from "../../../../packages/domain/src/atelier-color";

// Calibrated from the native dye masks of the nine articles in the boutique.
// Each posed drawing uses the same anchors as the front so the color does
// not jump on a change of pose.
export const SHOP_FABRIC_TONES = {
  nocturne: { shadow: 2, middle: 12, highlight: 52, depth: 0.19, sheen: 0.24 },
  cerise: { shadow: 22, middle: 42, highlight: 62, depth: 0.29, sheen: 0.14 },
  champagne: {
    shadow: 94,
    middle: 162,
    highlight: 233,
    depth: 0.31,
    sheen: 0.3,
  },
  "y2k-mcbling": {
    shadow: 24,
    middle: 48,
    highlight: 130,
    depth: 0.31,
    sheen: 0.21,
  },
  "dark-feminine": {
    shadow: 13,
    middle: 27,
    highlight: 66,
    depth: 0.28,
    sheen: 0.23,
  },
  "glamour-contemporain": {
    shadow: 91,
    middle: 153,
    highlight: 234,
    depth: 0.31,
    sheen: 0.3,
  },
  gilet: { shadow: 26, middle: 44, highlight: 73, depth: 0.28, sheen: 0.17 },
  pantalon: { shadow: 24, middle: 39, highlight: 65, depth: 0.29, sheen: 0.16 },
  escarpins: {
    shadow: 14,
    middle: 47,
    highlight: 81,
    depth: 0.34,
    sheen: 0.26,
  },
} satisfies Record<string, FabricTone>;
