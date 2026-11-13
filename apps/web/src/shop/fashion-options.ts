import { avatarGarment } from "../avatar/catalog";
import { equippedPieces, type AvatarLayers } from "../avatar/model";

/** Temporary game-currency prices, independent of any real-money checkout. */
export const FASHION_PRICES: Readonly<Record<string, number>> = {
  "fashion.cardigan-lilac": 650,
  "fashion.jeans-indigo": 550,
  "fashion.boots-ivory": 700,
  "fashion.rose-bow-camisole": 350,
  "fashion.rose-dragon-cargo": 600,
  "fashion.white-platform-sneakers": 450,
};
const hues = [
  [255, 0, 0],
  [255, 128, 0],
  [255, 255, 0],
  [128, 255, 0],
  [0, 255, 0],
  [0, 255, 128],
  [0, 255, 255],
  [0, 128, 255],
  [0, 0, 255],
  [128, 0, 255],
  [255, 0, 255],
  [255, 0, 128],
];
const hex = (rgb: number[]) =>
  "#" + rgb.map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");
export const RGB_PALETTE = hues.map((rgb) =>
  [0.8, 0.5, 0.25, 0, -0.25, -0.5, -0.75].map((t) =>
    hex(rgb.map((c) => (t >= 0 ? c + (255 - c) * t : c * (1 + t)))),
  ),
);
export const NEUTRAL_COLORS = [
  "#ffffff",
  "#eeeeee",
  "#cccccc",
  "#999999",
  "#666666",
  "#333333",
  "#151515",
];
export function colorGarment(
  layers: AvatarLayers,
  id: string,
  color: string,
  zone: "main" | "detail" = "main",
): AvatarLayers {
  if (!avatarGarment(id).colorable || !/^#[0-9a-f]{6}$/i.test(color))
    throw new Error("Couleur ou pièce non compatible");
  if (zone === "detail" && !avatarGarment(id).secondaryColor)
    throw new Error("Pas de deuxième zone");
  return zone === "detail"
    ? {
        ...layers,
        detailColors: { ...layers.detailColors, [id]: color.toLowerCase() },
      }
    : { ...layers, colors: { ...layers.colors, [id]: color.toLowerCase() } };
}
export function fittingCart(layers: AvatarLayers) {
  return equippedPieces(layers).map((piece) => ({
    piece,
    price: piece.price ?? FASHION_PRICES[piece.id] ?? 0,
    color: layers.colors?.[piece.id],
    detailColor: piece.secondaryColor ? layers.detailColors?.[piece.id] : undefined,
  }));
}
