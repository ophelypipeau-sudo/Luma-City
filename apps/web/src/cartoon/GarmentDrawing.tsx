import { useId } from "react";

import type { GarmentGeometry } from "../avatar/geometry";

/** Native drawings on the approved body's canvas; the same pieces and contours
 * are used in the catalogue, fitting room and body coverage. */
export function GarmentDrawing({
  geometry,
  category,
  pass = "all",
}: {
  geometry: GarmentGeometry;
  category: "tops" | "bottoms" | "shoes";
  pass?: "all" | "front" | "back";
}) {
  const id = useId(),
    f = geometry,
    ivory = `url(#${id}-ivory)`,
    denim = `url(#${id}-denim)`;
  const outline = {
    stroke: "#a89a85",
    strokeWidth: 1.7,
    strokeLinejoin: "round" as const,
  };
  if (pass === "back")
    return category === "shoes" ? (
      <g
        data-layer="pilot-shoes-back"
        fill="#d3c6b6"
        stroke="#a89a85"
        strokeWidth="1.5"
      >
        {f.boots.map((b, i) => (
          <path key={i} d={b.rear} />
        ))}
      </g>
    ) : null;
  return (
    <g data-layer={`pilot-${category}-front`}>
      {pass === "all" && (
        <GarmentDrawing geometry={geometry} category={category} pass="back" />
      )}
      <defs>
        <linearGradient id={`${id}-ivory`}>
          <stop stopColor="#d6c6b2" />
          <stop offset=".19" stopColor="#f6eddf" />
          <stop offset=".48" stopColor="#fffdf6" />
          <stop offset=".72" stopColor="#efe3d0" />
          <stop offset="1" stopColor="#c9b79f" />
        </linearGradient>
        <linearGradient id={`${id}-denim`}>
          <stop stopColor="#345a86" />
          <stop offset=".24" stopColor="#789fc9" />
          <stop offset=".52" stopColor="#aac6e3" />
          <stop offset=".78" stopColor="#6d96c1" />
          <stop offset="1" stopColor="#345a86" />
        </linearGradient>
        <linearGradient id={`${id}-fold`}>
          <stop stopColor="#294a74" />
          <stop offset=".2" stopColor="#527eac" />
          <stop offset=".68" stopColor="#8fb5d8" />
          <stop offset="1" stopColor="#c3d8e9" />
        </linearGradient>
        <radialGradient id={`${id}-cup`}>
          <stop stopColor="#fffdf7" />
          <stop offset=".65" stopColor="#f2e8d8" />
          <stop offset="1" stopColor="#d1c0a7" />
        </radialGradient>
        <clipPath id={`${id}-top`}>
          <path d={f.top} />
        </clipPath>
        <clipPath id={`${id}-skirt`}>
          <path d={f.skirt} />
        </clipPath>
      </defs>
      {category === "tops" && (
        <>
          <path d={f.straps} fill={ivory} {...outline} />
          <path d={f.top} fill={ivory} {...outline} />
          <g clipPath={`url(#${id}-top)`}>
            <ellipse
              cx={f.c - 52}
              cy="558"
              rx="74"
              ry="54"
              fill={`url(#${id}-cup)`}
            />
            <ellipse
              cx={f.c + 52}
              cy="558"
              rx="74"
              ry="54"
              fill={`url(#${id}-cup)`}
            />
            <path
              d={`M${f.m.bust[0] + 9} 551Q${f.c - 69} 604 ${f.c - 3} 584Q${f.c + 67} 606 ${f.m.bust[1] - 9} 551`}
              fill="none"
              stroke="#cbbca7"
              strokeWidth="1.8"
            />
            {[-58, -27, 27, 58].map((dx, i) => (
              <g key={dx}>
                <path
                  d={`M${f.c + dx} 592Q${f.c + dx * 0.78} 633 ${f.c + dx * 0.67} 678`}
                  fill="none"
                  stroke="#c7b59c"
                  strokeWidth="3"
                  opacity=".55"
                />
                <path
                  d={`M${f.c + dx + 3} 593Q${f.c + dx * 0.78 + 3} 633 ${f.c + dx * 0.67 + 3} 678`}
                  fill="none"
                  stroke="#fffdf6"
                  strokeWidth="2"
                />
                {[613, 636, 660].map((y) => (
                  <circle
                    key={y}
                    cx={f.c + dx * 0.8}
                    cy={y}
                    r="1.4"
                    fill="#fffdf5"
                  />
                ))}
              </g>
            ))}
            <path
              d={`M${f.m.bust[0]} 536Q${f.c - 65} 517 ${f.c} 532Q${f.c + 65} 517 ${f.m.bust[1]} 536`}
              stroke="#fffdf7"
              strokeWidth="5"
              strokeDasharray="1 5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={`M${f.m.torso675[0]} 671Q${f.c} 686 ${f.m.torso675[1]} 671`}
              stroke="#c0ad92"
              strokeWidth="2"
              fill="none"
            />
          </g>
          <g
            transform={`translate(${f.c} 549)`}
            fill="#fffdf7"
            stroke="#b6a58d"
            strokeWidth="1.1"
          >
            <path d="M0 0C-26-25-35 8-4 6L-12 42L-4 38L4 8L13 41L21 37L7 5C36 9 30-25 4 0Z" />
            <ellipse cx="2" cy="2" rx="5" ry="6" />
          </g>
        </>
      )}
      {category === "bottoms" && (
        <>
          <path d={f.skirt} fill={denim} stroke="#345574" strokeWidth="2" />
          <g clipPath={`url(#${id}-skirt)`}>
            {Array.from({ length: 7 }, (_, i) => {
              const top = f.bandL + ((f.bandR - f.bandL) * i) / 7,
                bottom = f.hemL + ((f.hemR - f.hemL) * i) / 7,
                nextTop = f.bandL + ((f.bandR - f.bandL) * (i + 1)) / 7,
                nextBottom = f.hemL + ((f.hemR - f.hemL) * (i + 1)) / 7;
              return (
                <g key={i}>
                  <path
                    d={`M${top} 799L${bottom} 1068L${nextBottom} 1068L${nextTop} 799Z`}
                    fill={`url(#${id}-fold)`}
                    stroke="#426b96"
                    strokeWidth="1.3"
                  />
                  <path
                    d={`M${top + 3} 817L${bottom + 4} 1049`}
                    stroke="#bfd5e9"
                    opacity=".7"
                    strokeWidth="2.3"
                  />
                </g>
              );
            })}
          </g>
          <g clipPath={`url(#${id}-skirt)`}>
            <path d={f.belt} fill={denim} stroke="#345574" strokeWidth="1.8" />
          </g>
          <path
            d={`M${f.m.waist[0] + 4} 731Q443 755 ${f.m.waist[1] - 4} 731M${f.bandL + 3} 789Q443 829 ${f.bandR - 3} 789M${f.hemL + 8} 1043Q443 1080 ${f.hemR - 8} 1043`}
            fill="none"
            stroke="#c0d2df"
            strokeWidth="1.8"
            strokeDasharray="4 3"
          />
          {[0.2, 0.43, 0.73].map((t) => (
            <path
              key={t}
              d={`M${f.m.waist[0] + (f.m.waist[1] - f.m.waist[0]) * t} 737l-6 58h8l6-58Z`}
              fill="#719bc1"
              stroke="#3a5e83"
              strokeWidth="1.2"
            />
          ))}
          <circle
            cx="466"
            cy="756"
            r="6"
            fill="#e8e5d7"
            stroke="#777e8a"
            strokeWidth="1.5"
          />
          <path
            d="M451 764L448 808L442 846"
            fill="none"
            stroke="#36597f"
            strokeWidth="1.8"
          />
        </>
      )}
      {category === "shoes" &&
        f.boots.map((b, i) => (
          <g key={i}>
            <path d={b.front} fill={ivory} {...outline} />
            <path d={b.sole} fill="#cbbba6" {...outline} />
            <path
              d={`M${b.foot[0] - 3} 1727Q${b.center} 1737 ${b.foot[1] + 2} 1727`}
              fill="none"
              stroke="#fffdf6"
              strokeWidth="3"
            />
            <path
              d={`M${b.center - 23} 1403Q${b.center - 17} 1530 ${b.ankle[0] + 10} 1623`}
              stroke="#fffdf6"
              strokeWidth="15"
              opacity=".25"
              fill="none"
            />
            <path d={b.cuff} fill={ivory} {...outline} />
            {Array.from({ length: 22 }, (_, j) => (
              <path
                key={j}
                d={`M${b.outer + ((b.inner - b.outer) * j) / 21} ${1354 + (j % 3)}q${j % 2 ? 4 : -4} 19 0 37`}
                stroke={j % 2 ? "#fffdf7" : "#d7c7b1"}
                strokeWidth="1.6"
                fill="none"
                opacity=".85"
              />
            ))}
            {Array.from({ length: 7 }, (_, j) => {
              const y = 1420 + j * 44,
                t = j / 6,
                ankleCenter = (b.ankle[0] + b.ankle[1]) / 2,
                x = b.center * (1 - t) + ankleCenter * t;
              return (
                <g key={j} fill="#fefaf3" stroke="#ab9c85" strokeWidth="1.2">
                  <circle cx={x - 16} cy={y} r="3" />
                  <circle cx={x + 16} cy={y} r="3" />
                  {j < 6 && (
                    <path
                      d={`M${x - 16} ${y}L${x + 17} ${y + 44}M${x + 16} ${y}L${x - 15} ${y + 44}`}
                      fill="none"
                      stroke="#fffdf5"
                      strokeWidth="3"
                    />
                  )}
                </g>
              );
            })}
          </g>
        ))}
    </g>
  );
}
