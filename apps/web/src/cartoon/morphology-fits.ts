import type { MorphologyId } from "./model";

/** Calibrated on the approved 887 × 1774 illustrations. All coordinates below
 * are SOURCE pixels. Body, coverage and garment passes use one uniform transform.
 * They do not reuse the rejected vector body outlines or stretch the images. */
export const MORPH_BODY_WIDTH = 887;
export const MORPH_BODY_HEIGHT = 1774;
export const MORPH_SCALE = 1024 / MORPH_BODY_HEIGHT;
export const MORPH_OFFSET_X = (480 - MORPH_BODY_WIDTH * MORPH_SCALE) / 2;
type Pair = readonly [number, number];
type Measurements = {
  bust: Pair;
  chest600: Pair;
  torso650: Pair;
  torso675: Pair;
  waist: Pair;
  hip: Pair;
  calves: readonly [Pair, Pair];
  midCalves: readonly [Pair, Pair];
  ankles: readonly [Pair, Pair];
  feet: readonly [Pair, Pair];
};
export const MORPH_MEASUREMENTS: Record<MorphologyId, Measurements> = {
  X: {
    bust: [325, 564],
    chest600: [345, 541],
    torso650: [362, 524],
    torso675: [370, 516],
    waist: [344, 542],
    hip: [265, 621],
    calves: [
      [301, 421],
      [462, 583],
    ],
    midCalves: [
      [321, 406],
      [477, 563],
    ],
    ankles: [
      [345, 401],
      [483, 539],
    ],
    feet: [
      [317, 417],
      [467, 568],
    ],
  },
  A: {
    bust: [330, 556],
    chest600: [348, 540],
    torso650: [361, 523],
    torso675: [366, 518],
    waist: [348, 536],
    hip: [260, 623],
    calves: [
      [306, 417],
      [463, 575],
    ],
    midCalves: [
      [325, 402],
      [479, 555],
    ],
    ankles: [
      [344, 400],
      [482, 538],
    ],
    feet: [
      [316, 417],
      [467, 568],
    ],
  },
  O: {
    bust: [301, 586],
    chest600: [309, 578],
    torso650: [322, 565],
    torso675: [324, 561],
    waist: [282, 605],
    hip: [244, 640],
    calves: [
      [289, 427],
      [455, 593],
    ],
    midCalves: [
      [307, 409],
      [472, 575],
    ],
    ankles: [
      [342, 403],
      [480, 541],
    ],
    feet: [
      [315, 419],
      [465, 573],
    ],
  },
  H: {
    bust: [324, 562],
    chest600: [340, 545],
    torso650: [346, 538],
    torso675: [348, 536],
    waist: [336, 548],
    hip: [278, 604],
    calves: [
      [302, 417],
      [463, 578],
    ],
    midCalves: [
      [319, 403],
      [476, 560],
    ],
    ankles: [
      [342, 400],
      [481, 540],
    ],
    feet: [
      [315, 417],
      [466, 569],
    ],
  },
  V: {
    bust: [300, 587],
    chest600: [312, 572],
    torso650: [335, 550],
    torso675: [355, 528],
    waist: [364, 520],
    hip: [292, 592],
    calves: [
      [313, 421],
      [462, 569],
    ],
    midCalves: [
      [330, 405],
      [478, 552],
    ],
    ankles: [
      [346, 402],
      [482, 538],
    ],
    feet: [
      [317, 419],
      [466, 570],
    ],
  },
  "8": {
    bust: [316, 571],
    chest600: [335, 551],
    torso650: [356, 529],
    torso675: [364, 521],
    waist: [334, 548],
    hip: [244, 638],
    calves: [
      [294, 426],
      [455, 588],
    ],
    midCalves: [
      [315, 409],
      [473, 566],
    ],
    ankles: [
      [342, 404],
      [480, 542],
    ],
    feet: [
      [314, 420],
      [466, 574],
    ],
  },
};
/** Inner forearm borders measured on the approved images. The source arm may
 * touch the torso on O: restore this anatomical foreground, not a skin patch. */
const FOREARM_EDGES: Record<
  MorphologyId,
  { left: number[][]; right: number[][] }
> = {
  X: {
    left: [
      [320, 675],
      [312, 700],
      [305, 730],
      [296, 760],
      [275, 800],
      [241, 850],
      [209, 900],
    ],
    right: [
      [564, 675],
      [572, 700],
      [579, 730],
      [588, 760],
      [610, 800],
      [643, 850],
      [675, 900],
    ],
  },
  A: {
    left: [
      [321, 675],
      [312, 700],
      [305, 730],
      [296, 760],
      [274, 800],
      [240, 850],
      [208, 900],
    ],
    right: [
      [563, 675],
      [572, 700],
      [579, 730],
      [589, 760],
      [610, 800],
      [644, 850],
      [675, 900],
    ],
  },
  O: {
    left: [
      [313, 675],
      [303, 700],
      [294, 725],
      [287, 740],
      [284, 755],
      [278, 775],
      [265, 800],
      [234, 850],
      [202, 900],
    ],
    right: [
      [571, 675],
      [581, 700],
      [591, 730],
      [601, 755],
      [606, 775],
      [620, 800],
      [651, 850],
      [682, 900],
    ],
  },
  H: {
    left: [
      [321, 675],
      [313, 700],
      [306, 730],
      [296, 760],
      [275, 800],
      [242, 850],
      [210, 900],
    ],
    right: [
      [563, 675],
      [571, 700],
      [578, 730],
      [588, 760],
      [609, 800],
      [642, 850],
      [673, 900],
    ],
  },
  V: {
    left: [
      [306, 675],
      [299, 700],
      [292, 730],
      [282, 760],
      [262, 800],
      [231, 850],
      [202, 900],
    ],
    right: [
      [577, 675],
      [584, 700],
      [591, 730],
      [601, 760],
      [621, 800],
      [653, 850],
      [681, 900],
    ],
  },
  "8": {
    left: [
      [321, 675],
      [313, 700],
      [305, 730],
      [294, 760],
      [287, 775],
      [284, 780],
      [272, 800],
      [238, 850],
      [207, 900],
    ],
    right: [
      [563, 675],
      [571, 700],
      [579, 730],
      [589, 760],
      [596, 775],
      [598, 780],
      [610, 800],
      [644, 850],
      [675, 900],
    ],
  },
};
export function morphologyFit(id: MorphologyId) {
  const m = MORPH_MEASUREMENTS[id],
    [l, r] = m.bust,
    [cl, cr] = m.chest600,
    [tl, tr] = m.torso650,
    [hl, hr] = m.torso675;
  const c = (l + r) / 2;
  const top = `M${l} 535Q${l + 32} 507 ${c - 32} 521L${c} 531L${c + 32} 521Q${r - 32} 507 ${r} 535
    C${r + 4} 563 ${r - 4} 585 ${cr + 3} 603C${tr + 4} 635 ${hr + 4} 658 ${hr + 4} 675
    Q${c} 691 ${hl - 4} 675C${hl - 4} 658 ${tl - 4} 635 ${cl - 3} 603C${l + 4} 585 ${l - 4} 563 ${l} 535Z`;
  const straps = `M${l + 2} 477Q${l + 10} 502 ${l + 23} 535L${l + 33} 533Q${l + 18} 498 ${l + 11} 474Z
    M${r - 2} 477Q${r - 10} 502 ${r - 23} 535L${r - 33} 533Q${r - 18} 498 ${r - 11} 474Z`;
  const [wl, wr] = m.waist,
    [pl, pr] = m.hip,
    bandL = pl + 32,
    bandR = pr - 32,
    hemL = pl - 25,
    hemR = pr + 25;
  const highHipEdges: Record<MorphologyId, Pair> = {
    X: [304, 582],
    A: [309, 575],
    O: [273, 616],
    H: [310, 573],
    V: [328, 556],
    "8": [283, 601],
  };
  const [highL, highR] = highHipEdges[id];
  const skirt = `M${wl} 725Q443 750 ${wr} 725C${wr + 15} 740 ${highR - 14} 762 ${highR} 780C${highR + 16} 806 ${pr - 2} 833 ${pr} 850L${hemR} 1050Q443 1090 ${hemL} 1050L${pl} 850C${pl + 2} 833 ${highL - 16} 806 ${highL} 780C${highL + 14} 762 ${wl - 15} 740 ${wl} 725Z`;
  const belt = `M${wl} 725Q443 750 ${wr} 725Q${wr + 12} 766 ${bandR} 795Q443 835 ${bandL} 795Q${wl - 12} 766 ${wl} 725Z`;
  const boots = m.calves.map(([a, b], i) => {
    const [ma, mb] = m.midCalves[i],
      [aa, ab] = m.ankles[i],
      [fa, fb] = m.feet[i],
      center = (a + b) / 2,
      outer = a - 7,
      inner = b + 7;
    return {
      center,
      outer,
      inner,
      ankle: [aa, ab] as Pair,
      foot: [fa, fb] as Pair,
      front: `M${outer} 1345Q${center} 1366 ${inner} 1345L${mb + 7} 1450Q${ab + 9} 1544 ${ab + 7} 1608L${ab + 10} 1641Q${fb + 5} 1679 ${fb + 7} 1704L${fb + 7} 1717Q${center} 1736 ${fa - 7} 1717L${fa - 8} 1707Q${fa - 1} 1678 ${aa - 8} 1630L${aa - 8} 1600Q${ma - 7} 1500 ${ma - 7} 1450Z`,
      rear: `M${outer - 3} 1346Q${center} 1312 ${inner + 3} 1346L${inner} 1362Q${center} 1345 ${outer} 1362Z`,
      cuff: `M${outer - 4} 1342Q${center} 1361 ${inner + 4} 1342L${inner + 7} 1390Q${center} 1412 ${outer - 7} 1390Z`,
      // Original toes are erased as well, including pixels outside the new sole.
      clear: `M${Math.min(outer, fa) - 12} 1380H${Math.max(inner, fb) + 12}V1774H${Math.min(outer, fa) - 12}Z`,
      sole: `M${fa - 8} 1705Q${center} 1720 ${fb + 7} 1705L${fb + 7} 1725Q${center} 1741 ${fa - 7} 1725Z`,
    };
  });
  return {
    forearms: `M0 675${FOREARM_EDGES[id].left.map(([x, y]) => `L${x} ${y}`).join("")}L220 1070H0Z M887 675${FOREARM_EDGES[id].right.map(([x, y]) => `L${x} ${y}`).join("")}L667 1070H887Z`,
    m,
    c,
    top,
    straps,
    skirt,
    belt,
    bandL,
    bandR,
    hemL,
    hemR,
    boots,
    anchors: {
      neck: [443.5, 430],
      shoulders: [
        [l + 6, 477],
        [r - 6, 477],
      ],
      chest: [
        [l, 550],
        [r, 550],
      ],
      waist: [
        [wl, 725],
        [wr, 725],
      ],
      hips: [
        [pl, 850],
        [pr, 850],
      ],
      knees: [
        [366, 1230],
        [517, 1230],
      ],
      ankles: m.ankles,
      floor: 1734,
    },
  };
}
