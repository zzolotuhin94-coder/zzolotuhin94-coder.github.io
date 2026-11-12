// Buchungen von Hand: eintragen, prüfen (Datum, Überschneidung, Personen), ändern, löschen mit Rückgängig, Team nur lesend, nach dem Neuladen noch da.
const L = require('./lib');
(async () => { const b = await L.launch();
  const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
  await L.clean(p); await L.ap(p);
  L.ok(await ev(() => view.tab === 'apart' && location.hash === '#apartments' && document.querySelector('.side .nav-i.on').dataset.tab === 'apart' && document.title.startsWith('Apartments')), 'Bereich „Apartments“: Adresse #apartments, in der Seitenleiste markiert');
  // ---------- eintragen ----------
  await p.click('#app [data-act="apBookNew"]'); await p.waitForTimeout(200);
  L.ok(await ev(() => document.querySelector('#dlg h3').textContent === 'Neue Buchung' && document.querySelectorAll('#dlgForm [name="ch"]').length === 4), 'Dialog „Neue Buchung“ mit Kanal Booking.com, direkt, Airbnb, andere');
  await L.dlgFill(p, {apt:'apt_a', from:'2026-11-13', to:'2026-11-16', guest:'Familie Test', n:'3', ch:'booking', note:'Kinderbett'});
  L.ok(await L.txt(p, '#apNights') === '3 Nächte', 'zeigt die Nächte');
  await L.submit(p);
  let bk = await ev(() => S.apart.bookings.map(x => ({...x})));
  L.ok(bk.length === 1 && bk[0].apt === 'apt_a' && bk[0].from === '2026-11-13' && bk[0].to === '2026-11-16' && bk[0].guest === 'Familie Test' && bk[0].n === 3 && bk[0].ch === 'booking' && bk[0].note === 'Kinderbett' && bk[0].src === 'hand' && !(await L.dlgOpen(p)), 'Buchung gespeichert: Apartment, Anreise, Abreise, Gast, Personen, Kanal, Notiz', bk[0]);
  L.ok(/Buchung eingetragen/.test(await L.toastTxt(p)), 'Meldung „Buchung eingetragen“');
  // ---------- Datum prüfen ----------
  await p.click('#app [data-act="apBookNew"]'); await p.waitForTimeout(150);
  await L.dlgFill(p, {apt:'apt_a', from:'2026-11-20', to:'2026-11-20'}); await L.submit(p);
  L.ok(await L.dlgOpen(p) && /Abreise muss nach der Anreise/.test(await L.txt(p, '#dlgForm .f-err')), 'Abreise am Anreisetag: Hinweis am Feld, nichts gespeichert');
  await L.dlgClose(p);
  // ---------- Überschneidung ----------
  await p.click('#app [data-act="apBookNew"]'); await p.waitForTimeout(150);
  await L.dlgFill(p, {apt:'apt_a', from:'2026-11-15', to:'2026-11-18', guest:'Zweiter Gast', n:'2'}); await L.submit(p);
  const warn = await L.txt(p, '#apWarn');
  L.ok(await L.dlgOpen(p) && /Überschneidung in Apartment Alpha: Familie Test \(Fr 13\.11\. bis Mo 16\.11\.\)\./.test(warn) && await ev(() => S.apart.bookings.length) === 1, 'Überschneidung im selben Apartment: deutliche Warnung mit der anderen Buchung, noch nicht gespeichert', warn);
  await p.click('#apForce'); await p.waitForTimeout(250);
  L.ok(!(await L.dlgOpen(p)) && await ev(() => S.apart.bookings.length) === 2, 'erst „Trotzdem speichern“ speichert');
  L.ok(await ev(() => document.querySelectorAll('#app .ap-bar.clash').length) === 2, 'in der Woche sind beide Balken als Überschneidung markiert');
  // Abreise = nächste Anreise ist keine Überschneidung
  await p.click('#app [data-act="apBookNew"]'); await p.waitForTimeout(150);
  await L.dlgFill(p, {apt:'apt_b', from:'2026-11-12', to:'2026-11-14', n:'2'}); await L.submit(p);
  await p.click('#app [data-act="apBookNew"]'); await p.waitForTimeout(150);
  await L.dlgFill(p, {apt:'apt_b', from:'2026-11-14', to:'2026-11-17', n:'2'}); await L.submit(p);
  L.ok(!(await L.dlgOpen(p)) && await ev(() => S.apart.bookings.filter(x => x.apt === 'apt_b').length) === 2, 'Abreise und nächste Anreise am selben Tag: ohne Warnung');
  // anderes Apartment, gleicher Zeitraum: keine Warnung
  await p.click('#app [data-act="apBookNew"]'); await p.waitForTimeout(150);
  await L.dlgFill(p, {apt:'apt_b', from:'2026-11-20', to:'2026-11-22', n:'3'}); await L.submit(p);
  L.ok(await L.dlgOpen(p) && /3 Personen<\/b>, das Apartment hat 2 Plätze|3 Personen, das Apartment hat 2 Plätze/.test(await L.txt(p, '#apWarn')), 'mehr Personen als Plätze: Warnung, Bestätigung nötig', await L.txt(p, '#apWarn'));
  await L.dlgFill(p, {n:'2'}); L.ok(await ev(() => document.querySelector('#apWarn').innerHTML === ''), 'Eingabe ändern nimmt die Warnung weg'); await L.submit(p);
  L.ok(!(await L.dlgOpen(p)), 'mit 2 Personen ohne Warnung gespeichert');
  // ---------- ändern ----------
  const id1 = bk[0].id;
  await p.click(`#app .ap-bar[data-id="${id1}"]`); await p.waitForTimeout(200);
  L.ok(await ev(() => document.querySelector('#dlg h3').textContent === 'Buchung ändern' && document.querySelector('#dlgForm [name="guest"]').value === 'Familie Test'), 'Tipp auf den Balken öffnet die Buchung');
  await L.dlgFill(p, {guest:'Familie Probe', arr:'18:30'}); await L.submit(p);
  L.ok(await ev(id => { const x = S.apart.bookings.find(o => o.id === id); return x.guest === 'Familie Probe' && x.arr === '18:30'; }, id1), 'Gast und Ankunftszeit geändert');
  // ---------- löschen mit Rückgängig ----------
  await p.click(`#app .ap-bar[data-id="${id1}"]`); await p.waitForTimeout(200); await p.click('#dlgDel'); await p.waitForTimeout(200);
  L.ok(/Buchung gelöscht: Apartment Alpha, Fr 13\.11\./.test(await L.toastTxt(p)) && await ev(id => !S.apart.bookings.some(o => o.id === id), id1), 'Löschen: Buchung weg, Meldung mit Rückgängig');
  await L.toastUndo(p);
  L.ok(await ev(id => S.apart.bookings.some(o => o.id === id && o.guest === 'Familie Probe'), id1), 'Rückgängig: Buchung wieder da');
  // ---------- Team: sieht, ändert nicht ----------
  await L.team(p); await L.ap(p);
  L.ok(await ev(() => !document.querySelector('#app [data-act="apBookNew"]') && !document.querySelector('#app [data-act="apTab"][data-id="verwalten"]')), 'Team: kein „+ Buchung“, kein Reiter „Verwalten“');
  await p.click(`#app .ap-bar[data-id="${id1}"]`); await p.waitForTimeout(200);
  L.ok(await ev(() => document.querySelector('#dlg h3').textContent === 'Buchung' && !document.querySelector('#dlgForm button[type=submit]') && /Familie Probe/.test(document.querySelector('#dlgForm').innerText)), 'Team: Buchung nur zum Ansehen');
  await L.dlgClose(p);
  await ev(() => { view.ap.tab = 'verwalten'; render(); }); L.ok(await ev(() => view.ap.tab === 'uebersicht' || !document.querySelector('#app [data-act="apAptNew"]')), 'Team: „Verwalten“ auch über die Adresse nicht erreichbar');
  await L.chef(p);
  // ---------- nach dem Neuladen ----------
  await L.idle(p); await p.reload(); await L.ready(p);
  L.ok(await ev(() => S.apart.bookings.length === 5 && S.apart.apts.length === 2 && S.apart.bookings.some(o => o.guest === 'Familie Probe')), 'nach dem Neuladen: alle Buchungen da');
  await L.done(b, p.errs); })();
