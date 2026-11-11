// Zeiten: save() mit 3 Jahren Daten, Start (erstes Bild) vorher/nachher, Handy-Profil mit 4-fach gedrosseltem Prozessor.
const L = require('./lib'); const synth = require('../review-technik/synth'); const fs = require('fs');
const OLD = fs.readFileSync(__dirname + '/../index.before-a.html', 'utf8');
(async () => { const b = await L.launch(); const out = {};
  const mk = async (old, throttle) => { const c = await b.newContext({viewport:{width:390, height:800}, isMobile:true, hasTouch:true, deviceScaleFactor:3}); await c.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
    await c.addInitScript(() => { try { sessionStorage.setItem('dahuam202_intro', '1'); localStorage.setItem('dahuam202_kueche_de_v1_guide', JSON.stringify({asked:1, mode:'full'})); } catch(e){} });
    const p = await c.newPage();
    // Messpunkt „App sichtbar“: erster Bildaufbau, nachdem die Überschrift der Startseite im Dokument steht
    await p.addInitScript(() => { window.__t = {}; const iv = setInterval(() => { const h = document.querySelector('#app h1'); if(h && !window.__t.h1){ window.__t.h1 = performance.now(); requestAnimationFrame(() => setTimeout(() => { window.__t.painted = performance.now(); }, 0)); clearInterval(iv); } }, 1); });
    if(old) await p.route('**/dahuam/alt.html*', r => r.fulfill({contentType:'text/html; charset=utf-8', body:OLD}));
    const url = old ? L.BASE + 'alt.html' : L.BASE + 'index.html'; await p.goto(url); await p.waitForTimeout(900); const cdp = await c.newCDPSession(p); if(throttle) await cdp.send('Emulation.setCPUThrottlingRate', {rate:4}); return {c, p, cdp, url}; };
  const start = async (p) => { const runs = []; for(let i = 0; i < 7; i++){ await p.reload({waitUntil:'load'}); await p.waitForTimeout(500);
      runs.push(await p.evaluate(() => { const fcp = performance.getEntriesByType('paint').find(x => x.name === 'first-contentful-paint'); const n = performance.getEntriesByType('navigation')[0]; return {sichtbar:Math.round(window.__t.painted), fcp:Math.round(fcp ? fcp.startTime : -1), dcl:Math.round(n.domContentLoadedEventEnd)}; })); }
    runs.sort((a, b) => a.sichtbar - b.sichtbar); return runs[3]; };
  for(const years of [0, 3]){
    for(const old of [true, false]){
      const {c, p} = await mk(old, true);
      if(years){ await p.evaluate(`(${synth.toString()})(${years})`); await p.evaluate(() => save()); if(!old) await p.evaluate(() => __store.idle()); else await p.waitForTimeout(300); }
      else { await p.evaluate(() => save()); await p.waitForTimeout(400); }
      const s = await start(p); const sz = await p.evaluate(() => JSON.stringify(S).length);
      // save(): Zeit, die der Aufruf den Bildschirm blockiert (bis die Seite wieder reagieren kann)
      const sv = await p.evaluate(async (old) => { const res = [];
        for(let i = 0; i < 5; i++){ S.settings.target = 20 + i; S.moves.unshift({id:'mv_t' + i, date:new Date().toISOString(), type:'in', pid:S.products[0].id, qty:1, price:1, note:'t'});
          if(!old){ __store.st.stats.maxSlice = 0; }
          const t0 = performance.now(); save(); const tCall = performance.now() - t0; await Promise.resolve(); const tBlock = performance.now() - t0;
          let tIdle = null, maxSlice = null, total = null; if(!old){ await __store.idle(); tIdle = performance.now() - t0; maxSlice = __store.st.stats.maxSlice; total = __store.st.stats.lastPass; }
          res.push({tCall, tBlock, tIdle, maxSlice, total}); await new Promise(r => setTimeout(r, 150)); }
        res.sort((a, b) => a.tBlock - b.tBlock); const m = res[2]; return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v == null ? null : Math.round(v*10)/10])); }, old);
      out[(old ? 'vorher' : 'nachher') + ' ' + years + 'J'] = {MB:+(sz/1e6).toFixed(2), start:s, save:sv};
      await c.close(); } }
  // ungedrosselt, 3 Jahre
  for(const old of [true, false]){ const {c, p} = await mk(old, false); await p.evaluate(`(${synth.toString()})(3)`); await p.evaluate(() => save()); if(!old) await p.evaluate(() => __store.idle());
    const sv = await p.evaluate(async old => { const r = []; for(let i = 0; i < 5; i++){ S.settings.target = 20 + i; if(!old) __store.st.stats.maxSlice = 0; const t0 = performance.now(); save(); await Promise.resolve(); const tb = performance.now() - t0; let ms = null; if(!old){ await __store.idle(); ms = __store.st.stats.maxSlice; } r.push([tb, ms]); await new Promise(x => setTimeout(x, 100)); } r.sort((a, b) => a[0] - b[0]); return {tBlock:Math.round(r[2][0]*10)/10, maxSlice:r[2][1] == null ? null : Math.round(r[2][1]*10)/10}; }, old);
    out[(old ? 'vorher' : 'nachher') + ' 3J ohne Drossel'] = {save:sv}; await c.close(); }
  for(const k of Object.keys(out)) console.log('  info  ' + k.padEnd(26) + JSON.stringify(out[k]));
  const n3 = out['nachher 3J'], v3 = out['vorher 3J'], n0 = out['nachher 0J'], v0 = out['vorher 0J'];
  L.ok(n3.save.tBlock < 50 && n3.save.maxSlice < 50, `3 Jahre, 4-fach gedrosselt: save() blockiert ${n3.save.tBlock} ms, längster Block ${n3.save.maxSlice} ms (Ziel < 50; vorher ${v3.save.tBlock} ms)`);
  L.ok(n0.save.tBlock < 50, `Demostand, 4-fach gedrosselt: save() blockiert ${n0.save.tBlock} ms (vorher ${v0.save.tBlock} ms)`);
  L.ok(n0.start.sichtbar < v0.start.sichtbar + 150 && n3.start.sichtbar < v3.start.sichtbar + 250, `Start, 4-fach gedrosselt, App sichtbar: Demostand ${v0.start.sichtbar} → ${n0.start.sichtbar} ms, 3 Jahre ${v3.start.sichtbar} → ${n3.start.sichtbar} ms`);
  console.log(`  info  erstes Bild überhaupt (FCP): Demostand ${v0.start.fcp} → ${n0.start.fcp} ms, 3 Jahre ${v3.start.fcp} → ${n3.start.fcp} ms. Vorher erschien zuerst die leere Hülle (Seitenleiste), jetzt bleibt der Hintergrund stehen, bis die Daten da sind.`);
  console.log('  info  In der Vorher-Messung waren die Google-Schriften gesperrt (kein Netz im Test); nachher werden die eigenen Schriftdateien wirklich geladen (rund 30 ms bei 4-facher Drossel).');
  fs.writeFileSync(__dirname + '/perf.json', JSON.stringify(out, null, 1));
  await L.done(b, []); })();
