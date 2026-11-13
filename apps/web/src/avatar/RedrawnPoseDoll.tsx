import { useId } from "react";
import { TextileGarment } from "./TextileGarment";
import { clothingLayerOrder, type AvatarLayers } from "./model";
import { avatarGarment, type AvatarSlot, type Garment } from "./catalog";
import { LayeredDoll, AvatarGarment } from "./LayeredDoll";
import { FASHION_BASE } from "./base";
import { poseFit, poseSleeveArt } from "./pose-wardrobe";
import { RegisteredGarmentImage } from "./RegisteredGarmentImage";
import { restingArmMask } from "../../../../packages/domain/src/avatar-pattern";
const ROOT = "/assets/avatar/poses/redraw-v4";
/** The original body and hands stay fixed. Sleeve artwork is drawn separately
 * on each actual pose rather than warped from the frontal illustration. */
export function RedrawnPoseDoll({
  layers,
  pose,
}: {
  layers: AvatarLayers;
  pose: "heart-hands" | "hand-on-hip";
}) {
  const id = useId(),
    heart = pose === "heart-hands",
    scale = 1024 / 1774,
    offset = (480 - 887 * scale) / 2;
  const variants = [...clothingLayerOrder(layers)].reverse().flatMap((slot) => {
    if (slot === "bottom") return [];
    const piece = layers[slot] ? avatarGarment(layers[slot]!) : null,
      fit = poseFit(piece, pose);
    return piece &&
      (fit?.kind === "sleeves" || fit?.kind === "procedural") &&
      fit.replaceTop
      ? [
          {
            piece: { ...piece, slot },
            fit,
            art:
              fit.kind === "procedural" ? piece.art : poseSleeveArt(piece, fit),
          },
        ]
      : [];
  });
  const outer = variants.at(-1),
    sleeved = !!outer;
  const burgundyCuffs =
    outer?.piece.pattern?.cut === "redrawn:burgundy-contour-v2";
  const imageSleeves = outer?.fit.kind === "sleeves";
  const cuffRims = imageSleeves
    ? (outer.fit.sleeves?.cuffRim ??
      (burgundyCuffs
        ? heart
          ? "M309 443L343 466 333 479 307 454Z M578 443L544 466 554 479 580 454Z"
          : "M600 654L644 676 633 688 591 668Z"
        : heart
          ? "M306 446L337 469 329 487 297 461Z M581 446L550 469 558 487 590 461Z"
          : "M598 655L645 672 636 690 591 674Z"))
    : undefined;
  const hipHandOffset =
    !heart && cuffRims && !outer?.fit.sheerSleeves
      ? (outer?.fit.sleeves?.hipHandOffset ??
        (burgundyCuffs ? [0, 0] : [5, -4]))
      : undefined;
  const top = layers.top ? avatarGarment(layers.top) : null;
  const fittedBody = !heart && top?.fittingBody?.["hand-on-hip"];
  const fittedHand = fittedBody && top?.fittingHipHand;
  const canonicalSleeves = outer?.fit.canonicalSleeveUnderlay === true;
  const straplessBase = !sleeved && top?.underwearCut === "strapless";
  const shortSleeved =
    outer?.piece.art.kind === "vector" &&
    outer.piece.art.textile === "punk-polo";
  const paintedShortSleeves = outer?.fit.shortSleeves === true;
  const overrides = Object.fromEntries(
    variants.map((v) => [v.piece.slot, v.art]),
  );
  const hidden = [
    ...variants.map((v) => v.piece.slot),
    "belt",
    "bag",
    "hair",
    "headwear",
    "necklace",
    "tie",
    "earrings",
  ];
  const accessories = (slot: AvatarSlot, pass: "front" | "back" = "front") => {
    if (!layers[slot]) return null;
    let piece = avatarGarment(layers[slot]!);
    if (
      slot === "bag" &&
      heart &&
      piece.handCarry &&
      piece.art.kind === "image"
    )
      piece = {
        ...piece,
        art: {
          ...piece.art,
          front: piece.handCarry.shoulder,
          colorMasks: piece.art.colorMasks && {
            ...piece.art.colorMasks,
            main: piece.handCarry.shoulderMask ?? piece.art.colorMasks.main,
          },
        },
      };
    return (
      <g data-layer={slot} data-piece={piece.id}>
        <AvatarGarment
          piece={piece}
          pass={pass}
          color={layers.colors?.[piece.id]}
          detailColor={layers.detailColors?.[piece.id]}
        />
      </g>
    );
  };
  const posedTops = variants.map((v) => (
    <g
      data-pose-part="redrawn-top"
      data-layer={v.piece.slot}
      data-piece={v.piece.id}
      key={v.piece.id}
    >
      {v.piece.art.kind === "vector" && v.piece.art.textile ? (
        <TextileGarment
          cut={v.piece.art.textile}
          pose={pose}
          color={layers.colors?.[v.piece.id]}
          detailColor={layers.detailColors?.[v.piece.id]}
        />
      ) : (
        <RegisteredGarmentImage
          pass="front"
          art={v.art as Extract<Garment["art"], { kind: "image" }>}
          color={layers.colors?.[v.piece.id]}
          detailColor={layers.detailColors?.[v.piece.id]}
        />
      )}
    </g>
  ));
  const belt = layers.belt ? avatarGarment(layers.belt) : null,
    beltFit = layers.bottom ? avatarGarment(layers.bottom).beltFit : undefined;
  const bare = (
    <image
      href={
          shortSleeved || paintedShortSleeves || straplessBase || canonicalSleeves
          ? heart
            ? "/assets/avatar/poses/redraw-v4/heart-arms.png"
            : "/assets/avatar/poses/hand-on-hip-v3/bare-arm.png"
          : `/assets/avatar/redrawn-v1/body-${pose}.png`
      }
      width="887"
      height="1774"
    />
  );
  return (
    <g
      data-avatar-pose={pose}
      data-pose-registration="anatomical-redraw-v4"
      transform={`translate(${offset} 0) scale(${scale})`}
    >
      <defs>
        <mask
          id={`${id}-rest`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="887"
          height="1774"
        >
          <rect width="887" height="1774" fill="white" />
          {heart ? (
            <>
              <path d={restingArmMask("left")} fill="black" />
              <path d={restingArmMask("right")} fill="black" />
            </>
          ) : (
            <path d={restingArmMask("right")} fill="black" />
          )}
        </mask>
        <clipPath id={`${id}-front`}>
          <path
            d={
              heart
                ? "M208 600L311 440 362 350H522L574 440 679 600 665 670H215Z"
                : "M485 650H565L634 676 641 714 601 748 551 775H485Z"
            }
          />
        </clipPath>
        <clipPath id={`${id}-shoulders`}>
          <rect
            x="0"
            y="330"
            width="887"
            height={
              outer?.piece.pattern?.cut === "redrawn:burgundy-contour-v2"
                ? 78
                : 70
            }
          />
        </clipPath>
        {outer?.fit.sheerSleeves && (
          <clipPath id={`${id}-sheer-arms`}>
            <path d="M0 342H346L328 505 304 595 276 680 240 860H0Z M887 342H541L559 505 583 595 611 680 647 860H887Z" />
          </clipPath>
        )}
        <clipPath id={`${id}-sleeves-front`}>
          <path
            d={
              heart
                ? "M208 600L311 440 362 350H522L574 440 679 600 665 670H215Z"
                : "M535 330H645L780 520V605L640 750 575 720 630 625 679 551 555 455Z"
            }
          />
        </clipPath>
        {heart && paintedShortSleeves && (
          <clipPath id={`${id}-short-forearms`}>
            <path d="M209 625 Q204 575 247 541 Q295 500 315 448 Q343 421 362 378 L396 354 H491 L525 378 Q544 421 571 448 Q592 500 640 541 Q683 575 678 625 L671 660 H216Z" />
          </clipPath>
        )}
        {cuffRims && (
          <clipPath id={`${id}-cuff-rims`}>
            <path d={cuffRims} />
          </clipPath>
        )}
        {variants.flatMap(
          (v, n) =>
            v.fit.bodyReveals?.map((d, k) => (
              <clipPath id={`${id}-reveal-${n}-${k}`} key={`${n}-${k}`}>
                <path d={d} />
              </clipPath>
            )) ?? [],
        )}
      </defs>
      {accessories("hair", "back")}
      {!fittedBody && (
        <g
          data-pose-part="upper-arms-back"
          clipPath={
            sleeved && !shortSleeved && !paintedShortSleeves && !canonicalSleeves
              ? `url(#${id}-shoulders)`
              : undefined
          }
        >
          {outer?.piece.pattern?.cut === "redrawn:burgundy-contour-v2" ? (
            <image
              href="/assets/avatar/leopard-v1/underwear-strapless.png"
              width="887"
              height="1774"
            />
          ) : (
            bare
          )}
        </g>
      )}
      <g data-pose-part="unchanged">
        <g transform={`scale(${1 / scale}) translate(${-offset} 0)`}>
          <LayeredDoll
            layers={layers}
            bodyBase={FASHION_BASE}
            artOverrides={overrides}
            hiddenSlots={hidden}
            presentationPose={pose}
            restMask={`${id}-rest`}
          />
        </g>
      </g>
      {outer?.fit.sheerSleeves && (
        <g clipPath={`url(#${id}-sheer-arms)`} data-pose-part="skin-under-lace">
          {bare}
        </g>
      )}
      {posedTops}
      {variants.flatMap(
        (v, n) =>
          v.fit.bodyReveals?.map((d, k) => (
            <image
              href={FASHION_BASE.src}
              width="887"
              height="1774"
              clipPath={`url(#${id}-reveal-${n}-${k})`}
              data-pose-part="canonical-skin-opening"
              key={`${n}-${k}`}
            />
          )) ?? [],
      )}
      {belt && (
        <g
          data-layer="belt"
          data-piece={belt.id}
          transform={`translate(443.5 ${beltFit?.offsetY ?? -8}) scale(${beltFit?.scaleX ?? 0.92} 1) translate(-443.5 0)`}
        >
          <AvatarGarment
            piece={belt}
            pass="front"
            color={layers.colors?.[belt.id]}
            detailColor={layers.detailColors?.[belt.id]}
          />
        </g>
      )}
      {accessories("bag")}
      {accessories("necklace")}
      {accessories("tie")}
      {shortSleeved && <g clipPath={`url(#${id}-front)`}>{bare}</g>}
      {heart && paintedShortSleeves && (
        <g clipPath={`url(#${id}-short-forearms)`} data-pose-part="short-forearms">
          {bare}
        </g>
      )}
      {sleeved ? (
        (!fittedBody || outer?.piece.slot === "outerwear") &&
        !shortSleeved && !paintedShortSleeves && !canonicalSleeves && (
          <g clipPath={`url(#${id}-sleeves-front)`}>{posedTops}</g>
        )
      ) : (
        <g clipPath={`url(#${id}-front)`} data-pose-part="forearms-front">
          {bare}
        </g>
      )}
      {sleeved ? (
        <image
          href={
            heart && (paintedShortSleeves || canonicalSleeves)
              ? "/assets/avatar/poses/canonical-hands-v1/heart-hands.png"
              : heart && (imageSleeves || outer?.fit.kind === "procedural")
              ? outer?.fit.kind === "procedural"
                ? "/assets/avatar/poses/canonical-hands-v1/heart-hands.png"
                : "/assets/avatar/burgundy-cut-v2/heart-hands-clean.png"
              : fittedHand || `${ROOT}/${heart ? "heart-hands" : "hip-hand"}.png`
          }
          width="887"
          height="1774"
          transform={
            hipHandOffset ? `translate(${hipHandOffset.join(" ")})` : undefined
          }
          data-pose-part={heart ? "heart-hands-front" : "hand"}
        />
      ) : (
        !heart && (
          <image
            href={fittedHand || `${ROOT}/hip-hand.png`}
            width="887"
            height="1774"
            data-pose-part="hand"
          />
        )
      )}
      {!heart && layers.bag && avatarGarment(layers.bag).handCarry && (
        <image
          data-pose-part="closed-bag-grip"
          href={avatarGarment(layers.bag).handCarry!.hand}
          width="887"
          height="1774"
        />
      )}
      {outer?.piece.art.kind === "vector" && outer.piece.art.textile && (
        <TextileGarment
          cut={outer.piece.art.textile}
          pose={pose}
          color={layers.colors?.[outer.piece.id]}
          pass="cuffs"
        />
      )}
      {cuffRims && (
        <g
          data-pose-part="cuffs-over-wrists"
          clipPath={`url(#${id}-cuff-rims)`}
        >
          {posedTops}
        </g>
      )}
      {accessories("hair")}
      {accessories("earrings")}
      {accessories("headwear")}
    </g>
  );
}
