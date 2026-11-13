import {
  paintColorRegions,
  type FabricTone,
} from "../../packages/domain/src/atelier-color";
import { DOLL_PATTERN } from "../../packages/domain/src/avatar-pattern";
const [width, height] = DOLL_PATTERN.canvas;
type Texture = { art: string; main: string; protected: string };
type Piece = {
  id: string;
  mainBase: string;
  mainTone: FabricTone;
  poses: Record<"front" | "hand-on-hip", Texture>;
};
const root = "/docs/capsule-premium-v1/calques/";
const heartRoot = "/docs/capsule-premium-v1/coeur/";
const select = document.querySelector<HTMLSelectElement>("#modele")!;
const picker = document.querySelector<HTMLInputElement>("#couleur")!;
const status = document.querySelector("#status")!;
const views = [...document.querySelectorAll("canvas")];
const crop = [83, 40, 720, 950] as const;
const decoded = new Map<string, Promise<HTMLImageElement>>();
const asset = (url: string) => {
  let cached = decoded.get(url);
  if (!cached) {
    const im = new Image();
    im.src = url;
    cached = im.decode().then(() => im);
    decoded.set(url, cached);
  }
  return cached;
};
const layer = () => {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c.getContext("2d", { willReadFrequently: true })!;
};
const A = "/assets/avatar/";
const names = [
  "Velvet",
  "Venus",
  "Éclat",
  "Minuit",
  "Rosalie",
  "Nova",
  "Ambre",
  "Séraphine",
  "Alba",
];
async function main() {
  const response = await fetch(root + "index.json");
  if (!response.ok) throw new Error("Le manifeste de la capsule manque");
  const { pieces } = (await response.json()) as { pieces: Piece[] };
  for (const [i, piece] of pieces.entries())
    select.add(new Option(piece.id.slice(0, 2) + " · " + names[i], piece.id));
  const [skin, hipSkin, heartSkin, hand, pants, shoes] = await Promise.all([
    asset(root + "atelier-face.png"),
    asset(root + "atelier-hanche.png"),
    asset(heartRoot + "iris.png"),
    asset(root + "atelier-main-hanche.png"),
    ...[
      "prune-fumee-v1/pantalon.png",
      "prune-fumee-v1/escarpins.png",
    ].map((p) => asset(A + p)),
  ]);
  const scenes = views.map(() => layer());
  const present = (i: number) => {
    const view = views[i];
    const w = Math.max(
      1,
      Math.round(view.getBoundingClientRect().width * window.devicePixelRatio),
    );
    const h = Math.max(1, Math.round((w * crop[3]) / crop[2]));
    if (view.width !== w || view.height !== h) {
      view.width = w;
      view.height = h;
    }
    const ctx = view.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(scenes[i].canvas, ...crop, 0, 0, w, h);
  };
  const resize = new ResizeObserver(() => views.forEach((_, i) => present(i)));
  views.forEach((view) => resize.observe(view));
  let color: string | undefined,
    revision = 0;
  const render = async () => {
    const version = ++revision,
      c = pieces.find((p) => p.id === select.value)!;
    await Promise.all(
      (["front", "hand-on-hip", "heart-hands"] as const).map(async (pose, i) => {
        const heart = pose === "heart-hands";
        const stem = heartRoot + c.id + "/heart-hands";
        const p = c.poses[heart ? "front" : pose];
        const foreground = c.id === "01-velvet" ? "right" : c.id === "05-rosalie" ? "both" : "bare";
        const [top, mask, arms] = await Promise.all([
          asset(heart ? stem + ".png" : root + p.art),
          asset(heart ? stem + "-tissu.png" : root + p.main),
          heart ? asset(heartRoot + "devant-" + foreground + ".png") : undefined,
        ]);
        if (version !== revision) return;
        const garment = layer(),
          dye = layer();
        garment.drawImage(top, 0, 0);
        dye.drawImage(mask, 0, 0);
        const image = garment.getImageData(0, 0, width, height);
        paintColorRegions(
          image.data,
          dye.getImageData(0, 0, width, height).data,
          undefined,
          {
            main: color,
            mainBase: c.mainBase,
            detailBase: "#ffffff",
            mainTone: c.mainTone,
            shading: "material",
          },
        );
        garment.putImageData(image, 0, 0);
        const scene = scenes[i];
        scene.clearRect(0, 0, width, height);
        scene.drawImage(heart ? heartSkin : i ? hipSkin : skin, 0, 0);
        scene.drawImage(shoes, 0, 0);
        scene.drawImage(pants, 0, 0);
        scene.drawImage(garment.canvas, 0, 0);
        if (arms) scene.drawImage(arms, 0, 0);
        else if (i) scene.drawImage(hand, 0, 0);
        present(i);
      }),
    );
    if (version === revision)
      status.textContent = c.id + " · " + (color ?? "teinte originale");
  };
  const update = () =>
    void render().catch((error: unknown) => {
      status.textContent = String(error);
    });
  select.addEventListener("change", update);
  document.querySelectorAll<HTMLButtonElement>("[data-dye]").forEach((b) =>
    b.addEventListener("click", () => {
      color = b.dataset.dye || undefined;
      if (color) picker.value = color;
      update();
    }),
  );
  picker.addEventListener("input", () => {
    color = picker.value;
    update();
  });
  update();
}
void main().catch((error: unknown) => {
  status.textContent = String(error);
});
