import { useId } from "react";
import { DOLL_BASE, DOLL_ATLAS_WIDTH, DOLL_HEIGHT } from "./model";
import {
  morphologyGeometry,
  type MorphologyProposal,
} from "./morphology-proposals";

/** Comparative body proposal: Iris's identical source face/hands/feet plus
 * independently drawn anatomy. Never stretched from the old body image. */
export function MorphologyBody({
  profile,
  guides = false,
}: {
  profile: MorphologyProposal;
  guides?: boolean;
}) {
  const id = useId(),
    g = morphologyGeometry(profile);
  const skin = `url(#${id}-skin)`,
    limb = `url(#${id}-limb)`,
    cloth = `url(#${id}-underwear)`;
  const bodyParts = [g.leftLeg, g.rightLeg, g.leftArm, g.rightArm, g.torso];
  return (
    <g
      data-morphology-proposal={profile.id}
      data-identity="iris"
      data-status="awaiting-approval"
    >
      <defs>
        <linearGradient id={`${id}-skin`}>
          <stop stopColor="#bd6a47" />
          <stop offset=".18" stopColor="#d9875e" />
          <stop offset=".47" stopColor="#e49a6e" />
          <stop offset=".67" stopColor="#df9066" />
          <stop offset=".9" stopColor="#d38059" />
          <stop offset="1" stopColor="#b76a47" />
        </linearGradient>
        <linearGradient id={`${id}-limb`}>
          <stop stopColor="#bc704d" />
          <stop offset=".3" stopColor="#df9167" />
          <stop offset=".56" stopColor="#e89f75" />
          <stop offset=".78" stopColor="#df9066" />
          <stop offset="1" stopColor="#c87952" />
        </linearGradient>
        <linearGradient id={`${id}-underwear`} x2="0" y2="1">
          <stop stopColor="#cdb0ef" />
          <stop offset=".55" stopColor="#bda0e1" />
          <stop offset="1" stopColor="#a889ca" />
        </linearGradient>
        <radialGradient id={`${id}-belly`}>
          <stop stopColor="#f2b48b" stopOpacity=".5" />
          <stop offset="1" stopColor="#f2b48b" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-body`}>
          {bodyParts.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </clipPath>
        <clipPath id={`${id}-torso`}>
          <path d={g.torso} />
        </clipPath>
        <clipPath id={`${id}-briefs`}>
          <path d={g.briefs} />
        </clipPath>
        <clipPath id={`${id}-identity`}>
          <rect width="480" height="250" />
          <rect x="25" y="520" width="102" height="132" />
          <rect x="355" y="520" width="100" height="132" />
          <rect x="140" y="940" width="210" height="84" />
        </clipPath>
        <filter id={`${id}-alpha`} colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0 0 .6 1" />
          </feComponentTransfer>
        </filter>
        <filter id={`${id}-outline`} x="-2%" y="-2%" width="104%" height="104%">
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius=".8"
            result="expanded"
          />
          <feFlood floodColor="#aa6343" />
          <feComposite in2="expanded" operator="in" />
          <feComposite in2="SourceAlpha" operator="out" />
        </filter>
      </defs>
      <g filter={`url(#${id}-outline)`}>
        {bodyParts.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g>
        {bodyParts.slice(0, 4).map((d, i) => (
          <path key={i} d={d} fill={limb} />
        ))}
        <path d={g.torso} fill={skin} />
      </g>
      <g clipPath={`url(#${id}-body)`}>
        <ellipse
          cx="243"
          cy={profile.id === "O" ? 436 : 417}
          rx={profile.belly}
          ry="100"
          fill={`url(#${id}-belly)`}
        />
        <path
          d={`M${243 - profile.bust + 14} 328Q${243 - profile.waist + 8} 382 ${243 - profile.waist + 8} 418M${243 + profile.bust - 14} 328Q${243 + profile.waist - 8} 382 ${243 + profile.waist - 8} 418`}
          fill="none"
          stroke="#b97351"
          strokeWidth="3"
          opacity=".14"
        />
        <path
          d="M204 267Q226 263 240 274M246 274Q260 263 282 267"
          fill="none"
          stroke="#ae6a49"
          strokeWidth="1.2"
          opacity=".5"
        />
        <path
          d="M243 416q-3 7 0 11"
          fill="none"
          stroke="#a85e40"
          strokeWidth="1.5"
          opacity=".6"
        />
        <g
          fill={cloth}
          stroke="#80639f"
          strokeWidth="1.7"
          strokeLinejoin="round"
        >
          <path data-underwear="opaque-bandeau" d={g.bandeau} />
          <g clipPath={`url(#${id}-torso)`}>
            <path data-underwear="opaque-briefs" d={g.briefs} />
          </g>
        </g>
        <g clipPath={`url(#${id}-briefs)`}>
          <path d={g.torso} fill="none" stroke="#80639f" strokeWidth="1.7" />
        </g>
        <path
          d={`M${243 - profile.bust + 2} 322Q${243} 333 ${243 + profile.bust - 2} 322M${243 - profile.belly - 2} 453Q243 469 ${243 + profile.belly + 2} 453`}
          fill="none"
          stroke="#e2cafb"
          strokeWidth="2"
          opacity=".8"
        />
      </g>
      <image
        data-layer="unchanged-identity"
        href={DOLL_BASE}
        width={DOLL_ATLAS_WIDTH}
        height={DOLL_HEIGHT}
        preserveAspectRatio="none"
        clipPath={`url(#${id}-identity)`}
        filter={`url(#${id}-alpha)`}
      />
      {guides && (
        <g fill="#ffe1a4" stroke="#3d284c" strokeWidth="1.2">
          {[
            ...g.anchors.shoulders,
            ...g.anchors.waist,
            ...g.anchors.highHips,
            ...g.anchors.hips,
            ...g.anchors.wrists,
            ...g.anchors.knees,
            ...g.anchors.ankles,
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" />
          ))}
        </g>
      )}
    </g>
  );
}
