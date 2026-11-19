import React from "react";
import { createRoot } from "react-dom/client";
import { FURNITURE_MODELS } from "../../packages/domain/src/housing";
import { FurnitureArt } from "../../apps/web/src/housing/HomeScene";

createRoot(document.getElementById("root")!).render(<main>
  <style>{`body{margin:0;background:#ede4e9;color:#39283e;font:14px system-ui}main{max-width:1050px;margin:auto;padding:20px}h1{font-size:23px}article{display:grid;grid-template-columns:150px repeat(3,1fr);gap:12px;align-items:center;margin:10px 0}figure{margin:0;border-radius:12px;padding:10px;display:grid;place-content:center;min-height:120px}svg{width:240px;height:115px;overflow:visible}.light{background:#fffaf2}.dark{background:#231c30}.color{background:#4cbaaa}@media(max-width:650px){article{grid-template-columns:repeat(3,1fr);gap:4px}strong{grid-column:1/-1}figure{min-height:80px;padding:4px}svg{width:100%;height:80px}}`}</style>
  <h1>Prune & lumière · Contours et transparence</h1>
  <p>PNG natifs sur fond clair, foncé et coloré. Aucun article publié en boutique.</p>
  {FURNITURE_MODELS.map((model) => <article key={model.id}><strong>{model.name}</strong>
    {["light", "dark", "color"].map((tone) => <figure key={tone} className={tone}>
      <svg viewBox={`${-model.width / 2} ${-model.height} ${model.width} ${model.height}`}><FurnitureArt model={model} /></svg>
    </figure>)}
  </article>)}
</main>);
