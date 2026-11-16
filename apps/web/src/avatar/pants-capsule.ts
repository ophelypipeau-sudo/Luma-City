import manifest from "../../../../public/assets/avatar/capsule-pantalons-v1/index.json";
import newManifest from "../../../../public/assets/avatar/capsule-pantalons-iris-v4/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

const root = "/assets/avatar/capsule-pantalons-v1";

export const PANTS_CAPSULE_GARMENTS: readonly Garment[] = manifest.pieces.map(
  ({ id, name, price, crop, base, tone }) => ({
    id: `fashion.pants-${id}`,
    name,
    price,
    slot: "bottom",
    crop: [crop[0], crop[1], crop[2], crop[3]],
    coverage: [],
    coverageFromArt: true,
    bodyMask: `${root}/${id}-coverage.png`,
    // Rocade's waistband dips at the centre and sits close to the body at the hips.
    tuckedTopRegion: id === "rocade"
      ? "M0 0H887V654H565Q558 654 552 666Q549 661 544 662C510 669 473 677 438 676C402 677 373 670 348 663Q342 663 334 670Q327 662 321 655H0Z"
      : undefined,
    pattern: {
      id: manifest.pattern,
      bodySha256: manifest.bodySha256,
      cut: `redrawn:pants-${id}`,
    },
    colorable: true,
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
      front: `${root}/${id}.png`,
      colorMasks: {
        main: `${root}/${id}-mask.png`,
        protected: `${root}/${id}-protected.png`,
        mainBase: base,
        detailBase: "#808080",
        mainTone: tone,
        shading: "material",
      },
    },
  }),
);

export const IRIS_PANTS_GARMENTS: readonly Garment[] = newManifest.pieces.map(
  ({ id, name, price, crop, base, tone, detail, lowRise, hasProtected }) => {
    const stem = `/assets/avatar/capsule-pantalons-iris-v4/${id}`;
    return {
      id: `fashion.iris-pants-${id}`,
      name, price, slot: "bottom",
      crop: [crop[0], crop[1], crop[2], crop[3]],
      coverage: [],
      bodyMask: `${stem}-coverage.png`,
      underwearCut: lowRise ? "low-rise" : undefined,
      pattern: { id: newManifest.pattern, bodySha256: newManifest.bodySha256, cut: `redrawn:iris-pants-${id}` },
      poseProfile: { ...stationaryPoseProfile(), fits: {
        front: { kind: "shared" },
        "hand-on-hip": { kind: "unavailable" },
        "heart-hands": { kind: "unavailable" },
      } },
      colorable: true,
      secondaryColor: detail ? { label: detail.label, defaultColor: detail.base, mode: "dark" } : undefined,
      art: { kind: "image", front: `${stem}.png`, colorMasks: {
        main: `${stem}-mask.png`,
        detail: detail ? `${stem}-detail-mask.png` : undefined,
        protected: hasProtected ? `${stem}-protected.png` : undefined,
        mainBase: base, detailBase: detail?.base ?? "#808080",
        mainTone: tone, detailTone: detail?.tone, shading: "material",
      } },
    };
  },
);
