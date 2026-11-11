// Paket D2: gemeinsame Helfer (Server auf :8765). Feste Uhr: Donnerstag, 12.11.2026, 10:30 (wie teamtests), frische Beispieldaten je Browser-Kontext.
const D = require('../dtests/lib'); const S0 = require('../storetests/lib'); const T = require('../teamtests/tlib'); const path = require('path'); const fs = require('fs');
Object.assign(exports, D);
exports.OUT = path.join(__dirname, '..', 'e-out'); try { fs.mkdirSync(exports.OUT, {recursive:true}); } catch(e){}
exports.AT = [2026, 11, 12, 10, 30];
exports.clock = T.clock;
exports.TABLET = {vp:{width:1024, height:768}, ctx:{hasTouch:true}};
// wie btests.open, aber mit fester Uhr (opts.at) und wahlweise dunklem Design (opts.dark)
exports.open = async (b, opts = {}) => { const o = {...opts, init:T.clock(...(opts.at || exports.AT)), ctx:{locale:'de-AT', colorScheme:opts.dark ? 'dark' : 'light', ...(opts.ctx || {})}}; const c = await S0.ctx(b, o); if(opts.init) await c.addInitScript(opts.init); const p = await S0.page(c, opts.url); return {c, p}; };
exports.shot = async (p, name, opts = {}) => { await p.screenshot({path:path.join(exports.OUT, name + '.png'), fullPage:opts.full !== false, ...(opts.clip ? {clip:opts.clip, fullPage:false} : {})}); };
exports.dl = async (p, fn) => { const [d] = await Promise.all([p.waitForEvent('download', {timeout:90000}), fn()]); const f = path.join(exports.OUT, d.suggestedFilename()); await d.saveAs(f); return {name:d.suggestedFilename(), file:f, size:fs.statSync(f).size}; };
// Seitenzahl einer PDF-Datei (jsPDF schreibt je Seite ein /Type /Page)
exports.pdfPages = file => { const s = fs.readFileSync(file, 'latin1'); return (s.match(/\/Type\s*\/Page[^s]/g) || []).length; };
exports.txt = (p, sel) => p.evaluate(s => { const n = document.querySelector(s); return n ? n.innerText.replace(/\s+/g, ' ').trim() : null; }, sel);
