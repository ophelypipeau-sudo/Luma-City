import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { pngPixels, inspectPiece } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";
const W = 887,
  H = 1774,
  root = "docs/burgundy-outfit-v2",
  out = "public/assets/avatar/burgundy-v2";
mkdirSync(root, { recursive: true });
mkdirSync(out, { recursive: true });
const bodyBytes = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
const body = pngPixels(bodyBytes).pixels;
type Span = [number, number];
function spans(p: Uint8Array, y: number): Span[] {
  const result: Span[] = [];
  let start = -1;
  for (let x = 0; x <= W; x++) {
    const on = x < W && p[(y * W + x) * 4 + 3] > 100;
    if (on && start < 0) start = x;
    if (!on && start >= 0) {
      if (x - start > 3) result.push([start, x - 1]);
      start = -1;
    }
  }
  return result;
}
const rows = Array.from({ length: H }, (_, y) => spans(body, y));
const levels = {
  shoulderStart: 345,
  shoulders: 370,
  bust: 480,
  underarms: 540,
  waist: 600,
  hipWaist: 690,
  hips: 780,
  wrists: 810,
  knees: 1160,
  calves: 1430,
  ankles: 1600,
  toes: 1740,
};
writeFileSync(
  `${root}/body-measurements.json`,
  JSON.stringify(
    {
      canvas: [W, H],
      bodySha256: createHash("sha256").update(bodyBytes).digest("hex"),
      landmarks: Object.fromEntries(
        Object.entries(levels).map(([name, y]) => [
          name,
          { y, spans: rows[y] },
        ]),
      ),
      rows,
    },
    null,
    2,
  ),
);
function envelope(list: Span[]): Span {
  return [list[0][0], list.at(-1)![1]];
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function sample(p: Uint8Array, x: number, y: number) {
  const x0 = Math.floor(x),
    f = x - x0;
  const result = [0, 0, 0, 0];
  let a = 0;
  for (let j = 0; j < 2; j++) {
    const xx = x0 + j;
    if (xx < 0 || xx >= W) continue;
    const i = (y * W + xx) * 4,
      alpha = p[i + 3] * (j ? f : 1 - f);
    a += alpha;
    for (let c = 0; c < 3; c++) result[c] += p[i + c] * alpha;
  }
  if (a) for (let c = 0; c < 3; c++) result[c] /= a;
  result[3] = a;
  return result;
}
for (const name of ["sweater", "skirt", "shoes"]) {
  const original = readFileSync(`public/assets/avatar/burgundy-v1/${name}.png`),
    pixels = pngPixels(original).pixels;
  const sourceRows = Array.from({ length: H }, (_, y) => spans(pixels, y));
  const dest = new Uint8Array(W * H * 4);
  const sleeveKnots =
    name === "sweater"
      ? [500, 520, 540, 600, 660, 720, 740, 800, 828, 844].map((y) => {
          const s = sourceRows[Math.min(y, 835)],
            b = rows[Math.min(y, 835)];
          const source =
            s.length >= 3
              ? [s[0][0], s[0][1], s[1][0], s[1][1], s.at(-1)![0], s.at(-1)![1]]
              : y === 500
                ? [s[0][0], 330, 331, 556, 557, s.at(-1)![1]]
                : [s[0][0], s[0][1], 280, 607, s.at(-1)![0], s.at(-1)![1]];
          const ease = y > 760 ? 10 : 5;
          let target: number[];
          if (b.length >= 3)
            target = [
              b[0][0] - ease,
              b[0][1] + ease,
              b[1][0] - 4,
              b[1][1] + 4,
              b.at(-1)![0] - ease,
              b.at(-1)![1] + ease,
            ];
          else {
            let l = 330,
              r = 556;
            for (let x = 300; x < 590; x++) {
              const i = (y * W + x) * 4;
              if (
                body[i + 3] > 230 &&
                body[i] - body[i + 1] > 12 &&
                body[i + 2] - body[i + 1] > 10 &&
                Math.abs(body[i] - body[i + 2]) < 30
              ) {
                l = Math.min(l, x);
                r = Math.max(r, x);
              }
            }
            target = [
              b[0][0] - 5,
              l - 5,
              l - 4,
              r + 4,
              r + 5,
              b.at(-1)![1] + 5,
            ];
          }
          return { y, source, target };
        })
      : [];
  for (let y = 0; y < H; y++) {
    const src = sourceRows[y];
    let b = name === "shoes" && y >= 1740 ? rows[1740] : rows[y];
    if (!src.length || !b.length) continue;
    if (name === "sweater" && y >= 480) {
      const next = sleeveKnots.findIndex((k) => k.y >= y),
        upper = sleeveKnots[Math.max(0, next - 1)],
        lower = sleeveKnots[next < 0 ? sleeveKnots.length - 1 : next];
      const t = lower.y === upper.y ? 0 : (y - upper.y) / (lower.y - upper.y);
      const sx = upper.source.map((v, i) => lerp(v, lower.source[i], t)),
        tx = upper.target.map((v, i) => lerp(v, lower.target[i], t));
      for (let x = Math.floor(tx[0]); x <= Math.ceil(tx[5]); x++) {
        if (x < 0 || x >= W) continue;
        let k = tx.findIndex((v) => v >= x);
        if (k < 1) k = 1;
        const q = (x - tx[k - 1]) / (tx[k] - tx[k - 1]);
        const sourceBounds = envelope(src),
          bodyBounds = envelope(b);
        const globalX = lerp(
          sourceBounds[0],
          sourceBounds[1],
          (x - bodyBounds[0] + 4) / (bodyBounds[1] - bodyBounds[0] + 8),
        );
        const blend = Math.max(0, Math.min(1, (y - 480) / 60));
        const p = sample(
            pixels,
            lerp(globalX, lerp(sx[k - 1], sx[k], q), blend),
            y,
          ),
          i = (y * W + x) * 4;
        for (let c = 0; c < 4; c++) dest[i + c] = Math.round(p[c]);
      }
      continue;
    }
    if (
      name === "sweater" &&
      src.length >= 3 &&
      b.length === 1 &&
      y > 490 &&
      y < 540
    ) {
      const chest: number[] = [];
      for (let x = 300; x < 590; x++) {
        const i = (y * W + x) * 4;
        if (
          body[i + 3] > 230 &&
          body[i] - body[i + 1] > 12 &&
          body[i + 2] - body[i + 1] > 10 &&
          Math.abs(body[i] - body[i + 2]) < 30
        )
          chest.push(x);
      }
      if (chest.length > 40) {
        const l = chest[0],
          r = chest.at(-1)!;
        b = [
          [b[0][0], l - 6],
          [l, r],
          [r + 6, b[0][1]],
        ];
      }
    }
    let targets: Span[], sources: Span[];
    if (name === "sweater") {
      if ((y < 528 && b.length === 1) || src.length === 1) {
        sources = [envelope(src)];
        targets = [envelope(b)];
      } else if (src.length >= 3 && b.length >= 3) {
        sources = [src[0], src[Math.floor(src.length / 2)], src.at(-1)!];
        targets = [b[0], b[Math.floor(b.length / 2)], b.at(-1)!];
      } else if (src.length === 2 && b.length >= 3) {
        sources = [src[0], src[1]];
        targets = [b[0], b.at(-1)!];
      } else {
        sources = [envelope(src)];
        targets = [envelope(b)];
      }
      // Fitted knit: 4 px torso ease, 5 px upper arms, 10 px flared cuffs.
      targets = targets.map(([l, r], i) => {
        const arm = sources.length > 1 && (i === 0 || i === sources.length - 1),
          ease = arm ? (y > 760 ? 10 : 5) : 4;
        return [l - ease, r + ease];
      });
    } else if (name === "skirt") {
      sources = [envelope(src)];
      const pelvis = b.filter(
        ([l, r]) => (l + r) / 2 > 250 && (l + r) / 2 < 635 && r - l > 45,
      );
      if (!pelvis.length) continue;
      const mid = envelope(pelvis);
      const ease = lerp(4, 24, Math.max(0, Math.min(1, (y - 690) / 325)));
      targets = [[mid[0] - ease, mid[1] + ease]];
    } else {
      const left = src.filter((s) => (s[0] + s[1]) / 2 < 443),
        right = src.filter((s) => (s[0] + s[1]) / 2 >= 443);
      const bl = b.filter((s) => (s[0] + s[1]) / 2 < 443),
        br = b.filter((s) => (s[0] + s[1]) / 2 >= 443);
      if (!left.length || !right.length || !bl.length || !br.length) continue;
      sources = [envelope(left), envelope(right)];
      const ease = y < 1630 ? 2 : 7;
      targets = [envelope(bl), envelope(br)].map(([l, r]) => [
        l - ease,
        r + ease,
      ]);
    }
    for (let part = 0; part < sources.length; part++) {
      let source = sources[part];
      const target = targets[part];
      // Keep rounded hems and cuffs: use the local envelope rather than
      // stretching a tiny final row to a whole body section.
      if (
        (name === "sweater" && y > 735) ||
        (name === "skirt" && y > 995) ||
        (name === "shoes" && y > 1725)
      ) {
        let l = source[0],
          r = source[1];
        for (let dy = -8; dy <= 0; dy++) {
          const nearby = sourceRows[Math.max(0, y + dy)];
          if (!nearby.length) continue;
          const candidate =
            name === "skirt"
              ? envelope(nearby)
              : sources.length === 3 && part === 1 && nearby.length >= 3
                ? nearby[Math.floor(nearby.length / 2)]
                : part === 0
                  ? nearby[0]
                  : nearby.at(-1)!;
          l = Math.min(l, candidate[0]);
          r = Math.max(r, candidate[1]);
        }
        source = [l, r];
      }
      for (let x = Math.floor(target[0]); x <= Math.ceil(target[1]); x++) {
        if (x < 0 || x >= W) continue;
        const t = (x - target[0]) / (target[1] - target[0]),
          sx = lerp(source[0], source[1], t);
        const rgba = sample(pixels, sx, y),
          i = (y * W + x) * 4;
        if (rgba[3] > dest[i + 3])
          for (let c = 0; c < 4; c++) dest[i + c] = Math.round(rgba[c]);
      }
    }
  }
  writeFileSync(`${out}/${name}.png`, rgbaPng(W, H, dest));
  for (const zone of name === "shoes" ? [1, 2] : [1]) {
    const mask = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (name === "shoes" && (zone === 1 ? y >= 1630 : y < 1630)) continue;
        mask[i] = mask[i + 1] = mask[i + 2] = 255;
        mask[i + 3] = dest[i + 3];
      }
    writeFileSync(`${out}/${name}-mask${zone}.png`, rgbaPng(W, H, mask));
  }
}
const top = readFileSync(`${out}/sweater.png`);
const report = inspectPiece(top, bodyBytes, {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
});
writeFileSync(`${root}/checks.json`, JSON.stringify(report, null, 2));
console.log(report);
if (report.some((r) => r.blocking && !r.ok)) process.exitCode = 1;
