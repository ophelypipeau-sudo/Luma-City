/** Isolate newly painted clothing at its ORIGINAL pixels. No resizing, UV mesh,
 * row scaling or coordinate deformation is performed by this pipeline. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";
import { torsoBounds } from "../packages/domain/src/avatar-pattern";
const W = 887,
  H = 1774,
  N = W * H,
  root = "public/assets/avatar/redrawn-v1";
mkdirSync(root, { recursive: true });
const source = (name: string) => {
  const p = pngPixels(readFileSync(`${root}/sources/${name}-front.png`));
  if (p.width !== W || p.height !== H) throw Error(`Wrong canvas: ${name}`);
  return p.pixels;
};
const svgMask = (d: string) =>
  pngPixels(
    new Resvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${d
        .split(/(?=M)/)
        .filter(Boolean)
        .map((path) => `<path d="${path}" fill="white"/>`)
        .join("")}</svg>`,
    )
      .render()
      .asPng(),
  ).pixels;
const box = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y}h${w}v${h}h-${w}Z`;
const skin = (r: number, g: number, b: number) =>
  r - g > 12 && g - b > 8 && r / g > 1.35 && g / Math.max(1, b) > 1.25;
const fringe = (r: number, g: number, b: number) =>
  r > 210 &&
  ((g < 85 && b < 100) || (g > 170 && b < 75) || (b > 175 && g < 85));
type Job = {
  key: string;
  src: string;
  region: string;
  skin?: boolean;
  select?: (x: number, y: number, r: number, g: number, b: number) => boolean;
  detail?: (x: number, y: number, r: number, g: number, b: number) => boolean;
  base?: string;
  detailBase?: string;
  protected?: (
    x: number,
    y: number,
    r: number,
    g: number,
    b: number,
  ) => boolean;
};
const only = new Set(process.argv.slice(2));
const manifest: Record<
  string,
  { crop: number[]; mainBase: string; detailBase: string; detail: boolean }
> = only.size ? JSON.parse(readFileSync(`${root}/manifest.json`, "utf8")) : {};
function isolate(job: Job) {
  if (only.size && !only.has(job.key)) return;
  const s = source(job.src),
    roi = svgMask(job.region),
    p = new Uint8Array(N * 4),
    bad = new Uint8Array(N);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const j = y * W + x,
        i = j * 4;
      const [r, g, b, a] = s.subarray(i, i + 4);
      if (!a || !roi[i + 3]) continue;
      if (
        fringe(r, g, b) ||
        (job.skin !== false && skin(r, g, b)) ||
        (job.select && !job.select(x, y, r, g, b))
      ) {
        bad[j] = 1;
        continue;
      }
      p.set(s.subarray(i, i + 4), i);
      p[i + 3] = (a * roi[i + 3]) / 255;
    }
  // Remove skin's ink fringe at the cut edge, not garment volume.
  if (job.skin !== false) {
    const grow = new Uint8Array(bad);
    for (let y = 4; y < H - 4; y++)
      for (let x = 4; x < W - 4; x++) {
        const j = y * W + x;
        if (!bad[j]) continue;
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++)
            if (dx * dx + dy * dy <= 9) grow[j + dy * W + dx] = 1;
      }
    for (let j = 0; j < N; j++) if (grow[j]) p[j * 4 + 3] = 0;
  }
  if (job.skin !== false) {
    const cleaned = new Uint8Array(p);
    for (let y = 2; y < H - 2; y++)
      for (let x = 2; x < W - 2; x++) {
        const j = y * W + x;
        if (!p[j * 4 + 3]) continue;
        let support = 0;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            if (p[(j + dy * W + dx) * 4 + 3] > 100) support++;
        if (support < 11) cleaned[j * 4 + 3] = 0;
      }
    p.set(cleaned);
  }
  // Speckles outside the textile are not part of the asset. Keep meaningful
  // disconnected cuffs, straps, shoe pairs and fur hairs.
  const seen = new Uint8Array(N),
    stack = new Int32Array(N);
  for (let j = 0; j < N; j++) {
    if (seen[j] || !p[j * 4 + 3]) continue;
    let start = 0,
      end = 1;
    stack[0] = j;
    seen[j] = 1;
    while (start < end) {
      const k = stack[start++];
      for (const q of [k - 1, k + 1, k - W, k + W])
        if (
          q >= 0 &&
          q < N &&
          !seen[q] &&
          p[q * 4 + 3] &&
          Math.abs((q % W) - (k % W)) < 2
        ) {
          seen[q] = 1;
          stack[end++] = q;
        }
    }
    if (end < 75) for (let k = 0; k < end; k++) p[stack[k] * 4 + 3] = 0;
  }
  const main = new Uint8Array(N * 4),
    detail = new Uint8Array(N * 4),
    protect = new Uint8Array(N * 4);
  let minX = W,
    minY = H,
    maxX = 0,
    maxY = 0,
    detailCount = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4,
        a = p[i + 3];
      if (!a) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      const [r, g, b] = p.subarray(i, i + 3);
      const secondary = job.detail?.(x, y, r, g, b) ?? false;
      // Dark ink outlines and deliberately protected motifs/seams retain source RGB.
      const j = y * W + x;
      const edge =
        x > 0 &&
        x < W - 1 &&
        y > 0 &&
        y < H - 1 &&
        [j - 1, j + 1, j - W, j + W].some((n) => !p[n * 4 + 3]);
      const fixed =
        Math.max(r, g, b) < 32 || edge || job.protected?.(x, y, r, g, b);
      const dst = fixed ? protect : secondary ? detail : main;
      dst.set([255, 255, 255, a], i);
      if (secondary && !fixed) detailCount++;
    }
  const save = (suffix: string, bytes: Uint8Array) =>
    writeFileSync(`${root}/${job.key}${suffix}.png`, rgbaPng(W, H, bytes));
  save("", p);
  save("-mask", main);
  save("-protected", protect);
  if (job.detail) save("-detail-mask", detail);
  manifest[job.key] = {
    crop: [
      Math.max(0, minX - 10),
      Math.max(0, minY - 10),
      maxX - minX + 21,
      maxY - minY + 21,
    ],
    mainBase: job.base ?? "#ded5c5",
    detailBase: job.detailBase ?? "#333333",
    detail: !!job.detail,
  };
  console.log(job.key, manifest[job.key].crop, detailCount);
}
const torso = (hem: number) =>
  `${box(60, 270, 770, 380)} M300 600H587L635 ${hem}H250Z M245 570L335 590 226 820 226 885H80L160 680Z M642 570L552 590 661 820 661 885H807L727 680Z`;
const topDefs = [
  {
    key: "lilac",
    src: "lilac",
    hem: 646,
    base: "#bc9cc7",
    detail: (x: number, y: number, r: number, g: number, b: number) =>
      x > 365 && x < 522 && y > 420 && y < 536 && Math.abs(r - b) > 10 && r > g,
    detailBase: "#eee5cf",
  },
  { key: "burgundy", src: "burgundy", hem: 767, base: "#6d2534" },
  {
    key: "pink-jacket",
    src: "pink",
    hem: 631,
    base: "#e8e0e0",
    detail: (x: number, y: number, r: number, g: number, b: number) =>
      r - b < 40 && r - g > 12 && r > b,
    detailBase: "#e8aac9",
  },
  {
    key: "snow-top",
    src: "snow",
    hem: 734,
    base: "#e4e4e7",
    detail: (_x: number, y: number) => y < 515,
    detailBase: "#f0f0f2",
  },
  { key: "ivory-dress", src: "ivory", hem: 915, base: "#e5d8c5" },
  {
    key: "ribbon-cardigan",
    src: "ribbon",
    hem: 642,
    base: "#e2a2b0",
    select: (_x: number, _y: number, r: number, g: number, b: number) =>
      r - g > 20 && b >= g - 6 && Math.abs(g - b) < 28,
  },
];
for (const t of topDefs) {
  isolate({ ...t, region: torso(t.hem) });
  for (const pose of ["hand-on-hip", "heart-hands"])
    isolate({
      ...t,
      key: `${t.key}-${pose}`,
      src: `${t.src}-${pose}`,
      region:
        pose === "heart-hands"
          ? box(100, 270, 690, t.hem - 270)
          : `${box(70, 270, 750, t.hem - 270)} M245 570L335 590 226 820 226 885H80L160 680Z M630 560L780 520V605L645 730 590 715 590 675Z`,
    });
}
// Fine straps and pointed scarf hem: manually traced garment contour excludes
// all skin before segmentation; tan leopard cloth must never be mistaken for skin.
isolate({
  key: "leopard",
  src: "leopard-raised",
  skin: false,
  base: "#a7754d",
  region:
    "M316 443Q331 422 370 438Q405 446 443 466Q483 439 521 433Q554 431 565 451L567 508Q545 553 524 605Q518 640 545 665L443 727 341 667Q365 635 359 605L322 517Z M397 315L405 320 331 454 322 454Z M484 316L493 317 562 451 555 452Z M398 318Q443 347 490 316L490 325Q443 353 398 325Z M436 343H449V480H436Z M443 345Q390 338 399 365Q415 397 446 345Q476 337 488 363Q484 390 443 345Z",
  protected: (_x, _y, r, g, b) => Math.max(r, g, b) < 100,
});
isolate({
  key: "rose-camisole",
  src: "rose",
  region: box(300, 330, 285, 285),
  base: "#e5e1e6",
  detail: (_x, _y, r, g, b) => Math.max(r, g, b) < 105,
  detailBase: "#29262a",
});
isolate({
  key: "ribbon-camisole",
  src: "extra-cami",
  region: box(300, 330, 285, 380),
  base: "#e7ddc9",
});
const bottoms = [
  {
    key: "pink-skirt",
    src: "pink",
    region: "M320 678Q440 730 565 678L615 740H650V903H240V740H275Z",
    base: "#9eafc1",
    detail: (_x: number, _y: number, r: number, g: number, b: number) =>
      r - g > 14,
    detailBase: "#dd95b9",
  },
  {
    key: "snow-shorts",
    src: "snow",
    region: "M305 710Q445 757 584 710L625 760H650V875H240V760H265Z",
    base: "#e7e7ea",
  },
  {
    key: "burgundy-skirt",
    src: "burgundy",
    region: box(200, 763, 490, 190),
    base: "#29282b",
    select: (_x: number, _y: number, r: number, g: number, b: number) =>
      Math.max(r, g, b) < 100 && Math.max(r, g, b) - Math.min(r, g, b) < 24,
  },
  {
    key: "ribbon-skirt",
    src: "ribbon",
    region: box(200, 627, 490, 320),
    base: "#29282b",
    select: (_x: number, _y: number, r: number, g: number, b: number) =>
      Math.max(r, g, b) < 100 && Math.max(r, g, b) - Math.min(r, g, b) < 24,
  },
  {
    key: "jeans",
    src: "lilac",
    region: "M317 687Q440 765 570 687L620 740H700V1632H190V740H270Z",
    select: (_x: number, y: number, r: number, g: number, b: number) =>
      !(r - g > 12 && b - g > 20) && (y < 1590 || b >= r),
    base: "#252d42",
  },
  {
    key: "cargo",
    src: "rose",
    region: "M317 682Q442 737 570 682L615 740H720V1700H170V740H270Z",
    base: "#d494b4",
    detail: (x: number, y: number, r: number, g: number, b: number) =>
      x > 420 && y > 765 && Math.max(r, g, b) < 105,
    detailBase: "#29262c",
  },
  {
    key: "fur-pants",
    src: "leopard",
    skin: false,
    region:
      "M317 690Q443 766 570 690Q650 750 650 900L710 1670H175L230 900Q235 750 317 690Z",
    base: "#3d3732",
    select: (_x: number, y: number, r: number, g: number, b: number) =>
      (y >= 1000 || (_x > 300 && _x < 590) || !skin(r, g, b)) &&
      (y < 1615 || (r > g * 1.1 && g > b * 1.1)),
    detail: (_x: number, y: number) => y > 1535,
    detailBase: "#9d683d",
  },
];
for (const b of bottoms)
  isolate({
    ...b,
    protected: (x, y, r, g, b) => {
      const neutral = Math.max(r, g, b) - Math.min(r, g, b) < 20;
      return (
        (neutral && Math.max(r, g, b) > 165 && y < 1200) ||
        (r > g * 1.25 && g > b * 1.1 && r > 120 && y < 1500)
      );
    },
  });
isolate({
  key: "pink-warmers",
  src: "pink",
  region: box(205, 1180, 470, 495),
  base: "#edb0d1",
});
isolate({
  key: "snow-warmers",
  src: "snow",
  region: box(245, 1350, 395, 300),
  base: "#e5e3e4",
});
const shoes = [
  { key: "pumps", src: "extra-pumps", start: 1610, base: "#e8e7e8" },
  {
    key: "gold-sneakers",
    src: "extra-gold-sneakers",
    start: 1570,
    base: "#322b26",
  },
  {
    key: "white-sneakers",
    src: "extra-white-sneakers",
    start: 1560,
    base: "#e4e4e8",
  },
  { key: "ivory-boots", src: "ivory", start: 1225, base: "#deceba" },
  {
    key: "ankle-boots",
    src: "extra-ankle-boots",
    start: 1500,
    base: "#e3d7c2",
  },
  { key: "socks-loafers", src: "burgundy", start: 1415, base: "#292629" },
  { key: "ribbon-loafers", src: "ribbon", start: 1605, base: "#292629" },
];
for (const s of shoes)
  isolate({
    ...s,
    ...(s.key === "pumps"
      ? {
          skin: false,
          select: (_x: number, _y: number, r: number, g: number, b: number) =>
            r - g < 30 && g - b < 40,
        }
      : {}),
    ...(s.key === "gold-sneakers"
      ? {
          skin: false,
          select: (_x: number, y: number, r: number, g: number, b: number) =>
            y >= 1660 || !skin(r, g, b),
        }
      : {}),
    region: box(230, s.start, 425, H - s.start),
    protected: (_x, y, r, g, b) =>
      s.key === "gold-sneakers" && r > g * 1.15 && g > b * 1.3 && r > 90,
  });
// Stockings are translucent paint on the ORIGINAL legs, not a baked skin image.
{
  const p = source("ribbon"),
    body = source("body"),
    out = new Uint8Array(N * 4),
    main = new Uint8Array(N * 4),
    fixed = new Uint8Array(N * 4);
  for (let y = 947; y < 1650; y++)
    for (let x = 250; x < 635; x++) {
      const i = (y * W + x) * 4;
      if (!p[i + 3] || !body[i + 3]) continue;
      const max = Math.max(p[i], p[i + 1], p[i + 2]),
        min = Math.min(p[i], p[i + 1], p[i + 2]);
      if (max - min < 15 && max < 65) continue;
      const a =
        y < 1000
          ? 215
          : Math.min(
              190,
              Math.max(80, 255 * (1 - p[i] / Math.max(1, body[i]))),
            );
      out.set([37, 31, 35, (a * body[i + 3]) / 255], i);
      main.set([255, 255, 255, out[i + 3]], i);
    }
  for (let y = 947; y < 950; y++)
    for (let x = 250; x < 635; x++) {
      const i = (y * W + x) * 4;
      if (out[i + 3]) {
        fixed.set([255, 255, 255, out[i + 3]], i);
        main[i + 3] = 0;
      }
    }
  for (const [suffix, bytes] of [
    ["", out],
    ["-mask", main],
    ["-protected", fixed],
  ] as const)
    writeFileSync(
      `${root}/ribbon-stockings${suffix}.png`,
      rgbaPng(W, H, bytes),
    );
  manifest["ribbon-stockings"] = {
    crop: [240, 940, 410, 720],
    mainBase: "#29262b",
    detailBase: "#333333",
    detail: false,
  };
}
// The pink pumps share the same approved geometry; their colour is a material
// variant, never a differently positioned image.
{
  const p = pngPixels(readFileSync(`${root}/pumps.png`)).pixels;
  for (let i = 0; i < p.length; i += 4)
    if (p[i + 3]) {
      const l = (p[i] + p[i + 1] + p[i + 2]) / 3;
      p[i] = l;
      p[i + 1] = l * 0.64;
      p[i + 2] = l * 0.82;
    }
  writeFileSync(`${root}/pink-pumps.png`, rgbaPng(W, H, p));
  for (const suffix of ["-mask", "-protected"])
    writeFileSync(
      `${root}/pink-pumps${suffix}.png`,
      readFileSync(`${root}/pumps${suffix}.png`),
    );
  manifest["pink-pumps"] = { ...manifest.pumps, mainBase: "#df92bb" };
}
// Closed pointed toes hide the original broad bare toes below the vamp. The
// instep remains visible above it; this is body occlusion, not image cropping.
{
  const body = source("body"),
    mask = new Uint8Array(N * 4);
  for (let y = 1715; y < H; y++)
    for (let x = 260; x < 630; x++) {
      const i = (y * W + x) * 4;
      if (body[i + 3]) mask[i + 3] = body[i + 3];
    }
  writeFileSync(`${root}/pumps-body-mask.png`, rgbaPng(W, H, mask));
}
{
  const body = source("body"),
    mask = new Uint8Array(N * 4);
  for (let y = 1650; y < H; y++)
    for (let x = 260; x < 630; x++) {
      const i = (y * W + x) * 4;
      if (body[i + 3]) mask[i + 3] = body[i + 3];
    }
  writeFileSync(`${root}/closed-shoes-body-mask.png`, rgbaPng(W, H, mask));
}
// Underwear ink is an independent covered layer: remove its residual purple
// edge pixels when a top/bottom is worn. Bare skin is never part of this mask.
for (const key of [
  "lilac",
  "burgundy",
  "pink-jacket",
  "snow-top",
  "ivory-dress",
  "ribbon-camisole",
  "rose-camisole",
  "leopard",
]) {
  const body = source("body"),
    mask = new Uint8Array(N * 4);
  for (let y = 410; y < 555; y++)
    for (let x = 310; x < 580; x++) {
      const i = (y * W + x) * 4;
      if (
        body[i] - body[i + 1] <= 12 ||
        body[i + 2] - body[i + 1] <= 10 ||
        Math.abs(body[i] - body[i + 2]) >= 30
      )
        continue;
      mask[i + 3] = 255;
    }
  writeFileSync(`${root}/${key}-body-mask.png`, rgbaPng(W, H, mask));
}
{
  const body = source("body"),
    mask = new Uint8Array(N * 4);
  for (let y = 690; y < 860; y++)
    for (let x = 260; x < 630; x++) {
      const i = (y * W + x) * 4;
      if (
        body[i] - body[i + 1] > 12 &&
        body[i + 2] - body[i + 1] > 10 &&
        Math.abs(body[i] - body[i + 2]) < 30
      )
        mask[i + 3] = 255;
    }
  writeFileSync(`${root}/bottom-underwear-mask.png`, rgbaPng(W, H, mask));
}
// Waist/hem panels are native FRONT paint reused at exactly the same coordinates.
// Only sleeves change pose; no UV deformation or scaling of textile or body.
for (const top of topDefs)
  for (const pose of ["hand-on-hip", "heart-hands"])
    for (const suffix of [
      "",
      "-mask",
      "-protected",
      ...(manifest[top.key].detail ? ["-detail-mask"] : []),
    ]) {
      const front = pngPixels(
        readFileSync(`${root}/${top.key}${suffix}.png`),
      ).pixels;
      const path = `${root}/${top.key}-${pose}${suffix}.png`,
        p = pngPixels(readFileSync(path)).pixels;
      for (let y = 610; y < top.hem + 12; y++) {
        const [left, right] = torsoBounds(y, 10);
        for (let x = Math.floor(left); x <= right; x++) {
          const i = (y * W + x) * 4;
          const t = Math.min(1, (y - 610) / 20);
          for (let c = 0; c < 4; c++)
            p[i + c] = Math.round(p[i + c] * (1 - t) + front[i + c] * t);
        }
      }
      writeFileSync(path, rgbaPng(W, H, p));
    }
// Remove lavender underwear fragments accidentally baked into the old posed
// arm overlays. The immutable base and its skin pixels are never repainted.
for (const pose of ["hand-on-hip", "heart-hands"]) {
  const p = pngPixels(
    readFileSync(`public/assets/avatar/winter-v2/body-${pose}.png`),
  ).pixels;
  for (let i = 0; i < p.length; i += 4)
    if (
      p[i + 2] - p[i + 1] > 14 &&
      p[i] - p[i + 1] > 8 &&
      Math.abs(p[i] - p[i + 2]) < 50
    )
      p[i + 3] = 0;
  writeFileSync(`${root}/body-${pose}.png`, rgbaPng(W, H, p));
}
writeFileSync(`${root}/manifest.json`, JSON.stringify(manifest, null, 2));
