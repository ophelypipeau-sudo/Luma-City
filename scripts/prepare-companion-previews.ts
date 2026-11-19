import sharp from "sharp";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { COMPANION_CATALOG } from "../packages/domain/src/companions.ts";

// Keep the original canvas and alpha so all existing placement coordinates remain valid.
const folder = "public/assets/companions-web/v1";
await mkdir(folder, { recursive: true });
let index = 0, originalBytes = 0, previewBytes = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (index < COMPANION_CATALOG.length) {
    const model = COMPANION_CATALOG[index++];
    const source = `public/assets/companions/${model.id}.png`;
    const input = await stat(source);
    originalBytes += input.size;
    for (const width of [320, 640]) {
      const output = `${folder}/${model.id}-${width}.webp`;
      const existing = await stat(output).catch(() => null);
      if (!existing || existing.mtimeMs < input.mtimeMs) {
        await sharp(source).resize({ width, withoutEnlargement: true })
          .webp({ quality: 84, alphaQuality: 100, effort: 4 }).toFile(output);
      }
      if (width === 320) {
        const bytes = (await stat(output)).size;
        previewBytes += bytes;
      }
    }
  }
}));
const result = { models: COMPANION_CATALOG.length, originalBytes, previewBytes,
  reduction: `${(100 * (1 - previewBytes / originalBytes)).toFixed(1)}%` };
await writeFile(`${folder}/report.json`, JSON.stringify(result, null, 2));
console.log(result);
