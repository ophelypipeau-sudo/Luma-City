import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";

// Presentation only. Original bitmaps are retained unchanged; no face/limb
// compositing, warping or garment fitting is performed by this script.
const folder = "docs/proposals/hourglass-v2";
const uri = async (name: string) =>
  `data:image/png;base64,${(await readFile(`${folder}/${name}`)).toString("base64")}`;
const reference = await uri("reference-style-fournie.png");
const candidate = await uri("hourglass-illustration-v2.png");
const svg = renderToStaticMarkup(
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1600"
    height="1870"
    viewBox="0 0 1600 1870"
  >
    <defs>
      <filter id="review-alpha" colorInterpolationFilters="sRGB">
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0 0 .6 1" />
        </feComponentTransfer>
      </filter>
    </defs>
    <rect width="1600" height="1870" fill="#fff" />
    <rect width="1600" height="130" fill="#35263f" />
    <g fontFamily="Arial, sans-serif">
      <text x="52" y="46" fill="#dec3ed" fontSize="14" letterSpacing="3">
        UN PETIT MONDE · RECHERCHE VISUELLE
      </text>
      <text x="52" y="98" fill="#fff5ff" fontSize="35" fontWeight="bold">
        Sablier X — nouvelle proposition illustrée
      </text>
      <text x="1548" y="46" fill="#ffe1ae" fontSize="15" textAnchor="end">
        PROPOSITION 02 · À VALIDER
      </text>
      <text
        x="400"
        y="185"
        fill="#45314f"
        fontSize="26"
        textAnchor="middle"
        fontWeight="bold"
      >
        Ta référence cartoon
      </text>
      <text
        x="1200"
        y="185"
        fill="#45314f"
        fontSize="26"
        textAnchor="middle"
        fontWeight="bold"
      >
        Base sablier retravaillée
      </text>
      <text x="400" y="218" fill="#8a7693" fontSize="15" textAnchor="middle">
        IMAGE FOURNIE · DIRECTION ARTISTIQUE
      </text>
      <text x="1200" y="218" fill="#8a7693" fontSize="15" textAnchor="middle">
        IDENTITÉ IRIS · BASE CHAUVE EN SOUS-VÊTEMENTS
      </text>
      <path d="M800 258V1750" stroke="#e9e1ee" strokeWidth="2" />
      <svg
        x="45"
        y="255"
        width="710"
        height="1490"
        viewBox="70 60 440 920"
        preserveAspectRatio="xMidYMid meet"
      >
        <image href={reference} width="576" height="1024" />
      </svg>
      <svg
        x="845"
        y="255"
        width="710"
        height="1490"
        viewBox="60 40 770 1710"
        preserveAspectRatio="xMidYMid meet"
      >
        <image
          href={candidate}
          width="887"
          height="1774"
          filter="url(#review-alpha)"
        />
      </svg>
      <rect y="1785" width="1600" height="85" fill="#f6f0f9" />
      <text x="800" y="1825" fill="#594465" fontSize="18" textAnchor="middle">
        Validation du dessin uniquement : contours, volumes, raccords et
        ombrages.
      </text>
      <text x="800" y="1853" fill="#8a7693" fontSize="14" textAnchor="middle">
        Les cinq autres corps et la tenue pilote attendent la validation de
        cette base.
      </text>
    </g>
  </svg>,
);
await writeFile(`${folder}/comparaison-reference-sablier.svg`, svg);
await writeFile(
  `${folder}/comparaison-reference-sablier.png`,
  new Resvg(svg).render().asPng(),
);
console.log(`${folder}/comparaison-reference-sablier.png`);
