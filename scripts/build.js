'use strict';

const fs = require('fs');
const path = require('path');
const { rasterizeSvg, VARIANTS, SIZES } = require('./rasterize.js');

const ROOT      = path.resolve(__dirname, '..');
const SVG_SRC   = path.join(ROOT, 'src', 'svgs');
const DOCS_DIR  = path.join(ROOT, 'docs');
const SPRITE_DIR = path.join(DOCS_DIR, 'sprites');
const SVG_DEST  = path.join(DOCS_DIR, 'svgs');

const args = process.argv.slice(2);
const svgOnly     = args.includes('--svg-only');
const spritesOnly = args.includes('--sprites-only');

async function main() {
  console.log('pixelagen build starting…\n');

  fs.mkdirSync(DOCS_DIR,   { recursive: true });
  fs.mkdirSync(SPRITE_DIR, { recursive: true });
  fs.mkdirSync(SVG_DEST,   { recursive: true });

  // 1. Copy SVGs to docs/svgs/
  const svgFiles = fs.readdirSync(SVG_SRC).filter(f => f.endsWith('.svg'));
  if (!spritesOnly) {
    for (const f of svgFiles) {
      fs.copyFileSync(path.join(SVG_SRC, f), path.join(SVG_DEST, f));
      console.log(`  copied SVG: ${f}`);
    }
  }

  // 2. Rasterize each SVG
  if (!svgOnly) {
    for (const svgFile of svgFiles) {
      const svgPath = path.join(SVG_SRC, svgFile);
      const svgName = path.basename(svgFile, '.svg');
      console.log(`\n  rasterizing ${svgFile}…`);
      const results = await rasterizeSvg(svgPath, SPRITE_DIR, svgName);
      for (const r of results) {
        const rel = path.relative(ROOT, r.file);
        console.log(`    → ${rel}  [${r.variant} ${r.size}]`);
      }
    }
  }

  // 3. Generate HTML pages
  if (!svgOnly) {
    generateIndexPage(svgFiles, DOCS_DIR);
    generateSvgGallery(svgFiles, DOCS_DIR);
    generateSpriteGallery(svgFiles, DOCS_DIR);
    console.log('\n  generated HTML pages');
  }

  console.log('\nbuild complete.\n');
}

function generateIndexPage(svgFiles, docsDir) {
  const shipNames = svgFiles.map(f => path.basename(f, '.svg'));
  const cards = shipNames.map(n => `
    <a href="sprites.html?ship=${n}" class="card">
      <div class="card-img-wrap">
        <img src="svgs/${n}.svg" alt="${n}" class="card-img" loading="lazy"/>
      </div>
      <div class="card-label">${n}</div>
    </a>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Pixelagen – Spaceship Sprites</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a1a;color:#e0e0ff;font-family:'Courier New',monospace;min-height:100vh}
    header{padding:1.5rem 1rem;text-align:center;border-bottom:1px solid #1a1a4a}
    h1{font-size:clamp(1.4rem,5vw,2.2rem);letter-spacing:.15em;color:#00e5ff}
    h1 span{color:#f50057}
    p.sub{margin-top:.5rem;font-size:.85rem;color:#7986cb;letter-spacing:.08em}
    nav{display:flex;justify-content:center;gap:1rem;padding:.8rem;border-bottom:1px solid #1a1a4a}
    nav a{color:#7986cb;text-decoration:none;font-size:.85rem;letter-spacing:.1em;padding:.3rem .7rem;border:1px solid #1a1a4a;border-radius:3px}
    nav a:hover,nav a.active{color:#00e5ff;border-color:#00e5ff}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;padding:1.5rem}
    .card{display:flex;flex-direction:column;align-items:center;background:#0d0d2e;border:1px solid #1a1a4a;border-radius:6px;padding:1rem;text-decoration:none;transition:border-color .2s,box-shadow .2s;cursor:pointer}
    .card:hover{border-color:#00e5ff;box-shadow:0 0 16px #00e5ff33}
    .card-img-wrap{width:100%;aspect-ratio:2/1;display:flex;align-items:center;justify-content:center;background:#050514;border-radius:4px;overflow:hidden}
    .card-img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}
    .card-label{margin-top:.7rem;color:#00e5ff;font-size:.9rem;letter-spacing:.12em;text-transform:uppercase}
    footer{text-align:center;padding:1.5rem;color:#2d2d6e;font-size:.75rem;border-top:1px solid #1a1a4a}
  </style>
</head>
<body>
  <header>
    <h1>PIXEL<span>AGEN</span></h1>
    <p class="sub">spaceship sprite generator — side-scrolling shooter</p>
  </header>
  <nav>
    <a href="index.html" class="active">Ships</a>
    <a href="svgs.html">SVG Gallery</a>
    <a href="sprites.html">Sprite Gallery</a>
  </nav>
  <div class="grid">${cards}
  </div>
  <footer>sprites generated from SVG · transparent PNG · 32×16 / 64×32 / 128×64</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(docsDir, 'index.html'), html);
}

function generateSvgGallery(svgFiles, docsDir) {
  const shipNames = svgFiles.map(f => path.basename(f, '.svg'));
  const rows = shipNames.map(n => `
    <section class="ship-section">
      <h2 class="ship-name">${n.toUpperCase()}</h2>
      <div class="svg-wrap"><img src="svgs/${n}.svg" alt="${n}" class="svg-preview" loading="lazy"/></div>
      <a href="sprites.html?ship=${n}" class="btn">View sprites →</a>
    </section>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Pixelagen – SVG Gallery</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a1a;color:#e0e0ff;font-family:'Courier New',monospace;min-height:100vh}
    header{padding:1.5rem 1rem;text-align:center;border-bottom:1px solid #1a1a4a}
    h1{font-size:clamp(1.4rem,5vw,2.2rem);letter-spacing:.15em;color:#00e5ff}
    h1 span{color:#f50057}
    nav{display:flex;justify-content:center;gap:1rem;padding:.8rem;border-bottom:1px solid #1a1a4a}
    nav a{color:#7986cb;text-decoration:none;font-size:.85rem;letter-spacing:.1em;padding:.3rem .7rem;border:1px solid #1a1a4a;border-radius:3px}
    nav a:hover,nav a.active{color:#00e5ff;border-color:#00e5ff}
    .ship-section{padding:2rem 1rem;border-bottom:1px solid #0d0d2e;max-width:900px;margin:0 auto}
    .ship-name{font-size:1.1rem;letter-spacing:.2em;color:#7986cb;margin-bottom:1rem}
    .svg-wrap{background:#050514;border-radius:6px;overflow:hidden;border:1px solid #1a1a4a}
    .svg-preview{width:100%;display:block}
    .btn{display:inline-block;margin-top:1rem;padding:.5rem 1.2rem;border:1px solid #00e5ff;color:#00e5ff;text-decoration:none;font-size:.85rem;letter-spacing:.1em;border-radius:3px}
    .btn:hover{background:#00e5ff11}
    footer{text-align:center;padding:1.5rem;color:#2d2d6e;font-size:.75rem;border-top:1px solid #1a1a4a}
  </style>
</head>
<body>
  <header>
    <h1>PIXEL<span>AGEN</span></h1>
    <p style="margin-top:.5rem;font-size:.85rem;color:#7986cb;letter-spacing:.08em">SVG source designs</p>
  </header>
  <nav>
    <a href="index.html">Ships</a>
    <a href="svgs.html" class="active">SVG Gallery</a>
    <a href="sprites.html">Sprite Gallery</a>
  </nav>
  ${rows}
  <footer>vector source files · rendered client-side by browser</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(docsDir, 'svgs.html'), html);
}

function generateSpriteGallery(svgFiles, docsDir) {
  const shipNames = svgFiles.map(f => path.basename(f, '.svg'));

  const variantOptions = VARIANTS.map(v =>
    `<option value="${v.name}">${v.label}</option>`).join('\n        ');

  const shipOptions = shipNames.map(n =>
    `<option value="${n}">${n}</option>`).join('\n        ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Pixelagen – Sprite Gallery</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a1a;color:#e0e0ff;font-family:'Courier New',monospace;min-height:100vh}
    header{padding:1.5rem 1rem;text-align:center;border-bottom:1px solid #1a1a4a}
    h1{font-size:clamp(1.4rem,5vw,2.2rem);letter-spacing:.15em;color:#00e5ff}
    h1 span{color:#f50057}
    nav{display:flex;justify-content:center;gap:1rem;padding:.8rem;border-bottom:1px solid #1a1a4a}
    nav a{color:#7986cb;text-decoration:none;font-size:.85rem;letter-spacing:.1em;padding:.3rem .7rem;border:1px solid #1a1a4a;border-radius:3px}
    nav a:hover,nav a.active{color:#00e5ff;border-color:#00e5ff}
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
    footer{text-align:center;padding:1.5rem;color:#2d2d6e;font-size:.75rem;border-top:1px solid #1a1a4a;margin-top:2rem}
  </style>
</head>
<body>
  <header>
    <h1>PIXEL<span>AGEN</span></h1>
    <p style="margin-top:.5rem;font-size:.85rem;color:#7986cb;letter-spacing:.08em">rasterized sprite gallery</p>
  </header>
  <nav>
    <a href="index.html">Ships</a>
    <a href="svgs.html">SVG Gallery</a>
    <a href="sprites.html" class="active">Sprite Gallery</a>
  </nav>
  <div class="controls">
    <label for="shipSel">SHIP</label>
    <select id="shipSel">
        ${shipOptions}
    </select>
    <label for="varSel">VARIANT</label>
    <select id="varSel">
        ${variantOptions}
    </select>
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
        const src = \`sprites/\${variant}/\${size}x\${size}/\${ship}.png\`;
        const card = document.createElement('div');
        card.className = 'sprite-card';
        card.innerHTML = \`
          <div class="size-label">\${dims(size)} px</div>
          <div class="sprite-wrap"><img src="\${src}" alt="\${ship} \${size}" width="\${w}" height="\${h}"/></div>
          <div class="sprite-dims">\${w}×\${h} rendered</div>
        \`;
        gallery.appendChild(card);
      }
    }

    // Read ship from URL param
    const params = new URLSearchParams(location.search);
    const shipParam = params.get('ship');
    if (shipParam) {
      const sel = document.getElementById('shipSel');
      for (const opt of sel.options) {
        if (opt.value === shipParam) { sel.value = shipParam; break; }
      }
    }

    document.getElementById('shipSel').addEventListener('change', render);
    document.getElementById('varSel').addEventListener('change', render);
    render();
  </script>
</body>
</html>`;
  fs.writeFileSync(path.join(docsDir, 'sprites.html'), html);
}

main().catch(err => { console.error(err); process.exit(1); });
