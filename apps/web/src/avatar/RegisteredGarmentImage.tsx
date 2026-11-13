import { MaterialTintFilter } from "./MaterialTintFilter";
import { useRegisteredTexture } from "./useRegisteredTexture";
import { useId } from "react";
import { AVATAR_BASE } from "./base";
import type { Garment, GarmentPass } from "./catalog";

type ImageArt = Extract<Garment["art"], { kind: "image" }>;
const W = AVATAR_BASE.width,
  H = AVATAR_BASE.height;

/** Cloth registration only. The body never passes through this mapping. */
function position(art: ImageArt, x: number, y: number): [number, number] {
  const bands = art.bands ?? [{ sourceY: 0, sourceHeight: H, y: 0, height: H }];
  const band =
    bands.find((b) => y >= b.sourceY && y <= b.sourceY + b.sourceHeight) ??
    bands[0];
  const stops = art.widthStops;
  let sx = art.scaleX ?? 1;
  if (stops?.length) {
    const upper = stops.findIndex((s) => s.y >= y);
    if (upper === -1) sx = stops[stops.length - 1].scaleX;
    else if (upper === 0) sx = stops[0].scaleX;
    else {
      const a = stops[upper - 1],
        b = stops[upper],
        t = (y - a.y) / (b.y - a.y);
      sx = a.scaleX + t * (b.scaleX - a.scaleX);
    }
  }
  return [
    W / 2 + (x - W / 2) * sx,
    band.y + ((y - band.sourceY) * band.height) / band.sourceHeight,
  ];
}

export function RegisteredGarmentImage({
  art,
  pass,
  color,
  detailColor,
}: {
  art: ImageArt;
  pass: GarmentPass;
  color?: string;
  detailColor?: string;
}) {
  const id = useId();
  const texture = useRegisteredTexture(art, pass, color, detailColor);
  if (pass === "back" && !art.backRegion && !art.back) return null;
  const bands = art.bands ?? [{ sourceY: 0, sourceHeight: H, y: 0, height: H }];
  const boundaries = new Set([
    0,
    H,
    ...bands.flatMap((b) => [b.sourceY, b.sourceY + b.sourceHeight]),
    ...(art.widthStops?.map((s) => s.y) ?? []),
  ]);
  const stops = art.widthStops ?? [];
  for (let i = 1; i < stops.length; i++)
    if (stops[i].scaleX !== stops[i - 1].scaleX)
      for (
        let y = stops[i - 1].y + (art.sampleStep ?? 2);
        y < stops[i].y;
        y += art.sampleStep ?? 2
      )
        boundaries.add(y);
  const rows = [...boundaries]
    .filter((y) => y >= 0 && y <= H)
    .sort((a, b) => a - b);
  const sourceRect = {
    x: art.source?.x ?? 0,
    y: art.source?.y ?? 0,
    width: art.source?.width ?? W,
    height: art.source?.height ?? H,
  };
  const materialTint =
    art.colorMasks?.shading === "material" && (color || detailColor);
  // Keep the original cloth visible while the browser prepares its dyed texture.
  // External feImage masks can briefly make an otherwise opaque garment disappear.
  const pendingFilter =
    typeof document === "undefined" && materialTint
      ? `url(#${id}-material)`
      : undefined;
  const image = (
    <image href={art.front} {...sourceRect} filter={pendingFilter} />
  );
  const source = (
    <>
      {pass !== "front" && art.back && (
        <image href={art.back} {...sourceRect} filter={pendingFilter} />
      )}
      {pass !== "front" && art.backRegion && (
        <g clipPath={`url(#${id}-rear)`}>{image}</g>
      )}
      {pass !== "back" && (
        <g mask={art.backRegion ? `url(#${id}-front)` : undefined}>{image}</g>
      )}
    </>
  );
  return (
    <g data-registered-texture={texture ? "ready" : "pending"}
      transform={art.offsetY ? `translate(0 ${art.offsetY})` : undefined}>
      <defs>
        {materialTint && (
          <MaterialTintFilter
            id={`${id}-material`}
            regions={art.colorMasks!}
            color={color}
            detailColor={detailColor}
            rect={sourceRect}
          />
        )}
        {art.backRegion && (
          <>
            <clipPath id={`${id}-rear`}>
              <path d={art.backRegion} />
            </clipPath>
            <mask
              id={`${id}-front`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={W}
              height={H}
            >
              <rect width={W} height={H} fill="white" />
              <path d={art.backRegion} fill="black" />
            </mask>
          </>
        )}
        <g id={`${id}-source`}>{source}</g>
      </defs>
      {texture ? (
        <image href={texture} width={W} height={H} />
      ) : art.widthStops ? (
        rows.slice(0, -1).map((y, i) => {
          const end = rows[i + 1],
            dy = end - y;
          const [, t0] = position(art, 0, y),
            [, t1] = position(art, 0, end);
          const [left] = position(art, 0, (y + end) / 2),
            [right] = position(art, W, (y + end) / 2);
          const height = t1 - t0,
            overlap = 0.75;
          return (
            <svg
              key={i}
              x={left}
              y={t0 - overlap}
              width={right - left}
              height={height + 2 * overlap}
              viewBox={`0 ${y - (overlap * dy) / height} ${W} ${dy + (2 * overlap * dy) / height}`}
              preserveAspectRatio="none"
              overflow="hidden"
            >
              <use href={`#${id}-source`} />
            </svg>
          );
        })
      ) : (
        bands.map((band, index) => (
          <svg
            key={index}
            x={(W * (1 - (art.scaleX ?? 1))) / 2}
            y={band.y - 0.75}
            width={W * (art.scaleX ?? 1)}
            height={band.height + 1.5}
            viewBox={`0 ${band.sourceY - (0.75 * band.sourceHeight) / band.height} ${W} ${band.sourceHeight + (1.5 * band.sourceHeight) / band.height}`}
            preserveAspectRatio="none"
            overflow="hidden"
          >
            <use href={`#${id}-source`} />
          </svg>
        ))
      )}
    </g>
  );
}
