// Navigation: acht Bereiche und die Einstellungen; am Handy fünf Punkte und „Mehr“; alte Adressen leiten um; Speicher-Anzeige und „Nur ansehen“ gehen weiter.
const L = require('./lib');
(async () => { const b = await L.launch();
  { const {p} = await L.open(b, {vp:{width:1440, height:900}});
    const nav = await p.evaluate(() => [...document.querySelectorAll('.side .nav-i')].map(n => n.textContent.trim() + ':' + (n.dataset.tab || n.dataset.act)));
    L.ok(nav.join('|') === 'Heute:dash|Vorbereitung:vorb|Checklisten:checkl|Speisekarte:menu|Rezepte:cards|Ware:ware|Team & Zahlen:team|Apartments:apart|Einstellungen:setup', 'Desktop: acht Bereiche und die Einstellungen', nav);
    L.ok(await p.evaluate(() => view.tab === 'dash' && location.hash === '#heute' && document.querySelector('.side .nav-i.on').dataset.tab === 'dash'), 'Start auf „Heute“');
    // Unter-Reiter
    const tabs = async h => { await L.go(p, h); return p.evaluate(() => [...document.querySelectorAll('#app .toolbar.tabs .seg button')].map(x => x.childNodes[0].textContent.trim()).join('|')); };
    L.ok(await tabs('speisekarte') === 'Gerichte|Gästekarte|Saison & Aktionen|Service', 'Speisekarte: Gerichte · Gästekarte · Saison & Aktionen · Service (Paket D2: die Service-Liste ist ein Reiter, kein neuer Bereich)', await tabs('speisekarte'));
    L.ok(await tabs('ware/bestand') === 'Bestand|Bestellen|Lieferanten|Preise|Inventur|Buchungen', 'Ware: sechs Reiter', await tabs('ware/bestand'));
    L.ok(await tabs('team/dienstplan') === 'Dienstplan|Auswertung' && await tabs('team/auswertung') === 'Dienstplan|Auswertung', 'Team & Zahlen: Dienstplan · Auswertung');
    // ein Hauptknopf je Reiter
    const prim = []; for(const h of ['ware/bestand','ware/bestellen','ware/lieferanten','ware/preise','ware/inventur','ware/buchungen','speisekarte','speisekarte/gaestekarte','speisekarte/saison','rezepte','team/dienstplan','team/auswertung','vorbereitung']){ await L.go(p, h); prim.push(h + '=' + await p.evaluate(() => [...document.querySelectorAll('#app .page-h .btn.primary')].map(x => x.textContent.trim()).join('+'))); }
    L.ok(prim.every(x => x.split('=')[1].split('+').length <= 1), 'höchstens ein Hauptknopf im Kopf jeder Seite', prim);
    L.ok(prim.find(x => x.startsWith('ware/bestellen=')) === 'ware/bestellen=Bestellung' && await (async () => { await L.go(p, 'ware/bestellen'); return p.evaluate(() => !!document.querySelector('#app .page-h [data-act="moveDlg"][data-id="in"]') && /Lieferung ohne Bestellung/.test(document.querySelector('#app .page-h').textContent)); })(), 'Bestellen: „+ Bestellung“ als Hauptknopf, „Lieferung ohne Bestellung“ daneben');
    await L.go(p, 'ware/bestand'); L.ok(await p.evaluate(() => !document.querySelector('#app .page-h [data-act="moveDlg"][data-id="in"]')), 'Bestand: kein „Wareneingang“ im Kopf');
    await L.go(p, 'heute'); L.ok(await p.evaluate(() => !document.querySelector('#app .page-h [data-act="moveDlg"]') && !!document.querySelector('#app [data-act="ordRecv"]')), 'Heute: Wareneingang je Bestellung, nicht im Kopf');
    // Reiter klicken
    await L.go(p, 'ware/bestand'); await p.click('#app [data-act="wtab"][data-id="preise"]'); await p.waitForTimeout(200);
    L.ok(await p.evaluate(() => location.hash === '#ware/preise' && view.tab === 'products' && document.querySelector('.side .nav-i.on').dataset.tab === 'ware' && document.querySelector('#app h1').childNodes[0].textContent === 'Ware'), 'Reiter „Preise“: Adresse, Überschrift „Ware“, Navigation bleibt auf „Ware“');
    await p.click('.side .nav-i[data-tab="team"]'); await p.waitForTimeout(200); await p.click('#app [data-act="ttab"][data-id="report"]'); await p.waitForTimeout(200);
    L.ok(await p.evaluate(() => location.hash === '#team/auswertung' && view.tab === 'report' && document.querySelector('.side .nav-i.on').dataset.tab === 'team'), 'Team & Zahlen › Auswertung');
    // alte Adressen
    const red = [['stock','ware/bestand'],['buy','ware/bestellen'],['products','ware/preise'],['pcheck','ware/preis-check'],['aufbau','einrichtung'],['stempel','einrichtung'],['begriffe','einstellungen'],['labor','rezepte'],['dienst','team/dienstplan'],['report','team/auswertung'],['checkl','checklisten'],['vorb','vorbereitung'],['menu','speisekarte'],['cards','rezepte'],['dash','heute'],['setup','einstellungen'],['cards/dish_kaiser','rezepte/dish_kaiser'],['gibtsnicht','einstellungen']];
    const bad = []; for(const [a, want] of red){ if(a === 'gibtsnicht') await L.go(p, 'einstellungen'); await L.go(p, a); const got = await p.evaluate(() => decodeURIComponent(location.hash.slice(1))); if(got !== want) bad.push(a + '→' + got); }
    L.ok(bad.length === 0, 'alte Adressen leiten an die neue Stelle um (' + red.length + ' geprüft)', bad);
    await L.go(p, 'rezepte/dish_kaiser'); await p.reload(); await p.waitForFunction(() => !document.documentElement.classList.contains('booting')); await p.waitForTimeout(300);
    L.ok(await p.evaluate(() => view.tab === 'cards' && view.card === 'dish_kaiser' && location.hash === '#rezepte/dish_kaiser'), 'offene Rezeptur bleibt über ein Neuladen');
    // Schnellsuche kennt die neuen Namen
    await p.keyboard.press('Control+k'); await p.waitForTimeout(150);
    const pal = await p.evaluate(() => [...document.querySelectorAll('#palList button')].filter(x => x.closest('li') && true).map(x => x.querySelector('.pn').textContent));
    L.ok(['Heute','Vorbereitung','Checklisten','Speisekarte','Gästekarte','Rezepte','Bestand','Bestellen','Lieferanten','Preise','Inventur','Buchungen','Dienstplan','Auswertung','Einstellungen','Einrichtung'].every(n => pal.includes(n)), 'Schnellsuche: alle Bereiche und Reiter mit den neuen Namen', pal.slice(0, 18));
    await p.fill('#palIn', 'inventur'); await p.keyboard.press('Enter'); await p.waitForTimeout(250); L.ok(await p.evaluate(() => location.hash === '#ware/inventur'), 'Schnellsuche „Inventur“ führt zu Ware › Inventur');
    // Speicher-Anzeige
    await p.evaluate(() => { S.settings.name = 'Test B'; save(); }); await L.idle(p); await p.waitForTimeout(900);
    L.ok(await p.evaluate(() => { const n = document.querySelector('.side .save-ind'); return !n.hidden && n.textContent === 'Gespeichert'; }), 'Speicher-Anzeige in der Seitenleiste zeigt „Gespeichert“');
    // zweites Fenster: nur ansehen
    const B = await p.context().newPage(); await B.goto(L.URL); await B.waitForFunction(() => !document.documentElement.classList.contains('booting')); await B.waitForTimeout(500);
    const ro = await B.evaluate(() => ({bar:(document.querySelector('#relBars .rel-bar.info') || {innerText:''}).innerText.replace(/\s+/g, ' '), ind:document.querySelector('.side .save-ind').textContent, nav:document.querySelectorAll('.side .nav-i').length, top:document.querySelector('#relBars').getBoundingClientRect().top, appTop:document.querySelector('#app').getBoundingClientRect().top}));
    L.ok(/In einem anderen Fenster geöffnet/.test(ro.bar) && ro.ind === 'Nur ansehen' && ro.nav === 9 && ro.appTop >= ro.top, 'zweites Fenster: Zeile „In einem anderen Fenster geöffnet“, Anzeige „Nur ansehen“, Navigation vollständig', ro);
    await B.evaluate(() => { location.hash = '#ware/bestellen'; }); await B.waitForTimeout(250); L.ok(await B.evaluate(() => view.tab === 'buy' && !!document.querySelector('#relBars .rel-bar.info')), 'im zweiten Fenster lässt sich durch die neuen Bereiche blättern, die Zeile bleibt');
    await B.close(); p.errs.length = 0; await p.context().close(); }
  { const {p} = await L.open(b, L.PHONE);
    const bar = await p.evaluate(() => [...document.querySelectorAll('.bottom .nav-i')].filter(n => n.getClientRects().length).map(n => n.textContent.replace(/\u00ad/g, '').trim() + ':' + (n.dataset.tab || n.dataset.act)));
    // fix-3: Ware (täglich bestellen) statt Checklisten in der Leiste; ein Wort „Vorbereitung“ statt „Prep“; Checklisten unter „Mehr“ und auf „Heute“
    L.ok(bar.join('|') === 'Heute:dash|Vorbereitung:vorb|Rezepte:cards|Ware:ware|Mehr:mehr', 'Handy: Heute · Vorbereitung · Rezepte · Ware · Mehr', bar);
    const fit = await p.evaluate(() => [...document.querySelectorAll('.bottom .nav-i')].map(n => { const r = n.getBoundingClientRect(); const s = n.querySelector('span'); return r.left >= 0 && r.right <= 390.5 && r.height >= 44 && s.scrollWidth <= s.clientWidth + 1; }));
    L.ok(fit.every(Boolean) && await p.evaluate(() => document.documentElement.scrollWidth === 390), 'Handy: alle fünf Punkte passen, kein Wort abgeschnitten, mindestens 44 px hoch', fit);
    await p.click('.bottom .nav-i[data-act="mehr"]'); await p.waitForTimeout(300);
    const sh = await p.evaluate(() => { const m = document.getElementById('mehr'); const box = m.querySelector('.sheet-box').getBoundingClientRect(); return {open:!m.hidden, items:[...m.querySelectorAll('.sheet-i b')].map(x => x.textContent), tab:view.tab, box:[Math.round(box.left), Math.round(box.right), Math.round(box.bottom)], h:[...m.querySelectorAll('.sheet-i')].every(x => x.getBoundingClientRect().height >= 44), exp:document.querySelector('.bottom [data-act="mehr"]').getAttribute('aria-expanded'), role:m.querySelector('.sheet-box').getAttribute('role')}; });
    L.ok(sh.open && sh.items.join('|') === 'Checklisten|Speisekarte|Team & Zahlen|Apartments|Einstellungen|Suche' && sh.tab === 'dash', '„Mehr“ ist ein Blatt mit Checklisten, Speisekarte, Team & Zahlen, Apartments, Einstellungen, Suche; die Seite bleibt, wo sie war', sh);
    L.ok(sh.box[0] === 0 && sh.box[1] === 390 && sh.box[2] === 844 && sh.h && sh.exp === 'true' && sh.role === 'dialog', 'Blatt füllt die Breite, Zeilen ≥ 44 px, für Vorleser als Dialog');
    await p.click('#mehr .sheet-i[data-tab="checkl"]'); await p.waitForTimeout(300);
    L.ok(await p.evaluate(() => document.getElementById('mehr').hidden && view.tab === 'checkl' && location.hash === '#checklisten' && document.querySelector('.bottom [data-act="mehr"]').classList.contains('on') && !document.querySelector('.bottom .nav-i[data-tab].on')), 'Tipp auf „Checklisten“: Blatt zu, Checklisten offen, „Mehr“ ist markiert');
    await p.click('.bottom .nav-i[data-act="mehr"]'); await p.waitForTimeout(250); await p.keyboard.press('Escape'); await p.waitForTimeout(200); L.ok(await p.evaluate(() => document.getElementById('mehr').hidden), 'Esc schließt das Blatt');
    await p.click('.bottom .nav-i[data-act="mehr"]'); await p.waitForTimeout(250); await p.click('#mehr .sheet-bg', {position:{x:20, y:20}}); await p.waitForTimeout(200); L.ok(await p.evaluate(() => document.getElementById('mehr').hidden), 'Tipp neben das Blatt schließt es');
    await p.click('.bottom .nav-i[data-act="mehr"]'); await p.waitForTimeout(250); await p.click('#mehr [data-act="mehrSuche"]'); await p.waitForTimeout(250); L.ok(await p.evaluate(() => document.getElementById('mehr').hidden && !document.querySelector('#pal').hidden), '„Suche“ öffnet die Schnellsuche'); await p.keyboard.press('Escape');
    await p.click('.bottom .nav-i[data-tab="cards"]'); await p.waitForTimeout(250); L.ok(await p.evaluate(() => view.tab === 'cards' && document.querySelector('.bottom .nav-i.on').dataset.tab === 'cards' && !document.querySelector('.bottom [data-act="mehr"]').classList.contains('on')), 'Rezepte direkt in der Leiste');
    // Speicher-Punkt oben
    await p.evaluate(() => { S.settings.name = 'Test B'; save(); }); await L.idle(p); await p.waitForTimeout(900);
    L.ok(await p.evaluate(() => { const n = document.querySelector('.topbar .save-dot'); return !!n && !n.hidden && /ok/.test(n.className); }), 'Handy: Speicher-Punkt oben zeigt „gespeichert“');
    await L.done(b, p.errs); }
})();
