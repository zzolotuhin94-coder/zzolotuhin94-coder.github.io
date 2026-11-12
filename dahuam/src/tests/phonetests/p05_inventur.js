// Inventur am Handy: ein Lagerort nach dem anderen, ein Artikel je Blatt, dasselbe Zähl-Blatt wie in der Suche.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.IP13);
  await L.tap(p, '.bottom [data-ph="mehr"]'); await L.tap(p, '#app [data-act="goStock"][data-id="inventur"]');
  L.ok(await L.key(p) === 'inv' && await p.evaluate(() => !!document.querySelector('#app [data-act="invStart"]') && !document.querySelector('#app table') && !document.querySelector('#app .toolbar.tabs') && /Mehr/.test(document.querySelector('#app .hy-back').textContent)), 'Inventur: Erklärung, ein Knopf „Inventur starten“, frühere Inventuren als Zeilen');
  await L.tap(p, '#app [data-act="invStart"]');
  const g = await p.evaluate(() => [...document.querySelectorAll('#app [data-act="phInvLoc"]')].map(x => x.querySelector('.hy-n').textContent + ' ' + x.querySelector('.hy-tm b').textContent));
  L.ok(JSON.stringify(g) === JSON.stringify(['0/21 Kühlhaus', '0/3 Tiefkühler', '0/22 Trockenlager', '0/7 Gemüselager', '0/12 Bar & Weinkeller']), 'fünf Lagerorte mit Stand', g);
  L.ok((await L.txt(p, '#app [data-act="phInvNext"]')) === 'Mit Kühlhaus beginnen', 'ein Hauptknopf sagt, wo es weitergeht', await L.txt(p, '#app [data-act="phInvNext"]'));
  await L.tap(p, '#app [data-act="phInvNext"]');
  const s1 = await p.evaluate(() => ({h:decodeURIComponent(location.hash), t:document.getElementById('phSheetT').textContent, sub:document.querySelector('#phSheet .hy-sub').textContent, v:document.getElementById('phCntV').value, ph:document.getElementById('phCntV').placeholder, btn:document.querySelector('#phSheet [data-act="phCntSave"]').textContent, same:document.querySelector('#phSheet [data-act="phCntSame"]').textContent, h1:document.querySelector('#app .hy-h1').textContent}));
  L.ok(s1.h === '#ware/inventur/K' && s1.h1 === 'Kühlhaus' && s1.t === 'Basilikumpesto' && /Artikel 1 von 21/.test(s1.sub), 'der Lagerort öffnet sich, das Blatt zeigt den ersten Artikel', s1);
  L.ok(s1.v === '' && s1.ph === '1,5' && s1.btn === 'Speichern und weiter' && s1.same === 'Stimmt, 1,5 kg', 'leeres Feld, Bestand laut App als Hinweis, „Stimmt“ als Abkürzung', s1);
  await p.fill('#phCntV', '1,2'); await L.tap(p, '#phSheet [data-act="phCntSave"]');
  const s2 = await p.evaluate(() => ({t:document.getElementById('phSheetT').textContent, c:S.invDraft.counts[S.products.find(x => x.name === 'Basilikumpesto').id], prog:document.getElementById('phInvProg').textContent, first:document.querySelector('#app .hy-ck').classList.contains('on'), q:document.querySelector('#app .hy-ck .hy-cq').textContent, focus:document.activeElement.id}));
  L.ok(s2.t === 'Butter' && s2.c === 1.2 && s2.prog === '1 von 21 gezählt' && s2.first && /1,2\s*kg/.test(s2.q), '„Speichern und weiter“ trägt ein und zeigt den nächsten Artikel', s2);
  L.ok(s2.focus === 'phCntV', 'der Fokus steht gleich im Zahlenfeld');
  await L.tap(p, '#phSheet [data-act="phCntSame"]');
  L.ok(await p.evaluate(() => S.invDraft.counts[S.products.find(x => x.name === 'Butter').id] === 6 && document.getElementById('phSheetT').textContent === 'Cheddar'), '„Stimmt, 6 kg“ übernimmt den Bestand und geht weiter');
  await L.tap(p, '#phSheet [data-act="phCntSkip"]');
  L.ok(await p.evaluate(() => S.invDraft.counts[S.products.find(x => x.name === 'Cheddar').id] === undefined && document.getElementById('phSheetT').textContent === 'Crème fraîche'), '„Überspringen“ lässt den Artikel offen');
  await p.keyboard.type('3'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => S.invDraft.counts[S.products.find(x => x.name === 'Crème fraîche').id] === 3 && document.getElementById('phSheetT').textContent === 'Ei M'), 'Zahl tippen und Enter speichert auch');
  L.ok((await L.small(p, '#phSheet')).length === 0 && (await L.contrast(p, '#phSheet')).length === 0, 'Zähl-Blatt: Ziele ≥ 44 px, Kontrast ≥ 4,5:1', (await L.small(p, '#phSheet')).concat(await L.contrast(p, '#phSheet')));
  await L.shot(p, 'p05-zaehlen');
  await L.tap(p, '#phSheet .hy-x');
  // gezählten Artikel noch einmal öffnen
  await L.tap(p, '#app .hy-ck');
  L.ok(await p.evaluate(() => document.getElementById('phCntV').value === '1,2'), 'ein gezählter Artikel lässt sich antippen und ändern'); await L.tap(p, '#phSheet .hy-x');
  // Lagerort fertig
  await p.evaluate(() => { const d = S.invDraft; stockProducts().filter(x => x.loc === 'T').slice(1).forEach(x => { d.counts[x.id] = +x.stock; }); save(); });
  await L.tap(p, '#app .hy-back');
  L.ok(await p.evaluate(() => location.hash === '#ware/inventur' && document.querySelectorAll('#app [data-act="phInvLoc"]').length === 5), '„Inventur“ führt zurück zu den Lagerorten');
  await p.evaluate(() => document.querySelector('#app [data-act="phInvLoc"][data-id="T"]').click()); await p.waitForTimeout(250);
  await L.tap(p, '#app .hy-ck:not(.on)'); await p.fill('#phCntV', '40'); await L.tap(p, '#phSheet [data-act="phCntSave"]');
  const fin = await p.evaluate(() => ({hidden:document.getElementById('phSheet').hidden, toast:document.getElementById('toast').textContent, rows:[...document.querySelectorAll('#app [data-act="phInvLoc"]')].map(x => x.querySelector('.hy-n').textContent + (x.classList.contains('done') ? ' fertig' : x.classList.contains('now') ? ' jetzt' : ''))}));
  L.ok(fin.hidden && /Tiefkühler fertig gezählt/.test(fin.toast) && fin.rows[1] === '3/3 fertig' && fin.rows[0] === '3/21 jetzt', 'letzter Artikel gezählt: Lagerort ist fertig (grün), zurück zur Übersicht', fin);
  await p.goBack(); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => decodeURIComponent(location.hash) === '#ware/inventur/T' && document.querySelector('#app .hy-h1').textContent === 'Tiefkühler'), 'Zurück-Taste des Handys: wieder im Lagerort');
  await p.goForward(); await p.waitForTimeout(300);
  // Getränke
  await p.evaluate(() => document.querySelector('#app [data-act="phInvLoc"][data-id="W"]').click()); await p.waitForTimeout(250);
  await p.evaluate(() => [...document.querySelectorAll('#app .hy-ck')].find(x => /Zweigelt/.test(x.textContent)).click()); await p.waitForTimeout(250);
  await p.fill('#phCntV', '12'); await L.tap(p, '#phSheet [data-act="phCntT"][data-id="3"]');
  L.ok(await p.evaluate(() => document.getElementById('phCntV').value === '12' && document.querySelector('#phSheet [data-act="phCntT"][data-id="3"]').getAttribute('aria-pressed') === 'true'), 'Getränk: volle Flaschen bleiben stehen, wenn man das Zehntel wählt');
  await L.tap(p, '#phSheet [data-act="phCntSave"]');
  const z = await p.evaluate(() => { const x = S.products.find(q => /^Zweigelt/.test(q.name)); return {c:S.invDraft.counts[x.id], bar:S.invDraft.bar[x.id]}; });
  L.ok(Math.abs(z.c - 12.3 * 0.75) < 1e-6 && z.bar.f === 12 && z.bar.t === 3, '12 Flaschen und 0,3 offen stehen in Litern in der Inventur (wie am Laptop)', z);
  await L.tap(p, '#phSheet .hy-x'); await L.tap(p, '#app .hy-back');
  // Suche schreibt in die laufende Inventur
  await L.tap(p, '.bottom [data-ph="such"]'); await p.fill('#phQ', 'Cheddar'); await p.waitForTimeout(120); await L.tap(p, '#phRes [data-act="phArt"]');
  L.ok(/laufende Inventur/.test(await L.txt(p, '#phSheet .hy-was')), 'läuft eine Inventur, sagt das Zähl-Blatt in der Suche, wohin die Zahl geht');
  await p.fill('#phCntV', '1,5'); await L.tap(p, '#phSheet [data-act="phCntSave"]');
  L.ok(await p.evaluate(() => { const x = S.products.find(q => q.name === 'Cheddar'); return S.invDraft.counts[x.id] === 1.5 && x.stock === 2; }), 'die Zahl steht in der Inventur, der Bestand ändert sich erst beim Abschließen');
  // abschließen
  await L.tap(p, '.bottom [data-ph="mehr"]');
  L.ok(/läuft/.test(await L.txt(p, '#app [data-act="goStock"][data-id="inventur"]')), 'Mehr zeigt: Inventur läuft');
  await L.tap(p, '#app [data-act="goStock"][data-id="inventur"]');
  L.ok(/von 65 Artikeln gezählt, Differenz/.test(await L.txt(p, '#app')), 'Übersicht nennt Stand und Differenz');
  await L.tap(p, '#app [data-act="invFinish"]'); await p.click('#dlgForm button[type=submit]'); await p.waitForTimeout(400);
  const end = await p.evaluate(() => ({draft:S.invDraft, pesto:S.products.find(x => x.name === 'Basilikumpesto').stock, cheddar:S.products.find(x => x.name === 'Cheddar').stock, n:S.inventories.length, start:!!document.querySelector('#app [data-act="invStart"]')}));
  L.ok(end.draft === null && end.pesto === 1.2 && end.cheddar === 1.5 && end.n === 2 && end.start, '„Inventur abschließen“ setzt die Bestände und legt die Inventur ab', end);
  const ns = await L.noSide(p, 390); L.ok(ns.sw <= 390 && !ns.over.length, 'nichts ragt seitlich hinaus', ns);
  await L.done(b, p.errs); })();
