import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyCommerce,
  wardrobeFor,
  buyOutfit,
  applyGarmentTransfers,
  applyWheelPayouts,
  readCommerce,
  variantKey,
  TEST_BALANCE,
} from "../apps/web/src/shop/commerce";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
import { LEOPARD_LAYERS } from "../apps/web/src/avatar/leopard";
import { starterPieces } from "../packages/contracts/src/player-account";
const account = "account",
  owner = "iris";
test("a new player keeps the chosen starter pieces and only receives earned coins", () => {
  const starter = {
    hair: starterPieces.hair[1],
    top: starterPieces.top[1],
    bottom: starterPieces.bottom[1],
    shoes: starterPieces.shoes[1],
  };
  const empty = emptyCommerce();
  const initial = wardrobeFor(empty, account, owner, starter, starter, 0);
  assert.equal(initial.balance, 0);
  assert.equal(initial.diamonds, 0);
  assert.deepEqual(initial.items.map(item => item.pieceId).sort(), Object.values(starter).sort());
  const paid = applyWheelPayouts(empty, account, 50, 0, 0);
  const changed = wardrobeFor(paid, account, owner, DEFAULT_LAYERS, starter, 0);
  assert.equal(changed.balance, 50);
  assert.ok(Object.values(starter).every(id => changed.items.some(item => item.pieceId === id)));
});
test("a gifted variant leaves the sender and can be worn by the recipient without paying again", () => {
  const id = LEOPARD_LAYERS.belt!;
  const draft = { ...DEFAULT_LAYERS, belt: id, colors: { [id]: "#80a0d0" } };
  const bought = buyOutfit(emptyCommerce(), account, owner, draft, DEFAULT_LAYERS);
  const item = bought.next.wardrobes[owner].items.find((entry) => entry.pieceId === id)!;
  const transfer = { id: "transfer", sender: owner, recipient: "june", item };
  const sent = applyGarmentTransfers(bought.next, owner, owner, [transfer], DEFAULT_LAYERS);
  assert.equal(sent.wardrobes[owner].equipped?.belt, null);
  assert.ok(!sent.wardrobes[owner].items.some((entry) => entry.key === item.key));
  const received = applyGarmentTransfers(sent, "june", "june", [transfer, transfer], DEFAULT_LAYERS);
  assert.equal(received.wardrobes.june.items.filter((entry) => entry.key === item.key).length, 1);
  assert.equal(buyOutfit(received, "other", "june", draft, DEFAULT_LAYERS, id).charged, 0);
});
test("buy all debits only new variants, stores both colours and equips the outfit atomically", () => {
  const draft = {
    ...LEOPARD_LAYERS,
    colors: { [LEOPARD_LAYERS.bottom!]: "#ff80c0" },
    detailColors: { [LEOPARD_LAYERS.bottom!]: "#ffffff" },
  };
  const receipt = buyOutfit(
    {
      ...emptyCommerce(),
      accounts: { [account]: { balance: TEST_BALANCE, diamonds: 9_876_543 } },
    },
    account,
    owner,
    draft,
    DEFAULT_LAYERS,
  );
  assert.equal(receipt.charged, 2450);
  assert.equal(receipt.added, 4);
  assert.equal(receipt.next.accounts[account].balance, TEST_BALANCE - 2450);
  assert.deepEqual(receipt.equipped, draft);
  const restored = readCommerce(JSON.stringify(receipt.next));
  assert.equal(wardrobeFor(restored, account, owner, draft).diamonds, 9_876_543);
  assert.deepEqual(restored.wardrobes[owner].equipped, draft);
  assert.ok(
    restored.wardrobes[owner].items.some(
      (i) =>
        i.pieceId === LEOPARD_LAYERS.bottom &&
        i.color === "#ff80c0" &&
        i.detailColor === "#ffffff",
    ),
  );
  const again = buyOutfit(restored, account, owner, draft, receipt.equipped);
  assert.equal(again.charged, 0);
  assert.equal(again.added, 0);
  const recolored = {
    ...draft,
    detailColors: { [LEOPARD_LAYERS.bottom!]: "#151515" },
  };
  assert.equal(
    buyOutfit(restored, account, owner, recolored, draft).charged,
    850,
  );
});
test("single purchase equips only that article; insufficient funds do not mutate the account", () => {
  const state = emptyCommerce();
  const receipt = buyOutfit(
    state,
    account,
    owner,
    LEOPARD_LAYERS,
    DEFAULT_LAYERS,
    LEOPARD_LAYERS.belt!,
  );
  assert.equal(receipt.charged, 300);
  assert.equal(receipt.equipped.top, DEFAULT_LAYERS.top);
  assert.equal(receipt.equipped.belt, LEOPARD_LAYERS.belt);
  assert.deepEqual(state, emptyCommerce());
  const poor = { ...state, accounts: { [account]: { balance: 1 } } };
  assert.throws(
    () => buyOutfit(poor, account, owner, LEOPARD_LAYERS, DEFAULT_LAYERS),
    /pas assez/,
  );
  assert.equal(poor.accounts[account].balance, 1);
  assert.equal(Object.keys(poor.wardrobes).length, 0);
});
test("cart checkout leaves tried-off slots as they were worn", () => {
  const worn = { ...DEFAULT_LAYERS, colors: { [DEFAULT_LAYERS.shoes!]: "#303040" } };
  const draft = {
    ...worn, top: LEOPARD_LAYERS.top, bottom: null, shoes: null,
    colors: { [LEOPARD_LAYERS.top!]: "#a83855" },
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
  const current = wardrobeFor(emptyCommerce(), account, owner, LEOPARD_LAYERS);
  assert.equal(current.items.length, 7);
  assert.equal(
    variantKey(DEFAULT_LAYERS.top!),
    variantKey(DEFAULT_LAYERS.top!, undefined, undefined),
  );
  const bought = buyOutfit(
    emptyCommerce(),
    account,
    owner,
    LEOPARD_LAYERS,
    DEFAULT_LAYERS,
  ).next;
  assert.equal(
    wardrobeFor(bought, "other", owner, LEOPARD_LAYERS).balance,
    TEST_BALANCE,
  );
  assert.equal(
    wardrobeFor(bought, account, "june", DEFAULT_LAYERS).items.length,
    3,
  );
  assert.deepEqual(readCommerce("broken"), emptyCommerce());
});
