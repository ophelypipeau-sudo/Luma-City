import { useEffect, useState } from "react";
import type { Presence } from "../../../../packages/contracts/src/index";
import { sampleHomeMotion } from "../../../../packages/domain/src/home-navigation";

/** Interpolate whole static sprites against the server clock, not CSS destinations. */
export function useRoomMotion(players: Presence[], enabled: boolean, serverTime?: number, receivedAt?: number) {
  const [frame, setFrame] = useState(() => performance.now());
  useEffect(() => {
    if (!enabled) return;
    let request = 0, mounted = true;
    const advance = (time: number) => {
      if (!mounted) return;
      setFrame(time);
      const now = serverTime === undefined || receivedAt === undefined ? Date.now() : serverTime + Math.max(0, time - receivedAt);
      if (players.some((p) => p.motion && !sampleHomeMotion(p.motion, now).done)) request = requestAnimationFrame(advance);
    };
    advance(performance.now());
    return () => { mounted = false; cancelAnimationFrame(request); };
  }, [players, enabled, serverTime, receivedAt]);
  if (!enabled) return players;
  const now = serverTime === undefined || receivedAt === undefined ? Date.now() : serverTime + Math.max(0, frame - receivedAt);
  return players.map((p) => {
    if (!p.motion) return p;
    const point = sampleHomeMotion(p.motion, now);
    return { ...p, x: point.x / 10, y: point.y / 6.8 };
  });
}
