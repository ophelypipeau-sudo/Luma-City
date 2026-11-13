import { readFileSync, copyFileSync } from "node:fs";
import { pngPixels } from "../apps/server/src/atelier-images";
const records = JSON.parse(readFileSync("scripts/redraw-sources.json", "utf8"));
for (const [key, v] of Object.entries(records) as [
  string,
  { source: string },
][]) {
  copyFileSync(
    v.source,
    `public/assets/avatar/redrawn-v1/sources/${key}-front.png`,
  );
  const p = pngPixels(readFileSync(v.source));
  console.log(key, p.width, p.height);
}
