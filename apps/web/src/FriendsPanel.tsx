import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Search, UserCheck, UserX, X } from "lucide-react";
import { levelProgress, type Contact } from "../../../packages/contracts/src/index";
import { Portrait } from "./Avatar";
import "./friends-panel.css";

const pageSize = 6;

export function FriendsPanel({ contacts, onlineIds, onProfile, onRespond, onClose }: {
  contacts: Contact[];
  onlineIds: readonly string[];
  onProfile: (id: string) => void;
  onRespond: (id: string, accept: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState("");
  const requests = contacts.filter(contact => contact.friendRequest);
  const matches = (pending ? requests : contacts.filter(contact => contact.friend))
    .filter(contact => contact.name.toLocaleLowerCase("fr").includes(search));
  const lastPage = Math.max(0, Math.ceil(matches.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);

  async function respond(id: string, accept: boolean) {
    setResponding(true);
    setError("");
    try {
      await onRespond(id, accept);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Réessaie dans un instant.");
    } finally {
      setResponding(false);
    }
  }

  return (
    <section className="friends-panel" aria-label="Mes amis" onKeyDown={event => {
      if (event.key === "Escape") onClose();
    }}>
      <header className="friends-toolbar">
        <button type="button" aria-pressed={!pending} onClick={() => { setPending(false); setPage(0); }}>Mes amis</button>
        <button type="button" aria-pressed={pending} onClick={() => { setPending(true); setPage(0); }}>
          En attente {requests.length > 0 && <span>({requests.length})</span>}
        </button>
        <form className="friends-search" onSubmit={event => {
          event.preventDefault();
          setSearch(input.trim().toLocaleLowerCase("fr"));
          setPage(0);
        }}>
          <Search size={19} aria-hidden="true" />
          <input type="search" aria-label="Rechercher par pseudo" placeholder="Pseudo…" value={input}
            onChange={event => { setInput(event.target.value); if (!event.target.value) { setSearch(""); setPage(0); } }} />
          <button type="submit" aria-label="Rechercher"><Check size={19} /></button>
        </form>
        <button type="button" className="friends-close" aria-label="Fermer Mes amis" onClick={onClose}><X size={19} /></button>
      </header>
      <div className="friends-content">
        {error && <p role="alert">{error}</p>}
        {matches.length === 0 ? <p className="friends-empty">
          {search ? "Aucun pseudo trouvé." : pending ? "Aucune demande d’amitié reçue." : "Ta liste d’amis est vide."}
        </p> : <ul className="friends-grid">
          {matches.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(contact => {
            const online = onlineIds.includes(contact.id);
            return <li key={contact.id} className="friends-item">
              <button type="button" className="friends-profile" onClick={() => onProfile(contact.id)}>
                <span className="friends-avatar">
                  <Portrait {...contact} />
                  <span className={online ? "friends-online" : "friends-offline"} />
                </span>
                <span className="friends-identity">
                  <strong>{contact.name}</strong>
                  <span>Niveau {levelProgress(contact.xp ?? 0).level}</span>
                  <small>{online ? "En ligne" : "Hors ligne"}</small>
                </span>
              </button>
              <div className="friends-actions">
                {pending ? <>
                  <button type="button" disabled={responding} aria-label={`Accepter la demande de ${contact.name}`}
                    onClick={() => void respond(contact.id, true)}><UserCheck size={21} /></button>
                  <button type="button" disabled={responding} aria-label={`Refuser la demande de ${contact.name}`}
                    onClick={() => void respond(contact.id, false)}><UserX size={21} /></button>
                </> : <UserCheck size={21} aria-hidden="true" />}
              </div>
            </li>;
          })}
        </ul>}
      </div>
      <nav className="friends-pagination" aria-label="Pages des amis">
        <button type="button" aria-label="Page précédente" disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}><ChevronLeft /></button>
        <button type="button" aria-label="Page suivante" disabled={currentPage === lastPage}
          onClick={() => setPage(currentPage + 1)}><ChevronRight /></button>
      </nav>
    </section>
  );
}
