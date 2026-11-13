/** All coordinates are on the approved 887 x 1774 drawing, never on a resized portrait. */
export type Point = readonly [number, number];
export const BONES = [
  { id: "pelvis", parent: null, pivot: [443, 800] },
  { id: "chest", parent: "pelvis", pivot: [443, 460] },
  { id: "head", parent: "chest", pivot: [443, 300] },
  { id: "leftUpperArm", parent: "chest", pivot: [315, 365] },
  { id: "leftForearm", parent: "leftUpperArm", pivot: [257, 610] },
  { id: "leftHand", parent: "leftForearm", pivot: [162, 835] },
  { id: "rightUpperArm", parent: "chest", pivot: [565, 365] },
  { id: "rightForearm", parent: "rightUpperArm", pivot: [744, 550] },
  { id: "rightHand", parent: "rightForearm", pivot: [632, 696] },
  { id: "leftThigh", parent: "pelvis", pivot: [354, 824] },
  { id: "leftShin", parent: "leftThigh", pivot: [347, 1130] },
  { id: "leftFoot", parent: "leftShin", pivot: [336, 1615] },
  { id: "rightThigh", parent: "pelvis", pivot: [532, 824] },
  { id: "rightShin", parent: "rightThigh", pivot: [532, 1130] },
  { id: "rightFoot", parent: "rightShin", pivot: [550, 1615] },
] as const;
export type Bone = (typeof BONES)[number]["id"];
export type Pose = Partial<Record<Bone, number>>;
export type Matrix = readonly [number, number, number, number, number, number];
export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
export function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}
export function transform(m: Matrix, [x, y]: Point): Point {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
export function around([x, y]: Point, degrees: number): Matrix {
  const r = (degrees * Math.PI) / 180,
    c = Math.cos(r),
    s = Math.sin(r);
  return [c, s, -s, c, x - c * x + s * y, y - s * x - c * y];
}
export function solve(pose: Pose): Record<Bone, Matrix> {
  const result = {} as Record<Bone, Matrix>;
  for (const b of BONES)
    result[b.id] = multiply(
      b.parent ? result[b.parent] : IDENTITY,
      around(b.pivot, pose[b.id] ?? 0),
    );
  return result;
}
export const smooth = (t: number) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};
export function blendPose(a: Pose, b: Pose, t: number): Pose {
  const out: Pose = {};
  for (const bone of BONES) {
    const start = a[bone.id] ?? 0,
      delta = (((b[bone.id] ?? 0) - start + 540) % 360) - 180;
    out[bone.id] = start + delta * smooth(t);
  }
  return out;
}
export type Motion = "still" | "breathe" | "greet";
/** Small, calibrated motions first. No foot sliding and no change to the face proportions. */
export function sampleMotion(motion: Motion, seconds: number): Pose {
  if (motion === "still") return {};
  const wave = Math.sin(seconds * 1.8);
  if (motion === "breathe")
    return { head: 0.15 * wave };
  return {
    head: -2 + wave * 0.5,
    leftUpperArm: 3 + wave * 0.5,
    leftForearm: 5 + Math.sin(seconds * 2.4) * 2,
    leftHand: -2,
  };
}
