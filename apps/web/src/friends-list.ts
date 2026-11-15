import type { Contact } from "../../../packages/contracts/src/index";

export type FriendsFilter = "all" | "online" | "requests";

/** Friends shown in the vitrine: online first, then unread messages, then by name. */
export function friendsFor(
  contacts: readonly Contact[],
  onlineIds: readonly string[],
  filter: FriendsFilter,
  query = "",
): Contact[] {
  const online = (c: Contact) => onlineIds.includes(c.id);
  const needle = query.trim().toLocaleLowerCase("fr");
  return contacts
    .filter((c) => !c.blocked)
    .filter((c) => filter === "requests" ? c.friendRequest : c.friend && (filter === "all" || online(c)))
    .filter((c) => c.name.toLocaleLowerCase("fr").includes(needle))
    .sort((a, b) => Number(online(b)) - Number(online(a)) || b.unread - a.unread
      || a.name.localeCompare(b.name, "fr"));
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
