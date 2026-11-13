import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";
const root = "docs/rail-hand-on-hip",
  out = "public/assets/avatar/poses/hand-on-hip-lilac-v1";
mkdirSync(out, { recursive: true });
const bytes = readFileSync(process.argv[2] ?? `${root}/painted-source.png`);
writeFileSync(`${root}/painted-source.png`, bytes);
const W = 887,
  H = 1774;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><defs><clipPath id="arm"><path d="M537 341 Q611 327 648 388 L744 485 Q792 520 784 560 Q777 601 715 652 L665 699 L642 716 L610 684 Q626 653 656 620 L691 558 Q654 523 584 477 Q587 446 570 426 L540 380Z"/></clipPath></defs><image width="887" height="1774" clip-path="url(#arm)" href="data:image/png;base64,${bytes.toString("base64")}"/></svg>`;
const p = new Resvg(svg).render().pixels,
  ink = new Uint8Array(W * H),
  arm = new Uint8Array(W * H * 4);
for (let n = 0; n < ink.length; n++) {
  const i = n * 4,
    [r, g, b, a] = p.subarray(i, i + 4);
  if (a > 5 && b > r * 0.65 && b > g * 1.03 && r > g * 1.03) ink[n] = 1;
}
// Keep the seam's dark ink alongside the lilac cloth, never generated skin.
for (let n = 0; n < ink.length; n++) {
  const i = n * 4;
  if (
    !ink[n] &&
    p[i + 3] > 5 &&
    p[i] < 85 &&
    p[i + 1] < 70 &&
    p[i + 2] > p[i + 1] &&
    [n - 1, n + 1, n - W, n + W].some((q) => q >= 0 && q < ink.length && ink[q])
  )
    ink[n] = 1;
  if (ink[n]) arm.set(p.subarray(i, i + 4), i);
}
writeFileSync(`${out}/arm.png`, rgbaPng(W, H, arm));
writeFileSync(`${root}/sleeve-clip.svg`, svg);
