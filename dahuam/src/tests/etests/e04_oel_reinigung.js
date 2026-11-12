// Eigenkontrolle · Frittieröl (Wechsel, Prüfung, Intervall) und Reinigungsplan (täglich, wöchentlich, monatlich; überfällig bleibt stehen),
// eine Zeile auf „Heute“, Rollen, Messwert-Korrektur in den Checklisten.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.TABLET);
  const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
  // ---------- Beispiel: Übersicht bei den Checklisten ----------
  await L.go(p, 'checklisten');
  const ov = await ev(() => ({h:document.querySelector('#app .ek-h').textContent, rows:[...document.querySelectorAll('#app .ek-l')].map(x => x.innerText.replace(/\s+/g, ' ').trim()), lists:document.querySelectorAll('#app .ck-lists .ck-l').length, tabs:[...document.querySelectorAll('#app .ck-tabs [role=tab]')].map(x => x.textContent).join('|')}));
  L.ok(ov.h === 'Eigenkontrolle' && ov.tabs === 'Heute|Verlauf|Vorlagen' && ov.lists === 4 && ov.rows.length === 3, 'Checklisten bleibt der eine Ort: unter den Listen von heute die Gruppe „Eigenkontrolle“ mit drei Zeilen', ov.rows);
  L.ok(ov.rows[0] === 'Reinigungsplan 2 offen, 1 davon überfällig' && ov.rows[1] === 'Frittieröl letzter Wechsel vor 9 Tagen · Wechsel seit 2 Tagen fällig' && /^Wareneingang zuletzt Di 10\.11\.: Kühlware 2,8 °C · Tiefkühlware −19 °C$/.test(ov.rows[2]), 'Reinigungsplan: 2 offen, 1 überfällig · Frittieröl: Wechsel vor 9 Tagen, seit 2 Tagen fällig (Intervall 7) · letzter Wareneingang', ov.rows);
  // ---------- Frittieröl: Regeln (reine Rechnung) ----------
  const oil = await ev(() => { const k = S.checks.ek; const f = k.fryers[0]; const keep = JSON.stringify(k.log); const st = D => { const s = ekOilState(f, D); return [s.days, s.due, s.over, ekOilDueTxt(s)].join('|'); };
    const out = {a:st('2026-11-09'), b:st('2026-11-10'), c:st('2026-11-12')};   // Wechsel am 3.11., Intervall 7 Tage
    k.oilDays = ''; out.none = st('2026-11-30');
    k.log.unshift({id:'x1', k:'oil', fr:f.id, t:'check', res:'wechseln', d:'2026-11-10', a:'10:00', at:'2026-11-10T10:00:00', b:'A'}); out.chk = st('2026-11-10');   // jüngste Prüfung sagt „wechseln“ (ohne Intervall)
    k.oilDays = 7; k.log.unshift({id:'x2', k:'oil', fr:f.id, t:'wechsel', d:'2026-11-10', a:'11:00', at:'2026-11-10T11:00:00', b:'A'}); out.after = st('2026-11-10');
    k.log = JSON.parse(keep).filter(r => r.k !== 'oil'); out.empty = st('2026-11-12') + '|' + ekOilTxt(ekOilState(f, '2026-11-12'), '2026-11-12'); k.log = JSON.parse(keep); return out; });
  L.ok(oil.a === '6|false|0|' && oil.b === '7|true|0|Wechsel heute fällig' && oil.c === '9|true|2|Wechsel seit 2 Tagen fällig', 'Intervall 7 Tage: am 6. Tag nichts, am 7. Tag „heute fällig“, am 9. Tag „seit 2 Tagen fällig“', oil);
  L.ok(oil.none === '27|false|0|' && oil.chk === '7|true|0|geprüft: wechseln' && oil.after === '0|false|0|' && oil.empty === '|false|0||noch kein Wechsel eingetragen', 'ohne Intervall keine Erinnerung · Prüfung „wechseln“ macht fällig · ein Wechsel danach hebt es auf · ohne Eintrag: „noch kein Wechsel eingetragen“', oil);
  // ---------- Frittieröl: bedienen ----------
  await p.click('#app .ek-l[data-id="oil"]'); await w(200);
  const op = await L.txt(p, '#app');
  L.ok(/Frittieröl .*Ihr Intervall: Wechsel alle 7 Tage\./.test(op) && /Letzter Wechsel vor 9 Tagen Wechsel seit 2 Tagen fällig · geprüft vor 3 Tagen: in Ordnung/.test(op) && await ev(() => document.querySelectorAll('#app .btn.primary').length === 1 && document.querySelector('#app .btn.primary').textContent === 'Öl gewechselt'), 'Seite Frittieröl: letzter Wechsel, Intervall, letzte Prüfung; eine Hauptaktion „Öl gewechselt“', op.slice(0, 200));
  await p.click('#app [data-act="ekOil"][data-id="wechsel"]'); await w(200);
  L.ok(await ev(() => document.querySelector('#dlgForm [name=d]').value === '2026-11-12' && !document.querySelector('#dlgForm [name=fr]')), 'Dialog: Datum heute; bei einer Fritteuse keine Auswahl');
  await L.dlgOk(p); await w(200);
  const o1 = await ev(() => S.checks.ek.log[0]);
  L.ok(o1.k === 'oil' && o1.t === 'wechsel' && o1.d === '2026-11-12' && o1.a === '10:30' && o1.b === 'Anna' && o1.fr === 'fr_1' && /Letzter Wechsel heute nächster Wechsel in 7 Tagen/.test(await L.txt(p, '#app .ek-stat')), '„Öl gewechselt“: Datum, Uhrzeit, wer; die Anzeige springt auf „heute“', await L.txt(p, '#app .ek-stat'));
  await p.click('#toast .toast-act'); await w(200);
  L.ok(await ev(() => S.checks.ek.log[0].id === 'ek_d5') && /vor 9 Tagen/.test(await L.txt(p, '#app .ek-stat')), 'vertippt: „Rückgängig“ nimmt den Eintrag gleich wieder weg');
  await p.click('#app [data-act="ekOil"][data-id="check"]'); await w(200); await p.check('#dlgForm [name=res][value="wechseln"]', {force:true}); await L.dlgOk(p); await w(200);
  L.ok(await ev(() => S.checks.ek.log[0].t === 'check' && S.checks.ek.log[0].res === 'wechseln') && /Öl geprüft: wechseln/.test(await L.txt(p, '#app .ek-log li')), '„Öl geprüft: wechseln“ steht im Protokoll');
  // zweite Fritteuse (Name mit Sonderzeichen), Intervall ändern
  await ev(() => { view.ck.ek = null; view.ck.tab = 'vorlagen'; render(); }); await p.click('#app [data-act="ekSetup"]'); await w(200);
  await p.fill('#dlgForm [name=fryers]', 'Fritteuse, Fisch <i>F2</i>'); await p.fill('#dlgForm [name=oilDays]', '10'); await L.dlgOk(p); await w(200);
  L.ok(await ev(() => { const k = S.checks.ek; return k.fryers.length === 2 && k.fryers[0].id === 'fr_1' && k.fryers[1].name === 'Fisch <i>F2</i>' && k.oilDays === 10 && /Ölwechsel alle 10 Tage/.test(document.querySelector('#app .ek-tpls').textContent); }), 'Chef: zweite Fritteuse, Intervall 10 Tage');
  await ev(() => { view.ck.tab = 'heute'; view.ck.ek = 'oil'; render(); }); await w(150);
  L.ok(await ev(() => document.querySelectorAll('#app .ek-stat li').length === 2 && !document.querySelector('#app .ek-stat i') && /Fisch <i>F2<\/i>: Noch kein Wechsel eingetragen/.test(document.querySelector('#app .ek-stat li:nth-child(2)').innerText)), 'zwei Fritteusen: je eine Zeile; der Name bleibt Text');
  await p.click('#app [data-act="ekOil"][data-id="wechsel"]'); await w(200); const frId = await ev(() => S.checks.ek.fryers[1].id); await p.selectOption('#dlgForm [name=fr]', frId); await p.fill('#dlgForm [name=d]', '2026-11-10'); await L.dlgOk(p); await w(200);
  L.ok(await ev(id => { const r = S.checks.ek.log.find(x => x.fr === id); return r.d === '2026-11-10' && r.late === 1; }, frId) && /Fisch <i>F2<\/i>: Letzter Wechsel vor 2 Tagen/.test(await L.txt(p, '#app .ek-stat li:nth-child(2)')), 'bei mehreren Fritteusen fragt der Dialog, welche; ein früheres Datum gilt als nachgetragen');
  // ---------- Reinigungsplan: wann ist was fällig (reine Rechnung) ----------
  const due = await ev(() => { const T = (when, wd, md, since) => ({id:'t', t:'x', when, wd, md, since:since || '2026-01-01'});
    return {d1:ekLastDue(T('daily'), '2026-11-12'), d2:ekLastDue(T('daily'), '2026-11-11'),                       // Mittwoch ist Ruhetag
      w1:ekLastDue(T('weekly', 1), '2026-11-09'), w2:ekLastDue(T('weekly', 1), '2026-11-12'), w3:ekLastDue(T('weekly', 1), '2026-11-15'), w4:ekLastDue(T('weekly', 1), '2026-11-16'),
      m1:ekLastDue(T('monthly', null, 15), '2026-11-14'), m2:ekLastDue(T('monthly', null, 15), '2026-11-15'), m3:ekLastDue(T('monthly', null, 15), '2026-12-03'), m4:ekLastDue(T('monthly', null, 31), '2027-02-28'), m5:ekLastDue(T('monthly', null, 31), '2027-03-01'),
      s1:ekLastDue(T('weekly', 1, null, '2026-11-10'), '2026-11-12'), s2:ekLastDue(T('weekly', 1, null, '2026-11-10'), '2026-11-16'), s3:ekLastDue(T('monthly', null, 1, '2026-11-12'), '2026-11-30'), s4:ekLastDue(T('monthly', null, 1, '2026-11-12'), '2026-12-01')}; });
  L.ok(due.d1 === '2026-11-12' && due.d2 === null, 'täglich: an Öffnungstagen fällig, am Ruhetag nicht', [due.d1, due.d2]);
  L.ok(due.w1 === '2026-11-09' && due.w2 === '2026-11-09' && due.w3 === '2026-11-09' && due.w4 === '2026-11-16', 'wöchentlich am Montag: fällig am 9.11., bleibt bis Sonntag stehen, am 16.11. beginnt die nächste Runde');
  L.ok(due.m1 === '2026-10-15' && due.m2 === '2026-11-15' && due.m3 === '2026-11-15' && due.m4 === '2027-02-28' && due.m5 === '2027-02-28', 'monatlich am 15.: bis zum 14. gilt noch der Oktober; „am 31.“ fällt im Februar auf den letzten Tag');
  L.ok(due.s1 === null && due.s2 === '2026-11-16' && due.s3 === null && due.s4 === '2026-12-01', 'neu angelegte Aufgabe: erscheint erst am nächsten Fälligkeitstag');
  // ---------- Reinigungsplan: abhaken ----------
  await ev(() => { view.ck = {tab:'heute'}; render(); }); await p.click('#app .ek-l[data-id="clean"]'); await w(200);
  const cl = await ev(() => [...document.querySelectorAll('#app .ck-items .ck-i')].map(x => x.innerText.replace(/\s+/g, ' ').trim()));
  L.ok(cl.length === 2 && cl[0] === 'Aufschnittmaschine zerlegen und reinigen Küche · wöchentlich · fällig seit Mo 9.11.' && cl[1] === 'Handwaschbecken und Seifenspender reinigen Küche · täglich' && /0 von 2/.test(await L.txt(p, '#ckProg')), 'heute: die überfällige Wochenaufgabe zuerst („fällig seit Mo 9.11.“), dann die tägliche; Erledigtes der Vorwoche und noch nicht Fälliges stehen nicht da', cl);
  await p.click('#app [data-act="ekTick"][data-id="ec_schneid"]'); await w(200);
  const t1 = await ev(() => S.checks.runs['2026-11-12'].ek_clean.items.ec_schneid);
  L.ok(t1.b === 'Anna' && t1.a === '10:30' && t1.due === '2026-11-09' && /1 von 2/.test(await L.txt(p, '#ckProg')) && /Anna, 10:30 Uhr/.test(await L.txt(p, '#app .ck-i.on')), 'abgehakt: wer, wann, und zu welcher Fälligkeit (9.11.) es gehört', t1);
  L.ok(await ev(() => ekCleanToday('2026-11-13').map(x => x.t.id + ':' + x.state).join() === 'ec_hand:due' && ekCleanToday('2026-11-16').map(x => x.t.id + ':' + x.state).join() === 'ec_eis:over,ec_hand:due,ec_schneid:due'), 'morgen ist die Wochenaufgabe weg; am Montag 16.11. ist sie neu fällig, die Monatsaufgabe vom 15. steht als überfällig da');
  // Team: abhaken ja, zurücknehmen nein (nur sofort per „Rückgängig“)
  await L.team(p); await ev(() => { view.ck = {tab:'heute', ek:'clean'}; go('checkl'); }); await w(200);
  await p.click('#app [data-act="ekTick"][data-id="ec_schneid"]'); await w(200);
  L.ok(/Zurücknehmen kann das nur der Chef/.test(await L.toast(p)) && await ev(() => !!S.checks.runs['2026-11-12'].ek_clean.items.ec_schneid), 'Team tippt auf ein fremdes Häkchen: bleibt, „Zurücknehmen kann das nur der Chef“');
  await p.click('#app [data-act="ekTick"][data-id="ec_hand"]'); await w(200);
  L.ok(await ev(() => S.checks.runs['2026-11-12'].ek_clean.items.ec_hand.b === 'Florian') && /2 von 2/.test(await L.txt(p, '#ckProg')) && /fertig/.test(await L.txt(p, '#ckState')), 'Team hakt ab: unter seinem Namen, „2 von 2 · fertig“');
  await p.click('#toast .toast-act'); await w(200);
  L.ok(await ev(() => !S.checks.runs['2026-11-12'].ek_clean.items.ec_hand), 'gleich danach „Rückgängig“ geht (vertippt)');
  await p.click('#app [data-act="ekTick"][data-id="ec_hand"]'); await w(200);
  // Team: Öl eintragen ja, löschen nein
  await ev(() => { view.ck.ek = 'oil'; render(); }); await w(150);
  L.ok(await ev(() => !document.querySelector('#app [data-act="ekDel"]') && !!document.querySelector('#app [data-act="ekOil"]')), 'Team: Öl eintragen ja, Einträge löschen nein');
  await p.click('#app [data-act="ekOil"][data-id="wechsel"]'); await w(200); await L.dlgOk(p); await w(200);
  L.ok(await ev(() => S.checks.ek.log[0].b === 'Florian' && S.checks.ek.log[0].t === 'wechsel'), 'Team trägt „Öl gewechselt“ ein');
  // ---------- Heute: höchstens eine Zeile ----------
  await L.go(p, 'heute');
  L.ok(await ev(() => document.querySelectorAll('#app .ek-dash').length) === 0, 'alles erledigt: auf „Heute“ steht keine Zeile zur Eigenkontrolle');
  await L.chef(p); await ev(() => { delete S.checks.runs['2026-11-12'].ek_clean; S.checks.ek.log = S.checks.ek.log.filter(r => !(r.d === '2026-11-12' && r.k === 'oil' && r.t === 'wechsel')); save(); go('dash'); }); await w(200);
  // fix-3: „Heute zu tun“ hat je Sache eine Zeile, die selbst an den richtigen Ort führt (Frittieröl mit „Öl gewechselt“, Reinigungsplan)
  const dash = await ev(() => ({t:[...document.querySelectorAll('#app .ek-dash')].map(x => x.innerText.replace(/\s+/g, ' ').trim()), sec:[...document.querySelectorAll('#app .ek-dash')].map(x => x.closest('section').className)}));
  L.ok(dash.t.join('|') === 'heute Frittieröl · Fritteuse geprüft: wechseln Öl gewechselt|2 Reinigungsplan 2 offen, 1 davon überfällig' && dash.sec.every(c => /dh-now/.test(c)), 'etwas steht an: je eine ruhige Zeile unter „Heute zu tun“ (keine neue Karte)', dash.t);
  await p.click('#app .ek-dash.dh-clean .dh-b'); await w(200);
  L.ok(await ev(() => location.hash === '#checklisten' && document.querySelector('#app h1').textContent === 'Reinigungsplan'), 'die Zeile führt zum Reinigungsplan');
  // Chef nimmt ein Häkchen zurück
  await p.click('#app [data-act="ekTick"][data-id="ec_hand"]'); await w(150); await ev(() => document.querySelector('#toast').classList.remove('show')); await p.click('#app [data-act="ekTick"][data-id="ec_hand"]'); await w(200);
  L.ok(await ev(() => !(S.checks.runs['2026-11-12'] || {}).ek_clean) && /Häkchen entfernt/.test(await L.toast(p)), 'Chef darf ein Häkchen zurücknehmen');
  // ---------- Reinigungsplan einrichten (Chef) ----------
  await ev(() => { view.ck = {tab:'vorlagen'}; render(); });
  L.ok(/Reinigungsplan 4 Aufgaben · täglich, wöchentlich, monatlich/.test(await L.txt(p, '#app .ek-tpls li')) && await ev(() => document.querySelectorAll('#app .ck-tpls li').length === 5), 'Vorlagen: unter den fünf Listen der Reinigungsplan (kein zweites System, keine sechste Liste)');
  await p.click('#app [data-act="ekCleanEdit"]'); await w(250);
  L.ok(await ev(() => document.querySelectorAll('#ekEd .ek-er').length === 4 && [...document.querySelectorAll('#ekEd [name=when] option')].slice(0, 3).map(o => o.textContent).join() === 'täglich,wöchentlich,monatlich'), 'Dialog: vier Aufgaben, Rhythmus täglich · wöchentlich · monatlich');
  await p.click('#dlgForm [data-ekadd]'); await w(100);
  const last = '#ekEd .ek-er:last-child';
  await p.fill(`${last} [name=t]`, 'Fettabscheider <b>prüfen</b>'); await p.fill(`${last} [name=area]`, 'Keller'); await p.selectOption(`${last} [name=when]`, 'monthly'); await p.fill(`${last} [name=md]`, '40'); await L.dlgOk(p);
  L.ok(await ev(() => document.querySelector('#dlg').open && /1 bis 31/.test(document.querySelector('#dlgForm .f-err').textContent)), '„am 40.“ wird abgelehnt');
  await p.fill(`${last} [name=md]`, '12');
  // die Wochenaufgabe auf Donnerstag legen, die Eismaschine entfernen
  await p.selectOption('#ekEd .ek-er[data-tid="ec_schneid"] [name=wd]', '4'); await p.click('#ekEd .ek-er[data-tid="ec_eis"] [data-ekdel]'); await L.dlgOk(p); await w(250);
  const pl = await ev(() => { const k = S.checks.ek; const cur = k.clean.filter(t => !t.gone); return {cur:cur.map(t => `${t.t}|${t.area}|${t.when}|${t.wd}|${t.md}|${t.since}`), gone:k.clean.filter(t => t.gone).map(t => t.id + ':' + t.gone).sort().join(), newId:cur.find(t => /Aufschnitt/.test(t.t)).id !== 'ec_schneid'}; });
  L.ok(pl.cur.length === 4 && pl.cur.includes('Fettabscheider <b>prüfen</b>|Keller|monthly|null|12|2026-11-12') && pl.cur.includes('Aufschnittmaschine zerlegen und reinigen|Küche|weekly|4|null|2026-11-12') && pl.gone === 'ec_eis:2026-11-12,ec_schneid:2026-11-12' && pl.newId, 'gespeichert: neue Monatsaufgabe am 12.; anderer Wochentag = neue Aufgabe ab heute, die alte bleibt mit ihrer Geschichte liegen; Entferntes endet heute', pl);
  await ev(() => { view.ck = {tab:'heute', ek:'clean'}; render(); }); await w(150);
  const cl2 = await ev(() => ({t:[...document.querySelectorAll('#app .ck-items .ck-t > span')].map(x => x.textContent), html:document.querySelector('#app .ck-items').innerHTML}));
  L.ok(cl2.t.join('|') === 'Handwaschbecken und Seifenspender reinigen|Aufschnittmaschine zerlegen und reinigen|Fettabscheider <b>prüfen</b>' && !/<b>prüfen<\/b>/.test(cl2.html), 'heute (Donnerstag, der 12.): täglich, die neue Wochenaufgabe und die Monatsaufgabe sind fällig; der Name bleibt Text', cl2.t);
  // ---------- Messwert in einer Checkliste korrigieren: alter Wert bleibt sichtbar ----------
  await ev(() => { view.ck = {tab:'heute', run:'ck_open_k'}; render(); }); await w(150);
  const vid = '#ckv-ck_open_k_2';
  await p.fill(vid, '3,5'); await p.press(vid, 'Enter'); await w(250); await p.fill(vid, '4,5'); await p.press(vid, 'Enter'); await w(250);
  const rec = await ev(() => S.checks.runs['2026-11-12'].ck_open_k.items.ck_open_k_2);
  L.ok(rec.v === 4.5 && rec.prev.length === 1 && rec.prev[0].v === 3.5 && rec.prev[0].b === 'Anna' && /Korrektur gespeichert/.test(await L.toast(p)) && /korrigiert, vorher 3,5 °C/.test(await L.txt(p, '#app .ck-i.val')) && await ev(() => document.querySelector('#app .ck-i.val s').textContent === '3,5 °C'), 'Messwert überschrieben: 4,5 °C gilt, „korrigiert, vorher 3,5 °C“ bleibt durchgestrichen stehen', rec);
  await L.team(p); await ev(() => { view.ck = {tab:'heute', run:'ck_open_k'}; go('checkl'); }); await w(200);
  await p.fill(vid, ''); await p.press(vid, 'Enter'); await w(250);
  L.ok(/löscht nur der Chef/.test(await L.toast(p)) && await ev(() => S.checks.runs['2026-11-12'].ck_open_k.items.ck_open_k_2.v === 4.5 && document.querySelector('#ckv-ck_open_k_2').value === '4,5'), 'Team leert das Feld: der Wert bleibt, „löscht nur der Chef“');
  await p.fill(vid, '4'); await p.press(vid, 'Enter'); await w(250);
  L.ok(await ev(() => { const r = S.checks.runs['2026-11-12'].ck_open_k.items.ck_open_k_2; return r.v === 4 && r.b === 'Florian' && r.prev.map(x => x.v).join() === '3.5,4.5'; }), 'Team korrigiert: beide früheren Werte bleiben am Eintrag');
  await L.done(b, p.errs); })();
