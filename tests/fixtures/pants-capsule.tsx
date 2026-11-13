import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AvatarItemThumbnail,
  LayeredDoll,
} from "../../apps/web/src/avatar/LayeredDoll";
import { PANTS_CAPSULE_GARMENTS } from "../../apps/web/src/avatar/pants-capsule";

function CapsuleReview() {
  const [color, setColor] = useState("");
  const [shoes, setShoes] = useState(true);
  const [garments, setGarments] = useState(false);
  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, margin: "0 0 12px" }}>
        Dix pantalons · Iris de face
      </h1>
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}
      >
        <label>
          Matière{" "}
          <select value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="">Originale</option>
            <option value="#bde8e0">Menthe claire</option>
            <option value="#283148">Encre foncée</option>
            <option value="#c14a81">Rose soutenu</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={shoes}
            onChange={(e) => setShoes(e.target.checked)}
          />{" "}
          Escarpins
        </label>
        <label>
          <input
            type="checkbox"
            checked={garments}
            onChange={(e) => setGarments(e.target.checked)}
          />{" "}
          Pièces isolées
        </label>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))",
          gap: 8,
        }}
      >
        {PANTS_CAPSULE_GARMENTS.map((piece) => (
          <section
            key={piece.id}
            style={{
              textAlign: "center",
              background: "#57445f",
              padding: 8,
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 15, margin: 4 }}>{piece.name}</h2>
            <div
              style={{
                maxWidth: 250,
                margin: "auto",
                height: 305,
                display: "grid",
                placeItems: "center",
              }}
            >
              {garments ? (
                <div style={{ height: 300, width: 155, display: "grid" }}>
                  <AvatarItemThumbnail
                    piece={piece}
                    color={color || undefined}
                  />
                </div>
              ) : (
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 480 1024"
                  role="img"
                  aria-label={`Iris porte ${piece.name}`}
                >
                  <LayeredDoll
                    layers={{
                      top: "fashion.premium-venus",
                      bottom: piece.id,
                      shoes: shoes
                        ? "atelier.prune-fumee-escarpins"
                        : null,
                      colors: color ? { [piece.id]: color } : undefined,
                    }}
                  />
                </svg>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<CapsuleReview />);
