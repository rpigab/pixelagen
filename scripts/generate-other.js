'use strict';

const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const SCALE = 4; // 4× the original game logical pixels

// ── Pixel-grid helpers ────────────────────────────────────────────────────────

// Compute a pixel grid from concentric ellipses (innermost wins).
// ellipses: array ordered outer → inner, each { cx, cy, rx, ry }
// Returns a rows×cols array with palette indices 1..n.
function makeEllipsePixels(w, h, ellipses) {
  const grid = Array.from({ length: h }, () => new Array(w).fill(0));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5, py = y + 0.5;
      for (let i = ellipses.length - 1; i >= 0; i--) {
        const e = ellipses[i];
        const dx = (px - e.cx) / e.rx, dy = (py - e.cy) / e.ry;
        if (dx * dx + dy * dy <= 1) { grid[y][x] = i + 1; break; }
      }
    }
  }
  return grid;
}

// Compute a pixel grid from two concentric circles (inner→white, outer→orange).
// Returns a (2R+1)×(2R+1) array with palette indices 1 (outer) or 2 (inner).
function makeCirclePixels(outerR, innerR) {
  const size = outerR * 2 + 1;
  const center = outerR; // also equal to outerR (0-indexed centre pixel)
  const grid = Array.from({ length: size }, () => new Array(size).fill(0));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - center, dy = y + 0.5 - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= innerR)       grid[y][x] = 2;
      else if (dist <= outerR)  grid[y][x] = 1;
    }
  }
  return grid;
}

// ── Sprite catalogue ──────────────────────────────────────────────────────────

const SPRITES = [
  // ── Powerups ──────────────────────────────────────────────────────────────
  {
    name: 'powerup_spread',
    label: 'Powerup – Spread',
    category: 'powerups',
    originSize: '8×8',
    palette: [0, 0x006688, 0x00aacc, 0x55eeff, 0xffffff],
    pixels: [
      [0,0,1,2,2,1,0,0],
      [0,1,2,3,3,2,1,0],
      [1,2,3,4,3,3,2,1],
      [2,3,3,3,4,3,3,2],
      [2,3,4,3,3,3,3,2],
      [1,2,3,3,3,4,2,1],
      [0,1,2,3,3,2,1,0],
      [0,0,1,2,2,1,0,0],
    ],
  },
  {
    name: 'powerup_plasma',
    label: 'Powerup – Plasma',
    category: 'powerups',
    originSize: '8×8',
    palette: [0, 0x882200, 0xcc4400, 0xff9900, 0xffee44],
    pixels: [
      [0,0,1,2,2,1,0,0],
      [0,1,2,2,2,2,1,0],
      [1,2,2,3,3,2,2,1],
      [2,2,3,4,4,3,2,2],
      [2,2,3,4,4,3,2,2],
      [1,2,2,3,3,2,2,1],
      [0,1,2,2,2,2,1,0],
      [0,0,1,2,2,1,0,0],
    ],
  },

  // ── Bullets ───────────────────────────────────────────────────────────────
  {
    name: 'bullet_gatling',
    label: 'Bullet – Gatling',
    category: 'bullets',
    originSize: '12×3',
    // White tip | yellow body | orange trail (orange drawn on top of yellow)
    palette: [0, 0xffffff, 0xffee00, 0xff8800],
    pixels: [
      [0,0,0,2,2,2,2,2,2,2,2,2],
      [1,1,1,2,2,2,2,2,2,2,3,3],
      [0,0,0,2,2,2,2,2,2,2,2,2],
    ],
  },
  {
    name: 'bullet_spread',
    label: 'Bullet – Spread',
    category: 'bullets',
    originSize: '6×6',
    // Cyan diamond with a white vertical highlight through centre
    palette: [0, 0x00ccff, 0xffffff],
    pixels: [
      [0,0,1,1,0,0],
      [0,1,1,1,1,0],
      [1,1,2,1,1,1],
      [1,1,2,1,1,1],
      [0,1,1,1,1,0],
      [0,0,1,1,0,0],
    ],
  },
  {
    name: 'bullet_plasma',
    label: 'Bullet – Plasma',
    category: 'bullets',
    originSize: '14×10',
    // Three concentric ellipses: dark orange → medium orange → bright yellow
    palette: [0, 0xff4400, 0xff8800, 0xffdd00],
    pixels: makeEllipsePixels(14, 10, [
      { cx: 7,   cy: 5, rx: 7,   ry: 5   },
      { cx: 6,   cy: 5, rx: 5,   ry: 3.5 },
      { cx: 4,   cy: 4, rx: 3,   ry: 2.5 },
    ]),
  },
  {
    name: 'bullet_enemy',
    label: 'Bullet – Enemy',
    category: 'bullets',
    originSize: '4×4',
    palette: [0, 0xff2222],
    pixels: [
      [0,1,1,0],
      [1,1,1,1],
      [1,1,1,1],
      [0,1,1,0],
    ],
  },

  // ── Explosions ────────────────────────────────────────────────────────────
  {
    name: 'explosion_small',
    label: 'Explosion – Small',
    category: 'explosions',
    originSize: '13×13',
    // outer circle orange, inner circle white (initial frame)
    palette: [0, 0xff6600, 0xffffff],
    pixels: makeCirclePixels(6, 3),
  },
  {
    name: 'explosion_large',
    label: 'Explosion – Large',
    category: 'explosions',
    originSize: '25×25',
    palette: [0, 0xff6600, 0xffffff],
    pixels: makeCirclePixels(12, 6),
  },
];

// ── Renderer ─────────────────────────────────────────────────────────────────

async function renderSprite(sprite, outDir) {
  const { name, pixels, palette } = sprite;
  const rows = pixels.length;
  const cols = pixels[0].length;
  const w = cols * SCALE;
  const h = rows * SCALE;
  const buf = Buffer.alloc(w * h * 4, 0); // RGBA, fully transparent by default

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ci = pixels[y][x];
      if (ci === 0) continue; // transparent
      const hex = palette[ci];
      const r = (hex >> 16) & 0xff;
      const g = (hex >>  8) & 0xff;
      const b =  hex        & 0xff;
      for (let sy = 0; sy < SCALE; sy++) {
        for (let sx = 0; sx < SCALE; sx++) {
          const idx = ((y * SCALE + sy) * w + (x * SCALE + sx)) * 4;
          buf[idx]     = r;
          buf[idx + 1] = g;
          buf[idx + 2] = b;
          buf[idx + 3] = 255;
        }
      }
    }
  }

  const file = path.join(outDir, name + '.png');
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(file);
  return { file, w, h };
}

// ── Public API ────────────────────────────────────────────────────────────────

async function generateOther(docsDir) {
  const outDir = path.join(docsDir, 'other');
  fs.mkdirSync(outDir, { recursive: true });

  const results = [];
  for (const sprite of SPRITES) {
    const r = await renderSprite(sprite, outDir);
    results.push({ sprite, ...r });
  }
  return results;
}

module.exports = { generateOther, SPRITES };
