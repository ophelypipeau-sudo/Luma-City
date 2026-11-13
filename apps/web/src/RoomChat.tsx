import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Send } from "lucide-react";
import {
  ROOM_MESSAGE_MAX,
  type RoomMessage,
} from "../../../packages/contracts/src/index";

export type RoomChatReceipt = { commandId: string; error?: string };

export function RoomChat({
  messages,
  receipt,
  enabled,
  onSend,
}: {
  messages: RoomMessage[];
  receipt: RoomChatReceipt | null;
  enabled: boolean;
  onSend: (body: string, commandId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const contentId = useId();
  const history = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!pending || receipt?.commandId !== pending) return;
    setPending(null);
    setError(receipt.error ?? "");
    if (!receipt.error) setDraft("");
  }, [pending, receipt]);
  useEffect(() => {
    if (!enabled) setPending(null);
  }, [enabled]);
  useEffect(() => {
    const log = history.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages.at(-1)?.id, expanded]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || pending || !draft.trim()) return;
    const commandId = crypto.randomUUID();
    setPending(commandId);
    setError("");
    onSend(draft.trim(), commandId);
  }
  return (
    <section className="room-chat" aria-label="Discussion publique de la salle">
      <button
        type="button"
        className="room-chat-toggle"
        aria-controls={contentId}
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        <MessageCircle size={15} />
        Discussion de la salle
        {expanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
      </button>
      <div id={contentId} hidden={!expanded}>
        <div
          className="room-chat-log"
          role="log"
          aria-label="Messages de la salle"
          ref={history}
        >
          {messages.length === 0 && <p>Aucun message pour le moment.</p>}
          {messages.map((message) => (
            <p key={message.id}>
              <strong>{message.name}</strong> {message.body}
            </p>
          ))}
        </div>
        <form onSubmit={submit}>
          <input
            aria-label="Message à la salle"
            placeholder={
              enabled ? "Écris un message…" : "Connexion à la salle…"
            }
            value={draft}
            maxLength={ROOM_MESSAGE_MAX}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!enabled || pending !== null}
          />
          <button
            type="submit"
            aria-label="Envoyer à la salle"
            disabled={!enabled || !!pending || !draft.trim()}
          >
            <Send size={15} />
          </button>
        </form>
        {error && (
          <p className="room-chat-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
