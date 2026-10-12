// Generates the card-back lattice tiles: cream 1 dp lines at +45° and −45° on
// transparent, tiled under the back colour with ImageBackground resizeMode="repeat".
//
//   node apps/mobile/scripts/make-back-tiles.mjs
//
// A ±45° lattice only tiles seamlessly when the tile side is the line period × √2,
// so each tile side is the nearest whole dp to BACK.latticePeriod × √2:
// small 4 → 6 dp, normal 6 → 8 dp, large 7 → 10 dp (periods 4.2, 5.7, 7.1).
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../assets/images/back');
const LATTICE = [253, 251, 244, 0.92]; // tokens.color.backLattice
const TILES = { small: 6, normal: 8, large: 10 };
const LINE_DP = 1;
const SUPERSAMPLE = 8;

function crc32(buf) {
  let c,
    crc = 0xffffffff;
  for (const b of buf) {
    c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Is (x, y) — in tile px — on a lattice line? Lines pass through the tile corners. */
function onLine(x, y, side, half) {
  const dist = (v) => {
    const m = ((v % side) + side) % side;
    return Math.min(m, side - m) / Math.SQRT2;
  };
  return dist(x - y) <= half || dist(x + y) <= half;
}

mkdirSync(OUT, { recursive: true });
for (const [name, dp] of Object.entries(TILES)) {
  for (const scale of [1, 2, 3]) {
    const side = dp * scale;
    const half = (LINE_DP * scale) / 2;
    const rgba = Buffer.alloc(side * side * 4);
    for (let py = 0; py < side; py++) {
      for (let px = 0; px < side; px++) {
        let hits = 0;
        for (let sy = 0; sy < SUPERSAMPLE; sy++)
          for (let sx = 0; sx < SUPERSAMPLE; sx++)
            if (onLine(px + (sx + 0.5) / SUPERSAMPLE, py + (sy + 0.5) / SUPERSAMPLE, side, half))
              hits++;
        const i = (py * side + px) * 4;
        rgba[i] = LATTICE[0];
        rgba[i + 1] = LATTICE[1];
        rgba[i + 2] = LATTICE[2];
        rgba[i + 3] = Math.round((255 * LATTICE[3] * hits) / SUPERSAMPLE ** 2);
      }
    }
    const file = `lattice-${name}${scale === 1 ? '' : `@${scale}x`}.png`;
    writeFileSync(join(OUT, file), png(side, rgba));
    console.log(file, `${side}×${side}`);
  }
}
