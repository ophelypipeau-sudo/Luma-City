import { z } from "zod";

export const WALL_FINISHES = ["ivory", "rose", "lilac", "sage"] as const;
export const FLOOR_FINISHES = ["oak", "honey", "smoked"] as const;
export const HOME_ACCESS_MODES = ["public", "friends", "private"] as const;
export type HomeAccessMode = typeof HOME_ACCESS_MODES[number];
export type HomeInvitation = { id: string; ownerId: string; ownerName: string; guestId: string; guestName: string;
  state: "pending" | "accepted" | "declined" | "revoked"; expiresAt: string };
export type HomeAccessSettings = { mode: HomeAccessMode; revision: number; invitations: HomeInvitation[];
  friends: { id: string; name: string }[]; excluded: { id: string; name: string }[] };
export const furniturePlacementSchema = z.object({
  itemId: z.uuid(),
  x: z.number().finite().min(0).max(1000),
  y: z.number().finite().min(0).max(680),
  depth: z.number().int().min(-80).max(80),
}).strict();
export type FurniturePlacement = z.infer<typeof furniturePlacementSchema>;
export const homeDecorationSchema = z.object({
  wall: z.enum(WALL_FINISHES),
  floor: z.enum(FLOOR_FINISHES),
  placements: z.array(furniturePlacementSchema).max(100),
}).strict();
export type HomeDecoration = z.infer<typeof homeDecorationSchema>;
export const saveHomeSchema = z.object({
  generation: z.number().int(),
  expectedRevision: z.number().int().nonnegative(),
  operationId: z.uuid(),
  decoration: homeDecorationSchema,
}).strict();
export type OwnedFurniture = { id: string; modelId: string; roomId: string | null };
export type FurnitureOffer = { modelId: string; version: string; price: number };
export type FurnitureCommerce = { preview: boolean; offers: FurnitureOffer[]; balance: number };
export const buyFurnitureSchema = z.object({
  generation: z.number().int(), operationId: z.uuid(), modelId: z.string().min(1).max(60),
  offerVersion: z.uuid(), expectedPrice: z.number().int().positive(),
}).strict();
export type HomeSnapshot = {
  homeId: string;
  roomId: string;
  ownerId: string;
  revision: number;
  capacity?: number;
  inventoryComplete?: boolean;
  decoration: HomeDecoration;
  items: OwnedFurniture[];
};

/** Room units, anchored at the feet. Positions in Presence remain percentages. */
export type HomePoint = { x: number; y: number };
export type HomeMotion = {
  id: string;
  points: HomePoint[];
  startedAt: number;
  speed: number;
  revision: number;
};
