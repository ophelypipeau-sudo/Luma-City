/** Repeatable, transparent material tiles; never contain clothing silhouettes,
 * skin, a face or source-photo pixels. Base dye is a separate runtime channel. */
export const TEXTILE_MATERIALS = {
  "cropped-knit": {
    name: "soft-knit",
    width: 5,
    height: 7,
    path: "M1-1L3 2 1 5 3 8",
    opacity: 0.055,
    strokeWidth: 0.65,
  },
  "tailored-shorts": {
    name: "cotton-twill",
    width: 4,
    height: 4,
    path: "M-1 1L3 5M1-1L5 3",
    opacity: 0.07,
    strokeWidth: 0.6,
  },
} as const;
