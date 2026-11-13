import { useId } from "react";
import type { PunkCut } from "../../../../packages/domain/src/punk-pattern";
/** Surface detail within the existing cut. No body or silhouette deformation. */
export function PunkFinish({
  cut,
  surface,
  sleeve = false,
}: {
  cut: PunkCut;
  surface: string;
  sleeve?: boolean;
}) {
  const id = useId(),
    shirt = cut === "punk-polo",
    skirt = cut === "punk-skirt";
  const folds = sleeve
    ? ["M247 395Q260 426 246 463", "M266 456Q285 468 308 463"]
    : shirt
      ? [
          "M318 443Q339 469 332 514",
          "M567 441Q548 468 554 518",
          "M327 579Q358 601 399 595",
          "M563 576Q533 601 493 596",
          "M309 625Q355 638 414 628",
          "M577 622Q526 643 470 630",
        ]
      : skirt
        ? []
        : [
            "M292 1563Q325 1588 366 1574",
            "M296 1591Q327 1610 363 1598",
            "M291 1699Q335 1719 384 1706",
          ];
  return (
    <g data-textile-detail="realistic-surface">
      <defs>
        <clipPath id={`${id}-cut`}>
          <path d={surface} />
        </clipPath>
        <filter id={`${id}-soft`} x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <radialGradient id={`${id}-shade`}>
          <stop stopColor="#000" stopOpacity=".42" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-shine`}>
          <stop stopColor="#eee5ef" stopOpacity={shirt ? ".09" : ".22"} />
          <stop offset="1" stopColor="#eee5ef" stopOpacity="0" />
        </radialGradient>
        <pattern
          id={`${id}-grain`}
          width="5"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <path
            d={
              shirt
                ? "M1 .5q1.8 1.1 0 2.2M3.5 3.5q1.8 1.1 0 2.2"
                : "M0 1L5 6M-2 4L2 8"
            }
            fill="none"
            stroke="#e6dbe6"
            strokeOpacity={shirt ? ".19" : ".06"}
            strokeWidth=".65"
          />
        </pattern>
      </defs>
      <g clipPath={`url(#${id}-cut)`}>
        <path d={surface} fill={`url(#${id}-grain)`} />
        {sleeve ? (
          <>
            <ellipse
              cx="263"
              cy="397"
              rx="36"
              ry="49"
              fill={`url(#${id}-shine)`}
            />
            <path
              d="M223 461Q269 482 321 471L319 491Q269 500 220 476Z"
              fill="#100b16"
              opacity=".33"
            />
            <path
              d="M228 468Q269 488 314 480"
              fill="none"
              stroke="#d9c6df"
              strokeOpacity=".46"
              strokeWidth="1.1"
              strokeDasharray="2 2"
            />
          </>
        ) : shirt ? (
          <>
            <ellipse
              cx="442"
              cy="375"
              rx="91"
              ry="36"
              fill={`url(#${id}-shade)`}
            />
            <path
              d="M315 547Q334 571 372 581Q342 579 318 568Z M565 550Q548 568 515 576Q552 578 565 565Z"
              fill="#09070c"
              opacity=".29"
            />
            <path
              d="M314 577Q347 606 399 596Q349 620 315 598Z M568 589Q538 609 499 601Q540 619 572 607Z"
              fill="#cbb9d4"
              opacity=".07"
            />
            <ellipse
              cx="323"
              cy="482"
              rx="29"
              ry="110"
              fill={`url(#${id}-shade)`}
            />
            <ellipse
              cx="566"
              cy="481"
              rx="29"
              ry="110"
              fill={`url(#${id}-shade)`}
            />
            <ellipse
              cx="431"
              cy="477"
              rx="119"
              ry="131"
              fill={`url(#${id}-shine)`}
            />
            <ellipse
              cx="441"
              cy="652"
              rx="180"
              ry="27"
              fill={`url(#${id}-shade)`}
            />
          </>
        ) : skirt ? (
          <>
            <ellipse
              cx="443"
              cy="750"
              rx="212"
              ry="24"
              fill={`url(#${id}-shade)`}
            />
            <path
              d="M218 981Q263 998 309 997Q354 1013 400 1002Q443 1018 485 1002Q530 1014 577 998Q627 1005 669 981"
              fill="none"
              stroke="#e7b8d2"
              strokeOpacity=".5"
              strokeWidth="1.2"
              strokeDasharray="2 2.5"
            />
          </>
        ) : (
          <>
            <ellipse
              cx="321"
              cy="1470"
              rx="18"
              ry="180"
              fill={`url(#${id}-shine)`}
            />
            <ellipse
              cx="359"
              cy="1470"
              rx="21"
              ry="180"
              fill={`url(#${id}-shade)`}
            />
            <ellipse
              cx="337"
              cy="1715"
              rx="50"
              ry="15"
              fill={`url(#${id}-shine)`}
            />
          </>
        )}
        <g
          fill="none"
          stroke="#000"
          strokeOpacity=".2"
          strokeWidth="10"
          filter={`url(#${id}-soft)`}
        >
          {folds.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g fill="none" stroke="#07050b" strokeOpacity=".42" strokeWidth="1.6">
          {folds.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g
          fill="none"
          stroke="#e7deea"
          strokeOpacity=".12"
          strokeWidth="1.3"
          transform="translate(0 -2)"
        >
          {folds.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </g>
    </g>
  );
}
