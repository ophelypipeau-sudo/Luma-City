import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Portrait } from "../../apps/web/src/Avatar";
import { AvatarItemThumbnail } from "../../apps/web/src/avatar/LayeredDoll";
import { avatarGarment } from "../../apps/web/src/avatar/catalog";
import { EMPTY_LAYERS } from "../../apps/web/src/avatar/model";
function Board() {
  const [skirt, setSkirt] = useState(false);
  const layers = {
    ...EMPTY_LAYERS,
    top: "fashion.burgundy-fold-sweater",
    ...(skirt ? { bottom: "fashion.midnight-pleated-skirt" } : {}),
  };
  return (
    <main style={{ maxWidth: 1500, margin: "auto", padding: 18 }}>
      <h1 style={{ fontSize: 24, margin: "4px 0 12px" }}>
        Pull bordeaux · détourage par contours
      </h1>
      <p>
        Notre mannequin et ses mains restent identiques. Ombres, maille et
        coutures conservées.
      </p>
      <button onClick={() => setSkirt(!skirt)}>
        {skirt ? "Retirer la jupe de contrôle" : "Ajouter la jupe de contrôle"}
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        {(["front", "hand-on-hip", "heart-hands"] as const).map((pose, i) => (
          <section
            key={pose}
            style={{
              border: "1px solid #aa8caa",
              borderRadius: 12,
              background: "#ffffff08",
              padding: 10,
            }}
          >
            <h2 style={{ fontSize: 18, textAlign: "center", margin: 0 }}>
              {["De face", "Main sur la hanche", "Mains en cœur"][i]}
            </h2>
            <div style={{ height: 820 }}>
              <Portrait id="iris" layers={layers} fullBody pose={pose} />
            </div>
          </section>
        ))}
      </div>
      <section style={{ marginTop: 24, maxWidth: 440 }}>
        <h2>Le vêtement seul</h2>
        <div
          style={{
            height: 290,
            background:
              "repeating-conic-gradient(#d5cbd6 0% 25%,#f4eff5 0% 50%) 0 0/20px 20px",
            borderRadius: 10,
            padding: 10,
          }}
        >
          <AvatarItemThumbnail
            piece={avatarGarment("fashion.burgundy-fold-sweater")}
          />
        </div>
      </section>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Board />);
