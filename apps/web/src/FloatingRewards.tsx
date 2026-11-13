import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import type { WheelPayout } from "../../../packages/contracts/src/index";
import { REWARD_PICKUP_LIMIT } from "../../../packages/domain/src/arcade";
import "./floating-rewards.css";

const COLLECT_AFTER_MS = 8000;
const scatterPoints = [
  [50, 48], [28, 30], [72, 31], [32, 68], [68, 68],
];
const counter = {
  xp: ".fame-track",
  coins: ".money-counter.monnaie button",
  diamonds: ".money-counter.diamants button",
};
type WalletPickup = WheelPayout & { ids?: string[] };
export type Collectible = WalletPickup | { id: string; currency: "xp"; amount: number; points: number };

/** Existing wheel spins can still have four small drops at each of the five destinations. */
export function walletPickups(pending: readonly WheelPayout[]): WalletPickup[] {
  const groups = new Map<string, WalletPickup>();
  for (const drop of pending) {
    const slot = (drop.slot ?? 0) % REWARD_PICKUP_LIMIT;
    const key = drop.burst ? `${drop.burst}:${slot}` : drop.id;
    const group = groups.get(key);
    if (group) {
      group.amount += drop.amount;
      (group.ids ??= []).push(drop.id);
    } else {
      groups.set(key, { ...drop, slot });
    }
  }
  return [...groups.values()];
}

function Reward({ reward, collect, style }: {
  reward: Collectible;
  collect: (reward: Collectible) => Promise<void>;
  style?: CSSProperties;
}) {
  const [collecting, setCollecting] = useState(false);
  const [retry, setRetry] = useState(0);
  const icon = useRef<HTMLSpanElement>(null);
  const inflight = useRef(false);
  const action = useRef(collect);
  action.current = collect;
  const item = useRef(reward);
  item.current = reward;
  const singular = reward.amount === 1;
  const unit = reward.currency === "xp" ? "XP"
    : reward.currency === "coins" ? singular ? "pièce" : "pièces"
      : singular ? "diamant" : "diamants";
  const pickup = useRef<() => void>(() => {});
  pickup.current = async () => {
    if (inflight.current) return;
    inflight.current = true;
    setCollecting(true);
    const earned = item.current;
    const target = document.querySelector<HTMLElement>(counter[earned.currency]);
    const sprite = icon.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && sprite && target) {
      const from = sprite.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const x = to.left + (to.width - from.width) / 2 - from.left;
      const y = to.top + (to.height - from.height) / 2 - from.top;
      // A fixed sprite can cross the edge of a scrollable reward dialog.
      Object.assign(sprite.style, {
        position: "fixed",
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
      });
      await sprite.animate([
        { transform: "translate(0, 0) scale(1)", offset: 0 },
        { transform: `translate(${x * .22}px, ${Math.min(-24, y * .36)}px) scale(1.13)`, offset: .33 },
        { transform: `translate(${x}px, ${y}px) scale(.26)`, opacity: .18 },
      ], { duration: 620, easing: "cubic-bezier(.23,.62,.36,1)", fill: "forwards" }).finished.catch(() => {});
    }
    try {
      await action.current(earned);
      if (!reduce) target?.animate(
        [{ filter: "brightness(1.55)" }, { filter: "brightness(1)" }],
        { duration: 360, easing: "ease-out" },
      );
    } catch {
      sprite?.getAnimations().forEach((animation) => animation.cancel());
      sprite?.removeAttribute("style");
      inflight.current = false;
      setCollecting(false);
      setRetry((count) => count + 1);
    }
  };
  const autoCollect = !("points" in reward);
  useEffect(() => {
    if (!autoCollect) return;
    const timer = window.setTimeout(() => pickup.current(), COLLECT_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [retry, autoCollect]);
  return (
    <button type="button" className="floating-reward"
      style={style}
      data-pickup={collecting} data-currency={reward.currency}
      aria-label={`Ramasser ${reward.amount} ${unit}`}
      onPointerEnter={(event) => { if (event.pointerType !== "touch") pickup.current(); }}
      onClick={() => pickup.current()}>
      <span className="floating-reward-icon" ref={icon}>
        <img alt="" src={reward.currency === "coins" ? "/assets/wallet/billet-rose.png"
          : reward.currency === "xp" ? "/assets/wallet/etoile-xp.png" : "/assets/wallet/diamants.png"} />
      </span>
      <Sparkles className="floating-reward-spark" aria-hidden="true" />
      <b>+{reward.amount}{reward.currency === "xp" ? " XP" : ""}</b>
    </button>
  );
}

export function FloatingRewards({ rewards, collect, inDialog = false, burstOrigin }: {
  rewards: readonly Collectible[];
  collect: (reward: Collectible) => Promise<void>;
  inDialog?: boolean;
  burstOrigin?: { id: string; x: number; y: number };
}) {
  if (!rewards.length) return null;
  const scattered = rewards.filter((reward) => "burst" in reward && reward.burst);
  const ordinary = rewards.filter((reward) => !("burst" in reward && reward.burst));
  return <>
    {ordinary.length > 0 && <div className={`floating-rewards${inDialog ? " in-dialog" : ""}`} aria-label="Récompenses à ramasser">
      {ordinary.map((reward) => <Reward key={`${reward.id}:${reward.amount}`} reward={reward} collect={collect} />)}
    </div>}
      {scattered.length > 0 && <div className="floating-rewards coin-scatter" aria-label="Gains de la roue à ramasser">
      {scattered.map((reward) => {
        if (!("burst" in reward)) return null;
        const slot = reward.slot ?? 0;
        const origin = burstOrigin?.id === reward.burst ? burstOrigin : undefined;
        const offset = parseInt(reward.id.slice(0, 4), 16) || 0;
        const [x, y] = scatterPoints[slot % scatterPoints.length];
        return <Reward key={reward.id} reward={reward} collect={collect}
          style={{
            "--coin-offset-x": (x + (offset % 5) - 52) / 100,
            "--coin-offset-y": (y + ((offset >>> 4) % 5) - 52) / 100,
            "--burst-x": origin ? `${origin.x}px` : "50%",
            "--burst-y": origin ? `${origin.y}px` : "46%",
            "--coin-delay": `${(slot % 8) * 34 + (offset % 4) * 8}ms`,
          } as CSSProperties} />;
      })}
    </div>}
  </>;
}
