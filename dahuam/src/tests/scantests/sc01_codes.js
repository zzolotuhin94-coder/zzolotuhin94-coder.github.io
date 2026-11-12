// Codes und Dekoder: Prüfziffern (EAN-8, EAN-13, UPC-A, UPC-E, GTIN-14), Säubern, Vergleich, mehrere Codes in einem Feld;
// selbst gezeichnete Strichcodes (EAN-13, EAN-8, UPC-A, Code 128, ITF-14) direkt in den Dekoder (ZXing, wie am iPhone);
// der Leser lädt erst beim Öffnen; Umstellung alter Stände; Sicherung enthält die Codes.
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
  // ---------- Prüfziffern ----------
  const g = await ev(() => ({
    e13:gtinInfo('9001234560019'), e13bad:gtinInfo('9001234560018'), e8:gtinInfo('90311017'), e8bad:gtinInfo('90311018'),
    upca:gtinInfo('036000291452'), upcabad:gtinInfo('036000291453'), g14:gtinInfo('19007654321015', 'itf'), g14bad:gtinInfo('19007654321016'),
    upce:gtinInfo('04252614', 'upc_e'), upceA:upceToA('04252614'), c128:gtinInfo('DH-4711', 'code_128'), short:gtinInfo('12345'), qr:gtinInfo('https://x', 'qr_code'),
    txt:gtinText('9001234560018')}));
  L.ok(g.e13.kind === 'EAN-13' && g.e13.ok && g.e13bad.ok === false, 'EAN-13: 9001234560019 stimmt, …018 nicht', [g.e13, g.e13bad]);
  L.ok(g.e8.kind === 'EAN-8' && g.e8.ok && g.e8bad.ok === false, 'EAN-8: 90311017 stimmt, …018 nicht');
  L.ok(g.upca.kind === 'UPC-A' && g.upca.ok && g.upcabad.ok === false, 'UPC-A: 036000291452 stimmt, …453 nicht');
  L.ok(g.g14.kind === 'ITF-14' && g.g14.ok && g.g14bad.kind === 'GTIN-14' && g.g14bad.ok === false, 'GTIN-14 (ITF-14 am Karton): Prüfziffer gerechnet');
  L.ok(g.upce.kind === 'UPC-E' && g.upce.ok && g.upceA === '042100005264', 'UPC-E 04252614 = UPC-A 042100005264, Prüfziffer stimmt', g.upceA);
  L.ok(g.c128.ok === null && g.c128.kind === 'Code 128' && g.short.ok === null && g.qr.kind === 'QR-Code', 'Code 128, kurze Nummern und QR: ohne Prüfziffer, keine Warnung');
  L.ok(/Prüfziffer passt nicht.*trotzdem gespeichert/.test(g.txt), 'Warntext bei falscher Prüfziffer: wird trotzdem gespeichert', g.txt);
  const n = await ev(() => ({c1:eanClean(' 900 1234 56001-9 '), c2:eanClean('DH-4711 '), c3:eanClean('a\u0000b'), k:[eanKey('036000291452'), eanKey('0036000291452'), eanKey('90311017'), eanKey('dh-4711')],
    s1:eanSplit('9001234560019, 9001234560026;19007654321015'), s2:eanSplit('9001234560019 9001234560026'), s3:eanSplit('900 1234 56001 9'), s4:eanSplit('9001234560019,9001234560019, 09001234560019'), s5:eanSplit('')}));
  L.ok(n.c1 === '9001234560019' && n.c2 === 'DH-4711' && n.c3 === 'ab', 'Leerzeichen und Striche in Ziffern-Codes fallen weg, Text-Codes bleiben');
  L.ok(n.k[0] === n.k[1] && n.k[2] === '00000090311017' && n.k[3] === 'DH-4711', 'UPC-A und die gleiche Nummer als EAN-13 (mit 0 davor) sind derselbe Code', n.k);
  L.ok(n.s1.join() === '9001234560019,9001234560026,19007654321015' && n.s2.length === 2 && n.s3.join() === '9001234560019' && n.s4.length === 1 && n.s5.length === 0, 'mehrere Codes: Komma, Strichpunkt oder Leerzeichen; Ziffern-Gruppen sind ein Code; doppelte fallen weg', n);
  // ---------- Dekoder ----------
  L.ok(await ev(() => !window.ZXing && ![...document.scripts].some(s => /zxing/.test(s.src))), 'der Leser (ZXing) ist beim Start nicht geladen');
  await ev(L.ENCODER);
  const dec = await ev(async () => { const out = {}; for(const [t, x, o] of [['ean13', '900123456001', {}], ['ean8', '9031101', {}], ['upca', '03600029145', {}], ['code128', 'DH-4711', {}], ['itf', '1900765432101', {}], ['ean13', '900222333001', {mod:2, bg:'#f4ecd8'}]]){
      const cv = bc(t, x, o); const t0 = performance.now(); const r = await scanDecodeImage(cv, {zxing:true}); out[t + (o.mod ? '_klein' : '')] = {want:cv.dataset.text, got:r && r.code, f:r && r.format, ms:Math.round(performance.now() - t0)}; }
    return out; });
  L.ok(dec.ean13.got === '9001234560019' && dec.ean13.f === 'ean_13', 'EAN-13 gelesen', dec.ean13);
  L.ok(dec.ean8.got === '90311017' && dec.ean8.f === 'ean_8', 'EAN-8 gelesen', dec.ean8);
  L.ok(dec.upca.got === '036000291452' && dec.upca.f === 'upc_a', 'UPC-A gelesen (12 Stellen)', dec.upca);
  L.ok(dec.code128.got === 'DH-4711' && dec.code128.f === 'code_128', 'Code 128 gelesen', dec.code128);
  L.ok(dec.itf.got === '19007654321015' && dec.itf.f === 'itf', 'ITF-14 (Karton) gelesen', dec.itf);
  L.ok(dec.ean13_klein.got === '9002223330019', 'kleiner Code auf cremefarbenem Etikett gelesen', dec.ean13_klein);
  L.ok(await ev(() => !!window.ZXing && [...document.scripts].some(s => /\/dahuam\/vendor\/zxing-library\.min\.js$/.test(s.src))), 'ZXing kam aus dem eigenen Ordner vendor/');
  // aus einer Kamera-Szene (schräg, Rauschen), wie sie auch das künstliche Video zeigt
  for(const [t, x, rot] of [['ean13', '900123456002', 4], ['code128', 'LAGER-07', -3], ['ean8', '9031101', 0]]){
    const sc = await L.scene(p, t, x, {w:480, h:640, rot});
    const r = await ev(async ([w, h, data]) => { const id = new ImageData(new Uint8ClampedArray(data), w, h); return await scanDecodeImage(id, {zxing:true}); }, [sc.w, sc.h, sc.data]);
    L.ok(r && r.code === sc.text, `Kamera-Szene ${t} ${rot ? rot + '° schräg' : 'gerade'}: ${sc.text}`, r);
  }
  // ---------- Suchen und Zuordnen ----------
  const f = await ev(() => { const bu = P('butter'), mi = P('mineral'); bu.ean = ['9001234560019']; mi.ean = ['9001234560026', '19007654321015'];
    return {a:eanFind('9001234560019') === bu, b:eanFind('19007654321015') === mi, c:eanFind('09001234560026') === mi, none:eanFind('123') === null,
      add:(r => ({ok:r.ok, err:r.err}))(eanAdd(bu, '9001234560026')), addOk:eanAdd(bu, '900 1234 56003 3'), again:eanAdd(bu, '9001234560033'), list:bu.ean.join()}; });
  L.ok(f.a && f.b && f.c && f.none, 'Artikel über jeden seiner Codes gefunden (Flasche und Karton)');
  L.ok(!f.add.ok && /gehört schon zu „Mineralwasser/.test(f.add.err) && f.addOk.ok && f.again.had && f.list === '9001234560019,9001234560033', 'Code eines anderen Artikels wird nicht übernommen; doppelt nur einmal', f);
  // ---------- Umstellung alter Stände ----------
  for(const [file, label] of [[__dirname + '/../etests/samples/pre-d2-demo.json', '1.4.0'], [__dirname + '/../dtests/samples/pre-d-demo.json', '1.3.0']]){
    const old = JSON.parse(fs.readFileSync(file, 'utf8'));
    const mg = await ev(o => { const before = JSON.parse(JSON.stringify(o)); const r = migrate(JSON.parse(JSON.stringify(o))); const again = migrate(JSON.parse(JSON.stringify(r)));
      const strip = x => { const y = {...x}; delete y.ean; return y; };
      return {had:before.products.some(x => 'ean' in x), all:r.products.every(x => Array.isArray(x.ean) && x.ean.length === 0), same:r.products.every((x, i) => JSON.stringify(strip(x)) === JSON.stringify(strip(migrate(JSON.parse(JSON.stringify(before))).products[i]))), once:JSON.stringify(again.products) === JSON.stringify(r.products)}; }, old);
    L.ok(!mg.had && mg.all && mg.once, `Stand ${label}: jeder Artikel bekommt ean: [], erneutes Laden ändert nichts`, mg);
  }
  const mg2 = await ev(() => { const d = JSON.parse(JSON.stringify(S)); d.products[0].ean = '9001234560019, 9001234560026'; d.products[1].ean = [' 900 1234 56001 9', '', null, '9001234560019']; delete d.products[2].ean; d.products[3].ean = 9001234560033; const r = migrate(d); return [r.products[0].ean, r.products[1].ean, r.products[2].ean, r.products[3].ean]; });
  L.ok(JSON.stringify(mg2) === JSON.stringify([['9001234560019', '9001234560026'], ['9001234560019'], [], ['9001234560033']]), 'Codes als Text oder Zahl werden zur Liste, leere und doppelte fallen weg', mg2);
  // über den echten Speicher: alter Stand ohne Codes
  const old = JSON.parse(fs.readFileSync(__dirname + '/../etests/samples/pre-d2-demo.json', 'utf8'));
  await ev(async o => { await __store.replace(o); }, old); await p.reload(); await L.ready(p);
  L.ok(await ev(() => S.products.length > 30 && S.products.every(x => Array.isArray(x.ean))), 'alter Stand aus dem Speicher geladen: alle Artikel mit leerer Code-Liste');
  // ---------- Sicherung ----------
  await ev(() => { P('butter').ean = ['9001234560019', 'DH-4711']; save(); });
  await ev(() => exportData()); await p.waitForTimeout(200);
  const d = await L.dl(p, () => p.click('#dlBtn'));
  const j = JSON.parse(fs.readFileSync(d.file, 'utf8'));
  L.ok(j.products.find(x => x.id === 'butter').ean.join() === '9001234560019,DH-4711' && j.products.every(x => Array.isArray(x.ean)), 'Sicherung enthält die Codes', d.name);
  await p.click('#dlgCancel').catch(() => {});
  L.ok(await ev(j => { const r = migrate(JSON.parse(JSON.stringify(j))); return r.products.find(x => x.id === 'butter').ean.join(); }, j) === '9001234560019,DH-4711', 'Sicherung zurückgeholt: Codes sind wieder da');
  // eingebauter BarcodeDetector (Chrome/Android): wird bevorzugt, ZXing lädt dann gar nicht
  const NATIVE = () => { window.BarcodeDetector = class { static async getSupportedFormats(){ return ['ean_13', 'ean_8', 'upc_a', 'code_128', 'qr_code']; } constructor(o){ window.__bdFormats = o.formats; } async detect(){ return [{rawValue:'9001234560019', format:'ean_13'}]; } }; };
  const {p:p2} = await L.open(b, {vp:{width:390, height:844}, init:NATIVE});
  const nat = await p2.evaluate(async () => { const cv = document.createElement('canvas'); cv.width = 10; cv.height = 10; const r = await scanDecodeImage(cv); return {r, kind:__scan.engine.kind, zx:!!window.ZXing, f:window.__bdFormats}; });
  L.ok(nat.r.code === '9001234560019' && nat.kind === 'native' && !nat.zx && nat.f.join() === 'ean_13,ean_8,upc_a,code_128,qr_code', 'mit BarcodeDetector: eingebauter Leser, nur unterstützte Formate, ZXing wird nicht geladen', nat);
  L.ok(p.errs.length === 0 && p2.errs.length === 0, 'keine Fehler', p.errs.concat(p2.errs));
  await L.done(b, p.errs.concat(p2.errs));
})();
