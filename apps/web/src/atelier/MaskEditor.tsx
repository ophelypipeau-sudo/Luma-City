import { useEffect, useRef, useState } from "react";
function image(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}
function canvas() {
  const c = document.createElement("canvas");
  c.width = 887;
  c.height = 1774;
  return c;
}
export function MaskEditor({
  front,
  main,
  detail,
  onSave,
  onDirty,
  disabled = false,
}: {
  front: string;
  main?: string;
  detail?: string;
  onSave: (main: string, detail: string) => Promise<void>;
  onDirty: (dirty: boolean) => void;
  disabled?: boolean;
}) {
  const display = useRef<HTMLCanvasElement>(null),
    one = useRef<HTMLCanvasElement>(null),
    two = useRef<HTMLCanvasElement>(null),
    photo = useRef<HTMLImageElement>(null),
    last = useRef<[number, number] | null>(null),
    history = useRef<[string, string][]>([]);
  const [tool, setTool] = useState<"main" | "detail" | "protect">("main"),
    [radius, setRadius] = useState(14),
    [ready, setReady] = useState(false),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function redraw() {
    const d = display.current;
    if (!d || !photo.current || !one.current || !two.current) return;
    const ctx = d.getContext("2d")!;
    ctx.clearRect(0, 0, 887, 700);
    ctx.drawImage(photo.current, 0, 280, 887, 700, 0, 0, 887, 700);
    const overlay = document.createElement("canvas");
    overlay.width = 887;
    overlay.height = 700;
    const c = overlay.getContext("2d")!;
    if (tool !== "protect") {
      c.drawImage(
        tool === "main" ? one.current : two.current,
        0,
        280,
        887,
        700,
        0,
        0,
        887,
        700,
      );
      c.globalCompositeOperation = "source-in";
      c.fillStyle = tool === "main" ? "#20cde3" : "#ff9f48";
      c.fillRect(0, 0, 887, 700);
      ctx.globalAlpha = 0.4;
      ctx.drawImage(overlay, 0, 0);
      ctx.globalAlpha = 1;
    }
  }
  useEffect(() => {
    let alive = true;
    setReady(false);
    Promise.all([
      image(front),
      main ? image(main) : undefined,
      detail ? image(detail) : undefined,
    ])
      .then(([p, m, d]) => {
        if (!alive) return;
        photo.current = p;
        one.current = canvas();
        two.current = canvas();
        if (m) one.current.getContext("2d")!.drawImage(m, 0, 0, 887, 1774);
        if (d) two.current.getContext("2d")!.drawImage(d, 0, 0, 887, 1774);
        history.current = [];
        setDirty(false);
        onDirty(false);
        setReady(true);
        redraw();
      })
      .catch(() => setError("Impossible de charger les masques."));
    return () => {
      alive = false;
    };
  }, [front, main, detail]);
  useEffect(() => {
    redraw();
  }, [tool, ready]);
  function point(
    event: React.PointerEvent<HTMLCanvasElement>,
  ): [number, number] {
    const b = event.currentTarget.getBoundingClientRect();
    return [
      ((event.clientX - b.left) / b.width) * 887,
      280 + ((event.clientY - b.top) / b.height) * 700,
    ];
  }
  function stroke(p: [number, number]) {
    if (!one.current || !two.current) return;
    for (const [which, c] of [
      ["main", one.current],
      ["detail", two.current],
    ] as const) {
      const ctx = c.getContext("2d")!;
      ctx.globalCompositeOperation =
        tool === which ? "source-over" : "destination-out";
      ctx.strokeStyle = "#ffffff";
      ctx.fillStyle = "#ffffff";
      ctx.lineWidth = radius * 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(...(last.current ?? p));
      ctx.lineTo(...p);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(...p, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
    last.current = p;
    setDirty(true);
    onDirty(true);
    redraw();
  }
  async function undo() {
    const old = history.current.pop();
    if (!old) return;
    setBusy(true);
    try {
      const [m, d] = await Promise.all(old.map(image));
      for (const [c, img] of [
        [one.current!, m],
        [two.current!, d],
      ] as const) {
        const ctx = c.getContext("2d")!;
        ctx.clearRect(0, 0, 887, 1774);
        ctx.drawImage(img, 0, 0);
      }
      setDirty(true);
      onDirty(true);
      redraw();
    } catch {
      setError("Impossible de rétablir ce trait.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="atelier-mask-editor">
      <h3>Zones de couleur</h3>
      <p>
        Peins les matières à recolorer. « Protéger » conserve les coutures ou
        les imprimés tels quels. Les zones proposées restent à vérifier.
      </p>
      <div className="atelier-tools">
        {(["main", "detail", "protect"] as const).map((t) => (
          <button
            key={t}
            disabled={!ready || busy || disabled}
            aria-pressed={tool === t}
            onClick={() => setTool(t)}
          >
            {t === "main"
              ? "Couleur 1"
              : t === "detail"
                ? "Couleur 2"
                : "Protéger"}
          </button>
        ))}
        <label>
          Pinceau
          <input
            type="range"
            min="3"
            max="55"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </label>
      </div>
      <canvas
        ref={display}
        width={887}
        height={700}
        aria-label="Peindre les zones recolorables du vêtement"
        onPointerDown={(e) => {
          if (!ready || busy || disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          history.current.push([
            one.current!.toDataURL(),
            two.current!.toDataURL(),
          ]);
          if (history.current.length > 8) history.current.shift();
          last.current = point(e);
          stroke(last.current);
        }}
        onPointerMove={(e) => {
          if (last.current) stroke(point(e));
        }}
        onPointerUp={() => {
          last.current = null;
        }}
        onPointerCancel={() => {
          last.current = null;
        }}
      />
      <div className="atelier-tools">
        <button onClick={undo} disabled={!dirty || busy || disabled}>
          Annuler le dernier trait
        </button>
        <button
          disabled={!ready || busy || disabled || !dirty}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await onSave(one.current!.toDataURL(), two.current!.toDataURL());
              setDirty(false);
              onDirty(false);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Enregistrement…" : "Enregistrer les zones"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
