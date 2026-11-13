import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Coins, Gem, Sparkles, Star, Ticket, X } from "lucide-react";
import type { ScratchTicket } from "../../../packages/contracts/src/index";

const width = 360, height = 105;
const prizeLabels = { coins: "pièces", diamonds: "diamant", xp: "XP" };
const prizeIcons = { coins: Coins, diamonds: Gem, xp: Star };

export function DailyScratch({ load, reveal, claim }: {
  load: () => Promise<{ ticket: ScratchTicket | null }>;
  reveal: () => Promise<{ ticket: ScratchTicket }>;
  claim: (id: string) => Promise<void>;
}) {
  const [ticket, setTicket] = useState<ScratchTicket | null>();
  const [showPrize, setShowPrize] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const foil = useRef<HTMLCanvasElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const operation = useRef(false);
  const previous = useRef<{ x: number; y: number } | null>(null);
  const available = ticket === null;

  async function refresh() {
    try {
      const { ticket } = await load();
      setTicket(ticket);
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (!operation.current && !dialog.current?.open && !previous.current) void refresh();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!available) return;
    const ctx = foil.current?.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#bbaabc");
    gradient.addColorStop(.52, "#f9e8eb");
    gradient.addColorStop(1, "#b294af");
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#ffffff32";
    ctx.lineWidth = 1;
    for (let x = -height; x < width; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }
    ctx.fillStyle = "#503454";
    ctx.font = "700 21px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Gratte ici", width / 2, height / 2 + 7);
  }, [available]);

  useEffect(() => {
    if (showPrize && !dialog.current?.open) dialog.current?.showModal();
  }, [showPrize]);

  async function run(action: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    try { await action(); }
    catch (cause) { setError((cause as Error).message); }
    finally { operation.current = false; setBusy(false); }
  }
  function revealPrize() {
    void run(async () => {
      const result = await reveal();
      setTicket(result.ticket);
      setShowPrize(!result.ticket.claimed);
    });
  }
  function scratch(event: PointerEvent<HTMLCanvasElement>) {
    if (operation.current) return;
    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const point = { x: (event.clientX - rect.left) * width / rect.width,
      y: (event.clientY - rect.top) * height / rect.height };
    const start = previous.current ?? point;
    previous.current = point;
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 33;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(point.x + .01, point.y);
    ctx.stroke();
    const pixels = ctx.getImageData(0, 0, width, height).data;
    let cleared = 0;
    for (let i = 3; i < pixels.length; i += 32) if (pixels[i] < 64) cleared++;
    if (cleared >= width * height * .55 / 8) {
      previous.current = null;
      revealPrize();
    }
  }
  function collect() {
    if (!ticket) return;
    void run(async () => {
      await claim(ticket.id);
      setTicket({ ...ticket, claimed: true });
      dialog.current?.close();
    });
  }
  const PrizeIcon = ticket ? prizeIcons[ticket.currency] : Sparkles;
  const prize = ticket ? `+${ticket.amount} ${prizeLabels[ticket.currency]}` : "";
  return <section className="daily-ticket" aria-labelledby="daily-ticket-title">
    <div>
      <h2 id="daily-ticket-title"><Ticket aria-hidden="true" /> Ticket à gratter</h2>
      <p>Un ticket gratuit par jour.</p>
    </div>
    {available ? <div className="daily-ticket-scratch">
      <div aria-hidden="true" className="daily-ticket-foil">
        <Sparkles size={29} />
        <canvas ref={foil} width={width} height={height}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            scratch(event);
          }}
          onPointerMove={(event) => { if (previous.current) scratch(event); }}
          onLostPointerCapture={() => { previous.current = null; }} />
      </div>
      <button className="daily-ticket-keyboard" type="button" disabled={busy} onClick={revealPrize}>Révéler le ticket</button>
    </div> : ticket ? (
      <div className="daily-ticket-result">
        <strong>{prize}</strong>
        {ticket.claimed ? <span>Prochain ticket à minuit, heure de Paris.</span>
          : <button type="button" onClick={() => setShowPrize(true)}>Voir mon prix</button>}
      </div>
    ) : !error && <p role="status">Vérification du ticket…</p>}
    {busy && !showPrize && <p role="status">Révélation du gain…</p>}
    {error && !showPrize && <p role="alert">{error} <button type="button" onClick={available ? revealPrize : refresh}>Réessayer</button></p>}
    {showPrize && ticket && <dialog ref={dialog} className="daily-prize" aria-labelledby="daily-prize-title"
      onClose={() => setShowPrize(false)} onCancel={(event) => { if (busy) event.preventDefault(); }}>
      <button type="button" className="daily-prize-close" aria-label="Fermer" disabled={busy} onClick={() => dialog.current?.close()}><X size={18} /></button>
      <PrizeIcon size={35} aria-hidden="true" />
      <h2 id="daily-prize-title">{prize}</h2>
      <button type="button" disabled={busy} onClick={collect}>Réclamer mon prix</button>
      {error && <p role="alert">{error}</p>}
    </dialog>}
  </section>;
}
