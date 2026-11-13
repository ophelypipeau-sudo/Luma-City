import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import {
  LayeredDoll,
  type LayerInspection,
} from "../apps/web/src/avatar/LayeredDoll";
import { IMPORT_TEST_GARMENTS as AVATAR_GARMENTS } from "../apps/web/src/avatar/catalog";
import {
  IMPORT_TEST_LAYERS as DEFAULT_LAYERS,
  EMPTY_LAYERS,
  equipLayer,
  type AvatarLayers,
} from "../apps/web/src/avatar/model";

function render(layers: AvatarLayers, inspection: LayerInspection = "normal") {
  const scale = 1024 / 1774,
    offset = (480 - 887 * scale) / 2;
  let svg = renderToStaticMarkup(
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
  svg = svg.replace(
    /href="(\/assets\/[^\"]+)"/g,
    (_, path) =>
      `href="data:image/png;base64,${readFileSync("public" + path).toString("base64")}"`,
  );
  return new Resvg(svg).render().pixels;
}

test("imported pieces replace the active starter catalogue and tops switch independently of trousers", () => {
  assert.deepEqual(
    AVATAR_GARMENTS.map((p) => p.id),
    [
      "import.polo-cream-blue",
      "import.camisole-white-navy",
      "import.sweatpants-grey",
    ],
  );
  assert.equal(DEFAULT_LAYERS.shoes, null);
  const changed = equipLayer(
    DEFAULT_LAYERS,
    "top",
    "import.camisole-white-navy",
  );
  assert.equal(changed.bottom, DEFAULT_LAYERS.bottom);
  assert.equal(changed.shoes, null);
  assert.deepEqual(
    equipLayer(changed, "top", DEFAULT_LAYERS.top),
    DEFAULT_LAYERS,
  );
});

test("both imported tops and trousers erase underwear while leaving face, hands and bare toes intact", () => {
  const raw = render(EMPTY_LAYERS);
  for (const top of ["import.polo-cream-blue", "import.camisole-white-navy"]) {
    const cut = render({ ...DEFAULT_LAYERS, top }, "body-cutaway");
    const missed: string[] = [];
    for (let y = 500; y < 990; y++)
      for (let x = 220; x < 670; x++) {
        const p = (y * 887 + x) * 4;
        if (
          raw[p + 3] > 210 &&
          raw[p + 2] > raw[p] + 8 &&
          raw[p + 2] > raw[p + 1] + 20 &&
          cut[p + 3] > 20 &&
          missed.length < 12
        )
          missed.push(`${x},${y}`);
      }
    assert.deepEqual(missed, [], `${top}: visible underwear`);
    if (top === "import.polo-cream-blue") {
      const neck = (420 * 887 + 443) * 4;
      assert.deepEqual(
        cut.slice(neck, neck + 4),
        raw.slice(neck, neck + 4),
        "rear collar must not cut a horizontal bar through the exposed neck",
      );
    }
    for (const [x, y] of [
      [443, 200],
      [370, 1710],
      [520, 1710],
    ]) {
      const p = (y * 887 + x) * 4;
      assert.ok(raw[p + 3] > 210, `source skin at ${x},${y}`);
      assert.equal(cut[p + 3], raw[p + 3], `${top}: exposed skin ${x},${y}`);
    }
    let handPixels = 0;
    for (let y = 920; y < 1020; y++)
      for (const [start, end] of [
        [70, 205],
        [680, 810],
      ])
        for (let x = start; x < end; x++) {
          const p = (y * 887 + x) * 4;
          if (raw[p + 3] > 210) {
            handPixels++;
            assert.ok(
              Math.abs(cut[p + 3] - raw[p + 3]) <= 2,
              top + ": hand " + x + "," + y,
            );
          }
        }
    assert.ok(handPixels > 1000);
    for (const [x, y] of [
      [443, 570],
      [400, 850],
      [370, 1300],
      [520, 1300],
    ])
      assert.ok(
        cut[(y * 887 + x) * 4 + 3] <= 20,
        `${top}: covered body ${x},${y}`,
      );
  }
});

test("jogging front waistband follows the narrow waist instead of keeping hip width", () => {
  const cloth = render({ ...DEFAULT_LAYERS, top: null }, "garments");
  const occupied: number[] = [];
  for (let x = 250; x < 640; x++)
    if (cloth[(729 * 887 + x) * 4 + 3] > 210) occupied.push(x);
  assert.ok(occupied.length > 170);
  assert.ok(occupied[0] >= 336, `left waistband at ${occupied[0]}`);
  assert.ok(
    occupied[occupied.length - 1] <= 551,
    `right waistband at ${occupied[occupied.length - 1]}`,
  );
});

test("removing the imported polo restores the torso without removing trouser coverage", () => {
  const cut = render(equipLayer(DEFAULT_LAYERS, "top", null), "body-cutaway");
  assert.ok(cut[(570 * 887 + 443) * 4 + 3] > 230);
  assert.ok(cut[(850 * 887 + 400) * 4 + 3] < 20);
});
