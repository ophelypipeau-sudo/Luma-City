import { DOLL_PATTERN } from "../../packages/domain/src/avatar-pattern";
import { measureFabricTone } from "../../packages/domain/src/atelier-color";

const [width, height] = DOLL_PATTERN.canvas;

// Measured at the toe and at 18, 35, 52 and 75 px from its centre.
// A null seam includes the visible sole in the dye and keeps only its thin
// contact edge. This avoids a band of the original color across the toe.
const seams = {
  piste: [1738, 1735, 1731, 1722, 1710],
  rafale: null,
  releve: null,
  campus: null,
  silex: null,
  dune: [1730, 1729, 1724, 1718, 1709],
  etrier: null,
  virgule: null,
  opaline: null,
  agrafe: [1742, 1741, 1739, 1732, 1723],
} as const;

export type ShoeMaterialId = keyof typeof seams;
const stations = [0, 18, 35, 52, 75] as const;
function soleLine(heights: readonly number[], distance: number) {
  for (let j = 1; j < stations.length; j++) {
    if (distance > stations[j]) continue;
    const mix = (distance - stations[j - 1]) / (stations[j] - stations[j - 1]);
    return heights[j - 1] + (heights[j] - heights[j - 1]) * mix;
  }
  return heights[heights.length - 1];
}

/** The approved drawing determines opacity. Only actual trims are excluded
 * from dye; tonal or contrasting panels of the upper are all recolorable. */
export function buildShoeMaterial(id: ShoeMaterialId, source: Uint8Array) {
  if (source.length !== width * height * 4) throw new Error("Canevas chaussures invalide");
  const main = new Uint8Array(source.length);
  const fixed = new Uint8Array(source.length);
  const hem = new Int16Array(width);
  for (let y = 1480; y < height; y++) for (let x = 250; x < 640; x++)
    if (source[(y * width + x) * 4 + 3] >= 128) hem[x] = y;

  const seam = seams[id];
  for (let y = 1480; y < height; y++) for (let x = 250; x < 640; x++) {
    const i = (y * width + x) * 4;
    const alpha = source[i + 3];
    if (!alpha) continue;
    const r = source[i] * 255 / alpha;
    const g = source[i + 1] * 255 / alpha;
    const b = source[i + 2] * 255 / alpha;
    const distance = Math.abs(x - (x < 443 ? 333 : 553));
    const outsole = seam ? y >= soleLine(seam, distance) : y >= hem[x] - 1 && hem[x] > 1700;
    const cream = r > b + 9 && g > b + 6;
    const lace =
      (id === "piste" && y >= 1610 && y <= 1677 && distance < 24 && cream) ||
      (id === "rafale" && y >= 1598 && y <= 1664 && distance < 26 && r > 166 && g > 159 && b > 150) ||
      // The last lace ends above the perforated toe panel.
      (id === "campus" && y >= 1604 && y <= 1656 && distance < 22 && cream && g > 105);
    const gold = r > g + 6 && g > b + 8 && r > 78;
    const outside = x < 310 || x > 576;
    const buckle = outside && gold && (
      (id === "etrier" && y >= 1555 && y <= 1599) ||
      (id === "opaline" && y >= 1596 && y <= 1636) ||
      (id === "agrafe" && y >= 1615 && y <= 1650)
    );
    const isFixed = outsole || lace || buckle;
    (isFixed ? fixed : main).set([255, 255, 255, isFixed ? alpha : 255], i);
  }
  const tone = measureFabricTone(source, main);
  if (!tone) throw new Error("Matière introuvable : " + id);
  return {
    main, fixed,
    tone: { ...tone, depth: 0.35, sheen: ["silex", "dune", "etrier"].includes(id) ? 0.21 : 0.18 },
  };
}
