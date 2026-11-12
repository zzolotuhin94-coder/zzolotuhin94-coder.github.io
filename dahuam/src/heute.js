/* =====================================================================
   Heute: ein ruhiges Tagesblatt.
   Oben die Zeilen, die heute zählen (Vorbereitung, Bestellen bis …, Eigenkontrolle, Lieferungen),
   dann Dienst und Checklisten, die Karte, ganz unten eingeklappt „Einrichtung“.
   Jede Zeile ist selbst der Knopf; nur „Öl gewechselt“ ist ein eigener Ein-Tipp-Knopf.
   Ersetzt das frühere Tagesblatt (polish.js) samt seiner Ergänzungen aus vorbereitung.js, team.js,
   eigen.js, apart.js und reliab.js; deren Rechenteile werden hier weiterverwendet.
   ===================================================================== */
const DH_EVENING = 14 * 60;   // „Schließen …“-Listen erst ab 14 Uhr (oder sobald jemand damit begonnen hat)

/* Eine Zeile: der ganze Streifen ist ein Knopf. extra = ein zweiter, kleiner Knopf rechts (z. B. „Öl gewechselt“). */
function dhRow(o){
  const attrs = o.rel ? `data-rel="${o.rel}"` : `data-act="${o.act}"${o.id != null ? ` data-id="${esc(String(o.id))}"` : ''}`;
  return `<li class="rw dh-r ${o.cls || ''}"><button type="button" class="dh-b" ${attrs}>`
    + `<span class="rw-lead">${o.lead || ''}</span>`
    + `<span class="rw-main"><b>${o.title}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</span>`
    + `${o.meta ? `<span class="rw-meta">${o.meta}</span>` : ''}`
    + `<span class="dh-go" aria-hidden="true">${ico('arrow', 'flip')}</span></button>${o.extra || ''}</li>`;
}
function dhSec(label, rows, cls){ return rows ? `<section class="day-sec dh-sec ${cls || ''}"><h2 class="dh-l">${label}</h2><ul class="rows">${rows}</ul></section>` : ''; }
const dhTry = (f, what) => { try { return f() || ''; } catch(err){ console.warn('Heute ' + what + ':', err); return ''; } };

/* ---------- Vorbereitung: eine Zeile, öffnet die Vorbereitung des Tages ---------- */
function dhPrep(){
  if(typeof vbForecast !== 'function' || !plIdx().days.length) return '';
  const t = todayStr(); const off = vbForecast(t).closed ? 1 : 0; const D = dAdd(t, off); const fc = vbForecast(D); if(fc.closed || fc.mode === 'none') return '';
  const pl = vbPlan(D); const done = (() => { try { const chk = planState().chk[pl.D] || {}; return Object.keys(chk).filter(k => chk[k]).length; } catch(e){ return 0; } })();
  const sub = [pl.batches.length ? `${pl.batches.length} ${pl.batches.length === 1 ? 'Basisrezept' : 'Basisrezepte'} vorkochen` : '', `≈ ${num(pl.total)} Portionen erwartet`].filter(Boolean).join(' · ');
  const meta = pl.nMiss ? `<span class="bad-t">${pl.nMiss} ${pl.nMiss === 1 ? 'Zutat fehlt' : 'Zutaten fehlen'}</span>` : done ? `${num(done)} abgehakt` : '';
  return dhRow({lead:off ? 'morgen' : 'heute', title:off ? 'Vorbereitung für morgen' : 'Vorbereitung', sub, meta, act:'plGo', id:off, cls:'pl-dash'});
}

/* ---------- Bestellen: je offenem Lieferanten eine Zeile „bis 12:00“; Erledigtes und Vorbei eingeklappt ---------- */
function dhOrders(){
  const t = todayStr(), w = wd(t);
  const due = (S.suppliers || []).filter(sp => sp.active && sp.orderDays.includes(w)).sort((a, b) => hm(a.cutoff) - hm(b.cutoff)).map(sp => ({sp, st:supToday(sp)}));
  const low = lowStock();
  const row = ({sp, st}) => {
    const lowN = low.filter(p => p.supplier === sp.id).length;
    const sub = [st.state === 'open' ? `<span class="${st.urgent ? 'bad-t' : ''}">${esc(st.label)}</span>` : esc(st.label), st.draft && st.state === 'open' ? 'Entwurf liegt bereit' : `Lieferung ${esc(String(dayLabel(st.delivery)).split(',')[0])}`, lowN ? `${lowN} unter Mindestbestand` : ''].filter(Boolean).join(' · ');
    const past = st.state !== 'open';
    return dhRow({lead:`bis ${esc(sp.cutoff)}`, title:`${esc(sp.name)}`, sub,
      act:st.state === 'sent' ? 'ordList' : st.draft ? 'ordOpen' : 'ordNew', id:st.state === 'sent' ? '' : st.draft ? st.draft.id : sp.id, cls:'dh-ord' + (past ? ' past' : '')});
  };
  const open = due.filter(x => x.st.state === 'open'), rest = due.filter(x => x.st.state !== 'open');
  const fold = rest.length ? `<li class="rw past rw-fold"><button type="button" class="rw-more" data-act="dashPast" aria-expanded="${view.dashPast ? 'true' : 'false'}">${dhRestTxt(rest)} · ${view.dashPast ? 'ausblenden' : 'anzeigen'}</button></li>` + (view.dashPast ? rest.map(row).join('') : '') : '';
  dhOrders.fold = fold;   // die eingeklappte Zeile steht am Ende von „Heute zu tun“, nach allem, was noch zu tun ist
  return open.map(row).join('');
}
function dhRestTxt(rest){
  const sent = rest.filter(x => x.st.state === 'sent').length, past = rest.length - sent;
  return [sent ? `Heute bestellt: ${sent}` : '', past ? `Annahmeschluss vorbei: ${past} ${past === 1 ? 'Lieferant' : 'Lieferanten'}` : ''].filter(Boolean).join(' · ');
}

/* ---------- Lieferungen: je erwarteter Bestellung eine Zeile, öffnet direkt den Wareneingang ---------- */
function dhDeliveries(){
  const t = todayStr();
  return (S.orders || []).filter(o => ['sent', 'confirmed'].includes(o.status) && o.deliveryDate <= t).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate)).map(o => {
    const sp = SUP(o.supplier); const late = o.deliveryDate < t;
    return dhRow({lead:late ? `<span class="bad-t">${fmtDate(o.deliveryDate + 'T12:00:00').slice(0, 6)}</span>` : 'Lieferung', title:esc(sp ? sp.name : '?'),
      sub:`Wareneingang prüfen · ${esc(o.no)} · ${o.lines.length} ${o.lines.length === 1 ? 'Position' : 'Positionen'}${late ? ' · <span class="bad-t">überfällig</span>' : ''}`, act:'ordRecv', id:o.id, cls:'dh-recv'});
  }).join('');
}

/* ---------- Eigenkontrolle: Frittieröl mit „Öl gewechselt“ (ein Tipp, mit Rückgängig), Reinigungsplan ---------- */
function dhEk(D){
  if(typeof ekDue !== 'function') return '';
  const d = ekDue(D); if(!d.any) return ''; const k = ekS(); const many = k.fryers.length > 1; let h = '';
  d.oil.forEach(({f, st}) => {
    h += dhRow({lead:st.over > 0 ? '<span class="bad-t">fällig</span>' : 'heute', title:many ? `Frittieröl · ${esc(f.name)}` : 'Frittieröl', sub:esc(ekOilDueTxt(st)), act:'ekOpen', id:'oil', cls:'ek-dash dh-oil',
      extra:`<button type="button" class="btn sm dh-x" data-act="dhOil" data-id="${esc(f.id)}">${ico('check')}Öl gewechselt</button>`});
  });
  if(d.open.length) h += dhRow({lead:d.over.length ? `<span class="bad-t">${d.open.length}</span>` : String(d.open.length), title:'Reinigungsplan',
    sub:`${d.open.length} offen${d.over.length ? `, <span class="bad-t">${d.over.length === d.open.length ? '' : d.over.length + ' davon '}überfällig</span>` : ''}`, act:'ekOpen', id:'clean', cls:'ek-dash dh-clean'});
  return h;
}
function dhOilNow(fid){
  if(typeof ekS !== 'function') return; const k = ekS(); const f = k.fryers.find(x => x.id === fid) || k.fryers[0]; if(!f) return;
  const r = ekRec({k:'oil', fr:f.id, t:'wechsel'}); k.log.unshift(r); save(); render();
  toast(`Öl gewechselt${k.fryers.length > 1 ? ' · ' + f.name : ''}, ${r.a} Uhr`, {label:'Rückgängig', action:() => { k.log = k.log.filter(x => x.id !== r.id); save(); render(); }});
}

/* ---------- Team: wer heute im Dienst ist (jetzt / später / schon gegangen) ---------- */
function dhWho(){
  if(typeof tmS !== 'function') return ''; const st = tmS(); if(!st.people.length) return '';
  const t = todayStr(); const now = nowMin();
  const sh = tmShifts(t).slice().sort((a, b) => tmMin(a.parts[0][0]) - tmMin(b.parts[0][0]) || TM_AREAS.findIndex(x => x[0] === a.area) - TM_AREAS.findIndex(x => x[0] === b.area));
  const n = new Set(sh.map(s => s.pid)).size;
  const txt = s => `${esc((tmPerson(s.pid) || {name:'?'}).name)} (${esc(TM_AREA[s.area] || '')} ${esc(tmPartsTxt(s.parts, true))})`;
  const when = s => { const sp = s.parts.map(tmSpan); if(sp.some(([a, e]) => now >= a && now < e)) return 'now'; if(sp.every(([, e]) => e <= now)) return 'gone'; return 'later'; };
  const g = {now:[], later:[], gone:[]}; sh.forEach(s => g[when(s)].push(txt(s)));
  const parts = [g.now.length ? `jetzt: ${g.now.join(', ')}` : '', g.later.length ? `später: ${g.later.join(', ')}` : '', g.gone.length ? `schon gegangen: ${g.gone.join(', ')}` : ''].filter(Boolean);
  const gaps = tmGaps(t);
  return dhRow({lead:n ? num(n) : '–', title:'Heute im Dienst', sub:n ? parts.join(' · ') : tmClosed(t) ? 'Ruhetag, niemand eingeteilt' : 'Noch niemand eingeteilt',
    meta:gaps.length ? `<span class="tm-gapt">${esc(gaps.join(' und '))} fehlt</span>` : '', act:'tmGo', cls:'tm-dash-who'});
}

/* ---------- Checklisten: eine Zeile für alle Listen; „Schließen …“ erst ab 14 Uhr ---------- */
function dhEvening(tp){ return /^\s*schlie(ß|ss)en|abend/i.test(tp.name || ''); }
function dhChecks(D){
  if(typeof ckDue !== 'function') return '';
  const t = todayStr(); const late = D !== t || nowMin() >= DH_EVENING;
  const lists = ckDue(D).map(tp => ({tp, pr:ckProg(tp, D)})).filter(x => late || !dhEvening(x.tp) || x.pr.started);
  if(!lists.length) return '';
  const open = lists.filter(x => !x.pr.full); const out = lists.reduce((a, x) => a + x.pr.out, 0);
  const next = open[0] || lists[0];
  const sub = lists.map(x => `${esc(x.tp.name)} ${x.pr.full ? '✓' : `${x.pr.done}/${x.pr.total}`}`).join(' · ');
  return dhRow({lead:open.length ? `${lists.length - open.length}/${lists.length}` : ico('check'), title:open.length ? 'Checklisten' : 'Checklisten erledigt', sub,
    meta:out ? `<span class="bad-t">${out} ${out === 1 ? 'Wert' : 'Werte'} außerhalb</span>` : '', act:'ckGo', id:open.length ? next.tp.id : '', cls:'ck-dash' + (open.length ? '' : ' past')});
}

/* ---------- Apartments ---------- */
function dhApart(){
  const a = S && S.apart; if(!a || !a.apts.length || typeof apToday !== 'function') return '';
  const T = apToday(); let ni = 0, no = 0; a.apts.forEach(x => { const i = apDayInfo(x, T); ni += i.inn.length; no += i.out.length; });
  const open = apTasks(T, T).filter(t => !t.done).concat(apOverdue(T)); if(!ni && !no && !open.length) return '';
  const urgent = open.find(t => t.D === T && t.wechsel);
  const parts = [ni ? (ni === 1 ? '1 Anreise' : ni + ' Anreisen') : '', no ? (no === 1 ? '1 Abreise' : no + ' Abreisen') : '', open.length ? `${open.length === 1 ? '1 Reinigung' : open.length + ' Reinigungen'} offen${urgent ? `, Wechseltag bis ${urgent.until} Uhr` : ''}` : ''].filter(Boolean);
  return dhRow({lead:ico('apart'), title:'Apartments', sub:esc(parts.join(', ')), act:'apGo', id:open.length ? 'reinigung' : 'uebersicht', cls:'ap-dash'});
}

/* ---------- Karte: laufende Aktion, Tagesgerichte, sonst die nächste Aktion ---------- */
function dhCard(){
  const t = todayStr(), w = wd(t); const live = specialsFor(t);
  const dayDishes = S.menu.filter(m => !m.hidden && m.days && m.days.length && m.days.includes(w));
  const nextSp = S.specials.filter(sp => spStatus(sp)[0] === 'soon').sort((a, b) => a.from.localeCompare(b.from))[0];
  return [
    ...live.map(sp => dhRow({lead:'Aktion', title:esc(sp.name), sub:`${sp.items.length} ${sp.items.length === 1 ? 'Gericht' : 'Gerichte'}${sp.to && sp.to !== sp.from ? ` · bis ${fmtDate(sp.to + 'T12:00:00')}` : ''}`, act:'previewSpecial', id:sp.id})),
    ...dayDishes.map(m => dhRow({lead:DAYNAME[w].slice(0, 2), title:esc(dishLabel(m)), sub:`${esc(m.section)} · ${eur(m.price)}`, act:m.card && C(m.card) ? 'openCard' : 'goMenu', id:m.card && C(m.card) ? m.card : ''})),
    ...(nextSp && !live.length ? [dhRow({lead:fmtDate(nextSp.from + 'T12:00:00').slice(0, 6), title:esc(nextSp.name), sub:`Aktion · ${esc(spStatus(nextSp)[1])}`, act:'previewSpecial', id:nextSp.id, cls:'past'})] : []),
  ].join('');
}

/* ---------- Ganz unten: „Einrichtung“, eingeklappt, eine ruhige Zeile ---------- */
function dhSetup(){
  const o = einrStand(); const linked = S.menu.filter(m => menuCalc(m).cost != null).length; const noRz = S.menu.length - linked; const noAlg = noAlgCount();
  const low = lowStock(); const lastInv = S.inventories[0];
  const rows = [
    o.pct < 100 ? dhRow({lead:`${o.pct} %`, title:'Einrichtung', sub:o.next ? `als Nächstes: ${esc(o.next.name)}` : '', act:'goTab', id:'einr', cls:'einr-line'}) : '',
    noRz ? dhRow({lead:num(noRz), title:'Gerichte ohne Rezeptur', act:'goMenu', id:'none'}) : '',
    noAlg ? dhRow({lead:num(noAlg), title:'Gerichte ohne Allergenangabe', act:'goMenu', id:'noalg'}) : '',
    low.length ? dhRow({lead:num(low.length), title:'Artikel unter Mindestbestand', act:'goStock', id:'bestellung'}) : '',
    dhRow({lead:S.invDraft ? '…' : ico('clip'), title:S.invDraft ? 'Inventur läuft' : 'Inventur', sub:lastInv ? `zuletzt ${fmtDate(lastInv.date)}` : 'noch keine', act:'goStock', id:'inventur'}),
  ].join('');
  const sum = [o.pct < 100 ? `${o.pct} %` : '', noRz ? `${num(noRz)} ohne Rezeptur` : '', noAlg ? `${num(noAlg)} ohne Allergene` : '', low.length ? `${num(low.length)} unter Mindestbestand` : ''].filter(Boolean).join(' · ');
  return `<details class="dh-more" data-more="dash" ${(view.more || {}).dash ? 'open' : ''}><summary><span class="dh-l">Einrichtung</span><span class="dh-ms">${sum || 'Inventur und Bestand'}</span></summary><ul class="rows">${rows}</ul></details>`;
}

/* ---------- Das Blatt ---------- */
renderDash = function(){
  const t = todayStr(), w = wd(t); const D = typeof ckToday === 'function' ? ckToday() : t;
  const closed = (S.settings.closed || []).includes(w);
  const sk = seasonFor(t); const sTitle = sk && S.settings.seasons && S.settings.seasons[sk] ? S.settings.seasons[sk].title : '';
  const dateStr = new Date().toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long'});
  const line = [closed ? `${DAYNAME[w]} ist Ruhetag` : 'Servicetag', esc(sTitle)].filter(Boolean).join(' · ');
  const backup = dhTry(() => typeof relBackupDue === 'function' && relBackupDue() ? dhRow({lead:ico('download'), title:'Sicherung speichern', sub:esc(relBackupLine()), rel:'backup', cls:'rel-remind'}) : '', 'Sicherung');
  dhOrders.fold = ''; const now = [dhTry(dhPrep, 'Vorbereitung'), dhTry(dhOrders, 'Bestellen'), dhTry(() => dhEk(D), 'Eigenkontrolle'), dhTry(dhDeliveries, 'Lieferungen'), dhTry(dhApart, 'Apartments'),
    dhOrders.fold || '', dhRow({lead:ico('report'), title:'Verkäufe buchen', sub:'Zutaten werden vom Lager abgebucht', act:'sales', cls:'dh-sales past'}), backup].join('');
  const team = [dhTry(dhWho, 'Dienst'), dhTry(() => dhChecks(D), 'Checklisten')].join('');
  const card = dhTry(dhCard, 'Karte');
  const live = specialsFor(t).length || S.menu.some(m => !m.hidden && m.days && m.days.includes(w));
  return `<div class="page-h dh-h"><div><h1>${dateStr}</h1><p class="dh-sub">${line}</p></div></div>
  <div class="day dh">
    ${dhSec('Heute zu tun', now, 'dh-now')}
    ${dhSec(D !== t ? 'Team · Checklisten noch vom Vortag, bis 5 Uhr früh' : 'Team', team, 'tm-dash')}
    ${dhSec(live ? 'Auf der Karte' : 'Demnächst', card, 'dh-card')}
    ${dhTry(dhSetup, 'Einrichtung')}
    ${S.demo ? `<p class="demo-line m-only">${demoLine()}</p>` : ''}
  </div>`;
};

/* ---------- Bedienung ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-act]'); if(!el) return; const a = el.dataset.act;
  if(document.body.classList.contains('gd-help')) return;   // Hilfe-Modus erklärt, statt zu handeln
  if(a === 'dhOil'){ e.stopPropagation(); dhOilNow(el.dataset.id); }
  else if(a === 'ordList'){ view.order = null; view.recv = null; view.stab = 'bestellung'; go('buy'); }
});
document.addEventListener('toggle', e => { const d = e.target; if(d && d.matches && d.matches('details.dh-more')){ view.more = view.more || {}; view.more.dash = d.open; } }, true);
if(typeof H === 'function' && typeof HELP_SEL !== 'undefined'){
  H('dh_oel', 'Öl gewechselt', 'Trägt den Ölwechsel mit dem heutigen Datum und der jetzigen Uhrzeit ins Frittieröl-Protokoll ein. Gleich danach können Sie ihn mit „Rückgängig“ zurücknehmen.');
  HELP_SEL.push(['#app .dh-oil .dh-x', 'dh_oel']);
}
