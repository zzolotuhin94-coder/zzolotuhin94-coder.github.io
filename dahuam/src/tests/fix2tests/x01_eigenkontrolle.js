// fix2 · Befund 1, 2, 4, 12, 13: Messwert-Korrektur behält Notiz, Stornieren statt Löschen, Monatsmappe (vor Beginn, Abzeichnung, Ölmesswert),
// Frittieröl als Entweder-oder mit „Eingetragen von“, Checklisten erneut antippen.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.TABLET);
  const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
  const rec = () => ev(() => { const d = S.checks.runs['2026-11-12']; return d && d.ck_open_k ? d.ck_open_k.items.ck_open_k_2 || null : null; });
  const mappeTxt = ym => ev(ym => { const r = ekMappe(ym); const h = document.createElement('div'); h.style.cssText = 'position:absolute;left:0;top:0;width:794px'; document.body.appendChild(h); h.innerHTML = r.pages.join('');
    const out = {n:r.pages.length, t:h.innerText.replace(/\s+/g, ' '), sig:h.querySelectorAll('.ab-page .ab-f .mp-sig-l').length, pages:h.querySelectorAll('.ab-page').length, temp:[...h.querySelectorAll('.mp-temp tbody tr')].map(x => x.innerText.replace(/\s+/g, ' ').trim()), dev:[...h.querySelectorAll('.mp-dev tbody tr')].map(x => x.innerText.replace(/\s+/g, ' ').trim())}; h.remove(); return out; }, ym);
  // ---------- 1 · Korrektur nach Maßnahme ----------
  await L.go(p, 'checklisten'); await ev(() => { view.ck.run = 'ck_open_k'; render(); });
  await p.fill('#ckv-ck_open_k_2', '9'); await p.press('#ckv-ck_open_k_2', 'Tab'); await w(250);
  await p.fill('#dlgForm [name=note]', 'Tür offen, Ware umgelagert'); await L.dlgOk(p); await w(250);
  await p.fill('#ckv-ck_open_k_2', '4'); await p.press('#ckv-ck_open_k_2', 'Tab'); await w(250);
  L.ok(await ev(() => document.querySelector('#dlg').open && /Wert korrigieren/.test(document.querySelector('#dlgForm h3').textContent) && document.querySelectorAll('#dlgForm .ek-pick input[type=radio]').length === 2), 'Korrektur eines Werts mit Maßnahme: „Nachmessung oder Tippfehler?“ (ein Entweder-oder)');
  await p.fill('#dlgForm [name=note]', 'nach 20 Minuten nachgemessen'); await L.dlgOk(p); await w(250);
  let r = await rec();
  L.ok(r.v === 4 && r.ck === 'nach' && r.note === 'nach 20 Minuten nachgemessen' && r.prev.length === 1 && r.prev[0].v === 9 && r.prev[0].out === 1 && r.prev[0].note === 'Tür offen, Ware umgelagert', 'alter Wert UND seine Notiz bleiben am Eintrag; die Korrektur hat ihre eigene Notiz', r);
  L.ok(/vorher 9 °C.*Tür offen, Ware umgelagert.*nachgemessen/.test(await L.txt(p, '#app .ck-i[data-item="ck_open_k_2"]')), 'in der Liste: alter Wert, alte Notiz, „nachgemessen“', await L.txt(p, '#app .ck-i[data-item="ck_open_k_2"]'));
  let m = await mappeTxt('2026-11');
  L.ok(m.temp.some(x => /^Do 12\.11\. 4 ! Anna 10:30 · korr\./.test(x)) && m.dev.some(x => /Kühlhaus-Temperatur notieren 9 °C erlaubt 0 bis 5 °C Tür offen, Ware umgelagert Anna, 10:30/.test(x)) && m.dev.some(x => /korrigiert: 9 → 4 °C · Nachmessung zuerst eingetragen von Anna, 10:30 Uhr · nach 20 Minuten nachgemessen/.test(x)), 'Monatsmappe: „!“ bleibt, Abweichung mit Maßnahme und Korrektur mit Nachmessung stehen beide da', m.dev);
  // ---------- 2 · älteren Wert leeren = stornieren ----------
  await ev(() => { const it = S.checks.runs['2026-11-12'].ck_open_k.items.ck_open_k_2; it.a = '09:00'; save(); render(); });
  await p.fill('#ckv-ck_open_k_2', ''); await p.press('#ckv-ck_open_k_2', 'Tab'); await w(250);
  L.ok(await ev(() => document.querySelector('#dlg').open && /Eintrag stornieren/.test(document.querySelector('#dlgForm h3').textContent)), 'älteren Messwert leeren: „Eintrag stornieren“ statt spurlos löschen');
  await L.dlgOk(p); L.ok(await ev(() => /Grund/.test(document.querySelector('#dlgForm .f-err').textContent)), 'ohne Grund geht es nicht');
  await p.fill('#dlgForm [name=why]', 'falsches Thermometer'); await L.dlgOk(p); await w(250);
  const v = await ev(() => S.checks.ek.log.find(x => x.k === 'ckv'));
  L.ok(!(await rec()) && v && v.v === 4 && v.void.why === 'falsches Thermometer' && v.void.b === 'Anna' && v.prev.length === 1, 'Wert ist aus der Liste, bleibt aber als storniert in der Eigenkontrolle (Grund, wer, wann, frühere Werte)', v);
  m = await mappeTxt('2026-11');
  L.ok(m.temp.some(x => /^Do 12\.11\. storniert/.test(x)) && m.dev.some(x => /storniert: 4 °C Grund: falsches Thermometer/.test(x)), 'Monatsmappe: „storniert“ in der Tagestabelle und unter Abweichungen und Korrekturen', m.dev);
  // frisch eingetragen und gleich wieder geleert: Tippfehler, mit Rückgängig
  await p.fill('#ckv-ck_open_k_2', '3'); await p.press('#ckv-ck_open_k_2', 'Tab'); await w(200); await p.fill('#ckv-ck_open_k_2', ''); await p.press('#ckv-ck_open_k_2', 'Tab'); await w(200);
  L.ok(!(await rec()) && /Wert gelöscht/.test(await L.toast(p)) && !(await ev(() => document.querySelector('#dlg').open)), 'gerade eben eingetragen: Leeren löscht wie bisher, mit „Rückgängig“');
  // ---------- 2 · Wareneingang und Öl stornieren ----------
  await ev(() => { view.ck = {tab:'heute', ek:'we'}; render(); }); await p.click('#app .ek-r >> nth=1'); await w(200);
  L.ok(await ev(() => document.querySelector('#dlgDel').textContent === 'Stornieren'), 'Wareneingang: Knopf heißt „Stornieren“');
  await p.click('#dlgDel'); await w(200); await p.fill('#dlgForm [name=why]', 'Lieferung war von gestern'); await L.dlgOk(p); await w(250);
  const wv = await ev(() => S.checks.ek.log.find(x => x.id === 'ek_d3'));
  L.ok(wv && wv.void && wv.void.why === 'Lieferung war von gestern' && await ev(() => !!document.querySelector('#app .ek-log li.void s') && /storniert von Anna am 12\.11\.2026: Lieferung war von gestern/.test(document.querySelector('#app .ek-log li.void').innerText)), 'storniert: bleibt durchgestrichen mit Grund, wer und wann');
  m = await mappeTxt('2026-11');
  L.ok(m.dev.some(x => /^Fr 6\.11\. Wareneingang .*storniert: Kühlware 6,5 °C Grund: Lieferung war von gestern Anna, 12\.11\.2026 \(eingetragen von Anna, 08:10\)/.test(x)) && m.dev.some(x => /^Fr 6\.11\. .*Kühlware 6,5 °C .*Fahrer darauf hingewiesen/.test(x)), 'Monatsmappe: die stornierte Abweichung bleibt mit Maßnahme, dazu „storniert“ mit Grund', m.dev.filter(x => /6\.11/.test(x)));
  await ev(() => { view.ck = {tab:'heute', ek:'oil'}; render(); }); await p.click('#app [data-act="ekDel"] >> nth=0'); await w(200); await p.fill('#dlgForm [name=why]', 'doppelt'); await L.dlgOk(p); await w(250);
  L.ok(await ev(() => S.checks.ek.log.find(x => x.id === 'ek_d5').void.why === 'doppelt' && S.checks.ek.log.some(x => x.id === 'ek_d5')) && /geprüft/.test(await L.txt(p, '#app .ek-stat')) === false, 'Frittieröl: stornierte Prüfung zählt nicht mehr für den Stand, bleibt aber im Protokoll', await L.txt(p, '#app .ek-stat'));
  // ---------- 12 · Öl geprüft: Entweder-oder, Messwert, Eingetragen von ----------
  await p.click('#app [data-act="ekOil"][data-id="check"]'); await w(200);
  const od = await ev(() => ({radios:document.querySelectorAll('#dlgForm .ek-pick input[type=radio][name=res]').length, togs:document.querySelectorAll('#dlgForm .tog').length, who:document.querySelector('#dlgForm [name=who]').value, opts:[...document.querySelectorAll('#dlgForm [name=who] option')].map(o => o.value)}));
  L.ok(od.radios === 2 && od.togs === 0 && od.who === 'Anna' && od.opts.length > 2, 'Öl geprüft: zwei Knöpfe statt zwei Schalter; „Eingetragen von“ zeigt, wer an diesem Gerät arbeitet', od);
  await p.click('#dlgForm .ek-pick label:nth-of-type(2)'); await p.fill('#dlgForm [name=tpm]', '26,5'); await p.selectOption('#dlgForm [name=who]', 'Lukas'); await L.dlgOk(p); await w(250);
  const o1 = await ev(() => S.checks.ek.log[0]);
  L.ok(o1.k === 'oil' && o1.res === 'wechseln' && o1.tpm === 26.5 && o1.b === 'Lukas', 'gespeichert: wechseln, 26,5 % polare Anteile, von Lukas', o1);
  m = await mappeTxt('2026-11');
  L.ok(/Öl geprüft: wechseln · 26,5 % polare Anteile Lukas, 10:3\d/.test(m.t), 'Monatsmappe: Ölmesswert steht dabei');
  await p.click('#app [data-act="ekOil"][data-id="check"]'); await w(200); await p.fill('#dlgForm [name=tpm]', '140'); await L.dlgOk(p);
  L.ok(await ev(() => document.querySelector('#dlg').open && /0 bis 100/.test(document.querySelector('#dlgForm .f-err').textContent)), 'Messwert über 100 %: Hinweis am Feld'); await p.click('#dlgCancel');
  // ---------- 4 · Monatsmappe: vor Beginn, Abzeichnung ----------
  const o = await mappeTxt('2026-10');
  L.ok(o.temp[0] === '1.10.–27.10.: vor Beginn der Aufzeichnung (erster Eintrag am 28.10.)' && !/Do 1\.10\./.test(o.t), 'Oktober: Tage vor dem ersten Eintrag als „vor Beginn der Aufzeichnung“, nicht als „nicht fällig“', o.temp.slice(0, 2));
  L.ok(o.sig === o.pages && o.pages >= 1 && /Geprüft \(Name\) Datum Unterschrift/.test(o.t), 'Abzeichnungszeile (Geprüft, Datum, Unterschrift) auf jedem Blatt');
  await L.sheets(p, (await ev(() => ekMappe('2026-10').pages))[0]); await w(150); await L.shot(p, 'x01-mappe-okt'); await L.sheetsOff(p);
  // ---------- 13 · Checklisten erneut antippen ----------
  await ev(() => { view.ck = {tab:'heute', ek:'clean'}; render(); }); await p.click('.nav-i[data-tab="checkl"] >> visible=true'); await w(250);
  L.ok(await ev(() => !view.ck.ek && !view.ck.run && !!document.querySelector('#app .ck-lists')), 'Reinigungsplan offen, „Checklisten“ in der Seitenleiste antippen: zurück zur Übersicht');
  await ev(() => { view.ck = {tab:'heute', run:'ck_open_k'}; render(); }); await p.click('.nav-i[data-tab="checkl"] >> visible=true'); await w(250);
  L.ok(await ev(() => !view.ck.run && !!document.querySelector('#app .ck-lists')), 'auch aus einer Liste heraus');
  await L.done(b, p.errs); })();
