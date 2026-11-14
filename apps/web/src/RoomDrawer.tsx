import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight, MessageCircle, UserPlus } from "lucide-react";
import type { Contact } from "../../../packages/contracts/src/index";

type Tab = "room" | "messages" | "friends";

/**
 * Social drawer on the right of a room: the room's public chat, private
 * conversations and friends, without leaving the room.
 */
export function RoomDrawer({
  chat,
  chatLatest,
  contacts,
  presentIds,
  onlineIds,
  portrait,
  onOpenChat,
  onOpenProfile,
  onAllMessages,
  onAllFriends,
}: {
  chat: ReactNode;
  /** Id of the room's latest public message, to flag news while another tab is open. */
  chatLatest?: string;
  contacts: readonly Contact[];
  presentIds: readonly string[];
  onlineIds: readonly string[];
  portrait: (person: Contact) => ReactNode;
  onOpenChat: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onAllMessages: () => void;
  onAllFriends: () => void;
}) {
  const [tab, setTab] = useState<Tab>("room");
  const [seenChat, setSeenChat] = useState(chatLatest);
  useEffect(() => {
    if (tab === "room") setSeenChat(chatLatest);
  }, [tab, chatLatest]);
  const chatNews = tab !== "room" && chatLatest !== seenChat;
  const unread = contacts.reduce((n, c) => n + c.unread, 0);
  const requests = contacts.filter((c) => (c.profileRequests ?? 0) > 0);
  const friends = contacts.filter((c) => c.friend);
  const where = (id: string) =>
    presentIds.includes(id) ? "Dans la salle" : onlineIds.includes(id) ? "En ligne" : "Hors ligne";
  const rank = (c: Contact) => (presentIds.includes(c.id) ? 0 : onlineIds.includes(c.id) ? 1 : 2);
  const conversations = contacts
    .filter((c) => !c.blocked)
    .slice()
    .sort((a, b) => b.unread - a.unread || rank(a) - rank(b) || a.name.localeCompare(b.name));
  const sortedFriends = friends.slice().sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  const tabs: [Tab, string, number][] = [
    ["room", "Salle", 0],
    ["messages", "Messages", unread],
    ["friends", "Amis", requests.length],
  ];
  const person = (c: Contact, detail: ReactNode, action: ReactNode) => (
    <li key={c.id} className="drawer-person">
      <button type="button" className="drawer-person-main" onClick={() => onOpenProfile(c.id)}
        aria-label={`Voir le profil de ${c.name}`}>
        <span className="drawer-avatar">
          {portrait(c)}
          {onlineIds.includes(c.id) && <i aria-hidden="true" />}
        </span>
        <span className="drawer-person-text">
          <strong>{c.name}</strong>
          <small>{detail}</small>
        </span>
      </button>
      {action}
    </li>
  );
  return (
    <aside className="room-drawer" aria-label="Social">
      <div className="drawer-tabs" role="tablist" aria-label="Social">
        {tabs.map(([id, label, count]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id}
            id={`drawer-tab-${id}`} aria-controls={`drawer-panel-${id}`} onClick={() => setTab(id)}>
            {label}
            {count > 0 && <b aria-label={`${count} en attente`}>{count}</b>}
            {id === "room" && chatNews && <i className="drawer-news" aria-label="nouveaux messages" />}
          </button>
        ))}
      </div>
      <div className="drawer-panel" role="tabpanel" id={`drawer-panel-${tab}`} aria-labelledby={`drawer-tab-${tab}`}>
        {tab === "room" && chat}
        {tab === "messages" && (
          <>
            {conversations.length ? (
              <ul className="drawer-list">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="drawer-conversation" onClick={() => onOpenChat(c.id)}>
                      <span className="drawer-avatar">
                        {portrait(c)}
                        {onlineIds.includes(c.id) && <i aria-hidden="true" />}
                      </span>
                      <span className="drawer-person-text">
                        <strong>{c.name}</strong>
                        <small>{c.unread ? `${c.unread} nouveau${c.unread > 1 ? "x" : ""} message${c.unread > 1 ? "s" : ""}` : where(c.id)}</small>
                      </span>
                      {c.unread > 0 ? <span className="drawer-unread" aria-label="non lu" /> : <ChevronRight size={18} aria-hidden="true" />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="drawer-empty">Aucune conversation pour l’instant. Clique sur un joueur de la salle pour lui écrire.</p>
            )}
            <button type="button" className="drawer-link" onClick={onAllMessages}>Ouvrir tous les messages</button>
          </>
        )}
        {tab === "friends" && (
          <>
            {requests.length > 0 && (
              <ul className="drawer-list drawer-requests" aria-label="Demandes reçues">
                {requests.map((c) =>
                  person(c, c.friendRequest ? "veut être ton ami·e" : "a demandé à voir ton profil",
                    <button type="button" className="drawer-accept" onClick={() => onOpenProfile(c.id)}>
                      <UserPlus size={16} aria-hidden="true" /> Voir
                    </button>),
                )}
              </ul>
            )}
            <h3 className="drawer-heading">Mes amis <span>{friends.length}</span></h3>
            {sortedFriends.length ? (
              <ul className="drawer-list">
                {sortedFriends.map((c) =>
                  person(c, where(c.id),
                    <button type="button" className="drawer-write" onClick={() => onOpenChat(c.id)}
                      aria-label={`Écrire à ${c.name}`}>
                      <MessageCircle size={17} aria-hidden="true" />
                    </button>),
                )}
              </ul>
            ) : (
              <p className="drawer-empty">Ta liste d’amis est vide. Clique sur un joueur de la salle pour l’ajouter.</p>
            )}
            <button type="button" className="drawer-link" onClick={onAllFriends}>Tous mes amis</button>
          </>
        )}
      </div>
    </aside>
  );
}
