import { useEffect, useEffectEvent, useRef, useState } from "react";
import { CircleDot, Hammer, Heart, RotateCw, Trophy } from "lucide-react";
import { MOLE_HOLES, MOLE_LIVES, MOLE_MISS, MOLE_TARGET, replayMole } from "../../../packages/domain/src/arcade";

const visibleTime = 1500;
const pauseTime = 400;

type Ticket = { id: string; seed: number };
type Round = Ticket & { moves: number[]; visible: boolean };

export function MoleGame({ startRound, finish, onWheel }: {
  startRound: () => Promise<Ticket>;
  finish: (id: string, moves: number[]) => Promise<void>;
  onWheel: () => void;
}) {
  const [round, setRound] = useState<Round | null>(null);
  const [busy, setBusy] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [error, setError] = useState("");
  const board = useRef<HTMLDivElement>(null);
  const progress = round && replayMole(round.seed, round.moves);
  const won = progress?.hits === MOLE_TARGET;
  const lost = progress?.lives === 0;
  const playing = !!round && !won && !lost;

  useEffect(() => {
    if (!round || !playing) return;

    const timer = window.setTimeout(() => {
      setRound((current) => current !== round ? current : round.visible
        ? { ...round, visible: false, moves: [...round.moves, MOLE_MISS] }
        : { ...round, visible: true });
    }, round.visible ? visibleTime : pauseTime);
    return () => window.clearTimeout(timer);
  }, [playing, round]);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const ticket = await startRound();
      setRewarded(false);
      setRound({ ...ticket, moves: [], visible: false });
      board.current?.focus();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reward() {
    if (!round || !won || busy || rewarded) return;
    setBusy(true);
    setError("");
    try {
      await finish(round.id, round.moves);
      setRewarded(true);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const rewardOnWin = useEffectEvent(reward);
  useEffect(() => {
    if (won) void rewardOnWin();
  }, [won]);

  function hit(hole: number) {
    if (!round?.visible || !playing || progress?.hole !== hole) return;
    setRound((current) => current === round ? { ...round, moves: [...round.moves, hole], visible: false } : current);
  }

  return <div className="mole-game">
    <h2><Hammer size={22} aria-hidden="true" /> Tape la taupe</h2>
    <p>Touche 10 taupes pour gagner. Chaque taupe qui s’échappe te coûte une vie.</p>
    <div className="mole-score">
      <span><strong>{progress?.hits ?? 0} / {MOLE_TARGET}</strong> taupes touchées</span>
      <span><Heart size={18} fill="currentColor" aria-hidden="true" /> <strong>{progress?.lives ?? MOLE_LIVES} / {MOLE_LIVES}</strong> vies</span>
    </div>
    <div className="mole-grid" ref={board} tabIndex={0} role="group" aria-label="Terrain de Tape la taupe" aria-describedby="mole-keyboard"
      onKeyDown={(event) => {
        if (!/^[1-9]$/.test(event.key) || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
        hit(Number(event.key) - 1);
      }}>
      {Array.from({ length: MOLE_HOLES }, (_, index) => {
        const active = playing && round.visible && progress?.hole === index;
        return <button key={index} type="button" className="mole-hole" data-active={active} aria-disabled={!active}
          aria-label={active ? `Taper la taupe au trou ${index + 1}` : `Trou ${index + 1}, vide`}
          tabIndex={-1} onClick={() => hit(index)}>
          {active && <span className="mole-character" aria-hidden="true"><i /><b /></span>}
          <span className="mole-hole-number" aria-hidden="true">{index + 1}</span>
        </button>;
      })}
    </div>
    <p id="mole-keyboard" className="mole-keyboard">Au clavier, utilise les touches 1 à 9.</p>
    <div className="mole-result">
      <strong role="status">
        {won ? <><Trophy size={20} aria-hidden="true" /> {rewarded ? "Bravo, 1 tour ajouté à ta roue !" : "Bravo, partie gagnée !"}</>
          : lost ? "Partie terminée, tu as perdu tes 3 vies." : ""}
      </strong>
      {rewarded && <button type="button" onClick={onWheel}><CircleDot size={17} aria-hidden="true" /> Ouvrir la roue</button>}
      {won && !rewarded && <button type="button" disabled={busy} onClick={reward}>
        {busy ? "Ajout du tour…" : "Récupérer mon tour"}
      </button>}
      {!playing && (!won || rewarded) && <button type="button" disabled={busy} onClick={start}>
        {round ? <RotateCw size={17} aria-hidden="true" /> : <Hammer size={17} aria-hidden="true" />}
        {round ? "Rejouer" : "Commencer"}
      </button>}
    </div>
    {error && <p role="alert">{error}</p>}
  </div>;
}
