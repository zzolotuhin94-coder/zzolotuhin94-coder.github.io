// Suchen und Scannen: ein Feld für Artikel, Rezepte, Speisekarte. Artikel → Zähl-Blatt. Scannen: eine Stelle (phScan), mit und ohne Scanner.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.IP13);
  await L.tap(p, '#app .hy-find');
  L.ok(await L.key(p) === 'such' && await p.evaluate(() => location.hash === '#suchen' && document.activeElement.id === 'phQ'), '„Suchen“ auf Heute öffnet die Suche, das Feld hat den Fokus');
  L.ok(await p.evaluate(() => document.querySelector('.bottom .nav-i.on').textContent.trim() === 'Suchen'), 'unten ist „Suchen“ markiert');
  await p.fill('#phQ', 'but'); await p.waitForTimeout(150);
  const r = await p.evaluate(() => ({secs:[...document.querySelectorAll('#phRes .hy-sec')].map(x => x.firstChild.textContent), art:[...document.querySelectorAll('#phRes [data-act="phArt"]')].map(x => x.innerText.replace(/\s+/g, ' ').trim()), focus:document.activeElement.id}));
  L.ok(r.secs.join().startsWith('Artikel,Rezepte') && r.art.length === 2 && /Butter .*Kühlhaus.* 6 kg/.test(r.art[0]), '„but“ findet Artikel (mit Lagerort und Bestand) und Rezepte', r);
  L.ok(r.focus === 'phQ', 'beim Tippen bleibt der Fokus im Feld');
  await p.fill('#phQ', 'suppe'); await p.waitForTimeout(150);
  L.ok((await p.evaluate(() => [...document.querySelectorAll('#phRes .hy-sec')].map(x => x.firstChild.textContent))).includes('Speisekarte'), '„suppe“ findet auch Gerichte der Speisekarte');
  await p.evaluate(() => document.querySelector('#phRes [data-act="phDish"]').click()); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => !document.getElementById('phSheet').hidden && /Allergene/.test(document.getElementById('phSheetB').textContent) && /Preis laut Karte/.test(document.getElementById('phSheetB').textContent)), 'ein Gericht öffnet ein Blatt mit Preis und Allergenen');
  L.ok((await L.contrast(p, '#phSheet')).length === 0 && (await L.small(p, '#phSheet')).length === 0, 'Blatt: Kontrast und Größe der Ziele stimmen', (await L.contrast(p, '#phSheet')).concat(await L.small(p, '#phSheet')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  L.ok(await p.evaluate(() => document.getElementById('phSheet').hidden && !document.body.classList.contains('hy-lock')), 'Esc schließt das Blatt');
  await p.fill('#phQ', 'zzzz'); await p.waitForTimeout(120);
  L.ok(/Nichts gefunden für „zzzz“/.test(await L.txt(p, '#phRes')), 'kein Treffer: klare Zeile statt leerer Seite');
  // Artikel zählen
  await p.fill('#phQ', 'butter'); await p.waitForTimeout(120); await L.tap(p, '#phRes [data-act="phArt"]');
  const sh = await p.evaluate(() => ({t:document.getElementById('phSheetT').textContent, v:document.getElementById('phCntV').value, was:document.querySelector('#phSheet .hy-was').textContent, modal:document.querySelector('#phSheet .hy-box').getAttribute('aria-modal'), lock:document.body.classList.contains('hy-lock')}));
  L.ok(sh.t === 'Butter' && sh.v === '6' && /Laut App sind 6 kg da/.test(sh.was) && sh.modal === 'true' && sh.lock, 'Artikel öffnet das Zähl-Blatt: Name, Menge laut App, große Zahl', sh);
  await L.tap(p, '#phSheet [data-act="phCntStep"][data-id="-1"]'); await L.tap(p, '#phSheet [data-act="phCntStep"][data-id="-1"]');
  L.ok(await p.evaluate(() => document.getElementById('phCntV').value) === '5', 'Minus zählt in halben Kilo herunter', await p.evaluate(() => document.getElementById('phCntV').value));
  await p.fill('#phCntV', '4,5'); await L.tap(p, '#phSheet [data-act="phCntSave"]');
  const s2 = await p.evaluate(() => { const x = S.products.find(q => q.name === 'Butter'); return {stock:x.stock, mv:S.moves[0].type + ' ' + S.moves[0].qty + ' ' + S.moves[0].note, hidden:document.getElementById('phSheet').hidden, toast:document.getElementById('toast').textContent, row:document.querySelector('#phRes [data-act="phArt"]').innerText.replace(/\s+/g, ' ')}; });
  L.ok(s2.stock === 4.5 && s2.mv === 'inv -1.5 Gezählt am Handy' && s2.hidden, '„Zählung speichern“ setzt den Bestand und bucht die Differenz als Inventur-Buchung', s2);
  L.ok(/4,5 kg gespeichert \(vorher 6 kg\)/.test(s2.toast) && /4,5 kg/.test(s2.row), 'Rückmeldung nennt neu und vorher, die Trefferzeile zeigt den neuen Bestand', s2);
  await p.click('#toast .toast-act'); await p.waitForTimeout(200);
  L.ok(await p.evaluate(() => S.products.find(q => q.name === 'Butter').stock === 6 && !S.moves.some(m => m.note === 'Gezählt am Handy')), '„Rückgängig“ nimmt die Zählung zurück');
  await L.tap(p, '#phRes [data-act="phArt"]'); await p.fill('#phCntV', 'abc'); await L.tap(p, '#phSheet [data-act="phCntSave"]');
  L.ok(await p.evaluate(() => !document.getElementById('phSheet').hidden && document.getElementById('phCntV').classList.contains('bad-in') && S.products.find(q => q.name === 'Butter').stock === 6), 'Unsinn im Feld wird nicht gespeichert, das Blatt bleibt offen');
  await L.tap(p, '#phSheet .hy-x');
  // Getränk: volle Flaschen und Zehntel
  await p.fill('#phQ', 'Zweigelt 0,75'); await p.waitForTimeout(120); await L.tap(p, '#phRes [data-act="phArt"]');
  L.ok(await p.evaluate(() => document.querySelectorAll('#phSheet .hy-tenths button').length === 9 && /Flaschen/.test(document.querySelector('#phSheet .hy-count label span').textContent)), 'Getränke: volle Flaschen und die angebrochene in Zehnteln');
  await p.fill('#phCntV', '10'); await L.tap(p, '#phSheet [data-act="phCntT"][data-id="5"]'); await L.tap(p, '#phSheet [data-act="phCntSave"]');
  L.ok(await p.evaluate(() => Math.abs(S.products.find(q => /^Zweigelt/.test(q.name)).stock - 10.5 * 0.75) < 1e-6), '10 Flaschen und 0,5 offen ergeben 7,875 l', await p.evaluate(() => S.products.find(q => /^Zweigelt/.test(q.name)).stock));
  // Strichcode-Nummer
  await p.evaluate(() => { S.products.find(q => q.name === 'Butter').ean = '9012345678908'; save(); });
  await p.fill('#phQ', '9012345678908'); await p.waitForTimeout(120);
  L.ok(await p.evaluate(() => document.querySelectorAll('#phRes .hy-row').length === 1 && /Butter/.test(document.querySelector('#phRes .hy-row').textContent)), 'eine Strichcode-Nummer findet genau ihren Artikel');
  await p.focus('#phQ'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => !document.getElementById('phSheet').hidden && document.getElementById('phSheetT').textContent === 'Butter'), 'Enter bei genau einem Treffer öffnet das Zähl-Blatt'); await L.tap(p, '#phSheet .hy-x');
  await p.fill('#phQ', '4000000000001'); await p.waitForTimeout(120);
  L.ok(/noch keinem Artikel zugeordnet/.test(await L.txt(p, '#phRes')), 'unbekannte Nummer: Hinweis, dass sie noch keinem Artikel gehört');
  // Scannen ohne Scanner
  await L.tap(p, '.bottom [data-ph="heute"]'); await L.tap(p, '#app .hy-scan'); await p.waitForTimeout(150);
  L.ok(await L.key(p) === 'such' && await p.evaluate(() => document.activeElement.id === 'phQ' && document.getElementById('phQ').getAttribute('inputmode') === 'numeric' && /Strichcode/.test(document.getElementById('toast').textContent)), 'ohne Scanner führt „Scannen“ in die Suche: Nummer eintippen oder Artikel suchen');
  // Scannen mit Scanner (scan.js stellt openScanner bereit)
  await p.evaluate(() => { window.__sc = 0; window.openScanner = () => { window.__sc++; }; });
  await L.tap(p, '.bottom [data-ph="heute"]'); await L.tap(p, '#app .hy-scan');
  L.ok(await p.evaluate(() => window.__sc === 1 && document.getElementById('app').dataset.ph === 'heute'), 'gibt es openScanner, ruft „Scannen“ genau das auf (phScan)');
  await L.tap(p, '.bottom [data-ph="such"]'); await L.tap(p, '#app .hy-scan');
  L.ok(await p.evaluate(() => window.__sc === 2), 'auch der Knopf in der Suche ruft den Scanner');
  await p.goBack(); await p.waitForTimeout(250);
  L.ok(await L.key(p) === 'heute', 'Zurück-Taste des Handys: von der Suche zurück auf Heute');
  const ns = await L.noSide(p, 390); L.ok(ns.sw <= 390 && !ns.over.length, 'nichts ragt seitlich hinaus', ns);
  await L.done(b, p.errs); })();
