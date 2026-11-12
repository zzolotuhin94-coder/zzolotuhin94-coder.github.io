/* =====================================================================
   Willkommen: die erste Seite beim ersten Öffnen auf einem Gerät.
   Widmung oben, drei Schritte, eine ehrliche Zeile zu den Daten.
   Danach jederzeit wieder: Einstellungen › Hilfe › Willkommen, oder die Suche.

   WIDMUNG
   Dieses Repository ist öffentlich: hier stehen KEINE Namen. Die Widmung wird
   nur auf den Geräten der Chefs gesetzt, entweder
     · in der App: Einstellungen › Mehr Optionen › Widmung, oder
     · mit dem Geschenk-Link, den man dort erstellt (…/index.html#willkommen=…).
   Was hier in WELCOME_GIFT steht, gilt nur, solange auf dem Gerät nichts
   eingetragen ist. Leer lassen = neutraler Text ohne Namen.
   ===================================================================== */
const WELCOME_GIFT = {from:'', to:'', text:''};
const WL_DEFAULT = {to:'DAHUAM.202', text:'Damit Küche, Karte und Einkauf an einem Ort sind.'};
const WL_MAX = {from:60, to:60, text:400};
const WL_KEY = KEY + '_welcome';
const ANLEITUNG_PDF = 'Anleitung-DAHUAM202.pdf';
const ANLEITUNG_WEB = 'https://zzolotuhin94-coder.github.io/dahuam/' + ANLEITUNG_PDF;
const WL = {el:null, bip:null, installed:false, pending:null, from:null, pdf:null, gift:''};

/* ---------- Widmung: bereinigen, lesen, Link kodieren ---------- */
function wlClean(o){
  const g = {from:'', to:'', text:''};
  if(!o || typeof o !== 'object' || Array.isArray(o)) return g;
  for(const k of ['from', 'to', 'text']){
    let v = typeof o[k] === 'string' ? o[k] : '';
    v = v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '');
    v = k === 'text' ? v.split('\n').map(x => x.replace(/\s+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim() : v.replace(/\s+/g, ' ').trim();
    if(k === 'to') v = v.replace(/^für\s+/i, '');   // „Für“ steht schon davor
    g[k] = [...v].slice(0, WL_MAX[k]).join('').trim();
  }
  return g;
}
const wlEmpty = g => !g || !(g.from || g.to || g.text);
const wlSame = (a, b) => ['from', 'to', 'text'].every(k => (a[k] || '') === (b[k] || ''));
function wlStored(){ return wlClean(S && S.settings && S.settings.gift); }
function wlGift(){ const s = wlStored(); return wlEmpty(s) ? wlClean(WELCOME_GIFT) : s; }
/* UTF-8 → Base64 (URL-sicher, ohne „=“). Umlaute, Akzente und Gedankenstriche überstehen den Weg. */
function wlEnc(g){
  const c = wlClean(g); const o = {}; ['to', 'text', 'from'].forEach(k => { if(c[k]) o[k] = c[k]; });
  const bytes = new TextEncoder().encode(JSON.stringify(o)); let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function wlDec(str){
  try {
    if(typeof str !== 'string' || !str || str.length > 3000 || !/^[A-Za-z0-9_-]+$/.test(str)) return null;
    let s = str.replace(/-/g, '+').replace(/_/g, '/'); while(s.length % 4) s += '=';
    const bin = atob(s); const bytes = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const o = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
    const g = wlClean(o); return wlEmpty(g) ? null : g;
  } catch(e){ return null; }
}
function wlBase(){ try { const u = new URL(location.href); u.hash = ''; ['fresh', 'nointro', 'nosw'].forEach(k => u.searchParams.delete(k)); return u.toString().replace(/#$/, ''); } catch(e){ return location.href.split('#')[0]; } }
function wlLink(g){ return wlBase() + '#willkommen=' + wlEnc(g); }

/* ---------- Geschenk-Link in der Adresse: übernehmen und sofort aus der Adresse nehmen ---------- */
function wlTake(){
  let h = ''; try { h = location.hash.slice(1); } catch(e){ return false; }
  try { h = decodeURIComponent(h); } catch(e){}
  const m = /(?:^|[&/?])willkommen=([^&]*)/.exec(h); if(!m) return false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch(e){}
  const g = wlDec(m[1].trim()); if(g) WL.pending = g;   // kaputte Links: still ignorieren
  return true;
}
wlTake();
const _fromHashWl = fromHash;
fromHash = function(){ if(wlTake()){ if(S && WL.pending) wlFromLink(); try { hashSync(); } catch(e){} return; } return _fromHashWl(); };

/* Widmung aus dem Link: ist noch keine da, wird sie gespeichert; sonst fragt die Willkommensseite leise nach */
function wlFromLink(){
  const g = WL.pending; WL.pending = null; if(!g || !S) return;
  const cur = wlStored();
  if(wlEmpty(cur)){ S.settings.gift = g; save(); WL.from = null; }
  else if(wlSame(cur, g)) WL.from = null;
  else WL.from = g;
  wlOpen();
}

/* ---------- Erster Start (aus guide.js) ---------- */
function wlSeen(){ try { return localStorage.getItem(WL_KEY) === '1'; } catch(e){ return false; } }
function wlFirstRun(){
  if(!S || REL.recover) return;
  if(WL.pending){ wlFromLink(); return; }
  if(G_NOINTRO || GP.asked || GP.tour || wlSeen()) return;
  try { if(STORE.isReader()) return; } catch(e){}
  wlOpen();
}

/* ---------- Gerät: wie kommt die App auf den Home-Bildschirm? ---------- */
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); WL.bip = e; wlHomeRefresh(); });
window.addEventListener('appinstalled', () => { WL.installed = true; WL.bip = null; wlHomeRefresh(); });
function wlDevice(){
  const ua = navigator.userAgent || '';
  let standalone = false; try { standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch(e){}
  if(standalone) return 'app';
  if(/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if(/Android/.test(ua)) return 'android';
  return 'desktop';
}
const WL_SHARE = '<svg class="wl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
function wlHome(){
  const off = 'Nach dem ersten Öffnen läuft sie auch ohne Internet.';
  if(WL.installed) return `<p>Die App ist installiert und liegt jetzt auf dem Home-Bildschirm. ${off}</p>`;
  if(FRAMED) return `<p>In dieser Vorschau geht das nicht. Öffnen Sie die App über ihre Adresse in Safari oder Chrome, dann lässt sie sich zum Home-Bildschirm hinzufügen.</p>`;
  const d = wlDevice();
  if(d === 'app') return `<p>Sie nutzen die App bereits vom Home-Bildschirm aus. ${off}</p>`;
  if(WL.bip) return `<p>Mit einem Tipp liegt die App wie jede andere auf dem Home-Bildschirm. ${off}</p><div class="wl-inline"><button type="button" class="btn sm" data-wl="install">App installieren</button></div>`;
  if(d === 'ios') return `<p>Tippen Sie in Safari auf das Teilen-Symbol ${WL_SHARE} und dann auf <b>„Zum Home-Bildschirm“</b>. ${off}</p>`;
  if(d === 'android') return `<p>Tippen Sie in Chrome oben rechts auf das Menü <b>⋮</b> und dann auf <b>„App installieren“</b> oder <b>„Zum Startbildschirm hinzufügen“</b>. ${off}</p>`;
  return `<p>Am besten öffnen Sie diese Seite am Handy oder Tablet und legen sie dort auf den Home-Bildschirm. ${off}</p>`;
}
function wlHomeRefresh(){ const n = WL.el && WL.el.querySelector('#wlHome'); if(n) n.innerHTML = wlHome(); }

/* ---------- Anleitung als PDF: eigene Datei, in der Vorschau die Website ---------- */
function wlPdfHref(){ return FRAMED || !/^https?:$/.test(location.protocol) || WL.pdf === false ? ANLEITUNG_WEB : ANLEITUNG_PDF; }
function wlPdfCheck(){
  if(WL.pdf !== null || FRAMED || !/^https?:$/.test(location.protocol)) return;
  // mit Offline-Paket liegt die Datei im Cache (sw.js); ohne Netz nicht nachfragen, der Cache liefert sie beim Öffnen
  try { if(navigator.onLine === false || (navigator.serviceWorker && navigator.serviceWorker.controller)) return; } catch(e){}
  WL.pdf = true;
  try { fetch(ANLEITUNG_PDF, {method:'HEAD', cache:'no-store'}).then(r => { if(r.status === 404){ WL.pdf = false; document.querySelectorAll('a[data-wl-pdf]').forEach(a => { a.href = ANLEITUNG_WEB; }); } }, () => {}); } catch(e){}
}
const wlPdfLink = (cls, label) => `<a class="${cls}" data-wl-pdf href="${esc(wlPdfHref())}" target="_blank" rel="noopener">${label}</a>`;
function wlPdfRow(){ wlPdfCheck(); return `<li><span class="gd-r-t"><b>Anleitung als PDF</b><small>Erste Schritte auf drei Seiten, zum Lesen oder Ausdrucken.</small></span>${wlPdfLink('btn sm', 'Öffnen')}</li>`; }

/* ---------- Die Seite ---------- */
function wlDedication(g, cls){
  const to = g.to || WL_DEFAULT.to, text = g.text || WL_DEFAULT.text;
  return `<div class="wl-ded ${cls || ''}"><p class="wl-for">Für ${esc(to)}</p><p class="wl-text">${esc(text).replace(/\n/g, '<br>')}</p>${g.from ? `<p class="wl-from">${esc(g.from)}</p>` : ''}</div>`;
}
function wlHtml(){
  const cloud = typeof cloudReady === 'function' && cloudReady();
  const ded = WL.from
    ? wlDedication(WL.from) + `<div class="wl-ask" role="group" aria-label="Neue Widmung"><span>Dieser Link bringt eine neue Widmung mit. Auf diesem Gerät steht schon eine andere.</span><span class="wl-ask-b"><button type="button" class="link" data-wl="giftYes">Übernehmen</button><button type="button" class="link" data-wl="giftNo">Bisherige behalten</button></span></div>`
    : wlDedication(wlGift());
  return `<div class="wl-in">
    <header class="wl-top"><span class="wl-logo" aria-hidden="true"></span>${ded}</header>
    <h1 class="wl-h" id="wlT" tabindex="-1">So fangen Sie an</h1>
    <ol class="wl-steps">
      <li><span class="wl-n" aria-hidden="true">1</span><div><h2>Beispiele ansehen</h2><p>Die App ist mit Beispieldaten gefüllt: Gerichte, Rezepturen, Artikel und Lieferanten. Probieren Sie alles aus. Die Beispiele lassen sich jederzeit wiederherstellen.</p></div></li>
      <li><span class="wl-n" aria-hidden="true">2</span><div><h2>Eigene Daten</h2><p>Laden Sie Ihre Speisekarte, Artikel und Rezepturen aus Dateien, oder starten Sie leer. Zu jedem Import gibt es eine Vorlage, und jeder Import lässt sich rückgängig machen.</p><div class="wl-inline"><button type="button" class="link" data-wl="daten">Eigene Daten öffnen</button></div></div></li>
      <li><span class="wl-n" aria-hidden="true">3</span><div><h2>Aufs Handy</h2><div id="wlHome">${wlHome()}</div></div></li>
    </ol>
    <p class="wl-note">${cloud ? 'Mit der Cloud verbunden: Ihre Daten liegen auf diesem Gerät und in Ihrem Cloud-Projekt.' : 'Ihre Daten bleiben auf diesem Gerät, die App schickt nichts davon weg.'} Jedes Gerät hat seine eigenen Daten. Speichern Sie deshalb regelmäßig eine <button type="button" class="link" data-wl="backup">Sicherung</button>.</p>
    <div class="wl-acts"><button type="button" class="btn primary" data-wl="go">Los geht’s</button><button type="button" class="btn" data-wl="tour">Kurzer Rundgang</button></div>
    <p class="wl-pdf">${wlPdfLink('link', 'Anleitung als PDF')}</p>
  </div>`;
}
function wlOpen(){
  if(!S) return;
  wlPdfCheck();
  try { if(GD.t) tourEnd(true); if(HELP_ON) helpSet(false); palClose(); mehrClose(); const d = document.querySelector('dialog[open]'); if(d) d.close(); } catch(e){}
  if(WL.el) WL.el.remove();
  const el = document.createElement('div'); el.id = 'wl'; el.className = 'wl'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Willkommen');
  el.innerHTML = wlHtml(); WL.el = el; WL.back = document.activeElement;
  document.body.appendChild(el); document.documentElement.classList.add('wl-on');
  requestAnimationFrame(() => el.classList.add('in'));
  const h = el.querySelector('#wlT'); try { el.scrollTop = 0; (h || el).focus({preventScroll:true}); } catch(e){}
}
function wlClose(then){
  if(!WL.el) return;
  if(WL.from){ WL.from = null; }                     // nichts gewählt: die bisherige Widmung bleibt
  try { localStorage.setItem(WL_KEY, '1'); } catch(e){}
  GP.asked = 1; gpSave();
  WL.el.remove(); WL.el = null; document.documentElement.classList.remove('wl-on');
  if(then) then();
  else { const b = WL.back; if(b && b.isConnected && b !== document.body && b.focus) try { b.focus({preventScroll:true}); } catch(e){} }
}
function wlBackup(){ go('setup'); setTimeout(() => { const n = document.getElementById('setupDaten'); if(n){ n.scrollIntoView({block:'start'}); const b = n.querySelector('[data-act="export"]'); if(b) b.focus({preventScroll:true}); } }, 60); }
async function wlInstall(btn){
  const e = WL.bip; if(!e) return; btn.disabled = true;
  try { await e.prompt(); await e.userChoice; } catch(x){}
  WL.bip = null; wlHomeRefresh();                    // „installiert“ steht erst da, wenn der Browser es meldet (appinstalled)
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#wl [data-wl]'); if(!b) return; const a = b.dataset.wl;
  if(a === 'go') wlClose(() => { if(view.tab !== 'dash') go('dash'); });
  else if(a === 'tour') wlClose(() => { go('dash'); setTimeout(tourStart, 120); });
  else if(a === 'daten') wlClose(() => datenOpen(''));
  else if(a === 'backup') wlClose(wlBackup);
  else if(a === 'install') wlInstall(b);
  else if(a === 'giftYes'){ S.settings.gift = WL.from; WL.from = null; save(); const t = WL.el.querySelector('.wl-top'); t.innerHTML = '<span class="wl-logo" aria-hidden="true"></span>' + wlDedication(wlGift()); toast('Widmung übernommen'); WL.el.querySelector('#wlT').focus({preventScroll:true}); }
  else if(a === 'giftNo'){ WL.from = null; const t = WL.el.querySelector('.wl-top'); t.innerHTML = '<span class="wl-logo" aria-hidden="true"></span>' + wlDedication(wlGift()); WL.el.querySelector('#wlT').focus({preventScroll:true}); }
});
window.addEventListener('keydown', e => {
  if(!WL.el) return;
  if(e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); wlClose(); return; }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); e.stopImmediatePropagation(); return; }
  if(e.key === 'Tab'){
    const list = [...WL.el.querySelectorAll('button:not([disabled]), a[href]')]; if(!list.length) return;
    const i = list.indexOf(document.activeElement);
    if(i < 0 || (e.shiftKey && i === 0) || (!e.shiftKey && i === list.length - 1)){ e.preventDefault(); e.stopImmediatePropagation(); list[e.shiftKey ? (i <= 0 ? list.length - 1 : i - 1) : (i < 0 || i === list.length - 1 ? 0 : i + 1)].focus(); }
  }
}, true);

/* ---------- Einstellungen: Widmung und Geschenk-Link ---------- */
function wlGiftPanel(){
  const g = wlStored();
  return `<section class="panel wl-gift" id="setupGift"><div class="panel-h"><h2>Widmung</h2></div>
    <p class="hint" style="margin-top:0">Steht oben auf der Willkommensseite. Bleibt nur auf diesem Gerät. Leer lassen für den Satz ohne Namen.</p>
    <div class="fields">
      <label class="f">Für<input data-gift="to" maxlength="${WL_MAX.to}" placeholder="${esc(WL_DEFAULT.to)}" value="${esc(g.to)}" autocomplete="off"></label>
      <label class="f">Text<textarea data-gift="text" maxlength="${WL_MAX.text}" rows="3" placeholder="${esc(WL_DEFAULT.text)}">${esc(g.text)}</textarea></label>
      <label class="f">Von<input data-gift="from" maxlength="${WL_MAX.from}" placeholder="optional" value="${esc(g.from)}" autocomplete="off"></label>
    </div>
    <div class="row-btns wrap" style="margin-top:12px"><button type="button" class="btn sm" data-act="wlOpen">Ansehen</button><button type="button" class="btn sm" data-act="giftLink">Geschenk-Link erstellen</button></div>
    <div id="giftOut"></div>
  </section>`;
}
function wlGiftOut(){
  const box = document.getElementById('giftOut'); if(!box) return;
  const g = wlStored();
  if(wlEmpty(g)){ box.innerHTML = `<p class="hint">Tragen Sie zuerst eine Widmung ein. Der Link nimmt sie auf das andere Gerät mit.</p>`; return; }
  const url = wlLink(g);
  box.innerHTML = `<p class="hint">Diesen Link auf dem Gerät der Chefs öffnen: die Widmung wird dort gespeichert und die Willkommensseite erscheint.</p>
    <div class="gift-row"><input id="giftUrl" readonly value="${esc(url)}" aria-label="Geschenk-Link"><button type="button" class="btn sm" data-act="giftCopy">Kopieren</button></div>`;
}
async function wlGiftCopy(){
  const i = document.getElementById('giftUrl'); if(!i) return;
  let ok = false; try { if(navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(i.value); ok = true; } } catch(e){}
  if(!ok){ try { i.focus(); i.select(); i.setSelectionRange(0, i.value.length); ok = document.execCommand && document.execCommand('copy'); } catch(e){ ok = false; } }
  if(ok) toast('Link kopiert'); else { try { i.focus(); i.select(); } catch(e){} toast('Bitte den markierten Link selbst kopieren'); }
}
document.addEventListener('change', e => {
  const t = e.target; if(!t || !t.dataset || !t.dataset.gift || !S) return;
  const g = {...wlStored(), [t.dataset.gift]: t.value}; const c = wlClean(g);
  S.settings.gift = c; t.value = c[t.dataset.gift]; save(); toast('Gespeichert');
  if(document.getElementById('giftUrl')) wlGiftOut();
});
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-act]'); if(!el) return;
  switch(el.dataset.act){
    case 'wlOpen': wlOpen(); break;
    case 'giftLink': wlGiftOut(); break;
    case 'giftCopy': wlGiftCopy(); break;
  }
});

/* Schnellsuche */
const _palDataWl = palData;
palData = function(){
  const a = _palDataWl();
  a.push({g:'Aktion', n:'Willkommen', s:'Die erste Seite mit den drei Schritten zum Start', run:() => wlOpen()},
    {g:'Aktion', n:'Anleitung als PDF', s:'Erste Schritte zum Lesen oder Ausdrucken', run:() => { try { window.open(wlPdfHref(), '_blank', 'noopener'); } catch(e){} }});
  return a;
};
