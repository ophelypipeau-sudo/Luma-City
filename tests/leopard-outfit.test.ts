import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { rgbaPng } from "../scripts/lib/png-rgba";
import { LayeredDoll } from "../apps/web/src/avatar/LayeredDoll";
import { FASHION_BASE } from "../apps/web/src/avatar/base";
import {
  LEOPARD_GARMENTS,
  LEOPARD_LAYERS,
} from "../apps/web/src/avatar/leopard";
import { avatarGarment } from "../apps/web/src/avatar/catalog";
import { equipLayer } from "../apps/web/src/avatar/model";
const bodyBytes = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
const original = pngPixels(bodyBytes).pixels;
const roundTrip = pngPixels(rgbaPng(887, 1774, original)).pixels;
test("fur belongs to the trousers and stays independent of footwear", () => {
  const pants = avatarGarment(LEOPARD_LAYERS.bottom!);
  const shoes = avatarGarment(LEOPARD_LAYERS.shoes!);
  assert.equal(shoes.behindBottom, true);
  assert.equal(pants.secondaryColor?.label, "Fourrure");
  assert.equal(pants.art.kind, "image");
  assert.equal(shoes.art.kind, "image");
  if (pants.art.kind !== "image" || shoes.art.kind !== "image") return;
  const lower = pngPixels(readFileSync("public" + pants.art.front)).pixels;
  const feet = pngPixels(readFileSync("public" + shoes.art.front)).pixels;
  for (const [x, y] of [
    [225, 1640],
    [665, 1640],
  ]) {
    const i = (y * 887 + x) * 4;
    assert.ok(lower[i + 3] > 200, "trouser cuff keeps its fur");
    assert.equal(feet[i + 3], 0, "no trouser fur in shoes");
  }
  const noShoes = equipLayer(LEOPARD_LAYERS, "shoes", null);
  assert.equal(noShoes.bottom, pants.id);
});
test("underwear variants preserve anatomy, all alpha, face, hands and original body file", () => {
  assert.equal(
    createHash("sha256").update(bodyBytes).digest("hex"),
    "8e3b61c5a45e5ddc9ee528530ced84eea3bd883a1a2e05914b81fd46e3b269e4",
  );
  for (const variant of ["strapless", "low-rise", "combined"]) {
    const next = pngPixels(
      readFileSync(`public/assets/avatar/leopard-v1/underwear-${variant}.png`),
    ).pixels;
    for (let y = 0; y < 1774; y++)
      for (let x = 0; x < 887; x++) {
        const i = (y * 887 + x) * 4;
        assert.equal(next[i + 3], original[i + 3]);
        const allowed =
          x >= 290 &&
          x < 603 &&
          ((variant !== "low-rise" &&
            y >= 338 &&
            y < 466 &&
            (x < 372 || x > 515)) ||
            (variant !== "strapless" && y > 690 && y < 850));
        // Compare to the identical PNG round-trip so alpha premultiplication
        // cannot hide an actual anatomical change at a translucent pixel.
        if (!allowed)
          for (let c = 0; c < 3; c++)
            assert.equal(
              next[i + c],
              roundTrip[i + c],
              `${variant} changed anatomy ${x},${y}`,
            );
      }
    assert.deepEqual(
      [...next.subarray((500 * 887 + 443) * 4, (500 * 887 + 443) * 4 + 4)],
      [...roundTrip.subarray((500 * 887 + 443) * 4, (500 * 887 + 443) * 4 + 4)],
      "opaque bra remains",
    );
  }
});
