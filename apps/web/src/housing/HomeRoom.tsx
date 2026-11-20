import { useEffect, useRef, useState, type ComponentProps, type PointerEvent } from "react";
import { Room } from "../Room";
import { homeOwner } from "../../../../packages/contracts/src/index";
import { FLOOR_FINISHES, WALL_FINISHES, type FurniturePlacement, type HomeDecoration, type HomeSnapshot } from "../../../../packages/contracts/src/housing";
import { constrainPlacement, furnitureModel, placementDepth, STARTER_POSITIONS } from "../../../../packages/domain/src/housing";
import { FurnitureArt, HomeBackground } from "./HomeScene";
import { FurnitureCollection } from "./FurnitureCollection";
import { housingRequest, HousingRequestError } from "./home-http";
import { reconcileHome, saveSignature, canVerifySave } from "./home-state";
import { readHomeDraft, writeHomeDraft, clearHomeDraft, draftToRestore } from "./home-draft";
import { homeFinish, ownsHomeFinish } from "../../../../packages/domain/src/home-finishes";
import "./housing.css";

export type HomeRoomProps = ComponentProps<typeof Room> & {
  generation: number;
  layoutUpdate?: HomeSnapshot | null;
};
async function requestHome(path: "load" | "save", body: unknown, signal?: AbortSignal): Promise<HomeSnapshot> {
  const data = await housingRequest<{ home: HomeSnapshot }>(path, body, { signal });
  return data.home;
}
export function HomeRoom({ generation, layoutUpdate, ...roomProps }: HomeRoomProps) {
  const owner = homeOwner(roomProps.roomId)!;
  const isOwner = owner === roomProps.me;
  const [home, setHome] = useState<HomeSnapshot | null>(null);
  const [draft, setDraft] = useState<HomeDecoration | null>(null);
  const [draftRevision, setDraftRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [category, setCategory] = useState("Tous");
  const [saving, setSaving] = useState(false);
  const [saveUnconfirmed, setSaveUnconfirmed] = useState(false);
  const [draftStorageUnavailable, setDraftStorageUnavailable] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const pending = useRef<{ signature: string; operationId: string } | null>(null);
  const drag = useRef<{ original: FurniturePlacement; x: number; y: number } | null>(null);
  const mounted = useRef(true);
  const stopMovement = useRef(roomProps.onStop);
  stopMovement.current = roomProps.onStop;
  useEffect(() => { if (editing) stopMovement.current?.(); }, [editing]);
  const dirty = editing && draft !== null && home !== null && JSON.stringify(draft) !== JSON.stringify(home.decoration);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    void requestHome("load", { generation, ownerId: owner }, controller.signal).then((loaded) => {
      const recovered = isOwner ? draftToRestore(loaded, readHomeDraft(sessionStorage, owner)) : null;
      setHome(loaded); setDraft(recovered?.decoration ?? loaded.decoration); setDraftRevision(recovered?.expectedRevision ?? loaded.revision);
      pending.current = recovered?.pending ?? null; setSaveUnconfirmed(recovered?.unconfirmed ?? false);
      setEditing(!!recovered); setSelected(null); setInventoryOpen(true);
      setMessage(recovered ? "Brouillon restauré. Enregistre-le pour le conserver dans ta maison." : "");
    }).catch((failure) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [owner, generation, reload]);
  useEffect(() => {
    if (!home || !isOwner || !draft) return;
    const ok = editing && (dirty || saving || saveUnconfirmed)
      ? writeHomeDraft(sessionStorage, owner, draft, draftRevision, pending.current, saving || saveUnconfirmed)
      : clearHomeDraft(sessionStorage, owner);
    setDraftStorageUnavailable(!ok);
  }, [home, isOwner, owner, draft, draftRevision, editing, dirty, saving, saveUnconfirmed]);
  useEffect(() => {
    if (!layoutUpdate || layoutUpdate.ownerId !== owner) return;
    setHome((current) => {
      return current ? reconcileHome(current, layoutUpdate, isOwner) : current;
    });
  }, [layoutUpdate, owner, isOwner, home?.revision]);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  function change(decoration: HomeDecoration) { if (!saving) { setDraft(decoration); setError(""); setMessage(""); } }
  function move(placement: FurniturePlacement) {
    const item = home?.items.find((item) => item.id === placement.itemId);
    const model = item && furnitureModel(item.modelId);
    if (!model || !draft) return;
    const bounded = constrainPlacement(model, placement);
    change({ ...draft, placements: draft.placements.map((p) => p.itemId === bounded.itemId ? bounded : p) });
  }
  function point(event: PointerEvent<SVGGElement>) {
    const svg = event.currentTarget.ownerSVGElement!;
    const cursor = svg.createSVGPoint(); cursor.x = event.clientX; cursor.y = event.clientY;
    return cursor.matrixTransform(svg.getScreenCTM()!.inverse());
  }
  async function save() {
    if (!draft || !home || saving || !isOwner) return;
    const signature = saveSignature(draft, draftRevision);
    if (pending.current?.signature !== signature) pending.current = { signature, operationId: crypto.randomUUID() };
    setSaving(true); setError(""); setMessage("");
    try {
      const saved = await requestHome("save", { generation, expectedRevision: draftRevision,
        operationId: pending.current.operationId, decoration: draft });
      if (!mounted.current) return;
      setHome(saved); setDraft(saved.decoration); setDraftRevision(saved.revision);
      clearHomeDraft(sessionStorage, owner);
      setEditing(false); setSelected(null); setMessage("Décoration enregistrée."); pending.current = null; setSaveUnconfirmed(false);
    } catch (failure) { if (mounted.current) {
      setError((failure as Error).message);
      setSaveUnconfirmed(!(failure instanceof HousingRequestError && failure.rejected));
    } }
    finally { if (mounted.current) setSaving(false); }
  }
  if (!home) return <div className="housing-loading" role="status">{error || "Ouverture du salon…"}
    {error && <button type="button" onClick={() => setReload((n) => n + 1)}>Réessayer</button>}</div>;
  const decoration = editing && draft ? draft : home.decoration;
  const selection = decoration.placements.find((p) => p.itemId === selected);
  const selectedItem = home.items.find((item) => item.id === selected);
  const selectedModel = selectedItem && furnitureModel(selectedItem.modelId);
  const categories = ["Tous", ...new Set(home.items.map((item) => furnitureModel(item.modelId)?.category).filter((v): v is string => !!v))];
  const conflict = editing && !saving && home.revision !== draftRevision;
  const verifyingSave = !!draft && canVerifySave(saveUnconfirmed, pending.current, saveSignature(draft, draftRevision));
  const objects = decoration.placements.flatMap((p) => {
    const item = home.items.find((item) => item.id === p.itemId);
    const model = item && furnitureModel(item.modelId);
    if (!model) return [];
    return [{ id: p.itemId, depth: placementDepth(model, p), node: <g transform={`translate(${p.x} ${p.y})`}
      className={editing ? "housing-furniture editable" : "housing-furniture"}
      role={editing ? "button" : "img"} aria-label={model.name} tabIndex={editing ? 0 : undefined}
      onClick={(event) => { if (editing) { event.stopPropagation(); setSelected(p.itemId); } }}
      onPointerDown={(event) => {
        if (!editing || saving || (event.pointerType === "mouse" && event.button !== 0)) return;
        event.preventDefault(); event.stopPropagation(); setSelected(p.itemId);
        const cursor = point(event); drag.current = { original: p, x: cursor.x, y: cursor.y };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!editing || saving || drag.current?.original.itemId !== p.itemId) return;
        const cursor = point(event), start = drag.current;
        move({ ...start.original, x: start.original.x + cursor.x - start.x, y: start.original.y + cursor.y - start.y });
      }}
      onPointerUp={(event) => {
        if (drag.current?.original.itemId !== p.itemId) return;
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => { if (drag.current?.original.itemId === p.itemId) { move(drag.current.original); drag.current = null; } }}
      onKeyDown={(event) => {
        if (!editing || saving) return;
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); setSelected(p.itemId); }
        const steps: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (steps[event.key]) { event.preventDefault(); event.stopPropagation(); const [x, y] = steps[event.key];
          move({ ...p, x: p.x + x * (event.shiftKey ? 10 : 1), y: p.y + y * (event.shiftKey ? 10 : 1) }); }
      }}>
      <FurnitureArt model={model} />
      {editing && selected === p.itemId && <rect x={-model.width / 2 - 3} y={-model.height - 3}
        width={model.width + 6} height={model.height + 6} rx="4" className="housing-selection" pointerEvents="none" />}
    </g> }];
  });
  return <section className={`housing-room ${editing ? "is-decorating" : ""}`} aria-label="Salon personnalisable">
    <Room {...roomProps} homeScene={{ background: <HomeBackground wall={decoration.wall} floor={decoration.floor} />, objects, editing }} />
    <div className="housing-controls">
    <div className="housing-toolbar">
      {isOwner && !editing && <button type="button" onClick={() => {
        setDraft(home.decoration); setDraftRevision(home.revision); setEditing(true); setInventoryOpen(true); setMessage(""); setError("");
      }}>✦ Décorer</button>}
      {isOwner && !editing && <button type="button" onClick={() => setCollectionOpen(true)}>Mes meubles</button>}
      {editing && <><span>Mode décoration</span><button type="button" disabled={saving || (conflict && !verifyingSave)} onClick={() => void save()}>
        {saving ? "Enregistrement…" : verifyingSave ? "Vérifier la sauvegarde" : "Enregistrer"}</button>
        <button type="button" disabled={saving} onClick={() => {
          clearHomeDraft(sessionStorage, owner); pending.current = null; setSaveUnconfirmed(false);
          setEditing(false); setDraft(home.decoration); setSelected(null); setError(""); setMessage("");
        }}>Annuler</button></>}
    </div>
    {collectionOpen && isOwner && <FurnitureCollection generation={generation} home={home}
      onInventory={(items) => setHome((current) => current && { ...current, items })}
      onClose={() => setCollectionOpen(false)} onDecorate={() => {
        setCollectionOpen(false); setDraft(home.decoration); setDraftRevision(home.revision);
        setEditing(true); setInventoryOpen(true); setMessage(""); setError("");
      }} />}
    <div className="housing-status" aria-live="polite">
      {error && <p role="alert">{error}</p>}
      {conflict && <p role="alert">{verifyingSave ? "Une version a été enregistrée. Vérifie ta dernière sauvegarde sans la dupliquer." : "Une nouvelle version a été enregistrée ailleurs. Ton brouillon est conservé."}</p>}
      {(conflict || (editing && error)) && <button type="button" disabled={saving} onClick={() => {
        clearHomeDraft(sessionStorage, owner); pending.current = null; setSaveUnconfirmed(false); setReload((n) => n + 1);
        setEditing(false); setDraft(home.decoration); setDraftRevision(home.revision); setSelected(null); setMessage("");
      }}>Recharger et abandonner le brouillon</button>}
      {editing && dirty && draftStorageUnavailable && <p role="alert">Le brouillon local est indisponible. Enregistre avant de quitter cet écran.</p>}
      {message && <p>{message}</p>}
      {editing && !error && !conflict && <p>{dirty ? "Modifications non enregistrées" : "Glisse un meuble ou choisis-le dans l’inventaire."}</p>}
    </div>
    {editing && draft && <aside className="housing-panel" aria-label="Catalogue de meubles et outils de décoration">
      <details open={inventoryOpen} onToggle={(event) => setInventoryOpen(event.currentTarget.open)}><summary>Meubles & revêtements</summary>
        <div className="housing-finishes">
          <label>Mur<select aria-label="Couleur du mur" disabled={saving} value={draft.wall}
            onChange={(event) => change({ ...draft, wall: event.target.value as HomeDecoration["wall"] })}>
            {WALL_FINISHES.filter((wall) => ownsHomeFinish(home.ownedFinishes, "wall", wall)).map((wall) => <option key={wall} value={wall}>{homeFinish(`wall:${wall}`)?.name}</option>)}</select></label>
          <label>Parquet<select aria-label="Revêtement du sol" disabled={saving} value={draft.floor}
            onChange={(event) => change({ ...draft, floor: event.target.value as HomeDecoration["floor"] })}>
            {FLOOR_FINISHES.filter((floor) => ownsHomeFinish(home.ownedFinishes, "floor", floor)).map((floor) => <option key={floor} value={floor}>{homeFinish(`floor:${floor}`)?.name}</option>)}</select></label>
          <label>Catégorie<select disabled={saving} value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((name) => <option key={name}>{name}</option>)}</select></label>
        </div>
        <div className="housing-inventory" aria-label="Meubles possédés">
          {home.items.map((item, index) => {
            const model = furnitureModel(item.modelId);
            if (!model || (category !== "Tous" && category !== model.category)) return null;
            const placed = draft.placements.some((p) => p.itemId === item.id);
            const elsewhere = item.roomId !== null && item.roomId !== home.roomId;
            return <button key={item.id} type="button" aria-pressed={selected === item.id} disabled={saving || elsewhere}
              onClick={() => {
                setSelected(item.id);
                setInventoryOpen(false);
                if (!placed) { const [x, y] = STARTER_POSITIONS[model.id];
                  change({ ...draft, placements: [...draft.placements, { itemId: item.id, x, y, depth: 0 }] }); }
              }}>
              <svg viewBox={`${-model.width / 2} ${-model.height} ${model.width} ${model.height}`} aria-hidden="true"><FurnitureArt model={model} thumbnail /></svg>
              <span>{model.name}</span><small>Exemplaire {index + 1} · {elsewhere ? "Dans une autre pièce" : placed ? "Dans le salon" : "Rangé · Placer"}</small>
            </button>;
          })}
        </div>
      </details>
      {selection && selectedModel && <div className="housing-inspector">
        <strong>{selectedModel.name}</strong>
        <label>X<input aria-label="Position horizontale" type="number" step="1" value={selection.x} disabled={saving}
          onChange={(event) => { if (event.target.value !== "" && Number.isFinite(event.target.valueAsNumber)) move({ ...selection, x: event.target.valueAsNumber }); }} /></label>
        <label>Y<input aria-label="Position verticale" type="number" step="1" value={selection.y} disabled={saving}
          onChange={(event) => { if (event.target.value !== "" && Number.isFinite(event.target.valueAsNumber)) move({ ...selection, y: event.target.valueAsNumber }); }} /></label>
        <button type="button" disabled={saving || selection.depth <= -80} onClick={() => move({ ...selection, depth: selection.depth - 10 })}>Derrière</button>
        <button type="button" disabled={saving || selection.depth >= 80} onClick={() => move({ ...selection, depth: selection.depth + 10 })}>Devant</button>
        <button type="button" disabled={saving} onClick={() => { change({ ...draft, placements: draft.placements.filter((p) => p.itemId !== selection.itemId) }); setSelected(null); }}>Ranger</button>
      </div>}
    </aside>}
    </div>
  </section>;
}
