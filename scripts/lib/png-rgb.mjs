// Rewrite a PNG as plain RGB (colour type 2), dropping its alpha channel.
// App Store Connect rejects creative assets that carry alpha at all, and a
// screenshot from Chrome always does. Dependency-free: zlib + the PNG spec.

import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

/** Undo PNG row filters for 8-bit RGBA. */
function unfilter(raw, width, height, bpp) {
  const stride = width * bpp;
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const ft = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= bpp ? prev[i - bpp] : 0;
      let v = src[i];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      row[i] = v & 0xff;
    }
  }
  return out;
}

export async function stripAlpha(file) {
  const buf = readFileSync(file);
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error(`${file}: not a PNG`);
  let off = 8, width = 0, height = 0, colorType = 0, depth = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    off += 12 + len;
  }
  if (colorType === 2) return; // already RGB
  if (colorType !== 6 || depth !== 8) throw new Error(`${file}: expected 8-bit RGBA, got type ${colorType}/${depth}`);
  const px = unfilter(zlib.inflateSync(Buffer.concat(idat)), width, height, 4);
  const rgb = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    rgb[y * (width * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4, d = y * (width * 3 + 1) + 1 + x * 3;
      rgb[d] = px[s];
      rgb[d + 1] = px[s + 1];
      rgb[d + 2] = px[s + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
  writeFileSync(
    file,
    Buffer.concat([SIG, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(rgb, { level: 9 })), chunk("IEND", Buffer.alloc(0))]),
  );
}
