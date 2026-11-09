import os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
R = lambda f: open(f, encoding='utf-8').read()
def sub(s, pairs, label):
    for o, n in pairs:
        if o not in s: sys.exit(f'[{label}] not found: {o[:90]}')
        s = s.replace(o, n)
    return s

core = '\n'.join(R('script_de.js').split('\n')[:250])
core = sub(core, [
  ("const num = (n,d=0) => fin(n).toLocaleString('de-AT',{maximumFractionDigits:d});", "const num = (n,d=0) => fin(n).toLocaleString('de-DE',{maximumFractionDigits:d});"),
  ('function seed(){', 'function seedBase(){'),
  ('let S = load() || seed();', 'let S;'),
  ("['beef_mince','Rinderfaschiertes','kg',13,0,25,''],", "['beef_mince','Rindsfaschiertes','kg',13,0,20,''],"),
  ("['speck','Tiroler Speck','kg',16,3,20,''],", "['speck','Tiroler Speck g.g.A.','kg',19.5,5,20,''],"),
  ("['veal','Kalbsoberschale','kg',32,8,15,''],", "['veal','Kalbsoberschale','kg',32,11,15,''],"),
  ("['beef_goulash','Rindswadschinken (Gulasch)','kg',14,8,35,''],", "['beef_goulash','Rindswadschinken (Gulasch)','kg',14,11,35,''],"),
  ("['egg','Ei M','Stk',0.28,12,0,'C',55],", "['egg','Ei M','Stk',0.28,12,0,'C',60],"),
  ("['schmalz','Butterschmalz','kg',9,0,0,'G'],", "['schmalz','Butterschmalz','kg',11,0,0,'G'],"),
  ("['fries','Pommes frites TK','kg',2.2,0,10,''],", "['fries','Pommes frites TK','kg',2.2,0,20,''],"),
  ("['bergkase','Zillertaler Bergkäse','kg',18,3,0,'G'],", "['bergkase','Zillertaler Bergkäse','kg',18,8,0,'G'],"),
  ("['apples','Äpfel','kg',2.2,20,0,''],", "['apples','Äpfel','kg',1.8,28,0,''],"),
  ("['wine','Weißwein trocken','l',6,0,0,'O'],", "['wine','Kochwein weiß, trocken','l',4,0,0,'O'],"),
  ("['oil','Rapsöl','l',2.8,0,0,''],", "['oil','Rapsöl','l',2.2,0,0,''],"),
  ("['raisins','Rosinen','kg',6,0,0,''],", "['raisins','Rosinen (geschwefelt)','kg',6,0,0,'O'],"),
  ("[['pork',180],['flour',20],['egg',1],['crumbs',50],", "[['pork',180],['flour',12],['egg',0.35],['crumbs',35],"),
  ("[['veal',170],['flour',20],['egg',1],['crumbs',50],", "[['veal',170],['flour',12],['egg',0.35],['crumbs',35],"),
  ("['kirsch',10]", "['kirsch',20]"),
  ("[['semi_flammdough',200]", "[['semi_flammdough',150]"),
  ("'Apfelstrudel, Blech für 12 Portionen','semi','Basisrezepte',3600,", "'Apfelstrudel, Blech für 16 Portionen','semi','Basisrezepte',3000,"),
  ("'dish','Desserts',305,\n      [['semi_strudel',300],['icing',5]],", "'dish','Desserts',185,\n      [['semi_strudel',180],['icing',5]],"),
  ("['paprika',60]", "['paprika',80]"),
  ("'Eigelb mit Senf, Knoblauch und Zitronensaft mixen.", "'Pasteurisiertes Eigelb mit Senf, Knoblauch und Zitronensaft mixen."),
  ("Parmesan, Salz und Pfeffer zugeben. Haltbarkeit 48 h", "Parmesan, Salz und Pfeffer zugeben. Haltbarkeit 24 h"),
  ("'Portion Basis auf 85 °C erhitzen.", "'Portion Basis auf Kerntemperatur mindestens 75 °C regenerieren."),
  ("res.cost = c.yieldG ? q * t.cost / c.yieldG : 0;", "{ const y = +c.yieldG || t.out; res.cost = y ? q * t.cost / y : 0; }"),
], 'core')

ui = R('ui2.js')
ui = sub(ui, [
  ("function pickImage(cb){ pickCb = cb; const i = $('#imgFile'); i.value = ''; i.click(); }",
   "function pickImage(cb){ pickCb = cb; const i = $('#imgFile'); const d = $('#dlg'); (d.open ? d : document.body).appendChild(i); i.value = ''; i.click(); }"),
  ("  d.invDraft = null;\n  return d;\n}", "  d.invDraft = null;\n  seasonSeed(d);\n  return d;\n}"),
  ("if(d.invDraft===undefined) d.invDraft = null;\n  return d;", "if(d.invDraft===undefined) d.invDraft = null;\n  seasonMigrate(d);\n  return d;"),
  ("else if(r.o.yieldG) explode(r.o, q/r.o.yieldG, acc, d+1); }", "else { const y = +r.o.yieldG || totals(r.o).out; if(y) explode(r.o, q/y, acc, d+1); } }"),
  (": f==='nophoto' ? !menuImg(m) : m.section===f)));", ": f==='nophoto' ? !menuImg(m) : f==='noalg' ? !hasAlg(m) : SEASONS.some(x=>x[0]===f) ? m.seasons.includes(f) : m.section===f)));"),
  ("${chip('nophoto','Ohne Foto',cnt(x=>!menuImg(x.m)))}", "${chip('nophoto','Ohne Foto',cnt(x=>!menuImg(x.m)))}${chip('noalg','Ohne Allergene',cnt(x=>!hasAlg(x.m)))}<span class=\"sep\"></span>${SEASONS.map(([k,l])=>chip(k,'Nur '+l,cnt(x=>x.m.seasons.includes(k)))).join('')}"),
  ("${m.hidden?'<span class=\"vb off\">ausgeblendet</span>':''}</span></div>", "${m.hidden?'<span class=\"vb off\">ausgeblendet</span>':''}${m.seasons.length?`<span class=\"vb off\">${m.seasons.map(seasonName).join(' · ')}</span>`:''}${m.days.length?`<span class=\"vb off\">${esc(daysLabel(m))}</span>`:''}</span></div>"),
  (": `<span class=\"add\">${ico('plus')}Rezeptur anlegen</span>`}</span>", ": `<span class=\"add\">${ico('plus')}Rezeptur anlegen</span>${hasAlg(m) ? chips(new Set(algList(m.alg))) : '<span class=\"vb warn\">Allergene fehlen</span>'}`}</span>"),
  ("if(isNew && !m.section && !['all','none','over','nophoto'].includes(view.sec)) m.section = view.sec;", "if(isNew && !m.section && secList().includes(view.sec)) m.section = view.sec;"),
  ("veg:'', top:false, hidden:false, ...(prefill||{})};", "veg:'', top:false, hidden:false, seasons:[], days:[], alg:'', ...(prefill||{})};"),
  ("    <div class=\"togs\"><label class=\"tog\"><input type=\"checkbox\" name=\"top\"",
   "    <div class=\"f\">Saison</div><div class=\"algs seasons\">${SEASONS.map(([k,l])=>`<label class=\"algc\"><input type=\"checkbox\" name=\"sea\" value=\"${k}\" ${!m.seasons.length||m.seasons.includes(k)?'checked':''}><span>${l}</span></label>`).join('')}</div>\n"
   "    <div class=\"f\">Wochentage</div><div class=\"days\">${DAYS.map(([i,l])=>`<label class=\"algc\"><input type=\"checkbox\" name=\"day\" value=\"${i}\" ${!m.days.length||m.days.includes(i)?'checked':''}><span>${l}</span></label>`).join('')}</div>\n"
   "    <details class=\"alg-det\" ${!m.card && !algList(m.alg).length ? 'open' : ''}><summary>Allergene von Hand (wenn keine Rezeptur verknüpft ist)</summary><div class=\"algs\">${Object.entries(ALG).map(([k,v])=>`<label class=\"algc\"><input type=\"checkbox\" name=\"alg\" value=\"${k}\" ${algList(m.alg).includes(k)?'checked':''}><span><b>${k}</b>${esc(v)}</span></label>`).join('')}</div></details>\n"
   "    <div class=\"togs\"><label class=\"tog\"><input type=\"checkbox\" name=\"top\""),
  ("hidden:!fd.get('show')});", "hidden:!fd.get('show'), seasons: fd.getAll('sea').length===4 ? [] : fd.getAll('sea'), days: fd.getAll('day').length===7 ? [] : fd.getAll('day').map(Number), alg: fd.getAll('alg').join(' ')});"),
  ("          <li><button type=\"button\" data-act=\"goMenu\" data-id=\"none\">",
   "          ${(() => { const nx = S.specials.filter(sp=>spStatus(sp)[0]!=='past').sort((a,b)=>a.from.localeCompare(b.from))[0]; return nx ? `<li><button type=\"button\" data-act=\"previewSpecial\" data-id=\"${nx.id}\"><b>${ico('star')}</b><span>${esc(nx.name)} · ${spStatus(nx)[1]}</span>${ico('arrow','flip')}</button></li>` : ''; })()}\n"
   "          <li><button type=\"button\" data-act=\"goMenu\" data-id=\"noalg\"><b class=\"${S.menu.some(m=>!hasAlg(m))?'bad-t':''}\">${S.menu.filter(m=>!hasAlg(m)).length}</b><span>Gerichte ohne Allergenangabe</span>${ico('arrow','flip')}</button></li>\n"
   "          <li><button type=\"button\" data-act=\"goMenu\" data-id=\"none\">"),
  ("    {g:'Bereich', n:'Inventur', s:'Lager',", "    {g:'Bereich', n:'Saison & Aktionen', s:'Speisekarte', run:()=>{ view.mtab='plan'; go('menu'); }},\n    {g:'Aktion', n:'Neue Aktion / Spezialität', s:'', run:()=>specialDialog()},\n    {g:'Bereich', n:'Inventur', s:'Lager',"),
], 'ui')

ui = sub(ui, [
  # 1 Import robust + Normalisierung
  ("function migrate(d){\n  if(!d) return null;", "function migrate(d){\n  if(!d || typeof d !== 'object') return null;\n  if(!Array.isArray(d.products) || !Array.isArray(d.cards) || !Array.isArray(d.menu)) return null;\n  d.settings = Object.assign({name:'Mein Betrieb', vat:10, target:28, nextNo:d.cards.length+1}, d.settings||{});\n  if(!(+d.settings.target >= 1)) d.settings.target = 28; if(!(+d.settings.vat >= 0)) d.settings.vat = 10;\n  d.products = d.products.filter(p=>p && p.id); d.products.forEach(p=>{ p.name = p.name||p.id; p.unit = ['kg','l','Stk'].includes(p.unit)?p.unit:'kg'; p.price = +p.price||0; p.alg = p.alg||''; });\n  d.cards = d.cards.filter(c=>c && c.id); d.cards.forEach(c=>{ c.name = c.name||'Rezeptur'; c.type = c.type==='semi'?'semi':'dish'; if(!Array.isArray(c.items)) c.items = []; c.items = c.items.filter(i=>i && typeof i==='object'); if(c.steps && !Array.isArray(c.steps)) c.steps = []; });\n  d.menu = d.menu.filter(m=>m && m.id); d.menu.forEach(m=>{ m.name = m.name||'Gericht'; m.section = m.section||'Ohne Kategorie'; m.price = +m.price||0; m.desc = m.desc||''; });"),
  ("fromHash(); render();\nimgLoadAll()", "try { fromHash(); render(); } catch(err){ console.error(err); $('#app').innerHTML = `<section class=\"panel\" style=\"max-width:560px\"><h2>Gespeicherte Daten konnten nicht geladen werden</h2><p class=\"hint\">Laden Sie eine Sicherung oder starten Sie mit den Demodaten neu.</p><div class=\"row-btns\" style=\"margin-top:12px\"><button type=\"button\" class=\"btn primary\" data-act=\"importPick\">Sicherung laden</button><button type=\"button\" class=\"btn danger\" data-act=\"reset\">Demodaten laden</button></div><input id=\"importFile\" type=\"file\" accept=\"application/json,.json\" hidden></section>`; }\nimgLoadAll()"),
  # 2/3 Klick nach Bearbeiten + Tab-Fokus
  ("c[f] = f==='yieldG' ? (t.value===''?'':+t.value) : t.value; save(); render(); toast('Gespeichert'); return;", "c[f] = f==='yieldG' ? (t.value===''?'':+t.value) : t.value; save(); softRender(); toast('Gespeichert'); return;"),
  ("if(f==='ref') it.net = ''; save(); render(); return;", "if(f==='ref') it.net = ''; save(); softRender(); return;"),
  ("p[t.dataset.pf] = +t.value || 0; save(); render(); if(", "p[t.dataset.pf] = Math.max(0, +t.value || 0); save(); softRender(); if("),
  ("view.order[t.dataset.ord] = Math.max(0, +t.value||0); render(); return;", "view.order[t.dataset.ord] = Math.max(0, +t.value||0); softRender(); return;"),
  # 4 Strg+K im Dialog
  ("if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){", "if($('#dlg').open && $('#pal').hidden) { if(e.key === 'Enter' && e.target.matches('input[data-li],input[data-pp],input[data-cf],textarea.title-in,input[data-secname],input[data-ord]')) {} if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k') e.preventDefault(); return; }\n  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){"),
  # 7 Sicherung laden per Tastatur
  ('<label class="btn" for="importFile">Sicherung laden</label>', '<button type="button" class="btn" data-act="importPick">Sicherung laden</button>'),
  # 8 Suche nach Zutaten
  ("(!q || (m.name+' '+m.desc+' '+m.section).toLowerCase().includes(q))\n    && (f==='all'", "(!q || (m.name+' '+m.desc+' '+m.section+' '+(k.t?k.t.lines.map(l=>l.name).join(' '):'')).toLowerCase().includes(q))\n    && (f==='all'"),
  # 10 Storno stellt Preis wieder her
  # 11 Eingaben prüfen
  ("S.settings[f] = f==='name' ? t.value : (+t.value || 0); save(); toast('Gespeichert');", "S.settings[f] = f==='name' ? t.value : f==='target' ? Math.min(100, Math.max(1, +t.value || 28)) : Math.min(100, Math.max(0, +t.value || 0)); if(f!=='name') t.value = S.settings[f]; save(); toast('Gespeichert');"),
  # 12 Preis-Link zeigt und setzt denselben Wert
  ('data-act="simTo" data-id="${rec.toFixed(1)}">${eur(rec)}</button>', 'data-act="simTo" data-id="${(Math.round(rec*10)/10).toFixed(1)}">${eur(Math.round(rec*10)/10)}</button>'),
  # 13 Kleinigkeiten
  ('<span class="lay-n">${esc(m.name)}</span>', '<span class="lay-n" title="${esc(m.name)}">${esc(m.name)}</span>'),
  ("view = {...view, tab, card, q: tab===view.tab ? view.q : ''};", "view = {...view, tab, card, q: tab===view.tab ? view.q : '', pq: tab===view.tab ? view.pq : ''};"),
  # Fokus nach Tastatur-Aktionen
  ("  autosize();\n}", "  autosize();\n  pendingRender = false;\n  if(kbdSel){ const el = document.querySelector(kbdSel); kbdSel = null; if(el) el.focus({preventScroll:true}); }\n}\nlet kbdSel = null, ptrDown = false, pendingRender = false;\nfunction softRender(){ if(ptrDown){ pendingRender = true; return; } setTimeout(() => { const id = document.activeElement && document.activeElement.id; render(); if(id){ const n = document.getElementById(id); if(n){ n.focus({preventScroll:true}); if(n.matches('input.num-in') && n.select) n.select(); } } }, 0); }\ndocument.addEventListener('pointerdown', () => { ptrDown = true; }, true);\ndocument.addEventListener('pointerup', () => { ptrDown = false; if(pendingRender) setTimeout(() => { if(pendingRender){ pendingRender = false; render(); } }, 0); }, true);\ndocument.addEventListener('click', e => { const b = e.target.closest('[data-act][data-id],[data-act]'); if(b && e.detail === 0 && b.closest('#app')) kbdSel = `[data-act=\"${b.dataset.act}\"]` + (b.dataset.id!=null ? `[data-id=\"${CSS.escape(b.dataset.id)}\"]` : ''); }, true);"),
], 'qa')

ui = ui.replace("new Date().toISOString().slice(0,10)", "todayStr()")

ui = sub(ui, [
  ("  seasonSeed(d);\n  return d;\n}", "  seasonSeed(d);\n  einkaufSeed(d);\n  return d;\n}"),
  ("  seasonMigrate(d);\n  return d;", "  seasonMigrate(d);\n  einkaufMigrate(d);\n  return d;"),
  ("[['bestand','Bestand'],['buchungen','Buchungen',S.moves.length],['inventur','Inventur'],['bestellung','Bestellung',low.length]]", "[['bestand','Bestand'],['bestellung','Bestellungen',S.orders.filter(o=>['draft','approval','sent','confirmed','complaint'].includes(o.status)).length],['lieferanten','Lieferanten',S.suppliers.length],['buchungen','Buchungen',S.moves.length],['inventur','Inventur']]"),
  ("{bestand:stockList, buchungen:moveList, inventur:invView, bestellung:orderView}[view.stab]", "{bestand:stockList, buchungen:moveList, inventur:invView, bestellung:orderView, lieferanten:supplierView}[view.stab]"),
  ("<h1>Lager</h1>", "<h1>Lager & Einkauf</h1>"),
  ("    case 'stab': view.stab = id; render(); break;", "    case 'stab': view.stab = id; view.order = null; view.recv = null; render(); break;"),
  ("(p.name+' '+p.supplier).toLowerCase()", "(p.name+' '+supName(p)).toLowerCase()"),
  ("esc(p.supplier||'kein Lieferant')", "esc(supName(p))"),
  ("${p.supplier?' · '+esc(p.supplier):''}", "${p.supplier?' · '+esc(supName(p)):''}"),
  ('<label class="f">Lieferant<input name="supplier" list="sups" value="${esc(p.supplier)}"><datalist id="sups">${sups.map(s=>`<option value="${esc(s)}">`).join(\'\')}</datalist></label>',
   '<label class="f">Lieferant<select name="supplier"><option value="">— keiner —</option>${(S.suppliers||[]).map(s=>`<option value="${s.id}" ${p.supplier===s.id?\'selected\':\'\'}>${esc(s.name)}</option>`).join(\'\')}</select></label>\n      <label class="f">Artikelnummer beim Lieferanten<input name="artNo" value="${esc(p.artNo||\'\')}"></label>\n      <label class="f">Gebinde<input name="pack" value="${esc(p.pack||\'\')}" placeholder="z. B. Sack 10 kg"></label>\n      <label class="f">Inhalt Gebinde in ${esc(p.unit)}<input name="packQty" class="num-in" type="text" inputmode="decimal" value="${numIn(p.packQty||\'\')}"></label>'),
  ("supplier:fd.get('supplier').trim(), minStock", "supplier:fd.get('supplier'), artNo:fd.get('artNo').trim(), pack:fd.get('pack').trim(), packQty:+fd.get('packQty')||0, minStock"),
  ("    case 'ordCopy': {", "    case 'ordCopy_v1': {"),
  ("    case 'ordBook': {", "    case 'ordBook_v1': {"),
  ("  if(tab){ go(tab.dataset.tab); return; }", "  if(tab){ view.order = null; view.recv = null; go(tab.dataset.tab); return; }"),
  ("          ${(() => { const nx = S.specials.filter", "          ${(() => { const t = todayStr(), w = wd(t); const due = (S.suppliers||[]).filter(sp=>sp.active && sp.orderDays.includes(w) && !lastOrderToday(sp.id)); const exp = (S.orders||[]).filter(o=>['sent','confirmed'].includes(o.status) && o.deliveryDate<=t); return (due.length?`<li><button type=\"button\" data-act=\"goStock\" data-id=\"bestellung\"><b class=\"${due.some(sp=>hm(sp.cutoff)-nowMin()<90)?'bad-t':''}\">${due.length}</b><span>Heute bestellen: ${due.map(x=>esc(x.name)).join(', ')}</span>${ico('arrow','flip')}</button></li>`:'') + (exp.length?`<li><button type=\"button\" data-act=\"goStock\" data-id=\"bestellung\"><b>${ico('truck')}</b><span>${exp.length} ${exp.length===1?'Lieferung':'Lieferungen'} heute prüfen</span>${ico('arrow','flip')}</button></li>`:''); })()}\n          ${(() => { const nx = S.specials.filter"),
  ("    {g:'Bereich', n:'Inventur', s:'Lager',", "    {g:'Bereich', n:'Bestellungen', s:'Lager & Einkauf', run:()=>{ view.stab='bestellung'; view.order=null; go('stock'); }},\n    {g:'Bereich', n:'Lieferanten', s:'Lager & Einkauf', run:()=>{ view.stab='lieferanten'; view.order=null; go('stock'); }},\n    ...(S.suppliers||[]).map(sp=>({g:'Bestellen', n:sp.name, s:CHANNELS[sp.channel], run:()=>{ const o = newOrder(sp.id); save(); view.stab='bestellung'; view.order=o.id; go('stock'); }})),\n    {g:'Bereich', n:'Inventur', s:'Lager',"),
  ("imgLoadAll().then(() => { if(Object.keys(IMG).length) render(); });", "imgLoadAll().then(() => { if(Object.keys(IMG).length) render(); cloudStart(); });"),
  ("  autosize();\n  pendingRender = false;", "  autosize();\n  const wEl = $('#whoami'); if(wEl){ const u = me(); wEl.innerHTML = `<b>${esc(u.name)}</b><small>${ROLES[u.role]}${cloudReady()?' · Cloud':''}</small>`; }\n  pendingRender = false;"),
], 'einkauf')

ui = sub(ui, [
  ("  einkaufSeed(d);\n  return d;\n}", "  einkaufSeed(d);\n  menuV2Migrate(d);\n  return d;\n}"),
  ("  einkaufMigrate(d);\n  return d;", "  einkaufMigrate(d);\n  menuV2Migrate(d);\n  return d;"),
  ("const sec = secList().includes(cc.category) ? cc.category : secList()[0];", "const sec = secList().includes(cc.category) ? cc.category : secList().includes(SEC_MAP[cc.category]) ? SEC_MAP[cc.category] : secList()[0];"),
], 'menu2')

ui = sub(ui, [
  ("const fn = {dash:renderDash, menu:renderMenu, stock:renderStock, products:renderProducts, setup:renderSetup}[view.tab];", "const fn = {dash:renderDash, menu:renderMenu, stock:renderStock, products:renderProducts, setup:renderSetup, buy:renderBuy}[view.tab];"),
  ("  app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');", "  app.dataset.view = view.tab; app.classList.toggle('v-list', vmode('buy') !== 'cards');\n  app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');"),
  ("  if(tab){ view.order = null; view.recv = null; go(tab.dataset.tab); return; }", "  if(tab){ view.order = null; view.recv = null; const tt = tab.dataset.tab; if(tt==='stock' && BUY.includes(view.stab)) view.stab = 'bestand'; if(tt==='buy' && !BUY.includes(view.stab)) view.stab = 'bestellung'; go(tt); return; }"),
  ("function go(tab, card=null){\n", "function go(tab, card=null){\n  if(tab==='stock' && BUY.includes(view.stab)) tab = 'buy';\n"),
  ("[['bestand','Bestand'],['bestellung','Bestellungen',S.orders.filter(o=>['draft','approval','sent','confirmed','complaint'].includes(o.status)).length],['lieferanten','Lieferanten',S.suppliers.length],['buchungen','Buchungen',S.moves.length],['inventur','Inventur']]", "[['bestand','Bestand'],['buchungen','Buchungen',S.moves.length],['inventur','Inventur']]"),
  ('<button type="button" class="tile click" data-act="stab" data-id="bestellung">', '<button type="button" class="tile click" data-act="goStock" data-id="bestellung">'),
  ("<h1>Lager & Einkauf</h1>", "<h1>Lager</h1>"),
], 'ui3')

ui = sub(ui, [
  ("setup:renderSetup, buy:renderBuy}[view.tab];", "setup:renderSetup, buy:renderBuy, report:renderReport}[view.tab];"),
  ("  menuV2Migrate(d);\n  return d;", "  menuV2Migrate(d);\n  salesEnsure(d); if(d.demo && !d.salesDemoDone) salesDemo(d);\n  pricesMigrate(d);\n  return d;"),
  ("fd => { Object.assign(p, {name:fd.get('name').trim(), unit:fd.get('unit'), price:+fd.get('price')", "fd => { if(+fd.get('price') !== +p.price) markPrice(p, 'manuell'); Object.assign(p, {name:fd.get('name').trim(), unit:fd.get('unit'), price:+fd.get('price')"),
], 'report')

ui = sub(ui, [
  ("setup:renderSetup, buy:renderBuy, report:renderReport}[view.tab];", "setup:renderSetup, buy:renderBuy, report:renderReport, aufbau:renderAufbau, pcheck:renderPriceCheck, labor:renderLabor}[view.tab];"),
  ("  pricesMigrate(d);\n  return d;", "  pricesMigrate(d);\n  gameMigrate(d);\n  return d;"),
], 'game')
ui = sub(ui, [
  ("  gameMigrate(d);\n  return d;", "  gameMigrate(d);\n  hausMigrate(d);\n  return d;"),
], 'haus')
ui = sub(ui, [
  ("  hausMigrate(d);\n  return d;", "  hausMigrate(d);\n  fixesMigrate(d);\n  return d;"),
], 'fixes')
ui = sub(ui, [
  ("  fixesMigrate(d);\n  return d;", "  fixesMigrate(d);\n  guideMigrate(d);\n  return d;"),
  ("pcheck:renderPriceCheck, labor:renderLabor}[view.tab];", "pcheck:renderPriceCheck, labor:renderLabor, begriffe:renderBegriffe, stempel:renderStempel}[view.tab];"),
], 'guide')

start = '/* ---------- Start ---------- */'
a, b = ui.split(start)
season = R('season.js') + '\n' + R('season2.js') + '\n' + R('season3.js') + '\n' + R('einkauf.js') + '\n' + R('menu2.js') + '\n' + R('cloud.js') + '\n' + R('ui3.js') + '\n' + R('sales.js') + '\n' + R('report.js') + '\n' + R('menu3.js') + '\n' + R('prices.js') + '\n' + R('game.js') + '\n' + R('drag.js') + '\n' + R('labor.js') + '\n' + R('polish.js') + '\n' + R('pdf.js') + '\n' + R('hauskarte.js') + '\n' + R('fixes.js') + '\n' + R('guide_txt.js') + '\n' + R('guide.js') + '\n' + R('guide_game.js')
js = core + '\n' + a + '\n' + season + '\n' + start + b

shell = R('shell_final.html')
shell = sub(shell, [
  ('family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Bricolage+Grotesque',
   'family=Barlow+Condensed:wght@300;400;500;600;700&family=PT+Sans:wght@400;700&family=Saira+Condensed:wght@300;400&family=Roboto+Condensed:wght@400;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Schibsted+Grotesk:wght@500;600&family=Bricolage+Grotesque'),
  ('<div class="side-foot"><span>Restobar | Café</span>', '<span id="cloudChip" class="cloud-chip off" hidden></span>\n    <div class="side-foot"><button type="button" class="whoami" data-tab="setup" id="whoami"></button>'),
  ('#print{display:none}', R('season.css') + R('einkauf.css') + R('menu2.css') + R('ui3.css') + R('intro.css') + R('intro2.css') + R('report.css') + R('menu3.css') + R('prices.css') + R('game.css') + R('drag.css') + R('labor.css') + R('polish.css') + R('hauskarte.css') + R('fixes.css') + R('guide.css') + '.m-only{display:none}@media (max-width:900px){.m-only{display:flex}}' + '\n.dish-main:focus-visible,.rc:focus-visible{outline-offset:-3px}\n.title-in{hyphens:auto;-webkit-hyphens:auto}\n#print{display:none}'),
], 'shell')
shell = shell.replace('<body>\n', '<body>\n' + R('intro.html'), 1)
js = js.replace("${!FRAMED && sp.mode==='tageskarte'?", "${sp.mode==='tageskarte'?").replace("Tabelle (CSV)</button>${FRAMED?'':`", "Tabelle (CSV)</button>${false?'':`")
import re as _re
def _pdfcss(css):
    out=[]; i=0
    while True:
        k=css.find('@media print{', i)
        if k<0: break
        j=k+len('@media print{'); depth=1; st=j
        while depth and j<len(css):
            if css[j]=='{': depth+=1
            elif css[j]=='}': depth-=1
            j+=1
        body=css[st:j-1]; i=j
        for m in _re.finditer(r'([^{}]+)\{([^{}]*)\}', body):
            sel, dec = m.group(1).strip(), m.group(2)
            if '#print' not in sel or 'body >' in sel or '::before' in sel: continue
            sel=','.join(x.replace('#print', '#print.pdf') for x in sel.split(','))
            out.append(sel+'{'+dec+'}')
    return '\n'.join(out)
_light = _re.search(r':root\{([^}]*--bg:#f7f5f0[^}]*)\}', R('ui3.css')).group(1)
pdfcss = '#print.pdf{display:block!important;position:absolute;left:-12000px;top:0;width:794px;padding:44px 50px;box-sizing:border-box;background:#fff;color:#000;color-scheme:light;' + _light + '}\n' + _pdfcss(shell) + '\n#print.pdf .wk-paper{box-shadow:none;max-width:none;padding:0}#print.pdf .wk-tabs,#print.pdf .wk-filters{display:none}#print.pdf .wk-cols{columns:2}'
shell = shell.replace('</style>', pdfcss + '\n</style>', 1)
out = shell.replace('/*SCRIPT*/', js)
open('/home/user/zzolotuhin94-coder.github.io/dahuam/index.html', 'w', encoding='utf-8').write(out)
print('built', len(out))
