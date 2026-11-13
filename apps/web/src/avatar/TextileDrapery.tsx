import { useId } from "react";
import {
  textilePattern,
  type TextileCut,
} from "../../../../packages/domain/src/textile-pattern";
import type { Pose } from "../../../../packages/domain/src/avatar-pattern";
/** Lighting and construction detail only: never changes the cloth silhouette,
 * body anchors, wrist geometry or the base dye. */
export function TextileDrapery({ cut, pose }: { cut: TextileCut; pose: Pose }) {
  const id = useId(),
    p = textilePattern(cut, pose),
    knit = cut === "cropped-knit";
  const bodyFolds = knit
    ? [
        "M321 421Q346 479 333 552",
        "M567 413Q546 480 558 535",
        "M331 582Q356 600 395 602",
        "M560 578Q535 596 498 596",
        "M318 617Q358 637 421 625",
        "M576 612Q533 634 471 624",
        "M334 644Q375 631 411 642",
        "M465 644Q513 649 555 635",
        "M377 392Q432 415 497 391",
      ]
    : [
        "M291 804Q317 818 345 822",
        "M596 804Q570 818 542 822",
        "M430 852Q399 862 371 850",
        "M456 852Q490 862 518 850",
        "M420 873Q386 894 339 887",
        "M466 873Q501 893 545 887",
        "M272 895Q299 905 325 900",
        "M615 895Q590 905 561 900",
      ];
  const folds = (paths: readonly string[], sleeve = false) => (
    <g data-textile-detail={sleeve ? "compression-folds" : "draped-folds"}>
      <g
        fill="none"
        stroke="#07060a"
        strokeWidth={sleeve ? 12 : 14}
        strokeOpacity=".14"
        strokeLinecap="round"
        filter={`url(#${id}-blur)`}
      >
        {paths.map((d, i) => (
          <path d={d} key={i} />
        ))}
      </g>
      <g
        fill="none"
        stroke="#17131a"
        strokeWidth={sleeve ? 2.2 : 2.8}
        strokeOpacity=".23"
        strokeLinecap="round"
      >
        {paths.map((d, i) => (
          <path d={d} key={i} />
        ))}
      </g>
      <g
        fill="none"
        stroke="#fff5eb"
        strokeWidth="2.4"
        strokeOpacity=".09"
        strokeLinecap="round"
        transform="translate(0 -3)"
        filter={`url(#${id}-blur)`}
      >
        {paths.map((d, i) => (
          <path d={d} key={i} />
        ))}
      </g>
    </g>
  );
  return (
    <g data-textile-detail="volume-and-tailoring">
      <defs>
        <filter id={`${id}-blur`} x="-15%" y="-25%" width="130%" height="150%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#050308" stopOpacity=".48" />
          <stop offset="1" stopColor="#050308" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop stopColor="#050308" stopOpacity=".3" />
          <stop offset="1" stopColor="#050308" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor="#fff5ea" stopOpacity=".15" />
          <stop offset="1" stopColor="#fff5ea" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-body`}>
          <path d={p.body} />
        </clipPath>
        {p.sleeves.map((s, i) => (
          <clipPath id={`${id}-sleeve-${i}`} key={i}>
            <path d={s.d} />
          </clipPath>
        ))}
      </defs>
      <g clipPath={`url(#${id}-body)`}>
        {knit ? (
          <>
            <ellipse
              cx="426"
              cy="458"
              rx="115"
              ry="110"
              fill={`url(#${id}-light)`}
            />
            <ellipse
              cx="443"
              cy="366"
              rx="80"
              ry="22"
              fill={`url(#${id}-shadow)`}
            />
            <ellipse
              cx="326"
              cy="466"
              rx="32"
              ry="105"
              fill={`url(#${id}-shadow)`}
            />
            <ellipse
              cx="562"
              cy="465"
              rx="30"
              ry="100"
              fill={`url(#${id}-shadow)`}
            />
            <path
              d="M300 641Q371 625 441 640Q514 655 587 633L587 665H299Z"
              fill={`url(#${id}-shade)`}
              opacity=".75"
            />
          </>
        ) : (
          <>
            <ellipse
              cx="350"
              cy="817"
              rx="72"
              ry="115"
              fill={`url(#${id}-light)`}
            />
            <ellipse
              cx="538"
              cy="817"
              rx="72"
              ry="115"
              fill={`url(#${id}-light)`}
            />
            <path
              d="M307 718Q443 742 580 718"
              fill="none"
              stroke="#08050b"
              strokeOpacity=".18"
              strokeWidth="7"
              filter={`url(#${id}-blur)`}
            />
            <path
              d="M273 800Q331 814 351 733 M535 733Q554 813 615 800"
              fill="none"
              stroke="#08050b"
              strokeOpacity=".22"
              strokeWidth="7"
              filter={`url(#${id}-blur)`}
            />
            <path
              d="M267 910Q342 929 429 919 M457 919Q545 929 622 910"
              fill="none"
              stroke="#08050b"
              strokeOpacity=".2"
              strokeWidth="7"
              filter={`url(#${id}-blur)`}
            />
          </>
        )}
        {folds(bodyFolds)}
        <g
          data-textile-detail="double-stitch"
          fill="none"
          stroke="#dacdbd"
          strokeOpacity=".3"
          strokeWidth="1"
          strokeDasharray="2 2.5"
          transform="translate(0 3)"
        >
          {p.seams.map((d, i) => (
            <path d={d} key={i} />
          ))}
        </g>
        {!knit && (
          <g
            data-textile-detail="belt-loops-and-pocket-tacks"
            fill="none"
            strokeLinejoin="round"
          >
            <path
              d="M342 701L356 704 350 737 337 734Z M531 704L545 701 550 734 537 737Z"
              stroke="#211d24"
              strokeWidth="2.2"
            />
            <path
              d="M344 705L340 732M542 705L547 732"
              stroke="#ded2c6"
              strokeOpacity=".35"
              strokeWidth="1.2"
            />
            <path
              d="M279 799L289 801M603 800L613 798M436 825H465"
              stroke="#25202a"
              strokeWidth="3"
            />
            <path
              d="M451 749V817"
              stroke="#29242b"
              strokeWidth="1.2"
              strokeDasharray="1 3"
            />
          </g>
        )}
      </g>
      {knit &&
        p.sleeveFolds.map((s, i) => (
          <g
            key={i}
            transform={
              "mirror" in s ? "translate(887 0) scale(-1 1)" : undefined
            }
            clipPath={`url(#${id}-sleeve-${i})`}
          >
            {folds(s.d.split(/(?=M)/).filter(Boolean), true)}
          </g>
        ))}
    </g>
  );
}
