// Monatsmappe: ein PDF je Monat (ersetzt den früheren Checklisten-Druck). Inhalt, Lücken ehrlich, Abweichungen auf eigenem Blatt,
// feste A4-Blätter mit Kopf, echte PDF-Datei; Aufbewahrung 13 Monate; Sicherung enthält alles.
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1280, height:900}});
  const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
  // ein paar eigene Spuren: Messwert-Korrektur heute, Wareneingang mit Abweichung und Korrektur
  await ev(() => { const D = '2026-11-12'; const tp = ckTpl('ck_open_k');
    ckSet(D, tp, tp.items[1], {b:'Lukas', a:'08:02', v:3.4, prev:[{v:7.1, b:'Lukas', a:'07:58'}]});
    const r = ekLogWe({kv:8, tv:null, okc:true, note:'Annahme verweigert', sup:'sup_gem'}); r.prev = [{kv:9, tv:null, okc:true, note:'', sup:'sup_gem', b:'Anna', at:r.at}]; r.cb = 'Anna'; r.cat = r.at; save(); });
  await L.go(p, 'checklisten'); await p.click('#app [data-act="ckTab"][data-id="verlauf"]'); await w(200);
  L.ok(await ev(() => document.querySelectorAll('#app [data-pdf="ckPrint"]').length === 1 && document.querySelector('#app [data-pdf="ckPrint"]').textContent === 'Monatsmappe als PDF' && [...document.querySelector('#app [data-ckmonth]').options].map(o => o.textContent).join() === 'November 2026,Oktober 2026' && typeof ekMappe === 'function' && !/function ckPrintHtml\(ym\)\{\s*const c = ckS\(\); const \[y, m\]/.test(document.documentElement.innerHTML)), 'Verlauf: EIN Monats-PDF („Monatsmappe als PDF“), der frühere Checklisten-Druck ist ersetzt');
  await ev(async () => { ekMappe('2026-11'); await document.fonts.ready; });
  const m = await ev(() => { const r = ekMappe('2026-11'); const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:0;top:0;width:794px'; document.body.appendChild(host); host.innerHTML = r.pages.join(''); const pages = [...host.querySelectorAll('.ab-page')];
    const sec = t => { const s = [...host.querySelectorAll('.mp-sec')].filter(x => x.querySelector('h2').childNodes[0].textContent === t); return {n:s.length, rows:s.flatMap(x => [...x.querySelectorAll('tbody tr')].map(tr => tr.innerText.replace(/\s+/g, ' ').trim())), head:s[0] ? [...s[0].querySelectorAll('thead th')].map(th => th.innerText.replace(/\s+/g, ' ').trim()) : [], page:s[0] ? pages.indexOf(s[0].closest('.ab-page')) : -1, pageSecs:s[0] ? s[0].closest('.ab-body').children.length : 0}; };
    const out = {name:r.name, n:pages.length, days:r.days, dev:r.nDev, heads:pages.map(pg => pg.querySelector('.ab-h').innerText.replace(/\s+/g, ' ').trim()), foot:pages[0].querySelector('.ab-f').innerText, thead:pages.every(pg => [...pg.querySelectorAll('.mp-t')].every(t => t.querySelector('thead th'))),
      temp:sec('Temperaturen'), we:sec('Wareneingang'), oil:sec('Frittieröl'), cl:sec('Reinigungsplan'), ck:sec('Checklisten'), devs:sec('Abweichungen und Korrekturen'), text:host.innerText, order:[...new Set([...host.querySelectorAll('.mp-sec h2')].map(h => h.childNodes[0].textContent))].join('|')}; host.outerHTML = ''; return out; });
  // ---------- Kopf, Aufbau ----------
  L.ok(m.name === 'Monatsmappe-2026-11.pdf' && m.days === 12 && m.n >= 3 && m.heads.every((h, i) => h === `DAHUAM.202 RESTOBAR | CAFÉ Eigenkontrolle · November 2026 1.11. bis 12.11. (laufender Monat) erstellt am 12.11.2026 von Chef Blatt ${i + 1} von ${m.n}`), 'jedes Blatt trägt den Kopf: Betrieb, Monat, Zeitraum, erstellt am/von, Blatt n von m', m.heads[0]);
  L.ok(m.order === 'Temperaturen|Wareneingang|Frittieröl|Reinigungsplan|Checklisten|Abweichungen und Korrekturen' && m.thead, 'Reihenfolge der Abschnitte; jede Tabelle (auch die Fortsetzung auf dem nächsten Blatt) hat ihre Kopfzeile', m.order);
  L.ok(/Eigene Aufzeichnung des Betriebs/.test(m.foot) && !/HACCP|rechtssicher|konform|gesetzlich|behördlich geprüft/i.test(m.text), 'Fuß: „Eigene Aufzeichnung des Betriebs“; keine Rechtsbehauptung');
  // ---------- Temperaturen: jeder Tag eine Zeile, Lücken bleiben Lücken ----------
  const T = m.temp.rows;
  L.ok(T.length === 12 && m.temp.head.join('|') === 'Tag|Kühlhaus-Temperatur notieren Öffnen Küche · 0 bis 5 °C|Tiefkühler-Temperatur notieren Öffnen Küche · −30 bis −18 °C|Kühlhaus-Temperatur notieren Schließen Küche · 0 bis 5 °C|Getränkekühlung prüfen Öffnen Bar/Service · 2 bis 8 °C', 'Temperaturen: 12 Tage (1. bis 12.11.), vier Messstellen mit ihrem Bereich', m.temp.head);
  L.ok(/^Mi 4\.11\. · · · ·$/.test(T[3]) && /^Mi 11\.11\. · · · ·$/.test(T[10]) && /^So 8\.11\. 6,4 ! Anna 07:\d\d /.test(T[7]) && /^Do 12\.11\. 3,4 Lukas 08:02 kein Eintrag kein Eintrag kein Eintrag$/.test(T[11]), 'Ruhetag: „·“ (nicht fällig) · 8.11.: 6,4 ! · heute: drei fällige Werte fehlen und stehen als „kein Eintrag“ da', [T[3], T[7], T[11]]);
  // ---------- Wareneingang, Frittieröl, Reinigungsplan ----------
  L.ok(m.we.rows.length === 4 && m.we.rows[0] === 'Di 3.11. Metzgerei Brunnhuber 3,2 °C – in Ordnung Anna, 07:40' && m.we.rows[1] === 'Fr 6.11. Metzgerei Brunnhuber 6,5 °C ! – in Ordnung Anna, 08:10' && m.we.rows[2] === 'Di 10.11. Gastro-Großmarkt Inntal 2,8 °C −19 °C in Ordnung Anna, 07:55' && /^Do 12\.11\. Gemüsehof Hainzl 8 °C ! – in Ordnung Anna, 10:30 · korrigiert$/.test(m.we.rows[3]), 'Wareneingang: Tag, Lieferant, Kühl- und Tiefkühlware, Zustand, wer und wann', m.we.rows);
  L.ok(m.oil.rows.join('|') === 'Di 3.11. Fritteuse Öl gewechselt Lukas, 22:30|Mo 9.11. Fritteuse Öl geprüft: in Ordnung Lukas, 15:10', 'Frittieröl: Wechsel und Prüfung', m.oil.rows);
  const C = m.cl.rows;
  L.ok(C.length === 4 && /^Handwaschbecken und Seifenspender reinigen Küche · jeden Öffnungstag 10 Öffnungstage an 8 von 10 Tagen · Anna, Lukas nicht abgehakt: 7\.11\. 12\.11\.$/.test(C[0]) && C[1] === 'Aufschnittmaschine zerlegen und reinigen Küche · jede Woche am Montag Mo 2.11. Mo 2.11. · Lukas, 14:20' && C[2] === 'Aufschnittmaschine zerlegen und reinigen Küche · jede Woche am Montag Mo 9.11. nicht abgehakt' && C[3] === 'Dunstabzug: Filter reinigen Küche · jeden Monat am 1. So 1.11. So 1.11. · Lukas, 15:05', 'Reinigungsplan: je Fälligkeit wer und wann; täglich als Summe mit den fehlenden Tagen; Versäumtes steht als „nicht abgehakt“ da', C);
  // ---------- Checklisten Tag für Tag ----------
  const K = m.ck.rows;
  L.ok(K.some(r => /^So 1\.11\. Öffnen Küche 12 von 12 Anna, 07:\d\d–08:\d\d Uhr$/.test(r)) && K.some(r => /^Mi 4\.11\. Wochenputz 10 von 10 Lukas, 14:\d\d–14:\d\d Uhr$/.test(r)) && K.some(r => /9 von 12 · nicht fertig .*Offen: .*Eingangstür abschließen/.test(r)) && K.some(r => /^Do 12\.11\. Öffnen Küche 1 von 12 · offen Lukas, 08:02 Uhr Offen: /.test(r)) && K.some(r => /Schließen Küche 0 von 12 · offen kein Eintrag$/.test(r)), 'Checklisten: wer, wann, was offen blieb; Liste ohne Häkchen = „kein Eintrag“', K.slice(0, 3));
  // ---------- Abweichungen: eigenes Blatt ----------
  const D = m.devs.rows;
  L.ok(m.dev === 5 && D.length === 5 && m.devs.pageSecs === 1 && m.devs.page === m.n - 1 && m.devs.page > 0, 'Abweichungen und Korrekturen stehen allein auf dem letzten Blatt', [m.devs.page, m.n, m.devs.pageSecs]);
  L.ok(/^Fr 6\.11\. Wareneingang Metzgerei Brunnhuber Kühlware 6,5 °C Ihr Grenzwert: Kühlware höchstens \+4 °C, Tiefkühlware höchstens −18 °C Fahrer darauf hingewiesen.* Anna, 08:10$/.test(D[0]) && /^So 8\.11\. Öffnen Küche: Kühlhaus-Temperatur notieren 6,4 °C erlaubt 0 bis 5 °C Tür stand offen\. Nach 30 Minuten wieder 4 °C\. Anna, 07:\d\d$/.test(D[1]), 'mit Wert, Grenzwert bzw. Bereich, Notiz, wer und wann', D.slice(0, 2));
  L.ok(D.some(r => /^Do 12\.11\. Öffnen Küche: Kühlhaus-Temperatur notieren korrigiert: 7,1 → 3,4 °C zuerst eingetragen von Lukas, 07:58 Uhr Lukas, 08:02$/.test(r)) && D.some(r => /Wareneingang Gemüsehof Hainzl korrigiert: Kühlware 9 °C → Kühlware 8 °C/.test(r)) && D.some(r => /Wareneingang Gemüsehof Hainzl Kühlware 8 °C .* Annahme verweigert/.test(r)), 'Korrekturen stehen mit altem und neuem Wert dabei', D.slice(2));
  // ---------- Blätter: A4, nichts läuft über, keine geteilte Zeile ----------
  const geo = await ev(() => { const r = ekMappe('2026-11'); const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:0;top:0'; host.innerHTML = r.pages.join(''); document.body.appendChild(host);
    const out = [...host.querySelectorAll('.ab-page')].map(pg => { const body = pg.querySelector('.ab-body'); const br = body.getBoundingClientRect(); const rows = [...body.querySelectorAll('tr, .mp-sec h2, .mp-empty, .mp-note')]; return {w:pg.offsetWidth, h:pg.offsetHeight, over:body.scrollHeight - body.clientHeight, cut:rows.filter(x => x.getBoundingClientRect().bottom > br.bottom + 1).length, wide:rows.filter(x => x.getBoundingClientRect().right > br.right + 1).length}; });
    host.outerHTML = ''; return out; });
  L.ok(geo.every(g => g.w === 794 && g.h === 1123 && g.over <= 1 && g.cut === 0 && g.wide === 0), 'jedes Blatt 794 × 1123 (A4), kein Überlauf, keine Zeile über den Blattrand', geo);
  // ---------- anderer Monat, leerer Monat ----------
  const oct = await ev(() => { const r = ekMappe('2026-10'); const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:0;top:0;width:794px'; document.body.appendChild(host); host.innerHTML = r.pages.join(''); const out = {days:r.days, h:host.querySelector('.ab-h').innerText.replace(/\s+/g, ' '), t:host.innerText.replace(/\s+/g, ' ')}; host.outerHTML = ''; return out; });
  L.ok(oct.days === 31 && /Eigenkontrolle · Oktober 2026 1\.10\. bis 31\.10\. erstellt/.test(oct.h) && /In diesem Monat wurde keine Temperatur einer Lieferung eingetragen\./.test(oct.t) && /Do 1\.10\. · · · ·/.test(oct.t) && /Do 1\.10\. keine Liste fällig/.test(oct.t) && /In diesem Monat wurde keine Abweichung eingetragen\./.test(oct.t), 'Oktober: ganzer Monat, 31 Zeilen; wo nichts eingetragen wurde, steht das so da', oct.h);
  // ---------- echte Datei ----------
  const d = await L.dl(p, () => p.click('#app [data-pdf="ckPrint"]'));
  await w(300); const last = await ev(() => window.__ekLast);
  L.ok(d.name === 'Monatsmappe-2026-11.pdf' && d.size > 60000 && L.pdfPages(d.file) === m.n && last.pages === m.n && last.dev === 5 && fs.readFileSync(d.file).slice(0, 5).toString() === '%PDF-', `echte PDF-Datei gespeichert: ${m.n} Seiten wie Blätter`, [d.name, d.size, L.pdfPages(d.file)]);
  L.ok(/PDF erstellt: Monatsmappe-2026-11\.pdf \(\d Seiten\)/.test(await L.toast(p)) && await ev(() => document.querySelector('#print').innerHTML === ''), 'Meldung mit Seitenzahl; der Druckbereich ist danach leer');
  await p.selectOption('#app [data-ckmonth]', '2026-10'); const d2 = await L.dl(p, () => p.click('#app [data-pdf="ckPrint"]'));
  L.ok(d2.name === 'Monatsmappe-2026-10.pdf' && L.pdfPages(d2.file) >= 2, 'anderer Monat wählbar', [d2.name, L.pdfPages(d2.file)]);
  // Team darf die Mappe auch speichern
  await L.team(p); await ev(() => { view.ck = {tab:'verlauf'}; go('checkl'); }); await w(200);
  L.ok(await ev(() => { const x = document.querySelector('#app [data-pdf="ckPrint"]'); return !!x && !x.disabled; }), 'Team: Monatsmappe ist erreichbar'); await L.chef(p);
  // ---------- Verlauf am Bildschirm: Eigenkontrolle des Tages ----------
  await ev(() => { view.ck = {tab:'verlauf', hist:'2026-11-06'}; go('checkl'); }); await w(200);
  L.ok(/Eigenkontrolle 2 Einträge Handwaschbecken und Seifenspender reinigen Lukas · 21:\d\d Wareneingang Metzgerei Brunnhuber: Kühlware 6,5 °C Fahrer darauf hingewiesen/.test(await L.txt(p, '#app .ck-hr.open .ck-hdw')), 'Verlauf, 6.11. aufgeklappt: Reinigung und Wareneingang dieses Tages stehen dabei', (await L.txt(p, '#app .ck-hr.open .ck-hdw')).slice(0, 160));
  // ---------- Aufbewahrung: mindestens 13 Monate ----------
  const keep = await ev(() => { const d = JSON.parse(JSON.stringify(S)); const T = '2026-11-12'; const mk = (D, id) => { d.checks.runs[D] = {ek_clean:{items:{ec_hand:{b:'A', a:'10:00', due:D}}, n:0}, ck_open_k:{items:{ck_open_k_2:{b:'A', a:'08:00', v:3}}, n:12}}; d.checks.ek.log.push({id, k:'we', d:D, a:'08:00', at:D + 'T08:00:00', b:'A', kv:3, tv:null, okc:true, out:0}); };
    mk('2025-10-12', 'old13'); mk(dAdd(T, -400), 'edge'); mk(dAdd(T, -401), 'gone'); const r = migrate(d);
    return {m13:!!r.checks.runs['2025-10-12'] && r.checks.ek.log.some(x => x.id === 'old13'), edge:!!r.checks.runs[dAdd(T, -400)] && r.checks.ek.log.some(x => x.id === 'edge'), gone:!r.checks.runs[dAdd(T, -401)] && !r.checks.ek.log.some(x => x.id === 'gone'), days:EK_KEEP_DAYS, ck:CK_KEEP_RUNS, span:Math.round((new Date('2026-11-12') - new Date('2025-10-12')) / 864e5)}; });
  L.ok(keep.m13 && keep.edge && keep.gone && keep.days >= 397 && keep.span === 396, 'Einträge von vor 13 Monaten (12.10.2025, 396 Tage) bleiben: Messwerte, Reinigung, Wareneingang; aufgeräumt wird erst nach 400 Tagen', keep);
  // ---------- Sicherung enthält die Eigenkontrolle ----------
  await L.go(p, 'einstellungen'); await L.idle(p);
  const store = await ev(async () => { const d = await __store.read(); return {ek:!!d.checks.ek, log:d.checks.ek.log.length, clean:d.checks.ek.clean.length, lim:d.checks.ek.limits.kuehl, run:!!d.checks.runs['2026-11-02'].ek_clean, sv:d.cards.every(c => typeof c.svNote === 'string')}; });
  await p.click('#app [data-act=export]'); await w(200); const file = (await L.dl(p, () => p.click('#dlBtn'))).file; await ev(() => document.querySelector('#dlg').close());
  const bd = file ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  L.ok(store.ek && store.log === 6 && store.clean === 4 && store.lim === 4 && store.run && store.sv && !!bd && bd.checks.ek.log.length === 6 && bd.checks.ek.clean.length === 4 && !!bd.checks.runs['2026-11-02'].ek_clean && bd.cards.some(c => Array.isArray(c.svHide)), 'Speicher und heruntergeladene Sicherung enthalten Einträge, Reinigungsplan, Grenzwerte und die Service-Felder', [store, file]);
  await L.done(b, p.errs); })();
