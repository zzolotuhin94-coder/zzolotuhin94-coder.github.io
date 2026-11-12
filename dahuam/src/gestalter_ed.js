/* =====================================================================
   Speisekarte-Gestalter – Bedienung.
   Die Blätter selbst sind die Vorschau. Antippen wählt einen Baustein, am Griff ziehen
   verschiebt ihn (Maus: direkt ziehen; Tastatur: Alt + Pfeiltasten). Vorlage und Effekte
   sind je ein Tipp. Am Handy: Blatt in voller Breite, Leiste unten.
   ===================================================================== */
view.gs = {sel:null, sheet:'', zoom:'one', undo:[], redo:[], tag:'', tagT:0, more:false};
const GS_I = {
  undo:'<path d="M9 7 4 12l5 5M4 12h10a6 6 0 0 1 0 12h-2" transform="translate(0,-3)"/>', redo:'<path d="M15 7l5 5-5 5M20 12H10a6 6 0 0 0 0 12h2" transform="translate(0,-3)"/>',
  up:'<path d="M12 19V5M6 11l6-6 6 6"/>', down:'<path d="M12 5v14M6 13l6 6 6-6"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>', pen:'<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
  look:'<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>', fx:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  add:'<path d="M12 5v14M5 12h14"/>', day:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
};
const gsIco = k => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GS_I[k]}</svg>`;
const GS_TYPES = {title:'Titel', head:'Überschrift', dish:'Gericht', text:'Text', orn:'Trenner', photo:'Foto', space:'Leerraum', break:'Seitenumbruch', aktion:'Aktionen', legend:'Allergene & Hinweise'};
const GS_ADD = [['head','Überschrift'],['text','Text'],['orn','Trenner'],['photo','Foto'],['space','Leerraum'],['break','Seitenumbruch']];
function gsNarrow(){ return window.innerWidth <= 900; }   // wie die App: bis 900 px Leiste unten statt Seitenleiste
function gsRo(){ return !canEditAll(); }
function gsBlock(id){ return gsDoc().blocks.find(b => b.id === (id || view.gs.sel)); }

/* ---------- Rückgängig ---------- */
function gsCommit(tag){
  const g = view.gs, now = Date.now();
  if(tag && tag === g.tag && now - g.tagT < 2500){ g.tagT = now; return; }
  g.undo.push(JSON.stringify(S.settings.karte)); if(g.undo.length > 60) g.undo.shift(); g.redo = []; g.tag = tag || ''; g.tagT = now;
}
function gsUndo(redo){
  const g = view.gs, from = redo ? g.redo : g.undo, to = redo ? g.undo : g.redo; if(!from.length) return;
  to.push(JSON.stringify(S.settings.karte)); S.settings.karte = JSON.parse(from.pop()); g.tag = ''; if(g.sel && !gsBlock()) g.sel = null;
  save(); gsRefresh(); toast(redo ? 'Wiederholt' : 'Rückgängig gemacht');
}
function gsChanged(){ GS.touched = false; save(); gsRefresh(); }

/* ---------- Blätter ---------- */
function gsSheetsHtml(){
  const fx = gsFx(gsDoc(), gsState().cur);
  if(!gsReadyNow(fx) && !GS.pend){ GS.pend = true; gsEnsure(fx).then(() => { GS.pend = false; if($('#gsCanvas')) gsRefresh(); }, () => { GS.pend = false; }); }
  const date = view.gdate || todayStr(); const wdn = new Date(date + 'T12:00:00').getDay();
  const closed = (S.settings.closed || []).includes(wdn) ? `<div class="g-closed">${ico('spark')}${DAYNAME[wdn]} ist Ruhetag. So sähe die Karte trotzdem aus.</div>` : '';
  const pages = gsPages(); GS.n = pages.length; queueMicrotask(gsFit);
  return closed + pages.map((p, i) => `<div class="gs-sheet"><span class="gs-no">${i + 1}</span>${p}</div>`).join('');
}
guestPrevHtml = gsSheetsHtml;
function gsFit(){
  const cv = $('#gsCanvas'); if(!cv) return;
  cv.querySelectorAll('.gs-sheet').forEach(sh => { if(sh.clientWidth) sh.style.setProperty('--gs-s', (sh.clientWidth / GS_W).toFixed(5)); });
  const ro = gsRo(), sel = view.gs.sel; let first = true;
  cv.querySelectorAll('.gs-b[data-b]').forEach(n => {
    const on = !ro && n.dataset.b === sel; n.classList.toggle('sel', on);
    if(ro) return; n.tabIndex = on || (!sel && first) ? 0 : -1; first = false; n.setAttribute('role', 'button');
    if(!n.hasAttribute('aria-label')){ const nm = n.querySelector('.gs-n,.gs-hn,.gs-tt,.gs-akn'); n.setAttribute('aria-label', GS_TYPES[n.dataset.k] + (nm ? ': ' + nm.textContent.trim() : '') + '. Alt und Pfeiltasten verschieben.'); }
  });
  const c = $('#gsCount'); if(c) c.textContent = `${GS.n} ${GS.n === 1 ? 'Blatt' : 'Blätter'} · A4`;
  const u = $('[data-gs="undo"]'), r = $('[data-gs="redo"]'); if(u) u.disabled = !view.gs.undo.length; if(r) r.disabled = !view.gs.redo.length;
  gsFloat();
}
/* kleine Leiste am gewählten Baustein: Griff, hinauf, hinunter, bearbeiten, weg */
function gsFloat(){
  const cv = $('#gsCanvas'); if(!cv) return; let f = $('#gsFloat'); const n = cv.querySelector('.gs-b.sel');
  if(!n){ if(f) f.remove(); return; }
  const b = gsBlock(); if(!b) return; const fixed = ['title','aktion','legend'].includes(b.t);
  if(!f){ f = document.createElement('div'); f.id = 'gsFloat'; f.className = 'gs-float'; }
  f.innerHTML = `<button type="button" class="gs-grip" title="Ziehen zum Verschieben" aria-label="Baustein ziehen">${GRIP_SVG}</button><button type="button" data-gs="up" title="Hinauf (Alt + Pfeil hinauf)" aria-label="Hinauf">${gsIco('up')}</button><button type="button" data-gs="down" title="Hinunter (Alt + Pfeil hinunter)" aria-label="Hinunter">${gsIco('down')}</button><button type="button" class="gs-fe" data-gs="edit" title="Bearbeiten" aria-label="Bearbeiten">${gsIco('pen')}</button>${fixed ? '' : `<button type="button" data-gs="del" title="${b.t === 'dish' ? 'Auf dieser Karte ausblenden' : 'Entfernen'}" aria-label="${b.t === 'dish' ? 'Auf dieser Karte ausblenden' : 'Entfernen'}">${gsIco('x')}</button>`}`;
  cv.appendChild(f);
  const r = n.getBoundingClientRect(), c = cv.getBoundingClientRect(); const w = f.offsetWidth, h = f.offsetHeight;
  let top = r.top - c.top - h - 6; if(top < 0) top = Math.min(r.bottom - c.top + 6, cv.clientHeight - h);
  f.style.top = Math.round(top) + 'px'; f.style.left = Math.round(Math.max(0, Math.min(r.right - c.left - w, cv.clientWidth - w))) + 'px';
}
function gsRefresh(keepPanel){
  const cv = $('#gsCanvas'); if(!cv) return; const ae = document.activeElement; const inRail = ae && ae.closest && ae.closest('#gsRail') && /INPUT|TEXTAREA/.test(ae.tagName);
  const hadFocus = ae && ae.closest && ae.closest('#gsCanvas .gs-b');
  cv.innerHTML = gsSheetsHtml(); gsFit();
  const w = $('#gsWrap'); if(w) w.dataset.sheet = view.gs.sheet || '';
  if(!keepPanel && !inRail){ const r = $('#gsRail'); if(r) r.innerHTML = gsPanel(); }
  document.querySelectorAll('.gs-dock [data-gs="sheet"]').forEach(b => b.classList.toggle('on', b.dataset.id === view.gs.sheet));
  if(hadFocus && view.gs.sel){ const n = cv.querySelector('.gs-b.sel'); if(n) n.focus({preventScroll:true}); }
}
refreshGuest = function(){ gsRefresh(); };
function gsSelect(id, o){
  const g = view.gs; if(gsRo() && id) return; g.sel = id || null; g.sheet = o && o.sheet != null ? o.sheet : '';
  gsFit(); const w = $('#gsWrap'); if(w) w.dataset.sheet = g.sheet || ''; const r = $('#gsRail'); if(r) r.innerHTML = gsPanel();
  document.querySelectorAll('.gs-dock [data-gs="sheet"]').forEach(b => b.classList.toggle('on', b.dataset.id === g.sheet));
  if(id && o && o.focus){ const n = $('#gsCanvas .gs-b.sel'); if(n){ n.focus({preventScroll:true}); n.scrollIntoView({block:'nearest', behavior:'smooth'}); } }
}

/* ---------- Seitenleiste / Blatt von unten ---------- */
function gsThumb(k){
  const L = GS_LOOKS[k], bg = GS_BG[L.fx.bg], ink = bg.dark ? bg.ink : L.ink, ac = L.acc[0][bg.dark ? 1 : 2];
  const fam = {haus:'"Barlow Condensed"', alpin:'"Fraunces"', elegant:'"Cormorant Garamond"', kreide:'"Caveat"', bar:'"Barlow Condensed"', schlicht:'"Source Serif 4"'}[L.fx.font];
  return `<button type="button" class="gs-vl${gsState().cur === k ? ' on' : ''}" data-gs="look" data-id="${k}" aria-pressed="${gsState().cur === k}" title="${esc(L.sub)}"><span class="gs-vt gs-vt-${L.fx.bg}" style="background-color:${bg.col};color:${ink}"><b style="font-family:${fam},serif">${GS_FONT[L.fx.font].caps ? 'AA' : 'Aa'}</b><i style="background:${ac}"></i><u></u><u></u><u></u></span><span class="gs-vn">${L.name}</span></button>`;
}
function gsSecVorlage(){ return `<section class="gs-sec" data-s="vorlage"><h2>Vorlage</h2><div class="gs-vls">${Object.keys(GS_LOOKS).map(gsThumb).join('')}</div><p class="hint">${esc(GS_LOOKS[gsState().cur].sub)}. Jede Vorlage merkt sich, was Sie darin verschieben.</p></section>`; }
function gsSecEffekte(){
  const st = gsState(), L = GS_LOOKS[st.cur], fx = gsFx(gsDoc(), st.cur), dark = GS_BG[fx.bg].dark;
  const tog = (k, l) => `<label class="tog"><input type="checkbox" data-gst="${k}" ${fx[k] ? 'checked' : ''}><span></span>${l}</label>`;
  const fam = {haus:'"Barlow Condensed"', alpin:'"Fraunces"', elegant:'"Cormorant Garamond"', kreide:'"Caveat"', bar:'"Barlow Condensed"', schlicht:'"Source Serif 4"'};
  return `<section class="gs-sec" data-s="effekte"><h2>Effekte</h2>
    <div class="gs-fl">Hintergrund</div><div class="gs-sw">${Object.keys(GS_BG).map(k => `<button type="button" class="gs-bgb${fx.bg === k ? ' on' : ''}" data-gs="fx" data-k="bg" data-id="${k}" aria-pressed="${fx.bg === k}"><i class="gs-vt-${k}" style="background-color:${GS_BG[k].col}"></i>${GS_BG[k].name}</button>`).join('')}</div>
    <div class="gs-fl">Akzentfarbe</div><div class="gs-chips">${L.acc.map((a, i) => `<button type="button" class="gs-acc${fx.acc === i ? ' on' : ''}" data-gs="fx" data-k="acc" data-id="${i}" aria-pressed="${fx.acc === i}"><i style="background:${a[dark ? 1 : 2]}"></i>${a[0]}</button>`).join('')}</div>
    <div class="gs-fl">Ornament</div><div class="gs-chips">${Object.keys(GS_ORN).map(k => `<button type="button" class="chip${fx.orn === k ? ' on' : ''}" data-gs="fx" data-k="orn" data-id="${k}" aria-pressed="${fx.orn === k}">${GS_ORN[k]}</button>`).join('')}</div>
    <div class="gs-fl">Schrift</div><div class="gs-chips">${Object.keys(GS_FONT).map(k => `<button type="button" class="chip gs-fb${fx.font === k ? ' on' : ''}" data-gs="fx" data-k="font" data-id="${k}" aria-pressed="${fx.font === k}" style="font-family:${fam[k]},serif">${GS_FONT[k].name}</button>`).join('')}</div>
    <div class="gs-togs">${tog('cap', 'Initiale bei Überschriften')}${tog('gold', 'Goldprägung für Titel')}${tog('frame', 'Rahmen um Empfehlungen')}${tog('ill', 'Zeichnung bei Überschriften')}${tog('ctr', 'Mittig setzen')}</div></section>`;
}
function gsSecAdd(){ return `<section class="gs-sec" data-s="add"><h2>Baustein einfügen</h2><div class="gs-chips">${GS_ADD.map(([k, l]) => `<button type="button" class="chip" data-gs="add" data-id="${k}">${l}</button>`).join('')}</div><p class="hint">${view.gs.sel ? 'Kommt unter den gewählten Baustein.' : 'Kommt ans Ende. Vorher einen Baustein antippen, dann landet der neue direkt darunter.'}</p></section>`; }
function gsSecKarte(){
  const date = view.gdate || todayStr(); const auto = seasonFor(date), k = curSeasonKey(), s = S.settings.seasons[k]; const sps = specialsFor(date); const doc = gsDoc(), ro = gsRo();
  const miss = guestItems(k, date).filter(m => !hasAlg(m)).length, missSp = sps.reduce((n, sp) => n + sp.items.filter(it => !hasAlg(it)).length, 0), missAll = noAlgCount();
  const hidden = doc.hide.map(key => { const e = gsAll().get(key); return e ? `<li><span>${esc(e.vars[0].name)}</span><button type="button" class="link" data-gs="unhide" data-id="${esc(key)}">Einblenden</button></li>` : ''; }).join('');
  return `<section class="gs-sec" data-s="karte"><h2>Karte für</h2>
    <label class="f">Datum<input id="gdate" type="date" value="${date}"></label>
    <div class="chips-row tight"><button type="button" class="chip ${date === todayStr() ? 'on' : ''}" data-act="gdate" data-id="${todayStr()}">Heute</button><button type="button" class="chip ${date === addDays(todayStr(), 1) ? 'on' : ''}" data-act="gdate" data-id="${addDays(todayStr(), 1)}">Morgen</button>${S.specials.filter(sp => spStatus(sp)[0] !== 'past').slice(0, 3).map(sp => `<button type="button" class="chip ${date === sp.from ? 'on' : ''}" data-act="gdate" data-id="${sp.from}">${esc(sp.name)}</button>`).join('')}</div>
    <p class="hint">${auto ? `Am ${fmtDate(date + 'T12:00:00')} gilt die <b>${esc(S.settings.seasons[auto].title)}</b>` : 'An diesem Datum gilt keine Saisonkarte'}${sps.length ? ` und ${sps.length === 1 ? 'die Aktion' : 'die Aktionen'} <b>${sps.map(x => esc(x.name)).join(', ')}</b>.` : '.'}</p>
    ${missAll || missSp ? `<p class="hint alg-miss" id="algMiss"><b>${plural(missAll, 'Gericht', 'Gerichte')} ohne vollständige Allergenangabe</b>${missAll !== miss ? `, ${miss} davon auf dieser Karte. Die anderen sind ausgeblendet oder gerade nicht in Saison` : ''}${missSp ? `. Dazu ${missSp} in der Aktion` : ''}. In Karte und PDF stehen sie mit ${ALG_MARK}, dazu ein Satz in der Legende. <button type="button" class="link" data-act="goMenu" data-id="noalg">Liste zeigen</button></p>` : ''}
    <button type="button" class="link sm-link" data-act="algSheet">Allergen-Blatt als PDF</button>
    ${ro ? '' : `<details class="gs-more" ${view.gs.more ? 'open' : ''}><summary>Saison, Inhalt und mehr</summary>
      <div class="gs-fl">Saison${view.gseason ? ` <button type="button" class="link sm-link" data-act="gseason" data-id="">nach Datum</button>` : ''}</div>${seg('gseason', k, SEASONS.map(([sk, sl]) => [sk, sl]))}
      <label class="f">Name der Saisonkarte<input data-st="title" value="${esc(s.title)}"></label>
      <div class="fields two"><label class="f">Gültig ab<input type="text" inputmode="numeric" placeholder="TT.MM." data-smd="from" value="${mdLabel(s.from)}"></label><label class="f">bis<input type="text" inputmode="numeric" placeholder="TT.MM." data-smd="to" value="${mdLabel(s.to)}"></label></div>
      <div class="gs-fl">Inhalt dieser Vorlage</div>${seg('gsScope', doc.scope || 'alles', GS_SCOPE)}
      <p class="hint">${{alles:'Speisen und Getränke.', speisen:'Nur Speisen.', getraenke:'Nur Getränke, die Menge steht vor dem Preis.', tafel:'Nur Empfehlungen, Saisonales und laufende Aktionen.'}[doc.scope || 'alles']}</p>
      ${hidden ? `<div class="gs-fl">Auf dieser Karte ausgeblendet</div><ul class="gs-hid">${hidden}</ul>` : ''}
      <button type="button" class="btn sm" data-gs="rebuild">Vorlage neu aufbauen</button>
    </details>`}</section>`;
}
function gsSecBlock(){
  const b = gsBlock(); if(!b) return ''; const doc = gsDoc(), k = curSeasonKey(), s = S.settings.seasons[k]; const fixed = ['title','aktion','legend'].includes(b.t);
  const sg = (key, cur, opts) => `<div class="seg">${opts.map(([v, l]) => `<button type="button" class="${String(cur) === String(v) ? 'on' : ''}" data-gs="bset" data-k="${key}" data-id="${v}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>`;
  let h = '', name = '';
  if(b.t === 'dish'){ const e = gsAll().get(b.key); const m = e && e.vars[0]; name = m ? m.name : ''; const fx = gsFx(doc, gsState().cur); const fr = b.fr === 1 || (b.fr == null && m && e.vars.some(v => v.top));
    h = `<p class="hint">Name, Beschreibung, Preis und Allergene kommen aus der Speisekarte und ändern sich hier von selbst mit.</p>${m ? `<button type="button" class="btn sm" data-act="editMenu" data-id="${m.id}">Gericht bearbeiten</button>` : ''}
      ${fx.frame ? `<label class="tog"><input type="checkbox" data-gsb="fr" ${fr ? 'checked' : ''}><span></span>Als Empfehlung rahmen</label>` : ''}`; }
  else if(b.t === 'head'){ name = gsHeadName(b); const intro = b.intro != null ? b.intro : (b.sec && !b.sec.startsWith('cat:') ? hsCopy('sec', b.sec) : '');
    h = `<label class="f">Überschrift<input data-gsf="txt" value="${esc(b.txt || '')}" placeholder="${esc(gsHeadName({sec:b.sec}) || 'Überschrift')}"></label><label class="f">Zeile darunter<input data-gsf="intro" value="${esc(intro)}"></label><div class="gs-fl">Gerichte darunter</div>${sg('cols', b.cols === 2 ? 2 : 1, [[1, 'Eine Spalte'], [2, 'Zwei Spalten']])}`; }
  else if(b.t === 'text') h = `<label class="f">Text<textarea data-gsf="txt" rows="4">${esc(b.txt || '')}</textarea></label><div class="gs-fl">Ausrichtung</div>${sg('al', b.al || '', [['', 'Wie die Karte'], ['l', 'Links'], ['c', 'Mittig']])}<label class="tog"><input type="checkbox" data-gsb="hand" ${b.hand ? 'checked' : ''}><span></span>Handschrift</label>`;
  else if(b.t === 'photo') h = `<div class="gs-phs">${Object.keys(GS_PHOTOS).map(p => `<button type="button" class="gs-phb${(b.src || 'stube') === p ? ' on' : ''}" data-gs="bset" data-k="src" data-id="${p}" aria-pressed="${(b.src || 'stube') === p}" style="background-image:url('${GS_PHOTOS[p][0]}')" title="${GS_PHOTOS[p][1]}" aria-label="${GS_PHOTOS[p][1]}"></button>`).join('')}</div><button type="button" class="btn sm" data-gs="photoPick">${ico('camera')}Eigenes Foto</button><div class="gs-fl">Größe</div>${sg('size', b.size || 'm', [['s', 'Klein'], ['m', 'Mittel'], ['l', 'Groß']])}<label class="f">Bildunterschrift<input data-gsf="cap" value="${esc(b.cap || '')}"></label>`;
  else if(b.t === 'space') h = `<div class="gs-fl">Höhe</div>${sg('size', b.size || 'm', [['s', 'Klein'], ['m', 'Mittel'], ['l', 'Groß']])}`;
  else if(b.t === 'orn') h = '<p class="hint">Die Form folgt dem Ornament unter „Effekte“.</p>';
  else if(b.t === 'break') h = '<p class="hint">Was danach kommt, beginnt auf einem neuen Blatt.</p>';
  else if(b.t === 'title') h = `<label class="f">Titel<input data-gsf="txt" value="${esc(b.txt || '')}" placeholder="${esc(GS_LOOKS[gsState().cur].title || s.title)}"></label><label class="f">Unterzeile<input data-st="subtitle" value="${esc(s.subtitle == null ? HK_PLACE : s.subtitle)}"></label><label class="f">Leitspruch am Titelblatt<input data-hsc="claim" value="${esc(hsCopy('claim'))}"></label>
      <label class="tog"><input type="checkbox" data-gsb="full" ${b.full ? 'checked' : ''}><span></span>Eigenes Titelblatt</label>
      <div class="row-btns"><button type="button" class="btn sm" data-act="gcover">${ico('camera')}${s.cover ? 'Titelbild ändern' : 'Titelbild (optional)'}</button>${s.cover ? '<button type="button" class="btn sm" data-act="gcoverDel">Entfernen</button>' : ''}</div><p class="hint">Ohne eigenen Titel steht hier ${GS_LOOKS[gsState().cur].title ? `„${esc(GS_LOOKS[gsState().cur].title)}“` : 'der Name der Saisonkarte'}.</p>`;
  else if(b.t === 'aktion') h = `<p class="hint">Hier stehen Aktionen, die am gewählten Tag laufen. Ohne Aktion bleibt die Stelle leer.</p><button type="button" class="link sm-link" data-act="mtab" data-id="plan">Aktionen planen</button>`;
  else if(b.t === 'legend') h = `<label class="f">Fußzeile<input data-st="footer" value="${esc(s.footer || '')}" placeholder="Alle Preise in Euro inkl. MwSt."></label><label class="f">Satz bei Gerichten mit ${ALG_MARK}<input data-hsc="algOpen" value="${esc(algOpenText())}"></label><p class="hint">Die Allergen-Buchstaben stellt die Karte selbst zusammen.</p>`;
  return `<section class="gs-sec gs-blk" data-s="block"><div class="gs-bh"><h2>${GS_TYPES[b.t]}${name ? `<small>${esc(name)}</small>` : ''}</h2><button type="button" class="btn sm" data-gs="done">Fertig</button></div>${h}
    <div class="gs-mv"><button type="button" class="btn sm" data-gs="up">${gsIco('up')}Hinauf</button><button type="button" class="btn sm" data-gs="down">${gsIco('down')}Hinunter</button>${fixed ? '' : `<button type="button" class="btn sm" data-gs="del">${b.t === 'dish' ? 'Ausblenden' : 'Entfernen'}</button>`}</div></section>`;
}
function gsPanel(){
  const g = view.gs; if(gsRo()) return gsSecKarte();
  if(gsNarrow()){ const m = g.sheet; const x = `<button type="button" class="gs-shx" data-gs="sheet" data-id="" aria-label="Schließen">${gsIco('x')}</button>`; return m === 'block' ? gsSecBlock() : m === 'vorlage' ? x + gsSecVorlage() : m === 'effekte' ? x + gsSecEffekte() : m === 'add' ? x + gsSecAdd() : m === 'karte' ? x + gsSecKarte() : ''; }
  if(g.sel && gsBlock()) return gsSecBlock();
  return gsSecVorlage() + gsSecEffekte() + gsSecAdd() + gsSecKarte();
}
renderGuest = function(){
  const g = view.gs, ro = gsRo(); if(!view.gdate) view.gdate = todayStr(); if(g.sel && !gsBlock()) g.sel = null; if(ro) g.sel = null;
  if(view.gseason && view.gseason !== g.sea && !ro){ g.more = true; g.sel = null; if(gsNarrow()) g.sheet = 'karte'; } g.sea = view.gseason;   // „Saison bearbeiten“ führt direkt zu den Feldern der Saison
  const dock = (id, l, i) => `<button type="button" class="${g.sheet === id ? 'on' : ''}" data-gs="sheet" data-id="${id}">${gsIco(i)}<span>${l}</span></button>`;
  return `<div class="gs-wrap${ro ? ' ro' : ''}" id="gsWrap" data-sheet="${g.sheet || ''}">
    <div class="gs-main">
      <div class="gs-bar">${ro ? '' : `<button type="button" class="icon-btn" data-gs="undo" title="Rückgängig (Strg + Z)" aria-label="Rückgängig">${gsIco('undo')}</button><button type="button" class="icon-btn" data-gs="redo" title="Wiederholen (Strg + Y)" aria-label="Wiederholen">${gsIco('redo')}</button>`}<span class="gs-count" id="gsCount"></span>${seg('gsZoom', g.zoom, [['one', 'Groß'], ['grid', 'Übersicht']])}</div>
      <div class="gs-canvas ${g.zoom === 'grid' ? 'grid' : ''}" id="gsCanvas">${gsSheetsHtml()}</div>
    </div>
    <aside class="gs-rail" id="gsRail" aria-label="Karte gestalten">${gsPanel()}</aside>
    ${ro ? `<nav class="gs-dock" aria-label="Karte">${dock('karte', 'Tag', 'day')}</nav>` : `<nav class="gs-dock" aria-label="Karte gestalten">${dock('vorlage', 'Vorlage', 'look')}${dock('effekte', 'Effekte', 'fx')}${dock('add', 'Baustein', 'add')}${dock('karte', 'Tag', 'day')}</nav>`}
  </div>`;
};

/* ---------- Verschieben ---------- */
function gsSpan(bl, i){ if(bl[i].t !== 'head') return 1; let n = 1; while(i + n < bl.length && bl[i + n].t === 'dish') n++; return n; }
function gsMoveTo(id, tid, before){
  const bl = gsDoc().blocks; const i = bl.findIndex(b => b.id === id); let j = bl.findIndex(b => b.id === tid); if(i < 0 || j < 0) return false;
  const n = gsSpan(bl, i), mv = bl[i];
  if(mv.t === 'head' && bl[j].t === 'dish'){ if(before){ while(j > 0 && bl[j - 1].t === 'dish') j--; if(j > 0 && bl[j - 1].t === 'head') j--; } else while(j + 1 < bl.length && bl[j + 1].t === 'dish') j++; }
  else if(mv.t !== 'dish' && bl[j].t === 'head' && !before) j += gsSpan(bl, j) - 1;   // nie zwischen Überschrift und ihre Gerichte
  if(j >= i && j < i + n) return false;
  if((before && j === i + n) || (!before && j === i - 1)) return false;
  const t = bl[j].id; const part = bl.splice(i, n); const k = bl.findIndex(b => b.id === t); bl.splice(before ? k : k + 1, 0, ...part); return true;
}
function gsVisIds(){ const out = []; document.querySelectorAll('#gsCanvas .gs-b[data-b]').forEach(n => { if(!out.includes(n.dataset.b)) out.push(n.dataset.b); }); return out; }
function gsNudge(dir){
  const b = gsBlock(); if(!b) return; const bl = gsDoc().blocks; const i = bl.indexOf(b); const mine = new Set(bl.slice(i, i + gsSpan(bl, i)).map(o => o.id));
  const vis = gsVisIds(); let p = vis.indexOf(b.id); if(p < 0) return; let t = null;
  if(dir < 0){ for(let q = p - 1; q >= 0; q--) if(!mine.has(vis[q])){ t = vis[q]; break; } }
  else { for(let q = p + 1; q < vis.length; q++) if(!mine.has(vis[q])){ t = vis[q]; break; } }
  if(!t){ toast(dir < 0 ? 'Steht schon ganz oben' : 'Steht schon ganz unten'); return; }
  const snap = JSON.stringify(S.settings.karte);
  if(gsMoveTo(b.id, t, dir < 0)){ const g = view.gs; g.undo.push(snap); if(g.undo.length > 60) g.undo.shift(); g.redo = []; g.tag = ''; GS.touched = false; save(); const hadFocus = document.activeElement && document.activeElement.closest('#gsCanvas .gs-b'); gsRefresh(); const n = $('#gsCanvas .gs-b.sel'); if(n){ if(hadFocus) n.focus({preventScroll:true}); n.scrollIntoView({block:'nearest'}); } }
}
let GSD = null;
function gsDragTarget(x, y){
  const sheets = [...document.querySelectorAll('#gsCanvas .gs-sheet')]; if(!sheets.length) return null;
  let sh = sheets.find(s => { const r = s.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
  if(!sh){ let best = 1e9; for(const s of sheets){ const r = s.getBoundingClientRect(); const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom)); if(d < best){ best = d; sh = s; } } if(best > 160) return null; }
  let list = [...sh.querySelectorAll('.gs-b[data-b]')].filter(n => !GSD.ids.has(n.dataset.b) && n.dataset.k !== 'break'); if(!list.length) return null;
  const inX = list.filter(n => { const r = n.getBoundingClientRect(); return x >= r.left - 4 && x <= r.right + 4; }); if(inX.length) list = inX;
  let best = null, bd = 1e9; for(const n of list){ const r = n.getBoundingClientRect(); const d = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0; if(d < bd || (d === bd && best && r.width < best.r.width)){ bd = d; best = {n, r}; } }
  return {id:best.n.dataset.b, before: y < best.r.top + best.r.height / 2, r:best.r};
}
document.addEventListener('pointerdown', e => {
  if(e.button > 0 || GSD || !$('#gsCanvas') || gsRo()) return;
  const grip = e.target.closest('.gs-grip'); const blk = !grip && e.pointerType === 'mouse' && !e.target.closest('.gs-float') ? e.target.closest('#gsCanvas .gs-b[data-b]') : null;
  if(!grip && !blk) return; const id = grip ? view.gs.sel : blk.dataset.b; const b = gsBlock(id); if(!b) return;
  const bl = gsDoc().blocks, i = bl.indexOf(b);
  GSD = {id, ids:new Set(bl.slice(i, i + gsSpan(bl, i)).map(o => o.id)), x0:e.clientX, y0:e.clientY, started:false, t:null, grip:!!grip};
  e.preventDefault();
});
document.addEventListener('pointermove', e => {
  if(!GSD) return; const d = GSD;
  if(!d.started){
    if(Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
    d.started = true; document.body.classList.add('dragging', 'gs-dragging'); const f = $('#gsFloat'); if(f) f.style.visibility = 'hidden';
    document.querySelectorAll('#gsCanvas .gs-b[data-b]').forEach(n => { if(d.ids.has(n.dataset.b)) n.classList.add('gs-src'); });
    const src = document.querySelector(`#gsCanvas .gs-b[data-b="${d.id}"]`); const nm = src && src.querySelector('.gs-n,.gs-hn,.gs-tt,.gs-akn'); const b = gsBlock(d.id);
    d.ghost = document.createElement('div'); d.ghost.className = 'gs-ghost'; d.ghost.textContent = (nm ? nm.textContent.trim() : GS_TYPES[b.t]) + (d.ids.size > 1 ? ` + ${d.ids.size - 1}` : ''); document.body.appendChild(d.ghost);
    d.line = document.createElement('div'); d.line.className = 'gs-line'; document.body.appendChild(d.line);
  }
  e.preventDefault();
  d.ghost.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 10}px)`;
  const t = gsDragTarget(e.clientX, e.clientY); d.t = t;
  if(t){ d.line.style.display = 'block'; d.line.style.left = t.r.left + 'px'; d.line.style.width = t.r.width + 'px'; d.line.style.top = ((t.before ? t.r.top : t.r.bottom) - 2) + 'px'; } else d.line.style.display = 'none';
  const edge = 70; if(e.clientY < edge) window.scrollBy(0, -16); else if(e.clientY > innerHeight - edge - (gsNarrow() ? 110 : 0)) window.scrollBy(0, 16);
}, {passive:false});
function gsDragEnd(e, cancel){
  if(!GSD) return; const d = GSD; GSD = null; if(!d.started) return;
  d.ghost.remove(); d.line.remove(); document.body.classList.remove('dragging', 'gs-dragging'); document.querySelectorAll('.gs-src').forEach(n => n.classList.remove('gs-src')); const f = $('#gsFloat'); if(f) f.style.visibility = '';
  const blk = ev => { ev.stopPropagation(); ev.preventDefault(); }; window.addEventListener('click', blk, true); setTimeout(() => window.removeEventListener('click', blk, true), 0);
  if(cancel || !d.t) return;
  const snap = JSON.stringify(S.settings.karte);
  if(gsMoveTo(d.id, d.t.id, d.t.before)){ const g = view.gs; g.undo.push(snap); if(g.undo.length > 60) g.undo.shift(); g.redo = []; g.tag = ''; g.sel = d.id; if(gsNarrow()) g.sheet = ''; gsChanged(); }
}
document.addEventListener('pointerup', e => gsDragEnd(e, false));
document.addEventListener('pointercancel', e => gsDragEnd(e, true));

/* ---------- Tippen, Tasten, Felder ---------- */
function gsAdd(type){
  const doc = gsDoc(), bl = doc.blocks; gsCommit(); const nb = {id:uid('b'), t:type};
  if(type === 'head'){ nb.txt = 'Überschrift'; nb.cols = 1; } if(type === 'photo'){ nb.src = 'stube'; nb.size = 'm'; } if(type === 'space') nb.size = 'm'; if(type === 'text') nb.txt = '';
  let at = view.gs.sel ? bl.findIndex(b => b.id === view.gs.sel) : -1;
  if(at >= 0){ if(bl[at].t === 'head' && type !== 'head') at += gsSpan(bl, at) - 1; at++; } else { at = bl.findIndex(b => b.t === 'legend'); if(at < 0) at = bl.length; }
  bl.splice(at, 0, nb); view.gs.sel = nb.id; view.gs.sheet = gsNarrow() && (type === 'text' || type === 'head' || type === 'photo') ? 'block' : ''; gsChanged();
  const n = $('#gsCanvas .gs-b.sel'); if(n) n.scrollIntoView({block:'center', behavior:'smooth'});
  setTimeout(() => { const i = $('#gsRail [data-gsf="txt"]'); if(i && (type === 'text' || type === 'head')){ i.focus({preventScroll:true}); i.select && i.select(); } }, 60);
}
function gsDel(){
  const doc = gsDoc(), b = gsBlock(); if(!b || ['title','aktion','legend'].includes(b.t)) return; gsCommit();
  const vis = gsVisIds(), p = vis.indexOf(b.id); doc.blocks.splice(doc.blocks.indexOf(b), 1); if(b.t === 'dish') doc.hide.push(b.key);
  view.gs.sel = null; if(view.gs.sheet === 'block') view.gs.sheet = ''; gsChanged();
  toast(b.t === 'dish' ? 'Auf dieser Karte ausgeblendet' : `${GS_TYPES[b.t]} entfernt`, {label:'Rückgängig', ms:6000, action:() => gsUndo()});
  const nx = vis[p + 1] || vis[p - 1]; const n = nx && document.querySelector(`#gsCanvas .gs-b[data-b="${nx}"]`); if(n && document.activeElement === document.body) n.focus({preventScroll:true});
}
document.addEventListener('click', e => {
  if(!$('#gsWrap')) return;
  const a = e.target.closest('[data-gs]'), g = view.gs;
  if(!a){
    if(e.target.closest('[data-act="gsZoom"]')){ g.zoom = e.target.closest('[data-act]').dataset.id === 'grid' ? 'grid' : 'one'; render(); return; }
    if(e.target.closest('[data-act="gsScope"]')){ if(gsRo()) return; g.more = true; gsCommit(); gsDoc().scope = e.target.closest('[data-act]').dataset.id; gsChanged(); return; }
    if(gsRo()) return;
    const blk = e.target.closest('#gsCanvas .gs-b[data-b]');
    if(blk){ gsSelect(blk.dataset.b); return; }
    if(e.target.closest('#gsCanvas') && !e.target.closest('.gs-float') && (g.sel || g.sheet)){ g.sheet = ''; gsSelect(null); }
    return;
  }
  const id = a.dataset.id, act = a.dataset.gs;
  if(act === 'sheet'){ g.sheet = g.sheet === id ? '' : id; gsSelect(g.sel, {sheet:g.sheet}); return; }
  if(gsRo()) return;
  const doc = gsDoc(), st = gsState();
  switch(act){
    case 'undo': gsUndo(false); break;
    case 'redo': gsUndo(true); break;
    case 'look': if(st.cur !== id && GS_LOOKS[id]){ gsCommit(); st.cur = id; g.sel = null; gsChanged(); const cv = $('#gsCanvas'); if(cv && cv.getBoundingClientRect().top < 0) cv.scrollIntoView({block:'start'}); } break;
    case 'fx': { const v = a.dataset.k === 'acc' ? +id : id; if(gsFx(doc, st.cur)[a.dataset.k] !== v){ gsCommit(); doc.fx[a.dataset.k] = v; gsChanged(); } break; }
    case 'add': gsAdd(id); break;
    case 'up': gsNudge(-1); break;
    case 'down': gsNudge(1); break;
    case 'del': gsDel(); break;
    case 'done': g.sheet = ''; gsSelect(null); break;
    case 'edit': gsSelect(g.sel, {sheet:'block'}); break;
    case 'bset': { const b = gsBlock(); if(!b) break; gsCommit(); const k = a.dataset.k; b[k] = k === 'cols' ? +id : id; if(k === 'al' && !id) delete b.al; gsChanged(); break; }
    case 'unhide': gsCommit(); g.more = true; doc.hide = doc.hide.filter(k => k !== id); gsChanged(); break;
    case 'rebuild': ask(`Die Vorlage „${GS_LOOKS[st.cur].name}“ neu aus der Speisekarte aufbauen? Ihre Anordnung in dieser Vorlage geht dabei verloren.`, () => { gsCommit(); st.docs[st.cur] = gsBuild(st.cur); g.sel = null; gsChanged(); }, 'Neu aufbauen'); break;
    case 'photoPick': pickImage(data => { const b = gsBlock(); if(!b) return; gsCommit(); const iid = uid('img'); imgPut(iid, data); b.src = 'img:' + iid; gsChanged(); }); break;
  }
});
document.addEventListener('toggle', e => { if(e.target.classList && e.target.classList.contains('gs-more')) view.gs.more = e.target.open; }, true);
document.addEventListener('change', e => {
  const t = e.target; if(!t.dataset || gsRo() || !$('#gsWrap')) return;
  if(t.dataset.gst){ gsCommit(); gsDoc().fx[t.dataset.gst] = t.checked; gsChanged(); }
  if(t.dataset.gsb){ const b = gsBlock(); if(!b) return; gsCommit(); const k = t.dataset.gsb; if(k === 'fr') b.fr = t.checked ? 1 : 0; else b[k] = t.checked; gsChanged(); }
});
let _gsT = 0;
document.addEventListener('input', e => {
  const t = e.target; if(!t.dataset || !$('#gsWrap')) return;
  if(t.dataset.gsf){ const b = gsBlock(); if(!b || gsRo()) return; gsCommit('f:' + t.dataset.gsf + b.id); b[t.dataset.gsf] = t.value; save(); clearTimeout(_gsT); _gsT = setTimeout(() => gsRefresh(true), 220); }
  if(t.dataset.hsc){ const c = S.settings.menuCopy || (S.settings.menuCopy = {}); c[t.dataset.hsc] = t.value; save(); clearTimeout(_gsT); _gsT = setTimeout(() => gsRefresh(true), 220); }
});
document.addEventListener('keydown', e => {
  if(!$('#gsWrap') || gsRo()) return; const inField = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable;
  if((e.ctrlKey || e.metaKey) && !e.altKey && !inField && !document.querySelector('dialog[open]')){ const k = e.key.toLowerCase(); if(k === 'z'){ e.preventDefault(); gsUndo(e.shiftKey); return; } if(k === 'y'){ e.preventDefault(); gsUndo(true); return; } }
  if(e.key === 'Escape' && view.gs.sheet && gsNarrow() && !document.querySelector('dialog[open]')){ e.preventDefault(); gsSelect(view.gs.sel, {sheet:''}); return; }
  const n = e.target.closest && e.target.closest('#gsCanvas .gs-b[data-b]'); if(!n) return;
  const k = e.key;
  if(k === 'Enter' || k === ' '){ e.preventDefault(); gsSelect(n.dataset.b, {focus:true}); return; }
  if(k === 'Escape' && view.gs.sel){ e.preventDefault(); gsSelect(null); const f = $('#gsCanvas .gs-b[tabindex="0"]'); if(f) f.focus({preventScroll:true}); return; }
  if((k === 'Delete' || k === 'Backspace') && view.gs.sel === n.dataset.b){ e.preventDefault(); gsDel(); return; }
  if(k !== 'ArrowUp' && k !== 'ArrowDown') return; e.preventDefault(); const dir = k === 'ArrowUp' ? -1 : 1;
  if(e.altKey){ if(view.gs.sel !== n.dataset.b) gsSelect(n.dataset.b, {focus:true}); gsNudge(dir); return; }
  const vis = gsVisIds(); const p = vis.indexOf(n.dataset.b) + dir; if(p >= 0 && p < vis.length) gsSelect(vis[p], {focus:true});
});
window.addEventListener('resize', () => { if($('#gsCanvas')){ gsFit(); const r = $('#gsRail'); if(r && !(document.activeElement && document.activeElement.closest('#gsRail'))) r.innerHTML = gsPanel(); } });
