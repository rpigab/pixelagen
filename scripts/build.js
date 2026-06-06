'use strict';

const fs = require('fs');
const path = require('path');
const { rasterizeSvg, VARIANTS, SIZES } = require('./rasterize.js');
const { generateBackgrounds, WORLDS, BG_W } = require('./generate-backgrounds.js');

const ROOT       = path.resolve(__dirname, '..');
const SHIPS_SRC  = path.join(ROOT, 'src', 'ships');
const DOCS_DIR   = path.join(ROOT, 'docs');
const SPRITE_DIR = path.join(DOCS_DIR, 'sprites');
const SVG_DEST   = path.join(DOCS_DIR, 'svgs');        // kept for CDN backward-compat
const SHIPS_DIR  = path.join(DOCS_DIR, 'ships');
const BG_DIR     = path.join(DOCS_DIR, 'backgrounds');
const ENEMIES_DIR = path.join(DOCS_DIR, 'enemies');

const args = process.argv.slice(2);
const svgOnly        = args.includes('--svg-only');
const spritesOnly    = args.includes('--sprites-only');
const shipsOnly      = args.includes('--ships-only');
const backgroundsOnly = args.includes('--backgrounds-only');

async function main() {
  console.log('pixelagen build starting…\n');

  for (const d of [DOCS_DIR, SPRITE_DIR, SVG_DEST, SHIPS_DIR, BG_DIR, ENEMIES_DIR]) {
    fs.mkdirSync(d, { recursive: true });
  }

  const svgFiles = fs.readdirSync(SHIPS_SRC).filter(f => f.endsWith('.svg'));

  // ── Ships ─────────────────────────────────────────────────────────────────
  if (!backgroundsOnly) {
    if (!spritesOnly) {
      for (const f of svgFiles) {
        fs.copyFileSync(path.join(SHIPS_SRC, f), path.join(SVG_DEST, f));
        console.log(`  copied SVG: ${f}`);
      }
    }

    if (!svgOnly) {
      for (const svgFile of svgFiles) {
        const svgPath = path.join(SHIPS_SRC, svgFile);
        const svgName = path.basename(svgFile, '.svg');
        console.log(`\n  rasterizing ${svgFile}…`);
        const results = await rasterizeSvg(svgPath, SPRITE_DIR, svgName);
        for (const r of results) {
          console.log(`    → ${path.relative(ROOT, r.file)}  [${r.variant} ${r.size}]`);
        }
      }

      generateShipPages(svgFiles);
      console.log('\n  generated ship HTML pages');
    }
  }

  // ── Backgrounds ────────────────────────────────────────────────────────────
  if (!shipsOnly && !svgOnly) {
    console.log('\n  generating background layers…');
    const bgResults = await generateBackgrounds(DOCS_DIR);
    for (const r of bgResults) {
      console.log(`    → ${path.relative(ROOT, r.file)}  [${r.layer.label}]`);
    }
    generateBackgroundPage();
    console.log('  generated backgrounds/index.html');
  }

  // ── Enemies placeholder ────────────────────────────────────────────────────
  generateEnemiesPage();

  // ── Landing ────────────────────────────────────────────────────────────────
  generateLandingPage(svgFiles);
  console.log('  generated index.html (landing)');

  console.log('\nbuild complete.\n');
}

// ── HTML generators ──────────────────────────────────────────────────────────

const CSS_BASE = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a1a;color:#e0e0ff;font-family:'Courier New',monospace;min-height:100vh}
    header{padding:1.5rem 1rem;text-align:center;border-bottom:1px solid #1a1a4a}
    h1{font-size:clamp(1.4rem,5vw,2.2rem);letter-spacing:.15em;color:#00e5ff}
    h1 span{color:#f50057}
    p.sub{margin-top:.5rem;font-size:.85rem;color:#7986cb;letter-spacing:.08em}
    nav{display:flex;justify-content:center;gap:1rem;padding:.8rem;border-bottom:1px solid #1a1a4a;flex-wrap:wrap}
    nav a{color:#7986cb;text-decoration:none;font-size:.85rem;letter-spacing:.1em;padding:.3rem .7rem;border:1px solid #1a1a4a;border-radius:3px}
    nav a:hover,nav a.active{color:#00e5ff;border-color:#00e5ff}
    footer{text-align:center;padding:1.5rem;color:#2d2d6e;font-size:.75rem;border-top:1px solid #1a1a4a;margin-top:2rem}`;

function navLinks(active) {
  const links = [
    { href: '/pixelagen/',                    label: 'Home'        },
    { href: '/pixelagen/ships/',              label: 'Ships'       },
    { href: '/pixelagen/backgrounds/',        label: 'Backgrounds' },
    { href: '/pixelagen/enemies/',            label: 'Enemies'     },
  ];
  return links.map(l =>
    `<a href="${l.href}"${l.label === active ? ' class="active"' : ''}>${l.label}</a>`
  ).join('\n    ');
}

function head(title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <style>${CSS_BASE}`;
}

// ── Landing page ─────────────────────────────────────────────────────────────
function generateLandingPage(svgFiles) {
  const shipCount = svgFiles.length;
  const html = head('Pixelagen') + `
  </style>
</head>
<body>
  <header>
    <h1>PIXEL<span>AGEN</span></h1>
    <p class="sub">procedural pixel-art asset generator — side-scrolling space shooter</p>
  </header>
  <nav>${navLinks('Home')}</nav>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1.5rem;padding:2rem;max-width:900px;margin:0 auto">
    <a href="ships/" style="display:block;background:#0d0d2e;border:1px solid #1a1a4a;border-radius:8px;padding:1.5rem;text-decoration:none;transition:border-color .2s" onmouseover="this.style.borderColor='#00e5ff'" onmouseout="this.style.borderColor='#1a1a4a'">
      <div style="font-size:2rem;margin-bottom:.8rem">🚀</div>
      <div style="color:#00e5ff;font-size:1.1rem;letter-spacing:.15em;margin-bottom:.5rem">SHIPS</div>
      <div style="color:#7986cb;font-size:.8rem">${shipCount} SVG designs · 6 rasterization variants · 3 sizes</div>
    </a>
    <a href="backgrounds/" style="display:block;background:#0d0d2e;border:1px solid #1a1a4a;border-radius:8px;padding:1.5rem;text-decoration:none;transition:border-color .2s" onmouseover="this.style.borderColor='#00e5ff'" onmouseout="this.style.borderColor='#1a1a4a'">
      <div style="font-size:2rem;margin-bottom:.8rem">🌌</div>
      <div style="color:#00e5ff;font-size:1.1rem;letter-spacing:.15em;margin-bottom:.5rem">BACKGROUNDS</div>
      <div style="color:#7986cb;font-size:.8rem">${WORLDS.length} worlds · parallax layers · animated preview</div>
    </a>
    <a href="enemies/" style="display:block;background:#0d0d2e;border:1px solid #1a1a4a;border-radius:8px;padding:1.5rem;text-decoration:none;transition:border-color .2s" onmouseover="this.style.borderColor='#00e5ff'" onmouseout="this.style.borderColor='#1a1a4a'">
      <div style="font-size:2rem;margin-bottom:.8rem">👾</div>
      <div style="color:#00e5ff;font-size:1.1rem;letter-spacing:.15em;margin-bottom:.5rem">ENEMIES</div>
      <div style="color:#7986cb;font-size:.8rem">coming soon</div>
    </a>
  </div>
  <footer>sprites generated from SVG · transparent PNG · pixelagen</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), html);
}

// ── Ship pages ────────────────────────────────────────────────────────────────
function generateShipPages(svgFiles) {
  const shipNames = svgFiles.map(f => path.basename(f, '.svg'));

  // ships/index.html — ship card grid
  const cards = shipNames.map(n => `
    <a href="sprites.html?ship=${n}" class="card">
      <div class="card-img-wrap"><img src="../svgs/${n}.svg" alt="${n}" class="card-img" loading="lazy"/></div>
      <div class="card-label">${n}</div>
    </a>`).join('\n');

  const indexHtml = head('Pixelagen – Ships') + `
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;padding:1.5rem}
    .card{display:flex;flex-direction:column;align-items:center;background:#0d0d2e;border:1px solid #1a1a4a;border-radius:6px;padding:1rem;text-decoration:none;transition:border-color .2s,box-shadow .2s}
    .card:hover{border-color:#00e5ff;box-shadow:0 0 16px #00e5ff33}
    .card-img-wrap{width:100%;aspect-ratio:2/1;display:flex;align-items:center;justify-content:center;background:#050514;border-radius:4px;overflow:hidden}
    .card-img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}
    .card-label{margin-top:.7rem;color:#00e5ff;font-size:.9rem;letter-spacing:.12em;text-transform:uppercase}
  </style>
</head>
<body>
  <header><h1>PIXEL<span>AGEN</span></h1><p class="sub">ship sprites</p></header>
  <nav>${navLinks('Ships')}</nav>
  <div class="grid">${cards}</div>
  <footer>SVG → transparent PNG · 32×16 / 64×32 / 128×64</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(SHIPS_DIR, 'index.html'), indexHtml);

  // ships/svgs.html
  const rows = shipNames.map(n => `
    <section class="ship-section">
      <h2 class="ship-name">${n.toUpperCase()}</h2>
      <div class="svg-wrap"><img src="../svgs/${n}.svg" alt="${n}" class="svg-preview" loading="lazy"/></div>
      <a href="sprites.html?ship=${n}" class="btn">View sprites →</a>
    </section>`).join('\n');

  const svgsHtml = head('Pixelagen – SVG Gallery') + `
    .ship-section{padding:2rem 1rem;border-bottom:1px solid #0d0d2e;max-width:900px;margin:0 auto}
    .ship-name{font-size:1.1rem;letter-spacing:.2em;color:#7986cb;margin-bottom:1rem}
    .svg-wrap{background:#050514;border-radius:6px;overflow:hidden;border:1px solid #1a1a4a}
    .svg-preview{width:100%;display:block}
    .btn{display:inline-block;margin-top:1rem;padding:.5rem 1.2rem;border:1px solid #00e5ff;color:#00e5ff;text-decoration:none;font-size:.85rem;letter-spacing:.1em;border-radius:3px}
    .btn:hover{background:#00e5ff11}
  </style>
</head>
<body>
  <header><h1>PIXEL<span>AGEN</span></h1><p class="sub">SVG source designs</p></header>
  <nav>${navLinks('Ships')}</nav>
  ${rows}
  <footer>vector source files · rendered client-side by browser</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(SHIPS_DIR, 'svgs.html'), svgsHtml);

  // ships/sprites.html
  const variantOptions = VARIANTS.map(v =>
    `<option value="${v.name}">${v.label}</option>`).join('\n        ');
  const shipOptions = shipNames.map(n =>
    `<option value="${n}">${n}</option>`).join('\n        ');

  const spritesHtml = head('Pixelagen – Sprite Gallery') + `
    .controls{display:flex;flex-wrap:wrap;gap:.8rem;padding:1rem 1rem .5rem;align-items:center;justify-content:center}
    .controls label{font-size:.8rem;color:#7986cb;letter-spacing:.1em}
    .controls select{background:#0d0d2e;border:1px solid #1a1a4a;color:#e0e0ff;padding:.35rem .6rem;font-family:inherit;font-size:.85rem;border-radius:3px;cursor:pointer}
    .controls select:focus{outline:none;border-color:#00e5ff}
    .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;padding:1rem}
    .sprite-card{background:#050514;border:1px solid #1a1a4a;border-radius:6px;padding:1rem;display:flex;flex-direction:column;align-items:center;gap:.7rem}
    .size-label{font-size:.7rem;color:#7986cb;letter-spacing:.12em}
    .sprite-wrap{display:flex;align-items:center;justify-content:center;background:#0d0d2e;border-radius:4px;padding:.5rem;width:100%;aspect-ratio:1}
    .sprite-wrap img{image-rendering:pixelated;max-width:100%;max-height:100%;object-fit:contain}
    .sprite-dims{font-size:.65rem;color:#37474f;letter-spacing:.08em}
  </style>
</head>
<body>
  <header><h1>PIXEL<span>AGEN</span></h1><p class="sub">rasterized sprite gallery</p></header>
  <nav>${navLinks('Ships')}</nav>
  <div class="controls">
    <label for="shipSel">SHIP</label>
    <select id="shipSel">${shipOptions}</select>
    <label for="varSel">VARIANT</label>
    <select id="varSel">${variantOptions}</select>
  </div>
  <div class="gallery" id="gallery"></div>
  <footer>sprites are PNG with transparent background · sizes: 32×16, 64×32, 128×64</footer>
  <script>
    const SIZES = [32, 64, 128];
    function dims(s){ return s+'×'+Math.round(s/2); }
    function render() {
      const ship    = document.getElementById('shipSel').value;
      const variant = document.getElementById('varSel').value;
      const gallery = document.getElementById('gallery');
      gallery.innerHTML = '';
      for (const size of SIZES) {
        const w = size, h = Math.round(size / 2);
        const src = \`../sprites/\${variant}/\${size}x\${size}/\${ship}.png\`;
        const card = document.createElement('div');
        card.className = 'sprite-card';
        card.innerHTML = \`
          <div class="size-label">\${dims(size)} px</div>
          <div class="sprite-wrap"><img src="\${src}" alt="\${ship} \${size}" width="\${w}" height="\${h}"/></div>
          <div class="sprite-dims">\${w}×\${h} rendered</div>\`;
        gallery.appendChild(card);
      }
    }
    const params = new URLSearchParams(location.search);
    const shipParam = params.get('ship');
    if (shipParam) {
      const sel = document.getElementById('shipSel');
      for (const opt of sel.options) { if (opt.value === shipParam) { sel.value = shipParam; break; } }
    }
    document.getElementById('shipSel').addEventListener('change', render);
    document.getElementById('varSel').addEventListener('change', render);
    render();
  </script>
</body>
</html>`;
  fs.writeFileSync(path.join(SHIPS_DIR, 'sprites.html'), spritesHtml);
}

// ── Backgrounds page ──────────────────────────────────────────────────────────
function generateBackgroundPage() {
  const PW = 480, PH = 270;  // preview canvas size

  // Embed world data for JS: name, h, layers[]{key, scrollSpeed}
  const worldsJson = JSON.stringify(WORLDS.map(w => ({
    name: w.name, h: w.h,
    layers: w.layers.map(l => ({ key: l.key, label: l.label, desc: l.desc, scrollSpeed: l.scrollSpeed })),
  })));

  const worldOptions = WORLDS.map(w =>
    `<option value="${w.name}">${w.name.toUpperCase()}</option>`
  ).join('');

  const html = head('Pixelagen – Backgrounds') + `
    .preview-wrap{display:flex;flex-direction:column;align-items:center;padding:2rem 1rem 1rem}
    .preview{position:relative;width:${PW}px;height:${PH}px;overflow:hidden;border:1px solid #1a1a4a;border-radius:4px;max-width:100%}
    .layer{position:absolute;inset:0;background-repeat:repeat-x;animation:scrollbg linear infinite}
    @keyframes scrollbg{from{background-position-x:0}to{background-position-x:-${PW}px}}
    .controls-row{display:flex;gap:1rem;margin-top:.8rem;align-items:center;flex-wrap:wrap;justify-content:center}
    .controls-row label{font-size:.75rem;color:#7986cb;letter-spacing:.1em}
    .controls-row select{background:#0d0d2e;border:1px solid #1a1a4a;color:#e0e0ff;padding:.3rem .6rem;font-family:inherit;font-size:.8rem;border-radius:3px}
    .controls-row input[type=range]{accent-color:#00e5ff;width:120px}
    .legend{width:${PW}px;max-width:100%;margin:1.5rem auto 0;border-collapse:collapse;font-size:.78rem}
    .legend th{color:#7986cb;text-align:left;padding:.35rem .6rem;border-bottom:1px solid #1a1a4a;letter-spacing:.08em}
    .legend td{padding:.3rem .6rem;border-bottom:1px solid #0d0d2e}
    .layer-check{cursor:pointer}
    .info{width:${PW}px;max-width:100%;margin:1.2rem auto 0;color:#4a5a8a;font-size:.75rem;line-height:1.6}
  </style>
</head>
<body>
  <header><h1>PIXEL<span>AGEN</span></h1><p class="sub">parallax backgrounds</p></header>
  <nav>${navLinks('Backgrounds')}</nav>
  <div class="preview-wrap">
    <div class="preview" id="preview"></div>
    <div class="controls-row">
      <label>WORLD</label>
      <select id="worldSel">${worldOptions}</select>
      <label>SPEED</label>
      <input type="range" id="speed" min="10" max="400" value="100"/>
      <span id="speedVal" style="color:#00e5ff;font-size:.75rem;width:3em">1.0×</span>
      <button id="pauseBtn" style="background:#0d0d2e;border:1px solid #1a1a4a;color:#7986cb;padding:.3rem .8rem;font-family:inherit;font-size:.75rem;border-radius:3px;cursor:pointer;letter-spacing:.1em">PAUSE</button>
    </div>
    <table class="legend"><thead><tr><th>#</th><th>LAYER</th><th>DESCRIPTION</th><th>SCROLL</th><th>VIS</th></tr></thead>
      <tbody id="legendBody"></tbody>
    </table>
    <p class="info">
      Art width: ${BG_W}px. Worlds with ground elements use ${BG_W}×270 (no vertical tiling); star/grid worlds use ${BG_W}×90.
      Each PNG tiles horizontally via Phaser <code style="color:#00e5ff">tileSprite</code> at 1px/art-px density.
    </p>
  </div>
  <footer>generated PNG · ${WORLDS.length} worlds · pixelagen</footer>
  <script>
    const WORLDS = ${worldsJson};
    const PW = ${PW}, PH = ${PH};
    const BASE_PERIOD = 24;
    let paused = false;
    let currentWorld = null;
    let speedMult = 1;

    const preview    = document.getElementById('preview');
    const legendBody = document.getElementById('legendBody');
    const worldSel   = document.getElementById('worldSel');
    const speedInput = document.getElementById('speed');
    const speedVal   = document.getElementById('speedVal');
    const pauseBtn   = document.getElementById('pauseBtn');

    function buildWorld(worldName) {
      const world = WORLDS.find(w => w.name === worldName);
      preview.innerHTML = '';
      legendBody.innerHTML = '';
      currentWorld = world;

      world.layers.forEach((l, i) => {
        const div = document.createElement('div');
        div.className = 'layer';
        div.id = 'l' + i;
        // background-size: PW × PH (display at 480×270)
        // For 160×90 textures: tileScaleX=3, tileScaleY=3 equivalent in CSS
        // For 160×270 textures: tileScaleX=3, tileScaleY=1
        const bgH = world.h === 90 ? PH : world.h; // 270 in both cases
        div.style.backgroundImage = \`url(\${world.name}/\${l.key}.png)\`;
        div.style.backgroundSize = \`\${PW}px \${bgH}px\`;
        div.style.animationDuration = (BASE_PERIOD / l.scrollSpeed / speedMult).toFixed(2) + 's';
        if (paused) div.style.animationPlayState = 'paused';
        preview.appendChild(div);

        const tr = document.createElement('tr');
        tr.innerHTML = \`<td style="color:#555">\${i}</td>
          <td style="color:#00e5ff;letter-spacing:.08em">\${l.label}</td>
          <td style="color:#7986cb">\${l.desc}</td>
          <td style="color:#7986cb">×\${l.scrollSpeed.toFixed(2)}</td>
          <td><input type="checkbox" class="layer-check" data-layer="\${i}" checked/></td>\`;
        legendBody.appendChild(tr);
      });

      document.querySelectorAll('.layer-check').forEach(cb => {
        cb.addEventListener('change', () => {
          const idx = parseInt(cb.dataset.layer);
          document.getElementById('l' + idx).style.visibility = cb.checked ? 'visible' : 'hidden';
        });
      });
    }

    function applySpeed() {
      document.querySelectorAll('.layer').forEach((el, i) => {
        if (!currentWorld) return;
        const dur = (BASE_PERIOD / currentWorld.layers[i].scrollSpeed / speedMult).toFixed(2);
        el.style.animationDuration = dur + 's';
      });
    }

    worldSel.addEventListener('change', () => buildWorld(worldSel.value));
    speedInput.addEventListener('input', () => {
      speedMult = parseFloat(speedInput.value) / 100;
      speedVal.textContent = speedMult.toFixed(1) + '×';
      applySpeed();
    });
    pauseBtn.addEventListener('click', () => {
      paused = !paused;
      document.querySelectorAll('.layer').forEach(el => el.style.animationPlayState = paused ? 'paused' : 'running');
      pauseBtn.textContent = paused ? 'RESUME' : 'PAUSE';
      pauseBtn.style.color = paused ? '#00e5ff' : '#7986cb';
    });

    buildWorld('space');
  </script>
</body>
</html>`;
  fs.writeFileSync(path.join(BG_DIR, 'index.html'), html);
}

// ── Enemies placeholder ───────────────────────────────────────────────────────
function generateEnemiesPage() {
  const html = head('Pixelagen – Enemies') + `
    .placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:40vh;gap:1rem;color:#2d2d6e}
    .placeholder span{font-size:3rem}
  </style>
</head>
<body>
  <header><h1>PIXEL<span>AGEN</span></h1><p class="sub">enemy sprites</p></header>
  <nav>${navLinks('Enemies')}</nav>
  <div class="placeholder">
    <span>👾</span>
    <p style="font-size:.9rem;letter-spacing:.12em">COMING SOON</p>
    <p style="font-size:.75rem;color:#1a2a4a">SVG sources will live in <code style="color:#3a4a8a">src/enemies/</code></p>
  </div>
  <footer>pixelagen</footer>
</body>
</html>`;
  fs.mkdirSync(ENEMIES_DIR, { recursive: true });
  fs.writeFileSync(path.join(ENEMIES_DIR, 'index.html'), html);
}

main().catch(err => { console.error(err); process.exit(1); });
