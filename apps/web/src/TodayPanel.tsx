import { useEffect, useState } from "react";
import { CircleDot, Gift, Sparkles, Ticket, X } from "lucide-react";
import type { ScratchTicket } from "../../../packages/contracts/src/index";

const STORAGE_KEY = "today-panel-open";
const QUEST_GIFTS = 5;

function readOpen() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

/** Daily loop shown over the map: quest, XP to collect, scratch ticket and wheel. */
export function TodayPanel({
  homeGifts,
  pendingXp,
  wheelTickets,
  busy,
  loadScratch,
  onAcceptQuest,
  onOpenMagazine,
  onScratch,
  onWheel,
}: {
  homeGifts?: number[] | null;
  pendingXp: number;
  wheelTickets: number;
  busy: boolean;
  loadScratch: () => Promise<{ ticket: ScratchTicket | null }>;
  onAcceptQuest: () => void;
  onOpenMagazine: () => void;
  onScratch: () => void;
  onWheel: () => void;
}) {
  const [open, setOpen] = useState(readOpen);
  const [scratch, setScratch] = useState<ScratchTicket | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    loadScratch().then(({ ticket }) => { if (!cancelled) setScratch(ticket); }, () => {});
    return () => { cancelled = true; };
  }, [loadScratch]);
  function toggle(next: boolean) {
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // The panel still toggles for this visit.
    }
  }
  const found = homeGifts?.length ?? 0;
  const questDone = found >= QUEST_GIFTS;
  const scratchDone = scratch?.claimed === true;
  const todo = Number(!questDone) + Number(pendingXp > 0) + Number(scratch !== undefined && !scratchDone) + Number(wheelTickets > 0);

  if (!open)
    return (
      <button type="button" className="today-reopen" onClick={() => toggle(true)}
        aria-label={`Ouvrir Aujourd’hui, ${todo} chose${todo > 1 ? "s" : ""} à faire`}>
        <Gift size={18} aria-hidden="true" />
        Aujourd’hui
        {todo > 0 && <b>{todo}</b>}
      </button>
    );

  return (
    <section className="today-panel" aria-labelledby="today-title">
      <div className="today-head">
        <div>
          <h2 id="today-title">Aujourd’hui</h2>
          <span>{todo ? `${todo} chose${todo > 1 ? "s" : ""} à faire` : "Tout est fait, bravo !"}</span>
        </div>
        <button type="button" className="today-close" onClick={() => toggle(false)} aria-label="Fermer Aujourd’hui">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="today-row">
        <Gift className="today-icon is-pink" size={22} aria-hidden="true" />
        <div className="today-text">
          <strong>Cadeaux cachés</strong>
          {homeGifts ? (
            <>
              <div className="today-track" role="progressbar" aria-label="Cadeaux trouvés"
                aria-valuemin={0} aria-valuemax={QUEST_GIFTS} aria-valuenow={found}>
                <span style={{ width: `${(100 * found) / QUEST_GIFTS}%` }} />
              </div>
              <small>{questDone ? "Quête terminée" : `${found} / ${QUEST_GIFTS} trouvés sur la carte`}</small>
            </>
          ) : (
            <small>5 000 XP et 200 pièces par cadeau</small>
          )}
        </div>
        {!homeGifts && (
          <button type="button" className="today-action is-pink" disabled={busy} onClick={onAcceptQuest}>Commencer</button>
        )}
      </div>

      {pendingXp > 0 && (
        <div className="today-row">
          <Sparkles className="today-icon is-gold" size={22} aria-hidden="true" />
          <div className="today-text">
            <strong>{pendingXp} XP à récolter</strong>
            <small>J’aime et photos reçus</small>
          </div>
          <button type="button" className="today-action is-gold" onClick={onOpenMagazine}>Récolter</button>
        </div>
      )}

      <div className="today-row">
        <Ticket className="today-icon is-gold" size={22} aria-hidden="true" />
        <div className="today-text">
          <strong>Ticket du jour</strong>
          <small>{scratchDone ? "Déjà gratté, reviens demain" : scratch ? "Ton gain t’attend" : "Jusqu’à 250 pièces"}</small>
        </div>
        {!scratchDone && <button type="button" className="today-action is-gold" onClick={onScratch}>{scratch ? "Récupérer" : "Gratter"}</button>}
      </div>

      <div className="today-row">
        <CircleDot className="today-icon is-green" size={22} aria-hidden="true" />
        <div className="today-text">
          <strong>Roue des récompenses</strong>
          <small>{wheelTickets > 0 ? `${wheelTickets} tour${wheelTickets > 1 ? "s" : ""} à jouer` : "Gagne des tours aux jeux et en montant de niveau"}</small>
        </div>
        {wheelTickets > 0 && <button type="button" className="today-action is-green" onClick={onWheel}>Tourner</button>}
      </div>
    </section>
  );
}
