import type { Contact } from "../../packages/contracts/src/index";
import { starterPieces } from "../../packages/contracts/src/player-account";

/** Fictional friends for the « Mes amis » control page and tests. */
const outfit = (hair: number, top: number, bottom: number, shoes: number) => ({
  hair: starterPieces.hair[hair],
  top: starterPieces.top[top],
  bottom: starterPieces.bottom[bottom],
  shoes: starterPieces.shoes[shoes],
});

const people: [string, string, number, ReturnType<typeof outfit>, Partial<Contact>][] = [
  ["Lila", "Toujours partante pour la terrasse", 24000, outfit(0, 1, 1, 2), { unread: 2 }],
  ["Maëlys", "Le rose, c’est une attitude.", 52000, outfit(2, 0, 0, 0), {}],
  ["Sasha", "En mode dressing jusqu’à minuit", 9000, outfit(1, 2, 2, 1), { unread: 1 }],
  ["Inès", "On se retrouve à la serre ?", 36000, outfit(0, 2, 0, 2), {}],
  ["Zoé", "", 3000, outfit(2, 1, 2, 0), {}],
  ["Camille-Alexandrine", "Collectionneuse de chignons", 74000, outfit(1, 0, 1, 2), {}],
  ["Jade", "Pas de mode sans confort", 15000, outfit(0, 0, 2, 1), {}],
  ["Nora", "Ticket du jour gratté", 41000, outfit(2, 2, 1, 0), { relationRequests: ["best-friend"] }],
  ["Bloquée", "", 0, outfit(0, 0, 0, 0), { blocked: true }],
  ["Emma", "Nouvelle dans le quartier !", 1200, outfit(1, 1, 0, 2), { friend: false, friendRequest: true, relationRequests: ["friend"] }],
  ["Rose", "", 6500, outfit(0, 1, 2, 0), { friend: false, friendRequest: true, relationRequests: ["friend", "romance"] }],
];

export const demoFriends: Contact[] = people.map(([name, motto, xp, worn, extra], index) => ({
  id: `demo-friend-${index}`,
  account_id: `demo-${index}`,
  name,
  color: "#c48a6a",
  hair: "",
  slot: 0,
  motto,
  xp,
  outfit: worn,
  unread: 0,
  blocked: false,
  friend: true,
  ...extra,
}));

export const demoOnlineIds = ["demo-friend-0", "demo-friend-1", "demo-friend-3", "demo-friend-9"];
