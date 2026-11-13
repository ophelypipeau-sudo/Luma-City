import { useEffect, useRef, useState } from "react";
import { HandOnHipDoll, type HipRigPart } from "../HandOnHipDoll";
import { DEFAULT_LAYERS, type AvatarLayers } from "../model";
import { LEOPARD_LAYERS } from "../leopard";
import { PART_ORDER, createRenderer, snapshotSvg } from "./renderer";
import {
  BONES,
  blendPose,
  sampleMotion,
  solve,
  transform,
  type Motion,
  type Pose,
} from "./skeleton";
import "./rig.css";
const nativeScale = 1774 / 1024,
  offset = (480 - 887 / nativeScale) / 2;
const looks = [
  { name: "Cardigan lilas", layers: DEFAULT_LAYERS },
  {
    name: "Pull bordeaux",
    layers: { ...DEFAULT_LAYERS, top: "fashion.burgundy-fold-sweater" },
  },
  { name: "Léopard et ceinture", layers: LEOPARD_LAYERS },
  {
    name: "Caraco et jupe",
    layers: {
      ...LEOPARD_LAYERS,
      top: "fashion.rose-bow-camisole",
      bottom: "fashion.midnight-pleated-skirt",
    },
  },
];
function Drawing({
  layers,
  part,
  svgRef,
}: {
  layers: AvatarLayers;
  part?: HipRigPart;
  svgRef?: (node: SVGSVGElement | null) => void;
}) {
  return (
    <svg
      ref={svgRef}
      width="887"
      height="1774"
      viewBox="0 0 887 1774"
      role="img"
      aria-label="Mannequin original, main sur la hanche"
    >
      <g transform={`scale(${nativeScale}) translate(${-offset} 0)`}>
        <HandOnHipDoll layers={layers} rigPart={part} />
      </g>
    </svg>
  );
}
export default function RigLab() {
  const [look, setLook] = useState(0),
    [motion, setMotion] = useState<Motion>("still"),
    [bones, setBones] = useState(false),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState("Préparation du dessin…");
  const sources = useRef<Partial<Record<HipRigPart, SVGSVGElement>>>({}),
    canvas = useRef<HTMLCanvasElement>(null),
    overlay = useRef<HTMLCanvasElement>(null);
  const controls = useRef({ motion, bones, paused });
  controls.current = { motion, bones, paused };
  const layers = looks[look].layers;
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false,
      frame = 0,
      dispose = () => {};
    setStatus("Préparation du dessin…");
    Promise.all(
      PART_ORDER.map((part) =>
        snapshotSvg(sources.current[part]!, controller.signal),
      ),
    )
      .then((images) => {
        if (cancelled) return;
        const renderer = createRenderer(canvas.current!, images);
        dispose = renderer.dispose;
        setStatus("Prêt — aperçu sans modification de ta tenue enregistrée.");
        let selected: Motion = "still",
          time = 0,
          previous = performance.now(),
          transition = 0,
          current: Pose = {},
          from: Pose = {};
        const tick = (now: number) => {
          const dt = Math.min((now - previous) / 1000, 0.05);
          previous = now;
          const control = controls.current;
          if (control.motion !== selected) {
            from = current;
            selected = control.motion;
            transition = 0;
          }
          if (!control.paused) {
            time += dt;
            transition = Math.min(1, transition + dt / 0.65);
            current = blendPose(from, sampleMotion(selected, time), transition);
          }
          renderer.draw(current);
          const ctx = overlay.current!.getContext("2d")!;
          ctx.clearRect(0, 0, 887, 1774);
          if (control.bones) {
            const matrices = solve(current);
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#6ffff0";
            ctx.fillStyle = "#fff";
            for (const b of BONES) {
              const p = transform(matrices[b.id], b.pivot);
              if (b.parent) {
                const parent = BONES.find((n) => n.id === b.parent)!;
                const q = transform(matrices[b.parent], parent.pivot);
                ctx.beginPath();
                ctx.moveTo(...q);
                ctx.lineTo(...p);
                ctx.stroke();
              }
              ctx.beginPath();
              ctx.arc(...p, 8, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      })
      .catch((error) => {
        if (!cancelled) setStatus(String(error.message ?? error));
      });
    return () => {
      cancelled = true;
      controller.abort();
      cancelAnimationFrame(frame);
      dispose();
    };
  }, [layers]);
  return (
    <main className="rig-lab">
      <header>
        <div>
          <small>PRÉPARATION DES ANIMATIONS · 2D</small>
          <h1>Le même mannequin, articulé</h1>
          <p>
            Corps et vêtements suivent les mêmes articulations. La cabine du jeu
            reste de face.
          </p>
        </div>
        <a href="/">Revenir au jeu</a>
      </header>
      <nav aria-label="Tenue de contrôle">
        {looks.map((l, i) => (
          <button
            key={l.name}
            aria-pressed={look === i}
            onClick={() => setLook(i)}
          >
            {l.name}
          </button>
        ))}
      </nav>
      <div className="rig-compare">
        <section>
          <h2>Dessin d’origine</h2>
          <Drawing layers={layers} />
        </section>
        <section>
          <h2>Ossature et déformation</h2>
          <div className="rig-canvas">
            <canvas
              ref={canvas}
              width="887"
              height="1774"
              role="img"
              aria-label="Même mannequin animé par son squelette"
            />
            <canvas
              ref={overlay}
              width="887"
              height="1774"
              aria-hidden="true"
            />
          </div>
        </section>
      </div>
      <div className="rig-controls">
        <nav aria-label="Mouvement">
          {(
            [
              ["still", "Pose de repos"],
              ["breathe", "Respiration douce"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              aria-pressed={motion === id}
              onClick={() => setMotion(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <label>
          <input
            type="checkbox"
            checked={bones}
            onChange={(e) => setBones(e.target.checked)}
          />{" "}
          Voir les articulations
        </label>
        <label>
          <input
            type="checkbox"
            checked={paused}
            onChange={(e) => setPaused(e.target.checked)}
          />{" "}
          Pause
        </label>
      </div>
      <p role="status">{status}</p>
      <p className="rig-note">
        Première plage de mouvements : respiration et gestes légers. Les grandes
        poses demanderont des raccords et dessins complémentaires, notamment aux
        épaules et aux hanches.
      </p>
      <div style={{ display: "none" }}>
        {PART_ORDER.map((part) => (
          <Drawing
            key={part}
            layers={layers}
            part={part}
            svgRef={(node) => {
              if (node) sources.current[part] = node;
              else delete sources.current[part];
            }}
          />
        ))}
      </div>
    </main>
  );
}
