import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, CircleDot, Puzzle, RotateCw, Trophy } from "lucide-react";
import {
  PUZZLE_LEVELS, puzzleFits, puzzleGeometry, puzzleOrder, puzzlePhotoUrl, puzzleSlot,
  type PuzzleDrop, type PuzzleLevel, type PuzzleRound,
} from "../../../packages/domain/src/puzzle";
import "./puzzle.css";

type PuzzleCommands = {
  resume: { body: Record<string, never>; result: { round: PuzzleRound | null } };
  start: { body: { level: PuzzleLevel }; result: { round: PuzzleRound } };
  place: { body: { id: string } & PuzzleDrop; result: { round: PuzzleRound } };
  close: { body: { id: string }; result: { closed: boolean } };
};

export type PuzzleRequest = <Action extends keyof PuzzleCommands>(
  action: Action, body: PuzzleCommands[Action]["body"],
) => Promise<PuzzleCommands[Action]["result"]>;

const turnsLabel = (count: number) => `${count} tour${count === 1 ? "" : "s"} de roue`;
type Geometry = ReturnType<typeof puzzleGeometry>;
type Piece = Geometry["pieces"][number];

function PieceImage({ piece, geometry, photo, width, height }: {
  piece: Piece; geometry: Geometry; photo: string; width: number; height: number;
}) {
  const id = useId();
  const { padding } = geometry;
  return <svg aria-hidden="true" className="puzzle-cutout"
    viewBox={`${piece.left - padding} ${piece.top - padding} ${geometry.width + padding * 2} ${geometry.height + padding * 2}`}>
    <defs><clipPath id={id}><path d={piece.path} /></clipPath></defs>
    <image href={photo} width={width} height={height} clipPath={`url(#${id})`} />
    <path d={piece.path} className="puzzle-piece-edge" />
  </svg>;
}

type Drag = { token: string; pointer: number; x: number; y: number; moved: boolean };

function PuzzleTable({ round, busy, place }: {
  round: PuzzleRound; busy: boolean; place: (drop: PuzzleDrop) => void;
}) {
  const { config, tokens, placed, reward } = round;
  const { photo } = config;
  const photoUrl = puzzlePhotoUrl(photo);
  const geometry = useMemo(() => puzzleGeometry(config), [config]);
  const order = useMemo(() => puzzleOrder(config), [config]);
  const placedSlots = new Set(placed);
  const boardId = useId();
  const board = useRef<HTMLDivElement>(null);
  const tray = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const draggedPiece = dragged ? geometry.pieces[order[tokens.indexOf(dragged)]] : null;
  const { width, height } = photo;

  function drop(token: string, x: number, y: number) {
    const slot = order[tokens.indexOf(token)];
    if (!puzzleFits(config, slot, { x, y })) {
      setHint("Cette pièce ne s’emboîte pas ici. Réessaie.");
      return;
    }
    setSelected(null);
    setHint("");
    place({ token, x, y });
  }

  function select(token: string) {
    setSelected((current) => current === token ? null : token);
    setHint("");
  }

  function pointerDown(event: PointerEvent<HTMLButtonElement>, token: string) {
    if (busy || drag.current || event.button !== 0 || !event.isPrimary) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { token, pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  }

  function positionPreview(element: HTMLDivElement, x: number, y: number) {
    const scale = (board.current?.clientWidth ?? 0) / width;
    element.style.width = `${(geometry.width + geometry.padding * 2) * scale}px`;
    element.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const source = drag.current;
    if (!source || source.pointer !== event.pointerId) return;
    if (!source.moved && Math.hypot(event.clientX - source.x, event.clientY - source.y) < 6) return;
    if (!source.moved) {
      source.moved = true;
      setSelected(null);
      setHint("");
      setDragged(source.token);
    }
    source.x = event.clientX;
    source.y = event.clientY;
    if (preview.current) positionPreview(preview.current, source.x, source.y);
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>, canceled = false) {
    const source = drag.current;
    if (!source || source.pointer !== event.pointerId) return;
    drag.current = null;
    setDragged(null);
    if (canceled || busy) return;
    if (!source.moved) {
      select(source.token);
      return;
    }
    const rect = board.current?.getBoundingClientRect();
    if (rect) drop(source.token, (event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
  }

  return <div className="puzzle-table" data-won={reward > 0}>
    <div className="puzzle-board-frame" style={{ "--photo-ratio": width / height } as CSSProperties}>
      <div className="puzzle-board" ref={board} style={{ aspectRatio: `${width} / ${height}` }}>
        {reward ? <img src={photoUrl} alt={photo.name} className="puzzle-completed-image" /> :
          <svg viewBox={`0 0 ${width} ${height}`} aria-label="Plateau de puzzle" role="img">
            <defs>{geometry.pieces.filter(({ slot }) => placedSlots.has(slot)).map(({ slot, path }) =>
              <clipPath key={slot} id={`${boardId}-${slot}`}><path d={path} /></clipPath>)}</defs>
            {geometry.pieces.filter(({ slot }) => placedSlots.has(slot)).map(({ slot }) =>
              <image key={slot} href={photoUrl} width={width} height={height} clipPath={`url(#${boardId}-${slot})`} />)}
            {geometry.pieces.map(({ path, slot }) => <path className="puzzle-slot" key={slot} d={path}
              data-placed={placedSlots.has(slot)} />)}
          </svg>}
        {!reward && selected && geometry.pieces.filter(({ slot }) => !placedSlots.has(slot)).map(({ slot, left, top }) => {
          const point = puzzleSlot(config, slot);
          return <button key={slot} type="button" className="puzzle-slot-button" disabled={busy}
            aria-label={`Emplacement ${slot + 1}`} style={{
              left: `${100 * left / width}%`, top: `${100 * top / height}%`,
              width: `${100 * geometry.width / width}%`, height: `${100 * geometry.height / height}%`,
            }}
            onClick={() => drop(selected, point.x, point.y)} />;
        })}
      </div>
    </div>
    {!reward && <div className="puzzle-tray" aria-label="Pièces disponibles">
      <div className="puzzle-tray-heading">
        <h3>Pièces à placer</h3>
        <div>
          <button type="button" aria-label="Pièces précédentes" onClick={() =>
            tray.current?.scrollBy({ left: -(tray.current.clientWidth * .75) })}><ChevronLeft size={19} /></button>
          <button type="button" aria-label="Pièces suivantes" onClick={() =>
            tray.current?.scrollBy({ left: tray.current.clientWidth * .75 })}><ChevronRight size={19} /></button>
        </div>
      </div>
      <div className="puzzle-tray-pieces" ref={tray}>
        {order.map((slot, index) => {
          if (placedSlots.has(slot)) return null;
          const token = tokens[index];
          return <button type="button" className="puzzle-piece" key={token}
            aria-label={`Pièce ${index + 1}`} aria-pressed={selected === token} disabled={busy}
            data-dragged={dragged === token}
            onPointerDown={(event) => pointerDown(event, token)} onPointerMove={pointerMove}
            onPointerUp={endDrag} onPointerCancel={(event) => endDrag(event, true)}
            onLostPointerCapture={(event) => endDrag(event, true)}
            onClick={(event) => {
              if (event.detail !== 0) return;
              select(token);
              requestAnimationFrame(() => board.current?.querySelector("button")?.focus());
            }}>
            <PieceImage piece={geometry.pieces[slot]} geometry={geometry} photo={photoUrl} width={width} height={height} />
          </button>;
        })}
      </div>
      <p className="puzzle-hint" role="status">
        {hint || (selected ? "Choisis un emplacement du plateau." : "Glisse une pièce ou sélectionne-la puis choisis son emplacement.")}
      </p>
    </div>}
    {draggedPiece && createPortal(<div className="puzzle-drag" ref={(element) => {
      preview.current = element;
      if (element && drag.current) positionPreview(element, drag.current.x, drag.current.y);
    }}>
      <PieceImage piece={draggedPiece} geometry={geometry} photo={photoUrl} width={width} height={height} />
    </div>, document.body)}
  </div>;
}

export function PuzzleGame({ request, onGames, onWheel }: {
  request: PuzzleRequest; onGames: () => void; onWheel: () => void;
}) {
  const [round, setRound] = useState<PuzzleRound | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const pending = useRef(false);
  useEffect(() => {
    let current = true;
    setBusy(true);
    setError("");
    void request("resume", {}).then(({ round }) => {
      if (!current) return;
      setRound(round);
      setLoaded(true);
    }).catch((cause: Error) => {
      if (current) setError(cause.message);
    }).finally(() => {
      if (current) setBusy(false);
    });
    return () => { current = false; };
  }, [request, loadAttempt]);

  async function action(work: () => Promise<void>) {
    if (pending.current || busy) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const start = (level: PuzzleLevel) => action(async () => {
    setRound((await request("start", { level })).round);
  });

  const close = (id: string, goToGames: boolean) => action(async () => {
    await request("close", { id });
    setRound(null);
    if (goToGames) onGames();
  });

  const level = round && PUZZLE_LEVELS[round.config.level];
  return <section className="puzzle-game" aria-labelledby="puzzle-title">
    <div className="puzzle-heading">
      <h2 id="puzzle-title"><Puzzle aria-hidden="true" /> Puzzle</h2>
      {round && !round.reward && <button type="button" disabled={busy} onClick={() => void close(round.id, true)}>Quitter la partie</button>}
    </div>
    {!loaded && (error ? <button type="button" onClick={() => setLoadAttempt((count) => count + 1)}>Réessayer</button>
      : <p role="status">Chargement du puzzle…</p>)}
    {loaded && !round && <div className="puzzle-menu">
      <p>Choisis ta difficulté et reconstitue une photo surprise pour gagner des tours de roue.</p>
      <div className="puzzle-levels">
        {(Object.keys(PUZZLE_LEVELS) as PuzzleLevel[]).map((key) => {
          const { label, count, turns } = PUZZLE_LEVELS[key];
          return <article key={key} className={`puzzle-level puzzle-level-${key}`}>
            <h3>{label}</h3>
            <p>{count} pièces</p>
            <span><CircleDot size={16} aria-hidden="true" /> {turnsLabel(turns)}</span>
            <button type="button" disabled={busy} onClick={() => void start(key)} aria-label={`Commencer en mode ${label.toLowerCase()}`}>
              Commencer
            </button>
          </article>;
        })}
      </div>
    </div>}
    {round && level && <>
      <div className="puzzle-score">
        <strong>{level.label}</strong>
        <span aria-live="polite">{round.placed.length} / {level.count} pièces</span>
        <span><CircleDot size={16} aria-hidden="true" /> {turnsLabel(level.turns)}</span>
        <progress max={level.count} value={round.placed.length} aria-label="Pièces placées" />
      </div>
      <PuzzleTable key={round.id} round={round} busy={busy} place={(drop) =>
        void action(async () => {
          const { round: saved } = await request("place", { id: round.id, ...drop });
          setRound({ ...round, placed: saved.placed, reward: saved.reward });
        })} />
      {round.reward > 0 && <div className="puzzle-victory">
        <div role="status">
          <Trophy aria-hidden="true" />
          <div><strong>Puzzle terminé !</strong><span>+{turnsLabel(round.reward)} crédité{round.reward > 1 ? "s" : ""}</span></div>
        </div>
        <div className="puzzle-victory-actions" onPointerUp={(event) => {
          if (event.pointerType !== "touch") return;
          const button = (event.target as HTMLElement).closest("button");
          const hit = document.elementFromPoint(event.clientX, event.clientY);
          // A touch can release immediately after the last piece was removed.
          // Activate the button even when the browser suppresses the follow-up click.
          if (hit && button?.contains(hit)) button.click();
        }}>
          <button type="button" disabled={busy} onClick={() => void start(round.config.level)}><RotateCw size={16} /> Rejouer</button>
          <button type="button" disabled={busy} onClick={() => void close(round.id, false)}>Changer de difficulté</button>
          <button type="button" disabled={busy} onClick={onWheel}>Ouvrir la roue</button>
          <button type="button" disabled={busy} onClick={() => void close(round.id, true)}>Retour aux jeux</button>
        </div>
      </div>}
    </>}
    {error && <p className="puzzle-error" role="alert">{error}</p>}
  </section>;
}
