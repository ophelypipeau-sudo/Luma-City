import { FASHION_BASE } from "../avatar/base";
import { garmentMaterials } from "../avatar/materials";
import {
  isPunkCut,
  PUNK_SWATCHES,
} from "../../../../packages/domain/src/punk-pattern";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  Check,
  Coins,
  Palette,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Heart,
  Search,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  avatarGarment,
  avatarCatalogSnapshot,
  subscribeAvatarCatalog,
  replaceAtelierCatalog,
  pendingPoseImports,
  type Garment,
} from "../avatar/catalog";
import { Atelier } from "../atelier/Atelier";
import { atelierApi } from "../atelier/api";
import { atelierGarment } from "../atelier/catalog";
import type {
  WorkshopPublication,
  AtelierCapabilities,
} from "../../../../packages/contracts/src/atelier";
import { AvatarItemThumbnail } from "../avatar/LayeredDoll";
import { DEFAULT_LAYERS, removeGarment, wearGarment, wornSlot, type AvatarLayers } from "../avatar/model";
import { BARE_OUTFIT } from "./catalog";
import { FittingAvatar } from "./FittingAvatar";
import { OutfitLayerPanel } from "../avatar/OutfitLayerPanel";
import { fittingPieceAt } from "./fitting-hit";
import "./layered-dressing.css";
import { FASHION_PRICES, colorGarment, fittingCart } from "./fashion-options";
import { GarmentPalette } from "./GarmentPalette";
import { ownsVariant, type PurchasedItem } from "./commerce";
import "./runway-shop.css";
import {
  archivedPieces,
  subscribeArchive,
  archivePiece,
  restorePiece,
  withoutArchivedPieces,
  visibleShopPieces,
} from "../avatar/archive";

import { matchesWardrobeCategory, wardrobeCategories, WardrobeCategoryIcon, type WardrobeCategory } from "../WardrobeCategories";

const PAGE_SIZE = 12;
const searchable = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr");

function colorControls(
  piece: Garment,
  open: (zone: "main" | "detail") => void,
  color?: string,
  detailColor?: string,
) {
  const material = garmentMaterials(piece);
  if (!piece.colorable || !material) return null;
  return (
    <div
      className="runway-item-colors"
      aria-label={"Couleurs de " + piece.name}
    >
      <button
        aria-label={"Couleur 1 : " + piece.name}
        title={material.mainLabel}
        onClick={() => open("main")}
      >
        <Palette size={13} />
        <i style={{ background: color ?? material.mainBase }} />
      </button>
      {piece.secondaryColor && (
        <button
          aria-label={"Couleur 2 : " + piece.name}
          title={piece.secondaryColor.label}
          onClick={() => open("detail")}
        >
          <i style={{ background: detailColor ?? material.detailBase }} />
        </button>
      )}
    </div>
  );
}
export function LayeredDressing({
  layers,
  onChange,
  onClose,
  onCollections,
  canCustomizeColors = false,
  onPurchase,
  ownedItems = [],
  balance = 0,
}: {
  canCustomizeColors?: boolean;
  layers: AvatarLayers;
  onChange: Dispatch<SetStateAction<AvatarLayers>>;
  onClose: () => void;
  onCollections: () => void;
  onPurchase?: (layers: AvatarLayers, onlyPieceId?: string) => string | null | Promise<string | null>;
  ownedItems?: PurchasedItem[];
  balance?: number;
}) {
  const back = useRef<HTMLButtonElement>(null);
  const fullCatalog = useSyncExternalStore(
    subscribeAvatarCatalog,
    avatarCatalogSnapshot,
    avatarCatalogSnapshot,
  );
  const archived = useSyncExternalStore(
    subscribeArchive,
    archivedPieces,
    () => [],
  );
  const catalog = visibleShopPieces(fullCatalog, archived);
  const [trashOpen, setTrashOpen] = useState(false),
    [deletionError, setDeletionError] = useState("");
  useEffect(() => {
    onChange((current) => withoutArchivedPieces(current, archived));
  }, [archived, onChange]);
  function removeArticle(id: string) {
    try {
      archivePiece(id);
      setPaletteId(null);
      setDeletionError("");
    } catch {
      setDeletionError("La suppression locale est indisponible.");
    }
  }
  const [atelierOpen, setAtelierOpen] = useState(false),
    [canAtelier, setCanAtelier] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all([
      atelierApi<AtelierCapabilities & { editor: boolean }>("/capabilities"),
      atelierApi<WorkshopPublication[]>("/catalog"),
    ])
      .then(([caps, items]) => {
        if (!alive) return;
        setCanAtelier(caps.editor);
        replaceAtelierCatalog(items.map(atelierGarment));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const [cartOpen, setCartOpen] = useState(false);
  const [paletteId, setPaletteId] = useState<string | null>(null);
  const [paletteZone, setPaletteZone] = useState<"main" | "detail">("main");
  const palettePiece = catalog.find((p) => p.id === paletteId);
  const paletteMaterial = palettePiece
    ? garmentMaterials(palettePiece)
    : undefined;
  const owned = (id: string, color?: string, detail?: string) =>
    ownsVariant(ownedItems, id, color, detail);
  const cart = fittingCart(layers).filter(
    (e) =>
      !archived.includes(e.piece.id) &&
      !owned(e.piece.id, e.color, e.detailColor),
  );
  const total = cart.reduce((sum, e) => sum + e.price, 0);
  const [purchaseError, setPurchaseError] = useState("");
  const [receipt, setReceipt] = useState<{
    stamp: number;
    cost: number;
  } | null>(null);
  useEffect(() => {
    if (!receipt) return;
    const timer = setTimeout(() => setReceipt(null), 3000);
    return () => clearTimeout(timer);
  }, [receipt]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const ids = JSON.parse(
        localStorage.getItem("fashion-favorites-v1") ?? "[]",
      );
      return Array.isArray(ids) ? ids.filter((i) => typeof i === "string") : [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  function toggleFavorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((i) => i !== id)
      : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem("fashion-favorites-v1", JSON.stringify(next));
    } catch {}
  }
  function openColor(id: string, zone: "main" | "detail" = "main") {
    onChange((current) => wearGarment(current, id));
    setPaletteId(id);
    setPaletteZone(zone);
  }
  const [purchasing, setPurchasing] = useState(false);
  async function purchase(id?: string) {
    if (purchasing) return;
    const cost = id ? (cart.find((e) => e.piece.id === id)?.price ?? 0) : total;
    setPurchasing(true);
    let error: string | null;
    try {
      error = onPurchase ? await onPurchase(layers, id) : "Achat indisponible.";
    } finally {
      setPurchasing(false);
    }
    setPurchaseError(error ?? "");
    if (!error) {
      setReceipt({ stamp: Date.now(), cost });
      setPaletteId(null);
      if (!id) setCartOpen(false);
    }
  }
  const [category, setCategory] = useState<WardrobeCategory>("all");
  const [tab, setTab] = useState<"top" | "collection" | "favorites">("top");
  const [page, setPage] = useState(0);
  useEffect(() => {
    back.current?.focus();
  }, []);
  const filtered = catalog.filter(
    (piece) =>
      matchesWardrobeCategory(category, piece) &&
      searchable(piece.name).includes(searchable(search)) &&
      (tab !== "favorites" || favorites.includes(piece.id)),
  );
  const itemCount = filtered.length;
  const pages = Math.max(1, Math.ceil(itemCount / PAGE_SIZE));
  useEffect(() => setPage((current) => Math.min(current, pages - 1)), [pages]);
  const shown = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  if (atelierOpen)
    return (
      <Atelier
        onCatalogChanged={(items) => {
          replaceAtelierCatalog(items.map(atelierGarment));
          setPage(0);
          setPaletteId(null);
          onChange((current) => {
            const removed = (id: string | null | undefined) =>
              id?.startsWith("atelier.") && !items.some((piece) => piece.id === id);
            return {
              ...current,
              ...(removed(current.top) && { top: DEFAULT_LAYERS.top }),
              ...(removed(current.top2) && { top2: null }),
              extraPieces: current.extraPieces?.filter((id) => !removed(id)),
            };
          });
        }}
        onClose={() => setAtelierOpen(false)}
        onPublished={(pub) => {
          onChange((current) => wearGarment(current, pub.id));
          setCategory("tops");
          setPage(0);
        }}
      />
    );
  return (
    <section
      className="fashion-shop layered-dressing blush-boutique runway-boutique"
      aria-label="Dressing à base unique"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          if (paletteId) setPaletteId(null);
          else if (trashOpen) setTrashOpen(false);
          else if (cartOpen) setCartOpen(false);
          else onClose();
        }
      }}
    >
      <div className="blush-catalog">
        <header className="blush-heading">
          <div className="blush-tabs" aria-label="Sélection de la boutique">
            <button
              aria-pressed={tab === "top"}
              onClick={() => {
                setTab("top");
                setPage(0);
              }}
            >
              <ShoppingBag size={23} /> Boutique
            </button>
            <button
              aria-pressed={tab === "collection"}
              onClick={() => {
                setTab("collection");
                setPage(0);
              }}
            >
              <Sparkles size={23} /> Collection
            </button>
            <button
              aria-pressed={tab === "favorites"}
              onClick={() => {
                setTab("favorites");
                setPage(0);
              }}
            >
              <Heart size={23} /> Favoris
            </button>
          </div>
        </header>
        {tab !== "collection" && (
          <>
            <nav
              className="blush-categories"
              aria-label="Catégories de vêtements"
            >
              {wardrobeCategories.map(({ id, label }) => (
                <button
                  key={id}
                  aria-label={label}
                  aria-pressed={category === id}
                  onClick={() => {
                    setCategory(id);
                    setPage(0);
                  }}
                >
                  <span>
                    <WardrobeCategoryIcon category={id} />
                  </span>
                  <small>{label}</small>
                </button>
              ))}
            </nav>
            <div className="runway-tools">
              <label className="runway-search">
                <Search size={15} />
                <input
                  aria-label="Rechercher un vêtement"
                  placeholder="Chercher…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
            </div>

            <div className="blush-items" aria-label="Vêtements indépendants">
              {shown.map((piece) => (
                <article className="runway-item" key={piece.id}>
                  <button
                    className={
                      wornSlot(layers, piece.id)
                        ? "blush-item selected"
                        : "blush-item"
                    }
                    aria-pressed={wornSlot(layers, piece.id) != null}
                    aria-label={"Essayer " + piece.name}
                    onClick={() => {
                      onChange((current) => {
                        const slot = wornSlot(current, piece.id);
                        return slot ? removeGarment(current, piece.id) : wearGarment(current, piece.id);
                      });
                    }}
                  >
                    <div className="blush-item-art">
                      <AvatarItemThumbnail piece={piece} />
                    </div>
                    <span className="blush-item-price">
                      <Coins size={16} />
                      {piece.price ?? FASHION_PRICES[piece.id]}
                    </span>
                  </button>
                  <button
                    className="runway-favorite"
                    aria-label={"Favori : " + piece.name}
                    aria-pressed={favorites.includes(piece.id)}
                    onClick={() => toggleFavorite(piece.id)}
                  >
                    <Heart
                      size={15}
                      fill={
                        favorites.includes(piece.id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                  {canAtelier && (
                    <button
                      className="runway-delete"
                      aria-label={"Supprimer " + piece.name}
                      title="Retirer de la boutique (restaurable)"
                      onClick={() => removeArticle(piece.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {wornSlot(layers, piece.id) &&
                    colorControls(
                      piece,
                      (zone) => openColor(piece.id, zone),
                      layers.colors?.[piece.id],
                      layers.detailColors?.[piece.id],
                    )}
                </article>
              ))}
              {itemCount === 0 && (
                <p className="blush-empty">
                  Pas encore de pièce dans cette catégorie.
                </p>
              )}
            </div>
            <footer className="blush-catalog-footer">
              {canAtelier && pendingPoseImports().length > 0 && (
                <small role="status">
                  {pendingPoseImports().length} import(s) conservé(s) en attente
                  d’ajustement aux poses.
                </small>
              )}
              {canAtelier && (
                <button
                  className="runway-trash-link"
                  onClick={() => setTrashOpen(true)}
                >
                  <Trash2 size={13} /> Corbeille
                  {archived.length > 0 ? " · " + archived.length : ""}
                </button>
              )}
              <div
                className="blush-pagination"
                aria-label="Pages des vêtements"
              >
                <button
                  aria-label="Page précédente"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={23} />
                </button>
                <span>
                  {page + 1} / {pages}
                </span>
                <button
                  aria-label="Page suivante"
                  disabled={page + 1 >= pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={23} />
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
      <aside className="blush-fitting" aria-label="Cabine d’essayage Iris">
        <div className="blush-figure">
          <OutfitLayerPanel layers={withoutArchivedPieces(layers, archived)} onChange={onChange} />
          <FittingAvatar
            characterId="iris"
            outfit={BARE_OUTFIT}
            layers={withoutArchivedPieces(layers, archived)}
            bodyBase={FASHION_BASE}
            onClick={(event) => {
              void fittingPieceAt(
                event.currentTarget,
                event.clientX,
                event.clientY,
              )
                .then((id) => {
                  if (!id) return;
                  onChange((current) => removeGarment(current, id));
                })
                .catch(() => {});
            }}
          />
          {receipt && (
            <div className="runway-receipt" role="status" key={receipt.stamp}>
              <span>✦ ✧ ✦</span>
              <strong>
                {receipt.cost ? "Achat confirmé !" : "Tenue portée !"}
              </strong>
              {receipt.cost > 0 && (
                <b>
                  <Coins size={16} /> −{receipt.cost}
                </b>
              )}
            </div>
          )}
        </div>
        <div className="blush-fitting-footer">
          <button
            className="blush-compare"
            aria-haspopup="dialog"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={18} /> Panier <b>{cart.length}</b>
            <span className="runway-cart-sum">
              <Coins size={15} />
              {total}
            </span>
          </button>
        </div>
      </aside>
      {deletionError && (
        <p role="alert" className="runway-delete-error">
          {deletionError}
        </p>
      )}
      {trashOpen && (
        <section
          role="dialog"
          aria-label="Corbeille des vêtements"
          className="runway-cart runway-trash"
        >
          <header>
            <h2>Vêtements retirés</h2>
            <button
              aria-label="Fermer la corbeille"
              onClick={() => setTrashOpen(false)}
            >
              <X size={18} />
            </button>
          </header>
          <p>
            Les sources et les achats sont conservés. Tu peux restaurer ces
            articles.
          </p>
          {archived.length === 0 && <p>La corbeille est vide.</p>}
          {archived.map((id) => {
            const piece = fullCatalog.find((p) => p.id === id);
            return (
              <div className="runway-trash-row" key={id}>
                {piece && <AvatarItemThumbnail piece={piece} />}
                <span>{piece?.name ?? id}</span>
                <button
                  onClick={() => {
                    try {
                      restorePiece(id);
                      setDeletionError("");
                    } catch {
                      setDeletionError("Impossible de restaurer cet article.");
                    }
                  }}
                >
                  <Undo2 size={14} /> Restaurer
                </button>
              </div>
            );
          })}
        </section>
      )}
      {paletteId && palettePiece && layers[palettePiece.slot] === paletteId && (
        <section
          className="runway-palette"
          role="dialog"
          aria-label={"Couleur · " + palettePiece!.name}
        >
          <header>
            <strong>{palettePiece!.name}</strong>
            <button
              aria-label="Fermer les couleurs"
              onClick={() => setPaletteId(null)}
            >
              <X size={17} />
            </button>
          </header>
          <div className="palette-preview">
            <AvatarItemThumbnail
              piece={catalog.find((p) => p.id === paletteId)!}
              color={layers.colors?.[paletteId]}
              detailColor={layers.detailColors?.[paletteId]}
            />
          </div>
          {palettePiece && (
            <div className="garment-color-zones" aria-label="Zones de couleur">
              <button
                aria-pressed={paletteZone === "main"}
                onClick={() => setPaletteZone("main")}
              >
                <i
                  style={{
                    background:
                      layers.colors?.[paletteId] ??
                      paletteMaterial?.mainBase ??
                      "#ffffff",
                  }}
                />{" "}
                Couleur 1 · {paletteMaterial?.mainLabel ?? "Tissu"}
              </button>
              {palettePiece.secondaryColor && (
                <button
                  aria-pressed={paletteZone === "detail"}
                  onClick={() => setPaletteZone("detail")}
                >
                  <i
                    style={{
                      background:
                        layers.detailColors?.[paletteId] ??
                        paletteMaterial?.detailBase ??
                        palettePiece.secondaryColor.defaultColor,
                    }}
                  />{" "}
                  Couleur 2 · {palettePiece.secondaryColor.label}
                </button>
              )}
            </div>
          )}
          <GarmentPalette
            key={paletteId + paletteZone}
            value={
              paletteZone === "detail"
                ? (layers.detailColors?.[paletteId] ??
                  paletteMaterial?.detailBase ??
                  palettePiece!.secondaryColor!.defaultColor)
                : (layers.colors?.[paletteId] ??
                  paletteMaterial?.mainBase ??
                  "#ffffff")
            }
            onReset={() =>
              onChange((current) => {
                const field =
                  paletteZone === "detail" ? "detailColors" : "colors";
                const next = { ...current[field] };
                delete next[paletteId];
                return { ...current, [field]: next };
              })
            }
            onChange={(color) =>
              onChange((current) =>
                colorGarment(current, paletteId, color, paletteZone),
              )
            }
            canCustomize={canCustomizeColors}
            swatches={
              palettePiece?.art.kind === "vector" &&
              palettePiece.art.textile &&
              isPunkCut(palettePiece.art.textile)
                ? PUNK_SWATCHES
                : undefined
            }
          />
        </section>
      )}
      {cartOpen && (
        <section className="runway-cart" role="dialog" aria-label="Panier">
          <header>
            <h2>
              {cart.length
                ? cart.length + " article" + (cart.length > 1 ? "s" : "")
                : "Ton panier est vide"}
            </h2>
            <button
              aria-label="Fermer le panier"
              onClick={() => {
                setCartOpen(false);
                setPaletteId(null);
              }}
            >
              <X size={19} />
            </button>
          </header>
          <div className="fashion-cart-items">
            {cart.map(({ piece, price, color, detailColor }) => (
              <div className="fashion-cart-row" key={piece.id}>
                <AvatarItemThumbnail
                  piece={piece}
                  color={color}
                  detailColor={detailColor}
                />
                <div>
                  <strong>{piece.name}</strong>
                  {color && <small>Couleur 1 {color.toUpperCase()}</small>}
                  {detailColor && (
                    <small>Couleur 2 {detailColor.toUpperCase()}</small>
                  )}
                  <div className="runway-cart-actions">
                    {piece.colorable && garmentMaterials(piece) && (
                      <button
                        aria-label={"Personnaliser " + piece.name}
                        onClick={() => openColor(piece.id)}
                      >
                        <Palette size={18} />
                      </button>
                    )}
                    <button
                      className="runway-buy-one"
                      disabled={purchasing}
                      onClick={() => purchase(piece.id)}
                    >
                      Acheter
                    </button>
                  </div>
                </div>
                <span className="blush-item-price">
                  <Coins size={16} />
                  {price}
                </span>
                <button
                  aria-label={"Retirer " + piece.name + " du panier"}
                  onClick={() =>
                    onChange((current) => removeGarment(current, piece.id))
                  }
                >
                  <X size={17} />
                </button>
              </div>
            ))}
          </div>
          {!cart.length && (
            <p className="runway-empty-cart">
              Essaie un nouvel article ou retrouve tes achats dans « Mon
              dressing ».
            </p>
          )}
          <div className="fashion-cart-total">
            <strong>Total</strong>
            <span className="blush-item-price">
              <Coins size={19} />
              {cart.reduce((sum, item) => sum + item.price, 0)}
            </span>
          </div>
          <div className="runway-cart-footer">
            <button
              onClick={() => {
                onChange((current) => {
                  let next = current;
                  for (const item of cart)
                    next = removeGarment(next, item.piece.id);
                  return next;
                });
                setPaletteId(null);
              }}
            >
              Tout effacer
            </button>
            <button
              className="fashion-checkout"
              disabled={!onPurchase || purchasing || total > balance}
              onClick={() => purchase()}
            >
              <Check size={18} />{" "}
              {cart.length ? "Tout acheter" : "Porter la tenue"}
            </button>
          </div>
          {purchaseError && (
            <p role="alert" className="runway-purchase-error">
              {purchaseError}
            </p>
          )}
          {total > balance && (
            <p className="runway-purchase-error">
              Il te manque {total - balance} pièces pour cet achat.
            </p>
          )}
          <p className="fashion-cart-note">
            Les achats rejoignent ton dressing avec les couleurs choisies.
          </p>
        </section>
      )}
      <button
        className="blush-close"
        ref={back}
        onClick={onClose}
        aria-label="Retour à la carte"
      >
        <X size={18} />
      </button>
    </section>
  );
}
