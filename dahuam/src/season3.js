/* ---------- Speisekarte: Reiter inkl. Saison & Aktionen ---------- */
renderMenu = function(){
  const hidden = S.menu.filter(m=>m.hidden).length;
  const live = S.specials.filter(sp => spStatus(sp)[0]==='live').length;
  const head = `<div class="page-h"><div><div class="eyebrow">${S.menu.length} Gerichte · ${secList().length} Kategorien${hidden?` · ${hidden} ausgeblendet`:''}</div><h1>Speisekarte</h1></div>
    <div class="row-btns">${view.mtab==='guest' && !FRAMED ? `<button type="button" class="btn" data-act="printMenu">${ico('print')}Drucken</button>` : ''}${view.mtab==='plan' ? `<button type="button" class="btn primary" data-act="newSpecial">${ico('plus')}Aktion</button>` : `<button type="button" class="btn primary" data-act="newMenu">${ico('plus')}Gericht</button>`}</div></div>
  <div class="toolbar">${seg('mtab', view.mtab, [['calc','Kalkulation'],['guest','Gestalten & PDF'],['plan','Saison & Aktionen', live?'live':null],['layout','Aufbau & Reihenfolge']])}</div>`;
  return head + (view.mtab==='guest' ? renderGuest() : view.mtab==='layout' ? renderLayout() : view.mtab==='plan' ? renderPlan() : renderMenuCalc());
};
printMenu = function(){ $('#print').innerHTML = guestPrevHtml().replace(/<div class="g-closed">.*?<\/div>/,''); document.body.classList.add('print-menu'); window.print(); };

function parseMD(v){ const m = String(v).trim().match(/^(\d{1,2})\.(\d{1,2})\.?$/); if(!m) return null; const d = +m[1], mo = +m[2]; if(mo<1||mo>12||d<1||d>31) return null; return `${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function refreshGuest(){ const p = $('.guest-prev'); if(p) p.innerHTML = guestPrevHtml(); }

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  const id = el.dataset.id, s = S.settings.seasons[curSeasonKey()];
  switch(el.dataset.act){
    case 'importPick': $('#importFile').click(); break;
    case 'gdate': view.gdate = id; view.gseason = null; render(); break;
    case 'gseason': view.gseason = id || null; render(); break;
    case 'glayout': s.layout = id; save(); render(); break;
    case 'gorn': s.orn = id; save(); render(); break;
    case 'palPreset': s.pal = {...THEMES[id].pal}; save(); render(); toast(`Farben „${THEMES[id].theme}“ übernommen`); break;
    case 'gcover': pickImage(data => { if(s.cover) imgDel(s.cover); const iid = uid('img'); imgPut(iid, data); s.cover = iid; save(); render(); toast('Titelbild gespeichert'); }); break;
    case 'gcoverDel': imgDel(s.cover); s.cover = ''; save(); render(); break;
    case 'gReset': ask(`Design der ${s.title} auf „${THEMES[id].theme}“ zurücksetzen? Zeitraum und Texte bleiben.`, () => { const d = seasonDefaults(id); Object.assign(s, {layout:d.layout, pal:d.pal, fd:d.fd, fb:d.fb, orn:d.orn}); }, 'Zurücksetzen'); break;
    case 'editSeason': view.mtab = 'guest'; view.gseason = id; go('menu'); break;
    case 'newSpecial': specialDialog(); break;
    case 'editSpecial': specialDialog(S.specials.find(x=>x.id===id)); break;
    case 'previewSpecial': { const sp = S.specials.find(x=>x.id===id); view.gdate = sp.from; view.gseason = null; view.mtab = 'guest'; go('menu'); break; }
    case 'dupSpecial': { const sp = S.specials.find(x=>x.id===id); const n = JSON.parse(JSON.stringify(sp)); n.id = uid('sp'); const sh = d => `${+d.slice(0,4)+1}${d.slice(4)}`; n.from = sh(sp.from); n.to = sh(sp.to||sp.from); S.specials.push(n); save(); render(); toast(`„${n.name}“ für ${n.from.slice(0,4)} angelegt. Datum bitte prüfen.`); break; }
    case 'printSpecial': { const sp = S.specials.find(x=>x.id===id); $('#print').innerHTML = tageskarteHtml(sp); document.body.classList.add('print-menu'); window.print(); break; }
  }
});
document.addEventListener('input', e => {
  const t = e.target; if(!t.closest('#app')) return;
  const s = S.settings.seasons[curSeasonKey()];
  if(t.dataset.st){ s[t.dataset.st] = t.value; save(); refreshGuest(); }
  if(t.dataset.pal){ s.pal[t.dataset.pal] = t.value; save(); refreshGuest(); }
});
document.addEventListener('change', e => {
  const t = e.target; if(!t.closest('#app')) return;
  const s = S.settings.seasons[curSeasonKey()];
  if(t.id === 'gdate' && t.value){ view.gdate = t.value; view.gseason = null; render(); return; }
  if(t.dataset.pal){ document.querySelectorAll('.sw-preset').forEach(b=>b.classList.remove('on')); return; }
  if(t.dataset.sv){ if(t.dataset.sv === 'fontpair'){ const [a,b] = t.value.split('|'); s.fd = a; s.fb = b; } else s[t.dataset.sv] = t.checked; save(); refreshGuest(); return; }
  if(t.dataset.smd){ const v = parseMD(t.value); if(!v){ t.value = mdLabel(s[t.dataset.smd]); toast('Datum als TT.MM. eingeben, z. B. 01.12.'); return; } s[t.dataset.smd] = v; save(); render(); toast(`${s.title}: ${mdLabel(s.from)} bis ${mdLabel(s.to)}`); return; }
  if(t.dataset.ms){ const [mid,k] = t.dataset.ms.split(':'); const m = S.menu.find(x=>x.id===mid); let set = new Set(m.seasons.length ? m.seasons : SEASONS.map(x=>x[0])); t.checked ? set.add(k) : set.delete(k); m.seasons = set.size === 4 ? [] : SEASONS.map(x=>x[0]).filter(x=>set.has(x)); save(); const st = t.closest('tr').querySelector('small'); if(st) st.textContent = m.section + (m.seasons.length ? '' : ' · ganzjährig'); if(!set.size) toast(`„${m.name}“ steht jetzt auf keiner Saisonkarte`); return; }
});
