import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { DEFAULT_LAYERS, wearGarment } from "../apps/web/src/avatar/model";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { paintColorRegions } from "../packages/domain/src/atelier-color";
import { nativeRgba } from "../scripts/lib/png-native";

const root = "/assets/avatar/capsule-robes-iris-v2/";
const pieces = avatarCatalogSnapshot().filter(
  (piece) => piece.art.kind === "image" && piece.art.front.startsWith(root),
);
const pixels = (url: string) => nativeRgba(readFileSync(`public${url}`));
const alphaAt = (art: Uint8Array, x: number, y: number) =>
  art[(y * DOLL_PATTERN.canvas[0] + x) * 4 + 3];

test("the ten capsule dresses are available as Iris front-only shop pieces", () => {
  assert.equal(pieces.length, 10);
  assert.equal(new Set(pieces.map(({ id }) => id)).size, 10);
  for (const piece of pieces) {
    assert.equal(piece.isDress, true);
    assert.equal(piece.pattern?.bodySha256, DOLL_PATTERN.bodySha256);
    assert.equal(piece.poseProfile?.fits.front.kind, "shared");
    assert.equal(piece.poseProfile?.fits["hand-on-hip"].kind, "unavailable");
    assert.equal(piece.poseProfile?.fits["heart-hands"].kind, "unavailable");
    const dressed = wearGarment(DEFAULT_LAYERS, piece.id);
    assert.equal(dressed.top, piece.id);
    assert.equal(dressed.bottom, null);
    assert.equal(dressed.hair, DEFAULT_LAYERS.hair);
    assert.equal(dressed.shoes, DEFAULT_LAYERS.shoes);
  }
});

test("the native material masks preserve hardware, alpha and open waist cutouts", () => {
  for (const piece of pieces) {
    assert.equal(piece.art.kind, "image");
    const { art } = piece;
    const masks = art.colorMasks!;
    const front = pixels(art.front);
    const back = art.back ? pixels(art.back).pixels : undefined;
    const main = pixels(masks.main!).pixels;
    const detail = masks.detail ? pixels(masks.detail).pixels : undefined;
    const fixed = masks.protected ? pixels(masks.protected).pixels : undefined;
    const cover = pixels(piece.bodyMask!).pixels;
    assert.deepEqual([front.width, front.height], [...DOLL_PATTERN.canvas]);
    assert.equal(Boolean(detail), Boolean(piece.secondaryColor));
    const switched = paintColorRegions(
      new Uint8ClampedArray(front.pixels),
      new Uint8ClampedArray(main),
      detail && new Uint8ClampedArray(detail),
      { ...masks, main: "#f4eddf", detail: "#267f73" },
    );
    let changed = 0;
    for (let i = 0; i < main.length; i += 4) {
      const a = front.pixels[i + 3];
      const sum = main[i + 3] + (detail?.[i + 3] ?? 0) + (fixed?.[i + 3] ?? 0);
      if (a || back?.[i + 3]) assert.equal(sum, 255, piece.id);
      if (sum) assert.ok(a || back?.[i + 3], piece.id);
      if (cover[i + 3]) assert.ok(a >= 250, piece.id);
      if (a !== switched[i + 3]) assert.fail(`Alpha changed for ${piece.id}`);
      if (fixed?.[i + 3]) {
        assert.deepEqual(
          switched.subarray(i, i + 3),
          new Uint8ClampedArray(front.pixels.subarray(i, i + 3)),
        );
      }
      if (a && switched[i] !== front.pixels[i]) changed++;
    }
    assert.ok(changed > 65_000, piece.id);
    if (piece.id.endsWith("-mira")) {
      assert.equal(alphaAt(front.pixels, 510, 596), 0);
      assert.equal(alphaAt(front.pixels, 514, 642), 0);
      assert.ok(alphaAt(fixed!, 491, 611) > 0);
    }
  }
});
