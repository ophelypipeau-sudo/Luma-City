import {
  isPunkCut,
  PUNK_COLORS,
} from "../../../../packages/domain/src/punk-pattern";
import { MATERIAL_MAP } from "./material-map";
import type { Garment } from "./catalog";
import type { FabricTone } from "../../../../packages/domain/src/atelier-color";
export type MaterialRegions = {
  main: string;
  detail?: string;
  protected: string;
  mainBase: string;
  detailBase: string;
  mainLabel: string;
  shading: "material";
  mainTone?: FabricTone;
  mainLight?: string;
  detailTone?: FabricTone;
};
export function garmentMaterials(
  piece: Garment | undefined,
): MaterialRegions | undefined {
  if (
    piece?.art.kind === "vector" &&
    piece.art.textile &&
    isPunkCut(piece.art.textile)
  ) {
    const c = PUNK_COLORS[piece.art.textile];
    return {
      main: "vector:base-fill",
      detail: piece.secondaryColor ? "vector:detail-fill" : undefined,
      protected: "vector:protected-seams",
      mainBase: c.main,
      detailBase: c.detail,
      mainLabel: piece.slot === "hair" ? "Cheveux" : "Matière",
      shading: "material",
    };
  }
  if (piece?.art.kind === "vector" && piece.art.textile)
    return {
      main: "vector:base-fill",
      protected: "vector:protected-seams",
      mainBase: piece.art.textile === "cropped-knit" ? "#343130" : "#716966",
      detailBase: "#292228",
      mainLabel: "Tissu",
      shading: "material",
    };
  if (
    piece?.art.kind === "image" &&
    piece.art.colorMasks &&
    (piece.pattern?.cut.startsWith("bound:") ||
      piece.pattern?.cut.startsWith("redrawn:") ||
      !(piece.id in MATERIAL_MAP))
  ) {
    const masks = piece.art.colorMasks;
    return {
      ...masks,
      protected: masks.protected ?? piece.art.front.replace(/\.png$/, "-protected.png"),
      mainLabel: piece.slot === "hair" ? "Cheveux" : "Matière",
      shading: "material",
    };
  }
  return piece
    ? (MATERIAL_MAP as Record<string, MaterialRegions>)[piece.id]
    : undefined;
}
export function materialArt(piece: Garment) {
  if (
    piece.pattern?.cut.startsWith("bound:") ||
    piece.pattern?.cut.startsWith("redrawn:")
  )
    return piece.art;
  const regions = garmentMaterials(piece);
  return piece.art.kind === "image" && regions
    ? { ...piece.art, colorMasks: regions }
    : piece.art;
}
