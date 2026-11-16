import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrizeWheel, wheelTotals } from "../apps/web/src/Arcade";
import { walletPickups } from "../apps/web/src/FloatingRewards";
import { LevelMeter } from "../apps/web/src/LevelMeter";
import { levelProgress } from "../packages/contracts/src/index";

test("the wheel adds up the prizes of several spins, per currency", () => {
  // Le français sépare les milliers par une espace insécable.
  const n = (value: number) => new Intl.NumberFormat("fr-FR").format(value);
  assert.equal(wheelTotals([{ currency: "xp", amount: 1000 }]), `${n(1000)} XP`);
  assert.equal(wheelTotals([
    { currency: "coins", amount: 500 }, { currency: "xp", amount: 4600 }, { currency: "coins", amount: 2500 },
  ]), `${n(3000)} pièces et ${n(4600)} XP`);
});

test("several spins still give at most five bubbles per currency", () => {
  const drops = ["a", "b", "c"].flatMap((burst) => [0, 1, 2, 3, 4].map((slot) => ({
    id: `${burst}${slot}`, currency: burst === "b" ? "coins" as const : "xp" as const, amount: 100, burst, slot,
  })));
  const bubbles = walletPickups(drops);
  assert.equal(bubbles.length, 10);
  assert.equal(bubbles.filter((bubble) => bubble.currency === "xp").every((bubble) => bubble.amount === 200), true);
  // XP and coins never share a place on screen.
  assert.equal(new Set(bubbles.map((bubble) => bubble.slot)).size, 10);
});

test("the spin count can be chosen only when several spins are available", () => {
  const render = (tickets: number) => renderToStaticMarkup(React.createElement(PrizeWheel, {
    wheel: { tickets, accountCoins: 0, accountDiamonds: 0, pending: [] },
    onClose() {}, onSpin: async () => { throw new Error(); }, onBurst() {},
  }));
  assert.doesNotMatch(render(1), /Nombre de tours à lancer/);
  const many = render(12);
  assert.match(many, /Nombre de tours à lancer/);
  assert.match(many, /Tout \(12\)/);
  assert.match(many, /<strong>1<\/strong> tour/);
});

test("hovering the level bar tells the XP earned in this level and what is left", () => {
  const xp = 2600;
  const { level, earned, required } = levelProgress(xp);
  const html = renderToStaticMarkup(React.createElement(LevelMeter, { xp }));
  const format = new Intl.NumberFormat("fr-FR");
  assert.match(html, new RegExp(`Niv\\. ${level}`));
  assert.ok(html.includes(`${format.format(earned)} / ${format.format(required)} XP`));
  assert.ok(html.includes(`Encore ${format.format(required - earned)} XP pour le niveau ${level + 1}`));
  assert.match(html, /role="tooltip"/);
});
