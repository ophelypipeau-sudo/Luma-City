import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import {
  DOLL_PATTERN,
  torsoBounds,
} from "../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./lib/png-rgba";

const root = "public/assets/avatar/minuit-polaire-v1";
const registered = "public/assets/avatar/redrawn-v1";
const [width, height] = DOLL_PATTERN.canvas;
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Patron d’Iris modifié.");
const bytes = width * height * 4;
const gradient = `<linearGradient id="pearl">
  <stop stop-color="#788399"/><stop offset=".18" stop-color="#c5ccdb"/>
  <stop offset=".35" stop-color="#f6f5fb"/><stop offset=".48" stop-color="#c8ccdb"/>
  <stop offset=".64" stop-color="#f1f1f9"/><stop offset=".82" stop-color="#c3cadc"/>
  <stop offset="1" stop-color="#81899f"/></linearGradient>
  <linearGradient id="fold" x2=".1" y2="1"><stop stop-color="#727f99" stop-opacity=".78"/>
  <stop offset="1" stop-color="#737e91" stop-opacity="0"/></linearGradient>
  <linearGradient id="fur" x2=".1" y2="1"><stop stop-color="#e5ebf8"/>
  <stop offset=".39" stop-color="#f8f9fe"/><stop offset="1" stop-color="#8792aa"/></linearGradient>
  <linearGradient id="metal" x2=".8" y2="1"><stop stop-color="#57627b"/><stop offset=".26" stop-color="#fff"/>
  <stop offset=".48" stop-color="#8f9eb6"/><stop offset=".68" stop-color="#f3f6fc"/><stop offset="1" stop-color="#626e85"/></linearGradient>`;
const render = (art: string, defs = "") =>
  new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs>${gradient}${defs}</defs>${art}</svg>`,
  ).render().pixels;
const path = (d: string, attributes = "") => `<path d="${d}" ${attributes}/>`;
const read = (name: string) =>
  pngPixels(readFileSync(`${registered}/${name}.png`)).pixels;
const save = (name: string, data: Uint8Array) =>
  writeFileSync(`${root}/${name}.png`, rgbaPng(width, height, data));

/** Compose artwork and retain disjoint dye regions in the native body coordinates. */
function writePiece(
  name: string,
  main: Uint8Array,
  detail?: Uint8Array,
  metal?: Uint8Array,
) {
  const art = new Uint8Array(bytes);
  const dye = new Uint8Array(bytes);
  const accent = new Uint8Array(bytes);
  const fixed = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i += 4) {
    const color = metal?.[i + 3] ? metal : detail?.[i + 3] ? detail : main;
    if (!color) continue;
    const alpha = color[i + 3];
    if (!alpha) continue;
    for (let c = 0; c < 3; c++)
      art[i + c] = Math.round((color[i + c] * 255) / alpha);
    art[i + 3] = alpha;
    const edge =
      alpha < 240 ||
      [i - 4, i + 4, i - width * 4, i + width * 4].some(
        (at) => !main[at + 3] && !detail?.[at + 3],
      );
    const region =
      color === metal || edge ? fixed : color === detail ? accent : dye;
    region.set([255, 255, 255, 255], i);
  }
  save(name, art);
  save(name + "-mask", dye);
  save(name + "-protected", fixed);
  if (detail) save(name + "-detail-mask", accent);
}

const torso =
  "M309 448Q443 422 578 448L566 508Q543 556 526 605Q519 626 534 646L548 670Q443 704 338 670L352 646Q367 626 360 605Q346 559 321 509Z";
const topCloth = render(
  path(torso, 'fill="url(#pearl)" stroke="#6f788d" stroke-width="3"') +
    `<g clip-path="url(#torso)">${[
      "M321 470Q426 529 566 471L556 508Q436 552 328 501Z",
      "M351 534Q432 558 557 522Q483 577 369 574Z",
      "M367 607Q431 618 528 588Q461 640 369 636Z",
      "M351 653Q450 673 538 637L545 659Q456 688 351 670Z",
    ]
      .map((fold) => path(fold, 'fill="url(#fold)"'))
      .join("")}</g>` +
    [false, true]
      .map(
        (mirror) =>
          `<g ${mirror ? 'transform="translate(887) scale(-1 1)"' : ""}>` +
          path(
            "M365 465Q362 514 393 555Q422 606 396 683",
            'fill="none" stroke="#748097" stroke-width="4"',
          ) +
          path(
            "M369 465Q367 514 398 554Q426 606 401 683",
            'fill="none" stroke="#fafbff" stroke-width="2"',
          ) +
          path(
            "M375 466Q372 514 403 554Q432 606 407 682",
            'fill="none" stroke="#7e8ca5" stroke-width="1" stroke-dasharray="2 4"',
          ) +
          "</g>",
      )
      .join(""),
  `<clipPath id="torso">${path(torso)}</clipPath>`,
);

const collarShape =
  "M234 415Q240 386 274 375Q294 372 321 390Q379 420 443 432Q510 418 562 390Q588 374 612 375Q650 389 658 417Q676 460 649 500Q620 522 584 511Q514 497 443 506Q374 499 301 513Q262 520 236 497Q215 469 234 415Z";
let seed = 30;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const hairs = Array.from({ length: 2850 }, () => {
  const x = 218 + random() * 450;
  const y = 374 + random() * 147;
  const direction = (x - 443) / 20;
  const reach = 7 + random() * 30;
  const tint = ["#fff", "#dbe3f2", "#8e9ab5", "#bbc9e2"][
    Math.floor(random() * 4)
  ];
  return path(
    `M${x} ${y}q${direction * 0.6} ${reach * 0.34} ${direction} ${reach}`,
    `stroke="${tint}" stroke-width="${0.5 + random() * 1.5}" opacity="${0.25 + random() * 0.52}" fill="none"`,
  );
}).join("");
const collar = render(
  path(collarShape, 'fill="url(#fur)" stroke="#8691a7" stroke-width="2"') +
    `<g clip-path="url(#collar)">${hairs}</g>`,
  `<clipPath id="collar">${path(collarShape)}</clipPath>`,
);

for (const pose of ["front", "hand-on-hip", "heart-hands"]) {
  const existing = read(pose === "front" ? "snow-top" : "snow-top-" + pose);
  const silk = new Uint8Array(topCloth);
  const fur = new Uint8Array(collar);
  for (let y = 380; y < 855; y++) {
    const [left, right] = torsoBounds(y, -8);
    for (let x = 125; x < 760; x++) {
      const i = (y * width + x) * 4;
      const alpha = existing[i + 3];
      if (pose === "heart-hands" && y < 503 && !alpha) fur.fill(0, i, i + 4);
      if (
        y < 487 ||
        !alpha ||
        (x >= left && x <= right && pose !== "heart-hands")
      )
        continue;
      if (pose === "heart-hands" && x >= left && x <= right) continue;
      const light =
        (existing[i] + existing[i + 1] + existing[i + 2]) / (3 * alpha);
      // Keep the fold relief of the registered sleeve, with a cool satin response.
      silk.set(
        [
          alpha * light ** 1.24 * 0.93,
          alpha * light ** 1.17 * 0.97,
          alpha * light ** 1.02,
          alpha,
        ],
        i,
      );
    }
  }
  writePiece(pose === "front" ? "haut" : "haut-" + pose, silk, fur);
}

const shorts =
  "M326 680Q442 708 560 680Q590 717 607 772Q624 815 629 865Q546 863 456 894L443 879L431 894Q342 863 257 865Q261 810 280 766Q296 717 326 680Z";
const waistband = "M326 680Q443 708 560 680L577 710Q444 744 308 710Z";
const crescent =
  "M459 697C433 685 420 707 423 723C426 743 453 749 465 727C449 737 436 728 437 715C438 703 448 697 459 697Z";
writePiece(
  "short",
  render(
    path(shorts, 'fill="url(#pearl)" stroke="#778098" stroke-width="3"') +
      path(waistband, 'fill="#c9d2e5" stroke="#78859d" stroke-width="2"') +
      `<g clip-path="url(#short)">` +
      [false, true]
        .map(
          (mirror) =>
            `<g ${mirror ? 'transform="translate(887) scale(-1 1)"' : ""}>` +
            path(
              "M282 762Q352 759 430 837Q367 805 275 804Z",
              'fill="url(#fold)"',
            ) +
            path(
              "M267 845Q345 837 430 878L434 890Q340 859 263 860Z",
              'fill="#9eabc5" opacity=".65"',
            ) +
            path(
              "M348 719Q316 767 307 847M358 722Q328 767 320 851M264 849Q343 847 430 882",
              'fill="none" stroke="#7e89a1" stroke-width="2"',
            ) +
            path(
              "M351 721Q321 764 311 846M266 852Q343 851 428 884",
              'fill="none" stroke="#fbfcff" stroke-width="1.6"',
            ) +
            "</g>",
        )
        .join("") +
      path(
        "M443 725Q435 778 443 879M451 742V805Q451 824 440 830",
        'stroke="#7f8ca3" stroke-width="2" fill="none"',
      ) +
      "</g>",
    `<clipPath id="short">${path(shorts)}</clipPath>`,
  ),
  undefined,
  render(
    path(crescent, 'fill="url(#metal)" stroke="#68758d" stroke-width="1.5"'),
  ),
);

const knit = read("snow-warmers");
const pumps = read("pumps");
const silverTrim = read("pumps-protected");
for (let i = 0; i < bytes; i += 4) {
  const x = (i / 4) % width;
  const y = Math.floor(i / 4 / width);
  const coldRib = Math.sin(x * 0.47 + Math.sin(y * 0.034) * 0.44);
  knit[i] *= 0.92 + coldRib * 0.034;
  knit[i + 1] *= 0.96 + coldRib * 0.032;
  knit[i + 2] *= 0.995;
  // Silver piping over the upper rim; the main panel remains dyeable.
  silverTrim[i + 3] =
    y >= 1690 && y <= 1722 && silverTrim[i + 3] ? pumps[i + 3] : 0;
  if (silverTrim[i + 3]) silverTrim.set(pumps.subarray(i, i + 4), i);
  pumps[i] *= 0.93;
  pumps[i + 1] *= 0.965;
}
writePiece("guetres", knit);
writePiece("escarpins", pumps, undefined, silverTrim);
