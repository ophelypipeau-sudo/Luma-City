import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  avatarCatalogSnapshot,
  avatarGarment,
  registerAtelierGarment,
  replaceAtelierCatalog,
  pendingPoseImports,
} from "../apps/web/src/avatar/catalog";
import {
  poseProfileIssues,
  poseFit,
  sleevelessPoseProfile,
} from "../apps/web/src/avatar/pose-wardrobe";
import { outfitSupportsPose } from "../apps/web/src/avatar/pose-compatibility";
import { Portrait } from "../apps/web/src/Avatar";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
import { STATIC_POSES } from "../apps/web/src/avatar/static-poses";
import { PREMIUM_CAPSULE_GARMENTS } from "../apps/web/src/avatar/premium-capsule";
import { HAIR_CAPSULE_GARMENTS } from "../apps/web/src/avatar/hair-capsule";

test("shop pieces render only calibrated poses and retain equipped identities and colors", () => {
  const pieces = avatarCatalogSnapshot();
  assert.equal(PREMIUM_CAPSULE_GARMENTS.length, 9);
  assert.equal(HAIR_CAPSULE_GARMENTS.length, 6);
  for (const hair of HAIR_CAPSULE_GARMENTS) {
    assert.ok(pieces.some(({ id }) => id === hair.id));
    assert.equal(poseFit(hair, "front")?.kind, "shared");
    assert.equal(poseFit(hair, "hand-on-hip")?.kind, "unavailable");
    assert.equal(poseFit(hair, "heart-hands")?.kind, "unavailable");
  }
  assert.ok(!pieces.some(({ id }) => id === "fashion.premium-rebelle"));
  const capsule = new Set(PREMIUM_CAPSULE_GARMENTS.map(({ id }) => id));
  for (const piece of pieces) {
    assert.deepEqual(poseProfileIssues(piece, true), [], piece.id);
    const layers = {
      ...DEFAULT_LAYERS,
      [piece.slot]: piece.id,
      colors: { [piece.id]: "#43a0c8" },
      detailColors: { [piece.id]: "#f5dc9a" },
    };
    const before = JSON.stringify(layers);
    for (const pose of STATIC_POSES) {
      const supported = poseFit(piece, pose)?.kind !== "unavailable";
      assert.equal(
        outfitSupportsPose(layers, pose),
        supported,
        `${piece.id} ${pose}`,
      );
      const svg = renderToStaticMarkup(
        React.createElement(Portrait, {
          id: "iris",
          fullBody: true,
          pose,
          layers,
        }),
      );
      if (!supported)
        assert.ok(svg.includes(`data-pose-pending="${pose}"`));
      else
        assert.doesNotMatch(svg, /data-pose-pending/);
      if (supported && pose !== "front")
        assert.ok(svg.includes(`data-avatar-pose="${pose}"`));
      if (capsule.has(piece.id) && pose === "hand-on-hip") {
        const posedTop = piece.poseProfile!.fits[pose].sleeves!.front;
        assert.ok(svg.includes(piece.fittingBody![pose]));
        assert.ok(svg.includes(posedTop));
        assert.ok(piece.fittingHipHand);
        assert.ok(svg.lastIndexOf(piece.fittingHipHand) > svg.lastIndexOf(posedTop));
      }
      assert.equal(JSON.stringify(layers), before);
    }
  }
});

test("imports require frontal calibration and validate any additional poses they declare", () => {
  const source = avatarGarment("fashion.cardigan-lilac");
  const custom = { ...source, id: "atelier.pose-test", poseProfile: undefined };
  const before = avatarCatalogSnapshot();
  assert.throws(() => registerAtelierGarment(custom, true), /ajustement/);
  assert.equal(avatarCatalogSnapshot(), before);
  assert.throws(() => avatarGarment(custom.id), /Unknown/);
  const approved = {
    ...custom,
    poseProfile: structuredClone(source.poseProfile!),
  };
  delete (approved.poseProfile.fits["heart-hands"] as any).sleeves.main;
  assert.throws(() => registerAtelierGarment(approved, true), /masque requis/);
  approved.poseProfile = source.poseProfile!;
  try {
    registerAtelierGarment(approved, true);
    for (const pose of ["heart-hands", "hand-on-hip"] as const) {
      const svg = renderToStaticMarkup(
        React.createElement(Portrait, {
          id: "iris",
          fullBody: true,
          pose,
          layers: { ...DEFAULT_LAYERS, top: approved.id },
        }),
      );
      assert.ok(
        svg.includes(approved.poseProfile.fits[pose].sleeves!.front),
        "custom ID uses its registered sleeve drawing",
      );
    }
    const frontOnly = {
      ...approved,
      poseProfile: {
        ...approved.poseProfile,
        fits: {
          front: approved.poseProfile.fits.front,
          "heart-hands": { kind: "unavailable" as const },
          "hand-on-hip": { kind: "unavailable" as const },
        },
      },
    };
    replaceAtelierCatalog([frontOnly]);
    assert.ok(avatarCatalogSnapshot().some((piece) => piece.id === frontOnly.id));
    const layers = { ...DEFAULT_LAYERS, top: frontOnly.id };
    assert.equal(outfitSupportsPose(layers, "front"), true);
    assert.equal(outfitSupportsPose(layers, "heart-hands"), false);
    assert.equal(outfitSupportsPose(layers, "hand-on-hip"), false);
  } finally {
    replaceAtelierCatalog([]);
  }
});

test("unreviewed historical imports keep their IDs and frontal view without pretending to support other poses", () => {
  const piece = {
    ...avatarGarment("fashion.rose-bow-camisole"),
    id: "atelier.pending-test",
    poseProfile: undefined,
  };
  try {
    replaceAtelierCatalog([piece]);
    assert.equal(avatarGarment(piece.id), piece);
    assert.ok(pendingPoseImports().some((p) => p.id === piece.id));
    assert.ok(!avatarCatalogSnapshot().some((p) => p.id === piece.id));
    const layers = { ...DEFAULT_LAYERS, top: piece.id };
    assert.equal(outfitSupportsPose(layers, "front"), true);
    assert.equal(outfitSupportsPose(layers, "heart-hands"), false);
    const svg = renderToStaticMarkup(
      React.createElement(Portrait, {
        id: "iris",
        fullBody: true,
        pose: "heart-hands",
        layers,
      }),
    );
    assert.match(svg, /data-pose-pending="heart-hands"/);
    assert.doesNotMatch(svg, /data-avatar-pose="heart-hands"/);
    replaceAtelierCatalog([{ ...piece, poseProfile: sleevelessPoseProfile() }]);
    assert.equal(pendingPoseImports().length, 0);
    assert.equal(outfitSupportsPose(layers, "heart-hands"), true);
  } finally {
    replaceAtelierCatalog([]);
  }
});
