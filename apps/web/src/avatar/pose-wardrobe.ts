import type { Garment } from "./catalog";
import { STATIC_POSES, type StaticPose } from "./static-poses";
import { garmentMaterials } from "./materials";
import { DOLL_PATTERN } from "../../../../packages/domain/src/avatar-pattern";
import { redrawnGarment } from "./redrawn-garments";
import type {
  GarmentPoseFit,
  GarmentPoseProfile,
} from "../../../../packages/contracts/src/avatar-poses";
export type {
  GarmentPoseFit,
  GarmentPoseProfile,
  PoseSleeves,
} from "../../../../packages/contracts/src/avatar-poses";
const shared: GarmentPoseFit = { kind: "shared" },
  bare: GarmentPoseFit = { kind: "bare-arms" };
export const stationaryPoseProfile = (): GarmentPoseProfile => ({
  body: "fashion-user-hands-v2",
  canvas: [887, 1774],
  reviewed: true,
  fits: { front: shared, "hand-on-hip": shared, "heart-hands": shared },
});
/** Only for a sleeveless top already calibrated/visually checked on this body. */
export const sleevelessPoseProfile = (): GarmentPoseProfile => ({
  ...stationaryPoseProfile(),
  fits: { front: shared, "hand-on-hip": bare, "heart-hands": bare },
});
const redraw = "/assets/avatar/poses/redraw-v4";
const builtins: Readonly<Record<string, GarmentPoseProfile>> = {
  "fashion.leopard-ruched-halter": sleevelessPoseProfile(),
  "fashion.rose-bow-camisole": sleevelessPoseProfile(),
  "fashion.cardigan-lilac": {
    ...stationaryPoseProfile(),
    fits: {
      front: shared,
      "hand-on-hip": {
        kind: "sleeves",
        replaceTop: true,
        sleeves: {
          front: `${redraw}/hip-lilac.png`,
          main: `${redraw}/hip-lilac-mask.png`,
          detail: `${redraw}/hip-lilac-detail-mask.png`,
        },
      },
      "heart-hands": {
        kind: "sleeves",
        replaceTop: true,
        sleeves: {
          front: `${redraw}/heart-lilac.png`,
          main: `${redraw}/heart-lilac-mask.png`,
          detail: `${redraw}/heart-lilac-detail-mask.png`,
        },
      },
    },
  },
  "fashion.burgundy-fold-sweater": {
    ...stationaryPoseProfile(),
    fits: {
      front: shared,
      "hand-on-hip": {
        kind: "sleeves",
        replaceTop: true,
        bareShoulders: true,
        neckband: [535, 384, 105, 66],
        sleeves: {
          front: `${redraw}/hip-burgundy.png`,
          main: `${redraw}/hip-burgundy-mask.png`,
        },
      },
      "heart-hands": {
        kind: "sleeves",
        replaceTop: true,
        bareShoulders: true,
        neckband: [265, 384, 357, 66],
        sleeves: {
          front: `${redraw}/heart-burgundy.png`,
          main: `${redraw}/heart-burgundy-mask.png`,
        },
      },
    },
  },
  ...Object.fromEntries(
    [
      "fashion.medallion-flare-cargo",
      "fashion.fur-buckle-platforms",
      "fashion.medallion-belt",
      "fashion.midnight-pleated-skirt",
      "fashion.midnight-loafers-socks",
      "fashion.jeans-indigo",
      "fashion.boots-ivory",
      "fashion.rose-dragon-cargo",
      "fashion.white-platform-sneakers",
    ].map((id) => [id, stationaryPoseProfile()]),
  ),
};
export function withBuiltinPoseProfile(piece: Garment): Garment {
  const redrawn = redrawnGarment(piece);
  if (redrawn) return redrawn;
  const cut =
    piece.id === "fashion.cardigan-lilac"
      ? "legacy-lilac"
      : piece.id === "fashion.burgundy-fold-sweater"
        ? "legacy-burgundy"
        : null;
  if (cut && piece.art.kind === "image") {
    const root = "/assets/avatar/winter-v2",
      regions = garmentMaterials(piece);
    const fitted = (pose: string): GarmentPoseFit => ({
      kind: "sleeves",
      replaceTop: true,
      bareShoulders: cut === "legacy-burgundy",
      sleeves: {
        front: `${root}/${cut}-${pose}.png`,
        main: `${root}/${cut}-${pose}-mask.png`,
        ...(regions?.detail
          ? { detail: `${root}/${cut}-${pose}-detail-mask.png` }
          : {}),
      },
    });
    return {
      ...piece,
      coverage: [],
      pattern: {
        id: DOLL_PATTERN.id,
        bodySha256: DOLL_PATTERN.bodySha256,
        cut: `bound:${cut}`,
      },
      art: {
        kind: "image",
        front: `${root}/${cut}.png`,
        colorMasks: {
          main: `${root}/${cut}-mask.png`,
          ...(regions?.detail
            ? { detail: `${root}/${cut}-detail-mask.png` }
            : {}),
          mainBase: regions?.mainBase ?? "#642330",
          detailBase: regions?.detailBase ?? "#333333",
          shading: "material",
        },
      },
      poseProfile: {
        ...stationaryPoseProfile(),
        fits: {
          front: { kind: "shared" },
          "hand-on-hip": fitted("hip"),
          "heart-hands": fitted("heart"),
        },
      },
    };
  }
  return builtins[piece.id]
    ? {
        ...piece,
        poseProfile: builtins[piece.id],
        pattern: piece.pattern ?? {
          id: DOLL_PATTERN.id,
          bodySha256: DOLL_PATTERN.bodySha256,
          cut: piece.id,
        },
      }
    : piece;
}
export function poseFit(piece: Garment | undefined | null, pose: StaticPose) {
  return piece?.poseProfile?.fits?.[pose];
}
/** Reject incomplete imports rather than inventing sleeves or changing equipped IDs. */
export function poseProfileIssues(piece: Garment, allowUnavailable = false): string[] {
  const profile = piece.poseProfile,
    errors: string[] = [];
  if (!profile) return [`${piece.name} : ajustement aux trois poses manquant`];
  if (
    piece.pattern?.id !== DOLL_PATTERN.id ||
    piece.pattern.bodySha256 !== DOLL_PATTERN.bodySha256 ||
    !piece.pattern.cut
  )
    errors.push(
      `${piece.name} : patron du mannequin et repères de coupe manquants`,
    );
  if (
    profile.body !== "fashion-user-hands-v2" ||
    profile.canvas?.[0] !== 887 ||
    profile.canvas?.[1] !== 1774 ||
    profile.reviewed !== true
  )
    errors.push(`${piece.name} : repères corporels ou validation incorrects`);
  for (const pose of STATIC_POSES) {
    const fit = profile.fits?.[pose];
    if (allowUnavailable && pose !== "front" && fit?.kind === "unavailable")
      continue;
    if (
      !fit ||
      !["shared", "bare-arms", "sleeves", "procedural"].includes(fit.kind)
    ) {
      errors.push(`${piece.name} : pose ${pose} manquante`);
      continue;
    }
    if (
      pose !== "front" &&
      ["top", "outerwear"].includes(piece.slot) &&
      fit.kind === "shared"
    )
      errors.push(`${piece.name} : préciser la coupe du haut pour ${pose}`);
    if (!["top", "outerwear"].includes(piece.slot) && fit.kind !== "shared")
      errors.push(`${piece.name} : ajustement de ${piece.slot} incohérent`);
    if (
      fit.kind === "procedural" &&
      (piece.art.kind !== "vector" || !piece.art.textile || !fit.replaceTop)
    )
      errors.push(`${piece.name} : patron textile procédural manquant`);
    if (fit.kind === "sleeves" && fit.replaceTop !== true)
      errors.push(
        `${piece.name} : dessin complet du haut posé requis pour ${pose}`,
      );
    if (
      fit.bodyReveals &&
      (!Array.isArray(fit.bodyReveals) ||
        fit.bodyReveals.some((d) => typeof d !== "string" || !d.trim()))
    )
      errors.push(`${piece.name} : ouverture corporelle invalide`);
    if (
      fit.kind === "sleeves" &&
      (typeof fit.sleeves?.front !== "string" ||
        !fit.sleeves.front.trim() ||
        typeof fit.sleeves?.main !== "string" ||
        !fit.sleeves.main.trim() ||
        (fit.sleeves.detail !== undefined &&
          (typeof fit.sleeves.detail !== "string" ||
            !fit.sleeves.detail.trim())))
    )
      errors.push(
        `${piece.name} : dessin de manche et masque requis pour ${pose}`,
      );
    if (
      fit.neckband &&
      (!Array.isArray(fit.neckband) ||
        fit.neckband.length !== 4 ||
        !fit.neckband.every(Number.isFinite) ||
        fit.neckband[2] <= 0 ||
        fit.neckband[3] <= 0)
    )
      errors.push(`${piece.name} : raccord d’encolure invalide`);
  }
  return errors;
}
export function assertPoseProfile(piece: Garment, allowUnavailable = false) {
  const errors = poseProfileIssues(piece, allowUnavailable);
  if (errors.length) throw new Error(errors.join(" ; "));
}
export function poseSleeveArt(piece: Garment, fit: GarmentPoseFit) {
  const art = fit.sleeves!;
  const materials = garmentMaterials(piece);
  return {
    kind: "image" as const,
    front: art.front,
    colorMasks: {
      main: art.main,
      detail: art.detail,
      mainBase:
        art.mainBase ??
        materials?.mainBase ??
        (piece.art.kind === "image"
          ? piece.art.colorMasks?.mainBase
          : undefined) ??
        "#ffffff",
      detailBase:
        art.detailBase ??
        materials?.detailBase ??
        (piece.art.kind === "image"
          ? piece.art.colorMasks?.detailBase
          : undefined) ??
        "#333333",
      shading: "material" as const,
      mainContrast: piece.art.kind === "image" ? piece.art.colorMasks?.mainContrast : undefined,
      mainTone: piece.art.kind === "image" ? piece.art.colorMasks?.mainTone : undefined,
      mainLight: art.mainLight,
      protected: art.protected,
      detailTone: piece.art.kind === "image" ? piece.art.colorMasks?.detailTone : undefined,
    },
  };
}
