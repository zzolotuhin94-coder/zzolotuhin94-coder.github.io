// Speisekarte-Gestalter: gemeinsame Helfer (Server auf :8765). Feste Uhr wie etests: Donnerstag, 12.11.2026, 10:30 (Herbstkarte), frische Beispieldaten je Kontext.
const E = require('../etests/lib'); const path = require('path'); const fs = require('fs');
Object.assign(exports, E);
exports.OUT = path.join(__dirname, '..', 'g-out', 'test'); try { fs.mkdirSync(exports.OUT, {recursive:true}); } catch(e){}
exports.LOOKS = ['haus', 'alpin', 'elegant', 'kreide', 'getraenke', 'schlicht'];
exports.dl = async (p, fn) => { const [d] = await Promise.all([p.waitForEvent('download', {timeout:120000}), fn()]); const f = path.join(exports.OUT, d.suggestedFilename()); await d.saveAs(f); return {name:d.suggestedFilename(), file:f, size:fs.statSync(f).size}; };
// warten, bis Schriften und Hintergrund der gewählten Vorlage da sind und die Blätter stehen
exports.settle = async p => { await p.waitForFunction(() => !!document.querySelector('#gsCanvas .gs-page') && gsReadyNow(gsFx(gsDoc(), gsState().cur)) && !GS.pend, null, {timeout:20000}); await p.waitForTimeout(120); };
// Speisekarte › Gästekarte öffnen, wahlweise mit Vorlage
exports.gk = async (p, look) => { await p.evaluate(k => { view.mtab = 'guest'; go('menu'); if(k && gsState().cur !== k){ gsState().cur = k; save(); render(); } }, look || ''); await exports.settle(p); };
// Vorlage über die Bedienung wählen (Seitenleiste oder Leiste unten)
exports.pick = async (p, look) => { if(await p.evaluate(() => gsNarrow())){ if(!(await p.$('#gsRail [data-gs="look"]'))) await p.click('.gs-dock [data-id="vorlage"]'); } await p.click(`#gsRail [data-gs="look"][data-id="${look}"]`); await exports.settle(p); };
// Was steht auf den Blättern? Maße in Blatt-Pixeln (794 × 1123), unabhängig vom Maßstab der Vorschau.
exports.sheets = p => p.evaluate(() => [...document.querySelectorAll('#gsCanvas .gs-sheet')].map(sh => {
  const pg = sh.querySelector('.gs-page'), r0 = pg.getBoundingClientRect(), s = r0.width / 794; const body = pg.querySelector('.gs-body'); const br = body ? body.getBoundingClientRect() : null;
  const R = n => { const r = n.getBoundingClientRect(); return {top:(r.top - r0.top) / s, bottom:(r.bottom - r0.top) / s, left:(r.left - r0.left) / s, right:(r.right - r0.left) / s}; };
  return {cover:pg.classList.contains('gs-cover'), cls:pg.className, body:br ? R(body) : null,
    units:[...pg.querySelectorAll('.gs-u')].filter(n => !n.parentElement.closest('.gs-u')).map(n => ({...R(n), id:n.dataset.b || '', k:n.dataset.k || (n.classList.contains('gs-cont') ? 'cont' : ''), h:parseFloat(n.style.height) || 0, name:(t => !t ? '' : t.classList.contains('gs-n') ? [...t.childNodes].filter(c => c.nodeType === 3).map(c => c.textContent).join('').trim() : t.textContent.trim())(n.querySelector('.gs-n,.gs-hn,.gs-tt,.gs-akn')), txt:n.textContent.replace(/\s+/g, ' ').trim()}))};
}));
exports.order = p => p.evaluate(() => { const all = gsAll(); return gsDoc().blocks.map(b => b.t === 'dish' ? (all.get(b.key) ? all.get(b.key).vars[0].name : '?') : b.t === 'head' ? '# ' + gsHeadName(b) : '[' + b.t + ']'); });
exports.center = (p, sel) => p.evaluate(s => { const n = typeof s === 'string' ? document.querySelector(s) : null; if(!n) return null; const r = n.getBoundingClientRect(); return {x:r.left + r.width / 2, y:r.top + r.height / 2, top:r.top, bottom:r.bottom, left:r.left, right:r.right, h:r.height}; }, sel);
exports.blockSel = (p, name) => p.evaluate(nm => { const n = [...document.querySelectorAll('#gsCanvas .gs-b[data-b]')].find(x => { const t = x.querySelector('.gs-n,.gs-hn,.gs-tt'); return t && (t.classList.contains('gs-n') ? [...t.childNodes].filter(c => c.nodeType === 3).map(c => c.textContent).join('') : t.textContent).replace(/\s+/g, ' ').trim() === nm; }); return n ? `#gsCanvas .gs-b[data-b="${n.dataset.b}"]` : null; }, name);
exports.wide = p => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
