#!/usr/bin/env node
/**
 * Generates the binary assets the app needs (app icon + ringtone) so the
 * repository itself stays text-only. Run it before a build:
 *
 *   npm run assets
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const IMAGES = path.join(ROOT, 'assets', 'images');
const AUDIO = path.join(ROOT, 'assets', 'audio');

fs.mkdirSync(IMAGES, { recursive: true });
fs.mkdirSync(AUDIO, { recursive: true });

/* ------------------------------------------------------------------ */
/* PNG encoder (no dependencies)                                       */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ */
/* Icon: brand gradient, rounded square, handset glyph                 */
/* ------------------------------------------------------------------ */

const SIZE = 1024;
const RADIUS = SIZE * 0.22;

function insideRoundedSquare(x, y) {
  const r = RADIUS;
  const cx = Math.min(Math.max(x, r), SIZE - r);
  const cy = Math.min(Math.max(y, r), SIZE - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// Classic handset: a thick arc between two flared ear/mouth pieces.
// Returns the signed distance to the glyph outline (negative = inside).
function handsetDistance(x, y) {
  const p0 = [0.315, 0.715];
  const p1 = [0.5, 0.5];
  const p2 = [0.685, 0.285];

  // distance to the curved bar
  let bar = Infinity;
  for (let i = 0; i <= 240; i++) {
    const t = i / 240;
    const mt = 1 - t;
    const px = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
    const py = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
    const d = Math.hypot(x - px, y - py);
    if (d < bar) bar = d;
  }
  bar -= 0.052;

  // flared end pieces (rounded caps, slightly larger than the bar)
  const capA = Math.hypot(x - p0[0], y - p0[1]) - 0.088;
  const capB = Math.hypot(x - p2[0], y - p2[1]) - 0.088;

  return Math.min(bar, capA, capB);
}

function buildIcon() {
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  const stroke = 0.062; // half-width of the handset stroke, in unit space

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const ux = x / SIZE;
      const uy = y / SIZE;

      if (!insideRoundedSquare(x, y)) {
        rgba[i + 3] = 0;
        continue;
      }

      // diagonal gradient: deep blue -> bright cyan
      const t = Math.min(1, Math.max(0, (ux + uy) / 2));
      let r = Math.round(31 + (56 - 31) * t);
      let g = Math.round(111 + (189 - 111) * t);
      let b = Math.round(235 + (248 - 235) * t);

      // soft radial highlight in the upper-left
      const hx = ux - 0.28;
      const hy = uy - 0.24;
      const glow = Math.max(0, 1 - Math.hypot(hx, hy) / 0.55) ** 2 * 0.35;
      r = Math.round(r + (255 - r) * glow);
      g = Math.round(g + (255 - g) * glow);
      b = Math.round(b + (255 - b) * glow);

      // handset glyph in white, anti-aliased
      const d = handsetDistance(ux, uy);
      const edge = 0.004;
      const a = Math.min(1, Math.max(0, (stroke - d) / edge));
      if (a > 0) {
        r = Math.round(r + (255 - r) * a);
        g = Math.round(g + (255 - g) * a);
        b = Math.round(b + (255 - b) * a);
      }

      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = 255;
    }
  }

  return encodePng(SIZE, SIZE, rgba);
}

/* ------------------------------------------------------------------ */
/* Ringtone: two-tone "ring ring" pattern, 8 kHz mono 16-bit PCM       */
/* ------------------------------------------------------------------ */

function buildRingtone() {
  const RATE = 8000;
  const segments = [
    { dur: 0.4, f1: 440, f2: 480, on: true },
    { dur: 0.2, on: false },
    { dur: 0.4, f1: 440, f2: 480, on: true },
    { dur: 1.0, on: false },
  ];

  const samples = [];
  for (const seg of segments) {
    const n = Math.round(seg.dur * RATE);
    for (let i = 0; i < n; i++) {
      if (!seg.on) {
        samples.push(0);
        continue;
      }
      const t = i / RATE;
      // 5 ms fade in/out so the tone does not click
      const fade = Math.min(1, i / (RATE * 0.005), (n - i) / (RATE * 0.005));
      const v =
        (Math.sin(2 * Math.PI * seg.f1 * t) + Math.sin(2 * Math.PI * seg.f2 * t)) / 2;
      samples.push(Math.round(v * 0.55 * 32767 * fade));
    }
  }

  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(s, i * 2));

  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // format = PCM
  header.writeUInt16LE(1, 22); // channels
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

/* ------------------------------------------------------------------ */

const iconPath = path.join(IMAGES, 'icon.png');
const ringPath = path.join(AUDIO, 'ringtone.wav');

fs.writeFileSync(iconPath, buildIcon());
fs.writeFileSync(ringPath, buildRingtone());

console.log(
  `assets ready: ${path.relative(ROOT, iconPath)} (${fs.statSync(iconPath).size} B), ` +
    `${path.relative(ROOT, ringPath)} (${fs.statSync(ringPath).size} B)`
);
