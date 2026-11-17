import { randomInt, randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { RewardWheel } from "../../../packages/contracts/src/index.ts";
import { PUZZLE_LEVELS, puzzleFits, puzzleOrder, type PuzzleRound } from "../../../packages/domain/src/puzzle.ts";
import type { Database, Query } from "./db.ts";
import { puzzleCatalog } from "./puzzle-catalog.ts";

const generationSchema = z.object({ generation: z.number().int() });
const roundSchema = generationSchema.extend({ id: z.uuid() });
const dropSchema = roundSchema.extend({
  token: z.uuid(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export function registerPuzzle(app: FastifyInstance, db: Database, {
  active, serialRequest, rewardWheel,
}: {
  active: (token: string, generation: number, q: Query) => Promise<string>;
  serialRequest: <T>(req: FastifyRequest, fn: () => Promise<T>) => Promise<T>;
  rewardWheel: (q: Query, id: string) => Promise<RewardWheel>;
}) {
  app.post("/api/arcade/puzzle/resume", (req) =>
    serialRequest(req, () => db.transaction(async (q) => {
      const { generation } = generationSchema.parse(req.body);
      const player = await active(req.cookies.session!, generation, q);
      const { rows: [round] } = await q(
        "SELECT id,config,tokens,placed,reward FROM puzzle_rounds WHERE character_id=$1 AND closed_at IS NULL",
        [player],
      );
      return {
        round: (round as PuzzleRound | undefined) ?? null,
        wheel: round?.reward ? await rewardWheel(q, player) : undefined,
      };
    })),
  );

  app.post("/api/arcade/puzzle/start", (req) =>
    serialRequest(req, () => db.transaction(async (q) => {
      const { generation, level } = generationSchema.extend({ level: z.enum(PUZZLE_LEVELS_KEYS) }).parse(req.body);
      const player = await active(req.cookies.session!, generation, q);
      const { rows: [last] } = await q(
        "SELECT config->'photo'->>'id' AS photo FROM puzzle_rounds WHERE character_id=$1 ORDER BY sequence DESC LIMIT 1",
        [player],
      );
      const photos = puzzleCatalog.filter((photo) => photo.active);
      if (photos.length === 0) throw new Error("Aucune photo de puzzle n’est disponible.");
      const choices = photos.length > 1 ? photos.filter(({ id }) => id !== last?.photo) : photos;
      const { id, name, width, height } = choices[randomInt(choices.length)];
      const round: PuzzleRound = {
        id: randomUUID(),
        config: { photo: { id, name, width, height }, level, seed: randomInt(2 ** 32) },
        tokens: Array.from({ length: PUZZLE_LEVELS[level].count }, () => randomUUID()),
        placed: [],
        reward: 0,
      };
      await q("UPDATE puzzle_rounds SET closed_at=NOW() WHERE character_id=$1 AND closed_at IS NULL", [player]);
      await q("INSERT INTO puzzle_rounds (id, character_id, config, tokens) VALUES ($1,$2,$3,$4)",
        [round.id, player, round.config, round.tokens]);
      return { round };
    })),
  );

  app.post("/api/arcade/puzzle/place", (req) =>
    serialRequest(req, () => db.transaction(async (q) => {
      const { generation, id, token, x, y } = dropSchema.parse(req.body);
      const player = await active(req.cookies.session!, generation, q);
      const { rows: [saved] } = await q(
        "SELECT id,config,tokens,placed,reward,closed_at FROM puzzle_rounds WHERE id=$1 AND character_id=$2 FOR UPDATE",
        [id, player],
      );
      if (!saved) throw new Error("Partie introuvable.");
      const { closed_at, ...round } = saved as PuzzleRound & { closed_at: unknown };
      if (closed_at && !round.reward) throw new Error("Cette partie est terminée.");
      const index = round.tokens.indexOf(token);
      if (index === -1) throw new Error("Pièce inconnue.");
      const slot = puzzleOrder(round.config)[index];
      if (!puzzleFits(round.config, slot, { x, y })) throw new Error("Cette pièce ne s’emboîte pas ici.");
      if (!round.placed.includes(slot)) {
        round.placed.push(slot);
        const { count, turns } = PUZZLE_LEVELS[round.config.level];
        round.reward = round.placed.length === count ? turns : 0;
        // The final placement is the credit. The existing wheel reads this amount
        // from the same row, so a retry can only return the original reward.
        await q("UPDATE puzzle_rounds SET placed=$2,reward=$3 WHERE id=$1", [id, round.placed, round.reward]);
      }
      return { round, wheel: round.reward ? await rewardWheel(q, player) : undefined };
    })),
  );

  app.post("/api/arcade/puzzle/close", (req) =>
    serialRequest(req, () => db.transaction(async (q) => {
      const { generation, id } = roundSchema.parse(req.body);
      const player = await active(req.cookies.session!, generation, q);
      await q("UPDATE puzzle_rounds SET closed_at=NOW() WHERE id=$1 AND character_id=$2 AND closed_at IS NULL", [id, player]);
      return { closed: true };
    })),
  );
}

const PUZZLE_LEVELS_KEYS = ["easy", "medium", "hard"] as const;
