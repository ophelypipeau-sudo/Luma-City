import { useState } from "react";
import { ChevronLeft, ChevronRight, Gamepad2, Heart, Star, X } from "lucide-react";
import { levelProgress, type RankingEntry } from "../../../packages/contracts/src/index";
import { Portrait } from "./Avatar";
import "./server-ranking.css";

const categories = [
  { key: "xp", label: "LVL", Icon: Star, value: (n: number) => `Niv. ${levelProgress(n).level}` },
  { key: "profileLikes", label: "J’aime du profil", Icon: Heart, value: (n: number) => String(n) },
  { key: "bestScore", label: "Jeux vidéo", Icon: Gamepad2, value: (n: number) => `${n} pts` },
] as const;
const pageSize = 5;

function RankingColumn({ title, entries, status, onSelect }: {
  title: string;
  entries: RankingEntry[] | null;
  status: string;
  onSelect: (id: string) => void;
}) {
  const [category, setCategory] = useState<(typeof categories)[number]>(categories[0]);
  const [page, setPage] = useState(0);
  const ranked = entries?.slice().sort((a, b) =>
    b[category.key] - a[category.key] || a.name.localeCompare(b.name, "fr") || a.id.localeCompare(b.id));
  const pages = Math.max(1, Math.ceil((ranked?.length ?? 0) / pageSize));
  const current = Math.min(page, pages - 1);
  return (
    <section className="server-ranking-column" aria-label={title}>
      <h2>{title}</h2>
      <div className="server-ranking-categories" role="group" aria-label={`Catégorie · ${title}`}>
        {categories.map((item) => (
          <button type="button" key={item.key} aria-pressed={item === category}
            onClick={() => { setCategory(item); setPage(0); }}>
            <item.Icon aria-hidden="true" /><span>{item.label}</span>
          </button>
        ))}
      </div>
      <ol className="server-ranking-rows" start={current * pageSize + 1}>
        {ranked?.slice(current * pageSize, (current + 1) * pageSize).map((player, index) => (
          <li key={player.id}>
            <button type="button" onClick={() => onSelect(player.id)}>
              <span className="portrait-circle"><Portrait {...player} /></span>
              <strong>{player.name}</strong>
              <span>{category.value(player[category.key])}</span>
              <span className="server-ranking-medal" aria-label={`Rang ${current * pageSize + index + 1}`}>
                {current * pageSize + index + 1}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {status ? <p role="alert">{status}</p> : !ranked ? <p>Chargement…</p>
        : !ranked.length ? <p>{title === "Mes amis" ? "Tes amis apparaîtront ici." : "Aucun joueur classé."}</p> : null}
      <nav className="server-ranking-pages" aria-label={`Pages · ${title}`}>
        <button type="button" aria-label="Page précédente" disabled={current === 0}
          onClick={() => setPage(current - 1)}><ChevronLeft size={19} /></button>
        <span aria-live="polite">{current + 1} / {pages}</span>
        <button type="button" aria-label="Page suivante" disabled={current + 1 >= pages}
          onClick={() => setPage(current + 1)}><ChevronRight size={19} /></button>
      </nav>
    </section>
  );
}

export function ServerRanking({ entries, status, onSelect, onClose }: {
  entries: RankingEntry[] | null;
  status: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return <div className="server-ranking">
    <button type="button" className="server-ranking-close" aria-label="Fermer le Top serveur"
      onClick={onClose}><X size={17} aria-hidden="true" /></button>
    <RankingColumn title="Mes amis" entries={entries?.filter((entry) => entry.friend) ?? null} status={status} onSelect={onSelect} />
    <RankingColumn title="Top serveur" entries={entries} status={status} onSelect={onSelect} />
  </div>;
}
