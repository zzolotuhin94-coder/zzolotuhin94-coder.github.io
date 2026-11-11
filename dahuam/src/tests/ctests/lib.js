// Paket C: gemeinsame Helfer (Server auf :8765). Jeder Test beginnt mit frischen Beispieldaten in einem eigenen Browser-Kontext.
const B = require('../btests/lib'); const path = require('path'); const fs = require('fs');
Object.assign(exports, B); exports.ready = require('../storetests/lib').ready;
exports.SAMPLES = path.join(__dirname, 'samples'); exports.OUT = path.join(__dirname, '..', 'c-out');
try { fs.mkdirSync(exports.OUT, {recursive:true}); } catch(e){}
exports.sample = n => path.join(exports.SAMPLES, n);
// Datei in den Import laden (das versteckte Dateifeld der Import-Seite)
exports.upload = async (p, file) => { await p.setInputFiles('#impFileIn', file); await p.waitForTimeout(450); };
exports.openImp = async (p, type) => { await p.evaluate(t => datenOpen(t), type); await p.waitForTimeout(250); };
// Vorschau: Zustände je Zeile
exports.preview = p => p.evaluate(() => { const d = view.daten; return d && d.res ? d.res.items.map(i => ({n:i.n, st:i.st, title:i.title, why:i.why || '', notes:i.notes || [], price:i.price})) : null; });
exports.counts = p => p.evaluate(() => impCounts(view.daten.res));
exports.apply = async p => { await p.click('#app [data-act="impApply"]'); await p.waitForTimeout(500); };
exports.width = p => p.evaluate(() => document.documentElement.scrollWidth);
exports.dl = async (p, fn) => { const [d] = await Promise.all([p.waitForEvent('download', {timeout:60000}), fn()]); const f = path.join(exports.OUT, d.suggestedFilename()); await d.saveAs(f); return {name:d.suggestedFilename(), file:f}; };
exports.shot = async (p, name, opts = {}) => { await p.screenshot({path:path.join(exports.OUT, name + '.png'), fullPage:opts.full !== false, ...(opts.clip ? {clip:opts.clip, fullPage:false} : {})}); };
exports.theme = (p, t) => p.evaluate(x => setTheme(x), t);
