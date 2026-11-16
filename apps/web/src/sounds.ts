import { useSyncExternalStore } from "react";

// Sons du jeu. Les fichiers sont dans public/sounds (Kenney.nl et OpenGameArt, licence CC0).
// `volume` est le niveau de base de chaque son, réglé pour qu'aucun ne couvre les autres.
const SOUNDS = {
  message: { group: "Notifications", label: "Message privé reçu", hint: "Sauf si la conversation est déjà ouverte.", volume: 0.5 },
  cadeau: { group: "Notifications", label: "Cadeau reçu", hint: "À la réception et à l'ouverture du paquet.", volume: 0.6 },
  "demande-ami": { group: "Notifications", label: "Demande reçue", hint: "Ami, meilleur ami ou couple.", volume: 0.6 },
  "roue-tic": { group: "Récompenses", label: "Roue : tic-tic", hint: "Répété à chaque case qui passe.", volume: 0.3 },
  gain: { group: "Récompenses", label: "Gain", hint: "Fin de la roue et ticket à gratter.", volume: 0.6 },
  xp: { group: "Récompenses", label: "Ramasser un gain", hint: "XP, pièces et diamants qui flottent.", volume: 0.6 },
  niveau: { group: "Récompenses", label: "Passage de niveau", hint: "Quand on monte d'un niveau.", volume: 0.6 },
  grattage: { group: "Récompenses", label: "Grattage du ticket", hint: "Pendant qu'on gratte.", volume: 0.4 },
  carte: { group: "Mini-jeux et boutique", label: "Memory : carte retournée", hint: "", volume: 0.5 },
  paire: { group: "Mini-jeux et boutique", label: "Memory : paire trouvée", hint: "", volume: 0.6 },
  taupe: { group: "Mini-jeux et boutique", label: "Taupe touchée", hint: "", volume: 0.6 },
  "fin-de-partie": { group: "Mini-jeux et boutique", label: "Fin de partie", hint: "Memory et taupe.", volume: 0.6 },
  achat: { group: "Mini-jeux et boutique", label: "Achat en boutique", hint: "Quand un achat est validé.", volume: 0.6 },
} as const;
export type SoundName = keyof typeof SOUNDS;
export const SOUND_NAMES = Object.keys(SOUNDS) as SoundName[];
export const SOUND_GROUPS = ["Notifications", "Récompenses", "Mini-jeux et boutique"] as const;
export const soundInfo = (name: SoundName) => SOUNDS[name];

// Réglages du joueur, gardés dans ce navigateur : tout couper, et pour chaque son
// l'activer ou non et régler son intensité (1 = niveau de base, de 0 à 2).
export const MAX_SOUND_LEVEL = 2;
type SoundSettings = {
  muted: boolean;
  sounds: Partial<Record<SoundName, { on?: boolean; level?: number }>>;
};
const SETTINGS_KEY = "luma-sound-settings";
let settings: SoundSettings = { muted: false, sounds: {} };
try {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null");
  if (saved && typeof saved === "object") settings = { muted: saved.muted === true, sounds: saved.sounds ?? {} };
} catch {}
const listeners = new Set<() => void>();

export const soundEnabled = (name: SoundName, current = settings) => current.sounds[name]?.on !== false;
export function soundLevel(name: SoundName, current = settings) {
  const level = Number(current.sounds[name]?.level ?? 1);
  return Number.isFinite(level) ? Math.min(MAX_SOUND_LEVEL, Math.max(0, level)) : 1;
}

function update(next: SoundSettings) {
  settings = next;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch {}
  if (!next.muted) unlock();
  listeners.forEach((listener) => listener());
}
export function setSoundMuted(muted: boolean) {
  update({ ...settings, muted });
}
export function setSoundEnabled(name: SoundName, on: boolean) {
  update({ ...settings, sounds: { ...settings.sounds, [name]: { ...settings.sounds[name], on } } });
}
export function setSoundLevel(name: SoundName, level: number) {
  update({ ...settings, sounds: { ...settings.sounds, [name]: { ...settings.sounds[name], level } } });
}
export function useSoundSettings() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => settings,
  );
}

let context: AudioContext | undefined;
const buffers = new Map<SoundName, Promise<AudioBuffer | null>>();

function audio() {
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume().catch(() => {});
  return context;
}
function load(name: SoundName) {
  let buffer = buffers.get(name);
  if (!buffer) {
    buffer = fetch(`/sounds/${name}.mp3`)
      .then((response) => response.arrayBuffer())
      .then((data) => audio().decodeAudioData(data))
      .catch(() => null);
    buffers.set(name, buffer);
  }
  return buffer;
}

/** `preview` joue le son même s'il est coupé, pour l'essayer depuis les paramètres. */
export function playSound(name: SoundName, { preview = false } = {}) {
  if (typeof AudioContext === "undefined") return;
  if (!preview && (settings.muted || !soundEnabled(name))) return;
  const ctx = audio();
  void load(name).then((buffer) => {
    if (!buffer || (!preview && (settings.muted || !soundEnabled(name)))) return;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = Math.min(1, SOUNDS[name].volume * soundLevel(name));
    source.connect(gain).connect(ctx.destination);
    source.start();
  });
}

// Les navigateurs bloquent le son avant le premier clic ou la première touche :
// on active l'audio à ce moment-là et on précharge tous les sons.
function unlock() {
  if (settings.muted || typeof AudioContext === "undefined") return;
  audio();
  for (const name of SOUND_NAMES) void load(name);
}
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
}
