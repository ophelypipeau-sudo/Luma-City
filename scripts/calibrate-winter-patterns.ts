import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";
import {
  DOLL_PATTERN,
  torsoBounds,
  seam,
  armAxis,
  armFrame,
  type Point,
  type Pose,
} from "../packages/domain/src/avatar-pattern";
import {
  AVATAR_GARMENTS,
  avatarCatalogSnapshot,
} from "../apps/web/src/avatar/catalog";
import { BURGUNDY_GARMENTS } from "../apps/web/src/avatar/burgundy";
import { materialArt } from "../apps/web/src/avatar/materials";
const W = 887,
  H = 1774,
  src = "public/assets/avatar/winter-v1",
  out = "public/assets/avatar/winter-v2";
mkdirSync(out, { recursive: true });
const bodyFile = "public/assets/avatar/fashion-v2/body-user.png";
if (
  createHash("sha256").update(readFileSync(bodyFile)).digest("hex") !==
  DOLL_PATTERN.bodySha256
)
  throw Error("Wrong body for this pattern");
for (const file of readdirSync(src).filter((f) => f.endsWith(".png")))
  copyFileSync(`${src}/${file}`, `${out}/${file}`);
const load = (path: string) => pngPixels(readFileSync(path)).pixels;
const empty = () => new Uint8Array(W * H * 4);
function over(dst: Uint8Array, i: number, rgba: readonly number[]) {
  const a = rgba[3] / 255,
    b = (dst[i + 3] / 255) * (1 - a),
    s = a + b;
  if (!s) return;
  for (let c = 0; c < 3; c++) dst[i + c] = (rgba[c] * a + dst[i + c] * b) / s;
  dst[i + 3] = s * 255;
}
function sample(p: Uint8Array, x: number, y: number) {
  const a = Math.floor(x),
    b = Math.floor(y),
    u = x - a,
    v = y - b;
  let alpha = 0;
  const c = [0, 0, 0, 0];
  for (const [dx, dy, w] of [
    [0, 0, (1 - u) * (1 - v)],
    [1, 0, u * (1 - v)],
    [0, 1, (1 - u) * v],
    [1, 1, u * v],
  ]) {
    const xx = a + dx,
      yy = b + dy;
    if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
    const i = (yy * W + xx) * 4,
      k = p[i + 3] * w;
    alpha += k;
    for (let n = 0; n < 3; n++) c[n] += p[i + n] * k;
  }
  if (alpha) for (let n = 0; n < 3; n++) c[n] /= alpha;
  c[3] = alpha;
  return c;
}
function triangle(p: Uint8Array, dst: Uint8Array, s: Point[], d: Point[]) {
  const [a, b, c] = d,
    den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (Math.abs(den) < 0.001) return;
  for (
    let y = Math.max(0, Math.floor(Math.min(...d.map((p) => p[1]))));
    y <= Math.min(H - 1, Math.ceil(Math.max(...d.map((p) => p[1]))));
    y++
  )
    for (
      let x = Math.max(0, Math.floor(Math.min(...d.map((p) => p[0]))));
      x <= Math.min(W - 1, Math.ceil(Math.max(...d.map((p) => p[0]))));
      x++
    ) {
      const u =
          ((b[1] - c[1]) * (x + 0.5 - c[0]) +
            (c[0] - b[0]) * (y + 0.5 - c[1])) /
          den,
        v =
          ((c[1] - a[1]) * (x + 0.5 - c[0]) +
            (a[0] - c[0]) * (y + 0.5 - c[1])) /
          den,
        t = 1 - u - v;
      if (u < 0 || v < 0 || t < 0) continue;
      // Each triangle owns its pixels; do not alpha-compose adjacent strip seams.
      const rgba = sample(
          p,
          u * s[0][0] + v * s[1][0] + t * s[2][0],
          u * s[0][1] + v * s[1][1] + t * s[2][1],
        ),
        i = (y * W + x) * 4;
      if (rgba[3] > dst[i + 3]) dst.set(rgba, i);
    }
}
function deformArm(
  p: Uint8Array,
  pose: Pose,
  side: "left" | "right",
  start = 0,
  end = 1,
) {
  const s = armAxis("front", side),
    d = armAxis(pose, side),
    dst = empty(),
    r = 96,
    steps = 100;
  for (let k = Math.round(start * steps); k < Math.round(end * steps); k++) {
    const f = armFrame(s, k / steps),
      g = armFrame(s, (k + 1) / steps),
      F = armFrame(d, k / steps),
      G = armFrame(d, (k + 1) / steps),
      at = (f: ReturnType<typeof armFrame>, a: number): Point => [
        f.p[0] + f.n[0] * a,
        f.p[1] + f.n[1] * a,
      ];
    const ss = [at(f, -r), at(f, r), at(g, r), at(g, -r)],
      raw = [at(F, -r), at(F, r), at(G, r), at(G, -r)];
    // Bind the shoulder root to the unchanged torso, then gradually bend the sleeve.
    const dd = raw.map((p, i): Point => {
      const t = (k + (i >= 2 ? 1 : 0)) / steps,
        w = Math.min(1, t / 0.35);
      return [
        ss[i][0] + (p[0] - ss[i][0]) * w,
        ss[i][1] + (p[1] - ss[i][1]) * w,
      ];
    });
    triangle(p, dst, [ss[0], ss[1], ss[2]], [dd[0], dd[1], dd[2]]);
    triangle(p, dst, [ss[0], ss[2], ss[3]], [dd[0], dd[2], dd[3]]);
  }
  return dst;
}
function composite(...parts: Uint8Array[]) {
  const dst = empty();
  for (const p of parts)
    for (let i = 0; i < p.length; i += 4)
      if (p[i + 3]) over(dst, i, p.subarray(i, i + 4));
  return dst;
}
const save = (name: string, p: Uint8Array) =>
  writeFileSync(`${out}/${name}.png`, rgbaPng(W, H, p));
const specs: {
  name: string;
  kind: string;
  neck: number[];
  shoulder?: readonly [number, number];
  cuff: number;
  hem: number;
  ease: number;
  static?: boolean;
  input?: string;
}[] = [
  {
    name: "pink-jacket",
    kind: "pink",
    neck: [282, 335],
    cuff: 855,
    hem: 640,
    ease: 5,
  },
  {
    name: "snow-top",
    kind: "snow",
    neck: [388, 388],
    cuff: 853,
    hem: 690,
    ease: 4,
  },
  {
    name: "ivory-dress",
    kind: "ivory",
    neck: [283, 300],
    shoulder: [358, 345],
    cuff: 867,
    hem: 970,
    ease: 8,
  },
  {
    name: "ribbon-cardigan",
    kind: "ribbon",
    neck: [323, 345],
    cuff: 859,
    hem: 630,
    ease: 8,
  },
];
specs.push({
  name: "ribbon-camisole",
  kind: "ribbon-camisole",
  neck: [0, 0],
  cuff: 815,
  hem: 735,
  ease: 3,
  static: true,
});
// Normalize the two existing long-sleeve tops once, including their original UV bands.
// Read the immutable original definitions, not the newly bound catalogue outputs.
for (const [id, name, cuff, hem] of [
  ["fashion.cardigan-lilac", "legacy-lilac", 825, 648],
  ["fashion.burgundy-fold-sweater", "legacy-burgundy", 857, 760],
] as const) {
  const piece = [...AVATAR_GARMENTS, ...BURGUNDY_GARMENTS].find(
      (p) => p.id === id,
    )!,
    art = materialArt(piece);
  if (art.kind !== "image") throw Error(id);
  const files = [
    ["", art.front],
    ["-mask", art.colorMasks!.main],
    ["-detail-mask", art.colorMasks?.detail],
  ] as const;
  for (const [suffix, url] of files) {
    if (!url) continue;
    const data = pngPixels(readFileSync("public" + url)),
      dst = empty();
    for (let y = 0; y < H; y++) {
      const band = (
        art.bands ?? [{ sourceY: 0, sourceHeight: H, y: 0, height: H }]
      ).find((b) => y >= b.y && y < b.y + b.height);
      if (!band) continue;
      const sy =
          band.sourceY + ((y - band.y) * band.sourceHeight) / band.height,
        stops = art.widthStops;
      let sx = art.scaleX ?? 1;
      if (stops?.length) {
        const next = stops.findIndex((s) => s.y >= sy);
        if (next <= 0) sx = stops[next === 0 ? 0 : stops.length - 1].scaleX;
        else {
          const a = stops[next - 1],
            b = stops[next];
          sx = a.scaleX + ((b.scaleX - a.scaleX) * (sy - a.y)) / (b.y - a.y);
        }
      }
      for (let x = 0; x < W; x++)
        dst.set(
          sample(data.pixels, W / 2 + (x - W / 2) / sx, sy),
          (y * W + x) * 4,
        );
    }
    save(name + suffix, dst);
  }
  specs.push({
    name,
    kind: name,
    neck: [0, 0],
    cuff,
    hem,
    ease: 5,
    input: out,
  });
}
const reports: any[] = [];
function split(p: Uint8Array, collar?: Uint8Array, cuts?: Map<number, Point>) {
  const torso = empty(),
    left = empty(),
    right = empty();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (!p[i + 3]) continue;
      const [cut, cutRight] = cuts?.get(y) ?? [seam(y), 887 - seam(y)];
      if (collar?.[i + 3] && y < 490) {
        torso.set(p.subarray(i, i + 4), i);
        continue;
      }
      if (y >= 345 && y < 890 && x < cut + 3) left.set(p.subarray(i, i + 4), i);
      if (y >= 345 && y < 890 && x > cutRight - 3)
        right.set(p.subarray(i, i + 4), i);
      if (y < 345 || y >= 890 || (x >= cut && x <= cutRight))
        torso.set(p.subarray(i, i + 4), i);
    }
  return { torso, left, right };
}
const loadBody = load(bodyFile),
  body = split(loadBody);
for (const pose of ["hand-on-hip", "heart-hands"] as const) {
  const arm =
    pose === "heart-hands"
      ? composite(
          deformArm(body.left, pose, "left"),
          deformArm(body.right, pose, "right"),
        )
      : deformArm(body.right, pose, "right");
  save(
    `body-${pose}`,
    composite(
      arm,
      load(
        `public/assets/avatar/poses/redraw-v4/${pose === "heart-hands" ? "heart-hands" : "hip-hand"}.png`,
      ),
    ),
  );
}
for (const spec of specs) {
  const input = spec.input ?? src,
    original = load(`${input}/${spec.name}.png`);
  let collar: Uint8Array | undefined;
  if (
    spec.kind === "pink" ||
    spec.kind === "snow" ||
    spec.kind === "legacy-burgundy"
  ) {
    collar = Uint8Array.from(original);
    collar.fill(
      0,
      (spec.kind === "pink" ? 445 : spec.kind === "snow" ? 490 : 450) * W * 4,
    );
  }
  let parts = split(original, collar);
  // Explicit source hem, never the image bounds or the full-row envelope including hands.
  let sourceHem = 0;
  for (let y = 500; y < 1050; y++) {
    let n = 0;
    for (let x = 320; x < 565; x++)
      if (parts.torso[(y * W + x) * 4 + 3] > 10) n++;
    if (n > 0) sourceHem = y;
  }
  if (!sourceHem) sourceHem = 630;
  // Bishop sleeves need their own separation seam: a body seam would slice off
  // their volume and accidentally paste the remaining fabric onto the hips.
  const cuts = new Map<number, Point>();
  for (let y = 500; y < 890; y++) {
    if (y > sourceHem) {
      cuts.set(y, [443, 444]);
      continue;
    }
    const runs: number[][] = [];
    let start = -1;
    for (let x = 0; x <= W; x++) {
      const on = x < W && original[(y * W + x) * 4 + 3] > 100;
      if (on && start < 0) start = x;
      else if (!on && start >= 0) {
        if (x - start > 6) runs.push([start, x - 1]);
        start = -1;
      }
    }
    const [bodyLeft, bodyRight] = torsoBounds(y);
    const panels = runs.filter(
      (r) =>
        (r[0] + r[1]) / 2 >= bodyLeft - 40 &&
        (r[0] + r[1]) / 2 <= bodyRight + 40,
    );
    // A slit or an open cardigan creates multiple torso panels, not extra arms.
    let center = panels.length
      ? [panels[0][0], panels.at(-1)![1]]
      : runs.find((r) => r[0] < 443 && r[1] > 443);
    if (!center) {
      const left = runs.filter((r) => r[1] < 443 && r[1] > 330).at(-1),
        right = runs.find((r) => r[0] > 443 && r[0] < 557);
      if (left && right) center = [left[0], right[1]];
    }
    if (!center) continue;
    const a = runs.filter((r) => r[1] < center![0]).at(-1),
      b = runs.find((r) => r[0] > center![1]);
    cuts.set(y, [
      a ? (a[1] + center[0]) / 2 : seam(y),
      b ? (center[1] + b[0]) / 2 : 887 - seam(y),
    ]);
  }
  parts = split(original, collar, cuts);
  const upperMap = (y: number) =>
    spec.shoulder && y >= spec.neck[1] && y < 480
      ? y < spec.shoulder[1]
        ? spec.neck[0] +
          ((y - spec.neck[1]) * (spec.shoulder[0] - spec.neck[0])) /
            (spec.shoulder[1] - spec.neck[1])
        : spec.shoulder[0] +
          ((y - spec.shoulder[1]) * (480 - spec.shoulder[0])) /
            (480 - spec.shoulder[1])
      : y < spec.neck[1]
        ? spec.neck[0] + y - spec.neck[1]
        : y < 480
          ? spec.neck[0] +
            ((y - spec.neck[1]) * (480 - spec.neck[0])) / (480 - spec.neck[1])
          : y;
  const torsoMap = (y: number) =>
    y <= 600
      ? upperMap(y)
      : 600 + ((y - 600) * (sourceHem - 600)) / (spec.hem - 600);
  const rows = new Map<number, [number, number, number, number]>();
  for (let y = 480; y <= spec.hem; y++) {
    const sy = torsoMap(y),
      iy = Math.min(H - 1, Math.round(sy));
    let a = W,
      b = 0;
    for (let x = 0; x < W; x++)
      if (parts.torso[(iy * W + Math.floor(x)) * 4 + 3] > 120) {
        a = Math.min(a, x);
        b = Math.max(b, x);
      }
    if (b - a < 40) continue;
    const [l, r] = torsoBounds(y, spec.ease);
    rows.set(y, [a, b, l, r]);
  }
  for (const suffix of ["", "-mask", "-detail-mask"]) {
    const path = `${input}/${spec.name}${suffix}.png`;
    let p: Uint8Array;
    try {
      p = load(path);
    } catch {
      continue;
    }
    // The whole collar/cuff is one fur material, including its white highlights.
    // Classifying those highlights by RGB would incorrectly dye them as jacket fabric.
    if (spec.kind === "pink" && suffix) {
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          if (
            !original[i + 3] ||
            !(y < 470 || y > 728) ||
            Math.max(original[i], original[i + 1], original[i + 2]) < 60
          )
            continue;
          p.set(
            suffix === "-detail-mask" ? [255, 255, 255, 255] : [0, 0, 0, 0],
            i,
          );
        }
    }
    const s = split(p, collar, cuts),
      torso = empty(),
      left = empty(),
      right = empty();
    // Calibrate each panel independently. Sleeve UVs use the same wrist and elbow as skin.
    for (let y = 0; y < H; y++) {
      const sy = torsoMap(y),
        row = rows.get(y),
        fade = Math.max(0, Math.min(1, (y - 490) / 30));
      for (let x = 0; x < W; x++) {
        let xx = x;
        if (row) {
          const [a, b, l, r] = row;
          const mapped = a + ((x - l) * (b - a)) / (r - l);
          xx = x + (mapped - x) * fade;
        }
        torso.set(sample(s.torso, xx, sy), (y * W + x) * 4);
      }
    }
    for (const [side, part, dst] of [
      ["left", s.left, left],
      ["right", s.right, right],
    ] as const) {
      for (let y = 345; y <= 815; y++) {
        const sy =
          y <= 600 ? upperMap(y) : 600 + ((y - 600) * (spec.cuff - 600)) / 215;
        // Correct sleeve centre/width against actual body spans; bishop/fur volume is kept.
        let a = W,
          b = 0,
          ba = W,
          bb = 0;
        const iy = Math.round(sy),
          by = y;
        for (
          let x = side === "left" ? 0 : 444;
          x < (side === "left" ? 443 : W);
          x++
        ) {
          if (
            (side === "left" ? parts.left : parts.right)[(iy * W + x) * 4 + 3] >
            120
          ) {
            a = Math.min(a, x);
            b = Math.max(b, x);
          }
          if (
            (side === "left" ? body.left : body.right)[(by * W + x) * 4 + 3] >
            120
          ) {
            ba = Math.min(ba, x);
            bb = Math.max(bb, x);
          }
        }
        if (b < a || bb < ba) continue;
        // Expand smoothly from the shoulder without translating or narrowing a
        // looser source sleeve. A hard switch at the bust created visible notches.
        const t = Math.max(0, Math.min(1, (y - 345) / 135)),
          w = t * t * (3 - 2 * t);
        const l = a + (Math.min(a, ba - 4) - a) * w,
          r = b + (Math.max(b, bb + 4) - b) * w;
        for (
          let x = Math.max(0, Math.floor(l));
          x <= Math.min(W - 1, Math.ceil(r));
          x++
        )
          dst.set(
            sample(part, a + ((x - l) * (b - a)) / (r - l), sy),
            (y * W + x) * 4,
          );
      }
    }
    save(spec.name + suffix, composite(torso, left, right));
    for (const pose of spec.static
      ? []
      : (["hand-on-hip", "heart-hands"] as const)) {
      // The torso is literally the same pixels in every pose. Forearms pass in front.
      const rear = composite(
        deformArm(left, pose, "left", 0, 0.5),
        deformArm(right, pose, "right", 0, 0.5),
      );
      const front = composite(
        deformArm(left, pose, "left", 0.5, 1),
        deformArm(right, pose, "right", 0.5, 1),
      );
      save(
        `${spec.kind}-${pose === "heart-hands" ? "heart" : "hip"}${suffix}`,
        composite(rear, torso, front),
      );
    }
  }
  reports.push({
    ...spec,
    sourceHem,
    pattern: DOLL_PATTERN.id,
    poses: ["front", "hand-on-hip", "heart-hands"],
    torsoShared: true,
  });
}
writeFileSync(
  `${out}/pattern-registration.json`,
  JSON.stringify({ pattern: DOLL_PATTERN, reports }, null, 2),
);
console.log(
  "Canonical torso panels and skeleton-bound sleeves calibrated on the unchanged body.",
);
// Lower-body pieces follow fixed waist / hip / leg / foot anchors, independent of arm pose.
const lower = [
  { name: "pink-skirt", role: "skirt", ease: 12 },
  { name: "snow-shorts", role: "shorts", ease: 8 },
  { name: "ribbon-skirt", role: "skirt", ease: 16 },
  { name: "pink-warmers", role: "legwear", ease: 70 },
  { name: "snow-warmers", role: "legwear", ease: 18 },
  { name: "ivory-boots", role: "shoes", ease: 18 },
  { name: "pink-pumps", role: "pumps", ease: 10 },
  { name: "snow-pumps", role: "pumps", ease: 10 },
  { name: "ribbon-loafers", role: "pumps", ease: 12 },
] as const;
for (const cut of lower) {
  const original = load(`${src}/${cut.name}.png`),
    mapping = new Map<number, number[]>();
  const yRange: number[] = [];
  for (let y = 0; y < H; y++) {
    let n = 0;
    for (let x = 250; x < 640; x++)
      if (original[(y * W + x) * 4 + 3] > 140) n++;
    if (n > 0) yRange.push(y);
  }
  const first = yRange[0],
    last = yRange.at(-1)!;
  if (!Number.isFinite(first)) throw Error(`Empty cut ${cut.name}`);
  const bottom = cut.role === "skirt" || cut.role === "shorts",
    sourceWaist = first,
    targetWaist = DOLL_PATTERN.waistY;
  const footwear = cut.role === "pumps" || cut.role === "shoes";
  const targetLast = footwear ? DOLL_PATTERN.floorY : last;
  const targetFirst =
    footwear && first > 1600
      ? Math.floor(
          1600 + ((first - 1600) * (targetLast - 1600)) / (last - 1600),
        )
      : first;
  for (let y = bottom ? targetWaist : targetFirst; y <= targetLast; y++) {
    const sy = bottom
        ? sourceWaist +
          ((y - targetWaist) * (last - sourceWaist)) / (last - targetWaist)
        : footwear && y > 1600
          ? 1600 + ((y - 1600) * (last - 1600)) / (targetLast - 1600)
          : y,
      iy = Math.round(sy);
    if (bottom) {
      let a = W,
        b = 0;
      for (let x = 0; x < W; x++)
        if (original[(iy * W + x) * 4 + 3] > 100) {
          a = Math.min(a, x);
          b = Math.max(b, x);
        }
      if (b - a < 40) continue;
      const bodyY = Math.min(800, y),
        [bl, br] = torsoBounds(bodyY, cut.ease / 2),
        width = Math.max(br - bl, b - a),
        c = (bl + br) / 2;
      // Waist is attached to the body; the original flare is conserved below the hips.
      const t = Math.max(0, Math.min(1, (y - targetWaist) / 90)),
        waist = torsoBounds(targetWaist, cut.ease / 2),
        l = waist[0] * (1 - t) + (c - width / 2) * t,
        r = waist[1] * (1 - t) + (c + width / 2) * t;
      mapping.set(y, [sy, a, b, l, r]);
    } else
      for (let side = 0; side < 2; side++) {
        let a = W,
          b = 0,
          ba = W,
          bb = 0;
        for (let x = side ? 444 : 240; x < (side ? 650 : 443); x++) {
          if (original[(iy * W + x) * 4 + 3] > 100) {
            a = Math.min(a, x);
            b = Math.max(b, x);
          }
          if (loadBody[(Math.min(y, 1740) * W + x) * 4 + 3] > 140) {
            ba = Math.min(ba, x);
            bb = Math.max(bb, x);
          }
        }
        if (b < a || bb < ba) continue;
        const c = (ba + bb) / 2,
          width =
            cut.role === "pumps" || y > 1640
              ? b - a
              : Math.max(b - a, bb - ba + cut.ease);
        mapping.set(y * 2 + H + side, [sy, a, b, c - width / 2, c + width / 2]);
      }
  }
  for (const suffix of ["", "-mask", "-detail-mask"]) {
    let p: Uint8Array;
    try {
      p = load(`${src}/${cut.name}${suffix}.png`);
    } catch {
      continue;
    }
    const dst = empty();
    for (const [key, [sy, a, b, l, r]] of mapping) {
      const y = bottom ? key : Math.floor((key - H) / 2);
      for (
        let x = Math.max(0, Math.floor(l));
        x <= Math.min(W - 1, Math.ceil(r));
        x++
      )
        dst.set(
          sample(p, a + ((x - l) * (b - a)) / (r - l), sy),
          (y * W + x) * 4,
        );
    }
    save(cut.name + suffix, dst);
  }
  reports.push({
    ...cut,
    sourceWaist,
    waist: bottom ? targetWaist : undefined,
    pattern: DOLL_PATTERN.id,
    poses: ["front", "hand-on-hip", "heart-hands"],
    sharedLegs: true,
  });
}
writeFileSync(
  `${out}/pattern-registration.json`,
  JSON.stringify({ pattern: DOLL_PATTERN, reports }, null, 2),
);
// Explicit protection in final UV coordinates, including anti-aliased contours.
for (const piece of avatarCatalogSnapshot()) {
  if (
    piece.art.kind !== "image" ||
    !piece.art.front.startsWith("/assets/avatar/winter-v2/") ||
    !piece.art.colorMasks
  )
    continue;
  const p = load("public" + piece.art.front),
    main = load("public" + piece.art.colorMasks.main),
    detail = piece.art.colorMasks.detail
      ? load("public" + piece.art.colorMasks.detail)
      : undefined,
    protectedInk = empty();
  for (let i = 0; i < p.length; i += 4)
    if (p[i + 3] && !main[i + 3] && !detail?.[i + 3])
      protectedInk.set([255, 255, 255, p[i + 3]], i);
  writeFileSync(
    "public" + piece.art.front.replace(/\.png$/, "-protected.png"),
    rgbaPng(W, H, protectedInk),
  );
}

await import("./finalize-pattern-materials");
