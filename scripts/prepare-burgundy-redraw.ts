import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";

// Extract painted cloth from the on-body drawing. No row stretching or body edits.
const W = 887,
  H = 1774;
const offShoulder = process.argv.includes("--off-shoulder");
const version = offShoulder ? "v4" : "v3";
const root = `docs/burgundy-outfit-${version}`;
const out = `public/assets/avatar/burgundy-${version}`;
mkdirSync(root, { recursive: true });
mkdirSync(out, { recursive: true });
const source = readFileSync(process.argv[2] ?? `${root}/painted-source.png`);
writeFileSync(`${root}/painted-source.png`, source);
const normalized = new Resvg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><image width="${W}" height="${H}" preserveAspectRatio="none" href="data:image/png;base64,${source.toString("base64")}"/></svg>`,
)
  .render()
  .asPng();
const p = pngPixels(Buffer.from(normalized)).pixels;
const cloth = new Uint8Array(W * H);
for (let y = 325; y < 865; y++)
  for (let x = 100; x < 790; x++) {
    const i = (y * W + x) * 4;
    const [r, g, b, a] = p.subarray(i, i + 4);
    // Burgundy pigment, excluding orange skin and lavender underwear.
    if (
      a > 8 &&
      r > g * 1.25 &&
      b > g * 0.85 &&
      r > b * 1.1 &&
      r < b * 4 &&
      r < 205
    )
      cloth[y * W + x] = 1;
  }
// Retain ink outlines only where adjacent to cloth; never import body pixels.
for (let step = 0; step < 3; step++) {
  const next = cloth.slice();
  for (let y = 326; y < 864; y++)
    for (let x = 101; x < 789; x++) {
      const n = y * W + x,
        i = n * 4;
      if (
        !cloth[n] &&
        p[i + 3] > 8 &&
        Math.max(p[i], p[i + 1], p[i + 2]) < 70 &&
        (cloth[n - 1] || cloth[n + 1] || cloth[n - W] || cloth[n + W])
      )
        next[n] = 1;
    }
  cloth.set(next);
}
// Discard disconnected illustration ink (e.g. the briefs below the hem).
for (let y = 764; y < 865; y++)
  for (let x = 250; x < 635; x++) cloth[y * W + x] = 0;
const seen = new Uint8Array(W * H);
let largest: number[] = [];
for (let start = 0; start < cloth.length; start++) {
  if (!cloth[start] || seen[start]) continue;
  const component = [start];
  seen[start] = 1;
  for (let k = 0; k < component.length; k++) {
    const n = component[k];
    for (const q of [n - 1, n + 1, n - W, n + W])
      if (q >= 0 && q < cloth.length && cloth[q] && !seen[q]) {
        seen[q] = 1;
        component.push(q);
      }
  }
  if (component.length > largest.length) largest = component;
}
cloth.fill(0);
for (const n of largest) cloth[n] = 1;
let front = new Uint8Array(W * H * 4);
const mask = new Uint8Array(W * H * 4);
let bounds = [W, H, 0, 0];
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const n = y * W + x,
      i = n * 4;
    if (!cloth[n]) continue;
    front.set(p.subarray(i, i + 4), i);
    mask.set([255, 255, 255, p[i + 3]], i);
    bounds = [
      Math.min(bounds[0], x),
      Math.min(bounds[1], y),
      Math.max(bounds[2], x),
      Math.max(bounds[3], y),
    ];
  }
// Repaint the folded collar on the canonical shoulder/bra-strap landmarks.
// Only this cloth panel changes; sleeves, torso and body are not remapped.
const collar =
  "M249 449 C255 409 263 373 285 354 Q311 345 350 341 Q443 359 535 341 Q576 344 602 359 C624 389 634 426 637 449 Q443 455 249 449Z";
const clothPng = rgbaPng(W, H, front);
const collarSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><defs><clipPath id="c"><path d="${collar}"/></clipPath><linearGradient id="wine"><stop stop-color="#581d2c"/><stop offset=".4" stop-color="#7b2b40"/><stop offset="1" stop-color="#4d1826"/></linearGradient></defs><image width="887" height="1774" href="data:image/png;base64,${clothPng.toString("base64")}"/><path d="${collar}" fill="url(#wine)"/><g clip-path="url(#c)"><image width="887" height="1774" transform="translate(0 -135) scale(1 1.3)" href="data:image/png;base64,${clothPng.toString("base64")}"/></g><path d="M285 354 Q311 345 350 341 Q443 359 535 341 Q576 344 602 359 M249 449 Q443 455 637 449" fill="none" stroke="#34131e" stroke-width="2.2" stroke-linecap="round"/></svg>`;
if (!offShoulder)
  front = pngPixels(Buffer.from(new Resvg(collarSvg).render().asPng())).pixels;
for (let i = 0; i < front.length; i += 4) {
  mask.set([255, 255, 255, front[i + 3]], i);
}
writeFileSync(`${root}/collar.svg`, collarSvg);
writeFileSync(`${out}/sweater.png`, rgbaPng(W, H, front));
writeFileSync(`${out}/sweater-mask1.png`, rgbaPng(W, H, mask));
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
const bodyHash = createHash("sha256").update(body).digest("hex");
if (
  bodyHash !==
  "8e3b61c5a45e5ddc9ee528530ced84eea3bd883a1a2e05914b81fd46e3b269e4"
)
  throw new Error("Canonical body changed");
writeFileSync(
  `${root}/registration.json`,
  JSON.stringify(
    {
      canvas: [W, H],
      bounds,
      bodyHash,
      transform: "identity",
      method: "on-body redraw; pigment isolation; no body pixels",
    },
    null,
    2,
  ),
);
// QA composite uses the actual immutable body, never the generated character.
const render = new Resvg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><rect width="887" height="1774" fill="#f3e0db"/><image width="887" height="1774" href="data:image/png;base64,${body.toString("base64")}"/><image width="887" height="1774" href="data:image/png;base64,${rgbaPng(W, H, front).toString("base64")}"/></svg>`,
)
  .render()
  .asPng();
writeFileSync(`${root}/on-canonical-body.png`, render);
console.log({ bounds, bodyHash });
