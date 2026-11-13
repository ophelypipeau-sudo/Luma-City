import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Portrait } from "../../apps/web/src/Avatar";
import {
  DEFAULT_LAYERS,
  type AvatarLayers,
} from "../../apps/web/src/avatar/model";
import { LEOPARD_LAYERS } from "../../apps/web/src/avatar/leopard";
import { BURGUNDY_LAYERS } from "../../apps/web/src/avatar/burgundy";
import { ROSE_LAYERS } from "../../apps/web/src/avatar/rose";
import { STATIC_POSES } from "../../apps/web/src/avatar/static-poses";
import { WINTER_LOOKS } from "../../apps/web/src/avatar/winter";
import { fittingCart } from "../../apps/web/src/shop/fashion-options";
import { plumLook } from "../../apps/web/src/avatar/prune-fumee";
import { polarLook } from "../../apps/web/src/avatar/minuit-polaire";
import { APPROVED_TOPS } from "../../apps/web/src/avatar/approved-tops";
import { TSHIRT_GARMENTS } from "../../apps/web/src/avatar/tshirts";
import { CAPSULE_MODE_GARMENTS } from "../../apps/web/src/avatar/capsule-mode";
import { PREMIUM_CAPSULE_GARMENTS } from "../../apps/web/src/avatar/premium-capsule";
import { outfitSupportsPose } from "../../apps/web/src/avatar/pose-compatibility";
const capsulePieces = [...PREMIUM_CAPSULE_GARMENTS, ...CAPSULE_MODE_GARMENTS];
const looks: { name: string; layers: AvatarLayers }[] = [
  ...capsulePieces.map(({ name, id }) => ({
    name: `${name} · capsule`,
    layers: { ...plumLook, top: id },
  })),
  ...APPROVED_TOPS.map(({ name, id }, index) => ({
    name,
    layers: {
      ...(index === 1
        ? BURGUNDY_LAYERS
        : index === 2
          ? DEFAULT_LAYERS
          : plumLook),
      top: id,
    },
  })),
  ...TSHIRT_GARMENTS.map(({ name, id }) => ({
    name,
    layers: { ...plumLook, top: id },
  })),
  { name: "Minuit polaire", layers: polarLook },
  { name: "Prune fumée", layers: plumLook },
  ...WINTER_LOOKS,
  {
    name: "Léopard · pantalon fourrure · baskets · ceinture",
    layers: LEOPARD_LAYERS,
  },
  {
    name: "Pull bordeaux · jupe · mocassins · ceinture",
    layers: { ...BURGUNDY_LAYERS, belt: LEOPARD_LAYERS.belt },
  },
  {
    name: "Cardigan · jean · bottines · ceinture",
    layers: { ...DEFAULT_LAYERS, belt: LEOPARD_LAYERS.belt },
  },
  {
    name: "Caraco · cargo Dragon · baskets blanches · ceinture",
    layers: { ...ROSE_LAYERS, belt: LEOPARD_LAYERS.belt },
  },
];
function Board() {
  const [index, setIndex] = useState(0),
    [colors, setColors] = useState(false),
    [capsuleColor, setCapsuleColor] = useState("original");
  const look = looks[index];
  const capsulePiece = capsulePieces.find(
    (piece) => piece.id === look.layers.top,
  );
  const layers = {
    ...look.layers,
    ...(capsulePiece && capsuleColor !== "original"
      ? {
          colors: {
            [capsulePiece.id]:
              capsuleColor === "light"
                ? "#f5eee3"
                : capsuleColor === "olive"
                  ? "#536214"
                  : "#151521",
          },
        }
      : !capsulePiece && colors
        ? {
            colors: {
              ...Object.fromEntries(
                fittingCart(look.layers).map(({ piece }) => [
                  piece.id,
                  piece.slot === "hair"
                    ? "#ab6e35"
                    : ["necklace", "earrings"].includes(piece.slot)
                      ? "#d8b85a"
                      : ["shoes", "belt"].includes(piece.slot)
                        ? "#566781"
                        : "#80c0ff",
                ]),
              ),
            },
            detailColors: {
              ...Object.fromEntries(
                fittingCart(look.layers)
                  .filter((e) => e.piece.secondaryColor)
                  .map(({ piece }) => [piece.id, "#ffcce6"]),
              ),
            },
          }
        : {}),
  };
  return (
    <main style={{ padding: 20, maxWidth: 1200, margin: "auto" }}>
      <h1>Un même mannequin, trois poses</h1>
      <p>
        Les mêmes pièces et couleurs sont conservées ; seules les parties liées
        aux bras changent.
      </p>
      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {looks.map((look, i) => (
          <button
            key={i}
            aria-pressed={index === i}
            onClick={() => setIndex(i)}
          >
            {look.name}
          </button>
        ))}
        <button aria-pressed={colors} onClick={() => setColors(!colors)}>
          Tester les couleurs
        </button>
        {capsulePiece && (
          <>
            <button onClick={() => setCapsuleColor("original")}>
              Teinte originale
            </button>
            <button onClick={() => setCapsuleColor("light")}>
              Tissu clair
            </button>
            <button onClick={() => setCapsuleColor("dark")}>Tissu foncé</button>
            <button onClick={() => setCapsuleColor("olive")}>
              Tissu olive
            </button>
          </>
        )}
      </nav>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginTop: 16,
        }}
      >
        {STATIC_POSES.map((pose, i) => (
          <section
            key={pose}
            style={{
              background: "#ffffff0c",
              border: "1px solid #b591b0",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <h2>
              {["De face · cabine", "Main sur la hanche", "Mains en cœur"][i]}
            </h2>
            <div style={{ height: 580 }}>
              {outfitSupportsPose(layers, pose) ? (
                <Portrait id="iris" layers={layers} fullBody pose={pose} />
              ) : (
                <p>Cette pièce n’a pas de dessin pour cette pose.</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Board />);
