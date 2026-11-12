// Effekte: je ein Tipp, wirkt auf alle Blätter, bleibt gespeichert, lässt sich zurücknehmen. Wenige Möglichkeiten, die zueinander passen.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
  await L.gk(p, 'alpin');
  const pg = () => ev(() => { const n = document.querySelectorAll('#gsCanvas .gs-page')[1]; const cs = getComputedStyle(n); const hn = n.querySelector('.gs-hn'), d = n.querySelector('.gs-d:not(.fr) .gs-n'); return {cls:n.className, n:document.querySelectorAll('#gsCanvas .gs-page').length, same:new Set([...document.querySelectorAll('#gsCanvas .gs-page')].map(x => x.className.replace(' gs-cover', ''))).size === 1,
    bg:cs.backgroundColor, img:cs.backgroundImage.slice(0, 9), ink:cs.color, ac:cs.getPropertyValue('--ac').trim(), hf:getComputedStyle(hn).fontFamily.split(',')[0].replace(/"/g, ''), nf:getComputedStyle(d).fontFamily.split(',')[0].replace(/"/g, ''), hc:getComputedStyle(hn).color, sh:getComputedStyle(hn).textShadow,
    cap:n.querySelectorAll('.gs-cap').length, fr:document.querySelectorAll('#gsCanvas .gs-d.fr').length, ill:n.querySelectorAll('.gs-ill').length, frame:getComputedStyle(n.querySelector('.gs-frame')).display, dv:(n.querySelector('.gs-h .gs-dv') || {}).innerHTML || '', ta:getComputedStyle(n.querySelector('.gs-d')).textAlign}; });
  const fx = (k, id) => p.click(`#gsRail [data-gs="fx"][data-k="${k}"][data-id="${id}"]`).then(() => L.settle(p));
  const tog = k => p.click(`#gsRail label.tog:has([data-gst="${k}"])`).then(() => L.settle(p));
  const a0 = await pg();
  L.ok(a0.same && /gs-bg-papier/.test(a0.cls) && /gs-o-berg/.test(a0.cls) && a0.hf === 'Fraunces' && a0.cap >= 2 && a0.fr >= 3 && a0.ill >= 2 && a0.img === 'url("blob', 'Alpin beginnt mit Papier, Bergen, Fraunces, Initialen, Rahmen um Empfehlungen und Zeichnungen', a0);
  L.ok(await ev(() => document.querySelectorAll('#gsRail [data-gs="fx"][data-k="bg"]').length === 6 && document.querySelectorAll('#gsRail [data-gs="fx"][data-k="acc"]').length === 3 && document.querySelectorAll('#gsRail [data-gs="fx"][data-k="orn"]').length === 4 && document.querySelectorAll('#gsRail [data-gst]').length === 5), 'kleine Auswahl: 6 Hintergründe, 3 Akzentfarben, 4 Ornamente, 5 Schalter');
  // Hintergründe
  const bgs = {};
  for(const k of ['leinen', 'weiss', 'schiefer', 'holz', 'kreide', 'papier']){ await fx('bg', k); const s = await pg(); bgs[k] = s; L.ok(new RegExp('gs-bg-' + k).test(s.cls) && s.same && (k === 'weiss' ? s.img === 'none' : s.img === 'url("blob') && await ev(k => document.querySelector(`#gsRail [data-k="bg"][data-id="${k}"]`).getAttribute('aria-pressed') === 'true', k), `Hintergrund ${k}: ein Tipp, alle Blätter`, [s.bg, s.img]); }
  const lum = c => { const m = c.match(/\d+/g).map(Number); return (.299 * m[0] + .587 * m[1] + .114 * m[2]) / 255; };
  L.ok(['schiefer', 'holz', 'kreide'].every(k => lum(bgs[k].ink) > .8 && lum(bgs[k].bg) < .2 && /gs-dark/.test(bgs[k].cls)) && ['leinen', 'weiss', 'papier'].every(k => lum(bgs[k].ink) < .25 && lum(bgs[k].bg) > .85), 'dunkler Grund → helle Schrift, heller Grund → dunkle Schrift (immer lesbar)');
  L.ok(bgs.schiefer.ac !== bgs.papier.ac, 'die Akzentfarbe passt sich dem Grund an', [bgs.schiefer.ac, bgs.papier.ac]);
  // Akzent
  const acs = []; for(const i of [1, 2, 0]){ await fx('acc', i); acs.push((await pg()).ac); }
  L.ok(new Set(acs).size === 3 && acs[2] === a0.ac && (await ev(() => [...document.querySelectorAll('#gsRail [data-k="acc"]')].map(n => n.textContent.trim()))).join('|') === 'Preiselbeere|Tanne|Lärche', 'drei Akzentfarben je Vorlage (Alpin: Preiselbeere, Tanne, Lärche)', acs);
  // Ornament
  const dvs = {}; for(const k of ['linie', 'schnoerkel', 'kreide', 'berg']){ await fx('orn', k); const s = await pg(); dvs[k] = s.dv; L.ok(new RegExp('gs-o-' + k).test(s.cls), `Ornament ${k}`); }
  L.ok(new Set(Object.values(dvs)).size === 4 && (await pg()).frame === 'block', 'jedes Ornament hat seine eigene Trennlinie; „Berge“ rahmt das Blatt');
  // Schrift
  const fonts = {}; for(const k of ['haus', 'elegant', 'kreide', 'bar', 'schlicht', 'alpin']){ await fx('font', k); const s = await pg(); fonts[k] = [s.hf, s.nf]; }
  L.ok(fonts.haus.join() === 'Barlow Condensed,Fraunces' && fonts.elegant.join() === 'Cormorant Garamond,Cormorant Garamond' && fonts.kreide.join() === 'Caveat,Caveat' && fonts.bar.join() === 'Barlow Condensed,Barlow Condensed' && fonts.schlicht.join() === 'Source Serif 4,Source Serif 4' && fonts.alpin.join() === 'Fraunces,Fraunces', 'sechs Schriftpaare', fonts);
  L.ok(await ev(async () => { const need = ['400 20px "Cormorant Garamond"', '500 20px "Caveat"', '600 20px "Barlow Condensed"', '400 20px "Fraunces"', '600 20px "Source Serif 4"']; return need.every(f => document.fonts.check(f)); }) && p.context().ext.length === 0, 'alle Schriften kommen aus dem eigenen Ordner, kein fremder Dienst', p.context().ext);
  // Versalien bei „Haus“ ohne CSS, auch mit ß
  await fx('font', 'haus'); L.ok(await ev(() => [...document.querySelectorAll('#gsCanvas .gs-hn')].some(n => n.textContent === 'SÜSSES') && [...document.querySelectorAll('#gsCanvas .gs-hn')].every(n => n.textContent === n.textContent.toLocaleUpperCase('de-AT'))), 'Schrift „Haus“: Überschriften in Versalien, „Süßes“ wird „SÜSSES“ (im Text, nicht per CSS)'); await fx('font', 'alpin');
  // Schalter
  await tog('cap'); let s = await pg(); L.ok(s.cap === 0, 'Initiale aus'); await tog('cap'); s = await pg(); L.ok(s.cap >= 2, 'Initiale wieder ein');
  await tog('gold'); s = await pg(); L.ok(/gs-gold/.test(s.cls) && s.hc !== a0.hc && s.sh !== 'none', 'Goldprägung: Titel in Gold mit feiner Prägekante (fester Farbton, druckbar)', [s.hc, s.sh]); L.ok(await ev(() => [...document.querySelectorAll('#gsCanvas .gs-page *')].every(n => { const c = getComputedStyle(n); return c.backgroundClip !== 'text' && c.webkitBackgroundClip !== 'text' && c.filter === 'none' && c.mixBlendMode === 'normal'; })), 'kein Effekt braucht Verlaufsschrift, Filter oder Mischmodus'); await tog('gold');
  await tog('frame'); s = await pg(); L.ok(s.fr === 0 && await ev(() => document.querySelectorAll('#gsCanvas .gs-top').length >= 3), 'Rahmen aus: Empfehlungen tragen stattdessen das kleine Zeichen'); await tog('frame'); s = await pg(); L.ok(s.fr === a0.fr, 'Rahmen wieder ein');
  await tog('ill'); s = await pg(); L.ok(s.ill === 0, 'Zeichnungen aus'); await tog('ill');
  await tog('ctr'); s = await pg(); L.ok(/gs-ctr/.test(s.cls) && s.ta === 'center', 'Mittig setzen'); await tog('ctr');
  // einzelnes Gericht rahmen
  await p.click(await L.blockSel(p, 'Gärtnerin')); await p.waitForTimeout(100); await p.click('#gsRail label.tog:has([data-gsb="fr"])'); await L.settle(p);
  L.ok(await ev(() => [...document.querySelectorAll('#gsCanvas .gs-d.fr')].some(n => /Gärtnerin/.test(n.textContent) && /Empfehlung des Hauses/.test(n.textContent))), 'einzelnes Gericht „Als Empfehlung rahmen“');
  await p.click('#gsRail [data-gs="done"]');
  // zurück zum Ausgang? jede Kombination bleibt im Raster
  await fx('bg', 'schiefer'); await fx('orn', 'schnoerkel'); await fx('font', 'kreide'); await tog('ctr');
  { const sh = await L.sheets(p); const bad = sh.flatMap(s => s.cover ? [] : s.units.filter(u => u.k !== 'break' && (Math.round(u.h) % 8 !== 0 || u.bottom > s.body.bottom + 1))); L.ok(bad.length === 0, 'wilde Mischung (Schiefer, Schnörkel, Kreideschrift, mittig): bleibt im Raster, nichts läuft über', bad.slice(0, 2)); await p.screenshot({path:L.OUT + '/effekte-mischung.png'}); }
  // gespeichert
  const want = await ev(() => JSON.stringify(gsDoc().fx)); await L.idle(p); await p.reload(); await L.ready(p); await L.gk(p);
  L.ok(await ev(() => JSON.stringify(gsDoc().fx)) === want && /gs-bg-schiefer/.test((await pg()).cls) && /gs-f-kreide/.test((await pg()).cls), 'nach dem Neuladen: alle Effekte wie eingestellt', want);
  // andere Vorlage unberührt
  await L.pick(p, 'elegant'); L.ok(/gs-bg-leinen/.test((await pg()).cls) && /gs-f-elegant/.test((await pg()).cls), 'andere Vorlagen behalten ihre eigenen Effekte'); await L.pick(p, 'alpin');
  // Rückgängig nimmt einen Effekt zurück
  await fx('bg', 'papier'); await p.click('[data-gs="undo"]'); await L.settle(p); L.ok(/gs-bg-schiefer/.test((await pg()).cls), 'Rückgängig nimmt den letzten Effekt zurück');
  // neu aufbauen
  await p.click('#gsRail .gs-more summary'); await p.click('#gsRail [data-gs="rebuild"]'); await p.waitForTimeout(250);
  L.ok(await ev(() => /neu aus der Speisekarte aufbauen/.test(document.querySelector('dialog[open]').textContent)), '„Vorlage neu aufbauen“ fragt nach');
  await p.click('dialog[open] .btn.primary, dialog[open] button[type="submit"]'); await p.waitForTimeout(400); await L.settle(p); s = await pg();
  L.ok(/gs-bg-papier/.test(s.cls) && /gs-f-alpin/.test(s.cls) && s.cls === a0.cls && s.n === a0.n, 'danach steht die Vorlage wieder wie am ersten Tag', [s.cls, s.n, a0.n]);
  errs.push(...p.errs); await L.done(b, errs);
})();
