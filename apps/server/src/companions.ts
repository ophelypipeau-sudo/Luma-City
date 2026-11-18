import { randomUUID } from "node:crypto";
import type { CompanionCollection, OwnedCompanion } from "../../../packages/contracts/src/companions.ts";
import { companionModel } from "../../../packages/domain/src/companions.ts";
import type { Query } from "./db.ts";

const fields = 'id, model_id AS "modelId", name';

export async function companionCollection(q: Query, characterId: string): Promise<CompanionCollection> {
  const { rows } = await q(
    `SELECT ${fields}, equipped FROM companions WHERE character_id=$1 ORDER BY purchased_at, id`, [characterId],
  );
  const items: OwnedCompanion[] = rows.map(({ id, modelId, name }) => ({ id, modelId, name }));
  return { items, equipped: items[rows.findIndex(({ equipped }) => equipped)] ?? null };
}

/** The caller holds the same account lock as a clothing purchase. */
export async function buyCompanion(q: Query, characterId: string, account: string, modelId: string, name: string, balance: number) {
  const model = companionModel(modelId);
  if (!model?.active) throw new Error("Cet animal est indisponible.");
  const { rows: [owned] } = await q(
    `SELECT ${fields} FROM companions WHERE character_id=$1 AND model_id=$2`, [characterId, modelId],
  );
  if (owned) return { animal: owned as OwnedCompanion, charged: 0, balance };
  if (model.price > balance) throw new Error("Tu n’as pas assez de pièces.");
  const id = randomUUID();
  await q("INSERT INTO companions (id,character_id,model_id,name,price,paid_by) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, characterId, modelId, name, model.price, account]);
  return { animal: { id, modelId, name }, charged: model.price, balance: balance - model.price };
}

export async function equipCompanion(q: Query, characterId: string, id: string | null) {
  if (id) {
    const { rows } = await q("SELECT id FROM companions WHERE id=$1 AND character_id=$2", [id, characterId]);
    if (!rows.length) throw new Error("Cet animal ne fait pas partie de ta collection.");
  }
  await q("UPDATE companions SET equipped=FALSE WHERE character_id=$1 AND equipped", [characterId]);
  if (id) await q("UPDATE companions SET equipped=TRUE WHERE id=$1 AND character_id=$2", [id, characterId]);
  return companionCollection(q, characterId);
}

export async function renameCompanion(q: Query, characterId: string, id: string, name: string) {
  const { rows } = await q(
    "UPDATE companions SET name=$1 WHERE id=$2 AND character_id=$3 RETURNING id", [name, id, characterId],
  );
  if (!rows.length) throw new Error("Cet animal ne fait pas partie de ta collection.");
  return companionCollection(q, characterId);
}
