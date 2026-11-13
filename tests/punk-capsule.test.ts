import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import {
  PUNK_GARMENTS,
  PUNK_LAYERS,
} from "../apps/web/src/avatar/punk-catalog";
import { PunkGarment } from "../apps/web/src/avatar/PunkGarment";
import { Portrait } from "../apps/web/src/Avatar";
import {
  EMPTY_LAYERS,
  equipLayer,
  validateLayers,
} from "../apps/web/src/avatar/model";
import { poseProfileIssues } from "../apps/web/src/avatar/pose-wardrobe";
import {
  buyOutfit,
  emptyCommerce,
  readCommerce,
} from "../apps/web/src/shop/commerce";
import { nativeRgba } from "../scripts/lib/png-native";
test("nine independent pieces preserve both dyes and simultaneous tie/choker purchases across poses and reload", () => {
  assert.equal(PUNK_GARMENTS.length, 9);
  validateLayers(PUNK_LAYERS);
  for (const p of PUNK_GARMENTS) assert.deepEqual(poseProfileIssues(p), []);
  const look = {
    ...PUNK_LAYERS,
    colors: { [PUNK_LAYERS.top]: "#202c43", [PUNK_LAYERS.hair]: "#302321" },
    detailColors: {
      [PUNK_LAYERS.top]: "#65c5a3",
      [PUNK_LAYERS.hair]: "#ba78e0",
    },
  };
  const bought = buyOutfit(emptyCommerce(), "test", "iris", look, EMPTY_LAYERS);
  const saved = readCommerce(JSON.stringify(bought.next));
  assert.deepEqual(saved.wardrobes.iris.equipped, bought.equipped);
  assert.equal(saved.wardrobes.iris.equipped?.tie, look.tie);
  assert.equal(saved.wardrobes.iris.equipped?.necklace, look.necklace);
  assert.deepEqual(
    saved.wardrobes.iris.equipped?.detailColors,
    look.detailColors,
  );
  assert.equal(bought.charged, 4200);
  const withoutTie = equipLayer(look, "tie", null);
  assert.equal(withoutTie.necklace, PUNK_LAYERS.necklace);
  assert.equal(withoutTie.top, PUNK_LAYERS.top);
  for (const pose of ["front", "hand-on-hip", "heart-hands"] as const) {
    const svg = renderToStaticMarkup(
      React.createElement(Portrait, {
        id: "iris",
        fullBody: true,
        pose,
        layers: look,
      }),
    );
    assert.doesNotMatch(svg, /data-pose-pending/);
    assert.ok(svg.includes('data-piece="' + PUNK_LAYERS.tie + '"'));
    assert.ok(svg.includes("#65c5a3"));
    assert.ok(svg.includes("#ba78e0"));
    assert.ok(
      svg.lastIndexOf('data-layer="legwear"') <
        svg.lastIndexOf('data-layer="bottom"'),
      "resille under skirt",
    );
  }
});
test("primary and detail dyes keep garment silhouettes unchanged and never use inspiration photo pixels", () => {
  for (const cut of [
    "punk-polo",
    "punk-skirt",
    "punk-tie",
    "punk-waves",
  ] as const) {
    const draw = (color: string, detailColor: string) =>
      renderToStaticMarkup(
        React.createElement(PunkGarment, { cut, color, detailColor }),
        { identifierPrefix: "same-" },
      );
    const a = draw("#161b23", "#db559c"),
      b = draw("#d6c6b8", "#64b5a0");
    assert.doesNotMatch(a, /inspiration|data:image/);
    const render = (s: string) =>
      new Resvg(
        `<svg xmlns="http://www.w3.org/2000/svg" width="222" height="444" viewBox="0 0 887 1774">${s}</svg>`,
      ).render().pixels;
    const pa = render(a),
      pb = render(b);
    let changed = 0;
    for (let i = 0; i < pa.length; i += 4) {
      assert.equal(pa[i + 3], pb[i + 3]);
      if (pa[i + 3] > 150 && Math.abs(pa[i] - pb[i]) > 25) changed++;
    }
    assert.ok(changed > 100);
  }
});
test("fishnet silhouette is confined to the canonical legs instead of painting outside skin", () => {
  let svg = renderToStaticMarkup(
    React.createElement(PunkGarment, { cut: "punk-fishnets" }),
  );
  svg = svg.replace(
    /href="\/assets\/avatar\/fashion-v2\/body-user.png"/g,
    `href="data:image/png;base64,${readFileSync("public/assets/avatar/fashion-v2/body-user.png").toString("base64")}"`,
  );
  const net = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774">${svg}</svg>`,
  ).render().pixels;
  const body = nativeRgba(
    readFileSync("public/assets/avatar/fashion-v2/body-user.png"),
  ).pixels;
  let seen = 0;
  for (let y = 1000; y < 1650; y++)
    for (let x = 220; x < 660; x++) {
      const i = (y * 887 + x) * 4;
      if (body[i + 3] === 0) assert.equal(net[i + 3], 0);
      if (net[i + 3] > 20) seen++;
    }
  assert.ok(seen > 10000);
});
