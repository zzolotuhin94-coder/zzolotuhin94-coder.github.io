/* =====================================================================
   Phase 2: Cloud (Supabase) – Anmeldung, Sync zwischen Geräten,
   Fotos im Speicher, Bestellungen per E-Mail über Server-Funktion
   ===================================================================== */
const CLOUD_KEY = KEY + '_cloud', BASE_KEY = KEY + '_base';
let CL = (() => { try { return JSON.parse(localStorage.getItem(CLOUD_KEY)) || {}; } catch(e){ return {}; } })();
let cloudState = 'off', cloudMsg = '', pushTimer = null, pushing = false, dirty = false, pollTimer = null;
function clSave(){ try { localStorage.setItem(CLOUD_KEY, JSON.stringify(CL)); } catch(e){} }
function baseGet(){ return STORE.baseGet(); }
function baseSet(d){ STORE.baseSet(d); }
const CLOUD_NEWER = 'Die Cloud-Daten stammen aus einer neueren Version der App. Bitte diese App neu laden, dann geht der Abgleich wieder. Es wurde nichts geändert.';
function cloudReady(){ return !FRAMED && !!(CL.url && CL.anon && CL.session && CL.rid); }
/* Fehlertexte: deutsch, ohne Technik */
function cloudErrText(x){
  const m = String((x && x.message) || x || ''); const st = x && x.status;
  if(/^(E-Mail oder Passwort|Dieses Konto|Sitzung abgelaufen|Bitte |Die Cloud-Daten stammen)/.test(m)) return m;
  if(x instanceof TypeError || /failed to fetch|networkerror|load failed|fetch|network|dns|cors|timed? ?out|invalid url|parse url/i.test(m) || st === 0 || st === 404 || st >= 500) return 'Keine Verbindung zum Cloud-Projekt. Adresse und Schlüssel prüfen.';
  if(st === 401 || st === 403 || /api key|apikey|jwt|not authorized|permission|unauthori[sz]ed/i.test(m)) return 'Zugriff abgelehnt. Schlüssel und Anmeldung prüfen.';
  if(/nicht angemeldet/.test(m)) return 'Nicht angemeldet. Bitte neu verbinden.';
  if(st === 429) return 'Zu viele Versuche. Bitte in ein paar Minuten noch einmal probieren.';
  return 'Die Cloud hat nicht geantwortet wie erwartet. Bitte später noch einmal versuchen.';
}
function setCloud(st, msg=''){ if(st === 'err' || st === 'offline') msg = st === 'offline' ? 'Kein Internet. Änderungen werden gespeichert und später übertragen.' : cloudErrText({message:msg}); cloudState = st; cloudMsg = msg; const b = $('#cloudChip'); if(b){ b.className = 'cloud-chip '+st; b.textContent = {off:'', ok:'Cloud · synchron', busy:'Cloud · speichert …', offline:'Cloud · offline', err:'Cloud · Fehler'}[st] || ''; b.title = msg; b.hidden = st==='off'; } }

async function clFetch(path, {method='GET', body, auth=true, raw=false, headers={}}={}){
  const h = {apikey:CL.anon, ...headers};
  if(body !== undefined && !(body instanceof Blob)) h['Content-Type'] = 'application/json';
  if(auth){ await ensureToken(); h.Authorization = 'Bearer ' + CL.session.access_token; }
  const r = await fetch(CL.url.replace(/\/+$/,'') + path, {method, headers:h, body: body === undefined ? undefined : body instanceof Blob ? body : JSON.stringify(body)});
  if(!r.ok){ let t = ''; try { t = (await r.json()).message || ''; } catch(e){} const err = new Error(t || ('HTTP '+r.status)); err.status = r.status; throw err; }
  if(raw) return r;
  const ct = r.headers.get('content-type') || ''; return ct.includes('json') ? r.json() : r.text();
}
async function ensureToken(){
  if(!CL.session) throw new Error('nicht angemeldet');
  if(Date.now()/1000 < (CL.session.expires_at||0) - 60) return;
  const r = await fetch(CL.url.replace(/\/+$/,'') + '/auth/v1/token?grant_type=refresh_token', {method:'POST', headers:{apikey:CL.anon, 'Content-Type':'application/json'}, body:JSON.stringify({refresh_token:CL.session.refresh_token})});
  if(!r.ok){ CL.session = null; clSave(); setCloud('err', 'Sitzung abgelaufen, bitte neu anmelden'); throw new Error('Sitzung abgelaufen'); }
  const j = await r.json(); CL.session = {access_token:j.access_token, refresh_token:j.refresh_token, expires_at:j.expires_at || (Date.now()/1000 + (j.expires_in||3600)), user:j.user}; clSave();
}
const rpc = (fn, args) => clFetch('/rest/v1/rpc/' + fn, {method:'POST', body:args});

async function cloudLogin(url, anon, email, pw){
  CL = {url:url.trim(), anon:anon.trim(), email:email.trim()};
  const r = await fetch(CL.url.replace(/\/+$/,'') + '/auth/v1/token?grant_type=password', {method:'POST', headers:{apikey:CL.anon, 'Content-Type':'application/json'}, body:JSON.stringify({email:CL.email, password:pw})});
  if(!r.ok){ let m = ''; try { const j = await r.json(); m = j.error_description || j.msg || j.message || ''; } catch(e){} if(m.includes('Invalid login') || r.status === 400) throw new Error('E-Mail oder Passwort falsch.'); const er = new Error(m || 'Anmeldung fehlgeschlagen'); er.status = r.status; throw er; }
  const j = await r.json(); CL.session = {access_token:j.access_token, refresh_token:j.refresh_token, expires_at:j.expires_at || (Date.now()/1000 + (j.expires_in||3600)), user:j.user};
  const ms = await rpc('my_memberships', {});
  if(!ms || !ms.length) throw new Error('Dieses Konto ist noch keinem Betrieb zugeordnet. Bitte den Inhaber, Sie zum Team hinzuzufügen.');
  const m = ms[0]; CL.rid = m.restaurant_id; CL.rname = m.restaurant_name; CL.member = {name:m.name, role:m.role}; CL.version = 0; clSave();
}
function cloudLogout(){ CL = {}; clSave(); baseSet(null); clearInterval(pollTimer); setCloud('off'); render(); }

/* ---------- 3-Wege-Zusammenführung (Basis, lokal, Cloud) ---------- */
const COLL = ['products','cards','menu','specials','moves','inventories','suppliers','orders'];
const J = x => JSON.stringify(x === undefined ? null : x);
function pick3(b, l, r){ const lc = J(l) !== J(b), rc = J(r) !== J(b); return lc && !rc ? l : !lc ? r : l; }
function mergeObj(b, l, r, stockDelta){
  b = b || {}; const o = {};
  for(const k of new Set([...Object.keys(l||{}), ...Object.keys(r||{})])){
    if(stockDelta && k === 'stock'){ o.stock = Math.round(((+r.stock||0) + (+l.stock||0) - (+b.stock||0))*1000)/1000; continue; }
    const v = pick3(b[k], (l||{})[k], (r||{})[k]); if(v !== undefined) o[k] = v;
  }
  return o;
}
function mergeArr(b, l, r, key){
  const mb = new Map((b||[]).map(x=>[x.id,x])), ml = new Map(l.map(x=>[x.id,x])), mr = new Map(r.map(x=>[x.id,x]));
  const ids = [...new Set([...r.map(x=>x.id), ...l.map(x=>x.id)])]; const out = []; let conflicts = 0;
  for(const id of ids){ const bb = mb.get(id), ll = ml.get(id), rr = mr.get(id); const lc = J(ll) !== J(bb), rc = J(rr) !== J(bb); let v;
    if(!lc) v = rr; else if(!rc) v = ll; else if(ll && rr){ v = mergeObj(bb, ll, rr, key==='products'); conflicts++; } else v = ll || rr;
    if(v) out.push(v); }
  if(key === 'moves') out.sort((a,b2) => String(b2.date).localeCompare(String(a.date)));
  return [out, conflicts];
}
function merge3(base, local, remote){
  base = base || {}; const out = {}; let conflicts = 0;
  for(const k of new Set([...Object.keys(local), ...Object.keys(remote)])){
    if(COLL.includes(k) && Array.isArray(local[k]) && Array.isArray(remote[k])){ const [a,c] = mergeArr(base[k], local[k], remote[k], k); out[k] = a; conflicts += c; }
    else if(['settings','salesDays','posMap','salesUnmapped'].includes(k)) out[k] = mergeObj(base[k], local[k]||{}, remote[k]||{});
    else { const v = pick3(base[k], local[k], remote[k]); if(v !== undefined) out[k] = v; }
  }
  return [out, conflicts];
}

/* ---------- Sync ---------- */
function snapshot(){ return JSON.parse(JSON.stringify(S)); }
async function cloudPull(first){
  if(STORE.isReader()) return;
  await STORE.baseLoad();
  const st = await rpc('get_state', {p_rid:CL.rid});
  if(!st || !st.data){ return cloudPush(true); }
  if(schemaNewer(st.data)) throw new Error(CLOUD_NEWER);
  if(st.version === CL.version && !first) return;
  const base = baseGet();
  if(!base && first){ return st; }
  const [m, c] = merge3(base, S, st.data);
  const changed = J(m) !== J(S);
  S = migrate(m) || S; CL.version = st.version; CL.lastBy = st.updated_by; clSave();
  baseSet(st.data); STORE.save();
  if(J(S) !== J(st.data)) dirty = true;
  if(changed && !first){ const ae = document.activeElement; if(!ae || !ae.closest('#app input, #app textarea, #app select, #dlg')) render(); toast(`Neue Daten von ${st.updated_by || 'Team'} übernommen${c?` (${c} gleichzeitig bearbeitet)`:''}`); }
  await syncPhotos();
  if(dirty) schedulePush(200);
}
async function cloudPush(force){
  if(!cloudReady() || pushing || STORE.isReader()) return; pushing = true; setCloud('busy');
  try {
    await STORE.baseLoad();
    for(let attempt = 0; attempt < 3; attempt++){
      const data = snapshot();
      const res = await rpc('save_state', {p_rid:CL.rid, p_data:data, p_expected:CL.version||0});
      if(res && res.ok){ CL.version = res.version; clSave(); baseSet(data); dirty = J(S) !== J(data); setCloud('ok', 'Gespeichert '+new Date().toLocaleTimeString('de-AT')); break; }
      if(schemaNewer(res.data)) throw new Error(CLOUD_NEWER);
      const [m, c] = merge3(baseGet(), S, res.data); S = migrate(m) || S; CL.version = res.version; clSave(); baseSet(res.data);
      STORE.save();
      render(); if(c) toast(`${c} Einträge wurden gleichzeitig auf einem anderen Gerät geändert und zusammengeführt`);
    }
  } catch(err){ dirty = true; setCloud(navigator.onLine === false ? 'offline' : 'err', err.message); }
  finally { pushing = false; if(dirty && cloudState === 'ok') schedulePush(1500); }
}
function schedulePush(ms=1500){ if(!cloudReady()) return; dirty = true; clearTimeout(pushTimer); pushTimer = setTimeout(cloudPush, ms); }
async function cloudPoll(){
  if(!cloudReady() || document.hidden || pushing || STORE.isReader()) return;
  try { const v = await rpc('get_version', {p_rid:CL.rid}); if(v && v.version > (CL.version||0)) await cloudPull(false); else if(dirty) schedulePush(100); else setCloud('ok', cloudMsg); }
  catch(err){ setCloud(navigator.onLine === false ? 'offline' : 'err', err.message); }
}
async function cloudStart(){
  if(!cloudReady()) { setCloud('off'); return; }
  setCloud('busy');
  try { await cloudPull(false); setCloud('ok'); } catch(err){ setCloud(navigator.onLine===false?'offline':'err', err.message); }
  clearInterval(pollTimer); pollTimer = setInterval(cloudPoll, 20000);
}
async function cloudConnectFlow(url, anon, email, pw){
  await cloudLogin(url, anon, email, pw);
  const st = await rpc('get_state', {p_rid:CL.rid});
  if(st && schemaNewer(st.data)) throw new Error(CLOUD_NEWER);
  if(!st || !st.data){ CL.version = 0; await cloudPush(true); toast('Verbunden. Ihre Daten liegen jetzt in der Cloud.'); }
  else {
    openDialog('Cloud-Daten gefunden', `<p class="dlg-p">Für <b>${esc(CL.rname)}</b> gibt es bereits Daten in der Cloud (Stand ${fmtDate(st.updated_at||new Date().toISOString())}, ${esc(st.updated_by||'Team')}). Was soll passieren?</p>
      <div class="togs" style="flex-direction:column;align-items:flex-start"><label class="tog"><input type="radio" name="how" value="cloud" checked><span></span>Cloud-Daten auf dieses Gerät laden (empfohlen)</label><label class="tog"><input type="radio" name="how" value="local"><span></span>Daten dieses Geräts in die Cloud hochladen und dort ersetzen</label></div>`,
      fd => { if(fd.get('how') === 'cloud'){ S = migrate(st.data) || S; CL.version = st.version; baseSet(st.data); } else { CL.version = st.version; baseSet(st.data); dirty = true; } clSave(); setTimeout(() => { cloudPush(); syncPhotos(); }, 50); },
      {ok:'Weiter', done:'Mit der Cloud verbunden', cancel:'Abbrechen'});
  }
  setCloud('ok'); clearInterval(pollTimer); pollTimer = setInterval(cloudPoll, 20000);
}

/* ---------- Fotos im Cloud-Speicher ---------- */
function referencedImgs(){
  const ids = new Set(); const add = x => x && ids.add(x);
  S.menu.forEach(m=>add(m.img)); S.cards.forEach(c=>{ add(c.img); (c.steps||[]).forEach(s=>add(s.img)); });
  Object.values(S.settings.seasons||{}).forEach(s=>add(s.cover)); (S.orders||[]).forEach(o=>{ add(o.receipt?.photo); add(o.receiptDraft?.photo); });
  return [...ids];
}
async function dataUrlToBlob(d){ return (await fetch(d)).blob(); }
function blobToDataUrl(b){ return new Promise((res,rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(b); }); }
async function uploadImg(id){ if(!cloudReady() || !IMG[id]) return; try { await clFetch(`/storage/v1/object/photos/${CL.rid}/${id}.jpg`, {method:'POST', body:await dataUrlToBlob(IMG[id]), headers:{'x-upsert':'true', 'Content-Type':'image/jpeg'}}); CL.up = CL.up || {}; CL.up[id] = 1; clSave(); } catch(e){} }
async function syncPhotos(){
  if(!cloudReady()) return; let got = 0;
  for(const id of referencedImgs()){
    if(!IMG[id]){ try { const r = await clFetch(`/storage/v1/object/authenticated/photos/${CL.rid}/${id}.jpg`, {raw:true}); const d = await blobToDataUrl(await r.blob()); IMG[id] = d; try { idb && idb.transaction('img','readwrite').objectStore('img').put(d, id); } catch(e){} got++; } catch(e){} }
    else if(!(CL.up||{})[id]) await uploadImg(id);
  }
  if(got) render();
}
const _imgPut = imgPut; imgPut = function(id, data){ _imgPut(id, data); if(cloudReady()) uploadImg(id); };

/* ---------- Bestellung per Server senden ---------- */
async function cloudSendOrder(o){
  const sp = SUP(o.supplier);
  const res = await clFetch('/functions/v1/send-order', {method:'POST', body:{rid:CL.rid, orderNo:o.no, to:sp.email, subject:`Bestellung ${o.no} – ${S.settings.name}`, text:orderText(o), replyTo:S.settings.email}});
  o.status = 'sent'; o.sentAt = new Date().toISOString(); o.sentVia = 'E-Mail (automatisch)'; o.sentBy = me().id; o.mailId = res && res.id || ''; save(); render();
  toast(`${o.no} an ${sp.email} gesendet`);
}

/* ---------- Speichern koppeln ---------- */
const _save = save; save = function(){ _save(); if(cloudReady()) schedulePush(); };
window.addEventListener('online', () => cloudReady() && cloudPoll());
document.addEventListener('visibilitychange', () => { if(!document.hidden) cloudPoll(); });

/* ---------- Einstellungen (neu, mit Team, Einkauf und Cloud) ---------- */
renderSetup = function(){
  const n = Object.keys(IMG).length, s = S.settings, u = me();
  const cloud = cloudReady();
  return `<div class="page-h"><div><div class="eyebrow">Betrieb, Team & Daten</div><h1>Einstellungen</h1></div></div>
  <div class="row-btns m-only" style="margin-bottom:14px"><button type="button" class="btn" data-tab="report">${ico('report')}Auswertung</button><button type="button" class="btn" data-tab="products">${ico('products')}Produkte & Preise</button><button type="button" class="btn" data-tab="labor">${ico('labor')}Rezept-Labor</button></div>
  <div class="setup-grid">
    <section class="panel"><div class="panel-h"><h2>Kalkulation</h2></div><div class="fields">
      <label class="f">Name des Betriebs<input id="s-name" data-sf="name" value="${esc(s.name)}"></label>
      <label class="f">MwSt. Speisen, %<input id="s-vat" class="num-in" data-sf="vat" data-num="req de" data-max="100" data-msg="MwSt. muss zwischen 0 und 100 liegen, nicht geändert" type="text" inputmode="decimal" value="${numIn(s.vat)}"></label>
      <label class="f">Ziel-Wareneinsatz, %<input id="s-target" class="num-in" data-sf="target" data-num="req de" data-min="1" data-max="100" data-msg="Ziel-Wareneinsatz muss zwischen 1 und 100 liegen, nicht geändert" type="text" inputmode="decimal" value="${numIn(s.target)}"></label>
    </div><p class="hint">In Österreich gilt für Speisen der ermäßigte Steuersatz von 10 %. Der Wareneinsatz wird vom Preis exkl. MwSt. berechnet.</p></section>
    <section class="panel"><div class="panel-h"><h2>Einkauf</h2></div><div class="fields two">
      <label class="f">Lieferadresse<input data-us="addr" data-k="address" value="${esc(s.address)}"></label>
      <label class="f">Hinweis für Fahrer<input data-us="addr" data-k="deliveryNote" value="${esc(s.deliveryNote)}"></label>
      <label class="f">Telefon für Rückfragen<input data-us="addr" data-k="phone" value="${esc(s.phone)}"></label>
      <label class="f">Antwort-E-Mail<input data-us="addr" data-k="email" type="email" value="${esc(s.email)}"></label>
      <label class="f">Freigabe ab €<input id="s-limit" class="num-in" data-us="limit" data-num="req de" data-msg="Ungültiger Betrag, nicht geändert" type="text" inputmode="decimal" value="${numIn(s.orderLimit)}"></label>
    </div><p class="hint">Bestellungen über diesem Betrag muss der Inhaber freigeben. Die Bar bestellt Getränke und Wein, der Küchenchef alles andere.</p></section>
    <section class="panel"><div class="panel-h"><h2>Wer arbeitet gerade?</h2><span class="muted sm">${esc(whoLabel(u))}</span></div>
      ${cloud ? `<p class="hint">Mit der Cloud verbunden: Name und Rolle kommen aus Ihrem Konto. Neue Mitarbeiter fügt der Inhaber im Cloud-Projekt hinzu (siehe Anleitung).</p>`
      : `<div class="who">${s.users.map(x=>`<button type="button" class="who-b ${s.currentUser===x.id?'on':''}" data-act="userSwitch" data-id="${x.id}" aria-pressed="${s.currentUser===x.id}"><b>${esc(x.name)}</b>${x.name===ROLES[x.role]?'':`<small>${ROLES[x.role]}</small>`}<small class="who-can">${{owner:'darf alles', chef:'Küche, Karte, Preise', bar:'Getränke bestellen', staff:'ansehen, Lager buchen'}[x.role]||''}</small></button>`).join('')}</div>
        <p class="hint">Ohne Cloud ist das eine Auswahl auf diesem Gerät, ohne Passwort. Mit der Cloud meldet sich jeder mit eigenem Konto an.</p>`}
    </section>
    <section class="panel ${cloud?'':'accent'}"><div class="panel-h"><h2>Cloud & Team</h2>${cloud?`<span class="cloud-chip ${cloudState}">${{ok:'synchron',busy:'speichert …',offline:'offline',err:'Fehler',off:''}[cloudState]}</span>`:''}</div>
      ${FRAMED ? `<p class="hint">Die Cloud funktioniert in der installierten Version der App auf Ihrer Website. In dieser Vorschau ist sie abgeschaltet.</p>`
      : cloud ? `<div class="kv"><span>Betrieb</span><span>${esc(CL.rname)}</span><span>Angemeldet</span><span>${esc(whoLabel(CL.member))}</span><span>Konto</span><span>${esc(CL.email)}</span><span>Stand</span><span>${{ok:'alles übertragen', busy:'wird übertragen …', offline:'kein Internet', err:'nicht übertragen'}[cloudState]||'—'}</span></div>
          ${cloudMsg?`<p class="hint">${esc(cloudMsg)}</p>`:''}
          <div class="row-btns" style="margin-top:12px"><button type="button" class="btn" data-act="cloudSync">Jetzt abgleichen</button><button type="button" class="btn danger" data-act="cloudOut">Abmelden</button></div>`
      : `<p class="hint" style="margin-top:0">Mit der Cloud sehen Küche, Bar und Büro auf allen Geräten dieselben Daten und Fotos, und Bestellungen gehen mit einem Klick per E-Mail raus. Sie brauchen dafür ein eigenes Cloud-Projekt; Adresse und Schlüssel stehen in der Einrichtungs-Anleitung (Ordner <b>dahuam/cloud</b>) oder kommen von der Person, die es eingerichtet hat.</p>
          <form id="cloudForm" class="cloud-form" novalidate>
            <label class="f">Adresse des Cloud-Projekts<input name="url" type="url" required inputmode="url" autocomplete="off" placeholder="https://…" value="${esc(CL.url||'')}"></label>
            <label class="f">Schlüssel des Projekts<input name="anon" required autocomplete="off" placeholder="lange Zeichenfolge aus der Anleitung" value="${esc(CL.anon||'')}"></label>
            <label class="f">Ihre E-Mail<input name="email" type="email" required autocomplete="username" value="${esc(CL.email||'')}"></label>
            <label class="f">Passwort<input name="pw" type="password" required autocomplete="current-password"></label>
            <div class="row-btns"><button type="submit" class="btn primary">Verbinden</button></div>
            <p class="hint bad-t" id="cloudErr" role="alert"></p>
          </form>`}
    </section>
    <section class="panel"><div class="panel-h"><h2>Startanimation</h2></div>
      <label class="f">Beim Öffnen der App<select data-intro="1">${[['candle','Kerzenschein'],['plate','Teller wie auf der Website'],['off','Keine']].map(([k,l])=>`<option value="${k}" ${(()=>{ try { return (localStorage.getItem(KEY+'_intro')||'candle')===k; } catch(e){ return k==='candle'; } })()?'selected':''}>${l}</option>`).join('')}</select></label>
      <div class="row-btns" style="margin-top:10px"><button type="button" class="btn sm" data-act="introNow">Jetzt ansehen</button></div><p class="hint">Erscheint einmal pro Sitzung und lässt sich mit einem Tipp überspringen.</p></section>
    <section class="panel"><div class="panel-h"><h2>Daten</h2><span class="muted sm">${n} Fotos gespeichert</span></div>
      <p class="hint">${cloud ? 'Die Daten liegen in der Cloud und zusätzlich auf diesem Gerät. Eine Sicherung als Datei schadet trotzdem nicht.' : 'Daten und Fotos werden nur in diesem Browser gespeichert. Erstellen Sie regelmäßig eine Sicherung.'}</p>
      <div class="row-btns wrap" style="margin-top:12px"><button type="button" class="btn" data-act="export">Sicherung erstellen</button>
        <button type="button" class="btn" data-act="importPick">Sicherung laden</button><input id="importFile" type="file" accept="application/json,.json" hidden>
        <button type="button" class="btn danger" data-act="reset">Demodaten wiederherstellen</button></div>
      ${(() => { const sf = safetyGet(); return sf ? `<div class="safety"><span><b>Sicherheitskopie vom ${fmtDate(sf.at)}</b><small class="muted">${esc(sf.why||'')} · ${plural(+sf.nMenu||0,'Gericht','Gerichte')}, ${plural(+sf.nCards||0,'Rezeptur','Rezepturen')}</small></span><span class="row-btns"><button type="button" class="btn sm" data-act="safetyRestore">Letzte Daten wiederherstellen</button><button type="button" class="btn sm" data-act="safetyDl">Als Datei speichern</button></span></div>` : ''; })()}
    </section>
  </div>`;
};
document.addEventListener('submit', async e => {
  if(e.target.id !== 'cloudForm') return; e.preventDefault();
  const f = e.target, btn = f.querySelector('button[type=submit]'), err = $('#cloudErr');
  btn.disabled = true; btn.textContent = 'Verbinde …'; err.textContent = '';
  const miss = ['url','anon','email','pw'].find(k => !f[k].value.trim());
  if(miss){ err.textContent = {url:'Bitte die Adresse des Cloud-Projekts eintragen.', anon:'Bitte den Schlüssel des Projekts eintragen.', email:'Bitte Ihre E-Mail eintragen.', pw:'Bitte das Passwort eintragen.'}[miss]; f[miss].focus(); btn.disabled = false; btn.textContent = 'Verbinden'; return; }
  if(!/^https:\/\/[^\s/]+\.[^\s/]+/i.test(f.url.value.trim())){ err.textContent = 'Die Adresse muss mit https:// beginnen, zum Beispiel https://meinbetrieb.example.'; f.url.focus(); btn.disabled = false; btn.textContent = 'Verbinden'; return; }
  try { await cloudConnectFlow(f.url.value, f.anon.value, f.email.value, f.pw.value); render(); }
  catch(x){ CL.session = null; err.textContent = cloudErrText(x); btn.disabled = false; btn.textContent = 'Verbinden'; }
});
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  if(el.dataset.act === 'cloudSync'){ try { await cloudPull(false); await cloudPush(); await syncPhotos(); toast('Alles übertragen'); render(); } catch(x){ toast('Übertragen fehlgeschlagen. ' + cloudErrText(x)); } }
  if(el.dataset.act === 'cloudOut') ask('Von der Cloud abmelden? Die Daten bleiben auf diesem Gerät.', () => cloudLogout(), 'Abmelden');
  if(el.dataset.act === 'ordCloudSend'){ const o = ORD(el.dataset.id); el.disabled = true; el.textContent = 'Sende …'; try { await cloudSendOrder(o); } catch(x){ el.disabled = false; el.textContent = 'Jetzt per E-Mail senden'; info('Senden fehlgeschlagen', cloudErrText(x) + ' Die Bestellung ist nicht gesendet. Nutzen Sie „E-Mail öffnen“ oder versuchen Sie es später noch einmal.'); } }
});

document.addEventListener('change', e => { const t = e.target; if(t.dataset.intro){ try { localStorage.setItem(KEY+'_intro', t.value); } catch(x){} toast('Startanimation: '+t.options[t.selectedIndex].text); } });
document.addEventListener('click', e => { const el = e.target.closest('[data-act="introNow"]'); if(el){ try { sessionStorage.removeItem('dahuam202_intro'); } catch(x){} location.reload(); } });
