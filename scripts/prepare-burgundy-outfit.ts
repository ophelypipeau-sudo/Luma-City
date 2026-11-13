import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { rgbaPng } from "./lib/png-rgba";
import { pngPixels, inspectPiece } from "../apps/server/src/atelier-images";
const root = "docs/burgundy-outfit-v1",
  out = "public/assets/avatar/burgundy-v1";
mkdirSync(out, { recursive: true });
type Stop = [number, number];
function interpolate(stops: Stop[], n: number) {
  const next = stops.findIndex((s) => s[0] >= n);
  if (next === 0) return stops[0][1];
  if (next < 0) return stops.at(-1)![1];
  const a = stops[next - 1],
    b = stops[next];
  return a[1] + ((n - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
}
function register(name: string, ys: Stop[], xs: Stop[], feet = false) {
  const bytes = readFileSync(`${root}/${name}-source.png`),
    w = bytes.readUInt32BE(16),
    h = bytes.readUInt32BE(20);
  const inverse = ys.map(([s, t]) => [t, s] as Stop);
  const source = pngPixels(bytes).pixels;
  const pixels = new Uint8Array(887 * 1774 * 4);
  // Bilinear sampling in premultiplied alpha; only cloth is remapped.
  for (let y = Math.floor(ys[0][1]); y < Math.ceil(ys.at(-1)![1]); y++) {
    const sy = interpolate(inverse, y + 0.5) - 0.5,
      scaleX = interpolate(xs, sy);
    for (let x = 0; x < 887; x++) {
      const right = x >= 443;
      const center = feet ? (right ? 551 : 333) : 443.5,
        sourceCenter = feet ? (right ? 596 : 358) : w / 2;
      const sleeveShift =
        name === "sweater"
          ? interpolate(
              [
                [420, 0],
                [500, 16],
                [540, 24],
                [600, 17],
                [720, 17],
                [800, 0],
              ],
              y,
            )
          : 0;
      const offset = x < 330 ? sleeveShift : x > 557 ? -sleeveShift : 0;
      const sx = sourceCenter + (x + 0.5 - center - offset) / scaleX - 0.5;
      const x0 = Math.floor(sx),
        y0 = Math.floor(sy),
        fx = sx - x0,
        fy = sy - y0;
      let alpha = 0,
        r = 0,
        g = 0,
        b = 0;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const xx = x0 + dx,
            yy = y0 + dy;
          if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
          const weight = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy),
            i = (yy * w + xx) * 4,
            a = source[i + 3] * weight;
          alpha += a;
          r += source[i] * a;
          g += source[i + 1] * a;
          b += source[i + 2] * a;
        }
      if (offset && alpha < 255) {
        const ox = Math.round(sourceCenter + (x + 0.5 - center) / scaleX - 0.5),
          oy = Math.round(sy);
        if (ox >= 0 && ox < w && oy >= 0 && oy < h) {
          const j = (oy * w + ox) * 4,
            a = source[j + 3];
          if (a > alpha) {
            alpha = a;
            r = source[j] * a;
            g = source[j + 1] * a;
            b = source[j + 2] * a;
          }
        }
      }
      const i = (y * 887 + x) * 4;
      pixels[i + 3] = Math.round(alpha);
      if (alpha) {
        pixels[i] = Math.round(r / alpha);
        pixels[i + 1] = Math.round(g / alpha);
        pixels[i + 2] = Math.round(b / alpha);
      }
    }
  }
  writeFileSync(
    root + "/" + name + "-registration.json",
    JSON.stringify({ ys, xs, feet, width: 887, height: 1774 }, null, 2),
  );
  const png = rgbaPng(887, 1774, pixels);
  writeFileSync(out + "/" + name + ".png", png);
  const { pixels: p } = pngPixels(Buffer.from(png));
  for (const zone of name === "shoes" ? [0, 1] : [0]) {
    let path = "";
    for (let y = 0; y < 1774; y++) {
      let start = -1;
      for (let x = 0; x <= 887; x++) {
        const active =
          x < 887 &&
          p[(y * 887 + x) * 4 + 3] > 10 &&
          (name !== "shoes" || (zone === 0 ? y < 1630 : y >= 1630));
        if (active && start < 0) start = x;
        if (!active && start >= 0) {
          path += `M${start} ${y}h${x - start}v1h${start - x}Z`;
          start = -1;
        }
      }
    }
    writeFileSync(
      `${out}/${name}-mask${zone + 1}.png`,
      new Resvg(
        `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><path fill="white" d="${path}"/></svg>`,
      )
        .render()
        .asPng(),
    );
  }
  return Buffer.from(png);
}
const sweater = register(
  "sweater",
  [
    [459, 338],
    [550, 412],
    [650, 510],
    [760, 630],
    [940, 750],
    [1039, 842],
  ],
  [
    [459, 0.94],
    [590, 1.0],
    [650, 1.03],
    [700, 1.02],
    [760, 0.96],
    [940, 0.92],
    [1039, 0.92],
  ],
);
const skirt = register(
  "skirt",
  [
    [773, 690],
    [835, 740],
    [1100, 960],
    [1197, 1015],
  ],
  [
    [773, 0.99],
    [835, 0.95],
    [1100, 0.76],
    [1197, 0.72],
  ],
);
const shoes = register(
  "shoes",
  [
    [1158, 1430],
    [1340, 1565],
    [1450, 1645],
    [1640, 1764],
  ],
  [
    [1158, 0.84],
    [1340, 0.86],
    [1450, 0.9],
    [1640, 0.9],
  ],
  true,
);
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
const report = inspectPiece(sweater, body, {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
});
const b = pngPixels(body).pixels,
  k = pngPixels(skirt).pixels,
  f = pngPixels(shoes).pixels;
let briefs = 0,
  briefsHidden = 0,
  feet = 0,
  feetHidden = 0;
for (let y = 0; y < 1774; y++)
  for (let x = 0; x < 887; x++) {
    const i = (y * 887 + x) * 4;
    if (b[i + 3] < 230) continue;
    if (
      y >= 700 &&
      y < 850 &&
      b[i] - b[i + 1] > 12 &&
      b[i + 2] - b[i + 1] > 10 &&
      Math.abs(b[i] - b[i + 2]) < 30
    ) {
      briefs++;
      if (k[i + 3] > 230) briefsHidden++;
    }
    if (y >= 1645 && x > 260 && x < 630) {
      feet++;
      if (f[i + 3] > 230) feetHidden++;
    }
  }
const checks = {
  sweater: report,
  briefs: { total: briefs, hidden: briefsHidden },
  feet: { total: feet, hidden: feetHidden },
};
writeFileSync(`${root}/checks.json`, JSON.stringify(checks, null, 2));
console.log(checks);
if (
  report.some((r) => r.blocking && !r.ok) ||
  briefsHidden / briefs < 0.995 ||
  feetHidden / feet < 0.995
)
  process.exitCode = 1;
