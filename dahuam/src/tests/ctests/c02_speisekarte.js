// Import Speisekarte durch die Oberfläche: Datei (UTF-8, Windows-1252, Excel, Komma, Tabulator), Spalten zuordnen, Vorschau, übernehmen, rückgängig, Fehlerliste, ergänzen/ersetzen, Zwischenablage, Vorlagen.
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch(); const {p, c} = await L.open(b, {vp:{width:1440, height:900}, ctx:{permissions:['clipboard-read', 'clipboard-write']}});
  // ---------- Rechenkern des Imports ----------
  const nums = await p.evaluate(() => ['12,90', '12.90', '€ 12,90', '12,-', '1.234,50', '1,234.50', '1.250', '0.5', '½', '3/4', 'Tagespreis', '', '12,90 EUR', '7'].map(impNum));
  L.ok(JSON.stringify(nums) === JSON.stringify([12.9, 12.9, 12.9, 12, 1234.5, 1234.5, 1250, 0.5, 0.5, 0.75, null, null, 12.9, 7]), 'Zahlen: 12,90 · 12.90 · € 12,90 · 12,- · 1.234,50 · 1,234.50 · 1.250 · ½ · 3/4; Text ist keine Zahl', nums);
  const alg = await p.evaluate(() => ['A C G', 'a,c,g', 'ACG', 'Gluten, Ei, Milch', 'keine', '-', '', 'A X', 'Senf/Sellerie'].map(x => { const r = impAlg(x); return r.state + ':' + r.alg + (r.bad ? '!' + r.bad.join() : ''); }));
  L.ok(alg.join('|') === 'has:A C G|has:A C G|has:A C G|has:A C G|none:|none:|open:|open:!X|has:L M', 'Allergene: Buchstaben, Namen, „keine“; leer = nicht gepflegt; unbekannter Buchstabe wird nicht übernommen', alg);
  const misc = await p.evaluate(() => ({s:[impSeasons('Herbst, Winter').v.join(), impSeasons('ganzjährig').v.join(), impSeasons('Sommer/Frühling').v.join()], d:[impDays('So').v.join(), impDays('Mo-Fr').v.join(), impDays('Di, Do und Sa').v.join(), impDays('täglich').v.join()], v:[impVeg('vegan').v, impVeg('Vegetarisch').v, impVeg('nein').v, impVeg('x').v], k:['Preis (€)', 'VK-Preis', 'Größe', 'Stückgewicht in g', 'Putzverlust %'].map(impKey)}));
  L.ok(misc.s.join('|') === 'winter,herbst||fruehling,sommer' && misc.d.join('|') === '0|1,2,3,4,5|2,4,6|' && misc.v.join('|') === 'vg|v||v' && misc.k.join('|') === 'preis|vkpreis|groesse|stueckgewichtg|putzverlust', 'Saison, Wochentage, vegetarisch/vegan und Überschriften werden tolerant gelesen', misc);

  // ---------- Datei UTF-8 mit Strichpunkt: Vorschau ----------
  await L.openImp(p, 'menu');
  L.ok(await p.evaluate(() => document.querySelectorAll('#app .btn.primary').length === 1 && /Datei wählen/.test(document.querySelector('#app .btn.primary').textContent) && !!document.querySelector('#impPaste') && document.querySelectorAll('#app [data-act="impTpl"]').length === 2), 'Eingabe: ein Hauptknopf „Datei wählen“, Feld zum Einfügen, Vorlagen als CSV und Excel');
  await L.upload(p, L.sample('speisekarte.csv'));
  let cn = await L.counts(p); let pv = await L.preview(p);
  L.ok(await p.evaluate(() => view.daten.stage === 'prev' && /speisekarte\.csv · 35 Zeilen · Trennzeichen Strichpunkt · UTF-8/.test(document.querySelector('#app .fact').textContent) && /Noch ist nichts geändert/.test(document.querySelector('#app .sub').textContent)), 'Vorschau nennt Datei, Zeilen, Trennzeichen und Zeichensatz', await p.evaluate(() => document.querySelector('#app .fact').textContent));
  const demoDup = pv.filter(x => x.st === 'akt' || x.st === 'gleich').map(x => x.title + ':' + x.st + ':' + x.why);
  L.ok(cn.fehler === 4 && cn.neu + cn.akt + cn.gleich === 31, '31 gültige Zeilen, 4 mit Fehler', cn);
  const errs = pv.filter(x => x.st === 'fehler').map(x => x.n + ':' + x.why);
  L.ok(errs.join('|') === '32:Preis nicht lesbar: „Tagespreis“|33:Name des Gerichts fehlt|34:doppelt in der Datei (wie Zeile 2)|35:Preis fehlt', 'Fehler je Zeile mit Grund; die übrigen Zeilen laufen weiter', errs);
  L.ok(pv.find(x => x.n === 36).st !== 'fehler' && /Allergen „X“ unbekannt: Angabe nicht übernommen/.test(pv.find(x => x.n === 36).notes.join()), 'unbekannter Allergen-Buchstabe: Hinweis, Zeile wird übernommen, Angabe bleibt offen');
  L.ok(demoDup.length >= 1 && demoDup.some(x => /Wiener Schnitzel · vom Schwein:akt:Preis € 20,90 → € 18,90/.test(x.replace(/ /g, ' '))), 'Gericht mit gleichem Namen und gleicher Variante gilt als „aktualisiert“, die Änderung steht dabei', demoDup);
  const rowTxt = await p.evaluate(() => { const li = document.querySelector('#impList .imp-r[data-n="12"]'); return li.innerText.replace(/\s+/g, ' '); });
  L.ok(/neu Zeile 12 Tafelspitz Hauptspeisen · Apfelkren, Schnittlauchsauce; Rösterdäpfel nur sonntags € 24,00 Datei: „24,00“/.test(rowTxt), 'Zeile der Vorschau: Zustand, Zeile, Name, Text mit Strichpunkt, gelesener Preis UND Rohwert der Zelle', rowTxt);
  L.ok(await p.evaluate(() => { const li = document.querySelector('#impList .imp-r[data-n="32"]'); return /Fehler/.test(li.querySelector('.imp-st').textContent) && /„Tagespreis“/.test(li.querySelector('.imp-raw').textContent) && !li.querySelector('.imp-x b') && getComputedStyle(li.querySelector('.imp-why')).color === getComputedStyle(li.querySelector('.imp-st')).color; }), 'Fehlerzeile: kein gelesener Preis, der Rohwert steht da, Grund in der Warnfarbe');
  L.ok(/Kategorie „Getränke“: wird mit 20 % MwSt\. \(Getränke\) angelegt/.test(await p.evaluate(() => document.querySelector('#app .imp-gnote').textContent)), 'Vorschau kündigt an: Kategorie „Getränke“ mit 20 %');
  // Filter
  await p.click('#app [data-act="impFilter"][data-id="fehler"]'); await p.waitForTimeout(200);
  L.ok(await p.evaluate(() => document.querySelectorAll('#impList .imp-r').length === 4 && [...document.querySelectorAll('#impList .imp-r')].every(x => x.classList.contains('st-fehler'))), 'Filter „Fehler“ zeigt die vier Zeilen');
  await p.click('#app [data-act="impFilter"][data-id="all"]'); await p.waitForTimeout(200);
  // Fehlerliste
  const el = await L.dl(p, () => p.click('#app [data-act="impErrDl"]'));
  const et = fs.readFileSync(el.file, 'utf8');
  L.ok(/^Fehlerliste-Speisekarte-\d{4}-\d\d-\d\d\.csv$/.test(el.name) && et.charCodeAt(0) === 0xFEFF && /Zeile;Status;Grund;Kategorie;Gericht/.test(et) && /32;Fehler;Preis nicht lesbar: „Tagespreis“;Hauptspeisen;Tagesfisch/.test(et) && /36;Hinweis;Allergen „X“ unbekannt/.test(et) && et.trim().split(/\r\n/).length === 6, 'Fehlerliste als CSV: Zeile, Status, Grund und die Originalzeile (4 Fehler, 1 Hinweis)', el.name);
  // ---------- übernehmen (ergänzen) ----------
  const m0 = await p.evaluate(() => ({n:S.menu.length, secs:S.settings.sections.length, imp:(S.imports || []).length}));
  L.ok(await p.evaluate(() => /Gerichte übernehmen/.test(document.querySelector('#app [data-act="impApply"]').textContent) && document.querySelectorAll('#app .btn.primary').length === 1), 'ein Hauptknopf: „… Gerichte übernehmen“');
  await L.apply(p);
  const a1 = await p.evaluate(() => ({stage:view.daten.stage, out:view.daten.out, n:S.menu.length, secs:S.settings.sections.slice(-6), sv:S.settings.secVat, imp:S.imports[0], safety:(STORE.st.safety || {}).why, toast:document.querySelector('#toast').textContent, h1:document.querySelector('#app h1').textContent}));
  L.ok(a1.stage === 'done' && a1.out.neu === cn.neu && a1.out.akt === cn.akt && a1.out.fehler === 4 && a1.n === m0.n + cn.neu, 'übernommen: neue Gerichte dazu, gleiche aktualisiert, Fehlerzeilen nicht', a1.out);
  L.ok(a1.secs.join('|') === 'Suppen|Vorspeisen|Hauptspeisen|Desserts|Kinder|Getränke' && a1.sv['Getränke'] === 'g', 'neue Kategorien in der Reihenfolge der Datei; „Getränke“ ist Getränke-Kategorie', a1.secs);
  L.ok(a1.imp.type === 'menu' && a1.imp.file === 'speisekarte.csv' && a1.imp.counts.neu === cn.neu && a1.imp.by === 'Chef' && /vor Import: Speisekarte \(speisekarte\.csv\)/.test(a1.safety), 'S.imports hat den Eintrag (Art, Datum, Zähler, Datei); Sicherheitskopie „vor Import“', a1.imp);
  L.ok(/Speisekarte übernommen/.test(a1.toast) && /Import fertig/.test(a1.h1) && await p.evaluate(() => !!document.querySelector('#app [data-act="datenUndo"]') && /Fehlerliste speichern · 5/.test(document.querySelector('#app [data-act="impErrDl"]').textContent)), 'Ergebnis-Seite mit Zusammenfassung, „Rückgängig“ und Fehlerliste', a1.toast);
  const chk = await p.evaluate(() => { const f = n => S.menu.find(m => m.name === n); const ks = f('Käsespätzle'), ku = f('Kürbiscremesuppe'), ts = f('Tafelspitz'), gc = f('Gemüsecurry'), gt = f('Grillteller'), bt = S.menu.filter(m => m.name === 'Beef Tatar'), ws = S.menu.filter(m => m.name === 'Wiener Schnitzel');
    return {ku:[ku.section, ku.price, ku.seasons.join(), ku.desc], ks:[ks.section, ks.desc, ks.price, ks.veg, ks.seasons.join(), ks.alg, ks.algAt === todayStr(), ks.algBy], ts:[ts.days.join(), ts.alg, ts.algNone, ts.desc], gc:[gc.veg, gc.alg, gc.algNone, algInfo(gc).state], gt:[gt.alg, gt.algNone, algInfo(gt).state], bt:bt.map(m => [m.vlabel, m.group, m.price]), ws:ws.map(m => [m.vlabel, m.price, m.top, m.card ? 1 : 0]), ks2:f('Käsespätzle').top}; });
  L.ok(JSON.stringify(chk.ks) === JSON.stringify(['Hauptspeisen', 'Röstzwiebel, grüner Salat', 15.9, 'v', '', 'A C G', true, 'Chef (Import)']) && JSON.stringify(chk.ku) === JSON.stringify(['Suppen', 7.2, 'winter,herbst', 'Kernöl; geröstete Kerne']), 'Käsespätzle (neu): Kategorie, Text, Preis, vegetarisch, Allergene A C G mit Prüfvermerk; Kürbiscremesuppe (vorhanden): Preis 7,20, neue Kategorie, Saison, Text mit Strichpunkt', [chk.ks, chk.ku]);
  L.ok(chk.ts.join('|') === '0||false|Apfelkren, Schnittlauchsauce; Rösterdäpfel' && chk.gc.join('|') === 'vg||true|none' && chk.gt.join('|') === '|false|open', 'Tafelspitz nur sonntags, Allergene leer = offen; Gemüsecurry „keine“ = bestätigt; Grillteller mit unbekanntem Buchstaben bleibt offen', chk);
  L.ok(chk.bt.length === 2 && chk.bt[0][1] && chk.bt[0][1] === chk.bt[1][1] && chk.bt.map(x => x[0]).join() === 'klein,groß' && chk.ks2 === true, 'Varianten gehören zusammen (eine Gruppe), „x“ in Empfehlung zählt', chk.bt);
  L.ok(chk.ws.length === 2 && chk.ws.find(x => x[0] === 'vom Schwein')[1] === 18.9 && chk.ws.find(x => x[0] === 'vom Schwein')[3] === 1, 'vorhandenes Gericht: Preis aktualisiert, Rezeptur bleibt verknüpft', chk.ws);
  // ---------- rückgängig ----------
  await p.click('#app [data-act="datenUndo"]'); await p.waitForTimeout(700);
  const u1 = await p.evaluate(() => ({n:S.menu.length, secs:S.settings.sections.length, imp:(S.imports || []).length, ws:S.menu.find(m => m.name === 'Wiener Schnitzel' && m.vlabel === 'vom Schwein').price, stage:view.daten && view.daten.stage, sv:S.settings.secVat['Getränke'], toast:document.querySelector('#toast').textContent}));
  L.ok(u1.n === m0.n && u1.secs === m0.secs && u1.imp === m0.imp && u1.ws === 20.9 && u1.sv === undefined && /Rückgängig gemacht/.test(u1.toast), 'Rückgängig: Karte, Kategorien, Steuerklasse und Importliste wie vorher (eine Änderung)', u1);
  L.ok(u1.stage === 'prev' && (await L.counts(p)).neu === cn.neu, 'man steht wieder in der Vorschau und kann neu entscheiden');
  // noch einmal übernehmen, dann dieselbe Datei wieder: alles „unverändert“
  await L.apply(p); await L.openImp(p, 'menu'); await L.upload(p, L.sample('speisekarte.csv')); let c2 = await L.counts(p);
  L.ok(c2.neu === 0 && c2.akt === 0 && c2.gleich === 31 && c2.fehler === 4 && await p.evaluate(() => document.querySelector('#app [data-act="impApply"]').disabled && /Nichts zu übernehmen/.test(document.querySelector('#app .imp-bar-t').textContent)), 'dieselbe Datei noch einmal: 31 unverändert, nichts zu übernehmen, Knopf gesperrt', c2);

  // ---------- Windows-1252 mit anderen Überschriften ----------
  await L.openImp(p, 'menu'); await L.upload(p, L.sample('speisekarte-win1252.csv'));
  const w = await p.evaluate(() => ({fact:document.querySelector('#app .fact').textContent, map:view.daten.map, c:impCounts(view.daten.res), um:view.daten.res.items.find(i => i.n === 3).title, gr:view.daten.res.items.find(i => i.n === 7).title, err:view.daten.err}));
  L.ok(/Windows-1252/.test(w.fact) && w.um === 'Kürbiscremesuppe' && w.gr === 'Beef Tatar · groß', 'Windows-1252 erkannt, Umlaute und ß stimmen', w.fact);
  L.ok(w.map.section === 0 && w.map.name === 1 && w.map.variant === 2 && w.map.desc === 3 && w.map.price === 4 && w.map.veg === 5 && w.map.seasons === 6 && w.map.alg === 7 && w.map.top === 8 && w.map.days === 9 && w.c.gleich === 30, 'Überschriften Rubrik, Bezeichnung, Größe, Zusatz, VK-Preis (€), Tipp, Tage werden erkannt: 30 unverändert', w.c);
  // ---------- Excel mit Titelzeile ----------
  await L.openImp(p, 'menu'); await L.upload(p, L.sample('speisekarte.xlsx'));
  const x = await p.evaluate(() => ({fact:document.querySelector('#app .fact').textContent, hi:view.daten.hi, c:impCounts(view.daten.res), first:view.daten.res.items[0], raw:document.querySelector('#impList .imp-raw').textContent}));
  L.ok(/Excel/.test(x.fact) && x.hi === 1 && x.c.gleich === 30 && x.c.fehler === 0 && x.first.price === 6.5 && /„6\.5“/.test(x.raw), 'Excel: Titelzeile übersprungen, Preise als Zahlen gelesen (6.5 → 6,50), 30 unverändert', [x.fact, x.c]);
  // ---------- Komma und Tabulator ----------
  await L.openImp(p, 'menu'); await L.upload(p, L.sample('speisekarte-komma.csv'));
  const k = await p.evaluate(() => ({d:view.daten.src.delim, c:impCounts(view.daten.res), pr:view.daten.res.items.map(i => i.price).join()}));
  L.ok(k.d === ',' && k.c.gleich === 8 && k.pr === '6.5,7.2,7.9,6.9,14.5,19.8,11.9,18.9', 'Komma als Trennzeichen, Dezimalkomma in Anführungszeichen: Preise stimmen', k);
  await L.openImp(p, 'menu'); await L.upload(p, L.sample('speisekarte-tab.txt'));
  L.ok(await p.evaluate(() => view.daten.src.delim === '\t' && impCounts(view.daten.res).gleich === 8), 'Tabulator als Trennzeichen');

  // ---------- Spalten von Hand zuordnen ----------
  await L.openImp(p, 'menu'); await L.upload(p, L.sample('speisekarte-remap.csv'));
  const r0 = await p.evaluate(() => ({noHead:view.daten.noHead, open:document.querySelector('#app .imp-map').open, hint:document.querySelector('#app .imp-map').textContent, st:view.daten.res ? impCounts(view.daten.res) : null, err:view.daten.err}));
  L.ok(r0.noHead && r0.open && /keine Überschriften erkannt/.test(r0.hint), 'unbekannte Überschriften: „Spalten zuordnen“ klappt von selbst auf und sagt warum', r0);
  await p.selectOption('#app select[data-impmap="name"]', '0'); await p.waitForTimeout(200); await p.selectOption('#app select[data-impmap="price"]', '1'); await p.waitForTimeout(200); await p.selectOption('#app select[data-impmap="section"]', '2'); await p.waitForTimeout(200); await p.selectOption('#app select[data-impmap="desc"]', '3'); await p.waitForTimeout(250);
  const r1 = await p.evaluate(() => ({map:view.daten.map, c:impCounts(view.daten.res), items:view.daten.res.items.map(i => [i.st, i.title, i.price, i.why || ''].join(':')), open:document.querySelector('#app .imp-map').open}));
  L.ok(r1.map.name === 0 && r1.map.price === 1 && r1.map.section === 2 && r1.map.desc === 3 && r1.map.variant === undefined && r1.open, 'Zuordnung von Hand: jede Spalte nur einmal vergeben, die Auswahl bleibt offen', r1.map);
  L.ok(r1.c.fehler === 1 && /fehler:Was/.test(r1.items[0]) && r1.c.gleich === 4 && r1.items[1] === 'gleich:Frittatensuppe:6.5:', 'danach stimmt die Vorschau; die Überschriftenzeile der Datei steht als Fehler da und wird nicht übernommen', r1.items);
  await p.selectOption('#app select[data-impmap="price"]', '-1'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => !view.daten.res && /Es fehlt die Spalte „Preis“/.test(document.querySelector('#impErr').textContent) && !document.querySelector('#app [data-act="impApply"]')), 'Pflichtspalte abgewählt: klare Meldung, kein Übernehmen möglich');

  // ---------- Zwischenablage und Einfügen ----------
  await L.openImp(p, 'menu');
  await p.evaluate(() => navigator.clipboard.writeText('Gericht\tPreis\tKategorie\nHolzfällersteak\t22,50\tHauptspeisen\nMohnnudeln\t9,80\tDesserts\n'));
  await p.click('#app [data-act="impClip"]'); await p.waitForTimeout(500);
  const cl = await p.evaluate(() => ({stage:view.daten.stage, fact:document.querySelector('#app .fact').textContent, items:view.daten.res.items.map(i => [i.st, i.title, i.price, i.data.section].join(':'))}));
  L.ok(cl.stage === 'prev' && /Eingefügte Tabelle · 2 Zeilen · Trennzeichen Tabulator/.test(cl.fact) && cl.items.join('|') === 'neu:Holzfällersteak:22.5:Hauptspeisen|neu:Mohnnudeln:9.8:Desserts', '„Aus der Zwischenablage“: aus Excel kopierte Tabelle (Tabulatoren) direkt in die Vorschau', cl);
  await p.click('#app [data-act="impBack"]'); await p.waitForTimeout(200);
  // Tabelle aus einer Webseite / aus Word: HTML in der Zwischenablage
  const html = await p.evaluate(() => { const t = document.querySelector('#impPaste'); const dt = new DataTransfer(); dt.setData('text/html', '<table><tr><th>Gericht</th><th>Preis</th></tr><tr><td>Brettljause</td><td>€ 14,90</td></tr><tr><td>Speckbrot</td><td>8,-</td></tr></table>'); dt.setData('text/plain', 'Gericht Preis Brettljause € 14,90 Speckbrot 8,-'); t.focus(); t.dispatchEvent(new ClipboardEvent('paste', {clipboardData:dt, bubbles:true, cancelable:true})); return t.value; });
  await p.click('#app [data-act="impCheck"]'); await p.waitForTimeout(300);
  L.ok(/^Gericht\tPreis\nBrettljause\t€ 14,90\nSpeckbrot\t8,-$/.test(html) && await p.evaluate(() => view.daten.res.items.map(i => i.title + ':' + i.price).join('|') === 'Brettljause:14.9|Speckbrot:8'), 'eingefügte Tabelle aus Webseite/Word (HTML): Zellen bleiben getrennt, „€ 14,90“ und „8,-“ werden gelesen');
  await p.click('#app [data-act="impBack"]'); await p.waitForTimeout(200); await p.fill('#impPaste', ''); await p.click('#app [data-act="impCheck"]'); await p.waitForTimeout(200);
  L.ok(await p.evaluate(() => view.daten.stage === 'in' && /Bitte eine Tabelle einfügen oder eine Datei wählen/.test(document.querySelector('#impErr').textContent)), 'leeres Feld: Hinweis statt leerer Vorschau');

  // ---------- Vorlagen ----------
  const t1 = await L.dl(p, () => p.click('#app [data-act="impTpl"][data-id="csv"]')); const t1t = fs.readFileSync(t1.file, 'utf8');
  L.ok(t1.name === 'Vorlage-Speisekarte.csv' && /^﻿Kategorie;Gericht;Variante;Beschreibung;Preis;vegetarisch\/vegan;Saison;Allergene;Empfehlung;Wochentage\r\n/.test(t1t) && /"Apfelkren, Schnittlauchsauce; Rösterdäpfel"/.test(t1t), 'Vorlage als CSV: Überschriften und Beispielzeilen, Text mit Strichpunkt in Anführungszeichen', t1.name);
  const t2 = await L.dl(p, () => p.click('#app [data-act="impTpl"][data-id="xlsx"]')); const t2b = fs.readFileSync(t2.file);
  L.ok(t2.name === 'Vorlage-Speisekarte.xlsx' && t2b.length > 3000 && t2b.slice(0, 2).toString() === 'PK', 'Vorlage als Excel-Datei (aus der mitgelieferten Bibliothek, ohne Internet)', [t2.name, t2b.length]);
  L.ok(c.ext.length === 0, 'kein Zugriff auf fremde Adressen', c.ext);
  await L.upload(p, t2.file); const tv = await L.counts(p);
  L.ok(tv.fehler === 0 && tv.neu + tv.akt + tv.gleich === 7, 'die Excel-Vorlage lässt sich wieder einlesen: 7 Zeilen ohne Fehler', tv);
  await L.openImp(p, 'menu'); await L.upload(p, t1.file); const tv2 = await L.counts(p); L.ok(tv2.fehler === 0 && tv2.neu + tv2.akt + tv2.gleich === 7, 'die CSV-Vorlage ebenso', tv2);

  // ---------- Ersetzen ----------
  await L.openImp(p, 'menu'); await L.upload(p, L.sample('speisekarte.csv'));
  const nb = await p.evaluate(() => S.menu.length);
  await p.click('#app [data-act="impMode"][data-id="replace"]'); await p.waitForTimeout(250);
  const rp = await p.evaluate(() => ({gone:view.daten.res.gone.length, txt:document.querySelector('#app .imp-opt .hint').textContent, btn:document.querySelector('#app [data-act="impApply"]').textContent, dis:document.querySelector('#app [data-act="impApply"]').disabled}));
  L.ok(rp.gone === nb - 31 && new RegExp(rp.gone + ' Gerichte werden entfernt').test(rp.txt) && /Gleiche Gerichte behalten Rezeptur, Foto und Verkaufszahlen/.test(rp.txt) && rp.btn === 'Karte ersetzen' && !rp.dis, '„Ersetzen“ sagt vorher, wie viele Gerichte entfernt werden und was erhalten bleibt', rp);
  const keepCard = await p.evaluate(() => S.menu.find(m => m.name === 'Wiener Schnitzel' && m.vlabel === 'vom Schwein').card);
  await L.apply(p);
  const ra = await p.evaluate(() => ({n:S.menu.length, secs:S.settings.sections.join('|'), order:menuSorted().slice(0, 5).map(dishLabel).join('|'), out:view.daten.out, card:S.menu.find(m => m.name === 'Wiener Schnitzel' && m.vlabel === 'vom Schwein').card, cards:S.cards.length}));
  L.ok(ra.n === 31 && ra.secs === 'Suppen|Vorspeisen|Hauptspeisen|Desserts|Kinder|Getränke' && ra.out.weg === nb - 31, 'ersetzt: die Karte hat genau die 31 Gerichte der Datei, Kategorien in Dateireihenfolge', ra);
  L.ok(ra.order === 'Frittatensuppe|Kürbiscremesuppe|Gulaschsuppe|Leberknödelsuppe|Beef Tatar · klein' && ra.card === keepCard && ra.cards === 15, 'Reihenfolge wie in der Datei; das gleiche Gericht behält seine Rezeptur; Rezepturen bleiben erhalten', ra.order);
  for(const h of ['speisekarte', 'speisekarte/gaestekarte', 'heute', 'vorbereitung', 'team/auswertung']) await L.go(p, h);
  L.ok(p.errs.length === 0, 'nach dem Ersetzen: Karte, Gästekarte, Heute, Vorbereitung und Auswertung zeichnen ohne Fehler', p.errs.slice(0, 2));
  await L.go(p, 'einstellungen/eigene-daten');
  const log = await p.evaluate(() => ({n:S.imports.length, rows:[...document.querySelectorAll('#app .ed-log .rw')].map(x => x.innerText.replace(/\s+/g, ' ')), state:datenSteps()[1].state}));
  L.ok(log.n === 2 && log.rows.length === 2 && /Speisekarte .*unverändert.*entfernt.*speisekarte\.csv/.test(log.rows[0]) && /31 Gerichte in 6 Kategorien\. Letzter Import .* · speisekarte\.csv\./.test(log.state), 'Seite „Eigene Daten“: Liste der Importe und Stand der Speisekarte mit letztem Import', log);
  await L.done(b, p.errs); })();
