import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const folder = "docs/capsule-coiffures-premium-iris";
const { coiffures } = JSON.parse(readFileSync(`${folder}/prompts.json`, "utf8").replace(/^\uFEFF/, "")) as {
  coiffures: { id: string; nom: string }[];
};
const width = 260;
const height = 370;
const render = (w: number, h: number, markup: string, viewBox = `0 0 ${w} ${h}`) => new Resvg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${markup}</svg>`,
).render();
const bitmap = (bytes: Uint8Array, x: number, y: number, w: number, h: number) =>
  `<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" href="data:image/png;base64,${Buffer.from(bytes).toString("base64")}"/>`;
const reference = readFileSync("docs/coiffures-iris-v3/01-carre.png");
const mannequin = readFileSync("public/assets/avatar/prune-fumee-v1/source.png");
const plum = "#4d3d55";
const backdrop = `<rect width="260" height="370" fill="${plum}"/>`;

// Compare the linework around the left eye, nose, and mouth to register every
// portrait to the original board. Omit the right eyebrow hidden by its bob.
const anchors = [[91, 119, 122, 145], [119, 145, 140, 174]];
const refPixels = render(width, height, bitmap(reference, 0, 0, width, height)).pixels;
function register(pixels: Uint8Array, minScale: number, maxScale: number, radius: number) {
  let best = { scale: 1, x: 0, y: 0, score: Infinity };
  const luma = (data: Uint8Array, x: number, y: number) => data[(y * width + x) * 4 + 1];
  for (let scale = minScale; scale <= maxScale + 0.001; scale += 0.01) {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        let error = 0;
        for (const [left, top, right, bottom] of anchors) {
          for (let ay = top; ay < bottom; ay += 2) {
            for (let ax = left; ax < right; ax += 2) {
              const px = Math.round(130 + (ax - 130 - x) / scale);
              const py = Math.round(140 + (ay - 140 - y) / scale);
              const a = luma(refPixels, ax, ay) - luma(refPixels, ax, ay + 2);
              const b = luma(pixels, px, py) - luma(pixels, px, py + 2);
              error += Math.abs(a - b);
            }
          }
        }
        if (error < best.score) best = { scale, x, y, score: error };
      }
    }
  }
  return `translate(${best.x} ${best.y}) translate(130 140) scale(${best.scale}) translate(-130 -140)`;
}

const canonical = bitmap(mannequin, -68.9, 56.5, 399.15, 798.3);
const canonicalPixels = render(width, height, canonical).pixels;
const canonicalTransform = register(canonicalPixels, 0.96, 1.04, 5);
// Reuse the official drawing for Iris's facial features. The preview keeps the
// illustrated hairline, temple wisps, and occlusions around the face.
const face = `<defs><filter id="feather"><feGaussianBlur stdDeviation="1.4"/></filter>
  <mask id="face"><path fill="white" filter="url(#feather)"
  d="M94 124 Q97 116 109 116 Q118 117 130 124 Q142 118 153 117 Q161 118 165 126
     L164 144 Q162 156 153 167 Q142 177 130 182 Q117 177 107 166 Q97 155 94 142Z"/></mask></defs>
  <g mask="url(#face)"><g transform="${canonicalTransform}">${canonical}</g></g>`;

const cards = coiffures.map(({ id, nom }, index) => {
  const source = readFileSync(`${folder}/sources/${id}.png`);
  const picture = bitmap(source, 0, 0, width, height);
  const transform = register(render(width, height, picture).pixels, 0.98, 1.03, 4);
  const framingWidth = 252;
  const framingHeight = framingWidth * height / width;
  const framing = `4 3 ${framingWidth} ${framingHeight}`;
  const view = render(width * 2, height * 2, `${backdrop}<g transform="${transform}">${picture}</g>${face}`, framing).asPng();
  writeFileSync(`${folder}/vues/${id}.png`, view);
  const x = 12 + index % 5 * 272;
  const y = 12 + Math.floor(index / 5) * 415;
  return bitmap(view, x, y, width, height) +
    `<text x="${x + 130}" y="${y + 393}" text-anchor="middle" font-family="Segoe UI" font-size="17" fill="#fff5ff">${nom}</text>`;
});

writeFileSync(`${folder}/planche.png`, render(1372, 842, `<rect width="1372" height="842" fill="#241d2e"/>${cards.join("")}`).asPng());
