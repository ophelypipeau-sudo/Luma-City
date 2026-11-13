import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { LayeredDoll } from "../apps/web/src/avatar/LayeredDoll";
import { FASHION_BASE } from "../apps/web/src/avatar/base";
import { DEFAULT_LAYERS, EMPTY_LAYERS } from "../apps/web/src/avatar/model";
let svg = renderToStaticMarkup(
  <svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1120">
    <rect width="1440" height="1120" fill="#e6d2c5" />
    {[EMPTY_LAYERS, DEFAULT_LAYERS, { ...DEFAULT_LAYERS, top: null }].map(
      (layers, i) => (
        <svg
          key={i}
          x={480 * i}
          y="30"
          width="480"
          height="1050"
          viewBox="0 0 480 1024"
        >
          <LayeredDoll layers={layers} bodyBase={FASHION_BASE} />
        </svg>
      ),
    )}
  </svg>,
);
svg = svg.replace(
  /href="(\/assets\/[^\"]+)"/g,
  (_, p) =>
    'href="data:image/png;base64,' +
    readFileSync("public" + p).toString("base64") +
    '"',
);
writeFileSync(
  "docs/fashion-doll-v2/fitting-board.png",
  new Resvg(svg).render().asPng(),
);
