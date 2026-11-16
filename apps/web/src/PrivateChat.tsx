import { Fragment, useCallback, useLayoutEffect, useRef, type FormEvent, type RefObject } from "react";
import { ArrowLeft, Flag, MessageCircle, Send, Shield, X } from "lucide-react";
import type { Contact, Message } from "../../../packages/contracts/src/index";
import { Portrait } from "./Avatar";
import { EmojiPicker } from "./EmojiPicker";

const MESSAGE_MAX = 800;

/**
 * Comme sur un téléphone : la conversation la plus récente en haut. Les joueurs
 * avec qui on n'a jamais parlé suivent, amis et connectés d'abord.
 */
export function sortConversations(contacts: readonly Contact[], onlineIds: readonly string[]) {
  const recent = contacts.filter((c) => c.lastMessage)
    .sort((a, b) => b.lastMessage!.at - a.lastMessage!.at);
  const others = contacts.filter((c) => !c.lastMessage && !c.blocked)
    .sort((a, b) => Number(Boolean(b.friend)) - Number(Boolean(a.friend))
      || Number(onlineIds.includes(b.id)) - Number(onlineIds.includes(a.id))
      || a.name.localeCompare(b.name, "fr"));
  return { recent, others };
}

const startOfDay = (time: number) => new Date(time).setHours(0, 0, 0, 0);
/** Heure du jour, « Hier », le jour de la semaine, puis la date. */
export function listTime(at: number, now = Date.now()) {
  const days = Math.round((startOfDay(now) - startOfDay(at)) / 86_400_000);
  if (days <= 0) return new Date(at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Hier";
  if (days < 7) return new Date(at).toLocaleDateString("fr-FR", { weekday: "long" });
  return new Date(at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function dayLabel(at: number, now = Date.now()) {
  const days = Math.round((startOfDay(now) - startOfDay(at)) / 86_400_000);
  if (days <= 0) return "Aujourd’hui";
  if (days === 1) return "Hier";
  return new Date(at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function PrivateChat({
  contacts, onlineIds, me, peer, messages, loading, draft, busy, scroller,
  onDraft, onSend, onChoose, onBack, onClose, onProfile, onReport, onToggleBlock, onScroll,
}: {
  contacts: readonly Contact[];
  onlineIds: readonly string[];
  me?: string;
  peer: string | null;
  messages: readonly Message[];
  /** La conversation choisie est encore en chargement. */
  loading: boolean;
  draft: string;
  busy: boolean;
  scroller: RefObject<HTMLDivElement | null>;
  onDraft: (text: string) => void;
  onSend: (event: FormEvent) => void;
  onChoose: (id: string) => void;
  onBack: () => void;
  onClose: () => void;
  onProfile: (id: string) => void;
  onReport: () => void;
  onToggleBlock: () => void;
  onScroll: () => void;
}) {
  const contact = contacts.find((c) => c.id === peer);
  const { recent, others } = sortConversations(contacts, onlineIds);
  const input = useRef<HTMLInputElement>(null);
  const shownPeer = useRef<string | null>(null);

  // On arrive en bas de la conversation, et on y reste à chaque nouveau message,
  // sauf si l'on est remonté lire les anciens.
  useLayoutEffect(() => {
    const box = scroller.current;
    if (!box || loading) return;
    const opened = shownPeer.current !== peer;
    shownPeer.current = peer;
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
    if (opened || nearBottom || messages.at(-1)?.sender === me)
      box.scrollTo({ top: box.scrollHeight, behavior: opened ? "auto" : "smooth" });
  }, [messages, peer, loading, me, scroller]);

  const focusInput = useCallback(() => input.current?.focus(), []);
  function addEmoji(emoji: string) {
    const field = input.current;
    const start = field?.selectionStart ?? draft.length;
    const end = field?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    if (next.length > MESSAGE_MAX) return;
    onDraft(next);
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  const row = (c: Contact) => {
    const online = onlineIds.includes(c.id);
    const last = c.lastMessage;
    return (
      <li key={c.id}>
        <button type="button" className={c.unread ? "pm-row is-unread" : "pm-row"} aria-pressed={peer === c.id}
          onClick={() => onChoose(c.id)}>
          <span className="pm-avatar">
            <Portrait {...c} />
            <i data-online={online} aria-hidden="true" />
          </span>
          <span className="pm-row-text">
            <span className="pm-row-top">
              <strong>{c.name}</strong>
              {last && <time>{listTime(last.at)}</time>}
            </span>
            <span className="pm-row-bottom">
              <span className="pm-preview">
                {c.blocked ? "Bloqué" : last ? `${last.mine ? "Toi : " : ""}${last.body}`
                  : online ? "En ligne · dis bonjour !" : "Hors ligne"}
              </span>
              {c.unread > 0 && (
                <b className="pm-badge" aria-label={`${c.unread} message${c.unread > 1 ? "s" : ""} non lu${c.unread > 1 ? "s" : ""}`}>
                  {c.unread}
                </b>
              )}
            </span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="pm-frame">
      <div className="pm" data-view={contact ? "conversation" : "list"}>
        <aside className="pm-list" aria-label="Conversations privées">
          <header className="pm-list-head">
            <h2>Messages</h2>
            <button type="button" className="pm-icon" aria-label="Fermer les messages privés" onClick={onClose}>
              <X size={22} />
            </button>
          </header>
          <div className="pm-list-scroll">
            {recent.length > 0 && <ul>{recent.map(row)}</ul>}
            {others.length > 0 && (
              <>
                <h3 className="pm-section">{recent.length ? "Démarrer une discussion" : "Joueurs du quartier"}</h3>
                <ul>{others.map(row)}</ul>
              </>
            )}
            {!contacts.length && <p className="pm-hint">Aucun joueur pour le moment. Va saluer le quartier !</p>}
          </div>
        </aside>

        <section className="pm-pane" aria-label={contact ? `Conversation avec ${contact.name}` : "Conversation"}>
          {!contact ? (
            <div className="pm-placeholder">
              <MessageCircle size={44} aria-hidden="true" />
              <p>Choisis une conversation pour lire et écrire tes messages.</p>
            </div>
          ) : (
            <>
              <header className="pm-head">
                <button type="button" className="pm-icon pm-back" aria-label="Retour aux conversations" onClick={onBack}>
                  <ArrowLeft size={22} />
                </button>
                <button type="button" className="pm-who" onClick={() => onProfile(contact.id)}
                  aria-label={`Voir le profil de ${contact.name}`}>
                  <span className="pm-avatar">
                    <Portrait {...contact} />
                    <i data-online={onlineIds.includes(contact.id)} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{contact.name}</strong>
                    <small>{onlineIds.includes(contact.id) ? "En ligne" : "Hors ligne · tes messages l’attendront"}</small>
                  </span>
                </button>
                <button type="button" className="pm-icon" title="Signaler" aria-label="Signaler ce joueur" onClick={onReport}>
                  <Flag size={20} />
                </button>
                <button type="button" className={contact.blocked ? "pm-icon is-blocked" : "pm-icon"}
                  title={contact.blocked ? "Débloquer" : "Bloquer"} aria-label={contact.blocked ? "Débloquer" : "Bloquer"}
                  onClick={onToggleBlock}>
                  <Shield size={20} />
                </button>
              </header>

              <div className="pm-messages" ref={scroller} onScroll={onScroll}>
                {loading ? null : messages.length === 0 ? (
                  <div className="pm-placeholder">
                    <MessageCircle size={40} aria-hidden="true" />
                    <p><strong>Un petit bonjour ?</strong><br />
                      Tu peux écrire même si {contact.name} n’est pas connecté·e.</p>
                  </div>
                ) : messages.map((m, index) => {
                  const at = new Date(m.created_at).getTime();
                  const before = messages[index - 1];
                  const newDay = !before || startOfDay(new Date(before.created_at).getTime()) !== startOfDay(at);
                  const mine = m.sender === me;
                  return (
                    <Fragment key={m.id}>
                      {newDay && <p className="pm-day">{dayLabel(at)}</p>}
                      <div className={["pm-bubble", mine && "is-mine",
                        !newDay && before?.sender === m.sender && "is-follow"].filter(Boolean).join(" ")}
                        data-incoming-id={m.recipient === me ? m.id : undefined}>
                        <p>{m.body}</p>
                        <time>{new Date(at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</time>
                      </div>
                    </Fragment>
                  );
                })}
              </div>

              {contact.blocked && <p className="pm-blocked">Tu as bloqué {contact.name}. Débloque-le·la pour lui écrire.</p>}
              <form className="pm-composer" onSubmit={onSend}>
                <EmojiPicker onPick={addEmoji} onDone={focusInput} disabled={contact.blocked} />
                <label className="sr-only" htmlFor="message">Ton message</label>
                <input id="message" ref={input} value={draft} onChange={(event) => onDraft(event.target.value)}
                  placeholder={`Écrire à ${contact.name}…`} maxLength={MESSAGE_MAX} autoComplete="off"
                  disabled={contact.blocked} />
                {draft.length > MESSAGE_MAX - 100 && <small className="pm-count">{draft.length}/{MESSAGE_MAX}</small>}
                <button type="submit" className="pm-send" disabled={!draft.trim() || busy || contact.blocked}
                  aria-label="Envoyer le message">
                  <Send size={20} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
