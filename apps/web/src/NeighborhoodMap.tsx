import { useId, useRef, useState, type CSSProperties } from "react";
import type { RoomId } from "../../../packages/contracts/src/index";
import { chatRooms } from "./chat-rooms";
const mapImage = "/assets/neighborhood-beauty-salon-v1.png";
const giftLocations = [[11.5, 11.5], [52.4, 15], [87.2, 38], [23.4, 67], [79, 79]];
const placeIcons = {
  shop: "shop",
  salon: "salon",
  home: "home",
  arcade: "arcade",
  chat: "greenhouse",
  fountain: "fountain",
  terrace: "terrace",
  pets: "pets",
};
// Coordinates refer to the original illustration, so markers stay attached while panning.
const places: {
  id: keyof typeof placeIcons;
  name: string;
  x: number;
  y: number;
  label?: string;
  roomId?: RoomId;
}[] = [
  { id: "shop", name: "Boutique", x: 0.155, y: 0.435 },
  { id: "salon", name: "Salon d’esthétique", x: 0.306, y: 0.443 },
  { id: "home", name: "Ma maison", x: 0.345, y: 0.185 },
  { id: "arcade", name: "Coin détente", x: 0.905, y: 0.555 },
  {
    id: "chat",
    name: chatRooms.greenhouse.name,
    x: 0.67,
    y: 0.35,
    roomId: "greenhouse",
  },
  {
    id: "fountain",
    name: chatRooms.fountain.name,
    x: 0.493,
    y: 0.618,
    label: "Fontaine",
    roomId: "fountain",
  },
  {
    id: "terrace",
    name: chatRooms.terrace.name,
    x: 0.372,
    y: 0.813,
    label: "Terrasse",
    roomId: "terrace",
  },
  { id: "pets", name: "Animalerie", x: 0.13, y: 0.77 },
];

export function NeighborhoodMap({
  homeGifts,
  onGift,
  roomCounts,
  onEnter,
  onShop,
  onSalon,
  onArcade,
}: {
  homeGifts?: number[] | null;
  onGift: (gift: number) => void;
  roomCounts: Partial<Record<RoomId, number>>;
  onEnter: (roomId: RoomId) => void;
  onShop: () => void;
  onSalon?: () => void;
  onArcade?: () => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Record<string, number>>({});
  const tooltipPrefix = useId();
  function fitTooltip(id: string) {
    const el = viewport.current;
    const marker = el?.querySelector<HTMLElement>(`.marker-${id}`);
    const tooltip = marker?.querySelector<HTMLElement>(".place-tooltip");
    if (!el || !marker || !tooltip) return;
    const bounds = el.getBoundingClientRect(),
      rect = marker.getBoundingClientRect();
    const center = rect.left + rect.width / 2,
      half = tooltip.offsetWidth / 2;
    const shift =
      Math.min(
        bounds.right - 8 - half,
        Math.max(bounds.left + 8 + half, center),
      ) - center;
    setShifts((s) => (s[id] === shift ? s : { ...s, [id]: shift }));
  }
  return (
    <div
      className="neighborhood-map marked-map"
      onKeyDown={(e) => {
        if (e.key === "Escape") setSelected(null);
      }}
    >
      <div
        role="region"
        aria-label="Lieux du quartier"
        className="map-viewport"
        style={{ backgroundImage: `url("${mapImage}")` }}
        ref={viewport}
        onClick={() => setSelected(null)}
      >
        <div className="map-artwork">
          <img
            src={mapImage}
            alt="Quartier fleuri avec une serre, une fontaine, une terrasse, une animalerie, une boutique de vêtements et un salon d’esthétique."
            draggable={false}
          />
          {homeGifts && giftLocations.map(([x, y], index) => !homeGifts.includes(index + 1) && (
            <button type="button" key={index} className="map-quest-gift"
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-label={`Ramasser le cadeau ${index + 1}`}
              onClick={() => onGift(index + 1)}>
              <img src="/assets/navigation/quest-gift.png" alt="" draggable={false} />
            </button>
          ))}
          {places.map(({ id, name, label, x, y, roomId }) => (
            <div
              key={id}
              className={`place-marker marker-${id} ${selected === id ? "is-open" : ""}`}
              style={
                {
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  "--tooltip-shift": `${shifts[id] ?? 0}px`,
                } as CSSProperties
              }
            >
              <button
                className="place-dot"
                type="button"
                disabled={id === "home"}
                aria-label={id === "home" ? "Ma maison · Prochainement" : name}
                aria-describedby={id === "home" ? undefined : `${tooltipPrefix}-${id}`}
                onPointerEnter={() => fitTooltip(id)}
                onFocus={() => requestAnimationFrame(() => fitTooltip(id))}
                onClick={(e) => {
                  e.stopPropagation();
                  fitTooltip(id);
                  if (roomId) onEnter(roomId);
                  else if (id === "shop") onShop();
                  else if (id === "salon" && onSalon) onSalon();
                  else if (id === "arcade" && onArcade) onArcade();
                  else setSelected((s) => (s === id ? null : id));
                }}
                onBlur={() => setSelected(null)}
              >
                <img className="place-icon" src={`/assets/map-icons/${placeIcons[id]}.png`} alt="" draggable={false} />
                {(id === "home" || id === "pets") && <img className="place-progress"
                  src="/assets/navigation/work-in-progress.png" alt="" draggable={false} />}
                <span className="place-name" aria-hidden="true">{label ?? name}
                  {id === "home" && <small>Prochainement</small>}
                </span>
              </button>
              {id !== "home" && <span
                className="place-tooltip"
                role="tooltip"
                id={`${tooltipPrefix}-${id}`}
              >
                <strong>{name}</strong>
                <small>
                  {roomId
                    ? `${roomCounts[roomId] ?? 0} / 15 · Entrer dans la salle`
                    : id === "shop"
                      ? "Entrer et essayer les vêtements"
                      : id === "salon" && onSalon
                        ? "Personnaliser ton visage"
                      : id === "arcade" && onArcade
                          ? "Jouer aux mini-jeux"
                          : "Bientôt disponible"}
                </small>
              </span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
