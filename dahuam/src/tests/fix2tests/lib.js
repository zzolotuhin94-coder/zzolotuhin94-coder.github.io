// fix2tests: gemeinsame Helfer (wie etests: feste Uhr Do 12.11.2026, 10:30, frische Beispieldaten je Browser-Kontext).
const E = require('../etests/lib'); const path = require('path'); const fs = require('fs');
Object.assign(exports, E);
exports.OUT = path.join(__dirname, '..', 'fix2-out'); try { fs.mkdirSync(exports.OUT, {recursive:true}); } catch(e){}
exports.SHOTS = '/home/user/review-out/fix2';
exports.PHONE = {vp:{width:390, height:844}, ctx:{hasTouch:true, isMobile:true}};
exports.shot = async (p, name, opts = {}) => { let dir = exports.OUT; try { fs.mkdirSync(exports.SHOTS, {recursive:true}); dir = exports.SHOTS; } catch(e){} await p.screenshot({path:path.join(dir, name + '.png'), fullPage:!!opts.full, ...(opts.clip ? {clip:opts.clip} : {})}); };
// Monatsmappe oder Allergen-Blatt sichtbar auf die Seite legen (zum Ansehen und Zählen)
exports.sheets = (p, html) => p.evaluate(h => { let el = document.getElementById('fx2Sheets'); if(!el){ el = document.createElement('div'); el.id = 'fx2Sheets'; el.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;background:#888;padding:10px'; document.body.appendChild(el); } el.innerHTML = h; }, html);
exports.sheetsOff = p => p.evaluate(() => { const el = document.getElementById('fx2Sheets'); if(el) el.remove(); });
