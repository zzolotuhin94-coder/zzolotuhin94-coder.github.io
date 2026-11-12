// Befund 2: Preis je Sack/Karton/Kanister wird nicht mehr still als Preis je kg übernommen (Eigene Daten, Preisliste, Preis-Check).
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.DESK); const ev = async (f, a) => L.nb(await p.evaluate(f, a)); const w = ms => p.waitForTimeout(ms);
  const LIST = 'Art.-Nr.;Bezeichnung;VE;Preis netto €\nGI-107;Mehl glatt;Sack 10 kg;9,50\nGI-220;Pommes frites;Karton 4x2,5 kg;23,40\nGI-330;Rapsöl;Kanister 10 l;24,90\nGI-401;Kristallzucker;Sack 25 kg;1,20';
  // ---------- Eigene Daten › Artikel & Preise ----------
  await ev(() => datenOpen('prod')); await w(200); await p.fill('#impPaste', LIST); await p.click('#app [data-act="impCheck"]'); await w(400);
  const pv = await ev(() => view.daten.res.items.map(i => ({t:i.title, price:i.data && i.data.price, sub2:i.sub2 || '', gctl:!!i.gctl, notes:i.notes})));
  const by = n => pv.find(x => x.t.startsWith(n));
  L.ok(Math.abs(by('Mehl').price - 0.95) < 1e-9 && /€ 9,50 je Sack 10 kg = € 0,95 je kg/.test(by('Mehl').sub2) && !by('Mehl').gctl, 'Mehl „Sack 10 kg“ 9,50 (bisher 0,90 je kg): eindeutig je Sack → € 0,95 je kg, Umrechnung in der Vorschau', by('Mehl'));
  L.ok(Math.abs(by('Rapsöl').price - 2.49) < 1e-9 && /je Kanister 10 l = € 2,49 je l/.test(by('Rapsöl').sub2), 'Rapsöl „Kanister 10 l“ 24,90 → € 2,49 je l', by('Rapsöl'));
  L.ok(Math.abs(by('Kristallzucker').price - 1.2) < 1e-9 && !by('Kristallzucker').sub2, 'Zucker „Sack 25 kg“ 1,20 (bisher 1,00 je kg): bleibt je kg, keine Umrechnung', by('Kristallzucker'));
  const pom = by('Pommes');
  L.ok(pom.gctl && pom.notes.some(n => /Bitte unten wählen/.test(n)) && Math.abs(pom.price - 2.34) < 1e-9, 'Pommes (neuer Artikel, „Karton 4x2,5 kg“ 23,40): unklar → die Vorschau fragt (vorbelegt: je Karton = € 2,34 je kg)', pom);
  await p.selectOption('#app select[data-impdec="g3"]', 'unit'); await w(300);
  L.ok(await ev(() => view.daten.res.items.find(i => i.title.startsWith('Pommes')).data.price === 23.4), 'Auswahl „1 kg“: Preis bleibt 23,40 je kg');
  await p.selectOption('#app select[data-impdec="g3"]', 'pack'); await w(300);
  await L.shot(p, 'x02-import-gebinde');
  await p.click('#app [data-act="impApply"]'); await w(500);
  L.ok(await ev(() => Math.abs(P('flour').price - 0.95) < 1e-9 && Math.abs(P('oil').price - 2.49) < 1e-9), 'übernommen: Mehl € 0,95 je kg, Öl € 2,49 je l (nicht 9,50 und 24,90)', await ev(() => [P('flour').price, P('oil').price]));
  // großer Sprung ohne Gebinde wird gezeigt
  await ev(() => datenOpen('prod')); await w(200); await p.fill('#impPaste', 'Artikel;Einheit;Preis netto\nMehl glatt;kg;4,00'); await p.click('#app [data-act="impCheck"]'); await w(300);
  L.ok(await ev(() => view.daten.res.items[0].notes.some(n => /Preis € 0,95 → € 4,00 je kg \(\+321 %\), bitte prüfen/.test(n.replace(/\u00a0/g, ' ')))), 'Preis-Sprung über das Doppelte: Hinweis mit alt und neu je kg');
  // ---------- alter Dialog „Preisliste importieren“ ----------
  await ev(() => plDialog()); await w(200); await p.fill('#plText', 'Artikelnr;Artikel;Gebinde;Preis\n;Semmelbrösel;Sack 5 kg;12,50\n;Kristallzucker;Sack 25 kg;1,10'); await p.click('#plCheck'); await w(250);
  const pl = await ev(() => plDialog.res.lines.map(l => ({n:l.name, pq:l.pq, mode:l.gmode, sure:l.gsure})));
  L.ok(pl[0].pq === 5 && pl[0].mode === 'pack' && pl[0].sure && pl[1].mode === 'unit', 'Preisliste: Semmelbrösel „Sack 5 kg“ 12,50 (bisher 2,50) → je Sack; Zucker bleibt je kg', pl);
  L.ok(await ev(() => /Sack 5 kg, also € 2,50 je kg/.test(document.querySelector('#plOut').innerText.replace(/\u00a0/g, ' '))), 'Vorschau zeigt die Umrechnung');
  await L.shot(p, 'x02-preisliste', {full:false});
  await L.dlgOk(p);
  L.ok(await ev(() => P('crumbs').price === 2.5 && Math.abs(P('sugar').price - 1.1) < 1e-9), 'übernommen: Semmelbrösel € 2,50 je kg, Zucker € 1,10 je kg', await ev(() => [P('crumbs').price, P('sugar').price]));
  // ---------- Preis-Check: Sackpreis eingetippt ----------
  await ev(() => { P('crumbs').priceDemo = true; save(); pcStart(['crumbs']); }); await w(250);
  await p.fill('#pcIn', '12,50'); await p.keyboard.press('Enter'); await w(250);
  const m1 = await ev(() => ({i:view.pc.i, price:P('crumbs').price, msg:document.querySelector('#pcMsg').innerText}));
  L.ok(m1.i === 0 && m1.price === 2.5 && /Meinten Sie € 12,50 für Sack 5 kg\? Das sind € 2,50 je kg\. Bisher € 2,50 je kg/.test(m1.msg), 'Preis-Check 12,50 bei „Sack 5 kg“: nichts übernommen, Rückfrage mit alt/neu je kg', m1.msg);
  await L.shot(p, 'x02-preischeck-frage', {full:false});
  await p.click('#pcMsg [data-act="pcPack"]'); await w(250);
  L.ok(await ev(() => P('crumbs').price === 2.5 && P('crumbs').priceDemo === false && view.pc.i === 1), '„Ja, € 2,50 je kg“ übernimmt den Preis je kg');
  // doppelter Preis ohne Gebinde-Faktor: Bestätigung
  await ev(() => { P('cream').priceDemo = true; save(); pcStart(['cream']); }); await w(250);
  const ref = await ev(() => P('cream').price); await p.fill('#pcIn', String(Math.round(ref * 2.2 * 100) / 100).replace('.', ',')); await p.keyboard.press('Enter'); await w(250);
  L.ok(await ev(r => view.pc.i === 0 && P('cream').price === r && /^Wirklich .* Bisher € [\d,]+ je l, das wären \+120 %/.test(document.querySelector('#pcMsg').innerText.replace(/\u00a0/g, ' ')), ref), 'mehr als doppelt so teuer: erst nach „Ja, übernehmen“');
  await p.click('#pcMsg [data-act="pcSave"]'); await w(250);
  L.ok(await ev(r => Math.abs(P('cream').price - Math.round(r * 2.2 * 100) / 100) < 1e-9, ref), 'nach Bestätigung übernommen');
  await L.done(b, p.errs);
})();
