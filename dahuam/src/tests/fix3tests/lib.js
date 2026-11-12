// Paket fix-3 (Heute, Navigation, Suche, Platz, Lesbarkeit, Einstellungen): gemeinsame Helfer.
// Server wie die anderen Pakete (PORT, Standard 8765). Feste Uhr: Do 12.11.2026, 10:30. Bilder nach x-out/ (oder SHOTS=…).
const E = require('../etests/lib'); const path = require('path'); const fs = require('fs');
Object.assign(exports, E);
exports.OUT = process.env.SHOTS || path.join(__dirname, '..', 'x-out'); try { fs.mkdirSync(exports.OUT, {recursive:true}); } catch(e){}
exports.PHONE = {vp:{width:390, height:844}, ctx:{isMobile:true, hasTouch:true}};
// Zusammenführung mit fix-5: bis 700 px gilt die Handy-Bedienung (phone.js, geprüft in phonetests). Das Tagesblatt, die Leiste
// Heute · Vorbereitung · Rezepte · Ware · Mehr und das Blatt „Mehr“ aus fix-3 gelten weiter von 701 bis 900 px: dort prüft NARROW sie.
exports.NARROW = {vp:{width:760, height:844}, ctx:{isMobile:true, hasTouch:true}};
exports.shot = async (p, name, opts = {}) => { await p.screenshot({path:path.join(exports.OUT, name + '.png'), fullPage:!!opts.full}); };
exports.wide = p => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
exports.rows = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s)].map(x => x.innerText.replace(/\s+/g, ' ').trim()), sel);
