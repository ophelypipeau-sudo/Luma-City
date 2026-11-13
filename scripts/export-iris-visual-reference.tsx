import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { CartoonDoll } from "../apps/web/src/cartoon/CartoonDoll";
import { BARE_OUTFIT } from "../apps/web/src/shop/catalog";

// Faithful export of the existing renderer, not the rejected SVG body proposal.
const folder = "docs/proposals/hourglass-v2";
await mkdir(folder, { recursive: true });
const source = await readFile("public/assets/cartoon-base-v6.png");
const svg = renderToStaticMarkup(
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="960"
    height="2048"
    viewBox="0 0 480 1024"
  >
    <CartoonDoll characterId="iris" outfit={BARE_OUTFIT} />
  </svg>,
).replaceAll(
  "/assets/cartoon-base-v6.png",
  `data:image/png;base64,${source.toString("base64")}`,
);
await writeFile(
  `${folder}/iris-v6-reference.png`,
  new Resvg(svg).render().asPng(),
);
console.log(`${folder}/iris-v6-reference.png`);
