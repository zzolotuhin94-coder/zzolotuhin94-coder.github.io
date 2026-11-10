/* =====================================================================
   Begleitung, Teil 2: die Technik.
   Rundgang mit Lichtkegel, Anleitung je Seite, Hilfe-Modus „Was ist das?“,
   Einfach-Modus, klare Navigation, erster Start.
   Grundsatz: Hilfe kommt auf Wunsch und immer nur eine Sache auf einmal.
   ===================================================================== */

/* ---------- Einstellungen je Gerät ---------- */
const GKEY = KEY + '_guide';
const G_NOINTRO = /[?&]nointro/.test(location.search);
let G_FRESH = (() => { try { return localStorage.getItem(KEY) === null; } catch(e){ return false; } })();
let GP = (() => { try { return JSON.parse(localStorage.getItem(GKEY)) || {}; } catch(e){ return {}; } })();
function gpSave(){ try { localStorage.setItem(GKEY, JSON.stringify(GP)); } catch(e){} }
function isSimple(){ return GP.mode === 'simple'; }

/* Wegweiser: das kleine Zeichen der Begleitung, selbst gezeichnet */
const GD_MARK = '<svg class="gd-mark" viewBox="0 0 24 24" aria-hidden="true"><path class="post" d="M11 3v18"/><path class="board" d="M11 5h7.2l2.8 2.6L18.200 10.2H11z"/><path class="board b2" d="M11 12.2H5.600L3.2 14.400l2.400 2.200H11z"/><path class="post" d="M8 21h6"/></svg>';
const GD_HAND = '<svg class="gd-tap" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.500a1.500 1.500 0 0 1 3 0V11m0-1.500a1.500 1.500 0 0 1 3 0V12m0-1a1.500 1.500 0 0 1 3 0v4.500A5.500 5.500 0 0 1 12.500 21h-.6a5 5 0 0 1-4.100-2.100L4.600 14.300a1.400 1.400 0 0 1 2.100-1.800L9 14.500"/></svg>';
const GD_OK = '<svg class="gd-okm" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.500 4.500L19 7.500"/></svg>';

/* =====================================================================
   Rundgang: Lichtkegel auf ein echtes Element, kleine Karte daneben
   ===================================================================== */
const GD = {t:null, root:null};
function gdCanDo(s){ return !!(s && s.do) && (canEditAll() || !!s.do.ro); }
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
function tourStart(id, opt){
  opt = opt || {};
  const def = typeof id === 'string' ? TOURS[id] : id; if(!def || !S) return false;
  const from = GD.t ? GD.t.from : (opt.from || document.activeElement);
  if(GD.t) tourEnd(true, false);
  if(typeof helpSet === 'function' && HELP_ON) helpSet(false);
  try { palClose(); } catch(e){}
  bubHide();
  const steps = def.steps.filter(s => { try { return !s.when || s.when(); } catch(e){ return false; } });
  if(!steps.length) return false;
  GD.t = {id:def.id, def, steps, i:0, dir:1, from, raf:0, back:{tab:view.tab, card:view.card}, shown:0, skipped:0, ctx:{}};
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
  T.since = performance.now(); T.found = false; T.okAt = 0; T.sig = ''; T.ctx = {}; T.el = null; T.focused = false;
  try { const d = document.querySelector('dialog[open]'); if(d && !s.dlg && !d.classList.contains('gd-wel')) d.close(); if(s.go) s.go(); } catch(e){ console.warn('Rundgang:', e); }
  T.doing = gdCanDo(s);
  if(T.doing && s.do.init){ try { s.do.init(T.ctx); } catch(e){ T.doing = false; } }
  gdCardFill();
  GD.root.classList.add('gd-move'); clearTimeout(GD.mv); GD.mv = setTimeout(() => GD.root && GD.root.classList.remove('gd-move'), 420);
  if(!T.raf) T.raf = requestAnimationFrame(gdFrame);
}
function gdCardFill(){
  const T = GD.t, s = T.steps[T.i], n = T.steps.length, card = GD.root.querySelector('.gd-card');
  const txt = typeof s.x === 'function' ? s.x() : s.x; const last = T.i === n - 1;
  card.className = 'gd-card' + (T.doing ? ' do' : '');
  card.innerHTML = `<div class="gd-top">${GD_MARK}<span class="gd-name">${esc(T.def.name)}</span><span class="gd-n">${T.i+1} von ${n}</span></div>${n > 6 ? `<div class="gd-bar" aria-hidden="true"><i style="width:${((T.i+1)/n*100).toFixed(1)}%"></i></div>` : ''}
    <h3 id="gdT">${esc(s.t)}</h3><p id="gdX">${esc(txt)}</p>
    ${T.doing ? `<p class="gd-do">${GD_HAND}<span>${esc(s.do.hint)}</span></p>` : s.do ? `<p class="gd-ro">Ausprobieren dürfen das nur Küchenchef und Inhaber.</p>` : ''}
    <div class="gd-f"><button type="button" class="gd-skip" data-gd="skip">${n > 1 && !last ? 'Überspringen' : 'Schließen'}</button><span class="gd-dots" aria-hidden="true">${n > 1 && n <= 6 ? T.steps.map((_,k) => `<i class="${k < T.i ? 'd' : k === T.i ? 'on' : ''}"></i>`).join('') : ''}</span>${T.i > 0 ? `<button type="button" class="btn sm" data-gd="back">Zurück</button>` : ''}<button type="button" class="btn sm ${T.doing ? '' : 'primary'}" data-gd="next">${last ? 'Fertig' : 'Weiter'}</button></div>`;
  GD.root.querySelector('.gd-live').textContent = `${T.def.name}, Schritt ${T.i+1} von ${n}. ${s.t}. ${txt} ${T.doing ? s.do.hint : ''}`;
}
function gdFocus(){
  const T = GD.t; if(!T || T.focused) return; T.focused = true;
  const el = T.el; const card = GD.root.querySelector('.gd-card');
  // am Handy nicht ins Feld springen: die Tastatur würde die Karte verdecken, bevor man sie gelesen hat
  if(T.doing && el && el.matches('input,textarea') && !el.disabled && !window.matchMedia('(pointer:coarse)').matches){ el.focus({preventScroll:true}); try { el.select(); } catch(e){} return; }
  const b = card.querySelector('[data-gd="next"]'); if(b) b.focus({preventScroll:true});
}
function gdScrollTo(el){
  const r = el.getBoundingClientRect(), vh = window.innerHeight, vw = window.innerWidth;
  const top = vw <= 900 ? 70 : 16, bot = vw <= 900 ? 86 : 16;
  if(r.left < 0 || r.right > vw){ try { el.scrollIntoView({block:'nearest', inline:'center'}); } catch(e){} }
  if(r.height > vh - top - bot - 120){ if(r.top < top || r.top > vh * .45) window.scrollBy(0, r.top - top - 8); return; }
  if(r.top < top || r.bottom > vh - bot){ try { el.scrollIntoView({block:'center', inline:'nearest'}); } catch(e){ el.scrollIntoView(); } }
}
function gdHost(){
  const d = document.querySelector('dialog[open]'); const want = d || document.body;
  if(GD.root.parentNode !== want) want.appendChild(GD.root);
  return d;
}
function gdFrame(){
  const T = GD.t; if(!T) return; T.raf = 0;
  try {
    const s = T.steps[T.i], now = performance.now();
    const dlg = gdHost(); const docked = !!dlg && !s.dlg;
    let el = s.sel && !docked ? gdFind(s.sel) : null;
    if(s.sel && !docked && !el && !T.found && now - T.since > (s.wait || 900)){
      // Ziel gibt es hier nicht: Schritt auslassen
      T.skipped++; if(T.skipped > T.steps.length * 2){ tourEnd(true, false); return; }
      const n = T.i + T.dir;
      if(n >= T.steps.length){ if(T.shown) tourEnd(false, true); else { tourEnd(true, false); toast('Hier gibt es gerade nichts zu zeigen.'); } return; }
      tourGo(n < 0 ? T.i + 1 : n, n < 0 ? 1 : T.dir); return;
    }
    if(el && !T.found){ T.found = true; T.shown++; gdScrollTo(el); el = gdFind(s.sel) || el; }
    if(!s.sel && !T.found){ T.found = true; T.shown++; }
    T.el = el;
    if(T.found || docked) gdPlace(el, s, docked);
    if(T.found && !docked) gdFocus();
    if(T.doing && !T.okAt){ let ok = false; try { ok = !!s.do.done(T.ctx); } catch(e){} if(ok){ T.okAt = now; gdCardOk(); } }
    if(T.okAt && now - T.okAt > 1250 && !document.querySelector('dialog[open]')){ tourNext(); if(!GD.t) return; }
  } catch(err){ console.error('Rundgang beendet:', err); tourEnd(true, false); return; }
  if(GD.t && !GD.t.raf) GD.t.raf = requestAnimationFrame(gdFrame);
}
const GD_PRAISE = ['Genau so.', 'Passt.', 'Gut gemacht.', 'So geht das.'];
function gdCardOk(){
  const T = GD.t, card = GD.root.querySelector('.gd-card'); card.classList.add('ok'); GD.root.classList.add('gd-ok');
  const p = card.querySelector('.gd-do'); const w = GD_PRAISE[(T.i + T.steps.length) % GD_PRAISE.length];
  if(p) p.innerHTML = GD_OK + `<span>${w}</span>`;
  GD.root.querySelector('.gd-live').textContent = w;
  setTimeout(() => GD.root && GD.root.classList.remove('gd-ok'), 1300);
}
function gdPlace(el, s, docked){
  const T = GD.t, root = GD.root, hole = root.querySelector('.gd-hole'), card = root.querySelector('.gd-card');
  const vv = window.visualViewport; const vw = window.innerWidth, vh = vv && vv.height < window.innerHeight ? Math.round(vv.height) : window.innerHeight; const pad = s.pad != null ? s.pad : 6;
  let r = null;
  if(el){ const b = el.getBoundingClientRect(); const l = Math.max(4, b.left - pad), t = Math.max(4, b.top - pad); r = {l, t, w: Math.min(vw - 4, b.right + pad) - l, h: Math.min(vh - 4, b.bottom + pad) - t}; if(r.w < 8 || r.h < 8) r = null; }
  const cw = card.offsetWidth, ch = card.offsetHeight;
  const sig = (docked ? 'D' : '') + (r ? [r.l, r.t, r.w, r.h].map(Math.round).join(',') : 'x') + '|' + cw + 'x' + ch + '|' + vw + 'x' + vh + (T.doing ? 'i' : '');
  if(sig === T.sig) return; T.sig = sig;
  root.classList.toggle('docked', docked);
  const B = k => root.querySelector(`.gd-b[data-b="${k}"]`); const box = (n, l, t, w, h) => { n.style.cssText = `left:${l}px;top:${t}px;width:${Math.max(0,w)}px;height:${Math.max(0,h)}px`; };
  if(docked){ hole.className = 'gd-hole off'; ['t','b','l','r','h'].forEach(k => box(B(k), 0, 0, 0, 0)); }
  else if(!r){ hole.className = 'gd-hole none'; hole.style.cssText = `left:${vw/2}px;top:${vh/2}px;width:0;height:0`; box(B('t'), 0, 0, vw, vh); ['b','l','r','h'].forEach(k => box(B(k), 0, 0, 0, 0)); }
  else {
    hole.className = 'gd-hole' + (T.doing ? ' open' : ''); hole.style.cssText = `left:${r.l}px;top:${r.t}px;width:${r.w}px;height:${r.h}px`;
    box(B('t'), 0, 0, vw, r.t); box(B('b'), 0, r.t + r.h, vw, vh - r.t - r.h); box(B('l'), 0, r.t, r.l, r.h); box(B('r'), r.l + r.w, r.t, vw - r.l - r.w, r.h);
    if(T.doing) box(B('h'), 0, 0, 0, 0); else box(B('h'), r.l, r.t, r.w, r.h);
  }
  // Karte: neben das Ziel, wo Platz ist
  const m = 12, g = 14; let x, y;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  if(docked){ x = vw <= 700 ? (vw - cw) / 2 : m + 4; y = vw <= 700 ? m : vh - ch - m - 4; }
  else if(!r){ x = (vw - cw) / 2; y = Math.max(m, (vh - ch) / 2 - 20); }
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
  let nextId = null; if(finished && T.def.next){ try { nextId = T.def.next(); } catch(e){} }
  if(nextId && TOURS[nextId]){ if(tourStart(nextId, {from:T.from})) return; }
  try {
    if(T.id === 'main'){
      if(finished){ gdAct('tour'); GP.tour = 1; gpSave(); go('aufbau'); }
      else if(!quiet && T.back && TABS.some(t => t[0] === T.back.tab)){ go(T.back.tab, T.back.tab === 'cards' && T.back.card && C(T.back.card) ? T.back.card : null); }
    } else if(finished && !quiet && T.shown > 1) toast('Das war die Anleitung für diese Seite.');
  } catch(e){ console.warn(e); }
  const f = T.from; if(f && f.isConnected && f.focus && f !== document.body){ try { f.focus({preventScroll:true}); } catch(e){} }
  setTimeout(gdRewards, 500);
}
/* Tastatur: ← → Esc, Tab bleibt in Karte und Ziel */
window.addEventListener('keydown', e => {
  const T = GD.t; if(!T) return;
  const dlg = document.querySelector('dialog[open]'); const s = T.steps[T.i];
  if(e.key === 'Escape'){ if(dlg && !(s && s.dlg)) return; e.preventDefault(); e.stopImmediatePropagation(); tourEnd(false, false); return; }
  if(dlg) return;
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); e.stopImmediatePropagation(); return; }
  const typing = e.target.closest && e.target.closest('input,textarea,select,[contenteditable]');
  if(e.key === '/' && !typing){ e.preventDefault(); e.stopImmediatePropagation(); return; }
  if(!typing && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')){ e.preventDefault(); e.stopImmediatePropagation(); e.key === 'ArrowRight' ? tourNext() : tourBack(); return; }
  if(e.key === 'Tab'){
    const card = GD.root.querySelector('.gd-card'); let list = [...card.querySelectorAll('button')];
    if(T.doing && T.el){ const inner = T.el.matches(FOCUSABLE) ? [T.el] : [...T.el.querySelectorAll(FOCUSABLE)]; list = inner.filter(x => !x.disabled && x.getClientRects().length).concat(list); }
    if(!list.length) return; e.preventDefault(); e.stopImmediatePropagation();
    const k = list.indexOf(document.activeElement); list[(k + (e.shiftKey ? -1 : 1) + list.length) % list.length].focus({preventScroll:true});
  }
}, true);
window.addEventListener('error', () => { if(GD.t) tourEnd(true, false); });

/* ---------- Anleitung für die Seite, auf der man gerade ist ---------- */
function guideCtx(){
  const t = view.tab;
  if(t === 'cards') return view.card && C(view.card) ? 'card' : 'cards';
  if(t === 'menu') return ({guest:'guest', plan:'plan', layout:'layout'})[view.mtab] || 'menu';
  if(t === 'buy' || (t === 'stock' && BUY.includes(view.stab))){ if(view.order && ORD(view.order)) return view.recv ? 'recv' : 'order'; return view.stab === 'lieferanten' ? 'suppliers' : 'buy'; }
  if(t === 'stock') return view.stab === 'inventur' ? 'inventur' : view.stab === 'buchungen' ? 'moves' : 'stock';
  if(t === 'report') return view.rp && view.rp.tab === 'import' ? 'rimport' : view.rp && view.rp.tab === 'map' ? 'rmap' : 'report';
  return t;
}
function guideHere(){ const id = guideCtx(); if(TOURS[id]) { if(!tourStart(id)) toast('Hier gibt es gerade nichts zu zeigen.'); } else toast('Für diese Seite gibt es keine Anleitung.'); }
const GD_Q = () => `<button type="button" class="wozu-q" data-act="guideHere" title="So geht’s hier" aria-label="So geht’s hier: kurze Anleitung für diese Seite">${ico('help')}</button>`;
injectWozu = function(){
  const t = view.tab; const ph = $('#app .page-h'); if(!ph) return;
  const h1 = ph.querySelector('h1'); if(!h1) return;
  if(TOURS[guideCtx()] && !h1.querySelector('.wozu-q')) h1.insertAdjacentHTML('beforeend', GD_Q());
  const txt = WOZU[t]; if(txt && !view.card && !h1.parentNode.querySelector('.sub')) h1.insertAdjacentHTML('afterend', `<p class="sub">${esc(txt)}</p>`);
};
Object.assign(WOZU, {aufbau:'Kleine Aufgaben führen Sie durch die App. Für jede erledigte gibt es einen Stempel.', setup:'Betrieb, Team, Sicherung und Hilfe.'});

/* =====================================================================
   Hilfe-Modus „Was ist das?“ und die Erklär-Blase
   ===================================================================== */
let HELP_ON = false; let BUB = null;
const HELP_PASS = '[data-tab],[data-act="goTab"],[data-act="goMenu"],[data-act="goStock"],[data-act="goBuyTab"],[data-act="goReportTab"],[data-act="mtab"],[data-act="stab"],[data-act="rpTab"],[data-act="ctype"],[data-act="sec"],[data-act="pFilter"],[data-act="loc"],[data-act="ofilter"],[data-act="backCards"],[data-act="ordBack"],[data-act="openCard"],[data-act="ordOpen"],[data-act="theme"],[data-act="msTier"],[data-act="rpUnit"],[data-act="rpStep"],[data-act="rpToday"]';
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
  on = !!on; if(on === HELP_ON) return; if(on && GD.t) tourEnd(true, false);
  HELP_ON = on; document.body.classList.toggle('gd-help', on); bubHide();
  if(S && !canEditAll()){ try { render(); } catch(e){} }
  document.querySelectorAll('[data-act="helpMode"]').forEach(b => b.setAttribute('aria-pressed', on ? 'true' : 'false'));
  let bar = document.getElementById('gdHelpBar');
  if(on){
    helpApply();
    if(!bar){ bar = document.createElement('div'); bar.id = 'gdHelpBar'; bar.className = 'gd-helpbar'; bar.setAttribute('role', 'status');
      bar.innerHTML = `${ico('help')}<span><b>Was ist das?</b> Tippen Sie auf etwas, das Sie nicht kennen.</span><button type="button" class="btn sm" data-act="helpMode">Hilfe aus</button>`; document.body.appendChild(bar); }
    if(!GP.helpSeen){ GP.helpSeen = 1; gpSave(); }
  } else if(bar) bar.remove();
}
function bubShow(el, h, opt){
  opt = opt || {}; bubHide();
  const n = document.createElement('div'); n.className = 'gd-bub'; n.setAttribute('role', 'status'); n.setAttribute('aria-live', 'polite');
  n.innerHTML = `<b>${esc(h.t)}</b><p>${esc(h.x)}</p>${opt.note ? `<small>${esc(opt.note)}</small>` : ''}${h.g && view.tab !== 'begriffe' ? `<button type="button" class="gd-bub-l" data-act="goTab" data-id="begriffe">Alle Begriffe</button>` : ''}`;
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
  if(GD_LP.block){ GD_LP.block = false; if(t.closest('.nav-i')){ e.preventDefault(); e.stopImmediatePropagation(); return; } }
  if(!HELP_ON){ if(BUB && !t.closest('.gd-bub') && !t.closest('.stamp')) bubHide(); return; }
  if(t.closest('.gd-helpbar, [data-act="helpMode"], #gd, dialog, #pal')) return;
  if(t.closest('.gd-bub')){ if(t.closest('[data-act="goTab"]')) bubHide(); return; }
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

/* Lange drücken auf einen Bereich (Handy): ein Satz, wozu er da ist */
const GD_LP = {t:0, block:false};
document.addEventListener('pointerdown', e => {
  const b = e.target.closest && e.target.closest('.nav-i'); clearTimeout(GD_LP.t); if(!b || e.pointerType === 'mouse' || GD.t) return;
  GD_LP.t = setTimeout(() => { const h = HELP['nav_' + b.dataset.tab]; if(!h) return; GD_LP.block = true; bubShow(b, h, {ms:4200}); try { navigator.vibrate && navigator.vibrate(8); } catch(x){} }, 520);
}, true);
['pointerup','pointercancel','pointermove'].forEach(ev => document.addEventListener(ev, e => { if(ev !== 'pointermove' || Math.abs(e.movementX) + Math.abs(e.movementY) > 6) clearTimeout(GD_LP.t); }, true));
document.addEventListener('contextmenu', e => { if(GD_LP.block && e.target.closest && e.target.closest('.nav-i')) e.preventDefault(); });

/* =====================================================================
   Einfach-Modus
   ===================================================================== */
function setMode(m, quiet){
  GP.mode = m === 'simple' ? 'simple' : 'full'; GP.asked = 1; gpSave();
  document.body.classList.toggle('simple', isSimple());
  if(!quiet){ render(); toast(isSimple() ? 'Einfach: nur das Wichtigste' : 'Alles zeigen: alle Spalten und Werkzeuge'); }
}
const _vmodeGd = vmode;
vmode = function(k){ return isSimple() ? (k === 'teller' ? 'teller' : 'list') : _vmodeGd(k); };
const SIMPLE_ADV_H2 = ['Cloud & Team', 'Wer arbeitet gerade?', 'Startanimation'];
const SIMPLE_ADV_TH = ['Putzverlust', 'Garverlust', 'Saison'];
/* genaue Beschriftung → einfaches Wort */
const SIMPLE_TXT = {
  'WE':'Kostet mich', 'WE %':'Anteil am Preis', 'WE gesamt':'Zutaten gesamt', 'Rohertrag':'Bleibt übrig', 'Rohertrag exkl. MwSt.':'Bleibt übrig, ohne Steuer', 'Größter Rohertrag':'Bringt am meisten',
  'Ø Wareneinsatz':'Zutaten vom Preis, im Schnitt', 'Wareneinsatz pro Portion':'Was kostet mich das Gericht?', 'Wareneinsatz je Gericht':'Was kosten die Zutaten vom Preis?', 'Wareneinsatz gesamt':'Zutaten kosten zusammen',
  'Preis, Wareneinsatz und Allergene je Gericht. Preis direkt in der Zeile ändern, Klick öffnet die Rezeptur.':'Jedes Gericht mit Preis. Daneben steht, was die Zutaten kosten. Den Preis ändern Sie direkt in der Zeile.',
  'Zutaten, Mengen, Zubereitung je Gericht. Daraus kommen Wareneinsatz und Allergene.':'Was in ein Gericht kommt und was es kostet. Ein Tipp auf eine Zeile öffnet das Rezept.',
  'Einkaufspreis je Einheit, netto. Richtwerte sind Beispielpreise, bis Sie sie bestätigen.':'Was Sie dem Lieferanten zahlen, ohne Steuer. Beispielpreise gelten, bis Sie Ihren Preis eintragen.',
  'Kalkuliert':'Durchgerechnet', 'Richtwert':'Beispielpreis', 'Richtwerte':'Beispielpreise', 'Richtwert stimmt':'Beispielpreis stimmt', 'Angezeigte Richtwerte bestätigen':'Alle gezeigten Preise bestätigen', 'Kostenstruktur':'Was kostet am meisten?', 'Umsatz netto':'Einnahmen', 'Umsatz brutto':'Mit Steuer',
  'Mindest':'Soll da sein', 'Δ Menge':'± Menge', 'Über Ziel':'Zu teuer', 'Kalkulation':'Preise & Kosten', 'Preis-Simulator':'Preis ausprobieren', 'Produktionsmenge':'Für viele Portionen',
};
const SIMPLE_TXT_NARROW = {'WE':'Kostet', 'WE %':'Anteil', 'Rohertrag':'Bleibt', 'Umsatz netto':'Einnahmen', 'Richtwert':'Beispiel'}; // schmale Tabellen am Handy
function gdSimpleApply(){
  const app = $('#app'); if(!app) return;
  // Fortgeschrittenes ausblenden (bleibt über „Alles zeigen“ erreichbar)
  app.querySelectorAll('[data-act="tellerMode"]').forEach(b => { const s = b.closest('.seg'); if(s) s.classList.add('adv'); });
  app.querySelectorAll('.teller-sw, [data-act="rpCsv"], [data-act="plImport"], [data-act="addLine"], .rp-cmpnote, [data-act="secSort"], [data-act="dupCard"], [data-act="gdReset"]').forEach(n => n.classList.add('adv'));
  app.querySelectorAll('[data-act="rpCmp"]').forEach(b => { const s = b.closest('.seg'); if(s){ s.classList.add('adv'); const lab = s.previousElementSibling; if(lab && lab.textContent.trim().length < 20 && !lab.querySelector('button')) lab.classList.add('adv'); const box = s.parentElement; if(box && box.children.length <= 2 && !box.classList.contains('panel')) box.classList.add('adv'); } });
  app.querySelectorAll('.panel-h h2').forEach(h => { if(SIMPLE_ADV_H2.includes(h.textContent.trim())){ const p = h.closest('.panel'); if(p) p.classList.add('adv'); } });
  app.querySelectorAll('table').forEach(tb => { const ths = [...tb.querySelectorAll('thead th')]; ths.forEach((th, i) => { if(!SIMPLE_ADV_TH.includes(th.textContent.trim())) return; th.classList.add('adv'); tb.querySelectorAll('tbody tr').forEach(tr => { if(tr.children.length === ths.length) tr.children[i].classList.add('adv'); }); }); });
  app.querySelectorAll('.kv > span').forEach(r => { if(r.textContent.trim() === 'Aufschlagsfaktor'){ r.classList.add('adv'); if(r.nextElementSibling) r.nextElementSibling.classList.add('adv'); } });
  // einfache Wörter
  const w = document.createTreeWalker(app, NodeFilter.SHOW_TEXT, {acceptNode: n => { const p = n.parentElement; if(!p || p.closest('textarea,script,style,.guest-prev,.hs-stage,#print,.gd-keep,tbody .lt-n,.bg-list')) return NodeFilter.FILTER_REJECT; return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP; }});
  const todo = []; let n; while((n = w.nextNode())) todo.push(n);
  const narrow = window.innerWidth <= 900;
  todo.forEach(n => { const v = n.nodeValue, tr = v.trim(); let to = (narrow && SIMPLE_TXT_NARROW[tr]) || SIMPLE_TXT[tr];
    if(!to){ const p = n.parentElement;
      if(tr === 'Wareneinsatz') to = p.closest('.t-l') ? 'Zutaten gekostet' : p.closest('.kv, .kv-inline, .teller-f') ? 'Zutaten kosten' : 'vom Preis';
      else if(/\d\s?% WE$/.test(tr)) to = tr.replace(/ WE$/, ' vom Preis');
      else if(/^Für \d+[\d,]* % Wareneinsatz:?$/.test(tr)) to = tr.replace(/^Für (\S+) % Wareneinsatz:?$/, 'Damit die Zutaten nur $1 % kosten:');
      else if(/^inkl\. \d+[\d,]* % MwSt\.$/.test(tr)) to = tr.replace('inkl.', 'mit').replace('MwSt.', 'Steuer'); }
    if(to) n.nodeValue = v.replace(tr, to); });
}
document.addEventListener('input', () => { if(isSimple()) requestAnimationFrame(gdSimpleApply); });

/* =====================================================================
   Navigation: klare Namen, ein Satz je Bereich, „Sie sind hier“
   ===================================================================== */
NAV_GROUPS.forEach(g => { if(NAV_GROUP_NAMES[g[0]]) g[0] = NAV_GROUP_NAMES[g[0]]; });
navHtml = function(short){
  const item = k => { const t = TABS.find(x => x[0] === k); return `<button type="button" class="nav-i" data-tab="${k}" title="${esc(NAV_DESC[k] || '')}">${ico(k)}<span>${short ? t[2] : t[1]}</span></button>`; };
  if(short) return ['aufbau','dash','menu','cards','stock','buy','setup'].map(item).join('');
  return NAV_GROUPS.map(([g,ks]) => (g ? `<div class="nav-group">${g}</div>` : '<div class="nav-group" aria-hidden="true"></div>') + ks.map(item).join('')).join('');
};
TABS.push(['begriffe','Begriffe','Begriffe'], ['stempel','Stempelkarte','Stempel']);
const NAV_PARENT = {begriffe:'setup', stempel:'aufbau', pcheck:'aufbau'};
function gdNavApply(){
  const t = view.tab; const par = NAV_PARENT[t];
  if(par) document.querySelectorAll(`.nav-i[data-tab="${par}"]`).forEach(b => b.classList.add('on'));
  const bot = document.querySelector('.bottom'); if(bot && !bot.querySelector(`.nav-i[data-tab="${par || t}"]`)){ const m = bot.querySelector('.nav-i[data-tab="setup"]'); if(m) m.classList.add('on'); }
  document.querySelectorAll('.nav-i').forEach(b => { if(b.classList.contains('on')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const tab = TABS.find(x => x[0] === t); const c = t === 'cards' && view.card ? C(view.card) : null;
  try { document.title = (c ? c.name + ' · ' : '') + (tab ? tab[1] : 'Küche') + ' · DAHUAM.202'; } catch(e){}
}
function gdCrumb(){
  const b = $('#app .back'); if(!b || b.closest('.crumb')) return;
  let here = '';
  if(view.tab === 'cards' && view.card && C(view.card)) here = C(view.card).name;
  else if(view.order && ORD(view.order)){ const o = ORD(view.order); here = (view.recv ? 'Wareneingang · ' : 'Bestellung ') + o.no; }
  else if(view.tab === 'stempel') here = 'Stempelkarte';
  const nav = document.createElement('nav'); nav.className = 'crumb'; nav.setAttribute('aria-label', 'Sie sind hier');
  b.parentNode.insertBefore(nav, b); nav.appendChild(b);
  nav.insertAdjacentHTML('beforeend', (here ? `<span class="crumb-sep" aria-hidden="true">/</span><span class="crumb-here" aria-current="page">${esc(here)}</span>` : '') + (TOURS[guideCtx()] && !$('#app .page-h .wozu-q') ? `<span class="sp"></span><button type="button" class="crumb-q" data-act="guideHere" aria-label="So geht’s hier: kurze Anleitung für diese Seite">${ico('help')}<span>So geht’s hier</span></button>` : ''));
}

/* Rahmen: Einträge unten in der Seitenleiste und oben am Handy */
(function gdShell(){
  const foot = document.querySelector('.side .side-foot');
  if(foot && !document.querySelector('.side-help')) foot.insertAdjacentHTML('beforebegin', `<div class="side-help"><button type="button" class="sh-i" data-act="tourMain">${GD_MARK}<span>Rundgang</span></button><button type="button" class="sh-i" data-act="helpMode" aria-pressed="false">${ico('help')}<span>Was ist das?</span><i class="sh-sw" aria-hidden="true"></i></button></div>`);
  const th = document.querySelector('.topbar [data-act="theme"]');
  if(th && !document.querySelector('.topbar [data-act="helpMode"]')) th.insertAdjacentHTML('beforebegin', `<button type="button" class="theme-btn" data-act="helpMode" aria-pressed="false" aria-label="Hilfe: Was ist das?">${ico('help')}</button>`);
  document.body.classList.toggle('simple', isSimple());
})();

/* Schnellsuche: ein Satz je Bereich, Hilfe und Begriffe */
const _palDataGd = palData;
palData = function(){
  const a = _palDataGd();
  a.forEach(x => { if(x.g === 'Bereich' && !x.s){ const t = TABS.find(t => t[1] === x.n); if(t && NAV_DESC[t[0]]) x.s = NAV_DESC[t[0]]; } });
  a.push({g:'Aktion', n:'Rundgang starten', s:'Alle Bereiche in zwei Minuten', run:() => tourStart('main')},
    {g:'Aktion', n:'So geht’s hier', s:'Kurze Anleitung für diese Seite', run:() => guideHere()},
    {g:'Aktion', n:'Was ist das? Hilfe-Modus', s:'Erklärt alles, worauf Sie tippen', run:() => helpSet(!HELP_ON)},
    {g:'Aktion', n:isSimple() ? 'Alles zeigen' : 'Einfach-Modus', s:isSimple() ? 'Alle Spalten und Werkzeuge einblenden' : 'Nur das Wichtigste, große Knöpfe', run:() => setMode(isSimple() ? 'full' : 'simple')});
  Object.values(HELP).filter(h => h.g).forEach(h => a.push({g:'Begriff', n:h.t, s:h.x, run:() => { view.bq = ''; view.bgo = h.k; go('begriffe'); }}));
  return a;
};

/* =====================================================================
   Erster Start: Frage nach der Ansicht, dann Angebot Rundgang
   ===================================================================== */
const GD_PIC_SIMPLE = '<svg viewBox="0 0 96 56" aria-hidden="true"><rect x="6" y="7" width="60" height="11" rx="3"/><rect x="6" y="23" width="60" height="11" rx="3"/><rect x="6" y="39" width="60" height="11" rx="3"/><rect class="g" x="72" y="7" width="18" height="11" rx="3"/><rect class="g" x="72" y="23" width="18" height="11" rx="3"/><rect class="g" x="72" y="39" width="18" height="11" rx="3"/></svg>';
const GD_PIC_FULL = '<svg viewBox="0 0 96 56" aria-hidden="true"><path d="M6 9h84M6 17h84M6 25h84M6 33h84M6 41h84M6 49h84"/><path class="g" d="M34 5v48M52 5v48M66 5v48M80 5v48"/></svg>';
function gdWelcome(){
  if(document.querySelector('.gd-wel')) return;
  const d = document.createElement('dialog'); d.className = 'gd-wel'; d.setAttribute('aria-labelledby', 'gwT');
  const one = () => { d.innerHTML = `<div class="gw-in">${GD_MARK}<h2 id="gwT" tabindex="-1" autofocus>Willkommen in Ihrer Küche</h2><p class="gw-q">Wie möchten Sie starten?</p>
      <div class="gw-opts"><button type="button" class="gw-o" data-gw="simple">${GD_PIC_SIMPLE}<b>Einfach</b><span>Nur das Wichtigste. Große Knöpfe, einfache Wörter.</span></button><button type="button" class="gw-o" data-gw="full">${GD_PIC_FULL}<b>Alles zeigen</b><span>Alle Spalten, Ansichten und Werkzeuge.</span></button></div>
      <div class="gw-f"><span>Das lässt sich jederzeit in den Einstellungen umstellen.</span><button type="button" class="gd-skip" data-gw="skip">Überspringen</button></div></div>`; };
  const two = () => { d.innerHTML = `<div class="gw-in">${GD_MARK}<h2 id="gwT">Kurzer Rundgang?</h2><p class="gw-q">In zwei Minuten sehen Sie, wo was ist. Den Rundgang finden Sie später auch ${window.innerWidth > 900 ? 'links unten' : 'unter „Mehr“'}.</p>
      <div class="gw-f2"><button type="button" class="btn" data-gw="later">Später</button><button type="button" class="btn primary" data-gw="tour">Rundgang starten</button></div></div>`; setTimeout(() => d.querySelector('[data-gw="tour"]')?.focus(), 30); };
  one(); document.body.appendChild(d);
  const done = () => { GP.asked = 1; gpSave(); if(d.open) d.close(); d.remove(); };
  d.addEventListener('click', e => { const b = e.target.closest('[data-gw]'); if(!b) return; const a = b.dataset.gw;
    if(a === 'simple' || a === 'full'){ setMode(a, true); render(); two(); }
    else if(a === 'tour'){ done(); tourStart('main'); }
    else done(); });
  d.addEventListener('cancel', () => { setTimeout(done, 0); });
  try { d.showModal(); } catch(e){ d.remove(); }
}
function gdFirstRun(){
  if(G_NOINTRO || !S) return;
  const start = () => {
    if(GD.t || document.querySelector('dialog[open]')) return;
    if(G_FRESH && !GP.asked) gdWelcome();
    else if(!GP.asked && !GP.hinted){ GP.hinted = 1; gpSave(); toast('Neu: Rundgang und Hilfe für jede Seite.', {label:'Rundgang', action:() => tourStart('main'), ms:9000}); }
  };
  const wait = () => { if(document.getElementById('intro')){ setTimeout(wait, 200); return; } setTimeout(start, 500); };
  wait();
}

/* =====================================================================
   Koppeln: Zeichnen, Speichern, Klicks
   ===================================================================== */
function gdAfterRender(){
  gdCrumb(); gdNavApply(); helpApply();
  if(isSimple()) gdSimpleApply();
  if(view.tab === 'begriffe') bgAfter();
}
let gdFirst = true;
const _renderGd = render;
render = function(){
  let stash = null;
  if(isSimple()){ stash = {}; Object.keys(SORTS).forEach(k => { stash[k] = SORTS[k]; delete SORTS[k]; }); }
  try { _renderGd(); } finally { if(stash) Object.assign(SORTS, stash); }
  try { gdAfterRender(); if(gdTrack()) save(); } catch(e){ console.warn('Begleitung:', e); }
  if(gdFirst){ gdFirst = false; setTimeout(gdFirstRun, 0); }
  setTimeout(gdRewards, 700);
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id;
  switch(el.dataset.act){
    case 'tourMain': tourStart('main'); break;
    case 'helpMode': helpSet(!HELP_ON); break;
    case 'guideHere': guideHere(); break;
    case 'guideMode': if((id === 'simple') !== isSimple()) setMode(id); break;
    case 'missionGo': missionGo(id); break;
    case 'msTier': view.msOpen = Object.assign({}, view.msOpen, {[id]: !(el.getAttribute('aria-expanded') === 'true')}); render(); break;
    case 'stampInfo': { const m = MISSIONS.find(x => x.id === id); if(m){ const st = gdGame().stamps[m.id]; bubShow(el, {t:m.t, x: st ? `Erledigt am ${fmtDate(st + 'T12:00:00')}. ${m.wozu}` : m.wozu}, {ms:6000}); } break; }
    case 'gdReset': ask('Alle Stempel und den Stand der Aufgaben zurücksetzen? Ihre Daten bleiben, wie sie sind.', () => { const g = gdGame(); g.stamps = {}; g.acts = null; g.done = {}; g.init = false; g.minit = false; gdGame(); gameSilentDone(); GSNAP = null; }, 'Zurücksetzen'); break;
    case 'applySim': if(canEditAll()){ gdAct('sim'); } break;
  }
});
