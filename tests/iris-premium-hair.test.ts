import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { IRIS_PREMIUM_HAIR_GARMENTS } from "../apps/web/src/avatar/iris-premium-hair";
import { DEFAULT_LAYERS, equippedPieces } from "../apps/web/src/avatar/model";
import { readAvatarLayers } from "../apps/web/src/avatar/worn-outfits";
import { matchesWardrobeCategory } from "../apps/web/src/WardrobeCategories";
import { colorGarment, fittingCart, tryOnGarment } from "../apps/web/src/shop/fashion-options";
import { paintColorRegions } from "../packages/domain/src/atelier-color";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { nativeRgba } from "../scripts/lib/png-native";

const read = (url: string) => nativeRgba(readFileSync(`public${url}`));

test("the ten premium wigs can be tried on, dyed and priced by the shared wardrobe catalog", () => {
  const pieces = IRIS_PREMIUM_HAIR_GARMENTS;
  assert.equal(new Set(pieces.map(({ id }) => id)).size, 10);
  const catalog = avatarCatalogSnapshot().filter(piece => matchesWardrobeCategory("hair", piece));
  let outfit = DEFAULT_LAYERS;
  for (const piece of pieces) {
    assert.ok(catalog.some(({ id }) => id === piece.id), piece.id);
    outfit = colorGarment(tryOnGarment(outfit, piece.id), piece.id, "#a77dcd");
    assert.deepEqual(equippedPieces(outfit).filter(({ slot }) => slot === "hair").map(({ id }) => id), [piece.id]);
    assert.equal(readAvatarLayers(outfit)?.hair, piece.id);
    assert.equal(fittingCart(outfit).find(({ piece: item }) => item.id === piece.id)?.price, 850);
    if (piece.secondaryColor) {
      outfit = colorGarment(outfit, piece.id, "#43b09c", "detail");
      const entry = fittingCart(outfit).find(({ piece: item }) => item.id === piece.id);
      assert.equal(entry?.color, "#a77dcd");
      assert.equal(entry?.detailColor, "#43b09c");
      assert.equal(readAvatarLayers(outfit)?.detailColors?.[piece.id], "#43b09c");
    }
  }
});

test("premium hair has one paint layer, clear facial features, and a texture-preserving dye mask", () => {
  for (const { id, art, pattern, poseProfile } of IRIS_PREMIUM_HAIR_GARMENTS) {
    assert.equal(art.kind, "image");
    assert.equal(art.back, undefined);
    assert.equal(art.backRegion, undefined);
    assert.equal(pattern?.bodySha256, DOLL_PATTERN.bodySha256);
    assert.equal(poseProfile?.fits.front.kind, "shared");
    assert.equal(poseProfile?.fits["hand-on-hip"].kind, "unavailable");
    assert.equal(poseProfile?.fits["heart-hands"].kind, "unavailable");
    const { width, height, pixels } = read(art.front);
    assert.deepEqual([width, height], [...DOLL_PATTERN.canvas]);
    assert.ok(art.colorMasks?.mainTone);
    const dye = read(art.colorMasks.main).pixels;
    const detail = art.colorMasks.detail ? read(art.colorMasks.detail).pixels : undefined;
    const fixed = art.colorMasks.protected ? read(art.colorMasks.protected).pixels : undefined;
    const firstMask = new Uint8ClampedArray(dye);
    const secondMask = detail && new Uint8ClampedArray(detail);
    const tinted = paintColorRegions(new Uint8ClampedArray(pixels), firstMask, secondMask,
      { ...art.colorMasks, main: "#a77dcd", detail: "#43b09c" });
    const detailOnly = detail && paintColorRegions(new Uint8ClampedArray(pixels), firstMask, secondMask,
      { ...art.colorMasks, main: undefined, detail: "#43b09c" });
    const tones = new Set<number>();
    let changed = 0, protectedCount = 0, pinkCount = 0, brownCount = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const pink = detail?.[i + 3] ?? 0;
      assert.equal(tinted[i + 3], pixels[i + 3], id);
      if (!pixels[i + 3]) {
        assert.equal(dye[i + 3], 0, id);
        assert.equal(pink, 0, id);
        assert.equal(fixed?.[i + 3] ?? 0, 0, id);
      } else if (fixed?.[i + 3]) {
        assert.equal(dye[i + 3], 0, id);
        assert.equal(pink, 0, id);
        assert.deepEqual([...tinted.subarray(i, i + 3)], [...pixels.subarray(i, i + 3)], id);
        protectedCount++;
      } else {
        assert.equal(dye[i + 3] + pink, 255, id);
        if (pink === 255 && detailOnly?.[i + 1] !== pixels[i + 1]) pinkCount++;
        if (detailOnly && !pink) {
          assert.equal(detailOnly[i + 1], pixels[i + 1], id);
          brownCount++;
        }
        if (tinted[i + 2] !== pixels[i + 2]) changed++;
        if (pixels[i + 3] === 255) tones.add(tinted[i + 2]);
      }
    }
    for (const [x, y] of [[397, 173], [486, 173], [443, 218], [444, 243], [439, 310]]) {
      const pixelIndex: number = ((y - (art.offsetY ?? 0)) * width + x) * 4 + 3;
      assert.equal(pixels[pixelIndex], 0, `${id} couvre un repère du visage ou du cou`);
    }
    const alphaAt = (x: number, y: number): number => pixels[((y - (art.offsetY ?? 0)) * width + x) * 4 + 3];
    if (id.endsWith("04-velvet")) {
      assert.equal(alphaAt(442, -10), 0, "Le sommet de Velvet doit suivre le crâne de plus près");
      const originalLengths = createHash("sha256").update(pixels.subarray(168 * width * 4)).digest("hex");
      assert.equal(originalLengths, "748dd9cdebe6f00c9d12046704066f992dbb7262a06916d513f7254bbfda070b",
        "Les longueurs approuvées de Velvet doivent être conservées pixel par pixel");
    }
    if (id.endsWith("06-eden") || id.endsWith("07-raven")) {
      assert.ok(alphaAt(410, 305) >= 185 && alphaAt(474, 305) >= 185, `${id} laisse les côtés du cou vides`);
    }
    if (id.endsWith("05-nova")) {
      for (const [x, y] of [[291, 459], [295, 473], [596, 459], [592, 473]]) {
        assert.equal(alphaAt(x, y), 0, "Mèche flottante sur une épaule de Nova");
      }
      for (let y = 395; y <= 505; y++) {
        for (const start of [220, 535]) {
          let covered = 0;
          for (let x = start; x < start + 132; x++) if (alphaAt(x, y) >= 185) covered++;
          assert.ok(covered >= 8, `Mèche de Nova interrompue à la rangée ${y}`);
        }
      }
    }
    assert.ok(changed > 10_000 && tones.size > 30, id);
    assert.equal(protectedCount > 100, id.endsWith("05-nova"));
    assert.equal(pinkCount > 500 && brownCount > 2_000, id.endsWith("05-nova"));
  }
});
