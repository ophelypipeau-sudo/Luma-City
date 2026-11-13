import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";
const root = process.argv[2] ?? "public/assets/avatar/poses/heart-hands-v3";
// Shared calibration from source shoulder centres (358/588, y324) to canonical
// shoulders (306/578, y341). Hands stay centred; no body artwork is transformed.
for (const name of ["arms", "lilac", "burgundy"]) {
  const bytes = readFileSync(`${root}/${name}-source.png`);
  const registration = root.endsWith("v3")
    ? "translate(-23 -7) scale(1 1)"
    : "translate(-116.32 17) scale(1.18 1)";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><g transform="${registration}"><image width="953" height="1651" preserveAspectRatio="none" href="data:image/png;base64,${bytes.toString("base64")}"/></g></svg>`;
  const png = new Resvg(svg).render().asPng();
  writeFileSync(`${root}/${name}.png`, png);
  if (name === "arms") continue;
  const { pixels: p } = pngPixels(png),
    mask = new Uint8Array(p.length);
  // Protect outer contours/cuff seams; the original drawing supplies all shading.
  for (let y = 2; y < 1772; y++)
    for (let x = 2; x < 885; x++) {
      const i = (y * 887 + x) * 4;
      const lum = (p[i] + p[i + 1] + p[i + 2]) / 3;
      if (p[i + 3] < 245 || lum < (name === "lilac" ? 90 : 36)) continue;
      if ([-2, 2, -1774, 1774].some((offset) => p[i + offset * 4 + 3] < 245))
        continue;
      mask.set([255, 255, 255, 255], i);
    }
  writeFileSync(`${root}/${name}-mask.png`, rgbaPng(887, 1774, mask));
}


