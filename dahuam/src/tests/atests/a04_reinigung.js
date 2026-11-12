// Reinigung nach Abreise: eine Aufgabe je Abreise, Wechseltag (bis Anreise um …, dringend, zu spät), Wäsche, Abhaken mit Rückgängig,
// nur der Chef nimmt zurück (mit Verlauf), wer reinigt, Checkliste und Notiz mit Verlauf, noch offen von früher, Check-in-Zeit.
const L = require('./lib');
const SETUP = () => { const a = apS(); a.bookings.push(
  {id:'x1', apt:'apt_a', from:'2026-11-08', to:'2026-11-12', guest:'Abreise heute', n:2, ch:'direkt', note:'', arr:'', src:'hand'},
  {id:'x2', apt:'apt_a', from:'2026-11-12', to:'2026-11-15', guest:'Anreise heute', n:3, ch:'booking', note:'', arr:'', src:'hand'},
  {id:'x3', apt:'apt_a', from:'2026-11-15', to:'2026-11-19', guest:'Anreise Sonntag', n:2, ch:'direkt', note:'', arr:'12:30', src:'hand'},
  {id:'x4', apt:'apt_b', from:'2026-11-10', to:'2026-11-14', guest:'Abreise Samstag', n:2, ch:'direkt', note:'', arr:'', src:'hand'},
  {id:'x5', apt:'apt_b', from:'2026-11-20', to:'2026-11-22', guest:'Später', n:2, ch:'direkt', note:'', arr:'', src:'hand'},
  {id:'x6', apt:'apt_b', from:'2026-11-06', to:'2026-11-09', guest:'Vorige Woche', n:1, ch:'direkt', note:'', arr:'', src:'hand'}); save(); render(); };
(async () => { const b = await L.launch();
  { const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
    await L.clean(p); await ev(SETUP); await L.ap(p, 'reinigung');
    const rows = () => ev(() => [...document.querySelectorAll('#app .ap-cl')].map(li => ({key:li.querySelector('.ap-ck').dataset.id, cls:li.className, t:li.querySelector('.ap-cm').innerText.replace(/\s+/g, ' ').trim(), who:li.querySelector('.ap-who').textContent})));
    let r = await rows();
    L.ok(r.map(x => x.key).join(' ') === 'apt_b|2026-11-09 apt_a|2026-11-12 apt_b|2026-11-14 apt_a|2026-11-15', 'je Abreise eine Reinigung: noch offen von voriger Woche, heute, Samstag, Sonntag', r.map(x => x.key));
    L.ok(await ev(() => { const keys = new Set(S.apart.bookings.filter(b => b.to >= '2026-11-09' && b.to <= '2026-11-15').map(b => b.apt + '|' + b.to)); return keys.size === 4 && Object.keys(S.apart.cleans).length === 0; }), 'Aufgaben entstehen aus den Abreisen von selbst, ohne gespeicherten Eintrag');
    L.ok(/offen seit Mo 9\.11\./.test(r[0].t) && /bad-t|over/.test(r[0].cls) && await L.txt(p, '#app .ap-ch') === 'Noch offen', '„Noch offen“: Reinigung vom Montag, rot', r[0]);
    L.ok(/Wechseltag · bis Anreise um 15:00 Uhr/.test(r[1].t) && / urgent/.test(r[1].cls), 'heute Wechseltag ohne Ankunftszeit: „bis Anreise um 15:00 Uhr“ (Check-in), dringend markiert', r[1]);
    L.ok(/nächste Anreise Fr 20\.11\./.test(r[2].t) && !/urgent|late/.test(r[2].cls), 'ohne Anreise am selben Tag: nächste Anreise mit Datum, nicht dringend', r[2]);
    L.ok(/Wechseltag · bis Anreise um 12:30 Uhr/.test(r[3].t), 'Wechseltag mit Ankunftszeit der Buchung: „bis Anreise um 12:30 Uhr“', r[3]);
    L.ok(await L.txt(p, '#app .ap-wash') === 'Wäsche diese Woche: 10 Sets für 4 Abreisen Apartment Alpha 2 × 3 Betten · Apartment Beta 2 × 2 Betten', 'Wäsche: Betten je Apartment mal Abreisen dieser Woche (2 × 3 + 2 × 2 = 10)', await L.txt(p, '#app .ap-wash'));
    // abhaken, rückgängig
    await p.click('#app .ap-ck[data-id="apt_a|2026-11-12"]'); await p.waitForTimeout(200);
    const me1 = await ev(() => apWho()); let rec = await ev(() => JSON.parse(JSON.stringify(S.apart.cleans['apt_a|2026-11-12'] || null)));
    L.ok(rec && rec.done.b === me1 && rec.done.a === '10:30' && rec.done.d === '2026-11-12' && /Apartment Alpha: bereit für Anreise/.test(await L.toastTxt(p)), 'Kästchen: fertig, bereit für Anreise, mit Name und Uhrzeit', rec);
    L.ok(await ev(m => new RegExp('bereit für Anreise · ' + m + ', 10:30 Uhr').test(document.querySelector('#app .ap-cl.on').innerText), me1), 'Zeile zeigt, wer wann fertig gemeldet hat');
    await L.toastUndo(p);
    L.ok(await ev(() => !S.apart.cleans['apt_a|2026-11-12']), 'Rückgängig: wieder offen, nichts gespeichert');
    await p.click('#app .ap-ck[data-id="apt_a|2026-11-12"]'); await p.waitForTimeout(200);
    // Team darf nicht zurücknehmen
    await L.team(p); await L.ap(p, 'reinigung'); const me2 = await ev(() => apWho());
    await p.click('#app .ap-ck[data-id="apt_a|2026-11-12"]'); await p.waitForTimeout(200);
    L.ok(/Zurücknehmen kann das nur der Chef/.test(await L.toastTxt(p)) && await ev(() => !!S.apart.cleans['apt_a|2026-11-12'].done), 'Team: Häkchen bleibt, Hinweis: nur der Chef nimmt zurück');
    await p.click('#app .ap-ck[data-id="apt_b|2026-11-14"]'); await p.waitForTimeout(200);
    L.ok(await ev(() => !!S.apart.cleans['apt_b|2026-11-14'].done), 'Team darf fertig melden');
    await L.chef(p); await L.ap(p, 'reinigung');
    await p.click('#app .ap-ck[data-id="apt_b|2026-11-14"]'); await p.waitForTimeout(200);
    rec = await ev(() => JSON.parse(JSON.stringify(S.apart.cleans['apt_b|2026-11-14'])));
    L.ok(!rec.done && rec.hist.length === 1 && rec.hist[0].k === 'undone' && rec.hist[0].v === me2 + ', 10:30 Uhr' && rec.hist[0].b === me1, 'Chef nimmt zurück: wieder offen, im Verlauf steht, was vorher war', rec);
    // wer reinigt
    const ppl = await ev(() => apPeople());
    await p.click('#app .ap-who[data-id="apt_a|2026-11-15"]'); await p.waitForTimeout(200);
    L.ok(await ev(() => document.querySelectorAll('#dlgForm [data-appick]').length) === ppl.length && ppl.length > 0, 'Wer reinigt? Personen aus dem Team zum Antippen', ppl);
    await p.click(`#dlgForm [data-appick="${ppl[0]}"]`); await p.waitForTimeout(200);
    L.ok(await ev(n => S.apart.cleans['apt_a|2026-11-15'].who === n && document.querySelector('#app .ap-who[data-id="apt_a|2026-11-15"]').textContent === n, ppl[0]), 'ein Tipp auf den Namen speichert');
    await p.click('#app .ap-who[data-id="apt_a|2026-11-15"]'); await p.waitForTimeout(200); await L.dlgFill(p, {who:'Reinigung Huber'}); await L.submit(p);
    L.ok(await ev(n => { const r = S.apart.cleans['apt_a|2026-11-15']; return r.who === 'Reinigung Huber' && r.hist.some(h => h.k === 'who' && h.v === n); }, ppl[0]), 'frei geschriebener Name; der vorige steht im Verlauf');
    // Detail: Checkliste, Notiz
    await p.click('#app .ap-cm[data-id="apt_a|2026-11-15"]'); await p.waitForTimeout(200);
    const dl = await ev(() => ({h:document.querySelector('#dlg h3').textContent, info:document.querySelector('#dlgForm .ap-dinfo').innerText, items:[...document.querySelectorAll('#dlgForm [name="it"]')].length, hist:!!document.querySelector('#dlgForm .ap-hist')}));
    L.ok(dl.h === 'Reinigung · Apartment Alpha' && /Abreise So 15\.11\.: Anreise heute · 3 Personen/.test(dl.info) && /Wechseltag: Anreise am So 15\.11\. um 12:30 Uhr/.test(dl.info) && dl.items === 6 && dl.hist, 'Detail: wer abreist, wer anreist und bis wann; sechs Punkte der Checkliste; Verlauf', dl);
    await p.click('#dlgForm label:has(> input[name="it"][value="al_1"])'); await p.click('#dlgForm label:has(> input[name="it"][value="al_2"])');
    await L.dlgFill(p, {note:'Bettwäsche fehlt'}); await L.submit(p);
    r = await rows(); const row15 = r.find(x => x.key === 'apt_a|2026-11-15');
    L.ok(/2 von 6/.test(row15.t) && /Bettwäsche fehlt/.test(row15.t) && await ev(() => Object.keys(S.apart.cleans['apt_a|2026-11-15'].items).length === 2), 'Zeile: 2 von 6 abgehakt, Notiz sichtbar', row15);
    await p.click('#app .ap-cm[data-id="apt_a|2026-11-15"]'); await p.waitForTimeout(200); await L.dlgFill(p, {note:'Schaden am Duschvorhang'}); await p.click('#dlgForm label.ap-done'); await L.submit(p);
    rec = await ev(() => JSON.parse(JSON.stringify(S.apart.cleans['apt_a|2026-11-15'])));
    L.ok(rec.note === 'Schaden am Duschvorhang' && rec.hist.some(h => h.k === 'note' && h.v === 'Bettwäsche fehlt') && !!rec.done, 'Notiz geändert: die alte steht im Verlauf; „fertig“ auch im Detail', rec);
    await p.click('#app .ap-cm[data-id="apt_a|2026-11-15"]'); await p.waitForTimeout(200); await p.click('#dlgForm .ap-hist summary');
    L.ok(await ev(() => /Notiz geändert \(vorher: Bettwäsche fehlt\)/.test(document.querySelector('#dlgForm .ap-hist').innerText) && /Zuständig geändert/.test(document.querySelector('#dlgForm .ap-hist').innerText)), 'Verlauf im Detail lesbar');
    await L.shot(p, 'reinigung-detail', {full:false, out:L.SHOTS}); await L.dlgClose(p);
    await L.shot(p, 'reinigung-desktop-hell', {out:L.SHOTS});
    // Checkliste bearbeiten
    await L.ap(p, 'verwalten'); await p.click('#app [data-act="apListEdit"]'); await p.waitForTimeout(200);
    await p.click('#dlgForm .ap-le:nth-child(6) [data-apdel]'); await p.click('#dlgForm [data-apadd]'); await p.fill('#dlgForm .ap-le:last-child input', 'Kinderbett prüfen'); await L.submit(p);
    L.ok(await ev(() => S.apart.settings.list.map(x => x.t).join('|') === 'Betten frisch bezogen|Bad|Küche|Müll|Handtücher|Kinderbett prüfen' && S.apart.settings.list[0].id === 'al_1'), 'Checkliste vom Chef geändert, bestehende Punkte behalten ihre Kennung');
    // Check-in-Zeit
    await p.click('#app [data-act="apTimes"]'); await p.waitForTimeout(150); await L.dlgFill(p, {ci:'16:00'}); await L.submit(p);
    await L.ap(p, 'reinigung'); r = await rows();
    L.ok(await ev(() => apTaskWhen(apTask('apt_a', '2026-11-12')) === 'Wechseltag · bis Anreise um 16:00 Uhr' && apTaskWhen(apTask('apt_a', '2026-11-15')) === 'Wechseltag · bis Anreise um 12:30 Uhr'), 'Check-in 16:00: Wechseltag „bis Anreise um 16:00 Uhr“; eine Ankunftszeit der Buchung geht vor');
    // Abreise verschoben: Aufgabe wandert mit
    await ev(() => { const x = S.apart.bookings.find(b => b.id === 'x4'); x.to = '2026-11-13'; save(); render(); });
    r = await rows(); L.ok(r.some(x => x.key === 'apt_b|2026-11-13') && !r.some(x => x.key === 'apt_b|2026-11-14'), 'Abreise verschoben: die Reinigung steht am neuen Tag');
    L.ok(p.errs.length === 0, 'keine Fehler', p.errs); await p.context().close(); }
  // ---------- um 16:00: Wechseltag zu spät ----------
  { const {p} = await L.open(b, {vp:{width:1280, height:900}, at:[2026, 11, 12, 16, 0]}); const ev = (f, a) => p.evaluate(f, a);
    await L.clean(p); await ev(SETUP); await L.ap(p, 'reinigung');
    const cls = await ev(() => document.querySelector('#app .ap-ck[data-id="apt_a|2026-11-12"]').closest('li').className);
    L.ok(/ late/.test(cls) && await ev(() => !!document.querySelector('#app .ap-ck[data-id="apt_a|2026-11-12"]').closest('li').querySelector('.bad-t')), '16:00, Anreise war 15:00, Reinigung offen: rot', cls);
    await L.go(p, 'heute');
    L.ok(await L.txt(p, '#app .ap-dash .rw-main') === 'Apartments 1 Anreise, 1 Abreise, 2 Reinigungen offen, Wechseltag bis 15:00 Uhr', 'Heute: Anreise, Abreise und offene Reinigungen (auch die von früher) in einer Zeile', await L.txt(p, '#app .ap-dash .rw-main'));
    L.ok(p.errs.length === 0, 'keine Fehler', p.errs); await p.context().close(); }
  await L.done(b, []); })();
