import { BASE_FIT } from "./base-fit";

/** One fixed body, one common canvas for all transparent garment passes. */
export const AVATAR_BASE = {
  id: "base-v1",
  src: "/assets/avatar/body/base.png",
  width: 887,
  height: 1774,
  viewWidth: 480,
  viewHeight: 1024,
  fit: BASE_FIT,
} as const;

export type AvatarBodyBase = {
  id: string;
  src: string;
  width: number;
  height: number;
  viewWidth: number;
  viewHeight: number;
};
/** User-supplied correction: preserve every pixel, especially the drawn hands. */
export const FASHION_BASE: AvatarBodyBase = {
  id: "fashion-user-hands-v2",
  src: "/assets/avatar/fashion-v2/body-user.png",
  width: 887,
  height: 1774,
  viewWidth: 480,
  viewHeight: 1024,
};
