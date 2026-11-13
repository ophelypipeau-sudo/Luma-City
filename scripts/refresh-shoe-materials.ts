import { readFileSync, writeFileSync } from "node:fs";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";
import { buildShoeMaterial, type ShoeMaterialId } from "./lib/shoe-material-regions";

const root = "public/assets/avatar/capsule-chaussures-v1";
const index = `${root}/index.json`;
const manifest = JSON.parse(readFileSync(index, "utf8")) as {
  pieces: { id: ShoeMaterialId; tone: ReturnType<typeof buildShoeMaterial>["tone"] }[];
};
for (const piece of manifest.pieces) {
  const prefix = `${root}/${piece.id}`;
  const { width, height, pixels } = pngPixels(readFileSync(`${prefix}.png`));
  if (width !== 887 || height !== 1774) throw new Error("Canevas invalide : " + piece.id);
  const { main, fixed, tone } = buildShoeMaterial(piece.id, pixels);
  piece.tone = tone;
  writeFileSync(`${prefix}-mask.png`, rgbaPng(width, height, main));
  writeFileSync(`${prefix}-protected.png`, rgbaPng(width, height, fixed));
}
writeFileSync(index, JSON.stringify(manifest, null, 2) + "\n");
