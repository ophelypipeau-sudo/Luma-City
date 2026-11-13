import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { LayeredDoll } from "../apps/web/src/avatar/LayeredDoll";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
import { FASHION_BASE } from "../apps/web/src/avatar/base";
const root = "docs/rail-hand-on-hip";
mkdirSync(root, { recursive: true });
const scale = 1024 / 1774,
  offset = (480 - 887 * scale) / 2;
let svg = renderToStaticMarkup(
  <svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774">
    <g transform={`scale(${1 / scale}) translate(${-offset} 0)`}>
      <LayeredDoll layers={DEFAULT_LAYERS} bodyBase={FASHION_BASE} />
    </g>
  </svg>,
);
svg = svg.replace(
  /href="(\/assets\/[^\"]+)"/g,
  (_, p) =>
    `href="data:image/png;base64,${readFileSync("public" + p).toString("base64")}"`,
);
writeFileSync(`${root}/front-source.png`, new Resvg(svg).render().asPng());
