import { isCreatedPlayer } from "../../../../packages/contracts/src/player-account";
import { useEffect, useRef, useState, type SetStateAction } from "react";
import {
  createLegacyAppearance,
  outfitForLegacyRenderer,
  withLegacyOutfit,
} from "../cartoon/appearance";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Footprints,
  Gem,
  Scissors,
  History,
  Layers,
  RotateCcw,
  Search,
  ShoppingBag,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import type { Character } from "../../../../packages/contracts/src/index";
import { FittingAvatar, GarmentThumbnail } from "./FittingAvatar";
import { TryOnHistory } from "./TryOnHistory";
import { LayeredDressing } from "./LayeredDressing";
import { DEFAULT_LAYERS, type AvatarLayers } from "../avatar/model";
import type { PurchasedItem } from "./commerce";
import {
  catalogFor,
  itemEquipped,
  accessorySelection,
  CATEGORY_LABELS,
  LOOK_NAMES,
  ORIGINAL_OUTFIT,
  BARE_OUTFIT,
  type CatalogItem,
  type ClothingCategory,
  type Outfit,
} from "./catalog";
import "./shop.css";
import "./shop-layout.css";
import "./paper-doll.css";
import "./cartoon.css";
const searchable = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr").trim();

const filters = [
  { id: "all", label: "Tout", Icon: Layers },
  { id: "tops", label: "Hauts", Icon: Shirt },
  { id: "bottoms", label: "Bas", Icon: SlidersHorizontal },
  { id: "shoes", label: "Chaussures", Icon: Footprints },
  { id: "hair", label: "Perruques", Icon: Scissors },
  { id: "accessories", label: "Accessoires", Icon: Gem },
  { id: "looks", label: "Tenues", Icon: Sparkles },
] as const;
type Filter = (typeof filters)[number]["id"];

export function Shop({
  character,
  onClose,
  canCustomizeColors = false,
  equippedLayers = DEFAULT_LAYERS,
  onPurchase,
  ownedItems,
  balance,
}: {
  character: Character;
  onClose: () => void;
  canCustomizeColors?: boolean;
  equippedLayers?: AvatarLayers;
  onPurchase: (layers: AvatarLayers, onlyPieceId?: string) => string | null;
  ownedItems: PurchasedItem[];
  balance: number;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [dressingOpen, setDressingOpen] = useState((character.id === "iris" || isCreatedPlayer(character.id)));
  const [layers, setLayers] = useState(equippedLayers);
  const [appearance, setAppearance] = useState(() =>
    createLegacyAppearance(character.id),
  );
  const outfit = outfitForLegacyRenderer(appearance);
  // Existing controls still speak v6 indices. The actual state stores stable
  // piece ids, independently of identity/body. Keep the bridge at the UI edge.
  function setOutfit(update: SetStateAction<Outfit>) {
    setAppearance((old) =>
      withLegacyOutfit(
        old,
        typeof update === "function"
          ? update(outfitForLegacyRenderer(old))
          : update,
      ),
    );
  }
  const [compare, setCompare] = useState(false),
    [search, setSearch] = useState(""),
    [announcement, setAnnouncement] = useState("");
  const [discovery, setDiscovery] = useState<"collections" | "top">(
    "collections",
  );
  const [collection, setCollection] = useState("all");
  const [history, setHistory] = useState<CatalogItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const back = useRef<HTMLButtonElement>(null);
  const pilotLaunch = useRef<HTMLButtonElement>(null),
    wasPilotOpen = useRef(false);
  useEffect(() => {
    if (dressingOpen) wasPilotOpen.current = true;
    else if (wasPilotOpen.current) {
      pilotLaunch.current?.focus();
      wasPilotOpen.current = false;
    }
  }, [dressingOpen]);
  useEffect(() => {
    back.current?.focus();
  }, []);
  useEffect(() => {
    setAppearance(createLegacyAppearance(character.id));
    setDressingOpen((character.id === "iris" || isCreatedPlayer(character.id)));
    setLayers(equippedLayers);
    setCompare(false);
    setSearch("");
    setAnnouncement("");
    setHistory([]);
    setHistoryOpen(false);
    // A purchase updates the worn outfit in the parent. Keep the rest of the
    // current fitting session intact when only one item is bought.
  }, [character.id]);
  const catalog = catalogFor(character.id);
  const items = catalog.filter(
    (item) =>
      (filter === "all" || item.category === filter) &&
      (collection === "all" || item.variant === Number(collection)) &&
      searchable(item.name).includes(searchable(search)),
  );
  const looks = LOOK_NAMES.map((name, variant) => ({ name, variant })).filter(
    ({ name, variant }) =>
      (collection === "all" || variant === Number(collection)) &&
      searchable(name).includes(searchable(search)),
  );
  const count = (Object.keys(outfit) as ClothingCategory[]).filter(
    (category) => outfit[category] !== ORIGINAL_OUTFIT[category],
  ).length;
  const wornCount = [outfit.tops, outfit.bottoms, outfit.shoes].filter(
    (n) => n >= 0,
  ).length;
  function remember(items: CatalogItem[]) {
    setHistory((old) => [
      ...items,
      ...old.filter(
        (previous) => !items.some((item) => item.id === previous.id),
      ),
    ]);
  }
  function select(
    category: ClothingCategory,
    variant: number,
    name: string,
    toggleAccessory = false,
  ) {
    const accessoryRemoved =
      category === "accessories" &&
      variant >= 0 &&
      toggleAccessory &&
      itemEquipped(outfit, { category, variant });
    setOutfit((s) => ({
      ...s,
      [category]:
        category === "accessories"
          ? accessorySelection(
              s.accessories,
              variant,
              toggleAccessory ? "toggle" : "add",
            )
          : variant,
    }));
    setCompare(false);
    const item = catalog.find(
      (item) => item.category === category && item.variant === variant,
    );
    if (item && !accessoryRemoved) remember([item]);
    setAnnouncement(
      variant < 0 || accessoryRemoved
        ? category === "hair"
          ? "Perruque retirée de l’essayage."
          : `${CATEGORY_LABELS[category]} retiré de l’essayage.`
        : `${name} essayé sur ${character.name}.`,
    );
  }
  function reset() {
    setOutfit({ ...ORIGINAL_OUTFIT });
    setCompare(false);
    setAnnouncement("Tenue de départ rétablie.");
  }
  function removeFromHistory(item: CatalogItem) {
    setHistory((old) => old.filter((entry) => entry.id !== item.id));
    setOutfit((old) =>
      itemEquipped(old, item)
        ? {
            ...old,
            [item.category]:
              item.category === "accessories"
                ? accessorySelection(old.accessories, item.variant, "remove")
                : -1,
          }
        : old,
    );
    setCompare(false);
    setAnnouncement(`${item.name} retiré de l’historique.`);
  }
  function clearHistory() {
    setHistory([]);
    setOutfit({ ...BARE_OUTFIT });
    setCompare(false);
    setAnnouncement("Historique effacé et vêtements retirés de la cabine.");
  }
  if (dressingOpen && (character.id === "iris" || isCreatedPlayer(character.id)))
    return (
      <LayeredDressing
        canCustomizeColors={canCustomizeColors}
        layers={layers}
        onChange={setLayers}
        onClose={onClose}
        onCollections={() => setDressingOpen(false)}
        onPurchase={onPurchase}
        ownedItems={ownedItems}
        balance={balance}
      />
    );
  return (
    <section
      className="fashion-shop shop-reference-layout"
      aria-label="Boutique de vêtements"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <header className="shop-header" inert={historyOpen}>
        {(character.id === "iris" || isCreatedPlayer(character.id)) && (
          <button
            ref={pilotLaunch}
            className="ghost shop-pilot-launch"
            onClick={() => setDressingOpen(true)}
          >
            <SlidersHorizontal size={15} />
            Dressing · base unique
          </button>
        )}
        <button
          className="shop-back"
          ref={back}
          onClick={onClose}
          aria-label="Retour à la carte"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="shop-title">
          <span>LE QUARTIER · MODE</span>
          <h1>
            La boutique<span>✧</span>
          </h1>
        </div>
        <nav className="shop-discovery" aria-label="Découvrir la boutique">
          <button
            className={discovery === "top" ? "selected" : ""}
            aria-pressed={discovery === "top"}
            onClick={() => setDiscovery("top")}
          >
            <TrendingUp size={16} />
            Top achats
          </button>
          <button
            className={discovery === "collections" ? "selected" : ""}
            aria-pressed={discovery === "collections"}
            onClick={() => setDiscovery("collections")}
          >
            <Layers size={16} />
            Collections
          </button>
        </nav>
        <label className="shop-search">
          <Search size={15} />
          <span className="sr-only">Rechercher un vêtement</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche…"
            aria-label="Rechercher un vêtement"
          />
        </label>
        <button
          className="shop-history-trigger"
          aria-haspopup="dialog"
          onClick={() => setHistoryOpen(true)}
        >
          <History size={15} />
          Historique<b>{history.length}</b>
        </button>
        <span className="shop-label">
          <ShoppingBag size={14} />
          La cabine est à toi
        </span>
      </header>
      <div className="shop-body" inert={historyOpen}>
        <div className="shop-catalog">
          <div className="catalog-tools">
            <nav aria-label="Catégories de vêtements">
              {filters.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={filter === id ? "selected" : ""}
                  aria-pressed={filter === id}
                  onClick={() => {
                    setFilter(id);
                    setSearch("");
                  }}
                >
                  <span>
                    <Icon size={18} />
                  </span>
                  {label}
                </button>
              ))}
            </nav>
            <label className="collection-picker">
              <span className="sr-only">Choisir une collection</span>
              <select
                aria-label="Choisir une collection"
                value={collection}
                onChange={(e) => {
                  setCollection(e.target.value);
                  setDiscovery("collections");
                }}
              >
                <option value="all">Toutes les collections</option>
                {LOOK_NAMES.map((name, i) => (
                  <option key={i} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="catalog-heading">
            <div>
              <span>FAIS-TOI PLAISIR</span>
              <h2>
                {discovery === "top"
                  ? "Top achats"
                  : filter === "looks"
                    ? "Des idées à essayer"
                    : filter === "all"
                      ? "Ta prochaine envie"
                      : CATEGORY_LABELS[filter]}
              </h2>
            </div>
            <span>
              {discovery === "top"
                ? 0
                : filter === "looks"
                  ? looks.length
                  : items.length}{" "}
              {filter === "looks" ? "tenues" : "articles"}
            </span>
          </div>
          <div className="catalog-scroll">
            {discovery === "top" ? (
              <div className="shop-empty top-purchases-empty">
                <TrendingUp size={30} />
                <h3>Le top se prépare</h3>
                <p>
                  Les articles les plus achetés apparaîtront ici après les
                  premières ventes.
                </p>
                <button onClick={() => setDiscovery("collections")}>
                  Découvrir les collections
                </button>
              </div>
            ) : filter === "looks" ? (
              <div className="clothes-grid look-grid">
                {looks.map(({ name, variant }) => (
                  <button
                    key={variant}
                    className={
                      "clothing-card look-card " +
                      ([outfit.tops, outfit.bottoms, outfit.shoes].every(
                        (n) => n === variant,
                      )
                        ? "selected"
                        : "")
                    }
                    aria-label={`Essayer la tenue ${name}`}
                    onClick={() => {
                      setOutfit({
                        tops: variant,
                        bottoms: variant,
                        shoes: variant,
                        hair: 0,
                        accessories: ORIGINAL_OUTFIT.accessories,
                      });
                      setCompare(false);
                      remember(
                        catalog.filter((item) =>
                          item.category === "hair" ||
                          item.category === "accessories"
                            ? item.variant === 0
                            : item.variant === variant,
                        ),
                      );
                      setAnnouncement(`Tenue ${name} essayée.`);
                    }}
                  >
                    <div className="clothing-art">
                      <FittingAvatar
                        characterId={character.id}
                        outfit={{
                          tops: variant,
                          bottoms: variant,
                          shoes: variant,
                          hair: 0,
                          accessories: ORIGINAL_OUTFIT.accessories,
                        }}
                      />
                      {[outfit.tops, outfit.bottoms, outfit.shoes].every(
                        (n) => n === variant,
                      ) && (
                        <span className="item-check">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <strong>{name}</strong>
                    <small>Haut · bas · chaussures</small>
                    <span className="item-action">
                      Essayer le look <ArrowUpRight size={12} />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="clothes-grid">
                {items.map((item) => (
                  <button
                    key={item.id}
                    className={
                      "clothing-card " +
                      (itemEquipped(outfit, item) ? "selected" : "")
                    }
                    aria-label={`Essayer ${item.name}`}
                    aria-pressed={itemEquipped(outfit, item)}
                    onClick={() =>
                      select(item.category, item.variant, item.name, true)
                    }
                  >
                    <div className="clothing-art">
                      <GarmentThumbnail
                        characterId={character.id}
                        category={item.category}
                        variant={item.variant}
                      />
                      {itemEquipped(outfit, item) && (
                        <span className="item-check">
                          <Check size={12} />
                        </span>
                      )}
                      <span className="item-category">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                    </div>
                    <strong>{item.name}</strong>
                    <small>
                      <span
                        className="item-swatch"
                        style={{ background: item.tint }}
                      />{" "}
                      {itemEquipped(outfit, item)
                        ? "Dans ton essayage"
                        : "À découvrir"}
                    </small>
                    <span className="item-action">
                      Essayer <ArrowUpRight size={12} />
                    </span>
                  </button>
                ))}
              </div>
            )}
            {discovery === "collections" &&
              ((filter === "looks" && !looks.length) ||
                (filter !== "looks" && !items.length)) && (
                <div className="shop-empty">
                  <Search size={24} />
                  <h3>Aucun article trouvé</h3>
                  <p>Essaie un autre mot ou une autre catégorie.</p>
                  <button onClick={() => setSearch("")}>
                    Effacer la recherche
                  </button>
                </div>
              )}
          </div>
          <div className="catalog-disclaimer">
            <Sparkles size={12} />
            <span>Essaie librement. Les prix seront ajoutés plus tard.</span>
          </div>
        </div>
        <aside
          className="fitting-room"
          aria-label={`Cabine d’essayage de ${character.name}`}
        >
          <div className="fitting-heading">
            <span>TON REFLET, TON STYLE</span>
            <h2>
              {character.name}
              <span>✦</span>
            </h2>
            <p>
              {compare
                ? "Ta tenue de départ"
                : wornCount
                  ? `${wornCount} ${wornCount > 1 ? "pièces portées" : "pièce portée"}`
                  : "Base d’essayage"}
            </p>
          </div>
          <div className="fitting-stage">
            <div className="fitting-arch" />
            <span className="fitting-spark">✧</span>
            <div className="fitting-platform" />
            <FittingAvatar
              characterId={character.id}
              outfit={compare ? ORIGINAL_OUTFIT : outfit}
            />
          </div>
          <div className="outfit-selection">
            {(["tops", "bottoms", "shoes", "hair", "accessories"] as const).map(
              (category) => (
                <div key={category}>
                  <span>{CATEGORY_LABELS[category]}</span>
                  <strong>
                    {category === "accessories"
                      ? catalog
                          .filter(
                            (item) =>
                              item.category === category &&
                              itemEquipped(outfit, item),
                          )
                          .map((item) => item.name)
                          .join(" · ") || "Retiré"
                      : (catalog.find(
                          (item) =>
                            item.category === category &&
                            item.variant === outfit[category],
                        )?.name ??
                        (category === "hair" ? "Sans perruque" : "Retiré"))}
                  </strong>
                  {outfit[category] >= 0 && (
                    <button
                      aria-label={`Retirer l’essayage ${CATEGORY_LABELS[category]}`}
                      onClick={() => select(category, -1, "Vêtement retiré")}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              ),
            )}
          </div>
          <div className="fitting-actions">
            <button
              className="base-outfit-button"
              aria-label="Tout retirer pour voir la base en sous-vêtements"
              title="Voir la base d’essayage"
              onClick={() => {
                setOutfit({ ...BARE_OUTFIT });
                setCompare(false);
                setAnnouncement(
                  "Base chauve en sous-vêtements, sans perruque.",
                );
              }}
            >
              <Shirt size={15} />
            </button>
            <button
              className={compare ? "compare-button selected" : "compare-button"}
              aria-pressed={compare}
              disabled={!count}
              onClick={() => setCompare((s) => !s)}
            >
              <Layers size={14} />
              {compare ? "Revenir à l’essayage" : "Comparer avant / après"}
            </button>
            <button
              className="reset-outfit"
              onClick={reset}
              disabled={!count}
              title="Rétablir la tenue de départ"
              aria-label="Rétablir la tenue de départ"
            >
              <RotateCcw size={15} />
            </button>
          </div>
          <button
            className="shop-purchase"
            onClick={() => setHistoryOpen(true)}
            aria-haspopup="dialog"
          >
            <ShoppingBag size={15} />
            Panier d’essayage<span>{history.length}</span>
          </button>
          <small className="fitting-note">
            Prix à définir · achats pas encore activés.
          </small>
        </aside>
      </div>
      {historyOpen && (
        <TryOnHistory
          characterId={character.id}
          items={history}
          onClose={() => setHistoryOpen(false)}
          onRemove={removeFromHistory}
          onClear={clearHistory}
          onTry={(item) => select(item.category, item.variant, item.name)}
        />
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </section>
  );
}
