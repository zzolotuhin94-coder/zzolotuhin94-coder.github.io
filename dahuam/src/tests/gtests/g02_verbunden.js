// Verbunden mit der Speisekarte: Preis, neue und gelöschte Gerichte, Saison, Wochentag, Aktionen – die eigene Anordnung bleibt.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a);
  await L.gk(p, 'alpin');
  const txt = () => ev(() => document.querySelector('#gsCanvas').innerText.replace(/\s+/g, ' '));
  const rowOf = name => ev(nm => { const n = [...document.querySelectorAll('#gsCanvas .gs-d')].find(x => x.querySelector('.gs-n').textContent.includes(nm)); return n ? n.innerText.replace(/\s+/g, ' ').trim() : null; }, name);
  // eigene Anordnung herstellen: Weißer vor Elsässer, Rösti zweispaltig
  await ev(() => { const bl = gsDoc().blocks; const all = gsAll(); const idx = n => bl.findIndex(b => b.t === 'dish' && all.get(b.key).vars[0].name === n); const i = idx('Weißer'), j = idx('Elsässer'); const [x] = bl.splice(i, 1); bl.splice(j, 0, x); bl.find(b => b.t === 'head' && b.sec === 'Rösti').cols = 2; save(); gsRefresh(); });
  const before = await L.order(p);
  L.ok(before.indexOf('Weißer') < before.indexOf('Elsässer'), 'eigene Anordnung: „Weißer“ steht vor „Elsässer“');
  // Preis in der Speisekarte ändern
  L.ok(/Gärtnerin.*14,90/.test(await rowOf('Gärtnerin')), 'Ausgangslage: Gärtnerin 14,90');
  await ev(() => { S.menu.find(m => m.name === 'Gärtnerin').price = 15.5; S.menu.find(m => m.name === 'Gärtnerin').desc = 'Neu beschrieben'; save(); render(); }); await L.settle(p);
  L.ok(/Gärtnerin.*15,50/.test(await rowOf('Gärtnerin')) && /Neu beschrieben/.test(await rowOf('Gärtnerin')), 'Preis und Beschreibung in der Speisekarte geändert → stehen so im Blatt', await rowOf('Gärtnerin'));
  // über die Bedienung: Gericht bearbeiten aus dem Gestalter
  await p.click(await L.blockSel(p, 'Gärtnerin')); await p.waitForTimeout(150);
  L.ok(await ev(() => /Gericht/.test(document.querySelector('#gsRail h2').textContent) && !!document.querySelector('#gsRail [data-act="editMenu"]')), 'Gericht antippen: rechts steht „Gericht“ mit „Gericht bearbeiten“');
  await p.click('#gsRail [data-act="editMenu"]'); await p.waitForTimeout(300);
  L.ok(await ev(() => !!document.querySelector('dialog[open]') && document.querySelector('dialog[open] [name="name"]').value === 'Gärtnerin'), '„Gericht bearbeiten“ öffnet das Gericht der Speisekarte');
  await p.fill('dialog[open] [name="price"]', '16,20'); await p.click('dialog[open] button[type="submit"], dialog[open] .btn.primary'); await p.waitForTimeout(400); await L.settle(p);
  L.ok(/Gärtnerin.*16,20/.test(await rowOf('Gärtnerin')), 'dort gespeichert → neuer Preis sofort im Blatt', await rowOf('Gärtnerin'));
  // neues Gericht: erscheint am Ende seines Abschnitts
  await ev(() => { S.menu.push({id:'m_neu1', section:'Flammkuchen', name:'Testflamm', desc:'Nur ein Test', price:12.3, card:'', order:999, img:'', veg:'v', top:false, hidden:false, seasons:[], days:[], alg:'A,G', group:'', vlabel:'', vat:'', algNone:false}); save(); render(); }); await L.settle(p);
  let o = await L.order(p); const fl = o.slice(o.indexOf('# Flammkuchen') + 1, o.indexOf('# Zum Teilen'));
  L.ok(fl[fl.length - 1] === 'Testflamm' && /Testflamm.*12,30/.test(await rowOf('Testflamm')), 'neues Gericht erscheint von selbst am Ende seines Abschnitts', fl);
  L.ok(o.indexOf('Weißer') < o.indexOf('Elsässer') && await ev(() => gsDoc().blocks.find(b => b.t === 'head' && b.sec === 'Rösti').cols) === 2, 'die eigene Anordnung bleibt dabei erhalten');
  // neue Kategorie: neue Überschrift am Ende, vor der Legende
  await ev(() => { S.settings.sections.push('Brotzeit'); S.menu.push({id:'m_neu2', section:'Brotzeit', name:'Speckbrettl', desc:'', price:14, card:'', order:0, img:'', veg:'', top:false, hidden:false, seasons:[], days:[], alg:'', group:'', vlabel:'', vat:'', algNone:false}); save(); render(); }); await L.settle(p);
  o = await L.order(p);
  L.ok(o.slice(-3).join('|') === '# Brotzeit|Speckbrettl|[legend]', 'neue Kategorie: Überschrift und Gericht kommen ans Ende, vor die Legende', o.slice(-4));
  // Kategorie umbenennen: die Überschrift folgt
  await ev(() => { const i = S.settings.sections.indexOf('Brotzeit'); S.settings.sections[i] = 'Jause'; S.menu.forEach(m => { if(m.section === 'Brotzeit') m.section = 'Jause'; }); save(); render(); }); await L.settle(p);
  o = await L.order(p);
  L.ok(o.includes('# Jause') && !o.includes('# Brotzeit'), 'Kategorie umbenannt → die Überschrift heißt mit');
  // Gericht löschen: verschwindet; leere Überschrift verschwindet aus dem Blatt
  await ev(() => { S.menu = S.menu.filter(m => m.id !== 'm_neu1' && m.id !== 'm_neu2'); save(); render(); }); await L.settle(p);
  o = await L.order(p); const t = await txt();
  L.ok(!o.includes('Testflamm') && !o.includes('Speckbrettl') && !/Testflamm|Speckbrettl|Jause/.test(t), 'gelöschte Gerichte verschwinden, eine Überschrift ohne Gerichte steht nicht im Blatt');
  L.ok(o.indexOf('Weißer') < o.indexOf('Elsässer'), 'Anordnung weiter unverändert');
  // ausgeblendet in der Speisekarte
  await ev(() => { S.menu.find(m => m.name === 'Schwammerl').hidden = true; save(); render(); }); await L.settle(p);
  L.ok(!/Schwammerl /.test((await L.sheets(p)).flatMap(s => s.units).filter(u => u.k === 'dish').map(u => u.name + ' ').join('|').replace(/Schwammerlrösti/g, '')), 'in der Speisekarte ausgeblendet → nicht im Blatt');
  await ev(() => { S.menu.find(m => m.name === 'Schwammerl').hidden = false; save(); render(); }); await L.settle(p);
  o = await L.order(p); L.ok(o.includes('Schwammerl') && (await txt()).includes('Schwammerl 17,50') || /Schwammerl/.test(await rowOf('Schwammerl')), 'wieder eingeblendet → steht an seiner alten Stelle');
  // Saison: Winterkarte zeigt andere Gerichte, Titel wechselt
  const herbst = (await L.sheets(p)).flatMap(s => s.units).filter(u => u.k === 'dish').length;
  await ev(() => { view.gdate = '2027-01-15'; view.gseason = null; render(); }); await L.settle(p);
  const sW = await L.sheets(p);
  L.ok(/Winterkarte/.test(sW[0].units[0].txt) && /2026\/27/.test(sW[0].units[0].txt), 'anderes Datum: Titelblatt zeigt Winterkarte 2026/27', sW[0].units[0].txt.slice(0, 80));
  const winterOnly = await ev(() => S.menu.filter(m => m.seasons && m.seasons.length && m.seasons.includes('winter') && !m.seasons.includes('herbst') && !m.hidden).map(m => m.name));
  const tW = await txt();
  L.ok(winterOnly.length > 0 && winterOnly.every(n => tW.includes(n)), 'Wintergerichte stehen jetzt im Blatt, ohne dass etwas umgestellt wurde', winterOnly.slice(0, 3));
  // Wochentag: Gericht nur sonntags
  const dayDish = await ev(() => { const m = S.menu.find(m => m.days && m.days.length && !m.hidden && inSeason(m, 'winter')); return m ? {name:m.name, days:m.days} : null; });
  if(dayDish){ const on = await ev(d => { const dt = new Date('2027-01-10T12:00:00'); while(!d.days.includes(dt.getDay())) dt.setDate(dt.getDate() + 1); const off = new Date(dt); off.setDate(off.getDate() + 1); while(d.days.includes(off.getDay())) off.setDate(off.getDate() + 1); const f = x => x.toISOString().slice(0, 10); return [f(dt), f(off)]; }, dayDish);
    await ev(d => { view.gdate = d; render(); }, on[0]); await L.settle(p); const a = (await txt()).includes(dayDish.name);
    await ev(d => { view.gdate = d; render(); }, on[1]); await L.settle(p); const c = (await txt()).includes(dayDish.name);
    L.ok(a && !c, `Wochentagsregel: „${dayDish.name}“ steht nur an seinen Tagen im Blatt`, on); }
  else L.ok(false, 'kein Gericht mit Wochentagsregel in den Beispieldaten');
  // Aktion: am Tag der Aktion erscheint der Baustein „Aktionen“, die Gerichte der Aktion stehen nicht doppelt
  await ev(() => { view.gdate = '2026-11-14'; view.gseason = null; render(); }); await L.settle(p);
  const ak = (await L.sheets(p)).flatMap(s => s.units).filter(u => u.k === 'aktion');
  const sp = await ev(() => specialsFor('2026-11-14').map(s => ({name:s.name, items:s.items.map(i => i.name)}))[0]);
  L.ok(ak.length === 1 && ak[0].txt.includes(sp.name) && sp.items.every(n => ak[0].txt.includes(n)) && /13\.–15\. November/.test(ak[0].txt), 'am Aktionstag: Baustein mit Name, Zeitraum und Gerichten der Aktion', ak[0] && ak[0].txt.slice(0, 90));
  await ev(() => { view.gdate = '2026-11-12'; render(); }); await L.settle(p);
  L.ok((await L.sheets(p)).flatMap(s => s.units).filter(u => u.k === 'aktion').length === 0, 'ohne Aktion bleibt die Stelle leer');
  L.ok((await L.sheets(p)).flatMap(s => s.units).filter(u => u.k === 'dish').length === herbst, 'zurück am Ausgangstag: gleiche Gerichte wie vorher');
  // „Saison bearbeiten“ (aus Saison & Aktionen) führt zu den Feldern der Saison
  await ev(() => { view.mtab = 'plan'; go('menu'); }); await p.waitForTimeout(200); await ev(() => [...document.querySelectorAll('#app [data-act="editSeason"][data-id="winter"]')].find(n => n.getBoundingClientRect().width > 4).click()); await L.settle(p);
  L.ok(await ev(() => { const i = document.querySelector('#gsRail [data-smd="from"]'); return view.mtab === 'guest' && !!i && i.offsetParent !== null && document.querySelector('#gsRail .gs-more').open && /Winterkarte/.test(document.querySelector('#gsRail [data-st="title"]').value); }), '„Saison bearbeiten“ öffnet die Gästekarte mit den Feldern der Saison (Name, gültig ab/bis)');
  await p.fill('#gsRail [data-st="title"]', 'Winter dahuam'); await p.waitForTimeout(300);
  L.ok(/Winter dahuam/i.test((await L.sheets(p))[0].units[0].txt) && await ev(() => document.activeElement.dataset.st === 'title'), 'Name der Saisonkarte tippen: steht sofort am Titelblatt, das Feld behält den Fokus');
  await ev(() => { S.settings.seasons.winter.title = 'Winterkarte'; view.gseason = null; view.gdate = '2026-11-12'; save(); render(); }); await L.settle(p);
  // Varianten bleiben ein Baustein
  const sch = await rowOf('Wiener Schnitzel');
  L.ok(/vom Schwein.*20,90.*vom Kalb.*28,90/.test(sch) && (await L.order(p)).filter(n => n === 'Wiener Schnitzel').length === 1, 'Varianten (vom Schwein / vom Kalb) stehen in einem Baustein', sch);
  // auf dieser Karte ausblenden und wieder einblenden
  await p.click(await L.blockSel(p, 'Knoblauchbrot')); await p.click('#gsRail [data-gs="del"]'); await L.settle(p);
  L.ok(!(await L.order(p)).includes('Knoblauchbrot') && await ev(() => gsDoc().hide.length === 1 && S.menu.some(m => m.name === 'Knoblauchbrot' && !m.hidden)), 'Gericht „Ausblenden“: weg von dieser Karte, in der Speisekarte bleibt es');
  await ev(() => { save(); render(); }); await L.settle(p);
  L.ok(!(await L.order(p)).includes('Knoblauchbrot'), 'es kommt beim nächsten Abgleich nicht von selbst zurück');
  await L.pick(p, 'schlicht'); L.ok((await L.order(p)).includes('Knoblauchbrot'), 'andere Vorlagen sind davon nicht betroffen'); await L.pick(p, 'alpin');
  if(!(await ev(() => document.querySelector('#gsRail .gs-more').open))) await p.click('#gsRail .gs-more summary');
  await p.click('#gsRail [data-gs="unhide"]'); await L.settle(p);
  o = await L.order(p); const zt = o.slice(o.indexOf('# Zum Teilen') + 1, o.indexOf('# Suppen & Vorspeisen'));
  L.ok(zt.includes('Knoblauchbrot') && await ev(() => gsDoc().hide.length === 0), '„Einblenden“ holt es zurück in seinen Abschnitt', zt);
  // Stand überlebt Neuladen
  await L.idle(p); await p.reload(); await L.ready(p); await L.gk(p);
  o = await L.order(p);
  L.ok(await ev(() => gsState().cur) === 'alpin' && o.indexOf('Weißer') < o.indexOf('Elsässer') && /Gärtnerin.*16,20/.test(await rowOf('Gärtnerin')), 'nach dem Neuladen: Vorlage, Anordnung und Preise wie zuvor');
  errs.push(...p.errs); await L.done(b, errs);
})();
