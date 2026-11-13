import type { Garment } from "./catalog";
import { DOLL_PATTERN } from "../../../../packages/domain/src/avatar-pattern";
import {
  textilePattern,
  type TextileCut,
} from "../../../../packages/domain/src/textile-pattern";
const profile = (top: boolean): Garment["poseProfile"] => ({
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
});
export const TEXTILE_GARMENTS: readonly Garment[] = (
  ["cropped-knit", "tailored-shorts"] as const
).map((cut: TextileCut) => ({
  id: `fashion.textile-${cut}`,
  name: cut === "cropped-knit" ? "Pull ample Charbon" : "Short tailleur Cendre",
  slot: cut === "cropped-knit" ? "top" : "bottom",
  price: cut === "cropped-knit" ? 650 : 450,
  colorable: true,
  art: {
    kind: "vector",
    drawing: cut === "cropped-knit" ? "tops" : "bottoms",
    textile: cut,
  },
  pattern: {
    id: DOLL_PATTERN.id,
    bodySha256: DOLL_PATTERN.bodySha256,
    cut: `textile:${cut}`,
  },
  poseProfile: profile(cut === "cropped-knit"),
  crop: textilePattern(cut).crop,
  coverage: [],
  coverageFromArt: true,
  ...(cut === "tailored-shorts"
    ? {
        underwearCut: "low-rise" as const,
        beltFit: { scaleX: 0.94, offsetY: -4 },
      }
    : {}),
}));
