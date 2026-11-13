import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";

const W = 887,
  H = 1774,
  root = "docs/leopard-outfit-v1",
  out = "public/assets/avatar/leopard-v1";
mkdirSync(root, { recursive: true });
mkdirSync(out, { recursive: true });
const source = readFileSync(process.argv[2] ?? `${root}/painted-source.png`);
writeFileSync(`${root}/painted-source.png`, source);
const norm = new Resvg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><image width="887" height="1774" href="data:image/png;base64,${source.toString("base64")}"/></svg>`,
)
  .render()
  .asPng();
const p = pngPixels(Buffer.from(norm)).pixels;
const bodyBytes = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
const original = pngPixels(bodyBytes).pixels;
const hash = createHash("sha256").update(bodyBytes).digest("hex");
if (hash !== "8e3b61c5a45e5ddc9ee528530ced84eea3bd883a1a2e05914b81fd46e3b269e4")
  throw new Error("Body changed");
const top =
  "M320 478 C315 457 323 438 344 435 C378 429 416 448 443 474 C472 448 507 430 538 435 C560 435 573 454 568 478 C567 520 553 550 541 582 C530 613 539 645 555 671 Q490 703 443 743 Q391 704 331 672 C348 646 357 619 351 593 C342 556 322 522 320 478Z";
const pants =
  "M308 703 Q290 704 282 732 C270 764 261 806 259 847 C251 938 277 1055 285 1157 C282 1280 230 1467 199 1574 Q294 1637 440 1619 L448 890 Q457 1009 464 1156 C473 1319 454 1454 444 1622 Q575 1652 688 1598 C662 1478 642 1326 625 1189 C618 1095 633 957 627 858 Q619 776 591 724 Q582 702 560 704 Q529 698 506 730 Q480 727 452 751 Q426 738 400 741 Q374 713 344 725 Q326 700 308 703Z";
function svgMask(d: string) {
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><path d="${d}" fill="white"/></svg>`,
  ).render().pixels;
}
const topShape = svgMask(top),
  pantsShape = svgMask(pants);
const topPixels = new Uint8Array(W * H * 4),
  bottomPixels = new Uint8Array(W * H * 4),
  shoePixels = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4,
      [r, g, b, a] = p.subarray(i, i + 4);
    if (!a) continue;
    const dark = r < 115 && g < 100 && b < 90;
    const tie = y >= 313 && y < 478 && x > 390 && x < 500 && dark;
    if (topShape[i + 3] || tie) {
      topPixels.set(p.subarray(i, i + 4), i);
      topPixels[i + 3] = tie ? a : Math.round((a * topShape[i + 3]) / 255);
    }
    if (pantsShape[i + 3] && (y >= 830 || r < 160 || g > r * 0.68)) {
      bottomPixels.set(p.subarray(i, i + 4), i);
      bottomPixels[i + 3] = Math.round((a * pantsShape[i + 3]) / 255);
    }
    const fur = y >= 1565 && y < 1715 && r > g * 1.4 && g > b * 1.25;
    const shoe = y >= 1670 && y < 1765 && x > 235 && x < 650;
    if (fur || shoe) shoePixels.set(p.subarray(i, i + 4), i);
    if(y<1610 && Math.abs(x-443)<7) shoePixels[i+3]=0;
  }
// Keep only the two connected shoe drawings; trousers' stray seam ink is not
// part of the shoe thumbnail.
const visited=new Uint8Array(W*H);
for(let start=1565*W;start<W*H;start++){
  if(visited[start]||shoePixels[start*4+3]<8)continue;
  const part=[start];visited[start]=1;
  for(let k=0;k<part.length;k++)for(const q of [part[k]-1,part[k]+1,part[k]-W,part[k]+W])
    if(q>=0&&q<W*H&&!visited[q]&&shoePixels[q*4+3]>=8){visited[q]=1;part.push(q);}
  if(part.length<500)for(const n of part)shoePixels[n*4+3]=0;
}
for (const [name, cloth, base] of [
  ["top", topPixels, "#a57450"],
  ["pants", bottomPixels, "#39322d"],
  ["shoes", shoePixels, "#9e633b"],
] as const) {
  const mask = new Uint8Array(W * H * 4);
  // Keep black rosettes, seam ink, metal studs and leather details protected.
  for (let i = 0; i < cloth.length; i += 4) {
    const [r, g, b, a] = cloth.subarray(i, i + 4);
    const main =
      name === "top"
        ? Math.min(1, Math.max(0, (r - 65) / 55))
        : name === "pants"
          ? r < 110 && g < 100
            ? 1
            : 0
          : r > g * 1.16 && g > b * 1.12
            ? 1
            : 0;
    mask.set([255, 255, 255, Math.round(a * main)], i);
  }
  writeFileSync(`${out}/${name}.png`, rgbaPng(W, H, cloth));
  writeFileSync(`${out}/${name}-mask.png`, rgbaPng(W, H, mask));
}
// Original file and anatomy are immutable. Only the cut of the baked underwear
// changes inside its own pigment mask, using this same on-body drawing as source.
// Original underwear is used again as soon as the corresponding item is removed.
const variants = ["strapless", "low-rise", "combined"] as const;
const underwearMask = new Uint8Array(W * H);
for (let y = 338; y < 850; y++)
  for (let x = 290; x < 603; x++) {
    const i = (y * W + x) * 4,
      [r, g, b, a] = original.subarray(i, i + 4);
    if (a > 180 && b > g + 8 && Math.abs(r - b) < 50)
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++)
          underwearMask[(y + dy) * W + x + dx] = 1;
  }
for (const variant of variants) {
  const pixels = new Uint8Array(original);
  let changed = 0;
  for (let y = 338; y < 850; y++)
    for (let x = 290; x < 603; x++) {
      const i = (y * W + x) * 4,
        [r, g, b, a] = original.subarray(i, i + 4);
      const strapRegion = (x < 372 || x > 515) && y < 466;
      const briefsRegion = y > 690;
      const use =
        variant === "strapless"
          ? strapRegion
          : variant === "low-rise"
            ? briefsRegion
            : strapRegion || briefsRegion;
      const skin =
        p[i] > p[i + 1] * 1.15 && p[i + 1] > p[i + 2] * 1.25 && p[i + 3] > 220;
      const clothCovers = strapRegion ? topPixels[i+3]>0 : bottomPixels[i+3]>0;
      if (use && !clothCovers && underwearMask[y * W + x] && skin) {
        pixels.set(p.subarray(i, i + 4), i);
        pixels[i + 3] = original[i + 3];
        changed++;
      }
    }
  writeFileSync(`${out}/underwear-${variant}.png`, rgbaPng(W, H, pixels));
  console.log(variant, changed);
}
writeFileSync(
  `${root}/contours.json`,
  JSON.stringify(
    { canvas: [W, H], bodyHash: hash, top, pants, transform: "identity" },
    null,
    2,
  ),
);
const images = [
  readFileSync(`${out}/underwear-combined.png`),
  bottomPixels,
  shoePixels,
  topPixels,
].map((v, i) => (Buffer.isBuffer(v) ? v : rgbaPng(W, H, v)));
writeFileSync(
  `${root}/on-body.png`,
  new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><rect width="887" height="1774" fill="#f0dfd6"/>${images.map((bytes) => `<image width="887" height="1774" href="data:image/png;base64,${bytes.toString("base64")}"/>`).join("")}</svg>`,
  )
    .render()
    .asPng(),
);
