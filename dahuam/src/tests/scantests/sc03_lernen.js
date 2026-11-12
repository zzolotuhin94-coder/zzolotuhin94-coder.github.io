// Unbekannter Code (künstliche Kamera): Hinweis mit dem Code, schnelle Suche, Artikel ohne Code zuerst und nach dem Lagerort,
// in dem gerade gezählt wird; „Überspringen“; zuordnen = gelernt (bleibt nach dem Neuladen); dann gleich das Zählblatt.
// Außerhalb der Inventur: Artikel-Blatt (Bestand, Lagerort, Mindestbestand, letzter Preis). Rollen: Team darf zuordnen und zählen,
// „Neuer Artikel“ und Code entfernen nur der Chef. XSS im Code-Text.
const L = require('./lib'); const path = require('path');
const key = async (p, s) => { for(const k of s) await p.click(`#scSheet .sc-pad [data-v="${k}"]`); };
(async () => {
  const b0 = await L.launch(); const pg = await b0.newPage(); await pg.goto(L.BASE + 'manifest.webmanifest');
  const sc = await L.scene(pg, 'ean13', '900222333001', {w:480, h:640, mod:2, rot:2}); await b0.close();
  const CODE = sc.text, f = L.y4m(path.join(L.OUT, 'cam-unbekannt.y4m'), sc.w, sc.h, sc.data);
  const b = await L.launchCam(f); const {p} = await L.open(b, {...L.PHONE}); const ev = (fn, a) => p.evaluate(fn, a);
  await ev(() => { P('butter').ean = ['9001234560026']; P('milk').ean = ['9001234560033']; S.invDraft = {date:new Date().toISOString(), counts:{}}; save(); });
  await L.go(p, 'ware/inventur');
  // zuletzt im Tiefkühler gezählt → Tiefkühler zuerst
  await p.click('#app [data-scan="invList"]'); await p.waitForTimeout(250);
  const fries = await ev(() => P('fries').name); await p.fill('#scLq', fries.slice(0, 4)); await p.waitForTimeout(100);
  await p.click(`#scLs [data-id="fries"]`); await key(p, '4'); await p.click('#scSave'); await p.waitForTimeout(200);
  L.ok(await ev(() => S.invDraft.counts.fries === 4 && __scan.lastLoc === 'T'), 'ohne Code gezählt: Pommes im Tiefkühler (merkt sich den Lagerort)');
  await p.click('#scSheet [data-sc="close"]'); await p.waitForTimeout(200);
  // ---------- unbekannter Code ----------
  await p.click('#app [data-scan="inv"]'); await L.wait(p, () => __scan.layer === 'learn', null, 20000);
  const s1 = await ev(() => ({code:document.querySelector('#scSheet .sc-code').textContent, h:document.querySelector('#scSheet .sc-name').innerText, kind:document.querySelector('#scSheet .sc-h small').textContent,
    rows:[...document.querySelectorAll('#scLl .sc-row')].map(r => ({id:r.dataset.id, loc:P(r.dataset.id).loc, n:(P(r.dataset.id).ean || []).length})), neu:!!document.querySelector('#scSheet [data-sc="newProd"]'), skip:!!document.querySelector('#scSheet [data-sc="skip"]')}));
  L.ok(/Unbekannter Code/.test(s1.h) && s1.code === CODE && /EAN-13 · Prüfziffer stimmt/.test(s1.kind), `„Unbekannter Code ${CODE}“, EAN-13, Prüfziffer stimmt`, s1.kind);
  const firstCoded = s1.rows.findIndex(r => r.n > 0); const locs = s1.rows.filter(r => !r.n).map(r => r.loc);
  L.ok(s1.rows.length === 40 && (firstCoded === -1 || s1.rows.slice(firstCoded).every(r => r.n > 0)) && locs[0] === 'T' && locs.lastIndexOf('T') < locs.findIndex(l => l !== 'T'), 'Liste: Artikel ohne Code zuerst, der Tiefkühler (wo gerade gezählt wird) vorn', locs.slice(0, 8));
  L.ok(s1.neu && s1.skip, 'Chef: „Neuer Artikel“ und „Überspringen“');
  await p.waitForTimeout(350); await L.shot(p, 'unbekannter-code-handy', {review:true});
  // überspringen: der Code meldet sich ein paar Sekunden nicht
  await p.click('#scSheet .sc-acts [data-sc="skip"]'); await p.waitForTimeout(1500);
  L.ok(await ev(() => __scan.open && __scan.layer === null && !document.querySelector('#scLast:not([hidden])')), 'Überspringen: zurück zur Kamera, nichts gespeichert');
  await L.wait(p, () => __scan.layer === 'learn', null, 20000);
  // Suche mit 2–3 Buchstaben
  await p.fill('#scQ', 'ber'); await p.waitForTimeout(100);
  const s2 = await ev(() => [...document.querySelectorAll('#scLl .sc-row')].map(r => P(r.dataset.id).name));
  L.ok(s2[0] === 'Zillertaler Bergkäse' && s2.length <= 3, '„ber“ → Zillertaler Bergkäse oben (Wortanfang zählt)', s2);
  await p.fill('#scQ', 'BUT'); await p.waitForTimeout(100);
  const s3 = await ev(() => [...document.querySelectorAll('#scLl .sc-row')].map(r => ({n:P(r.dataset.id).name, tag:(r.querySelector('.sc-tag') || {}).textContent || ''})));
  L.ok(s3.length === 2 && s3[0].n === 'Butterschmalz' && s3[1].n === 'Butter' && s3[1].tag === '1 Code', '„BUT“ → Butterschmalz (noch ohne Code) vor Butter (Hinweis „1 Code“)', s3);
  await p.fill('#scQ', 'berg'); await p.waitForTimeout(100); await p.click('#scLl [data-id="bergkase"]'); await p.waitForTimeout(200);
  const s4 = await ev(c => ({ean:P('bergkase').ean, layer:__scan.layer, pid:__scan.cnt && __scan.cnt.pid, toast:document.querySelector('#toast').textContent}), CODE);
  L.ok(s4.ean.join() === CODE && s4.layer === 'count' && s4.pid === 'bergkase' && /Code gelernt: Zillertaler Bergkäse/.test(s4.toast), 'gewählt: Code bei Bergkäse gespeichert („gelernt“), gleich weiter zum Zählblatt', s4);
  await key(p, '2,35'); await p.click('#scSave'); await p.waitForTimeout(200);
  L.ok(await ev(() => S.invDraft.counts.bergkase) === 2.35, 'Bergkäse 2,35 kg gezählt');
  await p.reload(); await L.ready(p);
  L.ok(await ev(c => P('bergkase').ean.join() === c && S.invDraft.counts.bergkase === 2.35 && eanFind(c).id === 'bergkase', CODE), 'nach dem Neuladen: Code und Zählung sind gespeichert');
  // ---------- außerhalb der Inventur: Artikel nachschlagen (Bestand) ----------
  await L.go(p, 'ware/bestand');
  L.ok(await ev(() => !!document.querySelector('#app .toolbar [data-scan="look"]')), 'Bestand: Knopf „Scannen“ neben der Suche');
  await p.click('#app .toolbar [data-scan="look"]'); await L.wait(p, () => __scan.layer === 'info', null, 20000);
  const s5 = await ev(() => ({name:document.querySelector('#scSheet .sc-name').textContent, kpi:document.querySelector('#scSheet .sc-kpi').innerText.replace(/\s+/g, ' '), sub:document.querySelector('#scSheet .sc-h small').textContent, codes:document.querySelector('#scSheet .sc-codes').innerText.replace(/\s+/g, ' '), del:document.querySelectorAll('#scSheet [data-sc="eanDel"]').length, edit:!!document.querySelector('#scSheet [data-sc="editProd"]')}));
  L.ok(s5.name === 'Zillertaler Bergkäse' && /BESTAND 7 kg MINDEST.?BESTAND 6 kg LETZTER PREIS € 18,00 je kg · geliefert 10\.11\.2026/i.test(s5.kpi) && /Kühlhaus/.test(s5.sub), 'Artikel-Blatt: Bestand, Mindestbestand, letzter Preis mit Lieferdatum, Lagerort', s5);
  L.ok(s5.del === 1 && s5.edit, 'Chef: Code entfernen und Bearbeiten möglich');
  await p.waitForTimeout(350); await L.shot(p, 'artikel-blatt-handy', {review:true});
  await p.click('#scSheet [data-sc="eanDel"]'); await p.waitForTimeout(200);
  L.ok(await ev(() => P('bergkase').ean.length === 0 && /noch keiner/.test(document.querySelector('#scSheet .sc-codes').textContent)), 'Chef entfernt den Code');
  // jetzt wieder unbekannt: neuer Artikel (Chef)
  await p.click('#scSheet .sc-acts [data-sc="back"]'); await L.wait(p, () => __scan.layer === 'learn', null, 20000);
  L.ok(await ev(() => __scan.mode === 'look'), 'außerhalb der Inventur wird ebenfalls gelernt');
  await p.click('#scSheet [data-sc="newProd"]'); await p.waitForTimeout(300);
  L.ok(await ev(c => document.querySelector('#dlg').open && document.querySelector('#pdEan').value === c, CODE), '„Neuer Artikel“: Dialog mit dem Code im Feld EAN');
  await L.dlgFill(p, {name:'Graukäse <img src=x onerror=window.__xss=1>', price:'12,5'}); await L.dlgOk(p); await p.waitForTimeout(300);
  const s6 = await ev(c => { const np = S.products.find(x => /^Graukäse/.test(x.name)); return {ean:np && np.ean.join(), layer:__scan.layer, name:document.querySelector('#scSheet .sc-name') && document.querySelector('#scSheet .sc-name').textContent, xss:!!window.__xss}; }, CODE);
  L.ok(s6.ean === CODE && s6.layer === 'info' && /^Graukäse <img/.test(s6.name) && !s6.xss, 'neu angelegt mit Code; das Artikel-Blatt zeigt ihn (Name als Text, kein HTML)', s6);
  await p.click('#scan [data-sc="close"]'); await p.waitForTimeout(200);
  // ---------- Team ----------
  await ev(c => { const np = S.products.find(x => /^Graukäse/.test(x.name)); np.ean = []; S.settings.currentUser = 'u_staff'; save(); render(); }, CODE);
  await L.go(p, 'ware/inventur'); await p.click('#app [data-scan="inv"]'); await L.wait(p, () => __scan.layer === 'learn', null, 20000);
  L.ok(await ev(() => !document.querySelector('#scSheet [data-sc="newProd"]') && !!document.querySelector('#scSheet [data-sc="skip"]')), 'Team: kein „Neuer Artikel“, aber zuordnen und überspringen');
  await p.fill('#scQ', 'zwieb'); await p.waitForTimeout(100); await p.click('#scLl .sc-row'); await p.waitForTimeout(200);
  L.ok(await ev(c => P('onion').ean.join() === c && __scan.layer === 'count' && __scan.cnt.pid === 'onion', CODE), 'Team ordnet den Code der Zwiebel zu und zählt');
  await key(p, '12'); await p.click('#scSave'); await p.waitForTimeout(200);
  L.ok(await ev(() => S.invDraft.counts.onion === 12), 'Team: 12 kg Zwiebeln gezählt');
  await p.click('#scan [data-sc="close"]'); await p.waitForTimeout(200);
  await L.go(p, 'ware/bestand'); await p.click('#app .toolbar [data-scan="look"]'); await L.wait(p, () => __scan.layer === 'info', null, 20000);
  L.ok(await ev(() => document.querySelectorAll('#scSheet [data-sc="eanDel"]').length === 0 && !document.querySelector('#scSheet [data-sc="editProd"]') && !!document.querySelector('#scSheet [data-sc="moveIn"]')), 'Team im Artikel-Blatt: kein Entfernen, kein Bearbeiten; Wareneingang buchen geht');
  L.ok(await ev(c => eanRemove(P('onion'), c) === false && P('onion').ean.length === 1, CODE), 'Team kann einen Code auch sonst nicht entfernen');
  await p.click('#scSheet [data-sc="moveIn"]'); await p.waitForTimeout(250);
  L.ok(await ev(() => document.querySelector('#dlg').open && document.querySelector('#mvPid').value === 'onion'), 'Wareneingang aus dem Artikel-Blatt: Dialog für die Zwiebel über dem Scanner');
  await p.fill('#dlgForm [name=qty]', '5'); await L.dlgOk(p); await p.waitForTimeout(250);
  L.ok(await ev(() => __scan.layer === 'info' && /BESTAND 25 kg/i.test(document.querySelector('#scSheet .sc-kpi').innerText.replace(/\s+/g, ' '))), 'nach dem Buchen zeigt das Blatt den neuen Bestand (25 kg)');
  L.ok(p.errs.length === 0, 'keine Fehler', p.errs);
  await L.done(b, p.errs);
})();
