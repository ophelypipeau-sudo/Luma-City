import { CartoonGarment } from "../cartoon/Wardrobe";
import type { ClothingCategory } from "./catalog";
/** Compatibility export: the active art is now the front-facing cartoon v6 wardrobe. */
export function FittedGarment({
  characterId,
  category,
  variant,
}: {
  characterId: string;
  category: Exclude<ClothingCategory, "hair" | "accessories">;
  variant: number;
  painted?: boolean;
}) {
  return (
    <CartoonGarment
      characterId={characterId}
      category={category}
      variant={variant}
    />
  );
}
