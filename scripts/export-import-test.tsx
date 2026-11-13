import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { LayeredDoll } from "../apps/web/src/avatar/LayeredDoll";
import { IMPORT_TEST_LAYERS as DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
let svg = renderToStaticMarkup(
  <svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1100">
    <rect width="1440" height="1100" fill="#cbb8b0" />
    {["import.polo-cream-blue", "import.camisole-white-navy"].map((top, i) => (
      <svg
        key={top}
        x={i * 480}
        y="50"
        width="480"
        height="1024"
        viewBox="0 0 480 1024"
      >
        <LayeredDoll layers={{ ...DEFAULT_LAYERS, top }} />
      </svg>
    ))}
    <svg x="960" y="50" width="480" height="1024" viewBox="0 0 480 1024">
      <LayeredDoll layers={DEFAULT_LAYERS} inspection="body-cutaway" />
    </svg>
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
  "docs/import-test-v1/fit-board.png",
  new Resvg(svg).render().asPng(),
);
