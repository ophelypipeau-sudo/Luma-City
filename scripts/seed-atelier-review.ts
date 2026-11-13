/** Local QA fixture only. Uses ordinary authenticated routes, never a live AI call. */
import { readFile, writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:3001";
const login = await fetch(base + "/api/login", {
  method: "POST",
  headers: { Origin: base, "Content-Type": "application/json" },
  body: JSON.stringify({ account: "aurore" }),
});
if (!login.ok) throw new Error("QA login failed");
const cookie = login.headers.get("set-cookie")!.split(";")[0];
async function call(path: string, body?: unknown, method?: string) {
  const r = await fetch(base + "/api/atelier" + path, {
    method: method ?? (body ? "POST" : "GET"),
    headers: {
      Cookie: cookie,
      Origin: base,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = (await r.json()) as any;
  if (!r.ok) throw new Error(d.error);
  return d;
}
const source =
  "data:image/png;base64," +
  (await readFile("docs/rose-outfit-v1/source.png")).toString("base64");
let draft = await call("/drafts", { image: source });
draft = await call(
  "/drafts/" + draft.id,
  {
    ...draft,
    name: "Caraco · essai atelier",
    hasDetail: true,
    detailLabel: "Bordures et nœud",
  },
  "PUT",
);
draft = await call("/drafts/" + draft.id + "/prepared", {
  image:
    "data:image/png;base64," +
    (await readFile("docs/atelier/approved-top-fixture.png")).toString(
      "base64",
    ),
  registered: true,
});
await writeFile(
  "docs/atelier/qa-draft.json",
  JSON.stringify(
    { id: draft.id, status: draft.status, report: draft.report },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ id: draft.id, status: draft.status, report: draft.report }),
);
