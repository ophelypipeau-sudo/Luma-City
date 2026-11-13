import type { AvatarBodyBase } from "../avatar/base";
import { LayeredDoll } from "../avatar/LayeredDoll";
import type { AvatarLayers } from "../avatar/model";
import { useId } from "react";
import { BodyCoverage } from "./BodyCoverage";
import { MorphologyDoll, type PilotInspection } from "./MorphologyDoll";
import type { AvatarAppearance } from "./appearance";
import { CartoonGarment, CartoonAccessory } from "./Wardrobe";
import {
  DOLL_WIDTH,
  DOLL_HEIGHT,
  DOLL_ATLAS_WIDTH,
  DOLL_BASE,
  DOLL_HAIR,
  dollId,
  dollIndex,
  isFemale,
} from "./model";
import { accessoryEquipped, type Outfit } from "../shop/catalog";

/** One partition for both passes: a hair pixel belongs in front OR behind. */
function HairFrontRegion({ female }: { female: boolean }) {
  return (
    <>
      <rect width={DOLL_WIDTH} height={female ? 240 : 107} />
      {female ? (
        <>
          <rect y="240" width="145" height="580" />
          <rect x="340" y="240" width="140" height="580" />
        </>
      ) : (
        <>
          <rect y="107" width="172" height="125" />
          <rect x="312" y="107" width="168" height="125" />
        </>
      )}
    </>
  );
}

/** One canonical doll is shared by the shop, portraits, character rail and room. */
export function CartoonDoll({
  characterId,
  outfit,
  appearance,
  layers,
  bodyBase,
  inspection,
}: {
  characterId: string;
  outfit: Outfit;
  appearance?: AvatarAppearance;
  layers?: AvatarLayers;
  bodyBase?: AvatarBodyBase;
  inspection?: PilotInspection;
}) {
  const id = useId(),
    character = dollId(characterId),
    female = isFemale(character),
    offset = -dollIndex(character) * DOLL_WIDTH;
  const dressed = [outfit.tops, outfit.bottoms, outfit.shoes].some(
    (n) => n >= 0,
  );
  if (layers)
    return (
      <LayeredDoll
        layers={layers}
        inspection={inspection}
        bodyBase={bodyBase}
      />
    );
  if (appearance?.body.kind === "morphology")
    return <MorphologyDoll appearance={appearance} inspection={inspection} />;
  return (
    <g data-avatar-version="cartoon-v6" data-character={character}>
      <defs>
        <filter id={`${id}-alpha`} colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0 0 .6 1" />
          </feComponentTransfer>
        </filter>
        <clipPath id={`${id}-cell`}>
          <rect width={DOLL_WIDTH} height={DOLL_HEIGHT} />
        </clipPath>
        <clipPath id={`${id}-hair-front`}>
          <HairFrontRegion female={female} />
        </clipPath>
        <mask
          id={`${id}-hair-back`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={DOLL_WIDTH}
          height={DOLL_HEIGHT}
        >
          <rect width={DOLL_WIDTH} height={DOLL_HEIGHT} fill="white" />
          <g fill="black">
            <HairFrontRegion female={female} />
          </g>
        </mask>
        <mask
          id={`${id}-face-clear`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={DOLL_WIDTH}
          height={DOLL_HEIGHT}
        >
          <rect width={DOLL_WIDTH} height={DOLL_HEIGHT} fill="white" />
          <path
            d="M180 112Q243 84 307 112L312 171Q298 205 262 223H224Q186 203 174 169Z"
            fill="black"
          />
        </mask>
        <mask
          id={`${id}-body`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={DOLL_WIDTH}
          height={DOLL_HEIGHT}
        >
          <rect width={DOLL_WIDTH} height={DOLL_HEIGHT} fill="white" />
          <BodyCoverage characterId={character} outfit={outfit} />
        </mask>
        <clipPath id={`${id}-hands`}>
          <rect x="25" y={female ? 552 : 558} width="100" height="100" />
          <rect x="355" y={female ? 552 : 558} width="100" height="100" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-cell)`}>
        {outfit.shoes >= 0 && (
          <CartoonGarment
            characterId={character}
            category="shoes"
            variant={outfit.shoes}
            pass="back"
          />
        )}
        {outfit.hair >= 0 && (
          <image
            data-layer="hair-back"
            mask={`url(#${id}-hair-back)`}
            href={DOLL_HAIR}
            x={offset}
            width={DOLL_ATLAS_WIDTH}
            height={DOLL_HEIGHT}
            preserveAspectRatio="none"
            filter={`url(#${id}-alpha)`}
          />
        )}
        <image
          data-layer="body"
          href={DOLL_BASE}
          x={offset}
          width={DOLL_ATLAS_WIDTH}
          height={DOLL_HEIGHT}
          preserveAspectRatio="none"
          mask={`url(#${id}-body)`}
          filter={`url(#${id}-alpha)`}
        />
        {(["bottoms", "shoes", "tops"] as const)
          .filter((category) => outfit[category] >= 0)
          .map((category) => (
            <CartoonGarment
              key={category}
              pass="front"
              characterId={character}
              category={category}
              variant={outfit[category]}
            />
          ))}
        {outfit.hair >= 0 && (
          <image
            data-layer="hair-front"
            href={DOLL_HAIR}
            x={offset}
            width={DOLL_ATLAS_WIDTH}
            height={DOLL_HEIGHT}
            preserveAspectRatio="none"
            clipPath={`url(#${id}-hair-front)`}
            mask={`url(#${id}-face-clear)`}
            filter={`url(#${id}-alpha)`}
          />
        )}
        {[0, 1, 2]
          .filter((variant) => accessoryEquipped(outfit.accessories, variant))
          .map((variant) => (
            <CartoonAccessory
              key={variant}
              characterId={character}
              variant={variant}
              pass="strap"
            />
          ))}
        {(dressed || outfit.accessories > 0) && (
          <image
            data-layer="hands"
            mask={`url(#${id}-body)`}
            href={DOLL_BASE}
            x={offset}
            width={DOLL_ATLAS_WIDTH}
            height={DOLL_HEIGHT}
            preserveAspectRatio="none"
            clipPath={`url(#${id}-hands)`}
            filter={`url(#${id}-alpha)`}
          />
        )}
        {[0, 1, 2]
          .filter((variant) => accessoryEquipped(outfit.accessories, variant))
          .map((variant) => (
            <CartoonAccessory
              key={variant}
              characterId={character}
              variant={variant}
            />
          ))}
      </g>
    </g>
  );
}
