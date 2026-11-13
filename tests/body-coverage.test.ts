import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { BodyCoverage } from "../apps/web/src/cartoon/BodyCoverage";
import {
  BARE_OUTFIT,
  ORIGINAL_OUTFIT,
  type Outfit,
} from "../apps/web/src/shop/catalog";

// Render the body WITHOUT any visible garment: transparency must come from the
// body mask itself, never from an opaque garment simply covering a skin pixel.
function bodyAlpha(characterId: string, outfit: Outfit) {
  const cuts = renderToStaticMarkup(
    React.createElement(BodyCoverage, { characterId, outfit }),
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="1024"><defs><mask id="body" maskUnits="userSpaceOnUse" x="0" y="0" width="480" height="1024"><rect width="480" height="1024" fill="white"/>${cuts}</mask></defs><rect width="480" height="1024" fill="#cf9574" mask="url(#body)"/></svg>`;
  const { pixels } = new Resvg(svg).render();
  return (x: number, y: number) => pixels[(y * 480 + x) * 4 + 3];
}
for (const character of ["iris", "june", "milo", "noa"]) {
  test(`${character}: clothes actually erase torso, covered legs and original feet, preserving exposed skin`, () => {
    const female = character === "iris" || character === "june";
    const alpha = bodyAlpha(character, ORIGINAL_OUTFIT);
    for (const [x, y] of [
      [243, 350],
      [200, 520],
      [285, 520],
      [190, 990],
      [295, 990],
    ])
      assert.equal(alpha(x, y), 0, `covered body at ${x},${y}`);
    for (const [x, y] of [
      [243, 230],
      [90, 595],
      [390, 595],
      ...(female
        ? [
            [200, 700],
            [285, 700],
          ]
        : []),
    ])
      assert.equal(alpha(x, y), 255, `visible skin at ${x},${y}`);
    const removed = bodyAlpha(character, BARE_OUTFIT);
    for (const [x, y] of [
      [243, 350],
      [200, 520],
      [190, 990],
    ])
      assert.equal(removed(x, y), 255);
  });
}
test("Each slot cuts only its covered body region", () => {
  const top = bodyAlpha("iris", { ...BARE_OUTFIT, tops: 0 });
  assert.equal(top(243, 350), 0);
  assert.equal(top(200, 520), 255);
  assert.equal(top(190, 990), 255);
  const skirt = bodyAlpha("iris", { ...BARE_OUTFIT, bottoms: 0 });
  assert.equal(skirt(200, 520), 0);
  assert.equal(skirt(243, 350), 255);
  assert.equal(skirt(200, 700), 255);
  const shoes = bodyAlpha("iris", { ...BARE_OUTFIT, shoes: 0 });
  assert.equal(shoes(190, 990), 0);
  assert.equal(shoes(200, 700), 255);
  assert.equal(shoes(243, 350), 255);
});
