import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Portrait } from "../apps/web/src/Avatar";
import { EMPTY_LAYERS } from "../apps/web/src/avatar/model";
import { nativeRgba } from "../scripts/lib/png-native";
import { avatarGarment } from "../apps/web/src/avatar/catalog";

const root = "public/assets/avatar/burgundy-cut-v2";
const pixel = (p: Uint8Array, x: number, y: number) =>
  p.subarray((y * 887 + x) * 4, (y * 887 + x) * 4 + 4);
test("burgundy contour extraction preserves every retained frontal RGB pixel, including dark stitches", () => {
  const source = nativeRgba(
    readFileSync("public/assets/avatar/redrawn-v1/sources/burgundy-front.png"),
  ).pixels;
  const cut = nativeRgba(readFileSync(`${root}/front.png`)).pixels;
  let count = 0,
    dark = 0;
  for (let i = 0; i < cut.length; i += 4)
    if (cut[i + 3]) {
      assert.deepEqual(cut.subarray(i, i + 3), source.subarray(i, i + 3));
      count++;
      if (Math.max(...source.subarray(i, i + 3)) < 50) dark++;
    }
  assert.ok(count > 90000);
  assert.ok(dark > 1000, "dark outlines and knit detail survive extraction");
  for (const [x, y] of [
    [443, 500],
    [443, 610],
    [443, 730],
    [270, 550],
    [630, 550],
  ])
    assert.ok(pixel(cut, x, y)[3] >= 245, "continuous cloth");
  for (const [x, y] of [
    [443, 180],
    [443, 370],
    [130, 920],
    [755, 920],
    [443, 850],
  ])
    assert.equal(pixel(cut, x, y)[3], 0, "garment excludes skin and underwear");
});
test("three burgundy poses share the same torso pixels and retain opaque sleeves, stable item and dye IDs", () => {
  const front = nativeRgba(readFileSync(`${root}/front.png`)).pixels;
  for (const pose of ["hand-on-hip", "heart-hands"]) {
    const p = nativeRgba(readFileSync(`${root}/${pose}.png`)).pixels;
    for (const [x, y] of [
      [443, 500],
      [443, 610],
      [443, 730],
      [370, 580],
      [510, 580],
    ])
      assert.deepEqual(pixel(p, x, y), pixel(front, x, y));
    for (const [x, y] of pose === "hand-on-hip"
      ? [
          [690, 530],
          [710, 590],
          [615, 670],
        ]
      : [
          [240, 570],
          [290, 530],
          [640, 570],
        ])
      assert.ok(pixel(p, x, y)[3] >= 245, "opaque sleeve interior");
  }
  const g = avatarGarment("fashion.burgundy-fold-sweater");
  assert.equal(g.art.kind, "image");
  if (g.art.kind !== "image") return;
  assert.equal(g.art.front, "/assets/avatar/burgundy-cut-v2/front.png");
  assert.equal(g.art.colorMasks?.mainBase, "#6d2534");
  assert.equal(g.art.scaleX, undefined);
  assert.equal(g.art.bands, undefined);
});

test("posed cuffs cover the wrist join after the hands; obsolete heart forearm wedges are absent", () => {
  const original = nativeRgba(
    readFileSync("public/assets/avatar/poses/redraw-v4/heart-hands.png"),
  ).pixels;
  const clean = nativeRgba(
    readFileSync(`${root}/heart-hands-clean.png`),
  ).pixels;
  for (const [x, y] of [
    [354, 380],
    [534, 380],
  ])
    assert.equal(
      pixel(clean, x, y)[3],
      0,
      "obsolete triangular forearm removed",
    );
  for (const [x, y] of [
    [380, 390],
    [510, 390],
    [350, 450],
    [535, 450],
  ])
    assert.deepEqual(
      pixel(clean, x, y),
      pixel(original, x, y),
      "palm and fingers stay unchanged",
    );
  for (const pose of ["hand-on-hip", "heart-hands"] as const) {
    const svg = renderToStaticMarkup(
      React.createElement(Portrait, {
        id: "iris",
        fullBody: true,
        pose,
        layers: { ...EMPTY_LAYERS, top: "fashion.burgundy-fold-sweater" },
      }),
    );
    const hands = svg.indexOf(
      `data-pose-part="${pose === "hand-on-hip" ? "hand" : "heart-hands-front"}"`,
    );
    assert.ok(
      hands > 0 && svg.indexOf('data-pose-part="cuffs-over-wrists"') > hands,
      "knitted cuff rim overlaps the wrist rather than a floating palm on top",
    );
  }
  const front = nativeRgba(readFileSync(`${root}/front.png`)).pixels;
  const hip = nativeRgba(readFileSync(`${root}/hand-on-hip.png`)).pixels;
  for (const [x, y] of [
    [600, 440],
    [610, 460],
  ])
    for (let c = 0; c < 3; c++)
      assert.ok(
        Math.abs(pixel(front, x, y)[c] - pixel(hip, x, y)[c]) <= 2,
        "collar texture stays in front of the posed sleeve cap",
      );
});
