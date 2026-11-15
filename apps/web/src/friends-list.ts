import type { Contact, ProfileRelation } from "../../../packages/contracts/src/index";

export type FriendsFilter = "all" | "online" | "requests";
export type FriendRequest = { contact: Contact; kind: ProfileRelation };

const byPresence = (onlineIds: readonly string[]) => (a: Contact, b: Contact) =>
  Number(onlineIds.includes(b.id)) - Number(onlineIds.includes(a.id)) || b.unread - a.unread
    || a.name.localeCompare(b.name, "fr");
const matches = (c: Contact, query: string) =>
  c.name.toLocaleLowerCase("fr").includes(query.trim().toLocaleLowerCase("fr"));

/** Friends shown in the vitrine: online first, then unread messages, then by name. */
export function friendsFor(
  contacts: readonly Contact[],
  onlineIds: readonly string[],
  filter: Exclude<FriendsFilter, "requests">,
  query = "",
): Contact[] {
  return contacts
    .filter((c) => !c.blocked && c.friend && (filter === "all" || onlineIds.includes(c.id)) && matches(c, query))
    .sort(byPresence(onlineIds));
}

const requestOrder: ProfileRelation[] = ["romance", "best-friend", "friend"];
/** Friend, best friend and couple requests waiting for an answer, one card each. */
export function requestsFor(contacts: readonly Contact[], onlineIds: readonly string[], query = ""): FriendRequest[] {
  return contacts
    .filter((c) => !c.blocked && matches(c, query))
    .sort(byPresence(onlineIds))
    .flatMap((contact) => (contact.relationRequests ?? (contact.friendRequest ? ["friend" as const] : []))
      .slice().sort((a, b) => requestOrder.indexOf(a) - requestOrder.indexOf(b))
      .map((kind) => ({ contact, kind })));
}

/**
 * How many dolls fit on a page of the given size: columns of at least
 * `minWidth`, and a second row only when each doll keeps a readable height.
 */
export function vitrineGrid(width: number, height: number, answering = false) {
  const gap = 8;
  const narrow = width < 520;
  // Requests keep « Accepter » and « Refuser » side by side; on a phone they stack.
  const minWidth = answering && !narrow ? 200 : narrow ? 130 : 150;
  const minRow = (narrow ? 230 : 290) + (answering ? (narrow ? 84 : 40) : 0);
  const columns = Math.max(2, Math.min(7, Math.floor((width + gap) / (minWidth + gap))));
  const rows = Math.max(1, Math.min(2, Math.floor((height + gap) / (minRow + gap))));
  return { columns, rows, pageSize: columns * rows };
}
