import test from "node:test";
import assert from "node:assert/strict";
import {
  clearConnected,
  borderSeeds,
} from "../packages/domain/src/local-cutout";

test("local background fill preserves enclosed matching details and original RGB", () => {
  const pixels = new Uint8ClampedArray(5 * 5 * 4).fill(255);
  for (let y = 1; y < 4; y++)
    for (let x = 1; x < 4; x++) {
      if (x === 2 && y === 2) continue;
      pixels.set([30, 20, 40, 255], (y * 5 + x) * 4);
    }
  const result = clearConnected(pixels, 5, 5, borderSeeds(5, 5), 20);
  assert.equal(result[3], 0);
  assert.equal(
    result[(2 * 5 + 2) * 4 + 3],
    255,
    "white print enclosed by cloth is protected",
  );
  for (let i = 0; i < pixels.length; i += 4)
    assert.deepEqual(result.slice(i, i + 3), pixels.slice(i, i + 3));
  assert.equal(pixels[3], 255, "source stays immutable");
});
test("transparent PNG borders cannot eat a dark garment", () => {
  const pixels = new Uint8ClampedArray(3 * 3 * 4);
  pixels.set([0, 0, 0, 255], 4 * 4);
  assert.deepEqual(clearConnected(pixels, 3, 3, borderSeeds(3, 3), 50), pixels);
});
test("tolerance and connectivity control the background without adding patterns", () => {
  const pixels = new Uint8ClampedArray([
    240, 240, 240, 255, 225, 225, 225, 255, 0, 0, 0, 255, 240, 240, 240, 255,
  ]);
  assert.equal(clearConnected(pixels, 4, 1, [[0, 0]], 5)[7], 255);
  const result = clearConnected(pixels, 4, 1, [[0, 0]], 20);
  assert.equal(result[7], 0);
  assert.equal(result[11], 255);
  assert.equal(result[15], 255, "disconnected same colour is preserved");
});
