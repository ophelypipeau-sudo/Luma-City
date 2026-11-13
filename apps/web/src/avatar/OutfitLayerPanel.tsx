import { Layers } from "lucide-react";
import { useId, useRef, useState, type Dispatch, type PointerEvent, type SetStateAction } from "react";
import { orderedOutfitPieces, moveOutfitPiece, type AvatarLayers } from "./model";
import { AvatarItemThumbnail } from "./LayeredDoll";
import "./top-tuck.css";

type LayerPointer = {
  id: number;
  slot: string;
  x: number;
  y: number;
  index: number;
  centers: number[];
  scrollTop: number;
};

function layerTarget(pointer: LayerPointer, y: number) {
  const center = pointer.centers[pointer.index] + y - pointer.y;
  return pointer.centers.reduce((nearest, value, index, centers) =>
    Math.abs(value - center) < Math.abs(centers[nearest] - center) ? index : nearest, pointer.index);
}

export function OutfitLayerPanel({ layers, onChange }: {
  layers: AvatarLayers;
  onChange: Dispatch<SetStateAction<AvatarLayers>>;
}) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const pointer = useRef<LayerPointer | null>(null);
  const [drag, setDrag] = useState<{ slot: string; x: number; y: number; target: number }>();
  const id = useId();
  const order = orderedOutfitPieces(layers).filter((piece) => piece.slot !== "hair");
  const visibleIds = new Set(order.map((piece) => piece.id));
  if (!order.length) return null;
  function startDrag(event: PointerEvent<HTMLButtonElement>, slot: string, index: number) {
    if (event.button !== 0 || pointer.current || !panel.current) return;
    const centers = Array.from(panel.current.querySelectorAll(".outfit-layer-item"), (item) => {
      const rect = item.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { id: event.pointerId, slot, x: event.clientX, y: event.clientY, index, centers, scrollTop: panel.current.scrollTop };
  }
  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = pointer.current;
    if (!active || event.pointerId !== active.id) return;
    const y = event.clientY + (panel.current?.scrollTop ?? active.scrollTop) - active.scrollTop;
    setDrag({
      slot: active.slot,
      x: event.clientX - active.x,
      y: y - active.y,
      target: layerTarget(active, y),
    });
  }
  function endDrag(event: PointerEvent<HTMLButtonElement>, drop: boolean) {
    const active = pointer.current;
    if (!active || event.pointerId !== active.id) return;
    pointer.current = null;
    setDrag(undefined);
    if (!drop) return;
    const y = event.clientY + (panel.current?.scrollTop ?? active.scrollTop) - active.scrollTop;
    const target = layerTarget(active, y);
    const distance = target - active.index;
    if (!distance) return;
    onChange((current) => moveOutfitPiece(current, active.slot, distance, visibleIds));
  }
  return <div className="outfit-layers">
    <button type="button" className="top-tuck-button" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)}>
      <Layers size={15} aria-hidden="true" /> Calques
    </button>
    {open && <div ref={panel} className="outfit-layer-panel" id={id} role="group" aria-label="Ordre des vêtements">
      {order.map((piece, index) => {
        const slot = piece.id;
        const label = index === 0 ? "Devant" : index === order.length - 1 ? "Derrière" : "Au milieu";
        const moving = drag?.slot === slot;
        const dropPosition = drag?.target === index && !moving
          ? index < order.findIndex((piece) => piece.id === drag.slot) ? "before" : "after" : undefined;
        return <button className="outfit-layer-item" type="button" key={slot}
          title={`Glisser ${piece.name}`} aria-label={`${piece.name} · ${label}`}
          aria-keyshortcuts="ArrowUp ArrowDown"
          data-dragging={moving || undefined} data-drop={dropPosition}
          style={moving ? { translate: `${drag.x}px ${drag.y}px` } : undefined}
          onPointerDown={(event) => startDrag(event, slot, index)}
          onPointerMove={moveDrag}
          onPointerUp={(event) => endDrag(event, true)}
          onPointerCancel={(event) => endDrag(event, false)}
          onLostPointerCapture={(event) => endDrag(event, false)}
          onKeyDown={(event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            event.preventDefault();
            onChange((current) => moveOutfitPiece(current, slot, event.key === "ArrowUp" ? -1 : 1, visibleIds));
          }}>
          <AvatarItemThumbnail piece={piece} color={layers.colors?.[piece.id]} detailColor={layers.detailColors?.[piece.id]} />
          <span>{label}</span>
        </button>;
      })}
    </div>}
  </div>;
}
