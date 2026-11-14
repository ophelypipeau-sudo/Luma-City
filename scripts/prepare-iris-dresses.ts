import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { measureFabricTone } from "../packages/domain/src/atelier-color";
import { rgbaPng } from "./lib/png-rgba";
import { removeOpaqueWhiteMatte } from "./lib/asset-edges";
import { nativeRgba } from "./lib/png-native";

const docs = "docs/capsule-robes-iris-v1";
const output = "public/assets/avatar/capsule-robes-iris-v1";
const [width, height] = DOLL_PATTERN.canvas;
const base = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(base).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Le mannequin ne correspond pas au patron d’Iris.");
const { pixels: body } = nativeRgba(base);
const { pixels: strapless } = nativeRgba(
  readFileSync("public/assets/avatar/leopard-v1/underwear-strapless.png"),
);
const dressIds = new Set(["rivoli", "maree", "belladone", "grand-soir", "armature", "aubepine", "terrasse"]);

function coverBra(art: Uint8Array, material: Uint8Array, coverage: Uint8Array) {
  const original = art.slice();
  const at = (x: number, y: number) => (y * width + x) * 4;
  for (let y = 405; y <= 550; y++) {
    for (let x = 310; x <= 580; x++) {
      const i = at(x, y);
      const [r, g, b, alpha] = strapless.subarray(i, i + 4);
      if (alpha < 150 || b < g + 9 || b < r - 15 || original[i + 3] >= 250) continue;
      // Match the closest opaque cloth, with a small inset to avoid sampling its ink edge.
      let donor = -1;
      for (let d = 1; d <= 50 && donor < 0; d++) {
        const inward = x < 443 ? d : -d;
        for (const k of [at(x + inward, y), at(x, y + d), at(x, y - d)]) {
          if (original[k + 3] < 250 || material[k + 3] < 250) continue;
          donor = k;
          break;
        }
      }
      if (donor < 0) continue;
      art.set(original.subarray(donor, donor + 3), i);
      art[i + 3] = 255;
      material.fill(255, i, i + 4);
      coverage[i + 3] = 255;
    }
  }
}

// Paint extra cloth into the side seams using the local fabric grain.
// Keep the existing print, folds and placement of the center panel.
function fitSideSeams(
  art: Uint8Array,
  material: Uint8Array,
  coverage: Uint8Array,
  lastRow: number,
  firstRow = 730,
) {
  for (let y = firstRow; y <= lastRow; y++) {
    const row = y * width * 4;
    for (const side of [-1, 1]) {
      let edge = Math.floor(width / 2);
      while (art[row + (edge + side) * 4 + 3] > 16) edge += side;
      let boundary = edge;
      // Stop at the first gap so the resting arms cannot extend the seam.
      for (
        let x = edge + side;
        x >= 248 && x <= 638 && body[row + x * 4 + 3] >= 64;
        x += side
      )
        boundary = x;
      if (boundary === edge) continue;
      for (let x = edge; x !== boundary + side; x += side) {
        const distance = Math.abs(x - edge);
        const donor = row + (edge - side * (4 + distance)) * 4;
        const pixel = row + x * 4;
        art.set(art.subarray(donor, donor + 3), pixel);
        art[pixel + 3] = 255;
        material.fill(255, pixel, pixel + 4);
        coverage[pixel + 3] = 255;
      }
    }
  }
}

// Guide the side seams outside Iris's hips and thighs, preserving the center folds.
function smoothTerrasseSkirt(art: Uint8Array, material: Uint8Array, coverage: Uint8Array) {
  const original = art.slice();
  const guide = render('<path fill="white" d="M360 602C363 635 335 665 305 714C272 768 253 816 251 872C247 994 222 1145 190 1350H696C664 1145 639 994 635 872C633 816 614 768 581 714C551 665 523 635 526 602Z"/>');
  for (let y = 603; y < 1350; y++) {
    const row = y * width * 4;
    for (const side of [-1, 1]) {
      let edge = 443;
      while (original[row + (edge + side) * 4 + 3] > 96) edge += side;
      let target = 443;
      while (guide[row + (target + side) * 4 + 3] > 128) target += side;
      if ((target - edge) * side <= 0) continue;
      const inset = edge - side * 72;
      for (let x = inset; x !== target + side; x += side) {
        const i = row + x * 4;
        const sourceX = inset + (x - inset) * (edge - side * 2 - inset) / (target - inset);
        const donor = row + Math.round(sourceX) * 4;
        art.set(original.subarray(donor, donor + 3), i);
        art[i + 3] = 255;
        material.fill(255, i, i + 4);
        coverage[i + 3] = 255;
      }
    }
  }
}

// Repaint the satin side panels to the measured bust and hip contours.
function fitCometePanels(art: Uint8Array, material: Uint8Array, coverage: Uint8Array) {
  const original = art.slice();
  const guides = [
    { from: 430, to: 568, path: "M339 430C324 449 315 475 320 498C328 528 344 551 358 568H528C542 551 558 528 566 498C571 475 562 449 547 430Z" },
    { from: 821, to: 909, path: "M266 821C261 849 258 880 259 906Q443 912 627 906C628 880 625 849 620 821Z" },
  ];
  for (const { from, to, path } of guides) {
    const panel = render(`<path d="${path}" fill="white"/>`);
    for (let y = from; y <= to; y++) {
      const row = y * width * 4;
      for (const side of [-1, 1]) {
        const seed = y < 474 ? 443 + side * 75 : 443;
        if (original[row + seed * 4 + 3] < 128 && y < 821) continue;
        let edge = seed;
        while (original[row + (edge + side) * 4 + 3] > 160) edge += side;
        let target = seed;
        while (panel[row + (target + side) * 4 + 3] > 32) target += side;
        if ((target - edge) * side < 1 && y < 821) continue;
        const inset = y >= 821 ? 443 : edge - side * 23;
        for (let x = inset; (target - x) * side >= 0; x += side) {
          const i = row + x * 4;
          const alpha = panel[i + 3];
          if (!alpha || (art[i + 3] >= alpha && Math.abs(x - edge) > 23)) continue;
          const sourceX = inset + (x - inset) * Math.max(0, Math.abs(edge - inset) - 3) / Math.max(1, Math.abs(target - inset));
          let donor = row + Math.round(sourceX) * 4;
          if (original[donor + 3] < 230) {
            const donorY = y - 10;
            const donorX = Math.round(sourceX) - side * 9;
            donor = (donorY * width + donorX) * 4;
          }
          if (original[donor + 3] < 200) continue;
          art.set(original.subarray(donor, donor + 3), i);
          art[i + 3] = Math.max(art[i + 3], alpha);
          material.fill(255, i, i + 4);
          coverage[i + 3] = art[i + 3] > 246 ? 255 : 0;
        }
      }
    }
  }
}

function writeCometeFittingBody() {
  const fitted = strapless.slice();
  const at = (x: number, y: number) => (y * width + x) * 4;
  for (let x = 305; x <= 585; x++) {
    let first = 555;
    let last = 410;
    for (let y = 410; y <= 555; y++) {
      const [r, g, b, a] = strapless.subarray(at(x, y), at(x, y) + 4);
      if (a < 170 || b < g + 8 || b < r - 15) continue;
      first = Math.min(first, y);
      last = Math.max(last, y);
    }
    if (first > last) continue;
    const top = first - 15;
    const bottom = last + 17;
    const upper = at(x, top);
    const lower = at(x, bottom);
    const skinSample = (index: number, y: number) => {
      const outward = x < 443 ? -1 : 1;
      for (let d = 0; d < 42; d++) {
        const k = at(x + outward * d, y);
        if (strapless[k + 3] > 180 && strapless[k] > strapless[k + 2] + 35) return k;
      }
      return index;
    };
    const topSkin = skinSample(upper, top);
    const bottomSkin = skinSample(lower, bottom);
    for (let y = top; y <= bottom; y++) {
      const pixel = at(x, y);
      const t = (y - top) / (bottom - top);
      const r = strapless[pixel], b = strapless[pixel + 2];
      // Preserve existing skin and ink at the armhole where they are already clean.
      const neckline = Math.min(1, Math.max(0, (100 - Math.abs(x - 443)) / 25));
      const edgeBlend = Math.min(1, Math.max(0, (b - r + 42) / 28))
        * Math.min(1, (y - top) / 7, (bottom - y) / 7);
      const amount = neckline + (1 - neckline) * edgeBlend;
      for (let c = 0; c < 3; c++) {
        const skin = strapless[topSkin + c] * (1 - t) + strapless[bottomSkin + c] * t;
        fitted[pixel + c] = Math.round(strapless[pixel + c] * (1 - amount) + skin * amount);
      }
    }
  }
  writeFileSync(`${output}/comete-fitting.png`, rgbaPng(width, height, fitted));
}

type Dress = {
  id: string;
  name: string;
  outline: string;
  center?: number;
  scale?: number;
  shift?: number;
  detail?: string;
  sheen?: number;
};
const dresses: Dress[] = [
  {
    id: "rivoli",
    name: "Rivoli",
    outline:
      "M344 344L370 337L365 435Q443 454 521 437L520 338L546 345Q548 413 559 456Q574 498 552 530Q524 590 530 626C588 688 621 777 623 850Q626 900 613 970Q444 979 272 970Q261 917 263 860C265 775 302 694 357 628Q368 596 336 529Q316 499 325 458Q340 412 344 344Z",
  },
  {
    id: "comete",
    name: "Comète",
    outline:
      "M398 326L406 317Q395 354 376 401Q364 438 445 471Q526 432 509 395L479 317L488 325Q520 359 550 426Q576 469 552 514L529 568Q500 570 463 604Q483 626 554 659C581 701 627 786 620 908Q443 918 264 908C262 804 293 719 332 659Q402 629 424 604Q381 569 357 570L332 506Q315 470 329 422Q356 365 398 326Z",
    detail: "M444 588a25 25 0 1 0 0 50a25 25 0 1 0 0-50Z",
    sheen: 0.46,
  },
  {
    id: "maree",
    name: "Marée",
    scale: 1.035,
    shift: -21,
    outline:
      "M349 343L357 342L346 420Q398 447 443 469Q491 447 539 420L530 342L537 344L549 423Q568 468 563 507Q535 578 530 625C597 705 632 791 619 903C602 1026 559 1055 589 1204Q605 1325 641 1399Q635 1416 602 1422Q613 1440 530 1449Q442 1477 348 1440Q268 1446 243 1398Q287 1247 297 1133Q306 1038 276 936Q245 790 360 627Q364 591 334 514Q309 465 336 421Z",
    sheen: 0.55,
  },
  {
    id: "belladone",
    name: "Belladone",
    outline:
      "M400 292Q441 308 483 292Q479 326 519 335Q554 348 584 348Q610 356 624 403Q628 470 642 529Q647 570 668 609Q692 644 706 703Q721 761 748 839Q727 817 702 844Q690 801 654 748Q612 688 597 647Q578 569 554 505Q538 562 529 605Q522 625 545 655C617 741 643 831 608 962Q558 1108 578 1179Q610 1252 591 1422Q451 1451 291 1424C291 1382 277 1300 295 1232Q328 1163 306 1074C286 972 242 911 262 818Q278 720 351 639Q369 614 350 562L329 504Q308 563 291 642Q281 685 243 737Q202 801 185 841Q168 818 138 832Q170 757 186 694Q199 640 228 605Q252 550 253 492Q249 397 273 365Q286 349 324 346Q399 339 400 292Z M443 350Q417 411 442 466Q469 409 443 350Z",
    sheen: 0.29,
  },
  {
    id: "grand-soir",
    name: "Grand Soir",
    scale: 1.035,
    shift: -21,
    outline:
      "M251 421Q310 401 443 448Q563 403 628 420L635 538Q584 530 548 507Q519 563 523 624C608 717 628 793 611 932Q568 1094 587 1230Q613 1506 699 1658Q716 1681 620 1695Q612 1720 483 1704Q466 1723 384 1704Q298 1716 245 1693Q165 1683 177 1659C210 1617 253 1424 284 1267Q318 1119 294 1039C276 953 250 891 273 782Q290 709 359 625Q368 570 321 507Q296 527 244 537Z",
    sheen: 0.45,
  },
  {
    id: "armature",
    name: "Armature",
    outline:
      "M325 444Q356 408 442 461Q523 411 550 444Q575 479 545 530Q518 592 523 624Q551 677 582 699Q619 730 626 796Q652 833 644 883Q641 897 626 906Q628 944 609 982Q561 956 532 952L349 952Q306 980 278 980Q259 942 259 902Q234 886 243 847Q244 815 261 790Q253 737 300 704Q333 683 359 623Q366 592 340 537Q312 485 325 444Z",
  },
  {
    id: "aubepine",
    name: "Aubépine",
    outline:
      "M230 520Q252 512 239 494Q216 476 227 429Q244 367 271 346Q302 322 339 342L365 343Q348 411 359 444Q400 436 444 460Q488 443 527 443Q537 415 520 343L547 342Q584 317 610 345Q650 376 655 435Q669 479 624 499L643 517Q618 536 563 544L550 506Q531 574 523 613C601 686 616 778 635 873Q659 1053 740 1315L746 1344Q706 1355 688 1377Q662 1396 623 1374Q606 1404 561 1388Q536 1397 509 1379Q480 1416 441 1398Q408 1416 388 1383Q346 1399 323 1383Q304 1401 265 1382Q221 1398 203 1369Q172 1381 149 1351L143 1339Q203 1130 243 890C262 776 303 684 357 622Q371 592 330 510L321 541Q269 541 230 520Z",
  },
  {
    id: "oblique",
    name: "Oblique",
    scale: 1.035,
    shift: -21,
    outline:
      "M354 340Q384 378 474 403Q535 425 557 449Q574 474 553 519Q518 588 529 627C577 690 626 762 617 865Q607 953 596 1043Q583 1120 592 1226Q542 1280 456 1329L287 1446Q293 1409 283 1373C273 1293 300 1185 302 1092Q295 1031 296 1011C279 931 255 857 272 792Q284 701 359 630Q368 610 328 503C315 553 303 598 291 643Q278 680 249 729Q199 811 188 838Q176 817 148 816Q173 743 195 683Q207 642 230 604Q252 552 257 465Q253 378 301 350Z",
    sheen: 0.35,
  },
  {
    id: "terrasse",
    name: "Terrasse",
    outline:
      "M395 311Q416 347 443 359Q466 341 490 310Q516 340 542 347Q598 346 616 373Q627 405 632 495Q601 513 561 508Q541 573 523 610Q526 632 548 666C600 735 617 832 626 933Q659 1172 698 1368Q695 1392 619 1390Q623 1422 507 1410Q473 1432 426 1411Q374 1427 268 1409L266 1389Q202 1399 186 1373Q220 1176 249 955C263 820 289 720 337 656Q377 615 353 573L324 507Q285 517 247 497Q253 427 268 381Q279 352 340 349Q369 347 395 311Z",
    detail:
      "M432 383a11 11 0 1 0 22 0a11 11 0 1 0-22 0Z M432 422a11 11 0 1 0 22 0a11 11 0 1 0-22 0Z M433 464a11 11 0 1 0 22 0a11 11 0 1 0-22 0Z",
  },
  {
    id: "origami",
    name: "Origami",
    scale: 1.075,
    shift: -36,
    outline:
      "M333 348Q450 363 550 348Q545 399 557 444Q566 478 549 520Q520 590 525 620Q573 671 601 748Q632 788 607 811C609 910 584 961 566 1061Q552 1159 577 1338Q450 1364 305 1338Q324 1215 317 1129Q316 1033 292 958Q266 872 276 804Q259 787 260 766Q290 729 305 691L359 619Q365 583 334 508Q320 476 325 444Q342 391 333 348Z",
    sheen: 0.28,
  },
];

function render(content: string) {
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${content}</svg>`,
  ).render().pixels;
}

mkdirSync(output, { recursive: true });
writeCometeFittingBody();
const pieces = dresses.map((dress, index) => {
  const file = `${docs}/sources/${String(index + 1).padStart(2, "0")}.png`;
  const source = readFileSync(file);
  const w = source.readUInt32BE(16);
  const h = source.readUInt32BE(20);
  const scale = dress.scale ?? 1;
  const x = 443.5 - (dress.center ?? w / 2) * scale;
  const transform = `translate(${x} ${dress.shift ?? 0}) scale(${scale})`;
  const pixels =
    render(`<defs><clipPath id="dress"><path d="${dress.outline}" clip-rule="evenodd"/></clipPath></defs>
    <g transform="${transform}"><image width="${w}" height="${h}" clip-path="url(#dress)" href="data:image/png;base64,${source.toString("base64")}"/></g>`);
  const detail =
    dress.detail &&
    render(`<path transform="${transform}" d="${dress.detail}" fill="white"/>`);
  const art = new Uint8Array(pixels.length);
  const material = new Uint8Array(pixels.length);
  const fixed = new Uint8Array(pixels.length);
  const coverage = new Uint8Array(pixels.length);
  let left = width,
    right = 0,
    top = height,
    bottom = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    let alpha = pixels[i + 3];
    if (alpha < 8) continue;
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]].map((v) =>
      Math.min(255, Math.round((v * 255) / alpha)),
    );
    // Studio key can be captured in opaque pixels at the edge of the trace.
    const px = (i / 4) % width;
    const py = Math.floor(i / 4 / width);
    const cometeRing = ((px - 444) / 25) ** 2 + ((py - 611) / 24) ** 2 < 1;
    const skin = r > 90 && r - g > 15 && g - b > 7 && g > r * 0.43;
    const isSkinZone =
      (dress.id === "comete" && (py < 685 && !cometeRing)) ||
      (dress.id === "rivoli" && (py < 455 || py > 948)) ||
      (dress.id === "oblique" && (py < 470 || (px < 240 && py > 770) || py > 1210)) ||
      (dress.id === "maree" && (py < 490 || py > 1325)) ||
      (dress.id === "armature" && (py < 490 || py > 910)) ||
      (dress.id === "belladone" && ((py < 480 && px > 405 && px < 480) || py > 1350));
    if (skin && isSkinZone) continue;
    if (dress.id === "comete" && cometeRing) {
      const opening = Math.hypot((px - 444) / 13.7, (py - 607) / 13.5);
      alpha = Math.round(alpha * Math.max(0, Math.min(1, (opening - 1) * 13)));
      if (alpha < 8) continue;
    }
    const green = g - Math.max(r, b);
    if (green > 86 && g > 173) continue;
    const spill = green > 63 && g > 140;
    const edgeGreen = ["rivoli", "grand-soir", "terrasse"].includes(dress.id) && green > 4;
    if (dress.id === "terrasse" && g > r * 0.88 && g > b + 5) {
      // The oatmeal knit is warm throughout; restore its red/green balance at the keyed edge.
      art.set([r, Math.max(0, Math.round(0.81 * r + 2)), Math.min(b, Math.round(0.63 * r)), alpha], i);
    } else {
      art.set([r, edgeGreen ? Math.max(r, b) : spill ? Math.max(r, b) + 35 : g, b, alpha], i);
    }
    if (alpha > 246) coverage[i + 3] = 255;
    const protectedDetail =
      detail && detail[i + 3] > 120 && (dress.id !== "terrasse" || g < 133);
    (protectedDetail ? fixed : material).fill(255, i, i + 4);
    left = Math.min(left, px);
    right = Math.max(right, px);
    top = Math.min(top, py);
    bottom = Math.max(bottom, py);
  }
  const tone = measureFabricTone(pixels, material);
  if (!tone || right - left < 290 || bottom - top < 500)
    throw new Error(`Détourage incomplet : ${dress.name}`);
  const cleaned = removeOpaqueWhiteMatte(width, height, art).pixels;
  if (dressIds.has(dress.id)) coverBra(cleaned, material, coverage);
  if (dress.id === "comete") {
    fitSideSeams(cleaned, material, coverage, 906, 755);
    fitCometePanels(cleaned, material, coverage);
  }
  if (dress.id === "belladone") fitSideSeams(cleaned, material, coverage, 1418, 1190);
  if (dress.id === "terrasse") smoothTerrasseSkirt(cleaned, material, coverage);
  if (dress.id === "origami") fitSideSeams(cleaned, material, coverage, 1397);
  for (const [suffix, layer] of [
    ["", cleaned],
    ["-mask", material],
    ...(dress.detail ? [["-protected", fixed] as const] : []),
    ["-coverage", coverage],
  ] as const)
    writeFileSync(
      `${output}/${dress.id}${suffix}.png`,
      rgbaPng(width, height, layer),
    );
  return {
    id: dress.id,
    name: dress.name,
    price: 950,
    crop: [left - 4, top - 4, right - left + 9, bottom - top + 9],
    tone: { ...tone, depth: 0.36, sheen: dress.sheen ?? 0.18 },
  };
});
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
