import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import type {
  Character,
  GarmentTransfer,
  ProfileSocial,
} from "../../../packages/contracts/src/index";
import { Portrait } from "./Avatar";
import { avatarCatalogSnapshot } from "./avatar/catalog";

export function Guestbook({
  character,
  canWrite,
  load,
  post,
  gifts,
  onWearGift,
  onBack,
}: {
  character: Character;
  canWrite: boolean;
  load: (id: string) => Promise<ProfileSocial>;
  post: (id: string, body: string) => Promise<ProfileSocial>;
  gifts?: readonly GarmentTransfer[];
  onWearGift: (item: GarmentTransfer["item"]) => void;
  onBack: () => void;
}) {
  const [details, setDetails] = useState<ProfileSocial>();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let current = true;
    load(character.id)
      .then((profile) => {
        if (current) setDetails(profile);
      })
      .catch((cause: Error) => {
        if (current) setError(cause.message);
      });
    return () => {
      current = false;
    };
  }, [character.id, load]);

  async function sign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !draft.trim()) return;
    setBusy(true);
    setError("");
    try {
      setDetails(await post(character.id, draft));
      setDraft("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "La signature n’a pas été publiée.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="guestbook">
      <header>
        <button type="button" onClick={onBack}>
          <ArrowLeft size={16} /> Retour
        </button>
        <h2>Livre d’or de {character.name}</h2>
      </header>
      <div className="guestbook-intro">
        <Portrait {...character} />
        <div>
          {character.motto && <p>{character.motto}</p>}
          <span>
            {details?.likes ?? 0} J’aime · {character.xp ?? 0} XP
          </span>
        </div>
      </div>
      {canWrite && (
        <form onSubmit={sign}>
          <label htmlFor="guestbook-note">Laisser un mot</label>
          <textarea
            id="guestbook-note"
            maxLength={280}
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" disabled={busy || !draft.trim()}>
            Signer le livre d’or
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      {details &&
        (details.guestbook.length ? (
          <ul>
            {details.guestbook.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.author}</strong>
                <p>{entry.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Le livre d’or est encore vide.</p>
        ))}
      {gifts && gifts.length > 0 && (
        <section aria-label="Vêtements reçus">
          <h3>Vêtements reçus</h3>
          <ul>
            {gifts.map(({ id, item }) => {
              const piece = avatarCatalogSnapshot().find(
                (entry) => entry.id === item.pieceId,
              );
              return (
                <li key={id}>
                  {piece?.name ?? item.pieceId}
                  {piece && (
                    <button type="button" onClick={() => onWearGift(item)}>
                      Porter
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
