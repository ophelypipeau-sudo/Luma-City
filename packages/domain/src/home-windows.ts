import type { WindowPlacement } from "../../contracts/src/housing";
export const WINDOW_SIZES: Record<WindowPlacement["modelId"], { width: number; height: number }> = {
  "arch-ivory": { width: 150, height: 190 }, "loft-black": { width: 180, height: 170 },
  "round-oak": { width: 140, height: 140 }, "bay-garden": { width: 220, height: 170 },
};
export function constrainWindow(window: WindowPlacement): WindowPlacement {
  const { width, height } = WINDOW_SIZES[window.modelId];
  return { ...window, x: Math.round(Math.max(width / 2 + 6, Math.min(994 - width / 2, window.x))),
    y: Math.round(Math.max(height + 12, Math.min(408, window.y))) };
}
export function validateWindows(windows: readonly WindowPlacement[]) {
  const ids = new Set<string>();
  for (const window of windows) {
    if (ids.has(window.id)) throw new Error("Une fenêtre ne peut pas être placée deux fois avec le même identifiant.");
    ids.add(window.id);
    const bounded = constrainWindow(window);
    if (Math.abs(window.x - bounded.x) > .11 || Math.abs(window.y - bounded.y) > .11)
      throw new Error("Place les fenêtres à l’intérieur du mur.");
  }
}
