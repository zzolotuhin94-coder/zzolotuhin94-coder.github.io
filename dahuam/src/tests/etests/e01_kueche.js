// Rezept-Ansicht „Küche“: Mengen rechnen (von Hand nachgerechnet), Basisrezept in derselben Ansicht, Getränk, Abhaken ohne Speichern,
// Bildschirm bleibt an, keine Preise, Team landet auf „Küche“, PDF ohne Preise.
const L = require('./lib');
// Zutatenzeilen der Küchen-Ansicht als «Menge|Name»
const ing = p => p.evaluate(() => [...document.querySelectorAll('#app .rz-ing li')].map(li => (li.querySelector('.rz-q').innerText.replace(/\s+/g, ' ').trim() + '|' + li.querySelector('.rz-t').childNodes[0].textContent.trim())));
const WAKE = `(() => { const st = window.__wl = {req:0, rel:0, held:0, reject:false}; Object.defineProperty(navigator, 'wakeLock', {configurable:true, value:{request: async () => { st.req++; if(st.reject) throw new DOMException('nein', 'NotAllowedError'); st.held++; let fn = null; return {released:false, release: async function(){ st.rel++; st.held--; this.released = true; if(fn) fn(); }, addEventListener: (e, f) => { fn = f; }}; }}}); })();`;
(async () => { const b = await L.launch(); const {p} = await L.open(b, {...L.TABLET, init:WAKE});
  const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
  // ---------- Schalter auf der Rezeptseite ----------
  await L.go(p, 'rezepte/dish_elsasser');
  L.ok(await ev(() => [...document.querySelectorAll('#app .rz-sw [role=tab]')].map(x => x.textContent + (x.classList.contains('on') ? '*' : '')).join('|')) === 'Kalkulation*|Küche|Service', 'Chef: Rezeptseite öffnet in der Kalkulation; ein Schalter Kalkulation · Küche · Service');
  await p.click('#app .rz-sw [data-id="kueche"]'); await w(200);
  L.ok(await ev(() => location.hash) === '#rezepte/dish_elsasser/kueche' && !!(await p.$('#app .rz-k')), 'ein Tipp auf „Küche“: Küchen-Ansicht, eigene Adresse');
  // ---------- ×1: Mengen wie in der Rezeptur ----------
  L.ok((await ing(p)).join(';') === '150 g|Flammkuchenteig;80 g|Crème fraîche;60 g|Tiroler Speck g.g.A.;50 g|Zwiebel;15 g|Frühlingszwiebel;1 g|Salz;0,5 g|Pfeffer schwarz gemahlen', '×1: Mengen der Rezeptur, Basisrezept als Zeile', await ing(p));
  // keine Preise, keine Prozente, nichts zum Ändern
  const clean = await ev(() => { const t = document.querySelector('#app').innerText; return {eur:/€|EUR/.test(t), pct:/%/.test(t), we:/Wareneinsatz|Einkauf|Betrag/.test(t), inputs:[...document.querySelectorAll('#app input, #app select, #app textarea')].map(x => x.id).join(), acts:[...new Set([...document.querySelectorAll('#app [data-act]')].map(x => x.dataset.act))].sort().join()}; });
  L.ok(!clean.eur && !clean.pct && !clean.we && clean.inputs === 'rzN' && clean.acts === 'backCards,guideHere,rzN,rzOpen,rzTick,rzView', 'Küche: kein Preis, kein Prozent, kein Wareneinsatz; einziges Feld ist die Portionszahl', clean);
  L.ok(/Allergene\s*A Gluten\s*G Milch\/Laktose/.test(await L.txt(p, '#app .rz-alg')) && /1 Portion · 380 g/.test(await L.txt(p, '#app .rz-h')), 'Kopf: Portionsgewicht; Allergene mit Namen', await L.txt(p, '#app .rz-alg'));
  L.ok(await ev(() => [...document.querySelectorAll('#app .rz-steps .rz-sn')].map(x => x.textContent).join('') === '123' && parseFloat(getComputedStyle(document.querySelector('#app .rz-st')).fontSize) >= 20 && parseFloat(getComputedStyle(document.querySelector('#app .rz-i')).fontSize) >= 20), 'Schritte nummeriert; Zutaten und Schritte in großer Schrift (ab 20 px am Tablet)');
  // ---------- ×5 und ×10: von Hand gerechnet ----------
  await p.click('#app [data-act="rzN"][data-id="5"]'); await w(120);
  L.ok((await ing(p)).join(';') === '750 g|Flammkuchenteig;400 g|Crème fraîche;300 g|Tiroler Speck g.g.A.;250 g|Zwiebel;75 g|Frühlingszwiebel;5 g|Salz;2,5 g|Pfeffer schwarz gemahlen' && /für 5 Portionen/.test(await L.txt(p, '#app .rz-sec h2')), '×5: 150→750 g, 80→400 g, 60→300 g, 50→250 g, 15→75 g, 1→5 g, 0,5→2,5 g', await ing(p));
  await p.click('#app [data-act="rzN"][data-id="10"]'); await w(120);
  L.ok((await ing(p))[0] === '1,5 kg|Flammkuchenteig' && (await ing(p))[4] === '150 g|Frühlingszwiebel', '×10: 1500 g Teig stehen als 1,5 kg da', (await ing(p))[0]);
  // freie Zahl
  await p.fill('#rzN', '7'); await p.press('#rzN', 'Enter'); await w(150);
  L.ok((await ing(p)).slice(0, 2).join(';') === '1,05 kg|Flammkuchenteig;560 g|Crème fraîche' && await ev(() => !document.querySelector('#app .rz-chips .on')), 'freie Zahl 7: 1050 g → 1,05 kg, 560 g', (await ing(p)).slice(0, 2));
  await p.fill('#rzN', '0'); await p.press('#rzN', 'Enter'); await w(150);
  L.ok(/größer als 0/.test(await L.toast(p)) && (await ing(p))[1] === '560 g|Crème fraîche', '0 Portionen wird abgelehnt, die Mengen bleiben');
  // ---------- Basisrezept in derselben Ansicht, mit genau der benötigten Menge ----------
  await p.click('#app [data-act="rzN"][data-id="5"]'); await w(100); await p.click('#app .rz-open'); await w(250);
  // 5 Portionen brauchen 750 g Teig; Charge 1650 g → Faktor 750/1650 = 0,4545…: Mehl 1000→454,5→455 g · Wasser 600→272,7→273 ml · Öl 80→36,4→36 ml · Salz 20→9,09→9,1 g
  L.ok((await ing(p)).join(';') === '455 g|Mehl glatt;273 ml|Wasser;36 ml|Rapsöl;9,1 g|Salz' && /für 750 g \(0,45 Chargen\)/.test(await L.txt(p, '#app .rz-sec h2')), 'Basisrezept aus der Zeile: 750 g von 1650 g → 455 g Mehl, 273 ml Wasser, 36 ml Öl, 9,1 g Salz', await ing(p));
  L.ok(await ev(() => location.hash === '#rezepte/semi_flammdough/kueche' && /Zurück zu Flammkuchen/.test(document.querySelector('#app .back').textContent) && [...document.querySelectorAll('#app .rz-sw [role=tab]')].length === 2 && document.querySelector('#rzY').value === '750'), 'im Basisrezept: „Zurück zu Flammkuchen …“, kein Reiter „Service“, Feld „ergibt 750 g“');
  await p.click('#app [data-act="rzN"][data-id="2"]'); await w(120);
  L.ok((await ing(p)).join(';') === '2 kg|Mehl glatt;1,2 l|Wasser;160 ml|Rapsöl;40 g|Salz' && /für 3,3 kg \(2 Chargen\)/.test(await L.txt(p, '#app .rz-sec h2')), '2 Chargen: 2 kg Mehl, 1,2 l Wasser, 160 ml Öl, 40 g Salz, ergibt 3,3 kg', await ing(p));
  await p.fill('#rzY', '825'); await p.press('#rzY', 'Enter'); await w(150);
  L.ok((await ing(p)).join(';') === '500 g|Mehl glatt;300 ml|Wasser;40 ml|Rapsöl;10 g|Salz' && await ev(() => document.querySelector('#app .rz-chips .on').textContent === '½'), 'Menge 825 g eingeben = halbe Charge: 500 g, 300 ml, 40 ml, 10 g', await ing(p));
  await p.click('#app [data-act="rzUp"]'); await w(200);
  L.ok(await ev(() => location.hash === '#rezepte/dish_elsasser/kueche') && (await ing(p))[0] === '750 g|Flammkuchenteig', 'zurück: wieder das Gericht mit 5 Portionen');
  // ---------- Stück bleibt Stück ----------
  await L.go(p, 'rezepte/dish_schnitzel_pork/kueche'); await p.click('#app [data-act="rzN"][data-id="2"]'); await w(120);
  const sch = await ing(p);
  L.ok(sch[0] === '360 g|Schweinerücken' && sch[2] === '0,7 Stk ca. 42 g|Ei M' && sch[6] === '0,5 Stk ca. 55 g|Zitrone' && sch[5] === '400 g|Pommes frites TK', '×2 Schnitzel: 360 g Fleisch, 0,7 Stk Ei (ca. 42 g), 0,5 Stk Zitrone (ca. 55 g)', sch);
  L.ok(/Angabe unvollständig \(.*Pommes frites TK/.test(await L.txt(p, '#app .rz-alg')) && /A Gluten/.test(await L.txt(p, '#app .rz-alg')), 'Allergene unvollständig: steht dabei, mit den Artikeln ohne Angabe', await L.txt(p, '#app .rz-alg'));
  // ---------- Getränk: cl, ml, l ----------
  await L.go(p, 'rezepte/dk_spritz/kueche');
  L.ok((await ing(p)).join(';') === '4 cl|Bitter-Aperitif;8 cl|Prosecco;2 cl|Mineralwasser;0,1 Stk|Orange' || (await ing(p)).slice(0, 3).map(x => x.split('|')[0]).join() === '4 cl,8 cl,2 cl', 'Getränk ×1: 4 cl, 8 cl, 2 cl', await ing(p));
  await p.click('#app [data-act="rzN"][data-id="5"]'); await w(120);
  L.ok((await ing(p)).slice(0, 4).map(x => x.split('|')[0].replace(/ ca\..*/, '')).join() === '20 cl,40 cl,10 cl,0,5 Stk' && /für 5 Gläser/.test(await L.txt(p, '#app .rz-sec h2')) && /Ins Glas/.test(await L.txt(p, '#app .rz-sec h2')), 'Getränk ×5: 20 cl, 40 cl, 10 cl, 0,5 Stk Orange; „für 5 Gläser“', await ing(p));
  await L.go(p, 'rezepte/dk_bier/kueche'); await p.click('#app [data-act="rzN"][data-id="5"]'); await w(120);
  L.ok((await ing(p))[0].split('|')[0] === '2,5 l' && /1 Glas · 0,5 l/.test(await L.txt(p, '#app .rz-h')), 'Bier 0,5 l ×5 = 2,5 l', await ing(p));
  await L.go(p, 'rezepte/dk_capp/kueche'); await p.click('#app [data-act="rzN"][data-id="2"]'); await w(120);
  L.ok((await ing(p))[1].split('|')[0] === '240 ml', 'Cappuccino ×2: Milch 120 ml → 240 ml (in ml geschrieben, bleibt ml)', await ing(p));
  // reine Rechenfunktion
  L.ok(await ev(() => [rzAmount(999.6, 'g'), rzAmount(1000, 'g'), rzAmount(12345, 'g'), rzAmount(0.44, 'g'), rzAmount(1500, 'ml'), rzAmount(3, 'Stk'), rzAmount(40, 'ml', {drink:true, u:'cl'}), rzAmount(5, 'ml', {drink:true, u:'cl'}), rzAmount(300, 'ml', {drink:true, u:'l'}), rzAmount(0, 'g')].join('|')) === '1 kg|1 kg|12,35 kg|0,4 g|1,5 l|3 Stk|4 cl|5 ml|0,3 l|', 'Einheiten: ab 1000 g → kg, ab 1000 ml → l, Stk bleibt, Getränke in cl');
  // ---------- Abhaken: nicht gespeichert ----------
  await L.go(p, 'rezepte/dish_elsasser/kueche'); await L.idle(p); const before = await ev(async () => JSON.stringify(await __store.read()));
  await p.click('#app .rz-ing li:nth-child(2) .rz-i'); await p.click('#app .rz-steps li:nth-child(1) .rz-step'); await w(100);
  L.ok(await ev(() => document.querySelectorAll('#app .rz li.done').length === 2 && document.querySelector('#app .rz-ing li:nth-child(2) .rz-i').getAttribute('aria-pressed') === 'true' && getComputedStyle(document.querySelector('#app .rz-ing li.done .rz-t')).textDecorationLine === 'line-through'), 'Zutat und Schritt antippen: durchgestrichen');
  await p.click('#app [data-act="rzN"][data-id="2"]'); await w(120);
  L.ok(await ev(() => document.querySelectorAll('#app .rz li.done').length === 2), 'andere Portionszahl: die Häkchen bleiben stehen');
  await L.idle(p); L.ok(before === await ev(async () => JSON.stringify(await __store.read())), 'nichts davon wird gespeichert (Speicher unverändert)');
  await L.go(p, 'rezepte'); await L.go(p, 'rezepte/dish_elsasser/kueche');
  L.ok(await ev(() => document.querySelectorAll('#app .rz li.done').length === 0 && document.querySelector('#rzN').value === '1'), 'nach dem Verlassen: Häkchen weg, wieder 1 Portion');
  // ---------- Bildschirm bleibt an ----------
  L.ok(await ev(() => __wl.held === 1 && __wl.req >= 1), 'Küchen-Ansicht offen: Bildschirmsperre angefordert', await ev(() => __wl));
  await L.go(p, 'rezepte/dish_elsasser/service'); await w(100); L.ok(await ev(() => __wl.held === 0), 'andere Ansicht: wieder freigegeben');
  await L.go(p, 'rezepte/dish_elsasser/kueche'); await w(100); await L.go(p, 'heute'); await w(100); L.ok(await ev(() => __wl.held === 0 && __wl.rel >= 2), 'Bereich verlassen: freigegeben');
  await ev(() => { __wl.reject = true; }); await L.go(p, 'rezepte/dish_elsasser/kueche'); await w(150);
  L.ok(!!(await p.$('#app .rz-k')) && p.errs.length === 0, 'Gerät lehnt ab: die Ansicht läuft ohne Fehler weiter', p.errs);
  await ev(() => { __wl.reject = false; });
  // ---------- Rezepte-Liste: derselbe Schalter ----------
  await L.go(p, 'rezepte'); await ev(() => { view.cv = null; render(); });
  L.ok(await ev(() => /Wareneinsatz/.test(document.querySelector('#app table.lt thead').textContent) && document.querySelectorAll('#app .rz-sw [role=tab]').length === 3), 'Chef, Liste: Kalkulation mit Wareneinsatz; Schalter mit drei Ansichten');
  await p.click('#app .rz-sw [data-id="kueche"]'); await w(150);
  L.ok(await ev(() => { const t = document.querySelector('#app .lt-wrap').innerText; return !/€|%|Wareneinsatz/i.test(t) && /Flammkuchenteig\s+Basisrezept · 1,65 kg/.test(t) && document.querySelectorAll('#app table.lt tbody tr').length === S.cards.length; }), 'Liste „Küche“: alle Rezepturen, ohne Preise');
  await p.click('#app table.lt tbody tr:first-child .row-open'); await w(200);
  L.ok(!!(await p.$('#app .rz-k')), 'aus der Liste direkt in die Küchen-Ansicht');
  // ---------- Team ----------
  await L.team(p); await ev(() => { view.cv = null; go('cards'); }); await w(150);
  L.ok(await ev(() => document.querySelector('#app .rz-sw .on').textContent === 'Küche' && !/€/.test(document.querySelector('#app .lt-wrap').innerText)), 'Team: die Liste steht auf „Küche“, ohne Preise');
  await L.go(p, 'rezepte/dish_burger'); await w(150);
  const tm = await ev(() => ({k:!!document.querySelector('#app .rz-k'), hash:location.hash, t:document.querySelector('#app').innerText, ro:!!document.querySelector('#app .ro-note'), dis:document.querySelectorAll('#app [disabled]').length}));
  L.ok(tm.k && tm.hash === '#rezepte/dish_burger' && !/€|Wareneinsatz|%/.test(tm.t) && !tm.ro && tm.dis === 0, 'Team öffnet ein Rezept: Küchen-Ansicht, kein Preis, nichts gesperrt', [tm.hash, tm.ro, tm.dis]);
  await p.click('#app [data-act="rzN"][data-id="2"]'); await w(100); L.ok((await ing(p))[0] === '400 g|Rindsfaschiertes', 'Team rechnet Portionen um (2 × 200 g = 400 g)');
  // ---------- PDF: echte Datei, ohne Preise ----------
  const html = await ev(() => rzPrintHtml(C('dish_elsasser'), 5));
  L.ok(!/€|Betrag|Wareneinsatz|Netto/.test(html) && />750 g<\/td><td>Flammkuchenteig \(Basisrezept\)/.test(html) && /Basisrezept: Flammkuchenteig/.test(html) && />455 g</.test(html) && /für 5 Portionen/.test(html) && /Allergene:<\/b> A Gluten, G Milch\/Laktose/.test(html), 'Küchen-PDF: Mengen für 5 Portionen, Basisrezept mit 455 g Mehl darunter, Allergene; kein Preis');
  await L.go(p, 'rezepte/dish_caesar'); await p.click('#app [data-act="rzN"][data-id="5"]'); await w(100);
  const d = await L.dl(p, () => p.click('#app [data-pdf="printKueche"]'));   // Name ohne Umlaut: das Test-Chromium nennt Dateien mit Umlaut im Namen sonst „download“
  L.ok(d.name === 'Kueche-Caesar-Salat.pdf' && d.size > 20000 && L.pdfPages(d.file) === 2 && /PDF erstellt: Kueche-Caesar-Salat\.pdf \(2 Seiten\)/.test(await L.toast(p)), 'Team speichert das Küchen-Rezept als PDF: echte Datei, zwei Seiten (Gericht für 5 Portionen, darunter das Caesar-Dressing)', [d.name, d.size, L.pdfPages(d.file)]);
  await L.done(b, p.errs); })();
