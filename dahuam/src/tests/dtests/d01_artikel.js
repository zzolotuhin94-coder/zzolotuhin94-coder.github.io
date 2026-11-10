// Getränke-Artikel: Flasche, Fass, Kiste. Preis wie auf der Rechnung, die App rechnet den Literpreis. Preisliste, Lager, Import.
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch(); const {p} = await L.open(b);
  const P = (name, f) => p.evaluate(([n, k]) => { const x = S.products.find(q => q.name === n); return x ? (k ? x[k] : JSON.parse(JSON.stringify(x))) : null; }, [name, f]);
  // ---------- Dialog: Fass ----------
  await L.go(p, 'ware/preise'); await p.evaluate(() => prodDialog());
  L.ok(await p.evaluate(() => { const f = document.querySelector('#dlgForm'); return f.querySelector('[data-k="drink"]').hidden && !f.querySelector('[data-k="food"]').hidden && f.elements.kind.value === ''; }), 'Neuer Artikel: beginnt als Lebensmittel, die Getränke-Felder sind verborgen');
  await p.fill('#dlgForm [name=name]', 'Testbier Fass'); await L.drinkKind(p);
  L.ok(await p.evaluate(() => { const f = document.querySelector('#dlgForm'); return !f.querySelector('[data-k="drink"]').hidden && f.querySelector('[data-k="food"]').hidden && f.elements.price.disabled && f.elements.loc.value === 'W' && f.querySelector('[data-only=kiste]').hidden; }), '„Getränk“: kurze Form (Gebinde, Inhalt, Preis, Pfand, Schankverlust), Lagerort springt auf Bar & Weinkeller');
  await L.dlgFill(p, {geb:'fass', gebL:'30', gprice:'87', pfand:'30', pourLoss:'5', minStock:'2', stock:'3'});
  const lab = await p.evaluate(() => [...document.querySelectorAll('#dlgForm [data-gl]')].map(n => n.textContent).join('|') + '#' + document.querySelector('#gebOut').textContent);
  L.ok(/Inhalt Fass, l\|Preis je Fass, €\|Pfand je Fass, €\|Mindestbestand, Fässer\|Anfangsbestand, Fässer/.test(lab) && /Fass 30 l · €\s2,90 je Liter/.test(lab), 'Fass: Beschriftung „je Fass“, darunter „Fass 30 l · € 2,90 je Liter“', lab);
  await L.dlgOk(p);
  const fa = await P('Testbier Fass');
  L.ok(fa && fa.unit === 'l' && fa.price === 2.9 && fa.geb === 'fass' && fa.gebL === 30 && fa.gebN === 1 && fa.pack === 'Fass 30 l' && fa.packQty === 30 && fa.pfand === 30 && fa.pourLoss === 5 && fa.minStock === 60 && fa.stock === 90 && fa.loc === 'W', 'gespeichert: Einheit l, € 87 / 30 l = € 2,90 je Liter, Gebinde „Fass 30 l“, Mindestbestand 2 Fässer = 60 l, Anfangsbestand 3 Fässer = 90 l', fa);
  // ---------- Kiste ----------
  await p.evaluate(() => prodDialog()); await p.fill('#dlgForm [name=name]', 'Testlimo'); await L.drinkKind(p);
  await p.selectOption('#dlgForm [name=geb]', 'kiste'); await L.dlgFill(p, {gebL:'0,5', gprice:'19'}); await L.dlgOk(p);
  L.ok(await p.evaluate(() => document.querySelector('#dlg').open && /Flaschen in der Kiste/.test(document.querySelector('#dlgForm .f-err').textContent)), 'Kiste ohne Flaschenzahl: Hinweis am Feld, nichts gespeichert');
  await L.dlgFill(p, {gebN:'20', pfand:'4,5', minStock:'20', stock:'40'}); await L.dlgOk(p);
  const ki = await P('Testlimo');
  L.ok(ki && ki.price === 1.9 && ki.pack === 'Kiste 20×0,5 l' && ki.packQty === 10 && ki.gebN === 20 && ki.pfand === 4.5 && ki.minStock === 10 && ki.stock === 20, 'Kiste 20×0,5 l zu € 19: € 1,90 je Liter, 40 Flaschen = 20 l', ki);
  // ---------- Flasche 0,7 l ----------
  await p.evaluate(() => prodDialog()); await p.fill('#dlgForm [name=name]', 'Testgin'); await L.drinkKind(p);
  await L.dlgFill(p, {gebL:'0,7', gprice:'21'}); await L.dlgOk(p);
  const fl = await P('Testgin');
  L.ok(fl && fl.price === 30 && fl.pack === 'Flasche 0,7 l' && fl.packQty === 0.7 && fl.pfand === 0 && fl.pourLoss === 0, 'Flasche 0,7 l zu € 21: € 30,00 je Liter, ohne Pfand', fl);
  // 0,33-l-Flasche: der Literpreis hat vier Stellen, der Flaschenpreis bleibt genau
  await p.evaluate(() => prodDialog()); await p.fill('#dlgForm [name=name]', 'Testwasser'); await L.drinkKind(p); await L.dlgFill(p, {gebL:'0,33', gprice:'0,42'}); await L.dlgOk(p);
  L.ok(await p.evaluate(() => { const x = S.products.find(q => q.name === 'Testwasser'); return x.price === 1.2727 && gebPrice(x) === 0.42; }), 'Flasche 0,33 l zu € 0,42: € 1,2727 je Liter, zurückgerechnet wieder € 0,42');
  // ---------- wieder öffnen: der Dialog zeigt, was eingetragen wurde ----------
  await p.evaluate(() => prodDialog(S.products.find(q => q.name === 'Testlimo')));
  const re = await p.evaluate(() => { const f = document.querySelector('#dlgForm').elements; return [f.kind.value, f.geb.value, f.gebL.value, f.gebN.value, f.gprice.value, f.pfand.value, f.minStock.value].join('|'); });
  L.ok(re === 'g|kiste|0,5|20|19,00|4,50|20', 'Bearbeiten: Kiste, 0,5 l, 20 Flaschen, € 19,00, Pfand € 4,50, Mindestbestand 20 Flaschen', re);
  await L.shot(p, 'd01-artikel-getraenk', {full:false}); await L.theme(p, 'dark'); await L.shot(p, 'd01-artikel-getraenk-dunkel', {full:false}); await L.theme(p, 'light');
  await p.fill('#dlgForm [name=gprice]', '20'); await L.dlgOk(p);
  L.ok(await P('Testlimo', 'price') === 2 && await p.evaluate(() => S.products.find(q => q.name === 'Testlimo').priceSrc === 'manuell'), 'Preis je Kiste auf € 20 geändert: € 2,00 je Liter, als bestätigt vermerkt');
  // Lebensmittel bleiben, wie sie waren
  await p.evaluate(() => prodDialog()); await p.fill('#dlgForm [name=name]', 'Testmehl'); await L.dlgFill(p, {price:'0,95', pack:'Sack 10 kg', packQty:'10', minStock:'5'}); await L.dlgOk(p);
  const me = await P('Testmehl');
  L.ok(me && me.unit === 'kg' && me.price === 0.95 && me.packQty === 10 && me.minStock === 5 && me.geb === undefined && me.pfand === undefined, 'Lebensmittel: unverändert, keine Getränke-Felder', me);
  // ein Artikel, der in Stück in Rezepturen steckt, wird nicht stillschweigend zu Litern
  await p.evaluate(() => prodDialog(P('egg'))); await L.drinkKind(p); await L.dlgFill(p, {gebL:'1', gprice:'1'}); await L.dlgOk(p);
  L.ok(await p.evaluate(() => document.querySelector('#dlg').open && /neuen Artikel anlegen/.test(document.querySelector('#dlgForm .f-err').textContent) && P('egg').unit === 'Stk'), 'Ei (in Rezepturen in Stück): Umstellen auf Getränk wird abgelehnt');
  await p.click('#dlgCancel');
  // ---------- Preisliste ----------
  await L.go(p, 'ware/preise'); await p.click('#app [data-act=pFilter][data-id=drink]'); await p.waitForTimeout(250);
  const pl = await p.evaluate(() => { const rows = [...document.querySelectorAll('#app table.lt tbody tr')]; const r = n => rows.find(x => x.querySelector('b').textContent === n); const t = n => r(n).querySelector('small').textContent + '#' + r(n).querySelector('input').value; return {n:rows.length, all:S.products.filter(isDrink).length, fass:t('Testbier Fass'), limo:t('Testlimo'), gin:t('Testgin'), fact:document.querySelector('#app .fact').textContent}; });
  L.ok(pl.n === pl.all && pl.n >= 13 && /^je Fass 30 l · Pfand €\s30,00#87,00$/.test(pl.fass) && /^je Kiste 20×0,5 l · Pfand €\s4,50#20,00$/.test(pl.limo) && /^je Flasche 0,7 l#21,00$/.test(pl.gin) && /Getränke je Flasche, Fass oder Kiste/.test(pl.fact), 'Preise › Filter „Getränke“: nur Getränke, Preis je Fass / Kiste / Flasche', pl);
  await L.shot(p, 'd01-preise-getraenke');
  const id = await p.evaluate(() => S.products.find(q => q.name === 'Testbier Fass').id);
  await p.fill('#pp-' + id, '90'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  L.ok(await P('Testbier Fass', 'price') === 3 && /€\s87,00 → €\s90,00 je Fass/.test(await L.toast(p)), 'Preis in der Liste je Fass geändert: € 90 → € 3,00 je Liter', await L.toast(p));
  // ---------- Bestand ----------
  await L.go(p, 'ware/bestand'); await p.click('#app [data-act=loc][data-id=W]'); await p.waitForTimeout(200);
  const bs = await p.evaluate(() => { const r = n => [...document.querySelectorAll('#app table.stock tbody tr')].find(x => x.querySelector('b') && x.querySelector('b').textContent === n); const c = n => [...r(n).querySelectorAll('td')].slice(2, 5).map(td => td.textContent.trim()).join('|'); return [c('Testbier Fass'), c('Testlimo')]; });
  L.ok(bs[0].replace(/\s/g, ' ') === '3 Fass|2 Fass|€ 270,00' && bs[1].replace(/\s/g, ' ') === '40 Fl.|20 Fl.|€ 40,00', 'Bestand: Getränke in Fässern und Flaschen, Wert aus Litern × Literpreis', bs);
  // ---------- Lieferung ohne Bestellung: in Kisten, Preis je Kiste ----------
  const lid = await p.evaluate(() => S.products.find(q => q.name === 'Testlimo').id);
  await p.evaluate(i => moveDlg('in:' + i), lid);
  const ml = await p.evaluate(() => document.querySelector('#mvUnit').textContent + '|' + document.querySelector('#mvPLbl').textContent + '|' + document.querySelector('#mvPrice').value);
  L.ok(ml === 'Anzahl Kisten (20×0,5 l)|Preis je Kiste, €|20,00', 'Wareneingang buchen: „Anzahl Kisten (20×0,5 l)“, Preis je Kiste', ml);
  await p.fill('#dlgForm [name=qty]', '2'); await p.fill('#mvPrice', '22'); await L.dlgOk(p);
  const li = await P('Testlimo');
  L.ok(li.stock === 40 && li.price === 2.1 && await p.evaluate(() => S.moves[0].qty === 20 && Math.abs(S.moves[0].price - 2.2) < 1e-9), '2 Kisten zu € 22: +20 l, Ø-Preis (20 l × 2,00 + 20 l × 2,20) / 40 = € 2,10 je Liter', [li.stock, li.price]);
  await p.evaluate(i => moveDlg('waste:' + i), lid);
  L.ok(await p.evaluate(() => document.querySelector('#mvUnit').textContent) === 'Anzahl Flaschen', 'Schwund: in Flaschen');
  await p.fill('#dlgForm [name=qty]', '3'); await L.dlgOk(p);
  L.ok(await P('Testlimo', 'stock') === 38.5 && /−3 Fl\./.test(await L.toast(p)), '3 Flaschen Bruch: −1,5 l', await L.toast(p));
  // ---------- Import ----------
  const csv = ['Artikel;Einheit;Preis netto;Lieferant;Gebinde;Gebindegröße;Allergene;Lagerort;Mindestbestand;Anfangsbestand;Pfand;Schankverlust',
    'Import Pils;Fass;96,00;Getränke Wildalm;50 l;;A;Bar;1;2;36,00;4', 'Import Radler;Kiste;16,80;Getränke Wildalm;24×0,33 l;;A;;24;48;5,50;', 'Import Obstler;Flasche;14,00;Weinkontor Steinberger;;0,7;keine;Bar;1;2;;',
    'Import Soda;l;0,40;Getränke Wildalm;Kiste 12×1 l;;keine;;;;3,00;', 'Import Sirup;Flasche;4,00;;;;keine;;;;;', 'Import Mehl;kg;1,00;;Sack 10 kg;10;A;;;;2,00;3'].join('\r\n');
  const f = L.OUT + '/d01-import.csv'; fs.writeFileSync(f, '﻿' + csv);
  await L.openImp(p, 'prod'); await L.upload(p, f);
  const pv = await L.preview(p);
  L.ok(pv && pv.length === 6 && pv.slice(0, 4).every(x => x.st === 'neu') && /als Stück geführt/.test(pv[4].notes.join()) && /Pfand gibt es nur bei Getränken/.test(pv[5].notes.join()) && /Schankverlust gibt es nur bei Getränken/.test(pv[5].notes.join()), 'Import-Vorschau: vier Getränke neu; Flasche ohne Inhalt bleibt Stück (Hinweis); Pfand und Schankverlust bei Mehl werden nicht übernommen (Hinweis)', pv && pv.map(x => [x.st, x.notes]));
  await L.shot(p, 'd01-import-vorschau');
  await L.apply(p);
  const im = await p.evaluate(() => Object.fromEntries(['Import Pils', 'Import Radler', 'Import Obstler', 'Import Soda', 'Import Sirup', 'Import Mehl'].map(n => { const x = S.products.find(q => q.name === n); return [n.slice(7), [x.unit, x.price, x.geb || '', x.gebL || 0, x.gebN || 0, x.pack, x.packQty, x.pfand || 0, x.pourLoss || 0, x.minStock, x.stock, x.loc].join('|')]; })));
  L.ok(im.Pils === 'l|1.92|fass|50|1|Fass 50 l|50|36|4|50|100|W', 'Import Fass 50 l zu € 96: € 1,92 je Liter, Pfand € 36, Schankverlust 4 %, 1 Fass Mindestbestand = 50 l, 2 Fässer = 100 l', im.Pils);
  L.ok(im.Radler === 'l|2.1212|kiste|0.33|24|Kiste 24×0,33 l|7.92|5.5|0|7.92|15.84|W', 'Import Kiste 24×0,33 l zu € 16,80: € 2,1212 je Liter, 24 Flaschen Mindestbestand = 7,92 l', im.Radler);
  L.ok(im.Obstler === 'l|20|fl|0.7|1|Flasche 0,7 l|0.7|0|0|0.7|1.4|W', 'Import Flasche, Inhalt 0,7 in der Spalte Gebindegröße: € 20,00 je Liter', im.Obstler);
  L.ok(im.Soda === 'l|0.4|kiste|1|12|Kiste 12×1 l|12|3|0|0|0|W', 'Import Einheit l mit Gebinde „Kiste 12×1 l“: Preis bleibt je Liter, Pfand je Kiste', im.Soda);
  L.ok(/^Stk\|4\|\|0\|0/.test(im.Sirup) && /^kg\|1\|\|0\|0\|Sack 10 kg\|10\|0\|0/.test(im.Mehl), 'Import: Stück-Flasche und Mehl ohne Getränke-Felder', [im.Sirup, im.Mehl]);
  // dieselbe Datei noch einmal: nichts ändert sich
  await L.openImp(p, 'prod'); await L.upload(p, f); const c2 = await L.counts(p);
  L.ok(c2.neu === 0 && c2.akt === 0, 'dieselbe Datei noch einmal: alles unverändert', c2);
  // Vorlage enthält die neuen Spalten und drei Getränke
  const tpl = await p.evaluate(() => impTplText('prod'));
  L.ok(/Pfand\tSchankverlust/.test(tpl.split('\n')[0]) && /Märzen vom Fass\tFass\t\t87,00/.test(tpl) && /Weißbier 0,5 l\tKiste/.test(tpl) && /Grüner Veltliner 0,75 l\tFlasche/.test(tpl), 'Vorlage Artikel: Spalten Pfand und Schankverlust, Beispiele Fass, Kiste, Flasche');
  await p.evaluate(() => { S.products = []; S.cards = []; S.menu = []; S.suppliers = []; S.orders = []; save(); });
  await L.openImp(p, 'prod'); await p.fill('#impPaste', await p.evaluate(() => impTplText('prod'))); await p.click('#app [data-act="impCheck"]'); await p.waitForTimeout(400);
  const tc = await p.evaluate(() => view.daten && view.daten.res ? impCounts(view.daten.res) : null);
  L.ok(tc && tc.neu === 8 && !tc.fehler, 'die Vorlage selbst lässt sich fehlerfrei einlesen (8 Artikel)', tc);
  await L.done(b, p.errs); })();
