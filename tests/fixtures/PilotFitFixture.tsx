import { useState } from "react";
import { MORPHOLOGIES } from "../../apps/web/src/cartoon/model";
import {
  createPilotAppearance,
  togglePilotPiece,
  PILOT_PIECES,
  type PilotSlot,
} from "../../apps/web/src/cartoon/pilot";
import { changeMorphology } from "../../apps/web/src/cartoon/appearance";
import { FittingAvatar } from "../../apps/web/src/shop/FittingAvatar";
import { BARE_OUTFIT } from "../../apps/web/src/shop/catalog";

export function PilotFitFixture({ onClose }: { onClose: () => void }) {
  const [appearance, setAppearance] = useState(createPilotAppearance),
    [masks, setMasks] = useState(false),
    [focus, setFocus] = useState("all");
  return (
    <main style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h1>Tenue pilote · six corps validés</h1>
      <button onClick={onClose}>Retour au contrôle v6</button>{" "}
      <label>
        Vue{" "}
        <select
          aria-label="Morphologie de contrôle"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
        >
          <option value="all">Toutes</option>
          {MORPHOLOGIES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>{" "}
      <label>
        <input
          type="checkbox"
          checked={masks}
          onChange={(e) => setMasks(e.target.checked)}
        />
        Corps découpé sans vêtements
      </label>{" "}
      {(Object.keys(PILOT_PIECES) as PilotSlot[]).map((slot) => (
        <button
          key={slot}
          aria-pressed={appearance.equipped[slot] !== null}
          onClick={() => setAppearance((a) => togglePilotPiece(a, slot))}
        >
          {slot}
        </button>
      ))}
      <p>Identifiants portés : {JSON.stringify(appearance.equipped)}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            focus === "all" ? "repeat(6,minmax(0,1fr))" : "minmax(0,390px)",
          gap: 8,
        }}
      >
        {MORPHOLOGIES.filter((m) => focus === "all" || focus === m.id).map(
          (m) => (
            <section
              key={m.id}
              style={{
                border: "1px solid #bea0cd",
                borderRadius: 12,
                padding: 8,
                background: "#5b426e",
              }}
            >
              <h2 style={{ fontSize: 17 }}>{m.name}</h2>
              <div style={{ height: focus === "all" ? 490 : 650 }}>
                <FittingAvatar
                  characterId="iris"
                  outfit={BARE_OUTFIT}
                  appearance={changeMorphology(appearance, m.id)}
                  inspection={masks ? "body-cutaway" : "normal"}
                />
              </div>
            </section>
          ),
        )}
      </div>
      <style>{`.fitting-avatar{width:100%;height:100%}`}</style>
    </main>
  );
}
