import assert from "node:assert/strict";
import test from "node:test";
import {
  ORIGINAL_OUTFIT,
  BARE_OUTFIT,
  accessorySelection,
  itemEquipped,
  type Outfit,
} from "../apps/web/src/shop/catalog";

test("jewellery, glasses and bag combine; removing glasses preserves the outfit and other accessories", () => {
  let outfit: Outfit = { ...ORIGINAL_OUTFIT };
  outfit = {
    ...outfit,
    accessories: accessorySelection(outfit.accessories, 1, "add"),
  };
  outfit = {
    ...outfit,
    accessories: accessorySelection(outfit.accessories, 2, "add"),
  };
  for (const variant of [0, 1, 2])
    assert.equal(
      itemEquipped(outfit, { category: "accessories", variant }),
      true,
    );
  outfit = {
    ...outfit,
    accessories: accessorySelection(outfit.accessories, 1, "remove"),
  };
  assert.equal(
    itemEquipped(outfit, { category: "accessories", variant: 0 }),
    true,
  );
  assert.equal(
    itemEquipped(outfit, { category: "accessories", variant: 1 }),
    false,
  );
  assert.equal(
    itemEquipped(outfit, { category: "accessories", variant: 2 }),
    true,
  );
  for (const category of ["tops", "bottoms", "shoes", "hair"] as const)
    assert.equal(outfit[category], ORIGINAL_OUTFIT[category]);
});
test("retrying an accessory is idempotent; toggling the last one off restores the empty slot", () => {
  let outfit: Outfit = { ...BARE_OUTFIT };
  outfit = {
    ...outfit,
    accessories: accessorySelection(outfit.accessories, 2, "add"),
  };
  const retry = accessorySelection(outfit.accessories, 2, "add");
  assert.equal(retry, outfit.accessories);
  outfit = { ...outfit, accessories: accessorySelection(retry, 2, "toggle") };
  assert.equal(outfit.accessories, BARE_OUTFIT.accessories);
  assert.equal(
    itemEquipped(outfit, { category: "accessories", variant: 2 }),
    false,
  );
});
