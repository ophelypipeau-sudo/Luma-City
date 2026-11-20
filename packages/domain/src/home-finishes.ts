import type { HomeDecoration } from "../../contracts/src/housing";

export const FINISH_OFFER_VERSION = "2026-11-v1";
export type HomeFinish = { id: string; kind: "wall" | "floor"; value: string; name: string; price: number; tone: [number, number, number]; pattern?: "stripes" };
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
];
export const homeFinish = (id: string) => HOME_FINISHES.find((f) => f.id === id);
export const STARTER_FINISHES = HOME_FINISHES.filter((f) => f.price === 0).map((f) => f.id);
export function ownsHomeFinish(owned: readonly string[] | undefined, kind: "wall" | "floor", value: string) {
  const id = `${kind}:${value}`;
  return STARTER_FINISHES.includes(id) || !!owned?.includes(id);
}
export const finishDecoration = (finish: HomeFinish, current: HomeDecoration): HomeDecoration => ({ ...current, [finish.kind]: finish.value });
