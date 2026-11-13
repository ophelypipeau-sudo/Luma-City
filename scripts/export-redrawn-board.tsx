import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { Portrait } from "../apps/web/src/Avatar";
import { WINTER_LOOKS } from "../apps/web/src/avatar/winter";
import { BURGUNDY_LAYERS } from "../apps/web/src/avatar/burgundy";
import { ROSE_LAYERS } from "../apps/web/src/avatar/rose";
import { LEOPARD_LAYERS } from "../apps/web/src/avatar/leopard";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
const looks = [
  ...WINTER_LOOKS,
  { name: "Bordeaux", layers: BURGUNDY_LAYERS },
  { name: "Léopard", layers: LEOPARD_LAYERS },
  { name: "Lilas", layers: DEFAULT_LAYERS },
  { name: "Cargo", layers: ROSE_LAYERS },
];
for (const [i, look] of looks.entries()) {
  let svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width="1050" height="790">
      <rect width="1050" height="790" fill="#493256" />
      {(["front", "hand-on-hip", "heart-hands"] as const).map((pose, n) => (
        <g key={pose}>
          <text x={n * 350 + 25} y="25" fill="white" fontSize="19">
            {look.name} · {pose}
          </text>
          <svg
            x={n * 350}
            y="35"
            width="350"
            height="740"
            viewBox="0 0 480 1024"
          >
            <Portrait id="iris" layers={look.layers} fullBody pose={pose} />
          </svg>
        </g>
      ))}
    </svg>,
  );
  svg = svg.replace(
    /href="(\/assets\/[^\"]+)"/g,
    (_, p) =>
      `href="data:image/png;base64,${readFileSync("public" + p).toString("base64")}"`,
  );
  writeFileSync(
    `docs/redrawn-clothes-v1/render-${i}.png`,
    new Resvg(svg).render().asPng(),
  );
}
