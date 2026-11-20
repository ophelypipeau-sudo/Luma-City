import type { HomeDecoration } from "../../contracts/src/housing";

export const FINISH_OFFER_VERSION = "2026-11-v1";
export type FinishCategory = "paint" | "wallpaper" | "bricks" | "motifs" | "parquet" | "tiles" | "slabs" | "included";
export const FINISH_CATEGORIES: { id: FinishCategory; kind: "wall" | "floor"; name: string }[] = [
  { id: "paint", kind: "wall", name: "Peintures" }, { id: "wallpaper", kind: "wall", name: "Papiers peints" },
  { id: "bricks", kind: "wall", name: "Briques" }, { id: "motifs", kind: "wall", name: "Motifs" },
  { id: "parquet", kind: "floor", name: "Parquets" }, { id: "tiles", kind: "floor", name: "Carrelages" },
  { id: "slabs", kind: "floor", name: "Dalles" },
];
export type HomeFinish = { id: string; kind: "wall" | "floor"; value: string; name: string; price: number; tone: [number, number, number];
  category?: FinishCategory; pattern?: "stripes" | "floral" | "bricks" | "arches" | "tiles" | "stone" | "herringbone";
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
];
export const homeFinish = (id: string) => HOME_FINISHES.find((f) => f.id === id);
export const finishCategory = (finish: HomeFinish): FinishCategory => finish.price === 0 ? "included" : finish.category ?? (finish.kind === "floor" ? "parquet" : finish.pattern ? "wallpaper" : "paint");
export const STARTER_FINISHES = HOME_FINISHES.filter((f) => f.price === 0).map((f) => f.id);
export function ownsHomeFinish(owned: readonly string[] | undefined, kind: "wall" | "floor", value: string) {
  const id = `${kind}:${value}`;
  return STARTER_FINISHES.includes(id) || !!owned?.includes(id);
}
export const finishDecoration = (finish: HomeFinish, current: HomeDecoration): HomeDecoration => ({ ...current, [finish.kind]: finish.value });
