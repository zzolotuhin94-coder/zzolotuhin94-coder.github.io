// Zweiter MwSt.-Satz: Speisen 10 %, Getränke 20 %. Klasse je Kategorie, Abweichung je Gericht, EIN Helfer für Nettopreis, Wareneinsatz, Rohertrag, Auswertung und CSV.
const L = require('./lib'); const fs = require('fs');
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  // D1: die Beispieldaten bringen eigene Getränke mit (Kategorie „Getränke“, Fassbier mit Schankverlust). Dieser Test rechnet den zweiten Steuersatz
  // mit einem eigenen Bier von Hand, deshalb beginnt er ohne die Beispiel-Getränke und mit dem Bier zu 2,90 €/l ohne Schankverlust.
  await p.evaluate(() => { S.menu = S.menu.filter(m => m.section !== 'Getränke'); S.cards = S.cards.filter(c => !c.drink); S.settings.sections = S.settings.sections.filter(s => s !== 'Getränke'); delete S.settings.secVat['Getränke']; const b = P('bier'); b.price = 2.9; b.pourLoss = 0; save(); render(); });
  // ---------- Grundzustand ----------
  const s0 = await p.evaluate(() => ({vat:S.settings.vat, vd:S.settings.vatDrinks, sv:JSON.stringify(S.settings.secVat), all10:S.menu.every(m => vatRate(m) === 10 && vatClass(m) === 's'), vatOf:typeof vatOf, sch:(() => { const m = S.menu.find(x => x.card === 'dish_schnitzel_pork'); const k = menuCalc(m); return [m.price, k.netPrice, k.cost, k.fc, k.margin]; })()}));
  L.ok(s0.vat === 10 && s0.vd === 20 && s0.sv === '{}' && s0.all10 && s0.vatOf === 'undefined', 'Speisen 10 %, Getränke 20 %; alle Beispiel-Kategorien sind Speisen; den alten Namens-Vergleich (vatOf) gibt es nicht mehr', s0);
  L.ok(near(s0.sch[1], 20.9 / 1.1) && near(s0.sch[3], s0.sch[2] / (20.9 / 1.1) * 100) && near(s0.sch[4], 20.9 / 1.1 - s0.sch[2]), '10-%-Gericht rechnet wie bisher: 20,90 / 1,10 = 19,00 netto', s0.sch);
  // ---------- Getränke-Kategorie mit 20 %: von Hand gerechnet ----------
  // Rezeptur „Hausbier 0,5 l“: 500 ml Zillertaler Bier vom Fass × 2,90 €/l = 1,45 €. Preis 5,40 inkl. 20 % → 4,50 netto. Wareneinsatz 1,45 / 4,50 = 32,2222 %. Rohertrag 3,05 €.
  // Zum Vergleich mit 10 %: 5,40 / 1,10 = 4,909091 → 29,5370 %.
  const r1 = await p.evaluate(() => { S.settings.sections.push('Getränke'); S.settings.secVat['Getränke'] = 'g';
    S.cards.push({id:'dish_bier', no:90, name:'Hausbier 0,5 l', type:'dish', category:'Getränke', yieldG:500, img:'', steps:[], items:[{ref:'p:bier', qty:500, net:''}]});
    const m = {id:'m_bier', section:'Getränke', name:'Hausbier', vlabel:'0,5 l', group:'', desc:'', price:5.4, card:'dish_bier', img:'', veg:'vg', top:false, hidden:false, seasons:[], days:[], alg:'', algNone:false, vat:'', order:0}; S.menu.push(m);
    const w = {id:'m_wasser', section:'Getränke', name:'Mineralwasser', vlabel:'', group:'', desc:'', price:3.6, card:'', img:'', veg:'vg', top:false, hidden:false, seasons:[], days:[], alg:'', algNone:true, vat:'', order:1}; S.menu.push(w);
    save(); const k = menuCalc(m); return {rate:vatRate(m), cls:vatClass(m), net:k.netPrice, cost:k.cost, fc:k.fc, margin:k.margin, w:menuCalc(w).netPrice}; });
  L.ok(r1.rate === 20 && r1.cls === 'g' && near(r1.cost, 1.45) && near(r1.net, 4.5) && near(r1.fc, 1.45 / 4.5 * 100) && near(r1.fc, 32.2222222, 1e-6) && near(r1.margin, 3.05), 'Hausbier 5,40 inkl. 20 %: netto 4,50 · Wareneinsatz 1,45 → 32,22 % · Rohertrag 3,05 €', r1);
  L.ok(near(r1.w, 3.0), 'Mineralwasser 3,60 inkl. 20 % → 3,00 netto', r1.w);
  // Abweichung je Gericht: ein Getränk in einer Speisen-Kategorie, eine Speise in der Getränke-Kategorie
  const r2 = await p.evaluate(() => { const m = S.menu.find(x => x.id === 'm_bier'); m.vat = 's'; const a = [vatRate(m), menuCalc(m).netPrice, menuCalc(m).fc]; m.vat = '';
    const ms = S.menu.find(x => x.name === 'Milchshake'); const b0 = [vatClass(ms), menuCalc(ms).netPrice]; ms.vat = 'g'; const b1 = [vatClass(ms), vatRate(ms), menuCalc(ms).netPrice, ms.price]; return {a, b0, b1}; });
  L.ok(r2.a[0] === 10 && near(r2.a[1], 5.4 / 1.1) && near(r2.a[2], 1.45 / (5.4 / 1.1) * 100) && near(r2.a[2], 29.537037, 1e-5), 'Abweichung am Gericht: dasselbe Bier mit 10 % → 4,9091 netto, 29,54 %', r2.a);
  L.ok(r2.b0[0] === 's' && near(r2.b0[1], 5.5 / 1.1) && r2.b1[0] === 'g' && r2.b1[1] === 20 && near(r2.b1[2], 5.5 / 1.2), 'Milchshake (Kategorie „Für Kinder“) von Hand auf Getränke: 5,50 / 1,20 = 4,5833 netto', r2);
  // Sätze änderbar
  const r3 = await p.evaluate(() => { S.settings.vatDrinks = 13; const a = menuCalc(S.menu.find(x => x.id === 'm_bier')).netPrice; S.settings.vatDrinks = 0; const z = menuCalc(S.menu.find(x => x.id === 'm_bier')).netPrice; S.settings.vatDrinks = 20; S.settings.vat = 7; const c = menuCalc(S.menu.find(x => x.card === 'dish_goulash')).netPrice; S.settings.vat = 10; return {a, z, c}; });
  L.ok(near(r3.a, 5.4 / 1.13) && near(r3.z, 5.4) && near(r3.c, 7.9 / 1.07), 'beide Sätze sind Einstellungen: 13 % → 4,7788 · 0 % → 5,40 · Speisen 7 % → 7,3832', r3);

  // ---------- Einstellungen ----------
  await L.go(p, 'einstellungen');
  L.ok(await p.evaluate(() => document.querySelector('#s-vat').value === '10' && document.querySelector('#s-vatDrinks').value === '20' && /10 % für Speisen und 20 % für Getränke/.test(document.querySelector('#app').textContent)), 'Einstellungen: zwei Felder, MwSt. Speisen und MwSt. Getränke');
  await p.fill('#s-vatDrinks', '19'); await p.keyboard.press('Tab'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => S.settings.vatDrinks === 19 && Math.abs(menuCalc(S.menu.find(x => x.id === 'm_bier')).netPrice - 5.4 / 1.19) < 1e-9), 'Getränke-Satz geändert: 19 % wirkt sofort auf die Rechnung');
  await p.fill('#s-vatDrinks', '120'); await p.keyboard.press('Tab'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => S.settings.vatDrinks === 19), 'ungültiger Wert (120) wird nicht übernommen');
  await p.fill('#s-vatDrinks', '20'); await p.keyboard.press('Tab'); await p.waitForTimeout(250);
  // ---------- Kategorien verwalten ----------
  await L.go(p, 'speisekarte'); await p.evaluate(() => secDialog()); await p.waitForTimeout(300);
  const sd = await p.evaluate(() => [...document.querySelectorAll('#dlgForm .sec-list li')].map(li => li.querySelector('.lay-name').value + ':' + li.querySelector('.sec-vat').value + ':' + li.querySelector('.sec-vat').selectedOptions[0].textContent));
  L.ok(sd.length === 10 && sd[9] === 'Getränke:g:Getränke 20 %' && sd.slice(0, 9).every(x => /:s:Speisen 10 %$/.test(x)), '„Kategorien verwalten“: je Kategorie Speisen oder Getränke', sd.slice(-2));
  const idx = await p.evaluate(() => secList().indexOf('Süßes'));
  await p.selectOption(`#dlgForm select[data-secvat="${idx}"]`, 'g'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => S.settings.secVat['Süßes'] === 'g' && vatRate(S.menu.find(m => m.section === 'Süßes')) === 20) && /Süßes: Getränke/.test(await L.toast(p)), 'Kategorie auf Getränke gestellt: alle Gerichte darin rechnen mit 20 %');
  await p.selectOption(`#dlgForm select[data-secvat="${idx}"]`, 's'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => !('Süßes' in S.settings.secVat)), 'zurück auf Speisen');
  // umbenennen: die Klasse wandert mit
  await p.fill('#dlgForm input[data-secname="9"]', 'Getränke & Bar'); await p.keyboard.press('Tab'); await p.waitForTimeout(350);
  L.ok(await p.evaluate(() => S.settings.secVat['Getränke & Bar'] === 'g' && !('Getränke' in S.settings.secVat) && vatRate(S.menu.find(x => x.id === 'm_bier')) === 20), 'Kategorie umbenannt: bleibt Getränke-Kategorie');
  await p.click('#dlgCancel'); await p.waitForTimeout(250);
  // ---------- Gericht-Dialog ----------
  await p.evaluate(() => menuDialog(S.menu.find(x => x.id === 'm_wasser'))); await p.waitForTimeout(300);
  const md = await p.evaluate(() => [...document.querySelectorAll('#dlgForm select[name="vat"] option')].map(o => o.value + ':' + o.textContent).join('|'));
  L.ok(md === ':wie die Kategorie|s:Speisen · 10 %|g:Getränke · 20 %', 'Gericht: Feld „Steuersatz“ mit „wie die Kategorie“ als Vorgabe', md);
  await p.selectOption('#dlgForm select[name="vat"]', 's'); await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => { const m = S.menu.find(x => x.id === 'm_wasser'); return m.vat === 's' && Math.abs(menuCalc(m).netPrice - 3.6 / 1.1) < 1e-9; }), 'am Gericht gewählt: Speisen, obwohl die Kategorie Getränke ist');
  await p.evaluate(() => { S.menu.find(x => x.id === 'm_wasser').vat = ''; save(); });
  // ---------- Rezeptseite: Simulator mit dem Satz des Gerichts ----------
  await p.evaluate(() => go('cards', 'dish_bier')); await p.waitForTimeout(350);
  const sim = await p.evaluate(() => { const sec = [...document.querySelectorAll('#app section.panel')].find(s => /Preis-Simulator/.test(s.textContent)); const rec = sec.querySelector('[data-act="simTo"]').dataset.id; return {head:sec.querySelector('.panel-h').textContent, rec:+rec, out:sec.querySelector('#simOut').textContent, ring:document.querySelector('#app .hero-ring b').textContent}; });
  // Empfehlung für 28 % Wareneinsatz: 1,45 / 0,28 × 1,20 = 6,2143 → 6,2
  L.ok(/inkl\. 20 % MwSt\./.test(sim.head) && sim.rec === 6.2 && /32,2 %/.test(sim.ring) && /32,2 %/.test(sim.out) && /3,05/.test(sim.out), 'Rezeptseite: „inkl. 20 % MwSt.“, 32,2 %, Rohertrag 3,05 €; Preisvorschlag für 28 %: 1,45 / 0,28 × 1,20 = 6,20', sim);
  await p.evaluate(() => go('cards', 'dish_goulash')); await p.waitForTimeout(300);
  L.ok(/inkl\. 10 % MwSt\./.test(await p.evaluate(() => document.querySelector('#app').textContent)), 'Speise: weiterhin „inkl. 10 % MwSt.“');
  // Speisekarte-Liste
  await L.go(p, 'speisekarte');
  const li = await p.evaluate(() => { const tr = document.querySelector('#app tr[data-mid="m_bier"]'); return tr.innerText.replace(/\s+/g, ' '); });
  L.ok(/1,45/.test(li) && /32,2 %/.test(li) && /3,05/.test(li), 'Speisekarte: Zeile Hausbier mit 1,45 € · 32,2 % · 3,05 €', li);

  // ---------- Auswertung: netto je Satz ----------
  // Ein Tag, von Hand: 10 Hausbier (54,00 brutto) + 5 Mineralwasser (18,00) + 4 Gulaschsuppe (31,60)
  // netto: 54/1,2 = 45,00 · 18/1,2 = 15,00 · 31,60/1,1 = 28,727273 → 88,727273 ; Getränke 60,00 · Speisen 28,727273 ; MwSt. Getränke 12,00 · Speisen 2,872727
  const D = await p.evaluate(() => { const d = dAdd(todayStr(), -1); const g = S.menu.find(x => x.card === 'dish_goulash'); S.salesDays = {}; S.salesReal = {}; S.salesDemo = false; S.salesDays[d] = [['m_bier', 10, 54], ['m_wasser', 5, 18], [g.id, 4, 31.6]]; S.salesReal[d] = 1; save(); const r = report(d, d); const sp = vatSplit(r.rows);
    return {d, net:r.net, gross:r.gross, rows:r.rows.map(x => [x.name, x.vat, x.vc, x.n, x.fc]), split:sp.map(x => [x.vat, x.label, x.q, x.g, x.n]), nod:netOfDays({}, d, d), we:r.we, fc:r.fc, gcost:costFor(d, g.id, () => menuCalc(g).cost)}; });   // Wareneinsatz zum Verkaufstag (festgeschrieben, report.js)
  L.ok(near(D.net, 45 + 15 + 31.6 / 1.1) && near(D.net, 88.7272727, 1e-6) && near(D.gross, 103.6) && near(D.nod, D.net), 'Auswertung: Umsatz netto 88,73 € = 45,00 + 15,00 + 28,73 (jede Zeile mit ihrem Satz)', [D.net, D.nod]);
  L.ok(D.split.length === 2 && D.split[0][0] === 10 && D.split[0][1] === 'Speisen' && near(D.split[0][4], 31.6 / 1.1) && D.split[1][0] === 20 && D.split[1][1] === 'Getränke' && D.split[1][2] === 15 && near(D.split[1][3], 72) && near(D.split[1][4], 60), 'Aufteilung: Speisen 10 % netto 28,73 · Getränke 20 % netto 60,00 (brutto 72,00)', D.split);
  const bier = D.rows.find(x => x[0] === 'Hausbier · 0,5 l');
  L.ok(bier[1] === 20 && near(bier[3], 45) && near(bier[4], 14.5 / 45 * 100) && near(D.we, 14.5 + 4 * D.gcost), 'Zeile Hausbier: 10 × 1,45 = 14,50 Wareneinsatz auf 45,00 netto = 32,22 %; Mineralwasser ohne Rezeptur zählt nicht mit', bier);
  await p.evaluate(d => { view.rp.unit = 'custom'; view.rp.from = dAdd(d, -70); view.rp.to = d; view.rp.tab = 'sales'; go('report'); }, D.d); await p.waitForTimeout(400);
  const mt = await p.evaluate(() => { const sec = [...document.querySelectorAll('#app section.panel')].find(s => /Monatsübersicht/.test(s.textContent)); if(!sec) return null; return {head:[...sec.querySelectorAll('thead th')].map(x => x.textContent).join('|'), row:[...sec.querySelectorAll('tbody tr:last-child td')].map(x => x.textContent.replace(/ /g, ' ')).join('|')}; });
  L.ok(mt && /netto Speisen 10 %\|netto Getränke 20 %/.test(mt.head) && /\|€ 103,60\|€ 28,73\|€ 60,00\|/.test(mt.row), 'Monatsübersicht: Spalten „netto Speisen 10 %“ und „netto Getränke 20 %“ mit 28,73 € und 60,00 €', mt);
  const csv = await p.evaluate(d => { view.rp.from = d; return rpCsvText().text; }, D.d);
  L.ok(/^﻿Gericht;Kategorie;Menge;Umsatz brutto;MwSt\. %;Umsatz netto;/.test(csv) && /Hausbier · 0,5 l;Getränke & Bar;10;54,00;20;45,00;5,40;14,50;32,22;30,50/.test(csv) && /Gulaschsuppe;[^;]+;4;31,60;10;28,73;/.test(csv), 'CSV: Spalte „MwSt. %“ je Zeile, netto mit dem richtigen Satz', csv.split('\r\n').slice(0, 2));
  L.ok(/\r\nSumme;;19;103,60;;88,73;/.test(csv) && /\r\n\r\nSteuersatz;Klasse;Menge;Umsatz brutto;MwSt\. %;Umsatz netto;MwSt\. Betrag\r\nMwSt\. 10 %;Speisen;4;31,60;10;28,73;2,87\r\nMwSt\. 20 %;Getränke;15;72,00;20;60,00;12,00$/.test(csv), 'CSV: Summe und darunter die Aufteilung je Steuersatz mit MwSt.-Betrag (2,87 € und 12,00 €)', csv.split('\r\n').slice(-3));
  // Abweichung am Gericht bildet eine eigene Zeile der Aufteilung
  const sp2 = await p.evaluate(d => { S.menu.find(x => x.id === 'm_wasser').vat = 's'; const r = vatSplit(report(d, d).rows).map(x => [x.vat, x.label, x.q, Math.round(x.n * 100) / 100]); S.menu.find(x => x.id === 'm_wasser').vat = ''; return r; }, D.d);
  L.ok(JSON.stringify(sp2) === JSON.stringify([[10, 'Speisen', 9, 45.09], [20, 'Getränke', 10, 45]]), 'Mineralwasser am Gericht auf Speisen gestellt: zählt in der Aufteilung zu 10 % (18/1,1 + 28,73 = 45,09)', sp2);
  // Gästekarte: Fußzeile bleibt
  await L.go(p, 'speisekarte/gaestekarte'); await p.waitForTimeout(600);
  L.ok(await p.evaluate(() => /inkl\. MwSt\./.test(gsPages({print:true}).pop()) && !/20 %|10 %/.test(gsPages({print:true}).pop())), 'Gästekarte: Fußzeile bleibt „inkl. MwSt.“, ohne Sätze');
  await L.done(b, p.errs); })();
