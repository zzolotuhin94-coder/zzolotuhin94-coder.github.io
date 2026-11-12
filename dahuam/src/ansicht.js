/* =====================================================================
   Ansicht: Schriftgröße je Gerät, untere Leiste, Schnellsuche, Abdunkeln, Einstellungen.
   ===================================================================== */

/* ---------- Schriftgröße: Normal / Groß / Sehr groß, je Gerät gespeichert ---------- */
const FZ_KEY = 'dahuam202_fz';
const FZ_OPTS = [['1', 'Normal'], ['2', 'Groß'], ['3', 'Sehr groß']];
function fzGet(){ try { const v = localStorage.getItem(FZ_KEY); return FZ_OPTS.some(o => o[0] === v) ? v : '1'; } catch(e){ return '1'; } }
function fzApply(){ const v = fzGet(); if(v === '1') delete document.documentElement.dataset.fz; else document.documentElement.dataset.fz = v; }
function fzSet(v){ try { localStorage.setItem(FZ_KEY, v); } catch(e){} fzApply(); render(); }
fzApply();

/* ---------- Abdunkeln: über die ganze Breite, die Seite darunter springt nicht ---------- */
function ovSync(){
  const on = !$('#pal').hidden || !!document.querySelector('dialog[open]') || (document.getElementById('mehr') && !document.getElementById('mehr').hidden);
  const h = document.documentElement;
  if(on && !h.classList.contains('ov-on')){ const sb = Math.max(0, Math.min(30, Math.round(window.innerWidth - Math.min(h.clientWidth, document.body.getBoundingClientRect().width)))); h.style.setProperty('--sbw', sb + 'px'); h.classList.add('ov-on'); }
  else if(!on && h.classList.contains('ov-on')){ h.classList.remove('ov-on'); h.style.removeProperty('--sbw'); }
}
try { const mo = new MutationObserver(ovSync); mo.observe(document.body, {subtree:true, attributes:true, attributeFilter:['hidden', 'open'], childList:true}); } catch(e){}

/* ---------- Schnellsuche ----------
   Jedes Wort zählt für sich (zwei Wörter finden auch „Gästekarte PDF“), Umlaute egal,
   ein paar Wörter, wie man sie im Stress tippt (Gluten, Öl, Backup …), führen direkt zum Ziel.
   Jeder Treffer sagt, was er ist; derselbe Ort steht nur einmal da. */
const PAL_TYPE = {Bereich:'Seite', Aktion:'Aktion', Speisekarte:'Gericht', Rezeptur:'Rezeptur', Artikel:'Artikel', Bestellen:'Lieferant', Bestellung:'Bestellung', Begriff:'Hilfe', Allergen:'Service'};
const palFold = s => String(s || '').toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
/* Wort, wie man es tippt → Wörter, unter denen es in der App steht */
const PAL_SYN = {backup:'sicherung', sichern:'sicherung', datensicherung:'sicherung', export:'sicherung', drucken:'pdf', ausdrucken:'pdf', druck:'pdf',
  karte:'speisekarte', menu:'speisekarte', menue:'speisekarte', bestellen:'bestellung', lieferant:'bestellen', fritteuse:'frittierol', fritten:'frittierol', fett:'frittierol', ol:'frittierol', oel:'frittierol', frittieroel:'frittierol', olwechsel:'frittierol',
  glutenfrei:'gluten', laktosefrei:'milch', laktose:'milch', eifrei:'ei', vegan:'vegetarisch', prep:'vorbereitung', mise:'vorbereitung', putzen:'reinigungsplan', reinigung:'reinigungsplan',
  temperatur:'eigenkontrolle', haccp:'eigenkontrolle', kuhlung:'eigenkontrolle', dienst:'dienstplan', schicht:'dienstplan', inventar:'inventur', lager:'bestand', schrift:'anzeige', grosser:'anzeige', gross:'anzeige'};
const _palDataAns = palData;
palData = function(){
  const a = _palDataAns();
  const svc = (k, n) => () => { const v = svView(); v.f = k; v.q = ''; view.mtab = 'service'; go('menu'); };
  if(typeof ALG === 'object') Object.entries(ALG).forEach(([k, n]) => a.push({g:'Allergen', n:`Ohne ${n}`, s:`Service-Liste: was heute ohne ${n} geht`, k:`${n} ${n}frei allergen ohne`, run:svc(k, n)}));
  if(typeof ekS === 'function'){ const ek = ekS();
    if(ek.fryers.length){
      a.push({g:'Bereich', n:'Frittieröl', s:'Eigenkontrolle: Ölwechsel und Prüfung', k:'frittierol fritteuse ol', run:() => { view.ck = view.ck || {}; view.ck.tab = 'heute'; view.ck.run = null; view.ck.ek = 'oil'; go('checkl'); }});
      if(typeof dhOilNow === 'function') ek.fryers.forEach(f => a.push({g:'Aktion', n:'Öl gewechselt' + (ek.fryers.length > 1 ? ' · ' + f.name : ''), s:'Frittieröl: jetzt eintragen', k:'frittierol olwechsel', run:() => dhOilNow(f.id)}));
    }
    a.push({g:'Bereich', n:'Reinigungsplan', s:'Eigenkontrolle', k:'reinigungsplan putzen', run:() => { view.ck = view.ck || {}; view.ck.tab = 'heute'; view.ck.run = null; view.ck.ek = 'clean'; go('checkl'); }});
  }
  a.push({g:'Aktion', n:'Sicherung speichern', s:'Einstellungen: alle Daten als Datei', k:'backup sicherung', run:() => exportData()},
    {g:'Bereich', n:'Anzeige: Schriftgröße', s:'Einstellungen: Normal, Groß, Sehr groß', k:'anzeige schrift', run:() => { go('setup'); setTimeout(() => { const n = document.getElementById('setupAnzeige'); if(n) n.scrollIntoView({block:'start'}); }, 50); }});
  // Personen: Name → heutiger Dienst
  if(typeof tmS === 'function') tmS().people.forEach(pp => { const sh = tmShifts(todayStr()).filter(s => s.pid === pp.id);
    a.push({g:'Bereich', n:pp.name, s:sh.length ? `Heute im Dienst: ${TM_AREA[sh[0].area] || ''} ${tmPartsTxt(sh[0].parts, true)}` : 'Heute nicht eingeteilt', k:'dienstplan person', t:'Dienst', run:() => { const v = tmView(); v.w = tmMonday(todayStr()); v.day = todayStr(); v.mode = 'week'; go('dienst'); }}); });
  return a;
};
function palHay(x){ return palFold([x.n, x.s, x.g, PAL_TYPE[x.g] || '', x.k || ''].join(' ')); }
function palTokens(q){ return palFold(q).split(/[\s,.;:/+]+/).filter(Boolean); }
function palScore(x, toks){
  const hay = palHay(x), n = palFold(x.n); let score = 0;
  for(const t of toks){
    const alts = [t].concat(PAL_SYN[t] ? [PAL_SYN[t]] : []);
    let best = 9;
    for(const w of alts){
      if(n === w) best = Math.min(best, 0); else if(n.startsWith(w)) best = Math.min(best, 1);
      else if(n.split(/[\s\-–·|,./()„“"]+/).some(p => p.startsWith(w))) best = Math.min(best, 2);
      else if(w.length <= 2 && t !== 'ei' && n.split(/[\s\-–·|,./()„“"]+/).some(p => p.endsWith(w))) best = Math.min(best, 3);   // Rapsöl, Kürbiskernöl
      else if(w.length <= 2){ if(hay.split(/[\s\-–·|,./()„“":]+/).some(p => p.startsWith(w))) best = Math.min(best, 5); }   // kurze Wörter („Öl“, „Ei“) nur am Wortanfang
      else if(n.includes(w)) best = Math.min(best, 3); else if(hay.includes(w)) best = Math.min(best, w === t ? 5 : 4);
    }
    if(best === 9) return 99; score += best;
  }
  return score / toks.length + (x.g === 'Begriff' ? 1.5 : 0);   // Erklärungen nach den Orten und Aktionen
}
/* derselbe Ort nur einmal: ein Gericht mit Rezeptur führt zur Rezeptur, die steht dann nicht noch einmal da */
function palDedupe(list){
  const seen = new Set(); const out = [];
  const cardsOfMenu = new Set(S.menu.filter(m => m.card).map(m => m.card));
  for(const x of list){
    let key = x.g + '|' + palFold(x.n);
    if(x.g === 'Rezeptur'){ const c = S.cards.find(cc => cc.name === x.n); if(c && cardsOfMenu.has(c.id) && list.some(y => y.g === 'Speisekarte' && S.menu.some(m => m.card === c.id && dishLabel(m) === y.n))) continue; }
    if(x.g === 'Speisekarte'){ const m = S.menu.find(mm => dishLabel(mm) === x.n); if(m && m.card) key = 'card|' + m.card; }
    if(seen.has(key)) continue; seen.add(key); out.push(x);
  }
  return out;
}
palFilter = function(q){
  const all = palData(); const toks = palTokens(q);
  if(!toks.length) palItems = all.filter(x => x.g === 'Bereich' || x.g === 'Aktion').slice(0, 40);
  else palItems = palDedupe(all.map((x, i) => ({x, i, r:palScore(x, toks)})).filter(o => o.r < 99).sort((a, b) => a.r - b.r || a.i - b.i).map(o => o.x)).slice(0, 40);
  palSel = 0; palDraw();
};
palDraw = function(){
  $('#palList').innerHTML = palItems.length ? palItems.map((x, i) => `<li><button type="button" class="${i === palSel ? 'sel' : ''}" data-pal="${i}"><span class="pg pal-t">${esc(x.t || PAL_TYPE[x.g] || x.g)}</span><span class="pn">${esc(x.n)}</span><span class="ps">${esc(String(x.s || '').slice(0, 90))}</span></button></li>`).join('') : '<li class="empty">Nichts gefunden. Versuchen Sie ein anderes Wort, zum Beispiel „Gulasch“, „Butter“ oder „Sicherung“.</li>';
  $('#palList .sel')?.scrollIntoView({block:'nearest'});
};
/* Schließen-Knopf statt „Esc“ auf dem Handy */
(function(){ const lab = document.querySelector('#pal .pal-in'); if(lab && !lab.querySelector('.pal-x')) lab.insertAdjacentHTML('beforeend', '<button type="button" class="pal-x" data-act="palX">Schließen</button>'); })();
document.addEventListener('click', e => { if(e.target.closest && e.target.closest('[data-act="palX"]')){ e.preventDefault(); e.stopPropagation(); palClose(); } }, true);

/* ---------- Sicherung: ein Name („Sicherung speichern“), Fotos dabei, mit Größe ---------- */
function relSizeTxt(bytes){ return bytes >= 1048576 ? num(bytes / 1048576, 1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB'; }
exportData = function(){
  const nImg = Object.keys(IMG).length; const imgBytes = Object.values(IMG).reduce((a, v) => a + String(v || '').length, 0);
  const base = (() => { try { return JSON.stringify(S).length; } catch(e){ return 0; } })();
  openDialog('Sicherung speichern', `<p class="dlg-p">Die Sicherung ist eine Datei mit allen Daten dieser App. Aufheben, zum Beispiel auf einem USB-Stick oder in der Cloud. Zurückholen unter „Einstellungen“ mit „Sicherung laden“.</p>
    ${nImg ? `<div class="togs"><label class="tog"><input type="checkbox" id="expImg" checked><span></span>Fotos einschließen (${nImg} ${nImg === 1 ? 'Foto' : 'Fotos'}, etwa ${relSizeTxt(imgBytes)})</label></div>` : `<input type="checkbox" id="expImg" hidden checked>`}
    <p class="hint" id="expSize" style="margin-top:0">Datei etwa ${relSizeTxt(base + (nImg ? imgBytes : 0))}.</p>
    <div class="row-btns"><button type="button" class="btn primary" id="dlBtn">${ico('download')}Datei speichern</button><button type="button" class="btn" id="copyBtn">${ico('copy')}Als Text kopieren</button></div>
    <p class="hint" id="expMsg" role="status">${esc(backupName())}</p>`, null, {cancel:'Schließen'});
  const json = () => JSON.stringify({...S, schema:APP_SCHEMA, app:APP_VERSION + ' · ' + APP_BUILD, exportedAt:new Date().toISOString(), ...($('#expImg').checked ? {images:IMG} : {})});
  $('#expImg').onchange = () => { $('#expSize').textContent = `Datei etwa ${relSizeTxt(base + ($('#expImg').checked ? imgBytes : 0))}${$('#expImg').checked ? '' : ', ohne Fotos'}.`; };
  $('#dlBtn').onclick = async () => { const ok = await saveFile(backupName(), new Blob([json()], {type:'application/json'})); $('#expMsg').textContent = ok ? `Gespeichert als ${backupName()}` : 'Nicht gespeichert. „Als Text kopieren“ funktioniert immer.'; if(ok) toast('Sicherung gespeichert'); };
  $('#copyBtn').onclick = () => { const txt = json(); const fb = () => { let ta = $('#expTxt'); if(!ta){ ta = document.createElement('textarea'); ta.id = 'expTxt'; ta.className = 'code'; ta.readOnly = true; ta.setAttribute('aria-label', 'Sicherung als Text'); $('#expMsg').insertAdjacentElement('afterend', ta); } ta.value = txt; ta.select(); toast('Text markiert, mit Strg+C kopieren'); };
    try { navigator.clipboard.writeText(txt).then(() => toast('Sicherung als Text kopiert'), fb); } catch(e){ fb(); } };
};

/* ---------- Einstellungen: Sicherung oben, „Anzeige“ dazu, Selteneres unter „Weitere Einstellungen“ ---------- */
function ansPanel(){
  const fz = fzGet(); const th = document.documentElement.dataset.theme || '';
  return `<section class="panel" id="setupAnzeige"><div class="panel-h"><h2>Anzeige</h2><span class="muted sm">nur auf diesem Gerät</span></div>
    <div class="ans-row"><span>Schriftgröße</span>${seg('ansFz', fz, FZ_OPTS)}</div>
    <div class="ans-row"><span>Design</span>${seg('ansTheme', th || 'auto', [['auto', 'Wie das Gerät'], ['light', 'Hell'], ['dark', 'Dunkel']])}</div>
  </section>`;
}
const _renderSetupAns = renderSetup;
renderSetup = function(){
  const html = _renderSetupAns();
  try {
    const t = document.createElement('template'); t.innerHTML = html;
    const grid = t.content.querySelector('.setup-grid'); const bk = t.content.querySelector('#setupDaten');
    if(grid && bk){ grid.insertBefore(bk, grid.firstElementChild); bk.insertAdjacentHTML('afterend', ansPanel()); }
    t.content.querySelectorAll('[data-act="export"]').forEach(b => { b.textContent = 'Sicherung speichern'; });
    const rel = t.content.querySelector('#relPanel [data-rel="backup"]'); if(rel) rel.remove();
    const more = t.content.querySelector('details.setup-more > summary'); if(more) more.textContent = 'Weitere Einstellungen';
    // „Beispieldaten wiederherstellen“ ersetzt alles: nicht gleich neben „Sicherung speichern“, sondern bei den weiteren Einstellungen
    const dh = t.content.querySelector('#setupDemo'); const mg = t.content.querySelector('details.setup-more .setup-grid');
    if(dh && mg){ const sec = document.createElement('section'); sec.className = 'panel'; sec.id = 'setupDemoPanel'; sec.innerHTML = '<div class="panel-h"><h2>Beispieldaten</h2></div>';
      const parts = [dh.nextElementSibling, dh.nextElementSibling && dh.nextElementSibling.nextElementSibling].filter(Boolean); dh.remove(); parts.forEach(x => sec.appendChild(x)); mg.appendChild(sec); }
    return t.innerHTML;
  } catch(e){ console.warn('Einstellungen:', e); return html; }
};
/* relPanel zeichnet sich nach dem Laden neu: dort keinen zweiten Sicherungs-Knopf */
const _relPanelAns = relPanel;
relPanel = function(){ return _relPanelAns().replace(/<button type="button" class="btn sm" data-rel="backup">Sicherung speichern<\/button>/, ''); };
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-act]'); if(!el) return; const a = el.dataset.act, id = el.dataset.id;
  if(a === 'ansFz'){ fzSet(id); toast(`Schriftgröße: ${(FZ_OPTS.find(o => o[0] === id) || FZ_OPTS[0])[1]}`); }
  else if(a === 'ansTheme'){ if(id === 'auto'){ delete document.documentElement.dataset.theme; try { localStorage.removeItem(KEY + '_theme'); } catch(x){} themeIcon(); } else setTheme(id); render(); }
});
