// Paket D1: gemeinsame Helfer (Server auf :8765). Jeder Test beginnt mit frischen Beispieldaten in einem eigenen Browser-Kontext.
const C = require('../ctests/lib'); const path = require('path'); const fs = require('fs');
Object.assign(exports, C);
exports.OUT = path.join(__dirname, '..', 'd-out'); try { fs.mkdirSync(exports.OUT, {recursive:true}); } catch(e){}
exports.shot = async (p, name, opts = {}) => { await p.screenshot({path:path.join(exports.OUT, name + '.png'), fullPage:opts.full !== false, ...(opts.clip ? {clip:opts.clip, fullPage:false} : {})}); };
exports.near = (a, b, eps = 0.0051) => Math.abs(a - b) <= eps;
exports.team = p => p.evaluate(() => { S.settings.currentUser = 'u_staff'; save(); render(); });
exports.chef = p => p.evaluate(() => { S.settings.currentUser = 'u_chef'; save(); render(); });
// Dialog: Feld füllen und speichern
exports.dlgFill = async (p, vals) => { for(const [k, v] of Object.entries(vals)){ const sel = `#dlgForm [name="${k}"]`; const tag = await p.$eval(sel, e => e.tagName + ':' + (e.type || '')); if(tag.startsWith('SELECT')) await p.selectOption(sel, v); else if(tag.endsWith(':radio')) await p.check(`${sel}[value="${v}"]`); else await p.fill(sel, v); } };
exports.dlgOk = async p => { await p.click('#dlgForm button[type=submit]'); await p.waitForTimeout(300); };
exports.drinkKind = async p => { await p.click('#dlgForm .togs.kind label:nth-child(2)'); await p.waitForTimeout(80); };
