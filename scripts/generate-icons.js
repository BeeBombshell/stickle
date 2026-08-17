import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function encodePng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6 (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte (0 = none) at start of each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rawOffset = y * scanlineLength;
    rawData[rawOffset] = 0; // Filter: None
    const rgbaOffset = y * width * 4;
    rgbaBuffer.copy(rawData, rawOffset + 1, rgbaOffset, rgbaOffset + width * 4);
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderStickleLogo(size) {
  const buf = Buffer.alloc(size * size * 4);

  // Render Concept 3 Anchor Pin Logo Mark (44x44 base coordinates)
  // Rect: 44x44, rx=10, fill=#111111
  // Circle 1: cx=31, cy=31, r=9, fill=#ffffff
  // Circle 2: cx=31, cy=31, r=3.5, fill=#111111

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Supersampling 4x4 anti-aliasing
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;

      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 4; sx++) {
          const px = ((x + (sx + 0.5) / 4) / size) * 44;
          const py = ((y + (sy + 0.5) / 4) / size) * 44;

          // Check rounded rect boundary (0,0) to (44,44), rx=10
          const rx = Math.max(0, Math.abs(px - 22) - (22 - 10));
          const ry = Math.max(0, Math.abs(py - 22) - (22 - 10));
          const inRect = Math.sqrt(rx * rx + ry * ry) <= 10;

          if (!inRect) {
            // Outside rect -> transparent
            continue;
          }

          // Inside dark base square #111111
          let r = 17, g = 17, b = 17, a = 255;

          // Check circles (cx=31, cy=31)
          const distPin = Math.sqrt((px - 31) * (px - 31) + (py - 31) * (py - 31));

          if (distPin <= 3.5) {
            // Dark inner circle #111111
            r = 17; g = 17; b = 17; a = 255;
          } else if (distPin <= 9.0) {
            // White outer ring #ffffff
            r = 255; g = 255; b = 255; a = 255;
          }

          rSum += r;
          gSum += g;
          bSum += b;
          aSum += a;
        }
      }

      const idx = (y * size + x) * 4;
      const alpha = Math.round(aSum / 16);

      if (alpha > 0) {
        buf[idx] = Math.round(rSum / 16);
        buf[idx + 1] = Math.round(gSum / 16);
        buf[idx + 2] = Math.round(bSum / 16);
        buf[idx + 3] = alpha;
      } else {
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
      }
    }
  }

  return encodePng(size, size, buf);
}

const sizes = [16, 32, 48, 128];
const iconDir = path.resolve('public/icon');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

for (const size of sizes) {
  const pngData = renderStickleLogo(size);
  const outPath = path.join(iconDir, `${size}.png`);
  fs.writeFileSync(outPath, pngData);
  console.log(`Generated ${outPath} (${size}x${size}, ${pngData.length} bytes)`);
}
