// Vorher-/Nachher-Bilder zu den Befunden (node shots.js before|after). Kein Test, nur Bilder in /home/user/review-out/fix2.
const L = require('./lib');
const tag = process.argv[2] || 'after';
(async () => { const b = await L.launch();
  const one = async (name, opts, fn) => { const {c, p} = await L.open(b, opts); try { await fn(p, (f, a) => p.evaluate(f, a), ms => p.waitForTimeout(ms)); } catch(e){ console.log(name, 'ERR', e.message.split('\n')[0]); } await c.close(); };
  const sh = (p, n, o) => L.shot(p, `${n}-${tag}`, o);
  // 1 · Messwert korrigieren
  await one('01', L.TABLET, async (p, ev, w) => { await L.go(p, 'checklisten'); await ev(() => { const tp = S.checks.templates.find(t => t.items.some(i => i.val)); view.ck.run = tp.id; render(); });
    const sel = await ev(() => '#' + document.querySelector('#app input.ck-v').id); await p.fill(sel, '9'); await p.press(sel, 'Tab'); await w(300); await p.fill('#dlgForm [name=note]', 'Tür offen, Ware umgelagert'); await L.dlgOk(p); await w(300);
    await p.fill(sel, '4'); await p.press(sel, 'Tab'); await w(400); await sh(p, '01-korrektur'); await L.dlgOk(p).catch(() => {}); await w(300); await sh(p, '01-korrektur-liste'); });
  // 2 · Eintrag löschen / stornieren
  await one('02', L.TABLET, async (p, ev, w) => { await L.go(p, 'checklisten'); await p.click('#app .ek-l[data-id="we"]'); await w(200); await p.click('#app .ek-r >> nth=1'); await w(200); await sh(p, '02-we-eintrag'); await p.click('#dlgDel'); await w(250); await sh(p, '02-we-loeschen'); });
  // 3 · Wareneingang ohne Temperatur
  await one('03', L.TABLET, async (p, ev, w) => { await ev(() => { const o = S.orders.find(o => o.no === 'B-2026-0007'); view.stab = 'bestellung'; view.order = o.id; view.recv = o.id; go('buy'); }); await w(300);
    await p.evaluate(() => document.querySelector('#app .recv-f').scrollIntoView({block:'center'})); await sh(p, '03-wareneingang-form'); await p.click('#app [data-act="rBook"]'); await w(350); await sh(p, '03-wareneingang-einbuchen'); });
  // 4 · Monatsmappe Oktober (Blatt 1 und letztes Blatt)
  await one('04', {vp:{width:900, height:1200}}, async (p, ev, w) => { const pages = await ev(() => ekMappe('2026-10').pages); await L.sheets(p, pages[0]); await w(200); await sh(p, '04-mappe-okt-blatt1');
    await L.sheets(p, pages[pages.length - 1]); await w(200); await sh(p, '04-mappe-okt-letztes'); });
  // 5 · Keine Allergene ohne Rückfrage; Allergen-Blatt
  await one('05', L.TABLET, async (p, ev, w) => { const id = await ev(() => { const m = S.menu.find(m => /Gärtnerin/.test(m.name)) || S.menu.find(m => !m.card); m.card = ''; save(); return m.id; });
    await ev(id => menuDialog(S.menu.find(m => m.id === id)), id); await w(250); await p.evaluate(() => { const d = document.querySelector('#dlgForm .alg-det'); if(d) d.open = true; }); await p.check('#dlgForm [name=algState][value=none]', {force:true}); await L.dlgOk(p); await w(300);
    await sh(p, '05-keine-allergene'); });
  await one('05b', {vp:{width:900, height:1200}}, async (p, ev, w) => { const pages = await ev(() => abPages().pages); await L.sheets(p, pages[0]); await w(200); await sh(p, '05-allergen-blatt'); });
  // 6 · Dialog: Esc verwirft Eingaben
  await one('06', L.TABLET, async (p, ev, w) => { await ev(() => { view.mtab = 'calc'; go('menu'); menuDialog(S.menu.find(m => /Elsässer/.test(m.name)) || S.menu[0]); }); await w(250); await p.fill('#dlgForm [name=name]', 'Elsässer NEU mit Speck'); await p.keyboard.press('Escape'); await w(300); await sh(p, '06-dialog-esc'); });
  // 7 · Rezeptur löschen
  await one('07', L.TABLET, async (p, ev, w) => { await ev(() => { view.cv = 'kalk'; go('cards', S.cards.find(c => c.type === 'dish' && !S.cards.some(x => x.items.some(i => i.ref === 'c:' + c.id))).id); }); await w(250); await p.click('#app [data-act="delCard"]'); await w(200); await L.dlgOk(p); await w(200); await sh(p, '07-rezeptur-geloescht'); });
  // 8 · Portionen 12
  await one('08', L.PHONE, async (p, ev, w) => { await ev(() => { view.cv = 'kueche'; go('cards', 'dish_schnitzel_pork'); }); await w(300); await p.tap('#rzN'); await p.keyboard.type('12'); await w(300); await sh(p, '08-portionen-12'); });
  // 9 · Prep „Rezeptur“ und Rezepte-Liste
  await one('09', L.TABLET, async (p, ev, w) => { await L.go(p, 'vorbereitung'); await w(300); const has = await ev(() => !!document.querySelector('#app .pl-rz')); if(has){ await p.click('#app .pl-rz >> nth=0'); await w(350); await sh(p, '09-prep-rezeptur'); }
    await L.go(p, 'rezepte'); await w(300); await sh(p, '09-rezepte-liste'); });
  // 10 · Zurück aus dem Basisrezept
  await one('10', L.TABLET, async (p, ev, w) => { await L.go(p, 'heute'); await p.click('nav .nav-i[data-tab="cards"] >> visible=true').catch(() => ev(() => navGo('cards'))); await w(250);
    await ev(() => { view.cv = 'kueche'; go('cards', S.cards.find(c => c.type === 'dish' && c.items.some(i => String(i.ref).startsWith('c:'))).id); }); await w(250); await p.click('#app .rz-open >> nth=0'); await w(300);
    await p.goBack().catch(() => {}); await w(500); await sh(p, '10-zurueck'); });
  // 11 · Kalkulation am iPad quer
  await one('11', L.TABLET, async (p, ev, w) => { await ev(() => { view.cv = 'kalk'; go('cards', 'semi_goulash'); }); await w(400); await sh(p, '11-kalk-1024', {full:true}); });
  // 12 · Frittieröl
  await one('12', L.TABLET, async (p, ev, w) => { await L.go(p, 'checklisten'); await p.click('#app .ek-l[data-id="oil"]'); await w(200); await p.click('#app [data-act="ekOil"][data-id="check"]'); await w(250); await sh(p, '12-oel-geprueft'); });
  // 13 · Checklisten erneut antippen
  await one('13', L.TABLET, async (p, ev, w) => { await L.go(p, 'checklisten'); await p.click('#app .ek-l[data-id="clean"]'); await w(200); await p.click('.side .nav-i[data-tab="checkl"] >> visible=true').catch(e => console.log('13 nav', e.message.split('\n')[0])); await w(300); await sh(p, '13-checklisten-nav'); });
  await b.close();
})();
