import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DOLL_PATTERN,
  armAxis,
  armFrame,
  torsoBounds,
} from "../packages/domain/src/avatar-pattern";
import { pngPixels } from "../apps/server/src/atelier-images";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { poseProfileIssues } from "../apps/web/src/avatar/pose-wardrobe";
const root = "public/assets/avatar/winter-v2/";
test("one canonical body pattern binds every published article; a canvas alone cannot approve a future import", () => {
  for (const piece of avatarCatalogSnapshot()) {
    assert.equal(piece.pattern?.id, DOLL_PATTERN.id);
    assert.equal(piece.pattern?.bodySha256, DOLL_PATTERN.bodySha256);
    assert.deepEqual(poseProfileIssues(piece, true), []);
  }
  const piece = avatarCatalogSnapshot()[0];
  assert.match(
    poseProfileIssues({
      ...piece,
      id: "atelier.no-pattern",
      pattern: undefined,
    }).join(),
    /patron/,
  );
  assert.deepEqual(torsoBounds(600), [362, 524]);
});
test("archived pattern pipeline retains its frontal waist texture and dye regions", () => {
  for (const [name, kind] of [
    ["pink-jacket", "pink"],
    ["snow-top", "snow"],
    ["ivory-dress", "ivory"],
    ["ribbon-cardigan", "ribbon"],
    ["legacy-lilac", "legacy-lilac"],
    ["legacy-burgundy", "legacy-burgundy"],
  ])
    for (const suffix of ["", "-mask"]) {
      const front = pngPixels(
        readFileSync(root + name + suffix + ".png"),
      ).pixels;
      for (const pose of ["hip", "heart"]) {
        const next = pngPixels(
          readFileSync(root + kind + "-" + pose + suffix + ".png"),
        ).pixels;
        for (let y = 610; y < 630; y++)
          for (let x = 385; x < 500; x++) {
            const i = (y * 887 + x) * 4;
            assert.deepEqual(
              next.subarray(i, i + 4),
              front.subarray(i, i + 4),
              `${name} ${pose} shared waist ${x},${y}`,
            );
          }
      }
    }
});
test("archived pattern cuffs cover wrists while leaving palms and fingers free", () => {
  for (const name of [
    "pink-jacket",
    "snow-top",
    "ivory-dress",
    "ribbon-cardigan",
    "legacy-lilac",
    "legacy-burgundy",
  ]) {
    const p = pngPixels(readFileSync(root + name + ".png")).pixels;
    assert.ok(p[(805 * 887 + 170) * 4 + 3] > 100, name + " left cuff");
    assert.ok(p[(805 * 887 + 716) * 4 + 3] > 100, name + " right cuff");
    assert.equal(
      p[(920 * 887 + 130) * 4 + 3],
      0,
      name + " does not cover fingers",
    );
  }
});
test("all arm poses share the same UV cage with finite smooth frames and registered wrist endpoints", () => {
  for (const pose of ["front", "hand-on-hip", "heart-hands"] as const)
    for (const side of ["left", "right"] as const) {
      const axis = armAxis(pose, side);
      assert.deepEqual(armFrame(axis, 1).p, axis.at(-1));
      let last = armFrame(axis, 0);
      for (let i = 1; i <= 200; i++) {
        const frame = armFrame(axis, i / 200);
        assert.ok([...frame.p, ...frame.n].every(Number.isFinite));
        assert.ok(
          Math.hypot(frame.p[0] - last.p[0], frame.p[1] - last.p[1]) < 8,
        );
        last = frame;
      }
    }
});

test("slit panels remain part of the dress and open-front hems do not become sleeve streaks", () => {
  const dress = pngPixels(readFileSync(root + "ivory-dress.png")).pixels;
  assert.ok(
    dress[(900 * 887 + 600) * 4 + 3] > 100,
    "right panel next to the slit is retained",
  );
  const cardigan = pngPixels(readFileSync(root + "ribbon-cardigan.png")).pixels;
  assert.ok(
    cardigan[(634 * 887 + 160) * 4 + 3] < 20,
    "no horizontal hem streak outside the sleeve",
  );
});
