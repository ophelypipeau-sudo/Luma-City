import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { rgbaPng } from "./lib/png-rgba";

const [w, h] = DOLL_PATTERN.canvas;
const root = "public/assets/avatar";
// The shop's archive belongs to the browser profile. Require explicit IDs
// from the visible shop instead of assuming every built-in piece is for sale.
const selectedIds = new Set(process.argv.slice(2));
if (!selectedIds.size)
  throw new Error(
    "Indiquer les identifiants des articles encore visibles en boutique.",
  );
const selectedStems = new Set<string>();
for (const piece of avatarCatalogSnapshot()) {
  if (!selectedIds.delete(piece.id)) continue;
  if (piece.art.kind !== "image") continue;
  for (const url of [
    piece.art.front,
    piece.handCarry?.shoulder,
    ...Object.values(piece.poseProfile!.fits).map((fit) => fit.sleeves?.front),
  ]) {
    if (url?.startsWith("/assets/avatar/") && url.endsWith(".png"))
      selectedStems.add(url.slice("/assets/avatar/".length, -4));
  }
}
if (selectedIds.size)
  throw new Error(`Articles inconnus : ${[...selectedIds].join(", ")}`);
const poses = ["", "-hand-on-hip", "-heart-hands"] as const;
const draw = (markup: string) =>
  new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" fill="white">${markup}</svg>`,
  ).render().pixels;
const fill = (d: string) => `<path d="${d}"/>`;
const line = (d: string, width = 3) =>
  `<path d="${d}" fill="none" stroke="white" stroke-width="${width}"/>`;
const rect = (x: number, y: number, width: number, height: number, rx = 0) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}"/>`;
const dot = (x: number, y: number, radius: number) =>
  `<circle cx="${x}" cy="${y}" r="${radius}"/>`;
const ink = [255, 255, 255, 255] as const;
const light = (p: Uint8Array, i: number) =>
  0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
type Decide = (
  x: number,
  y: number,
  at: number,
  art: Uint8Array,
) => "main" | "detail" | "fixed" | number | undefined;

function refine(
  stem: string,
  decide: Decide,
  hasDetail = false,
  keepExisting: boolean | ((x: number, y: number) => boolean) = false,
) {
  if (!selectedStems.has(stem)) return;
  const path = `${root}/${stem}`;
  function read(suffix: string) {
    const png = pngPixels(readFileSync(`${path}${suffix}.png`));
    if (png.width !== w || png.height !== h)
      throw new Error(`Invalid canvas: ${stem}`);
    return png.pixels;
  }
  const art = read(""),
    main = read("-mask"),
    fixed = existsSync(`${path}-protected.png`)
      ? read("-protected")
      : new Uint8Array(art.length);
  const detail = hasDetail ? read("-detail-mask") : undefined;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (
        !art[i + 3] ||
        (fixed[i + 3] &&
          (typeof keepExisting === "function"
            ? keepExisting(x, y)
            : keepExisting))
      )
        continue;
      const region = decide(x, y, i, art);
      if (region === undefined) continue;
      if (typeof region === "number") {
        if (fixed[i + 3]) continue;
        if (main[i + 3])
          main.set([255, 255, 255, Math.min(main[i + 3], region)], i);
        if (detail?.[i + 3])
          detail.set([255, 255, 255, Math.min(detail[i + 3], region)], i);
        continue;
      }
      main.fill(0, i, i + 4);
      detail?.fill(0, i, i + 4);
      fixed.fill(0, i, i + 4);
      (region === "fixed" ? fixed : region === "detail" ? detail! : main).set(
        ink,
        i,
      );
    }
  for (const [suffix, data] of [
    ["-mask", main],
    ["-protected", fixed],
    ["-detail-mask", detail],
  ] as const) {
    if (!data) continue;
    // Decoding yields premultiplied channels. Only the mask alpha carries
    // information; keep RGB canonical so running this twice is stable.
    for (let i = 0; i < data.length; i += 4)
      data.fill(data[i + 3] ? 255 : 0, i, i + 3);
    writeFileSync(`${path}${suffix}.png`, rgbaPng(w, h, data));
  }
  console.log(stem);
}

const preserve =
  (mask: Uint8Array): Decide =>
  (_x, _y, i) =>
    mask[i + 3] > 70 ? "fixed" : undefined;
const reduce =
  (mask: Uint8Array, strength: number): Decide =>
  (_x, _y, i) =>
    mask[i + 3] ? Math.round(255 - mask[i + 3] * strength) : undefined;
const combine =
  (...rules: Decide[]): Decide =>
  (x, y, i, art) => {
    for (const rule of rules) {
      const result = rule(x, y, i, art);
      if (result !== undefined) return result;
    }
  };

// The raised hibiscus and the metal shoulder clasp are not the fabric.
const hibiscus = draw(
  fill(
    "M392 408Q410 403 430 414Q450 396 476 409Q488 419 490 425Q511 435 499 452L484 458Q485 467 467 469Q453 486 443 504L432 511L433 500L446 470Q430 471 423 480L404 477L415 467L435 461Q417 455 416 446Q415 439 430 428Q415 422 392 412Z",
  ),
);
const espresso = draw(fill("M536 346Q545 347 559 354L555 367L527 359Z"));
const shirtHems = {
  framboise: "M305 721Q423 782 583 722",
  espresso: "M297 771Q433 804 601 771",
};
for (const pose of poses)
  for (const cut of ["framboise", "espresso"] as const)
    refine(
      `tshirts-v1/fitted/${cut}${pose || "-front"}`,
      combine(
        preserve(cut === "framboise" ? hibiscus : espresso),
        reduce(draw(line(shirtHems[cut], 3)), 0.45),
      ),
    );

// Cream stripes keep their own dye even in the shadow of the bust.
for (const pose of poses)
  refine(
    `tshirts-v1/fitted/rayures${pose || "-front"}`,
    (_x, _y, i, art) => {
      const warm = (art[i] + art[i + 1]) / 2 - art[i + 2];
      return warm > 1 ? "detail" : "main";
    },
    true,
    true,
  );

// The rose stitching follows the velour dye. Only the calibrated zipper
// and crystals are retained as independent details.
for (const pose of poses)
  refine(`approved-tops-v1/y2k-mcbling${pose}`, () => "main", false, true);

const pinkCollar =
  "M210 280H681V420Q652 441 605 449Q563 459 512 462Q468 476 445 486Q414 466 374 456Q321 452 274 436Q245 427 210 420Z";
const pinkCuffs = [
  "M89 755Q175 741 220 796L234 890H82Z M655 783Q696 737 771 757L797 890H655Z",
  "M89 755Q175 743 220 792L234 890H82Z M594 636Q623 608 657 611Q695 613 704 658L675 740H584Z",
  "M258 429Q286 414 315 427Q327 449 359 464L376 502Q357 540 309 535Q267 526 255 479Z M629 429Q601 414 572 427Q560 449 528 464L511 502Q530 540 578 535Q620 526 632 479Z",
];
const stars = draw(
  fill(
    "M349 485L368 482L375 464L385 483L409 488L394 500L400 522L377 510L357 523L362 501Z M478 488L502 483L512 464L521 482L540 485L525 501L530 523L510 510L487 522L493 500Z",
  ),
);
const jacketHardware = draw(
  rect(439, 485, 10, 144, 3) + dot(432, 620, 6) + dot(457, 620, 6),
);
const jacketSeams = draw(
  line(
    "M321 480Q327 521 357 551Q376 581 382 605M566 480Q560 521 530 551Q511 581 505 605M356 600Q443 619 526 601",
    3,
  ),
);
for (const [n, pose] of poses.entries()) {
  const fur = draw(fill(pinkCollar) + fill(pinkCuffs[n]));
  const furBoundary = draw(
    line(
      "M244 420Q282 448 355 455Q406 462 443 483Q475 469 527 458Q596 451 640 421",
      21,
    ),
  );
  refine(
    `redrawn-v1/pink-jacket${pose}`,
    (_x, _y, i, art) => {
      const [r, g, b, a] = art.subarray(i, i + 4);
      if (
        a < 100 ||
        Math.max(r, g, b) < 38 ||
        stars[i + 3] > 80 ||
        jacketHardware[i + 3] > 80
      )
        return "fixed";
      if (furBoundary[i + 3] && r - g > 21 && b - g > 8) return "detail";
      if (fur[i + 3] > 120) return "detail";
      if (jacketSeams[i + 3] > 90) return "fixed";
      return "main";
    },
    true,
  );
}

// The denim pattern remains dyeable via its own control. It must not
// receive the denim dye. Restore pale denim scuffs wrongly left undyed.
const embroidery = draw(
  fill(
    "M318 707H365V751H318Z M290 737H334V784H290Z M285 773H373V836H285Z M513 702H558V748H513Z M515 773H602V837H515Z",
  ),
);
const skirtHardware = draw(
  dot(452, 754, 9) +
    dot(376, 764, 4) +
    dot(515, 765, 4) +
    dot(288, 788, 4) +
    dot(601, 791, 4) +
    rect(441, 893, 13, 9, 2),
);
const skirtSeams = draw(
  line(
    "M435 742L435 895M464 769V812Q464 835 446 835M281 881Q447 914 614 881",
    3,
  ),
);
refine(
  "redrawn-v1/pink-skirt",
  (_x, _y, i, art) => {
    const [r, g, b, a] = art.subarray(i, i + 4);
    if (
      a < 160 ||
      Math.max(r, g, b) < 43 ||
      skirtHardware[i + 3] > 75 ||
      skirtSeams[i + 3] > 130
    )
      return "fixed";
    return embroidery[i + 3] && r - g > 14 && b - g > 3 ? "detail" : "main";
  },
  true,
);

// Restore the actual broad fabric area; the old mask only caught seams.
const snowButton = draw(dot(449, 754, 10));
const snowSeams = draw(
  line(
    "M294 736Q442 802 585 736M324 720L310 763M357 729L344 771M529 729L542 771M561 720L578 764M286 769Q330 780 352 751M597 769Q553 780 534 751M434 740L437 851M462 770V811Q462 824 444 828M278 818Q360 824 432 858M608 818Q526 824 454 858",
    3,
  ),
);
refine("redrawn-v1/snow-shorts", (_x, _y, i, art) =>
  art[i + 3] < 140 || snowButton[i + 3] || light(art, i) < 85
    ? "fixed"
    : "main",
);
refine("redrawn-v1/snow-shorts", reduce(snowSeams, 0.32));

const lunarSeams = draw(
  line(
    "M327 724Q300 769 292 850M338 726Q315 768 307 850M560 724Q587 769 595 850M549 726Q572 768 580 850M269 856Q366 857 430 883M618 856Q521 857 457 883M443 743Q436 778 443 878M451 746V804Q451 821 440 828",
    3,
  ),
);
refine("minuit-polaire-v1/short", reduce(lunarSeams, 0.6));
// The waistband and the gilet's sewn lines belong to their own cloth.
// The original gold clasp and the outsole of the shoes are separate.
refine("prune-fumee-v1/gilet", () => "main", false, true);
refine("prune-fumee-v1/pantalon", () => "main");
refine(
  "prune-fumee-v1/escarpins",
  () => "main",
  false,
  (_x, y) => y >= 1746,
);

const satchelClasp = draw(
  rect(142, 1065, 31, 21, 4) +
    rect(90, 998, 14, 11, 3) +
    rect(172, 998, 16, 11, 3),
);
refine("winter-v2/ivory-handbag", preserve(satchelClasp));
const shoulderClasp = draw(
  rect(652, 651, 28, 19, 4) +
    fill("M649 471L660 469L669 488L657 490Z") +
    dot(589, 583, 7) +
    dot(702, 578, 7) +
    rect(609, 605, 16, 9, 3) +
    rect(678, 600, 16, 10, 3),
);
refine("winter-v2/ivory-bag", preserve(shoulderClasp));
const bagChain = draw(
  line(
    "M616 542Q642 568 688 608Q705 621 705 665M611 538Q615 591 637 626Q649 647 654 688",
    9,
  ) +
    dot(704, 663, 10) +
    dot(611, 526, 5),
);
refine("winter-v2/snow-bag", preserve(bagChain));

// The round rivets use round protection, rather than leaving pale squares
// of leather. The cutout inside the buckle remains the same dyed leather.
const beltMetal = draw(
  fill(
    "M337 726L345 741L362 742L348 754L352 773L337 763L321 773L326 753L312 742L330 741Z",
  ) +
    `<rect x="411" y="727" width="62" height="67" rx="8" fill="none" stroke="white" stroke-width="8"/>` +
    line("M412 758H430", 8) +
    [
      [293, 716],
      [307.5, 721.5],
      [323, 727],
      [353, 733.5],
      [369.5, 736],
      [386, 738],
      [402, 740],
      [426, 742],
      [443, 742],
      [460, 742],
      [481, 741],
      [497, 739.5],
      [522, 737],
      [542.5, 733.5],
      [560, 728.5],
      [575.5, 724],
      [588.5, 718],
      [290.5, 753.5],
      [305, 758],
      [319, 762],
      [366, 771.5],
      [383.5, 774],
      [401, 775.5],
      [427, 777],
      [443.5, 778],
      [460, 777],
      [481, 775],
      [498, 772.5],
      [523, 769],
      [548, 764.5],
      [566, 760],
      [583, 755],
      [597.5, 748.5],
    ]
      .map(([x, y]) => dot(x, y, 4.9))
      .join(""),
);
refine("winter-v2/snow-belt", (_x, _y, i, art) =>
  beltMetal[i + 3] > 38 || light(art, i) < 96 || art[i + 3] < 200
    ? "fixed"
    : "main",
);
