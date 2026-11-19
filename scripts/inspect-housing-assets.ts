/** Read-only pixel inspection; PNGs stay at their generated native resolution. */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { FURNITURE_MODELS } from "../packages/domain/src/housing.ts";

const directory = "public/assets/housing/prune-v1";
const manifest: Record<string, unknown> = {};
for (const model of FURNITURE_MODELS) {
  const input = readFileSync(`public${model.image}`);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, x1 = 0, y0 = info.height, y1 = 0, transparent = 0, translucent = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const alpha = data[(y * info.width + x) * 4 + 3];
    if (alpha === 0) transparent++;
    if (alpha > 0 && alpha < 255) translucent++;
    if (alpha > 8) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  if (transparent < info.width * info.height * .03) throw new Error(`Fond non transparent : ${model.id}`);
  const left = Math.max(0, x0 - 3), top = Math.max(0, y0 - 3);
  const crop = [left, top, Math.min(info.width, x1 + 4) - left, Math.min(info.height, y1 + 4) - top];
  manifest[model.id] = { width: info.width, height: info.height, crop, transparent, translucent };
  console.log(model.id, `${info.width}×${info.height}`, "crop", crop.join(","));
}
writeFileSync(`${directory}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
