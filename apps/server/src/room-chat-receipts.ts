/** Retry protection for the existing ephemeral room chat, shared by salons and homes. */
export function createRoomChatReceipts(now = Date.now) {
  const receipts = new Map<string, { room: string; body: string; expires: number; delivered: boolean }>();
  const key = (actor: string, command: string) => JSON.stringify([actor, command]);
  return {
    has(actor: string, command: string, room: string, body: string) {
      const id = key(actor, command), previous = receipts.get(id);
      if (!previous) return false;
      if (previous.expires <= now()) { receipts.delete(id); return false; }
      if (previous.room !== room || previous.body !== body) throw new Error("Cette commande correspond déjà à un autre message.");
      return true;
    },
    remember(actor: string, command: string, room: string, body: string) {
      const time = now();
      for (const [id, receipt] of receipts) {
        if (receipt.expires > time) break;
        receipts.delete(id);
      }
      receipts.set(key(actor, command), { room, body, expires: time + 300_000, delivered: false });
      while (receipts.size > 2000) receipts.delete(receipts.keys().next().value!);
    },
    delivered(actor: string, command: string) { return receipts.get(key(actor, command))?.delivered === true; },
    confirm(actor: string, command: string) {
      const receipt = receipts.get(key(actor, command));
      if (receipt) receipt.delivered = true;
    },
  };
}
