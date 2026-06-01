'use strict';

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { applyPalette, applyPaletteWithDithering } = require('./quantize.js');

const SIZES = [32, 64, 128];

/**
 * Rasterization variants.
 * Each variant defines: output sub-dir, palette key, and whether to use dithering.
 */
const VARIANTS = [
  { name: 'full',         palette: 'full',  dither: false, label: 'Full color (truecolor)'     },
  { name: '256colors',    palette: 'p256',  dither: false, label: '256 colors (uniform cube)'  },
  { name: '256-dithered', palette: 'p256',  dither: true,  label: '256 colors + Bayer dither'  },
  { name: '64colors',     palette: 'p64',   dither: false, label: '64 colors'                  },
  { name: '16colors',     palette: 'p16',   dither: false, label: '16 colors (lo-fi retro)'    },
  { name: '16-dithered',  palette: 'p16',   dither: true,  label: '16 colors + Bayer dither'   },
];

async function rasterizeSvg(svgPath, outputDir, svgName) {
  const results = [];

  for (const size of SIZES) {
    // Render the SVG at the target size maintaining aspect ratio (256x128 -> size x size/2)
    const w = size;
    const h = Math.round(size / 2);

    const rawBuffer = await sharp(svgPath)
      .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer();

    for (const variant of VARIANTS) {
      const variantDir = path.join(outputDir, variant.name, `${size}x${size}`);
      fs.mkdirSync(variantDir, { recursive: true });

      const outFile = path.join(variantDir, `${svgName}.png`);

      let processedBuffer;
      if (variant.dither) {
        processedBuffer = applyPaletteWithDithering(rawBuffer, w, variant.palette);
      } else {
        processedBuffer = applyPalette(rawBuffer, variant.palette);
      }

      await sharp(processedBuffer, { raw: { width: w, height: h, channels: 4 } })
        .png({ compressionLevel: 9 })
        .toFile(outFile);

      results.push({ file: outFile, variant: variant.name, size: `${w}x${h}` });
    }
  }

  return results;
}

module.exports = { rasterizeSvg, VARIANTS, SIZES };
