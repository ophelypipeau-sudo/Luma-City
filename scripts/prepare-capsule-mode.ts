import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./lib/png-rgba";
import { NOCTURNE_CUFF_RIMS } from "../apps/web/src/avatar/capsule-mode";

const sources = "docs/capsule-mode-v2";
const output = "public/assets/avatar/capsule-mode-v2";
const [width, height] = DOLL_PATTERN.canvas;
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Le mannequin d’Iris ne correspond plus au patron.");
mkdirSync(output, { recursive: true });

type Cut = "champagne" | "cerise" | "nocturne";
type Pose = "front" | "hand-on-hip" | "heart-hands";
function contour(path: string) {
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path d="${path}"/></svg>`,
  ).render().pixels;
}

// These paths follow the existing painted thread. They are used only for
// dye strength, never as visible linework. A narrow fringe keeps the original
// antialiasing from turning into a bright line next to the protected stitch.
type Stitch = readonly [path: string, width: number, hold?: number];
const nocturneTorsoStitches: Stitch[] = [
  [
    "M355 343Q342 398 347 438Q386 450 438 450L443 454L449 450Q505 450 539 437Q540 384 528 343",
    4.2,
  ],
  ["M295 730Q364 751 439 753L443 748L447 753Q527 751 591 730", 3.5, 0.94],
  [
    "M324 450Q343 502 375 552Q394 592 390 623Q385 672 364 741M563 450Q544 502 512 552Q493 592 497 623Q502 672 523 741",
    2.6,
    0.34,
  ],
  ["M440 456L440 749M447 456L447 749", 1.7, 0.68],
];
const nocturneRestingCuffs: Stitch[] = [
  ["M144 817Q160 818 181 832M140 831Q156 831 176 846", 2.1, 0.84],
];
function protectStitches(
  layers: ReturnType<typeof extract>,
  stitches: Stitch[],
  pose: Pose,
) {
  const paths = (fringe: boolean) =>
    new Resvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g fill="none" stroke="white" stroke-linecap="round">${stitches.map(([path, line, hold = 1]) => `<path d="${path}" stroke-width="${line + (fringe ? 2.6 : 0)}" opacity="${fringe ? hold * 0.34 : hold}"/>`).join("")}</g></svg>`,
    ).render().pixels;
  const core = paths(false),
    fringe = paths(true);
  for (let y = 320; y < 857; y++)
    for (let x = 125; x < 764; x++) {
      const i = (y * width + x) * 4 + 3;
      let hold = Math.max(core[i], fringe[i]);
      if (pose !== "heart-hands" && y > 345 && y < 815 && layers.main[i]) {
        const limit = y < 515 ? 314 : y < 650 ? 305 : 275;
        // The opaque pixels that border the resting mesh are binding,
        // not corset fabric: don't turn them white with the corset.
        if (x < limit || (pose === "front" && x > width - limit)) {
          for (const delta of [4, 8, 12, width * 4, width * 8, width * 12]) {
            if (layers.detail[i - delta] || layers.detail[i + delta]) {
              hold = 255;
              break;
            }
          }
        }
      }
      if (!hold || !layers.art[i] || layers.keep[i] === 255) continue;
      layers.main[i] = Math.round((layers.main[i] * (255 - hold)) / 255);
      layers.detail[i] = Math.round((layers.detail[i] * (255 - hold)) / 255);
      // "Protected" means pixel-for-pixel unchanged. Partial protection
      // lives in the dye alpha; the unpainted fraction is implicit.
      if (layers.main[i] + layers.detail[i] === 0)
        layers.keep.set([255, 255, 255, 255], i - 3);
    }
}

// Tracés de détourage uniquement : les pixels visibles viennent des peintures.
const satin = contour(
  "M511 333 Q522 333 533 337 Q544 334 552 340 Q562 340 570 344 L566 355 Q546 403 559 446 Q570 481 561 509 Q552 540 540 565 Q527 598 527 615 Q525 637 542 659 Q566 694 589 724 Q571 736 514 742 Q445 750 389 746 Q333 742 298 723 Q317 693 346 652 Q357 635 358 624 Q362 609 351 580 Q335 548 324 512 Q312 481 321 463 Q336 443 396 435 Q460 424 480 401 Q500 382 511 333Z",
);
const gold = contour(
  "M349 610 Q362 596 381 605 Q390 607 401 608 L402 616 Q390 618 384 619 Q368 628 355 621 Q350 618 349 610Z",
);
const cerisePanels = {
  front: contour(
    "M376 339L397 353Q338 404 319 447L310 435Q311 392 376 339Z M508 339Q560 377 570 411L567 454Q554 401 487 355Z",
  ),
  "hand-on-hip": contour(
    "M376 341L398 356Q345 397 321 445L309 432Q318 388 376 341Z M508 340Q557 378 564 404L562 452Q543 397 487 356Z",
  ),
  "heart-hands": contour(
    "M376 335L397 349Q342 396 321 440L310 428Q314 388 376 335Z M507 335Q560 373 570 408L567 448Q551 397 489 349Z",
  ),
};
const ceriseOutline = {
  front: contour(
    "M391 321Q437 368 497 321Q518 343 563 350Q609 353 628 429Q591 451 566 473Q550 529 530 578Q521 594 530 613Q526 629 543 649Q517 666 444 666Q377 666 345 649Q357 629 356 611Q363 596 351 570Q327 513 321 473Q297 450 256 429Q272 353 318 350Q368 343 391 321Z",
  ),
  "hand-on-hip": contour(
    "M391 322Q438 369 495 323Q512 341 563 352Q608 359 631 409Q592 428 577 462L563 444H318L321 474Q290 450 257 434Q272 354 322 349Q370 342 391 322Z",
  ),
  "heart-hands": contour(
    "M391 319Q441 364 497 318Q520 341 563 348Q613 355 628 425Q593 437 566 461L546 424H338L313 457Q289 437 253 426Q272 351 320 347Q366 342 391 319Z",
  ),
};
const planet = contour("M477 396H525V428H477Z");
const hooks = contour("M435 450H452V749H435Z");
const corsetHem = contour(
  "M235 710H650V723H594Q567 737 526 745Q472 759 444 757Q406 761 359 749Q319 741 293 728H235Z",
);
const nocturneBust = contour(
  "M315 345Q337 343 360 337H528Q550 342 572 345L571 490Q557 535 534 582Q515 619 551 672Q580 711 602 737V770H283V737Q305 711 334 672Q371 619 352 582Q329 535 316 490Z",
);
const sat = (r: number, g: number, b: number) =>
  Math.max(r, g, b) - Math.min(r, g, b);
const clamp = (x: number) => Math.max(0, Math.min(1, x));

function extract(cut: Cut, pose: Pose, rounded = false) {
  const stem = pose === "front" ? cut : `${cut}-${pose}`;
  const source = pngPixels(readFileSync(`${sources}/${stem}.png`));
  if (source.width !== width || source.height !== height)
    throw new Error(`Peinture hors du canevas natif : ${stem}`);
  const length = source.pixels.length;
  const art = new Uint8Array(length),
    main = new Uint8Array(length),
    detail = new Uint8Array(length),
    keep = new Uint8Array(length),
    coverage = new Uint8Array(length);
  for (let y = 315; y <= 860; y++)
    for (let x = 110; x <= 780; x++) {
      const i = (y * width + x) * 4;
      // Raise only the exposed side of the satin edge. Take the original
      // seam and cloth from nearby native rows, tapering into the drape.
      const smooth = (v: number) => {
        const t = clamp(v);
        return t * t * (3 - 2 * t);
      };
      const lift =
        cut === "champagne" && x >= 316 && x < 388
          ? Math.round(
              24 *
                clamp((x - 314) / 17) *
                clamp((388 - x) / 39) *
                clamp((525 - y) / 82) -
                (rounded
                  ? 5.8 *
                    smooth((x - 326) / 18) *
                    smooth((387 - x) / 26) *
                    smooth((510 - y) / 66)
                  : 0),
            )
          : 0;
      const sample = i + lift * width * 4;
      let r = source.pixels[sample],
        g = source.pixels[sample + 1],
        b = source.pixels[sample + 2];
      let alpha = 255,
        region = main,
        cover = true;
      if (cut === "champagne") {
        alpha = satin[sample + 3];
        if (!alpha || r < 72 || (r - g > 68 && g - b > 32) || b > g + 6)
          continue;
        if (gold[i + 3] && r - b > 39) region = keep;
      } else if (cut === "cerise") {
        alpha = ceriseOutline[pose][i + 3];
        if (!alpha) continue;
        const panel = cerisePanels[pose][i + 3];
        const red = r - g > 24 && r - b > 16 && g - b < 16 && r < 205;
        const cream = r > 120 && g > 95 && g - b > 12 && r - g < 39 && r > b;
        if (pose === "front" && planet[i + 3] && g > 55) region = keep;
        else if (panel && cream) region = detail;
        else if (!red) continue;
      } else {
        const metal = hooks[i + 3] && g > 42 && sat(r, g, b) < 30;
        if ((!metal && Math.max(r, g, b) > 155) || (r - g > 55 && g - b > 26))
          continue;
        if (y >= 710 && x > 235 && x < 650 && !corsetHem[i + 3]) continue;
        if (y > 844 && r - b > 16) continue;
        if (r - b > 14 && r - g > 10) {
          // Remove the painted skin matte from the mesh. The apparent warm
          // shadows are restored by the actual Iris arm under this overlay.
          const transmission = clamp((r - 16) / 203);
          alpha = Math.round(alpha * (1 - transmission));
          r = 16;
          g = 14;
          b = 19;
          cover = false;
          region = detail;
        } else if (metal) region = keep;
      }
      if (!alpha) continue;
      art.set([r, g, b, alpha], i);
      region.set([255, 255, 255, 255], i);
      if (cover) coverage.set([0, 0, 0, alpha], i);
    }
  return { art, main, detail, keep, coverage };
}

// Transfer original cloth at the few edges that overlap the strapless
// underwear. The body and underwear pixels themselves are untouched.
function coverUnderwearEdge(layers: ReturnType<typeof extract>, cut: Cut) {
  const cloth = Object.fromEntries(
    Object.entries(layers).map(([key, data]) => [key, data.slice()]),
  ) as typeof layers;
  const underwear = pngPixels(
    readFileSync("public/assets/avatar/leopard-v1/underwear-strapless.png"),
  ).pixels;
  for (let y = 429; y < 523; y++)
    for (let x = 317; x <= 570; x++) {
      if (
        cut === "nocturne"
          ? y > 449 || (x > 371 && x < 517)
          : y < 455 || (x > 330 && x < 548)
      )
        continue;
      const i = (y * width + x) * 4;
      const [r, g, b, a] = underwear.subarray(i, i + 4);
      if (
        a < 200 ||
        r < 82 ||
        b < g + 5 ||
        b < r - 30 ||
        layers.art[i + 3] >= 248
      )
        continue;
      const step = cut === "nocturne" ? width : x < 443 ? 1 : -1;
      for (let d = 1; d <= (cut === "nocturne" ? 16 : 8); d++) {
        const j = i + d * step * 4;
        if (cloth.art[j + 3] < 248 || !cloth.main[j + 3]) continue;
        for (const key of Object.keys(layers) as (keyof typeof layers)[])
          layers[key].set(cloth[key].subarray(j, j + 4), i);
        break;
      }
    }
  return layers;
}

function saveNocturneDye(name: string, layers: ReturnType<typeof extract>, pose: Pose) {
  const bust = new Uint8Array(layers.main.length);
  const light = new Uint8Array(bust.length);
  const cuff = pose === "front" ? undefined : contour(NOCTURNE_CUFF_RIMS[pose]);
  const stride = width + 1;
  const sum = new Float64Array(stride * (height + 1));
  const weight = new Float64Array(sum.length);
  const luma = (i: number) =>
    0.2126 * layers.art[i] + 0.7152 * layers.art[i + 1] + 0.0722 * layers.art[i + 2];
  for (let y = 0; y < height; y++) {
    let rowSum = 0, rowWeight = 0;
    // Below the arms the continuous opaque panel gives the actual flared
    // edge. Stop at the first gap or mesh; the painted sleeve can reappear
    // farther out on the same row, especially in the hip pose.
    let left = 443, right = 442;
    if (y >= 600 && y <= 760) {
      const panel = (x: number) => {
        const i = (y * width + x) * 4 + 3;
        return !cuff?.[i] && (layers.main[i] || layers.keep[i]);
      };
      if (panel(443)) {
        right = 443;
        while (left > 282 && panel(left - 1)) left--;
        while (right < 604 && panel(right + 1)) right++;
      }
    }
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4, j = (y + 1) * stride + x + 1;
      if (layers.main[i + 3] && !cuff?.[i + 3]) {
        const alpha = x >= left && x <= right ? 255 : nocturneBust[i + 3];
        if (alpha) {
          bust.set([255, 255, 255, alpha], i);
          const coverage = (alpha * layers.art[i + 3]) / 65025;
          rowSum += luma(i) * coverage;
          rowWeight += coverage;
        }
      }
      sum[j] = sum[j - stride] + rowSum;
      weight[j] = weight[j - stride] + rowWeight;
    }
  }
  // Keep the original local contrast of stitching, folds and sheen. A small
  // amount of smoothing reduces speckling in the dark satin under pale dye.
  const area = (table: Float64Array, left: number, top: number, right: number, bottom: number) =>
    table[bottom * stride + right] - table[top * stride + right] -
    table[bottom * stride + left] + table[top * stride + left];
  const radius = 3;
  for (let y = radius; y < height - radius; y++)
    for (let x = radius; x < width - radius; x++) {
      const i = (y * width + x) * 4;
      if (!bust[i + 3]) continue;
      const box = [x - radius, y - radius, x + radius + 1, y + radius + 1] as const;
      const local = area(sum, ...box) / area(weight, ...box);
      const value = Math.round(0.22 * local + 0.78 * luma(i));
      light.set([value, value, value, layers.art[i + 3]], i);
    }
  writeFileSync(`${output}/${name}-buste-mask.png`, rgbaPng(width, height, bust));
  writeFileSync(`${output}/${name}-buste-relief.png`, rgbaPng(width, height, light));
  writeFileSync(`${output}/${name}-buste-protected.png`, rgbaPng(width, height, layers.keep));
}

function save(name: string, layers: ReturnType<typeof extract>, cut: Cut) {
  const pose: Pose = name.endsWith("-hand-on-hip")
    ? "hand-on-hip"
    : name.endsWith("-heart-hands")
      ? "heart-hands"
      : "front";
  // Posed variants are assembled from these untreated masks, so never
  // mutate the caller's material channels while exporting.
  layers = {
    ...layers,
    main: layers.main.slice(),
    detail: layers.detail.slice(),
    keep: layers.keep.slice(),
  };
  const stitches = [
    ...nocturneTorsoStitches,
    ...(pose === "heart-hands" ? [] : nocturneRestingCuffs),
    ...(pose === "front"
      ? [
          [
            "M743 817Q727 818 706 832M747 831Q731 831 711 846",
            2.1,
            0.84,
          ] as const,
        ]
      : pose === "hand-on-hip"
        ? [["M620 671Q636 676 650 691", 2, 0.84] as const]
        : [
            [
              "M304 458Q316 469 334 475M583 458Q571 469 553 475",
              2,
              0.84,
            ] as const,
          ]),
  ];
  if (cut === "cerise") {
    // Red thread is part of the material: preserve its light and texture
    // through the fabric curve, with no red mixed back into the new color.
    // At the embroidery edge protect the light thread, not its red backing.
    for (let i = 0; i < layers.art.length; i += 4) {
      if (!layers.art[i + 3]) continue;
      const [r, g, b] = layers.art.subarray(i, i + 3);
      const redBacking = r - g > Math.max(32, g * 0.43) && r - b > g * 0.55;
      const fixed = layers.detail[i + 3] || (layers.keep[i + 3] && !redBacking);
      const ink = fixed ? layers.keep : layers.main;
      const clear = fixed ? layers.main : layers.keep;
      ink.set([255, 255, 255, 255], i);
      clear.fill(0, i, i + 4);
    }
  } else if (cut === "nocturne") {
    // Thread takes the new hue with the bust; hardware and sleeves stay fixed.
    saveNocturneDye(name, layers, pose);
    protectStitches(layers, stitches, pose);
  }
  writeFileSync(`${output}/${name}.png`, rgbaPng(width, height, layers.art));
  writeFileSync(
    `${output}/${name}-mask.png`,
    rgbaPng(width, height, layers.main),
  );
  writeFileSync(
    `${output}/${name}-protected.png`,
    rgbaPng(width, height, layers.keep),
  );
  if (cut !== "champagne")
    writeFileSync(
      `${output}/${name}-detail-mask.png`,
      rgbaPng(width, height, layers.detail),
    );
  if (cut === "nocturne")
    writeFileSync(
      `${output}/${name}-coverage.png`,
      rgbaPng(width, height, layers.coverage),
    );
}

const cerise = coverUnderwearEdge(extract("cerise", "front"), "cerise");
save("cerise", cerise, "cerise");
const posedArms = {
  "heart-hands": pngPixels(
    readFileSync("public/assets/avatar/poses/redraw-v4/heart-arms.png"),
  ).pixels,
  "hand-on-hip": pngPixels(
    readFileSync("public/assets/avatar/poses/hand-on-hip-v3/bare-arm.png"),
  ).pixels,
};
const frontBody = pngPixels(body).pixels;
for (const pose of ["hand-on-hip", "heart-hands"] as const) {
  const painted = extract("cerise", pose);
  // Reuse the intact front torso and embroidery at their exact pixels. The
  // pose sources include hands on that panel; only the drawn caps are needed.
  const layers = Object.fromEntries(
    Object.entries(cerise).map(([key, data]) => [key, data.slice()]),
  ) as typeof cerise;
  // The seams at the sides of the torso are the junction with the posed caps.
  for (let y = 342; y < 474; y++)
    for (let x = 245; x < 645; x++) {
      if (x > 318 && x < 566) continue;
      const i = (y * width + x) * 4;
      const lift = Math.round(
        5 * clamp((x < 319 ? 319 - x : x - 566) / 25) * clamp((410 - y) / 40),
      );
      const sample = i + lift * width * 4;
      for (const key of ["art", "main", "detail", "keep", "coverage"] as const)
        layers[key].set(painted[key].subarray(sample, sample + 4), i);
    }
  // Join the cap to the exact shoulder with native cloth pixels. The
  // shoulder stays intact; the patch ends before the sleeve opening.
  for (let x = 257; x <= 628; x++) {
    if (x > 335 && x < 551) continue;
    const shoulder =
      pose === "hand-on-hip" && x < 443 ? frontBody : posedArms[pose];
    const offset = (y: number) => (y * width + x) * 4;
    let first = 338;
    while (first < 410 && shoulder[offset(first) + 3] < 8) first++;
    let cloth = first;
    while (cloth < 412 && layers.art[offset(cloth) + 3] < 224) cloth++;
    if (cloth === first || cloth === 412 || cloth - first > 13) continue;
    for (let y = first; y < cloth; y++) {
      const i = offset(y);
      if (layers.art[i + 3] >= shoulder[i + 3]) continue;
      const sample = offset(cloth + ((y - first) % 3));
      if (layers.art[sample + 3] < 224) continue;
      for (const data of Object.values(layers))
        data.set(data.subarray(sample, sample + 4), i);
      layers.art[i + 3] = shoulder[i + 3];
      layers.coverage[i + 3] = shoulder[i + 3];
    }
  }
  save(`cerise-${pose}`, coverUnderwearEdge(layers, "cerise"), "cerise");
}
save(
  "champagne-arrondi",
  coverUnderwearEdge(extract("champagne", "front", true), "champagne"),
  "champagne",
);
const nocturne = coverUnderwearEdge(extract("nocturne", "front"), "nocturne");
// Close the isolated skin slivers where the painting and Iris differ by a
// few pixels. Copy only translucent fabric at the silhouette, above cuffs.
const frontMesh = nocturne.detail.slice();
for (let y = 480; y < 807; y++)
  for (let x = 125; x < 760; x++) {
    const armLimit = y < 560 ? 315 : y < 650 ? 302 : 268;
    if (x >= armLimit && x <= width - armLimit) continue;
    const i = (y * width + x) * 4;
    if (frontBody[i + 3] < 32 || nocturne.art[i + 3]) continue;
    for (let dx = 1; dx <= 6; dx++) {
      const candidates = [i + dx * 4, i - dx * 4];
      const sample = candidates.find((j) => frontMesh[j + 3]);
      if (sample === undefined) continue;
      nocturne.art.set(nocturne.art.subarray(sample, sample + 4), i);
      nocturne.art[i + 3] = Math.round(
        (nocturne.art[i + 3] * frontBody[i + 3]) / 255,
      );
      if (nocturne.art[i + 3]) nocturne.detail.set([255, 255, 255, 255], i);
      break;
    }
  }
save("nocturne", nocturne, "nocturne");
const corsetTorso = contour(
  "M308 330H583L568 503L536 564L531 622L605 749L608 780H282V739L350 622L352 567L320 505Z",
);
const heartSleeve = contour(
  "M116 324H339L326 420L317 447L331 475L355 480L335 544L301 660H120Z M771 324H548L561 420L570 447L556 475L532 480L552 544L586 660H771Z",
);

for (const pose of ["hand-on-hip", "heart-hands"] as const) {
  const heart = pose === "heart-hands";
  const cuffs = contour(NOCTURNE_CUFF_RIMS[pose]);
  const drawn = pngPixels(readFileSync(`${sources}/nocturne-${pose}.png`));
  const arms = posedArms[pose];
  const layers = Object.fromEntries(
    Object.entries(nocturne).map(([key, data]) => [key, data.slice()]),
  ) as typeof nocturne;
  const meshSample = (sx: number, sy: number) => {
    const index = (sy * drawn.width + sx) * 4;
    const r = drawn.pixels[index],
      g = drawn.pixels[index + 1],
      b = drawn.pixels[index + 2];
    return r >= 36 && r <= 151 && r - b > 15 && r - g > 8 ? r : undefined;
  };
  for (let y = 328; y <= 856; y++)
    for (let x = 110; x <= 780; x++) {
      const i = (y * width + x) * 4;
      if ((heart || x > 443) && !corsetTorso[i + 3]) {
        for (const channel of Object.values(layers)) channel.fill(0, i, i + 4);
      }
      const cuff = cuffs[i + 3];
      const zone = heart ? heartSleeve[i + 3] : 255;
      if (!arms[i + 3] || (!zone && !cuff)) continue;
      if (
        !cuff &&
        layers.art[i + 3] &&
        !layers.detail[i + 3] &&
        (y < 445 || !heart)
      )
        continue;

      // Register small sections of the painted mesh by translation. The
      // differing source framing never sets the sleeve or wrist silhouette.
      const hipForearm = y >= 551 && x < 803 - (y - 548) * 0.81;
      const [sx, sy] = heart
        ? [x + (x < 443 ? 3 : -3), y - 1]
        : hipForearm
          ? [x + 17, y - 45]
          : [x + 28, y - 19];
      let sample = meshSample(sx, sy);
      for (
        let distance = 3;
        sample === undefined && distance <= 45;
        distance += 3
      ) {
        for (const [dx, dy] of [
          [-distance, 0],
          [distance, 0],
          [0, -distance],
          [0, distance],
        ]) {
          sample = meshSample(sx + dx, sy + dy);
          if (sample !== undefined) break;
        }
      }
      const strength = Math.max(
        0.57,
        Math.min(0.88, 1 - ((sample ?? 81) - 16) / 203),
      );
      const alpha = Math.round(((arms[i + 3] * zone) / 255) * strength);
      if (cuff > 110) {
        const cx = heart
          ? x < 443
            ? 323 + (x - 321)
            : 564 + (x - 566)
          : 651 + (x - 633);
        const cy = heart ? y - 2 : y - 49;
        const index = (cy * drawn.width + cx) * 4;
        const r = drawn.pixels[index],
          g = drawn.pixels[index + 1],
          b = drawn.pixels[index + 2];
        const opaque = Math.max(r, g, b) < 67 && Math.abs(r - g) < 12;
        const seam = ((cuff < 245 ? 815 : 824) * width + 153 + (x % 23)) * 4;
        layers.art.set(
          [
            opaque ? r : nocturne.art[seam],
            opaque ? g : nocturne.art[seam + 1],
            opaque ? b : nocturne.art[seam + 2],
            arms[i + 3],
          ],
          i,
        );
        layers.main.set([255, 255, 255, 255], i);
        layers.detail.fill(0, i, i + 4);
        layers.keep.fill(0, i, i + 4);
      } else if (alpha) {
        layers.art.set([16, 14, 19, alpha], i);
        layers.detail.set([255, 255, 255, 255], i);
        layers.main.fill(0, i, i + 4);
        layers.keep.fill(0, i, i + 4);
        layers.coverage.fill(0, i, i + 4);
      }
    }
  save(`nocturne-${pose}`, layers, "nocturne");
}
