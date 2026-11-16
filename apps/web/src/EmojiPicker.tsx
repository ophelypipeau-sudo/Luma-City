import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";

const EMOJI_GROUPS = [
  { label: "Humeurs", emojis: ["😀", "😂", "🥰", "😍", "😘", "😊", "😉", "😎", "🤩", "🥳", "😇", "🤗", "🤔", "😴", "😮", "😢", "😭", "😡", "🙈", "👋"] },
  { label: "Cœurs", emojis: ["❤️", "🩷", "🧡", "💛", "💚", "💙", "💜", "🤍", "💖", "💕", "💔", "💌"] },
  { label: "Mode & fête", emojis: ["👗", "👠", "👜", "💄", "💅", "💍", "👑", "🎀", "🎁", "🎉", "✨", "⭐", "🔥", "💎", "👍", "🙏"] },
  { label: "Nature", emojis: ["🌸", "🌷", "🌹", "🌈", "☀️", "🌙", "🦋", "🐱", "🐶", "🐰", "🦄", "🍓", "🍰", "🧁", "🍦", "☕"] },
] as const;

/**
 * Bouton 😊 du champ de message : ouvre une grille d'emojis à glisser dans le texte.
 * Échap referme la grille et rend la main au champ (`onDone`).
 */
export function EmojiPicker({ onPick, onDone, disabled }: {
  onPick: (emoji: string) => void;
  onDone: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      onDone();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [open, onDone]);
  return (
    <div className="emoji-picker" ref={box}>
      <button type="button" className="emoji-toggle" aria-label="Ajouter un emoji" aria-expanded={open}
        disabled={disabled} onClick={() => setOpen(!open)}>
        <Smile size={22} aria-hidden="true" />
      </button>
      {open && (
        <div className="emoji-panel" role="dialog" aria-label="Emojis">
          {EMOJI_GROUPS.map((group) => (
            <section key={group.label}>
              <h3>{group.label}</h3>
              <div className="emoji-grid">
                {group.emojis.map((emoji) => (
                  // Le bouton ne prend pas le focus : le curseur reste dans le message.
                  <button type="button" key={emoji} aria-label={emoji}
                    onPointerDown={(event) => event.preventDefault()} onClick={() => onPick(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
