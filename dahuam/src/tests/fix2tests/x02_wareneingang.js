// fix2 · Befund 3: Wareneingang über die Bestellung nur mit Temperatur oder ausdrücklich „ohne Messung“; „Ware in Ordnung“ folgt dem Grenzwert;
// Lieferschein-Nr. und Ware am Eintrag und in der Monatsmappe; Lieferant vorgewählt.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.TABLET);
  const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
  const recv = async id => { await ev(id => { view.stab = 'bestellung'; view.order = id; view.recv = id; go('buy'); }, id); await w(250); };
  const ids = await ev(() => { const mk = (sup, pids) => { const o = newOrder(sup, false); o.lines = pids.map(id => lineFor(P(id), 1)); o.status = 'sent'; o.sentAt = new Date().toISOString(); return o.id; };
    const r = {a:mk('sup_molk', ['milk', 'butter']), b:mk('sup_molk', ['cream']), c:mk('sup_gross', ['flour'])}; save(); return r; });
  // ohne Temperatur
  await recv(ids.a); await p.fill('#rNo', 'LS 4711'); await p.click('#app [data-act="rBook"]'); await w(300);
  L.ok(await ev(id => document.querySelector('#dlg').open && /Ohne Temperatur einbuchen\?/.test(document.querySelector('#dlgForm h3').textContent) && /Vollmilch.*Butter/.test(document.querySelector('#dlgForm .dlg-p').textContent) && ORD(id).status === 'sent', ids.a), 'Kühlware, Feld leer: Rückfrage mit der betroffenen Ware, noch nichts gebucht');
  await L.shot(p, 'x02-ohne-messung');
  await p.click('#dlgCancel'); await w(150);
  L.ok(await ev(id => !document.querySelector('#dlg').open && ORD(id).status === 'sent', ids.a), '„Zurück und messen“: nichts gebucht');
  await p.click('#app [data-act="rBook"]'); await w(250); await p.fill('#dlgForm [name=note]', 'Thermometer defekt'); await L.dlgOk(p); await w(300);
  let r = await ev(id => S.checks.ek.log.find(x => x.order === id), ids.a);
  L.ok(r && r.nm === 1 && r.kv === null && r.note === 'Thermometer defekt' && r.ls === 'LS 4711' && /Vollmilch/.test(r.goods) && /Butter/.test(r.goods) && r.sup === 'sup_molk' && await ev(id => ORD(id).status === 'delivered', ids.a), '„Ohne Messung einbuchen“: vermerkt mit Grund, Lieferschein und Ware', r);
  // Trockenware: keine Rückfrage
  await recv(ids.c); await p.click('#app [data-act="rBook"]'); await w(300);
  L.ok(await ev(id => !document.querySelector('#dlg').open && ORD(id).status === 'delivered' && !S.checks.ek.log.some(x => x.order === id), ids.c), 'nur Trockenware: einbuchen wie bisher, ohne Rückfrage');
  // Ware in Ordnung folgt dem Grenzwert
  await recv(ids.b);
  await p.fill('#rTemp', '6'); await w(50); L.ok(await ev(() => !document.querySelector('#rOk').checked), '6 °C (über +4 °C): „Ware in Ordnung“ geht von selbst aus');
  await p.fill('#rTemp', '3'); await w(50); L.ok(await ev(() => document.querySelector('#rOk').checked), 'wieder 3 °C: geht wieder an (die App hatte es ausgeschaltet)');
  await p.fill('#rTemp', '6,5'); await p.fill('#rNo', 'LS 99'); await p.click('#app [data-act="rBook"]'); await w(300);
  L.ok(await ev(() => /Ware nicht in Ordnung/.test(document.querySelector('#dlgForm').textContent)), 'Notiz-Dialog nennt Temperatur und „Ware nicht in Ordnung“');
  await p.fill('#dlgForm [name=note]', 'zurückgegeben'); await L.dlgOk(p); await w(300);
  r = await ev(id => S.checks.ek.log.find(x => x.order === id), ids.b);
  L.ok(r.kv === 6.5 && r.okc === false && r.oka === 1 && r.out === 1 && r.ls === 'LS 99' && /Schlagobers/.test(r.goods), 'gespeichert: 6,5 °C, nicht in Ordnung (von der App gesetzt), Lieferschein und Ware', r);
  // Korrektur auf einen passenden Wert: „in Ordnung“ kommt zurück
  await ev(() => { view.ck = {tab:'heute', ek:'we'}; go('checkl'); }); await w(200); await p.click('#app .ek-log li:nth-child(1) .ek-r'); await w(200);
  L.ok(await ev(() => !document.querySelector('#dlgForm [name=okc]').checked && document.querySelector('#dlgForm [name=ls]').value === 'LS 99' && /Schlagobers/.test(document.querySelector('#dlgForm [name=goods]').value) && document.querySelector('#dlgForm [name=note]').value === ''), 'Korrektur: Ware und Lieferschein stehen drin; die Notiz ist leer (die alte bleibt beim alten Wert)');
  await p.fill('#ekK', '3,8'); await w(50); L.ok(await ev(() => document.querySelector('#dlgForm [name=okc]').checked), 'auf 3,8 °C korrigiert: „Ware in Ordnung“ wieder an');
  await p.fill('#dlgForm [name=note]', 'Messfehler'); await L.dlgOk(p); await w(250);
  r = await ev(id => S.checks.ek.log.find(x => x.order === id), ids.b);
  L.ok(r.kv === 3.8 && r.okc === true && !r.oka && r.out === 0 && r.note === 'Messfehler' && r.prev[0].note === 'zurückgegeben' && r.prev[0].out === 1, 'Korrektur: alte Notiz und Abweichung bleiben in prev, neue Notiz am Eintrag', r);
  // Monatsmappe
  const m = await ev(() => { const h = document.createElement('div'); h.style.cssText = 'position:absolute;left:0;top:0;width:794px'; document.body.appendChild(h); h.innerHTML = ekMappe('2026-11').pages.join(''); const o = {we:[...h.querySelectorAll('.mp-we tbody tr')].map(x => x.innerText.replace(/\s+/g, ' ').trim()), dev:[...h.querySelectorAll('.mp-dev tbody tr')].map(x => x.innerText.replace(/\s+/g, ' ').trim())}; h.remove(); return o; });
  L.ok(m.we.some(x => /Talmolkerei.*Vollmilch.*Butter · Lieferschein LS 4711 nicht gemessen in Ordnung/.test(x)) && m.we.some(x => /Schlagobers 36 % · Lieferschein LS 99 3,8 °C/.test(x)), 'Monatsmappe Wareneingang: Ware, Lieferschein-Nr., „nicht gemessen“', m.we);
  L.ok(m.dev.some(x => /Kühlware 6,5 °C · Ware nicht in Ordnung \(vor der Korrektur\).*zurückgegeben/.test(x)) && m.dev.some(x => /korrigiert: Kühlware 6,5 °C · Ware nicht in Ordnung → Kühlware 3,8 °C .*Messfehler/.test(x)), 'Abweichungen: ursprüngliche Abweichung mit Maßnahme und die Korrektur mit eigener Notiz', m.dev);
  // von Hand: heute erwarteter Lieferant vorgewählt, sonst der letzte
  await ev(() => { const o = S.orders.find(o => o.no === 'B-2026-0007'); o.deliveryDate = '2026-11-12'; o.status = 'sent'; save(); render(); });
  await p.click('#app [data-act="ekWeNew"]'); await w(200);
  const sup = await ev(() => ({v:document.querySelector('#dlgForm [name=sup]').value, exp:S.orders.find(o => o.no === 'B-2026-0007').supplier}));
  L.ok(sup.v === sup.exp, 'Temperatur von Hand: heute erwarteter Lieferant ist vorgewählt', sup);
  await p.click('#dlgCancel'); await ev(() => { S.orders.forEach(o => { if(o.status === 'sent') o.deliveryDate = '2026-11-20'; }); save(); });
  await p.click('#app [data-act="ekWeNew"]'); await w(200);
  L.ok(await ev(() => document.querySelector('#dlgForm [name=sup]').value === S.checks.ek.log.find(r => r.k === 'we' && r.sup).sup), 'ohne Lieferung heute: zuletzt verwendeter Lieferant'); await p.click('#dlgCancel');
  await L.done(b, p.errs); })();
