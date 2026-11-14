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

// Paint extra cloth into the side seams using the local fabric grain.
// Keep the existing print, folds and placement of the center panel.
function fitSideSeams(
  art: Uint8Array,
  material: Uint8Array,
  coverage: Uint8Array,
  lastRow: number,
  firstRow = 730,
  skirtGuide?: string,
) {
  const guide = skirtGuide && render(`<path d="${skirtGuide}" fill="white"/>`);
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
      if (guide) {
        let guideEdge = 443;
        while (guide[row + (guideEdge + side) * 4 + 3] > 128) guideEdge += side;
        if (side * (guideEdge - boundary) > 0) boundary = guideEdge;
      }
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
      (dress.id === "oblique" && (py < 470 || (px < 240 && py > 770) || py > 1210));
    if (skin && isSkinZone) continue;
    if (dress.id === "comete" && cometeRing) {
      const opening = Math.hypot((px - 444) / 13.7, (py - 607) / 13.5);
      alpha = Math.round(alpha * Math.max(0, Math.min(1, (opening - 1) * 13)));
      if (alpha < 8) continue;
    }
    const green = g - Math.max(r, b);
    if (green > 86 && g > 173) continue;
    const spill = green > 63 && g > 140;
    const edgeGreen = dress.id === "rivoli" && green > 4;
    art.set([r, edgeGreen ? Math.max(r, b) : spill ? Math.max(r, b) + 35 : g, b, alpha], i);
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
  if (dress.id === "terrasse" || dress.id === "origami")
    fitSideSeams(
      cleaned,
      material,
      coverage,
      dress.id === "terrasse" ? 1000 : 1397,
      dress.id === "terrasse" ? 668 : 730,
      dress.id === "terrasse"
        ? "M331 668C301 713 276 765 266 818C255 873 254 948 243 1000H635C626 949 634 875 624 817C614 751 580 704 550 668Z"
        : undefined,
    );
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
