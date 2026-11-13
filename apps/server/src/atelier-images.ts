import { Resvg } from "@resvg/resvg-js";
import { measureFabricTone } from "../../../packages/domain/src/atelier-color.ts";
import {
  ATELIER_PATTERNS,
  type PatternId,
} from "../../../packages/domain/src/atelier-patterns.ts";
export function imageUpload(value: unknown) {
  if (typeof value !== "string" || value.length > 17_000_000)
    throw new Error("Image trop volumineuse (12 Mo maximum).");
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    value,
  );
  if (!m) throw new Error("Image PNG, JPEG ou WebP requise.");
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length < 24 || bytes.length > 12_000_000)
    throw new Error("Image invalide ou trop volumineuse.");
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpg = bytes[0] === 255 && bytes[1] === 216;
  const webp =
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";
  if (!(m[1] === "png" ? png : m[1] === "jpeg" ? jpg : webp))
    throw new Error("Le contenu ne correspond pas au format de l’image.");
  if (png) {
    const w = bytes.readUInt32BE(16),
      h = bytes.readUInt32BE(20);
    if (!w || !h || w * h > 24_000_000 || w > 8192 || h > 8192)
      throw new Error("Dimensions d’image non prises en charge.");
  }
  return { bytes, mime: "image/" + m[1], dataUrl: value };
}
export function pngPixels(bytes: Buffer) {
  if (
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    throw new Error("Le calque préparé doit être un PNG transparent.");
  const width = bytes.readUInt32BE(16),
    height = bytes.readUInt32BE(20);
  if (
    !width ||
    !height ||
    width * height > 16_000_000 ||
    width > 8192 ||
    height > 8192
  )
    throw new Error("Dimensions du calque refusées.");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><image width="${width}" height="${height}" href="data:image/png;base64,${bytes.toString("base64")}"/></svg>`;
  const image = new Resvg(svg).render();
  return { width, height, pixels: image.pixels };
}
export function normalizePiece(
  bytes: Buffer,
  pattern: PatternId,
  registered: boolean,
) {
  const raw = pngPixels(bytes);
  let opaque = 0,
    visible = 0,
    left = raw.width,
    right = 0,
    top = raw.height,
    bottom = 0;
  for (let y = 0; y < raw.height; y++)
    for (let x = 0; x < raw.width; x++) {
      const a = raw.pixels[(y * raw.width + x) * 4 + 3];
      if (a > 20) {
        visible++;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
      if (a > 240) opaque++;
    }
  if (visible < 200) throw new Error("Le calque est vide.");
  if (visible / raw.width / raw.height > 0.9)
    throw new Error(
      "Le fond doit être transparent : la photo source ne peut pas devenir un vêtement directement.",
    );
  let x = 0,
    y = 0,
    width = 887,
    height = 1774;
  if (registered) {
    if (Math.abs(raw.width / raw.height - 0.5) > 0.025)
      throw new Error(
        "Un calque déjà calé doit garder le canevas de proportion 1:2.",
      );
  } else {
    const [bx, by, bw, bh] = ATELIER_PATTERNS[pattern].crop;
    const s = Math.min(
      (bw - 30) / (right - left + 1),
      (bh - 30) / (bottom - top + 1),
    );
    width = raw.width * s;
    height = raw.height * s;
    x = bx + bw / 2 - ((left + right) / 2) * s;
    y = by + 15 - top * s;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="none" href="data:image/png;base64,${bytes.toString("base64")}"/></svg>`;
  return new Resvg(svg).render().asPng();
}
export function defaultMask(front: Buffer, secondary: boolean) {
  // The garment alpha is applied at render time. A second luminance/alpha
  // weight would let the original color show through at dark folds or edges.
  const graphic = secondary
    ? ""
    : `<defs><filter id="mask" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 255 0"/></filter></defs><image width="887" height="1774" filter="url(#mask)" href="data:image/png;base64,${front.toString("base64")}"/>`;
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774">${graphic}</svg>`,
  )
    .render()
    .asPng();
}

export function dyeProfile(front: Buffer, main: Buffer, detail: Buffer) {
  const source = pngPixels(front).pixels;
  const mask = pngPixels(main).pixels;
  const mainTone = measureFabricTone(source, mask);
  const detailTone = measureFabricTone(source, pngPixels(detail).pixels);
  let baseColor: string | undefined;
  if (mainTone) {
    const channels = [0, 0, 0];
    let count = 0;
    for (let i = 0; i < source.length; i += 4) {
      if (source[i + 3] < 245 || mask[i + 3] < 128) continue;
      const light =
        ((0.2126 * source[i] +
          0.7152 * source[i + 1] +
          0.0722 * source[i + 2]) *
          255) /
        source[i + 3];
      if (Math.abs(light - mainTone.middle) > 4) continue;
      for (let c = 0; c < 3; c++)
        channels[c] += (source[i + c] * 255) / source[i + 3];
      count++;
    }
    if (count)
      baseColor =
        "#" +
        channels
          .map((c) =>
            Math.round(c / count)
              .toString(16)
              .padStart(2, "0"),
          )
          .join("");
  }
  return { mainTone, detailTone, baseColor };
}
export function inspectPiece(
  front: Buffer,
  body: Buffer,
  placement: { x: number; y: number; scaleX: number; scaleY: number },
) {
  const p = placement,
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><image x="${443.5 * (1 - p.scaleX) + p.x}" y="${450 * (1 - p.scaleY) + p.y}" width="${887 * p.scaleX}" height="${1774 * p.scaleY}" href="data:image/png;base64,${front.toString("base64")}"/></svg>`;
  const cloth = new Resvg(svg).render().pixels,
    skin = pngPixels(body).pixels,
    source = pngPixels(front).pixels;
  let left = 887,
    right = -1,
    top = 1774,
    bottom = -1;
  let bra = 0,
    covered = 0,
    head = 0,
    hands = 0;
  for (let y = 0; y < 1774; y++)
    for (let x = 0; x < 887; x++) {
      const i = (y * 887 + x) * 4,
        a = cloth[i + 3];
      if (source[i + 3] > 20) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
      if (
        y >= 340 &&
        y < 550 &&
        x > 260 &&
        x < 630 &&
        skin[i + 3] > 230 &&
        skin[i] - skin[i + 1] > 12 &&
        skin[i + 2] - skin[i + 1] > 10 &&
        Math.abs(skin[i] - skin[i + 2]) < 30
      ) {
        bra++;
        if (a > 230) covered++;
      }
      if (y < 320 && skin[i + 3] > 230 && a > 40) head++;
      if (
        y > 875 &&
        y < 1000 &&
        (x < 215 || x > 672) &&
        skin[i + 3] > 230 &&
        a > 100
      )
        hands++;
    }
  return [
    {
      label: "Pièce entière dans le canevas",
      ok:
        right >= left &&
        443.5 + (left - 443.5) * p.scaleX + p.x >= 0 &&
        443.5 + (right + 1 - 443.5) * p.scaleX + p.x <= 887 &&
        450 + (top - 450) * p.scaleY + p.y >= 0 &&
        450 + (bottom + 1 - 450) * p.scaleY + p.y <= 1774,
      blocking: true,
    },
    {
      label: "Sous-vêtements du torse couverts",
      ok: bra > 0 && covered / bra > 0.995,
      blocking: true,
    },
    { label: "Visage libre", ok: head < 10, blocking: true },
    { label: "Mains libres", ok: hands < 20, blocking: true },
  ];
}
