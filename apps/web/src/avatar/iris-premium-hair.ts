import manifest from "../../../../public/assets/avatar/capsule-coiffures-premium-iris/index.json";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

export const IRIS_PREMIUM_HAIR_GARMENTS: readonly Garment[] = manifest.pieces.map((piece) => {
  const stem = `/assets/avatar/capsule-coiffures-premium-iris/${piece.id}`;
  const [x, y, width, height] = piece.crop;
  return {
    id: `fashion.iris-premium-hair-${piece.id}`,
    name: piece.name,
    slot: "hair",
    price: 850,
    crop: [x, y, width, height],
    coverage: [],
    colorable: true,
    ...(piece.detailTone && { secondaryColor: { label: "Mèches roses", defaultColor: "#8b304e", mode: "dark" as const } }),
    pattern: { id: manifest.pattern, bodySha256: manifest.bodySha256, cut: `redrawn:iris-premium-hair-${piece.id}` },
    poseProfile: { ...stationaryPoseProfile(), fits: {
      front: { kind: "shared" },
      "hand-on-hip": { kind: "unavailable" },
      "heart-hands": { kind: "unavailable" },
    } },
    art: {
      kind: "image",
      front: `${stem}.png`,
      offsetY: piece.offsetY,
      colorMasks: {
        main: `${stem}-mask.png`,
        detail: piece.detailTone ? `${stem}-detail.png` : undefined,
        protected: piece.hasProtected ? `${stem}-protected.png` : undefined,
        mainBase: "#808080",
        detailBase: piece.detailTone ? "#8b304e" : "#808080",
        shading: "material",
        mainTone: piece.mainTone,
        detailTone: piece.detailTone,
      },
    },
  };
});
