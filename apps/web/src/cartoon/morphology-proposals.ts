import type { MorphologyId } from "./model";

/** Draft artwork only. These profiles are NOT yet declared ready for clothing.
 * Distinct outlines are authored in the common 480 × 1024 body coordinates;
 * the original face, hands and feet are never scaled or warped. */
export type MorphologyProposal = {
  id: MorphologyId;
  label: string;
  note: string;
  shoulder: number;
  bust: number;
  waist: number;
  belly: number;
  highHip: number;
  lowHip: number;
  highHipY: number;
  thigh: number;
};
export const MORPHOLOGY_PROPOSALS: readonly MorphologyProposal[] = [
  {
    id: "X",
    label: "Sablier · X",
    note: "Équilibré · taille creusée · hanches basses",
    shoulder: 82,
    bust: 78,
    waist: 49,
    belly: 55,
    highHip: 72,
    lowHip: 94,
    highHipY: 487,
    thigh: 66,
  },
  {
    id: "A",
    label: "Poire · A",
    note: "Épaules fines · bassin plus large",
    shoulder: 69,
    bust: 65,
    waist: 54,
    belly: 62,
    highHip: 88,
    lowHip: 115,
    highHipY: 490,
    thigh: 78,
  },
  {
    id: "O",
    label: "Pomme · O",
    note: "Ventre arrondi · taille peu marquée",
    shoulder: 87,
    bust: 91,
    waist: 96,
    belly: 102,
    highHip: 99,
    lowHip: 101,
    highHipY: 480,
    thigh: 68,
  },
  {
    id: "H",
    label: "Rectangle · H",
    note: "Épaules, taille et bassin proches",
    shoulder: 79,
    bust: 74,
    waist: 68,
    belly: 69,
    highHip: 74,
    lowHip: 80,
    highHipY: 484,
    thigh: 57,
  },
  {
    id: "V",
    label: "V inversé",
    note: "Épaules larges · bassin plus étroit",
    shoulder: 105,
    bust: 90,
    waist: 61,
    belly: 63,
    highHip: 69,
    lowHip: 76,
    highHipY: 486,
    thigh: 52,
  },
  {
    id: "8",
    label: "Morphologie · 8",
    note: "Volumes arrondis · hanches hautes",
    shoulder: 91,
    bust: 94,
    waist: 53,
    belly: 65,
    highHip: 110,
    lowHip: 107,
    highHipY: 470,
    thigh: 76,
  },
];
export function morphologyGeometry(p: MorphologyProposal) {
  const c = 243;
  const {
    shoulder: s,
    bust: b,
    waist: w,
    belly: a,
    highHip: h,
    lowHip: l,
    highHipY: hy,
    thigh: t,
  } = p;
  const hipTangent =
    p.id === "O" ? 0 : p.id === "H" ? 4 : p.id === "V" ? 6 : 12;
  const torso = `M223 229H263L266 250Q${c + 34} 260 ${c + s} 268
    Q${c + s + 8} 285 ${c + b} 330
    C${c + b + 2} 362 ${c + (p.id === "O" ? a + 8 : w)} 393 ${c + w} 425
    C${c + a} 446 ${c + h - hipTangent} ${hy - 20} ${c + h} ${hy}
    C${c + h + hipTangent} ${hy + 20} ${c + l + 4} 526 ${c + l} 541
    Q${c + l - 18} 560 ${c + 10} 589Q${c} 599 ${c - 10} 589
    Q${c - l + 18} 560 ${c - l} 541
    C${c - l - 4} 526 ${c - h - hipTangent} ${hy + 20} ${c - h} ${hy}
    C${c - h + hipTangent} ${hy - 20} ${c - a} 446 ${c - w} 425
    C${c - (p.id === "O" ? a + 8 : w)} 393 ${c - b - 2} 362 ${c - b} 330
    Q${c - s - 8} 285 ${c - s} 268Q${c - 34} 260 220 250Z`;
  const leftArm = `M${c - s} 268C${c - s - 26} 267 ${c - s - 24} 297 ${c - s - 29} 334
    Q137 388 122 429L93 521Q104 525 115 521L145 451
    Q164 408 ${c - s + 9} 330L${c - s + 18} 284Z`;
  const rightArm = `M${c + s} 268C${c + s + 26} 267 ${c + s + 24} 297 ${c + s + 29} 334
    Q349 388 364 429L391 521Q380 525 368 521L341 451
    Q322 408 ${c + s - 9} 330L${c + s - 18} 284Z`;
  const leftLeg = `M${c - l} 541Q${c - l - 9} 590 ${198 - t / 2} 655
    Q175 708 177 740Q158 791 174 859L184 941Q202 948 219 941
    L226 839Q233 786 222 740Q223 693 231 636L240 582Z`;
  const rightLeg = `M${c + l} 541Q${c + l + 9} 590 ${288 + t / 2} 655
    Q311 708 309 740Q328 791 312 859L301 941Q284 948 266 941
    L260 839Q253 786 264 740Q263 693 255 636L246 582Z`;
  // Underwear follows this body's contour rather than borrowing a clothed PNG.
  const bandeau = `M${c - b} 319Q${c - b / 2} 307 ${c} 323Q${c + b / 2} 307 ${c + b} 319
    Q${c + b + 4} 350 ${c + w + 14} 379Q${c} 391 ${c - w - 14} 379Q${c - b - 4} 350 ${c - b} 319Z`;
  // Intersect this coverage region with the exact torso contour. This is fitted
  // opaque underwear, not a cropped garment used to conceal a misalignment.
  const briefs = `M80 449Q${c} 466 406 449V525Q${c + 45} 542 ${c + 8} 590
    Q${c} 596 ${c - 8} 590Q${c - 45} 542 80 525Z`;
  return {
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    bandeau,
    briefs,
    anchors: {
      neck: [243, 250],
      shoulders: [
        [c - s, 268],
        [c + s, 268],
      ],
      chest: [
        [c - b, 330],
        [c + b, 330],
      ],
      waist: [
        [c - w, 425],
        [c + w, 425],
      ],
      highHips: [
        [c - h, hy],
        [c + h, hy],
      ],
      hips: [
        [c - l, 541],
        [c + l, 541],
      ],
      crotch: [243, 592],
      wrists: [
        [88, 540],
        [396, 540],
      ],
      knees: [
        [200, 740],
        [286, 740],
      ],
      ankles: [
        [202, 940],
        [284, 940],
      ],
      floor: 1008,
    },
  };
}
