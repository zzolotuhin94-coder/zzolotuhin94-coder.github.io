const L = require('./lib');
(async () => { const b = await L.launch(); const c = await L.ctx(b); const p = await L.page(c);
  const st = await p.evaluate(async () => { save(); await __store.idle(); return {status:__store.status(), menu:S.menu.length, ls:localStorage.getItem(KEY), units:__store.st.pers.size, boot:__store.st.stats, read:(await __store.read()).menu.length}; });
  console.log(JSON.stringify(st));
  L.ok(st.status.mode === 'idb' && st.status.rev === 1 && !st.status.dirty, 'erste Speicherung in IndexedDB');
  L.ok(/_store/.test(st.ls), 'localStorage enthält nur noch den Marker', st.ls);
  await p.evaluate(() => { S.settings.name = 'Test A'; save(); });
  await p.reload(); await L.ready(p);
  L.ok(await p.evaluate(() => S.settings.name) === 'Test A', 'Änderung überlebt sofortiges Neuladen');
  const tabs = await p.evaluate(() => TABS.map(t => t[0]));
  for(const t of tabs){ await p.evaluate(t => go(t), t); await p.waitForTimeout(60); }
  L.ok(c.ext.length === 0, 'keine Fremdadressen', c.ext);
  // sauberer Neuanfang für Tests: nur auf localhost/127.0.0.1
  await p.goto(L.URL + '&fresh=1'); await L.ready(p);
  L.ok(await p.evaluate(async () => { const d = await __store.read(); return S.settings.name !== 'Test A' && S.demo === true && (!d || d.settings.name !== 'Test A') && (await __store.snaps()).length === 0; }), '„?fresh=1“ (nur auf localhost) beginnt mit leerem Speicher');
  L.ok(await p.evaluate(() => /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) && /isLocal = \/\^\(localhost\|127/.test(await p.content()), '… der Schalter ist an den Rechnernamen gebunden');
  await L.done(b, p.errs); })();
