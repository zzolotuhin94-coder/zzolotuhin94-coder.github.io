// Ein Fortschritt: „Einrichtung“ mit sechs Schritten aus echten Daten. Auf „Heute“ eine schmale Zeile, bis alles fertig ist.
// Wird ein Schritt fertig: ein Haken in der Liste und eine Zeile unten. Nichts legt sich über den Inhalt.
const L = require('./lib');
const covered = p => p.evaluate(() => { const bad = []; for(const [x, y] of [[0.5,0.3],[0.5,0.6],[0.8,0.8],[0.7,0.5]]){ const e = document.elementFromPoint(innerWidth * x, innerHeight * y); if(!e || !e.closest('#app')) bad.push((e && (e.id || e.className)) + ''); } return {bad, over:[...document.querySelectorAll('.reward,.gd-rw,.rw-box,dialog[open],#gd,.gd-wel')].length}; });
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  const st = await p.evaluate(() => ({n:stations().length, pct:einrStand().pct, names:stations().map(s => s.name), line:(document.querySelector('#app .einr-line') || {textContent:''}).textContent, navHas:[...document.querySelectorAll('.nav-i')].some(n => /Aufbau|Einrichtung/.test(n.textContent))}));
  L.ok(st.n === 6 && st.names.join('|') === 'Lieferanten|Preise|Basisrezepte|Rezepturen|Speisekarte|Kasse', 'sechs Schritte', st.names);
  L.ok(new RegExp('^Einrichtung ' + st.pct + ' %').test(st.line) && /weiter$/.test(st.line) && !st.navHas, 'Heute zeigt die Zeile „Einrichtung ' + st.pct + ' % … weiter“; in der Navigation steht sie nicht', st.line);
  await p.click('#app .einr-line'); await p.waitForTimeout(250);
  const v = await p.evaluate(() => ({hash:location.hash, h1:document.querySelector('#app h1').childNodes[0].textContent, rows:[...document.querySelectorAll('#app .au-row')].map(r => ({name:r.querySelector('.au-t b').textContent, metric:r.querySelector('.au-p span').textContent, btns:r.querySelectorAll('button').length, done:r.classList.contains('done')})), text:document.querySelector('#app').textContent, back:document.querySelector('#app .back').textContent.trim()}));
  L.ok(v.hash === '#einrichtung' && v.h1 === 'Einrichtung' && v.back === 'Heute', 'Zeile öffnet „Einrichtung“, zurück geht es nach „Heute“', v.hash);
  L.ok(v.rows.length === 6 && v.rows.every(r => r.btns === 1 && /\d/.test(r.metric)), 'jeder Schritt: echte Zahl und genau ein Knopf', v.rows.map(r => r.metric));
  L.ok(!/Stempel|Stufe|Talstation|Gipfel|Aufgabe|Vollbetrieb|Rohbau/.test(v.text), 'keine Stempel, Stufen oder Aufgaben auf der Seite');
  const real = await p.evaluate(() => { const prods = S.products.filter(x => !x.noStock); return {conf:prods.filter(x => !x.priceDemo).length, all:prods.length, withCard:S.menu.filter(m => m.card && C(m.card)).length, menu:S.menu.length}; });
  L.ok(v.rows[1].metric === `${real.conf} von ${real.all} Preisen bestätigt` && v.rows[3].metric === `${real.withCard} von ${real.menu} Gerichten haben eine Rezeptur`, 'die Zahlen stimmen mit den Daten überein', [v.rows[1].metric, v.rows[3].metric]);
  // Knopf führt an die Stelle
  await p.click('#app .au-row:nth-child(2) button'); await p.waitForTimeout(300); L.ok(await p.evaluate(() => view.tab === 'pcheck' && !document.querySelector('#gd')), 'Knopf bei „Preise“ führt in den Preis-Check, ohne Rundgang');
  await p.evaluate(() => pcLeave());
  // auch aus den Einstellungen und der Schnellsuche
  await L.go(p, 'einstellungen'); await p.click('#app .gd-panel [data-act="goTab"][data-id="einr"]'); await p.waitForTimeout(200); L.ok(await p.evaluate(() => view.tab === 'einr'), 'erreichbar aus den Einstellungen');
  await p.keyboard.press('Control+k'); await p.fill('#palIn', 'einrichtung'); await p.keyboard.press('Enter'); await p.waitForTimeout(200); L.ok(await p.evaluate(() => view.tab === 'einr'), 'erreichbar aus der Schnellsuche');
  // einen Schritt fertig machen: alle Preise bestätigen
  await L.go(p, 'ware/preise'); await p.evaluate(() => { S.products.forEach(x => { if(x.priceDemo) markPrice(x, 'bestätigt'); }); save(); render(); }); await p.waitForTimeout(400);
  const t1 = await L.toast(p); const c1 = await covered(p);
  L.ok(/^Einrichtung: Preise fertig$/.test(t1), 'Schritt fertig: eine Zeile unten', t1);
  L.ok(c1.over === 0 && c1.bad.length === 0, 'nichts legt sich über den Inhalt (kein Fenster, keine Belohnungskarte)', c1);
  const tRect = await p.evaluate(() => { const r = document.querySelector('#toast').getBoundingClientRect(); return r.height; }); L.ok(tRect < 70, 'die Zeile ist eine Zeile hoch', tRect);
  await p.waitForTimeout(2600); await L.go(p, 'einrichtung');
  L.ok(await p.evaluate(() => { const r = document.querySelectorAll('#app .au-row')[1]; return r.classList.contains('done') && !!r.querySelector('.au-n svg') && S.game.done.prices === todayStr(); }), 'in der Liste steht jetzt ein Haken');
  await p.evaluate(() => render()); await p.waitForTimeout(300); L.ok(!(await L.toast(p)), 'beim nächsten Zeichnen keine zweite Meldung');
  // „Seite ansehen“ gibt keinen Fortschritt
  const pct1 = await p.evaluate(() => einrStand().pct); for(const h of L.SCREENS) await L.go(p, h); await p.waitForTimeout(300);
  L.ok(await p.evaluate(v => einrStand().pct === v && !document.querySelector('.reward,.gd-rw'), pct1) && !/Einrichtung:/.test(await L.toast(p)), 'Seiten ansehen ändert den Stand nicht und meldet nichts');
  // alles fertig: Zeile verschwindet
  await p.evaluate(() => { S.suppliers.forEach(s => { s.email = s.email || 'a@b.at'; if(!s.orderDays.length) s.orderDays = [1]; if(!s.deliveryDays.length) s.deliveryDays = [2]; });
    const anyCard = S.cards.find(c => c.type === 'dish'); S.menu.forEach(m => { if(!(m.card && C(m.card))) m.card = anyCard.id; });
    S.cards.filter(c => c.type === 'semi').forEach(c => { if(!c.items.length) c.items = [{ref:'p:' + S.products[0].id, qty:100, net:''}]; c.items.forEach(i => { if(!refObj(i.ref)) i.ref = 'p:' + S.products[0].id; if(!(+i.qty > 0)) i.qty = 100; }); if(!(+c.yieldG > 0)) c.yieldG = 1000; });
    const d = todayStr(); S.salesDays[d] = S.salesDays[d] || [[S.menu[0].id, 1, 10]]; S.salesReal[d] = 1; save(); go('dash'); });
  await p.waitForTimeout(500);
  const end = await p.evaluate(() => ({pct:einrStand().pct, line:!!document.querySelector('#app .einr-line'), over:document.querySelectorAll('.reward,.gd-rw,dialog[open]').length, st:stations().map(s => s.pct)}));
  L.ok(end.pct === 100 && !end.line && end.over === 0, 'alles fertig: die Zeile auf „Heute“ ist weg, wieder ohne Fenster', end);
  await L.go(p, 'einrichtung'); L.ok(await p.evaluate(() => /Alles eingerichtet/.test(document.querySelector('#app .sub').textContent) && document.querySelectorAll('#app .au-row.done').length === 6), 'Einrichtung zeigt sechs Haken');
  // fällt ein Schritt zurück, kommt die Zeile wieder
  await p.evaluate(() => { S.products.find(x => !x.noStock).priceDemo = true; save(); go('dash'); }); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => !!document.querySelector('#app .einr-line') && !S.game.done.prices), 'neuer Richtwert: der Schritt ist wieder offen, die Zeile wieder da');
  await L.done(b, p.errs); })();
