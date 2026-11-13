import { DOLL_PATTERN, type Pose } from "./avatar-pattern";
export type TextileCut = "cropped-knit" | "tailored-shorts";
export const TEXTILE_COLORS = {
  "cropped-knit": "#343130",
  "tailored-shorts": "#716966",
} as const;
/** Garment coordinates on the approved skeleton. The material is independent
 * of this geometry; there are no photo pixels or per-pose clothing bitmaps. */
export function textilePattern(cut: TextileCut, pose: Pose = "front") {
  const mirror = (d: string) => ({ d, mirror: true });
  const waist = DOLL_PATTERN.waistY;
  if (cut === "tailored-shorts")
    return {
      body: `M306 ${waist + 5} Q443 ${waist + 29} 581 ${waist + 5} Q611 757 626 818 Q632 861 626 919 Q544 939 457 930 L443 868 429 930 Q342 939 260 919 Q253 860 262 818 Q277 756 306 ${waist + 5}Z`,
      sleeves: [],
      sleeveFolds: [],
      cuffs: [],
      forearms: [],
      seams: [
        "M307 715Q443 739 580 715",
        "M273 799Q330 810 351 730",
        "M535 730Q555 808 615 799",
        "M438 731L435 824Q449 833 467 821L470 735",
        "M443 828L443 868",
        "M266 906Q340 925 429 915",
        "M457 915Q545 925 622 906",
        "M350 706L345 736",
        "M538 706L543 736",
      ],
      folds: [
        "M300 824Q328 853 367 857",
        "M585 824Q560 852 521 857",
        "M432 865Q400 883 364 884",
        "M454 865Q487 884 526 884",
      ],
      crop: [245, 695, 400, 255] as const,
    };
  const down =
    "M300 346Q257 347 236 390 Q227 462 218 526 Q196 617 166 705 Q143 764 130 804 L142 824 190 843 Q222 807 243 756 Q288 686 310 610 Q333 536 338 453L349 382Z";
  const hip =
    "M575 346Q612 339 640 371 Q688 430 734 507 Q761 545 758 575 Q756 611 715 641L633 684 596 665 Q622 638 643 603 Q662 576 662 564 Q628 540 588 505L552 426Z";
  const heart =
    "M300 346Q268 341 247 366Q220 428 204 507L190 573 Q181 621 211 638 Q237 654 265 626 Q306 579 332 473L319 449 Q285 484 258 523L282 454 320 388Z";
  const heartFore =
    "M211 638Q237 654 265 626 Q306 579 332 473L319 449 Q276 493 249 543 Q218 586 205 611Z";
  const cuffDown = "M136 802L199 824 190 843 142 824Z";
  const cuffHip = "M604 647L647 668 633 684 596 665Z";
  const cuffHeart = "M306 464L320 487 332 473 319 449Z";
  return {
    body: `M400 323Q443 335 487 323 L495 342 Q547 342 588 347 Q606 390 593 459L579 528 Q570 577 587 647 Q511 670 443 655 Q368 646 299 658 Q309 599 304 550L292 460 Q278 396 300 346 Q351 341 392 342Z`,
    sleeves:
      pose === "heart-hands"
        ? [{ d: heart }, mirror(heart)]
        : [{ d: down }, pose === "hand-on-hip" ? { d: hip } : mirror(down)],
    sleeveFolds:
      pose === "heart-hands"
        ? [
            {
              d: "M212 577Q226 596 252 591M222 560Q237 573 260 568M288 507L316 509",
            },
            mirror(
              "M212 577Q226 596 252 591M222 560Q237 573 260 568M288 507L316 509",
            ),
          ]
        : [
            {
              d: "M211 607Q232 628 269 626M192 673Q210 692 242 689M166 752Q182 768 216 762M149 788L198 806",
            },
            pose === "hand-on-hip"
              ? {
                  d: "M693 520Q720 544 740 543M682 550Q714 567 747 563M655 608Q680 624 697 624M620 648L651 663",
                }
              : mirror(
                  "M211 607Q232 628 269 626M192 673Q210 692 242 689M166 752Q182 768 216 762M149 788L198 806",
                ),
          ],
    cuffs:
      pose === "heart-hands"
        ? [{ d: cuffHeart }, mirror(cuffHeart)]
        : [
            { d: cuffDown },
            pose === "hand-on-hip" ? { d: cuffHip } : mirror(cuffDown),
          ],
    forearms:
      pose === "heart-hands" ? [{ d: heartFore }, mirror(heartFore)] : [],
    seams: [
      "M302 645Q374 632 443 643Q515 657 584 635",
      "M310 366Q338 392 327 441",
      "M575 366Q550 392 560 441",
    ],
    folds: [
      "M319 487Q340 527 334 575",
      "M560 461Q536 511 548 554",
      "M338 599Q368 618 402 618",
      "M515 590Q541 611 575 625",
      "M363 384Q403 399 438 395",
    ],
    crop: [120, 300, 650, 565] as const,
  };
}
