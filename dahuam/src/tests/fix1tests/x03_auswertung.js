// Befund 3: Ein späterer Einkaufspreis ändert abgeschlossene Monate nicht mehr (Kosten je Verkaufstag festgeschrieben).
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.DESK); const ev = async (f, a) => L.nb(await p.evaluate(f, a)); const w = ms => p.waitForTimeout(ms);
  const okt = () => ev(() => { const r = report('2026-10-01', '2026-10-31'); return {fc:Math.round(r.fc * 100) / 100, rg:Math.round(r.rg * 100) / 100, we:Math.round(r.we * 100) / 100}; });
  const a = await okt();
  L.ok(await ev(() => S.costSnap && S.costSnap.to === '2026-11-11' && S.costSnap.v.length === 1), 'beim Start festgeschrieben: alle Verkaufstage bis gestern (11.11.)', await ev(() => S.costSnap.to));
  await ev(() => { P('bergkase').price = 24; P('beef_goulash').price = P('beef_goulash').price * 3; save(); render(); }); await w(150);
  const b1 = await okt();
  L.ok(JSON.stringify(a) === JSON.stringify(b1), 'Oktober bleibt gleich, obwohl Bergkäse und Rindfleisch jetzt teurer sind', {vorher:a, nachher:b1});
  // heute gebuchte Verkäufe rechnen mit den aktuellen Preisen
  const t = await ev(() => { const m = S.menu.find(x => x.card === 'dish_goulash' || /Gulaschsuppe/.test(x.name)); S.salesDays[todayStr()] = [[m.id, 2, 2 * m.price]]; save(); const r = report(todayStr(), todayStr()); return {cpp:r.rows[0].cpp, live:menuCalc(m).cost}; });
  L.ok(Math.abs(t.cpp - t.live) < 1e-9, 'heute: Wareneinsatz mit den aktuellen Preisen', t);
  // am nächsten Tag ist „heute“ festgeschrieben: noch eine Preisänderung ändert den 12.11. nicht
  const {p: p2, c: c2} = await (async () => { const st = await p.evaluate(() => JSON.stringify(S)); const o = await L.open(b, {...L.DESK, at:[2026, 11, 13, 9, 0], init:`try{localStorage.setItem('dahuam202_kueche_de_v1', ${JSON.stringify(st)})}catch(e){}`}); return o; })();
  const d12 = () => p2.evaluate(() => { const r = report('2026-11-12', '2026-11-12'); return r.rows[0] && r.rows[0].cpp; });
  const x0 = await d12(); await p2.evaluate(() => { P('beef_goulash').price = P('beef_goulash').price * 2; save(); render(); }); const x1 = await d12();
  L.ok(x0 != null && Math.abs(x0 - x1) < 1e-9 && await p2.evaluate(() => S.costSnap.to === '2026-11-12'), 'am 13.11.: der 12.11. bleibt bei seinem Wareneinsatz', {x0, x1});
  // Hinweis in der Auswertung
  await ev(() => { view.rp.tab = 'sales'; view.rp.unit = 'month'; view.rp.ref = '2026-10-15'; view.rp.auto = true; go('report'); }); await w(300);
  L.ok(await ev(() => /Einkaufspreisen am jeweiligen Verkaufstag/.test(document.querySelector('#app').innerText)), 'Auswertung sagt in einem Satz, womit gerechnet wird');
  await L.shot(p, 'x03-auswertung-oktober', {full:false});
  await L.done(b, [...p.errs, ...p2.errs]);
})();
