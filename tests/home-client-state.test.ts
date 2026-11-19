import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { reconcileHome, canVerifySave, saveSignature } from "../apps/web/src/housing/home-state.ts";
import { housingRequest, HousingRequestError } from "../apps/web/src/housing/home-http.ts";
import type { HomeSnapshot } from "../packages/contracts/src/housing.ts";

function snapshot(): HomeSnapshot {
  return { homeId: "home", ownerId: "iris", roomId: "room", revision: 1, inventoryComplete: true,
    decoration: { wall: "ivory", floor: "oak", placements: [{ itemId: "placed", x: 110, y: 433, depth: 0 }] },
    items: [{ id: "placed", modelId: "plant", roomId: "room" }, { id: "stored", modelId: "sofa", roomId: null },
      { id: "elsewhere", modelId: "mirror", roomId: "other-room" }] };
}
test("Un décor reçu ajoute les nouveaux exemplaires sans perdre l’inventaire privé ou les autres pièces", () => {
  const old = snapshot();
  const broadcast: HomeSnapshot = { ...old, revision: 2, inventoryComplete: false,
    decoration: { ...old.decoration, placements: [{ itemId: "new", x: 835, y: 433, depth: 0 }] },
    items: [{ id: "new", modelId: "plant", roomId: "room" }] };
  const owner = reconcileHome(old, broadcast, true);
  assert.equal(owner.items.length, 4);
  assert.equal(owner.items.find((i) => i.id === "new")?.roomId, "room");
  assert.equal(owner.items.find((i) => i.id === "placed")?.roomId, null);
  assert.equal(owner.items.find((i) => i.id === "stored")?.roomId, null);
  assert.equal(owner.items.find((i) => i.id === "elsewhere")?.roomId, "other-room");
  const visitor = reconcileHome(old, broadcast, false);
  assert.deepEqual(visitor.items.map((i) => i.id), ["new"]);
});
test("La reconnexion actualise l’inventaire même à révision de décor identique, sans accepter une version ancienne", () => {
  const old = snapshot(), current = { ...old, items: [...old.items, { id: "purchase", modelId: "painting", roomId: null }] };
  assert.equal(reconcileHome(old, current, true).items.length, 4);
  assert.strictEqual(reconcileHome(current, { ...old, revision: 0 }, true), current);
  assert.strictEqual(reconcileHome(current, { ...old, ownerId: "june" }, true), current);
});
test("Une confirmation de sauvegarde perdue reste vérifiable malgré la nouvelle révision diffusée", () => {
  const home = snapshot(), signature = saveSignature(home.decoration, 1);
  const pending = { signature, operationId: randomUUID() };
  const broadcast = { ...home, revision: 2 };
  assert.notEqual(broadcast.revision, 1);
  assert.equal(canVerifySave(true, pending, saveSignature(home.decoration, 1)), true);
  assert.equal(canVerifySave(true, pending, saveSignature({ ...home.decoration, wall: "sage" }, 1)), false);
  assert.equal(canVerifySave(false, pending, signature), false);
});
test("Les demandes de maison distinguent un refus explicite d’une confirmation inconnue", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ error: "Fonds insuffisants" }), { status: 400 }));
  await assert.rejects(housingRequest("buy", {}), (error: unknown) => error instanceof HousingRequestError && error.rejected);
  t.mock.restoreAll();
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ error: "Confirmation perdue" }), { status: 504 }));
  await assert.rejects(housingRequest("save", {}), (error: unknown) => error instanceof HousingRequestError && !error.rejected);
});
test("Un serveur silencieux libère le formulaire sans transformer le délai en refus d’achat", async (t) => {
  t.mock.method(globalThis, "fetch", (_url: unknown, init: RequestInit) => new Promise((_resolve, reject) => {
    init.signal!.addEventListener("abort", () => reject(new DOMException("timeout", "TimeoutError")), { once: true });
  }));
  const keepAlive = setTimeout(() => {}, 1000);
  try {
    await assert.rejects(housingRequest("save", { operationId: randomUUID() }, { timeoutMs: 20 }),
      (error: unknown) => error instanceof HousingRequestError && !error.rejected && error.message.includes("Confirmation non reçue"));
  } finally { clearTimeout(keepAlive); }
});
