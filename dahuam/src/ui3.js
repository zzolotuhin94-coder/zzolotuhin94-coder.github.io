/* =====================================================================
   Premium-Oberfläche: Listenansichten, Umschalter, Navigation, Einkauf
   ===================================================================== */
const BUY = ['bestellung','lieferanten'];
/* Zahlen in Eingabefeldern: Anzeige mit Komma, Eingabe mit Komma oder Punkt */
const num2 = n => fin(n).toLocaleString('de-DE',{minimumFractionDigits:2, maximumFractionDigits:2});
const numIn = v => (v==='' || v==null || isNaN(+v)) ? '' : String(+v).replace('.', ',');
function numParse(v){ let s = String(v==null?'':v).trim().replace(/[€%\s]/g,''); if(!s) return NaN; if(s.includes(',') && s.includes('.')) s = s.replace(/\./g,'').replace(',','.'); else s = s.replace(',','.'); return +s; }
ICO.buy = '<path d="M3 4h2l2.5 11h10L20 7H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>';
ICO.sort = '<path d="M8 4v16M4 16l4 4 4-4M16 20V4M12 8l4-4 4 4"/>';
/* ---------- Gemerkt je Gerät: Teller oder Tabelle in der Rezeptur, Sortierung der Listen ---------- */
const VKEY = KEY + '_views';
let VIEWS = (() => { try { return JSON.parse(localStorage.getItem(VKEY)) || {}; } catch(e){ return {}; } })();
function vmode(k){ return VIEWS[k] || 'list'; }
function setV(k, m){ VIEWS[k] = m; try { localStorage.setItem(VKEY, JSON.stringify(VIEWS)); } catch(e){} }
const SORTS = (() => { try { return JSON.parse(localStorage.getItem(KEY+'_sorts')) || {}; } catch(e){ return {}; } })();
/* Selten Gebrauchtes steht hinter „Mehr Optionen“, dort, wo es hingehört */
function moreOpts(key, html, label){ const o = view.more || {}; return `<details class="more" data-more="${key}" ${o[key] ? 'open' : ''}><summary>${label || 'Mehr Optionen'}</summary><div class="more-b">${html}</div></details>`; }
document.addEventListener('toggle', e => { const t = e.target; if(t && t.dataset && t.dataset.more){ view.more = Object.assign({}, view.more, {[t.dataset.more]: t.open}); } }, true);
function sortsSave(){ try { localStorage.setItem(KEY+'_sorts', JSON.stringify(SORTS)); } catch(x){} }
function applySort(k, list, get){ const s = SORTS[k]; if(!s || !s.col) return list; const f = get[s.col]; if(!f) return list; return [...list].sort((a,b) => { const x = f(a), y = f(b); return (typeof x === 'string' ? x.localeCompare(y,'de') : (x??-1e9) - (y??-1e9)) * s.dir; }); }

/* ---------- Allergene: eine Zählung für alle Stellen ---------- */
/* Gezählt wird jedes Gericht der Speisekarte, auch ausgeblendete und solche außerhalb der Saison. */
function noAlgList(){ return S.menu.filter(m => !hasAlg(m)); }
function noAlgCount(){ return noAlgList().length; }

/* ---------- Speisekarte: Gerichte als Liste ---------- */
const MENU_SORTS = [['','Reihenfolge der Karte'],['name','Name'],['price','Preis'],['fc','Wareneinsatz in %'],['margin','Rohertrag']];
function menuDragOk(){ return !window.matchMedia('(max-width:760px)').matches && canEditAll() && !(SORTS.menu && SORTS.menu.col) && !view.q.trim() && (view.sec === 'all' || secList().includes(view.sec)); }
function renderMenuCalc(){
  const q = view.q.trim().toLowerCase();
  const all = menuSorted().map(m => ({m, k:menuCalc(m)}));
  const f = view.sec;
  const shown = all.filter(({m,k}) => (!q || (m.name+' '+m.desc+' '+m.section+' '+(k.t?k.t.lines.map(l=>l.name).join(' '):'')).toLowerCase().includes(q))
    && (f==='all' || (f==='none' ? k.cost==null : f==='over' ? (k.fc!=null && k.fc > S.settings.target) : f==='nophoto' ? !menuImg(m) : f==='noalg' ? !hasAlg(m) : SEASONS.some(x=>x[0]===f) ? m.seasons.includes(f) : m.section===f)));
  const cnt = x => all.filter(x).length;
  const sCol = (SORTS.menu && SORTS.menu.col) || '';
  const more = moreOpts('menu', `<label class="f inl">Sortieren<select data-sel="msort" aria-label="Sortieren">${MENU_SORTS.map(([k,l]) => `<option value="${k}" ${sCol===k?'selected':''}>${l}</option>`).join('')}</select></label><button type="button" class="btn sm" data-act="secDlg">Kategorien verwalten</button>`);
  let h = `<div class="toolbar"><label class="search">${ico('search')}<input id="mq" type="search" placeholder="Gericht, Zutat oder Kategorie" value="${esc(view.q)}" autocomplete="off"></label></div>
  <div class="toolbar filters">${seg('sec', f, [['all','Alle',all.length],['over','Über Ziel',cnt(x=>x.k.fc!=null&&x.k.fc>S.settings.target)],['none','Ohne Rezeptur',cnt(x=>x.k.cost==null)],['noalg','Allergene offen',noAlgCount()],['nophoto','Ohne Foto',cnt(x=>!menuImg(x.m))]])}<select class="sel-cat" data-sel="sec" aria-label="Kategorie"><option value="all">Alle Kategorien</option>${secList().filter(s=>all.some(x=>x.m.section===s)).map(s=>`<option value="${esc(s)}" ${f===s?'selected':''}>${esc(s)} (${cnt(x=>x.m.section===s)})</option>`).join('')}<optgroup label="Saison">${SEASONS.map(([k,l])=>`<option value="${k}" ${f===k?'selected':''}>Nur ${l} (${cnt(x=>x.m.seasons.includes(k))})</option>`).join('')}</optgroup></select></div>`;
  if(!shown.length) return h + `<div class="panel empty">Keine Gerichte für diesen Filter.</div>` + more;
  const sorted = applySort('menu', shown, {name:x=>x.m.name, price:x=>+x.m.price, fc:x=>x.k.fc, margin:x=>x.k.margin});
  const grouped = !sCol; const drag = menuDragOk();
  const row = ({m,k}) => { const img = menuImg(m); const st = [];
    if(!hasAlg(m)) st.push(`<span class="open" title="${esc('Allergene unvollständig: ' + algWhy(m))}"><i></i>Allergene</span>`); if(m.hidden) st.push('<span>ausgeblendet</span>'); if(m.top) st.push('<span class="top" title="Empfehlung des Hauses">★</span>');
    const when = [m.seasons.length ? m.seasons.map(seasonName).join(', ') : '', m.days && m.days.length ? hkDays(m) : ''].filter(Boolean).join(' · ');
    const calc = k.c ? `<td class="r hide-m">${k.cost!=null?eur(k.cost):'<span class="lt-muted">—</span>'}</td>
      <td class="r"><span class="lt-fc ${fcClass(k.fc)}"><i></i>${k.fc!=null?num(k.fc,1)+' %':'—'}</span></td>
      <td class="r hide-m">${k.margin!=null?eur(k.margin):'<span class="lt-muted">—</span>'}</td>`
      : `<td class="lt-miss hide-m" colspan="2"></td><td class="lt-miss r"><button type="button" class="link" data-act="newCardFor" data-id="${m.id}">Rezeptur fehlt</button></td>`;
    return `<tr class="row ${m.hidden?'off':''}" data-mid="${m.id}" data-sec="${esc(m.section)}" data-act="${k.c?'openCard':'editMenu'}" data-id="${k.c?k.c.id:m.id}">
      ${drag ? `<td class="lt-gripc"><button type="button" class="lt-grip" data-mgrip="${m.id}" title="Ziehen, um die Reihenfolge zu ändern (oder Pfeiltasten)" aria-label="${esc(dishLabel(m))} verschieben">${GRIP_SVG}</button></td>` : ''}
      <td><div class="lt-n">${img?`<img src="${IMG[img]}" alt="">`:''}<span><b>${esc(m.name)}${menuTag(m)?` <span class="lt-muted">· ${esc(menuTag(m))}</span>`:''}${m.veg?` <span class="lt-muted">${m.veg}</span>`:''}</b><small>${esc(m.desc||'')}${when ? `${m.desc ? ' · ' : ''}<em class="lt-when">${esc(when)}</em>` : ''}</small></span></div></td>
      <td class="r"><input class="lt-price num-in" id="mp-${m.id}" type="text" inputmode="decimal" data-num="req price" data-mp="${m.id}" value="${num2(m.price)}" aria-label="Preis ${esc(dishLabel(m))}"></td>
      ${calc}
      <td class="hide-m"><span class="lt-st">${st.join('')}</span></td>
      <td><div class="lt-acts"><button type="button" class="icon-btn" data-act="photoMenu" data-id="${m.id}" title="Foto" aria-label="Foto">${ico('camera')}</button><button type="button" class="icon-btn" data-act="editMenu" data-id="${m.id}" title="Bearbeiten" aria-label="Bearbeiten">${ico('edit')}</button></div></td></tr>`; };
  const cols = drag ? 8 : 7;
  let body = '';
  if(grouped){ for(const s of secList()){ const list = sorted.filter(x=>x.m.section===s); if(!list.length) continue; body += `<tr class="grp"><td colspan="${cols}">${esc(s)}<small>${list.length}</small></td></tr>` + list.map(row).join(''); } }
  else body = sorted.map(row).join('');
  return h + `<div class="lt-wrap"><table class="lt lt-menu ${drag?'drag':''}"><thead><tr>${drag?'<th class="lt-gripc"></th>':''}<th>Gericht</th><th class="r">Preis</th><th class="r hide-m">Wareneinsatz</th><th class="r">in %</th><th class="r hide-m">Rohertrag</th><th class="hide-m"></th><th></th></tr></thead><tbody>${body}</tbody></table></div>
  ${more}`;
}
/* Kategorien der Karte: umbenennen, ordnen, anlegen, leere löschen */
function secDialog(){
  const draw = () => { const secs = secList(); const sv = S.settings.secVat || (S.settings.secVat = {}); const vS = num(+S.settings.vat||0,1), vG = num(+vatRate({vat:'g'})||0,1); return `<p class="dlg-p">Die Überschriften Ihrer Karte, in dieser Reihenfolge. Den Namen ändern Sie direkt im Feld. Der Steuersatz gilt für alle Gerichte der Kategorie.</p><ul class="sec-list">${secs.map((s,si) => { const n = S.menu.filter(m=>m.section===s).length; return `<li><input class="lay-name" data-secname="${si}" value="${esc(s)}" aria-label="Kategoriename"><select class="sm-sel sec-vat" data-secvat="${si}" aria-label="Steuersatz ${esc(s)}"><option value="s">Speisen ${vS} %</option><option value="g" ${sv[s]==='g'?'selected':''}>Getränke ${vG} %</option></select><span class="muted sm">${n}</span>
      <button type="button" class="icon-btn" data-sd="up" data-i="${si}" ${si===0?'disabled':''} aria-label="${esc(s)} nach oben">${ico('up')}</button><button type="button" class="icon-btn" data-sd="down" data-i="${si}" ${si===secs.length-1?'disabled':''} aria-label="${esc(s)} nach unten">${ico('down')}</button>
      <button type="button" class="icon-btn danger" data-sd="del" data-i="${si}" ${n?'disabled title="Nur leere Kategorien lassen sich löschen"':''} aria-label="${esc(s)} löschen">${ico('trash')}</button></li>`; }).join('')}</ul>
    <button type="button" class="btn sm" data-sd="add">${ico('plus')}Kategorie</button>`; };
  openDialog('Kategorien', draw(), null, {cancel:'Fertig', after: f => {
    const box = f.querySelector('.dlg-body') || f; const redraw = () => { const host = f.querySelector('.sec-list').parentNode; const tmp = document.createElement('div'); tmp.innerHTML = draw(); host.querySelector('.sec-list').replaceWith(tmp.querySelector('.sec-list')); };
    f.addEventListener('click', e => { const b = e.target.closest('[data-sd]'); if(!b) return; if(!roGate()) return; const s = S.settings.sections; secList(); const i = +b.dataset.i;
      if(b.dataset.sd === 'up' && i > 0) [s[i-1], s[i]] = [s[i], s[i-1]];
      else if(b.dataset.sd === 'down' && i < s.length-1) [s[i+1], s[i]] = [s[i], s[i+1]];
      else if(b.dataset.sd === 'del'){ if(S.menu.some(m=>m.section===s[i])) return; if(S.settings.secVat) delete S.settings.secVat[s[i]]; s.splice(i,1); }
      else if(b.dataset.sd === 'add'){ let n = 'Neue Kategorie', k = 2; while(s.includes(n)) n = 'Neue Kategorie '+k++; s.push(n); }
      save(); redraw(); if(b.dataset.sd === 'add'){ const inp = f.querySelector(`[data-secname="${s.length-1}"]`); if(inp){ inp.focus(); inp.select(); } } });
    f.addEventListener('change', e => { if(e.target.dataset.secname != null) setTimeout(redraw, 0); if(e.target.dataset.secvat != null){ if(!roGate()){ redraw(); return; } const nm = secList()[+e.target.dataset.secvat]; const sv = S.settings.secVat || (S.settings.secVat = {}); if(e.target.value === 'g') sv[nm] = 'g'; else delete sv[nm]; save(); toast(`${nm}: ${e.target.value === 'g' ? 'Getränke' : 'Speisen'}`); } });
    $('#dlg').addEventListener('close', () => render(), {once:true});
  }});
}
/* Reihenfolge: ein Gericht am Griff an eine andere Stelle seiner Kategorie ziehen */
function menuReorder(mid, beforeId){
  const m = S.menu.find(x => x.id === mid); if(!m) return false;
  const list = menuSorted().filter(x => x.section === m.section && x.id !== mid);
  const at = beforeId ? list.findIndex(x => x.id === beforeId) : list.length; if(at < 0) return false;
  list.splice(at, 0, m); const before = list.map(x => x.order).join(); list.forEach((x,i) => { x.order = i; });
  save(); return true;
}
(function menuDrag(){
  let d = null;
  const rowsOf = sec => [...document.querySelectorAll('#app table.lt-menu tbody tr.row')].filter(r => r.dataset.sec === sec);
  const clear = () => document.querySelectorAll('#app tr.drop-b, #app tr.drop-a, #app tr.dragging').forEach(r => r.classList.remove('drop-b','drop-a','dragging'));
  document.addEventListener('pointerdown', e => { const g = e.target.closest && e.target.closest('.lt-grip'); if(!g || e.button > 0) return; const tr = g.closest('tr'); if(!tr) return;
    e.preventDefault(); d = {id:g.dataset.mgrip, sec:tr.dataset.sec, y0:e.clientY, on:false, tr, target:null, after:false}; try { g.setPointerCapture(e.pointerId); } catch(x){} }, true);
  document.addEventListener('pointermove', e => { if(!d) return; if(!d.on && Math.abs(e.clientY - d.y0) < 5) return; d.on = true; e.preventDefault();
    clear(); d.tr.classList.add('dragging'); d.target = null;
    for(const r of rowsOf(d.sec)){ const b = r.getBoundingClientRect(); if(e.clientY >= b.top && e.clientY <= b.bottom){ if(r === d.tr) break; d.target = r; d.after = e.clientY > b.top + b.height/2; r.classList.add(d.after ? 'drop-a' : 'drop-b'); break; } }
    if(e.clientY < 90) window.scrollBy(0, -14); else if(e.clientY > window.innerHeight - 110) window.scrollBy(0, 14); }, {capture:true, passive:false});
  const end = e => { if(!d) return; const x = d; d = null; clear(); if(!x.on || !x.target) return;
    const rows = rowsOf(x.sec); const i = rows.indexOf(x.target); const nxt = x.after ? rows[i+1] : x.target; const beforeId = nxt ? nxt.dataset.mid : null;
    if(beforeId === x.id) return; if(menuReorder(x.id, beforeId)){ render(); toast('Reihenfolge geändert'); } };
  document.addEventListener('pointerup', end, true); document.addEventListener('pointercancel', () => { d = null; clear(); }, true);
  document.addEventListener('click', e => { if(e.target.closest && e.target.closest('.lt-grip')){ e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('keydown', e => { const g = e.target.closest && e.target.closest('.lt-grip'); if(!g || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return; e.preventDefault();
    moveItem(g.dataset.mgrip, e.key === 'ArrowUp' ? -1 : 1); save(); render(); const n = document.querySelector(`#app .lt-grip[data-mgrip="${CSS.escape(g.dataset.mgrip)}"]`); if(n) n.focus(); });
})();

/* ---------- Rezepte: Rezepturen als Liste ---------- */
const CARD_SORTS = [['','Gerichte zuerst, nach Name'],['name','Name'],['cat','Kategorie'],['cost','Wareneinsatz'],['fc','Wareneinsatz in %'],['items','Anzahl Zutaten']];
function renderCards(){
  const q = view.q.trim().toLowerCase();
  const ofType = (c, t) => t === 'all' || (t === 'drink' ? !!c.drink && c.type === 'dish' : c.type === t && !(t === 'dish' && c.drink));
  const list0 = S.cards.filter(c => ofType(c, view.ctype) && (!q || (c.name+' '+c.category).toLowerCase().includes(q)));
  const n = t => S.cards.filter(c => ofType(c, t)).length; const dk = view.ctype === 'drink';
  const rows = list0.map(c => { const t = totals(c); const mk = S.menu.filter(m => m.card === c.id).map(menuCalc)[0]; return {c, t, mk}; });
  const sorted = applySort('cards', rows.sort((a,b)=> a.c.type===b.c.type ? byName(a.c,b.c) : (a.c.type==='semi'?1:-1)), {name:x=>x.c.name, cat:x=>x.c.category||'', cost:x=>x.t.cost, fc:x=>x.mk?x.mk.fc:null, items:x=>x.c.items.length});
  const sCol = (SORTS.cards && SORTS.cards.col) || '';
  const more = moreOpts('cards', `<label class="f inl">Sortieren<select data-sel="csort" aria-label="Sortieren">${CARD_SORTS.map(([k,l]) => `<option value="${k}" ${sCol===k?'selected':''}>${l}</option>`).join('')}</select></label><button type="button" class="btn sm" data-act="newCard" data-id="semi">${ico('plus')}Basisrezept</button><button type="button" class="btn sm" data-act="newCard" data-id="${dk ? 'dish' : 'drink'}">${ico('plus')}${dk ? 'Rezeptur' : 'Schankrezeptur'}</button>`);
  let h = `<div class="page-h"><div><h1>Rezepte</h1></div>
    <div class="row-btns"><button type="button" class="btn primary" data-act="newCard" data-id="${dk ? 'drink' : 'dish'}">${ico('plus')}${dk ? 'Schankrezeptur' : 'Rezeptur'}</button></div></div>
  <div class="toolbar"><label class="search">${ico('search')}<input id="cq" type="search" placeholder="Rezeptur suchen" value="${esc(view.q)}" autocomplete="off"></label>
    ${seg('ctype', view.ctype, [['all','Alle',n('all')],['dish','Gerichte',n('dish')],['semi','Basisrezepte',n('semi')]].concat(n('drink') || dk ? [['drink','Getränke',n('drink')]] : []))}</div>`;
  if(!sorted.length) return h + `<div class="panel empty">Keine Rezepturen gefunden.</div>` + more;
  return h + `<div class="lt-wrap"><table class="lt"><thead><tr><th>Rezeptur</th><th class="hide-m">Kategorie</th><th class="r hide-m">Zutaten</th><th class="r">Wareneinsatz</th><th class="r">in %</th><th class="hide-m"></th></tr></thead><tbody>
    ${sorted.map(({c,t,mk}) => `<tr class="row" data-act="openCard" data-id="${c.id}">
      <td><div class="lt-n">${c.img&&IMG[c.img]?`<img src="${IMG[c.img]}" alt="">`:''}<span><b>${esc(c.name)}</b><small>${c.type==='semi'?'Basisrezept · ':''}Nr. ${c.no||'—'}${c.drink ? (+c.yieldG > 0 ? ' · ' + volTxt(+c.yieldG) : '') : ` · ${(c.steps||[]).length} Schritte${+c.yieldG > 0 ? ` · ${num(c.yieldG)} g` : ''}`}</small></span></div></td>
      <td class="hide-m lt-muted">${esc(c.category||'—')}</td>
      <td class="r hide-m">${c.items.length}</td><td class="r">${eur(t.cost)}</td>
      <td class="r">${c.type==='dish'&&mk?`<span class="lt-fc ${fcClass(mk.fc)}"><i></i>${num(mk.fc,1)} %</span>`:''}</td>
      <td class="hide-m">${c.type==='dish' && !mk ? `<span class="lt-st"><span>nicht auf der Karte</span></span>` : ''}</td></tr>`).join('')}
  </tbody></table></div>
  ${more}`;
}

/* ---------- Einkauf als eigener Bereich ---------- */
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
  if(el.dataset.act === 'lsort'){ const [k,col] = id.split(':'); const s = SORTS[k] || {}; if(s.col === col){ if(!s.flip) SORTS[k] = {col, dir:-s.dir, flip:1}; else delete SORTS[k]; } else SORTS[k] = {col, dir: col==='name'||col==='cat' ? 1 : -1}; sortsSave(); render(); }
  if(el.dataset.act === 'secDlg') secDialog();
  if(el.dataset.act === 'buyNew') buyNewDialog();
}, true);
document.addEventListener('click', e => { if(e.target.closest('.lt-price')) e.stopPropagation(); }, true);
document.addEventListener('change', e => {
  const t = e.target;
  if(['msort','csort','ssort','psort'].includes(t.dataset.sel)){ const k = {msort:'menu', csort:'cards', ssort:'stock', psort:'products'}[t.dataset.sel]; if(t.value) SORTS[k] = {col:t.value, dir: t.value==='name'||t.value==='cat' ? 1 : -1}; else delete SORTS[k]; sortsSave(); render(); return; }
  if(t.dataset.mp){ const m = S.menu.find(x=>x.id===t.dataset.mp); const old = +m.price; const nv = +t.value; if(t.value === '' || !isFinite(nv) || nv < 0){ t.value = num2(old); return; } m.price = Math.round(nv*100)/100; save(); softRender(); if(old !== m.price) toast(`${m.name}: ${eur(old)} → ${eur(m.price)}`); }
});
