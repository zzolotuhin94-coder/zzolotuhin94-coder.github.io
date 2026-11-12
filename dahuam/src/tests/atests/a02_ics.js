// Kalender-Import (.ics): Lesen (Faltung, CRLF/LF, ganztägig, TZID, UTC, Dauer, storniert, kaputt), Booking-Format ohne Namen, Airbnb,
// Vorschau neu / geändert / entfällt, erneuter Import nach UID, Rückgängig, Verbinden mit eigener Eintragung, Adresse abrufen mit Ausweichweg, XSS.
const L = require('./lib'); const fs = require('fs');
const R = n => fs.readFileSync(L.sample(n), 'utf8');
(async () => { const b = await L.launch();
  const {c, p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
  await L.clean(p);
  // ---------- Lesen ----------
  const P = await ev(f => { const o = {}; for(const [k, t] of Object.entries(f)){ const r = apIcsParse(t); o[k] = r.err ? {err:r.err} : {cal:r.cal, ev:r.events, kind:apIcsKind(r.cal, r.events)}; } return o; },
    {v1:R('booking_v1.ics'), ab:R('airbnb.ics'), abCrlf:R('airbnb.ics').replace(/\n/g, '\r\n'), ot:R('anderer.ics'), bad:R('kein_kalender.ics')});
  const e1 = P.v1.ev[0];
  L.ok(P.v1.ev.length === 4 && e1.uid === 'beispiel-0001-' + 'a'.repeat(66) + 'bbbb@booking.com' && e1.from === '2026-11-13' && e1.to === '2026-11-16' && e1.sum === 'CLOSED - Not available' && P.v1.kind === 'booking', 'Booking-Datei (CRLF): vier Zeiträume, gefaltete UID zusammengesetzt, ganztägig: Abreise = DTEND', e1);
  L.ok(JSON.stringify(P.ab.ev) === JSON.stringify(P.abCrlf.ev) && P.ab.kind === 'airbnb' && P.ab.ev[0].desc === 'Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMBEISPIEL\nPhone Number (Last 4 Digits): 0000', 'Airbnb-Datei: LF und CRLF ergeben dasselbe, \\n in der Beschreibung wird Zeilenumbruch');
  const o = Object.fromEntries(P.ot.ev.map(x => [x.uid, x]));
  L.ok(o['o1@beispiel'].from === '2026-11-18' && o['o1@beispiel'].to === '2026-11-21', 'TZID-Zeiten: Datum wie angegeben', o['o1@beispiel']);
  L.ok(o['o2@beispiel'].from === '2026-11-24' && o['o2@beispiel'].to === '2026-11-25', 'UTC-Zeit (23:00 Z) wird zur Ortszeit: Anreise 24.11.', o['o2@beispiel']);
  L.ok(o['o3@beispiel'].to === '2026-12-01' && o['o4@beispiel'].from === '2026-12-05' && o['o4@beispiel'].to === '2026-12-06', 'DURATION P3D und fehlendes DTEND (ein Tag)');
  L.ok(o['o5@beispiel'].status === 'CANCELLED' && !!o['o6@beispiel'].err && !!o['o7@beispiel'].err, 'storniert erkannt; unlesbares Datum und Ende vor Anfang als Fehler');
  L.ok(o['o1@beispiel'].desc === 'Notiz, mit Komma; und <script>window.__xss=2</script>' && P.ot.cal.name === 'Ferienwohnung <b>Test</b>' && P.ot.kind === 'andere', 'Text entschlüsselt (\\, \;), Alarm im Termin überschreibt die Beschreibung nicht, Kalendername gelesen');
  L.ok(!!P.bad.err && /keine Kalenderdatei/.test(P.bad.err), 'keine Kalenderdatei: klare Meldung', P.bad.err);
  // ---------- Import Booking über die Oberfläche ----------
  await L.ap(p, 'verwalten');
  await p.click('#app [data-act="apIcs"][data-id="apt_a"]'); await p.waitForTimeout(200);
  L.ok(await ev(() => document.querySelector('#dlgForm button[type=submit]').disabled && document.querySelector('#apIcsApt').value === 'apt_a'), 'Dialog: Apartment vorausgewählt, „Übernehmen“ erst mit Datei');
  await p.setInputFiles('#apIcsFile', L.sample('booking_v1.ics')); await p.waitForTimeout(400);
  let pv = await L.txt(p, '#apIcsOut');
  L.ok(/Booking\.com: 4 neu/.test(pv) && /Booking liefert im Kalender keine Gastnamen, nur belegte Zeiträume/.test(pv) && await ev(() => document.querySelectorAll('#apIcsOut .ap-il.st-neu').length) === 4, 'Vorschau: 4 neu, ehrlicher Hinweis: keine Gastnamen', pv);
  await p.click('#dlgForm summary >> text=So bekommen Sie die Datei'); await L.shot(p, 'import-vorschau', {full:false, out:L.SHOTS});
  await L.submit(p);
  let bk = await ev(() => S.apart.bookings.filter(x => x.apt === 'apt_a').map(x => ({uid:x.uid, from:x.from, to:x.to, src:x.src, ch:x.ch, guest:x.guest, n:x.n})));
  L.ok(bk.length === 4 && bk.every(x => x.src === 'ics' && x.ch === 'booking' && x.guest === '' && x.n === null) && /Kalender übernommen: 4 neu/.test(await L.toastTxt(p)), 'übernommen: 4 Buchungen aus dem Kalender, ohne Namen', bk);
  L.ok(await ev(() => /Kalender Booking\.com importiert am 12\.11\.2026 · booking_v1\.ics/.test(document.querySelector('#app .ap-apts li').innerText)), 'beim Apartment steht, wann welcher Kalender importiert wurde');
  // ---------- erneuter Import: neu / geändert / entfällt, nach UID ----------
  const reimp = async (file, apt) => { await p.click(`#app [data-act="apIcs"][data-id="${apt || 'apt_a'}"]`); await p.waitForTimeout(200); await p.setInputFiles('#apIcsFile', L.sample(file)); await p.waitForTimeout(400); return ev(() => ({...apIcsDlg.cur.plan.counts})); };
  let cn = await reimp('booking_v2.ics');
  pv = await L.txt(p, '#apIcsOut');
  L.ok(cn.neu === 1 && cn.akt === 1 && cn.weg === 1 && cn.gleich === 1 && cn.skip === 0, 'zweiter Import: 1 neu, 1 geändert, 1 entfällt, 1 unverändert; der vergangene Zeitraum (1.–5.11.) wird nicht als „entfällt“ gezählt', cn);
  L.ok(/Fr 20\.11\. – Di 24\.11\. Fr 20\.11\. – Mo 23\.11\./.test(pv) && /steht nicht mehr im Kalender/.test(pv), 'Vorschau zeigt den alten Zeitraum durchgestrichen und warum etwas entfällt', pv);
  await L.submit(p);
  bk = await ev(() => S.apart.bookings.filter(x => x.apt === 'apt_a').map(x => x.uid.slice(0, 13) + ':' + x.from + '>' + x.to).sort());
  L.ok(bk.join(' ') === 'beispiel-0001:2026-11-13>2026-11-16 beispiel-0002:2026-11-20>2026-11-24 beispiel-0004:2026-11-01>2026-11-05 beispiel-0005:2026-12-10>2026-12-12', 'nach UID abgeglichen: keine Doppelten, geändert, entfallen, neu; Vergangenes bleibt', bk);
  await L.toastUndo(p);
  bk = await ev(() => S.apart.bookings.filter(x => x.apt === 'apt_a').map(x => x.uid.slice(0, 13) + ':' + x.to).sort());
  L.ok(bk.join(' ') === 'beispiel-0001:2026-11-16 beispiel-0002:2026-11-23 beispiel-0003:2026-12-05 beispiel-0004:2026-11-05' && /Rückgängig gemacht/.test(await L.toastTxt(p)), 'Rückgängig: Stand wie nach dem ersten Import', bk);
  await reimp('booking_v2.ics'); await L.submit(p); await p.waitForTimeout(200);
  L.ok(await ev(() => !!document.querySelector('#app [data-act="apIcsUndo"]')), 'beim Apartment: „Import rückgängig“, solange die Seite offen ist');
  await p.click('#app [data-act="apIcsUndo"]'); await p.waitForTimeout(200);
  L.ok(await ev(() => S.apart.bookings.filter(x => x.apt === 'apt_a').length === 4 && S.apart.bookings.some(x => x.uid === 'beispiel-0003@booking.com') && !document.querySelector('#app [data-act="apIcsUndo"]')), '„Import rückgängig“ beim Apartment wirkt auch');
  await reimp('booking_v2.ics'); await L.submit(p); cn = await reimp('booking_v2.ics');
  L.ok(cn.gleich === 3 && cn.neu + cn.akt + cn.weg === 0, 'dieselbe Datei noch einmal: alles unverändert', cn);
  await L.submit(p); L.ok(/Nichts zu ändern/.test(await L.toastTxt(p)) && !(await L.dlgOpen(p)), '„Übernehmen“ ohne Änderung: kurze Meldung');
  // Namen bleiben beim nächsten Import
  await ev(() => { const x = S.apart.bookings.find(o => o.uid === 'beispiel-0005@booking.com'); x.guest = 'Familie Nachtrag'; x.n = 3; save(); });
  await reimp('booking_v2.ics'); await L.submit(p);
  L.ok(await ev(() => { const x = S.apart.bookings.find(o => o.uid === 'beispiel-0005@booking.com'); return x.guest === 'Familie Nachtrag' && x.n === 3; }), 'nachgetragener Name und Personen bleiben beim nächsten Import');
  // ---------- Airbnb, verbunden mit eigener Eintragung ----------
  await ev(() => { S.apart.bookings.push({id:'bk_hand', apt:'apt_b', from:'2026-11-14', to:'2026-11-17', guest:'Gast Hand', n:2, ch:'airbnb', note:'', arr:'', src:'hand'}); save(); render(); });
  cn = await reimp('airbnb.ics', 'apt_b'); pv = await L.txt(p, '#apIcsOut');
  L.ok(cn.link === 1 && cn.skip === 1 && cn.neu === 0 && /Airbnb/.test(pv) && /nur gesperrt, keine Buchung/.test(pv) && /mit Ihrer Eintragung verbunden/.test(pv), 'Airbnb: „Reserved“ mit der eigenen Eintragung (gleicher Zeitraum) verbunden, gesperrte Tage ausgelassen', [cn, pv]);
  await L.submit(p);
  L.ok(await ev(() => { const l = S.apart.bookings.filter(x => x.apt === 'apt_b'); return l.length === 1 && l[0].guest === 'Gast Hand' && l[0].uid === '1418fb94e984-beispiel@airbnb.com'; }), 'keine doppelte Buchung, der Name bleibt');
  cn = await reimp('airbnb.ics', 'apt_b'); L.ok(cn.gleich === 1 && cn.link === 0, 'nächster Airbnb-Import: unverändert', cn); await L.dlgClose(p);
  // ---------- anderer Kalender, XSS ----------
  await ev(() => { apS().apts.push({id:'apt_c', name:'Apartment Gamma', guests:2, beds:2, note:'', color:3}); save(); render(); });
  cn = await reimp('anderer.ics', 'apt_c');
  L.ok(cn.neu === 4 && cn.skip === 3, 'anderer Kalender: 4 neu, storniert und 2 kaputte ausgelassen', cn);
  L.ok(await ev(() => !document.querySelector('#apIcsOut img, #apIcsOut script, #apIcsOut .ap-sum b b') && window.__xss === undefined && /Familie <img src=x/.test(document.querySelector('#apIcsOut').innerText)), 'Titel aus der Datei als Text, nicht als HTML (XSS)');
  await L.submit(p);
  await L.ap(p, 'uebersicht'); await ev(() => { view.ap.w = '2026-11-16'; render(); });
  const id = await ev(() => S.apart.bookings.find(x => x.uid === 'o1@beispiel').id);
  await p.click(`#app .ap-bar[data-id="${id}"]`); await p.waitForTimeout(200);
  L.ok(await ev(() => !document.querySelector('#dlgForm img, #dlgForm script') && window.__xss === undefined && /<script>window.__xss=2<\/script>/.test(document.querySelector('#dlgForm').innerText) && /aus dem Kalender|einem anderen Anbieter/.test(document.querySelector('#dlgForm').innerText)), 'Buchung aus dem Kalender: Titel und Beschreibung als Text');
  await L.dlgClose(p);
  // ---------- Text einfügen, Adresse abrufen ----------
  await L.ap(p, 'verwalten'); await p.click('#app [data-act="apIcs"][data-id="apt_c"]'); await p.waitForTimeout(200);
  await p.click('#dlgForm summary >> text=Text einfügen'); await p.fill('#apIcsTxt', R('booking_v1.ics')); await p.waitForTimeout(250);
  L.ok(await ev(() => apIcsDlg.cur.plan && apIcsDlg.cur.plan.counts.neu === 4 && apIcsDlg.cur.file === 'eingefügt'), 'eingefügter Text wird wie eine Datei gelesen');
  await p.fill('#apIcsTxt', 'irgendwas'); await p.waitForTimeout(200);
  L.ok(/keine Kalenderdatei/.test(await L.txt(p, '#apIcsOut')) && await ev(() => document.querySelector('#dlgForm button[type=submit]').disabled), 'Unsinn: Meldung, „Übernehmen“ gesperrt');
  await p.route('https://kalender.beispiel.test/apt.ics', r => r.fulfill({status:200, contentType:'text/calendar', body:R('booking_v1.ics')}));
  await p.fill('#apIcsUrl', 'https://kalender.beispiel.test/apt.ics'); await p.click('#apIcsFetch'); await p.waitForTimeout(600);
  L.ok(await ev(() => apIcsDlg.cur.plan && apIcsDlg.cur.plan.counts.neu === 4 && apIcsDlg.cur.file === 'kalender.beispiel.test'), 'Adresse abrufen: klappt, wenn der Anbieter es erlaubt');
  const n0 = c.ext.length;
  await p.fill('#apIcsUrl', 'https://admin.booking.beispiel.test/ical.html?t=123'); await p.click('#apIcsFetch'); await p.waitForTimeout(800);
  L.ok(/lässt sich vom Browser aus nicht direkt abrufen/.test(await L.txt(p, '#apIcsOut')) && /Datei wählen/.test(await L.txt(p, '#apIcsOut')) && c.ext.length === n0 + 1, 'gesperrte Adresse: klare Meldung mit dem Ausweichweg (Datei speichern, hier wählen)');
  await L.dlgClose(p);
  L.ok(c.ext.every(u => /beispiel\.test/.test(u)), 'keine anderen Netzwerkzugriffe als die ausdrücklich abgerufene Adresse', c.ext);
  await L.done(b, p.errs.filter(e => !/Failed to load resource|net::ERR_FAILED|CORS/.test(e))); })();
