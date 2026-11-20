import { useId } from "react";
import type { WindowPlacement } from "../../../../packages/contracts/src/housing";
import { WINDOW_SIZES } from "../../../../packages/domain/src/home-windows";

export function WindowArt({ modelId }: Pick<WindowPlacement, "modelId">) {
  const id = useId().replace(/:/g, ""), size = WINDOW_SIZES[modelId];
  const round = modelId === "round-oak", arch = modelId === "arch-ivory", loft = modelId === "loft-black";
  const shape = round ? "M100 10a90 110 0 1 0 0 220a90 110 0 1 0 0-220Z" : arch ? "M8 232V95a92 85 0 0 1 184 0V232Z" : "M8 8H192V232H8Z";
  const frame = loft ? "#35383b" : round ? "#a47d51" : "#f6efe0";
  return <svg x={-size.width/2} y={-size.height} width={size.width} height={size.height} viewBox="0 0 200 240" preserveAspectRatio="none" overflow="visible" aria-hidden="true">
    <defs>
      <clipPath id={`${id}-opening`}><path d={shape} /></clipPath>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#a9d2e4" /><stop offset=".7" stopColor="#f6dccc" /><stop offset="1" stopColor="#d7dfb8" /></linearGradient>
      <linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".3" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#e5f7fc" stopOpacity=".1" /></linearGradient>
    </defs>
    <path d={shape} fill="none" stroke="#34272a" strokeOpacity=".2" strokeWidth="15" transform="translate(3 4)" />
    <g clipPath={`url(#${id}-opening)`}>
      <rect width="200" height="240" fill={`url(#${id}-sky)`} />
      <g fill="#fffaf2" opacity=".7"><ellipse cx="45" cy="59" rx="28" ry="8" /><ellipse cx="62" cy="52" rx="15" ry="12" /><ellipse cx="150" cy="42" rx="23" ry="7" /></g>
      <path d="M0 178V126H30V108H47V142H80V95L94 80 109 95V150H132V120H154V104H175V137H200V240H0Z" fill="#c1b1b8" />
      <path d="M0 240V169L20 152 40 169V240M51 240V156H79V240M112 240V166L139 147 165 166V240M174 240V178H200V240" fill="#e6c8ac" stroke="#b69c91" strokeWidth="1" />
      <g fill="#8e8a9c" opacity=".7">{[18,60,122,145,182].flatMap((x) => [177,198,219].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="7" height="10" rx="1" />))}</g>
      <path d="M0 234Q20 193 45 225Q59 196 80 229Q110 209 123 230Q155 193 178 222Q194 207 200 229V240H0Z" fill="#789c70" />
      <rect width="200" height="240" fill={`url(#${id}-glass)`} />
      <g stroke={frame} strokeWidth={loft ? 4 : 5} fill="none">
        {round ? <path d="M10 120H190M100 10V230" /> : modelId === "bay-garden" ? <path d="M68 8V232M132 8V232M8 96H192" /> : <><path d="M100 12V232M8 104H192" />{loft && <path d="M54 8V232M146 8V232M8 168H192" />}</>}
      </g>
    </g>
    <path d={shape} fill="none" stroke={frame} strokeWidth={loft ? 9 : 12} strokeLinejoin="round" />
    <path d={shape} fill="none" stroke="#fff" strokeOpacity={loft ? .1 : .4} strokeWidth="2" />
    {!round && <rect x="1" y="232" width="198" height="8" rx="2" fill={frame} />}
  </svg>;
}
