/** Calibrated overlays on the single 887 x 1774 body, not arbitrary image scaling. */
export type PoseSleeves = {
  front: string;
  main: string;
  /** Optional grayscale fabric relief for this pose, registered like the dye mask. */
  mainLight?: string;
  protected?: string;
  /** Portion of the sleeve that covers the hand at the wrist, in native coordinates.
   * Omit for the standard long cuff, or use false for a sleeve that leaves the wrist bare. */
  cuffRim?: string | false;
  /** Local registration of the hip hand when a non-standard cuff requires it. */
  hipHandOffset?: readonly [number, number];
  detail?: string;
  mainBase?: string;
  detailBase?: string;
};
export type GarmentPoseFit = {
  kind: "shared" | "bare-arms" | "sleeves" | "procedural" | "unavailable";
  sleeves?: PoseSleeves;
  /** The posed drawing includes the torso; hide frontal top art, retain its coverage. */
  replaceTop?: boolean;
  /** Precisely calibrated openings that reveal the unchanged canonical skin. */
  bodyReveals?: readonly string[];
  bareShoulders?: boolean;
  /** Retain the posed arm as the backdrop for a translucent sleeve. */
  sheerSleeves?: boolean;
  /** Draw the canonical posed arms below a fully registered transparent top. */
  canonicalSleeveUnderlay?: true;
  /** Painted upper-arm sleeves leave the original elbows and forearms visible. */
  shortSleeves?: boolean;
  neckband?: readonly [number, number, number, number];
};
export type GarmentPoseProfile = {
  body: "fashion-user-hands-v2";
  canvas: readonly [887, 1774];
  reviewed: true;
  fits: Readonly<
    Record<"front" | "hand-on-hip" | "heart-hands", GarmentPoseFit>
  >;
};
