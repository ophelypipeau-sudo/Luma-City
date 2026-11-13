import { z } from "zod";

export const starterPieces = {
  hair: ["fashion.hair-v3-01-carre", "fashion.hair-v3-02-afro", "fashion.hair-v3-03-pixie"],
  top: ["fashion.capsule-mode-cerise", "fashion.capsule-mode-champagne", "fashion.capsule-mode-nocturne"],
  bottom: ["fashion.pants-dalle", "fashion.pants-granit", "fashion.pants-rocade"],
  shoes: ["fashion.shoes-piste", "fashion.shoes-campus", "fashion.shoes-opaline"],
} as const;

export const starterOutfitSchema = z.object({
  hair: z.enum(starterPieces.hair),
  top: z.enum(starterPieces.top),
  bottom: z.enum(starterPieces.bottom),
  shoes: z.enum(starterPieces.shoes),
});
export type StarterOutfit = z.infer<typeof starterOutfitSchema>;

export const playerNameSchema = z.string().trim().min(3).max(24)
  .regex(/^[\p{L}\p{N}_-]+$/u);
export const normalizePlayerName = (name: string) => name.normalize("NFKC").toLowerCase();
export const isCreatedPlayer = (id: string) => id.startsWith("player-");
