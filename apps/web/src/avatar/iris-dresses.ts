import firstCapsule from "../../../../public/assets/avatar/capsule-robes-iris-v1/index.json";
import secondCapsule from "../../../../public/assets/avatar/capsule-robes-iris-v2/index.json";
import type { FabricTone } from "../../../../packages/domain/src/atelier-color";
import type { Garment } from "./catalog";
import { stationaryPoseProfile } from "./pose-wardrobe";

type DressManifest = {
  pattern: string;
  bodySha256: string;
  pieces: readonly {
    id: string;
    name: string;
    price: number;
    crop: readonly number[];
    tone: FabricTone;
    detailTone?: FabricTone;
    fittingBody?: string;
    back?: boolean;
    protected?: boolean;
  }[];
};

const capsuleColors: Record<
  string,
  {
    main: string;
    secondary?: Garment["secondaryColor"];
  }
> = {
  vesper: { main: "#85351f" },
  mira: { main: "#7697ae" },
  solstice: { main: "#ac8fbe" },
  celeste: {
    main: "#702036",
    secondary: { label: "Dentelle", defaultColor: "#2e2428", mode: "dark" },
  },
  aura: { main: "#681b35" },
  saturne: {
    main: "#675c58",
    secondary: { label: "Empiècements mats", defaultColor: "#443f45", mode: "dark" },
  },
  opaline: { main: "#c4ac90" },
  velvette: { main: "#064358" },
  nyx: {
    main: "#382921",
    secondary: { label: "Sergé", defaultColor: "#292426", mode: "dark" },
  },
  equinoxe: {
    main: "#765974",
    secondary: { label: "Doublure", defaultColor: "#bb9ebb", mode: "light-panel" },
  },
};

function dressGarments(
  manifest: DressManifest,
  version: 1 | 2,
): readonly Garment[] {
  return manifest.pieces.map(
    ({
      id,
      name,
      price,
      crop: [x, y, width, height],
      tone,
      detailTone,
      fittingBody,
      back,
      protected: hasProtected,
    }) => {
      const stem = `/assets/avatar/capsule-robes-iris-v${version}/${id}`;
      const frontBody =
        fittingBody ??
        (version === 1 && id === "comete" ? `${stem}-fitting.png` : undefined);
      const palette = version === 2 ? capsuleColors[id] : undefined;
      const secondaryColor = detailTone ? palette?.secondary : undefined;
      return {
        id: `fashion.iris-dresses-${id}`,
        name,
        price,
        slot: "top",
        isDress: true,
        underwearCut: "strapless",
        crop: [x, y, width, height],
        coverage: [],
        fittingBody: frontBody ? { front: frontBody } : undefined,
        bodyMask: `${stem}-coverage.png`,

        colorable: true,
        secondaryColor,
        pattern: {
          id: manifest.pattern,
          bodySha256: manifest.bodySha256,
          cut: `redrawn:iris-dresses-${id}`,
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
          back: back ? `${stem}-back.png` : undefined,
          colorMasks: {
            main: `${stem}-mask.png`,
            detail: detailTone ? `${stem}-detail-mask.png` : undefined,
            protected:
              (hasProtected ??
              (version === 1 && ["comete", "terrasse"].includes(id)))
                ? `${stem}-protected.png`
                : undefined,
            mainBase: palette?.main ?? "#808080",
            detailBase: secondaryColor?.defaultColor ?? "#808080",
            mainTone: tone,
            detailTone,
            shading: "material",
          },
        },
      };
    },
  );
}

export const IRIS_DRESSES_GARMENTS = dressGarments(firstCapsule, 1);
export const IRIS_DRESSES_V2_GARMENTS = dressGarments(secondCapsule, 2);
