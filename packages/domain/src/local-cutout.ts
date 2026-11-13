/** Connected colour removal, not semantic segmentation. Never changes RGB. */
export function clearConnected(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  seeds: readonly [number, number][],
  tolerance: number,
) {
  const out = new Uint8ClampedArray(rgba);
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const distance = Math.max(0, Math.min(180, tolerance));
  for (const [sx, sy] of seeds) {
    const start = Math.floor(sy) * width + Math.floor(sx);
    if (sx < 0 || sy < 0 || sx >= width || sy >= height || seen[start])
      continue;
    if (rgba[start * 4 + 3] < 16) continue;
    const r = rgba[start * 4],
      g = rgba[start * 4 + 1],
      b = rgba[start * 4 + 2];
    let read = 0,
      write = 0;
    const add = (n: number) => {
      if (seen[n]) return;
      const i = n * 4;
      if (
        rgba[i + 3] &&
        Math.max(
          Math.abs(rgba[i] - r),
          Math.abs(rgba[i + 1] - g),
          Math.abs(rgba[i + 2] - b),
        ) > distance
      )
        return;
      seen[n] = 1;
      queue[write++] = n;
    };
    add(start);
    while (read < write) {
      const n = queue[read++];
      out[n * 4 + 3] = 0;
      const x = n % width;
      if (x > 0) add(n - 1);
      if (x + 1 < width) add(n + 1);
      if (n >= width) add(n - width);
      if (n + width < width * height) add(n + width);
    }
  }
  return out;
}

export function borderSeeds(width: number, height: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    const x = Math.round(((width - 1) * i) / 8),
      y = Math.round(((height - 1) * i) / 8);
    points.push([x, 0], [x, height - 1], [0, y], [width - 1, y]);
  }
  return points;
}
