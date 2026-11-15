import type { AvatarFace } from "../../../../packages/contracts/src/index";

const root = "/assets/avatar/kawaii-c";
const images = new Map<string, Promise<HTMLImageElement>>();
function load(name: string) {
  if (!images.has(name)) {
    const image = new Image();
    image.src = `${root}/${name}.png`;
    images.set(name, image.decode().then(() => image).catch((error) => {
      images.delete(name);
      throw error;
    }));
  }
  return images.get(name)!;
}

export function kawaiiLayers(face: AvatarFace) {
  return [
    ...(face.brows ? [{ name: "brows", hex: face.browColor }] : []),
    ...(face.nose === "confettis" ? [{ name: "nose", hex: undefined }] : []),
    ...(face.eyeModel ? [{ name: "eyes", hex: face.eyes.startsWith("#") ? face.eyes : undefined }] : []),
    ...(face.lips === "sorbet" ? [{ name: "lips", hex: face.lipColor }] : []),
  ];
}

export async function loadKawaiiLayers(
  layers: ReturnType<typeof kawaiiLayers>,
  width: number,
  height: number,
) {
  return Promise.all(layers.map(async ({ name, hex }) => {
    const [patch, art, mask] = await Promise.all([
      load(`${name}-skin`), load(name), hex ? load(`${name}-color`) : undefined,
    ]);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    const faceHeight = 280;
    ctx.drawImage(patch, 0, 0);
    const skin = ctx.getImageData(0, 0, width, faceHeight).data;
    if (!hex || !mask) return { skin, art };
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(mask, 0, 0);
    const weights = ctx.getImageData(0, 0, width, faceHeight).data;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(art, 0, 0);
    const tinted = ctx.getImageData(0, 0, width, faceHeight);
    const target = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    for (let i = 0; i < weights.length; i += 4) {
      const weight = weights[i + 3] / 255;
      if (!weight || !tinted.data[i + 3]) continue;
      const light = .2126 * tinted.data[i] + .7152 * tinted.data[i + 1] + .0722 * tinted.data[i + 2];
      for (let c = 0; c < 3; c++) {
        const tone = light < 115 ? target[c] * light / 115 :
          target[c] + (255 - target[c]) * (light - 115) / 140;
        tinted.data[i + c] += (tone - tinted.data[i + c]) * weight;
      }
    }
    ctx.putImageData(tinted, 0, 0);
    return { skin, art: canvas };
  }));
}
