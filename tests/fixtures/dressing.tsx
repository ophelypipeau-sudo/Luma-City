import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { LayeredDressing } from "../../apps/web/src/shop/LayeredDressing";
import { ROSE_LAYERS } from "../../apps/web/src/avatar/rose";
import type { AvatarLayers } from "../../apps/web/src/avatar/model";
function Fixture() {
  const [layers, setLayers] = useState<AvatarLayers>({
    ...ROSE_LAYERS,
    colors: { [ROSE_LAYERS.top!]: "#408000" },
  });
  return (
    <LayeredDressing
      layers={layers}
      onChange={setLayers}
      onClose={() => {}}
      onCollections={() => {}}
      canCustomizeColors
    />
  );
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
