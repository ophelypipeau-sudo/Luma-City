import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NeighborhoodMap } from "../apps/web/src/NeighborhoodMap";
import { clearHomeDraft, draftToRestore, homeDraftKey, readHomeDraft, writeHomeDraft } from "../apps/web/src/housing/home-draft";
import { saveSignature } from "../apps/web/src/housing/home-state";
import type { HomeDecoration, HomeSnapshot } from "../packages/contracts/src/housing";

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
const decoration: HomeDecoration = { wall: "sage", floor: "oak", placements: [{ itemId: randomUUID(), x: 110, y: 433, depth: 0 }] };
const home: HomeSnapshot = { homeId: "home", ownerId: "iris", roomId: "room", revision: 9,
  inventoryComplete: true, decoration: { ...decoration, wall: "ivory" }, items: [] };

test("Un brouillon survit à la navigation et conserve sa révision pour détecter les conflits", () => {
  const cache = storage();
  assert.equal(writeHomeDraft(cache, "iris", decoration, 8, null, false), true);
  const recovered = draftToRestore(home, readHomeDraft(cache, "iris"));
  assert.deepEqual(recovered?.decoration, decoration);
  assert.equal(recovered?.expectedRevision, 8);
  assert.equal(readHomeDraft(cache, "june"), null);
  clearHomeDraft(cache, "iris");
  assert.equal(readHomeDraft(cache, "iris"), null);
});
test("Une sauvegarde incertaine conserve son identifiant et reste vérifiable après restauration", () => {
  const cache = storage(), pending = { signature: saveSignature(decoration, 8), operationId: randomUUID() };
  writeHomeDraft(cache, "iris", decoration, 8, pending, true);
  const recovered = draftToRestore({ ...home, decoration }, readHomeDraft(cache, "iris"));
  assert.deepEqual(recovered?.pending, pending);
  assert.equal(recovered?.unconfirmed, true);
  writeHomeDraft(cache, "iris", { ...decoration, wall: "lilac" }, 8, pending, true);
  assert.equal(readHomeDraft(cache, "iris")?.pending, null);
  assert.equal(readHomeDraft(cache, "iris")?.unconfirmed, false);
});
test("Un brouillon déjà enregistré est écarté ; un cache corrompu ou indisponible ne bloque pas la maison", () => {
  const cache = storage();
  writeHomeDraft(cache, "iris", home.decoration, 8, null, false);
  assert.equal(draftToRestore(home, readHomeDraft(cache, "iris")), null);
  cache.setItem(homeDraftKey("iris"), "invalid json");
  assert.equal(readHomeDraft(cache, "iris"), null);
  cache.setItem(homeDraftKey("iris"), JSON.stringify({ decoration: { wall: "invalid" } }));
  assert.equal(readHomeDraft(cache, "iris"), null);
  const unavailable = { ...cache, setItem() { throw new Error("quota"); } };
  assert.equal(writeHomeDraft(unavailable, "iris", decoration, 8, null, false), false);
});
test("La carte annonce la connexion requise pour la maison et son ouverture pour un joueur connecté", () => {
  const props = { onGift() {}, roomCounts: {}, onEnter() {}, onShop() {} };
  const guest = renderToStaticMarkup(React.createElement(NeighborhoodMap, props));
  assert.match(guest, /Ma maison · Connexion requise/);
  assert.doesNotMatch(guest, /Ma maison · Bientôt/);
  const player = renderToStaticMarkup(React.createElement(NeighborhoodMap, { ...props, onHome() {} }));
  assert.doesNotMatch(player, /Ma maison · Connexion requise/);
});

test("Les anciens essais de fenêtres sont écartés sans perdre un brouillon mural ni une confirmation incertaine", () => {
  const windows = [{ id: randomUUID(), modelId: "arch-ivory" as const, x: 500, y: 300 }];
  const retired = { expectedRevision: home.revision, decoration: { ...home.decoration, windows }, pending: null, unconfirmed: false };
  assert.equal(draftToRestore(home, retired), null);
  const recovered = draftToRestore(home, { ...retired, decoration: { ...retired.decoration, wall: "lilac" } });
  assert.equal(recovered?.decoration.wall, "lilac");assert.equal(recovered?.decoration.windows, undefined);
  const pending = { signature: saveSignature(retired.decoration, home.revision), operationId: randomUUID() };
  const uncertain = draftToRestore(home, { ...retired, pending, unconfirmed: true });
  assert.deepEqual(uncertain?.pending, pending);assert.deepEqual(uncertain?.decoration.windows, windows);
});
