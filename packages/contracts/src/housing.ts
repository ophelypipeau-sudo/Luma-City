import { z } from "zod";

export const WALL_FINISHES = ["ivory", "rose", "lilac", "sage", "midnight", "peach", "wallpaper-blush", "wallpaper-sage", "floral-rose", "floral-cream", "brick-terracotta", "brick-white", "brick-charcoal", "arches-blush", "arches-ocean", "roses-blush", "roses-blue", "daisies-cream", "daisies-lilac", "botanical-sage", "botanical-night", "stars-blush", "stars-midnight", "diamonds-gold", "diamonds-mint", "dots-pearl", "dots-rose", "magnolia-ivory", "damask-linen", "linen-natural", "fans-pearl"] as const;
export const WINDOW_MODELS = ["arch-ivory", "loft-black", "round-oak", "bay-garden"] as const;
export const windowPlacementSchema = z.object({ id: z.uuid(), modelId: z.enum(WINDOW_MODELS), x: z.number().finite().min(0).max(1000), y: z.number().finite().min(0).max(422) }).strict();
export type WindowPlacement = z.infer<typeof windowPlacementSchema>;
export const FLOOR_FINISHES = ["oak", "honey", "smoked", "walnut", "white-oak", "rosewood", "herringbone-gold", "herringbone-dark", "tile-ivory", "tile-checker", "tile-rose", "stone-sand", "stone-slate", "basketweave-oak", "versailles-oak", "terrazzo-pearl", "hexagon-ivory", "marble-ivory"] as const;
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
  wallColors: z.object({
    base: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    detail: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }).strict().optional(),
  floorColors: z.object({
    base: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    detail: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }).strict().optional(),
  placements: z.array(furniturePlacementSchema).max(100),
  windows: z.array(windowPlacementSchema).max(6).optional(),
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
  ownedFinishes?: string[];
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
