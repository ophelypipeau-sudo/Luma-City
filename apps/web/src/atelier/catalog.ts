import type {
  AtelierDraft,
  WorkshopPublication,
} from "../../../../packages/contracts/src/atelier";
import { ATELIER_PATTERNS } from "../../../../packages/domain/src/atelier-patterns";
import type { Garment } from "../avatar/catalog";
export function atelierGarment(item: WorkshopPublication): Garment {
  const p = item.placement;
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    slot: "top",
    poseProfile: item.poseProfile,
    colorable: true,
    crop: ATELIER_PATTERNS[item.pattern].crop,
    coverage: [],
    coverageFromArt: true,
    secondaryColor: item.hasDetail
      ? {
          label: item.detailLabel,
          defaultColor: item.detailColor,
          mode: "dark",
        }
      : undefined,
    art: {
      kind: "image",
      front: item.front,
      source: {
        x: 443.5 * (1 - p.scaleX) + p.x,
        y: 450 * (1 - p.scaleY) + p.y,
        width: 887 * p.scaleX,
        height: 1774 * p.scaleY,
      },
      colorMasks: item.mask1
        ? {
            main: item.mask1,
            detail: item.hasDetail ? item.mask2 : undefined,
            mainBase: item.mainColor,
            detailBase: item.detailColor,
            mainTone: item.mainTone,
            detailTone: item.hasDetail ? item.detailTone : undefined,
          }
        : undefined,
    },
  };
}
export function draftGarment(draft: AtelierDraft) {
  return atelierGarment({
    id: `atelier.preview.${draft.id}`,
    name: draft.name,
    price: draft.price,
    pattern: draft.pattern,
    front: draft.preparedUrl!,
    mask1: draft.mask1Url,
    mask2: draft.mask2Url,
    mainTone: draft.mainTone,
    detailTone: draft.detailTone,
    mainColor: draft.mainColor,
    detailColor: draft.detailColor,
    detailLabel: draft.detailLabel,
    hasDetail: draft.hasDetail,
    placement: draft.placement,
    version: 0,
  });
}
