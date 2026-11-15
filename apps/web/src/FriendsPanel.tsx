import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BookOpen, ChevronLeft, ChevronRight, Heart, Map as MapIcon, MessageCircle, Search, Sparkles, UserCheck, UserRound, UserX, X,
} from "lucide-react";
import { levelProgress, type Contact } from "../../../packages/contracts/src/index";
import { Portrait } from "./Avatar";
import { friendsFor, vitrineGrid, type FriendsFilter } from "./friends-list";

/**
 * « Mes amis » : friends stand full length on the quartier's terrace, without
 * tiles, like garments in the Boutique. Requests wait in a pink banner.
 */
export function FriendsPanel({ contacts, onlineIds, onProfile, onRespond, onMessage, onGuestbook, onClose }: {
  contacts: readonly Contact[];
  onlineIds: readonly string[];
  onProfile: (id: string) => void;
  onRespond: (id: string, accept: boolean) => Promise<void>;
  onMessage: (id: string) => void;
  onGuestbook: (id: string) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<FriendsFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [responding, setResponding] = useState<string | null>(null);
  const [error, setError] = useState("");
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
    if (!error) return;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const online = (c: Contact) => onlineIds.includes(c.id);
  const friends = friendsFor(contacts, onlineIds, "all");
  const onlineCount = friends.filter(online).length;
  const requests = friendsFor(contacts, onlineIds, "requests");
  const shown = friendsFor(contacts, onlineIds, filter, query);
  const grid = vitrineGrid(size.width, size.height, filter === "requests");
  const lastPage = Math.max(0, Math.ceil(shown.length / grid.pageSize) - 1);
  const current = Math.min(page, lastPage);
  const visible = shown.slice(current * grid.pageSize, (current + 1) * grid.pageSize);
  // A short list stands centred, like a shop window, and only uses the rows it needs.
  const short = lastPage === 0 && visible.length < grid.pageSize;
  const columns = short ? Math.min(grid.columns, visible.length) : grid.columns;
  const rows = short ? Math.max(1, Math.ceil(visible.length / grid.columns)) : grid.rows;
  const choose = (next: FriendsFilter) => { setFilter(next); setPage(0); };

  async function respond(c: Contact, accept: boolean) {
    setResponding(c.id);
    setError("");
    try {
      await onRespond(c.id, accept);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Réessaie dans un instant.");
    } finally {
      setResponding(null);
    }
  }

  const empty = query.trim() ? "Aucun pseudo trouvé."
    : filter === "requests" ? "Aucune demande d’amitié pour l’instant."
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
        <label className="friends-search">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Rechercher un pseudo" aria-label="Rechercher un pseudo"
            value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} />
        </label>
        <button type="button" className="friends-close" aria-label="Fermer Mes amis" onClick={onClose}>
          <X size={18} />
        </button>
      </header>

      {error && <p className="friends-error" role="alert">{error}</p>}

      <div className="friends-floor" ref={floor}>
        {visible.length === 0 ? (
          <div className="friends-empty">
            <p>{empty}</p>
            {filter === "all" && !query.trim() && friends.length === 0 && (
              <button type="button" onClick={onClose}><MapIcon size={17} aria-hidden="true" /> Aller au quartier</button>
            )}
          </div>
        ) : (
          <ul className="friends-dolls" style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, ${Math.floor(size.width / grid.columns)}px))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 520px))`,
          }}>
            {visible.map((c) => {
              const isOnline = online(c);
              const level = levelProgress(c.xp ?? 0).level;
              return (
                <li key={c.id} className={isOnline ? "friends-doll is-online" : "friends-doll"}>
                  <button type="button" className="friends-figure" onClick={() => onProfile(c.id)}
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
                  {filter === "requests" ? (
                    <div className="friends-answer">
                      <button type="button" className="is-accept" disabled={responding !== null}
                        aria-label={`Accepter la demande de ${c.name}`} onClick={() => void respond(c, true)}>
                        <UserCheck size={16} aria-hidden="true" /> Accepter
                      </button>
                      <button type="button" disabled={responding !== null}
                        aria-label={`Refuser la demande de ${c.name}`} onClick={() => void respond(c, false)}>
                        <UserX size={16} aria-hidden="true" /> Refuser
                      </button>
                    </div>
                  ) : (
                    <div className="friends-actions">
                      <button type="button" className="is-accept" aria-label={`Écrire à ${c.name}`}
                        onClick={() => onMessage(c.id)}>
                        <MessageCircle size={17} aria-hidden="true" />
                        {c.unread > 0 && <b aria-label={`${c.unread} non lu${c.unread > 1 ? "s" : ""}`}>{c.unread}</b>}
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
        {requests.length > 0 && filter !== "requests" ? (
          <button type="button" className="friends-banner" onClick={() => choose("requests")}>
            <span className="friends-banner-icon" aria-hidden="true"><Sparkles size={18} /></span>
            <span className="friends-banner-text">
              <strong>{requests.length} demande{requests.length > 1 ? "s" : ""} d’amitié</strong>
              <small>{requests.slice(0, 3).map((c) => c.name).join(", ")}{requests.length > 3 ? "…" : ""}
                {requests.length > 1 ? " attendent" : " attend"} ta réponse</small>
            </span>
            <span className="friends-banner-faces" aria-hidden="true">
              {requests.slice(0, 3).map((c) => <span key={c.id}><Portrait {...c} /></span>)}
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <p className="friends-hint">{filter === "requests"
            ? "Accepte une demande pour ajouter ce joueur à tes amis."
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
