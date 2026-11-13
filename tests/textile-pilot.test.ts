import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { TextileGarment } from "../apps/web/src/avatar/TextileGarment";
import { avatarGarment } from "../apps/web/src/avatar/catalog";
import { poseProfileIssues } from "../apps/web/src/avatar/pose-wardrobe";
import { Portrait } from "../apps/web/src/Avatar";
import { EMPTY_LAYERS } from "../apps/web/src/avatar/model";
test("textile dyes preserve geometry, alpha and protected stitches in all three poses without photo pixels", () => {
  for (const cut of ["cropped-knit", "tailored-shorts"] as const)
    for (const pose of ["front", "hand-on-hip", "heart-hands"] as const) {
      const draw = (color: string) =>
        renderToStaticMarkup(
          React.createElement(TextileGarment, { cut, pose, color }),
          { identifierPrefix: "test-" },
        );
      const a = draw("#f8d2e6"),
        b = draw("#172e45");
      assert.doesNotMatch(a, /<image|data:image|feColorMatrix/);
      assert.match(a, /<pattern/);
      const stitches = (s: string) =>
        s.match(/<g data-textile-channel="protected-seams"[\s\S]*?<\/g>/)?.[0];
      assert.ok(stitches(a));
      assert.equal(stitches(a), stitches(b));
      const pixels = (s: string) =>
        new Resvg(
          `<svg xmlns="http://www.w3.org/2000/svg" width="444" height="887" viewBox="0 0 887 1774">${s}</svg>`,
        ).render().pixels;
      const pa = pixels(a),
        pb = pixels(b);
      let changed = 0;
      for (let i = 0; i < pa.length; i += 4) {
        assert.equal(pa[i + 3], pb[i + 3]);
        if (pa[i + 3] > 200 && Math.abs(pa[i] - pb[i]) > 40) changed++;
      }
      assert.ok(changed > 2000, "base material really changes colour");
    }
});
