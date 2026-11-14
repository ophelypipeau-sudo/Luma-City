import { useId, useState } from "react";

const exactFormat = new Intl.NumberFormat("fr-FR");
const compactFormat = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function WalletCounter({
  kind,
  amount,
}: {
  kind: "monnaie" | "diamants";
  amount: number;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const exact = exactFormat.format(amount);
  const unit = kind === "monnaie" ? (amount > 1 ? "pièces" : "pièce") : amount > 1 ? "diamants" : "diamant";
  const display = amount >= 100_000 ? compactFormat.format(amount) : exact;
  return (
    <div className={`money-counter ${kind}`} data-revealed={open}>
      <button
        type="button"
        aria-label={`${exact} ${unit}`}
        aria-describedby={id}
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            event.currentTarget.blur();
          }
        }}
      >
        <img
          className="money-medal"
          src={`/assets/wallet/${kind}.png`}
          alt=""
        />
        <span>
          <b aria-hidden="true">{display}</b>
          <small aria-hidden="true">{unit}</small>
        </span>
      </button>
      <span id={id} className="wallet-exact" role="tooltip" aria-live="polite">
        {exact} {unit}
      </span>
    </div>
  );
}
