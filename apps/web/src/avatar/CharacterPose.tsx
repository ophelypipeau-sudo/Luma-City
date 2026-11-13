import { useEffect, useRef, useState } from "react";
import {
  PersonStanding,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
} from "lucide-react";
import { Portrait } from "../Avatar";
import { outfitSupportsPose } from "./pose-compatibility";
import type { AvatarLayers } from "./model";
import {
  readStaticPoses,
  STATIC_POSES_KEY,
  type StaticPose,
} from "./static-poses";
const choices = [
  { id: "front", label: "De face" },
  { id: "hand-on-hip", label: "Main sur la hanche" },
  { id: "heart-hands", label: "Mains en cœur" },
] as const;
const PAGE_SIZE = 4;
/** Pose is a character preference, independent from equipment, purchases and fitting. */
export function CharacterPose({
  owner,
  character,
  layers,
}: {
  owner: string;
  character: { id?: string; color?: string; hair?: string; variant?: number };
  layers: AvatarLayers;
}) {
  const [poses, setPoses] = useState(() => {
    try {
      return readStaticPoses(localStorage.getItem(STATIC_POSES_KEY));
    } catch {
      return {};
    }
  });
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const [preview, setPreview] = useState<StaticPose | null>(null);
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(choices.length / PAGE_SIZE);
  const anchor = useRef<HTMLDivElement>(null),
    toggle = useRef<HTMLButtonElement>(null);
  const pose = poses[owner] ?? "heart-hands";
  const hasPoses = (character.id ?? "iris") === "iris";
  const displayedPose = hasPoses
    ? open
      ? (preview ?? pose)
      : pose
    : "front";
  useEffect(() => {
    setOpen(false);
    setError("");
    setPreview(null);
  }, [owner]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!anchor.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function choose(value: StaticPose) {
    const next = { ...poses, [owner]: value };
    try {
      localStorage.setItem(STATIC_POSES_KEY, JSON.stringify(next));
      setPoses(next);
      setError("");
      setOpen(false);
      toggle.current?.focus();
    } catch {
      setError("Impossible d’enregistrer la pose localement. Réessaie.");
    }
  }
  return (
    <>
      {hasPoses && (
        <div
          ref={anchor}
          className="character-pose-control"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              setOpen(false);
              toggle.current?.focus();
            }
          }}
        >
          <button
            ref={toggle}
            className="character-pose-toggle"
            aria-label="Choisir une pose"
            title="Choisir une pose statique"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              if (!open) {
                setPreview(pose);
                setError("");
              }
              setOpen(!open);
            }}
          >
            <PersonStanding size={16} />
            <span>Pose</span>
          </button>
          {open && (
            <section
              className="character-pose-menu"
              role="dialog"
              aria-label="Poses statiques"
            >
              <header>
                <strong>Mes poses</strong>
                <nav aria-label="Pages des poses">
                  <button
                    aria-label="Page de poses précédente"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft size={19} />
                  </button>
                  <button
                    aria-label="Page de poses suivante"
                    disabled={page === pageCount - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight size={19} />
                  </button>
                </nav>
                <button
                  aria-label="Fermer les poses"
                  onClick={() => {
                    setOpen(false);
                    toggle.current?.focus();
                  }}
                >
                  <X size={18} />
                </button>
              </header>
              <div className="character-pose-grid">
                {choices
                  .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
                  .map(({ id, label }) => (
                    <button
                      className="character-pose-card"
                      key={id}
                      aria-label={label}
                      aria-pressed={displayedPose === id}
                      disabled={!outfitSupportsPose(layers, id)}
                      title={
                        !outfitSupportsPose(layers, id)
                          ? "Cette pièce doit être ajustée à cette pose"
                          : undefined
                      }
                      onClick={() => {
                        setPreview(id);
                        setError("");
                      }}
                    >
                      <span className="character-pose-preview">
                        <Portrait
                          {...character}
                          layers={layers}
                          fullBody
                          pose={id}
                        />
                      </span>
                      <span className="character-pose-name">{label}</span>
                    </button>
                  ))}
              </div>
              {!outfitSupportsPose(layers, displayedPose) && (
                <small role="status">
                  Cette tenue attend son ajustement à cette pose. Aperçu de face
                  conservé.
                </small>
              )}
              <footer>
                <span>{choices.length} poses</span>
                <span>
                  {page + 1} / {pageCount}
                </span>
              </footer>
              <div className="character-pose-save">
                <span aria-live="polite">
                  {displayedPose !== pose
                    ? "Aperçu sur ton personnage"
                    : "Pose enregistrée"}
                </span>
                <button onClick={() => choose(displayedPose)}>
                  <Save size={15} /> Enregistrer
                </button>
              </div>
              {error && <small role="status">{error}</small>}
            </section>
          )}
        </div>
      )}
      <Portrait {...character} layers={layers} fullBody pose={displayedPose} />
    </>
  );
}
