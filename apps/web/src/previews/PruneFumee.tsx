import { useState } from "react";
import { createRoot } from "react-dom/client";
import { FASHION_BASE } from "../avatar/base";
import { LayeredDoll } from "../avatar/LayeredDoll";
import { plum, plumLook } from "../avatar/prune-fumee";
import "./prune-fumee.css";

const colors = [
  ["Prune fumée", plum],
  ["Pétrole", "#28585a"],
  ["Sable", "#b39a80"],
  ["Noir", "#18151a"],
] as const;

const fittings = [
  { label: "Tailleur complet", bottom: plumLook.bottom, shoes: plumLook.shoes },
  { label: "Pantalon seul", bottom: plumLook.bottom, shoes: null },
  { label: "Escarpins jambes nues", bottom: null, shoes: plumLook.shoes },
  {
    label: "Avec un short",
    bottom: "fashion.winter-snow-shorts",
    shoes: plumLook.shoes,
  },
  {
    label: "Avec une jupe",
    bottom: "fashion.winter-pink-skirt",
    shoes: plumLook.shoes,
  },
  {
    label: "Avec une robe",
    bottom: null,
    shoes: plumLook.shoes,
    top: "fashion.winter-ivory-dress",
  },
] as const;

function Preview() {
  const [color, setColor] = useState(plum);
  const [fitting, setFitting] = useState<(typeof fittings)[number]>(
    fittings[0],
  );
  const layers = {
    ...plumLook,
    top: "top" in fitting ? fitting.top : plumLook.top,
    bottom: fitting.bottom,
    shoes: fitting.shoes,
    colors: { [plumLook.top!]: color, [plumLook.bottom!]: color },
  };
  return (
    <main className="look">
      <div className="look-figure">
        <svg
          viewBox="0 0 480 1024"
          role="img"
          aria-label={`Iris · ${fitting.label}`}
        >
          <LayeredDoll layers={layers} bodyBase={FASHION_BASE} />
        </svg>
      </div>
      <section className="look-details">
        <h1>Prune fumée</h1>
        <p>
          Gilet cintré à fermoir doré, pantalon taille haute et escarpins
          espresso.
        </p>
        <fieldset>
          <legend>Essayer le bas de tenue</legend>
          <div className="look-swatches">
            {fittings.map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={fitting === option}
                onClick={() => setFitting(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Couleur du tailleur</legend>
          <div className="look-swatches">
            {colors.map(([name, hex]) => (
              <button
                key={hex}
                type="button"
                aria-pressed={color === hex}
                onClick={() => setColor(hex)}
              >
                <span style={{ background: hex }} />
                {name}
              </button>
            ))}
            <label>
              Couleur libre{" "}
              <input
                type="color"
                aria-label="Couleur libre"
                value={color}
                onInput={(event) => setColor(event.currentTarget.value)}
              />
            </label>
          </div>
        </fieldset>
        <div className="look-closeup">
          <svg
            viewBox={
              fitting === fittings[0] ? "143 179 194 318" : "112 876 256 148"
            }
            role="img"
            aria-label={
              fitting === fittings[0]
                ? "Gros plan sur le tailleur"
                : "Gros plan sur les pieds et les ourlets"
            }
          >
            <LayeredDoll layers={layers} bodyBase={FASHION_BASE} />
          </svg>
        </div>
        <a href="/">Retour au quartier</a>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Preview />);
