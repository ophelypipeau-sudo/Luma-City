import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyCommerce,
  wardrobeFor,
  buyOutfit,
  readCommerce,
  variantKey,
  TEST_BALANCE,
} from "../apps/web/src/shop/commerce";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
import { avatarGarment } from "../apps/web/src/avatar/catalog";
import { garmentPrice } from "../apps/web/src/shop/fashion-options";
import { starterPieces } from "../packages/contracts/src/player-account";
const account = "account",
  owner = "iris";
// Pieces currently on sale; DEFAULT_LAYERS wears the Cerise top, Dalle pants and Piste shoes.
const LIVE = {
  ...DEFAULT_LAYERS,
  top: "fashion.premium-velvet",
  outerwear: "fashion.y2k-mcbling",
  hair: "fashion.hair-01-aureole",
  bottom: "fashion.pants-rocade",
  shoes: "fashion.shoes-campus",
};
const price = (id: string) => garmentPrice(avatarGarment(id));
const newPieces = [LIVE.top, LIVE.outerwear, LIVE.hair, LIVE.bottom, LIVE.shoes];
const LIVE_TOTAL = newPieces.reduce((sum, id) => sum + price(id), 0);

test("a new player keeps the chosen starter pieces and only spends earned coins", () => {
  const starter = {
    hair: starterPieces.hair[1],
    top: starterPieces.top[1],
    bottom: starterPieces.bottom[1],
    shoes: starterPieces.shoes[1],
  };
  const initial = wardrobeFor(emptyCommerce(), account, owner, starter, starter, 0);
  assert.equal(initial.balance, 0);
  assert.equal(initial.diamonds, 0);
  assert.deepEqual(initial.items.map((item) => item.pieceId).sort(), Object.values(starter).sort());
  const earned = { ...emptyCommerce(), accounts: { [account]: { balance: 50 } } };
  const changed = wardrobeFor(earned, account, owner, DEFAULT_LAYERS, starter, 0);
  assert.equal(changed.balance, 50);
  assert.ok(Object.values(starter).every((id) => changed.items.some((item) => item.pieceId === id)));
  assert.throws(() => buyOutfit(emptyCommerce(), account, owner, { ...starter, top: LIVE.top }, starter, undefined, starter, 0), /pas assez/);
});

test("buy all debits only new variants, stores colours and equips the outfit atomically", () => {
  const draft = { ...LIVE, colors: { [LIVE.bottom]: "#ff80c0" }, detailColors: {} };
  const receipt = buyOutfit(
    { ...emptyCommerce(), accounts: { [account]: { balance: TEST_BALANCE, diamonds: 9_876_543 } } },
    account, owner, draft, DEFAULT_LAYERS,
  );
  assert.equal(receipt.charged, LIVE_TOTAL);
  assert.equal(receipt.added, newPieces.length);
  assert.equal(receipt.next.accounts[account].balance, TEST_BALANCE - LIVE_TOTAL);
  assert.deepEqual(receipt.equipped, draft);
  const restored = readCommerce(JSON.stringify(receipt.next));
  assert.equal(wardrobeFor(restored, account, owner, draft).diamonds, 9_876_543);
  assert.deepEqual(restored.wardrobes[owner].equipped, draft);
  assert.ok(restored.wardrobes[owner].items.some((i) => i.pieceId === LIVE.bottom && i.color === "#ff80c0"));
  const again = buyOutfit(restored, account, owner, draft, receipt.equipped);
  assert.equal(again.charged, 0);
  assert.equal(again.added, 0);
  const recolored = { ...draft, colors: { [LIVE.bottom]: "#151515" } };
  assert.equal(buyOutfit(restored, account, owner, recolored, draft).charged, price(LIVE.bottom),
    "another colour is another variant");
});

test("single purchase equips only that article; insufficient funds do not mutate the account", () => {
  const state = emptyCommerce();
  const receipt = buyOutfit(state, account, owner, LIVE, DEFAULT_LAYERS, LIVE.outerwear);
  assert.equal(receipt.charged, price(LIVE.outerwear));
  assert.equal(receipt.equipped.top, DEFAULT_LAYERS.top);
  assert.equal(receipt.equipped.outerwear, LIVE.outerwear);
  assert.deepEqual(state, emptyCommerce());
  const poor = { ...state, accounts: { [account]: { balance: 1 } } };
  assert.throws(() => buyOutfit(poor, account, owner, LIVE, DEFAULT_LAYERS), /pas assez/);
  assert.equal(poor.accounts[account].balance, 1);
  assert.equal(Object.keys(poor.wardrobes).length, 0);
  assert.throws(() => buyOutfit(state, account, owner, DEFAULT_LAYERS, DEFAULT_LAYERS, LIVE.top), /plus essayé/);
});

test("cart checkout leaves tried-off slots as they were worn", () => {
  const worn = { ...DEFAULT_LAYERS, colors: { [DEFAULT_LAYERS.shoes!]: "#303040" } };
  const draft = {
    ...worn, top: LIVE.top, bottom: null, shoes: null,
    colors: { [LIVE.top]: "#a83855" },
  };
  const receipt = buyOutfit(emptyCommerce(), account, owner, draft, worn);
  assert.equal(receipt.added, 1);
  assert.equal(receipt.equipped.top, draft.top);
  assert.equal(receipt.equipped.bottom, worn.bottom);
  assert.equal(receipt.equipped.shoes, worn.shoes);
  assert.deepEqual(receipt.equipped.colors, { ...worn.colors, ...draft.colors });
  assert.deepEqual(receipt.next.wardrobes[owner].equipped, receipt.equipped);
});

test("existing accepted clothes are retained; account balances and dressing owners are separate", () => {
  const current = wardrobeFor(emptyCommerce(), account, owner, LIVE);
  // Worn pieces plus the default starter pieces.
  assert.equal(current.items.length, newPieces.length + 3);
  assert.equal(variantKey(DEFAULT_LAYERS.top!), variantKey(DEFAULT_LAYERS.top!, undefined, undefined));
  const bought = buyOutfit(emptyCommerce(), account, owner, LIVE, DEFAULT_LAYERS).next;
  assert.equal(wardrobeFor(bought, "other", owner, LIVE).balance, TEST_BALANCE);
  assert.equal(wardrobeFor(bought, account, "june", DEFAULT_LAYERS).items.length, 3);
  assert.deepEqual(readCommerce("broken"), emptyCommerce());
});
