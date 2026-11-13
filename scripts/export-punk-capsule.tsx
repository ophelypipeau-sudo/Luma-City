import { PUNK_LAYERS } from "../packages/domain/src/punk-pattern";
import { TEXTILE_MATERIALS } from "../packages/domain/src/textile-material";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { Portrait } from "../apps/web/src/Avatar";
import { EMPTY_LAYERS } from "../apps/web/src/avatar/model";
const names = ["De face", "Main sur la hanche", "Mains en cœur"];
for (const close of [false, true]) {
  const figures = (["front", "hand-on-hip", "heart-hands"] as const)
    .map((pose, n) => {
      const figure = renderToStaticMarkup(
        <Portrait id="iris" fullBody pose={pose} layers={PUNK_LAYERS} />,
        { identifierPrefix: `pose${n}-` },
      )
        .replace(/^<svg[^>]*>/, "")
        .replace(/<\/svg>$/, "");
      return `<text x="${n * 500 + 250}" y="40" text-anchor="middle" fill="white" font-size="25" font-family="Arial">${names[n]}</text><svg x="${n * 500 + 10}" y="65" width="480" height="${close ? 585 : 1050}" viewBox="${close ? "25 170 430 370" : "0 0 480 1024"}" preserveAspectRatio="xMidYMid meet">${figure}</svg>`;
    })
    .join("");
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="${close ? 680 : 1160}"><rect width="1500" height="1450" fill="#493256"/>${figures}</svg>`;
  svg = svg.replace(
    /href="(\/assets\/[^\"]+)"/g,
    (_, p) =>
      `href="data:image/png;base64,${readFileSync("public" + p).toString("base64")}"`,
  );
  const rendered = new Resvg(svg).render().asPng();
  writeFileSync(
    `docs/punk-capsule-v1/${close ? "detail" : "trois-poses"}.png`,
    rendered,
  );
  writeFileSync(
    `public/assets/avatar/punk-capsule-v1/preview-${close ? "detail" : "trois-poses"}.png`,
    rendered,
  );
}

mkdirSync("public/assets/avatar/punk-capsule-v1/materials", {
  recursive: true,
});
for (const m of Object.values(TEXTILE_MATERIALS))
  writeFileSync(
    `public/assets/avatar/punk-capsule-v1/materials/${m.name}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}"><path d="${m.path}" fill="none" stroke="white" stroke-opacity="${m.opacity}" stroke-width="${m.strokeWidth}"/></svg>`,
  );
