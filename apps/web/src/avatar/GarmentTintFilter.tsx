/** Color operations only: no displacement, texture generation or geometry changes. */
export function GarmentTintFilter({
  id,
  color,
  detailColor,
  gain = 1,
  primaryMask,
  secondaryMode,
}: {
  id: string;
  color?: string;
  detailColor?: string;
  gain?: number;
  primaryMask?: "lilac";
  secondaryMode?: "dark" | "light-panel";
}) {
  const rgb = (hex: string) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const main = color ? rgb(color) : null,
    detail = detailColor ? rgb(detailColor) : null;
  const fabric = "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.063 3.576 .361 -1 0";
  return (
    <filter
      id={id}
      colorInterpolationFilters="sRGB"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
    >
      <feColorMatrix
        in="SourceGraphic"
        type="saturate"
        values="0"
        result="luma"
      />
      <feComponentTransfer in="luma" result="shade">
        <feFuncR type="linear" slope={gain} />
        <feFuncG type="linear" slope={gain} />
        <feFuncB type="linear" slope={gain} />
      </feComponentTransfer>
      <feColorMatrix in="shade" type="matrix" values={fabric} result="fabric" />
      {primaryMask === "lilac" ? (
        <>
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 5 -10 5 0 0"
            result="purple"
          />
          <feComposite
            in="purple"
            in2="fabric"
            operator="in"
            result="mainMask"
          />
        </>
      ) : (
        <feComposite
          in="fabric"
          in2="SourceAlpha"
          operator="in"
          result="mainMask"
        />
      )}
      {main ? (
        <>
          <feComponentTransfer in="shade" result="mainTint">
            <feFuncR type="linear" slope={0.08 + 0.92 * main[0]} />
            <feFuncG type="linear" slope={0.08 + 0.92 * main[1]} />
            <feFuncB type="linear" slope={0.08 + 0.92 * main[2]} />
          </feComponentTransfer>
          <feComposite
            in="mainTint"
            in2="mainMask"
            operator="in"
            result="mainPaint"
          />
          <feComposite
            in="SourceGraphic"
            in2="mainMask"
            operator="out"
            result="untouched"
          />
          <feComposite
            in="mainPaint"
            in2="untouched"
            operator="arithmetic"
            k2="1"
            k3="1"
            result="mainResult"
          />
        </>
      ) : (
        <feComposite
          in="SourceGraphic"
          in2="SourceGraphic"
          operator="over"
          result="mainResult"
        />
      )}
      {detail && secondaryMode ? (
        <>
          {secondaryMode === "light-panel" ? (
            <feComposite
              in="fabric"
              in2="mainMask"
              operator="out"
              result="detailMask"
            />
          ) : (
            <>
              <feColorMatrix
                in="luma"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.063 -3.576 -.361 2 0"
                result="ink"
              />
              <feComposite
                in="ink"
                in2="SourceAlpha"
                operator="in"
                result="detailMask"
              />
            </>
          )}
          <feComponentTransfer in="luma" result="detailTint">
            <feFuncR
              type="linear"
              slope={detail[0]}
              intercept={secondaryMode === "dark" ? 0.65 * detail[0] : 0}
            />
            <feFuncG
              type="linear"
              slope={detail[1]}
              intercept={secondaryMode === "dark" ? 0.65 * detail[1] : 0}
            />
            <feFuncB
              type="linear"
              slope={detail[2]}
              intercept={secondaryMode === "dark" ? 0.65 * detail[2] : 0}
            />
          </feComponentTransfer>
          <feComposite
            in="detailTint"
            in2="detailMask"
            operator="in"
            result="detailPaint"
          />
          <feComposite
            in="mainResult"
            in2="detailMask"
            operator="out"
            result="remaining"
          />
          <feComposite
            in="detailPaint"
            in2="remaining"
            operator="arithmetic"
            k2="1"
            k3="1"
            result="dyed"
          />
          <feComposite in="dyed" in2="SourceGraphic" operator="atop" />
        </>
      ) : (
        <feComposite in="mainResult" in2="SourceGraphic" operator="atop" />
      )}
    </filter>
  );
}
