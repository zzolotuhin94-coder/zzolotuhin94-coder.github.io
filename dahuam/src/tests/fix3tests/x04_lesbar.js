// Lesbarkeit: Einstellungen › Anzeige › Schriftgröße (Normal / Groß / Sehr groß) vergrößert die ganze Oberfläche, je Gerät gespeichert;
// untere Leiste übersteht große Schrift und schmale Breiten (Zoom); kein Text unter 12 px; grauer Text mindestens 4,5:1; gewählte Allergene deutlich.
const L = require('./lib');
const CONTRAST = `window.__cr = (el) => { const rgb = s => (s.match(/[\\d.]+/g) || []).map(Number); const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  let bg = null, e = el; while(e && e.nodeType === 1){ const c = rgb(getComputedStyle(e).backgroundColor); if(c.length >= 3 && (c.length < 4 || c[3] > 0.9)){ bg = c; break; } e = e.parentElement; } if(!bg) bg = rgb(getComputedStyle(document.body).backgroundColor);
  const fg = rgb(getComputedStyle(el).color); const a = lum(fg), b = lum(bg); return Math.round((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) * 100) / 100; };`;
const tiny = p => p.evaluate(() => [...document.querySelectorAll('#app *, .bottom *, .topbar *, .side *')].filter(e => !e.closest('.gs-ed,.gs-page,.gs-stage,.gs-tools,[class^="gs-"],.logo') && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && parseFloat(getComputedStyle(e).fontSize) < 11.95).map(e => e.tagName + '.' + String(e.className).slice(0, 24) + ' ' + getComputedStyle(e).fontSize).slice(0, 6));
(async () => { const b = await L.launch(); const errs = [];
  // ---------- Schriftgröße ----------
  { const {p} = await L.open(b, L.PHONE); const ev = (f, a) => p.evaluate(f, a);
    await L.go(p, 'einstellungen');
    const pan = await ev(() => { const s = document.querySelector('#setupAnzeige'); return s ? {h:s.querySelector('h2').textContent, opts:[...s.querySelectorAll('[data-act="ansFz"]')].map(x => x.textContent.trim()), on:s.querySelector('[data-act="ansFz"].on').textContent.trim()} : null; });
    L.ok(pan && pan.h === 'Anzeige' && pan.opts.join('|') === 'Normal|Groß|Sehr groß' && pan.on === 'Normal', 'Einstellungen › Anzeige: Schriftgröße Normal / Groß / Sehr groß', pan);
    await L.go(p, 'heute'); const m0 = await ev(() => ({body:parseFloat(getComputedStyle(document.body).fontSize), h1:parseFloat(getComputedStyle(document.querySelector('#app h1')).fontSize), row:parseFloat(getComputedStyle(document.querySelector('#app .dh-b .rw-main b')).fontSize), sub:parseFloat(getComputedStyle(document.querySelector('#app .dh-b .rw-main small')).fontSize)}));
    await L.go(p, 'einstellungen'); await p.click('#setupAnzeige [data-act="ansFz"][data-id="3"]'); await p.waitForTimeout(200);
    await L.go(p, 'heute'); const m3 = await ev(() => ({fz:document.documentElement.dataset.fz, body:parseFloat(getComputedStyle(document.body).fontSize), h1:parseFloat(getComputedStyle(document.querySelector('#app h1')).fontSize), row:parseFloat(getComputedStyle(document.querySelector('#app .dh-b .rw-main b')).fontSize), sub:parseFloat(getComputedStyle(document.querySelector('#app .dh-b .rw-main small')).fontSize)}));
    const r = k => Math.round(m3[k] / m0[k] * 100) / 100;
    L.ok(m3.fz === '3' && r('body') === 1.25 && r('h1') === 1.25 && r('row') >= 1.2 && r('sub') >= 1.2, '„Sehr groß“: die ganze Oberfläche wird 25 % größer (Grundschrift, Überschrift, Zeilen, Nebentext)', {m0, m3});
    await p.reload(); await L.ready(p); L.ok(await ev(() => document.documentElement.dataset.fz === '3'), 'die Wahl bleibt auf diesem Gerät gespeichert');
    const bad = [], clip = [];
    for(const h of L.SCREENS){ await L.go(p, h); if(await L.wide(p) > 0) bad.push(h); }
    L.ok(bad.length === 0, 'Sehr groß, Handy: keine Seite breiter als der Bildschirm', bad);
    await L.go(p, 'heute'); await L.shot(p, 'nachher-heute-sehr-gross');
    await ev(() => { fzSet('1'); }); errs.push(...p.errs); await p.context().close(); }
  // ---------- untere Leiste: schmal (Zoom) und große Schrift ----------
  for(const fz of ['1', '3']) for(const w of [390, 339, 320, 260]){
    const {p} = await L.open(b, {vp:{width:w, height:700}, ctx:{isMobile:true, hasTouch:true}, init:`try{localStorage.setItem('dahuam202_fz','${fz}')}catch(e){}`});
    const r = await p.evaluate(() => { const bar = document.querySelector('.bottom'); const items = [...bar.querySelectorAll('.nav-i')]; return {vw:innerWidth, sw:document.documentElement.scrollWidth, bw:Math.round(bar.getBoundingClientRect().width), bottom:Math.round(bar.getBoundingClientRect().bottom), vh:innerHeight, labels:items.map(i => i.textContent.replace(/­/g, '')), clip:items.filter(i => { const s = i.querySelector('span'); return s.scrollWidth > s.clientWidth + 1 || i.scrollWidth > i.clientWidth + 1 || i.getBoundingClientRect().right > innerWidth + 0.5; }).map(i => i.textContent), fs:Math.min(...items.map(i => parseFloat(getComputedStyle(i).fontSize))), op:getComputedStyle(bar).backgroundColor}; });
    L.ok(r.sw === r.vw && r.bw === r.vw && r.bottom === r.vh && r.clip.length === 0 && r.fs >= 11.9 && r.labels.join('|') === 'Heute|Vorbereitung|Rezepte|Ware|Mehr' && !/rgba\(.*, 0\.\d+\)$/.test(r.op), `untere Leiste ${w} px, Schrift ${fz}: ganz sichtbar, nichts abgeschnitten, mindestens 12 px, deckend`, r);
    if(w === 320) await L.shot(p, `nachher-leiste-${w}-schrift${fz}`); errs.push(...p.errs); await p.context().close(); }
  // ---------- kein Text unter 12 px; Kontrast ----------
  for(const dark of [false, true]){
    const {p} = await L.open(b, {...L.PHONE, dark}); await p.evaluate(CONTRAST); const small = [];
    for(const h of L.SCREENS.filter(x => x !== 'speisekarte/gaestekarte')){ await L.go(p, h); const t = await tiny(p); if(t.length) small.push(h + ': ' + t.join(', ')); }
    L.ok(small.length === 0, `${dark ? 'dunkel' : 'hell'}: kein Text unter 12 px (Handy, alle Seiten)`, small);
    await L.go(p, 'heute');
    const cr = await p.evaluate(() => ({sub:__cr(document.querySelector('#app .dh-b .rw-main small')), lab:__cr(document.querySelector('#app .dh-l')), lead:__cr(document.querySelector('#app .dh-b .rw-lead')), nav:__cr(document.querySelector('.bottom .nav-i:not(.on)')), navOn:__cr(document.querySelector('.bottom .nav-i.on')), ms:__cr(document.querySelector('#app .dh-ms'))}));
    await L.go(p, 'ware/bestand'); Object.assign(cr, await p.evaluate(() => ({sup:__cr(document.querySelector('#app table.stock td small.muted')), grp:__cr(document.querySelector('#app table.stock tr.grp td small') || document.querySelector('#app table.stock tr.grp td')), fact:__cr(document.querySelector('#app .fact'))})));
    await L.go(p, 'speisekarte'); Object.assign(cr, await p.evaluate(() => ({th:__cr(document.querySelector('#app table.lt th:nth-child(2)')), seg:__cr(document.querySelector('#app .seg button:not(.on)'))})));
    const low = Object.entries(cr).filter(([, v]) => v < 4.5);
    L.ok(low.length === 0, `${dark ? 'dunkel' : 'hell'}: grauer Neben-Text, Spaltenköpfe und Leiste mindestens 4,5:1`, cr);
    errs.push(...p.errs); await p.context().close(); }
  // ---------- gewählte Allergene ----------
  { const {p} = await L.open(b, L.PHONE); const ev = (f, a) => p.evaluate(f, a);
    await ev(() => { const pr = S.products.find(x => x.alg && x.alg.length >= 1 && !x.noStock); prodDialog(pr); }); await p.waitForTimeout(250);
    await ev(() => { const s = document.querySelector('#dlgForm .alg3-l'); if(s && s.hidden){ const r = document.querySelector('#dlgForm input[value="has"]'); if(r){ r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); } } });
    await p.evaluate(CONTRAST);
    const a = await ev(() => { const on = document.querySelector('#dlgForm .algc input:checked + span'), off = document.querySelector('#dlgForm .algc input:not(:checked) + span'); const bg = e => getComputedStyle(e).backgroundColor;
      return {on:!!on, off:!!off, bgOn:on && bg(on), bgOff:off && bg(off), mark:on && getComputedStyle(on, '::after').content, txt:on && __cr(on)}; });
    L.ok(a.on && a.off && a.bgOn !== a.bgOff && a.mark === '"✓"' && a.txt >= 4.5, 'gewählte Allergene: dunkel gefüllt mit Häkchen, nicht gewählte hell', a);
    await ev(() => document.querySelector('#dlgForm .algc input:checked + span').scrollIntoView({block:'center'})); await p.waitForTimeout(100); await L.shot(p, 'nachher-allergene'); errs.push(...p.errs); await p.context().close(); }
  await L.done(b, errs);
})();
