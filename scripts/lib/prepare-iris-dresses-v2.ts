import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../../apps/server/src/atelier-images";
import { measureFabricTone } from "../../packages/domain/src/atelier-color";
import { DOLL_PATTERN } from "../../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./png-rgba";
import { nativeRgba } from "./png-native";

const [width, height] = DOLL_PATTERN.canvas;
const size = width * height;
const assets = "public/assets/avatar";
const docs = "docs/capsule-robes-iris-v2";
const output =
  process.env.IRIS_DRESSES_OUTPUT ?? `${assets}/capsule-robes-iris-v2`;
const body = readFileSync(`${assets}/fashion-v2/body-user.png`);
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Les sources ne correspondent pas au patron frontal d’Iris.");
const bodyPixels = nativeRgba(body).pixels;

type RGB = readonly [number, number, number];
type Dress = {
  id: string;
  name: string;
  envelope: string;
  fabric: (r: number, g: number, b: number) => boolean;
  detail?: string;
  protect?: string;
  piping?: string;
  sheen?: number;
  sheer?: "lace" | "organza";
};
// Envelopes are drawn on the approved native frames. The source boundary is
// recovered inside their trimap; the envelope does not rescale the painting.
const dresses: readonly Dress[] = [
  {
    id: "vesper",
    name: "Vesper",
    sheen: 0.36,
    envelope:
      "M513 329Q539 332 563 337Q619 335 649 382Q646 405 625 430Q608 394 579 421Q570 438 566 471Q566 501 553 534Q526 585 529 619Q531 638 552 666Q592 726 609 786Q636 862 605 997Q526 1006 450 959Q367 998 280 997Q246 882 271 807Q296 711 342 651Q366 619 341 552Q318 492 318 467Q324 446 405 433Q487 422 513 329Z",
    fabric: (r, g, b) => r < 105 || (r - g > 15 && r - g > (g - b) * 1.82),
  },
  {
    id: "mira",
    name: "Mira",
    envelope:
      "M333 342L358 338L361 431Q441 442 529 431L530 339L556 342L558 428Q576 482 560 519Q545 549 539 573L478 610L478 620L533 600L538 624L484 645L484 655L545 645Q591 716 614 792Q637 870 606 986Q441 1002 278 986Q248 876 273 793Q297 716 343 647Q367 619 348 568Q330 528 322 503Q311 476 328 427Z",
    fabric: (r, g, b) => b > r + 7 && g > r + 6,
    protect:
      "M486 602L491 598L495 620L490 623Z M490 642L495 639L499 658L493 661Z",
  },
  {
    id: "solstice",
    name: "Solstice",
    sheen: 0.49,
    envelope:
      "M401 295Q419 321 442 336Q469 317 482 296Q502 326 494 352L485 372Q542 405 562 452Q575 485 551 528Q525 580 525 605Q532 632 549 658Q592 713 610 798Q629 874 654 901Q646 918 627 918Q645 935 584 937Q565 925 545 941Q521 961 445 955Q398 957 372 944Q356 958 317 945Q289 939 271 920Q250 923 228 904Q255 877 271 804Q289 720 334 659Q371 617 353 567L333 523Q306 477 324 434Q342 399 397 361Q380 342 400 315Z",
    fabric: (r, g, b) => b > g + 8 || (r > 140 && b > r + 8),
  },
  {
    id: "celeste",
    name: "Céleste",
    sheer: "lace",
    envelope:
      "M317 346Q337 339 354 342Q360 353 356 373Q374 373 378 396Q397 388 417 407Q439 394 451 403Q462 406 468 414Q486 392 499 393L512 394Q515 375 531 371Q523 352 531 340Q549 341 568 347Q554 384 558 439Q573 489 552 529Q518 598 537 636Q575 689 600 764Q630 870 608 978Q588 992 566 964Q543 993 512 975L507 966Q483 994 445 977L443 972Q418 993 389 976L380 968Q352 994 323 967Q302 990 278 980Q260 909 269 823Q273 749 304 688Q350 624 351 608Q355 588 334 534Q310 493 321 451Q330 410 317 346Z",
    fabric: (r, g, b) => r < 145 || (b > g + 7 && r > g + 13),
  },
  {
    id: "aura",
    name: "Aura",
    envelope:
      "M250 423Q255 376 291 352Q310 342 343 340Q337 365 347 398Q364 445 441 451Q515 452 534 410Q549 372 537 340Q559 342 586 349Q621 368 630 423Q602 431 569 460Q571 495 554 534Q518 597 537 642Q581 712 603 775Q636 856 610 976Q584 994 441 991Q294 993 273 976Q247 861 267 791Q282 736 327 666Q344 639 356 622Q360 584 331 529Q315 497 316 459Q292 433 250 423Z",
    fabric: (r, g, b) => r < 65 || (r > g + 15 && b > g + 5),
    protect: "M366 623a8 8 0 1 0-16 0a8 8 0 1 0 16 0Z",
  },
  {
    id: "saturne",
    name: "Saturne",
    sheen: 0.48,
    envelope:
      "M259 359Q305 348 369 337L354 414L443 458L531 416L515 337Q569 351 621 356Q625 376 617 404Q613 382 608 379Q579 409 565 439Q575 485 554 523Q521 585 525 620Q567 676 588 722Q631 817 656 958Q633 987 442 987Q282 988 231 958Q251 838 284 756Q310 689 352 634Q375 609 352 553Q326 509 320 471L321 431Q299 394 273 378L262 404Z",
    fabric: (r, g, b) => r < 130 || (r < 203 && r - g < 40 && g - b < 29),
    detail:
      "M356 633Q408 663 379 716Q362 747 310 781Q274 826 263 919L261 966L297 974Q320 869 366 821Q402 786 415 733Q420 677 372 633Z M530 630Q480 665 505 716Q529 749 578 781Q613 826 624 919L629 967L592 974Q569 866 523 821Q487 784 474 732Q468 677 514 632Z",
    piping:
      "M357 633Q402 679 365 723Q343 750 311 774 M530 631Q482 669 514 718Q536 751 575 774 M230 958Q273 983 443 988Q602 986 656 958",
  },
  {
    id: "opaline",
    name: "Opaline",
    envelope:
      "M140 827Q151 798 159 768Q179 688 207 629Q221 615 224 588Q246 530 251 450Q253 384 279 362Q299 348 319 348Q350 375 442 372Q528 372 565 348Q592 351 607 369Q633 406 628 457Q641 546 658 586Q661 609 674 634Q704 696 727 769Q728 789 743 827Q719 833 705 840Q697 812 688 793Q656 743 620 673Q603 634 595 603Q577 551 561 501Q524 576 523 613Q531 646 560 680Q592 731 611 792Q636 855 608 962Q597 969 277 964Q254 892 263 837Q265 770 301 706Q332 653 354 629Q369 594 343 546L326 504Q308 548 294 604Q288 650 256 704Q214 775 197 792L181 842Q163 832 140 827Z",
    fabric: (r, g, b) => r - g < 40 && g - b < 43 && r - b > 15 && r < 231,
  },
  {
    id: "velvette",
    name: "Velvette",
    sheen: 0.33,
    envelope:
      "M325 342L366 334Q358 366 350 435Q397 441 443 459Q489 442 536 435Q531 376 517 334L558 342Q557 393 564 435Q576 488 556 530Q516 599 531 631Q554 651 572 680Q607 749 619 814Q631 866 615 935Q564 973 442 975Q324 973 269 936Q250 859 270 801Q288 726 323 674Q345 644 355 623Q360 589 337 540Q309 491 318 443Z",
    fabric: (r, g, b) => r < 50 || (g > r + 7 && b > r + 8),
  },
  {
    id: "nyx",
    name: "Nyx",
    envelope:
      "M330 342L373 334Q358 398 388 431Q410 451 443 465Q489 444 512 405Q523 373 513 334L557 342Q547 413 562 446Q577 494 550 532Q526 583 529 621Q532 646 560 682Q598 735 615 799Q637 870 611 954L541 961L535 921L529 964Q433 971 269 955Q248 872 266 804Q290 721 334 656Q367 619 346 563Q312 504 318 465Q336 409 330 342Z",
    fabric: (r, g, b) => r < 126 || (r < 165 && r - g < 29 && g - b < 24),
    detail:
      "M333 446Q380 471 391 535Q392 565 369 597Q339 622 316 648L298 675Q265 733 264 793Q249 870 267 954L298 958Q300 894 323 835Q344 788 367 751Q377 724 375 696Q366 662 371 628Q389 579 405 562Q415 507 376 452L351 428Z M547 474Q533 503 507 528Q475 574 484 630Q489 667 511 691L550 663L529 620Q525 579 548 534L560 507Z M537 928L541 959L610 954Q633 880 614 802Q600 740 566 694Q551 700 539 735Q514 800 491 863L468 961L529 963Z",
    protect:
      "M542 396Q566 410 551 450Q508 543 406 597L398 580Q466 520 508 441Z M555 678L567 690Q508 778 452 963L380 964Q411 882 451 795Q490 721 555 678Z",
  },
  {
    id: "equinoxe",
    name: "Équinoxe",
    sheer: "organza",
    sheen: 0.24,
    envelope:
      "M333 341L366 334Q355 397 367 419Q390 441 443 464Q492 447 522 417Q526 387 518 334L552 341Q550 405 564 446Q573 491 551 529Q532 575 528 615Q529 638 556 673Q597 736 616 817Q630 889 647 953L628 962L632 979Q613 989 567 982Q538 975 530 946L497 947L496 975L434 976L431 947L357 946Q353 978 317 983Q269 989 250 976L253 959L238 954Q251 880 265 818Q279 748 317 675Q348 636 355 617Q357 590 334 544Q308 493 321 442Q331 404 333 341Z",
    fabric: (r, g, b) => b > g + 8 || (r < 125 && b > r - 13),
    detail:
      "M365 422Q398 449 442 464L491 441Q441 472 401 501L371 488Z M358 906Q425 865 466 823L503 792Q515 839 535 855L536 946H355Z",
  },
];

function trace(path: string, stroke = false) {
  const paint = stroke
    ? 'fill="none" stroke="white" stroke-width="2"'
    : 'fill="white" fill-rule="evenodd"';
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path d="${path}" ${paint}/></svg>`,
  ).render().pixels;
}

function readSource(file: string) {
  const picture = pngPixels(readFileSync(`${docs}/essais/${file}.png`));
  if (picture.width !== width || picture.height !== height)
    throw new Error(`Coordonnées natives attendues : ${file}`);
  return picture.pixels;
}

function rgb(pixels: Uint8Array, p: number): RGB {
  return [pixels[p * 4], pixels[p * 4 + 1], pixels[p * 4 + 2]];
}

const clamp = (value: number, high = 1) => Math.max(0, Math.min(high, value));
const neighbours = [-1, 1, -width, width];
const search = Array.from(
  { length: 225 },
  (_, p) => [(p % 15) - 7, Math.floor(p / 15) - 7] as const,
)
  .filter(([x, y]) => x || y)
  .sort(([x, y], [u, v]) => x * x + y * y - u * u - v * v)
  .map(([x, y]) => x + width * y);

const celesteLining = trace(
  "M310 440Q337 420 369 432Q395 439 414 450Q444 470 474 445Q507 428 526 429Q546 434 570 447L629 935Q568 946 522 933Q451 944 375 938Q307 932 260 942Z",
);
const organzaLining = trace(
  "M244 333H645V945Q583 939 532 946Q443 949 354 946Q308 943 246 940Z",
);
const organzaRear = trace(
  "M418 941Q442 944 464 940L466 970Q462 975 443 976Q428 977 416 972Z",
);
const vesperRear = trace("M428 951Q446 948 457 954L461 981Q448 984 430 981Z");
const bareNeck = readSource("02-mira");
const bareLowerThigh = readSource("07-opaline");
const hems: Partial<Record<string, string>> = {
  vesper:
    "M210 875H680V986L606 999Q544 1001 453 959L450 982H436L435 951Q350 994 279 997L210 997Z",
  mira: "M210 875H679V978L605 987Q536 997 444 995Q354 995 279 987L210 978Z",
  saturne:
    "M210 875H690V951L655 961Q630 975 576 981Q512 989 443 989Q342 989 273 978Q243 972 230 960L210 953Z",
  opaline: "M210 875H680V960L606 962Q526 967 440 965Q355 967 277 963L210 960Z",
  nyx: "M210 875H680V951L610 955Q563 960 541 962L535 919L529 963Q414 969 270 956L210 951Z",
};

/** Keep only the connected construction. Fill opaque interiors and retain the
 * openings at Mira's waist, Nyx's hem and the translucent ends. */
function keepDress(mask: Uint8Array, dress: Dress) {
  const keep = new Uint8Array(size);
  const queue = new Int32Array(size);
  let start = 0,
    end = 1;
  queue[0] = 790 * width + 443;
  keep[queue[0]] = 255;
  while (start < end) {
    const point = queue[start++];
    for (const step of neighbours) {
      const p = point + step;
      if (!mask[p] || keep[p]) continue;
      keep[p] = 255;
      queue[end++] = p;
    }
  }
  // A dark stroke or hardware inside a materially opaque panel must never
  // turn into a pinhole if it falls outside its textile colour range.
  const exterior = new Uint8Array(size);
  start = 0;
  end = 1;
  queue[0] = 0;
  exterior[0] = 1;
  while (start < end) {
    const point = queue[start++];
    for (const step of neighbours) {
      const p = point + step;
      if (p < 0 || p >= size || keep[p] || exterior[p]) continue;
      exterior[p] = 1;
      queue[end++] = p;
    }
  }
  for (let y = 290; y < 1010; y++)
    for (let x = 125; x < 760; x++) {
      const p = y * width + x;
      if (exterior[p] || (dress.id === "mira" && x > 465 && y > 570 && y < 670))
        continue;
      keep[p] = 255;
    }
  return keep;
}

function projection(sample: RGB, ground: RGB, cloth: RGB) {
  let along = 0,
    length = 0;
  for (let channel = 0; channel < 3; channel++) {
    const difference = cloth[channel] - ground[channel];
    along += (sample[channel] - ground[channel]) * difference;
    length += difference * difference;
  }
  return length > 100 ? clamp(along / length) : undefined;
}

/** Match the locally observed skin/studio matte at a real antialiased edge. */
function extractEdge(
  source: Uint8Array,
  mask: Uint8Array,
  hard: Uint8Array,
  p: number,
) {
  const sample = rgb(source, p);
  if (hard[p]) return { sample, opacity: 1 };
  const inner = search.find((step) => hard[p + step]);
  const outer = search.find(
    (step) =>
      !mask[p + step] && neighbours.every((delta) => !mask[p + step + delta]),
  );
  if (inner === undefined || outer === undefined)
    return { sample, opacity: mask[p] ? 1 : 0 };
  const ground = rgb(source, p + outer);
  const cloth = rgb(source, p + inner);
  const opacity = projection(sample, ground, cloth) ?? (mask[p] ? 1 : 0);
  // Texture or an outlined stitch can differ from the nearest interior colour
  // in the direction of the matte. Keep inner contour pixels in that case.
  if (mask[p] && opacity < 0.45) return { sample: cloth, opacity: 0.84 };
  if (opacity >= 0.985) return { sample, opacity: 1 };
  if (opacity < 0.035) return { sample, opacity: 0 };
  return { sample: unmix(sample, ground, opacity), opacity };
}

function unmix(sample: RGB, ground: RGB, opacity: number): RGB {
  return [0, 1, 2].map((c) =>
    Math.round(clamp((sample[c] - (1 - opacity) * ground[c]) / opacity, 255)),
  ) as unknown as RGB;
}

function getSheer(
  dress: Dress,
  source: Uint8Array,
  outline: Uint8Array,
  p: number,
  x: number,
  y: number,
) {
  const sample = rgb(source, p);
  if (dress.sheer === "lace") {
    const ground = y < 550 ? rgb(bareNeck, p) : rgb(bareLowerThigh, p);
    // The former hem shadow stops by the lace, so sample the unobstructed
    // thigh below it for the local skin base rather than using the same row.
    const skin =
      y < 550
        ? ground
        : rgb(bareLowerThigh, ((1000 + (y - 940) / 4) | 0) * width + x);
    const ink: RGB = [48, 34, 33];
    const opacity = projection(sample, skin, ink) ?? 0;
    if (opacity < 0.085 && (!outline[p * 4 + 3] || opacity < 0.045))
      return { sample, opacity: 0 };
    // Retain the fine botanical ink while removing skin/studio chroma from
    // its holes. Its own neutral-warm thread can be dyed independently.
    const light = clamp(24 + (1 - opacity) * 68, 115);
    return { sample: [light + 8, light, light + 4] as RGB, opacity };
  }
  // Lower organza can sit in front of skin, a slit, or studio background.
  // Choose the matte from the independent front anatomy at the same x.
  // Trace the organza against both mattes without sampling a thigh/grey
  // boundary from a different vertical coordinate. The blue component of
  // the dyed weave survives both backgrounds and gives a stable opacity.
  const [r, g, b] = sample;
  const studio = b > 167 && Math.abs(r - b) < 18 && Math.abs(g - b) < 15;
  if (studio || (r > 176 && g > 110 && r - b > 102))
    return { sample, opacity: 0 };
  const edge = outline[p * 4 + 3] / 255;
  const opacity = clamp(
    0.36 + (122 - Math.min(g, 122)) * 0.009 + Math.max(0, b - r) * 0.006,
  );
  const light = clamp((Math.min(r, b) - 103) * 0.28, 30);
  return {
    sample: [91 + light, 65 + light, 102 + light] as RGB,
    opacity: opacity * edge,
  };
}

/** Paint a narrow seam allowance where the concept is inside Iris's hip.
 * The pattern keeps the center panel, folds, and hem at their native pixels. */
function fitHipSeams(art: Uint8Array, dress: Dress) {
  const seamEnds: Record<string, number> = {
    vesper: 949,
    mira: 989,
    solstice: 909,
    celeste: 952,
    aura: 980,
    saturne: 973,
    opaline: 957,
    velvette: 941,
    nyx: 912,
    equinoxe: 935,
  };
  const end = seamEnds[dress.id];
  const original = art.slice();
  for (let y = 735; y <= end; y++) {
    for (const side of [-1, 1]) {
      const at = (x: number) => (y * width + x) * 4;
      let hemEdge = 443;
      while (original[at(hemEdge + side) + 3] > 150) hemEdge += side;
      if (Math.abs(hemEdge - 443) < 90) continue; // A cut-out or lap interrupts this row.
      let fitted = hemEdge;
      while (bodyPixels[at(fitted + side) + 3] > 140) fitted += side;
      const taper = Math.min(1, (end - y) / 5, (y - 735) / 6);
      const extra = Math.round(clamp((fitted - hemEdge) * side, 12) * taper);
      if (!extra) continue;
      for (let d = 0; d <= extra; d++) {
        const i = at(hemEdge + d * side);
        const j = at(hemEdge - (extra - d) * side);
        art.set(original.subarray(j, j + 4), i);
      }
      const outside = at(hemEdge + (extra + 1) * side);
      art.set(original.subarray(at(hemEdge), at(hemEdge) + 3), outside);
      art[outside + 3] = 130;
    }
  }
}

function isolate(dress: Dress, index: number) {
  const source = readSource(
    `${String(index + 1).padStart(2, "0")}-${dress.id}${dress.id === "aura" ? "-face" : ""}`,
  );
  const outline = trace(dress.envelope);
  const hemPath = hems[dress.id];
  const hem = hemPath && trace(hemPath);
  const detailTrace = dress.detail ? trace(dress.detail) : undefined;
  const protectedTrace = dress.protect ? trace(dress.protect) : undefined;
  const piping = dress.piping ? trace(dress.piping, true) : undefined;
  const preliminary = new Uint8Array(size);
  const sheerPixels = new Uint8Array(size);
  for (let y = 289; y < 1005; y++)
    for (let x = 120; x < 765; x++) {
      const p = y * width + x;
      const inside = outline[p * 4 + 3] >= 120;
      const near =
        inside ||
        [p - 9, p + 9, p - 9 * width, p + 9 * width].some(
          (q) => outline[q * 4 + 3] > 120,
        );
      if (!near) continue;
      const color = rgb(source, p);
      const [r, g, b] = color;
      const skinInLace = r > 128 && r - g > 32 && g - b > 13;
      const transparent =
        dress.sheer === "lace"
          ? (y < 470 || y > 928) && (!celesteLining[p * 4 + 3] || skinInLace)
          : dress.sheer === "organza" && y > 936 && !organzaLining[p * 4 + 3];
      if (dress.id === "mira" && (protectedTrace?.[p * 4 + 3] ?? 0) > 70) {
        preliminary[p] = 255;
        continue;
      }
      if (transparent) {
        if (dress.sheer === "organza" && x >= 355 && x <= 531) continue;
        if (inside || (dress.fabric(...color) && outline[p * 4 + 3] > 20)) {
          sheerPixels[p] = 1;
          preliminary[p] = 255;
        }
        continue;
      }
      const interior =
        inside &&
        [p - 10, p + 10, p - 10 * width, p + 10 * width].every(
          (q) => outline[q * 4 + 3] > 245,
        );
      const pierce = dress.id === "mira" && x > 465 && y > 569 && y < 668;
      const slit = dress.id === "nyx" && x > 526 && x < 545 && y > 907;
      if (hem && y > 907 && hem[p * 4 + 3] < 120) continue;
      if (
        dress.fabric(...color) ||
        (protectedTrace?.[p * 4 + 3] && inside) ||
        (interior && !pierce && !slit)
      )
        preliminary[p] = 255;
    }
  const mask = keepDress(preliminary, dress);
  const hard = Uint8Array.from(mask, (val, p) =>
    val &&
    neighbours.every(
      (step) => mask[p + step] && mask[p + 2 * step] && !sheerPixels[p + step],
    )
      ? 1
      : 0,
  );
  const art = new Uint8Array(size * 4),
    coverage = new Uint8Array(size * 4);
  for (let y = 288; y < 1007; y++)
    for (let x = 119; x < 766; x++) {
      const p = y * width + x,
        i = p * 4;
      if (!mask[p] && !neighbours.some((step) => mask[p + step])) continue;
      const semi = sheerPixels[p] && mask[p];
      const {
        sample: [r, g, b],
        opacity,
      } = semi
        ? getSheer(dress, source, outline, p, x, y)
        : extractEdge(source, mask, hard, p);
      const hemAlpha = hem && y > 909 ? hem[i + 3] / 255 : 1;
      const bar = (dress.id === "mira" ? protectedTrace?.[i + 3] : 0) ?? 0;
      const alpha = Math.round(Math.max(bar, opacity * hemAlpha * 255));
      if (alpha < 9) continue;
      if (bar > 70) {
        const metal = rgb(source, p);
        const sample = metal[0] - metal[2] > 48 ? [147, 151, 146] : metal;
        art.set([...sample, alpha], i);
      } else art.set([r, g, b, alpha], i);
    }
  fitHipSeams(art, dress);
  const rearTrace =
    dress.id === "equinoxe"
      ? organzaRear
      : dress.id === "vesper"
        ? vesperRear
        : undefined;
  const back = rearTrace && new Uint8Array(size * 4);
  const main = new Uint8Array(size * 4),
    detail = new Uint8Array(size * 4),
    protect = new Uint8Array(size * 4);
  const premultiplied = new Uint8Array(size * 4);
  let left = width,
    right = 0,
    top = height,
    bottom = 0;
  let detailCount = 0,
    protectedCount = 0;
  for (let y = 288; y < 1007; y++)
    for (let x = 119; x < 766; x++) {
      const p = y * width + x,
        i = p * 4;
      const alpha = art[i + 3];
      const rearAlpha = rearTrace?.[i + 3] ?? 0;
      if (back && rearAlpha) {
        // The inner lap continues behind the thighs. Sample the actual cloth
        // visible in the center slit and reconstruct the hidden side spans.
        const donorX = Math.min(448, Math.max(438, x));
        const donor = rgb(source, y * width + donorX);
        const color: RGB =
          dress.id === "vesper"
            ? [
                Math.min(99, donor[0]),
                Math.min(42, donor[1]),
                Math.min(29, donor[2]),
              ]
            : [
                Math.min(123, donor[0]),
                Math.min(93, donor[1]),
                Math.min(132, donor[2]),
              ];
        back.set([...color, rearAlpha], i);
        if (dress.id === "vesper" && x > 434 && x < 452 && y > 957)
          art.fill(0, i, i + 4);
        if (!art[i + 3]) main.fill(255, i, i + 4);
      }
      if (!art[i + 3]) continue;
      if (alpha < 9) continue;
      const [r, g, b] = rgb(art, p);
      const semi = sheerPixels[p];
      premultiplied.set(
        [(r * alpha) / 255, (g * alpha) / 255, (b * alpha) / 255, alpha],
        i,
      );
      if (!semi && alpha >= 250) coverage[i + 3] = 255;
      const secondary =
        dress.sheer === "lace"
          ? semi || (r - g < 41 && r - b < 34)
          : dress.sheer === "organza"
            ? !semi && (detailTrace?.[i + 3] ?? 0) > 120 && r > 139 && g > 104
            : (detailTrace?.[i + 3] ?? 0) > 120;
      const fixed =
        (piping?.[i + 3] ?? 0) > 126 ||
        ((protectedTrace?.[i + 3] ?? 0) > 95 &&
          (dress.id !== "aura" || (r > 98 && g > b + 18)));
      const target = fixed ? protect : secondary ? detail : main;
      target.fill(255, i, i + 4);
      detailCount += Number(secondary && !fixed);
      protectedCount += Number(fixed);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  const mainTone = measureFabricTone(premultiplied, main);
  const detailTone = detailCount
    ? measureFabricTone(premultiplied, detail)
    : undefined;
  if (
    !mainTone ||
    right - left < 325 ||
    bottom - top < 520 ||
    ((dress.detail || dress.sheer) && !detailTone)
  )
    throw new Error(`Calque ou matière incomplet : ${dress.name}`);
  const layers = [
    ["", art],
    ["-coverage", coverage],
    ["-mask", main],
    ...(back ? [["-back", back] as const] : []),
    ...(detailTone ? [["-detail-mask", detail] as const] : []),
    ...(protectedCount ? [["-protected", protect] as const] : []),
  ] as const;
  for (const [suffix, layer] of layers)
    writeFileSync(
      `${output}/${dress.id}${suffix}.png`,
      rgbaPng(width, height, layer),
    );
  return {
    id: dress.id,
    name: dress.name,
    price: 950,
    crop: [left - 5, top - 5, right - left + 11, bottom - top + 11],
    tone: { ...mainTone, depth: 0.36, sheen: dress.sheen ?? 0.18 },
    detailTone: detailTone && { ...detailTone, depth: 0.35, sheen: 0.19 },
    fittingBody: ["vesper", "velvette", "opaline"].includes(dress.id)
      ? "/assets/avatar/capsule-robes-iris-v1/comete-fitting.png"
      : undefined,
    back: Boolean(back),
    protected: protectedCount > 0,
  };
}

mkdirSync(output, { recursive: true });
const pieces = dresses.map(isolate);
writeFileSync(
  `${output}/index.json`,
  JSON.stringify(
    {
      pattern: DOLL_PATTERN.id,
      bodySha256: DOLL_PATTERN.bodySha256,
      pieces,
    },
    null,
    2,
  ) + "\n",
);
