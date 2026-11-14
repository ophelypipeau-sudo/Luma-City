/**
 * Contact sheet for new garments: each piece is worn on the mannequin (over the
 * default outfit), first in its own colour, then dyed, in ONE image.
 * One small image is enough to review fit, coverage and dye.
 *
 * Usage: npx tsx scripts/preview-looks.tsx <out.png> <garment-id> [<garment-id> …]
 *        npx tsx scripts/preview-looks.tsx sheet.png fashion.legging-studio fashion.fitted-tee
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { Portrait } from "../apps/web/src/Avatar";
import { avatarGarment } from "../apps/web/src/avatar/catalog";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";

const [out, ...ids] = process.argv.slice(2);
if (!out || !ids.length) throw new Error("Usage : preview-looks.tsx <out.png> <garment-id> …");
const CELL_W = 240, CELL_H = 520, LABEL = 28;
const DYE = "#e27bb0";
const inline = (svg: string) =>
  svg.replace(/href="(\/assets\/[^"]+)"/g, (_m, path: string) =>
    `href="data:image/png;base64,${readFileSync("public" + path).toString("base64")}"`);
const cells: string[] = [];
ids.forEach((id, col) => {
  const piece = avatarGarment(id);
  [undefined, DYE].forEach((dye, row) => {
    // The piece replaces the default one in its slot (no stacking).
    const layers = { ...DEFAULT_LAYERS, [piece.slot]: id, colors: dye ? { [id]: dye } : {} };
    // Each render reuses React's ids (masks, filters): make them unique per cell.
    const doll = renderToStaticMarkup(React.createElement(Portrait, { id: "iris", fullBody: true, layers }))
      .replaceAll("_R_", `_c${col}r${row}_`)
      .replace("<svg ", `<svg x="${col * CELL_W}" y="${row * (CELL_H + LABEL) + LABEL}" width="${CELL_W}" height="${CELL_H}" `);
    cells.push(doll);
    if (row === 0)
      cells.push(`<text x="${col * CELL_W + CELL_W / 2}" y="20" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#2a1530">${piece.name}</text>`);
  });
});
const width = ids.length * CELL_W, height = 2 * (CELL_H + LABEL);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#efe6f6"/>${cells.join("")}</svg>`;
writeFileSync(out, new Resvg(inline(svg), { fitTo: { mode: "width", value: width } }).render().asPng());
console.log(`Planche : ${out} (${ids.length} pièce${ids.length > 1 ? "s" : ""}, ${width}×${height})`);
