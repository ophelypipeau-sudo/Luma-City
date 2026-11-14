import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Send } from "lucide-react";
import {
  ROOM_MESSAGE_MAX,
  type RoomMessage,
} from "../../../packages/contracts/src/index";

export type RoomChatReceipt = { commandId: string; error?: string };

/** Public chat of the current room, shown full height in the room's social drawer. */
export function RoomChat({
  messages,
  receipt,
  enabled,
  me,
  avatarFor,
  onSend,
}: {
  messages: RoomMessage[];
  receipt: RoomChatReceipt | null;
  enabled: boolean;
  me?: string;
  avatarFor?: (sender: string) => ReactNode;
  onSend: (body: string, commandId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const history = useRef<HTMLOListElement>(null);
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
  }, [messages.at(-1)?.id]);
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
      <ol className="room-chat-log" role="log" aria-label="Messages de la salle" ref={history}>
        {messages.length === 0 && (
          <li className="room-chat-empty">
            Personne n’a encore parlé ici. Dis bonjour à la salle !
          </li>
        )}
        {messages.map((message) => {
          const mine = message.sender === me;
          return (
            <li key={message.id} className={mine ? "is-mine" : undefined}>
              {avatarFor && <span className="room-chat-avatar">{avatarFor(message.sender)}</span>}
              <span className="room-chat-text">
                <strong>{mine ? "Toi" : message.name}</strong>
                <span>{message.body}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <form onSubmit={submit}>
        <input
          aria-label="Message à la salle"
          placeholder={enabled ? "Écris à la salle…" : "Connexion à la salle…"}
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
          <Send size={18} />
        </button>
      </form>
      {error && (
        <p className="room-chat-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
