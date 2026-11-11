/* =====================================================================
   Team: Dienstplan und Checklisten.
   Dienstplan: wer arbeitet wann, je Woche. Stunden mit Pausenregel,
   Abwesenheiten, Wochenvorlagen, ruhige Hinweise (keine Rechtsprüfung).
   Checklisten: Öffnen, Schließen, Wochenputz. Jeden Tag eine frische Liste,
   wer was wann abgehakt hat, Messwerte mit erlaubtem Bereich.
   Eigener Zustand: S.team und S.checks (je Datum).
   ===================================================================== */

const TM_AREAS = [['kueche','Küche'],['service','Service'],['bar','Bar'],['abwasch','Abwasch']];
const TM_AREA = Object.fromEntries(TM_AREAS);
/* Zwei Pläne: Küche (mit Abwasch) und Service (mit Bar) */
const TM_DEPTS = [['kueche','Küche',['kueche','abwasch']],['service','Service',['service','bar']]];
function tmDeptOf(area){ return area === 'service' || area === 'bar' ? 'service' : 'kueche'; }
function tmDeptName(d){ const x = TM_DEPTS.find(y => y[0] === d); return x ? x[1] : ''; }
function tmDeptAreas(d){ const x = TM_DEPTS.find(y => y[0] === d); return x ? x[2] : TM_AREAS.map(a => a[0]); }
function tmDept(){ const v = tmView(); if(v.dept === undefined){ let d = ''; try { d = localStorage.getItem('dahuam202_dienst_bereich') || ''; } catch(e){} v.dept = d === 'kueche' || d === 'service' ? d : 'all'; } return v.dept; }
/* Personen eines Plans: wer dort hingehört, dazu wer in dieser Woche dort aushilft */
function tmDeptPeople(ppl, W, d){ if(d === 'all') return ppl; const ar = tmDeptAreas(d); const help = new Set(); for(let i = 0; i < 7; i++) tmShifts(dAdd(W, i)).forEach(s => { if(ar.includes(s.area)) help.add(s.pid); }); return ppl.filter(p => tmDeptOf(p.area) === d || help.has(p.id)); }
/* Gruppen für die Anzeige: bei „Alle“ zwei Blöcke mit Überschrift */
function tmGroups(ppl, d){ if(d !== 'all') return [['', ppl]]; return TM_DEPTS.map(([k, l]) => [l, ppl.filter(p => tmDeptOf(p.area) === k)]).filter(g => g[1].length); }
const TM_ABS = {urlaub:'Urlaub', krank:'Krank', wunsch:'Kann nicht'};
const TM_WD = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const TM_NCOL = 8;
/* Schwellen der Hinweise. Nur Hinweise, keine Rechtsprüfung. */
const TM_RULES = {rest:11, dayMax:10, rowMax:6, weekMax:48};
const TM_KEEP_SHIFTS = 800, CK_KEEP_RUNS = 400; // Tage
const TM_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TM_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/* ---------- Zeit ---------- */
function tmMin(t){ const m = TM_TIME.exec(String(t || '')); if(!m) return NaN; const [h, mi] = t.split(':').map(Number); return h * 60 + mi; }
/* Ein Dienstteil als [Beginn, Ende] in Minuten ab Mitternacht des Diensttages. Ende vor oder gleich Beginn heißt: am nächsten Tag. */
function tmSpan(part){ const s = tmMin(part[0]); let e = tmMin(part[1]); if(e <= s) e += 1440; return [s, e]; }
function tmShort(t){ const [h, m] = String(t).split(':'); return m === '00' ? h : `${h}:${m}`; }
function tmPartTxt(part, short){ return short ? `${tmShort(part[0])}–${tmShort(part[1])}` : `${part[0]}–${part[1]}`; }
function tmPartsTxt(parts, short){ return parts.map(p => tmPartTxt(p, short)).join(' + '); }
function tmH(h){ return num(Math.round(h * 100) / 100, 2); }
function tmMonday(D){ return dAdd(D, -((dParse(D).getDay() + 6) % 7)); }
function tmDm(D){ const [y, m, d] = D.split('-'); return `${+d}.${+m}.`; }
function tmWdShort(D){ return TM_WD[(dParse(D).getDay() + 6) % 7]; }
function tmDayTxt(D){ return `${tmWdShort(D)} ${tmDm(D)}`; }
function tmRangeTxt(W){ const a = dParse(W), b = dParse(dAdd(W, 6)); return a.getMonth() === b.getMonth() ? `${a.getDate()}.–${b.getDate()}. ${MONTHS[b.getMonth()]} ${b.getFullYear()}` : `${a.getDate()}. ${MONTHS[a.getMonth()]} – ${b.getDate()}. ${MONTHS[b.getMonth()]} ${b.getFullYear()}`; }
function tmKw(W){ return isoWeek(W)[1]; }
function tmClosed(D){ return ((S.settings && S.settings.closed) || []).includes(dParse(D).getDay()); }
function tmNowHm(){ const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

/* ---------- Vorgaben ---------- */
function tmDefaultTemplates(){ return [
  {id:'tt_frueh', name:'Früh', parts:[['08:00','16:00']]},
  {id:'tt_spaet', name:'Spät', parts:[['15:00','23:00']]},
  {id:'tt_teil', name:'Teildienst', parts:[['10:00','14:00'],['17:30','22:00']]},
]; }
/* Vorschläge für eine kleine Küche. Bewusst allgemein gehalten: jede Liste trägt „Vorschlag, bitte anpassen“. */
const CK_DEFAULTS = [
  ['ck_open_k', 'Öffnen Küche', 'daily', 'kueche', [
    'Hände waschen, saubere Arbeitskleidung anziehen',
    ['Kühlhaus-Temperatur notieren', '°C', 0, 5],
    ['Tiefkühler-Temperatur notieren', '°C', -30, -18],
    'MHD-Kontrolle Kühlhaus: Abgelaufenes aussortieren',
    'Lieferung prüfen und gleich kühl einräumen',
    'Fritteuse einschalten, Öl prüfen',
    'Herd, Ofen und Pass einschalten',
    'Arbeitsflächen reinigen und desinfizieren',
    'Schneidbretter, Messer und saubere Tücher bereitlegen',
    'Mise en place nach der Prep-Liste auffüllen',
    'Seife und Papier am Handwaschbecken auffüllen',
    'Müllsäcke einsetzen',
  ]],
  ['ck_close_k', 'Schließen Küche', 'daily', 'kueche', [
    'Lebensmittel abdecken, beschriften und kühl stellen',
    'Reste mit Datum beschriften oder entsorgen',
    ['Kühlhaus-Temperatur notieren', '°C', 0, 5],
    'Fritteuse ausschalten, Öl prüfen oder wechseln',
    'Herd, Ofen und Grill ausschalten, Gas abdrehen',
    'Arbeitsflächen reinigen und desinfizieren',
    'Schneidbretter und Messer reinigen',
    'Spülmaschine leeren und ausschalten',
    'Boden kehren und wischen',
    'Müll und Altglas hinausbringen',
    'Dunstabzug und Licht ausschalten',
    'Kühlhaus und Hintertür abschließen',
  ]],
  ['ck_open_s', 'Öffnen Bar/Service', 'daily', 'service', [
    'Gastraum lüften, Licht und Musik einschalten',
    'Tische und Stühle abwischen, eindecken',
    'Kaffeemaschine einschalten und spülen',
    ['Getränkekühlung prüfen', '°C', 2, 8],
    'Getränke auffüllen',
    'Zapfanlage prüfen, Fässer kontrollieren',
    'Eis, Zitronen und Garnituren vorbereiten',
    'Wechselgeld zählen, Kassa anmelden',
    'Speisekarten und Tageskarte auflegen',
    'Reservierungen ansehen, Tische zuteilen',
    'Toiletten kontrollieren: sauber, Seife, Papier',
    'Eingang und Terrasse kehren',
  ]],
  ['ck_close_s', 'Schließen Bar/Service', 'daily', 'service', [
    'Tische abräumen und abwischen',
    'Kaffeemaschine reinigen und ausschalten',
    'Zapfanlage spülen, Tropfbleche reinigen',
    'Gläser spülen und einräumen',
    'Getränke auffüllen, Fehlendes aufschreiben',
    'Kassa-Abschluss machen, Tageslosung zählen',
    'Bargeld in den Tresor legen',
    'Toiletten kontrollieren',
    'Boden kehren und wischen',
    'Müll und Leergut hinausbringen',
    'Fenster schließen, Licht und Musik aus',
    'Eingangstür abschließen',
  ]],
  ['ck_week', 'Wochenputz', 'weekly', 'kueche', [
    'Kühlhaus ausräumen und auswischen',
    'Tiefkühler auf Eis und Ordnung prüfen',
    'Filter im Dunstabzug reinigen',
    'Fritteuse gründlich reinigen, Öl wechseln',
    'Regale im Trockenlager abwischen, MHD prüfen',
    'Abflüsse und Bodenrinnen reinigen',
    'Kaffeemaschine entkalken oder Reinigungsprogramm starten',
    'Fliesen und Wände hinter den Geräten wischen',
    'Mülltonnen auswaschen',
    'Erste-Hilfe-Kasten und Feuerlöscher ansehen',
  ]],
];
function ckDefaultTemplates(since, wd){
  return CK_DEFAULTS.map(([id, name, when, area, items]) => ({id, name, when, wd: when === 'weekly' ? wd : null, area, active:true, sug:true, since,
    items: items.map((it, i) => Array.isArray(it) ? {id:`${id}_${i + 1}`, t:it[0], val:{unit:it[1], min:it[2], max:it[3]}} : {id:`${id}_${i + 1}`, t:it})}));
}

/* ---------- Beispiel-Team: erfundene Namen, als Beispiel markiert ---------- */
function tmDemo(d){
  const t = d.team; const today = isoDate(new Date()); const closed = (d.settings && d.settings.closed) || [];
  const users = (d.settings && d.settings.users) || []; const uid0 = r => { const u = users.find(x => x.role === r); return u ? u.id : ''; };
  const P = (id, name, area, target, color, user) => ({id, name, area, target, color, active:true, user:user || '', demo:true});
  t.people = [P('tp_anna','Anna','kueche',40,0,uid0('chef')), P('tp_lukas','Lukas','kueche',40,1), P('tp_magdalena','Magdalena','service',38.5,2), P('tp_theresa','Theresa','service',30,3), P('tp_hannes','Hannes','bar',38.5,4), P('tp_florian','Florian','abwasch',20,5,uid0('team'))];
  const F = [['08:00','16:00']], Sp = [['15:00','23:00']], T = [['10:00','14:00'],['17:30','22:00']];
  // je Person: Wochentag (0 = Montag) → Zeiten
  const plan = {
    tp_anna:{1:F, 3:F, 4:F, 5:F, 6:F}, tp_lukas:{0:Sp, 1:Sp, 3:Sp, 4:Sp, 5:Sp}, tp_magdalena:{0:T, 1:T, 4:T, 5:T, 6:T},
    tp_theresa:{3:Sp, 4:Sp, 5:Sp, 6:[['11:00','19:00']]}, tp_hannes:{1:[['16:00','00:00']], 3:[['16:00','00:00']], 4:[['17:00','01:00']], 5:[['17:00','01:00']], 6:[['10:00','18:00']]}, tp_florian:{4:[['17:00','22:00']], 5:[['17:00','22:00']], 6:[['11:00','16:00']]},
  };
  const W0 = tmMonday(today); t.shifts = {}; t.abs = {}; let n = 0;
  const wdClosed = i => closed.includes((i + 1) % 7);
  [-2, -1, 0, 1].forEach(wk => { const W = dAdd(W0, wk * 7);
    Object.entries(plan).forEach(([pid, days]) => Object.entries(days).forEach(([i, parts]) => { if(wdClosed(+i)) return; const D = dAdd(W, +i);
      if(wk === 1 && pid === 'tp_theresa' && +i >= 3 && +i <= 5) return; if(wk === 0 && pid === 'tp_florian' && +i === 6) return;
      (t.shifts[D] = t.shifts[D] || []).push({id:'ts_d' + (n++), pid, parts:parts.map(p => [...p]), area:t.people.find(p => p.id === pid).area, note: pid === 'tp_florian' && +i === 5 ? 'Bankett' : '', demo:true}); })); });
  [3, 4, 5].forEach(i => { const D = dAdd(W0, 7 + i); (t.abs[D] = t.abs[D] || {}).tp_theresa = {t:'urlaub', note:'', demo:true}; });
  (t.abs[dAdd(W0, 6)] = t.abs[dAdd(W0, 6)] || {}).tp_florian = {t:'wunsch', note:'Familienfeier', demo:true};
  t.patterns = [{id:'tw_normal', name:'Normale Woche', demo:true, days:[0,1,2,3,4,5,6].map(i => Object.entries(plan).filter(([pid, days]) => days[i] && !wdClosed(i)).map(([pid, days]) => ({pid, parts:days[i].map(p => [...p]), area:t.people.find(p => p.id === pid).area, note:''})))}];
  t.demo = true;
  // Checklisten der letzten zwei Wochen, damit der Verlauf etwas zeigt
  const c = d.checks; c.runs = c.runs || {}; const since = dAdd(today, -15); c.templates.forEach(tp => { if(tp.sug) tp.since = since; });
  const first = (D, areas) => { const s = (t.shifts[D] || []).filter(x => areas.includes(x.area)).sort((a, b) => tmMin(a.parts[0][0]) - tmMin(b.parts[0][0]))[0]; const p = s && t.people.find(x => x.id === s.pid); return p ? p.name : 'Anna'; };
  const last = (D, areas) => { const s = (t.shifts[D] || []).filter(x => areas.includes(x.area)).sort((a, b) => tmSpan(b.parts[b.parts.length - 1])[1] - tmSpan(a.parts[a.parts.length - 1])[1])[0]; const p = s && t.people.find(x => x.id === s.pid); return p ? p.name : 'Lukas'; };
  const hmAdd = (base, k) => { const m = base + k; return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  for(let k = 15; k >= 1; k--){ const D = dAdd(today, -k); const w = dParse(D).getDay(); const open = !closed.includes(w) || (t.shifts[D] || []).length > 0; const seed = +D.slice(8) + k;
    c.templates.forEach(tp => { const due = tp.when === 'weekly' ? w === tp.wd : open; if(!due) return;
      const isOpen = /open/.test(tp.id), kitchen = tp.area === 'kueche'; const who = tp.when === 'weekly' ? 'Lukas' : isOpen ? first(D, kitchen ? ['kueche','abwasch'] : ['service','bar']) : last(D, kitchen ? ['kueche','abwasch'] : ['service','bar']);
      const base = tp.when === 'weekly' ? 14 * 60 : isOpen ? (kitchen ? 7 * 60 + 48 : 9 * 60 + 40) : (kitchen ? 22 * 60 + 20 : 23 * 60 + 5);
      const run = {items:{}, n:tp.items.length, demo:true}; let skip = tp.id === 'ck_close_s' && k === 6 ? 3 : 0;
      tp.items.forEach((it, i) => { if(skip && i >= tp.items.length - skip) return; const rec = {b:who, a:hmAdd(base, i * 2 + (seed + i) % 3)};
        if(it.val){ let v = it.val.max <= -18 ? -19 - (seed + i) % 3 : it.val.max >= 8 ? 5 + ((seed * 3) % 20) / 10 : 2.8 + ((seed * 7 + i) % 18) / 10;
          if(tp.id === 'ck_open_k' && k === 4 && i === 1){ v = 6.4; rec.note = 'Tür stand offen. Nach 30 Minuten wieder 4 °C.'; rec.out = 1; } rec.v = Math.round(v * 10) / 10; }
        run.items[it.id] = rec; });
      (c.runs[D] = c.runs[D] || {})[tp.id] = run; }); }
}
function tmDemoRemove(){
  const t = S.team, c = S.checks; const ids = new Set(t.people.filter(p => p.demo).map(p => p.id));
  t.people = t.people.filter(p => !p.demo);
  Object.keys(t.shifts).forEach(D => { t.shifts[D] = t.shifts[D].filter(s => !s.demo && !ids.has(s.pid)); if(!t.shifts[D].length) delete t.shifts[D]; });
  Object.keys(t.abs).forEach(D => { Object.keys(t.abs[D]).forEach(pid => { if(ids.has(pid)) delete t.abs[D][pid]; }); if(!Object.keys(t.abs[D]).length) delete t.abs[D]; });
  t.patterns = t.patterns.filter(p => !p.demo);
  Object.keys(c.runs).forEach(D => { Object.keys(c.runs[D]).forEach(k => { if(c.runs[D][k].demo) delete c.runs[D][k]; }); if(!Object.keys(c.runs[D]).length) delete c.runs[D]; });
  const today = isoDate(new Date()); c.templates.forEach(tp => { if(tp.since < today) tp.since = today; });
  ekDemoRemove();
  t.demo = false;
}

/* ---------- Zustand: alte Sicherungen laden, Kaputtes aussortieren, Altes aufräumen ---------- */
function teamMigrate(d){
  if(!d || typeof d !== 'object') return d;
  const obj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const today = isoDate(new Date()); const fresh = !obj(d.team);
  if(fresh) d.team = {};
  const t = d.team;
  if(!Array.isArray(t.people)) t.people = [];
  t.people = t.people.filter(p => obj(p) && p.id).map((p, i) => { p.name = String(p.name || 'Person').slice(0, 40); if(!TM_AREA[p.area]) p.area = 'kueche'; p.target = +p.target > 0 ? +p.target : null; p.color = (+p.color >= 0 ? +p.color : i) % TM_NCOL; p.active = p.active !== false; p.user = p.user || ''; return p; });
  if(!obj(t.shifts)) t.shifts = {}; if(!obj(t.abs)) t.abs = {};
  const cutS = dAdd(today, -TM_KEEP_SHIFTS); const okPart = p => Array.isArray(p) && TM_TIME.test(p[0]) && TM_TIME.test(p[1]) && p[0] !== p[1];
  Object.keys(t.shifts).forEach(D => { if(!TM_DATE.test(D) || D < cutS || !Array.isArray(t.shifts[D])){ delete t.shifts[D]; return; }
    t.shifts[D] = t.shifts[D].filter(s => obj(s) && s.pid && Array.isArray(s.parts) && s.parts.length && s.parts.every(okPart)).map(s => { if(!s.id) s.id = uid('ts'); s.parts = s.parts.slice(0, 2).map(p => [p[0], p[1]]); if(!TM_AREA[s.area]) s.area = 'kueche'; s.note = String(s.note || '').slice(0, 80); return s; });
    if(!t.shifts[D].length) delete t.shifts[D]; });
  Object.keys(t.abs).forEach(D => { if(!TM_DATE.test(D) || D < cutS || !obj(t.abs[D])){ delete t.abs[D]; return; } Object.keys(t.abs[D]).forEach(pid => { const a = t.abs[D][pid]; if(!obj(a) || !TM_ABS[a.t]) delete t.abs[D][pid]; }); if(!Object.keys(t.abs[D]).length) delete t.abs[D]; });
  if(!Array.isArray(t.templates)) t.templates = tmDefaultTemplates();
  t.templates = t.templates.filter(x => obj(x) && Array.isArray(x.parts) && x.parts.length && x.parts.every(okPart)).map(x => { if(!x.id) x.id = uid('tt'); x.name = String(x.name || 'Dienst').slice(0, 30); x.parts = x.parts.slice(0, 2); return x; });
  if(!Array.isArray(t.patterns)) t.patterns = [];
  t.patterns = t.patterns.filter(x => obj(x) && Array.isArray(x.days) && x.days.length === 7).map(x => { if(!x.id) x.id = uid('tw'); x.name = String(x.name || 'Vorlage').slice(0, 40); x.days = x.days.map(l => (Array.isArray(l) ? l : []).filter(s => obj(s) && s.pid && Array.isArray(s.parts) && s.parts.every(okPart))); return x; });
  t.settings = Object.assign({breakAfter:6, breakMin:30, breakPaid:false}, obj(t.settings) ? t.settings : {});
  if(!(+t.settings.breakAfter >= 0)) t.settings.breakAfter = 6; if(!(+t.settings.breakMin >= 0)) t.settings.breakMin = 30; t.settings.breakPaid = !!t.settings.breakPaid;

  const freshC = !obj(d.checks); if(freshC) d.checks = {};
  const c = d.checks;
  if(!Array.isArray(c.templates)){ const cl = (d.settings && d.settings.closed) || []; c.templates = ckDefaultTemplates(today, cl.length ? cl[0] : 1); }
  c.templates = c.templates.filter(x => obj(x) && x.id).map(x => { x.name = String(x.name || 'Liste').slice(0, 40); x.when = x.when === 'weekly' ? 'weekly' : 'daily'; x.wd = x.when === 'weekly' ? (+x.wd >= 0 && +x.wd <= 6 ? +x.wd : 1) : null; x.active = x.active !== false; if(!TM_DATE.test(x.since || '')) x.since = today;
    x.items = (Array.isArray(x.items) ? x.items : []).filter(i => obj(i) && i.id && String(i.t || '').trim()).map(i => { if(i.val && !(obj(i.val) && isFinite(+i.val.min) && isFinite(+i.val.max))) delete i.val; return i; });
    if(!Array.isArray(x.old)) x.old = []; return x; });
  if(!obj(c.runs)) c.runs = {};
  const cutR = dAdd(today, -Math.max(CK_KEEP_RUNS, EK_KEEP_DAYS));   // Eigenkontrolle: mindestens 13 Monate
  Object.keys(c.runs).forEach(D => { if(!TM_DATE.test(D) || D < cutR || !obj(c.runs[D])){ delete c.runs[D]; return; } Object.keys(c.runs[D]).forEach(k => { const r = c.runs[D][k]; if(!obj(r) || !obj(r.items)) delete c.runs[D][k]; }); if(!Object.keys(c.runs[D]).length) delete c.runs[D]; });
  // Beispieldaten: Beispiel-Team dazu, solange noch die Beispieldaten laufen und es noch kein Team gab
  if(fresh && d.demo){ try { tmDemo(d); } catch(e){ console.warn('Team-Beispiel:', e); } }
  return d;
}
function tmS(){ if(!S.team || !S.team.people || !S.team.shifts || !S.checks || !S.checks.runs) teamMigrate(S); return S.team; }
function ckS(){ tmS(); return S.checks; }

/* ---------- Cloud: S.team und S.checks je Datum und je Eintrag zusammenführen ---------- */
function tmMerge(b, l, r, depth){
  const obj = x => !!x && typeof x === 'object' && !Array.isArray(x); const idArr = x => Array.isArray(x) && x.every(e => obj(e) && e.id != null);
  if(l === undefined || r === undefined || depth > 6) return pick3(b, l, r);
  if(idArr(l) && idArr(r) && (l.length || r.length)) return mergeArr(idArr(b) ? b : [], l, r, '')[0];
  if(obj(l) && obj(r)){ const bb = obj(b) ? b : {}; const o = {};
    for(const k of new Set([...Object.keys(r), ...Object.keys(l)])){ const v = tmMerge(bb[k], l[k], r[k], depth + 1); if(v !== undefined && v !== null || (l[k] === null && r[k] === null)) o[k] = v; }
    return o; }
  return pick3(b, l, r);
}
if(typeof merge3 === 'function'){
  const _merge3Team = merge3;
  merge3 = function(base, local, remote){
    const res = _merge3Team(base, local, remote); const bb = base || {};
    try { ['team','checks'].forEach(k => { if(local[k] && remote[k] && typeof local[k] === 'object' && typeof remote[k] === 'object') res[0][k] = tmMerge(bb[k], local[k], remote[k], 0); }); } catch(e){ console.warn('Team zusammenführen:', e); }
    return res;
  };
}

/* Eigene Dialoge bekommen ein Kennzeichen, damit ihre Felder am Handy groß genug sind */
const _openDialogTeam = openDialog;
openDialog = function(...a){ const f = $('#dlgForm'); if(f) delete f.dataset.tm; return _openDialogTeam(...a); };
function tmDialog(...a){ const r = openDialog(...a); const f = $('#dlgForm'); if(f) f.dataset.tm = '1'; return r; }

/* =====================================================================
   Rechenkern Dienstplan
   ===================================================================== */
function tmPerson(id){ return tmS().people.find(p => p.id === id) || null; }
function tmShifts(D){ return tmS().shifts[D] || []; }
function tmShiftsOf(pid, D){ return tmShifts(D).filter(s => s.pid === pid).sort((a, b) => tmMin(a.parts[0][0]) - tmMin(b.parts[0][0])); }
function tmAbsOf(pid, D){ const a = tmS().abs[D]; return (a && a[pid]) || null; }
/* Stunden eines Dienstteils. Unbezahlte Pause: wird von jedem Teil abgezogen, der länger dauert als die Grenze.
   Bei einem Teildienst ist die Lücke zwischen den Teilen schon die Pause. */
function tmPartHours(part, st){ st = st || tmS().settings; const [s, e] = tmSpan(part); let h = (e - s) / 60; if(!st.breakPaid && h > +st.breakAfter) h -= (+st.breakMin || 0) / 60; return Math.max(0, h); }
function tmPartBreak(part, st){ st = st || tmS().settings; const [s, e] = tmSpan(part); return !st.breakPaid && (e - s) / 60 > +st.breakAfter ? (+st.breakMin || 0) : 0; }
function tmShiftHours(sh, st){ return sh.parts.reduce((a, p) => a + tmPartHours(p, st), 0); }
function tmDayHours(pid, D){ return tmShiftsOf(pid, D).reduce((a, s) => a + tmShiftHours(s), 0); }
function tmWeekHours(pid, W){ let h = 0; for(let i = 0; i < 7; i++) h += tmDayHours(pid, dAdd(W, i)); return h; }
function tmWeekCount(W, pred){ let n = 0; for(let i = 0; i < 7; i++) n += tmShifts(dAdd(W, i)).filter(s => !pred || pred(s)).length; return n; }
function tmMePerson(){ const u = me(); const ps = tmS().people; return ps.find(p => p.user && p.user === u.id) || ps.find(p => p.active && p.name.trim().toLowerCase() === String(u.name || '').trim().toLowerCase()) || null; }
function tmWhoName(){ const p = tmMePerson(); return p ? p.name : me().name; }
/* Wer steht in dieser Woche im Plan: alle Aktiven, dazu Inaktive mit Diensten */
function tmRowPeople(W){
  const st = tmS(); const has = new Set(); for(let i = 0; i < 7; i++) tmShifts(dAdd(W, i)).forEach(s => has.add(s.pid));
  const ord = TM_AREAS.map(a => a[0]);
  return st.people.filter(p => p.active || has.has(p.id)).map((p, i) => [p, i]).sort((a, b) => ord.indexOf(a[0].area) - ord.indexOf(b[0].area) || a[1] - b[1]).map(x => x[0]);
}
/* Besetzung eines Tages je Bereich (Personen, nicht Dienste) */
function tmStaff(D){ const o = {}; TM_AREAS.forEach(([k]) => { o[k] = new Set(); }); tmShifts(D).forEach(s => { if(o[s.area]) o[s.area].add(s.pid); }); const r = {}; TM_AREAS.forEach(([k]) => { r[k] = o[k].size; }); return r; }
function tmGaps(D, W, d){ if(tmClosed(D) || !tmWeekCount(W || tmMonday(D))) return []; const s = tmStaff(D); return ['kueche','service'].filter(k => !d || d === 'all' || d === k).filter(k => !s[k]).map(k => TM_AREA[k]); }
/* Hinweise für eine Woche. Nie eine Sperre. */
function tmHints(W){
  const st = tmS(); const out = [];
  st.people.forEach(p => {
    const days = {}; let any = false;
    for(let i = -13; i < 7; i++){ const D = dAdd(W, i); const sh = tmShiftsOf(p.id, D); if(sh.length){ days[D] = sh; if(i >= 0) any = true; } }
    if(!any) return;
    for(let i = 0; i < 7; i++){ const D = dAdd(W, i); const sh = days[D]; if(!sh) continue;
      const prev = days[dAdd(D, -1)];
      if(prev){ const end = Math.max(...prev.flatMap(s => s.parts.map(x => tmSpan(x)[1]))); const start = Math.min(...sh.flatMap(s => s.parts.map(x => tmSpan(x)[0]))) + 1440; const rest = (start - end) / 60;
        if(rest < TM_RULES.rest) out.push({pid:p.id, D, k:'rest', v:rest, txt:`nur ${tmH(Math.max(0, rest))} Std. Ruhe seit dem Dienst am Vortag (unter ${TM_RULES.rest} Std.)`}); }
      const h = sh.reduce((a, s) => a + tmShiftHours(s), 0);
      if(h > TM_RULES.dayMax + 1e-9) out.push({pid:p.id, D, k:'long', v:h, txt:`${tmH(h)} Std. an einem Tag (über ${TM_RULES.dayMax} Std.)`});
      let run = 1; while(days[dAdd(D, -run)]) run++;
      if(run > TM_RULES.rowMax) out.push({pid:p.id, D, k:'row', v:run, txt:`${run}. Arbeitstag in Folge (mehr als ${TM_RULES.rowMax})`}); }
    const wh = tmWeekHours(p.id, W);
    if(wh > TM_RULES.weekMax + 1e-9) out.push({pid:p.id, D:null, k:'week', v:wh, txt:`${tmH(wh)} Std. in dieser Woche (über ${TM_RULES.weekMax} Std.)`});
  });
  return out.sort((a, b) => (a.D || '9').localeCompare(b.D || '9'));
}
function tmMonthStats(ym){
  const st = tmS(); const [y, m] = ym.split('-').map(Number); const nDays = new Date(y, m, 0).getDate(); const rows = new Map();
  const row = pid => { if(!rows.has(pid)) rows.set(pid, {pid, n:0, h:0, urlaub:0, krank:0, wunsch:0}); return rows.get(pid); };
  for(let d = 1; d <= nDays; d++){ const D = `${ym}-${String(d).padStart(2, '0')}`; tmShifts(D).forEach(s => { const r = row(s.pid); r.n++; r.h += tmShiftHours(s); }); const a = st.abs[D] || {}; Object.keys(a).forEach(pid => { row(pid)[a[pid].t]++; }); }
  return st.people.filter(p => p.active || rows.has(p.id)).map(p => { const r = row(p.id); const soll = p.target ? p.target * nDays / 7 : null; return {...r, p, soll, diff: soll != null ? r.h - soll : null}; });
}

/* ---------- Ändern: immer mit Rückweg ---------- */
function tmSnap(){ return JSON.stringify({shifts:S.team.shifts, abs:S.team.abs}); }
function tmRestore(snap){ const o = JSON.parse(snap); S.team.shifts = o.shifts; S.team.abs = o.abs; save(); render(); }
function tmUndoToast(msg, snap){ toast(msg, {action:() => { tmRestore(snap); toast('Rückgängig gemacht'); }}); }
function tmSetWeek(W, list){
  // list: [[Wochentag 0–6, {pid, parts, area, note}], …] ersetzt alle Dienste der Woche
  const st = tmS(); let add = 0, skip = 0;
  for(let i = 0; i < 7; i++) delete st.shifts[dAdd(W, i)];
  list.forEach(([i, s]) => { const p = tmPerson(s.pid); const D = dAdd(W, i); if(!p || !p.active || tmAbsOf(s.pid, D)){ skip++; return; }
    (st.shifts[D] = st.shifts[D] || []).push({id:uid('ts'), pid:s.pid, parts:s.parts.map(x => [x[0], x[1]]), area:TM_AREA[s.area] ? s.area : p.area, note:s.note || ''}); add++; });
  return {add, skip};
}
function tmWeekList(W){ const out = []; for(let i = 0; i < 7; i++) tmShifts(dAdd(W, i)).forEach(s => out.push([i, s])); return out; }
function tmCopyPrev(W){
  if(!roGate()) return; const src = tmWeekList(dAdd(W, -7));
  if(!src.length){ toast('In der Vorwoche stehen keine Dienste.'); return; }
  const run = () => { const snap = tmSnap(); const r = tmSetWeek(W, src); save(); render(); tmUndoToast(`${plural(r.add, 'Dienst', 'Dienste')} aus der Vorwoche kopiert${r.skip ? `, ${r.skip} ausgelassen (abwesend oder nicht mehr im Team)` : ''}`, snap); };
  const n = tmWeekCount(W);
  if(n) tmDialog('Vorwoche kopieren', `<p class="dlg-p">In dieser Woche ${n === 1 ? 'steht schon ein Dienst' : `stehen schon ${n} Dienste`}. Sie werden durch die Dienste der Vorwoche ersetzt. Abwesenheiten bleiben.</p>`, () => { setTimeout(run, 0); }, {ok:'Ersetzen', toast:false});
  else run();
}
function tmPatternSave(W, name){ const st = tmS(); const days = [0,1,2,3,4,5,6].map(i => tmShifts(dAdd(W, i)).map(s => ({pid:s.pid, parts:s.parts.map(x => [x[0], x[1]]), area:s.area, note:s.note || ''}))); const pt = {id:uid('tw'), name:name.trim().slice(0, 40), days}; st.patterns.push(pt); return pt; }
function tmPatternApply(W, id){ const pt = tmS().patterns.find(x => x.id === id); if(!pt) return null; const list = []; pt.days.forEach((l, i) => l.forEach(s => list.push([i, s]))); return tmSetWeek(W, list); }

/* ---------- Text für WhatsApp, Druck ---------- */
function tmDayLine(D, d){
  const ar = tmDeptAreas(d || 'all'); const sh = tmShifts(D).filter(s => ar.includes(s.area)); if(!sh.length) return tmClosed(D) ? 'Ruhetag' : 'niemand eingeteilt';
  const parts = [];
  TM_AREAS.forEach(([k, l]) => { const list = sh.filter(s => s.area === k).sort((a, b) => tmMin(a.parts[0][0]) - tmMin(b.parts[0][0]) || (tmPerson(a.pid) || {name:''}).name.localeCompare((tmPerson(b.pid) || {name:''}).name, 'de'));
    if(list.length) parts.push(`${l} – ${list.map(s => `${(tmPerson(s.pid) || {name:'?'}).name} ${tmPartsTxt(s.parts, true)}${s.note ? ` (${s.note})` : ''}`).join(', ')}`); });
  return parts.join(' · ');
}
function tmWeekText(W, d){
  const lines = [`Dienstplan${d && d !== 'all' ? ' ' + tmDeptName(d) : ''} KW ${tmKw(W)} (${tmDm(W)}–${tmDm(dAdd(W, 6))})`];
  for(let i = 0; i < 7; i++){ const D = dAdd(W, i); lines.push(`${tmDayTxt(D)}: ${tmDayLine(D, d)}`); }
  return lines.join('\n');
}
function tmPrintHtml(W, d){
  d = d || 'all'; const ppl = tmDeptPeople(tmRowPeople(W), W, d); const ar = tmDeptAreas(d); const days = [0,1,2,3,4,5,6].map(i => dAdd(W, i)); const dense = ppl.length > 12 ? 'd3' : ppl.length > 8 ? 'd2' : '';
  const cell = (p, D) => { const sh = tmShiftsOf(p.id, D), ab = tmAbsOf(p.id, D);
    return sh.map(s => `<div class="tp-s"><b>${s.parts.map(x => esc(tmPartTxt(x))).join('<br>')}</b>${s.area !== p.area || s.note ? `<small>${esc([s.area !== p.area ? TM_AREA[s.area] : '', s.note].filter(Boolean).join(' · '))}</small>` : ''}</div>`).join('') + (ab && !sh.length ? `<span class="tp-a">${ab.t === 'urlaub' ? 'Urlaub' : 'abwesend'}</span>` : ''); };
  return `<div class="tm-print ${dense}"><div class="meta"><span>${esc(S.settings.name)}</span><span>Stand ${fmtDate(new Date().toISOString())}, ${tmNowHm()} Uhr</span></div>
    <h1>Dienstplan${d !== 'all' ? ' ' + tmDeptName(d) : ''} · KW ${tmKw(W)}</h1><p class="tp-sub">${esc(tmRangeTxt(W))}</p>
    <table><thead><tr><th></th>${days.map(D => `<th class="${tmClosed(D) ? 'cl' : ''}"><b>${tmWdShort(D)}</b> ${tmDm(D)}${tmClosed(D) ? '<small>Ruhetag</small>' : ''}</th>`).join('')}</tr></thead>
    <tbody>${tmGroups(ppl, d).map(([gl, gp]) => (gl ? `<tr class="tp-g"><th colspan="8">${gl}</th></tr>` : '') + gp.map(p => `<tr><th><b>${esc(p.name)}</b><small>${TM_AREA[p.area]}</small></th>${days.map(D => `<td class="${tmClosed(D) ? 'cl' : ''}">${cell(p, D)}</td>`).join('')}</tr>`).join('')).join('')}</tbody>
    <tfoot><tr><th>Besetzung</th>${days.map(D => { const s = tmStaff(D); return `<td class="${tmClosed(D) ? 'cl' : ''}">${TM_AREAS.filter(([k]) => s[k] && ar.includes(k)).map(([k, l]) => `${l} ${s[k]}`).join('<br>')}</td>`; }).join('')}</tr></tfoot></table></div>`;
}
function tmPrint(){
  const W = tmView().w; const d = tmDept(); if(!tmDeptPeople(tmRowPeople(W), W, d).length){ toast('Noch kein Team, kein Plan zum Drucken'); return; }
  const el = $('#print'); PDF_NAME = pdfFileName(`Dienstplan-${d !== 'all' ? tmDeptName(d) + '-' : ''}KW${String(tmKw(W)).padStart(2, '0')}-${W}`); el.classList.remove('hs-print'); el.classList.add('land'); el.innerHTML = tmPrintHtml(W, d); document.body.classList.remove('print-menu', 'print-report'); window.print();
}
function tmCopyText(){
  const txt = tmWeekText(tmView().w, tmDept());
  const fb = () => tmDialog('Dienstplan als Text', `<p class="dlg-p">Text markieren, kopieren und in WhatsApp einfügen.</p><textarea class="code" readonly id="tmTxt" rows="9">${esc(txt)}</textarea>`, null, {cancel:'Schließen', after:() => $('#tmTxt').select()});
  let pr = null; try { pr = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(txt) : null; } catch(e){ pr = null; }
  if(pr) pr.then(() => toast('Dienstplan kopiert. In WhatsApp einfügen.'), fb); else fb();
}

/* =====================================================================
   Ansicht Dienstplan
   ===================================================================== */
view.tm = {w:null, day:null, mode:'week', pm:'day', mine:false, month:null};
view.ck = {tab:'heute', run:null, hist:null, month:null};
const TM_MQ = window.matchMedia('(max-width:700px)');
function tmPhone(){ return TM_MQ.matches; }
function tmView(){
  const v = view.tm || (view.tm = {mode:'week', pm:'day'}); const t = todayStr();
  if(!TM_DATE.test(v.w || '')) v.w = tmMonday(t); else v.w = tmMonday(v.w);
  if(!TM_DATE.test(v.day || '') || v.day < v.w || v.day > dAdd(v.w, 6)) v.day = t >= v.w && t <= dAdd(v.w, 6) ? t : v.w;
  if(!/^\d{4}-\d{2}$/.test(v.month || '')) v.month = dAdd(v.w, 3).slice(0, 7);
  return v;
}
function tmHintMap(hints){ const m = new Map(); hints.forEach(h => { const k = h.pid + '|' + (h.D || ''); m.set(k, (m.get(k) || []).concat(h.txt)); }); return m; }
function tmShiftChip(s, p, D, hm, ro){
  const hint = hm.get(p.id + '|' + D); const sub = [s.area !== p.area ? TM_AREA[s.area] : '', s.note].filter(Boolean).join(' · ');
  const label = `${p.name}, ${tmDayTxt(D)}, ${tmPartsTxt(s.parts)}${hint ? '. Hinweis: ' + hint.join('; ') : ''}`;
  return `<button type="button" class="tm-sh c${p.color}${hint ? ' hint' : ''}" data-act="tmEdit" data-id="${D}|${s.id}" aria-label="${esc(label)}"${hint ? ` title="${esc('Hinweis: ' + hint.join('; '))}"` : ''}><b>${s.parts.map(x => `<span>${tmPartTxt(x)}</span>`).join('')}</b>${sub ? `<small>${esc(sub)}</small>` : ''}${hint ? '<i class="tm-mk" aria-hidden="true"></i>' : ''}</button>`;
}
function tmAbsChip(a, p, D){ return `<button type="button" class="tm-ab ${a.t}" data-act="tmAbs" data-id="${p.id}|${D}" aria-label="${esc(`${p.name}, ${tmDayTxt(D)}: ${TM_ABS[a.t]}${a.note ? ', ' + a.note : ''}`)}"${a.note ? ` title="${esc(a.note)}"` : ''}>${TM_ABS[a.t]}${a.note ? `<small>${esc(a.note)}</small>` : ''}</button>`; }
function tmStaffHtml(D, W, d){ const s = tmStaff(D); const gaps = tmGaps(D, W, d); const ar = tmDeptAreas(d || 'all'); return TM_AREAS.filter(([k]) => s[k] && ar.includes(k)).map(([k, l]) => `<span>${l} <b>${s[k]}</b></span>`).join('') + gaps.map(g => `<span class="gap">${g} fehlt</span>`).join(''); }
function tmWeekTable(W, ppl, hm, ro, d){
  const days = [0,1,2,3,4,5,6].map(i => dAdd(W, i)); const t = todayStr(); const meP = tmMePerson();
  const head = days.map(D => `<th scope="col" class="${D === t ? 'today' : ''} ${tmClosed(D) ? 'closed' : ''}"><b>${tmWdShort(D)}</b><span>${tmDm(D)}</span>${tmClosed(D) ? '<small>Ruhetag</small>' : ''}</th>`).join('');
  const row = p => { const wk = hm.get(p.id + '|');
    const h = tmWeekHours(p.id, W);
    return `<tr class="${p.active ? '' : 'off'}"><th scope="row"><div class="tm-pc"><i class="tm-dot c${p.color}"></i><b class="tm-name">${esc(p.name)}</b><b class="tm-hv" data-help="tm_stunden">${tmH(h)}</b><small class="tm-ar">${TM_AREA[p.area]}${p.active ? '' : ' · nicht mehr aktiv'}</small><small class="tm-hs">${p.target ? `von ${tmH(p.target)} Std.` : 'Std.'}</small>${wk ? `<small class="tm-wk" title="${esc('Hinweis: ' + wk.join('; '))}"><i class="tm-mk" aria-hidden="true"></i>über ${TM_RULES.weekMax} Std.</small>` : ''}</div></th>
      ${days.map(D => { const sh = tmShiftsOf(p.id, D), ab = tmAbsOf(p.id, D); const can = !ro || (meP && meP.id === p.id);
        return `<td class="${D === t ? 'today' : ''} ${tmClosed(D) ? 'closed' : ''}" data-act="tmAdd" data-id="${p.id}|${D}">${sh.map(s => tmShiftChip(s, p, D, hm, ro)).join('')}${ab ? tmAbsChip(ab, p, D) : ''}${can ? `<button type="button" class="tm-plus" data-act="tmAdd" data-id="${p.id}|${D}" aria-label="${esc(ro ? `Frei-Wunsch für ${tmDayTxt(D)} eintragen` : `Dienst für ${p.name} am ${tmDayTxt(D)} eintragen`)}">${ico('plus')}</button>` : ''}</td>`; }).join('')}</tr>`; };
  const rows = tmGroups(ppl, d || 'all').map(([gl, gp]) => (gl ? `<tr class="tm-grp"><th scope="colgroup" colspan="8">${gl}<span>${gp.length}</span></th></tr>` : '') + gp.map(row).join('')).join('');
  return `<div class="tm-wrap"><table class="tm-t"><thead><tr><th scope="col" class="tm-corner">${ppl.length} ${ppl.length === 1 ? 'Person' : 'Personen'}</th>${head}</tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><th scope="row">Besetzung</th>${days.map(D => `<td class="${tmClosed(D) ? 'closed' : ''}" data-help="tm_besetzung">${tmStaffHtml(D, W, d)}</td>`).join('')}</tr></tfoot></table></div>`;
}
/* Handy: Woche auf einen Blick, sieben schmale Spalten */
function tmWeekMini(W, ppl, hm, ro, d){
  const days = [0,1,2,3,4,5,6].map(i => dAdd(W, i)); const t = todayStr();
  const cell = (p, D) => { const sh = tmShiftsOf(p.id, D), ab = tmAbsOf(p.id, D); const hint = hm.get(p.id + '|' + D);
    let inner = '', lab = `${p.name}, ${tmDayTxt(D)}: `;
    if(sh.length){ const a = sh[0].parts[0][0], b = sh[sh.length - 1].parts[sh[sh.length - 1].parts.length - 1][1]; const split = sh.length > 1 || sh[0].parts.length > 1; inner = `<span class="tm-mc c${p.color}${split ? ' split' : ''}"><b>${tmShort(a)}</b><b>${tmShort(b)}</b></span>`; lab += sh.map(s => tmPartsTxt(s.parts)).join(', '); }
    else if(ab){ inner = `<span class="tm-ma">${{urlaub:'Url.', krank:'krank', wunsch:'nicht'}[ab.t]}</span>`; lab += TM_ABS[ab.t]; }
    else lab += 'frei';
    return `<td class="${D === t ? 'today' : ''} ${tmClosed(D) ? 'closed' : ''}"><button type="button" class="tm-mb" data-act="tmDay" data-id="${D}" aria-label="${esc(lab)}">${inner}${hint ? '<i class="tm-mk" aria-hidden="true"></i>' : ''}</button></td>`; };
  return `<table class="tm-mini"><thead><tr><th></th>${days.map(D => `<th class="${D === t ? 'today' : ''} ${tmClosed(D) ? 'closed' : ''}"><b>${tmWdShort(D)}</b><span>${dParse(D).getDate()}.</span></th>`).join('')}</tr></thead>
    <tbody>${tmGroups(ppl, d || 'all').map(([gl, gp]) => (gl ? `<tr class="tm-grp"><th colspan="8">${gl}</th></tr>` : '') + gp.map(p => `<tr><th scope="row"><b>${esc(p.name)}</b><small>${tmH(tmWeekHours(p.id, W))} Std.</small></th>${days.map(D => cell(p, D)).join('')}</tr>`).join('')).join('')}</tbody>
    <tfoot><tr><th scope="row">Leute</th>${days.map(D => { const ar = tmDeptAreas(d || 'all'); const n = new Set(tmShifts(D).filter(s => ar.includes(s.area)).map(s => s.pid)).size; const g = tmGaps(D, W, d).length; return `<td class="${tmClosed(D) ? 'closed' : ''}"><span class="${g ? 'gap' : ''}">${n || (tmClosed(D) ? '' : '–')}</span></td>`; }).join('')}</tr></tfoot></table>
    <p class="hint tm-mini-h">Tippen Sie auf einen Tag, um ihn zu öffnen.</p>`;
}
/* Handy: ein Tag je Bildschirm */
function tmDayView(W, D, ppl, hm, ro, d){
  const days = [0,1,2,3,4,5,6].map(i => dAdd(W, i)); const t = todayStr(); const meP = tmMePerson();
  const strip = `<div class="tm-days" role="tablist" aria-label="Tag wählen">${days.map(x => `<button type="button" role="tab" aria-selected="${x === D}" class="${x === D ? 'on' : ''} ${tmClosed(x) ? 'closed' : ''} ${x === t ? 'today' : ''}" data-act="tmDay" data-id="${x}"><b>${tmWdShort(x)}</b><small>${dParse(x).getDate()}.</small>${tmShifts(x).length ? '<i aria-hidden="true"></i>' : ''}</button>`).join('')}</div>`;
  const dLong = dParse(D).toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long'});
  const drow = p => { const sh = tmShiftsOf(p.id, D), ab = tmAbsOf(p.id, D); const can = !ro || (meP && meP.id === p.id);
    return `<li class="tm-dr ${sh.length ? '' : 'free'}"><span class="tm-pn"><i class="tm-dot c${p.color}"></i><span><b>${esc(p.name)}</b><small>${TM_AREA[p.area]}</small></span></span>
      <span class="tm-dc">${sh.map(s => tmShiftChip(s, p, D, hm, ro)).join('')}${ab ? tmAbsChip(ab, p, D) : ''}${!sh.length && !ab ? '<span class="tm-free">frei</span>' : ''}</span>
      ${can ? `<button type="button" class="tm-plus" data-act="tmAdd" data-id="${p.id}|${D}" aria-label="${esc(ro ? `Frei-Wunsch für ${tmDayTxt(D)} eintragen` : `Dienst für ${p.name} am ${tmDayTxt(D)} eintragen`)}">${ico('plus')}</button>` : '<span class="tm-plus-sp"></span>'}</li>`; };
  const rows = tmGroups(ppl, d || 'all').map(([gl, gp]) => (gl ? `<li class="tm-dgrp">${gl}</li>` : '') + gp.map(drow).join('')).join('');
  const dh = [...hm.entries()].filter(([k]) => k.endsWith('|' + D));
  return `<div class="tm-dayview" data-day="${D}">${strip}
    <h2 class="day-h tm-dh">${esc(dLong)}<span>${tmClosed(D) ? 'Ruhetag' : ''}</span></h2>
    <ul class="tm-dl">${rows}</ul>
    <p class="tm-dstaff" data-help="tm_besetzung">${tmStaffHtml(D, W, d) || (tmClosed(D) ? '<span>Ruhetag, niemand eingeteilt</span>' : '<span>Noch niemand eingeteilt</span>')}</p>
    ${dh.length ? `<ul class="tm-dhints">${dh.map(([k, tx]) => `<li><i class="tm-mk" aria-hidden="true"></i><span><b>${esc((tmPerson(k.split('|')[0]) || {name:'?'}).name)}</b> ${esc(tx.join('; '))}</span></li>`).join('')}</ul><p class="hint">Hinweis, keine Rechtsprüfung.</p>` : ''}
  </div>`;
}
function tmHintsHtml(hints){
  if(!hints.length) return '';
  return `<section class="tm-hints" id="tmHints"><h2 class="day-h">Hinweise<span>Hinweis, keine Rechtsprüfung</span></h2>
    <ul class="rows">${hints.map(h => { const p = tmPerson(h.pid) || {name:'?'}; return `<li class="rw"><span class="rw-lead">${h.D ? tmDayTxt(h.D) : 'Woche'}</span><span class="rw-main"><b>${esc(p.name)}</b><small>${esc(h.txt)}</small></span><span class="rw-meta"></span><span class="rw-act"></span></li>`; }).join('')}</ul>
    <p class="hint">Die App schaut nur auf vier einfache Grenzen: ${TM_RULES.rest} Std. Ruhe zwischen zwei Arbeitstagen, höchstens ${TM_RULES.dayMax} Std. am Tag, höchstens ${TM_RULES.rowMax} Tage in Folge, höchstens ${TM_RULES.weekMax} Std. in der Woche. Sie können trotzdem alles so planen. Was für Ihren Betrieb gilt, sagt Ihnen Ihre Steuerberatung oder die Wirtschaftskammer.</p></section>`;
}
function tmMonthHtml(ym, d){
  const rows = tmMonthStats(ym).filter(r => !d || d === 'all' || tmDeptOf(r.p.area) === d); const [y, m] = ym.split('-').map(Number);
  if(!rows.length) return '<p class="tm-empty">Noch kein Team angelegt.</p>';
  return `<div class="lt-wrap tm-month"><table class="lt"><thead><tr><th>Person</th><th class="r">Dienste</th><th class="r">Stunden</th><th class="r hide-m">Soll ca.</th><th class="r">Differenz</th><th class="r hide-m">Urlaub</th><th class="r hide-m">Krank</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td><div class="lt-n"><span><b>${esc(r.p.name)}</b><small>${TM_AREA[r.p.area]}${r.p.target ? ` · ${tmH(r.p.target)} Std. je Woche` : ''}</small></span></div></td><td class="r">${num(r.n)}</td><td class="r"><b>${tmH(r.h)}</b></td><td class="r hide-m">${r.soll != null ? tmH(r.soll) : '<span class="lt-muted">—</span>'}</td><td class="r">${r.diff != null ? `${r.diff > 0.004 ? '+' : r.diff < -0.004 ? '−' : ''}${tmH(Math.abs(r.diff))}` : '<span class="lt-muted">—</span>'}</td><td class="r hide-m">${r.urlaub ? num(r.urlaub) + ' T.' : '<span class="lt-muted">—</span>'}</td><td class="r hide-m">${r.krank ? num(r.krank) + ' T.' : '<span class="lt-muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>
    <p class="hint">Stunden ${tmS().settings.breakPaid ? 'mit bezahlter Pause' : `ohne unbezahlte Pause (${num(tmS().settings.breakMin)} Min. bei Diensten über ${tmH(tmS().settings.breakAfter)} Std.)`}. „Soll ca.“ ist das Wochensoll, umgerechnet auf die ${new Date(y, m, 0).getDate()} Tage des Monats. Keine Lohnabrechnung.</p>`;
}
function renderDienst(){
  const st = tmS(); const v = tmView(); const W = v.w; const ro = !canEditAll(); const phone = tmPhone(); const t = todayStr();
  const meP = tmMePerson(); const month = v.mode === 'month';
  const title = month ? `${MONTHS[+v.month.slice(5) - 1]} ${v.month.slice(0, 4)}` : `KW ${tmKw(W)}`;
  const sub = month ? 'Stunden je Person im Monat' : `KW ${tmKw(W)} · ${tmRangeTxt(W)}`;
  const head = (btns) => `<div class="page-h"><div><h1>Team & Zahlen</h1>${phone && !month ? (st.demo ? '<p class="sub">Beispiel-Team, Namen sind erfunden</p>' : '') : `<p class="sub">${esc(sub)}${st.demo ? ' · Beispiel-Team, Namen sind erfunden' : ''}</p>`}</div>${btns ? `<div class="row-btns">${btns}</div>` : ''}</div>${teamTabs()}`;
  if(!st.people.length) return head('') + `<section class="panel empty tm-none">Noch kein Team. Legen Sie zuerst die Leute an, dann tragen Sie die Dienste ein.${ro ? '' : `<div class="row-btns" style="justify-content:center;margin-top:12px"><button type="button" class="btn primary" data-act="tmTeam">${ico('plus')}Team anlegen</button></div>`}</section>`;
  const isCur = month ? v.month === t.slice(0, 7) : W === tmMonday(t);
  const nav = `<div class="tm-nav"><button type="button" class="icon-btn" data-act="tmPrev" aria-label="${month ? 'Voriger Monat' : 'Vorige Woche'}">${ico('arrow')}</button><span class="tm-kw" aria-live="polite"><b>${title}</b>${month ? '' : `<small>${tmDm(W)}–${tmDm(dAdd(W, 6))}</small>`}</span><button type="button" class="icon-btn" data-act="tmNext" aria-label="${month ? 'Nächster Monat' : 'Nächste Woche'}">${ico('arrow', 'flip')}</button><button type="button" class="btn sm tm-now" data-act="tmToday" ${isCur ? 'disabled' : ''}>${month ? 'Dieser Monat' : 'Diese Woche'}</button></div>`;
  const modes = phone && !month ? [['day','Tag'],['week','Woche']] : [];
  const cur = v.pm;
  const seg = modes.length ? `<div class="seg tm-modes" role="group" aria-label="Ansicht">${modes.map(([k, l]) => `<button type="button" class="${cur === k ? 'on' : ''}" data-act="tmMode" data-id="${k}" aria-pressed="${cur === k}">${l}</button>`).join('')}</div>` : '';
  const mine = month ? '' : `<button type="button" class="chip tm-mine ${v.mine ? 'on' : ''}" data-act="tmMine" aria-pressed="${!!v.mine}">Mein Dienst</button>`;
  const dept = tmDept();
  const dseg = `<div class="seg tm-dept" role="group" aria-label="Plan wählen" data-help="tm_bereich">${[['all','Alle'], ...TM_DEPTS].map(([k, l]) => `<button type="button" class="${dept === k ? 'on' : ''}" data-act="tmDept" data-id="${k}" aria-pressed="${dept === k}">${l}</button>`).join('')}</div>`;
  const bar = `<div class="tm-bar">${nav}${dseg}${seg}${mine}</div>`;
  const btns = month ? '' : `<button type="button" class="btn" data-act="tmText">Text kopieren</button><button type="button" class="btn primary" data-pdf="tmPrint">${ico('download')}Als PDF speichern</button>`;
  const more = moreOpts('dienst', month ? `<button type="button" class="btn sm" data-act="tmMode" data-id="week">Zurück zur Woche</button>` : `${ro ? '' : `<button type="button" class="btn sm" data-act="tmTeam">Team verwalten</button><button type="button" class="btn sm" data-act="tmCopyPrev">Vorwoche kopieren</button><button type="button" class="btn sm" data-act="tmPatterns">Wochenvorlagen</button>`}<button type="button" class="btn sm" data-act="tmMode" data-id="month">Stunden im Monat</button>`);
  if(month) return head('') + bar + tmMonthHtml(v.month, dept) + more;
  let ppl = tmDeptPeople(tmRowPeople(W), W, dept); let mineNote = '';
  if(v.mine){ if(meP) ppl = ppl.filter(p => p.id === meP.id); else { v.mine = false; } }
  if(v.mine && meP){ const n = tmWeekCount(W, s => s.pid === meP.id); mineNote = `<p class="tm-mine-n">${n ? `${esc(meP.name)}: ${plural(n, 'Dienst', 'Dienste')}, ${tmH(tmWeekHours(meP.id, W))} Std. in dieser Woche.` : `${esc(meP.name)}: in dieser Woche kein Dienst.`}</p>`; }
  const inPlan = new Set(ppl.map(p => p.id)); const hints = tmHints(W).filter(h => inPlan.has(h.pid) && (!v.mine || (meP && h.pid === meP.id))); const hm = tmHintMap(hints);
  const body = !ppl.length ? `<p class="tm-empty">Im Plan ${tmDeptName(dept)} steht noch niemand. Den Bereich einer Person stellen Sie unter „Team verwalten“ ein.</p>` : phone ? (v.pm === 'week' ? tmWeekMini(W, ppl, hm, ro, dept) : tmDayView(W, v.day, ppl, hm, ro, dept)) : tmWeekTable(W, ppl, hm, ro, dept);
  const roNote = ro ? `<p class="hint tm-ro">Den Plan ändert der Chef. ${meP ? 'Einen Frei-Wunsch tragen Sie selbst ein: Tippen Sie in Ihrer Zeile auf das Plus.' : 'Tippen Sie auf „Mein Dienst“ und wählen Sie Ihren Namen, dann können Sie Frei-Wünsche eintragen.'}</p>` : '';
  const acts = phone ? `<div class="tm-acts">${btns}</div>` : '';
  return head(phone ? '' : btns) + bar + mineNote + body + roNote + (phone && v.pm === 'day' ? '' : tmHintsHtml(hints)) + acts + more;
}

/* ---------- Dialoge Dienstplan ---------- */
function tmWhoDlg(then){
  const st = tmS(); const u = me(); const ps = st.people.filter(p => p.active);
  if(!ps.length){ toast('Noch kein Team angelegt'); return; }
  tmDialog('Wer sind Sie?', `<p class="dlg-p">Sie sind angemeldet als <b>${esc(whoLabel(u))}</b>. Wählen Sie Ihren Namen im Dienstplan. Das gilt für diese Anmeldung.</p><div class="tm-who">${ps.map(p => `<button type="button" class="btn" data-tmwho="${p.id}"><i class="tm-dot c${p.color}"></i>${esc(p.name)}<small>${TM_AREA[p.area]}</small></button>`).join('')}</div>`, null, {cancel:'Abbrechen', after:f => { f.onclick = e => { const b = e.target.closest('[data-tmwho]'); if(!b) return; st.people.forEach(p => { if(p.user === u.id) p.user = ''; }); const p = tmPerson(b.dataset.tmwho); p.user = u.id; save(); $('#dlg').close(); render(); toast(`Sie sind ${p.name}`); if(then) then(p); }; }});
}
function tmPartsFromForm(f){
  const g = n => (f.elements[n] ? f.elements[n].value : ''); const parts = [];
  const s1 = g('s1'), e1 = g('e1'), s2 = g('s2'), e2 = g('e2'); const two = !f.querySelector('.tm-p2').hidden;
  if(!TM_TIME.test(s1) || !TM_TIME.test(e1)) return {err:'Bitte Beginn und Ende eintragen.', el:f.elements[TM_TIME.test(s1) ? 'e1' : 's1']};
  if(s1 === e1) return {err:'Beginn und Ende sind gleich.', el:f.elements.e1};
  parts.push([s1, e1]);
  if(two){
    if(!TM_TIME.test(s2) || !TM_TIME.test(e2)) return {err:'Bitte auch den zweiten Teil eintragen oder ihn entfernen.', el:f.elements[TM_TIME.test(s2) ? 'e2' : 's2']};
    if(s2 === e2) return {err:'Beginn und Ende sind gleich.', el:f.elements.e2};
    const a = tmSpan(parts[0]); const b0 = tmMin(s2);
    if(a[1] > 1440 || b0 < a[1]) return {err:'Der zweite Teil muss nach dem ersten beginnen.', el:f.elements.s2};
    parts.push([s2, e2]);
    if(tmSpan(parts[1])[1] - a[0] > 1440) return {err:'Ein Dienst kann nicht länger als 24 Stunden dauern.', el:f.elements.e2};
  }
  return {parts};
}
function tmSumTxt(parts){
  const st = tmS().settings; const gross = parts.reduce((a, p) => { const [s, e] = tmSpan(p); return a + (e - s) / 60; }, 0); const brk = parts.reduce((a, p) => a + tmPartBreak(p, st), 0); const net = parts.reduce((a, p) => a + tmPartHours(p, st), 0);
  const nextDay = parts.some(p => tmSpan(p)[1] > 1440);
  return `${tmH(net)} Std.${brk ? ` · ${tmH(gross)} Std. minus ${num(brk)} Min. Pause` : ''}${nextDay ? ' · endet am nächsten Tag' : ''}`;
}
function tmShiftDlg(pid, D, sid){
  const st = tmS(); const p = tmPerson(pid); if(!p) return;
  if(!canEditAll()){ tmWishDlg(pid, D); return; }
  const cur = sid ? tmShifts(D).find(s => s.id === sid) : null; const ab = tmAbsOf(pid, D);
  const parts = cur ? cur.parts : []; const two = parts.length > 1;
  const body = `
    <div class="tm-tpl" role="group" aria-label="Vorlage wählen">${st.templates.map(t => `<button type="button" class="tm-tb" data-tmtpl="${t.id}"><b>${esc(t.name)}</b><span>${t.parts.map(x => tmPartTxt(x)).join('<br>')}</span></button>`).join('')}</div>
    <div class="tm-times"><label class="f">Von<input type="time" name="s1" step="300" value="${parts[0] ? parts[0][0] : ''}"></label><label class="f">Bis<input type="time" name="e1" step="300" value="${parts[0] ? parts[0][1] : ''}"></label></div>
    <div class="tm-times tm-p2" ${two ? '' : 'hidden'}><label class="f">Zweiter Teil von<input type="time" name="s2" step="300" value="${two ? parts[1][0] : ''}"></label><label class="f">Bis<input type="time" name="e2" step="300" value="${two ? parts[1][1] : ''}"></label></div>
    <button type="button" class="link tm-split" data-tmsplit="1" aria-expanded="${two}">${two ? 'Zweiten Teil entfernen' : 'Teildienst: zweiten Teil dazu'}</button>
    <p class="tm-sum" id="tmSum" aria-live="polite"></p>
    <div class="fields"><label class="f">Bereich<select name="area">${TM_AREAS.map(([k, l]) => `<option value="${k}" ${(cur ? cur.area : p.area) === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="f">Notiz (optional)<input name="note" maxlength="60" value="${esc(cur ? cur.note : '')}" placeholder="z. B. Bankett, Putztag"></label></div>
    ${ab ? `<p class="tm-abn">${esc(p.name)} ist an diesem Tag eingetragen als: <b>${TM_ABS[ab.t]}</b>${ab.note ? ` (${esc(ab.note)})` : ''}.</p>` : ''}
    ${cur ? '' : `<div class="tm-or"><span>Kein Dienst, sondern:</span>${Object.entries(TM_ABS).map(([k, l]) => `<button type="button" class="btn sm" data-tmabs="${k}">${l}</button>`).join('')}</div>`}
    <button type="button" class="link tm-tpl-edit" data-tmtpledit="1">Dienst-Vorlagen ändern</button>`;
  tmDialog(`${p.name} · ${tmDayTxt(D)}`, body, (fd, f) => {
    const r = tmPartsFromForm(f); if(r.err) return dlgErr(r.el, r.err);
    // Überschneidung mit einem anderen Dienst derselben Person an diesem Tag
    const others = tmShiftsOf(pid, D).filter(s => !cur || s.id !== cur.id); const iv = r.parts.map(tmSpan);
    if(others.some(s => s.parts.some(x => { const [a, b] = tmSpan(x); return iv.some(([c, d]) => c < b && a < d); }))) return dlgErr(f.elements.s1, `${p.name} hat an diesem Tag schon einen Dienst in dieser Zeit.`);
    if(ab && !cur && !f.dataset.force){ f.dataset.force = '1'; const b = f.querySelector('button[type="submit"]'); if(b) b.textContent = 'Trotzdem einteilen';
      const el = document.createElement('p'); el.className = 'tm-conf'; el.setAttribute('role', 'alert'); el.textContent = `${p.name}: ${TM_ABS[ab.t]} an diesem Tag. Wirklich einteilen?`; f.querySelector('.dlg-actions').insertAdjacentElement('beforebegin', el); return false; }
    const snap = tmSnap(); const data = {parts:r.parts, area:fd.get('area'), note:String(fd.get('note') || '').trim()};
    if(cur){ Object.assign(cur, data); delete cur.demo; }
    else (st.shifts[D] = st.shifts[D] || []).push({id:uid('ts'), pid, ...data});
    setTimeout(() => tmUndoToast(cur ? 'Dienst geändert' : `Dienst eingetragen: ${p.name}, ${tmDayTxt(D)}`, snap), 0);
  }, {toast:false, ok: cur ? 'Speichern' : 'Eintragen',
    del: cur ? () => { const snap = tmSnap(); st.shifts[D] = st.shifts[D].filter(s => s.id !== cur.id); if(!st.shifts[D].length) delete st.shifts[D]; save(); render(); tmUndoToast('Dienst gelöscht', snap); } : null,
    after: f => {
      const upd = () => { const r = tmPartsFromForm(f); $('#tmSum').textContent = r.parts ? tmSumTxt(r.parts) : ''; const sig = r.parts ? JSON.stringify(r.parts) : ''; f.querySelectorAll('[data-tmtpl]').forEach(b => { const t = st.templates.find(x => x.id === b.dataset.tmtpl); const on = !!t && JSON.stringify(t.parts) === sig; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); };
      const setTwo = on => { const box = f.querySelector('.tm-p2'); box.hidden = !on; const b = f.querySelector('[data-tmsplit]'); b.textContent = on ? 'Zweiten Teil entfernen' : 'Teildienst: zweiten Teil dazu'; b.setAttribute('aria-expanded', on); if(!on){ f.elements.s2.value = ''; f.elements.e2.value = ''; } };
      f.oninput = upd; upd();
      f.onclick = e => {
        const tb = e.target.closest('[data-tmtpl]');
        if(tb){ const t = st.templates.find(x => x.id === tb.dataset.tmtpl); if(!t) return; f.elements.s1.value = t.parts[0][0]; f.elements.e1.value = t.parts[0][1]; setTwo(t.parts.length > 1); if(t.parts[1]){ f.elements.s2.value = t.parts[1][0]; f.elements.e2.value = t.parts[1][1]; } f.querySelectorAll('.f-err').forEach(n => n.remove()); upd(); return; }
        if(e.target.closest('[data-tmsplit]')){ setTwo(f.querySelector('.tm-p2').hidden); upd(); return; }
        const ab2 = e.target.closest('[data-tmabs]');
        if(ab2){ const snap = tmSnap(); (st.abs[D] = st.abs[D] || {})[pid] = {t:ab2.dataset.tmabs, note:'', by:tmWhoName()}; $('#dlg').close(); save(); render(); tmUndoToast(`${p.name}, ${tmDayTxt(D)}: ${TM_ABS[ab2.dataset.tmabs]}`, snap); return; }
        if(e.target.closest('[data-tmtpledit]')){ $('#dlg').close(); setTimeout(() => tmTplDlg(() => tmShiftDlg(pid, D, sid)), 40); }
      };
    }});
}
/* Abwesenheit ansehen, ändern, entfernen (Chef) */
function tmAbsDlg(pid, D){
  const st = tmS(); const p = tmPerson(pid); const ab = tmAbsOf(pid, D); if(!p) return;
  if(!canEditAll()){ tmWishDlg(pid, D); return; }
  const cur = ab ? ab.t : 'urlaub';
  tmDialog(`${p.name} · ${tmDayTxt(D)}`, `<div class="tm-radio" role="radiogroup" aria-label="Abwesenheit">${Object.entries(TM_ABS).map(([k, l]) => `<label><input type="radio" name="t" value="${k}" ${cur === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
    <label class="f">Notiz (optional)<input name="note" maxlength="60" value="${esc(ab ? ab.note || '' : '')}"></label>${ab && ab.by ? `<p class="hint">Eingetragen von ${esc(ab.by)}.</p>` : ''}`,
    fd => { const snap = tmSnap(); (st.abs[D] = st.abs[D] || {})[pid] = {t:fd.get('t'), note:String(fd.get('note') || '').trim(), by:(ab && ab.by) || tmWhoName()}; setTimeout(() => tmUndoToast(`${p.name}, ${tmDayTxt(D)}: ${TM_ABS[fd.get('t')]}`, snap), 0); },
    {toast:false, del: ab ? () => { const snap = tmSnap(); delete st.abs[D][pid]; if(!Object.keys(st.abs[D]).length) delete st.abs[D]; save(); render(); tmUndoToast('Abwesenheit entfernt', snap); } : null});
}
/* Mitarbeiter und Bar: nur der eigene Frei-Wunsch */
function tmWishDlg(pid, D){
  const st = tmS(); const meP = tmMePerson();
  if(!meP){ tmWhoDlg(p => { if(p.id === pid) tmWishDlg(pid, D); }); return; }
  if(meP.id !== pid){ toast('Sie können nur Ihren eigenen Frei-Wunsch eintragen. Den Plan ändert der Chef.'); return; }
  const ab = tmAbsOf(pid, D);
  if(ab && ab.t !== 'wunsch'){ info(`${meP.name} · ${tmDayTxt(D)}`, `Für diesen Tag ist „${TM_ABS[ab.t]}“ eingetragen. Das ändert der Chef.`); return; }
  const has = tmShiftsOf(pid, D).length;
  tmDialog(`Frei-Wunsch · ${tmDayTxt(D)}`, `<p class="dlg-p">Sie können an diesem Tag nicht arbeiten? Der Wunsch steht dann im Dienstplan. ${has ? 'Sie sind an diesem Tag schon eingeteilt. Sprechen Sie bitte auch mit dem Chef.' : 'Ob es klappt, entscheidet, wer den Plan macht.'}</p><label class="f">Grund (optional)<input name="note" maxlength="60" value="${esc(ab ? ab.note || '' : '')}" placeholder="z. B. Arzttermin"></label>`,
    fd => { const snap = tmSnap(); (st.abs[D] = st.abs[D] || {})[pid] = {t:'wunsch', note:String(fd.get('note') || '').trim(), by:meP.name}; setTimeout(() => tmUndoToast(`Frei-Wunsch für ${tmDayTxt(D)} eingetragen`, snap), 0); },
    {toast:false, ok: ab ? 'Speichern' : 'Wunsch eintragen', del: ab ? () => { const snap = tmSnap(); delete st.abs[D][pid]; if(!Object.keys(st.abs[D]).length) delete st.abs[D]; save(); render(); tmUndoToast('Frei-Wunsch entfernt', snap); } : null});
}
function tmNextColor(used){ const cnt = Array(TM_NCOL).fill(0); used.forEach(c => { cnt[c % TM_NCOL]++; }); return cnt.indexOf(Math.min(...cnt)); }
function tmTeamDlg(){
  if(!roGate()) return; const st = tmS(); const before = JSON.stringify(S.team); const u = me(); const meP = st.people.find(p => p.user === u.id);
  const row = p => `<div class="tm-pr" data-pid="${p.id || ''}" data-color="${p.color}"><i class="tm-dot c${p.color}"></i>
    <input name="pn" value="${esc(p.name)}" placeholder="Vorname" aria-label="Name" maxlength="30" autocomplete="off">
    <select name="pa" aria-label="Bereich">${TM_AREAS.map(([k, l]) => `<option value="${k}" ${p.area === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <span class="tm-pt"><input name="pt" class="num-in" type="text" inputmode="decimal" data-max="80" data-msg="Bitte Stunden je Woche von 0 bis 80 eingeben oder leer lassen." value="${numIn(p.target || '')}" aria-label="Soll-Stunden je Woche" placeholder="–"><small>Std./Wo.</small></span>
    <label class="tm-pact"><input type="checkbox" name="pon" ${p.active !== false ? 'checked' : ''}><span>aktiv</span></label>
    <button type="button" class="icon-btn" data-tmpdel="1" aria-label="Person entfernen" title="Entfernen">${ico('x')}</button></div>`;
  const body = `<div class="tm-ppl" id="tmPpl">${st.people.map(row).join('')}</div>
    <button type="button" class="btn sm tm-padd" data-tmpadd="1">${ico('plus')}Person</button>
    <p class="hint tm-phint">„Aktiv“ aus: Die Person steht nicht mehr im neuen Plan, alte Dienste bleiben. Entfernen löscht auch ihre Dienste.</p>
    <div class="tm-brk"><label class="f">Pause<select name="bp"><option value="0" ${st.settings.breakPaid ? '' : 'selected'}>unbezahlt, wird abgezogen</option><option value="1" ${st.settings.breakPaid ? 'selected' : ''}>bezahlt, zählt mit</option></select></label><label class="f">bei Diensten über, Std.<input name="ba" class="num-in" type="text" inputmode="decimal" data-max="24" value="${numIn(st.settings.breakAfter)}"></label><label class="f">Pause, Min.<input name="bm" class="num-in" type="text" inputmode="numeric" data-max="180" value="${numIn(st.settings.breakMin)}"></label></div>
    <label class="f tm-me">Angemeldet als ${esc(whoLabel(u))}. Das ist im Dienstplan<select name="meP"><option value="">— niemand —</option>${st.people.map(p => `<option value="${p.id}" ${meP && meP.id === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
    ${st.demo ? `<p class="tm-demo-l">Beispiel-Team mit erfundenen Namen. <button type="button" class="link" data-tmdemo="1">Beispiele entfernen</button></p>` : ''}
    <p class="hint tm-priv">Die Namen bleiben auf diesem Gerät und, wenn Sie die Cloud nutzen, in der Cloud Ihres Betriebs.</p>`;
  tmDialog('Team verwalten', body, (fd, f) => {
    const rows = [...f.querySelectorAll('.tm-pr')]; const empty = rows.find(r => !r.querySelector('[name="pn"]').value.trim());
    if(empty) return dlgErr(empty.querySelector('[name="pn"]'), 'Bitte einen Namen eintragen oder die Zeile entfernen.');
    const keep = new Set(); const people = rows.map(r => { const old = r.dataset.pid ? tmPerson(r.dataset.pid) : null; const tv = r.querySelector('[name="pt"]').value.trim();
      const p = Object.assign(old || {id:uid('tp'), user:''}, {name:r.querySelector('[name="pn"]').value.trim(), area:r.querySelector('[name="pa"]').value, target: tv === '' ? null : (+tv > 0 ? +tv : null), color:+r.dataset.color || 0, active:r.querySelector('[name="pon"]').checked}); keep.add(p.id); return p; });
    const gone = st.people.filter(p => !keep.has(p.id)).map(p => p.id);
    st.people = people;
    if(gone.length){ Object.keys(st.shifts).forEach(D => { st.shifts[D] = st.shifts[D].filter(s => !gone.includes(s.pid)); if(!st.shifts[D].length) delete st.shifts[D]; }); Object.keys(st.abs).forEach(D => { gone.forEach(g => delete st.abs[D][g]); if(!Object.keys(st.abs[D]).length) delete st.abs[D]; }); st.patterns.forEach(pt => { pt.days = pt.days.map(l => l.filter(s => !gone.includes(s.pid))); }); }
    st.settings.breakPaid = fd.get('bp') === '1'; st.settings.breakAfter = fd.get('ba') === '' ? 6 : +fd.get('ba'); st.settings.breakMin = fd.get('bm') === '' ? 0 : Math.round(+fd.get('bm'));
    const mp = fd.get('meP'); st.people.forEach(p => { if(p.user === u.id && p.id !== mp) p.user = ''; if(p.id === mp) p.user = u.id; });
    if(st.demo && !st.people.some(p => p.demo)) st.demo = false;
    if(JSON.stringify(S.team) !== before) setTimeout(() => toast(gone.length ? `Team gespeichert, ${plural(gone.length, 'Person', 'Personen')} entfernt` : 'Team gespeichert', {action:() => { S.team = JSON.parse(before); save(); render(); toast('Rückgängig gemacht'); }}), 0);
  }, {toast:false, after: f => {
    f.onclick = e => {
      if(e.target.closest('[data-tmpadd]')){ const used = [...f.querySelectorAll('.tm-pr')].map(r => +r.dataset.color || 0); const box = $('#tmPpl'); box.insertAdjacentHTML('beforeend', row({id:'', name:'', area:'kueche', target:null, color:tmNextColor(used), active:true})); const i = box.lastElementChild.querySelector('[name="pn"]'); i.focus(); i.scrollIntoView({block:'nearest'}); return; }
      const del = e.target.closest('[data-tmpdel]'); if(del){ del.closest('.tm-pr').remove(); return; }
      if(e.target.closest('[data-tmdemo]')){ const snapAll = JSON.stringify({team:S.team, checks:S.checks}); $('#dlg').close(); tmDemoRemove(); save(); render(); toast('Beispiel-Team entfernt', {action:() => { const o = JSON.parse(snapAll); S.team = o.team; S.checks = o.checks; save(); render(); toast('Rückgängig gemacht'); }}); if(!S.team.people.length) setTimeout(tmTeamDlg, 250); }
    };
    if(!st.people.length) f.querySelector('[data-tmpadd]').click();
  }});
}
function tmTplDlg(then){
  if(!roGate()) return; const st = tmS();
  const row = t => `<div class="tm-tr" data-tid="${t.id || ''}"><input name="tn" value="${esc(t.name)}" placeholder="Name" aria-label="Name der Vorlage" maxlength="24">
    <span class="tm-tt"><input type="time" name="a1" step="300" value="${t.parts[0] ? t.parts[0][0] : ''}" aria-label="Von"><span>–</span><input type="time" name="b1" step="300" value="${t.parts[0] ? t.parts[0][1] : ''}" aria-label="Bis"></span>
    <span class="tm-tt"><input type="time" name="a2" step="300" value="${t.parts[1] ? t.parts[1][0] : ''}" aria-label="Zweiter Teil von"><span>–</span><input type="time" name="b2" step="300" value="${t.parts[1] ? t.parts[1][1] : ''}" aria-label="Zweiter Teil bis"></span>
    <button type="button" class="icon-btn" data-tmtdel="1" aria-label="Vorlage entfernen" title="Entfernen">${ico('x')}</button></div>`;
  tmDialog('Dienst-Vorlagen', `<p class="dlg-p">Die Vorlagen stehen beim Eintragen eines Dienstes zur Wahl. Die zweite Zeit brauchen Sie nur für einen Teildienst.</p><div class="tm-trs" id="tmTrs">${st.templates.map(row).join('')}</div><button type="button" class="btn sm" data-tmtadd="1">${ico('plus')}Vorlage</button>`,
    (fd, f) => { const out = []; for(const r of f.querySelectorAll('.tm-tr')){ const g = n => r.querySelector(`[name="${n}"]`); const name = g('tn').value.trim(); const a1 = g('a1').value, b1 = g('b1').value, a2 = g('a2').value, b2 = g('b2').value;
        if(!name) return dlgErr(g('tn'), 'Bitte einen Namen eintragen.'); if(!TM_TIME.test(a1) || !TM_TIME.test(b1) || a1 === b1) return dlgErr(g(TM_TIME.test(a1) ? 'b1' : 'a1'), 'Bitte Beginn und Ende eintragen.');
        const parts = [[a1, b1]]; if(a2 || b2){ if(!TM_TIME.test(a2) || !TM_TIME.test(b2) || a2 === b2) return dlgErr(g(TM_TIME.test(a2) ? 'b2' : 'a2'), 'Zweiter Teil: bitte Beginn und Ende eintragen oder beide Felder leeren.'); if(tmSpan(parts[0])[1] > 1440 || tmMin(a2) < tmSpan(parts[0])[1]) return dlgErr(g('a2'), 'Der zweite Teil muss nach dem ersten beginnen.'); parts.push([a2, b2]); }
        out.push({id:r.dataset.tid || uid('tt'), name, parts}); }
      st.templates = out; },
    {done:'Vorlagen gespeichert', after: f => { f.onclick = e => { if(e.target.closest('[data-tmtadd]')){ $('#tmTrs').insertAdjacentHTML('beforeend', row({id:'', name:'', parts:[]})); $('#tmTrs').lastElementChild.querySelector('input').focus(); } const d = e.target.closest('[data-tmtdel]'); if(d) d.closest('.tm-tr').remove(); }; if(then) $('#dlg').addEventListener('close', () => setTimeout(then, 30), {once:true}); }});
}
function tmPatternsDlg(){
  if(!roGate()) return; const st = tmS(); const W = tmView().w; const n = tmWeekCount(W);
  const list = st.patterns.length ? `<ul class="tm-pats">${st.patterns.map(pt => { const k = pt.days.reduce((a, l) => a + l.length, 0); return `<li><span><b>${esc(pt.name)}</b><small>${plural(k, 'Dienst', 'Dienste')}${pt.demo ? ' · Beispiel' : ''}</small></span><button type="button" class="btn sm" data-tmpat="${pt.id}">Anwenden</button><button type="button" class="icon-btn" data-tmpatdel="${pt.id}" aria-label="Vorlage ${esc(pt.name)} löschen" title="Löschen">${ico('x')}</button></li>`; }).join('')}</ul>` : '<p class="dlg-p">Noch keine Wochenvorlage. Planen Sie eine Woche und speichern Sie sie hier unter einem Namen.</p>';
  tmDialog('Wochenvorlagen', `${list}<p class="hint">„Anwenden“ ersetzt die Dienste der KW ${tmKw(W)}${n ? ` (jetzt ${n})` : ''}. Abwesenheiten bleiben, wer abwesend ist, wird ausgelassen.</p>
    <div class="tm-patsave"><label class="f">KW ${tmKw(W)} als Vorlage speichern<input name="pname" maxlength="40" placeholder="z. B. Hochsaison"></label><button type="button" class="btn" data-tmpatsave="1" ${n ? '' : 'disabled'}>Speichern</button></div>`, null, {cancel:'Schließen', after: f => { f.onclick = e => {
      const ap = e.target.closest('[data-tmpat]');
      if(ap){ const snap = tmSnap(); const r = tmPatternApply(W, ap.dataset.tmpat); $('#dlg').close(); save(); render(); if(r) tmUndoToast(`Vorlage angewendet: ${plural(r.add, 'Dienst', 'Dienste')}${r.skip ? `, ${r.skip} ausgelassen` : ''}`, snap); return; }
      const dl = e.target.closest('[data-tmpatdel]');
      if(dl){ const before = JSON.stringify(st.patterns); st.patterns = st.patterns.filter(x => x.id !== dl.dataset.tmpatdel); save(); $('#dlg').close(); toast('Wochenvorlage gelöscht', {action:() => { st.patterns = JSON.parse(before); save(); toast('Rückgängig gemacht'); }}); return; }
      if(e.target.closest('[data-tmpatsave]')){ const name = f.elements.pname.value.trim(); if(!name){ dlgErr(f.elements.pname, 'Bitte einen Namen eintragen.'); return; } tmPatternSave(W, name); save(); $('#dlg').close(); toast(`Wochenvorlage „${name}“ gespeichert`); }
    }; }});
}

/* =====================================================================
   Checklisten
   ===================================================================== */
/* Der Küchentag endet um 5 Uhr früh: Wer nach Mitternacht zusperrt, hakt noch den Vortag ab. */
function ckToday(){ const d = new Date(Date.now() - 5 * 3600e3); return isoDate(d); }
function ckTpl(id){ return ckS().templates.find(t => t.id === id) || null; }
function ckApplies(tp, D){
  if(!tp.active || tp.deleted || D < (tp.since || '')) return false;
  if(tp.when === 'weekly') return dParse(D).getDay() === tp.wd;
  return !tmClosed(D) || tmShifts(D).length > 0;
}
/* Listen eines Tages: was nach den Regeln fällig ist, dazu alles, was an dem Tag schon begonnen wurde */
function ckDue(D){ const c = ckS(); const runs = c.runs[D] || {}; return c.templates.filter(tp => ckApplies(tp, D) || (runs[tp.id] && Object.keys(runs[tp.id].items).length)); }
function ckRun(D, id){ const r = ckS().runs[D]; return (r && r[id]) || null; }
function ckProg(tp, D){ const run = ckRun(D, tp.id); const ids = tp.items.map(i => i.id); const done = run ? ids.filter(i => run.items[i]).length : 0; const total = ids.length; const out = run ? ids.filter(i => run.items[i] && run.items[i].out).length : 0;
  let last = null; if(run) Object.values(run.items).forEach(r => { if(!last || r.a >= last.a) last = r; });
  return {done, total, out, full: total > 0 && done >= total, started: done > 0, last, over: ckToday() > D}; }
function ckItemLabel(tp, id){ const it = tp.items.find(i => i.id === id) || (tp.old || []).find(i => i.id === id); return it ? it.t : 'Gelöschter Punkt'; }
function ckInRange(val, v){ return v >= +val.min - 1e-9 && v <= +val.max + 1e-9; }
function ckRangeTxt(val){ return `${num(val.min, 1)} bis ${num(val.max, 1)} ${val.unit || ''}`.trim().replace(/-/g, '−'); }
function ckSet(D, tp, it, rec){
  const c = ckS(); const before = ckProg(tp, D).full;
  const day = c.runs[D] = c.runs[D] || {}; const run = day[tp.id] = day[tp.id] || {items:{}, n:tp.items.length};
  if(rec) run.items[it.id] = rec; else delete run.items[it.id];
  run.n = tp.items.length; delete run.demo;
  if(!Object.keys(run.items).length){ delete day[tp.id]; if(!Object.keys(day).length) delete c.runs[D]; }
  const after = ckProg(tp, D).full;
  save(); return after && !before;
}
function ckRec(extra){ return Object.assign({b:tmWhoName(), a:tmNowHm()}, extra || {}); }
function ckVal(v){ return num(v, 1); }
/* Kleine Linie der letzten 14 Tage für einen Messwert */
function ckSeries(tp, it, D, n){ const out = []; for(let k = (n || 14) - 1; k >= 0; k--){ const d = dAdd(D, -k); const run = ckRun(d, tp.id); const r = run && run.items[it.id]; out.push({d, v: r && isFinite(+r.v) ? +r.v : null}); } return out; }
function ckSpark(tp, it, D){
  const ser = ckSeries(tp, it, D); const pts = ser.filter(x => x.v != null); if(pts.length < 2) return '';
  const w = 84, h = 22, pad = 3; const lo = Math.min(+it.val.min, ...pts.map(x => x.v)), hi = Math.max(+it.val.max, ...pts.map(x => x.v)); const sp = hi - lo || 1;
  const X = i => pad + i * (w - 2 * pad) / (ser.length - 1), Y = v => pad + (hi - v) * (h - 2 * pad) / sp;
  const line = ser.map((x, i) => x.v == null ? null : `${X(i).toFixed(1)},${Y(x.v).toFixed(1)}`).filter(Boolean).join(' ');
  const dots = ser.map((x, i) => x.v != null && (!ckInRange(it.val, x.v) || i === ser.length - 1) ? `<circle cx="${X(i).toFixed(1)}" cy="${Y(x.v).toFixed(1)}" r="${i === ser.length - 1 ? 2.4 : 2}" class="${ckInRange(it.val, x.v) ? 'cur' : 'out'}"/>` : '').join('');
  const nOut = pts.filter(x => !ckInRange(it.val, x.v)).length; const yMax = Y(+it.val.max).toFixed(1), yMin = Y(+it.val.min).toFixed(1);
  return `<svg class="ck-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(`${pts.length} Messwerte in 14 Tagen, ${nOut} außerhalb von ${ckRangeTxt(it.val)}`)}"><path class="lim" d="M0 ${yMax}H${w}M0 ${yMin}H${w}"/><polyline points="${line}"/>${dots}</svg>`;
}
function ckProgHtml(pr){ return `<span class="ck-bar" aria-hidden="true"><i style="width:${pr.total ? (pr.done / pr.total * 100).toFixed(1) : 0}%"></i></span>`; }
function ckStateTxt(pr){ return pr.full ? 'fertig' : pr.over ? (pr.started ? 'nicht fertig geworden' : 'nicht gemacht') : pr.started ? 'läuft' : 'offen'; }
function ckOverviewHtml(D){
  const due = ckDue(D); const c = ckS(); const dLong = dParse(D).toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long'});
  if(!c.templates.filter(t => t.active && !t.deleted).length) return `<section class="panel empty">Noch keine Liste. ${canEditAll() ? 'Legen Sie unter „Vorlagen“ eine an.' : 'Der Chef legt die Listen an.'}</section>`;
  if(!due.length) return `<section class="pl-closed ck-none"><h2>Heute ist keine Liste fällig</h2><p>${esc(dLong)}${tmClosed(D) ? ' ist Ruhetag, und im Dienstplan ist niemand eingeteilt.' : '.'} Wochenlisten erscheinen an ihrem Wochentag.</p></section>`;
  return `<ul class="ck-lists">${due.map(tp => { const pr = ckProg(tp, D);
    return `<li><button type="button" class="ck-l ${pr.full ? 'done' : ''}" data-act="ckOpen" data-id="${tp.id}"><span class="ck-ln"><b>${esc(tp.name)}</b><small>${pr.full ? `fertig${pr.last ? ` · ${esc(pr.last.b)}, ${pr.last.a} Uhr` : ''}` : pr.started ? `zuletzt ${esc(pr.last.b)}, ${pr.last.a} Uhr` : tp.when === 'weekly' ? `jede Woche am ${DAYNAME[tp.wd]}` : 'noch nicht begonnen'}${pr.out ? ` · <span class="bad-t">${pr.out} ${pr.out === 1 ? 'Wert' : 'Werte'} außerhalb</span>` : ''}</small></span>
      <span class="ck-lp"><b>${pr.done} von ${pr.total}</b>${ckProgHtml(pr)}</span><span class="ck-go" aria-hidden="true">${pr.full ? ico('check') : ico('arrow', 'flip')}</span></button></li>`; }).join('')}</ul>`;
}
function ckRunHtml(tp, D){
  const run = ckRun(D, tp.id) || {items:{}}; const pr = ckProg(tp, D);
  const row = it => { const r = run.items[it.id]; const on = !!r;
    if(it.val){ const bad = on && r.out;
      return `<li class="ck-i val ${on ? 'on' : ''} ${bad ? 'out' : ''}" data-item="${it.id}"><label class="ck-vl" for="ckv-${it.id}"><span class="ck-box" aria-hidden="true">${ico('check')}</span><span class="ck-t"><span>${esc(it.t)}</span><small>${on ? `${esc(r.b)}, ${r.a} Uhr · ` : ''}erlaubt ${esc(ckRangeTxt(it.val))}${bad && r.note ? ` · <span class="ck-note">${esc(r.note)}</span>` : ''}${on && r.prev && r.prev.length ? ` · korrigiert, vorher <s>${r.prev.map(x => ckVal(x.v)).join(', ')} ${esc(it.val.unit || '')}</s>` : ''}</small></span></label>
        <span class="ck-vin"><input id="ckv-${it.id}" class="num-in ck-v" type="text" inputmode="${+it.val.min < 0 ? 'text' : 'decimal'}" data-num="self" data-ckv="${it.id}" value="${on ? ckVal(r.v) : ''}" placeholder="–" autocomplete="off" aria-label="${esc(it.t)}, Wert in ${esc(it.val.unit || '')}"><span>${esc(it.val.unit || '')}</span></span>
</li>`; }
    return `<li class="ck-i ${on ? 'on' : ''}" data-item="${it.id}"><button type="button" role="checkbox" aria-checked="${on}" class="ck-c" data-act="ckChk" data-id="${it.id}"><span class="ck-box" aria-hidden="true">${ico('check')}</span><span class="ck-t"><span>${esc(it.t)}</span>${on ? `<small>${esc(r.b)}, ${r.a} Uhr</small>` : ''}</span></button></li>`; };
  const dLong = dParse(D).toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long'});
  return `<button type="button" class="back" data-act="ckBack">${ico('arrow')}Alle Listen</button>
    <div class="page-h ck-rh"><div><h1>${esc(tp.name)}</h1><p class="sub">${esc(dLong)}${tp.sug ? ' · Vorschlag, bitte anpassen' : ''}</p></div></div>
    <div class="ck-sticky" id="ckSticky"><b id="ckProg">${pr.done} von ${pr.total}</b>${ckProgHtml(pr)}<span id="ckState">${pr.full ? 'fertig' : ''}</span></div>
    <ul class="ck-items">${tp.items.map(row).join('')}</ul>
    ${pr.full ? `<div class="ck-fin"><p>Alles erledigt. Danke.</p><button type="button" class="btn primary" data-act="ckBack">Zurück zu den Listen</button></div>` : ''}`;
}
function ckHistDays(n){ const t = ckToday(); const out = []; for(let k = 0; k < (n || 14); k++) out.push(dAdd(t, -k)); return out; }
function ckHistDetail(D){
  const due = ckDue(D); const ek = ekHistDetail(D); if(!due.length) return ek || '<p class="ck-hd-none">An diesem Tag war keine Liste fällig.</p>';
  return due.map(tp => { const run = ckRun(D, tp.id) || {items:{}}; const pr = ckProg(tp, D);
    // erledigte Punkte in der Reihenfolge der Liste, dazu Punkte, die es in der Liste nicht mehr gibt
    const ids = tp.items.map(i => i.id).concat(Object.keys(run.items).filter(id => !tp.items.some(i => i.id === id)));
    return `<div class="ck-hd"><h3>${esc(tp.name)}<span>${pr.done} von ${pr.total} · ${ckStateTxt(pr)}</span></h3><ul>${ids.map(id => { const r = run.items[id]; const it = tp.items.find(i => i.id === id) || (tp.old || []).find(i => i.id === id);
      return `<li class="${r ? 'on' : 'miss'} ${r && r.out ? 'out' : ''}"><span class="ck-hs" aria-hidden="true">${r ? ico('check') : ''}</span><span class="ck-ht">${esc(ckItemLabel(tp, id))}${r && r.note ? `<small>${esc(r.note)}</small>` : ''}${r && r.prev && r.prev.length ? `<small>korrigiert, vorher ${r.prev.map(x => `${ckVal(x.v)} (${esc(x.b)}, ${x.a})`).join(', ')}</small>` : ''}</span>${it && it.val ? `<span class="ck-hv">${it.val ? ckSpark(tp, it, D) : ''}<b>${r && r.v != null ? `${ckVal(r.v)} ${esc(it.val.unit || '')}` : '–'}</b></span>` : ''}<span class="ck-hw">${r ? `${esc(r.b)} · ${r.a}` : pr.over ? 'offen geblieben' : 'offen'}</span></li>`; }).join('')}</ul></div>`; }).join('') + ek;
}
function ckHistHtml(){
  const days = ckHistDays(14); const c = ckS(); const today = ckToday();
  const tps = c.templates.filter(tp => days.some(D => ckDue(D).includes(tp)));
  if(!tps.length) return '<section class="panel empty">Noch kein Verlauf. Sobald eine Liste abgehakt wird, steht sie hier.</section>';
  const months = [...new Set(Object.keys(c.runs).map(D => D.slice(0, 7)).concat(today.slice(0, 7)))].sort().reverse(); const mSel = view.ck.month && months.includes(view.ck.month) ? view.ck.month : months[0];
  const rows = days.map(D => { const due = ckDue(D); const open = view.ck.hist === D;
    const cells = tps.map(tp => { if(!due.includes(tp)) return `<span class="ck-hc na"><small>${esc(tp.name)}</small><b aria-label="nicht fällig">–</b></span>`; const pr = ckProg(tp, D);
      return `<span class="ck-hc ${pr.full ? 'ok' : pr.over ? 'late' : ''} ${pr.out ? 'out' : ''}"><small>${esc(tp.name)}</small><b>${pr.done}/${pr.total}</b>${pr.out ? '<i class="ck-od" title="Wert außerhalb" aria-label="Wert außerhalb"></i>' : ''}</span>`; }).join('');
    return `<li class="ck-hr ${open ? 'open' : ''} ${tmClosed(D) ? 'closed' : ''}"><button type="button" class="ck-hb" data-act="ckHist" data-id="${D}" aria-expanded="${open}"><span class="ck-hday"><b>${D === today ? 'Heute' : tmDayTxt(D)}</b>${!due.length ? `<small>${tmClosed(D) ? 'Ruhetag' : 'nichts fällig'}</small>` : ''}</span><span class="ck-hcs" style="--n:${tps.length}">${cells}</span></button>${open ? `<div class="ck-hdw">${ckHistDetail(D)}</div>` : ''}</li>`; }).join('');
  return `<div class="ck-hhead"><span class="ck-hday"></span><span class="ck-hcs" style="--n:${tps.length}">${tps.map(tp => `<span>${esc(tp.name)}</span>`).join('')}</span></div>
    <ul class="ck-hist">${rows}</ul>
    <div class="ck-hpdf"><label class="f">Monat<select data-ckmonth="1" aria-label="Monat für das PDF">${months.map(m => `<option value="${m}" ${m === mSel ? 'selected' : ''}>${MONTHS[+m.slice(5) - 1]} ${m.slice(0, 4)}</option>`).join('')}</select></label><button type="button" class="btn" data-pdf="ckPrint">${ico('download')}Monatsmappe als PDF</button></div>`;
}
function ckTplListHtml(){
  const c = ckS(); const list = c.templates.filter(t => !t.deleted);
  return `<ul class="ck-tpls">${list.map(tp => { const nv = tp.items.filter(i => i.val).length;
    return `<li class="${tp.active ? '' : 'off'}"><span class="ck-ln"><b>${esc(tp.name)}</b><small>${tp.when === 'weekly' ? `jede Woche am ${DAYNAME[tp.wd]}` : 'jeden Öffnungstag'} · ${plural(tp.items.length, 'Punkt', 'Punkte')}${nv ? `, davon ${plural(nv, 'Messwert', 'Messwerte')}` : ''}${tp.active ? '' : ' · ausgeschaltet'}${tp.sug ? ' · Vorschlag, bitte anpassen' : ''}</small></span><button type="button" class="btn sm" data-act="ckTplEdit" data-id="${tp.id}">Bearbeiten</button></li>`; }).join('')}</ul>
    <button type="button" class="btn" data-act="ckTplNew">${ico('plus')}Neue Liste</button>
    ${ekTplHtml()}
    <p class="hint ck-tph">Die Listen sind Vorschläge für eine kleine Küche. Passen Sie sie an Ihren Betrieb an. Sie ersetzen keine behördlich verlangten Aufzeichnungen.</p>`;
}
function renderCheckl(){
  const c = ckS(); const v = view.ck || (view.ck = {tab:'heute'}); const D = ckToday(); const ro = !canEditAll();
  if(v.tab === 'vorlagen' && ro) v.tab = 'heute';
  if(v.ek) return ekPageHtml(v.ek, D);
  if(v.run){ const tp = ckTpl(v.run); if(tp && ckDue(D).includes(tp)) return ckRunHtml(tp, D); v.run = null; }
  const due = ckDue(D); const nDone = due.filter(tp => ckProg(tp, D).full).length; const dLong = dParse(D).toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long'});
  const sub = v.tab === 'verlauf' ? 'Die letzten 14 Tage. Tippen Sie auf einen Tag.' : v.tab === 'vorlagen' ? 'Was auf den Listen steht und wann sie fällig sind.' : `${dLong}${due.length ? ` · ${nDone} von ${due.length} ${due.length === 1 ? 'Liste' : 'Listen'} fertig` : ''}`;
  const tabs = [['heute','Heute'],['verlauf','Verlauf']].concat(ro ? [] : [['vorlagen','Vorlagen']]);
  return `<div class="page-h"><div><h1>Checklisten</h1><p class="sub">${esc(sub)}</p></div></div>
    <div class="toolbar ck-tabs"><div class="seg" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" aria-selected="${v.tab === k}" class="${v.tab === k ? 'on' : ''}" data-act="ckTab" data-id="${k}">${l}</button>`).join('')}</div></div>
    ${v.tab === 'verlauf' ? ckHistHtml() : v.tab === 'vorlagen' ? ckTplListHtml() : ckOverviewHtml(D) + ekOverviewHtml(D)}`;
}
/* Messwert eintragen: im Bereich sofort, außerhalb mit kurzer Notiz */
function ckValueInput(inp){
  const v0 = view.ck; const D = ckToday(); const tp = ckTpl(v0.run); if(!tp) return; const it = tp.items.find(i => i.id === inp.dataset.ckv); if(!it || !it.val) return;
  const run = ckRun(D, tp.id); const old = run && run.items[it.id]; const raw = inp.value.trim().replace(/[−–]/g, '-').replace(/\s|°|C$/gi, '');
  if(raw === ''){ if(old && !canEditAll()){ inp.value = ckVal(old.v); toast('Einen eingetragenen Wert löscht nur der Chef. Ein falscher Wert lässt sich überschreiben.'); return; } if(old){ ckSet(D, tp, it, null); render(); toast('Wert gelöscht', {action:() => { ckSet(D, tp, it, old); render(); }}); } else inp.value = ''; return; }
  const v = /^-?\d+([.,]\d+)?$/.test(raw) ? numParse(raw) : NaN;
  if(!isFinite(v) || Math.abs(v) > 999){ inp.value = old ? ckVal(old.v) : ''; inp.classList.add('bad-in'); setTimeout(() => inp.classList.remove('bad-in'), 1600); toast('Bitte eine Zahl eingeben, zum Beispiel 3,5 oder -18.'); return; }
  if(old && Math.abs(old.v - v) < 1e-9) { inp.value = ckVal(old.v); return; }
  // Korrektur: der alte Wert bleibt am Eintrag stehen
  const prev = old ? {prev:(old.prev || []).concat([{v:old.v, b:old.b, a:old.a}]).slice(-6)} : {};
  const fin = rec => { const full = ckSet(D, tp, it, rec); render(); if(full) toast(`${tp.name}: alles erledigt`); else if(old) toast('Korrektur gespeichert. Der alte Wert bleibt sichtbar.'); };
  if(ckInRange(it.val, v)){ fin(ckRec({v, ...prev})); return; }
  tmDialog('Wert außerhalb des Bereichs', `<p class="dlg-p"><b>${esc(it.t)}: ${ckVal(v)} ${esc(it.val.unit || '')}</b><br>Erlaubt sind ${esc(ckRangeTxt(it.val))}. Was haben Sie getan?</p><label class="f">Kurze Notiz<input name="note" maxlength="120" placeholder="z. B. Tür war offen, Chef informiert" autocomplete="off"></label>`,
    (fd, f) => { const note = String(fd.get('note') || '').trim(); if(note.length < 3) return dlgErr(f.elements.note, 'Bitte kurz notieren, was getan wurde.'); setTimeout(() => { const full = ckSet(D, tp, it, ckRec({v, out:1, note, ...prev})); render(); toast(full ? `${tp.name}: alles erledigt` : 'Wert mit Notiz gespeichert'); }, 0); },
    {ok:'Mit Notiz speichern', toast:false});
  $('#dlg').addEventListener('close', () => { if(!ckRun(D, tp.id) || !(ckRun(D, tp.id).items[it.id] && Math.abs(ckRun(D, tp.id).items[it.id].v - v) < 1e-9)) setTimeout(() => { if(view.tab === 'checkl') render(); }, 60); }, {once:true});
}
function ckToggle(id){
  const D = ckToday(); const tp = ckTpl(view.ck.run); if(!tp) return; const it = tp.items.find(i => i.id === id); if(!it) return;
  const run = ckRun(D, tp.id); const old = run && run.items[id];
  if(old){ ckSet(D, tp, it, null); render(); toast(it.val ? 'Wert gelöscht' : 'Häkchen entfernt', {action:() => { ckSet(D, tp, it, old); render(); }}); return; }
  const y = window.scrollY; const full = ckSet(D, tp, it, ckRec()); render(); window.scrollTo(0, y);
  if(full) toast(`${tp.name}: alles erledigt`);
}
function ckTplDlg(id){
  if(!roGate()) return; const c = ckS(); const tp = id ? ckTpl(id) : null; const isNew = !tp;
  const cur = tp || {id:'', name:'', when:'daily', wd:1, active:true, items:[]};
  const row = it => `<li class="ck-er" data-iid="${it.id || ''}"><span class="ck-mv"><button type="button" class="icon-btn" data-ckup="1" aria-label="Nach oben" title="Nach oben">${ico('arrow', 'up')}</button><button type="button" class="icon-btn" data-ckdn="1" aria-label="Nach unten" title="Nach unten">${ico('arrow', 'down')}</button></span>
    <input name="it" value="${esc(it.t || '')}" maxlength="90" placeholder="Was ist zu tun?" aria-label="Punkt">
    <label class="ck-ev"><input type="checkbox" name="iv" ${it.val ? 'checked' : ''}><span>Messwert</span></label>
    <button type="button" class="icon-btn" data-ckdel="1" aria-label="Punkt entfernen" title="Entfernen">${ico('x')}</button>
    <span class="ck-evf" ${it.val ? '' : 'hidden'}><label>Einheit<input name="iu" value="${esc(it.val ? it.val.unit || '' : '°C')}" maxlength="8"></label><label>von<input name="imin" inputmode="text" value="${it.val ? numIn(it.val.min) : ''}"></label><label>bis<input name="imax" inputmode="text" value="${it.val ? numIn(it.val.max) : ''}"></label></span></li>`;
  tmDialog(isNew ? 'Neue Liste' : 'Liste bearbeiten', `${cur.sug ? '<p class="ck-sug">Vorschlag, bitte anpassen.</p>' : ''}
    <label class="f">Name<input name="name" required maxlength="40" value="${esc(cur.name)}" placeholder="z. B. Öffnen Terrasse"></label>
    <div class="fields"><label class="f">Wann<select name="when"><option value="daily" ${cur.when === 'daily' ? 'selected' : ''}>jeden Öffnungstag</option><option value="weekly" ${cur.when === 'weekly' ? 'selected' : ''}>einmal in der Woche</option></select></label>
      <label class="f ck-wd" ${cur.when === 'weekly' ? '' : 'hidden'}>Wochentag<select name="wd">${[1,2,3,4,5,6,0].map(i => `<option value="${i}" ${cur.wd === i ? 'selected' : ''}>${DAYNAME[i]}</option>`).join('')}</select></label>
      <label class="tog ck-act"><input type="checkbox" name="active" ${cur.active ? 'checked' : ''}><span></span>Liste ist eingeschaltet</label></div>
    <div class="f">Punkte</div><ol class="ck-ed" id="ckEd">${cur.items.map(row).join('')}</ol>
    <button type="button" class="btn sm" data-ckadd="1">${ico('plus')}Punkt</button>
    <p class="hint">Messwert: Statt eines Häkchens wird eine Zahl eingetragen, zum Beispiel die Temperatur. Liegt sie außerhalb von „von“ bis „bis“, fragt die App nach einer kurzen Notiz.</p>`,
    (fd, f) => {
      const name = String(fd.get('name') || '').trim(); if(!name) return dlgErr(f.elements.name, 'Bitte einen Namen eintragen.');
      const items = [];
      for(const li of f.querySelectorAll('.ck-er')){ const g = n => li.querySelector(`[name="${n}"]`); const t = g('it').value.trim(); if(!t) continue; const it = {id:li.dataset.iid || uid('ci'), t};
        if(g('iv').checked){ const mn = numParse(g('imin').value.replace(/[−–]/g, '-')), mx = numParse(g('imax').value.replace(/[−–]/g, '-')); if(!isFinite(mn) || !isFinite(mx)) return dlgErr(g(isFinite(mn) ? 'imax' : 'imin'), 'Bitte den erlaubten Bereich eintragen, zum Beispiel von 0 bis 5.'); if(mn > mx) return dlgErr(g('imax'), '„bis“ muss größer sein als „von“.'); it.val = {unit:g('iu').value.trim(), min:mn, max:mx}; }
        items.push(it); }
      if(!items.length) return dlgErr(f.querySelector('[data-ckadd]'), 'Die Liste braucht mindestens einen Punkt.');
      const data = {name, when:fd.get('when') === 'weekly' ? 'weekly' : 'daily', active:!!fd.get('active')}; data.wd = data.when === 'weekly' ? +fd.get('wd') : null;
      if(isNew) c.templates.push({id:uid('ck'), ...data, area:'kueche', since:ckToday(), items, old:[]});
      else { const goneIt = tp.items.filter(o => !items.some(i => i.id === o.id)); tp.old = (tp.old || []).concat(goneIt.map(o => ({id:o.id, t:o.t, val:o.val}))).slice(-60); Object.assign(tp, data, {items}); delete tp.sug; }
    }, {done:'Liste gespeichert', del: isNew ? null : () => ask(`Liste „${tp.name}“ löschen? Der Verlauf der letzten Tage bleibt sichtbar.`, () => { tp.deleted = true; tp.active = false; if(view.ck.run === tp.id) view.ck.run = null; }),
    after: f => {
      f.onchange = e => { if(e.target.name === 'when') f.querySelector('.ck-wd').hidden = e.target.value !== 'weekly'; if(e.target.name === 'iv'){ const li = e.target.closest('.ck-er'); li.querySelector('.ck-evf').hidden = !e.target.checked; } };
      f.onclick = e => { const li = e.target.closest('.ck-er');
        if(e.target.closest('[data-ckadd]')){ $('#ckEd').insertAdjacentHTML('beforeend', row({id:'', t:''})); const i = $('#ckEd').lastElementChild.querySelector('[name="it"]'); i.focus(); i.scrollIntoView({block:'nearest'}); return; }
        if(!li) return;
        if(e.target.closest('[data-ckdel]')){ li.remove(); return; }
        if(e.target.closest('[data-ckup]') && li.previousElementSibling){ li.parentNode.insertBefore(li, li.previousElementSibling); e.target.closest('button').focus(); }
        if(e.target.closest('[data-ckdn]') && li.nextElementSibling){ li.parentNode.insertBefore(li.nextElementSibling, li); e.target.closest('button').focus(); }
      };
      if(isNew) f.querySelector('[data-ckadd]').click(), f.elements.name.focus();
    }});
}
/* Der Monat als PDF: die Monatsmappe (ckPrint, ckPrintHtml) steht in eigen.js */

/* =====================================================================
   Heute: Team-Zeilen im Tagesblatt
   ===================================================================== */
function tmDashHtml(){
  const st = tmS(); const t = todayStr(); const D = ckToday(); const rows = [];
  if(st.people.length){ const sh = tmShifts(t).slice().sort((a, b) => TM_AREAS.findIndex(x => x[0] === a.area) - TM_AREAS.findIndex(x => x[0] === b.area) || tmMin(a.parts[0][0]) - tmMin(b.parts[0][0]));
    const n = new Set(sh.map(s => s.pid)).size;
    const list = sh.map(s => `${esc((tmPerson(s.pid) || {name:'?'}).name)} (${TM_AREA[s.area]} ${tmPartsTxt(s.parts, true)})`).join(', ');
    const gaps = tmGaps(t);
    rows.push(dayRow(n ? num(n) : '–', 'Heute im Dienst', n ? list : tmClosed(t) ? 'Ruhetag, niemand eingeteilt' : 'Noch niemand eingeteilt', gaps.length ? `<span class="tm-gapt">${gaps.join(' und ')} fehlt</span>` : '', `<button type="button" class="btn sm" data-act="tmGo">Dienstplan</button>`, 'tm-dash-who')); }
  ckDue(D).forEach(tp => { const pr = ckProg(tp, D);
    rows.push(dayRow(pr.full ? ico('check') : `${pr.done}/${pr.total}`, esc(tp.name), `${pr.done} von ${pr.total} erledigt${pr.last ? ` · zuletzt ${esc(pr.last.b)}, ${pr.last.a} Uhr` : ''}`, pr.out ? `<span class="bad-t">${pr.out} ${pr.out === 1 ? 'Wert' : 'Werte'} außerhalb</span>` : '', `<button type="button" class="btn sm" data-act="ckGo" data-id="${tp.id}">${pr.full ? 'Ansehen' : 'Abhaken'}</button>`, pr.full ? 'past ck-dash' : 'ck-dash')); });
  { const ek = ekDashRow(D); if(ek) rows.push(ek); }
  if(!rows.length) return '';
  return daySec('Team', D !== t ? 'Checklisten noch vom Vortag, bis 5 Uhr früh' : 'Dienst und Checklisten', rows.join('')).replace('<section class="day-sec">', '<section class="day-sec tm-dash">');
}
const _renderDashTeam = renderDash;
renderDash = function(){
  let h = _renderDashTeam();
  try { const block = tmDashHtml(); if(block){ const i = h.indexOf('<!--dash-extra-->'); if(i >= 0) h = h.slice(0, i) + block + h.slice(i); } } catch(err){ console.warn('Team:', err); }
  return h;
};

/* =====================================================================
   Bedienung
   ===================================================================== */
function tmShiftMove(dir){ const v = tmView(); if(v.mode === 'month'){ const [y, m] = v.month.split('-').map(Number); v.month = isoDate(new Date(y, m - 1 + dir, 1, 12)).slice(0, 7); v.w = tmMonday(v.month + '-15'); v.day = null; } else { v.w = dAdd(v.w, 7 * dir); v.day = dAdd(v.day, 7 * dir); v.month = null; } }
function tmDayMove(dir){ const v = tmView(); v.day = dAdd(v.day, dir); v.w = tmMonday(v.day); v.month = null; render(); }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const a = el.dataset.act, id = el.dataset.id || '';
  if(!/^(tm|ck)[A-Z]/.test(a)) return;
  if(document.body.classList.contains('gd-help')) return; // Hilfe-Modus erklärt, statt zu handeln
  const v = tmView();
  switch(a){
    case 'tmGo': v.w = tmMonday(todayStr()); v.day = todayStr(); v.mode = 'week'; v.pm = 'day'; go('dienst'); break;
    case 'tmPrev': tmShiftMove(-1); render(); break;
    case 'tmNext': tmShiftMove(1); render(); break;
    case 'tmToday': v.w = tmMonday(todayStr()); v.day = todayStr(); v.month = todayStr().slice(0, 7); render(); break;
    case 'tmMode': if(id === 'month'){ v.mode = 'month'; v.month = dAdd(v.w, 3).slice(0, 7); } else { v.mode = 'week'; if(id === 'day' || id === 'week') v.pm = tmPhone() ? id : v.pm; } render(); break;
    case 'tmDept': { v.dept = id === 'kueche' || id === 'service' ? id : 'all'; try { localStorage.setItem('dahuam202_dienst_bereich', v.dept); } catch(e){} render(); break; }
    case 'tmMine': { if(v.mine){ v.mine = false; render(); break; } const on = () => { v.mine = true; render(); }; if(tmMePerson()) on(); else tmWhoDlg(on); break; }
    case 'tmDay': v.day = id; v.pm = 'day'; render(); break;
    case 'tmAdd': { e.stopPropagation(); const [pid, D] = id.split('|'); tmShiftDlg(pid, D); break; }
    case 'tmEdit': { e.stopPropagation(); const [D, sid] = id.split('|'); const s = tmShifts(D).find(x => x.id === sid); if(!s) break; if(!canEditAll()){ roGate(false); break; } tmShiftDlg(s.pid, D, sid); break; }
    case 'tmAbs': { e.stopPropagation(); const [pid, D] = id.split('|'); tmAbsDlg(pid, D); break; }
    case 'tmTeam': tmTeamDlg(); break;
    case 'tmCopyPrev': tmCopyPrev(v.w); break;
    case 'tmPatterns': tmPatternsDlg(); break;
    case 'tmText': tmCopyText(); break;
    case 'ckGo': view.ck.tab = 'heute'; view.ck.run = id || null; view.ck.ek = null; go('checkl'); break;
    case 'ckTab': view.ck.tab = id; view.ck.run = null; view.ck.ek = null; render(); break;
    case 'ckOpen': view.ck.run = id; view.ck.ek = null; render(); window.scrollTo({top:0}); break;
    case 'ckBack': view.ck.run = null; view.ck.ek = null; render(); window.scrollTo({top:0}); break;
    case 'ckChk': ckToggle(id); break;
    case 'ckHist': view.ck.hist = view.ck.hist === id ? null : id; render(); break;
    case 'ckTplEdit': ckTplDlg(id); break;
    case 'ckTplNew': ckTplDlg(null); break;
  }
});
document.addEventListener('click', e => { const b = e.target.closest('[data-pdf="tmPrint"],[data-pdf="ckPrint"]'); if(!b) return; if(b.dataset.pdf === 'tmPrint') tmPrint(); else ckPrint(); }, true);
document.addEventListener('change', e => { const t = e.target; if(!t.dataset) return; if(t.dataset.ckv != null && view.tab === 'checkl') ckValueInput(t); if(t.dataset.ckmonth) view.ck.month = t.value; });
document.addEventListener('keydown', e => { const t = e.target; if(e.key === 'Enter' && t.matches && t.matches('input[data-ckv]')){ e.preventDefault(); t.blur(); } });
/* Handy: wischen wechselt den Tag */
(() => { let sx = 0, sy = 0, on = false;
  document.addEventListener('touchstart', e => { on = !!(e.target.closest && e.target.closest('.tm-dayview')) && e.touches.length === 1; if(on){ sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, {passive:true});
  document.addEventListener('touchend', e => { if(!on) return; on = false; const t = e.changedTouches[0]; const dx = t.clientX - sx, dy = t.clientY - sy; if(Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.8 && view.tab === 'dienst' && !$('#dlg').open) tmDayMove(dx < 0 ? 1 : -1); }, {passive:true}); })();
document.addEventListener('keydown', e => { if(view.tab !== 'dienst' || $('#dlg').open || e.target.closest('input,textarea,select') || e.altKey || e.ctrlKey || e.metaKey) return; if(!$('#pal').hidden || (typeof GD !== 'undefined' && GD.t)) return;
  if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){ const dir = e.key === 'ArrowLeft' ? -1 : 1; if(tmPhone() && tmView().pm === 'day' && tmView().mode !== 'month') tmDayMove(dir); else { tmShiftMove(dir); render(); } } });
const tmMqChange = () => { if(view.tab === 'dienst' && !$('#dlg').open) render(); };
if(TM_MQ.addEventListener) TM_MQ.addEventListener('change', tmMqChange); else if(TM_MQ.addListener) TM_MQ.addListener(tmMqChange);

/* =====================================================================
   Navigation, Begleitung, Aufgaben, Schnellsuche
   ===================================================================== */
ICO.dienst = '<rect x="3.500" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.500 10h17"/><path d="M7.500 14h4M12.500 17h4"/>';
ICO.checkl = '<path d="M9 4.500h6M8 3h8v3H8z"/><path d="M8 4.500H6a1.500 1.500 0 0 0-1.500 1.500v13.500A1.500 1.500 0 0 0 6 21h12a1.500 1.500 0 0 0 1.500-1.500V6A1.500 1.500 0 0 0 18 4.500h-2"/><path d="M8.500 11.200l1.500 1.500 2.600-2.900M8.500 16.200l1.500 1.500 2.600-2.900M15 12h1.500M15 17h1.500"/>';
H('nav_checkl','Checklisten', NAV_DESC.checkl);
H('dienstplan','Dienstplan','Der Plan für eine Woche: wer an welchem Tag von wann bis wann arbeitet. Jede Person hat eine Zeile, jeder Tag eine Spalte.',1);
H('teildienst','Teildienst','Ein Dienst mit einer langen Pause in der Mitte, zum Beispiel 10 bis 14 Uhr und 17:30 bis 22 Uhr. Die App rechnet nur die zwei Teile als Arbeitszeit.',1);
H('ruhezeit','Ruhezeit','Die freie Zeit zwischen dem Ende eines Arbeitstages und dem Beginn des nächsten. Die App gibt einen Hinweis, wenn es weniger als 11 Stunden sind.',1);
H('vorlage','Vorlage','Etwas Gespeichertes zum Wiederverwenden. Eine Dienst-Vorlage ist eine feste Zeit wie „Früh 8 bis 16 Uhr“, eine Wochenvorlage ein ganzer Wochenplan.',1);
H('checkliste','Checkliste','Eine Liste von Handgriffen zum Abhaken, zum Beispiel beim Aufsperren. Jeden Tag beginnt sie leer. Die App merkt sich, wer was wann abgehakt hat.',1);
H('messwert','Messwert','Eine Zahl, die Sie ablesen und eintragen, zum Beispiel die Temperatur im Kühlhaus. Liegt sie außerhalb des erlaubten Bereichs, fragt die App nach einer Notiz.',1);
H('tm_woche','Woche wählen','Mit den Pfeilen blättern Sie eine Woche zurück oder vor. „Diese Woche“ springt zurück zu heute. KW heißt Kalenderwoche.');
H('tm_zelle','Dienst eintragen','Tippen Sie auf das Feld einer Person an einem Tag. Dann wählen Sie eine Vorlage oder tragen die Zeiten selbst ein.');
H('tm_dienst','Ein Dienst','Ein eingetragener Dienst mit Beginn und Ende. Ein Tipp öffnet ihn zum Ändern oder Löschen. Ein Punkt in der Ecke zeigt einen Hinweis an.');
H('tm_abw','Abwesenheit','Urlaub, Krank oder „Kann nicht“. Die Person fehlt an diesem Tag. Wer sie trotzdem einteilt, wird vorher gefragt.');
H('tm_stunden','Stunden in der Woche','Die Arbeitsstunden dieser Person in der Woche, ohne unbezahlte Pause. Dahinter steht das Soll, wenn Sie eines eingetragen haben.');
H('tm_bereich','Küche oder Service','Zwei Pläne in einem: Küche (mit Abwasch) und Service (mit Bar). „Alle“ zeigt beide untereinander. PDF und Text gelten für den Plan, den Sie gerade sehen.');
H('tm_besetzung','Besetzung','Wie viele Leute an diesem Tag je Bereich eingeteilt sind. Fehlt an einem offenen Tag die Küche oder der Service, steht es hier.');
H('tm_hinweise','Hinweise','Die App meldet zu wenig Ruhe, sehr lange Tage, viele Tage in Folge und sehr volle Wochen. Das ist ein Hinweis, keine Rechtsprüfung. Nichts wird gesperrt.');
H('tm_mein','Mein Dienst','Zeigt nur Ihre eigene Zeile. Beim ersten Mal wählen Sie Ihren Namen. Noch ein Tipp zeigt wieder alle.');
H('tm_kopieren','Vorwoche kopieren','Übernimmt alle Dienste der Woche davor in diese Woche. Wer abwesend ist, wird ausgelassen. Mit „Rückgängig“ nehmen Sie es zurück.');
H('tm_wochenvorlage','Wochenvorlagen','Ein ganzer Wochenplan unter einem Namen, zum Beispiel „Hochsaison“. Einmal speichern, dann in jeder Woche mit einem Tipp anwenden.');
H('tm_text','Text kopieren','Der Plan der Woche als einfacher Text, Tag für Tag. Zum Einfügen in WhatsApp oder eine andere Nachricht.');
H('tm_pdf','Als PDF speichern','Der Wochenplan auf einer Seite im Querformat, groß genug zum Aufhängen in der Küche.');
H('tm_team','Team verwalten','Hier legen Sie die Leute an: Name, Bereich und Soll-Stunden je Woche. Auch die Pausenregel stellen Sie hier ein.');
H('tm_monat','Monat','Zeigt die Stunden je Person für einen ganzen Monat und vergleicht sie mit dem Soll. Das ist ein Überblick, keine Lohnabrechnung.');
H('ck_liste','Liste öffnen','Tippen Sie auf eine Liste, um sie abzuhaken. Rechts steht, wie viele Punkte schon erledigt sind.');
H('ck_haken','Abhaken','Ein Tipp setzt das Häkchen mit Ihrem Namen und der Uhrzeit. Noch ein Tipp nimmt es wieder weg.');
H('ck_wert','Wert eintragen','Tippen Sie die abgelesene Zahl ein, zum Beispiel 3,5. Ein Minus davor geht auch, etwa beim Tiefkühler.');
H('ck_verlauf','Verlauf','Die letzten 14 Tage: welche Liste fertig wurde und welche nicht. Ein Tipp auf einen Tag zeigt, wer was wann abgehakt hat.');
H('ck_vorlagen','Listen ändern','Hier ändert der Chef die Listen: Punkte dazu, weg oder in andere Reihenfolge. Die Vorschläge sind zum Anpassen da.');
H('ck_pdf','Verlauf als PDF','Alle Listen eines Monats als Datei: wer wann abgehakt hat und welche Werte eingetragen wurden.');
HELP_SEL.unshift(
  ['#app .tm-nav','tm_woche'], ['#app .tm-t td[data-act="tmAdd"],#app .tm-plus','tm_zelle'], ['#app .tm-sh','tm_dienst'], ['#app .tm-ab','tm_abw'], ['#app .tm-hints','tm_hinweise'],
  ['#app .tm-mine','tm_mein'], ['#app [data-act="tmCopyPrev"]','tm_kopieren'], ['#app [data-act="tmPatterns"]','tm_wochenvorlage'], ['#app [data-act="tmText"]','tm_text'], ['#app [data-pdf="tmPrint"]','tm_pdf'], ['#app [data-act="tmTeam"]','tm_team'],
  ['#app [data-act="tmMode"][data-id="month"],#app .tm-month','tm_monat'], ['#app .tm-days button,#app .tm-mb','tm_woche'], ['#app .tm-dash-who','dienstplan'], ['#app .ck-dash','checkliste'],
  ['#app .ck-l','ck_liste'], ['#app .ck-c','ck_haken'], ['#app .ck-i.val','ck_wert'], ['#app .ck-sticky','checkliste'], ['#app [data-act="ckTab"][data-id="verlauf"],#app .ck-hb','ck_verlauf'], ['#app [data-act="ckTab"][data-id="vorlagen"],#app .ck-tpls li','ck_vorlagen'], ['#app [data-pdf="ckPrint"]','ck_pdf'], ['#app .ck-spark','messwert']);

const _palDataTeam = palData;
palData = function(){
  const a = _palDataTeam(); const D = ckToday();
  a.push({g:'Aktion', n:'Dienstplan diese Woche', s:'Wer arbeitet wann', run:() => { const v = tmView(); v.w = tmMonday(todayStr()); v.day = todayStr(); v.mode = 'week'; go('dienst'); }},
    {g:'Aktion', n:'Mein Dienst', s:'Dienstplan: nur die eigenen Dienste', run:() => { const v = tmView(); v.w = tmMonday(todayStr()); v.mode = 'week'; go('dienst'); const on = () => { v.mine = true; render(); }; if(tmMePerson()) on(); else tmWhoDlg(on); }},
    {g:'Aktion', n:'Dienstplan als Text kopieren', s:'Für WhatsApp', run:() => { if(view.tab !== 'dienst') go('dienst'); tmCopyText(); }});
  if(canEditAll()) a.push({g:'Aktion', n:'Team verwalten', s:'Namen, Bereiche und Soll-Stunden', run:() => { if(view.tab !== 'dienst') go('dienst'); tmTeamDlg(); }});
  const due = ckDue(D); ckS().templates.filter(tp => tp.active && !tp.deleted).forEach(tp => a.push({g:'Aktion', n:'Checkliste ' + tp.name, s: due.includes(tp) ? `${ckProg(tp, D).done} von ${ckProg(tp, D).total} erledigt` : 'heute nicht fällig', run:() => { view.ck.tab = 'heute'; view.ck.run = due.includes(tp) ? tp.id : null; go('checkl'); if(!due.includes(tp)) toast(`${tp.name} ist heute nicht fällig`); }}));
  return a;
};

/* Wer den Bereich verlässt, kommt beim nächsten Mal wieder zur Übersicht der Listen */
const _goTeam = go;
go = function(tab, card){ if(tab !== 'checkl' && view.ck){ view.ck.run = null; view.ck.ek = null; } return _goTeam(tab, card === undefined ? null : card); };
/* Fortschritt der laufenden Liste klebt genau unter der oberen Leiste */
const _renderTeam = render;
render = function(){
  _renderTeam();
  try { const st = $('#ckSticky'); if(st){ const tb = document.querySelector('.topbar'); const h = tb && tb.offsetHeight; st.style.setProperty('--ck-top', (h || 0) + 'px'); st.classList.toggle('full', /^(\d+) von \1$/.test($('#ckProg').textContent)); } } catch(e){}
};
