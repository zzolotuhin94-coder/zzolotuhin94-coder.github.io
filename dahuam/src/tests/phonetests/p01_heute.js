// Heute am Handy: ein Bildschirm, sieben Zeilen, jede führt mit einem Tipp ans Ziel und zurück. Erledigtes rückt grau nach unten. Abends der Tagesabschluss.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.IP13);
  L.ok(await p.evaluate(() => document.documentElement.classList.contains('ph') && document.getElementById('app').dataset.ph === 'heute'), 'am Handy läuft die Handy-Bedienung, Seite „Heute“');
  const g = await p.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; }; const rows = [...document.querySelectorAll('#phBoard .hy-row')]; return {n:rows.length, titles:rows.map(x => x.querySelector('.hy-tm b').textContent), last:Math.round(rows[rows.length - 1].getBoundingClientRect().bottom), nav:Math.round(r('.bottom').top), top:getComputedStyle(document.querySelector('.topbar')).display, sh:document.documentElement.scrollHeight, ih:innerHeight, nums:rows.map(x => x.querySelector('.hy-n').textContent.trim())}; });
  L.ok(g.n === 7, 'sieben Zeilen', g.titles);
  L.ok(JSON.stringify(g.titles) === JSON.stringify(['Bestellen', 'Vorbereitung', 'Öffnen Küche', 'Eigenkontrolle', 'Lieferung heute', 'Im Dienst', 'Apartments']), 'Reihenfolge: Bestellen mit der nächsten Frist zuerst', g.titles);
  L.ok(g.last <= g.nav && g.sh <= g.ih, 'alles passt ohne Scrollen auf einen Bildschirm (iPhone 13)', g);
  L.ok(g.top === 'none', 'kein dunkler Kopf mehr am Handy');
  L.ok(g.nums[0] === 'bis12:00' && g.nums[2] === '0/12' && g.nums[5] === '4', 'Zahl links: Frist, Stand der Liste, Leute im Dienst', g.nums);
  L.ok(/Guten Morgen\. Heute etwa \d+ Portionen\./.test(await L.txt(p, '#app .hy-voice')), 'eine ruhige Zeile begrüßt mit der Prognose', await L.txt(p, '#app .hy-voice'));
  L.ok(await p.evaluate(() => getComputedStyle(document.querySelector('#phBoard .hy-row.now .hy-n')).color !== getComputedStyle(document.querySelector('#phBoard .hy-row:not(.now) .hy-n')).color), 'nur die nächste Frist ist in Messing hervorgehoben');
  L.ok((await L.txt(p, '#phBoard li:nth-child(4)')).includes('Frittieröl seit 2 Tagen fällig') && await p.evaluate(() => !!document.querySelector('#phBoard li:nth-child(4) .hy-bad')), 'Überfälliges steht rot in der Zeile');
  const nav = await p.evaluate(() => [...document.querySelectorAll('.bottom .nav-i')].map(x => x.textContent.trim() + (x.classList.contains('on') ? '*' : '')));
  L.ok(JSON.stringify(nav) === JSON.stringify(['Heute*', 'Suchen', 'Bestellen', 'Mehr']), 'unten vier Ziele: Heute, Suchen, Bestellen, Mehr', nav);
  L.ok((await L.small(p, '#app')).length === 0 && (await L.small(p, '.bottom')).length === 0, 'alle Ziele sind mindestens 44 px groß', (await L.small(p, '#app')).concat(await L.small(p, '.bottom')));
  const ns = await L.noSide(p, 390); L.ok(ns.sw <= 390 && !ns.over.length, 'nichts ragt seitlich hinaus', ns);
  L.ok((await L.contrast(p, '#app')).length === 0, 'Kontrast überall mindestens 4,5:1 (hell)', await L.contrast(p, '#app'));
  // jede Zeile: ein Tipp, richtige Seite, „Heute“ führt zurück
  const want = [['Bestellen', 'ware/bestellen', 'best'], ['Vorbereitung', 'vorbereitung', 'vorb'], ['Öffnen Küche', 'checklisten', 'x'], ['Eigenkontrolle', 'checklisten', 'x'], ['Lieferung heute', 'ware/bestellen', 'x'], ['Im Dienst', 'team/dienstplan', 'x'], ['Apartments', 'apartments/reinigung', 'x']];
  for(const [t, hash, key] of want){
    await p.evaluate(t => [...document.querySelectorAll('#phBoard .hy-row')].find(x => x.querySelector('.hy-tm b').textContent === t).click(), t); await p.waitForTimeout(260);
    const st = await p.evaluate(() => ({h:decodeURIComponent(location.hash.slice(1)), k:document.getElementById('app').dataset.ph, back:(document.querySelector('#app .hy-back, #app .back') || {}).textContent || '', sw:document.documentElement.scrollWidth}));
    L.ok(st.h === hash && st.k === key, `„${t}“ öffnet mit einem Tipp ${hash}`, st);
    L.ok(st.sw <= 390, `„${t}“: Zielseite lässt sich nicht quer schieben`, st.sw);
    if(t === 'Bestellen'){ await L.tap(p, '.bottom [data-ph="heute"]'); }
    else if(/Heute/.test(st.back)){ await L.tap(p, '#app .hy-back'); }
    else { L.ok(/Alle|Checklisten|Bestellungen/.test(st.back), `„${t}“: die Zielseite hat ihren eigenen Zurück-Knopf`, st.back); await p.goBack(); await p.waitForTimeout(300); }
    L.ok(await L.key(p) === 'heute', `von „${t}“ zurück auf Heute`);
  }
  // Zusammenführung mit fix-3/fix-2: „Öl gewechselt“ mit einem Tipp in der Zeile Eigenkontrolle, eingetragen von der Person dieses Geräts, mit Rückgängig
  const n0 = await p.evaluate(() => S.checks.ek.log.length);
  L.ok(await p.evaluate(() => { const b = document.querySelector('#phBoard [data-act="dhOil"]'); const r = b && b.getBoundingClientRect(); return !!b && /Öl gewechselt/.test(b.textContent) && r.height >= 44 && b.closest('li').querySelector('.hy-row .hy-tm b').textContent === 'Eigenkontrolle'; }), 'Eigenkontrolle: „Öl gewechselt“ als eigener Knopf unter der Zeile');
  await L.tap(p, '#phBoard [data-act="dhOil"]');
  const oil = await p.evaluate(() => ({r:S.checks.ek.log[0], n:S.checks.ek.log.length, who:tmWhoName(), toast:document.getElementById('toast').innerText, pill:!!document.querySelector('#phBoard [data-act="dhOil"]'), k:document.getElementById('app').dataset.ph}));
  L.ok(oil.n === n0 + 1 && oil.r.k === 'oil' && oil.r.t === 'wechsel' && oil.r.a === '10:30' && oil.r.b === oil.who && oil.toast.includes(oil.who) && /Rückgängig/.test(oil.toast) && !oil.pill && oil.k === 'heute', 'ein Tipp: Ölwechsel um 10:30 von der Person dieses Geräts, Hinweis mit Rückgängig, der Knopf verschwindet, Heute bleibt', oil);
  await p.click('#toast .toast-act'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(n => S.checks.ek.log.length === n && !!document.querySelector('#phBoard [data-act="dhOil"]'), n0), '„Rückgängig“ nimmt den Ölwechsel zurück');
  // „Schließen …“-Listen zählen erst ab 14 Uhr (fix-3)
  const ck = await p.evaluate(() => { const D = ckToday(); const all = ckDue(D).map(tp => tp.name); const row = [...document.querySelectorAll('#phBoard .hy-row')].find(x => x.dataset.act === 'ckGo'); return {all, m:row.querySelector('.hy-tm small').textContent}; });
  const nMorning = ck.all.filter(x => !/^\s*schlie/i.test(x)).length;
  L.ok(ck.all.length > nMorning && new RegExp('Und ' + (nMorning - 1) + ' weitere').test(ck.m), 'vormittags zählen die „Schließen …“-Listen noch nicht mit', ck);
  // Erledigtes: grau und unten
  await p.evaluate(() => { const D = ckToday(); const c = ckS(); c.runs[D] = c.runs[D] || {}; ckDue(D).forEach(tp => { const r = c.runs[D][tp.id] = c.runs[D][tp.id] || {items:{}}; tp.items.forEach(i => { r.items[i.id] = {a:'10:00', b:'Chef'}; }); }); save(); render(); });
  const d = await p.evaluate(() => [...document.querySelectorAll('#phBoard .hy-row')].map(x => x.querySelector('.hy-tm b').textContent + (x.classList.contains('off') ? ' (grau)' : '')));
  L.ok(d[d.length - 1] === 'Checklisten (grau)' && d.length === 7, 'alle Checklisten erledigt: die Zeile bleibt, grau und ganz unten', d);
  L.ok((await L.contrast(p, '#app')).length === 0, 'auch graue Zeilen sind lesbar (≥ 4,5:1)', await L.contrast(p, '#app'));
  await L.shot(p, 'p01-erledigt');
  await p.context().close();
  // Abend
  const e = await L.open(b, {...L.IP13, at:[2026, 11, 12, 19, 30]});
  const ev = await e.p.evaluate(() => [...document.querySelectorAll('#phBoard .hy-row')].map(x => x.querySelector('.hy-tm b').textContent + (x.classList.contains('off') ? ' (grau)' : '')));
  L.ok(ev.includes('Tagesabschluss') && ev[ev.length - 1] === 'Bestellen (grau)', 'ab 17 Uhr: Zeile „Tagesabschluss“, Bestellen nach Annahmeschluss grau unten', ev);
  L.ok(/Guten Abend/.test(await L.txt(e.p, '#app .hy-voice')), 'abends grüßt die Zeile mit „Guten Abend“');
  const ck2 = await e.p.evaluate(() => { const row = [...document.querySelectorAll('#phBoard .hy-row')].find(x => x.dataset.act === 'ckGo'); return {n:ckDue(ckToday()).filter(tp => !ckProg(tp, ckToday()).full).length, m:row ? row.querySelector('.hy-tm small').textContent : ''}; });
  L.ok(new RegExp('Und ' + (ck2.n - 1) + ' weitere').test(ck2.m), 'abends zählen auch die „Schließen …“-Listen', ck2);
  await L.tap(e.p, '#phBoard [data-act="phAbend"]');
  L.ok(await e.p.evaluate(() => !document.getElementById('phSheet').hidden && !!document.querySelector('#phSheet [data-act="sales"]') && !!document.querySelector('#phSheet [data-act="plKasse"]') && !!document.querySelector('#phSheet [data-act="moveDlg"][data-id="waste"]')), 'Tagesabschluss öffnet ein Blatt: Verkäufe buchen, Kassenbericht importieren (fix-3), Schwund buchen');
  await L.tap(e.p, '#phSheet [data-act="sales"]');
  L.ok(await e.p.evaluate(() => document.getElementById('dlg').open && document.getElementById('phSheet').hidden && /Verkäufe buchen/.test(document.querySelector('#dlgForm h3').textContent)), '„Verkäufe buchen“ öffnet den bekannten Dialog, das Blatt geht zu');
  await e.p.click('#dlgCancel'); await e.p.context().close();
  // Desktop bleibt wie er war
  const k = await L.open(b, L.DESK);
  L.ok(await k.p.evaluate(() => !document.documentElement.classList.contains('ph') && !!document.querySelector('#app .day-sec') && !document.querySelector('#app .hy-row') && document.querySelectorAll('.side .nav-i').length >= 9), 'am Laptop ist Heute unverändert (Tagesblatt, Seitenleiste)');
  await L.done(b, p.errs.concat(e.p.errs, k.p.errs)); })();
