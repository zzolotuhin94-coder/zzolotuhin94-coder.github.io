// Geräte: iPhone 13 und iPhone SE, hell und dunkel. Jede Handy-Seite und jedes Blatt: nichts quer, Ziele ≥ 44 px, Kontrast ≥ 4,5:1.
// Dazu: zwischen 701 und 900 px und am Laptop bleibt alles wie bisher; beim Drehen/Verbreitern schaltet die App sauber um.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  for(const [name, dev] of [['iPhone 13', L.IP13], ['iPhone SE', L.SE]]) for(const dark of [false, true]){
    const {p} = await L.open(b, {...dev, dark}); const w = dev.vp.width; const tag = `${name}, ${dark ? 'dunkel' : 'hell'}`;
    const chk = async (what, root) => { const ns = await L.noSide(p, w); const sm = await L.small(p, root); const ct = await L.contrast(p, root);
      L.ok(ns.sw <= w && !ns.over.length && !sm.length && !ct.length, `${tag}: ${what}`, {quer:ns, klein:sm, kontrast:ct}); };
    await p.evaluate(() => { S.invDraft = {date:new Date().toISOString(), counts:{}}; save(); render(); });
    await chk('Heute', '#app'); await chk('Leiste unten', '.bottom');
    await L.tap(p, '.bottom [data-ph="such"]'); await p.fill('#phQ', 'sch'); await p.waitForTimeout(150); await chk('Suchen mit Treffern', '#app');
    await L.tap(p, '#phRes [data-act="phArt"]'); await chk('Zähl-Blatt', '#phSheet');
    const fit = await p.evaluate(() => { const r = document.querySelector('#phSheet .hy-box').getBoundingClientRect(); const s = document.querySelector('#phSheet [data-act="phCntSave"]').getBoundingClientRect(); return {top:Math.round(r.top), bottom:Math.round(r.bottom), save:Math.round(s.bottom), ih:innerHeight}; });
    L.ok(fit.top >= 0 && fit.save <= fit.ih, `${tag}: das Zähl-Blatt passt mit dem Speichern-Knopf auf den Bildschirm`, fit);
    await L.tap(p, '#phSheet .hy-x');
    await L.tap(p, '.bottom [data-ph="best"]'); await chk('Bestellen', '#app');
    await L.tap(p, '#app [data-act="phOrd"]'); await chk('Bestell-Blatt', '#phSheet');
    const of = await p.evaluate(() => { const r = document.querySelector('#phSheet .hy-box').getBoundingClientRect(); const bd = document.getElementById('phSheetB'); bd.scrollTop = 9999; const s = [...document.querySelectorAll('#phSheet .hy-btn')].pop().getBoundingClientRect(); /* fix-1: eine Vorschau hat kein „Entwurf löschen“; der letzte Knopf zählt */ return {top:Math.round(r.top), del:Math.round(s.bottom), ih:innerHeight}; });
    L.ok(of.top >= 40 && of.del <= of.ih, `${tag}: das Bestell-Blatt lässt oben Platz und scrollt in sich bis zum letzten Knopf`, of);
    await L.tap(p, '#phSheet .hy-x');
    await L.tap(p, '.bottom [data-ph="heute"]'); await L.tap(p, '#phBoard [data-act="plGo"]'); await chk('Vorbereitung', '#app');
    await L.tap(p, '#app [data-act="phFc"]'); const ns = await L.noSide(p, w); L.ok(ns.sw <= w && !ns.over.length, `${tag}: Vorbereitung mit offener Prognose, nichts quer`, ns);
    await L.tap(p, '.bottom [data-ph="mehr"]'); await L.tap(p, '#app [data-act="phLap"]'); await chk('Mehr mit offener Laptop-Liste', '#app');
    await L.tap(p, '#app [data-act="goStock"][data-id="bestand"]'); await chk('Bestand', '#app');
    await p.evaluate(() => document.querySelector('#app [data-act="phBf"][data-id="low"]').click()); await p.waitForTimeout(200); await chk('Bestand, unter Mindest', '#app');
    await L.tap(p, '.bottom [data-ph="mehr"]'); await L.tap(p, '#app [data-act="goStock"][data-id="inventur"]'); await chk('Inventur, Lagerorte', '#app');
    await L.tap(p, '#app [data-act="phInvLoc"]'); await chk('Inventur, ein Lagerort', '#app');
    await L.tap(p, '.bottom [data-ph="mehr"]'); await L.tap(p, '#app [data-tab="cards"]'); await chk('Rezepte', '#app');
    await p.evaluate(() => go('cards', 'dish_kaiser')); await p.waitForTimeout(300); await chk('Rezept in der Küche', '#app');
    if(!dark && name === 'iPhone SE'){ await L.tap(p, '.bottom [data-ph="heute"]'); const se = await p.evaluate(() => { const rows = [...document.querySelectorAll('#phBoard .hy-row')]; const nav = document.querySelector('.bottom').getBoundingClientRect().top; return {n:rows.length, sichtbar:rows.filter(r => r.getBoundingClientRect().bottom <= nav).length}; });
      L.ok(se.sichtbar >= 5, 'iPhone SE: mindestens fünf der sieben Zeilen stehen ohne Scrollen da', se); await L.shot(p, 'p08-se-heute'); }
    errs.push(...p.errs); await p.context().close();
  }
  // Breiten: 700 Handy, 701 bis 900 wie bisher (alte Leiste mit „Mehr“-Blatt), darüber Laptop
  const {p} = await L.open(b, {vp:{width:700, height:900}});
  L.ok(await p.evaluate(() => document.documentElement.classList.contains('ph') && document.querySelectorAll('.bottom .hy-nav').length === 4), '700 px: Handy-Bedienung');
  await L.tap(p, '.bottom [data-ph="mehr"]');
  await p.setViewportSize({width:820, height:900}); await p.waitForTimeout(350);
  const mid = await p.evaluate(() => ({ph:document.documentElement.classList.contains('ph'), nav:[...document.querySelectorAll('.bottom .nav-i')].map(x => x.textContent.replace(/\u00ad/g, '').trim()), top:getComputedStyle(document.querySelector('.topbar')).display, day:!!document.querySelector('#app .day-sec'), hash:location.hash, old:!!document.querySelector('.bottom [data-act="mehr"]')}));
  L.ok(!mid.ph && mid.nav.join() === 'Heute,Vorbereitung,Rezepte,Ware,Mehr' /* fix-3: Leiste von 701 bis 900 px */ && mid.top !== 'none' && mid.day && mid.old && mid.hash === '#heute', '820 px: alles wie bisher (dunkler Kopf, fünf Ziele, Tagesblatt)', mid);
  await p.click('.bottom [data-act="mehr"]'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => !document.getElementById('mehr').hidden && document.querySelectorAll('#mehr .sheet-i').length >= 5), '820 px: „Mehr“ öffnet weiter das bisherige Blatt'); await p.evaluate(() => mehrClose());
  await p.setViewportSize({width:1280, height:900}); await p.waitForTimeout(350);
  L.ok(await p.evaluate(() => !document.documentElement.classList.contains('ph') && getComputedStyle(document.querySelector('.side')).display !== 'none' && !!document.querySelector('#app .day-sec') && !document.querySelector('[class*="hy-"]:not(#phSheet *)')), '1280 px: Laptop unverändert, keine Handy-Bausteine in der Seite');
  await p.evaluate(() => { location.hash = '#ware/inventur'; }); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => !!document.querySelector('#app [data-act="wtab"]') && !!document.querySelector('#app [data-act="invStart"]')), 'Laptop: Ware mit Reitern, Inventur wie bisher');
  await p.setViewportSize({width:390, height:844}); await p.waitForTimeout(350);
  L.ok(await p.evaluate(() => document.documentElement.classList.contains('ph') && document.getElementById('app').dataset.ph === 'inv' && document.querySelectorAll('.bottom .hy-nav').length === 4 && !document.querySelector('#app [data-act="wtab"]')), 'zurück auf Handybreite: dieselbe Seite in der Handy-Bedienung');
  // Zustand hält beim Neuladen einer Handy-Adresse
  await p.goto(L.URL + '#mehr'); await L.ready(p);
  L.ok(await L.key(p) === 'mehr', 'die Adresse #mehr öffnet am Handy direkt „Mehr“');
  await p.goto(L.URL + '#suchen'); await p.reload(); await L.ready(p);
  L.ok(await L.key(p) === 'such', 'die Adresse #suchen öffnet die Suche');
  await L.done(b, errs.concat(p.errs)); })();
