/**
 * Four fitted tops cut from the canonical mannequin (see scripts/lib/second-skin.ts):
 * a sports bra, a ribbed tank, a fitted tee and a cropped long-sleeve top.
 *
 * Usage: npx tsx scripts/prepare-fitted-tops.ts
 */
import { writeFileSync } from "node:fs";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { W, H, CENTRE, seam, opaque, connected, coverUnderwear, writeGarment, type Paint } from "./lib/second-skin";

const output = "public/assets/avatar/capsule-hauts-ajustes-v1";
const torso = (x: number, y: number) => x >= seam(y) && x <= 887 - seam(y);
const arm = (x: number, y: number) => x < seam(y) || x > 887 - seam(y);
const dx = (x: number) => Math.abs(x - CENTRE);

type Design = {
  id: string;
  name: string;
  price: number;
  inside: (x: number, y: number) => boolean;
  seeds: readonly (readonly [number, number])[];
  paint: Paint;
};

const designs: readonly Design[] = [
  {
    id: "brassiere",
    name: "Brassière Studio",
    price: 550,
    // The bra itself gives the cut; a wider under-band holds a light piping.
    inside: (x, y) => torso(x, y) && y >= 536 && y <= 562,
    seeds: [[443, 540]],
    paint: {
      base: [169, 139, 214],
      detail: (_x, y) => (y >= 553 && y < 556 ? [240, 236, 246] : null),
    },
  },
  {
    id: "debardeur",
    name: "Débardeur côtelé",
    price: 450,
    inside: (x, y) => {
      if (!torso(x, y) || y > 712) return false;
      const d = dx(x);
      const top = d <= 55 ? 340 + 55 * (1 - (d / 55) ** 2) : d <= 105 ? 0 : 338 + (d - 105) * 20;
      return y >= top;
    },
    seeds: [[443, 600]],
    paint: {
      base: [236, 229, 219],
      texture: (x) => 1 + 0.07 * Math.sin((2 * Math.PI * x) / 6),
    },
  },
  {
    id: "tee",
    name: "Tee ajusté",
    price: 500,
    inside: (x, y) => {
      const d = dx(x);
      if (d <= 62 && y < 338 + 12 * (1 - (d / 62) ** 2)) return false;
      return (torso(x, y) && y <= 694) || (arm(x, y) && y <= 548);
    },
    seeds: [[443, 600], [292, 450], [595, 450]],
    paint: { base: [127, 165, 138] },
  },
  {
    id: "seconde-peau",
    name: "Seconde peau",
    price: 650,
    inside: (x, y) => {
      const d = dx(x);
      if (d <= 50 && y < 318 + 6 * (1 - (d / 50) ** 2)) return false;
      return (torso(x, y) && y <= 642) || (arm(x, y) && y <= 748);
    },
    seeds: [[443, 500], [292, 450], [595, 450]],
    paint: { base: [107, 42, 72], sheen: 36 },
  },
];

const pieces = designs.map((design) => {
  const candidate = new Uint8Array(W * H);
  for (let y = 290; y < 760; y++)
    for (let x = 140; x < W - 140; x++)
      if (opaque(x, y) && design.inside(x, y)) candidate[y * W + x] = 1;
  // Every top hides the bra completely, whatever its neckline.
  coverUnderwear(candidate, 300, 600);
  const region = connected(candidate, design.seeds);
  const result = writeGarment(output, design.id, region, design.paint);
  if (result.cloth < 25_000) throw new Error(`Haut incomplet : ${design.id}`);
  console.log(`${design.id} · ${result.cloth} pixels tissu · ${result.details} pixels de détail`);
  return {
    id: design.id, name: design.name, price: design.price,
    source: "scripts/prepare-fitted-tops.ts",
    base: result.base, crop: result.crop, tone: result.tone, details: result.hasDetails,
  };
});
writeFileSync(`${output}/index.json`, JSON.stringify({
  pattern: DOLL_PATTERN.id, bodySha256: DOLL_PATTERN.bodySha256, pieces,
}, null, 2) + "\n");
void H;
