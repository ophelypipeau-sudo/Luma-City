import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { DOLL_PATTERN, restingArmMask } from "../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./lib/png-rgba";

const capsule = "docs/capsule-premium-v1";
const output = capsule + "/coeur";
const assets = "public/assets/avatar";
const [w, h] = DOLL_PATTERN.canvas;
const read = (file: string) => pngPixels(readFileSync(file));
const offset = (x: number, y: number) => (y * w + x) * 4;
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`;
const stencil = (path: string) =>
  new Resvg(svg(`<path d="${path}"/>`)).render().pixels;
const save = (file: string, data: Uint8Array) =>
  writeFileSync(output + "/" + file, rgbaPng(w, h, data));
const limit = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => limit(n) ** 2 * (3 - 2 * limit(n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function over(dst: Uint8Array, i: number, src: Uint8Array, j: number, a: number) {
  const b = (dst[i + 3] / 255) * (1 - a);
  if (a + b === 0) return;
  for (let c = 0; c < 3; c++)
    dst[i + c] = Math.round((src[j + c] * a + dst[i + c] * b) / (a + b));
  dst[i + 3] = Math.round((a + b) * 255);
}

const arms = read(assets + "/poses/redraw-v4/heart-arms.png").pixels;
const hand = read(assets + "/poses/canonical-hands-v1/heart-hands.png").pixels;
const face = read(capsule + "/calques/atelier-face.png").pixels;
const rest = stencil(restingArmMask("left") + " " + restingArmMask("right"));
const body = new Uint8Array(face.length);
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    const i = offset(x, y), side = Math.min(x, 886 - x);
    // Keep the uninterrupted shoulder and clavicle painting from the base.
    // Below it, fade into the posed arms where the forearms pass in front.
    const shoulder = smooth((450 - y) / 42);
    const torsoAlpha = face[i + 3] / 255;
    const restingCut = 1 - rest[i + 3] / 255;
    over(body, i, arms, i, arms[i + 3] / 255);
    over(body, i, face, i, torsoAlpha * restingCut);
    if (shoulder && side < 370 && y > 321) {
      const weight = shoulder * smooth((370 - side) / 14);
      const a = body[i + 3] * (1 - weight), b = face[i + 3] * weight;
      if (a + b)
        for (let c = 0; c < 3; c++)
          body[i + c] = Math.round((body[i + c] * a + face[i + c] * b) / (a + b));
      body[i + 3] = Math.round(a + b);
    }
  }
save("iris.png", body);

// Follow the outside of the painted forearm line. A cut inside that line
// leaves the straps and neckline visible through the wrists.
const forearms = stencil(
  "M182 674V620L208 598Q214 579 238 554Q262 528 282 500Q300 475 314 446Q319 440 324 435Q341 415 351 399Q358 390 361 380L377 350H505L522 380Q525 391 531 400Q543 419 557 435Q566 444 572 457Q582 482 599 500Q620 530 647 556Q670 581 678 598L705 620V674Z",
);
for (const [name, sleeves] of [["bare", []], ["right", ["right"]], ["both", ["left", "right"]]] as const) {
  const overlay = new Uint8Array(arms.length);
  for (let y = 344; y < 660; y++)
    for (let x = 208; x < 680; x++) {
      const i = offset(x, y);
      const covered = (sleeves as readonly string[]).includes(x < 443 ? "left" : "right");
      // Keep the same painted line on skin at either side of the cuff.
      const alpha = covered ? hand[i + 3] : arms[i + 3] * forearms[i + 3] / 255;
      if (!alpha) continue;
      overlay.set(arms.subarray(i, i + 3), i);
      overlay[i + 3] = Math.round(alpha);
    }
  save(`devant-${name}.png`, overlay);
}

// Each row maps a section of an ImageGen-painted sleeve to the native
// arm. Coordinates are source-pixel guides for cutout and registration.
// The center panel, trims, and lower edge use the approved frontal pixels.
type Row = readonly [y: number, sourceY: number, sourceOuter: number, sourceInner: number, seam: number];
const fitted = {
  "01-velvet": {
    source: "velvet", sides: ["right"], full: true,
    rows: [
      [346, 265, 917, 886, 562], [365, 292, 944, 883, 561],
      [395, 352, 974, 867, 553], [430, 428, 991, 862, 544],
      [450, 465, 996, 844, 529], [470, 508, 1003, 822, 525],
      [500, 568, 1024, 840, 541], [540, 649, 1055, 877, 550],
      [590, 735, 1072, 915, 568], [625, 789, 1057, 970, 591],
      [650, 808, 1044, 999, 617],
    ],
  },
  "05-rosalie": {
    source: "rosalie", sides: ["left", "right"], full: true,
    rows: [
      [396, 514, 194, 337, 338], [420, 542, 185, 321, 338],
      [450, 567, 171, 374, 349], [470, 605, 160, 374, 354],
      [510, 666, 137, 350, 345], [550, 735, 121, 318, 334],
      [590, 800, 117, 270, 322], [625, 856, 126, 214, 297],
      [650, 884, 143, 176, 271],
    ],
  },
  "04-minuit": {
    source: "minuit", sides: ["left", "right"], full: false,
    rows: [
      [347, 314, 315, 351, 334], [369, 352, 261, 360, 328],
      [410, 433, 222, 355, 329], [450, 510, 202, 331, 326],
      [487, 593, 179, 276, 314], [526, 672, 153, 219, 281],
      [561, 721, 137, 156, 247],
    ],
  },
  "07-ambre": {
    source: "ambre", sides: ["left", "right"], full: false,
    rows: [
      [347, 321, 310, 390, 325], [369, 352, 263, 397, 334],
      [397, 403, 233, 399, 347], [420, 449, 218, 381, 340],
      [437, 489, 263, 355, 320], [448, 514, 303, 338, 315],
    ],
  },
} as const satisfies Record<string, {
  source: string; sides: readonly string[]; full: boolean; rows: readonly Row[];
}>;
type Painting = (typeof fitted)[keyof typeof fitted];
const torso = stencil(
  "M290 235H597V420L582 463 569 500 555 533 545 559 536 590 541 620 559 663 594 723V805H290V723L328 663 348 620 352 590 342 559 333 533 317 500 304 463 290 420Z",
);
const velvetTorso = stencil(
  "M182 235H604V385L580 426 558 485 549 520 542 550 537 580 540 616 551 651 590 717V805H182Z",
);
const clothEdge = stencil(
  "M186 335H700V413L638 424Q606 423 574 447L551 473H336L313 447Q281 423 249 424L186 413Z",
);
const minuitEdge = stencil(
  "M186 335H700V568Q656 572 620 540L552 501H335L267 540Q231 572 186 568Z",
);
const leftEdges = new Int16Array(h).fill(-1);
const rightEdges = new Int16Array(h).fill(-1);
for (let y = 340; y < 655; y++) {
  for (let x = 202; x < 345; x++)
    if (arms[offset(x, y) + 3] > 8) { leftEdges[y] = x; break; }
  for (let x = 683; x > 545; x--)
    if (arms[offset(x, y) + 3] > 8) { rightEdges[y] = x; break; }
}

function rowAt(rows: readonly Row[], y: number) {
  const j = rows.findIndex((row) => row[0] >= y);
  if (j <= 0) return rows[j === 0 ? 0 : rows.length - 1];
  const a = rows[j - 1], b = rows[j];
  return a.map((v, k) => mix(v, b[k], (y - a[0]) / (b[0] - a[0])));
}
function textile(name: Painting["source"], r: number, g: number, b: number) {
  if (name === "ambre") return r > 75 && r - b > 40 && g > b + 18 && r - g > 28;
  if (name === "minuit") return r < 113 && Math.abs(r - g) < 17 && Math.abs(r - b) < 20;
  if (name === "velvet") return r < 186 && r >= b * 1.06 && r - g > 9 && b > g * 0.85;
  return r - g > 22 && r - b > 13 && r < 196 && b > g * 0.88;
}
const manifest = JSON.parse(readFileSync(capsule + "/calques/index.json", "utf8"));
for (const { id, poses } of manifest.pieces) {
  const readFront = (kind: string) => read(capsule + "/calques/" + poses.front[kind]).pixels;
  const art = Uint8Array.from(readFront("art"));
  const keep = readFront("protected");
  if (id === "03-eclat") {
    const neckline = stencil("M345 400H542V435Q550 465 594 517V774H293V517Q337 465 345 435Z");
    for (let y = 400; y < 517; y++)
      for (let x = 275; x < 612; x++) {
        const i = offset(x, y) + 3;
        art[i] = Math.min(art[i], neckline[i]);
      }
  }
  const paint = fitted[id as keyof typeof fitted];
  if (paint) {
    const source = read(output + "/sources/" + paint.source + ".png");
    for (let y = paint.rows[0][0]; y <= paint.rows.at(-1)![0]; y++) {
      const [, sy, outer, inner, seam] = rowAt(paint.rows, y);
      for (const side of paint.sides) {
        const right = side === "right", edge = right ? rightEdges[y] : leftEdges[y];
        if (edge < 0) continue;
        const join = Math.round(paint.source === "velvet" ? seam : right ? 887 - seam : seam);
        const lo = Math.min(edge, join), hi = Math.max(edge, join);
        for (let x = lo; x <= hi; x++) {
          const i = offset(x, y);
          if (keep[i + 3]) continue;
          const t = limit((x - edge) / (join - edge || 1));
          const flip = right && paint.source !== "velvet";
          const sampleX = mix(outer, inner, t);
          const sx = Math.round(flip ? source.width - 1 - sampleX : sampleX);
          let found = -1;
          const row = Math.round(sy) * source.width;
          const inward = (inner > outer ? 1 : -1) * (flip ? -1 : 1);
          for (let d = 0; d <= 95; d++) {
            const shift = d % 2 ? (d + 1) / 2 : -d / 2;
            const j = (row + sx + shift * inward) * 4;
            if (textile(paint.source, source.pixels[j], source.pixels[j + 1], source.pixels[j + 2])) {
              found = j;
              break;
            }
          }
          if (found < 0) continue;
          const cut = paint.full ? 255 : (paint.source === "ambre" ? clothEdge : minuitEdge)[i + 3];
          const arm = Math.min(arms[i + 3], cut) / 255;
          const blend = art[i + 3] > 100
            ? smooth((y - paint.rows[0][0]) / 20) * smooth((1 - t) * 4)
            : 1;
          over(art, i, source.pixels, found, arm * blend);
        }
      }
    }
    // Remove the resting sleeves outside the torso and the replacement contours.
    for (let y = 396; y < 850; y++)
      for (let x = 125; x < 770; x++) {
        const i = offset(x, y);
        if (keep[i + 3] || (paint.source === "velvet" && x < 443)) continue;
        const panel = (paint.source === "velvet" ? velvetTorso : torso)[i + 3];
        const cutoff = paint.source === "ambre" ? clothEdge : minuitEdge;
        const arm = y <= paint.rows.at(-1)![0]
          ? Math.min(arms[i + 3], paint.full ? 255 : cutoff[i + 3]) : 0;
        art[i + 3] = Math.min(art[i + 3], Math.max(panel, arm));
      }
  }
  const mask = new Uint8Array(art.length);
  for (let i = 0; i < art.length; i += 4)
    if (art[i + 3] && !keep[i + 3]) mask.set([255, 255, 255, 255], i);
  mkdirSync(output + "/" + id, { recursive: true });
  save(id + "/heart-hands.png", art);
  save(id + "/heart-hands-tissu.png", mask);
  save(id + "/heart-hands-protections.png", keep);
}
