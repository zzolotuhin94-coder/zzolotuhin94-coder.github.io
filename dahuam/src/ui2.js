/* =====================================================================
   Erweiterung: Lager, Inventur, Fotos, Zubereitungsschritte, Gästekarte
   ===================================================================== */
const LOCS = {K:'Kühlhaus', T:'Tiefkühler', L:'Trockenlager', G:'Gemüselager', W:'Bar & Weinkeller'};
const MOVE = {in:'Wareneingang', out:'Entnahme', waste:'Schwund', sale:'Verkauf', inv:'Inventur'};
const WASTE = ['Verdorben / abgelaufen','Überproduktion','Zubereitungsfehler','Personalessen','Bruch','Sonstiges'];
const SECTION_ORDER = ['Vorspeisen','Suppen','Salate & Bowls','Flammkuchen','Fondue & Hauptspeisen','Burger & Kebap','Desserts','Kindermenü'];
const GSTYLES = [['alpin','Alpin'],['klassisch','Klassisch'],['modern','Modern']];

// Demo-Lagerdaten: Bestand, Mindestbestand, Lagerort, Lieferant
const DEMO_STOCK = {
  pork:[12,8,'K','Metzgerei'], veal:[3.5,5,'K','Metzgerei'], beef_goulash:[9,6,'K','Metzgerei'], beef_mince:[6,5,'K','Metzgerei'], speck:[4,3,'K','Metzgerei'],
  flour:[25,15,'L','Großhandel'], egg:[180,120,'K','Bauernhof'], quail:[36,24,'K','Bauernhof'], crumbs:[6,4,'L','Bäckerei'], schmalz:[5,4,'L','Großhandel'],
  fries:[16,20,'T','Großhandel'], lemon:[30,20,'G','Gemüsehändler'], cranberry:[3,2,'L','Großhandel'], parsley:[0.3,0.5,'K','Gemüsehändler'],
  milk:[20,15,'K','Molkerei'], cream:[8,6,'K','Molkerei'], butter:[6,5,'K','Molkerei'], cremefr:[4,3,'K','Molkerei'], parmesan:[2.5,1.5,'K','Großhandel'],
  bergkase:[7,6,'K','Sennerei'], emmental:[5,4,'K','Sennerei'], cheddar:[2,1.5,'K','Großhandel'], sugar:[20,10,'L','Großhandel'], icing:[5,3,'L','Großhandel'],
  raisins:[2,1,'L','Großhandel'], applesauce:[6,4,'L','Großhandel'], blueberry:[2.5,4,'T','Großhandel'], apples:[15,10,'G','Bauernhof'], strudel_dough:[3,2,'K','Großhandel'],
  cinnamon:[0.5,0.2,'L','Großhandel'], onion:[20,10,'G','Gemüsehändler'], red_onion:[5,3,'G','Gemüsehändler'], spring:[1,1,'K','Gemüsehändler'], garlic:[2,1,'G','Gemüsehändler'],
  potato:[40,25,'G','Bauernhof'], romaine:[2.5,4,'K','Gemüsehändler'], passata:[12,8,'L','Großhandel'], tomato_paste:[3,2,'L','Großhandel'], capers:[1,0.5,'L','Großhandel'],
  pickles:[5,4,'L','Großhandel'], pesto:[1.5,1,'K','Großhandel'], mustard:[2,1,'L','Großhandel'], bbq:[3,2,'L','Großhandel'], chutney:[2,1.5,'K','Großhandel'],
  bread:[6,4,'L','Bäckerei'], brioche:[40,30,'T','Bäckerei'], wine:[24,12,'W','Weinhandel'], kirsch:[3,2,'W','Weinhandel'], starch:[3,1,'L','Großhandel'],
  oil:[20,10,'L','Großhandel'], paprika:[1,0.5,'L','Großhandel'], caraway:[0.5,0.2,'L','Großhandel'], salt:[10,5,'L','Großhandel'], pepper:[1,0.5,'L','Großhandel'],
};
const DEMO_VEG = {'„Die Gärtnerin“':'v','„Der Weiße“':'v','Fruchtige Tomatensuppe':'v','„Vegan Dippin’“':'vg','„Fabian’s Caprese“':'v','„Veganista Couch Potato“':'vg','Dolce Vita Rösti':'v','„Wir sind Kaiser!“':'v','Oma Lisl’s Apfelstrudel':'v','„Marillenzeit = Knödelzeit“':'v','Zillertaler Käsefondue':'v'};
const DEMO_TOP = ['Zillertaler Käsefondue','„Wir sind Kaiser!“','Wiener Schnitzel vom Kalb','„Schwammerlsuche“'];

function daysAgo(n){ const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString(); }
function splitSteps(t){ const parts = String(t||'').split(/\.\s+(?=[A-ZÄÖÜ„])/).map(s=>s.trim()).filter(Boolean); return parts.map((s,i)=>({t: i<parts.length-1 || !/[.!?]$/.test(s) ? s.replace(/\.?$/,'.') : s, img:''})); }

function seed(){
  const d = seedBase();
  d.products.forEach(p => { const s = DEMO_STOCK[p.id]; if(s){ [p.stock,p.minStock,p.loc,p.supplier] = s; } else { p.stock = 0; p.minStock = 0; p.loc = 'L'; p.supplier = ''; p.noStock = p.id==='water'; } });
  d.cards.forEach(c => { c.steps = splitSteps(c.method); delete c.method; c.img = ''; });
  const order = {};
  d.menu.forEach(m => { order[m.section] = (order[m.section]||0); m.order = order[m.section]++; m.img = ''; m.veg = DEMO_VEG[m.name]||''; m.top = DEMO_TOP.includes(m.name); m.hidden = false; });
  d.settings.sections = [...SECTION_ORDER];
  d.settings.guest = {style:'alpin', photos:true, allergens:true, desc:true, title:'Speisekarte', subtitle:'Restobar | Café · Gerlos im Zillertal', footer:'Alle Preise in Euro inkl. MwSt. Bitte informieren Sie uns über Allergien und Unverträglichkeiten.'};
  const mv = (n,type,pid,qty,note) => { const p = d.products.find(x=>x.id===pid); return {id:uid('mv'), date:daysAgo(n), type, pid, qty, price:p.price, note}; };
  d.moves = [
    mv(6,'in','pork',10,'Lieferschein 2231'), mv(6,'in','veal',5,'Lieferschein 2231'), mv(5,'in','milk',20,'Molkerei Frühlieferung'),
    mv(4,'in','potato',25,''), mv(3,'waste','parsley',-0.1,'Verdorben / abgelaufen'), mv(2,'in','bergkase',4,''), mv(1,'out','wine',-2,'Für Fondue-Vorbereitung'),
  ];
  d.inventories = [{id:uid('inv'), date:daysAgo(31), counted:54, value:2386.40, diff:-42.30, demo:true}];
  d.invDraft = null;
  return d;
}

function migrate(d){
  if(!d) return null;
  d.products.forEach(p => { if(p.stock==null){ const s = d.demo && DEMO_STOCK[p.id]; [p.stock,p.minStock,p.loc,p.supplier] = s || [0,0,'L','']; } if(p.id==='water') p.noStock = true; });
  d.cards.forEach(c => { if(!c.steps){ c.steps = splitSteps(c.method); delete c.method; } if(c.img==null) c.img=''; });
  const order = {};
  d.menu.forEach(m => { if(m.order==null){ order[m.section] = (order[m.section]||0); m.order = order[m.section]++; } if(m.img==null) m.img=''; if(m.veg==null) m.veg=''; });
  if(!d.settings.sections) d.settings.sections = [...SECTION_ORDER];
  if(!d.settings.guest) d.settings.guest = {style:'alpin', photos:true, allergens:true, desc:true, title:'Speisekarte', subtitle:'', footer:'Alle Preise in Euro inkl. MwSt.'};
  d.moves = d.moves || []; d.inventories = d.inventories || []; if(d.invDraft===undefined) d.invDraft = null;
  return d;
}

/* ---------- Fotos (IndexedDB) ---------- */
const IMG = {}; let idb = null;
function idbOpen(){ return new Promise(res => { try { const r = indexedDB.open('dahuam202_fotos', 1); r.onupgradeneeded = () => r.result.createObjectStore('img'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch(e){ res(null); } }); }
async function imgLoadAll(){ idb = await idbOpen(); if(!idb) return; await new Promise(res => { try { const rq = idb.transaction('img').objectStore('img').openCursor(); rq.onsuccess = () => { const c = rq.result; if(c){ IMG[c.key] = c.value; c.continue(); } else res(); }; rq.onerror = () => res(); } catch(e){ res(); } }); }
function imgPut(id, data){ IMG[id] = data; try { idb && idb.transaction('img','readwrite').objectStore('img').put(data, id); } catch(e){} }
function imgDel(id){ if(!id) return; delete IMG[id]; try { idb && idb.transaction('img','readwrite').objectStore('img').delete(id); } catch(e){} }
function resizeImage(file, max=1400){
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => {
    const k = Math.min(1, max/Math.max(im.width, im.height)); const cv = document.createElement('canvas'); cv.width = Math.round(im.width*k); cv.height = Math.round(im.height*k);
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); res(cv.toDataURL('image/jpeg', 0.82)); }; im.src = fr.result; }; fr.readAsDataURL(file); });
}
let pickCb = null;
function pickImage(cb){ pickCb = cb; const i = $('#imgFile'); i.value = ''; i.click(); }
function setPhoto(obj, field='img'){ pickImage(data => { if(obj[field]) imgDel(obj[field]); const id = uid('img'); imgPut(id, data); obj[field] = id; save(); render(); toast('Foto gespeichert'); }); }
function initials(n){ const w = String(n||'').replace(/[„“"'«»]/g,'').trim().split(/\s+/); return ((w[0]||'')[0]||'·').toUpperCase(); }
function menuImg(m){ const c = m.card && C(m.card); return (m.img && IMG[m.img]) ? m.img : (c && c.img && IMG[c.img]) ? c.img : ''; }
function photo(imgId, name, hue, cls=''){
  const src = imgId && IMG[imgId];
  return src ? `<img class="ph ${cls}" src="${src}" alt="${esc(name)}" loading="lazy">` : `<span class="ph ph-empty ${cls}" style="--h:${secHue(hue)}" aria-hidden="true"><b>${esc(initials(name))}</b></span>`;
}

/* ---------- Lager-Logik ---------- */
function unitOf(p){ return p ? p.unit : ''; }
function qtyFmt(q, p){ const d = p && p.unit==='Stk' ? 0 : (Math.abs(q) < 10 ? 2 : 1); return num(q, d)+' '+unitOf(p); }
function stockProducts(){ return S.products.filter(p => !p.noStock); }
function stockValue(){ return stockProducts().reduce((s,p)=>s + Math.max(0,+p.stock||0)*(+p.price||0), 0); }
function lowStock(){ return stockProducts().filter(p => (+p.minStock||0) > 0 && (+p.stock||0) < +p.minStock); }
function addMove(type, pid, delta, note='', price=null, date=null){
  const p = P(pid); if(!p || !delta) return;
  p.stock = Math.round(((+p.stock||0) + delta)*1000)/1000;
  S.moves.unshift({id:uid('mv'), date: date || new Date().toISOString(), type, pid, qty:delta, price: price ?? p.price, note});
}
function explode(c, f, acc=new Map(), d=0){
  if(!c || d > 6) return acc;
  for(const it of c.items){ const r = refObj(it.ref); if(!r) continue; const q = (+it.qty||0)*f;
    if(r.t==='p'){ if(r.o.noStock) continue; acc.set(r.o.id, (acc.get(r.o.id)||0) + (r.o.unit==='Stk' ? q : q/1000)); }
    else if(r.o.yieldG) explode(r.o, q/r.o.yieldG, acc, d+1); }
  return acc;
}
function orderSuggest(p){ const min = +p.minStock||0, s = +p.stock||0; let q = Math.max(0, min*2 - s); if(p.unit==='Stk') return Math.ceil(q); return Math.ceil(q*2)/2; }

/* ---------- Karten-Reihenfolge ---------- */
function secList(){ const s = S.settings.sections; for(const m of S.menu) if(m.section && !s.includes(m.section)) s.push(m.section); return s; }
function menuSorted(){ const s = secList(); return [...S.menu].sort((a,b) => s.indexOf(a.section) - s.indexOf(b.section) || (a.order??0) - (b.order??0)); }
function nextOrder(sec){ return S.menu.filter(m=>m.section===sec).reduce((mx,m)=>Math.max(mx, m.order??0), -1) + 1; }
function moveItem(id, dir){
  const m = S.menu.find(x=>x.id===id); const list = menuSorted().filter(x=>x.section===m.section); list.forEach((x,i)=>x.order=i);
  const i = list.indexOf(m), j = i+dir; if(j<0 || j>=list.length) return; [list[i].order, list[j].order] = [list[j].order, list[i].order];
}

/* ---------- Icons ---------- */
const ICO = {
  dash:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  menu:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M9 9h6M9 13h6"/>',
  cards:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
  stock:'<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/>',
  products:'<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  setup:'<path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1"/><circle cx="16" cy="6" r="2.2"/><circle cx="10" cy="12" r="2.2"/><circle cx="18" cy="18" r="2.2"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  arrow:'<path d="M15 5l-7 7 7 7"/>',
  up:'<path d="M6 15l6-6 6 6"/>', down:'<path d="M6 9l6 6 6-6"/>',
  print:'<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1"/>',
  truck:'<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  clip:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 11l2 2 4-4M9 17h6"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  leaf:'<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l7-7"/>',
  cart:'<path d="M3 4h2l2.5 11h10L20 7H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
};
const ico = (n, cls='') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[n]}</svg>`;

const TABS = [['dash','Übersicht','Start'],['menu','Speisekarte','Karte'],['cards','Rezepturen','Rezepte'],['stock','Lager','Lager'],['products','Produkte','Produkte'],['setup','Einstellungen','Mehr']];
view = {tab:'dash', card:null, q:'', sec:'all', ctype:'all', pq:'', sim:null, portions:20, mtab:'calc', stab:'bestand', loc:'all', mtype:'all', order:{}};

/* ---------- Bausteine ---------- */
function ring(fc, size=46, stroke=5){
  const r = (size-stroke)/2, c = 2*Math.PI*r, v = fc==null ? 0 : Math.min(fc,60)/60;
  return `<svg class="ring ${fcClass(fc)}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle class="trk" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none"/>
    <circle class="val" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${(c*v).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size/2} ${size/2})"/></svg>`;
}
function secHue(name){ const secs = [...new Set(secList().concat(S.cards.map(c=>c.category)))]; const i = Math.max(0, secs.indexOf(name)); return (i*47 + 20) % 360; }
function catDot(name){ return `<span class="dot" style="--h:${secHue(name)}"></span>`; }
function toast(msg, opt){
  const t = $('#toast'); clearTimeout(toast._t); t.textContent = msg; t.classList.remove('has-act');
  if(opt && opt.action){ const b = document.createElement('button'); b.type = 'button'; b.className = 'toast-act'; b.textContent = opt.label || 'Rückgängig'; b.onclick = () => { clearTimeout(toast._t); t.classList.remove('show','has-act'); opt.action(); }; t.appendChild(b); t.classList.add('has-act'); }
  t.classList.add('show'); toast._t = setTimeout(()=>t.classList.remove('show','has-act'), (opt && opt.ms) || (opt && opt.action ? 6000 : 2200));
}
function demoNote(){ return S.demo ? `<div class="note">${ico('spark')}<span>Demodaten: Speisekarte und Preise von dahuam202.at. Rezepturen, Einkaufspreise und Lagerbestände sind Richtwerte, bitte durch eigene ersetzen.</span></div>` : ''; }
function seg(name, cur, opts){ return `<div class="seg" role="tablist">${opts.map(([k,l,n])=>`<button type="button" role="tab" class="${cur===k?'on':''}" data-act="${name}" data-id="${k}">${l}${n!=null?`<small>${n}</small>`:''}</button>`).join('')}</div>`; }
function vegBadge(v){ return v==='vg' ? '<span class="vb vg" title="Vegan">VG</span>' : v==='v' ? '<span class="vb" title="Vegetarisch">V</span>' : ''; }
function fmtDate(iso){ return new Date(iso).toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit',year:'numeric'}); }

/* ---------- Rahmen ---------- */
function render(){
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === view.tab));
  const app = $('#app');
  const fn = {dash:renderDash, menu:renderMenu, stock:renderStock, products:renderProducts, setup:renderSetup}[view.tab];
  app.innerHTML = fn ? fn() : (view.card && C(view.card) ? renderCard(C(view.card)) : renderCards());
  app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
  autosize();
}
function autosize(el){ (el ? [el] : document.querySelectorAll('#app .title-in, #app [data-step]')).forEach(t => { if(t.tagName!=='TEXTAREA') return; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }); }
function navHtml(short){ return TABS.map(([k,l,s])=>`<button type="button" class="nav-i" data-tab="${k}">${ico(k)}<span>${short?s:l}</span></button>`).join(''); }

/* ---------- Übersicht ---------- */
function renderDash(){
  const all = S.menu.map(m => ({m, k:menuCalc(m)}));
  const linked = all.filter(x => x.k.cost != null).sort((a,b)=>b.k.fc-a.k.fc);
  const avg = linked.length ? linked.reduce((s,x)=>s+x.k.fc,0)/linked.length : null;
  const over = linked.filter(x => x.k.fc > S.settings.target);
  const cover = S.menu.length ? linked.length/S.menu.length*100 : 0;
  const tg = +S.settings.target;
  const scale = Math.max(40, Math.ceil(((linked[0]?.k.fc)||0)/10)*10 + 5);
  const low = lowStock();
  const drv = new Map();
  linked.forEach(x => explode(x.k.c, 1).forEach((q,pid) => { const p = P(pid); drv.set(pid, (drv.get(pid)||0) + q*(+p.price||0)); }));
  const drvList = [...drv.entries()].sort((a,b)=>b[1]-a[1]);
  const drvSum = drvList.reduce((s,x)=>s+x[1],0) || 1;
  const top = drvList.slice(0,6);
  const hour = new Date().getHours();
  const hi = hour < 11 ? 'Guten Morgen' : hour < 17 ? 'Servus' : 'Guten Abend';
  const lastInv = S.inventories[0];
  return `<div class="page-h"><div><div class="eyebrow">${new Date().toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'})}</div><h1>${hi}, Küche!</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="sales">${ico('cart')}Verkäufe buchen</button><button type="button" class="btn primary" data-act="moveDlg" data-id="in">${ico('truck')}Wareneingang</button></div></div>
  ${demoNote()}
  <div class="tiles">
    <div class="tile"><div class="tile-ring">${ring(avg,58,6)}<b>${avg==null?'—':num(avg,0)+'%'}</b></div><div><div class="t-l">Ø Wareneinsatz</div><div class="t-s">Ziel ${num(tg)} %</div></div></div>
    <div class="tile"><div><div class="t-v">${linked.length}<small>/${S.menu.length}</small></div><div class="t-l">Gerichte kalkuliert</div><div class="meter"><i style="width:${cover.toFixed(1)}%"></i></div></div></div>
    <button type="button" class="tile click" data-act="goStock" data-id="bestand"><div><div class="t-v">${eur(stockValue())}</div><div class="t-l">Lagerwert</div><div class="t-s">${lastInv?'Inventur '+fmtDate(lastInv.date):'Noch keine Inventur'}</div></div></button>
    <button type="button" class="tile click" data-act="goStock" data-id="bestellung"><div><div class="t-v ${low.length?'bad-t':'good-t'}">${low.length}</div><div class="t-l">unter Mindestbestand</div><div class="t-s">${low.length?'Bestellvorschlag ansehen →':'Lager ist gut gefüllt'}</div></div></button>
  </div>
  <div class="dash-grid">
    <section class="panel">
      <div class="panel-h"><h2>Wareneinsatz je Gericht</h2><span class="legend"><i class="tl"></i>Ziel ${num(tg)} %</span></div>
      <div class="bars" style="--tg:${(tg/scale*100).toFixed(2)}%">
        ${linked.map(({m,k})=>`<button type="button" class="bar-r" data-act="openCard" data-id="${k.c.id}" title="${esc(m.name)}">
          <span class="bar-n">${esc(m.name)}</span>
          <span class="bar-t"><i class="${fcClass(k.fc)}" style="width:${Math.min(100,k.fc/scale*100).toFixed(2)}%"></i></span>
          <span class="bar-v">${num(k.fc,1)}%</span></button>`).join('') || '<div class="empty">Noch keine Gerichte kalkuliert.</div>'}
        <div class="bar-axis"><span></span><span class="ax"><i>0 %</i><i>${num(scale/2)} %</i><i>${num(scale)} %</i></span><span></span></div>
      </div>
    </section>
    <div class="stack">
      <section class="panel">
        <div class="panel-h"><h2>Zu erledigen</h2></div>
        <ul class="todo">
          <li><button type="button" data-act="goStock" data-id="bestellung"><b class="${low.length?'bad-t':''}">${low.length}</b><span>Artikel nachbestellen</span>${ico('arrow','flip')}</button></li>
          <li><button type="button" data-act="goMenu" data-id="none"><b>${S.menu.length-linked.length}</b><span>Gerichte ohne Rezeptur</span>${ico('arrow','flip')}</button></li>
          <li><button type="button" data-act="goMenu" data-id="over"><b class="${over.length?'bad-t':''}">${over.length}</b><span>Gerichte über ${num(tg)} % Wareneinsatz</span>${ico('arrow','flip')}</button></li>
          <li><button type="button" data-act="goStock" data-id="inventur"><b>${S.invDraft?'…':ico('clip')}</b><span>${S.invDraft?'Laufende Inventur fortsetzen':'Inventur durchführen'}</span>${ico('arrow','flip')}</button></li>
        </ul>
      </section>
      <section class="panel">
        <div class="panel-h"><h2>Größte Kostentreiber</h2></div>
        <div class="stackbar">${top.map(([id,v],i)=>`<i style="width:${(v/drvSum*100).toFixed(2)}%;background:var(--s${i+1})"></i>`).join('')}<i style="flex:1;background:var(--s7)"></i></div>
        <ul class="leg">${top.map(([id,v],i)=>`<li><span class="sw" style="background:var(--s${i+1})"></span><span class="ln">${esc(P(id)?.name)}</span><span class="mono">${num(v/drvSum*100,1)} %</span></li>`).join('')}
          <li><span class="sw" style="background:var(--s7)"></span><span class="ln muted">Übrige Produkte</span><span class="mono">${num((1-top.reduce((s,x)=>s+x[1],0)/drvSum)*100,1)} %</span></li></ul>
        <p class="hint">Anteil am Wareneinsatz aller kalkulierten Gerichte, je eine Portion.</p>
      </section>
    </div>
  </div>`;
}

/* ---------- Speisekarte ---------- */
function renderMenu(){
  const hidden = S.menu.filter(m=>m.hidden).length;
  const head = `<div class="page-h"><div><div class="eyebrow">${S.menu.length} Gerichte · ${secList().length} Kategorien${hidden?` · ${hidden} ausgeblendet`:''}</div><h1>Speisekarte</h1></div>
    <div class="row-btns">${view.mtab==='guest' && !FRAMED ? `<button type="button" class="btn" data-act="printMenu">${ico('print')}Drucken</button>` : ''}<button type="button" class="btn primary" data-act="newMenu">${ico('plus')}Gericht</button></div></div>
  <div class="toolbar">${seg('mtab', view.mtab, [['calc','Kalkulation'],['guest','Gästekarte'],['layout','Aufbau & Reihenfolge']])}</div>`;
  return head + (view.mtab==='guest' ? renderGuest() : view.mtab==='layout' ? renderLayout() : renderMenuCalc());
}

function renderMenuCalc(){
  const q = view.q.trim().toLowerCase();
  const all = menuSorted().map(m => ({m, k:menuCalc(m)}));
  const f = view.sec;
  const shown = all.filter(({m,k}) => (!q || (m.name+' '+m.desc+' '+m.section).toLowerCase().includes(q))
    && (f==='all' || (f==='none' ? k.cost==null : f==='over' ? (k.fc!=null && k.fc > S.settings.target) : f==='nophoto' ? !menuImg(m) : m.section===f)));
  const cnt = x => all.filter(x).length;
  const chip = (k,l,n,dot) => `<button type="button" class="chip ${f===k?'on':''}" data-act="sec" data-id="${esc(k)}">${dot||''}${esc(l)}<small>${n}</small></button>`;
  let h = `<div class="toolbar"><label class="search">${ico('search')}<input id="mq" type="search" placeholder="Gericht, Zutat oder Kategorie" value="${esc(view.q)}" autocomplete="off"></label></div>
  <div class="chips-row">${chip('all','Alle',all.length)}${chip('over','Über Ziel',cnt(x=>x.k.fc!=null&&x.k.fc>S.settings.target))}${chip('none','Ohne Rezeptur',cnt(x=>x.k.cost==null))}${chip('nophoto','Ohne Foto',cnt(x=>!menuImg(x.m)))}<span class="sep"></span>${secList().filter(s=>all.some(x=>x.m.section===s)).map(s=>chip(s,s,cnt(x=>x.m.section===s),catDot(s))).join('')}</div>`;
  if(!shown.length) return h + `<div class="panel empty">Keine Gerichte für diesen Filter.</div>`;
  for(const s of secList().filter(s=>shown.some(x=>x.m.section===s))){
    h += `<h2 class="sec-h">${catDot(s)}${esc(s)}</h2><div class="dish-grid">`;
    for(const {m,k} of shown.filter(x=>x.m.section===s)){
      h += `<article class="dish ${k.c?'':'nocard'} ${m.hidden?'is-hidden':''}">
        <div class="dish-ph">${photo(menuImg(m), m.name, m.section)}
          <button type="button" class="ph-btn" data-act="photoMenu" data-id="${m.id}" title="Foto ${menuImg(m)?'ändern':'hinzufügen'}" aria-label="Foto ${menuImg(m)?'ändern':'hinzufügen'}">${ico('camera')}</button>
          <span class="ph-flags">${m.top?'<span class="vb top" title="Empfehlung">★</span>':''}${vegBadge(m.veg)}${m.hidden?'<span class="vb off">ausgeblendet</span>':''}</span></div>
        <button type="button" class="dish-main" data-act="${k.c?'openCard':'newCardFor'}" data-id="${k.c?k.c.id:m.id}">
          <span class="dish-top"><span class="dish-n">${esc(m.name)}</span><span class="price">${eur(m.price)}</span></span>
          ${m.desc?`<span class="dish-d">${esc(m.desc)}</span>`:''}
          <span class="dish-b">${k.c ? `<span class="fcw">${ring(k.fc,34,4)}<span><b class="mono">${pct(k.fc)}</b><small>WE ${eur(k.cost)}</small></span></span>${chips(k.t.alg)}`
            : `<span class="add">${ico('plus')}Rezeptur anlegen</span>`}</span>
        </button>
        <button type="button" class="icon-btn edit" title="Gericht bearbeiten" aria-label="Gericht bearbeiten" data-act="editMenu" data-id="${m.id}">${ico('edit')}</button>
      </article>`;
    }
    h += `</div>`;
  }
  return h;
}

function guestHtml(){
  const g = S.settings.guest;
  const items = menuSorted().filter(m => !m.hidden);
  const used = new Set();
  let body = '';
  for(const s of secList()){
    const list = items.filter(m=>m.section===s); if(!list.length) continue;
    body += `<section class="g-sec"><h3 class="g-h"><span>${esc(s)}</span></h3><div class="g-list">`;
    for(const m of list){
      const k = menuCalc(m); const alg = k.t ? [...k.t.alg].sort() : []; alg.forEach(a=>used.add(a));
      const img = g.photos ? menuImg(m) : '';
      body += `<article class="g-item ${img?'has-ph':''} ${m.top?'is-top':''}">
        ${img ? `<img class="g-ph" src="${IMG[img]}" alt="${esc(m.name)}" loading="lazy">` : ''}
        <div class="g-txt"><div class="g-row"><span class="g-n">${esc(m.name)}${m.veg==='vg'?' <i class="g-mark" title="Vegan">VG</i>':m.veg==='v'?' <i class="g-mark" title="Vegetarisch">V</i>':''}</span><span class="lead"></span><span class="g-p">${fin(+m.price).toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
        ${m.top?`<div class="g-top">★ Empfehlung des Hauses</div>`:''}
        ${g.desc && m.desc ? `<div class="g-d">${esc(m.desc)}</div>` : ''}
        ${g.allergens && alg.length ? `<div class="g-a">${alg.join(' · ')}</div>` : ''}</div>
      </article>`;
    }
    body += `</div></section>`;
  }
  const legend = g.allergens && used.size ? `<div class="g-leg">${[...used].sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : '';
  return `<div class="g-paper g-${g.style}">
    <header class="g-head"><div class="g-mark-logo">DAHUAM<span>.</span>202</div><h2 class="g-title">${esc(g.title)}</h2>${g.subtitle?`<div class="g-sub">${esc(g.subtitle)}</div>`:''}</header>
    ${body || '<p class="g-empty">Noch keine sichtbaren Gerichte.</p>'}
    <footer class="g-foot"><div class="g-keys"><span><i class="g-mark">V</i> vegetarisch</span><span><i class="g-mark">VG</i> vegan</span><span>★ Empfehlung des Hauses</span></div>${legend}<p>${esc(g.footer)}</p></footer>
  </div>`;
}
function renderGuest(){
  const g = S.settings.guest;
  const tog = (k,l) => `<label class="tog"><input type="checkbox" data-gf="${k}" ${g[k]?'checked':''}><span></span>${l}</label>`;
  return `<div class="guest-wrap">
    <aside class="panel guest-tools">
      <div class="panel-h"><h2>Gestaltung</h2></div>
      <div class="f">Stil</div>${seg('gstyle', g.style, GSTYLES)}
      <div class="togs">${tog('photos','Fotos zeigen')}${tog('desc','Beschreibungen')}${tog('allergens','Allergene')}</div>
      <label class="f">Titel<input id="g-title" data-gs="title" value="${esc(g.title)}"></label>
      <label class="f">Untertitel<input id="g-sub" data-gs="subtitle" value="${esc(g.subtitle)}"></label>
      <label class="f">Fußzeile<textarea id="g-foot" data-gs="footer" class="sm-ta">${esc(g.footer)}</textarea></label>
      <p class="hint">Gerichte erscheinen automatisch in ihrer Kategorie. Reihenfolge und Sichtbarkeit legen Sie unter „Aufbau & Reihenfolge“ fest.</p>
      <button type="button" class="btn" data-act="mtab" data-id="layout">${ico('up')}Reihenfolge ändern</button>
    </aside>
    <div class="guest-prev">${guestHtml()}</div>
  </div>`;
}

function renderLayout(){
  const secs = secList();
  return `<div class="layout-intro"><p class="hint" style="margin:0">So ist Ihre Karte aufgebaut. Neue Gerichte landen automatisch in der passenden Kategorie, am Ende der Liste. Mit den Pfeilen ändern Sie die Reihenfolge, mit dem Auge blenden Sie ein Gericht auf der Gästekarte aus.</p>
    <button type="button" class="btn" data-act="addSec">${ico('plus')}Kategorie</button></div>
  <div class="lay">${secs.map((s,si)=>{ const items = menuSorted().filter(m=>m.section===s); return `<section class="panel lay-sec">
    <div class="lay-h"><span class="lay-no mono">${si+1}</span>${catDot(s)}<input class="lay-name" data-secname="${si}" value="${esc(s)}" aria-label="Kategoriename"><span class="muted sm">${items.length}</span>
      <span class="lay-acts"><button type="button" class="icon-btn" data-act="secMove" data-id="${si}:-1" ${si===0?'disabled':''} aria-label="Kategorie nach oben">${ico('up')}</button><button type="button" class="icon-btn" data-act="secMove" data-id="${si}:1" ${si===secs.length-1?'disabled':''} aria-label="Kategorie nach unten">${ico('down')}</button>
      <button type="button" class="icon-btn" data-act="secSort" data-id="${si}" title="Nach Preis sortieren" aria-label="Nach Preis sortieren"><span class="mono" style="font-size:12px">€↑</span></button>
      ${items.length?'':`<button type="button" class="icon-btn danger" data-act="secDel" data-id="${si}" aria-label="Kategorie löschen">${ico('trash')}</button>`}</span></div>
    ${items.length ? `<ol class="lay-list">${items.map((m,i)=>`<li class="${m.hidden?'off':''}">${photo(menuImg(m), m.name, s, 'xs')}<span class="lay-n">${esc(m.name)}</span><span class="mono sm">${eur(m.price)}</span>
      <button type="button" class="icon-btn" data-act="itemMove" data-id="${m.id}:-1" ${i===0?'disabled':''} aria-label="Nach oben">${ico('up')}</button><button type="button" class="icon-btn" data-act="itemMove" data-id="${m.id}:1" ${i===items.length-1?'disabled':''} aria-label="Nach unten">${ico('down')}</button>
      <button type="button" class="icon-btn" data-act="itemHide" data-id="${m.id}" title="${m.hidden?'Auf der Gästekarte zeigen':'Auf der Gästekarte ausblenden'}" aria-label="Sichtbarkeit">${ico(m.hidden?'eyeoff':'eye')}</button></li>`).join('')}</ol>` : '<p class="hint">Leer. Ein Gericht mit dieser Kategorie erscheint hier automatisch.</p>'}
  </section>`; }).join('')}</div>`;
}

/* ---------- Rezepturen ---------- */
function renderCards(){
  const q = view.q.trim().toLowerCase();
  const list = S.cards.filter(c => (view.ctype==='all' || c.type===view.ctype) && (!q || (c.name+' '+c.category).toLowerCase().includes(q)))
    .sort((a,b) => a.type===b.type ? byName(a,b) : (a.type==='semi'?1:-1));
  const n = t => S.cards.filter(c=>t==='all'||c.type===t).length;
  let h = `<div class="page-h"><div><div class="eyebrow">${n('dish')} Gerichte · ${n('semi')} Basisrezepte</div><h1>Rezepturen</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="newCard" data-id="semi">${ico('plus')}Basisrezept</button><button type="button" class="btn primary" data-act="newCard" data-id="dish">${ico('plus')}Gericht</button></div></div>
  <div class="toolbar"><label class="search">${ico('search')}<input id="cq" type="search" placeholder="Rezeptur suchen" value="${esc(view.q)}" autocomplete="off"></label>
    ${seg('ctype', view.ctype, [['all','Alle',n('all')],['dish','Gerichte',n('dish')],['semi','Basisrezepte',n('semi')]])}</div>`;
  if(!list.length) return h + `<div class="panel empty">Keine Rezepturen gefunden. Legen Sie eine mit „Gericht“ an.</div>`;
  h += `<div class="rc-grid">`;
  for(const c of list){
    const t = totals(c);
    const per100 = c.yieldG ? t.cost / c.yieldG * 100 : 0;
    const mk = S.menu.filter(m => m.card === c.id).map(menuCalc)[0];
    h += `<button type="button" class="rc" data-act="openCard" data-id="${c.id}">
      <span class="rc-ph">${photo(c.img, c.name, c.category)}${c.type==='dish' && !mk ? '<span class="vb off">nicht auf der Karte</span>' : ''}</span>
      <span class="rc-body">
      <span class="rc-top"><span class="tag ${c.type}">${c.type==='semi'?'Basisrezept':'Gericht'} · Nr. ${c.no||'—'}</span>${c.type==='dish'?`<span class="fcw sm">${ring(mk?mk.fc:null,28,4)}<b class="mono">${mk?pct(mk.fc):'—'}</b></span>`:''}</span>
      <span class="rc-n">${esc(c.name)}</span>
      <span class="rc-m">${catDot(c.category)}${esc(c.category||'ohne Kategorie')} · ${c.items.length} Zutaten · ${(c.steps||[]).length} Schritte</span>
      <span class="rc-b"><span><b class="mono">${eur(t.cost)}</b><small>${c.type==='semi'?'pro Charge':'pro Portion'}</small></span><span><b class="mono">${eur(per100)}</b><small>pro 100 g</small></span></span>
      </span>
    </button>`;
  }
  return h + `</div>`;
}

function refOptions(sel, selfId){
  const ps = [...S.products].sort(byName);
  const cs = S.cards.filter(c => c.type==='semi' && c.id!==selfId).sort(byName);
  return `<option value="">— Zutat wählen —</option><optgroup label="Produkte">${ps.map(p=>`<option value="p:${p.id}" ${sel==='p:'+p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</optgroup>`
    + (cs.length ? `<optgroup label="Basisrezepte">${cs.map(c=>`<option value="c:${c.id}" ${sel==='c:'+c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</optgroup>` : '');
}
function simHtml(cost, price){
  const np = price/(1+S.settings.vat/100), fc = np ? cost/np*100 : null;
  return `<div class="sim-out"><div class="fcw">${ring(fc,52,6)}<span><b class="mono big2">${pct(fc)}</b><small>Wareneinsatz</small></span></div>
    <div class="kv"><span>Rohertrag exkl. MwSt.</span><span>${eur(np-cost)}</span><span>Aufschlagsfaktor</span><span>${cost?num(np/cost,2)+'×':'—'}</span></div></div>`;
}
function prodHtml(c, n){
  const t = totals(c), f = c.type==='semi' && c.yieldG ? 1 : n;
  const rows = c.items.map((it,i)=>{ const l = t.lines[i]; if(l.missing) return ''; const q = (+it.qty||0)*f; const v = l.unit==='Stk' ? (Math.abs(q - Math.round(q)) < 1e-6 ? num(q)+' Stk' : `${num(Math.ceil(q - 1e-9))} Stk <small class="muted exact">genau ${num(q,2)}</small>`) : q>=1000 ? num(q/1000,2)+(l.unit==='ml'?' l':' kg') : num(q)+' '+l.unit; return `<li><span>${esc(l.name)}</span><b class="mono">${v}</b></li>`; }).join('');
  return `<ul class="plist">${rows}</ul><div class="kv"><span>Wareneinsatz gesamt</span><span>${eur(t.cost*f)}</span></div>`;
}

function renderCard(c){
  const t = totals(c);
  const per100 = c.yieldG ? t.cost / c.yieldG * 100 : 0;
  const menus = S.menu.filter(m => m.card === c.id);
  const m0 = menus[0], k0 = m0 ? menuCalc(m0) : null;
  const cats = [...new Set([...secList(), ...S.cards.map(x=>x.category)].filter(Boolean))];
  const usedIn = usage('c:'+c.id);
  const vat = 1 + S.settings.vat/100;
  const rec = t.cost / (S.settings.target/100) * vat;
  const parts = t.lines.map(l=>({n:l.name, v:l.cost})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  const top = parts.slice(0,5), rest = parts.slice(5).reduce((s,x)=>s+x.v,0), sum = t.cost || 1;
  const base = m0 ? +m0.price : Math.round(rec*10)/10;
  if(!view.sim || view.sim.id !== c.id) view.sim = {id:c.id, price:base};
  const smin = Math.max(1, Math.floor(t.cost*vat*1.2)), smax = Math.max(smin+5, Math.ceil(Math.max(base, rec)*1.6));
  const steps = c.steps || [];

  const rows = c.items.map((it,i) => { const l = t.lines[i]; return `<tr>
      <td class="c-ing"><select id="ref-${i}" data-li="${i}" data-lf="ref" aria-label="Zutat">${refOptions(it.ref, c.id)}</select></td>
      <td class="r"><span class="qty"><input id="qty-${i}" class="num-in" type="text" inputmode="decimal" data-li="${i}" data-lf="qty" value="${numIn(it.qty)}" aria-label="Brutto"><em>${l.unit}</em></span></td>
      <td class="r"><input id="net-${i}" class="num-in" type="text" inputmode="decimal" data-li="${i}" data-lf="net" value="${numIn(it.net)}" placeholder="${num(l.netAuto,1)}" aria-label="Netto in g"></td>
      <td class="r mono">${num(l.out,1)}</td>
      <td class="r mono">${eur(l.cost)}<span class="share" style="width:${(l.cost/sum*100).toFixed(1)}%"></span></td>
      <td><button type="button" class="icon-btn" data-act="delLine" data-id="${i}" title="Zeile entfernen" aria-label="Zeile entfernen">${ico('x')}</button></td></tr>`; }).join('');

  const stepsHtml = steps.map((s,i)=>`<li class="step">
      <span class="step-no">${i+1}</span>
      <div class="step-body"><textarea id="st-${i}" data-step="${i}" rows="2" aria-label="Zubereitung Schritt ${i+1}" placeholder="Was passiert in diesem Schritt?">${esc(s.t)}</textarea>
        ${s.img && IMG[s.img] ? `<div class="step-ph"><img src="${IMG[s.img]}" alt="Schritt ${i+1}"><button type="button" class="ph-btn" data-act="stepPhoto" data-id="${i}" aria-label="Foto ändern">${ico('camera')}</button><button type="button" class="ph-btn del" data-act="stepPhotoDel" data-id="${i}" aria-label="Foto entfernen">${ico('x')}</button></div>`
          : `<button type="button" class="btn sm ghost" data-act="stepPhoto" data-id="${i}">${ico('camera')}Foto</button>`}</div>
      <div class="step-acts"><button type="button" class="icon-btn" data-act="stepMove" data-id="${i}:-1" ${i===0?'disabled':''} aria-label="Nach oben">${ico('up')}</button><button type="button" class="icon-btn" data-act="stepMove" data-id="${i}:1" ${i===steps.length-1?'disabled':''} aria-label="Nach unten">${ico('down')}</button><button type="button" class="icon-btn" data-act="stepDel" data-id="${i}" aria-label="Schritt löschen">${ico('trash')}</button></div>
    </li>`).join('');

  return `<button type="button" class="back" data-act="backCards">${ico('arrow')}Alle Rezepturen</button>
  <div class="hero">
    <div class="hero-ph">${photo(c.img, c.name, c.category)}<button type="button" class="ph-btn big" data-act="photoCard" data-id="${c.id}">${ico('camera')}<span>${c.img&&IMG[c.img]?'Foto ändern':'Foto hinzufügen'}</span></button>${c.img&&IMG[c.img]?`<button type="button" class="ph-btn del" data-act="photoCardDel" data-id="${c.id}" aria-label="Foto entfernen">${ico('x')}</button>`:''}</div>
    <div class="hero-main">
      <div class="eyebrow">${c.type==='semi'?'Basisrezept':'Gericht'} · Rezeptur Nr. ${c.no||'—'} · ${esc(c.category||'ohne Kategorie')}</div>
      <textarea id="cf-name" class="title-in" data-cf="name" rows="1" aria-label="Bezeichnung">${esc(c.name)}</textarea>
      <div class="hero-stats">
        <div><b class="mono">${eur(t.cost)}</b><small>Wareneinsatz ${c.type==='semi'?'pro Charge':'pro Portion'}</small></div>
        <div><b class="mono">${+c.yieldG > 0 ? eur(per100) : '—'}</b><small>pro 100 g</small></div>
        ${c.type==='semi' && c.yieldG ? `<div><b class="mono">${eur(t.cost/c.yieldG*1000)}</b><small>pro kg</small></div>` : ''}
        ${k0 ? `<div><b class="mono">${eur(m0.price)}</b><small>Verkaufspreis</small></div>` : ''}
      </div>
      ${c.type==='dish' && !m0 ? `<button type="button" class="btn primary sm" data-act="toMenu" data-id="${c.id}" style="margin-top:14px">${ico('plus')}Auf die Karte setzen</button>` : ''}
    </div>
    ${c.type==='dish' ? `<div class="hero-ring">${ring(k0?k0.fc:null,112,10)}<span><b class="mono">${k0?pct(k0.fc):'—'}</b><small>${k0?'Wareneinsatz':'nicht auf der Karte'}</small></span></div>` : ''}
    <div class="hero-acts">
      ${FRAMED ? '' : `<button type="button" class="icon-btn lg" data-act="printCard" data-id="${c.id}" title="Rezeptur drucken" aria-label="Rezeptur drucken">${ico('print')}</button>`}
      <button type="button" class="icon-btn lg" data-act="dupCard" data-id="${c.id}" title="Duplizieren" aria-label="Duplizieren">${ico('copy')}</button>
      <button type="button" class="icon-btn lg danger" data-act="delCard" data-id="${c.id}" title="Löschen" aria-label="Löschen">${ico('trash')}</button>
    </div>
  </div>
  <div class="grid2">
    <div class="col">
      <section class="panel"><div class="fields">
        <label class="f">Typ<select id="cf-type" data-cf="type"><option value="dish" ${c.type==='dish'?'selected':''}>Gericht</option><option value="semi" ${c.type==='semi'?'selected':''}>Basisrezept</option></select></label>
        <label class="f">Kategorie<input id="cf-category" data-cf="category" list="cats" value="${esc(c.category)}"><datalist id="cats">${cats.map(x=>`<option value="${esc(x)}">`).join('')}</datalist></label>
        <label class="f">${c.type==='semi'?'Ausbeute Charge, g':'Portionsgewicht, g'}<input id="cf-yieldG" class="num-in" data-cf="yieldG" type="text" inputmode="decimal" data-msg="Ungültiges Gewicht, nicht geändert" value="${numIn(c.yieldG)}" placeholder="${num(t.out)}"></label>
      </div></section>
      <section class="panel flush">
        <div class="panel-h pad"><h2>Zutaten ${c.type==='semi'?'pro Charge':'pro Portion'}</h2><span class="muted sm">${c.items.length} Positionen</span></div>
        <div class="tbl-wrap"><table class="edit">
          <thead><tr><th>Zutat</th><th class="r">Brutto</th><th class="r">Netto, g</th><th class="r">Fertig, g</th><th class="r">Betrag</th><th></th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6" class="muted">Erste Zutat hinzufügen.</td></tr>`}</tbody>
          <tfoot><tr><td>Summe</td><td class="r mono">${num(t.gross)} g</td><td class="r mono">${num(t.net)}</td><td class="r mono">${num(t.out)}</td><td class="r mono">${eur(t.cost)}</td><td></td></tr></tfoot>
        </table></div>
        <div class="panel-f"><button type="button" class="btn" data-act="addLine">${ico('plus')}Zutat</button><span class="hint">Netto ergibt sich aus dem Putzverlust. Eigenen Wert einfach überschreiben.</span></div>
      </section>
      <section class="panel">
        <div class="panel-h"><h2>Zubereitung</h2><span class="muted sm">${steps.length} Schritte</span></div>
        <ol class="steps">${stepsHtml || '<li class="hint">Noch keine Schritte.</li>'}</ol>
        <button type="button" class="btn" data-act="stepAdd">${ico('plus')}Schritt</button>
      </section>
    </div>
    <div class="col">
      ${c.type==='dish' ? `<section class="panel accent">
        <div class="panel-h"><h2>Preis-Simulator</h2><span class="muted sm">inkl. ${num(S.settings.vat)} % MwSt.</span></div>
        <div class="sim-price"><b class="mono" id="simVal">${eur(view.sim.price)}</b>${m0?`<button type="button" class="btn sm" data-act="applySim" data-id="${m0.id}" id="simApply" ${Math.abs(view.sim.price-m0.price)<0.05?'hidden':''}>Übernehmen</button>`:''}</div>
        <input id="sim" type="range" min="${smin}" max="${smax}" step="0.1" value="${view.sim.price}" aria-label="Verkaufspreis">
        <div class="range-l"><span>${eur(smin)}</span><span>${eur(smax)}</span></div>
        <div id="simOut">${simHtml(t.cost, +view.sim.price)}</div>
        <p class="hint">Für ${num(S.settings.target)} % Wareneinsatz: <button type="button" class="link" data-act="simTo" data-id="${rec.toFixed(1)}">${eur(rec)}</button></p>
      </section>` : ''}
      <section class="panel">
        <div class="panel-h"><h2>Kostenstruktur</h2></div>
        <div class="stackbar">${top.map((x,i)=>`<i style="width:${(x.v/sum*100).toFixed(2)}%;background:var(--s${i+1})" title="${esc(x.n)}"></i>`).join('')}${rest?`<i style="flex:1;background:var(--s7)"></i>`:''}</div>
        <ul class="leg">${top.map((x,i)=>`<li><span class="sw" style="background:var(--s${i+1})"></span><span class="ln">${esc(x.n)}</span><span class="mono">${num(x.v/sum*100,0)} %</span></li>`).join('')}${rest?`<li><span class="sw" style="background:var(--s7)"></span><span class="ln muted">Rest</span><span class="mono">${num(rest/sum*100,0)} %</span></li>`:''}</ul>
      </section>
      <section class="panel">
        <div class="panel-h"><h2>Produktionsmenge</h2>${c.type==='dish'?`<label class="portions"><input id="portions" type="number" min="1" step="1" value="${view.portions}" aria-label="Portionen"> Portionen</label>`:'<span class="muted sm">1 Charge</span>'}</div>
        <div id="prodOut">${prodHtml(c, view.portions)}</div>
      </section>
      <section class="panel">
        <div class="panel-h"><h2>Allergene</h2><span class="muted sm">EU-VO 1169/2011</span></div>
        ${t.alg.size ? `<div class="alg-big">${[...t.alg].sort().map(a=>`<span><b>${esc(a)}</b>${esc(ALG[a]||a)}</span>`).join('')}</div>` : '<p class="hint">Keine gefunden. Bitte die Produktdaten prüfen.</p>'}
      </section>
      ${c.type==='semi' ? `<section class="panel"><div class="panel-h"><h2>Verwendet in</h2></div>
        ${usedIn.length ? `<ul class="todo">${usedIn.map(u=>`<li><button type="button" data-act="openCard" data-id="${u.id}"><span>${esc(u.name)}</span>${ico('arrow','flip')}</button></li>`).join('')}</ul>` : '<p class="hint">Noch in keiner Rezeptur verwendet.</p>'}
      </section>` : ''}
    </div>
  </div>`;
}

/* ---------- Lager ---------- */
function renderStock(){
  const low = lowStock(), last = S.inventories[0];
  const week = S.moves.filter(m => m.type==='in' && (Date.now()-new Date(m.date))/864e5 <= 7).reduce((s,m)=>s+m.qty*m.price, 0);
  const head = `<div class="page-h"><div><div class="eyebrow">${stockProducts().length} Artikel · ${Object.keys(LOCS).length} Lagerorte</div><h1>Lager</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="sales">${ico('cart')}Verkäufe buchen</button><button type="button" class="btn" data-act="moveDlg" data-id="waste">${ico('trash')}Schwund</button><button type="button" class="btn primary" data-act="moveDlg" data-id="in">${ico('truck')}Wareneingang</button></div></div>
  ${demoNote()}
  <div class="tiles">
    <div class="tile"><div><div class="t-v">${eur(stockValue())}</div><div class="t-l">Lagerwert</div><div class="t-s">zu Einkaufspreisen</div></div></div>
    <button type="button" class="tile click" data-act="stab" data-id="bestellung"><div><div class="t-v ${low.length?'bad-t':'good-t'}">${low.length}</div><div class="t-l">unter Mindestbestand</div><div class="t-s">${low.length?'Bestellvorschlag →':'Alles vorrätig'}</div></div></button>
    <div class="tile"><div><div class="t-v">${eur(week)}</div><div class="t-l">Wareneingang 7 Tage</div><div class="t-s">${S.moves.filter(m=>m.type==='in').length} Lieferungen gesamt</div></div></div>
    <button type="button" class="tile click" data-act="stab" data-id="inventur"><div><div class="t-v ${last&&last.diff<0?'bad-t':''}">${last?eur(last.diff):'—'}</div><div class="t-l">Differenz letzte Inventur</div><div class="t-s">${S.invDraft?'Inventur läuft →':last?fmtDate(last.date):'Noch keine Inventur'}</div></div></button>
  </div>
  <div class="toolbar">${seg('stab', view.stab, [['bestand','Bestand'],['buchungen','Buchungen',S.moves.length],['inventur','Inventur'],['bestellung','Bestellung',low.length]])}</div>`;
  return head + ({bestand:stockList, buchungen:moveList, inventur:invView, bestellung:orderView}[view.stab] || stockList)();
}
function levelBar(p){ const s = +p.stock||0, mn = +p.minStock||0; const w = mn ? Math.min(100, s/(mn*2)*100) : 100; const cls = mn && s < mn*0.5 ? 'bad' : mn && s < mn ? 'warn' : 'good'; return `<span class="lvl"><i class="${cls}" style="width:${w.toFixed(1)}%"></i>${mn?`<em style="left:50%"></em>`:''}</span>`; }
function stockList(){
  const q = view.pq.trim().toLowerCase();
  const all = stockProducts();
  const list = all.filter(p => (view.loc==='all' || p.loc===view.loc) && (!q || (p.name+' '+p.supplier).toLowerCase().includes(q))).sort((a,b)=> (a.loc||'').localeCompare(b.loc||'') || byName(a,b));
  const chip = (k,l,n) => `<button type="button" class="chip ${view.loc===k?'on':''}" data-act="loc" data-id="${k}">${l}<small>${n}</small></button>`;
  return `<div class="toolbar"><label class="search">${ico('search')}<input id="pq" type="search" placeholder="Artikel oder Lieferant" value="${esc(view.pq)}" autocomplete="off"></label></div>
  <div class="chips-row">${chip('all','Alle Lagerorte',all.length)}${Object.entries(LOCS).map(([k,l])=>chip(k,l,all.filter(p=>p.loc===k).length)).join('')}</div>
  <section class="panel flush"><div class="tbl-wrap"><table class="stock">
    <thead><tr><th>Artikel</th><th>Lagerort</th><th>Füllstand</th><th class="r">Bestand</th><th class="r">Mindest</th><th class="r">Wert</th><th></th></tr></thead>
    <tbody>${list.map(p=>{ const low = (+p.minStock||0) && (+p.stock||0) < +p.minStock; return `<tr class="row ${low?'is-low':''}" data-act="editProd" data-id="${p.id}">
      <td><b class="pn">${esc(p.name)}</b><small class="muted">${esc(p.supplier||'kein Lieferant')}</small></td>
      <td><span class="tag">${esc(LOCS[p.loc]||'—')}</span></td>
      <td>${levelBar(p)}</td>
      <td class="r mono ${(+p.stock||0)<0?'bad-t':''}">${qtyFmt(+p.stock||0,p)}</td>
      <td class="r mono muted">${qtyFmt(+p.minStock||0,p)}</td>
      <td class="r mono">${eur(Math.max(0,+p.stock||0)*(+p.price||0))}</td>
      <td class="nowrap"><button type="button" class="icon-btn" data-act="moveDlg" data-id="in:${p.id}" title="Wareneingang" aria-label="Wareneingang">${ico('plus')}</button><button type="button" class="icon-btn" data-act="moveDlg" data-id="out:${p.id}" title="Entnahme" aria-label="Entnahme">${ico('minus')}</button><button type="button" class="icon-btn" data-act="editProd" data-id="${p.id}" title="Artikel bearbeiten" aria-label="Artikel bearbeiten">${ico('edit')}</button></td>
    </tr>`; }).join('') || '<tr><td colspan="7" class="muted">Nichts gefunden.</td></tr>'}</tbody>
    <tfoot><tr><td colspan="5">Summe ${view.loc==='all'?'':esc(LOCS[view.loc])}</td><td class="r mono">${eur(list.reduce((s,p)=>s+Math.max(0,+p.stock||0)*(+p.price||0),0))}</td><td></td></tr></tfoot>
  </table></div></section>`;
}
function movesByDate(){ return S.moves.map((m,i)=>[m,i]).sort((a,b) => String(b[0].date).localeCompare(String(a[0].date)) || a[1]-b[1]).map(x=>x[0]); }
function moveList(){
  const t = view.mtype;
  const all = movesByDate().filter(m => t==='all' || m.type===t);
  const chip = (k,l) => `<button type="button" class="chip ${t===k?'on':''}" data-act="mtype" data-id="${k}">${l}<small>${k==='all'?S.moves.length:S.moves.filter(m=>m.type===k).length}</small></button>`;
  const undo = (id, lbl) => `<button type="button" class="icon-btn" data-act="moveUndo" data-id="${id}" title="Stornieren" aria-label="${lbl}">${ico('undo')}</button>`;
  const seen = new Set(); const out = [];
  for(const m of all){
    if(out.length >= 300) break;
    if(m.grp){ if(seen.has(m.grp)) continue; seen.add(m.grp);
      const ms = all.filter(x => x.grp === m.grp); const g = (S.saleGroups||{})[m.grp] || {}; const val = ms.reduce((a,x)=>a+x.qty*x.price,0);
      out.push(`<li class="mv-grp"><span class="mv-d mono">${fmtDate(m.date)}</span><span class="mvt ${m.type}">${MOVE[m.type]}</span>
        <span class="mv-n"><b>${g.n ? `${num(g.n)} ${g.n===1?'Portion':'Portionen'}` : esc(m.note||'Sammelbuchung')}</b><details class="mv-det"><summary>${ms.length} Artikel abgebucht${g.gross ? ` · Umsatz ${eur(g.gross)}` : ''}</summary><ul>${ms.map(x=>{ const p = P(x.pid); return `<li><span>${esc(p?p.name:'gelöschter Artikel')}</span><span class="mono">${qtyFmt(x.qty,p)}</span></li>`; }).join('')}</ul></details></span>
        <span class="mv-q mono muted">${ms.length} Pos.</span><span class="mv-v mono">${eur(val)}</span>${undo(m.id, 'Verkaufsbuchung stornieren')}</li>`); continue; }
    const p = P(m.pid);
    out.push(`<li><span class="mv-d mono">${fmtDate(m.date)}</span><span class="mvt ${m.type}">${MOVE[m.type]}</span>
    <span class="mv-n"><b>${esc(p?p.name:'gelöschter Artikel')}</b>${m.note?`<small class="muted">${esc(m.note)}</small>`:''}</span>
    <span class="mv-q mono ${m.qty<0?'bad-t':'good-t'}">${m.qty>0?'+':''}${qtyFmt(m.qty,p)}</span>
    <span class="mv-v mono">${eur(m.qty*m.price)}</span>${undo(m.id, 'Buchung stornieren')}</li>`);
  }
  return `<div class="chips-row">${chip('all','Alle')}${Object.entries(MOVE).map(([k,l])=>chip(k,l)).join('')}</div>
  <section class="panel flush">${out.length ? `<ul class="moves">${out.join('')}</ul>` : '<div class="empty">Noch keine Buchungen.</div>'}</section>`;
}
function invView(){
  const d = S.invDraft;
  if(!d){
    return `<div class="grid2"><section class="panel accent"><div class="panel-h"><h2>Neue Inventur</h2></div>
      <p class="dlg-p">Die Zählliste ist nach Lagerorten sortiert, so gehen Sie einmal durch Kühlhaus, Tiefkühler und Lager. Tragen Sie die gezählte Menge ein; Differenzen in Menge und Euro erscheinen sofort. Nicht gezählte Artikel bleiben unverändert.</p>
      <div class="row-btns" style="margin-top:14px"><button type="button" class="btn primary" data-act="invStart">${ico('clip')}Inventur starten</button></div></section>
      <section class="panel"><div class="panel-h"><h2>Bisherige Inventuren</h2></div>
      ${S.inventories.length ? `<ul class="todo">${S.inventories.map(i=>`<li><div class="inv-h"><span><b class="mono">${fmtDate(i.date)}</b><small class="muted">${i.counted} Artikel gezählt${i.demo?' · Demo':''}</small></span><span class="r"><b class="mono">${eur(i.value)}</b><small class="mono ${i.diff<0?'bad-t':'good-t'}">${signedEur(i.diff)}</small></span></div></li>`).join('')}</ul>` : '<p class="hint">Noch keine abgeschlossene Inventur.</p>'}
      </section></div>`;
  }
  const items = stockProducts().sort((a,b)=>(a.loc||'').localeCompare(b.loc||'') || byName(a,b));
  const done = items.filter(p => d.counts[p.id] !== undefined && d.counts[p.id] !== '').length;
  const diffSum = items.reduce((s,p)=>{ const c = d.counts[p.id]; return c===undefined||c==='' ? s : s + (c-(+p.stock||0))*(+p.price||0); }, 0);
  let h = `<section class="panel inv-bar"><div><div class="eyebrow">Inventur seit ${fmtDate(d.date)}</div><b class="mono" id="invProg">${done} / ${items.length}</b> gezählt · Differenz <b class="mono ${diffSum<0?'bad-t':''}" id="invDiff">${signedEur(diffSum)}</b>
    <div class="meter"><i id="invMeter" style="width:${(done/items.length*100).toFixed(1)}%"></i></div></div>
    <div class="row-btns"><button type="button" class="btn" data-act="invCancel">Verwerfen</button><button type="button" class="btn primary" data-act="invFinish">Inventur abschließen</button></div></section>`;
  for(const [k,l] of Object.entries(LOCS)){
    const list = items.filter(p=>p.loc===k); if(!list.length) continue;
    h += `<h2 class="sec-h">${esc(l)}<small class="muted sm">${list.length} Artikel</small></h2><section class="panel flush"><div class="tbl-wrap"><table class="inv">
      <thead><tr><th>Artikel</th><th class="r">Soll</th><th class="r">Ist gezählt</th><th class="r">Differenz</th><th class="r">Wert</th></tr></thead><tbody>
      ${list.map(p=>{ const c = d.counts[p.id]; const has = c!==undefined && c!==''; const df = has ? c-(+p.stock||0) : 0; return `<tr id="ir-${p.id}" class="${has?'counted':''}">
        <td><b class="pn">${esc(p.name)}</b></td><td class="r mono muted">${qtyFmt(+p.stock||0,p)}</td>
        <td class="r"><span class="qty"><input id="inv-${p.id}" class="num-in" type="text" inputmode="decimal" data-num="de" data-msg="Ungültige Zählmenge, nicht übernommen" data-inv="${p.id}" data-old="${has?numIn(c):''}" value="${has?numIn(c):''}" placeholder="—" aria-label="Gezählt ${esc(p.name)}"><em>${esc(p.unit)}</em></span></td>
        <td class="r mono idf ${df<0?'bad-t':df>0?'good-t':''}">${has?(df>0?'+':'')+qtyFmt(df,p):''}</td><td class="r mono idv ${df<0?'bad-t':df>0?'good-t':''}">${has?eur(df*(+p.price||0)):''}</td></tr>`; }).join('')}
      </tbody></table></div></section>`;
  }
  return h;
}
function invUpdate(pid){
  const d = S.invDraft, p = P(pid), row = $('#ir-'+pid); const c = d.counts[pid]; const has = c!==undefined && c!=='';
  const df = has ? c-(+p.stock||0) : 0; const cls = df<0?'bad-t':df>0?'good-t':'';
  row.classList.toggle('counted', has);
  const a = row.querySelector('.idf'), b = row.querySelector('.idv'); a.className = 'r mono idf '+cls; b.className = 'r mono idv '+cls;
  a.textContent = has ? (df>0?'+':'')+qtyFmt(df,p) : ''; b.textContent = has ? eur(df*(+p.price||0)) : '';
  const items = stockProducts(); const done = items.filter(x => d.counts[x.id] !== undefined && d.counts[x.id] !== '').length;
  const sum = items.reduce((s,x)=>{ const v = d.counts[x.id]; return v===undefined||v==='' ? s : s + (v-(+x.stock||0))*(+x.price||0); }, 0);
  $('#invProg').textContent = `${done} / ${items.length}`; $('#invDiff').textContent = signedEur(sum); $('#invDiff').className = 'mono '+(sum<0?'bad-t':''); $('#invMeter').style.width = (done/items.length*100).toFixed(1)+'%';
}
function orderView(){
  const low = lowStock();
  if(!low.length) return `<section class="panel empty">Alle Artikel sind über dem Mindestbestand. Mindestbestände stellen Sie im Artikel ein.</section>`;
  const groups = {}; low.forEach(p => { const s = p.supplier || 'Ohne Lieferant'; (groups[s] = groups[s] || []).push(p); });
  return `<p class="hint" style="margin:0 0 14px">Vorschlag: auffüllen auf den doppelten Mindestbestand. Mengen anpassen, Text kopieren und per Mail oder WhatsApp senden. Kommt die Lieferung, buchen Sie sie mit einem Klick ein.</p>
  <div class="ord-grid">${Object.entries(groups).map(([s,list])=>`<section class="panel">
    <div class="panel-h"><h2>${ico('truck')} ${esc(s)}</h2><span class="muted sm">${list.length} Artikel</span></div>
    <ul class="ord">${list.map(p=>{ const q = view.order[p.id] ?? orderSuggest(p); return `<li><span><b>${esc(p.name)}</b><small class="muted">Bestand ${qtyFmt(+p.stock||0,p)} · Mindest ${qtyFmt(+p.minStock||0,p)}</small></span>
      <span class="qty"><input id="ord-${p.id}" type="number" step="any" min="0" data-ord="${p.id}" value="${q}" aria-label="Bestellmenge"><em>${esc(p.unit)}</em></span></li>`; }).join('')}</ul>
    <div class="kv"><span>Geschätzter Einkauf</span><span>${eur(list.reduce((t,p)=>t+(view.order[p.id] ?? orderSuggest(p))*(+p.price||0),0))}</span></div>
    <div class="row-btns" style="margin-top:12px"><button type="button" class="btn" data-act="ordCopy" data-id="${esc(s)}">${ico('copy')}Bestelltext</button><button type="button" class="btn primary" data-act="ordBook" data-id="${esc(s)}">${ico('truck')}Lieferung einbuchen</button></div>
  </section>`).join('')}</div>`;
}
function orderText(s){
  const list = lowStock().filter(p => (p.supplier||'Ohne Lieferant')===s);
  return `Bestellung ${S.settings.name}\nLieferant: ${s}\nGewünschte Lieferung: ________\n\n${list.map(p=>`• ${p.name}: ${num(view.order[p.id] ?? orderSuggest(p),2)} ${p.unit}`).join('\n')}\n\nDanke und liebe Grüße\nKüche ${S.settings.name}`;
}

/* ---------- Produkte ---------- */
function renderProducts(){
  const q = view.pq.trim().toLowerCase();
  const list = S.products.filter(p => !q || p.name.toLowerCase().includes(q)).sort(byName);
  return `<div class="page-h"><div><div class="eyebrow">${S.products.length} Produkte · Preise exkl. MwSt.</div><h1>Produkte</h1></div>
    <button type="button" class="btn primary" data-act="newProd">${ico('plus')}Produkt</button></div>
  ${demoNote()}
  <div class="toolbar"><label class="search">${ico('search')}<input id="pq" type="search" placeholder="Produkt suchen" value="${esc(view.pq)}" autocomplete="off"></label></div>
  <section class="panel flush"><div class="tbl-wrap"><table class="prods">
    <thead><tr><th>Produkt</th><th class="r">Preis €</th><th class="r">Putzverlust</th><th class="r">Garverlust</th><th>Allergene</th><th class="r">Rezepturen</th><th></th></tr></thead>
    <tbody>${list.map(p=>{ const u = usage('p:'+p.id).length; return `<tr>
      <td><b class="pn">${esc(p.name)}</b><small class="muted">${p.unit==='Stk'&&p.pieceG?`je Stk · ${num(p.pieceG)} g`:`je ${esc(p.unit)}`}${p.supplier?' · '+esc(p.supplier):''}</small></td>
      <td class="r"><span class="qty"><input id="pp-${p.id}" type="number" step="0.01" min="0" inputmode="decimal" data-pp="${p.id}" data-pf="price" value="${esc(p.price)}" aria-label="Preis"><em>€</em></span></td>
      <td class="r"><span class="qty"><input id="plc-${p.id}" type="number" step="any" min="0" max="100" data-pp="${p.id}" data-pf="lossCold" value="${esc(p.lossCold)}" aria-label="Putzverlust"><em>%</em></span></td>
      <td class="r"><span class="qty"><input id="plh-${p.id}" type="number" step="any" min="0" max="100" data-pp="${p.id}" data-pf="lossHot" value="${esc(p.lossHot)}" aria-label="Garverlust"><em>%</em></span></td>
      <td>${chips(new Set(algList(p.alg)))}</td>
      <td class="r"><span class="cnt ${u?'':'zero'}">${u}</span></td>
      <td><button type="button" class="icon-btn" data-act="editProd" data-id="${p.id}" title="Bearbeiten" aria-label="Produkt bearbeiten">${ico('edit')}</button></td>
    </tr>`; }).join('') || `<tr><td colspan="7" class="muted">Nichts gefunden.</td></tr>`}</tbody>
  </table></div></section>
  <p class="hint">Preis ändern, und Wareneinsatz aller Rezepturen und der ganzen Speisekarte wird sofort neu berechnet.</p>`;
}

/* ---------- Einstellungen ---------- */
function renderSetup(){
  const n = Object.keys(IMG).length;
  return `<div class="page-h"><div><div class="eyebrow">Betrieb & Daten</div><h1>Einstellungen</h1></div></div>
  <div class="grid2">
    <section class="panel"><div class="panel-h"><h2>Kalkulation</h2></div><div class="fields">
      <label class="f">Name des Betriebs<input id="s-name" data-sf="name" value="${esc(S.settings.name)}"></label>
      <label class="f">MwSt. Speisen, %<input id="s-vat" data-sf="vat" type="number" step="any" min="0" value="${esc(S.settings.vat)}"></label>
      <label class="f">Ziel-Wareneinsatz, %<input id="s-target" data-sf="target" type="number" step="any" min="1" value="${esc(S.settings.target)}"></label>
    </div><p class="hint">In Österreich gilt für Speisen der ermäßigte Steuersatz von 10 %. Der Wareneinsatz wird vom Preis exkl. MwSt. berechnet.</p></section>
    <section class="panel"><div class="panel-h"><h2>Daten</h2><span class="muted sm">${n} Fotos gespeichert</span></div>
      <p class="hint">Daten und Fotos werden nur in diesem Browser gespeichert. Erstellen Sie regelmäßig eine Sicherung und übertragen Sie sie per Import auf andere Geräte.</p>
      <div class="row-btns wrap" style="margin-top:12px"><button type="button" class="btn" data-act="export">Sicherung erstellen</button>
        <label class="btn" for="importFile">Sicherung laden</label><input id="importFile" type="file" accept="application/json,.json" hidden>
        <button type="button" class="btn danger" data-act="reset">Demodaten wiederherstellen</button></div>
    </section>
  </div>`;
}

/* ---------- Dialoge ---------- */
function openDialog(title, body, onOk, opts={}){
  const f = $('#dlgForm'), d = $('#dlg');
  f.oninput = null; f.onclick = null; delete f.dataset.force;
  f.innerHTML = `<div class="dlg-h"><h3>${esc(title)}</h3><button type="button" class="icon-btn" id="dlgX" aria-label="Schließen">${ico('x')}</button></div>${body}<div class="dlg-actions">${opts.del?'<button type="button" class="btn danger" id="dlgDel">Löschen</button>':''}<span class="sp"></span><button type="button" class="btn" id="dlgCancel">${opts.cancel||'Abbrechen'}</button>${onOk?`<button type="submit" class="btn primary">${opts.ok||'Speichern'}</button>`:''}</div>`;
  f.onsubmit = e => { e.preventDefault();
    // Zahlenfelder: Komma oder Punkt, nie negativ; erst prüfen, dann für den Handler normalisieren
    const nums = [...f.querySelectorAll('input.num-in')]; const shown = nums.map(i => i.value); let bad = null;
    f.querySelectorAll('.f-err').forEach(n => n.remove());
    nums.forEach(i => { i.classList.remove('bad-in'); const raw = i.value.trim(); if(raw === '') return; const v = numParse(raw); const min = i.dataset.min != null ? +i.dataset.min : 0, max = i.dataset.max != null ? +i.dataset.max : Infinity; if(!isFinite(v) || v < min || v > max){ i.classList.add('bad-in'); bad = bad || i; } });
    if(bad){ dlgErr(bad, bad.dataset.msg || 'Bitte eine gültige Zahl eingeben, zum Beispiel 12,5. Negative Werte sind nicht möglich.'); return; }
    nums.forEach(i => { if(i.value.trim() !== '') i.value = String(numParse(i.value)); });
    let r; try { r = onOk ? onOk(new FormData(f), f) : undefined; } finally { nums.forEach((i,k) => { if(i.isConnected) i.value = shown[k]; }); }
    if(r === false) return;
    d.close(); save(); render(); if(opts.toast!==false) toast(typeof opts.done==='function' ? opts.done() : (opts.done||'Gespeichert')); };
  $('#dlgCancel').onclick = $('#dlgX').onclick = () => d.close();
  if(opts.del) $('#dlgDel').onclick = () => { d.close(); opts.del(); };
  d.showModal();
  opts.after && opts.after(f);
}
/* Hinweis direkt am Feld; Dialog bleibt offen */
function dlgErr(input, msg){
  const f = $('#dlgForm'); if(typeof input === 'string') input = f.elements[input] || f.querySelector(input);
  f.querySelectorAll('.f-err').forEach(n => n.remove());
  const el = document.createElement('small'); el.className = 'f-err'; el.setAttribute('role','alert'); el.textContent = msg;
  if(input && input.insertAdjacentElement){ input.classList.add('bad-in'); (input.closest('.qty') || input).insertAdjacentElement('afterend', el); input.focus(); const off = () => { input.classList.remove('bad-in'); input.removeEventListener('input', off); }; input.addEventListener('input', off); }
  else f.querySelector('.dlg-actions').insertAdjacentElement('beforebegin', el);
  return false;
}
/* Klick neben den Dialog schließt ihn (nicht, wenn eine Textmarkierung hinausgezogen wird) */
(() => { const d = $('#dlg'); if(!d) return; let down = false;
  const outside = e => { const r = d.getBoundingClientRect(); return e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom); };
  d.addEventListener('pointerdown', e => { down = outside(e); });
  d.addEventListener('click', e => { if(down && outside(e)) d.close(); down = false; }); })();
function signedEur(n){ n = fin(n); return (n > 0.004 ? '+' : n < -0.004 ? '−' : '') + eur(Math.abs(n)); }
function plural(n, one, many){ return `${num(n)} ${n === 1 ? one : many}`; }
function dateTooFar(ds){ return !!ds && ds > addDays(todayStr(), 1); }
function ask(text, yes, ok='Löschen'){ openDialog('Bitte bestätigen', `<p class="dlg-p">${esc(text)}</p>`, () => { yes(); }, {ok, done: ok==='Löschen'?'Gelöscht':'Erledigt'}); }
function info(title, text){ openDialog(title, `<p class="dlg-p">${esc(text)}</p>`, null, {cancel:'OK'}); }

function menuDialog(m, prefill){
  const isNew = !m; m = m || {id:uid('m'), section:'', name:'', desc:'', price:'', card:'', img:'', veg:'', top:false, hidden:false, ...(prefill||{})};
  if(isNew && !m.section && !['all','none','over','nophoto'].includes(view.sec)) m.section = view.sec;
  let img = m.img;
  const opts = S.cards.filter(c=>c.type==='dish').sort(byName);
  const thumb = () => img && IMG[img] ? `<img src="${IMG[img]}" alt="">` : `<span class="muted sm">${m.card && C(m.card)?.img ? 'Foto der Rezeptur wird verwendet' : 'Kein Foto'}</span>`;
  openDialog(isNew ? 'Neues Gericht' : 'Gericht bearbeiten', `
    <div class="dlg-ph"><div id="dlgThumb">${thumb()}</div><div class="row-btns"><button type="button" class="btn sm" id="dlgPhoto">${ico('camera')}Foto wählen</button>${img?'<button type="button" class="btn sm" id="dlgPhotoDel">Entfernen</button>':''}</div></div>
    <label class="f">Bezeichnung<input name="name" required value="${esc(m.name)}"></label>
    <label class="f">Beschreibung<input name="desc" value="${esc(m.desc)}"></label>
    <div class="fields">
      <label class="f">Kategorie<select name="section" required>${secList().map(s=>`<option ${m.section===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label>
      <label class="f">Preis inkl. MwSt., €<input name="price" class="num-in" type="text" inputmode="decimal" required value="${m.price===''?'':num2(m.price)}"></label>
    </div>
    <label class="f">Rezeptur<select name="card"><option value="">— nicht verknüpft —</option>${opts.map(c=>`<option value="${c.id}" ${m.card===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
    <div class="togs">
      <label class="tog"><input type="radio" name="veg" value="" ${!m.veg?'checked':''}><span></span>Fleisch / Fisch</label>
      <label class="tog"><input type="radio" name="veg" value="v" ${m.veg==='v'?'checked':''}><span></span>Vegetarisch</label>
      <label class="tog"><input type="radio" name="veg" value="vg" ${m.veg==='vg'?'checked':''}><span></span>Vegan</label>
    </div>
    <div class="togs"><label class="tog"><input type="checkbox" name="top" ${m.top?'checked':''}><span></span>Empfehlung des Hauses</label>
      <label class="tog"><input type="checkbox" name="show" ${m.hidden?'':'checked'}><span></span>Auf der Gästekarte zeigen</label></div>`,
    fd => { const sec = fd.get('section'); if(isNew || sec !== m.section) m.order = nextOrder(sec);
      if(m.img && m.img !== img) imgDel(m.img);
      Object.assign(m, {section:sec, name:fd.get('name').trim(), desc:fd.get('desc').trim(), price:+fd.get('price'), card:fd.get('card'), img, veg:fd.get('veg')||'', top:!!fd.get('top'), hidden:!fd.get('show')}); if(isNew) S.menu.push(m); },
    {done: isNew ? ()=>`„${m.name}“ steht jetzt unter ${m.section}` : 'Gespeichert',
     del: isNew ? null : () => ask(`„${m.name}“ von der Speisekarte löschen? Die Rezeptur bleibt erhalten.`, () => { imgDel(m.img); S.menu = S.menu.filter(x=>x!==m); }),
     after: f => { const bind = () => { $('#dlgPhoto').onclick = () => pickImage(data => { const id = uid('img'); imgPut(id, data); img = id; $('#dlgThumb').innerHTML = thumb(); }); const del = $('#dlgPhotoDel'); if(del) del.onclick = () => { img = ''; $('#dlgThumb').innerHTML = thumb(); }; }; bind(); }});
}

function prodDialog(p){
  const isNew = !p; p = p || {id:uid('p'), name:'', unit:'kg', price:'', lossCold:0, lossHot:0, alg:'', pieceG:'', stock:0, minStock:0, loc:'L', supplier:''};
  const has = new Set(algList(p.alg));
  const sups = [...new Set(S.products.map(x=>x.supplier).filter(Boolean))];
  openDialog(isNew ? 'Neues Produkt' : 'Produkt bearbeiten', `
    <label class="f">Bezeichnung<input name="name" required value="${esc(p.name)}"></label>
    <div class="fields">
      <label class="f">Einheit<select name="unit">${['kg','l','Stk'].map(u=>`<option ${p.unit===u?'selected':''}>${u}</option>`).join('')}</select></label>
      <label class="f">Preis je Einheit, €<input name="price" class="num-in" type="text" inputmode="decimal" required value="${numIn(p.price)}"></label>
      <label class="f">Gewicht 1 Stk, g<input name="pieceG" class="num-in" type="text" inputmode="decimal" value="${numIn(p.pieceG)}"></label>
      <label class="f">Putzverlust, %<input name="lossCold" class="num-in" type="text" inputmode="decimal" data-max="100" value="${numIn(p.lossCold)}"></label>
      <label class="f">Garverlust, %<input name="lossHot" class="num-in" type="text" inputmode="decimal" data-max="100" value="${numIn(p.lossHot)}"></label>
    </div>
    <div class="fields">
      <label class="f">Lagerort<select name="loc">${Object.entries(LOCS).map(([k,l])=>`<option value="${k}" ${p.loc===k?'selected':''}>${l}</option>`).join('')}</select></label>
      <label class="f">Lieferant<input name="supplier" list="sups" value="${esc(p.supplier)}"><datalist id="sups">${sups.map(s=>`<option value="${esc(s)}">`).join('')}</datalist></label>
      <label class="f">Mindestbestand<input name="minStock" class="num-in" type="text" inputmode="decimal" value="${numIn(p.minStock)}"></label>
      ${isNew?`<label class="f">Anfangsbestand<input name="stock" class="num-in" type="text" inputmode="decimal" value="0"></label>`:''}
    </div>
    <div class="f">Allergene</div>
    <div class="algs">${Object.entries(ALG).map(([k,v])=>`<label class="algc"><input type="checkbox" name="alg" value="${k}" ${has.has(k)?'checked':''}><span><b>${k}</b>${esc(v)}</span></label>`).join('')}</div>`,
    fd => { Object.assign(p, {name:fd.get('name').trim(), unit:fd.get('unit'), price:+fd.get('price'), pieceG:fd.get('pieceG'), lossCold:+fd.get('lossCold')||0, lossHot:+fd.get('lossHot')||0, alg:fd.getAll('alg').join(' '), loc:fd.get('loc'), supplier:fd.get('supplier').trim(), minStock:+fd.get('minStock')||0});
      if(isNew){ p.stock = 0; S.products.push(p); const s = +fd.get('stock')||0; if(s) addMove('in', p.id, s, 'Anfangsbestand'); } },
    {del: isNew ? null : () => { const u = usage('p:'+p.id); if(u.length) return info('Produkt wird verwendet', `Es steckt in diesen Rezepturen: ${u.map(c=>c.name).join(', ')}. Entfernen Sie es dort zuerst.`); ask(`Produkt „${p.name}“ löschen?`, () => { S.products = S.products.filter(x=>x!==p); }); }});
}

function moveDlg(arg){
  const [type, pid] = String(arg).split(':');
  const prods = stockProducts().sort(byName);
  const title = {in:'Wareneingang buchen', out:'Entnahme buchen', waste:'Schwund buchen'}[type];
  const p0 = pid ? P(pid) : null;
  openDialog(title, `
    <label class="f">Artikel<select name="pid" id="mvPid" required>${p0?'':'<option value="">— wählen —</option>'}${prods.map(p=>`<option value="${p.id}" ${p0&&p0.id===p.id?'selected':''}>${esc(p.name)} · ${qtyFmt(+p.stock||0,p)}</option>`).join('')}</select></label>
    <div class="fields">
      <label class="f">Menge in <span id="mvUnit">${p0?esc(p0.unit):'Einheit'}</span><input name="qty" class="num-in" type="text" inputmode="decimal" required autocomplete="off" autofocus></label>
      ${type==='in'?`<label class="f">Preis je Einheit, €<input name="price" id="mvPrice" class="num-in" type="text" inputmode="decimal" autocomplete="off" value="${p0?num2(p0.price):''}"></label>`:''}
      <label class="f">Datum<input name="date" type="date" max="${addDays(todayStr(),1)}" value="${todayStr()}"></label>
    </div>
    ${type==='waste'?`<label class="f">Grund<select name="note">${WASTE.map(w=>`<option>${w}</option>`).join('')}</select></label>`:`<label class="f">${type==='in'?'Lieferschein / Notiz':'Notiz'}<input name="note" placeholder="${type==='in'?'z. B. Lieferschein 2240':'z. B. für Mise en place'}"></label>`}
    ${type==='in'?`<div class="togs"><label class="tog"><input type="checkbox" name="upd" checked><span></span>Preis in die Kalkulation übernehmen (gleitender Durchschnitt)</label></div>`:''}
    <div id="mvWarn"></div>`,
    (fd, f) => { const p = P(fd.get('pid')); const q = +fd.get('qty'); if(!p) return false;
      if(!(q > 0)) return dlgErr('qty', 'Bitte eine Menge größer als 0 eingeben.');
      if(dateTooFar(fd.get('date'))) return dlgErr('date', 'Das Datum liegt in der Zukunft. Buchungen sind höchstens für morgen möglich.');
      const date = fd.get('date') ? new Date(fd.get('date')+'T12:00:00').toISOString() : null;
      if(type==='in'){ const old = p.price; const pr = fd.get('price')==='' ? p.price : +fd.get('price'); if(fd.get('upd') && pr !== p.price){ const s0 = Math.max(0, +p.stock||0); p.price = Math.round((s0*p.price + q*pr)/(s0+q)*100)/100; } addMove('in', p.id, q, fd.get('note'), pr, date); if(old !== p.price) S.moves[0].prevPrice = old; }
      else { const st = +p.stock||0; const key = p.id+':'+q;
        if(q > st + 1e-9 && f.dataset.force !== key){
          $('#mvWarn').innerHTML = `<div class="warn-box dlg-warn" role="alert">${ico('spark')}<span><b>Mehr als der Bestand.</b> Im Lager sind ${esc(qtyFmt(st,p))}, gebucht würden ${esc(qtyFmt(q,p))}. Der Bestand ginge auf ${esc(qtyFmt(st-q,p))}. Bitte Menge prüfen oder zuerst den Wareneingang buchen.</span><button type="button" class="btn sm" id="mvForce">Trotzdem buchen</button></div>`;
          $('#mvForce').onclick = () => { f.dataset.force = key; f.requestSubmit(); };
          return false; }
        addMove(type, p.id, -q, fd.get('note'), null, date); }
      moveDlg.last = `${MOVE[type]}: ${p.name} ${type==='in'?'+':'−'}${qtyFmt(q,p)}` + (type==='in' ? ` · Ø-Preis ${eur(p.price)}` : (+p.stock||0) < 0 ? ` · Bestand jetzt ${qtyFmt(+p.stock||0,p)}` : ''); },
    {ok:'Buchen', done:()=>moveDlg.last, after: f => { const s = f.querySelector('#mvPid'); const clr = () => { $('#mvWarn').innerHTML = ''; delete f.dataset.force; }; s.onchange = () => { const p = P(s.value); f.querySelector('#mvUnit').textContent = p ? p.unit : 'Einheit'; const pr = f.querySelector('#mvPrice'); if(pr && p) pr.value = num2(p.price); clr(); }; f.elements.qty.addEventListener('input', clr); }});
}

/* Verkaufsbuchung: eine Buchung = eine Einheit (S.saleGroups[grp]), Storno macht alles rückgängig */
const DEMO_SALES_OPT = ['Demo-Verkäufe löschen (empfohlen)', 'Demo-Verkäufe behalten'];
function demoSalesDays(){ const real = S.salesReal || {}; return Object.keys(S.salesDays||{}).filter(d => !real[d]); }
function demoSalesText(n){ return `Es sind noch ${plural(n,'Tag','Tage')} mit erfundenen Demo-Verkäufen gespeichert. Echte und erfundene Zahlen sollten nicht gemischt werden.`; }
function demoSalesAskHtml(){ const n = demoSalesDays().length; return `<fieldset class="demo-ask"><legend>Demo-Verkäufe</legend><p class="dlg-p">${demoSalesText(n)}</p><div class="togs" style="flex-direction:column;align-items:flex-start"><label class="tog"><input type="radio" name="demoSales" value="del" required><span></span>${DEMO_SALES_OPT[0]}</label><label class="tog"><input type="radio" name="demoSales" value="keep" required><span></span>${DEMO_SALES_OPT[1]}</label></div></fieldset>`; }
function clearDemoSales(){ const ds = demoSalesDays(); ds.forEach(d => { delete S.salesDays[d]; }); S.salesDemo = false; return ds.length; }
function markRealDay(d){ S.salesReal = S.salesReal || {}; S.salesReal[d] = 1; }
function salesDlg(){
  const items = [...specialsFor(todayStr()).flatMap(sp => sp.items.map((it,i)=>({...it, id:'sp_'+sp.id+'_'+i, section:'Aktion · '+sp.name})).filter(it => it.card && C(it.card))), ...menuSorted().filter(m => m.card && C(m.card))];
  const askDemo = !!S.salesDemo && demoSalesDays().length > 0;
  openDialog('Verkäufe buchen', `<p class="dlg-p">Tragen Sie die verkauften Portionen ein, zum Beispiel aus dem Kassenbericht. Die Zutaten werden laut Rezeptur vom Lager abgebucht, auch aus Basisrezepten.</p>
    <label class="f">Datum<input name="date" type="date" max="${addDays(todayStr(),1)}" value="${todayStr()}"></label>
    <ul class="sales">${items.map(m=>`<li><span>${esc(dishLabel(m))}<small class="muted">${esc(m.section)}</small></span><span class="stepper"><button type="button" class="icon-btn" data-step="-1" aria-label="weniger">${ico('minus')}</button><input name="s_${m.id}" type="number" min="0" step="1" value="0" inputmode="numeric" aria-label="Portionen ${esc(dishLabel(m))}"><button type="button" class="icon-btn" data-step="1" aria-label="mehr">${ico('plus')}</button></span></li>`).join('') || '<li class="muted">Noch kein Gericht mit Rezeptur. Verkäufe lassen sich erst buchen, wenn eine Rezeptur verknüpft ist.</li>'}</ul>
    <div class="kv"><span>Portionen gesamt</span><span id="salesN">0</span><span>Wareneinsatz</span><span id="salesC">${eur(0)}</span></div>
    ${askDemo ? demoSalesAskHtml() : ''}
    <div id="salesWarn"></div>`,
    (fd, f) => { const acc = new Map(); let n = 0; const dk = fd.get('date') || todayStr();
      if(dateTooFar(dk)) return dlgErr('date', 'Das Datum liegt in der Zukunft. Buchungen sind höchstens für morgen möglich.');
      const date = new Date(dk+'T20:00:00').toISOString(); const sold = [];
      items.forEach(m => { const q = Math.max(0, Math.floor(+fd.get('s_'+m.id)||0)); if(q>0){ n += q; explode(C(m.card), q, acc); sold.push([m, q]); } });
      if(!n){ $('#salesWarn').innerHTML = `<p class="f-err" role="alert">Noch keine Portionen eingetragen. Bitte bei mindestens einem Gericht die Menge erhöhen.</p>`; return false; }
      const short = [...acc.entries()].map(([pid,q]) => ({p:P(pid), q:Math.round(q*1000)/1000})).filter(x => x.p && x.q > (+x.p.stock||0) + 1e-9);
      const key = dk+'|'+sold.map(([m,q])=>m.id+':'+q).join(',');
      if(short.length && f.dataset.force !== key){
        $('#salesWarn').innerHTML = `<div class="warn-box dlg-warn" role="alert">${ico('spark')}<span><b>Bestand reicht nicht für ${plural(short.length,'Artikel','Artikel')}.</b> ${short.slice(0,6).map(x=>`${esc(x.p.name)}: Bestand ${esc(qtyFmt(+x.p.stock||0,x.p))}, gebraucht ${esc(qtyFmt(x.q,x.p))}`).join(' · ')}${short.length>6?' …':''}. Fehlt ein Wareneingang?</span><button type="button" class="btn sm" id="salesForce">Trotzdem buchen</button></div>`;
        $('#salesForce').onclick = () => { f.dataset.force = key; f.requestSubmit(); };
        return false; }
      if(askDemo && fd.get('demoSales') === 'del') clearDemoSales();
      const grp = uid('sb'); const rows = []; S.salesDays = S.salesDays || {};
      sold.forEach(([m, q]) => { if(String(m.id).startsWith('sp_')) return; const g = Math.round(q*(+m.price||0)*100)/100; const day = S.salesDays[dk] = S.salesDays[dk] || []; const r = day.find(x=>x[0]===m.id); if(r){ r[1] += q; r[2] = Math.round((r[2] + g)*100)/100; } else day.push([m.id, q, g]); rows.push([m.id, q, g]); });
      if(rows.length) markRealDay(dk);
      acc.forEach((q,pid) => { const before = S.moves.length; addMove('sale', pid, -Math.round(q*1000)/1000, `Verkauf ${fmtDate(date)}`, null, date); if(S.moves.length > before) S.moves[0].grp = grp; });
      S.saleGroups = S.saleGroups || {}; S.saleGroups[grp] = {day:dk, n, rows, gross: Math.round(rows.reduce((a,r)=>a+r[2],0)*100)/100};
      const neg = [...acc.keys()].map(P).filter(p => p && (+p.stock||0) < 0).length; salesDlg.last = `${plural(n,'Portion','Portionen')} gebucht, ${acc.size} Artikel abgebucht` + (neg ? ` · ${neg} Artikel im Minus, Wareneingang prüfen` : ''); },
    {ok:'Abbuchen', done:()=>salesDlg.last, after: f => {
      const upd = () => { let n = 0, c = 0; items.forEach(m => { const q = +f.elements['s_'+m.id].value||0; n += q; c += q*menuCalc(m).cost; }); $('#salesN').textContent = num(n); $('#salesC').textContent = eur(c); $('#salesWarn').innerHTML = ''; delete f.dataset.force; };
      f.oninput = upd;
      f.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { const i = b.parentNode.querySelector('input'); i.value = Math.max(0, (+i.value||0) + +b.dataset.step); upd(); });
    }});
}
/* Storno: Einzelbuchung oder ganze Verkaufsbuchung */
function undoMove(m){ const p = P(m.pid); if(p) p.stock = Math.round(((+p.stock||0) - m.qty)*1000)/1000; if(p && m.prevPrice != null) p.price = m.prevPrice; S.moves = S.moves.filter(x=>x!==m); }
function undoSaleGroup(grp){
  const ms = S.moves.filter(m => m.grp === grp); ms.forEach(undoMove);
  const g = (S.saleGroups||{})[grp];
  if(g && g.rows && S.salesDays && S.salesDays[g.day]){ const day = S.salesDays[g.day];
    g.rows.forEach(([mid,q,gr]) => { const r = day.find(x=>x[0]===mid); if(!r) return; r[1] = Math.round((r[1]-q)*1000)/1000; r[2] = Math.round((r[2]-gr)*100)/100; });
    S.salesDays[g.day] = day.filter(r => r[1] > 1e-9); if(!S.salesDays[g.day].length){ delete S.salesDays[g.day]; if(S.salesReal) delete S.salesReal[g.day]; } }
  if(S.saleGroups) delete S.saleGroups[grp];
  return ms.length;
}

function newCard(type, fromMenu){
  const c = {id:uid(type==='semi'?'semi':'dish'), no:S.settings.nextNo++, name: fromMenu ? fromMenu.name : (type==='semi'?'Neues Basisrezept':'Neues Gericht'), type, category: fromMenu ? fromMenu.section : (type==='semi'?'Basisrezepte':''), yieldG:'', img:'', steps:[{t:'',img:''}], items:[{ref:'',qty:'',net:''}]};
  S.cards.push(c); if(fromMenu) fromMenu.card = c.id;
  go('cards', c.id); save(); toast('Rezeptur angelegt');
}

function printCard(id){
  const c = C(id), t = totals(c);
  $('#print').innerHTML = `
    <div class="meta"><span>${esc(S.settings.name)}</span><span>Datum: ${new Date().toLocaleDateString('de-AT')}</span></div>
    <h1>Rezeptur Nr. ${c.no||''}</h1>
    <div><b>${esc(c.name)}</b> · ${c.type==='semi'?'Basisrezept':'Gericht'} · ${esc(c.category||'')}</div>
    <div>Ausbeute: ${num(c.yieldG||t.out)} g ${c.type==='semi'?'(Charge)':'(1 Portion)'}</div>
    ${c.img&&IMG[c.img]?`<img class="pr-ph" src="${IMG[c.img]}" alt="">`:''}
    <table><thead><tr><th>Nr.</th><th>Zutat</th><th class="r">Brutto</th><th>Einh.</th><th class="r">Netto, g</th><th class="r">Fertig, g</th><th class="r">Betrag, €</th></tr></thead>
    <tbody>${c.items.map((it,i)=>{const l=t.lines[i];return `<tr><td>${i+1}</td><td>${esc(l.name)}</td><td class="r">${num(+it.qty,2)}</td><td>${l.unit}</td><td class="r">${num(l.net,1)}</td><td class="r">${num(l.out,1)}</td><td class="r">${num(l.cost,2)}</td></tr>`}).join('')}</tbody>
    <tfoot><tr><td></td><td>Summe</td><td class="r">${num(t.gross)}</td><td></td><td class="r">${num(t.net)}</td><td class="r">${num(t.out)}</td><td class="r">${num(t.cost,2)}</td></tr></tfoot></table>
    <h2>Zubereitung</h2><ol class="pr-steps">${(c.steps||[]).map(s=>`<li>${esc(s.t)}${s.img&&IMG[s.img]?`<br><img src="${IMG[s.img]}" alt="">`:''}</li>`).join('')}</ol>
    <p><b>Allergene:</b> ${[...t.alg].sort().map(a=>`${a} (${ALG[a]||''})`).join(', ') || 'keine'}</p>
    <div class="sign"><span>Küchenchef ____________</span><span>Kalkulation ____________</span></div>`;
  document.body.classList.remove('print-menu'); window.print();
}
function printMenu(){ $('#print').innerHTML = guestHtml(); document.body.classList.add('print-menu'); window.print(); }

function backupName(){ return 'dahuam202-kueche-'+todayStr()+'.json'; }
function exportData(){
  const nImg = Object.keys(IMG).length;
  openDialog('Sicherung erstellen', `<p class="dlg-p">Die Sicherung ist eine Datei mit allen Daten dieser App. Aufheben, zum Beispiel auf einem USB-Stick oder in der Cloud. Zurückholen unter „Einstellungen“ mit „Sicherung laden“.</p>
    <div class="togs"><label class="tog"><input type="checkbox" id="expImg" ${nImg?'checked':''}><span></span>Fotos einschließen (${nImg})</label></div>
    <div class="row-btns"><button type="button" class="btn primary" id="dlBtn">${ico('download')}Datei speichern</button><button type="button" class="btn" id="copyBtn">${ico('copy')}Als Text kopieren</button></div>
    <p class="hint" id="expMsg" role="status">${esc(backupName())}</p>`, null, {cancel:'Schließen'});
  const json = () => JSON.stringify({...S, schema:APP_SCHEMA, app:APP_VERSION + ' · ' + APP_BUILD, exportedAt:new Date().toISOString(), ...($('#expImg').checked ? {images:IMG} : {})});
  $('#dlBtn').onclick = async () => { const ok = await saveFile(backupName(), new Blob([json()], {type:'application/json'})); $('#expMsg').textContent = ok ? `Gespeichert als ${backupName()}` : 'Nicht gespeichert. „Als Text kopieren“ funktioniert immer.'; if(ok) toast('Sicherung gespeichert'); };
  $('#copyBtn').onclick = () => { const txt = json(); const fb = () => { let ta = $('#expTxt'); if(!ta){ ta = document.createElement('textarea'); ta.id = 'expTxt'; ta.className = 'code'; ta.readOnly = true; ta.setAttribute('aria-label','Sicherung als Text'); $('#expMsg').insertAdjacentElement('afterend', ta); } ta.value = txt; ta.select(); toast('Text markiert, mit Strg+C kopieren'); }; const pr = navigator.clipboard?.writeText(txt); if(pr) pr.then(()=>toast('Kopiert'), fb); else fb(); };
}
/* Sicherheitskopie vor dem Überschreiben aller Daten (ohne Fotos; die bleiben im Browser gespeichert) */
const SAFETY_KEY = KEY + '_safety';
/* liegt seit Paket A in IndexedDB; safetyGet() liefert nur Datum, Anlass und Zähler, die Daten kommen über STORE.safetyData() */
function safetyStore(why){ return STORE.safetyStore(why); }
function safetyGet(){ return STORE.st.safety; }
function safetyClear(){ STORE.safetyClear(); }
function loadBackup(d){
  const imgs = d.images; delete d.images; const nd = migrate(d); if(!nd) throw 0;
  const old = S; const kept = safetyStore('vor „Sicherung laden“'); S = nd;
  try { render(); } catch(e2){ S = old; render(); throw e2; }
  if(imgs) Object.entries(imgs).forEach(([k,v])=>imgPut(k,v)); save(); go('dash');
  toast(kept ? 'Sicherung geladen' : 'Sicherung geladen (ohne Sicherheitskopie, Speicher voll)', kept ? {label:'Rückgängig', ms:8000, action:safetyRestore} : null);
}
async function safetyRestore(){ const sf = safetyGet(); if(!sf) return; let d = null; try { d = await STORE.safetyData(); } catch(e){} const nd = d && migrate(d); if(!nd){ toast('Sicherheitskopie ist nicht lesbar'); return; } S = nd; safetyClear(); save(); go('dash'); toast('Letzte Daten wiederhergestellt'); }

/* ---------- Schnellsuche ---------- */
let palSel = 0, palItems = [];
function palData(){
  return [
    ...TABS.map(([k,l])=>({g:'Bereich', n:l, s:'', run:()=>go(k)})),
    {g:'Bereich', n:'Gästekarte ansehen', s:'Speisekarte', run:()=>{ view.mtab='guest'; go('menu'); }},
    {g:'Bereich', n:'Inventur', s:'Lager', run:()=>{ view.stab='inventur'; go('stock'); }},
    {g:'Bereich', n:'Bestellvorschlag', s:'Lager', run:()=>{ view.stab='bestellung'; go('stock'); }},
    {g:'Aktion', n:'Wareneingang buchen', s:'', run:()=>moveDlg('in')},
    {g:'Aktion', n:'Verkäufe buchen', s:'', run:()=>salesDlg()},
    {g:'Aktion', n:'Schwund buchen', s:'', run:()=>moveDlg('waste')},
    {g:'Aktion', n:'Neues Gericht auf die Speisekarte', s:'', run:()=>menuDialog()},
    {g:'Aktion', n:'Neue Rezeptur anlegen', s:'', run:()=>newCard('dish')},
    {g:'Aktion', n:'Neues Produkt anlegen', s:'', run:()=>prodDialog()},
    ...S.menu.map(m=>({g:'Speisekarte', n:dishLabel(m), s:eur(m.price)+' · '+m.section, run:()=> m.card ? go('cards', m.card) : menuDialog(m)})),
    ...S.cards.map(c=>({g:'Rezeptur', n:c.name, s:(c.type==='semi'?'Basisrezept':'Gericht')+' · Nr. '+c.no, run:()=>go('cards', c.id)})),
    ...S.products.map(p=>({g:'Produkt', n:p.name, s:p.noStock?eur(p.price):qtyFmt(+p.stock||0,p)+' auf Lager', run:()=>prodDialog(p)})),
  ];
}
function palOpen(){ $('#pal').hidden = false; const i = $('#palIn'); i.value = ''; palFilter(''); i.focus(); }
function palClose(){ $('#pal').hidden = true; }
function palFilter(q){
  q = q.trim().toLowerCase();
  const all = palData();
  palItems = (q ? all.filter(x => (x.n+' '+x.s+' '+x.g).toLowerCase().includes(q)) : all.filter(x=>x.g==='Bereich'||x.g==='Aktion')).slice(0,40);
  palSel = 0; palDraw();
}
function palDraw(){
  $('#palList').innerHTML = palItems.length ? palItems.map((x,i)=>`<li><button type="button" class="${i===palSel?'sel':''}" data-pal="${i}"><span class="pg">${esc(x.g)}</span><span class="pn">${esc(x.n)}</span><span class="ps">${esc(x.s)}</span></button></li>`).join('') : '<li class="empty">Nichts gefunden.</li>';
  $('#palList .sel')?.scrollIntoView({block:'nearest'});
}

/* ---------- Navigation ---------- */
function go(tab, card=null){
  view = {...view, tab, card, q: tab===view.tab ? view.q : ''};
  if(card) view.sim = null;
  try { if(location.hash.slice(1) !== tab) history.replaceState(null, '', '#'+tab); } catch(e){}
  render(); window.scrollTo({top:0});
}
function setTheme(t){ document.documentElement.dataset.theme = t; try { localStorage.setItem(KEY+'_theme', t); } catch(e){} themeIcon(); }
function themeIcon(){ const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme==='dark' : matchMedia('(prefers-color-scheme: dark)').matches; document.querySelectorAll('[data-act=theme]').forEach(b => { b.innerHTML = ico(dark?'sun':'moon'); b.title = dark ? 'Helles Design' : 'Dunkles Design'; }); return dark; }

/* ---------- Ereignisse ---------- */
document.addEventListener('click', e => {
  const tab = e.target.closest('[data-tab]');
  if(tab){ go(tab.dataset.tab); return; }
  const pi = e.target.closest('[data-pal]');
  if(pi){ const x = palItems[+pi.dataset.pal]; palClose(); x && x.run(); return; }
  if(e.target.id === 'pal'){ palClose(); return; }
  const el = e.target.closest('[data-act]'); if(!el || el.closest('#dlg') && !el.closest('#dlgForm')) return;
  const id = el.dataset.id, act = el.dataset.act;
  const c = view.card ? C(view.card) : null;
  switch(act){
    case 'theme': setTheme(themeIcon() ? 'light' : 'dark'); break;
    case 'palette': palOpen(); break;
    case 'goTab': go(id); break;
    case 'goMenu': view.sec = id; view.mtab = 'calc'; go('menu'); break;
    case 'goStock': view.stab = id; go('stock'); break;
    case 'sec': view.sec = id; render(); break;
    case 'mtab': view.mtab = id; render(); break;
    case 'stab': view.stab = id; render(); break;
    case 'loc': view.loc = id; render(); break;
    case 'mtype': view.mtype = id; render(); break;
    case 'gstyle': S.settings.guest.style = id; save(); render(); break;
    case 'newMenu': menuDialog(); break;
    case 'editMenu': menuDialog(S.menu.find(m=>m.id===id)); break;
    case 'photoMenu': setPhoto(S.menu.find(m=>m.id===id)); break;
    case 'toMenu': { const cc = C(id); const t = totals(cc); const rec = t.cost/(S.settings.target/100)*(1+S.settings.vat/100); const sec = secList().includes(cc.category) ? cc.category : secList()[0];
      menuDialog(null, {name:cc.name, section:sec, card:cc.id, price: Math.max(0.9, Math.ceil(rec) - 0.1).toFixed(2)}); break; }
    case 'openCard': go('cards', id); break;
    case 'backCards': go('cards'); break;
    case 'newCardFor': newCard('dish', S.menu.find(m=>m.id===id)); break;
    case 'newCard': newCard(id); break;
    case 'ctype': view.ctype = id; render(); break;
    case 'photoCard': setPhoto(C(id)); break;
    case 'photoCardDel': { const cc = C(id); imgDel(cc.img); cc.img = ''; save(); render(); toast('Foto entfernt'); break; }
    case 'addLine': c.items.push({ref:'',qty:'',net:''}); save(); render(); setTimeout(()=>document.getElementById('ref-'+(c.items.length-1))?.focus(),0); break;
    case 'delLine': { const i = +id, it = c.items[i]; if(!it) break; c.items.splice(i,1); save(); render(); const cid = c.id; const nm = refObj(it.ref) ? line(it,0).name : 'Leere Zeile'; toast(`${nm} entfernt`, {action: () => { const cc = C(cid); if(!cc) return; cc.items.splice(Math.min(i, cc.items.length), 0, it); save(); render(); toast('Wiederhergestellt'); }}); break; }
    case 'stepAdd': c.steps.push({t:'',img:''}); save(); render(); setTimeout(()=>document.getElementById('st-'+(c.steps.length-1))?.focus(),0); break;
    case 'stepDel': { const i = +id, st = c.steps[i]; if(!st) break; c.steps.splice(i,1); save(); render(); const cid = c.id; let undone = false; toast(`Schritt ${i+1} gelöscht`, {action: () => { const cc = C(cid); if(!cc) return; undone = true; cc.steps.splice(Math.min(i, cc.steps.length), 0, st); save(); render(); toast('Wiederhergestellt'); }}); if(st.img) setTimeout(() => { if(!undone) imgDel(st.img); }, 6500); break; }
    case 'stepMove': { const [i,d] = id.split(':').map(Number); const j = i+d; [c.steps[i], c.steps[j]] = [c.steps[j], c.steps[i]]; save(); render(); break; }
    case 'stepPhoto': setPhoto(c.steps[+id]); break;
    case 'stepPhotoDel': imgDel(c.steps[+id].img); c.steps[+id].img = ''; save(); render(); break;
    case 'simTo': { const r = $('#sim'); view.sim.price = Math.min(+r.max, Math.max(+r.min, +id)); r.value = view.sim.price; r.dispatchEvent(new Event('input',{bubbles:true})); break; }
    case 'applySim': { const m = S.menu.find(x=>x.id===id); m.price = Math.round(view.sim.price*10)/10; save(); render(); toast('Verkaufspreis auf '+eur(m.price)+' gesetzt'); break; }
    case 'dupCard': { const src = C(id); const cp = JSON.parse(JSON.stringify(src)); cp.id = uid(src.type); cp.no = S.settings.nextNo++; cp.name += ' (Kopie)'; cp.img = ''; cp.steps.forEach(s=>s.img=''); S.cards.push(cp); save(); go('cards', cp.id); toast('Kopie angelegt (ohne Fotos)'); break; }
    case 'delCard': { const src = C(id); const u = usage('c:'+id); if(u.length){ info('Basisrezept wird verwendet', `Es steckt in diesen Rezepturen: ${u.map(x=>x.name).join(', ')}. Entfernen Sie es dort zuerst.`); break; }
      ask(`Rezeptur „${src.name}“ löschen? Die Gerichte bleiben auf der Speisekarte, aber ohne Rezeptur.`, () => { imgDel(src.img); (src.steps||[]).forEach(s=>imgDel(s.img)); S.cards = S.cards.filter(x=>x.id!==id); S.menu.forEach(m=>{ if(m.card===id) m.card=''; }); view.card = null; }); break; }
    case 'printCard': printCard(id); break;
    case 'printMenu': printMenu(); break;
    case 'addSec': { let n = 'Neue Kategorie', i = 2; while(secList().includes(n)) n = 'Neue Kategorie '+i++; S.settings.sections.push(n); save(); render(); setTimeout(()=>{ const inp = document.querySelector(`[data-secname="${S.settings.sections.length-1}"]`); inp?.focus(); inp?.select(); },0); break; }
    case 'secMove': { const [i,d] = id.split(':').map(Number); const s = S.settings.sections; [s[i], s[i+d]] = [s[i+d], s[i]]; save(); render(); break; }
    case 'secDel': S.settings.sections.splice(+id,1); save(); render(); toast('Kategorie gelöscht'); break;
    case 'secSort': { const s = secList()[+id]; S.menu.filter(m=>m.section===s).sort((a,b)=>a.price-b.price).forEach((m,i)=>m.order=i); save(); render(); toast(`${s}: nach Preis sortiert`); break; }
    case 'itemMove': { const [mid,d] = id.split(':'); moveItem(mid, +d); save(); render(); break; }
    case 'itemHide': { const m = S.menu.find(x=>x.id===id); m.hidden = !m.hidden; save(); render(); toast(m.hidden ? `„${m.name}“ ausgeblendet` : `„${m.name}“ wird angezeigt`); break; }
    case 'moveDlg': moveDlg(id); break;
    case 'sales': salesDlg(); break;
    case 'moveUndo': { const m = S.moves.find(x=>x.id===id); if(!m) break; const p = P(m.pid);
      if(m.grp){ const g = (S.saleGroups||{})[m.grp] || {}; const k = S.moves.filter(x=>x.grp===m.grp).length;
        ask(`${g.n ? `Verkaufsbuchung vom ${fmtDate(m.date)} (${plural(g.n,'Portion','Portionen')})` : `Sammelbuchung vom ${fmtDate(m.date)}`} komplett stornieren? ${plural(k,'Artikel wird','Artikel werden')} zurück ins Lager gebucht${g.rows && g.rows.length ? `, ${eur(g.gross)} Umsatz werden aus der Auswertung entfernt` : g.n ? '' : '; der Umsatz in der Auswertung bleibt unverändert'}.`, () => { undoSaleGroup(m.grp); }, 'Stornieren'); break; }
      ask(`Buchung stornieren? ${MOVE[m.type]} ${p?p.name:''} ${qtyFmt(m.qty,p)} wird rückgängig gemacht.`, () => { undoMove(m); }, 'Stornieren'); break; }
    case 'invStart': S.invDraft = {date:new Date().toISOString(), counts:{}}; save(); render(); toast('Inventur gestartet'); break;
    case 'invCancel': ask('Laufende Inventur verwerfen? Die gezählten Mengen gehen verloren.', () => { S.invDraft = null; }, 'Verwerfen'); break;
    case 'invFinish': { const d = S.invDraft; const items = stockProducts().filter(p => d.counts[p.id]!==undefined && d.counts[p.id]!=='' && +d.counts[p.id] >= 0);
      if(!items.length){ info('Noch nichts gezählt', 'Tragen Sie mindestens eine gezählte Menge ein.'); break; }
      const diff = items.reduce((s,p)=>s+(d.counts[p.id]-(+p.stock||0))*(+p.price||0),0);
      ask(`Inventur mit ${items.length} gezählten Artikeln abschließen? Differenz: ${signedEur(diff)}${diff < -0.005 ? ' (Fehlbestand)' : diff > 0.005 ? ' (Mehrbestand)' : ''}. Die Bestände werden auf die gezählten Mengen gesetzt.`, () => {
        items.forEach(p => { const df = d.counts[p.id]-(+p.stock||0); if(Math.abs(df) > 1e-9) addMove('inv', p.id, Math.round(df*1000)/1000, 'Inventurdifferenz'); });
        S.inventories.unshift({id:uid('inv'), date:new Date().toISOString(), counted:items.length, value:stockValue(), diff}); S.invDraft = null; }, 'Abschließen'); break; }
    case 'ordCopy': { const txt = orderText(id); const pr = navigator.clipboard?.writeText(txt); const fb = () => openDialog('Bestelltext', `<textarea class="code" readonly id="ordTxt">${esc(txt)}</textarea>`, null, {cancel:'Schließen', after:()=>$('#ordTxt').select()});
      if(pr) pr.then(()=>toast('Bestelltext kopiert'), fb); else fb(); break; }
    case 'ordBook': { const list = lowStock().filter(p => (p.supplier||'Ohne Lieferant')===id);
      ask(`Lieferung von ${id} mit ${list.length} Artikeln einbuchen?`, () => { list.forEach(p => { const q = +(view.order[p.id] ?? orderSuggest(p)); if(q>0) addMove('in', p.id, q, 'Lieferung laut Bestellung'); delete view.order[p.id]; }); }, 'Einbuchen'); break; }
    case 'newProd': prodDialog(); break;
    case 'editProd': prodDialog(P(id)); break;
    case 'export': exportData(); break;
    case 'reset': ask('Alle Daten durch die Demodaten ersetzen? Ihre Änderungen und Lagerbuchungen gehen verloren. Fotos bleiben gespeichert.', () => { safetyStore('vor „Demodaten wiederherstellen“'); S = seed(); }, 'Ersetzen'); break;
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if(t.id === 'mq' || t.id === 'cq' || t.id === 'pq'){
    if(t.id === 'pq') view.pq = t.value; else view.q = t.value;
    const pos = t.selectionStart; render(); const n = $('#'+t.id); n.focus(); try { n.setSelectionRange(pos,pos); } catch(err){}
  }
  if(t.id === 'sim'){
    const c = C(view.card); view.sim.price = +t.value;
    $('#simVal').textContent = eur(+t.value); $('#simOut').innerHTML = simHtml(totals(c).cost, +t.value);
    const ap = $('#simApply'); if(ap){ const m = S.menu.find(x=>x.card===c.id); ap.hidden = Math.abs(+t.value - +m.price) < 0.05; }
  }
  if(t.id === 'portions'){ view.portions = Math.max(1, +t.value||1); $('#prodOut').innerHTML = prodHtml(C(view.card), view.portions); }
  if(t.id === 'palIn') palFilter(t.value);
  if(t.dataset.inv){ const v = t.value.trim()==='' ? '' : numParse(t.value); const ok = v === '' || (isFinite(v) && v >= 0); t.classList.toggle('bad-in', !ok); if(ok){ S.invDraft.counts[t.dataset.inv] = v; t.dataset.old = t.value; save(); invUpdate(t.dataset.inv); } }
  if(t.dataset.step != null && t.closest('#app')){ const c = C(view.card); c.steps[+t.dataset.step].t = t.value; save(); autosize(t); }
  if(t.classList.contains('title-in')) autosize(t);
  if(t.dataset.gs){ S.settings.guest[t.dataset.gs] = t.value; save(); $('.guest-prev').innerHTML = guestHtml(); }
});

document.addEventListener('keydown', e => {
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); $('#pal').hidden ? palOpen() : palClose(); return; }
  if(!$('#pal').hidden){
    if(e.key === 'Escape'){ palClose(); }
    else if(e.key === 'ArrowDown'){ e.preventDefault(); palSel = Math.min(palItems.length-1, palSel+1); palDraw(); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); palSel = Math.max(0, palSel-1); palDraw(); }
    else if(e.key === 'Enter'){ e.preventDefault(); const x = palItems[palSel]; palClose(); x && x.run(); }
    return;
  }
  if(e.key === 'Enter' && e.target.matches('input[data-inv]')){ e.preventDefault(); const all = [...document.querySelectorAll('input[data-inv]')]; const n = all[all.indexOf(e.target)+1]; n ? (n.focus(), n.select()) : e.target.blur(); return; }
  if(e.key === 'Enter' && e.target.matches('input[data-li],input[data-pp],input[data-cf],textarea.title-in,input[data-secname],input[data-ord]')){ e.preventDefault(); e.target.blur(); }
  if(e.key === '/' && !e.target.closest('input,textarea,select')){ e.preventDefault(); palOpen(); }
});

document.addEventListener('change', e => {
  const t = e.target, c = view.card ? C(view.card) : null;
  if(t.id === 'imgFile'){ const f = t.files[0]; if(!f) return; resizeImage(f).then(d => { pickCb && pickCb(d); pickCb = null; }, () => info('Foto nicht lesbar', 'Bitte ein JPG- oder PNG-Bild wählen.')); return; }
  if(t.dataset.cf && c){ const f = t.dataset.cf; c[f] = f==='yieldG' ? (t.value===''?'':+t.value) : t.value; save(); render(); toast('Gespeichert'); return; }
  if(t.dataset.li != null && c){ const it = c.items[+t.dataset.li]; const f = t.dataset.lf; it[f] = f==='ref' ? t.value : (t.value===''?'':+t.value); if(f==='ref') it.net = ''; save(); render(); return; }
  if(t.dataset.step != null && t.closest('#app')){ toast('Gespeichert'); return; }
  if(t.dataset.pp){ const p = P(t.dataset.pp); const old = +p[t.dataset.pf]; p[t.dataset.pf] = +t.value || 0; save(); render(); if(t.dataset.pf==='price' && old !== p.price) toast(`${p.name}: ${eur(old)} → ${eur(p.price)} · ${usage('p:'+p.id).length} Rezepturen neu berechnet`); return; }
  if(t.dataset.sf){ const f = t.dataset.sf; S.settings[f] = f==='name' ? t.value : (+t.value || 0); save(); toast('Gespeichert'); return; }
  if(t.dataset.gf){ S.settings.guest[t.dataset.gf] = t.checked; save(); $('.guest-prev').innerHTML = guestHtml(); return; }
  if(t.dataset.secname != null){ const i = +t.dataset.secname, old = S.settings.sections[i], nv = t.value.trim(); if(!nv || nv===old){ t.value = old; return; }
    if(S.settings.sections.includes(nv)){ t.value = old; toast('Diese Kategorie gibt es schon'); return; }
    S.settings.sections[i] = nv; S.menu.forEach(m=>{ if(m.section===old) m.section = nv; }); S.cards.forEach(x=>{ if(x.category===old) x.category = nv; }); if(view.sec===old) view.sec = nv; save(); render(); toast('Kategorie umbenannt'); return; }
  if(t.dataset.ord){ view.order[t.dataset.ord] = Math.max(0, +t.value||0); render(); return; }
  if(t.id === 'importFile' && t.files[0]){
    const r = new FileReader(); const fname = t.files[0].name;
    r.onload = () => { let d; try { d = JSON.parse(r.result); if(!d || typeof d !== 'object' || !Array.isArray(d.products) || !Array.isArray(d.cards) || !Array.isArray(d.menu)) throw 0; } catch(err){ info('Laden fehlgeschlagen', 'Die Datei ist keine Sicherung dieser App. Wählen Sie eine .json-Datei, die mit „Sicherung erstellen“ gespeichert wurde.'); return; }
      if(schemaNewer(d)){ info('Sicherung ist neuer als die App', 'Diese Sicherung stammt aus einer neueren Version der App und kann hier nicht geladen werden. Bitte die App neu laden, damit sie aktuell ist, und dann noch einmal versuchen. Es wurde nichts geändert.'); return; }
      openDialog('Sicherung laden?', `<p class="dlg-p">Die Datei <b>${esc(fname)}</b> enthält ${plural(d.menu.length,'Gericht','Gerichte')}, ${plural(d.cards.length,'Rezeptur','Rezepturen')} und ${plural(d.products.length,'Produkt','Produkte')}.</p><p class="dlg-p">Alle aktuellen Daten (${plural(S.menu.length,'Gericht','Gerichte')}, ${plural(S.cards.length,'Rezeptur','Rezepturen')}, ${plural(S.products.length,'Produkt','Produkte')}, Lager, Bestellungen, Verkäufe) werden ersetzt. Vorher wird automatisch eine Sicherheitskopie angelegt; unter „Einstellungen“ lässt sie sich einmal zurückholen.</p>`,
        () => { setTimeout(() => { try { loadBackup(d); } catch(err){ info('Laden fehlgeschlagen', 'Die Datei ist keine Sicherung dieser App. Wählen Sie eine .json-Datei, die mit „Sicherung erstellen“ gespeichert wurde.'); } }, 0); }, {ok:'Daten ersetzen', toast:false}); };
    r.readAsText(t.files[0]); t.value = '';
  }
});

/* ---------- Start ---------- */
function startApp(){
document.querySelectorAll('.nav-slot').forEach(n => n.innerHTML = navHtml(n.closest('.bottom')));
themeIcon();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', themeIcon);
window.addEventListener('hashchange', fromHash);
fromHash(); render();
imgLoadAll().then(() => { if(Object.keys(IMG).length) render(); });
}
function fromHash(){ const h = location.hash.slice(1); if(TABS.some(t=>t[0]===h) && h !== view.tab){ view = {...view, tab:h, card:null, q:''}; render(); } }
try { const th = localStorage.getItem(KEY+'_theme'); if(th) document.documentElement.dataset.theme = th; } catch(e){}
/* Daten kommen aus IndexedDB: erst laden, dann zeichnen (siehe store.js und reliab.js) */
BOOT_P.then(relStart, e => relStart({status:'corrupt', kind:'read', error:String(e)}));
