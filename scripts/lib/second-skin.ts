/**
 * Shared helpers for fitted ("second-skin") garments cut from the canonical mannequin.
 * A garment is a region of the mannequin; its fabric keeps the body's light and shadow,
 * cut edges get an ink outline, and the underwear it must hide is always covered.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { pngPixels } from "../../apps/server/src/atelier-images";
import { DOLL_PATTERN, seam } from "../../packages/domain/src/avatar-pattern";
import { measureFabricTone } from "../../packages/domain/src/atelier-color";
import { rgbaPng } from "./png-rgba";

export const [W, H] = DOLL_PATTERN.canvas;
export const CENTRE = 443.5;
export { seam };

const bytes = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(bytes).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Le mannequin ne correspond pas au patron natif.");
export const body = pngPixels(bytes).pixels;

export const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
export const opaque = (x: number, y: number) => body[(y * W + x) * 4 + 3] > 250;
/** The mannequin's lavender underwear (bra and briefs). */
export const isUnderwear = (x: number, y: number) => {
  const i = (y * W + x) * 4;
  return body[i + 3] > 250 && body[i + 2] > body[i + 1] + 15 && body[i + 2] > body[i] - 10;
};
const rawLum = (i: number) => 0.2126 * body[i] + 0.7152 * body[i + 1] + 0.0722 * body[i + 2];

// Underwear reads as skin and its ink outlines are erased, so it never shows through.
const SKIN_LUM = 163;
const nearUnderwear = new Uint8Array(W * H);
for (let y = 300; y < 1000; y++)
  for (let x = 140; x < W - 140; x++)
    if (isUnderwear(x, y))
      for (let dy = -6; dy <= 6; dy++)
        for (let dx = -6; dx <= 6; dx++) nearUnderwear[(y + dy) * W + x + dx] = 1;
const solidAround = (x: number, y: number, r: number) => {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) if (!opaque(x + dx, y + dy)) return false;
  return true;
};
export function shading(x: number, y: number) {
  const i = (y * W + x) * 4;
  if (!nearUnderwear[y * W + x] || !solidAround(x, y, 4)) return rawLum(i);
  let best = 0;
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++) {
      const xx = x + dx, yy = y + dy;
      best = Math.max(best, isUnderwear(xx, yy) ? SKIN_LUM : rawLum((yy * W + xx) * 4));
    }
  return Math.min(best, 190);
}

/** Keeps only the pixels of `region` connected to one of the seeds. */
export function connected(region: Uint8Array, seeds: readonly (readonly [number, number])[]) {
  const keep = new Uint8Array(W * H), queue = new Uint32Array(W * H);
  let head = 0, tail = 0;
  for (const [x, y] of seeds) {
    const j = y * W + x;
    if (!region[j]) throw new Error(`Point de départ hors du vêtement : ${x},${y}`);
    if (!keep[j]) { keep[j] = 1; queue[tail++] = j; }
  }
  while (head < tail) {
    const j = queue[head++], x = j % W;
    for (const n of [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, j - W, j + W])
      if (n >= 0 && n < W * H && region[n] && !keep[n]) { keep[n] = 1; queue[tail++] = n; }
  }
  return keep;
}

/** Adds the underwear inside the box (and a margin around it) so nothing peeks out. */
export function coverUnderwear(region: Uint8Array, yMin: number, yMax: number, margin = 3) {
  for (let y = yMin; y < yMax; y++)
    for (let x = 140; x < W - 140; x++)
      if (isUnderwear(x, y))
        for (let dy = -margin; dy <= margin; dy++)
          for (let dx = -margin; dx <= margin; dx++)
            if (opaque(x + dx, y + dy)) region[(y + dy) * W + x + dx] = 1;
}

export type Paint = {
  base: readonly [number, number, number];
  /** Extra light/dark per pixel (ribs, bands); 1 = none. */
  texture?: (x: number, y: number) => number;
  /** Pixels drawn in a fixed colour that the dye never changes (piping, trims). */
  detail?: (x: number, y: number) => readonly [number, number, number] | null;
  sheen?: number;
};

export function writeGarment(out: string, id: string, region: Uint8Array, paint: Paint) {
  const art = new Uint8Array(W * H * 4), mask = new Uint8Array(W * H * 4);
  const fixed = new Uint8Array(W * H * 4), coverage = new Uint8Array(W * H * 4);
  let minX = W, maxX = 0, minY = H, maxY = 0, cloth = 0, details = 0;
  const inRegion = (x: number, y: number) => region[y * W + x] === 1;
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      if (!inRegion(x, y)) continue;
      const i = (y * W + x) * 4, alpha = body[i + 3];
      if (!alpha) continue;
      // A cut edge borders visible skin: give it the same ink as the drawn outlines.
      let cut = false;
      for (let dy = -2; dy <= 2 && !cut; dy++)
        for (let dx = -2; dx <= 2; dx++)
          if (opaque(x + dx, y + dy) && !inRegion(x + dx, y + dy)) { cut = true; break; }
      const l = shading(x, y);
      // Average skin (≈ 165) keeps the fabric's own colour; light and shadow move around it.
      const relief = clamp(l / 165, 0.3, 1.18) ** 1.6;
      const sheen = clamp((l - 178) / 40) ** 1.4 * (paint.sheen ?? 30);
      const fixedColour = paint.detail?.(x, y) ?? null;
      const ink = cut ? 0.42 : 1;
      const tex = paint.texture?.(x, y) ?? 1;
      const rgb = fixedColour
        ? fixedColour.map((c) => Math.round(c * clamp(relief + 0.25, 0.7, 1) * (cut ? 0.6 : 1)))
        : paint.base.map((c) => Math.round(clamp(c * relief * tex * ink + sheen * ink, 0, 255)));
      art.set([rgb[0], rgb[1], rgb[2], alpha], i);
      if (fixedColour) { fixed.set([255, 255, 255, alpha], i); details++; }
      else { mask.set([255, 255, 255, 255], i); cloth++; }
      if (alpha === 255) coverage[i + 3] = 255;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  const toneArt = art.slice();
  for (let i = 0; i < toneArt.length; i += 4) {
    const a = toneArt[i + 3] / 255;
    toneArt[i] = Math.round(toneArt[i] * a);
    toneArt[i + 1] = Math.round(toneArt[i + 1] * a);
    toneArt[i + 2] = Math.round(toneArt[i + 2] * a);
  }
  const tone = measureFabricTone(toneArt, mask);
  if (!tone) throw new Error("Matière introuvable : " + id);
  mkdirSync(out, { recursive: true });
  writeFileSync(`${out}/${id}.png`, rgbaPng(W, H, art));
  writeFileSync(`${out}/${id}-mask.png`, rgbaPng(W, H, mask));
  writeFileSync(`${out}/${id}-coverage.png`, rgbaPng(W, H, coverage));
  const protectedPath = `${out}/${id}-protected.png`;
  if (details) writeFileSync(protectedPath, rgbaPng(W, H, fixed));
  else if (existsSync(protectedPath)) rmSync(protectedPath);
  const hex = "#" + paint.base.map((v) => v.toString(16).padStart(2, "0")).join("");
  return {
    cloth, details,
    base: hex,
    crop: [minX - 4, minY - 4, maxX - minX + 9, maxY - minY + 9] as const,
    tone: { ...tone, depth: 0.36, sheen: 0.22 },
    hasDetails: details > 0,
  };
}
