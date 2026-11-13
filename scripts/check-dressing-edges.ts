import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { nativeRgba } from "./lib/png-native";
import { removeWhiteMatte } from "./lib/asset-edges";
import { rgbaPng } from "./lib/png-rgba";

const apply = process.argv.includes("--apply");
const output = "docs/controle-contours-dressing";
type Source = { x?: number; y?: number; width: number; height: number };
const assets = new Map<string, { name: string; crop: readonly number[]; slot: string; source?: Source }>();
for (const piece of avatarCatalogSnapshot()) {
  if (piece.art.kind !== "image") continue;
  for (const url of [piece.art.front, piece.art.back]) {
    if (url?.startsWith("/assets/") && url.endsWith(".png") && !assets.has(url))
      assets.set(url, { name: piece.name, crop: piece.crop, slot: piece.slot, source: piece.art.source });
  }
}
const report: { url: string; name: string; corrected: number; crop: readonly number[]; source?: Source }[] = [];
mkdirSync(output, { recursive: true });
const selectedPaths = process.argv.slice(2).filter((arg) => arg.startsWith("/assets/"));
if (apply && !selectedPaths.length) throw new Error("Indiquer les PNG de la boutique à corriger.");
for (const [url, { name, crop, slot, source }] of assets) {
  const path = "public" + url;
  const bytes = readFileSync(path);
  let corrected = 0;
  if (slot !== "hair" && bytes[24] === 8 && bytes[25] === 6 && bytes[28] === 0) {
    const { width, height, pixels } = nativeRgba(bytes);
    const result = removeWhiteMatte(width, height, pixels);
    corrected = result.corrected;
    if (apply && selectedPaths.includes(url) && corrected > 0)
      writeFileSync(path, rgbaPng(width, height, result.pixels));
  }
  report.push({ url, name, corrected, crop, source });
}
const escape = (value: string) => value.replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const rows = report.sort((a, b) => b.corrected - a.corrected).map(({ url, name, crop, source = { width: 887, height: 1774 } }) =>
  `<section><h2>${escape(name)}</h2><div class="fonds">${["#f8f2e9", "#16131c", "#456ca0"].map((bg) =>
    `<svg aria-label="${escape(name)}" viewBox="${crop.join(" ")}" style="background:${bg}">
      <image x="${source.x ?? 0}" y="${source.y ?? 0}" width="${source.width}" height="${source.height}" href="../../public${escape(url)}"/></svg>`).join("")}</div></section>`).join("");
writeFileSync(`${output}/index.html`, `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Contrôle des contours du dressing</title>
<style>body{background:#292334;color:#fff3f5;font:16px system-ui;margin:24px}.items{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:14px}section{background:#3c3247;border-radius:10px;overflow:hidden}h2{font-size:14px;padding:0 10px}.fonds{display:grid;grid-template-columns:repeat(3,1fr)}svg{display:block;width:100%;height:140px}</style>
<h1>Contrôle des contours du dressing</h1><p>Chaque pièce sur fond clair, foncé et coloré.</p><div class="items">${rows}</div></html>`);
console.log(`${report.length} PNG examinés.`);
console.table(report.filter(({ corrected }) => corrected > 0).map(({ url, corrected }) => ({ url, corrected })));
