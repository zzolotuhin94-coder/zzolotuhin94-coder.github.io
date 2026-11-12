// Bildschirmfotos für die Anleitung: Beispieldaten, helles Design, feste Uhr (Do 12.11.2026, 10:30), deviceScaleFactor 2.
// Aufruf: node anleitung/shots.js (Server auf :8765). Ergebnis: anleitung/img/*.jpg
const L = (() => { try { return require('../etests/lib'); } catch(e){ return require('../tests/etests/lib'); } })();   // Arbeitsordner oder dahuam/src
const path = require('path'); const fs = require('fs');
const OUT = path.join(__dirname, 'img'); fs.mkdirSync(OUT, {recursive:true});
const PHONE = {vp:{width:390, height:844}, ctx:{isMobile:true, hasTouch:true, deviceScaleFactor:2, userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'}};   // iPhone: so steht auf der Willkommensseite der Hinweis für Safari
const TAB = {vp:{width:1024, height:768}, ctx:{hasTouch:true, deviceScaleFactor:2}};
const snap = async (p, name, clip) => { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(450); await p.screenshot({path:path.join(OUT, name + '.jpg'), type:'jpeg', quality:84, clip}); console.log('  ' + name); };
(async () => {
  const b = await L.launch();
  { const {p} = await L.open(b, PHONE);
    await p.evaluate(() => wlOpen()); await p.waitForTimeout(500);
    await snap(p, '1-willkommen', {x:0, y:0, width:390, height:800});
    await p.keyboard.press('Escape');
    await L.go(p, 'einstellungen/eigene-daten'); await p.evaluate(() => window.scrollTo(0, 0));
    await snap(p, '3-eigene-daten', {x:0, y:64, width:390, height:640});
    await p.close(); }
  { const {p} = await L.open(b, TAB);
    await L.go(p, 'heute'); await snap(p, '2-heute', {x:0, y:0, width:1024, height:600});
    await L.go(p, 'speisekarte/gaestekarte'); await snap(p, '4-gaestekarte', {x:236, y:0, width:788, height:560});
    await L.go(p, 'rezepte/dish_elsasser/kueche'); await snap(p, '5-rezept-kueche', {x:236, y:0, width:788, height:560});
    await L.go(p, 'einstellungen'); const r = await p.evaluate(() => { const n = document.getElementById('setupDaten'); n.scrollIntoView({block:'start'}); window.scrollBy(0, -16); const x = n.getBoundingClientRect(); return {x:x.left - 12, y:x.top - 12, width:x.width + 24, height:x.height + 24}; });
    await snap(p, '6-sicherung', r);
    await p.close(); }
  await b.close();
})();
