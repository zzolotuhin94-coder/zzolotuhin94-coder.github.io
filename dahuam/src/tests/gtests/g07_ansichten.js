// Ansichten: Handy 390 (Blatt in voller Breite, Leiste unten), Tablet, Desktop; hell und dunkel; Team sieht nur an; Hilfe-Texte.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  // ---------- Handy ----------
  for(const dark of [false, true]){
    const {p} = await L.open(b, {...L.PHONE, dark}); const ev = (f, a) => p.evaluate(f, a);
    await L.gk(p); const T = dark ? 'Handy dunkel' : 'Handy hell';
    L.ok(await L.wide(p) <= 0, `${T}: nichts ragt seitlich hinaus`);
    const g = await ev(() => { const sh = document.querySelector('#gsCanvas .gs-sheet').getBoundingClientRect(); const dock = document.querySelector('.gs-dock'); const dr = dock.getBoundingClientRect(); const nav = [...document.querySelectorAll('nav')].find(n => getComputedStyle(n).position === 'fixed' && n !== dock).getBoundingClientRect();
      return {sheetW:Math.round(sh.width), ratio:+(sh.height / sh.width).toFixed(3), rail:getComputedStyle(document.querySelector('#gsRail')).display, dock:[...dock.querySelectorAll('button')].map(x => x.textContent.trim()), dockH:Math.min(...[...dock.querySelectorAll('button')].map(x => x.getBoundingClientRect().height)), dockBottom:Math.round(dr.bottom), navTop:Math.round(nav.top), s:+getComputedStyle(document.querySelector('#gsCanvas .gs-sheet')).getPropertyValue('--gs-s')}; });
    L.ok(g.sheetW >= 350 && Math.abs(g.ratio - 1.414) < .01 && Math.abs(g.s - g.sheetW / 794) < .002, `${T}: das Blatt steht in voller Breite, verkleinert im A4-Format`, g);
    L.ok(g.rail === 'none' && g.dock.join('|') === 'Vorlage|Effekte|Baustein|Tag' && g.dockH >= 44 && g.dockBottom <= g.navTop + 1, `${T}: Leiste unten mit Vorlage · Effekte · Baustein · Tag, über der Navigation, sonst nichts im Weg`, g.dock);
    // Vorlage wählen
    await p.click('.gs-dock [data-id="vorlage"]'); await p.waitForTimeout(150);
    L.ok(await ev(() => { const r = document.querySelector('#gsRail'); const rr = r.getBoundingClientRect(); return getComputedStyle(r).display === 'block' && r.querySelectorAll('[data-gs="look"]').length === 6 && !r.querySelector('[data-gs="fx"]') && rr.bottom <= document.querySelector('.gs-dock').getBoundingClientRect().top + 1 && rr.height < innerHeight * .6; }), `${T}: „Vorlage“ öffnet ein Blatt von unten, nur mit den sechs Vorlagen`);
    await p.click('#gsRail [data-gs="look"][data-id="kreide"]'); await L.settle(p);
    L.ok(await ev(() => gsState().cur === 'kreide' && /gs-bg-kreide/.test(document.querySelector('#gsCanvas .gs-page').className)), `${T}: ein Tipp, die Kreidetafel steht`);
    await p.click('.gs-dock [data-id="effekte"]'); await p.waitForTimeout(150); await p.click('#gsRail [data-gs="fx"][data-k="acc"][data-id="1"]'); await L.settle(p);
    L.ok(await ev(() => gsDoc().fx.acc === 1 && !!document.querySelector('#gsRail [data-gs="fx"]')), `${T}: „Effekte“ → Akzentfarbe gewechselt, das Blatt bleibt offen für den nächsten Effekt`);
    L.ok(await L.wide(p) <= 0 && await ev(() => [...document.querySelectorAll('#gsRail button, #gsRail label.tog')].every(n => { const r = n.getBoundingClientRect(); return r.height >= 32 && r.right <= innerWidth + 1; })), `${T}: Effekte passen in die Breite, alles gut zu treffen`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(120); L.ok(await ev(() => getComputedStyle(document.querySelector('#gsRail')).display === 'none'), `${T}: Esc schließt das Blatt von unten`); await p.click('.gs-dock [data-id="effekte"]'); await p.waitForTimeout(120);
    await p.click('#gsRail .gs-shx'); await p.waitForTimeout(120); L.ok(await ev(() => getComputedStyle(document.querySelector('#gsRail')).display === 'none'), `${T}: ✕ schließt das Blatt`);
    // Baustein antippen: Leiste am Baustein, Stift öffnet die Einstellungen
    const sel = await ev(() => { const n = document.querySelectorAll('#gsCanvas .gs-d')[1]; n.scrollIntoView({block:'center'}); return `#gsCanvas .gs-b[data-b="${n.dataset.b}"]`; }); await p.waitForTimeout(100); await p.tap(sel); await p.waitForTimeout(150);
    const f = await ev(() => { const fl = document.querySelector('#gsFloat'); const r = fl.getBoundingClientRect(); return {n:fl.querySelectorAll('button').length, min:Math.min(...[...fl.querySelectorAll('button')].map(x => Math.min(x.getBoundingClientRect().width, x.getBoundingClientRect().height))), in:r.left >= 0 && r.right <= innerWidth + 1, rail:getComputedStyle(document.querySelector('#gsRail')).display, pen:getComputedStyle(fl.querySelector('.gs-fe')).display}; });
    L.ok(f.n === 5 && f.min >= 44 && f.in && f.rail === 'none' && f.pen !== 'none', `${T}: Baustein antippen → Leiste mit Griff, hinauf, hinunter, bearbeiten, ausblenden (je 44 px), im Bild`, f);
    const o0 = await L.order(p); await p.tap('#gsFloat [data-gs="down"]'); await L.settle(p); L.ok((await L.order(p)).join() !== o0.join(), `${T}: „Hinunter“ verschiebt`);
    await p.tap('#gsFloat [data-gs="edit"]'); await p.waitForTimeout(150); L.ok(await ev(() => getComputedStyle(document.querySelector('#gsRail')).display === 'block' && /Gericht/.test(document.querySelector('#gsRail h2').textContent)), `${T}: Stift öffnet die Einstellungen des Bausteins`);
    await p.tap('#gsRail [data-gs="done"]'); await p.waitForTimeout(120);
    // Farben der Bedienung
    const col = await ev(() => { const c = s => getComputedStyle(document.querySelector(s)); return {dock:c('.gs-dock').backgroundColor, app:c('body').backgroundColor, page:c('#gsCanvas .gs-page').backgroundColor}; });
    const lum = c => { const m = c.match(/\d+/g).map(Number); return (.299 * m[0] + .587 * m[1] + .114 * m[2]) / 255; };
    L.ok(dark ? lum(col.dock) < .3 : lum(col.dock) > .8, `${T}: die Bedienung folgt dem ${dark ? 'dunklen' : 'hellen'} Design`, col);
    await p.screenshot({path:L.OUT + `/handy-${dark ? 'dunkel' : 'hell'}.png`});
    errs.push(...p.errs); await p.context().close();
  }
  // das Blatt selbst ist in hell und dunkel dasselbe (Druckbild)
  { const pg = []; for(const dark of [false, true]){ const {p} = await L.open(b, {vp:{width:1280, height:900}, dark}); await L.gk(p, 'alpin'); pg.push(await p.evaluate(() => { const n = document.querySelectorAll('#gsCanvas .gs-page')[1]; const cs = getComputedStyle(n); return [cs.backgroundColor, cs.color, getComputedStyle(n.querySelector('.gs-ds')).color, n.className].join('|'); })); errs.push(...p.errs); await p.context().close(); }
    L.ok(pg[0] === pg[1], 'das Blatt selbst sieht im dunklen Design genauso aus wie im hellen (es ist das Druckbild)', pg[0]); }
  // ---------- Tablet hoch und quer, Desktop ----------
  for(const [name, vp] of [['Tablet hoch 768', {width:768, height:1024}], ['Fenster 920', {width:920, height:800}], ['Tablet quer 1024', {width:1024, height:768}], ['Desktop 1440', {width:1440, height:900}]]){
    const {p} = await L.open(b, {vp, ctx:{hasTouch:vp.width < 1200}}); const ev = (f, a) => p.evaluate(f, a); await L.gk(p, 'alpin');
    const g = await ev(() => ({rail:getComputedStyle(document.querySelector('#gsRail')).display, dock:getComputedStyle(document.querySelector('.gs-dock')).display, sheetW:Math.round(document.querySelector('#gsCanvas .gs-sheet').getBoundingClientRect().width), railW:Math.round(document.querySelector('#gsRail').getBoundingClientRect().width)}));
    L.ok(await L.wide(p) <= 0 && g.sheetW >= (vp.width === 920 ? 280 : 380), `${name}: nichts ragt hinaus, das Blatt ist ${g.sheetW} px breit`, g);
    if(vp.width > 900){ L.ok(await ev(() => { const s = document.querySelector('.side'); return !s || getComputedStyle(s).display === 'none' || document.querySelector('#gsWrap').getBoundingClientRect().left >= s.getBoundingClientRect().right - 1; }), `${name}: nichts liegt über der Seitenleiste der App`);
      L.ok(g.rail === 'block' && g.dock === 'none' && g.railW >= 280, `${name}: Vorlage, Effekte, Bausteine und Tag stehen rechts neben dem Blatt`);
      await p.click('[data-act="gsZoom"][data-id="grid"]'); await L.settle(p); const n = await ev(() => { const t = [...document.querySelectorAll('#gsCanvas .gs-sheet')].map(s => Math.round(s.getBoundingClientRect().top)); return {perRow:t.filter(x => x === t[0]).length, focus:document.activeElement.tagName}; });
      L.ok(n.perRow >= 2, `${name}: „Übersicht“ zeigt mehrere Blätter nebeneinander`, n); await p.click('[data-act="gsZoom"][data-id="one"]'); await L.settle(p); }
    else L.ok(g.rail === 'none' && g.dock !== 'none', `${name}: Leiste unten wie am Handy`);
    await p.screenshot({path:L.OUT + `/${name.replace(/\s+/g, '-').toLowerCase()}.png`});
    errs.push(...p.errs); await p.context().close(); }
  // ---------- Team: nur ansehen ----------
  { const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a); await L.gk(p, 'alpin');
    await ev(() => { S.settings.currentUser = 'u_staff'; save(); render(); }); await L.settle(p);
    const snap = await ev(() => JSON.stringify(S.settings.karte));
    const r = await ev(() => ({looks:document.querySelectorAll('#gsRail [data-gs="look"]').length, fx:document.querySelectorAll('#gsRail [data-gs="fx"],#gsRail [data-gst]').length, undo:!!document.querySelector('[data-gs="undo"]'), date:!!document.querySelector('#gdate') && !document.querySelector('#gdate').disabled, sheets:document.querySelectorAll('#gsCanvas .gs-sheet').length, more:!!document.querySelector('#gsRail .gs-more'), note:!!document.querySelector('.ro-note')}));
    L.ok(r.looks === 0 && r.fx === 0 && !r.undo && !r.more && r.sheets > 0 && r.date, 'Team: sieht die Blätter und kann den Tag wählen, aber weder Vorlage noch Effekte noch Bausteine ändern', r);
    await p.click('#gsCanvas .gs-d'); await p.waitForTimeout(120); const a = await L.center(p, '#gsCanvas .gs-d'); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x, a.y + 120, {steps:5}); await p.mouse.up(); await p.keyboard.press('Control+z');
    L.ok(await ev(() => !document.querySelector('#gsFloat') && !document.querySelector('.gs-b.sel') && view.gs.sel === null) && await ev(() => JSON.stringify(S.settings.karte)) === snap, 'Team: Antippen, Ziehen und Tasten ändern nichts');
    const d = await L.dl(p, () => p.click('[data-pdf="printMenu"]')); L.ok(L.pdfPages(d.file) === r.sheets, 'Team: PDF speichern geht');
    errs.push(...p.errs); await p.context().close(); }
  // ---------- Hilfe ----------
  { const {p} = await L.open(b, {vp:{width:1280, height:900}}); const ev = (f, a) => p.evaluate(f, a); await L.gk(p, 'alpin');
    const h = await ev(() => { const f = sel => { const n = document.querySelector(sel); const e = HELP_SEL.find(([s]) => { try { return n.matches(s); } catch(x){ return false; } }); return e ? e[1] : null; }; return [f('#gsRail [data-gs="look"]'), f('#gsRail [data-gs="fx"]'), f('#gsRail label.tog'), f('#gsCanvas .gs-d')].map(k => k + ':' + (HELP[k] ? HELP[k].t || HELP[k][0] || 'x' : '')); });
    L.ok(h.map(x => x.split(':')[0]).join() === 'gstil,geffekt,geffekt,gbaustein' && h.every(x => x.split(':')[1]), '„Was ist das?“ erklärt Vorlage, Effekte und Baustein', h);
    L.ok(await ev(() => !/Stil/.test(document.querySelector('.page-h, header.page-h, #app').innerText.split('\n').slice(0, 4).join(' '))), 'kein Wort mehr vom früheren Stil-Schalter im Kopf der Seite');
    // Ruhetag-Hinweis bleibt
    await ev(() => { view.gdate = '2026-11-18'; render(); }); await L.settle(p); L.ok(await ev(() => /Ruhetag/.test((document.querySelector('#gsCanvas .g-closed') || {}).textContent || '')), 'Ruhetag: ein Hinweis über den Blättern, die Karte steht trotzdem');
    errs.push(...p.errs); await p.context().close(); }
  await L.done(b, errs);
})();
