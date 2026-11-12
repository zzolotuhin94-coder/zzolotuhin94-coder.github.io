// Wochenplan als echtes PDF (Seiten wie Blätter, ohne Namen und Codes), Sicherung enthält die Apartments, Beispiele entfernen und
// „Leer starten“, alter Stand ohne Apartments (einmalige Ergänzung), Aufbewahrung 13 Monate, kaputte Daten.
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch();
  { const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
    // ---------- PDF ----------
    await L.ap(p, 'reinigung');
    const html = await ev(() => apPlanPages('2026-11-09').pages.join(''));
    L.ok(/Apartments · KW 46/.test(html) && /Wechseltag, bis 15:00 Uhr/.test(html) && /Wäsche: 8 Sets für 3 Abreisen/.test(html) && !/Familie Berger|Herr Lechner|Huber|Schlüsselbox|1234|5678/.test(html), 'Wochenplan: KW 46, Wechseltag, Wäsche; ohne Gastnamen und ohne Codes', html.length);
    const d = await L.dl(p, () => p.click('#app [data-act="apPdf"]')); const last = await ev(() => window.__apLast);
    L.ok(d.name === 'Wochenplan-Apartments-KW46-2026.pdf' && fs.readFileSync(d.file).slice(0, 5).toString() === '%PDF-' && L.pdfPages(d.file) === 1 && last.pages === 1 && d.size > 20000, 'echte PDF-Datei gespeichert: eine Seite A4', [d.name, d.size, L.pdfPages(d.file)]);
    // viele Apartments: mehrere Blätter, Seitenzahl stimmt
    await ev(() => { const a = apS(); for(let i = 0; i < 14; i++){ const id = 'apt_m' + i; a.apts.push({id, name:'Apartment Test ' + (i + 1), guests:2, beds:2, note:'', color:i % 8}); for(let k = 0; k < 7; k += 2) a.bookings.push({id:'bm' + i + '_' + k, apt:id, from:dAdd('2026-11-09', k - 2), to:dAdd('2026-11-09', k), guest:'', n:2, ch:'direkt', note:'Notiz ' + k, arr:'', src:'hand'}); } save(); render(); });
    const n = await ev(() => apPlanPages('2026-11-09').pages.length);
    const d2 = await L.dl(p, () => p.click('#app [data-act="apPdf"]'));
    L.ok(n >= 2 && L.pdfPages(d2.file) === n && (await ev(() => window.__apLast.pages)) === n, `viele Apartments: ${n} Blätter, PDF hat ${n} Seiten, Kopf auf jedem Blatt`, [n, L.pdfPages(d2.file)]);
    L.ok(await ev(() => apPlanPages('2026-11-09').pages.every((pg, i, all) => pg.includes(`Blatt ${i + 1} von ${all.length}`) && pg.includes('Apartments · KW 46'))), 'jedes Blatt: Kopf und „Blatt x von y“');
    { const el = await ev(() => { const r = apPlanPages('2026-11-09'); document.body.insertAdjacentHTML('beforeend', '<div id="apx" style="position:absolute;left:0;top:0;z-index:99999;background:#888">' + r.pages[0] + '</div>'); return 1; }); void el;
      await (await p.$('#apx .ab-page')).screenshot({path:L.SHOTS + '/wochenplan-a4-blatt1.png'}); await ev(() => document.getElementById('apx').remove()); }
    await ev(() => { const a = apS(); a.apts = a.apts.filter(x => !/^apt_m/.test(x.id)); a.bookings = a.bookings.filter(x => !/^bm/.test(x.id)); save(); });
    // ---------- Sicherung ----------
    await ev(() => { apS().cleans['apt_d2|2026-11-15'] = {who:'Lukas', note:'Fenster', items:{}, hist:[]}; save(); });
    await L.go(p, 'einstellungen'); await L.idle(p);
    const st = await ev(async () => { const d = await __store.read(); return {apts:d.apart.apts.length, bk:d.apart.bookings.length, cl:d.apart.cleans['apt_d2|2026-11-15'].note}; });
    await p.click('#app [data-act=export]'); await p.waitForTimeout(200); const file = (await L.dl(p, () => p.click('#dlBtn'))).file; await L.dlgClose(p);
    const bd = JSON.parse(fs.readFileSync(file, 'utf8'));
    L.ok(st.apts === 3 && st.bk === 6 && st.cl === 'Fenster' && bd.apart && bd.apart.apts.length === 3 && bd.apart.bookings.length === 6 && bd.apart.cleans['apt_d2|2026-11-15'].who === 'Lukas' && bd.apart.settings.list.length === 6, 'Speicher und heruntergeladene Sicherung enthalten Apartments, Buchungen, Reinigungen, Checkliste', [st, file]);
    // Sicherung in einem frischen Gerät laden
    { const {p: q} = await L.open(b, {vp:{width:1280, height:900}}); await q.evaluate(() => { apDemoRemove(); save(); });
      await q.evaluate(t => { loadBackup(JSON.parse(t)); }, fs.readFileSync(file, 'utf8')); await q.waitForTimeout(300);
      L.ok(await q.evaluate(() => S.apart.apts.length === 3 && S.apart.bookings.length === 6 && S.apart.cleans['apt_d2|2026-11-15'].note === 'Fenster'), 'Sicherung geladen: Apartments wieder da');
      await q.context().close(); }
    // ---------- Beispiele entfernen ----------
    await ev(() => { S.apart.apts.push({id:'apt_own', name:'Eigenes Apartment', guests:2, beds:2, note:'', color:4}); S.apart.bookings.push({id:'bk_own', apt:'apt_own', from:'2026-11-20', to:'2026-11-22', guest:'Eigen', n:2, ch:'direkt', note:'', arr:'', src:'hand'}); save(); });
    await L.go(p, 'einstellungen/eigene-daten'); await p.waitForTimeout(200);
    L.ok(await ev(() => !!document.querySelector('#app [data-act="leerApart"]') && document.querySelector('#app [data-act="leerApart"]').textContent === 'nur Beispiel-Apartments entfernen'), 'Eigene Daten: „nur Beispiel-Apartments entfernen“');
    const before = await ev(() => JSON.stringify({m:S.menu, t:S.team.people, p:S.products}));
    await p.click('#app [data-act="leerApart"]'); await p.waitForTimeout(200); await L.submit(p); await p.waitForTimeout(200);
    L.ok(await ev(b0 => S.apart.apts.map(x => x.id).join() === 'apt_own' && S.apart.bookings.map(x => x.id).join() === 'bk_own' && !Object.keys(S.apart.cleans).length && JSON.stringify({m:S.menu, t:S.team.people, p:S.products}) === b0 && !document.querySelector('#app [data-act="leerApart"]'), before), 'entfernt: Beispiel-Apartments mit Buchungen und Reinigungen; Eigenes, Karte, Team, Artikel bleiben');
    L.ok(/Beispiel-Apartments entfernt/.test(await L.toastTxt(p)), 'Meldung mit Rückgängig'); await L.toastUndo(p); await p.waitForTimeout(400);
    L.ok(await ev(() => S.apart.apts.length === 4), 'Rückgängig: Beispiel-Apartments wieder da');
    // Leer starten
    await p.click('#app [data-act="leerAsk"]'); await p.waitForTimeout(200);
    L.ok(/Beispiel-Apartments mit Buchungen/.test(await L.txt(p, '#dlgForm .leer-cols')), '„Leer starten“ sagt, dass die Beispiel-Apartments gehen');
    await L.submit(p); await p.waitForTimeout(300);
    L.ok(await ev(() => S.apart.apts.map(x => x.id).join() === 'apt_own' && S.apart.settings.list.length === 6 && !S.demo), 'Leer starten: Beispiel-Apartments weg, eigenes und die Checkliste bleiben');
    L.ok(p.errs.length === 0, 'keine Fehler', p.errs); await p.context().close(); }
  // ---------- alter Stand ohne Apartments ----------
  { const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
    const old = JSON.parse(fs.readFileSync(__dirname + '/../etests/samples/pre-d2-demo.json', 'utf8'));
    L.ok(old.apart === undefined, 'Beispielstand von 1.4.0: noch ohne Apartments');
    const mg = await ev(o => { const before = JSON.parse(JSON.stringify(o)); const r = migrate(JSON.parse(JSON.stringify(o))); const again = migrate(JSON.parse(JSON.stringify(r)));
      const own = JSON.parse(JSON.stringify(o)); own.demo = false; const r2 = migrate(own);
      return {same:['products', 'menu', 'orders', 'moves', 'suppliers', 'team', 'settings'].filter(k => k !== 'settings' && JSON.stringify(r[k]) !== JSON.stringify(before[k])), apts:r.apart.apts.length, demo:r.apart.apts.every(x => x.demo) && r.apart.bookings.every(x => x.demo), once:JSON.stringify(again.apart) === JSON.stringify(r.apart),
        own:r2.apart.apts.length === 0 && r2.apart.bookings.length === 0 && r2.apart.settings.list.length === 6 && r2.apart.settings.checkin === '15:00'}; }, old);
    L.ok(mg.same.length === 0 && mg.apts === 3 && mg.demo, 'alter Beispielstand lädt unverändert und bekommt einmal die Beispiel-Apartments (als Beispiel markiert)', mg);
    L.ok(mg.once, 'erneutes Laden ändert nichts mehr');
    L.ok(mg.own, 'alter eigener Stand: leerer Bereich mit Checkliste und Check-in 15:00, keine Beispiele');
    L.ok(await ev(o => { const r = migrate(JSON.parse(JSON.stringify(o))); r.apart.apts = []; r.apart.bookings = []; const r2 = migrate(JSON.parse(JSON.stringify(r))); return r2.apart.apts.length === 0; }, old), 'alle Apartments gelöscht: beim nächsten Laden kommen keine Beispiele zurück');
    // kaputte Daten
    L.ok(await ev(o => { const d = JSON.parse(JSON.stringify(o)); d.apart = {apts:[{id:'a', name:'<b>x</b>', guests:'viele', color:99}, null, {name:'ohne id'}], bookings:[{id:'1', apt:'a', from:'2026-11-12', to:'2026-11-10'}, {id:'2', apt:'weg', from:'2026-11-12', to:'2026-11-14'}, {id:'3', apt:'a', from:'2026-11-12', to:'2026-11-14', n:'x', ch:'telefon'}, 5], cleans:{'a|2026-11-14':{done:'ja'}, 'kaputt':{}, 'a|2026-11-15':7}, settings:{checkin:'25:00', list:'nein'}};
      const r = migrate(d); const a = r.apart; return a.apts.length === 1 && a.apts[0].guests === 2 && a.apts[0].color < 8 && a.bookings.length === 1 && a.bookings[0].n === null && a.bookings[0].ch === 'andere' && Object.keys(a.cleans).join() === 'a|2026-11-14' && !a.cleans['a|2026-11-14'].done && a.settings.checkin === '15:00' && Array.isArray(a.settings.list); }, old), 'kaputte Einträge werden aussortiert oder repariert, der Stand lädt');
    L.ok(await ev(o => { const d = JSON.parse(JSON.stringify(o)); d.apart = 'Unsinn'; const r = migrate(d); return r && Array.isArray(r.apart.apts); }, old), 'Bereich ganz kaputt: frisch angelegt, der Rest lädt');
    // Aufbewahrung: 13 Monate nach Abreise
    const keep = await ev(() => { const d = JSON.parse(JSON.stringify(S)); const T = '2026-11-12'; const a = d.apart; a.bookings.push({id:'k1', apt:'apt_d1', from:dAdd(T, -400), to:dAdd(T, -397), guest:'Rand', ch:'direkt'}, {id:'k2', apt:'apt_d1', from:dAdd(T, -402), to:dAdd(T, -398), guest:'Alt', ch:'direkt'});
      a.cleans['apt_d1|' + dAdd(T, -397)] = {who:'A'}; a.cleans['apt_d1|' + dAdd(T, -398)] = {who:'B'}; const r = migrate(d);
      return {k1:r.apart.bookings.some(x => x.id === 'k1'), k2:r.apart.bookings.some(x => x.id === 'k2'), c1:!!r.apart.cleans['apt_d1|' + dAdd(T, -397)], c2:!!r.apart.cleans['apt_d1|' + dAdd(T, -398)], days:AP_KEEP_DAYS}; });
    L.ok(keep.k1 && keep.c1 && !keep.k2 && !keep.c2 && keep.days === 397, 'Aufbewahrung: Buchungen und Reinigungen bis 13 Monate nach der Abreise, danach gelöscht', keep);
    // über den echten Speicher
    await ev(async o => { await __store.replace(o); }, old); await p.reload(); await L.ready(p);
    L.ok(await ev(() => S.apart.apts.length === 3 && !!S.orders.find(o => o.id === 'ord_pre_d2')), 'alter Stand aus dem Speicher geladen und um die Apartments ergänzt');
    for(const h of ['apartments', 'apartments/reinigung', 'apartments/verwalten', 'heute']){ await L.go(p, h); await p.waitForTimeout(80); }
    L.ok(p.errs.length === 0, 'alter Stand: alle Seiten ohne Fehler', p.errs); await p.context().close(); }
  await L.done(b, []); })();
