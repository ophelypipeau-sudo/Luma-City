import { useEffect, useState } from "react";
import type { AvatarFace } from "../../../../packages/contracts/src/index";

import { kawaiiLayers, loadKawaiiLayers } from "./kawaii-face";

export const ORIGINAL_FACE: AvatarFace = {
  eyes: "original", lips: "original", skin: "original", nose: "original",
};
type RGB = readonly [number, number, number];
const eyePresets = { green: [88, 130, 73], blue: [86, 133, 175], brown: [133, 76, 44] } satisfies Record<string, RGB>;
const eyeHex = { original: "#9e8a50", green: "#588249", blue: "#5685af", brown: "#854c2c" };

export function eyeColorHex(color: AvatarFace["eyes"]) {
  return eyeHex[color as keyof typeof eyeHex] ?? color;
}

const lips = { rose: [211, 98, 134], berry: [160, 61, 107], nude: [177, 111, 88] } satisfies Record<string, RGB>;
const skin = { light: [1.06, 1.14, 1.3], tan: [.84, .79, .74], deep: [.66, .55, .48] } satisfies Record<string, RGB>;
/** Couleur moyenne de la peau dorée dessinée sur la poupée de base. */
const SKIN_BASE: RGB = [219, 141, 89];
const toHex = (rgb: readonly number[]) =>
  "#" + rgb.map((value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0")).join("");
/** Les teintes proposées en raccourci dans le salon, à côté de la roue. */
export const SKIN_TONES = [
  { label: "Doré", hex: toHex(SKIN_BASE) },
  ...(Object.entries({ Clair: skin.light, Hâlé: skin.tan, Foncé: skin.deep }) as [string, RGB][])
    .map(([label, gain]) => ({ label, hex: toHex(SKIN_BASE.map((value, channel) => value * gain[channel])) })),
] as const;
/** Couleur HEX du teint, qu'il soit une ancienne teinte nommée ou une couleur libre. */
export function skinHex(value: AvatarFace["skin"]) {
  if (value.startsWith("#")) return value.toLowerCase();
  const gain = value === "original" ? [1, 1, 1] : skin[value as keyof typeof skin];
  return toHex(SKIN_BASE.map((channel, index) => channel * gain[index]));
}
// La peau garde ses ombres et ses reflets : chaque canal est multiplié vers la couleur voulue.
function skinGainFor(value: AvatarFace["skin"]): RGB | undefined {
  if (value === "original") return undefined;
  if (!value.startsWith("#")) return skin[value as keyof typeof skin];
  const target = [1, 3, 5].map((i) => Number.parseInt(value.slice(i, i + 2), 16));
  if (target.every((channel, index) => channel === SKIN_BASE[index])) return undefined;
  return [target[0] / SKIN_BASE[0], target[1] / SKIN_BASE[1], target[2] / SKIN_BASE[2]];
}
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const oval = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  clamp((1 - Math.hypot((x - cx) / rx, (y - cy) / ry)) * 3);
const luma = ([r, g, b]: RGB) => .2126 * r + .7152 * g + .0722 * b;

// Apply colour to the painted features, keeping their original highlights and outlines.
function dye(pixels: Uint8ClampedArray, i: number, target: RGB, strength: number) {
  if (!strength) return;
  const light = luma([pixels[i], pixels[i + 1], pixels[i + 2]]) / luma(target);
  for (let channel = 0; channel < 3; channel++)
    pixels[i + channel] += (target[channel] * light - pixels[i + channel]) * strength;
}

async function paintFace(src: string, face: AvatarFace) {
  const image = new Image();
  image.src = src;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx || canvas.width !== 887 || canvas.height !== 1774) return src;
  ctx.drawImage(image, 0, 0);
  const bitmap = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = bitmap;
  const layers = await loadKawaiiLayers(kawaiiLayers(face), width, height);
  // Shared eye/brow transitions are complementary. Blend all replacement
  // patches from the same original pixel so selecting both retains the full correction.
  if (layers.length) {
    for (let i = 0; i < layers[0].skin.length; i += 4) {
      const weight = layers.reduce((sum, layer) => sum + layer.skin[i + 3], 0);
      if (!weight) continue;
      const mix = Math.min(1, weight / 255);
      for (let channel = 0; channel < 3; channel++) {
        const target = layers.reduce((sum, layer) =>
          sum + layer.skin[i + channel] * layer.skin[i + 3], 0) / weight;
        data[i + channel] = data[i + channel] * (1 - mix) + target * mix;
      }
    }
  }
  if (face.nose === "fine" || face.nose === "soft") {
    const original = data.slice();
    const spread = face.nose === "fine" ? .26 : -.17;
    for (let y = 193; y <= 234; y++) {
      for (let x = 419; x <= 467; x++) {
        const weight = oval(x, y, 443, 215, 24, 22);
        if (!weight) continue;
        const from = x + (x - 443) * spread * weight;
        const left = Math.floor(from);
        const mix = from - left;
        const to = 4 * (y * width + x);
        const start = 4 * (y * width + left);
        for (let channel = 0; channel < 3; channel++)
          data[to + channel] = original[start + channel] * (1 - mix) + original[start + channel + 4] * mix;
      }
    }
  }
  const eyeTarget = face.eyes.startsWith("#")
    ? [1, 3, 5].map((i) => Number.parseInt(face.eyes.slice(i, i + 2), 16))
    : undefined;
  const preset = eyePresets[face.eyes as keyof typeof eyePresets];
  const skinGain = skinGainFor(face.skin);
  for (let y = 0; y < (skinGain ? height : 267); y++) {
    for (let x = 0; x < width; x++) {
      const i = 4 * (y * width + x);
      if (!data[i + 3]) continue;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const iris = y >= 160 && y <= 185
        ? Math.max(oval(x, y, 401, 173, 14, 11), oval(x, y, 484, 173, 14, 11)) : 0;
      const mouth = y >= 233 && y <= 262 ? oval(x, y, 443, 245, 33, 13) : 0;
      const lipstick = (face.lips === "sorbet" ? 0 : mouth) * clamp((r - g - 28) / 15) * clamp((b - .65 * g) / 20);
      const irises = (face.eyeModel ? 0 : iris) * clamp((g - b - 8) / 23) * clamp((g - 25) / 30);
      if (skinGain) {
        const skinPixel = clamp((r - g - 14) / 24) * clamp((g - b - 9) / 21)
          * (1 - irises) * (1 - lipstick);
        for (let channel = 0; channel < 3; channel++)
          data[i + channel] *= 1 + (skinGain[channel] - 1) * skinPixel;
      }
      if (eyeTarget && irises) {
        const value = luma([r, g, b]);
        for (let c = 0; c < 3; c++) {
          const tone = value < 108
            ? eyeTarget[c] * value / 108
            : eyeTarget[c] + (255 - eyeTarget[c]) * (value - 108) / 147;
          data[i + c] += (tone - data[i + c]) * irises;
        }
      } else if (preset) {
        dye(data, i, preset, irises);
      }
      if (face.lips !== "original" && face.lips !== "sorbet") dye(data, i, lips[face.lips], lipstick);
    }
  }
  ctx.putImageData(bitmap, 0, 0);
  for (const layer of layers) ctx.drawImage(layer.art, 0, 0);
  return canvas.toDataURL();
}

const paintedFaces = new Map<string, Promise<string>>();
export function useFaceBody(src: string, face?: Readonly<AvatarFace>) {
  const customized = face && (kawaiiLayers(face).length > 0 || (Object.keys(ORIGINAL_FACE) as (keyof AvatarFace)[])
    .some((key) => face[key] !== ORIGINAL_FACE[key]));
  const key = customized ? JSON.stringify([src, face]) : "";
  const [loaded, setLoaded] = useState<{ key: string; base: string; src: string }>();
  useEffect(() => {
    if (!key || !face) return;
    if (!paintedFaces.has(key)) {
      if (paintedFaces.size >= 12) paintedFaces.delete(paintedFaces.keys().next().value!);
      paintedFaces.set(key, paintFace(src, face).catch(() => src));
    }
    let active = true;
    void paintedFaces.get(key)!.then((image) => {
      if (active) setLoaded({ key, base: src, src: image });
    });
    return () => { active = false; };
  }, [key, src, face]);
  // Pendant le calcul d'un nouveau visage, on garde le précédent plutôt que de
  // revenir une fraction de seconde au visage d'origine.
  if (!key) return src;
  return loaded?.base === src ? loaded.src : src;
}
