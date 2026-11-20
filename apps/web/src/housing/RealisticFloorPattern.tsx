import type { HomeFinish } from "../../../../packages/domain/src/home-finishes";

/** Shared photographic materials preserve each model's palette and custom colors. */
export function RealisticFloorPattern({ finish, id }: { finish: HomeFinish; id: string }) {
  const family = finish.value === "tile-checker" ? "checker" : ({
    herringbone: "herringbone", tiles: "tile", stone: "stone", basketweave: "basketweave",
    versailles: "versailles", terrazzo: "terrazzo", hexagon: "hexagon", marble: "marble",
  } as Record<string, string>)[finish.pattern ?? ""] ?? "wood";
  const contrast = family === "checker" ? 1 : 1.8;
  const offset = family === "checker" ? 0 : ["tile", "stone", "terrazzo", "hexagon", "marble"].includes(family) ? -.6 : -.4;
  const hex = (channels: number[]) => "#" + channels.map((value) => Math.min(255, Math.round(value)).toString(16).padStart(2, "0")).join("");
  const base = finish.surface?.base ?? hex(finish.tone.map((tone, i) => [224, 180, 133][i] * tone));
  const detail = finish.surface?.detail ?? hex(finish.tone.map((tone, i) => [143, 102, 67][i] * tone));
  const channels = (value: string) => [1, 3, 5].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
  const first = channels(base), second = channels(detail);
  const lightFirst = first.reduce((sum, value) => sum + value, 0) >= second.reduce((sum, value) => sum + value, 0);
  const light = lightFirst ? first : second, dark = lightFirst ? second : first;
  const transfer = (i: number) => [
    dark[i] * .46, dark[i] * .72 + light[i] * .28,
    dark[i] * .22 + light[i] * .78, Math.min(1, light[i] * 1.06),
  ].join(" ");
  return <pattern id={id} width="500" height="500" patternUnits="userSpaceOnUse"
    patternTransform="matrix(1 0 -.55 .48 280 422)">
    <defs><filter id={id + "-pigment"} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncR type="linear" slope={contrast} intercept={offset} />
        <feFuncG type="linear" slope={contrast} intercept={offset} />
        <feFuncB type="linear" slope={contrast} intercept={offset} />
      </feComponentTransfer>
      <feComponentTransfer>
        <feFuncR type="table" tableValues={transfer(0)} />
        <feFuncG type="table" tableValues={transfer(1)} />
        <feFuncB type="table" tableValues={transfer(2)} />
      </feComponentTransfer>
    </filter></defs>
    <rect width="500" height="500" fill={base} />
    <image href={`/assets/housing/floors-realistic-v1/${family}.webp?v=1`} width="500" height="500"
      preserveAspectRatio="none" filter={`url(#${id}-pigment)`} />
  </pattern>;
}
