import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pngPixels } from "../apps/server/src/atelier-images";
import {
  DOLL_PATTERN,
  torsoBounds,
} from "../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./lib/png-rgba";

const [width, height] = DOLL_PATTERN.canvas;
const artFolder = "docs/essai-mode-imagegen";
const destination = "public/assets/avatar/approved-tops-v1";
const bodyFile = "public/assets/avatar/fashion-v2/body-user.png";
const bodyBytes = readFileSync(bodyFile);
if (
  createHash("sha256").update(bodyBytes).digest("hex") !==
  DOLL_PATTERN.bodySha256
)
  throw new Error("Le mannequin original ne correspond plus au patron.");
mkdirSync(destination, { recursive: true });

type Cut = "y2k-mcbling" | "dark-feminine" | "glamour-contemporain";
type Pose = "front" | "hand-on-hip" | "heart-hands";
const laceButtons = {
  front: [
    [501, 438],
    [501, 469],
    [488, 502],
    [474, 532],
    [461, 563],
    [457, 598],
    [470, 634],
    [483, 666],
    [486, 698],
    [472, 730],
    [167, 803],
    [159, 826],
    [716, 803],
    [724, 826],
  ],
  "hand-on-hip": [
    [501, 432],
    [499, 465],
    [487, 497],
    [474, 527],
    [460, 557],
    [454, 591],
    [466, 629],
    [478, 662],
    [479, 690],
    [164, 801],
    [156, 824],
    [644, 657],
    [632, 669],
  ],
  "heart-hands": [
    [494, 483],
    [483, 510],
    [470, 537],
    [459, 566],
    [452, 597],
    [464, 630],
    [475, 658],
    [478, 686],
    [466, 714],
    [324, 474],
    [313, 492],
    [559, 474],
    [569, 492],
  ],
} satisfies Record<Pose, number[][]>;
const limit = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const warmSkin = (r: number, g: number, b: number) => r - g > 17 && g - b > 11;
const background = (r: number, g: number, b: number) =>
  r > 180 && g >= r - 3 && b > r + 3;
const glamourEdges = [
  [287, 395, 488],
  [325, 383, 502],
  [353, 366, 521],
  [407, 331, 554],
  [446, 313, 571],
  [490, 312, 573],
  [535, 324, 557],
  [578, 340, 539],
  [628, 340, 546],
  [688, 313, 575],
  [725, 293, 591],
  [745, 294, 592],
];
const inGlamourContour = (x: number, y: number) => {
  const next = glamourEdges.findIndex(([row]) => row >= y);
  if (next <= 0) return false;
  const [a, l0, r0] = glamourEdges[next - 1],
    [b, l1, r1] = glamourEdges[next];
  const t = (y - a) / (b - a);
  return x >= l0 + (l1 - l0) * t && x <= r0 + (r1 - r0) * t;
};

function isolate(cut: Cut, pose: Pose) {
  const name = pose === "front" ? cut : `${cut}-${pose}`;
  const source = pngPixels(readFileSync(`${artFolder}/${name}.png`));
  if (source.width !== width || source.height !== height)
    throw new Error(`Dimensions natives requises : ${name}`);
  const guide =
    pose === "front"
      ? pngPixels(bodyBytes).pixels
      : pngPixels(
          readFileSync(
            `public/assets/avatar/redrawn-v1/sources/body-${pose}.png`,
          ),
        ).pixels;
  const image = new Uint8Array(source.pixels.length);
  const material = new Uint8Array(image.length);
  const protectedDetail = new Uint8Array(image.length);
  const coverage = new Uint8Array(image.length);

  for (let y = 287; y <= 855; y++) {
    for (let x = 120; x < 778; x++) {
      const i = (y * width + x) * 4;
      const r = source.pixels[i],
        g = source.pixels[i + 1],
        b = source.pixels[i + 2];
      const sourceAlpha = source.pixels[i + 3];
      if (
        sourceAlpha < 25 ||
        background(r, g, b) ||
        (r > 200 && g < 75 && b < 85)
      )
        continue;
      const center = Math.abs(x - 443.5);
      const skin = warmSkin(r, g, b);
      let alpha = sourceAlpha;
      let fixed = false;
      let sheer = false;
      let red = r,
        green = g,
        blue = b;
      switch (cut) {
        case "y2k-mcbling": {
          const hem =
            pose === "heart-hands" ? 735 : pose === "hand-on-hip" ? 775 : 707;
          if (skin || (center < 178 && y > hem)) continue;
          const hardware =
            (center < 13 && y >= 306 && y <= hem) ||
            (x >= 470 && x <= 538 && y >= 377 && y <= 510);
          fixed = hardware && Math.max(r, g, b) - Math.min(r, g, b) <= 22;
          if (!fixed && (r - g < 20 || r - b < 15)) continue;
          if (center < 190 && y >= 685 && b >= g && r - b < 24) continue;
          break;
        }
        case "dark-feminine": {
          if (center < 195 && y > (pose === "front" ? 790 : 774)) continue;
          if (r - g > 14 && b >= g && r - b < 29) continue; // violet dessous/pantalon
          if (skin) {
            if (!guide[i + 3] || y < 321 || (pose === "front" && y > 802))
              continue;
            if (pose === "heart-hands" && center < 125 && y < 466 && r > 142)
              continue;
            const skinRed = guide[i];
            if (!warmSkin(skinRed, guide[i + 1], guide[i + 2])) continue;
            alpha = Math.round(
              alpha *
                limit((skinRed - r - 5) / Math.max(55, skinRed - 38), 0, 1),
            );
            if (alpha < 16) continue;
            red = 46;
            green = 38;
            blue = 43;
            sheer = true;
          } else if (Math.max(r, g, b) > 126 || (r > g + 27 && g > b + 5)) {
            continue;
          }
          fixed =
            !sheer &&
            laceButtons[pose].some(
              ([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 < 66,
            );
          break;
        }
        case "glamour-contemporain": {
          if (!inGlamourContour(x, y) || skin || r - g > 30 || b > r + 4)
            continue;
          if (y > 704 && (r < 90 || b >= g + 6)) continue;
          fixed =
            x > 546 &&
            x < 576 &&
            y >= 660 &&
            y < 707 &&
            Math.max(r, g, b) - Math.min(r, g, b) < 12;
          break;
        }
      }
      image.set([red, green, blue, alpha], i);
      (fixed ? protectedDetail : material).set([255, 255, 255, 255], i);
      if (!sheer && alpha >= 245) coverage.set([0, 0, 0, 255], i);
    }
  }
  if (pose !== "front") {
    const front = ["", "-mask", "-protected"].map(
      (suffix) =>
        pngPixels(readFileSync(`${destination}/${cut}${suffix}.png`)).pixels,
    );
    // Reuse the approved front hem at its original coordinates. The bent
    // sleeve outside the torso and the original hand remain separate.
    for (let y = 624; y < 802; y++) {
      const [left, right] = torsoBounds(y, 8);
      for (let x = Math.floor(left); x <= Math.ceil(right); x++) {
        const i = (y * width + x) * 4;
        if (y < 646 && (!image[i + 3] || !front[0][i + 3])) continue;
        if (y < 646) {
          const blend = (y - 624) / 22;
          for (let channel = 0; channel < 3; channel++)
            image[i + channel] =
              image[i + channel] * (1 - blend) + front[0][i + channel] * blend;
          continue;
        }
        image.set(front[0].subarray(i, i + 4), i);
        material.set(front[1].subarray(i, i + 4), i);
        protectedDetail.set(front[2].subarray(i, i + 4), i);
      }
    }
  }
  const save = (suffix: string, pixels: Uint8Array) =>
    writeFileSync(
      `${destination}/${name}${suffix}.png`,
      rgbaPng(width, height, pixels),
    );
  save("", image);
  save("-mask", material);
  save("-protected", protectedDetail);
  if (pose === "front" && cut === "dark-feminine") save("-coverage", coverage);
}

for (const cut of [
  "y2k-mcbling",
  "dark-feminine",
  "glamour-contemporain",
] as const) {
  isolate(cut, "front");
  if (cut === "glamour-contemporain" || process.argv.includes("--front"))
    continue;
  isolate(cut, "hand-on-hip");
  isolate(cut, "heart-hands");
}
