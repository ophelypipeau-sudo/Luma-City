/** Loopback-only failure injection for the isolated --qa preview, never registered by the game server. */
import { request } from "node:http";
import type { Plugin } from "vite";
import { z } from "zod";

const faultSchema = z.object({ path: z.enum(["/api/housing/save", "/api/housing/buy", "/api/housing/access"]),
  kind: z.enum(["reject", "drop", "delay"]), delayMs: z.number().int().min(100).max(20000).default(8000) }).strict();
export function housingQaProxy(): Plugin {
  let armed: z.infer<typeof faultSchema> | null = null;
  let last: Record<string, unknown> | null = null;
  return { name: "isolated-housing-qa", configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url?.startsWith("/__qa/")) {
        if (req.headers["x-luma-qa"] !== "1" || !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress ?? "")) {
          res.writeHead(403); res.end(); return;
        }
        res.setHeader("Content-Type", "application/json");
        if (req.url === "/__qa/status" && req.method === "GET") { res.end(JSON.stringify({ armed, last })); return; }
        if (req.url === "/__qa/fault" && req.method === "POST") {
          try {
            let body = "";
            for await (const chunk of req) { body += chunk; if (body.length > 2048) throw new Error("body too large"); }
            armed = faultSchema.parse(JSON.parse(body)); last = { ...armed, state: "armed" };
            res.end(JSON.stringify({ ok: true }));
          } catch { res.statusCode = 400; res.end(JSON.stringify({ error: "Invalid QA fault" })); }
          return;
        }
        res.statusCode = 404; res.end(); return;
      }
      if (!armed || req.method !== "POST" || req.url !== armed.path) { next(); return; }
      const fault = armed; armed = null;
      const record = { ...fault, state: "forwarding", upstreamStatus: 0 }; last = record;
      if (fault.kind === "reject") {
        record.state = "rejected"; res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Coupure de recette simulée. Réessaie sans perdre ton brouillon." })); return;
      }
      const upstream = request({ hostname: "127.0.0.1", port: 3002, method: req.method, path: req.url,
        headers: { ...req.headers, host: "127.0.0.1:3002" } }, (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          record.upstreamStatus = response.statusCode ?? 500;
          if (fault.kind === "drop") {
            record.state = "confirmation-replaced-after-response";
            res.writeHead(504, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Confirmation perdue après traitement. Vérifie la même opération." })); return;
          }
          record.state = "held";
          setTimeout(() => {
            if (!res.destroyed) { res.writeHead(response.statusCode ?? 500, response.headers); res.end(Buffer.concat(chunks)); }
            record.state = "returned";
          }, fault.delayMs).unref();
        });
      });
      upstream.on("error", () => { record.state = "upstream-error"; if (!res.destroyed) { res.statusCode = 502; res.end(); } });
      req.pipe(upstream);
    });
  } };
}
