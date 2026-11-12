// Eigenkontrolle · Wareneingang-Temperatur: je Lieferung, freiwillig, nur bei Kühl- oder Tiefkühlware; Ihr Grenzwert; Notiz bei Abweichung;
// mit und ohne Bestellung; Korrektur lässt den alten Wert stehen; Rollen.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.TABLET);
  const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
  const weLog = () => ev(() => S.checks.ek.log.filter(r => r.k === 'we' && !r.demo && !r.nm));   // fix2: „ohne Messung“ wird eigens vermerkt und hier gesondert geprüft
  const recv = async id => { await ev(id => { view.stab = 'bestellung'; view.order = id; view.recv = id; go('buy'); }, id); await w(250); };
  // Bestellungen für den Test: nur Trockenware · Kühlware · Kühl- und Tiefkühlware
  const ids = await ev(() => { const mk = (sup, pids) => { const o = newOrder(sup, false); o.lines = pids.map(id => lineFor(P(id), 1)); o.status = 'sent'; o.sentAt = new Date().toISOString(); return o.id; };
    const r = {dry:mk('sup_gross', ['flour', 'sugar']), cold:S.orders.find(o => o.no === 'B-2026-0008').id, both:mk('sup_gross', ['fries', 'cremefr', 'flour']), cold2:mk('sup_molk', ['milk', 'butter']), cold3:mk('sup_molk', ['cream'])}; save(); return r; });
  // ---------- nur Trockenware: kein Feld ----------
  await recv(ids.dry);
  L.ok(await ev(() => !document.querySelector('#rTemp') && !document.querySelector('#rTempT') && !document.querySelector('#rOk') && !!document.querySelector('#rNo')), 'Lieferung ohne Kühl- oder Tiefkühlware: kein Temperaturfeld');
  await p.click('#app [data-act="rBook"]'); await w(300);
  L.ok((await weLog()).length === 0 && /Eingebucht/.test(await L.toast(p)), 'einbuchen wie bisher, kein Eintrag in der Eigenkontrolle');
  // ---------- Kühlware: ein Feld je Lieferung, freiwillig ----------
  await recv(ids.cold);
  const f1 = await ev(() => ({k:!!document.querySelector('#rTemp'), t:!!document.querySelector('#rTempT'), ok:document.querySelector('#rOk').checked, n:document.querySelectorAll('#app .recv-f .ek-tf').length, lines:document.querySelectorAll('#app table.recv tbody tr').length, lim:document.querySelector('#app .recv-f .ek-tf small').textContent, txt:document.querySelector('#app .recv-f').innerText}));
  L.ok(f1.k && !f1.t && f1.ok && f1.n === 1 && f1.lines === 3 && f1.lim === 'Ihr Grenzwert: höchstens +4 °C' && !/gesetz|Verordnung|HACCP|vorgeschrieben/i.test(f1.txt), 'drei Kühlartikel, EIN Feld „Temperatur Kühlware“; darunter „Ihr Grenzwert: höchstens +4 °C“, kein Verweis auf Vorschriften', f1.lim);
  // überspringen
  await p.click('#app [data-act="rBook"]'); await w(300);
  // fix2: früher „Feld leer gelassen: eingebucht, nichts aufgezeichnet“. Jetzt fragt die App einmal; „ohne Messung“ wird vermerkt.
  L.ok(await ev(id => document.querySelector('#dlg').open && /Ohne Temperatur einbuchen/.test(document.querySelector('#dlgForm h3').textContent) && ORD(id).status === 'sent', ids.cold), 'Feld leer gelassen: die App fragt „Ohne Temperatur einbuchen?“');
  await L.dlgOk(p); await w(250);
  L.ok((await weLog()).length === 0 && await ev(id => { const r = S.checks.ek.log.find(x => x.nm && x.order === id); return ORD(id).status === 'delivered' && ORD(id).receipt.temp === 'Temperatur nicht gemessen' && r && r.kv === null && r.tv === null; }, ids.cold), 'ohne Messung eingebucht: in der Eigenkontrolle als „Temperatur nicht gemessen“ vermerkt');
  // im Bereich
  await recv(ids.cold2); await p.fill('#rTemp', '3,5 °C'); await p.click('#app [data-act="rBook"]'); await w(300);
  let log = await weLog();
  L.ok(log.length === 1 && log[0].kv === 3.5 && log[0].tv === null && log[0].okc === true && log[0].out === 0 && log[0].sup === 'sup_molk' && log[0].order === ids.cold2 && log[0].d === '2026-11-12' && log[0].a === '10:30' && log[0].b === 'Anna' && log[0].lim.kuehl === 4, '3,5 °C: aufgezeichnet mit Lieferant, Bestellung, Datum, Uhrzeit, Name und dem Grenzwert dieses Tages', log[0]);
  L.ok(await ev(id => ORD(id).receipt.temp === 'Kühlware 3,5 °C' && ORD(id).receipt.ek === S.checks.ek.log[0].id && ORD(id).status === 'delivered', ids.cold2), 'steht auch bei der Bestellung („Temperatur“)');
  // Unsinn
  await recv(ids.cold3); await p.fill('#rTemp', 'kalt'); await p.click('#app [data-act="rBook"]'); await w(250);
  L.ok(/als Zahl eingeben/.test(await L.toast(p)) && await ev(id => ORD(id).status === 'sent', ids.cold3) && (await weLog()).length === 1, '„kalt“ ist keine Zahl: Hinweis, nichts gebucht');
  // über dem Grenzwert: Notiz verlangt (wie „Wert außerhalb des Bereichs“)
  await p.fill('#rTemp', '6,5'); await p.click('#app [data-act="rBook"]'); await w(300);
  L.ok(await ev(() => document.querySelector('#dlg').open && /außerhalb Ihres Grenzwerts/.test(document.querySelector('#dlgForm h3').textContent) && /Kühlware 6,5 °C \(Ihr Grenzwert: höchstens \+4 °C\)/.test(document.querySelector('#dlgForm').textContent)), '6,5 °C: Dialog „außerhalb Ihres Grenzwerts“ fragt nach einer Notiz');
  await L.dlgOk(p); L.ok(await ev(() => document.querySelector('#dlg').open && /kurz notieren/.test(document.querySelector('#dlgForm .f-err').textContent)), 'ohne Notiz geht es nicht weiter');
  await p.fill('#dlgForm [name=note]', 'Ware zurückgegeben <b>x</b>'); await L.dlgOk(p); await w(200);
  log = await weLog();
  L.ok(log.length === 2 && log[0].kv === 6.5 && log[0].out === 1 && log[0].note === 'Ware zurückgegeben <b>x</b>' && await ev(id => ORD(id).status === 'delivered', ids.cold3), 'mit Notiz eingebucht: Abweichung gespeichert');
  // Kühl- und Tiefkühlware, Ware nicht in Ordnung
  await recv(ids.both);
  L.ok(await ev(() => !!document.querySelector('#rTemp') && !!document.querySelector('#rTempT') && document.querySelectorAll('#app .recv-f .ek-tf small')[1].textContent === 'Ihr Grenzwert: höchstens −18 °C'), 'Lieferung mit Kühl- und Tiefkühlware: zwei Felder, Tiefkühlware „höchstens −18 °C“');
  await p.fill('#rTemp', '2'); await p.fill('#rTempT', '−15'); await p.click('#app [data-act="rBook"]'); await w(300);
  L.ok(await ev(() => /Tiefkühlware −15 °C \(Ihr Grenzwert: höchstens −18 °C\)/.test(document.querySelector('#dlgForm').textContent) && !/Kühlware 2 °C/.test(document.querySelector('#dlgForm').textContent)), '−15 °C ist wärmer als −18 °C: außerhalb; die Kühlware (2 °C) ist in Ordnung');
  await p.click('#dlgCancel'); await w(150); L.ok(await ev(id => ORD(id).status === 'sent', ids.both), 'abbrechen: nichts gebucht');
  await p.fill('#rTempT', '-19,5'); await p.uncheck('#rOk', {force:true}); await p.click('#app [data-act="rBook"]'); await w(300);
  L.ok(await ev(() => /Ware nicht in Ordnung/.test(document.querySelector('#dlgForm').textContent) && !/Tiefkühlware/.test(document.querySelector('#dlgForm p').textContent)), 'Temperaturen passen, aber „Ware in Ordnung“ abgewählt: Notiz verlangt');
  await p.fill('#dlgForm [name=note]', 'Karton eingedrückt, Foto gemacht'); await L.dlgOk(p); await w(200);
  log = await weLog();
  L.ok(log.length === 3 && log[0].kv === 2 && log[0].tv === -19.5 && log[0].okc === false && log[0].out === 1, 'ein Eintrag für die ganze Lieferung: 2 °C, −19,5 °C, nicht in Ordnung', log[0]);
  // ---------- Lieferung ohne Bestellung ----------
  await ev(() => { view.order = null; view.recv = null; view.stab = 'bestellung'; go('buy'); }); await p.click('#app [data-act="moveDlg"][data-id="in"]'); await w(250);
  L.ok(await ev(() => document.querySelector('#mvEk').hidden), 'ohne Bestellung, noch kein Artikel gewählt: kein Temperaturfeld');
  await p.selectOption('#mvPid', 'flour'); await w(100); L.ok(await ev(() => document.querySelector('#mvEk').hidden), 'Mehl (Trockenlager): kein Feld');
  await p.selectOption('#mvPid', 'butter'); await w(100);
  L.ok(await ev(() => !document.querySelector('#mvEk').hidden && /Temperatur Kühlware/.test(document.querySelector('#mvEk').textContent) && document.querySelector('#mvEkN').hidden), 'Butter (Kühlhaus): Feld „Temperatur Kühlware“ erscheint');
  await p.fill('#dlgForm [name=qty]', '2'); await L.dlgOk(p); await w(200);
  L.ok((await weLog()).length === 3 && /Wareneingang: Butter/.test(await L.toast(p)), 'leer gelassen: gebucht, kein Eintrag');
  await p.click('#app [data-act="moveDlg"][data-id="in"]'); await w(200); await p.selectOption('#mvPid', 'fries'); await w(100);
  L.ok(await ev(() => /Temperatur Tiefkühlware/.test(document.querySelector('#mvEk').textContent)), 'Pommes (Tiefkühler): Feld „Temperatur Tiefkühlware“');
  await p.fill('#dlgForm [name=qty]', '5'); await p.fill('#mvEkT', '-12'); await L.dlgOk(p);
  L.ok(await ev(() => document.querySelector('#dlg').open && !document.querySelector('#mvEkN').hidden && /Tiefkühlware −12 °C/.test(document.querySelector('#dlgForm .f-err').textContent)), '−12 °C: Dialog bleibt offen, Feld „Was haben Sie getan?“ erscheint');
  const st0 = await ev(() => P('fries').stock);
  await p.fill('#dlgForm [name=ekNote]', 'Fahrer informiert'); await L.dlgOk(p); await w(200);
  log = await weLog();
  L.ok(log.length === 4 && log[0].tv === -12 && log[0].kv === null && log[0].out === 1 && log[0].sup === 'sup_gross' && log[0].ref === 'Pommes frites TK' && await ev(([s, id]) => P('fries').stock === s + 5 && S.moves[0].ek === id && S.moves[0].id === S.checks.ek.log[0].mv, [st0, log[0].id]), 'mit Notiz gebucht: Bestand +5, Eintrag hängt an Buchung und Lieferant', log[0]);
  // ---------- Übersicht und Korrektur ----------
  await L.go(p, 'checklisten');
  // fix2: über dem Grenzwert schaltet die App „Ware in Ordnung“ aus; darum steht jetzt auch „Ware nicht in Ordnung“ dabei
  L.ok(/Wareneingang zuletzt Do 12\.11\.: Tiefkühlware −12 °C · Ware nicht in Ordnung · außerhalb/.test(await L.txt(p, '#app .ek-l[data-id="we"]')), 'Checklisten → Eigenkontrolle → Wareneingang zeigt den letzten Eintrag', await L.txt(p, '#app .ek-l[data-id="we"]'));
  await p.click('#app .ek-l[data-id="we"]'); await w(200);
  L.ok(await ev(() => document.querySelectorAll('#app .ek-log li').length === S.checks.ek.log.filter(r => r.k === 'we').length && document.querySelectorAll('#app .ek-log li.out').length === 4 && !document.querySelector('#app .ek-log b b') && /Ihr Grenzwert: Kühlware höchstens \+4 °C, Tiefkühlware höchstens −18 °C/.test(document.querySelector('#app .sub').textContent)), 'Seite „Wareneingang“: alle Einträge, Abweichungen erkennbar, Notiz mit <b> bleibt Text');
  await p.click('#app .ek-log li:nth-child(1) .ek-r'); await w(200);
  await p.fill('#ekTk', '-18,5'); await p.fill('#dlgForm [name=note]', 'Messfehler, zweite Messung'); await L.dlgOk(p); await w(200);
  const cor = await ev(() => S.checks.ek.log[0]);
  L.ok(cor.tv === -18.5 && cor.out === 0 && cor.prev.length === 1 && cor.prev[0].tv === -12 && cor.cb === 'Anna' && /^2026-11-12/.test(cor.cat), 'Korrektur: neuer Wert, der alte bleibt am Eintrag (prev), dazu wer und wann', cor);
  const li = await ev(() => { const x = document.querySelector('#app .ek-log li'); return {s:x.querySelector('s').textContent, t:x.innerText.replace(/\s+/g, ' ')}; });
  L.ok(li.s === 'Tiefkühlware −12 °C · Ware nicht in Ordnung' && /Tiefkühlware −18,5 °C/.test(li.t) && !/−18,5 °C · Ware nicht/.test(li.t) && /vorher: Fahrer informiert/.test(li.t) && /korrigiert von Anna am 12\.11\.2026/.test(li.t), 'in der Liste: alter Wert durchgestrichen, „korrigiert von Anna am 12.11.2026“', li.t);
  // von Hand nachtragen
  await p.click('#app [data-act="ekWeNew"]'); await w(200); await L.dlgOk(p);
  L.ok(await ev(() => document.querySelector('#dlg').open && /Temperatur eintragen oder/.test(document.querySelector('#dlgForm .f-err').textContent)), 'von Hand: leerer Eintrag wird nicht gespeichert');
  await p.selectOption('#dlgForm [name=sup]', 'sup_gem'); await p.fill('#ekK', '+4'); await L.dlgOk(p); await w(200);
  L.ok(await ev(() => { const r = S.checks.ek.log[0]; return r.kv === 4 && r.out === 0 && r.sup === 'sup_gem'; }), 'genau am Grenzwert (+4 °C) gilt als in Ordnung');
  // ---------- Grenzwerte ändert der Chef ----------
  await ev(() => { view.ck.ek = null; view.ck.tab = 'vorlagen'; render(); }); await p.click('#app [data-act="ekSetup"]'); await w(200);
  await p.fill('#dlgForm [name=kuehl]', '7'); await p.fill('#dlgForm [name=tk]', '8'); await L.dlgOk(p);
  L.ok(await ev(() => document.querySelector('#dlg').open && /unter dem für Kühlware/.test(document.querySelector('#dlgForm .f-err').textContent)), 'Tiefkühl-Grenzwert über dem Kühl-Grenzwert wird abgelehnt');
  await p.fill('#dlgForm [name=tk]', '-20'); await L.dlgOk(p); await w(200);
  L.ok(await ev(() => S.checks.ek.limits.kuehl === 7 && S.checks.ek.limits.tk === -20 && /Kühlware höchstens \+7 °C · Tiefkühlware höchstens −20 °C/.test(document.querySelector('#app .ek-tpls').textContent)), 'Grenzwerte geändert: +7 °C und −20 °C');
  L.ok(await ev(() => ekWeOutWhy(6.5, null, true, S.checks.ek.limits).length === 0 && ekWeOutWhy(null, -19, true, S.checks.ek.limits).length === 1 && S.checks.ek.log.find(r => r.kv === 6.5 && !r.demo).out === 1), 'neuer Grenzwert gilt ab jetzt; alte Einträge behalten ihre Bewertung');
  // ---------- Team ----------
  await L.team(p); await ev(() => { view.ck.tab = 'vorlagen'; go('checkl'); }); await w(150);
  L.ok(await ev(() => !document.querySelector('#app [data-act="ekSetup"]') && !document.querySelector('#app [data-act="ckTab"][data-id="vorlagen"]')), 'Team: keine Vorlagen, keine Grenzwerte');
  L.ok(await ev(() => { ekSetupDlg(); ekCleanDlg(); return !document.querySelector('#dlg').open; }), 'Team kann die Einstellungen auch nicht anders öffnen');
  const o2 = await ev(() => { const o = newOrder('sup_molk', false); o.lines = [lineFor(P('milk'), 1)]; o.status = 'sent'; save(); return o.id; });
  await recv(o2); await p.fill('#rTemp', '5'); await p.click('#app [data-act="rBook"]'); await w(300);
  L.ok(await ev(() => { const r = S.checks.ek.log[0]; return r.kv === 5 && r.out === 0 && r.b === 'Florian' && r.lim.kuehl === 7; }), 'Team bucht den Wareneingang mit Temperatur (5 °C, Grenzwert +7 °C): aufgezeichnet unter seinem Namen', await ev(() => S.checks.ek.log[0].b));
  await ev(() => { view.ck = {tab:'heute', ek:'we'}; go('checkl'); }); await w(200); await p.click('#app .ek-log li:nth-child(1) .ek-r'); await w(200);
  L.ok(await ev(() => document.querySelector('#dlg').open && !document.querySelector('#dlgDel')), 'Team darf korrigieren, aber nicht löschen');
  await p.click('#dlgCancel'); await L.chef(p); await ev(() => { view.ck = {tab:'heute', ek:'we'}; go('checkl'); }); await w(200);
  // fix2: früher „Chef löscht einen Eintrag (mit Rückfrage)“. Jetzt: stornieren mit Grund, der Eintrag bleibt.
  const n0 = (await ev(() => S.checks.ek.log.length)); await p.click('#app .ek-log li:nth-child(1) .ek-r'); await w(200); await p.click('#dlgDel'); await w(200); await L.dlgOk(p); await w(150);
  L.ok(await ev(() => document.querySelector('#dlg').open && /Grund/.test(document.querySelector('#dlgForm .f-err').textContent)), 'Stornieren ohne Grund geht nicht');
  await p.fill('#dlgForm [name=why]', 'doppelt eingetragen'); await L.dlgOk(p); await w(200);
  L.ok(await ev(n => S.checks.ek.log.length === n && S.checks.ek.log[0].void && S.checks.ek.log[0].void.why === 'doppelt eingetragen' && !!document.querySelector('#app .ek-log li.void s'), n0), 'Chef storniert einen Eintrag (mit Grund): er bleibt durchgestrichen stehen');
  await L.done(b, p.errs); })();
