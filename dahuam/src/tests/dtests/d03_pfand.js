// Pfand und Leergut: Pfand je Flasche, Kiste, Fass. Nie im Wareneinsatz. Wareneingang erhöht den Stand je Lieferant, die Rückgabe senkt ihn.
const L = require('./lib'); const near = (a, b, e = 1e-6) => Math.abs(a - b) < e; const sp = s => String(s).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  // Beispieldaten: aus der gelieferten Bestellung stehen 2 Fässer × 30 + 3 Kisten × 6 + 2 Kisten × 6 = 90 € Pfand bei Getränke Wildalm
  L.ok(await p.evaluate(() => lgBalance('sup_getraenke') === 90 && lgBalance('sup_wein') === 0 && S.leergut.length === 1), 'Beispieldaten: € 90,00 Pfand bei Getränke Wildalm (2 Fässer, 5 Kisten geliefert)');
  // ---------- Bestellung: Ware und Pfand getrennt ----------
  await p.evaluate(() => { const o = newOrder('sup_getraenke', false); o.lines = [lineFor(P('bier'), 2), lineFor(P('weizen'), 3), lineFor(P('mineral'), 1)]; window.__oid = o.id; view.stab = 'bestellung'; view.order = o.id; save(); go('buy'); }); await p.waitForTimeout(300);
  // Ware: 2 × 66,00 + 3 × 19,00 + 1 × 10,08 = 199,08 · Pfand: 2 × 30 + 3 × 4,50 + 1 × 6 = 79,50
  const ed = await p.evaluate(() => { const o = ORD(window.__oid); const tf = [...document.querySelectorAll('#app table.otab tfoot tr')].map(tr => tr.textContent); const kv = document.querySelector('#app .panel.accent .kv').textContent; return {tot:orderTotal(o), pf:orderPfand(o), tf, kv, lines:o.lines.map(l => l.ou + ':' + l.f + ':' + l.price).join('|')}; });
  L.ok(near(ed.tot, 199.08) && ed.pf === 79.5 && ed.lines === 'Fass 30 l:30:66|Kiste 20×0,5 l:10:19|Kiste 24×0,33 l:7.92:10.08', 'Bestellung: 2 Fass + 3 Kisten Weißbier + 1 Kiste Mineral · Ware € 199,08 · Pfand 2×30 + 3×4,50 + 1×6 = € 79,50', ed);
  L.ok(ed.tf.length === 2 && /Summe exkl\. MwSt\..*199,08/.test(sp(ed.tf[0])) && /Pfand, kommt mit dem Leergut zurück.*79,50/.test(sp(ed.tf[1])) && /Ware€ 199,08Pfand€ 79,50Mindestbestellwert/.test(sp(ed.kv).replace(/ /g, '').replace('€199,08', '€ 199,08').replace('€79,50', '€ 79,50')), 'Positionen: Summe der Ware, darunter eigene Zeile „Pfand“; rechts „Ware“ und „Pfand“ getrennt', [ed.tf.map(sp), sp(ed.kv)]);
  L.ok(await p.evaluate(() => /Noch € 100,92 bis zum Mindestbestellwert/.test(document.querySelector('#app .panel.accent').textContent.replace(/ /g, ' '))), 'Mindestbestellwert zählt nur die Ware (300 − 199,08), nicht das Pfand');
  L.ok(await p.evaluate(() => !/Pfand/.test(orderText(ORD(window.__oid)))), 'Bestelltext an den Lieferanten: unverändert, ohne Pfand-Rechnung');
  await L.shot(p, 'd03-bestellung-pfand');
  // Bestellung nur mit Lebensmitteln: keine Pfand-Zeile
  L.ok(await p.evaluate(() => { const o = S.orders.find(x => x.supplier === 'sup_molk'); view.order = o.id; render(); const r = !document.querySelector('#app .pf-row') && !/Pfand/.test(document.querySelector('#app').textContent); view.order = window.__oid; render(); return r; }), 'Bestellung ohne Getränke: das Wort Pfand kommt nicht vor');
  // ---------- senden, Wareneingang: 1 Fass fehlt ----------
  await p.click('#app [data-act=ordMarkSent]'); await p.waitForTimeout(300); await p.click('#app [data-act=ordRecv]'); await p.waitForTimeout(300);
  L.ok(/Das Pfand der gelieferten Gebinde wird beim Leergut des Lieferanten vermerkt/.test(await p.evaluate(() => document.querySelector('#app .recv').closest('section').textContent)), 'Wareneingang: ein Satz sagt, dass das Pfand vermerkt wird');
  await p.fill('#rd-0', '1'); await p.keyboard.press('Tab'); await p.waitForTimeout(150);
  const st0 = await p.evaluate(() => ({bier:P('bier').stock, weizen:P('weizen').stock, price:P('bier').price}));
  await p.click('#app [data-act=rBook]'); await p.waitForTimeout(400);
  // geliefert: 1 Fass (30) + 3 Kisten (13,50) + 1 Kiste (6) = 49,50
  const rb = await p.evaluate(() => { const o = ORD(window.__oid); return {bal:lgBalance('sup_getraenke'), e:S.leergut[0], pf:o.receipt.pfand, pfD:orderPfand(o, true), pfO:orderPfand(o), bier:P('bier').stock, weizen:P('weizen').stock, price:P('bier').price, cost:totals(C('dk_bier')).cost, toast:document.querySelector('#toast').textContent, tf:[...document.querySelectorAll('#app table.otab tfoot tr')].map(tr => tr.textContent)}; });
  L.ok(rb.bal === 139.5 && rb.e.amt === 49.5 && rb.e.sup === 'sup_getraenke' && /^Lieferung B-/.test(rb.e.note) && rb.pf === 49.5 && rb.pfD === 49.5 && rb.pfO === 79.5 && /Pfand € 49,50 beim Leergut vermerkt/.test(sp(rb.toast)), 'eingebucht mit 1 statt 2 Fässern: Pfand nur für Geliefertes, 30 + 13,50 + 6 = € 49,50 · Stand 90 + 49,50 = € 139,50', rb);
  L.ok(near(rb.bier, st0.bier + 30) && near(rb.weizen, st0.weizen + 30) && rb.price === st0.price && near(rb.cost, 0.5 * 2.2 / 0.95), 'Lager: +30 l Bier, +30 l Weißbier; Einkaufspreis und Wareneinsatz bleiben (Pfand fließt nirgends ein)', [rb.bier, rb.weizen, rb.price, rb.cost]);
  L.ok(/Pfand, kommt mit dem Leergut zurück.*79,50.*geliefert.*49,50/.test(sp(rb.tf[1])), 'Bestellung nach dem Eingang: Pfand bestellt € 79,50 · geliefert € 49,50', rb.tf.map(sp));
  // ---------- Lieferanten: die Liste ----------
  await p.evaluate(() => { view.order = null; }); await L.go(p, 'ware/lieferanten');
  const ls = await p.evaluate(() => ({h:document.querySelector('#app .lg-l').previousElementSibling.textContent, rows:[...document.querySelectorAll('#app .lg-l li')].map(li => li.textContent), prim:document.querySelectorAll('#app .btn.primary').length, order:[...document.querySelectorAll('#app h2.sec-h')].map(h => h.firstChild.textContent)}));
  L.ok(/^LeergutPfand, das bei den Lieferanten steht: € 139,50$/.test(sp(ls.h)) && ls.rows.length === 1 && /^Getränke Wildalm\d\d\.\d\d\.\d{4} · geliefert € 49,50€ 139,50Leergut zurückgeben$/.test(sp(ls.rows[0])) && ls.prim === 1 && ls.order.join('|') === 'Leergut|Preisentwicklung', 'Ware › Lieferanten: eine ruhige Liste „Leergut“ (nur Lieferanten mit Pfand), ein Hauptknopf auf der Seite', ls);
  await L.shot(p, 'd03-lieferanten-leergut'); await L.theme(p, 'dark'); await L.shot(p, 'd03-lieferanten-leergut-dunkel'); await L.theme(p, 'light');
  // ---------- Rückgabe ----------
  await p.click('#app [data-act=lgReturn]'); await p.waitForTimeout(300);
  const dl = await p.evaluate(() => ({p:document.querySelector('#dlgForm .dlg-p').textContent, kinds:[...document.querySelectorAll('#dlgForm .lg-kr')].map(l => l.textContent)}));
  L.ok(/Getränke Wildalm · Pfand offen € 139,50/.test(sp(dl.p)) && dl.kinds.length === 4 && /^Fass 30 l€ 30,00 Pfand je Fass$/.test(sp(dl.kinds[0])) && /^Kiste€ 6,00 Pfand je Kiste · 24×0,33 l, 24×0,35 l$/.test(sp(dl.kinds[1])) && /^Kiste 20×0,5 l€ 4,50 Pfand je Kiste$/.test(sp(dl.kinds[2])) && /^Kiste 6×1 l€ 3,00 Pfand je Kiste$/.test(sp(dl.kinds[3])), 'Dialog „Leergut zurückgeben“: je Pfandsatz eine Zeile (Fass € 30, Kisten € 6, € 4,50 und € 3)', dl);
  await L.dlgOk(p);
  L.ok(await p.evaluate(() => document.querySelector('#dlg').open && /Bitte eintragen, was zurückgeht/.test(document.querySelector('#dlgForm .f-err').textContent)), 'ohne Angabe: Hinweis, nichts gebucht');
  await p.fill('#dlgForm [name=k0]', '1'); await p.fill('#dlgForm [name=k2]', '3'); await p.waitForTimeout(100);
  L.ok(/Zurück: € 43,50 · danach offen € 96,00/.test(sp(await p.evaluate(() => document.querySelector('#lgSum').textContent))), '1 Fass + 3 Kisten: „Zurück: € 43,50 · danach offen € 96,00“');
  await L.shot(p, 'd03-leergut-dialog', {full:false});
  await L.dlgOk(p);
  L.ok(await p.evaluate(() => lgBalance('sup_getraenke') === 96 && S.leergut[0].amt === -43.5 && S.leergut[0].ret === true && /Rückgabe: 1 × Fass 30 l, 3 × Kiste 20×0,5 l/.test(S.leergut[0].note)) && /Leergut zurück an Getränke Wildalm: € 43,50 · offen € 96,00/.test(sp(await L.toast(p))), 'gebucht: Stand € 96,00, Buchung mit Text', await L.toast(p));
  L.ok(await p.evaluate(() => P('bier').stock) === rb.bier, 'Rückgabe ändert keinen Warenbestand');
  // Gutschrift als Betrag
  await p.click('#app [data-act=lgReturn]'); await p.waitForTimeout(250); await p.fill('#dlgForm [name=amt]', '6'); await L.dlgOk(p);
  L.ok(await p.evaluate(() => lgBalance('sup_getraenke')) === 90, 'Betrag laut Gutschrift € 6,00: Stand € 90,00');
  // stornieren
  await p.click('#app [data-act=lgReturn]'); await p.waitForTimeout(250);
  const hi = await p.evaluate(() => { document.querySelector('#dlgForm .lg-h').open = true; return [...document.querySelectorAll('#dlgForm .lg-h li')].map(li => li.textContent.replace(/\s+/g, ' ') + (li.querySelector('[data-lgundo]') ? ' [x]' : '')); });
  L.ok(hi.length === 4 && /\[x\]$/.test(hi[0]) && /\[x\]$/.test(hi[1]) && !/\[x\]$/.test(hi[2]) && !/\[x\]$/.test(hi[3]), 'Letzte Buchungen: Rückgaben lassen sich stornieren, Lieferungen nicht (die gehören zum Wareneingang)', hi);
  await p.click('#dlgForm [data-lgundo]'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => lgBalance('sup_getraenke') === 96 && !document.querySelector('#dlg').open), 'Rückgabe storniert: Stand wieder € 96,00');
  // ---------- Lieferung ohne Bestellung ----------
  await p.evaluate(() => moveDlg('in:weizen')); await p.fill('#dlgForm [name=qty]', '2'); await L.dlgOk(p);
  L.ok(await p.evaluate(() => lgBalance('sup_getraenke') === 105 && S.moves[0].lg === S.leergut[0].id && S.leergut[0].amt === 9) && /Pfand € 9,00 beim Leergut vermerkt/.test(sp(await L.toast(p))), 'Lieferung ohne Bestellung, 2 Kisten Weißbier: Pfand 2 × 4,50 = € 9,00 dazu', await L.toast(p));
  await p.evaluate(() => { undoMove(S.moves[0]); save(); });
  L.ok(await p.evaluate(() => lgBalance('sup_getraenke')) === 96, 'Buchung storniert: das Pfand geht mit zurück');
  await p.evaluate(() => moveDlg('in:pork')); await p.fill('#dlgForm [name=qty]', '2'); await L.dlgOk(p);
  L.ok(await p.evaluate(() => S.leergut.length === 3) && !/Pfand/.test(await L.toast(p)), 'Wareneingang Fleisch: kein Pfand');
  // ---------- Rollen: Team gibt Leergut zurück, Sätze ändert nur der Chef ----------
  await L.team(p); await L.go(p, 'ware/lieferanten');
  L.ok(await p.evaluate(() => !document.querySelector('#app [data-act=lgReturn]').disabled && document.querySelector('#app [data-act=supEdit]').disabled), 'Team: „Leergut zurückgeben“ ist frei, „Lieferant bearbeiten“ gesperrt');
  await p.click('#app [data-act=lgReturn]'); await p.waitForTimeout(250); await p.fill('#dlgForm [name=k1]', '2'); await L.dlgOk(p);
  L.ok(await p.evaluate(() => lgBalance('sup_getraenke') === 84 && S.leergut[0].by === 'u_staff'), 'Team bucht 2 Kisten zurück: € 84,00, mit Namen vermerkt');
  L.ok(await p.evaluate(() => { prodDialog(P('weizen')); const open = document.querySelector('#dlg').open; return !open; }) && /nur der Chef/.test(await L.toast(p)), 'Team: Pfandsatz am Artikel nicht änderbar (Artikel-Dialog öffnet nicht)');
  await L.chef(p);
  // gespeichert und neu geladen
  await L.idle(p); await p.reload(); await L.ready(p);
  L.ok(await p.evaluate(() => lgBalance('sup_getraenke') === 84 && S.leergut.length === 4 && ORD(S.orders.find(o => o.receipt && o.receipt.pfand === 49.5).id).lines[0].pf === 30), 'neu geladen: Leergut-Buchungen und Pfand der Bestellung sind gespeichert');
  // Lieferant ohne Pfand-Artikel und ohne Stand: nicht in der Liste; leerer Betrieb: kein Abschnitt
  L.ok(await p.evaluate(() => { const keep = S; S = leerState(); const h = supplierView(); S = keep; return !/Leergut/.test(h); }), 'Betrieb ohne Getränke: der Abschnitt „Leergut“ erscheint gar nicht');
  await L.done(b, p.errs); })();
