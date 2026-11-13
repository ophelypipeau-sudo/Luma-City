import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { BodyCoverage } from "../apps/web/src/cartoon/BodyCoverage";
import { MORPHOLOGIES } from "../apps/web/src/cartoon/model";
import {
  createPilotAppearance,
  togglePilotPiece,
  PILOT_PIECES,
  unsupportedPilotPieces,
} from "../apps/web/src/cartoon/pilot";
import {
  changeMorphology,
  saveLook,
  applyLook,
} from "../apps/web/src/cartoon/appearance";
import { catalogFor } from "../apps/web/src/shop/catalog";
import {
  MorphologyDoll,
  type PilotInspection,
} from "../apps/web/src/cartoon/MorphologyDoll";
import {
  MORPH_SCALE,
  MORPH_OFFSET_X,
} from "../apps/web/src/cartoon/morphology-fits";

test("one pilot outfit and saved looks keep exact piece ids through all body changes, including partially undressed states", () => {
  let original = saveLook(
    createPilotAppearance(),
    "complete",
    "Tenue complète",
  );
  original = togglePilotPiece(original, "tops");
  const pieces = original.equipped,
    looks = original.looks;
  for (const { id } of MORPHOLOGIES) {
    const changed = changeMorphology(original, id);
    assert.strictEqual(changed.equipped, pieces);
    assert.strictEqual(changed.looks, looks);
    const restored = applyLook(changed, "complete");
    assert.deepEqual(restored.equipped, {
      ...PILOT_PIECES,
      hair: null,
      accessories: [],
    });
    assert.deepEqual(restored.body, changed.body);
  }
  for (const piece of Object.values(PILOT_PIECES))
    assert.ok(catalogFor("iris").some((item) => item.pieceId === piece));
  const future = {
    ...original,
    equipped: { ...original.equipped, tops: "future-shirt" },
  };
  assert.deepEqual(unsupportedPilotPieces(future), ["future-shirt"]);
  assert.equal(changeMorphology(future, "O").equipped.tops, "future-shirt");
});
for (const { id } of MORPHOLOGIES) {
  test(`${id}: fitted masks erase underwear and original feet without erasing visible hands, face or knees`, () => {
    const appearance = createPilotAppearance(id);
    const image = `data:image/png;base64,${readFileSync(`public/assets/morphology-v6/${id}.png`).toString("base64")}`;
    function pixels(masked: boolean) {
      const svg = React.createElement(
        "svg",
        { xmlns: "http://www.w3.org/2000/svg", width: 887, height: 1774 },
        React.createElement(
          "defs",
          null,
          React.createElement(
            "mask",
            {
              id: "body",
              maskUnits: "userSpaceOnUse",
              x: 0,
              y: 0,
              width: 887,
              height: 1774,
            },
            React.createElement("rect", {
              width: 887,
              height: 1774,
              fill: "white",
            }),
            masked
              ? React.createElement(BodyCoverage, {
                  characterId: "iris",
                  morphology: id,
                  equipment: appearance.equipped,
                })
              : null,
          ),
        ),
        React.createElement("image", {
          href: image,
          width: 887,
          height: 1774,
          mask: "url(#body)",
        }),
      );
      return new Resvg(renderToStaticMarkup(svg)).render().pixels;
    }
    const raw = pixels(false),
      cut = pixels(true),
      missed: string[] = [];
    let underwearCount = 0;
    for (let y = 500; y < 990; y++)
      for (let x = 220; x < 670; x++) {
        const p = (y * 887 + x) * 4;
        if (
          raw[p + 3] > 210 &&
          raw[p + 2] > raw[p] + 8 &&
          raw[p + 2] > raw[p + 1] + 20
        ) {
          underwearCount++;
          if (cut[p + 3] > 15 && missed.length < 12) missed.push(`${x},${y}`);
        }
      }
    assert.ok(underwearCount > 10000);
    assert.deepEqual(missed, [], `underwear leakage on ${id}`);
    for (let y = 1650; y < 1740; y++)
      for (let x = 280; x < 610; x++) {
        const p = (y * 887 + x) * 4;
        if (raw[p + 3] > 210)
          assert.ok(cut[p + 3] <= 15, `original foot at ${x},${y}`);
      }
    for (const [x, y] of [
      [443, 200],
      [366, 1230],
      [517, 1230],
    ]) {
      const p = (y * 887 + x) * 4;
      assert.ok(raw[p + 3] > 210);
      assert.equal(cut[p + 3], raw[p + 3]);
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
            assert.equal(cut[p + 3], raw[p + 3], `visible hand at ${x},${y}`);
          }
        }
    assert.ok(handPixels > 1000);
  });
}
test("foreground forearms stay in front of the skirt on rounded bodies without restoring underwear", () => {
  for (const id of ["O", "8"] as const) {
    const dressed = createPilotAppearance(id);
    const bare = {
      ...dressed,
      equipped: {
        tops: null,
        bottoms: null,
        shoes: null,
        hair: null,
        accessories: [],
      },
    };
    function render(appearance: typeof dressed, inspection: PilotInspection) {
      let svg = renderToStaticMarkup(
        React.createElement(
          "svg",
          { xmlns: "http://www.w3.org/2000/svg", width: 887, height: 1774 },
          React.createElement(
            "g",
            {
              transform: `scale(${1 / MORPH_SCALE}) translate(${-MORPH_OFFSET_X} 0)`,
            },
            React.createElement(MorphologyDoll, { appearance, inspection }),
          ),
        ),
      );
      svg = svg.replaceAll(
        `/assets/morphology-v6/${id}.png`,
        `data:image/png;base64,${readFileSync(`public/assets/morphology-v6/${id}.png`).toString("base64")}`,
      );
      return new Resvg(svg).render().pixels;
    }
    const source = render(bare, "normal"),
      cut = render(dressed, "body-cutaway"),
      normal = render(dressed, "normal");
    for (let y = 500; y < 990; y++)
      for (let x = 220; x < 670; x++) {
        const p = (y * 887 + x) * 4;
        if (
          source[p + 3] > 210 &&
          source[p + 2] > source[p] + 8 &&
          source[p + 2] > source[p + 1] + 20
        )
          assert.ok(cut[p + 3] <= 15, `${id}: restored underwear at ${x},${y}`);
      }
    if (id === "O") {
      const p = (755 * 887 + 280) * 4;
      assert.ok(source[p + 3] > 230);
      assert.ok(
        [0, 1, 2].reduce(
          (sum, ch) => sum + Math.abs(source[p + ch] - normal[p + ch]),
          0,
        ) < 12,
        `foreground arm at 280,755: source=${Array.from(source.slice(p, p + 4))}, dressed=${Array.from(normal.slice(p, p + 4))}`,
      );
    }
  }
});
