import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images.ts";
import { rgbaPng } from "./lib/png-rgba.ts";
import { DOLL_PATTERN, torsoBounds } from "../packages/domain/src/avatar-pattern.ts";
import { measureFabricTone } from "../packages/domain/src/atelier-color.ts";

const docs = "docs/capsule-jupes-shorts-accessoires";
const output = "public/assets/avatar/capsule-ville-v2";
const [width, height] = DOLL_PATTERN.canvas;
const groups = [
  {
    file: "shorts", prefix: "short",
    names: ["Sillage","Indigo brut","Patch bleu","Lierre","Pétale","Riviera","Sienne","Minéral","Sprint","Cendre"],
    outlines: [
      "M165 134Q220 150 268 134L278 157Q303 191 310 250L319 354Q283 374 222 367L216 253L209 365Q156 376 112 354L121 245Q128 191 155 158Z",
      "M166 138Q220 149 261 137L270 161Q292 188 300 231L313 349Q275 371 218 364L214 264L206 362Q148 370 110 351L121 232Q130 188 158 161Z",
      "M143 165L221 185L271 164L279 185Q301 214 313 327Q269 351 215 344L209 268L201 344Q143 347 101 328Q111 264 120 217Z",
      "M157 135Q208 150 254 136L265 163Q290 191 296 249L307 290L295 298L291 363Q258 378 210 373L204 264L197 372Q151 378 117 364L110 298L102 291L114 251Q118 199 146 161Z",
      "M153 143Q207 154 259 143L266 164Q299 213 307 288Q303 294 292 282Q289 304 275 296Q258 312 246 299Q226 315 213 295Q202 316 186 301Q170 310 160 298Q143 309 134 290Q120 298 114 284L126 224Q131 194 145 165Z",
      "M153 125Q174 112 197 124Q224 126 248 119Q270 116 278 126L266 151Q303 190 319 315Q270 337 221 331L217 271L211 331Q152 338 109 315Q122 203 163 153Z",
      "M155 144Q216 160 263 144L271 165Q294 196 311 291Q276 310 215 305L211 265L205 304Q147 307 110 289Q125 199 147 165Z",
      "M153 138Q205 154 262 138L269 161Q299 208 308 298Q272 317 213 313L208 275L203 313Q148 319 107 298L117 227Q126 186 146 160Z",
      "M160 138Q209 153 268 139L276 162Q307 214 314 261Q313 283 282 293Q243 302 213 298L211 267L207 299Q159 303 122 282Q103 270 112 250Q127 197 151 162Z",
      "M149 139Q209 151 258 139L268 164Q298 209 306 294Q265 317 210 309L207 271L203 309Q145 314 105 296Q120 206 143 162Z",
    ],
    tops: [134,135,162,135,143,119,144,138,138,139],
    centers: [216,214,209,204,212,217,211,208,211,207],
    scales: [1.74,1.71,1.67,1.77,1.76,1.76,1.78,1.78,1.76,1.77],
    waist: [657,659,701,657,659,639,665,659,659,658],
  },
  {
    file: "jupes", prefix: "skirt",
    names: ["Aube","Tulle noir","Irisée","Grenat","Argile","Graphite","Rosée","Café","Marine","Verveine"],
    outlines: [
      "M193 79Q219 85 244 79L251 97Q268 128 276 175L299 298Q265 318 227 314L219 198L211 314Q167 314 140 297L159 199Q168 133 187 96Z",
      "M191 78Q215 82 240 78L244 93Q261 117 276 167Q219 190 156 166Q166 130 186 94Z",
      "M184 75Q210 83 239 75L244 91Q258 115 256 152L251 213Q253 258 273 297Q260 308 240 306Q221 315 204 308Q179 310 166 300L146 290Q170 258 171 211L165 153Q160 120 179 92Z",
      "M186 78Q208 86 237 79L244 94Q260 120 263 170Q244 178 213 172Q188 190 164 193L164 150Q166 115 180 94Z",
      "M182 77Q208 84 232 77L239 94Q253 119 253 158L257 302Q210 319 163 303L161 177Q158 133 176 94Z",
      "M197 69Q219 76 241 69L246 83Q268 111 262 161Q252 214 252 283Q219 294 184 280L180 215Q176 185 175 154Q172 113 193 85Z",
      "M194 70Q217 75 242 69L245 83Q263 103 281 145L273 151L299 216L289 222L307 272Q280 296 221 299Q162 295 129 277L145 226L134 219L159 156L151 147Q167 107 189 83Z",
      "M184 68Q209 75 234 67L240 83Q256 104 255 136L259 265Q224 297 177 304L180 218Q170 169 166 138Q162 104 180 84Z",
      "M190 75Q213 80 239 75L244 88Q259 113 273 162Q216 186 154 164Q169 118 185 91Z",
      "M188 69Q211 76 236 69L241 85Q256 113 263 155L286 294Q258 313 211 311Q162 310 130 294L153 154Q162 107 182 86Z",
    ],
    tops: [79,78,75,78,77,69,69,67,75,69],
    centers: [219,216,211,209,208,219,217,210,214,212],
    scales: [3.95,4.03,3.95,4.16,4.03,4.35,4.18,4.05,4.02,4.13],
    waist: [651,648,641,648,649,634,634,634,648,635],
  },
];

      const detailPoints: Record<string, number[][]> = {
        "short-01": [[224,155,7]], "short-02": [[215,154,7],[147,171,4],[245,164,4]],
        "short-03": [[253,186,7]], "short-04": [[209,158,7],[110,286,5],[299,286,5]],
        "short-07": [[217,162,7]], "short-10": [[206,158,14]],
        "skirt-01": [[221,89,5]], "skirt-04": [[241,101,10]],
        "skirt-05": [[212,87,6]], "skirt-10": [77,97,122,148,176,203,232].map(y => [213,y,5]),
      };
mkdirSync(output, { recursive: true });
const pieces = groups.flatMap(group => {
  const source = readFileSync(`${docs}/validation-${group.file}-v2.png`).toString("base64");
  const rowX = group.file === "shorts" ? [0,401,800,1196,1592] : [0,397,793,1189,1586];
  return group.names.map((name, index) => {
    const id = group.prefix + "-" + String(index + 1).padStart(2, "0");
    const scale = group.scales[index];
    const top = group.waist[index] + (id === "short-03" ? 0 : 28);
    const scaleX = scale * (group.prefix === "short" ? 1.13 : 1.08);
    const [left, right] = torsoBounds(top);
    const x = (left + right) / 2 - group.centers[index] * scaleX;
    const y = top - group.tops[index] * scale;
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><clipPath id="outline"><path d="${group.outlines[index]}"/></clipPath></defs><g transform="translate(${x} ${y}) scale(${scaleX} ${scale})" clip-path="url(#outline)"><image x="${-rowX[index % 5]}" y="${index < 5 ? 0 : -397}" width="1983" height="793" href="data:image/png;base64,${source}"/></g></svg>`;
    const rendered = Buffer.from(new Resvg(xml).render().asPng());
        const { pixels: original } = pngPixels(rendered);
    const pixels = Uint8Array.from(original);
    // Match the waist and hips to the native body while leaving the hem alone.
    for (let py = 690; py < 875; py++) {
      const row = py * width * 4;
      let first = 230, last = 660;
      while (first < 444 && original[row + first * 4 + 3] < 200) first++;
      while (last > 444 && original[row + last * 4 + 3] < 200) last--;
      if (last - first < 160) continue;
      const [bodyLeft, bodyRight] = torsoBounds(py, 4);
      const falloff = Math.min(1, (py - 690) / 8, (875 - py) / 45);
      const nextLeft = Math.floor(first - Math.max(0, first - bodyLeft) * falloff);
      const nextRight = Math.ceil(last + Math.max(0, bodyRight - last) * falloff);
      if (nextLeft === first && nextRight === last) continue;
      for (let px = nextLeft - 2; px <= nextRight + 2; px++) {
        const sx = px < 444
          ? 444 + (px - 444) * (444 - first) / (444 - nextLeft)
          : 444 + (px - 444) * (last - 444) / (nextRight - 444);
        const base = Math.floor(sx), fraction = sx - base;
        const q = row + px * 4, a = row + base * 4;
        for (let channel = 0; channel < 4; channel++)
          pixels[q + channel] = Math.round(original[a + channel] * (1 - fraction) + original[a + channel + 4] * fraction);
      }
    }
    const contour = Uint8Array.from(pixels);
    const art = new Uint8Array(pixels.length);
    // A narrow edge cleanup removes the studio matte left by the painted outline.
    for (let py = top - 24; py < height - 4; py++) for (let px = 4; px < width - 4; px++) {
      const p = (py * width + px) * 4;
      const alpha = pixels[p + 3];
      if (!alpha) continue;
      const color = Array.from(pixels.subarray(p, p + 3), value => Math.round(value * 255 / alpha));
      const [r,g,b] = color;
      if (id === "skirt-08" && r-g > 38 && g-b > 24 && r > 145) continue;
      if (id === "skirt-07" && py > 1250) {
        // The last organza tier was painted over the legs. Recover the
        // fabric tint and alpha so Iris's own legs show through in the game.
        const blend = Math.max(0, Math.min(1, (py - 1250) / 105));
        const warmSkin = blend * Math.max(0, Math.min(1, (g - b - 8) / 32));
        color[1] = Math.round(g - warmSkin * 13);
        color[2] = Math.round(b + warmSkin * 18);
        art.set([...color, Math.round(alpha * (1 - .24 * blend))], p);
        continue;
      }
      const matte = r > 65 && r < 135 && g > 49 && g < 109 && b > 57 && b < 120
        && r - g >= 5 && r - g <= 27 && b - g >= 0 && b - g <= 16;
      if (matte && !["short-08","short-10","skirt-04","skirt-06"].includes(id)) {
        let boundary = false;
        for (let d = 1; d <= 7 && !boundary; d++)
          boundary = [p - d * 4, p + d * 4, p - d * width * 4, p + d * width * 4]
            .some(q => contour[q + 3] < 24);
        if (boundary) { pixels.fill(0,p,p+4); continue; }
      }
      art.set([...color,alpha],p);
    }
    const mask = new Uint8Array(pixels.length), fixed = new Uint8Array(pixels.length), coverage = new Uint8Array(pixels.length);
    const waist = Array<number>(width).fill(0);
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let py = top - 18; py < height; py++) for (let px = 0; px < width; px++) {
      const p = (py * width + px) * 4;
      const alpha = pixels[p + 3];
      if (!alpha) continue;
      minX = Math.min(minX, px); minY = Math.min(minY, py);
      maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
      if (alpha >= 224 && !(id === "skirt-07" && py > 1290)) { coverage[p + 3] = 255; if (!waist[px]) waist[px] = py; }
      const [r,g,b] = pixels.subarray(p, p + 3);
      const gold = r > 115 && r - g > 10 && g - b > 18;
      const piping = id === "short-09" && r > 125 && g > 110 && b > 83;
            const localX = (px - x) / scaleX, localY = (py - y) / scale;
      const hardware = (detailPoints[id] ?? []).some(([cx, cy, radius]) =>
        Math.hypot(localX - cx, localY - cy) <= radius && (gold || (id === "short-10" && r > 130)),
      );
      (hardware || piping ? fixed : mask).set([255,255,255,255], p);
    }
    const tone = measureFabricTone(pixels, mask);
    if (!tone || maxY < top + 120) throw new Error("Calque incomplet : " + id);
    const band = waist.flatMap((py, px) => py && py <= minY + 28 ? [[px, py]] : []).filter((_, i) => i % 4 === 0);
    const tuckedTopRegion = `M0 0H887V${band.at(-1)![1]}L${[...band].reverse().map(point => point.join(" ")).join("L")}L0 ${band[0][1]}Z`;
    writeFileSync(`${output}/${id}.png`, rgbaPng(width,height,art));
    for (const [suffix,data] of [["mask",mask],["protected",fixed],["coverage",coverage]] as const)
      writeFileSync(`${output}/${id}-${suffix}.png`, rgbaPng(width,height,data));
    return { id,name,price:750,crop:[minX-3,minY-3,maxX-minX+7,maxY-minY+7],tone,tuckedTopRegion };
  });
});
writeFileSync(output + "/index.json", JSON.stringify({pattern:DOLL_PATTERN.id,bodySha256:DOLL_PATTERN.bodySha256,pieces},null,2)+"\n");
