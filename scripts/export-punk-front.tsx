import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { Portrait } from "../apps/web/src/Avatar";
import { PUNK_LAYERS } from "../packages/domain/src/punk-pattern";
mkdirSync("docs/punk-front-v2", { recursive: true });
mkdirSync("public/assets/avatar/punk-front-v2", { recursive: true });
const figure = (prefix: string) =>
  renderToStaticMarkup(
    <Portrait id="iris" fullBody pose="front" layers={PUNK_LAYERS} />,
    { identifierPrefix: prefix },
  )
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1350"><rect width="1200" height="1350" fill="#44304f"/><text x="45" y="48" fill="#fff2f8" font-family="Arial" font-size="28">Éclipse rose · matières et détails</text><text x="45" y="80" fill="#d6c8db" font-family="Arial" font-size="17">Mannequin conservé · pose de face</text><svg x="10" y="115" width="560" height="1200" viewBox="0 0 480 1024">${figure("full-")}</svg><text x="625" y="150" fill="#fff2f8" font-family="Arial" font-size="22">Cheveux, tissu et métal</text><svg x="575" y="175" width="605" height="1090" viewBox="90 5 300 650">${figure("close-")}</svg></svg>`;
svg = svg.replace(
  /href="(\/assets\/[^\"]+)"/g,
  (_, p) =>
    `href="data:image/png;base64,${readFileSync("public" + p).toString("base64")}"`,
);
const png = new Resvg(svg).render().asPng();
writeFileSync("docs/punk-front-v2/front-details.png", png);
writeFileSync("public/assets/avatar/punk-front-v2/front-details.png", png);
