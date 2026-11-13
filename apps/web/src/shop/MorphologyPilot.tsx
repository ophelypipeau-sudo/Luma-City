import { useState, useRef, useEffect } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { MORPHOLOGIES } from "../cartoon/model";
import { changeMorphology } from "../cartoon/appearance";
import {
  createPilotAppearance,
  isPilotEquipped,
  togglePilotPiece,
  PILOT_PIECES,
  type PilotSlot,
} from "../cartoon/pilot";
import { BARE_OUTFIT } from "./catalog";
import { FittingAvatar, GarmentThumbnail } from "./FittingAvatar";
import "./morphology-pilot.css";

const names: Record<PilotSlot, string> = {
  tops: "Caraco lumière",
  bottoms: "Denim plissé",
  shoes: "Bottes givrées",
};
export function MorphologyPilot({ onClose }: { onClose: () => void }) {
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    back.current?.focus();
  }, []);
  const [appearance, setAppearance] = useState(createPilotAppearance),
    [base, setBase] = useState(false);
  const morphology =
    appearance.body.kind === "morphology" ? appearance.body.morphologyId : "X";
  const label = MORPHOLOGIES.find((m) => m.id === morphology)!.name;
  const shown = base
    ? {
        ...appearance,
        equipped: {
          tops: null,
          bottoms: null,
          shoes: null,
          hair: null,
          accessories: [],
        },
      }
    : appearance;
  return (
    <section
      className="fashion-shop morphology-pilot"
      aria-label="Tenue pilote des six morphologies"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <header className="pilot-header">
        <button ref={back} className="ghost" onClick={onClose}>
          <ArrowLeft size={18} />
          Retour à la boutique
        </button>
        <div>
          <span className="eyebrow">TON CORPS, TON STYLE</span>
          <h2>Une tenue à ta mesure</h2>
        </div>
      </header>
      <div className="pilot-body">
        <div className="pilot-controls">
          <fieldset className="pilot-morphologies">
            <legend>Ta morphologie</legend>
            {MORPHOLOGIES.map((m) => (
              <button
                key={m.id}
                aria-label={
                  m.id === "8" ? "Morphologie en 8" : `Morphologie ${m.name}`
                }
                aria-pressed={morphology === m.id}
                onClick={() => {
                  setAppearance((old) => changeMorphology(old, m.id));
                  setBase(false);
                }}
              >
                <strong>{m.id}</strong>
                <span>
                  {m.name
                    .replace(/ \([A-Z]\)/, "")
                    .replace("Morphologie en 8", "Forme en 8")}
                </span>
              </button>
            ))}
          </fieldset>
          <div className="pilot-pieces" aria-label="Pièces de la tenue pilote">
            {(Object.keys(PILOT_PIECES) as PilotSlot[]).map((slot) => (
              <button
                key={slot}
                className={
                  isPilotEquipped(appearance.equipped, slot) ? "selected" : ""
                }
                aria-label={`Essayer ${names[slot]} sur la morphologie ${morphology}`}
                aria-pressed={isPilotEquipped(appearance.equipped, slot)}
                onClick={() => {
                  setAppearance((old) => togglePilotPiece(old, slot));
                  setBase(false);
                }}
              >
                <GarmentThumbnail
                  characterId="iris"
                  category={slot}
                  variant={0}
                  morphology={morphology}
                />
                <span>{names[slot]}</span>
                <small>
                  {isPilotEquipped(appearance.equipped, slot)
                    ? "Porté · retirer"
                    : "Essayer"}
                </small>
              </button>
            ))}
          </div>
          <button
            className="ghost pilot-reset"
            onClick={() => {
              setAppearance((old) => ({
                ...old,
                equipped: { ...PILOT_PIECES, hair: null, accessories: [] },
              }));
              setBase(false);
            }}
          >
            <RotateCcw size={15} />
            Remettre la tenue complète
          </button>
        </div>
        <aside
          className="pilot-reflection"
          aria-label={`Cabine pilote Iris ${label}`}
        >
          <div className="pilot-caption">
            <span className="eyebrow">TON REFLET</span>
            <h3>
              Iris <span>✦</span>
            </h3>
            <p>{label}</p>
          </div>
          <div className="pilot-figure">
            <FittingAvatar
              characterId="iris"
              outfit={BARE_OUTFIT}
              appearance={shown}
            />
          </div>
          <button
            className="ghost"
            aria-pressed={base}
            onClick={() => setBase(!base)}
          >
            {base ? "Revenir à la tenue" : "Voir le corps"}
          </button>
        </aside>
      </div>
    </section>
  );
}
