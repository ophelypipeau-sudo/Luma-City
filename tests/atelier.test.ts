import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AtelierStore } from "../apps/server/src/atelier-store";
import { imageUpload, inspectPiece, pngPixels } from "../apps/server/src/atelier-images";
import { openAIProvider } from "../apps/server/src/atelier-provider";
import { defaultDraft, checkIds } from "../packages/contracts/src/atelier";
import { paintColorRegions } from "../packages/domain/src/atelier-color";
import { ATELIER_PATTERNS } from "../packages/domain/src/atelier-patterns";
import { AvatarGarment } from "../apps/web/src/avatar/LayeredDoll";
import {
  avatarGarment,
  registerAtelierGarment,
  avatarCatalogSnapshot,
  AVATAR_GARMENTS,
} from "../apps/web/src/avatar/catalog";
import { atelierGarment } from "../apps/web/src/atelier/catalog";
import { sleevelessPoseProfile } from "../apps/web/src/avatar/pose-wardrobe";
import { createApp } from "../apps/server/src/app";
import { openDatabase } from "../apps/server/src/db";

const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
const photo = new Resvg(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100"><rect width="80" height="100" fill="pink"/></svg>',
)
  .render()
  .asPng();
const data = (b: Uint8Array) =>
  "data:image/png;base64," + Buffer.from(b).toString("base64");
let prepared: Buffer;
function garment() {
  if (prepared) return prepared;
  // A stable opaque test pattern decouples import validation from changing
  // boutique designs (a low neckline is not the atelier's generic tank).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><path d="${ATELIER_PATTERNS.tank.path}" fill="#ddd"/></svg>`;
  prepared = Buffer.from(new Resvg(svg).render().asPng());
  return prepared;
}
const temp = () => mkdtemp(join(tmpdir(), "atelier-test-"));

test("all three reusable patterns cover the canonical underwear without covering face or hands", () => {
  for (const [id, p] of Object.entries(ATELIER_PATTERNS)) {
    const png = new Resvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><path d="${p.path}" fill="#888"/></svg>`,
    )
      .render()
      .asPng();
    assert.ok(
      inspectPiece(Buffer.from(png), body, defaultDraft.placement).every(
        (r) => r.ok,
      ),
      id,
    );
    assert.ok(p.anchors.length >= 4, id + " common anchors");
    if (id === "long-sleeve") {
      assert.equal(
        inspectPiece(Buffer.from(png), body, {
          x: -160,
          y: 0,
          scaleX: 1.4,
          scaleY: 1,
        })[0].ok,
        false,
        "clipped sleeves must block publication",
      );
    }
  }
});

test("drafts are private, photos cannot be published as clothes, checks block incomplete imports and publications persist immutably", async () => {
  const root = await temp(),
    store = new AtelierStore(root, body),
    d = await store.create("aurore", data(photo));
  await assert.rejects(store.get("sacha", d.id), /inconnu/);
  assert.deepEqual(await store.list("sacha"), []);
  await assert.rejects(store.publish("aurore", d.id), /révision/);
  await assert.rejects(
    store.uploadPrepared("aurore", d.id, data(photo), false),
    /transparent/,
  );
  const fitted = await store.uploadPrepared(
    "aurore",
    d.id,
    data(garment()),
    true,
  );
  assert.ok(
    fitted.report?.every((r) => r.ok),
    JSON.stringify(fitted.report),
  );
  assert.ok(fitted.mainTone, "a new import measures its fabric tone");
  assert.notEqual(fitted.mainColor, defaultDraft.mainColor, "white remains selectable for a colored import");
  const prepared = pngPixels((await store.asset("aurore", d.id, "front")).bytes).pixels;
  const mainMask = pngPixels((await store.asset("aurore", d.id, "mask1")).bytes).pixels;
  const detailMask = pngPixels((await store.asset("aurore", d.id, "mask2")).bytes).pixels;
  for (let i = 3; i < prepared.length; i += 4) {
    if (prepared[i] > 8) assert.equal(mainMask[i], 255, "shadows do not weaken the dye mask");
    assert.equal(detailMask[i], 0, "secondary material requires an explicit mask");
  }
  await assert.rejects(store.publish("aurore", d.id), /Valider tous/);
  const updated = await store.update("aurore", d.id, fitted.revision, {
    ...defaultDraft,
    name: "Caraco importé de contrôle",
    checks: [...checkIds],
    hasDetail: true,
  });
  const pub = await store.publish("aurore", d.id);
  assert.equal(pub.publication.price, 350);
  assert.deepEqual(pub.publication.mainTone, fitted.mainTone);
  assert.equal((await store.catalog()).length, 1);
  const first = await store.asset("sacha", d.id, "v1-front");
  await assert.rejects(store.trash("sacha", d.id), /inconnu/);
  await store.trash("aurore", d.id);
  assert.equal((await store.catalog()).length, 0);
  assert.equal((await store.list("aurore")).length, 0);
  assert.equal((await store.list("aurore", true)).length, 1);
  await assert.rejects(store.get("aurore", d.id), /corbeille/);
  const afterTrash = new AtelierStore(root, body);
  const restoredDraft = await afterTrash.trash("aurore", d.id, true);
  assert.equal((await afterTrash.catalog()).length, 1);
  assert.equal((await afterTrash.list("aurore", true)).length, 0);
  assert.deepEqual(
    (await afterTrash.asset("aurore", d.id, "source")).bytes,
    photo,
  );
  assert.ok(first.bytes.length > 200);
  await assert.rejects(store.asset("sacha", d.id, "source"), /inconnue/);
  await store.update("aurore", d.id, restoredDraft.revision, {
    ...updated,
    name: "Révision 2",
    placement: { x: 100, y: 0, scaleX: 1, scaleY: 1 },
  });
  await assert.rejects(store.publish("aurore", d.id), /Valider tous/);
  const restarted = new AtelierStore(root, body);
  assert.equal(
    (await restarted.catalog())[0].name,
    "Caraco importé de contrôle",
  );
  assert.deepEqual(
    (await restarted.asset("sacha", d.id, "v1-front")).bytes,
    first.bytes,
  );
  const draftPiece = atelierGarment(pub.publication);
  // Publishing a front-only draft must not silently approve its other poses.
  assert.throws(() => registerAtelierGarment(draftPiece, true), /ajustement/);
  const piece = {
    ...draftPiece,
    poseProfile: sleevelessPoseProfile(),
    pattern: avatarGarment("fashion.rose-bow-camisole").pattern,
  };
  registerAtelierGarment(piece, true);
  assert.equal(avatarGarment(piece.id).art.kind, "image");
  assert.ok(avatarCatalogSnapshot().some((p) => p.id === piece.id));
  assert.equal(AVATAR_GARMENTS.length, 6);
  await assert.rejects(store.update("aurore", d.id, 1, defaultDraft), /changé/);
});

test("actual alpha checks detect uncovered bra, head or hands, and source validation rejects disguised files", () => {
  assert.throws(
    () =>
      imageUpload(
        "data:image/png;base64," +
          Buffer.from("not png data at all long enough").toString("base64"),
      ),
    /correspond/,
  );
  const p = garment();
  assert.ok(inspectPiece(p, body, defaultDraft.placement).every((r) => r.ok));
  assert.ok(
    inspectPiece(p, body, { ...defaultDraft.placement, y: 100 }).some(
      (r) => !r.ok,
    ),
  );
  assert.ok(
    inspectPiece(body, body, defaultDraft.placement).some(
      (r) => !r.ok && r.label.includes("Visage"),
    ),
  );
});

test("explicit material masks recolor only painted regions and preserve alpha and protected prints", () => {
  const pixels = new Uint8ClampedArray([
    200, 200, 200, 255, 40, 30, 35, 230, 70, 80, 90, 0,
  ]);
  const main = new Uint8ClampedArray([
    255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  const detail = new Uint8ClampedArray([
    0, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0,
  ]);
  const out = paintColorRegions(
    new Uint8ClampedArray(pixels),
    main,
    undefined,
    { main: "#ff0000", mainBase: "#ffffff", detailBase: "#202024" },
  );
  assert.deepEqual([...out.subarray(0, 4)], [200, 0, 0, 255]);
  assert.deepEqual(out.subarray(4), pixels.subarray(4));
  const both = paintColorRegions(new Uint8ClampedArray(pixels), main, detail, {
    main: "#ff0000",
    detail: "#00ff00",
    mainBase: "#ffffff",
    detailBase: "#202024",
  });
  assert.equal(both[4], 0);
  assert.ok(both[5] > 100);
  assert.equal(both[7], 230);
  assert.equal(both[11], 0);
});

test("photo jobs use the configured provider, preserve sources, handle failures and recover interrupted work", async () => {
  const root = await temp(),
    store = new AtelierStore(root, body, {
      analyze: async () => ({
        items: [
          {
            name: "Caraco",
            kind: "top",
            pattern: "tank",
            occluded: true,
            notes: "Bretelle cachée",
          },
        ],
      }),
      prepare: async () => ({
        png: garment(),
        prompt: "test registration prompt",
      }),
    });
  const d = await store.create("aurore", data(photo));
  await store.start("aurore", d.id, "analyze");
  async function done() {
    for (let i = 0; i < 200; i++) {
      const current = await store.get("aurore", d.id);
      if (current.status !== "preparing") return current;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error("job did not finish");
  }
  const analyzed = await done();
  assert.equal(analyzed.analysis?.items[0].occluded, true);
  await store.start("aurore", d.id, "prepare");
  const fitted = await done();
  assert.equal(fitted.status, "review");
  assert.ok(fitted.preparedUrl);
  assert.deepEqual((await store.asset("aurore", d.id, "source")).bytes, photo);
  assert.equal(
    await readFile(join(root, d.id, "generation-prompt.txt"), "utf8"),
    "test registration prompt",
  );
  const raw = JSON.parse(
    await readFile(join(root, d.id, "draft.json"), "utf8"),
  );
  raw.draft.status = "preparing";
  await writeFile(join(root, d.id, "draft.json"), JSON.stringify(raw));
  const restored = new AtelierStore(root, body);
  await restored.recoverInterrupted();
  assert.equal((await restored.get("aurore", d.id)).status, "failed");
  assert.ok((await restored.get("aurore", d.id)).preparedUrl);
  await assert.rejects(
    restored.start("aurore", d.id, "prepare"),
    /OPENAI_API_KEY/,
  );
});

test("atelier endpoints require login and the creator account; key status never exposes credentials", async () => {
  const db = await openDatabase("memory://"),
    app = await createApp(db, { root: await temp() });
  try {
    const headers = { origin: "http://127.0.0.1:5173" };
    assert.equal(
      (await app.inject({ method: "GET", url: "/api/atelier/drafts" }))
        .statusCode,
      401,
    );
    const login = await app.inject({
        method: "POST",
        url: "/api/login",
        headers,
        payload: { account: "sacha" },
      }),
      cookie = String(login.headers["set-cookie"]).split(";")[0];
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/atelier/drafts",
          headers: { ...headers, cookie },
          payload: { image: data(photo) },
        })
      ).statusCode,
      400,
    );
    const status = await app.inject({
      method: "GET",
      url: "/api/atelier/capabilities",
      headers: { cookie },
    });
    assert.equal(status.json().editor, false);
    assert.equal(status.json().automatic, false);
    assert.equal(status.json().local, true);
    assert.ok(!status.body.includes("Bearer"));
    assert.deepEqual(
      (
        await app.inject({
          method: "GET",
          url: "/api/atelier/catalog",
          headers: { cookie },
        })
      ).json(),
      [],
    );
  } finally {
    await app.close();
    await db.close();
  }
});

test("local-only routes reject external processing even with an injected provider", async () => {
  let calls = 0;
  const db = await openDatabase("memory://");
  const app = await createApp(db, {
    root: await temp(),
    provider: {
      analyze: async () => {
        calls++;
        throw new Error("must never call");
      },
      prepare: async () => {
        calls++;
        throw new Error("must never call");
      },
    },
  });
  try {
    const origin = "http://127.0.0.1:5173";
    const login = await app.inject({
      method: "POST",
      url: "/api/login",
      headers: { origin },
      payload: { account: "aurore" },
    });
    const cookie = String(login.headers["set-cookie"]).split(";")[0];
    const created = await app.inject({
      method: "POST",
      url: "/api/atelier/drafts",
      headers: { origin, cookie },
      payload: { image: data(photo) },
    });
    assert.equal(created.statusCode, 200);
    for (const action of ["analyze", "prepare"]) {
      const response = await app.inject({
        method: "POST",
        url: `/api/atelier/drafts/${created.json().id}/${action}`,
        headers: { origin, cookie },
      });
      assert.equal(response.statusCode, 400);
      assert.match(response.body, /désactivée/);
    }
    assert.equal(calls, 0);
  } finally {
    await app.close();
    await db.close();
  }
});

test("OpenAI image preparation sends the immutable mannequin and pattern as separate references", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "https://api.openai.com/v1/images/edits");
    const form = options?.body as FormData;
    assert.equal(form.get("background"), "transparent");
    assert.equal(form.get("size"), "896x1792");
    assert.equal(form.getAll("image[]").length, 3);
    assert.match(String(form.get("prompt")), /NO body/);
    return new Response(
      JSON.stringify({ data: [{ b64_json: garment().toString("base64") }] }),
      { status: 200 },
    );
  };
  try {
    const result = await openAIProvider("test-only-no-real-key").prepare({
      source: photo,
      mime: "image/png",
      body,
      pattern: "tank",
      name: "Caraco",
      notes: "Conserver les coutures",
    });
    assert.deepEqual(result.png, garment());
  } finally {
    globalThis.fetch = old;
  }
});
