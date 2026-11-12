// Bilder zu allen Befunden (vorher/nachher): node shots.js <praefix>
const L = require('./lib'); const pre = process.argv[2] || 'after';
(async () => { const b = await L.launch();
  const run = async (o, fn) => { const {c, p} = await L.open(b, o); try { await fn(p); } catch(e){ console.log('ERR', e.message); } await c.close(); };
  const w = (p, ms) => p.waitForTimeout(ms);
  // 1 + 8: Vorbereitung
  await run(L.IPAD, async p => { await L.ev(p, () => go('vorb')); await w(p, 400); await L.shot(p, pre + '-01-prep-heute'); await L.ev(p, () => { view.pl.off = 1; render(); }); await w(p, 300); await L.shot(p, pre + '-01-prep-morgen'); });
  // 4: Bäckerei Vorschlag
  await run(L.DESK, async p => { await L.ev(p, () => go('dash')); await w(p, 300); await L.shot(p, pre + '-04-heute', {full:false});
    await L.ev(p, () => { const b = document.querySelector('#app [data-act="ordNew"][data-id="sup_baeck"]'); if(b) b.click(); }); await w(p, 300);
    await L.ev(p, () => { const b = document.querySelector('#app [data-act="olSuggest"]'); if(b) b.click(); }); await w(p, 200); await L.shot(p, pre + '-04-baeckerei-vorschlag', {full:false}); });
  // 5: Senden unter Mindestwert
  await run(L.PHONE, async p => { await L.ev(p, () => { const o = newOrder('sup_gem', false); o.lines.push(lineFor(P('potato'), 1)); save(); view.stab = 'bestellung'; view.order = o.id; go('stock'); }); await w(p, 300);
    await L.ev(p, () => document.querySelector('#app [data-act="ordMarkSent"]').click()); await w(p, 300); await L.shot(p, pre + '-05-senden', {full:false}); });
  // 6: Leergut
  await run(L.DESK, async p => { await L.ev(p, () => { view.stab = 'lieferanten'; go('stock'); }); await w(p, 300); await L.shot(p, pre + '-10-lieferanten');
    await L.ev(p, () => document.querySelector('#app [data-act="lgReturn"]').click()); await w(p, 200); await p.fill('#dlgForm [name=k0]', '4'); await w(p, 100); await L.shot(p, pre + '-06-leergut', {full:false}); });
  // 7: Verkäufe buchen (09:00)
  await run({...L.DESK, at:[2026, 11, 12, 9, 0]}, async p => { await L.ev(p, () => go('dash')); await w(p, 300); await L.shot(p, pre + '-07-heute-kopf', {full:false}); await L.ev(p, () => salesDlg()); await w(p, 200); await L.shot(p, pre + '-07-verkaeufe', {full:false}); });
  // 9 + Tabelle: Bestellung B-2026-0004 am iPad
  await run(L.IPAD, async p => { await L.ev(p, () => { const o = S.orders.find(x => x.no === 'B-2026-0004'); view.stab = 'bestellung'; view.order = o.id; go('stock'); }); await w(p, 300); await L.shot(p, pre + '-09-bestellung-ipad'); });
  await run(L.DESK, async p => { await L.ev(p, () => { const o = S.orders.find(x => x.no === 'B-2026-0004'); view.stab = 'bestellung'; view.order = o.id; go('stock'); }); await w(p, 300); await L.shot(p, pre + '-09-bestellung-desktop'); });
  // 2: Import mit Gebinde
  await run(L.DESK, async p => { await L.ev(p, () => datenOpen('prod')); await w(p, 200);
    await p.fill('#impPaste', 'Art.-Nr.;Bezeichnung;VE;Preis netto €\nGI-107;Mehl glatt;Sack 10 kg;9,50\nGI-220;Pommes frites;Karton 4x2,5 kg;23,40\nGI-330;Rapsöl;Kanister 10 l;24,90\nGI-401;Kristallzucker;Sack 25 kg;1,20');
    await L.ev(p, () => document.querySelector('#app [data-act="impCheck"]').click()); await w(p, 400); await L.shot(p, pre + '-02-import'); });
  // 2: Preis-Check
  await run(L.DESK, async p => { await L.ev(p, () => pcStart(['crumbs'])); await w(p, 300); await p.fill('#pcIn', '12,50'); await p.keyboard.press('Enter'); await w(p, 300); await L.shot(p, pre + '-02-preischeck', {full:false}); });
  // 3: Auswertung Oktober
  await run(L.DESK, async p => { await L.ev(p, () => { view.rp.tab = 'sales'; view.rp.unit = 'month'; view.rp.ref = '2026-10-15'; view.rp.auto = true; go('report'); }); await w(p, 400);
    const a = await L.txt(p, '#app .rp-sum'); await L.ev(p, () => { P('bergkase').price = 24; save(); render(); }); await w(p, 300); const bb = await L.txt(p, '#app .rp-sum'); console.log('OKT vorher:', a); console.log('OKT nachher:', bb); await L.shot(p, pre + '-03-auswertung', {full:false}); });
  await b.close(); })();
