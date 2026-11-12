// Alter Stand (1.4.0, vor Paket D2) lädt und wird einmal ergänzt; leerer Betrieb; Handy 390, Tablet 1024×768, hell und dunkel:
// keine Seitenbreite über dem Bildschirm, große Tippflächen; Bilder nach e-out/.
const L = require('./lib'); const fs = require('fs');
const NEW = ['rezepte/dish_elsasser/kueche', 'rezepte/dish_burger/service', 'rezepte/dk_spritz/kueche', 'speisekarte/service', 'checklisten'];
const wide = p => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
(async () => { const b = await L.launch();
  // ---------- alter Stand ----------
  { const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
    const old = JSON.parse(fs.readFileSync(__dirname + '/samples/pre-d2-demo.json', 'utf8'));
    L.ok(old.checks.ek === undefined && old.settings.d2V === undefined && old.cards.every(c => c.svHide === undefined && c.svNote === undefined), 'Beispielstand von 1.4.0: noch ohne Eigenkontrolle und ohne Service-Felder');
    const mg = await ev(o => { const before = JSON.parse(JSON.stringify(o)); const r = migrate(JSON.parse(JSON.stringify(o))); const strip = c => { const x = {...c}; delete x.svHide; delete x.svNote; return x; };
      const again = migrate(JSON.parse(JSON.stringify(r)));
      return {same:['products', 'menu', 'orders', 'moves', 'suppliers', 'team'].filter(k => JSON.stringify(r[k]) !== JSON.stringify(before[k])), cards:JSON.stringify(r.cards.map(strip)) === JSON.stringify(before.cards), tpl:JSON.stringify(r.checks.templates) === JSON.stringify(before.checks.templates),
        runs:Object.keys(before.checks.runs).every(D => Object.keys(before.checks.runs[D]).every(k => JSON.stringify(r.checks.runs[D][k]) === JSON.stringify(before.checks.runs[D][k]))),
        keys:Object.keys(r).filter(k => !(k in o)), sKeys:Object.keys(r.settings).filter(k => !(k in o.settings)), d2:r.settings.d2V, ek:{lim:r.checks.ek.limits, fr:r.checks.ek.fryers.length, clean:r.checks.ek.clean.length, log:r.checks.ek.log.length, oil:r.checks.ek.oilDays},
        sv:r.cards.every(c => typeof c.svNote === 'string' && Array.isArray(c.svHide)), hide:r.cards.find(c => c.id === 'dish_elsasser').svHide.join(), once:JSON.stringify(again) === JSON.stringify(r)}; }, old);
    L.ok(mg.same.length === 0 && mg.cards && mg.tpl && mg.runs && mg.keys.length === 0, 'alter Stand lädt: Artikel, Karte, Bestellungen, Buchungen, Team, Listen und Häkchen unverändert; Rezepturen nur um die Service-Felder ergänzt', mg);
    L.ok(mg.sKeys.sort().join() === 'd2V,karte' /* karte: Speisekarte-Gestalter, gtests/g06 */ && mg.d2 === 1 && mg.ek.lim.kuehl === 4 && mg.ek.lim.tk === -18 && mg.ek.fr === 1 && mg.sv && mg.hide === 'p:salt,p:pepper', 'einmalige Ergänzung: Grenzwerte +4 °C und −18 °C, eine Fritteuse, Service-Felder (Salz und Pfeffer ausgeblendet)', mg.ek);
    L.ok(mg.ek.clean === 4 && mg.ek.log === 5 && mg.ek.oil === 7, 'Beispielbetrieb bekommt die Beispiel-Einträge der Eigenkontrolle (als Beispiel markiert)');
    L.ok(mg.once, 'erneutes Laden ändert nichts mehr');
    // vom Chef geänderte Auswahl bleibt bei erneutem Laden
    L.ok(await ev(o => { const r = migrate(JSON.parse(JSON.stringify(o))); r.cards[0].svHide = []; r.cards[0].svNote = 'x'; r.checks.ek.limits.kuehl = 6; r.checks.ek.clean = []; const r2 = migrate(JSON.parse(JSON.stringify(r))); return r2.cards[0].svHide.length === 0 && r2.cards[0].svNote === 'x' && r2.checks.ek.limits.kuehl === 6 && r2.checks.ek.clean.length === 0; }, old), 'eigene Einstellungen überleben das nächste Laden (keine zweite Vorbelegung)');
    // kaputte Felder
    L.ok(await ev(o => { const d = JSON.parse(JSON.stringify(o)); d.checks.ek = {limits:{kuehl:'x'}, fryers:'nein', oilDays:-3, clean:[{id:'a'}, {id:'b', t:'ok', when:'jährlich'}, null], log:[{id:'1', k:'we', d:'gestern'}, {k:'oil'}, 7]}; const r = migrate(d); const k = r.checks.ek; return k.limits.kuehl === 4 && k.limits.tk === -18 && Array.isArray(k.fryers) && k.oilDays === '' && k.clean.length === 1 && k.clean[0].when === 'weekly' && k.log.length === 0; }, old), 'kaputte Eigenkontrolle-Daten werden aussortiert statt die App zu stoppen');
    // über den echten Speicher
    await ev(async o => { await __store.replace(o); }, old); await p.reload(); await L.ready(p);
    L.ok(await ev(() => S.settings.d2V === 1 && !!S.orders.find(o => o.id === 'ord_pre_d2') && S.checks.ek.log.length === 5), 'alter Stand aus dem Speicher geladen und ergänzt');
    for(const h of L.SCREENS.concat(NEW)){ await L.go(p, h); await p.waitForTimeout(100); }
    L.ok(p.errs.length === 0, 'alter Stand: alle Seiten und die neuen Ansichten ohne Fehler', p.errs);
    await ev(() => { view.stab = 'bestellung'; view.order = 'ord_pre_d2'; view.recv = 'ord_pre_d2'; go('buy'); }); await p.waitForTimeout(200);
    await p.fill('#rTemp', '3'); await p.click('#app [data-act="rBook"]'); await p.waitForTimeout(300);
    L.ok(await ev(() => S.orders.find(o => o.id === 'ord_pre_d2').status === 'delivered' && S.checks.ek.log[0].kv === 3 && S.checks.ek.log[0].order === 'ord_pre_d2'), 'die Bestellung aus dem alten Stand lässt sich mit Temperatur einbuchen');
    // Beispiel-Team entfernen nimmt die Beispiel-Einträge mit, eigene bleiben
    await ev(() => { tmDemoRemove(); save(); });
    L.ok(await ev(() => { const k = S.checks.ek; return k.log.length === 1 && k.log[0].kv === 3 && k.clean.length === 0 && k.oilDays === '' && !Object.keys(S.checks.runs).some(D => S.checks.runs[D].ek_clean); }), 'Beispiel-Team entfernen: Beispiel-Einträge der Eigenkontrolle gehen mit, der eigene Eintrag bleibt');
    // leerer Betrieb
    await ev(() => { S.checks.ek.log = []; S.checks.ek.fryers = []; save(); view.ck = {tab:'heute'}; go('checkl'); }); await p.waitForTimeout(150);
    L.ok(await ev(() => { const r = [...document.querySelectorAll('#app .ek-l')].map(x => x.innerText.replace(/\s+/g, ' ').trim()); return r.length === 1 && r[0] === 'Wareneingang noch keine Temperatur eingetragen'; }) && await ev(() => { go('dash'); return !document.querySelector('#app .ek-dash'); }), 'ohne Reinigungsplan und ohne Fritteuse: nur die Zeile „Wareneingang“, auf „Heute“ nichts');
    L.ok(p.errs.length === 0, 'keine Fehler', p.errs); await p.context().close(); }
  // ---------- Geräte: Tablet 1024×768 und Handy 390, hell und dunkel ----------
  const DEV = [['tablet', L.TABLET, 44], ['handy', L.PHONE, 40], ['desktop', {vp:{width:1440, height:900}}, 0]];
  for(const [dev, o, minTap] of DEV) for(const dark of [false, true]){
    const {p} = await L.open(b, {...o, dark}); const ev = (f, a) => p.evaluate(f, a); const tag = `${dev}-${dark ? 'dunkel' : 'hell'}`; const bad = [];
    const check = async name => { const wd = await wide(p); if(wd > 0) bad.push(name + ' +' + wd);
      if(minTap){ const small = await ev(min => [...document.querySelectorAll('#app .rz-chips button, #app .rz-i, #app .rz-step, #app .rz-open, #app .sv-rb, #app .ek-l, #app .ek-r, #app .ck-c, #app .rz-free input, #app .rz-bar .btn, #app .sv-f select, #app[data-view="checkl"] .ck-rh .btn, #app .ek-log .icon-btn')].filter(x => x.offsetParent && x.getBoundingClientRect().height < min).map(x => x.className + ':' + Math.round(x.getBoundingClientRect().height)), minTap); if(small.length) bad.push(name + ' klein ' + small.slice(0, 3).join(',')); } };
    const shot = async name => { await p.waitForTimeout(350); await check(name); await L.shot(p, `${tag}-${name}`); };
    await L.go(p, 'rezepte/dish_elsasser/kueche'); await p.click('#app [data-act="rzN"][data-id="5"]'); await p.click('#app .rz-ing li:nth-child(2) .rz-i'); await p.click('#app .rz-steps li:nth-child(1) .rz-step'); await shot('01-kueche');
    await p.click('#app .rz-open'); await shot('02-kueche-basisrezept');
    await L.go(p, 'rezepte/dk_spritz/kueche'); await shot('03-kueche-getraenk');
    await ev(() => { C('dish_burger').svNote = 'Garstufe medium, auf Wunsch durch. Beilage tauschbar gegen Salat.'; save(); }); await L.go(p, 'rezepte/dish_burger/service'); await shot('04-service');
    await L.go(p, 'rezepte/dish_schnitzel_pork/service'); await shot('05-service-unvollstaendig');
    await L.go(p, 'speisekarte/service'); await p.click('#app .sv-rb >> text=Wadel-Beißer-Burger'); await shot('06-service-liste');
    await p.selectOption('#app [data-svf]', 'A'); await shot('07-service-liste-ohne-gluten');
    await L.go(p, 'rezepte'); await ev(() => { view.cv = 'kueche'; render(); }); await shot('08-rezepte-kueche');
    await ev(() => { view.cv = null; }); await L.go(p, 'rezepte/dish_elsasser'); await shot('09-kalkulation-schalter');
    await L.go(p, 'checklisten'); await shot('10-checklisten');
    for(const k of ['clean', 'oil', 'we']){ await ev(k => { view.ck.ek = k; render(); }, k); await shot('11-eigenkontrolle-' + k); }
    await ev(() => { view.ck = {tab:'vorlagen'}; render(); }); await shot('12-vorlagen');
    await p.click('#app [data-act="ekCleanEdit"]'); await p.waitForTimeout(250); await check('dlg-reinigung'); await L.shot(p, `${tag}-13-reinigungsplan-dialog`, {full:false}); await p.click('#dlgCancel');
    await p.click('#app [data-act="ekSetup"]'); await p.waitForTimeout(250); await L.shot(p, `${tag}-14-grenzwerte-dialog`, {full:false}); await p.click('#dlgCancel');
    await ev(() => { view.ck = {tab:'verlauf', hist:'2026-11-06'}; render(); }); await shot('15-verlauf');
    await ev(() => { const o = S.orders.find(x => x.no === 'B-2026-0008'); view.stab = 'bestellung'; view.order = o.id; view.recv = o.id; go('buy'); }); await shot('16-wareneingang');
    await L.go(p, 'heute'); await shot('17-heute');
    L.ok(bad.length === 0, `${tag}: keine Seite breiter als der Bildschirm${minTap ? `, Tippflächen mindestens ${minTap} px` : ''}`, bad);
    if(dev === 'tablet') L.ok(await ev(() => { go('cards', 'dish_elsasser'); view.cv = 'kueche'; render(); const f = s => parseFloat(getComputedStyle(document.querySelector(s)).fontSize); return f('#app .rz-h h1') >= 36 && f('#app .rz-i') >= 20 && f('#app .rz-q') >= 22 && document.querySelector('#app .rz-chips button').offsetHeight >= 50; }), `${tag}: Küchen-Ansicht auf Armlänge lesbar (Titel ab 36 px, Zeilen ab 20 px, Knöpfe 50 px hoch)`);
    if(dark) L.ok(await ev(() => { const bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number); return bg[0] < 60 && bg[1] < 60; }), `${tag}: dunkles Design aktiv`);
    L.ok(p.errs.length === 0, `${tag}: keine Fehler`, p.errs); await p.context().close(); }
  // Monatsmappe: Blätter als Bild
  { const {p} = await L.open(b, {vp:{width:820, height:1123}}); const n = await p.evaluate(() => { const r = ekMappe('2026-11'); document.body.insertAdjacentHTML('beforeend', '<div id="mpx" style="position:absolute;left:0;top:0;z-index:9999;background:#888">' + r.pages.join('') + '</div>'); return r.pages.length; });
    const els = await p.$$('#mpx .ab-page'); let i = 0; for(const e of els) await e.screenshot({path:L.OUT + `/monatsmappe-blatt-${++i}.png`});
    await p.evaluate(() => { $('#print').innerHTML = rzPrintHtml(C('dish_elsasser'), 5); $('#print').classList.add('pdf'); $('#print').style.left = '0'; $('#print').style.zIndex = 99999; document.querySelector('#mpx').outerHTML = ''; }); await (await p.$('#print')).screenshot({path:L.OUT + '/kuechen-pdf.png'});
    L.ok(n === els.length && n >= 3, 'Bilder der Monatsmappe und des Küchen-PDF gespeichert', n); await p.context().close(); }
  await L.done(b, []); })();
