import type { patternIds } from "../../contracts/src/atelier";
export type PatternId = (typeof patternIds)[number];
export const ATELIER_PATTERNS: Record<
  PatternId,
  {
    label: string;
    path: string;
    anchors: { label: string; x: number; y: number }[];
    crop: [number, number, number, number];
  }
> = {
  tank: {
    label: "Débardeur ajusté",
    path: "M347 342H365L364 411Q390 461 443 461Q500 461 526 411L524 342H542L551 423Q580 450 566 506L534 597Q443 617 353 597L320 506Q306 455 337 423Z",
    anchors: [
      { label: "Épaule gauche", x: 354, y: 346 },
      { label: "Épaule droite", x: 533, y: 346 },
      { label: "Encolure", x: 443, y: 461 },
      { label: "Taille", x: 443, y: 607 },
    ],
    crop: [285, 325, 320, 330],
  },
  tee: {
    label: "Tee-shirt",
    path: "M399 330Q443 400 487 330L550 340Q585 351 612 389L637 450Q611 481 570 485L575 462L560 590Q548 627 559 652Q443 681 329 652Q340 625 326 590L312 462L318 485Q279 479 250 450L276 389Q302 353 337 340Z",
    anchors: [
      { label: "Épaule gauche", x: 302, y: 369 },
      { label: "Épaule droite", x: 585, y: 369 },
      { label: "Encolure", x: 443, y: 365 },
      { label: "Ourlet", x: 443, y: 669 },
    ],
    crop: [235, 325, 415, 365],
  },
  "long-sleeve": {
    label: "Haut à manches longues",
    path: "M399 330Q443 400 487 330L550 340Q606 352 627 413L656 574Q668 629 694 680L752 805Q726 826 687 827L625 694Q599 647 584 596L575 472L560 590Q548 627 559 652Q443 681 329 652Q340 625 326 590L312 472L303 596Q288 647 262 694L200 827Q160 826 135 805L194 680Q219 629 232 574L260 413Q282 352 337 340Z",
    anchors: [
      { label: "Épaule gauche", x: 302, y: 369 },
      { label: "Épaule droite", x: 585, y: 369 },
      { label: "Poignet gauche", x: 169, y: 817 },
      { label: "Poignet droit", x: 719, y: 817 },
      { label: "Ourlet", x: 443, y: 669 },
    ],
    crop: [110, 325, 670, 525],
  },
};
export function patternSvg(id: PatternId) {
  const p = ATELIER_PATTERNS[id];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="896" height="1792" viewBox="0 0 887 1774"><path d="${p.path}" fill="#f4e8f3" fill-opacity=".35" stroke="#ec18a4" stroke-width="3"/>${p.anchors.map((a) => `<circle cx="${a.x}" cy="${a.y}" r="5" fill="#007abc"/>`).join("")}</svg>`;
}
