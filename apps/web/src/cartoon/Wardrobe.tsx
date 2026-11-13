import { useId } from "react";
import { PilotGarment } from "./PilotGarment";
import type { MorphologyId } from "./model";
import { isFemale } from "./model";
import type { ClothingCategory } from "../shop/catalog";

const palettes = {
  ivory: ["#fffdf5", "#f3e9d6", "#d8c8ad", "#9c8c78"],
  lilac: ["#eadcfc", "#c3a2e6", "#9571b9", "#684d89"],
  rose: ["#ffe1ec", "#e6a3bf", "#bb7298", "#87516e"],
  denim: ["#a9c9ed", "#719bc7", "#4b729e", "#345676"],
  night: ["#747184", "#494657", "#302d3d", "#22202d"],
  sage: ["#d4e6ce", "#a4c79c", "#78976f", "#526c4c"],
  cocoa: ["#d9b9a3", "#b3886c", "#89664f", "#5f4638"],
} as const;
const styles: Record<
  string,
  Record<"tops" | "bottoms" | "shoes", (keyof typeof palettes)[]>
> = {
  iris: {
    tops: ["ivory", "lilac", "rose"],
    bottoms: ["denim", "ivory", "night"],
    shoes: ["ivory", "night", "rose"],
  },
  june: {
    tops: ["rose", "lilac", "ivory"],
    bottoms: ["ivory", "denim", "night"],
    shoes: ["cocoa", "ivory", "rose"],
  },
  milo: {
    tops: ["sage", "lilac", "denim"],
    bottoms: ["night", "ivory", "denim"],
    shoes: ["ivory", "night", "rose"],
  },
  noa: {
    tops: ["lilac", "sage", "rose"],
    bottoms: ["night", "ivory", "denim"],
    shoes: ["ivory", "night", "lilac"],
  },
};
import {
  bodice,
  mini,
  pants,
  coat,
  cardigan,
  leftBoot,
  rightBoot,
  camisoleStraps,
  sneakers,
  bootCuffs,
} from "./geometry";

/** V6 silhouettes: front-facing cartoon doll coordinates, shared by every view. */
export function CartoonGarment({
  characterId,
  category,
  variant,
  pass = "all",
  morphology,
}: {
  characterId: string;
  pass?: "all" | "back" | "front";
  category: Exclude<ClothingCategory, "hair" | "accessories">;
  variant: number;
  morphology?: MorphologyId;
}) {
  const id = useId(),
    female = isFemale(characterId);
  const style =
    (styles[characterId] ?? styles.iris)[category][variant] ?? "ivory";
  const [light, main, shadow, edge] = palettes[style];
  const fill = `url(#${id}-cloth)`,
    dark = `url(#${id}-dark)`,
    metal = `url(#${id}-silver)`;
  const outline = {
    stroke: edge,
    strokeWidth: 1.5,
    strokeLinejoin: "round" as const,
  };
  if (morphology && variant !== 0)
    throw new Error(
      "Only the three calibrated pilot pieces are available on these bodies",
    );
  if (morphology)
    return (
      <PilotGarment morphology={morphology} category={category} pass={pass} />
    );
  if (pass === "back")
    return category === "shoes" ? (
      <g data-layer="shoes-back" fill={shadow} stroke={edge} strokeWidth="1.5">
        {female ? (
          <path d="M158 765Q194 743 237 765L234 780Q195 765 157 782Z M251 765Q290 743 329 765L331 782Q290 765 252 780Z" />
        ) : (
          <path d="M162 954Q185 938 207 954L207 964Q185 952 162 965Z M277 954Q298 938 317 954L317 965Q298 952 277 964Z" />
        )}
      </g>
    ) : null;
  return (
    <g
      data-layer={`${category}-front`}
      data-art="cartoon-v6"
      data-category={category}
      data-variant={variant}
    >
      {pass === "all" && (
        <CartoonGarment
          characterId={characterId}
          category={category}
          variant={variant}
          pass="back"
        />
      )}
      <defs>
        <linearGradient id={`${id}-cloth`}>
          <stop stopColor={shadow} />
          <stop offset=".23" stopColor={main} />
          <stop offset=".52" stopColor={light} />
          <stop offset=".79" stopColor={main} />
          <stop offset="1" stopColor={shadow} />
        </linearGradient>
        <linearGradient id={`${id}-dark`}>
          <stop stopColor={edge} />
          <stop offset="1" stopColor={main} />
        </linearGradient>
        <linearGradient id={`${id}-silver`} x2=".8" y2="1">
          <stop stopColor="#fff" />
          <stop offset=".45" stopColor="#c7d4e0" />
          <stop offset=".7" stopColor="#fff" />
          <stop offset="1" stopColor="#8f9aaf" />
        </linearGradient>
        <clipPath id={`${id}-skirt`}>
          <path d={mini} />
        </clipPath>
      </defs>
      {category === "tops" && characterId === "iris" && (
        <>
          <g fill={fill} {...outline}>
            <path d={camisoleStraps} />
            <path d={bodice} />
          </g>
          <path
            d="M172 312Q185 297 207 305L243 314L279 305Q301 297 314 312"
            fill="none"
            stroke={light}
            strokeWidth="4"
            strokeDasharray="1 4"
            strokeLinecap="round"
          />
          <path
            d="M194 329Q204 358 210 394M223 331L226 398M264 331L260 399M291 329Q280 360 278 395"
            fill="none"
            stroke={shadow}
            strokeWidth="1.5"
            opacity=".75"
          />
          <path
            d="M198 329Q207 357 214 394M227 333L230 398M268 333L264 398M295 329Q284 361 282 395"
            fill="none"
            stroke={light}
            strokeWidth="1.2"
          />
          <path
            d="M200 357L233 350L214 366L239 361L223 379L247 372M269 349L293 360L271 369L287 382"
            fill="none"
            stroke={light}
            strokeWidth="2"
            opacity=".55"
          />
          <path
            d="M199 391Q243 400 287 391"
            fill="none"
            stroke={edge}
            strokeWidth="1.3"
          />
          <g
            transform="translate(243 326)"
            fill={light}
            stroke={edge}
            strokeWidth=".8"
          >
            <path d="M0 0C-22-17-23 10-2 5L-8 29L-1 26L3 7L10 29L16 27L6 4C26 10 25-17 4 0Z" />
            <ellipse cx="2" cy="2" rx="3.6" ry="4.2" />
          </g>
        </>
      )}
      {category === "bottoms" && female && (
        <>
          <path d={mini} fill={fill} {...outline} />
          <g clipPath={`url(#${id}-skirt)`}>
            {[
              [177, 466, 136, 566, 173, 576, 201, 472],
              [201, 472, 173, 576, 217, 583, 229, 478],
              [229, 478, 217, 583, 263, 583, 258, 478],
              [258, 478, 263, 583, 309, 576, 286, 472],
              [286, 472, 309, 576, 350, 566, 307, 465],
            ].map((p, i) => (
              <path
                key={i}
                d={`M${p[0]} ${p[1]}L${p[2]} ${p[3]}L${p[4]} ${p[5]}L${p[6]} ${p[7]}Z`}
                fill={i % 2 ? dark : fill}
                stroke={edge}
                strokeWidth="1.2"
              />
            ))}
            <path
              d="M193 472L161 564M220 479L206 578M251 480L253 580M280 477L298 571M301 470L333 563"
              fill="none"
              stroke={light}
              strokeWidth="2"
              opacity=".75"
            />
          </g>
          <path
            d="M193 420Q242 432 293 420L321 465Q243 483 165 466Z"
            fill={fill}
            {...outline}
          />
          <path
            d="M193 424Q244 437 294 424M180 462Q244 479 305 461M139 564Q243 591 347 564"
            fill="none"
            stroke={light}
            strokeWidth="1.4"
            strokeDasharray={style === "denim" ? "3 2" : undefined}
          />
          {[206, 231, 280].map((x) => (
            <path
              key={x}
              d={`M${x} 429l-3 40h5l3-40Z`}
              fill={main}
              stroke={edge}
              strokeWidth=".8"
            />
          ))}
          <circle
            cx="266"
            cy="443"
            r="4.5"
            fill={metal}
            stroke={edge}
            strokeWidth=".8"
          />
          <path
            d="M253 446L251 472L244 501"
            fill="none"
            stroke={edge}
            strokeWidth="1.3"
          />
        </>
      )}
      {category === "tops" && characterId === "june" && (
        <>
          <path d={cardigan} fill={fill} {...outline} />
          <path
            d="M211 252Q243 294 275 252L281 264Q262 295 243 302Q223 296 205 265Z"
            fill={light}
            {...outline}
          />
          <path d="M245 310L245 426" stroke={shadow} strokeWidth="6" />
          <path d="M248 311L248 425" stroke={light} strokeWidth="1.5" />
          {[329, 352, 375, 398, 418].map((y) => (
            <circle
              key={y}
              cx="245"
              cy={y}
              r="3.4"
              fill={metal}
              stroke={edge}
              strokeWidth=".8"
            />
          ))}
          <path
            d="M72 527L114 543L106 566L61 550Z M369 543L411 527L425 550L377 567Z"
            fill={dark}
            {...outline}
          />
          <path
            d="M163 315L122 504M315 315L366 505M190 413Q242 428 296 413"
            fill="none"
            stroke={light}
            strokeWidth="2.5"
            opacity=".6"
          />
        </>
      )}
      {category === "shoes" && female && (
        <>
          <g fill={fill} {...outline}>
            <path d={leftBoot} />
            <path d={rightBoot} />
          </g>
          <path
            d="M154 980Q190 1002 234 985L235 998Q197 1014 165 1002L152 991Z M251 984Q293 1003 332 981L334 992Q301 1014 266 1004L250 997Z"
            fill={shadow}
            {...outline}
          />
          <path
            d="M158 988Q196 1008 232 994M254 994Q296 1009 330 989"
            fill="none"
            stroke={light}
            strokeWidth="2"
          />
          <path
            d="M176 815L183 922Q176 958 166 973M274 815L280 922Q298 961 317 977"
            fill="none"
            stroke={light}
            strokeWidth="9"
            opacity=".3"
          />
          <g fill={fill} {...outline}>
            <path d={bootCuffs} />
          </g>
          {Array.from({ length: 17 }, (_, i) => (
            <g
              key={i}
              fill="none"
              stroke={i % 2 ? light : shadow}
              strokeWidth="1"
              opacity=".85"
            >
              <path d={`M${160 + i * 4.4} ${768 + (i % 3)}q-3 10 -1 20l-3 8`} />
              <path d={`M${253 + i * 4.4} ${769 + (i % 3)}q3 10 1 20l3 8`} />
            </g>
          ))}
          {characterId === "iris" ? (
            <>
              <Laces
                points={[
                  [196, 819],
                  [197, 845],
                  [198, 872],
                  [200, 899],
                  [201, 925],
                  [202, 949],
                  [202, 973],
                ]}
                light={light}
                edge={edge}
              />
              <Laces
                points={[
                  [289, 819],
                  [288, 845],
                  [286, 872],
                  [285, 899],
                  [284, 925],
                  [284, 949],
                  [289, 973],
                ]}
                light={light}
                edge={edge}
              />
            </>
          ) : (
            <>
              <path
                d="M164 812Q198 820 231 812M255 812Q289 820 325 812"
                stroke={edge}
                strokeWidth="5"
                fill="none"
              />
              <g fill={metal} stroke={edge}>
                <rect x="179" y="807" width="17" height="14" rx="2" />
                <rect x="275" y="807" width="17" height="14" rx="2" />
              </g>
              <path d="M183 811h9v6h-9Z M279 811h9v6h-9Z" fill={main} />
            </>
          )}
        </>
      )}
      {category === "bottoms" && !female && (
        <>
          <path d={pants} fill={fill} {...outline} />
          <path
            d="M167 452Q240 468 314 452L322 476Q242 491 157 476Z"
            fill={dark}
            {...outline}
          />
          <path
            d="M241 482L241 621M168 487Q161 518 145 531M313 488Q323 516 336 531M164 755L203 768M278 768L315 755M151 954Q181 968 213 954M266 954Q294 968 320 953"
            fill="none"
            stroke={light}
            strokeWidth="1.4"
            opacity=".75"
          />
          <path
            d="M223 550L210 749L201 940M260 549L278 749L286 942"
            fill="none"
            stroke={light}
            strokeWidth="7"
            opacity=".2"
          />
          <circle cx="252" cy="470" r="4" fill={metal} />
        </>
      )}
      {category === "tops" && !female && (
        <>
          <path d={coat} fill={fill} {...outline} />
          {characterId === "noa" && (
            <path
              d="M151 244Q121 252 110 286L90 410L68 539L111 557L140 450L157 369L179 285L205 244Z M275 244L301 285L324 369L338 450L369 557L412 540L390 410L369 285Q357 251 329 243Z"
              fill="#faf1dc"
              {...outline}
            />
          )}
          <path
            d="M212 249Q240 272 268 249L266 478Q240 485 215 478Z"
            fill="#fff8e9"
            stroke={edge}
            strokeWidth="1"
          />
          {characterId === "milo" ? (
            <>
              <path
                d="M200 239L240 268L216 297L192 266Z M280 239L289 266L264 297L240 268Z"
                fill={fill}
                {...outline}
              />
              <path
                d="M158 337H202V376H158Z M278 337H322V376H278Z"
                fill={fill}
                {...outline}
              />
              <path
                d="M158 337L180 352L202 337M278 337L300 352L322 337"
                fill="none"
                stroke={edge}
              />
              <circle cx="180" cy="350" r="2.5" fill={metal} />
              <circle cx="300" cy="350" r="2.5" fill={metal} />
            </>
          ) : (
            <>
              <path
                d="M200 239Q240 269 280 239L284 254Q240 289 195 255Z"
                fill={dark}
                {...outline}
              />
              <path
                d="M200 246Q240 276 280 246M199 253Q240 284 282 253"
                fill="none"
                stroke="#fff6df"
                strokeWidth="2"
              />
            </>
          )}
          <path
            d="M76 519L114 537L109 558L70 541Z M364 539L401 519L408 541L371 559Z"
            fill={dark}
            {...outline}
          />
          <path
            d="M82 527L109 541M370 543L399 529M163 472Q240 487 318 473"
            stroke={light}
            strokeWidth="2"
            fill="none"
            opacity=".8"
          />
          {[325, 359, 393, 427, 462].map((y) => (
            <circle
              key={y}
              cx="269"
              cy={y}
              r="3"
              fill={metal}
              stroke={edge}
              strokeWidth=".6"
            />
          ))}
        </>
      )}
      {category === "shoes" && !female && (
        <>
          <path d={sneakers} fill={fill} {...outline} />
          <path
            d="M140 986Q177 1004 220 986L222 999Q184 1019 146 1006L139 995Z M264 986Q306 1006 340 986L341 997L335 1007Q295 1019 263 1000Z"
            fill="#f6efdf"
            {...outline}
          />
          <path
            d="M165 966L203 971M163 975L206 980M279 971L316 966M276 981L320 975"
            stroke={light}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M145 997Q181 1010 218 995M267 996Q304 1011 337 997"
            stroke={shadow}
            strokeWidth="1.3"
            fill="none"
          />
        </>
      )}
    </g>
  );
}
function Laces({
  points,
  light,
  edge,
}: {
  points: [number, number][];
  light: string;
  edge: string;
}) {
  return (
    <g>
      {points.map(([x, y], i) => (
        <g key={i} fill={light} stroke={edge} strokeWidth=".8">
          <circle cx={x - 13} cy={y} r="2.5" />
          <circle cx={x + 13} cy={y} r="2.5" />
          {points[i + 1] && (
            <path
              d={`M${x - 13} ${y}L${points[i + 1][0] + 13} ${points[i + 1][1]}M${x + 13} ${y}L${points[i + 1][0] - 13} ${points[i + 1][1]}`}
              fill="none"
              stroke={light}
              strokeWidth="2"
            />
          )}
        </g>
      ))}
    </g>
  );
}

/** Accessory rear/strap and front passes are separate so hands stay in front of handles. */
export function CartoonAccessory({
  characterId,
  variant,
  pass = "front",
}: {
  characterId: string;
  variant: number;
  pass?: "strap" | "front";
}) {
  const female = isFemale(characterId);
  if (pass === "strap")
    return variant === 2 ? (
      <path
        d="M401 570Q432 540 450 589L459 645"
        fill="none"
        stroke="#d1d8e4"
        strokeWidth="7"
      />
    ) : null;
  if (variant === 1)
    return (
      <g stroke="#282330" strokeWidth="4" fill="#302936">
        <path d="M166 132L237 145Q237 176 203 177Q180 176 166 132Z M250 145L320 132Q308 176 284 177Q251 177 250 145Z" />
        <path
          d="M237 150Q243 144 250 150M165 135L154 130M321 135L331 130"
          fill="none"
        />
        <path
          d="M182 145L218 154M265 153L300 144"
          stroke="#9a9aad"
          strokeWidth="3"
          opacity=".7"
        />
      </g>
    );
  if (variant === 2)
    return (
      <g fill="#fffdf4" stroke="#b6b6c9" strokeWidth="2">
        <path d="M370 642Q412 659 458 642L468 711Q460 753 416 750Q377 744 367 712Z" />
        <path
          d="M370 642Q408 683 458 642L452 671Q412 699 374 674Z"
          fill="#f4efee"
        />
        <path
          d="M385 641Q390 589 430 604Q452 612 452 646"
          fill="none"
          strokeWidth="7"
        />
        <path
          d="M382 700Q407 739 449 720"
          fill="none"
          stroke="#fff"
          strokeWidth="4"
        />
      </g>
    );
  return (
    <g stroke="#a9b1c8" strokeWidth="1.2" fill="#fffdf3">
      {female && (
        <>
          {[160, 325].map((x) => (
            <g key={x}>
              <circle cx={x} cy="166" r="4.8" />
              <path d={`M${x} 171v20`} fill="none" />
              <ellipse cx={x} cy="200" rx="8" ry="11" />
              <path d={`M${x} 212l-5 13h10Z`} />
            </g>
          ))}
        </>
      )}
      <path
        d="M213 251Q243 282 273 251M204 264Q243 307 282 264"
        fill="none"
        stroke="#e1e6f2"
        strokeWidth="3"
        strokeDasharray="1 5"
        strokeLinecap="round"
      />
      <path d="M243 292l4 8 8 1-6 6 1 8-7-4-7 4 1-8-6-6 8-1Z" />
      {female && (
        <>
          <path
            d="M181 464Q242 506 306 464"
            fill="none"
            stroke="#ecf1fc"
            strokeWidth="3"
            strokeDasharray="1 5"
            strokeLinecap="round"
          />
          {[206, 242, 280].map((x, i) => (
            <path
              key={x}
              transform={`translate(${x} ${i === 1 ? 491 : 480}) scale(.65)`}
              d="M0-9L3-3L10-2L5 3L6 10L0 6L-6 10L-5 3L-10-2L-3-3Z"
            />
          ))}
          <path
            d="M78 525L111 540M374 540L404 526"
            stroke="#f4f3ff"
            strokeWidth="5"
          />
        </>
      )}
    </g>
  );
}
