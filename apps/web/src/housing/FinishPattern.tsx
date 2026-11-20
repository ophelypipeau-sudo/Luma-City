import type { HomeFinish } from "../../../../packages/domain/src/home-finishes";
import { RealisticFloorPattern } from "./RealisticFloorPattern";

/** Scanned botanical materials share the existing finish palettes and ownership IDs. */
function BotanicalWallpaper({ finish, id }: { finish: HomeFinish; id: string }) {
  const base = finish.surface!.base, detail = finish.surface!.detail;
  const channels = (hex: string) => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const paper = channels(base), ink = channels(detail);
  const palePrint = ink.every(channel => channel > .85);
  const shadow = palePrint ? [.36, .40, .30] : ink.map(channel => channel * .62);
  const midpoint = palePrint ? ink : ink.map((channel, i) => channel * .66 + paper[i] * .34);
  const transfer = (channel: number) => [shadow[channel], midpoint[channel], paper[channel]].join(" ");
  return <pattern id={id} width="310" height="310" patternUnits="userSpaceOnUse">
    <defs><filter id={id + "-ink"} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues={transfer(0)} />
        <feFuncG type="table" tableValues={transfer(1)} />
        <feFuncB type="table" tableValues={transfer(2)} />
      </feComponentTransfer>
    </filter></defs>
    <rect width="310" height="310" fill={base} />
    <image href={`/assets/housing/wallpapers-realistic-v1/${finish.pattern}.webp`} width="310" height="310" preserveAspectRatio="none" filter={`url(#${id}-ink)`} />
  </pattern>;
}

/** Shared materials for the shop preview, thumbnails and the live house. */
export function FinishPattern({ finish, id }: { finish: HomeFinish; id: string }) {
  if (finish.kind === "floor") return <RealisticFloorPattern finish={finish} id={id} />;
  if (finish.surface && ["floral", "roses", "daisies", "botanical", "magnolia", "damask", "linen", "fans"].includes(finish.pattern ?? "")) return <BotanicalWallpaper finish={finish} id={id} />;
  const base = finish.surface?.base ?? "transparent", detail = finish.surface?.detail ?? "#fff9f1";
  if (finish.pattern === "stars") return <pattern id={id} width="110" height="120" patternUnits="userSpaceOnUse">
    <rect width="110" height="120" fill={base} /><g fill={detail}>
      <path d="M28 9l4 14 14 4-14 4-4 14-4-14-14-4 14-4ZM82 76l3 11 11 3-11 3-3 11-3-11-11-3 11-3Z" />
      <circle cx="78" cy="25" r="1.8" /><circle cx="17" cy="87" r="1.4" /><circle cx="58" cy="58" r="1.5" />
    </g>
  </pattern>;
  if (finish.pattern === "diamonds") return <pattern id={id} width="80" height="100" patternUnits="userSpaceOnUse">
    <rect width="80" height="100" fill={base} /><path d="M40 0L80 50 40 100 0 50ZM40 12L70 50 40 88 10 50Z" fill="none" stroke={detail} strokeWidth="1.8" opacity=".7" /><circle cx="40" cy="50" r="3" fill={detail} />
  </pattern>;
  if (finish.pattern === "dots") return <pattern id={id} width="55" height="60" patternUnits="userSpaceOnUse">
    <rect width="55" height="60" fill={base} /><circle cx="14" cy="15" r="4" fill={detail} /><circle cx="41" cy="45" r="4" fill={detail} />
  </pattern>;
  if (finish.pattern === "stripes") return <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill={base} /><rect width="13" height="26" fill={detail} opacity=".25" /></pattern>;
  if (finish.pattern === "bricks") return <pattern id={id} width="150" height="66" patternUnits="userSpaceOnUse">
    <rect width="150" height="66" fill={detail} />
    <g fill={base} stroke="#ffffff" strokeOpacity=".12"><rect x="2" y="2" width="146" height="29" rx="2" /><rect x="-73" y="35" width="146" height="29" rx="2" /><rect x="77" y="35" width="146" height="29" rx="2" /></g>
    <path d="M8 8H140M83 41H140M8 41H65" stroke="#fff" opacity=".1" />
  </pattern>;
  if (finish.pattern === "arches") return <pattern id={id} width="110" height="100" patternUnits="userSpaceOnUse">
    <rect width="110" height="100" fill={base} /><g stroke={detail} strokeWidth="2" fill="none" opacity=".65">
      <path d="M0 100V55a55 55 0 0 1 110 0v45M11 100V55a44 44 0 0 1 88 0v45M22 100V55a33 33 0 0 1 66 0v45M33 100V55a22 22 0 0 1 44 0v45" />
    </g></pattern>;
  if (finish.pattern === "tiles") return <pattern id={id} width="160" height="160" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .06 -.65 .5 350 410)">
    <rect width="160" height="160" fill={base} />
    {finish.value === "tile-checker" ? <g fill={detail}><rect width="80" height="80" /><rect x="80" y="80" width="80" height="80" /></g> : null}
    <path d="M0 0H160V160H0ZM80 0V160M0 80H160" fill="none" stroke={finish.value === "tile-checker" ? "#c3b8a5" : detail} strokeWidth="2" />
  </pattern>;
  if (finish.pattern === "stone") return <pattern id={id} width="260" height="160" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .04 -.55 .55 300 410)">
    <rect width="260" height="160" fill={base} /><rect x="3" y="3" width="125" height="75" fill={detail} opacity=".2" /><rect x="133" y="83" width="125" height="75" fill="#fff" opacity=".07" />
    <path d="M0 0H260V160H0ZM0 80H260M130 0V80M65 80V160M195 80V160" fill="none" stroke={detail} strokeWidth="3" />
    <path d="M14 40l28-7 29 16 25-6M140 18l41 15 25-8M78 122l33-9 49 19 22-6" fill="none" stroke={detail} opacity=".2" strokeWidth="1.5" />
  </pattern>;
  if (finish.pattern === "herringbone") return <pattern id={id} width="160" height="80" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .04 -.4 .5 300 410)">
    <rect width="160" height="80" fill={base} /><g fill={detail} stroke="#4b2d20" strokeWidth="1" strokeOpacity=".4">
      <path d="M0-40L80 0 160-40V-20L80 20 0-20ZM0 0L80 40 160 0V20L80 60 0 20ZM0 40L80 80 160 40V60L80 100 0 60Z" />
    </g><path d="M80 0V80" stroke="#4b2d20" opacity=".35" /><path d="M0 7L80 47 160 7M0 15L80 55 160 15M0 47L80 87 160 47M0-33L80 7 160-33" stroke="#fff" opacity=".15" fill="none" />
  </pattern>;
  return null;
}
