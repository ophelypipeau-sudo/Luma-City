/** Presentation only: renders the existing avatar over the proposed environment.
 * No character assets, game state, inventory or production catalogue are changed.
 * Run: npx tsx docs/maisons-v1/render-preview.tsx
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { Avatar } from "../../apps/web/src/Avatar";
import { DEFAULT_LAYERS } from "../../apps/web/src/avatar/model";

const directory = fileURLToPath(new URL("./", import.meta.url));
const room = readFileSync(directory + "salon-concept-v1.png").toString("base64");
const iris = renderToStaticMarkup(<Avatar id="iris" layers={{
  ...DEFAULT_LAYERS, hair: "fashion.hair-v3-01-carre",
}} />).replace(/href="(\/assets\/[^"]+)"/g, (_match, path: string) => {
  const mime = path.endsWith(".svg") ? "image/svg+xml" : path.endsWith(".webp") ? "image/webp" : "image/png";
  return `href="data:${mime};base64,${readFileSync("public" + path).toString("base64")}"`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1520" height="1034" viewBox="0 0 1000 680">
  <image href="data:image/png;base64,${room}" width="1000" height="680" preserveAspectRatio="none"/>
  <g transform="translate(775 575)"><g transform="scale(1.6)">${iris}</g>
    <rect x="-31" y="13" width="62" height="23" rx="11" fill="#fffaf6"/>
    <text x="0" y="29" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#513a56">Iris</text>
  </g>
  <g transform="translate(18 18)">
    <rect width="288" height="47" rx="10" fill="#34213f" fill-opacity=".9"/>
    <text x="14" y="20" font-family="sans-serif" font-size="13" fill="#fff5e7">LUMA CITY · Salon d’Iris</text>
    <text x="14" y="36" font-family="sans-serif" font-size="9" fill="#e8cced">PROPOSITION ARTISTIQUE 01 · À VALIDER</text>
  </g>
</svg>`;
writeFileSync(directory + "salon-iris-v1.svg", svg);
for (const [name, width] of [["salon-iris-v1.png", 1520], ["salon-iris-mobile-v1.png", 390]] as const) {
  writeFileSync(directory + name, new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng());
}
console.log("Prévisualisations statiques exportées avec le composant Avatar existant.");
