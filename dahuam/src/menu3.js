/* =====================================================================
   Gästekarte im Stil der Website (dahuam202.at), nur logischer:
   Rahmen mit eingesetztem Titel, Reiter, zwei Spalten, punktierte Trennlinien,
   PT Sans / Saira Condensed wie auf der Website.
   ===================================================================== */
const WK_GROUPS = [
  ['flamm','Flammkuchen',['Flammkuchen']],
  ['start','Vorspeisen & Salate',['Suppen & Vorspeisen','Salate & Bowls']],
  ['teilen','Fondue & zum Teilen',['Zum Teilen']],
  ['haupt','Hauptspeisen',['Klassiker','Rösti','Burger, Pasta & Co.']],
  ['dessert','Desserts',['Süßes']],
  ['kinder','Kinderkarte',['Für Kinder']],
];
const WK_FILTERS = [['v','Vegetarisch'],['vg','Vegan'],['noA','Ohne Gluten'],['noG','Ohne Milch']];
const WK_QUOTE = '„DAHUAM202 ist da, wo man den Bauch nicht einziehen muss!“';
view.wk = {tab:'all', filters:[]};
function wkGroupsFor(items){
  const known = new Set(WK_GROUPS.flatMap(g=>g[2]));
  const extra = secList().filter(s => !known.has(s) && items.some(m=>m.section===s));
  const gs = WK_GROUPS.map(g => [...g]); if(extra.length) gs.splice(4, 0, ['mehr','Weitere',extra]);
  return gs.filter(g => g[2].some(s => items.some(m=>m.section===s)));
}
function wkPass(m){
  const f = view.wk.filters; if(!f.length) return true;
  const alg = itemAlg(m), known = hasAlg(m);
  if(f.includes('vg') && m.veg !== 'vg') return false;
  if(f.includes('v') && !(m.veg === 'v' || m.veg === 'vg')) return false;
  if(f.includes('noA') && (!known || alg.includes('A'))) return false;
  if(f.includes('noG') && (!known || alg.includes('G'))) return false;
  return true;
}
function wkPrice(p){ return '€ ' + fin(+p).toLocaleString('de-AT',{minimumFractionDigits:2, maximumFractionDigits:2}); }
function wkDish(e, used){
  const m = e.head, vars = e.vars, multi = vars.length > 1 || (m.group && m.vlabel);
  const ai = algOfVars(vars), alg = ai.letters; alg.forEach(a=>used.add(a)); if(ai.open) used.add(ALG_MARK);
  const veg = vars.every(v=>v.veg==='vg') ? 'vg' : vars.every(v=>v.veg==='v'||v.veg==='vg') ? 'v' : '';
  const desc = [m.desc, hkDays(m)].filter(Boolean).join(' · ');
  return `<article class="wk-dish ${vars.some(v=>v.top)?'sig':''}">
    <div class="wk-l1"><h4 class="wk-n">${esc(m.name)}${veg?`<i class="wk-veg" title="${veg==='vg'?'vegan':'vegetarisch'}">${veg==='vg'?'VG':'V'}</i>`:''}</h4>${multi?'':`<span class="wk-p">${+m.price?wkPrice(m.price):''}</span>`}</div>
    ${desc ? `<p class="wk-d">${esc(desc)}</p>` : ''}
    ${multi ? `<div class="wk-vars">${vars.map(v=>`<div class="wk-var"><span>${esc(v.vlabel||v.name)}</span><span class="wk-p">${wkPrice(v.price)}</span></div>`).join('')}</div>` : ''}
    ${alg.length || ai.open ? `<div class="wk-a" title="${esc(alg.map(a=>ALG[a]).join(', ') + (ai.open ? (alg.length ? ' · ' : '') + 'Angabe unvollständig' : ''))}">Allergene ${alg.concat(ai.open ? [ALG_MARK] : []).join(' ')}</div>` : ''}
    ${vars.some(v=>v.top) ? '<div class="wk-sig">Empfehlung des Hauses</div>' : ''}
  </article>`;
}
function wkSpecial(sp, used){
  const d1 = dParse(sp.from), d2 = dParse(sp.to||sp.from);
  const f = d => d.toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'});
  const items = sp.items.map(it => ({...it, id:'', top:false, group:'', days:[]}));
  return `<section class="wk-special"><div class="wk-sp-h"><span class="wk-sp-k">Nur für kurze Zeit</span><h3>${esc(sp.name)}</h3><span class="wk-sp-date">${sp.to && sp.to!==sp.from ? `${f(d1)} bis ${f(d2)}` : f(d1)}</span>${sp.note?`<p>${esc(sp.note)}</p>`:''}</div>
    <div class="wk-cols">${hkEntries(items).map(e=>wkDish(e, used)).join('')}</div></section>`;
}
function guestHtmlWeb(seasonKey, dateStr, opts={}){
  dateStr = dateStr || todayStr(); const k = seasonKey || seasonFor(dateStr) || 'winter'; const s = S.settings.seasons[k];
  const all = guestItems(k, dateStr); const items = all.filter(wkPass);
  const groups = wkGroupsFor(all); const used = new Set();
  const tab = opts.print ? 'all' : (groups.some(g=>g[0]===view.wk.tab) ? view.wk.tab : 'all');
  const inserts = specialsFor(dateStr).filter(sp => sp.mode !== 'tageskarte');
  const nav = opts.print ? '' : `<nav class="wk-tabs" aria-label="Kategorien">${[['all','Alles'], ...groups.map(g=>[g[0],g[1]])].map(([gk,gl])=>`<button type="button" class="${tab===gk?'on':''}" data-act="wkTab" data-id="${gk}">${esc(gl)}</button>`).join('')}</nav>
    <div class="wk-filters">${WK_FILTERS.map(([fk,fl])=>`<button type="button" class="${view.wk.filters.includes(fk)?'on':''}" data-act="wkFilter" data-id="${fk}" aria-pressed="${view.wk.filters.includes(fk)}">${fl}</button>`).join('')}${view.wk.filters.length?`<span class="wk-fcount">${items.length} von ${all.length} Gerichten</span>`:''}</div>`;
  let body = (tab === 'all' || opts.print) ? inserts.map(sp => wkSpecial(sp, used)).join('') : '';
  for(const [gk, gl, secs] of groups){
    if(tab !== 'all' && tab !== gk) continue;
    const parts = secs.map(sec => { const list = items.filter(m=>m.section===sec); return list.length ? `<section class="wk-sec">${secs.length > 1 || tab === 'all' ? `<h3 class="wk-h">${esc(sec === 'Zum Teilen' && gk==='teilen' ? 'Fondue & zum Teilen' : sec)}</h3>` : ''}<div class="wk-cols">${hkEntries(list).map(e=>wkDish(e, used)).join('')}</div></section>` : ''; }).join('');
    if(parts) body += parts;
  }
  if(!body) body = '<p class="wk-empty">Keine Gerichte für diese Auswahl.</p>';
  const legend = ([...used].some(a=>ALG[a]) ? `<div class="wk-leg">${[...used].filter(a=>ALG[a]).sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : '') + (used.has(ALG_MARK) ? `<p class="wk-open">${esc(algOpenText())}</p>` : '');
  const cover = s.cover && IMG[s.cover] ? `<figure class="wk-cover"><img src="${IMG[s.cover]}" alt=""></figure>` : '';
  return `<div class="wk-paper" style="--wk-a:${esc(s.accent || HK_ACCENT[k])}">${cover}
    <div class="wk-frame">
      <h2 class="wk-title"><span>Speisen &amp; Getränke</span></h2>
      <p class="wk-season">${esc(s.title)} ${seasonYear(k, dateStr)} · ${esc(s.subtitle || HK_PLACE)}</p>
      <p class="wk-quote">${WK_QUOTE}</p>
      ${nav}
      <div class="wk-body">${body}</div>
      <footer class="wk-foot"><div class="wk-keys"><span><i class="wk-veg">V</i> vegetarisch</span><span><i class="wk-veg">VG</i> vegan</span><span><i class="wk-sigk"></i> Empfehlung des Hauses</span></div>${legend}<p>${esc(s.footer || 'Alle Preise in Euro inkl. MwSt.')} · Stand ${fmtDate(new Date().toISOString())}</p></footer>
    </div></div>`;
}
/* Stil „Schlicht“ ist die Grundlage; die Hauskarte (hauskarte.js) setzt sich davor */
function guestHtml(k, d, opts){ return guestHtmlWeb(k, d, opts); }
function printMenu(){ const k = curSeasonKey(); $('#print').innerHTML = guestHtmlWeb(k, view.gdate || todayStr(), {print:true}); document.body.classList.add('print-menu'); window.print(); }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id;
  if(el.dataset.act === 'wkTab'){ view.wk.tab = id; refreshGuest(); }
  if(el.dataset.act === 'wkFilter'){ const f = view.wk.filters; const i = f.indexOf(id); if(i >= 0) f.splice(i,1); else { f.push(id); if(id==='vg'){ const j = f.indexOf('v'); if(j>=0) f.splice(j,1); } if(id==='v'){ const j = f.indexOf('vg'); if(j>=0) f.splice(j,1); } } refreshGuest(); }
});
