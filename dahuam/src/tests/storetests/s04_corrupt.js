// Unlesbare Daten werden nie still durch Demodaten ersetzt: Wiederherstellungs-Seite, Rohdaten bleiben erhalten.
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch(); const errs = [];
  const rec = p => p.evaluate(() => { const n = document.querySelector('.rel-rec'); return n ? {h:n.querySelector('h1').textContent, btns:[...n.querySelectorAll('button')].map(x => x.textContent.trim()), S:typeof S === 'undefined' || S == null ? null : 'gesetzt'} : null; });
  const idbRaw = p => p.evaluate(() => new Promise(r => { const q = indexedDB.open('dahuam202_daten'); q.onsuccess = () => { const t = q.result.transaction(['kv', 'units']); const m = t.objectStore('kv').get('meta'), c = t.objectStore('kv').get('corrupt'), k = t.objectStore('units').getAllKeys(); t.oncomplete = () => r({meta:m.result, corrupt:c.result, keys:k.result.length}); }; }));
  const setLs = (c, v) => c.addInitScript(v => { if(!sessionStorage.getItem('once')){ sessionStorage.setItem('once', '1'); localStorage.setItem('dahuam202_kueche_de_v1', v); } }, v);

  { // a) alter localStorage-Stand ist kein gültiges JSON
    const GARBAGE = '{"settings":{"name":"Mein Lokal"},"products":[{"id":"p1","na';
    const c = await L.ctx(b); await setLs(c, GARBAGE); const p = await L.page(c); const r = await rec(p);
    L.ok(r && /beschädigt/.test(r.h) && r.S === null, 'kaputter Stand → Wiederherstellungs-Seite statt Demodaten', r);
    L.ok(r && ['Datei wählen', 'Mit Demodaten starten', 'Leer starten', 'Als Datei speichern'].every(x => r.btns.includes(x)), 'Auswahl: Sicherung laden, Demodaten, leer, Rohdaten speichern', r && r.btns);
    L.ok(await p.evaluate(g => localStorage.getItem(KEY) === g, GARBAGE), 'der Rohstand im localStorage ist unberührt');
    const x = await idbRaw(p); L.ok(!x.meta && x.keys === 0 && x.corrupt && x.corrupt.raw === GARBAGE, 'nichts überschrieben; Rohstand zusätzlich in IndexedDB aufgehoben');
    await p.evaluate(() => { save(); window.dispatchEvent(new Event('pagehide')); }); await p.waitForTimeout(200); L.ok(!(await idbRaw(p)).meta, 'solange nicht entschieden ist, schreibt die App nichts');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-rel=recRaw]')]); L.ok(JSON.parse(fs.readFileSync(await dl.path(), 'utf8')).raw === GARBAGE, 'Rohstand lässt sich als Datei speichern');
    await p.reload(); await L.ready(p); L.ok(!!(await rec(p)), 'Neuladen ändert nichts: Seite fragt wieder');
    await p.click('[data-rel=recDemo]'); await p.waitForTimeout(400); await L.idle(p);
    const y = await idbRaw(p); L.ok(await p.evaluate(() => S.menu.length > 50 && !document.querySelector('.rel-rec') && !document.documentElement.classList.contains('rel-recover')) && y.meta.rev === 1 && y.corrupt.raw === GARBAGE, 'nach „Mit Demodaten starten“ läuft die App, der Rohstand bleibt aufgehoben');
    errs.push(...p.errs); await c.close(); }

  { // b) gültiges JSON, aber keine App-Daten → gleiche Seite; „Leer starten“
    const c = await L.ctx(b); await setLs(c, '{"hallo":1}'); const p = await L.page(c); const r = await rec(p);
    L.ok(r && /beschädigt/.test(r.h), 'fremde Daten im Speicher → Wiederherstellungs-Seite');
    await p.click('[data-rel=recEmpty]'); await p.waitForTimeout(400);
    L.ok(await p.evaluate(() => S.menu.length === 0 && S.products.length === 0 && !S.demo && !!S.team && !!S.checks), '„Leer starten“ legt einen leeren Betrieb an');
    for(const t of await p.evaluate(() => TABS.map(t => t[0]))){ await p.evaluate(t => go(t), t); await p.waitForTimeout(50); }
    L.ok(p.errs.length === 0, 'leerer Betrieb: alle Bereiche öffnen ohne Fehler', p.errs);
    errs.push(...p.errs); await c.close(); }

  { // c) IndexedDB-Stand beschädigt (ein Teil fehlt, einer ist unlesbar) → früheren Stand laden
    const c = await L.ctx(b); const p = await L.page(c);
    await p.evaluate(() => { S.settings.name = 'Guter Stand'; S.demo = false; save(); }); await L.idle(p);
    await p.evaluate(() => __store.snapNow('hand', 'Test')); await p.evaluate(() => { S.settings.name = 'Neuester Stand'; save(); }); await L.idle(p);
    await p.evaluate(() => new Promise(r => { const q = indexedDB.open('dahuam202_daten'); q.onsuccess = () => { const t = q.result.transaction('units', 'readwrite'); t.objectStore('units').put('{"kaputt', 'menu'); t.objectStore('units').delete('cards'); t.oncomplete = r; }; }));
    await p.evaluate(() => { __store.st.frozen = true; }); await p.reload(); await L.ready(p); const r = await rec(p);
    L.ok(r && /beschädigt/.test(r.h) && r.btns.includes('Laden'), 'beschädigter Stand in IndexedDB → Seite bietet frühere Stände an', r);
    const x = await idbRaw(p); L.ok(x.corrupt && x.corrupt.kind === 'idb' && x.corrupt.units.settings.includes('Neuester Stand') && x.corrupt.units.menu === '{"kaputt', 'alle Teile des beschädigten Stands sind aufgehoben');
    await p.click('.rel-rec [data-rel=snap]'); await p.waitForTimeout(500); await L.idle(p);
    const g = await p.evaluate(async () => { const d = await __store.read(); return {name:S.settings.name, menu:S.menu.length, cards:S.cards.length, pc:d.cards.length, st:__store.status(), msg:(document.querySelector('#relRecMsg') || {}).textContent}; }); L.ok(g.name === 'Guter Stand' && g.menu > 50 && g.cards > 10 && g.pc === g.cards, 'früherer Stand geladen und wieder vollständig gespeichert', g);
    await p.reload(); await L.ready(p); L.ok(!(await rec(p)) && await p.evaluate(() => S.settings.name === 'Guter Stand'), 'danach startet die App wieder normal');
    errs.push(...p.errs); await c.close(); }

  { // d) Marker da, IndexedDB leer (Browser hat den Speicher geräumt) und e) Sicherung auf der Seite laden
    const c = await L.ctx(b); await setLs(c, '{"_store":"idb","rev":7,"at":"2026-01-01T00:00:00.000Z"}'); const p = await L.page(c); const r = await rec(p);
    L.ok(r && /nicht mehr da/.test(r.h) && !r.btns.includes('Als Datei speichern'), 'Speicher vom Browser geräumt → Seite sagt es, statt Demodaten zu zeigen', r);
    const bk = __dirname + '/tmp_backup.json'; const d = await p.evaluate(() => { const d = seed(); d.settings.name = 'Aus der Sicherung'; d.demo = false; return JSON.stringify(d); }); fs.writeFileSync(bk, d);
    fs.writeFileSync(__dirname + '/tmp_bad.json', '{"x":1}'); await p.setInputFiles('#relFile', __dirname + '/tmp_bad.json'); await p.waitForTimeout(300);
    L.ok(/keine Sicherung dieser App/.test(await p.textContent('#relRecMsg')) && !!(await rec(p)), 'falsche Datei: klare Meldung, Seite bleibt');
    await p.setInputFiles('#relFile', bk); await p.waitForTimeout(600); await L.idle(p);
    L.ok(await p.evaluate(async () => S.settings.name === 'Aus der Sicherung' && (await __store.read()).settings.name === 'Aus der Sicherung'), 'Sicherung von der Wiederherstellungs-Seite geladen und gespeichert');
    fs.unlinkSync(bk); fs.unlinkSync(__dirname + '/tmp_bad.json'); errs.push(...p.errs); await c.close(); }

  { // f) gespeicherter Stand ist neuer als die App → nichts anfassen
    const c = await L.ctx(b); const p = await L.page(c);
    await p.evaluate(async () => { const d = JSON.parse(JSON.stringify(S)); d.schema = 99; d.settings.name = 'Zukunft'; await __store.replace(d); }); await p.reload(); await L.ready(p); const r = await rec(p);
    L.ok(r && /neuer als diese App/.test(r.h) && r.btns.join() === 'Seite neu laden', 'Stand aus neuerer App-Version → nur „Seite neu laden“, keine Auswahl, die etwas überschreibt', r);
    const x = await idbRaw(p); L.ok(x.meta.schema === 99 && x.meta.rev >= 1, 'Stand unverändert');
    errs.push(...p.errs); await c.close(); }
  { // g) lesbar, aber innen beschädigt (Fälle aus der technischen Prüfung): entweder repariert die App den Stand, oder sie fragt. Nie leere Seite, nie stiller Ersatz.
    const cases = [['menu[0].name = 5', 'd.menu[0].name = 5'], ['salesDays = "oops"', 'd.salesDays = "oops"'], ['team = 5', 'd.team = 5'], ['Preis als Text, items = null', 'd.products[0].price = "abc"; d.cards[0].items = null'], ['orders = {}', 'd.orders = {}'], ['settings.users = "x"', 'd.settings.users = "x"'], ['settings = null', 'd.settings = null'], ['moves = [null, 5]', 'd.moves = [null, 5]'], ['suppliers = "x"', 'd.suppliers = "x"'], ['checks = []', 'd.checks = []']];
    const out = [];
    for(const [label, mut] of cases){ const c = await L.ctx(b); const p = await L.page(c);
      await p.evaluate(() => { S.settings.name = 'Echt'; S.demo = false; save(); }); await L.idle(p);
      await p.evaluate(async mut => { const d = await __store.read(); d.marker = 'meins'; new Function('d', mut)(d); await __store.replace(d); }, mut); await p.reload(); await L.ready(p); await p.waitForTimeout(300);
      for(const t of ['dash', 'menu', 'stock', 'buy', 'report', 'dienst', 'checkl', 'setup']){ await p.evaluate(t => { try { if(typeof S === 'object' && S && !document.querySelector('.rel-rec')) go(t); } catch(e){ window.__goErr = (window.__goErr || '') + t + ' '; } }, t); await p.waitForTimeout(40); }
      const r = await p.evaluate(async () => { const pers = await __store.read().catch(() => null); const c = await __store.kvGet('corrupt'); return {rec:!!document.querySelector('.rel-rec'), app:document.querySelector('#app').innerText.trim().length, mine:pers && pers.marker === 'meins', demo:typeof S === 'object' && S ? !!S.demo : null, goErr:window.__goErr || '', kept:!!(c && c.raw)}; });
      const good = r.app > 50 && r.mine && r.demo !== true && (r.rec ? r.kept : !r.goErr);
      out.push(`${label}: ${r.rec ? 'Wiederherstellungs-Seite' : 'repariert, App läuft'}${r.goErr ? ' (Fehler in: ' + r.goErr + ')' : ''}`); if(!good) L.ok(false, 'innen beschädigt: ' + label, r);
      await c.close(); }
    L.ok(true, 'innen beschädigte Stände (10 Fälle): nie leere Seite, nie Demodaten, eigener Stand bleibt im Speicher'); out.forEach(x => console.log('         ' + x)); }
  await L.done(b, errs.filter(e => !/Start:|unlesbar|Unexpected/.test(e))); })();
