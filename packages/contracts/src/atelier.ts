import { z } from "zod";
import type {GarmentPoseProfile} from './avatar-poses';
import type { FabricTone } from "./avatar-material";
export const patternIds = ["tank", "tee", "long-sleeve"] as const;
export const checkIds = [
  "neck",
  "shoulders",
  "waist",
  "hands",
  "colors",
  "style",
] as const;
export const placementSchema = z.object({
  x: z.number().min(-160).max(160),
  y: z.number().min(-180).max(180),
  scaleX: z.number().min(0.6).max(1.4),
  scaleY: z.number().min(0.6).max(1.4),
});
export const draftInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  pattern: z.enum(patternIds),
  notes: z.string().max(3000).default(""),
  price: z.number().int().min(0).max(100000),
  placement: placementSchema,
  checks: z.array(z.enum(checkIds)).max(checkIds.length),
  mainColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  detailColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  detailLabel: z.string().trim().min(1).max(60),
  hasDetail: z.boolean(),
});
export type DraftInput = z.infer<typeof draftInputSchema>;
export const defaultDraft: DraftInput = {
  name: "Mon nouveau haut",
  pattern: "tank",
  notes: "",
  price: 350,
  placement: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
  checks: [],
  mainColor: "#ffffff",
  detailColor: "#202024",
  detailLabel: "Détails",
  hasDetail: false,
};
export type AtelierDraft = DraftInput & {
  id: string;
  owner: string;
  revision: number;
  status: "draft" | "preparing" | "review" | "published" | "failed";
  createdAt: string;
  updatedAt: string;
  trashedAt?: string;
  sourceUrl: string;
  preparedUrl?: string;
  mask1Url?: string;
  mask2Url?: string;
  mainTone?: FabricTone;
  detailTone?: FabricTone;
  warnings: string[];
  error?: string;
  report?: { label: string; ok: boolean; blocking: boolean }[];
  analysis?: {
    items: {
      name: string;
      kind: string;
      pattern: string;
      occluded: boolean;
      notes: string;
    }[];
  };
  publishedId?: string;
  job?: string;
};
export type WorkshopPublication = {
  poseProfile?: GarmentPoseProfile;
  id: string;
  name: string;
  price: number;
  pattern: (typeof patternIds)[number];
  front: string;
  mask1?: string;
  mask2?: string;
  mainTone?: FabricTone;
  detailTone?: FabricTone;
  mainColor: string;
  detailColor: string;
  detailLabel: string;
  hasDetail: boolean;
  placement: DraftInput["placement"];
  version: number;
};
export type AtelierCapabilities = { automatic: boolean; reason?: string };
