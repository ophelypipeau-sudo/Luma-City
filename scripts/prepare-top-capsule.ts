import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { rgbaPng } from "./lib/png-rgba";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import {
  CAPSULE_TOP_ROOT,
  TOP_CAPSULE,
} from "../apps/web/src/previews/top-capsule";

const root = "public" + CAPSULE_TOP_ROOT;
const [width, height] = DOLL_PATTERN.canvas;
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Le patron d’Iris a changé.");
mkdirSync(root, { recursive: true });

const path = (d: string, attributes = "") => `<path d="${d}" ${attributes}/>`;
const stroke = (d: string, color: string, size = 2, extra = "") =>
  path(
    d,
    `fill="none" stroke="${color}" stroke-width="${size}" stroke-linecap="round" stroke-linejoin="round" ${extra}`,
  );
const mirror = (art: string) =>
  art + `<g transform="translate(887) scale(-1 1)">${art}</g>`;
const pin = (x: number, y: number, r = 4) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#metal)" stroke="#56505b" stroke-width="1"/>`;
const fold = (d: string) =>
  path(d, 'fill="url(#fold)" filter="url(#soft-fold)"');
const shimmer = (d: string) =>
  path(d, 'fill="url(#gleam)" filter="url(#soft-fold)"');
const seam = (d: string, width = 3) =>
  stroke(d, "#18101a", width, 'opacity=".52"') +
  stroke(
    d,
    "#fff8f4",
    Math.max(1, width / 2),
    'opacity=".29" transform="translate(1.5 1)"',
  );
const stitches = (d: string, tone = "#f4dec1") =>
  stroke(d, tone, 1.55, 'stroke-dasharray="2 4" opacity=".78"');

const fittedWaist =
  "Q548 545 534 583Q522 611 527 633L539 665Q443 688 347 665L360 632Q365 612 353 581Q340 547 322 515";
const shortWaist =
  "Q547 545 535 575L529 603Q443 625 356 604L350 574Q338 543 321 513";
const capSleeves = mirror(
  path(
    "M342 346Q310 337 280 359Q254 380 252 440L250 488Q282 502 317 489L333 450Z",
    'fill="url(#sleeve)" stroke="var(--edge)" stroke-width="3"',
  ) + seam("M251 480Q279 493 318 482", 2.4),
);
const longSleeves = mirror(
  path(
    "M349 346Q298 334 272 372Q255 398 253 451Q247 511 233 581Q229 609 212 632Q188 671 177 719L145 804Q161 822 187 826L226 765Q277 701 291 654Q298 631 298 606Q308 563 326 519L354 426Z",
    'fill="url(#sleeve)" stroke="var(--edge)" stroke-width="3"',
  ) +
    fold("M238 578Q257 603 292 602L285 621Q256 614 235 596Z") +
    fold("M212 656Q237 672 278 671L266 692Q227 681 207 668Z") +
    shimmer("M250 490Q262 480 280 494Q267 559 252 586L239 580Z") +
    seam("M152 793Q166 805 193 812", 2),
);
type Cut = {
  outline: string;
  surface: string;
  outside?: string;
  fixed?: string;
  thread?: string;
  textile:
    | "satin"
    | "faille"
    | "jersey"
    | "denim"
    | "leather"
    | "velvet"
    | "rib"
    | "knit";
};
const cuts: Record<(typeof TOP_CAPSULE)[number]["id"], Cut> = {
  sillage: {
    textile: "satin",
    outline:
      "M322 426Q351 425 401 407Q475 374 521 337Q542 336 558 346L563 412Q551 433 562 457Q575 488 565 516" +
      fittedWaist +
      "Q310 491 322 426Z",
    surface: [
      "M542 350Q486 430 327 475Q382 467 434 453Q508 434 546 379Z",
      "M554 423Q499 500 337 526Q437 519 502 490Q539 475 563 446Z",
      "M551 480Q492 548 354 576Q452 560 528 532L556 514Z",
      "M534 550Q468 612 362 630Q457 612 528 579Z",
      "M526 612Q453 655 356 655Q446 675 534 641Z",
    ]
      .map((d) => fold(d))
      .join(""),
    fixed:
      `<ellipse cx="544" cy="376" rx="12" ry="20" transform="rotate(26 544 376)" fill="url(#gold)" stroke="#796044" stroke-width="2"/>` +
      `<ellipse cx="544" cy="376" rx="5" ry="12" transform="rotate(26 544 376)" fill="#543f35"/>`,
  },
  ecrin: {
    textile: "faille",
    outline:
      "M323 435L341 341Q358 336 372 342L378 420Q443 443 509 420L517 342Q533 336 549 344L564 437Q573 486 565 516" +
      fittedWaist +
      "Q310 489 323 435Z",
    surface:
      mirror(
        path(
          "M328 473Q356 511 392 510Q409 572 383 670L348 665Q363 619 356 590Z",
          'fill="url(#fold)" opacity=".45"',
        ) +
          seam("M371 427Q366 484 393 510Q408 576 383 673", 4) +
          seam("M345 354Q338 406 336 455", 2),
      ) +
      seam("M377 423Q443 447 510 423", 4) +
      seam("M443 489V669", 3),
    fixed: [496, 509, 522].map((y) => pin(443, y, 3)).join(""),
  },
  orbite: {
    textile: "jersey",
    outline:
      "M320 435L344 346L358 342L345 429L366 437L374 346L384 349L382 438Q421 437 443 466Q468 439 505 436L503 349L514 345L521 438L542 430L528 345L543 347L566 437Q577 488 565 516" +
      shortWaist +
      "Q311 489 320 435Z",
    surface:
      mirror(
        Array.from({ length: 8 }, (_, index) => {
          const y = 453 + index * 12;
          return (
            stroke(
              `M327 ${y}Q382 ${y + 12} 432 ${499 + index * 3}`,
              "#43172f",
              1.7,
              'opacity=".26"',
            ) +
            stroke(
              `M330 ${y - 2}Q384 ${y + 8} 432 ${497 + index * 3}`,
              "#ffc5db",
              1.2,
              'opacity=".28"',
            )
          );
        }).join(""),
      ) + seam("M360 594Q443 612 527 594", 3),
    fixed:
      `<circle cx="443" cy="507" r="17" fill="none" stroke="#31283a" stroke-width="10"/>` +
      `<circle cx="443" cy="507" r="17" fill="none" stroke="url(#metal)" stroke-width="7"/>` +
      stroke("M437 521Q434 539 439 552M449 522Q452 538 449 549", "#e8e3ed", 2) +
      pin(439, 553, 3) +
      pin(449, 550, 3),
  },
  azur: {
    textile: "denim",
    outside: capSleeves,
    outline:
      "M310 354Q358 346 392 326Q408 367 443 418Q478 366 495 326Q530 344 577 355L568 437Q574 491 566 516" +
      shortWaist +
      "Q316 475 315 437Z",
    surface: mirror(
      path(
        "M311 359L387 327Q400 369 442 420L420 454Q362 424 319 427Z",
        'fill="url(#reverse)"',
      ) + seam("M333 470Q377 465 415 483", 2),
    ),
    thread:
      mirror(
        stitches("M324 425Q374 426 419 451L436 423") +
          stitches("M333 470Q380 465 416 482L403 520Q365 521 337 504Z") +
          stitches("M364 537Q383 579 373 605"),
      ) + stitches("M358 597Q442 617 530 598"),
    fixed:
      stroke("M443 419V610", "#53667a", 9) +
      stroke("M443 420V606", "#d5d9dd", 4, 'stroke-dasharray="2 4"') +
      `<rect x="438" y="423" width="10" height="20" rx="3" fill="url(#metal)"/>`,
  },
  obsidienne: {
    textile: "leather",
    outline:
      "M316 425Q347 413 375 419L424 447L443 456L465 446L510 419Q542 412 570 425L571 488Q571 520 550 555Q527 601 529 629L547 672L503 694L443 678L384 694L339 672L359 628Q361 596 339 550Q317 519 316 488Z",
    surface: mirror(
      path(
        "M318 426Q349 414 375 421L432 452L402 502L379 491L356 514Z",
        'fill="url(#reverse)" stroke="#19131d" stroke-width="2"',
      ) +
        seam("M330 496Q352 522 374 535Q401 576 382 674", 3) +
        shimmer("M332 520Q358 534 372 545Q382 566 385 594Q360 567 332 520Z") +
        stroke("M350 565L390 580M359 615L392 627", "#211924", 10),
    ),
    fixed:
      stroke("M445 455L441 676", "#1e1724", 9) +
      stroke("M445 456L441 674", "#c8c3ce", 3, 'stroke-dasharray="2 3"') +
      mirror(
        `<rect x="361" y="560" width="20" height="12" rx="3" transform="rotate(20 371 566)" fill="none" stroke="url(#metal)" stroke-width="4"/>` +
          pin(368, 617),
      ),
  },
  veille: {
    textile: "velvet",
    outside: longSleeves,
    outline:
      "M311 351Q369 348 399 322L399 290Q442 305 488 289L490 323Q522 348 576 351L565 516" +
      fittedWaist +
      "L312 420Z M404 346Q442 355 483 344Q479 395 445 418Q413 398 404 346Z",
    surface:
      path(
        "M315 357Q352 344 392 329L399 356Q408 398 445 424Q478 403 490 354L496 329Q529 348 575 354L565 448Q503 427 445 461Q386 429 318 447Z",
        'fill="url(#reverse)" opacity=".65"',
      ) +
      mirror(
        seam("M323 433Q373 424 415 448Q419 532 395 579Q389 624 407 671", 3),
      ) +
      seam("M400 319Q446 333 489 316", 3),
    fixed: path(
      "M443 429L451 441L443 453L435 441Z",
      'fill="url(#metal)" stroke="#b8a5c0" stroke-width="2"',
    ),
  },
  "terre-cuite": {
    textile: "rib",
    outside: capSleeves,
    outline:
      "M307 354Q361 346 393 322Q420 345 443 349Q467 345 496 322Q527 343 579 354L565 444Q575 491 565 516" +
      fittedWaist +
      "Q311 488 322 445Z",
    surface:
      mirror(
        path(
          "M395 322Q406 345 437 351L412 408L369 363Z",
          'fill="url(#reverse)" stroke="var(--edge)" stroke-width="3"',
        ) + seam("M371 363L413 407L436 356", 2),
      ) +
      path(
        "M432 354Q443 358 454 353L454 475Q442 481 432 475Z",
        'fill="url(#reverse)" opacity=".8"',
      ) +
      seam("M435 372V475M450 372V475", 2),
    fixed: [402, 427, 452].map((y) => pin(443, y, 4)).join(""),
  },
  brume: {
    textile: "knit",
    outside: longSleeves,
    outline:
      "M310 352Q360 348 389 327Q395 362 441 417Q484 364 496 327Q533 346 577 352L568 445Q575 491 565 516" +
      fittedWaist +
      "Q312 490 322 445Z",
    surface:
      path(
        "M390 325Q419 394 561 483Q528 543 359 633L345 668Q456 641 536 567Q573 527 572 473Q465 403 405 323Z",
        'fill="url(#reverse)" opacity=".6"',
      ) +
      seam("M389 329Q416 389 556 483Q509 546 359 634", 5) +
      seam("M496 330Q486 361 445 417", 4) +
      path(
        "M351 648Q444 671 532 646L541 669Q444 693 343 669Z",
        'fill="url(#reverse)"',
      ) +
      seam("M351 649Q442 672 532 648", 3),
    fixed: pin(370, 638, 6) + pin(386, 632, 4),
  },
};

const textures: Record<
  Cut["textile"],
  { tile: string; grain: number; shine: number }
> = {
  satin: { tile: "", grain: 1.3, shine: 0.7 },
  faille: {
    tile: '<path d="M0 1H8M0 5H8" stroke="#fff" stroke-opacity=".12" stroke-width=".65"/>',
    grain: 4,
    shine: 0.35,
  },
  jersey: {
    tile: '<path d="M1 0V8M5 0V8" stroke="#fff" stroke-opacity=".09" stroke-width=".6"/>',
    grain: 3,
    shine: 0.35,
  },
  denim: {
    tile: '<path d="M-4 4L4-4M-4 12L12-4M4 12L12 4" stroke="#fff" stroke-opacity=".16" stroke-width="1.1"/>',
    grain: 5,
    shine: 0.22,
  },
  leather: {
    tile: '<circle cx="1" cy="1" r=".75" fill="#000" opacity=".18"/><circle cx="5" cy="5" r="1" fill="#fff" opacity=".13"/>',
    grain: 5,
    shine: 0.9,
  },
  velvet: {
    tile: '<path d="M1 0L0 3M5 5L4 8" stroke="#fff" stroke-opacity=".09" stroke-width="1"/>',
    grain: 6,
    shine: 0.48,
  },
  rib: {
    tile: "",
    grain: 4,
    shine: 0.24,
  },
  knit: {
    tile: "",
    grain: 6,
    shine: 0.23,
  },
};
const pigment = (rgb: readonly number[], light: number) =>
  "#" +
  rgb
    .map((channel) =>
      Math.round(
        light <= 1 ? channel * light : channel + (255 - channel) * (light - 1),
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

type Crease = readonly [
  x: number,
  y: number,
  length: number,
  slope: number,
  depth: number,
];
const creases: Record<keyof typeof cuts, readonly Crease[]> = {
  sillage: [
    [419, 464, 107, -0.31, 0.24],
    [440, 507, 111, -0.32, 0.24],
    [451, 552, 96, -0.3, 0.27],
    [441, 597, 84, -0.29, 0.22],
    [432, 632, 67, -0.2, 0.16],
  ],
  ecrin: [
    [365, 489, 35, 0.28, 0.15],
    [513, 491, 33, -0.19, 0.12],
    [365, 591, 28, -0.23, 0.11],
    [520, 630, 31, 0.27, 0.12],
  ],
  orbite: [
    [421, 485, 62, 0.2, 0.2],
    [478, 480, 56, -0.24, 0.17],
    [421, 514, 66, -0.12, 0.19],
    [473, 513, 57, 0.12, 0.16],
    [423, 565, 68, -0.15, 0.16],
  ],
  azur: [
    [377, 526, 40, -0.12, 0.2],
    [502, 530, 43, 0.16, 0.21],
    [382, 575, 36, 0.26, 0.18],
    [506, 573, 36, -0.29, 0.18],
  ],
  obsidienne: [
    [385, 514, 61, 0.22, 0.24],
    [499, 514, 60, -0.25, 0.23],
    [381, 584, 35, 0.29, 0.21],
    [508, 596, 38, -0.35, 0.23],
    [453, 645, 63, -0.08, 0.17],
  ],
  veille: [
    [375, 520, 46, 0.17, 0.24],
    [515, 518, 44, -0.24, 0.25],
    [370, 586, 38, -0.22, 0.23],
    [513, 624, 44, 0.28, 0.23],
  ],
  "terre-cuite": [
    [371, 503, 39, 0.17, 0.2],
    [511, 507, 41, -0.18, 0.18],
    [382, 570, 44, -0.18, 0.19],
    [495, 621, 44, 0.11, 0.16],
  ],
  brume: [
    [425, 461, 57, 0.42, 0.18],
    [474, 498, 74, -0.14, 0.21],
    [438, 566, 83, -0.27, 0.24],
    [391, 615, 55, -0.27, 0.22],
    [504, 618, 37, 0.22, 0.16],
  ],
};

const bell = (value: number) => Math.exp(-value * value);

function textileLighting(
  x: number,
  y: number,
  cut: Cut,
  folds: readonly Crease[],
  sleeve: boolean,
) {
  const fromCenter = x - 443.5;
  if (sleeve) {
    const side = Math.min(x, 887 - x);
    const center =
      298 - Math.max(0, y - 430) * 0.33 - Math.max(0, y - 600) * 0.24;
    const cross = side - center;
    return (
      -0.19 +
      0.35 * bell((cross + 4) / 30) -
      0.2 * bell((y - 599 + 0.41 * cross) / 7) * bell(cross / 43) +
      0.11 * bell((y - 591 + 0.41 * cross) / 10) * bell(cross / 43) -
      0.11 * bell((y - 677 - 0.31 * cross) / 6) * bell(cross / 35) +
      0.1 * bell((y - 670 - 0.31 * cross) / 9) * bell(cross / 36)
    );
  }
  // Shape the bust, waist and edges in two dimensions, then paint the folds
  // where the cut pulls against an armhole, closure, wrap or hem.
  const waist = bell((y - 606) / 69);
  const edge = 112 - 27 * waist;
  const sideShadow = bell((Math.abs(fromCenter) - edge) / 26);
  const bustLight =
    bell((x - 382) / 44) * bell((y - 452) / 61) +
    0.8 * bell((x - 501) / 42) * bell((y - 454) / 61);
  const bustShadow =
    bell((y - 511 + 0.0037 * (Math.abs(fromCenter) - 53) ** 2) / 24) *
    bell((Math.abs(fromCenter) - 59) / 66);
  const drape = folds.reduce((tone, [cx, cy, length, slope, depth]) => {
    const across = x - cx;
    const offset = y - cy - across * slope - 0.0012 * across * across;
    const falloff = bell(across / length);
    return (
      tone +
      depth * falloff * (0.75 * bell((offset + 6) / 9) - bell((offset - 4) / 8))
    );
  }, 0);
  const textile = textures[cut.textile];
  return (
    -0.06 -
    0.3 * sideShadow +
    (0.28 + 0.19 * textile.shine) * bustLight -
    0.2 * bustShadow +
    0.14 * waist * bell((fromCenter + 19) / 48) +
    drape
  );
}

function fiber(x: number, y: number, cut: Cut) {
  const grain =
    (((Math.imul(y * width + x + 1, 1597334677) >>> 20) % 17) / 16 - 0.5) *
    textures[cut.textile].grain;
  const bend =
    (x - 443) * (1 - 0.1 * bell((y - 602) / 66)) + 1.7 * Math.sin(y / 23);
  if (cut.textile === "rib")
    return grain + 5 * Math.cos(bend * 1.04) + 1.6 * Math.sin(y * 2.3);
  if (cut.textile === "knit")
    return grain + 3 * Math.cos(bend * 1.15 + 0.75 * Math.cos(y * 1.54));
  if (cut.textile === "denim" || cut.textile === "faille")
    return grain + 2.2 * Math.cos((x + 1.3 * y) * 1.9);
  return grain;
}

for (const { id, rgb } of TOP_CAPSULE) {
  const cut = cuts[id];
  const texture = textures[cut.textile];
  const tint = (factor: number) => pigment(rgb, factor);
  const edge = tint(0.49);
  const fill = (name: string, stops: readonly [number, number][], attrs = "") =>
    `<linearGradient id="${name}" ${attrs}>${stops.map(([offset, light]) => `<stop offset="${offset}" stop-color="${tint(light)}"/>`).join("")}</linearGradient>`;
  const defs =
    fill("cloth", [
      [0, 0.86],
      [0.3, 1],
      [0.73, 0.99],
      [1, 0.82],
    ]) +
    fill("sleeve", [
      [0, 0.91],
      [0.48, 1],
      [1, 0.89],
    ]) +
    fill(
      "reverse",
      [
        [0, 0.75],
        [0.42, 1.15],
        [0.7, 1.07],
        [1, 0.68],
      ],
      'x2=".15" y2="1"',
    ) +
    `<filter id="soft-fold" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="4"/></filter>
    <linearGradient id="fold" x2=".08" y2="1"><stop stop-color="${tint(0.49)}" stop-opacity=".39"/><stop offset="1" stop-color="${tint(0.67)}" stop-opacity="0"/></linearGradient>
    <linearGradient id="gleam" x2=".1" y2="1"><stop stop-color="${tint(1.38)}" stop-opacity="${texture.shine * 0.62}"/><stop offset="1" stop-color="${tint(1.25)}" stop-opacity="0"/></linearGradient>
    <linearGradient id="metal" x2=".8" y2="1"><stop stop-color="#70677a"/><stop offset=".27" stop-color="#fdfbff"/><stop offset=".49" stop-color="#a59eb1"/><stop offset=".68" stop-color="#f7f3fa"/><stop offset="1" stop-color="#706879"/></linearGradient>
    <linearGradient id="gold" x2=".8" y2="1"><stop stop-color="#92613a"/><stop offset=".27" stop-color="#fff2c6"/><stop offset=".48" stop-color="#c69352"/><stop offset=".7" stop-color="#ffeac0"/><stop offset="1" stop-color="#967048"/></linearGradient>
    <pattern id="weave" width="8" height="8" patternUnits="userSpaceOnUse">${texture.tile}</pattern>
    <clipPath id="cut">${path(cut.outline, 'clip-rule="evenodd"')}</clipPath>`;
  const svg = (art: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs>${defs}</defs><g style="--edge:${edge}">${art.replaceAll("var(--edge)", edge)}</g></svg>`;
  const hem =
    id === "orbite" || id === "azur"
      ? "M361 599Q444 619 525 599"
      : id === "obsidienne"
        ? "M344 670L385 688L443 673L503 688L542 670"
        : "M352 660Q443 682 534 660";
  const fabric =
    (cut.outside ?? "") +
    path(
      cut.outline,
      `fill="url(#cloth)" fill-rule="evenodd" stroke="${edge}" stroke-width="3"`,
    ) +
    `<g clip-path="url(#cut)"><rect x="250" y="285" width="390" height="430" fill="url(#weave)"/>${cut.surface}${seam(hem, 2.2)}</g>`;
  const fixedArt =
    `<g clip-path="url(#cut)">${cut.thread ?? ""}</g>` + (cut.fixed ?? "");
  const artSvg = svg(fabric + fixedArt);
  const image = new Resvg(artSvg).render().pixels;
  const fixed = new Resvg(svg(fixedArt)).render().pixels;
  const torso = new Resvg(
    svg(path(cut.outline, 'fill="white" fill-rule="evenodd"')),
  ).render().pixels;
  const art = new Uint8Array(image.length),
    mask = new Uint8Array(image.length),
    protectedPixels = new Uint8Array(image.length);
  for (let i = 0; i < image.length; i += 4) {
    const alpha = image[i + 3];
    if (!alpha) continue;
    const hardware = fixed[i + 3] > 0;
    const boundary =
      alpha < 245 ||
      [i - 4, i + 4, i - width * 4, i + width * 4].some(
        (j) => image[j + 3] < 180,
      );
    const x = (i / 4) % width,
      y = Math.floor(i / (4 * width));
    const lighting =
      hardware || boundary
        ? 0
        : textileLighting(x, y, cut, creases[id], !torso[i + 3]);
    const grain = hardware || boundary ? 0 : fiber(x, y, cut);
    for (let c = 0; c < 3; c++) {
      const base = (image[i + c] * 255) / alpha;
      const light = lighting * (lighting < 0 ? base : 48 + (255 - base) * 0.3);
      art[i + c] = Math.max(0, Math.min(255, Math.round(base + light + grain)));
    }
    art[i + 3] = alpha;
    (hardware || boundary ? protectedPixels : mask).set(
      [255, 255, 255, 255],
      i,
    );
  }
  writeFileSync(`${root}/${id}.png`, rgbaPng(width, height, art));
  writeFileSync(`${root}/${id}-mask.png`, rgbaPng(width, height, mask));
  writeFileSync(
    `${root}/${id}-protected.png`,
    rgbaPng(width, height, protectedPixels),
  );
}
