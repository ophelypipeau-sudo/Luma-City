import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BeautySalon } from "../apps/web/src/BeautySalon";
import { hexToHsv, hsvToHex } from "../apps/web/src/ColorWheel";
import { SKIN_TONES, skinHex } from "../apps/web/src/avatar/face-customization";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
import { avatarFaceSchema } from "../packages/contracts/src/index";

test("a skin colour can be any HEX picked on the wheel, and the four original tones still work", () => {
  const face = { eyes: "original", lips: "original", nose: "original" } as const;
  assert.equal(avatarFaceSchema.parse({ ...face, skin: "#913289" }).skin, "#913289");
  for (const skin of ["original", "light", "tan", "deep"] as const)
    assert.equal(avatarFaceSchema.parse({ ...face, skin }).skin, skin);
  assert.throws(() => avatarFaceSchema.parse({ ...face, skin: "violet" }));
  // The quick tones of the salon are exactly the old named tones.
  assert.deepEqual(SKIN_TONES.map(({ hex }) => hex),
    (["original", "light", "tan", "deep"] as const).map(skinHex));
  assert.equal(skinHex("original"), "#db8d59");
  assert.equal(skinHex("#ABCDEF"), "#abcdef");
});

test("the colour wheel converts colours both ways without drifting", () => {
  for (const hex of ["#db8d59", "#913289", "#000000", "#ffffff", "#426eab"])
    assert.equal(hsvToHex(hexToHsv(hex)), hex);
});

test("the salon opens on one page, with save disabled until something changes", () => {
  const html = renderToStaticMarkup(React.createElement(BeautySalon, {
    layers: DEFAULT_LAYERS, onBack: () => {}, onSave: () => {},
  }));
  for (const label of ["Looks", "Yeux", "Sourcils", "Nez", "Bouche", "Teint"])
    assert.match(html, new RegExp(`<small>${label}</small>`));
  assert.match(html, /Visage d’origine/);
  assert.match(html, /disabled=""[^>]*>.*?Enregistrer/s);
  const closed = renderToStaticMarkup(React.createElement(BeautySalon, { layers: DEFAULT_LAYERS, onBack: () => {} }));
  assert.match(closed, /réservé à Iris/);
});
