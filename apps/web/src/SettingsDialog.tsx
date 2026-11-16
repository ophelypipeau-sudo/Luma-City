import { useEffect, useRef } from "react";
import { Check, Palette, Play, Settings, Volume2, X } from "lucide-react";
import {
  MAX_SOUND_LEVEL, SOUND_GROUPS, SOUND_NAMES, playSound, setSoundEnabled, setSoundLevel, setSoundMuted,
  soundEnabled, soundInfo, soundLevel, useSoundSettings,
} from "./sounds";
import { VipBackgroundControl } from "./VipBackgroundControl";
import "./settings.css";

const BACKGROUNDS = [
  ["lavender", "Lavande", "#7860a8"],
  ["rose", "Rose", "#a44d70"],
  ["sage", "Sauge", "#397c69"],
  ["blue", "Bleu", "#426eab"],
] as const;

/** Paramètres du joueur : couleur du fond et réglage de chaque son du jeu. */
export function SettingsDialog({ theme, custom, vip, onTheme, onCustom, onClose }: {
  theme: string;
  custom: string;
  vip: boolean;
  onTheme: (theme: string) => void;
  onCustom: (hex: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const sound = useSoundSettings();
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);

  return (
    <dialog ref={dialog} className="settings-dialog" aria-labelledby="settings-title" onClose={onClose}>
      <header>
        <Settings size={20} aria-hidden="true" />
        <h2 id="settings-title">Paramètres</h2>
        <button type="button" className="settings-close" aria-label="Fermer" onClick={() => dialog.current?.close()}>
          <X size={18} />
        </button>
      </header>

      <section aria-labelledby="settings-background">
        <h3 id="settings-background"><Palette size={16} aria-hidden="true" /> Fond</h3>
        <div className="background-swatches">
          {BACKGROUNDS.map(([key, label, color]) => {
            const selected = (!vip || !custom) && theme === key;
            return (
              <button key={key} type="button" aria-pressed={selected} onClick={() => onTheme(key)}>
                <span style={{ backgroundColor: color }}>{selected && <Check size={13} />}</span>
                {label}
              </button>
            );
          })}
        </div>
        <VipBackgroundControl key={custom} enabled={vip} initialValue={custom} onApply={onCustom} />
      </section>

      <section aria-labelledby="settings-sounds">
        <h3 id="settings-sounds"><Volume2 size={16} aria-hidden="true" /> Sons</h3>
        <label className="settings-master">
          <input type="checkbox" checked={!sound.muted} onChange={(event) => setSoundMuted(!event.target.checked)} />
          Activer les sons
        </label>
        <div className="settings-sounds" data-muted={sound.muted}>
          {SOUND_GROUPS.map((group) => (
            <div key={group}>
              <h4>{group}</h4>
              <ul>
                {SOUND_NAMES.filter((name) => soundInfo(name).group === group).map((name) => {
                  const { label } = soundInfo(name);
                  const on = soundEnabled(name, sound);
                  const level = soundLevel(name, sound);
                  return (
                    <li key={name}>
                      <label className="settings-sound-name">
                        <input type="checkbox" checked={on} disabled={sound.muted}
                          onChange={(event) => setSoundEnabled(name, event.target.checked)} />
                        {label}
                      </label>
                      <input type="range" min={0} max={MAX_SOUND_LEVEL} step={0.1} value={level}
                        disabled={sound.muted || !on} aria-label={`Intensité : ${label}`}
                        aria-valuetext={`${Math.round(level * 100)} %`}
                        onChange={(event) => setSoundLevel(name, Number(event.target.value))}
                        onPointerUp={() => playSound(name, { preview: true })} />
                      <output>{Math.round(level * 100)} %</output>
                      <button type="button" className="settings-play" aria-label={`Écouter : ${label}`}
                        onClick={() => playSound(name, { preview: true })}>
                        <Play size={13} fill="currentColor" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </dialog>
  );
}
