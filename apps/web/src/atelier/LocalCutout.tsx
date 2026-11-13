import { useEffect, useRef, useState } from "react";
import {
  borderSeeds,
  clearConnected,
} from "../../../../packages/domain/src/local-cutout";

type Point = [number, number];
type Tool = "background" | "erase" | "restore" | "outline";
export function LocalCutout({
  source,
  initial,
  disabled,
  onDirty,
  onSave,
}: {
  source: string;
  initial?: string;
  disabled: boolean;
  onDirty: (dirty: boolean) => void;
  onSave: (png: string, registered: boolean) => Promise<boolean>;
}) {
  const view = useRef<HTMLCanvasElement>(null);
  const pixels = useRef<HTMLCanvasElement>(null);
  const original = useRef<HTMLCanvasElement>(null);
  const history = useRef<ImageData[]>([]);
  const last = useRef<Point | null>(null);
  const points = useRef<Point[]>([]);
  const [tool, setTool] = useState<Tool>("background");
  const [tolerance, setTolerance] = useState(28);
  const [radius, setRadius] = useState(15);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState(0);
  const [vertices, setVertices] = useState(0);
  const [usePrepared, setUsePrepared] = useState(!!initial);
  const [fullCanvas, setFullCanvas] = useState(!!initial);
  const locked = disabled || saving || !ready;
  useEffect(() => {
    setUsePrepared(!!initial);
  }, [initial]);
  function changed() {
    setDirty(true);
    onDirty(true);
  }
  function draw() {
    const v = view.current,
      p = pixels.current;
    if (!v || !p) return;
    const c = v.getContext("2d")!;
    c.clearRect(0, 0, v.width, v.height);
    c.drawImage(p, 0, 0);
    if (points.current.length) {
      c.beginPath();
      points.current.forEach(([x, y], i) =>
        i ? c.lineTo(x, y) : c.moveTo(x, y),
      );
      c.strokeStyle = "#00e5ff";
      c.lineWidth = Math.max(2, v.width / 200);
      c.stroke();
      for (const [x, y] of points.current) {
        c.beginPath();
        c.arc(x, y, v.width / 150, 0, Math.PI * 2);
        c.fillStyle = "#00e5ff";
        c.fill();
      }
    }
  }
  function checkpoint() {
    const p = pixels.current!;
    history.current.push(
      p.getContext("2d")!.getImageData(0, 0, p.width, p.height),
    );
    if (history.current.length > 8) history.current.shift();
    setSteps(history.current.length);
  }
  useEffect(() => {
    let alive = true;
    setReady(false);
    setError("");
    const image = new Image();
    image.onload = () => {
      if (!alive || !view.current) return;
      const factor = usePrepared
        ? 1
        : Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
      const p = document.createElement("canvas");
      p.width = Math.max(1, Math.round(image.naturalWidth * factor));
      p.height = Math.max(1, Math.round(image.naturalHeight * factor));
      p.getContext("2d")!.drawImage(image, 0, 0, p.width, p.height);
      pixels.current = p;
      const o = document.createElement("canvas");
      o.width = p.width;
      o.height = p.height;
      o.getContext("2d")!.drawImage(p, 0, 0);
      original.current = o;
      view.current.width = p.width;
      view.current.height = p.height;
      history.current = [];
      points.current = [];
      last.current = null;
      setSteps(0);
      setVertices(0);
      setDirty(false);
      onDirty(false);
      setReady(true);
      setFullCanvas(usePrepared);
      draw();
    };
    image.onerror = () => {
      if (alive)
        setError(
          "Impossible de lire cette image. Réessaie avec un PNG, JPEG ou WebP.",
        );
    };
    image.src = usePrepared && initial ? initial : source;
    return () => {
      alive = false;
    };
  }, [source, usePrepared, initial]);
  function location(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const b = e.currentTarget.getBoundingClientRect();
    return [
      Math.max(
        0,
        Math.min(
          e.currentTarget.width - 1,
          ((e.clientX - b.left) / b.width) * e.currentTarget.width,
        ),
      ),
      Math.max(
        0,
        Math.min(
          e.currentTarget.height - 1,
          ((e.clientY - b.top) / b.height) * e.currentTarget.height,
        ),
      ),
    ];
  }
  function clear(seeds: Point[]) {
    const p = pixels.current!,
      c = p.getContext("2d")!,
      data = c.getImageData(0, 0, p.width, p.height);
    checkpoint();
    data.data.set(
      clearConnected(data.data, p.width, p.height, seeds, tolerance),
    );
    c.putImageData(data, 0, 0);
    changed();
    draw();
  }
  function stroke(to: Point) {
    const p = pixels.current!,
      c = p.getContext("2d")!,
      from = last.current ?? to;
    c.save();
    if (tool === "restore") {
      c.beginPath();
      const dx = to[0] - from[0],
        dy = to[1] - from[1],
        count = Math.max(
          1,
          Math.ceil(Math.hypot(dx, dy) / Math.max(1, radius / 2)),
        );
      for (let i = 0; i <= count; i++) {
        const x = from[0] + (dx * i) / count,
          y = from[1] + (dy * i) / count;
        c.moveTo(x + radius, y);
        c.arc(x, y, radius, 0, Math.PI * 2);
      }
      c.clip();
      c.clearRect(0, 0, p.width, p.height);
      c.drawImage(original.current!, 0, 0);
    } else {
      c.globalCompositeOperation = "destination-out";
      c.lineWidth = radius * 2;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(...from);
      c.lineTo(to[0] + 0.01, to[1]);
      c.stroke();
    }
    c.restore();
    last.current = to;
    changed();
    draw();
  }
  return (
    <div className="local-cutout">
      <h3>2. Détourer gratuitement</h3>
      <p>
        Garde une seule pièce, sans peau ni cheveux. Sur une tenue complète,
        trace d’abord son contour. Les détails cachés ne sont pas reconstruits
        automatiquement.
      </p>
      <div className="local-toolbar">
        <button
          disabled={locked}
          onClick={() =>
            clear(borderSeeds(pixels.current!.width, pixels.current!.height))
          }
        >
          Retirer le fond des bords
        </button>
        {(
          [
            ["background", "Fond au clic"],
            ["outline", "Contour de la pièce"],
            ["erase", "Gomme"],
            ["restore", "Restaurer au pinceau"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            disabled={locked}
            aria-pressed={tool === id}
            onClick={() => {
              setTool(id);
              points.current = [];
              setVertices(0);
              onDirty(dirty);
              draw();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <label>
        Tolérance du fond{" "}
        <input
          type="range"
          min="0"
          max="100"
          value={tolerance}
          disabled={locked}
          onChange={(e) => setTolerance(+e.target.value)}
        />
        <output>{tolerance}</output>
      </label>
      <label>
        Taille du pinceau{" "}
        <input
          type="range"
          min="2"
          max="80"
          value={radius}
          disabled={locked}
          onChange={(e) => setRadius(+e.target.value)}
        />
        <output>{radius}</output>
      </label>
      <p className="local-hint">
        {tool === "outline"
          ? "Clique autour du vêtement, puis « Garder le contour ». Les pixels extérieurs seront effacés."
          : tool === "background"
            ? "Clique sur une zone de fond pour effacer seulement sa couleur connectée. Une tolérance faible préserve mieux les vêtements clairs."
            : tool === "erase"
              ? "Passe la gomme sur le mannequin, le fond et les éléments à retirer."
              : "Passe le pinceau pour récupérer les pixels de l’image de départ."}
      </p>
      <canvas
        ref={view}
        role="img"
        aria-label="Image à détourer localement"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          if (locked) return;
          const pt = location(e);
          if (tool === "outline") {
            points.current.push(pt);
            setVertices(points.current.length);
            onDirty(true);
            draw();
            return;
          }
          if (tool === "background") {
            clear([pt]);
            return;
          }
          checkpoint();
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = pt;
          stroke(pt);
        }}
        onPointerMove={(e) => {
          if (!locked && last.current) stroke(location(e));
        }}
        onPointerUp={() => {
          last.current = null;
        }}
        onPointerCancel={() => {
          last.current = null;
        }}
      />
      <div className="local-toolbar">
        <button
          disabled={locked || vertices < 3}
          onClick={() => {
            checkpoint();
            const p = pixels.current!,
              c = p.getContext("2d")!;
            const mask = document.createElement("canvas");
            mask.width = p.width;
            mask.height = p.height;
            const m = mask.getContext("2d")!;
            m.beginPath();
            points.current.forEach(([x, y], i) =>
              i ? m.lineTo(x, y) : m.moveTo(x, y),
            );
            m.closePath();
            m.fill();
            c.globalCompositeOperation = "destination-in";
            c.drawImage(mask, 0, 0);
            c.globalCompositeOperation = "source-over";
            points.current = [];
            setVertices(0);
            changed();
            draw();
          }}
        >
          Garder le contour ({vertices} points)
        </button>
        <button
          disabled={locked || !steps}
          onClick={() => {
            const p = pixels.current!;
            p.getContext("2d")!.putImageData(history.current.pop()!, 0, 0);
            setSteps(history.current.length);
            points.current = [];
            setVertices(0);
            changed();
            draw();
          }}
        >
          Annuler la retouche
        </button>
        {initial && (
          <button
            disabled={locked || dirty}
            onClick={() => setUsePrepared(!usePrepared)}
          >
            {usePrepared
              ? "Repartir de la photo source"
              : "Reprendre le calque enregistré"}
          </button>
        )}
      </div>
      <label className="atelier-checkbox">
        <input
          type="checkbox"
          checked={fullCanvas}
          disabled={locked}
          onChange={(e) => setFullCanvas(e.target.checked)}
        />
        Ce calque est déjà aligné sur le mannequin (canevas 1:2)
      </label>
      <button
        className="atelier-primary"
        disabled={locked || vertices > 0}
        onClick={async () => {
          setSaving(true);
          setError("");
          try {
            if (
              await onSave(pixels.current!.toDataURL("image/png"), fullCanvas)
            ) {
              setDirty(false);
              onDirty(false);
            }
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "Placement en cours…" : "Enregistrer et essayer sur Iris"}
      </button>
      {dirty && <small>Retouches non enregistrées.</small>}
      {vertices > 0 && (
        <button
          disabled={locked}
          onClick={() => {
            points.current = [];
            setVertices(0);
            onDirty(dirty);
            draw();
          }}
        >
          Annuler le contour
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      <small>
        Le détourage se fait dans ton navigateur. Le PNG est enregistré
        uniquement sur le serveur local du jeu.
      </small>
    </div>
  );
}
