// Apartments: gemeinsame Helfer (Server auf :8765, sonst PORT=…). Feste Uhr wie etests: Donnerstag, 12.11.2026, 10:30.
// Jeder Test beginnt mit frischen Beispieldaten in einem eigenen Browser-Kontext.
process.env.PORT = process.env.PORT || '8765';
const E = require('../etests/lib'); const path = require('path'); const fs = require('fs');
Object.assign(exports, E);
exports.OUT = path.join(__dirname, '..', 'a-out'); try { fs.mkdirSync(exports.OUT, {recursive:true}); } catch(e){}
exports.SHOTS = process.env.SHOTS || path.join(exports.OUT, 'shots'); try { fs.mkdirSync(exports.SHOTS, {recursive:true}); } catch(e){}
exports.SAMPLES = path.join(__dirname, 'samples');
exports.sample = n => path.join(exports.SAMPLES, n);
exports.shot = async (p, name, opts = {}) => { await p.screenshot({path:path.join(opts.out || exports.OUT, name + '.png'), fullPage:opts.full !== false}); };
exports.dl = async (p, fn) => { const [d] = await Promise.all([p.waitForEvent('download', {timeout:90000}), fn()]); const f = path.join(exports.OUT, d.suggestedFilename()); await d.saveAs(f); return {name:d.suggestedFilename(), file:f, size:fs.statSync(f).size}; };
// Apartments öffnen (Reiter: uebersicht, reinigung, verwalten)
exports.ap = async (p, tab) => { await p.evaluate(t => { location.hash = '#apartments' + (t && t !== 'uebersicht' ? '/' + t : ''); }, tab || ''); await p.waitForTimeout(250); };
// ohne Beispiel-Apartments: zwei eigene, leere Apartments
exports.clean = p => p.evaluate(() => { apDemoRemove(); const a = apS(); a.apts.push({id:'apt_a', name:'Apartment Alpha', guests:4, beds:3, note:'Code 4711', color:1}, {id:'apt_b', name:'Apartment Beta', guests:2, beds:2, note:'', color:2}); save(); render(); });
exports.dlgOpen = p => p.evaluate(() => document.querySelector('#dlg').open);
exports.dlgClose = p => p.evaluate(() => document.querySelector('#dlg').close());
exports.submit = async p => { await p.click('#dlgForm button[type=submit]'); await p.waitForTimeout(250); };
exports.toastTxt = p => p.evaluate(() => { const t = document.querySelector('#toast'); return t.classList.contains('show') ? t.textContent : ''; });
exports.toastUndo = async p => { await p.click('#toast .toast-act'); await p.waitForTimeout(200); };
exports.wide = p => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
// Dialog füllen; Auswahlknöpfe (Kanal) über ihr Etikett, wie mit dem Finger
exports.dlgFill = async (p, vals) => { for(const [k, v] of Object.entries(vals)){ const sel = `#dlgForm [name="${k}"]`; const tag = await p.$eval(sel, e => e.tagName + ':' + (e.type || '')); if(tag.startsWith('SELECT')) await p.selectOption(sel, v); else if(tag.endsWith(':radio')) await p.click(`#dlgForm label:has(> input[name="${k}"][value="${v}"])`); else await p.fill(sel, v); } };
