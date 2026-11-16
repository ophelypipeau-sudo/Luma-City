import React from "react";
import { FittingAvatar } from "../../apps/web/src/shop/FittingAvatar";
import { BARE_OUTFIT } from "../../apps/web/src/shop/catalog";
import { IRIS_PANTS_GARMENTS } from "../../apps/web/src/avatar/pants-capsule";

export const pantLooks = {
  baskets: { top: "fashion.capsule-mode-cerise", shoes: "fashion.shoes-piste" },
  escarpins: { top: "fashion.iris-knits-mila", shoes: "fashion.iris-shoes-venus" },
  bottines: { top: "fashion.iris-knits-tokyo", shoes: "fashion.iris-shoes-nox" },
  bottes: { top: "fashion.capsule-mode-cerise", shoes: "fashion.iris-shoes-alta" },
  plateformes: { top: "fashion.iris-knits-nuage", shoes: "fashion.iris-shoes-ether" },
} as const;
export type PantLook = keyof typeof pantLooks;
const underTallBoots = new Set(["sculpt", "shadow", "motion"].map(id => "fashion.iris-pants-" + id));
export const pantLayers = (look: PantLook, id: string) => {
  const outfit = pantLooks[look];
  return {
    ...outfit, bottom: id, hair: null,
    pieceOrder: look === "bottes" && underTallBoots.has(id) ? [outfit.top, outfit.shoes, id] : undefined,
  };
};

export function IrisPantFit({ look, color, detail }: { look: PantLook; color?: string; detail?: string }) {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10, padding: 10 }}>
      {IRIS_PANTS_GARMENTS.map((piece, index) => (
        <section key={piece.id} style={{ textAlign: "center" }}>
          <div style={{ height: 420, background: ["#f0e3df", "#27212f", "#47615d"][index % 3] }}>
            <FittingAvatar characterId="iris" outfit={BARE_OUTFIT} layers={{
              ...pantLayers(look, piece.id),
              colors: color ? { [piece.id]: color } : undefined,
              detailColors: detail ? { [piece.id]: detail } : undefined,
            }} />
          </div>
          <p>{piece.name}</p>
        </section>
      ))}
      <style>{".fitting-avatar{width:100%;height:100%}"}</style>
    </main>
  );
}
