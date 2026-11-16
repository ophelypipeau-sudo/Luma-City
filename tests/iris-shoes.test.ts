import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { matchesWardrobeCategory } from "../apps/web/src/WardrobeCategories";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { wearGarment } from "../apps/web/src/avatar/model";
import { colorGarment, fittingCart } from "../apps/web/src/shop/fashion-options";
import { paintColorRegions } from "../packages/domain/src/atelier-color";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { nativeRgba } from "../scripts/lib/png-native";
import { Resvg } from "@resvg/resvg-js";

const shoes = avatarCatalogSnapshot().filter(piece => piece.id.startsWith("fashion.iris-shoes-"));
const read = (url: string) => {
  const { width, height, pixels } = nativeRgba(readFileSync("public" + url));
  assert.deepEqual([width, height], DOLL_PATTERN.canvas);
  return new Uint8ClampedArray(pixels);
};

test("the ten Iris shoe pairs can be tried and recolored in the shoe category", () => {
  assert.equal(shoes.length, 10);
  for (const piece of shoes) {
    assert.ok(matchesWardrobeCategory("shoes", piece));
    assert.equal(piece.pattern?.bodySha256, DOLL_PATTERN.bodySha256);
    assert.equal(piece.poseProfile?.fits.front.kind, "shared");
    assert.equal(piece.poseProfile?.fits["hand-on-hip"].kind, "unavailable");
    assert.equal(piece.poseProfile?.fits["heart-hands"].kind, "unavailable");
    const outfit = { top: null, shoes: null, bottom: "fashion.pants-dalle" };
    const worn = colorGarment(wearGarment(outfit, piece.id), piece.id, "#efb0ad");
    const dual = piece.secondaryColor ? colorGarment(worn, piece.id, "#285f60", "detail") : worn;
    assert.equal(dual.bottom, outfit.bottom);
    const selected = fittingCart(dual).find(item => item.piece.id === piece.id);
    assert.equal(selected?.price, 900);
    assert.equal(selected?.color, "#efb0ad");
    assert.equal(selected?.detailColor, piece.secondaryColor ? "#285f60" : undefined);
  }
});

test("shoe dyes preserve the protected trims and alpha in both color zones", () => {
  for (const piece of shoes) {
    assert.equal(piece.art.kind, "image");
    const spec = piece.art.colorMasks;
    assert.ok(spec?.main && spec.protected);
    assert.equal(Boolean(spec.detail), Boolean(piece.secondaryColor));
    const original = read(piece.art.front), main = read(spec.main), fixed = read(spec.protected);
    const detail = spec.detail ? read(spec.detail) : undefined;
    const dyed = paintColorRegions(original.slice(), main, detail, { ...spec, main: "#edb0ad", detail: "#284f65" });
    let altered = 0, accents = 0, protectedPixels = 0;
    for (let i = 0; i < original.length; i += 4) {
      const opacity = original[i + 3];
      assert.equal(main[i + 3] + fixed[i + 3] + (detail?.[i + 3] ?? 0), opacity ? 255 : 0, piece.name);
      assert.equal(dyed[i + 3], opacity);
      if (fixed[i + 3]) {
        assert.equal(dyed[i], original[i]);
        assert.equal(dyed[i + 1], original[i + 1]);
        assert.equal(dyed[i + 2], original[i + 2]);
        protectedPixels++;
      }
      if (original[i] !== dyed[i]) altered++;
      if (detail?.[i + 3]) accents++;
    }
    assert.ok(altered > 2500 && protectedPixels > 150, piece.name);
    if (detail) assert.ok(accents > 350, piece.name);
  }
});

test("the rear rim of Nox sits behind the legs without masking their skin", () => {
  const nox = shoes.find(piece => piece.id === "fashion.iris-shoes-nox")!;
  assert.equal(nox.art.kind, "image");
  assert.ok(nox.art.backRegion && nox.bodyMask);
  const [width, height] = DOLL_PATTERN.canvas;
  const rear = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <path d="${nox.art.backRegion}" fill="white"/></svg>`).render().pixels;
  const art = read(nox.art.front), coverage = read(nox.bodyMask);
  const alpha = (pixels: Uint8Array | Uint8ClampedArray, x: number, y: number) => pixels[(y * width + x) * 4 + 3];
  for (const x of [333, 550]) {
    assert.ok(alpha(art, x, 1500) > 150);
    assert.equal(alpha(rear, x, 1500), 255);
    assert.equal(alpha(coverage, x, 1500), 0);
    assert.equal(alpha(rear, x, 1520), 0);
    assert.equal(alpha(coverage, x, 1520), 255);
  }
});
