import manifest from "../../../../public/assets/avatar/capsule-mailles-iris-v1/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

const tuckedSleeveRegions: Partial<Record<string, string>> = {
  mila: "M0 540H343Q327 573 325 606Q321 632 312 655Q299 692 277 737Q252 790 224 812Q206 834 194 861H0Z",
  nuage: "M0 540H311Q306 568 284 597Q260 628 260 655Q270 687 265 720Q262 752 244 778Q225 800 204 819L192 859H0Z",
};

export const IRIS_KNITS_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({
    id,
    name,
    base,
    crop: [x, y, width, height],
    tone,
    detail,
    hasProtected,
    bareBodice,
  }) => {
    const stem = `/assets/avatar/capsule-mailles-iris-v1/${id}`;
    return {
      id: `fashion.iris-knits-${id}`,
      name,
      slot: "top",
      price: 900,
      crop: [x, y, width, height],
      coverage: [],
      bodyMask: `${stem}-coverage.png`,
      tuckedSleeveRegion: tuckedSleeveRegions[id],
      underwearCut: "strapless",
      fittingBody: bareBodice
        ? { front: "/assets/avatar/capsule-robes-iris-v1/comete-fitting.png" }
        : undefined,
      colorable: true,
      secondaryColor: detail
        ? { label: detail.label, defaultColor: detail.base, mode: "dark" }
        : undefined,
      pattern: {
        id: manifest.pattern,
        bodySha256: manifest.bodySha256,
        cut: `redrawn:iris-knits-${id}`,
      },
      poseProfile: {
        ...stationaryPoseProfile(),
        fits: {
          front: { kind: "shared" },
          "hand-on-hip": { kind: "unavailable" },
          "heart-hands": { kind: "unavailable" },
        },
      },
      art: {
        kind: "image",
        front: `${stem}.png`,
        colorMasks: {
          main: `${stem}-mask.png`,
          detail: detail ? `${stem}-detail-mask.png` : undefined,
          protected: hasProtected ? `${stem}-protected.png` : undefined,
          mainBase: base,
          detailBase: detail?.base ?? base,
          mainTone: tone,
          detailTone: detail?.tone,
          shading: "material",
        },
      },
    };
  },
);
