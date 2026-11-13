import {PUNK_LAYERS}from"../../packages/domain/src/punk-pattern";
import { plumLook } from "../../apps/web/src/avatar/prune-fumee";
import { polarLook } from "../../apps/web/src/avatar/minuit-polaire";
import { APPROVED_TOPS } from "../../apps/web/src/avatar/approved-tops";
import { FASHION_BASE } from "../../apps/web/src/avatar/base";
import { Portrait } from "../../apps/web/src/Avatar";
import {
  LEOPARD_GARMENTS,
  LEOPARD_LAYERS,
} from "../../apps/web/src/avatar/leopard";
import {
  BURGUNDY_GARMENTS,
  BURGUNDY_LAYERS,
} from "../../apps/web/src/avatar/burgundy";
import { useState } from "react";
import {
  AVATAR_GARMENTS,
  registerAtelierGarment,
  type Garment,
} from "../../apps/web/src/avatar/catalog";
import { DEFAULT_LAYERS, equipLayer } from "../../apps/web/src/avatar/model";
import { FittingAvatar } from "../../apps/web/src/shop/FittingAvatar";
import { BARE_OUTFIT } from "../../apps/web/src/shop/catalog";
import { WINTER_LOOKS } from "../../apps/web/src/avatar/winter";
import { CAPSULE_MODE_GARMENTS } from "../../apps/web/src/avatar/capsule-mode";
import { AvatarItemThumbnail } from "../../apps/web/src/avatar/LayeredDoll";
import hairPlacements from "../../docs/coiffures-iris-v3/placements.json";

const hairPreviews: Garment[] = hairPlacements.map(([id, name]) => ({
  id: `atelier.iris-v3-${id}`,
  name: String(name),
  slot: "hair",
  crop: [120, -125, 647, 810],
  coverage: [],
  art: {
    kind: "image",
    front: `/docs/coiffures-iris-v3/calques/${id}.png`,
    offsetY: -125,
  },
}));
hairPreviews.forEach((piece) => registerAtelierGarment(piece));
const spiderTee: Garment = {
  id: "atelier.spider-tee-v2",
  name: "Tee-shirt araignée · coupe corrigée",
  slot: "top",
  crop: [230, 325, 430, 365],
  coverage: [],
  coverageFromArt: true,
  art: {
    kind: "image",
    front: "/assets/avatar/imports/spider-tee-v2/front.png",
  },
};
registerAtelierGarment(spiderTee);

export function LayeredFitFixture({ onClose }: { onClose: () => void }) {
  const [layers, setLayers] = useState(DEFAULT_LAYERS),
    [masks, setMasks] = useState(false);
  const [railPose, setRailPose] = useState(false);
  const [staticPose,setStaticPose]=useState<'hand-on-hip'|'heart-hands'>('hand-on-hip');
  return (
    <main style={{ padding: 16, fontFamily: "sans-serif" }}>
      <style>{`
        .layered-fit-stage > .fitting-avatar { display: block; width: 100%; height: 100%; }
        .capsule-fit-thumbnails .garment-thumbnail { display: block; width: 96px; height: 96px; }
      `}</style>
      <h1>Base unique · contrôle des calques</h1>
      {hairPreviews.map((piece) => (
        <button key={piece.id} onClick={() => {
          setRailPose(false);
          setLayers({ ...plumLook, hair: piece.id });
        }}>{piece.name}</button>
      ))}
      <button onClick={()=>setLayers(PUNK_LAYERS)}>Éclipse rose complète</button>
      <button onClick={() => { setRailPose(false); setLayers(plumLook); }}>Prune fumée · essayage de face</button>
      {CAPSULE_MODE_GARMENTS.map((piece) => (
        <button key={piece.id} onClick={() => setLayers({ ...plumLook, top: piece.id })}>
          {piece.name} · capsule
        </button>
      ))}
      <button onClick={() => { setRailPose(false); setLayers(polarLook); }}>Minuit polaire · essayage de face</button>
      {WINTER_LOOKS.map(look=><button key={look.name} onClick={()=>setLayers(look.layers)}>{look.name}</button>)}
      <a href="./material-colors.html">Contrôler les couleurs et les coutures</a>
      {" · "}<a href="./belt-fits.html">Contrôler la ceinture sur les pantalons et jupes</a>
      {" · "}<a href="./hip-poses.html">Contrôler la pose avec tous les hauts</a>
      {" · "}<a href="./pose-wardrobe.html">Comparer tout le dressing dans les trois poses</a>
      <label>
        <input
          type="checkbox"
          checked={railPose}
          onChange={(e) => setRailPose(e.target.checked)}
        />
        Comparer la pose de gauche et la cabine de face
      </label>
      <button onClick={()=>{setStaticPose('heart-hands');setRailPose(true);}}>Pose fixe · mains en cœur</button>
      <button onClick={()=>{setStaticPose('hand-on-hip');setRailPose(true);}}>Pose fixe · main sur la hanche</button>
      <button onClick={() => setLayers(LEOPARD_LAYERS)}>
        Tenue Léopard complète
      </button>
      <button onClick={() => setLayers(BURGUNDY_LAYERS)}>
        Tenue bordeaux complète
      </button>
      <button onClick={()=>setLayers({...DEFAULT_LAYERS,top:"fashion.textile-cropped-knit",bottom:"fashion.textile-tailored-shorts",shoes:null,belt:null})}>Pull Charbon et short Cendre</button>
      <button onClick={() => { setRailPose(true); setLayers({ ...DEFAULT_LAYERS,
        belt: LEOPARD_LAYERS.belt,
        colors: { [DEFAULT_LAYERS.top!]: "#80c0ff" },
        detailColors: { [DEFAULT_LAYERS.top!]: "#ffcce6" },
      }); }}>Tenue validée · contrôle des couleurs et du bras</button>
      <button onClick={onClose}>Retour aux contrôles archivés</button>{" "}
      {[
        ...APPROVED_TOPS,
        ...LEOPARD_GARMENTS,
        ...BURGUNDY_GARMENTS,
        ...AVATAR_GARMENTS,
        spiderTee,
      ].map((piece) => (
        <button
          key={piece.id}
          aria-pressed={layers[piece.slot] === piece.id}
          onClick={() =>
            setLayers((old) =>
              equipLayer(
                old,
                piece.slot,
                old[piece.slot] === piece.id ? null : piece.id,
              ),
            )
          }
        >
          {piece.name}
        </button>
      ))}
      <label>
        <input
          type="checkbox"
          checked={masks}
          onChange={(e) => setMasks(e.target.checked)}
        />
        Corps découpé sans vêtements
      </label>
      <div style={{ display: "flex", gap: 20 }}>
        {railPose && (
          <div style={{ height: 680, width: 390, background: "#5b426e" }}>
          <Portrait id="iris" layers={layers} fullBody pose={staticPose} />
          </div>
        )}
        <div
          className="layered-fit-stage"
          style={{
            height: 680,
            width: 390,
            maxWidth: 390,
            background: "#5b426e",
          }}
        >
          <FittingAvatar
            characterId="iris"
            outfit={BARE_OUTFIT}
            layers={layers}
            bodyBase={FASHION_BASE}
            inspection={masks ? "body-cutaway" : "normal"}
          />
        </div>
      </div>
      <aside className="capsule-fit-thumbnails" aria-label="Vignettes de la capsule" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {CAPSULE_MODE_GARMENTS.map((piece) => (
          <div key={piece.id} style={{ width: 96 }}>
            <AvatarItemThumbnail piece={piece} />
            <span>{piece.name}</span>
          </div>
        ))}
      </aside>
    </main>
  );
}
