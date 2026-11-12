// Befund 7: Verkäufe buchen vormittags für gestern, alle Gerichte der Karte zum Zählen, „Kassenbericht importieren“ auf Heute.
const L = require('./lib');
(async () => { const b = await L.launch(); const run = async (at) => L.open(b, {...L.DESK, at});
  // 09:00: gestern vorbelegt
  let {p} = await run([2026, 11, 12, 9, 0]); const ev = (q, f, a) => q.evaluate(f, a);
  await ev(p, () => go('dash')); await p.waitForTimeout(250);
  // fix3: das neue Heute hat keine Knopfreihe im Kopf mehr; jede Zeile ist selbst der Knopf. Beide Zeilen stehen direkt nacheinander in „Heute zu tun“, beide gleich ruhig (grau).
  const hd = await ev(p, () => [...document.querySelectorAll('#app .dh-now .dh-r')].filter(r => r.querySelector('[data-act="sales"],[data-act="plKasse"]')).map(r => { const x = r.querySelector('.dh-b'); return x.dataset.act + ':' + r.querySelector('.rw-main b').textContent.trim() + ':' + (r.classList.contains('past') && !x.classList.contains('primary')); }));
  const adj = await ev(p, () => { const a = document.querySelector('#app .dh-now [data-act="sales"]'); return !!a && a.closest('li').nextElementSibling === document.querySelector('#app .dh-now [data-act="plKasse"]').closest('li'); });
  L.ok(hd.join('|') === 'sales:Verkäufe buchen:true|plKasse:Kassenbericht importieren:true' && adj, 'Heute: „Kassenbericht importieren“ neben „Verkäufe buchen“, beide gleich ruhig', hd);
  await p.click('#app [data-act="plKasse"]'); await p.waitForTimeout(250);
  L.ok(await ev(p, () => view.tab === 'report' && view.rp.tab === 'import'), '… öffnet den Kassen-Import');
  await ev(p, () => salesDlg()); await p.waitForTimeout(200);
  const d = await ev(p, () => ({date:document.querySelector('#dlgForm [name=date]').value, n:document.querySelectorAll('#dlg .sales li').length, menu:S.menu.filter(m => !m.hidden).length, noCard:[...document.querySelectorAll('#dlg .sales li')].filter(l => /ohne Rezeptur, nur gezählt/.test(l.textContent)).length}));
  L.ok(d.date === '2026-11-11', 'vor 12 Uhr: Datum gestern (11.11.)', d.date);
  L.ok(d.n >= d.menu && d.noCard > 0, 'alle Gerichte der Karte zum Zählen, auch ohne Rezeptur („nur gezählt“)', d);
  await L.shot(p, 'x06-verkaeufe-0900', {full:false});
  // ein Gericht ohne Rezeptur buchen: zählt für die Prognose, bucht nichts ab
  const m = await ev(p, () => { const m = S.menu.find(x => !x.hidden && !(x.card && C(x.card))); window.__mv = S.moves.length; return m.id; });
  await p.click('#dlgForm label.tog:has(input[value=keep])'); await p.fill(`#dlgForm [name="s_${m}"]`, '4'); await L.dlgOk(p);
  const r = await ev(p, id => ({row:(S.salesDays['2026-11-11'] || []).find(x => x[0] === id), mv:S.moves.length - window.__mv, real:!!S.salesReal['2026-11-11']}), m);
  L.ok(r.row && r.row[1] === 4 && r.mv === 0 && r.real, 'Gericht ohne Rezeptur: 4 Portionen am 11.11. gespeichert, nichts vom Lager abgebucht', r);
  // 14:00: heute
  ({p} = await run([2026, 11, 12, 14, 0])); await ev(p, () => salesDlg()); await p.waitForTimeout(200);
  L.ok(await ev(p, () => document.querySelector('#dlgForm [name=date]').value) === '2026-11-12', 'ab 12 Uhr: Datum heute');
  // Handy: Kopf ohne waagrechte Scrollleiste
  const ph = await L.open(b, {...L.PHONE}); await ph.p.evaluate(() => go('dash')); await ph.p.waitForTimeout(250);
  L.ok(await L.noHScroll(ph.p), 'Handy 390: Heute ohne waagrechte Scrollleiste');
  await L.shot(ph.p, 'x06-heute-handy', {full:false});
  await L.done(b, [...p.errs, ...ph.p.errs]);
})();
