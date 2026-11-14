import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Avatar } from "./Avatar";
import type { AvatarLayers } from "./avatar/model";
import {
  roomFloor,
  type Presence,
  type RoomId,
  type RoomMessage,
} from "../../../packages/contracts/src/index";

export function Room({
  roomId,
  scene,
  players,
  me,
  wornLayers,
  messages,
  onMove,
  onSelect,
}: {
  roomId: RoomId;
  scene: { name: string; background: string; color?: string };
  players: Presence[];
  me?: string;
  wornLayers?: AvatarLayers;
  /** Room chat; undefined until the history has arrived. New lines show as speech bubbles. */
  messages?: RoomMessage[];
  onMove: (x: number, y: number) => void;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const floor = roomFloor(roomId);
  const bubbles = useSpeechBubbles(messages);
  return (
    <div
      className={
        scene.background ? "room-viewport" : "room-viewport player-home"
      }
      style={
        scene.background
          ? { backgroundImage: `url(${scene.background})` }
          : ({ "--home-color": scene.color } as CSSProperties)
      }
    >
      {!scene.background && (
        <div className="profile-home-window" aria-hidden="true" />
      )}
      <svg
        ref={ref}
        className="room-svg"
        viewBox="0 0 1000 680"
        // A room fills its frame, without blurred bands; a player home keeps its proportions.
        preserveAspectRatio={scene.background ? "xMidYMid slice" : undefined}
        role="application"
        aria-label={`${scene.name}. Clique au sol ou utilise les flèches pour te déplacer.`}
        tabIndex={0}
        onClick={(e) => {
          const point = ref.current!.createSVGPoint();
          point.x = e.clientX;
          point.y = e.clientY;
          const p = point.matrixTransform(
            ref.current!.getScreenCTM()!.inverse(),
          );
          if (p.x >= 0 && p.x <= 1000 && p.y / 6.8 >= floor && p.y <= 680)
            onMove(
              Math.min(92, Math.max(8, p.x / 10)),
              Math.min(86, p.y / 6.8),
            );
        }}
        onKeyDown={(e) => {
          const p = players.find((p) => p.id === me);
          if (!p) return;
          const delta: Record<string, [number, number]> = {
            ArrowLeft: [-3, 0],
            ArrowRight: [3, 0],
            ArrowUp: [0, -3],
            ArrowDown: [0, 3],
          };
          if (delta[e.key]) {
            e.preventDefault();
            const [x, y] = delta[e.key];
            onMove(
              Math.min(92, Math.max(8, p.x + x)),
              Math.min(86, Math.max(floor, p.y + y)),
            );
          }
        }}
      >
        {scene.background && (
          <image
            href={scene.background}
            width="1000"
            height="680"
            preserveAspectRatio="none"
          />
        )}
        {[...players]
          .sort((a, b) => a.y - b.y)
          .map((p) => (
            <g
              key={p.id}
              className="scene-player"
              transform={`translate(${p.x * 10} ${p.y * 6.8})`}
              role="button"
              tabIndex={0}
              aria-label={`Voir le profil de ${p.name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(p.id);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(p.id);
              }}
              style={{ cursor: "pointer" }}
            >
              {p.id === me && (
                <ellipse
                  cy="3"
                  rx="27"
                  ry="8"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  fill="none"
                />
              )}
              <Avatar
                id={p.id}
                color={p.color}
                hair={p.hair}
                variant={p.slot - 1}
                outfit={p.outfit}
                layers={p.id === me ? wornLayers : undefined}
              />
              <rect
                x="-40"
                y="13"
                width="80"
                height="25"
                rx="12"
                fill="#fffaf6"
                fillOpacity=".95"
              />
              <text
                y="30"
                textAnchor="middle"
                fontFamily="sans-serif"
                fontSize="12"
                fontWeight="600"
                fill="#504653"
              >
                {p.name}
                {p.id === me ? " · toi" : ""}
              </text>
            </g>
          ))}
        {/* Drawn after every player so a bubble is never hidden behind someone. */}
        {players.filter((p) => bubbles[p.id]).map((p) => (
          <foreignObject key={bubbles[p.id].id} x={p.x * 10 - 110} y={p.y * 6.8 - 262}
            width="220" height="74" className="speech-bubble-slot" aria-hidden="true">
            <div className="speech-bubble-wrap"><div className="speech-bubble">{bubbles[p.id].body}</div></div>
          </foreignObject>
        ))}
      </svg>
    </div>
  );
}

const BUBBLE_MS = 6000;

/** The latest line of each speaker, kept a few seconds; the history present on arrival is ignored. */
function useSpeechBubbles(messages: RoomMessage[] | undefined) {
  const [bubbles, setBubbles] = useState<Record<string, RoomMessage>>({});
  const seen = useRef<string | null | undefined>(undefined);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mountedAt = useRef(Date.now());
  const latest = messages?.at(-1)?.id ?? null;
  useEffect(() => {
    if (!messages) return;
    // The history sent when joining is not news; a first line long after arriving is.
    if (seen.current === undefined) {
      seen.current = Date.now() - mountedAt.current < 2000 ? latest : null;
      if (seen.current === latest) return;
    }
    if (latest === seen.current) return;
    const fresh = messages.slice(messages.findIndex((m) => m.id === seen.current) + 1);
    seen.current = latest;
    if (!fresh.length) return;
    setBubbles((current) => {
      const next = { ...current };
      for (const message of fresh) next[message.sender] = message;
      return next;
    });
    const ids = new Set(fresh.map((m) => m.id));
    timers.current.push(setTimeout(() => setBubbles((current) =>
      Object.fromEntries(Object.entries(current).filter(([, m]) => !ids.has(m.id)))), BUBBLE_MS));
  }, [latest, messages]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return bubbles;
}
