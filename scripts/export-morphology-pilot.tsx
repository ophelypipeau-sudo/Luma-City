import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
import { CartoonDoll } from "../apps/web/src/cartoon/CartoonDoll";
import { MORPHOLOGIES } from "../apps/web/src/cartoon/model";
import { BARE_OUTFIT } from "../apps/web/src/shop/catalog";
import { createPilotAppearance } from "../apps/web/src/cartoon/pilot";
import {
  morphologyFit,
  MORPH_SCALE,
  MORPH_OFFSET_X,
} from "../apps/web/src/cartoon/morphology-fits";
const folder = "docs/proposals/pilot-v6";
await mkdir(folder, { recursive: true });
for (const inspection of ["normal", "body-cutaway"] as const) {
  let svg = renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="2520"
      height="1170"
      viewBox="0 0 2520 1170"
    >
      <rect width="2520" height="1170" fill="#35263f" />
      <g fontFamily="Arial" fill="#fdf4ff">
        <text x="40" y="50" fontSize="16" letterSpacing="3">
          UN PETIT MONDE · HABILLAGE 2D
        </text>
        <text x="40" y="104" fontSize="38" fontWeight="bold">
          {inspection === "normal"
            ? "Une tenue, six coupes adaptées"
            : "Contrôle : corps réellement découpé sous les vêtements"}
        </text>
        <text x="40" y="142" fontSize="20" fill="#d2bbdf">
          Caraco lumière · Denim plissé · Bottes givrées — mêmes identifiants de
          pièces sur les six corps
        </text>
        {MORPHOLOGIES.map((m, i) => (
          <g key={m.id}>
            <rect
              x={15 + i * 420}
              y="180"
              width="408"
              height="902"
              rx="18"
              fill="#5b426e"
              stroke="#9679ab"
            />
            <text
              x={219 + i * 420}
              y="225"
              fontSize="26"
              textAnchor="middle"
              fill="#ffe1ac"
            >
              {m.name}
            </text>
            <svg
              x={35 + i * 420}
              y="250"
              width="368"
              height="810"
              viewBox="0 0 480 1024"
            >
              <CartoonDoll
                characterId="iris"
                outfit={BARE_OUTFIT}
                appearance={createPilotAppearance(m.id)}
                inspection={inspection}
              />
            </svg>
          </g>
        ))}
        <text
          x="1260"
          y="1130"
          fontSize="21"
          textAnchor="middle"
          fill="#dac7e6"
        >
          Corps validés · Pièces indépendantes · Masques corporels et contours
          de vêtements partagés
        </text>
      </g>
    </svg>,
  );
  for (const m of MORPHOLOGIES)
    svg = svg.replaceAll(
      `/assets/morphology-v6/${m.id}.png`,
      `data:image/png;base64,${(await readFile(`public/assets/morphology-v6/${m.id}.png`)).toString("base64")}`,
    );
  const name =
    inspection === "normal"
      ? "tenue-pilote-six-morphologies"
      : "controle-masques";
  await writeFile(`${folder}/${name}.svg`, svg);
  await writeFile(`${folder}/${name}.png`, new Resvg(svg).render().asPng());
}
await writeFile(
  `${folder}/calibrage.json`,
  JSON.stringify(
    {
      sourceCanvas: [887, 1774],
      logicalCanvas: [480, 1024],
      uniformScale: MORPH_SCALE,
      offsetX: MORPH_OFFSET_X,
      profiles: MORPHOLOGIES.map((m) => ({
        id: m.id,
        asset: `/assets/morphology-v6/${m.id}.png`,
        ...morphologyFit(m.id),
      })),
    },
    null,
    2,
  ) + "\n",
);
console.log(folder);
