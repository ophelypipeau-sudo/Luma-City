import { inflateSync } from "node:zlib";
/** Read the source's straight RGBA values, without premultiplication or a render
 * round trip. Only the non-interlaced 8-bit RGBA sources used here are accepted. */
export function nativeRgba(bytes: Buffer) {
  const width = bytes.readUInt32BE(16),
    height = bytes.readUInt32BE(20);
  if (
    bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a" ||
    bytes[24] !== 8 ||
    bytes[25] !== 6 ||
    bytes[28] !== 0
  )
    throw new Error("Expected native non-interlaced RGBA PNG");
  const chunks: Buffer[] = [];
  for (let p = 8; p < bytes.length;) {
    const size = bytes.readUInt32BE(p);
    if (bytes.toString("ascii", p + 4, p + 8) === "IDAT")
      chunks.push(bytes.subarray(p + 8, p + 8 + size));
    p += size + 12;
  }
  const packed = inflateSync(Buffer.concat(chunks)),
    stride = width * 4,
    pixels = new Uint8Array(stride * height);
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c,
      pa = Math.abs(p - a),
      pb = Math.abs(p - b),
      pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = packed[y * (stride + 1)];
    if (filter > 4) throw new Error("Invalid PNG filter");
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x,
        a = x >= 4 ? pixels[i - 4] : 0,
        b = y ? pixels[i - stride] : 0,
        c = y && x >= 4 ? pixels[i - stride - 4] : 0;
      const predictor = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][
        filter
      ];
      pixels[i] = (packed[y * (stride + 1) + x + 1] + predictor) & 255;
    }
  }
  return { width, height, pixels };
}
