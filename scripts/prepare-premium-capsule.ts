import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./lib/png-rgba";
import { premiumCuts } from "./lib/premium-cuts";
import { writePremiumFittingPlates } from "./lib/premium-fitting-plates";

const root = "docs/capsule-premium-v1";
const output = root + "/calques";
const [W, H] = DOLL_PATTERN.canvas,
  SW = 1536,
  SH = 1024;
const body = "public/assets/avatar/fashion-v2/body-user.png";
const hash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
if (hash(readFileSync(body)) !== DOLL_PATTERN.bodySha256)
  throw new Error("Le patron ne correspond plus à Iris.");
const trace = (d: string) =>
  new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}"><path fill-rule="evenodd" d="${d}"/></svg>`,
  ).render().pixels;
const native = (x: number, y: number) => (y * W + x) * 4;
const source = (x: number, y: number) => (y * SW + x) * 4;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const a = clamp(x);
  return a * a * (3 - 2 * a);
};
const curve = (x: number, stops: readonly (readonly [number, number])[]) => {
  const j = stops.findIndex(([n]) => n >= x);
  if (j <= 0) return stops[j === 0 ? 0 : stops.length - 1][1];
  const [a, b] = stops[j - 1],
    [c, d] = stops[j];
  return b + ((d - b) * (x - a)) / (c - a);
};
// Neck, shoulder, underbust, waist, hips and relaxed cuffs are independently
// registered against the measured body. Artwork comes from the same pose;
// the frontal sleeve is never bent to fabricate the hip sleeve.
const sourceY = [
  [255, 212],
  [290, 245],
  [345, 287],
  [465, 405],
  [550, 506],
  [604, 550],
  [650, 594],
  [699, 638],
  [738, 675],
  [814, 769],
  [860, 818],
] as const;
const toTorso = (x: number, y: number) => {
  const sy = curve(y, sourceY);
  const sleeve =
    smooth((Math.abs(x - 443) - 120) / 62) * smooth((y - 540) / 270);
  const dx = x >= 443 ? 17 * sleeve : 2 * sleeve;
  return [394 + (x - 443 - dx) / 1.09, sy] as const;
};
const restSkin = pngPixels(readFileSync(body)).pixels;
const bentSkin = pngPixels(
  readFileSync("public/assets/avatar/poses/hand-on-hip-v3/bare-arm.png"),
).pixels;
function edgeRows(
  pixels: Uint8Array,
  width: number,
  height: number,
  start: number,
  stop: number,
  reverse = false,
  contiguous = false,
) {
  return Array.from({ length: height }, (_, y) => {
    let lo = Infinity,
      hi = -1,
      started = false;
    for (
      let x = reverse ? stop : start;
      reverse ? x >= start : x <= stop;
      x += reverse ? -1 : 1
    ) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha > 143) {
        lo = Math.min(lo, x);
        hi = Math.max(hi, x);
        started = true;
      } else if (started && contiguous) break;
    }
    return hi >= lo ? ([lo, hi] as const) : undefined;
  });
}
const restEdges = [
  edgeRows(restSkin, W, H, 100, 325, false, true),
  edgeRows(restSkin, W, H, 560, 795, true, true),
] as const;
const bendEdges = edgeRows(bentSkin, W, H, 537, 790);
const fittedBendY = [
  [434, 372],
  [470, 408],
  [510, 450],
  [544, 484],
  [556, 495],
  [578, 514],
  [602, 536],
  [630, 560],
  [654, 580],
  [680, 595],
  [700, 620],
  [713, 640],
] as const;
function fitX(
  x: number,
  target: readonly [number, number],
  paint: readonly [number, number],
  ease: number,
) {
  const [lo, hi] = target,
    [left, right] = paint;
  return left + ((right - left) * (x - lo + ease)) / (hi - lo + 2 * ease);
}
function spanAt(rows: ReturnType<typeof edgeRows>, y: number) {
  const k = Math.floor(y),
    a = rows[k],
    b = rows[k + 1],
    t = y - k;
  if (!a || !b || Math.abs(a[0] - b[0]) > 12 || Math.abs(a[1] - b[1]) > 12)
    return rows[Math.round(y)];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as const;
}
const toHip = (
  x: number,
  y: number,
  sourceEdges: ReturnType<typeof edgeRows>,
) => {
  const sleeve = smooth((x - 553) / 105);
  const lower = smooth((y - 514) / 145);
  // The paint's elbow and cuff are measured independently from the torso.
  const dx = (10 * sleeve - 13 * lower) * smooth((x - 540) / 44);
  const dy = (14 * sleeve - 20 * lower) * smooth((x - 540) / 45);
  const [sx, sy] = toTorso(x, y);
  const blend = smooth((x - 567) / 46) * smooth((y - 443) / 45);
  const hy = (sy + dy) * (1 - blend) + curve(y, fittedBendY) * blend;
  const a = bendEdges[y],
    b = spanAt(sourceEdges, hy);
  if (y >= 502 && x > 590 && (!a || x < a[0] - 3 || x > a[1] + 3))
    return [0, 0] as const;
  if (!a || !b || !blend) return [sx + dx, hy] as const;
  return [(sx + dx) * (1 - blend) + fitX(x, a, b, 3) * blend, hy] as const;
};
const laces = trace(
  "M305 516L329 522L306 537L329 545L307 558L327 569L305 580L321 593L299 604L298 595L312 588L299 579L317 564L301 556L318 540L300 531Z M480 516L456 522L479 537L456 545L478 558L458 569L480 580L464 593L486 604L487 595L473 588L486 579L468 564L484 556L467 540L485 531Z",
);
const isHardware = (id: string, r: number, g: number, b: number, i: number) => {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  switch (id) {
    case "01-velvet":
      return g > b + 7 && r > b + 14;
    case "02-venus":
      return spread < 26 || (g > 150 && r - g < 32);
    case "04-minuit":
      return spread < 19 && (r > 65 || !!laces[i + 3]);
    case "06-nova":
      return spread < 31;
    case "08-seraphine":
      return r > 62 && (g > 41 || (r - g > 34 && r > 111));
    default:
      return true;
  }
};
const poses = ["front", "hand-on-hip"] as const;
const seraphineInset = [
  [376, 0],
  [410, 3],
  [427, 6],
  [440, 9],
  [450, 9],
  [464, 6],
  [480, 5],
  [496, 4],
  [512, 2],
  [530, 0],
] as const;
// Only remove RGB that can actually be explained by a mixture of cloth
// and the sampled studio backdrop. Keep the original linework, including
// the hem's dark rim and stitches, when there is no such evidence.
function recoverContour(
  art: Uint8Array,
  keep: Uint8Array,
  matte: Uint8Array,
  iridescent: boolean,
) {
  const depth = new Uint8Array(W * H);
  for (let y = 245; y < 870; y++)
    for (let x = 100; x < 805; x++) {
      const i = y * W + x;
      if (art[i * 4 + 3] >= 250)
        depth[i] = Math.min(4, 1 + Math.min(depth[i - 1], depth[i - W]));
    }
  for (let y = 869; y >= 245; y--)
    for (let x = 804; x >= 100; x--) {
      const i = y * W + x;
      if (depth[i])
        depth[i] = Math.min(depth[i], 1 + Math.min(depth[i + 1], depth[i + W]));
    }
  const paint = art.slice();
  for (let y = 245; y < 870; y++)
    for (let x = 100; x < 805; x++) {
      const i = y * W + x,
        p = i * 4;
      const alpha = paint[p + 3];
      if (!alpha || depth[i] > 3 || keep[p + 3]) continue;
      if (
        iridescent &&
        paint[p + 2] - paint[p] > 20 &&
        paint[p + 2] - paint[p + 1] > 10
      )
        continue;
      let best = Infinity,
        background = 0,
        donor = -1,
        nearest = -1,
        nearestDistance = Infinity;
      for (let dy = -5; dy <= 5; dy++)
        for (let dx = -5; dx <= 5; dx++) {
          const d = dx * dx + dy * dy,
            j = i + dy * W + dx;
          const q = j * 4;
          if (d > 27 || depth[j] < 3 || keep[q + 3]) continue;
          if (d < nearestDistance) {
            nearest = q;
            nearestDistance = d;
          }
          const br = matte[0] - paint[q],
            bg = matte[1] - paint[q + 1],
            bb = matte[2] - paint[q + 2];
          const r = paint[p] - paint[q],
            g = paint[p + 1] - paint[q + 1],
            b = paint[p + 2] - paint[q + 2];
          const norm = br * br + bg * bg + bb * bb;
          if (norm < 2700) continue;
          const t = (r * br + g * bg + b * bb) / norm;
          if (t < (depth[i] ? 0.51 : 0.18) || t > 1.14) continue;
          const er = r - br * t,
            eg = g - bg * t,
            eb = b - bb * t,
            residual = er * er + eg * eg + eb * eb;
          if (residual > 100 || residual + d * 5 >= best) continue;
          best = residual + d * 5;
          background = Math.min(0.78, t);
          donor = q;
        }
      if (!background) {
        if (nearest < 0) continue;
        // Some studio pixels are clipped to a brighter gray, or mixed
        // with the painted skin at a collar. Treat only strong outliers;
        // an ordinary pale stitch or shaded edge must survive.
        const luma = (q: number) =>
          0.2126 * paint[q] + 0.7152 * paint[q + 1] + 0.0722 * paint[q + 2];
        const lift = luma(p) - luma(nearest);
        const spread =
          Math.max(paint[p], paint[p + 1], paint[p + 2]) -
          Math.min(paint[p], paint[p + 1], paint[p + 2]);
        const studio = spread < 47 && paint[p + 2] >= paint[p + 1] - 7;
        const skin =
          paint[p] - paint[p + 1] > 37 &&
          paint[p + 1] - paint[p + 2] > 26 &&
          paint[nearest + 1] - paint[nearest + 2] < 17;
        const strength = studio
          ? smooth((lift - 19) / 42)
          : skin
            ? smooth((lift - 34) / 41)
            : 0;
        if (!strength) continue;
        for (let c = 0; c < 3; c++)
          art[p + c] = Math.round(
            paint[p + c] * (1 - strength) + paint[nearest + c] * strength,
          );
        continue;
      }
      // Solve the RGB blend without eroding the original silhouette.
      const t = background * 0.88;
      for (let c = 0; c < 3; c++) {
        const solved = (paint[p + c] - t * matte[c]) / (1 - t);
        const edge = Math.min(
          paint[donor + c] + 15,
          Math.max(paint[donor + c] - 15, solved),
        );
        art[p + c] = Math.round(255 * clamp(edge / 255));
      }
    }
}
const index = premiumCuts.map((c) => {
  const bytes = readFileSync(
    `${root}/visuels/${"source" in c ? c.source : c.id + ".png"}`,
  );
  const { pixels, width, height } = pngPixels(bytes);
  if (width !== SW || height !== SH)
    throw new Error(c.id + " : dimensions source inattendues");
  const matte = pixels.subarray(source(65, 460), source(65, 460) + 3);
  const front = trace(c.front);
  const hip = "hip" in c ? trace(c.hip) : undefined;
  const bendGuide =
    hip &&
    edgeRows(
      c.id === "05-rosalie" ? hip : trace(premiumCuts[0].hip),
      SW,
      SH,
      510,
      725,
    );
  const long = c.id === "01-velvet" || c.id === "05-rosalie";
  const minuit = c.id === "04-minuit";
  const longEdges = [
    edgeRows(front, SW, SH, 100, minuit ? 278 : 261, false, true),
    edgeRows(front, SW, SH, minuit ? 500 : 510, 670, true, true),
  ] as const;
  const toFront = (x: number, y: number, pose: (typeof poses)[number]) => {
    let [sx, sy] = toTorso(x, y);
    // Match the painted lateral seam to the fitted bust without touching
    // the neckline, the waist, or the panel's interior texture.
    const d = Math.abs(x - 443);
    const atBust = smooth((y - 425) / 29) * smooth((556 - y) / 55);
    const atSeam = smooth((d - 47) / 57) * smooth((157 - d) / 34);
    const width =
      x < 443 ? (long ? 10 : minuit ? 7 : 4) : c.id === "10-alba" ? 5 : 13;
    sx -= Math.sign(x - 443) * width * atBust * atSeam;
    if (c.id === "08-seraphine") {
      // Tuck the outer drape into the armhole without altering the collar,
      // the central folds, or the original beading.
      const side = smooth((x - 485) / 67);
      sx += side * curve(y, seraphineInset);
    }
    if (c.id === "02-venus" || c.id === "03-eclat") {
      const corner =
        smooth((d - 53) / 38) *
        smooth((150 - d) / 35) *
        smooth((y - 410) / 20) *
        smooth((466 - y) / 25);
      sx -= Math.sign(x - 443) * 5 * corner;
      sy += 4 * corner;
    }
    if (minuit) {
      const shoulder =
        smooth((Math.abs(x - 443) - 72) / 71) * smooth((436 - y) / 83);
      sy += 4 * shoulder;
      const sidePanel = smooth((d - 49) / 50) * smooth((171 - d) / 40);
      // The left waist was too wide and the right flare stopped short of
      // the trousers. Match each edge separately, keeping the centre hem.
      const waist =
        x < 443
          ? 10 * smooth((y - 568) / 43) * smooth((695 - y) / 50)
          : 10 * smooth((y - 628) / 39) * smooth((738 - y) / 23);
      sx -= sidePanel * waist;
      if (x > 443)
        sy -= 5 * sidePanel * smooth((y - 657) / 43) * smooth((745 - y) / 25);
    }
    if (c.id === "06-nova") {
      // The bridge has its own small fit adjustment; the neck and the
      // opening remain in the original artwork and recolor masks.
      const anchor =
        smooth((x - 477) / 30) *
        smooth((584 - x) / 26) *
        smooth((y - 323) / 18) *
        smooth((427 - y) / 67);
      sx += (pose === "front" ? 3.5 : 5) * anchor;
      sy -= (pose === "front" ? 6 : 7) * anchor;
    }
    const side = x < 443 ? 0 : 1;
    const a = restEdges[side][y],
      b = spanAt(longEdges[side], sy);
    if (
      (!long && !minuit) ||
      (c.id === "01-velvet" && !side) ||
      !a ||
      !b ||
      x < a[0] - 20 ||
      x > a[1] + 20
    )
      return [sx, sy] as const;
    if (y >= 780 && (x < a[0] - 3 || x > a[1] + 3)) return [sx, sy] as const;
    const inner = side ? x - a[0] : a[1] - x;
    const blend =
      (minuit
        ? smooth((y - 426) / 70) * smooth((535 - sy) / 20)
        : smooth((y - 448) / 100)) * smooth((inner + 15) / 25);
    return [sx * (1 - blend) + fitX(x, a, b, 1.7) * blend, sy] as const;
  };
  const erase =
    "join" in c
      ? trace(`${c.join} L499 470L506 502L508 565L518 659L568 808H765V230H530Z`)
      : undefined;
  const ornament = "protect" in c ? trace(c.protect) : undefined;
  const dir = `${output}/${c.id}`;
  mkdirSync(dir, { recursive: true });
  const shade = (mask: Uint8Array, x: number, y: number, delta: number) => {
    const x0 = Math.floor(x),
      y0 = Math.floor(y),
      fx = x - x0,
      fy = y - y0;
    let a = 0,
      r = 0,
      g = 0,
      b = 0;
    for (let yy = 0; yy < 2; yy++)
      for (let xx = 0; xx < 2; xx++) {
        const j = source(x0 + xx, y0 + yy),
          p = j + delta * 4;
        const w = ((xx ? fx : 1 - fx) * (yy ? fy : 1 - fy) * mask[j + 3]) / 255;
        if (!w) continue;
        const rr = pixels[p],
          gg = pixels[p + 1],
          bb = pixels[p + 2];
        // Remove studio matte and exposed skin along the cutout; the source
        // painting's red fabric and the original metal remain in the sprite.
        const q = source(delta ? 775 : 65, y0 + yy);
        const distance =
          Math.abs(rr - pixels[q]) +
          Math.abs(gg - pixels[q + 1]) +
          Math.abs(bb - pixels[q + 2]);
        const matteColor =
          distance < 17 ||
          (rr > 187 && gg >= rr && bb > rr + 6 && distance < 34);
        // The blue iridescence can match the studio's RGB inside Nova.
        // Only clean the backdrop next to an actual cutout edge.
        const studio =
          matteColor &&
          (c.id !== "06-nova" ||
            [0, -5, 5, -SW * 5, SW * 5].some(
              (offset) => mask[j + offset * 4 + 3] < 250,
            ));
        const skin =
          rr > 142 &&
          rr - gg > 31 &&
          gg - bb > 28 &&
          rr - gg < (gg - bb) * 1.7 &&
          c.id !== "07-ambre";
        const skinAtCuff =
          long &&
          y0 > 575 &&
          (x0 < 240 || x0 > 519) &&
          rr > 126 &&
          rr - gg > 25 &&
          gg - bb > 18;
        if (studio || skin || skinAtCuff) continue;
        a += w;
        r += rr * w;
        g += gg * w;
        b += bb * w;
      }
    return a ? ([r / a, g / a, b / a, a] as const) : ([0, 0, 0, 0] as const);
  };
  for (const pose of poses) {
    const art = new Uint8Array(W * H * 4),
      dye = new Uint8Array(art.length),
      keep = new Uint8Array(art.length);
    let dyed = 0,
      protectedCount = 0;
    for (let y = 245; y < 870; y++)
      for (let x = 100; x < 805; x++) {
        const p = native(x, y),
          [sx, sy] = toFront(x, y, pose);
        const q = source(Math.round(sx), Math.round(sy));
        const [fr, fg, fb, fa] = shade(front, sx, sy, 0);
        const sleeve = pose === "hand-on-hip" && hip;
        const [hx, hy] = sleeve && bendGuide ? toHip(x, y, bendGuide) : [0, 0];
        const bendShoulder = minuit
          ? 4 * smooth((x - 566) / 58) * smooth((442 - y) / 92)
          : 0;
        const rim = bendEdges[y]?.[1];
        const bendWidth =
          minuit && rim
            ? 6 *
              smooth((y - 445) / 29) *
              smooth((530 - y) / 21) *
              smooth((x - rim + 39) / 35)
            : 0;
        const [hr, hg, hb, ha] = sleeve
          ? shade(sleeve, hx - bendWidth, hy + bendShoulder, 745)
          : [0, 0, 0, 0];
        const a =
          fa *
          (1 -
            (sleeve ? (erase?.[q + 3 - (y < 473 ? 7 : 0) * 4] ?? 0) / 255 : 0));
        if (!a && !ha) continue;
        const useHip = ha * (1 - a) + ha * a * smooth((x - 553) / 23),
          f = a * (1 - useHip),
          coverage = f + useHip;
        if (coverage < 0.5 / 255) continue;
        const r = Math.round((fr * f + hr * useHip) / coverage),
          g = Math.round((fg * f + hg * useHip) / coverage),
          b = Math.round((fb * f + hb * useHip) / coverage);
        art.set([r, g, b, Math.round(coverage * 255)], p);
        if (
          ornament &&
          ornament[q + 3] > 127 &&
          useHip < 0.5 &&
          isHardware(c.id, r, g, b, q)
        ) {
          keep.set([255, 255, 255, 255], p);
          protectedCount++;
        } else {
          dye.set([255, 255, 255, 255], p);
          dyed++;
        }
      }
    recoverContour(art, keep, matte, c.id === "06-nova");
    if (long && pose === "hand-on-hip") {
      // Keep the painted cuff and close any narrow slit over the fixed
      // wrist. Sample the closest interior fabric only within the arm plate.
      // The hand stays separate and covers the inside of the cuff.
      const sampled = art.slice();
      for (let y = 645; y <= 713; y++) {
        const edge = bendEdges[y];
        if (!edge) continue;
        for (let x = edge[0]; x <= edge[1]; x++) {
          const p = native(x, y);
          if (art[p + 3] > 230 || bentSkin[p + 3] < 123) continue;
          let nearest = -1,
            best = 49;
          for (let dy = -5; dy <= 5; dy++)
            for (let dx = -7; dx <= 7; dx++) {
              const q = native(x + dx, y + dy),
                distance = dx * dx + dy * dy;
              if (distance >= best || sampled[q + 3] < 240) continue;
              nearest = q;
              best = distance;
            }
          if (nearest >= 0) {
            art.set(
              [
                sampled[nearest],
                sampled[nearest + 1],
                sampled[nearest + 2],
                bentSkin[p + 3],
              ],
              p,
            );
            dye.set([255, 255, 255, 255], p);
          }
        }
      }
    }
    if (dyed < 14000 || ("protect" in c && protectedCount < 30))
      throw new Error(c.id + " : masque incomplet");
    if (c.id === "05-rosalie") {
      let petals = 0;
      for (let x = 520; x < 570; x++) if (keep[native(x, 390) + 3]) petals++;
      if (petals < 20)
        throw new Error("Rosalie : le haut de la rose est rogné");
    }
    if (c.id === "06-nova") {
      if (art[native(279, 420) + 3] < 245 || art[native(280, 421) + 3] < 245)
        throw new Error("Nova : l’ourlet de manche doit rester opaque");
      for (let y = 457; y <= 530; y++)
        for (let x = 390; x <= 470; x++)
          if (art[native(x, y) + 3] !== 255)
            throw new Error(
              "Nova : le reflet irisé ne doit pas trouer le buste " +
                x +
                "," +
                y +
                " alpha=" +
                art[native(x, y) + 3],
            );
    }
    for (const [suffix, data] of [
      ["", art],
      ["-tissu", dye],
      ["-protections", keep],
    ] as const)
      writeFileSync(`${dir}/${pose}${suffix}.png`, rgbaPng(W, H, data));
  }
  const [shadow, middle, highlight, depth, sheen] = c.tone;
  return {
    id: c.id,
    sourceSha256: hash(bytes),
    mainBase: c.base,
    mainTone: { shadow, middle, highlight, depth, sheen },
    poses: Object.fromEntries(
      poses.map((p) => [
        p,
        {
          art: `${c.id}/${p}.png`,
          main: `${c.id}/${p}-tissu.png`,
          protected: `${c.id}/${p}-protections.png`,
        },
      ]),
    ),
    status: "atelier",
  };
});
writePremiumFittingPlates(output);
writeFileSync(
  output + "/index.json",
  JSON.stringify(
    {
      pattern: DOLL_PATTERN.id,
      bodySha256: DOLL_PATTERN.bodySha256,
      canvas: DOLL_PATTERN.canvas,
      pieces: index,
    },
    null,
    2,
  ) + "\n",
);
