import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { LayeredDoll } from "../apps/web/src/avatar/LayeredDoll";
import { IMPORT_TEST_LAYERS as DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
const scale = 1024 / 1774,
  offset = (480 - 887 * scale) / 2;
for (const [name, layers] of [
  ["polo", DEFAULT_LAYERS],
  ["taille", { ...DEFAULT_LAYERS, top: null }],
] as const) {
  let svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774">
      <g transform={`scale(${1 / scale}) translate(${-offset} 0)`}>
        <LayeredDoll layers={layers} />
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
    "docs/import-test-v1/native-" + name + "-r2.png",
    new Resvg(svg).render().asPng(),
  );
}
const img = (name: string) =>
  "data:image/png;base64," +
  readFileSync("docs/import-test-v1/native-" + name + "-r2.png").toString(
    "base64",
  );
const detail = renderToStaticMarkup(
  <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="530">
    <rect width="1000" height="530" fill="#e8d7ce" />
    <g fontFamily="Arial" fontSize="22" fill="#61444a">
      <text x="25" y="35">
        Col : dos derrière le cou
      </text>
      <text x="525" y="35">
        Jogging : taille ajustée au corps
      </text>
    </g>
    <svg x="10" y="65" width="480" height="445" viewBox="290 370 310 290">
      <image href={img("polo")} width="887" height="1774" />
    </svg>
    <svg x="510" y="65" width="480" height="445" viewBox="265 650 355 330">
      <image href={img("taille")} width="887" height="1774" />
    </svg>
  </svg>,
);
writeFileSync(
  "docs/import-test-v1/raccords-r2.png",
  new Resvg(detail).render().asPng(),
);
