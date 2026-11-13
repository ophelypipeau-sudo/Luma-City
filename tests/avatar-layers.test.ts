import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import {
  LayeredDoll,
  AvatarItemThumbnail,
  type LayerInspection,
} from "../apps/web/src/avatar/LayeredDoll";
import { AVATAR_BASE } from "../apps/web/src/avatar/base";
import { AVATAR_GARMENTS } from "../apps/web/src/avatar/catalog";
import {
  AVATAR_SLOTS,
  LEGACY_LAYERS as DEFAULT_LAYERS,
  EMPTY_LAYERS,
  equipLayer,
  validateLayers,
  type AvatarLayers,
} from "../apps/web/src/avatar/model";

test("single-base slots are independent, validate ids and reject mismatched pieces", () => {
  for (const slot of AVATAR_SLOTS) {
    const changed = equipLayer(DEFAULT_LAYERS, slot, null);
    assert.equal(changed[slot], null);
    for (const other of AVATAR_SLOTS.filter((s) => s !== slot))
      assert.equal(changed[other], DEFAULT_LAYERS[other]);
    const restored = equipLayer(changed, slot, DEFAULT_LAYERS[slot]);
    for (const key of AVATAR_SLOTS)
      assert.equal(restored[key] ?? null, DEFAULT_LAYERS[key] ?? null);
  }
  assert.throws(
    () => equipLayer(DEFAULT_LAYERS, "top", "lace-boots.ivory"),
    /cannot be equipped/,
  );
  assert.throws(
    () => equipLayer(DEFAULT_LAYERS, "top", "missing"),
    /Unknown avatar garment/,
  );
  assert.throws(
    () => validateLayers({ ...DEFAULT_LAYERS, shoes: "camisole.ivory" }),
    /cannot be equipped/,
  );
});

const source = `data:image/png;base64,${readFileSync("public/assets/avatar/body/base.png").toString("base64")}`;
function pixels(layers: AvatarLayers, inspection: LayerInspection) {
  const scale = 1024 / 1774,
    offset = (480 - 887 * scale) / 2;
  const markup = renderToStaticMarkup(
    React.createElement(
      "svg",
      { xmlns: "http://www.w3.org/2000/svg", width: 887, height: 1774 },
      React.createElement(
        "g",
        { transform: `scale(${1 / scale}) translate(${-offset} 0)` },
        React.createElement(LayeredDoll, { layers, inspection }),
      ),
    ),
  );
  return new Resvg(markup.replaceAll(AVATAR_BASE.src, source)).render().pixels;
}
test("all eight equipment combinations actually cut only their covered body regions", () => {
  const raw = pixels(EMPTY_LAYERS, "normal");
  const alpha = (p: Uint8Array, x: number, y: number) =>
    p[(y * 887 + x) * 4 + 3];
  for (let bits = 0; bits < 8; bits++) {
    const layers: AvatarLayers = {
      top: bits & 1 ? DEFAULT_LAYERS.top : null,
      bottom: bits & 2 ? DEFAULT_LAYERS.bottom : null,
      shoes: bits & 4 ? DEFAULT_LAYERS.shoes : null,
    };
    const cut = pixels(layers, "body-cutaway");
    for (const [slot, x, y] of [
      ["top", 443, 570],
      ["bottom", 400, 850],
      ["shoes", 370, 1700],
    ] as const) {
      assert.ok(alpha(raw, x, y) > 230);
      assert.equal(
        alpha(cut, x, y),
        layers[slot] ? 0 : alpha(raw, x, y),
        `${bits}: ${slot}`,
      );
    }
    for (const [x, y] of [
      [443, 200],
      [366, 1230],
      [517, 1230],
      [160, 970],
      [730, 970],
    ])
      assert.equal(
        alpha(cut, x, y),
        alpha(raw, x, y),
        `${bits}: exposed skin ${x},${y}`,
      );
  }
  const cut = pixels(DEFAULT_LAYERS, "body-cutaway");
  let underwear = 0;
  for (let y = 500; y < 990; y++)
    for (let x = 220; x < 670; x++) {
      const p = (y * 887 + x) * 4;
      if (
        raw[p + 3] > 210 &&
        raw[p + 2] > raw[p] + 8 &&
        raw[p + 2] > raw[p + 1] + 20
      ) {
        underwear++;
        assert.ok(cut[p + 3] <= 15, `underwear leakage ${x},${y}`);
      }
    }
  assert.ok(underwear > 10000);
  for (let y = 1650; y < 1740; y++)
    for (let x = 280; x < 610; x++)
      if (alpha(raw, x, y) > 210)
        assert.ok(alpha(cut, x, y) <= 15, `original foot ${x},${y}`);
});

test("thumbnail drawings contain only garments, and the approved body is unchanged", () => {
  for (const piece of AVATAR_GARMENTS) {
    const svg = renderToStaticMarkup(
      React.createElement(AvatarItemThumbnail, { piece }),
    );
    assert.ok(!svg.includes(AVATAR_BASE.src));
    assert.ok(!svg.includes('data-layer="body"'));
  }
  assert.deepEqual(
    readFileSync("public/assets/avatar/body/base.png"),
    readFileSync("public/assets/morphology-v6/X.png"),
  );
});
