import { createRoot } from "react-dom/client";
import { LayeredDoll } from "../../apps/web/src/avatar/LayeredDoll";
import { HAIR_CAPSULE_GARMENTS } from "../../apps/web/src/avatar/hair-capsule";

const options = new URLSearchParams(location.search);
const dyed = options.has("palette");
const colors = ["#b95333", options.has("vert") ? "#00ff80" : "#764595", "#c2bac8", "#bb6480", "#285471", "#b7834c"];
createRoot(document.getElementById("fixture")!).render(
  <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(44vw, 290px), 1fr))", gap: 4, maxWidth: 960, margin: "auto" }}>
    {HAIR_CAPSULE_GARMENTS.map((piece, index) => (
      <section key={piece.id} style={{ textAlign: "center" }}>
        <svg role="img" aria-label={`Iris porte ${piece.name}`} viewBox="85 -8 310 330"
          style={{ display: "block", width: "100%", maxHeight: "min(40vh, 330px)" }}>
          <LayeredDoll layers={{
            top: options.has("cerise") ? "fashion.capsule-mode-cerise" : "fashion.premium-seraphine",
            bottom: null,
            shoes: null,
            hair: piece.id,
            colors: dyed ? { [piece.id]: colors[index] } : undefined,
          }} />
        </svg>
        <strong>{piece.name}</strong>
      </section>
    ))}
  </main>,
);
