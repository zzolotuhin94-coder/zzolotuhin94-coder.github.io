// Schreibfehler werden sichtbar und kosten nichts: voller Speicher, kein IndexedDB, gar kein Speicher
const L = require('./lib'); const fs = require('fs');
const FAIL_PUT = () => { const put = IDBObjectStore.prototype.put; window.__fail = false; IDBObjectStore.prototype.put = function(){ if(window.__fail && this.name === 'units') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); return put.apply(this, arguments); }; };
(async () => { const b = await L.launch(); const errs = [];
  const bar = p => p.evaluate(() => { const n = document.querySelector('#relBars .rel-bar.bad'); return n ? n.innerText.replace(/\s+/g, ' ') : ''; });
  { const c = await L.ctx(b, {init:FAIL_PUT}); const p = await L.page(c);
    await p.evaluate(() => { S.settings.name = 'Vorher'; save(); }); await L.idle(p);
    L.ok(await p.evaluate(() => document.querySelector('.save-ind').textContent === 'Gespeichert' && !document.querySelector('.save-ind').hidden) && !(await bar(p)), 'Normalfall: Anzeige „Gespeichert“, keine Statuszeile');
    await p.evaluate(() => { window.__fail = true; S.settings.name = 'Trotz vollem Speicher'; S.settings.target = 31; save(); }); await p.waitForTimeout(500);
    const t = await bar(p);
    L.ok(/^Nicht gespeichert – der Speicher dieses Browsers ist voll/.test(t) && /Erneut versuchen/.test(t) && /Sicherung jetzt speichern/.test(t), 'voller Speicher: ruhige Zeile mit beiden Knöpfen', t);
    L.ok(await p.evaluate(() => document.querySelector('.save-ind').textContent === 'Nicht gespeichert' && __store.status().dirty && !!localStorage.getItem(KEY + '_journal')), 'Anzeige „Nicht gespeichert“, Änderung steht im Journal');
    L.ok(await p.evaluate(async () => (await new Promise(r => { const q = indexedDB.open('dahuam202_daten'); q.onsuccess = () => { const g = q.result.transaction('units').objectStore('units').get('settings'); g.onsuccess = () => r(g.result); }; })).includes('Vorher')), 'der letzte gute Stand im Speicher ist unberührt');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#relBars [data-rel=backup]')]); const f = await dl.path(); const bk = JSON.parse(fs.readFileSync(f, 'utf8'));
    L.ok(bk.settings.name === 'Trotz vollem Speicher' && bk.schema === 2 && /1\.\d/.test(bk.app), '„Sicherung jetzt speichern“ liefert eine Datei mit dem aktuellen Stand', [bk.settings.name, bk.app]);
    await p.click('#relBars [data-rel=retry]'); await p.waitForTimeout(300); L.ok(/Nicht gespeichert/.test(await bar(p)), '„Erneut versuchen“ bei weiter vollem Speicher: Zeile bleibt');
    await p.evaluate(() => { window.__fail = false; }); await p.click('#relBars [data-rel=retry]'); await p.waitForTimeout(1500); await L.idle(p);
    L.ok(!(await bar(p)) && await p.evaluate(() => !__store.status().dirty && !localStorage.getItem(KEY + '_journal') && document.querySelector('.save-ind').textContent === 'Gespeichert'), 'Platz wieder da → „Erneut versuchen“ speichert, Zeile verschwindet', [await bar(p), await p.evaluate(() => [__store.status(), localStorage.getItem(KEY + '_journal') && 1, document.querySelector('.save-ind').textContent])]);
    await p.reload(); await L.ready(p); L.ok(await p.evaluate(() => S.settings.name === 'Trotz vollem Speicher' && S.settings.target === 31), 'nach Neuladen ist nichts verloren');
    // Fehler bleibt bestehen, Seite wird geschlossen: Journal holt die Änderung beim nächsten Start zurück
    await p.evaluate(() => { window.__fail = true; S.settings.name = 'Nur im Journal'; save(); }); await p.waitForTimeout(300);
    await p.reload(); await L.ready(p); await L.idle(p);
    L.ok(await p.evaluate(async () => S.settings.name === 'Nur im Journal' && (await __store.read()).settings.name === 'Nur im Journal'), 'Fehler bis zum Schließen: Änderung kommt beim nächsten Start aus dem Journal zurück und wird gespeichert');
    // von selbst: nächster Versuch nach ein paar Sekunden
    await p.evaluate(() => { window.__fail = true; S.settings.name = 'Auto'; save(); }); await p.waitForTimeout(300); await p.evaluate(() => { window.__fail = false; }); await p.waitForTimeout(4600);
    L.ok(!(await bar(p)) && await p.evaluate(() => !__store.status().dirty), 'die App versucht es nach kurzer Zeit von selbst noch einmal');
    errs.push(...p.errs.filter(e => !/Speichern fehlgeschlagen/.test(e))); await c.close(); }

  { // Foto lässt sich nicht speichern (früher: still verloren)
    const c = await L.ctx(b, {init:() => { const put = IDBObjectStore.prototype.put; window.__failImg = false; IDBObjectStore.prototype.put = function(){ if(window.__failImg && this.name === 'img') throw new DOMException('quota', 'QuotaExceededError'); return put.apply(this, arguments); }; }}); const p = await L.page(c); await p.waitForTimeout(400);
    const mk = () => { const cv = document.createElement('canvas'); cv.width = 40; cv.height = 30; cv.getContext('2d').fillRect(0, 0, 40, 30); return cv.toDataURL('image/jpeg'); };
    await p.evaluate(`(() => { const d = (${mk})(); imgPut('img_ok', d); S.menu[0].img = 'img_ok'; save(); })()`); await p.waitForTimeout(700);
    L.ok(!(await p.evaluate(() => document.querySelector('#relBars .rel-bar'))), 'Foto normal gespeichert: keine Zeile');
    await p.evaluate(`(() => { window.__failImg = true; const d = (${mk})(); imgPut('img_x', d); S.menu[1].img = 'img_x'; save(); })()`); await p.waitForTimeout(800);
    const t = await bar(p); L.ok(/^Foto nicht gespeichert – .*Erneut versuchen.*Sicherung jetzt speichern$/.test(t), 'Foto nicht angenommen: Zeile mit beiden Knöpfen', t);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#relBars [data-rel=backup]')]); L.ok(!!JSON.parse(fs.readFileSync(await dl.path(), 'utf8')).images.img_x, '… die Sicherung enthält das Foto trotzdem');
    await p.evaluate(() => { window.__failImg = false; }); await p.click('#relBars [data-rel=photoRetry]'); await p.waitForTimeout(1600);
    L.ok(!(await bar(p)), '„Erneut versuchen“ speichert das Foto, Zeile verschwindet', await bar(p)); await p.reload(); await L.ready(p); await p.waitForTimeout(500);
    L.ok(await p.evaluate(() => !!IMG.img_x && !!IMG.img_ok), 'nach Neuladen sind beide Fotos da');
    errs.push(...p.errs); await c.close(); }

  { // kein IndexedDB → localStorage wie früher, aber mit sichtbaren Fehlern
    const c = await L.ctx(b, {init:() => { Object.defineProperty(window, 'indexedDB', {get(){ return undefined; }}); }}); const p = await L.page(c);
    await p.evaluate(() => { S.settings.name = 'Ohne IDB'; save(); }); await p.waitForTimeout(100);
    L.ok(await p.evaluate(() => __store.status().mode === 'ls' && JSON.parse(localStorage.getItem(KEY)).settings.name === 'Ohne IDB' && !__store.status().dirty), 'ohne IndexedDB: localStorage als Ausweichlösung');
    await p.reload(); await L.ready(p); L.ok(await p.evaluate(() => S.settings.name === 'Ohne IDB'), '… überlebt Neuladen');
    await p.evaluate(() => { const si = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v){ if(k === KEY) throw new DOMException('quota', 'QuotaExceededError'); return si.call(this, k, v); }; S.settings.name = 'Voll'; save(); }); await p.waitForTimeout(200);
    L.ok(/Nicht gespeichert – der Speicher dieses Browsers ist voll/.test(await bar(p)), '… voller localStorage wird genauso gemeldet (früher: still verloren)', await bar(p));
    await p.evaluate(() => go('setup')); await p.waitForTimeout(200); L.ok(/einfacher Speicher/.test(await p.evaluate(() => document.querySelector('#relPanel .rel-kv').innerText)), 'Einstellungen nennen die Ausweichlösung');
    errs.push(...p.errs.filter(e => !/Speichern fehlgeschlagen/.test(e))); await c.close(); }

  { // gar kein Speicher (privates Fenster mit gesperrtem Speicher)
    const c = await L.ctx(b, {init:() => { Object.defineProperty(window, 'indexedDB', {get(){ return undefined; }}); Object.defineProperty(window, 'localStorage', {get(){ throw new DOMException('denied', 'SecurityError'); }}); }});
    const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push('PE ' + e.message)); await p.goto(L.URL); await L.ready(p);
    L.ok(await p.evaluate(() => S.menu.length > 50 && __store.status().mode === 'mem'), 'ohne jeden Speicher: App startet trotzdem');
    await p.evaluate(() => { S.settings.name = 'x'; save(); }); await p.waitForTimeout(150);
    L.ok(/Nicht gespeichert – dieser Browser lässt hier kein Speichern zu/.test(await bar(p)), '… und sagt es deutlich', await bar(p));
    errs.push(...p.errs); await c.close(); }
  await L.done(b, errs); })();
