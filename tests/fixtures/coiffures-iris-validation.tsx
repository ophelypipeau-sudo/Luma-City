import { createRoot } from "react-dom/client";
import { AvatarItemThumbnail, LayeredDoll } from "../../apps/web/src/avatar/LayeredDoll";
import { registerAtelierGarment, type Garment } from "../../apps/web/src/avatar/catalog";
import manifest from "../../docs/coiffures-iris-validation/calques/index.json";

const root = "/docs/coiffures-iris-validation/calques";
const options = new URLSearchParams(location.search);
const selected = options.get("coupe");
const color = options.get("teinte");
const isolate = options.has("fonds");
const clothes = options.has("cerise") ? "fashion.capsule-mode-cerise" : "atelier.prune-fumee-gilet";
const pieces = manifest.pieces.map((piece) => {
  const url = (suffix: string) => `${root}/${piece.id}-${suffix}.png`;
  const garment: Garment = {
    id: `atelier.validation-iris-${piece.id}`, name: piece.name, slot: "hair", coverage: [], colorable: true,
    crop: [120, piece.offsetY ?? 0, 650, 600 - (piece.offsetY ?? 0)],
    art: {
      kind: "image", front: url("front"), back: url("back"), offsetY: piece.offsetY,
      colorMasks: {
        main: url("matiere"), mainBase: piece.base, mainTone: piece.mainTone,
        detailBase: "#808080",
        protected: url("protections"), shading: "material",
      },
    },
  };
  registerAtelierGarment(garment);
  return { ...piece, garment };
});
const visible = selected ? pieces.filter((piece) => piece.id === selected) : pieces;
createRoot(document.getElementById("fixture")!).render(
  <main style={{ maxWidth: selected ? 930 : 1150, margin: "auto", padding: "16px 24px 24px" }}>
    <h1 style={{ margin: "0 0 12px", fontSize: 27, fontFamily: "Georgia, serif" }}>
      {selected ? visible[0]?.name : "Six coiffures pour Iris"}
    </h1>
    <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr" : "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 12 }}>
      {visible.map(({ garment, id, name, style }) => (
        <section key={id} style={{ background: "#413345", borderRadius: 12, overflow: "hidden" }}>
          {isolate ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
              {["#f8f3ed", "#18151e", "#436b9e"].map((background) => (
                <div key={background} className="fond-coiffure" style={{ background, height: 220 }}>
                  <AvatarItemThumbnail piece={garment} color={color ?? undefined} />
                </div>
              ))}
            </div>
          ) : (
            <svg role="img" aria-label={`Iris porte ${name}`} viewBox="58 -35 365 383"
              style={{ display: "block", margin: "auto", width: "100%", height: selected ? "min(79vh,780px)" : "min(36vh,390px)" }}>
              <LayeredDoll layers={{
                top: clothes, bottom: null, shoes: null, hair: garment.id,
                colors: color ? { [garment.id]: color } : undefined,
              }} />
            </svg>
          )}
          <div style={{ padding: "7px 13px 10px" }}>
            <a href={`?coupe=${id}`} style={{ color: "#fff0f4", fontWeight: 650 }}>{name}</a>
            <span style={{ color: "#e5c9dd", marginLeft: 10, fontSize: 13 }}>{style}</span>
            <span style={{ color: "#c2ead5", marginLeft: 10, fontSize: 13 }}>Validée</span>
          </div>
        </section>
      ))}
    </div>
  </main>,
);
