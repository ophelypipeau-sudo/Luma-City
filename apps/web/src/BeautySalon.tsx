import { useState } from "react";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import type { AvatarFace } from "../../../packages/contracts/src/index";
import { FASHION_BASE } from "./avatar/base";
import { ORIGINAL_FACE } from "./avatar/face-customization";
import { LayeredDoll } from "./avatar/LayeredDoll";
import type { AvatarLayers } from "./avatar/model";
import "./beauty-salon.css";

type Choices<K extends keyof AvatarFace> = readonly { value: AvatarFace[K]; label: string; sample?: string }[];
const choices: { [K in keyof AvatarFace]: Choices<K> } = {
  eyes: [
    { value: "original", label: "Noisette", sample: "#9e8a50" },
    { value: "green", label: "Vert", sample: "#67834c" },
    { value: "blue", label: "Bleu", sample: "#608dad" },
    { value: "brown", label: "Brun", sample: "#895132" },
  ],
  lips: [
    { value: "original", label: "Naturel", sample: "#b95d66" },
    { value: "rose", label: "Rose", sample: "#d36286" },
    { value: "berry", label: "Prune", sample: "#a03d6b" },
    { value: "nude", label: "Bois de rose", sample: "#b16f58" },
  ],
  skin: [
    { value: "original", label: "Doré", sample: "#df9861" },
    { value: "light", label: "Clair", sample: "#edba90" },
    { value: "tan", label: "Hâlé", sample: "#bb7850" },
    { value: "deep", label: "Foncé", sample: "#925337" },
  ],
  nose: [
    { value: "original", label: "Original" },
    { value: "fine", label: "Fin" },
    { value: "soft", label: "Arrondi" },
  ],
};
const fields = [
  ["eyes", "Yeux"], ["lips", "Bouche"], ["skin", "Teint"], ["nose", "Nez"],
] as const;

export function BeautySalon({ layers, onBack, onSave }: {
  layers: AvatarLayers;
  onBack: () => void;
  onSave?: (face: AvatarFace) => void;
}) {
  const [draft, setDraft] = useState<AvatarFace>(layers.face ?? ORIGINAL_FACE);
  const saved = layers.face ?? ORIGINAL_FACE;
  const dirty = fields.some(([field]) => draft[field] !== saved[field]);
  return <section className="beauty-salon" aria-label="Salon d’esthétique">
    <header>
      <button type="button" aria-label="Retour au quartier" onClick={onBack}><ArrowLeft size={20} /></button>
      <h1>Salon d’esthétique</h1>
    </header>
    {onSave ? <div className="beauty-workspace">
      <div className="beauty-mirror">
        <svg role="img" aria-label="Aperçu du visage d’Iris" viewBox="148 13 184 211">
          <LayeredDoll layers={{ ...layers, face: draft, hair: null, headwear: null }} bodyBase={FASHION_BASE} />
        </svg>
      </div>
      <div className="beauty-controls">
        {fields.map(([field, label]) => <fieldset key={field}>
          <legend>{label}</legend>
          <div className="beauty-options">
            {choices[field].map(({ value, label: name, sample }) =>
              <button key={value} type="button" aria-pressed={draft[field] === value}
                onClick={() => setDraft((current) => ({ ...current, [field]: value }))}>
                {sample && <i style={{ background: sample }} aria-hidden="true" />}
                {name}
              </button>)}
          </div>
        </fieldset>)}
        <div className="beauty-actions">
          <button type="button" onClick={() => setDraft(ORIGINAL_FACE)}>
            <RotateCcw size={16} /> Réinitialiser
          </button>
          <button type="button" disabled={!dirty} onClick={() => onSave(draft)}>
            <Check size={17} /> Enregistrer
          </button>
        </div>
      </div>
    </div> : <p>Le salon est disponible pour Iris.</p>}
  </section>;
}
