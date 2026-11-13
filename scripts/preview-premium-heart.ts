import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { paintColorRegions } from "../packages/domain/src/atelier-color";
import { rgbaPng } from "./lib/png-rgba";
import manifest from "../docs/capsule-premium-v1/calques/index.json";

const root = "docs/capsule-premium-v1";
const heart = root + "/coeur/";
const assets = "public/assets/avatar/";
const { pieces } = manifest;
const base64 = (file: string) => readFileSync(file).toString("base64");
const layer = (data: string, id?: string) =>
  `<image ${id ? `id="${id}"` : ""} width="887" height="1774" href="data:image/png;base64,${data}"/>`;
const use = (id: string) => `<use href="#${id}"/>`;
const files = {
  face: root + "/calques/atelier-face.png",
  hip: root + "/calques/atelier-hanche.png",
  heart: heart + "iris.png",
  hand: root + "/calques/atelier-main-hanche.png",
  pants: assets + "prune-fumee-v1/pantalon.png",
  bare: heart + "devant-bare.png",
  right: heart + "devant-right.png",
  both: heart + "devant-both.png",
};
const defs = Object.entries(files).map(([id, file]) => layer(base64(file), id)).join("");
const read = (file: string) => new Uint8ClampedArray(pngPixels(readFileSync(file)).pixels);
const nativeArms = read(assets + "poses/redraw-v4/heart-arms.png");
const nativeHands = read(assets + "poses/canonical-hands-v1/heart-hands.png");
const names = ["Velvet", "Venus", "Éclat", "Minuit", "Rosalie", "Nova", "Ambre", "Séraphine", "Alba"];
function checkCuffs(id: string, art: Uint8ClampedArray) {
  const sides = id === "01-velvet" ? ["right"] : id === "05-rosalie" ? ["left", "right"] : [];
  for (const side of sides) {
    let arm = 0, covered = 0, underlap = 0;
    for (let y = 441; y < 642; y++)
      for (let x = 208; x < 679; x++) {
        const inside = side === "left" ? x : 887 - x;
        const i = (y * 887 + x) * 4 + 3;
        if (y >= 490 && inside < 312 && nativeArms[i] > 225) {
          arm++;
          if (art[i] > 210) covered++;
        }
        if (y < 474 && inside >= 304 && inside < 365 && nativeHands[i] > 225 && art[i] > 220)
          underlap++;
      }
    if (!arm || covered / arm < .99 || underlap < 950)
      throw new Error(id + " · raccord manche–poignet " + side + " incomplet");
  }
}
for (const [name, color] of [["original", undefined], ["ivoire", "#f2e8d8"], ["prune", "#462c55"]] as const) {
  if (process.argv[2] && process.argv[2] !== name) continue;
  const blocks = pieces.map(({ id, mainBase, mainTone, poses }, i) => {
    const title = names[i];
    const panels = (["front", "hand-on-hip", "heart-hands"] as const).map((pose, p) => {
      const isHeart = p === 2;
      const data = poses[pose === "heart-hands" ? "front" : pose];
      const stem = heart + id + "/heart-hands";
      const original = read(isHeart ? stem + ".png" : root + "/calques/" + data.art);
      if (isHeart) checkCuffs(id, original);
      const mask = read(isHeart ? stem + "-tissu.png" : root + "/calques/" + data.main);
      const keep = read(isHeart ? stem + "-protections.png" : root + "/calques/" + data.protected);
      const dyed = paintColorRegions(original.slice(), mask, undefined, {
        main: color, mainBase, mainTone, detailBase: "#ffffff", shading: "material",
      });
      for (let k = 0; k < original.length; k += 4) {
        if (dyed[k + 3] !== original[k + 3] ||
            (original[k + 3] > 0) !== (mask[k + 3] > 0 || keep[k + 3] > 0) ||
            (keep[k + 3] && (mask[k + 3] || dyed[k] !== original[k] ||
              dyed[k + 1] !== original[k + 1] || dyed[k + 2] !== original[k + 2])))
          throw new Error(id + " · " + pose + " · masque invalide");
      }
      const fabric = layer(rgbaPng(887, 1774, Uint8Array.from(dyed)).toString("base64"));
      const foreground = id === "01-velvet" ? "right" : id === "05-rosalie" ? "both" : "bare";
      return `<svg x="${p * 315}" y="28" width="311" height="290" viewBox="103 211 680 634">${use(["face", "hip", "heart"][p])}${use("pants")}${fabric}${p === 1 ? use("hand") : isHeart ? use(foreground) : ""}</svg>`;
    }).join("");
    return `<g transform="translate(0 ${43 + 320 * i})"><rect width="945" height="316" rx="8" fill="#48374f"/><text x="15" y="23" fill="#fff" font-size="18">${id.slice(0, 2)} · ${title}</text>${panels}</g>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="945" height="2925" font-family="Arial"><defs>${defs}</defs><rect width="945" height="2925" fill="#34273c"/><text x="16" y="27" fill="#fff" font-size="17">Face</text><text x="331" y="27" fill="#fff" font-size="17">Main sur la hanche</text><text x="646" y="27" fill="#fff" font-size="17">Mains en cœur · ${name}</text>${blocks}</svg>`;
  const board = new Resvg(svg).render().asPng();
  writeFileSync(heart + "planche-" + name + ".png", board);
  const crops = names.map((title, i) => {
    const x = (i % 3) * 292, y = Math.floor(i / 3) * 244;
    return `<svg x="${x}" y="${y}" width="292" height="244" viewBox="640 ${63 + i * 320} 292 244"><use href="#board"/></svg><text x="${x + 10}" y="${y + 22}" fill="white" font-size="14">${title}</text>`;
  }).join("");
  const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="876" height="732" font-family="Arial"><defs><image id="board" width="945" height="2925" href="data:image/png;base64,${board.toString("base64")}"/></defs>${crops}</svg>`;
  writeFileSync(heart + "apercu-" + name + ".png", new Resvg(preview).render().asPng());
}
