import type { FastifyInstance, FastifyRequest } from "fastify";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { draftInputSchema } from "../../../packages/contracts/src/atelier.ts";
import { AtelierStore } from "./atelier-store.ts";
import type { AtelierProvider } from "./atelier-provider.ts";
export async function registerAtelier(
  app: FastifyInstance,
  account: (request: FastifyRequest) => string,
  options: {
    root?: string;
    provider?: AtelierProvider;
    recover?: boolean;
  } = {},
) {
  const store = new AtelierStore(
    options.root ?? resolve(".data/atelier"),
    await readFile(resolve("public/assets/avatar/fashion-v2/body-user.png")),
  );
  if (options.recover) await store.recoverInterrupted();
  function editor(req: FastifyRequest) {
    const owner = account(req);
    if (owner !== (process.env.ATELIER_EDITOR_ACCOUNT ?? "aurore"))
      throw new Error("L’atelier est réservé au compte créateur.");
    return owner;
  }
  app.get("/api/atelier/capabilities", async (req) => {
    const owner = account(req);
    return {
      editor: owner === (process.env.ATELIER_EDITOR_ACCOUNT ?? "aurore"),
      automatic: false,
      local: true,
      reason:
        "Atelier local gratuit : détourage dans le navigateur, sans clé ni service externe.",
    };
  });
  app.get("/api/atelier/catalog", async (req) => {
    account(req);
    return store.catalog();
  });
  app.get("/api/atelier/drafts", async (req) => store.list(editor(req)));
  app.get("/api/atelier/trash", async (req) => store.list(editor(req), true));
  app.post<{ Params: { id: string } }>(
    "/api/atelier/drafts/:id/trash",
    async (req) => store.trash(editor(req), req.params.id),
  );
  app.post<{ Params: { id: string } }>(
    "/api/atelier/drafts/:id/restore",
    async (req) => store.trash(editor(req), req.params.id, true),
  );
  app.get<{ Params: { id: string } }>("/api/atelier/drafts/:id", async (req) =>
    store.get(editor(req), req.params.id),
  );
  app.post("/api/atelier/drafts", { bodyLimit: 18_000_000 }, async (req) => {
    const { image } = z.object({ image: z.string() }).parse(req.body);
    return store.create(editor(req), image);
  });
  app.put<{ Params: { id: string } }>(
    "/api/atelier/drafts/:id",
    async (req) => {
      const { revision, ...patch } = draftInputSchema
        .extend({ revision: z.number().int().positive() })
        .parse(req.body);
      return store.update(editor(req), req.params.id, revision, patch);
    },
  );
  app.post<{ Params: { id: string } }>(
    "/api/atelier/drafts/:id/prepared",
    { bodyLimit: 18_000_000 },
    async (req) => {
      const input = z
        .object({ image: z.string(), registered: z.boolean() })
        .parse(req.body);
      return store.uploadPrepared(
        editor(req),
        req.params.id,
        input.image,
        input.registered,
      );
    },
  );
  app.post<{ Params: { id: string } }>(
    "/api/atelier/drafts/:id/masks",
    { bodyLimit: 36_000_000 },
    async (req) => {
      const input = z
        .object({ main: z.string(), detail: z.string() })
        .parse(req.body);
      return store.masks(editor(req), req.params.id, input.main, input.detail);
    },
  );
  app.post<{ Params: { id: string } }>(
    "/api/atelier/drafts/:id/analyze",
    async (req) => {
      editor(req);
      throw new Error(
        "Analyse externe désactivée. Utilise le détourage local gratuit.",
      );
    },
  );
  app.post<{ Params: { id: string } }>(
    "/api/atelier/drafts/:id/prepare",
    async (req) => {
      editor(req);
      throw new Error(
        "Préparation externe désactivée. Utilise le détourage local gratuit.",
      );
    },
  );
  app.post<{ Params: { id: string } }>(
    "/api/atelier/drafts/:id/inspect",
    async (req) => store.inspect(editor(req), req.params.id),
  );
  app.post<{ Params: { id: string } }>(
    "/api/atelier/drafts/:id/publish",
    async (req) => store.publish(editor(req), req.params.id),
  );
  app.get<{ Params: { id: string; file: string } }>(
    "/api/atelier/assets/:id/:file",
    async (req, reply) => {
      const asset = await store.asset(
        account(req),
        req.params.id,
        req.params.file,
      );
      return reply
        .type(asset.mime)
        .header("Cache-Control", "private, no-store")
        .header("X-Content-Type-Options", "nosniff")
        .send(asset.bytes);
    },
  );
}
