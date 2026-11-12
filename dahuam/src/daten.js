/* =====================================================================
   Paket C · Eigene Daten
   Ein Weg von den Beispielen zu den eigenen Daten: leer starten oder Beispiele
   behalten, dann Speisekarte, Artikel & Preise, Rezepturen und Team aus Dateien laden.
   EIN Import-Werkzeug für alle: lesen → Spalten zuordnen → prüfen → Vorschau →
   übernehmen als eine Änderung mit Sicherheitskopie (rückgängig).
   S.imports = [{id, type, at, by, file, counts}]
   ===================================================================== */
ICO.daten = '<path d="M12 3v11M7.5 9.5 12 14l4.5-4.5M5 17v3h14v-3"/>';
function datenMigrate(d){ if(!Array.isArray(d.imports)) d.imports = []; d.imports = d.imports.filter(x => x && typeof x === 'object').slice(0, 40); return d; }

/* ---------- Lesen: Zeichensatz, Trennzeichen, Tabellenblätter ---------- */
function impDecode(buf){
  const u = new Uint8Array(buf);
  if(u[0] === 0xFF && u[1] === 0xFE) return {text:new TextDecoder('utf-16le').decode(u.subarray(2)), enc:'UTF-16'};
  if(u[0] === 0xFE && u[1] === 0xFF) return {text:new TextDecoder('utf-16be').decode(u.subarray(2)), enc:'UTF-16'};
  try { return {text:new TextDecoder('utf-8', {fatal:true}).decode(u), enc:'UTF-8'}; }
  catch(e){ return {text:new TextDecoder('windows-1252').decode(u), enc:'Windows-1252'}; }
}
const IMP_DELIM_NAME = {';':'Strichpunkt', ',':'Komma', '\t':'Tabulator', '|':'Senkrechtstrich'};
/* Trennzeichen: das Zeichen, das in den ersten Zeilen am gleichmäßigsten vorkommt (Anführungszeichen beachtet) */
function impDelim(text){
  const lines = text.split(/\r?\n/).filter(l => l.trim()).slice(0, 12); let best = ';', bs = 0;
  for(const c of [';', '\t', ',', '|']){
    const counts = lines.map(l => { let n = 0, q = false; for(const ch of l){ if(ch === '"') q = !q; else if(ch === c && !q) n++; } return n; });
    const withAny = counts.filter(n => n > 0); if(!withAny.length) continue;
    const sorted = [...counts].sort((a, b) => a - b); const med = sorted[Math.floor(sorted.length / 2)];
    const score = med * 10 + withAny.length / counts.length; if(score > bs){ bs = score; best = c; }
  }
  return best;
}
/* Zeilen einer Textdatei; jede Zeile merkt sich ihre Nummer in der Datei (row.n) */
function impCsv(text, delim){
  text = String(text || '').replace(/^﻿/, ''); delim = delim || impDelim(text);
  const rows = []; let row = [], cur = '', q = false, line = 1, start = 1;
  const push = () => { row.push(cur); cur = ''; if(row.some(c => String(c).trim() !== '')){ row.n = start; rows.push(row); } row = []; };
  for(let i = 0; i < text.length; i++){ const ch = text[i];
    if(q){ if(ch === '"'){ if(text[i + 1] === '"'){ cur += '"'; i++; } else q = false; } else { if(ch === '\n') line++; cur += ch; } continue; }
    if(ch === '"' && cur.trim() === ''){ q = true; cur = ''; continue; }
    if(ch === delim){ row.push(cur); cur = ''; continue; }
    if(ch === '\n' || ch === '\r'){ if(ch === '\r' && text[i + 1] === '\n') i++; push(); line++; start = line; continue; }
    cur += ch; }
  push();
  rows.forEach(r => { for(let i = 0; i < r.length; i++) r[i] = String(r[i]).replace(/ /g, ' ').trim(); });
  return {rows, delim};
}
async function impXlsx(){ if(!window.XLSX){ try { await loadLib(XLSX_LIB); } catch(e){ throw new Error('Der Excel-Leser konnte nicht geladen werden. Bitte die Datei als CSV speichern.'); } } return window.XLSX; }
async function impReadFile(file){
  const buf = await file.arrayBuffer();
  if(/\.(xlsx|xlsm|xls|ods)$/i.test(file.name)){
    const X = await impXlsx(); let wb; try { wb = X.read(buf, {type:'array'}); } catch(e){ throw new Error('Die Excel-Datei ist nicht lesbar. Bitte als CSV speichern und noch einmal versuchen.'); }
    const sheets = wb.SheetNames.map(name => { const aoa = X.utils.sheet_to_json(wb.Sheets[name], {header:1, raw:true, defval:''}); const rows = [];
      aoa.forEach((r, i) => { const row = r.map(c => typeof c === 'number' ? String(Math.round(c * 1e6) / 1e6) : String(c == null ? '' : c).replace(/ /g, ' ').trim()); if(row.some(c => c !== '')){ row.n = i + 1; rows.push(row); } });
      return {name, rows}; }).filter(s => s.rows.length);
    if(!sheets.length) throw new Error('Die Excel-Datei enthält keine Zeilen.');
    return {name:file.name, enc:'Excel', sheets};
  }
  const {text, enc} = impDecode(buf); const {rows, delim} = impCsv(text);
  return {name:file.name, enc, delim, sheets:[{name:'', rows}]};
}
/* aus der Zwischenablage: Tabellen aus Webseiten und Word kommen als HTML, sonst als Text mit Tabulatoren */
function impHtmlTable(html){
  try { const doc = new DOMParser().parseFromString(html, 'text/html'); const tb = doc.querySelector('table'); if(!tb) return null;
    const rows = [...tb.querySelectorAll('tr')].map(tr => [...tr.querySelectorAll('th,td')].map(c => c.textContent.replace(/\s+/g, ' ').trim())).filter(r => r.some(c => c));
    return rows.length > 1 ? rows.map(r => r.map(c => /[\t"\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c).join('\t')).join('\n') : null; } catch(e){ return null; }
}

/* ---------- Zahlen, Überschriften, kleine Übersetzer ---------- */
/* Zahl aus einer Zelle: 12,90 · 12.90 · 1.234,50 · € 12,- · ½. Liefert NaN, wenn es keine Zahl ist. */
function impNum(raw){
  let s = String(raw == null ? '' : raw).replace(/[€%\s ']/g, '').replace(/^(eur|euro|ca\.?|etwa)/i, '').replace(/(eur|euro)$/i, '').replace(/,[-–—]+$/, '').replace(/\.[-–—]+$/, '');
  if(!s) return NaN;
  const fr = {'½':.5, '¼':.25, '¾':.75, '⅓':1/3, '⅔':2/3}; if(fr[s] != null) return fr[s];
  let m = s.match(/^(\d+)\/(\d+)$/); if(m) return +m[2] ? +m[1] / +m[2] : NaN;
  if(!/^-?[\d.,]+$/.test(s)) return NaN;
  if(s.includes(',') && s.includes('.')){ if(s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, ''); }
  else if(s.includes(',')){ if((s.match(/,/g) || []).length > 1) s = s.replace(/,/g, ''); else s = s.replace(',', '.'); }
  else if(/^-?\d{1,3}(\.\d{3})+$/.test(s) && !/^-?0\./.test(s)) s = s.replace(/\./g, '');   // 1.250 = eintausend
  const n = parseFloat(s); return isFinite(n) ? n : NaN;
}
/* Überschrift vergleichbar machen: klein, Umlaute aufgelöst, ohne Zeichen und Füllwörter */
function impKey(h){ return String(h || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\b(eur|euro|in|je|pro)\b/g, ' ').replace(/[^a-z0-9]+/g, ''); }
const impYes = v => /^(ja|j|x|1|true|wahr|yes|y|✓|✔|★|\*)$/i.test(String(v || '').trim());
const ALG_WORDS = [['A', /gluten|weizen|getreide/], ['B', /krebs|krusten/], ['C', /^ei$|eier|^ei\b/], ['D', /fisch/], ['E', /erdnu/], ['F', /soja/], ['G', /milch|laktose|lactose/], ['H', /schalenfr|n(u|ü)ss|mandel|haseln|waln/], ['L', /sellerie/], ['M', /senf/], ['N', /sesam/], ['O', /sulfit|schwefel/], ['P', /lupin/], ['R', /weichtier|muschel|schnecke/]];
/* Allergene aus einer Zelle: Buchstaben A–R („A C G“, „A,C,G“, „ACG“), Namen („Gluten, Ei“) oder „keine“. leer = nicht gepflegt */
function impAlg(raw){
  const s = String(raw || '').trim(); if(!s) return {state:'open', alg:''};
  if(/^(keine|keines|ohne|nein|-|–|—|0|frei|allergenfrei)$/i.test(s)) return {state:'none', alg:''};
  const parts = s.split(/[\s,;\/+·|]+/).filter(Boolean); const out = new Set(), bad = [];
  for(const p of parts){ const up = p.toUpperCase().replace(/[().]/g, '');
    if(/^[A-Z]+$/.test(up) && up.length <= 14 && [...up].every(ch => ALG[ch])){ [...up].forEach(ch => out.add(ch)); continue; }
    if(/^[A-Z]$/.test(up)){ bad.push(up); continue; }
    const w = ALG_WORDS.find(([, re]) => re.test(p.toLowerCase())); if(w) out.add(w[0]); else bad.push(p); }
  if(bad.length) return {state:'open', alg:'', bad};
  return {state:'has', alg:[...out].sort().join(' ')};
}
function impVeg(raw){ const s = String(raw || '').trim().toLowerCase(); if(!s || /^(nein|n|-|–|0|fleisch|fisch|fleisch\s*\/\s*fisch)$/.test(s)) return {v:''}; if(/^(vegan|vg)$/.test(s)) return {v:'vg'}; if(/^(vegetarisch|veg|vegi|veggie|v|ja|x)$/.test(s)) return {v:'v'}; return {v:'', bad:true}; }
function impSeasons(raw){ const s = String(raw || '').trim().toLowerCase(); if(!s || /^(alle|immer|ganzj(ä|ae)hrig|ganzes jahr|-|–)$/.test(s)) return {v:[]}; const out = new Set(); let bad = false;
  s.split(/[\s,;\/+&]+|\bund\b/).filter(Boolean).forEach(p => { if(/^w(inter)?$/.test(p)) out.add('winter'); else if(/^(f|fr(ü|ue)hling|fr(ü|ue)hjahr)$/.test(p)) out.add('fruehling'); else if(/^s(ommer)?$/.test(p)) out.add('sommer'); else if(/^h(erbst)?$/.test(p)) out.add('herbst'); else bad = true; });
  const v = SEASONS.map(x => x[0]).filter(k => out.has(k)); return {v: v.length === 4 ? [] : v, bad}; }
const IMP_WD = [['so', 0], ['mo', 1], ['di', 2], ['mi', 3], ['do', 4], ['fr', 5], ['sa', 6]];
function impDays(raw){ const s = String(raw || '').trim().toLowerCase(); if(!s || /^(alle|immer|t(ä|ae)glich|jeden tag|-|–)$/.test(s)) return {v:[]}; const out = new Set(); let bad = false;
  const wd = p => { const w = IMP_WD.find(([k]) => p.replace(/^nur/, '').startsWith(k)); return w ? w[1] : null; };
  s.replace(/\bund\b/g, ',').split(/[\s,;\/+&]+/).filter(Boolean).forEach(p => { if(p === 'nur') return; const r = p.split(/[-–]/);
    if(r.length === 2 && wd(r[0]) != null && wd(r[1]) != null){ let a = wd(r[0]); const b = wd(r[1]); for(let k = 0; k < 7; k++){ out.add(a); if(a === b) break; a = (a + 1) % 7; } }
    else if(wd(p) != null) out.add(wd(p)); else bad = true; });
  const v = [1, 2, 3, 4, 5, 6, 0].filter(i => out.has(i)); return {v: v.length === 7 ? [] : v, bad}; }
function impUnit(raw){ const s = String(raw || '').trim().toLowerCase().replace(/\.$/, ''); if(!s) return {u:'', empty:true};
  if(/^(kg|kilo|kilogramm)$/.test(s)) return {u:'kg'}; if(/^(l|lt|ltr|liter)$/.test(s)) return {u:'l'}; if(/^(stk|stück|stueck|st|stck|pc|pce|pcs|x)$/.test(s)) return {u:'Stk'};
  if(/^(g|gr|gramm|ml|dl|cl)$/.test(s)) return {u:'', small:s};
  const geb = /^(fl|flasche|flaschen|bottle|btl)$/.test(s) ? 'fl' : /^(fass|fässer|faesser|keg)$/.test(s) ? 'fass' : /^(kiste|kisten|kasten|kästen|träger|traeger)$/.test(s) ? 'kiste' : '';
  return {u:'Stk', other:String(raw).trim(), geb}; }
/* Inhalt eines Getränke-Gebindes: „0,75 l“, „70 cl“, „30 l“, „20×0,5 l“, „24 x 0,33“ → {L je Flasche/Fass, N Flaschen} */
function impDrinkPack(text, geb){ const s = String(text || '').toLowerCase().replace(/,/g, '.'); const m = s.match(/(?:(\d+)\s*[x×*]\s*)?(\d+(?:\.\d+)?)\s*(l|lt|ltr|liter|cl|ml)?(?![a-z0-9])/); if(!m || (!m[3] && !m[1] && !/^\s*\d+(\.\d+)?\s*$/.test(s))) return null;
  let L = +m[2]; if(m[3] === 'cl') L /= 100; else if(m[3] === 'ml') L /= 1000; const N = m[1] ? +m[1] : 1; if(!(L > 0) || !(N >= 1) || L > 1000) return null; if(geb === 'kiste' && !m[1]) return null; return {L:Math.round(L * 10000) / 10000, N: geb === 'kiste' ? N : 1, tot: geb === 'kiste' ? 1 : N}; }
/* „Sack 10 kg“, „Karton 6×1 l“, „10x250 g“, „Tray 30 Stk“ → Inhalt in der Einheit des Artikels */
function impPack(text, unit){ const s = String(text || '').toLowerCase().replace(/,/g, '.'); const m = s.match(/(?:(\d+(?:\.\d+)?)\s*[x×*]\s*)?(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl|stk|stück|st|fl|flaschen?|dosen?)\b/); if(!m) return 0;
  let q = (m[1] ? +m[1] : 1) * +m[2]; const u = m[3];
  if(unit === 'kg'){ if(u === 'g') q /= 1000; else if(u !== 'kg') return 0; } else if(unit === 'l'){ if(u === 'ml') q /= 1000; else if(u === 'cl') q /= 100; else if(u !== 'l') return 0; } else if(/^(kg|g|l|ml|cl)$/.test(u)) return m[1] ? +m[1] : 0;
  return Math.round(q * 1000) / 1000; }
function impLoc(raw){ const s = String(raw || '').trim().toLowerCase(); if(!s) return {v:''}; if(LOCS[String(raw).trim().toUpperCase()]) return {v:String(raw).trim().toUpperCase()};
  if(/tief|tk|gefrier|froster/.test(s)) return {v:'T'}; if(/k(ü|ue)hl/.test(s)) return {v:'K'}; if(/gem(ü|ue)se|obst/.test(s)) return {v:'G'}; if(/bar|wein|keller|getr/.test(s)) return {v:'W'}; if(/trocken|lager|magazin|regal/.test(s)) return {v:'L'}; return {v:'L', bad:true}; }
function impArea(raw){ const s = String(raw || '').trim().toLowerCase(); if(!s) return {v:'kueche', empty:true}; if(/k(ü|ue)che|koch|k(ö|oe)ch|kitchen|commis|patiss|grill/.test(s)) return {v:'kueche'}; if(/service|kellner|servier|restaurant|gast/.test(s)) return {v:'service'}; if(/\bbar|schank|theke|barista/.test(s)) return {v:'bar'}; if(/abwasch|sp(ü|ue)l|reinig|steward/.test(s)) return {v:'abwasch'}; return {v:'kueche', bad:true}; }

/* Überschriftenzeile finden und Spalten zuordnen. fields: [{k, label, syn:[…]}] */
function impFieldOf(cell, fields){ const k = impKey(cell); if(!k) return null; return fields.find(f => f.syn.includes(k)) || null; }
function impHeader(rows, fields){
  let hi = -1, bs = 0;
  rows.slice(0, 15).forEach((r, i) => { const hit = new Set(r.map(c => impFieldOf(c, fields)).filter(Boolean).map(f => f.k)); const sc = hit.size; if(sc > bs && (sc >= 2 || (sc === 1 && r.filter(c => c).length <= 2))){ bs = sc; hi = i; } });
  const map = {};
  if(hi >= 0) rows[hi].forEach((c, i) => { const f = impFieldOf(c, fields); if(f && map[f.k] == null) map[f.k] = i; });
  return {hi, map};
}
function impCell(r, map, k){ const i = map[k]; return i == null || i < 0 ? '' : String(r[i] == null ? '' : r[i]).trim(); }
const impHas = (map, k) => map[k] != null && map[k] >= 0;
const impEq = (a, b) => normName(a) === normName(b);
function csvLine(cells){ return cells.map(v => { v = String(v == null ? '' : v); return /[;"\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'); }
function csvBlob(rows){ return new Blob(['﻿' + rows.map(csvLine).join('\r\n') + '\r\n'], {type:'text/csv;charset=utf-8'}); }

/* =====================================================================
   Die vier Importe. Jeder liefert: fields, analyse(d) → {items, …}, apply(res, d) → Zähler
   Ein Eintrag der Vorschau: {n (Zeile der Datei), raw, st:'neu'|'akt'|'gleich'|'fehler', title, sub, why, notes[], right, ctl}
   ===================================================================== */
const IMP_ST = {neu:'neu', akt:'aktualisiert', gleich:'unverändert', fehler:'Fehler'};

/* ---------- 1 · Speisekarte ---------- */
const IMP_MENU_FIELDS = [
  {k:'section', label:'Kategorie', syn:['kategorie','rubrik','gruppe','warengruppe','abschnitt','kapitel','sparte','section','category']},
  {k:'name', label:'Gericht', req:true, syn:['gericht','name','bezeichnung','speise','artikel','titel','dish','produkt','position','gerichtname']},
  {k:'desc', label:'Beschreibung', syn:['beschreibung','beschreibungstext','zusatz','text','beilage','beilagen','details','description','untertitel','zusatztext']},
  {k:'price', label:'Preis', req:true, syn:['preis','vk','vkpreis','verkaufspreis','preisbrutto','bruttopreis','brutto','preisinklmwst','price','vkbrutto']},
  {k:'variant', label:'Variante', syn:['variante','groesse','portion','ausfuehrung','variant','sorte','portionsgroesse']},
  {k:'veg', label:'vegetarisch / vegan', syn:['vegetarisch','vegan','vegetarischvegan','veg','vegi','ernaehrung','kost','diet','vegetarischodervegan']},
  {k:'seasons', label:'Saison', syn:['saison','saisonen','season','seasons','jahreszeit']},
  {k:'alg', label:'Allergene', syn:['allergene','allergen','allergenkennzeichnung','allergencodes','allergens','allergenear']},
  {k:'top', label:'Empfehlung', syn:['empfehlung','empfehlungdeshauses','tipp','highlight','top','signature']},
  {k:'days', label:'Wochentage', syn:['wochentage','wochentag','tage','tag','days','nuram']},
  {k:'vat', label:'MwSt.', syn:['mwst','steuer','steuersatz','ust','mwstsatz','mehrwertsteuer']},
];
const menuKey = (name, variant) => normName(name) + '|' + normName(variant);
function impMenuAnalyse(d){
  const map = d.map, rows = d.rows; const items = [], seen = new Map(), secs = [], notes = [];
  if(!impHas(map, 'name') || !impHas(map, 'price')) throw new Error('Es fehlt die Spalte „' + (!impHas(map, 'name') ? 'Gericht' : 'Preis') + '“. Bitte unten zuordnen.');
  const existing = new Map(S.menu.map(m => [menuKey(m.name, m.vlabel), m]));
  let lastSec = '';
  for(const r of rows){
    const it = {n:r.n, raw:r, notes:[], st:'neu'}; items.push(it);
    const name = impCell(r, map, 'name').replace(/\s+/g, ' '), variant = impCell(r, map, 'variant'), rawPrice = impCell(r, map, 'price');
    let sec = impCell(r, map, 'section'); if(sec) lastSec = sec; else if(impHas(map, 'section') && lastSec){ sec = lastSec; } else if(!sec) sec = lastSec || '';
    it.title = name + (variant ? ' · ' + variant : ''); it.rawPrice = rawPrice;
    const fail = why => { it.st = 'fehler'; it.why = why; it.sub = sec; };
    if(!name){ fail(rawPrice || sec ? 'Name des Gerichts fehlt' : 'Zeile ohne Gericht'); it.title = it.title || '(ohne Name)'; continue; }
    const price = impNum(rawPrice); it.price = price;
    if(rawPrice === ''){ fail('Preis fehlt'); continue; }
    if(!isFinite(price)){ fail(`Preis nicht lesbar: „${rawPrice}“`); continue; }
    if(price < 0){ fail(`Preis ist negativ: „${rawPrice}“`); continue; }
    const key = menuKey(name, variant);
    if(seen.has(key)){ fail(`doppelt in der Datei (wie Zeile ${seen.get(key)})`); continue; }
    seen.set(key, r.n);
    if(price > 250) it.notes.push('Preis ungewöhnlich hoch, bitte prüfen'); if(price === 0) it.notes.push('Preis 0');
    const data = {name, section:sec || 'Ohne Kategorie', vlabel:variant, price:Math.round(price * 100) / 100};
    if(!sec) it.notes.push('ohne Kategorie');
    if(impHas(map, 'desc')) data.desc = impCell(r, map, 'desc');
    if(impHas(map, 'veg')){ const v = impVeg(impCell(r, map, 'veg')); if(v.bad) it.notes.push(`„${impCell(r, map, 'veg')}“ bei vegetarisch/vegan nicht erkannt`); else data.veg = v.v; }
    if(impHas(map, 'seasons')){ const v = impSeasons(impCell(r, map, 'seasons')); if(v.bad) it.notes.push(`Saison „${impCell(r, map, 'seasons')}“ nicht erkannt`); else data.seasons = v.v; }
    if(impHas(map, 'days')){ const v = impDays(impCell(r, map, 'days')); if(v.bad) it.notes.push(`Wochentage „${impCell(r, map, 'days')}“ nicht erkannt`); else data.days = v.v; }
    if(impHas(map, 'top') && impCell(r, map, 'top') !== '') data.top = impYes(impCell(r, map, 'top'));
    if(impHas(map, 'alg')){ const a = impAlg(impCell(r, map, 'alg')); if(a.bad) it.notes.push(`Allergen „${a.bad.join(', ')}“ unbekannt: Angabe nicht übernommen`); else if(a.state !== 'open'){ data.alg = a.alg; data.algNone = a.state === 'none'; } }
    if(impHas(map, 'vat')){ const v = impCell(r, map, 'vat').toLowerCase(); const n = impNum(v); if(/getr|drink/.test(v) || (isFinite(n) && Math.abs(n - (+vatRate({vat:'g'}))) < .01 && Math.abs(n - (+S.settings.vat)) > .01)) data.vat = 'g'; else if(/speis|essen|food/.test(v) || (isFinite(n) && Math.abs(n - (+S.settings.vat)) < .01)) data.vat = 's'; else if(v) it.notes.push(`MwSt. „${impCell(r, map, 'vat')}“ nicht erkannt`); }
    if(!secs.includes(data.section)) secs.push(data.section);
    it.data = data; it.sub = data.section + (data.desc ? ' · ' + data.desc : '');
    { const ex2 = [data.veg === 'vg' ? 'vegan' : data.veg === 'v' ? 'vegetarisch' : '', data.seasons && data.seasons.length ? data.seasons.map(seasonName).join(', ') : '', data.days && data.days.length ? hkDays({days:data.days}) : '', data.alg ? 'Allergene ' + data.alg : data.algNone ? 'keine Allergene' : '', data.top ? 'Empfehlung' : '', data.vat === 'g' ? 'MwSt. Getränke' : ''].filter(Boolean).join(' · '); if(ex2) it.sub2 = ex2; }
    const ex = existing.get(key); it.ex = ex || null;
    if(ex){ const ch = impMenuDiff(ex, data); it.changes = ch; it.st = ch.length ? 'akt' : 'gleich'; if(ch.length) it.why = ch.join(' · '); }
  }
  const keys = new Set(items.filter(i => i.data).map(i => menuKey(i.data.name, i.data.vlabel)));
  const gone = S.menu.filter(m => !keys.has(menuKey(m.name, m.vlabel)));
  const newSecs = secs.filter(s => !secList().includes(s)); const drink = newSecs.filter(secLooksDrink);
  if(drink.length) notes.push(`${drink.length === 1 ? 'Kategorie' : 'Kategorien'} ${drink.map(s => '„' + s + '“').join(', ')}: wird mit ${num(+vatRate({vat:'g'}), 1)} % MwSt. (Getränke) angelegt.`);
  return {items, secs, newSecs, drink, gone, notes};
}
function impMenuDiff(m, data){
  const ch = [];
  if(Math.abs((+m.price || 0) - data.price) > .004) ch.push(`Preis ${eur(m.price)} → ${eur(data.price)}`);
  if(data.section !== m.section) ch.push(`Kategorie ${m.section} → ${data.section}`);
  if(data.desc != null && data.desc !== '' && data.desc !== (m.desc || '')) ch.push('Beschreibung');
  if(data.veg != null && data.veg !== (m.veg || '')) ch.push(data.veg === 'vg' ? 'vegan' : data.veg === 'v' ? 'vegetarisch' : 'nicht vegetarisch');
  if(data.seasons && data.seasons.join() !== (m.seasons || []).join()) ch.push('Saison');
  if(data.days && data.days.join() !== (m.days || []).join()) ch.push('Wochentage');
  if(data.top != null && data.top !== !!m.top) ch.push(data.top ? 'Empfehlung' : 'keine Empfehlung');
  if(data.alg != null && !(m.card && C(m.card)) && (data.alg !== algClean(m.alg).join(' ') || !!data.algNone !== !!m.algNone)) ch.push('Allergene ' + (data.alg || 'keine'));
  if(data.vat != null && data.vat !== (m.vat || '') && vatClass(m) !== data.vat) ch.push('MwSt. ' + (data.vat === 'g' ? 'Getränke' : 'Speisen'));
  return ch;
}
function impMenuApply(res, d){
  const replace = d.mode === 'replace'; const out = {neu:0, akt:0, gleich:0, fehler:0, weg:0};
  const sv = S.settings.secVat || (S.settings.secVat = {}); res.drink.forEach(s => { sv[s] = 'g'; });
  if(replace){ const keep = new Set(res.items.filter(i => i.ex).map(i => i.ex.id)); const gone = S.menu.filter(m => !keep.has(m.id)); out.weg = gone.length; S.menu = S.menu.filter(m => keep.has(m.id)); S.settings.sections = [...res.secs]; }
  else { if(!S.menu.length) S.settings.sections = [];   /* leere Karte: die Kategorien der Datei gelten, in ihrer Reihenfolge */ res.secs.forEach(s => { if(!S.settings.sections.includes(s)) S.settings.sections.push(s); }); }
  const grp = new Map(); res.items.forEach(i => { if(i.data && i.data.vlabel){ const k = normName(i.data.name); grp.set(k, (grp.get(k) || 0) + 1); } });
  const ord = {}; const by = me().name, today = todayStr();
  for(const it of res.items){
    if(it.st === 'fehler'){ out.fehler++; continue; }
    const x = it.data; let m = it.ex;
    if(!m){ m = {id:uid('m'), section:x.section, name:x.name, desc:'', price:x.price, card:'', img:'', veg:'', top:false, hidden:false, seasons:[], days:[], alg:'', algNone:false, vat:'', group:'', vlabel:''}; S.menu.push(m); out.neu++; }
    else if(it.st === 'akt') out.akt++; else out.gleich++;
    m.name = x.name; m.section = x.section; m.price = x.price; m.vlabel = x.vlabel || '';
    m.group = x.vlabel && grp.get(normName(x.name)) > 1 ? 'g_' + normName(x.name).replace(/\s+/g, '_') : (it.ex ? (x.vlabel ? m.group || '' : '') : '');
    if(x.desc != null && (x.desc !== '' || !it.ex)) m.desc = x.desc;
    if(x.veg != null) m.veg = x.veg; if(x.seasons) m.seasons = x.seasons; if(x.days) m.days = x.days; if(x.top != null) m.top = x.top; if(x.vat != null) m.vat = vatClass({section:x.section}) === x.vat ? '' : x.vat;
    if(x.alg != null && (x.alg !== algClean(m.alg).join(' ') || !!x.algNone !== !!m.algNone)){ m.alg = x.alg; m.algNone = !!x.algNone; m.algAt = today; m.algBy = by + ' (Import)'; }
    // Reihenfolge: wie in der Datei. Beim Ergänzen kommen neue Gerichte hinter die vorhandenen ihrer Kategorie.
    if(replace){ ord[m.section] = ord[m.section] || 0; m.order = ord[m.section]++; } else if(!it.ex) m.order = nextOrder(m.section);
  }
  if(replace && view.sec && !['all','over','none','noalg','nophoto'].includes(view.sec) && !secList().includes(view.sec)) view.sec = 'all';
  return out;
}

/* ---------- 2 · Artikel & Preise ---------- */
const IMP_PROD_FIELDS = [
  {k:'name', label:'Artikel', req:true, syn:['artikel','artikelname','bezeichnung','artikelbezeichnung','produkt','name','ware','zutat','item','produktname']},
  {k:'unit', label:'Einheit', syn:['einheit','me','mengeneinheit','eh','unit','basiseinheit','preiseinheit']},
  {k:'pieceG', label:'Stückgewicht, g', syn:['stueckgewicht','stueckgewichtg','gewichtstueck','gewichtjestueck','gewichtstk','gewicht1stk','gewicht1stkg','stkgewicht','gewichtg','gewicht']},
  {k:'price', label:'Preis netto', syn:['preis','preisnetto','nettopreis','netto','ek','ekpreis','einkaufspreis','preiseinheit','preisjeeinheit','price','eknetto','preisexklmwst']},
  {k:'supplier', label:'Lieferant', syn:['lieferant','lieferantenname','haendler','bezugsquelle','supplier','kreditor']},
  {k:'artNo', label:'Artikelnummer', syn:['artikelnummer','artikelnr','artnr','artnummer','nr','nummer','sku','bestellnummer','bestellnr','plu','code']},
  {k:'pack', label:'Gebinde', syn:['gebinde','ve','verpackung','verpackungseinheit','packung','bestelleinheit','karton']},
  {k:'packQty', label:'Gebindegröße', syn:['gebindegroesse','inhalt','gebindeinhalt','inhaltgebinde','veinhalt','vegroesse','fuellmenge','packungsgroesse','inhaltve','gebindemenge']},
  {k:'lossCold', label:'Putzverlust, %', syn:['putzverlust','ruestverlust','verlustkalt','abfall','schaelverlust','putzverlustprozent']},
  {k:'lossHot', label:'Garverlust, %', syn:['garverlust','kochverlust','bratverlust','verlustwarm','garverlustprozent']},
  {k:'alg', label:'Allergene', syn:['allergene','allergen','allergenkennzeichnung','allergencodes','allergens']},
  {k:'loc', label:'Lagerort', syn:['lagerort','lager','ort','lagerplatz']},
  {k:'minStock', label:'Mindestbestand', syn:['mindestbestand','meldebestand','minbestand','mindestmenge','min']},
  {k:'stock', label:'Anfangsbestand', syn:['anfangsbestand','bestand','lagerbestand','istbestand','menge']},
  {k:'pfand', label:'Pfand', syn:['pfand','pfandbetrag','flaschenpfand','kistenpfand','fasspfand','einsatz','pfandjegebinde']},
  {k:'pourLoss', label:'Schankverlust, %', syn:['schankverlust','schankverlustprozent','zapfverlust','ausschankverlust']},
];
/* sicherer Treffer: gleiche Artikelnummer oder gleicher Name (auch ohne Klammerzusatz). Sonst nur ein Vorschlag. */
function impProdMatch(name, art, pool){
  pool = pool || S.products; const base = x => normName(String(x).split('(')[0]);
  if(art){ const p = pool.find(x => x.artNo && String(x.artNo).trim().toLowerCase() === String(art).trim().toLowerCase()); if(p) return {p, exact:true}; }
  const n = normName(name); if(!n) return {p:null};
  let p = pool.find(x => normName(x.name) === n) || pool.find(x => base(x.name) === base(name) && base(name)); if(p) return {p, exact:true};
  p = plMatch(name, ''); return {p: p && pool.includes(p) ? p : null, exact:false};
}
function impSupMatch(name){ const n = normName(name); if(!n) return null; return (S.suppliers || []).find(s => normName(s.name) === n) || (S.suppliers || []).find(s => { const a = normName(s.name); return a.length >= 4 && n.length >= 4 && (a.includes(n) || n.includes(a)); }) || null; }
function impProdAnalyse(d){
  const map = d.map, rows = d.rows, items = [], seen = new Map(), sups = new Map();
  if(!impHas(map, 'name')) throw new Error('Es fehlt die Spalte „Artikel“. Bitte unten zuordnen.');
  const pct = (it, k, label) => { if(!impHas(map, k)) return undefined; const raw = impCell(it.raw, map, k); if(raw === '') return undefined; const v = impNum(raw); if(!isFinite(v) || v < 0 || v >= 100){ it.notes.push(`${label} „${raw}“ nicht lesbar (0 bis 99 %)`); return undefined; } return v; };
  const qty = (it, k, label) => { if(!impHas(map, k)) return undefined; const raw = impCell(it.raw, map, k); if(raw === '') return undefined; const v = impNum(raw); if(!isFinite(v) || v < 0){ it.notes.push(`${label} „${raw}“ nicht lesbar`); return undefined; } return v; };
  for(const r of rows){
    const it = {n:r.n, raw:r, notes:[], st:'neu'}; items.push(it);
    const name = impCell(r, map, 'name').replace(/\s+/g, ' '), art = impCell(r, map, 'artNo'), rawPrice = impCell(r, map, 'price');
    it.title = name || '(ohne Name)'; it.rawPrice = rawPrice;
    const fail = why => { it.st = 'fehler'; it.why = why; };
    if(!name){ fail('Name des Artikels fehlt'); continue; }
    const key = normName(name) + '|' + art.toLowerCase(); if(seen.has(key)){ fail(`doppelt in der Datei (wie Zeile ${seen.get(key)})`); continue; } seen.set(key, r.n);
    const data = {name};
    const u = impUnit(impCell(r, map, 'unit'));
    if(u.small){ fail(`Einheit „${impCell(r, map, 'unit')}“: bitte den Preis je kg oder je Liter angeben`); continue; }
    /* Getränk: Einheit Flasche, Fass oder Kiste (Preis je Gebinde) oder Einheit l mit Gebinde „Flasche 0,7 l“, „Fass 30 l“, „Kiste 20×0,5 l“ (Preis je Liter) */
    const packRaw = impHas(map, 'pack') ? impCell(r, map, 'pack') : '', pqRaw = impHas(map, 'packQty') ? impCell(r, map, 'packQty') : '';
    const gWord = u.u === 'l' && /^(flaschen?|fl\.?|fass|kisten?|kasten)(\s|$)/i.test(packRaw) ? (/^fass/i.test(packRaw) ? 'fass' : /^k/i.test(packRaw) ? 'kiste' : 'fl') : '';
    const gk = u.geb || gWord; const dv = gk ? (impDrinkPack(packRaw.replace(/^[^\d]*/, ''), gk) || (pqRaw && gk !== 'kiste' && (gk === 'fass' ? impNum(pqRaw) >= 5 : impNum(pqRaw) <= 3) ? impDrinkPack(pqRaw, gk) : null)) : null;   /* nur die Zahl: bei der Flasche bis 3 (Liter), beim Fass ab 5 */
    if(dv){ data.geb = gk; data.gebL = dv.L; data.gebN = dv.N; data.unit = 'l'; }
    else { if(u.other) it.notes.push(`Einheit „${u.other}“ wird als Stück geführt` + (u.geb ? ` (für ein Getränk bei „Gebinde“ den Inhalt angeben, zum Beispiel ${u.geb === 'kiste' ? '„20×0,5 l“' : u.geb === 'fass' ? '„30 l“' : '„0,75 l“'})` : '')); if(!u.empty) data.unit = u.u; }
    if(rawPrice !== ''){ const pr = impNum(rawPrice); if(!isFinite(pr)){ fail(`Preis nicht lesbar: „${rawPrice}“`); continue; } if(pr < 0){ fail(`Preis ist negativ: „${rawPrice}“`); continue; } data.price = Math.round(pr * 10000) / 10000; it.price = data.price; if(pr > 500) it.notes.push('Preis ungewöhnlich hoch, bitte prüfen'); if(dv && u.geb){ data.gprice = data.price; data.price = Math.round(pr / (dv.L * dv.N) * 10000) / 10000; } }
    if(art) data.artNo = art;
    const pg = qty(it, 'pieceG', 'Stückgewicht'); if(pg != null) data.pieceG = pg;
    const lc = pct(it, 'lossCold', 'Putzverlust'); if(lc != null) data.lossCold = lc; const lh = pct(it, 'lossHot', 'Garverlust'); if(lh != null) data.lossHot = lh;
    const cf = dv && u.geb ? dv.L : 1;   /* Bestände bei Einheit Flasche/Fass/Kiste: in Flaschen bzw. Fässern */
    const ms = qty(it, 'minStock', 'Mindestbestand'); if(ms != null) data.minStock = Math.round(ms * cf * 1000) / 1000; const st = qty(it, 'stock', 'Anfangsbestand'); if(st != null) data.stock = Math.round(st * cf * 1000) / 1000;
    if(dv){ data.pack = gebLabel(gk, dv.L, dv.N); data.packQty = Math.round(dv.L * dv.N * 10000) / 10000; }
    else { if(packRaw) data.pack = packRaw; const pq = qty(it, 'packQty', 'Gebindegröße'); if(pq != null) data.packQty = pq; }
    { const pf = qty(it, 'pfand', 'Pfand'); if(pf != null){ if(dv) data.pfand = Math.round(pf * 100) / 100; else if(pf > 0) it.notes.push('Pfand gibt es nur bei Getränken mit Gebinde (Flasche, Fass, Kiste): nicht übernommen'); }
      const pl = pct(it, 'pourLoss', 'Schankverlust'); if(pl != null){ if(dv) data.pourLoss = pl; else if(pl > 0) it.notes.push('Schankverlust gibt es nur bei Getränken: nicht übernommen'); } }
    if(impHas(map, 'loc')){ const l = impLoc(impCell(r, map, 'loc')); if(l.bad) it.notes.push(`Lagerort „${impCell(r, map, 'loc')}“ nicht erkannt: Trockenlager`); if(l.v) data.loc = l.v; }
    if(impHas(map, 'alg')){ const a = impAlg(impCell(r, map, 'alg')); if(a.bad) it.notes.push(`Allergen „${a.bad.join(', ')}“ unbekannt: Angabe nicht übernommen`); else if(a.state !== 'open'){ data.alg = a.alg; data.algNone = a.state === 'none'; } }
    const supName0 = impCell(r, map, 'supplier'); if(supName0){ const sp = impSupMatch(supName0); data.supName = supName0; if(sp) data.supplier = sp.id; else { const k = normName(supName0); if(!sups.has(k)) sups.set(k, supName0); data.supNew = k; } }
    const mt = impProdMatch(name, art); const dk = 'p' + r.n; let dec = d.dec[dk];
    if(dec && dec !== 'new' && dec !== 'skip' && !P(dec)) dec = undefined;
    if(dec === undefined) dec = mt.p && mt.exact ? mt.p.id : 'new';
    if(mt.p && !mt.exact || d.dec[dk] !== undefined) it.ctl = {key:dk, value:dec, sug:mt.p && !mt.exact ? mt.p : null};
    if(dec === 'skip'){ it.st = 'gleich'; it.skip = true; it.why = 'wird nicht übernommen'; it.data = data; continue; }
    const ex = dec !== 'new' ? P(dec) : null; it.ex = ex; const unit = data.unit || (ex ? ex.unit : 'kg');
    if(ex && data.unit && data.unit !== ex.unit){ fail(`Einheit ${data.unit} passt nicht zum vorhandenen Artikel „${ex.name}“ (${ex.unit}). Rezepturen rechnen in ${ex.unit}.`); continue; }
    if(data.pack && data.packQty == null){ const q = impPack(data.pack, unit); if(q){ data.packQty = q; data.packAuto = true; } }
    impGebPrice(it, data, d, {key:'g' + r.n, old: ex && +ex.price > 0 ? +ex.price : 0, unit, unitGiven: impHas(map, 'unit') && !u.empty, drink: !!dv});
    it.data = data; it.unit = unit;
    it.sub = [dv ? `${data.pack}${data.price != null ? ' · ' + eur(data.price) + ' je Liter' : ''}${data.pfand ? ' · Pfand ' + eur(data.pfand) : ''}${data.pourLoss ? ' · Schankverlust ' + num(data.pourLoss, 1) + ' %' : ''}` : `je ${unit}${unit === 'Stk' && data.pieceG ? ' · ' + num(data.pieceG) + ' g' : ''}`, data.supName ? data.supName + (data.supNew ? ' (neuer Lieferant)' : '') : '', data.artNo ? 'Nr. ' + data.artNo : '', data.pack && !dv ? data.pack + (data.packQty ? ` = ${num(data.packQty, 3)} ${unit}` : '') : '', data.alg ? 'Allergene ' + data.alg : data.algNone ? 'keine Allergene' : ''].filter(Boolean).join(' · ');
    if(ex){ const ch = impProdDiff(ex, data); it.st = ch.length ? 'akt' : 'gleich'; if(ch.length) it.why = (mt.exact ? '' : `„${ex.name}“: `) + ch.join(' · '); if(data.stock != null) it.notes.push('Bestand vorhandener Artikel ändert nur die Inventur'); }
    else if(data.price == null) it.notes.push('ohne Preis: erscheint im Preis-Check als „Preis fehlt“');
  }
  return {items, sups:[...sups.values()]};
}
/* Preis je Gebinde oder je Einheit? Großhändler-Listen nennen den Preis meist je Verpackungseinheit („Sack 10 kg“ 9,50).
   Passt das Verhältnis zum bisherigen Preis genau zur Gebindegröße, wird umgerechnet; passt es zu 1, bleibt es;
   sonst fragt die Vorschau. Jeder große Sprung wird gezeigt. */
function impGebPrice(it, data, d, o){
  if(data.price == null || o.drink) return;
  const pq = +data.packQty || 0; const pr = data.price;
  if(pq > 0 && Math.abs(pq - 1) > 1e-6 && data.pack){
    const {guess, sure} = gebGuess(pr, o.old, pq, o.unitGiven);
    const dec = d.dec[o.key] === 'pack' || d.dec[o.key] === 'unit' ? d.dec[o.key] : guess;
    if(dec === 'pack'){ data.price = Math.round(pr / pq * 10000) / 10000; it.price = data.price; it.sub2 = `${eur(pr)} je ${data.pack} = ${eur(data.price)} je ${o.unit}`; }
    if(!sure || d.dec[o.key]) it.gctl = {key:o.key, mode:dec, pr, pq, pack:data.pack, unit:o.unit};
    if(!sure && !d.dec[o.key]) it.notes.push(`Gilt ${eur(pr)} für ${data.pack} oder für 1 ${o.unit}? Bitte unten wählen.`);
  }
  if(o.old > 0){ const f = data.price / o.old; if(f >= 2 || f <= 0.5) it.notes.push(`Preis ${eur(o.old)} → ${eur(data.price)} je ${o.unit} (${f > 1 ? '+' : '−'}${num(Math.abs(f - 1) * 100, 0)} %), bitte prüfen`); }
}
function impProdDiff(p, x){
  const ch = [];
  if(x.price != null && Math.abs((+p.price || 0) - x.price) > .00005) ch.push(`Preis ${eur(p.price)} → ${eur(x.price)}`); else if(x.price != null && p.priceDemo) ch.push('Preis bestätigt');
  if(x.supplier && x.supplier !== p.supplier || x.supNew) ch.push('Lieferant ' + x.supName);
  if(x.artNo && x.artNo !== (p.artNo || '')) ch.push('Artikelnummer');
  if(x.pieceG != null && +x.pieceG !== +p.pieceG) ch.push(`Stückgewicht ${num(x.pieceG)} g`);
  if(x.pack && x.pack !== (p.pack || '') || (x.packQty != null && +x.packQty !== +(p.packQty || 0))) ch.push('Gebinde');
  if(x.lossCold != null && +x.lossCold !== +(p.lossCold || 0)) ch.push(`Putzverlust ${num(x.lossCold, 1)} %`);
  if(x.lossHot != null && +x.lossHot !== +(p.lossHot || 0)) ch.push(`Garverlust ${num(x.lossHot, 1)} %`);
  if(x.alg != null && (x.alg !== algClean(p.alg).join(' ') || !!x.algNone !== (prodAlgState(p) === 'none'))) ch.push('Allergene ' + (x.alg || 'keine'));
  if(x.loc && x.loc !== p.loc) ch.push('Lagerort ' + LOCS[x.loc]);
  if(x.minStock != null && +x.minStock !== +(p.minStock || 0)) ch.push('Mindestbestand');
  if(x.geb && (x.geb !== p.geb || +x.gebL !== +p.gebL || +x.gebN !== +(p.gebN || 1)) && !ch.includes('Gebinde')) ch.push('Gebinde');
  if(x.pfand != null && +x.pfand !== +(p.pfand || 0)) ch.push(`Pfand ${eur(x.pfand)}`);
  if(x.pourLoss != null && +x.pourLoss !== +(p.pourLoss || 0)) ch.push(`Schankverlust ${num(x.pourLoss, 1)} %`);
  return ch;
}
function supNew(name){ return {id:uid('sup'), name, cat:'gross', channel:'email', contact:'', phone:'', whatsapp:'', email:'', shopUrl:'', customerNo:'', orderDays:[], cutoff:'12:00', deliveryDays:[], minOrder:0, freight:0, note:'', prefix:'', active:true}; }
function prodNew(name, unit){ return {id:uid('p'), name, unit:unit || 'kg', price:0, lossCold:0, lossHot:0, alg:'', algNone:false, pieceG:'', stock:0, minStock:0, loc:'L', supplier:'', artNo:'', pack:'', packQty:0, priceDemo:true}; }
function impProdApply(res, d){
  const out = {neu:0, akt:0, gleich:0, fehler:0, lieferanten:0}; const supId = new Map();
  for(const it of res.items){
    if(it.st === 'fehler'){ out.fehler++; continue; } if(it.skip){ out.gleich++; continue; }
    const x = it.data; let p = it.ex; const isNew = !p;
    if(x.supNew && !supId.has(x.supNew)){ const sp = impSupMatch(x.supName) || supNew(x.supName); if(!SUP(sp.id)){ S.suppliers.push(sp); out.lieferanten++; } supId.set(x.supNew, sp.id); }
    const sid = x.supNew ? supId.get(x.supNew) : x.supplier;
    if(isNew){ p = prodNew(x.name, it.unit); S.products.push(p); out.neu++; } else if(it.st === 'akt') out.akt++; else out.gleich++;
    if(x.price != null && (isNew || p.priceDemo || Math.abs((+p.price || 0) - x.price) > .00005)){ p.price = x.price; markPrice(p, 'Import'); }
    if(sid) p.supplier = sid; if(x.artNo) p.artNo = x.artNo; if(x.pieceG != null) p.pieceG = x.pieceG; if(x.pack) p.pack = x.pack; if(x.packQty != null) p.packQty = x.packQty;
    if(x.lossCold != null) p.lossCold = x.lossCold; if(x.lossHot != null) p.lossHot = x.lossHot; if(x.loc) p.loc = x.loc; if(x.minStock != null) p.minStock = x.minStock;
    if(x.alg != null){ p.alg = x.alg; p.algNone = !!x.algNone; }
    if(x.geb){ p.geb = x.geb; p.gebL = x.gebL; p.gebN = x.gebN; if(isNew && !x.loc) p.loc = 'W'; } if(x.pfand != null && isDrink(p)) p.pfand = x.pfand; if(x.pourLoss != null && isDrink(p)) p.pourLoss = x.pourLoss;
    if(isNew && x.stock) addMove('in', p.id, x.stock, 'Anfangsbestand (Import)');
  }
  return out;
}

/* ---------- 3 · Rezepturen (eine Zeile je Zutat) ---------- */
const IMP_REC_FIELDS = [
  {k:'rec', label:'Rezeptur', req:true, syn:['rezeptur','rezept','rezeptname','rezepturname','gericht','name','titel']},
  {k:'type', label:'Typ', syn:['typ','art','rezepttyp','rezeptart']},
  {k:'ing', label:'Zutat', req:true, syn:['zutat','zutaten','artikel','produkt','ingredient','komponente','rohstoff','ware']},
  {k:'qty', label:'Menge', req:true, syn:['menge','anzahl','quantity','mengebrutto','brutto','einwaage','bruttomenge']},
  {k:'unit', label:'Einheit', syn:['einheit','me','eh','unit','mengeneinheit']},
  {k:'yield', label:'Ausbeute, g', syn:['ausbeute','ausbeuteg','charge','chargeg','ergibt','ertrag','chargengroesse','ausbeutecharge']},
  {k:'portions', label:'Portionen', syn:['portionen','anzahlportionen','portionenanzahl','fuerportionen','personen']},
  {k:'portionG', label:'Portionsgewicht, g', syn:['portionsgewicht','portionsgewichtg','portiong','gewichtportion','tellergewicht','portionsgroesse']},
  {k:'step', label:'Schritt', syn:['schritt','zubereitung','zubereitungsschritt','zubereitungsschritte','arbeitsschritt','anleitung','methode','schritte']},
  {k:'dish', label:'Gericht auf der Karte', syn:['gerichtaufderkarte','karte','gerichtkarte','speisekarte','verknuepfung','verknuepftmit','kartengericht','gerichtderkarte','aufderkarte']},
  {k:'cat', label:'Kategorie', syn:['kategorie','rubrik','gruppe']},
];
/* Küchenmaße in Gramm (bei Flüssigkeiten Milliliter). Richtwerte; die Vorschau zeigt sie und lässt sie ändern. */
const REC_UNITS = {g:1, gr:1, gramm:1, kg:1000, kilo:1000, kilogramm:1000, ml:1, l:1000, lt:1000, liter:1000, dl:100, cl:10, el:15, essl:15, 'esslöffel':15, tl:5, teel:5, 'teelöffel':5, prise:0.5, prisen:0.5, msp:0.3, messerspitze:0.3, bund:30, zehe:5, zehen:5, spritzer:2, schuss:10, tasse:200, becher:200, blatt:1, 'blätter':1, zweig:2, zweige:2, scheibe:20, scheiben:20};
const REC_STK = /^(stk|stück|stueck|st|stck|pc|pcs|x)$/;
const REC_SPOON = /^(el|essl|esslöffel|tl|teel|teelöffel|prise|prisen|msp|messerspitze|bund|zehe|zehen|spritzer|schuss|tasse|becher|blatt|blätter|zweig|zweige|scheibe|scheiben)$/;
function recUnitKey(raw){ return String(raw || '').trim().toLowerCase().replace(/\.$/, ''); }
/* Menge einer Zeile in die Einheit der Zutat umrechnen (Rezepturen rechnen in g, ml oder Stück).
   Liefert {qty, how} oder {err}. over = von Hand eingetragener Wert für diese Zeile. */
function recConvert(q, unitRaw, r, over){
  const u = recUnitKey(unitRaw); const tu = r.t === 'c' ? 'g' : r.o.unit === 'Stk' ? 'Stk' : r.o.unit === 'l' ? 'ml' : 'g';
  if(over != null && over !== '' && isFinite(+over) && +over >= 0) return {qty:+over, tu, how:'von Hand', over:true};
  if(!isFinite(q) || q < 0) return {err:'Menge nicht lesbar', tu};
  const pg = r.t === 'p' ? +r.o.pieceG || 0 : 0;
  if(!u) return {qty:q, tu, how: tu === 'Stk' ? 'ohne Einheit: Stück' : 'ohne Einheit: ' + tu};
  if(REC_STK.test(u)){ if(tu === 'Stk') return {qty:q, tu}; if(pg) return {qty:q * pg, tu, how:`${num(q, 2)} Stk × ${num(pg)} g`}; return {err:'Stück lässt sich nicht in ' + tu + ' umrechnen: Stückgewicht fehlt', tu, ask:true}; }
  const f = REC_UNITS[u]; if(f == null) return {err:`Einheit „${unitRaw}“ unbekannt`, tu, ask:true};
  const grams = q * f; const spoon = REC_SPOON.test(u);
  if(tu === 'Stk'){ if(pg) return {qty:Math.round(grams / pg * 1000) / 1000, tu, how:`${num(grams, 1)} g ÷ ${num(pg)} g je Stück`, guess:spoon}; return {err:'Der Artikel wird in Stück geführt, das Stückgewicht fehlt', tu, ask:true}; }
  const liquid = /^(ml|l|lt|liter|dl|cl)$/.test(u);
  let how = ''; if(spoon) how = `${num(q, 2)} ${String(unitRaw).trim()} ≈ ${num(grams, 1)} ${tu}`; else if(f !== 1) how = `${num(q, 3)} ${u} = ${num(grams, 1)} ${tu}`;
  if(liquid && tu === 'g') how = (how ? how + ' · ' : '') + 'ml als g gerechnet'; if(!liquid && !spoon && tu === 'ml') how = (how ? how + ' · ' : '') + 'g als ml gerechnet';
  return {qty:Math.round(grams * 1000) / 1000, tu, how, guess:spoon};
}
/* Zutat finden: Basisrezepte (auch die aus derselben Datei), dann Artikel genau, dann ähnlich */
function recFind(name, semis){
  const n = normName(name); if(!n) return null;
  const sf = (semis || []).find(s => normName(s.name) === n); if(sf) return {ref:'f:' + sf.key, t:'c', o:sf, exact:true, file:true};
  const sc = S.cards.find(c => c.type === 'semi' && normName(c.name) === n); if(sc) return {ref:'c:' + sc.id, t:'c', o:sc, exact:true};
  const m = impProdMatch(name, ''); if(m.p) return {ref:'p:' + m.p.id, t:'p', o:m.p, exact:m.exact};
  const fz = S.cards.find(c => c.type === 'semi' && (normName(c.name).includes(n) || n.includes(normName(c.name))) && Math.min(n.length, normName(c.name).length) >= 5); if(fz) return {ref:'c:' + fz.id, t:'c', o:fz, exact:false};
  return null;
}
function recSteps(text){ const s = String(text || '').trim(); if(!s) return []; const parts = s.split(/\r?\n+|\s+(?=\d{1,2}[.)]\s)/).map(x => x.replace(/^\d{1,2}[.)]\s*/, '').trim()).filter(Boolean); return parts; }
function recType(raw){ const s = String(raw || '').trim().toLowerCase(); if(!s) return ''; if(/getr[äa]nk|schank|drink|cocktail/.test(s)) return 'drink'; if(/basis|^br$|halbfert|semi|kompon|vorbereit|grund|fond|sauce$/.test(s)) return 'semi'; if(/gericht|dish|speise|teller|portion/.test(s)) return 'dish'; return '?'; }
function impRecAnalyse(d){
  let map = d.map; const rows = d.rows; const notes = [];
  if(!impHas(map, 'rec')) throw new Error('Es fehlt die Spalte „Rezeptur“. Bitte unten zuordnen.');
  if(!impHas(map, 'ing') && !impHas(map, 'step')) throw new Error('Es fehlt die Spalte „Zutat“. Bitte unten zuordnen.');
  const recs = new Map(); const order = []; const bad = [];
  const get = (name, n) => { const k = normName(name); let rc = recs.get(k); if(!rc){ rc = {key:k, name:name.replace(/\s+/g, ' ').trim(), n, typeRaw:'', lines:[], steps:[], yield:null, portions:null, portionG:null, dish:'', cat:'', notes:[]}; recs.set(k, rc); order.push(rc); } return rc; };
  let last = null;
  const take = (r, mp) => {
    // zweiter Abschnitt in derselben Datei: eine neue Überschriftenzeile (z. B. „Rezeptur;Schritt“)
    const hh = r.map(c => impFieldOf(c, IMP_REC_FIELDS)).filter(Boolean); if(hh.length >= 2 && hh.some(f => f.k === 'rec') && r.filter(c => c).length === hh.length){ const m2 = {}; r.forEach((c, i) => { const f = impFieldOf(c, IMP_REC_FIELDS); if(f && m2[f.k] == null) m2[f.k] = i; }); return m2; }
    let name = impCell(r, mp, 'rec'); const ing = impCell(r, mp, 'ing'), step = impCell(r, mp, 'step');
    if(!name && last && (ing || step)) name = last.name;   // Name nur in der ersten Zeile des Blocks
    if(!name){ bad.push({n:r.n, raw:r, st:'fehler', title:ing || '(leer)', why:'Zeile ohne Rezeptur', notes:[]}); return mp; }
    const rc = last = get(name, r.n);
    const tr = impCell(r, mp, 'type'); if(tr && !rc.typeRaw) rc.typeRaw = tr;
    const y = impCell(r, mp, 'yield'); if(y && rc.yield == null) rc.yieldRaw = y;
    const po = impCell(r, mp, 'portions'); if(po && rc.portions == null){ const v = impNum(po); if(isFinite(v) && v > 0) rc.portions = v; }
    const pg = impCell(r, mp, 'portionG'); if(pg && rc.portionG == null){ const v = impNum(pg.replace(/g$/i, '')); if(isFinite(v) && v > 0) rc.portionG = v; }
    const di = impCell(r, mp, 'dish'); if(di && !rc.dish) rc.dish = di; const ca = impCell(r, mp, 'cat'); if(ca && !rc.cat) rc.cat = ca;
    if(step) recSteps(step).forEach(t => rc.steps.push(t));
    if(ing) rc.lines.push({n:r.n, raw:r, name:ing.replace(/\s+/g, ' '), qtyRaw:impCell(r, mp, 'qty'), unitRaw:impCell(r, mp, 'unit')});
    else if(!step && (impCell(r, mp, 'qty') || impCell(r, mp, 'unit'))) bad.push({n:r.n, raw:r, st:'fehler', title:name, why:'Zutat fehlt', notes:[]});
    return mp;
  };
  let mp = map; for(const r of rows) mp = take(r, mp);
  // weitere Tabellenblätter mit Schritten („Schritte“, „Zubereitung“)
  (d.src.sheets || []).forEach((sh, i) => { if(i === (d.sheet || 0)) return; const h = impHeader(sh.rows, IMP_REC_FIELDS); if(h.hi < 0 || !impHas(h.map, 'rec') || !impHas(h.map, 'step')) return; let m2 = {rec:h.map.rec, step:h.map.step}; last = null; sh.rows.slice(h.hi + 1).forEach(r => { m2 = take(r, m2); }); notes.push(`Zubereitungsschritte aus dem Blatt „${sh.name}“ gelesen.`); });

  // Typ, Ausbeute, Verknüpfung
  const semis = [];
  order.forEach(rc => { const t = recType(rc.typeRaw); const exCard = S.cards.find(c => normName(c.name) === rc.key);
    rc.type = t === 'drink' ? 'dish' : t === 'semi' || t === 'dish' ? t : exCard ? exCard.type : 'dish'; rc.drink = t === 'drink' || (t !== 'semi' && t !== 'dish' && !!(exCard && exCard.drink)); if(t === '?') rc.notes.push(`Typ „${rc.typeRaw}“ nicht erkannt: ${rc.type === 'semi' ? 'Basisrezept' : 'Gericht'}`);
    rc.ex = S.cards.find(c => normName(c.name) === rc.key && c.type === rc.type) || null;
    if(rc.type === 'semi') semis.push(rc); });
  const unmatched = new Map();
  order.forEach(rc => {
    if(rc.yieldRaw){ const m = String(rc.yieldRaw).toLowerCase().replace(',', '.').match(/^([\d.\s]+)\s*(kg|g|l|ml|cl)?$/); const v = m ? impNum(m[1]) : NaN; if(isFinite(v) && v > 0) rc.yield = v * (m[2] === 'kg' || m[2] === 'l' || (rc.drink && !m[2] && v <= 5) ? 1000 : m[2] === 'cl' ? 10 : 1); else rc.notes.push(`Ausbeute „${rc.yieldRaw}“ nicht lesbar`); }
    const div = rc.type === 'dish' && rc.portions > 1 ? rc.portions : 1; if(div > 1) rc.notes.push(`für ${num(rc.portions)} Portionen geschrieben: Mengen durch ${num(rc.portions)} geteilt`);
    if(rc.type === 'semi' && rc.yield == null && rc.portions && rc.portionG) rc.yield = rc.portions * rc.portionG;
    rc.yieldG = rc.type === 'semi' ? (rc.yield != null ? rc.yield : '') : (rc.portionG != null ? rc.portionG : (rc.yield != null && div === 1 ? rc.yield : ''));
    rc.lines.forEach(l => {
      const k = normName(l.name); const dk = 'i:' + k; let dec = d.dec[dk]; let f = null;
      if(dec && dec !== 'new' && dec !== 'skip'){ const r0 = dec.startsWith('f:') ? semis.find(s => 'f:' + s.key === dec) : null; const ro = r0 ? {t:'c', o:r0} : refObj(dec); if(ro) f = {ref:dec, t:ro.t, o:ro.o, exact:true, file:!!r0, picked:true}; else dec = undefined; }
      const auto = recFind(l.name, semis.filter(s => s !== rc));
      if(!f && dec !== 'new' && dec !== 'skip') f = auto;
      l.q = impNum(l.qtyRaw) / div; l.dk = dk;
      // in die Prüfliste: nicht gefunden, nur ähnlich gefunden oder von Hand entschieden
      if(!auto || !auto.exact || d.dec[dk] !== undefined){ const um = unmatched.get(k) || {key:dk, name:l.name, n:0, recs:new Set(), unit:'', kind: !auto ? 'none' : auto.exact ? 'picked' : 'fuzzy', auto}; um.dec = f && !f.isNew ? f.ref : (dec || 'new'); um.n++; um.recs.add(rc.name); um.unit = um.unit || l.unitRaw; unmatched.set(k, um); }
      if(!f){ dec = dec || 'new'; l.dec = dec;
        if(dec === 'skip'){ l.st = 'skip'; l.msg = 'wird ausgelassen'; return; }
        const uk = recUnitKey(l.unitRaw); const nu = REC_STK.test(uk) ? 'Stk' : /^(ml|l|lt|liter|dl|cl)$/.test(uk) ? 'l' : 'kg'; l.newUnit = nu; f = {ref:'n:' + k, t:'p', o:{name:l.name, unit:nu, pieceG:0}, isNew:true}; }
      l.f = f; const cv = recConvert(l.q, l.unitRaw, f, d.dec['q:' + l.n]); l.cv = cv;
      if(l.qtyRaw === '' && !cv.over){ l.st = 'fehler'; l.msg = 'Menge fehlt'; l.ask = true; }
      else if(cv.err){ l.st = 'fehler'; l.msg = cv.err; l.ask = true; }
      else { l.st = 'ok'; l.qty = cv.qty; if(cv.guess) l.ask = true; }
    });
    // Verknüpfung zum Gericht
    if(rc.type === 'dish'){ const lk = 'l:' + rc.key; const want = rc.dish || rc.name; const exact = S.menu.filter(m => impEq(m.name, want) || impEq(dishLabel(m), want) || impEq(m.name + ' ' + (m.vlabel || ''), want));
      const linked = rc.ex ? S.menu.filter(m => m.card === rc.ex.id) : [];
      let sel = d.dec[lk]; if(sel === undefined) sel = exact.length ? exact.map(m => m.id).join(',') : linked.length ? linked.map(m => m.id).join(',') : '';
      rc.linkSug = !exact.length && !linked.length ? autoMatch(want) : null; rc.link = sel; rc.lk = lk; rc.linkAuto = d.dec[lk] === undefined && exact.length > 0;
      if(rc.dish && !exact.length && d.dec[lk] === undefined) rc.notes.push(`Gericht „${rc.dish}“ steht nicht auf der Karte`); }
  });
  // Kreisbezüge: Basisrezept A braucht B, B braucht A (auch über vorhandene Rezepturen)
  const fileSemi = new Map(semis.map(s => ['f:' + s.key, s]));
  const deps = ref => { if(ref.startsWith('f:')){ const s = fileSemi.get(ref); return s ? s.lines.filter(l => l.f && l.f.t === 'c').map(l => l.f.ref) : []; }
    const c = C(ref.slice(2)); if(!c) return []; const over = semis.find(s => s.ex && s.ex.id === c.id); if(over) return deps('f:' + over.key); return c.items.map(i => i.ref).filter(x => x && x.startsWith('c:')); };
  const selfRef = rc => rc.type === 'semi' ? 'f:' + rc.key : null;
  order.forEach(rc => { const start = selfRef(rc); const seen = new Set(); const path = [];
    const walk = (ref, trail) => { if(trail.length > 12) return false; for(const nx of deps(ref)){ const same = nx === start || (rc.ex && nx === 'c:' + rc.ex.id); if(same){ path.push(...trail, nx); return true; } if(seen.has(nx)) continue; seen.add(nx); if(walk(nx, trail.concat(nx))) return true; } return false; };
    const first = rc.lines.filter(l => l.f && l.f.t === 'c').map(l => l.f.ref);
    for(const fr of first){ if((start && fr === start) || (rc.ex && fr === 'c:' + rc.ex.id)){ rc.cycle = `${rc.name} → ${rc.name}`; break; } if(start && walk(fr, [fr])){ const nm = r => r.startsWith('f:') ? fileSemi.get(r).name : (C(r.slice(2)) || {name:'?'}).name; rc.cycle = [rc.name, ...path.map(nm)].join(' → '); break; } }
  });
  // wer ein Basisrezept braucht, das nicht importiert wird, verliert diese Zeile
  order.forEach(rc => { rc.bad = !!rc.cycle || (rc.lines.length > 0 && !rc.lines.some(l => l.st === 'ok')); });
  order.forEach(rc => rc.lines.forEach(l => { if(l.st !== 'ok' || !l.f.file || !l.f.o.bad) return;
    if(l.f.o.ex && !rc.bad){ l.f = {ref:'c:' + l.f.o.ex.id, t:'c', o:l.f.o.ex, exact:true}; l.note = 'vorhandene Rezeptur bleibt, wie sie ist'; return; }   // die vorhandene Rezeptur gleichen Namens bleibt gültig
    l.st = 'fehler'; l.msg = `Basisrezept „${l.f.o.name}“ wird nicht importiert`; }));
  // Zustand je Rezeptur
  const items = [];
  order.forEach(rc => {
    const okL = rc.lines.filter(l => l.st === 'ok'), errL = rc.lines.filter(l => l.st === 'fehler');
    const it = {n:rc.n, rc, notes:rc.notes, title:rc.name, raw:rc.lines[0] ? rc.lines[0].raw : []};
    if(rc.cycle){ it.st = 'fehler'; it.why = `Kreisbezug: ${rc.cycle}. Ein Basisrezept kann sich nicht selbst enthalten.`; }
    else if(!rc.lines.length && !rc.steps.length){ it.st = 'fehler'; it.why = 'keine Zutaten'; }
    else if(!okL.length && rc.lines.length){ it.st = 'fehler'; it.why = errL.length ? 'keine Zeile lesbar' : 'alle Zutaten ausgelassen'; }
    else if(rc.ex){ const refOf = l => l.f.file ? (l.f.o.ex ? 'c:' + l.f.o.ex.id : '') : l.f.ref; const same = rc.ex.items.length === okL.length && okL.every((l, i) => !l.f.isNew && rc.ex.items[i].ref === refOf(l) && Math.abs((+rc.ex.items[i].qty || 0) - l.qty) < 1e-6) && (rc.yieldG === '' || +rc.yieldG === +rc.ex.yieldG) && (!rc.steps.length || rc.steps.join('|') === (rc.ex.steps || []).map(s => s.t).join('|')); it.st = same ? 'gleich' : 'akt'; if(!same) it.why = `ersetzt die ${plural(rc.ex.items.length, 'Zutat', 'Zutaten')} der vorhandenen Rezeptur`; }
    else it.st = 'neu';
    if(it.st !== 'fehler' && errL.length) it.notes = it.notes.concat([`${plural(errL.length, 'Zeile', 'Zeilen')} mit Fehler ${errL.length === 1 ? 'wird' : 'werden'} ausgelassen`]);
    rc.st = it.st; items.push(it);
  });
  bad.forEach(b => items.push(b));
  return {items, order, unmatched:[...unmatched.values()], notes, lineErr:order.reduce((s, rc) => s + rc.lines.filter(l => l.st === 'fehler').length, 0)};
}
function impRecApply(res, d){
  const out = {neu:0, akt:0, gleich:0, fehler:0, zutaten:0, artikel:0, verknuepft:0}; const newP = new Map(), cardOf = new Map();
  const todo = res.order.filter(rc => rc.st === 'neu' || rc.st === 'akt');
  res.items.forEach(it => { if(it.st === 'fehler') out.fehler++; else if(it.st === 'gleich') out.gleich++; });
  // erst die Karten anlegen (Basisrezepte zuerst), dann die Zeilen: so stimmen Verweise in beide Richtungen
  todo.sort((a, b) => (a.type === 'semi' ? 0 : 1) - (b.type === 'semi' ? 0 : 1)).forEach(rc => {
    let c = rc.ex; const linkIds = rc.type === 'dish' && rc.link ? rc.link.split(',').filter(Boolean) : []; const m0 = linkIds.length ? S.menu.find(m => m.id === linkIds[0]) : null;
    if(!c){ c = {id:uid(rc.type === 'semi' ? 'semi' : 'dish'), no:S.settings.nextNo++, name:rc.name, type:rc.type, category:rc.cat || (rc.type === 'semi' ? 'Basisrezepte' : m0 ? m0.section : rc.drink ? drinkSection() : ''), yieldG:'', img:'', steps:[], items:[]}; S.cards.push(c); out.neu++; } else out.akt++;
    if(rc.drink && c.type === 'dish') c.drink = true;
    if(rc.cat) c.category = rc.cat; if(rc.yieldG !== '') c.yieldG = rc.yieldG; if(rc.steps.length) c.steps = rc.steps.map(t => ({t, img:''})); delete c.fresh;
    cardOf.set(rc.key, c);
  });
  res.order.forEach(rc => { if(rc.ex && !cardOf.has(rc.key)) cardOf.set(rc.key, rc.ex); });
  todo.forEach(rc => { const c = cardOf.get(rc.key); const items = [];
    rc.lines.forEach(l => { if(l.st !== 'ok') return; let ref = l.f.ref;
      if(l.f.isNew){ const k = ref.slice(2); let p = newP.get(k); if(!p){ p = prodNew(l.name, l.newUnit); S.products.push(p); newP.set(k, p); out.artikel++; } ref = 'p:' + p.id; }
      else if(l.f.file){ const cc = cardOf.get(l.f.o.key); if(!cc) return; ref = 'c:' + cc.id; }
      const same = items.find(x => x.ref === ref); if(same) same.qty = Math.round((same.qty + l.qty) * 1000) / 1000; else items.push({ref, qty:l.qty, net:''}); out.zutaten++; });
    c.items = items;
    if(rc.type === 'dish' && rc.link) rc.link.split(',').filter(Boolean).forEach(id => { const m = S.menu.find(x => x.id === id); if(m && m.card !== c.id){ m.card = c.id; out.verknuepft++; } });
  });
  return out;
}

/* ---------- 4 · Team ---------- */
const IMP_TEAM_FIELDS = [
  {k:'name', label:'Name', req:true, syn:['name','vorname','mitarbeiter','mitarbeiterin','person','vornamenachname','mitarbeitername']},
  {k:'area', label:'Bereich', syn:['bereich','abteilung','position','funktion','einsatz','rolle','arbeitsbereich']},
  {k:'target', label:'Wochenstunden', syn:['wochenstunden','stunden','stundenwoche','sollstunden','soll','stdwoche','std','hours','wochenarbeitszeit','stundenprowoche','stdwo']},
];
function impTeamAnalyse(d){
  const map = d.map; if(!impHas(map, 'name')) throw new Error('Es fehlt die Spalte „Name“. Bitte unten zuordnen.');
  const st = tmS(); const items = [], seen = new Map(); const dropDemo = !!d.dropDemo && st.demo;
  for(const r of d.rows){
    const it = {n:r.n, raw:r, notes:[], st:'neu'}; items.push(it);
    const name = impCell(r, map, 'name').replace(/\s+/g, ' ').slice(0, 40); it.title = name || '(ohne Name)';
    if(!name){ it.st = 'fehler'; it.why = 'Name fehlt'; continue; }
    const k = normName(name); if(seen.has(k)){ it.st = 'fehler'; it.why = `doppelt in der Datei (wie Zeile ${seen.get(k)})`; continue; } seen.set(k, r.n);
    const data = {name}; const a = impArea(impCell(r, map, 'area')); if(impHas(map, 'area')){ if(a.bad) it.notes.push(`Bereich „${impCell(r, map, 'area')}“ nicht erkannt: Küche`); if(!a.empty) data.area = a.v; }
    const tr = impCell(r, map, 'target'); if(tr !== ''){ const v = impNum(tr.replace(/\s*(h|std\.?|stunden)$/i, '')); if(!isFinite(v) || v < 0 || v > 80){ it.st = 'fehler'; it.why = `Wochenstunden nicht lesbar: „${tr}“ (0 bis 80)`; continue; } data.target = v > 0 ? v : null; }
    it.data = data; it.sub = [TM_AREA[data.area || 'kueche'], data.target ? num(data.target, 1) + ' Std. je Woche' : ''].filter(Boolean).join(' · ');
    const ex = st.people.find(p => normName(p.name) === k && !(dropDemo && p.demo)); it.ex = ex || null;
    if(ex){ const ch = []; if(data.area && data.area !== ex.area) ch.push('Bereich ' + TM_AREA[data.area]); if(data.target !== undefined && (data.target || null) !== (ex.target || null)) ch.push(`Stunden ${ex.target ? num(ex.target, 1) : '–'} → ${data.target ? num(data.target, 1) : '–'}`); it.st = ch.length ? 'akt' : 'gleich'; if(ch.length) it.why = ch.join(' · '); }
  }
  return {items, dropDemo};
}
function impTeamApply(res){
  const out = {neu:0, akt:0, gleich:0, fehler:0}; if(res.dropDemo) tmDemoRemove(); const st = tmS();
  for(const it of res.items){ if(it.st === 'fehler'){ out.fehler++; continue; } const x = it.data; let p = it.ex && st.people.includes(it.ex) ? it.ex : null;
    if(!p){ p = {id:uid('tp'), name:x.name, area:x.area || 'kueche', target:x.target === undefined ? null : x.target, color:tmNextColor(st.people.map(q => q.color)), active:true, user:''}; st.people.push(p); out.neu++; }
    else { if(it.st === 'akt') out.akt++; else out.gleich++; if(x.area) p.area = x.area; if(x.target !== undefined) p.target = x.target; } }
  return out;
}

/* ---------- Vorlagen ---------- */
const IMP_TPL = {
  menu:{file:'Vorlage-Speisekarte', sheets:[['Speisekarte', [
    ['Kategorie','Gericht','Variante','Beschreibung','Preis','vegetarisch/vegan','Saison','Allergene','Empfehlung','Wochentage'],
    ['Suppen','Frittatensuppe','','Rindsuppe, Kräuterfrittaten','6,50','','','A C G L','',''],
    ['Suppen','Kürbiscremesuppe','','Kernöl, geröstete Kerne','7,20','vegetarisch','Herbst, Winter','G','',''],
    ['Hauptspeisen','Wiener Schnitzel','vom Schwein','Mit Petersilkartoffeln','18,90','','','A C G','ja',''],
    ['Hauptspeisen','Wiener Schnitzel','vom Kalb','Mit Petersilkartoffeln','26,90','','','A C G','',''],
    ['Hauptspeisen','Tafelspitz','','Apfelkren, Schnittlauchsauce; Rösterdäpfel','24,00','','','','','So'],
    ['Desserts','Apfelstrudel','','Hausgemacht, mit Schlagobers','5,90','vegetarisch','','A C G O','',''],
    ['Getränke','Mineralwasser 0,33 l','','','3,40','vegan','','keine','',''],
  ]]]},
  prod:{file:'Vorlage-Artikel', sheets:[['Artikel', [
    ['Artikel','Einheit','Stückgewicht','Preis netto','Lieferant','Artikelnummer','Gebinde','Gebindegröße','Putzverlust','Garverlust','Allergene','Lagerort','Mindestbestand','Anfangsbestand','Pfand','Schankverlust'],
    ['Schweinsschnitzel','kg','','9,80','Metzgerei Muster','MM-1001','Vakuum 5 kg','5','4','15','keine','Kühlhaus','8','10','',''],
    ['Mehl glatt','kg','','0,89','Großhandel Muster','4401','Sack 10 kg','10','0','0','A','Trockenlager','15','20','',''],
    ['Ei M','Stk','60','0,27','Hof Muster','','Tray 30 Stk','30','12','0','C','Kühlhaus','90','180','',''],
    ['Schlagobers 36 %','l','','4,40','Molkerei Muster','7712','Karton 6×1 l','','0','0','G','Kühlhaus','6','12','',''],
    ['Zwiebel','kg','','1,15','Gemüsehof Muster','','Sack 10 kg','10','12','0','keine','Gemüselager','10','20','',''],
    ['Märzen vom Fass','Fass','','87,00','Getränke Muster','GM-30','30 l','','','','A','Bar','2','2','30,00','5'],
    ['Weißbier 0,5 l','Kiste','','19,00','Getränke Muster','GM-52','20×0,5 l','','','','A','Bar','20','40','4,50',''],
    ['Grüner Veltliner 0,75 l','Flasche','','6,40','Weinhandel Muster','','0,75 l','','','','O','Bar','6','12','',''],
  ]]]},
  rec:{file:'Vorlage-Rezepturen', sheets:[['Zutaten', [
    ['Rezeptur','Typ','Zutat','Menge','Einheit','Ausbeute','Portionsgewicht','Gericht auf der Karte'],
    ['Rindsuppe','Basisrezept','Rindsknochen','3','kg','8000','',''],
    ['Rindsuppe','Basisrezept','Zwiebel','400','g','','',''],
    ['Rindsuppe','Basisrezept','Wasser','10','l','','',''],
    ['Rindsuppe','Basisrezept','Salz','2','EL','','',''],
    ['Frittatensuppe','Gericht','Rindsuppe','300','ml','','330','Frittatensuppe'],
    ['Frittatensuppe','Gericht','Mehl glatt','25','g','','',''],
    ['Frittatensuppe','Gericht','Ei M','0,5','Stk','','',''],
    ['Frittatensuppe','Gericht','Schnittlauch','1','TL','','',''],
  ]], ['Schritte', [
    ['Rezeptur','Schritt'],
    ['Rindsuppe','Knochen kalt aufsetzen, aufkochen, abschäumen.'],
    ['Rindsuppe','Zwiebel halbieren, ohne Fett dunkel anrösten, zugeben. 3 Stunden leise köcheln.'],
    ['Frittatensuppe','Palatschinkenteig rühren, dünn ausbacken, in feine Streifen schneiden.'],
    ['Frittatensuppe','Suppe aufkochen, Frittaten in den Teller, mit Suppe aufgießen, Schnittlauch darüber.'],
  ]]]},
  team:{file:'Vorlage-Team', sheets:[['Team', [
    ['Name','Bereich','Wochenstunden'],
    ['Maria','Küche','40'], ['Jakob','Küche','38,5'], ['Sophie','Service','30'], ['Elias','Bar','20'], ['Tereza','Abwasch','25'],
  ]]]},
};
async function impTemplate(type, kind){
  const t = IMP_TPL[type]; if(!t) return;
  if(kind === 'xlsx'){ try { const X = await impXlsx(); const wb = X.utils.book_new(); t.sheets.forEach(([name, rows]) => { const ws = X.utils.aoa_to_sheet(rows); ws['!cols'] = rows[0].map((h, i) => ({wch:Math.min(42, Math.max(10, ...rows.map(r => String(r[i] || '').length + 2)))})); X.utils.book_append_sheet(wb, ws, name); });
      const ok = await saveFile(t.file + '.xlsx', new Blob([X.write(wb, {type:'array', bookType:'xlsx'})], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})); if(ok) toast(t.file + '.xlsx gespeichert'); return; }
    catch(e){ toast('Excel-Vorlage nicht möglich, die CSV-Vorlage funktioniert immer.'); return; } }
  // CSV: ein Blatt. Rezepturen: die Schritte folgen als zweiter Abschnitt mit eigener Überschrift.
  const rows = []; t.sheets.forEach(([, r], i) => { if(i) rows.push([]); r.forEach(x => rows.push(x)); });
  const ok = await saveFile(t.file + '.csv', new Blob(['﻿' + rows.map(r => r.length ? csvLine(r) : '').join('\r\n') + '\r\n'], {type:'text/csv;charset=utf-8'})); if(ok) toast(t.file + '.csv gespeichert');
}
function impTplText(type){ const t = IMP_TPL[type]; const rows = []; t.sheets.forEach(([, r], i) => { if(i) rows.push([]); r.forEach(x => rows.push(x)); }); return rows.map(r => r.join('\t')).join('\n'); }

const IMPS = {
  menu:{title:'Speisekarte importieren', short:'Speisekarte', one:'Gericht', many:'Gerichte', fields:IMP_MENU_FIELDS, analyse:impMenuAnalyse, apply:impMenuApply,
    intro:'Eine Zeile je Gericht. Pflicht sind <b>Gericht</b> und <b>Preis</b> (inkl. MwSt.). Dazu, wenn vorhanden: Kategorie, Beschreibung, Variante, vegetarisch/vegan, Saison, Allergene (Buchstaben A–R oder „keine“), Empfehlung, Wochentage.'},
  prod:{title:'Artikel & Preise importieren', short:'Artikel & Preise', one:'Artikel', many:'Artikel', fields:IMP_PROD_FIELDS, analyse:impProdAnalyse, apply:impProdApply,
    intro:'Eine Zeile je Artikel. Pflicht ist <b>Artikel</b>. Dazu, wenn vorhanden: Einheit (kg, l, Stk), Stückgewicht, Preis netto je Einheit, Lieferant, Artikelnummer, Gebinde und Gebindegröße, Putzverlust, Garverlust, Allergene, Lagerort, Mindestbestand, Anfangsbestand. Getränke: Einheit <b>Flasche</b>, <b>Fass</b> oder <b>Kiste</b>, bei Gebinde der Inhalt („0,75 l“, „30 l“, „20×0,5 l“), der Preis je Flasche, Fass oder Kiste; dazu Pfand und Schankverlust.'},
  rec:{title:'Rezepturen importieren', short:'Rezepturen', one:'Rezeptur', many:'Rezepturen', fields:IMP_REC_FIELDS, analyse:impRecAnalyse, apply:impRecApply,
    intro:'Eine Zeile je Zutat: <b>Rezeptur</b>, <b>Zutat</b>, <b>Menge</b>, Einheit (g, kg, ml, cl, l, Stk, EL, TL, Prise). Dazu, wenn vorhanden: Typ (Gericht, Basisrezept oder Getränk), Ausbeute, Portionen, Portionsgewicht, Schritt, Gericht auf der Karte.'},
  team:{title:'Team importieren', short:'Team', one:'Person', many:'Personen', fields:IMP_TEAM_FIELDS, analyse:impTeamAnalyse, apply:impTeamApply,
    intro:'Eine Zeile je Person: <b>Name</b>, Bereich (Küche, Service, Bar, Abwasch), Wochenstunden.'},
};

/* =====================================================================
   Oberfläche: die Seite „Eigene Daten“ und der Import in drei Schritten
   view.daten = null (Übersicht) | {imp, stage:'in'|'prev'|'done', src, rows, map, dec, mode, filter, res, out}
   ===================================================================== */
function datenOpen(imp){ view.daten = imp && IMPS[imp] ? {imp, stage:'in', text:'', dec:{}, map:{}, mode:'add', filter:'all', err:''} : null; if($('#dlg').open) $('#dlg').close(); go('daten'); }
function datenLast(type){ return (S.imports || []).find(x => x.type === type) || null; }
function datenCountsTxt(type, c){ const I = IMPS[type]; const parts = []; if(c.neu) parts.push(`${c.neu} neu`); if(c.akt) parts.push(`${c.akt} aktualisiert`); if(c.gleich) parts.push(`${c.gleich} unverändert`); if(c.weg) parts.push(`${c.weg} entfernt`); if(c.fehler) parts.push(`${plural(c.fehler, 'Zeile', 'Zeilen')} mit Fehler`); if(c.artikel) parts.push(`${plural(c.artikel, 'neuer Artikel', 'neue Artikel')} ohne Preis`); if(c.lieferanten) parts.push(`${plural(c.lieferanten, 'neuer Lieferant', 'neue Lieferanten')}`); if(c.verknuepft) parts.push(`${plural(c.verknuepft, 'Gericht', 'Gerichte')} verknüpft`); return parts.join(' · ') || `keine ${I.many}`; }
function datenLastTxt(type){ const l = datenLast(type); return l ? `Letzter Import ${fmtDate(l.at)}${l.file ? ' · ' + l.file : ''}` : ''; }
function demoRest(){ const out = []; const ds = S.salesDemo ? demoSalesDays().length : 0; if(ds) out.push({k:'sales', n:ds, t:`${plural(ds, 'Tag', 'Tage')} Beispielverkäufe`}); const tp = S.team && S.team.demo ? S.team.people.filter(p => p.demo).length : 0; if(S.team && S.team.demo) out.push({k:'team', n:tp, t:'Beispiel-Team' + (tp ? ` (${plural(tp, 'Person', 'Personen')})` : '')}); return out; }
function datenSteps(){
  const rest = demoRest(); const withCard = S.menu.filter(m => m.card && C(m.card)).length; const prods = S.products.filter(p => !p.noStock); const people = tmS().people; const si = (S.salesImports || [])[0];
  const realDays = Object.keys(S.salesDays || {}).filter(x => (S.salesReal || {})[x]).length; const own = S.settings.ownData;
  const st = [
    {k:'start', name: S.demo ? 'Leer starten oder Beispiele behalten' : 'Eigener Betrieb', done:!S.demo,
      state: S.demo ? `Die App zeigt Beispieldaten: ${plural(S.menu.length, 'Gericht', 'Gerichte')}, ${plural(S.cards.length, 'Rezeptur', 'Rezepturen')}, ${plural(prods.length, 'Artikel', 'Artikel')}, ${plural((S.suppliers || []).length, 'Lieferant', 'Lieferanten')}.`
        : `Sie arbeiten mit eigenen Daten${own && own.at ? ` seit ${fmtDate(own.at + 'T12:00:00')}` : ''}${own && own.mode === 'keep' ? ' (Beispiele übernommen)' : ''}.` + (rest.length ? ` Noch da: ${rest.map(r => r.t).join(', ')}.` : ''),
      act: S.demo ? {l:'Leer starten', a:'leerAsk'} : null,
      links: (S.demo ? [['leerKeep', 'Beispiele behalten']] : []).concat(rest.map(r => r.a ? [r.a, r.l] : [r.k === 'sales' ? 'leerSales' : 'leerTeam', r.k === 'sales' ? 'nur Beispielverkäufe entfernen' : 'nur Beispiel-Team entfernen']))},
    {k:'menu', name:'Speisekarte importieren', done:!S.demo && S.menu.length > 0, state: S.menu.length ? `${plural(S.menu.length, 'Gericht', 'Gerichte')} in ${plural(new Set(S.menu.map(m => m.section)).size, 'Kategorie', 'Kategorien')}.` : 'Noch kein Gericht auf der Karte.', act:{l:'Speisekarte importieren', a:'datenOpen', id:'menu'}},
    {k:'prod', name:'Artikel & Preise importieren', done:!S.demo && prods.length > 0 && !prods.some(p => p.priceDemo), state: prods.length ? `${plural(prods.length, 'Artikel', 'Artikel')}, ${plural((S.suppliers || []).length, 'Lieferant', 'Lieferanten')} · ${prods.filter(p => !p.priceDemo).length} Preise bestätigt.` : 'Noch kein Artikel angelegt.', act:{l:'Artikel importieren', a:'datenOpen', id:'prod'}},
    {k:'rec', name:'Rezepturen importieren', done:S.menu.length > 0 && withCard === S.menu.length, state: S.menu.length ? `${withCard} von ${S.menu.length} Gerichten haben eine Rezeptur. Ohne Rezeptur gibt es keinen Wareneinsatz und keine Allergene.` : `${plural(S.cards.length, 'Rezeptur', 'Rezepturen')} angelegt.`, act:{l:'Rezepturen importieren', a:'datenOpen', id:'rec'}},
    {k:'team', name:'Team importieren', done:people.length > 0 && !S.team.demo, state: people.length ? `${plural(people.length, 'Person', 'Personen')} im Dienstplan${S.team.demo ? ' (Beispiel-Team mit erfundenen Namen)' : ''}.` : 'Noch niemand im Dienstplan.', act:{l:'Team importieren', a:'datenOpen', id:'team'}},
    {k:'kasse', name:'Kasse', done:realDays > 0, state: si ? `Letzter Import am ${fmtDate(si.date)}: ${plural(si.days, 'Tag', 'Tage')}, ${plural(si.portions, 'Portion', 'Portionen')}.` : 'Noch kein Import aus Ihrer Kasse.' + (S.salesDemo ? ' Die Auswertung zeigt Beispielverkäufe.' : ''), act:{l: si ? 'Kasse öffnen' : 'Kasse importieren', a:'goReportTab', id:'import'}},
  ];
  st.forEach((s, i) => { s.no = i + 1; if(s.k !== 'start' && s.k !== 'kasse'){ const l = datenLastTxt(s.k); if(l) s.state += ' ' + l + '.'; } });
  return st;
}
function renderDaten(){
  if(view.daten && IMPS[view.daten.imp]) return renderImport();
  const st = datenSteps(); const next = st.find(s => !s.done && s.act) || null; const log = (S.imports || []).slice(0, 8); const sf = safetyGet();
  const row = s => { const cls = s.done ? 'done' : next && next.k === s.k ? 'active' : 'open';
    return `<li class="au-row ed-row ${cls}" data-step="${s.k}"><span class="au-n">${s.done ? ico('check') : s.no}</span>
      <span class="au-t"><b>${esc(s.name)}</b><small>${esc(s.state)}</small>${s.links && s.links.length ? `<small class="ed-links">${s.links.map(([a, l]) => `<button type="button" class="link" data-act="${a}">${l}</button>`).join('')}</small>` : ''}</span>
      <span class="au-a">${s.act ? `<button type="button" class="btn sm ${cls === 'active' ? 'primary' : ''}" data-act="${s.act.a}" data-id="${esc(s.act.id || '')}">${esc(s.act.l)}</button>` : ''}</span></li>`; };
  return `<button type="button" class="back" data-act="goTab" data-id="setup">${ico('arrow')}Einstellungen</button>
  <div class="page-h"><div><h1>Eigene Daten</h1><p class="sub">Sechs Schritte von den Beispielen zu Ihrem Betrieb. Jeder Import zeigt zuerst eine Vorschau und lässt sich rückgängig machen. Zu jedem gibt es eine Vorlage zum Ausfüllen.</p></div></div>
  <ol class="au-list ed-list">${st.map(row).join('')}</ol>
  ${log.length ? `<h2 class="sec-h">Importe</h2><ul class="rows ed-log">${log.map(l => `<li class="rw"><span class="rw-lead mono">${fmtDate(l.at)}</span><span class="rw-main"><b>${esc((IMPS[l.type] || {short:l.type}).short)}</b><small>${esc(datenCountsTxt(l.type, l.counts || {}))}${l.file ? ' · ' + esc(l.file) : ''}</small></span><span class="rw-meta">${esc(l.by || '')}</span><span class="rw-act"></span></li>`).join('')}</ul>` : ''}
  ${sf && /Import|Leer starten|Beispiel/.test(sf.why || '') ? `<p class="fact ed-undo">Letzte Änderung: ${esc(sf.why.replace(/^vor /, ''))} am ${fmtDate(sf.at)}. <button type="button" class="link" data-act="datenUndo">Rückgängig machen</button></p>` : ''}`;
}

/* ---------- Import: Datei oder Tabelle → Vorschau → Ergebnis ---------- */
function impSetSource(src){
  const d = view.daten, I = IMPS[d.imp]; d.src = src; d.err = '';
  // das Blatt mit den meisten erkannten Überschriften ist die Tabelle
  let best = 0, bh = null; src.sheets.forEach((sh, i) => { const h = impHeader(sh.rows, I.fields); const sc = Object.keys(h.map).length + (h.hi >= 0 && I.fields.filter(f => f.req).every(f => impHas(h.map, f.k)) ? 100 : 0); if(!bh || sc > bh.sc){ bh = {...h, sc}; best = i; } });
  d.sheet = best; const sh = src.sheets[best]; d.hi = bh.hi; d.head = bh.hi >= 0 ? sh.rows[bh.hi] : null;
  d.cols = Math.max(...sh.rows.slice(0, 40).map(r => r.length));
  if(bh.hi >= 0){ d.map = bh.map; d.rows = sh.rows.slice(bh.hi + 1); }
  else { d.map = {}; I.fields.forEach((f, i) => { if(i < d.cols) d.map[f.k] = i; }); d.rows = sh.rows.slice(); d.noHead = true; }
  if(!d.rows.length){ d.err = 'Die Tabelle enthält keine Datenzeilen.'; d.stage = 'in'; return; }
  d.dec = {}; d.filter = 'all'; d.stage = 'prev'; impRun();
}
function impRun(){ const d = view.daten; try { d.res = IMPS[d.imp].analyse(d); d.err = ''; } catch(e){ d.res = null; d.err = e.message || String(e); } }
function impCounts(res){ const c = {neu:0, akt:0, gleich:0, fehler:0}; (res ? res.items : []).forEach(i => { c[i.st]++; }); return c; }
function impText(text, name){ const d = view.daten; d.text = text; if(!String(text).trim()){ d.err = 'Bitte eine Tabelle einfügen oder eine Datei wählen.'; return; } const {rows, delim} = impCsv(text); if(rows.length < 1){ d.err = 'Keine Zeilen erkannt.'; return; } impSetSource({name:name || '', enc:'', delim, sheets:[{name:'', rows}], pasted:!name}); }
function impRawPrice(it){ return it.rawPrice != null && it.rawPrice !== '' ? `<small class="imp-raw" title="So steht es in der Datei">Datei: „${esc(it.rawPrice)}“</small>` : ''; }
function impRowHtml(it, d){
  const stTxt = it.skip ? 'ausgelassen' : IMP_ST[it.st];
  const right = it.price != null && isFinite(it.price) ? `<span class="imp-x"><b class="mono">${eur(it.price)}</b>${impRawPrice(it)}</span>` : it.rawPrice ? `<span class="imp-x">${impRawPrice(it)}</span>` : '<span class="imp-x"></span>';
  const g = it.gctl; const gctl = g ? `<label class="imp-ctl">${eur(g.pr)} gilt für<select class="sm-sel" data-impdec="${g.key}" aria-label="Preis gilt für"><option value="pack" ${g.mode === 'pack' ? 'selected' : ''}>${esc(g.pack)}, also ${eur(g.pr / g.pq)} je ${esc(g.unit)}</option><option value="unit" ${g.mode === 'unit' ? 'selected' : ''}>1 ${esc(g.unit)}</option></select></label>` : '';
  const ctl = it.ctl ? `<label class="imp-ctl">${it.ctl.sug ? `ähnlich wie „${esc(it.ctl.sug.name)}“` : 'Zuordnung'}<select class="sm-sel" data-impdec="${it.ctl.key}"><option value="new" ${it.ctl.value === 'new' ? 'selected' : ''}>als neuer Artikel</option>${it.ctl.sug ? `<option value="${it.ctl.sug.id}" ${it.ctl.value === it.ctl.sug.id ? 'selected' : ''}>„${esc(it.ctl.sug.name)}“ aktualisieren</option>` : ''}${it.ctl.value !== 'new' && it.ctl.value !== 'skip' && (!it.ctl.sug || it.ctl.sug.id !== it.ctl.value) && P(it.ctl.value) ? `<option value="${it.ctl.value}" selected>„${esc(P(it.ctl.value).name)}“ aktualisieren</option>` : ''}<option value="skip" ${it.ctl.value === 'skip' ? 'selected' : ''}>nicht übernehmen</option></select></label>` : '';
  return `<li class="imp-r st-${it.st}" data-n="${it.n}"><span class="imp-st">${stTxt}<small>Zeile ${it.n}</small></span>
    <span class="imp-m"><b>${esc(it.title)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}${it.sub2 ? `<small>${esc(it.sub2)}</small>` : ''}${it.why ? `<small class="imp-why">${esc(it.why)}</small>` : ''}${(it.notes || []).map(n => `<small class="imp-note">${esc(n)}</small>`).join('')}${gctl}${ctl}</span>${right}</li>`;
}
/* Rezeptur in der Vorschau: Kopf, Verknüpfung, Zeilen mit Umrechnung */
function impRecHtml(it, d){
  const rc = it.rc; if(!rc) return impRowHtml(it, d);
  const menuOpts = sel => `<option value="">— nicht verknüpfen —</option>${rc.linkSug ? `<option value="${rc.linkSug.id}" ${sel === rc.linkSug.id ? 'selected' : ''}>Vorschlag: ${esc(dishLabel(rc.linkSug))}</option>` : ''}${sel.includes(',') ? `<option value="${sel}" selected>${sel.split(',').map(id => { const m = S.menu.find(x => x.id === id); return m ? esc(dishLabel(m)) : ''; }).join(' + ')}</option>` : ''}${menuSorted().map(m => `<option value="${m.id}" ${sel === m.id ? 'selected' : ''}>${esc(dishLabel(m))}${m.card && C(m.card) && (!rc.ex || m.card !== rc.ex.id) ? ' · hat schon eine Rezeptur' : ''}</option>`).join('')}`;
  const line = l => { const cv = l.cv || {}; const tu = cv.tu || 'g';
    const target = l.st === 'skip' ? '' : l.f ? (l.f.isNew ? 'neuer Artikel ohne Preis' : `${l.f.t === 'c' ? 'Basisrezept' : ''}${l.f.exact || l.f.picked ? '' : 'ähnlich'}${normName(l.f.o.name) === normName(l.name) ? '' : ' → ' + esc(l.f.o.name)}`.trim()) : '';
    const info = [target, l.msg ? '' : esc(cv.how || '')].filter(Boolean).join(' · ');
    const q = l.st === 'ok' ? `<b class="mono">${num(l.qty, 2)} ${tu}</b>` : '';
    const ask = (l.ask || d.dec['q:' + l.n] != null) && l.st !== 'skip' ? `<label class="imp-q">in ${tu}<input class="num-in" type="text" inputmode="decimal" data-impq="${l.n}" value="${d.dec['q:' + l.n] != null ? numIn(d.dec['q:' + l.n]) : ''}" placeholder="${l.st === 'ok' ? numIn(Math.round(l.qty * 100) / 100) : '—'}" aria-label="Menge ${esc(l.name)} in ${tu}"></label>` : '';
    return `<li class="imp-l ${l.st}"><span class="imp-ln"><b>${esc(l.qtyRaw)} ${esc(l.unitRaw)}</b> ${esc(l.name)}${info ? `<small>${info}</small>` : ''}${l.msg ? `<small class="imp-why">${esc(l.msg)}</small>` : ''}</span><span class="imp-lq">${q}${ask}</span></li>`; };
  const meta = [rc.type === 'semi' ? 'Basisrezept' : rc.drink ? 'Getränk' : 'Gericht', plural(rc.lines.length, 'Zutat', 'Zutaten'), rc.steps.length ? plural(rc.steps.length, 'Schritt', 'Schritte') : '', rc.yieldG !== '' ? (rc.drink ? 'Ausschank ' + volTxt(rc.yieldG) : (rc.type === 'semi' ? 'Ausbeute ' : 'Portion ') + num(rc.yieldG) + ' g') : ''].filter(Boolean).join(' · ');
  return `<li class="imp-r imp-rec st-${it.st}" data-n="${it.n}"><span class="imp-st">${IMP_ST[it.st]}<small>Zeile ${it.n}</small></span>
    <div class="imp-m"><b>${esc(rc.name)}</b><small>${esc(meta)}</small>${it.why ? `<small class="imp-why">${esc(it.why)}</small>` : ''}${(it.notes || []).map(n => `<small class="imp-note">${esc(n)}</small>`).join('')}
      ${rc.type === 'dish' && it.st !== 'fehler' ? `<label class="imp-ctl">Gericht auf der Karte${rc.linkAuto ? ' (gleicher Name)' : ''}<select class="sm-sel" data-impdec="${rc.lk}">${menuOpts(rc.link || '')}</select></label>` : ''}
      <details class="imp-det" ${it.st === 'fehler' || rc.lines.some(l => l.st === 'fehler' || (l.ask && l.st !== 'ok')) || d.open === rc.key ? 'open' : ''}><summary>${plural(rc.lines.length, 'Zeile', 'Zeilen')} zeigen</summary><ul class="imp-lines">${rc.lines.map(line).join('')}</ul>${rc.steps.length ? `<ol class="imp-steps">${rc.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}</details></div><span class="imp-x"></span></li>`;
}
function impUnmatchedHtml(res){
  if(!res.unmatched || !res.unmatched.length) return '';
  const opts = u => `<option value="new" ${u.dec === 'new' ? 'selected' : ''}>neu anlegen, ohne Preis</option><option value="skip" ${u.dec === 'skip' ? 'selected' : ''}>Zeile auslassen</option>${u.auto ? `<option value="${u.auto.ref}" ${u.dec === u.auto.ref ? 'selected' : ''}>${u.auto.t === 'c' ? 'Basisrezept' : 'Artikel'}: ${esc(u.auto.o.name)}${u.auto.exact ? '' : ' (ähnlich)'}</option>` : ''}<optgroup label="Artikel">${[...S.products].sort(byName).map(p => `<option value="p:${p.id}" ${u.dec === 'p:' + p.id && !(u.auto && u.auto.ref === u.dec) ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>${S.cards.some(c => c.type === 'semi') ? `<optgroup label="Basisrezepte">${S.cards.filter(c => c.type === 'semi').sort(byName).map(c => `<option value="c:${c.id}" ${u.dec === 'c:' + c.id && !(u.auto && u.auto.ref === u.dec) ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup>` : ''}`;
  const none = res.unmatched.filter(u => u.kind === 'none'), other = res.unmatched.filter(u => u.kind !== 'none');
  const li = u => `<li><span><b>${esc(u.name)}</b><small>${u.n}× · ${esc([...u.recs].slice(0, 3).join(', '))}${u.recs.size > 3 ? ' …' : ''}</small></span><select class="sm-sel" data-impdec="${esc(u.key)}" aria-label="Zutat ${esc(u.name)} zuordnen">${opts(u)}</select></li>`;
  return `<section class="imp-um" id="impUm">${none.length ? `<h2 class="sec-h">${plural(none.length, 'Zutat', 'Zutaten')} nicht gefunden</h2><p class="hint">Ohne Zuordnung legt die App einen neuen Artikel ohne Preis an. Er erscheint im Preis-Check als „Preis fehlt“.</p><ul class="imp-uml">${none.map(li).join('')}</ul>` : ''}
    ${other.length ? `<details class="more" ${none.length ? '' : 'open'}><summary>${plural(other.length, 'Zutat', 'Zutaten')} mit ähnlichem Namen zugeordnet, bitte prüfen</summary><ul class="imp-uml">${other.map(li).join('')}</ul></details>` : ''}</section>`;
}
function renderImport(){
  const d = view.daten, I = IMPS[d.imp]; const back = `<button type="button" class="back" data-act="datenOpen" data-id="">${ico('arrow')}Eigene Daten</button>`;
  if(d.stage === 'done'){ const o = d.out || {}; const canUndo = !!safetyGet() && safetyGet().why === d.why; const nErr = d.errRows ? d.errRows.length : 0;
    return back + `<div class="page-h"><div><h1>${esc(I.short)}: Import fertig</h1><p class="sub">${esc(datenCountsTxt(d.imp, o))}</p></div></div>
      <section class="imp-done"><div class="pc-tick">${ico('check')}</div>
        <div class="kv imp-sum">${[['Neu', o.neu], ['Aktualisiert', o.akt], ['Unverändert', o.gleich], ['Entfernt', o.weg], ['Zeilen mit Fehler', o.fehler], ['Zutatenzeilen', o.zutaten], ['Neue Artikel ohne Preis', o.artikel], ['Neue Lieferanten', o.lieferanten], ['Gerichte verknüpft', o.verknuepft]].filter(x => x[1]).map(([l, v]) => `<span>${l}</span><span>${num(v)}</span>`).join('')}</div>
        ${o.artikel ? `<p class="hint">Die neuen Artikel haben noch keinen Preis. <button type="button" class="link" data-act="pcStart">Preis-Check starten</button></p>` : ''}
        <div class="row-btns"><button type="button" class="btn primary" data-act="datenOpen" data-id="">Zurück zu „Eigene Daten“</button>${canUndo ? `<button type="button" class="btn" data-act="datenUndo">Rückgängig</button>` : ''}${nErr ? `<button type="button" class="btn" data-act="impErrDl">Fehlerliste speichern · ${nErr}</button>` : ''}</div>
      </section>`; }
  if(d.stage !== 'prev'){
    return back + `<div class="page-h"><div><h1>${esc(I.title)}</h1><p class="sub">${I.intro}</p></div></div>
      <section class="panel imp-in">
        <div class="row-btns wrap"><button type="button" class="btn primary" data-act="impFile">${ico('plus')}Datei wählen (CSV, Excel)</button><button type="button" class="btn" data-act="impClip">Aus der Zwischenablage</button><input id="impFileIn" type="file" accept=".csv,.txt,.tsv,.xlsx,.xlsm,.xls,.ods,text/csv" hidden></div>
        <label class="f" style="margin-top:14px">oder Tabelle hier einfügen (aus Excel, Word oder einer Webseite kopiert)<textarea id="impPaste" class="code" rows="6" placeholder="${esc(I.fields.slice(0, 5).map(f => f.label.replace(/,.*$/, '')).join('\t'))}">${esc(d.text || '')}</textarea></label>
        <div class="row-btns" style="margin-top:8px"><button type="button" class="btn" data-act="impCheck">Prüfen</button></div>
        <p class="hint bad-t" id="impErr" role="alert" ${d.err ? '' : 'hidden'}>${esc(d.err || '')}</p>
        <p class="hint imp-tpl">Vorlage zum Ausfüllen: <button type="button" class="link" data-act="impTpl" data-id="csv">CSV</button> · <button type="button" class="link" data-act="impTpl" data-id="xlsx">Excel</button> · <button type="button" class="link" data-act="impTplPaste">Beispiel einfügen</button></p>
        ${S.demo ? '<p class="hint">Sie arbeiten noch mit Beispieldaten. Der Import kommt dazu. Zum Aufräumen: Schritt 1 unter „Eigene Daten“.</p>' : ''}
      </section>
      ${moreOpts('impcols', `<ul class="imp-cols">${I.fields.map(f => `<li><b>${esc(f.label)}${f.req ? ' *' : ''}</b><span>${f.syn.slice(0, 7).join(', ')}</span></li>`).join('')}</ul><p class="hint">Groß- und Kleinschreibung, Umlaute, Leerzeichen und Zusätze wie „€“ spielen keine Rolle. * Pflicht.</p>${d.imp === 'rec' ? `<p class="hint">Maße: g, kg, ml, l, dl, cl, Stk. Küchenmaße rechnet die App mit Richtwerten um (EL 15, TL 5, Prise 0,5, Msp 0,3, Zehe 5, Bund 30 Gramm). Die Vorschau zeigt jeden Wert, Sie können ihn überschreiben.</p>` : ''}`, 'Welche Spaltennamen erkennt die App?')}`;
  }
  // Vorschau
  const res = d.res, c = impCounts(res); const src = d.src; const nApply = res ? res.items.filter(i => i.st === 'neu' || i.st === 'akt').length : 0;
  const colName = i => d.head ? (d.head[i] || `Spalte ${i + 1}`) : `Spalte ${i + 1}` + (d.rows[0] && d.rows[0][i] ? ` („${String(d.rows[0][i]).slice(0, 18)}“)` : '');
  const mapOpen = !!d.err || d.noHead || (d.more || {}).map;
  const mapHtml = `<details class="more imp-map" data-impmore="map" ${mapOpen ? 'open' : ''}><summary>Spalten zuordnen${d.noHead ? ' · keine Überschriften erkannt' : ''}</summary><div class="imp-mapg">${I.fields.map(f => `<label class="f">${esc(f.label)}${f.req ? ' *' : ''}<select data-impmap="${f.k}"><option value="-1">— nicht vorhanden —</option>${Array.from({length:d.cols}, (x, i) => `<option value="${i}" ${d.map[f.k] === i ? 'selected' : ''}>${esc(colName(i))}</option>`).join('')}</select></label>`).join('')}</div>${d.noHead ? '<p class="hint">Die erste Zeile sieht nicht nach Überschriften aus. Die Spalten sind der Reihe nach zugeordnet, bitte prüfen. Ist die erste Zeile doch eine Überschrift, wird sie als Fehler gezeigt und nicht übernommen.</p>' : ''}</details>`;
  const fact = `<p class="fact">${src.name ? `<b>${esc(src.name)}</b> · ` : 'Eingefügte Tabelle · '}${plural(d.rows.length, 'Zeile', 'Zeilen')}${src.sheets.length > 1 ? ` · Blatt „${esc(src.sheets[d.sheet].name)}“` : ''}${src.delim ? ` · Trennzeichen ${IMP_DELIM_NAME[src.delim] || src.delim}` : ''}${src.enc ? ` · ${esc(src.enc)}` : ''}</p>`;
  if(!res) return back + `<div class="page-h"><div><h1>${esc(I.title)}</h1></div></div>${fact}<p class="hint bad-t" id="impErr" role="alert">${esc(d.err)}</p>${mapHtml}<div class="row-btns" style="margin-top:14px"><button type="button" class="btn" data-act="impBack">Andere Datei</button></div>`;
  const f = d.filter || 'all'; const shown = res.items.filter(i => f === 'all' || i.st === f);
  const lim = d.all ? shown.length : 80; const rowsHtml = shown.slice(0, lim).map(i => d.imp === 'rec' ? impRecHtml(i, d) : impRowHtml(i, d)).join('');
  let opt = '';
  if(d.imp === 'menu') opt = `<div class="imp-opt">${seg('impMode', d.mode, [['add','Ergänzen'],['replace','Ersetzen']])}<p class="hint">${d.mode === 'replace' ? `Die Karte enthält danach genau die Gerichte der Datei, in ihrer Reihenfolge. <b>${plural(res.gone.length, 'Gericht wird', 'Gerichte werden')} entfernt</b>${res.gone.length ? ': ' + esc(res.gone.slice(0, 4).map(dishLabel).join(', ')) + (res.gone.length > 4 ? ' …' : '') : ''}. Gleiche Gerichte behalten Rezeptur, Foto und Verkaufszahlen.` : 'Neue Gerichte kommen dazu, gleiche werden aktualisiert. Alles andere bleibt, wie es ist.'}</p></div>`;
  if(d.imp === 'team' && tmS().demo) opt = `<div class="imp-opt"><label class="tog"><input type="checkbox" data-impdrop="1" ${d.dropDemo ? 'checked' : ''}><span></span>Beispiel-Team vorher entfernen</label></div>`;
  const nApplyAll = nApply + (d.imp === 'menu' && d.mode === 'replace' ? res.gone.length : 0);
  return back + `<div class="page-h"><div><h1>${esc(I.title)}</h1><p class="sub">Vorschau. Noch ist nichts geändert.</p></div></div>
    ${fact}${mapHtml}
    ${(res.notes || []).map(n => `<p class="hint imp-gnote">${esc(n)}</p>`).join('')}
    ${opt}
    ${d.imp === 'rec' ? impUnmatchedHtml(res) : ''}
    <div class="toolbar imp-tb">${seg('impFilter', f, [['all','Alle',res.items.length],['neu','Neu',c.neu],['akt','Aktualisiert',c.akt],['gleich','Unverändert',c.gleich],['fehler','Fehler',c.fehler]])}</div>
    <ul class="imp-list" id="impList">${rowsHtml || '<li class="imp-empty">Keine Zeilen für diese Auswahl.</li>'}</ul>
    ${shown.length > lim ? `<button type="button" class="rw-more" data-act="impAll">Alle ${shown.length} Zeilen zeigen</button>` : ''}
    <div class="imp-bar"><span class="imp-bar-t">${nApply ? `<b>${nApply}</b> ${nApply === 1 ? I.one : I.many} ${nApply === 1 ? 'wird' : 'werden'} übernommen` : 'Nichts zu übernehmen'}${c.fehler || res.lineErr ? ` · <button type="button" class="link" data-act="impErrDl">Fehlerliste speichern (${impErrRows(d).length})</button>` : ''}</span>
      <span class="row-btns"><button type="button" class="btn" data-act="impBack">Abbrechen</button><button type="button" class="btn primary" data-act="impApply" ${nApplyAll ? '' : 'disabled'}>${nApply ? `${nApply} ${nApply === 1 ? I.one : I.many} übernehmen` : d.mode === 'replace' && nApplyAll ? 'Karte ersetzen' : 'Übernehmen'}</button></span></div>`;
}
/* Fehlerliste: jede Zeile mit Fehler oder Hinweis, samt Originalzeile */
function impErrRows(d){
  const out = []; if(!d.res) return out;
  d.res.items.forEach(it => { if(it.st === 'fehler') out.push([it.n, 'Fehler', it.why || '', ...(it.raw || [])]); (it.notes || []).forEach(n => out.push([it.n, 'Hinweis', n, ...(it.raw || [])]));
    if(it.rc) it.rc.lines.forEach(l => { if(l.st === 'fehler') out.push([l.n, 'Fehler', `${it.rc.name}: ${l.msg}`, ...(l.raw || [])]); else if(l.st === 'skip') out.push([l.n, 'Ausgelassen', `${it.rc.name}: ${l.name}`, ...(l.raw || [])]); }); });
  return out.sort((a, b) => a[0] - b[0]);
}
async function impErrDownload(){ const d = view.daten; if(!d) return; const rows = d.errRows || impErrRows(d); if(!rows.length){ toast('Keine Fehler'); return; }
  const head = ['Zeile', 'Status', 'Grund', ...(d.head || Array.from({length:d.cols || 0}, (x, i) => 'Spalte ' + (i + 1)))];
  const name = `Fehlerliste-${IMPS[d.imp].short.replace(/[^A-Za-zäöüÄÖÜ]+/g, '-')}-${todayStr()}.csv`; const ok = await saveFile(name, csvBlob([head, ...rows])); if(ok) toast(name + ' gespeichert'); }
function impApply(){
  const d = view.daten, I = IMPS[d.imp]; if(!d || !d.res || !roGate()) return;
  d.why = `vor Import: ${I.short}${d.src.name ? ' (' + d.src.name + ')' : ''}`; const kept = safetyStore(d.why);
  d.errRows = impErrRows(d);
  let out; try { out = I.apply(d.res, d); } catch(e){ console.error(e); toast('Import fehlgeschlagen: ' + (e.message || e)); return; }
  S.imports = S.imports || []; S.imports.unshift({id:uid('imp'), type:d.imp, at:new Date().toISOString(), by:me().name, file:d.src.name || 'eingefügt', counts:out}); S.imports = S.imports.slice(0, 40);
  d.out = out; d.stage = 'done'; d.res = null; d.rowsN = d.rows.length; save(); render(); window.scrollTo({top:0});
  toast(`${I.short} übernommen`, kept ? {label:'Rückgängig', ms:8000, action:datenUndo} : null);
}
/* letzte große Änderung zurücknehmen (Import, Leer starten, Beispiele entfernen): die Sicherheitskopie kommt zurück */
async function datenUndo(){
  const sf = safetyGet(); if(!sf || !roGate()) return; let data = null; try { data = await STORE.safetyData(); } catch(e){}
  const nd = data && migrate(data); if(!nd){ toast('Die Sicherheitskopie ist nicht lesbar'); return; }
  S = nd; safetyClear(); save();
  const d = view.daten; if(d && d.stage === 'done' && d.src){ d.stage = 'prev'; impRun(); }
  if(view.tab === 'daten') render(); else go('daten'); toast('Rückgängig gemacht: alles wie vorher');
}

/* ---------- Schritt 1: leer starten, Beispiele behalten, nur Teile entfernen ---------- */
function leerState(){
  const d = JSON.parse(JSON.stringify(S)); const today = todayStr();
  Object.assign(d, {products:[], cards:[], menu:[], moves:[], inventories:[], invDraft:null, suppliers:[], orders:[], specials:[], salesDays:{}, salesReal:{}, salesImports:[], posMap:{}, salesUnmapped:{}, saleGroups:{}, salesDemo:false, salesDemoDone:true, demo:false, plan:{}, game:{done:{}, init:false}});
  d.settings.nextNo = 1; d.settings.orderNo = 1; d.settings.ownData = {at:today, mode:'leer'};
  if(d.team){ Object.assign(d.team, {people:[], shifts:{}, abs:{}, patterns:[], demo:false}); }
  if(d.checks){ d.checks.runs = {}; (d.checks.templates || []).forEach(tp => { tp.sug = true; tp.since = today; }); }
  return migrate(d);
}
function leerDone(msg){ view.daten = null; save(); if(view.tab === 'daten') render(); else go('daten'); setTimeout(() => toast(msg, {label:'Rückgängig', ms:8000, action:datenUndo}), 60); }
function leerAsk(){
  const prods = S.products.filter(p => !p.noStock).length, sd = Object.keys(S.salesDays || {}).length, tp = tmS().people.length; const nImg = Object.keys(IMG).length;
  openDialog('Leer starten?', `<p class="dlg-p">Sie beginnen mit einem leeren Betrieb und laden danach Ihre eigenen Daten.</p>
    <div class="leer-cols"><div><h4>Das wird entfernt</h4><ul><li>${plural(S.menu.length, 'Gericht', 'Gerichte')} und ${plural(S.cards.length, 'Rezeptur', 'Rezepturen')}</li><li>${plural(prods, 'Artikel', 'Artikel')} mit Beständen, Buchungen und Inventuren</li><li>${plural((S.suppliers || []).length, 'Lieferant', 'Lieferanten')} und ${plural((S.orders || []).length, 'Bestellung', 'Bestellungen')}</li><li>Verkäufe (${plural(sd, 'Tag', 'Tage')}) und Kassen-Zuordnungen</li><li>Team (${plural(tp, 'Person', 'Personen')}) mit Dienstplan</li><li>abgehakte Checklisten, Aktionen</li>${typeof apHasDemo === 'function' && apHasDemo() ? '<li>Beispiel-Apartments mit Buchungen</li>' : ''}</ul></div>
    <div><h4>Das bleibt</h4><ul><li>Einstellungen: Name, Adresse, Steuersätze, Zielwert</li><li>Saisonen mit Texten und Farben, Texte der Karte</li><li>Kategorien der Speisekarte</li><li>Checklisten als Vorschlag zum Anpassen</li><li>Dienst-Vorlagen${nImg ? `, ${plural(nImg, 'Foto', 'Fotos')}` : ''}</li></ul></div></div>
    <p class="dlg-p">Vorher legt die App eine Sicherheitskopie an. Mit „Rückgängig“ ist alles wieder da.</p>`,
    () => { const d = leerState(); if(!d){ toast('Leer starten ist gerade nicht möglich.'); return false; } safetyStore('vor „Leer starten“'); S = d; view = {...view, card:null, order:null, recv:null, pc:null, sec:'all'}; setTimeout(() => leerDone('Leerer Betrieb angelegt'), 0); },
    {ok:'Leer starten', toast:false});
}
function leerPart(kind){
  if(!roGate()) return;
  if(kind === 'keep') return ask('Beispiele behalten und als eigene Daten weiterführen? Gerichte, Rezepturen, Artikel und Lieferanten bleiben und gehören ab jetzt zu Ihrem Betrieb. Preise bleiben Richtwerte, bis Sie sie bestätigen.', () => { safetyStore('vor „Beispiele behalten“'); S.demo = false; S.settings.ownData = {at:todayStr(), mode:'keep'}; setTimeout(() => leerDone('Die Beispiele sind jetzt Ihre Daten'), 0); }, 'Beispiele behalten');
  if(kind === 'sales'){ const n = demoSalesDays().length; return ask(`${plural(n, 'Tag', 'Tage')} mit Beispielverkäufen entfernen? Echte Importe und Buchungen bleiben.`, () => { safetyStore('vor „Beispielverkäufe entfernen“'); clearDemoSales(); setTimeout(() => leerDone('Beispielverkäufe entfernt'), 0); }, 'Entfernen'); }
  if(kind === 'team') return ask('Beispiel-Team entfernen? Die erfundenen Personen, ihre Dienste und die abgehakten Beispiel-Checklisten verschwinden. Eigene Personen bleiben.', () => { safetyStore('vor „Beispiel-Team entfernen“'); tmDemoRemove(); setTimeout(() => leerDone('Beispiel-Team entfernt'), 0); }, 'Entfernen');
}

/* ---------- Rezeptur einfügen: „180 g Schweinerücken“ je Zeile ---------- */
function recParseLine(line){
  let s = String(line || '').replace(/^[\s•·*\-–—]+/, '').replace(/\s+/g, ' ').trim(); if(!s) return null;
  const U = '(kg|g|gr|ml|l|dl|cl|stk\\.?|stück|st\\.?|el|tl|essl\\.?|teel\\.?|prisen?|msp\\.?|bund|zehen?|spritzer|schuss|tasse|becher|blatt|blätter|zweige?|scheiben?)';
  const N = '(\\d+(?:[.,]\\d+)?(?:\\s*\\/\\s*\\d+)?|[½¼¾⅓⅔])';
  let m = s.match(new RegExp('^(?:ca\\.?\\s*)?' + N + '\\s*' + U + '?\\s+(.+)$', 'i')) || s.match(new RegExp('^(?:ca\\.?\\s*)?' + N + '\\s*' + U + '\\b\\s*(.+)$', 'i'));
  if(m) return {qtyRaw:m[1].replace(/\s/g, ''), unitRaw:(m[2] || '').replace(/\.$/, ''), name:m[3].replace(/^(von|vom|der|die|das)\s+/i, '').trim()};
  m = s.match(new RegExp('^(.+?)[:,]?\\s+' + N + '\\s*' + U + '?$', 'i'));   // „Schweinerücken 180 g“
  if(m) return {qtyRaw:m[2].replace(/\s/g, ''), unitRaw:(m[3] || '').replace(/\.$/, ''), name:m[1].trim()};
  return {qtyRaw:'', unitRaw:'', name:s, noQty:true};
}
function recPasteAnalyse(text, c, mk){
  const lines = String(text || '').split(/\r?\n/).map(recParseLine).filter(Boolean);
  return lines.map((l, i) => { const f0 = recFind(l.name, []); let f = f0 && !(f0.t === 'c' && f0.o.id === c.id) ? f0 : null; const o = {...l, i};
    if(f && f.t === 'c' && recReaches(f.o, c.id)){ o.st = 'fehler'; o.msg = `„${f.o.name}“ enthält diese Rezeptur schon: Kreisbezug`; return o; }
    if(!f){ if(!mk){ o.st = 'skip'; o.msg = 'nicht gefunden, wird ausgelassen'; return o; } const uk = recUnitKey(l.unitRaw); o.newUnit = REC_STK.test(uk) ? 'Stk' : /^(ml|l|lt|liter|dl|cl)$/.test(uk) ? 'l' : 'kg'; f = {ref:'n:' + normName(l.name), t:'p', o:{name:l.name, unit:o.newUnit, pieceG:0}, isNew:true}; }
    o.f = f; if(l.noQty){ o.st = 'fehler'; o.msg = 'Menge fehlt'; return o; }
    const cv = recConvert(impNum(l.qtyRaw), l.unitRaw, f); o.cv = cv; if(cv.err){ o.st = 'fehler'; o.msg = cv.err; } else { o.st = 'ok'; o.qty = cv.qty; } return o; });
}
function recReaches(card, id, depth = 0){ if(!card || depth > 8) return false; if(card.id === id) return true; return (card.items || []).some(it => { const r = refObj(it.ref); return r && r.t === 'c' && recReaches(r.o, id, depth + 1); }); }
function recPasteDialog(cid){
  const c = C(cid); if(!c || !roGate()) return;
  const empty = !c.items.some(it => it.ref);
  openDialog('Rezeptur einfügen', `<p class="dlg-p">Eine Zutat je Zeile: Menge, Einheit, Zutat. Zum Beispiel aus einem Rezept kopiert.</p>
    <textarea id="rpTxt" class="code rp-txt" rows="7" placeholder="180 g Schweinerücken&#10;12 g Mehl&#10;1 Stk Ei&#10;2 EL Butterschmalz" aria-label="Zutaten, eine je Zeile"></textarea>
    <div class="togs" style="flex-direction:column;align-items:flex-start"><label class="tog"><input type="checkbox" id="rpNew" checked><span></span>Unbekannte Zutaten als neue Artikel ohne Preis anlegen</label>
      ${empty ? '' : `<label class="tog"><input type="checkbox" id="rpRepl"><span></span>Vorhandene ${plural(c.items.filter(it => it.ref).length, 'Zutat', 'Zutaten')} ersetzen (sonst: anhängen)</label>`}</div>
    <ul class="imp-lines rp-out" id="rpOut" aria-live="polite"></ul>`,
    () => { const res = recPasteAnalyse($('#rpTxt').value, c, $('#rpNew').checked); const ok = res.filter(l => l.st === 'ok'); if(!ok.length) return dlgErr('#rpTxt', 'Keine Zeile erkannt. Schreibweise: „180 g Schweinerücken“.');
      const before = JSON.stringify(c.items); const made = []; const repl = empty || ($('#rpRepl') && $('#rpRepl').checked); const newP = new Map();
      const items = repl ? [] : c.items.filter(it => it.ref || (it.qty !== '' && it.qty != null));
      ok.forEach(l => { let ref = l.f.ref; if(l.f.isNew){ let p = newP.get(ref); if(!p){ p = prodNew(l.name, l.newUnit); S.products.push(p); newP.set(ref, p); made.push(p.id); } ref = 'p:' + p.id; } const same = items.find(x => x.ref === ref); if(same) same.qty = Math.round(((+same.qty || 0) + l.qty) * 1000) / 1000; else items.push({ref, qty:l.qty, net:''}); });
      c.items = items; delete c.fresh; const skipped = res.length - ok.length;
      recPasteDialog.msg = `${plural(ok.length, 'Zutat', 'Zutaten')} eingefügt${made.length ? `, ${plural(made.length, 'neuer Artikel', 'neue Artikel')} ohne Preis` : ''}${skipped ? `, ${plural(skipped, 'Zeile', 'Zeilen')} ausgelassen` : ''}`;
      setTimeout(() => toast(recPasteDialog.msg, {ms:8000, action:() => { const cc = C(cid); if(!cc) return; cc.items = JSON.parse(before); S.products = S.products.filter(p => !made.includes(p.id)); save(); render(); toast('Rückgängig gemacht'); }}), 0); },
    {ok:'Einfügen', toast:false, after: f => { const draw = () => { const res = recPasteAnalyse($('#rpTxt').value, c, $('#rpNew').checked);
        $('#rpOut').innerHTML = res.map(l => `<li class="imp-l ${l.st}"><span class="imp-ln"><b>${esc(l.qtyRaw)} ${esc(l.unitRaw)}</b> ${esc(l.name)}${(() => { const info = [l.f && l.st !== 'skip' ? (l.f.isNew ? 'neuer Artikel ohne Preis' : ((l.f.t === 'c' ? 'Basisrezept' : '') + (normName(l.f.o.name) === normName(l.name) ? '' : ' → ' + esc(l.f.o.name))).trim()) : '', !l.msg && l.cv && l.cv.how ? esc(l.cv.how) : ''].filter(Boolean).join(' · '); return info ? `<small>${info}</small>` : ''; })()}${l.msg ? `<small class="imp-why">${esc(l.msg)}</small>` : ''}</span><span class="imp-lq">${l.st === 'ok' ? `<b class="mono">${num(l.qty, 2)} ${l.cv.tu}</b>` : ''}</span></li>`).join(''); };
      $('#rpTxt').addEventListener('input', draw); $('#rpNew').addEventListener('change', draw); setTimeout(() => $('#rpTxt').focus(), 30); }});
}

/* ---------- Ereignisse ---------- */
['datenApply','datenUndo','leerAsk','leerKeep','leerSales','leerTeam','impApply','impFile','impClip','impCheck','impTplPaste','recPaste'].forEach(a => RO_ACTS.add(a));
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id; const d = view.daten;
  switch(el.dataset.act){
    case 'datenOpen': datenOpen(id || ''); break;
    case 'goDemo': datenOpen(''); break;
    case 'datenUndo': datenUndo(); break;
    case 'leerAsk': leerAsk(); break;
    case 'leerKeep': leerPart('keep'); break;
    case 'leerSales': leerPart('sales'); break;
    case 'leerTeam': leerPart('team'); break;
    case 'recPaste': recPasteDialog(id || view.card); break;
    case 'impFile': $('#impFileIn').click(); break;
    case 'impCheck': if(d){ impText($('#impPaste').value); render(); if(d.err){ const t = $('#impPaste'); if(t) t.focus(); } } break;
    case 'impClip': if(d){ let t = ''; try { t = await navigator.clipboard.readText(); } catch(x){ t = ''; } if(t && t.trim()){ impText(t); render(); } else { const ta = $('#impPaste'); if(ta) ta.focus(); toast('Bitte in das Feld tippen und mit Strg+V einfügen'); } } break;
    case 'impTpl': if(d) impTemplate(d.imp, id); break;
    case 'impTplPaste': if(d){ d.text = impTplText(d.imp); d.err = ''; render(); } break;
    case 'impBack': if(d){ d.stage = 'in'; d.res = null; d.err = ''; d.noHead = false; render(); window.scrollTo({top:0}); } break;
    case 'impFilter': if(d){ d.filter = id; d.all = false; renderKeepFocus(); } break;
    case 'impMode': if(d){ d.mode = id; impRun(); renderKeepFocus(); } break;
    case 'impAll': if(d){ d.all = true; renderKeepFocus(); } break;
    case 'impErrDl': impErrDownload(); break;
    case 'impApply': impApply(); break;
  }
});
document.addEventListener('change', async e => {
  const t = e.target, d = view.daten; if(!d || !t.dataset) return;
  if(t.id === 'impFileIn' && t.files[0]){ const file = t.files[0]; try { impSetSource(await impReadFile(file)); } catch(x){ d.err = x.message || 'Die Datei ist nicht lesbar.'; d.stage = 'in'; } t.value = ''; render(); window.scrollTo({top:0}); return; }
  if(t.dataset.impmap){ if(!roGate()) return; const v = +t.value; if(v < 0) delete d.map[t.dataset.impmap]; else { Object.keys(d.map).forEach(k => { if(d.map[k] === v && k !== t.dataset.impmap) delete d.map[k]; }); d.map[t.dataset.impmap] = v; } d.more = {...(d.more || {}), map:true}; impRun(); renderKeepFocus(); return; }
  if(t.dataset.impdec){ if(!roGate()) return; d.dec[t.dataset.impdec] = t.value; impRun(); renderKeepFocus(); return; }
  if(t.dataset.impq){ if(!roGate()) return; const v = t.value.trim() === '' ? null : numParse(t.value); if(v === null) delete d.dec['q:' + t.dataset.impq]; else if(isFinite(v) && v >= 0) d.dec['q:' + t.dataset.impq] = v; else { t.classList.add('bad-in'); return; } const li = t.closest('.imp-rec'); if(li && d.res){ const it = d.res.items.find(x => String(x.n) === li.dataset.n); if(it && it.rc) d.open = it.rc.key; } impRun(); renderKeepFocus(); return; }
  if(t.dataset.impdrop){ if(!roGate()) return; d.dropDemo = t.checked; impRun(); renderKeepFocus(); return; }
});
document.addEventListener('toggle', e => { const t = e.target; if(t && t.dataset && t.dataset.impmore && view.daten) view.daten.more = {...(view.daten.more || {}), [t.dataset.impmore]:t.open}; }, true);
document.addEventListener('paste', e => { const t = e.target; if(!t || t.id !== 'impPaste') return; const html = e.clipboardData && e.clipboardData.getData('text/html'); if(html && /<table/i.test(html)){ const tsv = impHtmlTable(html); if(tsv){ e.preventDefault(); t.value = tsv; } } });
