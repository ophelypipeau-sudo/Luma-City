import { useId } from "react";
import type { FurnitureModel } from "../../../../packages/domain/src/housing";
import type { HomeDecoration } from "../../../../packages/contracts/src/housing";
import assetManifest from "../../../../public/assets/housing/prune-v1/manifest.json";
import { homeFinish, isColorableWall } from "../../../../packages/domain/src/home-finishes";
import { FinishPattern } from "./FinishPattern";
import { WallMouldings } from "./WallMouldings";

type Asset = { width: number; height: number; crop: number[] };
const manifest = assetManifest as Record<string, Asset>;
export function FurnitureArt({ model, thumbnail = false }: { model: FurnitureModel; thumbnail?: boolean }) {
  const asset = manifest[model.id];
  const image = model.image.replace(/\.png$/, thumbnail ? ".thumb.webp" : ".webp");
  return asset ? <svg x={-model.width / 2} y={-model.height} width={model.width} height={model.height}
    viewBox={asset.crop.join(" ")} preserveAspectRatio="xMidYMax meet" overflow="hidden" aria-hidden="true">
    <image href={image} width={asset.width} height={asset.height} />
  </svg> : <image href={image} x={-model.width / 2} y={-model.height}
    width={model.width} height={model.height} preserveAspectRatio="xMidYMax meet" aria-hidden="true" />;
}

/** Tint textures together with their original material, lighting and shadows. */
export function HomeBackground({ wall, floor, wallColors, floorColors }: Pick<HomeDecoration, "wall" | "floor" | "wallColors" | "floorColors">) {
  const uid = useId().replace(/:/g, "");
  const originalWall = homeFinish(`wall:${wall}`)!;
  const wallFinish = wallColors && isColorableWall(originalWall) ? { ...originalWall, surface: wallColors } : originalWall;
  const paintChannels = wallColors && !originalWall.pattern ? [1, 3, 5].map((offset) => parseInt(wallColors.base.slice(offset, offset + 2), 16) / 255) : null;
  const originalFloor = homeFinish(`floor:${floor}`)!;
  const floorFinish = floorColors ? { ...originalFloor, surface: floorColors } : originalFloor;
  const colorChannels = (hex: string) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const wood = floorColors && colorChannels(floorColors.base), grain = floorColors && colorChannels(floorColors.detail);
  const matrix = ([r, g, b]: number[]) => `${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`;
  return <g pointerEvents="none">
    <defs>
      <clipPath id={`${uid}-wall`}><path d="M0 0H1000V422H0Z" /></clipPath>
      <clipPath id={`${uid}-floor`}><path d="M0 422H1000V680H0Z" /></clipPath>
      <clipPath id={`${uid}-window`}><path d="M14 292V128a97 97 0 0 1 194 0v164Z" /></clipPath>
      <filter id={`${uid}-wall-tone`} colorInterpolationFilters="sRGB">
        {paintChannels ? <><feColorMatrix type="saturate" values="0" /><feComponentTransfer>
          <feFuncR type="linear" slope={paintChannels[0] * 1.1} intercept={paintChannels[0] * .03} />
          <feFuncG type="linear" slope={paintChannels[1] * 1.1} intercept={paintChannels[1] * .03} />
          <feFuncB type="linear" slope={paintChannels[2] * 1.1} intercept={paintChannels[2] * .03} />
        </feComponentTransfer></> : <feColorMatrix type="matrix" values={matrix(wallFinish.tone)} />}
      </filter>
      <filter id={`${uid}-floor-tone`} colorInterpolationFilters="sRGB">
        {wood && grain ? <><feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={`${grain[0] * .55} ${grain[0]} ${wood[0]}`} />
            <feFuncG type="table" tableValues={`${grain[1] * .55} ${grain[1]} ${wood[1]}`} />
            <feFuncB type="table" tableValues={`${grain[2] * .55} ${grain[2]} ${wood[2]}`} />
          </feComponentTransfer></> : <feColorMatrix type="matrix" values={matrix(floorFinish.tone)} />}
      </filter>
      <FinishPattern finish={wallFinish} id={`${uid}-wall-material`} />
      <FinishPattern finish={floorFinish} id={`${uid}-floor-material`} />
      <linearGradient id={`${uid}-wall-light`} x2="0" y2="1"><stop stopColor="#fff4d6" stopOpacity=".24" /><stop offset="1" stopColor="#24171a" stopOpacity=".12" /></linearGradient>
      <linearGradient id={`${uid}-floor-light`} x2="0" y2="1"><stop stopColor="#2c1b16" stopOpacity=".2" /><stop offset="1" stopColor="#fff5de" stopOpacity=".13" /></linearGradient>
    </defs>
    <image href="/assets/housing/prune-v1/room-empty.webp" width="1000" height="680"
      preserveAspectRatio="none" clipPath={`url(#${uid}-wall)`} filter={`url(#${uid}-wall-tone)`} />
    {wallFinish.pattern && <rect width="1000" height="422" fill={`url(#${uid}-wall-material)`} />}
    {wallFinish.surface && <rect width="1000" height="422" fill={`url(#${uid}-wall-light)`} />}
    {wallFinish.pattern && wallFinish.pattern !== "bricks" && <WallMouldings id={`${uid}-moulding`} />}
    <image href="/assets/housing/prune-v1/room-empty.webp" width="1000" height="680"
      preserveAspectRatio="none" clipPath={`url(#${uid}-floor)`} filter={`url(#${uid}-floor-tone)`} />
    <rect y="422" width="1000" height="258" fill={`url(#${uid}-floor-material)`} />
    <rect y="422" width="1000" height="258" fill={`url(#${uid}-floor-light)`} />
    <image href="/assets/housing/prune-v1/room-empty.webp" width="1000" height="680"
      preserveAspectRatio="none" clipPath={`url(#${uid}-window)`} />
  </g>;
}
