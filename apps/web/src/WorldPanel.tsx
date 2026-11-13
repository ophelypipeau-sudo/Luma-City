import { useEffect, useId, useRef, type ReactNode } from "react";
import { BookOpen, Camera, Heart, Shirt, Star, X } from "lucide-react";
import type { XpMagazine, XpRewardSource } from "../../../packages/contracts/src/index";
import "./world-panel.css";

const sections = [
  { source: "look-like", title: "Tes looks", icon: Shirt, empty: "Tes looks n’ont pas encore reçu de J’aime." },
  { source: "photo", title: "Tes photos", icon: Camera, empty: "Personne n’a encore pris de photo avec toi." },
  { source: "like", title: "Ton profil", icon: Heart, empty: "Ton profil n’a pas encore reçu de J’aime." },
] as const satisfies readonly { source: XpRewardSource; title: string; icon: typeof Heart; empty: string }[];

export function WorldPanel({ magazine, busy, status, onClose, onClaim, rewards }: {
  magazine?: XpMagazine;
  busy: boolean;
  status: string;
  onClose: () => void;
  onClaim: (source?: XpRewardSource) => void;
  rewards?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  const points = magazine?.rewards.reduce((sum, reward) => sum + reward.points, 0) ?? 0;
  const multiplier = magazine?.multiplier ?? 1;
  return (
    <dialog ref={dialog} className="world-feature xp-magazine" aria-labelledby={title}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <header>
        <BookOpen aria-hidden="true" />
        <h2 id={title}>Magazine</h2>
        <button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button>
      </header>
      <div className="xp-magazine-spread">
        <div className="xp-magazine-page xp-magazine-summary">
          <div className="xp-magazine-star"><Star size={36} aria-hidden="true" /></div>
          <p className="xp-magazine-total"><strong>{points * multiplier} XP</strong> à récolter</p>
          {multiplier > 1 && <p>Bonus actif ×{multiplier}</p>}
          <button type="button" className="world-feature-claim" disabled={!points || busy} onClick={() => onClaim()}>
            {busy ? "Récolte en cours…" : "Tout récolter"}
          </button>
          {status && <p role="status">{status}</p>}
        </div>
        <div className="xp-magazine-page xp-magazine-activity">
          {sections.map(({ source, title, icon: Icon, empty }) => {
            const entries = magazine?.activity?.filter((entry) => entry.source === source) ?? [];
            const available = (magazine?.rewards.find((reward) => reward.source === source)?.points ?? 0) * multiplier;
            return <section key={source} className="xp-magazine-card">
              <div className="xp-magazine-card-heading">
                <Icon size={19} aria-hidden="true" />
                <h3>{title}</h3>
                <button type="button" className="xp-magazine-claim"
                  aria-label={`${title} · Réclamer ${available} XP`}
                  disabled={!available || busy} onClick={() => onClaim(source)}>
                  {available ? `Réclamer ${available} XP` : "0 XP à réclamer"}
                </button>
              </div>
              {entries.length ? <ul>
                {entries.map(({ actor, name, count }) => <li key={actor}>
                  <strong>{name}</strong>
                  <span>{source === "photo" ? `${count} photo${count === 1 ? "" : "s"} avec toi`
                    : source === "like" ? "A aimé ton profil"
                    : count === 1 ? "A aimé un look" : `A aimé ${count} looks`}</span>
                </li>)}
              </ul> : <p>{empty}</p>}
            </section>;
          })}
        </div>
      </div>
      {rewards}
    </dialog>
  );
}
