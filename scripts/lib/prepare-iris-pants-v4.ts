import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { DOLL_PATTERN } from "../../packages/domain/src/avatar-pattern";
import { measureFabricTone } from "../../packages/domain/src/atelier-color";
import { nativeRgba } from "./png-native";
import { rgbaPng } from "./png-rgba";

const [width, height] = DOLL_PATTERN.canvas;
const area = width * height;
const source = "docs/capsule-pantalons-iris-v4/vues";
const output = "public/assets/avatar/capsule-pantalons-iris-v4";
const canonical = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(canonical).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw Error("Le patron frontal d’Iris a changé.");
const skin = nativeRgba(canonical).pixels;

type Bottom = {
  id: string;
  label: string;
  hem: number;
  base: string;
  detail?: { label: string; base: string };
  lowRise?: boolean;
  fitHips?: boolean;
  openHem?: number;
};
const pieces: readonly Bottom[] = [
  { id: "01-sculpt", label: "Sculpt", hem: 1582, base: "#74515a", fitHips: true },
  { id: "02-flow", label: "Flow", hem: 1617, base: "#596f8a", fitHips: true, openHem: 1550 },
  { id: "03-shadow", label: "Shadow", hem: 1537, base: "#423037" },
  { id: "04-motion", label: "Motion", hem: 1534, base: "#153749", detail: { label: "Empiècements cobalt", base: "#4754a2" } },
  { id: "05-district", label: "District", hem: 1674, base: "#34445d", lowRise: true },
  { id: "06-muse", label: "Muse", hem: 1612, base: "#87766d", detail: { label: "Revers de ceinture", base: "#322824" } },
  { id: "07-chrome", label: "Chrome", hem: 1585, base: "#235447", fitHips: true },
  { id: "08-rebel", label: "Rebel", hem: 1538, base: "#482933" },
  { id: "09-denim-nova", label: "Denim Nova", hem: 1580, base: "#325479", lowRise: true },
  { id: "10-veil", label: "Veil", hem: 1663, base: "#502839", fitHips: true },
];

const steps = [-1, 1, -width, width];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const local = Array.from({ length: 49 }, (_, i) => [i % 7 - 3, Math.floor(i / 7) - 3] as const)
  .filter(([x, y]) => x || y)
  .sort(([x, y], [r, s]) => x * x + y * y - r * r - s * s)
  .map(([x, y]) => y * width + x);
const isSkin = (r: number, g: number, b: number) => r > 128 && r - g > 32 && g - b > 23;
const isBackdrop = (r: number, g: number, b: number) => r > 172 && b >= g && g >= r && b - r < 35;
const rim = [-2, 2, -2 * width, 2 * width, -width - 1, -width + 1, width - 1, width + 1];
const dist = (art: Uint8Array, a: number, b: number) => Math.max(
  Math.abs(art[a] - art[b]), Math.abs(art[a + 1] - art[b + 1]), Math.abs(art[a + 2] - art[b + 2]),
);

function flood(state: Uint8Array, seed: number, mark: number, candidate?: Uint8Array) {
  const queue = new Uint32Array(area);
  let head = 0, tail = 0;
  const add = (p: number) => {
    if (state[p] || (candidate && !candidate[p])) return;
    state[p] = mark;
    queue[tail++] = p;
  };
  add(seed);
  while (head < tail) {
    const p = queue[head++], x = p % width;
    if (x) add(p - 1);
    if (x < width - 1) add(p + 1);
    if (p >= width) add(p - width);
    if (p < area - width) add(p + width);
  }
}

function material(piece: Bottom, x: number, y: number, r: number, g: number, b: number) {
  const denim = piece.id === "05-district" || piece.id === "09-denim-nova";
  if (denim && r > 63 && r - g > 7 && g - b > 5) return "protected";
  if (piece.id === "09-denim-nova" && y >= 675 && y < 775 && r > 87 && Math.max(r,g,b) - Math.min(r,g,b) < 42)
    return "protected";
  if (piece.id === "06-muse") {
    if (x >= 482 && x <= 518 && y >= 666 && y <= 705 && r > 106 && r - b > 30) return "protected";
    if (y < 712 && Math.max(r,g,b) < 80) return "detail";
  }
  if (piece.id === "08-rebel" && y > 790 && y < 1060 && r > 84 && Math.max(r,g,b) - Math.min(r,g,b) < 37)
    return "protected";
  if (piece.id === "04-motion" && b > g + 29 && b - g > g - r) return "detail";
  return "main";
}

const smooth = (v: number) => clamp(v) ** 2 * (3 - 2 * clamp(v));

function fitHipEdges(art: Uint8Array) {
  const waist = DOLL_PATTERN.waistY;
  for (let y = waist - 54; y < waist + 340; y++) {
    const row = y * width * 4;
    const original = art.slice(row, row + width * 4);
    const weight = smooth((y - waist + 54) / 20) * smooth((waist + 340 - y) / 95);
    for (const [start, outward] of [[378, -1], [510, 1]] as const) {
      if (original[start * 4 + 3] < 128 || skin[row + start * 4 + 3] < 128) continue;
      let cloth = start, body = start;
      while (original[(cloth + outward) * 4 + 3] >= 128) cloth += outward;
      while (skin[row + (body + outward) * 4 + 3] >= 128) body += outward;
      // Carry the existing contour to Iris's side seam. Crossfade inside the
      // cloth so the grain stays at its native scale and the old edge vanishes.
      const shift = Math.round(Math.max(0, (body - cloth) * outward + 2) * weight);
      if (!shift) continue;
      for (let d = -12; d <= shift + 3; d++) {
        const x = cloth + d * outward;
        const from = (x - shift * outward) * 4, target = x * 4;
        const blend = smooth((d + 12) / 10);
        for (let c = 0; c < 4; c++) {
          art[row + target + c] = Math.round(original[target + c] * (1 - blend) + original[from + c] * blend);
        }
      }
    }
  }
}

mkdirSync(output, { recursive: true });
const items = pieces.map((piece) => {
  const native = nativeRgba(readFileSync(`${source}/${piece.id}.png`));
  if (native.width !== width || native.height !== height) throw Error("Canevas inattendu " + piece.label);
  const p = native.pixels;
  const candidate = new Uint8Array(area), state = new Uint8Array(area);
  for (let y = 606; y <= piece.hem; y++) for (let x = 226; x < 658; x++) {
    const n = y * width + x, i = n * 4, d = dist(p, i, (y * width + 32) * 4);
    const [r, g, b] = p.subarray(i, i + 3);
    if (!isSkin(r, g, b) && !isBackdrop(r, g, b)) candidate[n] = Math.round(255 * clamp((d - 20) / 58));
  }
  const textile = new Uint8Array(area);
  // Reject the thin painted outlines of the exposed skin and the studio,
  // which can touch the actual cloth at the waist, inseam or ankle.
  for (let y = 606; y <= piece.hem; y++) for (let x = 226; x < 658; x++) {
    const n = y * width + x;
    if (candidate[n] >= 115 && rim.every(offset => candidate[n + offset] >= 110)) textile[n] = 1;
  }
  for (let y = 606; y <= piece.hem; y++) for (let x = 226; x < 658; x++) {
    const n = y * width + x;
    if (candidate[n] && !textile[n] && !rim.some(offset => textile[n + offset]) &&
      !steps.some(offset => textile[n + offset])) candidate[n] = 0;
  }
  flood(state, 800 * width + 407, 1, candidate);
  flood(state, 0, 2);

  const art = new Uint8Array(area * 4), coverage = new Uint8Array(art.length),
    main = new Uint8Array(art.length), accent = new Uint8Array(art.length),
    fixed = new Uint8Array(art.length), weighted = new Uint8Array(art.length);
  for (let y = 607; y <= piece.hem; y++) for (let x = 227; x < 657; x++) {
    const n = y * width + x, i = n * 4;
    if (state[n] === 2) continue;
    const matte = local.find(s => state[n + s] === 2);
    let opacity = 1, rgb = p.subarray(i, i + 3);
    if (matte !== undefined && steps.some(s => state[n + s] === 2)) {
      const donor = local.find(s => state[n + s] === 1 && candidate[n + s] > 244 &&
        steps.every(k => state[n + s + k] !== 2));
      if (donor !== undefined) {
        const f = (n + donor) * 4, b = (n + matte) * 4;
        const channels = [0, 1, 2];
        const range = channels.map(c => p[f + c] - p[b + c]);
        const norm = range.reduce((s, v) => s + v * v, 0);
        opacity = norm ? clamp(range.reduce((s, v, c) => s + v * (p[i + c] - p[b + c]), 0) / norm) : 1;
        if (opacity < .085) continue;
        if (opacity < .96) rgb = Uint8Array.from(channels.map(c =>
          Math.round(255 * clamp((p[i + c] - p[b + c] * (1 - opacity)) / (255 * opacity)))));
      } else if (candidate[n] < 190) {
        continue;
      }
    }
    // Brown or near-black outlines in Flow's two blue slits belong to the
    // reference skin and pumps. The blue lining remains within the cutout.
    if (piece.openHem !== undefined && y >= piece.openHem &&
      ((x >= 296 && x <= 367) || (x >= 518 && x <= 587)) && rgb[2] - rgb[0] < 8) continue;
    if (piece.id === "10-veil" && y >= 1656 &&
      (rgb[2] - rgb[1] < 7 || rgb[0] - rgb[2] > 41)) continue;
    art.set([...rgb, Math.round(255 * opacity)], i);
  }
  if (piece.fitHips) fitHipEdges(art);

  const fitHem = [0, 0];
  let left = width, right = 0, top = height, bottom = 0, count = 0;
  for (let y = 607; y <= piece.hem; y++) for (let x = 227; x < 657; x++) {
    const i = (y * width + x) * 4;
    const [r, g, b, alpha] = art.subarray(i, i + 4);
    if (!alpha) continue;
    weighted.set([r, g, b].map(channel => Math.round(channel * alpha / 255)), i);
    weighted[i + 3] = alpha;
    const zone = material(piece, x, y, r, g, b);
    (zone === "protected" ? fixed : zone === "detail" ? accent : main).fill(255, i, i + 4);
    if (alpha >= 247) coverage[i + 3] = 255;
    const side = x < 443 ? 0 : 1;
    if (alpha > 230 && Math.abs(x - DOLL_PATTERN.ankles[side][0]) < 23) fitHem[side] = y;
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y); count++;
  }
  // Cover the fitted silhouette in the closed section of each leg. The last
  // pixels at curved or split hems use the actual garment alpha above.
  for (let y = 755; y < Math.min(Math.max(...fitHem), piece.openHem ?? height); y++) for (let x = 250; x < 636; x++) {
    const i = (y * width + x) * 4;
    if (skin[i + 3] && y < fitHem[x < 443 ? 0 : 1] - 9) coverage[i + 3] = 255;
  }
  if (count < 120_000 || bottom < 1500 || top > 735 || !fitHem[0] || !fitHem[1])
    throw Error("Détourage incomplet " + piece.label);
  const tone = measureFabricTone(weighted, main);
  const detailTone = piece.detail && measureFabricTone(weighted, accent);
  if (!tone || (piece.detail && !detailTone)) throw Error("Matière indisponible " + piece.label);
  const hasProtected = fixed.some(Boolean);
  const layers = { "": art, "-mask": main, "-coverage": coverage,
    ...(hasProtected ? { "-protected": fixed } : {}),
    ...(detailTone ? { "-detail-mask": accent } : {}) };
  const id = piece.id.slice(3);
  if (!hasProtected) rmSync(`${output}/${id}-protected.png`, { force: true });
  for (const [suffix, bytes] of Object.entries(layers))
    writeFileSync(`${output}/${id}${suffix}.png`, rgbaPng(width, height, bytes));
  console.log(piece.label, left, top, right, bottom, fitHem);
  return { id, name: piece.label, base: piece.base, price: 900, lowRise: piece.lowRise ?? false, hasProtected,
    crop: [left - 5, top - 5, right - left + 11, bottom - top + 11],
    tone: { ...tone, depth: 0.38, sheen: 0.18 },
    detail: piece.detail && detailTone ? { ...piece.detail, tone: { ...detailTone, depth: 0.38, sheen: 0.17 } } : undefined };
});
writeFileSync(output + "/index.json", JSON.stringify({pattern: DOLL_PATTERN.id, bodySha256: DOLL_PATTERN.bodySha256, pieces: items}, null, 2) + "\n");
