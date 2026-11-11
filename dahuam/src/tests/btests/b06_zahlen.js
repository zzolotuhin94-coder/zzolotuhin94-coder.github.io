// Dieselbe Zahl an allen Stellen: „ohne Allergenangabe“. Und der Schwund in der Auswertung stimmt mit den Buchungen überein (von Hand gerechnet).
const L = require('./lib');
const eurN = s => +String(s).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  // ---------- Allergene ----------
  // Lage herstellen, in der die Karte von heute weniger zeigt als die ganze Liste: ein Gericht ohne Allergene ausblenden
  await p.evaluate(() => { const m = S.menu.find(x => !hasAlg(x) && !x.hidden); m.hidden = true; save(); });
  /* Paket C: „ohne Allergenangabe“ heißt jetzt auch: Rezeptur vorhanden, aber eine Zutat ist nicht gepflegt. Hier unabhängig nachgerechnet. */
  const want = await p.evaluate(() => { const walk = (x, d) => !x || d > 6 || !x.items.length || x.items.some(it => { const r = refObj(it.ref); if(!r) return true; return r.t === 'p' ? !(algList(r.o.alg).length || r.o.algNone === true) : walk(r.o, d + 1); });
    const open = S.menu.filter(m => { const c = m.card && C(m.card); return c ? walk(c, 0) : !(algList(m.alg).length || m.algNone); }).length; return {all:open, withAlg:S.menu.length - open, fn:noAlgCount()}; });
  L.ok(want.all === want.fn && want.all > 0, 'eine gemeinsame Funktion zählt: ' + want.all + ' Gerichte ohne Allergenangabe', want);
  await L.go(p, 'heute'); const dash = await p.evaluate(() => { const r = [...document.querySelectorAll('#app .rw')].find(x => /ohne Allergenangabe/.test(x.textContent)); return r ? +r.querySelector('.rw-lead').textContent.trim() : null; });
  await L.go(p, 'speisekarte'); const chip = await p.evaluate(() => +document.querySelector('#app [data-act="sec"][data-id="noalg"] small').textContent);
  await p.click('#app [data-act="sec"][data-id="noalg"]'); await p.waitForTimeout(250); const rows = await p.evaluate(() => document.querySelectorAll('#app table.lt-menu tbody tr.row').length);
  await L.go(p, 'speisekarte/gaestekarte'); const guest = await p.evaluate(() => { const n = document.querySelector('#app .alg-miss'); return n ? {txt:n.textContent.replace(/\s+/g, ' '), all:+n.querySelector('b').textContent.match(/\d+/)[0], onCard:+((n.textContent.match(/, (\d+) davon auf dieser Karte/) || [])[1] || NaN)} : null; });
  await L.go(p, 'einrichtung'); const st = await p.evaluate(() => { const s = stations().find(x => x.k === 'menu'); return s.total - s.done; });
  L.ok(dash === want.all && chip === want.all && rows === want.all && guest && guest.all === want.all && st === want.all, 'Heute, Filter „Allergene offen“, gefilterte Liste, Gästekarte und Einrichtung nennen dieselbe Zahl', {dash, chip, rows, guest:guest && guest.all, einrichtung:st, soll:want.all});
  const onCard = await p.evaluate(() => { const d = view.gdate || todayStr(); return guestItems(curSeasonKey(), d).filter(m => !hasAlg(m)).length; });
  L.ok(guest.onCard === onCard && onCard < want.all && /ausgeblendet oder gerade nicht in Saison/.test(guest.txt), 'die Gästekarte sagt dazu, wie viele davon auf der Karte von heute stehen und warum es weniger sind', guest.txt);
  // ---------- Schwund ----------
  await p.evaluate(() => { S.moves = S.moves.filter(m => m.type !== 'waste');
    const add = (pid, qty, price, date, note) => S.moves.unshift({id:uid('mv'), date:date + 'T12:00:00.000Z', type:'waste', pid, qty:-qty, price, note});
    add('butter', 1.5, 8, '2026-03-03', 'Verdorben / abgelaufen');          // 12,00
    add('butter', 0.5, 9, '2026-03-20', 'Bruch');                           //  4,50  → Butter 2 kg, 16,50
    add('cream', 2, 3.2, '2026-03-10', 'Überproduktion');                   //  6,40
    add('egg', 12, 0.3, '2026-03-31', 'Bruch');                             //  3,60
    add('pork', 1, 9.9, '2026-02-28', 'Verdorben / abgelaufen');            // davor: zählt nicht
    add('pork', 2, 9.9, '2026-04-01', 'Verdorben / abgelaufen');            // danach: zählt nicht
    S.moves.unshift({id:uid('mv'), date:'2026-03-05T12:00:00.000Z', type:'out', pid:'butter', qty:-3, price:8, note:'Entnahme'});   // keine Schwund-Buchung
    S.salesDays['2026-03-10'] = [[S.menu[0].id, 10, 110]]; S.salesReal['2026-03-10'] = 1; save(); });
  const w = await p.evaluate(() => { const r = wasteReport('2026-03-01', '2026-03-31'); return {total:r.total, rows:r.rows.map(x => [x.pid, +x.qty.toFixed(3), +x.value.toFixed(2), x.n])}; });
  L.ok(Math.abs(w.total - 26.5) < 1e-9 && JSON.stringify(w.rows) === JSON.stringify([['butter', 2, 16.5, 2], ['cream', 2, 6.4, 1], ['egg', 12, 3.6, 1]]), 'Schwund im März: Butter 2 kg = 16,50 · Schlagobers 2 l = 6,40 · Ei 12 Stk = 3,60 · zusammen 26,50', w);
  await p.evaluate(() => { view.rp = Object.assign(view.rp, {unit:'month', ref:'2026-03-15', tab:'sales', auto:true}); go('report'); }); await p.waitForTimeout(400);
  const ui = await p.evaluate(() => { const s = document.querySelector('#app .rp-waste'); if(!s) return null; return {h:s.querySelector('h2').textContent, sum:s.querySelector('tfoot td.r:not(:empty)') ? [...s.querySelectorAll('tfoot td')].map(x => x.textContent).filter(Boolean) : [], rows:[...s.querySelectorAll('tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim())), head:s.querySelector('.panel-h .muted').textContent}; });
  L.ok(ui && ui.h === 'Schwund' && ui.rows.length === 3 && ui.rows[0][0] === 'Butter' && eurN(ui.rows[0][2]) === 16.5 && /^2/.test(ui.rows[0][1]) && eurN(ui.rows[1][2]) === 6.4 && eurN(ui.rows[2][2]) === 3.6, 'der Block „Schwund“ zeigt je Artikel Menge und Wert', ui && ui.rows);
  L.ok(ui && eurN(ui.sum[ui.sum.length - 1]) === 26.5 && /26,50/.test(ui.head) && /Verdorben/.test(ui.rows[0][3]) && /Bruch/.test(ui.rows[0][3]), 'Summe 26,50 und die Gründe stehen dabei', ui && [ui.sum, ui.head, ui.rows[0][3]]);
  const pct = await p.evaluate(() => { const r = rpRange(view.rp); const c = report(r.from, r.to); return 26.5 / c.net * 100; });
  L.ok(new RegExp(pct.toLocaleString('de-DE', {maximumFractionDigits:1}).replace('.', '\\.') + ' % vom Umsatz').test(ui.head), 'Anteil am Umsatz netto stimmt', [ui.head, pct]);
  // ein Monat ohne Schwund
  await p.evaluate(() => { view.rp.ref = '2026-02-10'; S.salesDays['2026-02-10'] = [[S.menu[0].id, 5, 55]]; S.moves = S.moves.filter(m => !(m.type === 'waste' && m.date.startsWith('2026-02'))); render(); }); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => /kein Schwund gebucht/.test((document.querySelector('#app .rp-waste') || {textContent:''}).textContent)), 'ohne Schwund im Zeitraum: ein Satz statt einer leeren Tabelle');
  // Zeiträume und Entferntes
  const units = await p.evaluate(() => [...document.querySelectorAll('#app .rp-units button')].map(x => x.textContent.trim()).join('|'));
  L.ok(units === 'Woche|Monat|Saison|Jahr|Von–Bis', 'Zeiträume: Woche · Monat · Saison · Jahr · Von–Bis', units);
  L.ok(await p.evaluate(() => !document.querySelector('#app .rp-matrix') && !/Menü-Matrix|Quartal|Halbjahr/.test(document.querySelector('#app').textContent) && !document.querySelector('#app .tiles')), 'keine Menü-Matrix, kein Quartal/Halbjahr, keine Kachelreihe');
  L.ok(await p.evaluate(() => { const t = document.querySelector('#app').textContent; return /Renner und Ladenhüter/.test(t) && !!document.querySelector('#app table.rp-items') && !!document.querySelector('#app [data-act="rpCsv"]') && !!document.querySelector('#app [data-act="rpTab"][data-id="import"]'); }), 'Renner und Ladenhüter, Artikel-Tabelle, CSV und Kassen-Import sind da');
  // alter gemerkter Zeitraum „Quartal“ stört nicht
  await p.evaluate(() => { view.rp.unit = 'quarter'; render(); }); await p.waitForTimeout(200); L.ok(await p.evaluate(() => !!document.querySelector('#app .rp-label')), 'ein früher gewähltes „Quartal“ wird als Monat gezeigt');
  await L.done(b, p.errs); })();
