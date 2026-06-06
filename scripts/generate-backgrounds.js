'use strict';

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const W = 160, H = 90;

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = ((s * 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// Layer 0 — deep space, OPAQUE dark background + 120 dim stars.
// Slowest scroll. Replaces the solid Phaser background color.
function svgLayer0() {
  const rng = seededRng(0x1a2b3c4d);
  let dots = '';
  for (let i = 0; i < 120; i++) {
    const x = (rng() * W).toFixed(2);
    const y = (rng() * H).toFixed(2);
    const b = Math.floor(rng() * 80 + 20);
    const blue = Math.min(255, Math.floor(b * 1.5));
    const r = rng() < 0.12 ? 1.2 : 0.55;
    const op = (0.35 + rng() * 0.65).toFixed(2);
    dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgb(${b},${b},${blue})" opacity="${op}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#00000a"/>${dots}</svg>`;
}

// Layer 1 — nebula, TRANSPARENT. Soft radial color washes + sparse faint stars.
// Slow scroll, sits above the deep-space layer.
function svgLayer1() {
  const rng = seededRng(0x2b3c4d5e);
  const clouds = [
    { cx: 38,  cy: 28, rx: 34, ry: 19, color: '#3b1a5c', op: 0.50 },
    { cx: 112, cy: 62, rx: 42, ry: 24, color: '#1a2a5c', op: 0.45 },
    { cx: 74,  cy: 18, rx: 28, ry: 14, color: '#5c1a3b', op: 0.40 },
    { cx: 142, cy: 44, rx: 22, ry: 18, color: '#1a4a5c', op: 0.35 },
    { cx: 20,  cy: 72, rx: 18, ry: 12, color: '#2a1a5c', op: 0.30 },
  ];
  let defs = '<defs>';
  let shapes = '';
  clouds.forEach((cl, i) => {
    defs += `<radialGradient id="n${i}" cx="50%" cy="50%" r="50%">` +
      `<stop offset="0%" stop-color="${cl.color}" stop-opacity="${cl.op}"/>` +
      `<stop offset="100%" stop-color="${cl.color}" stop-opacity="0"/></radialGradient>`;
    shapes += `<ellipse cx="${cl.cx}" cy="${cl.cy}" rx="${cl.rx}" ry="${cl.ry}" fill="url(#n${i})"/>`;
  });
  defs += '</defs>';
  for (let i = 0; i < 35; i++) {
    const x = (rng() * W).toFixed(2);
    const y = (rng() * H).toFixed(2);
    const b = Math.floor(rng() * 60 + 70);
    const blue = Math.min(255, b + 40);
    const op = (0.25 + rng() * 0.45).toFixed(2);
    shapes += `<circle cx="${x}" cy="${y}" r="0.7" fill="rgb(${b},${b},${blue})" opacity="${op}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}${shapes}</svg>`;
}

// Layer 2 — mid stars, TRANSPARENT. ~45 brighter stars, some with sparkle cross.
// Medium scroll speed.
function svgLayer2() {
  const rng = seededRng(0x3c4d5e6f);
  let dots = '';
  for (let i = 0; i < 45; i++) {
    const x = parseFloat((rng() * W).toFixed(2));
    const y = parseFloat((rng() * H).toFixed(2));
    const b = Math.floor(rng() * 90 + 110);
    const blue = Math.min(255, b + 50);
    const op = (0.45 + rng() * 0.55).toFixed(2);
    const fx = x.toFixed(2), fy = y.toFixed(2);
    if (rng() < 0.22) {
      const s = (1.4 + rng() * 1.2).toFixed(1);
      dots += `<circle cx="${fx}" cy="${fy}" r="0.9" fill="rgb(${b},${b},${blue})" opacity="${op}"/>`;
      dots += `<line x1="${(x - parseFloat(s)).toFixed(1)}" y1="${fy}" x2="${(x + parseFloat(s)).toFixed(1)}" y2="${fy}" stroke="rgb(${b},${b},${blue})" stroke-width="0.4" opacity="${op}"/>`;
      dots += `<line x1="${fx}" y1="${(y - parseFloat(s)).toFixed(1)}" x2="${fx}" y2="${(y + parseFloat(s)).toFixed(1)}" stroke="rgb(${b},${b},${blue})" stroke-width="0.4" opacity="${op}"/>`;
    } else {
      const r = (0.7 + rng() * 0.8).toFixed(1);
      dots += `<circle cx="${fx}" cy="${fy}" r="${r}" fill="rgb(${b},${b},${blue})" opacity="${op}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${dots}</svg>`;
}

// Layer 3 — foreground, TRANSPARENT and DISCRETE.
// Only 7 sparkles, biased toward top/bottom strips to minimise occlusion of
// the central gameplay area. Passes in front of enemies — must stay subtle.
function svgLayer3() {
  const rng = seededRng(0x4d5e6f70);
  // Positions: mostly top strip (y<20) and bottom strip (y>70)
  const rawPositions = [
    [rng() * W, rng() * 18],
    [rng() * W, H - rng() * 18],
    [rng() * W, rng() * 14 + 4],
    [rng() * W, H - rng() * 14 - 4],
    [rng() * W, rng() * 18],
    [rng() * W, H - rng() * 18],
    [rng() * W, rng() * H],   // one anywhere
  ];
  let dots = '';
  for (const [x, y] of rawPositions) {
    const b = Math.floor(rng() * 55 + 190);
    const op = parseFloat((0.30 + rng() * 0.30).toFixed(2));
    const r = (1.0 + rng() * 0.9).toFixed(1);
    const s = (parseFloat(r) * 2.2).toFixed(1);
    const fx = x.toFixed(2), fy = y.toFixed(2);
    dots += `<circle cx="${fx}" cy="${fy}" r="${r}" fill="rgb(${b},${b},255)" opacity="${op.toFixed(2)}"/>`;
    dots += `<line x1="${(x - parseFloat(s)).toFixed(1)}" y1="${fy}" x2="${(x + parseFloat(s)).toFixed(1)}" y2="${fy}" stroke="rgb(${b},${b},255)" stroke-width="0.5" opacity="${(op * 0.6).toFixed(2)}"/>`;
    dots += `<line x1="${fx}" y1="${(y - parseFloat(s)).toFixed(1)}" x2="${fx}" y2="${(y + parseFloat(s)).toFixed(1)}" stroke="rgb(${b},${b},255)" stroke-width="0.5" opacity="${(op * 0.6).toFixed(2)}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${dots}</svg>`;
}

const LAYERS = [
  { key: 'space_layer0', label: 'Deep space',  desc: 'Opaque base — replaces solid Phaser bg color', scrollSpeed: 0.20, fn: svgLayer0 },
  { key: 'space_layer1', label: 'Nebula',       desc: 'Transparent color wash',                        scrollSpeed: 0.35, fn: svgLayer1 },
  { key: 'space_layer2', label: 'Mid stars',    desc: 'Transparent, medium-density stars',              scrollSpeed: 0.60, fn: svgLayer2 },
  { key: 'space_layer3', label: 'Foreground',   desc: 'Transparent, sparse — renders above enemies',    scrollSpeed: 1.00, fn: svgLayer3 },
];

async function generateBackgrounds(docsDir) {
  const outDir = path.join(docsDir, 'backgrounds', 'space');
  fs.mkdirSync(outDir, { recursive: true });

  const results = [];
  for (const layer of LAYERS) {
    const svgStr = layer.fn();
    const svgBuf = Buffer.from(svgStr, 'utf-8');
    const outFile = path.join(outDir, `${layer.key}.png`);

    await sharp(svgBuf)
      .resize(W, H, { fit: 'fill' })
      .png({ compressionLevel: 9 })
      .toFile(outFile);

    results.push({ file: outFile, layer });
  }
  return results;
}

module.exports = { generateBackgrounds, LAYERS, W, H };
