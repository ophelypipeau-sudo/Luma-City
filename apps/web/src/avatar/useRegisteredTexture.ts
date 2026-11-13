import { useEffect, useState } from "react";
import type { Garment, GarmentPass } from "./catalog";
import { paintColorRegions } from "../../../../packages/domain/src/atelier-color";
type ImageArt = Extract<Garment["art"], { kind: "image" }>;
const W = 887,
  H = 1774;
const cache = new Map<string, Promise<string>>();
const imageCache = new Map<string, Promise<HTMLImageElement>>();
function load(src: string) {
  const cached = imageCache.get(src);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (error) => {
      imageCache.delete(src);
      reject(error);
    };
    image.src = src;
  });
  imageCache.set(src, pending);
  if (imageCache.size > 40) imageCache.delete(imageCache.keys().next().value!);
  return pending;
}
/** Rasterize the UV registration once, at native resolution. Every output row
 * is painted exactly once; adjacent SVG slices must not blend over each other. */
async function register(
  art: ImageArt,
  pass: GarmentPass,
  color?: string,
  detailColor?: string,
) {
  const image = await load(art.front);
  const source = document.createElement("canvas");
  source.width = W;
  source.height = H;
  const ctx = source.getContext("2d")!;
  const rect = {
    x: art.source?.x ?? 0,
    y: art.source?.y ?? 0,
    width: art.source?.width ?? W,
    height: art.source?.height ?? H,
  };
  if (pass === "back" && art.back) {
    ctx.drawImage(
      await load(art.back),
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    );
  } else {
    if (pass === "all" && art.back)
      ctx.drawImage(
        await load(art.back),
        rect.x,
        rect.y,
        rect.width,
        rect.height,
      );
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  }
  if (art.colorMasks && (color || detailColor)) {
    const mask = async (url?: string) => {
      if (!url) return undefined;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const paint = c.getContext("2d")!;
      paint.drawImage(await load(url), rect.x, rect.y, rect.width, rect.height);
      return paint.getImageData(0, 0, W, H).data;
    };
    const [main, detail, mainLightPixels] = await Promise.all([
      mask(art.colorMasks.main),
      mask(art.colorMasks.detail),
      mask(color ? art.colorMasks.mainLight : undefined),
    ]);
    const pixels = ctx.getImageData(0, 0, W, H);
    paintColorRegions(pixels.data, main, detail, {
      main: color,
      detail: detailColor,
      mainBase: art.colorMasks.mainBase,
      detailBase: art.colorMasks.detailBase,
      shading: art.colorMasks.shading,
      mainContrast: art.colorMasks.mainContrast,
      mainTone: art.colorMasks.mainTone,
      mainLightPixels,
      detailTone: art.colorMasks.detailTone,
    });
    ctx.putImageData(pixels, 0, 0);
  }
  if (!(pass === "back" && art.back)) {
    if (art.backRegion && pass !== "all") {
      if (pass === "front") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fill(new Path2D(art.backRegion));
      } else {
        const keep = document.createElement("canvas");
        keep.width = W;
        keep.height = H;
        const k = keep.getContext("2d")!;
        k.fill(new Path2D(art.backRegion));
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(keep, 0, 0);
      }
    } else if (pass === "back") ctx.clearRect(0, 0, W, H);
  }
  if (!art.bands && !art.widthStops && (art.scaleX ?? 1) === 1)
    return source.toDataURL("image/png");
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const paint = out.getContext("2d")!;
  paint.imageSmoothingEnabled = true;
  paint.imageSmoothingQuality = "high";
  const bands = art.bands ?? [{ sourceY: 0, sourceHeight: H, y: 0, height: H }];
  for (let y = 0; y < H; y++) {
    const band = bands.find((b) => y + 0.5 >= b.y && y + 0.5 < b.y + b.height);
    if (!band) continue;
    const step = band.sourceHeight / band.height,
      sy = band.sourceY + (y - band.y) * step;
    let sx = art.scaleX ?? 1;
    const stops = art.widthStops;
    if (stops?.length) {
      const upper = stops.findIndex((s) => s.y >= sy);
      if (upper < 0) sx = stops[stops.length - 1].scaleX;
      else if (upper === 0) sx = stops[0].scaleX;
      else {
        const a = stops[upper - 1],
          b = stops[upper];
        sx = a.scaleX + ((b.scaleX - a.scaleX) * (sy - a.y)) / (b.y - a.y);
      }
    }
    paint.drawImage(source, 0, sy, W, step, (W * (1 - sx)) / 2, y, W * sx, 1);
  }
  return out.toDataURL("image/png");
}
export function useRegisteredTexture(
  art: ImageArt,
  pass: GarmentPass,
  color?: string,
  detailColor?: string,
) {
  const sourceKey = JSON.stringify([art, pass]);
  const key = JSON.stringify([
    sourceKey,
    art.colorMasks ? color : undefined,
    art.colorMasks ? detailColor : undefined,
  ]);
  const [loaded, setLoaded] = useState<{ sourceKey: string; src: string }>();
  useEffect(() => {
    if (pass === "back" && !art.back && !art.backRegion) return;
    let alive = true;
    let task = cache.get(key);
    if (!task) {
      task = register(art, pass, color, detailColor);
      cache.set(key, task);
      if (cache.size > 60) cache.delete(cache.keys().next().value!);
    }
    task
      .then((src) => {
        if (alive) setLoaded({ sourceKey, src });
      })
      .catch(() => {
        cache.delete(key);
      });
    return () => {
      alive = false;
    };
  }, [key, sourceKey]);
  return loaded?.sourceKey === sourceKey ? loaded.src : undefined;
}
