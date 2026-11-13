import { useId } from "react";
import {RedrawnPoseDoll} from './RedrawnPoseDoll';
import { LayeredDoll, AvatarGarment } from "./LayeredDoll";
import { FASHION_BASE } from "./base";
import type { AvatarLayers } from "./model";
import { RegisteredGarmentImage } from "./RegisteredGarmentImage";
import { poseFit, poseSleeveArt } from "./pose-wardrobe";
import { avatarGarment } from "./catalog";
import { HIP_POSE_ASSETS, armSegmentTransform } from "./hip-pose";

// Partition follows the outside arm and the axillary crease, never the torso.
export const HIP_ARM_REGION =
  "M535 341 Q622 325 653 413 L680 560 L725 650 L764 800 L817 870 L820 1010 L690 1010 L675 835 L660 800 L640 750 L625 725 L610 700 L600 675 L592 650 L586 625 L581 600 L573 575 L565 550 L556 525 L554 500 L560 475 L563 440 L550 400Z";

/** A presentation pose for the rail only. FittingAvatar never uses this rig.
 * The canonical body stays intact. Calibrated sleeve and hand drawings use the
 * approved preview pose. Clothing and the belt never choose the body pose. */
export type HipRigPart = "body" | "arm" | "belt" | "hand";
export function HandOnHipDoll({
  layers,
  rigPart,
}: {
  layers: AvatarLayers;
  rigPart?: HipRigPart;
}) {
  const drawBody = !rigPart || rigPart === "body";
  const drawArm = !rigPart || rigPart === "arm";
  const id = useId(),
    scale = 1024 / 1774,
    offset = (480 - 887 * scale) / 2;
  const top = layers.top ? avatarGarment(layers.top) : null;
  const fit = poseFit(top, "hand-on-hip");
  const sleeve = fit?.kind === "sleeves" ? fit.sleeves : undefined;
  const belt = layers.belt ? avatarGarment(layers.belt) : null;
  const beltFit = layers.bottom
    ? avatarGarment(layers.bottom).beltFit
    : undefined;
  const sleeveless = !top || fit?.kind === "bare-arms";
  const colors = {
    color: top ? layers.colors?.[top.id] : undefined,
    detailColor: top ? layers.detailColors?.[top.id] : undefined,
  };
  if(!rigPart)return <RedrawnPoseDoll layers={layers} pose="hand-on-hip"/>;
  return (
    <g
      data-avatar-pose="hand-on-hip"
      transform={`translate(${offset} 0) scale(${scale})`}
    >
      <defs>
        <g id={`${id}-source`}>
          <g transform={`scale(${1 / scale}) translate(${-offset} 0)`}>
            <LayeredDoll
              layers={rigPart ? { ...layers, belt: null } : layers}
              bodyBase={FASHION_BASE}
            />
          </g>
        </g>
        <mask
          id={`${id}-rest`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="887"
          height="1774"
        >
          <rect width="887" height="1774" fill="white" />
          <path d={HIP_ARM_REGION} fill="black" />
        </mask>
        <clipPath id={`${id}-upper-sleeve`}>
          <path d="M535 341Q630 335 656 440L676 610H583L563 530 551 425Z" />
        </clipPath>
        <clipPath id={`${id}-lower-sleeve`}>
          <path d="M583 610H676L760 850 680 870Z" />
        </clipPath>
        <clipPath id={`${id}-bare-shoulder`}>
          <rect x="500" y="330" width="300" height="65" />
        </clipPath>
        <clipPath id={`${id}-folded-neckband`}>
          {fit?.neckband && (
            <rect
              x={fit.neckband[0]}
              y={fit.neckband[1]}
              width={fit.neckband[2]}
              height={fit.neckband[3]}
            />
          )}
        </clipPath>
      </defs>
      {drawArm && (!sleeve || fit?.bareShoulders) && (
        <image
          href={`${HIP_POSE_ASSETS}/bare-arm.png`}
          width="887"
          height="1774"
          data-pose-part="bare-arm"
          clipPath={
            fit?.bareShoulders ? `url(#${id}-bare-shoulder)` : undefined
          }
        />
      )}
      {drawBody && (
        <use
          href={`#${id}-source`}
          mask={`url(#${id}-rest)`}
          data-pose-part="unchanged"
        />
      )}
      {drawBody && top && sleeveless && (
        <g data-pose-part="sleeveless-top">
          <AvatarGarment piece={top} {...colors} pass="front" />
        </g>
      )}
      {drawArm && top && sleeve && (
        <g data-pose-part="bent-sleeve">
          <RegisteredGarmentImage
            pass="front"
            color={colors.color}
            detailColor={colors.detailColor}
            art={poseSleeveArt(top, fit!)}
          />
        </g>
      )}
      {drawBody && top && fit?.neckband && (
        <g
          clipPath={`url(#${id}-folded-neckband)`}
          data-pose-part="neckband-front"
        >
          <AvatarGarment piece={top} {...colors} pass="front" />
        </g>
      )}
      {drawArm && top && !sleeveless && !sleeve && (
        <g data-pose-part="rigged-sleeve">
          {[
            {
              part: "upper",
              fromA: [572, 370],
              fromB: [625, 610],
              toA: [572, 370],
              toB: [744, 550],
            },
            {
              part: "lower",
              fromA: [625, 610],
              fromB: [718, 837],
              toA: [744, 550],
              toB: [630, 696],
            },
          ].map((segment) => (
            <g
              key={segment.part}
              transform={armSegmentTransform(
                segment.fromA,
                segment.fromB,
                segment.toA,
                segment.toB,
              )}
            >
              <g clipPath={`url(#${id}-${segment.part}-sleeve)`}>
                <AvatarGarment piece={top} {...colors} pass="front" />
              </g>
            </g>
          ))}
        </g>
      )}
      {rigPart === "belt" && belt && (
        <g
          data-layer="belt"
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
      {(!rigPart || rigPart === "hand") && (
        <image
          href="/assets/avatar/poses/hand-on-hip-lilac-v2/hand.png"
          width="887"
          height="1774"
          data-pose-part="hand"
        />
      )}
    </g>
  );
}
