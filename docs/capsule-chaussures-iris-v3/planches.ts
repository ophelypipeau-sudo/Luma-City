import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { LayeredDoll } from "../../apps/web/src/avatar/LayeredDoll";
import { nativeRgba } from "../../scripts/lib/png-native";
import { rgbaPng } from "../../scripts/lib/png-rgba";
import { paintColorRegions } from "../../packages/domain/src/atelier-color";
import { previewShoes, shoeLayers, shoeLooks, type ShoeLook } from "../../tests/fixtures/IrisShoeFit";

const folder = "docs/capsule-chaussures-iris-v3";
const sources = new Map<string, string>();
function local(url: string) {
  let encoded = sources.get(url);
  if (!encoded) {
    encoded = "data:image/png;base64," + readFileSync(url.startsWith("/assets") ? "public" + url : "." + url).toString("base64");
    sources.set(url, encoded);
  }
  return encoded;
}
const toImage = (png: Uint8Array, x: number, y: number, w: number, h: number) =>
  `<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/png;base64,${Buffer.from(png).toString("base64")}"/>`;
function render(look: ShoeLook, id: string, viewBox: string) {
  const node = React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 480, height: 1024 },
    React.createElement(LayeredDoll, { layers: shoeLayers(look, id) }));
  const markup = renderToStaticMarkup(node).replace(/href="(\/(?:assets|docs)\/[^"]+)"/g, (_, url: string) => `href="${local(url)}"`);
  const raster = nativeRgba(new Resvg(markup).render().asPng());
  const [left, top, width, height] = viewBox.split(" ").map(Number);
  const crop = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const from = ((y + top) * raster.width + left) * 4;
    crop.set(raster.pixels.subarray(from, from + width * 4), y * width * 4);
  }
  return rgbaPng(width, height, crop);
}
function board(width: number, height: number, markup: string[], file: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#eee6e4"/>
  ${markup.join("")}</svg>`;
  writeFileSync(folder + "/" + file + ".png", new Resvg(svg, { font: { defaultFontFamily: "Segoe UI" } }).render().asPng());
}
const labels = [
  "Satin prune · escarpins sculpturaux", "Mesh pétrole · plateforme segmentée", "Cuir noir · bottines zippées",
  "Cuir bordeaux · bottes sous le genou", "Verni cerise · deux brides",
  "Cuir cognac · bottes western", "Satin nuit · sandales à brides", "Ivoire et indigo · basket basse",
  "Daim prune · cuissardes ajustées", "Métal irisé · plateformes",
];
const cards = ['<text x="32" y="54" font-size="36" fill="#2c1c30">Capsule chaussures · Iris</text>'];
const testRows = Object.entries(shoeLooks) as [ShoeLook, typeof shoeLooks[ShoeLook]][];
const combinations = ['<text x="25" y="44" font-size="27" fill="#2c1c30">Essais de superposition sur Iris de face</text>'];
const edges = ['<text x="24" y="38" font-size="24" fill="#2c1c30">Détourage des chaussures seules</text>'];
const orbit = ['<text x="24" y="45" font-size="29" fill="#2c1c30">Orbit</text>',
  '<rect x="20" y="64" width="298" height="279" rx="8" fill="#ddd9e1"/>',
  '<rect x="330" y="64" width="298" height="279" rx="8" fill="#27212f"/>'];
const palette = ['<text x="24" y="42" font-size="27" fill="#2c1c30">Teintes claires et foncées</text>'];

previewShoes.forEach((shoe, i) => {
  const x = 25 + (i % 5) * 328, y = 82 + Math.floor(i / 5) * 396;
  const crop = shoe.crop;
  const low = crop[1] > 1470;
  const view = low ? "136 828 205 195" : "138 554 204 467";
  const fitHeight = low ? 234 : 286;
  cards.push(`<rect x="${x}" y="${y}" width="310" height="374" rx="13" fill="#faf7f6"/>`);
  cards.push(`<rect x="${x + 9}" y="${y + 10}" width="292" height="294" rx="8" fill="#ddd9e1"/>`);
  cards.push(toImage(render("nues", shoe.id, view), x+20, y+298-fitHeight, 270, fitHeight));
  cards.push(`<text x="${x+17}" y="${y+338}" font-size="25" fill="#2c1c30">${shoe.name}</text>`);
  cards.push(`<text x="${x+17}" y="${y+360}" font-size="14" fill="#624c61">${labels[i]}</text>`);
  const rowY = 100 + 182 * i;
  combinations.push(`<text x="22" y="${rowY+69}" font-size="22" fill="#2c1c30">${shoe.name}</text>`);
  testRows.forEach(([look, { name }], j) => {
    const left = 169 + 180*j;
    if (i === 0) combinations.push(`<text x="${left+4}" y="80" font-size="13" fill="#2c1c30">${name}</text>`);
    combinations.push(`<rect x="${left}" y="${rowY}" width="168" height="170" fill="${j % 2 ? "#282130" : "#dcd7df"}"/>`);
    combinations.push(toImage(render(look, shoe.id, "139 465 202 559"), left+1, rowY+2, 166, 166));
  });
  if (shoe.art.kind !== "image") throw Error("Calque de chaussure absent.");
  const piece = readFileSync("public" + shoe.art.front);
  const cropped = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="125" height="164" viewBox="${crop.join(" ")}">
  <image width="887" height="1774" href="data:image/png;base64,${piece.toString("base64")}"/></svg>`).render().asPng();
  if (shoe.id === "fashion.iris-shoes-orbit") {
    orbit.push(toImage(render("nues", shoe.id, view), 29, 76, 280, 250));
    const detail = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="275" height="193" viewBox="${crop.join(" ")}">
    <image width="887" height="1774" href="data:image/png;base64,${piece.toString("base64")}"/></svg>`).render().asPng();
    orbit.push(toImage(detail, 341, 105, 275, 193));
  }
  const edgeX = 20 + (i % 2) * 430, edgeY = 58 + Math.floor(i / 2) * 190;
  edges.push(`<text x="${edgeX}" y="${edgeY+13}" font-size="14" fill="#2c1c30">${shoe.name}</text>`);
  ["#ffffff", "#242029", "#4a6865"].forEach((color, j) => {
    const bx = edgeX + 137 * j;
    edges.push(`<rect x="${bx}" y="${edgeY+20}" width="132" height="164" fill="${color}"/>`);
    edges.push(toImage(cropped, bx+4, edgeY+20, 125, 164));
  });
  const masks = shoe.art.colorMasks;
  if (!masks?.main) throw Error("Masque de couleur absent.");
  const original = nativeRgba(piece);
  const readMask = (url: string) => new Uint8ClampedArray(nativeRgba(readFileSync("public" + url)).pixels);
  const main = readMask(masks.main), detail = masks.detail ? readMask(masks.detail) : undefined;
  palette.push(`<text x="${edgeX}" y="${edgeY + 13}" font-size="14" fill="#2c1c30">${shoe.name}</text>`);
  [["#f2bfba", "#178f80", "#eee6e1"], ["#252448", "#e7904d", "#c4d5ce"]].forEach(([color, accent, bg], j) => {
    const boxX = edgeX + j * 205;
    const dyed = paintColorRegions(new Uint8ClampedArray(original.pixels), main, detail, { ...masks, main: color, detail: accent });
    const raster = rgbaPng(original.width, original.height, new Uint8Array(dyed.buffer));
    const sample = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="186" height="155" viewBox="${crop.join(" ")}">
    ${toImage(raster, 0, 0, 887, 1774)}</svg>`).render().asPng();
    palette.push(`<rect x="${boxX}" y="${edgeY + 20}" width="195" height="160" fill="${bg}"/>`);
    palette.push(toImage(sample, boxX + 4, edgeY + 22, 186, 155));
  });
});
board(1665, 870, cards, "planche");
board(1255, 1924, combinations, "compatibilite");
board(878, 1015, edges, "detourage");
board(648, 363, orbit, "orbit");
board(878, 1015, palette, "couleurs");
