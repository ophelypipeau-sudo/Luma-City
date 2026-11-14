/**
 * Draws the "Studio" legging directly on the canonical mannequin: a second-skin cut
 * that follows the legs pixel for pixel, with a high waistband and light piping.
 * Inspired by a plain black sports legging; no brand text or logo is reproduced.
 *
 * Usage: npx tsx scripts/prepare-legging.ts
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { pngPixels } from "../apps/server/src/atelier-images";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { measureFabricTone } from "../packages/domain/src/atelier-color";
import { rgbaPng } from "./lib/png-rgba";

const [W, H] = DOLL_PATTERN.canvas;
const output = "public/assets/avatar/capsule-legging-v1";
const id = "studio";
const name = "Legging Studio";
const price = 700;

const bodyFile = "public/assets/avatar/fashion-v2/body-user.png";
const bodyBytes = readFileSync(bodyFile);
if (createHash("sha256").update(bodyBytes).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Le mannequin ne correspond pas au patron natif.");
const body = pngPixels(bodyBytes).pixels;

const centre = 443.5;
// High rise: covers the briefs (top ≈ 694–702) and stops under the navel (≈ 650).
const top = (x: number) => 676 - 10 * ((x - centre) / 190) ** 2;
const BAND = 42;
// Hem sits on the ankle bone, above the feet (ankles at y = 1600 in the pattern).
const hem = (x: number) => 1618 + 2 * Math.cos(((x < centre ? x - 333 : x - 550) / 60) * Math.PI);
// The forearms and hands hang beside the hips: they never belong to the legging.
const X_MIN = 246, X_MAX = W - 246;

const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const rawLum = (i: number) => 0.2126 * body[i] + 0.7152 * body[i + 1] + 0.0722 * body[i + 2];
// The briefs must not show through the jersey. Their lavender fill reads as skin
// (≈ 163), and their ink outlines, which always touch that fill, are removed by a
// small max filter applied only around the briefs and away from the silhouette edge.
const SKIN_LUM = 163;
const isBriefs = (i: number) => body[i + 3] > 250 && body[i + 2] > body[i + 1] + 15 && body[i + 2] > body[i] - 10;
const nearBriefs = new Uint8Array(W * H);
const REACH = 6;
for (let y = 600; y < 1000; y++)
  for (let x = X_MIN; x <= X_MAX; x++)
    if (isBriefs((y * W + x) * 4))
      for (let dy = -REACH; dy <= REACH; dy++)
        for (let dx = -REACH; dx <= REACH; dx++) nearBriefs[(y + dy) * W + x + dx] = 1;
const opaqueAround = (x: number, y: number, r: number) => {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++)
      if (body[((y + dy) * W + x + dx) * 4 + 3] < 250) return false;
  return true;
};
const skinValue = (i: number) => (isBriefs(i) ? SKIN_LUM : rawLum(i));
const lum = (x: number, y: number) => {
  const i = (y * W + x) * 4;
  if (!nearBriefs[y * W + x] || !opaqueAround(x, y, 4)) return rawLum(i);
  let best = 0;
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++) best = Math.max(best, skinValue(((y + dy) * W + x + dx) * 4));
  return Math.min(best, 190);
};

// 1. Region: mannequin pixels between waistband and hem, connected to the legs.
const inside = new Uint8Array(W * H);
for (let y = 600; y < 1660; y++)
  for (let x = X_MIN; x <= X_MAX; x++) {
    const j = y * W + x;
    if (body[j * 4 + 3] && y >= Math.floor(top(x)) && y <= Math.ceil(hem(x))) inside[j] = 1;
  }
const keep = new Uint8Array(W * H);
const queue = new Uint32Array(W * H);
let head = 0, tail = 0;
for (const [sx, sy] of [[333, 1200], [550, 1200], [centre | 0, 720]] as const) {
  const j = sy * W + sx;
  if (!inside[j]) throw new Error(`Point de départ hors de la jambe : ${sx},${sy}`);
  if (!keep[j]) { keep[j] = 1; queue[tail++] = j; }
}
while (head < tail) {
  const j = queue[head++], x = j % W;
  for (const n of [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, j - W, j + W])
    if (n >= 0 && n < W * H && inside[n] && !keep[n]) { keep[n] = 1; queue[tail++] = n; }
}

// 2. Paint: black jersey whose light and shadow follow the mannequin's own shading.
const art = new Uint8Array(W * H * 4);
const mask = new Uint8Array(W * H * 4);
const fixed = new Uint8Array(W * H * 4);
const coverage = new Uint8Array(W * H * 4);
const JERSEY = [35, 32, 40];
const BAND_TINT = [46, 42, 52];
const PIPING = [233, 229, 239];
let minX = W, maxX = 0, minY = H, maxY = 0, cloth = 0, piping = 0;
for (let y = 600; y < 1660; y++)
  for (let x = X_MIN; x <= X_MAX; x++) {
    const j = y * W + x, i = j * 4;
    if (!keep[j]) continue;
    // Soft top and hem edges at native resolution; the body's own alpha shapes the sides.
    const edge = Math.min(clamp(y + 1 - top(x)), clamp(hem(x) + 1 - y));
    const alpha = Math.round(body[i + 3] * edge);
    if (!alpha) continue;
    const l = lum(x, y);
    // Skin light ≈ 195, shadow ≈ 130, outline ≈ 60: keep that relief on the dark fabric.
    const relief = clamp(l / 190, 0.25, 1.15) ** 1.7;
    const sheen = clamp((l - 178) / 40) ** 1.4 * 34;
    const depth = y - top(x);
    const inBand = depth < BAND;
    const tint = inBand ? BAND_TINT : JERSEY;
    // A slightly darker line marks the waistband seam and the hem stitching.
    const seam = Math.abs(depth - BAND) < 1.4 || Math.abs(hem(x) - 7 - y) < 0.9 ? 0.72 : 1;
    const isPiping = depth >= 4 && depth < 6.5;
    const rgb = isPiping
      ? PIPING.map((c) => Math.round(c * clamp(relief + 0.25, 0.75, 1)))
      : tint.map((c) => Math.round(clamp(c * relief * seam + sheen, 0, 255)));
    art.set([rgb[0], rgb[1], rgb[2], alpha], i);
    if (isPiping) {
      fixed.set([255, 255, 255, alpha], i);
      piping++;
    } else {
      mask.set([255, 255, 255, 255], i);
      cloth++;
    }
    if (alpha === 255) coverage[i + 3] = 255;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
if (cloth < 120_000 || minY > 680 || maxY < 1600)
  throw new Error(`Legging incomplet : ${cloth} pixels, ${minY} → ${maxY}`);

// 3. Material description used by the dye filter, measured like the other pants.
const toneArt = art.slice();
for (let i = 0; i < toneArt.length; i += 4) {
  const a = toneArt[i + 3] / 255;
  toneArt[i] = Math.round(toneArt[i] * a);
  toneArt[i + 1] = Math.round(toneArt[i + 1] * a);
  toneArt[i + 2] = Math.round(toneArt[i + 2] * a);
}
const tone = measureFabricTone(toneArt, mask);
if (!tone) throw new Error("Matière introuvable.");
const hex = (c: number[]) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");

mkdirSync(output, { recursive: true });
writeFileSync(`${output}/${id}.png`, rgbaPng(W, H, art));
writeFileSync(`${output}/${id}-mask.png`, rgbaPng(W, H, mask));
writeFileSync(`${output}/${id}-protected.png`, rgbaPng(W, H, fixed));
writeFileSync(`${output}/${id}-coverage.png`, rgbaPng(W, H, coverage));
writeFileSync(`${output}/index.json`, JSON.stringify({
  pattern: DOLL_PATTERN.id,
  bodySha256: DOLL_PATTERN.bodySha256,
  pieces: [{
    id, name, price,
    source: "scripts/prepare-legging.ts",
    base: hex(JERSEY),
    crop: [minX - 4, minY - 4, maxX - minX + 9, maxY - minY + 9],
    tone: { ...tone, depth: 0.36, sheen: 0.22 },
  }],
}, null, 2) + "\n");
console.log(`${id} · ${cloth} pixels tissu · ${piping} pixels de liseré · ${minX},${minY} → ${maxX},${maxY}`);
