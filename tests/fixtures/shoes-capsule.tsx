import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AvatarItemThumbnail, LayeredDoll } from "../../apps/web/src/avatar/LayeredDoll";
import { SHOES_CAPSULE_GARMENTS } from "../../apps/web/src/avatar/shoes-capsule";

function Review() {
  const [dyed, setDyed] = useState(false);
  const [pants, setPants] = useState("fashion.pants-fuseau");
  return <main style={{ padding: 16 }}>
    <h1 style={{ fontSize: 22 }}>Dix chaussures · Iris de face</h1>
    <label><input type="checkbox" checked={dyed} onChange={(e) => setDyed(e.target.checked)} /> Recolorer en lilas</label>{" "}
    <label>Pantalon <select value={pants} onChange={(e) => setPants(e.target.value)}>
      <option value="fashion.pants-fuseau">Fuseau</option><option value="fashion.pants-dalle">Dalle</option><option value="">Aucun</option>
    </select></label>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 8, marginTop: 12 }}>
      {SHOES_CAPSULE_GARMENTS.map((piece) => <section key={piece.id} style={{ textAlign: "center", background: "#564361", padding: 8, borderRadius: 8 }}>
        <h2 style={{ fontSize: 15, margin: 4 }}>{piece.name}</h2>
        <svg width="100%" height="245" viewBox="0 0 480 1024" role="img" aria-label={`Iris porte ${piece.name}`}>
          <LayeredDoll layers={{ top: "fashion.premium-venus", bottom: pants || null, shoes: piece.id, colors: dyed ? { [piece.id]: "#aa8ed4" } : undefined }} />
        </svg>
        <AvatarItemThumbnail piece={piece} color={dyed ? "#aa8ed4" : undefined} />
      </section>)}
    </div>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Review />);
