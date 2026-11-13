import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import {
  avatarCatalogSnapshot,
  avatarGarment,
} from "../apps/web/src/avatar/catalog";
import { PANTS_CAPSULE_GARMENTS } from "../apps/web/src/avatar/pants-capsule";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
import { buyOutfit, emptyCommerce } from "../apps/web/src/shop/commerce";
import { pngPixels } from "../apps/server/src/atelier-images";
import { paintColorRegions } from "../packages/domain/src/atelier-color";

test("the ten approved pants are available as front-only shop items and keep purchased dye", () => {
  const shop = avatarCatalogSnapshot();
  assert.equal(PANTS_CAPSULE_GARMENTS.length, 10);
  for (const piece of PANTS_CAPSULE_GARMENTS) {
    assert.ok(shop.some((entry) => entry.id === piece.id));
    assert.equal(avatarGarment(piece.id).slot, "bottom");
    assert.equal(piece.poseProfile?.fits["hand-on-hip"].kind, "unavailable");
    assert.equal(piece.poseProfile?.fits["heart-hands"].kind, "unavailable");
    const draft = {
      ...DEFAULT_LAYERS,
      bottom: piece.id,
      colors: { [piece.id]: "#bde8e0" },
    };
    const purchase = buyOutfit(
      emptyCommerce(),
      "test-account",
      "iris",
      draft,
      DEFAULT_LAYERS,
      piece.id,
    );
    assert.equal(purchase.charged, piece.price);
    assert.equal(purchase.equipped.bottom, piece.id);
    assert.equal(purchase.equipped.colors?.[piece.id], "#bde8e0");
  }
});

test("light and dark dye affect the fabric while preserving every protected pixel and the silhouette", () => {
  const pixels = (url: string) =>
    pngPixels(readFileSync("public" + url)).pixels;
  for (const piece of PANTS_CAPSULE_GARMENTS) {
    assert.equal(piece.art.kind, "image");
    const art = piece.art;
    const regions = art.colorMasks!;
    const source = pixels(art.front),
      main = pixels(regions.main),
      keep = pixels(regions.protected!);
    let protectedPixels = 0;
    for (const color of ["#bde8e0", "#283148"]) {
      const dyed = paintColorRegions(
        new Uint8ClampedArray(source),
        new Uint8ClampedArray(main),
        undefined,
        { ...regions, main: color },
      );
      let changed = 0;
      protectedPixels = 0;
      for (let i = 0; i < source.length; i += 4) {
        if (
          source[i + 3] !== dyed[i + 3] ||
          !!source[i + 3] !== !!(main[i + 3] || keep[i + 3])
        )
          assert.fail(`Invalid outline at ${piece.id} pixel ${i / 4}`);
        const rgbChanged =
          source[i] !== dyed[i] ||
          source[i + 1] !== dyed[i + 1] ||
          source[i + 2] !== dyed[i + 2];
        if (keep[i + 3]) {
          protectedPixels++;
          if (main[i + 3] || rgbChanged)
            assert.fail(
              `Protected detail recolored: ${piece.id} pixel ${i / 4}`,
            );
        }
        if (main[i + 3] && rgbChanged) changed++;
      }
      assert.ok(changed > 150_000, piece.id);
    }
    if (
      [
        "dalle",
        "rocade",
        "granit",
        "ruban",
        "velin",
        "indigo",
        "calcaire",
      ].some((id) => piece.id.endsWith("-" + id))
    )
      assert.ok(protectedPixels > 250, piece.id);
  }
});
