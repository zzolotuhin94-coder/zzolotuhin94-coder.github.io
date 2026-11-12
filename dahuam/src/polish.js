/* =====================================================================
   Heute als Tagesblatt, Zahlen-Eingabe deutsch, kleine Bedienhilfen.
   ===================================================================== */


/* ---------- Heute: Tagesblatt ---------- */
function dayRow(lead, main, sub, meta, act, cls=''){
  return `<li class="rw ${cls}"><span class="rw-lead">${lead}</span><span class="rw-main"><b>${main}</b>${sub?`<small>${sub}</small>`:''}</span><span class="rw-meta">${meta||''}</span><span class="rw-act">${act||''}</span></li>`;
}
function daySec(title, sub, rowsHtml){ return `<section class="day-sec"><h2 class="day-h">${title}${sub?`<span>${sub}</span>`:''}</h2><ul class="rows">${rowsHtml}</ul></section>`; }
function renderDash(){
  const t = todayStr(), w = wd(t), now = nowMin();
  const closed = (S.settings.closed||[]).includes(w);
  const sk = seasonFor(t); const sTitle = sk && S.settings.seasons && S.settings.seasons[sk] ? S.settings.seasons[sk].title : '';
  const all = S.menu.map(m => ({m, k:menuCalc(m)}));
  const linked = all.filter(x => x.k.cost != null).sort((a,b)=>b.k.fc-a.k.fc);
  const avg = linked.length ? linked.reduce((s,x)=>s+x.k.fc,0)/linked.length : null;
  const tg = +S.settings.target; const over = linked.filter(x => x.k.fc > tg);
  const low = lowStock(); const lastInv = S.inventories[0];
  const sups = (S.suppliers||[]).filter(s=>s.active);
  const due = sups.filter(sp => sp.orderDays.includes(w)).sort((a,b)=>hm(a.cutoff)-hm(b.cutoff));
  const exp = (S.orders||[]).filter(o => ['sent','confirmed'].includes(o.status) && o.deliveryDate <= t).sort((a,b)=>a.deliveryDate.localeCompare(b.deliveryDate));
  const live = specialsFor(t);
  const dayDishes = S.menu.filter(m => !m.hidden && m.days && m.days.length && m.days.includes(w));
  const nextSp = S.specials.filter(sp => spStatus(sp)[0]==='soon').sort((a,b)=>a.from.localeCompare(b.from))[0];
  const dateStr = new Date().toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'});
  // Stand je Lieferant kommt aus supToday(), genau wie im Einkauf
  const dueSt = due.map(sp => ({sp, st: supToday(sp)}));
  const openDue = dueSt.filter(x => x.st.state === 'open'), sentDue = dueSt.filter(x => x.st.state === 'sent'), pastDue = dueSt.filter(x => x.st.state === 'past');
  const orderInfo = !due.length ? 'kein Bestelltag' : openDue.length ? `${openDue.length} ${openDue.length===1?'Bestellung':'Bestellungen'} offen, bis ${esc(openDue[openDue.length-1].sp.cutoff)} Uhr` : pastDue.length ? `Annahmeschluss vorbei${sentDue.length ? `, ${sentDue.length} bestellt` : ''}` : 'alles bestellt';
  const subParts = [closed ? `${DAYNAME[w]} ist Ruhetag` : 'Servicetag', esc(sTitle), orderInfo];
  const orderRow = ({sp, st}) => {
    const need = st.state === 'sent' || st.draft ? [] : supNeed(sp.id, st.delivery); const val = need.reduce((a,x)=>a+x.n*(x.p.packQty||1)*x.p.price,0);
    const none = st.state === 'open' && !st.draft && !need.length;   // nichts nötig: ruhig zeigen, ohne roten Countdown
    const sub = `${CHANNELS[sp.channel]} · Lieferung ${dayLabel(st.delivery)}${need.length?` · ${need.length} ${need.length===1?'Artikel':'Artikel'} vorgeschlagen, ${eur(val)}`:''}`;
    const meta = none ? '<span class="muted">nichts nötig</span>' : st.state === 'open' ? `<span class="${st.urgent ? 'bad-t' : ''}">${esc(st.label)}</span>` : esc(st.label);
    const act = none ? `<button type="button" class="link" data-act="ordNew" data-id="${sp.id}">ansehen</button>` : st.state === 'sent' ? '' : st.draft ? `<button type="button" class="btn sm" data-act="ordOpen" data-id="${st.draft.id}">Entwurf öffnen</button>` : st.state === 'past' ? `<button type="button" class="btn sm" data-act="ordNew" data-id="${sp.id}">Für ${esc(dayLabel(st.delivery).split(',')[0])} vorbereiten</button>` : `<button type="button" class="btn sm" data-act="ordNew" data-id="${sp.id}">Vorbereiten</button>`;
    return dayRow(`bis ${esc(sp.cutoff)}`, esc(sp.name), sub, meta, act, st.state === 'open' && !none ? '' : 'past');
  };
  const pastLine = pastDue.length ? `<li class="rw past rw-fold"><button type="button" class="rw-more" data-act="dashPast" aria-expanded="${view.dashPast?'true':'false'}">Annahmeschluss heute vorbei: ${pastDue.length} ${pastDue.length===1?'Lieferant':'Lieferanten'} · ${view.dashPast?'ausblenden':'anzeigen'}</button></li>` + (view.dashPast ? pastDue.map(orderRow).join('') : '') : '';
  const orderRows = [...openDue, ...sentDue].map(orderRow).join('');
  const recvRows = exp.map(o => { const sp = SUP(o.supplier); const late = o.deliveryDate < t;
    return dayRow(late ? `<span class="bad-t">${fmtDate(o.deliveryDate+'T12:00:00').slice(0,6)}</span>` : 'heute', esc(sp ? sp.name : '?'), `${esc(o.no)} · ${o.lines.length} Positionen · ${eur(orderTotal(o))}${late?' · überfällig':''}`, statusPill(o.status), `<button type="button" class="btn sm" data-act="ordRecv" data-id="${o.id}">Wareneingang</button>`); }).join('');
  const cardRows = [
    ...live.map(sp => dayRow('Aktion', esc(sp.name), `${sp.items.length} ${sp.items.length===1?'Gericht':'Gerichte'}${sp.to && sp.to!==sp.from ? ` · bis ${fmtDate(sp.to+'T12:00:00')}` : ''}`, '', `<button type="button" class="btn sm" data-act="previewSpecial" data-id="${sp.id}">Karte</button>`)),
    ...dayDishes.map(m => dayRow(DAYNAME[w].slice(0,2), esc(dishLabel(m)), `${esc(m.section)} · ${eur(m.price)}`, '', m.card && C(m.card) ? `<button type="button" class="btn sm" data-act="openCard" data-id="${m.card}">Rezeptur</button>` : '')),
    ...(nextSp && !live.length ? [dayRow(fmtDate(nextSp.from+'T12:00:00').slice(0,6), esc(nextSp.name), spStatus(nextSp)[1], '', `<button type="button" class="btn sm" data-act="previewSpecial" data-id="${nextSp.id}">Vorschau</button>`, 'past')] : []),
  ].join('');
  const openRows = [
    S.menu.length-linked.length ? dayRow(num(S.menu.length-linked.length), 'Gerichte ohne Rezeptur', '', '', `<button type="button" class="btn sm" data-act="goMenu" data-id="none">Ansehen</button>`) : '',
    noAlgCount() ? dayRow(num(noAlgCount()), 'Gerichte ohne Allergenangabe', '', '', `<button type="button" class="btn sm" data-act="goMenu" data-id="noalg">Ansehen</button>`) : '',
    over.length ? dayRow(`<span class="bad-t">${over.length}</span>`, `Gerichte über ${num(tg)} % Wareneinsatz`, '', '', `<button type="button" class="btn sm" data-act="goMenu" data-id="over">Ansehen</button>`) : '',
    low.length ? dayRow(num(low.length), 'Artikel unter Mindestbestand', '', '', `<button type="button" class="btn sm" data-act="goStock" data-id="bestellung">Bestellen</button>`) : '',
    dayRow(S.invDraft ? '…' : ico('clip'), S.invDraft ? 'Inventur läuft' : 'Inventur', lastInv ? `zuletzt ${fmtDate(lastInv.date)}` : 'noch keine', '', `<button type="button" class="btn sm" data-act="goStock" data-id="inventur">${S.invDraft?'Fortsetzen':'Zählen'}</button>`),
  ].join('');

  return `<div class="page-h"><div><h1>${dateStr}</h1><p class="sub">${subParts.filter(Boolean).join(' · ')}</p></div>
    <div class="row-btns"><button type="button" class="btn" data-act="sales">Verkäufe buchen</button></div></div>
  ${einrLine()}
  <div class="day">
    ${openDue.length ? daySec('Bestellen', `${openDue.length} offen, Annahmeschluss`, orderRows + pastLine) : ''}
    ${recvRows ? daySec('Lieferungen prüfen', '', recvRows) : ''}
    ${!openDue.length && (orderRows || pastLine) ? daySec('Bestellen', sentDue.length ? `${sentDue.length} heute bestellt` : 'heute nichts mehr offen', orderRows + pastLine) : ''}
    ${cardRows ? daySec(live.length || dayDishes.length ? 'Heute auf der Karte' : 'Demnächst', '', cardRows) : ''}
    <!--dash-extra-->
    ${daySec('Offen', '', openRows)}
    <p class="fact">Ø Wareneinsatz <b class="${avg!=null && avg > tg ? 'bad-t' : ''}">${avg==null?'—':num(avg,1)+' %'}</b>, Ziel ${num(tg)} % · ${linked.length} von ${S.menu.length} Gerichten kalkuliert · Lagerwert <b>${eur(stockValue())}</b></p>
    ${S.demo ? `<p class="demo-line m-only">${demoLine()}</p>` : ''}
  </div>`;
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
  const s = document.querySelector('#app #mq, #app #cq, #app #pq, #app #shelfQ'); if(!s) return;
  e.preventDefault(); e.stopImmediatePropagation(); s.focus(); s.select();
}, true);
document.addEventListener('change', e => { const t = e.target; if(t.dataset && t.dataset.sel === 'sec'){ view.sec = t.value; render(); } });
document.addEventListener('click', e => { const b = e.target.closest('[data-act="dashPast"]'); if(b){ view.dashPast = !view.dashPast; render(); } });
document.addEventListener('click', e => { if(e.target.closest('tr.row') && e.target.closest('input,select,textarea,label,a')) e.stopPropagation(); }, true);
