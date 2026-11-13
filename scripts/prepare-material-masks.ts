import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";
import {Resvg} from '@resvg/resvg-js';
import { AVATAR_GARMENTS } from "../apps/web/src/avatar/catalog";
import { BURGUNDY_GARMENTS } from "../apps/web/src/avatar/burgundy";
import { LEOPARD_GARMENTS } from "../apps/web/src/avatar/leopard";
const out = "public/assets/avatar/materials-v1";
mkdirSync(out, { recursive: true });
const map: Record<string, unknown> = {};
const lum = (r: number, g: number, b: number) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;
for (const piece of [
  ...AVATAR_GARMENTS,
  ...BURGUNDY_GARMENTS,
  ...LEOPARD_GARMENTS,
]) {
  if (piece.art.kind !== "image") continue;
  const art = piece.art,
    id = piece.id,
    name = id.replace("fashion.", "");
  const {
    width: w,
    height: h,
    pixels: p,
  } = pngPixels(readFileSync("public" + art.front));
  const oldMain = art.colorMasks
    ? pngPixels(readFileSync("public" + art.colorMasks.main)).pixels
    : undefined;
  const oldDetail = art.colorMasks?.detail
    ? pngPixels(readFileSync("public" + art.colorMasks.detail)).pixels
    : undefined;
  const main = new Uint8Array(p.length),
    detail = new Uint8Array(p.length),
    protectedInk = new Uint8Array(p.length);
  const seamPath=id==='fashion.cardigan-lilac'?'M320 381 Q309 425 310 493 M566 381 Q579 425 577 493 M345 681 Q444 699 541 681 M100 887 Q130 889 153 914 M732 914 Q755 886 787 887':id==='fashion.burgundy-fold-sweater'?'M128 841 L194 858 M692 858 L757 841':'';
  const seams=seamPath?new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path d="${seamPath}" fill="none" stroke="white" stroke-width="2.5"/></svg>`).render().pixels:undefined;
  const bases: number[][] = [[], []];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4,
        [r, g, b, a] = p.subarray(i, i + 4),
        L = lum(r, g, b);
      if (a < 8) continue;
      let m = oldMain ? Math.min(1, oldMain[i + 3] / Math.max(a, 1)) : 1,
        d = oldDetail ? Math.min(1, oldDetail[i + 3] / Math.max(a, 1)) : 0;
      let protect = a < 240;
      protect ||= (seams?.[i+3]??0)>80;
      const edge = [-1, 1, -w, w].some(
        (q) =>
          i + q * 4 >= 0 && i + q * 4 + 3 < p.length && p[i + q * 4 + 3] < 50,
      );
      protect ||= edge;
      if (id === "fashion.cardigan-lilac") {
        m = b > g * 1.05 && r > g * 1.05 ? 1 : 0;
        d = !m && L > 110 ? 1 : 0;
        protect ||= Math.abs(x - w / 2) < 9 || L < 32;
      } else if (id === "fashion.jeans-indigo") {
        m = b > r * 1.08 ? 1 : 0;
        protect ||= (r > g * 1.03 && r > b * 1.15) || L < 9;
      } else if (id === "fashion.boots-ivory") {
        m = 1;
        protect ||= L < 28 || (r > g * 1.25 && g > b * 1.25);
      } else if (id === "fashion.rose-bow-camisole") {
        m = L >= 100 ? 1 : 0;
        d = L < 100 ? 1 : 0;
        protect ||= L < 16;
      } else if (id === "fashion.rose-dragon-cargo") {
        m = r > g * 1.25 && r > b * 1.15 ? 1 : 0;
        d = !m ? 1 : 0;
        protect ||=
          L < 18 || (Math.max(r, g, b) - Math.min(r, g, b) < 18 && L > 65);
      } else if (id === "fashion.white-platform-sneakers") {
        m = 1;
        protect ||= L < 45;
      } else if (id === "fashion.burgundy-fold-sweater") {
        m = 1;
        protect ||=
          (x > 247 && x < 639 && Math.abs(y - 449) < 2) ||
          (x > 285 &&
            x < 600 &&
            Math.abs(
              y - (754 + 7 * Math.cos((((x - 443) / 158) * Math.PI) / 2)),
            ) < 1.5);
      } else if (id === "fashion.midnight-pleated-skirt") {
        m = 1;
        protect ||= L < 9;
      } else if (id === "fashion.midnight-loafers-socks") {
        protect ||= L < 10 || (r > g * 1.3 && g > b * 1.2);
      } else if (id === "fashion.leopard-ruched-halter") {
        m = r > 95 ? 1 : 0;
        protect ||= !m;
      } else if (id === "fashion.medallion-flare-cargo") {
        // Brown fur is dyeable material, not the warm metallic stitching above it.
        // Its calibrated region includes both the light tips and dark roots.
        protect ||= d < 0.01 && ((r > g * 1.14 && g > b * 1.2 && L > 75) || L < 12);
      } else if (id === "fashion.medallion-belt") {
        m = 1;
        protect ||= L < 12 || (L > 75 && r > g * 1.14 && g > b * 1.2);
      } else if (id === "fashion.fur-buckle-platforms") {
        m = 1;
        protect ||= L < 10 || (L > 75 && r > g * 1.15 && r > b * 1.35);
      }
      // Freeze narrow contrasting ink/stitch lines. Broad folds remain part of the
      // material shading; ribbed knit and fur are deliberately exempt.
      const textile =
        id === "fashion.jeans-indigo" ||
        id === "fashion.medallion-flare-cargo" ||
        id === "fashion.white-platform-sneakers" ||
        id === "fashion.boots-ivory";
      if (textile && !(id === "fashion.medallion-flare-cargo" && d > 0) && x > 2 && x < w - 3 && y > 2 && y < h - 3) {
        const neighbors = [-2, 2, -w * 2, w * 2].map((q) =>
          lum(p[i + q * 4], p[i + q * 4 + 1], p[i + q * 4 + 2]),
        );
        const hi = Math.max(...neighbors),
          lo = Math.min(...neighbors);
        protect ||= L < lo - 12 || L > hi + 25;
      }
      if (protect) {
        protectedInk.set([255, 255, 255, 255], i);
        continue;
      }
      if (m + d > 1) {
        const sum = m + d;
        m /= sum;
        d /= sum;
      }
      main.set([255, 255, 255, Math.round(m * 255)], i);
      detail.set([255, 255, 255, Math.round(d * 255)], i);
      if (m > 0.8) bases[0].push(i);
      if (d > 0.8) bases[1].push(i);
    }
  const median = (list: number[], fallback: string) => {
    if (!list.length) return fallback;
    list.sort(
      (a, b) => lum(p[a], p[a + 1], p[a + 2]) - lum(p[b], p[b + 1], p[b + 2]),
    );
    const i = list[Math.floor(list.length * 0.55)];
    return (
      "#" +
      [p[i], p[i + 1], p[i + 2]]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")
    );
  };
  for (const [k, v] of [
    ["main", main],
    ["detail", detail],
    ["protected", protectedInk],
  ] as const)
    writeFileSync(`${out}/${name}-${k}.png`, rgbaPng(w, h, v));
  map[id] = {
    main: `/assets/avatar/materials-v1/${name}-main.png`,
    detail: piece.secondaryColor
      ? `/assets/avatar/materials-v1/${name}-detail.png`
      : undefined,
    mainBase: median(bases[0], art.colorMasks?.mainBase ?? "#cccccc"),
    detailBase: median(
      bases[1],
      piece.secondaryColor?.defaultColor ?? "#333333",
    ),
    mainLabel:
      id === "fashion.cardigan-lilac"
        ? "Cardigan"
        : id === "fashion.medallion-flare-cargo"
          ? "Pantalon"
          : id === "fashion.leopard-ruched-halter"
            ? "Fond léopard"
            : "Tissu",
    protected: `/assets/avatar/materials-v1/${name}-protected.png`,
    shading: "material",
  };
}
writeFileSync(
  "apps/web/src/avatar/material-map.ts",
  "// Generated by scripts/prepare-material-masks.ts; source-coordinate material regions.\nexport const MATERIAL_MAP = " +
    JSON.stringify(map, null, 2) +
    " as const;\n",
);
console.log(Object.keys(map).length + " material sets prepared");
