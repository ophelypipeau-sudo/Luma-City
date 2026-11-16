import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

type HSV = { h: number; s: number; v: number };

export function hexToHsv(hex: string): HSV {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), delta = max - Math.min(r, g, b);
  const h = !delta ? 0 : max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return { h: (h * 60 + 360) % 360, s: max ? delta / max : 0, v: max };
}
export function hsvToHex({ h, s, v }: HSV) {
  const channel = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))));
  };
  return "#" + [5, 3, 1].map((n) => channel(n).toString(16).padStart(2, "0")).join("");
}

/**
 * Roue de couleur : l'angle donne la teinte, la distance au centre l'intensité,
 * et le curseur en dessous la clarté. Pendant le glissé, la couleur est envoyée
 * au plus toutes les 150 ms pour garder un aperçu fluide.
 */
export function ColorWheel({ value, onChange, label }: {
  value: string;
  onChange: (hex: string) => void;
  label: string;
}) {
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const wheel = useRef<HTMLDivElement>(null);
  const sent = useRef({ at: 0, hex: value });
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Une couleur changée ailleurs (raccourci, annulation) replace le curseur.
  useEffect(() => {
    if (value.toLowerCase() !== sent.current.hex.toLowerCase()) {
      sent.current.hex = value;
      setHsv(hexToHsv(value));
    }
  }, [value]);
  useEffect(() => () => clearTimeout(pending.current), []);

  function emit(next: HSV, final = false) {
    setHsv(next);
    const hex = hsvToHex(next);
    clearTimeout(pending.current);
    const send = () => {
      sent.current = { at: Date.now(), hex };
      onChange(hex);
    };
    if (final || Date.now() - sent.current.at > 150) send();
    else pending.current = setTimeout(send, 150);
  }
  function pick(event: PointerEvent<HTMLDivElement>, final = false) {
    const box = wheel.current!.getBoundingClientRect();
    const x = event.clientX - box.left - box.width / 2;
    const y = event.clientY - box.top - box.height / 2;
    const h = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
    const s = Math.min(1, Math.hypot(x, y) / (box.width / 2));
    emit({ ...hsv, h, s }, final);
  }
  const angle = hsv.h * Math.PI / 180;
  const color = hsvToHex(hsv);
  return (
    <div className="color-wheel">
      <div
        ref={wheel}
        className="color-wheel-disc"
        role="slider"
        tabIndex={0}
        aria-label={`${label} : teinte`}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(hsv.h)}
        aria-valuetext={color}
        style={{ "--wheel-value": hsv.v } as CSSProperties}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); pick(event); }}
        onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) pick(event); }}
        onPointerUp={(event) => pick(event, true)}
        onKeyDown={(event) => {
          const step = { ArrowLeft: -5, ArrowRight: 5, ArrowUp: 5, ArrowDown: -5 }[event.key];
          if (!step) return;
          event.preventDefault();
          emit(event.key.startsWith("ArrowL") || event.key.startsWith("ArrowR")
            ? { ...hsv, h: (hsv.h + step + 360) % 360 }
            : { ...hsv, s: Math.min(1, Math.max(0, hsv.s + step / 100)) }, true);
        }}
      >
        <span
          className="color-wheel-knob"
          style={{
            left: `${50 + Math.sin(angle) * hsv.s * 50}%`,
            top: `${50 - Math.cos(angle) * hsv.s * 50}%`,
            background: color,
          }}
        />
      </div>
      <label className="color-wheel-light">
        <span>Clarté</span>
        <input type="range" min={0.15} max={1} step={0.01} value={hsv.v}
          style={{ "--wheel-hue": hsvToHex({ ...hsv, v: 1 }) } as CSSProperties}
          onChange={(event) => emit({ ...hsv, v: Number(event.target.value) })} />
      </label>
    </div>
  );
}
