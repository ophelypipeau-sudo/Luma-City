import { CITY_CAPSULE_GARMENTS } from "../../apps/web/src/avatar/city-capsule";
import { BOTTOMS_CAPSULE_GARMENTS } from "../../apps/web/src/avatar/bottoms-capsule";
import { PANTS_CAPSULE_GARMENTS } from "../../apps/web/src/avatar/pants-capsule";
import { plumLook } from "../../apps/web/src/avatar/prune-fumee";
import { LayeredFitFixture } from "./LayeredFitFixture";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { FittingAvatar } from "../../apps/web/src/shop/FittingAvatar";
import { ORIGINAL_OUTFIT, BARE_OUTFIT } from "../../apps/web/src/shop/catalog";
import { MorphologyComparison } from "../../apps/web/src/cartoon/MorphologyComparison";
import { PilotFitFixture } from "./PilotFitFixture";
import { IRIS_SHORTS_GARMENTS } from "../../apps/web/src/avatar/iris-shorts";

function Fixture() {
  const [single, setSingle] = useState(true);
  const [comparison, setComparison] = useState(false),
    [guides, setGuides] = useState(false);
  const [pilot, setPilot] = useState(false);
  const [variant, setVariant] = useState(0),
    [bare, setBare] = useState(false),
    [hair, setHair] = useState(true),
    [focus, setFocus] = useState("all");
  if (single) return <LayeredFitFixture onClose={() => setSingle(false)} />;
  if (pilot) return <PilotFitFixture onClose={() => setPilot(false)} />;
  if (comparison)
    return (
      <main style={{ padding: 12, fontFamily: "sans-serif" }}>
        <button onClick={() => setComparison(false)}>
          Retour au contrôle v6 existant
        </button>{" "}
        <label>
          <input
            type="checkbox"
            checked={guides}
            onChange={(e) => setGuides(e.target.checked)}
          />
          Afficher les repères
        </label>
        <MorphologyComparison guides={guides} />
      </main>
    );
  return (
    <main style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h1>Contrôles historiques v6</h1>
      <button onClick={() => setSingle(true)}>Contrôler la base unique</button>
      <button onClick={() => setPilot(true)}>
        Contrôler la tenue pilote sur les six corps
      </button>{" "}
      <button onClick={() => setComparison(true)}>
        Archive des contours v1 refusés
      </button>{" "}
      <label>
        Personnage{" "}
        <select
          aria-label="Personnage"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
        >
          <option value="all">Tous</option>
          {["iris", "milo", "june", "noa"].map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <label>
        Collection{" "}
        <select
          aria-label="Collection"
          value={variant}
          onChange={(e) => setVariant(Number(e.target.value))}
        >
          <option value="0">Départ</option>
          <option value="1">Lilas</option>
          <option value="2">Rosé</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={bare}
          onChange={(e) => setBare(e.target.checked)}
        />
        Sous-vêtements
      </label>
      <label>
        <input
          type="checkbox"
          checked={hair}
          onChange={(e) => setHair(e.target.checked)}
        />
        Perruques
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: focus === "all" ? "repeat(4,1fr)" : "350px",
          gap: 8,
        }}
      >
        {["iris", "milo", "june", "noa"]
          .filter((id) => focus === "all" || id === focus)
          .map((id) => (
            <section key={id}>
              <h2>{id}</h2>
              <div style={{ height: focus === "all" ? 510 : 630 }}>
                <FittingAvatar
                  characterId={id}
                  outfit={{
                    ...(bare ? BARE_OUTFIT : ORIGINAL_OUTFIT),
                    ...(!bare
                      ? { tops: variant, bottoms: variant, shoes: variant }
                      : {}),
                    hair: hair ? 0 : -1,
                  }}
                />
              </div>
            </section>
          ))}
      </div>
      <style>{`.fitting-avatar{width:100%;height:100%}`}</style>
    </main>
  );
}
function BottomsFit({ group, dye, tucked, velvet }: { group: string; dye?: string; tucked: boolean; velvet: boolean }) {
  const pieces = group === "shorts-iris" ? IRIS_SHORTS_GARMENTS : group === "pants"
    ? PANTS_CAPSULE_GARMENTS
    : (group.startsWith("ville-") ? CITY_CAPSULE_GARMENTS : BOTTOMS_CAPSULE_GARMENTS).filter(piece => piece.id.startsWith(group.startsWith("ville-") ? "fashion." + group : "fashion.capsule-" + group));
  return (
    <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8, padding: 8, fontFamily: "sans-serif" }}>
      {pieces.map((piece, index) => (
        <section key={piece.id} style={{ textAlign: "center" }}>
          <div style={{ height: 405, background: ["#e9d9d6", "#27202d", "#4c6664"][index % 3] }}>
            <FittingAvatar characterId="iris" outfit={BARE_OUTFIT} layers={{
              ...plumLook,
              top: velvet ? "fashion.premium-velvet" : group === "pants" || tucked ? plumLook.top : null,
              topTucked: tucked,
              bottom: piece.id,
              colors: dye ? { [piece.id]: dye } : undefined,
            }} />
          </div>
          <p>{piece.name}</p>
        </section>
      ))}
      <style>{".fitting-avatar{width:100%;height:100%}"}</style>
    </main>
  );
}

const params = new URLSearchParams(location.search);
const group = params.get("bottoms");
createRoot(document.getElementById("fixture")!).render(
  group ? <BottomsFit group={group} dye={params.get("dye") ?? undefined} tucked={params.has("tucked")} velvet={params.get("top") === "velvet"} /> : <Fixture />,
);
