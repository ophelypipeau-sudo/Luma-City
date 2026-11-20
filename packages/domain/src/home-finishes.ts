import type { HomeDecoration, WindowPlacement } from "../../contracts/src/housing";

export const FINISH_OFFER_VERSION = "2026-11-v1";
export type FinishCategory = "paint" | "wallpaper" | "bricks" | "motifs" | "parquet" | "tiles" | "slabs" | "included" | "windows";
export type HomeFinishKind = "wall" | "floor" | "window";
export const FINISH_CATEGORIES: { id: FinishCategory; kind: HomeFinishKind; name: string }[] = [
  { id: "paint", kind: "wall", name: "Peintures" }, { id: "wallpaper", kind: "wall", name: "Papiers peints" },
  { id: "bricks", kind: "wall", name: "Briques" }, { id: "motifs", kind: "wall", name: "Motifs" },
  { id: "parquet", kind: "floor", name: "Parquets" }, { id: "tiles", kind: "floor", name: "Carrelages" },
  { id: "slabs", kind: "floor", name: "Dalles" },
  { id: "windows", kind: "window", name: "Fenêtres" },
];
export type HomeFinish = { id: string; kind: HomeFinishKind; value: string; name: string; price: number; tone: [number, number, number];
  category?: FinishCategory; pattern?: "stripes" | "floral" | "bricks" | "arches" | "tiles" | "stone" | "herringbone" | "roses" | "daisies" | "botanical" | "stars" | "diamonds" | "dots";
  surface?: { base: string; detail: string }; };
const surface = (kind: "wall" | "floor", value: string, name: string, category: FinishCategory, pattern: HomeFinish["pattern"],
  price: number, base: string, detail: string): HomeFinish => ({ id: `${kind}:${value}`, kind, value, name, category, pattern, price, tone: [1,1,1], surface: { base, detail } });
export const HOME_FINISHES: readonly HomeFinish[] = [
  { id: "wall:ivory", kind: "wall", value: "ivory", name: "Ivoire", price: 0, tone: [1,1,1] },
  { id: "wall:rose", kind: "wall", value: "rose", name: "Rose poudré", price: 0, tone: [1.02,.88,.94] },
  { id: "wall:lilac", kind: "wall", value: "lilac", name: "Lilas", price: 0, tone: [.91,.86,1.06] },
  { id: "wall:sage", kind: "wall", value: "sage", name: "Sauge", price: 0, tone: [.87,.98,.87] },
  { id: "wall:midnight", kind: "wall", value: "midnight", name: "Bleu nuit", price: 350, tone: [.48,.59,.8] },
  { id: "wall:peach", kind: "wall", value: "peach", name: "Pêche veloutée", price: 350, tone: [1.08,.83,.72] },
  { id: "wall:wallpaper-blush", kind: "wall", value: "wallpaper-blush", name: "Papier peint Rayures rosées", price: 500, tone: [1.02,.88,.94], pattern: "stripes" },
  { id: "wall:wallpaper-sage", kind: "wall", value: "wallpaper-sage", name: "Papier peint Rayures sauge", price: 500, tone: [.87,.98,.87], pattern: "stripes" },
  { id: "floor:oak", kind: "floor", value: "oak", name: "Chêne clair", price: 0, tone: [1,1,1] },
  { id: "floor:honey", kind: "floor", value: "honey", name: "Chêne miel", price: 0, tone: [1.05,.94,.82] },
  { id: "floor:smoked", kind: "floor", value: "smoked", name: "Chêne fumé", price: 0, tone: [.74,.72,.74] },
  { id: "floor:walnut", kind: "floor", value: "walnut", name: "Noyer chaleureux", price: 450, tone: [.71,.58,.48] },
  { id: "floor:white-oak", kind: "floor", value: "white-oak", name: "Chêne blanchi", price: 450, tone: [1.08,1.12,1.18] },
  { id: "floor:rosewood", kind: "floor", value: "rosewood", name: "Bois rosé", price: 450, tone: [.92,.7,.7] },
  surface("wall", "floral-rose", "Fleurs de rose", "wallpaper", "floral", 550, "#f4dfdf", "#b16e88"),
  surface("wall", "floral-cream", "Jardin crème", "wallpaper", "floral", 550, "#f3ead6", "#768767"),
  surface("wall", "brick-terracotta", "Briques terracotta", "bricks", "bricks", 600, "#b97456", "#ead5ba"),
  surface("wall", "brick-white", "Briques blanchies", "bricks", "bricks", 600, "#e5dfd4", "#b9aea0"),
  surface("wall", "brick-charcoal", "Briques anthracite", "bricks", "bricks", 650, "#55545b", "#a5a0a2"),
  surface("wall", "arches-blush", "Arches poudrées", "motifs", "arches", 550, "#e7c9bd", "#ac7578"),
  surface("wall", "arches-ocean", "Arches bleu océan", "motifs", "arches", 550, "#d5e0df", "#58818b"),
  surface("floor", "herringbone-gold", "Chevrons dorés", "parquet", "herringbone", 650, "#b8824d", "#e0b67c"),
  surface("floor", "herringbone-dark", "Chevrons noyer", "parquet", "herringbone", 650, "#634936", "#a77a50"),
  surface("floor", "tile-ivory", "Carrelage ivoire", "tiles", "tiles", 500, "#eee5d7", "#b5a48e"),
  surface("floor", "tile-checker", "Damier crème et charbon", "tiles", "tiles", 600, "#ebe2ce", "#48454b"),
  surface("floor", "tile-rose", "Carrelage rose ancien", "tiles", "tiles", 500, "#dcb3a5", "#95786d"),
  surface("floor", "stone-sand", "Dalles de pierre sable", "slabs", "stone", 600, "#c8b59b", "#9a866f"),
  surface("floor", "stone-slate", "Dalles d’ardoise", "slabs", "stone", 650, "#686c76", "#393d48"),
  surface("wall", "roses-blush", "Bouquets de roses", "wallpaper", "roses", 600, "#f6e7df", "#b46b86"),
  surface("wall", "roses-blue", "Roses porcelaine", "wallpaper", "roses", 600, "#e5edf2", "#6585a2"),
  surface("wall", "daisies-cream", "Marguerites crème", "wallpaper", "daisies", 550, "#e9dfc5", "#fffdf2"),
  surface("wall", "daisies-lilac", "Marguerites lilas", "wallpaper", "daisies", 550, "#d9cee7", "#fff5ea"),
  surface("wall", "botanical-sage", "Feuillage sauge", "wallpaper", "botanical", 600, "#ece8d7", "#789581"),
  surface("wall", "botanical-night", "Jardin de nuit", "wallpaper", "botanical", 650, "#394f4d", "#a1b5a0"),
  surface("wall", "stars-blush", "Étoiles poudrées", "wallpaper", "stars", 550, "#f0dce3", "#bb9270"),
  surface("wall", "stars-midnight", "Ciel de minuit", "wallpaper", "stars", 600, "#343e60", "#ead2a0"),
  surface("wall", "diamonds-gold", "Losanges dorés", "motifs", "diamonds", 550, "#f0e5d0", "#b7955d"),
  surface("wall", "diamonds-mint", "Losanges menthe", "motifs", "diamonds", 550, "#dce9e1", "#6b978b"),
  surface("wall", "dots-pearl", "Pois nacrés", "motifs", "dots", 500, "#e8dfd2", "#fffaf1"),
  surface("wall", "dots-rose", "Pois roses", "motifs", "dots", 500, "#f4e8e5", "#c9919e"),
  { id: "window:arch-ivory", kind: "window", value: "arch-ivory", name: "Fenêtre Arche ivoire", price: 750, category: "windows", tone: [1,1,1] },
  { id: "window:loft-black", kind: "window", value: "loft-black", name: "Fenêtre Atelier noir", price: 800, category: "windows", tone: [1,1,1] },
  { id: "window:round-oak", kind: "window", value: "round-oak", name: "Hublot Chêne", price: 700, category: "windows", tone: [1,1,1] },
  { id: "window:bay-garden", kind: "window", value: "bay-garden", name: "Baie Jardin", price: 900, category: "windows", tone: [1,1,1] },
];
export const homeFinish = (id: string) => HOME_FINISHES.find((f) => f.id === id);
export const finishCategory = (finish: HomeFinish): FinishCategory => finish.price === 0 ? "included" : finish.category ?? (finish.kind === "floor" ? "parquet" : finish.pattern ? "wallpaper" : "paint");
export const STARTER_FINISHES = HOME_FINISHES.filter((f) => f.price === 0).map((f) => f.id);
export function ownsHomeFinish(owned: readonly string[] | undefined, kind: HomeFinishKind, value: string) {
  const id = `${kind}:${value}`;
  return STARTER_FINISHES.includes(id) || !!owned?.includes(id);
}
/** Window thumbnails use one illustrative placement; the live editor assigns its own instance IDs. */
export const finishDecoration = (finish: HomeFinish, current: HomeDecoration): HomeDecoration => finish.kind === "window"
  ? { ...current, windows: [{ id: "00000000-0000-4000-8000-000000000001", modelId: finish.value as WindowPlacement["modelId"], x: 660, y: 300 }] }
  : { ...current, [finish.kind]: finish.value };
