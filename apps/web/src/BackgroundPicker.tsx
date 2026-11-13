import { useId, useRef } from "react";
import { Check, Palette } from "lucide-react";
import { VipBackgroundControl } from "./VipBackgroundControl";

const colors = [
  ["lavender", "Lavande", "#7860a8"],
  ["rose", "Rose", "#a44d70"],
  ["sage", "Sauge", "#397c69"],
  ["blue", "Bleu", "#426eab"],
] as const;

export function BackgroundPicker({
  theme,
  custom,
  vip,
  onTheme,
  onCustom,
}: {
  theme: string;
  custom: string;
  vip: boolean;
  onTheme: (theme: string) => void;
  onCustom: (hex: string) => void;
}) {
  const id = useId();
  const popover = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        className="rail-button background-button"
        popoverTarget={id}
        aria-label="Changer la couleur du fond"
      >
        <Palette size={16} /> <span>Fond</span>
      </button>
      <div
        className="background-picker"
        id={id}
        popover="auto"
        ref={popover}
        aria-label="Couleur du fond"
      >
        <strong>Couleur du fond</strong>
        <div className="background-swatches">
          {colors.map(([key, label, color]) => {
            const selected = (!vip || !custom) && theme === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onTheme(key);
                  popover.current?.hidePopover();
                }}
              >
                <span style={{ backgroundColor: color }}>
                  {selected && <Check size={13} />}
                </span>
                {label}
              </button>
            );
          })}
        </div>
        <VipBackgroundControl
          key={custom}
          enabled={vip}
          initialValue={custom}
          onApply={(hex) => {
            onCustom(hex);
            popover.current?.hidePopover();
          }}
        />
      </div>
    </>
  );
}
