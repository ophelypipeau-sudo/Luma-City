import { useId } from "react";
import type { AvatarAppearance } from "./appearance";
import { BodyCoverage } from "./BodyCoverage";
import { CartoonGarment } from "./Wardrobe";
import {
  MORPH_BODY_WIDTH,
  MORPH_BODY_HEIGHT,
  MORPH_OFFSET_X,
  MORPH_SCALE,
  morphologyFit,
} from "./morphology-fits";
import {
  isPilotEquipped,
  unsupportedPilotPieces,
  type PilotSlot,
} from "./pilot";

export type PilotInspection = "normal" | "body-cutaway" | "garments";
export function MorphologyDoll({
  appearance,
  inspection = "normal",
}: {
  appearance: AvatarAppearance;
  inspection?: PilotInspection;
}) {
  const id = useId();
  if (appearance.body.kind !== "morphology")
    throw new Error("A morphology is required");
  if (appearance.identity.characterId !== "iris")
    throw new Error("The six approved pilot illustrations belong to Iris");
  const missing = unsupportedPilotPieces(appearance);
  if (missing.length)
    throw new Error(`Uncalibrated pilot pieces: ${missing.join(", ")}`);
  const morphology = appearance.body.morphologyId;
  const fit = morphologyFit(morphology);
  return (
    <g
      data-avatar-version="cartoon-v6-morphology-pilot"
      data-morphology={morphology}
      transform={`translate(${MORPH_OFFSET_X} 0) scale(${MORPH_SCALE})`}
    >
      <defs>
        <clipPath id={`${id}-forearms`}>
          <path d={fit.forearms} />
        </clipPath>
        <clipPath id={`${id}-skirt-overlap`}>
          <path d={fit.skirt} />
        </clipPath>
        <filter id={`${id}-alpha`} colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0 0 .6 1" />
          </feComponentTransfer>
        </filter>
        <mask
          id={`${id}-body`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={MORPH_BODY_WIDTH}
          height={MORPH_BODY_HEIGHT}
        >
          <rect
            width={MORPH_BODY_WIDTH}
            height={MORPH_BODY_HEIGHT}
            fill="white"
          />
          <BodyCoverage
            characterId="iris"
            morphology={morphology}
            equipment={appearance.equipped}
          />
        </mask>
      </defs>
      {inspection === "normal" &&
        isPilotEquipped(appearance.equipped, "shoes") && (
          <CartoonGarment
            characterId="iris"
            morphology={morphology}
            category="shoes"
            variant={0}
            pass="back"
          />
        )}
      {inspection !== "garments" && (
        <image
          data-layer="body"
          href={`/assets/morphology-v6/${morphology}.png`}
          width={MORPH_BODY_WIDTH}
          height={MORPH_BODY_HEIGHT}
          preserveAspectRatio="xMidYMid meet"
          filter={`url(#${id}-alpha)`}
          mask={`url(#${id}-body)`}
        />
      )}
      {inspection !== "body-cutaway" &&
        (["bottoms", "shoes", "tops"] as PilotSlot[])
          .filter((slot) => isPilotEquipped(appearance.equipped, slot))
          .map((slot) => (
            <CartoonGarment
              key={slot}
              characterId="iris"
              morphology={morphology}
              category={slot}
              variant={0}
              pass="front"
            />
          ))}
      {inspection !== "garments" &&
        isPilotEquipped(appearance.equipped, "bottoms") && (
          <g clipPath={`url(#${id}-skirt-overlap)`} data-layer="forearms-front">
            <image
              href={`/assets/morphology-v6/${morphology}.png`}
              width={MORPH_BODY_WIDTH}
              height={MORPH_BODY_HEIGHT}
              preserveAspectRatio="xMidYMid meet"
              clipPath={`url(#${id}-forearms)`}
              filter={`url(#${id}-alpha)`}
            />
          </g>
        )}
    </g>
  );
}
