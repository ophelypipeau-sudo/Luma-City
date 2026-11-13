import { createMesh, skin } from "./mesh";
import type { HipRigPart } from "../HandOnHipDoll";
import type { Pose } from "./skeleton";
export const PART_ORDER: HipRigPart[] = ["arm", "body", "belt", "hand"];
function waitForTextures(
  source: SVGSVGElement,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ready = () =>
      !source.querySelector('[data-registered-texture="pending"]');
    if (signal?.aborted) {
      reject(new Error("Aperçu annulé"));
      return;
    }
    if (ready()) {
      resolve();
      return;
    }
    const finish = (error?: Error) => {
      observer.disconnect();
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      error ? reject(error) : resolve();
    };
    const abort = () => finish(new Error("Aperçu annulé"));
    const observer = new MutationObserver(() => {
      if (ready()) finish();
    });
    const timeout = setTimeout(
      () =>
        finish(new Error("Une texture de vêtement ne peut pas être préparée.")),
      15000,
    );
    observer.observe(source, {
      subtree: true,
      attributes: true,
      childList: true,
    });
    signal?.addEventListener("abort", abort, { once: true });
  });
}
/** Rasterize the existing SVG, including explicit recoloring masks, without touching source art. */
export async function snapshotSvg(
  source: SVGSVGElement,
  signal?: AbortSignal,
): Promise<HTMLImageElement> {
  // Wait for native row registration and material masks, not its temporary SVG fallback.
  await waitForTextures(source, signal);
  const clone = source.cloneNode(true) as SVGSVGElement;
  const urls = new Map<string, Promise<string>>();
  await Promise.all(
    Array.from(clone.querySelectorAll("image,feImage")).map(async (el) => {
      const href =
        el.getAttribute("href") ??
        el.getAttributeNS("http://www.w3.org/1999/xlink", "href");
      if (!href || href.startsWith("#") || href.startsWith("data:")) return;
      if (!urls.has(href))
        urls.set(
          href,
          fetch(href)
            .then((r) => {
              if (!r.ok) throw new Error("Asset indisponible : " + href);
              return r.blob();
            })
            .then(
              (blob) =>
                new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(String(reader.result));
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                }),
            ),
        );
      el.removeAttribute("xlink:href");
      el.setAttribute("href", await urls.get(href)!);
    }),
  );
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], {
      type: "image/svg+xml",
    }),
  );
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error("Le dessin du mannequin ne peut pas être préparé."));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function createRenderer(
  canvas: HTMLCanvasElement,
  images: HTMLImageElement[],
) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
  });
  if (!gl)
    throw new Error(
      "WebGL est nécessaire pour cet aperçu animé. Le jeu reste accessible.",
    );
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s) ?? "Shader");
    return s;
  };
  const vs = shader(
    gl.VERTEX_SHADER,
    "attribute vec2 p;attribute vec2 uv;varying vec2 tex;void main(){tex=uv;gl_Position=vec4(p.x/887.0*2.0-1.0,1.0-p.y/1774.0*2.0,0.0,1.0);}",
  );
  const fs = shader(
    gl.FRAGMENT_SHADER,
    "precision highp float;varying vec2 tex;uniform sampler2D image;void main(){gl_FragColor=texture2D(image,tex);}",
  );
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error("Assemblage du rendu indisponible");
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  const p = gl.getAttribLocation(program, "p"),
    uv = gl.getAttribLocation(program, "uv");
  gl.enableVertexAttribArray(p);
  gl.enableVertexAttribArray(uv);
  const surfaces = PART_ORDER.map((part, i) => {
    const mesh = createMesh(part),
      position = gl.createBuffer()!,
      textureCoords = gl.createBuffer()!,
      index = gl.createBuffer()!,
      texture = gl.createTexture()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoords);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
        mesh.vertices.flatMap((v) => [v.point[0] / 887, v.point[1] / 1774]),
      ),
      gl.STATIC_DRAW,
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      images[i],
    );
    return { mesh, position, textureCoords, index, texture };
  });
  return {
    draw(pose: Pose) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      for (const s of surfaces) {
        gl.bindTexture(gl.TEXTURE_2D, s.texture);
        gl.bindBuffer(gl.ARRAY_BUFFER, s.textureCoords);
        gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, s.position);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          skin(s.mesh.vertices, pose),
          gl.DYNAMIC_DRAW,
        );
        gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, s.index);
        gl.drawElements(
          gl.TRIANGLES,
          s.mesh.indices.length,
          gl.UNSIGNED_SHORT,
          0,
        );
      }
    },
    dispose() {
      for (const s of surfaces) {
        gl.deleteBuffer(s.position);
        gl.deleteBuffer(s.textureCoords);
        gl.deleteBuffer(s.index);
        gl.deleteTexture(s.texture);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}

