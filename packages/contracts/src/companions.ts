import { z } from "zod";

export const companionNameSchema = z.string().max(100)
  .transform((name) => name.normalize("NFC").trim().replace(/\s+/g, " "))
  .pipe(z.string().min(2, "Choisis un nom d’au moins 2 caractères.")
    .max(20, "Le nom peut contenir jusqu’à 20 caractères.")
    .regex(/^[\p{L}\p{M}0-9]+(?:[ '-][\p{L}\p{M}0-9]+)*$/u, "Utilise des lettres, des chiffres ou des espaces."));

export type OwnedCompanion = { id: string; modelId: string; name: string };
export type CompanionCollection = { items: OwnedCompanion[]; equipped: OwnedCompanion | null };
