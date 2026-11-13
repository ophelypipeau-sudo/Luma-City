import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { Portrait } from "../apps/web/src/Avatar";
import { EMPTY_LAYERS } from "../apps/web/src/avatar/model";
const names = ["De face", "Main sur la hanche", "Mains en cœur"];
for (const close of [false, true]) {
  const figures = (["front", "hand-on-hip", "heart-hands"] as const)
    .map((pose, n) => {
      const figure = renderToStaticMarkup(
        <Portrait
          id="iris"
          fullBody
          pose={pose}
          layers={{ ...EMPTY_LAYERS, top: "fashion.burgundy-fold-sweater" }}
        />,
        { identifierPrefix: `pose${n}-` },
      )
        .replace(/^<svg[^>]*>/, "")
        .replace(/<\/svg>$/, "");
      return `<text x="${n * 500 + 250}" y="40" text-anchor="middle" fill="white" font-size="25" font-family="Arial">${names[n]}</text><svg x="${n * 500 + 10}" y="65" width="480" height="${close ? 585 : 1370}" viewBox="${close ? "25 170 430 370" : "0 0 480 1024"}" preserveAspectRatio="xMidYMid meet">${figure}</svg>`;
    })
    .join("");
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="${close ? 680 : 1450}"><rect width="1500" height="1450" fill="#493256"/>${figures}</svg>`;
  svg = svg.replace(
    /href="(\/assets\/[^\"]+)"/g,
    (_, p) =>
      `href="data:image/png;base64,${readFileSync("public" + p).toString("base64")}"`,
  );
  const rendered = new Resvg(svg).render().asPng();
  writeFileSync(
    `docs/burgundy-cut-v2/${close ? "detail" : "trois-poses"}.png`,
    rendered,
  );
  writeFileSync(
    `public/assets/avatar/burgundy-cut-v2/preview-${close ? "detail" : "trois-poses"}.png`,
    rendered,
  );
}
