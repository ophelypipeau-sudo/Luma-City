import { useEffect, useRef, useState } from "react";
import type { FurnitureCommerce, FurnitureOffer, HomeSnapshot, OwnedFurniture } from "../../../../packages/contracts/src/housing";
import { FURNITURE_MODELS, furnitureModel } from "../../../../packages/domain/src/housing";
import { FurnitureArt } from "./HomeScene";
import { housingRequest as request, HousingRequestError } from "./home-http";

export function FurnitureCollection({ generation, home, onInventory, onClose, onDecorate }: {
  generation: number; home: HomeSnapshot; onInventory: (items: OwnedFurniture[]) => void;
  onClose: () => void; onDecorate: () => void;
}) {
  const [commerce, setCommerce] = useState<FurnitureCommerce | null>(null);
  const [catalog, setCatalog] = useState(false), [filter, setFilter] = useState("all"), [query, setQuery] = useState("");
  const [choice, setChoice] = useState<FurnitureOffer | null>(null), [busy, setBusy] = useState(false);
  const [retryOffer, setRetryOffer] = useState<FurnitureOffer | null>(null);
  const [error, setError] = useState(""), [message, setMessage] = useState("");
  const operationKey = `furniture-purchase:${home.ownerId}`;
  const operation = useRef<{ signature: string; id: string } | null>(null);
  const inFlight = useRef(false), mounted = useRef(true);
  const inventoryCallback = useRef(onInventory); inventoryCallback.current = onInventory;
  async function load() {
    try {
      const data = await request("catalog", { generation });
      if (!mounted.current) return;
      setCommerce(data); inventoryCallback.current(data.home.items); setError(""); setChoice(null);
    } catch (failure) { if (mounted.current) setError((failure as Error).message); }
  }
  useEffect(() => {
    mounted.current = true;
    try {
      const saved = JSON.parse(sessionStorage.getItem(operationKey) ?? "null");
      if (typeof saved?.signature === "string" && /^[0-9a-f-]{36}$/i.test(saved?.id ?? "")) {
        const offer = JSON.parse(saved.signature);
        if (furnitureModel(offer.modelId) && /^[0-9a-f-]{36}$/i.test(offer.version ?? "") && Number.isSafeInteger(offer.price) && offer.price > 0) {
          operation.current = saved; setRetryOffer(offer);
        }
      }
    } catch { /* A damaged local retry record does not change server ownership. */ }
    void load(); return () => { mounted.current = false; };
  }, [generation]);
  async function buy() {
    if (!choice || inFlight.current) return;
    const signature = JSON.stringify(choice);
    if (operation.current?.signature !== signature) operation.current = { signature, id: crypto.randomUUID() };
    setRetryOffer(choice);
    try { sessionStorage.setItem(operationKey, JSON.stringify(operation.current)); } catch { /* Retry remains available in memory. */ }
    inFlight.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const receipt = await request("buy", { generation, operationId: operation.current.id,
        modelId: choice.modelId, offerVersion: choice.version, expectedPrice: choice.price });
      if (!mounted.current) return;
      inventoryCallback.current(receipt.home.items);
      setCommerce((current) => current && { ...current, balance: receipt.balance });
      setMessage(`Un exemplaire de ${furnitureModel(choice.modelId)?.name} a été ajouté à tes meubles rangés. Achat confirmé : ${receipt.price} pièces.`);
      setChoice(null); setRetryOffer(null); operation.current = null;
      try { sessionStorage.removeItem(operationKey); } catch { /* Confirmed receipt remains on the server. */ }
    } catch (failure) {
      if (mounted.current) {
        setError((failure as Error).message);
        if (failure instanceof HousingRequestError && failure.rejected) {
          operation.current = null; setRetryOffer(null);
          try { sessionStorage.removeItem(operationKey); } catch { /* The server rejected the operation without a charge. */ }
        }
      }
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  const visibleModels = catalog ? FURNITURE_MODELS.filter((m) => commerce?.offers.some((o) => o.modelId === m.id)) : FURNITURE_MODELS;
  return <aside className="furniture-collection" aria-label="Mes meubles" onPointerDown={(e) => e.stopPropagation()}>
    <header><div><strong>Mes meubles</strong><small>{home.items.length} exemplaires · {home.items.filter((i) => !i.roomId).length} rangé{home.items.filter((i) => !i.roomId).length > 1 ? "s" : ""}</small></div>
      <button type="button" disabled={busy} aria-label="Fermer Mes meubles" onClick={onClose}>Fermer</button></header>
    <nav aria-label="Collection de meubles">
      <button type="button" disabled={busy} aria-pressed={!catalog} onClick={() => { setCatalog(false); setChoice(null); }}>Inventaire</button>
      <button type="button" disabled={busy} aria-pressed={catalog} onClick={() => { setCatalog(true); setChoice(null); }}>Catalogue{commerce?.preview ? " d’essai" : ""}</button>
      {commerce && <span>{commerce.balance.toLocaleString("fr-FR")} pièces</span>}
    </nav>
    {catalog && commerce?.preview && <p>Essai local · prix de démonstration, meubles hors boutique publique.</p>}
    <div className="furniture-filters"><input aria-label="Rechercher un meuble" placeholder="Rechercher un meuble" value={query} onChange={(e) => setQuery(e.target.value)} />
      {!catalog && <select aria-label="Emplacement des meubles" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">Tous</option><option value="stored">Rangés</option><option value="placed">Dans le salon</option><option value="elsewhere">Autre pièce</option>
      </select>}</div>
    {error && <p role="alert">{error} <button type="button" disabled={busy} onClick={() => void load()}>Actualiser</button></p>}
    {message && <p role="status">{message}</p>}
    {retryOffer && !choice && <p>Un achat attend sa confirmation. <button type="button" disabled={busy}
      onClick={() => { setChoice(retryOffer); setError(""); }}>Vérifier le dernier achat</button></p>}
    {catalog && commerce?.offers.length === 0 && <p>Aucun meuble n’est en vente pour le moment.</p>}
    {!commerce && <p role="status">{error ? "Catalogue indisponible." : "Chargement…"}</p>}
    <div className="furniture-grid">{visibleModels.map((model) => {
      const items = home.items.filter((item) => item.modelId === model.id);
      const stored = items.filter((item) => !item.roomId).length;
      const placed = items.filter((item) => item.roomId === home.roomId).length;
      const elsewhere = items.length - stored - placed;
      if (!model.name.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")) || (!catalog &&
        (!items.length || (filter === "stored" && !stored) || (filter === "placed" && !placed) || (filter === "elsewhere" && !elsewhere)))) return null;
      const offer = commerce?.offers.find((o) => o.modelId === model.id);
      return <article key={model.id}><svg viewBox={`${-model.width / 2} ${-model.height} ${model.width} ${model.height}`} aria-hidden="true"><FurnitureArt model={model} thumbnail /></svg>
        <strong>{model.name}</strong><small>{stored} rangé{stored > 1 ? "s" : ""} · {placed} au salon{elsewhere ? ` · ${elsewhere} ailleurs` : ""}</small>
        {catalog && offer && <button type="button" disabled={busy || !commerce || commerce.balance < offer.price}
          onClick={() => { setChoice(offer); setError(""); setMessage(""); }}>Acheter {model.name} · {offer.price} pièces</button>}
      </article>;
    })}</div>
    {choice && <section className="furniture-confirm" aria-label="Confirmer l’achat">
      <p>Un exemplaire de {furnitureModel(choice.modelId)?.name} pour {choice.price} pièces ?</p>
      <button type="button" disabled={busy} onClick={() => void buy()}>{busy ? "Achat en cours…" : "Confirmer l’achat"}</button>
      <button type="button" disabled={busy} onClick={() => setChoice(null)}>Annuler</button>
    </section>}
    <footer><button type="button" disabled={busy} onClick={onDecorate}>Placer mes meubles</button></footer>
  </aside>;
}
