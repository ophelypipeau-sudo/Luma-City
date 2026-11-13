import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { AvatarGarment } from "../apps/web/src/avatar/LayeredDoll";
import { avatarGarment } from "../apps/web/src/avatar/catalog";
mkdirSync("docs/atelier", { recursive: true });
let svg = renderToStaticMarkup(
  <svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774">
    <AvatarGarment piece={avatarGarment("fashion.rose-bow-camisole")} />
  </svg>,
);
svg = svg.replace(
  /href="(\/assets\/[^\"]+)"/g,
  (_, p) =>
    `href="data:image/png;base64,${readFileSync("public" + p).toString("base64")}"`,
);
writeFileSync(
  "docs/atelier/approved-top-fixture.png",
  new Resvg(svg).render().asPng(),
);
