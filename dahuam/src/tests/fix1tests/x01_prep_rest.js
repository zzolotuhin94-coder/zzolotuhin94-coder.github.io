// Befund 1 und 8: Prep-Liste rechnet mit dem, was vom Basisrezept noch da ist; Tagestyp und Portionen stehen oben.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.IPAD); const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
  await ev(() => { view.pl.off = 0; go('vorb'); }); await w(300);
  // Haltbarkeit aus der Rezeptur
  const sh = await ev(() => ({g:vbShelf(C('semi_goulash')), c:vbShelf(C('semi_caesar')), s:vbShelf(C('semi_strudel')), exp:vbExp(C('semi_goulash'), '2026-11-12')}));
  L.ok(sh.g.h === 72 && sh.c.h === 24 && sh.s === null && sh.exp === '2026-11-14', 'Haltbarkeit aus der Rezeptur: Gulasch 72 h (gekocht Do → verwenden bis Sa), Dressing 24 h, Strudel ohne Angabe', sh);
  // 8: Tagestyp und Portionen oben, direkt unter der Tageswahl
  const top = await ev(() => { const d = document.querySelector('#app .pl-days'), r = document.querySelector('#app .pl-dayrow'), pr = document.querySelector('#plPrep'); return {row:!!r, after:!!(d.compareDocumentPosition(r) & 4) && !!(r.compareDocumentPosition(pr) & 4), fac:r.querySelectorAll('[data-act="plFac"]').length, tot:r.querySelector('.pl-dayn b').textContent, sum:vbPlan(vbDay()).total, inFc:!!document.querySelector('#app .pl-fc [data-act="plFac"]')}; });
  L.ok(top.row && top.after && top.fac === 3 && top.tot === '≈ ' + top.sum && !top.inFc, 'ruhig / normal / volles Haus und die Portionen stehen unter der Tageswahl, vor der Prep-Liste (nicht mehr unter der Prognose)', top);
  await p.click('#app .pl-dayrow [data-act="plFac"][data-id="1.3"]'); await w(250);
  L.ok(await ev(() => S.plan.fac[vbDay()] === 1.3 && document.querySelector('#app .pl-dayrow .on').textContent.includes('volles Haus')), 'Schalter oben wirkt wie bisher');
  await p.click('#app .pl-dayrow [data-act="plFac"][data-id="1"]'); await w(200);
  // vorher: jeden Tag eine neue volle Charge
  const g0 = await ev(() => { const b = vbPlan(todayStr()).batches.find(x => x.c.id === 'semi_goulash'); return {n:b.n, need:b.need, have:b.have}; });
  L.ok(g0.n === 1 && g0.have === 0, 'heute: Gulasch 1 Charge (nichts eingetragen)', g0);
  // Charge abhaken → zählt als „noch da“ mit Ablauf aus der Haltbarkeit
  await p.click('#app .pl-c[data-id="b:semi_goulash"]'); await w(200);
  const ck = await ev(() => S.plan.cook[todayStr()].semi_goulash);
  L.ok(ck && ck.n === 1 && ck.g === 8000 && ck.exp === '2026-11-14', 'abgehakt: 8 kg gekocht am Do, verwenden bis Sa', ck);
  const mo = await ev(() => { const D = dAdd(todayStr(), 1); const pl = vbPlan(D); const h = pl.have.find(x => x.c.id === 'semi_goulash'); return {cook:pl.cook.some(x => x.c.id === 'semi_goulash'), have:h && Math.round(h.have), row:h && vbHaveRow(h, D)}; });
  L.ok(!mo.cook && mo.have === 8000 - g0.need && /reicht bis Sa 14\.11\./.test(mo.row.qty) && /verwenden bis Sa 14\.11\./.test(mo.row.sub), 'morgen: keine neue Gulasch-Charge, „noch da ≈ 7,1 kg · reicht bis Sa 14.11.“', mo);
  const so = await ev(() => vbPlan('2026-11-15').cook.some(x => x.c.id === 'semi_goulash'));
  L.ok(so, 'Sonntag (nach Ablauf): wieder eine Charge vorgeschlagen');
  // Rohzutaten folgen: Rindfleisch für Gulasch steht morgen nicht mehr auf der Entnahmeliste
  L.ok(await ev(() => !vbPlan(dAdd(todayStr(), 1)).prods.some(x => x.p.id === 'beef_goulash')), 'morgen kein Rindswadschinken für eine unnötige Charge');
  await ev(() => { view.pl.off = 1; render(); }); await w(250);
  L.ok(await ev(() => /Gulaschsuppe/.test(document.querySelector('#app .pl-have').innerText) && !document.querySelector('#app .pl-c[data-id="b:semi_goulash"]')), 'Ansicht Morgen: Gulasch unter „Noch da, keine neue Charge“');
  await L.shot(p, 'x01-prep-morgen-noch-da');
  // Häkchen weg → wieder wie vorher
  await ev(() => { view.pl.off = 0; render(); }); await w(150); await p.click('#app .pl-c[data-id="b:semi_goulash"]'); await w(150);
  L.ok(await ev(() => !(S.plan.cook[todayStr()] || {}).semi_goulash), 'Häkchen weg: die Charge zählt nicht mehr als gekocht');
  // ein vergangener Tag ohne Häkchen zählt nicht als gekocht: gestern nicht abgehakt → heute wieder eine Charge
  L.ok(await ev(() => { const y = dAdd(todayStr(), -2); S.plan.rest.semi_goulash = {g:2000, s:y, d:y, exp:null}; save(); const b = vbPlan(todayStr()).batches.find(x => x.c.id === 'semi_goulash'); const r = b.have > 0 && b.have < 2000; delete S.plan.rest.semi_goulash; save(); return r; }), 'vorgestern (Di) eingetragener Rest wird um den Verbrauch vom Di kleiner (geschätzt), der Ruhetag Mi zählt nicht');
  // „noch da“ von Hand: Dressing 0,5 kg, heute gekocht
  await p.click('#app [data-act="plRest"][data-id="semi_caesar"]'); await w(200);
  const dl = await ev(() => ({t:document.querySelector('#dlgForm h3').textContent, exp:document.querySelector('#dlgForm [name=exp]').value, hint:document.querySelector('#dlgForm .hint').textContent}));
  L.ok(/Caesar-Dressing/.test(dl.t) && dl.exp === '2026-11-12' && /Haltbarkeit laut Rezeptur: 24 h/.test(dl.hint), 'Dialog „Noch da“: Menge, gekocht am, verwenden bis aus der Haltbarkeit (24 h → heute)', dl);
  await p.fill('#dlgForm [name=kg]', '0,5'); await L.dlgOk(p);
  const cs = await ev(() => { const pl = vbPlan(todayStr()); return {cook:pl.cook.some(x => x.c.id === 'semi_caesar'), have:pl.have.some(x => x.c.id === 'semi_caesar'), rest:S.plan.rest.semi_caesar}; });
  L.ok(!cs.cook && cs.have && cs.rest.g === 500 && cs.rest.s === '2026-11-12', 'heute 0,5 kg Dressing da: keine Charge, steht unter „Noch da“', cs);
  L.ok(await ev(() => vbPlan(dAdd(todayStr(), 1)).cook.some(x => x.c.id === 'semi_caesar')), 'morgen ist das Dressing abgelaufen (24 h): wieder eine Charge');
  // 0 = nichts mehr da
  await p.click('#app [data-act="plRest"][data-id="semi_caesar"]'); await w(200); await p.fill('#dlgForm [name=kg]', '0'); await L.dlgOk(p);
  L.ok(await ev(() => vbPlan(todayStr()).cook.some(x => x.c.id === 'semi_caesar')), '0 kg: wieder eine Charge vorgeschlagen');
  // bleibt nach Neuladen
  await p.reload(); await L.ready(p); await ev(() => go('vorb')); await w(250);
  L.ok(await ev(() => S.plan.rest.semi_caesar && S.plan.rest.semi_caesar.g === 0), 'Eintrag bleibt nach Neuladen');
  // Team: sieht, kann nichts eintragen
  await L.team(p); await ev(() => go('vorb')); await w(200);
  L.ok(await ev(() => !document.querySelector('#app [data-act="plRest"]')), 'Team sieht keine „Rest eintragen“-Knöpfe');
  await L.chef(p);
  // Handy: keine waagrechte Scrollleiste, Zeile oben passt
  const m = await L.open(b, L.PHONE); await m.p.evaluate(() => go('vorb')); await m.p.waitForTimeout(300);
  L.ok(await L.noHScroll(m.p), 'Handy 390: keine waagrechte Scrollleiste');
  await L.shot(m.p, 'x01-prep-handy', {full:false});
  const dk = await L.open(b, {...L.IPADP, dark:true}); await dk.p.evaluate(() => { S.plan.rest.semi_goulash = {g:5000, s:todayStr(), d:todayStr(), exp:'2026-11-14'}; save(); go('vorb'); }); await dk.p.waitForTimeout(300);
  L.ok(await L.noHScroll(dk.p) && await dk.p.evaluate(() => /Gulaschsuppe/.test(document.querySelector('#app .pl-have').innerText)), 'iPad hoch, dunkel: „Noch da“ sichtbar, keine Scrollleiste');
  await L.shot(dk.p, 'x01-prep-ipad-dunkel', {full:false});
  await L.done(b, [...p.errs, ...m.p.errs, ...dk.p.errs]);
})();
