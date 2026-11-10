/* =====================================================================
   Auswertung: Verkäufe nach Zeitraum, Kassen-Import, Zuordnung
   ===================================================================== */
ICO.report = '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>';
const UNITS = [['week','Woche'],['month','Monat'],['season','Saison'],['year','Jahr'],['custom','Von–Bis']];
const MONTHS = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
view.rp = {unit:'month', ref:isoDate(new Date()), from:'', to:'', cmp:'off', tab:'sales', chip:'all', grouped:true};
const RSORT = {col:'gross', dir:-1, flip:0, def:1};

function isoWeek(s){ const d = dParse(s); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = t.getUTCFullYear(); const w = Math.ceil(((t - Date.UTC(y,0,1))/864e5 + 1)/7); return [y, w]; }
function seasonRange(ref){
  const ss = S.settings.seasons; const y = +ref.slice(0,4), md = ref.slice(5); const w = ss.winter, so = ss.sommer;
  const inW = w.from <= w.to ? (md >= w.from && md <= w.to) : (md >= w.from || md <= w.to);
  if(inW){ const sy = md >= w.from ? y : y-1; return {k:'winter', from:`${sy}-${w.from}`, to:`${sy+1}-${w.to}`, label:`Wintersaison ${sy}/${String(sy+1).slice(2)}`}; }
  if(md >= so.from && md <= so.to) return {k:'sommer', from:`${y}-${so.from}`, to:`${y}-${so.to}`, label:`Sommersaison ${y}`};
  // Zwischensaison: letzte abgeschlossene Saison
  if(md > so.to) return {k:'sommer', from:`${y}-${so.from}`, to:`${y}-${so.to}`, label:`Sommersaison ${y}`};
  const sy = y-1; return {k:'winter', from:`${sy}-${w.from}`, to:`${y}-${w.to}`, label:`Wintersaison ${sy}/${String(y).slice(2)}`};
}
function rpRange(rp){
  const r = rp.ref, d = dParse(r), y = d.getFullYear(), m = d.getMonth();
  const mo = (yy,mm) => isoDate(new Date(yy,mm,1,12)), last = (yy,mm) => isoDate(new Date(yy,mm+1,0,12));
  switch(UNITS.some(u => u[0] === rp.unit) ? rp.unit : 'month'){
    case 'week': { const off = (d.getDay()+6)%7; const f = dAdd(r,-off), t = dAdd(f,6); const [wy,wn] = isoWeek(r); return {from:f, to:t, label:`KW ${wn} · ${fmtShort(f)}–${fmtShort(t)}${t.slice(0,4)}`}; }
    case 'month': return {from:mo(y,m), to:last(y,m), label:`${MONTHS[m]} ${y}`};
    case 'year': return {from:`${y}-01-01`, to:`${y}-12-31`, label:`Jahr ${y}`};
    case 'season': return seasonRange(r);
    case 'custom': { const f = rp.from || dAdd(isoDate(new Date()),-29), t = rp.to || isoDate(new Date()); return {from:f<=t?f:t, to:f<=t?t:f, label:`${fmtDate(f+'T12:00:00')} – ${fmtDate(t+'T12:00:00')}`}; }
  }
}
function rpStep(dir){
  const rp = view.rp, d = dParse(rp.ref);
  if(rp.unit==='week') rp.ref = dAdd(rp.ref, 7*dir);
  else if(rp.unit==='month') rp.ref = isoDate(new Date(d.getFullYear(), d.getMonth()+dir, 1, 12));
  else if(rp.unit==='year') rp.ref = `${d.getFullYear()+dir}-06-15`;
  else if(rp.unit==='season'){ const r = seasonRange(rp.ref); rp.ref = dir < 0 ? dAdd(r.from,-1) : dAdd(r.to, 1); let g = 0; while(g++ < 400 && seasonRange(rp.ref).from === r.from) rp.ref = dAdd(rp.ref, dir); if(dir > 0 && rp.ref.slice(5) > S.settings.seasons.sommer.to && rp.ref.slice(5) < S.settings.seasons.winter.from) rp.ref = `${rp.ref.slice(0,4)}-${S.settings.seasons.winter.from}`; }
  else if(rp.unit==='custom'){ const r = rpRange(rp); const n = dDiff(r.from, r.to)+1; rp.from = dAdd(r.from, n*dir); rp.to = dAdd(r.to, n*dir); }
}
function cmpRange(rp, r, today){
  if(rp.cmp === 'off') return null;
  let c;
  if(rp.cmp === 'prev'){
    if(['month','year','season'].includes(rp.unit)){ const p = {...rp}; const keep = view.rp; view.rp = p; try { rpStep(-1); } finally { view.rp = keep; } const pr = rpRange(p); c = {from:pr.from, to:pr.to}; }
    else { const n = dDiff(r.from, r.to)+1; c = {from:dAdd(r.from,-n), to:dAdd(r.from,-1)}; }
  }
  else if(rp.unit === 'week') c = {from:dAdd(r.from,-364), to:dAdd(r.to,-364)};
  else { const sh = s => { let t = `${+s.slice(0,4)-1}${s.slice(4)}`; if(t.slice(5)==='02-29') t = t.slice(0,8)+'28'; return t; }; c = {from:sh(r.from), to:sh(r.to)}; }
  // läuft der Zeitraum noch, wird nur dieselbe Anzahl Tage ab Beginn verglichen
  today = today || isoDate(new Date());
  if(r.from <= today && r.to > today){ const n = dDiff(r.from, today); const to = dAdd(c.from, n); if(to < c.to){ c.to = to; c.same = n + 1; } }
  return c;
}

/* ---------- Kennzahlen ---------- */
function report(from, to){
  const a = salesAgg(from, to); const rows = [];
  let net = 0, we = 0, netCovered = 0, grossCovered = 0;
  for(const [mid, {q, g}] of a.by){
    const m = S.menu.find(x=>x.id===mid); const vat = vatOf(m); const n = g/(1+vat/100);
    const k = m ? menuCalc(m) : null; const cpp = k && k.cost != null ? k.cost : null;
    const w = cpp != null ? cpp*q : null;
    rows.push({mid, m, name: m ? dishLabel(m) : 'Gelöschtes Gericht', section: m ? m.section : '—', q, g, n, avg: q ? g/q : 0, we:w, cpp, fc: w != null && n ? w/n*100 : null, rg: w != null ? n - w : null});
    net += n; if(w != null){ we += w; netCovered += n; grossCovered += g; }
  }
  return {rows, qty:a.qty, gross:a.gross, net, we, netCovered, cover: a.gross ? grossCovered/a.gross*100 : 0, fc: netCovered ? we/netCovered*100 : null, rg: netCovered - we, days:a.days, openDays:a.openDays};
}
const delta = (cur, prev) => prev ? (cur/prev - 1)*100 : null;
function dPill(dv, inverse){ if(dv == null || !isFinite(dv)) return '<span class="rp-d">—</span>'; const up = dv >= 0; const good = inverse ? !up : up; return `<span class="rp-d ${Math.abs(dv) < .05 ? '' : good ? 'up' : 'down'}">${up?'+':''}${num(dv,1)} %</span>`; }

/* ---------- Ansicht ---------- */
function renderReport(){
  const rp = view.rp; if(!['sales','import','map'].includes(rp.tab)) rp.tab = 'sales'; const t = rp.tab; const nUn = Object.keys(S.salesUnmapped||{}).length;
  const head = `<div class="page-h"><div><h1>Team & Zahlen</h1></div>
    <div class="row-btns">${t==='import' ? '' : `<button type="button" class="btn primary" data-act="rpTab" data-id="import">${ico('plus')}Kasse importieren</button>`}</div></div>
  ${teamTabs()}
  ${t === 'sales' && !nUn ? '' : `<div class="toolbar">${seg('rpTab', t, [['sales','Verkäufe'],['import','Kasse importieren'],['map','Zuordnung', nUn || null]])}</div>`}`;
  if(t === 'import') return head + importView();
  if(t === 'map') return head + mapView();
  return head + salesView();
}
/* Schwund im Zeitraum: je Artikel Menge und Wert zum Preis der Buchung */
function wasteReport(from, to){
  const by = new Map(); let total = 0;
  for(const m of S.moves){ if(m.type !== 'waste') continue; const d = String(m.date).slice(0,10); const day = d.length === 10 && String(m.date).length > 10 ? isoDate(new Date(m.date)) : d; if(day < from || day > to) continue;
    const q = Math.abs(+m.qty || 0), v = q * (+m.price || 0); const p = P(m.pid); const key = m.pid;
    const x = by.get(key) || {pid:m.pid, p, name: p ? p.name : 'gelöschter Artikel', qty:0, value:0, n:0, notes:new Set()};
    x.qty += q; x.value += v; x.n++; if(m.note) x.notes.add(String(m.note).split(' · ')[0]); by.set(key, x); total += v; }
  return {rows:[...by.values()].sort((a,b) => b.value - a.value), total};
}
function wasteOnly(from, to){ return wasteReport(from, to).rows.length ? wasteBlock(from, to, {net:0}) : ''; }
function wasteBlock(from, to, cur){
  const w = wasteReport(from, to);
  if(!w.rows.length) return `<section class="panel rp-waste"><div class="panel-h"><h2>Schwund</h2></div><p class="hint" style="margin-top:0">In diesem Zeitraum ist kein Schwund gebucht. Unter Ware › Bestand schreiben Sie mit „Schwund buchen“ auf, was verdorben oder verkocht ist.</p></section>`;
  const top = w.rows.slice(0, 12), rest = w.rows.slice(12);
  return `<section class="panel rp-waste"><div class="panel-h"><h2>Schwund</h2><span class="muted sm">${eur(w.total)}${cur.net ? ` · ${num(w.total/cur.net*100, 1)} % vom Umsatz netto` : ''}</span></div>
    <div class="lt-wrap"><table class="lt"><thead><tr><th>Artikel</th><th class="r">Menge</th><th class="r">Wert</th><th class="hide-m">Grund</th></tr></thead><tbody>
    ${top.map(x => `<tr><td><b>${esc(x.name)}</b></td><td class="r">${qtyFmt(x.qty, x.p)}</td><td class="r">${eur(x.value)}</td><td class="hide-m lt-muted">${esc([...x.notes].join(', '))}</td></tr>`).join('')}
    ${rest.length ? `<tr><td class="lt-muted">${rest.length} weitere</td><td></td><td class="r">${eur(rest.reduce((a,x) => a + x.value, 0))}</td><td class="hide-m"></td></tr>` : ''}
    </tbody><tfoot><tr><td>Summe</td><td></td><td class="r">${eur(w.total)}</td><td class="hide-m"></td></tr></tfoot></table></div></section>`;
}
function salesView(){
  const rp = view.rp; const today = isoDate(new Date()); let r = rpRange(rp);
  // beim ersten Öffnen: hat der laufende Zeitraum keine Verkäufe, den letzten mit Daten zeigen
  if(!rp.auto){ rp.auto = true; if(rp.unit !== 'custom' && !Object.keys(S.salesDays||{}).some(d => d >= r.from && d <= r.to)){ const last = Object.keys(S.salesDays||{}).filter(d => d <= today).sort().pop(); if(last){ rp.ref = last; r = rpRange(rp); rp.jumped = true; } } }
  const to = r.to > today ? today : r.to; const cur = report(r.from, to);
  const cr = cmpRange(rp, r, today); const cmp = cr ? report(cr.from, cr.to > today ? today : cr.to) : null;
  const cmpLabel = cr ? `${fmtDate(cr.from+'T12:00:00')} – ${fmtDate(cr.to+'T12:00:00')}${cr.same ? ` · gleicher Zeitraum, ${plural(cr.same,'Tag','Tage')} ab Beginn` : ''}` : '';
  const unm = Object.values(S.salesUnmapped||{}); const unmG = unm.reduce((a,u)=>a+Object.entries(u.days||{}).filter(([d])=>d>=r.from&&d<=to).reduce((b,[,v])=>b+v[1],0),0);
  let h = `<section class="panel rp-period">
    <div class="rp-units">${seg('rpUnit', rp.unit, UNITS)}</div>
    <div class="rp-nav">${rp.unit==='custom' ? `<label class="f">Von<input type="date" data-rpd="from" value="${r.from}"></label><label class="f">Bis<input type="date" data-rpd="to" value="${r.to}"></label>` : ''}
      <button type="button" class="icon-btn lg" data-act="rpStep" data-id="-1" aria-label="Zurück">${ico('arrow')}</button>
      <div class="rp-label"><b>${esc(r.label)}</b><small>${fmtDate(r.from+'T12:00:00')} – ${fmtDate(r.to+'T12:00:00')}${r.to > today && r.from <= today ? ' · bis heute' : ''}${rp.jumped ? ' · letzter Zeitraum mit Verkäufen' : ''} · ${cur.openDays} ${cur.openDays===1?"Verkaufstag":"Verkaufstage"}</small></div>
      <button type="button" class="icon-btn lg" data-act="rpStep" data-id="1" aria-label="Weiter">${ico('arrow','flip')}</button>
      <button type="button" class="btn sm" data-act="rpToday">Aktuell</button></div>
  </section>`;
  const more = moreOpts('report', `<span class="f inl">Vergleich${seg('rpCmp', rp.cmp, [['off','Aus'],['prev','Vorperiode'],['year','Vorjahr']])}</span><button type="button" class="btn sm" data-pdf="rpPrint">${ico('download')}Als PDF speichern</button>${FRAMED ? '' : `<button type="button" class="btn sm" data-act="rpPrint">${ico('print')}Drucken</button>`}<button type="button" class="btn sm" data-act="rpCsv">Als CSV speichern</button>`);
  if(unm.length) h += `<p class="fact"><b>${unm.length} Kassenartikel nicht zugeordnet</b>${unmG?` · ${eur(unmG)} Umsatz in diesem Zeitraum fehlen hier`:''}. <button type="button" class="link" data-act="rpTab" data-id="map">Zuordnen</button></p>`;
  if(!cur.openDays) return h + wasteOnly(r.from, to) + `<section class="panel empty">Für diesen Zeitraum gibt es keine Verkäufe. Importieren Sie die Artikelumsätze aus Ihrer Kasse.<div class="row-btns" style="justify-content:center;margin-top:12px"><button type="button" class="btn primary" data-act="rpTab" data-id="import">Kasse importieren</button></div></section>`;
  const dp = (dv, inv) => cmp ? ' ' + dPill(dv, inv) : '';
  h += `<p class="rp-sum">Umsatz netto <b>${eur(cur.net)}</b>${dp(delta(cur.net, cmp && cmp.net))}, mit Steuer ${eur(cur.gross)} · <b>${num(cur.qty)}</b> Portionen${dp(delta(cur.qty, cmp && cmp.qty))} · im Schnitt <b>${eur(cur.openDays ? cur.net/cur.openDays : 0)}</b> je Verkaufstag · Wareneinsatz <b>${cur.fc!=null ? num(cur.fc,1)+' %' : '—'}</b>${dp(cmp && cmp.fc!=null && cur.fc!=null ? (cur.fc - cmp.fc)/cmp.fc*100 : null, true)} · Rohertrag <b>${eur(cur.rg)}</b>${dp(delta(cur.rg, cmp && cmp.rg))}${S.salesDemo ? ' · Beispielverkäufe, bis zum ersten Import aus Ihrer Kasse' : ''}</p>
  ${cr ? `<p class="hint rp-cmpnote" style="margin:-8px 0 14px">Vergleich mit ${cmpLabel}</p>` : ''}
  <section class="panel"><div class="panel-h"><h2>Umsatz im Zeitverlauf</h2><span class="legend">${cmp?'<i class="lg-c"></i>Vergleich':''}<i class="lg-b"></i>Umsatz netto</span></div>${chartSvg(r.from, to, cur, cr, cmp)}</section>
  ${itemTable(cur, cmp)}
  <div class="rp-grid">${topFlop(cur, 'q', 'Renner und Ladenhüter', 'nach Portionen')}${topFlop(cur, 'rg', 'Größter Rohertrag', 'nach Euro')}</div>
  <div class="rp-grid">
    ${wasteBlock(r.from, to, cur)}
    <section class="panel"><div class="panel-h"><h2>Wochentage</h2><span class="muted sm">Ø Umsatz netto je Verkaufstag</span></div>${weekdaySvg(cur)}</section>
  </div>
  ${specialsBlock(r.from, to, cur)}
  ${dDiff(r.from, to) > 62 ? monthTable(r.from, to) : ''}
  ${more}
  <p class="hint">Interne Auswertung. Maßgeblich für Steuer und Buchhaltung sind die Daten der Registrierkasse (RKSV/DEP). Netto: Speisen 10 %, Getränke 20 % MwSt.</p>`;
  return h;
}
function buckets(from, to){
  const n = dDiff(from, to) + 1; const out = [];
  if(n <= 31){ for(let s = from; s <= to; s = dAdd(s,1)) out.push({from:s, to:s, label: dParse(s).getDate()+'.', tip: fmtDate(s+'T12:00:00')}); return {g:'Tag', out}; }
  if(n <= 186){ let s = dAdd(from, -((dParse(from).getDay()+6)%7)); while(s <= to){ const e = dAdd(s,6); out.push({from:s < from ? from : s, to:e > to ? to : e, label:'KW '+isoWeek(s)[1], tip:`${fmtShort(s)}–${fmtShort(e)}`}); s = dAdd(s,7); } return {g:'Woche', out}; }
  let d = dParse(from); d = new Date(d.getFullYear(), d.getMonth(), 1, 12);
  while(isoDate(d) <= to){ const f = isoDate(d), e = isoDate(new Date(d.getFullYear(), d.getMonth()+1, 0, 12)); out.push({from:f < from ? from : f, to:e > to ? to : e, label:MONTHS[d.getMonth()].slice(0,3), tip:`${MONTHS[d.getMonth()]} ${d.getFullYear()}`}); d = new Date(d.getFullYear(), d.getMonth()+1, 1, 12); }
  return {g:'Monat', out};
}
function netOfDays(days, from, to){ let s = 0; for(const [d, rows] of Object.entries(S.salesDays||{})){ if(d < from || d > to) continue; for(const [mid,,g] of rows){ const m = S.menu.find(x=>x.id===mid); s += g/(1+vatOf(m)/100); } } return s; }
function chartSvg(from, to, cur, cr, cmp){
  const {g, out} = buckets(from, to); const vals = out.map(b => netOfDays(null, b.from, b.to));
  const off = cr ? dDiff(cr.from, from) : 0;
  const cv = cr ? out.map(b => netOfDays(null, dAdd(b.from,-off), dAdd(b.to,-off))) : null;
  const max = Math.max(1, ...vals, ...(cv||[0])); const step = niceStep(max/3); const top = Math.ceil(max/step)*step;
  const W = 1000, H = 230, L = 56, R = 8, T = 10, B = 28, bw = (W-L-R)/out.length;
  const y = v => T + (H-T-B) * (1 - v/top);
  let s = `<svg class="rp-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Umsatz netto je ${g}">`;
  for(let v = 0; v <= top + 1e-6; v += step) s += `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${L-8}" y="${y(v)+4}" class="ax" text-anchor="end">${v >= 1000 ? num(v/1000,1)+' k' : num(v)}</text>`;
  out.forEach((b,i) => { const x = L + i*bw; const v = vals[i]; const hh = Math.max(0, H-B-y(v)); s += `<rect x="${x+bw*.14}" y="${y(v)}" width="${Math.max(1,bw*.72)}" height="${hh}" class="bar"><title>${esc(b.tip)}: ${eur(v)}</title></rect>`;
    if(out.length <= 16 || i % Math.ceil(out.length/14) === 0) s += `<text x="${x+bw/2}" y="${H-9}" class="ax" text-anchor="middle">${esc(b.label)}</text>`; });
  if(cv) s += `<polyline class="cl" points="${cv.map((v,i)=>`${L+i*bw+bw/2},${y(v)}`).join(' ')}"/>`;
  return s + '</svg>';
}
function niceStep(x){ const p = Math.pow(10, Math.floor(Math.log10(Math.max(x,1)))); const f = x/p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
function itemTable(cur, cmp){
  const chip = view.rp.chip; const cq = cmp ? new Map(cmp.rows.map(r=>[r.mid, r.q])) : null;
  let rows = cur.rows;
  if(chip === 'norec') rows = rows.filter(r => r.we == null);
  let unsold = [];
  if(chip === 'unsold'){ const sold = new Set(cur.rows.map(r=>r.mid)); unsold = S.menu.filter(m => !m.hidden && !sold.has(m.id)); }
  const get = {name:r=>r.name, q:r=>r.q, share:r=>r.q, gross:r=>r.g, net:r=>r.n, avg:r=>r.avg, we:r=>r.we, fc:r=>r.fc, rg:r=>r.rg, d:r=>cq ? delta(r.q, cq.get(r.mid)||0) : null};
  const f = get[RSORT.col] || get.gross; rows = [...rows].sort((a,b) => { const x = f(a), y = f(b); return (typeof x === 'string' ? x.localeCompare(y,'de') : ((x??-1e12) - (y??-1e12))) * RSORT.dir; });
  const th = (c, l, cls='r') => `<th class="${cls}"><button type="button" class="${RSORT.col===c&&!RSORT.def?'on':''}" data-act="rpSort" data-id="${c}">${l}${RSORT.col===c&&!RSORT.def?(RSORT.dir>0?' ↑':' ↓'):''}</button></th>`;
  const tr = r => `<tr class="row" data-act="${r.m && r.m.card ? 'openCard' : 'editMenu'}" data-id="${r.m ? (r.m.card || r.m.id) : ''}">
    <td><div class="lt-n"><span><b>${esc(r.name)}</b>${!view.rp.grouped?`<small>${esc(r.section)}</small>`:''}</span></div></td>
    <td class="r"><b>${num(r.q)}</b></td><td class="r hide-m lt-muted c-x1">${num(cur.qty ? r.q/cur.qty*100 : 0,1)} %</td>
    <td class="r hide-m c-x2">${eur(r.g)}</td><td class="r rp-net">${eur(r.n)}</td><td class="r hide-m lt-muted c-x1">${eur(r.avg)}</td>
    <td class="r hide-m">${r.we!=null?eur(r.we):'<span class="lt-st"><span class="bad">keine Rezeptur</span></span>'}</td>
    <td class="r">${r.fc!=null?`<span class="lt-fc ${fcClass(r.fc)}"><i></i>${num(r.fc,1)} %</span>`:'<span class="lt-muted">—</span>'}</td>
    <td class="r hide-m">${r.rg!=null?eur(r.rg):'<span class="lt-muted">—</span>'}</td>
    ${cq?`<td class="r rp-dq">${dPill(delta(r.q, cq.get(r.mid)||0))}</td>`:''}</tr>`;
  let body = '';
  if(chip === 'unsold') body = unsold.map(m => `<tr class="row" data-act="editMenu" data-id="${m.id}"><td><div class="lt-n"><span><b>${esc(dishLabel(m))}</b><small>${esc(m.section)}</small></span></div></td><td class="r">0</td><td colspan="${cq?8:7}" class="lt-muted">Im Zeitraum nicht verkauft${m.seasons&&m.seasons.length?' · Saison: '+m.seasons.map(seasonName).join(', '):''}</td></tr>`).join('') || '<tr><td colspan="9" class="lt-muted">Jedes Gericht wurde mindestens einmal verkauft.</td></tr>';
  else if(view.rp.grouped){ for(const s of secList()){ const list = rows.filter(r=>r.section===s); if(!list.length) continue; const sq = list.reduce((a,r)=>a+r.q,0), sn = list.reduce((a,r)=>a+r.n,0); body += `<tr class="grp"><td colspan="${cq?10:9}">${esc(s)}<small>${num(sq)} Portionen · ${eur(sn)} netto</small></td></tr>` + list.map(tr).join(''); } const rest = rows.filter(r=>!secList().includes(r.section)); if(rest.length) body += `<tr class="grp"><td colspan="${cq?10:9}">Sonstige</td></tr>` + rest.map(tr).join(''); }
  else body = rows.map(tr).join('');
  const chipB = (k,l,n) => `<button type="button" class="chip ${chip===k?'on':''}" data-act="rpChip" data-id="${k}">${l}${n!=null?`<small>${n}</small>`:''}</button>`;
  return `<h2 class="sec-h">Artikel</h2>
  <div class="toolbar">${chipB('all','Alle',cur.rows.length)}${chipB('norec','Ohne Rezeptur',cur.rows.filter(r=>r.we==null).length)}${chipB('unsold','Ohne Verkauf')}<span class="sp"></span><label class="tog"><input type="checkbox" data-rpg="1" ${view.rp.grouped?'checked':''}><span></span>Nach Kategorie gruppieren</label></div>
  <div class="lt-wrap"><table class="lt rp-items"><thead><tr>${th('name','Gericht','')}${th('q','Menge')}${th('share','Anteil','r hide-m c-x1')}${th('gross','Umsatz brutto','r hide-m c-x2')}${th('net','Umsatz netto','r rp-net')}${th('avg','Ø Preis','r hide-m c-x1')}${th('we','Wareneinsatz','r hide-m')}${th('fc','in %')}${th('rg','Rohertrag','r hide-m')}${cq?th('d','Δ Menge','r rp-dq'):''}</tr></thead>
  <tbody>${body}</tbody>
  <tfoot><tr><td>Summe</td><td class="r">${num(cur.qty)}</td><td class="hide-m c-x1"></td><td class="r hide-m c-x2">${eur(cur.gross)}</td><td class="r rp-net">${eur(cur.net)}</td><td class="hide-m c-x1"></td><td class="r hide-m">${eur(cur.we)}</td><td class="r">${cur.fc!=null?num(cur.fc,1)+' %':'—'}</td><td class="r hide-m">${eur(cur.rg)}</td>${cq?'<td class="rp-dq"></td>':''}</tr></tfoot></table></div>
  <p class="hint">Wareneinsatz-Abdeckung: ${num(cur.cover,0)} % des Umsatzes (Gerichte mit Rezeptur). Spaltenkopf antippen zum Sortieren.</p>`;
}
function weekdaySvg(cur){
  const sum = Array(7).fill(0), cnt = Array(7).fill(0);
  for(const [d] of Object.entries(cur.days)){ const w = (dParse(d).getDay()+6)%7; cnt[w]++; sum[w] += netOfDays(null, d, d); }
  const avg = sum.map((s,i)=>cnt[i] ? s/cnt[i] : 0); const max = Math.max(1, ...avg);
  const names = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const W = 420, H = 220, B = 26, T = 18, bw = W/7;
  let s = `<svg class="rp-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Umsatz je Wochentag">`;
  avg.forEach((v,i) => { const hh = (H-B-T)*v/max; const closed = !cnt[i]; s += closed ? `<rect x="${i*bw+bw*.18}" y="${H-B-14}" width="${bw*.64}" height="14" class="hatch"/><text x="${i*bw+bw/2}" y="${H-B-20}" class="ax" text-anchor="middle">Ruhetag</text>` : `<rect x="${i*bw+bw*.18}" y="${H-B-hh}" width="${bw*.64}" height="${hh}" class="bar"><title>${names[i]}: Ø ${eur(v)} an ${cnt[i]} Tagen</title></rect><text x="${i*bw+bw/2}" y="${H-B-hh-6}" class="ax" text-anchor="middle">${v>=1000?num(v/1000,1)+' k':num(v)}</text>`; s += `<text x="${i*bw+bw/2}" y="${H-8}" class="ax" text-anchor="middle">${names[i]}</text>`; });
  return s + '</svg>';
}
function topFlop(cur, k, title, by){
  const list = cur.rows.filter(r => k === 'q' || r.rg != null).sort((a,b)=>(b[k]||0)-(a[k]||0));
  const top = list.slice(0,10), flop = list.slice(-5).reverse();
  const li = r => `<li><span>${esc(r.name)}</span><b class="mono">${k==='q' ? num(r.q) : eur(r.rg)}</b></li>`;
  return `<section class="panel"><div class="panel-h"><h2>${title}</h2><span class="muted sm">${by} · beste 10, schwächste 5</span></div><ol class="rp-top">${top.map(li).join('')}</ol><div class="rp-flop-h">Am schwächsten</div><ol class="rp-top flop">${flop.map(li).join('')}</ol></section>`;
}
function specialsBlock(from, to, cur){
  const sps = (S.specials||[]).filter(sp => sp.from <= to && (sp.to||sp.from) >= from); if(!sps.length) return '';
  const avgW = Array(7).fill(0), cW = Array(7).fill(0);
  for(const d of Object.keys(cur.days)){ const w = dParse(d).getDay(); avgW[w] += netOfDays(null,d,d); cW[w]++; }
  return `<section class="panel"><div class="panel-h"><h2>Aktionen</h2><span class="muted sm">Umsatz an Aktionstagen gegenüber gleichen Wochentagen</span></div><div class="lt-wrap flat"><table class="lt"><thead><tr><th>Aktion</th><th>Datum</th><th class="r">Umsatz netto</th><th class="r">Ø gleicher Wochentag</th><th class="r">Mehrumsatz</th></tr></thead><tbody>
  ${sps.map(sp => { let n = 0, base = 0, k = 0; for(let d = sp.from; d <= (sp.to||sp.from); d = dAdd(d,1)){ if(d < from || d > to) continue; n += netOfDays(null,d,d); const w = dParse(d).getDay(); if(cW[w]){ base += avgW[w]/cW[w]; k++; } } return `<tr><td><b>${esc(sp.name)}</b></td><td class="lt-muted">${fmtRange(sp)}</td><td class="r">${eur(n)}</td><td class="r lt-muted">${eur(base)}</td><td class="r">${dPill(base ? (n/base-1)*100 : null)}</td></tr>`; }).join('')}
  </tbody></table></div><p class="hint">Umsätze der Aktionsgerichte selbst erscheinen, sobald sie in der Kasse als eigene Artikel geführt und zugeordnet sind.</p></section>`;
}
function monthTable(from, to){
  const {out} = (() => { let d = dParse(from); d = new Date(d.getFullYear(), d.getMonth(), 1, 12); const o = []; while(isoDate(d) <= to){ const f = isoDate(d), e = isoDate(new Date(d.getFullYear(), d.getMonth()+1, 0, 12)); o.push({from:f<from?from:f, to:e>to?to:e, label:`${MONTHS[d.getMonth()]} ${d.getFullYear()}`}); d = new Date(d.getFullYear(), d.getMonth()+1, 1, 12); } return {out:o}; })();
  let tq = 0, tg = 0, t10 = 0, t20 = 0, tw = 0, tr = 0;
  const rows = out.map(b => { const rp = report(b.from, b.to); let n10 = 0, n20 = 0; rp.rows.forEach(r => { if(vatOf(r.m) === 20) n20 += r.n; else n10 += r.n; }); tq += rp.qty; tg += rp.gross; t10 += n10; t20 += n20; tw += rp.we; tr += rp.rg;
    return `<tr><td>${b.label}</td><td class="r">${num(rp.qty)}</td><td class="r">${eur(rp.gross)}</td><td class="r">${eur(n10)}</td><td class="r hide-m">${eur(n20)}</td><td class="r hide-m">${eur(rp.we)}</td><td class="r hide-m">${eur(rp.rg)}</td></tr>`; }).join('');
  return `<section class="panel flush"><div class="panel-h pad"><h2>Monatsübersicht</h2><span class="muted sm">für Jahresbericht und Steuerberatung</span></div><div class="lt-wrap flat"><table class="lt"><thead><tr><th>Monat</th><th class="r">Portionen</th><th class="r">Umsatz brutto</th><th class="r">netto 10 %</th><th class="r hide-m">netto 20 %</th><th class="r hide-m">Wareneinsatz</th><th class="r hide-m">Rohertrag</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td>Summe</td><td class="r">${num(tq)}</td><td class="r">${eur(tg)}</td><td class="r">${eur(t10)}</td><td class="r hide-m">${eur(t20)}</td><td class="r hide-m">${eur(tw)}</td><td class="r hide-m">${eur(tr)}</td></tr></tfoot></table></div></section>`;
}

/* ---------- Import ---------- */
const SAMPLE_CSV = 'Datum;Artikelnr;Artikel;Menge;Umsatz brutto\n09.11.2026;1001;Wiener Schnitzel vom Schwein;14;292,60\n09.11.2026;1002;Wiener Schnitzel vom Kalb;6;173,40\n09.11.2026;2010;Flammkuchen Elsässer;11;152,90\n09.11.2026;3005;Kaiserschmarrn;9;142,20\n09.11.2026;9001;Gutschein;1;0,00\n09.11.2026;4410;Hüttenteller Spezial;3;59,70';
function importView(){
  const res = view.rpImport;
  const log = (S.salesImports||[]).slice(0,8);
  return `<div class="grid2"><div class="col">
    <section class="panel"><div class="panel-h"><h2>Artikelumsätze aus der Kasse laden</h2></div>
      <p class="hint" style="margin-top:0">Exportieren Sie im Kassen-Backoffice den Bericht <b>Artikelumsatz</b> (auch: Artikelstatistik, Verkaufsbericht pro Artikel) für einen Zeitraum, als CSV oder Excel. Die App erkennt die Spalten Datum, Artikelnummer, Artikel, Menge und Umsatz selbst.</p>
      <div class="row-btns"><button type="button" class="btn primary" data-act="rpFile">${ico('plus')}Datei wählen (CSV, Excel)</button><button type="button" class="btn" data-act="rpSample">Beispiel einfügen</button><input id="rpFileIn" type="file" accept=".csv,.txt,.tsv,.xlsx,.xls,text/csv" hidden></div>
      <label class="f" style="margin-top:12px">oder Inhalt einfügen<textarea id="rpPaste" class="code" rows="6" placeholder="Datum;Artikelnr;Artikel;Menge;Umsatz">${esc(view.rpPasteText||'')}</textarea></label>
      <div class="row-btns" style="margin-top:8px"><button type="button" class="btn" data-act="rpAnalyse">Prüfen</button></div>
      <p class="hint" id="rpErr" role="alert">${esc(view.rpErr||'')}</p>
    </section>
    ${res ? `<section class="panel accent"><div class="panel-h"><h2>Vorschau</h2><span class="muted sm">${res.lines.length} Zeilen</span></div>
      <div class="kv"><span>Zeitraum</span><span>${res.range}</span><span>Tage</span><span>${res.days}</span><span>Portionen</span><span>${num(res.q)}</span><span>Umsatz brutto</span><span>${eur(res.g)}</span><span>Zugeordnet</span><span>${num(res.mappedPct,0)} % des Umsatzes</span><span>Nicht zugeordnet</span><span>${res.unknown.length} Kassenartikel</span>${res.skipped?`<span>Übersprungen</span><span>${res.skipped} Zeilen (ohne Datum oder Menge)</span>`:''}</div>
      ${res.unknown.length ? `<p class="hint">Nicht zugeordnete Artikel werden gemerkt und können danach unter „Zuordnung“ einem Gericht zugewiesen werden, auch rückwirkend.</p>` : ''}
      <div class="togs" style="margin-top:10px;flex-direction:column;align-items:flex-start"><label class="tog"><input type="checkbox" id="rpReplace" checked><span></span>Vorhandene Tage im Zeitraum ersetzen (kein Doppelzählen)</label><label class="tog"><input type="checkbox" id="rpStock"><span></span>Zutaten laut Rezeptur vom Lager abbuchen</label></div>
      <div class="row-btns" style="margin-top:12px"><button type="button" class="btn primary" data-act="rpImport">Importieren</button><button type="button" class="btn" data-act="rpDiscard">Verwerfen</button></div>
    </section>` : ''}
  </div><div class="col">
    <section class="panel"><div class="panel-h"><h2>Kassen und ihre Exporte</h2></div>
      <ul class="rp-pos">
        <li><b>ready2order</b><span>Backoffice → Berichte → Artikel → Export CSV. Später auch automatisch über die Schnittstelle (API-Freigabe im Admin).</span></li>
        <li><b>orderbird</b><span>MY orderbird → Berichte → Artikelbericht → CSV per E-Mail.</span></li>
        <li><b>Vectron</b><span>myVectron → Auswertungen → Artikel → Export. Automatik mit dem Modul „BI-Schnittstelle“.</span></li>
        <li><b>SumUp / Lightspeed</b><span>Backoffice → Verkäufe nach Artikel → Export. Beide haben eine Schnittstelle für die Automatik.</span></li>
        <li><b>Andere Kassen</b><span>Beim Kassenhändler nach „Artikelumsatz als CSV“ fragen.</span></li>
      </ul>
      <p class="hint">Der gesetzliche RKSV-Export (DEP7) enthält nur Belegsummen je Steuersatz, keine einzelnen Gerichte. Für die Auswertung braucht es den Artikelbericht.</p></section>
    <section class="panel"><div class="panel-h"><h2>Importprotokoll</h2></div>
      ${log.length ? `<ul class="todo">${log.map(l=>`<li><div class="inv-h"><span><b>${fmtDate(l.date)}</b><small class="muted">${esc(l.by||'')}${l.stock?' · Lager abgebucht':''}</small></span><span class="r"><b class="mono">${plural(l.days,'Tag','Tage')}</b><small class="mono">${plural(l.portions,'Portion','Portionen')}</small></span></div></li>`).join('')}</ul>` : '<p class="hint">Noch kein Import.</p>'}
      ${S.salesDemo ? `<div class="row-btns" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="rpDemoDel">Beispielverkäufe löschen</button></div>` : ''}
    </section>
  </div></div>`;
}
function mapView(){
  const un = Object.entries(S.salesUnmapped||{}).sort((a,b)=>b[1].g-a[1].g);
  const maps = Object.entries(S.posMap||{});
  const opts = sel => `<option value="">— wählen —</option><option value="-" ${sel==='-'?'selected':''}>Ignorieren (Gutschein, Pfand, Trinkgeld …)</option>${menuSorted().map(m=>`<option value="${m.id}" ${sel===m.id?'selected':''}>${esc(dishLabel(m))} — ${esc(m.section)}</option>`).join('')}`;
  return `<section class="panel flush"><div class="panel-h pad"><h2>Nicht zugeordnete Kassenartikel</h2><span class="muted sm">${un.length}</span></div>
    ${un.length ? `<div class="lt-wrap flat"><table class="lt"><thead><tr><th>Kassenartikel</th><th class="r">Menge</th><th class="r">Umsatz</th><th class="hide-m">Zuletzt</th><th>Gericht in der App</th></tr></thead><tbody>
    ${un.map(([k,u]) => { const sug = autoMatch(u.name); const last = Object.keys(u.days||{}).sort().pop(); return `<tr><td><b>${esc(u.name)}</b>${u.art?`<small class="lt-muted"> · Nr. ${esc(u.art)}</small>`:''}</td><td class="r">${num(u.q)}</td><td class="r">${eur(u.g)}</td><td class="hide-m lt-muted">${last?fmtDate(last+'T12:00:00'):''}</td><td><select class="sm-sel" data-pmap="${esc(k)}" aria-label="Gericht für ${esc(u.name)}">${opts(sug ? sug.id : '')}</select>${sug?` <button type="button" class="btn sm" data-act="pmapOk" data-id="${esc(k)}:${sug.id}">Vorschlag übernehmen</button>`:''}</td></tr>`; }).join('')}
    </tbody></table></div>` : '<p class="hint pad-x pad-b">Alle Kassenartikel sind zugeordnet.</p>'}
  </section>
  <section class="panel flush" style="margin-top:18px"><div class="panel-h pad"><h2>Gespeicherte Zuordnungen</h2><span class="muted sm">${maps.length}</span></div>
    ${maps.length ? `<div class="lt-wrap flat"><table class="lt"><thead><tr><th>Kassenartikel</th><th>Gericht</th><th></th></tr></thead><tbody>${maps.map(([k,mid]) => { const m = S.menu.find(x=>x.id===mid); return `<tr><td>${esc(k.replace(/^[an]:/,''))}</td><td>${mid==='-'?'<span class="lt-muted">ignoriert</span>':esc(m?dishLabel(m):'gelöscht')}</td><td class="r"><button type="button" class="icon-btn" data-act="pmapDel" data-id="${esc(k)}" aria-label="Zuordnung lösen">${ico('x')}</button></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="hint pad-x pad-b">Zuordnungen entstehen beim Import automatisch (gleicher Name) oder hier von Hand. Sie gelten für alle künftigen Importe.</p>'}
  </section>`;
}
function analyseText(text){
  const a = importAnalyse(text); const dates = a.lines.map(l=>l.date).sort();
  let g = 0, gm = 0, q = 0; a.lines.forEach(l => { g += l.g; q += l.q; if(l.mid || S.posMap[l.key]) gm += l.g; });
  return {...a, text, days:new Set(dates).size, range: dates.length ? `${fmtDate(dates[0]+'T12:00:00')} – ${fmtDate(dates[dates.length-1]+'T12:00:00')}` : '—', g, q, mappedPct: g ? gm/g*100 : 0};
}
function doImport(res, replace, stock){
  // automatische Treffer merken
  res.lines.forEach(l => { if(l.mid && S.posMap[l.key] === undefined) S.posMap[l.key] = l.mid; });
  if(replace){ const ds = new Set(res.lines.map(l=>l.date)); ds.forEach(d => { delete S.salesDays[d]; Object.values(S.salesUnmapped||{}).forEach(u => { if(u.days) delete u.days[d]; }); });
    // Summen der nicht zugeordneten Artikel aus den verbliebenen Tagen neu rechnen (sonst zählt ein zweiter Import doppelt)
    Object.entries(S.salesUnmapped||{}).forEach(([k,u]) => { const ds = Object.values(u.days||{}); u.q = ds.reduce((a,v)=>a+v[0],0); u.g = Math.round(ds.reduce((a,v)=>a+v[1],0)*100)/100; if(!ds.length) delete S.salesUnmapped[k]; }); }
  const out = importApply(res, {replace:false, stock});
  S.salesUnmapped = S.salesUnmapped || {};
  res.lines.forEach(l => { if(S.posMap[l.key]) return; const u = S.salesUnmapped[l.key] = S.salesUnmapped[l.key] || {name:l.name, art:l.art, q:0, g:0, days:{}}; u.q += l.q; u.g += l.g; const dd = u.days[l.date] = u.days[l.date] || [0,0]; dd[0] += l.q; dd[1] += l.g; });
  return out;
}
function applyMapping(key, mid){
  S.posMap[key] = mid; const u = (S.salesUnmapped||{})[key]; if(!u) return;
  if(mid && mid !== '-') for(const [d,[q,g]] of Object.entries(u.days||{})){ const rows = S.salesDays[d] = S.salesDays[d] || []; const r = rows.find(x=>x[0]===mid); if(r){ r[1] += q; r[2] = Math.round((r[2]+g)*100)/100; } else rows.push([mid, q, Math.round(g*100)/100]); }
  delete S.salesUnmapped[key];
}
async function readFileAsCsv(file){
  if(/\.xlsx?$/i.test(file.name)){
    if(!window.XLSX){ try { await loadLib(XLSX_LIB); } catch(e){ throw new Error('Excel-Leser konnte nicht geladen werden. Bitte die Datei als CSV speichern.'); } }
    const wb = XLSX.read(await file.arrayBuffer(), {type:'array'}); return XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], {FS:';'});
  }
  return await file.text();
}
/* Bericht: derselbe Inhalt wie am Bildschirm, ohne Bedienelemente */
function rpPrint(){ const rp = view.rp; const r = rpRange(rp); $('#print').innerHTML = `<div class="rp-print"><div class="meta"><span>${esc(S.settings.name)}</span><span>Erstellt ${fmtDate(new Date().toISOString())}</span></div><h1>Auswertung · ${esc(r.label)}</h1>${$('#app').innerHTML.replace(/<section class="panel rp-period">[\s\S]*?<\/section>/,'').replace(/<details class="more"[\s\S]*?<\/details>/g,'').replace(/<div class="page-h">[\s\S]*?<\/div><\/div>/,'').replace(/<div class="toolbar tabs">[\s\S]*?<\/div><\/div>/,'')}</div>`; document.body.classList.remove('print-menu'); document.body.classList.add('print-report'); window.print(); setTimeout(()=>document.body.classList.remove('print-report'), 500); }
function rpCsvText(){
  const r = rpRange(view.rp); const to = r.to > isoDate(new Date()) ? isoDate(new Date()) : r.to; const cur = report(r.from, to);
  const f2 = n => n == null ? '' : (Math.round(n*100)/100).toFixed(2).replace('.', ',');
  const lines = ['Gericht;Kategorie;Menge;Umsatz brutto;Umsatz netto;Ø Preis;Wareneinsatz;Wareneinsatz %;Rohertrag'];
  cur.rows.sort((a,b)=>secList().indexOf(a.section)-secList().indexOf(b.section) || b.g-a.g).forEach(x => lines.push([x.name, x.section, String(x.q).replace('.',','), f2(x.g), f2(x.n), f2(x.avg), f2(x.we), x.fc!=null?f2(x.fc):'', f2(x.rg)].map(v => /[;"\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v).join(';')));
  lines.push(['Summe','',String(cur.qty).replace('.',','), f2(cur.gross), f2(cur.net), '', f2(cur.we), cur.fc!=null?f2(cur.fc):'', f2(cur.rg)].join(';'));
  return {text:'﻿'+lines.join('\r\n'), name:`DAHUAM202_Auswertung_${r.from}_${to}.csv`};
}

/* ---------- Ereignisse ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id; const rp = view.rp;
  switch(el.dataset.act){
    case 'rpTab': rp.tab = id; if(view.tab !== 'report') go('report'); else render(); break;
    case 'rpUnit': rp.unit = id; rp.jumped = false; if(id==='custom' && !rp.from){ const r = rpRange({...rp, unit:'month'}); rp.from = r.from; rp.to = r.to; } render(); break;
    case 'rpStep': rpStep(+id); rp.auto = true; rp.jumped = false; render(); break;
    case 'rpToday': rp.ref = isoDate(new Date()); rp.auto = true; rp.jumped = false; render(); break;
    case 'rpCmp': rp.cmp = id; render(); break;
    case 'rpChip': rp.chip = id; render(); break;
    case 'rpSort': if(RSORT.col === id && !RSORT.def){ if(!RSORT.flip){ RSORT.dir *= -1; RSORT.flip = 1; } else Object.assign(RSORT, {col:'gross', dir:-1, flip:0, def:1}); } else Object.assign(RSORT, {col:id, dir: id==='name' ? 1 : -1, flip:0, def:0}); render(); break;
    case 'rpFile': $('#rpFileIn').click(); break;
    case 'rpSample': view.rpPasteText = SAMPLE_CSV; view.rpErr = ''; render(); break;
    case 'rpAnalyse': { const t = $('#rpPaste').value; view.rpPasteText = t; try { view.rpImport = analyseText(t); view.rpErr = ''; } catch(x){ view.rpImport = null; view.rpErr = x.message; } render(); break; }
    case 'rpDiscard': view.rpImport = null; render(); break;
    case 'rpImport': { const res = view.rpImport; if(!res) break; const replace = $('#rpReplace').checked, stock = $('#rpStock').checked;
      const run = (delDemo) => { let nDemo = 0; if(delDemo) nDemo = clearDemoSales(); const out = doImport(res, replace, stock); view.rpImport = null; view.rpPasteText = ''; save(); rp.tab = Object.keys(S.salesUnmapped).length ? 'map' : 'sales'; const ds = res.lines.map(l=>l.date).sort(); if(ds.length){ rp.unit = 'custom'; rp.from = ds[0]; rp.to = ds[ds.length-1]; rp.auto = true; rp.jumped = false; } run.msg = `${plural(out.days,'Tag','Tage')}, ${plural(Math.round(out.portions),'Portion','Portionen')} importiert` + (nDemo ? ` · ${plural(nDemo,'Tag','Tage')} mit Beispielverkäufen entfernt` : ''); };
      const days = [...new Set(res.lines.map(l=>l.date))]; const nDemo = S.salesDemo ? demoSalesDays().length : 0; const over = replace ? days.filter(d => (S.salesReal||{})[d] && S.salesDays[d]).length : 0;
      let short = 0; if(stock){ const acc = new Map(); res.lines.forEach(l => { const mid = S.posMap[l.key] !== undefined ? S.posMap[l.key] : l.mid; const m = mid && mid !== '-' && S.menu.find(x=>x.id===mid); const c = m && m.card && C(m.card); if(c) explode(c, l.q, acc); }); acc.forEach((q,pid) => { const p = P(pid); if(p && q > (+p.stock||0) + 1e-9) short++; }); }
      if(!nDemo && !over && !short){ run(false); render(); toast(run.msg); break; }
      openDialog('Kassendaten importieren?', `<p class="dlg-p">Der Import enthält ${plural(days.length,'Verkaufstag','Verkaufstage')}.${over ? ` <b>${plural(over,'bereits gespeicherter Tag wird','bereits gespeicherte Tage werden')} ersetzt.</b>` : ''}</p>
        ${short ? `<div class="warn-box dlg-warn" role="alert">${ico('spark')}<span><b>Bestand reicht nicht für ${plural(short,'Artikel','Artikel')}.</b> Beim Abbuchen gehen diese Bestände ins Minus. Fehlt ein Wareneingang?</span></div>` : ''}
        ${nDemo ? demoSalesAskHtml() : ''}`,
        fd => { run(nDemo > 0 && fd.get('demoSales') === 'del'); }, {ok: short ? 'Trotzdem buchen' : 'Importieren', done:()=>run.msg}); break; }
    case 'rpDemoDel': { const n = demoSalesDays().length; ask(`${plural(n,'Tag','Tage')} mit Beispielverkäufen löschen? Echte Importe und Buchungen bleiben erhalten.`, () => { clearDemoSales(); }, 'Löschen'); break; }
    case 'pmapOk': { const [k, mid] = id.split(/:(?=[^:]+$)/); applyMapping(k, mid); save(); render(); toast('Zugeordnet, auch rückwirkend'); break; }
    case 'pmapDel': delete S.posMap[id]; save(); render(); break;
    case 'rpCsv': { const {text, name} = rpCsvText(); if(!FRAMED){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})); a.download = name; a.click(); toast(name+' gespeichert'); } else openDialog('Als CSV speichern', `<p class="dlg-p">Text kopieren und als <b>${esc(name)}</b> speichern; Excel öffnet die Datei direkt.</p><textarea class="code" readonly id="rpCsvTxt">${esc(text)}</textarea><div class="row-btns"><button type="button" class="btn" id="rpCsvCopy">${ico('copy')}Kopieren</button></div>`, null, {cancel:'Schließen', after:()=>{ $('#rpCsvCopy').onclick = () => navigator.clipboard?.writeText(text).then(()=>toast('Kopiert'), ()=>$('#rpCsvTxt').select()); }}); break; }
    case 'rpPrint': rpPrint(); break;
  }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if(t.dataset.rpd){ view.rp[t.dataset.rpd] = t.value; render(); }
  if(t.dataset.rpg){ view.rp.grouped = t.checked; render(); }
  if(t.dataset.pmap){ if(t.value){ applyMapping(t.dataset.pmap, t.value); save(); render(); toast(t.value==='-' ? 'Wird künftig ignoriert' : 'Zugeordnet, auch rückwirkend'); } }
  if(t.id === 'rpFileIn' && t.files[0]){ try { const txt = await readFileAsCsv(t.files[0]); view.rpPasteText = txt.length > 200000 ? txt.slice(0,200000) : txt; view.rpImport = analyseText(txt); view.rpErr = ''; } catch(x){ view.rpImport = null; view.rpErr = x.message || 'Datei nicht lesbar.'; } t.value = ''; render(); }
});
