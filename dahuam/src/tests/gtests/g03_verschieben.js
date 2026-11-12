// Verschieben: mit der Maus, am Griff mit dem Finger, mit Alt + Pfeiltasten; ganze Abschnitte; Spalten; Bausteine einfügen; Rückgängig (30 Schritte und mehr).
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  const {p} = await L.open(b, {vp:{width:1024, height:768}}); const ev = (f, a) => p.evaluate(f, a);
  await L.gk(p, 'alpin');
  const sec = async name => { const o = await L.order(p); const i = o.indexOf('# ' + name); let j = i + 1; while(j < o.length && !o[j].startsWith('#') && !o[j].startsWith('[')) j++; return o.slice(i + 1, j); };
  const into = async sel => { await p.evaluate(s => document.querySelector(s).scrollIntoView({block:'center'}), sel); await p.waitForTimeout(80); return L.center(p, sel); };
  // ---------- Maus: Gericht direkt ziehen ----------
  L.ok((await sec('Flammkuchen')).join('|') === 'Elsässer|Gärtnerin|Weißer|Schwammerl', 'Ausgangslage Flammkuchen: Elsässer, Gärtnerin, Weißer, Schwammerl');
  { const a = await into(await L.blockSel(p, 'Schwammerl')); const t = await L.center(p, await L.blockSel(p, 'Gärtnerin'));
    await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x, a.y - 12, {steps:3}); await p.mouse.move(t.x, t.top + t.h * .25, {steps:8}); await p.waitForTimeout(60);
    const mid = await ev(() => ({ghost:!!document.querySelector('.gs-ghost'), line:(() => { const l = document.querySelector('.gs-line'); return l && l.style.display !== 'none' ? l.getBoundingClientRect().top : null; })(), src:document.querySelectorAll('.gs-src').length}));
    L.ok(mid.ghost && mid.line != null && mid.src === 1 && Math.abs(mid.line - t.top) < 4, 'beim Ziehen: Namensschild am Zeiger, Einfügelinie genau an der Kante des Ziels', mid);
    await p.mouse.up(); await L.settle(p); }
  L.ok((await sec('Flammkuchen')).join('|') === 'Elsässer|Schwammerl|Gärtnerin|Weißer', 'mit der Maus gezogen: Schwammerl steht jetzt vor Gärtnerin', await sec('Flammkuchen'));
  L.ok(await ev(() => !document.querySelector('.gs-ghost') && !document.querySelector('.gs-line') && !document.body.classList.contains('gs-dragging')), 'nach dem Loslassen ist alles aufgeräumt');
  // schief geht nicht: der Baustein sitzt wieder im Raster, links bündig
  { const sh = await L.sheets(p); const u = sh.flatMap(s => s.units.map(x => ({...x, body:s.body}))).find(x => x.name === 'Schwammerl'); L.ok(Math.round(u.h) % 8 === 0 && Math.abs(u.left - u.body.left) < .6 && Math.round(u.top - u.body.top) % 8 === 0, 'der verschobene Baustein sitzt im Raster und bündig', [u.h, u.left, u.top - u.body.top]); }
  // Abbrechen: Ziehen ins Leere ändert nichts
  { const a = await into(await L.blockSel(p, 'Weißer')); const o0 = (await L.order(p)).join(); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x - 400, a.y - 20, {steps:5}); await p.mouse.up(); await p.waitForTimeout(150); L.ok((await L.order(p)).join() === o0, 'weit neben dem Blatt losgelassen: nichts ändert sich'); }
  // ---------- über zwei Spalten ----------
  { const a = await into(await L.blockSel(p, 'Garnelenpfandl')); const t = await L.center(p, await L.blockSel(p, 'Knoblauchbrot'));
    await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x + 10, a.y + 10, {steps:3}); await p.mouse.move(t.x, t.bottom - 2, {steps:8}); await p.mouse.up(); await L.settle(p);
    const z = await sec('Zum Teilen'); L.ok(z[z.length - 1] === 'Garnelenpfandl', 'in die zweite Spalte gezogen: Garnelenpfandl steht am Ende von „Zum Teilen“', z); }
  // ---------- Finger: antippen, dann am Griff ziehen ----------
  await p.click(await L.blockSel(p, 'Gulaschsuppe')); await p.waitForTimeout(120);
  L.ok(await ev(() => !!document.querySelector('#gsFloat .gs-grip') && getComputedStyle(document.querySelector('#gsFloat .gs-grip')).touchAction === 'none'), 'antippen: Leiste mit Griff erscheint (Griff fängt die Wischbewegung ab)');
  { const g = await L.center(p, '#gsFloat .gs-grip'); const t = await L.center(p, await L.blockSel(p, 'Tomatensuppe'));
    await ev(([g, t]) => { const f = (type, x, y, el) => (el || document).dispatchEvent(new PointerEvent(type, {bubbles:true, cancelable:true, pointerType:'touch', pointerId:7, isPrimary:true, clientX:x, clientY:y, button:0, buttons:type === 'pointerup' ? 0 : 1}));
      f('pointerdown', g.x, g.y, document.querySelector('#gsFloat .gs-grip')); for(let i = 1; i <= 8; i++) f('pointermove', g.x + (t.x - g.x) * i / 8, g.y + (t.bottom - 3 - g.y) * i / 8); f('pointerup', t.x, t.bottom - 3); }, [g, t]); await L.settle(p);
    const s = await sec('Suppen & Vorspeisen'); L.ok(s.indexOf('Gulaschsuppe') === s.indexOf('Tomatensuppe') + 1, 'am Griff mit dem Finger gezogen: Gulaschsuppe steht hinter Tomatensuppe', s.slice(0, 3)); }
  // ---------- Tastatur ----------
  { const sel = await L.blockSel(p, 'Bauernrösti'); await ev(s => document.querySelector(s).focus(), sel);
    L.ok(await ev(s => { const n = document.querySelector(s); return n.getAttribute('role') === 'button' && /Gericht: Bauernrösti/.test(n.getAttribute('aria-label')) && document.querySelectorAll('#gsCanvas .gs-b[tabindex="0"]').length === 1; }, sel), 'Bausteine sind mit der Tastatur erreichbar und benannt, genau einer liegt in der Tab-Reihenfolge');
    await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    L.ok(await ev(() => { const b = gsBlock(); return b && gsAll().get(b.key).vars[0].name === 'Bauernrösti'; }), 'Enter wählt den Baustein');
    await p.keyboard.press('Alt+ArrowDown'); await p.waitForTimeout(250);
    L.ok((await sec('Rösti')).join('|') === 'Schwammerlrösti|Bauernrösti|Dolce-Vita-Rösti', 'Alt + Pfeil hinunter verschiebt um einen Platz', await sec('Rösti'));
    L.ok(await ev(() => { const n = document.activeElement; return n && n.classList.contains('sel') && /Bauernrösti/.test(n.textContent); }), 'der Fokus bleibt am verschobenen Baustein');
    await p.keyboard.press('Alt+ArrowUp'); await p.waitForTimeout(250);
    L.ok((await sec('Rösti')).join('|') === 'Bauernrösti|Schwammerlrösti|Dolce-Vita-Rösti', 'Alt + Pfeil hinauf bringt ihn zurück');
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(120);
    L.ok(await ev(() => /Schwammerlrösti/.test(document.activeElement.textContent) && document.activeElement.classList.contains('sel')), 'Pfeil hinunter (ohne Alt) wandert zum nächsten Baustein');
    await p.keyboard.press('Escape'); await p.waitForTimeout(100); L.ok(await ev(() => view.gs.sel === null && !document.querySelector('#gsFloat')), 'Esc hebt die Auswahl auf'); }
  // ---------- ganzer Abschnitt ----------
  { const sel = await L.blockSel(p, 'Rösti'); await p.click(sel); await p.waitForTimeout(120); const o0 = await L.order(p);
    L.ok(await ev(() => /Überschrift/.test(document.querySelector('#gsRail h2').textContent)), 'Überschrift antippen: rechts stehen ihre Einstellungen');
    await p.click('#gsRail [data-gs="up"]'); await L.settle(p); const o = await L.order(p); const heads = o.filter(x => x.startsWith('#'));
    L.ok(heads.indexOf('# Rösti') === heads.indexOf('# Salate & Bowls') - 1 && (await sec('Rösti')).length === 3 && (await sec('Salate & Bowls')).length === (o0.indexOf('# Rösti') - o0.indexOf('# Salate & Bowls') - 1), 'Überschrift „Hinauf“: der ganze Abschnitt Rösti wandert vor Salate & Bowls, seine Gerichte gehen mit', heads.slice(2, 6));
    // Abschnitt mit der Maus zwischen Gerichte eines anderen ziehen: er rastet an der Abschnittsgrenze ein
    const a = await into(await L.blockSel(p, 'Rösti')); const t = await L.center(p, await L.blockSel(p, 'Caesar Salat'));
    await p.mouse.move(a.x - 100, a.y); await p.mouse.down(); await p.mouse.move(a.x - 100, a.y + 12, {steps:3}); await p.mouse.move(t.x, t.bottom - 2, {steps:8});
    L.ok(await ev(() => /\+ 3/.test(document.querySelector('.gs-ghost').textContent)), 'beim Ziehen einer Überschrift zeigt das Schild, dass drei Gerichte mitgehen');
    await p.mouse.up(); await L.settle(p); const h2 = (await L.order(p)).filter(x => x.startsWith('#'));
    L.ok(h2.indexOf('# Rösti') === h2.indexOf('# Salate & Bowls') + 1 && (await sec('Salate & Bowls')).length >= 4, 'mitten in einen anderen Abschnitt gezogen: Rösti landet dahinter, kein Abschnitt wird zerrissen', h2.slice(2, 6)); }
  // ---------- Spalten ----------
  { await p.click(await L.blockSel(p, 'Rösti')); await p.waitForTimeout(100);
    const cols = () => ev(() => { const n = [...document.querySelectorAll('#gsCanvas .gs-d')].find(x => /Bauernrösti/.test(x.textContent)); return n.parentElement.classList.contains('gs-col') ? 2 : 1; });
    L.ok(await cols() === 1, 'Rösti: eine Spalte');
    await p.click('#gsRail [data-gs="bset"][data-k="cols"][data-id="2"]'); await L.settle(p);
    const r = await ev(() => { const c = [...document.querySelectorAll('#gsCanvas .gs-cols')].find(x => /Bauernrösti/.test(x.textContent)); return [...c.children].map(k => k.children.length); });
    L.ok(await cols() === 2 && r.join() === '2,1', '„Zwei Spalten“: die Gerichte verteilen sich von selbst (2 + 1)', r);
    await p.click('#gsRail [data-gs="bset"][data-k="cols"][data-id="1"]'); await L.settle(p); L.ok(await cols() === 1, '„Eine Spalte“ stellt zurück'); }
  // ---------- Bausteine einfügen ----------
  { await p.click('#gsRail [data-gs="done"]'); await p.waitForTimeout(100); await p.click(await L.blockSel(p, 'Weißer')); await p.waitForTimeout(100); await p.click('#gsRail [data-gs="done"]');
    await ev(() => { view.gs.sel = gsDoc().blocks.find(b => b.t === 'head' && b.sec === 'Flammkuchen').id; gsRefresh(); gsSelect(null); });
    const n0 = (await L.sheets(p)).length;
    for(const [t, l] of [['text', 'Text'], ['orn', 'Trenner'], ['photo', 'Foto'], ['space', 'Leerraum'], ['head', 'Überschrift'], ['break', 'Seitenumbruch']]){
      await ev(() => { gsSelect(gsDoc().blocks.find(b => b.t === 'dish' && gsAll().get(b.key).vars[0].name === 'Dolce-Vita-Rösti').id); }); await p.waitForTimeout(80); await p.click('#gsRail [data-gs="done"]'); await ev(() => { view.gs.sel = gsDoc().blocks.find(b => b.t === 'dish' && gsAll().get(b.key).vars[0].name === 'Dolce-Vita-Rösti').id; document.querySelector('#gsRail').innerHTML = gsSecAdd(); });
      await p.click(`#gsRail [data-gs="add"][data-id="${t}"]`); await L.settle(p);
      const o = await L.order(p); const at = o.indexOf('Dolce-Vita-Rösti') + 1;
      L.ok(o[at] === (t === 'head' ? '# Überschrift' : `[${t}]`) && await ev(t => gsBlock() && gsBlock().t === t, t), `„${l}“ einfügen: landet direkt unter dem gewählten Baustein und ist gewählt`, o.slice(at - 1, at + 2));
      if(t === 'text'){ await p.fill('#gsRail [data-gsf="txt"]', 'Servus und guten Appetit'); await p.waitForTimeout(400); L.ok((await L.sheets(p)).flatMap(s => s.units).some(u => u.k === 'text' && u.txt === 'Servus und guten Appetit'), 'Text tippen: steht sofort im Blatt, das Feld behält den Fokus', await ev(() => document.activeElement.dataset.gsf)); }
      if(t === 'photo'){ L.ok(await ev(() => { const n = document.querySelector('#gsCanvas .gs-f.sel .gs-im'); return /gaststube\.webp/.test(n.style.backgroundImage) && Math.round(parseFloat(document.querySelector('#gsCanvas .gs-f.sel').style.height)) % 8 === 0; }), 'Foto: hauseigenes Bild (Gaststube), Höhe im Raster');
        await p.click('#gsRail [data-gs="bset"][data-k="size"][data-id="l"]'); await L.settle(p); L.ok(await ev(() => document.querySelector('#gsCanvas .gs-f.sel').classList.contains('s-l')), 'Foto „Groß“'); }
      if(t === 'break'){ const sh = await L.sheets(p); L.ok(sh.length > n0 && sh.some(s => s.units.some(u => u.k === 'break')), 'Seitenumbruch: danach beginnt ein neues Blatt, im Blatt steht die Marke', [n0, sh.length]); }
      await ev(() => { gsSelect(null); });
    }
    // entfernen
    await ev(() => { gsSelect(gsDoc().blocks.find(b => b.t === 'space').id); }); await p.waitForTimeout(80); await p.click('#gsFloat [data-gs="del"]'); await L.settle(p);
    L.ok(!(await L.order(p)).includes('[space]') && /Leerraum entfernt/.test(await ev(() => document.querySelector('#toast').textContent)), '✕ an der Leiste entfernt den Baustein, die Zeile unten bietet „Rückgängig“ an');
    await p.click('#toast button'); await L.settle(p); L.ok((await L.order(p)).includes('[space]'), '„Rückgängig“ in der Zeile holt ihn zurück');
    L.ok(await ev(() => { gsSelect(gsDoc().blocks.find(b => b.t === 'legend').id); return !document.querySelector('#gsFloat [data-gs="del"]') && !document.querySelector('#gsRail [data-gs="del"]'); }), 'Allergene & Hinweise lassen sich nicht entfernen'); await ev(() => gsSelect(null)); }
  // ---------- Rückgängig / Wiederholen: 34 Schritte ----------
  { await ev(() => { view.gs.undo = []; view.gs.redo = []; gsFit(); }); const snap0 = await ev(() => JSON.stringify(S.settings.karte));
    L.ok(await ev(() => document.querySelector('[data-gs="undo"]').disabled && document.querySelector('[data-gs="redo"]').disabled), 'ohne Änderung sind Rückgängig und Wiederholen grau');
    const snaps = [];
    for(let i = 0; i < 34; i++){ await ev(i => { const names = ['Elsässer', 'Gärtnerin', 'Weißer', 'Schwammerl']; gsSelect(gsDoc().blocks.find(b => b.t === 'dish' && gsAll().get(b.key).vars[0].name === names[i % 4]).id); gsNudge(i % 3 ? 1 : -1); }, i); snaps.push(await ev(() => JSON.stringify(S.settings.karte))); }
    const made = await ev(() => view.gs.undo.length);
    L.ok(made >= 30, `${made} Änderungen liegen auf dem Stapel`, made);
    await ev(() => gsSelect(null)); let okU = true;
    for(let i = made - 1; i >= 0; i--){ await p.keyboard.press('Control+z'); const now = await ev(() => JSON.stringify(S.settings.karte)); const want = i === 0 ? snap0 : null; if(want && now !== want) okU = false; }
    L.ok(okU && await ev(() => JSON.stringify(S.settings.karte)) === snap0 && await ev(() => view.gs.undo.length) === 0, `${made}-mal Strg + Z: genau der Stand vom Anfang`);
    for(let i = 0; i < made; i++) await p.keyboard.press('Control+y');
    L.ok(await ev(() => JSON.stringify(S.settings.karte)) === snaps[snaps.length - 1], `${made}-mal Strg + Y: wieder der letzte Stand`);
    await p.click('[data-gs="undo"]'); await p.waitForTimeout(150); L.ok(await ev(() => JSON.stringify(S.settings.karte)) === (snaps.filter((s, i) => i === 0 || s !== snaps[i - 1]).slice(-2)[0]), 'der Knopf „Rückgängig“ nimmt einen Schritt zurück');
    await p.click('[data-gs="redo"]'); await p.waitForTimeout(150);
    // im Textfeld gehört Strg + Z dem Feld
    await ev(() => gsSelect(gsDoc().blocks.find(b => b.t === 'text').id)); await p.waitForTimeout(80); const u0 = await ev(() => view.gs.undo.length); await p.focus('#gsRail [data-gsf="txt"]'); await p.keyboard.press('Control+z'); L.ok(await ev(() => view.gs.undo.length) === u0, 'im Textfeld bleibt Strg + Z beim Feld');
    await p.fill('#gsRail [data-gsf="txt"]', 'A'); await p.type('#gsRail [data-gsf="txt"]', 'BCDEF'); await p.waitForTimeout(350); L.ok(await ev(() => view.gs.undo.length) === u0 + 1, 'Tippen in einem Feld ist ein einziger Schritt');
  }
  await L.idle(p);
  errs.push(...p.errs); await L.done(b, errs);
})();
