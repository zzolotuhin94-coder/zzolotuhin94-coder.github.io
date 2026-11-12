// Eingebettet (Vorschau im Rahmen): kein Service Worker, kein Manifest, Speicher evtl. gesperrt. Die App läuft trotzdem und wirft nichts.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  for(const [label, sandbox] of [['Rahmen ohne eigenen Speicher (sandbox)', 'allow-scripts allow-downloads allow-modals'], ['Rahmen mit Speicher', null]]){
    const c = await L.ctx(b, {sw:true}); const p = await c.newPage(); const pe = []; p.on('pageerror', e => pe.push(e.message)); p.on('console', m => { if(m.type() === 'error' && !/Failed to load resource|sandboxed|SecurityError.*serviceWorker|blocked by CORS policy/.test(m.text())) pe.push('console: ' + m.text().slice(0, 160)); });
    await p.route('**/dahuam/rahmen.html', r => r.fulfill({contentType:'text/html', body:`<!doctype html><title>Vorschau</title><iframe id="f" ${sandbox ? `sandbox="${sandbox}"` : ''} src="index.html?nointro" style="width:1200px;height:800px;border:0"></iframe>`}));
    await p.goto(L.BASE + 'rahmen.html'); const f = p.frames().find(x => /index\.html/.test(x.url())) || (await p.waitForEvent('frameattached'), p.frames()[1]);
    await f.waitForFunction(() => !document.documentElement.classList.contains('booting') && !!document.querySelector('#app h1'), null, {timeout:15000}); await p.waitForTimeout(1500);
    const s = await f.evaluate(async () => ({framed:FRAMED, mode:__store.status().mode, menu:S.menu.length, sw:await (async () => { try { return (await navigator.serviceWorker.getRegistrations()).length; } catch(e){ return 0; } })(), manifest:!!document.querySelector('link[rel=manifest]'), ctl:(() => { try { return !!navigator.serviceWorker.controller; } catch(e){ return false; } })()}));
    L.ok(s.framed && s.menu > 50, label + ': App startet', s);
    L.ok(s.sw === 0 && !s.manifest && !s.ctl, label + ': kein Service Worker, kein Manifest');
    for(const t of await f.evaluate(() => TABS.map(t => t[0]))){ await f.evaluate(t => go(t), t); await p.waitForTimeout(40); }
    await f.evaluate(() => { S.settings.name = 'Im Rahmen'; save(); go('setup'); }); await p.waitForTimeout(400);
    const a = await f.evaluate(() => ({bar:(document.querySelector('#relBars .rel-bar') || {innerText:''}).innerText.replace(/\s+/g, ' '), off:document.querySelector('#relOff').textContent, st:__store.status()}));
    if(sandbox){ L.ok(s.mode === 'mem' && /^Vorschau\. Änderungen bleiben nur, solange diese Ansicht offen ist\.$/.test(a.bar), label + ': ruhiger Hinweis statt Fehlermeldung', a.bar); }
    else { L.ok(s.mode === 'idb' && !a.bar && !a.st.dirty && !a.st.error, label + ': speichert normal', a.st); }
    const gf = await f.evaluate(() => { const l = document.getElementById('relGf'); return l ? l.media + ' ' + /fonts\.googleapis\.com/.test(l.href) : ''; });
    if(sandbox) L.ok(/ true$/.test(gf) && await f.evaluate(() => document.querySelector('#app h1').offsetWidth > 0), label + ': eigene Schriften nicht erreichbar → Seite steht sofort in Systemschrift, Ersatz wird nachgeladen, ohne zu blockieren', gf); else L.ok(gf === '', label + ': eigene Schriften geladen, keine Anfrage an Dritte', gf);
    L.ok(/nein, nur in der installierten App/.test(a.off), label + ': Einstellungen sagen, dass Offline hier nicht geht', a.off);
    L.ok(pe.length === 0, label + ': keine Fehler', pe); errs.push(...pe); await c.close(); }
  { // als Datei geöffnet (file://): kein Service Worker
    const c = await L.ctx(b, {sw:true}); const p = await c.newPage(); const pe = []; p.on('pageerror', e => pe.push(e.message));
    await p.goto('file://' + (process.env.SITE || '/home/user/wt-2/dahuam/') + 'index.html?nointro'); await L.ready(p); await p.waitForTimeout(800);
    L.ok(await p.evaluate(() => S.menu.length > 50 && !swOk() && !document.querySelector('link[rel=manifest]')) && pe.length === 0, 'als Datei geöffnet: App läuft, kein Service Worker, keine Fehler', pe); await c.close(); }
  await L.done(b, errs); })();
