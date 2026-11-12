/* =====================================================================
   Einkauf: Lieferanten, Bestellungen, Wareneingang, Reklamation, Rollen
   ===================================================================== */
const SUP_CATS = {fleisch:'Fleisch & Wurst', getraenke:'Getränke', wein:'Wein & Spirituosen', gross:'Großhandel', baeckerei:'Bäckerei', molkerei:'Molkerei & Käse', gemuese:'Obst, Gemüse & Eier'};
const CHANNELS = {email:'E-Mail', whatsapp:'WhatsApp', shop:'Webshop / App', phone:'Telefon', rep:'Vertreter'};
/* Zwei Rollen. „chef“ darf alles; „team“ sieht alles, hakt ab, trägt den eigenen Frei-Wunsch ein und bereitet Bestellungen vor. */
const ROLES = {chef:'Chef', team:'Team'};
function roleNorm(r){ return r === 'owner' || r === 'chef' ? 'chef' : 'team'; }   // frühere Rollen und Cloud-Konten: owner/chef → Chef, bar/staff → Team
const OSTAT = {draft:'Entwurf', sent:'Gesendet', confirmed:'Bestätigt', delivered:'Geliefert', complaint:'Reklamation', cancelled:'Storniert'};
const LSTAT = {ok:'in Ordnung', short:'zu wenig', missing:'fehlt', damaged:'beschädigt', wrong:'falscher Artikel', subst:'Ersatzartikel'};
const CSTAT = {open:'offen', credit:'Gutschrift erhalten', closed:'erledigt'};

// Demo-Lieferanten (frei erfunden) laut Betriebsleitung
const DEMO_SUP = [
  ['sup_fleisch','Metzgerei Brunnhuber','fleisch','whatsapp',{contact:'Hr. Brunnhuber', phone:'+43 664 1234501', whatsapp:'+43 664 1234501', email:'bestellung@metzgerei-brunnhuber.example'},[1,3,5],'14:00',[2,4,6],150,'MB'],
  ['sup_getraenke','Getränke Wildalm','getraenke','shop',{contact:'Kundenservice', phone:'+43 5282 4401', email:'service@getraenke-wildalm.example', shopUrl:'https://shop.getraenke-wildalm.example'},[1,4],'12:00',[2,5],300,'GW'],
  ['sup_wein','Weinkontor Steinberger','wein','email',{contact:'Fr. Steinberger', phone:'+43 512 99880', email:'order@weinkontor-steinberger.example'},[2],'16:00',[4],250,'WS'],
  ['sup_gross','Gastro-Großmarkt Inntal','gross','shop',{contact:'Außendienst Hr. Moser', phone:'+43 5332 7700', email:'kundenservice@grossmarkt-inntal.example', shopUrl:'https://shop.grossmarkt-inntal.example'},[1,2,3,4,5],'18:00',[2,3,4,5,6],200,'GI'],
  ['sup_baeck','Bäckerei Kornstube','baeckerei','whatsapp',{contact:'Backstube', phone:'+43 664 1234505', whatsapp:'+43 664 1234505'},[0,1,2,3,4,5,6],'15:00',[0,1,2,3,4,5,6],40,'BK'],
  ['sup_molk','Talmolkerei Gerlostal','molkerei','email',{contact:'Bestellannahme', phone:'+43 5284 6610', email:'bestellung@talmolkerei.example'},[1,3,5],'11:00',[2,4,6],120,'TG'],
  ['sup_gem','Gemüsehof Hainzl','gemuese','phone',{contact:'Fam. Hainzl', phone:'+43 664 1234507'},[1,3,5],'17:00',[2,4,6],80,'GH'],
];
const SUP_MAP = {Metzgerei:'sup_fleisch', 'Großhandel':'sup_gross', 'Bäckerei':'sup_baeck', Molkerei:'sup_molk', Sennerei:'sup_molk', 'Gemüsehändler':'sup_gem', Bauernhof:'sup_gem', Weinhandel:'sup_wein'};
const DEMO_PACK = {flour:['Sack 10 kg',10], sugar:['Sack 10 kg',10], icing:['Pkg 1 kg',1], oil:['Kanister 10 l',10], fries:['Karton 4×2,5 kg',10], egg:['Tray 30 Stk',30], quail:['Pkg 18 Stk',18],
  milk:['Kiste 12×1 l',12], cream:['Karton 6×1 l',6], butter:['Karton 10×250 g',2.5], cremefr:['Becher 1 kg',1], brioche:['Karton 24 Stk',24], wine:['Bag-in-Box 5 l',5], kirsch:['Flasche 0,7 l',0.7],
  salt:['Pkg 1 kg',1], potato:['Sack 25 kg',25], onion:['Sack 10 kg',10], apples:['Kiste 13 kg',13], lemon:['Netz 10 Stk',10], passata:['Karton 6×1 kg',6], schmalz:['Kübel 2,5 kg',2.5], crumbs:['Sack 5 kg',5],
  bier:['Fass 30 l',30], mineral:['Kiste 24 Stk',24], almdudler:['Kiste 24 Stk',24], apfelsaft:['Kiste 6 Stk',6], gv:['Karton 6 Fl.',6], zweigelt:['Karton 6 Fl.',6]};
const DEMO_DRINKS = [
  ['bier','Zillertaler Bier vom Fass','l',2.9,'A','sup_getraenke',45,60,'K'],
  ['mineral','Mineralwasser 0,33 l','Stk',0.42,'','sup_getraenke',30,72,'L'],
  ['almdudler','Almdudler 0,35 l','Stk',0.78,'','sup_getraenke',40,48,'L'],
  ['apfelsaft','Apfelsaft naturtrüb 1 l','Stk',1.65,'','sup_getraenke',14,12,'L'],
  ['gv','Grüner Veltliner Qualitätswein 0,75 l','Stk',6.4,'O','sup_wein',8,18,'W'],
  ['zweigelt','Zweigelt Qualitätswein 0,75 l','Stk',7.2,'O','sup_wein',20,18,'W'],
];

function einkaufSeed(d){
  const s = d.settings;
  Object.assign(s, {address:'Gerlos 202, 6281 Gerlos', deliveryNote:'Anlieferung über den Hintereingang zur Küche', phone:'+43 5284 5283-11', email:'genuss@dahuam202.at', orderNo:1,
    users:[{id:'u_chef',name:'Chef',role:'chef'},{id:'u_staff',name:'Team',role:'team'}], currentUser:'u_chef'});
  d.suppliers = DEMO_SUP.map(([id,name,cat,channel,c,orderDays,cutoff,deliveryDays,minOrder,pre]) => ({id,name,cat,channel,contact:c.contact||'',phone:c.phone||'',whatsapp:c.whatsapp||'',email:c.email||'',shopUrl:c.shopUrl||'',customerNo:'4'+String(1000+DEMO_SUP.findIndex(x=>x[0]===id)*37),orderDays,cutoff,deliveryDays,minOrder,freight:0,note:'',prefix:pre,active:true}));
  DEMO_DRINKS.forEach(([id,name,unit,price,alg,sup,stock,minStock,loc]) => d.products.push({id,name,unit,price,lossCold:0,lossHot:0,alg,pieceG:'',stock,minStock,loc,supplier:sup}));
  d.products.forEach(p => { if(SUP_MAP[p.supplier]) p.supplier = SUP_MAP[p.supplier]; const pk = DEMO_PACK[p.id]; p.pack = pk ? pk[0] : ''; p.packQty = pk ? pk[1] : 0; });
  const cnt = {}; d.products.forEach(p => { const sp = d.suppliers.find(x=>x.id===p.supplier); if(sp){ cnt[sp.id] = (cnt[sp.id]||0)+1; p.artNo = `${sp.prefix}-${String(100+cnt[sp.id]*7)}`; } else p.artNo = ''; });
  d.orders = [];
  const t = todayStr();
  const mk = (sid, daysAgo, status, lines, extra={}) => { const sp = d.suppliers.find(x=>x.id===sid); const o = {id:uid('o'), no:`B-${t.slice(0,4)}-${String(s.orderNo++).padStart(4,'0')}`, supplier:sid, createdAt:daysAgoIso(daysAgo+1), createdBy:'u_chef', status, deliveryDate:addDays(t,-daysAgo), note:'', sentAt:daysAgoIso(daysAgo+1), sentVia:CHANNELS[sp.channel],
      lines: lines.map(([pid,n,dn,ip,ls]) => { const p = d.products.find(x=>x.id===pid); const f = p.packQty||1; return {pid, n, f, ou:p.packQty?p.pack:p.unit, price:Math.round(p.price*f*100)/100, artNo:p.artNo, delivered: dn ?? null, invPrice: ip ?? null, ls: ls || ''}; }), ...extra}; d.orders.push(o); return o; };
  mk('sup_gross', 6, 'delivered', [['flour',2,2],['sugar',1,1],['oil',1,1],['fries',3,3]], {receipt:{date:daysAgoIso(6), noteNo:'LS 88412', checkedBy:'u_chef', temp:'', photo:''}});
  mk('sup_fleisch', 5, 'delivered', [['pork',10,10],['veal',5,5,34.5],['beef_mince',6,6]], {receipt:{date:daysAgoIso(5), noteNo:'LS 2231', checkedBy:'u_chef', temp:'2,8 °C', photo:''}});
  mk('sup_wein', 9, 'delivered', [['gv',3,3],['zweigelt',2,2],['kirsch',2,2]], {receipt:{date:daysAgoIso(9), noteNo:'R 2026-1190', checkedBy:'u_staff', temp:'', photo:''}});
  mk('sup_getraenke', 4, 'delivered', [['bier',2,2],['mineral',3,3],['almdudler',2,2]], {receipt:{date:daysAgoIso(4), noteNo:'LS 55021', checkedBy:'u_staff', temp:'', photo:''}});
  mk('sup_baeck', 1, 'delivered', [['brioche',2,2],['bread',6,6]], {receipt:{date:daysAgoIso(1), noteNo:'', checkedBy:'u_staff', temp:'', photo:''}});
  mk('sup_gem', 3, 'complaint', [['potato',1,1],['romaine',4,2,null,'short'],['parsley',1,0,null,'missing'],['lemon',2,2]], {receipt:{date:daysAgoIso(3), noteNo:'ohne Nr.', checkedBy:'u_chef', temp:'', photo:''}, complaint:{status:'open', text:'Römersalat: 2 von 4 kg geliefert. Petersilie fehlt (1 kg). Bitte Gutschrift oder Nachlieferung.'}});
  const mo = mk('sup_molk', 0, 'confirmed', [['milk',2],['cream',1],['butter',2],['bergkase',4]]); mo.confirmedNote = 'Telefonisch bestätigt';
  const fl = mk('sup_fleisch', -1, 'sent', [['veal',5],['speck',3],['beef_goulash',6]]);
}
function daysAgoIso(n){ const x = new Date(); x.setDate(x.getDate()-n); return x.toISOString(); }
function einkaufMigrate(d){
  const s = d.settings;
  if(!d.suppliers){ d.suppliers = [];
    const names = [...new Set(d.products.map(p=>p.supplier).filter(Boolean))];
    names.forEach(n => { const id = uid('sup'); d.suppliers.push({id, name:n, cat:'gross', channel:'email', contact:'', phone:'', whatsapp:'', email:'', shopUrl:'', customerNo:'', orderDays:[1,3,5], cutoff:'12:00', deliveryDays:[2,4,6], minOrder:0, freight:0, note:'', prefix:'', active:true}); d.products.forEach(p => { if(p.supplier===n) p.supplier = id; }); });
  }
  d.products.forEach(p => { if(p.pack==null){ p.pack = ''; p.packQty = 0; } if(p.artNo==null) p.artNo = ''; });
  if(!d.orders) d.orders = [];
  if(!Array.isArray(s.users) || !s.users.length) s.users = [{id:'u_chef',name:'Chef',role:'chef'},{id:'u_staff',name:'Team',role:'team'}];
  // ältere Stände: vier Rollen werden zwei; die vier Standard-Einträge werden zu „Chef“ und „Team“
  const old4 = s.users.length === 4 && ['u_owner:Inhaber','u_chef:Küchenchef','u_bar:Bar','u_staff:Commis'].every(k => s.users.some(u => u && u.id + ':' + u.name === k));
  const idMap = old4 ? {u_owner:'u_chef', u_bar:'u_staff'} : {};
  if(old4) s.users = [{id:'u_chef',name:'Chef',role:'chef'},{id:'u_staff',name:'Team',role:'team'}];
  s.users = s.users.filter(u => u && u.id); s.users.forEach(u => { u.role = roleNorm(u.role); u.name = u.name || ROLES[u.role]; });
  if(!s.users.some(u => u.role === 'chef')) s.users.unshift({id:'u_chef',name:'Chef',role:'chef'});
  if(idMap[s.currentUser]) s.currentUser = idMap[s.currentUser];
  if(!s.users.some(u => u.id === s.currentUser)) s.currentUser = s.users[0].id;
  if(old4 && d.team && Array.isArray(d.team.people)) d.team.people.forEach(p => { if(!p) return; if(p.user === 'u_owner') p.user = d.team.people.some(x => x && x.user === 'u_chef') ? '' : 'u_chef'; else if(p.user === 'u_bar') p.user = ''; });
  if(old4) d.orders.forEach(o => { if(!o) return; ['createdBy','sentBy'].forEach(k => { if(idMap[o[k]]) o[k] = idMap[o[k]]; }); if(o.receipt && idMap[o.receipt.checkedBy]) o.receipt.checkedBy = idMap[o.receipt.checkedBy]; });
  // Limit und Status 'approval' gibt es nicht mehr: wartende Bestellungen sind wieder Entwürfe
  delete s.orderLimit; d.orders.forEach(o => { if(o && o.status === 'approval') o.status = 'draft'; if(o){ delete o.approvalBy; delete o.approvedBy; delete o.approved; } });
  if(!s.orderNo) s.orderNo = d.orders.length+1;
  ['address','deliveryNote','phone','email'].forEach(k => { if(s[k]==null) s[k] = ''; });
  return d;
}

/* ---------- Hilfsfunktionen ---------- */
const SUP = id => (S.suppliers||[]).find(x=>x.id===id);
/* Neue Bestellung: erst eine Vorschau (ORD_TMP), ein Entwurf entsteht mit der ersten Änderung bzw. beim Senden */
let ORD_TMP = null;
const ORD = id => (S.orders||[]).find(x=>x.id===id) || (ORD_TMP && ORD_TMP.id === id ? ORD_TMP : null);
function supName(p){ const s = SUP(p.supplier); return s ? s.name : (p.supplier || 'kein Lieferant'); }
function me(){ if(typeof cloudReady==='function' && cloudReady() && CL.member) return {id:CL.session?.user?.id||'cloud', name:CL.member.name, role:roleNorm(CL.member.role)}; return S.settings.users.find(u=>u.id===S.settings.currentUser) || {id:'?', name:'?', role:'chef'}; }
const USER_OLD = {u_owner:'u_chef', u_bar:'u_staff'};   // frühere Kennungen (vier Rollen) → heutige
function userName(id){ const us = S.settings.users||[]; const u = us.find(x=>x.id===id) || us.find(x=>x.id===USER_OLD[id]); return u ? u.name : !id ? '—' : id.length > 20 ? 'Team' : 'unbekannt'; }
function orderTotal(o){ return o.lines.reduce((t,l)=>t + (+l.n||0)*(+l.price||0), 0); }
function deliveredTotal(o){ return o.lines.reduce((t,l)=>t + (+(l.delivered ?? l.n)||0)*(+(l.invPrice ?? l.price)||0), 0); }
function supProducts(sid){ return stockProducts().filter(p=>p.supplier===sid).sort(byName); }
function packSuggest(p){ const q = orderSuggest(p); if(!q) return 0; return p.packQty ? Math.ceil(q/p.packQty) : q; }
function lineFor(p, n){ const f = p.packQty || 1; return {pid:p.id, n, f, ou:p.packQty ? p.pack : p.unit, price:Math.round((+p.price||0)*f*100)/100, artNo:p.artNo||'', delivered:null, invPrice:null, ls:''}; }
function hm(s){ const [h,m] = String(s||'00:00').split(':').map(Number); return (h||0)*60+(m||0); }
function nowMin(){ const d = new Date(); return d.getHours()*60+d.getMinutes(); }
function wd(dateStr){ return new Date(dateStr+'T12:00:00').getDay(); }
function nextOrderDate(sp){ const t = todayStr(); for(let i=0;i<14;i++){ const d = addDays(t,i); if(sp.orderDays.includes(wd(d)) && (i>0 || nowMin() < hm(sp.cutoff))) return d; } return t; }
function nextDelivery(sp, orderDate){ orderDate = orderDate || nextOrderDate(sp); for(let i=1;i<15;i++){ const d = addDays(orderDate,i); if(sp.deliveryDays.includes(wd(d))) return d; } return addDays(orderDate,1); }
function deliveryOptions(sp){ const base = nextOrderDate(sp); const out = []; for(let i=1;i<21 && out.length<5;i++){ const d = addDays(base,i); if(sp.deliveryDays.includes(wd(d))) out.push(d); } return out; }
function dayLabel(d){ return new Date(d+'T12:00:00').toLocaleDateString('de-AT',{weekday:'long', day:'2-digit', month:'2-digit'}); }
function lastOrder(sid){ return S.orders.filter(o=>o.supplier===sid && o.status!=='draft' && o.status!=='cancelled').sort((a,b)=>(b.sentAt||b.createdAt).localeCompare(a.sentAt||a.createdAt))[0]; }
function draftFor(sid){ return S.orders.find(o=>o.supplier===sid && o.status==='draft'); }
function canSend(o){ return me().role === 'chef'; }
function sendBlockReason(o){ return canSend(o) ? '' : 'Das Team bereitet Bestellungen vor. Senden kann sie der Chef.'; }
function statusPill(st){ return `<span class="ost ${st}">${OSTAT[st]||st}</span>`; }
function orderNoNext(){ const n = S.settings.orderNo++; return `B-${todayStr().slice(0,4)}-${String(n).padStart(4,'0')}`; }
function priceHistory(pid){ return movesByDate().filter(m=>m.pid===pid && m.type==='in').slice(0,6).map(m=>m.price); }

function newOrder(sid, fill=true){
  const sp = SUP(sid); const ex = draftFor(sid); if(ex) return ex;
  const o = {id:uid('o'), no:orderNoNext(), supplier:sid, createdAt:new Date().toISOString(), createdBy:me().id, status:'draft', deliveryDate:nextDelivery(sp), note:'', lines:[]};
  if(fill) supNeed(sid, o.deliveryDate).forEach(x => o.lines.push(lineFor(x.p, x.n)));
  S.orders.push(o); return o;
}
/* Was bei einem Lieferanten nötig ist: unter Mindestbestand (wie bisher) und, wo die Rezepturen es zeigen,
   was laut Prognose bis zur übernächsten Lieferung fehlt (Lager + bestellte Lieferungen abgezogen). */
function supNeed(sid, dl){
  const sp = SUP(sid); if(!sp) return []; const t = todayStr();
  dl = dl || nextDelivery(sp); const dl2 = nextDelivery(sp, dl);
  let need = new Map(); try { if(typeof vbNeedUntil === 'function') need = vbNeedUntil(dl2 > dl ? dl2 : dAdd(dl, 1)); } catch(e){ console.warn('Bedarf:', e); }
  const inc = new Map(); (S.orders||[]).forEach(o => { if(!['sent','confirmed'].includes(o.status) || o.deliveryDate >= dl2 || o.deliveryDate < t) return; (o.lines||[]).forEach(l => inc.set(l.pid, (inc.get(l.pid)||0) + (+l.n||0)*(+l.f||1))); });
  return supProducts(sid).map(p => { const st = Math.max(0, +p.stock||0);
    const minQ = (+p.minStock||0) > 0 && st < +p.minStock ? orderSuggest(p) : 0;
    const fq = Math.max(0, (need.get(p.id)||0) - st - (inc.get(p.id)||0)); const q = Math.max(minQ, fq); if(!(q > 0.0005)) return null;
    const n = p.packQty ? Math.ceil(q/p.packQty - 1e-9) : p.unit === 'Stk' ? Math.ceil(q - 1e-9) : Math.ceil(q*2 - 1e-9)/2;
    return n > 0 ? {p, n, prog: fq > minQ} : null; }).filter(Boolean);
}
/* Bestellung öffnen: vorhandener Entwurf oder eine Vorschau mit Vorschlag (noch kein Entwurf, keine Nummer verbraucht) */
function ordStart(sid, fill=true){
  const ex = draftFor(sid); if(ex) return ex; const sp = SUP(sid);
  const o = {id:uid('o'), no:`B-${todayStr().slice(0,4)}-${String(S.settings.orderNo||1).padStart(4,'0')}`, supplier:sid, createdAt:new Date().toISOString(), createdBy:me().id, status:'draft', deliveryDate:nextDelivery(sp), note:'', lines:[], tmp:true};
  if(fill) supNeed(sid, o.deliveryDate).forEach(x => o.lines.push(lineFor(x.p, x.n)));
  ORD_TMP = o; return o;
}
/* aus der Vorschau wird ein Entwurf: beim ersten Speichern, solange die Vorschau offen ist und Positionen hat */
function ordTmpCommit(force){
  const o = ORD_TMP; if(!o || (S.orders||[]).includes(o)) { ORD_TMP = null; return; }
  if(view.order !== o.id && !force) { ORD_TMP = null; return; }
  if(!force && !o.lines.length && !o.note) return;
  if(draftFor(o.supplier)){ ORD_TMP = null; return; }
  o.no = orderNoNext(); o.createdAt = new Date().toISOString(); delete o.tmp; S.orders.push(o); ORD_TMP = null;
}
const _saveEk = save; save = function(){ ordTmpCommit(); return _saveEk.apply(this, arguments); };
function orderText(o){
  if(typeof o === 'string') o = ORD(o);
  const sp = SUP(o.supplier), s = S.settings;
  const rows = o.lines.filter(l=>+l.n>0).map(l => { const p = P(l.pid); return `• ${num(l.n,2)} × ${l.ou}${l.artNo?'  ['+l.artNo+']':''}  ${p?p.name:'?'}`; }).join('\n');
  return `Bestellung ${o.no}\n${s.name}${sp.customerNo?' · Kundennr. '+sp.customerNo:''}\nLieferadresse: ${s.address}${s.deliveryNote?' ('+s.deliveryNote+')':''}\nGewünschte Lieferung: ${dayLabel(o.deliveryDate)}\nAnsprechpartner: ${userName(o.createdBy)==='?'?me().name:me().name} · ${s.phone}\n\n${rows}\n${o.note?'\nBemerkung: '+o.note+'\n':''}\nErsatzartikel bitte nur nach Rücksprache. Bitte bestätigen Sie die Bestellung kurz per Antwort. Danke!\n${s.name}`;
}
function mailHref(o){ const sp = SUP(o.supplier); return `mailto:${encodeURIComponent(sp.email)}?subject=${encodeURIComponent(`Bestellung ${o.no} – ${S.settings.name}`)}&body=${encodeURIComponent(orderText(o))}`; }
function waHref(o){ const sp = SUP(o.supplier); return `https://wa.me/${String(sp.whatsapp||sp.phone).replace(/\D/g,'').replace(/^00/,'')}?text=${encodeURIComponent(orderText(o))}`; }
function receiveIn(p, units, unitPrice, note, date){
  const old = p.price; const chef = canEditAll(); /* das Team bucht die Menge; Einkaufspreise ändert nur der Chef */ if(chef && unitPrice && Math.abs(unitPrice - p.price) > 0.0001){ const s0 = Math.max(0, +p.stock||0); p.price = prRound(p, (s0*p.price + units*unitPrice)/(s0+units)); }
  addMove('in', p.id, units, note, unitPrice || p.price, date); if(chef && unitPrice) markPrice(p, 'Wareneingang'); if(old !== p.price) S.moves[0].prevPrice = old;
}

/* ---------- Ansicht: Bestellungen-Cockpit ---------- */
function orderView(){
  if(view.order && ORD(view.order)) return orderEditor(ORD(view.order));
  const t = todayStr(), now = nowMin(), today = wd(t);
  const sups = (S.suppliers||[]).filter(s=>s.active);
  const todayList = sups.filter(s => s.orderDays.includes(today)).sort((a,b)=>hm(a.cutoff)-hm(b.cutoff));
  const expected = S.orders.filter(o => ['sent','confirmed'].includes(o.status) && o.deliveryDate <= addDays(t,1)).sort((a,b)=>a.deliveryDate.localeCompare(b.deliveryDate));
  const open = S.orders.filter(o => ['draft','sent','confirmed','complaint'].includes(o.status));
  const card = sp => { const low = lowStock().filter(p=>p.supplier===sp.id); const val = low.reduce((a,p)=>a+packSuggest(p)*(p.packQty||1)*p.price,0); const st = supToday(sp); const left = st.left; const dr = draftFor(sp.id); const last = lastOrder(sp.id);
    const cls = st.state === 'sent' ? 'past done' : st.state === 'past' ? 'past' : left < 60 ? 'urgent' : left < 180 ? 'soon' : '';
    return `<article class="oc ${cls}"><div class="oc-h"><span class="tag">${esc(SUP_CATS[sp.cat]||'')}</span><span class="cd mono">${esc(st.label)}</span></div>
      <h3>${esc(sp.name)}</h3><div class="muted sm">${CHANNELS[sp.channel]} · bis ${esc(sp.cutoff)} Uhr · Lieferung ${dayLabel(st.delivery)}</div>
      <div class="oc-m"><span><b class="mono">${low.length}</b><small>unter Mindestbestand</small></span><span><b class="mono">${eur(val)}</b><small>Vorschlag${sp.minOrder ? ` · Mindestwert ${eur(sp.minOrder)}` : ''}</small></span></div>
      <div class="meter"><i style="width:${Math.min(100, sp.minOrder?val/sp.minOrder*100:100).toFixed(0)}%"></i></div>
      <div class="row-btns">${dr ? `<button type="button" class="btn sm primary" data-act="ordOpen" data-id="${dr.id}">${statusPill(dr.status)} öffnen</button>` : `<button type="button" class="btn sm primary" data-act="ordNew" data-id="${sp.id}">${ico('cart')}Bestellung vorbereiten</button>`}${last?`<button type="button" class="btn sm" data-act="ordRe" data-id="${last.id}">Wie zuletzt</button>`:''}</div></article>`; };
  return `<div class="ord-top">
    <section class="panel"><div class="panel-h"><h2>Heute bestellen · ${DAYNAME[today]}</h2><span class="muted sm">${todayList.length} Lieferanten</span></div>
      ${todayList.length ? `<div class="oc-grid">${todayList.map(card).join('')}</div>` : '<p class="hint">Heute ist kein Bestelltag.</p>'}
    </section>
    <section class="panel"><div class="panel-h"><h2>Erwartete Lieferungen</h2></div>
      ${expected.length ? `<ul class="todo">${expected.map(o=>{ const sp = SUP(o.supplier); const late = o.deliveryDate < t; return `<li><button type="button" data-act="ordRecv" data-id="${o.id}"><b class="${late?'bad-t':''}">${late?'!':o.deliveryDate===t?'heute':'morgen'}</b><span>${esc(sp.name)} · ${o.lines.length} Positionen · ${eur(orderTotal(o))}<small class="muted" style="display:block">${esc(o.no)} · ${statusPill(o.status)} ${late?'· überfällig':''}</small></span>${ico('arrow','flip')}</button></li>`; }).join('')}</ul>` : '<p class="hint">Heute und morgen kommen keine bestellten Lieferungen.</p>'}
    </section></div>
  <h2 class="sec-h">Letzte Bestellung je Lieferant</h2>
  <div class="lo-grid">${sups.map(sp => { const o = lastOrder(sp.id); return `<article class="lo">
    <div class="lo-h"><b>${esc(sp.name)}</b>${o?statusPill(o.status):''}</div>
    ${o ? `<div class="muted sm">${esc(o.no)} · ${fmtDate(o.sentAt||o.createdAt)} · von ${esc(userName(o.createdBy))}</div>
      <div class="lo-m"><span class="mono">${o.lines.length} Pos.</span><span class="mono">${o.receipt ? `<small class="tot-l">geliefert</small> ${eur(deliveredTotal(o))}` : `<small class="tot-l">bestellt</small> ${eur(orderTotal(o))}`}</span></div>
      <div class="row-btns"><button type="button" class="btn sm" data-act="ordOpen" data-id="${o.id}">Ansehen</button><button type="button" class="btn sm" data-act="ordRe" data-id="${o.id}">Nachbestellen</button></div>` : `<p class="hint">Noch keine Bestellung.</p><div class="row-btns"><button type="button" class="btn sm" data-act="ordNew" data-id="${sp.id}">Erste Bestellung</button></div>`}
  </article>`; }).join('')}</div>
  <h2 class="sec-h">Alle Bestellungen<small class="muted sm">${open.length} offen</small></h2>
  <div class="chips-row">${['all','open','draft','sent','confirmed','delivered','complaint'].map(k=>`<button type="button" class="chip ${(view.ofilter||'open')===k?'on':''}" data-act="ofilter" data-id="${k}">${k==='all'?'Alle':k==='open'?'Offen':OSTAT[k]}<small>${k==='all'?S.orders.length:k==='open'?open.length:S.orders.filter(o=>o.status===k).length}</small></button>`).join('')}</div>
  <section class="panel flush">${orderList()}</section>`;
}
function orderList(){
  const f = view.ofilter || 'open';
  const list = S.orders.filter(o => f==='all' || (f==='open' ? ['draft','sent','confirmed','complaint'].includes(o.status) : o.status===f)).sort((a,b)=>(b.sentAt||b.createdAt).localeCompare(a.sentAt||a.createdAt));
  return list.length ? `<ul class="olist">${list.map(o=>{ const sp = SUP(o.supplier); return `<li><button type="button" data-act="ordOpen" data-id="${o.id}">
    <span class="mono sm muted">${esc(o.no)}</span><span class="on"><b>${esc(sp?sp.name:'?')}</b><small class="muted">${o.lines.length} Positionen · Lieferung ${fmtDate(o.deliveryDate+'T12:00:00')}</small></span>${statusPill(o.status)}<span class="mono ol-tot">${o.receipt ? `<small class="tot-l">geliefert</small> ${eur(deliveredTotal(o))}` : `<small class="tot-l">bestellt</small> ${eur(orderTotal(o))}`}</span></button></li>`; }).join('')}</ul>` : '<div class="empty">Keine Bestellungen in dieser Ansicht.</div>';
}

/* ---------- Bestellung bearbeiten / senden / empfangen ---------- */
function orderEditor(o){
  const sp = SUP(o.supplier); const tot = orderTotal(o); const editable = o.status === 'draft'; const pf = orderPfand(o), pfD = o.receipt ? orderPfand(o, true) : 0;
  const recv = view.recv === o.id && ['sent','confirmed'].includes(o.status);
  const block = sendBlockReason(o);
  const hasCold = o.lines.some(l => P(l.pid)?.loc === 'K' || P(l.pid)?.loc === 'T');
  const head = `<button type="button" class="back" data-act="ordBack">${ico('arrow')}Alle Bestellungen</button>
  <section class="panel ord-head">
    <div><h1 class="h-ord">${esc(sp.name)}</h1><div class="muted sm">${o.tmp ? 'Neue Bestellung, noch nicht gespeichert' : esc(o.no)} · ${esc(SUP_CATS[sp.cat]||'')}</div>
      <div class="muted sm">${CHANNELS[sp.channel]}${sp.email?' · '+esc(sp.email):''}${sp.phone?' · '+esc(sp.phone):''}${sp.customerNo?' · Kundennr. '+esc(sp.customerNo):''}</div></div>
    <div class="ord-st">${statusPill(o.status)}<span class="muted sm">erstellt ${fmtDate(o.createdAt)} von ${esc(userName(o.createdBy))}${o.sentAt?` · gesendet ${fmtDate(o.sentAt)} via ${esc(o.sentVia||'')}`:''}</span></div>
  </section>`;
  if(recv) return head + receiveForm(o, hasCold);
  const rows = o.lines.map((l,i) => { const p = P(l.pid); const hist = priceHistory(l.pid); const ip = l.invPrice != null && l.invPrice !== '' ? +l.invPrice : null; const dev = o.receipt && ip != null && +l.price && Math.abs(ip - l.price) > 0.004 ? (ip/l.price-1)*100 : null; return `<tr>
    <td data-l="Artikel"><b class="pn">${esc(p?p.name:'?')}</b><small class="muted">${esc(l.artNo||'ohne Art.-Nr.')} · Bestand ${p?qtyFmt(+p.stock||0,p):'—'}${hist.length>1 && hist[0]!==hist[1] && hist[1] ? ` · Preis ${hist[0]>hist[1]?'▲':'▼'} ${num(Math.abs(hist[0]/hist[1]-1)*100,1)} %`:''}</small></td>
    <td class="r" data-l="Menge">${editable ? `<span class="qty"><input id="ol-${i}" class="num-in" type="text" inputmode="decimal" data-num="req" data-msg="Ungültige Menge, nicht geändert" data-ol="${i}" value="${numIn(l.n)}" aria-label="Menge ${esc(p?p.name:'')}"><em>× ${esc(l.ou)}</em></span>` : `<span class="mono">${num(l.n,2)} × ${esc(l.ou)}</span>`}</td>
    <td class="r mono muted" data-l="= Einheit">${l.f!==1?qtyFmt(l.n*l.f,p):''}</td>
    <td class="r mono" data-l="Preis">${eur(l.price)}</td><td class="r mono" data-l="Summe">${eur(l.n*l.price)}</td>
    ${o.receipt ? `<td class="r mono ${l.ls&&l.ls!=='ok'?'bad-t':''}" data-l="Geliefert">${l.delivered!=null?num(l.delivered,2):'—'}${l.ls&&l.ls!=='ok'?' · '+LSTAT[l.ls]:''}</td>
    <td class="r mono" data-l="Rechnungspreis">${ip != null ? eur(ip) : '—'}${dev != null ? `<small class="dev ${dev>3?'bad-t':dev<0?'good-t':''}">${eur(l.price)} → ${eur(ip)} · ${dev>0?'+':'−'}${num(Math.abs(dev),1)} %</small>` : ''}</td>` : ''}
    <td class="ol-x">${editable?`<button type="button" class="icon-btn" data-act="olDel" data-id="${i}" aria-label="Position entfernen">${ico('x')}</button>`:''}</td></tr>`; }).join('');
  const emptyTxt = o.tmp ? `Nichts nötig: kein Artikel von ${esc(sp.name)} unter Mindestbestand, und laut Prognose fehlt nichts bis zur nächsten Lieferung. Wenn Sie trotzdem bestellen, fügen Sie unten Artikel hinzu.` : 'Noch keine Positionen.';
  const addable = supProducts(sp.id).filter(p => !o.lines.some(l=>l.pid===p.id));
  const sendBtns = () => { if(!editable) return ''; if(!o.lines.some(l=>+l.n>0)) return '<p class="hint">Fügen Sie mindestens eine Position hinzu.</p>';
    if(block) return `<p class="hint">${esc(block)}</p>`;
    const cloud = typeof cloudReady==='function' && cloudReady() && sp.email;
    const b = [];
    if(cloud) b.push(`<button type="button" class="btn primary" data-act="ordCloudSend" data-id="${o.id}">${ico('truck')}Jetzt per E-Mail senden</button>`);
    if(sp.email) b.push(`<a class="btn ${cloud?'':'primary'}" href="${mailHref(o)}" data-act="ordOpened" data-id="${o.id}:E-Mail">${ico('menu')}E-Mail öffnen</a>`);
    if(sp.whatsapp) b.push(`<a class="btn ${!sp.email&&!cloud?'primary':''}" href="${waHref(o)}" target="_blank" rel="noopener" data-act="ordOpened" data-id="${o.id}:WhatsApp">WhatsApp öffnen</a>`);
    if(sp.shopUrl) b.push(`<a class="btn" href="${esc(sp.shopUrl)}" target="_blank" rel="noopener" data-act="ordOpened" data-id="${o.id}:Webshop">Webshop öffnen</a>`);
    b.push(`<button type="button" class="btn" data-act="ordCopy" data-id="${o.id}">${ico('copy')}Text kopieren</button>`);
    if(!FRAMED) b.push(`<button type="button" class="btn" data-act="ordPrint" data-id="${o.id}">${ico('print')}Drucken</button>`);
    b.push(`<button type="button" class="btn" data-act="ordMarkSent" data-id="${o.id}">${sp.channel==='phone'?'Telefonisch bestellt':'Als gesendet markieren'}</button>`);
    return `<div class="send-row">${b.join('')}</div>${view.opened===o.id?`<div class="ok-box">Bestellung im ${esc(view.openedVia||'')} geöffnet? Nach dem Senden hier bestätigen: <button type="button" class="btn sm" data-act="ordMarkSent" data-id="${o.id}">Ja, gesendet</button></div>`:''}`; };
  const below = sp.minOrder && tot < sp.minOrder;
  return head + `<div class="grid2 ord-grid ${o.receipt ? 'has-rc' : ''}">
    <div class="col">
      <section class="panel flush"><div class="panel-h pad"><h2>Positionen</h2><span class="muted sm">${o.lines.length}</span></div>
        <div class="tbl-wrap"><table class="otab"><thead><tr><th>Artikel</th><th class="r">Menge</th><th class="r">= Einheit</th><th class="r">Preis</th><th class="r">Summe</th>${o.receipt?'<th class="r">Geliefert</th><th class="r">Rechnungspreis</th>':''}<th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6" class="muted ol-empty">${emptyTxt}</td></tr>`}</tbody>
        <tfoot><tr><td colspan="4">${o.receipt ? 'Summe bestellt, exkl. MwSt.' : 'Summe exkl. MwSt.'}</td><td class="r mono" data-l="${o.receipt ? 'Summe bestellt' : 'Summe'}">${eur(tot)}</td>${o.receipt?`<td class="r muted tf-l">geliefert</td><td class="r mono" data-l="Summe geliefert">${eur(deliveredTotal(o))}</td>`:''}<td class="ol-x"></td></tr>${pf > 0 || pfD > 0 ? `<tr class="pf-row"><td colspan="4">Pfand, kommt mit dem Leergut zurück</td><td class="r mono" data-l="Pfand">${eur(pf)}</td>${o.receipt?`<td class="r muted tf-l">geliefert</td><td class="r mono" data-l="Pfand geliefert">${eur(pfD)}</td>`:''}<td class="ol-x"></td></tr>` : ''}</tfoot></table></div>
        ${editable ? `<div class="panel-f"><select id="olAdd" class="sm-sel" aria-label="Artikel hinzufügen"><option value="">+ Artikel von ${esc(sp.name)} …</option>${addable.map(p=>`<option value="${p.id}">${esc(p.name)}${p.pack?' ('+esc(p.pack)+')':''}</option>`).join('')}</select><button type="button" class="btn sm" data-act="olSuggest" data-id="${o.id}">Vorschlag laden</button></div>` : ''}
      </section>
      ${o.complaint ? `<section class="panel"><div class="panel-h"><h2>Reklamation</h2><select data-cst="${o.id}" class="sm-sel">${Object.entries(CSTAT).map(([k,l])=>`<option value="${k}" ${o.complaint.status===k?'selected':''}>${l}</option>`).join('')}</select></div>
        <textarea data-ctext="${o.id}" class="sm-ta" style="min-height:110px">${esc(o.complaint.text)}</textarea>
        <div class="row-btns" style="margin-top:10px">${sp.email?`<a class="btn sm" href="mailto:${encodeURIComponent(sp.email)}?subject=${encodeURIComponent('Reklamation zu '+o.no)}&body=${encodeURIComponent(o.complaint.text+'\n\n'+S.settings.name)}">E-Mail an Lieferant</a>`:''}${sp.whatsapp?`<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${sp.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent('Reklamation zu '+o.no+': '+o.complaint.text)}">WhatsApp</a>`:''}<button type="button" class="btn sm" data-act="cCopy" data-id="${o.id}">${ico('copy')}Kopieren</button></div>
        ${o.receipt?.photo && IMG[o.receipt.photo] ? `<img class="ls-ph" src="${IMG[o.receipt.photo]}" alt="Lieferschein">` : ''}</section>` : ''}
    </div>
    <div class="col">
      <section class="panel ${editable?'accent':''}">
        <div class="panel-h"><h2>${editable?'Senden':'Status'}</h2></div>
        ${editable ? `<label class="f">Gewünschte Lieferung<select data-od="${o.id}">${[...new Set([o.deliveryDate, ...deliveryOptions(sp)])].sort().map(d=>`<option value="${d}" ${o.deliveryDate===d?'selected':''}>${dayLabel(d)}</option>`).join('')}</select></label>
          <label class="f">Bemerkung an den Lieferanten<input data-on="${o.id}" value="${esc(o.note)}" placeholder="z. B. Leergut 3 Kisten mitnehmen"></label>
          <div class="kv"><span>${pf > 0 ? 'Ware' : 'Summe'}</span><span>${eur(tot)}</span>${pf > 0 ? `<span>Pfand</span><span>${eur(pf)}</span>` : ''}<span>Mindestbestellwert</span><span class="${below?'bad-t':''}">${sp.minOrder ? eur(sp.minOrder) + (below ? '' : ' · erreicht') : 'keiner'}</span><span>Annahmeschluss</span><span>${esc(sp.cutoff)} Uhr</span></div>
          ${below ? `<p class="hint bad-t">Noch ${eur(sp.minOrder-tot)} bis zum Mindestbestellwert.</p>` : ''}
          ${sendBtns()}
          <details class="alg-det"><summary>Bestelltext ansehen</summary><pre class="otext">${esc(orderText(o))}</pre></details>`
        : `<div class="kv"><span>Lieferung</span><span>${dayLabel(o.deliveryDate)}</span><span>${pf > 0 ? 'Ware bestellt' : 'Summe bestellt'}</span><span>${eur(tot)}</span>${pf > 0 && !o.receipt ? `<span>Pfand</span><span>${eur(pf)}</span>` : ''}${o.receipt?`<span>${pfD > 0 ? 'Ware geliefert' : 'Summe geliefert'}</span><span>${eur(deliveredTotal(o))}</span>${pfD > 0 ? `<span>Pfand</span><span>${eur(pfD)}</span>` : ''}<span>Lieferschein</span><span>${esc(o.receipt.noteNo||'—')}</span><span>Geprüft von</span><span>${esc(userName(o.receipt.checkedBy))}</span>${o.receipt.temp?`<span>Temperatur</span><span>${esc(o.receipt.temp)}</span>`:''}`:''}${o.confirmedNote?`<span>Bestätigung</span><span>${esc(o.confirmedNote)}</span>`:''}</div>
          <div class="row-btns" style="margin-top:12px">
            ${o.status==='sent'?`<button type="button" class="btn" data-act="ordConfirm" data-id="${o.id}">Bestätigung erhalten</button>`:''}
            ${['sent','confirmed'].includes(o.status)?`<button type="button" class="btn primary" data-act="ordRecv" data-id="${o.id}">${ico('truck')}Wareneingang prüfen</button><button type="button" class="btn" data-act="ordDelay" data-id="${o.id}">Lieferung verschoben</button>`:''}
            <button type="button" class="btn" data-act="ordRe" data-id="${o.id}">Nachbestellen</button>
            ${['sent','confirmed'].includes(o.status)?`<button type="button" class="btn danger" data-act="ordCancel" data-id="${o.id}">Stornieren</button>`:''}
          </div>`}
        ${editable?`<div class="row-btns" style="margin-top:12px"><button type="button" class="btn sm danger" data-act="ordDel" data-id="${o.id}">Entwurf löschen</button></div>`:''}
      </section>
      <section class="panel"><div class="panel-h"><h2>Lieferant</h2><button type="button" class="icon-btn" data-act="supEdit" data-id="${sp.id}" aria-label="Lieferant bearbeiten">${ico('edit')}</button></div>
        <div class="kv"><span>Bestelltage</span><span>${DAYS.filter(([i])=>sp.orderDays.includes(i)).map(([,l])=>l).join(' ')}</span><span>Liefertage</span><span>${DAYS.filter(([i])=>sp.deliveryDays.includes(i)).map(([,l])=>l).join(' ')}</span><span>Ansprechpartner</span><span>${esc(sp.contact||'—')}</span></div>
        ${sp.note?`<p class="hint">${esc(sp.note)}</p>`:''}</section>
    </div></div>`;
}
function receiveForm(o, hasCold){
  return `<section class="panel flush"><div class="panel-h pad"><h2>Wareneingang prüfen</h2><button type="button" class="btn sm" data-act="rAll" data-id="${o.id}">Alles wie bestellt</button></div>
    <div class="tbl-wrap"><table class="otab recv"><thead><tr><th>Artikel</th><th class="r">Bestellt</th><th class="r">Geliefert</th><th class="r">Preis lt. Rechnung</th><th>Status</th></tr></thead><tbody>
    ${o.lines.map((l,i)=>{ const p = P(l.pid); const d = l.delivered ?? ''; const ip = l.invPrice ?? l.price; const diff = ip && l.price ? (ip/l.price-1)*100 : 0; return `<tr>
      <td data-l="Artikel"><b class="pn">${esc(p?p.name:'?')}</b><small class="muted">${esc(l.artNo)} · ${esc(l.ou)}</small></td>
      <td class="r mono" data-l="Bestellt">${num(l.n,2)} × ${esc(l.ou)}<small class="muted rc-sum">${eur(l.price)} je ${esc(l.ou)} · Summe ${eur(l.n*l.price)}</small></td>
      <td class="r" data-l="Geliefert"><input id="rd-${i}" class="num-in" type="text" inputmode="decimal" data-num="de" data-msg="Ungültige Menge, nicht geändert" data-rd="${i}" value="${numIn(d)}" placeholder="${num(l.n,2)}" aria-label="Geliefert ${esc(p?p.name:'')}"></td>
      <td class="r" data-l="Preis lt. Rechnung"><span class="qty"><input id="rp-${i}" class="num-in" type="text" inputmode="decimal" data-num="de price" data-rp="${i}" value="${num2(ip)}" aria-label="Preis laut Rechnung ${esc(p?p.name:'')}"><em class="${Math.abs(diff)>3?'bad-t':''}">${Math.abs(diff)>0.05?(diff>0?'+':'−')+num(Math.abs(diff),1)+' %':''}</em></span></td>
      <td data-l="Status"><select data-rs="${i}" aria-label="Status ${esc(p?p.name:'')}">${Object.entries(LSTAT).map(([k,v])=>`<option value="${k}" ${(l.ls||'ok')===k?'selected':''}>${v}</option>`).join('')}</select></td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="panel-f recv-f">
      <label class="f">Lieferschein-Nr.<input id="rNo" value="${esc(o.receiptDraft?.noteNo||'')}" placeholder="z. B. LS 2240"></label>
      ${ekRecvFields(o)}
      <div class="f">Foto Lieferschein<div class="row-btns">${o.receiptDraft?.photo && IMG[o.receiptDraft.photo] ? `<img class="ls-th" src="${IMG[o.receiptDraft.photo]}" alt="">` : ''}<button type="button" class="btn sm" data-act="rPhoto" data-id="${o.id}">${ico('camera')}${o.receiptDraft?.photo?'Ändern':'Aufnehmen'}</button></div></div>
      <span class="sp"></span><button type="button" class="btn" data-act="rCancel">Abbrechen</button><button type="button" class="btn primary" data-act="rBook" data-id="${o.id}">Einbuchen</button>
    </div>
    <p class="hint pad-x pad-b">Leeres Feld „Geliefert“ heißt: wie bestellt. Preisabweichungen über 3 % werden markiert, der Einkaufspreis wird als gleitender Durchschnitt übernommen. Bei Abweichungen entsteht automatisch eine Reklamation.${orderPfand(o) > 0 ? ' Das Pfand der gelieferten Gebinde wird beim Leergut des Lieferanten vermerkt.' : ''}</p>
  </section>`;
}

/* ---------- Lieferanten ---------- */
const MONTH_NAMES_EK = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
function supplierView(){
  const sups = S.suppliers || [];
  return `<div class="lo-grid">${sups.map(sp => { const n = S.products.filter(p=>p.supplier===sp.id).length; const spend = S.orders.filter(o=>o.supplier===sp.id && o.receipt && o.receipt.date.slice(0,7)===todayStr().slice(0,7)).reduce((a,o)=>a+deliveredTotal(o),0); return `<article class="lo ${sp.active?'':'off'}">
    <div class="lo-h"><b>${esc(sp.name)}</b><span class="tag">${CHANNELS[sp.channel]}</span></div>
    <div class="muted sm">${esc(SUP_CATS[sp.cat]||'')} · ${n} Artikel${sp.customerNo?' · Kd.-Nr. '+esc(sp.customerNo):''}</div>
    <div class="kv"><span>Bestellen</span><span>${DAYS.filter(([i])=>sp.orderDays.includes(i)).map(([,l])=>l).join(' ')} bis ${esc(sp.cutoff)}</span><span>Lieferung</span><span>${DAYS.filter(([i])=>sp.deliveryDays.includes(i)).map(([,l])=>l).join(' ')}</span><span>Mindestwert</span><span>${eur(sp.minOrder)}</span><span>Einkauf ${MONTH_NAMES_EK[new Date().getMonth()]}</span><span>${eur(spend)}</span></div>
    <div class="row-btns"><button type="button" class="btn sm" data-act="supEdit" data-id="${sp.id}">${ico('edit')}Bearbeiten</button><button type="button" class="btn sm" data-act="ordNew" data-id="${sp.id}">${ico('cart')}Bestellen</button></div>
  </article>`; }).join('')}</div>
  ${lgSection()}
  <h2 class="sec-h">Preisentwicklung</h2>
  <section class="panel flush"><div class="tbl-wrap"><table class="otab"><thead><tr><th>Artikel</th><th>Lieferant</th><th class="r">Aktuell</th><th class="r">Vorher</th><th class="r">Änderung</th></tr></thead><tbody>
  ${S.products.map(p=>{ const h = priceHistory(p.id); const prev = movesByDate().find(m=>m.pid===p.id && m.prevPrice!=null)?.prevPrice ?? (h[1]); if(prev==null || Math.abs(prev - p.price) < 0.005) return ''; const ch = (p.price/prev-1)*100; return `<tr><td><b class="pn">${esc(p.name)}</b></td><td class="muted">${esc(supName(p))}</td><td class="r mono">${eur(p.price*priceUnit(p).f)}</td><td class="r mono muted">${eur(prev*priceUnit(p).f)}</td><td class="r mono ${ch>3?'bad-t':ch<0?'good-t':''}">${ch>0?'+':''}${num(ch,1)} %</td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">Noch keine Preisänderungen erfasst.</td></tr>'}
  </tbody></table></div></section>`;
}
function supplierDialog(sp){
  const isNew = !sp; sp = sp || {id:uid('sup'), name:'', cat:'gross', channel:'email', contact:'', phone:'', whatsapp:'', email:'', shopUrl:'', customerNo:'', orderDays:[1,3,5], cutoff:'12:00', deliveryDays:[2,4,6], minOrder:0, freight:0, note:'', active:true};
  const dayBoxes = (name, sel) => `<div class="days">${DAYS.map(([i,l])=>`<label class="algc"><input type="checkbox" name="${name}" value="${i}" ${sel.includes(i)?'checked':''}><span>${l}</span></label>`).join('')}</div>`;
  openDialog(isNew ? 'Neuer Lieferant' : 'Lieferant bearbeiten', `
    <label class="f">Name<input name="name" required value="${esc(sp.name)}"></label>
    <div class="fields two"><label class="f">Bereich<select name="cat">${Object.entries(SUP_CATS).map(([k,l])=>`<option value="${k}" ${sp.cat===k?'selected':''}>${l}</option>`).join('')}</select></label>
      <label class="f">Bestellweg<select name="channel">${Object.entries(CHANNELS).map(([k,l])=>`<option value="${k}" ${sp.channel===k?'selected':''}>${l}</option>`).join('')}</select></label></div>
    <div class="fields two"><label class="f">E-Mail für Bestellungen<input name="email" type="email" value="${esc(sp.email)}"></label><label class="f">WhatsApp-Nummer<input name="whatsapp" value="${esc(sp.whatsapp)}" placeholder="+43 …"></label>
      <label class="f">Telefon<input name="phone" value="${esc(sp.phone)}"></label><label class="f">Webshop-Adresse<input name="shopUrl" value="${esc(sp.shopUrl)}" placeholder="https://"></label>
      <label class="f">Kundennummer<input name="customerNo" value="${esc(sp.customerNo)}"></label><label class="f">Ansprechpartner<input name="contact" value="${esc(sp.contact)}"></label></div>
    <div class="f">Bestelltage</div>${dayBoxes('od', sp.orderDays)}
    <div class="f">Liefertage</div>${dayBoxes('dd', sp.deliveryDays)}
    <div class="fields two"><label class="f">Annahmeschluss<input name="cutoff" type="time" value="${esc(sp.cutoff)}"></label><label class="f">Mindestbestellwert €<input name="minOrder" class="num-in" type="text" inputmode="decimal" value="${numIn(sp.minOrder)}"></label></div>
    <label class="f">Notiz<input name="note" value="${esc(sp.note)}" placeholder="z. B. Leergut freitags, Rechnung monatlich"></label>
    <div class="togs"><label class="tog"><input type="checkbox" name="active" ${sp.active?'checked':''}><span></span>Aktiv</label></div>`,
    fd => { Object.assign(sp, {name:fd.get('name').trim(), cat:fd.get('cat'), channel:fd.get('channel'), email:fd.get('email').trim(), whatsapp:fd.get('whatsapp').trim(), phone:fd.get('phone').trim(), shopUrl:fd.get('shopUrl').trim(), customerNo:fd.get('customerNo').trim(), contact:fd.get('contact').trim(),
      orderDays:fd.getAll('od').map(Number), deliveryDays:fd.getAll('dd').map(Number), cutoff:fd.get('cutoff')||'12:00', minOrder:+fd.get('minOrder')||0, note:fd.get('note').trim(), active:!!fd.get('active')});
      if(isNew) S.suppliers.push(sp); },
    {del: isNew ? null : () => { const n = S.products.filter(p=>p.supplier===sp.id).length; if(n) return info('Lieferant hat Artikel', `${n} Artikel sind diesem Lieferanten zugeordnet. Ordnen Sie sie zuerst einem anderen Lieferanten zu oder setzen Sie ihn auf inaktiv.`); ask(`Lieferant „${sp.name}“ löschen?`, () => { S.suppliers = S.suppliers.filter(x=>x!==sp); }); }});
}
function delayDialog(o){
  const sp = SUP(o.supplier);
  openDialog('Lieferung verschoben', `<p class="dlg-p">Neuer Liefertermin für ${esc(sp.name)}, ${esc(o.no)}. Das Cockpit zeigt die Lieferung dann am neuen Tag.</p>
    <label class="f">Neuer Termin<input name="d" type="date" required value="${addDays(o.deliveryDate,1)}"></label>
    <label class="f">Grund<select name="r"><option>Schneefall / Straße gesperrt</option><option>Lieferant hat verschoben</option><option>Ware nicht lieferbar</option><option>Sonstiges</option></select></label>`,
    fd => { o.deliveryDate = fd.get('d'); o.confirmedNote = `Verschoben: ${fd.get('r')}`; }, {ok:'Verschieben', done:'Liefertermin geändert'});
}
function printOrder(o){ $('#print').innerHTML = `<pre style="font:12pt/1.5 'JetBrains Mono',monospace;white-space:pre-wrap">${esc(orderText(o))}</pre>`; document.body.classList.remove('print-menu'); window.print(); }

/* Wareneingang einer Bestellung einbuchen. ek: Temperatur der Lieferung für die Eigenkontrolle (oder null) */
function ordBook(o, ek){
      const r = o.receiptDraft || {}; r.noteNo = $('#rNo')?.value || r.noteNo || '';
      const diffs = [], priceUp = []; const date = new Date().toISOString();
      o.lines.forEach(l => { const p = P(l.pid); if(l.delivered == null || l.delivered === '') l.delivered = l.n; l.delivered = +l.delivered; if(l.invPrice == null || l.invPrice === '') l.invPrice = l.price; l.invPrice = +l.invPrice;
        if(!l.ls || l.ls==='ok'){ l.ls = l.delivered === 0 ? 'missing' : l.delivered < l.n ? 'short' : 'ok'; }
        if(p && l.delivered > 0) receiveIn(p, l.delivered*l.f, l.invPrice/l.f, `${o.no}${r.noteNo?' · '+r.noteNo:''}`, date);
        if(l.ls !== 'ok') diffs.push(`${p?p.name:'?'}: ${LSTAT[l.ls]} (bestellt ${num(l.n,2)} × ${l.ou}, geliefert ${num(l.delivered,2)})`);
        if(l.price && (l.invPrice/l.price-1)*100 > 3) priceUp.push(`${p?p.name:'?'}: ${eur(l.price)} → ${eur(l.invPrice)}`); });
      o.lines.forEach(l => { l.pf = linePfand(l); }); const pfSum = orderPfand(o, true);
      o.receipt = {date, noteNo:r.noteNo, temp:'', photo:r.photo||'', checkedBy:me().id}; delete o.receiptDraft;
      if(ek){ const rec = ekLogWe({...ek, sup:o.supplier, order:o.id, ref:o.no}); o.receipt.temp = ekWeTxt(rec); o.receipt.ek = rec.id; }   // Eigenkontrolle: Temperatur dieser Lieferung
      if(pfSum > 0){ o.receipt.pfand = pfSum; lgAdd(o.supplier, pfSum, `Lieferung ${o.no}`, date).order = o.id; }
      if(diffs.length || priceUp.length){ o.status = 'complaint'; o.complaint = {status:'open', text:`Sehr geehrte Damen und Herren,\n\nbei der Lieferung zu ${o.no}${r.noteNo?' (Lieferschein '+r.noteNo+')':''} vom ${fmtDate(date)} gab es folgende Abweichungen:\n${[...diffs, ...priceUp.map(x=>'Preis abweichend: '+x)].map(x=>'• '+x).join('\n')}\n\nBitte um Gutschrift bzw. Nachlieferung.\n\nDanke und freundliche Grüße`}; }
      else o.status = 'delivered';
      view.recv = null; save(); render(); toast((o.status==='complaint' ? `Eingebucht · ${diffs.length + priceUp.length} Abweichungen, Reklamation vorbereitet` : `Eingebucht · ${o.lines.length} Positionen, alles in Ordnung`) + (pfSum > 0 ? ` · Pfand ${eur(pfSum)} beim Leergut vermerkt` : ''));
}
/* ---------- Senden: unter Mindestwert oder außerhalb der Bestelltage erst nachfragen ---------- */
function ordSendWarn(o){
  const sp = SUP(o.supplier); if(!sp || o.status !== 'draft') return []; const out = []; const tot = orderTotal(o); const t = todayStr();
  if(+sp.minOrder > 0 && tot < +sp.minOrder - 0.004) out.push(`Die Bestellung hat ${eur(tot)}, der Mindestbestellwert von ${esc(sp.name)} ist ${eur(sp.minOrder)}. Es fehlen ${eur(sp.minOrder - tot)}.`);
  const days = DAYS.filter(([i]) => sp.orderDays.includes(i)).map(([,l]) => l).join(' ');
  if(sp.orderDays.length && !sp.orderDays.includes(wd(t))) out.push(`Heute ist kein Bestelltag. ${esc(sp.name)} nimmt Bestellungen ${esc(days)} an.`);
  else if(sp.orderDays.length && nowMin() > hm(sp.cutoff)) out.push(`Der Annahmeschluss heute war um ${esc(sp.cutoff)} Uhr.`);
  return out;
}
const ORD_SEND_OK = new Set();
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act="ordMarkSent"],[data-act="ordOpened"],[data-act="ordCloudSend"]'); if(!el || el.closest('.ok-box')) return;
  const oid = el.dataset.act === 'ordOpened' ? String(el.dataset.id).split(':')[0] : el.dataset.id; const o = ORD(oid); if(!o || ORD_SEND_OK.has(o.id)) return;
  const warn = ordSendWarn(o); if(!warn.length) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const sel = `#app [data-act="${el.dataset.act}"][data-id="${CSS.escape(el.dataset.id)}"]`;
  openDialog('Trotzdem senden?', warn.map(w => `<p class="dlg-p">${w}</p>`).join('') + '<p class="dlg-p">Der Lieferant nimmt die Bestellung vielleicht nicht an.</p>',
    () => { ORD_SEND_OK.add(o.id); setTimeout(() => { const b = document.querySelector(sel); if(b) b.click(); }, 30); }, {ok:'Trotzdem senden', toast:false});
}, true);

/* ---------- Ereignisse ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  const id = el.dataset.id;
  switch(el.dataset.act){
    case 'ordNew': { const o = ordStart(id); view.stab = 'bestellung'; view.order = o.id; view.recv = null; go('stock'); break; }
    case 'ordOpen': view.stab = 'bestellung'; view.order = id; view.recv = null; go('stock'); break;
    case 'ordBack': view.order = null; view.recv = null; view.opened = null; ORD_TMP = null; render(); break;
    case 'ordRe': { const src = ORD(id); const ex = draftFor(src.supplier); const o = ex || newOrder(src.supplier, false); if(!ex){ o.lines = src.lines.map(l => { const p = P(l.pid); return p ? lineFor(p, l.n) : null; }).filter(Boolean); } save(); view.stab = 'bestellung'; view.order = o.id; view.recv = null; go('stock'); toast(ex ? 'Offener Entwurf geöffnet' : `Positionen aus ${src.no} übernommen`); break; }
    case 'ofilter': view.ofilter = id; render(); break;
    case 'olDel': { const o = ORD(view.order); o.lines.splice(+id,1); save(); render(); break; }
    case 'olSuggest': { const o = ORD(id); const sp = SUP(o.supplier); let n = 0; const all = supNeed(o.supplier, o.deliveryDate); all.forEach(x => { if(!o.lines.some(l=>l.pid===x.p.id)){ o.lines.push(lineFor(x.p, x.n)); n++; } }); if(n) save(); render();
      toast(n ? `${n} ${n === 1 ? 'Artikel' : 'Artikel'} ergänzt` : all.length ? 'Der Vorschlag ist schon in der Bestellung' : `Bei ${sp ? sp.name : 'diesem Lieferanten'} ist nichts nötig: nichts unter Mindestbestand, nichts fehlt laut Prognose`); break; }
    case 'ordOpened': { const [oid, via] = id.split(':'); if(ORD_TMP && ORD_TMP.id === oid){ ordTmpCommit(true); save(); } view.opened = oid; view.openedVia = via; setTimeout(render, 300); break; }
    case 'ordMarkSent': { const o = ORD(id); const sp = SUP(o.supplier); ORD_SEND_OK.delete(o.id); if(o === ORD_TMP) ordTmpCommit(true); o.status = 'sent'; o.sentAt = new Date().toISOString(); o.sentVia = view.opened===o.id ? view.openedVia : CHANNELS[sp.channel]; o.sentBy = me().id; view.opened = null; save(); render(); toast(`${o.no} gesendet · Lieferung ${dayLabel(o.deliveryDate)}`); break; }
    case 'ordCopy': { if(ORD_TMP && ORD_TMP.id === id){ ordTmpCommit(true); save(); } const txt = orderText(ORD(id)); const pr = navigator.clipboard?.writeText(txt); const fb = () => openDialog('Bestelltext', `<textarea class="code" readonly id="ordTxt">${esc(txt)}</textarea>`, null, {cancel:'Schließen', after:()=>$('#ordTxt').select()}); if(pr) pr.then(()=>toast('Bestelltext kopiert'), fb); else fb(); break; }
    case 'ordPrint': printOrder(ORD(id)); break;
    case 'ordConfirm': { const o = ORD(id); o.status = 'confirmed'; o.confirmedNote = 'Bestätigung erhalten '+fmtDate(new Date().toISOString()); save(); render(); break; }
    case 'ordDelay': delayDialog(ORD(id)); break;
    case 'ordCancel': ask('Bestellung stornieren? Bitte den Lieferanten auch selbst informieren.', () => { ORD(id).status = 'cancelled'; }, 'Stornieren'); break;
    case 'ordDel': if(ORD_TMP && ORD_TMP.id === id){ ORD_TMP = null; view.order = null; render(); break; } ask('Entwurf löschen?', () => { S.orders = S.orders.filter(o=>o.id!==id); view.order = null; }); break;
    case 'ordRecv': view.stab = 'bestellung'; view.order = id; view.recv = id; go('stock'); break;
    case 'rCancel': view.recv = null; render(); break;
    case 'rAll': { const o = ORD(id); o.lines.forEach(l => { l.delivered = l.n; l.ls = 'ok'; }); save(); render(); break; }
    case 'rPhoto': { const o = ORD(id); pickImage(data => { o.receiptDraft = o.receiptDraft || {}; if(o.receiptDraft.photo) imgDel(o.receiptDraft.photo); const iid = uid('img'); imgPut(iid, data); o.receiptDraft.photo = iid; save(); render(); toast('Lieferschein fotografiert'); }); break; }
    case 'rBook': { const o = ORD(id); const r = o.receiptDraft = o.receiptDraft || {}; r.noteNo = $('#rNo')?.value || r.noteNo || ''; ekRecvCheck(o, ek => ordBook(o, ek)); break; }
    case 'cCopy': { const o = ORD(id); navigator.clipboard?.writeText(o.complaint.text).then(()=>toast('Reklamation kopiert'), ()=>{}); break; }
    case 'supEdit': supplierDialog(id ? SUP(id) : null); break;
    case 'userSwitch': S.settings.currentUser = id; view.cv = null; save(); render(); toast(`Angemeldet als ${whoLabel(me())}`); break;
  }
});
document.addEventListener('change', e => {
  const t = e.target; if(!t.closest('#app')) return; const o = view.order && ORD(view.order);
  if(t.id === 'olAdd' && t.value && o){ const p = P(t.value); o.lines.push(lineFor(p, packSuggest(p) || 1)); save(); render(); return; }
  if(t.dataset.ol != null && o){ o.lines[+t.dataset.ol].n = Math.max(0, +t.value||0); save(); softRender(); return; }
  if(t.dataset.od && o){ o.deliveryDate = t.value; save(); return; }
  if(t.dataset.on && o){ o.note = t.value; save(); return; }
  if(t.dataset.rd != null && o){ const v = numParse(t.value); o.lines[+t.dataset.rd].delivered = t.value.trim() === '' || !isFinite(v) ? null : v; t.dataset.old = t.value; save(); return; }
  if(t.dataset.rp != null && o){ const v = numParse(t.value); o.lines[+t.dataset.rp].invPrice = t.value.trim() === '' || !isFinite(v) ? null : Math.round(v*100)/100; save(); softRender(); return; }
  if(t.dataset.rs != null && o){ o.lines[+t.dataset.rs].ls = t.value; save(); return; }
  if(t.dataset.cst){ ORD(t.dataset.cst).complaint.status = t.value; if(t.value==='closed' || t.value==='credit') ORD(t.dataset.cst).status = t.value==='closed' ? 'delivered' : 'complaint'; save(); render(); toast('Reklamation: '+CSTAT[t.value]); return; }
  if(t.dataset.ctext){ ORD(t.dataset.ctext).complaint.text = t.value; save(); return; }
  if(t.id === 'rNo' || t.id === 'rTemp' || t.id === 'rTempT' || t.id === 'rOk'){ const oo = ORD(view.recv) || o; if(!oo) return; const r = oo.receiptDraft = oo.receiptDraft || {}; if(t.id === 'rOk') r.cond = t.checked ? '' : 'no'; else r[{rNo:'noteNo', rTemp:'temp', rTempT:'tempT'}[t.id]] = t.value; save(); return; }
  if(t.dataset.us === 'addr'){ S.settings[t.dataset.k] = t.value; save(); return; }
});

/* Stand eines Lieferanten für heute: von „Heute“ und „Einkauf“ gemeinsam benutzt */
function supToday(sp){
  const t = todayStr(); const isDay = sp.orderDays.includes(wd(t)); const left = hm(sp.cutoff) - nowMin();
  const sent = lastOrderToday(sp.id); const draft = draftFor(sp.id);
  const state = !isDay ? 'none' : sent ? 'sent' : left < 0 ? 'past' : 'open';
  const leftTxt = `noch ${left>=60?Math.floor(left/60)+' h ':''}${Math.max(0,left%60)} min`;
  return {isDay, left, sent, draft, state, urgent: state==='open' && left < 90, label: state==='sent' ? 'heute bestellt' : state==='past' ? 'Annahmeschluss vorbei' : state==='open' ? leftTxt : '', delivery: nextDelivery(sp, state==='open' || state==='sent' ? t : null)};
}
function lastOrderToday(sid){ const t = todayStr(); return (S.orders||[]).some(o=>o.supplier===sid && o.status!=='draft' && o.status!=='cancelled' && (o.sentAt||'').slice(0,10)===t); }
