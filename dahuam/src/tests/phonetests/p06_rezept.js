// Rezepte am Handy: Liste mit einem Suchfeld, jede Rezeptur öffnet in der Küchen-Ansicht (auch für den Chef). Kalkulation bleibt erreichbar, aber aus dem Weg.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.IP13);
  await L.tap(p, '.bottom [data-ph="mehr"]'); await L.tap(p, '#app [data-tab="cards"]');
  const g = await p.evaluate(() => ({k:document.getElementById('app').dataset.ph, secs:[...document.querySelectorAll('#phRl .hy-sec')].map(x => x.firstChild.textContent), n:document.querySelectorAll('#phRl [data-act="openCard"]').length, tables:document.querySelectorAll('#app table').length, back:document.querySelector('#app .hy-back').textContent, money:/€/.test(document.getElementById('app').textContent)}));
  L.ok(g.k === 'rez' && g.secs.join() === 'Gerichte,Basisrezepte,Getränke' && g.n === 26 && g.tables === 0 && g.back === 'Mehr', 'Rezepte: drei Gruppen, große Zeilen, keine Tabelle', g);
  L.ok(!g.money, 'in der Liste stehen keine Preise');
  await p.fill('#phRq', 'kaiser'); await p.waitForTimeout(150);
  L.ok(await p.evaluate(() => document.querySelectorAll('#phRl [data-act="openCard"]').length === 1 && document.activeElement.id === 'phRq'), 'das Suchfeld filtert beim Tippen');
  await L.tap(p, '#phRl [data-act="openCard"]');
  const k = await p.evaluate(() => ({k:document.getElementById('app').dataset.ph, mode:rzMode(C(view.card)), chef:canEditAll(), bar:getComputedStyle(document.querySelector('#app .rz-bar')).display, h1:document.querySelector('#app .rz-h h1').textContent, hash:decodeURIComponent(location.hash), q:(() => { const x = document.querySelector('#app .rz-q'); const r = x.getBoundingClientRect(); const t = document.querySelector('#app .rz-t').getBoundingClientRect(); return {left:Math.round(r.left), size:parseFloat(getComputedStyle(x).fontSize), before:r.left < t.left}; })(), money:/€/.test(document.querySelector('#app .rz').textContent)}));
  L.ok(k.k === 'rezk' && k.mode === 'kueche' && k.chef, 'auch als Chef öffnet die Rezeptur am Handy in der Küchen-Ansicht', k);
  L.ok(k.bar === 'none' && /^#rezepte\/dish_kaiser$/.test(k.hash), 'der Umschalter Kalkulation/Küche/Service ist aus dem Weg', k.hash);
  L.ok(k.q.left === 20 && k.q.size >= 24 && k.q.before && !k.money, 'Menge groß und links, Zutat daneben, keine Preise', k.q);
  await L.tap(p, '#app [data-act="rzN"][data-id="5"]');
  L.ok(/^600\s*g/.test(await L.txt(p, '#app .rz-q')) && /für 5 Portionen/.test(await L.txt(p, '#app .rz-sec h2')), '×5 rechnet die Mengen um (120 g → 600 g)', await L.txt(p, '#app .rz-q'));
  await L.tap(p, '#app .rz-i');
  L.ok(await p.evaluate(() => document.querySelector('#app .rz-ing li').classList.contains('done')), 'antippen hakt eine Zutat ab');
  L.ok((await L.small(p, '#app')).length === 0, 'alle Ziele ≥ 44 px', await L.small(p, '#app'));
  L.ok((await L.contrast(p, '#app')).filter(x => !/rz-q|rz-t/.test(x)).length === 0, 'Kontrast ≥ 4,5:1 (abgehakte Zutat ausgenommen)', await L.contrast(p, '#app'));
  const ns = await L.noSide(p, 390); L.ok(ns.sw <= 390 && !ns.over.length, 'nichts ragt seitlich hinaus', ns);
  // Basisrezept und zurück
  await L.tap(p, '#app [data-act="rzOpen"]');
  L.ok(/Heidelbeerkompott/.test(await L.txt(p, '#app .rz-h h1')) && /Zurück zu Kaiserschmarrn/.test(await L.txt(p, '#app .back')), 'ein Basisrezept öffnet sich aus der Zeile, Zurück führt zum Gericht');
  await L.tap(p, '#app .back');
  L.ok(/Kaiserschmarrn/.test(await L.txt(p, '#app .rz-h h1')), 'zurück beim Gericht');
  // Kalkulation bleibt erreichbar
  await p.evaluate(() => document.querySelector('#app .hy-rzmore [data-act="rzView"][data-id="kalk"]').click()); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => rzMode(C(view.card)) === 'kalk' && getComputedStyle(document.querySelector('#app .rz-sw')).display !== 'none'), '„Kalkulation ansehen“ ganz unten öffnet die Kalkulation, dort ist der Umschalter wieder da');
  await p.evaluate(() => document.querySelector('#app [data-act="rzView"][data-id="kueche"]').click()); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => rzMode(C(view.card)) === 'kueche'), 'und zurück in die Küche');
  await L.tap(p, '#app .back');
  L.ok(await L.key(p) === 'rez' && await p.evaluate(() => document.getElementById('phRq').value === 'kaiser'), '„Alle Rezepturen“ führt zur Liste, der Filter steht noch');
  await L.tap(p, '#app .hy-back'); L.ok(await L.key(p) === 'mehr', '„Mehr“ führt zurück');
  // Team sieht dasselbe, ohne Kalkulation
  await p.evaluate(() => { const u = S.settings.users.find(x => roleNorm(x.role) !== 'chef'); S.settings.currentUser = u.id; save(); go('cards', 'dish_kaiser'); }); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => rzMode(C(view.card)) === 'kueche' && !document.querySelector('#app .hy-rzmore')), 'Team: Küchen-Ansicht ohne den Weg zur Kalkulation');
  // Laptop: Chef bleibt bei der Kalkulation
  const d = await L.open(b, L.DESK); await d.p.evaluate(() => go('cards', 'dish_kaiser')); await d.p.waitForTimeout(300);
  L.ok(await d.p.evaluate(() => rzMode(C(view.card)) === 'kalk' && !!document.querySelector('#app .rz-sw')), 'am Laptop öffnet der Chef weiter die Kalkulation');
  await L.done(b, p.errs.concat(d.p.errs)); })();
