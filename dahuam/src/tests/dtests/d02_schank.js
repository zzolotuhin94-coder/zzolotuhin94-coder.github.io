// Schankrezeptur: Wareneinsatz eines Getränks aus Artikel und Menge, mit Schankverlust, Größen aus einer Rezeptur, 20 % MwSt. Alle Zahlen von Hand gerechnet.
const L = require('./lib'); const fs = require('fs'); const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  // ---------- eigene Artikel mit runden Zahlen ----------
  await p.evaluate(() => { const dr = (id, name, geb, L, N, gp, pfand, loss) => S.products.push({id, name, unit:'l', price:Math.round(gp / (L * N) * 10000) / 10000, lossCold:0, lossHot:0, alg:'', algNone:true, pieceG:'', stock:300, minStock:0, loc:'W', supplier:'sup_getraenke', artNo:'', geb, gebL:L, gebN:N, pack:gebLabel(geb, L, N), packQty:L * N, pfand, pourLoss:loss, priceDemo:false});
    dr('t_fass', 'T Fassbier', 'fass', 30, 1, 87, 30, 5);        // 2,90 €/l, 5 % Schankverlust, 30 € Pfand
    dr('t_wein', 'T Wein', 'fl', 0.75, 1, 6, 0, 0);              // 8,00 €/l
    dr('t_soda', 'T Soda', 'kiste', 1, 12, 4.8, 6, 0);           // 0,40 €/l
    dr('t_gin', 'T Gin', 'fl', 0.7, 1, 21, 0, 0);                // 30,00 €/l
    dr('t_saft', 'T Saft', 'kiste', 1, 6, 9, 3, 0);              // 1,50 €/l
    S.products.push({id:'t_sirup', name:'T Sirup', unit:'l', price:10, lossCold:0, lossHot:0, alg:'', algNone:true, pieceG:'', stock:5, minStock:0, loc:'W', supplier:'', artNo:'', pack:'', packQty:0, priceDemo:false});
    const card = (id, name, y, items) => S.cards.push({id, no:S.settings.nextNo++, name, type:'dish', drink:true, category:'Getränke', yieldG:y, img:'', steps:[], items:items.map(([k, q]) => ({ref:'p:' + k, qty:q, net:''}))});
    card('k_bier', 'T Bier', 500, [['t_fass', 500]]); card('k_achtel', 'T Achtel', 125, [['t_wein', 125]]); card('k_spritzer', 'T Spritzer', 250, [['t_wein', 125], ['t_soda', 125]]);
    card('k_cocktail', 'T Cocktail', '', [['t_gin', 40], ['t_sirup', 20], ['t_saft', 100], ['lemon', 0.25]]);
    const menu = (id, name, price, card, vol) => S.menu.push({id, section:'Getränke', name, desc:'', price, card, img:'', veg:'', top:false, hidden:false, seasons:[], days:[], alg:'', algNone:false, vat:'', group:'', vlabel:'', vol:vol || '', order:50 + S.menu.length});
    menu('m_b5', 'T Bier', 5.4, 'k_bier'); menu('m_b3', 'T Bier', 4.2, 'k_bier', 300); menu('m_ach', 'T Achtel', 4.8, 'k_achtel'); menu('m_fl', 'T Achtel', 28.8, 'k_achtel', 750); menu('m_spr', 'T Spritzer', 4.2, 'k_spritzer'); menu('m_ck', 'T Cocktail', 9.6, 'k_cocktail');
    save(); });
  const calc = id => p.evaluate(i => { const m = S.menu.find(x => x.id === i); const k = menuCalc(m); return {cost:k.cost, net:k.netPrice, fc:k.fc, margin:k.margin, rate:vatRate(m), f:menuFactor(m)}; }, id);
  const b5 = await calc('m_b5');
  L.ok(near(b5.cost, 0.5 * 2.9 / 0.95) && near(b5.cost, 1.5263157895) && b5.rate === 20 && near(b5.net, 4.5) && near(b5.fc, 1.5263157895 / 4.5 * 100) && near(b5.fc, 33.9181286550) && near(b5.margin, 2.9736842105), 'Fass 30 l zu € 87, 5 % Schankverlust: 0,5 l kosten 0,5 × 2,90 / 0,95 = € 1,5263 · € 5,40 inkl. 20 % = € 4,50 netto · 33,92 % · Rohertrag € 2,97', b5);
  L.ok(near(await p.evaluate(() => line({ref:'p:t_fass', qty:500, net:''}, 0).cost), 1.5263157895) && near(await p.evaluate(() => { const x = P('t_fass'); const pf = x.pfand; x.pfand = 0; const c0 = totals(C('k_bier')).cost; x.pfand = 500; const c1 = totals(C('k_bier')).cost; x.pfand = pf; return c1 - c0; }), 0), 'Pfand (30 € je Fass) steckt nie im Wareneinsatz: ob 0 oder 500 € Pfand, das Glas kostet gleich viel');
  const b3 = await calc('m_b3');
  L.ok(near(b3.f, 0.6) && near(b3.cost, 0.9157894737) && near(b3.net, 3.5) && near(b3.fc, 26.1654135338), 'Größe 0,3 l aus derselben Rezeptur (für 0,5 l): Faktor 0,6 → € 0,9158 · € 4,20 / 1,2 = € 3,50 · 26,17 %', b3);
  const ach = await calc('m_ach'), fla = await calc('m_fl');
  L.ok(near(ach.cost, 1) && near(ach.fc, 25) && near(fla.f, 6) && near(fla.cost, 6) && near(fla.net, 24) && near(fla.fc, 25), 'Achtel Wein (Flasche 0,75 l zu € 6): 0,125 × 8,00 = € 1,00 · 25 %; die ganze Flasche aus derselben Rezeptur: Faktor 6 → € 6,00 · € 28,80 / 1,2 = € 24,00 · 25 %', [ach, fla]);
  const spr = await calc('m_spr');
  L.ok(near(spr.cost, 1.05) && near(spr.net, 3.5) && near(spr.fc, 30), 'Spritzer = 1/8 Wein (€ 1,00) + 1/8 Soda (€ 0,05) = € 1,05 · 30 %', spr);
  const ck = await calc('m_ck');
  L.ok(near(ck.cost, 1.2 + 0.2 + 0.15 + 0.0875) && near(ck.cost, 1.6375) && near(ck.net, 8) && near(ck.fc, 20.46875) && ck.f === 1, 'Cocktail: 4 cl Gin € 1,20 + 2 cl Sirup € 0,20 + 10 cl Saft € 0,15 + ¼ Zitrone € 0,0875 = € 1,6375 · € 9,60 / 1,2 = € 8,00 · 20,47 %', ck);
  // Speise mit einer Getränke-Menge: kein Faktor (nur Schankrezepturen skalieren)
  L.ok(await p.evaluate(() => { const m = S.menu.find(x => x.card === 'dish_goulash'); const a = menuCalc(m).cost; m.vol = 150; const f = menuFactor(m), c = menuCalc(m).cost; m.vol = ''; return f === 1 && a === c; }), 'eine Speise rechnet nie nach Menge: Faktor immer 1');
  // ---------- Verkauf: Lager geht um Menge mit Schankverlust und nach Größe zurück ----------
  const ex = await p.evaluate(() => { const acc = new Map(); explode(C('k_bier'), 10 * menuFactor(S.menu.find(m => m.id === 'm_b3')), acc); const a2 = new Map(); explode(C('k_cocktail'), 2, a2); return {bier:acc.get('t_fass'), gin:a2.get('t_gin'), lemon:a2.get('lemon')}; });
  L.ok(near(ex.bier, 10 * 0.3 / 0.95) && near(ex.bier, 3.1578947368) && near(ex.gin, 0.08) && near(ex.lemon, 0.5), '10 × 0,3 l Bier verkauft: 3,0 l / 0,95 = 3,158 l vom Fass; 2 Cocktails: 0,08 l Gin, ½ Zitrone', ex);
  await L.go(p, 'ware/bestand'); await p.evaluate(() => { clearDemoSales(); salesDlg(); }); await p.waitForTimeout(250);
  await p.fill('#dlgForm [name="s_m_b3"]', '10'); await p.waitForTimeout(100);
  L.ok(/9,16/.test(await p.evaluate(() => document.querySelector('#salesC').textContent)), 'Verkäufe buchen: 10 × 0,3 l zeigt € 9,16 Wareneinsatz');
  await L.dlgOk(p);
  L.ok(near(await p.evaluate(() => P('t_fass').stock), 300 - 3.158, 0.0006), 'gebucht: Fassbier-Bestand 300 l − 3,158 l', await p.evaluate(() => P('t_fass').stock));
  // ---------- Rezepte: Filter, neue Schankrezeptur ----------
  await L.go(p, 'rezepte');
  const seg = await p.evaluate(() => [...document.querySelectorAll('#app [data-act=ctype]')].map(x => x.textContent.replace(/\s+/g, '')).join('|') + '#' + document.querySelector('#app .page-h .btn.primary').textContent.trim());
  L.ok(/^Alle30\|Gerichte10\|Basisrezepte5\|Getränke15#Rezeptur$/.test(seg), 'Rezepte: Filter „Getränke“ neben Gerichte und Basisrezepte; Gerichte zählen ohne Getränke', seg);
  await p.click('#app [data-act=ctype][data-id=drink]'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => document.querySelectorAll('#app table.lt tbody tr').length === 15 && document.querySelector('#app .page-h .btn.primary').textContent.trim() === 'Schankrezeptur' && document.querySelectorAll('#app .page-h .btn.primary').length === 1 && /0,5 l/.test(document.querySelector('#app table.lt tbody').textContent)), 'Filter Getränke: 15 Schankrezepturen, ein Hauptknopf „Schankrezeptur“, die Zeile nennt die Ausschankmenge');
  await L.shot(p, 'd02-rezepte-getraenke');
  await p.click('#app .page-h .btn.primary'); await p.waitForTimeout(350);
  const nc = await p.evaluate(() => { const c = C(view.card); return {drink:c.drink, type:c.type, cat:c.category, h:[...document.querySelectorAll('#app table.dk-t thead th')].map(x => x.textContent).join('|'), eyebrow:document.querySelector('#app .eyebrow').textContent, noFood:!document.querySelector('#app input[data-lf="net"]') && !document.querySelector('#sim'), steps:!!document.querySelector('#app .steps')}; });
  L.ok(nc.drink === true && nc.type === 'dish' && nc.cat === 'Getränke' && nc.h === 'Artikel|Menge|Betrag|' && /^Getränk · Schankrezeptur Nr\./.test(nc.eyebrow) && nc.noFood && !nc.steps, 'neue Schankrezeptur: Tabelle „Ausschank“ mit Artikel, Menge, Betrag; kein Netto/Fertig-Gewicht, kein Preis-Simulator, Zubereitung erst auf Wunsch', nc);
  await p.fill('#cf-name', 'Neues Seidl'); await p.keyboard.press('Tab'); await p.waitForTimeout(250);
  await p.selectOption('#dref-0', 'p:t_fass'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => document.querySelector('#app [data-du="0"]').value === 'cl' && /mit 5 % Schankverlust/.test(document.querySelector('#app .dk-loss').textContent)), 'Artikel gewählt: Einheit cl vorgeschlagen, darunter „mit 5 % Schankverlust“');
  await p.fill('#dq-0', '4'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  const q1 = await p.evaluate(() => C(view.card).items[0].qty);
  await p.selectOption('#app [data-du="0"]', 'ml'); await p.waitForTimeout(300); const q2 = await p.evaluate(() => C(view.card).items[0].qty);
  await p.selectOption('#app [data-du="0"]', 'l'); await p.waitForTimeout(300); await p.fill('#dq-0', '0,3'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  const q3 = await p.evaluate(() => ({q:C(view.card).items[0].qty, u:C(view.card).items[0].u, shown:document.querySelector('#dq-0').value, cost:totals(C(view.card)).cost}));
  L.ok(q1 === 40 && q2 === 4 && q3.q === 300 && q3.u === 'l' && q3.shown === '0,3' && near(q3.cost, 0.3 * 2.9 / 0.95), 'Menge: „4“ cl = 40 ml · auf ml gestellt = 4 ml · „0,3“ l = 300 ml → € 0,9158', [q1, q2, q3]);
  await p.fill('#dk-y', '0,3'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => C(view.card).yieldG === 300 && /für 0,3 l/.test(document.querySelector('#app .hero-stats').textContent)), 'Ausschankmenge 0,3 l gespeichert (300 ml), oben steht „Wareneinsatz für 0,3 l“');
  await p.click('#app [data-act=drinkLine]'); await p.waitForTimeout(300); await p.selectOption('#dref-1', 'p:lemon'); await p.waitForTimeout(300); await p.fill('#dq-1', '0,5'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => { const c = C(view.card); return c.items[1].qty === 0.5 && !document.querySelector('#app [data-du="1"]') && /Stk/.test(document.querySelector('#dq-1').closest('.dk-q').textContent); }), 'Garnitur in Stück: ohne Einheiten-Auswahl');
  await p.click('#app [data-act=delLine][data-id="1"]'); await p.waitForTimeout(300);
  // auf die Karte: Kategorie Getränke, 20 %
  await p.click('#app [data-act=toMenu]'); await p.waitForTimeout(300);
  const tm = await p.evaluate(() => { const f = document.querySelector('#dlgForm').elements; return {sec:f.section.value, card:f.card.value === view.card, vol:!document.querySelector('#mdVol').hidden, ph:f.vol.placeholder, price:f.price.value}; });
  L.ok(tm.sec === 'Getränke' && tm.card && tm.vol && tm.ph === 'wie Rezeptur: 0,3 l', '„Auf die Karte setzen“: Kategorie Getränke, Feld „Ausschankmenge“ mit „wie Rezeptur: 0,3 l“', tm);
  L.ok(tm.price === '3,90', 'Preisvorschlag für 28 %: 0,9158 / 0,28 × 1,20 = 3,92 → € 3,90', tm.price);
  await p.fill('#dlgForm [name=price]', '4,20'); await L.dlgOk(p);
  await p.click('#app [data-act=drinkSize]'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => { const f = document.querySelector('#dlgForm').elements; return f.name.value === 'Neues Seidl' && f.section.value === 'Getränke' && f.card.value === view.card && f.price.value === ''; }), '„Weitere Größe“: Name, Kategorie und Rezeptur stehen schon da, nur Menge und Preis fehlen');
  await p.fill('#dlgForm [name=vol]', '0,5'); await p.fill('#dlgForm [name=price]', '5,60'); await L.dlgOk(p);
  const vs = await p.evaluate(() => { const ms = menuSorted().filter(m => m.card === view.card); return {n:ms.length, tags:ms.map(m => dishLabel(m) + ':' + m.price + ':' + (m.vol || '')).join('|'), group:ms[0].group && ms[0].group === ms[1].group, adj:Math.abs(menuSorted().indexOf(ms[0]) - menuSorted().indexOf(ms[1])) === 1, fc:ms.map(m => menuCalc(m).fc), rows:[...document.querySelectorAll('#app .dk-on li')].map(li => li.textContent.replace(/\s+/g, ' ').trim())}; });
  L.ok(vs.n === 2 && vs.tags === 'Neues Seidl · 0,3 l:4.2:|Neues Seidl · 0,5 l:5.6:500' && vs.group && vs.adj, 'zwei Größen eines Getränks: eine Gruppe, nebeneinander, kleinste zuerst, Bezeichnung aus der Menge', vs.tags);
  L.ok(near(vs.fc[0], 0.9157894737 / 3.5 * 100) && near(vs.fc[1], (0.5 * 2.9 / 0.95) / (5.6 / 1.2) * 100) && vs.rows.length === 2 && /^0,3 l€ 4,20€ 0,9226,2 %$/.test(vs.rows[0].replace(/ /g, ' ')) && /^0,5 l€ 5,60€ 1,5332,7 %$/.test(vs.rows[1].replace(/ /g, ' ')), '„Auf der Karte“: je Größe Preis, Wareneinsatz und Prozent (0,5 l: 1,5263 / 4,6667 = 32,7 %)', vs.rows);
  await L.shot(p, 'd02-schankrezeptur'); await L.theme(p, 'dark'); await L.shot(p, 'd02-schankrezeptur-dunkel'); await L.theme(p, 'light');
  // Menge am Eintrag ändern: Bezeichnung zieht mit
  await p.evaluate(() => menuDialog(S.menu.find(m => m.card === view.card && m.vol === 500))); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => document.querySelector('#dlgForm [name=vol]').value === '0,5' && document.querySelector('#dlgForm [name=volU]').value === 'l'), 'Eintrag bearbeiten: Ausschankmenge 0,5 l steht im Dialog');
  await p.fill('#dlgForm [name=vol]', '0,4'); await L.dlgOk(p);
  L.ok(await p.evaluate(() => { const m = S.menu.find(x => x.card === view.card && x.vol === 400); return !!m && m.vlabel === '0,4 l' && Math.abs(menuFactor(m) - 4 / 3) < 1e-9; }), 'auf 0,4 l geändert: Bezeichnung „0,4 l“, Faktor 0,4 / 0,3');
  // Getränk in einer Speisen-Kategorie: rechnet trotzdem mit 20 %
  const vg = await p.evaluate(() => { S.cards.push({id:'k_food', no:99, name:'T Hausaperitif', type:'dish', drink:true, category:'Süßes', yieldG:'', img:'', steps:[], items:[{ref:'p:t_gin', qty:20, net:''}]}); save(); go('cards', 'k_food'); return true; });
  await p.click('#app [data-act=toMenu]'); await p.waitForTimeout(300); await p.selectOption('#dlgForm [name=section]', 'Süßes'); await p.fill('#dlgForm [name=price]', '4,80'); await L.dlgOk(p);
  const ha = await p.evaluate(() => { const m = S.menu.find(x => x.card === 'k_food'); return [m.section, m.vat, vatRate(m), menuCalc(m).netPrice]; });
  L.ok(ha[0] === 'Süßes' && ha[1] === 'g' && ha[2] === 20 && near(ha[3], 4), 'Schankrezeptur unter einer Speisen-Kategorie: der Eintrag bekommt den Getränke-Satz (€ 4,80 / 1,2 = € 4,00)', ha);
  // Typ umstellen
  await p.selectOption('#cf-type', 'dish'); await p.waitForTimeout(350);
  L.ok(await p.evaluate(() => C('k_food').drink === false && C('k_food').type === 'dish' && !document.querySelector('#app table.dk-t')), 'Typ von Getränk auf Gericht: wieder die Küchen-Rezeptur');
  await p.selectOption('#cf-type', 'drink'); await p.waitForTimeout(350);
  L.ok(await p.evaluate(() => C('k_food').drink === true && !!document.querySelector('#app table.dk-t')), 'und zurück auf Getränk');
  // „Rezeptur fehlt“ bei einem Getränk der Karte legt eine Schankrezeptur an
  await p.evaluate(() => { S.menu.push({id:'m_tee', section:'Getränke', name:'T Tee', desc:'', price:3.2, card:'', img:'', veg:'', top:false, hidden:false, seasons:[], days:[], alg:'', algNone:false, vat:'', group:'', vlabel:'', vol:250, order:99}); save(); newCard('dish', S.menu.find(m => m.id === 'm_tee')); }); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => { const c = C(view.card); return c.drink === true && c.name === 'T Tee' && c.yieldG === 250 && S.menu.find(m => m.id === 'm_tee').card === c.id; }), '„Rezeptur fehlt“ bei einem Getränk: es entsteht eine Schankrezeptur mit der Menge des Eintrags (0,25 l)');
  // Zubereitung auf Wunsch
  await p.click('#app [data-act=stepAdd]'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => !!document.querySelector('#app .steps textarea') && document.querySelectorAll('#app [data-act=stepAdd]').length === 1), 'Zubereitung: ein Tipp legt den ersten Schritt an');
  // ---------- Prep-Liste ohne Getränke ----------
  L.ok(await p.evaluate(() => { const pl = vbPlan(vbDay()); return pl.dishes.length > 0 && !pl.dishes.some(d => isDrinkEntry(d.m || S.menu.find(m => m.id === (d.id || d.mid)) || {})); }), 'Vorbereitung: Getränke stehen nicht auf der Prep-Liste');
  // ---------- Rezeptur-Import: cl, ml, l, Typ Getränk ----------
  const csv = ['Rezeptur;Typ;Zutat;Menge;Einheit;Ausbeute;Gericht auf der Karte', 'Import Gspritzter;Getränk;T Wein;12,5;cl;0,25 l;', 'Import Gspritzter;Getränk;T Soda;125;ml;;', 'Import Sour;Getränk;T Gin;4;cl;;', 'Import Sour;Getränk;T Sirup;2;cl;;', 'Import Sour;Getränk;T Saft;0,1;l;;', 'Import Sour;Getränk;Zitrone;0,25;Stk;;'].join('\r\n');
  const f = L.OUT + '/d02-rezepte.csv'; fs.writeFileSync(f, '﻿' + csv);
  await L.openImp(p, 'rec'); await L.upload(p, f);
  const pv = await p.evaluate(() => view.daten.res.items.map(i => i.st + ':' + i.title + ':' + [...document.querySelectorAll('#impList .imp-rec')].find(li => li.textContent.includes(i.title)).querySelector('.imp-m small').textContent).join('|'));
  L.ok(/neu:Import Gspritzter:Getränk · 2 Zutaten · Ausschank 0,25 l\|neu:Import Sour:Getränk · 4 Zutaten/.test(pv), 'Import-Vorschau: Typ „Getränk“, Ausschank 0,25 l', pv);
  await L.apply(p);
  const ir = await p.evaluate(() => { const g = S.cards.find(c => c.name === 'Import Gspritzter'), s = S.cards.find(c => c.name === 'Import Sour'); return {g:[g.drink, g.type, g.yieldG, g.category, g.items.map(i => i.ref + '=' + i.qty).join(), totals(g).cost], s:[s.drink, s.items.map(i => i.qty).join(), totals(s).cost]}; });
  L.ok(ir.g[0] === true && ir.g[1] === 'dish' && ir.g[2] === 250 && ir.g[3] === 'Getränke' && ir.g[4] === 'p:t_wein=125,p:t_soda=125' && near(ir.g[5], 1.05), 'Import: 12,5 cl = 125 ml, 125 ml, Ausbeute „0,25 l“ = 250 ml → Schankrezeptur zu € 1,05', ir.g);
  L.ok(ir.s[0] === true && ir.s[1] === '40,20,100,0.25' && near(ir.s[2], 1.6375), 'Import: 4 cl, 2 cl, 0,1 l, ¼ Stk → € 1,6375', ir.s);
  // ---------- Rollen ----------
  await p.evaluate(() => { view.cv = 'kalk'; /* seit Paket D2 öffnet das Team ein Rezept in der Küchen-Ansicht; hier geht es um die Kalkulation */ go('cards', 'k_bier'); }); await L.team(p); await p.waitForTimeout(300);
  const ro = await p.evaluate(() => ({dq:document.querySelector('#dq-0').disabled, du:document.querySelector('#app [data-du="0"]').disabled, dref:document.querySelector('#dref-0').disabled, dy:document.querySelector('#dk-y').disabled, line:document.querySelector('#app [data-act=drinkLine]').disabled, size:document.querySelector('#app [data-act=drinkSize]').disabled, note:!!document.querySelector('#app .ro-note')}));
  L.ok(ro.dq && ro.du && ro.dref && ro.dy && ro.line && ro.size && ro.note, 'Team: Schankrezeptur nur ansehen (Artikel, Menge, Einheit, Ausschankmenge, „Artikel“, „Weitere Größe“ gesperrt)', ro);
  await L.go(p, 'rezepte'); L.ok(await p.evaluate(() => { const b = document.querySelector('#app [data-act=newCard]'); newCard('drink'); return b.disabled && !view.card; }), 'Team: keine neue Schankrezeptur');
  await L.done(b, p.errs); })();
