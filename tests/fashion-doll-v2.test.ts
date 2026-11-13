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

