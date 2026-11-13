import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pngPixels, inspectPiece } from "../apps/server/src/atelier-images";
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
const shirt = readFileSync("public/assets/avatar/burgundy-v2/sweater.png");
test("redrawn sweater covers the opaque bra while preserving head and hands", () => {
  const original = pngPixels(body).pixels;
  const cloth = pngPixels(
    readFileSync("public/assets/avatar/burgundy-v3/sweater.png"),
  ).pixels;
  let covered = 0,
    bra = 0;
  for (let y = 340; y < 550; y++)
    for (let x = 315; x < 575; x++) {
      const i = (y * 887 + x) * 4;
      if (
        original[i + 3] > 230 &&
        original[i] - original[i + 1] > 12 &&
        original[i + 2] - original[i + 1] > 10 &&
        Math.abs(original[i] - original[i + 2]) < 30
      ) {
        bra++;
        if (cloth[i + 3] > 230) covered++;
      }
    }
  assert.ok(bra > 1000);
  assert.ok(covered / bra > 0.995, `${bra - covered} bra pixels exposed`);
  for(let y=770;y<870;y++) for(let x=300;x<580;x++)
    assert.equal(cloth[(y*887+x)*4+3],0,'underwear outline leaked into garment thumbnail');
  for (const [x, y] of [
    [443, 180],
    [126, 920],
    [756, 920],
    [443, 1100],
  ])
    assert.equal(cloth[(y * 887 + x) * 4 + 3], 0, `cloth covered ${x},${y}`);
});
function range(bytes: Buffer, y: number, from = 0, to = 887) {
  const { pixels: p } = pngPixels(bytes);
  let l = 887,
    r = -1;
  for (let x = from; x < to; x++)
    if (p[(y * 887 + x) * 4 + 3] > 150) {
      l = Math.min(l, x);
      r = Math.max(r, x);
    }
  return [l, r];
}
test("knit shoulders and waist follow the actual mannequin within garment ease", () => {
  for (const y of [345, 370, 600]) {
    const [bl, br] = range(body, y, y === 600 ? 330 : 0, y === 600 ? 557 : 887);
    const [cl, cr] = range(
      shirt,
      y,
      y === 600 ? 330 : 0,
      y === 600 ? 557 : 887,
    );
    assert.ok(
      cl >= bl - 8 && cr <= br + 8,
      `row ${y}: cloth ${cl}..${cr}, body ${bl}..${br}`,
    );
  }
  assert.ok(
    inspectPiece(shirt, body, { x: 0, y: 0, scaleX: 1, scaleY: 1 }).every(
      (r) => r.ok,
    ),
  );
});
test("skirt calibration uses pelvis and thighs, never the adjacent hands", () => {
  const { pixels } = pngPixels(
    readFileSync("public/assets/avatar/burgundy-v2/skirt.png"),
  );
  for (let y = 850; y < 1016; y++)
    for (let x = 0; x < 887; x++)
      if (x < 230 || x > 660)
        assert.equal(
          pixels[(y * 887 + x) * 4 + 3],
          0,
          `skirt reached hand column ${x},${y}`,
        );
});
test("platform soles remain whole below the original toes", () => {
  const [l, r] = range(
    readFileSync("public/assets/avatar/burgundy-v2/shoes.png"),
    1757,
  );
  assert.ok(
    l < 400 && r > 490,
    "both complete soles extend below the bare feet",
  );
});
