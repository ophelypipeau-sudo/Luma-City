import { useEffect, useRef, useState, type Ref } from "react";
import { ArrowLeft, Check, CircleDot, Crown, Hammer, LockKeyhole, RotateCw, Shirt, Sparkles, Trophy, X } from "lucide-react";
import type { RewardWheel, ScratchTicket } from "../../../packages/contracts/src/index";
import {
  ARCADE_TARGET_LEVEL, MEMORY_PAIRS, WHEEL_PRIZES, type WheelPrize,
  arcadeLevel, replayMemory,
} from "../../../packages/domain/src/arcade";
import { avatarGarment } from "./avatar/catalog";
import { AvatarItemThumbnail } from "./avatar/LayeredDoll";
import { DailyScratch } from "./DailyScratch";
import { MoleGame } from "./MoleGame";
import "./arcade.css";

type Round = { id: string; seed: number; moves: number[]; rewarded: boolean };
const memoryPieces = ["fashion.premium-rosalie", "fashion.pants-dalle", "fashion.premium-velvet", "fashion.pants-ruban"].map(avatarGarment);

function MemoryBoard({ round, move, busy, won }: {
  round: Round; move: (index: number) => void; busy: boolean; won: boolean;
}) {
  const { deck, pending, matched, mismatch, over } = replayMemory(round.seed, round.moves);
  const turn = round.moves.length;
  const [closed, setClosed] = useState(-1);
  const waiting = !!mismatch && closed !== turn;
  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => setClosed(turn), 850);
    return () => window.clearTimeout(timer);
  }, [turn, waiting]);
  const pairs = matched.size / 2;
  const status = over ? "Partie terminée. Tu peux recommencer."
    : waiting ? "Ce ne sont pas les mêmes. Réessaie !"
    : pending !== null ? "Retourne une deuxième carte."
    : "Retourne une carte pour chercher une paire.";
  return <div className="memory-board">
    <div className="memory-progress" aria-label={`Niveau ${pairs + 1} sur 5`}>
      <span><strong>{pairs} / {MEMORY_PAIRS}</strong> paires</span>
      <div aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <span key={i} data-reached={i <= pairs}>{i + 1}</span>)}</div>
      <span><strong>Niv. {pairs + 1}</strong> / 5</span>
    </div>
    <div className="memory-grid" aria-label="Huit cartes du dressing">
      {deck.map((face, i) => {
        const found = matched.has(i);
        const open = found || pending === i || (waiting && !!mismatch?.includes(i));
        const piece = memoryPieces[face];
        const unavailable = found || pending === i || waiting || busy || won || over;
        return <button key={i} type="button" className="memory-card" data-open={open}
          data-found={found} aria-disabled={unavailable}
          aria-label={open ? `Carte ${i + 1} : ${piece.name}${found ? ", paire trouvée" : ""}` : `Retourner la carte ${i + 1}`}
          onClick={() => { if (!unavailable) move(i); }}>
          {open ? <><AvatarItemThumbnail piece={piece} /><span>{piece.name}</span>{found && <Check className="memory-found" size={16} aria-hidden="true" />}</>
            : <><Shirt size={32} aria-hidden="true" /><span aria-hidden="true">{i + 1}</span></>}
        </button>;
      })}
    </div>
    {!won && <p className="memory-status" role="status">{status}</p>}
  </div>;
}

export function Arcade({ tickets, onBack, onWheel, start, finish, loadScratch, scratch, claimScratch }: {
  tickets: number;
  onBack: () => void;
  onWheel: () => void;
  start: (game: "memory" | "mole") => Promise<{ id: string; seed: number }>;
  finish: (id: string, moves: number[]) => Promise<void>;
  loadScratch: () => Promise<{ ticket: ScratchTicket | null }>;
  scratch: () => Promise<{ ticket: ScratchTicket }>;
  claimScratch: (id: string) => Promise<void>;
}) {
  const [round, setRound] = useState<Round | null>(null);
  const [showMoleGame, setShowMoleGame] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const play = async () => {
    setBusy(true);
    setError("");
    try {
      const ticket = await start("memory");
      setRound({ ...ticket, moves: [], rewarded: false });
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const memory = round ? replayMemory(round.seed, round.moves) : null;
  const level = arcadeLevel(memory?.score ?? 0);
  const won = level >= ARCADE_TARGET_LEVEL;
  function move(column: number) {
    if (!memory || memory.over || won || busy) return;
    setRound((current) => current && { ...current, moves: [...current.moves, column] });
  }
  async function reward() {
    if (!round || !won || round.rewarded || busy) return false;
    setBusy(true);
    setError("");
    try {
      await finish(round.id, round.moves);
      setRound((current) => current?.id === round.id ? { ...current, rewarded: true } : current);
      return true;
    } catch (cause) {
      setError((cause as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function replayMemoryRound() {
    if (busy || !round) return;
    if (won && !round.rewarded && !(await reward())) return;
    await play();
  }
  return (
    <section className="arcade">
      <header>
        <button type="button" onClick={round || showMoleGame ? () => {
          setRound(null);
          setShowMoleGame(false);
          setError("");
        } : onBack} disabled={busy}
          aria-label={round || showMoleGame ? "Retour aux jeux" : "Retour au quartier"}><ArrowLeft size={19} /></button>
        <h1>Coin détente</h1>
        <button type="button" onClick={onWheel}><CircleDot size={18} /> Roue <b>{tickets}</b></button>
      </header>
      {showMoleGame ? <MoleGame startRound={() => start("mole")} finish={finish} onWheel={onWheel} /> : round && memory ? (
        <div className="memory-game">
          <h2>Mémo du dressing</h2>
          <p>Retourne deux cartes. Si elles montrent le même vêtement, la paire reste visible.</p>
          <MemoryBoard key={round.id} round={round} move={move} busy={busy} won={won} />
          {won ? (
            <div className="memory-reward">
              <div className="memory-reward-copy" role="status">
                <span className="memory-reward-medal"><Trophy size={23} aria-hidden="true" /></span>
                <div>
                  <strong>Toutes les paires trouvées !</strong>
                  <span>{round.rewarded ? "Tour ajouté à ta roue" : "Tu as gagné un tour de roue"}</span>
                </div>
              </div>
              <div className="memory-reward-actions">
                <button type="button" className="memory-wheel-action" disabled={busy}
                  onClick={round.rewarded ? onWheel : reward}>
                  <CircleDot size={16} aria-hidden="true" /> {round.rewarded ? "Ouvrir la roue" : "Récolter mon tour"}
                </button>
                <button type="button" className="memory-replay" onClick={replayMemoryRound} disabled={busy}>
                  <RotateCw size={16} aria-hidden="true" /> Rejouer
                </button>
              </div>
            </div>
          ) : memory.over && <button type="button" onClick={replayMemoryRound} disabled={busy}>Rejouer</button>}
        </div>
      ) : (
        <>
          <div className="memory-hero">
            <div className="memory-hero-copy">
              <span className="memory-kicker"><Sparkles size={15} aria-hidden="true" /> Jeux du quartier</span>
              <h2>Mémo du dressing</h2>
              <p>Retrouve quatre paires de vêtements de la boutique, à ton rythme. Le niveau 5 te donne un tour de roue.</p>
              <button type="button" onClick={() => void play()} disabled={busy}><Shirt size={18} /> Jouer au mémo</button>
            </div>
            <div className="memory-hero-cards" aria-hidden="true">
              {memoryPieces.slice(0, 3).map((piece) => <div key={piece.id}><AvatarItemThumbnail piece={piece} /></div>)}
            </div>
          </div>
          <div className="mole-entry">
            <Hammer size={28} aria-hidden="true" />
            <div>
              <h2>Tape la taupe</h2>
              <p>Touche 10 taupes avec tes 3 vies.</p>
            </div>
            <button type="button" disabled={busy} onClick={() => setShowMoleGame(true)}>Jouer à Tape la taupe</button>
          </div>
          <DailyScratch load={loadScratch} reveal={scratch} claim={claimScratch} />
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

const segmentAngle = 360 / WHEEL_PRIZES.length;
const wheelSegments = WHEEL_PRIZES.map((_, index) => {
  const start = index * segmentAngle;
  const end = start + segmentAngle;
  const color = index % 2 ? "#a8326d" : "#c04780";
  return `${color} ${start}deg ${end - .6}deg, #fff1f8 ${end - .6}deg ${end}deg`;
}).join(", ");
const rewardIcons = { coins: "billet-rose.png", diamonds: "diamants.png", xp: "etoile-xp.png" };
const formatAmount = new Intl.NumberFormat("fr-FR");
function rewardLabel(amount: number, currency: WheelPrize["currency"]) {
  const unit = currency === "xp" ? "XP" : currency === "coins" ? "pièce" : "diamant";
  return `${formatAmount.format(amount)} ${unit}${amount > 1 && currency !== "xp" ? "s" : ""}`;
}

function WheelDial({ disc, vip = false }: { disc?: Ref<HTMLDivElement>; vip?: boolean }) {
  return <div className="wheel-frame">
    <div ref={disc} className="wheel-disc" role="list" aria-label="Gains possibles"
      style={{ backgroundImage: `radial-gradient(circle, #e43c5f88, transparent 65%), conic-gradient(${wheelSegments})` }}>
      {WHEEL_PRIZES.map(({ amount, currency }, index) => {
        const angle = (index + .5) * segmentAngle;
        const value = amount * (vip ? 2 : 1);
        return <div className="wheel-spoke" role="listitem" aria-label={rewardLabel(value, currency)}
          key={index} style={{ rotate: `${angle}deg` }}>
          <span className="wheel-value" aria-hidden="true" style={{ rotate: `${-angle}deg` }}>
            <img src={`/assets/wallet/${rewardIcons[currency]}`} alt="" />{formatAmount.format(value)}
          </span>
        </div>;
      })}
    </div>
    <div className="wheel-hub" aria-hidden="true">{vip ? <LockKeyhole size={22} /> : <Sparkles size={23} />}</div>
  </div>;
}
export function PrizeWheel({ wheel, onClose, onSpin, onBurst }: {
  wheel?: RewardWheel;
  onClose: () => void;
  onSpin: (id: string) => Promise<{ index: number; prize: WheelPrize; reveal: () => void }>;
  onBurst: (id: string, origin: { x: number; y: number }) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  const pending = useRef<string | null>(null);
  const rotation = useRef(0);
  const [result, setResult] = useState<WheelPrize | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  async function spin() {
    if (busy || !wheel?.tickets) return;
    const id = pending.current ?? crypto.randomUUID();
    pending.current = id;
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const prize = await onSpin(id);
      const target = (360 - (prize.index + .5) * segmentAngle) % 360;
      const nextAngle = rotation.current + 1440 + ((target - (rotation.current % 360) + 360) % 360);
      const element = disc.current;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prize.index >= 0 && element && !reduce) {
        const animation = element.animate([
          { transform: `rotate(${rotation.current}deg)` },
          { transform: `rotate(${nextAngle}deg)` },
        ], { duration: 2800, easing: "cubic-bezier(.13,.7,.14,1)", fill: "forwards" });
        await animation.finished.catch(() => {});
        element.style.transform = `rotate(${nextAngle}deg)`;
        animation.cancel();
      } else if (prize.index >= 0) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 900));
        if (element) element.style.transform = `rotate(${nextAngle}deg)`;
      }
      if (prize.index >= 0) rotation.current = nextAngle;
      pending.current = null;
      prize.reveal();
      setResult(prize.prize);
      if (element?.isConnected) {
        const rect = element.getBoundingClientRect();
        await new Promise<void>((resolve) => window.setTimeout(resolve, 850));
        if (element.isConnected) onBurst(id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return <dialog ref={dialog} className="world-feature prize-wheel" aria-label="Roue des récompenses"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <header><CircleDot /><h2>Roue des récompenses</h2>
      <button type="button" disabled={busy} onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
    <div className="wheel-selection">
      <section className="wheel-card" aria-label="Roue classique">
        <h3>Roue classique</h3>
        <p>{wheel?.tickets ?? 0} {(wheel?.tickets ?? 0) === 1 ? "tour disponible" : "tours disponibles"}</p>
        <WheelDial disc={disc} />
        <button type="button" className="world-feature-claim" disabled={busy || !wheel?.tickets} onClick={() => void spin()}>
          {busy && !result ? "La roue tourne…" : "Tourner la roue"}
        </button>
      </section>
      <section className="wheel-card wheel-card-vip" aria-label="Roue VIP verrouillée">
        <h3><Crown size={18} aria-hidden="true" /> Roue VIP</h3>
        <p>Réservée aux VIP</p>
        <WheelDial vip />
        <button type="button" className="world-feature-claim" disabled>
          <LockKeyhole size={15} aria-hidden="true" /> Roue verrouillée
        </button>
      </section>
    </div>
    {result && <p role="status">Tu as gagné {rewardLabel(result.amount, result.currency)} !</p>}
    {error && <p role="alert">{error}</p>}
  </dialog>;
}
