import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { paintColorRegions } from "../packages/domain/src/atelier-color";
import { rgbaPng } from "./lib/png-rgba";
const root = "docs/capsule-premium-v1";
const checkOnly = process.argv.includes("--check");
const selectedMode = process.argv
  .find((arg) => arg.startsWith("--mode="))
  ?.slice(7);
const { pieces } = JSON.parse(
  readFileSync(root + "/calques/index.json", "utf8"),
);
const b64 = (p: string) => readFileSync(p).toString("base64");
const A = "public/assets/avatar/";
const handPath = root + "/calques/atelier-main-hanche.png";
const [pants, shoes] = [
  "prune-fumee-v1/pantalon.png",
  "prune-fumee-v1/escarpins.png",
].map((p) => b64(A + p));
const img = (p: string, attributes = "") =>
  `<image width="887" height="1774" href="data:image/png;base64,${p}" ${attributes}/>`;
const use = (p: string, attributes = "") => `<use href="#${p}" ${attributes}/>`;
const plates = [
  ["body", b64(root + "/calques/atelier-face.png")],
  ["hip", b64(root + "/calques/atelier-hanche.png")],
  ["hand", b64(handPath)],
  ["pants", pants],
  ["shoes", shoes],
]
  .map(([id, p]) => img(p, `id="${id}"`))
  .join("");
const nativeArm = pngPixels(
  readFileSync(A + "poses/hand-on-hip-v3/bare-arm.png"),
).pixels;
const nativeHand = pngPixels(
  readFileSync(handPath),
).pixels;
const modes = [
  ["original", "Original", undefined],
  ["sauge", "Sauge", "#487c72"],
  ["ivoire", "Ivoire", "#f2e8d8"],
  ["prune", "Prune", "#462c55"],
] as const;
if (selectedMode && !modes.some(([mode]) => mode === selectedMode))
  throw new Error("Teinte de contrôle inconnue : " + selectedMode);
mkdirSync(root + "/controles", { recursive: true });
const layers = new Map<string, Uint8ClampedArray>();
const read = (path: string) => {
  let pixels = layers.get(path);
  if (!pixels) {
    pixels = new Uint8ClampedArray(
      pngPixels(readFileSync(root + "/calques/" + path)).pixels,
    );
    if (checkOnly) layers.set(path, pixels);
  }
  return pixels;
};
for (const [mode, label, color] of modes) {
  if (selectedMode && selectedMode !== mode) continue;
  let content = "",
    wrists = "",
    fitting = "";
  for (const [n, c] of pieces.entries()) {
    const x = (n % 5) * 420,
      y = Math.floor(n / 5) * 283;
    content += `<g transform="translate(${x} ${y})"><text x="10" y="24" fill="white" font-size="18">${c.id} · ${label}</text>`;
    for (const [i, pose] of ["front", "hand-on-hip"].entries()) {
      const paths = c.poses[pose];
      const original = read(paths.art),
        alpha = read(paths.main),
        keep = read(paths.protected);
      if (mode === "original" && i && (n === 0 || n === 4)) {
        let area = 0,
          covered = 0,
          underlap = 0;
        for (let y = 630; y <= 713; y++)
          for (let x = 601; x <= 745; x++) {
            const p = (y * 887 + x) * 4 + 3;
            if (y <= 675 && nativeArm[p] > 160) {
              area++;
              if (original[p] > 160) covered++;
            }
            if (y >= 670 && nativeHand[p] > 160 && original[p] > 160)
              underlap++;
          }
        if (covered / area < 0.98 || underlap < 100)
          throw new Error(c.id + " : raccord manche–main incomplet");
      }
      const dyed = paintColorRegions(original.slice(), alpha, undefined, {
        main: color,
        mainBase: c.mainBase,
        detailBase: "#ffffff",
        mainTone: c.mainTone,
        shading: "material",
      });
      for (let k = 0; k < dyed.length; k += 4) {
        if (
          dyed[k + 3] !== original[k + 3] ||
          (keep[k + 3] &&
            (!original[k + 3] ||
              alpha[k + 3] ||
              dyed[k] !== original[k] ||
              dyed[k + 1] !== original[k + 1] ||
              dyed[k + 2] !== original[k + 2])) ||
          original[k + 3] > 0 !== (alpha[k + 3] > 0 || keep[k + 3] > 0)
        )
          throw new Error(
            c.id + " " + pose + " : alpha ou protections incohérents",
          );
      }
      if (checkOnly) continue;
      const texture = rgbaPng(
        887,
        1774,
        new Uint8Array(dyed.buffer, dyed.byteOffset, dyed.byteLength),
      ).toString("base64");
      const drawing = `${use(i ? "hip" : "body")}${use("shoes")}${use("pants")}${img(texture)}${i ? use("hand") : ""}`;
      content += `<svg x="${6 + 207 * i}" y="35" width="201" height="234" viewBox="80 195 725 830" preserveAspectRatio="xMidYMin meet">${drawing}</svg>`;
      if (i && (n === 0 || n === 4))
        wrists += `<text x="${n === 0 ? 20 : 500}" y="27" font-size="21" fill="white">${c.id} · ${label}</text><svg x="${n === 0 ? 10 : 490}" y="40" width="470" height="520" viewBox="450 325 355 425">${drawing}</svg>`;
      const focus = [3, 4, 5, 7].indexOf(n);
      if (mode === "original" && focus !== -1) {
        const x = ((focus % 2) * 2 + i) * 345,
          y = Math.floor(focus / 2) * 420;
        fitting += `<text x="${x + 8}" y="${y + 19}" font-size="17" fill="white">${c.id} · ${i ? "hanche" : "face"}</text><svg x="${x}" y="${y + 25}" width="344" height="390" viewBox="194 245 590 620">${drawing}</svg>`;
      }
    }
    content += "</g>";
  }
  if (checkOnly) continue;
  const draw = (w: number, h: number, views: string) =>
    new Resvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#3b3045"/><defs>${plates}</defs><g font-family="Arial">${views}</g></svg>`,
    )
      .render()
      .asPng();
  writeFileSync(root + "/controles/" + mode + ".png", draw(2100, 566, content));
  if (mode === "original" || mode === "ivoire")
    writeFileSync(
      root + "/controles/poignets-" + mode + ".png",
      draw(970, 570, wrists),
    );
  if (mode === "original")
    writeFileSync(root + "/controles/contours.png", draw(1380, 840, fitting));
}
console.log(
  `${pieces.length * 2} calques contrôlés (${selectedMode ?? "4 teintes"}) : alpha, protections et raccords des manches longues.`,
);
