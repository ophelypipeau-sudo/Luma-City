import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { paintColorRegions } from "../packages/domain/src/atelier-color";
import { WINTER_GARMENTS, WINTER_LOOKS } from "../apps/web/src/avatar/winter";
import { avatarGarment } from "../apps/web/src/avatar/catalog";
import { poseProfileIssues } from "../apps/web/src/avatar/pose-wardrobe";
import {
  EMPTY_LAYERS,
  equipLayer,
  validateLayers,
} from "../apps/web/src/avatar/model";
import {
  snapshotOutfit,
  readWornOutfits,
} from "../apps/web/src/avatar/worn-outfits";
import {
  fittingCart,
  colorGarment,
} from "../apps/web/src/shop/fashion-options";
import {
  emptyCommerce,
  buyOutfit,
  readCommerce,
} from "../apps/web/src/shop/commerce";
import { Portrait } from "../apps/web/src/Avatar";
import { pngPixels } from "../apps/server/src/atelier-images";

test("four outfits provide thirty independently equipable pieces and keep the canonical body immutable", () => {
  assert.equal(WINTER_GARMENTS.length, 30);
  assert.equal(new Set(WINTER_GARMENTS.map((p) => p.id)).size, 30);
  for (const piece of WINTER_GARMENTS) {
    assert.deepEqual(poseProfileIssues(piece), [], piece.id);
    assert.equal(avatarGarment(piece.id).slot, piece.slot);
  }
  const hash = createHash("sha256")
    .update(readFileSync("public/assets/avatar/fashion-v2/body-user.png"))
    .digest("hex")
    .toUpperCase();
  assert.equal(
    hash,
    "8E3B61C5A45E5DDC9EE528530CED84EEA3BD883A1A2E05914B81FD46E3B269E4",
  );
  for (const look of WINTER_LOOKS) {
    validateLayers(look.layers);
    assert.equal(
      new Set(fittingCart(look.layers).map((e) => e.piece.slot)).size,
      fittingCart(look.layers).length,
    );
  }
});

test("hair, headwear, jewelry, bag, hosiery and outerwear survive colours, purchases and local reload independently", () => {
  for (const { layers } of WINTER_LOOKS) {
    let draft = snapshotOutfit(layers);
    for (const entry of fittingCart(draft)) {
      draft = colorGarment(draft, entry.piece.id, "#4e95c2");
      if (entry.piece.secondaryColor)
        draft = colorGarment(draft, entry.piece.id, "#ef88b0", "detail");
    }
    const owner = "winter-check",
      result = buyOutfit(emptyCommerce(), "local", owner, draft, EMPTY_LAYERS);
    const reloaded = readCommerce(JSON.stringify(result.next)).wardrobes[owner]
      .equipped!;
    assert.deepEqual(reloaded, draft);
    assert.deepEqual(
      readWornOutfits(JSON.stringify({ [owner]: draft }))[owner],
      draft,
    );
    assert.equal(result.added, fittingCart(draft).length);
    assert.equal(result.next.accounts.local.balance, 10000 - result.charged);
  }
  const snow = WINTER_LOOKS[1].layers,
    withoutHat = equipLayer(snow, "headwear", null);
  assert.equal(withoutHat.hair, snow.hair);
  assert.equal(withoutHat.necklace, snow.necklace);
  assert.equal(withoutHat.earrings, snow.earrings);
  assert.equal(withoutHat.bag, snow.bag);
  const dress = equipLayer(snow, "top", "fashion.winter-ivory-dress");
  assert.equal(dress.bottom, null);
  assert.equal(dress.hair, snow.hair);
  const ribbon = WINTER_LOOKS[3].layers,
    withoutCardigan = equipLayer(ribbon, "outerwear", null);
  assert.equal(withoutCardigan.top, ribbon.top);
});

test("every wig has complementary visible passes and no empty or shared-buffer alpha split", () => {
  for (const piece of WINTER_GARMENTS.filter((p) => p.slot === "hair")) {
    assert.equal(piece.art.kind, "image");
    if (piece.art.kind !== "image") continue;
    const front = pngPixels(readFileSync("public" + piece.art.front)).pixels,
      back = pngPixels(readFileSync("public" + piece.art.back!)).pixels;
    let frontCount = 0,
      backCount = 0;
    for (let i = 3; i < front.length; i += 4) {
      if (front[i]) frontCount++;
      if (back[i]) backCount++;
      assert.ok(!(front[i] && back[i]));
    }
    assert.ok(frontCount > 1000, piece.id);
    assert.ok(backCount > 1000, piece.id);
  }
});

test("every new article really changes material colour, preserves alpha, and leaves protected belt hardware intact", () => {
  for (const piece of WINTER_GARMENTS) {
    if (piece.art.kind !== "image") continue;
    const regions = piece.art.colorMasks!,
      main = pngPixels(readFileSync("public" + regions.main)).pixels,
      detail = regions.detail
        ? pngPixels(readFileSync("public" + regions.detail)).pixels
        : undefined;
    for (const url of [
      piece.art.front,
      ...(piece.slot === "hair" ? [piece.art.back!] : []),
    ]) {
      const original = pngPixels(readFileSync("public" + url)).pixels,
        next = new Uint8ClampedArray(original);
      paintColorRegions(
        next,
        new Uint8ClampedArray(main),
        detail ? new Uint8ClampedArray(detail) : undefined,
        {
          main: "#4a9ec7",
          detail: "#ed8dba",
          mainBase: regions.mainBase,
          detailBase: regions.detailBase,
          shading: "material",
        },
      );
      let changed = 0;
      for (let i = 0; i < next.length; i += 4) {
        assert.equal(next[i + 3], original[i + 3]);
        if (
          original[i + 3] &&
          (next[i] !== original[i] ||
            next[i + 1] !== original[i + 1] ||
            next[i + 2] !== original[i + 2])
        )
          changed++;
      }
      assert.ok(
        changed > 24,
        `${piece.id}: empty or ineffective dye mask for ${url}`,
      );
      if (piece.id === "fashion.winter-snow-belt") {
        const protectedPixels = pngPixels(
          readFileSync(
            "public/assets/avatar/winter-v2/snow-belt-protected.png",
          ),
        ).pixels;
        for (let i = 0; i < next.length; i += 4)
          if (original[i + 3] && protectedPixels[i + 3])
            assert.deepEqual(
              [...next.subarray(i, i + 4)],
              [...original.subarray(i, i + 4)],
            );
      }
    }
  }
});

test("hand-held bag closes the free hand, uses a shoulder version for heart hands, and keeps the chosen pose", () => {
  const look = WINTER_LOOKS[2].layers;
  for (const pose of ["front", "hand-on-hip", "heart-hands"] as const) {
    const svg = renderToStaticMarkup(
      React.createElement(Portrait, {
        id: "iris",
        fullBody: true,
        layers: look,
        pose,
      }),
    );
    if (pose === "heart-hands") {
      assert.doesNotMatch(svg, /closed-bag-grip/);
      assert.match(svg, /winter-v2\/ivory-bag.png/);
      assert.equal(
        avatarGarment(look.bag!).handCarry?.shoulderMask,
        "/assets/avatar/winter-v2/ivory-bag-mask.png",
      );
    } else assert.match(svg, /closed-bag-grip/);
    assert.doesNotMatch(
      svg,
      /\/sources\//,
      "reference figures are never rendered as equipment",
    );
  }
});

test("removing resting arms never clips the wide skirt in a different pose", () => {
  const layers = { ...EMPTY_LAYERS, bottom: "fashion.winter-ribbon-skirt" };
  const render = (pose: "front" | "heart-hands") => {
    let svg = renderToStaticMarkup(
      React.createElement(Portrait, {
        id: "iris",
        fullBody: true,
        layers,
        pose,
      }),
    ).replace(
      "<svg ",
      '<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774" ',
    );
    svg = svg.replace(
      /href="(\/assets\/[^\"]+)"/g,
      (_, url) =>
        `href="data:image/png;base64,${readFileSync("public" + url).toString("base64")}"`,
    );
    return new Resvg(svg).render().pixels;
  };
  const front = render("front"),
    heart = render("heart-hands"),
    i = (850 * 887 + 250) * 4;
  assert.ok(front[i + 3] > 240, "wide pleat exists in the reference pose");
  assert.deepEqual(
    [...heart.subarray(i, i + 4)],
    [...front.subarray(i, i + 4)],
    "same pleat remains visible after resting arm removal",
  );
});
