import {
  isPunkCut,
  type PunkCut,
} from "../../../../packages/domain/src/punk-pattern";
import { PunkGarment } from "./PunkGarment";
import { TEXTILE_MATERIALS } from "../../../../packages/domain/src/textile-material";
import { useId } from "react";
import { TextileDrapery } from "./TextileDrapery";
import {
  textilePattern,
  TEXTILE_COLORS,
  type TextileCut,
} from "../../../../packages/domain/src/textile-pattern";
import type { Pose } from "../../../../packages/domain/src/avatar-pattern";
/** Live material channels: colour, woven grain, broad volume, local folds and
 * protected stitching. A dye changes only the base fill, never seam geometry. */
export function TextileGarment({
  cut,
  pose = "front",
  color,
  detailColor,
  pass = "all",
}: {
  cut: TextileCut | PunkCut;
  pose?: Pose;
  color?: string;
  detailColor?: string;
  pass?: "all" | "cuffs";
}) {
  const id = useId();
  if (isPunkCut(cut))
    return (
      <PunkGarment
        cut={cut}
        pose={pose}
        color={color}
        detailColor={detailColor}
        pass={pass}
      />
    );
  const g = textilePattern(cut, pose),
    knit = cut === "cropped-knit",
    material = TEXTILE_MATERIALS[cut];
  const dye =
    color && /^#[0-9a-f]{6}$/i.test(color) ? color : TEXTILE_COLORS[cut];
  const shape = (d: string, mirror = false, key = "", outline = true) => (
    <g
      key={key}
      transform={mirror ? "translate(887 0) scale(-1 1)" : undefined}
    >
      <path d={d} fill={dye} />
      <path d={d} fill={`url(#${id}-volume)`} />
      <path d={d} fill={`url(#${id}-weave)`} />
      <path
        d={d}
        fill="none"
        stroke={outline ? "#211c20" : "none"}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  );
  return (
    <g
      data-textile-cut={cut}
      data-textile-pose={pose}
      data-textile-material={knit ? "soft-knit" : "cotton-twill"}
    >
      <defs>
        <linearGradient id={`${id}-volume`}>
          <stop stopColor="#000" stopOpacity=".4" />
          <stop offset=".24" stopColor="#fff" stopOpacity=".09" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".015" />
          <stop offset=".76" stopColor="#fff" stopOpacity=".12" />
          <stop offset="1" stopColor="#000" stopOpacity=".4" />
        </linearGradient>
        <linearGradient id={`${id}-fold`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#000" stopOpacity=".02" />
          <stop offset=".65" stopColor="#000" stopOpacity=".3" />
          <stop offset="1" stopColor="#fff" stopOpacity=".06" />
        </linearGradient>
        <pattern
          id={`${id}-weave`}
          width={material.width}
          height={material.height}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={material.path}
            fill="none"
            stroke="#fff"
            strokeOpacity={material.opacity}
            strokeWidth={material.strokeWidth}
          />
        </pattern>
        <radialGradient id={`${id}-soft`}>
          <stop stopColor="#000" stopOpacity=".28" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-body`}>
          <path d={g.body} />
        </clipPath>
      </defs>
      {pass !== "cuffs" && (
        <>
          {g.sleeves.map((s, i) => shape(s.d, "mirror" in s, `s${i}`))}
          {shape(g.body)}
          <g clipPath={`url(#${id}-body)`}>
            <g fill={`url(#${id}-soft)`}>
              {knit ? (
                <>
                  <ellipse cx="320" cy="545" rx="48" ry="160" />
                  <ellipse cx="565" cy="530" rx="40" ry="150" />
                  <ellipse cx="443" cy="631" rx="180" ry="26" />
                </>
              ) : (
                <>
                  <ellipse cx="288" cy="852" rx="38" ry="110" />
                  <ellipse cx="600" cy="852" rx="38" ry="110" />
                  <ellipse cx="443" cy="882" rx="40" ry="70" />
                </>
              )}
            </g>
            {g.folds.map((d, i) => (
              <g key={i}>
                <path
                  d={d}
                  fill="none"
                  stroke="#120e12"
                  strokeOpacity=".25"
                  strokeWidth="2.4"
                />
                <path
                  d={d}
                  transform="translate(0 2)"
                  fill="none"
                  stroke="#fff"
                  strokeOpacity=".09"
                  strokeWidth="1.6"
                />
              </g>
            ))}
          </g>
          <g
            data-textile-channel="protected-seams"
            fill="none"
            stroke="#292228"
            strokeWidth="1.6"
            strokeOpacity=".78"
          >
            {g.seams.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          {g.forearms.map((s, i) => shape(s.d, "mirror" in s, `f${i}`, false))}
          {g.sleeveFolds.map((s, i) => (
            <g
              key={i}
              transform={
                "mirror" in s ? "translate(887 0) scale(-1 1)" : undefined
              }
              fill="none"
            >
              <path
                d={s.d}
                stroke="#161216"
                strokeOpacity=".45"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d={s.d}
                transform="translate(0 2)"
                stroke="#fff"
                strokeOpacity=".06"
                strokeWidth="1.5"
              />
            </g>
          ))}
          <TextileDrapery cut={cut} pose={pose} />
          {!knit && (
            <g data-textile-channel="hardware">
              <circle
                cx="451"
                cy="726"
                r="6.5"
                fill="#aaa5a0"
                stroke="#302c30"
                strokeWidth="2"
              />
              <circle cx="451" cy="726" r="2" fill="#4c4949" />
            </g>
          )}
          {knit && (
            <>
              {shape("M400 311Q443 319 487 311 L493 351 Q443 379 394 351Z")}
              <path
                d="M400 325Q443 343 489 326M397 340Q444 361 491 341"
                fill="none"
                stroke="#131114"
                strokeOpacity=".5"
                strokeWidth="2"
              />
            </>
          )}
        </>
      )}
      <g data-textile-channel="cuffs">
        {g.cuffs.map((s, i) => (
          <g
            key={i}
            transform={
              "mirror" in s ? "translate(887 0) scale(-1 1)" : undefined
            }
          >
            {shape(s.d)}
            <path d={s.d} fill="#000" opacity=".12" />
          </g>
        ))}
      </g>
    </g>
  );
}
