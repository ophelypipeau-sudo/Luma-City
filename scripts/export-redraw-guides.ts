import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { RedrawnPoseDoll } from "../apps/web/src/avatar/RedrawnPoseDoll";
import { EMPTY_LAYERS } from "../apps/web/src/avatar/model";
const out = "public/assets/avatar/redrawn-v1/sources";
copyFileSync(
  "public/assets/avatar/fashion-v2/body-user.png",
  `${out}/body-front.png`,
);
for (const pose of ["hand-on-hip", "heart-hands"] as const) {
  const s = 1024 / 1774,
    o = (480 - 887 * s) / 2;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><g transform="scale(${1 / s}) translate(${-o} 0)">${renderToStaticMarkup(React.createElement(RedrawnPoseDoll, { layers: EMPTY_LAYERS, pose }))}</g></svg>`;
  svg = svg.replace(
    /href="(\/assets\/[^\"]+)"/g,
    (_, p) =>
      `href="data:image/png;base64,${readFileSync("public" + p).toString("base64")}"`,
  );
  writeFileSync(`${out}/body-${pose}.png`, new Resvg(svg).render().asPng());
}
