import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { LayeredDoll } from "../apps/web/src/avatar/LayeredDoll";
import { FASHION_BASE } from "../apps/web/src/avatar/base";
import { EMPTY_LAYERS } from "../apps/web/src/avatar/model";
import { ROSE_LAYERS } from "../apps/web/src/avatar/rose";
const scale = 1024 / 1774,
  offset = (480 - 887 * scale) / 2;
for (const [name, layers] of Object.entries({
  bare: EMPTY_LAYERS,
  shoes: { ...EMPTY_LAYERS, shoes: ROSE_LAYERS.shoes },
  outfit: ROSE_LAYERS,
})) {
  let svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774">
      <rect width="887" height="1774" fill="#e7d3c9" />
      <g transform="translate(0 0)">
        <g transform={`scale(${1 / scale}) translate(${-offset} 0)`}>
          <LayeredDoll bodyBase={FASHION_BASE} layers={layers} />
        </g>
      </g>
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
    "docs/rose-outfit-v1/shoes-" + name + ".png",
    new Resvg(svg).render().asPng(),
  );
}
