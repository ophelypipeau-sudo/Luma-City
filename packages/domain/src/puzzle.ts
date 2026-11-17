export const PUZZLE_LEVELS = {
  easy: { label: "Facile", columns: 2, rows: 5, count: 10, turns: 1 },
  medium: { label: "Moyen", columns: 4, rows: 5, count: 20, turns: 2 },
  hard: { label: "Difficile", columns: 5, rows: 6, count: 30, turns: 3 },
} as const;

export type PuzzleLevel = keyof typeof PUZZLE_LEVELS;
export type PuzzlePhoto = { id: string; name: string; width: number; height: number };
export type PuzzleConfig = { photo: PuzzlePhoto; level: PuzzleLevel; seed: number };
export type PuzzleRound = {
  id: string;
  config: PuzzleConfig;
  /** Tokens identify the pieces in tray order. The server resolves each token to its slot. */
  tokens: string[];
  placed: number[];
  reward: number;
};

export const puzzlePhotoUrl = (photo: PuzzlePhoto) => `/assets/puzzle/${photo.id}.webp`;

function puzzleRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 2 ** 32;
  };
}

export function puzzleOrder({ level, seed }: PuzzleConfig) {
  const pick = puzzleRandom(seed ^ 0x1a29eb74);
  const order = Array.from({ length: PUZZLE_LEVELS[level].count }, (_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(pick() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function puzzleGrid({ level, photo }: PuzzleConfig) {
  const { columns, rows } = PUZZLE_LEVELS[level];
  return photo.width >= photo.height ? { columns: rows, rows: columns } : { columns, rows };
}

export type PuzzlePoint = { x: number; y: number };
export type PuzzleDrop = PuzzlePoint & { token: string };

function puzzleCell(config: PuzzleConfig) {
  const { columns, rows } = puzzleGrid(config);
  return { columns, rows, width: config.photo.width / columns, height: config.photo.height / rows };
}

/** Coordinates are fractions of the full image, independent of the display size. */
export function puzzleSlot(config: PuzzleConfig, slot: number): PuzzlePoint {
  const { columns, rows } = puzzleGrid(config);
  return { x: (slot % columns + .5) / columns, y: (Math.floor(slot / columns) + .5) / rows };
}

export function puzzleFits(config: PuzzleConfig, slot: number, point: PuzzlePoint) {
  const { columns, rows } = puzzleGrid(config);
  const center = puzzleSlot(config, slot);
  return Math.abs(point.x - center.x) * columns <= .38 &&
    Math.abs(point.y - center.y) * rows <= .38;
}

type Curve = readonly [PuzzlePoint, PuzzlePoint, PuzzlePoint, PuzzlePoint];

function puzzleEdge(start: PuzzlePoint, end: PuzzlePoint, depth: number, middle: number): Curve[] {
  const dx = end.x - start.x, dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const point = (along: number, across: number): PuzzlePoint => ({
    x: start.x + dx * along - dy / length * depth * across,
    y: start.y + dy * along + dx / length * depth * across,
  });
  return [
    [start, point(middle - .24, 0), point(middle - .045, -.12), point(middle - .055, .15)],
    [point(middle - .055, .15), point(middle - .07, .34), point(middle - .17, .38), point(middle - .15, .66)],
    [point(middle - .15, .66), point(middle - .13, 1.14), point(middle + .13, 1.14), point(middle + .15, .66)],
    [point(middle + .15, .66), point(middle + .17, .38), point(middle + .07, .34), point(middle + .055, .15)],
    [point(middle + .055, .15), point(middle + .045, -.12), point(middle + .24, 0), end],
  ];
}

const reverseEdge = (curves: Curve[]): Curve[] =>
  curves.slice().reverse().map(([start, first, second, end]) => [end, second, first, start]);
const svgPoint = ({ x, y }: PuzzlePoint) => `${x.toFixed(4)} ${y.toFixed(4)}`;

export function puzzleGeometry(config: PuzzleConfig) {
  const { columns, rows, width, height } = puzzleCell(config);
  const random = puzzleRandom(config.seed);
  const corner = (col: number, row: number) => ({ x: col * width, y: row * height });
  const sharedEdge = (start: PuzzlePoint, end: PuzzlePoint) => {
    const depth = Math.min(width, height) * (.22 + random() * .08);
    return puzzleEdge(start, end, random() < .5 ? depth : -depth, .40 + random() * .20);
  };
  const horizontal = Array.from({ length: rows - 1 }, (_, row) =>
    Array.from({ length: columns }, (_, col) => sharedEdge(corner(col, row + 1), corner(col + 1, row + 1))));
  const vertical = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns - 1 }, (_, col) => sharedEdge(corner(col + 1, row), corner(col + 1, row + 1))));

  const pieces = Array.from({ length: columns * rows }, (_, slot) => {
    const col = slot % columns, row = Math.floor(slot / columns);
    const topLeft = corner(col, row), topRight = corner(col + 1, row);
    const bottomLeft = corner(col, row + 1), bottomRight = corner(col + 1, row + 1);
    const sides = [
      horizontal[row - 1]?.[col],
      vertical[row]?.[col],
      row < rows - 1 ? reverseEdge(horizontal[row][col]) : undefined,
      col > 0 ? reverseEdge(vertical[row][col - 1]) : undefined,
    ];
    const ends = [topRight, bottomRight, bottomLeft, topLeft];
    const path = `M ${svgPoint(topLeft)} ${sides.map((side, index) =>
      side ? side.map(([, first, second, end]) =>
        `C ${svgPoint(first)} ${svgPoint(second)} ${svgPoint(end)}`).join(" ")
        : `L ${svgPoint(ends[index])}`).join(" ")} Z`;
    return { slot, path, left: topLeft.x, top: topLeft.y, sides };
  });
  return { pieces, width, height, padding: Math.min(width, height) * .34 };
}
