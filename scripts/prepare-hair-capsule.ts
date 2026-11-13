import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { measureFabricTone } from "../packages/domain/src/atelier-color";
import { rgbaPng } from "./lib/png-rgba";
import { removeGreenMatte } from "./lib/asset-edges";

const source = "docs/capsule-coiffures-v1/sources-chroma.png";
const output = "public/assets/avatar/capsule-coiffures-v1";
const [width, height] = DOLL_PATTERN.canvas;
const sheet = pngPixels(readFileSync(source));
const cleanedSheet = removeGreenMatte(sheet.pixels);
const silhouetteFit = {
  sienne: [0.89, 0.94],
  nuage: [0.72, 0.88],
  rubis: [1, 1],
  nacre: [0.92, 0.94],
  ebene: [0.93, 0.94],
  moka: [0.92, 0.94],
} as const;
const rightCheek = "M494 183Q516 177 542 185Q536 230 514 270L496 320H468Z";
const designs = [
  { id: "sienne", name: "Sienne", cell: [0, 0], anchor: [305, 103], fit: [441, 90], scale: 1.10, base: "#684031", back: "M350 179Q443 199 537 172V345H350Z" },
  { id: "nuage", name: "Nuage", cell: [1, 0], anchor: [785, 104], fit: [444, 91], scale: 1.06, base: "#543125", back: "M395 257Q444 278 490 254L492 320Q493 340 514 385H372Q392 342 395 316Z " + rightCheek },
  { id: "rubis", name: "Rubis", cell: [2, 0], anchor: [1244, 105], fit: [441, 102], scale: 1.04, base: "#641f32", back: "M467 164H887V650H467Z" },
  { id: "nacre", name: "Nacre", cell: [0, 1], anchor: [297, 583], fit: [445, 83], scale: 1.02, base: "#b58b68", back: "M392 249Q444 274 497 249L485 306H404Z" },
  { id: "ebene", name: "Ébène", cell: [1, 1], anchor: [768, 576], fit: [443, 86], scale: 1.03, base: "#443030", back: "M395 257Q444 278 490 254L508 352H374Z " + rightCheek },
  { id: "moka", name: "Moka", cell: [2, 1], anchor: [1248, 583], fit: [444, 85], scale: 1.04, base: "#694331", back: "M487 185Q518 174 542 183Q529 232 523 260L537 285V350H467Z" },
] as const;
const cuffs = [[884, 707], [652, 785], [878, 894], [654, 930]];
// Horizontal registration of the original strands around the temple and jaw.
// Each adjustment fades out before the outer outline and below the neckline.
const earFit = {
  sienne: [
    { x: 393, y: 255, width: 103, height: 106, shift: -36 },
    { x: 516, y: 249, width: 98, height: 103, shift: 36 },
  ],
  nuage: [{ x: 512, y: 239, width: 78, height: 72, shift: 33 }],
  rubis: [
    { x: 379, y: 84, width: 72, height: 56, shift: 10 },
    { x: 498, y: 256, width: 90, height: 94, shift: 28 },
  ],
  nacre: [],
  ebene: [{ x: 507, y: 239, width: 48, height: 67, shift: 21 }],
  moka: [{ x: 505, y: 239, width: 70, height: 65, shift: 20 }],
} as const;
const unit = (value: number) => Math.max(0, Math.min(1, value));
function fade(distance: number) {
  const weight = unit(1 - Math.abs(distance));
  return weight * weight * (3 - 2 * weight);
}

function fitSilhouette(pixels: Uint8Array, id: keyof typeof silhouetteFit) {
  const [side, crown] = silhouetteFit[id];
  const fitted = new Uint8Array(pixels.length);
  const center = width / 2;
  const offsets = Array.from({ length: width }, (_, x) => {
    const offset = x - center;
    return Math.sign(offset) * Math.max(0, Math.abs(offset) - 88) * (1 / side - 1);
  });
  for (let y = 0; y < 640; y++) {
    // Leave the opening and the hair below the neck at their original length.
    const sourceY = y - Math.max(0, 78 - y) * (1 / crown - 1);
    if (sourceY < 0) continue;
    const row = Math.floor(sourceY);
    const v = sourceY - row;
    const nearHead = unit((375 - y) / 125);
    for (let x = 175; x < 735; x++) {
      const sourceX = x + offsets[x] * nearHead + earFit[id].reduce(
        (offset, fit) => offset + fit.shift * fade((x - fit.x) / fit.width) * fade((y - fit.y) / fit.height),
        0,
      );
      const column = Math.floor(sourceX);
      const u = sourceX - column;
      const p = (row * width + column) * 4;
      const next = p + width * 4;
      const out = (y * width + x) * 4;
      const alpha = (pixels[p + 3] * (1 - u) + pixels[p + 7] * u) * (1 - v) +
        (pixels[next + 3] * (1 - u) + pixels[next + 7] * u) * v;
      if (alpha < 1) continue;
      fitted[out + 3] = Math.round(alpha);
      // Resvg returns premultiplied pixels. Interpolate before recovering RGB.
      for (let c = 0; c < 3; c++) {
        const upper = pixels[p + c] * (1 - u) + pixels[p + 4 + c] * u;
        const lower = pixels[next + c] * (1 - u) + pixels[next + 4 + c] * u;
        fitted[out + c] = Math.min(255, Math.round((upper * (1 - v) + lower * v) * 255 / alpha));
      }
    }
  }
  return fitted;
}

mkdirSync(output, { recursive: true });
const pieces = designs.map(({ id, name, cell: [column, row], anchor, fit, scale, base, back }) => {
  const size = 512;
  const left = column * size, top = row * size;
  const cutout = new Uint8Array(size * size * 4);
  const material = new Uint8Array(cutout.length);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const sx = left + x, sy = top + y;
      const offset = (sy * sheet.width + sx) * 4;
      const [red, green, blue] = sheet.pixels.subarray(offset, offset + 3);
      const alpha = cleanedSheet[offset + 3];
      if (!alpha) continue;
      const gold = id === "ebene" && cuffs.some(([cx, cy]) =>
        Math.abs(left + x - cx) <= 15 && Math.abs(top + y - cy) <= 15,
      ) && green > 65 && green - blue > 13 && red - green < 75;
      const rgb = cleanedSheet.subarray(offset, offset + 3);
      const light = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
      const reflection = gold ? 1 : 1 - Math.max(0, light - 85) / 255 * .26;
      cutout.set([...rgb.map((channel) => Math.round(channel * reflection)), alpha], index);
      if (!gold) material.set([255, 255, 255, 255], index);
    }
  }
  const register = (pixels: Uint8Array) => {
    const png = rgbaPng(size, size, pixels).toString("base64");
    const x = fit[0] - (anchor[0] - left) * scale;
    const y = fit[1] - (anchor[1] - top) * scale;
    return new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <image href="data:image/png;base64,${png}" x="${x}" y="${y}" width="${size * scale}" height="${size * scale}"/>
      </svg>`).render();
  };
  const pixels = fitSilhouette(register(cutout).pixels, id);
  const maskPixels = fitSilhouette(register(material).pixels, id);
  const illustration = rgbaPng(width, height, pixels);
  const tone = measureFabricTone(pngPixels(illustration).pixels, maskPixels);
  if (!tone) throw new Error(`Matière manquante pour ${name}`);
  let minX = width, minY = height, maxX = 0, maxY = 0;
  const protectedPixels = new Uint8Array(pixels.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (pixels[index + 3] < 30) continue;
      if (id === "ebene" && maskPixels[index + 3] === 0 && pixels[index + 3] >= 240)
        protectedPixels.set([255, 255, 255, 255], index);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  writeFileSync(`${output}/${id}.png`, illustration);
  writeFileSync(`${output}/${id}-mask.png`, rgbaPng(width, height, maskPixels));
  writeFileSync(`${output}/${id}-protected.png`, rgbaPng(width, height, protectedPixels));
  const crop = [Math.max(0, minX - 6), Math.max(0, minY - 6), maxX - minX + 13, maxY - minY + 13];
  return { id, name, price: 850, base, back, crop,
    tone: { ...tone, depth: id === "nuage" ? .28 : .34, sheen: id === "nuage" ? .10 : .13 } };
});
writeFileSync(`${output}/index.json`, JSON.stringify({
  pattern: DOLL_PATTERN.id, bodySha256: DOLL_PATTERN.bodySha256, pieces,
}, null, 2) + "\n");
