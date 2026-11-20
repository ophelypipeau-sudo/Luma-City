import { z } from "zod";
import type { Query } from "./db";
import { FINISH_OFFER_VERSION, DECORATION_FINISHES, homeFinish, STARTER_FINISHES } from "../../../packages/domain/src/home-finishes";
import { PlayerError } from "./wardrobe";

export const buyHomeFinishSchema = z.object({ generation: z.number().int(), operationId: z.uuid(),
  finishId: z.string().max(80), offerVersion: z.string().max(60), expectedPrice: z.number().int().positive() }).strict();
export async function ownedHomeFinishes(q: Query, character: string) {
  const { rows } = await q("SELECT finish_id FROM home_finish_items WHERE character_id=$1 ORDER BY finish_id", [character]);
  return [...STARTER_FINISHES, ...rows.map((r) => r.finish_id as string)];
}
export async function homeFinishCatalog(q: Query, character: string, balance: number) {
  return { offers: DECORATION_FINISHES.map((f) => ({ ...f, version: FINISH_OFFER_VERSION })),
    owned: await ownedHomeFinishes(q, character), balance };
}
/** Caller holds the shared account lock and transaction, like fashion and animal purchases. */
export async function buyHomeFinish(q: Query, account: string, character: string, balance: number, input: z.infer<typeof buyHomeFinishSchema>) {
  const { rows: [previous] } = await q("SELECT character_id,finish_id,offer_version,price FROM home_finish_purchases WHERE paid_by=$1 AND operation_id=$2", [account,input.operationId]);
  if (previous) {
    if (previous.character_id !== character || previous.finish_id !== input.finishId || previous.offer_version !== input.offerVersion || previous.price !== input.expectedPrice)
      throw new PlayerError("Cette commande correspond à un autre achat.");
    return { ...await homeFinishCatalog(q,character,balance), charged: 0, replayed: true };
  }
  const finish = homeFinish(input.finishId);
  if (finish?.kind === "window") throw new PlayerError("Les fenêtres seront intégrées aux meubles. Leur achat est désactivé pour le moment.");
  if (!finish || !finish.price) throw new PlayerError("Ce revêtement n’est pas proposé à l’achat.");
  if (input.offerVersion !== FINISH_OFFER_VERSION || input.expectedPrice !== finish.price)
    throw new PlayerError("Cette offre a changé. Actualise la boutique.");
  if ((await ownedHomeFinishes(q,character)).includes(finish.id))
    return { ...await homeFinishCatalog(q,character,balance), charged: 0, replayed: false };
  if (balance < finish.price) throw new PlayerError("Tu n’as pas assez de pièces.");
  await q("INSERT INTO home_finish_items(character_id,finish_id) VALUES ($1,$2)", [character,finish.id]);
  await q("INSERT INTO home_finish_purchases(paid_by,operation_id,character_id,finish_id,offer_version,price) VALUES ($1,$2,$3,$4,$5,$6)", [account,input.operationId,character,finish.id,input.offerVersion,finish.price]);
  return { ...await homeFinishCatalog(q,character,balance-finish.price), charged: finish.price, replayed: false };
}
