import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";
const W = 887,
  H = 1774,
  out = "public/assets/avatar/leopard-v2";
mkdirSync(out, { recursive: true });
const load = (name: string) =>
  pngPixels(readFileSync(`public/assets/avatar/leopard-v1/${name}.png`)).pixels;
const old = load("shoes"),
  pants = new Uint8Array(load("pants")),
  main = new Uint8Array(load("pants-mask"));
const fur = new Uint8Array(W * H * 4),
  shoeFront = new Uint8Array(W * H * 4),
  detail = new Uint8Array(W * H * 4);
for (let y = 1565; y < H; y++)
  for (let x = 170; x < 710; x++) {
    const i = (y * W + x) * 4,
      [r, g, b, a] = old.subarray(i, i + 4);
    if (!a) continue;
    const center = x < 443 ? 337 : 552,
      inside = Math.abs(x - center) < 64;
    const cutoff = inside ? 1675 + Math.abs(x - center) * 0.24 : 1714;
    const isFur = y < 1670 || (y < cutoff && r > g * 1.4 && g > b * 1.25);
    if (isFur) {
      fur.set(old.subarray(i, i + 4), i);
      pants.set(old.subarray(i, i + 4), i);
      detail.set([255, 255, 255, a], i);
      main[i + 3] = 0;
    } else shoeFront.set(old.subarray(i, i + 4), i);
  }
// Complete the leather upper previously hidden by the trouser cuff. It stays
// behind the pants and follows the existing ankle, foot and sole landmarks.
const upper =
  "M315 1593 Q337 1585 362 1593 L373 1643 Q391 1665 400 1698 L400 1738 Q342 1760 275 1738 L275 1698 Q281 1668 307 1643Z";
const upperRight =
  "M529 1593 Q552 1585 576 1593 L586 1643 Q607 1665 620 1698 L620 1738 Q559 1760 493 1738 L493 1698 Q501 1668 521 1643Z";
const bootSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><defs><linearGradient id="leather"><stop stop-color="#211a17"/><stop offset=".38" stop-color="#45352d"/><stop offset=".63" stop-color="#352923"/><stop offset="1" stop-color="#201a17"/></linearGradient></defs><path d="${upper} ${upperRight}" fill="url(#leather)" stroke="#211a18" stroke-width="2"/><path d="M316 1595Q339 1604 361 1595 M530 1595Q553 1604 575 1595 M312 1646Q333 1659 371 1645 M525 1646Q551 1659 585 1645" fill="none" stroke="#655043" stroke-width="1.6"/><image width="887" height="1774" href="data:image/png;base64,${rgbaPng(W, H, shoeFront).toString("base64")}"/></svg>`;
const shoes = pngPixels(
  Buffer.from(new Resvg(bootSvg).render().asPng()),
).pixels;
const shoeMask = new Uint8Array(W * H * 4);
for (let i = 0; i < shoes.length; i += 4) {
  const [r, g, b, a] = shoes.subarray(i, i + 4);
  shoeMask.set([255, 255, 255, r < 130 && g < 105 ? a : 0], i);
}
writeFileSync(`${out}/pants.png`, rgbaPng(W, H, pants));
writeFileSync(`${out}/pants-mask.png`, rgbaPng(W, H, main));
writeFileSync(`${out}/fur-mask.png`, rgbaPng(W, H, detail));
writeFileSync(`${out}/shoes.png`, rgbaPng(W, H, shoes));
writeFileSync(`${out}/shoes-mask.png`, rgbaPng(W, H, shoeMask));
writeFileSync("docs/leopard-outfit-v2/leather-upper.svg", bootSvg);
writeFileSync("docs/leopard-outfit-v2/fur-layer.png", rgbaPng(W, H, fur));
