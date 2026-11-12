// Bestellen: Liste nach Annahmeschluss, eine Bestellung als Blatt, am Ende der Knopf des Lieferanten und die Frage „Gesendet?“.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.IP13);
  await L.tap(p, '.bottom [data-ph="best"]');
  const g = await p.evaluate(() => ({k:document.getElementById('app').dataset.ph, h:location.hash, rows:[...document.querySelectorAll('#app [data-act="phOrd"]')].map(x => x.querySelector('.hy-n').textContent.trim() + ' ' + x.querySelector('.hy-tm b').textContent), exp:[...document.querySelectorAll('#app [data-act="ordRecv"]')].map(x => x.querySelector('.hy-n').textContent.trim() + ' ' + x.querySelector('.hy-tm b').textContent), voice:document.querySelector('#app .hy-voice').textContent, tables:document.querySelectorAll('#app table').length, tabs:!!document.querySelector('#app .toolbar.tabs')}));
  L.ok(g.k === 'best' && g.h === '#ware/bestellen', 'unten „Bestellen“ öffnet die Liste', g);
  L.ok(JSON.stringify(g.rows) === JSON.stringify(['bis12:00 Getränke Wildalm', 'bis15:00 Bäckerei Kornstube', 'bis18:00 Gastro-Großmarkt Inntal']), 'Lieferanten von heute, nach Annahmeschluss sortiert', g.rows);
  L.ok(g.exp.length === 2 && /^kommtheute Talmolkerei/.test(g.exp[0]) && /^kommtmorgen Metzgerei/.test(g.exp[1]), '„Unterwegs“: was bestellt ist und wann es kommt', g.exp);
  L.ok(g.tables === 0 && !g.tabs && /noch 3 Lieferanten/.test(g.voice), 'keine Tabelle, keine Reiter, ein Satz sagt, was heute ansteht', g.voice);
  const before = await p.evaluate(() => ({n:S.orders.length, no:S.settings.orderNo}));
  await L.tap(p, '#app [data-act="phOrd"]');
  const sh = await p.evaluate(() => ({open:!document.getElementById('phSheet').hidden, t:document.getElementById('phSheetT').textContent, lines:[...document.querySelectorAll('#phSheet .hy-li')].map(x => x.querySelector('.hy-tm b').textContent + ' ' + x.querySelector('.hy-step b').textContent), sum:document.querySelector('#phSheet .hy-sum b').textContent, min:document.querySelector('#phSheet .hy-min').textContent, main:document.querySelector('#phSheet a.hy-btn, #phSheet button.hy-btn:not(.t):not(.q)').textContent, k:document.getElementById('app').dataset.ph}));
  L.ok(sh.open && sh.t === 'Getränke Wildalm' && sh.lines.length === 3 && sh.k === 'best', 'ein Tipp auf den Lieferanten öffnet die Bestellung als Blatt, die Liste bleibt dahinter', sh);
  L.ok(/304,56/.test(sh.sum) && /Mindestwert .*300,00 erreicht/.test(sh.min), 'Summe und Mindestwert stehen im Blatt', sh);
  L.ok(sh.main === 'Webshop öffnen', 'der Hauptknopf ist der Weg dieses Lieferanten: Webshop', sh.main);
  L.ok((await L.small(p, '#phSheet')).length === 0 && (await L.contrast(p, '#phSheet')).length === 0, 'Blatt: Ziele ≥ 44 px, Kontrast ≥ 4,5:1', (await L.small(p, '#phSheet')).concat(await L.contrast(p, '#phSheet')));
  const fit = await p.evaluate(() => { const bx = document.querySelector('#phSheet .hy-box').getBoundingClientRect(); return {top:Math.round(bx.top), bottom:Math.round(bx.bottom), w:Math.round(bx.width)}; });
  L.ok(fit.top >= 40 && fit.bottom === 844 && fit.w === 390, 'das Blatt sitzt unten und lässt oben die Seite sehen', fit);
  // nur hineingeschaut: kein Entwurf bleibt liegen
  await L.tap(p, '#phSheet .hy-x');
  const after = await p.evaluate(() => ({n:S.orders.length, no:S.settings.orderNo}));
  L.ok(after.n === before.n && after.no === before.no, 'nur hineingeschaut und geschlossen: kein Entwurf, keine verbrauchte Bestellnummer', {before, after});
  // Menge ändern
  await L.tap(p, '#app [data-act="phOrd"]');
  await L.tap(p, '#phSheet [data-act="phOl"][data-id="0:1"]');
  const ch = await p.evaluate(() => ({n:document.querySelector('#phSheet .hy-li .hy-step b').textContent, sum:document.querySelector('#phSheet .hy-sum b').textContent, focus:document.activeElement.dataset.id}));
  L.ok(ch.n === '4' && !/304,56/.test(ch.sum) && ch.focus === '0:1', 'Plus erhöht die Menge, die Summe rechnet mit, der Fokus bleibt am Knopf', ch);
  await L.tap(p, '#phSheet [data-act="phOl"][data-id="0:-1"]');
  await p.selectOption('#phOlAdd', {index:1}); await p.waitForTimeout(200);
  L.ok(await p.evaluate(() => document.querySelectorAll('#phSheet .hy-li').length === 4), '„Artikel dazu“ ergänzt eine Zeile');
  await L.tap(p, '#phSheet .hy-x');
  const kept = await p.evaluate(() => { const d = S.orders.find(o => o.status === 'draft' && SUP(o.supplier).name === 'Getränke Wildalm'); return {draft:!!d, lines:d ? d.lines.length : 0, row:document.querySelector('#app [data-act="phOrd"] .hy-tm small').textContent}; });
  L.ok(kept.draft && kept.lines === 4 && /^Entwurf, 4 Artikel/.test(kept.row), 'geändert und geschlossen: der Entwurf bleibt, die Zeile sagt es', kept);
  // senden
  await L.tap(p, '#app [data-act="phOrd"]');
  await p.evaluate(() => { const a = document.querySelector('#phSheet a.hy-btn'); a.removeAttribute('target'); a.setAttribute('href', '#ware/bestellen'); a.click(); }); await p.waitForTimeout(600);
  const ask = await p.evaluate(() => ({q:(document.querySelector('#phSheet .hy-ask') || {}).textContent, yes:(document.querySelector('#phSheet [data-act="ordMarkSent"]') || {}).textContent, no:!!document.querySelector('#phSheet [data-act="phOrdNot"]')}));
  L.ok(/Im Webshop geöffnet\. Ist die Bestellung draußen\?/.test(ask.q) && ask.yes === 'Ja, gesendet' && ask.no, 'nach dem Webshop fragt das Blatt: Gesendet?', ask);
  await L.shot(p, 'p03-gesendet');
  await L.tap(p, '#phSheet [data-act="phOrdNot"]');
  L.ok(await p.evaluate(() => !!document.querySelector('#phSheet a.hy-btn') && !document.querySelector('#phSheet .hy-ask')), '„Noch nicht“ zeigt wieder den Knopf des Lieferanten');
  await p.evaluate(() => { const a = document.querySelector('#phSheet a.hy-btn'); a.removeAttribute('target'); a.setAttribute('href', '#ware/bestellen'); a.click(); }); await p.waitForTimeout(600);
  await L.tap(p, '#phSheet [data-act="ordMarkSent"]');
  const sent = await p.evaluate(() => { const o = S.orders.find(x => SUP(x.supplier).name === 'Getränke Wildalm' && (x.sentAt || '').slice(0, 10) === '2026-11-12'); const row = [...document.querySelectorAll('#app [data-act="phOrd"]')].find(x => /Wildalm/.test(x.textContent)); return {st:o && o.status, via:o && o.sentVia, hidden:document.getElementById('phSheet').hidden, row:row.querySelector('.hy-tm small').textContent, off:row.classList.contains('off'), last:[...document.querySelectorAll('#app [data-act="phOrd"]')].pop() === row, exp:document.querySelectorAll('#app [data-act="ordRecv"]').length}; });
  L.ok(sent.st === 'sent' && sent.via === 'Webshop' && sent.hidden, '„Ja, gesendet“: Bestellung ist gesendet (über Webshop), das Blatt geht zu', sent);
  L.ok(sent.row === 'Heute bestellt' && sent.off && sent.last && sent.exp === 3, 'die Zeile wird grau und rückt nach unten, die Bestellung steht unter „Unterwegs“', sent);
  await L.tap(p, '.bottom [data-ph="heute"]');
  L.ok((await L.txt(p, '#phBoard li:first-child')).includes('15:00') && (await L.txt(p, '#phBoard li:first-child')).includes('Bäckerei Kornstube'), 'Heute zeigt jetzt die nächste Frist: Bäckerei bis 15:00', await L.txt(p, '#phBoard li:first-child'));
  // Wareneingang aus „Unterwegs“
  await L.tap(p, '.bottom [data-ph="best"]'); await L.tap(p, '#app [data-act="ordRecv"]');
  const we = await p.evaluate(() => ({k:document.getElementById('app').dataset.ph, back:document.querySelector('#app .back').textContent, sw:document.documentElement.scrollWidth, on:document.querySelector('.bottom .nav-i.on').textContent.trim()}));
  L.ok(we.k === 'x' && /Alle Bestellungen/.test(we.back) && we.sw <= 390 && we.on === 'Bestellen', 'eine Lieferung unter „Unterwegs“ öffnet den Wareneingang, unten bleibt „Bestellen“ markiert', we);
  await L.tap(p, '#app .back');
  L.ok(await L.key(p) === 'best', '„Alle Bestellungen“ führt am Handy zurück zur Liste');
  // anderer Lieferant, alle Bestellungen
  await L.tap(p, '#app [data-act="phOrdOther"]');
  L.ok(await p.evaluate(() => !document.getElementById('phSheet').hidden && document.querySelectorAll('#phSheet [data-act="phOrd"]').length >= 1), '„Bei anderem Lieferanten bestellen“ zeigt die übrigen Lieferanten im Blatt');
  await L.tap(p, '#phSheet [data-act="phOrd"]');
  L.ok(await p.evaluate(() => !document.getElementById('phSheet').hidden && !!document.querySelector('#phSheet .hy-sum')), 'ein Tipp öffnet dort die Bestellung im selben Blatt'); await L.tap(p, '#phSheet .hy-x');
  await L.tap(p, '#app [data-act="phBuyAll"]');
  L.ok(await p.evaluate(() => !!document.querySelector('#app .olist') && /Bestellen/.test(document.querySelector('#app .hy-back').textContent)), '„Alle Bestellungen“ zeigt die volle Liste, mit Zurück zu „Bestellen“');
  await L.tap(p, '#app .hy-back'); L.ok(await L.key(p) === 'best', 'und zurück');
  // Team darf vorbereiten, nicht senden
  await p.evaluate(() => { const u = S.settings.users.find(x => roleNorm(x.role) !== 'chef'); S.settings.currentUser = u.id; save(); render(); });
  await p.evaluate(() => [...document.querySelectorAll('#app [data-act="phOrd"]')].find(x => /Großmarkt/.test(x.textContent)).click()); await p.waitForTimeout(260);
  L.ok(await p.evaluate(() => !document.querySelector('#phSheet a.hy-btn') && !document.querySelector('#phSheet [data-act="ordMarkSent"]') && /Senden kann sie der Chef/.test(document.getElementById('phSheetB').textContent)), 'Team: vorbereiten ja, senden nur der Chef');
  await L.tap(p, '#phSheet .hy-x');
  const ns = await L.noSide(p, 390); L.ok(ns.sw <= 390 && !ns.over.length, 'nichts ragt seitlich hinaus', ns);
  await L.done(b, p.errs); })();
