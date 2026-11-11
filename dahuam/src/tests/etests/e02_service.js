// Rezept-Ansicht „Service“ und die Service-Liste unter „Speisekarte“: was am Teller ist, Allergene ausgeschrieben in drei Zuständen,
// Filter „ohne …“, Service-Hinweis und ausgeblendete Zeilen (nur Chef), Sonderzeichen bleiben Text.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.TABLET);
  const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
  // ---------- Service-Ansicht einer Rezeptur ----------
  await L.go(p, 'rezepte/dish_elsasser/service');
  const s1 = await L.txt(p, '#app .rz-s');
  L.ok(/^Flammkuchen Flammkuchen „Der Elsässer“ Speck, Zwiebel, Frühlingszwiebel Elsässer € 13,90 Am Teller Flammkuchenteig, Crème fraîche, Tiroler Speck g\.g\.A\., Zwiebel, Frühlingszwiebel Allergene A ?Gluten G ?Milch\/Laktose$/.test(s1), 'Service: Name, Beschreibung der Karte, Preis laut Karte, Teller ohne Mengen, Allergene mit Namen', s1);
  L.ok(await ev(() => getComputedStyle(document.querySelector('#app .rz-s')).display === 'block' && document.querySelector('#app .rz-s h1').offsetWidth > 300 && document.querySelector('#app .rz-s .sv-parts').offsetWidth > 300), 'Service-Ansicht steht in voller Breite (Titel und Text nicht eingequetscht)');
  L.ok(!/Salz|Pfeffer|\d+ g\b|Wareneinsatz|%/.test(s1), 'ohne Mengen, ohne Wareneinsatz; Salz und Pfeffer werden nicht aufgezählt');
  L.ok(await ev(() => [...document.querySelectorAll('#app .rz-s .sv-al li')].map(x => x.textContent).join('|')) === 'AGluten|GMilch/Laktose', 'Allergene ausgeschrieben, nicht nur Buchstaben');
  // unvollständig → nachfragen; sicher Enthaltenes steht trotzdem da
  await L.go(p, 'rezepte/dish_schnitzel_pork/service');
  L.ok(/Allergene Angabe unvollständig – bitte in der Küche nachfragen\. Sicher enthalten: A ?Gluten C ?Ei G ?Milch\/Laktose/.test(await L.txt(p, '#app .rz-s')), 'unvollständig: „bitte in der Küche nachfragen“, dazu was sicher enthalten ist', await L.txt(p, '#app .rz-s .sv-b:last-child'));
  // keine Allergene (bestätigt): eigene Rezeptur aus geprüften Artikeln
  await ev(() => { ['potato', 'onion', 'oil', 'salt'].forEach(id => { const x = P(id); x.alg = ''; x.algNone = true; }); S.cards.push({id:'e_roesti', no:90, name:'Rösti natur', type:'dish', category:'Rösti', yieldG:250, img:'', steps:[{t:'Braten.', img:''}], items:[{ref:'p:potato', qty:300, net:''}, {ref:'p:onion', qty:30, net:''}, {ref:'p:oil', qty:20, net:''}, {ref:'p:salt', qty:3, net:''}]});
    S.menu.push({id:'m_roesti', section:'Rösti', name:'Rösti natur', desc:'Knusprig gebraten', price:9.5, card:'e_roesti', img:'', veg:'vg', top:false, hidden:false, seasons:[], days:[], alg:'', algNone:false, vat:'', order:99}); save(); });
  await L.go(p, 'rezepte/e_roesti/service');
  const s3 = await L.txt(p, '#app .rz-s');
  L.ok(/Rösti · vegan/.test(s3) && /Am Teller Kartoffeln, Zwiebel, Rapsöl Allergene Keine Allergene\. Alle Zutaten sind geprüft\./.test(s3) && /Preis € 9,50/.test(s3), 'vollständig und frei: „Keine Allergene. Alle Zutaten sind geprüft.“; „vegan“ steht im Kopf; neue Rezeptur blendet Salz von selbst aus', s3);
  // Getränk: Menge und beide Größen mit Preis
  await L.go(p, 'rezepte/dk_bier/service');
  const s4 = await L.txt(p, '#app .rz-s');
  L.ok(/Getränke · 0,5 l/.test(s4) && /Märzen vom Fass · 0,3 l € 4,20 Märzen vom Fass · 0,5 l € 5,40/.test(s4) && /Im Glas/.test(s4), 'Getränk: Ausschankmenge und jede Größe mit ihrem Preis', s4);
  // nicht auf der Karte
  await L.go(p, 'rezepte/dish_kaiser/service'); await ev(() => { S.menu.filter(m => m.card === 'dish_kaiser').forEach(m => { m.card = ''; }); save(); render(); });
  L.ok(/^Nicht auf der Karte Kaiserschmarrn/.test(await L.txt(p, '#app .rz-s')) && !/€/.test(await L.txt(p, '#app .rz-s')), 'Rezeptur ohne Eintrag auf der Karte: „Nicht auf der Karte“, kein Preis');
  // ---------- Chef passt an: Zeilen ausblenden, Service-Hinweis ----------
  await L.go(p, 'rezepte/dish_burger/service');
  L.ok(/Am Teller Rindsfaschiertes, Brioche-Bun, Tiroler Speck g\.g\.A\., Cheddar, BBQ-Sauce, Rote Zwiebel, Römersalat, Tomatenchutney Allergene/.test(await L.txt(p, '#app .rz-s')), 'Burger vorher: acht Bestandteile (Salz, Pfeffer nicht)');
  await p.click('#app [data-act="svEdit"]'); await w(200);
  L.ok(await ev(() => [...document.querySelectorAll('#dlgForm [name=show]')].map(x => (x.checked ? '+' : '-') + x.value).join()) === '+p:beef_mince,+p:brioche,+p:speck,+p:cheddar,+p:bbq,+p:red_onion,+p:romaine,+p:chutney,-p:salt,-p:pepper', 'Dialog: jede Zutat mit Schalter; Salz und Pfeffer sind schon aus');
  await p.uncheck('#dlgForm [name=show][value="p:romaine"]', {force:true}); await p.uncheck('#dlgForm [name=show][value="p:chutney"]', {force:true});
  const NOTE = 'Garstufe: medium, auf Wunsch durch. <img src=x onerror="window.__xss=1"> & "Beilage" tauschbar';
  await p.fill('#dlgForm [name=note]', NOTE); await L.dlgOk(p);
  const s5 = await L.txt(p, '#app .rz-s');
  L.ok(/Am Teller Rindsfaschiertes, Brioche-Bun, Tiroler Speck g\.g\.A\., Cheddar, BBQ-Sauce, Rote Zwiebel Allergene/.test(s5) && s5.includes('Service-Hinweis ' + NOTE) && await ev(() => !window.__xss && !document.querySelector('#app .rz-s img[src="x"]')), 'ausgeblendete Zeilen fehlen; Service-Hinweis steht da, Sonderzeichen bleiben Text', s5.slice(-150));
  L.ok(await ev(n => { const c = C('dish_burger'); return c.svNote === n && c.svHide.join() === 'p:romaine,p:chutney,p:salt,p:pepper' && algInfo({card:c.id}).letters.join('') === 'ACGMO'; }, NOTE), 'gespeichert an der Rezeptur (svNote, svHide); Allergene rechnen weiter aus allen Zeilen');
  await L.idle(p); await p.reload(); await L.ready(p);
  L.ok((await L.txt(p, '#app .rz-s')).includes('Service-Hinweis ' + NOTE), 'nach Neuladen noch da');
  // ---------- Service-Liste ----------
  await L.go(p, 'speisekarte/service');
  const sl = await ev(() => { const {rows} = svRows(); return {n:rows.length, dom:document.querySelectorAll('#app .sv-rb').length, tabs:[...document.querySelectorAll('#app .toolbar.tabs [role=tab]')].map(x => x.textContent.replace(/\d+$/, '')).join('|'), nav:NAV.length, on:document.querySelector('.side .nav-i.on, .nav-i.on').textContent.trim(), fact:document.querySelector('#app .sv-fact').textContent, hidden:S.menu.filter(m => m.hidden).length, guest:guestItems(seasonFor(todayStr()) || 'winter', todayStr()).length}; });
  L.ok(sl.tabs === 'Gerichte|Gästekarte|Saison & Aktionen|Service' && sl.nav === 7 && sl.on === 'Speisekarte', 'Service-Liste ist ein Reiter der Speisekarte; weiterhin sieben Bereiche', sl.tabs);
  L.ok(sl.n === sl.dom && sl.n === sl.guest && /Karte von heute, Donnerstag, 12\. November · \d+ Einträge/.test(sl.fact), 'alles, was heute auf der Karte steht (wie die Gästekarte von heute)', [sl.n, sl.guest, sl.fact]);
  // Zeile: Buchstaben, „keine“ oder „nachfragen“; aufklappen zeigt den Block
  const row = n => ev(n => { const r = [...document.querySelectorAll('#app .sv-r')].find(x => x.querySelector('.sv-n b').textContent === n); return r ? r.innerText.replace(/\s+/g, ' ').trim() : null; }, n);
  L.ok(/^Elsässer Speck, Zwiebel, Frühlingszwiebel A G € 13,90$/.test(await row('Elsässer')) && /nachfragen € 20,90$/.test(await row('Wiener Schnitzel · vom Schwein')) && /^Rösti natur Knusprig gebraten · vegan keine € 9,50$/.test(await row('Rösti natur')) && /^Tomatensuppe .* · vegetarisch G H € 6,90$/.test(await row('Tomatensuppe')), 'Zeilen: Buchstaben · „nachfragen“ · „keine“; vegetarisch und vegan stehen dabei', [await row('Wiener Schnitzel · vom Schwein'), await row('Rösti natur')]);
  await p.click('#app .sv-rb >> text=Wadel-Beißer-Burger'); await w(150);
  const open = await L.txt(p, '#app .sv-r.open .sv-d');
  L.ok(/^Am Teller Rindsfaschiertes, .*Rote Zwiebel Allergene A ?Gluten C ?Ei G ?Milch\/Laktose M ?Senf O ?Sulfite Service-Hinweis Garstufe: medium/.test(open) && /Rezept für die Küche$/.test(open) && await ev(() => document.querySelectorAll('#app .sv-r.open').length === 1 && !window.__xss), 'ein Tipp klappt auf: Teller, Allergene mit Namen, Service-Hinweis, Weg zum Küchen-Rezept', open.slice(0, 120));
  // Gericht ohne Rezeptur: von Hand eingetragene Angaben gelten
  await ev(() => { const m = S.menu.find(x => x.name === 'Affogato'); m.alg = 'G'; m.algAt = '2026-11-01'; m.algBy = 'Chef'; const k = S.menu.find(x => x.name === 'Crème brûlée'); k.alg = ''; k.algNone = true; k.algAt = '2026-11-02'; k.algBy = 'Chef'; save(); render(); });
  L.ok(/G € 5,90$/.test(await row('Affogato')) && /keine € 9,50$/.test(await row('Crème brûlée')), 'ohne Rezeptur: Angaben von Hand zählen (G bzw. keine)');
  // ---------- Filter „ohne …“ ----------
  await ev(() => { C('e_roesti').items.push({ref:'p:fries', qty:50, net:''}); save(); render(); });   // Pommes TK: Allergene im Beispiel bewusst nicht gepflegt → Rösti ist jetzt unvollständig, ohne dass Gluten bekannt wäre
  const calc = await ev(() => { const {rows} = svRows(); const st = a => ({ok:rows.filter(r => r.ai.state !== 'open' && !r.ai.letters.includes(a)).map(r => r.name), has:rows.filter(r => r.ai.letters.includes(a)).length, left:rows.filter(r => r.ai.state === 'open' && !r.ai.letters.includes(a)).length, n:rows.length}); return {A:st('A'), G:st('G')}; });
  await p.selectOption('#app [data-svf]', 'A'); await w(150);
  const fa = await ev(() => ({names:[...document.querySelectorAll('#app .sv-rb .sv-n b')].map(x => x.textContent), fact:document.querySelector('#app .sv-fact').textContent, opt:document.querySelector('#app [data-svf] option:checked').textContent}));
  L.ok(fa.opt === 'ohne Gluten' && fa.names.join('|') === calc.A.ok.join('|') && !fa.names.includes('Rösti natur') && fa.names.includes('Tomatensuppe') && !fa.names.includes('Elsässer') && !fa.names.includes('Wiener Schnitzel · vom Schwein') && !fa.names.includes('Gärtnerin'), '„ohne Gluten“: nur Gerichte mit vollständiger Angabe ohne A; unvollständige (Rösti mit Pommes, Schnitzel, Gärtnerin) fehlen', fa.names.length);
  L.ok(calc.A.ok.length + calc.A.has + calc.A.left === calc.A.n && fa.fact === `Ohne Gluten: ${calc.A.ok.length} Gerichte. ${calc.A.left} weitere fehlen in dieser Liste, weil die Allergenangabe unvollständig ist: bitte in der Küche nachfragen.`, 'die Zeile darüber nennt, wie viele wegen unvollständiger Angabe fehlen (Summe geht auf)', fa.fact);
  // vollständige Angabe herstellen → rückt nach; enthält Gluten → bleibt draußen
  await ev(() => { ['fries', 'cranberry', 'applesauce'].forEach(id => { P(id).algNone = true; }); save(); render(); });
  const fb = await ev(() => ({names:[...document.querySelectorAll('#app .sv-rb .sv-n b')].map(x => x.textContent), fact:document.querySelector('#app .sv-fact').textContent}));
  L.ok(fb.names.includes('Rösti natur') && fb.names.length === fa.names.length + 1 && fb.fact.includes(`Ohne Gluten: ${calc.A.ok.length + 1} Gerichte. ${calc.A.left - 1} weitere fehlen`) && !fb.names.includes('Wiener Schnitzel · vom Schwein'), 'Pommes als „keine Allergene“ bestätigt: die Rösti rückt in die Liste, die Zahl der Fehlenden sinkt um eins; das Schnitzel ist jetzt vollständig, enthält aber Gluten und bleibt draußen', fb.fact);
  await p.selectOption('#app [data-svf]', 'G'); await w(150);
  L.ok(await ev(() => { const n = [...document.querySelectorAll('#app .sv-rb .sv-n b')].map(x => x.textContent); return n.includes('Gulaschsuppe') && n.includes('Rösti natur') && !n.includes('Tomatensuppe') && !n.includes('Affogato') && n.includes('Crème brûlée'); }), '„ohne Milch/Laktose“: Gulaschsuppe und Crème brûlée (von Hand „keine“) ja, Tomatensuppe und Affogato nein');
  // Suche: auch nach Zutat
  await p.selectOption('#app [data-svf]', ''); await p.fill('#svq', 'speck'); await w(200);
  L.ok(await ev(() => { const n = [...document.querySelectorAll('#app .sv-rb .sv-n b')].map(x => x.textContent); return n.includes('Elsässer') && n.includes('Wadel-Beißer-Burger') && !n.includes('Tomatensuppe') && document.activeElement.id === 'svq'; }), 'Suche findet auch über die Zutat (Speck im Burger); das Feld behält den Cursor');
  await p.fill('#svq', 'xyzq'); await w(150); L.ok(/Kein Gericht passt/.test(await L.txt(p, '#app .panel.empty')), 'nichts gefunden: ein ruhiger Satz');
  await p.fill('#svq', ''); await w(100);
  // ausgeblendetes Gericht und Ruhetag-Gericht stehen nicht in der Liste
  await ev(() => { S.menu.find(m => m.name === 'Elsässer').hidden = true; save(); render(); });
  L.ok(await row('Elsässer') === null, 'von der Karte genommen: nicht mehr in der Service-Liste');
  // ---------- Rezepte → Service ----------
  await L.go(p, 'rezepte'); await p.click('#app .rz-sw [data-id="service"]'); await w(150);
  L.ok(await ev(() => { const t = document.querySelector('#app .lt-wrap').innerText; return /Allergene/i.test(t) && !/Wareneinsatz/i.test(t) && document.querySelectorAll('#app table.lt tbody tr').length === S.cards.filter(c => c.type !== 'semi').length && /nicht auf der Karte/i.test(t.replace(/\s+/g, ' ')); }), 'Rezepte, Schalter „Service“: Gerichte und Getränke mit Allergenen und Kartenpreis, keine Basisrezepte');
  await p.click('#app [data-act="svGo"]'); await w(200);
  L.ok(await ev(() => location.hash) === '#speisekarte/service', 'von dort ein Link zur Service-Liste');
  // ---------- Team ----------
  await L.team(p); await L.go(p, 'rezepte/dish_burger/service'); await w(150);
  const tm = await ev(() => ({s:!!document.querySelector('#app .rz-s'), edit:!!document.querySelector('#app [data-act="svEdit"]'), ro:!!document.querySelector('#app .ro-note'), t:document.querySelector('#app .rz-s').innerText}));
  L.ok(tm.s && !tm.edit && !tm.ro && /€\s20,50/.test(tm.t) && !/Wareneinsatz/.test(tm.t), 'Team sieht die Service-Ansicht mit Kartenpreis; „Anpassen“ gibt es nur für den Chef');
  L.ok(await ev(() => { svEditDlg('dish_burger'); return !document.querySelector('#dlg').open; }) && /nur der Chef/.test(await L.toast(p)), 'Team kann den Dialog auch nicht anders öffnen');
  await L.go(p, 'speisekarte/service'); await p.click('#app .sv-rb >> text=Wadel-Beißer-Burger'); await w(150); await p.click('#app [data-act="svKueche"]'); await w(200);
  L.ok(await ev(() => location.hash === '#rezepte/dish_burger' && !!document.querySelector('#app .rz-k')), 'Team: von der Service-Liste zum Küchen-Rezept');
  // Schnellsuche kennt die Liste
  L.ok(await ev(() => palData().some(x => x.n === 'Service-Liste')), 'Schnellsuche: „Service-Liste“');
  await L.done(b, p.errs); })();
