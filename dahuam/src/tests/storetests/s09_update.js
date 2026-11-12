// Neue Version: wird im Hintergrund geholt, gemeldet, und erst nach „Neu laden“ (oder beim nächsten Start) verwendet. Nie gemischt.
const L = require('./lib'); const fs = require('fs'); const http = require('http'); const path = require('path');
const SRC = process.env.SITE || '/home/user/wt-2/dahuam/'; const PORT = 8771;
const MIME = {html:'text/html; charset=utf-8', js:'text/javascript', json:'application/json', webmanifest:'application/manifest+json', png:'image/png', svg:'image/svg+xml', webp:'image/webp', woff2:'font/woff2', md:'text/plain'};
(async () => {
  const html1 = fs.readFileSync(SRC + 'index.html', 'utf8'), sw1 = fs.readFileSync(SRC + 'sw.js', 'utf8'); const B1 = /APP_BUILD = '([0-9a-f]+)'/.exec(html1)[1]; const B2 = 'ffff' + B1.slice(4);
  const mk = (s, mark) => s.split(B1).join(B2).replace("const APP_VERSION", "window.__V2 = '" + mark + "'; const APP_VERSION");
  const html2 = mk(html1, 'zwei'), sw2 = sw1.split(B1).join(B2);
  const cur = {html:html1, sw:sw1}; const hits = [];
  const srv = http.createServer((q, s) => { const u = decodeURIComponent(q.url.split('?')[0]); hits.push(u);
    if(u === '/dahuam/' || u === '/dahuam/index.html'){ s.writeHead(200, {'content-type':MIME.html, 'cache-control':'max-age=600'}); return s.end(cur.html); }
    if(u === '/dahuam/sw.js'){ s.writeHead(200, {'content-type':MIME.js, 'cache-control':'max-age=600'}); return s.end(cur.sw); }
    const f = path.join(SRC, u.replace(/^\/dahuam\//, '')); if(!u.startsWith('/dahuam/') || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); return s.end(); }
    s.writeHead(200, {'content-type':MIME[f.split('.').pop()] || 'application/octet-stream', 'cache-control':'max-age=600'}); fs.createReadStream(f).pipe(s); }).listen(PORT);
  const b = await L.launch(); const c = await L.ctx(b, {sw:true}); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  const U = `http://127.0.0.1:${PORT}/dahuam/index.html?nointro`;
  await p.goto(U); await L.ready(p); await p.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout:20000});
  const ver = () => p.evaluate(async () => ({build:APP_BUILD, v2:window.__V2 || '', caches:(await caches.keys()).filter(k => k !== 'dahuam202-laufzeit'), bar:(document.querySelector('#relBars .rel-bar.info') || {innerText:''}).innerText.replace(/\s+/g, ' ')}));
  let v = await ver(); L.ok(v.build === B1 && v.caches.join() === 'dahuam202-' + B1 && !v.bar, 'Version 1 läuft aus ihrem Cache', v);
  await p.evaluate(() => { S.settings.name = 'Vor dem Update'; save(); }); await L.idle(p);
  // --- Server liefert kurz gemischt: neues sw.js, alte Seite → wird nicht übernommen ---
  cur.sw = sw2; await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()).catch(() => {})); await p.waitForTimeout(1500);
  v = await ver(); L.ok(!v.bar && v.caches.join() === 'dahuam202-' + B1, 'Server liefert neues sw.js mit alter Seite: unvollständiges Paket wird verworfen, keine Meldung', v);
  // --- vollständige Version 2 ---
  cur.html = html2; await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update())); await p.waitForFunction(() => document.querySelector('#relBars .rel-bar.info'), null, {timeout:20000});
  v = await ver(); L.ok(/^Neue Version bereit\..*Neu laden$/.test(v.bar) && v.build === B1, 'Version 2 liegt bereit: Zeile „Neue Version bereit“, Seite läuft unverändert weiter', v.bar);
  L.ok(v.caches.sort().join() === ['dahuam202-' + B1, 'dahuam202-' + B2].sort().join(), 'alter und neuer Cache liegen getrennt nebeneinander', v.caches);
  await p.evaluate(() => { go('setup'); document.querySelector('#s-name').focus(); document.querySelector('#s-name').value = 'Mitten im Tippen'; }); await p.waitForTimeout(1200);
  L.ok(await p.evaluate(() => document.querySelector('#s-name').value === 'Mitten im Tippen' && APP_BUILD) === B1, 'kein Neuladen von selbst, auch nicht mitten in einer Eingabe');
  await p.reload(); await L.ready(p); v = await ver();
  L.ok(v.build === B1 && !v.v2 && /Neue Version bereit/.test(v.bar), 'normales Neuladen: weiter komplett Version 1 (Seite und Dateien aus demselben Paket), Meldung bleibt', v);
  const fromOld = await p.evaluate(async b1 => { const r = await fetch('index.html'); return (await r.text()).includes("APP_BUILD = '" + b1 + "'"); }, B1); L.ok(fromOld, 'solange Version 1 läuft, kommt nichts aus Version 2');
  await p.evaluate(() => { S.settings.name = 'Kurz vor Neu laden'; save(); });
  await Promise.all([p.waitForEvent('load', {timeout:20000}), p.click('#relBars [data-rel=update]')]); await L.ready(p); await p.waitForTimeout(500); v = await ver();
  L.ok(v.build === B2 && v.v2 === 'zwei' && !v.bar, '„Neu laden“: Seite ist Version 2', v);
  L.ok(v.caches.join() === 'dahuam202-' + B2, 'alter Cache ist weg, es gibt nur noch Version 2', v.caches);
  L.ok(await p.evaluate(() => S.settings.name) === 'Kurz vor Neu laden', 'die Änderung von unmittelbar vor dem Neuladen ist gespeichert');
  // --- nächster Start ohne Knopf: neue Version übernimmt, wenn alle Fenster zu waren ---
  cur.html = html1.split(B1).join('eeee' + B1.slice(4)); cur.sw = sw1.split(B1).join('eeee' + B1.slice(4));
  await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update())); await p.waitForFunction(() => document.querySelector('#relBars .rel-bar.info'), null, {timeout:20000});
  await p.close(); await new Promise(r => setTimeout(r, 1500)); const p2 = await c.newPage(); await p2.goto(U); await L.ready(p2); await p2.waitForTimeout(400);
  const v3 = await p2.evaluate(async () => ({build:APP_BUILD, caches:(await caches.keys()).filter(k => k !== 'dahuam202-laufzeit'), bar:!!document.querySelector('#relBars .rel-bar.info')}));
  L.ok(v3.build === 'eeee' + B1.slice(4) && v3.caches.length === 1 && !v3.bar, 'App schließen und wieder öffnen: die neue Version ist ohne Zutun aktiv', v3);
  srv.close(); await L.done(b, p.errs); })();
