import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pngPixels } from "../apps/server/src/atelier-images.ts";
import { measureFabricTone } from "../packages/domain/src/atelier-color.ts";
import { rgbaPng } from "./lib/png-rgba.ts";
import { removeWhiteMatte } from "./lib/asset-edges.ts";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern.ts";

const source = "docs/capsule-jupes-shorts-accessoires/calques";
const output = "public/assets/avatar/capsule-bas-v1";
const { id: pattern, bodySha256 } = DOLL_PATTERN;

// Detail positions measured on the fitted boards, relative to their garment tiles.
const groups = [
  {
    prefix: "skirt", folder: "jupes", scale: 360 / 1050, origin: [168, 485], inset: (250 - 550 * 360 / 1050) / 2,
    waistAdjustments: [20, 22, 28, 17, 20, 29, 29, 32, 26, 19],
    names: ["Denim indigo", "Plissée noire", "Satin ivoire", "Portefeuille bordeaux", "Jupe cargo olive", "Crayon à rayures", "Volants rose poudré", "Cuir chocolat", "Plis marine", "Lin sauge"],
    details: [
      [[128,69,6],[104,84,3],[151,81,4],[77,89,3]], [], [], [[155,69,11]],
      [[130,52,6],[81,137,5],[171,137,5]], [], [], [], [],
      [53,74,107,141,176,211,245].map(y => [126,y,6]),
    ],
  },
  {
    prefix: "short", folder: "shorts", scale: 360 / 755, origin: [180, 480], inset: (250 - 525 * 360 / 755) / 2,
    waistAdjustments: [18, 29, 25, 23, 15, 26, 24, 20, 24, 24],
    names: ["Denim à revers", "Tailleur anthracite", "Lin noué", "Short cargo olive", "Cuir bordeaux", "Boxer satin", "Velours côtelé", "Ourlet festonné", "Bermuda à rayures", "Bermuda utilitaire"],
    details: [
      [[132,99,7],[102,119,4],[155,114,4],[55,123,4]], [], [],
      [[131,95,6],[45,187,6],[207,187,6]],
      [[132,102,16],[103,101,4],[117,101,4],[151,101,4],[164,101,4]], [],
      [[130,99,6],[87,113,4],[165,111,4]], [[132,96,6]], [[132,88,6]],
      [[130,90,6],[39,212,9],[212,212,9]],
    ],
  },
];

mkdirSync(output, { recursive: true });
const pieces = groups.flatMap(group => group.names.map((name, index) => {
  const number = String(index + 1).padStart(2, "0");
  const id = group.prefix + "-" + number;
  const bytes = readFileSync(source + "/" + group.folder + "-" + number);
  const { width, height, pixels } = pngPixels(bytes);
  const shift = group.waistAdjustments[index];
  const art = new Uint8Array(pixels.length);
  const mask = new Uint8Array(pixels.length);
  const protection = new Uint8Array(pixels.length);
  const coverage = new Uint8Array(pixels.length);
  const registered = new Uint8Array(pixels.length);
  const waist = new Array<number>(width).fill(0);
  let left = width, top = height, right = 0, bottom = 0;
  for (let y = shift; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      const original = ((y - shift) * width + x) * 4;
      const alpha = pixels[original + 3];
      if (!alpha) continue;
      registered.set(pixels.subarray(original, original + 4), p);
      const [r, g, b] = pixels.subarray(original, original + 3);
      art.set([r * 255 / alpha, g * 255 / alpha, b * 255 / alpha, alpha].map(Math.round), p);
      if (alpha >= 224) {
        coverage[p + 3] = 255;
        if (!waist[x]) waist[x] = y;
      }
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      const tileX = (x - group.origin[0]) * group.scale + group.inset;
      const tileY = (y - shift - group.origin[1]) * group.scale;
      const preserveHardware = group.details[index].some(([dx, dy, radius]) =>
        Math.hypot(tileX - dx, tileY - dy) <= radius,
      );
      const preservePiping = id === "short-06" && r * 255 > 155 * alpha
        && g * 255 > 145 * alpha && b * 255 > 105 * alpha;
      const target = preserveHardware || preservePiping ? protection : mask;
      target.set([255, 255, 255, 255], p);
    }
  }
  const tone = measureFabricTone(registered, mask);
  if (!tone) throw new Error("Matière introuvable pour " + id);
  // Only sample the waistband itself. The hem and flared sides do not
  // determine where a top should disappear into the garment.
  const waistColumns = waist.flatMap((y, x) => y && y < top + 42 ? [[x, y] as const] : []);
  const waistband = waistColumns.filter((_, position) => position % 3 === 0 || position === waistColumns.length - 1);
  const start = waistband[0][1];
  const end = waistband.at(-1)![1];
  const tuckedTopRegion = `M0 0H${width}V${end}L${[...waistband].reverse().map(([x, y]) => `${x} ${y - 1}`).join("L")}L0 ${start}Z`;
  writeFileSync(output + "/" + id + ".png", rgbaPng(width, height, removeWhiteMatte(width, height, art).pixels));
  writeFileSync(output + "/" + id + "-mask.png", rgbaPng(width, height, mask));
  writeFileSync(output + "/" + id + "-protected.png", rgbaPng(width, height, protection));
  writeFileSync(output + "/" + id + "-coverage.png", rgbaPng(width, height, coverage));
  return { id, name, price: index >= 8 ? 750 : 700, crop: [left - 3, top - 3, right - left + 7, bottom - top + 7], tone, tuckedTopRegion };
}));
writeFileSync(output + "/index.json", JSON.stringify({ pattern, bodySha256, pieces }, null, 2) + "\n");
