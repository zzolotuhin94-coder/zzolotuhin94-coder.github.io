// fix2 · Befund 5: „keine Allergene“ mit Plausibilitäts-Rückfrage; Allergen-Blatt: alle 14 Spalten, offene Zeilen deutlich.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.TABLET);
  const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
  L.ok(await ev(() => [algGuess('Weizenmehl').map(x => x.a).join(), algGuess('Eierschwammerl-Ragout').length, algGuess('Schweinsbraten').length, algGuess('Kalbsoberschale').length, algGuess('Erdnusssauce').map(x => x.a).join(), algGuess('Garnelenpfandl').map(x => x.a).join(), algGuess('Rotwein').map(x => x.a).join(), algGuess('Spiegelei mit Speck').map(x => x.a).join()].join('|')) === 'A|0|0|0|E|B|O|C',
    'Wortliste: Weizenmehl → A, Eierschwammerl/Schweinsbraten/Kalbsoberschale kein Treffer, Erdnuss → E (nicht H), Garnelen → B, Rotwein → O, Spiegelei → C');
  const id = await ev(() => S.menu.find(m => m.name === 'Gärtnerin').id);
  await ev(id => { view.mtab = 'calc'; go('menu'); menuDialog(S.menu.find(m => m.id === id)); }, id); await w(250);
  await ev(() => { document.querySelector('#dlgForm .alg-det').open = true; }); await p.check('#dlgForm [name=algState][value=none]', {force:true}); await L.dlgOk(p);
  const q = await ev(() => ({open:document.querySelector('#dlg').open, err:(document.querySelector('#dlgForm .f-err') || {}).textContent || ''}));
  L.ok(q.open && /^Sicher\? „Flammkuchen“ enthält meist A \(Gluten\), „Mozzarella“ enthält meist G/.test(q.err) && await ev(id => !S.menu.find(m => m.id === id).algNone, id), 'Gärtnerin „keine Allergene“: einmal nachfragen (Flammkuchen → A, Mozzarella → G), noch nicht gespeichert', q.err);
  await L.shot(p, 'x03-rueckfrage');
  await L.dlgOk(p); await w(200);
  L.ok(await ev(id => !document.querySelector('#dlg').open && S.menu.find(m => m.id === id).algNone === true, id), 'noch einmal speichern: übernommen (die App entscheidet nicht)');
  // schon „keine“: keine neue Rückfrage beim Bearbeiten
  await ev(id => menuDialog(S.menu.find(m => m.id === id)), id); await w(200); await L.dlgOk(p); await w(200);
  L.ok(await ev(() => !document.querySelector('#dlg').open), 'war schon „keine Allergene“: speichern ohne Rückfrage');
  // Artikel ohne typisches Wort: keine Rückfrage; Artikel mit: Rückfrage
  const art = await ev(() => { const a = S.products.find(p => p.name === 'Kristallzucker'), m = S.products.find(p => /mehl/i.test(p.name)); const o = {a:a.id, m:m.id, malg:m.alg, mnone:m.algNone}; a.alg = ''; a.algNone = false; m.alg = ''; m.algNone = false; save(); return o; });
  await ev(id => algDialog(P(id)), art.a); await w(200); await p.check('#dlgForm [name=algState][value=none]', {force:true}); await L.dlgOk(p); await w(200);
  L.ok(await ev(id => !document.querySelector('#dlg').open && P(id).algNone === true, art.a), 'Kristallzucker „keine“: ohne Rückfrage');
  await ev(id => algDialog(P(id)), art.m); await w(200); await p.check('#dlgForm [name=algState][value=none]', {force:true}); await L.dlgOk(p); await w(200);
  L.ok(await ev(id => document.querySelector('#dlg').open && /Sicher\?.*A \(Gluten\)/.test(document.querySelector('#dlgForm .f-err').textContent) && !P(id).algNone, art.m), 'Mehl „keine“: Rückfrage'); await p.click('#dlgCancel');
  await ev(o => { const m = P(o.m); m.alg = o.malg; m.algNone = o.mnone; save(); }, art);   // Mehl wieder wie im Beispiel (fürs Blatt)
  // Allergen-Blatt
  const ab = await ev(() => { const r = abPages(); const h = document.createElement('div'); h.style.cssText = 'position:absolute;left:0;top:0;width:794px'; document.body.appendChild(h); h.innerHTML = r.pages.join('');
    const rows = [...h.querySelectorAll('.ab-t tbody tr:not(.ab-sec)')]; const row = n => rows.find(x => x.querySelector('.ab-n').textContent.replace(/\s*°$/, '') === n);
    const g = row('Garnelenpfandl'), e = row('Elsässer'), k = row('Gärtnerin');
    const o = {cols:r.cols.join(''), head:[...h.querySelectorAll('.ab-page:first-child thead .ab-c')].map(x => x.textContent).join(''), gOpen:g.classList.contains('ab-open'), gCells:[...g.querySelectorAll('.ab-c')].map(x => x.textContent).join(''), gS:g.querySelector('.ab-s').textContent, gBg:getComputedStyle(g.querySelector('td')).backgroundColor,
      eCells:[...e.querySelectorAll('.ab-c')].map(x => x.textContent).join(''), kS:k.querySelector('.ab-s').textContent, leg:h.querySelector('.ab-f p').textContent, over:[...h.querySelectorAll('.ab-s')].filter(x => x.scrollWidth > x.clientWidth + 1).length}; h.remove(); return o; });
  L.ok(ab.cols === 'ABCDEFGHLMNOPR' && ab.head === ab.cols, 'Allergen-Blatt: immer alle 14 Spalten (auch B Krebstiere, D Fisch …)', ab.head);
  L.ok(ab.gOpen && ab.gCells === '??????????????' && /^nachfragen · /.test(ab.gS) && ab.gBg !== 'rgba(0, 0, 0, 0)' && ab.eCells.replace(/[●]/g, '') === '', 'ohne Angabe (Garnelenpfandl): grau, „?“ in jeder Spalte, „nachfragen“; vollständige Zeilen bleiben leer statt „?“', ab);
  L.ok(/^keine Allergene · /.test(ab.kS) && /\? nicht geprüft/.test(ab.leg) && ab.over === 0, 'geprüft allergenfrei: „keine Allergene“; Legende erklärt „?“; Stand-Spalte läuft nicht über', [ab.kS, ab.over]);
  await L.done(b, p.errs); })();
