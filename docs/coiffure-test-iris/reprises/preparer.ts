import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { DOLL_PATTERN } from "../../../packages/domain/src/avatar-pattern";
import { nativeRgba } from "../../../scripts/lib/png-native";
import { rgbaPng } from "../../../scripts/lib/png-rgba";
import { removeOpaqueWhiteMatte } from "../../../scripts/lib/asset-edges";

const root = "docs/coiffure-test-iris/reprises";
const [w, h] = DOLL_PATTERN.canvas;
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw Error("Base Iris incorrecte");
const url = (p: Buffer) => "data:image/png;base64," + p.toString("base64");
const svg = (art: string, width: number, height: number) =>
  Buffer.from(
    new Resvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${art}</svg>`,
    )
      .render()
      .asPng(),
  );
const layer = (p: Buffer, y = 0) =>
  `<image y="${y}" width="${w}" height="${h}" href="${url(p)}"/>`;
const placements: [string, string, number, number, number, number?][] = [
  ["03", "Constellation", 443, 0.94, -15],
  ["07", "Méduse", 443, 0.63, 4, 155],
  ["08", "Mistral", 476, 0.55, -14],
  ["09", "Toupie", 476, 0.54, -22],
  ["10", "Rocaille", 476, 0.53, -11],
  ["11", "Cerf-volant", 443, 0.78, -1, 146],
  ["12", "Épi de mer", 443, 0.78, 0, 147],
  ["13", "Soufflet", 443, 0.78, -2, 151],
  ["14", "Volute", 443, 0.75, -70],
  ["15", "Éventail", 443, 0.74, -99],
  ["16", "Néon", 443, 0.95, 0, 146],
  ["17", "Lacet", 443, 0.75, 0, 145],
  ["18", "Rosace", 443, 0.72, -49, 147],
  ["19", "Mosaïque", 443, 0.77, -10],
];
const offset = 125;
const cuts = placements.map(([id, name, center, scale, shift, backFrom]) => {
  if (id === "16") {
    const source = nativeRgba(readFileSync(`${root}/sources/16-couettes-v2.png`));
    const cleaned = rgbaPng(
      source.width,
      source.height,
      removeOpaqueWhiteMatte(source.width, source.height, source.pixels).pixels,
    );
    const scale = 0.455;
    const transform = `translate(${443.5 - 512 * scale} ${offset + 23}) scale(${scale})`;
    const art = `<image width="${source.width}" height="${source.height}" href="${url(cleaned)}"/>`;
    // Take the roots and locks from the same painting so the grain flows through the temples.
    const frontCut = "M0 0H1024V222Q770 238 735 284Q704 342 706 408Q697 480 656 576Q614 675 645 761Q667 818 683 866Q690 905 684 938Q677 899 658 873Q651 831 625 766Q594 677 631 573Q676 463 678 406Q682 334 646 291Q586 230 512 224Q439 231 377 292Q341 339 342 409Q344 479 389 573Q425 677 396 765Q367 838 361 873Q344 910 339 938Q331 904 337 866Q350 820 374 758Q404 677 364 575Q320 479 312 407Q306 333 286 288Q247 242 0 222Z";
    const front = svg(
      `<g transform="${transform}"><defs><clipPath id="neon-front"><path d="${frontCut}"/></clipPath></defs>
      <g clip-path="url(#neon-front)">${art}</g></g>`,
      w,
      h,
    );
    const back = svg(
      `<defs><clipPath id="neon-nape">
      <path transform="translate(0 ${offset})" d="M352 148Q443 129 535 148L550 295L573 341H313L337 295Z"/>
      </clipPath></defs>
      <g clip-path="url(#neon-nape)"><g transform="translate(0 -237)"><g transform="${transform}">${art}</g></g></g>
      <g transform="${transform}">${art}</g>`,
      w,
      h,
    );
    return { id, name, front, back };
  }
  const source = nativeRgba(readFileSync(`${root}/sources/${id}.png`));
  // The generated eye fragments on these two sources are entirely inside
  // the face opening. Clear their native-coordinate bounds before placement.
  if (id === "13" || id === "17") {
    for (let y = 195; y <= 225; y++) {
      const row = y * source.width * 4;
      source.pixels.fill(0, row + 365 * 4, row + 522 * 4);
    }
  }
  const cleaned = rgbaPng(
    source.width,
    source.height,
    removeOpaqueWhiteMatte(source.width, source.height, source.pixels).pixels,
  );
  const art = `<image x="${443.5 - center * scale}" y="${offset + shift}" width="${source.width * scale}" height="${source.height * scale}" href="${url(cleaned)}"/>`;
  const pass = (back: boolean) => {
    const top = back ? offset + (backFrom ?? h) : 0;
    const end = back ? h : offset + (backFrom ?? h);
    return svg(
      `<defs><clipPath id="pass"><rect y="${top}" width="${w}" height="${Math.max(0, end - top)}"/></clipPath></defs><g clip-path="url(#pass)">${art}</g>`,
      w,
      h,
    );
  };
  return { id, name, front: pass(false), back: pass(true) };
});
const azimut = "docs/coiffure-test-iris/azimut";
cuts.push({
  id: "06",
  name: "Azimut",
  front: readFileSync(azimut + "/avant.png"),
  back: readFileSync(azimut + "/arriere.png"),
});
cuts.sort((a, b) => a.id.localeCompare(b.id));
mkdirSync(root + "/calques", { recursive: true });
for (const { id, front, back } of cuts) {
  writeFileSync(`${root}/calques/${id}-avant.png`, front);
  writeFileSync(`${root}/calques/${id}-arriere.png`, back);
}
const base = nativeRgba(body);
const dark = base.pixels.slice();
const clamp = (v: number) => Math.max(0, Math.min(1, v));
for (let i = 0; i < dark.length; i += 4) {
  const r = dark[i],
    g = dark[i + 1],
    b = dark[i + 2];
  const amount = clamp((r - g - 14) / 24) * clamp((g - b - 9) / 21);
  const x = (i / 4) % w;
  const y = Math.floor(i / 4 / w);
  const iris =
    Math.max(
      ...[401, 484].map((cx) =>
        clamp((1 - Math.hypot((x - cx) / 14, (y - 173) / 11)) * 3),
      ),
    ) *
    clamp((g - b - 8) / 23) *
    clamp((g - 25) / 30);
  const lips =
    clamp((1 - Math.hypot((x - 443) / 33, (y - 245) / 13)) * 3) *
    clamp((r - g - 28) / 15) *
    clamp((b - 0.65 * g) / 20);
  for (const [c, gain] of [0.66, 0.55, 0.48].entries())
    dark[i + c] = Math.round(
      dark[i + c] * (1 + (gain - 1) * amount * (1 - iris) * (1 - lips)),
    );
}
const alternate = rgbaPng(w, h, dark);
for (const [file, baseImage] of [
  ["sur-iris", body],
  ["peau-foncee", alternate],
  ["cheveux-seuls", null],
] as const) {
  const cells = cuts
    .map(({ name, front, back }, i) => {
      const x = (i % 5) * 240,
        y = Math.floor(i / 5) * 290;
      const bg = ["#eee1d8", "#241e2b", "#486d66"][i % 3];
      return `<rect x="${x}" y="${y}" width="240" height="290" fill="${bg}"/>
    <svg x="${x}" y="${y}" width="240" height="265" viewBox="197 -110 493 690">${layer(back, -offset)}${baseImage ? layer(baseImage) : ""}${layer(front, -offset)}</svg>
    <text x="${x + 120}" y="${y + 283}" fill="${i % 3 ? "#fff" : "#281e1e"}" font-family="sans-serif" font-size="16" text-anchor="middle">${name}</text>`;
    })
    .join("");
  writeFileSync(
    `${root}/${file}.png`,
    svg(cells, 1200, Math.ceil(cuts.length / 5) * 290),
  );
}

const neon = cuts.find(({ id }) => id === "16")!;
const neonPreview = ["#eee1d8", "#241e2b", "#486d66"].map((background, i) =>
  `<rect x="${i * 300}" width="300" height="370" fill="${background}"/>
   <svg x="${i * 300}" width="300" height="370" viewBox="190 -5 507 625">
   ${layer(neon.back, -offset)}${layer(i === 1 ? alternate : body)}${layer(neon.front, -offset)}</svg>`,
).join("");
writeFileSync(`${root}/neon-apercu.png`, svg(neonPreview, 900, 370));
