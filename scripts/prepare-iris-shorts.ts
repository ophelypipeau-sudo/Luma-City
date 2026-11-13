import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { measureFabricTone } from "../packages/domain/src/atelier-color";
import {
  DOLL_PATTERN,
  torsoBounds,
} from "../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./lib/png-rgba";

const docs = "docs/capsule-shorts-iris-v1";
const output = "public/assets/avatar/capsule-shorts-iris-v1";
const [width, height] = DOLL_PATTERN.canvas;
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Le mannequin ne correspond pas au patron d’Iris.");

// The outlines trace the painted fabric on each source at its own coordinates.
// The first subpath segment follows the waistband for tucked tops.
type Piece = {
  id: string;
  name: string;
  crotch: readonly [number, number];
  scale: number;
  rise: number;
  waist: string;
  outline: string;
  ends: readonly [number, number];
  details?: string;
  thread?: "copper" | "silver";
  sheen?: number;
  lowRise?: boolean;
};
const pieces: Piece[] = [
  {
    id: "sillage",
    name: "Sillage",
    crotch: [475, 837],
    scale: 1.055,
    rise: 861,
    lowRise: true,
    ends: [619, 619],
    waist: "M382 619 Q475 647 569 619",
    outline:
      "C579 650 588 668 607 694 C639 736 656 788 654 842 C650 895 628 953 621 1001 Q553 1007 490 1001 C483 942 478 890 477 839 L472 839 C471 888 467 949 461 1001 Q398 1008 330 1001 C322 951 297 895 297 840 C295 786 313 739 343 694 C363 666 374 641 382 619Z",
    details:
      "M344 705L430 720L428 735L340 716Z M525 720L611 705L615 716L527 735Z",
  },
  {
    id: "pixel",
    name: "Pixel",
    crotch: [472, 819],
    scale: 1.04,
    rise: 858,
    lowRise: true,
    ends: [654, 654],
    waist: "M351 654 C392 687 458 691 518 684 C552 680 579 670 598 654",
    outline:
      "C627 695 650 745 657 793 C598 799 536 817 478 834 L478 817 L469 817 L468 834 C410 817 349 801 291 795 C299 744 322 696 351 654Z",
    details:
      "M485 695a11 11 0 1 0 0 22a11 11 0 1 0 0-22Z M322 712L402 742L407 748L402 768L387 768L391 747L316 727Z M542 744L626 714L633 726L558 749L559 768L546 769Z",
  },
  {
    id: "indigo",
    name: "Indigo",
    crotch: [472, 817],
    scale: 1.035,
    rise: 873,
    ends: [621, 621],
    waist: "M371 621 C414 649 526 650 574 621",
    outline:
      "C607 673 650 720 652 829 Q657 830 656 841 L656 862 C613 878 539 883 476 877 L475 825 L471 820 L470 877 C405 883 334 878 289 862 L289 833 L293 830 C292 741 326 689 371 621Z",
    thread: "copper",
  },
  {
    id: "atlas",
    name: "Atlas",
    crotch: [475, 832],
    scale: 1.045,
    rise: 877,
    ends: [636, 636],
    waist: "M369 636 C429 658 520 661 579 636",
    outline:
      "C611 690 646 741 653 809 Q659 823 661 858 L653 863 C652 897 644 925 637 952 L629 991 Q566 1001 490 992 C481 941 480 883 478 833 L472 833 C470 882 468 940 460 992 Q388 1001 321 991 L313 952 L306 951 C300 925 296 895 297 864 L292 862 Q291 836 297 810 C304 743 337 689 369 636Z",
    details:
      "M487 659a10 10 0 1 0 0 20a10 10 0 1 0 0-20Z M345 842a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z M610 841a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z",
  },
  {
    id: "onyx",
    name: "Onyx",
    crotch: [476, 865],
    scale: 1.03,
    rise: 900,
    ends: [633, 632],
    waist: "M369 633 C430 665 516 660 585 632",
    outline:
      "C626 692 668 752 660 870 C628 877 596 868 566 853 C536 864 508 877 477 878 L476 861 L473 878 C444 875 422 868 400 860 C362 874 324 877 293 870 C283 779 310 725 369 633Z",
    details:
      "M525 657L565 654L568 695L525 696Z M529 663L560 660L562 689L531 690Z M524 675L539 674L539 678L524 679Z M511 672a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z M576 668a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z",
    sheen: 0.34,
  },
  {
    id: "nacre",
    name: "Nacre",
    crotch: [477, 827],
    scale: 1.06,
    rise: 880,
    ends: [622, 621],
    waist: "M373 622 C422 642 522 646 576 621",
    outline:
      "C607 667 642 734 682 837 C657 865 567 896 481 883 L477 829 L474 829 L472 883 C387 898 301 866 268 838 C296 791 325 695 373 622Z",
    sheen: 0.54,
  },
  {
    id: "rive",
    name: "Rive",
    crotch: [476, 799],
    scale: 1.065,
    rise: 859,
    lowRise: true,
    ends: [566, 566],
    waist:
      "M363 566 C366 558 380 553 390 556 L392 560 C397 560 401 563 397 568 C414 567 426 562 428 574 C442 574 459 569 465 577 C467 581 477 582 487 581 C484 574 510 570 526 574 C524 564 546 563 562 567 C558 562 560 559 566 558 C577 553 588 557 590 566",
    outline:
      "L575 588 L592 624 L588 629 C638 696 655 768 667 935 C642 951 558 965 484 952 L476 813 L465 952 C393 966 312 951 285 937 C295 814 297 735 357 630 L358 626 L376 590Z",
    details:
      "M381 590L419 596L407 643L371 635Z M386 598L412 602L402 635L379 630Z M398 613L411 615L410 620L397 617Z M535 594L573 586L584 635L548 642Z M542 600L568 594L577 629L553 634Z M545 612L557 610L558 615L547 618Z",
  },
  {
    id: "minuit",
    name: "Minuit",
    crotch: [476, 818],
    scale: 1.025,
    rise: 867,
    ends: [615, 615],
    waist: "M373 615 C422 642 523 642 580 615",
    outline:
      "C620 667 661 736 654 849 C617 864 547 874 481 868 L478 818 L474 818 L471 868 C411 874 341 861 298 850 C293 766 309 701 373 615Z",
    thread: "silver",
    sheen: 0.28,
  },
  {
    id: "retro",
    name: "Rétro",
    crotch: [475, 805],
    scale: 1.075,
    rise: 865,
    ends: [635, 634],
    waist: "M366 635 C430 658 511 661 580 634",
    outline:
      "C610 688 657 756 647 856 L649 862 L644 891 C612 902 532 906 478 893 L476 807 L473 807 L470 892 C422 905 340 905 303 890 L299 862 L302 855 C291 761 316 697 366 635Z",
    thread: "copper",
  },
  {
    id: "prisme",
    name: "Prisme",
    crotch: [474, 868],
    scale: 1.055,
    rise: 905,
    ends: [635, 638],
    waist: "M374 635 C426 659 519 665 578 638",
    outline:
      "C603 682 631 716 642 765 L640 768 C651 804 654 847 651 879 C628 892 548 898 478 897 L475 869 L471 897 L450 896 L419 951 C368 929 323 899 291 869 C297 769 322 713 374 635Z",
    details: "M527 662L578 654L565 706L509 713Z",
  },
];

function svgPixels(svg: string) {
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${svg}</svg>`,
  ).render().pixels;
}

mkdirSync(output, { recursive: true });
const manifest = pieces.map((piece, index) => {
  const file = `${docs}/sources/${String(index + 1).padStart(2, "0")}.png`;
  const source = readFileSync(file);
  const sourceWidth = source.readUInt32BE(16);
  const sourceHeight = source.readUInt32BE(20);
  const [left, right] = torsoBounds(piece.rise);
  const x = (left + right) / 2 - piece.crotch[0] * piece.scale;
  const y = piece.rise - piece.crotch[1] * piece.scale;
  const transform = `translate(${x} ${y}) scale(${piece.scale})`;
  const pixels =
    svgPixels(`<defs><clipPath id="garment"><path d="${piece.waist} ${piece.outline}"/></clipPath></defs>
    <g transform="${transform}"><image width="${sourceWidth}" height="${sourceHeight}" clip-path="url(#garment)" href="data:image/png;base64,${source.toString("base64")}"/></g>`);
  const details =
    piece.details &&
    svgPixels(
      `<path transform="${transform}" d="${piece.details}" fill="white" fill-rule="evenodd"/>`,
    );
  const art = new Uint8Array(pixels.length);
  const material = new Uint8Array(pixels.length);
  const fixed = new Uint8Array(pixels.length);
  const coverage = new Uint8Array(pixels.length);
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (a < 10) continue;
    const px = (i / 4) % width;
    const py = Math.floor(i / 4 / width);
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]].map((v) =>
      Math.min(255, Math.round((v * 255) / a)),
    );
    art.set([r, g, b, a], i);
    if (a > 246) coverage[i + 3] = 255;
    const copper =
      piece.thread === "copper" && r > 92 && r - g > 12 && g - b > 12;
    const silver = piece.thread === "silver" && r > 74 && r >= b && g >= b;
    // The boxes around zips and welts include dyed tape and surrounding cloth.
    const metalColor =
      !["pixel", "sillage"].includes(piece.id) ||
      (r - g < 18 && r - b < 22 && g > 45);
    (copper || silver || (details && details[i + 3] > 100 && metalColor)
      ? fixed
      : material
    ).fill(255, i, i + 4);
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  }
  const tone = measureFabricTone(pixels, material);
  if (!tone || maxX - minX < 300)
    throw new Error(`Détourage incomplet : ${piece.name}`);
  for (const [suffix, layer] of [
    ["", art],
    ["-mask", material],
    ["-protected", fixed],
    ["-coverage", coverage],
  ] as const) {
    writeFileSync(
      `${output}/${piece.id}${suffix}.png`,
      rgbaPng(width, height, layer),
    );
  }
  const band = piece.waist.slice(1).replace(
    /([\d.]+) ([\d.]+)/g,
    (_, px: string, py: string) =>
      `${(Number(px) * piece.scale + x).toFixed(2)} ${(Number(py) * piece.scale + y + 3).toFixed(2)}`,
  );
  const tuckedTopRegion = `M0 0L0 ${piece.ends[0] * piece.scale + y}L${band}L887 ${piece.ends[1] * piece.scale + y}V0Z`;
  return {
    id: piece.id,
    name: piece.name,
    price: 750,
    source: file,
    lowRise: piece.lowRise ?? false,
    crop: [minX - 4, minY - 4, maxX - minX + 9, maxY - minY + 9],
    tuckedTopRegion,
    tone: { ...tone, depth: 0.36, sheen: piece.sheen ?? 0.18 },
  };
});
writeFileSync(
  `${output}/index.json`,
  JSON.stringify(
    {
      pattern: DOLL_PATTERN.id,
      bodySha256: DOLL_PATTERN.bodySha256,
      pieces: manifest,
    },
    null,
    2,
  ) + "\n",
);
