import { useSyncExternalStore } from "react";

// Sons du jeu. Les fichiers sont dans public/sounds (Kenney.nl, licence CC0).
// Chaque son a son volume, de 0 à 1, pour qu'aucun ne couvre les autres.
const VOLUMES = {
  message: 0.6,
  cadeau: 0.6,
  "demande-ami": 0.6,
  "roue-tic": 0.3,
  gain: 0.6,
  xp: 0.5,
  niveau: 0.6,
  grattage: 0.4,
  carte: 0.5,
  paire: 0.6,
  taupe: 0.6,
  "fin-de-partie": 0.6,
  essayage: 0.5,
  achat: 0.6,
} as const;
export type SoundName = keyof typeof VOLUMES;

const MUTED_KEY = "luma-sound-muted";
let muted = false;
try { muted = localStorage.getItem(MUTED_KEY) === "1"; } catch {}
const listeners = new Set<() => void>();
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

export function playSound(name: SoundName) {
  if (muted || typeof AudioContext === "undefined") return;
  const ctx = audio();
  void load(name).then((buffer) => {
    if (!buffer || muted) return;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = VOLUMES[name];
    source.connect(gain).connect(ctx.destination);
    source.start();
  });
}

export function setSoundMuted(next: boolean) {
  muted = next;
  try { localStorage.setItem(MUTED_KEY, next ? "1" : "0"); } catch {}
  if (!next) unlock();
  listeners.forEach((listener) => listener());
}
export function useSoundMuted() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => muted,
  );
}

// Les navigateurs bloquent le son avant le premier clic ou la première touche :
// on active l'audio à ce moment-là et on précharge tous les sons.
function unlock() {
  if (muted || typeof AudioContext === "undefined") return;
  audio();
  for (const name of Object.keys(VOLUMES) as SoundName[]) void load(name);
}
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
}
