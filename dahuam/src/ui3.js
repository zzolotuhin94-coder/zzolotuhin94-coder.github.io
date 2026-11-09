/* =====================================================================
   Premium-Oberfläche: Listenansichten, Umschalter, Navigation, Einkauf
   ===================================================================== */
const BUY = ['bestellung','lieferanten'];
/* Zahlen in Eingabefeldern: Anzeige mit Komma, Eingabe mit Komma oder Punkt */
const num2 = n => fin(n).toLocaleString('de-DE',{minimumFractionDigits:2, maximumFractionDigits:2});
const numIn = v => (v==='' || v==null || isNaN(+v)) ? '' : String(+v).replace('.', ',');
function numParse(v){ let s = String(v==null?'':v).trim().replace(/[€%\s]/g,''); if(!s) return NaN; if(s.includes(',') && s.includes('.')) s = s.replace(/\./g,'').replace(',','.'); else s = s.replace(',','.'); return +s; }
TABS.length = 0;
TABS.push(['dash','Heute','Heute'],['menu','Speisekarte','Karte'],['cards','Rezepturen','Rezepte'],['stock','Lager','Lager'],['buy','Einkauf','Einkauf'],['products','Produkte','Produkte'],['setup','Einstellungen','Mehr']);
ICO.buy = '<path d="M3 4h2l2.5 11h10L20 7H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>';
ICO.vlist = '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>';
ICO.vcompact = '<path d="M4 5h16M4 9.5h16M4 14h16M4 18.5h16"/>';
ICO.vcards = '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>';
ICO.sort = '<path d="M8 4v16M4 16l4 4 4-4M16 20V4M12 8l4-4 4 4"/>';
const NAV_GROUPS = [['Täglich',['dash','buy']],['Küche',['menu','cards']],['Bestand',['stock','products']],['',['setup']]];
navHtml = function(short){
  const item = k => { const t = TABS.find(x=>x[0]===k); return `<button type="button" class="nav-i" data-tab="${k}">${ico(k)}<span>${short?t[2]:t[1]}</span></button>`; };
  if(short) return ['dash','menu','cards','stock','buy','setup'].map(item).join('');
  return NAV_GROUPS.map(([g,ks]) => (g?`<div class="nav-group">${g}</div>`:'<div class="nav-group" aria-hidden="true"></div>') + ks.map(item).join('')).join('');
};

/* ---------- Ansicht merken ---------- */
const VKEY = KEY + '_views';
let VIEWS = (() => { try { return JSON.parse(localStorage.getItem(VKEY)) || {}; } catch(e){ return {}; } })();
function vmode(k){ return VIEWS[k] || 'list'; }
function setV(k, m){ VIEWS[k] = m; try { localStorage.setItem(VKEY, JSON.stringify(VIEWS)); } catch(e){} }
function vsw(k){ const m = vmode(k); return `<div class="vsw" role="group" aria-label="Ansicht">${[['list','Liste','vlist'],['compact','Kompakt','vcompact'],['cards','Karten','vcards']].map(([v,l,i])=>`<button type="button" class="${m===v?'on':''}" data-act="vsw" data-id="${k}:${v}" title="${l}" aria-label="${l}" aria-pressed="${m===v}">${ico(i)}</button>`).join('')}</div>`; }
const SORTS = (() => { try { return JSON.parse(localStorage.getItem(KEY+'_sorts')) || {}; } catch(e){ return {}; } })();
function sortHead(k, col, label, cls=''){ const s = SORTS[k] || {}; const on = s.col === col; return `<th class="${cls}"><button type="button" class="${on?'on':''}" data-act="lsort" data-id="${k}:${col}">${label}${on ? (s.dir>0?' ↑':' ↓') : ''}</button></th>`; }
function applySort(k, list, get){ const s = SORTS[k]; if(!s || !s.col) return list; const f = get[s.col]; if(!f) return list; return [...list].sort((a,b) => { const x = f(a), y = f(b); return (typeof x === 'string' ? x.localeCompare(y,'de') : (x??-1e9) - (y??-1e9)) * s.dir; }); }

/* ---------- Speisekarte: Kalkulation als Liste ---------- */
const _menuCalcCards = renderMenuCalc;
renderMenuCalc = function(){
  const mode = vmode('menu');
  if(mode === 'cards') return _menuCalcCards().replace('<div class="toolbar"><label class="search">', `<div class="toolbar">${vsw('menu')}<label class="search">`);
  const q = view.q.trim().toLowerCase();
  const all = menuSorted().map(m => ({m, k:menuCalc(m)}));
  const f = view.sec;
  const shown = all.filter(({m,k}) => (!q || (m.name+' '+m.desc+' '+m.section+' '+(k.t?k.t.lines.map(l=>l.name).join(' '):'')).toLowerCase().includes(q))
    && (f==='all' || (f==='none' ? k.cost==null : f==='over' ? (k.fc!=null && k.fc > S.settings.target) : f==='nophoto' ? !menuImg(m) : f==='noalg' ? !hasAlg(m) : SEASONS.some(x=>x[0]===f) ? m.seasons.includes(f) : m.section===f)));
  const cnt = x => all.filter(x).length;
  const chip = (k,l,n) => `<button type="button" class="chip ${f===k?'on':''}" data-act="sec" data-id="${esc(k)}">${esc(l)}<small>${n}</small></button>`;
  let h = `<div class="toolbar"><label class="search">${ico('search')}<input id="mq" type="search" placeholder="Gericht, Zutat oder Kategorie" value="${esc(view.q)}" autocomplete="off"></label><span class="sp"></span>${vsw('menu')}</div>
  <div class="toolbar filters">${seg('sec', f, [['all','Alle',all.length],['over','Über Ziel',cnt(x=>x.k.fc!=null&&x.k.fc>S.settings.target)],['none','Ohne Rezeptur',cnt(x=>x.k.cost==null)],['noalg','Ohne Allergene',cnt(x=>!hasAlg(x.m))],['nophoto','Ohne Foto',cnt(x=>!menuImg(x.m))]])}<select class="sel-cat" data-sel="sec" aria-label="Kategorie"><option value="all">Alle Kategorien</option>${secList().filter(s=>all.some(x=>x.m.section===s)).map(s=>`<option value="${esc(s)}" ${f===s?'selected':''}>${esc(s)} (${cnt(x=>x.m.section===s)})</option>`).join('')}<optgroup label="Saison">${SEASONS.map(([k,l])=>`<option value="${k}" ${f===k?'selected':''}>Nur ${l} (${cnt(x=>x.m.seasons.includes(k))})</option>`).join('')}</optgroup></select></div>`;
  if(!shown.length) return h + `<div class="panel empty">Keine Gerichte für diesen Filter.</div>`;
  const sorted = applySort('menu', shown, {name:x=>x.m.name, price:x=>+x.m.price, cost:x=>x.k.cost, fc:x=>x.k.fc, margin:x=>x.k.margin});
  const grouped = !(SORTS.menu && SORTS.menu.col);
  const row = ({m,k}) => { const img = menuImg(m); const st = [];
    if(!k.c) st.push('<span class="open" title="Noch keine Rezeptur verknüpft"><i></i>Rezeptur</span>'); if(!hasAlg(m)) st.push('<span class="open" title="Allergene fehlen"><i></i>Allergene</span>'); if(m.hidden) st.push('<span>ausgeblendet</span>'); if(m.top) st.push('<span class="top" title="Empfehlung des Hauses">★</span>');
    return `<tr class="row ${m.hidden?'off':''}" data-act="${k.c?'openCard':'editMenu'}" data-id="${k.c?k.c.id:m.id}">
      <td><div class="lt-n">${img?`<img src="${IMG[img]}" alt="">`:''}<span><b>${esc(m.name)}${m.vlabel?` <span class="lt-muted">· ${esc(m.vlabel)}</span>`:''}${m.veg?` <span class="lt-muted">${m.veg}</span>`:''}</b><small>${esc(m.desc||'')}</small></span></div></td>
      <td class="hide-m lt-muted">${m.seasons.length ? m.seasons.map(seasonName).join(', ') : 'ganzjährig'}${m.days&&m.days.length?' · '+esc(hkDays(m)):''}</td>
      <td class="r"><input class="lt-price num-in" id="mp-${m.id}" type="text" inputmode="decimal" data-num="req price" data-mp="${m.id}" value="${num2(m.price)}" aria-label="Preis ${esc(dishLabel(m))}"></td>
      <td class="r hide-m">${k.cost!=null?eur(k.cost):'<span class="lt-muted">—</span>'}</td>
      <td class="r"><span class="lt-fc ${fcClass(k.fc)}"><i></i>${k.fc!=null?num(k.fc,1)+' %':'—'}</span></td>
      <td class="r hide-m">${k.margin!=null?eur(k.margin):'<span class="lt-muted">—</span>'}</td>
      <td class="hide-m"><span class="lt-st">${st.join('')}</span></td>
      <td><div class="lt-acts"><button type="button" class="icon-btn" data-act="photoMenu" data-id="${m.id}" title="Foto" aria-label="Foto">${ico('camera')}</button><button type="button" class="icon-btn" data-act="editMenu" data-id="${m.id}" title="Bearbeiten" aria-label="Bearbeiten">${ico('edit')}</button></div></td></tr>`; };
  let body = '';
  if(grouped){ for(const s of secList()){ const list = sorted.filter(x=>x.m.section===s); if(!list.length) continue; body += `<tr class="grp"><td colspan="8">${esc(s)}<small>${list.length}</small></td></tr>` + list.map(row).join(''); } }
  else body = sorted.map(row).join('');
  return h + `<div class="lt-wrap"><table class="lt ${mode}"><thead><tr>${sortHead('menu','name','Gericht')}<th class="hide-m">Saison</th>${sortHead('menu','price','Preis','r')}${sortHead('menu','cost','WE','r hide-m')}${sortHead('menu','fc','WE %','r')}${sortHead('menu','margin','Rohertrag','r hide-m')}<th class="hide-m">Status</th><th></th></tr></thead><tbody>${body}</tbody></table></div>
  `;
};

/* ---------- Rezepturen als Liste ---------- */
const _cardsCards = renderCards;
renderCards = function(){
  const mode = vmode('cards');
  if(mode === 'cards') return _cardsCards().replace('<div class="rc-grid">', `<div class="toolbar" style="margin-top:-4px"><span class="sp"></span>${vsw('cards')}</div><div class="rc-grid">`);
  const q = view.q.trim().toLowerCase();
  const list0 = S.cards.filter(c => (view.ctype==='all' || c.type===view.ctype) && (!q || (c.name+' '+c.category).toLowerCase().includes(q)));
  const n = t => S.cards.filter(c=>t==='all'||c.type===t).length;
  const rows = list0.map(c => { const t = totals(c); const mk = S.menu.filter(m => m.card === c.id).map(menuCalc)[0]; return {c, t, mk, per100: c.yieldG ? t.cost/c.yieldG*100 : 0}; });
  const sorted = applySort('cards', rows.sort((a,b)=> a.c.type===b.c.type ? byName(a.c,b.c) : (a.c.type==='semi'?1:-1)), {name:x=>x.c.name, cat:x=>x.c.category||'', cost:x=>x.t.cost, per100:x=>x.per100, fc:x=>x.mk?x.mk.fc:null, items:x=>x.c.items.length});
  let h = `<div class="page-h"><div><div class="eyebrow">${n('dish')} Gerichte · ${n('semi')} Basisrezepte</div><h1>Rezepturen</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="newCard" data-id="semi">${ico('plus')}Basisrezept</button><button type="button" class="btn primary" data-act="newCard" data-id="dish">${ico('plus')}Gericht</button></div></div>
  <div class="toolbar"><label class="search">${ico('search')}<input id="cq" type="search" placeholder="Rezeptur suchen" value="${esc(view.q)}" autocomplete="off"></label>
    ${seg('ctype', view.ctype, [['all','Alle',n('all')],['dish','Gerichte',n('dish')],['semi','Basisrezepte',n('semi')]])}<span class="sp"></span>${vsw('cards')}</div>`;
  if(!sorted.length) return h + `<div class="panel empty">Keine Rezepturen gefunden. Legen Sie eine mit „Gericht“ an.</div>`;
  return h + `<div class="lt-wrap"><table class="lt ${mode}"><thead><tr>${sortHead('cards','name','Rezeptur')}${sortHead('cards','cat','Kategorie','hide-m')}<th class="hide-m">Typ</th>${sortHead('cards','items','Zutaten','r hide-m')}${sortHead('cards','cost','WE','r')}${sortHead('cards','per100','pro 100 g','r hide-m')}${sortHead('cards','fc','WE %','r')}<th class="hide-m">Karte</th></tr></thead><tbody>
    ${sorted.map(({c,t,mk,per100}) => `<tr class="row" data-act="openCard" data-id="${c.id}">
      <td><div class="lt-n">${c.img&&IMG[c.img]?`<img src="${IMG[c.img]}" alt="">`:''}<span><b>${esc(c.name)}</b><small>Nr. ${c.no||'—'} · ${(c.steps||[]).length} Schritte · ${num(c.yieldG)} g</small></span></div></td>
      <td class="hide-m lt-muted">${esc(c.category||'—')}</td><td class="hide-m lt-muted">${c.type==='semi'?'Basisrezept':'Gericht'}</td>
      <td class="r hide-m">${c.items.length}</td><td class="r">${eur(t.cost)}</td><td class="r hide-m">${eur(per100)}</td>
      <td class="r">${c.type==='dish'?`<span class="lt-fc ${fcClass(mk?mk.fc:null)}"><i></i>${mk?num(mk.fc,1)+' %':'—'}</span>`:'<span class="lt-muted">—</span>'}</td>
      <td class="hide-m">${c.type==='dish' ? (mk ? '<span class="lt-st"><span class="ok">auf der Karte</span></span>' : `<span class="lt-st"><span>nicht auf der Karte</span></span>`) : ''}</td></tr>`).join('')}
  </tbody></table></div>`;
};

/* ---------- Einkauf als eigener Bereich ---------- */
function renderBuy(){
  if(!BUY.includes(view.stab)) view.stab = 'bestellung';
  const open = S.orders.filter(o=>['draft','approval','sent','confirmed','complaint'].includes(o.status)).length;
  const low = lowStock().length; const dueAll = (S.suppliers||[]).filter(sp=>sp.active && sp.orderDays.includes(wd(todayStr()))); const due = dueAll.filter(sp => supToday(sp).state === 'open').length;
  const exp = S.orders.filter(o=>['sent','confirmed'].includes(o.status) && o.deliveryDate<=todayStr()).length;
  const month = S.orders.filter(o=>o.receipt && o.receipt.date.slice(0,7)===todayStr().slice(0,7)).reduce((a,o)=>a+deliveredTotal(o),0);
  const editing = view.order && ORD(view.order);
  const head = editing ? '' : `<div class="page-h"><div><div class="eyebrow">${(S.suppliers||[]).length} Lieferanten · ${open} offene Bestellungen</div><h1>Einkauf</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="moveDlg" data-id="in">${ico('truck')}Lieferung ohne Bestellung</button><button type="button" class="btn primary" data-act="buyNew">${ico('plus')}Bestellung</button></div></div>
  <div class="tiles"><div class="tile"><div><div class="t-l">Heute noch bestellen</div><div class="t-v">${due}</div><div class="t-s">${dueAll.length ? `von ${dueAll.length} Lieferanten mit Bestelltag` : 'kein Bestelltag'}</div></div></div><div class="tile"><div><div class="t-l">Lieferungen heute</div><div class="t-v ${exp?'':'good-t'}">${exp}</div></div></div><div class="tile"><div><div class="t-l">Unter Mindestbestand</div><div class="t-v ${low?'bad-t':''}">${low}</div></div></div><div class="tile"><div><div class="t-l">Einkauf diesen Monat</div><div class="t-v">${eur(month)}</div></div></div></div>
  <div class="toolbar">${seg('stab', view.stab, [['bestellung','Bestellungen',open],['lieferanten','Lieferanten',(S.suppliers||[]).length]])}<span class="sp"></span>${vsw('buy')}</div>`;
  return head + (view.stab === 'lieferanten' ? supplierView() : orderView());
}
function buyNewDialog(){
  const sups = (S.suppliers||[]).filter(s=>s.active);
  openDialog('Neue Bestellung', `<label class="f">Lieferant<select name="sid">${sups.map(s=>`<option value="${s.id}">${esc(s.name)} · ${esc(SUP_CATS[s.cat]||'')}</option>`).join('')}</select></label>
    <div class="togs"><label class="tog"><input type="checkbox" name="fill" checked><span></span>Artikel unter Mindestbestand vorschlagen</label></div>`,
    fd => { const o = newOrder(fd.get('sid'), !!fd.get('fill')); view.stab = 'bestellung'; view.order = o.id; }, {ok:'Anlegen', done:'Entwurf angelegt'});
}

/* ---------- Ereignisse ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  const id = el.dataset.id;
  if(el.dataset.act === 'vsw'){ const [k,m] = id.split(':'); setV(k, m); render(); }
  if(el.dataset.act === 'lsort'){ const [k,col] = id.split(':'); const s = SORTS[k] || {}; if(s.col === col){ if(!s.flip) SORTS[k] = {col, dir:-s.dir, flip:1}; else delete SORTS[k]; } else SORTS[k] = {col, dir: col==='name'||col==='cat' ? 1 : -1}; try { localStorage.setItem(KEY+'_sorts', JSON.stringify(SORTS)); } catch(x){} render(); }
  if(el.dataset.act === 'buyNew') buyNewDialog();
}, true);
document.addEventListener('click', e => { if(e.target.closest('.lt-price')) e.stopPropagation(); }, true);
document.addEventListener('change', e => {
  const t = e.target;
  if(t.dataset.mp){ const m = S.menu.find(x=>x.id===t.dataset.mp); const old = +m.price; const nv = +t.value; if(t.value === '' || !isFinite(nv) || nv < 0){ t.value = num2(old); return; } m.price = Math.round(nv*100)/100; save(); softRender(); if(old !== m.price) toast(`${m.name}: ${eur(old)} → ${eur(m.price)}`); }
});
