import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Check,
  Save,
  Plus,
  Trash2,
  Undo2,
} from "lucide-react";
import type {
  AtelierDraft,
  WorkshopPublication,
} from "../../../../packages/contracts/src/atelier";
import { checkIds } from "../../../../packages/contracts/src/atelier";
import {
  ATELIER_PATTERNS,
  type PatternId,
} from "../../../../packages/domain/src/atelier-patterns";
import { FASHION_BASE } from "../avatar/base";
import { DEFAULT_LAYERS, type AvatarLayers } from "../avatar/model";
import { LayeredDoll, AvatarItemThumbnail } from "../avatar/LayeredDoll";
import { registerAtelierGarment } from "../avatar/catalog";
import { assertPoseProfile } from "../avatar/pose-wardrobe";
import { draftGarment, atelierGarment } from "./catalog";
import { atelierApi, imageData } from "./api";
import { MaskEditor } from "./MaskEditor";
import { LocalCutout } from "./LocalCutout";
import "./atelier.css";
const labels = {
  neck: "Encolure et sous-vêtements couverts",
  shoulders: "Épaules et emmanchures ajustées",
  waist: "Taille et ourlet harmonisés",
  hands: "Bras et mains correctement visibles",
  colors: "Zones de couleur et détails protégés",
  style: "Style, coutures et parties reconstruites vérifiés",
};
const states = {
  draft: "Photo à préparer",
  preparing: "Traitement en cours",
  review: "À vérifier",
  published: "Publié",
  failed: "À reprendre",
};
export function Atelier({
  onClose,
  onPublished,
  onCatalogChanged,
}: {
  onClose: () => void;
  onPublished: (publication: WorkshopPublication) => void;
  onCatalogChanged: (publications: WorkshopPublication[]) => void;
}) {
  const [drafts, setDrafts] = useState<AtelierDraft[]>([]),
    [draft, setDraft] = useState<AtelierDraft>(),
    [dirty, setDirty] = useState(false),
    [maskDirty, setMaskDirty] = useState(false),
    [cutoutDirty, setCutoutDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [note, setNote] = useState(""),
    [guides, setGuides] = useState(true),
    [inspection, setInspection] = useState<
      "normal" | "body-cutaway" | "garments"
    >("normal"),
    [testColor, setTestColor] = useState<string>(),
    [tab, setTab] = useState<"fit" | "colors" | "review">("fit"),
    [registered, setRegistered] = useState(false);
  const sourceInput = useRef<HTMLInputElement>(null);
  const [trash, setTrash] = useState<AtelierDraft[]>([]);
  const working = busy || draft?.status === "preparing";
  function accept(d: AtelierDraft) {
    setDraft(d);
    setDirty(false);
    setDrafts((old) => [d, ...old.filter((i) => i.id !== d.id)]);
  }
  useEffect(() => {
    Promise.all([
      atelierApi<AtelierDraft[]>("/drafts"),
      atelierApi<AtelierDraft[]>("/trash"),
    ])
      .then(([list, removed]) => {
        setDrafts(list);
        setTrash(removed);
        if (list[0]) setDraft(list[0]);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (draft?.status !== "preparing") return;
    let cancelled = false;
    const timer = setInterval(() => {
      atelierApi<AtelierDraft>("/drafts/" + draft.id)
        .then((d) => {
          if (!cancelled) accept(d);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        });
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [draft?.id, draft?.status]);
  function patch(p: Partial<AtelierDraft>) {
    if (!draft || working) return;
    const affectsFit = !!p.placement || !!p.pattern;
    const affectsColors =
      p.mainColor !== undefined ||
      p.detailColor !== undefined ||
      p.hasDetail !== undefined;
    setDraft({
      ...draft,
      ...p,
      status: draft.preparedUrl ? "review" : draft.status,
      report: affectsFit ? undefined : draft.report,
      checks: p.checks ?? (affectsFit || affectsColors ? [] : draft.checks),
    });
    setDirty(true);
    setNote("");
  }
  async function save() {
    if (!draft) throw new Error("Choisir un brouillon");
    if (!dirty) return draft;
    const d = await atelierApi<AtelierDraft>(
      "/drafts/" + draft.id,
      draft,
      "PUT",
    );
    accept(d);
    return d;
  }
  async function run(
    action: (d: AtelierDraft) => Promise<void>,
    savingCutout = false,
  ) {
    if (maskDirty || (cutoutDirty && !savingCutout)) {
      setError(
        "Enregistre le détourage et les zones de couleur avant cette action.",
      );
      return false;
    }
    setBusy(true);
    setError("");
    setNote("");
    try {
      const d = await save();
      await action(d);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (dirty || maskDirty || cutoutDirty) {
      setError(
        "Enregistre le brouillon et ses zones avant d’ouvrir une autre source.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const d = await atelierApi<AtelierDraft>("/drafts", {
        image: await imageData(file),
      });
      accept(d);
      setTab("fit");
      setTestColor(undefined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function moveToTrash(d: AtelierDraft, restore = false) {
    setBusy(true);
    setError("");
    try {
      const updated = await atelierApi<AtelierDraft>(
        `/drafts/${d.id}/${restore ? "restore" : "trash"}`,
        {},
      );
      if (restore) {
        setTrash((old) => old.filter((item) => item.id !== d.id));
        accept(updated);
      } else {
        setDrafts((old) => old.filter((item) => item.id !== d.id));
        setTrash((old) => [updated, ...old.filter((item) => item.id !== d.id)]);
        setDraft(undefined);
        setDirty(false);
        setMaskDirty(false);
        setCutoutDirty(false);
      }
      onCatalogChanged(await atelierApi<WorkshopPublication[]>("/catalog"));
      setNote(
        restore
          ? "Import restauré."
          : "Import placé dans la corbeille. Tu peux le restaurer à gauche.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  let layers: AvatarLayers = DEFAULT_LAYERS,
    piece = draft?.preparedUrl ? draftGarment(draft) : undefined;
  if (piece && draft) {
    registerAtelierGarment(piece);
    layers = {
      ...DEFAULT_LAYERS,
      top: piece.id,
      colors: testColor ? { [piece.id]: testColor } : undefined,
    };
  }
  return (
    <section className="atelier" aria-label="Atelier d’import de vêtements">
      <header className="atelier-header">
        <button
          disabled={working}
          onClick={() => {
            if (maskDirty || cutoutDirty) {
              setError(
                "Enregistre le détourage et les zones de couleur avant de quitter.",
              );
              return;
            }
            if (dirty) void run(async () => onClose());
            else onClose();
          }}
        >
          <ArrowLeft size={17} /> Boutique
        </button>
        <div>
          <span>L’ATELIER LOCAL · GRATUIT</span>
          <h1>De l’inspiration à ton dressing</h1>
        </div>
        <button
          disabled={working}
          onClick={() => {
            if (dirty || maskDirty || cutoutDirty) {
              setError("Enregistre le travail en cours.");
              return;
            }
            sourceInput.current?.click();
          }}
        >
          <Plus size={16} /> Importer une image
        </button>
      </header>
      <div className="atelier-layout">
        <aside className="atelier-library">
          <h2>Mes imports</h2>
          <label
            className="atelier-drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void upload(e.dataTransfer.files[0]);
            }}
          >
            <Upload size={23} />
            <strong>Choisir une image</strong>
            <small>
              Photo, illustration ou tenue complète
              <br />
              PNG, JPEG, WebP · 12 Mo max.
            </small>
            <input
              ref={sourceInput}
              aria-label="Image source de la tenue"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={busy}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <details className="atelier-help">
            <summary>Comment ça marche ?</summary>
            <p>
              <strong>1.</strong> Importe ta photo ou ton PNG transparent.
            </p>
            <p>
              <strong>2.</strong> Choisis une coupe. Retire le fond, puis la
              peau et les autres pièces avec le contour et la gomme.
            </p>
            <p>
              <strong>3.</strong> Clique sur « Enregistrer et essayer sur Iris
              », puis ajuste les raccords et les couleurs.
            </p>
            <p>
              <strong>4.</strong> Ouvre « Vérifier » pour publier. Gratuit, en
              local, sans clé. Les hauts sont pris en charge ; les parties
              cachées restent à retoucher.
            </p>
          </details>
          <div className="atelier-drafts">
            {drafts.map((d) => (
              <button
                key={d.id}
                aria-pressed={draft?.id === d.id}
                disabled={busy}
                onClick={() => {
                  if (dirty || maskDirty || cutoutDirty) {
                    setError(
                      "Enregistre le travail en cours avant de changer d’import.",
                    );
                    return;
                  }
                  accept(d);
                  setTestColor(undefined);
                }}
              >
                <img src={d.sourceUrl} alt="" />
                <span>
                  {d.name}
                  <small>{states[d.status]}</small>
                </span>
              </button>
            ))}
          </div>
          <details className="atelier-trash">
            <summary>Corbeille ({trash.length})</summary>
            <p>
              La suppression retire aussi les versions de la boutique. Les
              fichiers sont conservés pour pouvoir restaurer.
            </p>
            {trash.map((d) => (
              <div key={d.id}>
                <span>{d.name}</span>
                <button
                  disabled={working || dirty || maskDirty || cutoutDirty}
                  onClick={() => void moveToTrash(d, true)}
                >
                  <Undo2 size={14} /> Restaurer {d.name}
                </button>
              </div>
            ))}
            {!trash.length && <small>Aucun import supprimé.</small>}
          </details>
        </aside>
        {!draft ? (
          <div className="atelier-welcome">
            <Sparkles size={35} />
            <h2>Comment importer un vêtement ?</h2>
            <p>
              Ajoute une photo pour préparer un haut sur le mannequin du jeu.
              Les sources et les corrections restent dans tes brouillons.
            </p>
            <ol>
              <li>Importer une image depuis ton ordinateur.</li>
              <li>
                Choisir sa coupe, retirer le fond et garder uniquement le haut.
              </li>
              <li>
                Enregistrer le détourage, essayer sur Iris et ajuster les
                raccords.
              </li>
              <li>Corriger les couleurs, vérifier puis publier en boutique.</li>
            </ol>
            <p className="atelier-info">
              Atelier gratuit et local. Aucune clé, aucun service d’IA externe.
              Une photo sur mannequin demande de retirer la peau et les autres
              vêtements manuellement ; les zones cachées ne sont pas inventées.
            </p>
          </div>
        ) : (
          <>
            <div className="atelier-work">
              <div className="atelier-title">
                <div>
                  <span>
                    {states[draft.status]} · version de travail {draft.revision}
                  </span>
                  <h2>{draft.name}</h2>
                </div>
                <button
                  disabled={working || !dirty}
                  onClick={() =>
                    void run(async () => setNote("Brouillon enregistré."))
                  }
                >
                  <Save size={16} /> Enregistrer
                </button>
                <button
                  disabled={working}
                  className="atelier-delete"
                  onClick={() => void moveToTrash(draft)}
                >
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>
              <div className="atelier-source">
                <img
                  src={draft.sourceUrl}
                  alt="Référence de la tenue importée"
                />
                <div>
                  <h3>1. Choisir la coupe du haut</h3>
                  <p>
                    Retire le fond et isole une seule pièce dans l’éditeur
                    ci-dessous. Le corps d’Iris garde sa taille ; seuls les
                    réglages du vêtement changent.
                  </p>
                  <small>
                    Traitement gratuit sur cet ordinateur · aucun appel OpenAI.
                  </small>
                </div>
              </div>
              <div className="atelier-fields">
                <label>
                  Nom de la pièce
                  <input
                    value={draft.name}
                    maxLength={80}
                    disabled={working}
                    onChange={(e) => patch({ name: e.target.value })}
                  />
                </label>
                <label>
                  Patron
                  <select
                    value={draft.pattern}
                    disabled={working}
                    onChange={(e) =>
                      patch({ pattern: e.target.value as PatternId })
                    }
                  >
                    {Object.entries(ATELIER_PATTERNS).map(([id, p]) => (
                      <option key={id} value={id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="atelier-notes">
                Détails à conserver / parties cachées
                <textarea
                  value={draft.notes}
                  maxLength={3000}
                  disabled={working}
                  onChange={(e) => patch({ notes: e.target.value })}
                  placeholder="Ex. col rond, coutures bleues, conserver le motif ; bras cachant une manche…"
                />
              </label>
              <details
                className="atelier-local-section"
                open={!draft.preparedUrl}
              >
                <summary>
                  {draft.preparedUrl
                    ? "Retoucher le détourage enregistré"
                    : "2. Détourer gratuitement"}
                </summary>
                <LocalCutout
                  key={draft.id}
                  source={draft.sourceUrl}
                  initial={draft.preparedUrl}
                  disabled={working || maskDirty}
                  onDirty={setCutoutDirty}
                  onSave={(image, aligned) =>
                    run(async (d) => {
                      accept(
                        await atelierApi<AtelierDraft>(
                          "/drafts/" + d.id + "/prepared",
                          { image, registered: aligned },
                        ),
                      );
                      setCutoutDirty(false);
                      setTab("fit");
                      setNote(
                        "Détourage enregistré. Ajuste les repères sur Iris, puis vérifie les couleurs.",
                      );
                    }, true)
                  }
                />
              </details>
              <details className="atelier-direct-import">
                <summary>J’ai déjà un PNG transparent prêt à porter</summary>
                <div className="atelier-tools">
                  <label className="atelier-file-button">
                    Charger un vêtement sans fond
                    <input
                      aria-label="Calque PNG du vêtement seul"
                      type="file"
                      accept="image/png"
                      disabled={working}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f)
                          void run(async (d) =>
                            accept(
                              await atelierApi<AtelierDraft>(
                                "/drafts/" + d.id + "/prepared",
                                { image: await imageData(f), registered },
                              ),
                            ),
                          );
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <label className="atelier-checkbox">
                  <input
                    type="checkbox"
                    checked={registered}
                    onChange={(e) => setRegistered(e.target.checked)}
                  />{" "}
                  Le PNG est déjà calé sur le canevas 887 × 1774
                </label>
              </details>
              {working && <p className="atelier-info">Enregistrement local…</p>}
              {draft.error && (
                <p className="atelier-error" role="alert">
                  {draft.error}
                </p>
              )}
              {piece && (
                <>
                  <nav
                    className="atelier-tabs"
                    aria-label="Étapes de validation"
                  >
                    {(["fit", "colors", "review"] as const).map((t) => (
                      <button
                        key={t}
                        aria-pressed={tab === t}
                        onClick={() => {
                          if (maskDirty && t !== "colors") {
                            setError(
                              "Enregistre les zones de couleur avant de changer d’étape.",
                            );
                            return;
                          }
                          setTab(t);
                        }}
                      >
                        {t === "fit"
                          ? "1. Ajuster"
                          : t === "colors"
                            ? "2. Couleurs"
                            : "3. Vérifier"}
                      </button>
                    ))}
                  </nav>
                  {tab === "fit" && (
                    <div className="atelier-adjustments">
                      <h3>Repères du vêtement</h3>
                      <p>
                        Les réglages déplacent uniquement la pièce. Le visage,
                        les mains et le corps gardent leur taille.
                      </p>
                      {(
                        [
                          {
                            id: "x",
                            label: "Position horizontale",
                            min: -160,
                            max: 160,
                            step: 1,
                          },
                          {
                            id: "y",
                            label: "Position verticale",
                            min: -180,
                            max: 180,
                            step: 1,
                          },
                          {
                            id: "scaleX",
                            label: "Largeur",
                            min: 0.6,
                            max: 1.4,
                            step: 0.01,
                          },
                          {
                            id: "scaleY",
                            label: "Longueur",
                            min: 0.6,
                            max: 1.4,
                            step: 0.01,
                          },
                        ] as const
                      ).map((f) => (
                        <label key={f.id}>
                          {f.label}
                          <input
                            type="range"
                            min={f.min}
                            max={f.max}
                            step={f.step}
                            value={draft.placement[f.id]}
                            disabled={working}
                            onChange={(e) =>
                              patch({
                                placement: {
                                  ...draft.placement,
                                  [f.id]: Number(e.target.value),
                                },
                              })
                            }
                          />
                          <output>{draft.placement[f.id]}</output>
                        </label>
                      ))}
                      <button
                        onClick={() =>
                          patch({
                            placement: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
                          })
                        }
                      >
                        Revenir aux repères initiaux
                      </button>
                    </div>
                  )}
                  {tab === "colors" && (
                    <>
                      <div className="atelier-fields">
                        <label>
                          Couleur d’origine du tissu
                          <input
                            type="color"
                            value={draft.mainColor}
                            onChange={(e) =>
                              patch({ mainColor: e.target.value })
                            }
                          />
                        </label>
                        <label className="atelier-checkbox">
                          <input
                            type="checkbox"
                            checked={draft.hasDetail}
                            onChange={(e) =>
                              patch({ hasDetail: e.target.checked })
                            }
                          />{" "}
                          Deuxième matière recolorable
                        </label>
                        {draft.hasDetail && (
                          <>
                            <label>
                              Nom de la deuxième zone
                              <input
                                value={draft.detailLabel}
                                maxLength={60}
                                onChange={(e) =>
                                  patch({ detailLabel: e.target.value })
                                }
                              />
                            </label>
                            <label>
                              Couleur d’origine des détails
                              <input
                                type="color"
                                value={draft.detailColor}
                                onChange={(e) =>
                                  patch({ detailColor: e.target.value })
                                }
                              />
                            </label>
                          </>
                        )}
                      </div>
                      <MaskEditor
                        disabled={working}
                        key={draft.id}
                        front={draft.preparedUrl!}
                        main={draft.mask1Url}
                        detail={draft.mask2Url}
                        onDirty={setMaskDirty}
                        onSave={async (main, detail) => {
                          const d = await save();
                          accept(
                            await atelierApi<AtelierDraft>(
                              "/drafts/" + d.id + "/masks",
                              { main, detail },
                            ),
                          );
                        }}
                      />
                    </>
                  )}
                  {tab === "review" && (
                    <section className="atelier-review">
                      <h3>Vérifier avant publication</h3>
                      <button
                        disabled={working || maskDirty}
                        onClick={() =>
                          void run(async (d) =>
                            accept(
                              await atelierApi<AtelierDraft>(
                                "/drafts/" + d.id + "/inspect",
                                {},
                              ),
                            ),
                          )
                        }
                      >
                        Contrôler les raccords
                      </button>
                      {draft.report?.map((r, i) => (
                        <p
                          className={r.ok ? "atelier-pass" : "atelier-error"}
                          key={i}
                        >
                          {r.ok ? "✓" : "À corriger :"} {r.label}
                        </p>
                      ))}
                      {checkIds.map((c) => (
                        <label className="atelier-checkbox" key={c}>
                          <input
                            type="checkbox"
                            checked={draft.checks.includes(c)}
                            disabled={working || maskDirty}
                            onChange={(e) =>
                              patch({
                                checks: e.target.checked
                                  ? [...draft.checks, c]
                                  : draft.checks.filter((id) => id !== c),
                              })
                            }
                          />
                          {labels[c]}
                        </label>
                      ))}
                      <label>
                        Prix en monnaie
                        <input
                          type="number"
                          min="0"
                          max="100000"
                          value={draft.price}
                          onChange={(e) =>
                            patch({ price: Number(e.target.value) })
                          }
                        />
                      </label>
                      <button
                        className="atelier-primary"
                        disabled={
                          draft.status === "published" ||
                          working ||
                          maskDirty ||
                          !checkIds.every((c) => draft.checks.includes(c)) ||
                          !draft.report?.every((r) => r.ok)
                        }
                        onClick={() =>
                          void run(async (d) => {
                            // This archived atelier prepares front-only drafts. Keep the
                            // source intact until the three pose drawings are calibrated.
                            assertPoseProfile(draftGarment(d));
                            const result = await atelierApi<{
                              draft: AtelierDraft;
                              publication: WorkshopPublication;
                            }>("/drafts/" + d.id + "/publish", {});
                            accept(result.draft);
                            registerAtelierGarment(
                              atelierGarment(result.publication),
                              true,
                            );
                            onPublished(result.publication);
                            setNote(
                              "Pièce publiée dans la boutique. Les sources et cette version sont conservées.",
                            );
                          })
                        }
                      >
                        <Check size={16} /> Valider et publier
                      </button>
                      {maskDirty && (
                        <p>Enregistre les zones de couleur avant de valider.</p>
                      )}
                    </section>
                  )}
                  {draft.status === "published" && (
                    <p className="atelier-info">
                      Cette version est publiée. Une modification créera une
                      nouvelle version sans remplacer l’ancienne.
                    </p>
                  )}
                </>
              )}
            </div>
            <aside className="atelier-preview">
              <header>
                <span>TON MANNEQUIN · BASE UNIQUE</span>
                <h2>La pièce prend forme</h2>
              </header>
              <svg
                viewBox="0 0 480 1024"
                role="img"
                aria-label="Aperçu du vêtement importé sur le mannequin"
              >
                <LayeredDoll
                  bodyBase={FASHION_BASE}
                  layers={layers}
                  inspection={inspection}
                />
                {guides && (
                  <g
                    transform={`translate(${(480 - (887 * 1024) / 1774) / 2} 0) scale(${1024 / 1774})`}
                    fill="none"
                    stroke="#ed259e"
                    strokeWidth="2"
                  >
                    <path d={ATELIER_PATTERNS[draft.pattern].path} />
                    {ATELIER_PATTERNS[draft.pattern].anchors.map((a) => (
                      <circle key={a.label} cx={a.x} cy={a.y} r="6">
                        <title>{a.label}</title>
                      </circle>
                    ))}
                  </g>
                )}
              </svg>
              <label className="atelier-checkbox">
                <input
                  type="checkbox"
                  checked={guides}
                  onChange={(e) => setGuides(e.target.checked)}
                />{" "}
                Repères du patron
              </label>
              <div className="atelier-preview-controls">
                <select
                  aria-label="Inspection des calques"
                  value={inspection}
                  onChange={(e) =>
                    setInspection(e.target.value as typeof inspection)
                  }
                >
                  <option value="normal">Tenue complète</option>
                  <option value="body-cutaway">
                    Corps masqué, sans vêtements
                  </option>
                  <option value="garments">Vêtements seuls</option>
                </select>
                <select
                  aria-label="Tester une couleur"
                  value={testColor ?? ""}
                  onChange={(e) => setTestColor(e.target.value || undefined)}
                >
                  <option value="">Couleur d’origine</option>
                  <option value="#ffffff">Blanc</option>
                  <option value="#151515">Noir</option>
                  <option value="#ff80c0">Rose</option>
                  <option value="#408000">Vert</option>
                </select>
              </div>
              {piece && (
                <div className="atelier-item-preview">
                  <AvatarItemThumbnail piece={piece} />
                  <small>Vignette sans personnage</small>
                </div>
              )}
              {draft.warnings.map((w, i) => (
                <p className="atelier-warning" key={i}>
                  {w}
                </p>
              ))}
            </aside>
          </>
        )}
      </div>
      {error && (
        <div className="atelier-toast atelier-error" role="alert">
          {error}
          <button aria-label="Fermer l’erreur" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {note && (
        <div className="atelier-toast" role="status">
          {note}
        </div>
      )}
    </section>
  );
}
