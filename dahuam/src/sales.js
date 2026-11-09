/* =====================================================================
   Verkäufe: Speicher, Kassen-Import, Demodaten, Zeitraum-Rechnung
   S.salesDays = { 'YYYY-MM-DD': [[menuId, Menge, UmsatzBrutto], …] }
   S.posMap    = { 'kassen-schlüssel': menuId | '-' (ignorieren) }
   ===================================================================== */
function salesEnsure(d){ if(!d.salesDays) d.salesDays = {}; if(!d.posMap) d.posMap = {}; if(!d.salesImports) d.salesImports = []; return d; }
function isoDate(dt){ return new Date(dt.getTime() - dt.getTimezoneOffset()*6e4).toISOString().slice(0,10); }
function dParse(s){ return new Date(s+'T12:00:00'); }
function dAdd(s, n){ const d = dParse(s); d.setDate(d.getDate()+n); return isoDate(d); }
function dDiff(a, b){ return Math.round((dParse(b) - dParse(a))/864e5); }
function isOpenDemo(s){ const d = dParse(s), md = s.slice(5), w = d.getDay(); if(w === 3) return false; return !((md >= '04-20' && md <= '06-12') || (md >= '10-11' && md <= '11-30')); }

// Demodaten: plausible Tagesverkäufe der letzten 14 Monate
function salesDemo(d){
  salesEnsure(d); if(d.salesDemoDone) return d;
  let seed = 20262; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const pop = {'Elsässer':9,'Zillertaler Käsefondue':7,'Wiener Schnitzel':12,'Kaiserschmarrn':9,'Gulaschsuppe':6,'Knoblauchbrot':6,'Wadel-Beißer-Burger':6,'Caesar Salat':4,'Oma Lisls Apfelstrudel':5,'Tomatensuppe':3,'Gärtnerin':3,'Weißer':2.5,'Schwammerl':2,'Garnelenpfandl':2.5,'Ripperl-Tower':2,'DFC Burger':4,'Alpen-Kebap':3.5,'Fish & Chips':2.5,'Filetsteak 230 g':1.6,'Cordon bleu':2,'Kalbsrahmgulasch':2,'Forelle Müllerin':1.5,'Hans-Wurst':2,'Bauernrösti':2.2,'Schwammerlrösti':1.6,'Dolce-Vita-Rösti':1.2,'Schokofondue':1.8,'Cookie-Pfandl':1.5,'Marillenknödel':2,'Crème brûlée':1.2,'Affogato':2,'Kinderschnitzel mit Pommes':3,'Chicken Nuggets mit Pommes':2.5,'Milchshake':3,'Palatschinke':2,'Gerlos Bowl':1.8,'Kebap Bowl':1.4,'Tatar vom Tiroler Rind':1.2,'Fabians Caprese':1.3,'Kokos-Curry-Suppe':1.5};
  const items = d.menu.map(m => ({m, w: (pop[m.name] || 0.8) * (m.vlabel==='vom Kalb' ? 0.45 : m.vlabel==='vom Schwein' ? 0.8 : m.vlabel==='180 g' ? .5 : 1)}));
  const end = isoDate(new Date()), start = dAdd(end, -425);
  const seasonOf = s => { const md = s.slice(5); for(const [k,ss] of Object.entries(d.settings.seasons||{})) { if(ss.from <= ss.to ? (md >= ss.from && md <= ss.to) : (md >= ss.from || md <= ss.to)) return k; } return null; };
  for(let s = start; s <= end; s = dAdd(s, 1)){
    if(!isOpenDemo(s)) continue;
    const dt = dParse(s), w = dt.getDay(), md = s.slice(5), k = seasonOf(s);
    let base = 70; if(k==='winter') base = md >= '12-24' || md <= '01-06' ? 175 : (md >= '02-01' && md <= '03-10' ? 150 : 115); else if(k==='sommer') base = md >= '07-10' && md <= '08-25' ? 105 : 80; else if(k==='herbst') base = 60; else if(k==='fruehling') base = 55;
    if(w === 6) base *= 1.25; if(w === 0) base *= 1.12; if(w === 1 || w === 2) base *= .85;
    const covers = Math.round(base * (0.85 + rnd()*0.3));
    const avail = items.filter(({m}) => (!m.seasons || !m.seasons.length || m.seasons.includes(k)) && (!m.days || !m.days.length || m.days.includes(w)));
    const sum = avail.reduce((a,x)=>a+x.w,0); const rows = [];
    for(const {m,w:wt} of avail){ const exp = covers * 1.25 * wt / sum; let q = Math.round(exp * (0.6 + rnd()*0.8)); if(q > 0) rows.push([m.id, q, Math.round(q * (+m.price||0) * 100)/100]); }
    d.salesDays[s] = rows;
  }
  d.salesDemo = true; d.salesDemoDone = true; return d;
}

/* ---------- Zeiträume ---------- */
function periodRange(key, ref){
  const t = ref || isoDate(new Date()); const d = dParse(t); const y = d.getFullYear(), m = d.getMonth();
  const mo = (yy, mm) => isoDate(new Date(yy, mm, 1, 12)); const lastOf = (yy, mm) => isoDate(new Date(yy, mm+1, 0, 12));
  const wdMon = (d.getDay()+6)%7;
  switch(key){
    case 'today': return [t, t];
    case 'yesterday': return [dAdd(t,-1), dAdd(t,-1)];
    case 'week': return [dAdd(t,-wdMon), dAdd(t, 6-wdMon)];
    case 'lastweek': return [dAdd(t,-wdMon-7), dAdd(t,-wdMon-1)];
    case 'month': return [mo(y,m), lastOf(y,m)];
    case 'lastmonth': return [mo(y,m-1), lastOf(y,m-1)];
    case 'quarter': { const q = Math.floor(m/3)*3; return [mo(y,q), lastOf(y,q+2)]; }
    case 'half': { const h = m < 6 ? 0 : 6; return [mo(y,h), lastOf(y,h+5)]; }
    case 'year': return [`${y}-01-01`, `${y}-12-31`];
    case 'lastyear': return [`${y-1}-01-01`, `${y-1}-12-31`];
    case 'winter': { const ws = S.settings.seasons.winter; const sy = (t.slice(5) >= ws.from) ? y : y-1; return [`${sy}-${ws.from}`, `${sy+1}-${ws.to}`]; }
    case 'lastwinter': { const ws = S.settings.seasons.winter; const sy = (t.slice(5) >= ws.from) ? y-1 : y-2; return [`${sy}-${ws.from}`, `${sy+1}-${ws.to}`]; }
    case 'summer': { const ss = S.settings.seasons.sommer; const sy = t.slice(5) >= ss.from ? y : y-1; return [`${sy}-${ss.from}`, `${sy}-${ss.to}`]; }
  }
  return [t, t];
}
function compareRange(from, to, mode){
  if(mode === 'prev'){ const n = dDiff(from, to) + 1; return [dAdd(from, -n), dAdd(from, -1)]; }
  const sh = s => { const y = +s.slice(0,4) - 1; let r = `${y}${s.slice(4)}`; if(r.slice(5) === '02-29') r = `${y}-02-28`; return r; };
  return [sh(from), sh(to)];
}
function salesAgg(from, to){
  const by = new Map(); const days = {}; let qty = 0, gross = 0, openDays = 0;
  for(const [day, rows] of Object.entries(S.salesDays || {})){
    if(day < from || day > to) continue; openDays++; let dg = 0;
    for(const [mid, q, g] of rows){ const a = by.get(mid) || {q:0, g:0}; a.q += q; a.g += g; by.set(mid, a); qty += q; gross += g; dg += g; }
    days[day] = dg;
  }
  return {by, days, qty, gross, openDays};
}
function vatOf(m){ const s = (m && m.section) || ''; return /getränk|wein|bar/i.test(s) ? 20 : (+S.settings.vat || 10); }

/* ---------- Kassen-Import (CSV) ---------- */
function csvParse(text){
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/).find(l => l.trim()) || '';
  const delim = [';','\t',',','|'].map(c => [c, (first.match(new RegExp('\\'+c,'g'))||[]).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const rows = []; let row = [], cur = '', q = false;
  for(let i = 0; i < text.length; i++){ const ch = text[i];
    if(q){ if(ch === '"'){ if(text[i+1] === '"'){ cur += '"'; i++; } else q = false; } else cur += ch; continue; }
    if(ch === '"'){ q = true; continue; }
    if(ch === delim){ row.push(cur); cur = ''; continue; }
    if(ch === '\n' || ch === '\r'){ if(ch === '\r' && text[i+1] === '\n') i++; row.push(cur); if(row.some(c=>c.trim()!=='')) rows.push(row); row = []; cur = ''; continue; }
    cur += ch; }
  row.push(cur); if(row.some(c=>c.trim()!=='')) rows.push(row);
  return rows;
}
const COLS = {
  date:/^(datum|date|tag|buchungsdatum|beleg.?datum|zeit|zeitpunkt|timestamp|day)$/i,
  art:/^(art(ikel)?\.?\s*-?\s*(nr|nummer|no)\.?|plu|sku|code|artikelcode|id)$/i,
  name:/^(artikel|bezeichnung|artikelname|produkt|name|item|text|artikelbezeichnung|beschreibung)$/i,
  qty:/^(menge|anzahl|stk|stück|qty|quantity|verkauft|count)$/i,
  gross:/^(umsatz|brutto|umsatz\s*brutto|betrag|summe|gesamt|total|gross|vk\s*brutto|preis\s*gesamt|umsatz\s*\(brutto\))$/i,
  price:/^(preis|einzelpreis|vk|vk-preis|price|unit\s*price)$/i,
};
function guessCols(header){ const m = {}; header.forEach((h,i) => { const k = h.trim(); for(const [c,re] of Object.entries(COLS)) if(m[c]==null && re.test(k)) m[c] = i; }); return m; }
function numDE(s){ s = String(s||'').replace(/[€\s]/g,''); if(/,\d{1,2}$/.test(s) || (s.includes(',') && !s.includes('.'))) s = s.replace(/\./g,'').replace(',', '.'); else s = s.replace(/,/g,''); const n = parseFloat(s); return isFinite(n) ? n : 0; }
function dateDE(s){ s = String(s||'').trim(); let m;
  if((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
  if((m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/))) { const y = m[3].length===2 ? '20'+m[3] : m[3]; return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
  if((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  return null; }
function normName(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[„“"'’.,()\-]/g,' ').replace(/\s+/g,' ').trim(); }
function posKey(art, name){ return art ? 'a:'+String(art).trim() : 'n:'+normName(name); }
function autoMatch(name){
  const n = normName(name); if(!n) return null;
  let best = null, bs = 0;
  for(const m of S.menu){ const full = normName(m.name + (m.vlabel ? ' '+m.vlabel : '')), base = normName(m.name);
    let sc = 0; if(full === n || base === n) sc = 1; else { const a = new Set(n.split(' ')), b = new Set(full.split(' ')); const inter = [...a].filter(x=>b.has(x) && x.length > 2).length; sc = inter / Math.max(a.size, b.size); if(full.includes(n) || n.includes(base)) sc = Math.max(sc, .7); }
    if(sc > bs){ bs = sc; best = m; } }
  return bs >= .6 ? best : null;
}
function importAnalyse(text){
  const rows = csvParse(text); if(rows.length < 2) throw new Error('Die Datei enthält keine Datenzeilen.');
  const head = rows[0]; const c = guessCols(head);
  if(c.qty == null || (c.name == null && c.art == null)) throw new Error('Spalten für Artikel und Menge nicht gefunden. Erwartet z. B. „Datum; Artikelnr; Artikel; Menge; Umsatz“.');
  const fileDate = null; const lines = []; const unknown = new Map(); let skipped = 0;
  for(const r of rows.slice(1)){
    const date = c.date != null ? dateDE(r[c.date]) : fileDate; const q = numDE(r[c.qty]); if(!q){ skipped++; continue; }
    const art = c.art != null ? r[c.art] : '', name = c.name != null ? r[c.name] : art;
    let g = c.gross != null ? numDE(r[c.gross]) : (c.price != null ? numDE(r[c.price]) * q : 0);
    const key = posKey(art, name); let mid = S.posMap[key];
    if(mid === undefined){ const m = autoMatch(name); if(m) mid = m.id; }
    if(!date){ skipped++; continue; }
    lines.push({date, key, name:String(name).trim(), art:String(art||'').trim(), q, g, mid: mid ?? null});
    if(!mid) unknown.set(key, {key, name:String(name).trim(), art:String(art||'').trim(), q:(unknown.get(key)?.q||0)+q});
  }
  return {cols:c, head, lines, unknown:[...unknown.values()], skipped};
}
function importApply(res, {replace=true, stock=false}={}){
  const days = {};
  for(const l of res.lines){ const mid = S.posMap[l.key] !== undefined ? S.posMap[l.key] : l.mid; if(!mid || mid === '-') continue; (days[l.date] = days[l.date] || new Map()); const a = days[l.date].get(mid) || [0,0]; a[0] += l.q; a[1] += l.g; days[l.date].set(mid, a); }
  let n = 0, portions = 0; const acc = new Map();
  for(const [day, mp] of Object.entries(days)){
    const rows = [...mp.entries()].map(([mid,[q,g]]) => [mid, Math.round(q*1000)/1000, Math.round(g*100)/100]);
    if(replace || !S.salesDays[day]) S.salesDays[day] = rows; else { const cur = new Map(S.salesDays[day].map(r=>[r[0],r])); rows.forEach(r => { const c = cur.get(r[0]); if(c){ c[1] += r[1]; c[2] += r[2]; } else cur.set(r[0], r); }); S.salesDays[day] = [...cur.values()]; }
    n++; rows.forEach(([mid,q]) => { portions += q; if(stock){ const m = S.menu.find(x=>x.id===mid); const c = m && m.card && C(m.card); if(c) explode(c, q, acc); } });
  }
  Object.keys(days).forEach(d => markRealDay(d));
  if(stock && acc.size){ const grp = uid('sb'); acc.forEach((q,pid) => { const before = S.moves.length; addMove('sale', pid, -Math.round(q*1000)/1000, 'Kassen-Import'); if(S.moves.length > before) S.moves[0].grp = grp; }); S.saleGroups = S.saleGroups || {}; S.saleGroups[grp] = {day:null, n:Math.round(portions), rows:null, gross:0, imp:true}; }
  S.salesImports.unshift({date:new Date().toISOString(), days:n, portions:Math.round(portions), by:me().name, stock});
  if(S.salesDemo){ /* echte Daten: Demodaten entfernen, damit nichts vermischt wird */ }
  return {days:n, portions};
}
