import { useState } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Droplet, Eye, Pencil, RotateCcw, Smile, UserRound } from "lucide-react";
import type { AvatarFace } from "../../../packages/contracts/src/index";
import { FASHION_BASE } from "./avatar/base";
import { eyeColorHex, ORIGINAL_FACE } from "./avatar/face-customization";
import { LayeredDoll } from "./avatar/LayeredDoll";
import type { AvatarLayers } from "./avatar/model";
import { GarmentPalette } from "./shop/GarmentPalette";
import "./beauty-salon.css";

type Choices<K extends keyof AvatarFace> = readonly { value: AvatarFace[K]; label: string }[];
const choices: { [K in "lips" | "skin" | "nose"]: Choices<K> } = {
  lips: [
    { value: "original", label: "Naturel" },
    { value: "rose", label: "Rose" },
    { value: "berry", label: "Prune" },
    { value: "nude", label: "Bois de rose" },
    { value: "sorbet", label: "Sorbet brillant" },
  ],
  skin: [
    { value: "original", label: "Doré" },
    { value: "light", label: "Clair" },
    { value: "tan", label: "Hâlé" },
    { value: "deep", label: "Foncé" },
  ],
  nose: [
    { value: "original", label: "Original" },
    { value: "fine", label: "Fin" },
    { value: "soft", label: "Arrondi" },
    { value: "confettis", label: "Confettis" },
    { value: "confettis-glam", label: "Confettis Glam" },
  ],
};
const fields = [
  ["eyes", "Yeux", Eye, "201 79 78 30"],
  ["brows", "Sourcils", Pencil, "198 70 84 22"],
  ["nose", "Nez", UserRound, "218 102 44 34"],
  ["lips", "Bouche", Smile, "211 127 58 30"],
  ["skin", "Teint", Droplet, "192 55 96 95"],
] as const;

export function BeautySalon({ layers, onBack, onSave, canCustomizeColors = false }: {
  layers: AvatarLayers;
  onBack: () => void;
  canCustomizeColors?: boolean;
  onSave?: (face: AvatarFace) => void;
}) {
  const [draft, setDraft] = useState<AvatarFace>(layers.face ?? ORIGINAL_FACE);
  const [category, setCategory] = useState(0);
  const [eyeDetail, setEyeDetail] = useState(false);
  function selectCategory(index: number) {
    setCategory(index);
    setEyeDetail(false);
  }
  const [field, label, , crop] = fields[category];
  const saved = layers.face ?? ORIGINAL_FACE;
  const dirty = fields.some(([field]) => draft[field] !== saved[field]) ||
    draft.eyeModel !== saved.eyeModel || draft.browColor !== saved.browColor ||
    draft.lipColor !== saved.lipColor;
  const preview = (face: AvatarFace) => <LayeredDoll layers={{ top: null, bottom: null, shoes: null, face }} bodyBase={FASHION_BASE} />;
  return <section className="beauty-salon" aria-label="Salon d’esthétique">
    <header>
      <button type="button" aria-label="Retour au quartier" onClick={onBack}><ArrowLeft size={20} /></button>
      <h1>Salon d’esthétique</h1>
    </header>
    {onSave ? <div className="beauty-workspace">
      <div className="beauty-mirror">
        <svg role="img" aria-label="Aperçu du visage d’Iris" viewBox="148 13 184 211">
          <LayeredDoll layers={{ ...layers, face: draft, headwear: null }} bodyBase={FASHION_BASE} />
        </svg>
      </div>
      <div className="beauty-controls">
        <nav className="beauty-categories" aria-label="Catégories du salon">
          {fields.map(([key, name, Icon], index) => <button key={key} type="button"
            aria-pressed={category === index} onClick={() => selectCategory(index)}>
            <Icon size={24} aria-hidden="true" /> {name}
          </button>)}
        </nav>
        {field === "eyes" ? eyeDetail ? <div className="beauty-eye-picker">
          <button className="beauty-eye-back" type="button" onClick={() => setEyeDetail(false)}>
            <ArrowLeft size={18} aria-hidden="true" /> Retour aux paires d’yeux
          </button>
          <svg className="beauty-eye-preview" viewBox={crop} role="img" aria-label="Aperçu de la paire d’yeux">
            <LayeredDoll layers={{ top: null, bottom: null, shoes: null, face: draft }} bodyBase={FASHION_BASE} />
          </svg>
          <GarmentPalette forEyes canCustomize={canCustomizeColors} value={draft.eyeModel && draft.eyes === "original" ? "#8d53aa" : eyeColorHex(draft.eyes)}
            onChange={(eyes) => setDraft((current) => ({ ...current, eyes }))}
            onReset={() => setDraft((current) => ({ ...current, eyes: "original" }))} />
        </div> : <div className="beauty-options" role="group" aria-label="Paires d’yeux">
          {([undefined, "prisme", "prisme-glam"] as const).map((eyeModel) => <button key={eyeModel ?? "classic"} type="button"
            aria-pressed={draft.eyeModel === eyeModel} onClick={() => {
              setDraft((current) => current.eyeModel === eyeModel ? current : { ...current, eyeModel, eyes: "original" });
              setEyeDetail(true);
            }}>
            <svg viewBox={crop} aria-hidden="true">{preview({ ...draft, eyeModel, eyes: "original" })}</svg>
            {eyeModel === "prisme-glam" ? "Prisme Glam" : eyeModel ? "Prisme violet" : "Paire classique"}
          </button>)}
        </div> : field === "brows" ? <div className="beauty-options" role="group" aria-label={label}>
          {([undefined, "kawaii", "arche-glam"] as const).map((brows) => <button key={brows ?? "original"} type="button"
            aria-pressed={draft.brows === brows} onClick={() => setDraft((current) => ({ ...current, brows }))}>
            <svg viewBox={crop} aria-hidden="true">{preview({ ...draft, brows })}</svg>
            {brows === "arche-glam" ? "Arche cacao" : brows ? "Arc doux" : "Sourcils d’origine"}
          </button>)}
        </div> : <div className="beauty-options" role="group" aria-label={label}>
          {choices[field].map(({ value, label: name }) =>
            <button key={value} type="button" aria-pressed={draft[field] === value}
              onClick={() => setDraft((current) => ({ ...current, [field]: value }))}>
              <svg viewBox={crop} aria-hidden="true">
                <LayeredDoll layers={{ top: null, bottom: null, shoes: null, face: { ...draft, [field]: value } }} bodyBase={FASHION_BASE} />
              </svg>
              {name}
            </button>)}
        </div>}
        {((field === "brows" && draft.brows) || (field === "lips" && draft.lips === "sorbet")) && (() => {
          const colorField = field === "brows" ? "browColor" : "lipColor";
          return <div className="beauty-actions">
            <label>Couleur {field === "brows" ? "des sourcils" : "des lèvres"}{" "}
              <input type="color" value={draft[colorField] ?? (field === "brows" ? "#9b6754" : "#ce596e")}
                onChange={(event) => {
                  const color = event.currentTarget.value;
                  setDraft((current) => ({ ...current, [colorField]: color }));
                }} />
            </label>
            <button type="button" onClick={() => setDraft((current) => ({ ...current, [colorField]: undefined }))}>Couleur d’origine</button>
          </div>;
        })()}
        <div className="beauty-navigation">
          <button type="button" aria-label="Catégorie précédente" onClick={() => selectCategory((category + fields.length - 1) % fields.length)}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Catégorie suivante" onClick={() => setCategory((category + 1) % fields.length)}>
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="beauty-actions">
          <button type="button" onClick={() => setDraft((current) => ({ ...current,
            eyeModel: "prisme-glam", eyes: "original", brows: "arche-glam", browColor: undefined,
            nose: "confettis-glam", lips: "sorbet", lipColor: undefined }))}>
            Kawaii Glam Mature
          </button>
          <button type="button" onClick={() => setDraft((current) => ({ ...current, eyeModel: "prisme", eyes: "original", brows: "kawaii", browColor: undefined, nose: "confettis", lips: "sorbet", lipColor: undefined }))}>
            Look kawaii
          </button>
          <button type="button" onClick={() => setDraft(ORIGINAL_FACE)}>
            <RotateCcw size={16} /> Réinitialiser
          </button>
          <button type="button" disabled={!dirty} onClick={() => {
            onSave(draft);
            if (field === "eyes") setEyeDetail(false);
          }}>
            <Check size={17} /> Enregistrer
          </button>
        </div>
      </div>
    </div> : <p>Le salon est disponible pour Iris.</p>}
  </section>;
}
