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

test("rose clothes hide opaque underwear and feet while preserving bare arms and user hands", () => {
  const raw = render(EMPTY_LAYERS),
    cut = render(ROSE_LAYERS, "body-cutaway");
  const misses: string[] = [];
  let underwear = 0,
    hands = 0;
  for (let y = 340; y < 860; y++)
    for (let x = 260; x < 630; x++) {
      const p = (y * 887 + x) * 4;
      if (
        raw[p + 3] > 230 &&
        raw[p] - raw[p + 1] > 12 &&
        raw[p + 2] - raw[p + 1] > 10 &&
        Math.abs(raw[p] - raw[p + 2]) < 30
      ) {
        underwear++;
        if (
          cut[p + 3] > 20 &&
          cut[p] - cut[p + 1] > 12 &&
          cut[p + 2] - cut[p + 1] > 10 &&
          Math.abs(cut[p] - cut[p + 2]) < 30 &&
          misses.length < 12
        )
          misses.push(`${x},${y}`);
      }
    }
  assert.ok(underwear > 10000);
  assert.deepEqual(misses, [], "no purple underwear protrudes");
  for (let y = 875; y < 1000; y++)
    for (const [left, right] of [
      [80, 215],
      [672, 807],
    ])
      for (let x = left; x < right; x++) {
        const p = (y * 887 + x) * 4;
        if (raw[p + 3] > 230) {
          hands++;
          assert.ok(Math.abs(cut[p + 3] - raw[p + 3]) <= 2, `hand ${x},${y}`);
        }
      }
  assert.ok(hands > 1000);
  for (const [x, y] of [
    [280, 580],
    [210, 735],
    [607, 580],
    [677, 735],
  ]) {
    const p = (y * 887 + x) * 4;
    assert.ok(raw[p + 3] > 230);
    assert.ok(Math.abs(cut[p + 3] - raw[p + 3]) <= 2, `bare arm ${x},${y}`);
  }
  for (let y = 1690; y < 1760; y++)
    for (let x = 250; x < 630; x++) {
      const p = (y * 887 + x) * 4;
      if (raw[p + 3] > 230) assert.ok(cut[p + 3] <= 20, `bare foot ${x},${y}`);
    }
});

test("palette colors keep garment identity, survive slot changes and are included in the cart", () => {
  const pink = RGB_PALETTE[11][1];
  const colored = colorGarment(ROSE_LAYERS, ROSE_LAYERS.top!, pink);
  const switched = equipLayer(colored, "top", DEFAULT_LAYERS.top);
  const restored = equipLayer(switched, "top", ROSE_LAYERS.top);
  assert.equal(restored.colors?.[ROSE_LAYERS.top!], pink);
  assert.equal(restored.bottom, ROSE_LAYERS.bottom);
  assert.equal(fittingCart(restored)[0].color, pink);
  assert.equal(
    fittingCart(restored).reduce((sum, p) => sum + p.price, 0),
    1400,
  );
  assert.equal(
    colorGarment(restored, ROSE_LAYERS.bottom!, "#ff80bf").colors?.[
      ROSE_LAYERS.bottom!
    ],
    "#ff80bf",
  );
  assert.throws(() => colorGarment(restored, "pleated-skirt.denim", "#ff80bf"));
  assert.throws(() => colorGarment(restored, ROSE_LAYERS.top!, "pink"));
});

test("sneaker tongues cover the instep without rectangular leg overlays; pink cloth retains black trim", () => {
  const shoes = render({ ...EMPTY_LAYERS, shoes: ROSE_LAYERS.shoes });
  for (const x of [340, 550]) {
    const p = (1625 * 887 + x) * 4;
    assert.ok(
      shoes[p] > 140 && Math.abs(shoes[p] - shoes[p + 1]) < 30,
      "white tongue covers instep at " + x,
    );
  }
  const white = render(ROSE_LAYERS);
  const pink = render(colorGarment(ROSE_LAYERS, ROSE_LAYERS.top!, "#ff80bf"));
  const chest = (510 * 887 + 420) * 4;
  assert.ok(pink[chest] > pink[chest + 1] + 30, "white fabric becomes pink");
  for (const [x, y] of [
    [352, 370],
    [535, 370],
    [443, 130],
    [115, 920],
  ]) {
    const p = (y * 887 + x) * 4;
    assert.deepEqual(
      pink.subarray(p, p + 4),
      white.subarray(p, p + 4),
      "black strap, face and hands unchanged",
    );
  }
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

test("two color zones remain independent through equipment changes and the cart", () => {
  const id = ROSE_LAYERS.top!;
  const main = colorGarment(ROSE_LAYERS, id, "#408000");
  const both = colorGarment(main, id, "#ffffff", "detail");
  assert.equal(both.colors?.[id], "#408000");
  assert.equal(both.detailColors?.[id], "#ffffff");
  const restored = equipLayer(
    equipLayer(both, "top", DEFAULT_LAYERS.top),
    "top",
    id,
  );
  assert.equal(fittingCart(restored)[0].detailColor, "#ffffff");
  assert.throws(() =>
    colorGarment(both, ROSE_LAYERS.shoes!, "#ffffff", "detail"),
  );
});

test("recoloring the second zone changes the straps while leaving the main fabric and body alone", () => {
  const green = colorGarment(ROSE_LAYERS, ROSE_LAYERS.top!, "#408000");
  const before = render(green),
    after = render(colorGarment(green, ROSE_LAYERS.top!, "#ffffff", "detail"));
  const strap = (370 * 887 + 352) * 4;
  assert.ok(
    after[strap] > before[strap] + 100,
    "second color changes the strap",
  );
  for (const [x, y] of [
    [420, 510],
    [443, 130],
    [115, 920],
  ]) {
    const p = (y * 887 + x) * 4;
    assert.deepEqual(
      after.subarray(p, p + 4),
      before.subarray(p, p + 4),
      "primary cloth, face and hands preserved",
    );
  }
});
