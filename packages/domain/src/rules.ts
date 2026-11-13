export const ROOM_CAPACITY = 15;
export const MESSAGE_MAX = 800;
export function requireActive(
  session: { generation: number; character_id: string | null },
  generation: number,
) {
  if (!session.character_id || session.generation !== generation)
    throw new Error("Session inactive. Choisis à nouveau ton personnage.");
  return session.character_id;
}
