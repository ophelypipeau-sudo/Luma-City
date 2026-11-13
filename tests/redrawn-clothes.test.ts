import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { REDRAWN_ITEMS } from "../apps/web/src/avatar/redrawn-garments";
import { avatarGarment } from "../apps/web/src/avatar/catalog";
import { pngPixels } from "../apps/server/src/atelier-images";
test("all 27 replacement clothes use native independent layers on the immutable body, without any deformation mapping", () => {
  assert.equal(Object.keys(REDRAWN_ITEMS).length, 27);
  assert.equal(
    createHash("sha256")
      .update(readFileSync("public/assets/avatar/fashion-v2/body-user.png"))
      .digest("hex"),
    "8e3b61c5a45e5ddc9ee528530ced84eea3bd883a1a2e05914b81fd46e3b269e4",
  );
  for (const id of Object.keys(REDRAWN_ITEMS)) {
    const p = avatarGarment(id);
    assert.ok(p.pattern?.cut.startsWith("redrawn:"));
    assert.equal(p.art.kind, "image");
    if (p.art.kind !== "image") continue;
    assert.equal(p.art.bands, undefined);
    assert.equal(p.art.widthStops, undefined);
    assert.equal(p.art.scaleX, undefined);
    const a = pngPixels(readFileSync("public" + p.art.front));
    assert.equal(a.width, 887);
    assert.equal(a.height, 1774);
    let count = 0;
    for (let i = 3; i < a.pixels.length; i += 4) if (a.pixels[i] > 100) count++;
    assert.ok(count > 1000, id + " nonempty");
    assert.ok(p.crop[2] > 0 && p.crop[3] > 0);
    for (const pose of ["hand-on-hip", "heart-hands"] as const) {
      const fit = p.poseProfile!.fits[pose];
      if (fit.kind === "sleeves") {
        assert.ok(fit.replaceTop);
        assert.match(
          fit.sleeves!.front,
          id === "fashion.burgundy-fold-sweater"
            ? /burgundy-cut-v2/
            : /redrawn-v1/,
        );
        const image = pngPixels(readFileSync("public" + fit.sleeves!.front));
        assert.equal(image.width, 887);
        assert.equal(image.height, 1774);
      }
    }
  }
});
test("black skirts contain no pink or burgundy sleeve fragments; hand and face regions are absent from thumbnails", () => {
  for (const key of ["ribbon-skirt", "burgundy-skirt"]) {
    const p = pngPixels(
      readFileSync(`public/assets/avatar/redrawn-v1/${key}.png`),
    ).pixels;
    for (let i = 0; i < p.length; i += 4)
      if (p[i + 3] > 150)
        assert.ok(
          Math.max(...p.subarray(i, i + 3)) -
            Math.min(...p.subarray(i, i + 3)) <
            30,
          key + " other garment contamination",
        );
  }
  for (const key of [
    "burgundy",
    "lilac",
    "pink-jacket",
    "snow-top",
    "ivory-dress",
    "ribbon-cardigan",
  ]) {
    const p = pngPixels(
      readFileSync(`public/assets/avatar/redrawn-v1/${key}.png`),
    ).pixels;
    for (const [x, y] of [
      [443, 180],
      [130, 920],
      [755, 920],
    ])
      assert.equal(p[(y * 887 + x) * 4 + 3], 0, key + " excludes skin");
  }
});
