import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PrizeWheel } from "../../apps/web/src/Arcade";
import { FloatingRewards, type Collectible } from "../../apps/web/src/FloatingRewards";
import { splitReward, WHEEL_PRIZES } from "../../packages/domain/src/arcade";
import "../../apps/web/src/arcade.css";
import "../../apps/web/src/world-panel.css";

function Fixture() {
  const [open, setOpen] = useState(true);
  const [balance, setBalance] = useState(0);
  const [rewards, setRewards] = useState<Collectible[]>([]);
  const [burstOrigin, setBurstOrigin] = useState<{ id: string; x: number; y: number }>();
  return <>
    <div className="money-counter monnaie"><button type="button">Monnaie : {balance}</button></div>
    {open && <PrizeWheel wheel={{ tickets: rewards.length ? 0 : 1, pending: [], accountCoins: 0, accountDiamonds: 0 }}
      onClose={() => setOpen(false)} onSpin={async (burst) => ({
        index: 1,
        prize: WHEEL_PRIZES[1],
        reveal: () => setRewards(splitReward(WHEEL_PRIZES[1].amount).map((amount, slot) => ({
          id: crypto.randomUUID(), currency: "coins", amount, burst, slot,
        }))),
      })}
      onBurst={(id, origin) => { setBurstOrigin({ id, ...origin }); setOpen(false); }} />}
    {!open && <FloatingRewards rewards={rewards} burstOrigin={burstOrigin}
      collect={async ({ id, amount }) => {
        setRewards((items) => items.filter((item) => item.id !== id));
        setBalance((value) => value + amount);
      }} />}
  </>;
}

createRoot(document.getElementById("fixture")!).render(<Fixture />);
