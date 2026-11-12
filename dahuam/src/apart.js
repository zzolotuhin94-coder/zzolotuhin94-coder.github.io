/* =====================================================================
   Apartments: die Ferienwohnungen neben der Restobar.
   Übersicht (heute, die Woche) · Reinigung nach jeder Abreise · Verwalten.
   Buchungen von Hand oder aus der Kalenderdatei (.ics) von Booking.com, Airbnb und anderen.
   Zustand: S.apart = {v, apts, bookings, cleans, settings}. Alles bleibt auf dem Gerät
   (wie alle Daten der App) und ist in der Sicherung enthalten.
   Buchungen werden 13 Monate nach der Abreise gelöscht, die Reinigungen dazu ebenso.
   ===================================================================== */
const AP_KEEP_DAYS = 397;                 // 13 Monate nach der Abreise (13 Monate sind höchstens 397 Tage)
const AP_CH = {booking:'Booking.com', direkt:'direkt', airbnb:'Airbnb', andere:'andere'};
const AP_LIST = ['Betten frisch bezogen', 'Bad', 'Küche', 'Müll', 'Handtücher', 'Endkontrolle'];
const AP_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const AP_DATE = /^\d{4}-\d{2}-\d{2}$/;
const AP_NCOL = 8;
ICO.apart = '<path d="M3 19V6M3 15h18v4M21 15v-2.5A2.5 2.5 0 0 0 18.5 10H11v5"/><circle cx="7" cy="12" r="1.8"/>';
TABS.push(['apart', 'Apartments']);

/* ---------- Zustand ---------- */
function apDefaults(){ return {v:1, apts:[], bookings:[], cleans:{}, settings:{checkin:'15:00', checkout:'10:00', list:AP_LIST.map((t, i) => ({id:'al_' + (i + 1), t}))}}; }
function apMigrate(d){
  if(!d || typeof d !== 'object') return d;
  const obj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const fresh = !obj(d.apart); if(fresh) d.apart = apDefaults();
  const a = d.apart; const today = isoDate(new Date()); const cut = dAdd(today, -AP_KEEP_DAYS);
  a.v = 1;
  if(!obj(a.settings)) a.settings = apDefaults().settings;
  const st = a.settings;
  if(!AP_TIME.test(st.checkin || '')) st.checkin = '15:00';
  if(!AP_TIME.test(st.checkout || '')) st.checkout = '10:00';
  st.list = (Array.isArray(st.list) ? st.list : []).filter(x => obj(x) && x.id && String(x.t || '').trim()).map(x => ({id:String(x.id), t:String(x.t).slice(0, 60)})).slice(0, 20);
  const int = (v, lo, hi, def) => { const n = Math.round(+v); return isFinite(n) && n >= lo && n <= hi ? n : def; };
  a.apts = (Array.isArray(a.apts) ? a.apts : []).filter(x => obj(x) && x.id).map((x, i) => { x.id = String(x.id); x.name = String(x.name || 'Apartment').slice(0, 60); x.guests = int(x.guests, 1, 40, 2); x.beds = int(x.beds, 0, 40, x.guests);
    x.note = String(x.note || '').slice(0, 200); x.color = int(x.color, 0, AP_NCOL - 1, i % AP_NCOL); if(!obj(x.ics)) delete x.ics; return x; });
  const ids = new Set(a.apts.map(x => x.id));
  a.bookings = (Array.isArray(a.bookings) ? a.bookings : []).filter(b => obj(b) && b.id && ids.has(b.apt) && AP_DATE.test(b.from || '') && AP_DATE.test(b.to || '') && b.to > b.from && b.to >= cut).map(b => {
    b.guest = String(b.guest || '').slice(0, 80); b.n = b.n == null || b.n === '' ? null : int(b.n, 1, 40, null); b.ch = AP_CH[b.ch] ? b.ch : 'andere';
    b.note = String(b.note || '').slice(0, 200); b.arr = AP_TIME.test(b.arr || '') ? b.arr : ''; b.src = b.src === 'ics' ? 'ics' : 'hand';
    if(b.uid != null) b.uid = String(b.uid).slice(0, 200); if(b.sum != null) b.sum = String(b.sum).slice(0, 80); if(b.desc != null) b.desc = String(b.desc).slice(0, 200); return b; });
  if(!obj(a.cleans)) a.cleans = {};
  Object.keys(a.cleans).forEach(k => { const r = a.cleans[k]; const m = /^(.+)\|(\d{4}-\d{2}-\d{2})$/.exec(k);
    if(!obj(r) || !m || !ids.has(m[1]) || m[2] < cut){ delete a.cleans[k]; return; }
    r.who = String(r.who || '').slice(0, 40); r.note = String(r.note || '').slice(0, 160); if(!obj(r.items)) r.items = {}; if(!Array.isArray(r.hist)) r.hist = []; r.hist = r.hist.filter(obj).slice(-30); if(r.done && !obj(r.done)) delete r.done; });
  if(fresh && d.demo){ try { apDemo(d); } catch(e){ console.warn('Apartments-Beispiel:', e); } }
  return d;
}
function apS(){ if(!S.apart || !Array.isArray(S.apart.apts) || !Array.isArray(S.apart.bookings) || !S.apart.cleans) apMigrate(S); return S.apart; }
/* erfundene Beispiele rund um heute, als Beispiel markiert */
function apDemo(d){
  const a = d.apart; const T = isoDate(new Date()); const D = n => dAdd(T, n);
  const team = d.team && Array.isArray(d.team.people) ? d.team.people.filter(p => p.demo && p.active !== false).map(p => p.name) : [];
  const w1 = team[0] || '', w2 = team[1] || team[0] || '';
  a.apts = [
    {id:'apt_d1', name:'Apartment Bergblick', guests:4, beds:4, note:'Schlüsselbox 1234', color:1, demo:true},
    {id:'apt_d2', name:'Apartment Sonnseite', guests:2, beds:2, note:'Schlüsselbox 5678', color:2, demo:true},
    {id:'apt_d3', name:'Studio Zirbe', guests:2, beds:2, note:'', color:5, demo:true},
  ];
  const b = (id, apt, from, to, x) => Object.assign({id, apt, from, to, guest:'', n:null, ch:'direkt', note:'', arr:'', src:'hand', demo:true}, x);
  a.bookings = [
    b('bk_d1', 'apt_d1', D(-4), D(0), {guest:'Familie Berger', n:4, ch:'booking'}),
    b('bk_d2', 'apt_d1', D(0), D(4), {guest:'Herr Lechner', n:2, ch:'direkt', note:'Ankunft spät, ca. 21 Uhr'}),
    b('bk_d3', 'apt_d2', D(-1), D(3), {ch:'booking', src:'ics', uid:'demo-1@beispiel', sum:'CLOSED - Not available'}),
    b('bk_d4', 'apt_d2', D(4), D(8), {guest:'Frau Mair', n:2, ch:'direkt'}),
    b('bk_d5', 'apt_d3', D(-6), D(-2), {guest:'Paar aus Wien', n:2, ch:'airbnb'}),
    b('bk_d6', 'apt_d3', D(1), D(6), {guest:'Familie Huber', n:2, ch:'airbnb', note:'Kinderbett aufstellen'}),
  ];
  a.cleans = {};
  a.cleans['apt_d3|' + D(-2)] = {who:w2, note:'', items:{}, hist:[], done:{b:w2 || 'Team', a:'11:40', at:D(-2) + 'T11:40:00', d:D(-2)}, demo:true};
  if(w1) a.cleans['apt_d1|' + D(0)] = {who:w1, note:'', items:{}, hist:[], demo:true};
  a.demo = true;
}
function apDemoRemove(d){
  const a = (d || S).apart; if(!a) return;
  const gone = new Set(a.apts.filter(x => x.demo).map(x => x.id));
  a.apts = a.apts.filter(x => !x.demo);
  a.bookings = a.bookings.filter(b => !b.demo && !gone.has(b.apt));
  Object.keys(a.cleans).forEach(k => { if(a.cleans[k].demo || gone.has(k.split('|')[0])) delete a.cleans[k]; });
  a.demo = false;
}
function apHasDemo(){ const a = S && S.apart; return !!(a && (a.apts.some(x => x.demo) || a.bookings.some(b => b.demo))); }

/* ---------- Kleines ---------- */
const apToday = () => todayStr();
function apApt(id){ return apS().apts.find(x => x.id === id) || null; }
function apBk(id){ return apS().bookings.find(b => b.id === id) || null; }
function apCol(x){ return `--pc:var(--tm${(x ? x.color : 0) % AP_NCOL})`; }
function apDay(D){ return `${tmWdShort(D)} ${tmDm(D)}`; }
function apDayLong(D){ return dParse(D).toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long'}); }
function apNights(b){ return Math.round((dParse(b.to) - dParse(b.from)) / 864e5); }
function apPers(n){ return n ? (n === 1 ? '1 Person' : n + ' Personen') : ''; }
function apGuestTxt(b){ return b.guest || (b.src === 'ics' ? (b.ch === 'booking' ? 'Booking.com, ohne Namen' : b.ch === 'airbnb' ? 'Airbnb, ohne Namen' : 'aus dem Kalender') : 'ohne Namen'); }
function apBkTxt(b){ return [apGuestTxt(b), apPers(b.n), b.note].filter(Boolean).join(' · '); }
function apOverlap(x, y){ return x.from < y.to && y.from < x.to; }
function apConflicts(b, list){ return (list || apS().bookings).filter(o => o.id !== b.id && o.apt === b.apt && apOverlap(o, b)); }
function apArrTime(b){ return (b && b.arr) || apS().settings.checkin; }
function apView(){ const v = view.ap || (view.ap = {tab:'uebersicht', w:null, reveal:{}}); const t = apToday(); if(!AP_DATE.test(v.w || '')) v.w = tmMonday(t); else v.w = tmMonday(v.w); if(!v.reveal) v.reveal = {}; if(!['uebersicht', 'reinigung', 'verwalten'].includes(v.tab)) v.tab = 'uebersicht'; if(v.tab === 'verwalten' && !canEditAll()) v.tab = 'uebersicht'; return v; }
function apPeople(){ try { return tmS().people.filter(p => p.active !== false).map(p => p.name); } catch(e){ return []; } }
function apNowHm(){ return tmNowHm(); }
function apWho(){ return tmWhoName(); }

/* Was an einem Tag in einem Apartment passiert */
function apDayInfo(apt, D){
  const bs = apS().bookings.filter(b => b.apt === apt.id);
  const out = bs.filter(b => b.to === D).sort((x, y) => x.from.localeCompare(y.from));
  const inn = bs.filter(b => b.from === D).sort((x, y) => x.to.localeCompare(y.to));
  const stay = bs.find(b => b.from < D && b.to > D) || null;
  const night = bs.find(b => b.from <= D && b.to > D) || null;
  const next = bs.filter(b => b.from > D).sort((x, y) => x.from.localeCompare(y.from))[0] || null;
  return {out, inn, stay, night, next};
}

/* ---------- Reinigung: eine Aufgabe je Abreise (Apartment und Tag) ---------- */
function apKey(apt, D){ return apt + '|' + D; }
function apTask(apt, D){
  const a = apS(); const x = apApt(apt); if(!x) return null;
  const out = a.bookings.filter(b => b.apt === apt && b.to === D); if(!out.length) return null;
  const next = a.bookings.filter(b => b.apt === apt && b.from >= D && !out.includes(b)).sort((p, q) => p.from.localeCompare(q.from) || (p.arr || '').localeCompare(q.arr || ''))[0] || null;
  const rec = a.cleans[apKey(apt, D)] || null; const wechsel = !!(next && next.from === D);
  return {key:apKey(apt, D), apt:x, D, out, next, rec, done:!!(rec && rec.done), wechsel, until:wechsel ? apArrTime(next) : ''};
}
function apTasks(from, to){
  const a = apS(); const seen = new Set(); const out = [];
  a.bookings.filter(b => b.to >= from && b.to <= to).sort((p, q) => p.to.localeCompare(q.to)).forEach(b => { const k = apKey(b.apt, b.to); if(seen.has(k)) return; seen.add(k); const t = apTask(b.apt, b.to); if(t) out.push(t); });
  const ord = new Map(a.apts.map((x, i) => [x.id, i]));
  return out.sort((p, q) => p.D.localeCompare(q.D) || (q.wechsel - p.wechsel) || (ord.get(p.apt.id) - ord.get(q.apt.id)));
}
/* noch offen von früher (höchstens 14 Tage zurück) */
function apOverdue(T){ return apTasks(dAdd(T, -14), dAdd(T, -1)).filter(t => !t.done); }
function apUrgency(t){
  const T = apToday(); if(t.done) return ''; if(t.D < T) return 'over';
  if(t.D === T && t.wechsel){ return hm(apNowHm()) >= hm(t.until) ? 'late' : 'urgent'; }
  return '';
}
function apTaskWhen(t){
  if(t.wechsel) return `Wechseltag · bis Anreise um ${t.until} Uhr`;
  if(t.next) return `nächste Anreise ${apDay(t.next.from)}`;
  return 'keine Anreise geplant';
}
function apCleanRec(key){ const a = apS(); return a.cleans[key] || (a.cleans[key] = {who:'', note:'', items:{}, hist:[]}); }
function apCleanTidy(key){ const a = apS(); const r = a.cleans[key]; if(r && !r.done && !r.who && !r.note && !Object.keys(r.items).length && !r.hist.length) delete a.cleans[key]; }
function apHist(r, k, v){ r.hist.push({k, v:v == null ? '' : String(v).slice(0, 160), b:apWho(), at:new Date().toISOString()}); r.hist = r.hist.slice(-30); delete r.demo; }
/* Häkchen „fertig, bereit für Anreise“: sofort, mit Rückgängig für ein paar Sekunden */
function apTick(key){
  const [apt, D] = key.split('|'); const t = apTask(apt, D); if(!t) return;
  const r = apCleanRec(key); const y = window.scrollY;
  if(r.done){
    if(!canEditAll()){ toast(`Fertig gemeldet von ${r.done.b}, ${r.done.a} Uhr. Zurücknehmen kann das nur der Chef.`); return; }
    const old = JSON.parse(JSON.stringify(r)); apHist(r, 'undone', `${r.done.b}, ${r.done.a} Uhr`); delete r.done; save(); render(); window.scrollTo(0, y);
    toast('Häkchen entfernt', {action:() => { apS().cleans[key] = old; save(); render(); }}); return;
  }
  const old = JSON.parse(JSON.stringify(r)); const fresh = !t.rec;
  r.done = {b:apWho(), a:apNowHm(), at:new Date().toISOString(), d:apToday()}; delete r.demo; save(); render(); window.scrollTo(0, y);
  toast(`${t.apt.name}: bereit für Anreise`, {action:() => { const a = apS(); if(fresh) delete a.cleans[key]; else a.cleans[key] = old; save(); render(); }});
}
/* Wäsche: Sets je Abreise = Betten des Apartments */
function apLaundry(W){
  const ts = apTasks(W, dAdd(W, 6)); const per = new Map();
  ts.forEach(t => { const p = per.get(t.apt.id) || {apt:t.apt, n:0}; p.n++; per.set(t.apt.id, p); });
  const ord = apS().apts; const list = [...per.values()].sort((p, q) => ord.indexOf(p.apt) - ord.indexOf(q.apt)); return {sets:list.reduce((s, p) => s + p.n * (+p.apt.beds || 0), 0), deps:ts.length, list};
}

/* ---------- Kalenderdatei (.ics) lesen ---------- */
function apIcsUnesc(s){ return String(s).replace(/\\([\\;,nN])/g, (m, c) => c === 'n' || c === 'N' ? '\n' : c); }
function apIcsDate(v, params){
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(String(v || '').trim()); if(!m) return null;
  const [, y, mo, d, h, mi, s, z] = m; if(+y < 2000 || +y > 2100 || +mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null;
  if(h != null && z && !(params && params.TZID)){ const dt = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s || 0))); return {d:isoDate(dt), t:String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0')}; }
  const iso = `${y}-${mo}-${d}`; if(isoDate(dParse(iso)) !== iso) return null;
  return {d:iso, t:h != null ? `${h}:${mi}` : ''};
}
function apIcsParse(text){
  const raw = String(text == null ? '' : text).replace(/^﻿/, '');
  if(raw.length > 3e6) return {err:'Die Datei ist zu groß für einen Kalender.'};
  if(!/BEGIN:VCALENDAR/i.test(raw)) return {err:'Das ist keine Kalenderdatei. Erwartet wird eine .ics-Datei, die mit „BEGIN:VCALENDAR“ beginnt.'};
  const lines = raw.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const cal = {prodid:'', name:''}; const events = []; let ev = null, depth = 0;
  for(const line of lines){
    if(!line.trim()) continue;
    const ci = (() => { let q = false; for(let i = 0; i < line.length; i++){ const c = line[i]; if(c === '"') q = !q; else if(c === ':' && !q) return i; } return -1; })();
    if(ci < 0) continue;
    const head = line.slice(0, ci), val = line.slice(ci + 1); const parts = head.split(';'); const name = parts[0].trim().toUpperCase();
    const params = {}; parts.slice(1).forEach(p => { const k = p.indexOf('='); if(k > 0) params[p.slice(0, k).trim().toUpperCase()] = p.slice(k + 1).replace(/^"|"$/g, ''); });
    if(name === 'BEGIN'){ if(val.trim().toUpperCase() === 'VEVENT' && !ev){ ev = {p:{}}; depth = 0; } else if(ev) depth++; continue; }
    if(name === 'END'){ if(ev && depth > 0){ depth--; continue; } if(val.trim().toUpperCase() === 'VEVENT' && ev){ events.push(ev); ev = null; } continue; }
    if(ev){ if(depth === 0 && !(name in ev.p)) ev.p[name] = {v:val, params}; }
    else if(name === 'PRODID') cal.prodid = val.trim();
    else if(name === 'X-WR-CALNAME') cal.name = apIcsUnesc(val).trim();
    if(events.length > 3000) break;
  }
  const out = events.map((e, i) => {
    const p = e.p; const g = k => p[k] ? p[k].v : '';
    const s = apIcsDate(g('DTSTART'), p.DTSTART && p.DTSTART.params); let en = p.DTEND ? apIcsDate(g('DTEND'), p.DTEND.params) : null;
    if(s && !en){ const dm = /^P(?:(\d+)W)?(?:(\d+)D)?/.exec(g('DURATION').trim()); const n = dm ? (+(dm[1] || 0)) * 7 + (+(dm[2] || 0)) : 0; en = {d:dAdd(s.d, Math.max(1, n)), t:''}; }
    const sum = apIcsUnesc(g('SUMMARY')).replace(/\s+/g, ' ').trim(), desc = apIcsUnesc(g('DESCRIPTION')).trim();
    const uid = apIcsUnesc(g('UID')).trim();
    const o = {i, uid, sum:sum.slice(0, 80), desc:desc.slice(0, 200), from:s ? s.d : '', to:en ? en.d : '', status:g('STATUS').trim().toUpperCase()};
    if(!s) o.err = 'Anreise fehlt oder ist unlesbar';
    else if(!en || !(o.to > o.from)) o.err = 'Abreise fehlt oder liegt nicht nach der Anreise';
    if(!o.uid) o.uid = 'ohne-uid:' + o.from + ':' + o.to + ':' + o.sum;
    return o; });
  return {cal, events:out};
}
/* Welcher Anbieter? Aus PRODID und UID. Booking liefert nur belegte Zeiträume ohne Namen. */
function apIcsKind(cal, events){
  const s = (cal.prodid + ' ' + events.slice(0, 20).map(e => e.uid).join(' ')).toLowerCase();
  if(/booking\.com/.test(s) || (events.length && events.every(e => /^closed\b/i.test(e.sum)))) return 'booking';
  if(/airbnb/.test(s)) return 'airbnb';
  return 'andere';
}
/* Vergleich mit den Buchungen des Apartments: neu, geändert, unverändert, entfällt, ausgelassen, verbunden */
function apIcsPlan(parsed, aptId){
  const a = apS(); const T = apToday(); const cut = dAdd(T, -AP_KEEP_DAYS); const kind = apIcsKind(parsed.cal, parsed.events);
  const mine = a.bookings.filter(b => b.apt === aptId); const byUid = new Map(mine.filter(b => b.uid).map(b => [b.uid, b]));
  const items = []; const seen = new Set();
  parsed.events.forEach(e => {
    const it = {...e, kind};
    if(e.err){ it.st = 'skip'; it.why = e.err; items.push(it); return; }
    if(seen.has(e.uid)){ it.st = 'skip'; it.why = 'doppelt in der Datei'; items.push(it); return; }
    seen.add(e.uid);
    if(e.status === 'CANCELLED'){ it.st = byUid.has(e.uid) && byUid.get(e.uid).to >= T ? 'weg' : 'skip'; it.why = 'im Kalender storniert'; if(it.st === 'weg') it.b = byUid.get(e.uid); items.push(it); return; }
    if(kind === 'airbnb' && /not available|blocked/i.test(e.sum)){ it.st = 'skip'; it.why = 'nur gesperrt, keine Buchung'; items.push(it); return; }
    if(e.to < cut){ it.st = 'skip'; it.why = 'älter als 13 Monate'; items.push(it); return; }
    const b = byUid.get(e.uid);
    if(b){ it.b = b; it.st = b.from === e.from && b.to === e.to && (b.sum || '') === e.sum ? 'gleich' : 'akt'; }
    else { const twin = mine.find(x => !x.uid && x.from === e.from && x.to === e.to); if(twin){ it.st = 'link'; it.b = twin; } else it.st = 'neu'; }
    if(it.st === 'neu' || it.st === 'akt'){ const probe = {id:b ? b.id : '', apt:aptId, from:e.from, to:e.to}; const c = mine.filter(x => x !== b && x.uid !== e.uid && apOverlap(x, probe) && !(x.uid && parsed.events.some(z => z.uid === x.uid)));
      if(c.length) it.warn = 'überschneidet sich mit ' + c.map(x => `${apGuestTxt(x)} (${apDay(x.from)}–${apDay(x.to)})`).join(', '); }
    items.push(it); });
  // was nicht mehr im Kalender steht: kommende und laufende Buchungen entfallen, vergangene bleiben
  mine.filter(b => b.uid && !seen.has(b.uid) && b.to >= T).forEach(b => items.push({uid:b.uid, from:b.from, to:b.to, sum:b.sum || '', st:'weg', b, why:'steht nicht mehr im Kalender'}));
  const n = k => items.filter(x => x.st === k).length;
  return {kind, cal:parsed.cal, items, counts:{neu:n('neu'), akt:n('akt'), gleich:n('gleich'), weg:n('weg'), skip:n('skip'), link:n('link')}};
}
function apIcsApply(plan, aptId, file){
  const a = apS(); const x = apApt(aptId); if(!x) return null;
  const snap = JSON.stringify({bookings:a.bookings, ics:x.ics || null});
  const now = new Date().toISOString(), by = me().name;
  plan.items.forEach(it => {
    if(it.st === 'neu') a.bookings.push({id:uid('bk'), apt:aptId, from:it.from, to:it.to, guest:'', n:null, ch:it.kind, note:'', arr:'', src:'ics', uid:it.uid, sum:it.sum, desc:it.desc, at:now, by});
    else if(it.st === 'akt'){ Object.assign(it.b, {from:it.from, to:it.to, sum:it.sum, desc:it.desc}); delete it.b.demo; }
    else if(it.st === 'link'){ Object.assign(it.b, {uid:it.uid, sum:it.sum, desc:it.desc}); delete it.b.demo; }
    else if(it.st === 'weg') a.bookings = a.bookings.filter(b => b !== it.b);
  });
  x.ics = {at:now, file:String(file || '').slice(0, 80), kind:plan.kind, n:plan.items.filter(i => ['neu', 'akt', 'gleich', 'link'].includes(i.st)).length};
  return snap;
}
function apIcsUndo(aptId, snap){ const a = apS(); const x = apApt(aptId); const o = JSON.parse(snap); a.bookings = o.bookings; if(x){ if(o.ics) x.ics = o.ics; else delete x.ics; } save(); render(); toast('Rückgängig gemacht: Buchungen wie vor dem Import'); }

/* =====================================================================
   Oberfläche
   ===================================================================== */
function apHead(v){
  const a = apS(); const T = apToday(); const ro = !canEditAll();
  const tabs = [['uebersicht', 'Übersicht'], ['reinigung', 'Reinigung']].concat(ro ? [] : [['verwalten', 'Verwalten']]);
  let sub = '', btns = '';
  if(v.tab === 'uebersicht'){ let ni = 0, no = 0, occ = 0; a.apts.forEach(x => { const i = apDayInfo(x, T); ni += i.inn.length; no += i.out.length; if(i.night) occ++; });
    sub = `${apDayLong(T)}${a.apts.length ? ` · ${ni === 1 ? '1 Anreise' : ni + ' Anreisen'} · ${no === 1 ? '1 Abreise' : no + ' Abreisen'} · heute Nacht ${occ} von ${a.apts.length} belegt` : ''}${apHasDemo() ? ' · Beispiel, Namen sind erfunden' : ''}`;
    btns = ro || !a.apts.length ? '' : `<button type="button" class="btn primary" data-act="apBookNew">${ico('plus')}Buchung</button>`; }
  else if(v.tab === 'reinigung'){ sub = 'Nach jeder Abreise eine Reinigung. Ein Tipp auf das Kästchen meldet: fertig, bereit für Anreise.';
    btns = a.apts.length && !FRAMED ? `<button type="button" class="btn" data-act="apPdf">${ico('download')}Wochenplan als PDF</button>` : ''; }
  else { sub = 'Ihre Apartments, Kalender von Booking.com und anderen, die Reinigungs-Checkliste.'; btns = `<button type="button" class="btn primary" data-act="apAptNew">${ico('plus')}Apartment</button>`; }
  return `<div class="page-h"><div><h1>Apartments</h1><p class="sub">${esc(sub)}</p></div>${btns ? `<div class="row-btns">${btns}</div>` : ''}</div>
    <div class="toolbar tabs">${seg('apTab', v.tab, tabs)}</div>`;
}
function renderApart(){
  const v = apView(); const a = apS();
  let body;
  if(!a.apts.length && v.tab !== 'verwalten') body = `<section class="pl-closed ap-none"><h2>Noch kein Apartment</h2><p>${canEditAll() ? 'Legen Sie zuerst Ihre Apartments an. Danach tragen Sie Buchungen ein oder laden den Kalender von Booking.com.' : 'Der Chef legt die Apartments an.'}</p>${canEditAll() ? `<button type="button" class="btn primary" data-act="apAptNew">${ico('plus')}Apartment anlegen</button>` : ''}</section>`;
  else body = v.tab === 'reinigung' ? apCleanHtml(v) : v.tab === 'verwalten' ? apAdminHtml(v) : apOverviewHtml(v);
  return `<div class="ap">${apHead(v)}${body}</div>`;
}

/* ---------- Übersicht: heute und die Woche ---------- */
function apTodayHtml(){
  const a = apS(); const T = apToday();
  const rows = a.apts.map(x => {
    const i = apDayInfo(x, T); const t = i.out.length ? apTask(x.id, T) : null; const lines = []; let st = '', cls = '';
    i.out.forEach(b => lines.push(`<button type="button" class="ap-ev" data-act="apBook" data-id="${b.id}"><span class="ap-k out">Abreise</span><span class="ap-et">${esc(apBkTxt(b))}</span></button>`));
    i.inn.forEach(b => lines.push(`<button type="button" class="ap-ev" data-act="apBook" data-id="${b.id}"><span class="ap-k in">Anreise${b.arr ? ' ' + esc(b.arr) : ''}</span><span class="ap-et">${esc(apBkTxt(b))}</span></button>`));
    if(t){ const u = apUrgency(t); lines.push(`<button type="button" class="ap-ev ap-evc" data-act="apClean" data-id="${esc(t.key)}"><span class="ap-k">Reinigung</span><span class="ap-et">${t.done ? `fertig · ${esc(t.rec.done.b)}, ${esc(t.rec.done.a)} Uhr` : `${u ? `<span class="${u === 'late' ? 'bad-t' : 'warn-t'}">offen${t.wechsel ? `, bis ${esc(t.until)} Uhr` : ''}</span>` : 'offen'}${t.rec && t.rec.who ? ' · ' + esc(t.rec.who) : ''}`}</span></button>`); }
    if(i.out.length && i.inn.length){ st = 'Wechseltag'; cls = t && !t.done ? 'warn-t' : ''; }
    else if(i.inn.length) st = 'Anreise';
    else if(i.out.length) st = 'Abreise';
    else if(i.stay){ st = `belegt bis ${apDay(i.stay.to)}`; lines.push(`<button type="button" class="ap-ev" data-act="apBook" data-id="${i.stay.id}"><span class="ap-k">Gast</span><span class="ap-et">${esc(apBkTxt(i.stay))}</span></button>`); }
    else { st = i.next ? `frei bis ${apDay(i.next.from)}` : 'frei'; cls = 'ap-free'; }
    return `<li class="ap-r" style="${apCol(x)}"><span class="ap-rn"><b><i class="ap-dot" aria-hidden="true"></i>${esc(x.name)}</b><span class="ap-st ${cls}">${esc(st)}</span></span>${lines.length ? `<span class="ap-evs">${lines.join('')}</span>` : ''}</li>`; });
  return `<h2 class="ap-h">Heute</h2><ul class="ap-rows">${rows.join('')}</ul>`;
}
function apWeekNav(v){
  const W = v.w, T = apToday(); const cur = tmMonday(T) === W;
  return `<div class="ap-wk"><button type="button" class="icon-btn" data-act="apWeek" data-id="-1" aria-label="Woche davor">${ico('arrow')}</button><span class="ap-wkl"><b>KW ${tmKw(W)}</b><small>${esc(tmRangeTxt(W))}</small></span><button type="button" class="icon-btn" data-act="apWeek" data-id="1" aria-label="Woche danach">${ico('arrow', 'flip')}</button>${cur ? '' : '<button type="button" class="btn sm ghost" data-act="apWeek" data-id="0">Diese Woche</button>'}</div>`;
}
/* Zeitleiste: je Apartment eine Zeile; ein Aufenthalt reicht vom Nachmittag der Anreise bis zum Vormittag der Abreise */
function apGridHtml(W){
  const a = apS(); const T = apToday(); const end = dAdd(W, 7); const days = [0, 1, 2, 3, 4, 5, 6].map(i => dAdd(W, i));
  const hcol = (D, pm) => { const i = Math.round((dParse(D) - dParse(W)) / 864e5); return 2 + i * 2 + (pm ? 1 : 0); };
  const head = `<div class="ap-g ap-gh"><span class="ap-gn"></span>${days.map((D, i) => `<span class="ap-gd ${D === T ? 'today' : ''}" style="grid-column:${2 + i * 2} / span 2"><b>${tmWdShort(D)}</b> ${tmDm(D)}</span>`).join('')}</div>`;
  const ti = days.indexOf(T);
  const rows = a.apts.map(x => {
    const bs = a.bookings.filter(b => b.apt === x.id && b.from < end && b.to > W).sort((p, q) => p.from.localeCompare(q.from));
    const bars = bs.map(b => { const s = b.from < W ? 2 : hcol(b.from, true), e = b.to >= end ? 16 : hcol(b.to, false) + 1; const clash = apConflicts(b).length > 0;
      return `<button type="button" class="ap-bar ${b.from < W ? 'cut-l' : ''} ${b.to >= end ? 'cut-r' : ''} ${clash ? 'clash' : ''}" style="grid-column:${s} / ${e}" data-act="apBook" data-id="${b.id}" title="${esc(apDay(b.from) + ' – ' + apDay(b.to) + ' · ' + apBkTxt(b))}"><b>${esc(apGuestTxt(b))}</b>${b.n ? `<small>${b.n}</small>` : ''}</button>`; });
    // freie Nächte: Lücken zwischen den Aufenthalten
    const gaps = []; let c = W; const nightOk = D => !bs.some(b => b.from <= D && b.to > D);
    for(const D of days){ if(nightOk(D)){ if(!gaps.length || gaps[gaps.length - 1].e !== D) gaps.push({s:D, e:dAdd(D, 1)}); else gaps[gaps.length - 1].e = dAdd(D, 1); } }
    const free = gaps.map(g => { const n = Math.round((dParse(g.e) - dParse(g.s)) / 864e5); const s = hcol(g.s, true), e = g.e >= end ? 16 : hcol(g.e, false) + 1;
      return `<span class="ap-free-b" style="grid-column:${s} / ${e}">frei${n > 1 ? ` · ${n} Nächte` : ''}</span>`; });
    void c;
    return `<div class="ap-g ap-gr" style="${apCol(x)}"><span class="ap-gn"><i class="ap-dot" aria-hidden="true"></i><b>${esc(x.name)}</b></span>${ti >= 0 ? `<span class="ap-gt" style="grid-column:${2 + ti * 2} / span 2" aria-hidden="true"></span>` : ''}${days.map((D, i) => `<span class="ap-gc" style="grid-column:${2 + i * 2} / span 2" aria-hidden="true"></span>`).join('')}${free.join('')}${bars.join('')}</div>`; });
  return `<div class="ap-grid" role="group" aria-label="Belegung der Woche">${head}${rows.join('')}</div>`;
}
/* Am Handy: die Woche als Liste der Tage */
function apDaysHtml(W){
  const a = apS(); const T = apToday(); const days = [0, 1, 2, 3, 4, 5, 6].map(i => dAdd(W, i));
  return `<ol class="ap-days">${days.map(D => {
    const ev = []; let occ = 0;
    a.apts.forEach(x => { const i = apDayInfo(x, D); if(i.night) occ++;
      i.out.forEach(b => ev.push(`<button type="button" class="ap-dl" style="${apCol(x)}" data-act="apBook" data-id="${b.id}"><span class="ap-k out">Abreise</span><span class="ap-et"><b>${esc(x.name)}</b><small>${esc(apBkTxt(b))}</small></span></button>`));
      i.inn.forEach(b => ev.push(`<button type="button" class="ap-dl" style="${apCol(x)}" data-act="apBook" data-id="${b.id}"><span class="ap-k in">Anreise</span><span class="ap-et"><b>${esc(x.name)}</b><small>${esc(apBkTxt(b))}</small></span></button>`)); });
    return `<li class="${D === T ? 'today' : ''}"><div class="ap-dh"><b>${D === T ? 'Heute' : tmWdShort(D)}</b> ${tmDm(D)}<span>${occ} von ${a.apts.length} belegt</span></div>${ev.length ? ev.join('') : '<p class="ap-quiet">keine Anreise, keine Abreise</p>'}</li>`; }).join('')}</ol>`;
}
function apOverviewHtml(v){
  return `${apTodayHtml()}<div class="ap-wh"><h2 class="ap-h">Woche</h2>${apWeekNav(v)}</div>${apGridHtml(v.w)}${apDaysHtml(v.w)}`;
}

/* ---------- Reinigung ---------- */
function apCleanRow(t){
  const u = apUrgency(t); const r = t.rec; const on = t.done; const items = apS().settings.list; const nIt = r ? items.filter(i => r.items[i.id]).length : 0;
  const sub = on ? `bereit für Anreise · ${esc(r.done.b)}, ${esc(r.done.a)} Uhr${r.done.d && r.done.d !== t.D ? ' am ' + esc(apDay(r.done.d)) : ''}`
    : `${u === 'over' ? `<span class="bad-t">offen seit ${esc(apDay(t.D))}</span> · ` : ''}${u === 'urgent' || u === 'late' ? `<span class="${u === 'late' ? 'bad-t' : 'warn-t'}">${esc(apTaskWhen(t))}</span>` : esc(apTaskWhen(t))}${nIt && items.length ? ` · ${nIt} von ${items.length}` : ''}`;
  const who = r && r.who ? esc(r.who) : '';
  return `<li class="ap-cl ck-i ${on ? 'on' : ''} ${u}" style="${apCol(t.apt)}"><button type="button" role="checkbox" aria-checked="${on}" class="ap-ck" data-act="apTick" data-id="${esc(t.key)}" aria-label="${esc(t.apt.name)}: fertig, bereit für Anreise"><span class="ck-box" aria-hidden="true">${ico('check')}</span></button>
    <button type="button" class="ap-cm" data-act="apClean" data-id="${esc(t.key)}"><b><i class="ap-dot" aria-hidden="true"></i>${esc(t.apt.name)}</b><small>${sub}</small>${r && r.note ? `<small class="ap-note">${esc(r.note)}</small>` : ''}</button>
    <button type="button" class="ap-who ${who ? '' : 'none'}" data-act="apWhoDlg" data-id="${esc(t.key)}">${who || 'Wer?'}</button></li>`;
}
function apCleanHtml(v){
  const W = v.w, T = apToday(); const ts = apTasks(W, dAdd(W, 6)); const over = tmMonday(T) === W ? apOverdue(T) : [];
  const overKeys = new Set(over.map(t => t.key)); const wk = ts.filter(t => !overKeys.has(t.key));
  const L = apLaundry(W);
  const days = [...new Set(wk.map(t => t.D))];
  const groups = days.map(D => `<h3 class="ap-ch ${D === T ? 'today' : ''}">${D === T ? 'Heute' : esc(apDay(D))}${D === T ? `<span>${esc(apDay(D))}</span>` : ''}</h3><ul class="ap-cls">${wk.filter(t => t.D === D).map(apCleanRow).join('')}</ul>`).join('');
  const laundry = L.deps ? `<p class="fact ap-wash">Wäsche diese Woche: <b>${L.sets === 1 ? '1 Set' : L.sets + ' Sets'}</b> für ${L.deps === 1 ? '1 Abreise' : L.deps + ' Abreisen'}<small>${L.list.map(p => `${esc(p.apt.name)} ${p.n} × ${p.apt.beds === 1 ? '1 Bett' : p.apt.beds + ' Betten'}`).join(' · ')}</small></p>` : '';
  return `${apWeekNav(v)}${laundry}
    ${over.length ? `<h3 class="ap-ch"><span class="bad-t">Noch offen</span></h3><ul class="ap-cls">${over.map(apCleanRow).join('')}</ul>` : ''}
    ${groups || `<p class="ap-quiet ap-empty">In dieser Woche reist niemand ab.</p>`}
    <datalist id="apPeople">${apPeople().map(n => `<option value="${esc(n)}">`).join('')}</datalist>`;
}
/* Eine Reinigung im Detail: wer, Checkliste, Notiz, fertig; mit Verlauf */
function apCleanDlg(key){
  const [apt, D] = key.split('|'); const t = apTask(apt, D); if(!t) return; const a = apS(); const r0 = t.rec || {who:'', note:'', items:{}, hist:[]}; const list = a.settings.list;
  const info = [`Abreise ${apDay(D)}${t.out.length ? ': ' + t.out.map(apBkTxt).join(', ') : ''}`, t.wechsel ? `Wechseltag: Anreise ${D === apToday() ? 'heute' : 'am ' + apDay(D)} um ${t.until} Uhr${t.next ? ' · ' + apBkTxt(t.next) : ''}` : t.next ? `Nächste Anreise ${apDay(t.next.from)} · ${apBkTxt(t.next)}` : 'Keine Anreise geplant'];
  const hist = (r0.hist || []).slice().reverse().map(h => `<li><span>${esc(fmtDate(h.at))} ${esc(new Date(h.at).toTimeString().slice(0, 5))}</span><span>${esc(h.b)}: ${esc(apHistTxt(h))}</span></li>`).join('');
  tmDialog(`Reinigung · ${t.apt.name}`, `<p class="dlg-p ap-dinfo">${info.map(esc).join('<br>')}</p>
    <label class="f">Wer reinigt?<input name="who" list="apPeopleD" maxlength="40" value="${esc(r0.who || '')}" placeholder="Name" autocomplete="off"><datalist id="apPeopleD">${apPeople().map(n => `<option value="${esc(n)}">`).join('')}</datalist></label>
    ${list.length ? `<fieldset class="ap-list"><legend>Checkliste</legend>${list.map(i => `<label class="tog"><input type="checkbox" name="it" value="${esc(i.id)}" ${r0.items && r0.items[i.id] ? 'checked' : ''}><span></span>${esc(i.t)}</label>`).join('')}</fieldset>` : ''}
    <label class="f">Notiz<input name="note" maxlength="160" value="${esc(r0.note || '')}" placeholder="z. B. Bettwäsche fehlt, Schaden im Bad" autocomplete="off"></label>
    <label class="tog ap-done"><input type="checkbox" name="done" ${t.done ? 'checked' : ''}><span></span>Fertig, bereit für Anreise</label>
    ${t.done ? `<p class="hint" style="margin-top:4px">Gemeldet von ${esc(t.rec.done.b)}, ${esc(t.rec.done.a)} Uhr.</p>` : ''}
    ${hist ? `<details class="ap-hist"><summary>Verlauf</summary><ul>${hist}</ul></details>` : ''}`,
    fd => { const r = apCleanRec(key); const who = String(fd.get('who') || '').trim().slice(0, 40), note = String(fd.get('note') || '').trim().slice(0, 160); const done = !!fd.get('done');
      if(t.done && !done && !canEditAll()){ toast(`Fertig gemeldet von ${t.rec.done.b}. Zurücknehmen kann das nur der Chef.`); return false; }
      if(who !== (r.who || '')){ if(r.who) apHist(r, 'who', r.who); r.who = who; }
      if(note !== (r.note || '')){ if(r.note) apHist(r, 'note', r.note); r.note = note; }
      const items = {}; fd.getAll('it').forEach(id => { items[id] = (r.items && r.items[id]) || {b:apWho(), a:apNowHm()}; }); r.items = items;
      if(done && !r.done) r.done = {b:apWho(), a:apNowHm(), at:new Date().toISOString(), d:apToday()};
      if(!done && r.done){ apHist(r, 'undone', `${r.done.b}, ${r.done.a} Uhr`); delete r.done; }
      delete r.demo; apCleanTidy(key); },
    {done:'Gespeichert'});
}
function apHistTxt(h){ return h.k === 'undone' ? `Häkchen entfernt (war: ${h.v})` : h.k === 'who' ? `Zuständig geändert (vorher: ${h.v})` : h.k === 'note' ? `Notiz geändert (vorher: ${h.v})` : h.v; }
function apWhoDlg(key){
  const r0 = apS().cleans[key] || {}; const [apt, D] = key.split('|'); const x = apApt(apt); if(!x) return; const ppl = apPeople();
  tmDialog('Wer reinigt?', `<p class="dlg-p">${esc(x.name)} · Abreise ${esc(apDay(D))}</p>
    ${ppl.length ? `<div class="ap-pick">${ppl.map(n => `<button type="button" class="btn ${r0.who === n ? 'primary' : ''}" data-appick="${esc(n)}">${esc(n)}</button>`).join('')}</div>` : ''}
    <label class="f">Name<input name="who" maxlength="40" value="${esc(r0.who || '')}" placeholder="z. B. Reinigungsfirma" autocomplete="off"></label>`,
    fd => { const who = String(fd.get('who') || '').trim().slice(0, 40); const r = apCleanRec(key); if(who === (r.who || '')){ apCleanTidy(key); return; } if(r.who) apHist(r, 'who', r.who); r.who = who; apCleanTidy(key); },
    {done:'Gespeichert', after: f => { f.onclick = e => { const b = e.target.closest('[data-appick]'); if(!b) return; f.elements.who.value = b.dataset.appick; f.requestSubmit(); }; }});
}

/* ---------- Buchung eintragen oder ändern ---------- */
function apBookDlg(id, pre){
  const a = apS(); const b0 = id ? apBk(id) : null; if(id && !b0) return; const ro = !canEditAll();
  if(!b0 && !roGate()) return;
  const T = apToday(); const b = b0 || Object.assign({apt:(a.apts[0] || {}).id, from:T, to:dAdd(T, 3), guest:'', n:'', ch:'direkt', note:'', arr:''}, pre || {});
  const ics = b0 && b0.src === 'ics';
  const chs = Object.entries(AP_CH).map(([k, l]) => `<label class="tog"><input type="radio" name="ch" value="${k}" ${b.ch === k ? 'checked' : ''}><span></span>${esc(l)}</label>`).join('');
  if(ro){ // das Team sieht die Buchung, ändert sie aber nicht
    const x = apApt(b.apt);
    return tmDialog('Buchung', `<div class="kv ap-kv"><span>Apartment</span><span>${esc(x ? x.name : '')}</span><span>Anreise</span><span>${esc(apDay(b.from))}${b.arr ? ', ' + esc(b.arr) + ' Uhr' : ''}</span><span>Abreise</span><span>${esc(apDay(b.to))}</span><span>Gast</span><span>${esc(apGuestTxt(b))}</span><span>Personen</span><span>${b.n || '–'}</span><span>Kanal</span><span>${esc(AP_CH[b.ch])}</span>${b.note ? `<span>Notiz</span><span>${esc(b.note)}</span>` : ''}</div>`, null, {cancel:'Schließen'});
  }
  tmDialog(b0 ? 'Buchung ändern' : 'Neue Buchung', `${ics ? `<p class="dlg-p ap-src">Aus dem Kalender von ${esc(AP_CH[b.ch] === 'andere' ? 'einem anderen Anbieter' : AP_CH[b.ch])}${b.sum ? ` („${esc(b.sum)}“)` : ''}. Der Zeitraum kommt beim nächsten Import wieder aus dem Kalender. Name, Personen und Notiz bleiben.${b.ch === 'booking' && !b.guest ? ' Booking liefert im Kalender keine Gastnamen, nur belegte Zeiträume.' : ''}</p>` : ''}
    <label class="f">Apartment<select name="apt">${a.apts.map(x => `<option value="${esc(x.id)}" ${x.id === b.apt ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
    <div class="fields ap-dates"><label class="f">Anreise<input name="from" type="date" value="${esc(b.from)}" required></label><label class="f">Abreise<input name="to" type="date" value="${esc(b.to)}" required></label></div>
    <p class="hint ap-nights" id="apNights"></p>
    <div class="fields"><label class="f">Gast<input name="guest" maxlength="80" value="${esc(b.guest)}" placeholder="freiwillig" autocomplete="off"></label><label class="f">Personen<input name="n" class="num-in" type="text" inputmode="numeric" data-max="40" value="${b.n || ''}" placeholder="–"></label></div>
    <fieldset class="ap-ch-f"><legend>Kanal</legend><div class="togs">${chs}</div></fieldset>
    <div class="fields"><label class="f">Ankunft<input name="arr" type="time" value="${esc(b.arr || '')}" placeholder="${esc(a.settings.checkin)}"><small>leer = Check-in ab ${esc(a.settings.checkin)} Uhr</small></label><label class="f">Notiz<input name="note" maxlength="200" value="${esc(b.note)}" placeholder="z. B. Ankunft spät, Kinderbett" autocomplete="off"></label></div>
    ${b.desc ? `<p class="hint">Aus dem Kalender: ${esc(b.desc)}</p>` : ''}
    <div id="apWarn"></div>`,
    (fd, f) => {
      const x = {apt:String(fd.get('apt') || ''), from:String(fd.get('from') || ''), to:String(fd.get('to') || ''), guest:String(fd.get('guest') || '').trim().slice(0, 80), n:fd.get('n') === '' ? null : Math.round(+fd.get('n')) || null, ch:AP_CH[fd.get('ch')] ? fd.get('ch') : 'andere', arr:AP_TIME.test(fd.get('arr') || '') ? fd.get('arr') : '', note:String(fd.get('note') || '').trim().slice(0, 200)};
      const apt = apApt(x.apt); if(!apt) return dlgErr('apt', 'Bitte ein Apartment wählen.');
      if(!AP_DATE.test(x.from)) return dlgErr('from', 'Bitte das Datum der Anreise eintragen.');
      if(!AP_DATE.test(x.to) || x.to <= x.from) return dlgErr('to', 'Die Abreise muss nach der Anreise liegen.');
      if(apNightsOf(x) > 366) return dlgErr('to', 'Ein Aufenthalt kann höchstens ein Jahr dauern.');
      // Überschneidung im selben Apartment oder mehr Personen als Plätze: deutlich zeigen, nur mit Bestätigung speichern
      const same = b0 && b0.apt === x.apt && b0.from === x.from && b0.to === x.to; // schon bestätigte Überschneidung nicht bei jeder Änderung neu fragen
      const probe = {...x, id:b0 ? b0.id : ''}; const cl = same ? [] : apConflicts(probe); const many = x.n && x.n > apt.guests && !(b0 && b0.n === x.n && same);
      const sig = [x.apt, x.from, x.to, x.n].join('|');
      if((cl.length || many) && f.dataset.force !== sig){
        $('#apWarn').innerHTML = `<div class="warn-box dlg-warn" role="alert">${ico('spark')}<span>${cl.length ? `<b>Überschneidung in ${esc(apt.name)}:</b> ${cl.map(o => `${esc(apGuestTxt(o))} (${esc(apDay(o.from))} bis ${esc(apDay(o.to))})`).join(', ')}. ` : ''}${many ? `<b>${x.n} Personen</b>, das Apartment hat ${apt.guests} Plätze.` : ''}</span><button type="button" class="btn sm" id="apForce">Trotzdem speichern</button></div>`;
        $('#apForce').onclick = () => { f.dataset.force = sig; f.requestSubmit(); };
        return false; }
      if(b0){ const moved = b0.apt !== x.apt || b0.to !== x.to; const oldKey = apKey(b0.apt, b0.to); Object.assign(b0, x); delete b0.demo; if(moved) apMoveClean(oldKey); }
      else a.bookings.push({id:uid('bk'), ...x, src:'hand', at:new Date().toISOString(), by:me().name});
    },
    {done:b0 ? 'Buchung gespeichert' : 'Buchung eingetragen', del:b0 ? () => apBookDel(b0.id) : null, after: f => {
      const upd = () => { const n = apNightsOf({from:f.elements.from.value, to:f.elements.to.value}); $('#apNights').textContent = n > 0 ? (n === 1 ? '1 Nacht' : n + ' Nächte') : ''; $('#apWarn').innerHTML = ''; delete f.dataset.force; };
      ['from', 'to', 'apt', 'n'].forEach(k => f.elements[k].addEventListener('input', upd)); f.elements.apt.addEventListener('change', upd);
      f.elements.from.addEventListener('change', () => { if(f.elements.to.value <= f.elements.from.value && AP_DATE.test(f.elements.from.value)) f.elements.to.value = dAdd(f.elements.from.value, 1); upd(); });
      upd(); }});
}
function apNightsOf(x){ return AP_DATE.test(x.from || '') && AP_DATE.test(x.to || '') ? Math.round((dParse(x.to) - dParse(x.from)) / 864e5) : 0; }
/* Abreise verschoben: eine angefangene Reinigung bleibt nur stehen, wenn noch jemand an dem Tag abreist */
function apMoveClean(key){ const a = apS(); const [apt, D] = key.split('|'); if(!a.bookings.some(b => b.apt === apt && b.to === D)){ const r = a.cleans[key]; if(r && !r.done && !r.hist.length) delete a.cleans[key]; } }
function apBookDel(id){
  const a = apS(); const b = apBk(id); if(!b) return;
  const snap = JSON.stringify(b); const x = apApt(b.apt);
  a.bookings = a.bookings.filter(o => o !== b); apMoveClean(apKey(b.apt, b.to)); save(); render();
  toast(`Buchung gelöscht${x ? ': ' + x.name + ', ' + apDay(b.from) : ''}`, {action:() => { apS().bookings.push(JSON.parse(snap)); save(); render(); }});
}

/* ---------- Verwalten: Apartments, Kalender, Checkliste ---------- */
function apAdminHtml(v){
  const a = apS();
  const row = x => { const nb = a.bookings.filter(b => b.apt === x.id && b.to >= apToday()).length; const ic = x.ics; const shown = !!v.reveal[x.id];
    const und = v.undo && v.undo.apt === x.id ? ` · <button type="button" class="link" data-act="apIcsUndo">Import rückgängig</button>` : '';
    return `<li style="${apCol(x)}"><span class="ap-an"><b><i class="ap-dot" aria-hidden="true"></i>${esc(x.name)}</b>
      <small>bis ${x.guests} ${x.guests === 1 ? 'Gast' : 'Gäste'} · ${x.beds === 1 ? '1 Bett' : x.beds + ' Betten'} · ${nb === 1 ? '1 Buchung' : nb + ' Buchungen'} ab heute</small>
      <small>${ic ? `Kalender ${esc(AP_CH[ic.kind] === 'andere' ? '' : AP_CH[ic.kind] + ' ')}importiert am ${esc(fmtDate(ic.at))}${ic.file ? ' · ' + esc(ic.file) : ''}` : ''}${und}</small>
      ${x.note ? `<small class="ap-sec">Notiz: ${shown ? `<span class="ap-code">${esc(x.note)}</span>` : '<span class="ap-mask" aria-label="verborgen">••••••</span>'} <button type="button" class="link" data-act="apReveal" data-id="${esc(x.id)}" aria-pressed="${shown}">${shown ? 'verbergen' : 'zeigen'}</button></small>` : ''}</span>
      <span class="ap-aa"><button type="button" class="btn sm" data-act="apIcs" data-id="${esc(x.id)}">Kalender importieren</button><button type="button" class="btn sm" data-act="apAptEdit" data-id="${esc(x.id)}">Bearbeiten</button></span></li>`; };
  const st = a.settings;
  return `${a.apts.length ? `<ul class="ap-apts">${a.apts.map(row).join('')}</ul>` : '<section class="panel empty">Noch kein Apartment. Oben rechts legen Sie das erste an.</section>'}
    <h2 class="ap-h">Reinigung</h2>
    <ul class="ap-apts ap-set"><li><span class="ap-an"><b>Checkliste</b><small>${st.list.length ? esc(st.list.map(i => i.t).join(' · ')) : 'ohne Checkliste'}</small></span><span class="ap-aa"><button type="button" class="btn sm" data-act="apListEdit">Bearbeiten</button></span></li>
      <li><span class="ap-an"><b>Check-in und Check-out</b><small>Anreise ab ${esc(st.checkin)} Uhr · Abreise bis ${esc(st.checkout)} Uhr. Am Wechseltag muss bis zur Anreise gereinigt sein.</small></span><span class="ap-aa"><button type="button" class="btn sm" data-act="apTimes">Bearbeiten</button></span></li></ul>
    <p class="hint ap-priv">Gastdaten bleiben auf diesem Gerät, wie alle Daten der App, und sind in der Sicherung enthalten. Buchungen werden 13 Monate nach der Abreise gelöscht.</p>`;
}
function apAptDlg(id){
  if(!roGate()) return; const a = apS(); const x = id ? apApt(id) : null; if(id && !x) return;
  const used = a.apts.map(o => o.color); const col = x ? x.color : [0, 1, 2, 3, 4, 5, 6, 7].sort((p, q) => used.filter(u => u === p).length - used.filter(u => u === q).length || p - q)[0];
  tmDialog(x ? 'Apartment bearbeiten' : 'Neues Apartment', `<label class="f">Name<input name="name" maxlength="60" required value="${esc(x ? x.name : '')}" placeholder="z. B. Apartment Bergblick" autocomplete="off"></label>
    <div class="fields"><label class="f">Gäste höchstens<input name="guests" class="num-in" type="text" inputmode="numeric" data-max="40" required value="${x ? x.guests : 2}"></label><label class="f">Betten<input name="beds" class="num-in" type="text" inputmode="numeric" data-max="40" value="${x ? x.beds : ''}" placeholder="wie Gäste"><small>für die Wäsche: ein Set je Bett und Abreise</small></label></div>
    <label class="f">Notiz<input name="note" maxlength="200" value="${esc(x ? x.note : '')}" placeholder="z. B. Code der Schlüsselbox" autocomplete="off"><small>Wird nur auf Tipp gezeigt, nie gedruckt.</small></label>
    <fieldset class="ap-cols"><legend>Farbe</legend>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<label class="ap-col" style="--pc:var(--tm${i})"><input type="radio" name="color" value="${i}" ${i === col ? 'checked' : ''} aria-label="Farbe ${i + 1}"><span></span></label>`).join('')}</fieldset>`,
    fd => { const name = String(fd.get('name') || '').trim().slice(0, 60); if(!name) return dlgErr('name', 'Bitte einen Namen eintragen.');
      if(a.apts.some(o => o !== x && o.name.toLowerCase() === name.toLowerCase())) return dlgErr('name', 'Diesen Namen gibt es schon.');
      const g = Math.round(+fd.get('guests')); if(!(g >= 1)) return dlgErr('guests', 'Bitte mindestens 1 eintragen.');
      const bd = fd.get('beds') === '' ? g : Math.round(+fd.get('beds')); const o = {name, guests:g, beds:bd >= 0 ? bd : g, note:String(fd.get('note') || '').trim().slice(0, 200), color:Math.min(7, Math.max(0, +fd.get('color') || 0))};
      if(x){ Object.assign(x, o); delete x.demo; } else a.apts.push({id:uid('apt'), ...o}); },
    {done:x ? 'Gespeichert' : 'Apartment angelegt', del:x ? () => { const nb = a.bookings.filter(b => b.apt === x.id).length; ask(`${x.name} löschen?${nb ? ` Mit ${nb === 1 ? '1 Buchung' : nb + ' Buchungen'} und den Reinigungen.` : ''}`, () => { a.apts = a.apts.filter(o => o !== x); a.bookings = a.bookings.filter(b => b.apt !== x.id); Object.keys(a.cleans).forEach(k => { if(k.split('|')[0] === x.id) delete a.cleans[k]; }); }); } : null});
}
function apListDlg(){
  if(!roGate()) return; const a = apS(); const st = a.settings;
  const row = i => `<li class="ap-le" data-lid="${esc(i.id || '')}"><input name="t" value="${esc(i.t || '')}" maxlength="60" placeholder="Punkt der Checkliste" aria-label="Punkt"><button type="button" class="icon-btn" data-apdel="1" aria-label="Punkt entfernen" title="Entfernen">${ico('x')}</button></li>`;
  tmDialog('Checkliste Reinigung', `<ol class="ap-led" id="apLed">${st.list.map(row).join('')}</ol><button type="button" class="btn sm" data-apadd="1">${ico('plus')}Punkt</button>
    <p class="hint">Die Punkte stehen bei jeder Reinigung zum Abhaken. Ohne Punkte gibt es nur „fertig“.</p>`,
    (fd, f) => { const next = []; f.querySelectorAll('.ap-le').forEach(li => { const t = li.querySelector('[name="t"]').value.trim().slice(0, 60); if(t) next.push({id:li.dataset.lid || uid('al'), t}); }); st.list = next.slice(0, 20); },
    {done:'Checkliste gespeichert', after: f => { f.onclick = e => { if(e.target.closest('[data-apadd]')){ $('#apLed').insertAdjacentHTML('beforeend', row({id:'', t:''})); $('#apLed').lastElementChild.querySelector('input').focus(); return; } const li = e.target.closest('.ap-le'); if(li && e.target.closest('[data-apdel]')) li.remove(); }; }});
}
function apTimesDlg(){
  if(!roGate()) return; const st = apS().settings;
  tmDialog('Check-in und Check-out', `<div class="fields"><label class="f">Anreise ab<input name="ci" type="time" value="${esc(st.checkin)}" required></label><label class="f">Abreise bis<input name="co" type="time" value="${esc(st.checkout)}" required></label></div><p class="hint">Am Wechseltag zeigt die App „bis Anreise um …“: die Ankunftszeit der Buchung, sonst diese Uhrzeit.</p>`,
    fd => { const ci = String(fd.get('ci') || ''), co = String(fd.get('co') || ''); if(!AP_TIME.test(ci)) return dlgErr('ci', 'Bitte eine Uhrzeit eintragen.'); if(!AP_TIME.test(co)) return dlgErr('co', 'Bitte eine Uhrzeit eintragen.'); st.checkin = ci; st.checkout = co; }, {done:'Gespeichert'});
}

/* ---------- Kalender importieren: Datei, eingefügter Text oder Adresse → Vorschau → Übernehmen ---------- */
const AP_ST = {neu:'neu', akt:'geändert', gleich:'unverändert', weg:'entfällt', skip:'ausgelassen', link:'verbunden'};
function apIcsDlg(aptId){
  if(!roGate()) return; const a = apS(); if(!a.apts.length) return;
  const I = {apt:apApt(aptId) ? aptId : a.apts[0].id, text:'', file:'', plan:null, err:''};
  apIcsDlg.cur = I;
  tmDialog('Kalender importieren', `<label class="f">Für welches Apartment?<select name="apt" id="apIcsApt">${a.apts.map(x => `<option value="${esc(x.id)}" ${x.id === I.apt ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
    <details class="ap-how"><summary>So bekommen Sie die Datei von Booking.com</summary><ol><li>Im Extranet: Tarife &amp; Verfügbarkeit → Kalender synchronisieren.</li><li>Beim Zimmer „Exportieren“ wählen und den Link kopieren.</li><li>Den Link im Browser öffnen. Die Datei (.ics) wird gespeichert.</li><li>Hier „Datei wählen“ tippen. Airbnb und andere Anbieter geben dieselbe Art Datei aus.</li></ol></details>
    <div class="ap-src-row"><button type="button" class="btn" id="apIcsPick">Datei wählen</button><input type="file" id="apIcsFile" accept=".ics,text/calendar,text/plain" hidden><span class="hint" id="apIcsName"></span></div>
    <details class="ap-alt"><summary>Text einfügen oder Adresse abrufen</summary>
      <label class="f">Inhalt der Datei<textarea id="apIcsTxt" class="code" rows="4" placeholder="BEGIN:VCALENDAR …" aria-label="Inhalt der Kalenderdatei"></textarea></label>
      <div class="ap-url"><label class="f">Adresse des Kalenders<input id="apIcsUrl" type="url" inputmode="url" placeholder="https://…" autocomplete="off"></label><button type="button" class="btn sm" id="apIcsFetch">Abrufen</button></div></details>
    <div id="apIcsOut" aria-live="polite"></div>`,
    () => { const P = I.plan; if(!P) return dlgErr('#apIcsOut', 'Bitte zuerst eine Kalenderdatei wählen.');
      const ch = P.counts.neu + P.counts.akt + P.counts.weg + P.counts.link; if(!ch){ toast('Nichts zu ändern: alles wie im Kalender'); return; }
      const snap = apIcsApply(P, I.apt, I.file); if(!snap) return false;
      view.ap.undo = {apt:I.apt, snap};
      const msg = [P.counts.neu ? P.counts.neu + ' neu' : '', P.counts.akt ? P.counts.akt + ' geändert' : '', P.counts.weg ? P.counts.weg + ' entfallen' : '', P.counts.link ? P.counts.link + ' verbunden' : ''].filter(Boolean).join(', ');
      const apt = I.apt; setTimeout(() => toast(`Kalender übernommen: ${msg}`, {label:'Rückgängig', ms:8000, action:() => { const u = view.ap.undo; if(u && u.apt === apt){ view.ap.undo = null; apIcsUndo(apt, u.snap); } }}), 0); },
    {ok:'Übernehmen', toast:false, after: f => { f.dataset.wide = '1';
      const draw = () => { $('#apIcsOut').innerHTML = apIcsPrevHtml(I); const sb = f.querySelector('button[type="submit"]'); if(sb) sb.disabled = !I.plan; };
      const run = (text, file) => { I.text = text; I.file = file || ''; const p = apIcsParse(text); if(p.err){ I.plan = null; I.err = p.err; } else { I.err = ''; I.plan = apIcsPlan(p, I.apt); } draw(); };
      $('#apIcsPick').onclick = () => $('#apIcsFile').click();
      $('#apIcsFile').onchange = e => { const fl = e.target.files[0]; if(!fl) return; $('#apIcsName').textContent = fl.name; const r = new FileReader(); r.onload = () => run(String(r.result || ''), fl.name); r.onerror = () => { I.err = 'Die Datei lässt sich nicht lesen.'; I.plan = null; draw(); }; r.readAsText(fl); };
      $('#apIcsTxt').addEventListener('input', e => { const t = e.target.value; if(t.trim()) run(t, 'eingefügt'); else { I.plan = null; I.err = ''; draw(); } });
      $('#apIcsApt').onchange = e => { I.apt = e.target.value; if(I.text) run(I.text, I.file); };
      $('#apIcsFetch').onclick = async () => { const u = $('#apIcsUrl').value.trim(); if(!/^https?:\/\//i.test(u)){ I.err = 'Bitte eine Adresse eintragen, die mit https:// beginnt.'; I.plan = null; draw(); return; }
        $('#apIcsOut').innerHTML = '<p class="hint">Wird abgerufen …</p>';
        try { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 12000); const r = await fetch(u, {signal:ctl.signal, credentials:'omit', cache:'no-store'}); clearTimeout(tm); if(!r.ok) throw new Error('HTTP ' + r.status); run(await r.text(), u.replace(/^https?:\/\//, '').split(/[/?#]/)[0]); }
        catch(err){ I.plan = null; I.err = 'Der Kalender lässt sich vom Browser aus nicht direkt abrufen. Booking.com und viele andere erlauben das nicht. Bitte die Adresse im Browser öffnen, die Datei speichern und oben „Datei wählen“ tippen.'; draw(); } };
      draw(); }});
}
function apIcsPrevHtml(I){
  if(I.err) return `<p class="f-err ap-err" role="alert">${esc(I.err)}</p>`;
  const P = I.plan; if(!P) return '';
  const c = P.counts; const rel = P.items.filter(i => i.st !== 'gleich' || P.items.length <= 12);
  const kind = P.kind === 'booking' ? 'Booking.com' : P.kind === 'airbnb' ? 'Airbnb' : 'Kalender';
  const head = `<p class="ap-sum"><b>${esc(kind)}</b>${P.cal.name ? ' · ' + esc(P.cal.name) : ''}: ${[c.neu ? `<b>${c.neu}</b> neu` : '', c.akt ? `<b>${c.akt}</b> geändert` : '', c.weg ? `<b>${c.weg}</b> entfällt` : '', c.link ? `<b>${c.link}</b> mit Ihrer Eintragung verbunden` : '', c.gleich ? `${c.gleich} unverändert` : '', c.skip ? `${c.skip} ausgelassen` : ''].filter(Boolean).join(' · ') || 'keine Zeiträume in der Datei'}</p>
    ${P.kind === 'booking' ? '<p class="hint ap-honest">Booking liefert im Kalender keine Gastnamen, nur belegte Zeiträume. Auch Tage, die Sie selbst geschlossen haben, erscheinen als belegt. Namen und Personen können Sie danach bei der Buchung eintragen.</p>' : ''}`;
  const line = i => `<li class="imp-l ap-il st-${i.st}"><span class="imp-ln"><b>${esc(apDay(i.from))} – ${esc(apDay(i.to))}</b>${i.st === 'akt' && i.b ? ` <s>${esc(apDay(i.b.from))} – ${esc(apDay(i.b.to))}</s>` : ''}<small>${esc(i.sum || 'ohne Titel')}${i.why ? ' · ' + esc(i.why) : ''}${i.st === 'link' ? ' · ' + esc(apGuestTxt(i.b)) : ''}</small>${i.warn ? `<small class="warn-t">${esc(i.warn)}</small>` : ''}</span><span class="ap-ist">${AP_ST[i.st]}</span></li>`;
  const order = {neu:0, akt:1, weg:2, link:3, gleich:4, skip:5};
  return head + (rel.length ? `<ul class="imp-lines ap-ilist">${rel.slice().sort((p, q) => order[p.st] - order[q.st] || String(p.from).localeCompare(String(q.from))).map(line).join('')}</ul>` : '');
}

/* ---------- Wochenplan als PDF: feste A4-Blätter ---------- */
function apPlanRows(W){
  const a = apS(); const rows = [];
  for(let i = 0; i < 7; i++){ const D = dAdd(W, i); let first = true;
    const ev = a.apts.map(x => ({x, i:apDayInfo(x, D), t:apTask(x.id, D)})).filter(o => o.i.out.length || o.i.inn.length);
    if(!ev.length){ rows.push(`<tr class="cp-d mp-gap"><td class="mp-d">${esc(apDay(D))}</td><td colspan="4">keine Anreise, keine Abreise</td></tr>`); continue; }
    ev.forEach(({x, i: inf, t}) => {
      const out = inf.out.map(b => `${apPers(b.n) || 'Abreise'}${b.note ? '<small>' + esc(b.note) + '</small>' : ''}`).join('');
      const inn = inf.inn.map(b => `${b.arr ? esc(b.arr) + ' Uhr' : 'ab ' + esc(a.settings.checkin) + ' Uhr'}${b.n ? ' · ' + apPers(b.n) : ''}${b.note ? '<small>' + esc(b.note) + '</small>' : ''}`).join('');
      const cl = t ? `${t.done ? `fertig · ${esc(t.rec.done.b)}` : `${t.rec && t.rec.who ? esc(t.rec.who) : '<span class="gap">wer?</span>'}`}${t.wechsel ? `<small>Wechseltag, bis ${esc(t.until)} Uhr</small>` : ''}${t.rec && t.rec.note ? `<small>${esc(t.rec.note)}</small>` : ''}` : '';
      rows.push(`<tr class="${first ? 'cp-d' : ''}"><td class="mp-d">${first ? esc(apDay(D)) : ''}</td><td><b>${esc(x.name)}</b></td><td>${out || '–'}</td><td>${inn || '–'}</td><td>${cl || '–'}</td></tr>`); first = false; }); }
  return rows;
}
function apPlanPages(W){
  const L = apLaundry(W);
  const head = `<header class="ab-h"><div><b>${abU(S.settings.name)}</b><h1>Apartments · KW ${tmKw(W)}</h1></div><div class="ab-meta"><span>${esc(tmRangeTxt(W))}</span><span>erstellt am ${fmtDate(new Date().toISOString())} von ${esc(me().name)}</span><span class="ab-pn" data-ab-n="1"></span></div></header>`;
  const foot = `<footer class="ab-f"><p>Wochenplan Apartments. Anreise ab ${esc(apS().settings.checkin)} Uhr, Abreise bis ${esc(apS().settings.checkout)} Uhr. Ohne Gastnamen und ohne Codes.</p></footer>`;
  let host = document.getElementById('abMeasure'); if(!host){ host = document.createElement('div'); host.id = 'abMeasure'; host.className = 'ab-measure'; host.setAttribute('aria-hidden', 'true'); document.body.appendChild(host); }
  host.innerHTML = ''; const pages = []; let body = null, tb = null;
  const thead = '<tr><th class="mp-d">Tag</th><th>Apartment</th><th>Abreise</th><th>Anreise</th><th>Reinigung</th></tr>';
  const newPage = cont => { const p = document.createElement('article'); p.className = 'ab-page mp-page ap-page'; p.innerHTML = `${head}<div class="ab-body"><section class="mp-sec ap-plan"><h2>Anreisen, Abreisen, Reinigung${cont ? '<span>Fortsetzung</span>' : ''}</h2><table class="mp-t"><thead>${thead}</thead><tbody></tbody></table></section></div>${foot}`; host.appendChild(p); pages.push(p); body = p.querySelector('.ab-body'); tb = p.querySelector('tbody'); };
  const fits = () => { const last = body.lastElementChild; return !last || last.getBoundingClientRect().bottom <= body.getBoundingClientRect().bottom - 4; };
  newPage(false);
  const tmp = document.createElement('tbody');
  apPlanRows(W).forEach(html => { tmp.innerHTML = html; const tr = tmp.firstElementChild; tb.appendChild(tr); if(!fits() && tb.children.length > 1){ tr.remove(); newPage(true); tb.appendChild(tr); } });
  const wash = document.createElement('p'); wash.className = 'mp-note ap-pwash'; wash.textContent = L.deps ? `Wäsche: ${L.sets === 1 ? '1 Set' : L.sets + ' Sets'} für ${L.deps === 1 ? '1 Abreise' : L.deps + ' Abreisen'} (${L.list.map(p => `${p.apt.name} ${p.n} × ${p.apt.beds === 1 ? '1 Bett' : p.apt.beds + ' Betten'}`).join(', ')}, ein Set je Bett).` : 'Wäsche: in dieser Woche keine Abreise.';
  body.appendChild(wash); if(!fits()){ wash.remove(); newPage(true); tb.closest('section').remove(); body.appendChild(wash); }
  pages.forEach((pg, i) => { pg.querySelector('[data-ab-n]').textContent = `Blatt ${i + 1} von ${pages.length}`; });
  const out = pages.map(pg => pg.outerHTML); host.innerHTML = '';
  return {pages:out, name:pdfFileName('Wochenplan-Apartments-KW' + tmKw(W) + '-' + W.slice(0, 4))};
}
async function apPdf(){
  const W = apView().w; apPlanPages(W); try { if(document.fonts && document.fonts.ready) await document.fonts.ready; } catch(e){}
  const r = apPlanPages(W); const n = await a4Pdf(r.pages, r.name); window.__apLast = {name:r.name, pages:n, w:W};
}

/* ---------- Heute: höchstens eine ruhige Zeile ---------- */
function apDashRow(){
  const a = S && S.apart; if(!a || !a.apts.length) return '';
  const T = apToday(); let ni = 0, no = 0; a.apts.forEach(x => { const i = apDayInfo(x, T); ni += i.inn.length; no += i.out.length; });
  const open = apTasks(T, T).filter(t => !t.done).concat(apOverdue(T)); if(!ni && !no && !open.length) return '';
  const urgent = open.find(t => t.D === T && t.wechsel);
  const parts = [ni ? (ni === 1 ? '1 Anreise' : ni + ' Anreisen') : '', no ? (no === 1 ? '1 Abreise' : no + ' Abreisen') : '', open.length ? `${open.length === 1 ? '1 Reinigung' : open.length + ' Reinigungen'} offen${urgent ? `, Wechseltag bis ${urgent.until} Uhr` : ''}` : ''].filter(Boolean);
  return dayRow(ico('apart'), 'Apartments', esc(parts.join(', ')), '', `<button type="button" class="btn sm" data-act="apGo" data-id="${open.length ? 'reinigung' : 'uebersicht'}">Öffnen</button>`, 'ap-dash');
}
const _renderDashAp = renderDash;
renderDash = function(){
  let h = _renderDashAp();
  try { const row = apDashRow(); if(row){ const m = /<h2 class="day-h">Offen(?:<span>[^<]*<\/span>)?<\/h2><ul class="rows">/.exec(h); if(m) h = h.slice(0, m.index + m[0].length) + row + h.slice(m.index + m[0].length); else { const i = h.indexOf('<!--dash-extra-->'); if(i >= 0) h = h.slice(0, i) + daySec('Apartments', '', row) + h.slice(i); } } } catch(err){ console.warn('Apartments:', err); }
  return h;
};

/* ---------- Adressen: #apartments, #apartments/reinigung, #apartments/verwalten ---------- */
const AP_HASH = {uebersicht:'', reinigung:'reinigung', verwalten:'verwalten'};
function apHashParse(h){ const m = /^(apartments|apart)(?:\/([a-z]*))?$/.exec(h || ''); if(!m) return null; const sub = Object.keys(AP_HASH).find(k => AP_HASH[k] === (m[2] || '')) || 'uebersicht'; return {tab:'apart', sub}; }
const _hashWantAp = hashWant; hashWant = function(){ if(view.tab === 'apart'){ const v = apView(); return 'apartments' + (AP_HASH[v.tab] ? '/' + AP_HASH[v.tab] : ''); } return _hashWantAp(); };
const _hashParseAp = hashParse; hashParse = function(h){ const r = apHashParse(h); return r ? {tab:'apart'} : _hashParseAp(h); };
const _fromHashAp = fromHash; fromHash = function(){
  let h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch(e){ h = location.hash.slice(1); }
  const r = apHashParse(h); if(r){ const v = apView(); if(v.tab !== r.sub){ v.tab = r.sub; apView(); if(view.tab === 'apart'){ render(); hashSync(); return; } } }
  return _fromHashAp();
};

/* ---------- Beispiele, Leer starten, Umstellung ---------- */
const _migrateAp = migrate; migrate = function(d){ const r = _migrateAp(d); if(r) apMigrate(r); return r; };
const _seedAp = seed; seed = function(){ return apMigrate(_seedAp()); };
const _leerStateAp = leerState; leerState = function(){ const d = _leerStateAp(); if(d && d.apart) apDemoRemove(d); return d; };
const _demoRestAp = demoRest; demoRest = function(){ const out = _demoRestAp(); if(apHasDemo()){ const n = S.apart.apts.filter(x => x.demo).length; out.push({k:'apart', n, t:'Beispiel-Apartments' + (n ? ` (${n})` : ''), a:'leerApart', l:'nur Beispiel-Apartments entfernen'}); } return out; };
RO_ACTS.add('leerApart');
['apBookNew', 'apAptNew', 'apAptEdit', 'apIcs', 'apIcsUndo', 'apListEdit', 'apTimes'].forEach(x => RO_ACTS.add(x));

/* ---------- Bedienung ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const act = el.dataset.act, id = el.dataset.id || '';
  if(act !== 'leerApart' && !/^ap[A-Z]/.test(act)) return;
  if(document.body.classList.contains('gd-help')) return;   // Hilfe-Modus erklärt, statt zu handeln
  const v = apView();
  switch(act){
    case 'leerApart': if(!roGate()) break; ask('Beispiel-Apartments entfernen? Die erfundenen Apartments mit ihren Buchungen und Reinigungen verschwinden. Eigene bleiben.', () => { safetyStore('vor „Beispiel-Apartments entfernen“'); apDemoRemove(); setTimeout(() => leerDone('Beispiel-Apartments entfernt'), 0); }, 'Entfernen'); break;
    case 'apGo': v.tab = AP_HASH[id] !== undefined ? id : 'uebersicht'; v.w = tmMonday(apToday()); go('apart'); break;
    case 'apTab': v.tab = id; apView(); render(); hashSync(); break;
    case 'apWeek': v.w = id === '0' ? tmMonday(apToday()) : dAdd(v.w, 7 * (+id || 0)); render(); break;
    case 'apBookNew': apBookDlg(null); break;
    case 'apBook': apBookDlg(id); break;
    case 'apTick': apTick(id); break;
    case 'apClean': apCleanDlg(id); break;
    case 'apWhoDlg': apWhoDlg(id); break;
    case 'apAptNew': apAptDlg(null); break;
    case 'apAptEdit': apAptDlg(id); break;
    case 'apReveal': v.reveal[id] = !v.reveal[id]; render(); break;
    case 'apIcs': apIcsDlg(id); break;
    case 'apIcsUndo': { const u = v.undo; if(u){ v.undo = null; apIcsUndo(u.apt, u.snap); } break; }
    case 'apListEdit': apListDlg(); break;
    case 'apTimes': apTimesDlg(); break;
    case 'apPdf': apPdf(); break;
  }
});
/* Schnellsuche: der Bereich, die Reinigung und „Buchung eintragen“ */
const _palDataAp = palData; palData = function(){ const r = _palDataAp(); const go2 = t => () => { apView().tab = t; go('apart'); };
  let i = -1; r.forEach((x, k) => { if(x.g === 'Bereich') i = k; });
  r.splice(i + 1, 0, {g:'Bereich', n:'Apartments', s:NAV_DESC.apart, run:go2('uebersicht')}, {g:'Bereich', n:'Reinigung der Apartments', s:'Apartments: nach jeder Abreise', run:go2('reinigung')});
  if(canEditAll() && S.apart && S.apart.apts.length) r.push({g:'Aktion', n:'Buchung eintragen', s:'Apartments', run:() => { apView().tab = 'uebersicht'; go('apart'); apBookDlg(null); }});
  return r; };
/* Codes nur auf Tipp: beim Verlassen der Seite wieder verbergen */
const _renderAp = render; render = function(){ if(view.ap && view.tab !== 'apart') view.ap.reveal = {}; return _renderAp(); };

/* ---------- Hilfe ---------- */
NAV_DESC.apart = 'Anreisen, Abreisen und die Reinigung der Ferienwohnungen.';
SUB_LINE.apart = '';
HOWTO.apart = ['Oben steht, was heute in jedem Apartment passiert: Anreise, Abreise, Reinigung.', 'Darunter die Woche: ein Balken je Aufenthalt, ein Tipp öffnet die Buchung. „frei“ zeigt die Lücken.', 'Unter „Reinigung“ steht nach jeder Abreise eine Aufgabe. Das Kästchen meldet: fertig, bereit für Anreise.', 'Unter „Verwalten“ legt der Chef die Apartments an und lädt den Kalender von Booking.com.'];
HELP.nav_mehr.x = 'Speisekarte, Ware, Team & Zahlen, Apartments, Einstellungen und die Suche.';
H('nav_apart', 'Apartments', NAV_DESC.apart);
H('apartments', 'Apartments', 'Wer heute an- und abreist, die Belegung der Woche und die Reinigung nach jeder Abreise. Gastdaten bleiben auf diesem Gerät und sind in der Sicherung. Buchungen werden 13 Monate nach der Abreise gelöscht.', 1);
H('ap_buchung', 'Buchung', 'Ein Aufenthalt: Apartment, Anreise, Abreise, Gast, Personen, Kanal und eine Notiz. Überschneidet sich eine Buchung mit einer anderen im selben Apartment, warnt die App und speichert erst nach Bestätigung.');
H('ap_woche', 'Belegung der Woche', 'Je Apartment eine Zeile. Ein Balken reicht vom Nachmittag der Anreise bis zum Vormittag der Abreise. „frei“ zeigt Nächte ohne Gast. Ein Tipp auf einen Balken öffnet die Buchung.');
H('ap_reinigung', 'Reinigung nach Abreise', 'Nach jeder Abreise legt die App eine Reinigung an. Reist am selben Tag jemand an, ist Wechseltag: Die Reinigung muss bis zur Anreise fertig sein. Das Kästchen meldet „fertig, bereit für Anreise“, mit Name und Uhrzeit.', 1);
H('ap_wechseltag', 'Wechseltag', 'Am selben Tag reist ein Gast ab und der nächste an. Dazwischen muss gereinigt werden, bis zur Ankunftszeit der Buchung oder bis zum Check-in.', 1);
H('ap_wer', 'Wer reinigt?', 'Ein Name aus dem Team oder frei geschrieben, zum Beispiel eine Reinigungsfirma.');
H('ap_waesche', 'Wäsche', 'Wie viele Sets Bettwäsche und Handtücher diese Woche gebraucht werden: Betten je Apartment mal Abreisen. Einen Bestand führt die App nicht.');
H('ap_ics', 'Kalender importieren', 'Booking.com, Airbnb und andere geben je Zimmer eine Kalenderdatei (.ics) aus. Die App übernimmt die belegten Zeiträume, mit Vorschau und „Rückgängig“. Booking liefert keine Gastnamen.', 1);
H('ap_notiz', 'Notiz zum Apartment', 'Zum Beispiel der Code der Schlüsselbox. Er ist verborgen und erscheint erst auf Tipp. Im Wochenplan steht er nie.');
H('ap_pdf', 'Wochenplan als PDF', 'Ein A4-Blatt für die Woche: Anreisen, Abreisen, Reinigung und wer sie macht, dazu die Wäsche. Ohne Gastnamen und ohne Codes.');
HELP_SEL.unshift(['.nav-i[data-tab="apart"],.sheet-i[data-tab="apart"]', 'nav_apart'], ['#app .ap-bar,#app .ap-grid,#app .ap-free-b', 'ap_woche'], ['#app [data-act="apBookNew"],#app .ap-ev,#app .ap-dl', 'ap_buchung'],
  ['#app .ap-cl .ap-ck,#app .ap-cl .ap-cm', 'ap_reinigung'], ['#app .ap-who', 'ap_wer'], ['#app .ap-wash', 'ap_waesche'], ['#app [data-act="apIcs"]', 'ap_ics'], ['#app .ap-sec', 'ap_notiz'], ['#app [data-act="apPdf"]', 'ap_pdf'], ['#app .ap-dash,#app .ap .page-h h1,#app .ap-priv', 'apartments']);
