import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { Portrait } from "../apps/web/src/Avatar";
import { PunkGarment } from "../apps/web/src/avatar/PunkGarment";
import { PUNK_GARMENTS } from "../apps/web/src/avatar/punk-catalog";
import {
  PUNK_COLORS,
  PUNK_CUTS,
  PUNK_LAYERS,
  PUNK_SWATCHES,
  type PunkCut,
} from "../packages/domain/src/punk-pattern";
import { rgbaPng } from "./lib/png-rgba";

const root = "public/assets/avatar/punk-materials-v1";
const width = 887;
const height = 1774;
const black = "#000000";
const white = "#ffffff";
mkdirSync(root, { recursive: true });
const inlineImages = (svg: string) =>
  svg.replace(
    /href="(\/assets\/[^"]+)"/g,
    (_, path) =>
      `href="data:image/png;base64,${readFileSync("public" + path).toString("base64")}"`,
  );

function draw(
  cut: PunkCut,
  pass: "front" | "back",
  color?: string,
  detailColor?: string,
) {
  const piece = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height}>
      <PunkGarment
        cut={cut}
        pass={pass}
        color={color}
        detailColor={detailColor}
      />
    </svg>,
  );
  return new Resvg(inlineImages(piece)).render();
}

// Probe one authored dye at a time. RGB deltas in premultiplied sRGB give
// its contribution after the original ink, weave and light are composited.
function writeMask(name: string, finish: Uint8Array, probe: Uint8Array) {
  const mask = new Uint8Array(finish.length);
  let visiblePixels = 0;
  for (let i = 0; i < finish.length; i += 4) {
    if (finish[i + 3] !== probe[i + 3])
      throw Error(`Alpha modifié dans ${name}`);
    const gain = Math.round(
      (probe[i] -
        finish[i] +
        probe[i + 1] -
        finish[i + 1] +
        probe[i + 2] -
        finish[i + 2]) /
        3,
    );
    if (gain <= 0) continue;
    mask[i] = mask[i + 1] = mask[i + 2] = 255;
    mask[i + 3] = gain;
    if (gain > 16) visiblePixels++;
  }
  if (visiblePixels < 100) throw Error(`Masque vide ou incomplet : ${name}`);
  writeFileSync(`${root}/${name}`, rgbaPng(width, height, mask));
  return name;
}

const pieces = PUNK_CUTS.flatMap((cut, index) => {
  const hasDetail = !!PUNK_GARMENTS[index].secondaryColor;
  const passes: ("front" | "back")[] =
    cut === "punk-waves" ? ["front", "back"] : ["front"];
  return passes.map((pass) => {
    const key = `${cut}-${pass}`;
    const reference = `${key}-reference.png`;
    const finish = `${key}-finish.png`;
    const detail = hasDetail && pass === "front";
    const finishRender = draw(cut, pass, black, detail ? black : undefined);
    const fixed = finishRender.pixels;
    writeFileSync(`${root}/${reference}`, draw(cut, pass).asPng());
    writeFileSync(`${root}/${finish}`, finishRender.asPng());
    return {
      id: PUNK_GARMENTS[index].id,
      pass,
      reference,
      finish,
      main: {
        color: PUNK_COLORS[cut].main,
        mask: writeMask(
          `${key}-main.png`,
          fixed,
          draw(cut, pass, white, detail ? black : undefined).pixels,
        ),
      },
      ...(detail
        ? {
            detail: {
              color: PUNK_COLORS[cut].detail,
              mask: writeMask(
                `${key}-detail.png`,
                fixed,
                draw(cut, pass, black, white).pixels,
              ),
            },
          }
        : {}),
    };
  });
});
writeFileSync(
  `${root}/manifest.json`,
  JSON.stringify(
    {
      version: 1,
      canvas: [width, height],
      colorSpace: "premultiplied-srgb",
      composition:
        "RGB = finish + alpha(main) * main + alpha(detail) * detail. Alpha = reference alpha.",
      pieces,
    },
    null,
    2,
  ) + "\n",
);

const variants = [{ name: "Original", hex: undefined }, ...PUNK_SWATCHES];
const cells = variants
  .map(({ name, hex }, index) => {
    const layers = hex
      ? {
          ...PUNK_LAYERS,
          colors: {
            [PUNK_LAYERS.top]: hex,
            [PUNK_LAYERS.bottom]: hex,
            [PUNK_LAYERS.tie]: hex,
          },
        }
      : PUNK_LAYERS;
    const figure = renderToStaticMarkup(
      <Portrait id="iris" fullBody pose="front" layers={layers} />,
      { identifierPrefix: `dye-${index}-` },
    )
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "");
    const x = 10 + index * 190;
    return `<svg x="${x}" y="80" width="178" height="400" viewBox="0 0 480 1024">${figure}</svg><text x="${x + 89}" y="511" text-anchor="middle">${name}</text>`;
  })
  .join("");
const board = inlineImages(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1150" height="545"><rect width="1150" height="545" fill="#392846"/><g fill="#fff1f9" font-family="Arial" font-size="18"><text x="30" y="46" font-size="27">Éclipse rose · nuancier de la tenue</text>${cells}</g></svg>`,
);
writeFileSync(`${root}/nuancier.png`, new Resvg(board).render().asPng());
