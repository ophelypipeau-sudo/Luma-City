import { avatarGarment } from "./catalog";
import { AVATAR_SLOTS, type AvatarLayers } from "./model";
import { poseFit, poseProfileIssues } from "./pose-wardrobe";
import type { StaticPose } from "./static-poses";
/** Historical drafts remain viewable from the front, never guessed into a pose. */
export function outfitSupportsPose(layers: AvatarLayers, pose: StaticPose) {
  return (
    pose === "front" ||
    (!layers.top2 && !layers.extraPieces?.length && AVATAR_SLOTS.every((slot) => {
      const id = layers[slot];
      if (!id) return true;
      try {
        const piece = avatarGarment(id);
        return (
          poseProfileIssues(piece, true).length === 0 &&
          poseFit(piece, pose)?.kind !== "unavailable"
        );
      } catch {
        return false;
      }
    }))
  );
}
