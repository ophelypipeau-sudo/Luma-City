import { useEffect, useRef, useState, type ReactNode } from "react";
import { FINISH_OFFER_VERSION, homeFinish, finishDecoration, type HomeFinish } from "../../../../packages/domain/src/home-finishes";
import { HomeBackground } from "./HomeScene";
import { housingRequest, HousingRequestError } from "./home-http";
import "./finish-shop.css";

type Catalog = { offers: (HomeFinish & { version: string })[]; owned: string[]; balance: number };
type Command = { finishId: string; offerVersion: string; expectedPrice: number; operationId: string };
export function ShopDepartments({ generation, owner, children, onBalance, onHome }: {
  generation: number; owner: string; children: ReactNode; onBalance: (balance: number) => void; onHome: () => void;
}) {
  const [department, setDepartment] = useState<"clothes" | "wall" | "floor">("clothes");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selected, setSelected] = useState("wall:midnight");
  const [choice, setChoice] = useState<Command | null>(null), [retry, setRetry] = useState<Command | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const mounted = useRef(true), inFlight = useRef(false), balanceCallback = useRef(onBalance);
  const panel = useRef<HTMLElement>(null), confirmation = useRef<HTMLElement>(null);
  balanceCallback.current = onBalance;
  const operationKey = `home-finish-purchase:${owner}`;
  useEffect(() => { panel.current?.scrollTo({ top: 0 }); }, [department]);
  useEffect(() => { confirmation.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [choice]);
  async function load() {
    try { const data = await housingRequest<Catalog>("finishes", { generation });
      if (mounted.current) { setCatalog(data); balanceCallback.current(data.balance); setError(""); }
    } catch (failure) { if (mounted.current) setError((failure as Error).message); }
  }
  useEffect(() => {
    mounted.current = true; void load();
    try { const command = JSON.parse(sessionStorage.getItem(operationKey) ?? "null");
      if (homeFinish(command?.finishId) && typeof command.offerVersion === "string" && Number.isSafeInteger(command.expectedPrice) && command.expectedPrice > 0 && /^[0-9a-f-]{36}$/i.test(command.operationId)) setRetry(command);
    } catch { /* Invalid local data never grants ownership. */ }
    return () => { mounted.current = false; };
  }, [generation, owner]);
  async function buy(command: Command) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setMessage(""); setRetry(command);
    try { sessionStorage.setItem(operationKey, JSON.stringify(command)); } catch { /* Retry remains available in memory. */ }
    try {
      const data = await housingRequest<Catalog>("finishes/buy", { generation, ...command });
      try { sessionStorage.removeItem(operationKey); } catch { /* Server receipt is durable. */ }
      if (mounted.current) {
        setCatalog(data); balanceCallback.current(data.balance); setRetry(null); setChoice(null);
        setMessage(`${homeFinish(command.finishId)?.name} est disponible dans Décorer.`);
      }
    } catch (failure) { if (mounted.current) {
      setError((failure as Error).message);
      if (failure instanceof HousingRequestError && failure.rejected) {
        setRetry(null); setChoice(null); try { sessionStorage.removeItem(operationKey); } catch { /* No charge. */ }
      }
    } } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  const finish = homeFinish(selected)!;
  const preview = finishDecoration(finish, { wall: "ivory", floor: "oak", placements: [] });
  return <div className="shop-departments">
    <nav className="shop-department-tabs" aria-label="Rayons de la boutique">
      {([["clothes", "Vêtements"], ["wall", "Murs"], ["floor", "Sols"]] as const).map(([id, name]) => <button type="button" key={id} disabled={busy}
        aria-pressed={department === id} onClick={() => { setDepartment(id); setChoice(null); setMessage(""); if (id !== "clothes") { setSelected(id === "wall" ? "wall:midnight" : "floor:walnut"); void load(); } }}>{name}</button>)}
    </nav>
    <div className="shop-clothing-content" hidden={department !== "clothes"}>{children}</div>
    <section ref={panel} className="finish-shop" hidden={department === "clothes"} aria-label={department === "floor" ? "Boutique de sols" : "Boutique de murs"}>
      <header><div><h2>{department === "floor" ? "Sols & parquets" : "Murs & papiers peints"}</h2><p>Un achat, à réutiliser dans ta maison autant de fois que tu veux.</p></div>
        <strong>{catalog ? `${catalog.balance.toLocaleString("fr-FR")} pièces` : "Chargement…"}</strong><button type="button" disabled={busy} onClick={onHome}>Ma maison</button></header>
      {error && <p role="alert">{error} <button type="button" disabled={busy} onClick={() => void load()}>Actualiser</button></p>}
      {message && <p role="status">{message}</p>}
      {retry && !choice && <p>Un achat attend sa confirmation. <button type="button" disabled={busy} onClick={() => { setSelected(retry.finishId); setChoice(retry); }}>Vérifier le dernier achat</button></p>}
      <div className="finish-shop-layout"><div className="finish-catalog">
        {catalog?.offers.filter((f) => f.kind === department).map((offer) => <article key={offer.id} className={selected === offer.id ? "is-selected" : ""}>
          <button className="finish-preview-button" type="button" aria-label={`Voir ${offer.name}`} aria-pressed={selected === offer.id} disabled={busy} onClick={() => { setSelected(offer.id); setChoice(null); }}>
            <svg viewBox="0 0 1000 680" aria-hidden="true"><HomeBackground {...finishDecoration(offer, { wall: "ivory", floor: "oak", placements: [] })} /></svg><strong>{offer.name}</strong></button>
          {catalog.owned.includes(offer.id) ? <span className="finish-owned">✓ Possédé</span> : <button type="button" disabled={busy || !!retry || catalog.balance < offer.price} onClick={() => {
            setSelected(offer.id); setChoice({ finishId: offer.id, offerVersion: offer.version ?? FINISH_OFFER_VERSION, expectedPrice: offer.price, operationId: crypto.randomUUID() }); setError("");
          }}>Acheter · {offer.price} pièces</button>}
        </article>)}
      </div><aside className="finish-room-preview" aria-label="Aperçu du revêtement"><svg viewBox="0 0 1000 680" role="img" aria-label={`Aperçu : ${finish.name}`}><HomeBackground {...preview} /></svg><h3>{finish.name}</h3><p>Les meubles et la fenêtre restent à leur place. L’achat débloque le revêtement ; tu l’appliques ensuite dans Décorer.</p>
        {choice && <section ref={confirmation} className="finish-purchase-confirm" aria-label="Confirmer le revêtement"><p>{homeFinish(choice.finishId)?.name} pour {choice.expectedPrice} pièces ?</p>
          <button type="button" disabled={busy} onClick={() => void buy(choice)}>{busy ? "Confirmation…" : retry ? "Vérifier l’achat" : "Confirmer l’achat"}</button>
          <button type="button" disabled={busy} onClick={() => setChoice(null)}>Annuler</button></section>}
      </aside></div>
    </section>
  </div>;
}
