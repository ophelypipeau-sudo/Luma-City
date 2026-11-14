import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { measureFabricTone } from "../packages/domain/src/atelier-color";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./lib/png-rgba";
import { removeOpaqueWhiteMatte, removeWhiteMatte } from "./lib/asset-edges";

const docs = "docs/capsule-jupes-iris-v1";
const output = "public/assets/avatar/capsule-jupes-iris-v1";
const [width, height] = DOLL_PATTERN.canvas;
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Le mannequin ne correspond pas au patron d’Iris.");

type Skirt = {
  id: string;
  name: string;
  // Outline and protected details measured on each source reference.
  waist: string;
  outline: string;
  center: number;
  scale: number;
  shift: number;
  details?: string;
  thread?: "gold" | "silver";
  sheen?: number;
  lowRise?: boolean;
};
const skirts: Skirt[] = [
  {
    id: "ligne-opera",
    name: "Ligne Opéra",
    center: 475,
    scale: 1.1,
    shift: -15,
    waist: "M377 615 Q475 652 574 615",
    outline:
      "C606 651 648 712 647 813 C643 892 602 962 605 1117 Q582 1141 463 1139 Q383 1137 341 1117 C343 974 301 899 304 809 C304 734 341 669 377 615Z",
    details:
      "M529 669Q531 655 553 661L568 655Q583 648 590 660L593 677L582 685L562 680L548 691L535 689Z",
  },
  {
    id: "pixel-rose",
    name: "Pixel Rose",
    center: 441,
    scale: 1.035,
    shift: -22,
    waist: "M311 696 Q441 752 574 696",
    outline:
      "C601 719 626 789 626 876 Q444 906 256 876 C257 808 279 742 311 696Z",
    details:
      "M338 713L364 718L359 758L326 751Z M521 718L549 712L560 749L532 758Z",
    sheen: 0.18,
    lowRise: true,
  },
  {
    id: "encre",
    name: "Encre",
    center: 444,
    scale: 1.04,
    shift: -20,
    waist: "M327 678 Q441 716 561 678",
    outline:
      "C585 715 629 777 627 869 L626 927 Q444 968 263 927 L261 871 C258 799 296 729 327 678Z",
    thread: "gold",
  },
  {
    id: "traverse",
    name: "Traverse",
    center: 444,
    scale: 1.09,
    shift: -52,
    waist: "M341 661 Q443 695 548 661",
    outline:
      "C584 718 616 771 616 867 C616 934 583 1002 576 1144 Q530 1156 466 1150 L450 1005 L433 1151 Q371 1154 308 1144 C305 1037 271 961 268 868 C267 791 303 717 341 661Z",
    details: "M438 683Q451 672 461 689Q459 708 438 702Z",
  },
  {
    id: "obsidienne",
    name: "Obsidienne",
    center: 443,
    scale: 1.15,
    shift: -88,
    waist: "M339 658 Q444 690 548 658",
    outline:
      "C571 706 622 774 622 862 C622 948 549 1053 588 1267 Q449 1301 297 1267 C338 1059 265 960 264 865 C261 782 302 709 339 658Z",
    sheen: 0.37,
  },
  {
    id: "nacre",
    name: "Nacre",
    center: 475,
    scale: 1.11,
    shift: -26,
    waist: "M386 600 Q472 640 565 600",
    outline:
      "C603 652 642 728 641 802 C640 884 601 933 614 1014 Q622 1060 666 1122 Q656 1132 636 1143 Q651 1159 596 1174 Q568 1180 551 1201 Q520 1213 462 1228 Q440 1264 344 1270 Q331 1270 345 1251 Q305 1251 294 1232 Q352 1117 343 1004 C337 931 306 869 308 800 Q309 700 386 600Z",
    sheen: 0.55,
  },
  {
    id: "dimanche",
    name: "Dimanche",
    center: 442,
    scale: 1.035,
    shift: -30,
    waist: "M337 662 Q445 704 547 662",
    outline:
      "C598 757 620 747 678 1090 Q665 1104 630 1106 Q627 1130 532 1127 L529 1136 Q513 1153 354 1136 L351 1127 Q318 1140 257 1127 L254 1109 Q217 1108 207 1090 C265 905 265 755 337 662Z",
  },
  {
    id: "minuit",
    name: "Minuit",
    center: 473,
    scale: 1.055,
    shift: -12,
    waist: "M365 624 Q474 651 579 624",
    outline:
      "C624 656 655 756 655 832 C655 914 609 990 628 1167 Q637 1258 651 1307 Q626 1338 573 1334 L570 1345 Q372 1372 294 1300 C315 1172 331 1084 319 1014 C319 945 290 906 292 832 C291 749 335 696 365 624Z",
    details: "M555 646Q579 632 608 661L614 678L591 704L553 698L548 673Z",
    sheen: 0.32,
  },
  {
    id: "rive-delavee",
    name: "Rive Délavée",
    center: 475,
    scale: 1.09,
    shift: -18,
    waist: "M367 607 Q474 643 577 607",
    outline:
      "C615 679 638 733 645 820 C661 945 729 1120 760 1236 Q705 1304 477 1316 Q275 1309 194 1253 C223 1137 288 977 300 837 C313 735 332 677 367 607Z",
    thread: "gold",
  },
  {
    id: "pli-diris",
    name: "Pli d’Iris",
    center: 476,
    scale: 1.1,
    shift: -6,
    waist: "M384 583 Q473 614 561 583",
    outline:
      "Q582 595 585 608 Q624 604 671 824 Q665 839 643 847 L646 898 Q625 923 603 927 Q597 980 590 1025 Q546 1027 494 976 Q412 1038 341 1031 L335 970 Q319 970 316 954 L305 866 Q294 828 287 796 L301 778 Q301 679 384 583Z",
  },
];

function render(content: string) {
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${content}</svg>`,
  ).render().pixels;
}

mkdirSync(output, { recursive: true });
const pieces = skirts.map((skirt, index) => {
  const file = `${docs}/sources/${String(index + 1).padStart(2, "0")}.png`;
  const source = readFileSync(file);
  const sourceWidth = source.readUInt32BE(16);
  const sourceHeight = source.readUInt32BE(20);
  const x = 443.5 - skirt.center * skirt.scale;
  const transform = `translate(${x} ${skirt.shift}) scale(${skirt.scale})`;
  const pixels = render(
    `<defs><clipPath id="skirt"><path d="${skirt.waist} ${skirt.outline}"/></clipPath></defs>
    <g transform="${transform}"><image width="${sourceWidth}" height="${sourceHeight}" clip-path="url(#skirt)" href="data:image/png;base64,${source.toString("base64")}"/></g>`,
  );
  const details =
    skirt.details &&
    render(
      `<path transform="${transform}" d="${skirt.details}" fill="white"/>`,
    );
  const art = new Uint8Array(pixels.length);
  const material = new Uint8Array(pixels.length);
  const fixed = new Uint8Array(pixels.length);
  const coverage = new Uint8Array(pixels.length);
  let left = width,
    right = 0,
    top = height,
    bottom = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (!alpha) continue;
    const px = (i / 4) % width;
    const py = Math.floor(i / 4 / width);
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]].map((value) =>
      Math.min(255, Math.round((value * 255) / alpha)),
    );
    // Remove the warm studio matte outside the denim's sloping side seams.
    if (
      skirt.id === "rive-delavee" &&
      py > 850 &&
      (px < 255 || px > 632) &&
      r > 205 &&
      g > 192 &&
      b > 173
    )
      continue;
    art.set([r, g, b, alpha], i);
    if (alpha > 246) coverage[i + 3] = 255;
    const gold = skirt.thread === "gold" && r > 95 && r - g > 12 && g - b > 12;
    const silver = skirt.thread === "silver" && g > 80 && r - g < 18;
    // Minuit's brooch sits over dyed velvet, visible even between its petals.
    const ornament =
      details && details[i + 3] > 120 && (skirt.id !== "minuit" || r - g <= 28);
    (gold || silver || ornament ? fixed : material).fill(255, i, i + 4);
    left = Math.min(left, px);
    right = Math.max(right, px);
    top = Math.min(top, py);
    bottom = Math.max(bottom, py);
  }
  const tone = measureFabricTone(pixels, material);
  if (!tone || right - left < 300)
    throw new Error(`Détourage incomplet : ${skirt.name}`);

  const edges = removeOpaqueWhiteMatte(width, height, art);
  const cleaned = removeWhiteMatte(width, height, edges.pixels).pixels;
  for (const [suffix, layer] of [
    ["", cleaned],
    ["-mask", material],
    ["-protected", fixed],
    ["-coverage", coverage],
  ] as const) {
    writeFileSync(
      `${output}/${skirt.id}${suffix}.png`,
      rgbaPng(width, height, layer),
    );
  }
  // Extend the waist path into a mask for tucked tops.
  const [, , firstY] = /^M([\d.]+) ([\d.]+)/.exec(skirt.waist)!;
  const [, , lastY] = /([\d.]+) ([\d.]+)$/.exec(skirt.waist)!;
  const band = skirt.waist
    .slice(1)
    .replace(
      /([\d.]+) ([\d.]+)/g,
      (_, px, py) =>
        `${(Number(px) * skirt.scale + x).toFixed(2)} ${(Number(py) * skirt.scale + skirt.shift + 4).toFixed(2)}`,
    );
  return {
    id: skirt.id,
    name: skirt.name,
    price: 750,
    source: file,
    lowRise: skirt.lowRise ?? false,
    crop: [left - 4, top - 4, right - left + 9, bottom - top + 9],
    tuckedTopRegion: `M0 ${Number(firstY) * skirt.scale + skirt.shift + 4}L${band}L887 ${Number(lastY) * skirt.scale + skirt.shift + 4}V0H0Z`,
    tone: { ...tone, depth: 0.36, sheen: skirt.sheen ?? 0.18 },
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
