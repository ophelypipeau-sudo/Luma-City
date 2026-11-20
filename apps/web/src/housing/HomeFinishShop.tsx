import { useEffect, useRef, useState } from "react";
import type { HomeDecoration } from "../../../../packages/contracts/src/housing";
import { FINISH_CATEGORIES, HOME_FINISHES, finishCategory, homeFinish, finishDecoration, type FinishCategory, type HomeFinish } from "../../../../packages/domain/src/home-finishes";
import { HomeBackground } from "./HomeScene";
import { housingRequest, HousingRequestError } from "./home-http";
import "./home-finish-shop.css";

type Catalog = { offers: (HomeFinish & { version: string })[]; owned: string[]; balance: number };
type Command = { finishId: string; offerVersion: string; expectedPrice: number; operationId: string };
export function HomeFinishShop({ generation, owner, kind, decoration, disabled, hidden, onTry, onKind, onInventory, onBusy }: {
  generation: number; owner: string; kind: "wall" | "floor"; decoration: HomeDecoration; disabled: boolean; hidden: boolean;
  onTry: (finish: HomeFinish) => void; onKind: (kind: "wall" | "floor") => void;
  onInventory: (owned: string[], balance: number) => void; onBusy: (busy: boolean) => void;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [categories, setCategories] = useState<Record<"wall" | "floor", FinishCategory>>({ wall: "wallpaper", floor: "parquet" });
  const [choice, setChoice] = useState<Command | null>(null), [retry, setRetry] = useState<Command | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const mounted = useRef(true), inFlight = useRef(false), readVersion = useRef(0);
  const inventoryCallback = useRef(onInventory), busyCallback = useRef(onBusy);
  inventoryCallback.current = onInventory; busyCallback.current = onBusy;
  const confirmation = useRef<HTMLElement>(null);
  const operationKey = `home-finish-purchase:${owner}`;
  const visibleChoice = choice && homeFinish(choice.finishId)?.kind === kind ? choice : null;
  useEffect(() => { confirmation.current?.scrollIntoView({ block: "nearest", behavior: "auto" }); }, [visibleChoice]);
  async function load() {
    if (inFlight.current) return;
    const version = ++readVersion.current;
    try { const data = await housingRequest<Catalog>("finishes", { generation });
      if (mounted.current && version === readVersion.current) { setCatalog(data); inventoryCallback.current(data.owned, data.balance); setError(""); }
    } catch (failure) { if (mounted.current && version === readVersion.current) setError((failure as Error).message); }
  }
  useEffect(() => {
    mounted.current = true; void load();
    try { const command = JSON.parse(sessionStorage.getItem(operationKey) ?? "null");
      if (homeFinish(command?.finishId) && typeof command.offerVersion === "string" && Number.isSafeInteger(command.expectedPrice) && command.expectedPrice > 0 && /^[0-9a-f-]{36}$/i.test(command.operationId)) setRetry(command);
    } catch { /* Local retry data cannot grant ownership. */ }
    return () => { mounted.current = false; readVersion.current++; };
  }, [generation, owner]);
  async function buy(command: Command) {
    if (inFlight.current || disabled) return;
    readVersion.current++; inFlight.current = true; setBusy(true); busyCallback.current(true);
    setError(""); setMessage(""); setRetry(command);
    try { sessionStorage.setItem(operationKey, JSON.stringify(command)); } catch { /* Retain the same command in memory. */ }
    try {
      const data = await housingRequest<Catalog>("finishes/buy", { generation, ...command });
      try { sessionStorage.removeItem(operationKey); } catch { /* Receipt remains on the server. */ }
      if (mounted.current) {
        setCatalog(data); inventoryCallback.current(data.owned, data.balance); setRetry(null); setChoice(null);
        setMessage("Achat confirmé. Tu peux maintenant enregistrer ton décor.");
      }
    } catch (failure) { if (mounted.current) {
      setError((failure as Error).message);
      if (failure instanceof HousingRequestError && failure.rejected) {
        setRetry(null); setChoice(null); try { sessionStorage.removeItem(operationKey); } catch { /* No charge. */ }
      }
    } } finally { inFlight.current = false; if (mounted.current) { setBusy(false); busyCallback.current(false); } }
  }
  const locked = disabled || busy, category = categories[kind];
  return <section className="home-finish-shop" hidden={hidden} aria-label={kind === "wall" ? "Boutique de murs dans la maison" : "Boutique de sols dans la maison"}>
    <header><strong>{kind === "wall" ? "Murs" : "Sols"}</strong><span>{catalog ? `${catalog.balance.toLocaleString("fr-FR")} pièces` : "Chargement…"}</span></header>
    <p className="home-trial-hint">Clique sur un modèle pour l’essayer dans ta maison. L’essai est gratuit.</p>
    <nav className="finish-category-buttons" aria-label={kind === "wall" ? "Types de murs" : "Types de sols"}>
      {[...FINISH_CATEGORIES.filter((c) => c.kind === kind), { id: "included" as const, name: "Déjà inclus", kind }].map((item) =>
        <button type="button" key={item.id} data-material={item.id} aria-pressed={category === item.id} disabled={locked}
          onClick={() => { setCategories((current) => ({ ...current, [kind]: item.id })); setChoice(null); setMessage(""); }}>
          <span className="finish-category-sample" aria-hidden="true" /><span>{item.name}<small>{HOME_FINISHES.filter((f) => f.kind === kind && finishCategory(f) === item.id).length} modèles</small></span>
        </button>)}
    </nav>
    {error && <p role="alert">{error} <button type="button" disabled={locked} onClick={() => void load()}>Actualiser</button></p>}
    {message && <p role="status">{message}</p>}
    {retry && !visibleChoice && <p>Un achat attend sa confirmation. <button type="button" disabled={locked} onClick={() => {
      const pending = homeFinish(retry.finishId)!; onKind(pending.kind); onTry(pending); setCategories((current) => ({ ...current, [pending.kind]: finishCategory(pending) })); setChoice(retry);
    }}>Vérifier le dernier achat</button></p>}
    {visibleChoice && <section ref={confirmation} className="finish-purchase-confirm" aria-label="Confirmer le revêtement">
      <p>Débloquer {homeFinish(visibleChoice.finishId)?.name} pour {visibleChoice.expectedPrice} pièces ?</p>
      <button type="button" disabled={locked} onClick={() => void buy(visibleChoice)}>{busy ? "Confirmation…" : retry ? "Vérifier l’achat" : "Confirmer l’achat"}</button>
      <button type="button" disabled={locked} onClick={() => setChoice(null)}>Continuer les essais</button>
    </section>}
    <div className="finish-catalog">{catalog?.offers.filter((f) => f.kind === kind && finishCategory(f) === category).map((offer) => {
      const selected = decoration[kind] === offer.value, owned = catalog.owned.includes(offer.id);
      return <article key={offer.id} className={selected ? "is-selected" : ""}>
        <button className="finish-preview-button" type="button" aria-label={`Essayer ${offer.name}`} aria-pressed={selected} disabled={locked}
          onClick={() => { onTry(offer); setChoice(null); setMessage(""); }}>
          <svg viewBox="0 0 1000 680" aria-hidden="true"><HomeBackground {...finishDecoration(offer, decoration)} /></svg><strong>{offer.name}</strong>
          <small>{selected ? "Dans la maison" : "Essayer"}</small></button>
        {owned ? <span className="finish-owned">✓ Possédé</span> : <button type="button" disabled={locked || !!retry || catalog.balance < offer.price} onClick={() => {
          onTry(offer); setChoice({ finishId: offer.id, offerVersion: offer.version, expectedPrice: offer.price, operationId: crypto.randomUUID() }); setError("");
        }}>Acheter · {offer.price} pièces</button>}
      </article>;
    })}</div>
  </section>;
}
