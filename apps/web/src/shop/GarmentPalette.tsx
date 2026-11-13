import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
const hues = [
  [255, 0, 0],
  [255, 128, 0],
  [255, 255, 0],
  [128, 255, 0],
  [0, 255, 0],
  [0, 255, 128],
  [0, 255, 255],
  [0, 128, 255],
  [0, 0, 255],
  [128, 0, 255],
  [255, 0, 255],
  [255, 0, 128],
];
const hexColor = (rgb: number[]) =>
  "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
const COLOR_TABLE = [
  Array.from({ length: 21 }, (_, i) =>
    hexColor([255, 255, 255].map((c) => c * (1 - i / 20))),
  ),
  ...hues.map((rgb) =>
    Array.from({ length: 21 }, (_, i) => {
      const t = (10 - i) / 10;
      return hexColor(
        rgb.map((c) => (t >= 0 ? c + (255 - c) * t : c * (1 + t))),
      );
    }),
  ),
];
export function GarmentPalette({
  value,
  onChange,
  canCustomize,
  onReset,
  swatches,
}: {
  value: string;
  onChange: (hex: string) => void;
  canCustomize: boolean;
  onReset?: () => void;
  swatches?: readonly { name: string; hex: string }[];
}) {
  const [hex, setHex] = useState(value);
  const [tab, setTab] = useState<"table" | "advanced">("table");
  function pick(color: string) {
    onChange(color);
    setHex(color);
  }
  useEffect(() => setHex(value), [value]);
  const valid = /^#[0-9a-f]{6}$/i.test(hex);
  return (
    <div className="garment-palette">
      <p className="palette-help">
        Choisis la couleur de cette matière. Les coutures, les motifs et les
        détails protégés restent intacts.
      </p>
      <nav className="palette-tabs" aria-label="Choix du nuancier">
        <button
          type="button"
          aria-pressed={tab === "table"}
          onClick={() => setTab("table")}
        >
          Nuancier
        </button>
        <button
          type="button"
          aria-pressed={tab === "advanced"}
          onClick={() => setTab("advanced")}
        >
          Avancé · VIP
        </button>
      </nav>
      {onReset && (
        <button className="garment-original" type="button" onClick={onReset}>
          Revenir à la couleur d’origine
        </button>
      )}
      {tab === "table" && swatches && (
        <div
          className="rgb-palette recent-colors capsule-swatches"
          aria-label="Couleurs de la capsule"
        >
          {swatches.map(({ name, hex }) => (
            <button
              key={hex}
              type="button"
              style={{ backgroundColor: hex }}
              aria-label={name}
              aria-pressed={value.toLowerCase() === hex}
              title={name}
              onClick={() => pick(hex)}
            />
          ))}
        </div>
      )}
      {tab === "table" && (
        <div className="rgb-palette color-table" aria-label="Nuancier RGB">
          {COLOR_TABLE.flat().map((color, index) => (
            <button
              key={color + index}
              type="button"
              style={{ backgroundColor: color }}
              aria-label={"Couleur " + color}
              aria-pressed={value.toLowerCase() === color}
              title={color}
              onClick={() => pick(color)}
            />
          ))}
        </div>
      )}

      {tab === "advanced" && (
        <fieldset disabled={!canCustomize} className="vip-garment-color">
          <legend>
            {!canCustomize && <LockKeyhole size={13} />} Couleur libre · VIP
          </legend>
          <label>
            Roue de couleurs
            <input
              type="color"
              aria-label="Roue de couleurs VIP"
              value={value}
              onChange={(e) => {
                if (canCustomize) {
                  pick(e.target.value);
                }
              }}
            />
          </label>
          <label>
            Code HEX
            <input
              aria-label="Code HEX du vêtement VIP"
              value={hex}
              maxLength={7}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#FF80BF"
              aria-invalid={!valid}
            />
          </label>
          <button
            type="button"
            disabled={!canCustomize || !valid}
            onClick={() => {
              if (canCustomize && valid) pick(hex);
            }}
          >
            Appliquer
          </button>
        </fieldset>
      )}
      {tab === "advanced" && !canCustomize && (
        <small>La couleur libre est réservée aux VIP.</small>
      )}
    </div>
  );
}
