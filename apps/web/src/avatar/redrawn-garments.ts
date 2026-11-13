import type { Garment } from "./catalog";
import type { GarmentPoseProfile } from "../../../../packages/contracts/src/avatar-poses";
import { DOLL_PATTERN } from "../../../../packages/domain/src/avatar-pattern";
import manifest from "../../../../public/assets/avatar/redrawn-v1/manifest.json";
const ROOT = "/assets/avatar/redrawn-v1";
/** Stable item IDs keep purchases, selected dyes and saved looks intact. The
 * new drawings are native registrations, not deformations of old imports. */
export const REDRAWN_ITEMS: Readonly<Record<string, string>> = {
  "fashion.cardigan-lilac": "lilac",
  "fashion.jeans-indigo": "jeans",
  "fashion.boots-ivory": "ankle-boots",
  "fashion.rose-bow-camisole": "rose-camisole",
  "fashion.rose-dragon-cargo": "cargo",
  "fashion.white-platform-sneakers": "white-sneakers",
  "fashion.burgundy-fold-sweater": "burgundy",
  "fashion.midnight-pleated-skirt": "burgundy-skirt",
  "fashion.midnight-loafers-socks": "socks-loafers",
  "fashion.leopard-ruched-halter": "leopard",
  "fashion.medallion-flare-cargo": "fur-pants",
  "fashion.fur-buckle-platforms": "gold-sneakers",
  ...Object.fromEntries(
    [
      "pink-jacket",
      "pink-skirt",
      "pink-pumps",
      "pink-warmers",
      "snow-top",
      "snow-shorts",
      "snow-warmers",
      "ivory-dress",
      "ivory-boots",
      "ribbon-camisole",
      "ribbon-cardigan",
      "ribbon-skirt",
      "ribbon-stockings",
      "ribbon-loafers",
    ].map((k) => [`fashion.winter-${k}`, k]),
  ),
  "fashion.winter-snow-pumps": "pumps",
};
const sleeved = new Set([
  "lilac",
  "burgundy",
  "pink-jacket",
  "snow-top",
  "ivory-dress",
  "ribbon-cardigan",
]);
export function redrawnGarment(piece: Garment): Garment | undefined {
  const key = REDRAWN_ITEMS[piece.id];
  if (!key) return undefined;
  const precise = key === "burgundy";
  const drawingRoot = precise ? "/assets/avatar/burgundy-cut-v2" : ROOT;
  const m = (
    manifest as Record<
      string,
      { crop: number[]; mainBase: string; detailBase: string; detail: boolean }
    >
  )[key];
  const fits: {
    -readonly [
      P in keyof GarmentPoseProfile["fits"]
    ]: GarmentPoseProfile["fits"][P];
  } = {
    front: { kind: "shared" },
    "hand-on-hip": { kind: "shared" },
    "heart-hands": { kind: "shared" },
  };
  for (const pose of ["hand-on-hip", "heart-hands"] as const)
    if (["top", "outerwear"].includes(piece.slot))
      fits[pose] = sleeved.has(key)
        ? {
            kind: "sleeves",
            replaceTop: true,
            bareShoulders: ["burgundy", "snow-top"].includes(key),
            sleeves: {
              front: precise
                ? `${drawingRoot}/${pose}.png`
                : `${ROOT}/${key}-${pose}.png`,
              main: precise
                ? `${drawingRoot}/${pose}-mask.png`
                : `${ROOT}/${key}-${pose}-mask.png`,
              ...(m.detail
                ? { detail: `${ROOT}/${key}-${pose}-detail-mask.png` }
                : {}),
            },
          }
        : { kind: "bare-arms" };
  const profile: GarmentPoseProfile = {
    body: "fashion-user-hands-v2",
    canvas: [887, 1774],
    reviewed: true,
    fits,
  };
  return {
    ...piece,
    pattern: {
      id: DOLL_PATTERN.id,
      bodySha256: DOLL_PATTERN.bodySha256,
      cut: `redrawn:${precise ? "burgundy-contour-v2" : key}`,
    },
    poseProfile: profile,
    crop: m.crop as unknown as readonly [number, number, number, number],
    coverage: [],
    coverageFromArt: true,
    bodyMask:
      piece.slot === "shoes"
        ? `${ROOT}/${["pumps", "pink-pumps"].includes(key) ? "pumps" : "closed-shoes"}-body-mask.png`
        : piece.slot === "top"
          ? precise
            ? `${drawingRoot}/body-mask.png`
            : `${ROOT}/${key}-body-mask.png`
          : piece.slot === "bottom"
            ? `${ROOT}/bottom-underwear-mask.png`
            : undefined,
    frontPaths: undefined,
    foreground: undefined,
    ...(piece.slot === "bottom"
      ? {
          beltFit: { scaleX: 0.94, offsetY: key === "ribbon-skirt" ? -60 : -4 },
          underwearCut: "low-rise" as const,
        }
      : {}),
    ...(piece.slot === "top" ? { underwearCut: "strapless" as const } : {}),
    ...(m.detail
      ? {
          secondaryColor: {
            label: piece.secondaryColor?.label ?? "Détails",
            defaultColor: m.detailBase,
            mode: "light-panel" as const,
          },
        }
      : { secondaryColor: undefined }),
    art: {
      kind: "image",
      front: precise ? `${drawingRoot}/front.png` : `${ROOT}/${key}.png`,
      colorMasks: {
        main: precise
          ? `${drawingRoot}/front-mask.png`
          : `${ROOT}/${key}-mask.png`,
        ...(m.detail ? { detail: `${ROOT}/${key}-detail-mask.png` } : {}),
        mainBase: m.mainBase,
        detailBase: m.detailBase,
        shading: "material",
      },
    },
  };
}
