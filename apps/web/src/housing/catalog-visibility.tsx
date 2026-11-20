import { useEffect, useState } from "react";

/** Presentation preferences only: ownership and room placements are never changed. */
export function useCatalogVisibility(owner: string, scope: "finishes" | "furniture") {
  const key = `home-hidden-catalog:${owner}:${scope}`;
  function read() {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string" && id.length < 100).slice(0, 500) : [];
    } catch { return []; }
  }
  const [state, setState] = useState(() => ({ key, ids: read() }));
  const [storageFailed, setStorageFailed] = useState(false);
  useEffect(() => {
    setState({ key, ids: read() }); setStorageFailed(false);
    const sync = (event: StorageEvent) => {
      if (event.key === key || event.key === null) setState({ key, ids: read() });
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key]);
  const ids = state.key === key ? state.ids : [];
  function setHidden(id: string | readonly string[], hidden: boolean) {
    const targets = typeof id === "string" ? [id] : id;
    const next = hidden ? [...new Set([...ids, ...targets])] : ids.filter((value) => !targets.includes(value));
    setState({ key, ids: next });
    try { localStorage.setItem(key, JSON.stringify(next)); setStorageFailed(false); }
    catch { setStorageFailed(true); }
  }
  return { ids, setHidden, storageFailed };
}

export function CatalogVisibilityButton({ name, hidden, disabled, onClick }: {
  name: string; hidden: boolean; disabled: boolean; onClick: () => void;
}) {
  const label = `${hidden ? "Réafficher" : "Masquer"} ${name}`;
  return <button type="button" className="catalog-hide-button" aria-label={label} title={label} disabled={disabled} onClick={onClick}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      {hidden ? <path d="M4 10a8 8 0 1 1 1 9M4 4v6h6" /> : <>
        <path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" />
      </>}
    </svg>
  </button>;
}
