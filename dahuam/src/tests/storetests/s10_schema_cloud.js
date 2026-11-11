// Datenformat: neuere Sicherungen und neuere Cloud-Stände werden abgelehnt, ältere wandern wie bisher. Cloud-Abgleich mit dem neuen Speicher.
const L = require('./lib'); const fs = require('fs'); const {spawn} = require('child_process');
const MOCK = 'http://127.0.0.1:9922';
(async () => { const b = await L.launch(); const errs = [];
  { const c = await L.ctx(b); const p = await L.page(c);
    await p.evaluate(() => { S.settings.name = 'Mein Stand'; save(); }); await L.idle(p);
    const mk = await p.evaluate(() => { const d = JSON.parse(JSON.stringify(S)); d.settings.name = 'Aus der Zukunft'; d.schema = 3; d.neuesFeld = {x:1}; return JSON.stringify(d); });
    const f = __dirname + '/tmp_neu.json'; fs.writeFileSync(f, mk);
    await p.evaluate(() => go('setup')); await p.setInputFiles('#importFile', f); await p.waitForTimeout(400);
    const t = await p.evaluate(() => document.querySelector('#dlg').open ? document.querySelector('#dlgForm').innerText.replace(/\s+/g, ' ') : '');
    L.ok(/Sicherung ist neuer als die App/.test(t) && /neueren Version der App/.test(t) && /nichts geändert/.test(t) && !/Daten ersetzen/.test(t), 'Sicherung mit neuerem Datenformat: klare Meldung, kein „Daten ersetzen“', t.slice(0, 200));
    await p.evaluate(() => document.querySelector('#dlg').close());
    L.ok(await p.evaluate(async () => S.settings.name === 'Mein Stand' && !('neuesFeld' in S) && (await __store.read()).settings.name === 'Mein Stand' && !__store.st.safety), '… Daten unverändert, nichts halb übernommen');
    L.ok(await p.evaluate(m => migrate(JSON.parse(m)) === null && (() => { try { loadBackup(JSON.parse(m)); return false; } catch(e){ return true; } })(), mk) && await p.evaluate(() => S.settings.name) === 'Mein Stand', 'auch direkt am Code vorbei: migrate() und loadBackup() lehnen ab');
    // ältere Sicherung (ohne schema) lädt wie bisher
    const old = await p.evaluate(() => { const d = JSON.parse(JSON.stringify(S)); delete d.schema; delete d.team; delete d.plan; d.settings.name = 'Alte Sicherung'; return JSON.stringify(d); }); fs.writeFileSync(f, old);
    await p.setInputFiles('#importFile', f); await p.waitForTimeout(400); await p.click('#dlgForm button[type=submit]'); await p.waitForTimeout(500);
    L.ok(await p.evaluate(() => S.settings.name === 'Alte Sicherung' && S.schema === 2 && !!S.team && !!S.plan), 'Sicherung im alten Format: wird wie bisher geladen und ergänzt');
    fs.unlinkSync(f); errs.push(...p.errs); await c.close(); }

  // ---------- Cloud (Test-Server sbmock.js) ----------
  const mock = spawn('node', [__dirname + '/../sbmock.js'], {stdio:'ignore'}); await new Promise(r => setTimeout(r, 900));
  try {
    const APP = MOCK + '/app/?nointro';
    const dev = async n => { const c = await b.newContext({viewport:{width:1300, height:900}}); await c.addInitScript(() => { try { localStorage.setItem('dahuam202_kueche_de_v1_guide', JSON.stringify({asked:1, mode:'full'})); } catch(e){} }); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(n + ': ' + e.message)); await p.goto(APP); await L.ready(p); return p; };
    // Das Formular nimmt nur https-Adressen an; der Test-Server spricht http. Darum wird dieselbe Funktion aufgerufen, die das Formular nach der Prüfung aufruft.
    const login = async (p, email, pw) => { await p.evaluate(() => go('setup')); await p.evaluate(async ([u, e, w]) => { try { await cloudConnectFlow(u, 'anon-key', e, w); render(); } catch(x){ CL.session = null; window.__cloudErr = cloudErrText(x); } }, [MOCK, email, pw]); await p.waitForTimeout(1000); };
    const stats = async () => (await fetch(MOCK + '/stats')).json();
    const A = await dev('A'); await login(A, 'anna@x', 'falsch'); L.ok(await A.evaluate(() => window.__cloudErr) === 'E-Mail oder Passwort falsch.' && !(await A.evaluate(() => cloudReady())), 'falsches Passwort: klare Meldung, nicht verbunden');
    await login(A, 'anna@x', 'pw1'); await A.waitForTimeout(500);
    let s = await stats(); L.ok(await A.evaluate(() => cloudReady()) && s.version === 1, 'Gerät A verbunden, Stand liegt in der Cloud', s.version);
    const base = await A.evaluate(async () => ({kv:!!(await __store.kvGet('base')), ls:localStorage.getItem(KEY + '_base'), mem:!!baseGet(), menu:(baseGet().menu || []).length}));
    L.ok(base.kv && base.ls === null && base.mem && base.menu > 50, 'Vergleichsstand für den Abgleich liegt in IndexedDB, nicht mehr im localStorage', base);
    const B = await dev('B'); await login(B, 'bernd@x', 'pw2'); await B.click('#dlgForm button[type=submit]'); await B.waitForTimeout(900);
    L.ok(await B.evaluate(async () => S.menu.length > 50 && cloudReady() && (await __store.read()).menu.length > 50), 'Gerät B hat die Cloud-Daten geladen und lokal gespeichert');
    const v0 = await A.evaluate(() => P('veal').stock);
    await A.evaluate(() => { receiveIn(P('veal'), 5, 30, 'Test A', new Date().toISOString()); P('flour').price = 1.05; save(); });
    await B.evaluate(() => { addMove('sale', 'veal', -1.7, 'Verkauf B'); S.menu.push({id:'m_new_b', section:'Desserts', name:'Topfenstrudel (von B)', desc:'', price:6.9, card:'', img:'', veg:'v', top:false, hidden:false, seasons:[], days:[], alg:'A C G', order:99}); save(); });
    await A.waitForTimeout(2500); await B.waitForTimeout(500);
    for(let i = 0; i < 2; i++){ await A.evaluate(() => cloudPoll()); await B.evaluate(() => cloudPoll()); await A.waitForTimeout(1500); }
    const want = Math.round((v0 + 5 - 1.7)*1000)/1000;
    const st = p => p.evaluate(async () => { await __store.idle(); const d = await __store.read(); return {veal:P('veal').stock, flour:P('flour').price, item:!!S.menu.find(m => m.id === 'm_new_b'), pVeal:d.products.find(x => x.id === 'veal').stock, pItem:!!d.menu.find(m => m.id === 'm_new_b'), v:CL.version, cs:cloudState}; });
    const ra = await st(A), rb = await st(B);
    L.ok(ra.veal === want && rb.veal === want && ra.flour === 1.05 && rb.flour === 1.05 && ra.item && rb.item, 'gleichzeitige Änderungen auf zwei Geräten werden zusammengeführt (Bestand, Preis, neues Gericht)', [ra, rb, want]);
    L.ok(ra.pVeal === want && rb.pVeal === want && ra.pItem && rb.pItem, 'der zusammengeführte Stand ist auf beiden Geräten auch lokal gespeichert');
    await A.reload(); await L.ready(A); await A.waitForTimeout(1500);
    L.ok(await A.evaluate(() => cloudReady() && cloudState === 'ok' && !!baseGet() && P('flour').price === 1.05), 'Neuladen: weiter verbunden, Vergleichsstand aus IndexedDB wieder da');
    await A.context().setOffline(true); await A.evaluate(() => { P('salt').price = 0.55; save(); }); await A.waitForTimeout(2200); const off = await A.evaluate(() => cloudState);
    await A.context().setOffline(false); await A.evaluate(() => cloudPoll()); await A.waitForTimeout(2500); await B.evaluate(() => cloudPoll()); await B.waitForTimeout(1500);
    L.ok(off === 'offline' && await B.evaluate(() => P('salt').price) === 0.55, 'ohne Netz geändert, später übertragen: kommt auf dem anderen Gerät an');
    // zweites Fenster desselben Geräts überträgt nicht doppelt
    const A2 = await A.context().newPage(); await A2.goto(APP); await L.ready(A2); await A2.waitForTimeout(600); const ver1 = (await stats()).version;
    await A2.evaluate(() => { S.settings.name = 'aus dem Lesefenster'; save(); return cloudPush(); }); await A2.waitForTimeout(800);
    L.ok((await stats()).version === ver1 && await A2.evaluate(() => __store.isReader()), 'Lesefenster schickt nichts in die Cloud'); await A2.close();
    // neuerer Stand in der Cloud (anderes Gerät hat schon die nächste App-Version)
    const tok = await (await fetch(MOCK + '/auth/v1/token?grant_type=password', {method:'POST', headers:{apikey:'anon-key', 'content-type':'application/json'}, body:JSON.stringify({email:'anna@x', password:'pw1'})})).json();
    const cur = await (await fetch(MOCK + '/rest/v1/rpc/get_state', {method:'POST', headers:{apikey:'anon-key', authorization:'Bearer ' + tok.access_token, 'content-type':'application/json'}, body:'{}'})).json();
    const fut = {...cur.data, schema:3, settings:{...cur.data.settings, name:'Zukunft'}};
    await fetch(MOCK + '/rest/v1/rpc/save_state', {method:'POST', headers:{apikey:'anon-key', authorization:'Bearer ' + tok.access_token, 'content-type':'application/json'}, body:JSON.stringify({p_data:fut, p_expected:cur.version})});
    const nameB = await B.evaluate(() => S.settings.name); await B.evaluate(() => cloudPoll()); await B.waitForTimeout(1200);
    const rb2 = await B.evaluate(() => ({name:S.settings.name, cs:cloudState, msg:cloudMsg, schema:S.schema, chip:document.querySelector('#cloudChip').textContent}));
    L.ok(rb2.name === nameB && rb2.schema === 2 && rb2.cs === 'err' && /Cloud-Daten stammen aus einer neueren Version/.test(rb2.msg), 'Cloud-Stand aus neuerer App-Version: nicht übernommen, klare Meldung', rb2);
    await B.evaluate(() => { P('salt').price = 0.66; save(); }); await B.waitForTimeout(2500); const fin = await (await fetch(MOCK + '/rest/v1/rpc/get_state', {method:'POST', headers:{apikey:'anon-key', authorization:'Bearer ' + tok.access_token, 'content-type':'application/json'}, body:'{}'})).json();
    L.ok(fin.data.schema === 3 && fin.data.settings.name === 'Zukunft' && await B.evaluate(async () => (await __store.read()).products.find(x => x.id === 'salt').price) === 0.66, '… die ältere App überschreibt den neueren Cloud-Stand nicht; lokal bleibt die eigene Änderung gespeichert');
    errs.push(...A.errs, ...B.errs);
  } finally { mock.kill(); }
  await L.done(b, errs); })();
