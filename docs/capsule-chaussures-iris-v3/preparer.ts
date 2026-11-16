import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { DOLL_PATTERN } from "../../packages/domain/src/avatar-pattern";
import { nativeRgba } from "../../scripts/lib/png-native";
import { rgbaPng } from "../../scripts/lib/png-rgba";
import { shoeMaterials } from "./matieres";

const root = "docs/capsule-chaussures-iris-v3";
const destination = "public/assets/avatar/capsule-chaussures-iris-v3";
const [width, height] = DOLL_PATTERN.canvas;
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw Error("Le mannequin officiel a changé.");
const skin = nativeRgba(body).pixels;

const models = [
  { id: "01-venus", name: "Vénus", scale: 0.292, anchor: .69, closedToe: 1714 },
  { id: "02-pixel", name: "Pixel", scale: 0.276, anchor: .73, closedToe: 1684 },
  { id: "03-nox", name: "Nox", scale: 0.322, anchor: .84, closedToe: 1710, rearRimTo: 1508 },
  { id: "04-alta", name: "Alta", scale: 0.492, anchor: .92, closedToe: 1696 },
  { id: "05-cherry", name: "Cherry", scale: 0.29, anchor: .73, closedToe: 1708 },
  { id: "06-sirocco", name: "Sirocco", scale: 0.515, anchor: .88, closedToe: 1716 },
  { id: "07-astrid", name: "Astrid", scale: 0.292, anchor: .84, closedToe: null },
  { id: "08-orbit", name: "Orbit", source: "08-orbit-ivoire", scale: 0.333, anchor: .8, closedToe: 1716 },
  { id: "09-vega", name: "Vega", source: "09-vega-mollets", scale: 0.51, anchor: .94, closedToe: 1696 },
  { id: "10-ether", name: "Éther", scale: 0.29, anchor: .78, closedToe: 1725 },
] as const;

function bounds(src: ReturnType<typeof nativeRgba>, half: number) {
  const start = half ? Math.floor(src.width / 2) : 0;
  const end = half ? src.width : Math.floor(src.width / 2);
  const box = { left: end, top: src.height, right: start, bottom: 0 };
  for (let y = 0; y < src.height; y++) for (let x = start; x < end; x++) {
    if (src.pixels[(y * src.width + x) * 4 + 3] < 150) continue;
    box.left = Math.min(box.left, x);
    box.top = Math.min(box.top, y);
    box.right = Math.max(box.right, x);
    box.bottom = Math.max(box.bottom, y);
  }
  if (box.right - box.left < 50 || box.bottom - box.top < 50)
    throw Error("Une chaussure est vide.");
  return box;
}

function sampleCenter(src: ReturnType<typeof nativeRgba>, box: ReturnType<typeof bounds>, amount: number) {
  let center = 0, rows = 0;
  const anchor = Math.round(box.top + (box.bottom - box.top) * amount);
  for (let y = anchor - 10; y <= anchor + 10; y++) {
    let left = box.right, right = box.left;
    for (let x = box.left; x <= box.right; x++) if (src.pixels[(y * src.width + x) * 4 + 3] > 200) {
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
    if (right > left) {
      center += (left + right) / 2;
      rows++;
    }
  }
  if (!rows) throw Error("Repère de centrage absent.");
  return center / rows;
}

function reconcileShaft(art: Uint8Array, startY: number, endY: number) {
  for (let y = startY; y <= endY; y++) {
    for (const [start, end] of [[255, 430], [460, 630]]) {
      const at = (x: number) => (y * width + x) * 4;
      let first = start, last = end;
      while (first < end && art[at(first) + 3] < 230) first++;
      while (last > first && art[at(last) + 3] < 230) last--;
      for (const [edge, direction] of [[first, 1], [last, -1]]) {
        for (let distance = 0; distance <= 13; distance++) {
          const x = edge - direction * distance;
          const to = at(x);
          const alpha = skin[at(x + direction * 2) + 3];
          if (alpha <= art[to + 3]) continue;
          const from = at(edge + direction * (distance + 2));
          if (art[from + 3] < 230) continue;
          // Retain the local suede/leather grain in the measured edge allowance.
          art.set(art.subarray(from, from + 3), to);
          art[to + 3] = alpha;
        }
      }
    }
  }
}

mkdirSync(destination, { recursive: true });
const pieces = models.filter(model => !process.argv[2] || model.id === process.argv[2]).map(model => {
  const bytes = readFileSync(root + "/sources/" + ("source" in model ? model.source : model.id) + ".png");
  const source = nativeRgba(bytes);
  const drawings = DOLL_PATTERN.ankles.map(([ankleX], side) => {
    const box = bounds(source, side);
    const centerX = sampleCenter(source, box, model.anchor);
    const dx = ankleX - centerX * model.scale;
    const dy = DOLL_PATTERN.floorY - 2 - box.bottom * model.scale;
    const offset = side ? 443 : 0;
    return {
      box,
      markup: `<svg x="${offset}" width="${side ? 444 : 443}" height="${height}" overflow="hidden">
        <image x="${dx - offset}" y="${dy}" width="${source.width * model.scale}" height="${source.height * model.scale}" href="data:image/png;base64,${bytes.toString("base64")}"/>
      </svg>`,
    };
  });
  const raw = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${drawings.map(({ markup }) => markup).join("")}</svg>`).render().asPng();
  const art = nativeRgba(raw).pixels;
  if (model.id === "04-alta") reconcileShaft(art, 1210, 1695);
  if (model.id === "09-vega") reconcileShaft(art, 1150, 1695);
  // Clear isolated resampling ghosts below one percent opacity.
  for (let i = 0; i < art.length; i += 4)
    if (art[i + 3] > 0 && art[i + 3] <= 2) art.fill(0, i, i + 4);
  const coverage = new Uint8Array(art.length);
  // The back of an open collar sits behind the leg and must not mask its skin.
  const rearRimTo = "rearRimTo" in model ? model.rearRimTo : 0;
  const backRegion = rearRimTo ? `M0 0H${width}V${rearRimTo}H0Z` : undefined;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 900; y < height; y++) for (let x = 230; x < 655; x++) {
    const i = (y * width + x) * 4;
    const opacity = art[i + 3];
    if (opacity > 25) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    if (y >= rearRimTo && skin[i + 3] && ((model.closedToe != null && y >= model.closedToe) || opacity >= 250))
      coverage[i + 3] = 255;
  }
  if (minX >= maxX || maxY < 1750 || maxY > 1764) throw Error("Semelles hors du repère pour " + model.name);
  const { main, detail, fixed, base, tone, secondary } = shoeMaterials(model.id, art);
  const layers = { "": art, "-coverage": coverage, "-mask": main, "-protected": fixed,
    ...(secondary ? { "-detail-mask": detail } : {}) };
  for (const [suffix, pixels] of Object.entries(layers))
    writeFileSync(`${destination}/${model.id}${suffix}.png`, rgbaPng(width, height, pixels));
  console.log(model.name, minX, minY, maxX, maxY);
  return { id: model.id, name: model.name, price: 900, base, tone, secondary, backRegion,
    crop: [minX - 5, minY - 5, maxX - minX + 11, maxY - minY + 11] };
});
if (!process.argv[2]) writeFileSync(destination + "/index.json", JSON.stringify({
  pattern: DOLL_PATTERN.id, bodySha256: DOLL_PATTERN.bodySha256, pieces,
}, null, 2) + "\n");
