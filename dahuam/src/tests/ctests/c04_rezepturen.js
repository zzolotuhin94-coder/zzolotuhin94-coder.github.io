// Import Rezepturen (eine Zeile je Zutat): Zuordnung, Küchenmaße, Kreisbezug, Verknüpfung, Schritte, Wareneinsatz gegen von Hand gerechnete Werte; dazu „Rezeptur einfügen“ auf der Rezeptseite.
const L = require('./lib'); const fs = require('fs');
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
// Von Hand gerechnet aus artikel.csv (Preise netto) und rezepturen.csv:
// Rindsuppe (Charge 8000 g): 3 kg Knochen × 2,40 = 7,20 · 0,8 kg Suppengemüse × 1,90 = 1,52 · 0,4 kg Zwiebel × 1,20 = 0,48 · Wasser 0 · 2 EL Salz = 30 g × 0,60/kg = 0,018 · 1 TL Pfeffer = 5 g × 22/kg = 0,11  → 9,328
// Palatschinkenteig (1200 g): 0,4 × 0,89 = 0,356 · 0,75 l × 1,05 = 0,7875 · 4 Eier × 0,27 = 1,08 · 1 Prise Salz = 0,5 g → 0,0003 · 0,04 × 8,40 = 0,336  → 2,5598
// Frittatensuppe: 300 g Suppe = 300 × 9,328 / 8000 = 0,3498 · 60 g Teig = 60 × 2,5598 / 1200 = 0,12799 · 1 TL Schnittlauch = 5 g × 14/kg = 0,07  → 0,54779 ; Preis 6,50 / 1,10 = 5,909091 netto → 9,2703 %
// Eispalatschinke: 120 g Teig = 0,25598 · 100 ml Eis × 6,50/l = 0,65 · Schokosauce (neu, ohne Preis) 0  → 0,90598
// Schnitzel: 0,18 × 9,80 = 1,764 · 0,015 × 0,89 = 0,01335 · 0,5 Ei = 0,135 · 0,04 × 2,40 = 0,096 · 2 EL Butterschmalz = 30 g → 0,345 · 0,25 × 0,95 = 0,2375 · ¼ Zitrone = 0,0875 · Prise Salz 0,0003  → 2,67865 ; 18,90 / 1,10 = 17,181818 → 15,5900 %
// Käsespätzle (für 10 Portionen, je Portion): 200 g Mehl 0,178 · 2 Eier 0,54 · 150 g Bergkäse 2,625 · 100 g Zwiebel 0,12 · 30 g Butter 0,252 · 4,5 g Salz 0,0027  → 3,7177
// Gemüsecurry: 150 ml Kokosmilch 0,48 · 50 g Zwiebel 0,06 · 80 g Reis 0,232 = 0,772 ; mit Limette 30 g × 4,50/kg = 0,135 → 0,907
const WANT = {Rindsuppe:9.328, Palatschinkenteig:2.5598, Frittatensuppe:0.54779, Eispalatschinke:0.90598, 'Schnitzel Schwein':2.67865, 'Käsespätzle':3.7177, 'Gemüsecurry':0.907};
const prep = async p => { await p.evaluate(() => { S = leerState(); save(); render(); });
  await L.openImp(p, 'prod'); await L.upload(p, L.sample('artikel.csv')); await L.apply(p);
  await L.openImp(p, 'menu'); await L.upload(p, L.sample('speisekarte.csv')); await L.apply(p); };
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  // ---------- Küchenmaße und Umrechnung ----------
  const cv = await p.evaluate(() => { const kg = {t:'p', o:{unit:'kg', pieceG:''}}, l = {t:'p', o:{unit:'l', pieceG:''}}, stk = {t:'p', o:{unit:'Stk', pieceG:60}}, stk0 = {t:'p', o:{unit:'Stk', pieceG:''}}, kgP = {t:'p', o:{unit:'kg', pieceG:110}}, br = {t:'c', o:{}};
    const f = (q, u, r, ov) => { const x = recConvert(q, u, r, ov); return x.err ? 'ERR' : x.qty + x.tu; };
    return [f(180, 'g', kg), f(1.5, 'kg', kg), f(750, 'ml', l), f(2, 'l', l), f(2, 'EL', kg), f(1, 'TL', kg), f(1, 'Prise', kg), f(3, 'EL', l), f(4, 'Stk', stk), f(120, 'g', stk), f(2, 'Stk', kgP), f(2, 'Stk', kg), f(50, 'g', stk0), f(300, 'ml', br), f(1, 'Stk', br), f(5, '', kg), f(2, '', stk), f(1, 'Handvoll', kg), f(2, 'Stk', kg, 35), f(1, 'dl', l), f(2, 'Zehen', kg)]; });
  L.ok(cv.join('|') === '180g|1500g|750ml|2000ml|30g|5g|0.5g|45ml|4Stk|2Stk|220g|ERR|ERR|300g|ERR|5g|2Stk|ERR|35g|100ml|10g', 'Umrechnung: g, kg, ml, l, dl; EL 15, TL 5, Prise 0,5, Zehe 5; Stück mit Stückgewicht in beide Richtungen; ohne Stückgewicht Fehler; Wert von Hand gilt', cv);
  const ps = await p.evaluate(() => ['180 g Schweinerücken', '12g Mehl', '0,35 Stk Ei M', '2 EL Butterschmalz', '1 Prise Salz', '• 1/2 Zitrone', 'Petersilie 3 g', '1,5 kg Erdäpfel, mehlig', 'Salz', '½ TL Kümmel', 'ca. 200 ml Schlagobers'].map(x => { const r = recParseLine(x); return [r.qtyRaw, r.unitRaw, r.name].join('~'); }));
  L.ok(ps.join('|') === '180~g~Schweinerücken|12~g~Mehl|0,35~Stk~Ei M|2~EL~Butterschmalz|1~Prise~Salz|1/2~~Zitrone|3~g~Petersilie|1,5~kg~Erdäpfel, mehlig|~~Salz|½~TL~Kümmel|200~ml~Schlagobers', 'Textzeilen „Menge Einheit Zutat“ (auch „Zutat Menge Einheit“, Brüche, „ca.“)', ps);

  // ---------- Vorbereitung: leerer Betrieb, Artikel und Karte aus den Beispieldateien ----------
  await prep(p);
  await L.openImp(p, 'rec'); await L.upload(p, L.sample('rezepturen.csv'));
  const pv = await L.preview(p); const cn = await L.counts(p);
  L.ok(cn.neu === 7 && cn.fehler === 3 && cn.akt === 0, 'Rezeptur-Datei: 7 Rezepturen neu, 3 Fehler (zwei mit Kreisbezug, eine Zeile ohne Rezeptur)', cn);
  const kr = pv.filter(x => x.st === 'fehler').map(x => x.title + ': ' + x.why);
  L.ok(/^Bratensaft: Kreisbezug: Bratensaft → Kalbsfond → Bratensaft\. Ein Basisrezept kann sich nicht selbst enthalten\.$/.test(kr[0]) && /^Kalbsfond: Kreisbezug: Kalbsfond → Bratensaft → Kalbsfond/.test(kr[1]) && /Zeile ohne Rezeptur/.test(kr[2]), 'Kreisbezug wird abgelehnt und benannt; die anderen Rezepturen laufen weiter', kr);
  const um = await p.evaluate(() => ({list:view.daten.res.unmatched.map(u => [u.name, u.kind, u.dec.replace(/p:.*/, 'p')].join(':')), html:document.querySelector('#impUm').innerText.replace(/\s+/g, ' '), fuzzy:view.daten.res.unmatched.find(u => u.kind === 'fuzzy').auto.o.name}));
  L.ok(um.list.join('|') === 'Schokosauce:none:new|Zwiebeln:fuzzy:p' && um.fuzzy === 'Zwiebel' && /^1 Zutat nicht gefunden Ohne Zuordnung legt die App einen neuen Artikel ohne Preis an\. Er erscheint im Preis-Check als „Preis fehlt“\. Schokosauce 1× · Eispalatschinke/.test(um.html) && /1 Zutat mit ähnlichem Namen zugeordnet, bitte prüfen/.test(um.html), 'klare Liste: „Schokosauce“ nicht gefunden (neu anlegen, zuordnen oder auslassen); „Zwiebeln“ ähnlich wie „Zwiebel“ zur Prüfung', um);
  const lines = await p.evaluate(() => { const o = {}; view.daten.res.order.forEach(rc => rc.lines.forEach(l => { o[rc.name + '/' + l.name] = [l.st, l.st === 'ok' ? l.qty + l.cv.tu : l.msg, l.cv && l.cv.how || '', l.f ? (l.f.t === 'c' ? 'BR:' : '') + l.f.o.name : ''].join('~'); })); return o; });
  L.ok(lines['Rindsuppe/Salz'] === 'ok~30g~2 EL ≈ 30 g~Salz' && lines['Rindsuppe/Pfefferkörner'] === 'ok~5g~1 TL ≈ 5 g~Pfefferkörner' && lines['Palatschinkenteig/Salz'] === 'ok~0.5g~1 Prise ≈ 0,5 g~Salz' && lines['Rindsuppe/Wasser'] === 'ok~10000ml~10 l = 10.000 ml~Wasser', 'EL, TL, Prise: die Vorschau zeigt den Richtwert in Gramm', [lines['Rindsuppe/Salz'], lines['Palatschinkenteig/Salz']]);
  L.ok(lines['Frittatensuppe/Rindsuppe'].startsWith('ok~300g~') && /BR:Rindsuppe$/.test(lines['Frittatensuppe/Rindsuppe']) && /BR:Palatschinkenteig$/.test(lines['Frittatensuppe/Palatschinkenteig']) && /BR:Palatschinkenteig$/.test(lines['Eispalatschinke/Palatschinkenteig']), 'Basisrezepte aus derselben Datei werden als Zutat erkannt (Palatschinkenteig in zwei Gerichten)');
  L.ok(lines['Käsespätzle/Mehl glatt'].startsWith('ok~200g') && lines['Käsespätzle/Ei M'].startsWith('ok~2Stk') && lines['Käsespätzle/Salz'].startsWith('ok~4.5g') && /für 10 Portionen geschrieben: Mengen durch 10 geteilt/.test(pv.find(x => x.title === 'Käsespätzle').notes.join()), '„Portionen 10“: Mengen werden auf eine Portion geteilt, die Vorschau sagt es', lines['Käsespätzle/Mehl glatt']);
  L.ok(lines['Gemüsecurry/Limette'] === 'fehler~Stück lässt sich nicht in g umrechnen: Stückgewicht fehlt~~Limette' && lines['Gemüsecurry/Currypaste'].startsWith('fehler~Menge fehlt') && lines['Gemüsecurry/Zwiebeln'].endsWith('~Zwiebel') && /2 Zeilen mit Fehler werden ausgelassen/.test(pv.find(x => x.title === 'Gemüsecurry').notes.join()), 'Zeilen mit Fehler (Stück ohne Stückgewicht, Menge fehlt) halten den Rest nicht auf', [lines['Gemüsecurry/Limette'], lines['Gemüsecurry/Currypaste']]);
  const link = await p.evaluate(() => view.daten.res.order.filter(rc => rc.type === 'dish').map(rc => { const m = S.menu.find(x => x.id === rc.link); return rc.name + '→' + (m ? dishLabel(m) : '') + (rc.linkAuto ? ' (auto)' : ''); }));
  L.ok(link.join('|') === 'Frittatensuppe→Frittatensuppe (auto)|Eispalatschinke→Eispalatschinke (auto)|Schnitzel Schwein→Wiener Schnitzel · vom Schwein (auto)|Käsespätzle→Käsespätzle (auto)|Gemüsecurry→Gemüsecurry (auto)', 'Verknüpfung: gleicher Name wird von selbst verknüpft, Spalte „Gericht auf der Karte“ führt zur Variante', link);
  L.ok(await p.evaluate(() => view.daten.res.order.find(rc => rc.name === 'Rindsuppe').steps.length === 2 && view.daten.res.order.find(rc => rc.name === 'Schnitzel Schwein').steps.length === 2 && view.daten.res.order.find(rc => rc.name === 'Rindsuppe').yieldG === 8000 && view.daten.res.order.find(rc => rc.name === 'Frittatensuppe').yieldG === 330), 'Zubereitungsschritte aus dem zweiten Abschnitt der Datei, Ausbeute und Portionsgewicht gelesen');
  // Menge von Hand: Limette 30 g
  const ln = await p.evaluate(() => view.daten.res.order.find(rc => rc.name === 'Gemüsecurry').lines.find(l => l.name === 'Limette').n);
  await p.fill(`#app input[data-impq="${ln}"]`, '30'); await p.keyboard.press('Tab'); await p.waitForTimeout(350);
  const ov = await p.evaluate(() => { const rc = view.daten.res.order.find(x => x.name === 'Gemüsecurry'); const l = rc.lines.find(x => x.name === 'Limette'); return {st:l.st, qty:l.qty, how:l.cv.how, open:document.querySelector(`#impList .imp-rec[data-n="${rc.n}"] details`).open, val:document.querySelector(`#app input[data-impq="${l.n}"]`).value}; });
  L.ok(ov.st === 'ok' && ov.qty === 30 && ov.how === 'von Hand' && ov.open && ov.val === '30', 'Gramm von Hand eingetragen: die Zeile gilt, die Rezeptur bleibt aufgeklappt', ov);
  // EL-Richtwert überschreiben und wieder leeren
  const sl = await p.evaluate(() => view.daten.res.order.find(rc => rc.name === 'Schnitzel Schwein').lines.find(l => l.name === 'Butterschmalz').n);
  await p.evaluate(() => { view.daten.open = view.daten.res.order.find(rc => rc.name === 'Schnitzel Schwein').key; render(); }); await p.waitForTimeout(200);
  await p.fill(`#app input[data-impq="${sl}"]`, '26'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => view.daten.res.order.find(rc => rc.name === 'Schnitzel Schwein').lines.find(l => l.name === 'Butterschmalz').qty === 26), 'Richtwert für 2 EL (30 g) lässt sich überschreiben');
  await p.fill(`#app input[data-impq="${sl}"]`, ''); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => view.daten.res.order.find(rc => rc.name === 'Schnitzel Schwein').lines.find(l => l.name === 'Butterschmalz').qty === 30), 'Feld geleert: wieder der Richtwert');
  // nicht gefundene Zutat: auslassen → zuordnen → neu
  const uk = await p.evaluate(() => view.daten.res.unmatched.find(u => u.name === 'Schokosauce').key);
  await p.selectOption(`#impUm select[data-impdec="${uk}"]`, 'skip'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => { const l = view.daten.res.order.find(rc => rc.name === 'Eispalatschinke').lines.find(x => x.name === 'Schokosauce'); return l.st === 'skip' && !!document.querySelector('#impUm'); }), '„Zeile auslassen“: die Zutat fällt weg, die Entscheidung bleibt in der Liste änderbar');
  const van = await p.evaluate(() => 'p:' + S.products.find(x => x.name === 'Vanilleeis').id);
  await p.selectOption(`#impUm select[data-impdec="${uk}"]`, van); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => { const l = view.daten.res.order.find(rc => rc.name === 'Eispalatschinke').lines.find(x => x.name === 'Schokosauce'); return l.st === 'ok' && l.f.o.name === 'Vanilleeis' && l.cv.tu === 'ml' && !!view.daten.res.unmatched.find(u => u.name === 'Schokosauce'); }), '„vorhandenem Artikel zuordnen“: Zeile rechnet mit dem gewählten Artikel');
  await p.selectOption(`#impUm select[data-impdec="${uk}"]`, 'new'); await p.waitForTimeout(300);
  // Fehlerliste
  const el = await L.dl(p, () => p.click('#app [data-act="impErrDl"]')); const et = fs.readFileSync(el.file, 'utf8');
  L.ok(/Fehlerliste-Rezepturen-/.test(el.name) && /Kreisbezug: Bratensaft → Kalbsfond → Bratensaft/.test(et) && /Gemüsecurry: Menge fehlt;Gemüsecurry;Gericht;Currypaste/.test(et) && /Zeile ohne Rezeptur/.test(et), 'Fehlerliste nennt Rezeptur-Fehler und einzelne Zeilen', el.name);
  // ---------- übernehmen ----------
  await L.apply(p);
  const a = await p.evaluate(() => ({out:view.daten.out, cards:Object.fromEntries(S.cards.map(c => [c.name, {type:c.type, n:c.items.length, y:c.yieldG, steps:(c.steps || []).map(s => s.t), cost:totals(c).cost, cat:c.category, no:c.no}])), links:Object.fromEntries(S.menu.filter(m => m.card).map(m => [dishLabel(m), {card:C(m.card).name, fc:menuCalc(m).fc, net:menuCalc(m).netPrice, cost:menuCalc(m).cost}])), newP:S.products.filter(x => x.priceDemo).map(x => [x.name, x.unit, x.price, prodAlgState(x)].join(':')), hint:document.querySelector('#app .imp-done').innerText}));
  L.ok(a.out.neu === 7 && a.out.fehler === 3 && a.out.artikel === 1 && a.out.verknuepft === 5 && Object.keys(a.cards).length === 7 && !a.cards.Bratensaft && !a.cards.Kalbsfond, '7 Rezepturen angelegt, die zwei mit Kreisbezug nicht; 1 neuer Artikel, 5 Gerichte verknüpft', a.out);
  for(const [n, w] of Object.entries(WANT)) L.ok(near(a.cards[n].cost, w), `Wareneinsatz ${n}: ${w.toFixed(5).replace('.', ',')} € wie von Hand gerechnet`, a.cards[n].cost);
  L.ok(near(a.links['Frittatensuppe'].net, 6.5 / 1.1) && near(a.links['Frittatensuppe'].fc, 0.54779 / (6.5 / 1.1) * 100) && near(a.links['Frittatensuppe'].fc, 9.27029, 1e-4), 'Frittatensuppe: 6,50 inkl. 10 % → 5,9091 netto → Wareneinsatz 9,27 %', a.links['Frittatensuppe']);
  L.ok(a.links['Wiener Schnitzel · vom Schwein'].card === 'Schnitzel Schwein' && near(a.links['Wiener Schnitzel · vom Schwein'].fc, 2.67865 / (18.9 / 1.1) * 100) && near(a.links['Wiener Schnitzel · vom Schwein'].fc, 15.59002, 1e-4), 'Wiener Schnitzel vom Schwein: verknüpft, Wareneinsatz 15,59 %', a.links['Wiener Schnitzel · vom Schwein']);
  L.ok(a.cards.Rindsuppe.type === 'semi' && a.cards.Rindsuppe.y === 8000 && a.cards.Rindsuppe.cat === 'Basisrezepte' && a.cards.Rindsuppe.steps.join('|') === 'Knochen kalt aufsetzen, aufkochen, abschäumen.|Gemüse und angeröstete Zwiebel zugeben, 3 Stunden leise köcheln, abseihen.' && a.cards.Frittatensuppe.cat === 'Suppen' && a.cards.Frittatensuppe.y === 330 && a.cards['Gemüsecurry'].n === 4, 'Typ, Ausbeute, Kategorie, Schritte, Portionsgewicht; Gemüsecurry mit 4 Zeilen (Currypaste ausgelassen)', a.cards.Rindsuppe);
  L.ok(a.newP.join() === 'Schokosauce:kg:0:open' && /neuen Artikel haben noch keinen Preis\. Preis-Check starten/.test(a.hint.replace(/\s+/g, ' ')), 'Schokosauce ist als Artikel ohne Preis angelegt, Allergene „nicht gepflegt“; das Ergebnis führt zum Preis-Check', a.newP);
  const al = await p.evaluate(() => ({ep:algInfo(S.menu.find(m => m.name === 'Eispalatschinke')), fs:algInfo(S.menu.find(m => m.name === 'Frittatensuppe')), ks:algInfo(S.menu.find(m => m.name === 'Käsespätzle'))}));
  L.ok(al.ep.state === 'open' && al.ep.open.map(x => x.name).join() === 'Schokosauce' && al.ep.letters.join('') === 'ACG' && al.fs.state === 'has' && al.fs.letters.join('') === 'ACGL' && al.fs.src === 'recipe' && al.ks.letters.join('') === 'ACG', 'Allergene kommen jetzt aus der Rezeptur: Frittatensuppe A C G L (durch zwei Basisrezepte); Eispalatschinke unvollständig wegen Schokosauce', [al.ep.state, al.fs.letters]);
  for(const h of ['rezepte', 'speisekarte', 'vorbereitung', 'heute', 'ware/preise', 'einrichtung']) await L.go(p, h);
  await p.evaluate(() => go('cards', S.cards.find(c => c.name === 'Frittatensuppe').id)); await p.waitForTimeout(300);
  L.ok(p.errs.length === 0 && /Frittatensuppe/.test(await p.evaluate(() => document.querySelector('#cf-name').value)), 'Rezeptseite und alle Listen zeichnen mit den importierten Rezepturen ohne Fehler', p.errs.slice(0, 2));
  // ---------- rückgängig: eine Änderung ----------
  await L.go(p, 'einstellungen/eigene-daten'); await p.click('#app [data-act="datenUndo"]'); await p.waitForTimeout(700);
  L.ok(await p.evaluate(() => S.cards.length === 0 && !S.menu.some(m => m.card) && !S.products.some(x => x.name === 'Schokosauce') && S.settings.nextNo === 1 && S.imports.length === 2), 'Rückgängig: Rezepturen, Verknüpfungen und der neue Artikel sind wieder weg');

  // ---------- Excel mit zweitem Blatt „Schritte“; danach erneut: unverändert ----------
  await L.openImp(p, 'rec'); await L.upload(p, L.sample('rezepturen.xlsx'));
  const x = await p.evaluate(() => ({c:impCounts(view.daten.res), notes:view.daten.res.notes, fact:document.querySelector('#app .fact').textContent, steps:view.daten.res.order.find(rc => rc.name === 'Frittatensuppe').steps.length}));
  L.ok(x.c.neu === 7 && x.c.fehler === 3 && /Blatt „Zutaten“/.test(x.fact) && /Zubereitungsschritte aus dem Blatt „Schritte“ gelesen/.test(x.notes.join()) && x.steps === 2, 'Excel: Zutaten aus dem ersten Blatt, Schritte aus dem Blatt „Schritte“', x);
  await L.apply(p);
  const x2 = await p.evaluate(() => Object.fromEntries(S.cards.map(c => [c.name, totals(c).cost])));
  L.ok(near(x2.Rindsuppe, 9.328) && near(x2['Schnitzel Schwein'], 2.67865) && near(x2['Gemüsecurry'], 0.772), 'gleiche Werte aus der Excel-Datei (Gemüsecurry ohne Limette: 0,772 €)', x2);
  await L.openImp(p, 'rec'); await L.upload(p, L.sample('rezepturen.xlsx')); const c3 = await L.counts(p);
  L.ok(c3.gleich === 7 && c3.neu === 0 && c3.akt === 0, 'dieselbe Datei noch einmal: 7 unverändert', c3);
  // geänderte Rezeptur: aktualisiert; Kreisbezug über eine vorhandene Rezeptur
  await p.click('#app [data-act="impBack"]'); await p.waitForTimeout(150);
  await p.fill('#impPaste', 'Rezeptur\tTyp\tZutat\tMenge\tEinheit\nFrittatensuppe\tGericht\tRindsuppe\t350\tml\nFrittatensuppe\tGericht\tPalatschinkenteig\t60\tg\nRindsuppe\tBasisrezept\tPalatschinkenteig\t100\tg\nPalatschinkenteig\tBasisrezept\tRindsuppe\t50\tg\nPalatschinkenteig\tBasisrezept\tMehl glatt\t400\tg');
  await p.click('#app [data-act="impCheck"]'); await p.waitForTimeout(350);
  const u = await p.evaluate(() => view.daten.res.items.map(i => [i.st, i.title, i.why || ''].join(':')));
  L.ok(/^akt:Frittatensuppe:ersetzt die 3 Zutaten der vorhandenen Rezeptur/.test(u[0]) && /^fehler:Rindsuppe:Kreisbezug/.test(u[1]) && /^fehler:Palatschinkenteig:Kreisbezug/.test(u[2]), 'vorhandene Rezeptur wird „aktualisiert“; ein Kreis über zwei Basisrezepte wird auch beim Aktualisieren abgelehnt', u);
  await L.apply(p);
  L.ok(await p.evaluate(() => { const c = S.cards.find(x => x.name === 'Frittatensuppe'); return c.items.length === 2 && c.items[0].qty === 350 && c.steps.length === 2 && S.cards.length === 7; }), 'Frittatensuppe: Zutaten ersetzt, Schritte geblieben (die Datei hatte keine)');

  // ---------- „Rezeptur einfügen“ auf der Rezeptseite ----------
  await p.evaluate(() => { const m = S.menu.find(x => x.name === 'Kinderschnitzel'); newCard('dish', m); }); await p.waitForTimeout(350);
  L.ok(await p.evaluate(() => !!document.querySelector('#app .hints [data-act="recPaste"]') && /Noch keine Zutaten/.test(document.querySelector('#app .hints').textContent)), 'leere Rezeptur: Hinweis „Noch keine Zutaten“ mit „Rezeptur einfügen“');
  await p.click('#app .hints [data-act="recPaste"]'); await p.waitForTimeout(300);
  await p.fill('#rpTxt', '120 g Schweinsschnitzel\n10 g Mehl\n0,35 Stk Ei M\n30 g Semmelbrösel\n2 EL Butterschmalz\n1 Prise Salz\n150 g Pommes frites\nZitrone\n40 g Palatschinkenteig'); await p.waitForTimeout(250);
  const po = await p.evaluate(() => [...document.querySelectorAll('#rpOut .imp-l')].map(li => li.className.replace('imp-l ', '') + ':' + li.innerText.replace(/\s+/g, ' ')));
  L.ok(po.length === 9 && /^ok:120 g Schweinsschnitzel 120 g/.test(po[0]) && /^ok:10 g Mehl → Mehl glatt 10 g/.test(po[1]) && /^ok:2 EL Butterschmalz 2 EL ≈ 30 g 30 g/.test(po[4]) && /^ok:150 g Pommes frites neuer Artikel ohne Preis 150 g/.test(po[6]) && /^fehler: ?Zitrone Menge fehlt/.test(po[7]) && /^ok:40 g Palatschinkenteig Basisrezept 40 g/.test(po[8]), 'Dialog zeigt je Zeile, was erkannt wurde: Artikel, ähnlicher Name, Richtwert, neuer Artikel, Fehler, Basisrezept', po);
  await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(450);
  const pa = await p.evaluate(() => { const c = C(view.card); const t = totals(c); return {n:c.items.length, cost:t.cost, toast:document.querySelector('#toast').textContent, pom:S.products.find(x => x.name === 'Pommes frites'), names:t.lines.map(l => l.name).join('|')}; });
  // 0,12×9,80 + 0,01×0,89 + 0,35×0,27 + 0,03×2,40 + 0,03×11,50 + 0,0005×0,60 + 0 + 40×2,5598/1200 = 1,176 + 0,0089 + 0,0945 + 0,072 + 0,345 + 0,0003 + 0,085327 = 1,782027
  L.ok(pa.n === 8 && near(pa.cost, 1.176 + 0.0089 + 0.0945 + 0.072 + 0.345 + 0.0003 + 40 * 2.5598 / 1200) && near(pa.cost, 1.782027, 1e-5) && pa.pom && pa.pom.priceDemo && pa.pom.price === 0 && /8 Zutaten eingefügt, 1 neuer Artikel ohne Preis, 1 Zeile ausgelassen/.test(pa.toast), '8 Zutaten eingefügt; Wareneinsatz 1,78203 € wie von Hand gerechnet; „Pommes frites“ als Artikel ohne Preis', pa);
  await p.click('#toast .toast-act'); await p.waitForTimeout(400);
  L.ok(await p.evaluate(() => { const c = C(view.card); return !c.items.some(i => i.ref) && !S.products.some(x => x.name === 'Pommes frites'); }), 'Rückgängig: Zutaten und der neue Artikel sind wieder weg');
  // anhängen und Kreisbezug im Dialog
  await p.evaluate(() => go('cards', S.cards.find(c => c.name === 'Rindsuppe').id)); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => !!document.querySelector('#app details.more [data-act="recPaste"]')), '„Rezeptur einfügen“ steht auch unter „Mehr Optionen“ der Rezeptseite'); await p.evaluate(() => recPasteDialog(view.card)); await p.waitForTimeout(250);
  await p.fill('#rpTxt', '2 Stk Lorbeerblatt\n100 g Rindsuppe\n50 g Zwiebel'); await p.click('#rpNew + span'); await p.waitForTimeout(250);
  const po2 = await p.evaluate(() => [...document.querySelectorAll('#rpOut .imp-l')].map(li => li.className.replace('imp-l ', '') + ':' + li.innerText.replace(/\s+/g, ' ')));
  L.ok(/^skip:2 Stk Lorbeerblatt nicht gefunden, wird ausgelassen/.test(po2[0]) && /^skip:100 g Rindsuppe/.test(po2[1]) && /^ok:50 g Zwiebel 50 g/.test(po2[2]), 'ohne „neu anlegen“: Unbekanntes wird ausgelassen; ein Basisrezept kann sich nicht selbst als Zutat bekommen', po2);
  await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(400);
  L.ok(await p.evaluate(() => { const c = S.cards.find(x => x.name === 'Rindsuppe'); const z = c.items.find(i => i.ref === 'p:' + S.products.find(x => x.name === 'Zwiebel').id); return c.items.length === 6 && z.qty === 450; }), 'anhängen: gleiche Zutat wird zur vorhandenen Zeile addiert (400 g + 50 g)');
  await L.done(b, p.errs); })();
