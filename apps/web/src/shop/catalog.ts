import {
  DOLL_BASE,
  DOLL_HAIR,
  DOLL_ATLAS_WIDTH,
  DOLL_HEIGHT,
  DOLL_WIDTH,
  dollIndex,
} from "../cartoon/model";
export type ClothingCategory =
  "tops" | "bottoms" | "shoes" | "hair" | "accessories";
export type Outfit = Record<ClothingCategory, number>;
export const ORIGINAL_OUTFIT: Outfit = {
  tops: 0,
  bottoms: 0,
  shoes: 0,
  hair: 0,
  accessories: 1,
};
export const BARE_OUTFIT: Outfit = {
  tops: -1,
  bottoms: -1,
  shoes: -1,
  hair: -1,
  accessories: -1,
};
export const BASE_BODY_ASSET = DOLL_BASE,
  WIG_ASSET = DOLL_HAIR,
  ATLAS_WIDTH = DOLL_ATLAS_WIDTH,
  ATLAS_HEIGHT = DOLL_HEIGHT,
  CELL_WIDTH = DOLL_WIDTH;
export const characterIndex = dollIndex;
export const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  tops: "Hauts",
  bottoms: "Bas",
  shoes: "Chaussures",
  hair: "Perruques",
  accessories: "Accessoires",
};
export const LOOK_NAMES = [
  "Première rencontre",
  "Douceur lilas",
  "Après minuit",
];
const TITLES: Record<string, Record<ClothingCategory, string[]>> = {
  iris: {
    hair: ["Blond pompons"],
    tops: ["Caraco lumière", "Caraco céleste", "Caraco rosé"],
    bottoms: ["Denim plissé", "Jupe satin ivoire", "Plissé de minuit"],
    shoes: ["Bottes givrées", "Bottes de minuit", "Bottes rose poudré"],
    accessories: ["Bijoux nacrés", "Lunettes papillon", "Sac nuage"],
  },
  milo: {
    hair: ["Mèches brunes"],
    tops: ["Veste sauge", "Veste lilas", "Veste denim"],
    bottoms: ["Pantalon charbon", "Pantalon ivoire", "Jean ciel"],
    shoes: ["Sneakers crème", "Sneakers charbon", "Sneakers rosées"],
    accessories: ["Chaînes argentées", "Lunettes papillon", "Sac nuage"],
  },
  june: {
    hair: ["Ondulations cuivrées"],
    tops: ["Cardigan rosé", "Cardigan lilas", "Cardigan vanille"],
    bottoms: ["Plissé ivoire", "Plissé denim", "Plissé de minuit"],
    shoes: ["Bottes cacao", "Bottes crème", "Bottes rosées"],
    accessories: ["Bijoux nacrés", "Lunettes papillon", "Sac nuage"],
  },
  noa: {
    hair: ["Boucles ébène"],
    tops: ["Varsity lilas", "Varsity sauge", "Varsity rosé"],
    bottoms: ["Jean charbon", "Pantalon ivoire", "Jean ciel"],
    shoes: ["Sneakers crème", "Sneakers charbon", "Sneakers lilas"],
    accessories: ["Chaînes argentées", "Lunettes papillon", "Sac nuage"],
  },
};
/** A piece identifies a design + colour, never the wearer or body shape.
 * Legacy ids/variant indices remain aliases for the current v6 renderer. */
export type PieceId = string;
const PIECES: Record<string, Record<ClothingCategory, readonly PieceId[]>> = {
  iris: {
    tops: ["camisole.ivory", "camisole.lilac", "camisole.rose"],
    bottoms: [
      "pleated-skirt.denim",
      "pleated-skirt.ivory",
      "pleated-skirt.night",
    ],
    shoes: ["lace-boots.ivory", "lace-boots.night", "lace-boots.rose"],
    hair: ["wig.blond-pompons"],
    accessories: ["jewellery.pearls", "glasses.butterfly", "bag.cloud"],
  },
  june: {
    tops: ["cardigan.rose", "cardigan.lilac", "cardigan.ivory"],
    bottoms: [
      "pleated-skirt.ivory",
      "pleated-skirt.denim",
      "pleated-skirt.night",
    ],
    shoes: ["buckle-boots.cocoa", "buckle-boots.ivory", "buckle-boots.rose"],
    hair: ["wig.auburn-waves"],
    accessories: ["jewellery.pearls", "glasses.butterfly", "bag.cloud"],
  },
  milo: {
    tops: [
      "utility-jacket.sage",
      "utility-jacket.lilac",
      "utility-jacket.denim",
    ],
    bottoms: ["trousers.night", "trousers.ivory", "trousers.denim"],
    shoes: ["sneakers.ivory", "sneakers.night", "sneakers.rose"],
    hair: ["wig.brown-tousled"],
    accessories: ["jewellery.silver-chains", "glasses.butterfly", "bag.cloud"],
  },
  noa: {
    tops: [
      "varsity-jacket.lilac",
      "varsity-jacket.sage",
      "varsity-jacket.rose",
    ],
    bottoms: ["trousers.night", "trousers.ivory", "trousers.denim"],
    shoes: ["sneakers.ivory", "sneakers.night", "sneakers.lilac"],
    hair: ["wig.ebony-curls"],
    accessories: ["jewellery.silver-chains", "glasses.butterfly", "bag.cloud"],
  },
};
export type CatalogItem = {
  /** Compatibility alias: retained so history and existing cards keep their keys. */
  id: string;
  pieceId: PieceId;
  category: ClothingCategory;
  variant: number;
  name: string;
  tint: string;
};
/** Accessories occupy independent subslots: bit 0 jewellery, bit 1 glasses, bit 2 bag. */
export function accessoryEquipped(mask: number, variant: number) {
  return mask > 0 && (mask & (1 << variant)) !== 0;
}
export function accessorySelection(
  mask: number,
  variant: number,
  mode: "add" | "remove" | "toggle" = "add",
) {
  if (variant < 0) return -1;
  const current = Math.max(0, mask),
    bit = 1 << variant;
  const next =
    mode === "remove"
      ? current & ~bit
      : mode === "toggle"
        ? current ^ bit
        : current | bit;
  return next || -1;
}
export function itemEquipped(
  outfit: Outfit,
  item: Pick<CatalogItem, "category" | "variant">,
) {
  return item.category === "accessories"
    ? accessoryEquipped(outfit.accessories, item.variant)
    : outfit[item.category] === item.variant;
}
export function catalogFor(characterId: string): CatalogItem[] {
  const titles = TITLES[characterId] ?? TITLES.iris;
  return (["tops", "bottoms", "shoes", "hair", "accessories"] as const).flatMap(
    (category) =>
      titles[category].map((name, variant) => ({
        id: `${characterId}-${category}-${variant}`,
        pieceId: (PIECES[characterId] ?? PIECES.iris)[category][variant],
        category,
        variant,
        name,
        tint: ["#e8d7b9", "#bda2db", "#bc7a91"][variant],
      })),
  );
}
