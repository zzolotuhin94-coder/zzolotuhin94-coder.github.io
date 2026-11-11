// Rollen nach Paket C. Team darf: Wareneingang (mit und ohne Bestellung), Schwund, in einer laufenden Inventur zählen.
// Chef-Sache bleibt: Inventur starten/abschließen/verwerfen, Entnahme, Preise, Rezepturen, Karte, Einstellungen, Importe, leer starten.
const L = require('./lib');
const dlgOpen = p => p.evaluate(() => document.querySelector('#dlg').open);
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  // Chef startet eine Inventur und legt eine gesendete Bestellung an
  await p.evaluate(() => { S.invDraft = {date:new Date().toISOString(), counts:{}}; const sp = S.suppliers.find(s => s.id === 'sup_molk'); const o = S.orders.find(x => x.supplier === 'sup_molk' && x.status === 'confirmed'); window.__oid = o.id; save(); });
  await L.go(p, 'einstellungen'); await p.click('#app .who-b:nth-child(2)'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => me().role === 'team' && !canEditAll()) && /ansehen, abhaken, Ware annehmen, Schwund buchen, Bestellungen vorbereiten/.test(await p.evaluate(() => document.querySelector('#app .who-b:nth-child(2) .who-can').textContent)), 'Team: die Karte in den Einstellungen sagt, was das Team darf');
  // ---------- Schwund ----------
  await L.go(p, 'ware/bestand');
  const bt = await p.evaluate(() => ({waste:document.querySelector('#app .page-h [data-act="moveDlg"][data-id="waste"]').disabled, in:document.querySelector('#app tr[data-id="pork"] [data-act="moveDlg"][data-id="in:pork"]').disabled, out:document.querySelector('#app [data-act="moveDlg"][data-id="out:pork"]').disabled, edit:!document.querySelector('#app tr[data-id="pork"]') || document.querySelector('#app [data-act="editProd"][data-id="pork"]').disabled}));
  L.ok(bt.waste === false && bt.in === false && bt.out === true && bt.edit === true, 'Bestand: „Schwund buchen“ und Wareneingang (+) sind frei; Entnahme (−) und Bearbeiten gesperrt', bt);
  const s0 = await p.evaluate(() => ({st:P('parsley').stock, n:S.moves.length}));
  await p.click('#app .page-h [data-act="moveDlg"][data-id="waste"]'); await p.waitForTimeout(250);
  L.ok(await dlgOpen(p) && await p.evaluate(() => document.querySelector('#dlgForm h3').textContent === 'Schwund buchen'), 'Team öffnet „Schwund buchen“');
  await p.selectOption('#mvPid', 'parsley'); await p.fill('#dlgForm input[name="qty"]', '0,1'); await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(350);
  L.ok(await p.evaluate(v => Math.abs(P('parsley').stock - (v.st - 0.1)) < 1e-9 && S.moves.length === v.n + 1 && S.moves[0].type === 'waste', s0), 'Schwund gebucht: Bestand sinkt, Buchung steht im Verlauf');
  // ---------- Wareneingang ohne Bestellung ----------
  const p0 = await p.evaluate(() => ({price:P('pork').price, st:P('pork').stock, demo:P('pork').priceDemo}));
  await p.click('#app tr[data-id="pork"] [data-act="moveDlg"][data-id="in:pork"]'); await p.waitForTimeout(250);
  L.ok(await dlgOpen(p) && await p.evaluate(() => document.querySelector('#dlgForm h3').textContent === 'Wareneingang buchen' && !document.querySelector('#dlgForm [name="price"]') && !document.querySelector('#dlgForm [name="upd"]')), 'Team bucht Wareneingang; Preis und „in die Kalkulation übernehmen“ gibt es für das Team nicht');
  await p.fill('#dlgForm input[name="qty"]', '4'); await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(350);
  L.ok(await p.evaluate(v => P('pork').stock === v.st + 4 && P('pork').price === v.price && P('pork').priceDemo === v.demo && S.moves[0].type === 'in' && S.moves[0].price === v.price, p0), 'Menge im Lager, der Einkaufspreis bleibt unverändert');
  await L.go(p, 'ware/bestellen'); L.ok(await p.evaluate(() => !document.querySelector('#app .page-h [data-act="moveDlg"][data-id="in"]').disabled), '„Lieferung ohne Bestellung“ ist frei');
  await p.evaluate(() => moveDlg('out')); await p.waitForTimeout(200); L.ok(!(await dlgOpen(p)) && /nur der Chef/.test(await L.toast(p)), 'Entnahme: gesperrt, mit Hinweis', await L.toast(p));
  // ---------- Wareneingang zu einer Bestellung ----------
  await p.evaluate(() => { view.stab = 'bestellung'; view.order = __oid; view.recv = null; go('buy'); }); await p.waitForTimeout(300);
  const ob = await p.evaluate(() => { const x = document.querySelector('#app [data-act="ordRecv"]'); return x ? x.disabled : null; });
  L.ok(ob === false, 'Bestellung: „Wareneingang“ ist für das Team frei', ob);
  await p.click('#app [data-act="ordRecv"]'); await p.waitForTimeout(350);
  const rf = await p.evaluate(() => ({all:document.querySelector('#app [data-act="rAll"]').disabled, book:document.querySelector('#app [data-act="rBook"]').disabled, rd:document.querySelector('#app input[data-rd]').disabled}));
  L.ok(rf.all === false && rf.book === false && rf.rd === false, 'Wareneingang prüfen: „Alles wie bestellt“, Mengenfelder und „Einbuchen“ sind frei', rf);
  const o0 = await p.evaluate(() => { const o = ORD(__oid); return {lines:o.lines.map(l => [l.pid, l.n * l.f, P(l.pid).stock, P(l.pid).price]), n:S.moves.length}; });
  await p.click('#app [data-act="rAll"]'); await p.waitForTimeout(250);
  await p.fill('#app input[data-rp="0"]', '9,99'); await p.keyboard.press('Tab'); await p.waitForTimeout(250);   // Rechnungspreis weicht ab
  await p.click('#app [data-act="rBook"]'); await p.waitForTimeout(300); if(await dlgOpen(p)){ await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(400); }
  const o1 = await p.evaluate(v => { const o = ORD(__oid); return {status:o.status, by:o.receipt && o.receipt.checkedBy, stock:v.lines.every(([pid, q, st]) => Math.abs(P(pid).stock - (st + q)) < 1e-6), price:v.lines.every(([pid, , , pr]) => P(pid).price === pr), moves:S.moves.length - v.n, inv:o.lines[0].invPrice}; }, o0);
  L.ok(['delivered', 'complaint'].includes(o1.status) && o1.stock && o1.moves === o0.lines.length, 'Team bucht die Lieferung ein: Bestände steigen um die bestellten Mengen', o1);
  L.ok(o1.price && o1.inv === 9.99, 'der abweichende Rechnungspreis steht an der Bestellung, die Einkaufspreise der Kalkulation ändert das Team nicht', o1);
  // ---------- Inventur ----------
  await L.go(p, 'ware/inventur');
  const iv = await p.evaluate(() => ({inp:document.querySelector('#app input[data-inv]').disabled, fin:document.querySelector('#app [data-act="invFinish"]').disabled, can:document.querySelector('#app [data-act="invCancel"]').disabled}));
  L.ok(iv.inp === false && iv.fin === true && iv.can === true, 'laufende Inventur: Zählfelder frei; „Abschließen“ und „Verwerfen“ gesperrt', iv);
  await p.fill('#app input[data-inv="pork"]', '11,5'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => S.invDraft.counts.pork === 11.5 && document.querySelector('#ir-pork').classList.contains('counted')), 'Team trägt eine Zählmenge ein');
  await p.evaluate(() => { const x = document.querySelector('#app [data-act="invFinish"]'); x.disabled = false; x.click(); }); await p.waitForTimeout(250);
  L.ok(!(await dlgOpen(p)) && await p.evaluate(() => !!S.invDraft) && /nur der Chef/.test(await L.toast(p)), 'Abschließen: gesperrt, die Inventur läuft weiter');
  await p.evaluate(() => { const x = document.querySelector('#app [data-act="invCancel"]'); x.disabled = false; x.click(); }); await p.waitForTimeout(250);
  L.ok(!(await dlgOpen(p)) && await p.evaluate(() => !!S.invDraft && S.invDraft.counts.pork === 11.5), 'Verwerfen: gesperrt');
  await p.evaluate(() => { S.invDraft = null; save(); render(); }); await p.waitForTimeout(200);
  L.ok(await p.evaluate(() => { const x = document.querySelector('#app [data-act="invStart"]'); return !!x && x.disabled; }), 'ohne laufende Inventur: „Inventur starten“ bleibt beim Chef');
  // ---------- weiterhin gesperrt ----------
  await L.go(p, 'ware/preise'); L.ok(await p.evaluate(() => document.querySelector('#app input[data-pp]').disabled && (!document.querySelector('#app [data-act="plImport"]') || document.querySelector('#app [data-act="plImport"]').disabled)), 'Preise und Preisliste: gesperrt');
  await p.evaluate(() => algDialog(P('fries'))); await p.waitForTimeout(200); L.ok(!(await dlgOpen(p)), 'Allergene eines Artikels: gesperrt');
  await p.evaluate(() => recPasteDialog('dish_goulash')); await p.waitForTimeout(200); L.ok(!(await dlgOpen(p)), '„Rezeptur einfügen“: gesperrt');
  await L.go(p, 'speisekarte'); L.ok(await p.evaluate(() => document.querySelector('#app input[data-mp]').disabled), 'Speisekarte: gesperrt');
  await p.evaluate(() => secDialog()); await p.waitForTimeout(250); const sv0 = await p.evaluate(() => JSON.stringify(S.settings.secVat));
  await p.selectOption('#dlgForm select[data-secvat="0"]', 'g'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(v => JSON.stringify(S.settings.secVat) === v, sv0), 'Steuerklasse einer Kategorie: gesperrt'); await p.click('#dlgCancel'); await p.waitForTimeout(200);
  await L.go(p, 'einstellungen'); L.ok(await p.evaluate(() => document.querySelector('#s-vat').disabled && document.querySelector('#s-vatDrinks').disabled && document.querySelector('#app [data-act="reset"]').disabled), 'Einstellungen: Steuersätze und „Beispieldaten wiederherstellen“ gesperrt');
  await L.go(p, 'einstellungen/eigene-daten');
  const ed = await p.evaluate(() => ({note:(document.querySelector('#app .ro-note') || {textContent:''}).textContent, leer:document.querySelector('#app [data-act="leerAsk"]').disabled, links:[...document.querySelectorAll('#app .ed-links button')].every(x => x.disabled), rows:document.querySelectorAll('#app .ed-row').length}));
  L.ok(/Nur ansehen/.test(ed.note) && ed.leer && ed.links && ed.rows === 6, 'Eigene Daten: das Team sieht den Stand, „Leer starten“ und die Beispiel-Wege sind gesperrt', ed);
  const n0 = await p.evaluate(() => S.menu.length);
  await p.evaluate(() => { leerPart('keep'); }); await p.waitForTimeout(200); L.ok(!(await dlgOpen(p)) && await p.evaluate(() => S.demo === true), '„Beispiele behalten“ auch nicht über Umwege');
  await L.openImp(p, 'menu');
  L.ok(await p.evaluate(() => document.querySelector('#app [data-act="impFile"]').disabled && document.querySelector('#app [data-act="impCheck"]').disabled), 'Import: „Datei wählen“ und „Prüfen“ gesperrt');
  await p.evaluate(() => { impText('Gericht;Preis\nTestgericht;9,90'); render(); }); await p.waitForTimeout(250);
  await p.evaluate(() => { const x = document.querySelector('#app [data-act="impApply"]'); if(x){ x.disabled = false; x.click(); } impApply(); }); await p.waitForTimeout(300);
  L.ok(await p.evaluate(v => S.menu.length === v && !(S.imports || []).length, n0) && /nur der Chef/.test(await L.toast(p)), 'Übernehmen eines Imports: gesperrt, nichts geändert');
  // zurück zum Chef
  await L.go(p, 'einstellungen'); await p.click('#app .who-b:nth-child(1)'); await p.waitForTimeout(300); await L.go(p, 'ware/bestand');
  L.ok(await p.evaluate(() => canEditAll() && !document.querySelector('#app [data-act="moveDlg"][data-id="out:pork"]').disabled && !document.querySelector('#app .ro-note')), 'wieder Chef: alles frei');
  await p.evaluate(() => moveDlg('in:pork')); await p.waitForTimeout(200); L.ok(await p.evaluate(() => !!document.querySelector('#dlgForm [name="price"]') && !!document.querySelector('#dlgForm [name="upd"]')), 'Chef: Wareneingang wieder mit Preis und „in die Kalkulation übernehmen“');
  await L.done(b, p.errs); })();
