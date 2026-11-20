import type { HomeFinish } from "../../../../packages/domain/src/home-finishes";

/** Shared vector materials for the shop preview, thumbnails and the live house. */
export function FinishPattern({ finish, id }: { finish: HomeFinish; id: string }) {
  const base = finish.surface?.base ?? "transparent", detail = finish.surface?.detail ?? "#fff9f1";
  if (finish.pattern === "roses") return <pattern id={id} width="150" height="160" patternUnits="userSpaceOnUse">
    <rect width="150" height="160" fill={base} />
    {[[38,40],[112,122]].map(([x,y]) => <g key={x} transform={`translate(${x} ${y})`}>
      <path d="M0 12Q-12 28-3 45M-4 32Q-24 17-24 31Q-18 41-4 32M-4 38Q17 21 18 35Q13 44-4 38" fill="#84977e" opacity=".65" />
      <path d="M-2-23C14-27 26-16 22-4C32 9 15 25 3 21C-13 30-29 14-22 2C-31-13-16-29-2-23Z" fill={detail} opacity=".65" />
      <path d="M-14-11Q4-25 15-7Q21 9 4 13Q-12 19-16 3Q-16-7-5-9Q10-13 11 1Q10 10 0 6Q-8 3-2-3" fill="none" stroke={base} strokeWidth="2.4" opacity=".8" />
    </g>)}
  </pattern>;
  if (finish.pattern === "daisies") return <pattern id={id} width="130" height="140" patternUnits="userSpaceOnUse">
    <rect width="130" height="140" fill={base} />
    {[[34,35],[99,106]].map(([x,y]) => <g key={x} transform={`translate(${x} ${y})`}>
      <path d="M0 12Q14 36 3 49M7 34Q24 20 23 35Q18 43 7 34" stroke="#81987d" fill="#81987d" opacity=".65" />
      {Array.from({length:8},(_,i) => <ellipse key={i} cy="-12" rx="5" ry="12" fill={detail} transform={`rotate(${i*45})`} />)}
      <circle r="6" fill="#c7a153" /><circle r="3" fill="#e4c67d" />
    </g>)}
  </pattern>;
  if (finish.pattern === "botanical") return <pattern id={id} width="145" height="175" patternUnits="userSpaceOnUse">
    <rect width="145" height="175" fill={base} />
    {[[32,20,-18],[110,105,22]].map(([x,y,r]) => <g key={x} transform={`translate(${x} ${y}) rotate(${r})`} fill={detail} opacity=".75">
      <path d="M0 0Q-7 45 0 100" fill="none" stroke={detail} strokeWidth="2" />
      {[14,35,56,77].map((cy,i) => <g key={cy}><ellipse cx="-10" cy={cy} rx="5" ry="15" transform={`rotate(-42 -10 ${cy})`} /><ellipse cx="11" cy={cy+9} rx="5" ry="15" transform={`rotate(42 11 ${cy+9})`} opacity={i%2 ? .65 : 1} /></g>)}
    </g>)}
  </pattern>;
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
  if (finish.pattern === "stripes") return <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse"><rect width="13" height="26" fill={detail} opacity=".25" /></pattern>;
  if (finish.pattern === "bricks") return <pattern id={id} width="150" height="66" patternUnits="userSpaceOnUse">
    <rect width="150" height="66" fill={detail} />
    <g fill={base} stroke="#ffffff" strokeOpacity=".12"><rect x="2" y="2" width="146" height="29" rx="2" /><rect x="-73" y="35" width="146" height="29" rx="2" /><rect x="77" y="35" width="146" height="29" rx="2" /></g>
    <path d="M8 8H140M83 41H140M8 41H65" stroke="#fff" opacity=".1" />
  </pattern>;
  if (finish.pattern === "floral") return <pattern id={id} width="105" height="126" patternUnits="userSpaceOnUse">
    <rect width="105" height="126" fill={base} />
    <g stroke={detail} strokeWidth="1.6" fill="none" opacity=".65"><path d="M54 126Q10 85 54 52T54-10M54 66Q84 60 88 35M40 98Q17 97 13 76" /></g>
    <g fill={detail} opacity=".6"><ellipse cx="72" cy="58" rx="12" ry="4" transform="rotate(-30 72 58)" /><ellipse cx="28" cy="91" rx="11" ry="4" transform="rotate(25 28 91)" />
      <g transform="translate(54 30)"><ellipse cy="-10" rx="5" ry="11" /><ellipse cy="10" rx="5" ry="11" /><ellipse cx="-10" rx="11" ry="5" /><ellipse cx="10" rx="11" ry="5" /><circle r="4" fill={base} /></g></g>
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
