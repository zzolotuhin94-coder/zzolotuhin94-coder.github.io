// Anleitung als PDF: node anleitung/make.js  →  dahuam/Anleitung-DAHUAM202.pdf und w-out/anleitung-seite-N.png
// Vorher (wenn sich die App geändert hat): node anleitung/shots.js (Server auf :8765). Danach python3 build.py (Precache).
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const SITE_DIR = process.env.DAHUAM_SITE || '/home/user/wt-5/dahuam';   // Ordner dahuam/ im Repository
const OUT_PDF = path.join(SITE_DIR, 'Anleitung-DAHUAM202.pdf');
const PNG_DIR = path.join(__dirname, '..', 'w-out'); fs.mkdirSync(PNG_DIR, {recursive:true});
const version = (/APP_VERSION = '([^']+)'/.exec(fs.readFileSync(path.join(__dirname, '..', 'build.py'), 'utf8')) || [])[1] || '';
(async () => {
  const html = fs.readFileSync(path.join(__dirname, 'anleitung.src.html'), 'utf8').split('__SITE__').join('file://' + SITE_DIR).split('__VERSION__').join(version);
  const tmp = path.join(__dirname, 'anleitung.html'); fs.writeFileSync(tmp, html);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  const fonts = await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
  const broken = await p.evaluate(() => [...document.images].filter(i => !i.naturalWidth).map(i => i.src));
  if(broken.length){ console.error('Bilder fehlen:', broken); process.exit(1); }
  await p.pdf({path:OUT_PDF, format:'A4', printBackground:true, preferCSSPageSize:true, displayHeaderFooter:true,
    headerTemplate:'<span></span>',
    footerTemplate:'<div style="width:100%;font:7.5pt Helvetica,Arial,sans-serif;color:#7a7d80;padding:0 17mm;display:flex;justify-content:space-between"><span>DAHUAM.202 Küchen-App · Erste Schritte</span><span>Seite <span class="pageNumber"></span> von <span class="totalPages"></span></span></div>'});
  // jede Seite als Bild zur Kontrolle (pdftoppm, falls vorhanden)
  const n = (fs.readFileSync(OUT_PDF, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  try { fs.readdirSync(PNG_DIR).filter(f => /^anleitung-seite-\d+\.png$/.test(f)).forEach(f => fs.unlinkSync(path.join(PNG_DIR, f)));
    require('child_process').execFileSync('pdftoppm', ['-png', '-r', '110', OUT_PDF, path.join(PNG_DIR, 'anleitung-seite')]); } catch(e){ console.warn('keine Seitenbilder:', e.message); }
  await b.close();
  console.log('PDF', OUT_PDF, Math.round(fs.statSync(OUT_PDF).size / 1024) + ' KB', n + ' Seiten', 'Schriften:', [...new Set(fonts)].join(', '));
})();
