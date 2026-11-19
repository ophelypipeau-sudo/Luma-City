/** Display encodings only. Original ImageGen PNG sources are never overwritten. */
import { stat } from "node:fs/promises";
import sharp from "sharp";
import { FURNITURE_MODELS } from "../packages/domain/src/housing.ts";

let nativeBytes = 0, displayBytes = 0;
for (const source of [...FURNITURE_MODELS.map((m) => `public${m.image}`), "public/assets/housing/prune-v1/room-empty.png"]) {
  const display = source.replace(/\.png$/, ".webp");
  await sharp(source).resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100, effort: 5 }).toFile(display);
  if (!source.endsWith("room-empty.png"))
    await sharp(source).resize({ width: 256, height: 256, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 100, effort: 5 }).toFile(source.replace(/\.png$/, ".thumb.webp"));
  nativeBytes += (await stat(source)).size; displayBytes += (await stat(display)).size;
}
console.log({ nativeBytes, displayBytes, reduction: `${(100 * (1 - displayBytes / nativeBytes)).toFixed(1)}%` });
