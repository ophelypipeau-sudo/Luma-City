import type { FurniturePlacement, HomeDecoration, OwnedFurniture } from "../../contracts/src/housing.ts";

export const HOME_WIDTH = 1000;
export const HOME_HEIGHT = 680;
export const HOME_FLOOR = 422;
export type FurnitureModel = {
  id: string; name: string; category: string; image: string;
  width: number; height: number; placement: "floor" | "wall" | "rug";
  blocksMovement: boolean; footprint: { width: number; height: number };
  /** Future surface attachments, without permitting unsupported floating objects. */
  surfaces: readonly { x: number; y: number; width: number }[];
  price: null; published: false;
};
const model = (id: string, name: string, category: string, width: number, height: number,
  placement: FurnitureModel["placement"] = "floor", blocksMovement = true): FurnitureModel => ({
  id, name, category, width, height, placement, blocksMovement,
  image: `/assets/housing/prune-v1/${id === "rug" ? "rug-front" : id}.png`,
  footprint: { width: width * .85, height: Math.min(45, height * .2) },
  surfaces: id === "coffee-table" || id === "cabinet" ? [{ x: -width / 2, y: -height + 12, width }] : [],
  price: null, published: false,
});
export const FURNITURE_MODELS: readonly FurnitureModel[] = [
  model("sofa", "Canapé Prune", "Canapés", 410, 168),
  model("armchair", "Fauteuil Nuage", "Fauteuils", 166, 155),
  model("coffee-table", "Table basse Galet", "Tables", 290, 104),
  model("rug", "Tapis Bouclette", "Tapis", 560, 78, "rug", false),
  model("floor-lamp", "Lampadaire Halo", "Lampes", 103, 245),
  model("plant", "Plante Sauge", "Plantes", 178, 310),
  model("bookcase", "Bibliothèque Chêne", "Bibliothèques", 137, 340),
  model("mirror", "Miroir Éclat", "Miroirs", 120, 175, "wall", false),
  model("painting", "Tableau Prune", "Tableaux", 185, 180, "wall", false),
  model("cabinet", "Buffet Aube", "Rangements", 195, 150),
];
export const furnitureModel = (id: string) => FURNITURE_MODELS.find((item) => item.id === id);
export const STARTER_POSITIONS: Record<string, [number, number]> = {
  sofa: [415, 435], armchair: [750, 440], "coffee-table": [435, 477],
  rug: [450, 510], "floor-lamp": [635, 432], plant: [835, 432],
  bookcase: [925, 432], mirror: [630, 255], painting: [395, 245], cabinet: [105, 433],
};

/** Anchors are bottom-centre; dimensions are in room units, never viewport pixels. */
export function constrainPlacement(model: FurnitureModel, placement: FurniturePlacement): FurniturePlacement {
  const half = model.width / 2;
  return { ...placement,
    x: Math.round(Math.max(half + 4, Math.min(HOME_WIDTH - half - 4, placement.x)) * 10) / 10,
    y: Math.round(Math.max(model.placement === "wall" ? model.height + 12 : HOME_FLOOR + (model.placement === "rug" ? model.height : 0),
      Math.min(model.placement === "wall" ? HOME_FLOOR - 14 : HOME_HEIGHT - 35, placement.y)) * 10) / 10,
  };
}
export function placementDepth(model: FurnitureModel, placement: FurniturePlacement) {
  return model.placement === "wall" ? -2000 + placement.depth
    : model.placement === "rug" ? -1000 + placement.depth : placement.y + placement.depth;
}
export function validateDecoration(decoration: HomeDecoration, items: readonly OwnedFurniture[], roomId: string) {
  const ids = new Set<string>();
  for (const placement of decoration.placements) {
    if (ids.has(placement.itemId)) throw new Error("Un exemplaire ne peut être placé qu’une fois.");
    ids.add(placement.itemId);
    const owned = items.find((item) => item.id === placement.itemId);
    if (!owned || (owned.roomId && owned.roomId !== roomId))
      throw new Error("Ce meuble n’est pas disponible dans ton inventaire.");
    const model = furnitureModel(owned.modelId);
    if (!model) throw new Error("Ce modèle de meuble est indisponible.");
    const bounded = constrainPlacement(model, placement);
    if (Math.abs(bounded.x - placement.x) > .11 || Math.abs(bounded.y - placement.y) > .11)
      throw new Error("Place les meubles dans la zone adaptée : mur ou sol.");
  }
}
