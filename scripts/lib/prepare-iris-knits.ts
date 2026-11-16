import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../../apps/server/src/atelier-images";
import { measureFabricTone } from "../../packages/domain/src/atelier-color";
import { DOLL_PATTERN } from "../../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./png-rgba";
import { nativeRgba } from "./png-native";

const [width, height] = DOLL_PATTERN.canvas;
const length = width * height;
const docs = "docs/capsule-mailles-iris-v1";
const output = "public/assets/avatar/capsule-mailles-iris-v1";
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Le patron frontal d’Iris a changé.");
const bodyPixels = nativeRgba(body).pixels;

type Color = readonly [number, number, number];
type Knit = {
  id: string;
  label: string;
  base: string;
  trace: string;
  source?: string;
  fluff?: boolean;
  bareBodice?: boolean;
  opening?: string;
  solidFabric?: string;
  detail?: { label: string; base: string };
  metal?: string;
  cloth: (r: number, g: number, b: number) => boolean;
};
// Native cuts follow the measured frontal shoulders, resting wrists and waist.
// The trace constrains colour separation near skin/denim, and the actual image
// supplies every textile pixel, including the original stitches and folds.
const knits: readonly Knit[] = [
  {
    id: "nuage",
    label: "Nuage",
    base: "#ccae87",
    trace:
      "M392 309Q405 343 443 342Q478 341 494 309Q517 322 526 337Q595 343 626 421Q646 483 681 548Q733 625 751 671Q773 735 739 774L745 824L687 846Q672 819 657 799Q610 801 586 751Q549 726 443 726Q332 727 275 752Q255 794 210 799Q195 809 183 845L126 827Q137 785 127 774Q89 745 117 669Q135 621 187 552Q230 486 249 421Q275 345 352 338Q366 317 392 309Z",
    cloth: (r, g, b) => r - g > 11 && g - b > 15 && r - g < (g - b) * 1.65,
  },
  {
    id: "alaska",
    label: "Alaska",
    base: "#21392d",
    trace:
      "M402 283Q408 302 443 306Q480 303 484 281Q502 282 500 319Q507 339 563 345Q626 344 630 442Q640 560 656 596Q684 631 704 711Q728 790 746 825L702 842Q681 788 627 716Q589 655 575 564L559 505Q524 573 529 616Q535 644 574 702Q445 735 312 703Q352 643 355 611Q361 578 325 508Q303 572 294 617Q280 678 241 737Q207 787 184 839L139 828Q159 775 180 707Q205 627 227 596Q243 552 255 444Q258 345 322 345Q373 339 384 322Q382 285 402 283Z",
    cloth: (r, g, b) => g > r + 7 && g > b + 4,
  },
  {
    id: "mila",
    label: "Mila",
    base: "#9b90b8",
    fluff: true,
    // The pale mohair highlights here can match the studio matte, even inside
    // the sleeves. Trace the knit beneath the outer fringe on both arms.
    solidFabric:
      "M233 537Q220 560 219 574Q215 584 209 594Q190 612 180 635Q172 654 168 672Q166 689 156 707L184 716Q218 694 230 652Q254 602 263 548Z M662 620Q676 635 688 644Q697 653 698 660Q706 675 714 686Q724 701 729 717L700 731Q671 698 655 639Z",
    trace:
      "M346 339Q383 398 443 431Q501 403 540 339Q595 328 619 387Q638 444 646 515Q660 575 691 626Q722 686 741 738Q752 789 738 815L746 828L698 845Q689 824 678 809Q643 808 619 771Q596 716 568 659Q560 667 531 660Q440 643 350 656Q326 666 310 659Q286 730 265 774Q241 809 210 807Q202 828 189 845L135 826L143 807Q112 782 148 711Q171 659 194 617Q230 558 240 482Q248 355 308 343Q326 333 346 339Z",
    cloth: (r, g, b) => b > r + 10 && b > g + 15,
  },
  {
    id: "epaules-nues",
    label: "Épaules nues",
    base: "#a0a18c",
    bareBodice: true,
    trace:
      "M252 397Q350 407 441 446Q544 416 625 400Q636 425 639 496L631 506Q639 562 658 612Q682 653 699 719Q728 795 751 836L699 852Q683 797 633 732Q594 672 582 606Q573 540 560 497Q526 558 527 608Q533 640 571 699Q544 721 443 722Q342 722 307 701Q325 663 351 644Q329 624 358 614Q357 551 322 503Q303 559 290 620Q271 691 231 753L186 853L134 837Q158 782 179 711Q201 644 225 610Q243 558 248 509L238 504Q239 456 252 397Z",
    cloth: (r, g, b) =>
      Math.abs(r - g) < 21 && g - b > 9 && g - b < 44 && r < 212,
  },
  {
    id: "eclipse",
    label: "Éclipse",
    base: "#766a7a",
    opening: "M464 349L474 340L615 327L622 412Q592 418 550 399Q524 390 500 374Q480 363 464 351Z",
    trace:
      "M403 296Q440 319 484 296Q488 319 499 332L474 350Q554 395 622 412Q628 481 639 553Q647 592 663 620Q699 688 724 764L750 828L702 846Q679 785 628 711Q589 653 573 568L560 509Q526 579 525 613Q537 646 570 693L445 732L313 697Q352 639 356 608Q358 581 326 510Q312 552 292 621Q276 674 244 732Q204 789 182 845L136 828Q160 768 181 705Q198 645 224 605Q250 556 257 427Q260 347 313 346Q377 343 393 320Z",
    cloth: (r, g, b) => b > g + 5 && b > r - 8 && r > g + 3,
  },
  {
    id: "mocha",
    label: "Mocha",
    base: "#694737",
    source: "06-mocha-raccord",
    bareBodice: true,
    trace:
      "M372 336Q365 390 421 451L443 475Q483 448 509 387Q518 358 510 337Q583 345 607 369Q629 406 628 465Q635 542 659 598Q680 638 699 704Q731 797 752 839L700 857Q681 801 634 741Q590 681 578 613Q565 546 558 507Q526 581 530 617Q535 648 564 680Q510 702 446 701Q385 707 323 681Q353 649 356 612Q358 570 325 508Q308 563 293 616Q274 684 240 737Q204 792 181 855L133 841Q155 789 177 710Q198 632 223 600Q240 557 253 463Q249 390 279 360Q303 344 372 336Z",
    cloth: (r, g, b) => r < 151 && r - g > 12 && g - b > 6 && b < 117,
    metal:
      "M443 479a8 8 0 1 0 0 16a8 8 0 1 0 0-16Z M443 523a8 8 0 1 0 0 16a8 8 0 1 0 0-16Z M444 569a8 8 0 1 0 0 16a8 8 0 1 0 0-16Z M443 614a8 8 0 1 0 0 16a8 8 0 1 0 0-16Z M443 660a8 8 0 1 0 0 16a8 8 0 1 0 0-16Z",
  },
  {
    id: "tokyo",
    label: "Tokyo",
    base: "#242639",
    detail: { label: "Empiècement rouille", base: "#a65728" },
    trace:
      "M397 325Q377 345 443 359Q497 353 505 323Q529 336 547 340Q607 349 630 414L652 467Q695 552 690 623Q723 650 727 711Q724 730 748 754Q756 772 746 798L758 841L699 862Q680 828 642 813L642 861Q654 898 642 954L639 969Q633 975 603 971Q531 968 444 966Q355 966 273 971Q243 977 231 971L227 945Q219 897 226 865L232 785Q221 810 201 824L182 862L118 842Q127 815 126 798Q111 770 124 749Q150 726 148 712Q147 682 173 646Q181 619 208 582L231 483Q243 448 255 414Q270 349 342 339Q368 336 379 323Z",
    cloth: (r, g, b) =>
      (r < 110 && b >= r - 11) || (r < 194 && r - g > 22 && r - b > 37),
  },
  {
    id: "velvet-cotele",
    label: "Velvet côtelé",
    base: "#481729",
    source: "08-velvet-cotele-raccord-final",
    trace:
      "M402 298Q439 322 482 298Q493 331 517 338Q557 347 576 345Q627 353 629 456Q638 553 657 596Q684 635 705 716Q727 792 749 829L702 846Q678 790 627 716Q592 659 573 565L559 513Q528 575 531 616Q533 644 579 707Q445 728 308 708Q352 647 356 613Q359 573 326 513Q302 581 292 623Q273 682 236 744Q207 792 183 846L137 832Q161 766 179 707Q201 635 224 599Q242 550 253 457Q249 348 313 345Q373 346 392 322Z M444 357Q419 389 444 420Q467 386 444 357Z",
    opening: "M444 361Q427 386 438 406L444 416Q457 393 454 381Z",
    cloth: (r, g, b) => r > g + 14 && b > g + 4 && r < 162,
    metal: "M425 353H462Q466 357 461 361H427Q422 359 425 353Z",
  },
  {
    id: "sienna",
    label: "Sienna",
    base: "#b96539",
    source: "09-sienna-raccord",
    trace:
      "M314 343Q441 388 565 343Q624 340 629 444Q627 499 666 551Q733 618 726 656Q723 680 707 700Q710 741 742 818L699 834Q677 783 643 725Q612 733 579 687Q548 642 560 516Q526 570 525 612Q532 647 571 698Q441 729 309 700Q352 640 357 610Q359 571 326 513Q334 640 307 682Q283 718 240 724Q207 769 184 834L139 820Q173 731 169 701Q143 666 153 625Q167 591 207 551Q252 504 252 438Q251 347 314 343Z",
    cloth: (r, g, b) =>
      r < 223 && r - g > 29 && g - b > 18 && r - g > (g - b) * 1.04,
  },
  {
    id: "astral",
    label: "Astral",
    base: "#184857",
    trace:
      "M397 319Q413 345 443 345Q481 344 491 317Q518 340 557 345Q630 344 631 441Q633 539 656 594Q686 640 702 705Q724 777 751 833L702 851Q684 800 634 729Q600 675 583 610Q575 550 561 511Q530 567 535 612Q534 634 559 676Q443 669 329 675L343 652Q399 650 445 622Q393 600 355 577Q342 540 326 510Q308 553 294 619Q275 681 238 738Q204 790 181 851L134 834Q157 778 179 704Q198 632 224 596Q248 550 253 437Q255 347 318 346Q366 346 397 319Z",
    cloth: (r, g, b) => b > r + 11 && g > r + 9,
    metal: "M437 617H465Q471 619 468 626H437Q427 624 437 617Z",
  },
];

function trace(path: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path d="${path}" fill="white" fill-rule="evenodd"/></svg>`;
  return new Resvg(svg).render().pixels;
}
function read(path: string) {
  const png = pngPixels(readFileSync(path));
  if (png.width !== width || png.height !== height)
    throw new Error(`Format : ${path}`);
  return png.pixels;
}
function color(bytes: Uint8Array, p: number): Color {
  return [bytes[p * 4], bytes[p * 4 + 1], bytes[p * 4 + 2]];
}
const reference = read(`${docs}/iris-jean-reference.png`);
const steps = [-1, 1, -width, width];
const clamp = (value: number, max = 1) => Math.max(0, Math.min(max, value));
const search = Array.from(
  { length: 289 },
  (_, k) => [(k % 17) - 8, Math.floor(k / 17) - 8] as const,
)
  .filter(([x, y]) => x || y)
  .sort(([x, y], [a, b]) => x * x + y * y - a * a - b * b)
  .map(([x, y]) => x + y * width);
const distance = (a: Color, b: Color) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function fillConnected(
  mask: Uint8Array,
  origin: number,
  select: (p: number) => boolean,
) {
  const queue = new Int32Array(length);
  let head = 0,
    tail = 1;
  queue[0] = origin;
  mask[origin] = 1;
  while (head < tail) {
    const p = queue[head++];
    for (const step of steps) {
      const k = p + step;
      if (k < 0 || k >= length || mask[k] || !select(k)) continue;
      mask[k] = 1;
      queue[tail++] = k;
    }
  }
}

function dematte(
  pixel: Color,
  background: Color,
  neighbor: Color,
  inside: boolean,
  diffuse: boolean,
) {
  const delta = neighbor.map((c, i) => c - background[i]);
  const norm = delta.reduce((sum, c) => sum + c * c, 0);
  if (norm < 30) return { pixel, opacity: inside ? 1 : 0 };
  const projection = clamp(
    delta.reduce((sum, c, i) => sum + c * (pixel[i] - background[i]), 0) / norm,
  );
  if (inside && projection < 0.4)
    return { pixel: neighbor, opacity: diffuse ? 0.7 : 0.9 };
  const opacity = inside && !diffuse ? Math.max(0.72, projection) : projection;
  const reconstructed = delta.map((_, i) =>
    Math.round(
      clamp(
        (pixel[i] - background[i] * (1 - opacity)) / Math.max(0.07, opacity),
        255,
      ),
    ),
  ) as unknown as Color;
  return { pixel: opacity > 0.97 ? pixel : reconstructed, opacity };
}

function fitSleeveEdges(art: Uint8Array) {
  const paint = art.slice();
  for (let y = 508; y <= 806; y++)
    for (const side of [1, -1]) {
      const at = (x: number) =>
        (y * width + (side === 1 ? x : width - x - 1)) * 4;
      let arm = 85;
      while (arm < 333 && bodyPixels[at(arm) + 3] < 190) arm++;
      const start = arm;
      while (arm < 337 && bodyPixels[at(arm) + 3] >= 190) arm++;
      const end = arm;
      if (end - start < 25) continue;
      for (let x = start; x < end; x++) {
        const i = at(x);
        if (paint[i + 3] > 244) continue;
        // Only extend an existing seam by its small measured difference.
        const direction = x - start < end - x ? 1 : -1;
        let span = 1;
        while (span <= 10 && paint[at(x + direction * span) + 3] < 247) span++;
        if (
          span > 10 ||
          x + direction * span < start ||
          x + direction * span >= end
        )
          continue;
        const donor = at(x + direction * (span + 1));
        art.set(paint.subarray(donor, donor + 3), i);
        art[i + 3] = 255;
      }
    }
}

function isolate(knit: Knit, index: number) {
  const file =
    knit.source ?? `${String(index + 1).padStart(2, "0")}-${knit.id}`;
  const source = read(`${docs}/essais/${file}.png`);
  if (knit.id === "tokyo") {
    // Preserve the approved drawing above the new hem and blend its knit at the join.
    const hem = read(`${docs}/essais/07-tokyo-ourlet-ferme.png`);
    for (let y = 858; y < 1000; y++) {
      const weight = Math.min(1, (y - 858) / 30);
      for (let x = 207; x < 668; x++) {
        const i = (y * width + x) * 4;
        for (let c = i; c < i + 3; c++)
          source[c] = Math.round(source[c] * (1 - weight) + hem[c] * weight);
      }
    }
  }
  const envelope = trace(knit.trace);
  const fixedZone = knit.metal && trace(knit.metal);
  const opening = knit.opening && trace(knit.opening);
  const solidFabric = knit.solidFabric && trace(knit.solidFabric);
  const guide = new Uint8Array(length);
  const good = new Uint8Array(length);
  const candidate = new Uint8Array(length);
  for (let y = 269; y < 1000; y++)
    for (let x = 87; x < 800; x++) {
      const p = y * width + x,
        i = p * 4;
      const inside = envelope[i + 3] > 126;
      const near =
        inside || steps.some((s) => envelope[(p + 5 * s) * 4 + 3] > 145);
      if (!near || (opening && opening[i + 3] > 188)) continue;
      guide[p] = 1;
      const sourceColor = color(source, p);
      const underlying = color(reference, p);
      const difference = distance(sourceColor, underlying);
      const core =
        inside && steps.every((s) => envelope[(p + 5 * s) * 4 + 3] > 248);
      const strict = knit.id === "tokyo" && y > 900;
      const studio =
        Math.min(...sourceColor) > 190 &&
        Math.max(...sourceColor) - Math.min(...sourceColor) < 18;
      const [r, g, b] = sourceColor;
      const jeans =
        knit.id !== "tokyo" &&
        y > 692 &&
        underlying[0] < 115 &&
        underlying[2] > underlying[0] + 8 &&
        underlying[2] > underlying[1] + 6 &&
        r < 105 &&
        b > r + 12 &&
        b > g + 6;
      const fore =
        knit.cloth(...sourceColor) &&
        !studio &&
        !jeans &&
        difference > (strict ? 10 : 12);
      // Require real textile evidence at a long cuff, at the jeans edge and
      // around cut-outs. At the structural center retain low-contrast stitches.
      if (
        fore ||
        (fixedZone && fixedZone[i + 3] > 160) ||
        (core &&
          !studio &&
          !jeans &&
          (difference > 27 || (strict && inside && difference > 7)))
      )
        candidate[p] = 1;
    }
  fillConnected(good, 520 * width + 443, (p) => Boolean(candidate[p]));
  const outside = new Uint8Array(length);
  fillConnected(outside, 0, (p) => !good[p]);
  const hard = new Uint8Array(length);
  for (let p = 0; p < length; p++) {
    if (guide[p] && !outside[p] && !(opening && opening[p * 4 + 3] > 90))
      good[p] = 1;
  }
  for (let p = 0; p < length; p++)
    if (good[p] && steps.every((s) => good[p + s] && good[p + 2 * s]))
      hard[p] = 1;

  const rgba = new Uint8Array(length * 4),
    bodyMask = new Uint8Array(length * 4);
  const material = new Uint8Array(length * 4),
    detail = new Uint8Array(length * 4);
  const protectedMask = new Uint8Array(length * 4),
    weighted = new Uint8Array(length * 4);
  let left = width,
    top = height,
    right = 0,
    bottom = 0;
  for (let y = 270; y < 1000; y++)
    for (let x = 88; x < 799; x++) {
      const p = y * width + x,
        i = p * 4;
      if (
        (opening && opening[i + 3] > 188) ||
        (!good[p] &&
          !steps.some((s) => good[p + s * (knit.fluff ? 5 : 1)] || good[p + s]))
      )
        continue;
      let pixel = color(source, p),
        opacity = 1;
      if (!hard[p]) {
        const a = search.find((s) => hard[p + s]);
        const b = search.find(
          (s) => !good[p + s] && steps.every((k) => !good[p + s + k]),
        );
        if (a === undefined || b === undefined) {
          if (!good[p]) continue;
        } else {
          const cloth = color(source, p + a);
          const matte = color(source, p + b);
          ({ pixel, opacity } = dematte(
            pixel,
            matte,
            cloth,
            Boolean(good[p]),
            Boolean(knit.fluff),
          ));
        }
      }
      const alpha = Math.round(opacity * 255);
      if (alpha < (knit.fluff ? 12 : 24)) continue;
      if (knit.id === "tokyo" && y > 857 && envelope[i + 3] < 75) continue;
      rgba.set([...pixel, alpha], i);
    }
  fitSleeveEdges(rgba);
  for (let y = 270; y < 1000; y++)
    for (let x = 88; x < 799; x++) {
      const p = y * width + x,
        i = p * 4;
      const fabricAlpha = solidFabric?.[i + 3] ?? 0;
      if (fabricAlpha > rgba[i + 3]) {
        rgba.set(source.subarray(i, i + 3), i);
        rgba[i + 3] = fabricAlpha;
      }
      const alpha = rgba[i + 3];
      if (!alpha) continue;
      const [r, g, b] = color(rgba, p);
      const metalV = Boolean(fixedZone && fixedZone[i + 3] > 118);
      const panel =
        knit.detail && x < 550 && y < 685 && r > g + 15 && r > b + 25;
      const stitch =
        knit.id === "tokyo" &&
        y > 865 &&
        x > 232 &&
        x < 649 &&
        r > g + 9 &&
        g > b + 1 &&
        r > 84;
      const opacity = alpha / 255;
      weighted.set([r * opacity, g * opacity, b * opacity, alpha], i);
      (metalV || stitch ? protectedMask : panel ? detail : material).fill(
        255,
        i,
        i + 4,
      );
      if (alpha >= 249) bodyMask[i + 3] = 255;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  const tone = measureFabricTone(weighted, material);
  const detailTone = knit.detail && measureFabricTone(weighted, detail);
  if (
    !tone ||
    (knit.detail && !detailTone) ||
    right - left < 540 ||
    bottom - top < 440
  )
    throw new Error(`Détourage incomplet : ${knit.label}`);
  const hasProtected = Boolean(knit.metal || knit.detail);
  for (const [suffix, bytes] of [
    ["", rgba],
    ["-coverage", bodyMask],
    ["-mask", material],
    ...(detailTone ? [["-detail-mask", detail] as const] : []),
    ...(hasProtected ? [["-protected", protectedMask] as const] : []),
  ] as const)
    writeFileSync(
      `${output}/${knit.id}${suffix}.png`,
      rgbaPng(width, height, bytes),
    );
  return {
    id: knit.id,
    name: knit.label,
    base: knit.base,
    crop: [left - 5, top - 5, right - left + 11, bottom - top + 11],
    tone: {
      ...tone,
      depth: 0.42,
      sheen: knit.id === "velvet-cotele" ? 0.28 : 0.17,
    },
    detail: knit.detail && { ...knit.detail, tone: detailTone! },
    hasProtected,
    bareBodice: knit.bareBodice ?? false,
  };
}
mkdirSync(output, { recursive: true });
writeFileSync(
  `${output}/index.json`,
  JSON.stringify(
    {
      pattern: DOLL_PATTERN.id,
      bodySha256: DOLL_PATTERN.bodySha256,
      pieces: knits.map(isolate),
    },
    null,
    2,
  ) + "\n",
);
