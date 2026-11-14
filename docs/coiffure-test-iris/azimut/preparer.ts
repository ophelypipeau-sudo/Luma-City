import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { DOLL_PATTERN } from "../../../packages/domain/src/avatar-pattern";

const root = "docs/coiffure-test-iris/azimut";
const [width, height] = DOLL_PATTERN.canvas;
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Base officielle d’Iris requise.");

const source = readFileSync(root + "/source.png");
const sourceWidth = source.readUInt32BE(16);
const sourceHeight = source.readUInt32BE(20);
const url = (png: Buffer) => "data:image/png;base64," + png.toString("base64");
const scale = 0.67;
const headroom = 125;
const render = (art: string, w: number, h: number) =>
  Buffer.from(new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${art}</svg>`).render().asPng());

function extract(center: number, outline: string) {
  return render(`<defs><clipPath id="part"><path d="${outline}"/></clipPath></defs>
    <g transform="translate(${443.5 - center * scale} ${headroom - 20}) scale(${scale})" clip-path="url(#part)">
      <image width="${sourceWidth}" height="${sourceHeight}" href="${url(source)}"/>
    </g>`, width, height);
}

// Follow the original painted ends of the two hime panels.
const front = extract(221, "M0 0H443V358H402Q370 382 326 391L306 369H133L115 320Q113 354 112 387Q73 380 40 357H0Z");
const back = extract(665, "M443 0H887V1774H443Z");
writeFileSync(root + "/avant.png", front);
writeFileSync(root + "/arriere.png", back);

const layer = (png: Buffer, top: number) =>
  `<image y="${top}" width="${width}" height="${height}" href="${url(png)}"/>`;
const panels = ["#eee1d8", "#241e2b", "#486d66"].map((color, i) =>
  [body, null].map((base, row) =>
    `<rect x="${i * 320}" y="${row * 380}" width="320" height="380" fill="${color}"/>
    <svg x="${i * 320}" y="${row * 380}" width="320" height="380" viewBox="215 -18 457 610">
      ${layer(back, -headroom)}${base ? layer(base, 0) : ""}${layer(front, -headroom)}
    </svg>`).join("")).join("");
writeFileSync(root + "/controle.png", render(panels, 960, 760));
