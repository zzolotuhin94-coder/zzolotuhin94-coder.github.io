// Getränke in der Gästekarte (Speisekarte-Gestalter): die Menge steht vor jedem Preis („0,5 l 5,40“), mehrere Größen in einer Zeile. Vorlagen Hauskarte, Schlicht und Getränkekarte. Allergen-Zeichen wie bisher.
// (Bis 1.5 prüfte diese Datei den früheren Hauskarten-Satz und die Website-Ansicht „Schlicht“ mit ihren Reitern; beides ersetzt der Gestalter.)
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:1000}});
  await L.go(p, 'speisekarte/gaestekarte'); await p.waitForTimeout(1200);
  const card = look => p.evaluate(look => { gsState().cur = look; save(); render(); const doc = new DOMParser().parseFromString('<div>' + gsPages({print:true}).join('') + '</div>', 'text/html');
    const nm = x => [...x.querySelector('.gs-n').childNodes].filter(c => c.nodeType === 3).map(c => c.textContent).join('').trim();
    const find = n => [...doc.querySelectorAll('.gs-d')].find(x => nm(x) === n);
    const pr = n => { const e = find(n); return e ? [...e.querySelectorAll('.gs-p')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).join(' / ') + (e.querySelector('.gs-ps') ? ' #ps' : '') + (e.querySelector('.gs-v') ? ' #v' + e.querySelectorAll('.gs-v').length : '') : null; };
    const al = n => { const e = find(n); const a = e && e.querySelector('.gs-al'); return a ? a.textContent : ''; };
    const heads = [...doc.querySelectorAll('.gs-h:not(.gs-cont) .gs-hn')].map(x => x.textContent);
    const all = [...doc.querySelectorAll('.gs-d')].map(nm); const html = doc.body.innerHTML;
    return {bier:pr('Märzen vom Fass'), weizen:pr('Weißbier'), gv:pr('Grüner Veltliner'), spritz:pr('Aperitif Spritz'), esp:pr('Espresso'), schn:pr('Wiener Schnitzel'), schnTxt:find('Wiener Schnitzel') ? [...find('Wiener Schnitzel').querySelectorAll('.gs-v')].map(x => x.textContent).join('|') : '', gul:pr('Gulaschsuppe'), alBier:al('Märzen vom Fass'), alGv:al('Grüner Veltliner'), alMin:al('Mineralwasser'), alCap:al('Cappuccino'),
      heads, n:all.filter(n => S.menu.some(m => m.name === n && isDrinkEntry(m))).length, food:all.filter(n => S.menu.some(m => m.name === n && !isDrinkEntry(m))).length, small:find('Märzen vom Fass') ? [...find('Märzen vom Fass').querySelectorAll('.gs-p small')].map(x => x.textContent).join('|') : '', bad:/undefined|NaN/.test(doc.body.textContent), ill:/M26,20h26/.test(html), leg:(doc.querySelector('.gs-lgl') || {textContent:''}).textContent}; }, look);
  for(const look of ['haus', 'schlicht', 'getraenke']){ const hs = await card(look); const T = {haus:'Hauskarte', schlicht:'Schlicht', getraenke:'Getränkekarte'}[look];
    L.ok(hs.bier === '0,3 l4,20 / 0,5 l5,40 #ps' && hs.small === '0,3 l|0,5 l', `${T}: Märzen vom Fass in einer Zeile mit zwei Preisen, die Menge vor jedem Preis (0,3 l 4,20 · 0,5 l 5,40)`, hs.bier);
    L.ok(hs.weizen === '0,5 l5,60' && hs.gv === '0,125 l4,80 / 0,75 l29,00 #ps', `${T}: ein Preis mit Menge (Weißbier 0,5 l); Wein als Achtel und Flasche`, [hs.weizen, hs.gv]);
    L.ok(hs.spritz === '7,50' && hs.esp === '2,90', `${T}: Getränke ohne Ausschankmenge (Cocktail, Espresso): nur der Preis, nichts erfunden`, [hs.spritz, hs.esp]);
    L.ok(hs.alBier === 'A' && hs.alGv === 'O' && hs.alMin === '' && hs.alCap === 'G' && /A Gluten/.test(hs.leg) && /O Sulfite/.test(hs.leg), `${T}: Allergen-Zeichen wie bisher (Bier A, Wein O, Mineralwasser keines, Cappuccino G), Legende mit A und O`, [hs.alBier, hs.alGv, hs.alMin, hs.alCap]);
    L.ok(hs.n === 11 && !hs.bad, `${T}: 11 Getränke-Einträge (14 Preise); nirgends „undefined“ oder „NaN“`, hs.n);
    if(look === 'getraenke') L.ok(hs.food === 0 && hs.heads.map(h => h.toLowerCase()).join('|') === 'aperitif & cocktails|bier|wein|kaffee & tee|alkoholfrei', 'Getränkekarte: nur Getränke, nach Art gegliedert', hs.heads);
    else { L.ok(hs.schn === '20,90 / 28,90 #v2' && /vom Schwein/.test(hs.schnTxt) && /vom Kalb/.test(hs.schnTxt) && hs.gul === '7,90', `${T}: Speisen unverändert: Varianten untereinander, einfacher Preis ohne Zusatz`, [hs.schn, hs.gul]); L.ok(hs.heads.some(h => /^getränke$/i.test(h)), `${T}: Kapitel „Getränke“ am Ende der Karte`); }
    if(look === 'haus') L.ok(hs.ill, 'Hauskarte: Kapitel „Getränke“ mit Glas statt Teller als Zeichnung');
    // im Blatt: Preise rechts neben dem Namen, nichts ragt hinaus
    await p.waitForFunction(() => gsReadyNow(gsFx(gsDoc(), gsState().cur)) && !GS.pend); await p.waitForTimeout(200);
    const geo = await p.evaluate(() => { const bad = []; document.querySelectorAll('#gsCanvas .gs-d.dr').forEach(d => { const pg = d.closest('.gs-page').getBoundingClientRect(), box = (d.closest('.gs-col') || d.closest('.gs-body')).getBoundingClientRect(); const ps = d.querySelector('.gs-ps, .gs-p').getBoundingClientRect(), n = d.querySelector('.gs-n').getBoundingClientRect(); if(ps.right > box.right + 1 || ps.right > pg.right || ps.left < n.left) bad.push(d.textContent.slice(0, 20)); }); return bad; });
    L.ok(geo.length === 0, `${T}: Preise stehen rechts in ihrer Spalte, nichts ragt hinaus`, geo);
    { const el = await p.evaluateHandle(() => [...document.querySelectorAll('#gsCanvas .gs-sheet')].find(x => x.querySelector('.gs-d.dr'))); await el.asElement().scrollIntoViewIfNeeded(); await el.asElement().screenshot({path:L.OUT + `/d05-${look}-getraenke.png`}); }
  }
  // Handy
  const {p:q} = await L.open(b, {vp:L.PHONE.vp, ctx:L.PHONE.ctx});
  await q.evaluate(() => { gsState().cur = 'getraenke'; save(); view.mtab = 'guest'; go('menu'); }); await q.waitForTimeout(900);
  L.ok(await q.evaluate(() => document.documentElement.scrollWidth === 390 && [...document.querySelectorAll('#gsCanvas .gs-sheet')].every(d => d.getBoundingClientRect().right <= 390.5)), 'Handy 390 px, Getränkekarte: das Blatt passt in die Breite, kein Querrollen');
  await L.shot(q, 'd05-getraenkekarte-handy');
  // Eintrag ohne Rezeptur, nur mit Menge: Menge wird gezeigt
  L.ok(await p.evaluate(() => { S.menu.push({id:'m_x', section:'Getränke', name:'Hausgemachter Eistee', desc:'', price:4.1, card:'', img:'', veg:'', top:false, hidden:false, seasons:[], days:[], alg:'', algNone:true, vat:'', group:'', vlabel:'', vol:400, order:90}); const h = gsPages({print:true}).join(''); S.menu.pop(); gsSync(gsDoc()); return /Hausgemachter Eistee<\/span><i class="gs-lead"><\/i><span class="gs-p"><small>0,4 l<\/small>4,10/.test(h); }), 'Getränk ohne Rezeptur mit eingetragener Menge: „0,4 l 4,10“');
  await L.done(b, p.errs.concat(q.errs)); })();
