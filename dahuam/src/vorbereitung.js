/* =====================================================================
   Vorbereitung: Was brauche ich heute, was morgen?
   Prognose je Gericht aus den Verkäufen, daraus Basisrezepte in Chargen,
   Zutaten gegen den Lagerstand und eine Prep-Liste zum Abhaken.
   Eigener Zustand: S.plan (je Datum: Korrekturen, Tagesfaktor, Häkchen).
   ===================================================================== */

/* ---------- Zustand S.plan: Prognose-Korrekturen, Tagesfaktor und Häkchen, je Datum ---------- */
function plusMigrate(d){
  if(!d || typeof d !== 'object') return d;
  if(!d.plan || typeof d.plan !== 'object' || Array.isArray(d.plan)) d.plan = {};
  const p = d.plan;
  ['ov','fac','chk'].forEach(k => { if(!p[k] || typeof p[k] !== 'object' || Array.isArray(p[k])) p[k] = {}; });
  // alte Tage aufräumen: Korrekturen und Häkchen sind nach drei Wochen nichts mehr wert
  const cut = dAdd(isoDate(new Date()), -21);
  ['ov','fac','chk'].forEach(k => Object.keys(p[k]).forEach(day => { if(!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < cut) delete p[k][day]; }));
  // Beispieldaten: Salz, Gewürze, Öl sind Grundzutaten und stehen nicht auf der Prep-Liste
  if(d.demo) (d.products || []).forEach(x => { if(x && x.basic === undefined && PL_BASIC.includes(x.id)) x.basic = true; });
  return d;
}
function planState(){ if(!S.plan || !S.plan.ov || !S.plan.chk || !S.plan.fac) plusMigrate(S); return S.plan; }

/* ---------- Zwischenspeicher: gilt, bis gespeichert wird oder die Daten ersetzt werden ---------- */
const PLC = {S:null, m:new Map()};
function plCache(key, fn){
  if(PLC.S !== S){ PLC.S = S; PLC.m.clear(); }
  if(PLC.m.has(key)) return PLC.m.get(key);
  const v = fn(); PLC.m.set(key, v); return v;
}
const _savePlus = save;
save = function(){ PLC.m.clear(); _savePlus(); };

/* ---------- Verkaufstage: sortiert, mit Wochentag, Saison und Tagesmenge ---------- */
function plIdx(){
  return plCache('idx', () => {
    const sd = S.salesDays || {}; const days = Object.keys(sd).filter(d => Array.isArray(sd[d]) && sd[d].length).sort();
    const tot = {}, wdOf = {}, seaOf = {};
    days.forEach(d => { let t = 0; for(const r of sd[d]) t += +r[1] || 0; tot[d] = t; wdOf[d] = dParse(d).getDay(); seaOf[d] = seasonFor(d); });
    return {days, tot, wdOf, seaOf, maps:{}};
  });
}
function plDayMap(d){ const ix = plIdx(); if(!ix.maps[d]){ const mp = new Map(); for(const r of (S.salesDays[d] || [])) mp.set(r[0], (mp.get(r[0]) || 0) + (+r[1] || 0)); ix.maps[d] = mp; } return ix.maps[d]; }
/* Steht das Gericht an einem Tag mit dieser Saison und diesem Wochentag auf der Karte? */
function plAvail(m, sea, w){ return (!m.seasons || !m.seasons.length || !sea || m.seasons.includes(sea)) && (!m.days || !m.days.length || m.days.includes(w)); }
function plShortDate(d){ const [y,m,dd] = d.split('-'); return `${dd}.${m}.`; }
/* Mengen küchentauglich: unter 1 kg in Gramm, unter 1 l in Milliliter */
function plQty(q, p){ const u = p ? p.unit : ''; if(!(q > 0)) return '0 ' + u; if(u === 'kg' && q < 1) return num(Math.max(1, Math.round(q*1000))) + ' g'; if(u === 'l' && q < 1) return num(Math.max(1, Math.round(q*1000))) + ' ml'; return qtyFmt(q, p); }
function plG(g){ return g >= 1000 ? num(g/1000, 2) + ' kg' : num(Math.round(g)) + ' g'; }

/* ---------- Navigation ---------- */
ICO.vorb = '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.500 10h17M8.500 15.200l2.300 2.300 4.700-5"/>';
view.pl = {off:0, all:false, allIng:false};
const PL_WD = ['So','Mo','Di','Mi','Do','Fr','Sa'];
const PL_FACS = [[0.7,'ruhig −30 %'],[1,'normal'],[1.3,'volles Haus +30 %']];
const PL_PICK = 8;       // so viele gleiche Wochentage zählen höchstens
const PL_DECAY = 0.8;    // jede ältere Woche zählt um ein Fünftel weniger
const PL_TOP = 12;       // so viele Gerichte zeigt die Prognose, der Rest klappt auf
const PL_BACK = 430;     // so viele Tage zurück wird gesucht
const PL_MINOR = 0.2;    // unter 200 g oder 200 ml am Tag ist es eine Kleinmenge (Salz, Gewürze): steht nicht auf der Prep-Liste
const PL_BASIC = ['salt','pepper','oil','sugar','icing','cinnamon','paprika','caraway','starch','water'];   // Beispieldaten: Grundzutaten
function plMinor(x){ if(x.st === 'miss') return false; const p = x.p; if(p.basic === true) return true; if(p.basic === false) return false; return p.unit !== 'Stk' && x.need < PL_MINOR; }

/* =====================================================================
   Prognose
   ===================================================================== */
function plLower(arr, x){ let lo = 0, hi = arr.length; while(lo < hi){ const mid = (lo + hi) >> 1; if(arr[mid] < x) lo = mid + 1; else hi = mid; } return lo; }
/* Prognose für den Tag D. Benutzt nur Verkaufstage vor D (auch für den Rückblick: kein Blick nach vorn). */
function vbForecastRaw(D){
  const ix = plIdx(); const w = dParse(D).getDay(), sea = seasonFor(D);
  const closed = (S.settings.closed || []).includes(w);
  const hi = plLower(ix.days, D); const hist = ix.days.slice(Math.max(0, hi - 420), hi); const minDay = dAdd(D, -PL_BACK);
  const same = []; for(let i = hist.length - 1; i >= 0; i--){ const d = hist[i]; if(d < minDay) break; if(ix.wdOf[d] === w) same.push(d); }
  const sameSea = same.filter(d => ix.seaOf[d] === sea);
  let pick, mode, seaMatch = false;
  if(same.length >= 3){ mode = 'wd'; if(sameSea.length >= 3){ pick = sameSea.slice(0, PL_PICK); seaMatch = true; } else pick = same.slice(0, PL_PICK); }
  else { mode = hist.length ? 'avg' : 'none'; pick = hist.slice(-14).reverse(); }
  const wts = pick.map((d, i) => mode === 'wd' ? Math.pow(PL_DECAY, i) : 1);
  // Trend: die letzten 7 Öffnungstage gegen die 7 davor, zur Hälfte angerechnet, höchstens ±15 %
  let trend = {f:1, T:null, used:false};
  if(mode === 'wd' && hist.length >= 14){ const l14 = hist.slice(-14);
    if(pick[0] >= l14[0] && dDiff(l14[0], l14[13]) <= 28 && dDiff(l14[13], D) <= 14){ let a = 0, b = 0; l14.forEach((d, i) => { if(i < 7) b += ix.tot[d]; else a += ix.tot[d]; });
      if(b > 0){ const T = a / b; trend = {T, f: Math.min(1.15, Math.max(0.85, 1 + 0.5 * (T - 1))), used:true}; } } }
  const maps = pick.map(plDayMap); const av = pick.map(d => [ix.seaOf[d], ix.wdOf[d]]);
  const items = [];
  for(const m of S.menu){
    if(m.hidden || !plAvail(m, sea, w)) continue;
    let nu = 0, den = 0; const vals = [];
    pick.forEach((d, i) => { if(!plAvail(m, av[i][0], av[i][1])) return; const q = maps[i].get(m.id) || 0; nu += wts[i] * q; den += wts[i]; vals.push([q, wts[i]]); });
    let f = 0, sd = 0, flag = '';
    if(den > 0){ f = nu / den; let v = 0; vals.forEach(([q, wt]) => { v += wt * (q - f) * (q - f); }); sd = Math.sqrt(v / den); }
    else { // an diesen Tagen stand es nicht auf der Karte: die eigenen letzten Verkaufstage nehmen
      const own = []; for(let i = hist.length - 1; i >= 0 && own.length < 6; i--){ const q = plDayMap(hist[i]).get(m.id); if(q) own.push(q); }
      if(own.length){ f = own.reduce((a,b) => a + b, 0) / own.length; sd = Math.sqrt(own.reduce((a,q) => a + (q - f) * (q - f), 0) / own.length); flag = 'own'; own.forEach(q => vals.push([q, 1])); } else flag = 'new'; }
    f *= trend.f; sd *= trend.f; const s = Math.max(sd, Math.sqrt(f));
    items.push({m, key:m.id, name:dishLabel(m), section:m.section, card:m.card, f, lo:Math.max(0, f - s), hi:f + s, last:vals.slice(0, 4).map(v => v[0]), flag});
  }
  const specials = [];
  specialsFor(D).forEach(sp => (sp.items || []).forEach((it, i) => { if(+it.price > 0 || it.card) specials.push({sp, key:`sp:${sp.id}:${i}`, name:it.name, section:'Aktion · ' + sp.name, card:it.card || '', f:0, lo:0, hi:0, last:[], flag:'aktion'}); }));
  return {D, w, sea, closed, mode, pick, wts, seaMatch, same:same.length, trend, items, specials, histN:hist.length, lastDay:hist[hist.length - 1] || null};
}
function vbForecast(D){ return plCache('fc|' + D, () => vbForecastRaw(D)); }

/* Rückblick über die letzten 4 Wochen: Für jeden Verkaufstag wird die Prognose so gerechnet,
   wie sie am Vorabend gewesen wäre, und mit dem echten Verkauf verglichen. */
function vbBacktest(today){
  today = today || isoDate(new Date());
  return plCache('bt|' + today, () => {
    const ix = plIdx(); const days = ix.days.filter(d => d <= today); if(!days.length) return {n:0};
    const last = days[days.length - 1]; const from = dAdd(last, -27); const test = days.filter(d => d >= from);
    let n = 0, cells = 0, abs = 0, pctSum = 0, pctN = 0, thin = 0;
    test.forEach(d => { const fc = vbForecastRaw(d); if(fc.mode === 'none') return; if(fc.mode === 'avg') thin++;
      const act = plDayMap(d); let tf = 0, ta = 0;
      fc.items.forEach(it => { const f = Math.round(it.f), a = act.get(it.key) || 0; tf += f; ta += a; if(f > 0 || a > 0){ abs += Math.abs(f - a); cells++; } });
      if(ta > 0){ pctSum += Math.abs(tf - ta) / ta * 100; pctN++; } n++; });
    return {n, from, to:last, cells, mae: cells ? abs / cells : null, pct: pctN ? pctSum / pctN : null, thin};
  });
}

/* =====================================================================
   Mise en place
   ===================================================================== */
/* Packungen wie in der Bestellung: Gebinde aufrunden, sonst Stück ganz, Gewicht auf halbe Einheiten */
function vbPacks(p, q){ if(!(q > 0)) return 0; if(+p.packQty > 0) return Math.ceil(q / p.packQty - 1e-9); return p.unit === 'Stk' ? Math.ceil(q - 1e-9) : Math.ceil(q * 2 - 1e-9) / 2; }
function vbUses(c, id, d=0){ if(!c || d > 6) return false; return c.items.some(it => { const r = refObj(it.ref); return r && r.t === 'c' && (r.o.id === id || vbUses(r.o, id, d + 1)); }); }
/* Aus Portionen je Gericht: Basisrezepte in ganzen Chargen und Rohzutaten in kg / l / Stk.
   rows: [[Rezeptur, Portionen], …] */
function vbExplode(rows){
  const semi = new Map(), prod = new Map();
  const walk = (c, f) => { c.items.forEach(it => { const r = refObj(it.ref); if(!r) return; const q = (+it.qty || 0) * f; if(!(q > 0)) return;
    if(r.t === 'p'){ if(r.o.noStock) return; prod.set(r.o.id, (prod.get(r.o.id) || 0) + (r.o.unit === 'Stk' ? q : q / 1000)); }
    else semi.set(r.o.id, (semi.get(r.o.id) || 0) + q); }); };
  rows.forEach(([c, q]) => { if(c && q > 0) walk(c, q); });
  const batches = []; const done = new Set(); let guard = 0;
  while(guard++ < 200){
    const open = [...semi.keys()].filter(id => !done.has(id)); if(!open.length) break;
    // zuerst die Basisrezepte, die kein anderes offenes Basisrezept mehr braucht
    const id = open.find(a => !open.some(b => b !== a && vbUses(C(b), a))) || open[0];
    done.add(id); const c = C(id); if(!c) continue; const need = semi.get(id); const y = +c.yieldG || totals(c).out; if(!(y > 0)) continue;
    const n = Math.ceil(need / y - 1e-9); batches.push({c, need, y, n}); walk(c, n);
  }
  return {batches, prod};
}
function vbQty(it, st, D){ const ov = (st.ov[D] || {})[it.key]; const fac = +st.fac[D] || 1; return ov != null && isFinite(+ov) ? {q:+ov, ov:true} : {q:Math.round(it.f * fac), ov:false}; }
function vbPlan(D){
  return plCache('plan|' + D, () => {
    const fc = vbForecast(D); const st = planState(); const fac = +st.fac[D] || 1;
    const dishes = fc.items.concat(fc.specials).map(it => { const x = vbQty(it, st, D); return {...it, q:x.q, ov:x.ov, auto:Math.round(it.f * fac), rlo:Math.floor(it.lo * fac), rhi:Math.ceil(it.hi * fac)}; })
      .sort((a,b) => (b.flag === 'aktion') - (a.flag === 'aktion') || b.q - a.q || b.f - a.f || a.name.localeCompare(b.name, 'de'));
    const total = dishes.reduce((a,x) => a + x.q, 0);
    const noCard = dishes.filter(x => x.q > 0 && !(x.card && C(x.card)));
    const ex = fc.closed ? {batches:[], prod:new Map()} : vbExplode(dishes.filter(x => x.q > 0 && x.card && C(x.card)).map(x => [C(x.card), x.q]));
    // was bis zu diesem Tag noch geliefert wird, und was schon in einem Entwurf liegt
    const inc = new Map(), drf = new Map();
    (S.orders || []).forEach(o => { const tgt = ['sent','confirmed'].includes(o.status) && o.deliveryDate <= D ? inc : (o.status === 'draft' || o.status === 'approval') ? drf : null; if(!tgt) return; (o.lines || []).forEach(l => tgt.set(l.pid, (tgt.get(l.pid) || 0) + (+l.n || 0) * (+l.f || 1))); });
    const prods = [...ex.prod.entries()].map(([pid, need]) => { const p = P(pid); if(!p) return null; const stock = Math.max(0, +p.stock || 0); const coming = inc.get(pid) || 0;
      const miss = Math.max(0, need - stock - coming); const packs = vbPacks(p, miss); const drafted = drf.get(pid) || 0;
      return {p, need, stock, coming, miss: miss > 0.0005 ? miss : 0, packs, drafted, st: need <= stock + 0.0005 ? 'ok' : miss > 0.0005 ? 'miss' : 'coming'}; }).filter(Boolean).sort((a,b) => a.p.name.localeCompare(b.p.name, 'de'));
    const bySup = new Map(); prods.filter(x => x.st === 'miss').forEach(x => { const k = SUP(x.p.supplier) ? x.p.supplier : ''; if(!bySup.has(k)) bySup.set(k, []); bySup.get(k).push(x); });
    const sups = [...bySup.entries()].map(([sid, list]) => { const sp = SUP(sid) || null; let od = null, dl = null; if(sp){ od = nextOrderDate(sp); dl = nextDelivery(sp, od); }
      return {sid, sp, list, od, dl, late: !!dl && dl > D, drafted: list.every(x => x.drafted >= x.miss - 0.0005), draft: sp ? draftFor(sid) : null}; }).sort((a,b) => (a.sp ? 0 : 1) - (b.sp ? 0 : 1) || (a.od || '').localeCompare(b.od || '') || hm(a.sp && a.sp.cutoff) - hm(b.sp && b.sp.cutoff));
    // Prep-Liste: Vorkochen, dann je Lagerort
    const groups = [];
    if(ex.batches.length) groups.push({k:'b', t:'Vorkochen', items:ex.batches.map(b => ({key:'b:' + b.c.id, card:b.c.id, name:b.c.name, qty:`${num(b.n)} ${b.n === 1 ? 'Charge' : 'Chargen'} à ${plG(b.y)}`, sub:`gebraucht ${plG(b.need)}${b.n * b.y - b.need > 1 ? ` · bleibt ${plG(b.n * b.y - b.need)} übrig` : ''}`}))});
    Object.entries(LOCS).concat([['', 'Ohne Lagerort']]).forEach(([k, t]) => { const l = prods.filter(x => (LOCS[x.p.loc] ? x.p.loc : '') === k); if(l.length) groups.push({k:'l:' + k, t, items:l.map(x => ({key:'p:' + x.p.id, name:x.p.name, qty:plQty(x.need, x.p), sub: x.st === 'miss' ? `fehlt ${plQty(x.miss, x.p)}` : '', bad: x.st === 'miss', minor: plMinor(x)}))}); });
    return {D, fc, fac, dishes, total, noCard, batches:ex.batches, prods, sups, groups, nMiss: prods.filter(x => x.st === 'miss').length};
  });
}
/* Fehlendes eines Lieferanten in dessen Entwurf legen (Menge wird nie verringert) */
function vbToDraft(sid, D){
  const pl = vbPlan(D); const g = pl.sups.find(x => x.sid === sid); const sp = SUP(sid); if(!g || !sp) return null;
  const o = draftFor(sid) || newOrder(sid, false); let add = 0, up = 0;
  g.list.forEach(x => { const n = x.packs; if(!(n > 0)) return; const l = o.lines.find(y => y.pid === x.p.id);
    if(l){ if((+l.n || 0) * (+l.f || 1) < x.miss - 0.0005){ l.n = n; up++; } } else { o.lines.push(lineFor(x.p, n)); add++; } });
  save(); return {o, add, up};
}

/* =====================================================================
   Ansicht
   ===================================================================== */
function vbDay(){ return dAdd(todayStr(), Math.max(0, Math.min(6, +view.pl.off || 0))); }
function vbBasisHtml(pl){
  const fc = pl.fc; const dn = DAYNAME[fc.w]; const out = [];
  if(fc.mode === 'wd'){
    out.push(`Prognose aus den letzten ${fc.pick.length} ${dn}en${fc.seaMatch ? ' der gleichen Saison' : ''}. Neuere Wochen zählen mehr.`);
    if(dDiff(fc.pick[0], fc.D) > 60) out.push(`Der jüngste davon war am ${fmtDate(fc.pick[0] + 'T12:00:00')}.`);
    if(fc.trend.used && Math.abs(fc.trend.f - 1) >= 0.005) out.push(`Die letzten 7 Öffnungstage liefen ${num(Math.abs(fc.trend.T - 1) * 100, 0)} % ${fc.trend.T > 1 ? 'besser' : 'schwächer'} als die 7 davor, darum ${fc.trend.f > 1 ? '+' : '−'}${num(Math.abs(fc.trend.f - 1) * 100, 0)} %.`);
  } else if(fc.mode === 'avg') out.push(`Zu wenig Verlauf: Es gibt erst ${fc.same === 0 ? 'keinen' : fc.same === 1 ? 'einen' : fc.same} ${dn}${fc.same === 1 ? '' : fc.same === 0 ? '' : 'e'} mit Verkäufen, es braucht drei. Die Prognose ist darum der einfache Durchschnitt der letzten ${fc.pick.length} Verkaufstage.`);
  const t = todayStr(); if(fc.lastDay && dDiff(fc.lastDay, t) > 10) out.push(`Seit dem ${fmtDate(fc.lastDay + 'T12:00:00')} sind keine Verkäufe gespeichert.`);
  const bt = vbBacktest();
  if(bt.n >= 3 && bt.mae != null) out.push(`<span data-help="rueckblick">Rückblick: In den letzten 4 Wochen (${bt.n} Verkaufstage) lag die Prognose je Gericht im Schnitt ± ${num(bt.mae, 1)} Portionen daneben${bt.pct != null ? `, bei der Tagesmenge ± ${num(bt.pct, 0)} %` : ''}.</span>`);
  else out.push('Für einen Rückblick auf die Treffsicherheit gibt es noch zu wenige Verkaufstage.');
  return out.join(' ');
}
function vbFcRow(x, ro){
  const lastTxt = x.flag === 'aktion' ? 'keine Verkaufsdaten, Menge selbst eintragen' : x.flag === 'new' ? 'noch nie verkauft' : x.last.length ? `zuletzt ${x.last.map(v => num(v)).join(' · ')}` : '';
  const range = x.flag === 'aktion' || x.flag === 'new' ? '' : x.ov ? `Prognose ${num(x.auto)}` : `meist ${num(x.rlo)}–${num(x.rhi)}`;
  return `<li class="pl-row ${x.ov ? 'ov' : ''}"><span class="pl-n"><b>${esc(x.name)}</b><small>${esc(x.section || '')}${lastTxt ? ' · ' + lastTxt : ''}</small></span>
    <span class="pl-r">${range}${x.ov ? `<button type="button" class="link pl-reset" data-act="plOvReset" data-id="${esc(x.key)}" ${ro ? 'disabled' : ''}>zurück</button>` : ''}</span>
    <input class="num-in pl-in" inputmode="numeric" data-num="self" data-plov="${esc(x.key)}" value="${num(x.q)}" ${ro ? 'disabled' : ''} aria-label="Portionen ${esc(x.name)}"></li>`;
}
function vbFcHtml(pl, ro, facSeg){
  const keep = x => x.ov || x.flag === 'aktion'; let nTop = 0; const big = [], small = [];
  pl.dishes.forEach(x => { if(keep(x) || (x.q > 0 && nTop < PL_TOP)){ big.push(x); if(!keep(x)) nTop++; } else small.push(x); });
  const smallQ = small.reduce((a,x) => a + x.q, 0);
  return `<section class="pl-sec pl-fc"><h2 class="day-h">Prognose<span>${num(pl.total)} Portionen. Die Zahl können Sie überschreiben.</span></h2>
    <div class="pl-facrow"><span class="muted">Wie wird der Tag?</span>${facSeg}</div>
    <ul class="vb-list">${big.map(x => vbFcRow(x, ro)).join('') || '<li class="pl-none">Für diesen Tag erwartet die Prognose nichts.</li>'}</ul>
    ${small.length ? `<button type="button" class="link pl-more" data-act="plAll" aria-expanded="${!!view.pl.all}">${view.pl.all ? 'Weniger anzeigen' : `${small.length} weitere ${small.length === 1 ? 'Gericht' : 'Gerichte'} anzeigen, zusammen ${num(smallQ)} ${smallQ === 1 ? 'Portion' : 'Portionen'}`}</button>${view.pl.all ? `<ul class="vb-list">${small.map(x => vbFcRow(x, ro)).join('')}</ul>` : ''}` : ''}
  </section>`;
}
function vbMiseHtml(pl){
  const D = pl.D; const nOk = pl.prods.filter(x => x.st === 'ok').length, nCome = pl.prods.filter(x => x.st === 'coming').length;
  const sups = pl.sups.map(g => { const sp = g.sp;
    const when = sp ? `Bestellen bis ${g.od === todayStr() ? 'heute' : PL_WD[dParse(g.od).getDay()] + ' ' + plShortDate(g.od)} ${esc(sp.cutoff)} Uhr · Lieferung ${PL_WD[dParse(g.dl).getDay()]} ${plShortDate(g.dl)}${g.late ? ` · <span class="bad-t">zu spät für ${D === todayStr() ? 'heute' : PL_WD[dParse(D).getDay()] + ' ' + plShortDate(D)}</span>` : ''}` : 'Kein Lieferant hinterlegt';
    const act = !sp ? '' : g.drafted ? `<button type="button" class="btn sm" data-act="ordOpen" data-id="${g.draft ? g.draft.id : ''}">Entwurf ${g.draft ? esc(g.draft.no) : ''} öffnen</button>` : `<button type="button" class="btn sm" data-act="plDraft" data-id="${esc(g.sid)}">In Bestellung legen</button>`;
    return `<div class="pl-sup"><div class="pl-sup-h"><span><b>${sp ? esc(sp.name) : 'Ohne Lieferant'}</b><small>${when}</small></span>${act}</div>
      <ul class="pl-miss">${g.list.map(x => `<li><span class="pl-n"><b>${esc(x.p.name)}</b><small>braucht ${plQty(x.need, x.p)} · im Lager ${plQty(x.stock, x.p)}${x.coming ? ` · kommt ${plQty(x.coming, x.p)}` : ''}</small></span><span class="pl-mq"><b>fehlt ${plQty(x.miss, x.p)}</b><small>${sp ? `bestellen: ${x.p.packQty ? `${num(x.packs)} × ${esc(x.p.pack)}` : `${num(x.packs, 1)} ${esc(x.p.unit)}`}${x.drafted >= x.miss - 0.0005 ? ' · im Entwurf' : ''}` : ''}</small></span></li>`).join('')}</ul></div>`; }).join('');
  const okList = pl.prods.filter(x => x.st !== 'miss');
  const ing = pl.prods.length ? `<p class="pl-ing-sum">${num(pl.prods.length)} ${pl.prods.length === 1 ? 'Zutat' : 'Zutaten'} gebraucht: ${num(nOk)} ${nOk === 1 ? 'reicht' : 'reichen'}${nCome ? `, ${num(nCome)} ${nCome === 1 ? 'reicht' : 'reichen'} mit der bestellten Lieferung` : ''}${pl.nMiss ? `, <b>${num(pl.nMiss)} ${pl.nMiss === 1 ? 'fehlt' : 'fehlen'}</b>` : ''}.</p>
    ${sups}
    ${okList.length ? `<details class="pl-ok" data-open="plok" ${view.pl.okOpen ? 'open' : ''}><summary>${num(okList.length)} ${okList.length === 1 ? 'Zutat reicht' : 'Zutaten reichen'}</summary><ul class="pl-okl">${okList.map(x => `<li><span>${esc(x.p.name)}</span><span>${plQty(x.need, x.p)}</span><span class="muted">${x.st === 'coming' ? `Lager ${plQty(x.stock, x.p)} + Lieferung` : `Lager ${plQty(x.stock, x.p)}`}</span></li>`).join('')}</ul></details>` : ''}
    <p class="hint">Gerechnet mit dem Lagerstand von jetzt. Was bis dahin noch verkauft wird, ist nicht abgezogen. Basisrezepte zählen in ganzen Chargen, Reste von gestern kennt die App nicht.</p>` : '';
  const none = pl.noCard.length ? `<p class="hint pl-nocard">${pl.noCard.length === 1 ? 'Ein Gericht' : pl.noCard.length + ' Gerichte'} mit ${num(pl.noCard.reduce((a,x) => a + x.q, 0))} Portionen ${pl.noCard.length === 1 ? 'hat' : 'haben'} keine Rezeptur und ${pl.noCard.length === 1 ? 'fehlt' : 'fehlen'} darum hier: ${pl.noCard.slice(0, 4).map(x => esc(x.name)).join(', ')}${pl.noCard.length > 4 ? ' und weitere' : ''}.</p>` : '';
  return `<section class="pl-sec pl-mise"><h2 class="day-h">Reicht die Ware?<span>aus den Rezepturen gerechnet</span></h2>
    ${ing ? ing : '<p class="pl-empty">Für die erwarteten Gerichte gibt es noch keine Rezepturen. Darum lässt sich nichts ausrechnen.</p>'}${none}</section>`;
}
function vbPrepHtml(pl){
  const st = planState(); const chk = st.chk[pl.D] || {}; const showAll = !!view.pl.allIng;
  const vis = i => showAll || !i.minor || chk[i.key];
  const groups = pl.groups.map(g => ({...g, items:g.items.filter(vis)})).filter(g => g.items.length);
  const nMinor = pl.groups.reduce((a,g) => a + g.items.filter(i => i.minor).length, 0);
  const all = groups.reduce((a,g) => a + g.items.length, 0); const done = groups.reduce((a,g) => a + g.items.filter(i => chk[i.key]).length, 0);
  if(!all && !nMinor) return `<section class="pl-sec pl-prep" id="plPrep"><h2 class="day-h">Prep-Liste</h2><p class="pl-empty">Noch leer. Die Liste füllt sich, sobald die erwarteten Gerichte eine Rezeptur haben.</p></section>`;
  const item = i => `<li><button type="button" role="checkbox" aria-checked="${chk[i.key] ? 'true' : 'false'}" class="pl-c ${chk[i.key] ? 'on' : ''}" data-act="plChk" data-id="${esc(i.key)}"><i aria-hidden="true">${ico('check')}</i><span class="pl-c-n">${esc(i.name)}${i.sub ? `<small class="${i.bad ? 'bad-t' : ''}">${esc(i.sub)}</small>` : ''}</span><b>${esc(i.qty)}</b></button>${i.card ? `<button type="button" class="link pl-rz" data-act="openCard" data-id="${i.card}">Rezeptur</button>` : ''}</li>`;
  return `<section class="pl-sec pl-prep" id="plPrep"><h2 class="day-h">Prep-Liste<span id="plProg">${done} von ${all} erledigt</span>${done ? `<button type="button" class="link pl-clear" data-act="plChkClear">Häkchen löschen</button>` : ''}</h2>
    <div class="pl-groups">${groups.map(g => `<div class="pl-grp ${g.k === 'b' ? 'vk' : ''}"><h3 class="pl-h3">${esc(g.t)}</h3><ul class="pl-chk">${g.items.map(item).join('')}</ul></div>`).join('')}</div>
    ${nMinor ? `<button type="button" class="link pl-alling" data-act="plAllIng" aria-expanded="${showAll}">${showAll ? 'Nur Hauptzutaten zeigen' : `Alle Zutaten zeigen · ${nMinor} ${nMinor === 1 ? 'Kleinmenge' : 'Kleinmengen'} wie Salz, Gewürze, Öl`}</button>` : ''}</section>`;
}
function renderVorb(){
  const ix = plIdx(); const t = todayStr(); const off = Math.max(0, Math.min(6, +view.pl.off || 0)); const D = dAdd(t, off);
  const days = `<div class="pl-days" role="tablist" aria-label="Tag wählen">${[0,1,2,3,4,5,6].map(i => { const d = dAdd(t, i); const cl = (S.settings.closed || []).includes(dParse(d).getDay()); return `<button type="button" role="tab" aria-selected="${i === off}" class="${i === off ? 'on' : ''} ${cl ? 'closed' : ''}" data-act="plDay" data-id="${i}"><b>${i === 0 ? 'Heute' : i === 1 ? 'Morgen' : PL_WD[dParse(d).getDay()]}</b><small>${cl ? 'Ruhetag' : plShortDate(d)}</small></button>`; }).join('')}</div>`;
  const head = (sub, btn) => `<div class="page-h"><div><h1>Vorbereitung</h1><p class="sub">${sub}</p></div>${btn ? `<div class="row-btns">${btn}</div>` : ''}</div>`;
  if(!ix.days.length) return head('Was brauche ich heute, was morgen? Die Prognose rechnet aus Ihren Verkäufen.') + `<section class="panel empty">Für eine Prognose braucht es Verkäufe. Laden Sie die Artikelumsätze aus Ihrer Kasse.<div class="row-btns" style="justify-content:center;margin-top:12px"><button type="button" class="btn primary" data-act="plKasse">Kasse importieren</button></div></section>`;
  const dLong = dParse(D).toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long'});
  const fc = vbForecast(D);
  if(fc.closed) return head('Was brauche ich heute, was morgen?') + days + `<section class="pl-closed"><h2>Ruhetag – keine Vorbereitung</h2><p>${esc(dLong)} ist Ruhetag. Wählen Sie oben einen anderen Tag.</p></section>`;
  const pl = vbPlan(D); const ro = !canEditAll(); const sk = fc.sea && S.settings.seasons[fc.sea] ? S.settings.seasons[fc.sea].title : '';
  const live = specialsFor(D);
  const facSeg = `<div class="seg pl-fac" role="group" aria-label="Wie wird der Tag?">${PL_FACS.map(([f, l]) => `<button type="button" class="${Math.abs(pl.fac - f) < 0.001 ? 'on' : ''}" data-act="plFac" data-id="${f}" aria-pressed="${Math.abs(pl.fac - f) < 0.001}">${l}</button>`).join('')}</div>`;
  return head(`${esc(dLong)}${sk ? ' · ' + esc(sk) : ''}${live.length ? ' · Aktion: ' + live.map(s => esc(s.name)).join(', ') : ''} · ${num(pl.total)} Portionen erwartet${pl.fac !== 1 ? `, ${pl.fac > 1 ? 'volles Haus' : 'ruhiger Tag'} eingerechnet` : ''}`, `<button type="button" class="btn primary" data-pdf="plPrint">${ico('download')}Als PDF speichern</button>`)
    + days
    + vbPrepHtml(pl)
    + `<div class="pl-grid">${vbFcHtml(pl, ro, facSeg)}${vbMiseHtml(pl)}</div>`
    + `<details class="more pl-how" data-more="plhow" ${(view.more || {}).plhow ? 'open' : ''}><summary>Wie die Prognose rechnet</summary><p class="pl-basis">${vbBasisHtml(pl)}</p></details>`;
}

/* ---------- Druck / PDF ---------- */
function vbPrintHtml(D){
  const pl = vbPlan(D); const dLong = dParse(D).toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
  const dishes = pl.dishes.filter(x => x.q > 0);
  return `<div class="pl-print"><div class="meta"><span>${esc(S.settings.name)}</span><span>Erstellt ${fmtDate(new Date().toISOString())}</span></div>
    <h1>Prep-Liste · ${esc(dLong)}</h1><p class="pp-sub">${num(pl.total)} Portionen erwartet${pl.fac !== 1 ? ` (${pl.fac > 1 ? 'volles Haus' : 'ruhiger Tag'})` : ''}. Prognose aus den Verkäufen, geschätzt.</p>
    ${pl.groups.map(g => ({...g, items:g.items.filter(i => !i.minor || view.pl.allIng)})).filter(g => g.items.length).map(g => `<h2>${esc(g.t)}</h2><ul class="pp-l">${g.items.map(i => `<li><i></i><span>${esc(i.name)}${i.sub ? ` <small>${esc(i.sub)}</small>` : ''}</span><b>${esc(i.qty)}</b></li>`).join('')}</ul>`).join('')}
    <h2>Erwartete Portionen</h2><ul class="pp-l pp-d">${dishes.map(x => `<li><span>${esc(x.name)}</span><b>${num(x.q)}</b></li>`).join('')}</ul></div>`;
}
function vbPrint(){
  const D = vbDay(); const fc = vbForecast(D); if(fc.closed || fc.mode === 'none'){ toast(fc.closed ? 'Ruhetag: keine Prep-Liste' : 'Noch keine Verkäufe, keine Prep-Liste'); return; }
  PDF_NAME = pdfFileName('Prep-Liste-' + D); $('#print').classList.remove('hs-print'); $('#print').innerHTML = vbPrintHtml(D); document.body.classList.remove('print-menu', 'print-report'); window.print();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-pdf="plPrint"]'); if(b) vbPrint(); }, true);

/* ---------- Heute: ein Block mit der Prognose ---------- */
const _renderDashPlus = renderDash;
renderDash = function(){
  let h = _renderDashPlus();
  try {
    const ix = plIdx(); if(!ix.days.length) return h; const t = todayStr();
    let off = 0; if(vbForecast(t).closed) off = 1; const D = dAdd(t, off); const fc = vbForecast(D); if(fc.closed || fc.mode === 'none') return h;
    const pl = vbPlan(D); const top = pl.dishes.filter(x => x.q > 0).slice(0, 3).map(x => `${esc(dishShort(x.m || {name:x.name}, 22))} ${num(x.q)}`).join(' · ');
    const meta = [pl.batches.length ? `${pl.batches.length} ${pl.batches.length === 1 ? 'Basisrezept' : 'Basisrezepte'} vorkochen` : '', pl.nMiss ? `<span class="bad-t">${pl.nMiss} ${pl.nMiss === 1 ? 'Zutat fehlt' : 'Zutaten fehlen'}</span>` : pl.prods.length ? 'Zutaten reichen' : ''].filter(Boolean).join(' · ');
    const block = daySec('Vorbereitung', off ? 'Prognose für morgen' : 'Prognose für heute', dayRow(`≈ ${num(pl.total)}`, 'Portionen erwartet', top, meta, `<button type="button" class="btn sm" data-act="plGo" data-id="${off}">Vorbereitung</button>`)).replace('<section class="day-sec">', '<section class="day-sec pl-dash">');
    const i = h.indexOf('<!--dash-extra-->'); if(i >= 0) h = h.slice(0, i) + block + h.slice(i);
  } catch(err){ console.warn('Vorbereitung:', err); }
  return h;
};

/* ---------- Bedienung ---------- */
['plFac','plOvReset'].forEach(a => RO_ACTS.add(a));
function vbChkPatch(){
  const pl = vbPlan(vbDay()); const chk = planState().chk[pl.D] || {}; const vis = i => view.pl.allIng || !i.minor || chk[i.key];
  const all = pl.groups.reduce((a,g) => a + g.items.filter(vis).length, 0); const done = pl.groups.reduce((a,g) => a + g.items.filter(i => chk[i.key]).length, 0);
  const pr = $('#plProg'); if(pr) pr.textContent = `${done} von ${all} erledigt`;
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const a = el.dataset.act, id = el.dataset.id; if(!a.startsWith('pl') || a === 'plImport') return;
  const st = planState(); const D = vbDay();
  switch(a){
    case 'plKasse': view.rp.tab = 'import'; go('report'); break;
    case 'plGo': view.pl.off = +id || 0; go('vorb'); break;
    case 'plDay': view.pl.off = +id || 0; view.pl.all = false; render(); break;
    case 'plAll': view.pl.all = !view.pl.all; render(); break;
    case 'plAllIng': view.pl.allIng = !view.pl.allIng; render(); break;
    case 'plFac': { if(!roGate()) break; const f = +id; if(Math.abs(f - 1) < 0.001) delete st.fac[D]; else st.fac[D] = f; save(); render(); break; }
    case 'plOvReset': { if(!roGate()) break; if(st.ov[D]){ delete st.ov[D][id]; if(!Object.keys(st.ov[D]).length) delete st.ov[D]; } save(); render(); break; }
    case 'plChk': { const c = st.chk[D] = st.chk[D] || {}; const on = !c[id]; if(on) c[id] = 1; else delete c[id]; if(!Object.keys(c).length) delete st.chk[D];
      el.classList.toggle('on', on); el.setAttribute('aria-checked', on ? 'true' : 'false'); save(); vbChkPatch();
      if(!!$('#app .pl-clear') !== !!st.chk[D]) render(); break; }
    case 'plChkClear': delete st.chk[D]; save(); render(); break;
    case 'plDraft': { const r = vbToDraft(id, D); if(!r) break; render(); const n = r.add + r.up;
      toast(n ? `${n} ${n === 1 ? 'Artikel' : 'Artikel'} im Entwurf ${r.o.no} bei ${SUP(id).name}` : 'Liegt schon im Entwurf', {label:'Entwurf öffnen', action:() => { view.stab = 'bestellung'; view.order = r.o.id; view.recv = null; go('buy'); }}); break; }
  }
});
document.addEventListener('change', e => {
  const t = e.target; if(!t.dataset || t.dataset.plov == null || view.tab !== 'vorb') return;
  const D = vbDay(); const st = planState(); const key = t.dataset.plov; const pl = vbPlan(D); const row = pl.dishes.find(x => x.key === key); if(!row) return;
  if(!canEditAll()){ t.value = num(row.q); roGate(false); return; }
  const raw = t.value.trim(); const v = raw === '' ? NaN : numParse(raw);
  if(raw !== '' && (!isFinite(v) || v < 0 || v > 9999)){ t.value = num(row.q); t.classList.add('bad-in'); setTimeout(() => t.classList.remove('bad-in'), 1600); toast('Bitte eine Zahl von 0 bis 9.999 eingeben.'); return; }
  const o = st.ov[D] = st.ov[D] || {};
  if(raw === '' || Math.round(v) === row.auto) delete o[key]; else o[key] = Math.round(v);
  if(!Object.keys(o).length) delete st.ov[D];
  save(); softRender();
});
document.addEventListener('keydown', e => { const t = e.target; if(e.key !== 'Enter' || view.tab !== 'vorb' || !t.matches || !t.matches('input[data-plov]')) return; e.preventDefault();
  const all = [...document.querySelectorAll('#app input[data-plov]')].filter(x => !x.disabled); const n = all[all.indexOf(t) + (e.shiftKey ? -1 : 1)]; const key = n ? n.dataset.plov : t.dataset.plov;
  t.blur(); setTimeout(() => { const f = document.querySelector(`#app input[data-plov="${CSS.escape(key)}"]`); if(f){ f.focus({preventScroll:true}); f.select(); } }, 30); });
document.addEventListener('focusin', e => { if(e.target.matches && e.target.matches('input[data-plov]')) setTimeout(() => { if(document.activeElement === e.target) e.target.select(); }, 0); });
document.addEventListener('toggle', e => { const t = e.target; if(t && t.dataset && t.dataset.open === 'plok') view.pl.okOpen = t.open; }, true);

/* =====================================================================
   Hilfe-Texte und Schnellsuche
   ===================================================================== */
H('prognose','Prognose','Eine Schätzung, wie viele Portionen an einem Tag bestellt werden. Die App rechnet sie aus den gleichen Wochentagen der letzten Wochen.',1);
H('spanne','Spanne','So viel schwankt ein Gericht an diesem Wochentag üblicherweise. „Meist 22–35“ heißt: An den meisten Tagen lag es dazwischen.',1);
H('tagesfaktor','Ruhig oder volles Haus','Sie wissen mehr als die Zahlen: Feiertag, Wetter, Veranstaltung. Damit rechnet die App den ganzen Tag 30 % höher oder niedriger.',1);
H('pl_menge','Menge überschreiben','Tippen Sie Ihre eigene Zahl ein, zum Beispiel bei einer Reservierung. „zurück“ holt die Prognose wieder.');
H('charge','Charge','Eine ganze Menge von einem Basisrezept, so wie es in der Rezeptur steht. Zwei Chargen Dressing heißt: die Rezeptur zweimal ansetzen.',1);
H('mise','Reicht die Ware?','Die App vergleicht, was die erwarteten Gerichte brauchen, mit dem Lager und den bestellten Lieferungen. Was fehlt, legen Sie mit einem Tipp in die Bestellung.');
H('prepliste','Prep-Liste','Die Liste für die Küche zum Abhaken: was vorzukochen ist und was aus welchem Lager geholt wird.',1);
H('pl_abhaken','Abhaken','Ein Tipp setzt das Häkchen, noch ein Tipp nimmt es weg. Die Häkchen gelten für diesen Tag und bleiben gespeichert.');
H('pl_bestellung','In Bestellung legen','Legt alles, was bei diesem Lieferanten fehlt, in seinen Bestell-Entwurf. Gerundet auf ganze Gebinde. Gesendet wird noch nichts.');
H('rueckblick','Rückblick','Die App rechnet für die letzten vier Wochen nach, was sie am Vorabend vorhergesagt hätte, und vergleicht es mit dem echten Verkauf.',1);
H('pl_tag','Tag wählen','Die Prognose gibt es für heute und die nächsten sechs Tage. Am Ruhetag gibt es keine Vorbereitung.');
HELP_SEL.push(
  ['#app .pl-days button','pl_tag'], ['#app .pl-fac button','tagesfaktor'], ['#app input[data-plov]','pl_menge'], ['#app .pl-r','spanne'], ['#app .pl-tot','prognose'], ['#app .pl-fc .day-h','prognose'], ['#app .pl-basis','prognose'],
  ['#app .pl-mise .day-h','mise'], ['#app [data-act="plDraft"]','pl_bestellung'], ['#app .pl-prep .day-h','prepliste'], ['#app .pl-c','pl_abhaken'], ['#app .pl-dash','prognose']);

const _palDataPlus = palData;
palData = function(){
  const a = _palDataPlus();
  a.push({g:'Aktion', n:'Prognose für morgen', s:'Vorbereitung: was morgen gebraucht wird', run:() => { view.pl.off = 1; go('vorb'); }},
    {g:'Aktion', n:'Prep-Liste als PDF speichern', s:'Vorbereitung: Liste zum Ausdrucken', run:() => { if(view.tab !== 'vorb') go('vorb'); vbPrint(); }});
  return a;
};
