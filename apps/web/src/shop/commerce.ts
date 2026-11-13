import { avatarGarment } from "../avatar/catalog";
import { retiredGarments } from "../../../../packages/contracts/src/retired-garments";
import { garmentMaterials } from "../avatar/materials";
import { DEFAULT_LAYERS, equipLayer, wearGarment, wornSlot, type AvatarLayers } from "../avatar/model";
import type { AvatarSlot } from "../avatar/catalog";
import { snapshotOutfit, readWornOutfits } from "../avatar/worn-outfits";
import { fittingCart } from "./fashion-options";
export const COMMERCE_KEY = "fashion-commerce-v1";
export const TEST_BALANCE = 10000;
export type PurchasedItem = {
  key: string;
  pieceId: string;
  color?: string;
  detailColor?: string;
  purchasedAt: number;
};
export function equipPurchasedItem(
  layers: AvatarLayers,
  item: Pick<PurchasedItem, "pieceId" | "color" | "detailColor">,
  slot?: AvatarSlot,
): AvatarLayers {
  const { pieceId, color, detailColor } = item;
  const equipped = slot ? equipLayer(layers, slot, pieceId) : wearGarment(layers, pieceId);
  const colors = { ...equipped.colors };
  const detailColors = { ...equipped.detailColors };
  delete colors[pieceId];
  delete detailColors[pieceId];
  if (color) colors[pieceId] = color;
  if (detailColor) detailColors[pieceId] = detailColor;
  return { ...equipped, colors, detailColors };
}
export type FashionCommerce = {
  accounts: Record<string, { balance: number; diamonds?: number; wheelCoins?: number; wheelDiamonds?: number }>;
  wardrobes: Record<
    string,
    { items: PurchasedItem[]; equipped?: AvatarLayers }
  >;
};
export const emptyCommerce = (): FashionCommerce => ({
  accounts: {},
  wardrobes: {},
});
export function readCommerce(raw: string | null): FashionCommerce {
  try {
    const p = JSON.parse(raw ?? "null");
    if (
      !p ||
      typeof p !== "object" ||
      Array.isArray(p) ||
      !p.accounts ||
      !p.wardrobes
    )
      return emptyCommerce();
    if (
      Object.values(p.accounts).some(
        (a: any) => !a || !Number.isSafeInteger(a.balance) || a.balance < 0,
      )
    )
      return emptyCommerce();
    if (
      Object.values(p.wardrobes).some(
        (w: any) =>
          !w ||
          !Array.isArray(w.items) ||
          w.items.some(
            (i: any) =>
              !i || typeof i.key !== "string" || typeof i.pieceId !== "string",
          ),
      )
    )
      return emptyCommerce();
    for (const [owner, w] of Object.entries(p.wardrobes) as [
      string,
      { equipped?: AvatarLayers; items: PurchasedItem[] },
    ][]) {
      w.items = w.items.filter(({ pieceId }) => !retiredGarments.has(pieceId));
      if (w.equipped)
        w.equipped = readWornOutfits(JSON.stringify({ [owner]: w.equipped }))[
          owner
        ];
    }
    return p;
  } catch {
    return emptyCommerce();
  }
}
export function variantKey(
  pieceId: string,
  color?: string,
  detailColor?: string,
) {
  const piece = avatarGarment(pieceId);
  const regions =
    garmentMaterials(piece) ??
    (piece.art.kind === "image" ? piece.art.colorMasks : undefined);
  const normalized = (value: string | undefined, base: string | undefined) =>
    !value || value.toLowerCase() === base?.toLowerCase()
      ? "original"
      : value.toLowerCase();
  return JSON.stringify([
    pieceId,
    normalized(color, regions?.mainBase),
    normalized(piece.secondaryColor ? detailColor : undefined, regions?.detailBase),
  ]);
}
export function ownsVariant(items: readonly PurchasedItem[], pieceId: string, color?: string, detailColor?: string) {
  const key = variantKey(pieceId, color, detailColor);
  return items.some((item) => item.pieceId === pieceId &&
    (item.key === key || variantKey(pieceId, item.color, item.detailColor) === key));
}
export function wardrobeFor(
  state: FashionCommerce,
  account: string,
  owner: string,
  worn: AvatarLayers,
  starter = DEFAULT_LAYERS,
  startingBalance = TEST_BALANCE,
) {
  const items = (state.wardrobes[owner]?.items ?? []).filter(({ pieceId }) => !retiredGarments.has(pieceId));
  // Preserve previously accepted outfits and the original starter outfit.
  for (const outfit of [starter, worn])
    for (const entry of fittingCart(outfit)) {
      const key = variantKey(entry.piece.id, entry.color, entry.detailColor);
      if (!ownsVariant(items, entry.piece.id, entry.color, entry.detailColor))
        items.push({
          key,
          pieceId: entry.piece.id,
          color: entry.color,
          detailColor: entry.detailColor,
          purchasedAt: 0,
        });
    }
  const wallet = state.accounts[account];
  const diamonds = wallet?.diamonds;
  return {
    items,
    balance: wallet?.balance ?? startingBalance,
    diamonds:
      typeof diamonds === "number" &&
      Number.isSafeInteger(diamonds) &&
      diamonds >= 0
        ? diamonds
        : 0,
  };
}
export function buyOutfit(
  state: FashionCommerce,
  account: string,
  owner: string,
  draft: AvatarLayers,
  worn: AvatarLayers,
  onlyPieceId?: string,
  starter = DEFAULT_LAYERS,
  startingBalance = TEST_BALANCE,
) {
  const current = wardrobeFor(state, account, owner, worn, starter, startingBalance);
  const selected = fittingCart(draft).filter(
    (e) => !onlyPieceId || e.piece.id === onlyPieceId,
  );
  if (onlyPieceId && !selected.length)
    throw new Error("Cet article n’est plus essayé.");
  const additions = selected.filter(
    (e) => !ownsVariant(current.items, e.piece.id, e.color, e.detailColor),
  );
  for (const item of additions)
    if (!Number.isSafeInteger(item.price) || item.price < 0)
      throw new Error("Prix indisponible pour cet article.");
  const total = additions.reduce((sum, e) => sum + e.price, 0);
  if (total > current.balance)
    throw new Error("Tu n’as pas assez de pièces pour cet achat.");
  // A checkout changes only purchased slots. The empty-cart action explicitly wears the preview.
  let equipped = snapshotOutfit(!onlyPieceId && !additions.length ? draft : worn);
  for (const { piece, color, detailColor } of onlyPieceId ? selected : additions) {
    const previous = worn[piece.slot];
    const replacedSlot = draft[piece.slot] === piece.id && previous && !wornSlot(draft, previous)
      ? piece.slot : undefined;
    equipped = equipPurchasedItem(equipped, { pieceId: piece.id, color, detailColor }, replacedSlot);
  }
  if (draft.pieceOrder && !onlyPieceId && additions.length) {
    const wornIds = new Set(fittingCart(equipped).map(({ piece }) => piece.id));
    equipped = { ...equipped, pieceOrder: draft.pieceOrder.filter((id) => wornIds.has(id)) };
  }
  const items = [
    ...current.items,
    ...additions.map((e) => ({
      key: variantKey(e.piece.id, e.color, e.detailColor),
      pieceId: e.piece.id,
      color: e.color,
      detailColor: e.detailColor,
      purchasedAt: Date.now(),
    })),
  ];
  const next: FashionCommerce = {
    accounts: {
      ...state.accounts,
      [account]: {
        ...state.accounts[account],
        balance: current.balance - total,
      },
    },
    wardrobes: { ...state.wardrobes, [owner]: { items, equipped } },
  };
  return { next, equipped, charged: total, added: additions.length };
}
