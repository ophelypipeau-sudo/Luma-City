/** Extract a green matte in straight RGB, keeping the alpha of fine strands. */
export function removeGreenMatte(pixels: Uint8Array): Uint8Array {
  const key = pixels.subarray(0, 3);
  const keyExcess = key[1] - Math.max(key[0], key[2]);
  if (keyExcess < 130) throw new Error("Fond vert uniforme absent du détourage.");
  const warmKeyExcess = key[1] - .70 * key[0] - .25 * key[2] - 12;
  const out = new Uint8Array(pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const excess = g - Math.max(r, b);
    const warmExcess = g - .70 * r - .25 * b - 12;
    const spill = Math.max(0, (excess - 5) / (keyExcess - 5), warmExcess / warmKeyExcess);
    const alpha = Math.max(0, 1 - spill);
    if (alpha < 0.015) continue;
    const foreground = (value: number, matte: number) =>
      Math.max(0, Math.min(255, Math.round((value - (1 - alpha) * matte) / alpha)));
    const red = foreground(r, key[0]);
    const blue = foreground(b, key[2]);
    // A warm-toned hair edge has no green channel brighter than both neighbours.
    const green = Math.min(foreground(g, key[1]),
      spill > .015 ? Math.max(blue, (red + blue) / 2 + 8) : Math.max(red, blue));
    out.set([red, green, blue, Math.round(alpha * pixels[i + 3])], i);
  }
  return out;
}

const neighbors = Array.from({ length: 81 }, (_, i) => [i % 9 - 4, Math.floor(i / 9) - 4] as const)
  .filter(([x, y]) => x || y).sort(([x, y], [u, v]) => x * x + y * y - u * u - v * v);

/** Replace studio background caught inside the traced silhouette. */
export function removeOpaqueWhiteMatte(width: number, height: number, pixels: Uint8Array) {
  const clean = pixels.slice();
  let corrected = 0;
  const reach = 12;
  for (let y = reach; y < height - reach; y++) {
    for (let x = reach; x < width - reach; x++) {
      const i = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      const alpha = pixels[i + 3];
      if (!alpha || g < 158 || r < g - 7 || r - g > 30 || g - b > 26 || b - g > 14) continue;
      for (const step of [1, -1, width, -width]) {
        let outside = false;
        for (let d = 1; d <= reach; d++) {
          const edge = i + 4 * d * step;
          if (pixels[edge + 3] <= 12) { outside = true; break; }
          if (pixels[edge + 1] < 153) break;
        }
        if (!outside) continue;
        for (let d = 1; d <= reach; d++) {
          const inner = i - 4 * d * step;
          if (pixels[inner + 3] < 245) break;
          if (g - pixels[inner + 1] < 48 || pixels[inner + 1] > 153) continue;
          clean.set(pixels.subarray(inner, inner + 3), i);
          corrected++;
          break;
        }
        if (clean[i + 1] !== g) break;
      }
    }
  }
  return { pixels: clean, corrected };
}

/** Clean white matte RGB on fabric edges, preserving alpha and opaque details. */
export function removeWhiteMatte(width: number, height: number, pixels: Uint8Array) {
  const straight = pixels.slice();
  let corrected = 0;
    for (let y = 4; y < height - 4; y++) {
      for (let x = 4; x < width - 4; x++) {
        const i = (y * width + x) * 4;
        const alpha = pixels[i + 3];
        if (alpha < 38 || alpha > 219) continue;
        if (![i - 4, i + 4, i - width * 4, i + width * 4].some((n) => pixels[n + 3] <= 12)) continue;
        const a = alpha / 255;
        let best = -1, score = 14;
        for (const [dx, dy] of neighbors) {
          const j = ((y + dy) * width + x + dx) * 4;
          if (pixels[j + 3] < 249) continue;
          const channels = [0, 1, 2].map((c) => pixels[j + c]);
          if (Math.max(...channels) > 188) continue;
          const error = Math.max(...channels.map((channel, c) =>
            Math.abs(pixels[i + c] - (a * channel + 255 * (1 - a)))));
          const candidate = error + .6 * Math.hypot(dx, dy);
          if (candidate >= score) continue;
          best = j;
          score = candidate;
        }
        if (best < 0) continue;
        for (let c = 0; c < 3; c++) {
          const inner = pixels[best + c] * 255 / pixels[best + 3];
          const recovered = (pixels[i + c] - 255 * (1 - a)) / a;
          straight[i + c] = Math.round(Math.max(0, Math.min(255, .7 * inner + .3 * recovered)));
        }
        corrected++;
      }
    }
  return { pixels: straight, corrected };
}
