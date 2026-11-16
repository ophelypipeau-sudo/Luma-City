import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { DEFAULT_LAYERS, wearGarment, wornSlot } from "../apps/web/src/avatar/model";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { paintColorRegions } from "../packages/domain/src/atelier-color";
import { nativeRgba } from "../scripts/lib/png-native";

const knits = avatarCatalogSnapshot().filter(({ id }) =>
  id.startsWith("fashion.iris-knits-"),
);
const pixels = (url: string) => nativeRgba(readFileSync(`public${url}`));
const alpha = (image: Uint8Array | Uint8ClampedArray, x: number, y: number) =>
  image[(y * DOLL_PATTERN.canvas[0] + x) * 4 + 3];

test("Iris can try all ten knits over her current bottom and shoes", () => {
  assert.equal(knits.length, 10);
  for (const knit of knits) {
    assert.equal(knit.pattern?.bodySha256, DOLL_PATTERN.bodySha256);
    assert.equal(knit.poseProfile?.fits.front.kind, "shared");
    assert.equal(knit.poseProfile?.fits["hand-on-hip"].kind, "unavailable");
    assert.equal(knit.poseProfile?.fits["heart-hands"].kind, "unavailable");
    const worn = wearGarment(DEFAULT_LAYERS, knit.id);
    assert.equal(wornSlot(worn, knit.id), "top2");
    assert.equal(worn.bottom, DEFAULT_LAYERS.bottom);
    assert.equal(worn.shoes, DEFAULT_LAYERS.shoes);
  }
});

test("the knit palette covers complete sleeves and protects fastenings", () => {
  for (const knit of knits) {
    assert.equal(knit.art.kind, "image");
    const { art } = knit;
    const masks = art.colorMasks!;
    const front = pixels(art.front);
    assert.deepEqual([front.width, front.height], [...DOLL_PATTERN.canvas]);
    const main = pixels(masks.main!).pixels;
    const detail = masks.detail ? pixels(masks.detail).pixels : undefined;
    const fixed = masks.protected ? pixels(masks.protected).pixels : undefined;
    const dyed = paintColorRegions(
      new Uint8ClampedArray(front.pixels),
      new Uint8ClampedArray(main),
      detail && new Uint8ClampedArray(detail),
      { ...masks, main: "#f5eddf", detail: "#296c6c" },
    );
    assert.ok(alpha(front.pixels, 200, 750) > 240, knit.id);
    assert.ok(alpha(front.pixels, 684, 750) > 240, knit.id);
    assert.equal(alpha(front.pixels, 140, 912), 0, knit.id);
    assert.equal(alpha(front.pixels, 744, 912), 0, knit.id);
    assert.equal(Boolean(detail), knit.id.endsWith("-tokyo"));
    let detailPixels = 0;
    let changed = 0;
    for (let i = 0; i < front.pixels.length; i += 4) {
      const opacity = front.pixels[i + 3];
      assert.equal(dyed[i + 3], opacity);
      const sum = main[i + 3] + (detail?.[i + 3] ?? 0) + (fixed?.[i + 3] ?? 0);
      assert.equal(sum, opacity ? 255 : 0);
      if (detail?.[i + 3]) detailPixels++;
      if (fixed?.[i + 3]) {
        assert.equal(dyed[i], front.pixels[i]);
        assert.equal(dyed[i + 1], front.pixels[i + 1]);
        assert.equal(dyed[i + 2], front.pixels[i + 2]);
      }
      if (dyed[i] !== front.pixels[i]) changed++;
    }
    assert.ok(changed > 65_000, knit.id);
    if (detail) {
      assert.ok(detailPixels > 10_000, knit.id);
      for (const x of [252, 615]) for (const y of [923, 950, 963])
        assert.equal(alpha(front.pixels, x, y), 255, "Tokyo's hem is closed");
    }
    if (knit.id.endsWith("-eclipse")) {
      assert.equal(alpha(front.pixels, 536, 389), 0);
      assert.equal(alpha(front.pixels, 536, 400), 255);
    }
    if (knit.id.endsWith("-mila")) {
      for (const [x, y] of [[224, 580], [182, 670], [692, 655]]) {
        assert.equal(alpha(front.pixels, x, y), 255);
        assert.equal(alpha(dyed, x, y), 255);
        assert.equal(alpha(main, x, y), 255);
      }
      assert.equal(alpha(front.pixels, 290, 745), 0, "gap between the sleeves stays open");
    }
    if (knit.id.endsWith("-astral"))
      assert.equal(alpha(front.pixels, 375, 628), 0);
    if (knit.id.endsWith("-velvet-cotele"))
      assert.equal(alpha(front.pixels, 444, 386), 0);
  }
});
