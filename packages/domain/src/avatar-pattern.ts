/** Native mannequin anchors. Garments and skin use this same arm cage. */
export type Point = readonly [number, number];
export type Pose = "front" | "hand-on-hip" | "heart-hands";
export const DOLL_PATTERN = {
  id: "iris-canonical-pattern-v1",
  canvas: [887, 1774],
  bodySha256:
    "8e3b61c5a45e5ddc9ee528530ced84eea3bd883a1a2e05914b81fd46e3b269e4",
  torso: [
    [345, 323, 559],
    [400, 328, 557],
    [480, 325, 564],
    [520, 333, 556],
    [550, 347, 539],
    [600, 362, 524],
    [650, 345, 542],
    [690, 319, 569],
    [750, 288, 600],
    [800, 270, 617],
    [850, 261, 625],
    [970, 270, 617],
  ],
  armSeam: [
    [300, 330],
    [480, 330],
    [520, 329],
    [550, 330],
    [600, 329],
    [650, 314],
    [690, 294],
    [750, 258],
    [800, 260],
    [880, 250],
  ],
  arms: {
    front: [
      [310, 345],
      [285, 500],
      [262, 600],
      [220, 710],
      [170, 815],
    ],
    "hand-on-hip": [
      [577, 345],
      [638, 435],
      [714, 550],
      [687, 615],
      [625, 684],
    ],
    "heart-hands": [
      [310, 345],
      [276, 475],
      [245, 600],
      [295, 520],
      [348, 442],
    ],
  },
  waistY: 690,
  ankles: [
    [333.5, 1600],
    [550, 1600],
  ],
  floorY: 1760,
} as const;
export function interpolate(
  rows: readonly (readonly number[])[],
  y: number,
  column = 1,
) {
  const b = rows.findIndex((r) => r[0] >= y);
  if (b <= 0) return rows[b === 0 ? 0 : rows.length - 1][column];
  const a = rows[b - 1],
    c = rows[b];
  return a[column] + ((c[column] - a[column]) * (y - a[0])) / (c[0] - a[0]);
}
export function torsoBounds(y: number, ease = 0): Point {
  return [
    interpolate(DOLL_PATTERN.torso, y, 1) - ease,
    interpolate(DOLL_PATTERN.torso, y, 2) + ease,
  ];
}
export function seam(y: number) {
  return interpolate(DOLL_PATTERN.armSeam, y);
}
/** Exact counterpart of the arm texture split: never remove extra shoulder skin. */
export function restingArmMask(side: "left" | "right") {
  const x = (v: number) => (side === "left" ? v : 887 - v);
  const rows = [
    [335, seam(335)],
    ...DOLL_PATTERN.armSeam.filter((r) => r[0] >= 345),
    [1015, seam(1015)],
  ];
  return `M${x(0)} 335L${rows.map(([y, v]) => `${x(v)} ${y}`).join("L")}L${x(0)} 1015Z`;
}
export function armAxis(pose: Pose, side: "left" | "right"): Point[] {
  const axis =
    pose === "hand-on-hip" && side === "left"
      ? DOLL_PATTERN.arms.front
      : DOLL_PATTERN.arms[pose];
  const mirror =
    pose === "hand-on-hip" && side === "left"
      ? false
      : side === (pose === "hand-on-hip" ? "left" : "right");
  return axis.map(([x, y]) => [mirror ? 887 - x : x, y]);
}
/** Continuous quad strip; no separately rotated upper/lower rectangles at the elbow. */
export function armFrame(axis: readonly Point[], t: number) {
  const k = Math.min(axis.length - 2, Math.floor(t * (axis.length - 1))),
    u = t * (axis.length - 1) - k;
  const a = axis[k],
    b = axis[k + 1],
    before = axis[Math.max(0, k - 1)],
    after = axis[Math.min(axis.length - 1, k + 2)];
  const cubic = (c: number) =>
    0.5 *
    (2 * a[c] +
      (-before[c] + b[c]) * u +
      (2 * before[c] - 5 * a[c] + 4 * b[c] - after[c]) * u * u +
      (-before[c] + 3 * a[c] - 3 * b[c] + after[c]) * u * u * u);
  const p: Point = [cubic(0), cubic(1)];
  const tangent = (i: number): Point => {
    const a = axis[Math.max(0, i - 1)],
      b = axis[Math.min(axis.length - 1, i + 1)],
      d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
  };
  const va = tangent(k),
    vb = tangent(k + 1),
    dx = va[0] * (1 - u) + vb[0] * u,
    dy = va[1] * (1 - u) + vb[1] * u,
    d = Math.hypot(dx, dy);
  return { p, n: [dy / d, -dx / d] as Point };
}
