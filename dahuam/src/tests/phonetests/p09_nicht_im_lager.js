// Inventur: „Nicht im Lager“ (p.invOff). Ein Tipp im Zähl-Blatt nimmt den Artikel aus der Zählung, mit Rückgängig;
// je Lagerort eine leise Zeile zum Anzeigen und Zurückholen; Ware, Buchung mit Plus, Scan und Zählung über 0 holen ihn von selbst zurück;
// ein neuer Import setzt die Markierung nicht zurück; am Laptop: Zeilen-Knopf und Schalter im Artikel.
const L = require('./lib');
const ev = (p, f, a) => p.evaluate(f, a);
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.IP13);
  const pid = n => ev(p, n => S.products.find(x => x.name === n).id, n);
  await L.tap(p, '.bottom [data-ph="mehr"]'); await L.tap(p, '#app [data-act="goStock"][data-id="inventur"]'); await L.tap(p, '#app [data-act="invStart"]');
  const rows = () => ev(p, () => [...document.querySelectorAll('#app [data-act="phInvLoc"]')].map(x => x.querySelector('.hy-n').textContent + ' ' + x.querySelector('.hy-tm b').textContent));
  const r0 = await rows(); const tot0 = await L.txt(p, '#app .hy-text');
  L.ok(r0[0] === '0/21 Kühlhaus' && /0 von 65 Artikeln gezählt/.test(tot0), 'Ausgangslage: Kühlhaus 0/21, 65 Artikel', {r0, tot0});
  await L.tap(p, '#app [data-act="phInvNext"]');
  L.ok(await ev(p, () => document.getElementById('phSheetT').textContent === 'Basilikumpesto' && !!document.querySelector('#phSheet [data-act="phCntOff"]')), 'das Zähl-Blatt hat „Nicht im Lager“');
  const btn = await ev(p, () => { const o = document.querySelector('#phSheet [data-act="phCntOff"]').getBoundingClientRect(), s = document.querySelector('#phSheet [data-act="phCntSave"]').getBoundingClientRect(); return {txt:document.querySelector('#phSheet [data-act="phCntOff"]').textContent, below:o.top > s.bottom, h:o.height, cls:document.querySelector('#phSheet [data-act="phCntOff"]').className}; });
  L.ok(btn.txt === 'Nicht im Lager' && btn.below && btn.h >= 44 && !/hy-btn(\s|$)/.test(btn.cls), 'leise unter dem Hauptknopf, kein zweiter Hauptknopf, ≥ 44 px', btn);
  const st0 = await ev(p, () => S.products.find(x => x.name === 'Basilikumpesto').stock);
  await L.tap(p, '#phSheet [data-act="phCntOff"]');
  const a1 = await ev(p, () => { const x = S.products.find(q => q.name === 'Basilikumpesto'); return {off:x.invOff, st:x.stock, t:document.getElementById('phSheetT').textContent, sub:document.querySelector('#phSheet .hy-sub').textContent, toast:document.getElementById('toast').textContent, prog:document.getElementById('phInvProg').textContent, offl:(document.querySelector('#app .hy-offl') || {}).textContent}; });
  L.ok(a1.off === true && a1.st === st0, 'markiert, Bestand bleibt', a1);
  L.ok(a1.t === 'Butter' && /Artikel 1 von 20/.test(a1.sub) && a1.prog === '0 von 20 gezählt', 'geht zum nächsten Artikel, die Liste hat jetzt 20', a1);
  L.ok(/Basilikumpesto: nicht im Lager/.test(a1.toast) && /Rückgängig/.test(a1.toast) && /1 nicht im Lager · anzeigen/.test(a1.offl || ''), 'Hinweis mit „Rückgängig“, leise Zeile im Lagerort', a1);
  // Rückgängig
  await p.click('#toast .toast-act'); await p.waitForTimeout(260);
  const u = await ev(p, () => ({off:S.products.find(q => q.name === 'Basilikumpesto').invOff, t:document.getElementById('phSheetT').textContent, prog:document.getElementById('phInvProg').textContent}));
  L.ok(u.off === undefined && u.t === 'Basilikumpesto' && u.prog === '0 von 21 gezählt', '„Rückgängig“ holt ihn zurück und zeigt ihn wieder', u);
  // mehrere hintereinander
  for(let i = 0; i < 3; i++) await L.tap(p, '#phSheet [data-act="phCntOff"]');
  L.ok(await ev(p, () => document.getElementById('phSheetT').textContent === 'Crème fraîche' && S.products.filter(x => x.invOff).length === 3), 'drei Artikel hintereinander mit je einem Tipp');
  await L.shot(p, 'p09-blatt');
  await L.tap(p, '#phSheet .hy-x');
  await L.tap(p, '#app .hy-offl [data-act="phInvOffShow"]');
  const sh = await ev(p, () => ({names:[...document.querySelectorAll('#app .hy-offs .hy-tm b')].map(x => x.textContent), lbl:document.querySelector('#app .hy-offl .hy-lnk').textContent, list:document.querySelectorAll('#app .hy-ck').length}));
  L.ok(JSON.stringify(sh.names) === JSON.stringify(['Basilikumpesto', 'Butter', 'Cheddar']) && sh.lbl === 'ausblenden' && sh.list === 18, '„anzeigen“ listet die drei; die Zählliste hat 18', sh);
  L.ok((await L.small(p, '#app')).length === 0 && (await L.contrast(p, '#app')).length === 0, 'Ziele ≥ 44 px, Kontrast ≥ 4,5:1', (await L.small(p, '#app')).concat(await L.contrast(p, '#app')));
  await L.shot(p, 'p09-lagerort');
  await p.evaluate(() => [...document.querySelectorAll('#app .hy-offs li')].find(x => /Cheddar/.test(x.textContent)).querySelector('[data-act="phInvOn"]').click()); await p.waitForTimeout(260);
  L.ok(await ev(p, () => S.products.find(q => q.name === 'Cheddar').invOff === undefined && document.getElementById('phInvProg').textContent === '0 von 19 gezählt' && /2 nicht im Lager/.test(document.querySelector('#app .hy-offl').textContent)), '„Wieder zählen“ holt Cheddar zurück');
  await L.tap(p, '#app .hy-back');
  const r1 = await rows(); const tot1 = await L.txt(p, '#app .hy-text');
  L.ok(r1[0] === '0/19 Kühlhaus' && /0 von 63 Artikeln gezählt/.test(tot1), 'Übersicht: 0/19, 63 Artikel', {r1, tot1});
  // Zählung über 0 aus der Suche holt zurück
  await L.tap(p, '.bottom [data-ph="such"]'); await p.fill('#phQ', 'Butter'); await p.waitForTimeout(150);
  await p.evaluate(() => [...document.querySelectorAll('#phRes [data-act="phArt"]')].find(x => /^Butter/.test(x.querySelector('.hy-tm b').textContent)).click()); await p.waitForTimeout(260);
  await p.fill('#phCntV', '2'); await L.tap(p, '#phSheet [data-act="phCntSave"]');
  L.ok(await ev(p, () => { const x = S.products.find(q => q.name === 'Butter'); return x.invOff === undefined && S.invDraft.counts[x.id] === 2; }), 'eine Zählung über 0 (Suche) holt Butter zurück');
  // Scan in der Inventur holt zurück
  const pp = await pid('Basilikumpesto');
  await ev(p, id => { const x = P(id); if(!eanOf(x).length) x.ean = ['4012345678901']; save(); }, pp);
  await ev(p, () => scanOpen('inv')); await p.waitForTimeout(300);
  await ev(p, id => scanGot(eanOf(P(id))[0], 'ean_13', 'manual'), pp); await p.waitForTimeout(300);
  L.ok(await ev(p, id => P(id).invOff === undefined && __scan.layer === 'count' && __scan.cnt.pid === id, pp), 'Scan in der Inventur: Artikel ist wieder dabei, das Zählblatt ist offen');
  await ev(p, () => scanClose()); await p.waitForTimeout(200);
  // Wareneingang, Buchung, Bestellung
  const f = ['Cheddar', 'Ei M', 'Crème fraîche']; for(const n of f) await ev(p, n => { invOffSet(S.products.find(x => x.name === n), true); save(); }, n);
  await ev(p, () => { const x = S.products.find(q => q.name === 'Cheddar'); receiveIn(x, 2, x.price, 'Lieferung', null); save(); });
  await ev(p, () => { addMove('out', S.products.find(q => q.name === 'Ei M').id, -3, 'Entnahme'); save(); });
  const w = await ev(p, () => ({ch:S.products.find(q => q.name === 'Cheddar').invOff, ei:S.products.find(q => q.name === 'Ei M').invOff}));
  L.ok(w.ch === undefined && w.ei === true, 'Wareneingang (Bestellung erhalten) holt zurück, eine Entnahme nicht', w);
  const ns = await L.noSide(p, 390); L.ok(ns.sw <= 390 && !ns.over.length, 'nichts ragt seitlich hinaus', ns);
  const errs = (p.errs || []).slice();
  // Laptop (frische Beispieldaten): Inventur läuft, Pesto und Cheddar sind nicht im Lager, Butter ist gezählt
  const {p:d} = await L.open(b, L.DESK);
  await d.evaluate(() => { S.invDraft = {date:new Date().toISOString(), counts:{}}; ['Basilikumpesto', 'Cheddar', 'Ei M'].forEach(n => invOffSet(S.products.find(x => x.name === n), true)); S.invDraft.counts[S.products.find(x => x.name === 'Butter').id] = 2; save(); });
  await L.go(d, 'ware/bestand');
  const eid = await d.evaluate(() => S.products.find(q => q.name === 'Ei M').id);
  await d.click(`#app [data-act="moveDlg"][data-id="in:${eid}"]`); await d.waitForTimeout(200); await d.fill('#dlgForm [name="qty"]', '10'); await d.click('#dlgForm button[type=submit]'); await d.waitForTimeout(300);
  L.ok(await d.evaluate(() => S.products.find(q => q.name === 'Ei M').invOff === undefined), 'Laptop: „Wareneingang buchen“ mit Plus holt zurück');
  // Import: bestehender Artikel behält die Markierung, neuer Artikel startet ohne
  await d.evaluate(() => { S.products.find(q => q.name === 'Crème fraîche').invOff = true; save(); });
  await d.evaluate(() => datenOpen('prod')); await d.waitForTimeout(250);
  await d.setInputFiles('#impFileIn', {name:'artikel.csv', mimeType:'text/csv', buffer:Buffer.from('Artikel;Preis;Lagerort\nCrème fraîche;4,40;Kühlhaus\nTestware Neu;2,10;Kühlhaus\n', 'utf8')}); await d.waitForTimeout(450);
  await d.click('#app [data-act="impApply"]'); await d.waitForTimeout(500);
  const imp = await d.evaluate(() => { const x = S.products.find(q => q.name === 'Crème fraîche'); const n = S.products.find(q => q.name === 'Testware Neu'); return {old:x.invOff, price:x.price, neu:n ? n.invOff : 'fehlt'}; });
  L.ok(imp.old === true && Math.abs(imp.price - 4.4) < 1e-6 && imp.neu === undefined, 'Import: Preis aktualisiert, Markierung bleibt; neuer Artikel wird gezählt', imp);
  // Laptop-Inventur: Zeilen-Knopf und Zeile zum Anzeigen
  await L.go(d, 'ware/inventur');
  const dk = await d.evaluate(() => ({prog:document.getElementById('invProg').textContent, has:!!document.querySelector('#app [data-act="invOff"]'), offl:[...document.querySelectorAll('#app .inv-offl')].map(x => x.textContent)}));
  L.ok(/ \/ 63$/.test(dk.prog) && dk.has && dk.offl.some(t => /3 nicht im Lager · anzeigen/.test(t)), 'Laptop: Zähler ohne die markierten (neu 66, davon 3 nicht im Lager), Knopf je Zeile, „3 nicht im Lager · anzeigen“', dk);
  const bid = await d.evaluate(() => S.products.find(q => q.name === 'Butter').id);
  await d.click(`#app [data-act="invOff"][data-id="${bid}"]`); await d.waitForTimeout(250);
  const dk2 = await d.evaluate(id => ({off:P(id).invOff, c:S.invDraft.counts[id], prog:document.getElementById('invProg').textContent, row:!!document.getElementById('ir-' + id), toast:document.getElementById('toast').textContent}), bid);
  L.ok(dk2.off === true && dk2.c === undefined && /\/ 62$/.test(dk2.prog) && !dk2.row && /Rückgängig/.test(dk2.toast), 'Laptop: „Nicht im Lager“ nimmt die Zeile heraus (auch die Zählung), mit Rückgängig', dk2);
  await d.click('#toast .toast-act'); await d.waitForTimeout(250);
  L.ok(await d.evaluate(id => P(id).invOff === undefined && S.invDraft.counts[id] === 2 && !!document.getElementById('ir-' + id), bid), 'Laptop: „Rückgängig“ holt Zeile und Zählung zurück');
  await d.click('#app .inv-offl [data-act="invOffShow"]'); await d.waitForTimeout(200);
  await d.evaluate(() => [...document.querySelectorAll('#app .inv-offs li')].find(x => /Crème/.test(x.textContent)).querySelector('[data-act="invOn"]').click()); await d.waitForTimeout(250);
  L.ok(await d.evaluate(() => S.products.find(q => q.name === 'Crème fraîche').invOff === undefined && /\/ 64$/.test(document.getElementById('invProg').textContent)), 'Laptop: „Wieder zählen“ in der Liste');
  // Artikel: Schalter „In der Inventur zählen“
  await d.evaluate(id => prodDialog(P(id)), bid); await d.waitForTimeout(200);
  L.ok(await d.evaluate(() => { const c = document.querySelector('#dlgForm [name="invOn"]'); return !!c && c.checked && /In der Inventur zählen/.test(c.closest('label').textContent); }), 'Artikel: Schalter „In der Inventur zählen“, eingeschaltet');
  await d.click('#dlgForm [name="invOn"] + span'); await d.click('#dlgForm button[type=submit]'); await d.waitForTimeout(300);
  L.ok(await d.evaluate(id => P(id).invOff === true && S.invDraft.counts[id] === undefined, bid), 'ausgeschaltet: nicht im Lager, Zählung weg');
  await d.evaluate(id => prodDialog(P(id)), bid); await d.waitForTimeout(200);
  L.ok(await d.evaluate(() => !document.querySelector('#dlgForm [name="invOn"]').checked), 'beim nächsten Öffnen steht der Schalter aus');
  await d.click('#dlgForm [name="invOn"] + span'); await d.click('#dlgForm button[type=submit]'); await d.waitForTimeout(300);
  L.ok(await d.evaluate(id => P(id).invOff === undefined, bid), 'wieder eingeschaltet: wird gezählt');
  // bleibt sonst überall: Suche, Bestand, Bestellen
  await d.evaluate(() => { S.products.find(q => q.name === 'Ei M').invOff = true; save(); render(); }); await L.go(d, 'ware/bestand');
  L.ok(await d.evaluate(() => [...document.querySelectorAll('#app table.stock .pn')].some(x => x.textContent === 'Ei M')), 'im Bestand bleibt der Artikel sichtbar');
  // Inventur abschließen zählt nur die gezählten, markierte bleiben unverändert
  const fin = await d.evaluate(() => { const x = S.products.find(q => q.name === 'Ei M'); const st = x.stock; const bu = S.products.find(q => q.name === 'Butter'); S.invDraft.counts[bu.id] = +bu.stock; save(); return st; });
  await L.go(d, 'ware/inventur'); await d.click('#app [data-act="invFinish"]'); await d.waitForTimeout(200); await d.click('#dlgForm button[type=submit]'); await d.waitForTimeout(300);
  L.ok(await d.evaluate(st => { const x = S.products.find(q => q.name === 'Ei M'); return !S.invDraft && x.stock === st && x.invOff === true; }, fin), 'Inventur abgeschlossen: der markierte Artikel bleibt unverändert und markiert');
  await L.done(b, errs.concat(d.errs || []));
})().catch(e => { console.error(e); process.exit(1); });
