import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { measureFabricTone } from "../packages/domain/src/atelier-color";
import { nativeRgba } from "./lib/png-native";
import { rgbaPng } from "./lib/png-rgba";

const docs = "docs/capsule-coiffures-premium-iris";
const assets = "public/assets/avatar";
const output = `${assets}/capsule-coiffures-premium-iris`;
const { coiffures } = JSON.parse(readFileSync(`${docs}/prompts.json`, "utf8").replace(/^\uFEFF/, "")) as {
  coiffures: { id: string; nom: string }[];
};
const [width, height] = DOLL_PATTERN.canvas;
const body = readFileSync(`${assets}/fashion-v2/body-user.png`);
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Le mannequin frontal a changé");

const w = 520, h = 740;
const step = .99 * .45 * w / 252;
// Inverse of the official portrait registration in the validation board.
const left = (-68.9 * .99 + .3 - 4) * w / 252;
const top = (56.5 * .99 + 1.4 - 3) * w / 252;
const headroom = 90;
// Native position of the generated transparent portrait in validation coordinates.
const revisions: Partial<Record<string, { file?: string; x?: number; y?: number; scaleX?: number; scaleY?: number }>> = {
  "01-ambre": { x: 2, y: 1, scaleX: .95 },
  "02-sienna": { scaleX: .97 },
  "04-velvet": {},
  "05-nova": { file: "05-nova-pointes", scaleX: .85, scaleY: .83 },
  "06-eden": { file: "06-eden-nuque" },
  "07-raven": { file: "07-raven-nuque", scaleX: .92 },
  "09-ruby": {},
  "10-luna": { scaleX: .88 },
};
const paint = (w: number, h: number, viewBox: string, contents: string) => new Resvg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${contents}</svg>`,
).render();
const bodyInPreview = paint(w, h, `0 0 ${w} ${h}`,
  `<image x="${left}" y="${top}" width="${width * step}" height="${height * step}"
    href="data:image/png;base64,${body.toString("base64")}"/>`).pixels;

// Coarse corridors in preview coordinates. These exclude the painted face and
// garment details that share hair colours. The contours come from the PNG.
const regions: Record<string, string> = {
  "01-ambre": "M45 36H214V206L193 229L199 263L179 297L145 291L141 259L130 248L119 257L117 283L105 292L68 282L57 247L62 222L45 205Z",
  "02-sienna": "M67 43H200L187 212L190 307L165 357L148 357L147 310L151 238L155 202L111 202L108 249L108 319L115 354H72L65 310L65 236L69 200Z",
  "03-zahra": "M44 33H215V214L207 239L199 271L184 314H154L146 256L153 225L105 222L112 264L103 317L70 322L57 266L48 231L39 210Z",
  "04-velvet": "M70 40H184V172L169 177L181 194L193 218L196 261L185 302L177 327L152 328L151 294L154 246L156 216L149 201L143 179L113 178L90 195L73 182Z",
  "05-nova": "M18 29H240L247 207L216 214L220 242L207 278L186 296L176 276L186 247L174 225L177 203L164 190L159 172L103 172L95 194L81 208L86 222L76 244L85 273L67 296L40 273L31 235L37 216L23 207Z",
  "06-eden": "M45 32H218L221 239L215 278L202 307L202 332L202 352L195 367H171L154 339L152 299L152 258L159 224L103 219L110 249L105 296L95 339L88 369H63L48 342L44 309L41 278L42 248L33 210Z",
  "07-raven": "M47 25H213L210 196L181 215L183 254L152 277L134 227L124 231L113 271L81 271L73 223L75 215L55 204Z",
  "08-opaline": "M60 34H207L211 189L196 211L168 207L160 191L150 179L108 169L98 184L98 199L91 214L78 216L68 203Z",
  "09-ruby": "M53 33H216L229 210L223 244L211 258L205 297L191 319H151L145 292L148 272L151 251L151 228L143 207L116 203L94 218L74 209L63 191L54 163Z",
  "10-luna": "M51 34H209L209 181L194 212L176 222L149 220L148 206L108 206L95 221L60 221Z",
};
const faceAndNeck = "M93 120 Q105 112 121 122 L141 122 Q155 113 166 121 L171 139 Q168 157 153 174 L146 184 L144 205 L149 221 L134 259 L111 253 L107 222 L117 204 L114 180 Q98 172 91 155 L86 139Z";
const novaCuffs = "M155 144Q162 124 188 115L199 128Q177 140 168 161Z M321 128L329 114Q348 120 363 145L350 161Q339 141 321 128Z";
// Trace the gap between the two stray inner tips and the main curls.
const novaFlyaway = "M328 421H313C314 428 302 431 294 439C286 446 282 454 282 463C282 472 286 481 296 487Q308 493 325 494Z";
const neighbours = [-1, 1, -w, w, -w-1, -w+1, w-1, w+1];
const donors = Array.from({ length: 121 }, (_, i) => [i % 11 - 5, Math.floor(i / 11) - 5])
  .filter(([x, y]) => x || y).map(([x, y]) => ({ step: y * w + x, distance: Math.hypot(x, y) }))
  .sort((a, b) => a.distance - b.distance);

function removeSpecks(alpha: Uint8Array) {
  const seen = new Uint8Array(alpha.length);
  const queue = new Uint32Array(alpha.length);
  for (let n = 0; n < alpha.length; n++) {
    if (!alpha[n] || seen[n]) continue;
    let length = 1, solid = 0;
    queue[0] = n;
    seen[n] = 1;
    for (let i = 0; i < length; i++) {
      const p = queue[i];
      if (alpha[p] >= 195) solid++;
      for (const offset of neighbours) {
        const q = p + offset;
        if (!alpha[q] || seen[q]) continue;
        seen[q] = 1;
        queue[length++] = q;
      }
    }
    if (solid < 12) for (let i = 0; i < length; i++) alpha[queue[i]] = 0;
  }
}

function isolate(id: string, pixels: Uint8Array) {
  const zone = paint(w, h, "0 0 260 370", `<mask id="keep"><path fill="white" d="${regions[id]}"/><path d="${faceAndNeck}"/></mask><rect width="260" height="370" mask="url(#keep)"/>`).pixels;
  const alpha = new Uint8Array(w * h);
  const raven = id === "07-raven";
  const nova = id === "05-nova";
  const ruby = id === "09-ruby";
  for (let y = 60; y < h - 4; y++) for (let x = 25; x < w - 25; x++) {
    const n = y * w + x, i = n * 4;
    if (zone[i + 3] < 128) continue;
    const [r, g, b] = pixels.subarray(i, i + 3);
    const at = (y * w + 12) * 4;
    const bg = Math.max(...pixels.subarray(i, i + 3).map((c, k) => Math.abs(c - pixels[at + k])));
    const warmSkin = r > 143 && g > 78 && r - g > 31 && g - b > 25 && g - b > (r - g) * .47;
    const skin = warmSkin && (y >= 198 || y >= 178 && bodyInPreview[i + 3] > 80);
    const gold = y > 590 && g > 107 && r - g > 31 && g - b > 43;
    const blue = b >= r && b >= g && b - g < 52 && (g >= r - 1 || g < 30);
    const cuff = nova && y >= 117 && y < 161 && (x >= 153 && x <= 207 || x >= 310 && x <= 354);
    const silver = cuff && r > 42 && Math.max(r, g, b) - Math.min(r, g, b) < 39;
    const wine = ruby && r - b > 12 && r - g > Math.max(12, (b - g) * 3.2 + 12);
    const magenta = nova && r - g > Math.max(27, (b - g) * 2.4 + 15) && r > b + 15;
    const brown = r > b + 7 && r > g + 4 && (g >= b - 2 || y < 420 && g < 38 && b <= g + 9);
    if (bg < 9 || skin || gold || !(raven ? blue : brown || wine || magenta || silver)) continue;
    alpha[n] = bg > 26 ? 255 : 175;
  }
  removeSpecks(alpha);
  // Keep narrow light strands within a lock even when the same colour also
  // occurs on the mannequin. A strand is bounded by hair on opposite sides.
  const initial = alpha.slice();
  const spansAcross = [1, w, w - 1, w + 1];
  for (let n = 0; n < alpha.length; n++) {
    if (alpha[n] || zone[n * 4 + 3] < 230) continue;
    const i = n * 4;
    const [r, g, b] = pixels.subarray(i, i + 3);
    if (r <= b + 8 || r <= g + 8) continue;
    let spans = 0;
    for (const axis of spansAcross) {
      const before = [1, 2, 3, 4, 5].find(d => initial[n - d * axis] === 255);
      const after = [1, 2, 3, 4, 5].find(d => initial[n + d * axis] === 255);
      if (before && after && before + after <= 8) spans++;
    }
    if (spans >= 2) alpha[n] = 255;
  }
  const solid = alpha.map((a, n) => a === 255 && neighbours.every(offset => alpha[n + offset] >= 175) ? 255 : 0);
  const rgba = new Uint8Array(w * h * 4);
  for (let n = 0; n < solid.length; n++) {
    const i = n * 4;
    if (solid[n]) {
      rgba.set(pixels.subarray(i, i + 4), i);
      continue;
    }
    if (!zone[i + 3] || !neighbours.some(offset => alpha[n + offset])) continue;
    const observed = pixels.subarray(i, i + 3);
    let best: { color: Uint8Array; a: number; score: number } | undefined;
    // Solve observed = alpha * hair + (1 - alpha) * background using nearby
    // known samples. Preserve hair ink instead of storing purple or skin edges.
    for (const { step: fg, distance } of donors) {
      if (!solid[n + fg]) continue;
      const color = pixels.subarray((n + fg) * 4, (n + fg) * 4 + 3);
      for (const bg of neighbours) {
        if (alpha[n + bg]) continue;
        const background = pixels.subarray((n + bg) * 4, (n + bg) * 4 + 3);
        const v = Array.from(color, (c, k) => c - background[k]);
        const norm = v.reduce((sum, c) => sum + c * c, 0);
        if (norm < 240) continue;
        const a = Math.min(1, v.reduce((sum, c, k) => sum + c * (observed[k] - background[k]), 0) / norm);
        if (a < .12) continue;
        const score = distance * 2 + Math.max(...v.map((c, k) => Math.abs(background[k] + a * c - observed[k])));
        if (score < (best?.score ?? 16)) best = { color, a, score };
      }
      if (distance >= 2 && best && best.score < 8) break;
    }
    if (best) rgba.set([...best.color, Math.round(best.a * zone[i + 3])], i);
    else if (alpha[n] === 255) rgba.set([...observed, zone[i + 3]], i);
  }
  return rgba;
}

mkdirSync(output, { recursive: true });
const pieces = coiffures.map(({ id, nom }) => {
  const revision = revisions[id];
  const hair = revision ? cleanTransparentSource(readFileSync(`${docs}/reprises/sources/${revision.file ?? id}.png`))
    : rgbaPng(w, h, isolate(id, nativeRgba(readFileSync(`${docs}/vues/${id}.png`)).pixels));
  const href = `data:image/png;base64,${hair.toString("base64")}`;
  const scaleX = revision?.scaleX ?? 1;
  const scaleY = revision?.scaleY ?? 1;
  const x = (-left + (revision?.x ?? 0) + w / 2 * (1 - scaleX)) / step;
  // Anchor vertical registration at the forehead so the longer tips do not
  // shift the hairline when the new portrait is fitted to Iris.
  const y = headroom + ((revision?.y ?? 0) - top + 196 * (1 - scaleY)) / step;
  const image = `<image x="${x}" y="${y}" width="${w * scaleX / step}" height="${h * scaleY / step}"
    ${revision ? 'preserveAspectRatio="none"' : ""} href="${href}"/>`;
  let drawing = image;
  if (id === "05-nova") {
    drawing = `<defs><mask id="without-flyaways" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="white"/>
      <g transform="translate(0 ${headroom})">
        <path d="${novaFlyaway}"/>
        <path transform="translate(${width} 0) scale(-1 1)" d="${novaFlyaway}"/>
      </g>
    </mask></defs><g mask="url(#without-flyaways)">${image}</g>`;
  }
  const artwork = paint(width, height, `0 0 ${width} ${height}`, drawing);
  let registered = artwork.asPng();
  const { pixels } = nativeRgba(registered);
  const tonePixels = artwork.pixels;
  if (id === "04-velvet") {
    // Fit the crown above the hairline and retain the approved ponytail pixels.
    const crownBase = headroom + 78;
    const crownScale = .82;
    const crown = paint(width, crownBase, `0 0 ${width} ${crownBase}`,
      `<g transform="translate(0 ${crownBase * (1 - crownScale)}) scale(1 ${crownScale})">${image}</g>`);
    pixels.set(nativeRgba(crown.asPng()).pixels);
    tonePixels.set(crown.pixels);
    registered = rgbaPng(width, height, pixels);
  }
  const mask = new Uint8Array(pixels.length);
  const protectedInk = id === "05-nova" ? new Uint8Array(pixels.length) : undefined;
  const details = id === "05-nova" ? new Uint8Array(pixels.length) : undefined;
  const cuffArea = protectedInk ? paint(width, height, `0 0 ${width} ${height}`,
    `<path transform="translate(${x} ${y}) scale(${scaleX / step} ${scaleY / step})" d="${novaCuffs}"/>`).pixels : undefined;
  let protectedCount = 0;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    if (!pixels[i + 3]) continue;
    const [r, g, b] = pixels.subarray(i, i + 3);
    if (protectedInk && cuffArea && cuffArea[i + 3] > 120 && Math.max(r, g, b) - Math.min(r, g, b) < 43) {
      protectedInk.fill(255, i, i + 4);
      protectedCount++;
    } else if (details) {
      // Magenta has more blue than green, while the brown base is warm.
      // Soft, complementary weights preserve the blend between the two dyes.
      const pink = (x < 396 || x > 491) && r - g > 15
        ? Math.round(255 * Math.min(1, Math.max(0, (b - g - 2) / 9))) : 0;
      if (pink) details.fill(pink, i, i + 4);
      if (pink < 255) mask.fill(255 - pink, i, i + 4);
    } else mask.fill(255, i, i + 4);
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  const mainTone = measureFabricTone(tonePixels, mask);
  const detailTone = details ? measureFabricTone(tonePixels, details) : undefined;
  if (!mainTone || minY < 2 || minX < 2) throw new Error(`Détourage incorrect : ${id}`);
  if (protectedInk && protectedCount < 100) throw new Error("Attaches de Nova introuvables");
  writeFileSync(`${output}/${id}.png`, registered);
  writeFileSync(`${output}/${id}-mask.png`, rgbaPng(width, height, mask));
  if (protectedInk) writeFileSync(`${output}/${id}-protected.png`, rgbaPng(width, height, protectedInk));
  if (details && detailTone) writeFileSync(`${output}/${id}-detail.png`, rgbaPng(width, height, details));
  if (details && !detailTone) throw new Error("Mèches roses de Nova introuvables");
  return { id, name: nom, crop: [minX - 6, minY - headroom - 6, maxX - minX + 13, maxY - minY + 13],
    offsetY: -headroom, mainTone, detailTone, hasProtected: Boolean(protectedInk) };
});
writeFileSync(`${output}/index.json`, JSON.stringify({ pattern: DOLL_PATTERN.id, bodySha256: DOLL_PATTERN.bodySha256, pieces }, null, 2) + "\n");

function cleanTransparentSource(source: Buffer) {
  const raster = paint(w, h, `0 0 ${w} ${h}`,
    `<image width="${w}" height="${h}" preserveAspectRatio="none" href="data:image/png;base64,${source.toString("base64")}"/>`);
  const { pixels } = nativeRgba(raster.asPng());
  const alpha = Uint8Array.from({ length: w * h }, (_, n) => pixels[n * 4 + 3] >= 8 ? pixels[n * 4 + 3] : 0);
  removeSpecks(alpha);
  for (let n = 0; n < alpha.length; n++) {
    if (!alpha[n]) pixels.fill(0, n * 4, n * 4 + 4);
    else if (alpha[n] >= 245) pixels[n * 4 + 3] = 255;
  }
  return rgbaPng(w, h, pixels);
}
