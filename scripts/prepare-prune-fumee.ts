import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./lib/png-rgba";

const root = "public/assets/avatar/prune-fumee-v1";
const [width, height] = DOLL_PATTERN.canvas;
const source = pngPixels(readFileSync(`${root}/source.png`));
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (
  source.width !== width ||
  source.height !== height ||
  createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256
)
  throw new Error(
    "Le dessin et le mannequin doivent correspondre au patron natif.",
  );

const outline = (d: string) =>
  new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path d="${d}" fill="white"/></svg>`,
  ).render().pixels;
const vest = outline(
  "M330 344Q353 341 374 333C369 356 373 391 382 409C393 425 420 443 443 458C466 443 493 424 503 410C514 388 516 355 511 333Q532 341 556 343C554 384 555 418 561 447C568 471 569 490 559 514C545 546 529 574 528 601L530 622C540 647 568 675 593 722C569 740 516 762 474 775L443 730L414 775C369 761 323 739 295 723C316 683 343 654 356 626L358 605C358 578 342 547 328 517C317 492 315 473 324 443C331 413 332 378 330 344Z",
);
// Follow the two painted hems, including their rise over each instep.
const hems = outline(
  "M258 1665H404L395 1687Q393 1693 383 1694Q363 1698 344 1692Q331 1687 313 1692Q291 1698 275 1690Z M483 1665H624L614 1686Q610 1692 603 1694Q582 1698 563 1692Q548 1688 533 1692Q512 1698 499 1691Z",
);
const waist = outline(
  "M337 665Q443 683 549 665Q565 695 589 723L610 787H277L296 723Q322 695 337 665Z",
);
const waistband = outline("M337 665Q443 683 549 665L559 685Q443 704 327 685Z");
const pumpUpper = pngPixels(
  readFileSync("public/assets/avatar/redrawn-v1/pumps.png"),
).pixels;
const pumpContours = pngPixels(
  readFileSync("public/assets/avatar/redrawn-v1/pumps-protected.png"),
).pixels;
const save = (name: string, image: Uint8Array) =>
  writeFileSync(`${root}/${name}.png`, rgbaPng(width, height, image));

for (const piece of ["gilet", "pantalon", "escarpins"] as const) {
  const artwork = new Uint8Array(source.pixels.length);
  const dye = new Uint8Array(artwork.length);
  const fixed = new Uint8Array(artwork.length);
  for (let y = 320; y < 1760; y++) {
    for (let x = 244; x < 644; x++) {
      const i = (y * width + x) * 4;
      const r = source.pixels[i],
        g = source.pixels[i + 1],
        b = source.pixels[i + 2];
      if (piece === "escarpins") {
        const alpha = pumpUpper[i + 3];
        if (!alpha) continue;
        // The fitted shoe owns the entire silhouette. The original leather
        // reflection is sampled inside the pointed vamp, away from the hem.
        const blend =
          r > b + 8 && r < 140 ? Math.max(0, Math.min(1, (y - 1700) / 25)) : 0;
        for (const [channel, factor] of [0.41, 0.29, 0.25].entries()) {
          const upper = ((pumpUpper[i + channel] * 255) / alpha) * factor;
          artwork[i + channel] =
            upper * (1 - blend) + source.pixels[i + channel] * blend;
        }
        artwork[i + 3] = alpha;
        // Reuse the calibrated contours from the same shoe silhouette.
        (pumpContours[i + 3] ? fixed : dye).set([255, 255, 255, alpha], i);
        continue;
      }
      // Restore the waist hidden behind the gilet using the adjacent painted
      // twill. The remaining trouser pixels are sampled at their native positions.
      if (
        piece === "pantalon" &&
        waist[i + 3] &&
        (y < 723 || vest[i + 3] > 40)
      ) {
        const sample = ((791 + (y % 34)) * width + x) * 4;
        const seam = waistband[i + 3] && !waistband[i + 4 * width + 3];
        const tone = seam ? 0.68 : waistband[i + 3] ? 0.87 : 0.95;
        artwork.set(
          [
            source.pixels[sample] * tone,
            source.pixels[sample + 1] * tone,
            source.pixels[sample + 2] * tone,
            waist[i + 3],
          ],
          i,
        );
        (seam ? fixed : dye).set([255, 255, 255, waist[i + 3]], i);
        continue;
      }
      if (
        Math.max(r, g, b) > 160 ||
        (r > g * 1.35 &&
          g > b * 1.3 &&
          y < 700 &&
          !(x >= 420 && x <= 474 && y >= 600 && y <= 631))
      )
        continue;
      const alpha =
        piece === "gilet"
          ? vest[i + 3]
          : y < 723
            ? 0
            : y < 1678
              ? 255
              : hems[i + 3];
      if (
        piece === "pantalon" &&
        (x < 257 || x > 632 || (y < 750 && (x < 281 || x > 610)))
      )
        continue;
      if (!alpha) continue;
      artwork.set([r, g, b, alpha], i);
      const clasp =
        piece === "gilet" &&
        x >= 419 &&
        x <= 474 &&
        y >= 600 &&
        y <= 630 &&
        r > b + 30 &&
        g > b + 12;
      (clasp ? fixed : dye).set([255, 255, 255, alpha], i);
    }
  }
  save(piece, artwork);
  save(`${piece}-protected`, fixed);
  save(`${piece}-mask`, dye);
}

// The full leg coverage ends above the hems, where the painted trouser shape
// takes over. Bare feet below the hems remain visible without shoes.
const trousersCoverage = outline("M246 729H640V1665H246Z");
const toesCoverage = outline(
  "M275 1759V1712Q286 1711 294 1707Q333 1730 378 1707Q384 1711 393 1712V1759Z M491 1759V1712Q499 1711 507 1707Q549 1730 590 1707Q597 1711 608 1712V1759Z",
);
for (const [name, shape] of [
  ["pantalon-coverage", trousersCoverage],
  ["escarpins-coverage", toesCoverage],
] as const) {
  const coverage = new Uint8Array(shape.length);
  for (let i = 3; i < coverage.length; i += 4) coverage[i] = shape[i];
  save(name, coverage);
}
