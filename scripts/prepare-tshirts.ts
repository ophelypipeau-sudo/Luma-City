import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { DOLL_PATTERN, type Pose } from "../packages/domain/src/avatar-pattern";
import { TSHIRT_DESIGNS } from "../apps/web/src/avatar/tshirts";
import { rgbaPng } from "./lib/png-rgba";

const root = "public/assets/avatar/tshirts-v1";
const [width, height] = DOLL_PATTERN.canvas;
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256) {
  throw new Error("Le corps ne correspond plus aux repères de coupe.");
}
mkdirSync(`${root}/fitted`, { recursive: true });

type Cut = (typeof TSHIRT_DESIGNS)[number]["cut"];
type Fit = {
  scale: number;
  collarY: number;
  shoulderY: number;
  neckline?: string;
  ornament?: (x: number, y: number, r: number, g: number, b: number) => boolean;
};
const oval = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;

// Registration of the approved paintings. Use one scale for both axes;
// collar openings are traced along the painted inner seam.
const fits: Record<Cut, Fit> = {
  "bleu-ciel": {
    scale: .89, collarY: 325, shoulderY: 326,
    neckline: "M355 323 Q345 416 427 424 L443 451 L461 425 Q533 420 536 323Z",
    ornament: (x, y, r, g, b) => x > 428 && x < 453 && y > 425 && y < 542 && r > b - 2 && g > b - 13,
  },
  cerises: {
    scale: .82, collarY: 330, shoulderY: 325,
    neckline: "M359 324 C359 369 407 381 441 389 C482 383 523 362 524 324Z",
    ornament: (x, y, r, g, b) => x > 392 && x < 493 && y > 425 && y < 497 && (g < 133 || g > r),
  },
  espresso: {
    scale: .79, collarY: 340, shoulderY: 337,
    ornament: (x, y, r, g, b) => x > 535 && x < 600 && y > 338 && y < 380 && r > 108 && g > b + 9,
  },
  framboise: {
    scale: .89, collarY: 330, shoulderY: 325,
    neckline: "M368 325 C370 356 402 376 443 382 C479 379 512 357 515 325Z",
  },
  "nuit-etoilee": {
    scale: .75, collarY: 335, shoulderY: 322,
    neckline: "M344 327 C344 375 390 396 439 400 C492 397 533 369 538 327Z",
    ornament: (x, y, r, g, b) => x > 492 && y < 467 && r > 91 && g > b - 19,
  },
  peche: { scale: .82, collarY: 345, shoulderY: 323 },
  pistache: {
    scale: .72, collarY: 345, shoulderY: 315,
    neckline: "M355 335 C345 398 413 441 443 462 C462 440 534 394 537 335Z",
    ornament: (x, y, r, g, b) => x > 424 && x < 463 && y > 470 && y < 587 && r > 145 && r >= g - 2 && b > 106,
  },
  rayures: {
    scale: .68, collarY: 355, shoulderY: 320,
    neckline: "M342 342 C335 382 381 430 442 436 C496 436 537 389 542 342Z",
  },
  "rose-poudre": {
    scale: .82, collarY: 340, shoulderY: 335,
    ornament: (x, y) => oval(x, y, 442, 515, 45, 14) || oval(x, y, 441, 537, 30, 23),
  },
  "sport-prune": {
    scale: .73, collarY: 330, shoulderY: 325,
    neckline: "M342 320 C345 353 386 378 441 380 C486 379 527 354 537 320Z",
  },
};

// Each panel joins inside the armhole and retains the original painted cuff.
// The movement is a rigid rotation about the shoulder, with the torso fixed.
const rightPanel = "M560 298H850V600H616L576 542Q574 501 553 471L548 418Z";
const leftPanel = "M327 298H35V600H271L311 542Q313 501 334 471L339 418Z";
const seamAllowance = {
  right: "M535 285H850V590H622L594 544Q567 503 542 471L530 416Z",
  left: "M352 285H35V590H265L293 544Q320 503 345 471L357 416Z",
};
const sleeveChanges = {
  "hand-on-hip": [{ panel: "right", degrees: -14, x: 559, y: 354 }],
  "heart-hands": [
    { panel: "left", degrees: 6, x: 324, y: 360 },
    { panel: "right", degrees: -6, x: 560, y: 360 },
  ],
} as const;

function silhouette(cut: Cut, pose: Pose) {
  const fit = fits[cut];
  const bytes = readFileSync(`${root}/sources/${cut}.png`);
  if (bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) !== height) {
    throw new Error(`Dimensions inattendues : ${cut}`);
  }
  const dx = (1 - fit.scale) * width / 2;
  const dy = fit.shoulderY - fit.collarY * fit.scale;
  const changes = pose === "front" ? [] : sleeveChanges[pose];
  const panels = { left: leftPanel, right: rightPanel };
  const defs = `
    <mask id="neck" maskUnits="userSpaceOnUse" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="white"/>
      ${fit.neckline ? `<path d="${fit.neckline}" fill="black"/>` : ""}
    </mask>
    <g id="painting" transform="translate(${dx} ${dy}) scale(${fit.scale})">
      <image width="${width}" height="${height}" mask="url(#neck)" href="data:image/png;base64,${bytes.toString("base64")}"/>
    </g>
    <mask id="rest" maskUnits="userSpaceOnUse" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="white"/>
      ${changes.map(({ panel }) => `<path d="${panels[panel]}" fill="black"/>`).join("")}
    </mask>
    ${changes.map(({ panel }) => `<clipPath id="${panel}"><path d="${seamAllowance[panel]}"/></clipPath>`).join("")}
    <clipPath id="hip-seam">
      <path d="M533 343H585L591 414L590 454L573 490L565 511L534 515Z"/>
    </clipPath>
  `;
  const rotated = changes.map(({ panel, degrees, x, y }) =>
    `<g transform="rotate(${degrees} ${x} ${y})"><use href="#painting" clip-path="url(#${panel})"/></g>`
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>${defs}</defs>
    ${pose === "hand-on-hip" ? '<use href="#painting" clip-path="url(#hip-seam)"/>' : ""}
    ${rotated}<use href="#painting" mask="url(#rest)"/>
  </svg>`;
  return { rendered: new Resvg(svg).render(), dx, dy, changes };
}

for (const { cut } of TSHIRT_DESIGNS) {
  const fit = fits[cut];
  for (const pose of ["front", "hand-on-hip", "heart-hands"] as const) {
    const { rendered, dx, dy, changes } = silhouette(cut, pose);
    const stem = `${root}/fitted/${cut}-${pose}`;
    const art = rendered.pixels;
    const masks = {
      "mask": new Uint8Array(art.length),
      "detail-mask": new Uint8Array(art.length),
      "protected": new Uint8Array(art.length),
    };
    for (let y = 290; y < 870; y++) {
      for (let x = 150; x < 755; x++) {
        const i = (y * width + x) * 4;
        if (!art[i + 3]) continue;
        const [r, g, b] = art.subarray(i, i + 3);
        let px = x, py = y;
        const sleeve = changes.find(({ panel }) =>
          y < 520 && (panel === "right" ? x > 573 : x < 312),
        );
        if (sleeve) {
          const angle = -sleeve.degrees * Math.PI / 180;
          const u = x - sleeve.x, v = y - sleeve.y;
          px = sleeve.x + u * Math.cos(angle) - v * Math.sin(angle);
          py = sleeve.y + u * Math.sin(angle) + v * Math.cos(angle);
        }
        const sx = (px - dx) / fit.scale, sy = (py - dy) / fit.scale;
        const outline = art[i + 3] > 150 &&
          [i - 8, i + 8, i - width * 8, i + width * 8].some((edge) => art[edge + 3] < 48);
        const fixed = outline || (fit.ornament?.(sx, sy, r, g, b) ?? false);
        // The coloured bands are classified inside their own garment only.
        // Similar luminance in the background, skin or hardware is irrelevant.
        const detail =
          (cut === "sport-prune" && r > 88 && g > b + 7) ||
          (cut === "rayures" && r > b + 1 && g > b + 2);
        const zone = fixed ? "protected" : detail ? "detail-mask" : "mask";
        masks[zone].set([255, 255, 255, 255], i);
      }
    }
    writeFileSync(`${stem}.png`, rendered.asPng());
    for (const [suffix, pixels] of Object.entries(masks)) {
      if (suffix === "detail-mask" && cut !== "sport-prune" && cut !== "rayures") continue;
      writeFileSync(`${stem}-${suffix}.png`, rgbaPng(width, height, pixels));
    }
  }
}
