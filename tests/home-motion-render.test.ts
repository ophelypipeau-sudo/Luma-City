import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Room } from "../apps/web/src/Room";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
import type { Presence } from "../packages/contracts/src/index";

test("Le rendu déplace le groupe et son animal sans remplacer les calques de l’avatar", () => {
  const player = { id: "iris", name: "Iris", slot: 1, color: "#b685b5", hair: "#583923", account_id: "aurore",
    x: 10, y: 500 / 6.8, companion: { id: "pet-demo", modelId: "01-mochi", name: "Nuage" },
    motion: { id: "motion-demo", startedAt: 1000, speed: 160, revision: 1, points: [{ x: 100, y: 500 }, { x: 900, y: 500 }] },
  } satisfies Presence;
  const render = (serverTime: number) => renderToStaticMarkup(React.createElement(Room, {
    roomId: "home:iris", scene: { name: "Salon", background: "" }, players: [player], me: "iris", wornLayers: DEFAULT_LAYERS,
    serverTime, receivedAt: performance.now(), onMove: () => {}, onSelect: () => {},
    homeScene: { background: React.createElement("g"), objects: [], editing: false },
  }));
  const before = render(1000), during = render(1500), after = render(20000);
  const layers = (html: string) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(layers(before), layers(during)); assert.deepEqual(layers(before), layers(after));
  const x = (html: string) => Number(html.match(/class="scene-player" transform="translate\(([^ ]+) /)?.[1]);
  assert.ok(Math.abs(x(before) - 100) < 1); assert.ok(Math.abs(x(during) - 180) < 1); assert.equal(x(after), 900);
  for (const html of [before, during, after]) {
    assert.match(html, /class="room-companion"/); assert.match(html, /role="img" aria-label="Nuage"/);
    assert.match(html, /scale\(1\.6\)/); assert.doesNotMatch(html, /hand-on-hip|heart-hands/);
    const movingGroup = html.indexOf('class="scene-player"');
    assert.ok(html.indexOf('class="room-companion"') > movingGroup);
  }
});
