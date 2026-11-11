/* =====================================================================
   Teller: Drag & Drop (Zutaten-Regal → Teller, Kacheln sortieren)
   Pointer Events, funktioniert mit Maus, Touch und Stift.
   ===================================================================== */
const GRIP_SVG = '<svg viewBox="0 0 10 16" aria-hidden="true"><g fill="currentColor"><circle cx="2.5" cy="3" r="1.3"/><circle cx="7.5" cy="3" r="1.3"/><circle cx="2.5" cy="8" r="1.3"/><circle cx="7.5" cy="8" r="1.3"/><circle cx="2.5" cy="13" r="1.3"/><circle cx="7.5" cy="13" r="1.3"/></g></svg>';

function shelfHtml(c){
  const used = new Set(c.items.map(i => i.ref));
  const q = (view.shelfQ || '').trim().toLowerCase();
  const cs = S.cards.filter(x => x.type === 'semi' && x.id !== c.id).sort(byName);
  const ps = [...S.products].sort(byName);
  const chip = (ref, name, sub, s, semi) => `<button type="button" class="sh-chip${semi?' semi':''}${used.has(ref)?' used':''}" data-shelf="${ref}" data-s="${esc(s)}" ${q && !s.includes(q) ? 'hidden' : ''} title="${esc(name)} auf den Teller ziehen oder antippen"><b>${esc(name)}</b><small>${sub}</small></button>`;
  const chips = cs.map(x => chip('c:'+x.id, x.name, 'Basisrezept', (x.name+' basisrezept').toLowerCase(), true)).join('')
    + ps.map(p => chip('p:'+p.id, p.name, `${eur(p.price)} / ${esc(p.unit)}${p.priceDemo?' · Richtwert':''}`, (p.name+' '+supName(p)).toLowerCase(), false)).join('');
  return `<div class="shelf" aria-label="Zutaten-Regal">
    <div class="shelf-h"><span class="shelf-t"><b>Zutaten-Regal</b><small>Auf den Teller ziehen oder antippen. Kacheln am Griff ${GRIP_SVG} ziehen, um sie zu sortieren.</small></span>
      <label class="search shelf-s">${ico('search')}<input id="shelfQ" type="search" placeholder="Zutat suchen" value="${esc(view.shelfQ||'')}" autocomplete="off" aria-label="Zutat im Regal suchen"></label></div>
    <div class="shelf-row">${chips}<span class="shelf-none" ${q && ![...cs.map(x=>(x.name+' basisrezept').toLowerCase()), ...ps.map(p=>(p.name+' '+supName(p)).toLowerCase())].some(s=>s.includes(q)) ? '' : 'hidden'}>Nichts gefunden.</span></div>
  </div>`;
}

const _tellerHtmlD = tellerHtml;
tellerHtml = function(c){
  let h = _tellerHtmlD(c); let n = 0, k = 0;
  h = h.replace(/<div class="ti" style=/g, () => `<div class="ti" data-ti="${n++}" style=`);
  h = h.replace(/<div class="ti-h">/g, () => `<div class="ti-h"><button type="button" class="ti-grip" data-grip="${k++}" title="Ziehen zum Sortieren (oder Alt + Pfeiltasten)" aria-label="Zutat verschieben">${GRIP_SVG}</button>`);
  return h.replace('<div class="teller-f">', shelfHtml(c) + '<div class="teller-f">');
};

function tellerAdd(c, ref, at){
  const r = refObj(ref); if(!r) return;
  // liegt die Zutat schon am Teller: nicht doppelt anlegen, sondern die Menge dort erhöhen lassen
  const dup = c.items.findIndex(x => x.ref === ref);
  if(dup >= 0 && !tellerAdd.force){
    const focusDup = () => { const q = document.getElementById('qty-'+dup); if(q){ q.scrollIntoView({block:'center', behavior:'smooth'}); q.focus({preventScroll:true}); q.select(); } };
    setTimeout(focusDup, 30);
    toast(`${r.o.name} liegt schon am Teller. Menge dort erhöhen?`, {label:'Trotzdem zweimal', ms:6000, action: () => { tellerAdd.force = true; try { tellerAdd(c, ref, at); } finally { tellerAdd.force = false; } }});
    return; }
  const it = {ref, qty: r.t === 'p' && r.o.unit === 'Stk' ? 1 : '', net:''};
  const empty = c.items.findIndex(x => !x.ref); let idx;
  if(at == null && empty >= 0){ c.items[empty] = it; idx = empty; }
  else { idx = at == null ? c.items.length : Math.max(0, Math.min(at, c.items.length)); c.items.splice(idx, 0, it); }
  save(); render(); toast(`${r.o.name} liegt am Teller`);
  setTimeout(() => { const q = document.getElementById('qty-'+idx); if(q){ q.focus({preventScroll:false}); q.select(); } }, 30);
}
function tellerMove(c, from, to){
  if(from === to || from < 0 || from >= c.items.length) return;
  const [it] = c.items.splice(from, 1); c.items.splice(Math.max(0, Math.min(to, c.items.length)), 0, it);
  save(); render();
  setTimeout(() => document.querySelector(`[data-grip="${Math.max(0, Math.min(to, c.items.length-1))}"]`)?.focus({preventScroll:true}), 20);
}

let DR = null;
function drClear(){ document.querySelectorAll('.drop-b,.drop-a,.drop-on').forEach(x => x.classList.remove('drop-b','drop-a','drop-on')); }
function drTarget(x, y){
  const el = document.elementFromPoint(x, y); if(!el) return null;
  const tile = el.closest('.tl-tiles .ti[data-ti]');
  const zone = el.closest('.teller');
  if(tile){ const r = tile.getBoundingClientRect(); const grid = tile.parentElement; const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    const before = cols > 1 ? x < r.left + r.width/2 : y < r.top + r.height/2; const i = +tile.dataset.ti; return {tile, zone, before, index: before ? i : i + 1}; }
  if(zone) return {zone, index: null};
  return null;
}
document.addEventListener('pointerdown', e => {
  if(e.button > 0 || DR) return;
  const g = e.target.closest('.ti-grip'), ch = e.target.closest('.sh-chip');
  if(!g && !ch) return;
  const src = g ? g.closest('.ti') : ch;
  DR = {kind: g ? 'move' : 'add', src, from: g ? +g.dataset.grip : null, ref: ch ? ch.dataset.shelf : null, x0: e.clientX, y0: e.clientY, started: false, ghost: null, t: null};
  if(g || e.pointerType === 'mouse') e.preventDefault();
});
document.addEventListener('pointermove', e => {
  if(!DR) return;
  const dx = e.clientX - DR.x0, dy = e.clientY - DR.y0;
  if(!DR.started){
    if(Math.hypot(dx, dy) < 7) return;
    if(DR.kind === 'add' && e.pointerType === 'touch' && Math.abs(dx) > Math.abs(dy)) { DR = null; return; } // waagrecht = Regal scrollen
    DR.started = true;
    const r = DR.src.getBoundingClientRect(); DR.ox = DR.x0 - r.left; DR.oy = DR.y0 - r.top;
    const gh = DR.src.cloneNode(true); gh.querySelectorAll('[id]').forEach(n => n.removeAttribute('id')); gh.removeAttribute('data-ti');
    gh.classList.add('drag-ghost'); gh.style.width = r.width + 'px'; document.body.appendChild(gh); DR.ghost = gh;
    DR.src.classList.add('drag-src'); document.body.classList.add('dragging');
    document.querySelector('.teller')?.classList.add('drop-ready');
  }
  e.preventDefault();
  DR.ghost.style.transform = `translate(${e.clientX - DR.ox}px, ${e.clientY - DR.oy}px) rotate(${DR.kind==='add'?-2:1.5}deg)`;
  drClear(); const t = drTarget(e.clientX, e.clientY); DR.t = t;
  if(t){ if(DR.kind === 'add') t.zone?.classList.add('drop-on'); if(t.tile && !(DR.kind === 'move' && +t.tile.dataset.ti === DR.from)) t.tile.classList.add(t.before ? 'drop-b' : 'drop-a'); }
  const edge = 70; if(e.clientY < edge) window.scrollBy(0, -14); else if(e.clientY > innerHeight - edge) window.scrollBy(0, 14);
}, {passive: false});
function drEnd(e, cancel){
  if(!DR) return; const d = DR; DR = null;
  if(!d.started) return;
  d.ghost.remove(); d.src.classList.remove('drag-src'); document.body.classList.remove('dragging'); document.querySelector('.teller')?.classList.remove('drop-ready'); drClear();
  const blk = ev => { ev.stopPropagation(); ev.preventDefault(); }; window.addEventListener('click', blk, true); setTimeout(() => window.removeEventListener('click', blk, true), 0);
  if(cancel) return;
  const c = C(view.card); if(!c) return; const t = drTarget(e.clientX, e.clientY);
  if(d.kind === 'add'){ if(t) tellerAdd(c, d.ref, t.index); else toast('Zum Hinzufügen auf den Teller ziehen'); }
  else if(t && t.index != null){ let to = t.index; if(d.from < to) to--; tellerMove(c, d.from, to); }
}
document.addEventListener('pointerup', e => drEnd(e, false));
document.addEventListener('pointercancel', e => drEnd(e, true));

document.addEventListener('click', e => {
  const ch = e.target.closest('.sh-chip'); if(!ch) return;
  const c = C(view.card); if(c) tellerAdd(c, ch.dataset.shelf, null);
});
document.addEventListener('keydown', e => {
  const g = e.target.closest && e.target.closest('.ti-grip'); if(!g) return;
  const c = C(view.card); if(!c) return; const i = +g.dataset.grip;
  const k = e.key; if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)) return;
  e.preventDefault(); tellerMove(c, i, k === 'ArrowUp' || k === 'ArrowLeft' ? i - 1 : i + 1);
});
document.addEventListener('input', e => {
  if(e.target.id !== 'shelfQ') return; view.shelfQ = e.target.value; const q = view.shelfQ.trim().toLowerCase(); let n = 0;
  document.querySelectorAll('.sh-chip').forEach(b => { const on = !q || b.dataset.s.includes(q); b.hidden = !on; if(on) n++; });
  const none = document.querySelector('.shelf-none'); if(none) none.hidden = n > 0;
});
