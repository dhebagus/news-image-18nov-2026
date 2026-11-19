// News image entry for make.fun competition news-image-20261118.
//
// The deliverable is the PNG this program writes: a 1024x1024 summary of
// 18 November 2026's world news, drawn here rather than shipped as a static
// asset so the image and the code that produces it cannot drift apart.
//
// Node 22, standard library only. The gate accepts one whole PNG of at most
// 1 MiB at exactly 1024x1024. Outside the grader's container the output
// directory comes from MAKEFUN_OUTPUT_DIR, which stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const WIDTH = 1024;
const HEIGHT = 1024;

// The four stories that carried 18 November 2026, one per panel, each cut down
// to a headline and a single line of context so the image still reads at 300px.
const PANELS = [
  {
    kicker: 'APEC',
    headline: 'Leaders meet in Shenzhen',
    detail: 'Trade and supply chains top the agenda.',
  },
  {
    kicker: 'QUAD',
    headline: 'Summit opens in Manila',
    detail: 'Maritime security dominates the talks.',
  },
  {
    kicker: 'GAZA',
    headline: 'Aid corridor reopens',
    detail: 'Relief agencies resume distribution.',
  },
  {
    kicker: 'WEST BANK',
    headline: 'UK sanctions settlements',
    detail: 'Entities and individuals blacklisted.',
  },
];

// A tiny 5x7 bitmap font keeps the program dependency-free: each glyph is five
// column masks, bit 0 being the top row.
const FONT = {
  A: [0x7e, 0x11, 0x11, 0x11, 0x7e], B: [0x7f, 0x49, 0x49, 0x49, 0x36],
  C: [0x3e, 0x41, 0x41, 0x41, 0x22], D: [0x7f, 0x41, 0x41, 0x41, 0x3e],
  E: [0x7f, 0x49, 0x49, 0x49, 0x41], F: [0x7f, 0x09, 0x09, 0x09, 0x01],
  G: [0x3e, 0x41, 0x49, 0x49, 0x7a], H: [0x7f, 0x08, 0x08, 0x08, 0x7f],
  I: [0x00, 0x41, 0x7f, 0x41, 0x00], J: [0x20, 0x40, 0x41, 0x3f, 0x01],
  K: [0x7f, 0x08, 0x14, 0x22, 0x41], L: [0x7f, 0x40, 0x40, 0x40, 0x40],
  M: [0x7f, 0x02, 0x0c, 0x02, 0x7f], N: [0x7f, 0x04, 0x08, 0x10, 0x7f],
  O: [0x3e, 0x41, 0x41, 0x41, 0x3e], P: [0x7f, 0x09, 0x09, 0x09, 0x06],
  Q: [0x3e, 0x41, 0x51, 0x21, 0x5e], R: [0x7f, 0x09, 0x19, 0x29, 0x46],
  S: [0x46, 0x49, 0x49, 0x49, 0x31], T: [0x01, 0x01, 0x7f, 0x01, 0x01],
  U: [0x3f, 0x40, 0x40, 0x40, 0x3f], V: [0x1f, 0x20, 0x40, 0x20, 0x1f],
  W: [0x7f, 0x20, 0x18, 0x20, 0x7f], X: [0x63, 0x14, 0x08, 0x14, 0x63],
  Y: [0x03, 0x04, 0x78, 0x04, 0x03], Z: [0x61, 0x51, 0x49, 0x45, 0x43],
  0: [0x3e, 0x51, 0x49, 0x45, 0x3e], 1: [0x00, 0x42, 0x7f, 0x40, 0x00],
  2: [0x42, 0x61, 0x51, 0x49, 0x46], 3: [0x21, 0x41, 0x45, 0x4b, 0x31],
  4: [0x18, 0x14, 0x12, 0x7f, 0x10], 5: [0x27, 0x45, 0x45, 0x45, 0x39],
  6: [0x3c, 0x4a, 0x49, 0x49, 0x30], 7: [0x01, 0x71, 0x09, 0x05, 0x03],
  8: [0x36, 0x49, 0x49, 0x49, 0x36], 9: [0x06, 0x49, 0x49, 0x29, 0x1e],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00], '.': [0x00, 0x60, 0x60, 0x00, 0x00],
  ',': [0x00, 0x50, 0x30, 0x00, 0x00], '-': [0x08, 0x08, 0x08, 0x08, 0x08],
  "'": [0x00, 0x05, 0x03, 0x00, 0x00], ':': [0x00, 0x36, 0x36, 0x00, 0x00],
};

const INK = [18, 22, 30];
const PAPER = [246, 243, 236];
const ACCENT = [176, 58, 42];
const MUTED = [104, 108, 116];

function makeCanvas(w, h, fill) {
  const pixels = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    pixels[i * 3] = fill[0];
    pixels[i * 3 + 1] = fill[1];
    pixels[i * 3 + 2] = fill[2];
  }
  return { w, h, pixels };
}

function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) return;
  const i = (y * canvas.w + x) * 3;
  canvas.pixels[i] = color[0];
  canvas.pixels[i + 1] = color[1];
  canvas.pixels[i + 2] = color[2];
}

function fillRect(canvas, x, y, w, h, color) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) setPixel(canvas, x + dx, y + dy, color);
  }
}

function strokeRect(canvas, x, y, w, h, color, thickness = 2) {
  fillRect(canvas, x, y, w, thickness, color);
  fillRect(canvas, x, y + h - thickness, w, thickness, color);
  fillRect(canvas, x, y, thickness, h, color);
  fillRect(canvas, x + w - thickness, y, thickness, h, color);
}

function textWidth(text, scale) {
  return text.length * 6 * scale;
}

function drawText(canvas, text, x, y, scale, color) {
  let cursor = x;
  for (const raw of String(text).toUpperCase()) {
    const glyph = FONT[raw] ?? FONT[' '];
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 7; row++) {
        if (glyph[col] & (1 << row)) {
          fillRect(canvas, cursor + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cursor += 6 * scale;
  }
  return cursor;
}

function buildCrcTable() {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
}

const CRC_TABLE = buildCrcTable();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  let crc = 0xffffffff;
  for (const byte of body) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 0);
  return Buffer.concat([len, body, crcBuf]);
}

function encodePng(canvas) {
  const stride = canvas.w * 3;
  const raw = Buffer.alloc((stride + 1) * canvas.h);
  for (let y = 0; y < canvas.h; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0: none
    canvas.pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvas.w, 0);
  ihdr.writeUInt32BE(canvas.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function wrapHeadline(headline, maxChars) {
  const lines = [];
  let line = '';
  for (const word of headline.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawPanel(canvas, panel, x, y, w, h, index) {
  fillRect(canvas, x, y, w, h, PAPER);
  strokeRect(canvas, x, y, w, h, INK, 3);

  drawText(canvas, String(index + 1).padStart(2, '0'), x + 24, y + 24, 3, ACCENT);
  fillRect(canvas, x + 24, y + 74, 96, 6, ACCENT);
  drawText(canvas, panel.kicker, x + 24, y + 100, 3, MUTED);

  let ty = y + 160;
  for (const text of wrapHeadline(panel.headline, Math.floor((w - 48) / 24)).slice(0, 2)) {
    drawText(canvas, text, x + 24, ty, 4, INK);
    ty += 44;
  }

  const detailLines = wrapHeadline(panel.detail, Math.floor((w - 48) / 12)).slice(0, 2);
  let dy = y + h - 30 - detailLines.length * 20;
  for (const text of detailLines) {
    drawText(canvas, text, x + 24, dy, 2, MUTED);
    dy += 20;
  }
}

function render() {
  const canvas = makeCanvas(WIDTH, HEIGHT, INK);

  fillRect(canvas, 0, 0, WIDTH, 150, INK);
  drawText(canvas, '18 NOVEMBER 2026', 48, 40, 6, PAPER);
  drawText(canvas, 'WORLD NEWS IN ONE IMAGE', 48, 100, 3, ACCENT);
  fillRect(canvas, 48, 136, WIDTH - 96, 4, ACCENT);

  const margin = 48;
  const gap = 24;
  const panelW = Math.floor((WIDTH - margin * 2 - gap) / 2);
  const panelH = Math.floor((HEIGHT - 150 - margin - gap) / 2);
  PANELS.forEach((panel, i) => {
    const x = margin + (i % 2) * (panelW + gap);
    const y = 150 + gap + Math.floor(i / 2) * (panelH + gap);
    drawPanel(canvas, panel, x, y, panelW, panelH, i);
  });

  fillRect(canvas, margin, HEIGHT - 20, WIDTH - margin * 2, 4, ACCENT);

  return canvas;
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const png = encodePng(render());
writeFileSync(join(outDir, 'entry.png'), png);
console.log(`wrote ${join(outDir, 'entry.png')} (${png.length} bytes, ${WIDTH}x${HEIGHT})`);
