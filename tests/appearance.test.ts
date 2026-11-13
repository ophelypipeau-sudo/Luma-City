import assert from "node:assert/strict";
import test from "node:test";
import { MORPHOLOGIES, DOLL_IDS } from "../apps/web/src/cartoon/model";
import {
  BARE_OUTFIT,
  ORIGINAL_OUTFIT,
  catalogFor,
} from "../apps/web/src/shop/catalog";
import {
  createLegacyAppearance,
  changeMorphology,
  equipmentFromLegacy,
  outfitForLegacyRenderer,
  withLegacyOutfit,
  saveLook,
  applyLook,
  type AvatarAppearance,
} from "../apps/web/src/cartoon/appearance";

for (const characterId of DOLL_IDS) {
  test(`${characterId}: all current colours, wigs, accessory combinations and empty slots survive the legacy bridge`, () => {
    for (let tops = -1; tops < 3; tops++)
      for (let bottoms = -1; bottoms < 3; bottoms++)
        for (let shoes = -1; shoes < 3; shoes++)
          for (const hair of [-1, 0])
            for (const accessories of [-1, 1, 2, 3, 4, 5, 6, 7]) {
              const outfit = { tops, bottoms, shoes, hair, accessories };
              assert.deepEqual(
                outfitForLegacyRenderer(
                  createLegacyAppearance(characterId, outfit),
                ),
                outfit,
              );
            }
    assert.deepEqual(
      outfitForLegacyRenderer(createLegacyAppearance(characterId, BARE_OUTFIT)),
      BARE_OUTFIT,
    );
  });

  test(`${characterId}: changing between all six body types preserves identity, exact pieces and saved looks`, () => {
    let original = createLegacyAppearance(characterId, {
      tops: 2,
      bottoms: 1,
      shoes: 2,
      hair: 0,
      accessories: 7,
    });
    original = saveLook(original, "soir", "Ma tenue du soir");
    original = withLegacyOutfit(original, ORIGINAL_OUTFIT);
    original = saveLook(original, "jour", "Ma tenue de jour");
    const before = JSON.stringify(original);
    let changed = original;
    for (const { id } of [...MORPHOLOGIES, ...[...MORPHOLOGIES].reverse()]) {
      changed = changeMorphology(changed, id);
      assert.deepEqual(changed.body, { kind: "morphology", morphologyId: id });
      assert.strictEqual(changed.identity, original.identity);
      assert.strictEqual(changed.equipped, original.equipped);
      assert.strictEqual(changed.looks, original.looks);
      const looked = applyLook(changed, "soir");
      assert.deepEqual(looked.equipped, original.looks[0].equipped);
      assert.strictEqual(looked.body, changed.body);
      assert.strictEqual(looked.identity, original.identity);
      assert.deepEqual(
        JSON.parse(JSON.stringify(looked)).equipped,
        looked.equipped,
      );
    }
    assert.equal(
      JSON.stringify(original),
      before,
      "input appearance is never mutated",
    );
  });
}

test("a piece has the same identity even when the legacy colour index differs between wearers", () => {
  const irisIvory = equipmentFromLegacy("iris", { ...BARE_OUTFIT, bottoms: 1 });
  const juneIvory = equipmentFromLegacy("june", { ...BARE_OUTFIT, bottoms: 0 });
  assert.equal(irisIvory.bottoms, "pleated-skirt.ivory");
  assert.equal(irisIvory.bottoms, juneIvory.bottoms);
  assert.notEqual(
    irisIvory.bottoms,
    equipmentFromLegacy("iris", { ...BARE_OUTFIT, bottoms: 0 }).bottoms,
  );
  const june = {
    ...createLegacyAppearance("june", BARE_OUTFIT),
    equipped: irisIvory,
  };
  assert.equal(outfitForLegacyRenderer(june).bottoms, 0);
});

test("current catalogue entries and history aliases stay compatible; shared ids never mix categories", () => {
  const categories = new Map<string, string>();
  for (const character of DOLL_IDS) {
    const items = catalogFor(character);
    assert.equal(items.length, 13);
    assert.equal(new Set(items.map((item) => item.id)).size, 13);
    for (const item of items) {
      assert.equal(item.id, `${character}-${item.category}-${item.variant}`);
      assert.ok(!DOLL_IDS.some((id) => item.pieceId.includes(id)));
      if (categories.has(item.pieceId))
        assert.equal(categories.get(item.pieceId), item.category);
      categories.set(item.pieceId, item.category);
    }
  }
});

test("missing or future fits report an error without deleting equipment or silently rendering another silhouette", () => {
  const original = createLegacyAppearance("iris");
  const future: AvatarAppearance = {
    ...original,
    equipped: { ...original.equipped, tops: "future-shirt.blue" },
  };
  const saved = saveLook(future, "future", "Import à calibrer");
  const selected = changeMorphology(saved, "8");
  assert.equal(selected.equipped.tops, "future-shirt.blue");
  assert.equal(selected.looks[0].equipped.tops, "future-shirt.blue");
  assert.throws(
    () => outfitForLegacyRenderer(selected),
    /calibrated v6 fit not available/,
  );
  assert.throws(() => outfitForLegacyRenderer(future), /No legacy tops fit/);
  assert.equal(future.equipped.tops, "future-shirt.blue");
  assert.throws(
    () => equipmentFromLegacy("iris", { ...ORIGINAL_OUTFIT, tops: 55 }),
    /Unknown legacy/,
  );
});

test("saving and updating a look keeps separate snapshots and applying it never changes the body", () => {
  const first = saveLook(
    createLegacyAppearance("iris"),
    "daily",
    " Quotidien ",
  );
  assert.equal(first.looks[0].name, "Quotidien");
  assert.notStrictEqual(
    first.looks[0].equipped.accessories,
    first.equipped.accessories,
  );
  const bare = withLegacyOutfit(first, BARE_OUTFIT);
  assert.deepEqual(
    first.looks[0].equipped,
    createLegacyAppearance("iris").equipped,
  );
  const replaced = saveLook(bare, "daily", "Nouveau quotidien");
  assert.equal(replaced.looks.length, 1);
  assert.deepEqual(replaced.looks[0].equipped, bare.equipped);
  assert.notDeepEqual(first.looks[0], replaced.looks[0]);
  const shaped = changeMorphology(first, "A");
  assert.strictEqual(applyLook(shaped, "daily").body, shaped.body);
  assert.throws(() => applyLook(shaped, "missing"), /Unknown look/);
  assert.throws(() => saveLook(first, "", ""), /needs an id/);
});
