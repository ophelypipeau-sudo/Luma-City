import { useEffect, useRef } from "react";
import { Coins, RotateCcw, ShoppingBag, X } from "lucide-react";
import { GarmentThumbnail } from "./FittingAvatar";
import { CATEGORY_LABELS, type CatalogItem } from "./catalog";
export function TryOnHistory({
  characterId,
  items,
  onClose,
  onRemove,
  onClear,
  onTry,
}: {
  characterId: string;
  items: CatalogItem[];
  onClose: () => void;
  onRemove: (item: CatalogItem) => void;
  onClear: () => void;
  onTry: (item: CatalogItem) => void;
}) {
  const dialog = useRef<HTMLElement>(null),
    close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    return () => previous?.focus();
  }, []);
  useEffect(() => {
    if (
      !dialog.current?.contains(document.activeElement) ||
      (document.activeElement as HTMLElement | null)?.hasAttribute("disabled")
    )
      close.current?.focus();
  }, [items.length]);
  return (
    <div
      className="tryon-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="tryon-history-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tryon-history-title"
        ref={dialog}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
          if (e.key === "Tab") {
            const nodes = [
                ...dialog.current!.querySelectorAll<HTMLButtonElement>(
                  "button:not(:disabled)",
                ),
              ],
              first = nodes[0],
              last = nodes.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header>
          <div>
            <span>HISTORIQUE D’ESSAYAGE</span>
            <h2 id="tryon-history-title">
              {items.length} {items.length === 1 ? "article" : "articles"}
            </h2>
          </div>
          <button
            ref={close}
            className="history-dialog-close"
            aria-label="Fermer l’historique d’essayage"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="tryon-history-list">
          {items.length ? (
            items.map((item) => (
              <article key={item.id} className="tryon-history-row">
                <button
                  className="history-item-art"
                  aria-label={`Réessayer ${item.name}`}
                  onClick={() => onTry(item)}
                >
                  <GarmentThumbnail
                    characterId={characterId}
                    category={item.category}
                    variant={item.variant}
                  />
                </button>
                <div className="history-item-description">
                  <strong>{item.name}</strong>
                  <small>
                    <i style={{ background: item.tint }} />
                    {CATEGORY_LABELS[item.category]} · Essayé
                  </small>
                  <button onClick={() => onTry(item)}>Réessayer</button>
                </div>
                <div className="history-item-purchase">
                  <span>
                    <Coins size={17} />
                    <b>—</b>
                  </span>
                  <button disabled title="Les prix ne sont pas encore définis">
                    Acheter
                  </button>
                </div>
                <button
                  className="history-item-remove"
                  aria-label={`Retirer ${item.name} de l’historique`}
                  onClick={() => onRemove(item)}
                >
                  <X size={13} />
                </button>
              </article>
            ))
          ) : (
            <div className="tryon-history-empty">
              <ShoppingBag size={36} />
              <h3>Ton essayage commence ici</h3>
              <p>Essaie un vêtement pour le retrouver dans cette liste.</p>
            </div>
          )}
        </div>
        <footer>
          <button
            className="clear-tryon-history"
            disabled={!items.length}
            onClick={onClear}
          >
            <RotateCcw size={20} />
            <span>Tout effacer</span>
          </button>
          <div className="history-total">
            <span>Montants à définir</span>
            <small>Aucun achat effectué</small>
          </div>
          <button className="buy-all-history" disabled>
            <ShoppingBag size={15} />
            Tout acheter
          </button>
        </footer>
      </section>
    </div>
  );
}
