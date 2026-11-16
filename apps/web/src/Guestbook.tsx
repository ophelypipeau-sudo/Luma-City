import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  ArrowLeft, BookHeart, Check, ChevronLeft, ChevronRight, Gift, Heart, Trash2, UserRound,
} from "lucide-react";
import {
  levelProgress,
  type Character,
  type GarmentTransfer,
  type GuestbookEntry,
  type ProfileSocial,
} from "../../../packages/contracts/src/index";
import { Portrait } from "./Avatar";
import { avatarCatalogSnapshot } from "./avatar/catalog";
import { AvatarItemThumbnail } from "./avatar/LayeredDoll";
import { HeartsSticker, KissSticker, StarSticker } from "./guestbook/stickers";
import { playSound } from "./sounds";

type Tab = "notes" | "gifts";
/** Temps de l'animation du paquet avant d'afficher ce qu'il contient. */
const UNWRAP_TIME = 900;

/** « 16 novembre 2026 » */
function giftDate(sentAt: number | null) {
  return sentAt ? new Date(sentAt).toLocaleDateString("fr", { day: "numeric", month: "long", year: "numeric" }) : "";
}
const giftPiece = (gift: GarmentTransfer) =>
  avatarCatalogSnapshot().find((entry) => entry.id === gift.item.pieceId);
type Turn = { dir: "next" | "prev"; tab: Tab; page: number };

/**
 * Onglet « Cadeaux » : les paquets encore emballés en haut, puis les vêtements reçus
 * avec leur expéditeur et leur date. Le paquet qu'on ouvre reste affiché jusqu'à la
 * fin de son animation.
 */
export function GiftShelf({ gifts, unwrapping, live, onUnwrap, onWear }: {
  gifts: readonly GarmentTransfer[];
  unwrapping: string | null;
  live: boolean;
  onUnwrap: (gift: GarmentTransfer) => void;
  onWear: (item: GarmentTransfer["item"]) => void;
}) {
  const wrapped = gifts.filter((gift) => !gift.opened || gift.id === unwrapping);
  const received = gifts.filter((gift) => gift.opened && gift.id !== unwrapping);
  return (
    <div className="lbook-gifts">
      {wrapped.length > 0 && (
        <>
          <h3><Gift size={18} aria-hidden="true" /> À ouvrir</h3>
          <ul className="lbook-wrapped">
            {wrapped.map((gift) => (
              <li key={gift.id}>
                <button type="button" tabIndex={live ? 0 : -1} disabled={!!unwrapping}
                  className={live && unwrapping === gift.id ? "is-unwrapping" : undefined}
                  aria-label={`Ouvrir le cadeau de ${gift.senderName}`}
                  onClick={() => onUnwrap(gift)}>
                  <img src="/assets/gifts/cadeau-ferme.png" alt="" />
                  <small>De {gift.senderName}</small>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <h3><Gift size={18} aria-hidden="true" /> Vêtements reçus</h3>
      {!received.length ? (
        <p className="lbook-empty">{wrapped.length ? "Ouvre tes cadeaux pour les voir ici." : "Aucun cadeau pour le moment."}</p>
      ) : (
        <ul>
          {received.map((gift) => {
            const piece = giftPiece(gift);
            const date = giftDate(gift.sentAt);
            return (
              <li key={gift.id}>
                {piece && <AvatarItemThumbnail piece={piece} color={gift.item.color} detailColor={gift.item.detailColor} />}
                <span>
                  <strong>{piece?.name ?? gift.item.pieceId}</strong>
                  <small>De {gift.senderName}{date && ` · ${date}`}</small>
                </span>
                {piece && (
                  <button type="button" tabIndex={live ? 0 : -1} onClick={() => onWear(gift.item)}>Porter</button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** « il y a 5 min », « hier », « 12 nov. » */
export function noteDate(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "";
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "à l’instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr", { day: "numeric", month: "short" });
}

/** How many notes fit on the right page, from the space under the writing field. */
export function notesPerPage(height: number) {
  return Math.max(2, Math.floor((height + 10) / 86));
}

/**
 * Livre d’or as a spiral scrapbook: the owner's portrait on a collage on the
 * left, notes on grid paper on the right. Pages turn around the spine.
 */
export function Guestbook({
  character,
  viewerId,
  canWrite,
  onlineIds = [],
  load,
  post,
  remove,
  gifts,
  onWearGift,
  onOpenGift,
  onOpenProfile,
  onBack,
}: {
  character: Character;
  /** The reader, to know which notes they may erase. */
  viewerId?: string;
  canWrite: boolean;
  onlineIds?: readonly string[];
  load: (id: string) => Promise<ProfileSocial>;
  post: (id: string, body: string) => Promise<ProfileSocial>;
  remove?: (noteId: number) => Promise<ProfileSocial>;
  gifts?: readonly GarmentTransfer[];
  onWearGift: (item: GarmentTransfer["item"]) => void;
  onOpenGift: (id: string) => Promise<void>;
  onOpenProfile?: (person: Character) => void;
  onBack: () => void;
}) {
  const [details, setDetails] = useState<ProfileSocial>();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("notes");
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [perPage, setPerPage] = useState(4);
  const [now, setNow] = useState(() => Date.now());
  const [opened, setOpened] = useState<number | null>(null);
  const [clamped, setClamped] = useState<readonly number[]>([]);
  // Le paquet en train de s'ouvrir, puis le cadeau dévoilé dans la fenêtre.
  const [unwrapping, setUnwrapping] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<GarmentTransfer | null>(null);
  const reveal = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const own = viewerId === character.id;

  useEffect(() => {
    let current = true;
    load(character.id)
      .then((profile) => { if (current) setDetails(profile); })
      .catch((cause: Error) => { if (current) setError(cause.message); });
    return () => { current = false; };
  }, [character.id, load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  // The page holds as many notes as its height allows.
  useLayoutEffect(() => {
    const element = list.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => setPerPage(notesPerPage(element.clientHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [tab]);

  // « Lire la suite » only for notes whose text is really cut off.
  useLayoutEffect(() => {
    const bodies = list.current?.querySelectorAll<HTMLElement>("[data-note]") ?? [];
    const next = [...bodies]
      .filter((body) => body.scrollHeight > body.clientHeight + 1 || Number(body.dataset.note) === opened)
      .map((body) => Number(body.dataset.note));
    setClamped((current) => current.length === next.length && current.every((id, index) => id === next[index])
      ? current : next);
  });

  const notes = details?.guestbook ?? [];
  const toOpen = gifts?.filter((gift) => !gift.opened).length ?? 0;
  const pages = tab === "notes" ? Math.max(1, Math.ceil(notes.length / perPage)) : 1;
  const current = Math.min(page, pages - 1);
  const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function go(nextTab: Tab, nextPage: number) {
    if (nextTab === tab && nextPage === current) return;
    const forward = nextTab === tab ? nextPage > current : nextTab === "gifts";
    if (!reduceMotion) setTurn({ dir: forward ? "next" : "prev", tab, page: current });
    setTab(nextTab);
    setPage(nextPage);
  }

  async function sign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !draft.trim()) return;
    setBusy(true);
    setError("");
    try {
      setDetails(await post(character.id, draft.trim()));
      setDraft("");
      if (current !== 0) go("notes", 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ton mot n’a pas été publié.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (revealed && !reveal.current?.open) reveal.current?.showModal();
  }, [revealed]);

  async function unwrap(gift: GarmentTransfer) {
    if (unwrapping) return;
    setUnwrapping(gift.id);
    setError("");
    try {
      await Promise.all([
        onOpenGift(gift.id),
        new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : UNWRAP_TIME)),
      ]);
      playSound("cadeau");
      setRevealed(gift);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ce cadeau n’a pas pu être ouvert.");
    } finally {
      setUnwrapping(null);
    }
  }

  async function erase(note: GuestbookEntry) {
    if (!remove || busy) return;
    setBusy(true);
    setError("");
    try {
      setDetails(await remove(note.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ce mot n’a pas pu être effacé.");
    } finally {
      setBusy(false);
    }
  }

  const level = levelProgress(character.xp ?? 0).level;
  const template = character.profile_template === "garden" ? "solid" : character.profile_template ?? "solid";
  const photo = template === "image" && character.profile_image_version
    ? `/api/profile/image/${encodeURIComponent(character.id)}/${encodeURIComponent(character.profile_image_version)}`
    : undefined;

  const pageContent = (shownTab: Tab, shownPage: number, live: boolean) => (
    <div className="lbook-paper-inner">
      {shownTab === "notes" ? (
        <>
          {canWrite ? (
            <form className="lbook-write" onSubmit={live ? sign : (event) => event.preventDefault()}>
              <input
                type="text"
                maxLength={280}
                value={draft}
                readOnly={!live}
                tabIndex={live ? 0 : -1}
                aria-label={`Écrire un petit mot sur le profil de ${character.name}`}
                placeholder={`Écrire un petit mot sur le profil de ${character.name}…`}
                onChange={(event) => setDraft(event.target.value)}
              />
              {draft.length > 200 && <small aria-live="polite">{draft.length}/280</small>}
              <button type="submit" disabled={!live || busy || !draft.trim()} aria-label="Publier mon mot"
                tabIndex={live ? 0 : -1}>
                <Check size={18} strokeWidth={3} />
              </button>
            </form>
          ) : (
            <p className="lbook-own">{own
              ? "Les mots laissés par les autres joueurs apparaissent ici."
              : `Tu ne peux pas écrire dans le livre d’or de ${character.name}.`}</p>
          )}
          <div className="lbook-notes" ref={live ? list : undefined}>
            {!details ? <p className="lbook-empty">Ouverture du livre…</p>
              : notes.length === 0 ? (
                <p className="lbook-empty">
                  <BookHeart size={28} aria-hidden="true" />
                  {own ? "Ton livre d’or est encore vide." : `Sois la première personne à écrire à ${character.name} !`}
                </p>
              ) : (
                <ul>
                  {notes.slice(shownPage * perPage, (shownPage + 1) * perPage).map((note) => {
                    const author = note.authorCharacter;
                    const online = Boolean(note.authorId && onlineIds.includes(note.authorId));
                    const mine = Boolean(viewerId && note.authorId === viewerId);
                    return (
                      <li key={note.id} className="lbook-note" data-open={opened === note.id}>
                        <button type="button" className="lbook-note-face" tabIndex={live ? 0 : -1}
                          disabled={!author || !onOpenProfile}
                          aria-label={`Voir le profil de ${note.author}`}
                          onClick={() => author && onOpenProfile?.(author)}>
                          {author ? <Portrait {...author} /> : <UserRound size={22} aria-hidden="true" />}
                          {online && <i aria-label="En ligne" />}
                        </button>
                        <div className="lbook-note-text">
                          <p className="lbook-note-head">
                            <strong>{note.author}</strong>
                            {note.createdAt && <time dateTime={note.createdAt}>{noteDate(note.createdAt, now)}</time>}
                          </p>
                          <p className="lbook-note-body" data-note={live ? note.id : undefined}>{note.body}</p>
                          {clamped.includes(note.id) && (
                            <button type="button" className="lbook-note-more" tabIndex={live ? 0 : -1}
                              aria-expanded={opened === note.id}
                              onClick={() => setOpened(opened === note.id ? null : note.id)}>
                              {opened === note.id ? "Réduire" : "Lire la suite"}
                            </button>
                          )}
                        </div>
                        {remove && (own || mine) && (
                          <button type="button" className="lbook-note-erase" disabled={busy} tabIndex={live ? 0 : -1}
                            aria-label={`Effacer le mot de ${note.author}`} title="Effacer ce mot"
                            onClick={() => void erase(note)}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
          </div>
        </>
      ) : (
        <GiftShelf gifts={gifts ?? []} unwrapping={unwrapping} live={live}
          onUnwrap={(gift) => void unwrap(gift)} onWear={onWearGift} />
      )}
      <footer className="lbook-folio">
        {shownTab === "notes" && pages > 1 ? (
          <>
            <button type="button" aria-label="Page précédente" disabled={!live || shownPage === 0} tabIndex={live ? 0 : -1}
              onClick={() => go("notes", shownPage - 1)}><ChevronLeft size={18} /></button>
            <span>{shownPage + 1} / {pages}</span>
            <button type="button" aria-label="Page suivante" disabled={!live || shownPage >= pages - 1} tabIndex={live ? 0 : -1}
              onClick={() => go("notes", shownPage + 1)}><ChevronRight size={18} /></button>
          </>
        ) : <span>{shownTab === "gifts" ? "Cadeaux" : notes.length === 0 ? "Aucun mot"
          : `${notes.length} mot${notes.length > 1 ? "s" : ""}`}</span>}
      </footer>
    </div>
  );

  return (
    <section className="lbook" aria-label={`Livre d’or de ${character.name}`} onKeyDown={(event) => {
      if (event.key === "Escape" && !revealed) onBack();
      if (event.target instanceof HTMLInputElement || tab !== "notes") return;
      if (event.key === "ArrowRight" && current < pages - 1) go("notes", current + 1);
      if (event.key === "ArrowLeft" && current > 0) go("notes", current - 1);
    }}>
      <button type="button" className="lbook-back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> Retour
      </button>

      <div className="lbook-stage">
      <div className="lbook-book">
        <div className="lbook-left" data-template={template}
          style={photo ? { "--lbook-photo": `url("${photo}")` } as CSSProperties : undefined}>
          <span className="lbook-scrap lbook-scrap-a" aria-hidden="true" />
          <span className="lbook-scrap lbook-scrap-b" aria-hidden="true" />
          <span className="lbook-scrap lbook-scrap-c" aria-hidden="true" />
          <StarSticker className="lbook-sticker lbook-star-1" />
          <StarSticker className="lbook-sticker lbook-star-2" />
          <StarSticker className="lbook-sticker lbook-star-3" />
          <KissSticker className="lbook-sticker lbook-kiss" />
          <div className="lbook-photo">
            <Portrait {...character} />
          </div>
          <HeartsSticker className="lbook-sticker lbook-hearts" />
          <div className="lbook-label">
            <strong>{character.name}</strong>
            <span>Niv. {level} · <Heart size={11} fill="currentColor" aria-hidden="true" /> {details?.likes ?? 0}</span>
            {character.motto && <em>« {character.motto} »</em>}
          </div>
        </div>

        <div className="lbook-rings" aria-hidden="true">
          {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
        </div>

        <div className="lbook-right">
          <div className="lbook-paper">
            {pageContent(tab, current, true)}
            {turn?.dir === "prev" && (
              // Going back, the current page stays visible until the previous one covers it.
              <div key={`under-${turn.tab}-${turn.page}`} className="lbook-under" aria-hidden="true" inert>
                {pageContent(turn.tab, turn.page, false)}
              </div>
            )}
            {turn && (
              <div
                key={`${turn.tab}-${turn.page}-${tab}-${current}`}
                className={`lbook-leaf is-${turn.dir}`}
                aria-hidden="true"
                inert
                onAnimationEnd={() => setTurn(null)}
              >
                {turn.dir === "next" ? pageContent(turn.tab, turn.page, false) : pageContent(tab, current, false)}
              </div>
            )}
          </div>
        </div>

        <nav className="lbook-tabs" aria-label="Sections du livre d’or">
          <button type="button" aria-pressed={tab === "notes"} onClick={() => go("notes", 0)} title="Mots">
            <BookHeart size={20} aria-hidden="true" /><span>Mots</span>
            {notes.length > 0 && <b>{notes.length}</b>}
          </button>
          {own && (
            <button type="button" aria-pressed={tab === "gifts"} onClick={() => go("gifts", 0)} title="Cadeaux reçus">
              <Gift size={20} aria-hidden="true" /><span>Cadeaux</span>
              {toOpen > 0 && <b aria-label={`${toOpen} à ouvrir`}>{toOpen}</b>}
            </button>
          )}
          {onOpenProfile && (
            <button type="button" onClick={() => onOpenProfile(character)} title={`Profil de ${character.name}`}>
              <UserRound size={20} aria-hidden="true" /><span>Profil</span>
            </button>
          )}
        </nav>
      </div>
      </div>

      {error && <p className="lbook-error" role="alert">{error}</p>}

      {revealed && (() => {
        const piece = giftPiece(revealed);
        const date = giftDate(revealed.sentAt);
        return (
          <dialog ref={reveal} className="lbook-reveal" aria-labelledby="lbook-reveal-title"
            onClose={() => setRevealed(null)}>
            <span className="lbook-reveal-burst" aria-hidden="true" />
            {piece && <AvatarItemThumbnail piece={piece} color={revealed.item.color} detailColor={revealed.item.detailColor} />}
            <h2 id="lbook-reveal-title">Tu as reçu {piece?.name ?? "un vêtement"}{" "}!</h2>
            <p>De la part de <strong>{revealed.senderName}</strong>{date && `, le ${date}`}</p>
            <div>
              {piece && (
                <button type="button" onClick={() => { onWearGift(revealed.item); reveal.current?.close(); }}>Porter</button>
              )}
              <button type="button" className="lbook-reveal-close" onClick={() => reveal.current?.close()}>Fermer</button>
            </div>
          </dialog>
        );
      })()}
    </section>
  );
}
