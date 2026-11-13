import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LayeredDoll } from "../apps/web/src/avatar/LayeredDoll";
import { LEOPARD_LAYERS } from "../apps/web/src/avatar/leopard";
import {
  DEFAULT_LAYERS,
  equipLayer,
  validateLayers,
} from "../apps/web/src/avatar/model";
import { fittingCart } from "../apps/web/src/shop/fashion-options";
import {
  avatarCatalogSnapshot,
  avatarGarment,
} from "../apps/web/src/avatar/catalog";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "../scripts/lib/png-rgba";
test("belt has an independent accessory slot, cart entry and foreground pass", () => {
  const noBelt = equipLayer(LEOPARD_LAYERS, "belt", null);
  assert.equal(noBelt.bottom, LEOPARD_LAYERS.bottom);
  assert.equal(fittingCart(noBelt).length, 3);
  assert.equal(fittingCart(LEOPARD_LAYERS).length, 4);
  const otherPants = equipLayer(
    LEOPARD_LAYERS,
    "bottom",
    DEFAULT_LAYERS.bottom,
  );
  assert.equal(otherPants.belt, LEOPARD_LAYERS.belt);
  const svg = renderToStaticMarkup(
    React.createElement(LayeredDoll, { layers: LEOPARD_LAYERS }),
  );
  assert.ok(svg.indexOf('data-layer="belt"') > svg.indexOf('data-layer="top"'));
  const old = { ...DEFAULT_LAYERS };
  delete old.belt;
  assert.doesNotThrow(() => validateLayers(old));
  assert.throws(
    () => equipLayer(LEOPARD_LAYERS, "bottom", LEOPARD_LAYERS.belt),
    /cannot be equipped/,
  );
});
test("belt extraction preserves all original lower trouser pixels and leaves no belt on pants", () => {
  const source = pngPixels(
    readFileSync("public/assets/avatar/leopard-v2/pants.png"),
  ).pixels;
  const old = pngPixels(rgbaPng(887, 1774, source)).pixels;
  const pants = pngPixels(
    readFileSync("public/assets/avatar/leopard-v4/pants.png"),
  ).pixels;
  const belt = pngPixels(
    readFileSync("public/assets/avatar/leopard-v4/belt.png"),
  ).pixels;
  assert.deepEqual(
    pants.subarray(920 * 887 * 4),
    old.subarray(920 * 887 * 4),
    "leg seams, pockets and fur remain identical",
  );
  let beltCount = 0;
  for (let y = 0; y < 1774; y++)
    for (let x = 0; x < 887; x++)
      if (belt[(y * 887 + x) * 4 + 3] > 80) {
        beltCount++;
        assert.ok(y >= 703 && y <= 910);
        assert.ok(x >= 283 && x <= 598);
      }
  assert.ok(beltCount > 10000);
});
test("every shop bottom keeps the same belt and colour with a calibrated waistband attachment", () => {
  const belt = LEOPARD_LAYERS.belt!;
  const layers = { ...LEOPARD_LAYERS, colors: { [belt]: "#804000" } };
  for (const bottom of avatarCatalogSnapshot().filter(
    (p) => p.slot === "bottom",
  )) {
    assert.ok(bottom.beltFit, bottom.id + " missing belt attachment");
    const next = equipLayer(layers, "bottom", bottom.id);
    assert.equal(next.belt, belt);
    assert.equal(next.colors?.[belt], "#804000");
    const svg = renderToStaticMarkup(
      React.createElement(LayeredDoll, { layers: next }),
    );
    assert.ok(svg.includes(`scale(${bottom.beltFit.scaleX} 1)`));
  }
  const pants = avatarGarment(LEOPARD_LAYERS.bottom!);
  assert.equal(pants.art.kind, "image");
  if (pants.art.kind !== "image") return;
  assert.equal(
    pants.art.widthStops,
    undefined,
    "native drawing needs no width deformation",
  );
  const cloth = pngPixels(readFileSync("public" + pants.art.front)).pixels;
  const body = pngPixels(
    readFileSync("public/assets/avatar/fashion-v2/body-user.png"),
  ).pixels;
  for (const y of [680, 700, 720, 740, 760, 800]) {
    const opaque = (p: Uint8Array, x: number) => p[(y * 887 + x) * 4 + 3] > 150;
    let left = 443,
      right = 443;
    while (opaque(body, left - 1)) left--;
    while (opaque(body, right + 1)) right++;
    let clothLeft = 887,
      clothRight = 0;
    for (let x = 200; x < 690; x++)
      if (opaque(cloth, x)) {
        clothLeft = Math.min(clothLeft, x);
        clothRight = Math.max(clothRight, x);
      }
    assert.ok(clothLeft >= left - 10, `left waistband protrudes at ${y}`);
    assert.ok(clothRight <= right + 10, `right waistband protrudes at ${y}`);
  }
  assert.equal(
    pants.art.bands,
    undefined,
    "legs and fur keep their native drawing",
  );
});
