// Paket B: gemeinsame Helfer (Server auf :8765). Jeder Test beginnt mit frischen Beispieldaten in einem eigenen Browser-Kontext.
const S0 = require('../storetests/lib');
exports.ok = S0.ok; exports.done = S0.done; exports.URL = S0.URL; exports.BASE = S0.BASE; exports.idle = S0.idle; exports.launch = S0.launch;
exports.PHONE = {vp:{width:390, height:844}, ctx:{hasTouch:true, isMobile:true}};
exports.open = async (b, opts = {}) => { const c = await S0.ctx(b, opts); const p = await S0.page(c, opts.url); return {c, p}; };
exports.go = async (p, hash) => { await p.evaluate(h => { location.hash = '#' + h; }, hash); await p.waitForTimeout(220); };
exports.toast = p => p.evaluate(() => { const t = document.querySelector('#toast'); return t.classList.contains('show') ? t.textContent : ''; });
// Alle Seiten und Reiter der App als Adressen
exports.SCREENS = ['heute','vorbereitung','checklisten','speisekarte','speisekarte/gaestekarte','speisekarte/saison','rezepte','ware/bestand','ware/bestellen','ware/lieferanten','ware/preise','ware/inventur','ware/buchungen','team/dienstplan','team/auswertung','einstellungen','einrichtung'];
