import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { inspectPiece, pngPixels } from "../apps/server/src/atelier-images";
const root = "docs/atelier/spider-tee-v2";
const out = "public/assets/avatar/imports/spider-tee-v2";
mkdirSync(out, { recursive: true });
const source = readFileSync(`${root}/generated-shirt.png`);
// Only the cloth is calibrated. Body, face and hands remain byte-identical.
const scaleX = 415 / 607,
  scaleY = 350 / 623;
const x = 236 - 173 * scaleX,
  y = 330 - 374 * scaleY;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><image x="${x}" y="${y}" width="${953 * scaleX}" height="${1651 * scaleY}" preserveAspectRatio="none" href="data:image/png;base64,${source.toString("base64")}"/></svg>`;
writeFileSync(`${out}/front.png`, new Resvg(svg).render().asPng());
writeFileSync(`${root}/registration.svg`, svg);
const cloth = readFileSync(`${out}/front.png`),
  rgba = pngPixels(cloth).pixels;
const paths = ["", ""];
for (let y = 0; y < 1774; y++)
  for (let zone = 0; zone < 2; zone++) {
    let start = -1;
    for (let x = 0; x <= 887; x++) {
      const i = (y * 887 + x) * 4;
      const red = rgba[i] > rgba[i + 1] * 1.35 && rgba[i] > rgba[i + 2] * 1.25;
      const active = x < 887 && rgba[i + 3] > 10 && (zone === 0 ? red : !red);
      if (active && start < 0) start = x;
      if (!active && start >= 0) {
        paths[zone] += `M${start} ${y}h${x - start}v1h${start - x}Z`;
        start = -1;
      }
    }
  }
for (let i = 0; i < 2; i++)
  writeFileSync(
    `${out}/mask${i + 1}.png`,
    new Resvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><path fill="white" d="${paths[i]}"/></svg>`,
    )
      .render()
      .asPng(),
  );
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
const report = inspectPiece(cloth, body, { x: 0, y: 0, scaleX: 1, scaleY: 1 });
writeFileSync(`${root}/checks.json`, JSON.stringify(report, null, 2));
console.log(report);
for (const name of ["front", "mask1", "mask2"])
  copyFileSync(`${out}/${name}.png`, `${root}/${name}.png`);
if (report.some((r) => r.blocking && !r.ok)) process.exitCode = 1;
