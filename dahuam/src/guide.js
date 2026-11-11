/* =====================================================================
   Hilfe. Drei Dinge, mehr nicht:
   1. „Was ist das?“: einschalten, auf etwas tippen, die App erklärt es.
   2. Eine Zeile unter jedem Titel und das „?“ daneben: „So geht’s hier“ in drei, vier Sätzen.
   3. Ein kurzer Rundgang durch die täglichen Seiten, einmal angeboten.
   ===================================================================== */

/* ---------- je Gerät gemerkt: wurde der Rundgang schon angeboten? ---------- */
const GKEY = KEY + '_guide';
const G_NOINTRO = /[?&]nointro/.test(location.search);
let G_FRESH = (() => { try { return localStorage.getItem(KEY) === null; } catch(e){ return false; } })();
let GP = (() => { try { return JSON.parse(localStorage.getItem(GKEY)) || {}; } catch(e){ return {}; } })();
function gpSave(){ try { localStorage.setItem(GKEY, JSON.stringify({asked:GP.asked ? 1 : 0, tour:GP.tour ? 1 : 0})); } catch(e){} }

const GD_MARK = '<svg class="gd-mark" viewBox="0 0 24 24" aria-hidden="true"><path class="post" d="M11 3v18"/><path class="board" d="M11 5h7.2l2.8 2.6L18.200 10.2H11z"/><path class="board b2" d="M11 12.2H5.600L3.2 14.400l2.400 2.200H11z"/><path class="post" d="M8 21h6"/></svg>';

/* =====================================================================
   Rundgang: Lichtkegel auf ein echtes Element, kleine Karte daneben
   ===================================================================== */
const GD = {t:null, root:null};
function gdFind(sel){
  try {
    if(typeof sel === 'function'){ const el = sel(); return el && el.isConnected && el.getClientRects().length ? el : null; }
    for(const s of (Array.isArray(sel) ? sel : [sel])){ const el = gq(s); if(el) return el; }
  } catch(e){}
  return null;
}
function gdMount(){
  if(GD.root) GD.root.remove();
  const r = document.createElement('div'); r.id = 'gd'; r.className = 'gd';
  r.innerHTML = '<div class="gd-b" data-b="t"></div><div class="gd-b" data-b="b"></div><div class="gd-b" data-b="l"></div><div class="gd-b" data-b="r"></div><div class="gd-b" data-b="h"></div><div class="gd-hole none"></div><div class="gd-card" role="dialog" aria-modal="false" aria-labelledby="gdT" aria-describedby="gdX" tabindex="-1"></div><div class="gd-live" aria-live="polite"></div>';
  document.body.appendChild(r); GD.root = r; document.body.classList.add('gd-on');
  r.addEventListener('click', e => {
    const b = e.target.closest('[data-gd]');
    if(b){ const a = b.dataset.gd; if(a === 'next') tourNext(); else if(a === 'back') tourBack(); else tourEnd(false, false); return; }
    if(e.target.closest('.gd-b')){ const c = r.querySelector('.gd-card'); c.classList.remove('nudge'); void c.offsetWidth; c.classList.add('nudge'); }
  });
}
function tourStart(){
  if(!S) return false;
  const from = GD.t ? GD.t.from : document.activeElement;
  if(GD.t) tourEnd(true);
  if(HELP_ON) helpSet(false);
  try { palClose(); mehrClose(); } catch(e){}
  bubHide(); howHide();
  GD.t = {steps:RUNDGANG, i:0, dir:1, from, raf:0, back:{tab:view.tab, card:view.card}, shown:0, skipped:0};
  GP.asked = 1; gpSave();
  gdMount(); tourGo(0, 1);
  return true;
}
function tourNext(){ const T = GD.t; if(!T) return; if(T.i >= T.steps.length - 1) tourEnd(false, true); else tourGo(T.i + 1, 1); }
function tourBack(){ const T = GD.t; if(!T || T.i <= 0) return; tourGo(T.i - 1, -1); }
function tourGo(i, dir){
  const T = GD.t; if(!T) return;
  if(i >= T.steps.length){ tourEnd(false, true); return; }
  if(i < 0){ i = 0; dir = 1; }
  T.i = i; T.dir = dir; const s = T.steps[i];
  T.since = performance.now(); T.found = false; T.sig = ''; T.el = null; T.focused = false;
  try { const d = document.querySelector('dialog[open]'); if(d) d.close(); if(s.go) s.go(); } catch(e){ console.warn('Rundgang:', e); }
  gdCardFill();
  GD.root.classList.add('gd-move'); clearTimeout(GD.mv); GD.mv = setTimeout(() => GD.root && GD.root.classList.remove('gd-move'), 420);
  if(!T.raf) T.raf = requestAnimationFrame(gdFrame);
}
function gdCardFill(){
  const T = GD.t, s = T.steps[T.i], n = T.steps.length, card = GD.root.querySelector('.gd-card');
  const txt = typeof s.x === 'function' ? s.x() : s.x; const last = T.i === n - 1;
  card.className = 'gd-card';
  card.innerHTML = `<div class="gd-top">${GD_MARK}<span class="gd-name">Rundgang</span><span class="gd-n">${T.i+1} von ${n}</span></div>
    <h3 id="gdT">${esc(s.t)}</h3><p id="gdX">${esc(txt)}</p>
    <div class="gd-f"><button type="button" class="gd-skip" data-gd="skip">${last ? 'Schließen' : 'Überspringen'}</button><span class="gd-dots" aria-hidden="true">${T.steps.map((_,k) => `<i class="${k < T.i ? 'd' : k === T.i ? 'on' : ''}"></i>`).join('')}</span>${T.i > 0 ? `<button type="button" class="btn sm" data-gd="back">Zurück</button>` : ''}<button type="button" class="btn sm primary" data-gd="next">${last ? 'Fertig' : 'Weiter'}</button></div>`;
  GD.root.querySelector('.gd-live').textContent = `Rundgang, Schritt ${T.i+1} von ${n}. ${s.t}. ${txt}`;
}
function gdFocus(){
  const T = GD.t; if(!T || T.focused) return; T.focused = true;
  const b = GD.root.querySelector('.gd-card [data-gd="next"]'); if(b) b.focus({preventScroll:true});
}
function gdScrollTo(el){
  const r = el.getBoundingClientRect(), vh = window.innerHeight, vw = window.innerWidth;
  const top = vw <= 900 ? 70 : 16, bot = vw <= 900 ? 86 : 16;
  if(r.left < 0 || r.right > vw){ try { el.scrollIntoView({block:'nearest', inline:'center'}); } catch(e){} }
  if(r.height > vh - top - bot - 120){ if(r.top < top || r.top > vh * .45) window.scrollBy(0, r.top - top - 8); return; }
  if(r.top < top || r.bottom > vh - bot){ try { el.scrollIntoView({block:'center', inline:'nearest'}); } catch(e){ el.scrollIntoView(); } }
}
function gdFrame(){
  const T = GD.t; if(!T) return; T.raf = 0;
  try {
    const s = T.steps[T.i], now = performance.now();
    if(GD.root.parentNode !== document.body) document.body.appendChild(GD.root);
    let el = s.sel ? gdFind(s.sel) : null;
    if(s.sel && !el && !T.found && now - T.since > 900){
      // Ziel gibt es hier nicht: Schritt auslassen
      T.skipped++; if(T.skipped > T.steps.length * 2){ tourEnd(true); return; }
      const n = T.i + T.dir;
      if(n >= T.steps.length){ tourEnd(!T.shown, !!T.shown); return; }
      tourGo(n < 0 ? T.i + 1 : n, n < 0 ? 1 : T.dir); return;
    }
    if(el && !T.found){ T.found = true; T.shown++; gdScrollTo(el); el = gdFind(s.sel) || el; }
    if(!s.sel && !T.found){ T.found = true; T.shown++; }
    T.el = el;
    if(T.found){ gdPlace(el, s); gdFocus(); }
  } catch(err){ console.error('Rundgang beendet:', err); tourEnd(true); return; }
  if(GD.t && !GD.t.raf) GD.t.raf = requestAnimationFrame(gdFrame);
}
function gdPlace(el, s){
  const T = GD.t, root = GD.root, hole = root.querySelector('.gd-hole'), card = root.querySelector('.gd-card');
  const vv = window.visualViewport; const vw = window.innerWidth, vh = vv && vv.height < window.innerHeight ? Math.round(vv.height) : window.innerHeight; const pad = s.pad != null ? s.pad : 6;
  let r = null;
  if(el){ const b = el.getBoundingClientRect(); const l = Math.max(4, b.left - pad), t = Math.max(4, b.top - pad); r = {l, t, w: Math.min(vw - 4, b.right + pad) - l, h: Math.min(vh - 4, b.bottom + pad) - t}; if(r.w < 8 || r.h < 8) r = null; }
  const cw = card.offsetWidth, ch = card.offsetHeight;
  const sig = (r ? [r.l, r.t, r.w, r.h].map(Math.round).join(',') : 'x') + '|' + cw + 'x' + ch + '|' + vw + 'x' + vh;
  if(sig === T.sig) return; T.sig = sig;
  const B = k => root.querySelector(`.gd-b[data-b="${k}"]`); const box = (n, l, t, w, h) => { n.style.cssText = `left:${l}px;top:${t}px;width:${Math.max(0,w)}px;height:${Math.max(0,h)}px`; };
  if(!r){ hole.className = 'gd-hole none'; hole.style.cssText = `left:${vw/2}px;top:${vh/2}px;width:0;height:0`; box(B('t'), 0, 0, vw, vh); ['b','l','r','h'].forEach(k => box(B(k), 0, 0, 0, 0)); }
  else {
    hole.className = 'gd-hole'; hole.style.cssText = `left:${r.l}px;top:${r.t}px;width:${r.w}px;height:${r.h}px`;
    box(B('t'), 0, 0, vw, r.t); box(B('b'), 0, r.t + r.h, vw, vh - r.t - r.h); box(B('l'), 0, r.t, r.l, r.h); box(B('r'), r.l + r.w, r.t, vw - r.l - r.w, r.h);
    box(B('h'), r.l, r.t, r.w, r.h);
  }
  // Karte: neben das Ziel, wo Platz ist
  const m = 12, g = 14; let x, y;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  if(!r){ x = (vw - cw) / 2; y = Math.max(m, (vh - ch) / 2 - 20); }
  else {
    const cx = r.l + r.w / 2, cy = r.t + r.h / 2;
    const fit = {
      below: r.t + r.h + g + ch <= vh - m, above: r.t - g - ch >= m,
      right: r.l + r.w + g + cw <= vw - m, left: r.l - g - cw >= m,
    };
    const narrow = r.w < vw * .45;
    const order = s.pos ? [s.pos, 'below', 'above', 'right', 'left'] : (vw > 900 && r.l + r.w < 300) ? ['right', 'below', 'above', 'left'] : narrow && vw > 900 && r.h > 260 ? ['right', 'left', 'below', 'above'] : ['below', 'above', 'right', 'left'];
    const p = order.find(k => fit[k]);
    if(p === 'below'){ x = cl(cx - cw / 2, m, vw - cw - m); y = r.t + r.h + g; }
    else if(p === 'above'){ x = cl(cx - cw / 2, m, vw - cw - m); y = r.t - g - ch; }
    else if(p === 'right'){ x = r.l + r.w + g; y = cl(r.t, m, vh - ch - m); }
    else if(p === 'left'){ x = r.l - g - cw; y = cl(r.t, m, vh - ch - m); }
    else { x = cl(cx - cw / 2, m, vw - cw - m); y = cy < vh / 2 ? vh - ch - m - (vw <= 900 ? 8 : 0) : m + (vw <= 900 ? 56 : 0); }
  }
  card.style.left = Math.round(Math.max(m, Math.min(x, vw - cw - m))) + 'px'; card.style.top = Math.round(Math.max(m, y)) + 'px';
}
function tourEnd(quiet, finished){
  const T = GD.t; if(!T) return; GD.t = null;
  cancelAnimationFrame(T.raf); clearTimeout(GD.mv);
  if(GD.root){ GD.root.remove(); GD.root = null; }
  document.body.classList.remove('gd-on');
  GP.tour = 1; gpSave();
  try { if(finished) go('dash'); else if(!quiet && T.back && TABS.some(t => t[0] === T.back.tab)) go(T.back.tab, T.back.tab === 'cards' && T.back.card && C(T.back.card) ? T.back.card : null); } catch(e){ console.warn(e); }
  const f = T.from; if(f && f.isConnected && f.focus && f !== document.body){ try { f.focus({preventScroll:true}); } catch(e){} }
}
/* Tastatur: ← → Esc, Tab bleibt in der Karte */
window.addEventListener('keydown', e => {
  const T = GD.t; if(!T) return;
  if(e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); tourEnd(false, false); return; }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); e.stopImmediatePropagation(); return; }
  if(e.key === '/'){ e.preventDefault(); e.stopImmediatePropagation(); return; }
  if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ e.preventDefault(); e.stopImmediatePropagation(); e.key === 'ArrowRight' ? tourNext() : tourBack(); return; }
  if(e.key === 'Tab'){
    const list = [...GD.root.querySelectorAll('.gd-card button')]; if(!list.length) return; e.preventDefault(); e.stopImmediatePropagation();
    const k = list.indexOf(document.activeElement); list[(k + (e.shiftKey ? -1 : 1) + list.length) % list.length].focus({preventScroll:true});
  }
}, true);
window.addEventListener('error', () => { if(GD.t) tourEnd(true); });

/* =====================================================================
   Unterzeile und „So geht’s hier“: eine kleine Karte mit drei, vier Sätzen
   ===================================================================== */
function guideCtx(){
  const t = view.tab;
  if(t === 'cards') return view.card && C(view.card) ? 'card' : 'cards';
  if(t === 'menu') return ({guest:'guest', plan:'plan'})[view.mtab] || 'menu';
  if(t === 'buy'){ if(view.order && ORD(view.order)) return view.recv ? 'recv' : 'order'; return view.stab === 'lieferanten' ? 'suppliers' : 'buy'; }
  if(t === 'stock') return view.stab === 'inventur' ? 'inventur' : view.stab === 'buchungen' ? 'moves' : 'stock';
  return t;
}
let HOW = null;
function howHide(){ if(!HOW) return; HOW.n.remove(); const b = HOW.btn; HOW = null; if(b && b.isConnected) b.setAttribute('aria-expanded', 'false'); }
function howShow(btn){
  const id = guideCtx(); const h = HOWTO[id]; if(HOW){ const same = HOW.id === id; howHide(); if(same) return; }
  if(!h){ toast('Für diese Seite gibt es keine Anleitung.'); return; }
  bubHide();
  const n = document.createElement('div'); n.className = 'gd-how'; n.id = 'gdHow'; n.setAttribute('role', 'note'); n.setAttribute('aria-label', 'So geht’s hier');
  n.innerHTML = `<div class="gd-how-h"><b>So geht’s hier</b><button type="button" class="icon-btn" data-act="howClose" aria-label="Schließen">${ico('x')}</button></div><ol>${h.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`;
  const ph = btn && btn.closest('.page-h, .crumb'); if(ph) ph.insertAdjacentElement('afterend', n); else $('#app').prepend(n);   // steht im Seitenfluss, verdeckt nichts
  if(btn) btn.setAttribute('aria-expanded', 'true');
  HOW = {n, id, btn};
}
const GD_Q = () => `<button type="button" class="wozu-q" data-act="guideHere" aria-expanded="false" title="So geht’s hier" aria-label="So geht’s hier: kurze Anleitung für diese Seite">${ico('help')}</button>`;
function injectWozu(){
  const t = view.tab; const ph = $('#app .page-h'); if(!ph) return;
  const h1 = ph.querySelector('h1'); if(!h1) return;
  if(HOWTO[guideCtx()] && !h1.querySelector('.wozu-q')) h1.insertAdjacentHTML('beforeend', GD_Q());
  const txt = subLine(); if(txt && !view.card && !h1.parentNode.querySelector('.sub')) h1.insertAdjacentHTML('afterend', `<p class="sub">${esc(txt)}</p>`);
}

/* =====================================================================
   Hilfe-Modus „Was ist das?“ und die Erklär-Blase
   ===================================================================== */
let HELP_ON = false; let BUB = null;
const HELP_PASS = '[data-tab],[data-act="goTab"],[data-act="goMenu"],[data-act="goStock"],[data-act="goBuyTab"],[data-act="goReportTab"],[data-act="mtab"],[data-act="stab"],[data-act="rpTab"],[data-act="ctype"],[data-act="sec"],[data-act="pFilter"],[data-act="loc"],[data-act="ofilter"],[data-act="backCards"],[data-act="ordBack"],[data-act="openCard"],[data-act="ordOpen"],[data-act="theme"],[data-act="rpUnit"],[data-act="rpStep"],[data-act="rpToday"],[data-act="mehr"],[data-act="mehrClose"],[data-act="guideHere"],[data-act="howClose"],[data-act="wtab"],[data-act="ttab"],[data-act="rzView"],summary';
function helpApply(scope){
  const root = scope || document;
  root.querySelectorAll('#app th, #app .t-l, #app .panel-h h2, #app .hero small, #app .kv > span:nth-child(odd), #app .fcw small, #app .pc-ex small, #app .ring small, #app dt').forEach(el => {
    if(el.dataset.help) return; const tx = el.textContent.replace(/[↑↓]/g, '').trim().toLowerCase(); if(!tx || tx.length > 34) return;
    let k = HELP_TXT[tx] || HELP_TXT[tx.replace(/\s*\d.*$/, '').trim()];
    // dasselbe Wort, andere Bedeutung je Tabelle
    if(tx === 'menge') k = el.closest('.rp-items') ? 'portionen' : el.closest('.otab, .recv') ? 'best_menge' : null;
    else if(tx === 'status') k = el.closest('.recv') ? 'r_status' : el.closest('table.lt') ? 'status' : null;
    else if(tx === 'bestellt') k = 'best_menge';
    if(!k) return;
    const host = el.classList.contains('t-l') ? (el.closest('.tile') || el) : el; if(!host.dataset.help) host.dataset.help = k;
  });
  // Spaltenkopf mit Fachwort: das Wort geht vor „Sortieren“
  for(const [sel, k] of HELP_SEL){ let list; try { list = root.querySelectorAll(sel); } catch(e){ continue; } list.forEach(el => { if(el.dataset.help || (k === 'sortieren' && el.closest('th[data-help]'))) return; el.dataset.help = k; }); }
  if(HELP_ON && !canEditAll()) root.querySelectorAll('#app .ro[disabled]').forEach(el => { el.disabled = false; }); // gesperrte Knöpfe sollen sich erklären lassen
}
function helpFind(t){
  for(let el = t; el && el !== document.body && el.dataset; el = el.parentElement){ const k = el.dataset.help; if(k && HELP[k]) return {el, h:HELP[k]}; }
  return null;
}
function helpSet(on){
  on = !!on; if(on === HELP_ON) return; if(on && GD.t) tourEnd(true);
  HELP_ON = on; document.body.classList.toggle('gd-help', on); bubHide();
  if(S && !canEditAll()){ try { render(); } catch(e){} }
  document.querySelectorAll('[data-act="helpMode"]').forEach(b => b.setAttribute('aria-pressed', on ? 'true' : 'false'));
  let bar = document.getElementById('gdHelpBar');
  if(on){
    helpApply();
    if(!bar){ bar = document.createElement('div'); bar.id = 'gdHelpBar'; bar.className = 'gd-helpbar'; bar.setAttribute('role', 'status');
      bar.innerHTML = `${ico('help')}<span><b>Was ist das?</b> Tippen Sie auf etwas, das Sie nicht kennen.</span><button type="button" class="btn sm" data-act="helpMode">Hilfe aus</button>`; document.body.appendChild(bar); }
  } else if(bar) bar.remove();
}
function bubShow(el, h, opt){
  opt = opt || {}; bubHide();
  const n = document.createElement('div'); n.className = 'gd-bub'; n.setAttribute('role', 'status'); n.setAttribute('aria-live', 'polite');
  n.innerHTML = `<b>${esc(h.t)}</b><p>${esc(h.x)}</p>${opt.note ? `<small>${esc(opt.note)}</small>` : ''}`;
  document.body.appendChild(n);
  const refind = el.dataset && el.dataset.act ? `[data-act="${el.dataset.act}"]` + (el.dataset.id != null ? `[data-id="${CSS.escape(el.dataset.id)}"]` : '') : el.dataset && el.dataset.tab ? `.${el.closest('.bottom') ? 'bottom' : el.closest('.side') ? 'side' : 'shell'} [data-tab="${el.dataset.tab}"]` : null;
  BUB = {n, el, refind, sig:'', lost:0, raf:0, t:opt.ms ? setTimeout(bubHide, opt.ms) : 0};
  const frame = () => { if(!BUB || BUB.n !== n) return;
    try {
      let a = BUB.el; if(!a.isConnected && BUB.refind){ a = gq(BUB.refind); if(a) BUB.el = a; }
      if(!a || !a.isConnected){ if(!BUB.lost) BUB.lost = performance.now(); if(performance.now() - BUB.lost > 2600){ bubHide(); return; } }
      else { BUB.lost = 0; bubPlace(a); }
    } catch(e){ bubHide(); return; }
    BUB.raf = requestAnimationFrame(frame); };
  frame(); requestAnimationFrame(() => n.classList.add('in'));
}
function bubPlace(a){
  const n = BUB.n, r = a.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
  const sig = [r.left, r.top, r.width, r.height, vw, vh].map(Math.round).join(',') ; if(sig === BUB.sig) return; BUB.sig = sig;
  const w = n.offsetWidth, h = n.offsetHeight, m = 10, g = 10;
  const side = vw > 900 && r.right < 300 && r.right + g + w < vw - m; // Navigation links: Blase rechts daneben
  let x, y, cls;
  if(side){ x = r.right + g; y = Math.max(m, Math.min(r.top + r.height / 2 - 22, vh - h - m)); cls = 'side'; n.style.setProperty('--ay', Math.max(12, Math.min(h - 12, r.top + r.height / 2 - y)) + 'px'); }
  else {
    const below = r.bottom + g + h <= vh - m || r.top - g - h < m;
    x = Math.max(m, Math.min(r.left + r.width / 2 - w / 2, vw - w - m)); y = below ? Math.min(r.bottom + g, vh - h - m) : r.top - g - h; cls = below ? 'down' : 'up';
    n.style.setProperty('--ax', Math.max(14, Math.min(w - 14, r.left + r.width / 2 - x)) + 'px');
  }
  n.classList.remove('side', 'down', 'up'); n.classList.add(cls);
  n.style.left = Math.round(x) + 'px'; n.style.top = Math.round(Math.max(m, y)) + 'px';
}
function bubHide(){ if(!BUB) return; cancelAnimationFrame(BUB.raf); clearTimeout(BUB.t); BUB.n.remove(); BUB = null; }

window.addEventListener('click', e => {
  const t = e.target; if(!t.closest) return;
  if(!HELP_ON){ if(BUB && !t.closest('.gd-bub')) bubHide(); return; }
  if(t.closest('.gd-helpbar, [data-act="helpMode"], #gd, dialog, #pal')) return;
  if(t.closest('.gd-bub')) return;
  const hit = helpFind(t); const pass = !!t.closest(HELP_PASS);
  clearTimeout(gdHoverT);   /* die Erklärung zum Klick bleibt stehen; eine noch ausstehende Erklärung vom Überfahren ersetzt sie nicht mehr */
  const ctl = t.closest('[data-act],[data-pdf],[data-pick],button,a,input,select,textarea,label,summary,tr.row,.sh-chip');
  if(!pass && ctl){ e.preventDefault(); e.stopImmediatePropagation(); if(ctl.matches('input,select,textarea')) setTimeout(() => ctl.blur(), 0); }
  if(hit) bubShow(hit.el, hit.h, {note: !pass && ctl && ctl.matches('[data-act],[data-pdf],button,a') ? 'Solange die Hilfe an ist, wird hier nichts ausgeführt.' : ''});
  else if(!pass && ctl) bubShow(ctl, {t:'Dazu gibt es noch keine Erklärung', x:'Solange die Hilfe an ist, wird hier nichts ausgeführt. Mit „Hilfe aus“ geht alles wieder wie gewohnt.'});
  else bubHide();
}, true);
window.addEventListener('mousedown', e => { if(!HELP_ON) return; const t = e.target; if(t.closest && t.id !== 'bq' && t.closest('#app') && t.closest('input,select,textarea,.ti-grip,.sh-chip,[draggable="true"]')){ e.preventDefault(); e.stopImmediatePropagation(); } }, true);
window.addEventListener('pointerdown', e => { if(!HELP_ON) return; const t = e.target; if(t.closest && t.closest('#app .ti-grip, #app .sh-chip, #app [draggable="true"]')) e.stopImmediatePropagation(); }, true);
['change','input'].forEach(ev => window.addEventListener(ev, e => { if(!HELP_ON) return; const t = e.target; if(!t || !t.closest || !t.closest('#app') || t.id === 'bq') return; e.stopImmediatePropagation(); if(t.type === 'checkbox' || t.type === 'radio') t.checked = t.defaultChecked; else if(t.tagName !== 'SELECT') t.value = t.defaultValue; }, true));
let gdHoverT = 0;
document.addEventListener('mouseover', e => {
  if(!HELP_ON || !window.matchMedia('(hover:hover)').matches) return;
  const hit = e.target.closest && !e.target.closest('.gd-bub, .gd-helpbar') ? helpFind(e.target) : null; clearTimeout(gdHoverT);
  if(hit && !(BUB && BUB.el === hit.el)) gdHoverT = setTimeout(() => { if(HELP_ON && hit.el.isConnected) bubShow(hit.el, hit.h); }, 260);
});
window.addEventListener('keydown', e => { if(e.key !== 'Escape' || GD.t) return; if(document.querySelector('dialog[open]') || !$('#pal').hidden) return; if(BUB && !HELP_ON){ bubHide(); return; } if(HELP_ON){ e.preventDefault(); e.stopImmediatePropagation(); helpSet(false); } }, true);

/* =====================================================================
   Rahmen: Rundgang und Hilfe-Schalter unten in der Seitenleiste, Hilfe oben am Handy
   ===================================================================== */
(function gdShell(){
  const foot = document.querySelector('.side .side-foot');
  if(foot && !document.querySelector('.side-help')) foot.insertAdjacentHTML('beforebegin', `<div class="side-help"><button type="button" class="sh-i" data-act="helpMode" aria-pressed="false">${ico('help')}<span>Was ist das?</span><i class="sh-sw" aria-hidden="true"></i></button></div>`);
  const th = document.querySelector('.topbar [data-act="theme"]');
  if(th && !document.querySelector('.topbar [data-act="helpMode"]')) th.insertAdjacentHTML('beforebegin', `<button type="button" class="theme-btn" data-act="helpMode" aria-pressed="false" aria-label="Hilfe: Was ist das?">${ico('help')}</button>`);
})();

/* Schnellsuche: Hilfe und Fachwörter */
const _palDataGd = palData;
palData = function(){
  const a = _palDataGd();
  a.push({g:'Aktion', n:'Rundgang starten', s:'Die täglichen Seiten in fünf Schritten', run:() => tourStart()},
    {g:'Aktion', n:'Was ist das? Hilfe-Modus', s:'Erklärt alles, worauf Sie tippen', run:() => helpSet(!HELP_ON)});
  Object.values(HELP).filter(h => h.g).forEach(h => a.push({g:'Begriff', n:h.t, s:h.x, run:() => info(h.t, h.x)}));
  return a;
};

/* Erster Start: der Rundgang wird einmal angeboten, als Zeile unten, nicht als Fenster */
function gdFirstRun(){
  if(G_NOINTRO || !S || GP.asked || GP.tour) return;
  GP.asked = 1; gpSave();
  setTimeout(() => { if(GD.t || document.querySelector('dialog[open]')) return; toast('Neu hier? Ein kurzer Rundgang zeigt die täglichen Seiten.', {label:'Rundgang', action:() => tourStart(), ms:12000}); }, 600);
}

/* =====================================================================
   Koppeln: Zeichnen, Klicks
   ===================================================================== */
let gdFirst = true;
const _renderGd = render;
render = function(){
  howHide();
  _renderGd();
  try { injectWozu(); helpApply(); } catch(e){ console.warn('Hilfe:', e); }
  if(gdFirst){ gdFirst = false; setTimeout(gdFirstRun, 0); }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  switch(el.dataset.act){
    case 'tourMain': tourStart(); break;
    case 'helpMode': helpSet(!HELP_ON); break;
    case 'guideHere': howShow(el); break;
    case 'howClose': howHide(); break;
  }
});
window.addEventListener('keydown', e => { if(e.key === 'Escape' && HOW && !GD.t && !document.querySelector('dialog[open]')) howHide(); });

