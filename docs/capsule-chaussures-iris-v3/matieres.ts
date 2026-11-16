import { DOLL_PATTERN } from "../../packages/domain/src/avatar-pattern";
import { measureFabricTone } from "../../packages/domain/src/atelier-color";

const [width, height] = DOLL_PATTERN.canvas;

const finishes = {
  "01-venus": { base: "#713d57", sole: 1750 },
  "02-pixel": { base: "#354f57", sole: 1717, detail: { label: "Empiècements cuir", base: "#8fb4bd" } },
  "03-nox": { base: "#302e31", sole: 1751 },
  "04-alta": { base: "#583644", sole: 1754 },
  "05-cherry": { base: "#a51c35", sole: 1726 },
  "06-sirocco": { base: "#94522e", sole: 1750 },
  "07-astrid": { base: "#252847", sole: 1749 },
  "08-orbit": { base: "#e4d8cb", sole: 1749, detail: { label: "Empiècements indigo", base: "#3b4268" } },
  "09-vega": { base: "#3d2c3d", sole: 1754 },
  "10-ether": { base: "#b0a7ce", sole: 1727 },
} satisfies Record<string, { base: string; sole: number; detail?: { label: string; base: string } }>;

type ShoeId = keyof typeof finishes;

// Coordinates follow the approved frontal uppers. The tint uses the actual
// painted highlights and shadows. The fixed mask isolates the visible trims.
export function shoeMaterials(id: ShoeId, art: Uint8Array) {
  const finish = finishes[id];
  const detailSpec = "detail" in finish ? finish.detail : undefined;
  const main = new Uint8Array(art.length), detail = new Uint8Array(art.length),
    fixed = new Uint8Array(art.length), weighted = new Uint8Array(art.length);
  const bottom = new Uint16Array(width);

  for (let y = 1620; y < height; y++) for (let x = 246; x < 640; x++)
    if (art[(y * width + x) * 4 + 3] >= 125) bottom[x] = y;

  for (let y = 980; y < height; y++) for (let x = 246; x < 640; x++) {
    const i = (y * width + x) * 4, opacity = art[i + 3];
    if (!opacity) continue;
    const [r, g, b] = art.subarray(i, i + 3);
    const distance = Math.abs(x - (x < 443 ? DOLL_PATTERN.ankles[0][0] : DOLL_PATTERN.ankles[1][0]));
    const span = Math.max(r, g, b) - Math.min(r, g, b);
    const luma = (r + g + b) / 3;
    const sole = y >= finish.sole - (distance / 52) ** 2 * 10 ||
      (y > 1690 && bottom[x] > 1700 && y >= bottom[x] - 2);
    const champagne = r > 62 && r > g + 6 && g > b + 7;
    const paleMetal = luma > 75 && span < 31;

    let protectedTrim = false, secondaryPanel = false;
    switch (id) {
      case "01-venus":
        protectedTrim = y >= 1633 && y <= 1648 && distance > 22 && champagne;
        break;
      case "02-pixel":
        protectedTrim = (y >= 1605 && y <= 1665 && distance < 30 && span < 30) ||
          (y >= 1573 && y < 1717 && luma > 129 && span < 22);
        secondaryPanel = b > r + 20 && g > r + 17 && luma > 91 &&
          y >= 1600 && y < 1699 && distance > 17;
        break;
      case "03-nox":
        protectedTrim = y >= 1517 && y < 1618 && distance > 11 &&
          (luma > 114 || champagne) && span < 70;
        break;
      case "05-cherry":
        protectedTrim = y >= 1591 && y < 1654 && distance > 20 && paleMetal;
        break;
      case "06-sirocco":
        protectedTrim = y < 1574 && luma > 109 && r - g < 62 && g - b < 47 &&
          g > 83 && b > 56;
        break;
      case "07-astrid":
        protectedTrim = ((y < 1579 && distance > 26) ||
          (y >= 1702 && y <= 1723 && (distance < 10 || distance > 43))) &&
          (champagne || paleMetal);
        break;
      case "08-orbit": {
        const tongueWidth = y < 1626 ? 27 : y < 1688 ? 29 : 0;
        protectedTrim = distance < tongueWidth && span < 41 && (r >= b - 9 || luma > 135);
        secondaryPanel = b > r + 8 && b > g + 6 && luma < 155;
        break;
      }
      case "10-ether":
        protectedTrim = y >= 1569 && y <= 1683 && distance > 21 &&
          span < 34 && b <= r + 12;
        break;
    }
    (sole || protectedTrim ? fixed : secondaryPanel ? detail : main).fill(255, i, i + 4);
    weighted[i] = Math.round(r * opacity / 255);
    weighted[i + 1] = Math.round(g * opacity / 255);
    weighted[i + 2] = Math.round(b * opacity / 255);
    weighted[i + 3] = opacity;
  }

  const tone = measureFabricTone(weighted, main);
  const detailTone = detailSpec && measureFabricTone(weighted, detail);
  if (!tone || (detailSpec && !detailTone)) throw Error("Masque de matière incomplet : " + id);
  return {
    main, detail, fixed, base: finish.base,
    tone: { ...tone, depth: 0.38, sheen: 0.18 },
    secondary: detailSpec && detailTone ? { ...detailSpec, tone: { ...detailTone, depth: 0.38, sheen: 0.18 } } : undefined,
  };
}
