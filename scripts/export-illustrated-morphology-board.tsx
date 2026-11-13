import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";

const folder = "docs/proposals/morphologies-illustrated-v2";
const profiles = [
  { id: "X", name: "Sablier · X", note: "Équilibré · taille marquée" },
  { id: "A", name: "Poire · A", note: "Épaules fines · bassin plus large" },
  { id: "O", name: "Pomme · O", note: "Abdomen arrondi · taille plus pleine" },
  {
    id: "H",
    name: "Rectangle · H",
    note: "Taille peu creusée · lignes plus droites",
  },
  { id: "V", name: "V inversé", note: "Épaules plus larges · bassin étroit" },
  {
    id: "8",
    name: "Morphologie · 8",
    note: "Hanches hautes · formes plus pleines",
  },
];
const images = Object.fromEntries(
  await Promise.all(
    profiles.map(async (p) => [
      p.id,
      `data:image/png;base64,${(await readFile(`${folder}/${p.id === "8" ? "body-8-r2.png" : `body-${p.id}.png`}`)).toString("base64")}`,
    ]),
  ),
);
for (const pair of [false, true]) {
  const visible = pair ? [profiles[0], profiles[5]] : profiles;
  const width = pair ? 1100 : 3200,
    height = pair ? 1500 : 1420;
  const column = width / visible.length;
  const portraitHeight = pair ? 1140 : 960;
  const portraitWidth = portraitHeight / 2;
  const svg = renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <filter id="illustrated-alpha" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0 0 .6 1" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width={width} height={height} fill="#fff" />
      <rect width={width} height="148" fill="#35263f" />
      <g fontFamily="Arial, sans-serif">
        <text
          x="42"
          y="43"
          fill="#e0c5ed"
          fontSize={pair ? 12 : 16}
          letterSpacing="3"
        >
          UN PETIT MONDE · BASES CARTOON ILLUSTRÉES
        </text>
        <text
          x="42"
          y="99"
          fill="#fff5ff"
          fontSize={pair ? 31 : 45}
          fontWeight="bold"
        >
          {pair
            ? "X / 8 — comparaison des volumes"
            : "Six morphologies dans la direction du sablier validé"}
        </text>
        <text x="42" y="130" fill="#d5c2df" fontSize={pair ? 14 : 20}>
          Même identité Iris · même pose et même échelle · sous-vêtements
          opaques
        </text>
        {visible.map((p, i) => (
          <g key={p.id}>
            <text
              x={column * (i + 0.5)}
              y="207"
              fill="#493451"
              fontSize={pair ? 26 : 30}
              fontWeight="bold"
              textAnchor="middle"
            >
              {p.name}
            </text>
            <text
              x={column * (i + 0.5)}
              y="242"
              fill="#8c7599"
              fontSize={pair ? 14 : 16}
              textAnchor="middle"
            >
              {p.note}
            </text>
            <image
              href={images[p.id]}
              x={column * i + (column - portraitWidth) / 2}
              y="276"
              width={portraitWidth}
              height={portraitHeight}
              preserveAspectRatio="xMidYMid meet"
              filter="url(#illustrated-alpha)"
            />
            {i > 0 && (
              <path d={`M${column * i} 183V${height - 85}`} stroke="#e9e0ef" />
            )}
          </g>
        ))}
        <rect y={height - 80} width={width} height="80" fill="#f6f0f9" />
        <text
          x={width / 2}
          y={height - 44}
          fill="#5b4468"
          fontSize={pair ? 16 : 22}
          textAnchor="middle"
        >
          Sablier X validé · Les cinq autres corps sont proposés à validation.
        </text>
        <text
          x={width / 2}
          y={height - 16}
          fill="#8b7796"
          fontSize={pair ? 12 : 16}
          textAnchor="middle"
        >
          Étude des corps uniquement — adaptation de la tenue pilote après
          validation des six silhouettes.
        </text>
      </g>
    </svg>,
  );
  const name = pair ? "comparaison-X-8" : "planche-six-corps-illustres";
  await writeFile(`${folder}/${name}.svg`, svg);
  await writeFile(`${folder}/${name}.png`, new Resvg(svg).render().asPng());
}
console.log(`${folder}/planche-six-corps-illustres.png`);
