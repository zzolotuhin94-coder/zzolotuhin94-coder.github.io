// Mehr: alles Übrige in ruhigen Gruppen, jede Zeile mit einem Stand. Laptop-Arbeit steht unten, erreichbar, aber aus dem Weg.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.IP13);
  await L.tap(p, '.bottom [data-ph="mehr"]');
  const g = await p.evaluate(() => ({h:location.hash, k:document.getElementById('app').dataset.ph, grp:[...document.querySelectorAll('#app > .hy-grp')].map(u => [...u.querySelectorAll('.hy-mr')].map(x => x.querySelector('span').textContent + (x.querySelector('.hy-e').textContent ? ' | ' + x.querySelector('.hy-e').textContent : ''))), lap:document.querySelector('#app .hy-lap h2').textContent, open:!!document.querySelector('#app .hy-lapl'), old:!!document.querySelector('#mehr:not([hidden])')}));
  L.ok(g.h === '#mehr' && g.k === 'mehr' && !g.old, '„Mehr“ ist eine eigene Seite (#mehr), kein Blatt mehr');
  L.ok(JSON.stringify(g.grp[0]) === JSON.stringify(['Rezepte | 26', 'Speisekarte | Allergene nachsehen', 'Checklisten | 7 offen']), 'Gruppe Küche mit Stand', g.grp[0]);
  L.ok(JSON.stringify(g.grp[1]) === JSON.stringify(['Bestand | 9 unter Mindest', 'Inventur | zuletzt 12.10.', 'Wareneingang | 1 heute']), 'Gruppe Ware mit Stand', g.grp[1]);
  L.ok(JSON.stringify(g.grp[2]) === JSON.stringify(['Dienstplan | 4 im Dienst', 'Apartments | 2 von 3 belegt', 'Einstellungen | Chef', 'Anleitung', 'Dunkles Design']), 'Gruppe Haus mit Stand', g.grp[2]);
  L.ok(g.lap === 'Am Laptop geht das besser' && !g.open, 'unten: „Am Laptop geht das besser“, zugeklappt');
  L.ok((await L.small(p, '#app')).length === 0 && (await L.contrast(p, '#app')).length === 0, 'Ziele ≥ 44 px, Kontrast ≥ 4,5:1', (await L.small(p, '#app')).concat(await L.contrast(p, '#app')));
  const ns = await L.noSide(p, 390); L.ok(ns.sw <= 390 && !ns.over.length, 'nichts ragt seitlich hinaus', ns);
  // jedes Ziel: richtige Seite, Zurück heißt „Mehr“
  const want = [['Rezepte', 'rezepte', 'rez'], ['Speisekarte', 'speisekarte/service', 'x'], ['Checklisten', 'checklisten', 'x'], ['Bestand', 'ware/bestand', 'bestand'], ['Inventur', 'ware/inventur', 'inv'], ['Dienstplan', 'team/dienstplan', 'x'], ['Apartments', 'apartments', 'x'], ['Einstellungen', 'einstellungen', 'x']];
  for(const [t, hash, key] of want){
    await p.evaluate(t => [...document.querySelectorAll('#app > .hy-grp .hy-mr')].find(x => x.querySelector('span').textContent === t).click(), t); await p.waitForTimeout(280);
    const st = await p.evaluate(() => ({h:decodeURIComponent(location.hash.slice(1)), k:document.getElementById('app').dataset.ph, back:(document.querySelector('#app .hy-back') || {}).textContent || '', on:document.querySelector('.bottom .nav-i.on').textContent.trim(), sw:document.documentElement.scrollWidth, tabs:[...document.querySelectorAll('#app > .toolbar.tabs')].filter(x => getComputedStyle(x).display !== 'none' && x.querySelector('[data-act="wtab"],[data-act="ttab"]')).length}));
    L.ok(st.h === hash && st.k === key && st.back === 'Mehr' && st.on === 'Mehr', `„${t}“ öffnet ${hash}, Zurück heißt „Mehr“, unten bleibt „Mehr“ markiert`, st);
    L.ok(st.sw <= 390 && st.tabs === 0, `„${t}“: nichts quer zu schieben, keine Reiter von Ware oder Team`, st);
    await L.tap(p, '#app .hy-back'); L.ok(await L.key(p) === 'mehr', `von „${t}“ zurück auf Mehr`);
  }
  // Wareneingang als Blatt
  await L.tap(p, '#app [data-act="phWe"]');
  L.ok(await p.evaluate(() => !document.getElementById('phSheet').hidden && document.querySelectorAll('#phSheet [data-act="ordRecv"]').length === 2 && !!document.querySelector('#phSheet [data-act="moveDlg"][data-id="in"]')), 'Wareneingang: Blatt mit den erwarteten Lieferungen und „Lieferung ohne Bestellung“');
  await L.tap(p, '#phSheet [data-act="ordRecv"]');
  L.ok(await p.evaluate(() => document.getElementById('phSheet').hidden && view.recv && !!document.querySelector('#app [data-act="rBook"]')), 'eine Lieferung antippen öffnet den Wareneingang, das Blatt geht zu');
  await L.tap(p, '.bottom [data-ph="mehr"]');
  await L.tap(p, '#app [data-act="wlOpen"]');
  L.ok(await p.evaluate(() => !!document.querySelector('.wl.in')), '„Anleitung“ öffnet die Willkommensseite mit den Schritten');
  await p.evaluate(() => { const x = document.querySelector('.wl [data-act="wlClose"], .wl .btn.primary'); if(x) x.click(); }); await p.waitForTimeout(400);
  L.ok(await p.evaluate(() => !document.querySelector('.wl.in')) && await L.key(p) === 'mehr', 'und schließt wieder auf „Mehr“');
  // Design
  await L.tap(p, '#app [data-act="phTheme"]');
  L.ok(await p.evaluate(() => document.documentElement.dataset.theme === 'dark' && /Helles Design/.test(document.querySelector('#app [data-act="phTheme"]').textContent)), '„Dunkles Design“ schaltet um, die Zeile heißt dann „Helles Design“');
  L.ok((await L.contrast(p, '#app')).length === 0, 'Kontrast auch dunkel ≥ 4,5:1', await L.contrast(p, '#app'));
  await L.tap(p, '#app [data-act="phTheme"]');
  // Laptop-Liste
  await L.tap(p, '#app [data-act="phLap"]');
  const lap = await p.evaluate(() => [...document.querySelectorAll('#app .hy-lapl .hy-mr span:first-of-type')].map(x => x.textContent));
  L.ok(JSON.stringify(lap) === JSON.stringify(['Speisekarte und Kalkulation', 'Gästekarte gestalten', 'Saison und Aktionen', 'Preise', 'Lieferanten', 'Buchungen', 'Auswertung', 'Eigene Daten einlesen', 'Einrichtung']), '„Hier öffnen“ klappt die Laptop-Arbeit auf', lap);
  const lw = [['Speisekarte und Kalkulation', 'speisekarte'], ['Gästekarte gestalten', 'speisekarte/gaestekarte'], ['Saison und Aktionen', 'speisekarte/saison'], ['Preise', 'ware/preise'], ['Lieferanten', 'ware/lieferanten'], ['Buchungen', 'ware/buchungen'], ['Auswertung', 'team/auswertung'], ['Eigene Daten einlesen', 'einstellungen/eigene-daten'], ['Einrichtung', 'einrichtung']];
  for(const [t, hash] of lw){
    await p.evaluate(t => [...document.querySelectorAll('#app .hy-lapl .hy-mr')].find(x => x.querySelector('span').textContent === t).click(), t); await p.waitForTimeout(450);
    const st = await p.evaluate(() => ({h:decodeURIComponent(location.hash.slice(1)), back:(document.querySelector('#app .hy-back') || {}).textContent || '', sw:document.documentElement.scrollWidth}));
    const own = await p.evaluate(() => (document.querySelector('#app .back') || {}).textContent || '');
    L.ok(st.h === hash && st.sw <= 390 && (st.back === 'Mehr' || /Einstellungen|Heute/.test(own)), `Laptop-Arbeit „${t}“ ist erreichbar (${hash}), mit Zurück (zu „Mehr“ oder, bei Eigene Daten und Einrichtung, der eigene der Seite)`, {...st, own});
    if(st.back === 'Mehr') await L.tap(p, '#app .hy-back'); else await L.tap(p, '.bottom [data-ph="mehr"]');
    L.ok(await p.evaluate(() => !!document.querySelector('#app .hy-lapl')), `zurück von „${t}“: die Liste ist noch offen`);
  }
  // Beispieldaten-Zeile
  L.ok(/Beispieldaten/.test(await L.txt(p, '#app .hy-demo')), 'die Zeile „Beispieldaten · eigene Daten“ steht unter Mehr');
  await L.done(b, p.errs); })();
