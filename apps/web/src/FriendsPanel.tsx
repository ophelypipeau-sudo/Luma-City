import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BookOpen, Check, ChevronLeft, ChevronRight, Globe, Heart, House, Map as MapIcon, MessageCircle, Search, Sparkles, Star,
  UserCheck, UserPlus, UserRound, Users, UserX, X,
} from "lucide-react";
import {
  levelProgress, PLAYER_SEARCH_LIMIT, type Character, type Contact, type PlayerSearchResult, type ProfileRelation,
} from "../../../packages/contracts/src/index";
import { Portrait } from "./Avatar";
import { friendsFor, requestsFor, vitrineGrid, type FriendsFilter } from "./friends-list";

const requestKinds: Record<ProfileRelation, { label: string; Icon: typeof Heart }> = {
  friend: { label: "Ami·e", Icon: UserPlus },
  "best-friend": { label: "Meilleurs amis", Icon: Star },
  romance: { label: "En couple", Icon: Heart },
};

/**
 * « Mes amis » : friends stand full length on the quartier's terrace, without
 * tiles, like garments in the Boutique. Requests wait in a pink banner.
 */
type Scope = "friends" | "server";
type Entry = { contact: Character & { unread?: number }; kind?: ProfileRelation; found?: PlayerSearchResult };

export function FriendsPanel({
  contacts, onlineIds, onProfile, onOpenPlayer, onRespond, onSearch, onAddFriend, onMessage, onGuestbook, onClose, onVisit,
}: {
  contacts: readonly Contact[];
  onlineIds: readonly string[];
  onProfile: (id: string) => void;
  /** Opens the profile of a player found on the server, who may not be a contact. */
  onOpenPlayer?: (person: Character) => void;
  /** Searches players by name on the whole server. */
  onSearch?: (query: string) => Promise<PlayerSearchResult[]>;
  /** Sends a friend request. */
  onAddFriend?: (id: string) => Promise<void>;
  onRespond: (id: string, kind: ProfileRelation, accept: boolean) => Promise<void>;
  onMessage: (id: string) => void;
  onGuestbook: (id: string) => void;
  onClose: () => void;
  onVisit?: (id: string) => void;
}) {
  const [filter, setFilter] = useState<FriendsFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [responding, setResponding] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [scope, setScope] = useState<Scope>("friends");
  const [found, setFound] = useState<PlayerSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [size, setSize] = useState({ width: 900, height: 520 });
  const floor = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = floor.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const next = { width: element.clientWidth, height: element.clientHeight };
      setSize((current) => current.width === next.width && current.height === next.height ? current : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!error && !notice) return;
    const timer = setTimeout(() => { setError(""); setNotice(""); }, 5000);
    return () => clearTimeout(timer);
  }, [error, notice]);

  // Server search waits for a short pause in typing, and ignores answers to older queries.
  const needle = query.trim();
  const serverMode = scope === "server" && Boolean(onSearch);
  useEffect(() => {
    if (!serverMode || needle.length < 2) { setFound(null); setSearching(false); return; }
    let current = true;
    setSearching(true);
    const timer = setTimeout(() => {
      onSearch!(needle)
        .then((players) => { if (current) setFound(players); })
        .catch((reason: Error) => { if (current) { setFound([]); setError(reason.message); } })
        .finally(() => { if (current) setSearching(false); });
    }, 300);
    return () => { current = false; clearTimeout(timer); };
  }, [serverMode, needle, onSearch]);

  const online = (c: Character) => onlineIds.includes(c.id);
  const friends = friendsFor(contacts, onlineIds, "all");
  const onlineCount = friends.filter(online).length;
  const requests = requestsFor(contacts, onlineIds);
  const shown: Entry[] = serverMode ? (found ?? []).map((player) => ({ contact: player, found: player }))
    : filter === "requests" ? requestsFor(contacts, onlineIds, query)
      : friendsFor(contacts, onlineIds, filter, query).map((contact) => ({ contact }));
  const grid = vitrineGrid(size.width, size.height, filter === "requests" || serverMode);
  const lastPage = Math.max(0, Math.ceil(shown.length / grid.pageSize) - 1);
  const current = Math.min(page, lastPage);
  const visible = shown.slice(current * grid.pageSize, (current + 1) * grid.pageSize);
  // A short list stands centred, like a shop window, and only uses the rows it needs.
  const short = lastPage === 0 && visible.length < grid.pageSize;
  const columns = short ? Math.min(grid.columns, visible.length) : grid.columns;
  const rows = short ? Math.max(1, Math.ceil(visible.length / grid.columns)) : grid.rows;
  const choose = (next: FriendsFilter) => { setFilter(next); setScope("friends"); setPage(0); };
  const searchIn = (next: Scope) => { setScope(next); setPage(0); input.current?.focus(); };
  const update = (id: string, friendship: PlayerSearchResult["friendship"]) =>
    setFound((list) => list?.map((player) => player.id === id ? { ...player, friendship } : player) ?? list);
  const senders = [...new Map(requests.map(({ contact }) => [contact.id, contact])).values()];

  async function add(player: PlayerSearchResult) {
    if (!onAddFriend) return;
    setResponding(player.id);
    setError("");
    try {
      await onAddFriend(player.id);
      update(player.id, "outgoing");
      setNotice(`Demande d’ami envoyée à ${player.name}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Réessaie dans un instant.");
    } finally {
      setResponding(null);
    }
  }

  async function respond(c: Character, kind: ProfileRelation, accept: boolean) {
    setResponding(c.id);
    setError("");
    try {
      await onRespond(c.id, kind, accept);
      if (kind === "friend") update(c.id, accept ? "accepted" : null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Réessaie dans un instant.");
    } finally {
      setResponding(null);
    }
  }

  const empty = serverMode
    ? needle.length < 2 ? "Tape au moins 2 lettres du pseudo pour chercher sur tout le serveur."
      : searching ? "Recherche en cours…" : `Aucun joueur nommé « ${needle} » sur le serveur.`
    : query.trim() ? "Aucun ami ne porte ce pseudo."
    : filter === "requests" ? "Aucune demande en attente pour l’instant."
      : filter === "online" ? "Aucun ami connecté pour le moment."
        : "Ta liste d’amis est vide. Va saluer les joueurs du quartier et ajoute-les depuis leur profil.";

  return (
    <section className="friends-vitrine" aria-label="Mes amis" onKeyDown={(event) => {
      if (event.key === "Escape") onClose();
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowRight" && current < lastPage) setPage(current + 1);
      if (event.key === "ArrowLeft" && current > 0) setPage(current - 1);
    }}>
      <header className="friends-head">
        <h2>Mes amis</h2>
        <div className="friends-tabs" role="group" aria-label="Afficher">
          <button type="button" aria-pressed={filter === "all"} onClick={() => choose("all")}>
            <Heart size={15} aria-hidden="true" /> Tous <em>{friends.length}</em>
          </button>
          <button type="button" aria-pressed={filter === "online"} onClick={() => choose("online")}>
            <i className="friends-dot" aria-hidden="true" /> En ligne <em>{onlineCount}</em>
          </button>
          <button type="button" aria-pressed={filter === "requests"} onClick={() => choose("requests")}>
            <UserRound size={15} aria-hidden="true" /> Demandes
            {requests.length > 0 && <b aria-label={`${requests.length} en attente`}>{requests.length}</b>}
          </button>
        </div>
        <div className="friends-search">
          <Search size={16} aria-hidden="true" />
          <input type="search" ref={input}
            placeholder={serverMode ? "Pseudo sur tout le serveur" : "Rechercher dans mes amis"}
            aria-label={serverMode ? "Rechercher un joueur sur tout le serveur" : "Rechercher dans mes amis"}
            value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} />
          {onSearch && (
            <div className="friends-scope" role="group" aria-label="Où chercher">
              <button type="button" aria-pressed={!serverMode} onClick={() => searchIn("friends")} title="Chercher dans mes amis">
                <Users size={14} aria-hidden="true" /><span>Mes amis</span>
              </button>
              <button type="button" aria-pressed={serverMode} onClick={() => searchIn("server")} title="Chercher sur tout le serveur">
                <Globe size={14} aria-hidden="true" /><span>Serveur</span>
              </button>
            </div>
          )}
        </div>
        <button type="button" className="friends-close" aria-label="Fermer Mes amis" onClick={onClose}>
          <X size={18} />
        </button>
      </header>

      {error && <p className="friends-error" role="alert">{error}</p>}
      {notice && !error && <p className="friends-error friends-notice" role="status"><Check size={16} aria-hidden="true" /> {notice}</p>}

      <div className="friends-floor" ref={floor}>
        {visible.length === 0 ? (
          <div className="friends-empty">
            <p>{empty}</p>
            {!serverMode && needle.length >= 2 && onSearch && (
              <button type="button" onClick={() => searchIn("server")}>
                <Globe size={17} aria-hidden="true" /> Chercher « {needle} » sur tout le serveur
              </button>
            )}
            {!serverMode && filter === "all" && !needle && friends.length === 0 && (
              <button type="button" onClick={onClose}><MapIcon size={17} aria-hidden="true" /> Aller au quartier</button>
            )}
          </div>
        ) : (
          <ul className="friends-dolls" style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, ${Math.floor(size.width / grid.columns)}px))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 520px))`,
          }}>
            {visible.map(({ contact: c, kind, found: player }) => {
              const isOnline = online(c);
              const level = levelProgress(c.xp ?? 0).level;
              const request = kind && requestKinds[kind];
              return (
                <li key={`${c.id}:${kind ?? (player ? "found" : "friend")}`}
                  className={isOnline ? "friends-doll is-online" : "friends-doll"}>
                  {request && (
                    <span className="friends-kind" data-kind={kind}>
                      <request.Icon size={13} aria-hidden="true" /> {request.label}
                    </span>
                  )}
                  <button type="button" className="friends-figure"
                    onClick={() => player && onOpenPlayer ? onOpenPlayer(player) : onProfile(c.id)}
                    aria-label={`Voir le profil de ${c.name}`}>
                    <Portrait {...c} fullBody />
                  </button>
                  <div className="friends-name">
                    <strong title={c.name}>
                      <i className="friends-dot" aria-hidden="true" />
                      <span>{c.name}</span>
                    </strong>
                    <span className="friends-chip">
                      Niv. {level}<span className="friends-sr"> · {isOnline ? "en ligne" : "hors ligne"}</span>
                    </span>
                  </div>
                  {player?.friendship === "accepted" && (
                    <div className="friends-answer">
                      <span className="friends-status is-friend"><UserCheck size={15} aria-hidden="true" /> Ami·e</span>
                    </div>
                  )}
                  {player && player.friendship !== "accepted" ? (
                    <div className="friends-answer">
                      {player.friendship === null ? (
                        <button type="button" className="is-accept" disabled={responding !== null || !onAddFriend}
                          aria-label={`Envoyer une demande d’ami à ${c.name}`} onClick={() => void add(player)}>
                          <UserPlus size={16} aria-hidden="true" /> Ajouter
                        </button>
                      ) : player.friendship === "incoming" ? (
                        <button type="button" className="is-accept" disabled={responding !== null}
                          aria-label={`Accepter la demande d’ami de ${c.name}`} onClick={() => void respond(c, "friend", true)}>
                          <UserCheck size={16} aria-hidden="true" /> Accepter
                        </button>
                      ) : (
                        <span className="friends-status"><Check size={15} aria-hidden="true" /> Demande envoyée</span>
                      )}
                    </div>
                  ) : kind && request ? (
                    <div className="friends-answer">
                      <button type="button" className="is-accept" disabled={responding !== null}
                        aria-label={`Accepter la demande de ${c.name} · ${request.label}`}
                        onClick={() => void respond(c, kind, true)}>
                        <UserCheck size={16} aria-hidden="true" /> Accepter
                      </button>
                      <button type="button" disabled={responding !== null}
                        aria-label={`Refuser la demande de ${c.name} · ${request.label}`}
                        onClick={() => void respond(c, kind, false)}>
                        <UserX size={16} aria-hidden="true" /> Refuser
                      </button>
                    </div>
                  ) : (
                    <div className="friends-actions">
                        {onVisit && <button type="button" disabled={contacts.find((person) => person.id === c.id)?.blocked}
                          aria-label={`Visiter la maison de ${c.name}`} title="Visiter sa maison" onClick={() => onVisit(c.id)}><House size={17} aria-hidden="true" /></button>}
                      <button type="button" className="is-accept" aria-label={`Écrire à ${c.name}`}
                        onClick={() => onMessage(c.id)}>
                        <MessageCircle size={17} aria-hidden="true" />
                        {(c.unread ?? 0) > 0 && <b aria-label={`${c.unread} non lu${c.unread! > 1 ? "s" : ""}`}>{c.unread}</b>}
                      </button>
                      <button type="button" aria-label={`Livre d’or de ${c.name}`} onClick={() => onGuestbook(c.id)}>
                        <BookOpen size={17} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className="friends-foot">
        {serverMode ? (
          <p className="friends-hint">{found && found.length >= PLAYER_SEARCH_LIMIT
            ? `Seuls les ${PLAYER_SEARCH_LIMIT} premiers joueurs sont affichés : précise le pseudo.`
            : "Ajoute un joueur pour lui envoyer une demande d’ami."}</p>
        ) : requests.length > 0 && filter !== "requests" ? (
          <button type="button" className="friends-banner" onClick={() => choose("requests")}>
            <span className="friends-banner-icon" aria-hidden="true"><Sparkles size={18} /></span>
            <span className="friends-banner-text">
              <strong>{requests.length} demande{requests.length > 1 ? "s" : ""} en attente</strong>
              <small>{senders.slice(0, 3).map((c) => c.name).join(", ")}{senders.length > 3 ? "…" : ""}
                {senders.length > 1 ? " attendent" : " attend"} ta réponse</small>
            </span>
            <span className="friends-banner-faces" aria-hidden="true">
              {senders.slice(0, 3).map((c) => <span key={c.id}><Portrait {...c} /></span>)}
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <p className="friends-hint">{filter === "requests"
            ? "Ami·e, meilleurs amis ou couple : réponds à chaque demande."
            : "Clique sur un ami pour voir son profil."}</p>
        )}
        {lastPage > 0 && (
          <nav className="friends-pager" aria-label="Pages des amis">
            <button type="button" aria-label="Page précédente" disabled={current === 0}
              onClick={() => setPage(current - 1)}><ChevronLeft size={17} /></button>
            <span aria-live="polite"><span className="friends-pager-word">Page </span>{current + 1} / {lastPage + 1}</span>
            <button type="button" aria-label="Page suivante" disabled={current === lastPage}
              onClick={() => setPage(current + 1)}><ChevronRight size={17} /></button>
          </nav>
        )}
      </footer>
    </section>
  );
}
