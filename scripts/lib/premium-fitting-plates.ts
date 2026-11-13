import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../../apps/server/src/atelier-images";
import {
  DOLL_PATTERN,
  restingArmMask,
} from "../../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./png-rgba";

/** Composites for the premium capsule, keeping the original pose sources intact. */
export function writePremiumFittingPlates(output: string) {
  const [w, h] = DOLL_PATTERN.canvas;
  const read = (p: string) =>
    pngPixels(readFileSync("public/assets/avatar/" + p)).pixels;
  const original = read("leopard-v1/underwear-strapless.png");
  const arm = read("poses/hand-on-hip-v3/bare-arm.png");
  const continuousArm = read("poses/redraw-v4/hip-arm.png");
  const sourceHand = read("poses/redraw-v4/hip-hand.png");
  const hand = new Uint8Array(sourceHand.length);
  const wristShift = 35;
  const front = Uint8Array.from(original),
    hip = Uint8Array.from(original);
  const px = (x: number, y: number) => (y * w + x) * 4;
  const smooth = (x: number) => {
    const t = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  };
  // The clipped foreground hand comes from this continuous arm. Use the
  // same painting at the wrist, blending the two arm sources above it.
  const armSpan = (pixels: Uint8Array, y: number, shift = 0) => {
    let left = 600, right = 810;
    while (left < right && pixels[px(left - shift, y) + 3] < 128) left++;
    while (right > left && pixels[px(right - shift, y) + 3] < 128) right--;
    return [left, right] as const;
  };
  for (let y = 605; y < 755; y++) {
    const t = smooth((y - 605) / 44);
    const old = t < 1 ? armSpan(arm, y) : null;
    const next = old ? armSpan(continuousArm, y, wristShift) : null;
    const sourceRow = old ? Uint8Array.from(arm.subarray(px(0, y), px(0, y + 1))) : null;
    const interpolate = (a: number, b: number) => a + (b - a) * t;
    for (let x = 485; x < 835; x++) {
      const i = px(x, y);
      let oldX = x, newX = x;
      if (old && next) {
        const left = interpolate(old[0], next[0]);
        const right = interpolate(old[1], next[1]);
        // Match the ink edges before blending their colors to avoid a
        // double contour where the two arm paintings overlap.
        const across = (x - left) / (right - left);
        oldX = Math.round(old[0] + across * (old[1] - old[0]));
        newX = Math.round(next[0] + across * (next[1] - next[0]));
      }
      const oldPixels = sourceRow ?? arm;
      const k = sourceRow ? oldX * 4 : i;
      const j = px(newX - wristShift, y);
      const a = (1 - t) * oldPixels[k + 3], b = t * continuousArm[j + 3];
      if (a + b)
        for (let c = 0; c < 3; c++)
          arm[i + c] = Math.round((oldPixels[k + c] * a + continuousArm[j + c] * b) / (a + b));
      arm[i + 3] = Math.round(a + b);
    }
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w - wristShift; x++) {
      const j = px(x, y), i = px(x + wristShift, y);
      if (!sourceHand[j + 3]) continue;
      // Use the clip only for opacity, so its antialiased edge samples
      // exactly the same skin color as the continuous arm underneath.
      hand.set(continuousArm.subarray(j, j + 3), i);
      hand[i + 3] = sourceHand[j + 3];
    }
  const edge = (x: number) => {
    for (let y = 312; y < 400; y++) if (original[px(x, y) + 3] > 127) return y;
    throw new Error("Repère de l’épaule introuvable.");
  };
  // Use neighboring skin at the same depth below the original silhouette.
  // The alpha of the front plate is kept byte for byte.
  for (const [left, right] of [
    [328, 380],
    [506, 577],
  ]) {
    const lo = edge(left),
      hi = edge(right);
    for (let x = left + 1; x < right; x++) {
      const top = edge(x),
        t = (x - left) / (right - left);
      const lateral = smooth((x - left) / 9) * smooth((right - x) / 11);
      for (let dy = 0; dy < 21; dy++) {
        const i = px(x, top + dy),
          p = px(left, lo + dy),
          q = px(right, hi + dy);
        const blend = lateral * smooth((21 - dy) / 14);
        for (let c = 0; c < 3; c++)
          front[i + c] = Math.round(
            original[i + c] * (1 - blend) +
              (original[p + c] * (1 - t) + original[q + c] * t) * blend,
          );
      }
    }
  }
  const rest = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path d="${restingArmMask("right")}"/></svg>`,
  ).render().pixels;
  const innerEdges = Array.from({ length: 461 - 370 }, (_, row) => {
    let x = 538;
    while (x < 580 && arm[px(x, row + 370) + 3] < 225) x++;
    return x;
  });
  const armInterior = (inner: number, y: number) =>
    px(Math.max(595, inner + 18), y);
  const armColor = (x: number, y: number, c: number) => {
    const source = arm[px(x, y) + c];
    const inner = innerEdges[y - 370];
    if (inner === undefined || inner === 580 || x > inner + 9) return source;
    // The dark outline of the detached arm belongs only where it is
    // silhouetted. It disappears inside the shoulder and underarm overlap.
    const blend = (1 - smooth((x - inner - 1) / 8)) * smooth((461 - y) / 6);
    return source * (1 - blend) + arm[armInterior(inner, y) + c] * blend;
  };
  hip.set(front);
  for (let y = 326; y < 1020; y++)
    for (let x = 485; x < 835; x++) {
      const i = px(x, y);
      if (y < 416 && x >= 535 && x < 574) {
        // The arm plate's cut edge used to sit slightly above the torso here.
        const t = smooth((x - 537) / 20);
        const dy = Math.round(
          3 * smooth((574 - x) / 35) * smooth((374 - y) / 27),
        );
        const q = px(x, y - dy),
          a = front[i + 3] * (1 - t),
          b = arm[q + 3] * t;
        if (a + b)
          for (let c = 0; c < 3; c++)
            hip[i + c] = Math.round(
              (front[i + c] * a + armColor(x, y - dy, c) * b) / (a + b),
            );
        hip[i + 3] = Math.round(
          y >= 370 ? Math.max(front[i + 3], arm[q + 3]) : a + b,
        );
      } else {
        const a = front[i + 3] * (1 - rest[i + 3] / 255),
          b = arm[i + 3] * (1 - a / 255);
        if (a + b)
          for (let c = 0; c < 3; c++)
            hip[i + c] = Math.round(
              (front[i + c] * a + armColor(x, y, c) * b) / (a + b),
            );
        hip[i + 3] = Math.round(a + b);
      }
    }
  // The bent arm separates from the torso lower than the old vertical cut.
  // Extend the arm's own skin across that gap, tapering into its original edge.
  for (let y = 425; y < 461; y++) {
    const inner = innerEdges[y - 370];
    if (inner >= 580) continue;
    const opening = smooth((y - 451) / 10);
    const left = 556 + (inner - 556) * opening;
    const shoulder = px(551, Math.min(y, 424));
    const armSkin = armInterior(inner, y);
    for (let x = Math.floor(left); x < inner + 3; x++) {
      const i = px(x, y);
      const coverage = smooth((x - left + 1.5) / 2);
      if (!coverage) continue;
      const blend = coverage * (1 - hip[i + 3] / 255);
      const towardsArm = smooth((x - 556) / Math.max(2, inner - 555));
      const alpha = hip[i + 3] / 255 + blend;
      if (!alpha) continue;
      for (let c = 0; c < 3; c++) {
        const skin =
          front[shoulder + c] * (1 - towardsArm) +
          arm[armSkin + c] * towardsArm;
        hip[i + c] = Math.round(
          (hip[i + c] * (hip[i + 3] / 255) + skin * blend) / alpha,
        );
      }
      hip[i + 3] = Math.round(alpha * 255);
    }
  }
  // At the armpit the flat strapless plate still carries the two tips
  // of the old lining. Hide only the tips above the fitted underlayer.
  for (const plate of [front, hip]) {
    const paint = plate.slice();
    for (let y = 429; y < 446; y++)
      for (let x = 320; x <= 564; x++) {
        if (x > 368 && x < 517) continue;
        const i = px(x, y),
          [r, g, b, a] = paint.subarray(i, i + 4);
        if (a < 175 || r < g + 9 || b < g + 8 || b < r - 17) continue;
        const q = px(x, Math.min(431, y - 5));
        const [sr, sg, sb, sa] = paint.subarray(q, q + 4);
        if (sa < 175 || sr < sg + 20 || sg < sb + 17) continue;
        const blend = smooth((446 - y) / 5);
        for (let c = 0; c < 3; c++)
          plate[i + c] = Math.round(
            paint[i + c] * (1 - blend) + paint[q + c] * blend,
          );
      }
  }
  const elbow = px(735, 550) + 3;
  if (front[elbow] !== original[elbow] || hip[elbow] < 230 || front[elbow])
    throw new Error("Le coude fléchi doit rester propre à la pose hanche.");
  if (hip[px(545, 405) + 3] < 245 || hip[px(560, 438) + 3] < 245)
    throw new Error("Le raccord sous l’aisselle doit rester opaque.");
  for (const [x, y] of [[659, 667], [650, 680], [647, 690]])
    if (hip[px(x, y) + 3] < 245)
      throw new Error("Le raccord du poignet doit rester opaque.");
  writeFileSync(output + "/atelier-face.png", rgbaPng(w, h, front));
  writeFileSync(output + "/atelier-hanche.png", rgbaPng(w, h, hip));
  writeFileSync(output + "/atelier-main-hanche.png", rgbaPng(w, h, hand));
}
