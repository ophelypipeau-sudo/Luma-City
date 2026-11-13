/** Canonical outlines in the body anchor coordinate system. Never fit from image bounds. */
import { DOLL_ANCHORS, DOLL_MALE_ANCHORS, isFemale } from "./model";
export { morphologyFit as pilotGarmentGeometry } from "./morphology-fits";
export const bodice =
  "M171 311Q185 297 207 305L243 314L279 305Q301 297 315 311Q315 341 300 365L288 392Q243 402 198 392L186 365Q172 342 171 311Z";
export const mini =
  "M193 420Q242 432 293 420L321 465Q347 489 358 576Q243 604 128 576Q140 489 165 466Z";
export const pants =
  "M167 452Q240 468 314 452L337 521L343 596L344 780L335 958Q295 975 265 961L245 642L235 642L214 961Q181 974 149 958L140 780L137 596L145 521Z";
export const coat =
  "M205 236Q240 260 275 236L329 243Q357 251 369 285L390 410L412 540L369 557L338 450L324 369L322 480Q240 496 158 480L157 369L140 450L111 557L68 539L90 410L110 286Q121 252 151 244Z";
export const cardigan =
  "M210 251Q242 275 275 251L323 260Q343 270 349 301L365 410L423 550L377 566L323 434L309 365L295 420Q243 434 191 420L177 365L155 434L106 566L63 550L118 410L136 300Q144 267 163 260Z";
export const leftBoot =
  "M161 789Q195 800 233 790L228 849L220 925Q221 953 234 974L235 995Q206 1012 166 999L152 989L156 967L171 933L165 865Z";
export const rightBoot =
  "M253 790Q288 800 326 788L321 865L309 932L327 968L333 990Q309 1010 267 1000L250 994L252 974Q267 954 266 925L258 849Z";

export function garmentOutline(
  characterId: string,
  category: "tops" | "bottoms",
) {
  if (category === "bottoms") return isFemale(characterId) ? mini : pants;
  return characterId === "iris"
    ? bodice
    : characterId === "june"
      ? cardigan
      : coat;
}
export const camisoleStraps =
  "M173 265Q184 282 193 309L187 315Q177 288 167 270Z M305 265L311 270Q300 288 296 315L289 310Q296 282 305 265Z";
export const bootCuffs =
  "M158 760Q195 774 237 760L235 800Q195 814 155 800L158 791L154 787L159 781L155 776Z M251 761Q290 774 328 760L332 779L328 783L333 790L329 796L333 800Q289 814 251 800Z";
export const sneakers =
  "M162 950Q185 958 207 951L216 976L221 997Q189 1016 146 1004L139 992L147 975Z M277 951Q298 958 317 950L334 975L341 991L334 1005Q291 1016 264 998L265 976Z";
/** Remove the original foot, including toes outside the shoe. Starts inside the cuff.
 * Each leg has its own anchored region, never a canvas-wide horizontal cut. */
export function shoeBodyCutouts(characterId: string) {
  const female = isFemale(characterId);
  const anchors = female ? DOLL_ANCHORS : DOLL_MALE_ANCHORS;
  const top = anchors.ankles[0][1] - (female ? 160 : -27);
  return anchors.ankles.map(
    ([x]) => `M${x - 64} ${top}H${x + 64}V${anchors.floor + 16}H${x - 64}Z`,
  );
}
