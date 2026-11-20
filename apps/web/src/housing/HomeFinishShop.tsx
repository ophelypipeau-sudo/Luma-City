import { useEffect, useId, useRef, useState } from "react";
import type { HomeDecoration } from "../../../../packages/contracts/src/housing";
import { homeFinish, finishDecoration, isColorableWall, finishVisualFamily, distinctFinishOffers, type HomeFinish } from "../../../../packages/domain/src/home-finishes";
import { HomeBackground } from "./HomeScene";
import { FinishPattern } from "./FinishPattern";
import { CatalogVisibilityButton, useCatalogVisibility } from "./catalog-visibility";
import { housingRequest, HousingRequestError } from "./home-http";
import "./home-finish-shop.css";

type Catalog = { offers: (HomeFinish & { version: string })[]; owned: string[]; balance: number };
type Command = { finishId: string; offerVersion: string; expectedPrice: number; operationId: string };
function ColorCode({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <label>{label}<input type="text" aria-label={label} value={draft} disabled={disabled} maxLength={7} spellCheck={false}
    onChange={(event) => { const next = event.target.value; setDraft(next); if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next); }}
    onBlur={() => { if (!/^#[0-9a-fA-F]{6}$/.test(draft)) setDraft(value); }}
    onKeyDown={(event) => { if (event.key === "Escape") setDraft(value); }} /></label>;
}
function WallSample({ finish, colors }: { finish: HomeFinish; colors: HomeDecoration["wallColors"] }) {
  if (finish.kind === "floor") return <FloorSample finish={finish} colors={colors} />;
  return <WallpaperSample finish={finish} colors={colors} />;
}
function FloorSample({ finish, colors }: { finish: HomeFinish; colors: HomeDecoration["floorColors"] }) {
  return <svg className="wall-detail-sample" viewBox="300 440 310 230" role="img" aria-label={`Sol ${finish.name} en grand`}>
    <HomeBackground wall="ivory" floor={finish.value as HomeDecoration["floor"]} floorColors={colors} />
  </svg>;
}
function WallpaperSample({ finish, colors }: { finish: HomeFinish; colors: HomeDecoration["wallColors"] }) {
  const id = useId().replace(/:/g, "") + "-sample";
  const material = colors && isColorableWall(finish) ? { ...finish, surface: colors } : finish;
  const painted = `rgb(${material.tone.map((tone, i) => Math.min(255, Math.round([232, 208, 189][i] * tone))).join(",")})`;
  return <svg className="wall-detail-sample" viewBox="0 0 310 310" role="img" aria-label={`${finish.pattern ? "Papier peint" : "Mur"} ${finish.name} en grand`}>
    <defs><FinishPattern finish={material} id={id} /></defs>
    <rect width="310" height="310" fill={material.surface?.base ?? painted} />
    {material.pattern && <rect width="310" height="310" fill={`url(#${id})`} />}
  </svg>;
}
export function HomeFinishShop({ generation, owner, kind, decoration, disabled, hidden, onTry, onKind, onInventory, onBusy, onColors, onFloorColors }: {
  generation: number; owner: string; kind: "wall" | "floor"; decoration: HomeDecoration; disabled: boolean; hidden: boolean;
  onTry: (finish: HomeFinish) => void; onKind: (kind: "wall" | "floor") => void;
  onInventory: (owned: string[], balance: number) => void; onBusy: (busy: boolean) => void;
  onColors: (colors: HomeDecoration["wallColors"]) => void;
  onFloorColors: (colors: HomeDecoration["floorColors"]) => void;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const visibility = useCatalogVisibility(owner, "finishes");
  const [showHidden, setShowHidden] = useState(false);
  const [choice, setChoice] = useState<Command | null>(null), [retry, setRetry] = useState<Command | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const mounted = useRef(true), inFlight = useRef(false), readVersion = useRef(0);
  const inventoryCallback = useRef(onInventory), busyCallback = useRef(onBusy);
  inventoryCallback.current = onInventory; busyCallback.current = onBusy;
  const confirmation = useRef<HTMLElement>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailHeading = useRef<HTMLElement>(null);
  useEffect(() => {
    detailHeading.current?.scrollIntoView({ block: "start", behavior: "auto" });
    detailHeading.current?.focus({ preventScroll: true });
  }, [detailId]);
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
        setMessage(homeFinish(command.finishId)?.kind === "window" ? "Ancien achat vérifié. Ce modèle est conservé pour son intégration aux meubles." : "Achat confirmé. Tu peux maintenant enregistrer ton décor.");
      }
    } catch (failure) { if (mounted.current) {
      setError((failure as Error).message);
      if (failure instanceof HousingRequestError && failure.rejected) {
        setRetry(null); setChoice(null); try { sessionStorage.removeItem(operationKey); } catch { /* No charge. */ }
      }
    } } finally { inFlight.current = false; if (mounted.current) { setBusy(false); busyCallback.current(false); } }
  }
  const locked = disabled || busy;
  const isFloor = kind === "floor";
  const selectedFinish = homeFinish(`${kind}:${decoration[kind]}`);
  const isPaint = !isFloor && !selectedFinish?.pattern;
  const woodFloor = isFloor && (!selectedFinish?.pattern || ["herringbone", "basketweave", "versailles"].includes(selectedFinish.pattern));
  const customColors = isFloor ? decoration.floorColors : decoration.wallColors;
  const colors = customColors ?? selectedFinish?.surface ?? (isPaint ? {
    base: `#${(selectedFinish?.tone ?? [1,1,1]).map((tone, i) => Math.min(255, Math.round([232, 208, 189][i] * tone)).toString(16).padStart(2, "0")).join("")}`,
    detail: "#a18c78",
  } : isFloor ? {
    base: `#${(selectedFinish?.tone ?? [1,1,1]).map((tone, i) => Math.min(255, Math.round([217, 171, 123][i] * tone)).toString(16).padStart(2, "0")).join("")}`,
    detail: "#96704f",
  } : { base: "#f4dfdf", detail: "#b16e88" });
  const setColors = isFloor ? onFloorColors : onColors;
  const detail = detailId === selectedFinish?.id ? catalog?.offers.find((offer) => offer.id === detailId) : undefined;
  const colorSubject = isFloor ? "sol" : isPaint ? "mur" : "papier peint";
  const offers = distinctFinishOffers(catalog?.offers ?? [], catalog?.owned ?? [], [`wall:${decoration.wall}`, `floor:${decoration.floor}`]);
  const familyIds = (offer: HomeFinish) => (catalog?.offers ?? []).filter((item) => finishVisualFamily(item) === finishVisualFamily(offer)).map((item) => item.id);
  const isHidden = (offer: HomeFinish) => familyIds(offer).some((id) => visibility.ids.includes(id));
  const hiddenCount = offers.filter((offer) => offer.kind === kind && isHidden(offer)).length;
  function purchase(offer: Catalog["offers"][number]) {
    onTry(offer); setChoice({ finishId: offer.id, offerVersion: offer.version, expectedPrice: offer.price, operationId: crypto.randomUUID() }); setError("");
  }
  return <section className="home-finish-shop" hidden={hidden} aria-label={kind === "wall" ? "Boutique de murs dans la maison" : "Boutique de sols dans la maison"}>
    {!detail && <header><strong>{kind === "wall" ? "Murs" : "Sols"}</strong><span>{catalog ? `${catalog.balance.toLocaleString("fr-FR")} pièces` : "Chargement…"}</span></header>}
    {!detail && <p className="home-trial-hint">Clique sur un modèle pour l’essayer dans ta maison. L’essai est gratuit.</p>}
    {!detail && <button type="button" className="catalog-hidden-toggle" onClick={() => setShowHidden(!showHidden)}>
      {showHidden ? "Retour au catalogue" : `Articles masqués (${hiddenCount})`}
    </button>}
    {visibility.storageFailed && <p role="status">Ce navigateur ne peut pas conserver le masquage après fermeture.</p>}
    {detail && <section ref={detailHeading} tabIndex={-1} className="wall-detail" aria-label={`Personnaliser ${detail.name}`}>
      <header><button type="button" aria-label={isFloor ? "Retour aux sols" : "Retour aux murs"} disabled={locked}
        onClick={() => { setDetailId(null); setChoice(null); }}>←</button><h3>{detail.name}</h3>
        <CatalogVisibilityButton name={detail.name} hidden={isHidden(detail)} disabled={locked}
          onClick={() => { visibility.setHidden(familyIds(detail), !isHidden(detail)); setDetailId(null); setChoice(null); }} />
      </header>
      <WallSample finish={detail} colors={customColors} />
    {(isFloor || isColorableWall(detail)) && <fieldset className="wallpaper-colors" disabled={locked}>
      <legend>{isFloor ? "Couleurs du sol" : isPaint ? "Couleur du mur" : "Couleurs du papier peint"}</legend>
      <div className="wallpaper-color-inputs">
        <label>{isFloor ? woodFloor ? "Bois" : "Surface" : isPaint ? "Mur" : "Fond"}<input type="color" aria-label={isPaint ? "Couleur du mur" : `Couleur du fond du ${colorSubject}`} value={colors.base}
          onInput={(event) => setColors({ ...colors, base: event.currentTarget.value })}
          onChange={(event) => setColors({ ...colors, base: event.target.value })} /></label>
        {!isPaint && <label>{isFloor ? woodFloor ? "Veines" : "Détails" : "Motifs"}<input type="color" aria-label={`Couleur des motifs du ${colorSubject}`} value={colors.detail}
          onInput={(event) => setColors({ ...colors, detail: event.currentTarget.value })}
          onChange={(event) => setColors({ ...colors, detail: event.target.value })} /></label>}
      </div>
      <details className="color-code-options"><summary>Saisir un code couleur</summary><div className="color-code-inputs">
        <ColorCode label={isPaint ? "Code couleur du mur" : isFloor ? "Code couleur du bois ou de la surface" : "Code couleur du fond"} value={colors.base}
          disabled={locked} onChange={(base) => setColors({ ...colors, base })} />
        {!isPaint && <ColorCode label={isFloor ? "Code couleur des veines ou détails" : "Code couleur des motifs"} value={colors.detail}
          disabled={locked} onChange={(detail) => setColors({ ...colors, detail })} />}
      </div></details>
      <div className="wallpaper-palettes" aria-label={`Palettes du ${colorSubject}`}>
        {(isPaint ? [
          { name: "Ivoire", base: "#eee5d6", detail: "#a18c78" },
          { name: "Sauge", base: "#b9c9ad", detail: "#6e8263" },
          { name: "Rose poudré", base: "#e5bdc7", detail: "#a97989" },
          { name: "Bleu porcelaine", base: "#c6d9e7", detail: "#7891a6" },
          { name: "Lin naturel", base: "#dfd3bd", detail: "#9f8f77" },
          { name: "Terracotta", base: "#cc967a", detail: "#95634f" },
          { name: "Lilas", base: "#d3c3e3", detail: "#9674aa" },
          { name: "Bleu nuit", base: "#49566e", detail: "#303b50" },
        ] : isFloor ? [
          { name: "Chêne naturel", base: "#dfb587", detail: "#a1744b" },
          { name: "Chêne miel", base: "#e4bb76", detail: "#a37b41" },
          { name: "Noyer", base: "#aa8265", detail: "#5e4031" },
          { name: "Bois blanchi", base: "#eee4d3", detail: "#b5aa98" },
          { name: "Bois grisé", base: "#b7b5ae", detail: "#77756f" },
          { name: "Bois rosé", base: "#dfb3a1", detail: "#a67868" },
          { name: "Ébène", base: "#696366", detail: "#302b2d" },
          { name: "Sauge", base: "#c7cbbb", detail: "#818a74" },
        ] : [
          { name: "Rose poudré", base: "#f4dfdf", detail: "#b16e88" },
          { name: "Sauge", base: "#ece8d7", detail: "#789581" },
          { name: "Bleu porcelaine", base: "#e5edf2", detail: "#6585a2" },
          { name: "Lin naturel", base: "#eee7db", detail: "#9c907e" },
          { name: "Terracotta", base: "#efe0d2", detail: "#ac7570" },
          { name: "Lilas", base: "#eee5f3", detail: "#9674aa" },
          { name: "Vert profond", base: "#394f4d", detail: "#a1b5a0" },
          { name: "Bleu nuit", base: "#343e60", detail: "#c1b6a0" },
        ]).map(({ name, base, detail }) => <button key={name} type="button" aria-label={`Palette ${name}`} title={name}
          aria-pressed={colors.base === base && colors.detail === detail}
          style={{ background: `linear-gradient(135deg,${base} 50%,${detail} 50%)` }}
          onClick={() => setColors({ base, detail })} />)}
      </div>
      <button type="button" onClick={() => setColors(undefined)} disabled={locked || !customColors}>Couleurs d’origine</button>
    </fieldset>}
      {catalog?.owned.includes(detail.id) ? <span className="finish-owned">✓ Possédé</span> :
        <button type="button" disabled={locked || !!retry || (catalog?.balance ?? 0) < detail.price}
          onClick={() => purchase(detail)}>Acheter · {detail.price} pièces</button>}
    </section>}
    {error && <p role="alert">{error} <button type="button" disabled={locked} onClick={() => void load()}>Actualiser</button></p>}
    {message && <p role="status">{message}</p>}
    {retry && !visibleChoice && <p>Un achat attend sa confirmation. <button type="button" disabled={locked} onClick={() => {
      const pending = homeFinish(retry.finishId)!;
      if (pending.kind === "window") { void buy(retry); return; }
      onKind(pending.kind); onTry(pending); setChoice(retry);
    }}>Vérifier le dernier achat</button></p>}
    {visibleChoice && <section ref={confirmation} className="finish-purchase-confirm" aria-label="Confirmer le revêtement">
      <p>Débloquer {homeFinish(visibleChoice.finishId)?.name} pour {visibleChoice.expectedPrice} pièces ?</p>
      <button type="button" disabled={locked} onClick={() => void buy(visibleChoice)}>{busy ? "Confirmation…" : retry ? "Vérifier l’achat" : "Confirmer l’achat"}</button>
      <button type="button" disabled={locked} onClick={() => setChoice(null)}>Continuer les essais</button>
    </section>}
    {!detail && catalog && !offers.some((f) => f.kind === kind && isHidden(f) === showHidden) &&
      <p>{showHidden ? "Aucun article masqué." : "Tous les articles sont masqués. Tu peux les réafficher avec « Articles masqués »."}</p>}
    {!detail && <div className="finish-catalog">{offers.filter((f) => f.kind === kind && isHidden(f) === showHidden).map((offer) => {
      const selected = decoration[kind] === offer.value, owned = catalog?.owned.includes(offer.id);
      return <article key={offer.id} className={selected ? "is-selected" : ""}>
        <CatalogVisibilityButton name={offer.name} hidden={showHidden} disabled={locked}
          onClick={() => visibility.setHidden(familyIds(offer), !showHidden)} />
        <button className="finish-preview-button" type="button" aria-label={`Essayer ${offer.name}`} aria-pressed={selected} disabled={locked}
          onClick={() => { onTry(offer); setDetailId(offer.id); setChoice(null); setMessage(""); }}>
          <svg viewBox="0 0 1000 680" aria-hidden="true"><HomeBackground {...finishDecoration(offer, decoration)} /></svg><strong>{offer.name}</strong>
          <small>{selected ? "Dans la maison" : "Essayer"}</small></button>
        {(offer.kind === "floor" || isColorableWall(offer)) && <button type="button" disabled={locked}
          onClick={() => { onTry(offer); setDetailId(offer.id); setChoice(null); setMessage(""); }}>Personnaliser les couleurs</button>}
        {owned ? <span className="finish-owned">✓ Possédé</span> : <button type="button" disabled={locked || !!retry || (catalog?.balance ?? 0) < offer.price}
          onClick={() => { setDetailId(offer.id); purchase(offer); }}>Acheter · {offer.price} pièces</button>}
      </article>;
    })}</div>}
  </section>;
}
