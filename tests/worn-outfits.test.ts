import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import {
  readWornOutfits,
  snapshotOutfit,
  outfitOwner,
} from "../apps/web/src/avatar/worn-outfits";
// Pieces currently on sale (the former leopard and winter collections were retired).
const LIVE_LAYERS = {
  belt: null,
  top: "fashion.premium-velvet",
  outerwear: "fashion.y2k-mcbling",
  hair: "fashion.hair-01-aureole",
  bottom: "fashion.pants-rocade",
  shoes: "fashion.shoes-campus",
};
import { Portrait } from "../apps/web/src/Avatar";
import { Room } from "../apps/web/src/Room";
import { clothingLayerOrder, equipLayer, moveClothingLayer, moveOutfitPiece, orderedOutfitPieces, removeGarment, wearGarment, DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
import { wornOutfitSchema } from "../packages/contracts/src/index";
import { LayeredDoll } from "../apps/web/src/avatar/LayeredDoll";
test("accepted outfit preserves all slots and both colour regions, independently from future try-ons", () => {

  const draft = {
    ...LIVE_LAYERS,
    face: { eyes: "green", lips: "berry", skin: "tan", nose: "fine" } as const,
    colors: { [LIVE_LAYERS.bottom!]: "#ff80c0" },
    detailColors: { [LIVE_LAYERS.bottom!]: "#ffffff" },
  };
  const worn = snapshotOutfit(draft);
  draft.colors[LIVE_LAYERS.bottom!] = "#00ff00";
  assert.equal(worn.colors?.[LIVE_LAYERS.bottom!], "#ff80c0");
  const owner = outfitOwner("test-account", "iris");
  const restored = readWornOutfits(JSON.stringify({ [owner]: worn }))[owner];
  assert.deepEqual(restored, worn);
  assert.deepEqual(wornOutfitSchema.parse(restored).face, draft.face);
  const tryOn = equipLayer(restored, "bottom", DEFAULT_LAYERS.bottom);
  assert.equal(tryOn.belt, worn.belt);
  assert.equal(restored.bottom, LIVE_LAYERS.bottom);
  assert.notEqual(owner, outfitOwner("other-account", "iris"));
  assert.notEqual(owner, outfitOwner("test-account", "june"));
});
test("the room uses the worn dressing outfit immediately, even before presence has synchronized", () => {
  const velvet = "fashion.premium-velvet";
  const html = renderToStaticMarkup(React.createElement(Room, {
    roomId: "greenhouse",
    scene: { name: "La serre", background: "" },
    me: "iris",
    players: [{ id: "iris", name: "Iris", account_id: "aurore",
      color: "#9367cb", hair: "#55354b", slot: 1, x: 50, y: 75,
      outfit: DEFAULT_LAYERS }],
    wornLayers: { ...LIVE_LAYERS, top: velvet, colors: { [velvet]: "#b4629b" } },
    onMove: () => {},
    onSelect: () => {},
  }));
  assert.match(html, /data-piece="fashion\.premium-velvet"/);
  assert.match(html, /capsule-premium-v1\/01-velvet\/front\.png/);
  assert.doesNotMatch(html, /data-piece="fashion\.cardigan-lilac"/);
});
test("a tucked top stays under the bottom after saving and sharing the outfit", () => {
  const draft = { ...DEFAULT_LAYERS, top: "fashion.premium-rosalie", bottom: "fashion.pants-calcaire", topTucked: true };
  const owner = outfitOwner("test-account", "iris");
  const restored = readWornOutfits(JSON.stringify({ [owner]: draft }))[owner];
  const outfit = wornOutfitSchema.parse(restored);
  assert.equal(outfit.topTucked, true);
  const draw = (topTucked: boolean) => renderToStaticMarkup(React.createElement(Portrait, {
    id: "iris", fullBody: true, layers: { ...outfit, topTucked },
  }));
  const top = 'data-layer="top" data-piece=';
  const bottom = 'data-layer="bottom" data-piece=';
  assert.ok(draw(true).indexOf(top) < draw(true).indexOf(bottom));
  assert.ok(draw(false).indexOf(top) > draw(false).indexOf(bottom));
});

test("a jacket can move between the other clothes and retain its position after saving", () => {
  const jacket = "fashion.y2k-mcbling";
  const legacy = readWornOutfits(JSON.stringify({ iris: { ...DEFAULT_LAYERS, top: jacket } })).iris;
  assert.equal(legacy.outerwear, jacket);
  assert.equal(legacy.top, null);
  const worn = equipLayer(legacy, "top", "fashion.capsule-mode-cerise");
  assert.deepEqual(clothingLayerOrder(worn), ["outerwear", "top2", "top", "bottom"]);
  const middle = moveClothingLayer(worn, "outerwear", 1);
  const behind = moveClothingLayer(middle, "outerwear", 1);
  assert.deepEqual(clothingLayerOrder(middle), ["top", "top2", "outerwear", "bottom"]);
  assert.deepEqual(clothingLayerOrder(behind), ["top", "top2", "bottom", "outerwear"]);
  assert.equal(moveClothingLayer(behind, "outerwear", 1), behind);
  const restored = readWornOutfits(JSON.stringify({ iris: snapshotOutfit(behind) })).iris;
  const outfit = wornOutfitSchema.parse(restored);
  assert.deepEqual(outfit.layerOrder, behind.layerOrder);
  assert.equal(wornOutfitSchema.safeParse({ ...outfit, layerOrder: ["top", "top", "bottom"] }).success, false);
  const svg = renderToStaticMarkup(React.createElement(Portrait, { id: "iris", fullBody: true, layers: outfit }));
  const order = [...svg.matchAll(/data-layer="(top|bottom|outerwear)" data-piece=/g)].map(([, slot]) => slot);
  assert.deepEqual(order, ["outerwear", "bottom", "top"]);
  const tucked = moveClothingLayer(behind, "top", 1);
  assert.equal(tucked.topTucked, true);
  assert.equal(moveClothingLayer(tucked, "top", -1).topTucked, false);
});

test("two tops draw independently, swap in place and retain their order after saving", () => {
  const top = "fashion.capsule-mode-cerise";
  const top2 = "fashion.premium-velvet";
  const legacy = readWornOutfits(JSON.stringify({ iris: {
    ...DEFAULT_LAYERS, top, layerOrder: ["outerwear", "top", "bottom"],
  } })).iris;
  const layered = wearGarment(legacy, top2);
  assert.equal(layered.top, top);
  assert.equal(layered.top2, top2);
  const draw = (outfit: typeof layered) => renderToStaticMarkup(React.createElement(Portrait, {
    id: "iris", fullBody: true, layers: outfit,
  }));
  const above = draw(layered);
  assert.ok(above.indexOf('data-piece="' + top + '"') < above.indexOf('data-piece="' + top2 + '"'));
  const changed = moveClothingLayer(layered, "top2", 1);
  const restored = readWornOutfits(JSON.stringify({ iris: snapshotOutfit(changed) })).iris;
  assert.equal(wornOutfitSchema.parse(restored).top2, top2);
  const below = draw(restored);
  assert.ok(below.indexOf('data-piece="' + top2 + '"') < below.indexOf('data-piece="' + top + '"'));
});

test("all worn pieces can be stacked, reordered, saved and removed individually", () => {
  const hairs = ["fashion.hair-01-aureole", "fashion.hair-02-trait"];
  const shoes = "fashion.shoes-campus";
  const additions = ["fashion.premium-venus", "fashion.premium-velvet", ...hairs, shoes];
  const stacked = additions.reduce(wearGarment, DEFAULT_LAYERS);
  const initialOrder = orderedOutfitPieces(stacked).map((piece) => piece.id);
  assert.equal(initialOrder.length, additions.length + 3);
  const reordered = moveOutfitPiece(stacked, shoes, -initialOrder.length);
  const saved = wornOutfitSchema.parse(snapshotOutfit(reordered));
  const restored = readWornOutfits(JSON.stringify({ iris: saved })).iris;
  assert.equal(orderedOutfitPieces(restored)[0].id, shoes);
  const html = renderToStaticMarkup(React.createElement(Portrait, {
    id: "iris", fullBody: true, layers: restored,
  }));
  assert.equal(Array.from(html.matchAll(/data-piece="([^"]+)"/g)).at(-1)?.[1], shoes);
  const removed = [hairs[1], shoes].reduce(removeGarment, restored);
  assert.deepEqual(orderedOutfitPieces(removed).map((piece) => piece.id),
    orderedOutfitPieces(restored).map((piece) => piece.id).filter((id) =>
      ![hairs[1], shoes].includes(id)));
});

test("tucking removes the lower torso paint but keeps both long sleeves intact", () => {
  const render = (top: string, topTucked: boolean) => {
    const drawing = renderToStaticMarkup(React.createElement("svg",
      { xmlns: "http://www.w3.org/2000/svg", width: 480, height: 1024 },
      React.createElement(LayeredDoll, {
        layers: { top, bottom: "fashion.pants-indigo", shoes: null, topTucked },
        inspection: "garments", hiddenSlots: ["bottom"],
      }),
    )).replace(/href="(\/assets\/[^"]+)"/g, (_, url: string) =>
      `href="data:image/png;base64,${readFileSync("public" + url).toString("base64")}"`);
    return new Resvg(drawing).render().pixels;
  };
  for (const top of ["fashion.premium-rosalie", "fashion.y2k-mcbling", "fashion.dark-feminine"]) {
    const outside = render(top, false), tucked = render(top, true);
    let left = 0, right = 0, trimmed = 0;
    for (let y = 402; y < 488; y++) for (let x = 0; x < 480; x++) {
      const i = (y * 480 + x) * 4;
      if ((x < 135 || x > 347) && outside[i + 3]) {
        assert.equal(tucked.readUInt32BE(i), outside.readUInt32BE(i), top);
        if (x < 135) left++; else right++;
      }
      if (x >= 155 && x <= 325 && outside[i + 3] && !tucked[i + 3]) trimmed++;
    }
    assert.ok(left > 100 && right > 100 && trimmed > 30, top);
  }
});
test("malformed local saves do not crash", () => {
  assert.deepEqual(readWornOutfits("broken"), {});
  assert.deepEqual(readWornOutfits("[]"), {});
  const owner = outfitOwner("a", "iris");
  const saved = readWornOutfits(
    JSON.stringify({
      [owner]: {
        top: "missing",
        bottom: null,
        colors: { bad: "not-a-colour" },
      },
    }),
  )[owner];
  assert.equal(saved.top, DEFAULT_LAYERS.top);
  assert.equal(saved.bottom, null);
  assert.deepEqual(saved.colors, {});
});
