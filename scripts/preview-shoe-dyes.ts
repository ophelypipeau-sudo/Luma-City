import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { avatarGarment } from "../apps/web/src/avatar/catalog";
import { SHOES_CAPSULE_GARMENTS } from "../apps/web/src/avatar/shoes-capsule";
import { garmentMaterials } from "../apps/web/src/avatar/materials";
import { pngPixels } from "../apps/server/src/atelier-images";
import { paintColorRegions } from "../packages/domain/src/atelier-color";
import { rgbaPng } from "./lib/png-rgba";

const root = "docs/capsule-chaussures-v2";
const color = process.argv[2] ?? "#d68a38";
const output = process.argv[3] ?? `${root}/controle-teintes.png`;
const read = (url: string) => new Uint8ClampedArray(pngPixels(readFileSync("public" + url)).pixels);
const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const items = [...SHOES_CAPSULE_GARMENTS, avatarGarment("atelier.prune-fumee-escarpins")];
const cards = items.map((piece, n) => {
  if (piece.art.kind !== "image") throw new Error(piece.id);
  const original = read(piece.art.front);
  for (let i = 0; i < original.length; i += 4) {
    if (original[i + 3] < 1 || original[i + 3] === 255) continue;
    for (let c = 0; c < 3; c++) original[i + c] = Math.round(original[i + c] * 255 / original[i + 3]);
  }
  const regions = garmentMaterials(piece)!;
  const dyed = paintColorRegions(original.slice(), read(regions.main), undefined, { ...regions, main: color });
  const x = 20 + n % 4 * 300, y = 66 + Math.floor(n / 4) * 173;
  const views = [original, dyed].map((data, i) => {
    const bytes = rgbaPng(887, 1774, new Uint8Array(data.buffer)).toString("base64");
    return `<svg x="${14 + i * 143}" y="22" width="128" height="126" viewBox="${piece.crop.join(" ")}"><image href="data:image/png;base64,${bytes}" width="887" height="1774"/></svg>`;
  }).join("");
  return `<g transform="translate(${x} ${y})"><rect width="284" height="155" rx="9" fill="#594761"/><text x="11" y="19" font-size="14" fill="#fff1f7">${escape(piece.name)}</text>${views}</g>`;
}).join("");
mkdirSync(root, { recursive: true });
writeFileSync(output, new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1220" height="590"><rect width="1220" height="590" fill="#3b2d44"/><g font-family="Arial"><text x="20" y="35" font-size="23" fill="#ffe7f4">Chaussures · Original à gauche, teinte ${color} à droite</text>${cards}</g></svg>`).render().asPng());
