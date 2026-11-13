import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";
const W = 887,
  H = 1774,
  out = "public/assets/avatar/leopard-v3",
  root = "docs/leopard-outfit-v3";
mkdirSync(out, { recursive: true });
mkdirSync(root, { recursive: true });
const original = readFileSync("public/assets/avatar/leopard-v2/shoes.png");
const upper =
  "M305 1637 Q302 1616 321 1612 Q338 1604 355 1612 Q374 1616 373 1637 L382 1659 Q397 1673 401 1695 L399 1736 Q340 1758 275 1736 L275 1695 Q279 1673 296 1659Z";
const tongue = "M324 1618 Q337 1611 351 1618 L361 1668 Q339 1677 315 1668Z";
const seam =
  "M308 1631 Q297 1654 292 1678 M369 1631 Q380 1654 384 1678 M298 1670 Q337 1687 378 1670";
const laces = Array.from({ length: 5 }, (_, i) => {
  const y = 1631 + i * 8;
  return `<path d="M${321 - i} ${y}L${354 + i} ${y + 6} M${354 + i} ${y}L${321 - i} ${y + 6}" fill="none" stroke="#bca38b" stroke-width="2.4" stroke-linecap="round"/><circle cx="${319 - i}" cy="${y + 2}" r="2.1" fill="#30231d"/><circle cx="${356 + i}" cy="${y + 2}" r="2.1" fill="#30231d"/>`;
}).join("");
const pair = `<path d="${upper}" fill="url(#leather)" stroke="#241b17" stroke-width="2"/><path d="M307 1626 Q335 1608 371 1626" fill="none" stroke="#675142" stroke-width="6" stroke-linecap="round"/><path d="M310 1628 Q338 1615 368 1628" fill="none" stroke="#241c18" stroke-width="4" stroke-linecap="round"/><path d="${tongue}" fill="#44352c" stroke="#241c18" stroke-width="1.5"/><path d="${seam}" fill="none" stroke="#7c6350" stroke-width="1.7"/>${laces}`;
// Preserve the original round toe, platform and golden strap as source artwork.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><defs><linearGradient id="leather"><stop stop-color="#231c18"/><stop offset=".42" stop-color="#534031"/><stop offset=".68" stop-color="#3c2e25"/><stop offset="1" stop-color="#261e18"/></linearGradient><clipPath id="front"><rect x="273" y="1680" width="130" height="94"/><rect x="488" y="1680" width="136" height="94"/></clipPath></defs>${pair}<g transform="translate(215 0)">${pair}</g><g clip-path="url(#front)"><image width="887" height="1774" href="data:image/png;base64,${original.toString("base64")}"/></g></svg>`;
const bytes = Buffer.from(new Resvg(svg).render().asPng()),
  pixels = pngPixels(bytes).pixels,
  mask = new Uint8Array(W * H * 4);
for (let i = 0; i < pixels.length; i += 4) {
  const [r, g, b, a] = pixels.subarray(i, i + 4);
  mask.set([255, 255, 255, r < 130 && g < 105 ? a : 0], i);
}
writeFileSync(`${out}/shoes.png`, bytes);
writeFileSync(`${out}/shoes-mask.png`, rgbaPng(W, H, mask));
writeFileSync(`${root}/sneakers.svg`, svg);
