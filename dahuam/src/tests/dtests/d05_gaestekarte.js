// Getränke in der Gästekarte: die Menge steht bei jedem Preis („0,5 l … 5,40“), mehrere Größen in einer Zeile. Hauskarte und Schlicht. Allergen-Zeichen wie bisher.
const L = require('./lib'); const sp = s => String(s).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:1000}});
  await L.go(p, 'speisekarte/gaestekarte'); await p.waitForTimeout(1200);
  const hs = await p.evaluate(() => { const k = curSeasonKey(), d = view.gdate || todayStr(); const doc = new DOMParser().parseFromString('<div>' + hsPages(k, d).join('') + '</div>', 'text/html');
    const find = n => [...doc.querySelectorAll('.hs-d,.hs-feat')].find(x => x.querySelector('.hs-n,.fn').textContent.trim() === n);
    const pr = n => { const e = find(n); return e ? [...e.querySelectorAll('.hs-p')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).join(' / ') + (e.querySelector('.hs-ps') ? ' #' + e.querySelector('.hs-ps').className : '') : null; };
    const al = n => { const e = find(n); const a = e && e.querySelector('.hs-al'); return a ? a.textContent : ''; };
    const sec = [...doc.querySelectorAll('.hs-sec')].find(x => x.dataset.sec === 'Getränke');
    return {bier:pr('Märzen vom Fass'), weizen:pr('Weißbier'), gv:pr('Grüner Veltliner'), spritz:pr('Aperitif Spritz'), esp:pr('Espresso'), schn:pr('Wiener Schnitzel'), gul:pr('Gulaschsuppe'), alBier:al('Märzen vom Fass'), alGv:al('Grüner Veltliner'), alMin:al('Mineralwasser'), alCap:al('Cappuccino'),
      n:sec ? sec.querySelectorAll('.hs-d,.hs-feat').length : 0, ill:sec ? /M26,20h26/.test(sec.querySelector('.ill').innerHTML) : false, small:[...find('Märzen vom Fass').querySelectorAll('.hs-p small')].map(x => x.textContent).join('|')}; });
  L.ok(hs.bier === '0,3 l4,20 / 0,5 l5,40 #hs-ps dr' && hs.small === '0,3 l|0,5 l', 'Hauskarte: Märzen vom Fass in einer Zeile mit zwei Preisen, die Menge vor jedem Preis (0,3 l 4,20 · 0,5 l 5,40)', hs.bier);
  L.ok(hs.weizen === '0,5 l5,60' && hs.gv === '0,125 l4,80 / 0,75 l29,00 #hs-ps dr', 'Hauskarte: ein Preis mit Menge (Weißbier 0,5 l); Wein als Achtel und Flasche', [hs.weizen, hs.gv]);
  L.ok(hs.spritz === '7,50' && hs.esp === '2,90', 'Getränke ohne Ausschankmenge (Cocktail, Espresso): nur der Preis, nichts erfunden', [hs.spritz, hs.esp]);
  L.ok(hs.schn === 'vom Schwein20,90 / vom Kalb28,90 #hs-ps' && hs.gul === '7,90', 'Speisen unverändert: Varianten untereinander, einfacher Preis ohne Zusatz', [hs.schn, hs.gul]);
  L.ok(hs.alBier === 'A' && hs.alGv === 'O' && hs.alMin === '' && hs.alCap === 'G', 'Allergen-Zeichen wie bisher: Bier A, Wein O, Mineralwasser keines, Cappuccino G', [hs.alBier, hs.alGv, hs.alMin, hs.alCap]);
  L.ok(hs.n === 11 && hs.ill, 'Kapitel „Getränke“: 11 Einträge (14 Preise), mit Glas statt Teller als Zeichnung', hs.n);
  await p.evaluate(() => { view.hsBig = true; render(); }); await p.waitForTimeout(1200);
  { const el = await p.evaluateHandle(() => [...document.querySelectorAll('#app .hs-page')].filter(x => /GETRÄNKE/.test(x.textContent) && x.querySelector('.hs-d, .hs-feat'))[0]); await el.asElement().scrollIntoViewIfNeeded(); await el.asElement().screenshot({path:L.OUT + '/d05-hauskarte-getraenke.png'}); }
  // nichts ragt aus dem Blatt, die Zeile bricht nicht
  const geo = await p.evaluate(() => { const pg = [...document.querySelectorAll('#app .hs-page')].filter(x => /GETRÄNKE/.test(x.textContent) && x.querySelector('.hs-d'))[0]; const pr = pg.getBoundingClientRect(); const bad = []; pg.querySelectorAll('.hs-d').forEach(d => { const l = d.querySelector('.hs-l').getBoundingClientRect(), ps = d.querySelector('.hs-ps, .hs-p').getBoundingClientRect(), n = d.querySelector('.hs-n').getBoundingClientRect(); if(ps.right > pr.right || ps.left < n.right - 1 || ps.height > n.height * 1.6) bad.push(d.textContent.slice(0, 20)); }); return bad; });
  L.ok(geo.length === 0, 'Hauskarte: Preise stehen rechts neben dem Namen in einer Zeile, nichts überlappt', geo);
  // ---------- Schlicht ----------
  await p.evaluate(() => { S.settings.guestStyle = 'schlicht'; save(); view.wk.tab = 'all'; render(); }); await p.waitForTimeout(500);
  const wk = await p.evaluate(() => { const find = n => [...document.querySelectorAll('#app .wk-dish')].find(x => x.querySelector('.wk-n').firstChild.textContent.trim() === n); const pr = n => { const e = find(n); return [...e.querySelectorAll('.wk-l1 .wk-p')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).join(' / ') + '#' + e.querySelectorAll('.wk-var').length; };
    return {bier:pr('Märzen vom Fass'), min:pr('Mineralwasser'), spritz:pr('Aperitif Spritz'), tabs:[...document.querySelectorAll('#app .wk-tabs button')].map(x => x.textContent).join('|'), schn:find('Wiener Schnitzel').querySelectorAll('.wk-var').length, al:find('Märzen vom Fass').querySelector('.wk-a').textContent, leg:document.querySelector('#app .wk-leg').textContent}; });
  L.ok(sp(wk.bier) === '0,3 l€ 4,20 / 0,5 l€ 5,40#0' && sp(wk.min) === '0,33 l€ 3,40#0' && sp(wk.spritz) === '€ 7,50#0', 'Schlicht: „0,3 l € 4,20 · 0,5 l € 5,40“ in der Kopfzeile, keine Zeilen je Variante', wk);
  L.ok(/\|Getränke$/.test(wk.tabs) && !/Weitere/.test(wk.tabs) && wk.schn === 2 && /Allergene A/.test(wk.al) && /A Gluten/.test(sp(wk.leg)) && /O Sulfite/.test(sp(wk.leg)), 'Schlicht: eigener Reiter „Getränke“ (nicht „Weitere“); Speisen-Varianten wie bisher; Legende mit A und O', wk.tabs);
  await p.click('#app [data-act=wkTab][data-id=getraenke]'); await p.waitForTimeout(300);
  { const el = await p.$('#app .wk-paper'); await el.screenshot({path:L.OUT + '/d05-schlicht-getraenke.png'}); }
  // Handy
  const {p:q} = await L.open(b, {vp:L.PHONE.vp, ctx:L.PHONE.ctx});
  await q.evaluate(() => { S.settings.guestStyle = 'schlicht'; save(); view.mtab = 'guest'; view.wk.tab = 'getraenke'; go('menu'); }); await q.waitForTimeout(600);
  L.ok(await q.evaluate(() => document.documentElement.scrollWidth === 390 && [...document.querySelectorAll('#app .wk-dish')].every(d => d.getBoundingClientRect().right <= 390.5 && [...d.querySelectorAll('.wk-p')].every(x => x.getBoundingClientRect().right <= 390.5))), 'Handy 390 px, Schlicht: Getränke mit zwei Preisen passen, kein Querrollen');
  await L.shot(q, 'd05-schlicht-getraenke-handy');
  // PDF-Fassung der Hauskarte enthält dieselben Angaben
  L.ok(await p.evaluate(() => /0,3 l/.test(guestHtmlWeb(curSeasonKey(), todayStr(), {print:true})) && !/undefined|NaN/.test(hsPages(curSeasonKey(), todayStr()).join(''))), 'Druckfassung: Mengen stehen drin; nirgends „undefined“ oder „NaN“');
  // Eintrag ohne Rezeptur, nur mit Menge: Menge wird gezeigt
  L.ok(await p.evaluate(() => { S.menu.push({id:'m_x', section:'Getränke', name:'Hausgemachter Eistee', desc:'', price:4.1, card:'', img:'', veg:'', top:false, hidden:false, seasons:[], days:[], alg:'', algNone:true, vat:'', group:'', vlabel:'', vol:400, order:90}); const h = guestHtmlWeb(curSeasonKey(), todayStr(), {print:true}); S.menu.pop(); return /Hausgemachter Eistee<\/h4><span class="wk-ps"><span class="wk-p"><small>0,4 l<\/small>€\s4,10/.test(h); }), 'Getränk ohne Rezeptur mit eingetragener Menge: „0,4 l € 4,10“');
  await L.done(b, p.errs.concat(q.errs)); })();
