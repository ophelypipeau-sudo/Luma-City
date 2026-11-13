import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Portrait } from "../apps/web/src/Avatar";
import { FittingAvatar } from "../apps/web/src/shop/FittingAvatar";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
import { BARE_OUTFIT } from "../apps/web/src/shop/catalog";
import { HIP_ARM_REGION } from "../apps/web/src/avatar/HandOnHipDoll";
import { readFileSync } from "node:fs";
import { pngPixels } from "../apps/server/src/atelier-images";
import { Resvg } from "@resvg/resvg-js";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { LEOPARD_LAYERS } from "../apps/web/src/avatar/leopard";
import { EMPTY_LAYERS } from "../apps/web/src/avatar/model";
test("only an explicitly posed full-body rail portrait uses the hip pose; fitting stays frontal", () => {
  const posed = renderToStaticMarkup(
    React.createElement(Portrait, {
      id: "iris",
      fullBody: true,
      pose: "hand-on-hip",
    }),
  );
  assert.match(posed, /data-avatar-pose="hand-on-hip"/);
  assert.match(posed, /data-pose-part="hand"/);
  const front = renderToStaticMarkup(
    React.createElement(Portrait, { id: "iris", fullBody: true }),
  );
  const portrait = renderToStaticMarkup(
    React.createElement(Portrait, { id: "iris" }),
  );
  const fitting = renderToStaticMarkup(
    React.createElement(FittingAvatar, {
      characterId: "iris",
      outfit: BARE_OUTFIT,
      layers: DEFAULT_LAYERS,
    }),
  );
  for (const other of [front, portrait, fitting])
    assert.doesNotMatch(other, /data-avatar-pose="hand-on-hip"/);
});
test("the hand rests on the hip at preview coordinates and the pose mask preserves the rest of the mannequin", () => {
  const hand = pngPixels(
    readFileSync("public/assets/avatar/poses/hand-on-hip-lilac-v2/hand.png"),
  ).pixels;
  assert.ok(hand[(710 * 887 + 600) * 4 + 3] > 200, "palm on the hip");
  assert.ok(
    hand[(750 * 887 + 544) * 4 + 3] > 200,
    "fingers point down onto the pocket",
  );
  for (const [x, y] of [
    [770, 970],
    [443, 180],
    [150, 920],
    [443, 1150],
  ])
    assert.equal(hand[(y * 887 + x) * 4 + 3], 0);
  const p = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><path d="${HIP_ARM_REGION}" fill="white"/></svg>`,
  ).render().pixels;
  for (const [x, y] of [
    [443, 180],
    [150, 920],
    [443, 650],
    [443, 1150],
    [333, 1730],
  ])
    assert.equal(p[(y * 887 + x) * 4 + 3], 0);
});

test("every shop top and the underwear base keep the hip pose, belt and original hand; fitting remains frontal", () => {
  for (const top of [
    null,
    ...avatarCatalogSnapshot()
      .filter((p) => p.slot === "top")
      .map((p) => p.id),
  ]) {
    const layers = { ...LEOPARD_LAYERS, top };
    const posed = renderToStaticMarkup(
      React.createElement(Portrait, {
        id: "iris",
        fullBody: true,
        pose: "hand-on-hip",
        layers,
      }),
    );
    assert.match(posed, /data-avatar-pose="hand-on-hip"/);
    assert.match(posed, /redraw-v4\/hip-hand.png/);
    assert.match(posed, /data-piece="fashion.medallion-belt"/);
    if (top === "fashion.burgundy-fold-sweater")
      assert.match(posed, /burgundy-cut-v2\/hand-on-hip.png/);
    const fitting = renderToStaticMarkup(
      React.createElement(FittingAvatar, {
        characterId: "iris",
        outfit: BARE_OUTFIT,
        layers,
      }),
    );
    assert.doesNotMatch(fitting, /data-avatar-pose="hand-on-hip"/);
  }
  assert.match(
    renderToStaticMarkup(
      React.createElement(Portrait, {
        id: "iris",
        fullBody: true,
        pose: "hand-on-hip",
        layers: EMPTY_LAYERS,
      }),
    ),
    /redrawn-v1\/body-hand-on-hip.png/,
  );
});

test("the posed sleeveless avatar actually erases the old arm and keeps its approved palm on the hip", () => {
  // Render the portrait's own viewBox directly, without its outer nested viewport.
  const portrait = renderToStaticMarkup(
    React.createElement(Portrait, {
      id: "iris",
      fullBody: true,
      pose: "hand-on-hip",
      layers: LEOPARD_LAYERS,
    }),
  );
  let svg = portrait.replace(
    "<svg ",
    '<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774" ',
  );
  svg = svg.replace(
    /href="(\/assets\/[^\"]+)"/g,
    (_, path) =>
      `href="data:image/png;base64,${readFileSync("public" + path).toString("base64")}"`,
  );
  const pixels = new Resvg(svg).render().pixels;
  const alpha = (x: number, y: number) => pixels[(y * 887 + x) * 4 + 3];
  assert.ok(alpha(600, 710) > 200, "approved palm on hip");
  assert.ok(alpha(740, 550) > 200, "bent elbow is present");
  assert.ok(alpha(770, 970) < 20, "old dangling hand removed");
  // The redrawn forearm now passes through (620,650); test the open elbow/waist gap.
  assert.ok(
    alpha(620, 600) < 20,
    "space between waist and bent arm has no old-arm strip",
  );
});
