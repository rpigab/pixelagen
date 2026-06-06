'use strict';

const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const OTHER_SRC = path.resolve(__dirname, '..', 'src', 'other');

// Output dimensions = 4× the original game logical pixel size.
// (Game renders at PIXEL_SCALE=3; these sprites are independent CDN assets.)
const SPRITES = [
  // Powerups — 8×8 logical → 32×32
  { name: 'powerup_spread', label: 'Powerup – Spread',   category: 'powerups',   originSize: '8×8',   w: 32,  h: 32  },
  { name: 'powerup_plasma', label: 'Powerup – Plasma',   category: 'powerups',   originSize: '8×8',   w: 32,  h: 32  },

  // Bullets
  { name: 'bullet_gatling', label: 'Bullet – Gatling',   category: 'bullets',    originSize: '12×3',  w: 48,  h: 12  },
  { name: 'bullet_spread',  label: 'Bullet – Spread',    category: 'bullets',    originSize: '6×6',   w: 24,  h: 24  },
  { name: 'bullet_plasma',  label: 'Bullet – Plasma',    category: 'bullets',    originSize: '14×10', w: 56,  h: 40  },
  { name: 'bullet_enemy',   label: 'Bullet – Enemy',     category: 'bullets',    originSize: '4×4',   w: 16,  h: 16  },

  // Bullet variations (yellow, long)
  { name: 'bullet_v1',      label: 'Bullet – Bolt',      category: 'bullets',    originSize: '12×3',  w: 48,  h: 12  },
  { name: 'bullet_v2',      label: 'Bullet – Tracer',    category: 'bullets',    originSize: '12×3',  w: 48,  h: 12  },
  { name: 'bullet_v3',      label: 'Bullet – Needle',    category: 'bullets',    originSize: '16×2',  w: 64,  h: 8   },
  { name: 'bullet_v4',      label: 'Bullet – Twin',      category: 'bullets',    originSize: '12×4',  w: 48,  h: 16  },

  // Spread bullet variations (blue)
  { name: 'spread_v1',      label: 'Spread – Crystal',   category: 'bullets',    originSize: '6×6',   w: 24,  h: 24  },
  { name: 'spread_v2',      label: 'Spread – Pellet',    category: 'bullets',    originSize: '6×6',   w: 24,  h: 24  },
  { name: 'spread_v3',      label: 'Spread – Disc',      category: 'bullets',    originSize: '6×6',   w: 24,  h: 24  },
  { name: 'spread_v4',      label: 'Spread – Cross',     category: 'bullets',    originSize: '6×6',   w: 24,  h: 24  },

  // Plasma variations
  { name: 'plasma_v1',      label: 'Plasma – Globe',     category: 'bullets',    originSize: '14×10', w: 56,  h: 40  },
  { name: 'plasma_v2',      label: 'Plasma – Comet',     category: 'bullets',    originSize: '14×10', w: 56,  h: 40  },
  { name: 'plasma_v3',      label: 'Plasma – Nova',      category: 'bullets',    originSize: '14×10', w: 56,  h: 40  },
  { name: 'plasma_v4',      label: 'Plasma – Cluster',   category: 'bullets',    originSize: '14×10', w: 56,  h: 40  },

  // Explosions — initial-frame blast circles
  { name: 'explosion_small',label: 'Explosion – Small',  category: 'explosions', originSize: '13×13', w: 52,  h: 52  },
  { name: 'explosion_large',label: 'Explosion – Large',  category: 'explosions', originSize: '25×25', w: 100, h: 100 },
];

async function renderSprite(sprite, outDir) {
  const { name, w, h } = sprite;
  const svgPath = path.join(OTHER_SRC, name + '.svg');
  const file    = path.join(outDir, name + '.png');

  await sharp(svgPath)
    .resize(w, h, { fit: 'fill' })
    .png()
    .toFile(file);

  return { file, w, h };
}

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
