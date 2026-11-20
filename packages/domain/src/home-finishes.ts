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
  category?: FinishCategory; pattern?: "stripes" | "floral" | "bricks" | "arches" | "tiles" | "stone" | "herringbone" | "roses" | "daisies" | "botanical" | "stars" | "diamonds" | "dots" | "basketweave" | "versailles" | "terrazzo" | "hexagon" | "marble" | "magnolia" | "damask" | "linen" | "fans";
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
  // Historical IDs preserve ownership and saved rooms after the realistic material refresh.
  surface("wall", "arches-blush", "Herbier terracotta", "wallpaper", "botanical", 550, "#efe0d2", "#ac7570"),
  surface("wall", "arches-ocean", "Herbier bleu grisé", "wallpaper", "botanical", 550, "#e2e8e5", "#58818b"),
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
  surface("wall", "stars-blush", "Roses vieux rose", "wallpaper", "roses", 550, "#f0dce3", "#9a6576"),
  surface("wall", "stars-midnight", "Fleurs de minuit", "wallpaper", "floral", 600, "#343e60", "#c1b6a0"),
  surface("wall", "diamonds-gold", "Losanges dorés", "motifs", "diamonds", 550, "#f0e5d0", "#b7955d"),
  surface("wall", "diamonds-mint", "Losanges menthe", "motifs", "diamonds", 550, "#dce9e1", "#6b978b"),
  surface("wall", "dots-pearl", "Fleurs lin et nacre", "wallpaper", "floral", 500, "#eee7db", "#9c907e"),
  surface("wall", "dots-rose", "Marguerites rose ancien", "wallpaper", "daisies", 500, "#e3c9c5", "#fff5ea"),
  surface("floor", "basketweave-oak", "Parquet tressé", "parquet", "basketweave", 750, "#d8b38b", "#8d6547"),
  surface("floor", "versailles-oak", "Parquet Versailles", "parquet", "versailles", 850, "#cba27a", "#79563b"),
  surface("floor", "terrazzo-pearl", "Terrazzo nacré", "slabs", "terrazzo", 600, "#e8e1d6", "#98938c"),
  surface("floor", "hexagon-ivory", "Tomettes hexagonales", "tiles", "hexagon", 650, "#e5d6c1", "#ac9278"),
  surface("floor", "marble-ivory", "Marbre veiné", "slabs", "marble", 700, "#eee9df", "#8e8a85"),
  surface("wall", "magnolia-ivory", "Magnolias ivoire", "wallpaper", "magnolia", 650, "#f1e8dd", "#a1807c"),
  surface("wall", "damask-linen", "Damas de lin", "wallpaper", "damask", 650, "#eee3d3", "#a08b76"),
  surface("wall", "linen-natural", "Lin tissé", "wallpaper", "linen", 450, "#e7dfcf", "#a49c8d"),
  surface("wall", "fans-pearl", "Éventails Art déco", "wallpaper", "fans", 650, "#eee5d4", "#9d8565"),
  { id: "window:arch-ivory", kind: "window", value: "arch-ivory", name: "Fenêtre Arche ivoire", price: 750, category: "windows", tone: [1,1,1] },
  { id: "window:loft-black", kind: "window", value: "loft-black", name: "Fenêtre Atelier noir", price: 800, category: "windows", tone: [1,1,1] },
  { id: "window:round-oak", kind: "window", value: "round-oak", name: "Hublot Chêne", price: 700, category: "windows", tone: [1,1,1] },
  { id: "window:bay-garden", kind: "window", value: "bay-garden", name: "Baie Jardin", price: 900, category: "windows", tone: [1,1,1] },
];
export const homeFinish = (id: string) => HOME_FINISHES.find((f) => f.id === id);
export const isColorableWallpaper = (finish: HomeFinish | undefined) => !!finish?.pattern && finish.kind === "wall" && finish.pattern !== "bricks";
export const isColorableWall = (finish: HomeFinish | undefined) => finish?.kind === "wall" && finish.pattern !== "bricks";
/** Color variants share one catalogue card; historical IDs still load and save. */
export function finishVisualFamily(finish: HomeFinish) {
  if (isColorableWallpaper(finish)) return `wall-pattern:${finish.pattern}`;
  if (finish.kind === "floor") return `floor-pattern:${finish.pattern ?? "wood"}${finish.value === "tile-checker" ? ":checker" : ""}`;
  return finish.id;
}
export function distinctFinishOffers<T extends HomeFinish>(offers: readonly T[], owned: readonly string[], selected: readonly string[]) {
  const families = new Map<string, T>();
  const score = (finish: T) => (finish.price === 0 || owned.includes(finish.id) ? 2 : 0) + (selected.includes(finish.id) ? 1 : 0);
  for (const offer of offers) {
    const key = finishVisualFamily(offer), previous = families.get(key);
    if (!previous || score(offer) > score(previous) || (score(offer) === score(previous) && offer.price < previous.price)) families.set(key, offer);
  }
  return [...families.values()];
}
// Window models and receipts are retained for their future furniture integration.
export const DECORATION_FINISHES = HOME_FINISHES.filter((finish) => finish.kind !== "window");
export const finishCategory = (finish: HomeFinish): FinishCategory => finish.price === 0 ? "included" : finish.category ?? (finish.kind === "floor" ? "parquet" : finish.pattern ? "wallpaper" : "paint");
export const STARTER_FINISHES = HOME_FINISHES.filter((f) => f.price === 0).map((f) => f.id);
export function ownsHomeFinish(owned: readonly string[] | undefined, kind: HomeFinishKind, value: string) {
  const id = `${kind}:${value}`;
  return STARTER_FINISHES.includes(id) || !!owned?.includes(id);
}
/** Window thumbnails use one illustrative placement; the live editor assigns its own instance IDs. */
export const finishDecoration = (finish: HomeFinish, current: HomeDecoration): HomeDecoration => finish.kind === "window"
  ? { ...current, windows: [{ id: "00000000-0000-4000-8000-000000000001", modelId: finish.value as WindowPlacement["modelId"], x: 660, y: 300 }] }
  : finish.kind === "wall" && finish.value !== current.wall
    ? (({ wallColors: _previousColors, ...rest }) => ({ ...rest, wall: finish.value as HomeDecoration["wall"] }))(current)
    : finish.kind === "floor" && finish.value !== current.floor
    ? (({ floorColors: _previousColors, ...rest }) => ({ ...rest, floor: finish.value as HomeDecoration["floor"] }))(current)
    : { ...current, [finish.kind]: finish.value };
