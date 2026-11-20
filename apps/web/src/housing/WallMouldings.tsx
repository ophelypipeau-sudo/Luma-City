/** Architectural trim in room coordinates, shared by the house and material previews. */
export function WallMouldings({ id }: { id: string }) {
  const upper = [{ x: 232, width: 272 }, { x: 526, width: 228 }, { x: 776, width: 202 }];
  const lower = [{ x: 22, width: 180 }, { x: 224, width: 174 }, { x: 420, width: 174 },
    { x: 616, width: 174 }, { x: 812, width: 166 }];
  return <g aria-hidden="true">
    <defs>
      <linearGradient id={id + "-wood"} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#eee3d2" /><stop offset=".45" stopColor="#e0d0bc" /><stop offset="1" stopColor="#d2bda5" />
      </linearGradient>
      <linearGradient id={id + "-rail"} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#fff4df" /><stop offset=".22" stopColor="#eee1cc" />
        <stop offset=".48" stopColor="#c3a98b" /><stop offset=".65" stopColor="#f5e7d1" /><stop offset="1" stopColor="#b79b80" />
      </linearGradient>
      <linearGradient id={id + "-ceiling-shadow"} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#493021" stopOpacity=".23" /><stop offset="1" stopColor="#493021" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* The cornice casts a soft shade over the wallpaper. */}
    <rect y="24" width="1000" height="16" fill={`url(#${id}-ceiling-shadow)`} />
    <rect width="1000" height="25" fill={`url(#${id}-wood)`} />
    <rect y="4" width="1000" height="17" fill={`url(#${id}-rail)`} />
    <path d="M0 2H1000M0 22H1000" stroke="#fff4e3" strokeWidth="1.5" />
    <path d="M0 25H1000" stroke="#886a50" strokeOpacity=".4" strokeWidth="2" />
    {/* Narrow raised frames keep the printed paper visible inside the panels. */}
    {upper.map(({ x, width }) => <g key={x} fill="none">
      <rect x={x + 1.5} y="49.5" width={width} height="244" stroke="#654630" strokeOpacity=".24" strokeWidth="5" />
      <rect x={x} y="48" width={width} height="244" stroke="#d6c0a7" strokeWidth="4" />
      <rect x={x - .6} y="47.4" width={width} height="244" stroke="#fff1db" strokeWidth="1.1" />
      <rect x={x + 4} y="52" width={width - 8} height="236" stroke="#fff1db" strokeOpacity=".65" strokeWidth=".8" />
    </g>)}
    {/* Painted timber wainscoting, chair rail and skirting sit behind the furniture. */}
    <rect y="318" width="1000" height="104" fill={`url(#${id}-wood)`} />
    {lower.map(({ x, width }) => <g key={x} fill="none">
      <rect x={x} y="337" width={width} height="64" stroke="#b59b7f" strokeWidth="3" />
      <rect x={x + 1} y="338" width={width - 2} height="62" stroke="#f7ead5" strokeWidth="1.3" />
      <rect x={x + 5} y="342" width={width - 10} height="54" stroke="#c4aa8c" strokeWidth="1" />
    </g>)}
    <rect y="310" width="1000" height="15" fill={`url(#${id}-rail)`} />
    <path d="M0 310H1000" stroke="#fff3df" strokeWidth="2" />
    <path d="M0 326H1000" stroke="#6f503c" strokeOpacity=".2" strokeWidth="3" />
    <rect y="408" width="1000" height="14" fill={`url(#${id}-rail)`} />
    <path d="M0 422H1000" stroke="#75563f" strokeOpacity=".5" strokeWidth="2" />
  </g>;
}
