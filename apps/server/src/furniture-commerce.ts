import { randomUUID } from "node:crypto";
import type { Query } from "./db.ts";
import { PlayerError } from "./wardrobe.ts";
import { furnitureModel } from "../../../packages/domain/src/housing.ts";
import type { buyFurnitureSchema, FurnitureOffer } from "../../../packages/contracts/src/housing.ts";
import { ensureHome, homeSnapshot } from "./housing.ts";

export async function furnitureOffers(q: Query, preview: boolean): Promise<FurnitureOffer[]> {
  if (!preview) return [];
  const { rows } = await q(`SELECT model_id AS "modelId", version, price FROM furniture_offers
    WHERE enabled AND approved ORDER BY model_id`);
  return rows.filter((offer) => furnitureModel(offer.modelId));
}

/** Caller holds the account row lock, active-session validation and a DB transaction. */
export async function buyFurniture(q: Query, account: string, character: string, balance: number,
  input: ReturnType<typeof buyFurnitureSchema.parse>, preview: boolean) {
  const { rows: [previous] } = await q(`SELECT character_id,model_id,offer_version,price,item_id
    FROM furniture_purchases WHERE paid_by=$1 AND operation_id=$2`, [account, input.operationId]);
  if (previous) {
    if (previous.character_id !== character || previous.model_id !== input.modelId ||
      previous.offer_version !== input.offerVersion || previous.price !== input.expectedPrice)
      throw new PlayerError("Cette commande correspond déjà à un autre achat.");
    return { itemId: previous.item_id as string, price: previous.price as number, charged: 0,
      replayed: true, balance, home: await homeSnapshot(q, character) };
  }
  if (!preview) throw new PlayerError("Les meubles ne sont pas encore en vente.");
  const { rows: [offer] } = await q(`SELECT version,price,enabled,approved FROM furniture_offers WHERE model_id=$1 FOR SHARE`, [input.modelId]);
  if (!furnitureModel(input.modelId) || !offer?.enabled || !offer.approved)
    throw new PlayerError("Ce meuble n’est pas disponible à l’achat.");
  if (offer.version !== input.offerVersion || offer.price !== input.expectedPrice)
    throw new PlayerError("Cette offre a changé. Actualise le catalogue avant de confirmer.");
  if (balance < offer.price) throw new PlayerError("Tu n’as pas assez de pièces.");
  await ensureHome(q, character);
  const id = randomUUID();
  await q("INSERT INTO furniture_items (id,owner_character_id,model_id) VALUES ($1,$2,$3)", [id, character, input.modelId]);
  await q(`INSERT INTO furniture_purchases (paid_by,operation_id,character_id,model_id,offer_version,price,item_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7)`, [account, input.operationId, character, input.modelId, offer.version, offer.price, id]);
  return { itemId: id, price: offer.price as number, charged: offer.price as number, replayed: false,
    balance: balance - offer.price, home: await homeSnapshot(q, character) };
}
