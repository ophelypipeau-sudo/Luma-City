import type { FabricTone } from "../../contracts/src/avatar-material";
export type { FabricTone } from "../../contracts/src/avatar-material";

/** Dye response in display space: dark colours retain highlights; white retains
 * midtone shading instead of clipping every light fold to flat white. */
export function materialChannel(
  channel: number,
  light: number,
  reference: number,
  contrast = 1,
) {
  const ratio = light / Math.max(16, reference),
    shade = contrast === 1 ? ratio : 1 + (ratio - 1) * contrast,
    base = Math.max(10, channel * 0.92);
  if (shade <= 1) return base * Math.pow(Math.max(0, shade), 0.85);
  const peak = base + (255 - base) * (0.12 + (0.88 * channel) / 255);
  return base + (peak - base) * (1 - Math.exp(-(shade - 1) * 1.5));
}

/** Decoder input is premultiplied RGBA; skip weak edges and protected details. */
export function measureFabricTone(
  source: Uint8Array,
  mask: Uint8Array,
): FabricTone | undefined {
  const histogram = new Uint32Array(256);
  let count = 0;
  for (let i = 0; i < source.length; i += 4) {
    const alpha = source[i + 3];
    if (alpha < 48 || mask[i + 3] < 128) continue;
    const light =
      0.2126 * source[i] + 0.7152 * source[i + 1] + 0.0722 * source[i + 2];
    histogram[Math.min(255, Math.round((255 * light) / alpha))]++;
    count++;
  }
  if (!count) return;
  const percentile = (fraction: number) => {
    const rank = Math.max(1, Math.ceil(count * fraction));
    let cumulative = 0;
    return histogram.findIndex((n) => (cumulative += n) >= rank);
  };
  const middle = Math.max(2, Math.min(253, percentile(0.5)));
  return {
    shadow: Math.min(percentile(0.06), Math.max(0, middle - 6)),
    middle,
    highlight: Math.max(percentile(0.97), Math.min(255, middle + 9)),
    depth: 0.28,
    sheen: 0.18,
  };
}

export function fabricDyeTable(
  channel: number,
  tone: FabricTone,
): Float64Array {
  const base = 8 + (channel * 226) / 255;
  const lit = Math.min(251, base * 1.08 + (255 - base) * tone.sheen);
  return Float64Array.from({ length: 256 }, (_, source) => {
    if (source <= tone.middle) {
      const distance = (tone.middle - source) / (tone.middle - tone.shadow);
      const under = Math.min(1, distance);
      const toe = Math.max(0, distance - 1);
      return base * (1 - tone.depth * under - 0.18 * (toe / (1 + toe)));
    }
    const distance = (source - tone.middle) / (tone.highlight - tone.middle);
    const over = Math.max(0, distance - 1);
    return Math.min(
      253,
      base + (lit - base) * (Math.min(1, distance) + 0.3 * (over / (1 + over))),
    );
  });
}

function sampleDyeTable(table: Float64Array, light: number) {
  const lower = Math.min(255, Math.floor(light));
  const upper = Math.min(255, lower + 1);
  return table[lower] + (table[upper] - table[lower]) * (light - lower);
}

export function paintColorRegions(
  pixels: Uint8ClampedArray,
  main: Uint8ClampedArray | undefined,
  detail: Uint8ClampedArray | undefined,
  colors: {
    main?: string;
    detail?: string;
    mainBase: string;
    detailBase: string;
    shading?: "material";
    mainContrast?: number;
    mainTone?: FabricTone;
    mainLightPixels?: Uint8ClampedArray;
    detailTone?: FabricTone;
  },
) {
  const rgb = (hex: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error("Couleur invalide");
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  };
  const luma = (c: number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const one =
      colors.main && colors.main.toLowerCase() !== colors.mainBase.toLowerCase()
        ? rgb(colors.main)
        : undefined,
    two =
      colors.detail &&
      colors.detail.toLowerCase() !== colors.detailBase.toLowerCase()
        ? rgb(colors.detail)
        : undefined;
  const ref1 = Math.max(16, luma(rgb(colors.mainBase))),
    ref2 = Math.max(16, luma(rgb(colors.detailBase)));
  const dye =
    one && colors.mainTone && colors.shading === "material"
      ? one.map((channel) => fabricDyeTable(channel, colors.mainTone!))
      : undefined;
  const detailDye =
    two && colors.detailTone && colors.shading === "material"
      ? two.map((channel) => fabricDyeTable(channel, colors.detailTone!))
      : undefined;
  if (!one && !two) return pixels;
  for (let p = 0; p < pixels.length; p += 4) {
    if (!pixels[p + 3]) continue;
    let a = one && main ? main[p + 3] / 255 : 0,
      b = two && detail ? detail[p + 3] / 255 : 0;
    const sum = a + b;
    if (sum > 1) {
      a /= sum;
      b /= sum;
    }
    if (!sum) continue;
    const light = luma([pixels[p], pixels[p + 1], pixels[p + 2]]),
      mainLight = colors.mainLightPixels?.[p + 3] ? colors.mainLightPixels[p] : light,
      s1 = Math.min(1.35, light / ref1),
      s2 = Math.min(1.35, light / ref2);
    for (let c = 0; c < 3; c++)
      pixels[p + c] = Math.round(
        pixels[p + c] * (1 - a - b) +
          (one
            ? (colors.shading === "material"
                ? dye
                  ? sampleDyeTable(dye[c], mainLight)
                  : materialChannel(one[c], light, ref1, colors.mainContrast)
                : Math.min(255, one[c] * s1)) * a
            : 0) +
          (two
            ? (colors.shading === "material"
                ? detailDye
                  ? sampleDyeTable(detailDye[c], light)
                  : materialChannel(two[c], light, ref2)
                : Math.min(255, two[c] * s2)) * b
            : 0),
      );
  }
  return pixels;
}
