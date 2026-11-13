import test from "node:test";
import assert from "node:assert/strict";
import {
  BONES,
  solve,
  transform,
  blendPose,
  sampleMotion,
} from "../apps/web/src/avatar/rig/skeleton";
import { createMesh, skin, weightsAt } from "../apps/web/src/avatar/rig/mesh";
import {
  archivePiece,
  restorePiece,
  archivedPieces,
  subscribeArchive,
  withoutArchivedPieces,
} from "../apps/web/src/avatar/archive";
import { DEFAULT_LAYERS } from "../apps/web/src/avatar/model";
import { buyOutfit, emptyCommerce } from "../apps/web/src/shop/commerce";

test("rig neutral pose preserves the complete approved coordinate system, on every surface", () => {
  for (const part of ["body", "arm", "hand", "belt"] as const) {
    const mesh = createMesh(part),
      positions = skin(mesh.vertices, {});
    mesh.vertices.forEach((v, i) => {
      assert.ok(Math.abs(positions[2 * i] - v.point[0]) < 0.001);
      assert.ok(Math.abs(positions[2 * i + 1] - v.point[1]) < 0.001);
      assert.ok(
        Math.abs(v.weights.reduce((sum, w) => sum + w[1], 0) - 1) < 1e-10,
      );
    });
  }
});
test("parent and child share their articulation even during combined rotations", () => {
  const matrices = solve({
    chest: 3,
    leftUpperArm: 15,
    leftForearm: -25,
    rightUpperArm: -8,
    rightForearm: 20,
  });
  for (const b of BONES) {
    if (!b.parent) continue;
    const a = transform(matrices[b.id], b.pivot),
      p = transform(matrices[b.parent], b.pivot);
    assert.ok(Math.hypot(a[0] - p[0], a[1] - p[1]) < 1e-8, b.id);
  }
});
test("head and hands are rigid, belt follows pelvis, transition has no jump and takes the shortest arc", () => {
  assert.deepEqual(weightsAt("body", 443, 180), [["head", 1]]);
  assert.deepEqual(weightsAt("hand", 600, 710), [["rightHand", 1]]);
  assert.deepEqual(weightsAt("belt", 400, 800), [["pelvis", 1]]);
  assert.equal(blendPose({ head: 170 }, { head: -170 }, 0.5).head, 180);
  assert.deepEqual(
    blendPose({}, sampleMotion("greet", 0), 0),
    Object.fromEntries(BONES.map((b) => [b.id, 0])),
  );
  const start = blendPose({}, sampleMotion("greet", 0), 0.001);
  assert.ok(Math.abs(start.leftForearm!) < 0.00002);
});
test("builder removal is persistent and reversible; purchases, variants and source outfit survive", () => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => data.set(k, v),
    },
  });
  const receipt = buyOutfit(
      emptyCommerce(),
      "account",
      "iris",
      DEFAULT_LAYERS,
      DEFAULT_LAYERS,
    ),
    saved = JSON.stringify(receipt.next);
  let notifications = 0;
  const unsubscribe = subscribeArchive(() => notifications++);
  archivePiece(DEFAULT_LAYERS.top!);
  archivePiece(DEFAULT_LAYERS.top!);
  assert.equal(notifications, 1);
  assert.deepEqual(archivedPieces(), [DEFAULT_LAYERS.top]);
  assert.deepEqual(JSON.parse(data.get("avatar-archived-pieces-v1")!), [
    DEFAULT_LAYERS.top,
  ]);
  const visible = withoutArchivedPieces(DEFAULT_LAYERS, archivedPieces());
  assert.equal(visible.top, null);
  assert.equal(visible.bottom, DEFAULT_LAYERS.bottom);
  assert.equal(visible.shoes, DEFAULT_LAYERS.shoes);
  assert.equal(DEFAULT_LAYERS.top, "fashion.cardigan-lilac");
  assert.equal(JSON.stringify(receipt.next), saved);
  restorePiece(DEFAULT_LAYERS.top!);
  assert.equal(notifications, 2);
  assert.deepEqual(archivedPieces(), []);
  assert.equal(
    withoutArchivedPieces(DEFAULT_LAYERS, archivedPieces()),
    DEFAULT_LAYERS,
  );
  unsubscribe();
});
