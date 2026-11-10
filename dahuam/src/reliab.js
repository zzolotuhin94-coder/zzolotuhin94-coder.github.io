/* =====================================================================
   Paket A · Zuverlässigkeit (Oberfläche zu store.js)
   Start aus dem Speicher, Statuszeile, Wiederherstellung, frühere Stände,
   Erinnerung an die Sicherung, zweites Fenster, Offline-Betrieb.
   ===================================================================== */
const REL = {persist:null, snaps:null, update:false, sw:null, swState:'', bars:'', lastSaveShown:0, recover:null, seedSig:null, memBackup:''};
const BK_KEY = KEY + '_lastBackup';

/* ---------- Datenformat: neuere Daten werden nicht angefasst ---------- */
const _migrateRel = migrate;
migrate = function(d){
  if(schemaNewer(d)) return null;
  const r = _migrateRel(d);
  if(r && !relShapeOk(r)) return null;
  if(r){ r.schema = APP_SCHEMA; delete r.app; delete r.exportedAt; }
  return r;
};
/* Grundform prüfen: Listen müssen Listen sein, Verzeichnisse Verzeichnisse. Sonst gilt der Stand als unlesbar (Wiederherstellungs-Seite), statt später mitten in der Arbeit zu scheitern. */
const REL_ARR = ['products', 'cards', 'menu', 'moves', 'inventories', 'specials', 'suppliers', 'orders', 'salesImports'];
const REL_OBJ = ['settings', 'salesDays', 'posMap', 'game', 'saleGroups', 'salesReal', 'salesUnmapped', 'plan', 'team', 'checks'];
function relShapeOk(d){
  const obj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  for(const k of REL_ARR){ if(d[k] === undefined) continue; if(!Array.isArray(d[k])) return false; if(d[k].some(x => !obj(x))) d[k] = d[k].filter(obj); }
  for(const k of REL_OBJ) if(d[k] != null && !obj(d[k])) return false;
  if(!obj(d.settings)) return false;
  for(const k of ['sections', 'closed', 'users']) if(d.settings[k] !== undefined && !Array.isArray(d.settings[k])) return false;
  return true;
}
const _seedRel = seed;
seed = function(){ const d = _seedRel(); d.schema = APP_SCHEMA; return d; };

/* ---------- Start ---------- */
function relShow(){ document.documentElement.classList.remove('booting'); }
function relStart(r){
  try {
    if(r.status === 'ok'){
      let d = null; try { d = migrate(r.state); } catch(e){ console.error(e); }
      if(!d){ STORE.st.frozen = true; let raw = ''; try { raw = JSON.stringify(r.state); } catch(e){} STORE.preserve('form', {raw}).then(() => relRecover({status:'corrupt', kind:'form'})); return; }
      S = d; G_FRESH = false;
      REL.appInit = true; startApp();
      if(REL.renderFail){   // Daten lesbar, aber so beschädigt, dass die App sie nicht zeigen kann: nichts schreiben, Auswahl anbieten
        STORE.st.frozen = true; let raw = ''; try { raw = JSON.stringify(d); } catch(e){}
        S = undefined; REL.renderFail = null; STORE.preserve('anzeige', {raw}).then(() => relRecover({status:'corrupt', kind:'anzeige'})); return; }
      relShow(); STORE.started({dirty: !!(r.legacy || r.replay)});
      if(r.replay) setTimeout(() => toast('Letzte Änderung wiederhergestellt'), 600);
    } else if(r.status === 'fresh'){
      S = seed(); G_FRESH = true;
      REL.appInit = true; startApp(); relShow(); STORE.started();
    } else { relRecover(r); return; }
    relAfterStart();
  } catch(e){ console.error(e); relShow(); }
}
function relAfterStart(){
  relBars(); relInd();
  const later = window.requestIdleCallback ? f => requestIdleCallback(f, {timeout:2500}) : f => setTimeout(f, 800);
  later(() => { relPersist(false); relSnaps(); swStart(); relManifest(); relFontFallback(); });
}

/* ---------- Wiederherstellung: beschädigte oder nicht lesbare Daten ---------- */
const REC_TXT = {
  corrupt:['Die gespeicherten Daten sind beschädigt', 'Die App hat nichts überschrieben. Der beschädigte Stand ist aufgehoben und lässt sich unten als Datei speichern. Wählen Sie, womit Sie weiterarbeiten.'],
  lost:['Die gespeicherten Daten sind nicht mehr da', 'Der Browser hat den Speicher dieser Seite geleert. Das passiert, wenn der Platz knapp wird oder die Daten der Seite gelöscht wurden. Wählen Sie, womit Sie weiterarbeiten.'],
  unreachable:['Der Speicher ist gerade nicht erreichbar', 'Ihre Daten liegen in diesem Browser, lassen sich aber im Moment nicht öffnen. Oft hilft es, alle anderen Fenster dieser Seite zu schließen und neu zu laden. Es wurde nichts überschrieben.'],
  newer:['Die gespeicherten Daten sind neuer als diese App', 'Die Daten wurden mit einer neueren Version der App gespeichert. Bitte laden Sie die Seite neu, damit die App aktuell ist. Es wurde nichts geändert.'],
};
async function relRecover(r){
  REL.recover = r; STORE.st.frozen = true; STORE.st.recovering = true;
  const kind = REC_TXT[r.status] ? r.status : 'corrupt'; const [title, text] = REC_TXT[kind];
  let snaps = []; try { snaps = await STORE.snaps(); } catch(e){}
  const hasRaw = kind === 'corrupt';
  const choice = kind !== 'newer';
  const app = $('#app');
  app.innerHTML = `<section class="panel rel-rec" role="alert"><h1>${esc(title)}</h1><p class="dlg-p">${esc(text)}</p>
    ${kind === 'unreachable' || kind === 'newer' ? `<div class="row-btns"><button type="button" class="btn primary" data-rel="reload">Seite neu laden</button></div>` : ''}
    ${choice && snaps.length ? `<h2>Früheren Stand laden</h2><ul class="rel-snaps">${snaps.slice(0, 8).map(relSnapRow).join('')}</ul>` : ''}
    ${choice ? `<h2>Sicherung laden</h2><p class="hint">Eine Datei, die Sie mit „Sicherung erstellen“ gespeichert haben.</p><div class="row-btns"><button type="button" class="btn" data-rel="recFile">Datei wählen</button><input id="relFile" type="file" accept="application/json,.json" hidden></div>
    <h2>Neu beginnen</h2><div class="row-btns"><button type="button" class="btn" data-rel="recDemo">Mit Demodaten starten</button><button type="button" class="btn" data-rel="recEmpty">Leer starten</button></div>` : ''}
    ${hasRaw ? `<h2>Beschädigten Stand aufheben</h2><p class="hint">Für eine spätere Prüfung. Die Datei enthält alles, was noch lesbar ist.</p><div class="row-btns"><button type="button" class="btn" data-rel="recRaw">Als Datei speichern</button></div>` : ''}
    <p class="hint" id="relRecMsg" role="status"></p></section>`;
  document.documentElement.classList.add('rel-recover'); relShow();
}
function relAdopt(d, msg){
  const rec = REL.recover;
  S = d; REL.recover = null; REL.renderFail = null; STORE.st.recovering = false; document.documentElement.classList.remove('rel-recover');
  if(!REL.appInit){ REL.appInit = true; startApp(); } else { try { fromHash(); render(); } catch(e){ console.error(e); REL.renderFail = e; } }
  if(REL.renderFail){ S = undefined; REL.renderFail = null; REL.recover = rec; STORE.st.recovering = true; relRecover(rec).then(() => { const m = $('#relRecMsg'); if(m) m.textContent = 'Dieser Stand lässt sich nicht anzeigen. Bitte einen anderen wählen.'; }); return; }
  STORE.resume(); relAfterStart(); go('dash'); if(REL.imgReady) cloudStart(); if(msg) toast(msg);
}
function relEmptyState(){
  const d = seed();
  const out = migrate({settings:{name:'Mein Betrieb', vat:d.settings.vat, target:d.settings.target, sections:[...(d.settings.sections || [])]}, products:[], cards:[], menu:[]});
  return out;
}
async function relRawBlob(){ let c = null; try { c = await STORE.kvGet('corrupt'); } catch(e){} return new Blob([JSON.stringify(c || REL.recover || {})], {type:'application/json'}); }

/* ---------- Statuszeilen ---------- */
function relLastBackup(){ try { return localStorage.getItem(BK_KEY) || ''; } catch(e){ return REL.memBackup || ''; } }
function relBackupDays(){ const at = relLastBackup(); const t = at ? new Date(at).getTime() : NaN; return isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 864e5)) : null; }
function relMarkBackup(){ REL.memBackup = new Date().toISOString(); try { localStorage.setItem(BK_KEY, REL.memBackup); } catch(e){} if(view.tab === 'dash' || view.tab === 'setup') softRender(); }
function relSeedSig(){ if(!REL.seedSig){ try { const d = _seedRel(); REL.seedSig = [d.menu.length, d.cards.length, d.products.length, (d.moves || []).length, (d.orders || []).length, (d.suppliers || []).length].join('/'); } catch(e){ REL.seedSig = '?'; } } return REL.seedSig; }
/* Echte Daten: nicht mehr der unveränderte Demostand */
function relHasRealData(){
  try {
    if(!S) return false; if(!S.demo) return true;
    if((S.products || []).some(p => p.priceDemo === false)) return true;
    if((S.salesImports || []).length || Object.keys(S.salesReal || {}).length) return true;
    if((S.inventories || []).some(i => !i.demo)) return true;
    if(S.team && (S.team.people || []).some(p => !p.demo)) return true;
    return [S.menu.length, S.cards.length, S.products.length, (S.moves || []).length, (S.orders || []).length, (S.suppliers || []).length].join('/') !== relSeedSig();
  } catch(e){ return false; }
}
function relBackupDue(){ if(!relHasRealData()) return false; const d = relBackupDays(); return d === null || d >= 7; }
function relBackupLine(){
  const d = relBackupDays();
  return d === null ? 'Es gibt noch keine Sicherung als Datei.' : `Die letzte Sicherung als Datei ist ${d} Tage alt.`;
}
async function relBackup(btn){
  if(!S) return;
  const data = new Blob([JSON.stringify({...S, schema:APP_SCHEMA, app:APP_VERSION + ' · ' + APP_BUILD, exportedAt:new Date().toISOString(), images:IMG})], {type:'application/json'});
  const ok = await saveFile(backupName(), data);
  toast(ok ? 'Sicherung gespeichert: ' + backupName() : 'Sicherung nicht gespeichert');
}
const _saveFileRel = saveFile;
saveFile = async function(name, data){ const ok = await _saveFileRel(name, data); try { if(ok && /^dahuam202-kueche-\d{4}-\d\d-\d\d\.json$/.test(name)) relMarkBackup(); } catch(e){} return ok; };

function relBars(){
  const box = $('#relBars'); if(!box) return; const s = STORE.status(); const out = [];
  if(!REL.recover){
    if(s.role !== 'owner' && s.confirmed) out.unshift(`<div class="rel-bar info" role="status"><span><b>In einem anderen Fenster geöffnet.</b> Hier können Sie alles ansehen. Ändern geht immer nur in einem Fenster, damit nichts verloren geht.</span><span class="rel-acts"><button type="button" class="btn sm" data-rel="takeover">Hier weiterarbeiten</button></span></div>`);
    else if(s.error && s.error.kind === 'nostore' && FRAMED) out.unshift(`<div class="rel-bar" role="status"><span><b>Vorschau.</b> Änderungen bleiben nur, solange diese Ansicht offen ist.</span></div>`);
    if(REL.photoFail && !(s.error && s.error.kind === 'nostore')) out.push(`<div class="rel-bar bad" role="alert"><span><b>Foto nicht gespeichert</b> – der Browser hat es nicht angenommen (Speicher voll?). Es ist nur noch in diesem Fenster zu sehen.</span><span class="rel-acts"><button type="button" class="btn sm" data-rel="photoRetry">Erneut versuchen</button><button type="button" class="btn sm" data-rel="backup">Sicherung jetzt speichern</button></span></div>`);
    if(s.role !== 'owner' && s.confirmed){}
    else if(s.error && s.error.kind === 'nostore' && FRAMED){}
    else if(s.error) out.push(`<div class="rel-bar bad" role="alert"><span><b>Nicht gespeichert</b> – ${esc(s.error.text)}. Ihre Änderungen sind noch da, solange dieses Fenster offen bleibt.</span><span class="rel-acts"><button type="button" class="btn sm" data-rel="retry">Erneut versuchen</button><button type="button" class="btn sm" data-rel="backup">Sicherung jetzt speichern</button></span></div>`);
    if(REL.update) out.push(`<div class="rel-bar info" role="status"><span><b>Neue Version bereit.</b> Sie wird beim nächsten Start verwendet.</span><span class="rel-acts"><button type="button" class="btn sm" data-rel="update">Neu laden</button></span></div>`);
  }
  const html = out.join(''); if(html === REL.bars) return; REL.bars = html; box.innerHTML = html;
  try { const tb = document.querySelector('.topbar'); box.style.setProperty('--rel-top', ((tb && tb.offsetHeight) || 0) + 'px'); } catch(e){}
}
let relIndT = 0;
function relInd(){
  const s = STORE.status(); let cls = '', txt = '', tip = '';
  const tm = s.savedAt ? new Date(s.savedAt).toLocaleTimeString('de-AT', {hour:'2-digit', minute:'2-digit'}) : '';
  if(REL.recover){ cls = ''; }
  else if(s.role !== 'owner' && s.confirmed){ cls = 'ro'; txt = 'Nur ansehen'; tip = 'In einem anderen Fenster geöffnet'; }
  else if(s.error){ cls = 'bad'; txt = 'Nicht gespeichert'; tip = s.error.text; }
  else if(s.dirty || s.writing){ cls = 'busy'; txt = 'Speichert …'; }
  else if(s.rev > 0 && s.savedAt){ cls = 'ok'; txt = 'Gespeichert'; tip = 'Zuletzt gespeichert um ' + tm + ' Uhr'; }
  const apply = () => { document.querySelectorAll('[data-saveind]').forEach(n => { n.hidden = !cls; n.className = n.dataset.saveind + ' ' + cls; if(n.dataset.saveind === 'save-ind') n.textContent = txt; n.title = tip || txt; n.setAttribute('aria-label', txt + (tip ? '. ' + tip : '')); }); };
  clearTimeout(relIndT);
  if(cls === 'busy') relIndT = setTimeout(() => { const x = STORE.status(); if((x.dirty || x.writing) && !x.error) apply(); }, 700); else apply();
}
STORE.on((t, d) => {
  if(!S && !REL.recover) return;
  relInd();
  if(t === 'error' || t === 'role' || t === 'saved' || t === 'ready' || t === 'reloaded') relBars();
  if(t === 'role' && d === 'conflict') toast('In einem anderen Fenster wurde weitergearbeitet. Dieses Fenster zeigt jetzt den neuen Stand.');
  if(t === 'blocked'){ const b = document.querySelector('#relBars .rel-bar.info'); if(b){ b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); } }
  if(t === 'saved' && !REL.persistAsked && relHasRealData()){ REL.persistAsked = true; relPersist(true); }
  if((t === 'snaps' || t === 'safety' || t === 'migrated') && view.tab === 'setup'){ relSnaps(); }
  if(t === 'saved' && view.tab === 'setup'){ const n = $('#relSavedAt'); if(n) n.textContent = relSavedText(); }
});
function relSavedText(){ const s = STORE.status(); if(s.error) return 'Nicht gespeichert'; if(s.mode === 'mem') return 'nur in diesem Fenster'; return s.savedAt ? 'Gespeichert ' + new Date(s.savedAt).toLocaleTimeString('de-AT') : 'noch nichts geändert'; }

/* ---------- Speicher: dauerhaft? belegt? frühere Stände ---------- */
const relMb = n => n == null ? '—' : n >= 1e9 ? num(n/1e9, 1) + ' GB' : n >= 1e6 ? num(n/1e6, 1) + ' MB' : num(Math.max(1, Math.round(n/1e3))) + ' KB';
async function relPersist(ask){ try { REL.persist = await STORE.persistInfo(ask); } catch(e){ REL.persist = {supported:false}; } relPanelRefresh(); return REL.persist; }
async function relSnaps(){ try { REL.snaps = await STORE.snaps(); } catch(e){ REL.snaps = []; } relPanelRefresh(); }
function relPanelRefresh(){ const n = $('#relPanel'); if(n && view.tab === 'setup'){ const ae = document.activeElement; if(ae && n.contains(ae) && ae.tagName !== 'BUTTON') return; const id = ae && n.contains(ae) ? ae.dataset.rel + '|' + (ae.dataset.id || '') : null; n.outerHTML = relPanel(); if(id){ const b = [...document.querySelectorAll('#relPanel [data-rel]')].find(x => x.dataset.rel + '|' + (x.dataset.id || '') === id); if(b) b.focus({preventScroll:true}); } } }
const SNAP_KIND = {auto:'Tagesstand', umzug:'vor der Umstellung des Speichers', alt:'aus einer älteren App-Version', konflikt:'nicht gespeicherte Änderungen', hand:'von Hand aufgehoben'};
function relSnapRow(x){
  const c = x.counts || {}; const when = new Date(x.at).toLocaleString('de-AT', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
  const bits = [SNAP_KIND[x.kind] || 'Stand', c.menu != null ? plural(c.menu, 'Gericht', 'Gerichte') : '', c.cards != null ? plural(c.cards, 'Rezeptur', 'Rezepturen') : '', relMb(x.size)].filter(Boolean);
  return `<li><span class="rel-s-t"><b>${esc(when)} Uhr</b><small>${esc(bits.join(' · '))}</small></span><button type="button" class="btn sm" data-rel="snap" data-id="${esc(x.id)}" aria-label="Stand vom ${esc(when)} Uhr laden">Laden</button></li>`;
}
function relOfflineText(){
  if(FRAMED) return 'nein, nur in der installierten App';
  if(location.protocol === 'file:' || !('serviceWorker' in navigator) || !window.isSecureContext) return 'nein, in dieser Ansicht nicht möglich';
  return REL.swState === 'active' ? 'ja' : REL.swState === 'error' ? 'nein, Einrichtung fehlgeschlagen' : 'wird eingerichtet …';
}
function relPanel(){
  const s = STORE.status(), p = REL.persist, snaps = REL.snaps;
  const where = s.mode === 'idb' ? 'in diesem Browser auf diesem Gerät' : s.mode === 'ls' ? 'in diesem Browser (einfacher Speicher)' : 'nirgends, nur in diesem Fenster';
  const dur = !p ? 'wird geprüft …' : p.persisted === true ? 'dauerhaft' : p.persisted === false ? 'kann vom Browser gelöscht werden' : 'unbekannt (der Browser gibt keine Auskunft)';
  const used = !p || p.usage == null ? '—' : `${relMb(p.usage)}${p.quota ? ' von ' + relMb(p.quota) : ''}`;
  const lb = relLastBackup(); const due = relBackupDue();
  return `<section class="panel rel-panel" id="relPanel"><div class="panel-h"><h2>Speicher & frühere Stände</h2><span class="muted sm" id="relSavedAt">${esc(relSavedText())}</span></div>
    <div class="kv rel-kv">
      <span>Gespeichert</span><span>${where}</span>
      <span>Speicher</span><span id="relDur">${esc(dur)}</span>
      <span>Belegt</span><span id="relUsed">${esc(used)}</span>
      <span>Letzte Sicherung als Datei</span><span id="relLastBk">${lb ? fmtDate(lb) : 'noch keine'}</span>
      <span>Ohne Internet nutzbar</span><span id="relOff">${esc(relOfflineText())}</span>
      <span>Version</span><span id="relVer">${esc(APP_VERSION)} · Stand ${esc(APP_BUILD)} · Datenformat ${APP_SCHEMA}</span>
    </div>
    ${due ? `<p class="rel-remind"><span>${esc(relBackupLine())}</span></p>` : ''}
    <div class="row-btns" style="margin-top:12px"><button type="button" class="btn sm" data-rel="backup">Sicherung speichern</button>${p && p.supported && p.persisted === false ? `<button type="button" class="btn sm" data-rel="persist">Dauerhaft speichern</button>` : ''}</div>
    ${p && p.persisted === false ? `<p class="hint">Der Browser darf die Daten löschen, wenn der Platz knapp wird oder die Seite lange nicht geöffnet war. Am sichersten ist die App auf dem Home-Bildschirm, dazu regelmäßig eine Sicherung als Datei.</p>` : ''}
    <h3 class="rel-h3">Frühere Stände</h3>
    ${snaps && snaps.length ? `<ul class="rel-snaps">${snaps.map(relSnapRow).join('')}</ul>` : `<p class="hint" style="margin-top:0">${snaps ? 'Noch keine. Der erste Stand entsteht am nächsten Arbeitstag.' : 'Wird geladen …'}</p>`}
    <p class="hint">Die App hebt von selbst den Stand der letzten 7 Arbeitstage und je einen Stand der 4 Wochen davor auf. Beim Laden wird der jetzige Stand vorher als Sicherheitskopie abgelegt.</p>
  </section>`;
}
const _renderSetupRel = renderSetup;
renderSetup = function(){
  const h = _renderSetupRel(); const i = h.lastIndexOf('</div>');
  if(REL.snaps === null) relSnaps(); if(REL.persist === null) relPersist(false);
  return h.slice(0, i) + relPanel() + h.slice(i);
};
const _goRel = go;
go = function(tab, card){ if(tab === 'setup' && view.tab !== 'setup'){ REL.snaps = null; REL.persist = null; } return _goRel(tab, card); };

/* ---------- Heute: eine ruhige Zeile, wenn die Sicherung alt ist ---------- */
const _renderDashRel = renderDash;
renderDash = function(){
  let h = _renderDashRel();
  try { if(relBackupDue()){ const i = h.indexOf('<div class="day">'); if(i >= 0) h = h.slice(0, i) + `<p class="rel-remind"><span>${esc(relBackupLine())}</span><button type="button" class="btn sm" data-rel="backup">Sicherung speichern</button></p>` + h.slice(i); } } catch(e){ console.warn(e); }
  return h;
};

/* ---------- Knöpfe ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest && e.target.closest('[data-rel]'); if(!el || REL.recover) return; const a = el.dataset.rel;
  if(a === 'retry'){ el.disabled = true; await STORE.retry(false); el.disabled = false; relBars(); if(!STORE.status().error) toast('Gespeichert'); }
  else if(a === 'backup'){ await relBackup(); }
  else if(a === 'photoRetry'){ el.disabled = true; const ids = [...(REL.photoIds || [])]; REL.photoIds = new Set(); REL.photoFail = false; if(!idb) idb = await idbOpen(); ids.forEach(id => { if(IMG[id]) imgPut(id, IMG[id]); }); setTimeout(() => { relBars(); if(!REL.photoFail) toast('Foto gespeichert'); }, 900); }
  else if(a === 'takeover'){ el.disabled = true; el.textContent = 'Einen Moment …'; try { await STORE.takeover(false); } catch(x){ console.warn(x); } relBars(); relInd(); if(!STORE.isReader()) toast('Sie arbeiten jetzt in diesem Fenster'); }
  else if(a === 'update'){ swUpdateNow(el); }
  else if(a === 'reload'){ location.reload(); }
  else if(a === 'persist'){ const p = await relPersist(true); toast(p && p.persisted ? 'Speicher ist jetzt dauerhaft' : 'Der Browser hat das nicht zugesagt. Eine Sicherung als Datei hilft immer.'); }
  else if(a === 'snap'){
    const id = el.dataset.id; const when = el.closest('li') ? el.closest('li').querySelector('b').textContent : '';
    if(typeof roGate === 'function' && !roGate()) return;
    ask(`Stand vom ${when} laden? Der jetzige Stand wird ersetzt. Vorher legt die App eine Sicherheitskopie an.`, () => { setTimeout(async () => {
      try { const d = migrate(await STORE.snapLoad(id)); if(!d) throw 0; safetyStore('vor „Früheren Stand laden“'); S = d; save(); go('dash'); toast('Früherer Stand geladen', {label:'Rückgängig', ms:8000, action:safetyRestore}); }
      catch(x2){ info('Laden fehlgeschlagen', 'Dieser Stand ist nicht lesbar. Es wurde nichts geändert.'); } }, 0); }, 'Stand laden');
  }
});
/* Auf der Wiederherstellungs-Seite gibt es noch keine Daten: store.js hält alle anderen Klick-Behandlungen der App fern und ruft nur diese Funktion */
async function relRecEvent(e){
  const t = e.target, m = $('#relRecMsg'), msg = x => { if(m) m.textContent = x; };
  if(e.type === 'change'){
    if(!t || t.id !== 'relFile' || !t.files[0]) return;
    const r = new FileReader(); r.onload = () => {
      let d; try { d = JSON.parse(r.result); } catch(x){ msg('Die Datei ist keine Sicherung dieser App.'); return; }
      if(schemaNewer(d)){ msg('Diese Sicherung stammt aus einer neueren Version der App. Bitte zuerst die Seite neu laden.'); return; }
      const imgs = d && d.images; if(d && typeof d === 'object') delete d.images; let nd = null; try { nd = migrate(d); } catch(x){}
      if(!nd){ msg('Die Datei ist keine Sicherung dieser App.'); return; }
      relAdopt(nd, 'Sicherung geladen'); if(imgs) imgLoadAll().then(() => { Object.entries(imgs).forEach(([k, v]) => imgPut(k, v)); render(); });
    }; r.readAsText(t.files[0]); t.value = ''; return;
  }
  const el = t.closest && t.closest('.rel-rec [data-rel]'); if(!el) return; const a = el.dataset.rel;
  if(a === 'reload') location.reload();
  else if(a === 'snap'){ try { const d = migrate(await STORE.snapLoad(el.dataset.id)); if(!d) throw 0; relAdopt(d, 'Früherer Stand geladen'); } catch(x){ msg('Dieser Stand ist nicht lesbar. Bitte einen anderen wählen.'); } }
  else if(a === 'recDemo') relAdopt(seed(), 'Demodaten geladen');
  else if(a === 'recEmpty'){ let d = null; try { d = relEmptyState(); } catch(x){} if(d) relAdopt(d, 'Leerer Betrieb angelegt'); else msg('Leer starten ist gerade nicht möglich. Bitte die Demodaten wählen.'); }
  else if(a === 'recFile') $('#relFile').click();
  else if(a === 'recRaw'){ const ok = await saveFile('dahuam202-beschaedigt-' + todayStr() + '.json', await relRawBlob()); msg(ok ? 'Gespeichert.' : 'Nicht gespeichert.'); }
}

/* ---------- Fotos: nach dem Schreiben zurücklesen, damit auch ein verlorenes Foto auffällt ---------- */
const _imgPutRel = imgPut;
imgPut = function(id, data){
  _imgPutRel(id, data);
  setTimeout(() => {
    const bad = () => { REL.photoFail = true; (REL.photoIds = REL.photoIds || new Set()).add(id); relBars(); };
    if(IMG[id] !== data) return;                       // inzwischen ersetzt oder gelöscht
    if(!idb){ if(STORE.status().mode !== 'mem') bad(); return; }
    try { const r = idb.transaction('img').objectStore('img').get(id); r.onsuccess = () => { if(IMG[id] === data && r.result !== data) bad(); }; r.onerror = bad; } catch(e){ bad(); }
  }, 400);
};

/* ---------- Offline: Service Worker, nur auf der eigenen Seite ---------- */
function swOk(){ try { return !FRAMED && /^https?:$/.test(location.protocol) && 'serviceWorker' in navigator && window.isSecureContext && !/[?&]nosw\b/.test(location.search); } catch(e){ return false; } }
function swStart(){
  if(!swOk() || REL.swStarted) return; REL.swStarted = true;
  let hadCtl = !!navigator.serviceWorker.controller;
  const setState = st => { REL.swState = st; const n = $('#relOff'); if(n) n.textContent = relOfflineText(); };
  navigator.serviceWorker.register('sw.js', {scope:'./'}).then(reg => {
    REL.sw = reg;
    const check = () => { if(reg.active) setState('active'); if(reg.waiting && navigator.serviceWorker.controller){ REL.update = true; relBars(); } };
    const watch = w => { if(w) w.addEventListener('statechange', () => { check(); }); };
    watch(reg.installing); watch(reg.waiting); check();
    reg.addEventListener('updatefound', () => watch(reg.installing));
    navigator.serviceWorker.ready.then(() => setState('active')).catch(() => {});
    let last = Date.now();
    document.addEventListener('visibilitychange', () => { if(!document.hidden && Date.now() - last > 36e5){ last = Date.now(); reg.update().catch(() => {}); } });
  }).catch(e => { console.warn('Offline-Betrieb:', e); setState('error'); });
  /* Ein neuer Worker übernimmt nur nach „Neu laden“ oder beim nächsten Start. Dann lädt die Seite einmal frisch, damit nichts gemischt wird. */
  navigator.serviceWorker.addEventListener('controllerchange', () => { if(!hadCtl){ hadCtl = true; return; } if(REL.reloading) return; REL.reloading = true; STORE.flush(); STORE.idle().then(() => location.reload()); });
}
async function swUpdateNow(btn){
  if(btn){ btn.disabled = true; btn.textContent = 'Einen Moment …'; }
  try { STORE.flush(); await STORE.idle(); } catch(e){}
  const reg = REL.sw; if(reg && reg.waiting){ reg.waiting.postMessage({type:'SKIP_WAITING'}); setTimeout(() => { if(!REL.reloading){ REL.reloading = true; location.reload(); } }, 4000); } else location.reload();
}
/* Manifest und Symbol nur auf der eigenen Seite einhängen; in der eingebetteten Vorschau gibt es diese Dateien nicht */
function relManifest(){ if(!swOk() && !(location.protocol === 'https:' && !FRAMED)) return; try { if(document.querySelector('link[rel="manifest"]')) return; const l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.webmanifest'; document.head.appendChild(l); const i = document.createElement('link'); i.rel = 'icon'; i.type = 'image/png'; i.sizes = '192x192'; i.href = 'icons/icon-192.png'; document.head.appendChild(i); } catch(e){} }
/* Eingebettete Vorschau ohne den Ordner vendor/: Schriften nachträglich und ohne zu blockieren von Google holen. Auf der eigenen Seite passiert das nie. */
function relFontFallback(){
  if(!FRAMED || !document.fonts || !document.fonts.load) return;
  const fb = () => { if(document.getElementById('relGf')) return; const l = document.createElement('link'); l.id = 'relGf'; l.rel = 'stylesheet'; l.media = 'print'; l.onload = () => { l.media = 'all'; }; l.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700&family=Figtree:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Caveat:wght@400..600&family=PT+Sans:wght@400;700&family=Saira+Condensed:wght@300;400&family=Roboto+Condensed:wght@400;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Schibsted+Grotesk:wght@500;600&family=JetBrains+Mono:wght@500&display=swap'; document.head.appendChild(l); };
  document.fonts.load('500 16px "Figtree"').then(r => { if(!r || !r.length) fb(); }, fb);
}
window.addEventListener('appinstalled', () => { relPersist(true); });
