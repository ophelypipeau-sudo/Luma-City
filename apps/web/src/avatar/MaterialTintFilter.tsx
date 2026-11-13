import {
  fabricDyeTable,
  materialChannel,
  type FabricTone,
} from "../../../../packages/domain/src/atelier-color";
import { Fragment } from "react";
type Regions = {
  main: string;
  detail?: string;
  mainBase: string;
  detailBase: string;
  shading?: "material";
  mainContrast?: number;
  mainTone?: FabricTone;
  mainLight?: string;
  detailTone?: FabricTone;
};
const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export function MaterialTintFilter({
  id,
  regions,
  color,
  detailColor,
  rect,
}: {
  id: string;
  regions: Regions;
  color?: string;
  detailColor?: string;
  rect: { x: number; y: number; width: number; height: number };
}) {
  const channels = (
    hex: string,
    base: string,
    contrast?: number,
    tone?: FabricTone,
  ) => {
    const b = rgb(base),
      ref = 0.2126 * b[0] + 0.7152 * b[1] + 0.0722 * b[2];
    return rgb(hex).map((c) =>
      tone
        ? Array.from(fabricDyeTable(c, tone), (value) =>
            (value / 255).toFixed(6),
          ).join(" ")
        : Array.from({ length: 65 }, (_, k) =>
            (materialChannel(c, (k * 255) / 64, ref, contrast) / 255).toFixed(
              6,
            ),
          ).join(" "),
    );
  };
  const zones = [
    { name: "main", color, base: regions.mainBase, mask: regions.main },
    {
      name: "detail",
      color: detailColor,
      base: regions.detailBase,
      mask: regions.detail,
    },
  ].filter(
    (z) => z.color && z.mask && z.color.toLowerCase() !== z.base.toLowerCase(),
  );
  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="887"
      height="1774"
      colorInterpolationFilters="sRGB"
    >
      {regions.mainTone || regions.detailTone ? (
        <feColorMatrix
          in="SourceGraphic"
          values=".2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  0 0 0 1 0"
          result="gray"
        />
      ) : (
        <feColorMatrix
          in="SourceGraphic"
          type="saturate"
          values="0"
          result="gray"
        />
      )}
      {regions.mainLight && zones.some((zone) => zone.name === "main") && (
        <feImage href={regions.mainLight} {...rect} preserveAspectRatio="none" result="main-light" />
      )}
      {zones.map((z, i) => {
        const table = channels(
            z.color!,
            z.base,
            z.name === "main" ? regions.mainContrast : undefined,
            z.name === "main" ? regions.mainTone : regions.detailTone,
          ),
          prior = i ? `${zones[i - 1].name}-result` : "SourceGraphic";
        return (
          <Fragment key={z.name}>
            <feComponentTransfer
              in={z.name === "main" && regions.mainLight ? "main-light" : "gray"}
              result={`${z.name}-tint`}
            >
              <feFuncR type="table" tableValues={table[0]} />
              <feFuncG type="table" tableValues={table[1]} />
              <feFuncB type="table" tableValues={table[2]} />
            </feComponentTransfer>
            <feImage
              href={z.mask}
              {...rect}
              preserveAspectRatio="none"
              result={`${z.name}-mask`}
            />
            <feComposite
              in={`${z.name}-tint`}
              in2={`${z.name}-mask`}
              operator="in"
              result={`${z.name}-paint`}
            />
            <feComposite
              in={prior}
              in2={`${z.name}-mask`}
              operator="out"
              result={`${z.name}-rest`}
            />
            <feComposite
              in={`${z.name}-paint`}
              in2={`${z.name}-rest`}
              operator="arithmetic"
              k2="1"
              k3="1"
              result={`${z.name}-result`}
            />
          </Fragment>
        );
      })}
      {((!regions.mainTone && !regions.detailTone) || !zones.length) && (
        <feComposite
          in={zones.length ? `${zones.at(-1)!.name}-result` : "SourceGraphic"}
          in2="SourceGraphic"
          operator="atop"
        />
      )}
    </filter>
  );
}
