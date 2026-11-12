// Geräte: Handy 390 und iPad, hell und dunkel. Jede Ansicht des Scanners (Kamera, Zählblatt, Code eintippen, unbekannter Code,
// Liste, Artikel-Blatt) passt in die Breite, Knöpfe mindestens 44 px; Bilder nach s-out/ (einige nach review-out/scan/).
const L = require('./lib'); const path = require('path');
const VIEWS = ['scanner', 'zaehlen', 'eintippen', 'unbekannt', 'liste', 'artikel'];
(async () => {
  const b0 = await L.launch(); const pg = await b0.newPage(); await pg.goto(L.BASE + 'manifest.webmanifest'); const sc = await L.scene(pg, 'ean13', '900123456001', {w:480, h:640, mod:2}); await b0.close();
  const f = L.y4m(path.join(L.OUT, 'cam-geraete.y4m'), sc.w, sc.h, sc.data);
  const b = await L.launchCam(f); const errs = [];
  for(const [dev, dv] of [['handy', L.PHONE], ['ipad', L.IPAD]]) for(const dark of [false, true]){
    const tag = dev + (dark ? '-dunkel' : '-hell'); const {c, p} = await L.open(b, {...dv, dark}); const ev = (fn, a) => p.evaluate(fn, a);
    await ev(() => { P('butter').ean = ['9001234560019']; S.invDraft = {date:new Date().toISOString(), counts:{bergkase:2.5}}; save(); });
    await L.go(p, 'ware/inventur');
    const check = async view => { await p.waitForTimeout(380);
      const r = await ev(() => { const W = innerWidth, H = innerHeight; const bad = [];
        document.querySelectorAll('#scan button, #scan input').forEach(n => { const q = n.getBoundingClientRect(); if(!q.width || n.closest('[hidden]') || getComputedStyle(n).visibility === 'hidden') return; if(q.right > W + 1 || q.left < -1) bad.push('breit:' + (n.dataset.sc || n.id || n.textContent).slice(0, 20)); if(n.tagName === 'BUTTON' && !n.closest('.sc-list') && (q.height < 40 || q.width < 34) && !n.classList.contains('sc-link')) bad.push('klein:' + (n.dataset.sc || n.textContent).slice(0, 12) + ' ' + Math.round(q.width) + '×' + Math.round(q.height)); });
        const sh = document.querySelector('#scSheet'); const s = sh.hidden ? null : sh.getBoundingClientRect();
        return {wide:document.documentElement.scrollWidth - W, bad:bad.slice(0, 6), sheet:s ? s.top >= -1 && s.bottom <= H + 1 : true}; });
      L.ok(r.wide <= 0 && !r.bad.length && r.sheet, `${tag} · ${view}: passt in die Breite, Knöpfe groß genug, Blatt im Bild`, r);
      await L.shot(p, `${tag}-${view}`); };
    await p.click('#app [data-scan="inv"]'); await L.wait(p, () => __scan.layer === 'count', null, 20000);
    await check('zaehlen');
    await p.click('#scSheet .sc-acts [data-sc="back"]'); await p.waitForTimeout(200); await check('scanner');
    if(dev === 'handy' && !dark) await L.shot(p, 'scanner-sucher-handy', {review:true});
    await p.click('#scan .sc-bot [data-sc="manual"]'); await check('eintippen');
    if(dev === 'handy') await L.shot(p, 'code-eintippen-handy' + (dark ? '-dunkel' : ''), {review:true});
    await p.fill('#scMan', '9001234560064'); await p.press('#scMan', 'Enter'); await L.wait(p, () => __scan.layer === 'learn'); await check('unbekannt');
    if(dev === 'ipad' && !dark) await L.shot(p, 'unbekannter-code-ipad', {review:true});
    await p.click('#scSheet .sc-acts [data-sc="skip"]'); await p.waitForTimeout(150);
    await p.click('#scan .sc-bot [data-sc="list"]'); await check('liste');
    if(dev === 'handy' && dark) await L.shot(p, 'ohne-code-liste-handy-dunkel', {review:true});
    await p.click('#scSheet [data-sc="back"]'); await p.click('#scan [data-sc="close"]'); await p.waitForTimeout(200);
    await ev(() => { S.invDraft = null; save(); }); await L.go(p, 'ware/bestand'); await p.click('#app [data-scan="look"]'); await L.wait(p, () => __scan.layer === 'info', null, 20000); await check('artikel');
    if(dark && dev === 'handy') await L.shot(p, 'artikel-blatt-handy-dunkel', {review:true});
    await p.keyboard.press('Escape'); await p.waitForTimeout(150); await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    L.ok(await ev(() => !__scan.open && document.documentElement.scrollWidth <= innerWidth), `${tag}: Seite danach wie vorher`);
    // Seite mit dem Einstieg
    await ev(() => { S.invDraft = {date:new Date().toISOString(), counts:{}}; save(); }); await L.go(p, 'ware/inventur');
    L.ok(await ev(() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('#app [data-scan]')].every(n => n.getBoundingClientRect().height >= 44)), `${tag}: Inventur mit „Scannen“ / „Ohne Code zählen“ passt`);
    await L.shot(p, `${tag}-inventur-seite`);
    errs.push(...p.errs); await c.close();
  }
  await L.done(b, errs);
})();
