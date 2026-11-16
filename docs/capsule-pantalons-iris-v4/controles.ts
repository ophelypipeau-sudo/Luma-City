import { readFileSync, writeFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { IRIS_PANTS_GARMENTS } from "../../apps/web/src/avatar/pants-capsule";
import { LayeredDoll } from "../../apps/web/src/avatar/LayeredDoll";
import { nativeRgba } from "../../scripts/lib/png-native";
import { rgbaPng } from "../../scripts/lib/png-rgba";
import { paintColorRegions } from "../../packages/domain/src/atelier-color";
import { pantLayers, pantLooks, type PantLook } from "../../tests/fixtures/IrisPantFit";

const folder = "docs/capsule-pantalons-iris-v4";
const styles = '<rect width="100%" height="100%" fill="#f1e8e8"/>';
const svg = (width: number, height: number, content: string) => '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'">'+content+'</svg>';
const image = (bytes: Uint8Array, x: number, y: number, width: number, height: number) =>
  `<image x="${x}" y="${y}" width="${width}" height="${height}" href="data:image/png;base64,${Buffer.from(bytes).toString("base64")}"/>`;
const label = (s: string, x: number, y: number, size = 17) =>
  `<text x="${x}" y="${y}" font-family="Segoe UI" font-size="${size}" fill="#332537">${s}</text>`;
const bg = (x: number, y: number, w: number, h: number, color: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
const bytes = (url: string) => readFileSync("public" + url);
const raster = (url: string) => nativeRgba(bytes(url)).pixels;
const png = (w: number, h: number, content: string, file: string) =>
  writeFileSync(`${folder}/${file}.png`, new Resvg(svg(w, h, styles + content)).render().asPng());
function crop(p: Uint8Array, width: number, [x, y, w, h]: readonly number[]) {
  const out = new Uint8Array(w * h * 4);
  for (let row = 0; row < h; row++) {
    const from = ((y + row) * width + x) * 4;
    out.set(p.subarray(from, from + w * 4), row * w * 4);
  }
  return rgbaPng(w, h, out);
}
const urls = new Map<string, string>();
function inline(url: string) {
  const prior = urls.get(url);
  if (prior) return prior;
  const data = "data:image/png;base64," + bytes(url).toString("base64");
  urls.set(url, data);
  return data;
}

const silhouette = [label("Détourage et teintes", 18, 35, 25)];
const combinations = [label("Essayage des dix modèles sur Iris", 18, 35, 25)];
const refits = [label("Raccords sur Iris avec Cerise et Piste", 18, 35, 25)];
const refittedNames = ["Sculpt", "Flow", "Chrome", "Veil"];
const looks = Object.keys(pantLooks) as PantLook[];
looks.forEach((name, j) => combinations.push(label(name[0].toUpperCase() + name.slice(1), 180 + 178 * j, 63)));
for (const [i, piece] of IRIS_PANTS_GARMENTS.entries()) {
  if (piece.art.kind !== "image" || !piece.art.colorMasks?.main) throw Error(piece.id);
  const art = piece.art, masks = art.colorMasks;
  const original = raster(art.front);
  const washed = [original, ...["#e6bdb5", "#232437"].map((color, j) => new Uint8Array(paintColorRegions(
    new Uint8ClampedArray(original), new Uint8ClampedArray(raster(masks.main!)),
    masks.detail ? new Uint8ClampedArray(raster(masks.detail)) : undefined,
    { ...masks, main: color, detail: j ? "#c9874c" : "#518c89" },
  )))];
  const x = 12 + (i % 2) * 487, y = 53 + Math.floor(i / 2) * 242;
  silhouette.push(label(piece.name, x, y + 16));
  ["#fff", "#201f23", "#547873", "#554856", "#ccdad3"].forEach((color, j) => {
    const bx = x + 96 * j;
    silhouette.push(bg(bx, y + 21, 93, 214, color));
    silhouette.push(image(crop(washed[Math.max(0, j - 2)], 887, piece.crop), bx + 3, y + 24, 87, 206));
  });
  const fy = 75 + 208*i;
  combinations.push(label(piece.name, 18, fy + 95));
  looks.forEach((look, j) => {
    const view = svg(480, 1024, renderToStaticMarkup(React.createElement(LayeredDoll, { layers: pantLayers(look, piece.id) })));
    const markup = view.replace(/href="(\/assets\/[^"]+)"/g, (_, url: string) => `href="${inline(url)}"`);
    const fitted = nativeRgba(new Resvg(markup).render().asPng()).pixels;
    const bx = 167 + j * 178;
    combinations.push(bg(bx, fy, 170, 198, ["#e4dbe5", "#2c2733", "#49635e"][j%3]));
    combinations.push(image(crop(fitted, 480, [90, 300, 300, 724]), bx+5, fy+2, 160, 194));
    const column = refittedNames.indexOf(piece.name);
    if (look === "baskets" && column >= 0) {
      const x = 12 + column * 212;
      refits.push(label(piece.name, x + 10, 65));
      refits.push(bg(x, 76, 204, 420, "#605060"));
      refits.push(image(crop(fitted, 480, [98, 367, 284, 630]), x + 2, 76, 200, 420));
      refits.push(bg(x, 505, 204, 140, "#605060"));
      refits.push(image(crop(fitted, 480, [125, 370, 230, 154]), x + 2, 505, 200, 140));
    }
  });
}
png(990, 1270, silhouette.join(""), "controle-couleurs");
png(1068, 2165, combinations.join(""), "controle-essayages");
png(864, 657, refits.join(""), "controle-raccords");
