export const STATIC_POSES = ["front", "hand-on-hip", "heart-hands"] as const;
export type StaticPose = (typeof STATIC_POSES)[number];
export const STATIC_POSES_KEY = "character-static-poses-v1";
export function readStaticPoses(
  raw: string | null,
): Record<string, StaticPose> {
  try {
    const value: unknown = JSON.parse(raw ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(([, pose]) =>
        STATIC_POSES.includes(pose as StaticPose),
      ),
    ) as Record<string, StaticPose>;
  } catch {
    return {};
  }
}
