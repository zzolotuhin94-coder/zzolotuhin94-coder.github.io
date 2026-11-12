// fix1tests: gemeinsame Helfer (Server auf :8771). Feste Uhr: Donnerstag, 12.11.2026, 10:30, frische Beispieldaten je Browser-Kontext.
// Bilder vorher/nachher landen in FIX1_OUT (Standard: /home/user/review-out/fix1), sonst in tests/fix1-out.
process.env.PORT = process.env.PORT || '8771';
const E = require('../etests/lib'); const path = require('path'); const fs = require('fs');
Object.assign(exports, E);
exports.OUT = process.env.FIX1_OUT || (fs.existsSync('/home/user/review-out') ? '/home/user/review-out/fix1' : path.join(__dirname, '..', 'fix1-out'));
try { fs.mkdirSync(exports.OUT, {recursive:true}); } catch(e){}
exports.PHONE = {vp:{width:390, height:844}, ctx:{hasTouch:true, isMobile:true, deviceScaleFactor:2}};
exports.IPAD = {vp:{width:1024, height:768}, ctx:{hasTouch:true}};
exports.IPADP = {vp:{width:768, height:1024}, ctx:{hasTouch:true}};
exports.DESK = {vp:{width:1440, height:900}};
exports.shot = async (p, name, opts = {}) => { await p.screenshot({path:path.join(exports.OUT, name + '.png'), fullPage:opts.full !== false, ...(opts.clip ? {clip:opts.clip, fullPage:false} : {})}); };
exports.ev = (p, f, a) => p.evaluate(f, a);
// keine waagrechte Seiten-Scrollleiste
exports.noHScroll = p => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
// feste Leerzeichen (€ 9,50) für Textvergleiche zu normalen machen
exports.nb = s => s === undefined ? s : typeof s === 'string' ? s.replace(/[\u00a0\u202f]/g, ' ') : JSON.parse(JSON.stringify(s).replace(/\\u00a0|\\u202f|[\u00a0\u202f]/g, ' '));
