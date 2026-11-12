// Vorbereitung: Prep-Liste zuerst, dann die Prognose. Auf der Liste stehen Vorkochen und Hauptzutaten; Kleinmengen erst nach „Alle Zutaten zeigen“.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  // ein Tag, der sicher offen ist
  await p.evaluate(() => { let off = 0; while(off < 6 && vbForecast(dAdd(todayStr(), off)).closed) off++; view.pl.off = off; view.pl.allIng = false; go('vorb'); }); await p.waitForTimeout(400);
  const order = await p.evaluate(() => { const a = document.querySelector('#plPrep'), f = document.querySelector('#app .pl-fc'), m = document.querySelector('#app .pl-mise'); return {prepFirst:!!(a.compareDocumentPosition(f) & 4), fcBeforeMise:!!(f.compareDocumentPosition(m) & 4), top:[a, f].map(n => Math.round(n.getBoundingClientRect().top + scrollY))}; });
  L.ok(order.prepFirst && order.top[0] < order.top[1], 'Prep-Liste steht vor der Prognose', order);
  const plan = await p.evaluate(() => { const pl = vbPlan(vbDay()); const items = pl.groups.flatMap(g => g.items.map(i => ({g:g.k, key:i.key, name:i.name, minor:!!i.minor, bad:!!i.bad})));
    const prod = pl.prods.map(x => ({id:x.p.id, unit:x.p.unit, need:x.need, st:x.st, basic:x.p.basic})); return {items, prod, first:pl.groups[0].k, minor:PL_MINOR}; });
  // von Hand: Kleinmenge = Grundzutat (Kennzeichen) oder unter 0,2 kg/l und nicht fehlend
  const expMinor = new Set(plan.prod.filter(x => x.st !== 'miss' && (x.basic === true || (x.basic !== false && x.unit !== 'Stk' && x.need < 0.2))).map(x => 'p:' + x.id));
  const gotMinor = new Set(plan.items.filter(i => i.minor).map(i => i.key));
  L.ok(plan.minor === 0.2 && expMinor.size > 0 && expMinor.size === gotMinor.size && [...expMinor].every(k => gotMinor.has(k)), 'Kleinmengen: Grundzutaten und alles unter 200 g/ml (von Hand nachgerechnet)', {erwartet:expMinor.size, bekommen:gotMinor.size});
  L.ok(!plan.items.some(i => i.minor && (i.bad || i.g === 'b')), 'Fehlendes und Vorkochen gelten nie als Kleinmenge');
  const shown = await p.evaluate(() => ({keys:[...document.querySelectorAll('#plPrep .pl-c')].map(x => x.dataset.id), groups:[...document.querySelectorAll('#plPrep .pl-h3')].map(x => x.textContent), prog:document.querySelector('#plProg').textContent, btn:(document.querySelector('#plPrep [data-act="plAllIng"]') || {textContent:''}).textContent}));
  const main = plan.items.filter(i => !i.minor);
  L.ok(shown.keys.length === main.length && main.every(i => shown.keys.includes(i.key)) && ![...gotMinor].some(k => shown.keys.includes(k)), `gezeigt werden ${main.length} von ${plan.items.length}: Vorkochen und Hauptzutaten`, shown.keys.length);
  L.ok(plan.first === 'b' && shown.groups[0] === 'Vorkochen', '„Vorkochen“ steht ganz oben', shown.groups);
  L.ok(['salt','pepper','oil'].every(id => !shown.keys.includes('p:' + id)), 'Salz, Pfeffer und Öl stehen nicht auf der Liste');
  L.ok(shown.prog === `0 von ${main.length} erledigt` && new RegExp('Alle Zutaten zeigen · ' + gotMinor.size + ' Kleinmenge').test(shown.btn), 'Zähler zählt die gezeigten; der Knopf nennt die Zahl der Kleinmengen', [shown.prog, shown.btn]);
  await p.click('#plPrep [data-act="plAllIng"]'); await p.waitForTimeout(250);
  const all = await p.evaluate(() => ({n:document.querySelectorAll('#plPrep .pl-c').length, prog:document.querySelector('#plProg').textContent, btn:document.querySelector('#plPrep [data-act="plAllIng"]').textContent}));
  L.ok(all.n === plan.items.length && all.prog === `0 von ${plan.items.length} erledigt` && /Nur Hauptzutaten/.test(all.btn), '„Alle Zutaten zeigen“ zeigt alle ' + plan.items.length, all);
  // abgehakte Kleinmenge bleibt sichtbar
  const mk = [...gotMinor][0]; await p.click(`#plPrep .pl-c[data-id="${mk}"]`); await p.waitForTimeout(150); await p.click('#plPrep [data-act="plAllIng"]'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(k => !!document.querySelector(`#plPrep .pl-c.on[data-id="${k}"]`) && document.querySelector('#plProg').textContent.startsWith('1 von '), mk), 'eine abgehakte Kleinmenge bleibt in der kurzen Liste stehen');
  await p.click(`#plPrep .pl-c[data-id="${mk}"]`); await p.waitForTimeout(150);
  // Kennzeichen am Produkt
  await p.evaluate(() => { const x = vbPlan(vbDay()).prods.find(x => x.st !== 'miss' && !plMinor(x)); window.__pid = x.p.id; prodDialog(x.p); }); await p.waitForTimeout(250);
  await p.evaluate(() => { document.querySelector('#dlgForm [name="basic"]').click(); }); await p.click('#dlgForm button[type="submit"], #dlgForm .btn.primary'); await p.waitForTimeout(400);
  await L.go(p, 'vorbereitung'); L.ok(await p.evaluate(() => P(__pid).basic === true && !document.querySelector(`#plPrep .pl-c[data-id="p:${__pid}"]`)), 'Haken „Grundzutat“ am Produkt nimmt es von der Prep-Liste');
  // PDF-Vorlage folgt der Liste
  const pr = await p.evaluate(() => { const h = vbPrintHtml(vbDay()); const t = document.createElement('div'); t.innerHTML = h; return {salt:/>Salz</.test(h), n:t.querySelectorAll('.pp-l:not(.pp-d) li').length}; });
  L.ok(!pr.salt && pr.n === main.length - 1, 'die Liste zum Ausdrucken zeigt dieselben Zeilen', pr);
  // Grundlage der Prognose: zugeklappt
  L.ok(await p.evaluate(() => { const d = document.querySelector('#app details.pl-how'); return !!d && !d.open && /Wie die Prognose rechnet/.test(d.querySelector('summary').textContent) && !document.querySelector('#app .pl-top'); }), 'wie die Prognose rechnet, steht zugeklappt darunter');
  // Handy
  const m = await L.open(b, L.PHONE); await m.p.evaluate(() => { let off = 0; while(off < 6 && vbForecast(dAdd(todayStr(), off)).closed) off++; view.pl.off = off; go('vorb'); }); await m.p.waitForTimeout(400);
  const ph = await m.p.evaluate(() => ({sw:document.documentElement.scrollWidth, small:[...document.querySelectorAll('#plPrep .pl-c')].filter(x => x.getBoundingClientRect().height < 44).length, cut:[...document.querySelectorAll('#plPrep .pl-c-n')].filter(x => x.scrollWidth > x.clientWidth + 1).length, first:!!document.querySelector('#plPrep') && !document.querySelector('#app .pl-fc')}));   // Handy (phone.js): die Prognose bleibt zu, bis man „Ändern“ tippt
  L.ok(ph.sw === 390 && ph.small === 0 && ph.cut === 0 && ph.first, 'Handy: Breite 390, Zeilen ≥ 44 px, kein Name abgeschnitten, nur die Prep-Liste (Prognose erst über „Ändern“)', ph);
  await L.done(b, p.errs.concat(m.p.errs)); })();
