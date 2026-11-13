import { useState } from "react";
import { createRoot } from "react-dom/client";
import { RegisteredGarmentImage } from "../avatar/RegisteredGarmentImage";
import { DOLL_PATTERN } from "../../../../packages/domain/src/avatar-pattern";
import { CAPSULE_TOP_ROOT, TOP_CAPSULE } from "./top-capsule";
import "@fontsource/outfit/500.css";
import "@fontsource/dm-sans/400.css";
import "./top-capsule.css";

const [width, height] = DOLL_PATTERN.canvas;
const palette = [
  { label: "Couleurs d’origine", color: "" },
  { label: "Perle", color: "#e9ddcf" },
  { label: "Mûre", color: "#702d59" },
  { label: "Pétrole", color: "#295b68" },
  { label: "Encre", color: "#262437" },
] as const;

function TopCapsule() {
  const [color, setColor] = useState<string>("");
  const [detail, setDetail] = useState(false);
  return (
    <main className="capsule">
      <header>
        <div>
          <a href="/">Un petit monde</a>
          <h1>Capsule de hauts</h1>
          <p>Huit propositions sur Iris, dans la même pose.</p>
        </div>
        <div className="controls">
          <fieldset>
            <legend>Essayer une couleur sur les huit hauts</legend>
            <div className="swatches">
              {palette.map(({ label, color: value }) => (
                <button
                  key={label}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={color === value}
                  onClick={() => setColor(value)}
                >
                  <span
                    style={{
                      background:
                        value ||
                        "conic-gradient(#b98b6b,#237b63,#b63f79,#5b87ad,#b98b6b)",
                    }}
                  />
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="detail"
            aria-pressed={detail}
            onClick={() => setDetail(!detail)}
          >
            {detail ? "Vue d’ensemble" : "Voir les détails"}
          </button>
        </div>
      </header>
      <div className="looks">
        {TOP_CAPSULE.map((top) => {
          const asset = CAPSULE_TOP_ROOT + "/" + top.id;
          return (
            <figure
              key={top.id}
              style={{ "--item-color": top.color } as React.CSSProperties}
            >
              <svg
                className="fitting"
                viewBox={detail ? "140 285 607 566" : "78 12 731 1000"}
                role="img"
                aria-label={`${top.name} porté par Iris`}
              >
                <image
                  href="/assets/avatar/leopard-v1/underwear-strapless.png"
                  width={width}
                  height={height}
                />
                <image
                  href="/assets/avatar/prune-fumee-v1/pantalon.png"
                  width={width}
                  height={height}
                />
                <RegisteredGarmentImage
                  pass="front"
                  color={color || undefined}
                  art={{
                    kind: "image",
                    front: asset + ".png",
                    colorMasks: {
                      main: asset + "-mask.png",
                      mainBase: top.color,
                      detailBase: "#808080",
                      shading: "material",
                    },
                  }}
                />
              </svg>
              <figcaption>
                <span>{top.family}</span>
                <h2>{top.name}</h2>
                <p>{top.material}</p>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<TopCapsule />);
