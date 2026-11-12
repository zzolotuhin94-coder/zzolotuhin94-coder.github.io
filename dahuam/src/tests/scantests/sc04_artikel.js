// Artikel-Dialog: Feld „EAN / Barcode“ (mehrere Codes, Prüfziffer-Warnung, doppelte Codes abgelehnt, entfernen nur Chef,
// Code per Scanner ins Feld); Import Artikel mit Spalte EAN / GTIN / Barcode / Strichcode / EAN-Code; Vorlage mit Spalte EAN.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
  // ---------- Dialog ----------
  await L.go(p, 'ware/preise'); await ev(() => prodDialog(P('butter'))); await p.waitForTimeout(250);
  const d0 = await ev(() => ({f:!!document.querySelector('#pdEan'), v:document.querySelector('#pdEan').value, h:document.querySelector('#pdEanH').textContent, scan:!!document.querySelector('#pdEanScan'), lbl:document.querySelector('.sc-ean-f label').textContent}));
  L.ok(d0.f && d0.v === '' && d0.scan && d0.lbl === 'EAN / Barcode' && /mit Komma trennen/.test(d0.h), 'Dialog „Artikel bearbeiten“: Feld „EAN / Barcode“ mit Knopf zum Scannen und Hinweis', d0);
  await p.fill('#pdEan', '9001234560019, 19007654321015'); L.ok(/EAN-13 · GTIN-14 · Prüfziffer stimmt/.test(await L.txt(p, '#pdEanH')), 'zwei Codes erkannt: EAN-13 und GTIN-14, Prüfziffer stimmt', await L.txt(p, '#pdEanH'));
  await p.fill('#pdEan', '9001234560019, 9001234560018'); L.ok(await ev(() => document.querySelector('#pdEanH').classList.contains('warn') && /Prüfziffer passt nicht: 9001234560018/.test(document.querySelector('#pdEanH').textContent)), 'falsche Prüfziffer: Warnung im Feld');
  await L.dlgOk(p);
  L.ok(await ev(() => !document.querySelector('#dlg').open && P('butter').ean.join() === '9001234560019,9001234560018'), 'trotzdem gespeichert (nur Warnung)');
  // doppelter Code bei einem anderen Artikel
  await ev(() => prodDialog(P('milk'))); await p.waitForTimeout(200); await p.fill('#pdEan', '9001234560019'); await L.dlgOk(p);
  L.ok(await ev(() => document.querySelector('#dlg').open && /gehört schon zu „Butter“/.test(document.querySelector('#dlgForm .f-err').textContent) && P('milk').ean.length === 0), 'Code eines anderen Artikels: Fehlermeldung, nichts gespeichert');
  await p.click('#dlgCancel');
  // neuer Artikel mit Code
  await ev(() => prodDialog()); await p.waitForTimeout(200); await L.dlgFill(p, {name:'Testsalz', price:'0,8', ean:'9001234560033'}); await L.dlgOk(p);
  L.ok(await ev(() => { const x = S.products.find(q => q.name === 'Testsalz'); return x && x.ean.join() === '9001234560033'; }), 'neuer Artikel mit Code angelegt');
  // Code per Scanner ins Feld: ohne Kamera (Browser ohne Kamera) über „Code eintippen“
  await ev(() => prodDialog(P('milk'))); await p.waitForTimeout(200); await p.fill('#dlgForm [name=artNo]', 'MILCH-1');
  await p.click('#pdEanScan'); await L.wait(p, () => __scan.open && __scan.cam && __scan.cam !== 'on' && !document.querySelector('#scOff').hidden);
  L.ok(await ev(() => !document.querySelector('#dlg').open && __scan.mode === 'pick' && /Code scannen/.test(document.querySelector('#scTitle').textContent)), 'Scanner geht über dem Dialog auf (Dialog kurz ausgeblendet)');
  await p.fill('#scMan2', '4 012345 678901'); await p.click('#scOff [data-sc="manGo2"]'); await p.waitForTimeout(250);
  const d1 = await ev(() => ({open:document.querySelector('#dlg').open, v:document.querySelector('#pdEan').value, art:document.querySelector('#dlgForm [name=artNo]').value, sc:__scan.open}));
  L.ok(d1.open && !d1.sc && d1.v === '4012345678901' && d1.art === 'MILCH-1', 'zurück im Dialog: Code steht im Feld, andere Eingaben sind erhalten', d1);
  await L.dlgOk(p); L.ok(await ev(() => P('milk').ean.join() === '4012345678901' && P('milk').artNo === 'MILCH-1'), 'gespeichert');
  // entfernen: Chef leert das Feld
  await ev(() => prodDialog(P('butter'))); await p.waitForTimeout(200); await p.fill('#pdEan', '9001234560019'); await L.dlgOk(p);
  L.ok(await ev(() => P('butter').ean.join() === '9001234560019'), 'Chef entfernt einen Code im Dialog');
  // Team: Dialog gesperrt; über scanEanRead würde Entfernen abgelehnt
  await L.team(p); await ev(() => prodDialog(P('butter'))); await p.waitForTimeout(200);
  L.ok(await ev(() => !document.querySelector('#dlg').open && /nur der Chef/.test(document.querySelector('#toast').textContent)), 'Team: Artikel-Dialog bleibt beim Chef (wie bisher)');
  L.ok(await ev(() => { const fd = new FormData(); fd.set('ean', ''); document.querySelector('#dlgForm').innerHTML = '<input name="ean">'; return scanEanRead(fd, P('butter')) === false; }), 'Team: Codes entfernen wird abgelehnt');
  await L.chef(p);
  // ---------- Import ----------
  const imp = async txt => { await L.openImp(p, 'prod'); await p.fill('#impPaste', txt); await p.click('#app [data-act="impCheck"]'); await p.waitForTimeout(350); return ev(() => view.daten.res.items.map(i => ({n:i.n, t:i.title, st:i.st, why:i.why || '', notes:i.notes, ean:i.data && i.data.ean, sub:i.sub || '', ex:i.ex && i.ex.id}))); };
  for(const h of ['EAN', 'GTIN', 'Barcode', 'Strichcode', 'EAN-Code', 'EAN / GTIN']){
    const map = await ev(h => impHeader([['Artikel', 'Preis', h]], IMP_PROD_FIELDS).map.ean, h); L.ok(map === 2, `Spalte „${h}“ wird als Code erkannt`);
  }
  const r = await imp('Artikel;Einheit;Preis netto;EAN-Code\nButter;kg;8,50;9001234560019, 9001234560026\nTestmehl;kg;1,10;9001234560040 9001234560057\nFalschcode;kg;1;9001234560018\nDoppelt;kg;1;9001234560040\nAusExcel;kg;1;9,00123E+12\nOhneCode;kg;2;');
  const by = t => r.find(x => x.t === t);
  L.ok(by('Butter').st === 'akt' && /neuer Code/.test(by('Butter').why) && by('Butter').ean.join() === '9001234560019,9001234560026' && /EAN 9001234560019, 9001234560026/.test(by('Butter').sub), 'Butter: vorhandener Artikel bekommt einen neuen Code dazu; die Vorschau zeigt die Codes', by('Butter'));
  L.ok(by('Testmehl').st === 'neu' && by('Testmehl').ean.join() === '9001234560040,9001234560057', 'zwei Codes mit Leerzeichen getrennt', by('Testmehl').ean);
  L.ok(by('Falschcode').notes.some(n => /Prüfziffer passt nicht: 9001234560018 \(trotzdem übernommen/.test(n)) && by('Falschcode').ean.length === 1, 'falsche Prüfziffer: Hinweis, trotzdem übernommen');
  L.ok(by('Doppelt').notes.some(n => /9001234560040 steht schon in Zeile 3/.test(n)) && !by('Doppelt').ean, 'gleicher Code zweimal in der Datei: nur beim ersten');
  L.ok(by('AusExcel').notes.some(n => /hat Excel gekürzt/.test(n)) && !by('AusExcel').ean, '„9,00123E+12“: von Excel gekürzt, Hinweis, nicht übernommen');
  L.ok(!by('OhneCode').ean && by('OhneCode').st === 'neu', 'leere Zelle: kein Code');
  await L.apply(p);
  const ap = await ev(() => ({butter:P('butter').ean.join(), mehl:(S.products.find(x => x.name === 'Testmehl') || {}).ean, ohne:(S.products.find(x => x.name === 'OhneCode') || {}).ean, milk:P('milk').ean.join(), salz:(S.products.find(x => x.name === 'Testsalz') || {}).ean}));
  L.ok(ap.butter === '9001234560019,9001234560026' && ap.mehl.join() === '9001234560040,9001234560057' && Array.isArray(ap.ohne) && ap.ohne.length === 0 && ap.milk === '4012345678901' && ap.salz.join() === '9001234560033', 'übernommen: Codes ergänzt, neue Artikel mit Codes, ohne Code eine leere Liste; nichts entfernt', ap);
  L.ok(await ev(() => eanFind('9001234560057').name === 'Testmehl'), 'gleich danach per Code auffindbar');
  const r2 = await imp('Artikel;Artikelnummer;Preis;GTIN\nTeebutter;;9;9001234560026\nSchwein neu;MB-107;9,5;4012345678901');
  L.ok(r2[0].ex === 'butter' && r2[0].st !== 'neu', 'anderer Name, gleicher Code: als Butter erkannt (sicherer Treffer)', r2[0]);
  L.ok(r2[1].ex === 'pork' && r2[1].notes.some(n => /4012345678901 gehört schon zu „Vollmilch/.test(n)) && !r2[1].ean, 'Code eines anderen Artikels (Zeile passt über die Artikelnummer zum Schweinerücken): nicht übernommen, mit Hinweis', r2[1]);
  await p.click('#app [data-act="impBack"]'); await p.waitForTimeout(150);
  // ---------- Vorlage ----------
  const tpl = await ev(() => ({head:IMP_TPL.prod.sheets[0][1][0], rows:IMP_TPL.prod.sheets[0][1].slice(1).map(r => r[r.length - 1]).filter(Boolean)}));
  L.ok(tpl.head[tpl.head.length - 1] === 'EAN' && tpl.rows.length >= 4, 'Vorlage Artikel: letzte Spalte „EAN“ mit Beispielen', tpl.rows);
  L.ok(await ev(rows => rows.every(x => eanSplit(x).every(c => gtinInfo(c).ok)), tpl.rows), 'alle Beispiel-Codes der Vorlage haben eine gültige Prüfziffer');
  await L.openImp(p, 'prod'); L.ok(/Für den Scanner: EAN/.test(await L.txt(p, '#app')), 'Import-Seite nennt die Spalte EAN');
  L.ok(p.errs.length === 0, 'keine Fehler', p.errs);
  await L.done(b, p.errs);
})();
