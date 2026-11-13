import { z } from "zod";
import type { Query } from "./db.ts";
import { retiredGarments } from "../../../packages/contracts/src/retired-garments.ts";
import { isCreatedPlayer } from "../../../packages/contracts/src/player-account.ts";
import { avatarGarment, replaceAtelierCatalog } from "../../../apps/web/src/avatar/catalog.ts";
import { DEFAULT_LAYERS, removeGarment, type AvatarLayers } from "../../../apps/web/src/avatar/model.ts";
import { readAvatarLayers, shareOutfit } from "../../../apps/web/src/avatar/worn-outfits.ts";
import { fittingCart, garmentPrice } from "../../../apps/web/src/shop/fashion-options.ts";
import { atelierGarment } from "../../../apps/web/src/atelier/catalog.ts";
import {
  buyOutfit, ownsVariant, variantKey, wardrobeFor, TEST_BALANCE,
  type FashionCommerce, type PurchasedItem,
} from "../../../apps/web/src/shop/commerce.ts";
import type { AtelierStore } from "./atelier-store.ts";

/** Errors meant for the player; anything else is reported as a server error. */
export class PlayerError extends Error {}

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
export const legacyItemsSchema = z.array(z.object({
  pieceId: z.string().min(1).max(120),
  color: hex.optional(),
  detailColor: hex.optional(),
  purchasedAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
}).passthrough()).max(500);

type CharacterRow = { id: string; account_id: string; outfit?: unknown; starter_outfit?: unknown };

export function createWardrobe(atelier?: AtelierStore) {
  /** Atelier publications are known to the catalogue only once loaded from disk. */
  async function knowPieces(ids: Iterable<string>) {
    const missing = [...ids].some((id) => {
      try { avatarGarment(id); return false; } catch { return true; }
    });
    if (missing && atelier) replaceAtelierCatalog((await atelier.catalog()).map(atelierGarment));
  }
  const layersOf = (outfit: unknown, fallback = DEFAULT_LAYERS) => readAvatarLayers(outfit) ?? fallback;
  const startingBalance = (character: string) => (isCreatedPlayer(character) ? 0 : TEST_BALANCE);
  async function items(q: Query, character: string): Promise<PurchasedItem[]> {
    const { rows } = await q(
      `SELECT item_key AS key, piece_id AS "pieceId", color, detail_color AS "detailColor", purchased_at AS "purchasedAt"
       FROM wardrobe_items WHERE character_id=$1 ORDER BY purchased_at, item_key`, [character]);
    await knowPieces(rows.map(({ pieceId }) => pieceId));
    return rows
      .filter(({ pieceId }) => !retiredGarments.has(pieceId))
      .map(({ color, detailColor, purchasedAt, ...item }) => ({
        ...item, purchasedAt: Number(purchasedAt),
        ...(color && { color }), ...(detailColor && { detailColor }),
      }));
  }
  async function spent(q: Query, account: string) {
    const { rows: [row] } = await q(
      "SELECT COALESCE(SUM(price),0)::integer AS spent FROM wardrobe_items WHERE paid_by=$1", [account]);
    return Number(row.spent);
  }
  /** Same model as the shop: starting coins + coins earned on the server − purchases. */
  async function commerce(q: Query, character: CharacterRow, earnedCoins: number) {
    const owned = await items(q, character.id);
    const worn = layersOf(character.outfit);
    const starter = layersOf(character.starter_outfit);
    const balance = startingBalance(character.id) + earnedCoins - (await spent(q, character.account_id));
    const state: FashionCommerce = {
      accounts: { [character.account_id]: { balance: Math.max(0, balance) } },
      wardrobes: { [character.id]: { items: owned, equipped: worn } },
    };
    return { state, worn, starter };
  }
  async function view(q: Query, character: CharacterRow, earnedCoins: number, earnedDiamonds: number) {
    const { state, worn, starter } = await commerce(q, character, earnedCoins);
    const { items, balance } = wardrobeFor(state, character.account_id, character.id, worn, starter, 0);
    return { items, balance, diamonds: earnedDiamonds };
  }
  async function buy(q: Query, character: CharacterRow, earnedCoins: number, draftInput: unknown, onlyPieceId?: string) {
    const draft = layersOf(draftInput);
    await knowPieces(fittingCart(draft).map(({ piece }) => piece.id));
    const { state, worn, starter } = await commerce(q, character, earnedCoins);
    let receipt;
    try {
      receipt = buyOutfit(state, character.account_id, character.id, draft, worn, onlyPieceId, starter, 0);
    } catch (error) {
      throw new PlayerError(error instanceof Error && !error.message.startsWith("Unknown avatar garment")
        ? error.message : "Cet article n’est pas disponible.");
    }
    const before = new Set(wardrobeFor(state, character.account_id, character.id, worn, starter, 0).items.map(({ key }) => key));
    const prices = new Map(fittingCart(draft).map((entry) => [variantKey(entry.piece.id, entry.color, entry.detailColor), entry.price]));
    let charged = 0;
    for (const item of receipt.next.wardrobes[character.id].items) {
      if (before.has(item.key)) continue;
      const price = prices.get(item.key) ?? 0;
      charged += price;
      await q(
        `INSERT INTO wardrobe_items (character_id,item_key,piece_id,color,detail_color,purchased_at,price,paid_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [character.id, item.key, item.pieceId, item.color ?? null, item.detailColor ?? null, item.purchasedAt, price, character.account_id],
      );
    }
    if (charged !== receipt.charged) throw new Error("Montant d’achat incohérent.");
    const outfit = shareOutfit(receipt.equipped);
    await q("UPDATE characters SET outfit=$1::jsonb WHERE id=$2", [JSON.stringify(outfit), character.id]);
    return { outfit, added: receipt.added, charged };
  }
  /** A character may only wear pieces it owns, received, started with or already wore. */
  async function assertWearable(q: Query, character: CharacterRow, outfitInput: unknown) {
    const outfit = layersOf(outfitInput);
    const pieces = fittingCart(outfit);
    await knowPieces(pieces.map(({ piece }) => piece.id));
    const { state, worn, starter } = await commerce(q, character, 0);
    const owned = wardrobeFor(state, character.account_id, character.id, worn, starter, 0).items;
    const missing = pieces.find((entry) => !ownsVariant(owned, entry.piece.id, entry.color, entry.detailColor));
    if (missing) throw new PlayerError("Achète cet article avant de le porter.");
    // Store what the player sent (already schema-checked): readers apply the same defaults.
    return outfitInput;
  }
  async function gift(q: Query, sender: CharacterRow, recipient: string, transferId: string, key: string) {
    const previous = (await q(
      "SELECT 1 FROM profile_garment_transfers WHERE id=$1 AND sender=$2 AND recipient=$3 AND item_key=$4",
      [transferId, sender.id, recipient, key])).rows.length;
    if (previous) return;
    const { rows: [item] } = await q(
      "SELECT * FROM wardrobe_items WHERE character_id=$1 AND item_key=$2 AND purchased_at>0 FOR UPDATE",
      [sender.id, key]);
    if (!item || retiredGarments.has(item.piece_id)) throw new PlayerError("Tu ne possèdes plus cet article.");
    if ((await q("SELECT 1 FROM wardrobe_items WHERE character_id=$1 AND item_key=$2", [recipient, key])).rows.length)
      throw new PlayerError("Ce personnage possède déjà cet article.");
    await q("UPDATE wardrobe_items SET character_id=$1,purchased_at=0 WHERE character_id=$2 AND item_key=$3",
      [recipient, sender.id, key]);
    const shared = {
      key, pieceId: item.piece_id, purchasedAt: Number(item.purchased_at),
      ...(item.color && { color: item.color }), ...(item.detail_color && { detailColor: item.detail_color }),
    };
    const { rows } = await q(
      `INSERT INTO profile_garment_transfers (id,sender,recipient,item_key,purchased_at,item)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id`,
      [transferId, sender.id, recipient, key, shared.purchasedAt, JSON.stringify(shared)]);
    if (!rows.length) throw new PlayerError("Cet article a déjà été offert.");
    // The sender stops wearing a variant it no longer owns.
    const worn = layersOf(sender.outfit);
    const wearing = fittingCart(worn).some((entry) =>
      variantKey(entry.piece.id, entry.color, entry.detailColor) === key);
    if (wearing) {
      const { state, starter } = await commerce(q, { ...sender }, 0);
      const owned = wardrobeFor(state, sender.account_id, sender.id, starter, starter, 0).items;
      if (!ownsVariant(owned, item.piece_id, item.color ?? undefined, item.detail_color ?? undefined))
        await q("UPDATE characters SET outfit=$1::jsonb WHERE id=$2",
          [JSON.stringify(shareOutfit(removeGarment(worn, item.piece_id))), sender.id]);
    }
  }
  /**
   * One-time import of purchases made while the wardrobe lived in the browser.
   * Each piece is charged again at its catalogue price, so nothing can be created.
   */
  async function importLegacy(q: Query, character: CharacterRow & { wardrobe_imported?: boolean }, earnedCoins: number, legacy: z.infer<typeof legacyItemsSchema>) {
    if (character.wardrobe_imported) return { imported: 0, skipped: 0 };
    await knowPieces(legacy.map(({ pieceId }) => pieceId));
    const { state, worn, starter } = await commerce(q, character, earnedCoins);
    let owned = wardrobeFor(state, character.account_id, character.id, worn, starter, 0).items;
    let balance = state.accounts[character.account_id].balance;
    let imported = 0, skipped = 0;
    for (const entry of [...legacy].sort((a, b) => a.purchasedAt - b.purchasedAt)) {
      let piece;
      try { piece = avatarGarment(entry.pieceId); } catch { piece = undefined; }
      if (!piece || retiredGarments.has(piece.id) || ownsVariant(owned, piece.id, entry.color, entry.detailColor)) {
        skipped++;
        continue;
      }
      const price = garmentPrice(piece);
      if (!Number.isSafeInteger(price) || price < 0 || price > balance) {
        skipped++;
        continue;
      }
      const key = variantKey(piece.id, entry.color, entry.detailColor);
      const purchasedAt = entry.purchasedAt || Date.now();
      await q(
        `INSERT INTO wardrobe_items (character_id,item_key,piece_id,color,detail_color,purchased_at,price,paid_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
        [character.id, key, piece.id, entry.color ?? null, entry.detailColor ?? null, purchasedAt, price, character.account_id]);
      owned = [...owned, { key, pieceId: piece.id, color: entry.color, detailColor: entry.detailColor, purchasedAt }];
      balance -= price;
      imported++;
    }
    await q("UPDATE characters SET wardrobe_imported=TRUE WHERE id=$1", [character.id]);
    return { imported, skipped };
  }
  return { view, buy, assertWearable, gift, importLegacy };
}
