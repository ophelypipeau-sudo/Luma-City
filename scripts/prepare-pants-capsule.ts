import { removeWhiteMatte } from "./lib/asset-edges";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { pngPixels } from "../apps/server/src/atelier-images";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { measureFabricTone } from "../packages/domain/src/atelier-color";
import { rgbaPng } from "./lib/png-rgba";

const [W, H] = DOLL_PATTERN.canvas;
const sourceV2 = "docs/capsule-pantalons-v2/sources/";
const sourceV3 = "docs/capsule-pantalons-v3/retouches/";
const output = "public/assets/avatar/capsule-pantalons-v1";
type Guide = readonly (readonly [x: number, y: number])[];
type Piece = {
  id: string;
  name: string;
  file: string;
  price: number;
  base: string;
  waist: Guide;
  hems: readonly [Guide, Guide];
  coverage: number;
  // Protected spots are native coordinates of buttons, snaps and rivets.
  hardware?: readonly (readonly [
    x: number,
    y: number,
    rx: number,
    ry: number,
  ])[];
  goldThread?: boolean;
};
const pieces: readonly Piece[] = [
  {
    id: "dalle",
    name: "Dalle",
    file: sourceV2 + "01-dalle.png",
    price: 850,
    base: "#70869a",
    waist: [
      [318, 680],
      [348, 689],
      [390, 699],
      [445, 704],
      [495, 699],
      [540, 689],
      [562, 682],
    ],
    hems: [
      [
        [185, 1660],
        [204, 1676],
        [225, 1681],
        [246, 1688],
        [266, 1696],
        [289, 1692],
        [313, 1685],
        [333, 1683],
        [355, 1685],
        [375, 1691],
        [387, 1696],
        [395, 1689],
        [409, 1669],
        [426, 1663],
      ],
      [
        [447, 1663],
        [466, 1678],
        [482, 1693],
        [491, 1696],
        [512, 1687],
        [534, 1684],
        [552, 1683],
        [575, 1686],
        [597, 1693],
        [624, 1695],
        [647, 1682],
        [671, 1678],
        [688, 1660],
        [707, 1650],
      ],
    ],
    coverage: 1665,
    goldThread: true,
    hardware: [
      [450, 718, 12, 12],
      [369, 735, 7, 8],
      [274, 785, 6, 8],
      [514, 735, 6, 7],
      [610, 785, 6, 8],
    ],
  },
  {
    id: "rocade",
    name: "Rocade",
    file: sourceV3 + "02-rocade-r2.png",
    price: 900,
    base: "#565435",
    waist: [
      [320, 662],
      [350, 671],
      [390, 677],
      [445, 679],
      [495, 676],
      [535, 669],
      [553, 662],
    ],
    hems: [
      [
        [282, 1633],
        [333, 1635],
        [385, 1633],
      ],
      [
        [503, 1633],
        [553, 1635],
        [603, 1633],
      ],
    ],
    coverage: 1622,
    hardware: [
      [443, 703, 23, 8],
      [427, 694, 7, 7],
      [461, 694, 7, 7],
      [414, 838, 7, 15],
      [472, 838, 7, 15],
      [294, 949, 9, 10],
      [590, 949, 9, 10],
    ],
  },
  {
    id: "granit",
    name: "Granit",
    file: sourceV3 + "03-granit-r2.png",
    price: 850,
    base: "#454241",
    waist: [
      [320, 671],
      [352, 679],
      [390, 685],
      [445, 687],
      [495, 685],
      [535, 679],
      [560, 671],
    ],
    hems: [
      [
        [224, 1662],
        [272, 1670],
        [333, 1676],
        [386, 1673],
        [429, 1663],
      ],
      [
        [472, 1663],
        [511, 1671],
        [554, 1676],
        [605, 1672],
        [652, 1663],
      ],
    ],
    coverage: 1654,
    hardware: [[451, 707, 11, 12]],
  },
  {
    id: "ruban",
    name: "Ruban",
    file: sourceV2 + "04-ruban.png",
    price: 850,
    base: "#571e30",
    waist: [
      [303, 696],
      [346, 705],
      [390, 711],
      [445, 713],
      [495, 710],
      [540, 703],
      [575, 695],
    ],
    hems: [
      [
        [200, 1698],
        [275, 1703],
        [301, 1696],
        [333, 1695],
        [365, 1700],
        [421, 1700],
      ],
      [
        [460, 1700],
        [519, 1700],
        [552, 1695],
        [584, 1696],
        [611, 1703],
        [682, 1698],
      ],
    ],
    coverage: 1671,
    hardware: [
      [426, 729, 7, 7],
      [459, 729, 7, 7],
      [428, 840, 5, 14],
      [459, 849, 5, 14],
    ],
  },
  {
    id: "velin",
    name: "Vélin",
    file: sourceV3 + "05-velin.png",
    price: 900,
    base: "#66381d",
    waist: [
      [314, 649],
      [350, 659],
      [390, 665],
      [445, 671],
      [495, 666],
      [540, 656],
      [565, 650],
    ],
    hems: [
      [
        [201, 1666],
        [268, 1673],
        [333, 1681],
        [386, 1682],
        [434, 1673],
      ],
      [
        [469, 1673],
        [515, 1682],
        [553, 1682],
        [610, 1679],
        [671, 1670],
      ],
    ],
    coverage: 1653,
    hardware: [[455, 680, 12, 12]],
  },
  {
    id: "ligne",
    name: "Ligne",
    file: sourceV2 + "06-ligne.png",
    price: 850,
    base: "#1a2439",
    waist: [
      [320, 672],
      [351, 679],
      [390, 684],
      [445, 687],
      [495, 684],
      [535, 678],
      [552, 673],
    ],
    hems: [
      [
        [250, 1689],
        [289, 1696],
        [333, 1697],
        [369, 1697],
        [412, 1690],
      ],
      [
        [484, 1692],
        [519, 1697],
        [552, 1697],
        [596, 1697],
        [635, 1691],
      ],
    ],
    coverage: 1675,
  },
  {
    id: "indigo",
    name: "Indigo",
    file: sourceV2 + "07-indigo.png",
    price: 800,
    base: "#242837",
    waist: [
      [322, 631],
      [351, 638],
      [390, 643],
      [445, 645],
      [495, 643],
      [536, 638],
      [550, 633],
    ],
    hems: [
      [
        [258, 1675],
        [289, 1679],
        [333, 1681],
        [380, 1678],
        [407, 1675],
      ],
      [
        [484, 1675],
        [521, 1678],
        [552, 1681],
        [596, 1679],
        [629, 1675],
      ],
    ],
    coverage: 1660,
    goldThread: true,
  },
  {
    id: "calcaire",
    name: "Calcaire",
    file: sourceV2 + "08-calcaire.png",
    price: 800,
    base: "#dfc8a1",
    waist: [
      [317, 675],
      [353, 685],
      [390, 692],
      [445, 695],
      [495, 691],
      [537, 685],
      [560, 675],
    ],
    hems: [
      [
        [276, 1632],
        [309, 1642],
        [335, 1644],
        [371, 1640],
        [392, 1632],
      ],
      [
        [492, 1632],
        [517, 1641],
        [553, 1644],
        [579, 1641],
        [608, 1633],
      ],
    ],
    coverage: 1625,
    hardware: [[454, 714, 13, 13]],
  },
  {
    id: "sillon",
    name: "Sillon",
    file: sourceV2 + "09-sillon.png",
    price: 900,
    base: "#969394",
    waist: [
      [321, 637],
      [353, 645],
      [391, 651],
      [444, 654],
      [495, 651],
      [537, 645],
      [558, 638],
    ],
    hems: [
      [
        [224, 1688],
        [273, 1694],
        [334, 1696],
        [380, 1696],
        [421, 1691],
      ],
      [
        [471, 1691],
        [513, 1696],
        [554, 1696],
        [607, 1695],
        [663, 1687],
      ],
    ],
    coverage: 1676,
  },
  {
    id: "fuseau",
    name: "Fuseau",
    file: sourceV2 + "10-fuseau.png",
    price: 800,
    base: "#252326",
    waist: [
      [322, 634],
      [354, 641],
      [391, 646],
      [445, 647],
      [495, 645],
      [535, 641],
      [555, 634],
    ],
    hems: [
      [
        [270, 1503],
        [300, 1513],
        [329, 1519],
        [357, 1517],
        [389, 1507],
      ],
      [
        [493, 1505],
        [526, 1516],
        [552, 1519],
        [578, 1514],
        [615, 1504],
      ],
    ],
    coverage: 1503,
  },
];

function curve(points: Guide, x: number) {
  const next = points.findIndex(([px]) => px >= x);
  if (next === -1) return points.at(-1)![1];
  if (next === 0) return points[0][1];
  const [ax, ay] = points[next - 1],
    [bx, by] = points[next];
  return ay + ((by - ay) * (x - ax)) / (bx - ax);
}

const bodyFile = "public/assets/avatar/fashion-v2/body-user.png";
const body = readFileSync(bodyFile);
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Le mannequin ne correspond pas au patron natif.");
const canonical = pngPixels(body).pixels;
const dalleRetouchPath = "docs/capsule-pantalons-v4/dalle-poches-imagegen.png";
const dalleRetouch = pngPixels(readFileSync(dalleRetouchPath));
if (dalleRetouch.width !== W || dalleRetouch.height !== H)
  throw new Error("La retouche de Dalle doit conserver son cadrage natif.");
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const light = (p: Uint8Array, i: number) =>
  0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];

mkdirSync(output, { recursive: true });
const manifest = pieces.map((piece) => {
  const { width, height, pixels: src } = pngPixels(readFileSync(piece.file));
  if (width !== W || height !== H)
    throw new Error("Canevas inattendu : " + piece.file);
  const art = new Uint8Array(src.length),
    mask = new Uint8Array(src.length);
  const fixed = new Uint8Array(src.length),
    coverage = new Uint8Array(src.length);
  const waist = new Float32Array(W),
    hem = new Float32Array(W);

  for (let x = 145; x < 745; x++) {
    const top = curve(piece.waist, x);
    // Follow the actual painted skin-to-waistband transition at native scale.
    let best = 0,
      edge = top;
    if (x >= piece.waist[0][0] - 8 && x <= piece.waist.at(-1)![0] + 8) {
      for (let y = Math.round(top) - 15; y <= top + 15; y++) {
        const a = ((y - 2) * W + x) * 4,
          b = ((y + 2) * W + x) * 4;
        const skin = src[a] - src[a + 2];
        const score =
          Math.abs(light(src, a) - light(src, b)) +
          Math.max(0, skin - (src[b] - src[b + 2])) * 0.7 -
          Math.abs(y - top) * 0.65;
        if (skin > 35 && score > best) {
          best = score;
          edge = y - 0.2;
        }
      }
    }
    waist[x] = edge;
    hem[x] = curve(piece.hems[x < 444 ? 0 : 1], x);
  }
  // Suppress isolated one-column jumps due to a seam crossing the waistband.
  const sorted = (a: number[]) => a.sort((x, y) => x - y);
  const rawWaist = waist.slice();
  for (let x = 147; x < 743; x++)
    waist[x] = sorted([...rawWaist.slice(x - 2, x + 3)])[2];
  const alphaMap = new Uint8Array(W * H);
  for (let y = 610; y < 1730; y++) {
    const bg = (y * W + 32) * 4;
    for (let x = 145; x < 745; x++) {
      const j = y * W + x,
        i = j * 4,
        r = src[i],
        g = src[i + 1],
        b = src[i + 2];
      const delta = Math.max(
        Math.abs(r - src[bg]),
        Math.abs(g - src[bg + 1]),
        Math.abs(b - src[bg + 2]),
      );
      const orange = r - g > 34 && g - b > 27 && r > 154;
      const cuff =
        ["rocade", "calcaire", "fuseau"].includes(piece.id) && y > hem[x] - 18;
      const boundary = Math.min(
        clamp(y + 0.5 - waist[x]),
        clamp(hem[x] - y + 0.5),
      );
      if (!(orange && (y < waist[x] + 9 || cuff)))
        alphaMap[j] = Math.round(255 * boundary * clamp((delta - 11) / 19));
    }
  }
  const state = new Uint8Array(W * H),
    queue = new Uint32Array(W * H);
  function flood(seed: number, type: 1 | 2) {
    let head = 0,
      tail = 0;
    const visit = (p: number) => {
      if (state[p] || (type === 1 && !alphaMap[p])) return;
      state[p] = type;
      queue[tail++] = p;
    };
    visit(seed);
    while (head < tail) {
      const p = queue[head++],
        x = p % W;
      if (x > 0) visit(p - 1);
      if (x < W - 1) visit(p + 1);
      if (p >= W) visit(p - W);
      if (p < W * (H - 1)) visit(p + W);
    }
  }
  // Remove disconnected arms and background particles, then restore all
  // enclosed highlights. A light fold is cloth even if its RGB matches the set.
  flood(840 * W + 347, 1);
  flood(0, 2);
  let minX = W,
    maxX = 0,
    minY = H,
    maxY = 0,
    cloth = 0,
    protectedCount = 0;
  for (let y = 610; y < 1730; y++) {
    for (let x = 145; x < 745; x++) {
      const j = y * W + x,
        i = j * 4;
      let r = src[i], g = src[i + 1], b = src[i + 2];
      const edge =
        state[j] === 1 &&
        (state[j - 1] === 2 ||
          state[j + 1] === 2 ||
          state[j - W] === 2 ||
          state[j + W] === 2);
      const alpha = state[j] === 2 ? 0 : edge ? alphaMap[j] : 255;
      if (
        canonical[i + 3] &&
        y >= 790 &&
        y < piece.coverage &&
        x >= 248 &&
        x <= 639
      ) {
        coverage[i + 3] = 255;
      }
      if (!alpha) continue;
      // Keep the approved illustration and its exact alpha outside the small
      // coin-pocket patch; only the local ImageGen denim repaint is blended in.
      if (piece.id === "dalle" && alpha === 255 && x > 276 && x < 360 && y > 722 && y < 794) {
        const t = clamp(Math.min(x - 276, 360 - x, y - 722, 794 - y) / 8);
        const weight = t * t * (3 - 2 * t);
        const patch = dalleRetouch.pixels;
        r = Math.round(r + (patch[i] - r) * weight);
        g = Math.round(g + (patch[i + 1] - g) * weight);
        b = Math.round(b + (patch[i + 2] - b) * weight);
      }
      art.set([r, g, b, alpha], i);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      const ellipse = piece.hardware?.some(
        ([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1,
      );
      const golden =
        piece.goldThread && y < 1060 && r - g > 10 && g - b > 6 && r > 80;
      // Cream piping belongs to Ruban, but its underlying bordeaux jersey dyes.
      const stripe =
        piece.id === "ruban" &&
        (x < 330 || x > 553) &&
        y > 722 &&
        r > 106 &&
        g > 76 &&
        b > 51 &&
        r - g < 48 &&
        g - b > 7;
      if (ellipse || golden || stripe) {
        fixed.set([255, 255, 255, alpha], i);
        protectedCount++;
      } else {
        // Mask opacity is dye strength. Fully dye the existing edge colour,
        // including seams drawn in the same cloth, without thickening alpha.
        mask.set([255, 255, 255, 255], i);
        cloth++;
      }
    }
  }
  if (cloth < 90_000 || maxY < 1460 || minY > 755)
    throw new Error("Détourage incomplet : " + piece.id);
  const save = (suffix: string, data: Uint8Array) =>
    writeFileSync(`${output}/${piece.id}${suffix}.png`, rgbaPng(W, H, suffix ? data : removeWhiteMatte(W, H, data).pixels));
  const toneArt = art.slice();
  for (let i = 0; i < toneArt.length; i += 4) {
    const a = toneArt[i + 3] / 255;
    toneArt[i] = Math.round(toneArt[i] * a);
    toneArt[i + 1] = Math.round(toneArt[i + 1] * a);
    toneArt[i + 2] = Math.round(toneArt[i + 2] * a);
  }
  const measured = measureFabricTone(toneArt, mask);
  if (!measured) throw new Error("Matière introuvable : " + piece.id);
  save("", art);
  save("-mask", mask);
  save("-protected", fixed);
  save("-coverage", coverage);
  console.log(
    `${piece.id} · ${cloth} pixels tissu · ${protectedCount} détails · ${minX},${minY} → ${maxX},${maxY}`,
  );
  return {
    id: piece.id,
    name: piece.name,
    source: piece.file,
    ...(piece.id === "dalle" ? { retouch: dalleRetouchPath } : {}),
    price: piece.price,
    base: piece.base,
    crop: [minX - 4, minY - 4, maxX - minX + 9, maxY - minY + 9],
    tone: {
      ...measured,
      depth: 0.36,
      sheen: piece.id === "velin" ? 0.25 : 0.18,
    },
  };
});
writeFileSync(
  `${output}/index.json`,
  JSON.stringify(
    {
      pattern: DOLL_PATTERN.id,
      bodySha256: DOLL_PATTERN.bodySha256,
      pieces: manifest,
    },
    null,
    2,
  ) + "\n",
);
