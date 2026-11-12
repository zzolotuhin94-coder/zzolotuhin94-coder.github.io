// fix2 · Befund 6 und 7: Dialoge verwerfen Eingaben nicht still; Löschen von Rezeptur, Gericht, Artikel, Lieferant, Aktion mit „Rückgängig“.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.TABLET);
  const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
  const open = () => ev(() => document.querySelector('#dlg').open);
  const edit = async () => { await ev(() => { view.mtab = 'calc'; go('menu'); menuDialog(S.menu.find(m => m.name === 'Elsässer')); }); await w(250); };
  // nichts geändert: Esc schließt sofort
  await edit(); await p.keyboard.press('Escape'); await w(200); L.ok(!(await open()), 'nichts geändert: Esc schließt wie bisher');
  // geändert: Esc fragt
  await edit(); await p.fill('#dlgForm [name=name]', 'Elsässer NEU mit Speck'); await p.keyboard.press('Escape'); await w(200);
  L.ok(await open() && await ev(() => !!document.querySelector('#dlgForm .dlg-discard') && document.querySelector('#dlgForm .dlg-actions').hidden && document.activeElement.dataset.dd === 'keep'), 'geändert + Esc: „Änderungen verwerfen?“ statt still schließen; „Weiter bearbeiten“ hat den Fokus');
  await L.shot(p, 'x04-verwerfen');
  await p.keyboard.press('Escape'); await w(150);
  L.ok(await open() && await ev(() => !document.querySelector('#dlgForm .dlg-discard') && document.querySelector('#dlgForm [name=name]').value === 'Elsässer NEU mit Speck'), 'noch einmal Esc = weiter bearbeiten, die Eingabe ist noch da');
  // × und Klick daneben
  await p.click('#dlgX'); await w(150); L.ok(await open() && await ev(() => !!document.querySelector('#dlgForm .dlg-discard')), '× fragt ebenfalls');
  await p.click('#dlgForm [data-dd="keep"]'); await w(100);
  await p.mouse.click(5, 5); await w(200); L.ok(await open() && await ev(() => !!document.querySelector('#dlgForm .dlg-discard')), 'Klick neben den Dialog fragt ebenfalls');
  await p.click('#dlgForm [data-dd="drop"]'); await w(200);
  L.ok(!(await open()) && await ev(() => S.menu.some(m => m.name === 'Elsässer') && !S.menu.some(m => /NEU/.test(m.name))), '„Verwerfen“: geschlossen, nichts gespeichert');
  // Abbrechen bleibt ein klares Verwerfen
  await edit(); await p.fill('#dlgForm [name=desc]', 'x'); await p.click('#dlgCancel'); await w(150); L.ok(!(await open()), '„Abbrechen“ schließt ohne Rückfrage (ausdrücklich gewählt)');
  // Speichern wie bisher
  await edit(); await p.fill('#dlgForm [name=price]', '14,50'); await L.dlgOk(p); L.ok(!(await open()) && await ev(() => S.menu.find(m => m.name === 'Elsässer').price === 14.5), 'Speichern geht wie bisher');
  // ---------- 7 · Löschen mit Rückgängig ----------
  const undo = async () => { const t = await L.toast(p); await p.click('#toast .toast-act'); await w(250); return t; };
  // Rezeptur mit Gericht, Foto
  const cid = await ev(() => { const c = S.cards.find(c => c.name === 'Kaiserschmarrn mit Apfelmus und Heidelbeerkompott'); imgPut('img_fx2', 'data:image/png;base64,iVBORw0KGgo='); c.img = 'img_fx2'; save(); return c.id; });
  const before = await ev(id => JSON.stringify({c:C(id), m:S.menu.filter(m => m.card === id).map(m => m.id)}), cid);
  await ev(id => { view.cv = 'kalk'; go('cards', id); }, cid); await w(250); await p.click('#app [data-act="delCard"]'); await w(200); await L.dlgOk(p); await w(250);
  L.ok(await ev(id => !C(id) && !S.menu.some(m => m.card === id) && !IMG.img_fx2, cid) && /^Rezeptur „Kaiserschmarrn.*“ gelöscht\s*Rückgängig$/.test(await undo()), 'Rezeptur gelöscht: Hinweis mit „Rückgängig“');
  L.ok(await ev(([id, bf]) => JSON.stringify({c:C(id), m:S.menu.filter(m => m.card === id).map(m => m.id)}) === bf && !!IMG.img_fx2, [cid, before]), 'Rückgängig: Rezeptur, Verknüpfung zum Gericht und Foto sind wieder da');
  // Gericht
  await edit(); await p.click('#dlgDel'); await w(200); await L.dlgOk(p); await w(250);
  L.ok(await ev(() => !S.menu.some(m => m.name === 'Elsässer')) && /„Elsässer“ gelöscht/.test(await undo()) && await ev(() => S.menu.some(m => m.name === 'Elsässer')), 'Gericht: löschen und zurückholen');
  // Artikel (unbenutzt)
  const pid = await ev(() => { const p = JSON.parse(JSON.stringify(S.products[0])); p.id = 'p_fx2'; p.name = 'Testartikel'; S.products.push(p); save(); prodDialog(p); return p.id; }); await w(250);
  await p.click('#dlgDel'); await w(200); await L.dlgOk(p); await w(250);
  L.ok(await ev(id => !P(id), pid) && /Artikel .* gelöscht/.test(await undo()) && await ev(id => !!P(id), pid), 'Artikel: löschen und zurückholen');
  // Lieferant (ohne Artikel)
  const sid = await ev(() => { const s = {...JSON.parse(JSON.stringify(S.suppliers[0])), id:'sup_fx2', name:'Testlieferant'}; S.suppliers.push(s); save(); return s.id; });
  await ev(id => supplierDialog(SUP(id)), sid).catch(() => {}); await w(250);
  if(await open()){ await p.click('#dlgDel'); await w(200); await L.dlgOk(p); await w(250);
    L.ok(await ev(id => !SUP(id), sid) && /Lieferant „Testlieferant“ gelöscht/.test(await undo()) && await ev(id => !!SUP(id), sid), 'Lieferant: löschen und zurückholen'); }
  else L.ok(false, 'Lieferanten-Dialog nicht gefunden');
  // Aktion
  const spid = await ev(() => S.specials[0] && S.specials[0].id);
  if(spid){ await ev(id => specialDialog(S.specials.find(s => s.id === id)), spid); await w(250); await p.click('#dlgDel'); await w(200); await L.dlgOk(p); await w(250);
    L.ok(await ev(id => !S.specials.some(s => s.id === id), spid) && /Aktion .* gelöscht/.test(await undo()) && await ev(id => S.specials.some(s => s.id === id), spid), 'Aktion: löschen und zurückholen'); }
  await L.done(b, p.errs); })();
