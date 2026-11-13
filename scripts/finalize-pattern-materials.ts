import { readFileSync, writeFileSync } from "node:fs";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "./lib/png-rgba";
const W = 887,
  H = 1774,
  load = (u: string) => pngPixels(readFileSync("public" + u)).pixels;
for (const piece of avatarCatalogSnapshot()) {
  if (
    piece.art.kind !== "image" ||
    !piece.art.front.startsWith("/assets/avatar/winter-v2/") ||
    !piece.art.colorMasks
  )
    continue;
  const jobs = [
    {
      front: piece.art.front,
      main: piece.art.colorMasks.main,
      detail: piece.art.colorMasks.detail,
    },
    ...Object.values(piece.poseProfile!.fits).flatMap((f) =>
      f.sleeves
        ? [
            {
              front: f.sleeves.front,
              main: f.sleeves.main,
              detail: f.sleeves.detail,
            },
          ]
        : [],
    ),
  ];
  for (const job of jobs) {
    const p = load(job.front),
      shape =
        piece.slot === "hair"
          ? load(piece.art.front.replace("-front.png", ".png"))
          : p,
      main = load(job.main),
      detail = job.detail ? load(job.detail) : undefined,
      protectedInk = new Uint8Array(p.length);
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const i = (y * W + x) * 4;
        if (!shape[i + 3]) continue;
        const edge = [-1, 1, -W, W].some((d) => shape[i + d * 4 + 3] < 80);
        const dark = Math.max(shape[i], shape[i + 1], shape[i + 2]) < 100;
        if (edge && dark) {
          main[i + 3] = 0;
          if (detail) detail[i + 3] = 0;
        }
      }
    for (let i = 0; i < p.length; i += 4)
      if (p[i + 3] && !main[i + 3] && !detail?.[i + 3])
        protectedInk.set([255, 255, 255, p[i + 3]], i);
    writeFileSync("public" + job.main, rgbaPng(W, H, main));
    if (detail) writeFileSync("public" + job.detail, rgbaPng(W, H, detail));
    writeFileSync(
      "public" + job.front.replace(/\.png$/, "-protected.png"),
      rgbaPng(W, H, protectedInk),
    );
  }
}
console.log(
  "Native material contours protected without introducing a boundary at the hair pass split.",
);
