/* =====================================================================
   Allergene: drei Zustände, eine Zählung, Allergen-Blatt für den Service.
   Artikel:  enthält (Buchstaben) · keine Allergene (bestätigt: p.algNone) · nicht gepflegt
   Gericht:  mit Rezeptur zählt nur die Rezeptur: vollständig, wenn JEDE Zutat
             (auch in Basisrezepten) gepflegt ist. Ohne Rezeptur gelten die von Hand
             eingetragenen Angaben am Gericht (m.alg / m.algNone, geprüft am/von).
   „Nicht gepflegt“ sieht nie aus wie „allergenfrei“: Gästekarten zeigen ° und einen Satz dazu.
   ===================================================================== */
const ALG_MARK = '°';
const ALG_OPEN_TXT = 'Bei Gerichten mit ° fragen Sie bitte unser Team – Angaben werden ergänzt.';
/* Beispieldaten: fertige Zukaufware, bei der die Angabe vom Etikett kommen muss, bleibt bewusst offen */
const DEMO_ALG_OPEN = ['fries', 'cranberry', 'applesauce'];
const algClean = s => [...new Set(algList(String(s || '').toUpperCase()).filter(a => ALG[a]))].sort();

function algMigrate(d){
  const s = d.settings; if(!s || s.algV) return d;
  // leer heißt ab jetzt „nicht gepflegt“. Nur wo die Beispieldaten es schon wussten, gilt „keine Allergene“ als bestätigt.
  let known = null;
  if(d.demo){ try { known = Object.fromEntries(seedBase().products.map(p => [p.id, p.alg]).concat(DEMO_DRINKS.map(x => [x[0], x[4]]))); } catch(e){ known = null; } }
  (d.products || []).forEach(p => { if(typeof p.algNone !== 'boolean') p.algNone = !!(known && !algList(p.alg).length && known[p.id] === '' && !DEMO_ALG_OPEN.includes(p.id)); });
  (d.menu || []).forEach(m => { if(typeof m.algNone !== 'boolean') m.algNone = false; });
  s.algV = 1; return d;
}

/* ---------- Zustand ---------- */
function prodAlgState(p){ return !p ? 'open' : algList(p.alg).length ? 'has' : p.algNone === true ? 'none' : 'open'; }
function prodAlgText(p){ const st = prodAlgState(p); return st === 'has' ? algClean(p.alg).join(' ') : st === 'none' ? 'keine Allergene' : 'nicht gepflegt'; }
/* Rezeptur: Buchstaben und alles, was noch offen ist (durch alle Basisrezepte) */
function cardAlg(c, depth = 0, acc){
  acc = acc || {letters:new Set(), open:new Map(), gaps:[]};
  if(!c || depth > 6){ acc.gaps.push('Rezeptur fehlt'); return acc; }
  if(!(c.items || []).length) acc.gaps.push(depth ? `„${c.name}“ hat keine Zutaten` : 'keine Zutaten eingetragen');
  for(const it of c.items || []){
    const r = refObj(it.ref); if(!r){ acc.gaps.push(depth ? `eine Zutat in „${c.name}“ ist nicht gewählt` : 'eine Zutat ist nicht gewählt'); continue; }
    if(r.t === 'p'){ algList(r.o.alg).forEach(a => acc.letters.add(a)); if(prodAlgState(r.o) === 'open') acc.open.set(r.o.id, r.o); }
    else cardAlg(r.o, depth + 1, acc);
  }
  return acc;
}
/* DIE gemeinsame Funktion: Zustand der Allergenangabe eines Gerichts (auch für Zeilen einer Aktion) */
function algInfo(m){
  const c = m && m.card ? C(m.card) : null;
  if(c){ const a = cardAlg(c); const letters = [...a.letters].sort(); const open = [...a.open.values()]; const gaps = [...new Set(a.gaps)];
    const done = !open.length && !gaps.length;
    return {src:'recipe', letters, open, gaps, state: done ? (letters.length ? 'has' : 'none') : 'open'}; }
  const letters = algClean(m && m.alg); const none = !!(m && (m.algNone === true || /^\s*(keine|-|–|0)\s*$/i.test(String(m.alg || ''))));
  return {src:'manual', letters, open:[], gaps:[], state: letters.length ? 'has' : none ? 'none' : 'open', at:(m && m.algAt) || '', by:(m && m.algBy) || ''};
}
function itemAlg(m){ return algInfo(m).letters; }
function hasAlg(m){ return algInfo(m).state !== 'open'; }
/* für die Gästekarte: Buchstaben mehrerer Varianten zusammen, ° sobald eine davon offen ist */
function algOfVars(vars){ const infos = vars.map(algInfo); const letters = [...new Set(infos.flatMap(i => i.letters))].sort(); return {letters, open:infos.some(i => i.state === 'open')}; }
function algOpenText(){ const c = (S.settings.menuCopy || {}).algOpen; return c && String(c).trim() ? String(c).trim() : ALG_OPEN_TXT; }
/* ein Satz, warum ein Gericht offen ist */
function algWhy(m){ const i = algInfo(m); if(i.state !== 'open') return '';
  if(i.src === 'manual') return 'keine Rezeptur, nichts von Hand eingetragen';
  const parts = []; if(i.open.length) parts.push(`${i.open.length === 1 ? 'Artikel' : plural(i.open.length, 'Artikel', 'Artikel')} ohne Angabe: ${i.open.slice(0, 4).map(p => p.name).join(', ')}${i.open.length > 4 ? ' …' : ''}`); if(i.gaps.length) parts.push(i.gaps.join(', '));
  return parts.join(' · '); }
function algStampText(m){ return m && m.algAt ? `geprüft am ${fmtDate(m.algAt + 'T12:00:00')}${m.algBy ? ' von ' + m.algBy : ''}` : ''; }
function noAlgProducts(){ return S.products.filter(p => prodAlgState(p) === 'open'); }

/* ---------- Baustein: enthält / keine / nicht gepflegt ---------- */
function algControlHtml(letters, state, opts){
  opts = opts || {}; const has = new Set(letters);
  const r = (v, l) => `<label class="tog"><input type="radio" name="algState" value="${v}" ${state === v ? 'checked' : ''}><span></span>${l}</label>`;
  return `<fieldset class="alg3" data-st0="${state}"${opts.ctx ? ` data-ctx="${esc(opts.ctx)}"` : ''}><legend>${opts.legend || 'Allergene'}</legend>
    <div class="togs alg3-st">${r('has', 'enthält …')}${r('none', 'keine Allergene')}${r('open', opts.openLabel || 'noch nicht geprüft')}</div>
    <div class="algs alg3-l" ${state === 'has' ? '' : 'hidden'}>${Object.entries(ALG).map(([k, v]) => `<label class="algc"><input type="checkbox" name="alg" value="${k}" ${has.has(k) ? 'checked' : ''}><span><b>${k}</b>${esc(v)}</span></label>`).join('')}</div>
    ${opts.note ? `<p class="hint alg3-n">${opts.note}</p>` : ''}</fieldset>`;
}
function algControlBind(f){
  const box = f.querySelector('.alg3'); if(!box) return; const list = box.querySelector('.alg3-l');
  box.addEventListener('change', e => { if(e.target.name === 'algState'){ list.hidden = e.target.value !== 'has'; if(e.target.value !== 'has') list.querySelectorAll('input').forEach(i => { i.checked = false; }); } });
}
/* liest den Baustein; false + Hinweis, wenn „enthält“ ohne Buchstaben gewählt ist */
function algControlRead(fd){
  const st = fd.get('algState') || 'open', letters = fd.getAll('alg');
  if(st === 'has' && !letters.length){ dlgErr('.alg3-l input', 'Bitte mindestens ein Allergen wählen, oder „keine Allergene“.'); return null; }
  // „keine Allergene“ neu gewählt, aber im Namen steht ein typisches Wort (Mehl, Käse, Pesto …): einmal nachfragen
  const box = document.querySelector('#dlgForm .alg3');
  if(st === 'none' && box && box.dataset.st0 !== 'none' && !box.dataset.asked && !fd.get('card')){
    const hits = algGuess([fd.get('name'), fd.get('section'), fd.get('desc'), box.dataset.ctx].filter(x => typeof x === 'string').join(' '));
    if(hits.length){ box.dataset.asked = '1'; dlgErr(box.querySelector('.alg3-st'), `Sicher? ${hits.slice(0, 2).map(h => `„${h.w}“ enthält meist ${h.a} (${ALG[h.a]})`).join(', ')}. Wenn es wirklich keine Allergene sind, noch einmal speichern.`); return null; } }
  return {alg: st === 'has' ? letters.join(' ') : '', algNone: st === 'none'};
}
/* Plausibilität für „keine Allergene“: typische Wörter in Name, Beschreibung, Kategorie. Nur ein Hinweis, die App entscheidet nichts. */
const ALG_HINT_WORDS = [['A', /(mehl|brot|weizen|dinkel|roggen|gerste|hafer|teig|nudel|pasta|semmel|brösel|knödel|strudel|kuchen|torte|schnitzel|pizza|spätzle|nockerl|schmarrn|palatschink|toast|croûton|crouton|bier)/],
  ['B', /(garnele|shrimp|krabbe|hummer|languste|scampi|krebs)/], ['C', /(^|[^a-zäöüß])(ei|eier|eigelb|eiweiß|eiklar|dotter)([^a-zäöüß]|$)|mayonnaise|mayo/],
  ['D', /(fisch|forelle|lachs|saibling|zander|thunfisch|sardelle|kabeljau|karpfen|hering|dorsch)/], ['E', /erdnuss/], ['F', /(soja|tofu)/],
  ['G', /(milch|käse|butter|sahne|obers|rahm|joghurt|jogurt|topfen|quark|mozzarella|parmesan|molke|mascarpone|ricotta|feta|gorgonzola|emmentaler|crème fraîche|creme fraiche)/],
  ['H', /(nuss|nüsse|mandel|pistazie|cashew|pekan|macadamia|pesto)/], ['L', /sellerie/], ['M', /senf/], ['N', /(sesam|tahin)/], ['O', /(wein|sekt|prosecco)/], ['P', /lupine/], ['R', /(muschel|tintenfisch|kalmar|calamari|oktopus|schnecke)/]];
const ALG_HINT_NOT = /(eierschwammerl|butternut|butternuss|muskatnuss|kokosnuss|oberschale|schwein|erdnuss)/g;
function algGuess(text){
  const words = String(text || '').toLowerCase().split(/[\s,;:.()\/„“"'+&-]+/).filter(Boolean); const out = [];
  words.forEach(w0 => { const w = w0.replace(ALG_HINT_NOT, m => ' '.repeat(m.length)); ALG_HINT_WORDS.forEach(([a, re]) => { if(re.test(a === 'E' ? w0 : w) && !out.some(x => x.a === a)) out.push({a, w:w0.charAt(0).toUpperCase() + w0.slice(1)}); }); });
  return out;
}
/* kleiner Dialog aus Preisliste und Preis-Check */
function algDialog(p, then){
  if(!p || !roGate()) return;
  openDialog('Allergene · ' + p.name, algControlHtml(algClean(p.alg), prodAlgState(p), {ctx:p.name, legend:'Was steht auf dem Etikett oder im Datenblatt?', note:'„Keine Allergene“ ist eine bestätigte Angabe. „Noch nicht geprüft“ bleibt auf der Karte sichtbar offen.'}),
    fd => { const r = algControlRead(fd); if(!r) return false; Object.assign(p, r); },
    {done:() => `${p.name}: ${prodAlgText(p)}`, after: f => { algControlBind(f); if(then) $('#dlg').addEventListener('close', () => setTimeout(then, 0), {once:true}); }});
}

/* ---------- Allergen-Blatt für den Service: A4, Kopf auf jedem Blatt, keine geteilte Zeile ---------- */
const AB_W = 794, AB_H = 1123;
/* Großbuchstaben schon im Text (nicht per CSS): der PDF-Zeichner verrechnet sich sonst bei „ß“ */
const abU = s => esc(String(s == null ? '' : s).toLocaleUpperCase('de-AT'));
function abRows(){
  const date = view.gdate || todayStr(), k = curSeasonKey();
  const items = guestItems(k, date); const rows = [];
  for(const sec of secList()){ const list = items.filter(m => m.section === sec); if(!list.length) continue; rows.push({sec}); list.forEach(m => rows.push({m, name:dishLabel(m), i:algInfo(m)})); }
  specialsFor(date).forEach(sp => { if(!sp.items.length) return; rows.push({sec:'Aktion · ' + sp.name}); sp.items.forEach(it => rows.push({m:it, name:it.name, i:algInfo(it)})); });
  return {rows, date, k};
}
function abStatus(i){ return (i.state === 'none' ? 'keine Allergene · ' : i.state === 'open' ? 'nachfragen · ' : '') + abStatus0(i); }
function abStatus0(i){ return i.state === 'open' ? (i.src === 'recipe' ? 'unvollständig' : 'keine Angabe') : i.src === 'recipe' ? 'aus Rezeptur' : (i.at ? 'geprüft ' + fmtDate(i.at + 'T12:00:00').slice(0, 6) : 'von Hand'); }
function abPages(){
  const {rows, date, k} = abRows(); const dishes = rows.filter(r => r.m);
  const cols = Object.keys(ALG);   // immer alle 14: wer nach Krebstieren sucht, findet die Spalte, auch wenn kein Gericht sie hat
  const nOpen = dishes.filter(r => r.i.state === 'open').length;
  const s = S.settings.seasons[k] || {}; const who = me().name;
  const head = n => `<header class="ab-h"><div><b>${abU(S.settings.name)}</b><h1>Allergen-Blatt für den Service</h1></div><div class="ab-meta"><span>${esc(s.title || '')} · Karte vom ${fmtDate(date + 'T12:00:00')}</span><span>erstellt am ${fmtDate(new Date().toISOString())} von ${esc(who)}</span><span class="ab-pn" data-ab-n="${n}"></span></div></header>`;
  const thead = `<thead><tr><th class="ab-n">Gericht</th>${cols.map(a => `<th class="ab-c" title="${esc(ALG[a])}">${a}</th>`).join('')}<th class="ab-s">Stand</th></tr></thead>`;
  const foot = `<footer class="ab-f"><div class="ab-leg">${cols.map(a => `<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div><p>● enthalten · leer: nicht enthalten (Angabe vollständig) · <b>?</b> nicht geprüft, Zeile grau mit ${ALG_MARK}: bitte in der Küche nachfragen, bevor Sie Auskunft geben. Grundlage: Rezepturen und Artikeldaten der App, EU-VO 1169/2011.</p></footer>`;
  const tr = r => r.sec != null ? `<tr class="ab-sec"><td colspan="${cols.length + 2}" data-sec="${esc(r.sec)}">${abU(r.sec)}</td></tr>`
    : `<tr class="${r.i.state === 'open' ? 'ab-open' : ''}"><td class="ab-n">${esc(r.name)}${r.i.state === 'open' ? ` <i>${ALG_MARK}</i>` : ''}</td>${cols.map(a => `<td class="ab-c">${r.i.letters.includes(a) ? '●' : r.i.state === 'open' ? '?' : ''}</td>`).join('')}<td class="ab-s">${esc(abStatus(r.i))}</td></tr>`;
  // messen: Zeilen fließen auf Blätter; eine Kategorie-Überschrift steht nie allein am Blattende
  let host = document.getElementById('abMeasure'); if(!host){ host = document.createElement('div'); host.id = 'abMeasure'; host.className = 'ab-measure'; host.setAttribute('aria-hidden', 'true'); document.body.appendChild(host); }
  host.innerHTML = ''; const pages = [];
  const newPage = () => { const p = document.createElement('article'); p.className = 'ab-page'; p.innerHTML = `${head(pages.length + 1)}<div class="ab-body"><table class="ab-t">${thead}<tbody></tbody></table></div>${foot}`; host.appendChild(p); pages.push(p); return p; };
  let p = newPage(); let body = p.querySelector('.ab-body'), tb = p.querySelector('tbody');
  const fits = () => body.scrollHeight <= body.clientHeight + 1;
  if(!dishes.length) tb.innerHTML = `<tr><td colspan="${cols.length + 2}" class="ab-empty">Für dieses Datum stehen keine Gerichte auf der Karte.</td></tr>`;
  for(let i = 0; i < rows.length; i++){
    const group = rows[i].sec != null && rows[i + 1] ? [rows[i], rows[i + 1]] : [rows[i]];
    const tmp = document.createElement('tbody'); tmp.innerHTML = group.map(tr).join(''); const els = [...tmp.children]; els.forEach(e => tb.appendChild(e));
    if(!fits() && tb.children.length > els.length){ els.forEach(e => e.remove()); p = newPage(); body = p.querySelector('.ab-body'); tb = p.querySelector('tbody'); els.forEach(e => tb.appendChild(e)); }
    i += group.length - 1;
  }
  pages.forEach((pg, i) => { pg.querySelector('[data-ab-n]').textContent = `Blatt ${i + 1} von ${pages.length}`; });
  const out = pages.map(pg => pg.outerHTML); host.innerHTML = '';
  return {pages:out, nDishes:dishes.length, nOpen, cols, date};
}
/* Fertige A4-Blätter (.ab-page) als PDF speichern: ein Blatt je Seite. Gibt die Seitenzahl zurück (0 = fehlgeschlagen). */
async function a4Pdf(pagesHtml, name){
  const el = $('#print'); let n = 0;
  toast('PDF wird erstellt …');
  try {
    await pdfLibs(); el.className = ''; el.classList.add('pdf', 'ab-print'); el.innerHTML = pagesHtml.join('');
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    await new Promise(x => requestAnimationFrame(() => requestAnimationFrame(x)));
    const pages = [...el.querySelectorAll('.ab-page')]; const {jsPDF} = window.jspdf; const pdf = new jsPDF({unit:'pt', format:'a4', compress:true});
    const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
    for(let i = 0; i < pages.length; i++){
      const canvas = await window.html2canvas(pages[i], {scale:2, backgroundColor:'#ffffff', logging:false, width:AB_W, height:AB_H, windowWidth:Math.max(document.documentElement.clientWidth, 1000), windowHeight:window.innerHeight, scrollX:0, scrollY:-window.scrollY});
      if(i) pdf.addPage(); pdf.addImage(canvas.toDataURL('image/jpeg', .92), 'JPEG', 0, 0, pw, ph, undefined, 'FAST'); canvas.width = canvas.height = 0;
    }
    const ok = await saveFile(name, pdf.output('blob'));
    if(ok) toast(`PDF erstellt: ${name} (${pages.length} ${pages.length === 1 ? 'Seite' : 'Seiten'})`);
    n = pages.length;
  } catch(e){ toast('PDF fehlgeschlagen: ' + (e.message || e)); }
  finally { el.classList.remove('pdf', 'ab-print'); el.innerHTML = ''; }
  return n;
}
async function abExportPdf(){
  const r = abPages(); const name = pdfFileName(`Allergen-Blatt-${S.settings.name.split(' ')[0]}-${r.date}`);
  const n = await a4Pdf(r.pages, name); if(n) window.__abLast = {name, pages:n, dishes:r.nDishes, open:r.nOpen};
}
function abDialog(){
  const r = abPages();
  openDialog('Allergen-Blatt für den Service', `<p class="dlg-p">${plural(r.nDishes, 'Gericht', 'Gerichte')} der Karte vom ${fmtDate(r.date + 'T12:00:00')} auf ${plural(r.pages.length, 'Blatt', 'Blättern')} A4. ${r.nOpen ? `<b>${r.nOpen}</b> davon mit unvollständiger Angabe, im Blatt mit ${ALG_MARK} markiert. <button type="button" class="link" id="abOpenList">Liste zeigen</button>` : 'Alle Angaben sind vollständig.'}</p>
    <div class="ab-prev" id="abPrev">${r.pages.map(p => `<div class="ab-sheet">${p}</div>`).join('')}</div>
    <div class="row-btns"><button type="button" class="btn primary" id="abPdf">${ico('download')}Als PDF speichern</button></div>`, null, {cancel:'Schließen', after: f => {
      f.dataset.wide = '1';
      const fit = () => f.querySelectorAll('.ab-sheet').forEach(sh => { if(sh.clientWidth) sh.style.setProperty('--ab-s', (sh.clientWidth / AB_W).toFixed(5)); }); fit(); setTimeout(fit, 60);
      $('#abPdf').onclick = () => { $('#dlg').close(); abExportPdf(); };
      const l = $('#abOpenList'); if(l) l.onclick = () => { $('#dlg').close(); view.sec = 'noalg'; view.mtab = 'calc'; go('menu'); };
    }});
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id;
  if(el.dataset.act === 'algSheet') abDialog();
  if(el.dataset.act === 'pAlg') algDialog(P(id));
  if(el.dataset.act === 'pAlgNone'){ const p = P(id); if(!p) return; const hits = algGuess(p.name); if(hits.length && prodAlgState(p) !== 'none'){ algDialog(p); const r = document.querySelector('#dlgForm [name=algState][value=none]'); if(r){ r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); } return; } const before = {alg:p.alg, algNone:p.algNone}; p.alg = ''; p.algNone = true; save(); render(); toast(`${p.name}: keine Allergene`, {action:() => { Object.assign(p, before); save(); render(); }}); }
  if(el.dataset.act === 'pcAlg'){ const p = P(id); algDialog(p, () => { if(view.tab === 'pcheck') render(); }); }
});
