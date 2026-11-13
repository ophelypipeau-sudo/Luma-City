import { z } from "zod";
export const ROOM_IDS = ["greenhouse", "fountain", "terrace"] as const;
type PublicRoomId = (typeof ROOM_IDS)[number];
export type RoomId = PublicRoomId | `home:${string}`;
export const DEFAULT_ROOM: PublicRoomId = "greenhouse";
export const homeRoom = (characterId: string): RoomId => `home:${characterId}`;
export const homeOwner = (room: RoomId) =>
  room.startsWith("home:") ? room.slice(5) : null;
const roomIdSchema = z.union([
  z.enum(ROOM_IDS),
  z.custom<`home:${string}`>(
    (value) =>
      typeof value === "string" && /^home:[a-z0-9_-]{1,64}$/i.test(value),
  ),
]);
export const ROOM_MESSAGE_MAX = 280;
export const PROFILE_MOTTO_MAX = 120;
export const PROFILE_TEMPLATES = ["image", "solid", "stardust", "constellation"] as const;
export const PROFILE_IMAGE_MAX_CHARS = 350_000;
export type ProfileTemplate = (typeof PROFILE_TEMPLATES)[number];
export const PROFILE_RELATIONS = ["friend", "best-friend", "romance"] as const;
export type ProfileRelation = (typeof PROFILE_RELATIONS)[number];
export const PROFILE_RELATION_SLOTS = { "best-friend": 3, romance: 1 } as const;
export const PROFILE_XP = { photo: 10, like: 5, "look-like": 5, firstLevel: 5000 } as const;

export function levelProgress(totalXp: number) {
  let level = 1;
  let earned = Math.max(0, totalXp);
  let required: number = PROFILE_XP.firstLevel;
  while (earned >= required) {
    earned -= required;
    level++;
    required = Math.round(required * 1.2);
  }
  return { level, earned, required };
}
export type XpRewardSource = "photo" | "like" | "look-like";
export type XpMagazine = {
  rewards: { source: XpRewardSource; count: number; points: number }[];
  activity: { source: XpRewardSource; actor: string; name: string; count: number }[];
  multiplier: number;
};
export type RankingEntry = Pick<Character, "id" | "name" | "outfit"> & {
  xp: number;
  profileLikes: number;
  bestScore: number;
  friend: boolean;
};
export type WheelPayout = {
  id: string; currency: "coins" | "diamonds" | "xp"; amount: number;
  burst?: string; slot?: number;
};
export type ScratchTicket = {
  id: string;
  currency: "coins" | "diamonds" | "xp";
  amount: number;
  claimed: boolean;
};
export type RewardWheel = {
  tickets: number;
  accountCoins: number;
  accountDiamonds: number;
  pending: WheelPayout[];
};
export const XP_TEST_ACCOUNT = "test-xp";
export const XP_TEST_PROFILES = ["nova-xp", "lune-xp"] as const;
const garmentColor = z.string().regex(/^#[0-9a-f]{6}$/i);
const garmentId = z.string().regex(/^[\w.-]{1,120}$/);
const outfitColors = z.record(garmentId, garmentColor);
export const outfitPieceIdsSchema = z.array(garmentId)
  .transform((ids) => [...new Set(ids)]).readonly();
export const CLOTHING_LAYER_SLOTS = ["outerwear", "top2", "top", "bottom"] as const;
export type ClothingLayerSlot = (typeof CLOTHING_LAYER_SLOTS)[number];
export const clothingLayerOrderSchema = z.array(z.enum(CLOTHING_LAYER_SLOTS))
  .min(3)
  .max(CLOTHING_LAYER_SLOTS.length)
  .refine((slots) => new Set(slots).size === slots.length &&
    slots.includes("outerwear") && slots.includes("top") && slots.includes("bottom"))
  .transform((slots) => {
    if (!slots.includes("top2"))
      slots.splice(Math.min(slots.indexOf("top"), slots.indexOf("bottom")), 0, "top2");
    return slots;
  })
  .readonly();
export const avatarFaceSchema = z.object({
  eyes: z.enum(["original", "green", "blue", "brown"]),
  lips: z.enum(["original", "rose", "berry", "nude"]),
  skin: z.enum(["original", "light", "tan", "deep"]),
  nose: z.enum(["original", "fine", "soft"]),
});
export type AvatarFace = z.infer<typeof avatarFaceSchema>;
export const wornOutfitSchema = z.object({
  top: garmentId.nullable(),
  top2: garmentId.nullable().optional(),
  bottom: garmentId.nullable(),
  shoes: garmentId.nullable(),
  belt: garmentId.nullable().optional(),
  outerwear: garmentId.nullable().optional(),
  legwear: garmentId.nullable().optional(),
  hair: garmentId.nullable().optional(),
  headwear: garmentId.nullable().optional(),
  tie: garmentId.nullable().optional(),
  necklace: garmentId.nullable().optional(),
  earrings: garmentId.nullable().optional(),
  bag: garmentId.nullable().optional(),
  colors: outfitColors.optional(),
  detailColors: outfitColors.optional(),
  topTucked: z.boolean().optional(),
  layerOrder: clothingLayerOrderSchema.optional(),
  extraPieces: outfitPieceIdsSchema.optional(),
  pieceOrder: outfitPieceIdsSchema.optional(),
  face: avatarFaceSchema.optional(),
});
export type WornOutfit = z.infer<typeof wornOutfitSchema>;
export const giftItemSchema = z.object({
  pieceId: z.string().min(1).max(120),
  key: z.string().min(1).max(240),
  color: garmentColor.optional(),
  detailColor: garmentColor.optional(),
  purchasedAt: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
export type GiftItem = z.infer<typeof giftItemSchema>;
export type GarmentTransfer = {
  id: string;
  sender: string;
  recipient: string;
  item: GiftItem;
};
export type ProfileSocial = {
  liked: boolean;
  likes: number;
  photographed: boolean;
  xpSent?: number;
  lookLiked: boolean;
  lookLikes: number;
  lookKey: string | null;
  relations: Partial<
    Record<ProfileRelation, "incoming" | "outgoing" | "accepted">
  >;
  guestbook: { id: number; author: string; body: string }[];
  featuredRelations: {
    bestFriends: { id: string; name: string }[];
    partner: { id: string; name: string } | null;
  };
};
export const ROOM_FLOOR: Record<PublicRoomId, number> = {
  greenhouse: 66,
  fountain: 66,
  terrace: 67,
};
export function roomFloor(room: RoomId) {
  return room.startsWith("home:") ? 66 : ROOM_FLOOR[room as PublicRoomId];
}
export const commandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("room-chat"),
    generation: z.number().int(),
    roomId: roomIdSchema,
    commandId: z.uuid(),
    body: z.string().trim().min(1).max(ROOM_MESSAGE_MAX),
  }),
  z.object({
    type: z.literal("join-room"),
    generation: z.number().int(),
    roomId: roomIdSchema,
  }),
  z.object({
    type: z.literal("move"),
    generation: z.number().int(),
    x: z.number().finite().min(8).max(92),
    y: z.number().finite().min(48).max(86),
  }),
  z.object({ type: z.literal("ping") }),
]);
export type Character = {
  id: string;
  account_id: string;
  name: string;
  color: string;
  hair: string;
  slot: number;
  motto?: string;
  profile_template?: ProfileTemplate | "garden";
  profile_image_version?: string | null;
  xp?: number;
  outfit?: WornOutfit | null;
  starter_outfit?: WornOutfit | null;
};
export type Presence = Character & { x: number; y: number };
export type RoomMessage = {
  id: string;
  sender: string;
  name: string;
  body: string;
};
export type Message = {
  id: number;
  sender: string;
  recipient: string;
  body: string;
  created_at: string;
};
export type Contact = Character & {
  unread: number;
  blocked: boolean;
  profileRequests?: number;
  friendRequest?: boolean;
  friend?: boolean;
};
