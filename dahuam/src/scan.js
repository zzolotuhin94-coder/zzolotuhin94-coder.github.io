/* =====================================================================
   Strichcode-Scanner: Inventur zählen, Artikel nachschlagen, Codes lernen, Wareneingang abhaken
   Ein Artikel hat beliebig viele Codes (p.ean, Liste von Texten), z. B. Flasche und Karton.
   Lesen: eingebauter BarcodeDetector, wo es ihn gibt (Chrome, Android), sonst ZXing (vendor/, lädt erst beim Öffnen).
   Ohne Kamera (keine Erlaubnis, keine sichere Verbindung) geht alles über Code eintippen oder die Suche.
   Die Oberfläche ist eigenständig (#scan, scan.css); in die Seiten greifen nur die Einstiegsknöpfe ein.
   ===================================================================== */
ICO.scan = '<path d="M3.5 8V5.5a2 2 0 0 1 2-2H8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16"/><path d="M7.5 8v8M10.5 8v8M13.5 8v5M16.5 8v8"/>';
ICO.torch = '<path d="M8 3h8v3l-2 3v11a2 2 0 0 1-4 0V9L8 6z"/><path d="M8 6h8M12 12.5v2"/>';
ICO.sound = '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>';
ICO.mute = '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>';
ICO.list = '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>';
ICO.keys = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01M11 9h.01M15 9h.01M7 12.5h.01M11 12.5h.01M15 12.5h.01M8 16h8"/>';
ICO.back = '<path d="M7 8.5L4 12l3 3.5M4 12h16"/>';

const SCAN_LIB = ['vendor/zxing-library.min.js', 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js', () => window.ZXing];
const SC_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'itf', 'qr_code'];
const SC_FMT_LABEL = {ean_13:'EAN-13', ean_8:'EAN-8', upc_a:'UPC-A', upc_e:'UPC-E', code_128:'Code 128', itf:'ITF-14', qr_code:'QR-Code'};

/* ---------- Codes ---------- */
/* Code säubern: Ziffern mit Leerzeichen oder Strichen („900 1234 56789 6“) zusammenziehen, sonst nur Steuerzeichen entfernen */
function eanClean(raw){ const s = String(raw == null ? '' : raw).replace(/[\u0000-\u001f\u007f]/g, '').trim(); if(!s) return ''; if(/^[\d\s\-–.]+$/.test(s)) return s.replace(/\D/g, ''); return s.slice(0, 80); }
/* Vergleichsschlüssel: EAN-8, UPC-A, EAN-13 und GTIN-14 sind alle auf 14 Stellen auffüllbar (UPC-A 036… = EAN-13 0036…) */
function eanKey(code){ const c = eanClean(code); return /^\d+$/.test(c) && [8, 12, 13, 14].includes(c.length) ? c.padStart(14, '0') : c.toUpperCase(); }
function gtinCheck(body){ let t = 0; body.split('').reverse().forEach((c, i) => { t += +c * (i % 2 ? 1 : 3); }); return String((10 - t % 10) % 10); }
function upceToA(c){ if(!/^[01]\d{7}$/.test(c)) return ''; const d = c.slice(1, 7), last = +d[5]; let m;
  if(last <= 2) m = d.slice(0, 2) + last + '0000' + d.slice(2, 5); else if(last === 3) m = d.slice(0, 3) + '00000' + d.slice(3, 5); else if(last === 4) m = d.slice(0, 4) + '00000' + d[4]; else m = d.slice(0, 5) + '0000' + last;
  return c[0] + m + c[7]; }
/* Art und Prüfziffer: {kind, ok}. ok null = ohne Prüfziffer (Code 128, QR, andere Längen) */
function gtinInfo(code, format){
  const c = eanClean(code);
  if(format === 'qr_code') return {kind:'QR-Code', ok:null};
  if(!/^\d+$/.test(c)) return {kind:format === 'code_128' ? 'Code 128' : 'Code', ok:null};
  if(format === 'upc_e' && c.length === 8){ const a = upceToA(c); return {kind:'UPC-E', ok:!!a && gtinCheck(a.slice(0, 11)) === a[11]}; }
  const kind = {8:'EAN-8', 12:'UPC-A', 13:'EAN-13', 14:format === 'itf' ? 'ITF-14' : 'GTIN-14'}[c.length];
  if(!kind) return {kind:format === 'code_128' ? 'Code 128' : 'Code', ok:null};
  return {kind, ok:gtinCheck(c.slice(0, -1)) === c.slice(-1)};
}
function gtinText(code, format){ const g = gtinInfo(code, format); return g.ok === false ? `${g.kind}: Prüfziffer passt nicht. Bitte Code prüfen (wird trotzdem gespeichert).` : g.ok ? `${g.kind} · Prüfziffer stimmt` : g.kind; }
/* mehrere Codes in einem Feld: durch Komma, Strichpunkt, Schrägstrich oder Leerzeichen getrennt (Ziffern-Gruppen wie „900 123“ nicht) */
function eanSplit(raw){ const out = [], seen = new Set();
  String(raw == null ? '' : raw).split(/[,;|\/\n\r\t]+/).forEach(part => {
    // „9001234567896 9009876543210“: lange Zahlen nur mit Leerzeichen dazwischen sind mehrere Codes; „900 1234 56789 6“ ist einer
    const words = part.trim().split(/\s+/).filter(Boolean); const pieces = words.length > 1 && words.every(w => /^\d{8,14}$/.test(w)) ? words : [part];
    pieces.forEach(x => { const c = eanClean(x); const k = eanKey(c); if(c && !seen.has(k)){ seen.add(k); out.push(c); } }); });
  return out; }
function eanOf(p){ return p && Array.isArray(p.ean) ? p.ean : []; }
function eanFind(code, pool){ const k = eanKey(code); if(!k) return null; return (pool || S.products).find(p => eanOf(p).some(c => eanKey(c) === k)) || null; }
/* Code einem Artikel zuordnen (auch das Team darf das: es ist kein Preis). Gehört der Code schon einem anderen Artikel, passiert nichts. */
function eanAdd(p, code){ const c = eanClean(code); if(!p || !c) return {ok:false, err:'Kein Code'}; const o = eanFind(c);
  if(o && o !== p) return {ok:false, other:o, err:`Der Code gehört schon zu „${o.name}“.`};
  if(o === p) return {ok:true, had:true};
  if(!Array.isArray(p.ean)) p.ean = []; p.ean.push(c); return {ok:true}; }
/* Code entfernen: nur der Chef */
function eanRemove(p, code){ if(!canEditAll()) { toast(RO_MSG); return false; } const k = eanKey(code); const n = eanOf(p).length; p.ean = eanOf(p).filter(c => eanKey(c) !== k); return p.ean.length < n; }
/* Umstellung: jeder Artikel bekommt ean: [] (ein alter Text wird zur Liste), sonst bleibt alles, wie es ist */
function scanMigrate(d){
  if(!d || !Array.isArray(d.products)) return d;
  d.products.forEach(p => { if(!p || typeof p !== 'object') return;
    if(!Array.isArray(p.ean)) p.ean = typeof p.ean === 'string' || typeof p.ean === 'number' ? eanSplit(p.ean) : [];
    else { const seen = new Set(); p.ean = p.ean.map(eanClean).filter(c => { const k = eanKey(c); if(!c || seen.has(k)) return false; seen.add(k); return true; }); } });
  return d;
}
const _migrateSc = migrate; migrate = function(d){ const r = _migrateSc(d); if(r) scanMigrate(r); return r; };
const _seedSc = seed; seed = function(){ return scanMigrate(_seedSc()); };

/* ---------- Artikel-Dialog: Feld „EAN / Barcode“ (prodDialog ruft diese drei Funktionen auf) ---------- */
function scanEanField(p){ const v = eanOf(p).join(', ');
  return `<div class="f sc-ean-f"><label for="pdEan">EAN / Barcode</label><span class="sc-ean-in"><input id="pdEan" name="ean" value="${esc(v)}" placeholder="z. B. 9001234567896" autocomplete="off" inputmode="numeric" spellcheck="false"><button type="button" class="icon-btn" id="pdEanScan" title="Code scannen" aria-label="Code scannen">${ico('scan')}</button></span><small class="sc-ean-h" id="pdEanH" aria-live="polite"></small></div>`; }
function scanEanRead(fd, p){
  const raw = fd.get('ean'); if(raw == null) return eanOf(p);
  const codes = eanSplit(raw);
  for(const c of codes){ const o = eanFind(c); if(o && o !== p) return dlgErr('ean', `Der Code ${c} gehört schon zu „${o.name}“. Dort zuerst entfernen.`); }
  const had = eanOf(p).map(eanKey); if(!canEditAll() && had.some(k => !codes.map(eanKey).includes(k))) return dlgErr('ean', 'Codes entfernen kann nur der Chef.');
  return codes;
}
function scanEanBind(f){
  const inp = f.querySelector('#pdEan'), h = f.querySelector('#pdEanH'); if(!inp) return;
  const upd = () => { const codes = eanSplit(inp.value); const bad = codes.filter(c => gtinInfo(c).ok === false);
    h.className = 'sc-ean-h' + (bad.length ? ' warn' : '');
    h.textContent = !codes.length ? 'Mehrere Codes mit Komma trennen, z. B. Flasche und Karton.' : bad.length ? `Prüfziffer passt nicht: ${bad.join(', ')}. Bitte prüfen; gespeichert wird trotzdem.` : codes.map(c => gtinInfo(c).kind).join(' · ') + (codes.some(c => gtinInfo(c).ok) ? ' · Prüfziffer stimmt' : ''); };
  inp.addEventListener('input', upd); upd();
  const sb = f.querySelector('#pdEanScan'); if(SC.open){ sb.hidden = true; return; }   // Dialog über dem laufenden Scanner: der Code steht schon im Feld
  sb.onclick = () => scanOpen('pick', {done:code => { const cur = eanSplit(inp.value); if(!cur.map(eanKey).includes(eanKey(code))) cur.push(code); inp.value = cur.join(', '); upd(); }});
}

/* ---------- Lesen ---------- */
const SC = {open:false, mode:'look', opt:{}, stream:null, track:null, timer:0, engine:null, layer:null, cand:null, cool:{}, torch:false, beep:true, frame:0, lastLoc:'', last:null, undo:null, cam:'', camWanted:false, list:{q:''}, learn:null, cnt:null, hits:0, recvSeen:new Set()};
try { SC.beep = localStorage.getItem(KEY + '_scanton') !== '0'; } catch(e){}
function scZxFormat(Z, f){ return {[Z.BarcodeFormat.EAN_13]:'ean_13', [Z.BarcodeFormat.EAN_8]:'ean_8', [Z.BarcodeFormat.UPC_A]:'upc_a', [Z.BarcodeFormat.UPC_E]:'upc_e', [Z.BarcodeFormat.CODE_128]:'code_128', [Z.BarcodeFormat.ITF]:'itf', [Z.BarcodeFormat.QR_CODE]:'qr_code'}[f] || 'code'; }
async function scanZx(){
  await loadLib(SCAN_LIB); const Z = window.ZXing; if(!Z) throw new Error('Strichcode-Leser fehlt');
  const hints = new Map(); hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.ITF, Z.BarcodeFormat.QR_CODE]); hints.set(Z.DecodeHintType.TRY_HARDER, true);
  const rd = new Z.MultiFormatReader(); rd.setHints(hints); let k = 0;
  return {kind:'zxing', decode:cv => { const B = k++ % 2 ? Z.HybridBinarizer : Z.GlobalHistogramBinarizer;
    try { const r = rd.decodeWithState(new Z.BinaryBitmap(new B(new Z.HTMLCanvasElementLuminanceSource(cv)))); return {code:r.getText(), format:scZxFormat(Z, r.getBarcodeFormat())}; }
    catch(e){ return null; } finally { try { rd.reset(); } catch(e){} } }};
}
async function scanNative(){
  if(!('BarcodeDetector' in window) || window.__scanForceZx) return null;
  try { const sup = await window.BarcodeDetector.getSupportedFormats(); const f = SC_FORMATS.filter(x => sup.includes(x)); if(!f.includes('ean_13')) return null;
    const det = new window.BarcodeDetector({formats:f}); return {kind:'native', detect:async src => { const r = await det.detect(src); return r && r.length ? {code:r[0].rawValue, format:r[0].format} : null; }}; } catch(e){ return null; }
}
async function scanEngine(){ if(!SC.engine) SC.engine = (await scanNative()) || (await scanZx()); return SC.engine; }
/* Ein Bild (Canvas, Bild, ImageData) lesen: {code, format} oder null. Für Tests auch direkt mit ZXing ({zxing:true}). */
async function scanDecodeImage(src, o = {}){
  let cv = src; if(typeof ImageData !== 'undefined' && src instanceof ImageData){ cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; cv.getContext('2d').putImageData(src, 0, 0); }
  else if(!(src instanceof HTMLCanvasElement)){ cv = document.createElement('canvas'); cv.width = src.naturalWidth || src.videoWidth || src.width; cv.height = src.naturalHeight || src.videoHeight || src.height; cv.getContext('2d').drawImage(src, 0, 0); }
  const e = o.zxing ? (SC.zx || (SC.zx = await scanZx())) : await scanEngine();
  if(e.kind === 'native') return await e.detect(cv);
  return e.decode(cv) || e.decode(cv);   // einmal mit jeder Schwelle
}

/* ---------- Oberfläche ---------- */
function scanDom(){
  let r = $('#scan'); if(r) return r;
  r = document.createElement('div'); r.id = 'scan'; r.className = 'sc'; r.hidden = true; r.setAttribute('role', 'dialog'); r.setAttribute('aria-modal', 'true'); r.setAttribute('aria-label', 'Strichcode scannen');
  r.innerHTML = `<div class="sc-cam"><video id="scVideo" playsinline muted autoplay></video><div class="sc-vf" id="scVf" aria-hidden="true"><i></i><i></i><i></i><i></i><span class="sc-laser"></span></div><div class="sc-off" id="scOff" hidden></div></div>
    <header class="sc-top"><button type="button" class="sc-ib" data-sc="close" aria-label="Scanner schließen">${ico('x')}</button><div class="sc-title"><b id="scTitle">Scannen</b><small id="scSub"></small></div><button type="button" class="sc-ib" data-sc="sound" id="scSound"></button><button type="button" class="sc-ib" data-sc="torch" id="scTorch" hidden aria-label="Licht" aria-pressed="false">${ico('torch')}</button></header>
    <p class="sc-hint" id="scHint" role="status" aria-live="polite"></p>
    <div class="sc-last" id="scLast" hidden></div>
    <footer class="sc-bot"><button type="button" class="sc-pill" data-sc="manual">${ico('keys')}<span>Code eintippen</span></button><button type="button" class="sc-pill" data-sc="list">${ico('list')}<span id="scListL">Ohne Code</span></button></footer>
    <section class="sc-sheet" id="scSheet" hidden></section>`;
  document.body.appendChild(r);
  r.addEventListener('click', scanClick);
  r.addEventListener('input', scanInput);
  r.addEventListener('submit', e => { e.preventDefault(); const f = e.target; if(f.id === 'scManF') scanManualGo(); });
  return r;
}
function scanSoundBtn(){ const b = $('#scSound'); if(!b) return; b.innerHTML = ico(SC.beep ? 'sound' : 'mute'); b.setAttribute('aria-label', SC.beep ? 'Ton aus' : 'Ton an'); b.setAttribute('aria-pressed', String(SC.beep)); }
function scanInv(){ return SC.mode === 'inv' && S.invDraft ? S.invDraft : null; }
function scanPool(){ return SC.mode === 'inv' || SC.mode === 'recv' ? stockProducts() : S.products; }
function scanCoolP(p, ms){ eanOf(p).forEach(c => { SC.cool[eanKey(c)] = Date.now() + ms; }); }
function scanOrder(){ return SC.mode === 'recv' && SC.opt.order ? (S.orders || []).find(o => o.id === SC.opt.order) || null : null; }
function scanCounted(pid){ const d = S.invDraft; return !!d && d.counts[pid] !== undefined && d.counts[pid] !== ''; }
function scanHead(){
  const t = $('#scTitle'), s = $('#scSub'); if(!t) return; const d = scanInv(), o = scanOrder();
  if(d){ const items = invProducts(); const done = items.filter(p => scanCounted(p.id)).length; t.textContent = 'Inventur'; s.textContent = `${done} von ${items.length} gezählt`; }
  else if(o){ t.textContent = 'Wareneingang'; s.textContent = `${o.no} · ${SC.recvSeen.size} von ${o.lines.length} Positionen gescannt`; }
  else if(SC.mode === 'pick'){ t.textContent = 'Code scannen'; s.textContent = 'für den Artikel'; }
  else { t.textContent = 'Artikel scannen'; s.textContent = 'Bestand, Lagerort, Preis'; }
  const ll = $('#scListL'); if(ll) ll.textContent = d ? 'Ohne Code zählen' : 'Artikel suchen';
  $('#scan').querySelector('.sc-bot [data-sc="list"]').hidden = SC.mode === 'pick';
}
function scanHint(txt){ const h = $('#scHint'); if(h) h.textContent = txt; }

/* Öffnen: mode 'inv' (laufende Inventur), 'look' (nachschlagen), 'pick' (Code für ein Feld), 'recv' (Wareneingang). opt.list: gleich die Liste, ohne Kamera. */
function scanOpen(mode, opt = {}){
  if(mode === 'inv' && !S.invDraft) mode = 'look';
  const r = scanDom(); const dlg = $('#dlg'); SC.dlgHidden = false;
  if(dlg && dlg.open){ SC.dlgHidden = true; dlg.close(); }   // aus einem Dialog geöffnet (Feld „EAN“): Dialog kurz weg, danach wieder da, Eingaben bleiben
  SC.open = true; SC.mode = mode; SC.opt = opt; SC.layer = null; SC.cand = null; SC.cool = {}; SC.last = null; SC.undo = null; SC.list = {q:''}; SC.recvSeen = new Set();
  r.hidden = false; document.documentElement.classList.add('sc-open');
  document.querySelectorAll('body > *').forEach(n => { if(n !== r && n.id !== 'dlg' && n.id !== 'toast' && n.tagName !== 'SCRIPT' && !n.inert){ n.inert = true; n.dataset.scInert = '1'; } });
  $('#pal') && !$('#pal').hidden && palClose();
  scanSoundBtn(); scanHead(); scanLastDraw(); $('#scSheet').hidden = true; $('#scSheet').innerHTML = '';
  scanAudio(true);
  if(opt.list){ SC.camWanted = false; r.classList.add('no-cam'); scanList(); }
  else { SC.camWanted = true; r.classList.remove('no-cam'); scanCamStart(); r.querySelector('[data-sc="close"]').focus(); }
}
function scanClose(){
  if(!SC.open) return; SC.open = false; scanCamStop(); const r = $('#scan'); r.hidden = true; $('#scSheet').innerHTML = ''; SC.layer = null;
  document.documentElement.classList.remove('sc-open');
  document.querySelectorAll('[data-sc-inert]').forEach(n => { n.inert = false; delete n.dataset.scInert; });
  const cb = SC.opt.onClose; SC.opt = {}; render();
  if(SC.dlgHidden){ SC.dlgHidden = false; try { $('#dlg').showModal(); } catch(e){} }
  if(cb) cb();
}
async function scanCamStart(){
  const r = $('#scan'); const off = $('#scOff'); off.hidden = true; r.classList.remove('cam-off', 'cam-on'); scanHint('Kamera wird gestartet …');
  if(!window.isSecureContext) return scanCamFail('insecure');
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return scanCamFail('nocam');
  let st;
  try { st = await navigator.mediaDevices.getUserMedia({audio:false, video:{facingMode:{ideal:'environment'}, width:{ideal:1280}, height:{ideal:720}}}); }
  catch(e){ const n = e && e.name; return scanCamFail(n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError' ? 'denied' : n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'DevicesNotFoundError' ? 'nocam' : 'error'); }
  if(!SC.open || !SC.camWanted){ st.getTracks().forEach(t => t.stop()); return; }
  SC.stream = st; SC.track = st.getVideoTracks()[0];
  const v = $('#scVideo'); v.setAttribute('playsinline', ''); v.muted = true; v.srcObject = st; try { await v.play(); } catch(e){}
  let caps = {}; try { caps = SC.track.getCapabilities ? SC.track.getCapabilities() : {}; } catch(e){}
  const tb = $('#scTorch'); tb.hidden = !caps.torch; SC.torch = false; tb.setAttribute('aria-pressed', 'false'); tb.classList.remove('on');
  r.classList.add('cam-on'); SC.cam = 'on';
  try { await scanEngine(); } catch(e){ return scanCamFail('lib'); }
  scanHint(scanIdleHint()); scanLoop();
}
function scanIdleHint(){ return SC.mode === 'pick' ? 'Strichcode in den Rahmen halten' : scanInv() ? 'Strichcode in den Rahmen halten. Nach dem Speichern geht es gleich weiter.' : 'Strichcode in den Rahmen halten'; }
function scanCamStop(){ clearTimeout(SC.timer); SC.timer = 0; if(SC.stream) SC.stream.getTracks().forEach(t => { try { t.stop(); } catch(e){} }); SC.stream = null; SC.track = null; const v = $('#scVideo'); if(v) v.srcObject = null; SC.cam = ''; }
const SC_OFF = {
  denied:['Kamera nicht erlaubt', `<p>So erlauben Sie die Kamera am iPhone:</p><ol><li><b>Einstellungen › Safari › Kamera</b> auf „Erlauben“ oder „Fragen“ stellen.</li><li>Oder in Safari links in der Adresszeile auf <b>„aA“</b> tippen › <b>Website-Einstellungen › Kamera › Erlauben</b>.</li><li>Danach hier „Erneut versuchen“.</li></ol><p class="sc-small">Als App vom Home-Bildschirm fragt das iPhone beim nächsten Öffnen des Scanners wieder: dann „Erlauben“ tippen. Android (Chrome): Schloss-Symbol in der Adresszeile › Berechtigungen › Kamera.</p>`],
  insecure:['Kamera nur über https', `<p>Der Browser gibt die Kamera nur über eine sichere Verbindung frei. Öffnen Sie die App über ihre https-Adresse oder als App vom Home-Bildschirm.</p>`],
  nocam:['Keine Kamera gefunden', `<p>Dieses Gerät hat keine Kamera, die der Browser nutzen kann.</p>`],
  error:['Kamera startet nicht', `<p>Vielleicht nutzt gerade eine andere App die Kamera. Diese schließen und erneut versuchen.</p>`],
  lib:['Leser lädt nicht', `<p>Der Strichcode-Leser konnte nicht geladen werden. Mit Internet einmal öffnen, danach geht es auch offline.</p>`],
};
function scanCamFail(why){
  if(!SC.open) return; SC.cam = why; const r = $('#scan'); r.classList.remove('cam-on'); r.classList.add('cam-off');
  const [h, body] = SC_OFF[why] || SC_OFF.error; const off = $('#scOff');
  off.innerHTML = `<div class="sc-off-in" data-why="${why}"><span class="sc-off-ic">${ico('camera')}</span><h3>${esc(h)}</h3>${body}
    <form class="sc-man" id="scManF2" autocomplete="off"><label for="scMan2">Code eintippen</label><span class="sc-man-row"><input id="scMan2" class="sc-man-in" inputmode="numeric" placeholder="Ziffern" spellcheck="false" autocomplete="off"><button type="button" class="sc-btn primary" data-sc="manGo2">Weiter</button></span><small class="sc-man-h" id="scManH2" aria-live="polite"></small></form>
    <div class="sc-off-acts">${why === 'insecure' || why === 'nocam' ? '' : `<button type="button" class="sc-btn" data-sc="retry">Erneut versuchen</button>`}<button type="button" class="sc-btn" data-sc="list">${scanInv() ? 'Ohne Code zählen' : 'Artikel suchen'}</button></div></div>`;
  off.hidden = false; scanHint('');
}
function scanLoop(){ clearTimeout(SC.timer); if(!SC.open || !SC.stream) return; SC.timer = setTimeout(scanTick, SC.engine && SC.engine.kind === 'native' ? 100 : 70); }
async function scanTick(){
  const v = $('#scVideo');
  if(!SC.open || !SC.stream) return;
  if(SC.layer || ($('#dlg') && $('#dlg').open) || document.hidden || !v || v.readyState < 2 || !v.videoWidth){ scanLoop(); return; }
  try { const r = await scanFrame(v); if(r && SC.open && !SC.layer) scanHit(r); } catch(e){}
  scanLoop();
}
/* nur den Bereich im Rahmen lesen (schneller, weniger Fehllesungen); jedes dritte Bild das ganze sichtbare Bild */
function scanFrame(v){
  const e = SC.engine; SC.frame++;
  if(e.kind === 'native') return e.detect(v);
  const vw = v.videoWidth, vh = v.videoHeight, er = v.getBoundingClientRect(); const s = Math.max(er.width / vw, er.height / vh);
  const ox = (vw - er.width / s) / 2, oy = (vh - er.height / s) / 2; let sx, sy, sw, sh;
  const vf = $('#scVf').getBoundingClientRect();
  if(SC.frame % 3 === 0){ sx = ox; sy = oy; sw = er.width / s; sh = er.height / s; }
  else { const cx = ox + (vf.left + vf.width / 2 - er.left) / s, cy = oy + (vf.top + vf.height / 2 - er.top) / s; sw = vf.width / s * 1.3; sh = vf.height / s * 1.5; sx = cx - sw / 2; sy = cy - sh / 2; }
  sx = Math.max(0, Math.round(sx)); sy = Math.max(0, Math.round(sy)); sw = Math.round(Math.min(vw - sx, sw)); sh = Math.round(Math.min(vh - sy, sh));   // ganze Pixel: kein Verwischen schmaler Striche
  const k = Math.min(1, 960 / sw); const cv = SC.cv || (SC.cv = document.createElement('canvas')); cv.width = Math.round(sw * k); cv.height = Math.round(sh * k);
  const g = cv.getContext('2d', {willReadFrequently:true}); g.drawImage(v, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
  return e.decode(cv);
}
/* zweimal gleich gelesen = sicher; danach ist derselbe Code ein paar Sekunden still */
function scanHit(r){
  const code = eanClean(r.code); if(!code) return; const now = Date.now();
  if(r.format === 'itf' && !(code.length === 14 && gtinInfo(code).ok)) return;
  if(SC.cool[eanKey(code)] > now) return;
  if(SC.cand && SC.cand.code === code && now - SC.cand.t < 1500) SC.cand.n++; else SC.cand = {code, n:1};
  SC.cand.t = now; if(SC.cand.n < 2) return;
  SC.cand = null; SC.cool[eanKey(code)] = now + 3000; SC.hits++;
  scanFeedback(); scanGot(code, r.format, 'cam');
}
function scanAudio(init){ try { if(init){ if(!SC.ac && SC.beep && (window.AudioContext || window.webkitAudioContext)) SC.ac = new (window.AudioContext || window.webkitAudioContext)(); if(SC.ac && SC.ac.state === 'suspended') SC.ac.resume(); } } catch(e){} }
function scanFeedback(){
  const vf = $('#scVf'); if(vf){ vf.classList.remove('hit'); void vf.offsetWidth; vf.classList.add('hit'); clearTimeout(SC.hitT); SC.hitT = setTimeout(() => vf.classList.remove('hit'), 700); }
  try { navigator.vibrate && navigator.vibrate(35); } catch(e){}
  if(SC.beep && SC.ac){ try { const o = SC.ac.createOscillator(), g = SC.ac.createGain(); o.frequency.value = 1480; g.gain.setValueAtTime(0.0001, SC.ac.currentTime); g.gain.exponentialRampToValueAtTime(0.08, SC.ac.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, SC.ac.currentTime + 0.09); o.connect(g); g.connect(SC.ac.destination); o.start(); o.stop(SC.ac.currentTime + 0.1); } catch(e){} }
}
/* Ein Code ist da (Kamera, eingetippt): was jetzt? */
function scanGot(code, format, via){
  code = eanClean(code); if(!code) return;
  if(SC.mode === 'pick'){ const cb = SC.opt.done; scanClose(); if(cb) cb(code); return; }
  const pool = scanPool(); const p = eanFind(code);
  if(p && SC.mode === 'inv' && !pool.includes(p)){ scanMsg(`„${p.name}“ wird nicht gelagert und nicht gezählt.`); return; }
  if(p) return scanFor(p);
  scanLearn(code, format, via);
}
function scanFor(p){
  if(scanInv()){ if(invBack(p)) save(); return scanCount(p); }   // gescannt heißt: er ist da, „nicht im Lager“ fällt weg
  if(scanOrder()) return scanRecv(p);
  return scanInfo(p);
}
function scanMsg(txt){ SC.last = {msg:txt}; scanLastDraw(); }

/* ---------- Schichten über der Kamera ---------- */
function scanSheet(kind, html, cls = ''){
  SC.layer = kind; const sh = $('#scSheet'); sh.className = 'sc-sheet ' + cls; sh.dataset.kind = kind; sh.innerHTML = `<div class="sc-grip" aria-hidden="true"></div>` + html; sh.hidden = false; sh.scrollTop = 0;
  $('#scan').classList.add('has-sheet'); scanHint('');
  return sh;
}
function scanBack(){
  const from = SC.layer; const cp = SC.cnt ? P(SC.cnt.pid) : from === 'info' ? P(SC.info) : null; if(cp) scanCoolP(cp, 4000); SC.layer = null; SC.cnt = null; const sh = $('#scSheet'); sh.hidden = true; sh.innerHTML = ''; $('#scan').classList.remove('has-sheet');
  scanHead(); scanLastDraw();
  if(SC.listBack && from !== 'list'){ SC.listBack = false; return scanList(); }
  if(!SC.camWanted){ return scanClose(); }
  if(!SC.stream && !SC.cam) scanCamStart(); else if(SC.cam === 'on') scanHint(scanIdleHint());
  SC.cand = null;
}
function scanLastDraw(){
  const n = $('#scLast'); if(!n) return; const l = SC.last;
  if(!l || SC.layer){ n.hidden = true; return; }
  n.innerHTML = l.msg ? `<span>${esc(l.msg)}</span>` : `<span class="sc-ok-ic">${ico('check')}</span><span><b>${esc(l.name)}</b><small>${esc(l.txt)}</small></span>${l.undo ? `<button type="button" class="sc-link" data-sc="undo">Rückgängig</button>` : ''}`;
  n.hidden = false;
}

/* Zählen: großes Feld, Ziffernblock, − / +; Getränke: volle Flaschen und die angebrochene in Zehnteln */
function scanCount(p, from){
  const d = S.invDraft; if(!d) return scanInfo(p);
  const dr = isDrink(p), had = scanCounted(p.id), b = dr ? barCount(p.id) : null;
  SC.cnt = {pid:p.id, dr, buf:'', t:0, mode:had ? 'add' : 'set', had, from:from || (SC.layer === 'list' ? 'list' : 'scan')};
  if(SC.cnt.from === 'list') SC.listBack = true;
  scanCountDraw();
}
function scanCountDraw(){
  const c = SC.cnt, p = P(c.pid), d = S.invDraft; if(!p || !d) return scanBack();
  const unit = c.dr ? cntWord(p) : p.unit; const old = d.counts[p.id]; const ob = c.dr ? barCount(p.id) : null;
  const loc = LOCS[p.loc] || 'Ohne Lagerort';
  const keys = ['1','2','3','4','5','6','7','8','9',',','0','⌫'];
  const html = `<div class="sc-h"><div><b class="sc-name">${esc(p.name)}</b><small>${esc(loc)} · Soll ${esc(qtyFmt(+p.stock || 0, p))}${c.dr ? ` · ${esc(p.pack || '')}` : ''}</small></div><button type="button" class="sc-ib sm" data-sc="back" aria-label="Zurück ohne Speichern">${ico('x')}</button></div>
    ${c.had ? `<div class="sc-had"><span>Schon gezählt: <b>${esc(qtyFmt(+old || 0, p))}</b>${c.dr && ob.t ? ` <small>(${num(ob.f || 0)} ${esc(cntWord(p))} + 0,${ob.t})</small>` : ''}</span><div class="sc-seg" role="radiogroup" aria-label="Wie zählen"><button type="button" role="radio" data-sc="mode" data-v="add" aria-checked="${c.mode === 'add'}" class="${c.mode === 'add' ? 'on' : ''}">Dazuzählen</button><button type="button" role="radio" data-sc="mode" data-v="set" aria-checked="${c.mode === 'set'}" class="${c.mode === 'set' ? 'on' : ''}">Neu zählen</button></div></div>` : ''}
    <div class="sc-val"><button type="button" class="sc-step" data-sc="step" data-v="-1" aria-label="eins weniger">−</button><output class="sc-out" id="scOut" aria-live="polite"><b id="scBuf">${esc(c.buf || '0')}</b><em>${esc(unit)}</em></output><button type="button" class="sc-step" data-sc="step" data-v="1" aria-label="eins mehr">+</button></div>
    ${c.dr ? `<div class="sc-ten" role="group" aria-label="Angebrochene ${p.geb === 'fass' ? 'Fass' : 'Flasche'} in Zehnteln"><small>${p.geb === 'fass' ? 'Fass offen' : 'offen'}</small>${[1,2,3,4,5,6,7,8,9].map(k => `<button type="button" data-sc="ten" data-v="${k}" aria-pressed="${c.t === k}" class="${c.t === k ? 'on' : ''}">0,${k}</button>`).join('')}</div>` : ''}
    <p class="sc-res" id="scRes"></p>
    <div class="sc-pad" role="group" aria-label="Ziffern">${keys.map(k => `<button type="button" data-sc="key" data-v="${k}" ${k === '⌫' ? 'aria-label="Löschen"' : ''}>${k}</button>`).join('')}</div>
    <div class="sc-acts"><button type="button" class="sc-btn" data-sc="back">Abbrechen</button><button type="button" class="sc-btn primary big" data-sc="save" id="scSave">Speichern</button></div>`;
  if(SC.layer !== 'count') scanSheet('count', html, 'tall'); else { const sh = $('#scSheet'); sh.innerHTML = `<div class="sc-grip" aria-hidden="true"></div>` + html; }
  scanCountRes();
}
/* Ergebnis der Eingabe in der Grundeinheit (kg, l, Stk; Getränke in Litern) */
function scanCountCalc(){
  const c = SC.cnt, p = P(c.pid), d = S.invDraft; const raw = c.buf; let f = 0, t = c.t, v;
  if(c.dr){ const n = raw === '' ? 0 : numParse(raw); if(!isFinite(n) || n < 0) return null; f = Math.floor(n + 1e-9); if(/,/.test(raw)){ const fr = Math.round((n - f) * 10); if(fr) t = Math.min(9, fr); }
    if(c.mode === 'add' && c.had){ const ob = barCount(p.id); const tot = ((+ob.f || 0) * 10 + (+ob.t || 0)) + (f * 10 + t); f = Math.floor(tot / 10); t = tot % 10; }
    v = Math.round((f + t / 10) * p.gebL * 1000) / 1000; return {v, f, t, empty:raw === '' && !c.t}; }
  const n = raw === '' ? 0 : numParse(raw); if(!isFinite(n) || n < 0) return null;
  v = Math.round(((c.mode === 'add' && c.had ? +d.counts[p.id] || 0 : 0) + n) * 1000) / 1000; return {v, empty:raw === ''};
}
function scanCountRes(){
  const c = SC.cnt, p = P(c.pid); const r = scanCountCalc(); const o = $('#scRes'); const b = $('#scBuf'); if(b) b.textContent = c.buf || '0';
  if(!o) return; if(!r){ o.textContent = 'Bitte eine Zahl eingeben'; o.className = 'sc-res bad'; return; }
  const df = r.v - (+p.stock || 0);
  const tot = c.mode === 'add' && c.had ? `Neu gesamt ${qtyFmt(r.v, p)}` : c.dr ? `= ${num(r.v, 3)} l` : '';
  const dtxt = `Differenz ${df > 1e-9 ? '+' : df < -1e-9 ? '−' : ''}${qtyFmt(Math.abs(df), p)} · ${signedEur(df * (+p.price || 0))}`;
  if(b) b.classList.toggle('sc-ph', !c.buf);
  if(r.empty && !(c.mode === 'add' && c.had) && !c.t){ o.className = 'sc-res'; o.textContent = 'Gezählte Menge eintippen'; return; }
  o.className = 'sc-res ' + (Math.abs(df) < 1e-9 ? '' : df < 0 ? 'neg' : 'pos'); o.textContent = [tot, dtxt].filter(Boolean).join(' · ');
}
function scanKey(k){
  const c = SC.cnt; if(!c) return; let b = c.buf;
  if(k === '⌫') b = b.slice(0, -1);
  else if(k === ','){ if(!b.includes(',')) b = (b || '0') + ','; }
  else { if(b === '0') b = ''; const dec = b.split(',')[1]; if(b.length >= 8 || (dec != null && dec.length >= (c.dr ? 1 : 3))) return; b += k; }
  c.buf = b; scanCountRes();
}
function scanStep(dv){ const c = SC.cnt; if(!c) return; const n = c.buf === '' ? 0 : numParse(c.buf); const v = Math.max(0, Math.round(((isFinite(n) ? n : 0) + dv) * 1000) / 1000); c.buf = numIn(v); scanCountRes(); }
function scanCountSave(){
  const c = SC.cnt, p = P(c.pid), d = S.invDraft; if(!c || !p || !d) return;
  const r = scanCountCalc(); if(!r){ return; }
  if(r.empty && !(c.mode === 'add' && c.had)){ const o = $('#scRes'); o.textContent = 'Bitte die gezählte Menge eingeben (auch 0 ist möglich).'; o.className = 'sc-res bad'; return; }
  const prev = {c:d.counts[p.id], bar:d.bar && d.bar[p.id] ? {...d.bar[p.id]} : undefined};
  if(c.dr){ d.bar = d.bar || {}; d.bar[p.id] = {f:r.f, t:r.t}; }
  d.counts[p.id] = r.v; if(r.v > 0) invBack(p); save();
  scanRowSync(p.id);
  SC.lastLoc = p.loc || ''; SC.undo = {pid:p.id, prev};
  SC.last = {name:p.name, txt:`${qtyFmt(r.v, p)} gezählt`, undo:true, pid:p.id};
  scanCoolP(p, 4000);   // der Code ist meist noch vor der Kamera: nicht gleich wieder öffnen
  if(c.from === 'list'){ SC.listNext = p.id; SC.listBack = false; SC.cnt = null; SC.layer = null; return scanList(); }
  scanBack();
}
function scanRowSync(pid){ const row = document.getElementById('ir-' + pid), p = P(pid), d = S.invDraft; if(!row || !p || !d) return;
  const inp = document.getElementById('inv-' + pid); const b = isDrink(p) ? barCount(pid) : null;
  if(inp){ inp.value = b ? (b.f === '' ? '' : numIn(b.f)) : numIn(d.counts[pid]); inp.dataset.old = inp.value; }
  try { invUpdate(pid); } catch(e){}
  if(b) row.querySelectorAll('.inv-t button').forEach(x => { const on = +x.dataset.id.split(':')[1] === b.t; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); }
function scanUndo(){ const u = SC.undo, d = S.invDraft; if(!u || !d) return; if(u.prev.c === undefined) delete d.counts[u.pid]; else d.counts[u.pid] = u.prev.c;
  if(d.bar){ if(u.prev.bar === undefined) delete d.bar[u.pid]; else d.bar[u.pid] = u.prev.bar; } save(); scanRowSync(u.pid); const p = P(u.pid); SC.undo = null; SC.last = {msg:`${p ? p.name : 'Zählung'}: zurückgenommen`}; scanHead(); scanLastDraw(); }

/* Unbekannter Code: Artikel suchen und zuordnen (lernen). Ohne Code zuerst, dann nach dem Lagerort, in dem gerade gezählt wird. */
function scanFold(s){ return String(s || '').toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, ''); }
/* Treffer: Name beginnt so (0), ein Wort beginnt so (1), ab drei Buchstaben auch mitten im Wort (2), Artikelnummer oder Code (3) */
function scanRank(p, q){ if(!q) return 5; const n = scanFold(p.name); if(n === q) return -1; if(n.startsWith(q)) return 0; if(n.split(/[\s\-–()\/,.„“"]+/).some(w => w.startsWith(q))) return 1; if(q.length >= 3 && n.includes(q)) return 2;
  if(p.artNo && scanFold(p.artNo).startsWith(q)) return 3; if(eanOf(p).some(c => c.startsWith(q))) return 3; return 9; }
const scLocOrder = () => Object.keys(LOCS).concat(['']);
function scanLocRank(p, first){ const order = scLocOrder(); const k = LOCS[p.loc] ? p.loc : ''; if(first !== undefined && k === first) return -1; return order.indexOf(k); }
function scanLearn(code, format, via){
  SC.learn = {code, format, via, q:''}; const g = gtinInfo(code, format);
  const html = `<div class="sc-h"><div><b class="sc-name">Unbekannter Code <span class="sc-code">${esc(code)}</span></b><small class="${g.ok === false ? 'sc-warn' : ''}">${esc(gtinText(code, format))}</small></div><button type="button" class="sc-ib sm" data-sc="skip" aria-label="Überspringen">${ico('x')}</button></div>
    <p class="sc-lead">Zu welchem Artikel gehört er? Die App merkt sich den Code.</p>
    <label class="sc-search">${ico('search')}<input id="scQ" type="search" placeholder="2–3 Buchstaben, z. B. but" autocomplete="off" spellcheck="false" aria-label="Artikel suchen"></label>
    <ul class="sc-list" id="scLl" role="list"></ul>
    <div class="sc-acts">${canEditAll() ? `<button type="button" class="sc-btn" data-sc="newProd">${ico('plus')}Neuer Artikel</button>` : ''}<button type="button" class="sc-btn" data-sc="skip">Überspringen</button></div>`;
  scanSheet('learn', html, 'tall'); scanLearnList();
  if(via === 'manual' || !matchMedia('(pointer:coarse)').matches) setTimeout(() => $('#scQ') && $('#scQ').focus(), 30);
}
function scanLearnList(){
  const L = SC.learn; if(!L) return; const q = scanFold(L.q.trim()); const first = SC.lastLoc || (scanOrder() ? '' : undefined);
  const ord = scanOrder(); const inOrder = p => ord && ord.lines.some(l => l.pid === p.id);
  let list = scanPool().map(p => ({p, r:scanRank(p, q)})).filter(x => x.r < 9);
  list.sort((a, b) => (q ? a.r - b.r : 0) || (ord ? inOrder(b.p) - inOrder(a.p) : 0) || (eanOf(a.p).length > 0) - (eanOf(b.p).length > 0) || scanLocRank(a.p, first) - scanLocRank(b.p, first) || byName(a.p, b.p));
  const more = list.length > 40; list = list.slice(0, 40);
  $('#scLl').innerHTML = list.length ? list.map(({p}) => scanRow(p, 'pickArt')).join('') + (more ? `<li class="sc-more">Weitere: Namen genauer eintippen</li>` : '') : `<li class="sc-empty">Kein Artikel gefunden.${canEditAll() ? ' Mit „Neuer Artikel“ anlegen.' : ''}</li>`;
}
function scanRow(p, act, noLoc){
  const d = S.invDraft, counted = scanCounted(p.id); const n = eanOf(p).length; const mark = SC.listNext === p.id && act === 'listArt';
  const sub = [noLoc ? '' : LOCS[p.loc] || 'Ohne Lagerort', d && SC.mode === 'inv' && p.invOff ? 'nicht im Lager' : '', d && SC.mode === 'inv' ? (counted ? 'gezählt ' + qtyFmt(+d.counts[p.id] || 0, p) : 'Soll ' + qtyFmt(+p.stock || 0, p)) : qtyFmt(+p.stock || 0, p) + ' auf Lager'].filter(Boolean).join(' · ');
  return `<li><button type="button" class="sc-row${counted && SC.mode === 'inv' ? ' done' : ''}${mark ? ' next' : ''}" data-sc="${act}" data-id="${esc(p.id)}"><span class="sc-row-n"><b>${esc(p.name)}</b><small>${esc(sub)}</small></span>${n ? `<span class="sc-tag" title="${esc(eanOf(p).join(', '))}">${n === 1 ? '1 Code' : n + ' Codes'}</span>` : ''}${counted && SC.mode === 'inv' ? `<span class="sc-ok-ic">${ico('check')}</span>` : `<span class="sc-chev">${ico('arrow', 'flip')}</span>`}</button></li>`;
}
function scanLearnPick(pid){
  const L = SC.learn, p = P(pid); if(!L || !p) return;
  const r = eanAdd(p, L.code); if(!r.ok){ toast(r.err); return; }
  save(); SC.learn = null; SC.cool[eanKey(L.code)] = Date.now() + 3000;
  SC.last = {name:p.name, txt:`Code ${L.code} gelernt`};
  toast(`Code gelernt: ${p.name}`);
  SC.layer = null; scanFor(p);
}
function scanNewProd(){
  const L = SC.learn; if(!L || !canEditAll()) return; const code = L.code;
  const dlg = $('#dlg'); const before = new Set(S.products.map(p => p.id));
  prodDialog(null, {ean:code});
  const once = () => { if(SC.dlgHidden) return; dlg.removeEventListener('close', once); if(!SC.open) return; const p = S.products.find(x => !before.has(x.id) && eanOf(x).some(c => eanKey(c) === eanKey(code)));
    if(p){ SC.learn = null; SC.layer = null; SC.last = {name:p.name, txt:'neu angelegt, Code gespeichert'}; scanFor(p); } };
  dlg.addEventListener('close', once);
}

/* Ohne Code: dieselbe Liste in der Reihenfolge der Lagerorte, wie man durch Kühlhaus, Tiefkühler und Lager geht */
function scanList(){
  const inv = scanInv();
  const html = `<div class="sc-h"><div><b class="sc-name">${inv ? 'Ohne Code zählen' : 'Artikel suchen'}</b><small id="scLsub"></small></div>${SC.camWanted ? `<button type="button" class="sc-ib sm" data-sc="back" aria-label="Zurück zur Kamera">${ico('scan')}</button>` : `<button type="button" class="sc-ib sm" data-sc="close" aria-label="Schließen">${ico('x')}</button>`}</div>
    <label class="sc-search">${ico('search')}<input id="scLq" type="search" placeholder="Artikel suchen" autocomplete="off" spellcheck="false" aria-label="Artikel suchen" value="${esc(SC.list.q)}"></label>
    <div class="sc-list-wrap" id="scLw"><ul class="sc-list" id="scLs" role="list"></ul></div>
    ${!SC.camWanted ? `<div class="sc-acts one"><button type="button" class="sc-btn" data-sc="toCam">${ico('scan')}Mit Kamera scannen</button></div>` : ''}`;
  scanSheet('list', html, 'full'); scanListDraw(true);
}
function scanListDraw(scroll){
  const q = scanFold(SC.list.q.trim()); const inv = scanInv(); const pool = scanPool();
  let h = '';
  if(q){ const l = pool.map(p => ({p, r:scanRank(p, q)})).filter(x => x.r < 9).sort((a, b) => a.r - b.r || scanLocRank(a.p) - scanLocRank(b.p) || byName(a.p, b.p)).slice(0, 60);
    h = l.length ? l.map(x => scanRow(x.p, 'listArt')).join('') : '<li class="sc-empty">Nichts gefunden.</li>'; }
  else for(const k of scLocOrder()){ const part = pool.filter(p => !(inv && p.invOff) && (LOCS[p.loc] ? p.loc : '') === k).sort(byName); if(!part.length) continue;
    const done = inv ? part.filter(p => scanCounted(p.id)).length : 0;
    h += `<li class="sc-grp"><span>${esc(LOCS[k] || 'Ohne Lagerort')}</span><small>${inv ? `${done} / ${part.length}` : part.length}</small></li>` + part.map(p => scanRow(p, 'listArt', true)).join(''); }
  $('#scLs').innerHTML = h;
  const sub = $('#scLsub'); if(sub){ if(inv){ const items = invProducts(); sub.textContent = `${items.filter(p => scanCounted(p.id)).length} von ${items.length} gezählt`; } else sub.textContent = `${pool.length} Artikel`; }
  if(scroll){ // nach dem Speichern: zum nächsten noch nicht gezählten Artikel in derselben Reihenfolge
    let target = null;
    if(SC.listNext && inv && !q){ const flat = scLocOrder().flatMap(k => pool.filter(p => !p.invOff && (LOCS[p.loc] ? p.loc : '') === k).sort(byName)); const i = flat.findIndex(p => p.id === SC.listNext); const nx = flat.slice(i + 1).find(p => !scanCounted(p.id)); SC.listNext = nx ? nx.id : null; if(nx) target = nx.id; }
    $('#scLs').querySelectorAll('.sc-row.next').forEach(n => n.classList.remove('next'));
    const el = target ? $('#scLs').querySelector(`[data-id="${CSS.escape(target)}"]`) : null;
    if(el){ el.classList.add('next'); requestAnimationFrame(() => { const w = $('#scLw'); if(w) w.scrollTop = Math.max(0, el.offsetTop - w.clientHeight / 3); }); }
  }
}

/* Außerhalb der Inventur: Bestand, Lagerort, Mindestbestand, letzter Preis */
function scanInfo(p){
  const low = (+p.minStock || 0) > 0 && (+p.stock || 0) < +p.minStock; const pu = priceUnit(p);
  const lastIn = S.moves.filter(m => m.pid === p.id && m.type === 'in').sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  const codes = eanOf(p);
  const html = `<div class="sc-h"><div><b class="sc-name">${esc(p.name)}</b><small>${esc(LOCS[p.loc] || 'Ohne Lagerort')}${p.supplier ? ' · ' + esc(supName(p)) : ''}</small></div><button type="button" class="sc-ib sm" data-sc="back" aria-label="Weiter scannen">${ico('x')}</button></div>
    <div class="sc-kpi"><div><small>Bestand</small><b class="${(+p.stock || 0) < 0 ? 'neg' : ''}">${esc(p.noStock ? '—' : qtyFmt(+p.stock || 0, p))}</b></div><div><small>Mindest&shy;bestand</small><b>${esc((+p.minStock || 0) > 0 ? qtyFmt(+p.minStock, p) : '—')}</b>${low ? '<em class="sc-warn">darunter</em>' : ''}</div><div><small>Letzter Preis</small><b>${esc(eur((+p.price || 0) * pu.f))}</b><em>je ${esc(pu.label || p.unit)}${lastIn ? ` · geliefert ${esc(fmtDate(lastIn.date))}` : ''}</em></div></div>
    <div class="sc-codes"><small>${codes.length === 1 ? 'Code' : 'Codes'}</small>${codes.map(c => `<span class="sc-chip"><span class="sc-code">${esc(c)}</span>${canEditAll() ? `<button type="button" data-sc="eanDel" data-v="${esc(c)}" aria-label="Code ${esc(c)} entfernen">${ico('x')}</button>` : ''}</span>`).join('') || '<em>noch keiner</em>'}</div>
    <div class="sc-acts">${canEditAll() ? `<button type="button" class="sc-btn" data-sc="editProd" data-id="${esc(p.id)}">${ico('edit')}Bearbeiten</button>` : ''}${p.noStock ? '' : `<button type="button" class="sc-btn" data-sc="moveIn" data-id="${esc(p.id)}">${ico('plus')}Wareneingang</button>`}<button type="button" class="sc-btn primary big" data-sc="back">${SC.camWanted ? 'Weiter scannen' : 'Fertig'}</button></div>`;
  SC.info = p.id; scanSheet('info', html);
}

/* Wareneingang: gescannte Position abhaken und die gelieferte Menge eintragen */
function scanRecv(p){
  const o = scanOrder(); const i = o ? o.lines.findIndex(l => l.pid === p.id) : -1;
  if(i < 0){ SC.last = {msg:`„${p.name}“ ist nicht in dieser Bestellung.`}; return scanBack(); }
  const l = o.lines[i]; SC.cnt = {recv:true, i, pid:p.id, buf:numIn(l.delivered ?? l.n), t:0, mode:'set'};
  const keys = ['1','2','3','4','5','6','7','8','9',',','0','⌫'];
  scanSheet('count', `<div class="sc-h"><div><b class="sc-name">${esc(p.name)}</b><small>Bestellt ${esc(num(l.n, 2))} × ${esc(l.ou)}</small></div><button type="button" class="sc-ib sm" data-sc="back" aria-label="Zurück">${ico('x')}</button></div>
    <div class="sc-val"><button type="button" class="sc-step" data-sc="step" data-v="-1" aria-label="eins weniger">−</button><output class="sc-out"><b id="scBuf">${esc(SC.cnt.buf || '0')}</b><em>${esc(l.ou)}</em></output><button type="button" class="sc-step" data-sc="step" data-v="1" aria-label="eins mehr">+</button></div>
    <p class="sc-res" id="scRes">Geliefert</p>
    <div class="sc-pad" role="group" aria-label="Ziffern">${keys.map(k => `<button type="button" data-sc="key" data-v="${k}" ${k === '⌫' ? 'aria-label="Löschen"' : ''}>${k}</button>`).join('')}</div>
    <div class="sc-acts"><button type="button" class="sc-btn" data-sc="back">Abbrechen</button><button type="button" class="sc-btn primary big" data-sc="save" id="scSave">Geliefert</button></div>`, 'tall');
}
function scanRecvSave(){
  const c = SC.cnt, o = scanOrder(); if(!c || !o) return; const l = o.lines[c.i]; const v = c.buf === '' ? NaN : numParse(c.buf);
  if(!isFinite(v) || v < 0){ $('#scRes').textContent = 'Bitte die gelieferte Menge eingeben.'; $('#scRes').className = 'sc-res bad'; return; }
  l.delivered = Math.round(v * 1000) / 1000; save(); SC.recvSeen.add(c.i);
  const inp = document.getElementById('rd-' + c.i); if(inp){ inp.value = numIn(l.delivered); inp.dataset.old = inp.value; }
  const p = P(c.pid); SC.last = {name:p ? p.name : '', txt:`${num(l.delivered, 2)} × ${l.ou} geliefert`}; scanBack();
}

/* Code eintippen */
function scanManual(){
  const html = `<div class="sc-h"><div><b class="sc-name">Code eintippen</b><small>Die Ziffern unter dem Strichcode</small></div><button type="button" class="sc-ib sm" data-sc="back" aria-label="Zurück">${ico('x')}</button></div>
    <form class="sc-man" id="scManF" autocomplete="off"><span class="sc-man-row"><input id="scMan" class="sc-man-in" inputmode="numeric" placeholder="13 Ziffern" spellcheck="false" autocomplete="off" aria-label="Code"><button type="submit" class="sc-btn primary">Weiter</button></span><small class="sc-man-h" id="scManH" aria-live="polite"></small>
    <button type="button" class="sc-link" data-sc="abc">Code mit Buchstaben</button></form>`;
  scanSheet('manual', html); setTimeout(() => $('#scMan') && $('#scMan').focus(), 30);
}
function scanManualGo(id = 'scMan'){ const i = $('#' + id); const code = eanClean(i && i.value); if(!code){ const h = $(id === 'scMan' ? '#scManH' : '#scManH2'); if(h){ h.textContent = 'Bitte einen Code eintippen.'; h.className = 'sc-man-h bad'; } return; }
  SC.layer = null; scanGot(code, '', 'manual'); }

/* ---------- Ereignisse ---------- */
function scanClick(e){
  const b = e.target.closest('[data-sc]'); if(!b) return; const a = b.dataset.sc, v = b.dataset.v, id = b.dataset.id;
  switch(a){
    case 'close': scanClose(); break;
    case 'back': if(SC.layer === 'list' && SC.camWanted){ SC.listBack = false; } scanBack(); break;
    case 'torch': if(!SC.track) break; SC.torch = !SC.torch; SC.track.applyConstraints({advanced:[{torch:SC.torch}]}).catch(() => { SC.torch = false; }); b.classList.toggle('on', SC.torch); b.setAttribute('aria-pressed', String(SC.torch)); break;
    case 'sound': SC.beep = !SC.beep; try { localStorage.setItem(KEY + '_scanton', SC.beep ? '1' : '0'); } catch(err){} scanAudio(true); scanSoundBtn(); break;
    case 'retry': scanCamStart(); break;
    case 'manual': scanManual(); break;
    case 'manGo2': scanManualGo('scMan2'); break;
    case 'abc': { const i = $('#scMan'); i.setAttribute('inputmode', 'text'); i.blur(); i.focus(); b.hidden = true; break; }
    case 'list': SC.list.q = ''; scanList(); break;
    case 'toCam': SC.camWanted = true; $('#scan').classList.remove('no-cam'); scanBack(); break;
    case 'key': scanKey(v); break;
    case 'step': scanStep(+v); break;
    case 'ten': { const c = SC.cnt; if(!c) break; c.t = c.t === +v ? 0 : +v; $('#scSheet').querySelectorAll('[data-sc="ten"]').forEach(x => { const on = +x.dataset.v === c.t; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); scanCountRes(); break; }
    case 'mode': if(SC.cnt){ SC.cnt.mode = v; scanCountDraw(); } break;
    case 'save': if(SC.cnt && SC.cnt.recv) scanRecvSave(); else scanCountSave(); break;
    case 'undo': scanUndo(); break;
    case 'skip': if(SC.learn) SC.cool[eanKey(SC.learn.code)] = Date.now() + 4000; SC.learn = null; SC.last = null; scanBack(); break;
    case 'pickArt': scanLearnPick(id); break;
    case 'newProd': scanNewProd(); break;
    case 'listArt': { const p = P(id); if(!p) break; if(scanInv()) scanCount(p, 'list'); else { SC.listBack = true; scanFor(p); } break; }
    case 'editProd': { const p = P(id); if(!p) break; const dlg = $('#dlg'); prodDialog(p); const once = () => { if(SC.dlgHidden) return; dlg.removeEventListener('close', once); if(SC.open && SC.layer === 'info' && P(id)) scanInfo(P(id)); }; dlg.addEventListener('close', once); break; }
    case 'moveIn': { const dlg = $('#dlg'); moveDlg('in:' + id); const once = () => { dlg.removeEventListener('close', once); if(SC.open && SC.layer === 'info' && P(id)) scanInfo(P(id)); }; dlg.addEventListener('close', once); break; }
    case 'eanDel': { const p = P(SC.info); if(p && eanRemove(p, v)){ save(); toast(`Code ${v} entfernt`); scanInfo(p); } break; }
  }
}
function scanInput(e){
  const t = e.target;
  if(t.id === 'scQ' && SC.learn){ SC.learn.q = t.value; scanLearnList(); }
  if(t.id === 'scLq'){ SC.list.q = t.value; scanListDraw(false); }
  if(t.id === 'scMan' || t.id === 'scMan2'){ const h = $(t.id === 'scMan' ? '#scManH' : '#scManH2'); const c = eanClean(t.value); const g = c ? gtinInfo(c) : null; h.className = 'sc-man-h' + (g && g.ok === false ? ' warn' : ''); h.textContent = !c ? '' : gtinText(c); }
}
document.addEventListener('keydown', e => {
  if(!SC.open || ($('#dlg') && $('#dlg').open)) return;
  if(e.key === 'Escape'){ e.preventDefault(); if(SC.layer && SC.camWanted) scanBack(); else scanClose(); return; }
  if(SC.layer === 'count' && !(e.target && e.target.matches && e.target.matches('input'))){
    if(/^[0-9]$/.test(e.key)){ scanKey(e.key); e.preventDefault(); }
    else if(e.key === ',' || e.key === '.'){ scanKey(','); e.preventDefault(); }
    else if(e.key === 'Backspace'){ scanKey('⌫'); e.preventDefault(); }
    else if(e.key === 'Enter'){ (SC.cnt && SC.cnt.recv ? scanRecvSave : scanCountSave)(); e.preventDefault(); }
    else if(e.key === '+' || e.key === 'ArrowUp'){ scanStep(1); e.preventDefault(); } else if(e.key === '-' || e.key === 'ArrowDown'){ scanStep(-1); e.preventDefault(); }
  }
  if(e.key === 'Enter' && e.target && e.target.id === 'scMan2'){ e.preventDefault(); scanManualGo('scMan2'); }
}, true);
/* im Hintergrund (Sperrbildschirm, andere App) gibt iOS die Kamera ab; beim Zurückkommen neu starten */
document.addEventListener('visibilitychange', () => { if(!SC.open || !SC.camWanted) return; if(document.hidden) scanCamStop(); else if(!SC.stream) scanCamStart(); });

/* ---------- Einstiege ---------- */
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-scan]'); if(!b) return; e.preventDefault(); const m = b.dataset.scan;
  if(m === 'invList') scanOpen('inv', {list:true}); else if(m === 'recv') scanOpen('recv', {order:b.dataset.id}); else scanOpen(m); });
/* Inventur: „Scannen“ und „Ohne Code zählen“ unter dem Fortschritt */
const _invViewSc = invView; invView = function(){ const h = _invViewSc(); if(!S.invDraft) return h; const i = h.indexOf('</section>'); if(i < 0) return h;
  return h.slice(0, i + 10) + `<div class="sc-entry"><button type="button" class="btn primary sc-entry-b" data-scan="inv">${ico('scan')}Scannen</button><button type="button" class="btn sc-entry-b" data-scan="invList">${ico('list')}Ohne Code zählen</button></div>` + h.slice(i + 10); };
/* Bestand: Knopf neben der Suche */
const _stockListSc = stockList; stockList = function(){ const h = _stockListSc(); return h.replace('autocomplete="off"></label></div>', `autocomplete="off"></label><button type="button" class="btn sc-tb" data-scan="look" title="Artikel scannen" aria-label="Artikel scannen">${ico('scan')}<span>Scannen</span></button></div>`); };
/* Wareneingang zu einer Bestellung: „Scannen“ neben „Alles wie bestellt“ */
const _receiveFormSc = receiveForm; receiveForm = function(o, hasCold){ const h = _receiveFormSc(o, hasCold); return h.replace(`<button type="button" class="btn sm" data-act="rAll"`, `<button type="button" class="btn sm sc-tb" data-scan="recv" data-id="${esc(o.id)}">${ico('scan')}<span>Scannen</span></button><button type="button" class="btn sm" data-act="rAll"`); };
/* Schnellsuche: Knopf im Suchfeld und Eintrag „Strichcode scannen“ */
const _palDataSc = palData; palData = function(){ const a = _palDataSc(); a.splice(Math.max(0, a.findIndex(x => x.g === 'Aktion')), 0, {g:'Aktion', n:'Strichcode scannen', s:'Artikel nachschlagen oder in der Inventur zählen', run:() => scanOpen(S.invDraft ? 'inv' : 'look')}); return a; };
const _palOpenSc = palOpen; palOpen = function(){ _palOpenSc(); const box = $('#pal .pal-in'); if(box && !box.querySelector('.sc-pal')){ const b = document.createElement('button'); b.type = 'button'; b.className = 'sc-pal'; b.title = 'Strichcode scannen'; b.setAttribute('aria-label', 'Strichcode scannen'); b.innerHTML = ico('scan'); b.onclick = () => { palClose(); scanOpen(S.invDraft ? 'inv' : 'look'); }; box.insertBefore(b, box.querySelector('kbd')); } };
window.__scan = SC;
