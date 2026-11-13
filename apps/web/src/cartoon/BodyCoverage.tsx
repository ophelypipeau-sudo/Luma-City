import type { Outfit } from "../shop/catalog";
import {
  garmentOutline,
  camisoleStraps,
  leftBoot,
  rightBoot,
  bootCuffs,
  sneakers,
  shoeBodyCutouts,
} from "./geometry";
import { isFemale } from "./model";
import type { MorphologyId } from "./model";
import type { Equipment } from "./appearance";
import { morphologyFit } from "./morphology-fits";
import { isPilotEquipped } from "./pilot";

/** Coverage is independent of cloth opacity/texture. It erases the source body,
 * including underwear, using the very same outlines as the rendered garments. */
export function BodyCoverage({
  characterId,
  outfit,
  morphology,
  equipment,
}: {
  characterId: string;
  outfit?: Outfit;
  morphology?: MorphologyId;
  equipment?: Equipment;
}) {
  if (morphology && equipment) {
    const f = morphologyFit(morphology);
    return (
      <g fill="black" data-layer="body-coverage" data-morphology={morphology}>
        {isPilotEquipped(equipment, "tops") && (
          <>
            <path d={f.top} />
            <path d={f.straps} />
          </>
        )}
        {isPilotEquipped(equipment, "bottoms") && <path d={f.skirt} />}
        {isPilotEquipped(equipment, "shoes") &&
          f.boots.map((b, i) => (
            <g key={i}>
              <path d={b.front} />
              <path d={b.cuff} />
              <path d={b.clear} />
            </g>
          ))}
      </g>
    );
  }
  if (!outfit) return null;
  return (
    <g fill="black" data-layer="body-coverage">
      {outfit.tops >= 0 && (
        <g data-slot="tops">
          <path d={garmentOutline(characterId, "tops")} />
          {characterId === "iris" && <path d={camisoleStraps} />}
        </g>
      )}
      {outfit.bottoms >= 0 && (
        <path data-slot="bottoms" d={garmentOutline(characterId, "bottoms")} />
      )}
      {outfit.shoes >= 0 && (
        <g data-slot="shoes">
          {isFemale(characterId) ? (
            <>
              <path d={leftBoot} />
              <path d={rightBoot} />
              <path d={bootCuffs} />
            </>
          ) : (
            <path d={sneakers} />
          )}
          {shoeBodyCutouts(characterId).map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      )}
    </g>
  );
}
