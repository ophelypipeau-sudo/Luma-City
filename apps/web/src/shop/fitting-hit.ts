const svgNamespace = "http://www.w3.org/2000/svg";
const embeddedImages = new Map<string, Promise<string>>();

function embedImage(url: string) {
  if (url.startsWith("data:")) return Promise.resolve(url);
  const existing = embeddedImages.get(url);
  if (existing) return existing;
  const embedded = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error("Image indisponible");
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }),
    )
    .catch((error) => {
      embeddedImages.delete(url);
      throw error;
    });
  if (embeddedImages.size >= 32) {
    const oldest = embeddedImages.keys().next().value;
    if (oldest) embeddedImages.delete(oldest);
  }
  embeddedImages.set(url, embedded);
  return embedded;
}

/** SVG image elements can receive pointer hits in transparent pixels. Sample
 * the painted result instead, keeping the same SVG masks and draw order. */
export async function fittingPieceAt(svg: SVGSVGElement, x: number, y: number) {
  const samples = [...svg.querySelectorAll<SVGGElement>("g[data-piece], g[data-hit-piece], g[data-hit-body]")]
    .reverse()
    .flatMap((layer) => {
      const matrix = layer.getScreenCTM();
      if (!matrix) return [];
      const point = new DOMPoint(x, y).matrixTransform(matrix.inverse());
      const bounds = layer.getBBox();
      if (
        point.x < bounds.x ||
        point.x > bounds.x + bounds.width ||
        point.y < bounds.y ||
        point.y > bounds.y + bounds.height
      )
        return [];
      const drawing = layer.cloneNode(true) as SVGGElement;
      drawing.removeAttribute("transform");
      return [{ drawing, point, id: layer.dataset.piece ?? layer.dataset.hitPiece }];
    });

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  for (const { drawing, point, id } of samples) {
    const probe = document.createElementNS(svgNamespace, "svg");
    probe.setAttribute("width", "1");
    probe.setAttribute("height", "1");
    probe.setAttribute("viewBox", `${point.x - 0.5} ${point.y - 0.5} 1 1`);
    const defs = document.createElementNS(svgNamespace, "defs");
    const included = new Set([...drawing.querySelectorAll("[id]")].map((node) => node.id));
    function includeReferences(root: Element) {
      for (const node of [root, ...root.querySelectorAll("[clip-path], [mask], [filter]")]) {
        for (const attribute of ["clip-path", "mask", "filter"]) {
          const reference = node.getAttribute(attribute)?.match(/^url\(#(.+)\)$/)?.[1];
          if (!reference || included.has(reference)) continue;
          const definition = document.getElementById(reference);
          if (!definition) continue;
          included.add(reference);
          defs.append(definition.cloneNode(true));
          includeReferences(definition);
        }
      }
    }
    includeReferences(drawing);
    probe.append(defs);
    probe.append(drawing);
    await Promise.all(
      [...probe.querySelectorAll("image, feImage")].map(async (image) => {
        const href = image.getAttribute("href");
        if (href && !href.startsWith("#"))
          image.setAttribute("href", await embedImage(href));
      }),
    );
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(probe)], {
        type: "image/svg+xml",
      }),
    );
    try {
      const preview = new Image();
      preview.src = url;
      await preview.decode();
      context.clearRect(0, 0, 1, 1);
      context.drawImage(preview, 0, 0);
      if (context.getImageData(0, 0, 1, 1).data[3] >= 24) return id;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
