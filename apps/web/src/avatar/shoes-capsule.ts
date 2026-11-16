import manifest from "../../../../public/assets/avatar/capsule-chaussures-v1/index.json";
import irisManifest from "../../../../public/assets/avatar/capsule-chaussures-iris-v3/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

const root = "/assets/avatar/capsule-chaussures-v1";
export const SHOES_CAPSULE_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({ id, name, price, crop, base, tone }) => ({
    id: `fashion.shoes-${id}`,
    name, price, slot: "shoes", behindBottom: true,
    crop: [crop[0], crop[1], crop[2], crop[3]],
    coverage: [], coverageFromArt: true,
    bodyMask: `${root}/${id}-coverage.png`,
    pattern: { id: manifest.pattern, bodySha256: manifest.bodySha256, cut: `redrawn:shoes-${id}` },
    colorable: true,
    poseProfile: { ...stationaryPoseProfile(), fits: {
      front: { kind: "shared" },
      "hand-on-hip": { kind: "unavailable" },
      "heart-hands": { kind: "unavailable" },
    } },
    art: { kind: "image", front: `${root}/${id}.png`, colorMasks: {
      main: `${root}/${id}-mask.png`,
      protected: `${root}/${id}-protected.png`,
      mainBase: base, detailBase: "#808080", mainTone: tone, shading: "material",
    } },
  }),
);

export const IRIS_SHOES_CAPSULE_GARMENTS: readonly Garment[] = irisManifest.pieces.map(
  ({ id, name, price, crop, base, tone, secondary, backRegion }) => {
    const key = id.slice(3);
    const stem = `/assets/avatar/capsule-chaussures-iris-v3/${id}`;
    return {
      id: `fashion.iris-shoes-${key}`,
      name, price, slot: "shoes", behindBottom: true,
      crop: [crop[0], crop[1], crop[2], crop[3]],
      coverage: [],
      bodyMask: `${stem}-coverage.png`,
      pattern: { id: irisManifest.pattern, bodySha256: irisManifest.bodySha256, cut: `redrawn:iris-shoes-${key}` },
      colorable: true,
      secondaryColor: secondary ? { label: secondary.label, defaultColor: secondary.base, mode: "dark" } : undefined,
      poseProfile: { ...stationaryPoseProfile(), fits: {
        front: { kind: "shared" },
        "hand-on-hip": { kind: "unavailable" },
        "heart-hands": { kind: "unavailable" },
      } },
      art: {
        kind: "image",
        front: `${stem}.png`,
        backRegion,
        colorMasks: {
          main: `${stem}-mask.png`,
          detail: secondary ? `${stem}-detail-mask.png` : undefined,
          protected: `${stem}-protected.png`,
          mainBase: base,
          detailBase: secondary?.base ?? "#808080",
          mainTone: tone,
          detailTone: secondary?.tone,
          shading: "material",
        },
      },
    };
  },
);
