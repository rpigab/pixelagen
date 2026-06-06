'use strict';

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const BG_W = 160;

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = ((s * 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ── ESPACE (160×90, tiles 3×3 — star fields repeat fine) ───────────────────

function svgSpaceLayer0(W, H) {
  const rng = seededRng(0x1a2b3c4d);
  let dots = '';
  for (let i = 0; i < 120; i++) {
    const x  = (rng() * W).toFixed(2);
    const y  = (rng() * H).toFixed(2);
    const b  = Math.floor(rng() * 80 + 20);
    const bl = Math.min(255, Math.floor(b * 1.5));
    const r  = rng() < 0.12 ? 1.2 : 0.55;
    const op = (0.35 + rng() * 0.65).toFixed(2);
    dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgb(${b},${b},${bl})" opacity="${op}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#00000a"/>${dots}</svg>`;
}

function svgSpaceLayer1(W, H) {
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
    const x  = (rng() * W).toFixed(2);
    const y  = (rng() * H).toFixed(2);
    const b  = Math.floor(rng() * 60 + 70);
    const bl = Math.min(255, b + 40);
    const op = (0.25 + rng() * 0.45).toFixed(2);
    shapes += `<circle cx="${x}" cy="${y}" r="0.7" fill="rgb(${b},${b},${bl})" opacity="${op}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}${shapes}</svg>`;
}

function svgSpaceLayer2(W, H) {
  const rng = seededRng(0x3c4d5e6f);
  let dots = '';
  for (let i = 0; i < 45; i++) {
    const x  = parseFloat((rng() * W).toFixed(2));
    const y  = parseFloat((rng() * H).toFixed(2));
    const b  = Math.floor(rng() * 90 + 110);
    const bl = Math.min(255, b + 50);
    const op = (0.45 + rng() * 0.55).toFixed(2);
    const fx = x.toFixed(2), fy = y.toFixed(2);
    if (rng() < 0.22) {
      const s = (1.4 + rng() * 1.2).toFixed(1);
      dots += `<circle cx="${fx}" cy="${fy}" r="0.9" fill="rgb(${b},${b},${bl})" opacity="${op}"/>`;
      dots += `<line x1="${(x - parseFloat(s)).toFixed(1)}" y1="${fy}" x2="${(x + parseFloat(s)).toFixed(1)}" y2="${fy}" stroke="rgb(${b},${b},${bl})" stroke-width="0.4" opacity="${op}"/>`;
      dots += `<line x1="${fx}" y1="${(y - parseFloat(s)).toFixed(1)}" x2="${fx}" y2="${(y + parseFloat(s)).toFixed(1)}" stroke="rgb(${b},${b},${bl})" stroke-width="0.4" opacity="${op}"/>`;
    } else {
      const r = (0.7 + rng() * 0.8).toFixed(1);
      dots += `<circle cx="${fx}" cy="${fy}" r="${r}" fill="rgb(${b},${b},${bl})" opacity="${op}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${dots}</svg>`;
}

function svgSpaceLayer3(W, H) {
  const rng = seededRng(0x4d5e6f70);
  const rawPositions = [
    [rng() * W, rng() * 18],
    [rng() * W, H - rng() * 18],
    [rng() * W, rng() * 14 + 4],
    [rng() * W, H - rng() * 14 - 4],
    [rng() * W, rng() * 18],
    [rng() * W, H - rng() * 18],
    [rng() * W, rng() * H],
  ];
  let dots = '';
  for (const [x, y] of rawPositions) {
    const b  = Math.floor(rng() * 55 + 190);
    const op = parseFloat((0.30 + rng() * 0.30).toFixed(2));
    const r  = (1.0 + rng() * 0.9).toFixed(1);
    const s  = (parseFloat(r) * 2.2).toFixed(1);
    const fx = x.toFixed(2), fy = y.toFixed(2);
    dots += `<circle cx="${fx}" cy="${fy}" r="${r}" fill="rgb(${b},${b},255)" opacity="${op.toFixed(2)}"/>`;
    dots += `<line x1="${(x - parseFloat(s)).toFixed(1)}" y1="${fy}" x2="${(x + parseFloat(s)).toFixed(1)}" y2="${fy}" stroke="rgb(${b},${b},255)" stroke-width="0.5" opacity="${(op * 0.6).toFixed(2)}"/>`;
    dots += `<line x1="${fx}" y1="${(y - parseFloat(s)).toFixed(1)}" x2="${fx}" y2="${(y + parseFloat(s)).toFixed(1)}" stroke="rgb(${b},${b},255)" stroke-width="0.5" opacity="${(op * 0.6).toFixed(2)}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${dots}</svg>`;
}

// ── DÉSERT (160×270) ────────────────────────────────────────────────────────

function svgDesertLayer0(W, H) {
  const rng = seededRng(0xde5e7100);
  const defs = `<defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0%" stop-color="#120800"/>` +
    `<stop offset="62%" stop-color="#4a2008"/>` +
    `<stop offset="100%" stop-color="#7a4a18"/></linearGradient></defs>`;
  let shapes = `<rect width="${W}" height="${H}" fill="url(#dg)"/>`;
  for (let i = 0; i < 6; i++) {
    const cx = (rng() * W).toFixed(1);
    const rw = (27 + rng() * 33).toFixed(1);
    const rh = (18 + rng() * 27).toFixed(1);
    const cy = (H - parseFloat(rh) * 0.4).toFixed(1);
    shapes += `<ellipse cx="${cx}" cy="${cy}" rx="${(parseFloat(rw)/2).toFixed(1)}" ry="${(parseFloat(rh)/2).toFixed(1)}" fill="#8a5420" opacity="0.9"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}${shapes}</svg>`;
}

function svgDesertLayer1(W, H) {
  const rng = seededRng(0xde5e7101);
  let shapes = '';
  for (let i = 0; i < 9; i++) {
    const cx = (rng() * W).toFixed(1);
    const rw = (13 + rng() * 24).toFixed(1);
    const rh = (30 + rng() * 50).toFixed(1);
    const cy = (H - parseFloat(rh) * 0.35).toFixed(1);
    shapes += `<ellipse cx="${cx}" cy="${cy}" rx="${(parseFloat(rw)/2).toFixed(1)}" ry="${(parseFloat(rh)/2).toFixed(1)}" fill="#5c3010" opacity="0.92"/>`;
  }
  for (let i = 0; i < 6; i++) {
    const rx  = (rng() * W).toFixed(1);
    const rh  = Math.floor(40 + rng() * 50);
    const rw  = Math.max(3, Math.floor(3 + rng() * 5));
    const x0  = (parseFloat(rx) - rw / 2).toFixed(1);
    const yT  = (H - rh).toFixed(1);
    shapes += `<rect x="${x0}" y="${yT}" width="${rw}" height="${rh}" fill="#3e1e06"/>`;
    const tx0 = (parseFloat(rx) - rw / 2 - 2).toFixed(1);
    const tx1 = (parseFloat(rx) + rw / 2 + 2).toFixed(1);
    const tyT = (H - rh - 6).toFixed(1);
    shapes += `<polygon points="${rx},${tyT} ${tx0},${yT} ${tx1},${yT}" fill="#3e1e06"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shapes}</svg>`;
}

// ── OCÉAN (160×270) ─────────────────────────────────────────────────────────

function svgOceanLayer0(W, H) {
  const rng = seededRng(0x0ce4e100);
  const defs = `<defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0%" stop-color="#000818"/>` +
    `<stop offset="100%" stop-color="#00406a"/></linearGradient></defs>`;
  let shapes = `<rect width="${W}" height="${H}" fill="url(#og)"/>`;
  for (let i = 0; i < 5; i++) {
    const wy = (H * 0.3 + rng() * H * 0.6).toFixed(1);
    let d = '';
    for (let x = 0; x <= W; x += 2) {
      const wave = Math.sin(x * 0.12 + i * 1.7) * 1.3;
      d += (x === 0 ? `M${x},` : `L${x},`) + (parseFloat(wy) + wave).toFixed(2) + ' ';
    }
    shapes += `<path d="${d}" stroke="#1a5580" stroke-width="1" fill="none" opacity="0.35"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}${shapes}</svg>`;
}

function svgOceanLayer1(W, H) {
  const rng = seededRng(0x0ce4e101);
  let shapes = '';
  for (let i = 0; i < 4; i++) {
    const wy  = (H * 0.4 + rng() * H * 0.55).toFixed(1);
    const amp = 2 + rng() * 4;
    const op  = (0.45 - i * 0.07).toFixed(2);
    let d = '';
    for (let x = 0; x <= W; x += 2) {
      const wave = Math.sin(x * 0.09 + i * 1.4) * amp;
      d += (x === 0 ? `M${x},` : `L${x},`) + (parseFloat(wy) + wave).toFixed(2) + ' ';
    }
    shapes += `<path d="${d}" stroke="#88ddff" stroke-width="1" fill="none" opacity="${op}"/>`;
  }
  for (let i = 0; i < 18; i++) {
    const bx = (rng() * W).toFixed(1);
    const by = (H * 0.4 + rng() * H * 0.6).toFixed(1);
    const r  = (0.8 + rng() * 1.5).toFixed(1);
    shapes += `<circle cx="${bx}" cy="${by}" r="${r}" fill="#44aacc" opacity="0.25"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shapes}</svg>`;
}

// ── NEIGE (160×270) ─────────────────────────────────────────────────────────

function svgSnowLayer0(W, H) {
  const rng = seededRng(0x500ef000);
  const defs = `<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0%" stop-color="#060c18"/>` +
    `<stop offset="100%" stop-color="#182848"/></linearGradient></defs>`;
  let shapes = `<rect width="${W}" height="${H}" fill="url(#sg)"/>`;
  for (let i = 0; i < 85; i++) {
    const x  = (rng() * W).toFixed(1);
    const y  = (rng() * H).toFixed(1);
    const b  = Math.floor(rng() * 80 + 160);
    shapes += `<circle cx="${x}" cy="${y}" r="0.5" fill="rgb(${b},${b},255)" opacity="0.55"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}${shapes}</svg>`;
}

function svgSnowLayer1(W, H) {
  const rng = seededRng(0x500ef001);
  let shapes = '';
  for (let i = 0; i < 40; i++) {
    const x = parseFloat((rng() * W).toFixed(1));
    const y = parseFloat((rng() * H).toFixed(1));
    shapes += `<line x1="${(x-1).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x+1).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#ddeeff" stroke-width="0.7" opacity="0.65"/>`;
    shapes += `<line x1="${x.toFixed(1)}" y1="${(y-1).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y+1).toFixed(1)}" stroke="#ddeeff" stroke-width="0.7" opacity="0.65"/>`;
    shapes += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0.5" fill="#ddeeff" opacity="0.65"/>`;
  }
  for (let i = 0; i < 12; i++) {
    const ix  = (rng() * W).toFixed(1);
    const ih  = 20 + rng() * 45;
    const iw  = Math.max(3, 3 + rng() * 5);
    const ixt = (parseFloat(ix) - iw / 2).toFixed(1);
    const ixb = (parseFloat(ix) + iw / 2).toFixed(1);
    shapes += `<polygon points="${ix},${(H - ih).toFixed(1)} ${ixt},${H} ${ixb},${H}" fill="#88aacc" opacity="0.5"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shapes}</svg>`;
}

// ── FORÊT (160×270) ─────────────────────────────────────────────────────────

function svgForestLayer0(W, H) {
  const rng = seededRng(0xf07e5700);
  const defs = `<defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0%" stop-color="#010601"/>` +
    `<stop offset="100%" stop-color="#061806"/></linearGradient></defs>`;
  let shapes = `<rect width="${W}" height="${H}" fill="url(#fg)"/>`;
  for (let i = 0; i < 20; i++) {
    const tx  = (rng() * W).toFixed(1);
    const th  = 40 + rng() * 50;
    const tw  = 7 + rng() * 10;
    const tx0 = (parseFloat(tx) - tw / 2).toFixed(1);
    const tx1 = (parseFloat(tx) + tw / 2).toFixed(1);
    const tyT = (H - th).toFixed(1);
    shapes += `<polygon points="${tx},${tyT} ${tx0},${H} ${tx1},${H}" fill="#0a2a0a"/>`;
    shapes += `<rect x="${(parseFloat(tx) - 1).toFixed(1)}" y="${(H - 6).toFixed(1)}" width="2" height="6" fill="#0a2a0a"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}${shapes}</svg>`;
}

function svgForestLayer1(W, H) {
  const rng = seededRng(0xf07e5701);
  let shapes = '';
  for (let i = 0; i < 11; i++) {
    const tx  = parseFloat((rng() * W).toFixed(1));
    const th  = 80 + rng() * 90;
    const tw  = 13 + rng() * 12;
    const tyT = H - th;
    const p1  = `${tx.toFixed(1)},${tyT.toFixed(1)} ${(tx - tw/2).toFixed(1)},${H} ${(tx + tw/2).toFixed(1)},${H}`;
    shapes += `<polygon points="${p1}" fill="#051405"/>`;
    const th2 = th * 0.28, tw2 = tw * 0.38;
    const ty2 = tyT - th2;
    const p2  = `${tx.toFixed(1)},${ty2.toFixed(1)} ${(tx - tw2).toFixed(1)},${tyT.toFixed(1)} ${(tx + tw2).toFixed(1)},${tyT.toFixed(1)}`;
    shapes += `<polygon points="${p2}" fill="#051405"/>`;
    shapes += `<rect x="${(tx - 1.5).toFixed(1)}" y="${(H - 9).toFixed(1)}" width="3" height="9" fill="#030e03"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shapes}</svg>`;
}

// ── VILLE (160×270) ─────────────────────────────────────────────────────────

function svgCityLayer0(W, H) {
  const rng = seededRng(0xc1740000);
  const defs = `<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0%" stop-color="#040406"/>` +
    `<stop offset="55%" stop-color="#0e0e16"/>` +
    `<stop offset="100%" stop-color="#1a1020"/></linearGradient></defs>`;
  let shapes = `<rect width="${W}" height="${H}" fill="url(#cg)"/>` +
    `<rect x="0" y="${(H * 0.55).toFixed(1)}" width="${W}" height="${(H * 0.45).toFixed(1)}" fill="#331a00" opacity="0.18"/>`;
  let bx = 0;
  while (bx < W) {
    const bw = Math.floor(7 + rng() * 15);
    const bh = 30 + rng() * 80;
    shapes += `<rect x="${bx}" y="${(H - bh).toFixed(1)}" width="${bw - 1}" height="${bh.toFixed(1)}" fill="#0a0a0f"/>`;
    for (let wy = H - bh + 4; wy < H - 4; wy += 7) {
      for (let wx = bx + 2; wx < bx + bw - 3; wx += 4) {
        if (rng() > 0.33) {
          shapes += `<rect x="${wx}" y="${wy.toFixed(1)}" width="2" height="3" fill="#ffee88" opacity="0.55"/>`;
        }
      }
    }
    bx += bw;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}${shapes}</svg>`;
}

function svgCityLayer1(W, H) {
  const rng = seededRng(0xc1740001);
  let shapes = '';
  let bx = 0;
  while (bx < W) {
    const bw = Math.floor(10 + rng() * 14);
    const bh = 80 + rng() * (H - 80);
    shapes += `<rect x="${bx}" y="${(H - bh).toFixed(1)}" width="${bw - 1}" height="${bh.toFixed(1)}" fill="#050508"/>`;
    if (rng() < 0.5) {
      const ax = (bx + bw / 2).toFixed(1);
      shapes += `<rect x="${(parseFloat(ax) - 0.5).toFixed(1)}" y="${(H - bh - 8).toFixed(1)}" width="1" height="8" fill="#080810"/>`;
      shapes += `<circle cx="${ax}" cy="${(H - bh - 9).toFixed(1)}" r="1.5" fill="#ff2222" opacity="0.75"/>`;
    }
    for (let wy = H - bh + 6; wy < H - 6; wy += 9) {
      for (let wx = bx + 2; wx < bx + bw - 3; wx += 5) {
        if (rng() > 0.25) {
          const lit = rng() > 0.33;
          shapes += `<rect x="${wx}" y="${wy.toFixed(1)}" width="2" height="3" fill="${lit ? '#ffee88' : '#111118'}" opacity="${lit ? 0.65 : 1}"/>`;
        }
      }
    }
    bx += bw;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shapes}</svg>`;
}

// ── TECHNO (160×90, grid tiles fine) ────────────────────────────────────────

function svgTechnoLayer0(W, H) {
  const rng = seededRng(0x7ec30000);
  let shapes = `<rect width="${W}" height="${H}" fill="#000c0c"/>`;
  for (let x = 0; x < W; x += 8) {
    shapes += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#003333" stroke-width="0.5" opacity="0.35"/>`;
  }
  for (let y = 0; y < H; y += 8) {
    shapes += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#003333" stroke-width="0.5" opacity="0.35"/>`;
  }
  for (let x = 0; x < W; x += 8) {
    for (let y = 0; y < H; y += 8) {
      if (rng() < 0.25) {
        shapes += `<circle cx="${x}" cy="${y}" r="1" fill="#00ff88" opacity="0.28"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shapes}</svg>`;
}

function svgTechnoLayer1(W, H) {
  const rng = seededRng(0x7ec30001);
  const cols = ['#00ff88', '#00ccff', '#ff6600', '#cc00ff'];
  let shapes = '';
  for (let i = 0; i < 28; i++) {
    const x1  = (rng() * W).toFixed(1);
    const y1  = (rng() * H).toFixed(1);
    const x2  = Math.min(W, Math.max(0, parseFloat(x1) + (rng() - 0.5) * 60)).toFixed(1);
    const y2  = Math.min(H, Math.max(0, parseFloat(y1) + (rng() - 0.5) * 70)).toFixed(1);
    const col = cols[Math.floor(rng() * cols.length)];
    const op  = (0.25 + rng() * 0.35).toFixed(2);
    const d   = rng() < 0.5
      ? `M${x1},${y1} L${x2},${y1} L${x2},${y2}`
      : `M${x1},${y1} L${x1},${y2} L${x2},${y2}`;
    shapes += `<path d="${d}" stroke="${col}" stroke-width="0.8" fill="none" opacity="${op}"/>`;
    shapes += `<circle cx="${x2}" cy="${y2}" r="1.5" fill="${col}" opacity="${Math.min(1, parseFloat(op) + 0.1).toFixed(2)}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shapes}</svg>`;
}

// ── ABSTRAIT (160×90, scattered shapes tile acceptably) ─────────────────────

function svgAbstractLayer0(W, H) {
  const rng   = seededRng(0xa5537400);
  const defs  = `<defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0%" stop-color="#060008"/>` +
    `<stop offset="100%" stop-color="#0e0016"/></linearGradient></defs>`;
  let shapes  = `<rect width="${W}" height="${H}" fill="url(#ag)"/>`;
  const darkCols = ['#440066', '#220044', '#003355', '#330033'];
  for (let i = 0; i < 14; i++) {
    const x   = (rng() * W).toFixed(1);
    const y   = (rng() * H).toFixed(1);
    const s   = 5 + rng() * 12;
    const col = darkCols[Math.floor(rng() * darkCols.length)];
    if (rng() < 0.5) {
      const p = `${x},${(parseFloat(y) - s).toFixed(1)} ${(parseFloat(x) - s * 0.87).toFixed(1)},${(parseFloat(y) + s * 0.5).toFixed(1)} ${(parseFloat(x) + s * 0.87).toFixed(1)},${(parseFloat(y) + s * 0.5).toFixed(1)}`;
      shapes += `<polygon points="${p}" fill="${col}" opacity="0.32"/>`;
    } else {
      shapes += `<rect x="${(parseFloat(x) - s / 2).toFixed(1)}" y="${(parseFloat(y) - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${col}" opacity="0.32"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}${shapes}</svg>`;
}

function svgAbstractLayer1(W, H) {
  const rng   = seededRng(0xa5537401);
  const bright = ['#aa00ff', '#00aaff', '#ff00aa', '#ffaa00', '#00ffaa'];
  let shapes  = '';
  for (let i = 0; i < 16; i++) {
    const x   = parseFloat((rng() * W).toFixed(1));
    const y   = parseFloat((rng() * H).toFixed(1));
    const s   = 3 + rng() * 12;
    const col = bright[Math.floor(rng() * bright.length)];
    const op  = (0.18 + rng() * 0.27).toFixed(2);
    const sh  = Math.floor(rng() * 3);
    if (sh === 0) {
      const p = `${x.toFixed(1)},${(y - s).toFixed(1)} ${(x - s * 0.87).toFixed(1)},${(y + s * 0.5).toFixed(1)} ${(x + s * 0.87).toFixed(1)},${(y + s * 0.5).toFixed(1)}`;
      shapes += `<polygon points="${p}" fill="none" stroke="${col}" stroke-width="0.7" opacity="${op}"/>`;
    } else if (sh === 1) {
      shapes += `<rect x="${(x - s / 2).toFixed(1)}" y="${(y - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="none" stroke="${col}" stroke-width="0.7" opacity="${op}"/>`;
    } else {
      shapes += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(s / 2).toFixed(1)}" fill="none" stroke="${col}" stroke-width="0.7" opacity="${op}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shapes}</svg>`;
}

// ── World catalogue ──────────────────────────────────────────────────────────

const WORLDS = [
  {
    name: 'space', w: BG_W, h: 90,
    layers: [
      { key: 'space_layer0', label: 'Deep space',  desc: 'Opaque base',             scrollSpeed: 0.25, fn: svgSpaceLayer0 },
      { key: 'space_layer1', label: 'Nebula',       desc: 'Transparent color wash',  scrollSpeed: 0.35, fn: svgSpaceLayer1 },
      { key: 'space_layer2', label: 'Mid stars',    desc: 'Transparent',             scrollSpeed: 0.60, fn: svgSpaceLayer2 },
      { key: 'space_layer3', label: 'Foreground',   desc: 'Sparse — above enemies',  scrollSpeed: 1.00, fn: svgSpaceLayer3 },
    ],
  },
  {
    name: 'desert', w: BG_W, h: 270,
    layers: [
      { key: 'desert_layer0', label: 'Desert sky',  desc: 'Opaque — gradient + dunes', scrollSpeed: 0.20, fn: svgDesertLayer0 },
      { key: 'desert_layer1', label: 'Near dunes',  desc: 'Transparent dunes + cacti', scrollSpeed: 0.70, fn: svgDesertLayer1 },
    ],
  },
  {
    name: 'ocean', w: BG_W, h: 270,
    layers: [
      { key: 'ocean_layer0', label: 'Ocean far',   desc: 'Opaque — gradient + waves', scrollSpeed: 0.15, fn: svgOceanLayer0 },
      { key: 'ocean_layer1', label: 'Ocean near',  desc: 'Transparent waves + bubbles', scrollSpeed: 0.55, fn: svgOceanLayer1 },
    ],
  },
  {
    name: 'snow', w: BG_W, h: 270,
    layers: [
      { key: 'snow_layer0', label: 'Snow sky',  desc: 'Opaque — gradient + flakes',     scrollSpeed: 0.20, fn: svgSnowLayer0 },
      { key: 'snow_layer1', label: 'Snow near', desc: 'Transparent snowflakes + spikes', scrollSpeed: 0.65, fn: svgSnowLayer1 },
    ],
  },
  {
    name: 'forest', w: BG_W, h: 270,
    layers: [
      { key: 'forest_layer0', label: 'Forest far',  desc: 'Opaque — gradient + small pines', scrollSpeed: 0.20, fn: svgForestLayer0 },
      { key: 'forest_layer1', label: 'Forest near', desc: 'Transparent large pines',          scrollSpeed: 0.80, fn: svgForestLayer1 },
    ],
  },
  {
    name: 'city', w: BG_W, h: 270,
    layers: [
      { key: 'city_layer0', label: 'City far',  desc: 'Opaque — gradient + distant skyline', scrollSpeed: 0.15, fn: svgCityLayer0 },
      { key: 'city_layer1', label: 'City near', desc: 'Transparent foreground buildings',     scrollSpeed: 0.70, fn: svgCityLayer1 },
    ],
  },
  {
    name: 'techno', w: BG_W, h: 90,
    layers: [
      { key: 'techno_layer0', label: 'Techno grid',    desc: 'Opaque — teal grid + nodes', scrollSpeed: 0.30, fn: svgTechnoLayer0 },
      { key: 'techno_layer1', label: 'Techno circuits', desc: 'Transparent circuit lines',  scrollSpeed: 0.70, fn: svgTechnoLayer1 },
    ],
  },
  {
    name: 'abstract', w: BG_W, h: 90,
    layers: [
      { key: 'abstract_layer0', label: 'Abstract far',  desc: 'Opaque — dark shapes',      scrollSpeed: 0.25, fn: svgAbstractLayer0 },
      { key: 'abstract_layer1', label: 'Abstract near', desc: 'Transparent bright shapes', scrollSpeed: 0.65, fn: svgAbstractLayer1 },
    ],
  },
];

async function generateBackgrounds(docsDir) {
  const results = [];
  for (const world of WORLDS) {
    const outDir = path.join(docsDir, 'backgrounds', world.name);
    fs.mkdirSync(outDir, { recursive: true });
    for (const layer of world.layers) {
      const svgStr = layer.fn(world.w, world.h);
      const outFile = path.join(outDir, `${layer.key}.png`);
      await sharp(Buffer.from(svgStr, 'utf-8'))
        .resize(world.w, world.h, { fit: 'fill' })
        .png({ compressionLevel: 9 })
        .toFile(outFile);
      results.push({ file: outFile, world: world.name, layer });
    }
  }
  return results;
}

module.exports = { generateBackgrounds, WORLDS, BG_W };
