import { useEffect, useId, useState } from "react";
import { HandOnHipDoll } from "./HandOnHipDoll";
import type { AvatarLayers } from "./model";

/** A smooth displacement confined to the chest. The arm rig is deliberately not
 * used: wrists, elbow silhouettes, face, belt and feet keep the approved pose.
 * The already composed drawing is displaced, so skin/coverage/cloth stay aligned. */
export function BreathingDoll({ layers }: { layers: AvatarLayers }) {
  const id = useId();
  const [reduced, setReduced] = useState(
    () =>
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  if (reduced) return <HandOnHipDoll layers={layers} />;
  // Logical 480 x 1024 space. Only the interior of the torso receives displacement.
  // sRGB is essential: 50% grey must remain neutral, outside the chest.
  const map =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="1024"><defs><radialGradient id="chest"><stop stop-color="rgb(50%,0%,50%)"/><stop offset=".35" stop-color="rgb(50%,0%,50%)"/><stop offset="1" stop-color="rgb(50%,50%,50%)"/></radialGradient></defs><rect width="480" height="1024" fill="rgb(50%,50%,50%)"/><ellipse cx="240" cy="300" rx="65" ry="95" fill="url(#chest)"/></svg>',
    );
  return (
    <g data-avatar-animation="breathing" data-animation-period="4.8">
      <defs>
        <filter
          id={`${id}-breathing`}
          filterUnits="userSpaceOnUse"
          primitiveUnits="userSpaceOnUse"
          x="-20"
          y="0"
          width="520"
          height="1024"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={map}
            x="0"
            y="0"
            width="480"
            height="1024"
            result="breath-field"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="breath-field"
            xChannelSelector="R"
            yChannelSelector="G"
            scale="0"
          >
            <animate
              attributeName="scale"
              values="0;14;0"
              dur="4.8s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;.45;1"
              keySplines=".42 0 .58 1;.42 0 .58 1"
            />
          </feDisplacementMap>
        </filter>
      </defs>
      <g filter={`url(#${id}-breathing)`}>
        <HandOnHipDoll layers={layers} />
      </g>
    </g>
  );
}

