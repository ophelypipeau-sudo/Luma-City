export const ARCADE_GAMES = ["petal", "comet", "prism", "memory", "mole"] as const;
export type ArcadeGame = (typeof ARCADE_GAMES)[number];
export type ColumnGame = Exclude<ArcadeGame, "memory" | "mole">;
export const ARCADE_COLUMNS = 5;
export const MEMORY_PAIRS = 4;
export const MEMORY_CARDS = MEMORY_PAIRS * 2;
export const ARCADE_TARGET_LEVEL = 5;
export const ARCADE_MAX_MOVES = 80;
export const REWARD_PICKUP_LIMIT = 5;
export function splitReward(amount: number): number[] {
  const count = Math.min(REWARD_PICKUP_LIMIT, amount);
  return Array.from({ length: count }, (_, slot) =>
    Math.floor(amount / count) + Number(slot < amount % count),
  );
}
export const WHEEL_PRIZES = [
  { currency: "coins", amount: 500 },
  { currency: "xp", amount: 1000 },
  { currency: "coins", amount: 2500 },
  { currency: "xp", amount: 4600 },
  { currency: "coins", amount: 1500 },
  { currency: "xp", amount: 2500 },
] as const;
export type WheelPrize = { currency: (typeof WHEEL_PRIZES)[number]["currency"] | "diamonds"; amount: number };
export const arcadeLevel = (score: number) => Math.min(5, 1 + Math.floor(score / 4));

export type ArcadeRound = {
  grid: number[][];
  score: number;
  next: number[];
  over: boolean;
};

function random(seed: number) {
  let value = seed >>> 0;
  return (max: number) => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return Math.floor((value / 4294967296) * max);
  };
}

export const MOLE_TARGET = 10;
export const MOLE_LIVES = 3;
export const MOLE_HOLES = 9;
export const MOLE_MISS = MOLE_HOLES;

export function replayMole(seed: number, moves: readonly number[]) {
  const pick = random(seed);
  let hits = 0;
  let lives = MOLE_LIVES;
  let hole = pick(MOLE_HOLES);
  for (const move of moves) {
    if (hits === MOLE_TARGET || lives === 0 || (move !== hole && move !== MOLE_MISS))
      throw new Error("Coup invalide.");
    if (move === hole) hits++;
    else lives--;
    const next = pick(MOLE_HOLES - 1);
    hole = next < hole ? next : next + 1;
  }
  return { hits, lives, hole };
}

/** Four pairs, shuffled once by the server's seed. Mistakes cost no points. */
export function replayMemory(seed: number, moves: readonly number[]) {
  const pick = random(seed);
  const deck = Array.from({ length: MEMORY_CARDS }, (_, i) => i % MEMORY_PAIRS);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const matched = new Set<number>();
  let pending: number | null = null;
  let mismatch: readonly [number, number] | null = null;
  for (const card of moves.slice(0, ARCADE_MAX_MOVES)) {
    if (matched.size === deck.length) break;
    if (!Number.isInteger(card) || card < 0 || card >= deck.length || matched.has(card) || card === pending) continue;
    mismatch = null;
    if (pending === null) {
      pending = card;
    } else {
      if (deck[pending] === deck[card]) {
        matched.add(pending);
        matched.add(card);
      } else {
        mismatch = [pending, card];
      }
      pending = null;
    }
  }
  return { deck, matched, pending, mismatch, score: matched.size * 2, over: moves.length >= ARCADE_MAX_MOVES };
}
const blank = () => Array.from({ length: 6 }, () => Array<number>(ARCADE_COLUMNS).fill(0));
function lowest(grid: number[][], col: number) {
  for (let row = grid.length - 1; row >= 0; row--)
    if (grid[row][col]) return row;
  return -1;
}

/** The server and browser replay the same moves from a server-issued seed. */
export function replayArcade(game: ColumnGame, seed: number, moves: readonly number[]): ArcadeRound {
  const pick = random(seed), grid = blank();
  let score = 0, over = false;
  const petal = () => Array.from({ length: 1 + pick(2) }, () => 1 + pick(3));
  let next = game === "petal" ? petal() : [];
  const refill = () => {
    const height = game === "comet" ? 3 : 4;
    for (let row = 0; row < height; row++)
      for (let x = 0; x < ARCADE_COLUMNS; x++)
        grid[row][x] = 1 + pick(3);
    if (game === "comet")
      grid[0][pick(ARCADE_COLUMNS)] = 4;
  };
  if (game !== "petal") refill();
  if (game === "prism") next = [1 + pick(3)];
  for (const col of moves) {
    if (over || arcadeLevel(score) >= ARCADE_TARGET_LEVEL) break;
    if (game === "petal") {
      const first = grid.findIndex((row) => row[col] !== 0);
      const landing = first === -1 ? grid.length : first;
      if (landing < next.length) {
        over = !grid[0].some((cell) => !cell);
        continue;
      }
      next.forEach((value, i) => { grid[landing - 1 - i][col] = value; });
      score += next.length;
      const full = grid.filter((row) => row.every(Boolean)).length;
      if (full) {
        const remaining = grid.filter((row) => !row.every(Boolean));
        grid.splice(0, grid.length, ...blank().slice(0, full), ...remaining);
        score += 4 * full;
      }
      next = petal();
      over = grid[0].every(Boolean);
    } else if (game === "comet") {
      // The comet enters from below, then can bounce to an adjacent column.
      const row = lowest(grid, col);
      if (row < 0) continue;
      const hit = grid[row][col];
      grid[row][col] = 0;
      score += 1;
      if (hit === 4) {
        score += 3;
        for (const adjacent of [col - 1, col + 1])
          if (grid[row][adjacent]) {
            grid[row][adjacent] = 0;
            score++;
          }
      } else {
        const bounce = col + (hit === 1 ? -1 : 1);
        if (grid[row - 1]?.[bounce] === hit) {
          grid[row - 1][bounce] = 0;
          score += 2;
        }
      }
    } else {
      // Rotate the colour at the cannon or fire it into a matching column.
      if (col === ARCADE_COLUMNS) {
        next = [next[0] % 3 + 1];
        continue;
      }
      const row = lowest(grid, col);
      if (row < 0 || grid[row][col] !== next[0]) continue;
      const color = next[0];
      grid[row][col] = 0;
      score += 2;
      for (const adjacent of [col - 1, col + 1])
        if (grid[row][adjacent] === color) {
          grid[row][adjacent] = 0;
          score++;
        }
      next = [1 + pick(3)];
    }
    if (game !== "petal" && grid.every((row) => row.every((cell) => !cell))) refill();
  }
  return { grid, score, next, over: over || moves.length >= ARCADE_MAX_MOVES };
}
