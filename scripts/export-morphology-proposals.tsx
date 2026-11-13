import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
import { MorphologyComparison } from "../apps/web/src/cartoon/MorphologyComparison";
import { MorphologyBody } from "../apps/web/src/cartoon/MorphologyBody";
import {
  MORPHOLOGY_PROPOSALS,
  morphologyGeometry,
} from "../apps/web/src/cartoon/morphology-proposals";

const folder = "docs/proposals/morphologies-v1";
await mkdir(folder, { recursive: true });
const source = await readFile("public/assets/cartoon-base-v6.png");
const embed = (svg: string) =>
  svg.replaceAll(
    "/assets/cartoon-base-v6.png",
    `data:image/png;base64,${source.toString("base64")}`,
  );
for (const guides of [false, true]) {
  const svg = embed(
    renderToStaticMarkup(<MorphologyComparison guides={guides} />),
  );
  const name = guides ? "planche-reperes" : "planche-comparative";
  await writeFile(`${folder}/${name}.svg`, svg);
  await writeFile(`${folder}/${name}.png`, new Resvg(svg).render().asPng());
}
for (const profile of MORPHOLOGY_PROPOSALS) {
  const svg = embed(
    renderToStaticMarkup(
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="480"
        height="1024"
        viewBox="0 0 480 1024"
      >
        <MorphologyBody profile={profile} />
      </svg>,
    ),
  );
  await writeFile(`${folder}/body-${profile.id}.svg`, svg);
  await writeFile(
    `${folder}/body-${profile.id}.png`,
    new Resvg(svg).render().asPng(),
  );
}
await writeFile(
  `${folder}/contours-et-reperes.json`,
  JSON.stringify(
    MORPHOLOGY_PROPOSALS.map((profile) => ({
      ...profile,
      ...morphologyGeometry(profile),
    })),
    null,
    2,
  ) + "\n",
);
console.log(
  `Exported six independent bodies, two boards and body anchors to ${folder}`,
);
