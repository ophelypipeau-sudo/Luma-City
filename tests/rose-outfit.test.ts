import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import {
  LayeredDoll,
  AvatarGarment,
  type LayerInspection,
} from "../apps/web/src/avatar/LayeredDoll";
import { FASHION_BASE } from "../apps/web/src/avatar/base";
import { ROSE_LAYERS } from "../apps/web/src/avatar/rose";
import { AVATAR_GARMENTS, avatarGarment } from "../apps/web/src/avatar/catalog";
import { garmentMaterials } from "../apps/web/src/avatar/materials";
import { pngPixels } from "../apps/server/src/atelier-images";
import {
  colorGarment,
  fittingCart,
  RGB_PALETTE,
} from "../apps/web/src/shop/fashion-options";
import {
  DEFAULT_LAYERS,
  EMPTY_LAYERS,
  equipLayer,
  type AvatarLayers,
} from "../apps/web/src/avatar/model";

function render(layers: AvatarLayers, inspection: LayerInspection = "normal") {
  const scale = 1024 / 1774,
    offset = (480 - 887 * scale) / 2;
  let svg = renderToStaticMarkup(
    React.createElement(
      "svg",
      { xmlns: "http://www.w3.org/2000/svg", width: 887, height: 1774 },
      React.createElement(
        "g",
        { transform: `scale(${1 / scale}) translate(${-offset} 0)` },
        React.createElement(LayeredDoll, {
          layers,
          inspection,
          bodyBase: FASHION_BASE,
        }),
      ),
    ),
  );
  svg = svg.replace(
    /href="(\/assets\/[^\"]+)"/g,
    (_, p) =>
      `href="data:image/png;base64,${readFileSync("public" + p).toString("base64")}"`,
  );
  return new Resvg(svg).render().pixels;
}

test("rose outfit pieces replace individual slots while preserving the other garments", () => {
  let layers = DEFAULT_LAYERS;
  for (const slot of ["top", "bottom", "shoes"] as const) {
    const before = layers;
    layers = equipLayer(layers, slot, ROSE_LAYERS[slot]);
    for (const other of ["top", "bottom", "shoes"] as const)
      assert.equal(
        layers[other],
        other === slot ? ROSE_LAYERS[slot] : before[other],
      );
  }
  assert.deepEqual(layers, { ...ROSE_LAYERS, belt: null });
});

test("palette colors keep garment identity, survive slot changes and are included in the cart", () => {
  // The rose collection was retired: the same rules are checked on pieces on sale.
  const live = { ...DEFAULT_LAYERS, top: "fashion.premium-velvet", bottom: "fashion.pants-rocade", shoes: "fashion.shoes-campus" };
  const pink = RGB_PALETTE[11][1];
  const colored = colorGarment(live, live.top, pink);
  const switched = equipLayer(colored, "top", DEFAULT_LAYERS.top);
  const restored = equipLayer(switched, "top", live.top);
  assert.equal(restored.colors?.[live.top], pink);
  assert.equal(restored.bottom, live.bottom);
  assert.equal(fittingCart(restored).find(({ piece }) => piece.id === live.top)?.color, pink);
  assert.equal(
    fittingCart(restored).reduce((sum, p) => sum + p.price, 0),
    900 + 900 + fittingCart(restored).filter(({ piece }) => piece.id === live.shoes)[0].price,
  );
  assert.equal(
    colorGarment(restored, live.bottom, "#ff80bf").colors?.[live.bottom],
    "#ff80bf",
  );
  assert.throws(() => colorGarment(restored, "pleated-skirt.denim", "#ff80bf"));
  assert.throws(() => colorGarment(restored, live.top, "pink"));
});

test("all six articles recolor without changing silhouettes, transparency or dark printed details", () => {
  for (const piece of AVATAR_GARMENTS.map((p) => avatarGarment(p.id))) {
    const regions = garmentMaterials(piece)!;
    const protectedInk = pngPixels(
      readFileSync("public" + regions.protected),
    ).pixels;
    const secondary = regions.detail
      ? pngPixels(readFileSync("public" + regions.detail)).pixels
      : undefined;
    assert.equal(piece.colorable, true, piece.id);
    const draw = (color?: string) => {
      let svg = renderToStaticMarkup(
        React.createElement(
          "svg",
          { xmlns: "http://www.w3.org/2000/svg", width: 887, height: 1774 },
          React.createElement(AvatarGarment, { piece, color }),
        ),
      );
      svg = svg.replace("<svg", "<svg");
      svg = svg.replace(
        /href="(\/assets\/[^\"]+)"/g,
        (_, p) =>
          `href="data:image/png;base64,${readFileSync("public" + p).toString("base64")}"`,
      );
      return new Resvg(svg).render().pixels;
    };
    const original = draw(),
      tinted = draw("#36a5f2");
    let changed = 0,
      dark = 0;
    const gain = piece.art.kind === "image" ? (piece.art.recolorGain ?? 1) : 1;
    for (let p = 0; p < original.length; p += 4) {
      assert.ok(
        Math.abs(tinted[p + 3] - original[p + 3]) <= 1,
        piece.id + " alpha",
      );
      if (original[p + 3] > 250) {
        if (
          Math.abs(tinted[p] - original[p]) +
            Math.abs(tinted[p + 1] - original[p + 1]) +
            Math.abs(tinted[p + 2] - original[p + 2]) >
          30
        )
          changed++;
        const luma =
          (0.2126 * original[p] +
            0.7152 * original[p + 1] +
            0.0722 * original[p + 2]) /
          255;
        // Inspect solid ink interiors; resized edge pixels mix neighbouring
        // fabric and outlines and legitimately inherit a little fabric dye.
        // Navy fabric is recolorable too: darkness alone is not an ink detector.
        // Primary dye must leave protected seams and the separate print zone intact.
        const inkInterior =
          protectedInk[p + 3] > 250 || (secondary?.[p + 3] ?? 0) > 250;
        if (luma * gain < 0.16 && inkInterior) {
          dark++;
          for (let channel = 0; channel < 3; channel++)
            assert.ok(
              Math.abs(tinted[p + channel] - original[p + channel]) <= 2,
              piece.id +
                " dark ink " +
                p +
                " " +
                [...original.subarray(p, p + 4)] +
                " => " +
                [...tinted.subarray(p, p + 4)],
            );
        }
      }
    }
    assert.ok(changed > 200, piece.id + " fabric changes color");
    if (piece.id === "fashion.rose-dragon-cargo")
      assert.ok(dark > 100, piece.id + " dragon is preserved");
  }
});

