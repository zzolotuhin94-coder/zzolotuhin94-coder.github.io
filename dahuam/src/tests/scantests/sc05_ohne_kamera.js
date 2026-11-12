// Ohne Kamera: keine Erlaubnis (Hinweis für iPhone Safari), keine sichere Verbindung, keine Kamera; Code eintippen; XSS im Code;
// ohne Strichcode zählen (Liste nach Lagerort, mit einer Hand); Schnellsuche; Wareneingang abhaken; offline (Leser im Offline-Paket).
const L = require('./lib'); const path = require('path');
const key = async (p, s) => { for(const k of s) await p.click(`#scSheet .sc-pad [data-v="${k}"]`); };
const DENY = () => { const md = navigator.mediaDevices; if(md) md.getUserMedia = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')); };
const INSECURE = () => { Object.defineProperty(window, 'isSecureContext', {get:() => false}); };
(async () => { const errs = [];
  // ---------- keine Erlaubnis ----------
  { const b = await L.launch(); const {p} = await L.open(b, {...L.PHONE, init:DENY}); const ev = (f, a) => p.evaluate(f, a);
    await ev(() => { P('butter').ean = ['9001234560019']; S.invDraft = {date:new Date().toISOString(), counts:{}}; save(); });
    await L.go(p, 'ware/inventur'); await p.click('#app [data-scan="inv"]'); await L.wait(p, () => __scan.cam === 'denied');
    const o = await ev(() => ({t:document.querySelector('#scOff h3').textContent, txt:document.querySelector('#scOff').innerText.replace(/\s+/g, ' '), retry:!!document.querySelector('#scOff [data-sc="retry"]'), man:!!document.querySelector('#scMan2'), list:document.querySelector('#scOff [data-sc="list"]').textContent, vf:getComputedStyle(document.querySelector('#scVf')).display}));
    L.ok(o.t === 'Kamera nicht erlaubt' && /Einstellungen › Safari › Kamera/.test(o.txt) && /„aA“.*Website-Einstellungen › Kamera › Erlauben/.test(o.txt) && /Home-Bildschirm/.test(o.txt), 'keine Erlaubnis: klarer Hinweis für iPhone Safari (Einstellungen › Safari › Kamera; aA › Website-Einstellungen)', o.txt.slice(0, 200));
    L.ok(o.retry && o.man && o.list === 'Ohne Code zählen' && o.vf === 'none', 'dazu: Erneut versuchen, Code eintippen, ohne Code zählen; kein Sucher', o);
    await L.shot(p, 'ohne-kamera-handy', {review:true});
    await p.fill('#scMan2', '9001234560018'); L.ok(/Prüfziffer passt nicht/.test(await L.txt(p, '#scManH2')), 'Tippfehler: Prüfziffer-Warnung schon beim Tippen');
    await p.fill('#scMan2', '9001234560019'); await p.press('#scMan2', 'Enter'); await p.waitForTimeout(200);
    L.ok(await ev(() => __scan.layer === 'count' && __scan.cnt.pid === 'butter'), 'eingetippter Code: Butter, Zählblatt');
    await key(p, '3'); await p.click('#scSave'); await p.waitForTimeout(200);
    L.ok(await ev(() => S.invDraft.counts.butter === 3 && !document.querySelector('#scOff').hidden && __scan.cam === 'denied'), 'gespeichert; der Hinweis bleibt (keine neue Kamera-Anfrage)');
    await p.click('#scOff [data-sc="retry"]'); await L.wait(p, () => __scan.cam === 'denied'); L.ok(true, 'Erneut versuchen: fragt wieder, wieder abgelehnt');
    // XSS im eingetippten Code
    L.ok(await ev(() => getComputedStyle(document.querySelector('#scan .sc-bot')).display === 'none'), 'ohne Kamera: die Knöpfe unten fallen weg (stehen im Hinweis)');
    await p.fill('#scMan2', '<img src=x onerror=window.__xss=1>'); await p.press('#scMan2', 'Enter'); await p.waitForTimeout(250);
    const x = await ev(() => ({layer:__scan.layer, code:document.querySelector('#scSheet .sc-code').textContent, img:!!document.querySelector('#scSheet img'), xss:!!window.__xss, kind:document.querySelector('#scSheet .sc-h small').textContent}));
    L.ok(x.layer === 'learn' && x.code === '<img src=x onerror=window.__xss=1>' && !x.img && !x.xss && x.kind === 'Code', 'Code mit HTML wird als Text gezeigt, nichts ausgeführt', x);
    await p.click('#scSheet .sc-acts [data-sc="skip"]'); await p.waitForTimeout(150);
    await p.click('#scan [data-sc="close"]'); await p.waitForTimeout(150);
    errs.push(...p.errs); await b.close(); }
  // ---------- keine sichere Verbindung / keine Kamera ----------
  { const b = await L.launch(); const {p} = await L.open(b, {...L.PHONE, init:INSECURE}); const ev = (f, a) => p.evaluate(f, a);
    await L.go(p, 'ware/bestand'); await p.click('#app [data-scan="look"]'); await L.wait(p, () => __scan.cam === 'insecure');
    L.ok(await ev(() => document.querySelector('#scOff h3').textContent === 'Kamera nur über https' && !document.querySelector('#scOff [data-sc="retry"]') && /sichere Verbindung/.test(document.querySelector('#scOff').textContent)), 'ohne https: Hinweis, kein „Erneut versuchen“');
    errs.push(...p.errs); await b.close(); }
  { const b = await L.launch(); const {p} = await L.open(b, {...L.PHONE}); const ev = (f, a) => p.evaluate(f, a);
    await L.go(p, 'ware/bestand'); await p.click('#app [data-scan="look"]'); await L.wait(p, () => __scan.cam && __scan.cam !== 'on');
    L.ok(await ev(() => ['nocam', 'error', 'denied'].includes(__scan.cam) && !!document.querySelector('#scMan2')), 'Browser ohne Kamera: Hinweis und Code eintippen', await ev(() => __scan.cam));
    await p.click('#scOff [data-sc="list"]'); await p.waitForTimeout(150);
    L.ok(await ev(() => __scan.layer === 'list' && /Artikel suchen/.test(document.querySelector('#scSheet .sc-name').textContent)), 'außerhalb der Inventur: „Artikel suchen“');
    await p.fill('#scLq', 'zwi'); await p.waitForTimeout(100); await p.click('#scLs [data-id="onion"]'); await p.waitForTimeout(150);
    L.ok(await ev(() => __scan.layer === 'info' && /Zwiebel/.test(document.querySelector('#scSheet .sc-name').textContent)), 'Treffer öffnet das Artikel-Blatt');
    await p.click('#scSheet .sc-acts [data-sc="back"]'); await p.waitForTimeout(150);
    L.ok(await ev(() => __scan.layer === 'list'), 'zurück in die Liste');
    // Schnellsuche
    await p.click('#scSheet [data-sc="back"]'); await p.click('#scan [data-sc="close"]'); await p.waitForTimeout(150);
    await ev(() => palOpen()); await p.waitForTimeout(100);
    L.ok(await ev(() => !!document.querySelector('#pal .sc-pal')), 'Schnellsuche: Scan-Knopf im Suchfeld');
    await p.fill('#palIn', 'strich'); await p.waitForTimeout(100);
    L.ok(await ev(() => palItems[0] && palItems[0].n === 'Strichcode scannen'), 'Schnellsuche: „Strichcode scannen“ als Aktion');
    await p.click('#pal .sc-pal'); await p.waitForTimeout(250);
    L.ok(await ev(() => __scan.open && __scan.mode === 'look' && document.querySelector('#pal').hidden), 'der Knopf öffnet den Scanner (nachschlagen)');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    errs.push(...p.errs); await b.close(); }
  // ---------- ohne Strichcode zählen ----------
  { const b = await L.launch(); const {p} = await L.open(b, {...L.PHONE}); const ev = (f, a) => p.evaluate(f, a);
    await ev(() => { S.invDraft = {date:new Date().toISOString(), counts:{}}; save(); }); await L.go(p, 'ware/inventur');
    await p.click('#app [data-scan="invList"]'); await p.waitForTimeout(250);
    const l = await ev(() => ({layer:__scan.layer, cam:__scan.stream, grp:[...document.querySelectorAll('#scLs .sc-grp span')].map(x => x.textContent), first:document.querySelector('#scLs .sc-row').dataset.id, sub:document.querySelector('#scLsub').textContent, h:document.querySelector('#scSheet').getBoundingClientRect().height, rowH:document.querySelector('#scLs .sc-row').getBoundingClientRect().height}));
    L.ok(l.layer === 'list' && !l.cam && l.grp.join('|') === 'Kühlhaus|Tiefkühler|Trockenlager|Gemüselager|Bar & Weinkeller' && l.sub === '0 von 65 gezählt', 'Liste ohne Kamera: nach Lagerort wie die Zählliste, Fortschritt oben', l);
    L.ok(l.h > 760 && l.rowH >= 56, 'ganze Höhe, Zeilen mindestens 56 px hoch (mit dem Daumen gut zu treffen)', l);
    const first = l.first; await p.click(`#scLs [data-id="${first}"]`); await key(p, '1,5'); await p.click('#scSave'); await p.waitForTimeout(300);
    const l2 = await ev(f => ({c:S.invDraft.counts[f], layer:__scan.layer, next:document.querySelector('#scLs .sc-row.next') && document.querySelector('#scLs .sc-row.next').dataset.id, done:document.querySelector(`#scLs [data-id="${f}"]`).classList.contains('done'), sub:document.querySelector('#scLsub').textContent, grp:document.querySelector('#scLs .sc-grp small').textContent}), first);
    L.ok(l2.c === 1.5 && l2.layer === 'list' && l2.done && l2.next && l2.next !== first && l2.sub === '1 von 65 gezählt' && l2.grp === '1 / 21', 'gespeichert, zurück in der Liste: Zeile abgehakt, der nächste Artikel ist markiert', l2);
    await p.click(`#scLs [data-id="${l2.next}"]`); await key(p, '0'); await p.click('#scSave'); await p.waitForTimeout(250);
    L.ok(await ev(n => S.invDraft.counts[n] === 0, l2.next), 'auch 0 kann gezählt werden');
    await p.click(`#scLs .sc-row.next`); await p.click('#scSave'); await p.waitForTimeout(150);
    L.ok(/Bitte die gezählte Menge eingeben/.test(await L.txt(p, '#scRes')) && await ev(() => __scan.layer === 'count'), 'ohne Eingabe speichern: Hinweis, nichts gezählt');
    await p.click('#scSheet .sc-acts [data-sc="back"]'); await p.waitForTimeout(150);
    L.ok(await ev(() => __scan.layer === 'list'), 'Abbrechen: zurück in die Liste');
    await p.fill('#scLq', 'zwieb'); await p.waitForTimeout(100);
    L.ok(await ev(() => [...document.querySelectorAll('#scLs .sc-row')].map(r => P(r.dataset.id).name).join('|') === 'Zwiebel|Rote Zwiebel|Frühlingszwiebel'), 'Suche in der Liste: Name beginnt so, dann Wortanfang, dann mitten im Wort');
    await p.fill('#scLq', ''); await p.waitForTimeout(100); await L.shot(p, 'ohne-code-liste-handy', {review:true});
    await p.click('#scSheet [data-sc="toCam"]'); await L.wait(p, () => __scan.cam && __scan.cam !== '');
    L.ok(await ev(() => __scan.camWanted && __scan.layer === null), '„Mit Kamera scannen“ schaltet auf die Kamera um');
    await p.click('#scan [data-sc="close"]'); await p.waitForTimeout(250);
    L.ok(await ev(f => document.querySelector('#inv-' + f).value === '1,5' && document.querySelector('#invProg').textContent === '2 / 65', first), 'Zählliste der Seite zeigt die Werte');
    // Wareneingang
    const oid = await ev(() => { const o = S.orders.find(x => ['sent', 'confirmed'].includes(x.status) && x.lines.length >= 2); o.lines.forEach((l, i) => { P(l.pid).ean = ['2' + String(i).padStart(11, '0')].map(x => x + gtinCheck(x)); }); save(); view.stab = 'bestellung'; view.order = o.id; view.recv = o.id; go('buy'); return o.id; }); await p.waitForTimeout(250);
    L.ok(await ev(() => !!document.querySelector('#app [data-scan="recv"]')), 'Wareneingang prüfen: Knopf „Scannen“');
    await p.click('#app [data-scan="recv"]'); await L.wait(p, () => __scan.cam && __scan.cam !== 'on' && __scan.cam !== '');
    const c1 = await ev(id => { const o = S.orders.find(x => x.id === id); return {code:P(o.lines[1].pid).ean[0], n:o.lines[1].n, ou:o.lines[1].ou, name:P(o.lines[1].pid).name}; }, oid);
    L.ok(/Wareneingang/.test(await L.txt(p, '#scTitle')) && /0 von \d+ Positionen gescannt/.test(await L.txt(p, '#scSub')), 'Scanner im Wareneingang: Positionen gescannt');
    await p.fill('#scMan2', c1.code); await p.press('#scMan2', 'Enter'); await p.waitForTimeout(200);
    L.ok(await ev(c => __scan.layer === 'count' && document.querySelector('#scBuf').textContent === String(c.n).replace('.', ',') && document.querySelector('#scSheet .sc-out em').textContent === c.ou, c1), `gescannte Position: ${c1.name}, vorbelegt mit der bestellten Menge`);
    await p.click('#scSheet [data-sc="step"][data-v="-1"]'); await p.click('#scSave'); await p.waitForTimeout(200);
    L.ok(await ev(([id, n]) => S.orders.find(x => x.id === id).lines[1].delivered === n - 1 && /1 von \d+ Positionen gescannt/.test(document.querySelector('#scSub').textContent), [oid, c1.n]), 'eine weniger geliefert: eingetragen, Position abgehakt');
    const other = await ev(id => { const o = S.orders.find(x => x.id === id); const q = stockProducts().find(x => !o.lines.some(l => l.pid === x.id)); q.ean = ['9001234560019']; return q.name; }, oid);
    await p.fill('#scMan2', '9001234560019'); await p.press('#scMan2', 'Enter'); await p.waitForTimeout(200);
    L.ok(await L.txt(p, '#scLast') === `„${other}“ ist nicht in dieser Bestellung.`, 'Artikel aus einer anderen Lieferung: Hinweis', await L.txt(p, '#scLast'));
    await p.click('#scan [data-sc="close"]'); await p.waitForTimeout(250);
    L.ok(await ev(n => document.querySelector('#rd-1').value === String(n - 1).replace('.', ','), c1.n), 'Wareneingang-Formular zeigt die gelieferte Menge');
    errs.push(...p.errs); await b.close(); }
  // ---------- offline ----------
  { const b0 = await L.launch(); const pg = await b0.newPage(); await pg.goto(L.BASE + 'manifest.webmanifest'); const sc = await L.scene(pg, 'ean13', '900123456001', {w:480, h:640, mod:2}); await b0.close();
    const f = L.y4m(path.join(L.OUT, 'cam-offline.y4m'), sc.w, sc.h, sc.data);
    const b = await L.launchCam(f); const c = await L.ctx(b, {sw:true, vp:L.PHONE.vp, ctx:L.PHONE.ctx}); const p = await L.page(c, L.BASE + 'index.html?nointro'); const ev = (fn, a) => p.evaluate(fn, a);
    await ev(() => navigator.serviceWorker.ready); await p.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout:30000});
    L.ok(await ev(async () => { const k = (await caches.keys()).find(x => x === 'dahuam202-' + APP_BUILD); const cc = await caches.open(k); return !!(await cc.match(new URL('vendor/zxing-library.min.js', location.href).href)); }), 'Offline-Paket enthält den Strichcode-Leser (vendor/zxing-library.min.js)');
    L.ok(await ev(() => !window.ZXing), 'beim Start nicht geladen (erst beim Öffnen des Scanners)');
    await ev(() => { P('butter').ean = ['9001234560019']; S.invDraft = {date:new Date().toISOString(), counts:{}}; save(); }); await L.idle(p);
    await c.setOffline(true); await p.reload(); await L.ready(p);
    await L.go(p, 'ware/inventur'); await p.click('#app [data-scan="inv"]'); await L.wait(p, () => __scan.layer === 'count', null, 25000);
    L.ok(await ev(() => !!window.ZXing && __scan.cnt.pid === 'butter'), 'ohne Netz: Leser aus dem Offline-Paket, Butter erkannt');
    errs.push(...p.errs.filter(e => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e))); await b.close(); }
  await L.done(await L.launch(), errs);
})();
