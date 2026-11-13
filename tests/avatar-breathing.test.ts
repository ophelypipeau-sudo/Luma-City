import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Portrait } from "../apps/web/src/Avatar";
import { FittingAvatar } from "../apps/web/src/shop/FittingAvatar";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
import { BARE_OUTFIT } from "../apps/web/src/shop/catalog";
import {
  sampleMotion,
  solve,
  transform,
} from "../apps/web/src/avatar/rig/skeleton";
test("production poses are static, including a legacy breathing flag, while fitting remains frontal", () => {
  const draw = (props: object) =>
    renderToStaticMarkup(
      React.createElement(Portrait, {
        id: "iris",
        layers: DEFAULT_LAYERS,
        ...props,
      }),
    );
  const heart = draw({ fullBody: true, pose: "heart-hands", breathing: true });
  // Every piece on sale is drawn from the front only: other poses fall back to it.
  assert.match(heart, /data-pose-pending="heart-hands"/);
  for (const other of [
    heart,
    draw({ fullBody: true, pose: "front", breathing: true }),
    draw({ fullBody: false, breathing: true }),
    draw({ fullBody: true, pose: "hand-on-hip", breathing: true }),
    renderToStaticMarkup(
      React.createElement(FittingAvatar, {
        characterId: "iris",
        outfit: BARE_OUTFIT,
        layers: DEFAULT_LAYERS,
      }),
    ),
  ])
    assert.doesNotMatch(other, /<animate|data-avatar-animation="breathing"/);
});
test("experimental breathing no longer bends either elbow, shoulder or hand", () => {
  for (const time of [0, 1, 2, 3, 4, 5, 6]) {
    const pose = sampleMotion("breathe", time),
      matrices = solve(pose);
    for (const [bone, pivot] of [
      ["leftForearm", [257, 610]],
      ["leftHand", [162, 835]],
      ["rightForearm", [744, 550]],
      ["rightHand", [632, 696]],
    ] as const)
      assert.deepEqual(transform(matrices[bone], pivot), pivot);
  }
});
