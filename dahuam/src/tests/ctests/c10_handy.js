// Handy 390 px: keine neue Seite und kein neuer Dialog ist breiter als der Bildschirm.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.PHONE);
  const chk = async (name, extra) => { const w = await p.evaluate(() => { const d = document.querySelector('#dlg'); const dw = d.open ? Math.round(d.getBoundingClientRect().right) : 0; const over = [...document.querySelectorAll('#app *, #dlgForm *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > 391 && !e.closest('.tbl-wrap,.lt-wrap,.seg,.chips-row,.gs-sheet,.ab-sheet,.ab-prev,.rp-out,.shelf') ; }).slice(0, 3).map(e => e.tagName + '.' + e.className); return {sw:document.documentElement.scrollWidth, dw, over}; }); L.ok(w.sw === 390 && w.dw <= 390 && w.over.length === 0, `390 px: ${name}`, w.sw === 390 && w.dw <= 390 && !w.over.length ? undefined : w); if(extra) await extra(); };
  await L.go(p, 'einstellungen/eigene-daten'); await chk('Eigene Daten (Übersicht)');
  L.ok(await p.evaluate(() => [...document.querySelectorAll('#app .ed-row .btn')].every(x => x.getBoundingClientRect().height >= 40)), 'Knöpfe der Schritte sind mit dem Finger gut zu treffen (≥ 40 px)');
  await p.click('#app [data-act="leerAsk"]'); await p.waitForTimeout(250); await chk('Dialog „Leer starten?“'); await p.click('#dlgCancel'); await p.waitForTimeout(200);
  await p.click('#app [data-act="leerKeep"]'); await p.waitForTimeout(250); await chk('Rückfrage „Beispiele behalten“'); await p.click('#dlgCancel'); await p.waitForTimeout(200);
  for(const [t, f] of [['menu', 'speisekarte.csv'], ['prod', 'artikel.csv'], ['rec', 'rezepturen.csv'], ['team', 'team.csv']]){
    await L.openImp(p, t); await chk(`Import ${t}: Eingabe`);
    await p.evaluate(() => { view.more = {...view.more, impcols:true}; render(); }); await chk(`Import ${t}: Liste der Spaltennamen`);
    await L.upload(p, L.sample(f)); await chk(`Import ${t}: Vorschau`);
    await p.evaluate(() => { view.daten.more = {map:true}; view.daten.all = true; render(); }); await p.waitForTimeout(150); await chk(`Import ${t}: Spalten zuordnen, alle Zeilen`);
    if(t === 'rec'){ await p.evaluate(() => { document.querySelectorAll('#impList details').forEach(d => { d.open = true; }); }); await chk('Import rec: alle Rezepturen aufgeklappt'); }
    if(t === 'menu'){ await p.click('#app [data-act="impMode"][data-id="replace"]'); await p.waitForTimeout(200); await chk('Import menu: „Ersetzen“'); await p.click('#app [data-act="impMode"][data-id="add"]'); await p.waitForTimeout(200); }
    await p.click('#app [data-act="impFilter"][data-id="fehler"]'); await p.waitForTimeout(200); await chk(`Import ${t}: Filter „Fehler“`);
    const bar = await p.evaluate(() => { const r = document.querySelector('#app .imp-bar').getBoundingClientRect(); const nav = document.querySelector('.bottom').getBoundingClientRect(); return {bottom:Math.round(r.bottom), navTop:Math.round(nav.top), btn:document.querySelector('#app [data-act="impApply"]').getBoundingClientRect().height}; });
    L.ok(bar.bottom <= bar.navTop + 1 && bar.btn >= 40, `Import ${t}: die Leiste mit „Übernehmen“ steht über der Navigation, nicht darunter`, bar);
    await L.apply(p); await chk(`Import ${t}: Ergebnis`);
  }
  await L.go(p, 'einstellungen/eigene-daten'); await chk('Eigene Daten mit Liste der Importe');
  // Rezeptseite: Rezeptur einfügen
  await p.evaluate(() => { const m = S.menu.find(x => x.name === 'Kinderschnitzel'); newCard('dish', m); }); await p.waitForTimeout(350); await chk('Rezeptseite (leer) mit Hinweis „Rezeptur einfügen“');
  await p.evaluate(() => recPasteDialog(view.card)); await p.waitForTimeout(250); await p.fill('#rpTxt', '120 g Schweinsschnitzel\n2 EL Butterschmalz\n1 Prise Salz\n150 g Pommes frites mit sehr langem Namen zum Umbrechen\nZitrone'); await p.waitForTimeout(250); await chk('Dialog „Rezeptur einfügen“ mit Vorschau'); await p.click('#dlgCancel'); await p.waitForTimeout(200);
  // Allergene
  await L.go(p, 'ware/preise'); await p.evaluate(() => { view.pf = 'noalg'; render(); }); await p.waitForTimeout(200); await chk('Preise: Filter „Allergene offen“');
  L.ok(await p.evaluate(() => { const b = document.querySelector('#app .alg-st'); const r = b && b.getBoundingClientRect(); return !!b && r.width > 0 && r.height >= 40 && r.left >= 0 && r.right <= 390; }), 'der Allergen-Knopf ist am Handy sichtbar und groß genug');
  await p.evaluate(() => algDialog(noAlgProducts()[0] || S.products[0])); await p.waitForTimeout(250); await p.click('#dlgForm input[name="algState"][value="has"] + span'); await p.waitForTimeout(150); await chk('Dialog Allergene (drei Zustände, Buchstaben offen)'); await p.click('#dlgCancel'); await p.waitForTimeout(200);
  await p.evaluate(() => prodDialog(S.products[0])); await p.waitForTimeout(250); await chk('Dialog Artikel'); await p.click('#dlgCancel'); await p.waitForTimeout(200);
  await p.evaluate(() => menuDialog(S.menu[0])); await p.waitForTimeout(250); await p.evaluate(() => { document.querySelector('#dlgForm .alg-det').open = true; }); await chk('Dialog Gericht (Steuersatz, Allergene von Hand)'); await p.click('#dlgCancel'); await p.waitForTimeout(200);
  await p.evaluate(() => secDialog()); await p.waitForTimeout(250); await chk('Dialog Kategorien mit Steuersatz'); await p.click('#dlgCancel'); await p.waitForTimeout(200);
  await p.evaluate(() => pcStart()); await p.waitForTimeout(350); await chk('Preis-Check mit Allergen-Zeile'); await p.evaluate(() => pcLeave());
  await L.go(p, 'speisekarte/gaestekarte'); await p.waitForTimeout(700); await chk('Gästekarte mit Hinweis und „Allergen-Blatt“');
  await p.evaluate(() => abDialog()); await p.waitForTimeout(400); await chk('Dialog Allergen-Blatt');
  L.ok(await p.evaluate(() => { const sh = document.querySelector('#dlgForm .ab-sheet'); const pg = sh.querySelector('.ab-page').getBoundingClientRect(); const r = sh.getBoundingClientRect(); return pg.width <= r.width + 1 && pg.width > 200; }), 'Vorschau des Blatts ist auf die Breite verkleinert'); await p.click('#dlgCancel'); await p.waitForTimeout(200);
  await p.evaluate(() => { gsState().cur = 'schlicht'; save(); render(); }); await p.waitForTimeout(600); await chk('Gästekarte, Vorlage „Schlicht“ mit ° und Legende');
  await L.go(p, 'einstellungen'); await chk('Einstellungen (zwei Steuersätze, Eigene Daten)');
  await L.go(p, 'einrichtung'); await chk('Einrichtung mit den Verweisen „aus Datei importieren“');
  await L.go(p, 'team/auswertung'); await chk('Auswertung (Monatsübersicht je Steuersatz)');
  await L.done(b, p.errs); })();
