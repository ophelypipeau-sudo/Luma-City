import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { rgbaPng } from "./lib/png-rgba";
const root = "docs/rail-hand-on-hip",
  out = "public/assets/avatar/poses/hand-on-hip-lilac-v2";
mkdirSync(out, { recursive: true });
const source = readFileSync(`${root}/painted-source.png`);
// Same hand and wrist position as the preview selected by the user. No rotation
// of the relaxed frontal hand, and no generated torso/face/jeans in this asset.
const region =
  "M616 678 Q593 682 566 678 L537 688 L526 700 L511 730 L532 734 L547 713 L535 738 L522 761 L548 774 L561 763 L573 777 L589 747 L600 740 L641 728 L649 709Z";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><defs><clipPath id="hand"><path d="${region}"/></clipPath></defs><image width="887" height="1774" clip-path="url(#hand)" href="data:image/png;base64,${source.toString("base64")}"/></svg>`;
const p = new Resvg(svg).render().pixels,
  hand = new Uint8Array(p.length);
for (let i = 0; i < p.length; i += 4) {
  const [r, g, b, a] = p.subarray(i, i + 4);
  if (a > 5 && r > g * 1.28 && g > b * 1.2 && r > b * 1.6)
    hand.set(p.subarray(i, i + 4), i);
}
// Preserve pale nails and enclosed crease highlights instead of turning them
// into transparent holes during skin/denim separation.
const seen = new Uint8Array(887 * 1774),
  queue: number[] = [665 * 887 + 500];
seen[queue[0]] = 1;
for (let k = 0; k < queue.length; k++)
  for (const n of [
    queue[k] - 1,
    queue[k] + 1,
    queue[k] - 887,
    queue[k] + 887,
  ]) {
    const x = n % 887,
      y = Math.floor(n / 887);
    if (
      x < 500 ||
      x > 655 ||
      y < 665 ||
      y > 780 ||
      seen[n] ||
      hand[n * 4 + 3] > 5
    )
      continue;
    seen[n] = 1;
    queue.push(n);
  }
for (let y = 665; y <= 780; y++)
  for (let x = 500; x <= 655; x++) {
    const n = y * 887 + x,
      i = n * 4;
    if (!seen[n] && hand[i + 3] === 0 && p[i + 3] > 5)
      hand.set(p.subarray(i, i + 4), i);
  }
writeFileSync(`${out}/hand.png`, rgbaPng(887, 1774, hand));
writeFileSync(`${root}/hand-clip-v2.svg`, svg);
