import { DEFAULT_LAYERS, hairHeadroom, type AvatarLayers } from "./avatar/model";
import { FASHION_BASE } from "./avatar/base";
import { CartoonDoll } from "./cartoon/CartoonDoll";
import { ORIGINAL_OUTFIT } from "./shop/catalog";
import { DOLL_WIDTH, DOLL_HEIGHT, dollId } from "./cartoon/model";
import { HandOnHipDoll } from "./avatar/HandOnHipDoll";
import { HeartHandsDoll } from "./avatar/HeartHandsDoll";
import { outfitSupportsPose } from "./avatar/pose-compatibility";
import { readAvatarLayers } from "./avatar/worn-outfits";
import type { WornOutfit } from "../../../packages/contracts/src/index";
type AvatarProps = {
  id?: string;
  color?: string;
  hair?: string;
  variant?: number;
  layers?: AvatarLayers;
  outfit?: WornOutfit | null;
};
function identity({ id, color, variant = 0 }: AvatarProps) {
  if (id) return dollId(id);
  return color === "#db9574"
    ? "june"
    : color === "#6487ba"
      ? "noa"
      : color === "#518b81"
        ? "milo"
        : variant % 2
          ? "milo"
          : "iris";
}
export function Avatar(props: AvatarProps) {
  const character = identity(props);
  const layers = character === "iris"
    ? props.layers ?? readAvatarLayers(props.outfit) ?? DEFAULT_LAYERS
    : undefined;
  const headroom = hairHeadroom(layers);
  return (
    <g>
      <ellipse cx="0" cy="2" rx="23" ry="6" fill="#40344a" opacity=".13" />
      <svg
        x="-44"
        y="-184"
        width="88"
        height="188"
        viewBox={`0 ${-headroom} ${DOLL_WIDTH} ${DOLL_HEIGHT + headroom}`}
        preserveAspectRatio="xMidYMax meet"
        overflow="hidden"
        aria-hidden="true"
      >
        <CartoonDoll
          characterId={character}
          outfit={ORIGINAL_OUTFIT}
          layers={layers}
          bodyBase={character === "iris" ? FASHION_BASE : undefined}
        />
      </svg>
    </g>
  );
}
export function Portrait({
  fullBody = false,
  onClick,
  pose: requestedPose = "front",
  ...props
}: AvatarProps & {
  fullBody?: boolean;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
  pose?: "front" | "hand-on-hip" | "heart-hands";
}) {
  const layers = props.layers ?? readAvatarLayers(props.outfit) ?? DEFAULT_LAYERS;
  const headroom = identity(props) === "iris" ? hairHeadroom(layers) : 0;
  const pose = outfitSupportsPose(layers, requestedPose)
    ? requestedPose
    : "front";
  return (
    <svg
      className={
        fullBody
          ? "avatar-illustration full-body"
          : "avatar-illustration face-crop"
      }
      viewBox={fullBody ? `0 ${-headroom} ${DOLL_WIDTH} ${DOLL_HEIGHT + headroom}` : `115 ${-headroom} 260 ${270 + headroom}`}
      preserveAspectRatio={fullBody ? "xMidYMax meet" : "xMidYMid meet"}
      overflow="hidden"
      aria-hidden="true"
      onClick={onClick}
      data-pose-pending={pose !== requestedPose ? requestedPose : undefined}
    >
      {fullBody && pose === "heart-hands" && identity(props) === "iris" ? (
        <HeartHandsDoll layers={layers} />
      ) : fullBody && pose === "hand-on-hip" && identity(props) === "iris" ? (
        <HandOnHipDoll layers={layers} />
      ) : (
        <CartoonDoll
          characterId={identity(props)}
          outfit={ORIGINAL_OUTFIT}
          layers={
            identity(props) === "iris"
              ? layers
              : undefined
          }
          bodyBase={identity(props) === "iris" ? FASHION_BASE : undefined}
        />
      )}
    </svg>
  );
}
