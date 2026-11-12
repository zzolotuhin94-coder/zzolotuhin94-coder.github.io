// Befund 6: Leergut-Rückgabe über dem offenen Pfand wird nicht still gebucht.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.DESK); const ev = async (f, a) => L.nb(await p.evaluate(f, a)); const w = ms => p.waitForTimeout(ms);
  await ev(() => { view.stab = 'lieferanten'; go('stock'); }); await w(250);
  const bal0 = await ev(() => lgBalance('sup_getraenke')); L.ok(bal0 === 90, 'Getränke Wildalm: Pfand offen € 90,00', bal0);
  await p.click('#app [data-act="lgReturn"][data-id="sup_getraenke"]'); await w(200);
  await p.fill('#dlgForm [name=k0]', '4'); await w(100);
  L.ok(/mehr als offen \(€ 90,00\)/.test(await ev(() => document.querySelector('#lgSum').textContent)) && await ev(() => document.querySelector('#lgSum').classList.contains('bad-t')), 'Eingabe 4 Fässer: „Zurück: € 120,00 · mehr als offen (€ 90,00)“, rot');
  await L.dlgOk(p);
  const wr = await ev(() => ({open:document.querySelector('#dlg').open, t:document.querySelector('#lgWarn').innerText, bal:lgBalance('sup_getraenke')}));
  L.ok(wr.open && wr.bal === 90 && /Das ist mehr, als offen ist\. Offen sind € 90,00, zurück € 120,00/.test(wr.t), '„Buchen“: Warnung, nichts gebucht', wr.t);
  await L.shot(p, 'x05-leergut-warnung', {full:false});
  await p.fill('#dlgForm [name=k0]', '3'); await w(100); await L.dlgOk(p); await w(200);
  L.ok(await ev(() => lgBalance('sup_getraenke') === 0 && !document.querySelector('#dlg').open), '3 Fässer (= offen): ohne Rückfrage gebucht, offen € 0,00');
  // ausdrücklich mehr: nach „Trotzdem buchen“ als Guthaben
  await p.click('#app [data-act="lgReturn"][data-id="sup_getraenke"]'); await w(200); await p.fill('#dlgForm [name=amt]', '10'); await L.dlgOk(p);
  await p.click('#lgForce'); await w(250);
  L.ok(await ev(() => lgBalance('sup_getraenke') === -10 && /Guthaben €\s10,00/.test(document.querySelector('#app .lg-l').innerText)), '„Trotzdem buchen“: gebucht, in der Liste als „Guthaben € 10,00“ statt „-€ 10,00“');
  await L.done(b, p.errs);
})();
