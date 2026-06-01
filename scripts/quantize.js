'use strict';

/**
 * Color quantization utilities.
 * Operates on raw RGBA pixel buffers (Uint8Array/Buffer, 4 bytes per pixel).
 */

/** Map a single channel value to the nearest step in a palette of `levels` steps (0..255). */
function quantizeChannel(value, levels) {
  const step = 255 / (levels - 1);
  return Math.round(Math.round(value / step) * step);
}

/**
 * Nearest-neighbour projection into a uniform RGB cube.
 *   256 colors  -> rLevels=8, gLevels=8, bLevels=4   (8*8*4 = 256)
 *    64 colors  -> rLevels=4, gLevels=4, bLevels=4   (4*4*4 = 64)
 *    16 colors  -> rLevels=4, gLevels=2, bLevels=2   (4*2*2 = 16)
 *     8 colors  -> rLevels=2, gLevels=2, bLevels=2   (2*2*2 = 8)
 */
const PALETTES = {
  full:  { rL: 256, gL: 256, bL: 256 },
  p256:  { rL: 8,   gL: 8,   bL: 4  },
  p64:   { rL: 4,   gL: 4,   bL: 4  },
  p16:   { rL: 4,   gL: 2,   bL: 2  },
  p8:    { rL: 2,   gL: 2,   bL: 2  },
};

function applyPalette(buffer, paletteKey) {
  const { rL, gL, bL } = PALETTES[paletteKey];
  if (paletteKey === 'full') return Buffer.from(buffer); // no-op

  const out = Buffer.from(buffer);
  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3];
    if (a < 8) {
      // fully transparent – zero out to avoid colour fringing
      out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
      continue;
    }
    out[i]     = quantizeChannel(out[i],     rL);
    out[i + 1] = quantizeChannel(out[i + 1], gL);
    out[i + 2] = quantizeChannel(out[i + 2], bL);
  }
  return out;
}

/**
 * Ordered (Bayer 4×4) dithering before palette quantization.
 * Adds per-pixel noise proportional to the quantization error to break
 * flat color bands into a retro stippled pattern.
 */
const BAYER4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5],
];

function applyPaletteWithDithering(buffer, width, paletteKey) {
  const { rL, gL, bL } = PALETTES[paletteKey];
  if (paletteKey === 'full') return Buffer.from(buffer);

  const out = Buffer.from(buffer);
  const height = buffer.length / 4 / width;

  const rStep = 255 / (rL - 1);
  const gStep = 255 / (gL - 1);
  const bStep = 255 / (bL - 1);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = out[i + 3];
      if (a < 8) {
        out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
        continue;
      }
      // Bayer threshold in [0,1)
      const t = BAYER4[y % 4][x % 4] / 16;

      out[i]     = clamp(quantizeChannel(out[i]     + (t - 0.5) * rStep * 0.7, rL));
      out[i + 1] = clamp(quantizeChannel(out[i + 1] + (t - 0.5) * gStep * 0.7, gL));
      out[i + 2] = clamp(quantizeChannel(out[i + 2] + (t - 0.5) * bStep * 0.7, bL));
    }
  }
  return out;
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

module.exports = { applyPalette, applyPaletteWithDithering, PALETTES };
