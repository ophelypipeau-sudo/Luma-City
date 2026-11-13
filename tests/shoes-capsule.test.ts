import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { pngPixels } from "../apps/server/src/atelier-images";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { SHOES_CAPSULE_GARMENTS } from "../apps/web/src/avatar/shoes-capsule";
import { paintColorRegions } from "../packages/domain/src/atelier-color";

test("approved shoes are sold individually and dye keeps protected details and the outline", () => {
  assert.equal(SHOES_CAPSULE_GARMENTS.length, 10);
  const ids = new Set(avatarCatalogSnapshot().map(({ id }) => id));
  const read = (url: string) => new Uint8ClampedArray(pngPixels(readFileSync("public" + url)).pixels);
  for (const piece of SHOES_CAPSULE_GARMENTS) {
    assert.ok(ids.has(piece.id));
    assert.equal(piece.slot, "shoes");
    assert.equal(piece.behindBottom, true);
    assert.equal(piece.art.kind, "image");
    const regions = piece.art.colorMasks!;
    const original = read(piece.art.front), mask = read(regions.main), keep = read(regions.protected!);
    const dyed = paintColorRegions(original.slice(), mask, undefined, { ...regions, main: "#aa8ed4" });
    let dyedCount=0, fixedCount=0;
    for(let i=0;i<original.length;i+=4) {
      if (original[i+3] !== dyed[i+3] || !!original[i+3] !== !!(mask[i+3] || keep[i+3]))
        assert.fail(`${piece.name}: outline changed`);
      const changed=original[i]!==dyed[i] || original[i+1]!==dyed[i+1] || original[i+2]!==dyed[i+2];
      if (keep[i+3]) {
        fixedCount++;
        if(mask[i+3] || changed) assert.fail(`${piece.name}: protected detail changed`);
      }
      if (mask[i+3] && changed) dyedCount++;
    }
    assert.ok(dyedCount>2500 && fixedCount>10, piece.name);
  }
});

test("the recolor reaches the visible front sole as well as the toe and tongue on both feet", () => {
  const cases = [
    { id: "campus", samples: [[333, 1674], [553, 1674], [333, 1690], [333, 1708], [553, 1708], [333, 1732], [553, 1732]], color: "#a57143" },
    { id: "opaline", samples: [[333, 1722], [553, 1722]], color: "#db912b" },
    { id: "agrafe", samples: [[333, 1726], [553, 1726]], sole: [333, 1744], color: "#db912b" },
    { id: "rafale", samples: [[333, 1587], [553, 1587], [333, 1724], [553, 1724]], color: "#d72528" },
    { id: "releve", samples: [[333, 1736], [553, 1736]], color: "#18a032" },
    { id: "silex", samples: [[333, 1720], [553, 1720]], color: "#df861a" },
    { id: "etrier", samples: [[333, 1735], [553, 1735]], color: "#339900" },
  ];
  const read = (url: string) => new Uint8ClampedArray(pngPixels(readFileSync("public" + url)).pixels);
  for (const { id, samples, sole, color } of cases) {
    const piece = SHOES_CAPSULE_GARMENTS.find((candidate) => candidate.id === "fashion.shoes-" + id)!;
    assert.equal(piece.art.kind, "image");
    const source = read(piece.art.front);
    const regions = piece.art.colorMasks!;
    const mask = read(regions.main);
    const dyed = paintColorRegions(source.slice(), mask, undefined, { ...regions, main: color });
    const index = (x: number, y: number) => (y * 887 + x) * 4;
    for (const [x, y] of samples) {
      const i = index(x, y);
      assert.equal(source[i + 3], 255, `${id}: sample must be inside the shoe`);
      assert.equal(mask[i + 3], 255, `${id}: undyed material at ${x},${y}`);
      assert.notDeepEqual(dyed.slice(i, i + 3), source.slice(i, i + 3));
    }
    if (sole) {
      const i = index(sole[0], sole[1]);
      assert.equal(source[i + 3], 255, `${id}: sample must be on the sole`);
      assert.deepEqual(dyed.slice(i, i + 4), source.slice(i, i + 4));
    }
  }
});
