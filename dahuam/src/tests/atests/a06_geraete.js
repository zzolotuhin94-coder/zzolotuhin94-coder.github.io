// Geräte: Handy 390, Tablet 1024×768, Desktop; hell und dunkel; keine Seite breiter als der Bildschirm, große Tippflächen.
// XSS über Namen, Notizen, Reinigung; Code der Schlüsselbox nur auf Tipp; Hilfe „Was ist das?“ und „So geht’s hier“.
const L = require('./lib');
const XSS = '<img src=x onerror="window.__xss=1">';
(async () => { const b = await L.launch();
  const DEV = [['handy', L.PHONE, 40], ['tablet', L.TABLET, 44], ['desktop', {vp:{width:1440, height:900}}, 0]];
  for(const [dev, o, minTap] of DEV) for(const dark of [false, true]){
    const {p} = await L.open(b, {...o, dark}); const ev = (f, a) => p.evaluate(f, a); const tag = `${dev}-${dark ? 'dunkel' : 'hell'}`; const bad = [];
    const check = async name => { const wd = await L.wide(p); if(wd > 0) bad.push(name + ' +' + wd);
      if(minTap){ const small = await ev(min => [...document.querySelectorAll('#app .ap-ev, #app .ap-dl, #app .ap-ck, #app .ap-cm, #app .ap-who, #app .ap-bar, #app .ap-wk .icon-btn, #app .ap .seg button, #app .ap-aa .btn, #app .ap .page-h .btn, #dlg[open] .ap-pick .btn, #dlg[open] .ap-list .tog')].filter(x => x.offsetParent && x.getBoundingClientRect().height < min - 0.5).map(x => x.className + ':' + Math.round(x.getBoundingClientRect().height)), minTap); if(small.length) bad.push(name + ' klein: ' + small.slice(0, 4).join(', ')); } };
    const shot = async (name, out) => { await p.waitForTimeout(250); await check(name); await L.shot(p, `${tag}-${name}`, out ? {out:L.SHOTS} : {}); };
    const mainShots = (dev === 'handy' || dev === 'tablet') || !dark;
    await L.ap(p); await shot('uebersicht', mainShots);
    await L.ap(p, 'reinigung'); await shot('reinigung', mainShots);
    await p.click('#app .ap-cm'); await p.waitForTimeout(200); await check('dlg-reinigung'); await L.shot(p, `${tag}-reinigung-dialog`, {full:false}); await L.dlgClose(p);
    await p.click('#app .ap-who'); await p.waitForTimeout(400); await check('dlg-wer'); await L.dlgClose(p);
    await L.ap(p, 'verwalten'); await shot('verwalten', dev !== 'desktop' && !dark);
    await L.ap(p); await p.click('#app [data-act="apBookNew"]'); await p.waitForTimeout(200); await check('dlg-buchung'); await L.shot(p, `${tag}-buchung-dialog`, {full:false}); await L.dlgClose(p);
    await L.ap(p, 'verwalten'); await p.click('#app [data-act="apIcs"]'); await p.waitForTimeout(200); await p.setInputFiles('#apIcsFile', L.sample('booking_v1.ics')); await p.waitForTimeout(300); await check('dlg-import'); await L.shot(p, `${tag}-import-dialog`, {full:false, out:dev === 'handy' && !dark ? L.SHOTS : undefined}); await L.dlgClose(p);
    await L.go(p, 'heute'); await check('heute');
    L.ok(bad.length === 0, `${tag}: keine Seite breiter als der Bildschirm${minTap ? `, Tippflächen mindestens ${minTap} px` : ''}`, bad);
    if(dark) L.ok(await ev(() => { const bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number); return bg[0] < 60 && bg[1] < 60; }), `${tag}: dunkles Design aktiv`);
    L.ok(p.errs.length === 0, `${tag}: keine Fehler`, p.errs); await p.context().close(); }
  // ---------- XSS ----------
  { const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
    await ev(x => { const a = apS(); const ap = a.apts[0]; ap.name = 'Apt ' + x; ap.note = 'Code ' + x; const bk = a.bookings.find(o => o.id === 'bk_d2'); bk.guest = 'Gast ' + x; bk.note = '<script>window.__xss=3</script>'; a.cleans['apt_d1|' + todayStr()] = {who:'Wer ' + x, note:'Notiz ' + x, items:{}, hist:[{k:'note', v:x, b:x, at:new Date().toISOString()}]}; a.settings.list[0].t = 'Punkt ' + x; save(); }, XSS);
    for(const h of ['apartments', 'apartments/reinigung', 'apartments/verwalten', 'heute']){ await L.go(p, h); }
    await L.ap(p, 'verwalten'); await p.click('#app [data-act="apReveal"]'); await p.waitForTimeout(100);
    await L.ap(p, 'reinigung'); await p.click('#app .ap-cm[data-id^="apt_d1"]'); await p.waitForTimeout(200); await p.click('#dlgForm .ap-hist summary'); await L.dlgClose(p);
    await p.click('#app .ap-who[data-id^="apt_d1"]'); await p.waitForTimeout(150); await L.dlgClose(p);
    await L.ap(p); await p.click('#app .ap-bar[data-id="bk_d2"]'); await p.waitForTimeout(150); await L.dlgClose(p);
    const html = await ev(() => apPlanPages(apView().w).pages.join(''));
    await ev(() => { document.body.insertAdjacentHTML('beforeend', '<div id="apx" hidden></div>'); });
    L.ok(await ev(h => { document.getElementById('apx').innerHTML = h; const r = !document.querySelector('#app img, #app script, #apx img, #apx script') && window.__xss === undefined; document.getElementById('apx').remove(); return r; }, html) && /Apt &lt;img/.test(html), 'Namen, Notizen, Wer, Verlauf, Checkliste, Wochenplan: alles als Text, nichts ausgeführt (XSS)');
    L.ok(p.errs.length === 0, 'XSS: keine Fehler', p.errs); await p.context().close(); }
  // ---------- Code nur auf Tipp, Hilfe ----------
  { const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
    await L.ap(p, 'verwalten');
    L.ok(await ev(() => !/Schlüsselbox 1234/.test(document.querySelector('#app').innerText) && /••••••/.test(document.querySelector('#app .ap-sec').innerText)), 'Code der Schlüsselbox verborgen');
    await p.click('#app [data-act="apReveal"][data-id="apt_d1"]'); await p.waitForTimeout(100);
    L.ok(await ev(() => /Schlüsselbox 1234/.test(document.querySelector('#app .ap-sec').innerText) && !/Schlüsselbox 5678/.test(document.querySelector('#app').innerText)), 'Tipp auf „zeigen“: nur dieser Code sichtbar');
    await L.go(p, 'heute'); await L.ap(p, 'verwalten');
    L.ok(await ev(() => !/Schlüsselbox 1234/.test(document.querySelector('#app').innerText)), 'nach dem Verlassen der Seite wieder verborgen');
    await L.ap(p);
    await p.click('#app .wozu-q'); await p.waitForTimeout(200);
    L.ok(await ev(() => document.querySelectorAll('#gdHow li').length === 4 && /Wechseltag|Reinigung/.test(document.querySelector('#gdHow').innerText)), '„So geht’s hier“: vier Sätze zur Seite');
    await ev(() => helpSet(true));
    const bub = async sel => { await p.click(sel); await p.waitForTimeout(250); return ev(() => { const n = document.querySelector('.gd-bub'); return n ? n.innerText.replace(/\s+/g, ' ') : ''; }); };
    L.ok(/^Belegung der Woche/.test(await bub('#app .ap-bar')), 'Was ist das? Balken: „Belegung der Woche“');
    L.ok(/^Apartments .*Gastdaten bleiben auf diesem Gerät.*13 Monate/.test(await bub('#app .ap .page-h h1')), 'Was ist das? Überschrift: Erklärung mit Datenschutz-Zeile');
    L.ok(/^Apartments/.test(await bub('.side .nav-i[data-tab="apart"]')) && await ev(() => view.tab === 'apart'), 'Was ist das? Navigation „Apartments“');
    await ev(() => { view.ap.tab = 'reinigung'; render(); }); await p.waitForTimeout(200);
    const before = await ev(() => JSON.stringify(S.apart.cleans));
    L.ok(/^Reinigung nach Abreise/.test(await bub('#app .ap-ck')) && await ev(b0 => JSON.stringify(S.apart.cleans) === b0, before), 'Was ist das? Kästchen erklärt, hakt aber nicht ab');
    L.ok(/^Wäsche/.test(await bub('#app .ap-wash')) && /^Wer reinigt/.test(await bub('#app .ap-who')), 'Was ist das? Wäsche, Wer reinigt');
    await ev(() => helpSet(false));
    L.ok(p.errs.length === 0, 'keine Fehler', p.errs); await p.context().close(); }
  await L.done(b, []); })();
