/* =====================================================================
   Korrekturen aus dem Audit, die mehrere Bereiche betreffen:
   Gerichtsnamen mit Variante, Rollen (nur Ansicht), Fokus nach
   Inline-Eingaben, Tastaturbedienung, Schnellsuche, Adresse je Rezeptur,
   leere neue Rezepturen aufräumen, Datenmigration.
   ===================================================================== */

/* ---------- Gerichtsname mit Variante: überall derselbe ---------- */
/* kurze Form für enge Stellen: die Variante bleibt immer lesbar */
function dishShort(m, max=24){ const full = dishLabel(m); if(full.length <= max) return full; if(!m.vlabel) return full.slice(0, max-1) + '…'; const room = Math.max(6, max - m.vlabel.length - 4); return String(m.name).slice(0, room).trim() + '… · ' + m.vlabel; }
function dishLabel(m){ return m ? String(m.name || '') + (m.vlabel ? ' · ' + m.vlabel : '') : ''; }

/* ---------- Migration neuer Felder ---------- */
function fixesMigrate(d){
  if(!d || typeof d !== 'object') return d;
  d.moves = d.moves || [];
  if(!d.saleGroups || typeof d.saleGroups !== 'object') d.saleGroups = {};
  // alte Verkaufsbuchungen: Zeilen mit gleichem Zeitpunkt und gleicher Notiz gehörten zu einer Buchung
  d.moves.forEach(m => { if(m && m.type === 'sale' && !m.grp){ const g = 'sb_' + String(m.date||'').slice(0,16).replace(/\D/g,'') + '_' + String(m.note||'').length; m.grp = g; if(!d.saleGroups[g]) d.saleGroups[g] = {day:String(m.date||'').slice(0,10), n:0, rows:null, gross:0, legacy:true}; } });
  Object.keys(d.saleGroups).forEach(g => { if(!d.moves.some(m => m && m.grp === g)) delete d.saleGroups[g]; });
  // echte Verkaufstage merken, damit Beispielverkäufe getrennt gelöscht werden können
  if(!d.salesReal || typeof d.salesReal !== 'object'){ d.salesReal = {}; if(!d.salesDemo) Object.keys(d.salesDays||{}).forEach(k => { d.salesReal[k] = 1; }); }
  if(d.salesDemo && !Object.keys(d.salesDays||{}).some(k => !d.salesReal[k])) d.salesDemo = false;
  // Inventur: keine negativen Zählmengen
  if(d.invDraft && d.invDraft.counts) Object.keys(d.invDraft.counts).forEach(k => { const v = d.invDraft.counts[k]; if(v !== '' && !(+v >= 0)) d.invDraft.counts[k] = ''; });
  // Rezepturmengen: keine negativen Werte
  (d.cards||[]).forEach(c => { (c.items||[]).forEach(it => { if(+it.qty < 0) it.qty = ''; if(it.net !== '' && it.net != null && +it.net < 0) it.net = ''; }); if(+c.yieldG < 0) c.yieldG = ''; });
  return d;
}

/* ---------- Rollen: Der Chef darf alles. Das Team sieht alles, hakt Checklisten und Prep-Liste ab,
   trägt den eigenen Frei-Wunsch ein und bereitet Bestellungen vor. Alles andere ist für das Team gesperrt. ---------- */
const RO_MSG = 'Das kann nur der Chef ändern';
function canEditAll(){ return me().role === 'chef'; }
function whoLabel(u){ const r = ROLES[u.role] || ''; return !r || u.name === r ? u.name : `${u.name} · ${r}`; }
const RO_ACTS = new Set(['newMenu','editMenu','photoMenu','toMenu','newCardFor','newCard','photoCard','photoCardDel','addLine','delLine','stepAdd','stepDel','stepMove','stepPhoto','stepPhotoDel','applySim','dupCard','delCard','addSec','secMove','secDel','secSort','itemMove','itemHide','newProd','editProd','reset','importPick','safetyRestore','pConfirm','pConfirmAll','pFix','plImport','pcStart','pcFor','pcOk','pcSave','pcSkip','pcBack','tellerPick','gStyle','gcover','gcoverDel','newSpecial','editSpecial','dupSpecial','hkAccent','hsCopyReset','secDlg','moveDlg','sales','moveUndo','invStart','invFinish','invCancel','rBook','rAll','ordRecv','supEdit','rpImport','rpDemoDel','rpAnalyse','demoEmpty','mapSave']);
const RO_INPUTS = 'input[data-mp],[data-pp],[data-li],[data-cf],textarea[data-step],.title-in,[data-sf],[data-us],[data-secname],[data-st],[data-smd],[data-ms],[data-hsc],[data-hkk],[data-hka],[data-inv],#pcIn';
function roBlocked(el){
  if(canEditAll() || !el) return false;
  const a = el.dataset.act;
  if(a) return RO_ACTS.has(a);
  return el.matches('.sh-chip,.ti-grip,.lt-grip,[data-pick]') || el.matches(RO_INPUTS);
}
function roGate(ok){ if(ok === undefined ? canEditAll() : ok) return true; toast(RO_MSG); return false; }
window.addEventListener('click', e => { if(canEditAll() || document.body.classList.contains('gd-help')) return; /* Hilfe-Modus erklärt statt zu sperren */ const el = e.target.closest && e.target.closest('[data-act],.sh-chip,[data-pick]'); if(el && roBlocked(el)){ e.preventDefault(); e.stopImmediatePropagation(); roGate(false); } }, true);
window.addEventListener('pointerdown', e => { if(canEditAll()) return; const el = e.target.closest && e.target.closest('.ti-grip,.sh-chip,.lt-grip'); if(el){ e.stopImmediatePropagation(); } }, true);
['change','input'].forEach(ev => window.addEventListener(ev, e => { if(canEditAll()) return; const t = e.target; if(!t || !t.matches || !t.closest('#app') || !roBlocked(t)) return; e.stopImmediatePropagation(); if(t.type === 'checkbox' || t.type === 'radio') t.checked = t.defaultChecked; else if(t.tagName !== 'SELECT') t.value = t.defaultValue; if(ev === 'change') roGate(false); }, true));
/* Dialoge, die auch über die Schnellsuche erreichbar sind */
const _menuDialogF = menuDialog; menuDialog = function(m, pre){ if(roGate()) return _menuDialogF(m, pre); };
const _prodDialogF = prodDialog; prodDialog = function(p){ if(roGate()) return _prodDialogF(p); };
const _newCardF = newCard; newCard = function(type, fromMenu){ if(!roGate()) return; _newCardF(type, fromMenu); const c = C(view.card); if(c && !fromMenu){ c.fresh = true; save(); } };
const _specialDialogF = specialDialog; specialDialog = function(sp){ if(roGate()) return _specialDialogF(sp); };
const _moveDlgF = moveDlg; moveDlg = function(arg){ if(roGate()) return _moveDlgF(arg); };
const _salesDlgF = salesDlg; salesDlg = function(){ if(roGate()) return _salesDlgF(); };
function roApply(){
  const app = $('#app'); if(!app) return; app.querySelector('.ro-note')?.remove();
  if(canEditAll()) return;
  let n = 0;
  app.querySelectorAll('[data-act],' + RO_INPUTS + ',.sh-chip,.ti-grip,.guest-tools input,.guest-tools select,.guest-tools textarea').forEach(el => {
    const inTools = el.closest('.guest-tools') && !el.dataset.act && el.id !== 'gdate';
    if(!inTools && !roBlocked(el)) return;
    n++; if('disabled' in el) el.disabled = true; el.classList.add('ro'); el.setAttribute('aria-disabled', 'true');
    if(el.tagName === 'TR'){ el.classList.remove('row'); el.removeAttribute('data-act'); }
  });
  app.querySelectorAll('.link-btn[data-act="addLine"],.ti-add,.shelf').forEach(el => { el.hidden = true; });
  if(!n) return;
  const note = `<div class="ro-note" role="note">${ico('eye')}<span><b>Nur ansehen.</b> Ändern kann hier der Chef. Angemeldet: ${esc(whoLabel(me()))}.</span></div>`;
  const ph = app.querySelector('.page-h, .hero'); if(ph) ph.insertAdjacentHTML(ph.classList.contains('hero') ? 'beforebegin' : 'afterend', note); else app.insertAdjacentHTML('afterbegin', note);
}

/* ---------- Fokus: nach Tab/Enter in Listenfeldern bleibt der Cursor im nächsten Feld ---------- */
function focusKey(el){
  if(!el || !el.closest || !el.closest('#app')) return null;
  if(el.id) return '#' + CSS.escape(el.id);
  const tag = el.tagName.toLowerCase(), ds = el.dataset;
  if(ds.act) return `#app ${tag}[data-act="${ds.act}"]` + (ds.id != null ? `[data-id="${CSS.escape(ds.id)}"]` : '');
  if(ds.pdf) return `#app ${tag}[data-pdf="${ds.pdf}"]`;
  for(const k of ['mp','pp','li','ol','rd','rp','rs','secname','sel','grip','shelf']) if(ds[k] != null) return `#app ${tag}[data-${k}="${CSS.escape(ds[k])}"]` + (k === 'li' ? `[data-lf="${ds.lf}"]` : k === 'pp' ? `[data-pf="${ds.pf}"]` : '');
  return null;
}
const FOCUSABLE = 'button,input,select,textarea,a[href],summary,[tabindex]';
function renderKeepFocus(){
  const ae = document.activeElement; const sel = focusKey(ae); const y = window.scrollY;
  // Rückfall ohne Kennung: dieselbe Stelle in der Reihenfolge der bedienbaren Elemente
  const inApp = ae && ae.closest && ae.closest('#app'); const idx = inApp ? [...document.querySelectorAll('#app ' + FOCUSABLE.split(',').join(',#app '))].indexOf(ae) : -1; const tag = inApp ? ae.tagName : '';
  render();
  let n = sel ? document.querySelector(sel) : null;
  if(!n && idx >= 0){ const c = document.querySelectorAll('#app ' + FOCUSABLE.split(',').join(',#app '))[idx]; if(c && c.tagName === tag) n = c; }
  if(n && n !== document.activeElement && !n.disabled){ n.focus({preventScroll:true}); if(n.matches('input.num-in') && n.select) n.select(); }
  if(Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
}
softRender = function(){ if(ptrDown){ pendingRender = true; return; } setTimeout(renderKeepFocus, 0); };
/* Mausklick in ein anderes Feld nach einer Änderung: neu zeichnen, ohne den Fokus zu verlieren */
window.addEventListener('pointerup', () => { if(!pendingRender) return; pendingRender = false; ptrDown = false; setTimeout(renderKeepFocus, 0); }, true);
const INLINE_COLS = [['mp', t => 'input[data-mp]'], ['pp', t => `input[data-pp][data-pf="${t.dataset.pf}"]`], ['li', t => `input[data-li][data-lf="${t.dataset.lf}"]`], ['ol', t => 'input[data-ol]'], ['rd', t => 'input[data-rd]'], ['rp', t => 'input[data-rp]']];
document.addEventListener('keydown', e => {
  if(e.key !== 'Enter' || e.isComposing) return; const t = e.target;
  if(!t.matches || t.tagName !== 'INPUT' || !t.closest('#app')) return;
  const col = INLINE_COLS.find(([k]) => t.dataset[k] != null); if(!col) return;
  e.preventDefault(); e.stopPropagation();
  const all = [...document.querySelectorAll('#app ' + col[1](t))].filter(x => !x.disabled);
  const n = all[all.indexOf(t) + (e.shiftKey ? -1 : 1)];
  if(n){ n.focus(); if(n.select) n.select(); } else { t.blur(); t.focus(); if(t.select) t.select(); }
}, true);

/* ---------- Tabelle: Zutat doppelt gewählt → Hinweis ---------- */
document.addEventListener('change', e => { const t = e.target; if(!t.dataset || t.dataset.lf !== 'ref' || !t.value || !view.card) return; const c = C(view.card); if(!c) return; const i = +t.dataset.li; const j = c.items.findIndex((it,k) => k !== i && it.ref === t.value); if(j >= 0){ const r = refObj(t.value); setTimeout(() => toast(`${r ? r.o.name : 'Diese Zutat'} steht schon in Zeile ${j+1}. Besser dort die Menge erhöhen.`, {ms:5000}), 60); } }, true);

/* ---------- Einstellungen: Zahlen prüfen, deutsch anzeigen ---------- */
document.addEventListener('change', e => {
  const t = e.target; if(!t.dataset) return;
  if(t.dataset.sf && t.dataset.sf !== 'name'){ e.stopPropagation(); const v = numParse(t.value); if(!isFinite(v)) return; S.settings[t.dataset.sf] = v; t.value = numIn(v); t.defaultValue = t.value; save(); toast('Gespeichert'); return; }
}, true);

/* ---------- „+ Gericht“ / „+ Basisrezept“: unberührte neue Rezeptur beim Verlassen still entfernen ---------- */
function cardPristine(c){
  return !!c && c.fresh && (c.name === 'Neues Gericht' || c.name === 'Neues Basisrezept') && !c.img && (c.yieldG === '' || c.yieldG == null)
    && !(c.items||[]).some(it => it.ref || (it.qty !== '' && it.qty != null)) && !(c.steps||[]).some(s => (s.t && s.t.trim()) || s.img)
    && !S.menu.some(m => m.card === c.id) && !usage('c:' + c.id).length;
}
let lastOpenCard = null, pruneInit = false;
function pruneFreshCards(){
  const open = view.tab === 'cards' ? view.card : null; let changed = false;
  const drop = c => { S.cards = S.cards.filter(x => x !== c); if(S.settings.nextNo === (+c.no||0) + 1) S.settings.nextNo--; changed = true; };
  if(!pruneInit){ pruneInit = true; let hc = ''; try { hc = decodeURIComponent(location.hash.slice(1)).split('/')[1] || ''; } catch(e){} S.cards.filter(c => c.id !== open && c.id !== hc && cardPristine(c)).forEach(drop); }
  if(lastOpenCard && lastOpenCard !== open){ const c = C(lastOpenCard); if(cardPristine(c)) drop(c); }
  lastOpenCard = open;
  if(changed) save();
}

/* ---------- Nach jedem Zeichnen ---------- */
function rowButtons(){
  // Listenzeilen mit der Tastatur öffnen: der Name ist ein echter Knopf
  document.querySelectorAll('#app tr.row[data-act]').forEach(tr => {
    if(tr.querySelector('.row-open')) return; const b = tr.querySelector('td b'); if(!b) return;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'row-open'; btn.dataset.act = tr.dataset.act; if(tr.dataset.id != null) btn.dataset.id = tr.dataset.id;
    const verb = /^edit/.test(tr.dataset.act) ? 'bearbeiten' : 'öffnen'; btn.setAttribute('aria-label', `${b.textContent.trim()} ${verb}`);
    b.parentNode.insertBefore(btn, b); btn.appendChild(b);
  });
}
function a11yLabels(){
  document.querySelectorAll('#app input[type=search]:not([aria-label]), #dlg input[type=search]:not([aria-label])').forEach(i => i.setAttribute('aria-label', i.placeholder || 'Suchen'));
  document.querySelectorAll('#app .lt thead th button[data-act], #app .rp-items thead th button').forEach(b => { if(!b.title) b.title = 'Sortieren'; });
}
function tabsIntoView(){
  document.querySelectorAll('#app .seg, #app .chips-row, #app .rp-units').forEach(box => { if(box.scrollWidth <= box.clientWidth + 2) return; const on = box.querySelector('.on'); if(!on) return; const br = box.getBoundingClientRect(), r = on.getBoundingClientRect(); if(r.left < br.left + 8 || r.right > br.right - 8) box.scrollLeft += r.left - br.left - (br.width - r.width)/2; });
  const nav = document.querySelector('.bottom .nav-slot'); const on = nav && nav.querySelector('.on'); if(on && nav.scrollWidth > nav.clientWidth + 2){ const br = nav.getBoundingClientRect(), r = on.getBoundingClientRect(); if(r.left < br.left || r.right > br.right) nav.scrollLeft += r.left - br.left - (br.width - r.width)/2; }
}
function whoApply(){ const w = $('#whoami'); if(!w) return; const u = me(); const r = ROLES[u.role] || ''; const extra = [u.name === r ? '' : r, typeof cloudReady === 'function' && cloudReady() ? 'Cloud' : ''].filter(Boolean).join(' · '); w.innerHTML = `<b>${esc(u.name)}</b>${extra ? `<small>${esc(extra)}</small>` : ''}`; w.setAttribute('aria-label', `Angemeldet: ${whoLabel(u)}. Einstellungen öffnen`); }
const _renderFx = render;
render = function(){
  pruneFreshCards();
  _renderFx();
  rowButtons(); a11yLabels(); roApply(); whoApply(); tabsIntoView();
};

/* ---------- Schnellsuche: Treffer am Wortanfang zuerst, Bestellungen nach Nummer ---------- */
const _palDataF = palData;
palData = function(){
  const a = _palDataF();
  (S.orders||[]).forEach(o => { const sp = SUP(o.supplier); a.push({g:'Bestellung', n:o.no, s:`${sp ? sp.name : '?'} · ${OSTAT[o.status]||o.status} · Lieferung ${fmtDate(o.deliveryDate+'T12:00:00')}`, run:()=>{ view.stab = 'bestellung'; view.order = o.id; view.recv = null; go('buy'); }}); });
  return a;
};
function palRank(x, q){
  const n = x.n.toLowerCase(); if(n === q) return 0; if(n.startsWith(q)) return 1;
  const clean = n.replace(/[„“"'«»()]/g, ''); if(clean.startsWith(q)) return 1;
  if(clean.split(/[\s\-–·|,./]+/).some(w => w.startsWith(q))) return 2;
  if(n.includes(q)) return 3; return 4;
}
palFilter = function(q){
  q = q.trim().toLowerCase(); const all = palData();
  if(!q) palItems = all.filter(x => x.g === 'Bereich' || x.g === 'Aktion').slice(0, 40);
  else palItems = all.map((x,i) => ({x, i, r: (x.n+' '+x.s+' '+x.g).toLowerCase().includes(q) ? palRank(x, q) : 9})).filter(o => o.r < 9).sort((a,b) => a.r - b.r || a.i - b.i).slice(0, 40).map(o => o.x);
  palSel = 0; palDraw();
};

/* ---------- Sicherheitskopie zurückholen ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  if(el.dataset.act === 'safetyRestore'){ const sf = safetyGet(); if(!sf) return; ask(`Daten vom ${fmtDate(sf.at)} (${sf.why}) wiederherstellen? Der jetzige Stand wird dabei ersetzt. Das geht nur einmal.`, () => { setTimeout(safetyRestore, 0); }, 'Wiederherstellen'); }
  if(el.dataset.act === 'safetyDl'){ const sf = safetyGet(); if(sf) STORE.safetyData().then(d => d ? saveFile(`dahuam202-sicherheitskopie-${String(sf.at).slice(0,10)}.json`, new Blob([JSON.stringify(d)], {type:'application/json'})) : false).then(ok => ok && toast('Sicherheitskopie gespeichert')); }
});
