import {
  solve,
  transform,
  smooth,
  type Bone,
  type Point,
  type Pose,
} from "./skeleton";
import type { HipRigPart } from "../HandOnHipDoll";
export type Influence = readonly [Bone, number];
export interface Vertex {
  point: Point;
  weights: Influence[];
}
function mix(a: Bone, b: Bone, t: number): Influence[] {
  t = smooth(t);
  return [
    [a, 1 - t],
    [b, t],
  ];
}
function armWeights(x: number, y: number): Influence[] {
  // Distances along the bent arm, with a shared blend around the elbow.
  const a: Point = [565, 365],
    b: Point = [744, 550],
    c: Point = [632, 696];
  const project = (p: Point, q: Point) => {
    const dx = q[0] - p[0],
      dy = q[1] - p[1],
      t = Math.max(
        0,
        Math.min(1, ((x - p[0]) * dx + (y - p[1]) * dy) / (dx * dx + dy * dy)),
      );
    return { t, d: Math.hypot(x - p[0] - t * dx, y - p[1] - t * dy) };
  };
  const upper = project(a, b),
    lower = project(b, c);
  if (upper.d < lower.d)
    return mix("rightUpperArm", "rightForearm", (upper.t - 0.58) / 0.64);
  return mix("rightUpperArm", "rightForearm", 0.5 + lower.t * 0.75);
}
export function weightsAt(part: HipRigPart, x: number, y: number): Influence[] {
  if (part === "hand") return [["rightHand", 1]];
  if (part === "belt") return [["pelvis", 1]];
  if (part === "arm") return armWeights(x, y);
  if (y < 300) return [["head", 1]];
  if (y < 365) return mix("head", "chest", (y - 300) / 65);
  // The hanging arm is separate from the torso in this part of the drawing.
  const edge = 327 - (y - 365) * 0.26;
  if (y >= 365 && y < 1010 && x < edge) {
    if (y < 550) return [["leftUpperArm", 1]];
    if (y < 670) return mix("leftUpperArm", "leftForearm", (y - 550) / 120);
    if (y < 800) return [["leftForearm", 1]];
    return mix("leftForearm", "leftHand", (y - 800) / 80);
  }
  if (y < 600) return [["chest", 1]];
  if (y < 790) return mix("chest", "pelvis", (y - 600) / 190);
  if (y < 930) return [["pelvis", 1]];
  const left = x < 443,
    thigh: Bone = left ? "leftThigh" : "rightThigh",
    shin: Bone = left ? "leftShin" : "rightShin",
    foot: Bone = left ? "leftFoot" : "rightFoot";
  if (y < 1000) return mix("pelvis", thigh, (y - 930) / 70);
  if (y < 1070) return [[thigh, 1]];
  if (y < 1190) return mix(thigh, shin, (y - 1070) / 120);
  if (y < 1580) return [[shin, 1]];
  return mix(shin, foot, (y - 1580) / 95);
}
export function createMesh(part: HipRigPart, step = 24) {
  const cols = Math.ceil(887 / step),
    rows = Math.ceil(1774 / step),
    vertices: Vertex[] = [],
    indices: number[] = [];
  for (let row = 0; row <= rows; row++)
    for (let col = 0; col <= cols; col++) {
      const x = (col * 887) / cols,
        y = (row * 1774) / rows;
      vertices.push({ point: [x, y], weights: weightsAt(part, x, y) });
    }
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const i = row * (cols + 1) + col;
      indices.push(i, i + 1, i + cols + 1, i + 1, i + cols + 2, i + cols + 1);
    }
  return { vertices, indices: new Uint16Array(indices) };
}
export function skin(vertices: Vertex[], pose: Pose) {
  const matrices = solve(pose),
    positions = new Float32Array(vertices.length * 2);
  vertices.forEach((v, i) => {
    for (const [bone, weight] of v.weights) {
      const p = transform(matrices[bone], v.point);
      positions[2 * i] += p[0] * weight;
      positions[2 * i + 1] += p[1] * weight;
    }
  });
  return positions;
}
