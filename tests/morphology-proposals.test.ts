import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { MorphologyBody } from "../apps/web/src/cartoon/MorphologyBody";
import {
  MORPHOLOGY_PROPOSALS,
  morphologyGeometry,
} from "../apps/web/src/cartoon/morphology-proposals";
import { MORPHOLOGIES } from "../apps/web/src/cartoon/model";

const source = `data:image/png;base64,${readFileSync("public/assets/cartoon-base-v6.png").toString("base64")}`;
const drawings = MORPHOLOGY_PROPOSALS.map((profile) => {
  const svg = renderToStaticMarkup(
    React.createElement(
      "svg",
      { xmlns: "http://www.w3.org/2000/svg", width: 480, height: 1024 },
      React.createElement(MorphologyBody, { profile }),
    ),
  ).replaceAll("/assets/cartoon-base-v6.png", source);
  const image = new Resvg(svg).render();
  return { profile, pixels: image.pixels };
});
function region(
  pixels: Uint8Array,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const output = Buffer.alloc(width * height * 4);
  for (let row = 0; row < height; row++)
    output.set(
      pixels.subarray(
        ((y + row) * 480 + x) * 4,
        ((y + row) * 480 + x + width) * 4,
      ),
      row * width * 4,
    );
  return output;
}
test("the six proposed bodies reuse exactly the same rendered face, hands and feet", () => {
  for (const area of [
    [0, 0, 480, 228],
    [25, 540, 88, 112],
    [370, 540, 85, 112],
    [140, 960, 210, 64],
  ]) {
    const [x, y, w, h] = area;
    const reference = region(drawings[0].pixels, x, y, w, h);
    for (const drawing of drawings.slice(1))
      assert.ok(
        region(drawing.pixels, x, y, w, h).equals(reference),
        `${drawing.profile.id}: identity region ${x},${y}`,
      );
  }
});
for (const { profile, pixels } of drawings) {
  test(`${profile.id}: opaque underwear and visible skin are actual rendered pixels`, () => {
    for (const [x, y] of [
      [243, 350],
      [243, 500],
    ]) {
      const offset = (y * 480 + x) * 4;
      assert.equal(pixels[offset + 3], 255);
      assert.ok(
        pixels[offset + 2] > pixels[offset],
        "underwear is opaque lavender",
      );
    }
    for (const [x, y] of [
      [223, 410],
      [200, 700],
      [286, 700],
    ]) {
      const offset = (y * 480 + x) * 4;
      assert.equal(pixels[offset + 3], 255);
      assert.ok(
        pixels[offset] > pixels[offset + 2],
        "exposed skin remains visible",
      );
    }
  });
}
test("every morphology has its own contours and body anchors, without moving the extremities", () => {
  assert.deepEqual(
    MORPHOLOGY_PROPOSALS.map((p) => p.id),
    MORPHOLOGIES.map((p) => p.id),
  );
  const shapes = MORPHOLOGY_PROPOSALS.map(morphologyGeometry);
  assert.equal(new Set(shapes.map((g) => g.torso)).size, 6);
  assert.equal(new Set(shapes.map((g) => g.leftLeg)).size, 6);
  assert.equal(
    new Set(shapes.map((g) => JSON.stringify(g.anchors.waist))).size,
    6,
  );
  for (const g of shapes)
    for (const key of ["neck", "wrists", "knees", "ankles", "floor"] as const)
      assert.deepEqual(g.anchors[key], shapes[0].anchors[key]);
  const x = MORPHOLOGY_PROPOSALS.find((p) => p.id === "X")!,
    eight = MORPHOLOGY_PROPOSALS.find((p) => p.id === "8")!;
  assert.ok(
    eight.highHipY < x.highHipY &&
      eight.highHip > x.highHip &&
      eight.bust > x.bust,
    "8 has higher, rounder hips and fuller bust than X",
  );
});
