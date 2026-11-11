// Absturz zwischen „geändert“ und „geschrieben“: das Journal holt die Änderung zurück. Schließen und Wegnavigieren verlieren nichts.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  const crash = async p => { const cdp = await p.context().newCDPSession(p); cdp.send('Page.crash').catch(() => {}); await new Promise(r => setTimeout(r, 400)); await p.close().catch(() => {}); };
  { const c = await L.ctx(b); let p = await L.page(c);
    await p.evaluate(() => { S.settings.name = 'Stand 1'; save(); }); await p.waitForTimeout(600); await L.idle(p); const rev0 = await p.evaluate(() => __store.status().rev);
    const before = await p.evaluate(() => { S.settings.name = 'Kurz vor dem Absturz'; S.products[0].stock = 77.5; save(); return new Promise(r => setTimeout(() => r({j:!!localStorage.getItem(KEY + '_journal'), st:__store.status()}), 15)); });
    L.ok(before.j && before.st.dirty && before.st.rev === rev0, '15 ms nach save(): Journal geschrieben, IndexedDB noch nicht', before.st);
    await crash(p);
    p = await L.page(c); await p.waitForTimeout(700);
    const a = await p.evaluate(async () => ({name:S.settings.name, stock:S.products[0].stock, pers:(await __store.read()).settings.name, j:localStorage.getItem(KEY + '_journal'), rev:__store.status().rev, toast:document.querySelector('#toast').textContent}));
    L.ok(a.name === 'Kurz vor dem Absturz' && a.stock === 77.5, 'nach dem Absturz ist die letzte Änderung wieder da', a);
    L.ok(a.pers === 'Kurz vor dem Absturz' && a.j === null && a.rev === rev0 + 1, '… ist jetzt fest gespeichert, Journal geleert');
    L.ok(/wiederhergestellt/.test(a.toast), '… mit einem kurzen Hinweis', a.toast);
    errs.push(...p.errs); await c.close(); }
  { // allererste Änderung überhaupt (noch nichts in IndexedDB), dann Absturz
    const c = await L.ctx(b); let p = await L.page(c);
    await p.evaluate(() => { S.settings.name = 'Erste Änderung'; save(); return new Promise(r => setTimeout(r, 15)); }); await crash(p);
    p = await L.page(c); await p.waitForTimeout(500);
    L.ok(await p.evaluate(async () => S.settings.name === 'Erste Änderung' && S.menu.length > 50 && (await __store.read()).settings.name === 'Erste Änderung'), 'Absturz vor dem allerersten Schreiben: Stand kommt vollständig aus dem Journal');
    errs.push(...p.errs); await c.close(); }
  { // Tab schließen, sofort neu laden, wegnavigieren
    const c = await L.ctx(b); let p = await L.page(c);
    await p.evaluate(() => { S.settings.name = 'A'; save(); }); await L.idle(p);
    await p.evaluate(() => { S.settings.name = 'Vor dem Schließen'; save(); }); await p.close({runBeforeUnload:true}); await new Promise(r => setTimeout(r, 300));
    p = await L.page(c); L.ok(await p.evaluate(() => S.settings.name) === 'Vor dem Schließen', 'ändern und Fenster sofort schließen: gespeichert');
    await p.evaluate(() => { S.settings.name = 'Vor dem Wegklicken'; save(); }); await p.goto('about:blank'); await p.goto(L.URL); await L.ready(p);
    L.ok(await p.evaluate(() => S.settings.name) === 'Vor dem Wegklicken', 'ändern und sofort auf eine andere Seite: gespeichert');
    for(let i = 0; i < 5; i++){ await p.evaluate(i => { S.settings.target = 20 + i; save(); }, i); await p.reload(); await L.ready(p); }
    L.ok(await p.evaluate(() => S.settings.target) === 24, 'fünfmal ändern und sofort neu laden: jedes Mal gespeichert');
    // viele Änderungen kurz hintereinander: ein Schreibvorgang nach dem anderen, am Ende stimmt alles
    const r = await p.evaluate(async () => { const r0 = __store.status().rev; for(let i = 0; i < 40; i++){ S.settings.name = 'Tipp ' + i; save(); await new Promise(r => setTimeout(r, 7)); } await __store.idle(); return {name:(await __store.read()).settings.name, writes:__store.status().rev - r0}; });
    L.ok(r.name === 'Tipp 39' && r.writes >= 1 && r.writes <= 6, `40 Änderungen in 0,3 s → ${r.writes} Schreibvorgänge, letzter Stand gespeichert`, r);
    errs.push(...p.errs); await c.close(); }
  await L.done(b, errs); })();
