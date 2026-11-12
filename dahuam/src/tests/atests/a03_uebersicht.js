// Übersicht mit den Beispieldaten: heute je Apartment, die Woche als Zeitleiste (Balken, frei, heute markiert), Wochen blättern,
// am Handy die Tage als Liste, die Zeile auf „Heute“, Adressen und „Mehr“.
const L = require('./lib');
(async () => { const b = await L.launch();
  { const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
    await L.ap(p);
    const sub = await L.txt(p, '#app .page-h .sub');
    L.ok(sub === 'Donnerstag, 12. November · 1 Anreise · 1 Abreise · heute Nacht 2 von 3 belegt · Beispiel, Namen sind erfunden', 'Kopfzeile: Datum, Anreisen, Abreisen, Belegung heute Nacht, Beispiel-Hinweis', sub);
    const rows = await ev(() => [...document.querySelectorAll('#app .ap-r')].map(r => r.innerText.replace(/\s+/g, ' ').trim()));
    L.ok(rows.length === 3 && /^Apartment Bergblick Wechseltag Abreise Familie Berger · 4 Personen Anreise Herr Lechner · 2 Personen · Ankunft spät, ca\. 21 Uhr Reinigung offen, bis 15:00 Uhr · \w+$/.test(rows[0]), 'Bergblick: Wechseltag mit Abreise, Anreise (Personen, Notiz) und offener Reinigung bis 15:00, wer reinigt', rows[0]);
    L.ok(rows[1] === 'Apartment Sonnseite belegt bis So 15.11. Gast Booking.com, ohne Namen' && rows[2] === 'Studio Zirbe frei bis Fr 13.11.', 'Sonnseite: belegt bis Sonntag (aus dem Booking-Kalender, ohne Namen); Studio: frei bis Freitag', rows.slice(1));
    L.ok(await ev(() => document.querySelector('#app .ap-r .ap-st').classList.contains('warn-t')), 'Wechseltag mit offener Reinigung farbig (ruhig, ohne Kasten)');
    // Woche
    const g = await ev(() => ({bars:[...document.querySelectorAll('#app .ap-bar')].map(x => x.querySelector('b').textContent + (x.classList.contains('cut-l') ? '<' : '') + (x.classList.contains('cut-r') ? '>' : '')),
      free:[...document.querySelectorAll('#app .ap-free-b')].map(x => x.textContent), today:document.querySelector('#app .ap-gd.today').textContent.trim(), days:[...document.querySelectorAll('#app .ap-gd')].length}));
    L.ok(g.bars.join('|') === 'Familie Berger<|Herr Lechner>|Booking.com, ohne Namen|Paar aus Wien<|Familie Huber>' && g.days === 7 && g.today === 'Do 12.11.', 'Woche KW 46: fünf Aufenthalte als Balken, angeschnitten an den Wochenrändern, heute markiert', g);
    L.ok(g.free.join('|') === 'frei · 2 Nächte|frei|frei · 3 Nächte', 'freie Nächte sichtbar: „frei · 2 Nächte“, „frei“, „frei · 3 Nächte“', g.free);
    const geo = await ev(() => { const t = document.querySelector('#app .ap-gd.today').getBoundingClientRect(); const bar = [...document.querySelectorAll('#app .ap-bar')].find(x => /Lechner/.test(x.textContent)).getBoundingClientRect(); const prev = [...document.querySelectorAll('#app .ap-bar')].find(x => /Berger/.test(x.textContent)).getBoundingClientRect(); return {mid:t.left + t.width / 2, l:bar.left, pr:prev.right}; });
    L.ok(Math.abs(geo.l - geo.mid) < 6 && Math.abs(geo.pr - geo.mid) < 6, 'Wechseltag in der Zeitleiste: Abreise endet am Vormittag, Anreise beginnt am Nachmittag (Tagesmitte)', geo);
    await L.shot(p, 'uebersicht-desktop-hell', {out:L.SHOTS});
    // blättern
    await p.click('#app [data-act="apWeek"][data-id="1"]'); await p.waitForTimeout(150);
    L.ok(await ev(() => document.querySelector('#app .ap-wkl b').textContent === 'KW 47' && !!document.querySelector('#app [data-act="apWeek"][data-id="0"]') && !document.querySelector('#app .ap-gd.today') && [...document.querySelectorAll('#app .ap-bar b')].some(x => x.textContent === 'Frau Mair')), 'nächste Woche: KW 47 mit „Frau Mair“, Knopf „Diese Woche“, kein Heute');
    await p.click('#app [data-act="apWeek"][data-id="0"]'); await p.waitForTimeout(150);
    await p.click('#app [data-act="apWeek"][data-id="-1"]'); await p.waitForTimeout(150);
    L.ok(await ev(() => document.querySelector('#app .ap-wkl b').textContent === 'KW 45' && document.querySelector('#app .ap-wkl small').textContent === '2.–8. November 2026'), 'Woche davor: KW 45');
    await p.click('#app [data-act="apWeek"][data-id="0"]'); await p.waitForTimeout(150);
    // Tipp auf eine Zeile von heute öffnet die Buchung
    await p.click('#app .ap-r .ap-ev >> text=Herr Lechner'); await p.waitForTimeout(200);
    L.ok(await ev(() => document.querySelector('#dlgForm [name="guest"]').value === 'Herr Lechner'), 'Tipp auf „Anreise Herr Lechner“ öffnet die Buchung'); await L.dlgClose(p);
    // ---------- Heute ----------
    await L.go(p, 'heute');
    const dash = await ev(() => { const r = [...document.querySelectorAll('#app .ap-dash')]; const sec = r[0] && r[0].closest('.day-sec'); return {n:r.length, txt:r[0] ? r[0].innerText.replace(/\s+/g, ' ').trim() : '', sec:sec ? sec.querySelector('.dh-l').textContent : '', cards:document.querySelectorAll('#app .day-sec').length}; });
    // fix-3: die Zeile steht unter „Heute zu tun“ und ist selbst der Knopf
    L.ok(dash.n === 1 && dash.txt === 'Apartments 1 Anreise, 1 Abreise, 1 Reinigung offen, Wechseltag bis 15:00 Uhr' && dash.sec === 'Heute zu tun', 'Heute: genau eine ruhige Zeile unter „Heute zu tun“, kein eigener Abschnitt', dash);
    await p.click('#app .ap-dash .dh-b'); await p.waitForTimeout(250);
    L.ok(await ev(() => view.tab === 'apart' && view.ap.tab === 'reinigung' && location.hash === '#apartments/reinigung'), '„Öffnen“ führt zur Reinigung');
    await ev(() => { const a = apS(); a.bookings = a.bookings.filter(x => x.from !== todayStr() && x.to !== todayStr()); Object.keys(a.cleans).forEach(k => { if(k.endsWith(todayStr())) delete a.cleans[k]; }); save(); go('dash'); });
    L.ok(await ev(() => !document.querySelector('#app .ap-dash')), 'nichts an- oder abzureisen, keine Reinigung offen: keine Zeile');
    // Adressen
    await p.evaluate(() => { location.hash = '#apartments/verwalten'; }); await p.reload(); await L.ready(p);
    L.ok(await ev(() => view.tab === 'apart' && view.ap.tab === 'verwalten' && !!document.querySelector('#app [data-act="apAptNew"]')), 'Adresse #apartments/verwalten öffnet den Reiter direkt');
    await p.click('#app [data-act="apTab"][data-id="reinigung"]'); await p.waitForTimeout(150);
    L.ok(await ev(() => location.hash === '#apartments/reinigung'), 'Reiter ändert die Adresse');
    L.ok(await ev(() => palData().some(x => x.g === 'Bereich' && x.n === 'Apartments') && palData().some(x => x.g === 'Aktion' && x.n === 'Buchung eintragen')), 'Schnellsuche kennt den Bereich „Apartments“');
    L.ok(p.errs.length === 0, 'Desktop: keine Fehler', p.errs); await p.context().close(); }
  // ---------- Handy ----------
  { const {p} = await L.open(b, {...L.PHONE}); const ev = (f, a) => p.evaluate(f, a);
    const bar = await ev(() => [...document.querySelectorAll('.bottom .nav-i')].filter(n => n.getClientRects().length).map(n => n.textContent.trim()));
    L.ok(bar.join('|') === 'Heute|Suchen|Bestellen|Mehr', 'Handy: untere Leiste der Handy-Bedienung (phone.js)', bar);
    await p.click('.bottom .nav-i[data-ph="mehr"]'); await p.waitForTimeout(250);
    const sh = await ev(() => [...document.querySelectorAll('#app > .hy-grp .hy-mr > span:first-of-type')].map(x => x.textContent));
    L.ok(sh.includes('Apartments'), '„Mehr“ enthält „Apartments“', sh);
    await p.click('#app [data-act="apGo"]'); await p.waitForTimeout(300);
    L.ok(await ev(() => view.tab === 'apart' && document.querySelector('.bottom .nav-i.on').dataset.ph === 'mehr'), 'Tipp: Apartments offen, „Mehr“ markiert');
    const ph = await ev(() => ({grid:getComputedStyle(document.querySelector('#app .ap-grid')).display, days:[...document.querySelectorAll('#app .ap-days > li')].map(li => li.querySelector('.ap-dh').innerText.replace(/\s+/g, ' ').trim()),
      today:[...document.querySelectorAll('#app .ap-days > li.today .ap-dl')].map(x => x.innerText.replace(/\s+/g, ' ').trim()), wide:document.documentElement.scrollWidth - innerWidth}));
    L.ok(ph.grid === 'none' && ph.days.length === 7 && ph.days[3] === 'Heute 12.11. 2 von 3 belegt' && ph.wide <= 0, 'Handy: Woche als Liste der Tage, heute markiert, nichts breiter als der Bildschirm', ph);
    L.ok(ph.today.join(' | ') === 'Abreise Apartment Bergblick Familie Berger · 4 Personen | Anreise Apartment Bergblick Herr Lechner · 2 Personen · Ankunft spät, ca. 21 Uhr', 'Handy, heute: Abreise und Anreise je eine Zeile', ph.today);
    L.ok(await ev(() => [...document.querySelectorAll('#app .ap-ev, #app .ap-dl, #app .ap-wk .icon-btn')].filter(x => x.offsetParent).every(x => x.getBoundingClientRect().height >= 40)), 'Handy: Zeilen und Pfeile mindestens 40 px hoch');
    await L.shot(p, 'uebersicht-handy-hell', {out:L.SHOTS});
    L.ok(p.errs.length === 0, 'Handy: keine Fehler', p.errs); await p.context().close(); }
  await L.done(b, []); })();
