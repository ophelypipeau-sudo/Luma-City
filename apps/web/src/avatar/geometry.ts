/** Native source-pixel geometry shared by garment paint and body cutouts. */
export type Pair = readonly [number, number];
export type GarmentGeometry = {
  forearms: string;
  m: {
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
  c: number;
  top: string;
  straps: string;
  skirt: string;
  belt: string;
  bandL: number;
  bandR: number;
  hemL: number;
  hemR: number;
  boots: {
    center: number;
    outer: number;
    inner: number;
    ankle: Pair;
    foot: Pair;
    front: string;
    rear: string;
    cuff: string;
    clear: string;
    sole: string;
  }[];
  anchors: {
    neck: number[];
    shoulders: number[][];
    chest: number[][];
    waist: number[][];
    hips: number[][];
    knees: number[][];
    ankles: readonly [Pair, Pair];
    floor: number;
  };
};
