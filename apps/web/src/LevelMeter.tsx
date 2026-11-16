import { useId, useState } from "react";
import { levelProgress } from "../../../packages/contracts/src/index";

const format = new Intl.NumberFormat("fr-FR");

/**
 * « Niv. 2 » et sa barre. Au survol (ou d'un toucher sur téléphone), une bulle
 * montre où l'on en est : « 60 / 400 XP, encore 340 XP pour le niveau 3 ».
 */
export function LevelMeter({ xp }: { xp: number }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const { level, earned, required } = levelProgress(xp);
  const left = required - earned;
  return (
    <div className="fame-level" data-revealed={open}>
      <button type="button" aria-label={`Niveau ${level}`} aria-describedby={id}
        onClick={() => setOpen(!open)} onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          setOpen(false);
          event.currentTarget.blur();
        }}>
        <span>Niv. {level}</span>
        <span className="fame-track" role="progressbar" aria-label="Progression du niveau"
          aria-valuenow={earned} aria-valuemax={required}>
          <span style={{ width: `${100 * earned / required}%` }} />
        </span>
      </button>
      <span id={id} className="wallet-exact fame-exact" role="tooltip">
        <strong>{format.format(earned)} / {format.format(required)} XP</strong>
        <span>Encore {format.format(left)} XP pour le niveau {level + 1}</span>
      </span>
    </div>
  );
}
