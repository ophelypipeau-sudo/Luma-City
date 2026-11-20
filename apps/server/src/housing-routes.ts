import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { saveHomeSchema, type HomeSnapshot } from "../../../packages/contracts/src/housing.ts";
import type { Database, Query } from "./db.ts";
import { ensureHome, homeSnapshot, saveHome } from "./housing.ts";
import { PlayerError } from "./wardrobe.ts";

export const publicHomeSnapshot = (home: HomeSnapshot): HomeSnapshot => ({
  ...home, ownedFinishes: undefined, inventoryComplete: false, items: home.items.filter((item) => item.roomId === home.roomId),
});
export function registerHousing(app: FastifyInstance, db: Database, deps: {
  active: (token: string, generation: number, q: Query) => Promise<string>;
  serialRequest: <T>(req: FastifyRequest, fn: () => Promise<T>) => Promise<T>;
  serialHome: <T>(owner: string, fn: () => Promise<T>) => Promise<T>;
  canVisit: (q: Query, actor: string, owner: string) => Promise<boolean>;
  publish: (home: HomeSnapshot) => void | Promise<void>;
}) {
  app.post("/api/housing/load", (req, reply) => deps.serialRequest(req, async () => {
    reply.header("Cache-Control", "private, no-store");
    const input = z.object({ generation: z.number().int(), ownerId: z.string().regex(/^[a-z0-9_-]{1,64}$/i) }).strict().parse(req.body);
    return deps.serialHome(input.ownerId, () => db.transaction(async (q) => {
      const actor = await deps.active(req.cookies.session!, input.generation, q);
      if (!await deps.canVisit(q, actor, input.ownerId)) throw new PlayerError("Cette maison est indisponible.");
      await ensureHome(q, input.ownerId);
      const home = await homeSnapshot(q, input.ownerId);
      return { home: actor === input.ownerId ? home : publicHomeSnapshot(home) };
    }));
  }));
  app.post("/api/housing/save", { bodyLimit: 65536 }, (req) => deps.serialRequest(req, async () => {
    const input = saveHomeSchema.parse(req.body);
    const actor = await deps.active(req.cookies.session!, input.generation, db.query);
    return deps.serialHome(actor, async () => {
      const home = await db.transaction(async (q) => {
        const current = await deps.active(req.cookies.session!, input.generation, q);
        return saveHome(q, current, input);
      });
      // Keep commit, geometry replacement and notification in the same room queue.
      await deps.publish(home);
      return { home };
    });
  }));
}
