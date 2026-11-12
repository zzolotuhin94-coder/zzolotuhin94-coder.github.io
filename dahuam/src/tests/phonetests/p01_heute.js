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
  await L.tap(e.p, '#phBoard [data-act="phAbend"]');
  L.ok(await e.p.evaluate(() => !document.getElementById('phSheet').hidden && !!document.querySelector('#phSheet [data-act="sales"]') && !!document.querySelector('#phSheet [data-act="moveDlg"][data-id="waste"]')), 'Tagesabschluss öffnet ein Blatt: Verkäufe buchen, Schwund buchen');
  await L.tap(e.p, '#phSheet [data-act="sales"]');
  L.ok(await e.p.evaluate(() => document.getElementById('dlg').open && document.getElementById('phSheet').hidden && /Verkäufe buchen/.test(document.querySelector('#dlgForm h3').textContent)), '„Verkäufe buchen“ öffnet den bekannten Dialog, das Blatt geht zu');
  await e.p.click('#dlgCancel'); await e.p.context().close();
  // Desktop bleibt wie er war
  const k = await L.open(b, L.DESK);
  L.ok(await k.p.evaluate(() => !document.documentElement.classList.contains('ph') && !!document.querySelector('#app .day-sec') && !document.querySelector('#app .hy-row') && document.querySelectorAll('.side .nav-i').length >= 9), 'am Laptop ist Heute unverändert (Tagesblatt, Seitenleiste)');
  await L.done(b, p.errs.concat(e.p.errs, k.p.errs)); })();
