import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { CartoonDoll } from "../apps/web/src/cartoon/CartoonDoll";
import { BARE_OUTFIT, ORIGINAL_OUTFIT } from "../apps/web/src/shop/catalog";

const stages = [
  {
    name: "01 · La nouvelle base",
    note: "Chauve · sous-vêtements opaques",
    outfit: BARE_OUTFIT,
  },
  {
    name: "02 · La coiffure",
    note: "Même corps · perruque amovible",
    outfit: { ...BARE_OUTFIT, hair: 0 },
  },
  {
    name: "03 · La tenue complète",
    note: "Haut · bas · bottes · bijoux",
    outfit: ORIGINAL_OUTFIT,
  },
];
let svg = renderToStaticMarkup(
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1120"
    height="930"
    viewBox="0 0 1120 930"
  >
    <defs>
      <linearGradient id="board-bg" x2="1" y2="1">
        <stop stopColor="#23182f" />
        <stop offset="1" stopColor="#584175" />
      </linearGradient>
    </defs>
    <rect width="1120" height="930" rx="24" fill="url(#board-bg)" />
    <text
      x="48"
      y="58"
      fill="#f8ddae"
      fontFamily="Arial"
      fontSize="12"
      letterSpacing="3"
    >
      UN PETIT MONDE · DIRECTION ARTISTIQUE
    </text>
    <text
      x="48"
      y="102"
      fill="#fff6ff"
      fontFamily="Arial"
      fontSize="32"
      fontWeight="bold"
    >
      La nouvelle poupée cartoon
    </text>
    <text x="48" y="133" fill="#d6c2e6" fontFamily="Arial" fontSize="15">
      Grands yeux expressifs, silhouette de face et dressing dessiné sur le même
      corps.
    </text>
    {stages.map((stage, i) => (
      <g key={stage.name}>
        <rect
          x={32 + i * 360}
          y="163"
          width="336"
          height="682"
          rx="18"
          fill="#e1c3f0"
          fillOpacity=".055"
          stroke="#dbc0ee"
          strokeOpacity=".25"
        />
        <text
          x={54 + i * 360}
          y="197"
          fill="#ffe6bf"
          fontFamily="Arial"
          fontSize="17"
          fontWeight="bold"
        >
          {stage.name}
        </text>
        <text
          x={54 + i * 360}
          y="221"
          fill="#d8c4e8"
          fontFamily="Arial"
          fontSize="12"
        >
          {stage.note}
        </text>
        <svg
          x={48 + i * 360}
          y="237"
          width="304"
          height="594"
          viewBox="0 0 480 1024"
        >
          <CartoonDoll characterId="iris" outfit={stage.outfit} />
        </svg>
      </g>
    ))}
    <text
      x="560"
      y="884"
      fill="#efddf7"
      fontFamily="Arial"
      fontSize="15"
      textAnchor="middle"
    >
      Une silhouette fixe · Des calques indépendants · Le même dessin dans la
      boutique
    </text>
  </svg>,
);
for (const name of ["cartoon-base-v6.png", "cartoon-hair-v6.png"]) {
  const png = await readFile(`public/assets/${name}`);
  svg = svg.replaceAll(
    `/assets/${name}`,
    `data:image/png;base64,${png.toString("base64")}`,
  );
}
await mkdir("docs/screenshots", { recursive: true });
await writeFile("docs/avatar-cartoon-v6.svg", svg);
await writeFile(
  "docs/screenshots/avatar-cartoon-v6-planche.png",
  new Resvg(svg).render().asPng(),
);
console.log(
  "Exported docs/avatar-cartoon-v6.svg and docs/screenshots/avatar-cartoon-v6-planche.png",
);
