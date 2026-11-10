// Allergene: drei Zustände je Artikel, Gericht aus der Rezeptur (auch durch Basisrezepte), von Hand am Gericht, Zeichen ° und Satz auf den Gästekarten, Allergen-Blatt als PDF.
const L = require('./lib'); const fs = require('fs');
const pdfPages = f => (fs.readFileSync(f, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  // ---------- Beispieldaten: bestätigte Werte dort, wo sie bekannt waren ----------
  const d0 = await p.evaluate(() => ({st:Object.fromEntries(['pork', 'flour', 'salt', 'fries', 'cranberry', 'applesauce', 'pickles', 'water', 'mineral', 'bier'].map(id => [id, prodAlgState(P(id))])), open:noAlgProducts().map(x => x.id).sort().join(), none:S.products.filter(x => prodAlgState(x) === 'none').length, has:S.products.filter(x => prodAlgState(x) === 'has').length}));
  L.ok(d0.st.pork === 'none' && d0.st.salt === 'none' && d0.st.water === 'none' && d0.st.mineral === 'none' && d0.st.flour === 'has' && d0.st.pickles === 'has' && d0.st.bier === 'has', 'Beispiel-Artikel: Fleisch, Salz, Wasser = „keine Allergene“ (bestätigt); Mehl, Pickles, Bier = enthält', d0.st);
  L.ok(d0.open === 'applesauce,cranberry,fries' && d0.none + d0.has + 3 === await p.evaluate(() => S.products.length), 'drei fertige Zukaufartikel bleiben bewusst „nicht gepflegt“: Pommes TK, Preiselbeeren, Apfelmus', d0.open);
  // ---------- Gericht aus der Rezeptur, auch durch Basisrezepte ----------
  const g0 = await p.evaluate(() => { const f = id => { const m = S.menu.find(x => x.card === id); const i = algInfo(m); return {state:i.state, src:i.src, letters:i.letters.join(''), open:i.open.map(x => x.name).join(), has:hasAlg(m)}; }; return {sch:f('dish_schnitzel_pork'), kai:f('dish_kaiser'), gul:f('dish_goulash'), str:f('dish_strudel'), cae:f('dish_caesar'), els:f('dish_elsasser')}; });
  L.ok(g0.sch.state === 'open' && g0.sch.letters === 'ACG' && g0.sch.open === 'Pommes frites TK,Preiselbeeren' && !g0.sch.has, 'Schnitzel: bekannte Allergene A C G, aber unvollständig (Pommes, Preiselbeeren nicht gepflegt)', g0.sch);
  L.ok(g0.kai.state === 'open' && g0.kai.open === 'Apfelmus' && g0.gul.state === 'has' && g0.gul.letters === 'A' && g0.str.state === 'has' && g0.str.letters === 'AGO' && g0.cae.letters === 'ACGM' && g0.els.letters === 'AG', 'Gulaschsuppe, Apfelstrudel, Caesar, Elsässer: vollständig aus der Rezeptur (durch die Basisrezepte hindurch)', [g0.gul, g0.str, g0.cae.letters]);
  // Tiefe: ein Artikel in einem Basisrezept im Basisrezept wird „nicht gepflegt“ → das Gericht ganz oben ist unvollständig
  const rec = await p.evaluate(() => { const m = S.menu.find(x => x.card === 'dish_strudel'); const sugar = P('sugar'); const a0 = algInfo(m).state;
    S.cards.push({id:'semi_x', no:99, name:'Zuckersirup', type:'semi', category:'Basisrezepte', yieldG:1000, img:'', steps:[], items:[{ref:'p:sugar', qty:500, net:''}, {ref:'p:water', qty:500, net:''}]});
    C('semi_strudel').items.push({ref:'c:semi_x', qty:50, net:''}); const a1 = algInfo(m);
    sugar.algNone = false; const a2 = algInfo(m);      // Zucker: nicht mehr bestätigt
    sugar.alg = 'O'; const a3 = algInfo(m);            // Zucker enthält jetzt Sulfite
    sugar.alg = ''; sugar.algNone = true; const a4 = algInfo(m);
    C('semi_x').items.push({ref:'', qty:'', net:''}); const a5 = algInfo(m);   // Zeile ohne Zutat
    C('semi_x').items.pop(); C('semi_x').items = []; const a6 = algInfo(m);   // Basisrezept ohne Zutaten
    C('semi_strudel').items.pop(); S.cards = S.cards.filter(c => c.id !== 'semi_x'); const a7 = algInfo(m).state;
    return {a0, a1:a1.state, a2:[a2.state, a2.open.map(x => x.name).join()], a3:[a3.state, a3.letters.join('')], a4:a4.state, a5:[a5.state, a5.gaps.join()], a6:[a6.state, a6.gaps.join()], a7}; });
  L.ok(rec.a0 === 'has' && rec.a1 === 'has' && rec.a2.join('|') === 'open|Kristallzucker' && rec.a3.join('|') === 'has|AGO' && rec.a4 === 'has' && rec.a7 === 'has', 'drei Ebenen tief: wird Zucker im Sirup im Strudel-Blech „nicht gepflegt“, ist der Apfelstrudel unvollständig; mit Angabe wieder vollständig', rec);
  L.ok(rec.a5[0] === 'open' && /eine Zutat in „Zuckersirup“ ist nicht gewählt/.test(rec.a5[1]) && rec.a6[0] === 'open' && /„Zuckersirup“ hat keine Zutaten/.test(rec.a6[1]), 'auch eine leere Zeile oder ein leeres Basisrezept macht das Gericht unvollständig', [rec.a5, rec.a6]);
  // ---------- eine Zählung für alle Stellen ----------
  const cnt = await p.evaluate(() => { const own = S.menu.filter(m => { const c = m.card && C(m.card); if(!c) return !(algList(m.alg).length || m.algNone); const walk = (x, d) => !x || d > 6 || !x.items.length || x.items.some(it => { const r = refObj(it.ref); if(!r) return true; return r.t === 'p' ? !(algList(r.o.alg).length || r.o.algNone === true) : walk(r.o, d + 1); }); return walk(c, 0); }).length;
    const s = stations().find(x => x.k === 'menu'); return {own, fn:noAlgCount(), list:noAlgList().length, einr:s.total - s.done, metric:s.metric}; });
  await L.go(p, 'heute'); const dash = await p.evaluate(() => { const r = [...document.querySelectorAll('#app .rw')].find(x => /ohne Allergenangabe/.test(x.textContent)); return r ? +r.querySelector('.rw-lead').textContent.trim() : null; });
  await L.go(p, 'speisekarte'); const chip = await p.evaluate(() => +document.querySelector('#app [data-act="sec"][data-id="noalg"] small').textContent);
  L.ok(cnt.own === cnt.fn && cnt.fn === cnt.list && cnt.fn === cnt.einr && cnt.fn === dash && cnt.fn === chip && cnt.fn === 57 && /15 von 72 Gerichten mit vollständiger Allergenangabe/.test(cnt.metric), 'Heute, Filter der Speisekarte, Einrichtung und die Funktion zählen gleich: 57 offen (unabhängig nachgerechnet)', {...cnt, dash, chip});
  await p.click('#app [data-act="sec"][data-id="noalg"]'); await p.waitForTimeout(250);
  const tip = await p.evaluate(() => { const m = S.menu.find(x => x.card === 'dish_schnitzel_pork'); const tr = document.querySelector(`#app tr[data-mid="${m.id}"]`); return tr ? tr.querySelector('.lt-st .open').title : null; });
  L.ok(/Allergene unvollständig: 2 Artikel ohne Angabe: Pommes frites TK, Preiselbeeren/.test(tip), 'Speisekarte: das Zeichen „Allergene“ sagt, woran es liegt', tip);

  // ---------- Artikel: Auswahl mit drei Zuständen ----------
  await L.go(p, 'ware/preise');
  const pl = await p.evaluate(() => ({fact:document.querySelector('#app .fact').textContent, seg:[...document.querySelectorAll('#app [data-act="pFilter"]')].map(x => x.textContent).join('|')}));
  L.ok(/3 ohne Allergenangabe/.test(pl.fact) && /Allergene offen3/.test(pl.seg), 'Preisliste: eine Zeile oben nennt „3 ohne Allergenangabe“, dazu der Filter', pl);
  await p.click('#app .fact [data-act="pFilter"]'); await p.waitForTimeout(250);
  const fl = await p.evaluate(() => [...document.querySelectorAll('#app table.lt tbody tr.row')].map(tr => tr.querySelector('b').textContent + ':' + tr.querySelector('.alg-st').textContent.trim()));
  L.ok(fl.join('|') === 'Apfelmus:nicht gepflegt|Pommes frites TK:nicht gepflegt|Preiselbeeren:nicht gepflegt', 'Filter zeigt die drei Artikel, jeder mit „nicht gepflegt“ als Knopf', fl);
  await p.click('#app tr[data-id="fries"] .alg-st'); await p.waitForTimeout(300);
  const dlg = await p.evaluate(() => ({title:document.querySelector('#dlgForm h3').textContent, radios:[...document.querySelectorAll('#dlgForm input[name="algState"]')].map(r => r.value + (r.checked ? '*' : '')).join(), lettersHidden:document.querySelector('#dlgForm .alg3-l').hidden, n:document.querySelectorAll('#dlgForm .alg3-l input').length, txt:document.querySelector('#dlgForm').textContent}));
  L.ok(dlg.title === 'Allergene · Pommes frites TK' && dlg.radios === 'has,none,open*' && dlg.lettersHidden && dlg.n === 14 && /enthält …/.test(dlg.txt) && /keine Allergene/.test(dlg.txt) && /noch nicht geprüft/.test(dlg.txt), 'Dialog: enthält … / keine Allergene / noch nicht geprüft; die 14 Buchstaben erst bei „enthält“', dlg);
  await p.click('#dlgForm input[name="algState"][value="has"] + span'); await p.waitForTimeout(100); await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(200);
  L.ok(await p.evaluate(() => document.querySelector('#dlg').open && /mindestens ein Allergen wählen/.test(document.querySelector('#dlgForm .f-err').textContent)), '„enthält“ ohne Buchstaben wird nicht gespeichert, der Hinweis steht am Feld');
  await p.click('#dlgForm input[name="algState"][value="none"] + span'); await p.waitForTimeout(100); await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(350);
  L.ok(await p.evaluate(() => P('fries').algNone === true && P('fries').alg === '' && prodAlgState(P('fries')) === 'none' && !document.querySelector('#app tr[data-id="fries"]')) && /Pommes frites TK: keine Allergene/.test(await L.toast(p)), '„keine Allergene“: bestätigt gespeichert, der Artikel verlässt den Filter', await L.toast(p));
  await p.click('#app tr[data-id="cranberry"] .alg-st'); await p.waitForTimeout(250); await p.click('#dlgForm input[name="algState"][value="has"] + span'); await p.click('#dlgForm .alg3-l input[value="O"] + span'); await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(350);
  const g1 = await p.evaluate(() => { const i = algInfo(S.menu.find(x => x.card === 'dish_schnitzel_pork')); return {state:i.state, letters:i.letters.join(''), cr:[P('cranberry').alg, P('cranberry').algNone]}; });
  L.ok(g1.state === 'has' && g1.letters === 'ACGO' && g1.cr.join() === 'O,false', 'Preiselbeeren „enthält O“: das Schnitzel ist jetzt vollständig, mit A C G O', g1);
  // Artikel-Dialog: derselbe Baustein, zurück auf „nicht geprüft“
  await p.evaluate(() => prodDialog(P('fries'))); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => document.querySelector('#dlgForm input[name="algState"]:checked').value === 'none' && document.querySelector('#dlgForm h3').textContent === 'Artikel bearbeiten'), 'Artikel-Dialog zeigt denselben Baustein mit „keine Allergene“');
  await p.click('#dlgForm input[name="algState"][value="open"] + span'); await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => prodAlgState(P('fries')) === 'open' && P('fries').algNone === false && algInfo(S.menu.find(x => x.card === 'dish_schnitzel_pork')).state === 'open'), 'zurück auf „noch nicht geprüft“: das Schnitzel ist wieder unvollständig');
  // Liste: breite Ansicht zeigt alle drei Zustände
  L.ok(await p.evaluate(() => { view.pf = 'noalg'; view.pcols = false; render(); const u = document.querySelector('#app tr[data-id="fries"] .alg-under'); return !!u && /Allergene: nicht gepflegt/.test(u.textContent); }), 'im Filter steht der Zustand direkt unter dem Namen (auch am Handy sichtbar)');
  await p.evaluate(() => { view.pf = 'all'; view.pcols = true; render(); });
  const cells = await p.evaluate(() => ['flour', 'pork', 'fries'].map(id => { const b = document.querySelector(`#app tr[data-id="${id}"] .alg-st`); return b.className.replace('alg-st ', '') + ':' + b.textContent.trim(); }));
  L.ok(cells.join('|') === 'has:A|none:keine|open:nicht gepflegt', 'Liste: Buchstaben · „keine“ · „nicht gepflegt“ sind drei verschiedene Anzeigen', cells);
  // Rezeptseite
  await p.evaluate(() => go('cards', 'dish_schnitzel_pork')); await p.waitForTimeout(300);
  const rc = await p.evaluate(() => { const sec = [...document.querySelectorAll('#app section.panel')].find(s => /^Allergene/.test(s.querySelector('h2') ? s.querySelector('h2').textContent : '')); return sec.innerText.replace(/\s+/g, ' '); });
  L.ok(/A Gluten C Ei G Milch\/Laktose O Sulfite Allergene unvollständig\. Bei 1 Artikel fehlt die Angabe: Pommes frites TK\./.test(rc), 'Rezeptseite: bekannte Allergene und „Allergene unvollständig“ mit dem Artikel, der fehlt', rc);
  await p.evaluate(() => go('cards', 'dish_goulash')); await p.waitForTimeout(250);
  L.ok(!/unvollständig/.test(await p.evaluate(() => document.querySelector('#app').innerText)), 'vollständige Rezeptur: kein Hinweis');

  // ---------- von Hand am Gericht (ohne Rezeptur), mit Prüfvermerk ----------
  const mid = await p.evaluate(() => S.menu.find(m => !m.card && !algList(m.alg).length && !m.hidden && m.section === 'Suppen & Vorspeisen').id);
  await p.evaluate(id => menuDialog(S.menu.find(m => m.id === id)), mid); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => document.querySelector('#dlgForm .alg-det').open && document.querySelector('#dlgForm input[name="algState"]:checked').value === 'open' && /Ohne Rezeptur gilt, was Sie hier eintragen/.test(document.querySelector('#dlgForm .alg3-n').textContent)), 'Gericht ohne Rezeptur: der Abschnitt „Allergene von Hand“ ist offen, Stand „noch nicht geprüft“');
  await p.click('#dlgForm input[name="algState"][value="has"] + span'); await p.click('#dlgForm .alg3-l input[value="A"] + span'); await p.click('#dlgForm .alg3-l input[value="G"] + span'); await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(350);
  const mh = await p.evaluate(id => { const m = S.menu.find(x => x.id === id); const i = algInfo(m); return {alg:m.alg, at:m.algAt === todayStr(), by:m.algBy, state:i.state, src:i.src, stamp:algStampText(m), name:m.name}; }, mid);
  L.ok(mh.alg === 'A G' && mh.at && mh.by === 'Chef' && mh.state === 'has' && mh.src === 'manual' && /^geprüft am \d\d\.\d\d\.\d{4} von Chef$/.test(mh.stamp), 'von Hand: A G gespeichert mit „geprüft am … von Chef“', mh);
  await p.evaluate(id => menuDialog(S.menu.find(m => m.id === id)), mid); await p.waitForTimeout(250);
  L.ok(/geprüft am \d\d\.\d\d\.\d{4} von Chef/.test(await p.evaluate(() => document.querySelector('#dlgForm .alg3-n').textContent)), 'der Vermerk steht beim nächsten Öffnen im Dialog');
  await p.click('#dlgForm input[name="algState"][value="none"] + span'); await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(id => { const m = S.menu.find(x => x.id === id); return m.alg === '' && m.algNone === true && algInfo(m).state === 'none' && hasAlg(m); }, mid), '„keine Allergene“ von Hand: gilt als gepflegt');
  // mit Rezeptur zählt nur die Rezeptur
  L.ok(await p.evaluate(() => { const m = S.menu.find(x => x.card === 'dish_schnitzel_pork'); m.alg = 'A'; m.algNone = false; const i = algInfo(m); m.alg = ''; return i.src === 'recipe' && i.state === 'open'; }), 'mit Rezeptur zählt die Rezeptur: eine Angabe von Hand überdeckt eine unvollständige Rezeptur nicht');

  // ---------- Gästekarten ----------
  await p.evaluate(() => { P('fries').algNone = true; P('cranberry').alg = 'O'; save(); });   // Schnitzel vollständig, Kaiserschmarrn (Apfelmus) bleibt offen
  await L.go(p, 'speisekarte/gaestekarte'); await p.waitForTimeout(900);
  const gk = await p.evaluate(() => { const k = curSeasonKey(), d = view.gdate || todayStr(); const items = guestItems(k, d); const open = items.filter(m => !hasAlg(m)); const pages = hsPages(k, d).join(''); const doc = new DOMParser().parseFromString('<div>' + pages + '</div>', 'text/html');
    const find = n => [...doc.querySelectorAll('.hs-d,.hs-feat,.hs-tr,.hs-kd,.hs-plate')].find(x => x.textContent.includes(n));
    const kai = find('Kaiserschmarrn'), sch = find('Wiener Schnitzel'), gul = find('Gulaschsuppe'), an = find(open.find(m => !m.card).name);
    return {nOpen:open.length, miss:(document.querySelector('#algMiss') || {textContent:''}).textContent.replace(/\s+/g, ' '), kai:kai && (kai.querySelector('.hs-al') || {textContent:''}).textContent, sch:sch && (sch.querySelector('.hs-al') || {textContent:''}).textContent, gul:gul && (gul.querySelector('.hs-al') || {textContent:''}).textContent, an:an && (an.querySelector('.hs-al') || {textContent:''}).textContent,
      leg:(doc.querySelector('.hs-back .alg-open') || {textContent:''}).textContent, legKeys:[...doc.querySelectorAll('.hs-back .lg b')].map(x => x.textContent).join(''), foot:[...doc.querySelectorAll('.hs-back .fnote')].pop().textContent, everyDish:[...doc.querySelectorAll('.hs-d,.hs-tr,.hs-kd')].filter(x => !x.querySelector('.hs-al')).map(x => (x.querySelector('.hs-n,.n,.kn') || x).textContent).filter(t => !items.some(m => algInfo(m).state === 'none' && t.includes(m.name))).length, noneN:items.filter(m => algInfo(m).state === 'none').length}; });
  L.ok(gk.kai === 'A C G O °' && gk.sch === 'A C G O' && gk.gul === 'A' && gk.an === '°', 'Hauskarte: unvollständig = bekannte Buchstaben und °; ohne jede Angabe nur °; vollständig ohne Zeichen', [gk.kai, gk.sch, gk.gul, gk.an]);
  L.ok(gk.everyDish === 0 && gk.noneN === 1, 'ohne Buchstaben und ohne ° steht nur das eine Gericht mit bestätigtem „keine Allergene“: nichts sieht aus wie „allergenfrei“, solange es nicht gepflegt ist', [gk.everyDish, gk.noneN]);
  L.ok(gk.leg === 'Bei Gerichten mit ° fragen Sie bitte unser Team – Angaben werden ergänzt.' && !gk.legKeys.includes('°') && /inkl\. MwSt\./.test(gk.foot), 'Legende auf der letzten Seite: der Satz zu °; die Fußzeile bleibt „inkl. MwSt.“', [gk.leg, gk.legKeys]);
  L.ok(new RegExp('^' + cntTxt(await p.evaluate(() => noAlgCount())) + ' ohne vollständige Allergenangabe, ' + gk.nOpen + ' davon auf dieser Karte').test(gk.miss) && /In Karte und PDF stehen sie mit °/.test(gk.miss) && /Liste zeigen/.test(gk.miss), 'vor dem PDF: eine Zeile nennt die Zahl und führt zur Liste (nichts wird gesperrt)', gk.miss);
  function cntTxt(n){ return n + ' Gerichte'; }
  // Wortlaut ändern (Texte)
  L.ok(await p.evaluate(() => { const i = document.querySelector('#app .hs-copy input[data-hsc="algOpen"]'); return !!i && i.value === ALG_OPEN_TXT && document.querySelectorAll('#app input[data-hsc="algOpen"]').length === 1; }), 'Texte-Feld der Hauskarte: der Satz ist dort änderbar (einmal, nicht doppelt)');
  await p.fill('#app .hs-copy input[data-hsc="algOpen"]', 'Mit ° markiert: Bitte fragen Sie im Service nach.'); await p.waitForTimeout(600);
  L.ok(await p.evaluate(() => S.settings.menuCopy.algOpen === 'Mit ° markiert: Bitte fragen Sie im Service nach.' && /Mit ° markiert: Bitte fragen Sie im Service nach\./.test(hsPages(curSeasonKey(), view.gdate).join(''))), 'geänderter Wortlaut steht in der Karte');
  await p.fill('#app .hs-copy input[data-hsc="algOpen"]', ''); await p.waitForTimeout(600);
  L.ok(await p.evaluate(() => hsPages(curSeasonKey(), view.gdate).join('').includes(ALG_OPEN_TXT)), 'leeres Feld: der Standardsatz gilt (das Zeichen bleibt nie ohne Erklärung)');
  await p.click('#app [data-act="algMiss"], #algMiss [data-act="goMenu"]'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => view.tab === 'menu' && view.sec === 'noalg' && document.querySelectorAll('#app table.lt-menu tbody tr.row').length === noAlgCount()), '„Liste zeigen“ öffnet die Speisekarte mit dem Filter „Allergene offen“');
  // Stil „Schlicht“
  await p.evaluate(() => { S.settings.guestStyle = 'schlicht'; save(); view.mtab = 'guest'; go('menu'); }); await p.waitForTimeout(500);
  const wk = await p.evaluate(() => { const find = n => [...document.querySelectorAll('#app .wk-dish')].find(x => x.querySelector('.wk-n').textContent.includes(n)); const a = n => { const x = find(n); return x ? (x.querySelector('.wk-a') || {textContent:'(nichts)'}).textContent : null; };
    const open = guestItems(curSeasonKey(), view.gdate).find(m => !m.card && !hasAlg(m) && !m.group); return {kai:a('Kaiserschmarrn'), gul:a('Gulaschsuppe'), an:a(open.name), leg:(document.querySelector('#app .wk-open') || {textContent:''}).textContent, legKeys:[...document.querySelectorAll('#app .wk-leg b')].map(x => x.textContent).join(''), none:[...document.querySelectorAll('#app .wk-dish')].filter(x => !x.querySelector('.wk-a')).filter(x => !guestItems(curSeasonKey(), view.gdate).some(m => algInfo(m).state === 'none' && x.querySelector('.wk-n').textContent.includes(m.name))).length, field:!!document.querySelector('#app [data-algopen] input[data-hsc="algOpen"]'), foot:document.querySelector('#app .wk-foot p:last-child').textContent}; });
  L.ok(wk.kai === 'Allergene A C G O °' && wk.gul === 'Allergene A' && wk.an === 'Allergene °' && wk.none === 0, 'Schlicht: „Allergene A C G O °“ / „Allergene °“; ohne Zeile nur das bestätigte „keine“', wk);
  L.ok(wk.leg === ALG_OPEN_TXT_() && !wk.legKeys.includes('°') && wk.field && /inkl\. MwSt\./.test(wk.foot), 'Schlicht: Satz in der Legende, Feld für den Wortlaut bei der Fußzeile, „inkl. MwSt.“ bleibt');
  function ALG_OPEN_TXT_(){ return 'Bei Gerichten mit ° fragen Sie bitte unser Team – Angaben werden ergänzt.'; }
  // Tageskarte (Aktion): Zeile ohne Rezeptur und ohne Angabe; „keine“ gilt als Angabe
  const tk = await p.evaluate(() => { const sp = {id:'sp_t', name:'Testkarte', from:todayStr(), to:todayStr(), mode:'tageskarte', style:'', note:'', items:[{name:'Suppe des Tages', desc:'', price:6, veg:'', card:'', alg:''}, {name:'Obstsalat', desc:'', price:5, veg:'vg', card:'', alg:'keine'}, {name:'Gulasch', desc:'', price:9, veg:'', card:'dish_goulash', alg:''}]}; const h = tageskarteHtml(sp); const doc = new DOMParser().parseFromString(h, 'text/html'); const a = n => { const x = [...doc.querySelectorAll('.hk-dish')].find(y => y.textContent.includes(n)); return (x.querySelector('.hk-alg') || {textContent:'(nichts)'}).textContent; }; return {s:a('Suppe des Tages'), o:a('Obstsalat'), g:a('Gulasch'), leg:(doc.querySelector('.hk-open') || {textContent:''}).textContent}; });
  L.ok(tk.s === '°' && tk.o === '(nichts)' && tk.g === 'A' && tk.leg === ALG_OPEN_TXT_(), 'Tageskarte: offene Zeile mit °, „keine“ ist eine Angabe, Legende mit dem Satz', tk);

  // ---------- Allergen-Blatt ----------
  await p.evaluate(() => { S.settings.guestStyle = 'haus'; save(); view.mtab = 'guest'; go('menu'); }); await p.waitForTimeout(700);
  L.ok(await p.evaluate(() => !!document.querySelector('#app .guest-tools [data-act="algSheet"]') && /Allergen-Blatt als PDF/.test(document.querySelector('#app [data-act="algSheet"]').textContent)), 'Gästekarte: „Allergen-Blatt als PDF“');
  await p.click('#app [data-act="algSheet"]'); await p.waitForTimeout(500);
  const ab = await p.evaluate(() => { const r = abPages(); const doc = new DOMParser().parseFromString('<div>' + r.pages.join('') + '</div>', 'text/html'); const pages = [...doc.querySelectorAll('.ab-page')];
    const items = guestItems(curSeasonKey(), view.gdate || todayStr()); const spItems = specialsFor(view.gdate || todayStr()).flatMap(sp => sp.items); const rows = [...doc.querySelectorAll('.ab-t tbody tr:not(.ab-sec)')]; const row = n => rows.find(x => x.querySelector('.ab-n').textContent.replace(' °', '').trim() === n);
    const cells = n => { const x = row(n); return x ? [...x.querySelectorAll('.ab-c')].map((c, i) => c.textContent ? r.cols[i] : '').join('') + '|' + x.querySelector('.ab-s').textContent + '|' + (x.classList.contains('ab-open') ? 'open' : '') : null; };
    const usedOwn = Object.keys(ALG).filter(a => items.concat(spItems).some(m => itemAlg(m).includes(a)));
    return {n:pages.length, dlg:document.querySelector('#dlgForm').innerText.replace(/\s+/g, ' ').slice(0, 220), sheets:document.querySelectorAll('#dlgForm .ab-sheet').length, nRows:rows.length, nItems:items.length + spItems.length, nSp:spItems.length, cols:r.cols.join(''), usedOwn:usedOwn.join(''), heads:pages.map(pg => [!!pg.querySelector('.ab-h h1'), pg.querySelectorAll('.ab-t thead th').length, pg.querySelector('.ab-pn').textContent, !!pg.querySelector('.ab-leg')].join(':')), meta:pages[0].querySelector('.ab-meta').innerText || pages[0].querySelector('.ab-meta').textContent,
      secs:[...doc.querySelectorAll('.ab-sec')].map(x => x.textContent), secOrder:secList().filter(s => items.some(m => m.section === s)), gul:cells('Gulaschsuppe'), kai:cells('Kaiserschmarrn'), sch:cells('Wiener Schnitzel · vom Schwein'), fits:null, lastSecAlone:pages.some(pg => { const trs = [...pg.querySelectorAll('.ab-t tbody tr')]; return trs.length && trs[trs.length - 1].classList.contains('ab-sec'); }), nOpen:r.nOpen}; });
  L.ok(/Allergen-Blatt für den Service/.test(ab.dlg) && new RegExp(ab.nItems + ' Gerichte der Karte vom .* auf ' + ab.n + ' Blättern A4').test(ab.dlg) && /mit unvollständiger Angabe, im Blatt mit ° markiert/.test(ab.dlg) && ab.sheets === ab.n, 'Dialog: Zahl der Gerichte und Blätter, Zahl der offenen, Vorschau aller Blätter', ab.dlg);
  L.ok(ab.nRows === ab.nItems && ab.cols === ab.usedOwn && ab.cols.length >= 6 && ab.cols.length < 14, 'Matrix: jedes Gericht der Karte (und der laufenden Aktion) eine Zeile; Spalten = nur die verwendeten Buchstaben', [ab.nRows, ab.cols]);
  L.ok(ab.secs.filter(x => !/^AKTION/.test(x)).join('|') === ab.secOrder.map(x => x.toLocaleUpperCase('de-AT')).join('|'), 'nach Kategorien der Karte gegliedert, in ihrer Reihenfolge', ab.secs);
  L.ok(ab.gul === 'A|aus Rezeptur|' && ab.sch === 'ACGO|aus Rezeptur|' && ab.kai === 'ACGO|unvollständig|open', 'Zeilen: Punkte bei den Allergenen, Spalte „Stand“ (aus Rezeptur / unvollständig), offene Zeile markiert', [ab.gul, ab.sch, ab.kai]);
  L.ok(ab.n >= 2 && ab.heads.every((h, i) => h === `true:${ab.cols.length + 2}:Blatt ${i + 1} von ${ab.n}:true`) && !ab.lastSecAlone, 'jedes Blatt mit Kopf, Spaltenkopf, Blattnummer und Legende; keine Überschrift allein am Blattende', ab.heads);
  L.ok(/Karte vom \d\d\.\d\d\.\d{4}/.test(ab.meta) && /erstellt am \d\d\.\d\d\.\d{4} von Chef/.test(ab.meta), 'Kopf nennt Datum der Karte, Erstelldatum und „von Chef“', ab.meta.replace(/\s+/g, ' '));
  const fit = await p.evaluate(() => { const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:-9999px;top:0;width:794px'; host.innerHTML = abPages().pages.join(''); document.body.appendChild(host); const r = [...host.querySelectorAll('.ab-page')].map(pg => { const b = pg.querySelector('.ab-body'); const pr = pg.getBoundingClientRect(); const rows = [...pg.querySelectorAll('.ab-t tbody tr')]; const last = rows[rows.length - 1].getBoundingClientRect(); const f = pg.querySelector('.ab-f').getBoundingClientRect(); return {h:Math.round(pr.height), w:Math.round(pr.width), over:b.scrollHeight - b.clientHeight, lastIn:last.bottom <= f.top + 0.5, footIn:f.bottom <= pr.bottom + 0.5, rows:rows.length}; }); host.remove(); return r; });
  L.ok(fit.every(x => x.h === 1123 && x.w === 794 && x.over <= 1 && x.lastIn && x.footIn), 'jedes Blatt ist genau A4 (794 × 1123), keine Zeile läuft über den Rand oder in die Legende', fit);
  await L.shot(p, 'c06-allergenblatt-dialog', {full:false});
  const dl = await L.dl(p, () => p.click('#abPdf')); await p.waitForTimeout(600);
  const size = fs.statSync(dl.file).size; const np = pdfPages(dl.file);
  L.ok(/^Allergen-Blatt-DAHUAM\.202-\d{4}-\d\d-\d\d\.pdf$/.test(dl.name) && size > 40000 && np === ab.n && fs.readFileSync(dl.file).slice(0, 5).toString() === '%PDF-', `echtes PDF: ${dl.name}, ${np} Seiten wie in der Vorschau, ${Math.round(size / 1024)} KB`, {size, np});
  L.ok(/PDF erstellt: Allergen-Blatt.*\(\d Seiten\)/.test(await L.toast(p)) && await p.evaluate(() => !document.querySelector('#print').innerHTML && !document.querySelector('#print').classList.contains('pdf')), 'Meldung mit Seitenzahl; der Druckbereich ist danach wieder leer', await L.toast(p));
  // Speisekarte „Schlicht“ als PDF: mit ° und Legende, Seitenzahl plausibel
  await p.evaluate(() => { S.settings.guestStyle = 'schlicht'; save(); render(); }); await p.waitForTimeout(400);
  let printHtml = ''; await p.exposeFunction('__keepPrint', h => { printHtml = h; });
  await p.evaluate(() => { const _e = exportPdf; exportPdf = function(n){ __keepPrint(document.querySelector('#print').innerHTML); return _e(n); }; });
  const dl2 = await L.dl(p, () => p.click('#app [data-pdf="printMenu"]')); await p.waitForTimeout(500);
  const np2 = pdfPages(dl2.file);
  L.ok(/^Speisekarte-/.test(dl2.name) && np2 >= 2 && np2 <= 8 && fs.statSync(dl2.file).size > 100000, `Speisekarte als PDF: ${np2} Seiten`, [dl2.name, np2]);
  L.ok(/Allergene A C G O °/.test(printHtml) && printHtml.includes('Bei Gerichten mit ° fragen Sie bitte unser Team') && /inkl\. MwSt\./.test(printHtml), 'im PDF-Inhalt: ° am Gericht und der Satz in der Legende; „inkl. MwSt.“ bleibt');
  await L.done(b, p.errs); })();
