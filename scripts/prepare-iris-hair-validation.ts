import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { measureFabricTone } from "../packages/domain/src/atelier-color";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { removeGreenMatte } from "./lib/asset-edges";
import { rgbaPng } from "./lib/png-rgba";

const root = "docs/coiffures-iris-validation";
const [width, height] = DOLL_PATTERN.canvas;
const centerBack = "M394 229Q444 276 494 229L521 278Q490 312 482 324H405Q393 309 368 279Z";
type Box = readonly [number, number, number, number];
type Piece = { id: string; name: string; style: string; base: string; offsetY?: number;
  mainTone: ReturnType<typeof measureFabricTone> };
const designs = [
  { id: "01-aureole", name: "Auréole", style: "Butterfly blowout",
    back: "M345 196Q372 206 414 207H473Q513 206 542 196Q539 244 509 271Q499 288 482 324H405Q388 291 375 272Q347 246 345 196Z",
    base: "#76422b" },
  // Only the overlap with the ear belongs behind the face. Keep the tail in a single pass.
  { id: "02-trait", name: "Trait", style: "Sleek high ponytail", back: "M510 157Q532 151 544 164Q537 193 534 220Q522 248 506 264L493 258Z", base: "#472a29",
    headroom: 42, metal: [[580, 128, 670, 164]] as Box[],
    hairline: [[426, 237, 804, 420], [432, 420, 507, 692], [729, 420, 806, 692]] as Box[] },
  { id: "03-sillage", name: "Brise", style: "Boho knotless braids", back: centerBack, base: "#4c2e21",
    metal: [[402, 592, 436, 630], [833, 880, 869, 922]] as Box[], gold: true },
  { id: "04-orbite", name: "Frange fauve", style: "Wolf cut", back: "M394 234Q444 271 495 234L521 263V350H367V266Z", base: "#47263a",
    crown: .85, toneMatch: [692, 599, 790, 756] as Box },
  { id: "05-azur", name: "Ondes pop", style: "Half-up Y2K", back: centerBack, base: "#633823",
    headroom: 42, metal: [[442, 166, 509, 235], [742, 166, 811, 238]] as Box[],
    blendPink: [719, 425, 955, 1195] as Box },
  { id: "06-nocturne", name: "Éclipse satinée", style: "Glam waves", back: "M477 194Q510 180 534 184Q530 210 518 225Q502 250 476 262L458 265Z", base: "#692e22",
    metal: [[399, 291, 446, 364]] as Box[], gold: true },
] as const;
const inside = (x: number, y: number, [x1, y1, x2, y2]: Box) =>
  x >= x1 && x <= x2 && y >= y1 && y <= y2;

mkdirSync(`${root}/calques`, { recursive: true });
const ids = process.argv.slice(2);
const existing: Piece[] = ids.length
  ? JSON.parse(readFileSync(`${root}/calques/index.json`, "utf8")).pieces : [];
if (ids.some((id) => !designs.some((design) => design.id === id))) throw new Error("Coiffure inconnue.");
const pieces = designs.map((design): Piece => {
  const { id, name, style, back, base } = design;
  if (ids.length && !ids.includes(id)) {
    const saved = existing.find((piece) => piece.id === id);
    if (!saved) throw new Error(`Calques existants introuvables : ${id}`);
    return saved;
  }
  const headroom = "headroom" in design ? design.headroom : 0;
  const source = pngPixels(readFileSync(`${root}/sources/${id}.png`));
  const art = removeGreenMatte(source.pixels);
  const main = new Uint8Array(art.length);
  const protection = new Uint8Array(art.length);
  for (let p = 0; p < art.length; p += 4) {
    if (!art[p + 3]) continue;
    const x = ((p / 4) % source.width) * 1254 / source.width;
    const y = Math.floor(p / 4 / source.width) * 1254 / source.height;
    const [r, g, b] = art.subarray(p, p + 3);
    if ("hairline" in design && design.hairline.some((box) => inside(x, y, box))) {
      // Neutralize the olive cast on the baby hairs using the ponytail's warm hue.
      const excessGreen = Math.max(0, Math.min(1, (g - .63 * r) / 16));
      const olive = excessGreen * Math.max(0, Math.min(1, (g - b) / 12));
      const light = .2126 * r + .7152 * g + .0722 * b;
      art[p] = Math.round(Math.min(255, r * (1 - olive) + light * 1.38 * olive));
      art[p + 1] = Math.round(g * (1 - olive) + light * .88 * olive);
      art[p + 2] = Math.round(b * (1 - olive) + light * .96 * olive);
    }
    if ("toneMatch" in design && inside(x, y, design.toneMatch)) {
      // Match the surrounding plum hue and soften the stronger copper highlights.
      const mix = Math.max(0, Math.min(1, (g - b - 1) / 12));
      const chroma = Math.max(0, g - b);
      const light = 1 - .19 * mix;
      art[p] = Math.min(255, Math.round((r + .27 * chroma * mix) * light));
      art[p + 1] = Math.round((g - .25 * chroma * mix) * light);
      art[p + 2] = Math.min(255, Math.round((b + 1.24 * chroma * mix) * light));
    }
    const metal = "metal" in design && design.metal.some((box) => inside(x, y, box)) &&
      ("gold" in design ? g > 75 && r - g < 76 : r - b < 43 && g > 57);
    if ("blendPink" in design && inside(x, y, design.blendPink)) {
      // Bring the former pink strand into the warm brown of the neighbouring waves.
      const clamp = (value: number) => Math.min(1, Math.max(0, value));
      const blend = clamp((b - .71 * g) / 12) * clamp((r - 1.25 * g) / 16);
      const light = (.2126 * r + .7152 * g + .0722 * b) * .86;
      for (const [channel, ratio] of [1.53, .88, .63].entries())
        art[p + channel] = Math.round(Math.min(255, art[p + channel] * (1 - blend) + light * ratio * blend));
    }
    (metal ? protection : main).set([255, 255, 255, 255], p);
  }
  const place = (pixels: Uint8Array, pass?: "front" | "back") => {
    const png = rgbaPng(source.width, source.height, pixels).toString("base64");
    const mask = pass
      ? `<defs><mask id="depth" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="${pass === "back" ? "black" : "white"}"/>
        <path d="${back}" transform="translate(0 ${headroom})" fill="${pass === "back" ? "white" : "black"}"/></mask></defs>`
      : "";
    const image = (y: number, imageHeight: number) =>
      `<image x="123" y="${y}" width="640" height="${imageHeight}" preserveAspectRatio="none" href="data:image/png;base64,${png}"/>`;
    const anchor = 88;
    const registered = "crown" in design
      ? `<defs><clipPath id="upper"><rect width="${width}" height="${anchor}"/></clipPath>
        <clipPath id="lower"><rect y="${anchor}" width="${width}" height="${height - anchor}"/></clipPath></defs>
        <g clip-path="url(#upper)">${image(anchor - (anchor + 55) * design.crown, 640 * design.crown)}</g>
        <g clip-path="url(#lower)">${image(-55, 640)}</g>`
      : image(-55 + headroom, 640);
    return new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${mask}
      <g ${pass ? 'mask="url(#depth)"' : ""}>${registered}</g>
      </svg>`).render();
  };
  const combined = place(art);
  const mainMask = place(main);
  const mainTone = measureFabricTone(combined.pixels, mainMask.pixels);
  const save = (suffix: string, rendered: ReturnType<typeof place>) =>
    writeFileSync(`${root}/calques/${id}-${suffix}.png`, rendered.asPng());
  save("front", place(art, "front"));
  save("back", place(art, "back"));
  save("matiere", mainMask);
  save("protections", place(protection));
  rmSync(`${root}/calques/${id}-meches.png`, { force: true });
  return { id, name, style, base, mainTone, ...(headroom && { offsetY: -headroom }) };
});
writeFileSync(`${root}/calques/index.json`, JSON.stringify({ pieces }, null, 2) + "\n");
