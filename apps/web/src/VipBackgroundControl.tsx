import { useId, useState } from "react";
import { Crown, LockKeyhole } from "lucide-react";

export function VipBackgroundControl({
  enabled,
  initialValue = "",
  onApply,
}: {
  enabled: boolean;
  initialValue?: string;
  onApply: (hex: string) => void;
}) {
  const id = useId();
  const [hex, setHex] = useState(initialValue);
  const valid = /^#[0-9a-fA-F]{6}$/.test(hex);
  return (
    <form
      className="vip-background"
      onSubmit={(e) => {
        e.preventDefault();
        if (enabled && valid) onApply(hex.toUpperCase());
      }}
    >
      <label htmlFor={id}>
        <Crown size={11} />
        <span>Fond personnalisé</span>
        <b>VIP</b>
      </label>
      <div className="vip-hex-row">
        <span
          className="vip-color-chip"
          style={enabled && valid ? { background: hex } : undefined}
        />
        <input
          id={id}
          aria-label="Code couleur HEX du fond, réservé aux VIP"
          placeholder="#A17AC4"
          maxLength={7}
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          disabled={!enabled}
          spellCheck={false}
          pattern="#[0-9A-Fa-f]{6}"
        />
        <button
          disabled={!enabled || !valid}
          aria-label="Appliquer la couleur VIP"
        >
          {enabled ? "✓" : <LockKeyhole size={11} />}
        </button>
      </div>
    </form>
  );
}
