import { PunkFinish } from "./PunkFinish";
import { useId } from "react";
import {
  PUNK_COLORS,
  punkPoloSleeves,
  type PunkCut,
} from "../../../../packages/domain/src/punk-pattern";
import type { Pose } from "../../../../packages/domain/src/avatar-pattern";
export function PunkGarment({
  cut,
  pose = "front",
  color,
  detailColor,
  pass = "all",
}: {
  cut: PunkCut;
  pose?: Pose;
  color?: string;
  detailColor?: string;
  pass?: "front" | "back" | "all" | "cuffs";
}) {
  const id = useId(),
    meta = PUNK_COLORS[cut],
    main = color && /^#[\da-f]{6}$/i.test(color) ? color : meta.main,
    detail =
      detailColor && /^#[\da-f]{6}$/i.test(detailColor)
        ? detailColor
        : meta.detail;
  if (pass === "cuffs" || (pass === "back" && cut !== "punk-waves"))
    return null;
  const metal =
    cut === "punk-hoops" ? main : cut === "punk-skirt" ? meta.detail : detail;
  const shade = (hex: string, t: number) =>
    "#" +
    [1, 3, 5]
      .map((i) => {
        let v = parseInt(hex.slice(i, i + 2), 16);
        return Math.round(t > 0 ? v + (255 - v) * t : v * (1 + t))
          .toString(16)
          .padStart(2, "0");
      })
      .join("");
  const cap =
    "M441 30Q357 0 318 78Q284 142 312 230L332 250Q330 175 358 128Q403 107 443 94Q483 109 523 129Q551 175 554 251L575 225Q596 135 563 81Q526 14 441 30Z";
  const shape = (d: string, fill = main, stroke = true) => (
    <g>
      <path d={d} fill={fill} />
      <path d={d} fill={`url(#${id}-volume)`} />
      {stroke && (
        <path
          d={d}
          fill="none"
          stroke="#16121c"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
  const shirt =
    "M400 328Q443 353 487 328L501 343Q548 340 580 350Q594 391 580 462L565 524Q562 589 585 642Q518 658 443 649Q364 643 300 657Q314 595 310 531L297 460Q279 395 309 347Q357 342 385 342Z";
  const skirt =
    "M306 698Q443 722 580 698L600 750Q643 851 676 990Q629 1015 577 1008Q529 1023 484 1012Q442 1027 400 1012Q351 1023 308 1008Q256 1014 210 991Q244 853 286 750Z";
  const tie =
    "M424 400L459 400 469 428 451 451 480 670 443 705 410 671 433 451 415 427Z";
  const hairBack =
    "M441 30C320 0 302 110 310 229C318 293 269 319 269 386C276 432 234 464 252 516C269 561 230 600 243 648Q278 664 319 616C337 590 356 574 352 522C350 474 375 443 373 394L512 394C511 454 535 481 531 528Q522 592 570 627Q623 671 656 645C640 611 664 571 643 527C620 478 646 455 619 410C595 376 615 329 590 284C568 240 585 145 557 87Q520 20 441 30Z";
  const lock =
    "M372 70Q324 108 335 189Q352 260 319 311C289 349 333 374 304 411C276 449 316 471 289 512Q267 550 286 581Q302 558 314 541C348 512 321 481 345 454C377 415 341 385 364 354C391 315 355 286 374 236Q392 194 369 158Q358 122 397 87Z";
  const leg =
    "M277 933Q331 952 425 933L413 1098Q411 1200 382 1277L366 1596Q361 1640 352 1672H302Q298 1623 308 1575L311 1298Q288 1201 285 1111Z";
  const boot =
    "M277 1288Q338 1304 402 1288Q403 1358 386 1420L372 1574Q375 1655 395 1717Q405 1755 352 1760L298 1757Q275 1751 279 1725L294 1592Q296 1520 283 1430Q271 1358 277 1288Z";
  const belt = "M292 712Q443 742 592 712L604 750Q443 781 281 750Z";
  const buckle = "M419 720Q443 723 472 724L469 767 416 764Z";
  const crest =
    "M361 418L375 432 371 448 394 445 408 460 394 477 373 472 377 533 362 550 347 533 351 472 330 477 317 460 331 445 353 448 349 432Z";
  const pleats = Array.from({ length: 9 }, (_, index) => {
    const top = 285 + index * 35;
    const hem = 195 + index * 56;
    return {
      path: `M${top} 747H${top + 35}L${hem + 56} 1030H${hem}Z`,
      skew: (hem - top) / 283,
      shift: index * 11,
    };
  });
  return (
    <g
      data-textile-cut={cut}
      data-textile-pose={pose}
      data-textile-material="punk-capsule"
    >
      <defs>
        <pattern
          id={`${id}-leather`}
          width="11"
          height="13"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M1 4q2-2 4-1m2 6q1-2 3-2M2 11l2-1"
            fill="none"
            stroke="#f4dfeb"
            strokeOpacity=".12"
            strokeWidth=".7"
          />
        </pattern>
        <pattern
          id={`${id}-thread`}
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-32)"
        >
          <path
            d="M1 0V4"
            stroke="#fff5fa"
            strokeOpacity=".22"
            strokeWidth=".8"
          />
        </pattern>
        <linearGradient id={`${id}-enamel`} x2="0" y2="1">
          <stop stopColor="#fff3fb" stopOpacity=".38" />
          <stop offset=".43" stopColor="#fff3fb" stopOpacity="0" />
          <stop offset="1" stopColor="#21091e" stopOpacity=".38" />
        </linearGradient>
        <linearGradient id={`${id}-roots`} x2="0" y2="1">
          <stop stopColor="#110912" stopOpacity=".72" />
          <stop offset=".34" stopColor="#130c16" stopOpacity="0" />
          <stop offset=".69" stopColor="#fff2ff" stopOpacity=".12" />
          <stop offset="1" stopColor="#180b20" stopOpacity=".43" />
        </linearGradient>
        <clipPath id={`${id}-boot`}>
          <path d={boot} />
        </clipPath>
        <linearGradient id={`${id}-metal`}>
          <stop stopColor={shade(metal, -0.62)} />
          <stop offset=".22" stopColor={shade(metal, 0.65)} />
          <stop offset=".38" stopColor={metal} />
          <stop offset=".58" stopColor={shade(metal, -0.3)} />
          <stop offset=".75" stopColor={shade(metal, 0.8)} />
          <stop offset="1" stopColor={shade(metal, -0.45)} />
        </linearGradient>
        <clipPath id={`${id}-cap`}>
          <path d={cap} />
        </clipPath>
        <clipPath id={`${id}-back-hair`}>
          <path d={hairBack} />
        </clipPath>
        <linearGradient id={`${id}-volume`}>
          <stop stopColor="#000" stopOpacity=".38" />
          <stop offset=".3" stopColor="#fff" stopOpacity=".11" />
          <stop offset=".54" stopColor="#fff" stopOpacity="0" />
          <stop offset=".8" stopColor="#fff" stopOpacity=".08" />
          <stop offset="1" stopColor="#000" stopOpacity=".4" />
        </linearGradient>
        <linearGradient id={`${id}-pleat`}>
          <stop stopColor="#000" stopOpacity=".6" />
          <stop offset=".22" stopColor="#000" stopOpacity=".08" />
          <stop offset=".7" stopColor="#fff" stopOpacity=".1" />
          <stop offset="1" stopColor="#000" stopOpacity=".4" />
        </linearGradient>
        <linearGradient id={`${id}-hair`}>
          <stop stopColor="#000" stopOpacity=".4" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".23" />
          <stop offset=".6" stopColor="#fff" stopOpacity=".03" />
          <stop offset="1" stopColor="#000" stopOpacity=".5" />
        </linearGradient>
        <pattern
          id={`${id}-plaid`}
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
          patternTransform={
            cut === "punk-tie" ? "rotate(32) scale(.7)" : undefined
          }
        >
          <rect width="64" height="64" fill={main} />
          <path d="M0 16H64M16 0V64" stroke={detail} strokeWidth="22" />
          <path
            d="M0 51H64M51 0V64"
            stroke={detail}
            strokeWidth="3"
            opacity=".8"
          />
          <path
            d="M0 6H64M6 0V64"
            stroke="#f1bad8"
            strokeWidth="1.3"
            opacity=".5"
          />
        </pattern>
        {cut === "punk-skirt" &&
          pleats.map(({ skew, shift }, index) => (
            <pattern
              key={index}
              id={`${id}-panel-${index}`}
              href={`#${id}-plaid`}
              patternTransform={`matrix(1 0 ${skew} 1 ${shift - skew * 747} 0)`}
            />
          ))}
        <pattern
          id={`${id}-net`}
          width="17"
          height="23"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 0L17 23M17 0L0 23"
            fill="none"
            stroke={main}
            strokeWidth="1.1"
            opacity=".85"
          />
        </pattern>
        <filter id={`${id}-skin-alpha`}>
          <feFlood floodColor="white" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        <mask
          id={`${id}-skin`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="887"
          height="1774"
        >
          <image
            href="/assets/avatar/fashion-v2/body-user.png"
            width="887"
            height="1774"
            filter={`url(#${id}-skin-alpha)`}
          />
        </mask>
        <clipPath id={`${id}-pink-lock`}>
          <path d={lock} />
        </clipPath>
        <clipPath id={`${id}-body`}>
          <path d={cut === "punk-skirt" ? skirt : shirt} />
        </clipPath>
      </defs>
      {cut === "punk-polo" && (
        <>
          {punkPoloSleeves(pose).map((s, i) => (
            <g
              key={i}
              transform={s.mirror ? "translate(887 0) scale(-1 1)" : undefined}
            >
              {shape(s.d)}
              {pose === "front" && (
                <PunkFinish cut={cut} surface={s.d} sleeve />
              )}
              <path
                d={
                  pose === "front"
                    ? "M228 463Q266 487 313 481"
                    : "M230 463Q268 484 304 467"
                }
                fill="none"
                stroke="#b1a4b4"
                strokeOpacity=".3"
                strokeWidth="1.4"
              />
            </g>
          ))}
          {shape(shirt)}
          <PunkFinish cut={cut} surface={shirt} />
          <g clipPath={`url(#${id}-body)`}>
            <path
              d="M325 424Q349 476 332 555M558 427Q537 478 553 559M321 612Q367 635 420 623M565 610Q521 635 473 623"
              fill="none"
              stroke="#000"
              strokeWidth="9"
              strokeOpacity=".25"
            />
            <path
              d="M326 422Q350 474 333 553M559 425Q538 476 554 557M322 610Q368 633 421 621M566 608Q522 633 474 621"
              fill="none"
              stroke="#aaa3af"
              strokeWidth="1.2"
              strokeOpacity=".17"
            />
          </g>
          <g
            data-textile-channel="motifs"
            fill={detail}
            stroke="#f2d2e5"
            strokeWidth="3"
            strokeLinejoin="round"
          >
            <path
              d={crest}
              fill="#100a14"
              stroke="#100a14"
              strokeWidth="6"
              transform="translate(1 2)"
            />
            <path d={crest} />
            <path d={crest} fill={`url(#${id}-thread)`} stroke="none" />
            <path
              d={crest}
              fill={`url(#${id}-enamel)`}
              stroke="#9c567d"
              strokeWidth="1.2"
              strokeDasharray="1 2"
            />
          </g>
          <g transform="translate(510 465)" data-textile-channel="motifs">
            <path
              d="M-27-14Q-30-44 0-46Q32-43 28-14L16 0 14 17H-13L-15 0Z"
              fill={detail}
              stroke="#eebdd8"
              strokeWidth="1.4"
            />
            <path
              d="M-20-19Q-10-28-5-13Q-15-7-20-19M5-13Q10-29 21-19Q15-7 5-13M-3 0L0-7 4 0M-10 8V17M0 7V17M10 8V17"
              fill={main}
              stroke={main}
              strokeWidth="2"
            />
            <path
              d="M-34 22L34 52M-34 52L34 22"
              stroke="#e6d9e4"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {[-34, 34].flatMap((x) =>
              [22, 52].map((y) => (
                <circle key={`${x}${y}`} cx={x} cy={y} r="5.5" fill="#e6d9e4" />
              )),
            )}
          </g>
          {shape("M396 324L443 375 412 409 371 350Z")}
          {shape("M487 324L443 375 472 409 515 350Z")}
          <path
            d="M397 330L438 375 412 401 378 352M486 331L449 375 473 401 508 352"
            fill="none"
            stroke="#afa1b4"
            strokeOpacity=".42"
            strokeWidth="1.4"
            strokeDasharray="2 2"
          />
          <path
            d="M302 647Q371 633 443 641Q515 652 583 633"
            fill="none"
            stroke="#c2b5c7"
            strokeOpacity=".28"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        </>
      )}
      {cut === "punk-skirt" && (
        <>
          <path
            d={skirt}
            fill={`url(#${id}-plaid)`}
            stroke="#26202a"
            strokeWidth="2.5"
          />
          <g clipPath={`url(#${id}-body)`}>
            {pleats.map(({ path }, index) => (
              <g key={index}>
                <path d={path} fill={`url(#${id}-panel-${index})`} />
                <path d={path} fill={`url(#${id}-pleat)`} />
              </g>
            ))}
          </g>
          <PunkFinish cut={cut} surface={skirt} />
          <path
            d="M306 698Q443 722 580 698L596 747Q443 770 290 747Z"
            fill={`url(#${id}-plaid)`}
            stroke="#302431"
            strokeWidth="2"
          />
          <g transform="translate(570 821) rotate(-9)">
            <path
              d="M-15-15H40L42 105 36 118H-12L-15 108Z"
              fill="#200b1a"
              opacity=".45"
              transform="translate(3 4)"
            />
            {shape("M-15-15H40L42 105 36 118H-12L-15 108Z")}
            <path
              d="M33 26L39 23 40 105 34 111Z"
              fill="#240a20"
              opacity=".37"
            />
            {shape("M-17-16H42V22L31 32H-10L-17 25Z", shade(main, 0.13))}
            <path
              d="M-10-10H35V26H-10Z M-10 35H35V81H-10Z"
              fill="none"
              stroke="#f4b3d7"
              strokeOpacity=".65"
              strokeWidth="1.5"
              strokeDasharray="1.7 2"
            />
            <circle
              cx="13"
              cy="20"
              r="4"
              fill={`url(#${id}-metal)`}
              stroke="#452735"
              strokeWidth="1"
            />
          </g>
        </>
      )}
      {cut === "punk-tie" && (
        <>
          <path
            d={tie}
            fill={`url(#${id}-plaid)`}
            stroke="#382333"
            strokeWidth="2"
          />
          <path d={tie} fill={`url(#${id}-volume)`} />
          <path d={tie} fill={`url(#${id}-thread)`} />
          <path
            d="M417 429Q441 420 465 428L451 450 433 450Z"
            fill={`url(#${id}-enamel)`}
            stroke="#271723"
            strokeWidth="1.2"
          />
          <path
            d="M437 454Q435 536 419 668L443 694 472 669"
            fill="none"
            stroke="#f9d6ee"
            strokeOpacity=".36"
            strokeWidth="1.1"
            strokeDasharray="2 2.6"
          />
        </>
      )}
      {cut === "punk-belt" && (
        <>
          <path d={belt} fill={main} stroke="#100f13" strokeWidth="2" />
          <path d={belt} fill={`url(#${id}-volume)`} />
          <path d={belt} fill={`url(#${id}-leather)`} />
          <path
            d="M295 719Q442 749 590 719"
            fill="none"
            stroke="#c1b0bd"
            strokeOpacity=".35"
          />
          {[326, 355, 384, 502, 531, 560].map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy={x < 443 ? 737 + (x - 326) * 0.12 : 744 - (x - 502) * 0.12}
              r="3.8"
              fill="#17151b"
              stroke={`url(#${id}-metal)`}
              strokeWidth="1.35"
            />
          ))}
          <path
            d={buckle}
            fill="none"
            stroke={`url(#${id}-metal)`}
            strokeWidth="7"
          />
          <path
            d={buckle}
            fill="none"
            stroke="#f2ddea"
            strokeOpacity=".48"
            strokeWidth="1.15"
            transform="translate(-1 -1)"
          />
          <path
            d="M421 744Q439 741 456 745"
            fill="none"
            stroke={`url(#${id}-metal)`}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      {cut === "punk-choker" && (
        <>
          <path
            d="M401 307Q443 323 485 307L489 339Q444 356 397 339Z"
            fill={main}
            stroke="#100d12"
            strokeWidth="2"
          />
          {[409, 425, 465, 479].map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy={x < 443 ? 321 + (x - 409) * 0.15 : 325 - (x - 465) * 0.15}
              r="3"
              fill={`url(#${id}-metal)`}
            />
          ))}
          <path
            d="M434 318H455V340H434Z"
            fill="none"
            stroke={`url(#${id}-metal)`}
            strokeWidth="3"
          />
          {Array.from({ length: 13 }, (_, index) => {
            const t = index / 12;
            return (
              <ellipse
                key={index}
                cx={418 + t * 52}
                cy={342 + 56 * t * (1 - t)}
                rx={index % 2 ? 2.4 : 3}
                ry={index % 2 ? 1.6 : 2.3}
                fill="none"
                stroke={`url(#${id}-metal)`}
                strokeWidth="1.55"
              />
            );
          })}
        </>
      )}
      {cut === "punk-hoops" &&
        [false, true].map((m, i) => (
          <g key={i} transform={m ? "translate(887 0) scale(-1 1)" : undefined}>
            <circle cx="350" cy="213" r="3" fill={main} />
            <path
              d="M350 217C326 215 328 269 349 272C369 270 372 232 361 221"
              fill="none"
              stroke={`url(#${id}-metal)`}
              strokeWidth="4.4"
            />
            <path
              d="M344 219C333 227 334 255 343 266"
              fill="none"
              stroke="#fdf2f8"
              strokeOpacity=".8"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M349 218V246H359"
              fill="none"
              stroke={main}
              strokeWidth="2.2"
            />
          </g>
        ))}
      {cut === "punk-waves" && (
        <>
          {pass !== "front" && (
            <>
              {shape(hairBack)}
              <g clipPath={`url(#${id}-back-hair)`} fill="none">
                {Array.from({ length: 14 }, (_, n) => (
                  <path
                    key={n}
                    d={`M${335 + n * 2} 150Q${294 + n * 2} 290 ${313 + n * 2} 356Q${332 + n * 2} 399 ${283 + n * 2} 458Q${259 + n * 2} 506 ${285 + n * 2} 548Q${304 + n * 2} 599 ${254 + n * 2} 649`}
                    stroke="#b2a4b9"
                    strokeOpacity={n % 4 === 0 ? 0.2 : 0.07}
                    strokeWidth={n % 4 === 0 ? 1.6 : 0.7}
                  />
                ))}
                {Array.from({ length: 12 }, (_, n) => (
                  <path
                    key={`r${n}`}
                    d={`M${542 + n * 2} 162Q${582 + n * 2} 299 ${559 + n * 2} 367Q${542 + n * 2} 401 ${589 + n * 2} 458Q${612 + n * 2} 506 ${587 + n * 2} 548Q${569 + n * 2} 599 ${619 + n * 2} 649`}
                    stroke="#c2b3cb"
                    strokeOpacity={n % 4 === 0 ? 0.17 : 0.06}
                    strokeWidth={n % 4 === 0 ? 1.5 : 0.65}
                  />
                ))}
              </g>
            </>
          )}
          {pass !== "back" && (
            <>
              {shape(cap)}
              <g clipPath={`url(#${id}-cap)`} fill="none">
                {Array.from({ length: 28 }, (_, n) => (
                  <path
                    key={n}
                    d={`M${439 - n * 0.55} ${35 + n * 0.25}Q${343 - n * 1.1} ${44 + n * 2.7} ${322 - n * 0.7} ${151 + n * 2.2}Q${315 - n * 0.4} 202 ${331 - n * 0.35} 262`}
                    stroke="#d5c2db"
                    strokeOpacity={n % 5 === 0 ? 0.13 : 0.035}
                    strokeWidth={n % 5 === 0 ? 1.4 : 0.6}
                  />
                ))}
                {Array.from({ length: 24 }, (_, n) => (
                  <path
                    key={`c${n}`}
                    d={`M${448 + n * 0.55} ${35 + n * 0.2}Q${544 + n} ${49 + n * 2.5} ${564 + n * 0.5} ${153 + n * 2.2}Q${575 + n * 0.4} 203 ${555 + n * 0.35} 262`}
                    stroke="#d5c2db"
                    strokeOpacity={n % 5 === 0 ? 0.12 : 0.03}
                    strokeWidth={n % 5 === 0 ? 1.4 : 0.6}
                  />
                ))}
              </g>
              {shape(lock, detail)}
              <path d={lock} fill={`url(#${id}-roots)`} />
              <g transform="translate(887 0) scale(-1 1)">{shape(lock)}</g>
              <g
                fill="none"
                stroke="#aaa0b4"
                strokeOpacity=".28"
                strokeWidth="1.6"
              >
                {[0, 1, 2, 3].map((i) => (
                  <path
                    key={i}
                    d={`M${433 - i * 12} 44Q${355 - i * 8} 46 ${330 - i * 2} 128Q${313 - i * 2} 171 ${329 - i * 2} 220`}
                  />
                ))}
                <path d="M459 47Q546 71 558 167M529 271Q557 311 539 349Q527 377 552 412Q576 441 553 477Q540 509 566 549" />
              </g>
              <path d={lock} fill={`url(#${id}-hair)`} />
              {[false, true].map((m, i) => (
                <g
                  key={`strands${i}`}
                  transform={m ? "translate(887 0) scale(-1 1)" : undefined}
                  clipPath={`url(#${id}-pink-lock)`}
                  fill="none"
                >
                  {Array.from({ length: 20 }, (_, n) => (
                    <path
                      key={n}
                      transform={`translate(${n * 1.2 - 11} 0)`}
                      d="M362 89Q335 146 352 201Q375 249 344 292Q324 318 342 346Q358 376 329 407Q311 430 327 456Q343 481 310 528Q292 551 288 580"
                      stroke={m ? "#8e879c" : "#f1afd0"}
                      strokeOpacity={n % 4 === 0 ? 0.3 : 0.1}
                      strokeWidth={n % 4 === 0 ? 1.25 : 0.5}
                    />
                  ))}
                </g>
              ))}
              <path
                d="M358 102Q337 152 352 204Q374 245 344 292Q328 316 343 346Q353 369 331 397Q312 427 325 448Q340 477 313 513"
                fill="none"
                stroke="#f0a2cc"
                strokeOpacity=".6"
                strokeWidth="2"
              />
            </>
          )}
        </>
      )}
      {cut === "punk-fishnets" && (
        <g mask={`url(#${id}-skin)`}>
          {[false, true].map((m, i) => (
            <g
              key={i}
              transform={m ? "translate(887 0) scale(-1 1)" : undefined}
            >
              <path d={leg} fill={main} fillOpacity=".08" />
              <path d={leg} fill={`url(#${id}-net)`} />
              <path
                d="M277 933Q332 950 425 933L423 953Q332 970 279 953Z"
                fill={main}
                opacity=".7"
              />
            </g>
          ))}
        </g>
      )}
      {cut === "punk-boots" &&
        [false, true].map((m, i) => (
          <g key={i} transform={m ? "translate(887 0) scale(-1 1)" : undefined}>
            {shape(boot)}
            <PunkFinish cut={cut} surface={boot} />
            <g clipPath={`url(#${id}-boot)`}>
              <path d={boot} fill={`url(#${id}-leather)`} />
              <path
                d="M377 1306Q384 1390 361 1519L350 1567"
                fill="none"
                stroke="#08070d"
                strokeWidth="8"
              />
              <path
                d="M377 1306Q384 1390 361 1519L350 1567"
                fill="none"
                stroke={`url(#${id}-metal)`}
                strokeWidth="3.3"
                strokeDasharray="1.2 2.1"
              />
              <path
                d="M372 1318L379 1318 378 1330 372 1330Z"
                fill={`url(#${id}-metal)`}
                stroke="#272030"
                strokeWidth=".8"
              />
              <path d="M278 1739Q335 1753 396 1733V1762H276Z" fill="#121019" />
              <path
                d="M285 1744Q336 1755 390 1740"
                fill="none"
                stroke="#958399"
                strokeWidth="1.3"
                strokeOpacity=".6"
              />
              <path
                d="M290 1734Q334 1747 391 1729"
                fill="none"
                stroke="#cdb5c7"
                strokeOpacity=".42"
                strokeWidth="1.2"
                strokeDasharray="2 2.5"
              />
            </g>
            <path
              d="M309 1312Q331 1320 371 1310M290 1739Q336 1752 393 1734"
              fill="none"
              stroke="#08070b"
              strokeWidth="5"
            />
            <path
              d="M316 1340Q306 1460 318 1552Q325 1602 308 1661"
              fill="none"
              stroke="#d0c6d7"
              strokeOpacity=".08"
              strokeWidth="2"
            />
            <path
              d="M309 1557L358 1571M306 1572L355 1587M305 1591L352 1603"
              fill="none"
              stroke="#07060b"
              strokeOpacity=".6"
              strokeWidth="3"
            />
          </g>
        ))}
    </g>
  );
}
