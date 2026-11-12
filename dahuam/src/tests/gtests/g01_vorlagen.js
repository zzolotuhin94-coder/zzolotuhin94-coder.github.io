// Vorlagen: jede baut aus der laufenden Speisekarte fertige A4-Blätter; alles sitzt im Raster, nichts läuft über, kein Gericht ist geteilt.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  const {p} = await L.open(b, {vp:{width:1024, height:768}}); const ev = (f, a) => p.evaluate(f, a);
  await L.gk(p);
  L.ok(await ev(() => gsState().cur) === 'haus', 'frische Beispieldaten: die Hauskarte ist als Vorlage gewählt');
  L.ok(await ev(() => !document.querySelector('[data-act="gStyle"]') && document.querySelectorAll('#gsRail [data-gs="look"]').length === 6), 'kein Stil-Schalter mehr: ein Modus mit sechs Vorlagen');
  L.ok((await ev(() => [...document.querySelectorAll('#gsRail [data-gs="look"] .gs-vn')].map(n => n.textContent))).join('|') === 'Hauskarte|Alpin|Elegant|Kreidetafel|Getränkekarte|Schlicht', 'Hauskarte, Alpin, Elegant, Kreidetafel, Getränkekarte, Schlicht');
  const live = await ev(() => { const k = curSeasonKey(), d = view.gdate; const it = guestItems(k, d); return {food:[...new Set(it.filter(m => !isDrinkEntry(m)).map(m => m.name))], drinks:[...new Set(it.filter(isDrinkEntry).map(m => m.name))], tafel:[...new Set(it.filter(m => m.top || (m.seasons && m.seasons.length)).map(m => m.name))], off:S.menu.filter(m => !it.includes(m)).map(m => m.name)}; });
  L.ok(live.food.length > 40 && live.drinks.length >= 9 && live.off.length > 5, 'Ausgangslage: Speisen, Getränke und Gerichte außerhalb der Saison', [live.food.length, live.drinks.length, live.off.length]);
  const pagesOf = {};
  for(const k of L.LOOKS){
    await L.pick(p, k); const sh = await L.sheets(p); pagesOf[k] = sh.length;
    const names = sh.flatMap(s => s.units.flatMap(u => u.k === 'dish' ? [u.name] : []));
    const txt = sh.map(s => s.units.map(u => u.txt).join(' ')).join(' ');
    const want = k === 'getraenke' ? live.drinks : k === 'kreide' ? live.tafel : live.food.concat(live.drinks);
    const miss = want.filter(n => !txt.includes(n)), extra = (k === 'getraenke' ? live.food : k === 'kreide' ? live.food.filter(n => !live.tafel.includes(n)) : []).filter(n => names.includes(n));
    L.ok(sh.length >= 1 && miss.length === 0 && extra.length === 0, `${k}: ${sh.length} Blätter, alle Gerichte der Karte dieses Tages stehen darauf${k === 'getraenke' ? ' (nur Getränke)' : k === 'kreide' ? ' (nur Empfehlungen und Saisonales)' : ''}`, {miss, extra});
    L.ok(!live.off.some(n => names.includes(n) && !want.includes(n)), `${k}: nichts, was an diesem Tag nicht gilt`);
    // Raster und Umbruch
    const bad = [], split = [], off = [];
    sh.forEach((s, i) => { if(s.cover) return; s.units.forEach(u => { if(u.k === 'break') return; if(u.h && Math.round(u.h) % 8 !== 0) bad.push([i, u.name, u.h]); if(u.bottom > s.body.bottom + 1 || u.top < s.body.top - 1) split.push([i, u.name, Math.round(u.bottom), Math.round(s.body.bottom)]); if(u.left < s.body.left - 1 || u.right > s.body.right + 1) off.push([i, u.name]); }); });
    L.ok(bad.length === 0, `${k}: jeder Baustein hat eine Höhe im 8-px-Raster`, bad.slice(0, 3));
    L.ok(split.length === 0 && off.length === 0, `${k}: nichts läuft über den Satzspiegel, kein Gericht ist geteilt`, split.slice(0, 3).concat(off.slice(0, 3)));
    // Überschrift nie allein am Blattende
    const lone = sh.filter(s => !s.cover && s.units.length && s.units[s.units.length - 1].k === 'head').length;
    L.ok(lone === 0, `${k}: keine Überschrift allein am Ende eines Blatts`);
    // zwei Spalten: gleiche Oberkante, Zeilen stehen untereinander ohne Überlappung
    const ov = await ev(() => { let n = 0; document.querySelectorAll('#gsCanvas .gs-col').forEach(c => { const ch = [...c.children]; for(let i = 1; i < ch.length; i++) if(ch[i].getBoundingClientRect().top < ch[i - 1].getBoundingClientRect().bottom - .5) n++; }); document.querySelectorAll('#gsCanvas .gs-cols').forEach(c => { const [a, b2] = c.children; if(a.firstElementChild && b2.firstElementChild && Math.abs(a.firstElementChild.getBoundingClientRect().top - b2.firstElementChild.getBoundingClientRect().top) > .5) n++; }); return n; });
    L.ok(ov === 0, `${k}: Spalten beginnen auf gleicher Höhe, nichts überlappt`);
    const tx = await ev(() => [...document.querySelectorAll('#gsCanvas .gs-page *')].filter(n => { const t = getComputedStyle(n).textTransform; return t && t !== 'none'; }).length);
    L.ok(tx === 0, `${k}: keine Großschreibung per CSS (PDF-sicher, auch mit ß)`);
    await p.screenshot({path:L.OUT + `/vorlage-${k}.png`});
  }
  L.ok(pagesOf.haus >= 4 && pagesOf.elegant > pagesOf.alpin && pagesOf.getraenke <= 3 && pagesOf.kreide <= 4, 'Umfang passt zur Vorlage: Elegant braucht am meisten Blätter, Getränkekarte und Kreidetafel sind kurz', pagesOf);
  // Titelblatt und Kopf
  await L.pick(p, 'alpin'); let sh = await L.sheets(p);
  L.ok(sh[0].cover && /Herbstkarte/.test(sh[0].units[0].txt) && /2026/.test(sh[0].units[0].txt) && /Bauch nicht einziehen/.test(sh[0].units[0].txt), 'Alpin: eigenes Titelblatt mit Saisontitel, Jahr und Leitspruch');
  await L.pick(p, 'getraenke'); sh = await L.sheets(p);
  L.ok(!sh[0].cover && sh[0].units[0].k === 'title' && /^Getränkekarte/i.test(sh[0].units[0].txt), 'Getränkekarte: Kopf „Getränkekarte“ statt Titelblatt', sh[0].units[0].txt.slice(0, 40));
  L.ok(sh.flatMap(s => s.units).filter(u => u.k === 'head').map(u => u.name.toLowerCase()).join('|') === 'aperitif & cocktails|bier|wein|kaffee & tee|alkoholfrei', 'Getränkekarte: nach Art gegliedert (Aperitif, Bier, Wein, Kaffee, Alkoholfrei)', sh.flatMap(s => s.units).filter(u => u.k === 'head').map(u => u.name));
  // Getränke: Menge steht vor dem Preis
  const vol = await ev(() => [...document.querySelectorAll('#gsCanvas .gs-d.dr .gs-p')].map(n => n.innerHTML.replace(/<small>(.*?)<\/small>/, '$1|')));
  L.ok(vol.length >= 10 && vol.every(v => /^0,\d+ l\|\d+,\d\d$/.test(v)) && vol.includes('0,3 l|4,20') && vol.includes('0,75 l|29,00'), 'Getränke: bei jedem Preis steht die Menge davor (0,3 l 4,20 · 0,75 l 29,00)', vol.slice(0, 4));
  // keine Getränke an diesem Tag: ein Hinweis im Blatt (nur in der Vorschau, nicht im PDF)
  await ev(() => { S.menu.filter(isDrinkEntry).forEach(m => { m.hidden = true; }); render(); }); await L.settle(p); sh = await L.sheets(p);
  L.ok(sh.length === 1 && /In dieser Vorlage steht für diesen Tag noch nichts/.test(sh[0].units.map(u => u.txt).join(' ')) && await ev(() => !/noch nichts/.test(gsPages({print:true}).join(''))), 'Getränkekarte ohne Getränke: ein Satz sagt, was los ist; im PDF steht er nicht');
  await ev(() => { S.menu.filter(isDrinkEntry).forEach(m => { m.hidden = false; }); save(); render(); }); await L.settle(p);
  // jede Vorlage hat ihr eigenes Blatt-Set und merkt es sich
  const mem = await ev(() => Object.keys(gsState().docs).sort().join());
  L.ok(mem === 'alpin,elegant,getraenke,haus,kreide,schlicht', 'jede Vorlage hat ihr eigenes Blatt-Set', mem);
  // in unter einer Minute zum PDF: Vorlage wählen → PDF
  const t0 = Date.now(); await L.pick(p, 'elegant'); const d = await L.dl(p, () => p.click('[data-pdf="printMenu"]')); const ms = Date.now() - t0;
  L.ok(L.pdfPages(d.file) === pagesOf.elegant && ms < 60000, `Vorlage wählen → „Als PDF speichern“: fertig in ${ms} ms, ${L.pdfPages(d.file)} Seiten`, d.name);
  L.ok(await L.wide(p) <= 0, 'Tablet 1024: nichts ragt seitlich hinaus');
  errs.push(...p.errs); await L.done(b, errs);
})();
