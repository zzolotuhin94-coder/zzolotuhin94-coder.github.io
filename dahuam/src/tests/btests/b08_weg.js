// Entferntes ist wirklich weg: nicht versteckt, sondern nicht mehr in der gebauten Datei. Dazu die Größe vorher und nachher.
const fs = require('fs'); const path = require('path'); const L = require('./lib');
const SITE = process.env.SITE || '/home/user/wt-4/dahuam/';
const html = fs.readFileSync(SITE + 'index.html', 'utf8'); const before = fs.existsSync(path.join(__dirname, '..', 'index.before-b.html')) ? fs.statSync(path.join(__dirname, '..', 'index.before-b.html')).size : null;
const GONE = [
  // Rezept-Labor
  'renderLabor', 'labGen', 'labTake', 'Rezept-Labor', 'data-tab="labor"',
  // Stempel, Aufgaben, Stufen, Belohnungen
  'Stempelkarte', 'renderStempel', 'stampSvg', 'MISSIONS', 'missionGo', 'gdRewards', 'checkRewards', 'rw-sparks', 'gdStampCheck', 'Talstation', 'Mittelstation', 'Bergstation', 'Gipfel', 'Grundstein', 'Vollbetrieb', 'MS_LEVELS', 'gdAct(',
  // Hilfe-Schichten
  'renderBegriffe', 'TOURS', 'guideHere(', 'gdWelcome', 'gdSimpleApply', 'isSimple', 'setMode(', 'guideMode', 'SIMPLE_TXT', 'body.simple', 'Einfach-Modus', 'Alles zeigen',
  // Ansichten, Startanimation
  'vsw(', 'data-act="vsw"', 'Kompakt', 'vcompact', 'vcards', 'id="intro"', 'in-plate', 'ic-ember', 'Startanimation', 'introNow',
  // Gästekarte
  'Buchsatz', 'Wie die Website', 'glayout', 'palPreset', 'fontpair', 'guestStylePick = true',
  // Auswertung
  'matrixSvg', 'Menü-Matrix', 'rp-matrix', 'Halbjahr', 'Quartal',
  // Rollen
  'Zur Freigabe', 'ordApproval', 'ordApprove', 'orderLimit:', 'Freigabe-Limit', 'pünktlich ', 'Pünktlich', 'onTime',
  // Wörter
  'Beispielpreis', 'Demodaten', 'Demo-Verkäufe', 'Aufbau & Reihenfolge', 'renderAufbau', 'renderLayout', 'Lager & Einkauf',
  // Altlasten
  'ordCopy_v1', 'ordBook_v1',
];
(async () => {
  const found = GONE.filter(s => html.includes(s));
  L.ok(found.length === 0, `${GONE.length} Zeichenfolgen entfernter Funktionen kommen in der gebauten Datei nicht mehr vor`, found);
  const size = fs.statSync(SITE + 'index.html').size;
  console.log(`  Größe index.html: vorher ${before} Bytes, nachher ${size} Bytes (${before ? Math.round((1 - size / before) * 100) : '?'} % weniger)`);
  L.ok(before && size < before * 1.2, 'die gebaute Datei bleibt höchstens 20 % über dem Stand vor Paket B (nach Paket B waren es über 10 % weniger; Paket C brachte Import, Allergen-Blatt und zweiten Steuersatz, Paket D1 Bar & Getränke mit rund 35 KB, Paket D2 Küchen- und Service-Ansicht, Eigenkontrolle und Monatsmappe mit rund 70 KB, die Willkommensseite mit Widmung und Geschenk-Link rund 17 KB, der Speisekarte-Gestalter rund 10 KB – er ersetzt Hauskarten-Satz und Website-Ansicht)', {vorher:before, nachher:size});
  // im laufenden Programm: keine der alten Seiten, keine alten Einstellungen
  const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  const rt = await p.evaluate(() => ({tabs:TABS.map(t => t[0]).join(), fn:['renderLabor','renderStempel','renderBegriffe','renderAufbau','gdRewards','missionGo','isSimple','vsw','matrixSvg','guideHere','checkRewards'].filter(n => { try { return typeof eval(n) !== 'undefined'; } catch(e){ return false; } }), cls:document.body.className, intro:!!document.getElementById('intro'), skDefs:!!document.getElementById('skDefs')}));
  L.ok(rt.fn.length === 0 && !/simple/.test(rt.cls) && !rt.intro && !rt.skDefs, 'im laufenden Programm gibt es keine der entfernten Funktionen', rt);
  L.ok(rt.tabs === 'dash,vorb,checkl,menu,cards,stock,buy,products,pcheck,dienst,report,setup,einr,daten,apart', 'Seiten der App', rt.tabs);
  // auf keiner Seite: Kachelreihen, Karten-/Kompakt-Schalter, Lagerort-Marken in den Zeilen, Strich-Spalten
  const bad = []; for(const h of L.SCREENS){ await L.go(p, h); const r = await p.evaluate(() => ({tiles:document.querySelectorAll('#app .tiles, #app .tile').length, vsw:document.querySelectorAll('#app .vsw').length, note:document.querySelectorAll('#app .note, #app .wozu, #app .pl-demo').length, eyebrow:document.querySelectorAll('#app .page-h .eyebrow').length, reward:document.querySelectorAll('.reward,.gd-rw').length, txt:/Stempel|Rezept-Labor|Demodaten|Beispielpreis|Küchenchef|Inhaber/.test(document.querySelector('#app').innerText)}));
    if(r.tiles || r.vsw || r.note || r.eyebrow || r.reward || r.txt) bad.push(h + ' ' + JSON.stringify(r)); }
  L.ok(bad.length === 0, 'auf keiner Seite: Kachelreihen, Ansicht-Schalter, Hinweis-Kästen, Vorzeilen, alte Wörter', bad);
  await L.go(p, 'ware/bestand'); const stock = await p.evaluate(() => ({tags:document.querySelectorAll('#app table.stock td .tag').length, grp:[...document.querySelectorAll('#app table.stock tr.grp')].map(x => x.firstElementChild.childNodes[0].textContent), th:[...document.querySelectorAll('#app table.stock thead th')].map(x => x.textContent).join('|'), fact:document.querySelector('#app .fact').textContent}));
  L.ok(stock.tags === 0 && stock.grp.length >= 4 && !/Lagerort/.test(stock.th) && /Lagerwert/.test(stock.fact), 'Bestand: der Lagerort steht einmal als Überschrift der Gruppe, nicht als Marke in jeder Zeile; ein Satz statt vier Kacheln', stock);
  await p.click('#app [data-act="loc"][data-id="K"]'); await p.waitForTimeout(200); L.ok(await p.evaluate(() => document.querySelectorAll('#app table.stock td .tag, #app table.stock tr.grp').length === 0), 'mit Lagerort-Filter: weder Marken noch Gruppen');
  await L.go(p, 'speisekarte'); const menu = await p.evaluate(() => { const rows = [...document.querySelectorAll('#app table.lt-menu tbody tr.row')]; const noRec = rows.filter(r => r.querySelector('.lt-miss')); return {n:rows.length, noRec:noRec.length, dashes:noRec.filter(r => /—/.test(r.textContent)).length, link:noRec.every(r => r.querySelectorAll('[data-act="newCardFor"]').length === 1 && r.querySelector('[data-act="newCardFor"]').textContent === 'Rezeptur fehlt'), want:S.menu.filter(m => !(m.card && C(m.card))).length, th:[...document.querySelectorAll('#app table.lt-menu thead th')].map(x => x.textContent).filter(Boolean).join('|')}; });
  L.ok(menu.noRec === menu.want && menu.noRec > 0 && menu.dashes === 0 && menu.link, 'Gerichte ohne Rezeptur: ein ruhiges „Rezeptur fehlt“ statt Strich-Spalten', menu);
  L.ok(menu.th === 'Gericht|Preis|Wareneinsatz|in %|Rohertrag', 'Spalten: Gericht, Preis, Wareneinsatz, in %, Rohertrag (kein „WE“)', menu.th);
  await L.go(p, 'rezepte'); await p.evaluate(() => go('cards', S.cards.find(c => !(c.img && IMG[c.img])).id)); await p.waitForTimeout(250);
  const ph = await p.evaluate(() => { const e = document.querySelector('#app .ph-empty'); if(!e) return null; const cs = getComputedStyle(e); return {bg:cs.backgroundImage, style:e.getAttribute('style')}; });
  L.ok(ph && !/hsl\(|rgb\(1[0-9]{2}, [0-9]+, 2[0-9]{2}\)/.test(ph.bg) && !/gradient\(135deg, hsl/.test(ph.bg), 'Platzhalter ohne Foto: kein farbiger Verlauf mehr', ph);
  // Beispieldaten: eine Zeile, die zu den Einstellungen führt
  await L.go(p, 'heute'); const demo = await p.evaluate(() => ({side:document.querySelector('#demoSide').textContent, vis:!document.querySelector('#demoSide').hidden, n:[...document.querySelectorAll('.demo-line')].filter(e => e.getClientRects().length).length}));
  L.ok(demo.vis && /^Beispieldaten · eigene Daten$/.test(demo.side) && demo.n === 1, 'Beispieldaten: genau eine ruhige Zeile (Seitenleiste)', demo);
  await p.click('#demoSide [data-act="goDemo"]'); await p.waitForTimeout(300); L.ok(await p.evaluate(() => view.tab === 'daten' && !!document.querySelector('#app [data-act="leerAsk"]')), 'die Zeile führt zu Einstellungen › Eigene Daten (Paket C)');
  await p.click('#app [data-act="leerAsk"]'); await p.waitForTimeout(250); await p.click('#dlgForm button[type="submit"], #dlgForm .btn.primary'); await p.waitForTimeout(600);
  L.ok(await p.evaluate(() => !S.demo && S.menu.length === 0 && document.querySelector('#demoSide').hidden && !!STORE.st.safety), '„Leer starten“: leerer Betrieb, Zeile weg, Sicherheitskopie angelegt');
  for(const h of L.SCREENS) await L.go(p, h);
  await L.done(b, p.errs); })();
