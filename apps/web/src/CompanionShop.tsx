import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, Check, PawPrint, X } from "lucide-react";
import { companionNameSchema, type CompanionCollection, type OwnedCompanion } from "../../../packages/contracts/src/companions";
import { COMPANION_BREEDS, companionImage, companionModel, companionVariants, type CompanionBreedId } from "../../../packages/domain/src/companions";

type Model = NonNullable<ReturnType<typeof companionModel>>;
type Equip = (id: string | null) => Promise<void>;
const coins = (price: number) => `${price.toLocaleString("fr-FR")} pièces`;
const coatCount = (count: number) => count === 1 ? "1 pelage disponible" : `${count} pelages disponibles`;
const breeds = Object.keys(COMPANION_BREEDS) as CompanionBreedId[];
const speciesLabels = { Chien: "Chiens", Chat: "Chats", Lapin: "Lapins", Hamster: "Hamsters" } as const;
const speciesList = Object.keys(speciesLabels) as (keyof typeof speciesLabels)[];

export function CompanionArt({ model, className, lazy = false }: {
  model: Model; className?: string; lazy?: boolean;
}) {
  const [left, top, right, bottom] = model.bounds;
  const width = right - left, height = bottom - top;
  const ground = model.ground ?? bottom;
  const sizing = {
    "--pet-ratio": width / height,
    "--pet-height-ratio": model.heightRatio * height / (ground - top),
    "--pet-tail": `${100 * (bottom - ground) / height}%`,
  } as CSSProperties;
  return <span className={`pet-art ${className ?? ""}`} style={sizing}>
    <img src={companionImage(model.id)} alt="" loading={lazy ? "lazy" : undefined} decoding="async" draggable={false}
      style={{ width: `${100 * model.canvas[0] / width}%`, left: `${-100 * left / width}%`, top: `${-100 * top / height}%` }} />
  </span>;
}

function CompanionDialog({ title, onClose, busy, children }: {
  title: string; onClose: () => void; busy: boolean; children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const panel = dialog.current;
    panel?.showModal();
    return () => panel?.close();
  }, []);
  return <dialog className="companion-dialog" ref={dialog} aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="companion-dialog-heading">
      <h2 id={titleId}>{title}</h2>
      <button type="button" className="companion-icon" aria-label="Fermer" disabled={busy} onClick={onClose}><X size={20} /></button>
    </div>
    {children}
  </dialog>;
}

function useCompanionAction() {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try { await action(); }
    catch (cause) { setError((cause as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  return { busy, error, run };
}

function BuyCompanionDialog({ model, balance, buy, equip, onClose }: {
  model: Model; balance: number; buy: (id: string, name: string) => Promise<OwnedCompanion>;
  equip: Equip; onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [animal, setAnimal] = useState<OwnedCompanion | null>(null);
  const { busy, error, run } = useCompanionAction();
  const parsedName = companionNameSchema.safeParse(name);
  return <CompanionDialog title={animal ? `${animal.name} rejoint ta collection` : `Adopter · ${model.breed}`} busy={busy} onClose={onClose}>
    <div className="companion-purchase-art"><CompanionArt model={model} /></div>
    <p className="companion-breed">Pelage {model.coat.toLocaleLowerCase("fr-FR")}</p>
    {animal ? <div className="companion-actions">
      <button type="button" className="companion-primary" disabled={busy} onClick={() => void run(async () => {
        await equip(animal.id);
        onClose();
      })}>Équiper {animal.name}</button>
      <button type="button" disabled={busy} onClick={onClose}>Plus tard</button>
    </div> : <form onSubmit={(event) => {
      event.preventDefault();
      if (parsedName.success && balance >= model.price) void run(async () => setAnimal(await buy(model.id, parsedName.data)));
    }}>
      <p className="companion-price">{coins(model.price)}</p>
      <label>Nom de ton compagnon
        <input type="text" autoFocus value={name} onChange={(event) => setName(event.target.value)}
          maxLength={20} required autoComplete="off" disabled={busy} aria-describedby="companion-name-help" />
      </label>
      <small id="companion-name-help">{name && !parsedName.success ? parsedName.error.issues[0].message : "De 2 à 20 caractères."}</small>
      {balance < model.price && <p>Il te manque {coins(model.price - balance)}.</p>}
      <button type="submit" className="companion-primary" disabled={busy || !parsedName.success || balance < model.price}>
        {busy ? "Achat en cours…" : "Confirmer l’achat"}
      </button>
    </form>}
    {error && <p role="alert" className="companion-error">{error}</p>}
  </CompanionDialog>;
}

export function CompanionShop({ collection, balance, onBack, onCollection, buy, equip }: {
  collection: CompanionCollection; balance: number; onBack: () => void; onCollection: () => void;
  buy: (model: string, name: string) => Promise<OwnedCompanion>; equip: Equip;
}) {
  const [selected, setSelected] = useState<Model | null>(null);
  const [breedId, setBreedId] = useState<CompanionBreedId | null>(null);
  const shop = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnTo = useRef<{ id: CompanionBreedId; scroll: number } | null>(null);
  const breed = breedId && COMPANION_BREEDS[breedId];
  const variants = breedId ? companionVariants(breedId) : [];
  const ownedModels = new Map(collection.items.map((animal) => [animal.modelId, animal]));
  useLayoutEffect(() => {
    const panel = shop.current;
    if (!panel || !returnTo.current) return;
    if (breedId) {
      panel.scrollTop = 0;
      heading.current?.focus({ preventScroll: true });
    } else {
      panel.scrollTop = returnTo.current.scroll;
      panel.querySelector<HTMLButtonElement>(`[data-breed="${returnTo.current.id}"]`)?.focus({ preventScroll: true });
      returnTo.current = null;
    }
  }, [breedId]);

  return <section className="companion-shop" ref={shop} aria-labelledby="companion-shop-title">
    <header className="companion-shop-heading">
      <button type="button" className="companion-icon"
        aria-label={breed ? `Retour aux ${speciesLabels[breed.species].toLowerCase()}` : "Retour au quartier"}
        onClick={breed ? () => setBreedId(null) : onBack}><ArrowLeft size={19} /></button>
      <h1 id="companion-shop-title" ref={heading} tabIndex={-1}>{breed ? breed.name : "Animalerie"}</h1>
      <button type="button" onClick={onCollection}><PawPrint size={17} /> Mes compagnons</button>
    </header>
    <div className="companion-shop-summary">
      <p>{breed ? coatCount(variants.length) : "Choisis un compagnon pour découvrir ses pelages."}</p>
      <strong>{coins(balance)}</strong>
    </div>
    {breed ? <div className="companion-cards">
        {variants.map((model) => {
          const owned = ownedModels.get(model.id);
          return <article key={model.id} className="companion-card">
            <div className="companion-card-art"><CompanionArt model={model} lazy /></div>
            <div className="companion-card-info">
              <h2>{model.coat}</h2>
              <strong>{coins(model.price)}</strong>
              {owned ? <span className="companion-owned"><Check size={15} /> Possédé · {owned.name}</span>
                : <button type="button" className="companion-primary" aria-label={`Acheter · ${model.coat}`}
                  onClick={() => setSelected(model)}>Acheter</button>}
            </div>
          </article>;
        })}
      </div> : speciesList.map((species) => <section className="companion-shelf" key={species} aria-label={speciesLabels[species]}>
      <h2>{speciesLabels[species]}</h2>
      <div className="companion-cards">
        {breeds.filter((id) => COMPANION_BREEDS[id].species === species).map((id) => {
          const entry = COMPANION_BREEDS[id];
          const available = companionVariants(id);
          const cover = available.find((model) => model.id === entry.cover) ?? available[0];
          if (!cover) return null;
          return <article key={id} className="companion-card">
            <div className="companion-card-art"><CompanionArt model={cover} lazy /></div>
            <div className="companion-card-info">
              <h3>{entry.name}</h3>
              <p>{coatCount(available.length)}</p>
              <button type="button" className="companion-primary" data-breed={id}
                aria-label={`Voir les pelages · ${entry.name}`} onClick={() => {
                  returnTo.current = { id, scroll: shop.current?.scrollTop ?? 0 };
                  setBreedId(id);
                }}>Voir les pelages</button>
            </div>
          </article>;
        })}
      </div>
    </section>)}
    {selected && <BuyCompanionDialog model={selected} balance={balance} buy={buy} equip={equip} onClose={() => setSelected(null)} />}
  </section>;
}

function CompanionList({ collection, actions }: {
  collection: CompanionCollection;
  actions: (animal: OwnedCompanion, equipped: boolean) => ReactNode;
}) {
  return <ul className="companion-collection">
    {collection.items.map((animal) => {
      const model = companionModel(animal.modelId);
      if (!model) return null;
      const equipped = collection.equipped?.id === animal.id;
      return <li key={animal.id}>
        <div className="companion-collection-art"><CompanionArt model={model} /></div>
        <div className="companion-collection-info">
          <strong>{animal.name}</strong>
          <small>{model.breed} · {model.coat}</small>
          <small>{equipped ? "Équipé" : "Non équipé"}</small>
        </div>
        {actions(animal, equipped)}
      </li>;
    })}
  </ul>;
}

export function CompanionNameEditor({ animal, rename, onClose }: {
  animal: OwnedCompanion;
  rename: (id: string, name: string) => Promise<void>;
  onClose: () => void;
}) {
  const field = useId();
  const [name, setName] = useState(animal.name);
  const { busy, error, run } = useCompanionAction();
  const parsed = companionNameSchema.safeParse(name);
  return <form className="companion-name-editor" onSubmit={(event) => {
    event.preventDefault();
    if (parsed.success) void run(async () => {
      await rename(animal.id, parsed.data);
      onClose();
    });
  }} onKeyDown={(event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (!busy) onClose();
  }}>
    <label htmlFor={field}>Nouveau nom</label>
    <input id={field} autoFocus autoComplete="off" value={name} onChange={(event) => setName(event.target.value)}
      disabled={busy} aria-invalid={!parsed.success} aria-describedby={`${field}-help`} />
    <small id={`${field}-help`}>{parsed.success ? "De 2 à 20 caractères." : parsed.error.issues[0].message}</small>
    {error && <p role="alert" className="companion-error">{error}</p>}
    <div className="profile-form-actions">
      <button type="button" disabled={busy} onClick={onClose}>Annuler</button>
      <button type="submit" disabled={busy || !parsed.success || parsed.data === animal.name}>
        {busy ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  </form>;
}

export function CompanionSettings({ collection, rename }: {
  collection: CompanionCollection;
  rename: (id: string, name: string) => Promise<void>;
}) {
  const title = useId();
  const [editing, setEditing] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  function closeEditor() {
    setEditing(null);
    requestAnimationFrame(() => trigger.current?.focus());
  }
  return <section className="companion-settings" aria-labelledby={title}>
    <h3 id={title}>Mes compagnons</h3>
    {collection.items.length === 0 ? <p>Ta collection est vide.</p>
      : <CompanionList collection={collection} actions={(animal) => <>
          <button type="button" disabled={editing !== null} aria-label={`Renommer ${animal.name}`}
            onClick={(event) => { trigger.current = event.currentTarget; setEditing(animal.id); }}>Renommer</button>
          {editing === animal.id && <CompanionNameEditor animal={animal} rename={rename} onClose={closeEditor} />}
        </>} />}
  </section>;
}

export function CompanionPicker({ collection, equip, onClose, onShop }: {
  collection: CompanionCollection; equip: Equip; onClose: () => void; onShop: () => void;
}) {
  const { busy, error, run } = useCompanionAction();
  return <CompanionDialog title="Mes compagnons" busy={busy} onClose={onClose}>
    {collection.items.length === 0 ? <>
      <p>Ta collection est vide. Retrouve tous les compagnons à l’animalerie.</p>
      <button type="button" className="companion-primary" onClick={onShop}>Ouvrir l’animalerie</button>
    </> : <CompanionList collection={collection} actions={(animal, equipped) =>
      <button type="button" disabled={busy} className={equipped ? "" : "companion-primary"}
        aria-label={equipped ? `Retirer ${animal.name}` : `Équiper ${animal.name}`}
        onClick={() => void run(() => equip(equipped ? null : animal.id))}>{equipped ? "Retirer" : "Équiper"}</button>
    } />}
    {error && <p role="alert" className="companion-error">{error}</p>}
  </CompanionDialog>;
}
