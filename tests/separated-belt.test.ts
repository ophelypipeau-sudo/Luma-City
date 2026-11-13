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
