import { useId } from "react";
import { LayeredDoll, AvatarGarment } from "./LayeredDoll";
import {RedrawnPoseDoll} from './RedrawnPoseDoll';
import { FASHION_BASE } from "./base";
import type { AvatarLayers } from "./model";
import { avatarGarment } from "./catalog";
import { poseFit, poseSleeveArt } from "./pose-wardrobe";
import { RegisteredGarmentImage } from "./RegisteredGarmentImage";
const PATH = "/assets/avatar/poses/heart-hands-v3";
export const LEFT_REST_ARM =
  "M0 335H335Q315 450 335 535L350 610 310 700 240 800 230 1015H0Z";
/** Resting shoulders and arms are removed as a whole. Posed upper arms start behind the torso;
 * forearms and hands pass in front, using the same painted pose registration. */
export function HeartHandsDoll({layers}:{layers:AvatarLayers}){return <RedrawnPoseDoll layers={layers} pose="heart-hands"/>;}
/** Archived v3 compositor retained for source comparison. */
function LegacyHeartHandsDoll({ layers }: { layers: AvatarLayers }) {
  const id = useId(),
    scale = 1024 / 1774,
    offset = (480 - 887 * scale) / 2;
  const top = layers.top ? avatarGarment(layers.top) : null;
  const fit = poseFit(top, "heart-hands");
  const sleeve = fit?.kind === "sleeves";
  const arms = <image href={`${PATH}/arms.png`} width="887" height="1774" />;
  const posed =
    sleeve && top ? (
      <RegisteredGarmentImage
        pass="front"
        color={layers.colors?.[top.id]}
        detailColor={layers.detailColors?.[top.id]}
        art={poseSleeveArt(top, fit!)}
      />
    ) : (
      arms
    );
  return (
    <g
      data-avatar-pose="heart-hands"
      data-pose-registration="anatomical-v3"
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
          <path d={LEFT_REST_ARM} fill="black" />
          <path
            d={LEFT_REST_ARM}
            fill="black"
            transform="translate(887 0) scale(-1 1)"
          />
        </mask>
        <clipPath id={`${id}-foreground`}>
          <path d="M215 660L270 550 365 435 385 375H505L530 435 615 550 678 660Z" />
        </clipPath>
        <clipPath id={`${id}-hands`}>
          <path d="M350 502L375 440 385 375H505L520 440 540 502Z" />
        </clipPath>
        <clipPath id={`${id}-bare-shoulder`}>
          <rect x="0" y="330" width="887" height="58" />
        </clipPath>
        <clipPath id={`${id}-neckband`}>
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
      <g data-pose-part="upper-arms-back">
        {fit?.bareShoulders && (
          <g clipPath={`url(#${id}-bare-shoulder)`}>{arms}</g>
        )}
        {posed}
      </g>
      <g mask={`url(#${id}-rest)`}>
        <g transform={`scale(${1 / scale}) translate(${-offset} 0)`}>
          <LayeredDoll layers={layers} bodyBase={FASHION_BASE} />
        </g>
      </g>
      {fit?.neckband && top && (
        <g clipPath={`url(#${id}-neckband)`}>
          <AvatarGarment
            piece={top}
            pass="front"
            color={layers.colors?.[top.id]}
            detailColor={layers.detailColors?.[top.id]}
          />
        </g>
      )}
      <g clipPath={`url(#${id}-foreground)`} data-pose-part="forearms-front">
        {posed}
      </g>
      {sleeve && (
        <g clipPath={`url(#${id}-hands)`} data-pose-part="heart-hands-front">
          {arms}
        </g>
      )}
    </g>
  );
}
