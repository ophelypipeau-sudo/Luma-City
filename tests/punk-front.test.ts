import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { CharacterPose } from "../apps/web/src/avatar/CharacterPose";
import { PunkGarment } from "../apps/web/src/avatar/PunkGarment";
import {
  PUNK_COLORS,
  PUNK_LAYERS,
  PUNK_SWATCHES,
} from "../packages/domain/src/punk-pattern";
import { pngPixels } from "../apps/server/src/atelier-images";
test("Iris shows the pose chooser and restores a saved compatible pose", () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => JSON.stringify({ iris: "heart-hands" }),
      setItem: () => {
        throw Error("saved pose preferences must be retained");
      },
    },
  });
  try {
    const svg = renderToStaticMarkup(
      React.createElement(CharacterPose, {
        owner: "iris",
        character: { id: "iris" },
        layers: PUNK_LAYERS,
      }),
    );
    assert.match(svg, /aria-label="Choisir une pose"/);
    assert.match(svg, /data-avatar-pose="heart-hands"/);
    assert.match(svg, /data-body="fashion-user-hands-v2"/);
  } finally {
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

test("the five capsule dyes retain alpha and reproduce the exported cloth and finish masks", () => {
  const root = "public/assets/avatar/punk-materials-v1";
  const read = (key: string) =>
    pngPixels(readFileSync(`${root}/${key}.png`)).pixels;
  for (const cut of ["punk-polo", "punk-skirt", "punk-boots"] as const) {
    const key = `${cut}-front`;
    const reference = read(`${key}-reference`);
    const finish = read(`${key}-finish`);
    const main = read(`${key}-main`);
    const detail = cut === "punk-boots" ? undefined : read(`${key}-detail`);
    const rgb = (hex: string) =>
      [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    for (const { hex } of PUNK_SWATCHES) {
      const rgbMain = rgb(hex);
      const rgbDetail = rgb(PUNK_COLORS[cut].detail);
      const svg = renderToStaticMarkup(
        React.createElement(
          "svg",
          { xmlns: "http://www.w3.org/2000/svg", width: 887, height: 1774 },
          React.createElement(PunkGarment, { cut, color: hex, pass: "front" }),
        ),
      );
      const variant = new Resvg(svg).render().pixels;
      let painted = 0;
      let materiallyDifferent = 0;
      let maxError = 0;
      let errorsAboveFour = 0;
      let opaquePixels = 0;
      let alphaChanged = false;
      let protectedChanged = false;
      for (let i = 0; i < variant.length; i += 4) {
        if (variant[i + 3] !== reference[i + 3]) alphaChanged = true;
        if (!reference[i + 3]) continue;
        opaquePixels++;
        const weight = main[i + 3];
        const accent = detail?.[i + 3] ?? 0;
        for (let c = 0; c < 3; c++) {
          const expected =
            finish[i + c] + (weight * rgbMain[c] + accent * rgbDetail[c]) / 255;
          const error = Math.abs(expected - variant[i + c]);
          maxError = Math.max(maxError, error);
          if (error > 4) errorsAboveFour++;
          if (
            !weight &&
            !accent &&
            Math.abs(variant[i + c] - reference[i + c]) > 1
          )
            protectedChanged = true;
          if (weight > 16 && Math.abs(variant[i + c] - reference[i + c]) > 8)
            materiallyDifferent++;
        }
        if (weight > 16) painted++;
      }
      assert.ok(
        painted > 1000 && materiallyDifferent > 1000,
        `${cut} ${hex} changes cloth`,
      );
      assert.equal(alphaChanged, false, `${cut} silhouette`);
      assert.equal(protectedChanged, false, `${cut} protected details`);
      assert.ok(
        maxError <= 10 && errorsAboveFour < opaquePixels * 3 * 0.01,
        `${cut} ${hex} reconstructed material error ${maxError}, ${errorsAboveFour} outliers`,
      );
    }
  }
});
