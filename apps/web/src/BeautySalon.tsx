import { useEffect, useState } from "react";
import { ArrowLeft, Check, Droplet, Eye, Pencil, RotateCcw, Smile, Sparkles, UserRound } from "lucide-react";
import type { AvatarFace } from "../../../packages/contracts/src/index";
import { ColorWheel } from "./ColorWheel";
import { FASHION_BASE } from "./avatar/base";
import { eyeColorHex, ORIGINAL_FACE, SKIN_TONES, skinHex } from "./avatar/face-customization";
import { LayeredDoll } from "./avatar/LayeredDoll";
import type { AvatarLayers } from "./avatar/model";
import { GarmentPalette } from "./shop/GarmentPalette";

type Category = "looks" | "eyes" | "brows" | "nose" | "lips" | "skin";
/** `match` : les valeurs qui comptent pour afficher l’option comme choisie (par défaut, toutes). */
type Option = { label: string; face: Partial<AvatarFace>; match?: readonly (keyof AvatarFace)[] };

// Zones du visage (repère de la poupée) montrées dans les vignettes et le miroir.
const MIRROR = "148 13 184 211";
const CROPS = { looks: "182 34 116 122", eyes: "201 79 78 30", brows: "198 70 84 22", nose: "218 102 44 34", lips: "211 127 58 30" };
const CATEGORIES = [
  { key: "looks", label: "Looks", Icon: Sparkles, hint: "Des visages complets, prêts à porter." },
  { key: "eyes", label: "Yeux", Icon: Eye, hint: "Choisis une paire d’yeux, puis la couleur des iris." },
  { key: "brows", label: "Sourcils", Icon: Pencil, hint: "Choisis une forme, puis sa couleur." },
  { key: "nose", label: "Nez", Icon: UserRound, hint: "Choisis la forme du nez." },
  { key: "lips", label: "Bouche", Icon: Smile, hint: "Choisis un rouge à lèvres." },
  { key: "skin", label: "Teint", Icon: Droplet, hint: "Fais glisser le point sur la roue pour trouver ta couleur de peau." },
] as const;
const OPTIONS: Record<Exclude<Category, "skin">, readonly Option[]> = {
  looks: [
    { label: "Visage d’origine", face: { ...ORIGINAL_FACE, eyeModel: undefined, brows: undefined, browColor: undefined, lipColor: undefined } },
    { label: "Look kawaii", face: { eyeModel: "prisme", eyes: "original", brows: "kawaii", browColor: undefined, nose: "confettis", lips: "sorbet", lipColor: undefined } },
    { label: "Kawaii Glam Mature", face: { eyeModel: "prisme-glam", eyes: "original", brows: "arche-glam", browColor: undefined, nose: "confettis-glam", lips: "sorbet", lipColor: undefined } },
  ],
  eyes: [
    { label: "Paire classique", face: { eyeModel: undefined, eyes: "original" }, match: ["eyeModel"] },
    { label: "Prisme violet", face: { eyeModel: "prisme", eyes: "original" }, match: ["eyeModel"] },
    { label: "Prisme Glam", face: { eyeModel: "prisme-glam", eyes: "original" }, match: ["eyeModel"] },
  ],
  brows: [
    { label: "Sourcils d’origine", face: { brows: undefined, browColor: undefined }, match: ["brows"] },
    { label: "Arc doux", face: { brows: "kawaii" }, match: ["brows"] },
    { label: "Arche cacao", face: { brows: "arche-glam" }, match: ["brows"] },
  ],
  nose: [
    { label: "Original", face: { nose: "original" } },
    { label: "Fin", face: { nose: "fine" } },
    { label: "Arrondi", face: { nose: "soft" } },
    { label: "Confettis", face: { nose: "confettis" } },
    { label: "Confettis Glam", face: { nose: "confettis-glam" } },
  ],
  lips: [
    { label: "Naturel", face: { lips: "original" } },
    { label: "Rose", face: { lips: "rose" } },
    { label: "Prune", face: { lips: "berry" } },
    { label: "Bois de rose", face: { lips: "nude" } },
    { label: "Sorbet brillant", face: { lips: "sorbet" } },
  ],
};
const FACE_KEYS = ["eyes", "lips", "skin", "nose", "eyeModel", "brows", "browColor", "lipColor"] as const;
const sameFace = (a: AvatarFace, b: AvatarFace) => FACE_KEYS.every((key) => (a[key] ?? null) === (b[key] ?? null));
// Une option est choisie quand toutes ses valeurs correspondent au visage en cours.
const chosen = (face: AvatarFace, { face: values, match }: Option) =>
  (match ?? Object.keys(values) as (keyof AvatarFace)[]).every((key) => (face[key] ?? null) === (values[key] ?? null));

function FacePreview({ face, viewBox }: { face: AvatarFace; viewBox: string }) {
  return <svg viewBox={viewBox} aria-hidden="true">
    <LayeredDoll layers={{ top: null, bottom: null, shoes: null, face }} bodyBase={FASHION_BASE} />
  </svg>;
}

export function BeautySalon({ layers, onBack, onSave, canCustomizeColors = false }: {
  layers: AvatarLayers;
  onBack: () => void;
  canCustomizeColors?: boolean;
  onSave?: (face: AvatarFace) => void;
}) {
  const saved = layers.face ?? ORIGINAL_FACE;
  const [draft, setDraft] = useState<AvatarFace>(saved);
  const [category, setCategory] = useState<Category>("looks");
  const [justSaved, setJustSaved] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dirty = !sameFace(draft, saved);
  const current = CATEGORIES.find(({ key }) => key === category)!;
  const change = (patch: Partial<AvatarFace>) => {
    setJustSaved(false);
    setDraft((face) => ({ ...face, ...patch }));
  };
  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [justSaved]);
  function save() {
    if (!onSave || !dirty) return;
    onSave(draft);
    setJustSaved(true);
  }

  if (!onSave) return <section className="beauty-salon" aria-label="Salon d’esthétique">
    <div className="salon-panel salon-closed">
      <button type="button" className="salon-back" aria-label="Retour au quartier" onClick={onBack}><ArrowLeft size={20} /></button>
      <p>Le salon est réservé à Iris et aux personnages créés par les joueurs.</p>
    </div>
  </section>;

  const colorField = category === "brows" && draft.brows ? "browColor" as const
    : category === "lips" && draft.lips === "sorbet" ? "lipColor" as const : null;
  return <section className="beauty-salon" aria-label="Salon d’esthétique">
    <div className="salon-panel salon-studio">
      <header className="salon-heading">
        <button type="button" className="salon-back" aria-label="Retour au quartier"
          onClick={() => dirty ? setLeaving(true) : onBack()}><ArrowLeft size={20} /></button>
        <h1>Salon d’esthétique</h1>
      </header>
      <nav className="salon-categories" aria-label="Catégories du salon">
        {CATEGORIES.map(({ key, label, Icon }) => <button key={key} type="button"
          aria-pressed={category === key} onClick={() => setCategory(key)}>
          <span><Icon size={20} aria-hidden="true" /></span>
          <small>{label}</small>
        </button>)}
      </nav>
      <p className="salon-hint">{current.hint}</p>
      <div className="salon-choices">
        {category === "skin" ? <div className="salon-skin">
          <ColorWheel label="Couleur de peau" value={skinHex(draft.skin)} onChange={(skin) => change({ skin })} />
          <div className="salon-swatches" role="group" aria-label="Teintes rapides">
            {SKIN_TONES.map(({ label, hex }) => <button key={hex} type="button"
              aria-pressed={skinHex(draft.skin) === hex} onClick={() => change({ skin: hex })}>
              <span style={{ background: hex }} />{label}
            </button>)}
          </div>
        </div> : <>
          <div className="salon-options" role="group" aria-label={current.label}
            data-category={category}>
            {OPTIONS[category].map((option) => {
              const { label, face } = option;
              // Choisir une forme déjà portée ne remet pas sa couleur à zéro.
              const pick = chosen(draft, option) ? {} : face;
              return <button key={label} type="button" aria-pressed={chosen(draft, option)}
                onClick={() => change(pick)}>
                <FacePreview face={{ ...draft, ...face }} viewBox={CROPS[category]} />
                <span>{label}</span>
              </button>;
            })}
          </div>
          {category === "eyes" && <div className="salon-color">
            <h2>Couleur des iris</h2>
            <GarmentPalette forEyes canCustomize={canCustomizeColors}
              value={draft.eyeModel && draft.eyes === "original" ? "#8d53aa" : eyeColorHex(draft.eyes)}
              onChange={(eyes) => change({ eyes })}
              onReset={() => change({ eyes: "original" })} />
          </div>}
          {colorField && <div className="salon-color">
            <h2>{colorField === "browColor" ? "Couleur des sourcils" : "Couleur des lèvres"}</h2>
            <div className="salon-color-wheel">
              <ColorWheel label={colorField === "browColor" ? "Couleur des sourcils" : "Couleur des lèvres"}
                value={draft[colorField] ?? (colorField === "browColor" ? "#9b6754" : "#ce596e")}
                onChange={(color) => change({ [colorField]: color })} />
              <button type="button" className="salon-secondary" disabled={!draft[colorField]}
                onClick={() => change({ [colorField]: undefined })}>Couleur d’origine</button>
            </div>
          </div>}
        </>}
      </div>
    </div>

    <aside className="salon-panel salon-mirror-panel" aria-label="Miroir">
      <div className="salon-mirror">
        <svg role="img" aria-label="Aperçu de ton visage" viewBox={MIRROR}>
          <LayeredDoll layers={{ ...layers, face: draft, headwear: null }} bodyBase={FASHION_BASE} />
        </svg>
      </div>
      {leaving ? <div className="salon-leaving" role="alertdialog" aria-label="Changements non enregistrés">
        <p>Tes changements ne sont pas enregistrés.</p>
        <button type="button" className="salon-primary" onClick={() => { save(); onBack(); }}>
          <Check size={17} aria-hidden="true" /> Enregistrer et quitter
        </button>
        <button type="button" className="salon-secondary" onClick={onBack}>Quitter sans enregistrer</button>
        <button type="button" className="salon-link" onClick={() => setLeaving(false)}>Rester au salon</button>
      </div> : <>
        <p className="salon-status" role="status">
          {justSaved ? "C’est enregistré !" : dirty ? "Changements non enregistrés" : "Ton visage actuel"}
        </p>
        <div className="salon-actions">
          <button type="button" className="salon-secondary" disabled={!dirty}
            onClick={() => { setDraft(saved); setJustSaved(false); }}>
            <RotateCcw size={16} aria-hidden="true" /> Annuler
          </button>
          <button type="button" className="salon-primary" disabled={!dirty} onClick={save}>
            <Check size={17} aria-hidden="true" /> Enregistrer
          </button>
        </div>
      </>}
    </aside>
  </section>;
}
