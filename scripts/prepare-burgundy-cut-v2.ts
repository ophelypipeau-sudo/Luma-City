/** Hand-traced SVG masks. Clothing RGB is copied unchanged at native pixels.
 * No skin/colour key, erosion or component pruning. Cuffs are locally fitted
 * to the approved wrists; the body, torso, face and hands are never warped. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { nativeRgba } from "./lib/png-native";
import { rgbaPng } from "./lib/png-rgba";
import { restingArmMask } from "../packages/domain/src/avatar-pattern";
const root = "public/assets/avatar/burgundy-cut-v2";
mkdirSync(root, { recursive: true });
const contours = JSON.parse(readFileSync(`${root}/contours.json`, "utf8"));
const W = 887,
  H = 1774,
  N = W * H;
function mask(c: { outline: string; hands: string; window?: string }) {
  const paths = (d: string, fill: string) =>
    d
      .split(/(?=M)/)
      .filter(Boolean)
      .map((p) => `<path d="${p}" fill="${fill}"/>`)
      .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774">${paths(c.outline, "white")}${c.hands ? paths(c.hands, "black") : ""}${c.window ? paths(c.window, "white") : ""}</svg>`;
  const raw = pngPixels(new Resvg(svg).render().asPng()).pixels;
  const p = new Uint8Array(N * 4);
  for (let i = 0; i < p.length; i += 4)
    p.set([255, 255, 255, Math.round((raw[i] * raw[i + 3]) / 255)], i);
  return { svg, p };
}
const records: Record<string, unknown> = {};
let frontal: Uint8Array | undefined;
let frontalTorso: Uint8Array | undefined;
/** Smooth sleeve-only registration, fixed at the elbow. Bilinear sampling of
 * the original knit preserves its shading; no flat colour repair is painted. */
function fitCuff(p: Uint8Array, pose: string) {
  const handles =
    pose === "hand-on-hip"
      ? [{ elbow: [706, 574], wrist: [617, 684], delta: [-3, -9], twist: true }]
      : [
          { elbow: [235, 592], wrist: [346, 480], delta: [-21, -19] },
          { elbow: [652, 592], wrist: [541, 480], delta: [21, -19] },
        ];
  const displacement = (x: number, y: number) => {
    let dx = 0,
      dy = 0;
    for (const h of handles) {
      const [ex, ey] = h.elbow,
        [wx, wy] = h.wrist,
        vx = wx - ex,
        vy = wy - ey;
      // Limit influence to the forearm's own side of the body.
      if (pose === "heart-hands" && (wx < 443 ? x > 410 : x < 477)) continue;
      const s = Math.max(
        0,
        Math.min(1, ((x - ex) * vx + (y - ey) * vy) / (vx * vx + vy * vy)),
      );
      const distance =
        Math.abs((x - ex) * vy - (y - ey) * vx) / Math.hypot(vx, vy);
      const edge = Math.max(0, Math.min(1, (60 - distance) / 28));
      const weight = s * s * (3 - 2 * s) * edge * edge * (3 - 2 * edge);
      if (h.twist) {
        const t = Math.max(
          0,
          Math.min(1, ((x - 603) * 28 + (y - 666) * 35) / (28 * 28 + 35 * 35)),
        );
        dx += (-7 + 9 * t) * weight;
        dy += (-1 - 16 * t) * weight;
      } else {
        dx += h.delta[0] * weight;
        dy += h.delta[1] * weight;
      }
    }
    return [dx, dy];
  };
  const result = new Uint8Array(p.length);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let sx = x,
        sy = y;
      for (let n = 0; n < 5; n++) {
        const [dx, dy] = displacement(sx, sy);
        sx = x - dx;
        sy = y - dy;
      }
      const ix = Math.floor(sx),
        iy = Math.floor(sy),
        fx = sx - ix,
        fy = sy - iy;
      const sum = [0, 0, 0, 0];
      for (const [ox, oy, w] of [
        [0, 0, (1 - fx) * (1 - fy)],
        [1, 0, fx * (1 - fy)],
        [0, 1, (1 - fx) * fy],
        [1, 1, fx * fy],
      ]) {
        const ax = ix + ox,
          ay = iy + oy;
        if (ax < 0 || ax >= W || ay < 0 || ay >= H) continue;
        const k = (ay * W + ax) * 4,
          a = (p[k + 3] / 255) * w;
        for (let c = 0; c < 3; c++) sum[c] += p[k + c] * a;
        sum[3] += a;
      }
      const i = (y * W + x) * 4;
      if (sum[3])
        for (let c = 0; c < 3; c++) result[i + c] = Math.round(sum[c] / sum[3]);
      result[i + 3] = Math.round(sum[3] * 255);
    }
  return result;
}
for (const pose of ["front", "hand-on-hip", "heart-hands"]) {
  const c = contours[pose],
    source = nativeRgba(readFileSync("public" + c.source)).pixels,
    { svg, p: clip } = mask(c),
    p = new Uint8Array(N * 4),
    main = new Uint8Array(N * 4),
    protectedInk = new Uint8Array(N * 4);
  for (let i = 0; i < p.length; i += 4) {
    if (!clip[i + 3]) continue;
    p.set(source.subarray(i, i + 4), i);
    p[i + 3] = Math.round((source[i + 3] * clip[i + 3]) / 255);
  }
  // Reuse unchanged frontal cloth underneath the hands. This restores a complete
  // torso behind the independent hand layer, rather than leaving finger-shaped
  // holes or retaining skin in the garment. No new colour/texture is painted.
  if (c.hands && frontal) {
    const hand = mask({ outline: c.hands, hands: c.window ?? "" }).p;
    for (let i = 0; i < p.length; i += 4)
      if (hand[i + 3] && frontal[i + 3]) {
        const a = hand[i + 3] / 255;
        for (let k = 0; k < 4; k++)
          p[i + k] = Math.round(p[i + k] * (1 - a) + frontal[i + k] * a);
      }
  }
  if (pose === "front") frontal = new Uint8Array(p);
  // Stable frontal torso and independently traced sleeves share this mannequin's
  // anchors. The torso/collar/hem never shift when the arms change pose.
  if (pose === "front") {
    const torso = mask({ outline: contours.torso, hands: "" }).p;
    frontalTorso = new Uint8Array(N * 4);
    for (let i = 0; i < p.length; i += 4) {
      frontalTorso.set(p.subarray(i, i + 4), i);
      frontalTorso[i + 3] = Math.round((p[i + 3] * torso[i + 3]) / 255);
    }
  } else {
    const armMask = mask({ outline: c.sleeves, hands: "" }).p;
    const next = new Uint8Array(N * 4);
    if (pose === "hand-on-hip") {
      const left = mask({ outline: contours.front.leftSleeve, hands: "" }).p;
      for (let i = 0; i < p.length; i += 4)
        if (left[i + 3] && frontal![i + 3]) {
          next.set(frontal!.subarray(i, i + 4), i);
          next[i + 3] = Math.round((frontal![i + 3] * left[i + 3]) / 255);
        }
    }
    const sleeve = new Uint8Array(p);
    for (let i = 0; i < sleeve.length; i += 4)
      sleeve[i + 3] = Math.round((sleeve[i + 3] * armMask[i + 3]) / 255);
    const fitted = fitCuff(sleeve, pose);
    for (let i = 0; i < p.length; i += 4) {
      const a = fitted[i + 3] / 255;
      if (!a) continue;
      const back = (next[i + 3] / 255) * (1 - a),
        sum = a + back;
      for (let k = 0; k < 3; k++)
        next[i + k] = Math.round(
          (fitted[i + k] * a + next[i + k] * back) / sum,
        );
      next[i + 3] = Math.round(sum * 255);
    }
    // Torso and folded collar are in front of the sleeve caps, never bisected
    // by the diagonal edge of a different pose's collar texture.
    for (let i = 0; i < p.length; i += 4) {
      const a = frontalTorso![i + 3] / 255,
        b = (next[i + 3] / 255) * (1 - a),
        sum = a + b;
      if (!sum) continue;
      for (let k = 0; k < 3; k++)
        next[i + k] = Math.round(
          (frontalTorso![i + k] * a + next[i + k] * b) / sum,
        );
      next[i + 3] = Math.round(sum * 255);
    }
    p.set(next);
  }
  // Protect the outside ink edge for dye, independently of extraction. Dark ribs
  // inside the garment remain in the source and retain their tonal shading.
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4;
      if (!p[i + 3]) continue;
      const edge = [i - 4, i + 4, i - W * 4, i + W * 4].some((k) => !p[k + 3]);
      const fixed = edge || Math.max(p[i], p[i + 1], p[i + 2]) < 32;
      const target = fixed ? protectedInk : main;
      target.set([255, 255, 255, p[i + 3]], i);
    }
  writeFileSync(`${root}/${pose}.png`, rgbaPng(W, H, p));
  writeFileSync(`${root}/${pose}-mask.png`, rgbaPng(W, H, main));
  writeFileSync(`${root}/${pose}-protected.png`, rgbaPng(W, H, protectedInk));
  writeFileSync(`${root}/${pose}-contour.svg`, svg);
  writeFileSync(`${root}/${pose}-alpha.png`, rgbaPng(W, H, clip));
  records[pose] = {
    source: c.source,
    sourceSha256: createHash("sha256")
      .update(readFileSync("public" + c.source))
      .digest("hex"),
  };
}
// The source body's clothed arm segments are hidden, while the exposed
// shoulders and the original hands are retained. This prevents bare-arm strips
// from leaking past a sleeve; it does not alter the mannequin image.
{
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><defs><clipPath id="covered"><path d="M0 426H887V800L741 820 697 837 623 820 250 820 185 835 142 822H0Z"/></clipPath></defs><g clip-path="url(#covered)"><path d="${restingArmMask("left")}"/><path d="${restingArmMask("right")}"/></g><clipPath id="torso-only"><rect x="300" y="400" width="285" height="365"/></clipPath><g clip-path="url(#torso-only)"><image href="data:image/png;base64,${readFileSync("public/assets/avatar/redrawn-v1/burgundy-body-mask.png").toString("base64")}" width="887" height="1774"/></g></svg>`;
  writeFileSync(`${root}/body-mask.png`, new Resvg(svg).render().asPng());
}
writeFileSync(`${root}/sources.json`, JSON.stringify(records, null, 2));
// The approved palm/finger drawing also contains two obsolete forearm wedges.
// Remove only those wedges along their drawn wrist edges, not by skin colour.
{
  const source = nativeRgba(
    readFileSync("public/assets/avatar/poses/redraw-v4/heart-hands.png"),
  ).pixels;
  const clip = mask({
    outline: "M320 450L362 398V340H524V398L567 450 553 480H334Z",
    hands: "",
  }).p;
  for (let i = 0; i < source.length; i += 4)
    source[i + 3] = Math.round((source[i + 3] * clip[i + 3]) / 255);
  writeFileSync(`${root}/heart-hands-clean.png`, rgbaPng(W, H, source));
}
