import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, stat } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { COMPANION_CATALOG, companionPreviewImage } from "../packages/domain/src/companions.ts";
import { CompanionArt, CompanionShop } from "../apps/web/src/CompanionShop.tsx";

test("Every companion has two small transparent previews with the original aspect ratio", async () => {
  let previews = 0, originals = 0;
  for (const model of COMPANION_CATALOG) {
    originals += (await stat(`public/assets/companions/${model.id}.png`)).size;
    for (const width of [320, 640] as const) {
      const path = `public${companionPreviewImage(model.id, width)}`;
      const metadata = await sharp(path).metadata();
      assert.equal(metadata.format, "webp", model.id);
      assert.equal(metadata.hasAlpha, true, model.id);
      assert.equal(metadata.width, width, model.id);
      assert.ok(Math.abs(metadata.height! - width * model.canvas[1] / model.canvas[0]) <= 1, model.id);
      if (width === 320) previews += (await stat(path)).size;
    }
  }
  assert.ok(previews < originals * .1, "The thumbnails must remove at least 90% of transferred bytes");
  const report = JSON.parse(await readFile("public/assets/companions-web/v1/report.json", "utf8"));
  assert.equal(report.models, COMPANION_CATALOG.length);
});

test("The shop requests responsive WebP previews and prioritises only its first visible cards", () => {
  const art = renderToStaticMarkup(createElement(CompanionArt, { model: COMPANION_CATALOG[0] }));
  assert.match(art, /srcSet="[^\"]+320w, [^\"]+640w"/);
  assert.doesNotMatch(art, /\.png/);
  const html = renderToStaticMarkup(createElement(CompanionShop, {
    collection: { items: [], equipped: null }, balance: 0,
    onBack() {}, onCollection() {}, buy: async () => { throw Error("unused"); }, equip: async () => {},
  }));
  assert.equal((html.match(/<img[^>]*fetchPriority="high"/g) ?? []).length, 2);
  assert.ok((html.match(/loading="lazy"/g) ?? []).length > 400);
});
