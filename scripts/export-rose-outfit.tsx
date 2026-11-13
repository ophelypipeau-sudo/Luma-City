import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { LayeredDoll } from "../apps/web/src/avatar/LayeredDoll";
import { FASHION_BASE } from "../apps/web/src/avatar/base";
import { ROSE_LAYERS } from "../apps/web/src/avatar/rose";
let svg = renderToStaticMarkup(
  <svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1100">
    <rect width="1440" height="1100" fill="#e7d3c9" />
    {["normal", "body-cutaway", "garments"].map((inspection, i) => (
      <svg
        key={i}
        x={480 * i}
        y="30"
        width="480"
        height="1050"
        viewBox="0 0 480 1024"
      >
        <LayeredDoll
          bodyBase={FASHION_BASE}
          layers={ROSE_LAYERS}
          inspection={inspection as "normal"}
        />
      </svg>
    ))}
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
  "docs/rose-outfit-v1/fitting-board.png",
  new Resvg(svg).render().asPng(),
);
