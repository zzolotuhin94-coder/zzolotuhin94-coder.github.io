// Fremder Text: alles, was jemand eintippen oder mit einer Sicherung einspielen kann, steht als Text im Blatt – nie als HTML.
const L = require('./lib');
const X = '<img src=x onerror="window.__x=(window.__x||0)+1">"\'&<script>window.__x=9</script>';
(async () => { const b = await L.launch(); const errs = [];
  const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
  await L.gk(p, 'alpin');
  await ev(X => {
    const m = S.menu.find(m => m.name === 'Gärtnerin'); m.name = 'N1' + X; m.desc = 'D1' + X;
    const v = S.menu.filter(m => m.group === 'schnitzel'); v[0].vlabel = 'V1' + X;
    const dr = S.menu.find(m => m.name === 'Weißbier'); dr.name = 'G1' + X;
    const i = S.settings.sections.indexOf('Rösti'); S.settings.sections[i] = 'S1' + X; S.menu.forEach(m => { if(m.section === 'Rösti') m.section = 'S1' + X; });
    const se = S.settings.seasons.herbst; se.title = 'T1' + X; se.subtitle = 'U1' + X; se.footer = 'F1' + X;
    S.settings.menuCopy = {sec:{'Flammkuchen':'I1' + X}, claim:'C1' + X, algOpen:'O1' + X}; S.settings.name = 'H1' + X; S.settings.address = 'A1' + X;
    S.specials.push({id:'sp_x', name:'P1' + X, note:'Q1' + X, from:'2026-11-12', to:'2026-11-12', mode:'insert', items:[{name:'R1' + X, desc:'W1' + X, price:9, alg:'', veg:''}]});
    const d = gsDoc(), bl = d.blocks; const at = bl.findIndex(b => b.t === 'head');
    bl.splice(at, 0, {id:'bx1', t:'text', txt:'B1' + X, al:X, hand:true}, {id:'bx2', t:'head', txt:'B2' + X, intro:'B3' + X, cols:X}, {id:'bx3', t:'photo', src:"x');background:url(javascript:alert(1))" + X, size:X, cap:'B4' + X}, {id:'bx4', t:'space', size:X}, {id:'bx5', t:X});
    d.fx.bg = X; d.fx.font = X; d.fx.orn = X; d.fx.acc = X; d.scope = X; d.hide = ['m:' + S.menu.find(m => m.name === 'Knoblauchbrot').id]; S.menu.find(m => m.name === 'Knoblauchbrot').name = 'K1' + X;
    save(); render();
  }, X); await L.settle(p);
  const chk = async where => ev(([X, where]) => { const root = document.querySelector(where); const html = root.innerHTML;
    return {x:window.__x || 0, img:[...root.querySelectorAll('img')].filter(i => !/logo|^blob:/.test(i.getAttribute('src') || '')).length, script:root.querySelectorAll('script').length, on:[...root.querySelectorAll('*')].filter(n => [...n.attributes].some(a => /^on/i.test(a.name))).length, js:/javascript:/.test([...root.querySelectorAll('[style]')].map(n => n.getAttribute('style')).join(' ')), raw:html.includes('<img src=x'), txt:root.textContent}; }, [X, where]);
  let c = await chk('#gsCanvas');
  L.ok(c.x === 0 && c.img === 0 && c.script === 0 && c.on === 0 && !c.js && !c.raw, 'Blätter: kein eingeschleustes Bild, Skript oder Ereignis; nichts wurde ausgeführt', {x:c.x, img:c.img, script:c.script, on:c.on, js:c.js});
  const seen = ['N1', 'D1', 'V1', 'G1', 'S1', 'T1', 'U1', 'F1', 'I1', 'C1', 'O1', 'H1', 'A1', 'P1', 'Q1', 'R1', 'W1', 'B1', 'B2', 'B3', 'B4'].filter(k => !c.txt.includes(k + '<img src=x') && !c.txt.toLowerCase().includes((k + '<img src=x').toLowerCase()));
  L.ok(seen.length === 0, 'jeder dieser Texte steht wörtlich im Blatt: Gericht, Beschreibung, Variante, Getränk, Kategorie, Titel, Unterzeile, Fußzeile, Kapitelzeile, Leitspruch, °-Satz, Hausname, Adresse, Aktion, Bausteine', seen);
  L.ok(await ev(() => { const pg = document.querySelector('#gsCanvas .gs-page'); return /gs-bg-papier/.test(pg.className) && /gs-f-alpin/.test(pg.className) && /gs-o-berg/.test(pg.className) && !/[<>"]/.test(pg.className) && !/[<>]/.test(pg.getAttribute('style')); }), 'unbekannte Werte bei Hintergrund, Schrift, Ornament, Farbe fallen auf die Vorlage zurück');
  L.ok(await ev(() => /gaststube\.webp/.test(document.querySelector('#gsCanvas [data-b="bx3"] .gs-im').style.backgroundImage) && document.querySelector('#gsCanvas [data-b="bx3"]').classList.contains('s-m')), 'Foto mit fremder Quelle: es bleibt beim hauseigenen Bild in mittlerer Größe');
  // Seitenleiste: jede Art Baustein öffnen, dazu „mehr“
  c = await chk('#gsRail'); L.ok(c.x === 0 && c.img === 0 && c.script === 0 && c.on === 0, 'Seitenleiste (Vorlage, Effekte, Tag, ausgeblendete Gerichte): sauber', {img:c.img});
  L.ok(/K1<img src=x/.test(c.txt), 'ausgeblendetes Gericht steht mit seinem Namen als Text in der Liste');
  for(const id of ['bx1', 'bx2', 'bx3', 'bx4']){ await ev(id => gsSelect(id), id); await p.waitForTimeout(60); const r = await chk('#gsRail'); const f = await chk('#gsCanvas'); L.ok(r.x === 0 && r.img === 0 && r.script === 0 && r.on === 0 && f.img === 0 && !!(await ev(() => document.querySelector('#gsFloat'))), `Baustein ${id} gewählt: Einstellungen und Leiste sauber`); }
  for(const t of ['title', 'dish', 'aktion', 'legend']){ await ev(t => { const el = document.querySelector(`#gsCanvas .gs-b[data-k="${t}"]`); gsSelect(el.dataset.b); }, t); await p.waitForTimeout(60); const r = await chk('#gsRail'); L.ok(r.x === 0 && r.img === 0 && r.script === 0 && r.on === 0, `Baustein „${t}“ gewählt: Einstellungen sauber`); }
  L.ok(await ev(() => [...document.querySelectorAll('#gsCanvas .gs-b[aria-label]')].every(n => !n.querySelector('img[src="x"]')) && [...document.querySelectorAll('#gsCanvas .gs-b')].some(n => /N1<img/.test(n.getAttribute('aria-label') || ''))), 'Namen für Vorleseprogramme: als Text');
  // Ziehen: das Schild am Zeiger zeigt den Namen als Text
  { await ev(() => gsSelect(null)); const sel = await ev(() => { const n = [...document.querySelectorAll('#gsCanvas .gs-d')].find(x => /N1/.test(x.textContent)); n.scrollIntoView({block:'center'}); return `#gsCanvas .gs-b[data-b="${n.dataset.b}"]`; }); await p.waitForTimeout(80); const a = await L.center(p, sel);
    await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x, a.y + 30, {steps:4}); const gh = await ev(() => ({kids:document.querySelector('.gs-ghost').children.length, t:document.querySelector('.gs-ghost').textContent})); await p.mouse.up(); await L.settle(p);
    L.ok(gh.kids === 0 && /N1<img/.test(gh.t), 'Schild beim Ziehen: nur Text'); }
  // PDF-Weg (Druckbereich) und Rückgängig-Zeile
  await p.keyboard.press('Control+z'); await p.waitForTimeout(150);
  const d = await L.dl(p, () => p.click('[data-pdf="printMenu"]')); c = await chk('#print');
  L.ok(L.pdfPages(d.file) >= 3 && c.x === 0 && c.img === 0 && c.script === 0 && c.on === 0, 'Druckbereich und PDF: sauber, die Datei entsteht trotz der Sonderzeichen', d.name);
  L.ok(!/[<>"']/.test(d.name), 'Dateiname ohne Sonderzeichen', d.name);
  // jede Vorlage
  for(const k of ['haus', 'elegant', 'kreide', 'getraenke', 'schlicht']){ await L.pick(p, k); c = await chk('#gsCanvas'); L.ok(c.x === 0 && c.img === 0 && c.script === 0 && c.on === 0 && /<img src=x/.test(c.txt), `Vorlage ${k}: sauber, die Texte stehen wörtlich da`); }
  L.ok(await ev(() => window.__x === undefined) && p.errs.filter(e => /DIALOG/.test(e)).length === 0, 'nichts wurde ausgeführt, kein Fenster ging auf');
  errs.push(...p.errs.filter(e => !/net::ERR|Failed to load resource/.test(e))); await L.done(b, errs);
})();
