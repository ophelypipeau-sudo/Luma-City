import React from "react";
import { FittingAvatar } from "../../apps/web/src/shop/FittingAvatar";
import { BARE_OUTFIT } from "../../apps/web/src/shop/catalog";
import { IRIS_SHOES_CAPSULE_GARMENTS as shoes } from "../../apps/web/src/avatar/shoes-capsule";
import { IRIS_SHORTS_GARMENTS } from "../../apps/web/src/avatar/iris-shorts";
import { IRIS_SKIRTS_GARMENTS } from "../../apps/web/src/avatar/iris-skirts";
import { IRIS_DRESSES_V2_GARMENTS } from "../../apps/web/src/avatar/iris-dresses";

export const shoeLooks = {
  nues: { name: "Jambes nues", top: null, bottom: null, order: "behind" },
  pantalon: { name: "Dalle, pantalon devant", top: "fashion.iris-knits-alaska", bottom: "fashion.pants-dalle", order: "behind" },
  rentre: { name: "Fuseau, tiges devant", top: "fashion.iris-knits-alaska", bottom: "fashion.pants-fuseau", order: "front" },
  short: { name: "Short court", top: "fashion.iris-knits-alaska", bottom: IRIS_SHORTS_GARMENTS.find(({ id }) => id.endsWith("-pixel"))!.id, order: "behind" },
  jupe: { name: "Minijupe", top: "fashion.iris-knits-alaska", bottom: IRIS_SKIRTS_GARMENTS.find(({ id }) => id.endsWith("-pixel-rose"))!.id, order: "behind" },
  robe: { name: "Robe courte", top: IRIS_DRESSES_V2_GARMENTS.find(({ id }) => id.includes("solstice"))!.id, bottom: null, order: "behind" },
} as const;

export type ShoeLook = keyof typeof shoeLooks;
export function shoeLayers(look: ShoeLook, shoe: string) {
  const { top, bottom, order } = shoeLooks[look];
  return {
    top, bottom, shoes: shoe, hair: null,
    pieceOrder: bottom ? (order === "front" ? [shoe, bottom] : [bottom, shoe]) : undefined,
  };
}
export { shoes as previewShoes };

export function IrisShoeFit({ look }: { look: ShoeLook }) {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10, padding: 10 }}>
      {shoes.map((shoe, index) => (
        <section key={shoe.id} style={{ textAlign: "center" }}>
          <div style={{ height: 420, background: ["#f0e3df", "#27212f", "#47615d"][index % 3] }}>
            <FittingAvatar characterId="iris" outfit={BARE_OUTFIT} layers={shoeLayers(look, shoe.id)} />
          </div>
          <p>{shoe.name}</p>
        </section>
      ))}
      <style>{".fitting-avatar{width:100%;height:100%}"}</style>
    </main>
  );
}
