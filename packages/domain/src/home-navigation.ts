import type { HomeMotion, HomePoint, HomeSnapshot } from "../../contracts/src/housing.ts";
import { furnitureModel, HOME_FLOOR, HOME_HEIGHT, HOME_WIDTH } from "./housing.ts";

export const HOME_MOVE_SPEED = 160;
export const HOME_WALK_BOUNDS = { left: 70, right: HOME_WIDTH - 70, top: HOME_FLOOR + 16, bottom: HOME_HEIGHT - 46 } as const;
const STEP = 10;
// Percentage round-trips (438 / 6.8 * 6.8) introduce sub-pixel floating-point error.
const EPSILON = 1e-7;
const FOOT_RADIUS = { x: 18, y: 12 };
export type HomeObstacle = { left: number; right: number; top: number; bottom: number };
export type HomeNavigationMesh = { obstacles: HomeObstacle[]; blocked: Uint8Array };
const { left, right, top, bottom } = HOME_WALK_BOUNDS;
const columns = Math.ceil((right - left) / STEP) + 1;
const rows = Math.ceil((bottom - top) / STEP) + 1;
const grid = Array.from({ length: columns * rows }, (_, i) => ({
  x: Math.min(right, left + (i % columns) * STEP),
  y: Math.min(bottom, top + Math.floor(i / columns) * STEP),
}));
export const homeDistance = (a: HomePoint, b: HomePoint) => Math.hypot(b.x - a.x, b.y - a.y);
export const inHomeWalkBounds = (p: HomePoint) => Number.isFinite(p.x) && Number.isFinite(p.y)
  && p.x >= left - EPSILON && p.x <= right + EPSILON && p.y >= top - EPSILON && p.y <= bottom + EPSILON;
const inside = (p: HomePoint, r: HomeObstacle) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
export function canStandInHome(mesh: HomeNavigationMesh, p: HomePoint) {
  return inHomeWalkBounds(p) && !mesh.obstacles.some((rectangle) => inside(p, rectangle));
}
export function createHomeNavigationMesh(home: Pick<HomeSnapshot, "items" | "decoration">): HomeNavigationMesh {
  const items = new Map(home.items.map((item) => [item.id, item]));
  const obstacles = home.decoration.placements.flatMap((p) => {
    const item = items.get(p.itemId), model = item && furnitureModel(item.modelId);
    if (!model || !model.blocksMovement || model.placement !== "floor") return [];
    return [{ left: p.x - model.footprint.width / 2 - FOOT_RADIUS.x,
      right: p.x + model.footprint.width / 2 + FOOT_RADIUS.x,
      top: p.y - model.footprint.height - FOOT_RADIUS.y, bottom: p.y + FOOT_RADIUS.y }];
  });
  const mesh: HomeNavigationMesh = { obstacles, blocked: new Uint8Array(grid.length) };
  grid.forEach((p, i) => { mesh.blocked[i] = canStandInHome(mesh, p) ? 0 : 1; });
  return mesh;
}

/** Exact segment/rectangle intersection: diagonal shortcuts never cut a corner. */
function touchesRectangle(a: HomePoint, b: HomePoint, r: HomeObstacle) {
  let from = 0, to = 1;
  for (const [origin, delta, low, high] of [[a.x, b.x - a.x, r.left, r.right], [a.y, b.y - a.y, r.top, r.bottom]]) {
    if (Math.abs(delta) < 1e-9) { if (origin < low || origin > high) return false; }
    else {
      const one = (low - origin) / delta, two = (high - origin) / delta;
      from = Math.max(from, Math.min(one, two)); to = Math.min(to, Math.max(one, two));
      if (from > to) return false;
    }
  }
  return true;
}
export function homeSegmentClear(mesh: HomeNavigationMesh, a: HomePoint, b: HomePoint) {
  return canStandInHome(mesh, a) && canStandInHome(mesh, b)
    && !mesh.obstacles.some((rectangle) => touchesRectangle(a, b, rectangle));
}
export function nearestHomePoint(mesh: HomeNavigationMesh, preferred: HomePoint, available: (point: HomePoint) => boolean = () => true): HomePoint | null {
  if (canStandInHome(mesh, preferred) && available(preferred)) return { ...preferred };
  let best: HomePoint | null = null, distance = Infinity;
  grid.forEach((p, i) => { if (!mesh.blocked[i] && available(p)) {
    const d = homeDistance(preferred, p); if (d < distance) { best = p; distance = d; }
  } });
  return best ? { ...(best as HomePoint) } : null;
}
export function findHomePath(mesh: HomeNavigationMesh, start: HomePoint, destination: HomePoint): HomePoint[] | null {
  if (!canStandInHome(mesh, start) || !canStandInHome(mesh, destination)) return null;
  if (homeDistance(start, destination) < .01) return [{ ...start }];
  if (homeSegmentClear(mesh, start, destination)) return [{ ...start }, { ...destination }];
  const open = new Set<number>(), closed = new Set<number>();
  const costs = new Map<number, number>(), previous = new Map<number, number>();
  grid.forEach((p, i) => {
    if (!mesh.blocked[i] && homeDistance(start, p) <= STEP * 2 && homeSegmentClear(mesh, start, p)) {
      open.add(i); costs.set(i, homeDistance(start, p));
    }
  });
  while (open.size) {
    let current = -1, score = Infinity;
    for (const i of open) {
      const candidate = costs.get(i)! + homeDistance(grid[i], destination);
      if (candidate < score) { current = i; score = candidate; }
    }
    const p = grid[current]; open.delete(current); closed.add(current);
    if (homeSegmentClear(mesh, p, destination)) {
      const path: HomePoint[] = [{ ...destination }, p];
      for (let i = current; previous.has(i);) { i = previous.get(i)!; path.push(grid[i]); }
      path.push({ ...start }); path.reverse();
      // Preserve exact endpoints, removing only segments with verified line of sight.
      const smooth = [path[0]];
      for (let i = 0; i < path.length - 1;) {
        let next = path.length - 1;
        while (next > i + 1 && !homeSegmentClear(mesh, path[i], path[next])) next--;
        smooth.push(path[next]); i = next;
      }
      return smooth;
    }
    const col = current % columns, row = Math.floor(current / columns);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if ((!dx && !dy) || col + dx < 0 || col + dx >= columns || row + dy < 0 || row + dy >= rows) continue;
      const i = (row + dy) * columns + col + dx;
      if (closed.has(i) || mesh.blocked[i] || !homeSegmentClear(mesh, p, grid[i])) continue;
      const cost = costs.get(current)! + homeDistance(p, grid[i]);
      if (cost < (costs.get(i) ?? Infinity)) { costs.set(i, cost); previous.set(i, current); open.add(i); }
    }
  }
  return null;
}

/** Shared server/client sampling: constant speed, exact stop, no changes to the sprite. */
export function sampleHomeMotion(motion: HomeMotion, now: number) {
  let remaining = Math.max(0, now - motion.startedAt) * motion.speed / 1000;
  for (let i = 1; i < motion.points.length; i++) {
    const from = motion.points[i - 1], to = motion.points[i], length = homeDistance(from, to);
    if (length > 0 && remaining < length) {
      const fraction = remaining / length;
      return { x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction, done: false };
    }
    remaining -= length;
  }
  return { ...motion.points[motion.points.length - 1], done: true };
}
