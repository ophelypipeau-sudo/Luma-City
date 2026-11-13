import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { GarmentPalette } from "../../apps/web/src/shop/GarmentPalette";
import { AvatarItemThumbnail } from "../../apps/web/src/avatar/LayeredDoll";
import { avatarGarment } from "../../apps/web/src/avatar/catalog";
import "../../apps/web/src/shop/layered-dressing.css";
function Fixture() {
  const [vip, setVip] = useState(false),
    [color, setColor] = useState("#ffffff");
  return (
    <main
      style={{
        maxWidth: 550,
        margin: "20px auto",
        padding: 20,
        background: "#fff3ed",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Contrôle couleurs</h1>
      <label>
        <input
          type="checkbox"
          checked={vip}
          onChange={(e) => setVip(e.target.checked)}
        />
        Simulation VIP de contrôle
      </label>
      <div className="palette-preview">
        <AvatarItemThumbnail
          piece={avatarGarment("fashion.rose-bow-camisole")}
          color={color}
        />
      </div>
      <GarmentPalette value={color} onChange={setColor} canCustomize={vip} />
      <output>{color}</output>
    </main>
  );
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
