/* =====================================================================
   Feinschliff: ruhige, handgemachte Oberfläche.
   Ein Kontextsatz je Seite, keine Hinweis-Stapel, Zahlen deutsch,
   Heute als Tagesblatt, Aufbau als Liste, Warnfarbe nur für Seltenes.
   ===================================================================== */

/* ---------- Texte: kurz, Küchensprache ---------- */
Object.assign(WOZU, {
  aufbau:'Sechs Stationen, bis der Betrieb komplett in der App steht. Der Stand rechnet sich aus Ihren Daten.',
  menu:'Preis, Wareneinsatz und Allergene je Gericht. Preis direkt in der Zeile ändern, Klick öffnet die Rezeptur.',
  cards:'Zutaten, Mengen, Zubereitung je Gericht. Daraus kommen Wareneinsatz und Allergene.',
  stock:'Bestand, Wareneingang, Entnahmen, Schwund, Inventur.',
  buy:'Wer liefert wann, was muss heute noch raus, was kommt morgen.',
  products:'Einkaufspreis je Einheit, netto. Richtwerte sind Beispielpreise, bis Sie sie bestätigen.',
  report:'Kassendaten einlesen, Renner und Verlierer sehen.',
  setup:'Betrieb, Team, Cloud, Sicherung.',
  pcheck:'Produkt für Produkt: echten Preis eintippen oder Richtwert bestätigen. Enter geht weiter.',
});
delete WOZU.dash;

/* ---------- Hinweise: höchstens eine ruhige Zeile unter dem Titel ---------- */
demoNote = () => '';
injectDashStrip = function(){};
injectWozu = function(){
  const t = view.tab; const txt = WOZU[t]; if(!txt || view.card) return;
  const ph = $('#app .page-h'); if(!ph) return;
  const h1 = ph.querySelector('h1'); if(!h1) return;
  if(!h1.querySelector('.wozu-q')) h1.insertAdjacentHTML('beforeend', `<button type="button" class="wozu-q ${WOZU_OFF[t]?'':'on'}" data-act="wozuToggle" data-id="${t}" title="${WOZU_OFF[t]?'Hinweis zeigen':'Hinweis ausblenden'}" aria-label="Hinweis zum Bereich">${ico('help')}</button>`);
  if(WOZU_OFF[t]) return;
  if(!h1.parentNode.querySelector('.sub')) h1.insertAdjacentHTML('afterend', `<p class="sub">${esc(txt)}</p>`);
};
/* Vorzeile über dem Titel: weg. Nur bei Listen bleibt die Anzahl, ruhig hinter dem Titel. */
const COUNT_TABS = {menu:()=>S.menu.length, stock:()=>stockProducts().length, products:()=>S.products.filter(p=>!p.noStock).length};
function tidyHead(){
  const ph = $('#app .page-h'); if(!ph) return;
  const eb = ph.querySelector(':scope > div > .eyebrow'); if(!eb) return;
  const h1 = ph.querySelector('h1'); const cnt = COUNT_TABS[view.tab];
  if(h1 && cnt && !h1.querySelector('.h-n')){ const q = h1.querySelector('.wozu-q'); const n = document.createElement('span'); n.className = 'h-n'; n.textContent = num(cnt()); q ? h1.insertBefore(n, q) : h1.appendChild(n); }
  eb.remove();
}
const _renderPolish = render;
render = function(){
  _renderPolish();
  tidyHead();
  if(view.tab === 'report'){ document.querySelectorAll('#app .note').forEach(n => n.remove()); if(S.salesDemo){ const sub = $('#app .page-h .sub'); if(sub) sub.textContent = 'Demodaten: erfundene Verkäufe, bis zum ersten echten Kassen-Import.'; } }
  if(view.tab === 'setup' && S.demo){ const sub = $('#app .page-h .sub'); if(sub) sub.textContent = 'Demodaten: Karte und Preise von dahuam202.at, Rezepturen und Bestände sind Richtwerte.'; }
};

/* ---------- Heute: Tagesblatt ---------- */
function dayRow(lead, main, sub, meta, act, cls=''){
  return `<li class="rw ${cls}"><span class="rw-lead">${lead}</span><span class="rw-main"><b>${main}</b>${sub?`<small>${sub}</small>`:''}</span><span class="rw-meta">${meta||''}</span><span class="rw-act">${act||''}</span></li>`;
}
function daySec(title, sub, rowsHtml){ return `<section class="day-sec"><h2 class="day-h">${title}${sub?`<span>${sub}</span>`:''}</h2><ul class="rows">${rowsHtml}</ul></section>`; }
renderDash = function(){
  const t = todayStr(), w = wd(t), now = nowMin();
  const closed = (S.settings.closed||[]).includes(w);
  const sk = seasonFor(t); const sTitle = sk && S.settings.seasons && S.settings.seasons[sk] ? S.settings.seasons[sk].title : '';
  const all = S.menu.map(m => ({m, k:menuCalc(m)}));
  const linked = all.filter(x => x.k.cost != null).sort((a,b)=>b.k.fc-a.k.fc);
  const avg = linked.length ? linked.reduce((s,x)=>s+x.k.fc,0)/linked.length : null;
  const tg = +S.settings.target; const over = linked.filter(x => x.k.fc > tg);
  const low = lowStock(); const lastInv = S.inventories[0];
  const scale = Math.max(40, Math.ceil(((linked[0]?.k.fc)||0)/10)*10 + 5);
  const sups = (S.suppliers||[]).filter(s=>s.active);
  const due = sups.filter(sp => sp.orderDays.includes(w)).sort((a,b)=>hm(a.cutoff)-hm(b.cutoff));
  const exp = (S.orders||[]).filter(o => ['sent','confirmed'].includes(o.status) && o.deliveryDate <= t).sort((a,b)=>a.deliveryDate.localeCompare(b.deliveryDate));
  const live = specialsFor(t);
  const dayDishes = S.menu.filter(m => !m.hidden && m.days && m.days.length && m.days.includes(w));
  const nextSp = S.specials.filter(sp => spStatus(sp)[0]==='soon').sort((a,b)=>a.from.localeCompare(b.from))[0];
  const o = gameOverall();
  const dateStr = new Date().toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'});
  // Stand je Lieferant kommt aus supToday(), genau wie im Einkauf
  const dueSt = due.map(sp => ({sp, st: supToday(sp)}));
  const openDue = dueSt.filter(x => x.st.state === 'open'), sentDue = dueSt.filter(x => x.st.state === 'sent'), pastDue = dueSt.filter(x => x.st.state === 'past');
  const orderInfo = !due.length ? 'kein Bestelltag' : openDue.length ? `${openDue.length} ${openDue.length===1?'Bestellung':'Bestellungen'} offen, bis ${esc(openDue[openDue.length-1].sp.cutoff)} Uhr` : pastDue.length ? `Annahmeschluss vorbei${sentDue.length ? `, ${sentDue.length} bestellt` : ''}` : 'alles bestellt';
  const subParts = [closed ? `${DAYNAME[w]} ist Ruhetag` : 'Servicetag', sTitle, orderInfo];
  const orderRow = ({sp, st}) => {
    const lowN = lowStock().filter(p=>p.supplier===sp.id).length; const val = lowStock().filter(p=>p.supplier===sp.id).reduce((a,p)=>a+packSuggest(p)*(p.packQty||1)*p.price,0);
    const sub = `${CHANNELS[sp.channel]} · Lieferung ${dayLabel(st.delivery)}${lowN?` · ${lowN} unter Mindestbestand, ${eur(val)}`:''}`;
    const meta = st.state === 'open' ? `<span class="${st.urgent ? 'bad-t' : ''}">${esc(st.label)}</span>` : esc(st.label);
    const act = st.state === 'sent' ? '' : st.draft ? `<button type="button" class="btn sm" data-act="ordOpen" data-id="${st.draft.id}">Entwurf öffnen</button>` : st.state === 'past' ? `<button type="button" class="btn sm" data-act="ordNew" data-id="${sp.id}">Für ${esc(dayLabel(st.delivery).split(',')[0])} vorbereiten</button>` : `<button type="button" class="btn sm" data-act="ordNew" data-id="${sp.id}">Vorbereiten</button>`;
    return dayRow(`bis ${esc(sp.cutoff)}`, esc(sp.name), sub, meta, act, st.state === 'open' ? '' : 'past');
  };
  const pastLine = pastDue.length ? `<li class="rw past rw-fold"><button type="button" class="rw-more" data-act="dashPast" aria-expanded="${view.dashPast?'true':'false'}">Annahmeschluss heute vorbei: ${pastDue.length} ${pastDue.length===1?'Lieferant':'Lieferanten'} · ${view.dashPast?'ausblenden':'anzeigen'}</button></li>` + (view.dashPast ? pastDue.map(orderRow).join('') : '') : '';
  const orderRows = [...openDue, ...sentDue].map(orderRow).join('');
  const recvRows = exp.map(o => { const sp = SUP(o.supplier); const late = o.deliveryDate < t;
    return dayRow(late ? `<span class="bad-t">${fmtDate(o.deliveryDate+'T12:00:00').slice(0,6)}</span>` : 'heute', esc(sp ? sp.name : '?'), `${o.no} · ${o.lines.length} Positionen · ${eur(orderTotal(o))}${late?' · überfällig':''}`, statusPill(o.status), `<button type="button" class="btn sm" data-act="ordRecv" data-id="${o.id}">Wareneingang</button>`); }).join('');
  const cardRows = [
    ...live.map(sp => dayRow('Aktion', esc(sp.name), `${sp.items.length} ${sp.items.length===1?'Gericht':'Gerichte'}${sp.to && sp.to!==sp.from ? ` · bis ${fmtDate(sp.to+'T12:00:00')}` : ''}`, '', `<button type="button" class="btn sm" data-act="previewSpecial" data-id="${sp.id}">Karte</button>`)),
    ...dayDishes.map(m => dayRow(DAYNAME[w].slice(0,2), esc(dishLabel(m)), `${esc(m.section)} · ${eur(m.price)}`, '', m.card && C(m.card) ? `<button type="button" class="btn sm" data-act="openCard" data-id="${m.card}">Rezeptur</button>` : '')),
    ...(nextSp && !live.length ? [dayRow(fmtDate(nextSp.from+'T12:00:00').slice(0,6), esc(nextSp.name), spStatus(nextSp)[1], '', `<button type="button" class="btn sm" data-act="previewSpecial" data-id="${nextSp.id}">Vorschau</button>`, 'past')] : []),
  ].join('');
  const openRows = [
    S.menu.length-linked.length ? dayRow(num(S.menu.length-linked.length), 'Gerichte ohne Rezeptur', '', '', `<button type="button" class="btn sm" data-act="goMenu" data-id="none">Ansehen</button>`) : '',
    S.menu.filter(m=>!hasAlg(m)).length ? dayRow(num(S.menu.filter(m=>!hasAlg(m)).length), 'Gerichte ohne Allergenangabe', '', '', `<button type="button" class="btn sm" data-act="goMenu" data-id="noalg">Ansehen</button>`) : '',
    over.length ? dayRow(`<span class="bad-t">${over.length}</span>`, `Gerichte über ${num(tg)} % Wareneinsatz`, '', '', `<button type="button" class="btn sm" data-act="goMenu" data-id="over">Ansehen</button>`) : '',
    low.length ? dayRow(num(low.length), 'Artikel unter Mindestbestand', '', '', `<button type="button" class="btn sm" data-act="goStock" data-id="bestellung">Bestellen</button>`) : '',
    dayRow(S.invDraft ? '…' : ico('clip'), S.invDraft ? 'Inventur läuft' : 'Inventur', lastInv ? `zuletzt ${fmtDate(lastInv.date)}` : 'noch keine', '', `<button type="button" class="btn sm" data-act="goStock" data-id="inventur">${S.invDraft?'Fortsetzen':'Zählen'}</button>`),
    o.pct < 100 ? dayRow(`${o.pct} %`, 'Aufbau', o.next ? `Stufe ${o.lvl+1} ${esc(o.lvlName)} · als Nächstes ${esc(o.next.name)}` : '', '', `<button type="button" class="btn sm" data-act="goTab" data-id="aufbau">Weiter</button>`) : '',
  ].join('');

  return `<div class="page-h"><div><h1>${dateStr}</h1><p class="sub">${subParts.filter(Boolean).join(' · ')}</p></div>
    <div class="row-btns"><button type="button" class="btn" data-act="sales">Verkäufe buchen</button><button type="button" class="btn primary" data-act="moveDlg" data-id="in">${ico('truck')}Wareneingang</button></div></div>
  <div class="day">
    ${openDue.length ? daySec('Bestellen', `${openDue.length} offen, Annahmeschluss`, orderRows + pastLine) : ''}
    ${recvRows ? daySec('Lieferungen prüfen', '', recvRows) : ''}
    ${!openDue.length && (orderRows || pastLine) ? daySec('Bestellen', sentDue.length ? `${sentDue.length} heute bestellt` : 'heute nichts mehr offen', orderRows + pastLine) : ''}
    ${cardRows ? daySec(live.length || dayDishes.length ? 'Heute auf der Karte' : 'Demnächst', '', cardRows) : ''}
    <div class="tiles">
      <div class="tile"><div><div class="t-l">Ø Wareneinsatz</div><div class="t-v ${avg!=null && avg > tg ? 'bad-t' : ''}">${avg==null?'—':num(avg,1)+' %'}</div><div class="t-s">Ziel ${num(tg)} %</div></div></div>
      <div class="tile"><div><div class="t-l">Kalkuliert</div><div class="t-v">${linked.length}<small> / ${S.menu.length}</small></div><div class="t-s">Gerichte mit Rezeptur</div></div></div>
      <button type="button" class="tile click" data-act="goStock" data-id="bestand"><div><div class="t-l">Lagerwert</div><div class="t-v">${eur(stockValue())}</div><div class="t-s">${lastInv?'Inventur '+fmtDate(lastInv.date):'noch keine Inventur'}</div></div></button>
      <button type="button" class="tile click" data-act="goStock" data-id="bestellung"><div><div class="t-l">Unter Mindestbestand</div><div class="t-v">${low.length}</div><div class="t-s">${low.length?'Bestellvorschlag':'alles vorrätig'}</div></div></button>
    </div>
    <div class="day-grid">
      <section class="panel">
        <div class="panel-h"><h2>Wareneinsatz je Gericht</h2><span class="legend"><i class="tl"></i>Ziel ${num(tg)} %</span></div>
        <div class="bars" style="--tg:${(tg/scale*100).toFixed(2)}%">
          ${linked.slice(0,12).map(({m,k})=>`<button type="button" class="bar-r" data-act="openCard" data-id="${k.c.id}" title="${esc(dishLabel(m))}"><span class="bar-n">${esc(dishLabel(m))}</span><span class="bar-t"><i class="${fcClass(k.fc)}" style="width:${Math.min(100,k.fc/scale*100).toFixed(2)}%"></i></span><span class="bar-v">${num(k.fc,1)} %</span></button>`).join('') || '<div class="empty">Noch keine Gerichte kalkuliert.</div>'}
          <div class="bar-axis"><span></span><span class="ax"><i>0 %</i><i>${num(scale/2)} %</i><i>${num(scale)} %</i></span><span></span></div>
        </div>
      </section>
      ${daySec('Offen', '', openRows)}
    </div>
  </div>`;
};

/* ---------- Aufbau: Liste statt Bühne ---------- */
renderAufbau = function(){
  const o = gameOverall(); const nx = o.next;
  const row = s => { const st = s.pct >= 100 ? 'done' : (nx && nx.k === s.k) ? 'active' : 'open';
    return `<li class="au-row ${st}">
      <span class="au-n">${s.pct>=100 ? ico('check') : s.no}</span>
      <span class="au-t"><b>${esc(s.name)}${st==='active'?'<em>jetzt dran</em>':''}</b><small>${esc(s.wozu)}</small></span>
      <span class="au-p"><span>${esc(s.metric)}</span><span class="au-m"><i style="width:${s.pct}%"></i></span></span>
      <span class="au-a">${st==='done' ? `<button type="button" class="btn sm" data-act="${s.act.a}" data-id="${esc(s.act.id)}">${esc(s.act.l)}</button>` : `<button type="button" class="btn sm ${st==='active'?'primary':''}" data-act="${s.act.a}" data-id="${esc(s.act.id)}">${esc(s.act.l)}</button>`}</span>
    </li>`; };
  return `<div class="page-h"><div><h1>Aufbau</h1></div>
    <div class="row-btns">${nx ? `<button type="button" class="btn primary" data-act="${nx.act.a}" data-id="${esc(nx.act.id)}">${esc(nx.act.l)}</button>` : ''}</div></div>
  <div class="au-sum"><span class="au-m big"><i style="width:${o.pct}%"></i></span><span class="au-sum-t"><b>${o.pct} %</b> · Stufe ${o.lvl+1} von ${LEVELS.length}, ${esc(o.lvlName)} · ${o.doneN} von ${o.st.length} Stationen fertig${o.pct>=100?' · alles steht':''}</span></div>
  <ol class="au-list">${o.st.map(row).join('')}</ol>`;
};

/* ---------- Zahlen: Komma-Eingabe zuerst normalisieren, dann rechnen die alten Handler ---------- */
/* Ungültig (Buchstaben, negativ, außerhalb des Bereichs, leer bei Pflichtfeldern): alter Wert bleibt, kurzer Hinweis, kein Handler läuft.
   data-num: "req" = darf nicht leer sein, "price" = Preis-Hinweis, "de" = Anzeige bleibt deutsch (Handler liest selbst mit numParse). */
function numReject(t, e){
  if(e) e.stopImmediatePropagation();
  t.value = t.dataset.old != null ? t.dataset.old : t.defaultValue;
  t.classList.add('bad-in'); setTimeout(() => t.classList.remove('bad-in'), 1600);
  toast(t.dataset.msg || ((t.dataset.num||'').includes('price') ? 'Ungültiger Preis, nicht geändert' : 'Ungültige Eingabe, nicht geändert'));
}
window.addEventListener('change', e => { const t = e.target; if(!t || !t.classList || !t.classList.contains('num-in') || t.closest('#dlgForm')) return;
  const kind = t.dataset.num || ''; const raw = t.value.trim(); if(kind.includes('self')) return;
  if(raw === ''){ if(kind.includes('req')) numReject(t, e); return; }
  const v = numParse(raw); const min = t.dataset.min != null ? +t.dataset.min : 0, max = t.dataset.max != null ? +t.dataset.max : Infinity;
  if(!isFinite(v) || v < min || v > max){ numReject(t, e); return; }
  if(!kind.includes('de')) t.value = String(v);
}, true);
document.addEventListener('focusin', e => { if(e.target.matches && e.target.matches('input.lt-price')) setTimeout(() => { if(document.activeElement === e.target) e.target.select(); }, 0); });

/* ---------- Bedienung ---------- */
document.addEventListener('keydown', e => {
  if(e.key !== '/' || e.target.closest('input,textarea,select,[contenteditable]') || !$('#pal').hidden || $('#dlg').open) return;
  const s = document.querySelector('#app #mq, #app #cq, #app #pq, #app #labIn, #app #shelfQ'); if(!s) return;
  e.preventDefault(); e.stopImmediatePropagation(); s.focus(); s.select();
}, true);
document.addEventListener('change', e => { const t = e.target; if(t.dataset && t.dataset.sel === 'sec'){ view.sec = t.value; render(); } });
document.addEventListener('click', e => { const b = e.target.closest('[data-act="dashPast"]'); if(b){ view.dashPast = !view.dashPast; render(); } });
document.addEventListener('click', e => { if(e.target.closest('tr.row') && e.target.closest('input,select,textarea,label,a')) e.stopPropagation(); }, true);

/* ---------- Speisekarte: Karten-Ansicht mit derselben Werkzeugleiste wie Liste/Kompakt ---------- */
function menuShownIds(){
  const q = view.q.trim().toLowerCase(), f = view.sec;
  return new Set(menuSorted().map(m => ({m, k:menuCalc(m)})).filter(({m,k}) => (!q || (m.name+' '+m.desc+' '+m.section+' '+(k.t?k.t.lines.map(l=>l.name).join(' '):'')).toLowerCase().includes(q))
    && (f==='all' || (f==='none' ? k.cost==null : f==='over' ? (k.fc!=null && k.fc > S.settings.target) : f==='nophoto' ? !menuImg(m) : f==='noalg' ? !hasAlg(m) : SEASONS.some(x=>x[0]===f) ? m.seasons.includes(f) : m.section===f))).map(x => x.m.id));
}
const _rmcPolish = renderMenuCalc;
renderMenuCalc = function(){
  if(vmode('menu') !== 'cards') return _rmcPolish();
  VIEWS.menu = 'list'; const swList = vsw('menu'); let head; try { head = _rmcPolish(); } finally { VIEWS.menu = 'cards'; }
  head = head.replace(swList, vsw('menu'));
  const cut = head.indexOf('<div class="lt-wrap');
  if(cut < 0) return head; // leerer Zustand: identisch zur Liste
  head = head.slice(0, cut);
  const ids = menuShownIds(); const q0 = view.q, s0 = view.sec; view.q = ''; view.sec = 'all';
  let full; try { full = _menuCalcCards(); } finally { view.q = q0; view.sec = s0; }
  const t = document.createElement('template'); t.innerHTML = full;
  t.content.querySelectorAll('.toolbar,.chips-row,.chips-wrap').forEach(n => n.remove());
  t.content.querySelectorAll('article.dish').forEach(a => { const id = a.querySelector('[data-act=editMenu]')?.dataset.id; if(!ids.has(id)) a.remove(); });
  t.content.querySelectorAll('.dish-grid').forEach(g => { if(!g.querySelector('article')){ const h = g.previousElementSibling; if(h && h.classList.contains('sec-h')) h.remove(); g.remove(); } });
  const box = document.createElement('div'); box.appendChild(t.content.cloneNode(true));
  return head + box.innerHTML;
};
