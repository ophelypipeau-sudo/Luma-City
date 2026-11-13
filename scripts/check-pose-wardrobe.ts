import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { avatarCatalogSnapshot } from "../apps/web/src/avatar/catalog";
import { assertPoseProfile } from "../apps/web/src/avatar/pose-wardrobe";
import { starterPieces } from "../packages/contracts/src/player-account";

const catalog = avatarCatalogSnapshot();
for (const [slot, ids] of Object.entries(starterPieces)) {
  for (const id of ids) {
    if (!catalog.some((piece) => piece.id === id && piece.slot === slot))
      throw new Error(`Article de départ absent de la boutique (${slot}) : ${id}`);
  }
}

const root = resolve("public") + sep,
  checked = new Set<string>();
for (const piece of catalog) {
  assertPoseProfile(piece, true);
  const imageUrls =
    piece.art.kind === "image"
      ? ([
          piece.art.front,
          piece.art.back,
          piece.art.colorMasks?.main,
          piece.art.colorMasks?.mainLight,
          piece.art.colorMasks?.protected,
          piece.art.colorMasks?.detail,
          piece.bodyMask,
          ...Object.values(piece.fittingBody ?? {}),
          piece.fittingHipHand,
          piece.handCarry?.hand,
          piece.handCarry?.shoulder,
          piece.handCarry?.shoulderMask,
        ].filter(Boolean) as string[])
      : [];
  for (const url of imageUrls) {
    if (checked.has(url)) continue;
    const path = resolve("public", url.replace(/^\//, ""));
    if (!path.startsWith(root))
      throw new Error(`Asset hors du projet : ${url}`);
    const source =
      piece.art.kind === "image" &&
      [
        piece.art.front,
        piece.art.back,
        piece.art.colorMasks?.main,
        piece.art.colorMasks?.mainLight,
        piece.art.colorMasks?.protected,
        piece.art.colorMasks?.detail,
      ].includes(url)
        ? piece.art.source
        : undefined;
    const bytes = readFileSync(path);
    if (
      bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a" ||
      bytes.readUInt32BE(16) !== (source?.width ?? 887) ||
      bytes.readUInt32BE(20) !== (source?.height ?? 1774)
    )
      throw new Error(`Canevas incorrect : ${url}`);
    checked.add(url);
  }
  for (const fit of Object.values(piece.poseProfile!.fits))
    for (const url of fit.sleeves
      ? ([
          fit.sleeves.front,
          fit.sleeves.main,
          fit.sleeves.mainLight,
          fit.sleeves.protected,
          fit.sleeves.detail,
        ].filter(Boolean) as string[])
      : []) {
      if (checked.has(url)) continue;
      const path = resolve("public", url.replace(/^\//, ""));
      if (!path.startsWith(root))
        throw new Error(`Asset hors du projet : ${url}`);
      const bytes = readFileSync(path);
      if (
        bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a" ||
        bytes.readUInt32BE(16) !== 887 ||
        bytes.readUInt32BE(20) !== 1774
      )
        throw new Error(
          `Canevas de pose incorrect (887 × 1774 requis) : ${url}`,
        );
      checked.add(url);
    }
}
console.log(
  `Dressing : ${avatarCatalogSnapshot().length} pièces contrôlées selon leurs poses disponibles · ${checked.size} calques/masques calibrés.`,
);
