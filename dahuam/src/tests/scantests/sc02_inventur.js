// Kamera-Weg mit künstlicher Kamera (Chromium zeigt ein .y4m-Video mit Strichcode): bekannter Code in der laufenden Inventur →
// Zählblatt mit Soll und Einheit → Ziffernblock → Speichern → der Scanner läuft weiter; derselbe Code noch einmal: dazuzählen;
// Rückgängig; Getränk in Flaschen und Zehnteln (Grundeinheit Liter); Team darf zählen; Escape schließt.
const L = require('./lib'); const path = require('path');
const mk = async (b, type, text, file) => { const p = await b.newPage(); await p.goto(L.BASE + 'manifest.webmanifest'); const sc = await L.scene(p, type, text, {w:480, h:640, mod:2}); await p.close(); L.y4m(file, sc.w, sc.h, sc.data); return sc.text; };
const key = async (p, s) => { for(const k of s) await p.click(`#scSheet .sc-pad [data-v="${k}"]`); };
(async () => {
  const b0 = await L.launch(); const fB = path.join(L.OUT, 'cam-butter.y4m'), fW = path.join(L.OUT, 'cam-weizen.y4m');
  const cB = await mk(b0, 'ean13', '900123456001', fB), cW = await mk(b0, 'ean13', '900765432101', fW); await b0.close();
  const errs = [];
  // ---------- Butter: bekannter Code ----------
  { const b = await L.launchCam(fB); const {p} = await L.open(b, {...L.PHONE}); const ev = (f, a) => p.evaluate(f, a);
    await ev(c => { P('butter').ean = [c]; save(); }, cB);
    await L.go(p, 'ware/inventur'); await p.click('#app [data-act="invStart"]'); await p.waitForTimeout(300);
    L.ok(await ev(() => !!S.invDraft && !!document.querySelector('#app [data-scan="inv"]') && !!document.querySelector('#app [data-scan="invList"]')), 'laufende Inventur: Knöpfe „Scannen“ und „Ohne Code zählen“');
    const big = await ev(() => { const r = document.querySelector('#app [data-scan="inv"]').getBoundingClientRect(); return r.height >= 48 && r.width >= 150; }); L.ok(big, 'große Tippfläche für „Scannen“');
    await p.click('#app [data-scan="inv"]');
    await L.wait(p, () => __scan.layer === 'count');
    const s1 = await ev(() => ({pid:__scan.cnt.pid, cam:__scan.cam, eng:__scan.engine.kind, name:document.querySelector('#scSheet .sc-name').textContent, sub:document.querySelector('#scSheet .sc-h small').textContent, unit:document.querySelector('#scOut em').textContent, video:!!document.querySelector('#scVideo').srcObject, fm:document.querySelector('#scVideo').getAttribute('playsinline') !== null}));
    L.ok(await ev(() => document.querySelector('#scTorch').hidden), 'Kamera ohne Licht: kein Knopf „Licht“');
    L.ok(s1.pid === 'butter' && s1.cam === 'on' && s1.eng === 'zxing' && s1.video && s1.fm, 'Kamera läuft (playsinline für iPhone), ZXing liest, Code erkannt: Butter', s1);
    L.ok(s1.name === 'Butter' && /Kühlhaus · Soll 6 kg/.test(s1.sub) && s1.unit === 'kg', 'Zählblatt: Name, Lagerort, Soll 6 kg, Einheit kg', s1);
    await p.waitForTimeout(350); await L.shot(p, 'zaehlblatt-handy', {review:true});
    await key(p, '6,5'); const res = await L.txt(p, '#scRes');
    L.ok(/Differenz \+0,5 kg · \+€ 4,25/.test(res.replace(/\s/g, ' ')), 'Eingabe 6,5: Differenz +0,5 kg, Wert wird mitgerechnet', res);
    await p.click('#scSave'); await p.waitForTimeout(250);
    const s2 = await ev(() => ({c:S.invDraft.counts.butter, open:__scan.open, layer:__scan.layer, sub:document.querySelector('#scSub').textContent, last:document.querySelector('#scLast').innerText.replace(/\s+/g, ' ')}));
    L.ok(s2.c === 6.5 && s2.open && s2.layer === null && /1 von 65 gezählt/.test(s2.sub) && /Butter 6,5 kg gezählt Rückgängig/.test(s2.last), 'gespeichert in der Inventur (6,5 kg); der Scanner bleibt offen für den nächsten Artikel', s2);
    await L.shot(p, 'scanner-handy', {review:true});
    L.ok(await ev(() => __scan.layer === null), 'derselbe Code gleich danach öffnet nicht sofort wieder (Pause von ein paar Sekunden)');
    // noch einmal derselbe Artikel (zweiter Lagerplatz): dazuzählen
    await L.wait(p, () => __scan.layer === 'count', null, 20000);
    const s3 = await ev(() => ({mode:__scan.cnt.mode, had:document.querySelector('#scSheet .sc-had').innerText.replace(/\s+/g, ' ')}));
    L.ok(s3.mode === 'add' && /Schon gezählt: 6,5 kg/.test(s3.had), 'zweites Mal: „Schon gezählt: 6,5 kg“, Dazuzählen ist gewählt', s3);
    await key(p, '2'); L.ok(/Neu gesamt 8,5 kg/.test(await L.txt(p, '#scRes')), 'dazuzählen 2: neu gesamt 8,5 kg');
    await p.click('#scSheet [data-sc="mode"][data-v="set"]'); L.ok(/Differenz −4 kg/.test(await L.txt(p, '#scRes')) && await ev(() => document.querySelector('#scBuf').textContent === '2'), '„Neu zählen“: die getippte 2 ersetzt (2 kg, Differenz −4 kg)', await L.txt(p, '#scRes'));
    await p.click('#scSheet [data-sc="mode"][data-v="add"]'); await p.click('#scSave'); await p.waitForTimeout(200);
    L.ok(await ev(() => S.invDraft.counts.butter) === 8.5, 'gespeichert: 8,5 kg');
    await p.click('#scLast [data-sc="undo"]'); await p.waitForTimeout(150);
    L.ok(await ev(() => S.invDraft.counts.butter) === 6.5 && /zurückgenommen/.test(await L.txt(p, '#scLast')), 'Rückgängig: wieder 6,5 kg');
    // schließen: die Zählliste zeigt den Wert
    await p.click('#scan [data-sc="close"]'); await p.waitForTimeout(250);
    const s4 = await ev(() => ({open:__scan.open, hidden:document.querySelector('#scan').hidden, cam:!!document.querySelector('#scVideo').srcObject, v:document.querySelector('#inv-butter').value, prog:document.querySelector('#invProg').textContent, inert:document.querySelectorAll('[inert]').length, lock:document.documentElement.classList.contains('sc-open')}));
    L.ok(!s4.open && s4.hidden && !s4.cam && s4.v === '6,5' && s4.prog === '1 / 65' && !s4.inert && !s4.lock, 'Schließen: Kamera aus, Zählliste zeigt 6,5 bei Butter, Fortschritt 1 / 65', s4);
    // Team zählt mit; Escape schließt
    await L.team(p); await L.go(p, 'ware/inventur');
    L.ok(await ev(() => !document.querySelector('#app [data-scan="inv"]').disabled), 'Team: „Scannen“ ist frei');
    await p.click('#app [data-scan="inv"]'); await L.wait(p, () => __scan.layer === 'count', null, 20000);
    await p.click('#scSheet [data-sc="mode"][data-v="set"]'); await key(p, '5'); await p.click('#scSave'); await p.waitForTimeout(200);
    L.ok(await ev(() => S.invDraft.counts.butter) === 5, 'Team hat gezählt: 5 kg');
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    L.ok(await ev(() => !__scan.open && !__scan.stream), 'Escape schließt den Scanner');
    errs.push(...p.errs); await b.close(); }
  // ---------- Getränk: volle Flaschen und Zehntel ----------
  const TORCH = () => { MediaStreamTrack.prototype.getCapabilities = function(){ return {torch:true}; }; MediaStreamTrack.prototype.applyConstraints = function(c){ window.__torch = c; return Promise.resolve(); }; };
  { const b = await L.launchCam(fW); const {p} = await L.open(b, {...L.IPAD, dark:true, init:TORCH}); const ev = (f, a) => p.evaluate(f, a);
    await ev(c => { P('weizen').ean = [c]; S.invDraft = {date:new Date().toISOString(), counts:{}}; save(); }, cW);
    await L.go(p, 'ware/inventur'); await p.click('#app [data-scan="inv"]'); await L.wait(p, () => __scan.layer === 'count');
    L.ok(await ev(() => !document.querySelector('#scTorch').hidden), 'Kamera mit Licht: Knopf „Licht“ ist da');
    await p.click('#scSheet .sc-h [data-sc="back"]'); await p.click('#scTorch'); await p.waitForTimeout(100);
    L.ok(await ev(() => window.__torch && window.__torch.advanced[0].torch === true && document.querySelector('#scTorch').getAttribute('aria-pressed') === 'true'), 'Licht an (torch: true)');
    await L.wait(p, () => __scan.layer === 'count', null, 20000);
    const s = await ev(() => ({pid:__scan.cnt.pid, dr:__scan.cnt.dr, unit:document.querySelector('#scOut em').textContent, ten:document.querySelectorAll('#scSheet .sc-ten button').length, sub:document.querySelector('#scSheet .sc-h small').textContent}));
    L.ok(s.pid === 'weizen' && s.dr && s.unit === 'Fl.' && s.ten === 9 && /Bar & Weinkeller · Soll 40 Fl\./.test(s.sub), 'Weißbier: gezählt in Flaschen, dazu 0,1 bis 0,9 für die angebrochene', s);
    await key(p, '12'); await p.click('#scSheet .sc-ten [data-v="5"]');
    L.ok(/= 6,25 l/.test(await L.txt(p, '#scRes')), '12 Flaschen + 0,5 = 6,25 l', await L.txt(p, '#scRes'));
    await p.waitForTimeout(300); await L.shot(p, 'zaehlblatt-getraenk-ipad-dunkel', {review:true});
    await p.click('#scSave'); await p.waitForTimeout(200);
    L.ok(JSON.stringify(await ev(() => [S.invDraft.counts.weizen, S.invDraft.bar.weizen])) === JSON.stringify([6.25, {f:12, t:5}]), 'in der Inventur: 6,25 l und 12 Flaschen + 0,5 (wie in der Zählliste)');
    await L.wait(p, () => __scan.layer === 'count', null, 20000);
    await p.click('#scSheet [data-sc="mode"][data-v="set"]'); await key(p, '3,4'); await p.click('#scSave'); await p.waitForTimeout(200);
    L.ok(JSON.stringify(await ev(() => [S.invDraft.counts.weizen, S.invDraft.bar.weizen])) === JSON.stringify([1.7, {f:3, t:4}]), '„3,4“ getippt: drei volle und 0,4 = 1,7 l');
    await L.wait(p, () => __scan.layer === 'count', null, 20000);
    await key(p, '1'); await p.click('#scSheet .sc-ten [data-v="8"]'); await p.click('#scSave'); await p.waitForTimeout(200);
    L.ok(JSON.stringify(await ev(() => [S.invDraft.counts.weizen, S.invDraft.bar.weizen])) === JSON.stringify([2.6, {f:5, t:2}]), 'dazugezählt 1 + 0,8: 3,4 + 1,8 = 5,2 Flaschen = 2,6 l');
    await p.click('#scan [data-sc="close"]'); await p.waitForTimeout(250);
    L.ok(await ev(() => document.querySelector('#inv-weizen').value === '5' && document.querySelector('#ir-weizen .inv-t button.on').textContent === '0,2'), 'Zählliste: 5 Flaschen, Zehntel 0,2 markiert');
    L.ok(await ev(() => { const st = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(); return st === '#17181a'; }), 'dunkles Design aktiv'); /* fix3 hob den dunklen Hintergrund von #121416 auf #17181a an (ansicht.css, Kontrast) */
    errs.push(...p.errs); await b.close(); }
  await L.done(await L.launch(), errs);
})();
