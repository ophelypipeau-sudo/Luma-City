import { readFileSync, writeFileSync } from "node:fs";
import { pngPixels } from "../../apps/server/src/atelier-images";
import { rgbaPng } from "../../scripts/lib/png-rgba";
import { DOLL_PATTERN } from "../../packages/domain/src/avatar-pattern";
import brief from "./brief.json";

const folder = "docs/capsule-pantalons-iris-v4";
const [width, height] = DOLL_PATTERN.canvas;
const reference = pngPixels(readFileSync(folder + "/iris-reference.png"));
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const studio = (pixels: Uint8Array, at: number) => {
  const [red, green, blue] = pixels.subarray(at, at + 3);
  return red > 186 && red <= green && green <= blue && blue - red < 31;
};
const revisions: Partial<Record<string, string>> = {
  "01-sculpt": "01-sculpt-r2",
  "02-flow": "02-flow-r2",
  "07-chrome": "07-chrome-r3",
  "08-rebel": "08-rebel-r3",
  "10-veil": "10-veil-r2",
};

for (const { id } of brief.models) {
  const name = revisions[id] ?? id;
  const image = pngPixels(readFileSync(folder + "/sources/" + name + ".png"));
  if (image.width !== width || image.height !== height)
    throw Error("Cadrage frontal inattendu pour " + name);

  if (id === "04-motion") {
    const retouch = pngPixels(readFileSync(folder + "/sources/04-motion-r2.png"));
    if (retouch.width !== width || retouch.height !== height)
      throw Error("Cadrage frontal inattendu pour la retouche de Motion.");
    // Use the retouched fabric only around the two former silver bars.
    for (const [x1, y1, x2, y2] of [[570, 856, 604, 829], [293, 1329, 310, 1379]]) {
      const dx = x2 - x1, dy = y2 - y1;
      const distance = (x: number, y: number) => {
        const along = clamp(((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy));
        return Math.hypot(x - x1 - dx * along, y - y1 - dy * along);
      };
      const left = Math.min(x1, x2) - 13, right = Math.max(x1, x2) + 13;
      const top = Math.min(y1, y2) - 13, bottom = Math.max(y1, y2) + 13;
      const adjustment = [0, 0, 0];
      let samples = 0;
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
        const offset = distance(x, y), at = (y * width + x) * 4;
        if (offset < 8 || offset > 13 || image.pixels[at] > 80 || retouch.pixels[at] > 80) continue;
        for (let c = 0; c < 3; c++) adjustment[c] += image.pixels[at+c] - retouch.pixels[at+c];
        samples++;
      }
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
        const weight = clamp((12 - distance(x, y)) / 7);
        if (!weight) continue;
        const at = (y * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          const replacement = retouch.pixels[at+c] + adjustment[c] / Math.max(1, samples);
          image.pixels[at+c] = Math.round(Math.max(0, Math.min(255, image.pixels[at+c] * (1 - weight) + replacement * weight)));
        }
      }
    }
  }

  // Reuse the same presentation face, crop top, hands and shoe tips on the
  // review board. These full-body views are separate from the source paintings.
  for (let y = 0; y < height; y++) {
    const outsideWaist = clamp((610 - y) / 62);
    const floorAndToes = clamp((y - 1703) / 18);
    for (let x = 0; x < width; x++) {
      const outsideLegs = clamp(Math.max(239 - x, x - 648) / 18);
      const at = (y * width + x) * 4;
      const backdrop = studio(image.pixels, at) && studio(reference.pixels, at) ? 1 : 0;
      const mix = Math.max(outsideWaist, floorAndToes, outsideLegs, backdrop);
      if (!mix) continue;
      for (let c = at; c < at + 3; c++)
        image.pixels[c] = Math.round(image.pixels[c] * (1 - mix) + reference.pixels[c] * mix);
    }
  }
  writeFileSync(folder + "/vues/" + id + ".png", rgbaPng(width, height, new Uint8Array(image.pixels)));
}
