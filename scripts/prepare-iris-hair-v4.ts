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
const approvedLayers = "docs/coiffure-test-iris/reprises/calques";
const approvedIds = new Set(["03", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"]);
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
  ["Gravure", 474, 150, 0.38, 78],
  ["Sillons", 443, 38, 0.98, 39],
  ["Constellation", 443, 90, 0.94, 82],
  ["Cinéma", 444, 129, 0.5, 79],
  ["Aileron", 446, 222, 0.83, 107],
  ["Azimut", 443, 255, 0.57, 110, "M0 222H887V1774H0Z"],
  [
    "Méduse",
    443,
    142,
    0.62,
    82,
    "M0 151H887V1774H0Z",
  ],
  ["Mistral", 476, 210, 0.53, 90, "M0 151H357V260H0Z M530 151H887V260H530Z"],
  ["Toupie", 476, 269, 0.54, 92],
  ["Rocaille", 476, 209, 0.47, 99, "M0 146H366V1774H0Z M521 146H887V1774H521Z"],
  ["Cerf-volant", 443, 96, 0.69, 87, "M0 145H887V1774H0Z"],
  ["Épi de mer", 454, 117, 0.68, 82, "M0 134H887V1774H0Z"],
  [
    "Soufflet",
    443,
    98,
    0.84,
    88,
    "M0 143H386Q366 199 356 235H0Z M887 143H500Q523 199 531 235H887Z",
  ],
  ["Volute", 443, 260, 0.75, 105, "M0 145H363V1774H0Z M523 145H887V1774H523Z"],
  ["Éventail", 443, 241, 0.69, 107, "M0 150H386V248H0Z M500 150H887V248H500Z"],
  ["Néon", 443, 98, 0.9, 88, "M0 148H887V1774H0Z"],
  ["Lacet", 443, 189, 0.73, 88],
  ["Rosace", 443, 214, 0.76, 99, "M0 148H365V1774H0Z M521 148H887V1774H521Z"],
  ["Mosaïque", 443, 185, 0.72, 100, "M0 145H370V247H0Z M517 145H887V247H517Z"],
  ["Équerre", 443, 37, 1, 36, "M499 154H887V1774H499Z"],
];

function clearBakedSkin(pixels: Uint8Array, id: string) {
  const scalp = ["01", "02", "03", "10"].includes(id);
  if (!scalp && id !== "19") return;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i],
      g = pixels[i + 1],
      b = pixels[i + 2];
    // Orange scalp and painted partings have more yellow than copper highlights.
    if (
      r < (scalp ? 133 : 178) ||
      g < (scalp ? 79 : 125) ||
      g < (scalp ? 0.54 : 0.65) * r ||
      g - b < (scalp ? 16 : 28)
    )
      continue;
    pixels.fill(0, i, i + 4);
  }
}
function render(image: string) {
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${image}</svg>`,
  ).render();
}
mkdirSync(output, { recursive: true });
const pieces = placements.map(
  ([name, sourceX, sourceY, scale, targetY, back], index) => {
    const id = String(index + 1).padStart(2, "0");
    const fitted = approvedIds.has(id)
      ? ["arriere", "avant"].map((side) => readFileSync(`${approvedLayers}/${id}-${side}.png`))
      : undefined;
    const source = pngPixels(readFileSync(`${root}/sources/${id}.png`));
    const isolated = removeGreenMatte(source.pixels);
    clearBakedSkin(isolated, id);
    const cleaned = removeOpaqueWhiteMatte(
      source.width,
      source.height,
      isolated,
    ).pixels;
    const png = rgbaPng(source.width, source.height, cleaned).toString(
      "base64",
    );
    const art = `<image x="${443.5 - sourceX * scale}" y="${headroom + targetY - sourceY * scale}" width="${source.width * scale}" height="${source.height * scale}" href="data:image/png;base64,${png}"/>`;
    const combined = render(
      fitted
        ? fitted.map((layer) => `<image width="${width}" height="${height}" href="data:image/png;base64,${layer.toString("base64")}"/>`).join("")
        : art,
    );
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
    writeFileSync(`${output}/${id}.png`, fitted?.[1] ?? split(false));
    if (fitted || back) writeFileSync(`${output}/${id}-back.png`, fitted?.[0] ?? split(true));
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
      back: Boolean(fitted || back),
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
