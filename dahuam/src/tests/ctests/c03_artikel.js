// Import Artikel & Preise: Vorschau, Lieferanten anlegen/zuordnen, Gebinde, Bestand, Allergene, ähnliche Namen, erneuter Import, „Preis fehlt“ im Preis-Check.
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  const packs = await p.evaluate(() => [['Sack 10 kg', 'kg'], ['Karton 6×1 l', 'l'], ['Karton 10x250 g', 'kg'], ['Tray 30 Stk', 'Stk'], ['Dose 500 g', 'kg'], ['Kiste 12×1 l', 'l'], ['Kübel 2,5 kg', 'kg'], ['Bund', 'kg'], ['Kiste 24 Stk', 'Stk']].map(([t, u]) => impPack(t, u)));
  L.ok(packs.join() === '10,6,2.5,30,0.5,12,2.5,0,24', 'Gebindegröße aus dem Text: Sack 10 kg, Karton 6×1 l, 10x250 g = 2,5 kg, Tray 30 Stk …', packs);
  // ---------- in den Beispieldaten: vorhandene Artikel und Lieferanten werden erkannt ----------
  await L.openImp(p, 'prod'); await L.upload(p, L.sample('artikel.csv'));
  const d0 = await p.evaluate(() => ({c:impCounts(view.daten.res), sups:view.daten.res.sups, akt:view.daten.res.items.filter(i => i.st === 'akt').map(i => i.title + ' → ' + (i.ex ? i.ex.name : '') + ': ' + i.why), ctl:view.daten.res.items.filter(i => i.ctl).map(i => [i.title, i.ctl.sug && i.ctl.sug.name, i.ctl.value === 'new'])}));
  L.ok(d0.c.fehler === 4 && d0.c.neu + d0.c.akt + d0.c.gleich === 41, 'Artikel-Datei: 41 gültige Zeilen, 4 Fehler', d0.c);
  L.ok(d0.akt.some(x => /^Zwiebel → Zwiebel: Preis/.test(x)) && d0.akt.some(x => /^Mehl glatt → Mehl glatt/.test(x)) && d0.akt.some(x => /^Butter → Butter/.test(x)), 'gleicher Name: vorhandener Artikel wird aktualisiert, die Änderung steht in der Zeile', d0.akt.slice(0, 4));
  L.ok(!d0.sups.includes('Gastro-Großmarkt Inntal') && !d0.sups.includes('Getränke Wildalm') && !d0.sups.includes('Talmolkerei Gerlostal') && d0.sups.join('|') === 'Fleischerei Hörtnagl|Biohof Stern|Fischzucht Zillergrund', 'Lieferanten: drei vorhandene am Namen erkannt, drei werden neu angelegt', d0.sups);
  await p.click('#app [data-act="impBack"]'); await p.waitForTimeout(150); await p.fill('#impPaste', 'Artikel;Einheit;Preis netto\nZwiebeln;kg;1,35\nSardellenfilets;kg;24,00'); await p.click('#app [data-act="impCheck"]'); await p.waitForTimeout(300);
  const d0b = await p.evaluate(() => view.daten.res.items.map(i => [i.title, i.st, i.ctl ? i.ctl.sug && i.ctl.sug.name : '-', i.ctl ? i.ctl.value : '-'].join(':')));
  L.ok(d0b.join('|') === 'Zwiebeln:neu:Zwiebel:new|Sardellenfilets:neu:-:-', 'nur ähnlicher Name („Zwiebeln“ / „Zwiebel“): kein stilles Überschreiben. Vorgabe „als neuer Artikel“, mit Auswahl in der Zeile', d0b);
  // eine ähnliche Zeile von Hand dem vorhandenen Artikel zuordnen, eine andere auslassen
  const pick = await p.evaluate(() => { const it = view.daten.res.items.find(i => i.ctl && i.ctl.sug); return {n:it.n, key:it.ctl.key, sug:it.ctl.sug.id, name:it.ctl.sug.name, title:it.title}; });
  await p.selectOption(`#app select[data-impdec="${pick.key}"]`, pick.sug); await p.waitForTimeout(300);
  const d1 = await p.evaluate(n => { const it = view.daten.res.items.find(i => i.n === n); return {st:it.st, ex:it.ex && it.ex.name, why:it.why}; }, pick.n);
  L.ok((d1.st === 'akt' || d1.st === 'gleich') && d1.ex === pick.name, `„${pick.title}“ von Hand zugeordnet: wird „${pick.name}“ aktualisieren`, d1);
  await p.selectOption(`#app select[data-impdec="${pick.key}"]`, 'skip'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(n => { const it = view.daten.res.items.find(i => i.n === n); return it.skip && /ausgelassen/.test(document.querySelector(`#impList .imp-r[data-n="${n}"] .imp-st`).textContent); }, pick.n), '„nicht übernehmen“: Zeile wird ausgelassen');
  await p.selectOption(`#app select[data-impdec="${pick.key}"]`, 'new'); await p.waitForTimeout(300);
  await p.click('#app [data-act="impBack"]'); await p.waitForTimeout(200);

  // ---------- leerer Betrieb: alles neu ----------
  await p.evaluate(() => { S = leerState(); save(); render(); }); await L.openImp(p, 'prod'); await L.upload(p, L.sample('artikel.csv'));
  const pv = await L.preview(p); const cn = await L.counts(p);
  L.ok(cn.neu === 41 && cn.fehler === 4, 'leerer Betrieb: 41 neu, 4 Fehler', cn);
  const errs = pv.filter(x => x.st === 'fehler').map(x => x.n + ':' + x.why);
  L.ok(errs.join('|') === '42:Name des Artikels fehlt|43:Preis nicht lesbar: „abc“|44:Einheit „g“: bitte den Preis je kg oder je Liter angeben|45:doppelt in der Datei (wie Zeile 4)', 'Fehler je Zeile mit Grund', errs);
  const notes = pv.filter(x => x.notes.length).map(x => x.n + ':' + x.notes.join(' / '));
  L.ok(notes.some(x => /^40:Einheit „Flasche“ wird als Stück geführt/.test(x)) && notes.some(x => /^46:Putzverlust „120“ nicht lesbar \(0 bis 99 %\) \/ Allergen „Q“ unbekannt/.test(x)), 'Hinweise: fremde Einheit wird Stück, unlesbarer Putzverlust und unbekanntes Allergen werden nicht übernommen', notes);
  const row = await p.evaluate(() => document.querySelector('#impList .imp-r[data-n="11"]').innerText.replace(/\s+/g, ' '));
  L.ok(/neu Zeile 11 Butter je kg · Talmolkerei Gerlostal \(neuer Lieferant\) · Nr\. TG-210 · Karton 10x250 g = 2,5 kg · Allergene G € 8,40 Datei: „8,40“/.test(row), 'Zeile der Vorschau: Einheit, Lieferant, Nummer, Gebinde mit gerechneter Größe, Allergene, Preis und Rohwert', row);
  const el = await L.dl(p, () => p.click('#app [data-act="impErrDl"]')); const et = fs.readFileSync(el.file, 'utf8');
  L.ok(/Fehlerliste-Artikel-Preise-/.test(el.name) && /43;Fehler;Preis nicht lesbar: „abc“;Trüffelöl;l;;abc/.test(et) && /40;Hinweis;Einheit „Flasche“/.test(et), 'Fehlerliste mit Originalzeilen', el.name);
  await L.apply(p);
  const a = await p.evaluate(() => { const f = n => S.products.find(x => x.name === n); const bu = f('Butter'), ei = f('Ei M'), mi = f('Milch'), wa = f('Wasser'), cu = f('Currypaste'), ka = f('Karotten'), mw = f('Mineralwasser 0,33 l'), fo = f('Forelle'), pf = f('Pfefferkörner');
    return {out:view.daten.out, n:S.products.length, sups:S.suppliers.map(s => s.name), supOf:supName(bu), bu:[bu.unit, bu.price, bu.artNo, bu.pack, bu.packQty, bu.loc, bu.minStock, bu.stock, bu.alg, bu.priceDemo, bu.priceSrc], ei:[ei.unit, ei.pieceG, ei.lossCold, ei.packQty, ei.stock, prodAlgState(ei)], mi:[mi.packQty, mi.unit], wa:[wa.price, wa.priceDemo, prodAlgState(wa), wa.supplier], cu:prodAlgState(cu), ka:[ka.lossCold, prodAlgState(ka)], mw:[mw.unit, mw.packQty, mw.loc], fo:[fo.unit, fo.pieceG, fo.lossCold, fo.lossHot, fo.alg], pf:pf.packQty,
      moves:S.moves.length, mv:S.moves.find(m => m.pid === bu.id), stockVal:Math.round(stockValue() * 100) / 100, st:stations()[0].metric, imp:S.imports[0].counts}; });
  L.ok(a.out.neu === 41 && a.out.lieferanten === 6 && a.n === 41 && a.sups.length === 6 && a.supOf === 'Talmolkerei Gerlostal', '41 Artikel angelegt, 6 Lieferanten am Namen angelegt und zugeordnet', [a.out, a.sups]);
  L.ok(JSON.stringify(a.bu) === JSON.stringify(['kg', 8.4, 'TG-210', 'Karton 10x250 g', 2.5, 'K', 3, 5, 'G', false, 'Import']), 'Butter: Einheit, Preis netto, Artikelnummer, Gebinde 2,5 kg, Lagerort Kühlhaus, Mindestbestand, Anfangsbestand, Allergen, Preis gilt als bestätigt', a.bu);
  L.ok(JSON.stringify(a.ei) === JSON.stringify(['Stk', 60, 12, 30, 180, 'has']) && a.mi.join() === '12,l' && a.pf === 0.5 && JSON.stringify(a.fo) === JSON.stringify(['Stk', 350, 25, 10, 'D']), 'Ei M: Stück mit 60 g, Putzverlust 12 %, Tray 30; Milch Kiste 12×1 l = 12; Forelle mit Stückgewicht und Garverlust', [a.ei, a.mi, a.fo]);
  L.ok(a.wa.join('|') === '0|false|none|' && a.cu === 'open' && a.ka.join() === '0,open' && a.mw.join() === 'Stk,24,W', 'Wasser: Preis 0 gilt, „keine“ = bestätigt; Currypaste ohne Angabe bleibt „nicht gepflegt“; Karotten ohne den falschen Putzverlust', [a.wa, a.cu, a.ka]);
  L.ok(a.mv && a.mv.type === 'in' && a.mv.qty === 5 && /Anfangsbestand/.test(a.mv.note) && a.moves === 40, 'Anfangsbestand kommt als Wareneingang ins Lager (40 Artikel mit Bestand)', a.moves);
  L.ok(/0 von 6 Lieferanten mit Kontakt/.test(a.st), 'Einrichtung: neue Lieferanten brauchen noch Kontakt und Liefertage', a.st);
  for(const h of ['ware/bestand', 'ware/preise', 'ware/lieferanten', 'ware/bestellen', 'ware/inventur', 'heute']) await L.go(p, h);
  L.ok(p.errs.length === 0, 'Ware-Seiten mit den importierten Artikeln ohne Fehler', p.errs.slice(0, 2));
  // ---------- erneut importieren: unverändert; geänderte Datei: aktualisiert ----------
  await L.openImp(p, 'prod'); await L.upload(p, L.sample('artikel.csv')); const c2 = await L.counts(p);
  L.ok(c2.gleich === 41 && c2.neu === 0 && c2.akt === 0 && c2.fehler === 4, 'dieselbe Datei noch einmal: 41 unverändert (kein Duplikat, kein zweiter Lieferant)', c2);
  await p.click('#app [data-act="impBack"]'); await p.waitForTimeout(150);
  await p.fill('#impPaste', 'Artikelnr;Bezeichnung;EK;Meldebestand\nTG-210;Teebutter;8,95;4\n;Schweinsschnitzel;10,20;\n;Trüffel schwarz;890,00;\n;Schweinsschnitzel (Karree);9,10;'); await p.click('#app [data-act="impCheck"]'); await p.waitForTimeout(300);
  const d3 = await p.evaluate(() => view.daten.res.items.map(i => [i.st, i.title, i.ex ? i.ex.name : '', i.why || '', i.notes.join()].join(' | ')));
  L.ok(/^akt \| Teebutter \| Butter \| Preis € 8,40 → € 8,95 · Mindestbestand/.test(d3[0].replace(/ /g, ' ')), 'gleiche Artikelnummer: Artikel wird trotz anderem Namen erkannt, Preis alt → neu', d3[0]);
  L.ok(/^akt \| Schweinsschnitzel \| Schweinsschnitzel \| Preis € 9,80 → € 10,20/.test(d3[1].replace(/ /g, ' ')) && /^neu \| Trüffel schwarz .*Preis ungewöhnlich hoch/.test(d3[2]) && /^akt \| Schweinsschnitzel \(Karree\) \| Schweinsschnitzel/.test(d3[3]), 'Überschriften „Bezeichnung, EK, Meldebestand“; hoher Preis mit Hinweis; Klammerzusatz zählt als gleicher Artikel', d3);
  await L.apply(p);
  const a3 = await p.evaluate(() => { const bu = S.products.find(x => x.name === 'Butter'); return {pr:bu.price, ms:bu.minStock, name:bu.name, stock:bu.stock, n:S.products.length, undo:!!document.querySelector('#app [data-act="datenUndo"]')}; });
  L.ok(a3.pr === 8.95 && a3.ms === 4 && a3.stock === 5 && a3.n === 42, 'Preis und Mindestbestand aktualisiert, Bestand unberührt, ein Artikel neu', a3);
  await p.click('#app [data-act="datenUndo"]'); await p.waitForTimeout(700);
  L.ok(await p.evaluate(() => S.products.find(x => x.name === 'Butter').price === 8.4 && S.products.length === 41 && S.imports.length === 1), 'Rückgängig: Preise und Artikelliste wie vor dem zweiten Import');
  // ---------- Artikel ohne Preis: „Preis fehlt“ ----------
  await L.openImp(p, 'prod'); await p.fill('#impPaste', 'Artikel\tEinheit\nSchokosauce\tkg\nMarillenmarmelade\tkg'); await p.click('#app [data-act="impCheck"]'); await p.waitForTimeout(300);
  L.ok((await L.preview(p)).every(x => x.st === 'neu' && /ohne Preis: erscheint im Preis-Check als „Preis fehlt“/.test(x.notes.join())), 'Artikel ohne Preis: die Vorschau sagt, was damit geschieht');
  await L.apply(p); await L.go(p, 'ware/preise');
  const pl = await p.evaluate(() => { const pr = S.products.find(x => x.name === 'Schokosauce'); const tr = document.querySelector(`#app tr[data-id="${pr.id}"]`); return {st:tr.querySelector('.st-ref').textContent, confirm:!!tr.querySelector('[data-act="pConfirm"]'), fact:document.querySelector('#app .fact').textContent, btn:document.querySelector('#app .page-h .btn.primary').textContent}; });
  L.ok(pl.st === 'Preis fehlt' && !pl.confirm && /2 Richtwerte noch nicht bestätigt/.test(pl.fact) && /Preis-Check · 2/.test(pl.btn), 'Preisliste: „Preis fehlt“ statt Richtwert, kein „Stimmt“-Knopf', pl);
  await p.click('#app .page-h [data-act="pcStart"]'); await p.waitForTimeout(350);
  const pc = await p.evaluate(() => ({ex:document.querySelector('#app .pc-ex').innerText.replace(/\s+/g, ' '), ok:!!document.querySelector('#app [data-act="pcOk"]'), alg:document.querySelector('#app .pc-alg').innerText}));
  L.ok(/^Preis fehlt — je Kilogramm/.test(pc.ex) && !pc.ok && /Allergene: nicht gepflegt · eintragen/.test(pc.alg), 'Preis-Check: „Preis fehlt“ ohne Richtwert, kein „Richtwert stimmt“; Allergene „nicht gepflegt“ mit „eintragen“', pc);
  await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  L.ok(/noch keinen Preis/.test(await p.evaluate(() => document.querySelector('#pcMsg').textContent)), 'Enter ohne Eingabe: Hinweis, kein stilles Bestätigen von 0');
  await p.fill('#pcIn', '7,40'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => { const x = S.products.find(y => y.price === 7.4); return !!x && x.priceDemo === false; }), 'Preis eingetippt: übernommen und bestätigt');
  await L.done(b, p.errs); })();
