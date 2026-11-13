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
import { FASHION_BASE } from "../apps/web/src/avatar/base";
import { AVATAR_GARMENTS } from "../apps/web/src/avatar/catalog";
import {
  DEFAULT_LAYERS,
  EMPTY_LAYERS,
  equipLayer,
  type AvatarLayers,
} from "../apps/web/src/avatar/model";

test("the supplied mannequin and hand drawing are preserved byte for byte", () => {
  assert.deepEqual(
    readFileSync("public/assets/avatar/fashion-v2/body-user.png"),
    readFileSync("docs/fashion-doll-v2/user-body-source.png"),
  );
  assert.equal(FASHION_BASE.src, "/assets/avatar/fashion-v2/body-user.png");
  assert.deepEqual(
    AVATAR_GARMENTS.map((p) => p.id),
    [
      "fashion.cardigan-lilac",
      "fashion.jeans-indigo",
      "fashion.boots-ivory",
      "fashion.rose-bow-camisole",
      "fashion.rose-dragon-cargo",
      "fashion.white-platform-sneakers",
    ],
  );
  for (const slot of ["top", "bottom", "shoes"] as const) {
    const removed = equipLayer(DEFAULT_LAYERS, slot, null);
    for (const other of ["top", "bottom", "shoes"] as const)
      assert.equal(
        removed[other],
        other === slot ? null : DEFAULT_LAYERS[other],
      );
  }
});

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
        React.createElement(LayeredDoll, {
          layers,
          inspection,
          bodyBase: FASHION_BASE,
        }),
      ),
    ),
  );
  svg = svg.replace(
    /href="(\/assets\/[^\"]+)"/g,
    (_, p) =>
      `href="data:image/png;base64,${readFileSync("public" + p).toString("base64")}"`,
  );
  return new Resvg(svg).render().pixels;
}

test("the fashion outfit masks underwear and feet, preserves user hands and puts jeans over boot shafts", () => {
  const raw = render(EMPTY_LAYERS),
    cut = render(DEFAULT_LAYERS, "body-cutaway"),
    worn = render(DEFAULT_LAYERS);
  const missed: string[] = [];
  let counted = 0;
  for (let y = 340; y < 860; y++)
    for (let x = 260; x < 630; x++) {
      const p = (y * 887 + x) * 4;
      if (
        raw[p + 3] > 230 &&
        raw[p] - raw[p + 1] > 12 &&
        raw[p + 2] - raw[p + 1] > 10 &&
        Math.abs(raw[p] - raw[p + 2]) < 30
      ) {
        counted++;
        if (cut[p + 3] > 20 && missed.length < 12) missed.push(`${x},${y}`);
      }
    }
  assert.ok(counted > 10000);
  const issues = missed.map((p) => "underwear " + p);
  for (const [x, y] of [
    [280, 580],
    [210, 735],
    [607, 580],
    [677, 735],
  ]) {
    const p = (y * 887 + x) * 4;
    assert.ok(raw[p + 3] > 230, `source arm ${x},${y}`);
    assert.ok(cut[p + 3] <= 20, `closed sleeve coverage ${x},${y}`);
  }
  let hands = 0;
  for (let y = 875; y < 1000; y++)
    for (const [left, right] of [
      [80, 215],
      [672, 807],
    ])
      for (let x = left; x < right; x++) {
        const p = (y * 887 + x) * 4;
        if (raw[p + 3] > 230) {
          hands++;
          assert.ok(
            Math.abs(cut[p + 3] - raw[p + 3]) <= 2,
            `user hand ${x},${y}`,
          );
        }
      }
  assert.ok(hands > 1000);
  for (let y = 1690; y < 1760; y++)
    for (let x = 250; x < 630; x++) {
      const p = (y * 887 + x) * 4;
      if (raw[p + 3] > 230) assert.ok(cut[p + 3] <= 20, `bare foot ${x},${y}`);
    }
  const shaft = (1600 * 887 + 340) * 4,
    toe = (1720 * 887 + 340) * 4;
  assert.ok(worn[shaft] < 110, "denim covers the upper boot shaft");
  assert.ok(worn[toe] > 150, "ivory boot toe remains visible below the hem");
  assert.deepEqual(issues, [], "fashion fit pixels");
});
