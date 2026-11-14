import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { measureFabricTone } from "../packages/domain/src/atelier-color";
import { removeGreenMatte, removeOpaqueWhiteMatte } from "./lib/asset-edges";
import { rgbaPng } from "./lib/png-rgba";

const root = "docs/coiffures-iris-v4";
const output = "public/assets/avatar/capsule-coiffures-v4";
const [width, height] = DOLL_PATTERN.canvas;
const headroom = 125;
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Mannequin incompatible.");
type Placement = readonly [
  name: string,
  sourceX: number,
  sourceY: number,
  scale: number,
  targetY: number,
  back?: string,
];
const placements: Placement[] = [
  ["Gravure", 474, 150, 0.39, 80],
  ["Sillons", 476, 194, 0.49, 89],
  ["Constellation", 443, 90, 0.98, 90],
  ["Cinéma", 444, 129, 0.53, 81],
  ["Aileron", 446, 222, 0.83, 115],
  ["Azimut", 443, 255, 0.52, 124, "M0 265H887V1774H0Z"],
  ["Méduse", 443, 142, 0.68, 83],
  ["Mistral", 476, 210, 0.59, 83],
  ["Toupie", 476, 269, 0.58, 88],
  ["Rocaille", 476, 209, 0.46, 84],
  ["Cerf-volant", 443, 96, 0.69, 83],
  ["Épi de mer", 443, 117, 0.63, 76, "M0 154H358V260H0Z"],
  ["Soufflet", 443, 98, 0.9, 83],
  ["Volute", 443, 260, 0.75, 92],
  ["Éventail", 443, 241, 0.75, 88],
  ["Néon", 443, 98, 0.79, 83],
  ["Lacet", 443, 189, 0.78, 83],
  ["Rosace", 443, 214, 0.79, 83],
  ["Mosaïque", 443, 185, 0.72, 87],
  ["Équerre", 476, 144, 0.55, 83, "M0 138Q392 140 405 160V252Q405 270 391 292V1774H0Z"],
];
function render(image: string) {
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${image}</svg>`,
  ).render();
}
mkdirSync(output, { recursive: true });
const pieces = placements.map(
  ([name, sourceX, sourceY, scale, targetY, back], index) => {
    const id = String(index + 1).padStart(2, "0");
    const source = pngPixels(readFileSync(`${root}/sources/${id}.png`));
    const isolated = removeGreenMatte(source.pixels);
    const cleaned = removeOpaqueWhiteMatte(
      source.width,
      source.height,
      isolated,
    ).pixels;
    const png = rgbaPng(source.width, source.height, cleaned).toString(
      "base64",
    );
    const art = `<image x="${443.5 - sourceX * scale}" y="${headroom + targetY - sourceY * scale}" width="${source.width * scale}" height="${source.height * scale}" href="data:image/png;base64,${png}"/>`;
    const combined = render(art);
    const mask = new Uint8Array(combined.pixels.length);
    let left = width,
      right = 0,
      top = height,
      bottom = 0;
    const pixels = combined.pixels;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 20) continue;
      mask.fill(255, i, i + 4);
      const x = (i / 4) % width,
        y = Math.floor(i / 4 / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
    const mainTone = measureFabricTone(pixels, mask);
    if (!mainTone || right - left < 40)
      throw new Error(`Détourage incomplet : ${name}`);
    const split = (rear: boolean) =>
      back
        ? render(
            `<defs><mask id="depth"><rect width="${width}" height="${height}" fill="${rear ? "black" : "white"}"/><path d="${back}" fill="${rear ? "white" : "black"}" transform="translate(0 ${headroom})"/></mask></defs><g mask="url(#depth)">${art}</g>`,
          ).asPng()
        : combined.asPng();
    writeFileSync(`${output}/${id}.png`, split(false));
    if (back) writeFileSync(`${output}/${id}-back.png`, split(true));
    writeFileSync(`${output}/${id}-mask.png`, rgbaPng(width, height, mask));
    return {
      id,
      name,
      crop: [
        left - 6,
        top - headroom - 6,
        right - left + 13,
        bottom - top + 13,
      ],
      mainTone,
      back: !!back,
    };
  },
);
writeFileSync(
  `${output}/index.json`,
  JSON.stringify(
    { pattern: DOLL_PATTERN.id, bodySha256: DOLL_PATTERN.bodySha256, pieces },
    null,
    2,
  ) + "\n",
);
