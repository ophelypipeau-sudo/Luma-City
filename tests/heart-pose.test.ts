import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { LayeredDoll } from "../apps/web/src/avatar/LayeredDoll";
import { FASHION_BASE } from "../apps/web/src/avatar/base";
import { HeartHandsDoll } from "../apps/web/src/avatar/HeartHandsDoll";
import { EMPTY_LAYERS } from "../apps/web/src/avatar/model";
import { pngPixels } from "../apps/server/src/atelier-images";
test("heart pose removes the resting hands while preserving the original face, torso and legs", () => {
  const scale = 1024 / 1774,
    offset = (480 - 887 * scale) / 2;
  const drawing = renderToStaticMarkup(
    React.createElement(HeartHandsDoll, { layers: EMPTY_LAYERS }),
  );
  let svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><g transform="scale(' +
    1 / scale +
    ") translate(" +
    -offset +
    ' 0)">' +
    drawing +
    "</g></svg>";
  svg = svg.replace(
    /href="(\/assets\/[^\"]+)"/g,
    (_, path) =>
      'href="data:image/png;base64,' +
      readFileSync("public" + path).toString("base64") +
      '"',
  );
  const p = new Resvg(svg).render().pixels;
  const canonical = renderToStaticMarkup(
    React.createElement(LayeredDoll, {
      layers: EMPTY_LAYERS,
      bodyBase: FASHION_BASE,
    }),
  );
  let canonicalSvg =
    "<svg xmlns=" +
    String.fromCharCode(34) +
    "http://www.w3.org/2000/svg" +
    String.fromCharCode(34) +
    " width=" +
    String.fromCharCode(34) +
    "887" +
    String.fromCharCode(34) +
    " height=" +
    String.fromCharCode(34) +
    "1774" +
    String.fromCharCode(34) +
    "><g transform=" +
    String.fromCharCode(34) +
    "scale(" +
    1 / scale +
    ") translate(" +
    -offset +
    " 0)" +
    String.fromCharCode(34) +
    ">" +
    canonical +
    "</g></svg>";
  canonicalSvg = canonicalSvg.replace(
    /href="(\/assets\/[^\"]+)"/g,
    (_, path) =>
      'href="data:image/png;base64,' +
      readFileSync("public" + path).toString("base64") +
      '"',
  );
  const original = new Resvg(canonicalSvg).render().pixels;
  for (const [x, y] of [
    [443, 150],
    [443, 250],
    [443, 620],
    [350, 1000],
    [535, 1300],
    [350, 1725],
  ]) {
    const i = (y * 887 + x) * 4;
    assert.ok(original[i + 3] > 240);
    for (let c = 0; c < 4; c++)
      assert.ok(
        Math.abs(p[i + c] - original[i + c]) <= 1,
        "canonical art at " + x + "," + y,
      );
  }
  for (const [x, y] of [
    [150, 920],
    [740, 920],
  ])
    assert.equal(p[(y * 887 + x) * 4 + 3], 0, "old resting hand erased");
  assert.ok(p[(590 * 887 + 260) * 4 + 3] > 200, "new bent elbow present");
  const arms = pngPixels(
    readFileSync("public/assets/avatar/poses/heart-hands-v3/arms.png"),
  );
  assert.equal(arms.width, 887);
  assert.equal(arms.height, 1774);
  assert.equal(
    arms.pixels[(440 * 887 + 443) * 4 + 3],
    0,
    "heart opening contains no painted skin",
  );
});


