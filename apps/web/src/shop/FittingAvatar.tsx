import type { AvatarBodyBase } from "../avatar/base";
import type { AvatarLayers } from "../avatar/model";
import { equippedPieces, hairHeadroom } from "../avatar/model";
import { useId, type MouseEventHandler } from "react";
import { CartoonDoll } from "../cartoon/CartoonDoll";
import { CartoonGarment, CartoonAccessory } from "../cartoon/Wardrobe";
import {
  DOLL_WIDTH,
  DOLL_HEIGHT,
  DOLL_ATLAS_WIDTH,
  DOLL_HAIR,
  DOLL_CROPS,
  dollIndex,
  isFemale,
} from "../cartoon/model";
import type { Outfit, ClothingCategory } from "./catalog";
import type { AvatarAppearance } from "../cartoon/appearance";
import type { MorphologyId } from "../cartoon/model";
import type { PilotInspection } from "../cartoon/MorphologyDoll";
export function FittingAvatar({
  characterId,
  outfit,
  appearance,
  layers,
  bodyBase,
  inspection,
  onClick,
}: {
  characterId: string;
  outfit: Outfit;
  appearance?: AvatarAppearance;
  layers?: AvatarLayers;
  bodyBase?: AvatarBodyBase;
  inspection?: PilotInspection;
  onClick?: MouseEventHandler<SVGSVGElement>;
}) {
  const dressed = layers
    ? equippedPieces(layers).length > 0
    : appearance
      ? [
          appearance.equipped.tops,
          appearance.equipped.bottoms,
          appearance.equipped.shoes,
        ].some((n) => n !== null)
      : [outfit.tops, outfit.bottoms, outfit.shoes].some((n) => n >= 0);
  const headroom = hairHeadroom(layers);
  return (
    <svg
      className="fitting-avatar"
      viewBox={`0 ${-headroom} ${DOLL_WIDTH} ${DOLL_HEIGHT + headroom}`}
      preserveAspectRatio="xMidYMax meet"
      role="img"
      onClick={onClick}
      aria-label={`${dressed ? "Poupée cartoon habillée" : "Base cartoon en sous-vêtements"}, ${layers ? "base unique, chauve" : appearance ? "morphologie " + (appearance.body.kind === "morphology" ? appearance.body.morphologyId : "") + ", chauve" : outfit.hair >= 0 ? "perruque portée" : "chauve, sans perruque"}`}
    >
      <CartoonDoll
        characterId={characterId}
        outfit={outfit}
        appearance={appearance}
        layers={layers}
        bodyBase={bodyBase}
        inspection={inspection}
      />
    </svg>
  );
}
export function GarmentThumbnail({
  characterId,
  category,
  variant,
  morphology,
}: {
  characterId: string;
  category: ClothingCategory;
  variant: number;
  morphology?: MorphologyId;
}) {
  const id = useId();
  if (morphology && category !== "hair" && category !== "accessories")
    return (
      <svg
        className="garment-thumbnail"
        viewBox={(category === "tops"
          ? [280, 460, 325, 245]
          : category === "bottoms"
            ? [190, 710, 510, 400]
            : [250, 1310, 400, 460]
        ).join(" ")}
        aria-hidden="true"
      >
        <CartoonGarment
          characterId={characterId}
          category={category}
          variant={variant}
          morphology={morphology}
        />
      </svg>
    );
  let crop: readonly number[] =
    category === "bottoms" && isFemale(characterId)
      ? DOLL_CROPS.skirt
      : DOLL_CROPS[category];
  if (category === "tops" && characterId === "iris")
    crop = [159, 257, 170, 150];
  if (category === "hair" && !isFemale(characterId)) crop = [75, 0, 330, 260];
  if (category === "accessories")
    crop =
      variant === 0
        ? [146, 154, 195, 359]
        : variant === 1
          ? [150, 121, 185, 69]
          : [359, 538, 116, 223];
  return (
    <svg
      className="garment-thumbnail"
      viewBox={crop.join(" ")}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={id}>
          <rect width={DOLL_WIDTH} height={DOLL_HEIGHT} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {category === "hair" ? (
          <image
            data-layer="wig-only"
            href={DOLL_HAIR}
            x={-dollIndex(characterId) * DOLL_WIDTH}
            width={DOLL_ATLAS_WIDTH}
            height={DOLL_HEIGHT}
            preserveAspectRatio="none"
          />
        ) : category === "accessories" ? (
          <>
            <CartoonAccessory
              characterId={characterId}
              variant={variant}
              pass="strap"
            />
            <CartoonAccessory characterId={characterId} variant={variant} />
          </>
        ) : (
          <CartoonGarment
            characterId={characterId}
            category={category}
            variant={variant}
          />
        )}
      </g>
    </svg>
  );
}
