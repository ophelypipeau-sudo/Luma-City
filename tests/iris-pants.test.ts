import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { matchesWardrobeCategory } from "../apps/web/src/WardrobeCategories";
import { wearGarment } from "../apps/web/src/avatar/model";
import { paintColorRegions } from "../packages/domain/src/atelier-color";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { nativeRgba } from "../scripts/lib/png-native";

const pants = avatarCatalogSnapshot().filter(piece => piece.id.startsWith("fashion.iris-pants-"));
const read = (url: string) => {
  const image = nativeRgba(readFileSync("public" + url));
  assert.deepEqual([image.width, image.height], DOLL_PATTERN.canvas);
  return new Uint8ClampedArray(image.pixels);
};
const pixel = (x: number, y: number) => (y * DOLL_PATTERN.canvas[0] + x) * 4 + 3;

test("all ten pants stay modular and sell in the pants category", () => {
  assert.equal(pants.length, 10);
  for (const piece of pants) {
    assert.ok(matchesWardrobeCategory("bottoms", piece));
    assert.equal(piece.pattern?.bodySha256, DOLL_PATTERN.bodySha256);
    assert.equal(piece.poseProfile?.fits.front.kind, "shared");
    assert.equal(piece.poseProfile?.fits["hand-on-hip"].kind, "unavailable");
    assert.equal(piece.poseProfile?.fits["heart-hands"].kind, "unavailable");
    const look = { top: "fashion.iris-knits-tokyo", bottom: null, shoes: "fashion.iris-shoes-orbit" };
    assert.deepEqual(wearGarment(look, piece.id), { ...look, bottom: piece.id });
  }
});

test("the fabric palette preserves trims and the transparent gap below the crotch", () => {
  for (const piece of pants) {
    assert.equal(piece.art.kind, "image");
    const masks = piece.art.colorMasks;
    assert.ok(masks?.main);
    const art = read(piece.art.front);
    const main = read(masks.main), fixed = masks.protected ? read(masks.protected) : undefined;
    const detail = masks.detail ? read(masks.detail) : undefined;
    assert.equal(art[pixel(443, 1100)], 0, piece.id);
    const tinted = paintColorRegions(art.slice(), main, detail, { ...masks, main: "#eed3cc", detail: "#008060" });
    let changed = 0, secondary = 0;
    for (let i = 0; i < art.length; i += 4) {
      assert.equal(tinted[i + 3], art[i + 3]);
      assert.equal(main[i + 3] + (fixed?.[i + 3] ?? 0) + (detail?.[i + 3] ?? 0), art[i + 3] ? 255 : 0);
      if (fixed?.[i + 3]) assert.equal(tinted[i], art[i]);
      if (tinted[i] !== art[i]) changed++;
      if (detail?.[i + 3]) secondary++;
    }
    assert.ok(changed > 80_000, piece.id);
    if (detail) assert.ok(secondary > 1000, piece.id);
    if (piece.name === "Motion") {
      assert.equal(main[pixel(574, 853)], 255);
      assert.equal(main[pixel(302, 1350)], 255);
      assert.equal(detail?.[pixel(280, 850)], 255);
      assert.equal(detail?.[pixel(530, 1200)], 255);
    }
  }
});

test("the corrected hip seams cover Iris and Flow keeps the front of each slit open", () => {
  const body = read("/assets/avatar/fashion-v2/body-user.png");
  for (const name of ["Sculpt", "Flow", "Chrome", "Veil"]) {
    const piece = pants.find(p => p.name === name);
    assert.ok(piece?.art.kind === "image");
    const art = read(piece.art.front);
    for (let y = 660; y < 935; y++) {
      for (const [start, outward] of [[378, -1], [510, 1]]) {
        let x = start;
        while (body[pixel(x + outward, y)] >= 230) x += outward;
        assert.ok(art[pixel(x, y)] >= 230, `${name} at ${x},${y}`);
      }
    }
    if (name === "Flow") {
      assert.ok(piece.bodyMask);
      const coverage = read(piece.bodyMask);
      for (const x of [332, 550]) {
        assert.equal(coverage[pixel(x, 1580)], 0);
        assert.equal(art[pixel(x, 1580)], 0);
      }
      for (const x of [306, 365, 520, 579]) assert.equal(art[pixel(x, 1617)], 0);
    }
  }
});
