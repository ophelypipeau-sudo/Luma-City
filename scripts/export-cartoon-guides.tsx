import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { mkdir, writeFile } from "node:fs/promises";
import { CartoonGarment } from "../apps/web/src/cartoon/Wardrobe";
import {
  DOLL_IDS,
  DOLL_WIDTH,
  DOLL_HEIGHT,
} from "../apps/web/src/cartoon/model";

// Each standalone guide retains the complete doll canvas and body coordinates.
await mkdir(".data/cartoon-guides", { recursive: true });
for (const characterId of DOLL_IDS)
  for (const category of ["tops", "bottoms", "shoes"] as const) {
    const svg = renderToStaticMarkup(
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={DOLL_WIDTH}
        height={DOLL_HEIGHT}
        viewBox={`0 0 ${DOLL_WIDTH} ${DOLL_HEIGHT}`}
      >
        <CartoonGarment
          characterId={characterId}
          category={category}
          variant={0}
        />
      </svg>,
    );
    const path = `.data/cartoon-guides/${characterId}-${category}-v6`;
    await writeFile(`${path}.svg`, svg);
    await writeFile(`${path}.png`, new Resvg(svg).render().asPng());
  }
console.log("Exported 12 registered v6 garment guides (480 × 1024)");
